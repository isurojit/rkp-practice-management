import { NextRequest, NextResponse } from "next/server";

import {
  fromFirestoreFields,
  getCallerRole,
  readServerDoc,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

    const { id } = await params;
    if (!id || id.includes("/") || id.length > 300) {
      return NextResponse.json({ error: "Invalid assignment ID." }, { status: 400 });
    }

    const document = await readServerDoc("assignments", id);
    if (!document) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    const data = fromFirestoreFields(document.fields);

    const privileged = caller.role === "super_admin" || caller.role === "manager";
    const assignedUsers = Array.isArray(data.assignedUsers) ? data.assignedUsers : [];
    const isAssigned = assignedUsers.some((entry) =>
      typeof entry === "string"
        ? entry === caller.uid
        : entry && typeof entry === "object" && "uid" in entry && entry.uid === caller.uid,
    );

    if (!privileged && !isAssigned) {
      return NextResponse.json({ error: "This assignment is not allocated to you." }, { status: 403 });
    }

    const visibleData = privileged ? data : {
      ...data,
      assignedUsers: assignedUsers.filter((entry) =>
        typeof entry === "string" ? entry === caller.uid :
          entry && typeof entry === "object" && "uid" in entry && entry.uid === caller.uid,
      ),
      employeeProgress: (Array.isArray(data.employeeProgress) ? data.employeeProgress : []).filter((entry) =>
        entry && typeof entry === "object" && "userId" in entry && entry.userId === caller.uid,
      ),
    };

    return NextResponse.json({ assignment: { ...visibleData, id } }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Assignment detail failed:", error);
    return NextResponse.json({ error: "Unable to load the assignment." }, { status: 503 });
  }
}
