import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  commitServerWrites,
  getCallerRole,
  getServerDocumentName,
  toFirestoreFields,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    if (caller.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin can create clients." }, { status: 403 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const str = (key: string) => typeof raw[key] === "string" ? String(raw[key]).trim() : "";

    const clientName = str("clientName");
    const clientCode = str("clientCode").toUpperCase();
    const contactPerson = str("contactPerson");
    const phone = str("phone");
    const email = str("email").toLowerCase();
    const panNo = str("panNo").toUpperCase();
    const gstNo = str("gstNo").toUpperCase();
    const address = str("address");
    const billingRate = Number(raw.billingRate);

    if (clientName.length < 2 || clientName.length > 150) {
      return NextResponse.json({ error: "Enter a client name (2–150 characters)." }, { status: 400 });
    }
    if (!/^[A-Z0-9_-]{2,30}$/.test(clientCode)) {
      return NextResponse.json({ error: "Client code must contain 2–30 letters, numbers, hyphens or underscores." }, { status: 400 });
    }
    if ((email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid client email." }, { status: 400 });
    }
    if ([contactPerson, phone, panNo, gstNo].some((value) => value.length > 100) || address.length > 500) {
      return NextResponse.json({ error: "One or more client details are too long." }, { status: 400 });
    }
    if (!Number.isFinite(billingRate) || billingRate < 0 || billingRate > 10000000) {
      return NextResponse.json({ error: "Enter a valid hourly billing rate." }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date();
    await commitServerWrites([
      {
        update: {
          name: getServerDocumentName("clients", id),
          fields: toFirestoreFields({
            clientName,
            clientCode,
            contactPerson,
            phone,
            email,
            panNo,
            gstNo,
            address,
            billingRate,
            status: "active",
            createdAt: now,
            createdBy: caller.uid,
          }),
        },
        currentDocument: { exists: false },
      },
      {
        update: {
          name: getServerDocumentName("clientCodes", clientCode),
          fields: toFirestoreFields({ clientId: id, createdAt: now }),
        },
        currentDocument: { exists: false },
      },
    ]);

    return NextResponse.json({ id, message: "Client record created." }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Client creation failed:", error);
    const conflict = error instanceof Error && error.message.includes("work record changed");
    const setupRequired = error instanceof Error &&
      /not configured|service account|credentials/i.test(error.message);
    return NextResponse.json({
      error: conflict
        ? "This client code may already exist. Choose a different code."
        : setupRequired
          ? "Firebase server administration is not configured in Netlify. Super Admin: configure FIREBASE_SERVICE_ACCOUNT_JSON securely before adding clients."
          : "Client could not be created. Check server permissions and function logs.",
    }, { status: conflict ? 409 : 503 });
  }
}
