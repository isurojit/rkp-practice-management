import { NextRequest, NextResponse } from "next/server";

import {
  getCallerRole,
  readServerDoc,
  fromFirestoreFields,
  patchServerDoc,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssignedEmployee = { uid: string; name: string; email?: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    if (caller.role !== "super_admin" && caller.role !== "manager") {
      return NextResponse.json({ error: "Only Super Admins and Managers can share tasks." }, { status: 403 });
    }

    const { id } = await params;
    if (!id || id.length > 300 || id.includes("/")) {
      return NextResponse.json({ error: "Invalid assignment ID." }, { status: 400 });
    }

    const payload = (await request.json()) as { employeeId?: unknown };
    const employeeId = typeof payload.employeeId === "string" ? payload.employeeId.trim() : "";
    if (!employeeId || employeeId.length > 128) {
      return NextResponse.json({ error: "Select a valid employee." }, { status: 400 });
    }

    const [assignmentDocument, employeeDocument] = await Promise.all([
      readServerDoc("assignments", id),
      readServerDoc("users", employeeId),
    ]);

    if (!assignmentDocument) {
      return NextResponse.json({ error: "Assignment was not found." }, { status: 404 });
    }
    if (!employeeDocument) {
      return NextResponse.json({ error: "Employee was not found." }, { status: 404 });
    }

    const employee = fromFirestoreFields(employeeDocument.fields);
    if (employee.role !== "employee" || employee.active === false) {
      return NextResponse.json({ error: "Tasks can only be shared with active employees." }, { status: 400 });
    }

    const data = fromFirestoreFields(assignmentDocument.fields);
    const previousUsers = Array.isArray(data.assignedUsers) ? data.assignedUsers : [];
    const assignedUsers: AssignedEmployee[] = previousUsers
      .filter((entry) => typeof entry === "string" || (entry !== null && typeof entry === "object"))
      .map((entry) =>
        typeof entry === "string"
          ? { uid: entry, name: "Employee" }
          : entry as AssignedEmployee,
      )
      .filter((entry) => typeof entry.uid === "string" && entry.uid.length > 0);

    if (assignedUsers.some((entry) => entry.uid === employeeId)) {
      return NextResponse.json({ error: "This employee already has the assignment." }, { status: 409 });
    }

    const name = typeof employee.name === "string" ? employee.name : "Employee";
    const email = typeof employee.email === "string" ? employee.email : "";
    assignedUsers.push({ uid: employeeId, name, email });

    const progress = Array.isArray(data.employeeProgress) ? data.employeeProgress : [];
    const nextProgress = progress.some((entry) =>
      typeof entry === "object" && entry !== null &&
      "userId" in entry && entry.userId === employeeId,
    ) ? progress : [
      ...progress,
      {
        userId: employeeId,
        userName: name,
        userEmail: email,
        status: "assigned",
        totalMinutes: 0,
        totalHours: 0,
        sessionCount: 0,
      },
    ];

    await patchServerDoc("assignments", id, {
      assignedUsers,
      assignedUserIds: assignedUsers.map((entry) => entry.uid),
      employeeProgress: nextProgress,
      updatedAt: new Date(),
      lastSharedBy: caller.uid,
    }, assignmentDocument.updateTime);

    return NextResponse.json({ message: "Task shared successfully." }, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Share assignment failed:", error);
    return NextResponse.json({
      error: error instanceof Error && error.message.startsWith("This record")
        ? error.message
        : "Task could not be shared. Check server configuration or permissions.",
    }, { status: 503 });
  }
}
