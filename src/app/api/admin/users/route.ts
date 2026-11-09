import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  getCallerRole,
  getProjectId,
  getServerAccessToken,
  writeServerDoc,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProvisionInput = {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  designation?: unknown;
};

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));

    if (!caller) {
      return NextResponse.json({ error: "Session is invalid or user profile is unavailable." }, { status: 401, headers: noStore });
    }
    if (caller.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin can create employees or managers." }, { status: 403, headers: noStore });
    }

    if (Number(request.headers.get("content-length") || 0) > 8192) {
      return NextResponse.json({ error: "Request exceeds allowed size." }, { status: 413, headers: noStore });
    }

    const body = (await request.json()) as ProvisionInput;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const designation = typeof body.designation === "string" ? body.designation.trim() : "";
    const role = body.role;

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Provide a full name (2–100 characters)." }, { status: 400, headers: noStore });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Provide a valid employee email." }, { status: 400, headers: noStore });
    }
    if (role !== "employee" && role !== "manager") {
      return NextResponse.json({ error: "Select Employee or Manager." }, { status: 400, headers: noStore });
    }
    if (designation.length > 100) {
      return NextResponse.json({ error: "Designation is too long." }, { status: 400, headers: noStore });
    }

    const temporaryPassword = randomBytes(27).toString("base64url");
    const token = await getServerAccessToken();

    const endpoint = "https://identitytoolkit.googleapis.com/v1/projects/" +
      encodeURIComponent(getProjectId()) +
      "/accounts?key=" +
      encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "");

    const signupResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: temporaryPassword,
        displayName: name,
        disabled: false,
      }),
      cache: "no-store",
    });

    const authResult = (await signupResponse.json()) as {
      localId?: string;
      error?: { message?: string };
    };

    if (!signupResponse.ok || !authResult.localId) {
      const message = authResult.error?.message || "";
      const duplicate = message.includes("EMAIL_EXISTS") || message.includes("EMAIL_ALREADY_EXISTS");
      return NextResponse.json(
        { error: duplicate ? "An account with this email already exists." : "Firebase rejected employee creation. Check server permissions." },
        { status: duplicate ? 409 : 502, headers: noStore },
      );
    }

    const uid = authResult.localId;

    try {
      await writeServerDoc("users", uid, {
        uid,
        name,
        email,
        role,
        designation,
        active: true,
        createdAt: new Date(),
        createdBy: caller.uid,
      });
    } catch (error) {
      try {
        await fetch(
          "https://identitytoolkit.googleapis.com/v1/projects/" +
            encodeURIComponent(getProjectId()) + "/accounts:delete",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ localId: uid }),
            cache: "no-store",
          },
        );
      } catch {
        console.error("Employee account rollback failed.");
      }

      console.error("Employee profile write failed:", error);
      return NextResponse.json(
        { error: "Employee profile could not be saved. Check Firestore service-account permissions." },
        { status: 502, headers: noStore },
      );
    }

    return NextResponse.json(
      { uid, email, name, role, message: "Employee created. Send a password setup email." },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    console.error("Employee provisioning error:", error);
    return NextResponse.json(
      { error: error instanceof Error && error.message.includes("not configured")
          ? "Employee provisioning is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON to Netlify."
          : "Employee creation failed. Check server configuration and logs." },
      { status: 503, headers: noStore },
    );
  }
}
