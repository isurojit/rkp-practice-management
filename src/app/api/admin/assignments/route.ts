import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { checklistTemplates } from "@/constants/checklist-templates";
import {
  commitServerWrites,
  fromFirestoreFields,
  getCallerRole,
  getServerDocumentName,
  readServerDoc,
  toFirestoreFields,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssignmentInput = {
  title?: unknown;
  clientId?: unknown;
  assignmentType?: unknown;
  priority?: unknown;
  assignedUsers?: unknown;
  estimatedHours?: unknown;
  startDate?: unknown;
  dueDate?: unknown;
  remarks?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    if (caller.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin can create and initially allocate new tasks." }, { status: 403 });
    }
    if (Number(request.headers.get("content-length") || 0) > 12000) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }

    const input = (await request.json()) as AssignmentInput;
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const clientId = typeof input.clientId === "string" ? input.clientId.trim() : "";
    const assignmentType = typeof input.assignmentType === "string" ? input.assignmentType : "";
    const priority = typeof input.priority === "string" ? input.priority : "";
    const startDate = typeof input.startDate === "string" ? input.startDate : "";
    const dueDate = typeof input.dueDate === "string" ? input.dueDate : "";
    const remarks = typeof input.remarks === "string" ? input.remarks.trim() : "";
    const estimatedHours = Number(input.estimatedHours);

    if (title.length < 3 || title.length > 200) return NextResponse.json({ error: "Assignment title must contain 3–200 characters." }, { status: 400 });
    if (!clientId || clientId.length > 300 || clientId.includes("/")) return NextResponse.json({ error: "Select a valid client." }, { status: 400 });
    if (!(assignmentType in checklistTemplates)) return NextResponse.json({ error: "Select a supported audit or tax service." }, { status: 400 });
    if (!["low", "medium", "high", "urgent"].includes(priority)) return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
    if (!Number.isFinite(estimatedHours) || estimatedHours <= 0 || estimatedHours > 10000) return NextResponse.json({ error: "Invalid estimated hours." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || dueDate < startDate) {
      return NextResponse.json({ error: "Enter valid assignment start and due dates." }, { status: 400 });
    }
    if (remarks.length > 3000) return NextResponse.json({ error: "Remarks exceed 3,000 characters." }, { status: 400 });

    const provided = Array.isArray(input.assignedUsers) ? input.assignedUsers : [];
    const assignedIds = [...new Set(provided.map((employee) =>
      employee && typeof employee === "object" && "uid" in employee && typeof employee.uid === "string"
        ? employee.uid
        : "",
    ).filter((uid): uid is string => Boolean(uid)))];

    if (assignedIds.length === 0 || assignedIds.length > 50) {
      return NextResponse.json({ error: "Choose between 1 and 50 employees." }, { status: 400 });
    }

    const clientRecord = await readServerDoc("clients", clientId);
    if (!clientRecord) return NextResponse.json({ error: "Selected client was not found." }, { status: 404 });
    const client = fromFirestoreFields(clientRecord.fields);
    if (client.status === "inactive") return NextResponse.json({ error: "Cannot assign work to an inactive client." }, { status: 400 });

    const profiles = await Promise.all(assignedIds.map((uid) => readServerDoc("users", uid)));
    if (profiles.some((document) => !document)) return NextResponse.json({ error: "A selected employee was not found." }, { status: 400 });

    const assignedUsers = profiles.map((document, index) => {
      const data = fromFirestoreFields(document?.fields);
      if (data.active === false || (data.role !== "employee" && data.role !== "manager")) {
        throw new Error("Only active employees and managers can receive assignments.");
      }
      return {
        uid: assignedIds[index],
        name: typeof data.name === "string" ? data.name : "Employee",
        email: typeof data.email === "string" ? data.email : "",
      };
    });

    const employeeProgress = assignedUsers.map((employee) => ({
      userId: employee.uid,
      userName: employee.name,
      userEmail: employee.email,
      status: "assigned",
      totalSeconds: 0,
      totalMinutes: 0,
      totalHours: 0,
      sessionCount: 0,
    }));

    const id = randomUUID();
    const now = new Date();
    const template = checklistTemplates[assignmentType] || checklistTemplates.other;

    const writes: Record<string, unknown>[] = [{
      update: {
        name: getServerDocumentName("assignments", id),
        fields: toFirestoreFields({
          title,
          clientId,
          clientName: String(client.clientName || "Client"),
          assignmentType,
          priority,
          assignedUsers,
          assignedUserIds: assignedIds,
          employeeProgress,
          estimatedHours,
          startDate,
          dueDate,
          remarks,
          status: "assigned",
          createdBy: caller.uid,
          createdByName: "Super Admin",
          createdAt: now,
          updatedAt: now,
        }),
      },
      currentDocument: { exists: false },
    }];

    for (const title of template) {
      writes.push({
        update: {
          name: getServerDocumentName("assignment_checklists", randomUUID()),
          fields: toFirestoreFields({
            assignmentId: id,
            title,
            completed: false,
            createdAt: now,
          }),
        },
        currentDocument: { exists: false },
      });
    }

    writes.push({
      update: {
        name: getServerDocumentName("activity_logs", randomUUID()),
        fields: toFirestoreFields({
          assignmentId: id,
          assignmentName: title,
          userId: caller.uid,
          userName: "Super Admin",
          entityType: "assignment",
          entityId: id,
          action: "Assignment Created",
          description: "Assignment created and allocated to " + assignedUsers.length + " team member(s).",
          createdAt: now,
        }),
      },
      currentDocument: { exists: false },
    });

    await commitServerWrites(writes);

    return NextResponse.json({ id, message: "Assignment created and allocated." }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Assignment creation failed:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({
      error: message.startsWith("Only active")
        ? message
        : /not configured|service account|credentials/i.test(message)
          ? "Firebase server administration is not configured in Netlify. Super Admin: set FIREBASE_SERVICE_ACCOUNT_JSON securely before creating assignments."
          : "Could not create the assignment. Check permissions and server function logs.",
    }, { status: 503 });
  }
}
