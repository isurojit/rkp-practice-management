import { NextRequest, NextResponse } from "next/server";
import {
  fromFirestoreFields,
  getCallerRole,
  listServerCollection,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }
    if (caller.role !== "super_admin" && caller.role !== "manager") {
      return NextResponse.json({ error: "Only firm management can view the assignment board." }, { status: 403 });
    }

    // One read per collection instead of one checklist query for every assignment.
    const [assignmentDocs, timesheetDocs, checklistDocs] = await Promise.all([
      listServerCollection("assignments"),
      listServerCollection("timesheets"),
      listServerCollection("assignment_checklists"),
    ]);

    const hoursByAssignment = new Map<string, number>();
    const checklistByAssignment = new Map<string, { total: number; completed: number }>();

    for (const record of timesheetDocs) {
      const item = fromFirestoreFields(record.fields);
      const assignmentId = typeof item.assignmentId === "string" ? item.assignmentId : "";
      if (!assignmentId || item.status === "active") continue;

      const hours = typeof item.totalSeconds === "number"
        ? item.totalSeconds / 3600
        : Number(item.totalHours || 0);
      if (!Number.isFinite(hours) || hours < 0) continue;

      hoursByAssignment.set(assignmentId, (hoursByAssignment.get(assignmentId) || 0) + hours);
    }

    for (const record of checklistDocs) {
      const item = fromFirestoreFields(record.fields);
      const assignmentId = typeof item.assignmentId === "string" ? item.assignmentId : "";
      if (!assignmentId) continue;
      const previous = checklistByAssignment.get(assignmentId) || { total: 0, completed: 0 };
      previous.total += 1;
      if (item.completed === true) previous.completed += 1;
      checklistByAssignment.set(assignmentId, previous);
    }

    const assignments = assignmentDocs.map((record) => {
      const entry = fromFirestoreFields(record.fields);
      const id = record.name.split("/").pop() || "";
      const checklist = checklistByAssignment.get(id);
      const validStatus = ["assigned", "accepted", "in_progress", "paused", "completed"].includes(String(entry.status));
      return {
        ...entry,
        id,
        status: validStatus ? entry.status : "assigned",
        assignedUsers: Array.isArray(entry.assignedUsers) ? entry.assignedUsers : [],
        employeeProgress: Array.isArray(entry.employeeProgress) ? entry.employeeProgress : [],
        actualHours: Number((hoursByAssignment.get(id) || 0).toFixed(2)),
        checklistProgress: checklist?.total
          ? Math.round((checklist.completed / checklist.total) * 100)
          : 0,
      };
    });

    return NextResponse.json({ assignments }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Assignment board read failed:", error);
    const message = error instanceof Error ? error.message : "";
    const missingCredentials = /not configured|credentials|service account|different project/i.test(message);
    return NextResponse.json({
      error: missingCredentials
        ? "The firm's server Firebase connection has not been configured in Netlify. Ask the Super Admin to complete Server Setup in Settings."
        : "Unable to load assignment data. Check Firebase permissions and the function logs.",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
