import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  commitServerWrites,
  fromFirestoreFields,
  getCallerRole,
  getServerDocumentName,
  listUserTimeDocuments,
  readServerDoc,
  toFirestoreFields,
  type FireDocument,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "start" | "stop" | "complete";
type TaskStatus = "assigned" | "accepted" | "in_progress" | "paused" | "completed";
type Progress = {
  userId: string;
  userName: string;
  userEmail?: string;
  status: TaskStatus;
  totalSeconds?: number;
  totalMinutes?: number;
  totalHours?: number;
  sessionCount?: number;
  acceptedAt?: unknown;
  firstStartedAt?: unknown;
  lastStartedAt?: unknown;
  pausedAt?: unknown;
  completedAt?: unknown;
  latestNarration?: string;
};

const headers = { "Cache-Control": "no-store" };

function assignmentStatus(progress: Progress[]): TaskStatus {
  if (progress.length === 0) return "assigned";
  if (progress.every((entry) => entry.status === "completed")) return "completed";
  if (progress.some((entry) => entry.status === "in_progress")) return "in_progress";
  if (progress.some((entry) => entry.status === "paused")) return "paused";
  if (progress.some((entry) => entry.status === "accepted")) return "accepted";
  return "assigned";
}

function normalizeEmployees(assignedUsers: unknown): Array<{ uid: string; name: string; email: string }> {
  if (!Array.isArray(assignedUsers)) return [];

  return assignedUsers.flatMap((entry) => {
    if (typeof entry === "string") return [{ uid: entry, name: "Employee", email: "" }];
    if (!entry || typeof entry !== "object" || !("uid" in entry) || typeof entry.uid !== "string") return [];
    return [{
      uid: entry.uid,
      name: "name" in entry && typeof entry.name === "string" ? entry.name : "Employee",
      email: "email" in entry && typeof entry.email === "string" ? entry.email : "",
    }];
  });
}

function normalizeProgress(
  raw: unknown,
  employees: Array<{ uid: string; name: string; email: string }>,
): Progress[] {
  const stored = Array.isArray(raw) ? raw : [];

  return employees.map((employee) => {
    const saved = stored.find((entry) =>
      entry && typeof entry === "object" &&
      "userId" in entry && entry.userId === employee.uid,
    ) as Partial<Progress> | undefined;

    return {
      userId: employee.uid,
      userName: employee.name,
      userEmail: employee.email,
      status: saved?.status || "assigned",
      totalSeconds: saved?.totalSeconds,
      totalMinutes: Number(saved?.totalMinutes || 0),
      totalHours: Number(saved?.totalHours || 0),
      sessionCount: Number(saved?.sessionCount || 0),
      ...saved,
    };
  });
}

function updateFields(
  collection: string,
  id: string,
  fields: Record<string, unknown>,
  updateTime?: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    update: {
      name: getServerDocumentName(collection, id),
      fields: toFirestoreFields(fields),
    },
    updateMask: { fieldPaths: Object.keys(fields) },
  };
  if (updateTime) result.currentDocument = { updateTime };
  return result;
}

function createFields(
  collection: string,
  id: string,
  fields: Record<string, unknown>,
): Record<string, unknown> {
  return {
    update: {
      name: getServerDocumentName(collection, id),
      fields: toFirestoreFields(fields),
    },
    currentDocument: { exists: false },
  };
}

function minutes(seconds: number): number {
  return Number((seconds / 60).toFixed(4));
}
function hours(seconds: number): number {
  return Number((seconds / 3600).toFixed(6));
}

function sessionIdFromDoc(doc: FireDocument): string {
  return doc.name.split("/").pop() || "";
}

function isActiveSession(doc: FireDocument): boolean {
  return fromFirestoreFields(doc.fields).status === "active";
}

function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return errorJson("Your session is invalid or has no active employee profile.", 401);
    if (!["employee", "manager", "super_admin"].includes(caller.role)) {
      return errorJson("You cannot record work against assignments.", 403);
    }

    if (Number(request.headers.get("content-length") || 0) > 8192) {
      return errorJson("Request exceeds allowed size.", 413);
    }

    const payload = (await request.json()) as {
      action?: unknown;
      assignmentId?: unknown;
      narration?: unknown;
    };
    const action = payload.action;
    const id = typeof payload.assignmentId === "string" ? payload.assignmentId.trim() : "";
    const narration = typeof payload.narration === "string" ? payload.narration.trim() : "";

    if (action !== "start" && action !== "stop" && action !== "complete") {
      return errorJson("Invalid work action.", 400);
    }
    if (!id || id.length > 300 || id.includes("/")) return errorJson("Invalid assignment ID.", 400);
    if ((action === "stop" || action === "complete") && (narration.length < 5 || narration.length > 3000)) {
      return errorJson("Enter a short work narration (5–3000 characters).", 400);
    }

    const [document, profile, lock] = await Promise.all([
      readServerDoc("assignments", id),
      readServerDoc("users", caller.uid),
      readServerDoc("activeWorkSessions", caller.uid),
    ]);

    if (!document || !profile) return errorJson("Assignment or employee profile not found.", 404);
    const assignment = fromFirestoreFields(document.fields);
    const employee = fromFirestoreFields(profile.fields);
    const assignedUsers = normalizeEmployees(assignment.assignedUsers);
    if (!assignedUsers.some((entry) => entry.uid === caller.uid)) {
      return errorJson("This assignment has not been allocated to you.", 403);
    }

    const list = normalizeProgress(assignment.employeeProgress, assignedUsers);
    const position = list.findIndex((entry) => entry.userId === caller.uid);
    if (position < 0) return errorJson("Employee progress is missing.", 403);
    const previous = list[position];

    const now = new Date();
    const userName = typeof employee.name === "string" ? employee.name : "Employee";
    const userEmail = typeof employee.email === "string" ? employee.email : "";
    const currentSeconds = Math.max(
      0,
      Math.round(
        Number(previous.totalSeconds ?? Number(previous.totalMinutes || 0) * 60),
      ),
    );

    const writes: Record<string, unknown>[] = [];
    let nextStatus: TaskStatus;
    let responseSessionId: string | undefined;

    if (action === "start") {
      if (previous.status === "completed") return errorJson("This task is already marked completed.", 409);
      if (lock) return errorJson("You already have a running work timer. Stop it before switching tasks.", 409);

      // Legacy sessions may pre-date the activeWorkSessions lock.
      const historicalSessions = await listUserTimeDocuments(caller.uid);
      if (historicalSessions.some(isActiveSession)) {
        return errorJson("A previous work timer is still active. Stop that session before starting another.", 409);
      }

      const sessionId = randomUUID();
      responseSessionId = sessionId;
      const sessionCount = Number(previous.sessionCount || 0) + 1;

      const indiaDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);

      writes.push(createFields("timesheets", sessionId, {
        userId: caller.uid,
        userName,
        workType: "assignment",
        assignmentId: id,
        assignmentName: assignment.title || "Assignment",
        clientId: assignment.clientId || "",
        clientName: assignment.clientName || "",
        date: indiaDate,
        checkIn: now.toISOString(),
        startTime: now.toISOString(),
        serverStartedAt: now,
        locationType: "office",
        billingStatus: "unbilled",
        status: "active",
        actionType: previous.sessionCount ? "resume" : "start",
        sessionNumber: sessionCount,
        createdAt: now,
        updatedAt: now,
      }));

      writes.push(createFields("activeWorkSessions", caller.uid, {
        userId: caller.uid,
        assignmentId: id,
        sessionId,
        startedAt: now,
      }));

      nextStatus = "in_progress";
      list[position] = {
        ...previous,
        userName,
        userEmail,
        status: nextStatus,
        firstStartedAt: previous.firstStartedAt || now,
        lastStartedAt: now,
        sessionCount,
      };
    } else {
      let activeDoc: FireDocument | null = null;
      let sessionId = "";

      if (lock) {
        const lockData = fromFirestoreFields(lock.fields);
        if (lockData.assignmentId !== id) {
          return errorJson("A different assignment has an active timer. Stop it first.", 409);
        }
        sessionId = typeof lockData.sessionId === "string" ? lockData.sessionId : "";
        activeDoc = sessionId ? await readServerDoc("timesheets", sessionId) : null;
      } else {
        const historicalSessions = await listUserTimeDocuments(caller.uid);
        activeDoc = historicalSessions.find((item) =>
          isActiveSession(item) &&
          fromFirestoreFields(item.fields).assignmentId === id,
        ) || null;
        if (activeDoc) sessionId = sessionIdFromDoc(activeDoc);
      }

      const active = activeDoc ? fromFirestoreFields(activeDoc.fields) : null;
      if (!active && action === "stop") return errorJson("No active timer exists for this task.", 409);

      let durationSeconds = 0;
      if (activeDoc && active) {
        if (active.userId !== caller.uid || active.assignmentId !== id || active.status !== "active") {
          return errorJson("Active work session is inconsistent. Refresh and contact the administrator.", 409);
        }

        const start = typeof active.serverStartedAt === "string"
          ? active.serverStartedAt
          : typeof active.startTime === "string"
            ? active.startTime
            : active.checkIn;

        const startMillis = Date.parse(String(start || ""));
        if (!Number.isFinite(startMillis) || startMillis > now.getTime()) {
          return errorJson("Work timer has an invalid start time. Contact the administrator.", 409);
        }
        durationSeconds = Math.max(0, Math.floor((now.getTime() - startMillis) / 1000));
        responseSessionId = sessionId;

        writes.push(updateFields("timesheets", sessionId, {
          checkOut: now.toISOString(),
          endTime: now.toISOString(),
          serverStoppedAt: now,
          totalSeconds: durationSeconds,
          totalMinutes: minutes(durationSeconds),
          totalHours: hours(durationSeconds),
          status: action === "stop" ? "paused" : "completed",
          actionType: action === "stop" ? "pause" : "end",
          narration,
          workDescription: narration,
          remarks: narration,
          ...(action === "stop" ? { pauseReason: narration } : { completionRemarks: narration }),
          updatedAt: now,
        }, activeDoc.updateTime));

        if (lock) {
          writes.push({
            delete: getServerDocumentName("activeWorkSessions", caller.uid),
            currentDocument: lock.updateTime
              ? { updateTime: lock.updateTime }
              : { exists: true },
          });
        }
      } else if (action === "complete" && !Number(previous.sessionCount || 0)) {
        return errorJson("Record at least one work session before marking the task completed.", 409);
      }

      const totalSeconds = currentSeconds + durationSeconds;
      nextStatus = action === "stop" ? "paused" : "completed";
      list[position] = {
        ...previous,
        userName,
        userEmail,
        status: nextStatus,
        totalSeconds,
        totalMinutes: minutes(totalSeconds),
        totalHours: hours(totalSeconds),
        latestNarration: narration,
        ...(action === "stop" ? { pausedAt: now } : { completedAt: now }),
      };
    }

    const overallStatus = assignmentStatus(list);
    writes.push(updateFields("assignments", id, {
      employeeProgress: list,
      status: overallStatus,
      updatedAt: now,
      ...(overallStatus === "completed" ? { completedAt: now } : {}),
    }, document.updateTime));

    const eventId = randomUUID();
    writes.push(createFields("workSessionEvents", eventId, {
      action,
      userId: caller.uid,
      userName,
      assignmentId: id,
      assignmentName: assignment.title || "Assignment",
      sessionId: responseSessionId || "",
      narration: action === "start" ? "" : narration,
      createdAt: now,
    }));

    await commitServerWrites(writes);

    return NextResponse.json(
      { assignmentStatus: overallStatus, employeeStatus: nextStatus, sessionId: responseSessionId || null },
      { status: 200, headers },
    );
  } catch (error) {
    console.error("Audited work-session action failed:", error);
    const message = error instanceof Error ? error.message : "";
    const configured = /not configured|credentials|service account|different project/i.test(message);
    const conflict = /work record changed/i.test(message);

    return errorJson(
      configured ? "Server work tracking is not configured. Contact the firm administrator."
        : conflict ? message
          : "Unable to record work. No partial timesheet was saved. Refresh and try again.",
      configured ? 503 : conflict ? 409 : 500,
    );
  }
}
