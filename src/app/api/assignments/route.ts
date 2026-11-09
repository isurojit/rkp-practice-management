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
    if (!caller) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

    const privileged = caller.role === "super_admin" || caller.role === "manager";
    const documents = await listServerCollection("assignments");

    const assignments = documents.flatMap((document) => {
      const data = fromFirestoreFields(document.fields);
      const id = document.name.split("/").pop() || "";
      const assigned = Array.isArray(data.assignedUsers) ? data.assignedUsers : [];
      const canView = privileged || assigned.some((entry) =>
        typeof entry === "string"
          ? entry === caller.uid
          : entry && typeof entry === "object" && "uid" in entry && entry.uid === caller.uid,
      );

      return canView ? [{ ...data, id }] : [];
    });

    return NextResponse.json({ assignments }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Assignment list failed:", error);
    return NextResponse.json({ error: "Unable to retrieve assignments. Check the server configuration." }, { status: 503 });
  }
}
