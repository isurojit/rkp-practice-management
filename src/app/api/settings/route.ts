import { NextRequest, NextResponse } from "next/server";
import {
  fromFirestoreFields,
  getCallerRole,
  patchServerDoc,
  readServerDoc,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DEFAULT_FIRM_SETTINGS = {
  firmName: "RKP Associates",
  contactEmail: "",
  managerMayShare: true,
  minimumNarrationChars: 5,
};

export type FirmSettings = typeof DEFAULT_FIRM_SETTINGS;

function normalize(raw: Record<string, unknown>): FirmSettings {
  return {
    firmName: typeof raw.firmName === "string" && raw.firmName.trim()
      ? raw.firmName.trim().slice(0, 90)
      : DEFAULT_FIRM_SETTINGS.firmName,
    contactEmail: typeof raw.contactEmail === "string" ? raw.contactEmail.slice(0, 254) : "",
    managerMayShare: raw.managerMayShare !== false,
    minimumNarrationChars: typeof raw.minimumNarrationChars === "number" &&
      Number.isInteger(raw.minimumNarrationChars)
      ? Math.max(5, Math.min(80, raw.minimumNarrationChars))
      : 5,
  };
}

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers: noStore });

    const document = await readServerDoc("firm_settings", "primary");
    return NextResponse.json({
      settings: normalize(document ? fromFirestoreFields(document.fields) : {}),
      canEdit: caller.role === "super_admin",
    }, { headers: noStore });
  } catch (error) {
    console.error("Firm settings read failed:", error);
    return NextResponse.json({
      error: "Server Firebase administration is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON in Netlify Functions before using shared firm settings.",
    }, { status: 503, headers: noStore });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers: noStore });
    if (caller.role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin can change firm-wide settings." }, { status: 403, headers: noStore });
    }
    if (Number(request.headers.get("content-length") || 0) > 4096) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413, headers: noStore });
    }

    const input = (await request.json()) as Partial<FirmSettings>;
    if (typeof input.firmName !== "string" || input.firmName.trim().length < 2 || input.firmName.trim().length > 90) {
      return NextResponse.json({ error: "Firm name must contain 2 to 90 characters." }, { status: 400, headers: noStore });
    }
    if (typeof input.contactEmail !== "string" || input.contactEmail.length > 254 ||
        (input.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail))) {
      return NextResponse.json({ error: "Provide a valid firm contact email, or leave it blank." }, { status: 400, headers: noStore });
    }
    if (typeof input.managerMayShare !== "boolean") {
      return NextResponse.json({ error: "Manager delegation must be enabled or disabled." }, { status: 400, headers: noStore });
    }
    if (typeof input.minimumNarrationChars !== "number" || !Number.isInteger(input.minimumNarrationChars) ||
        input.minimumNarrationChars < 5 || input.minimumNarrationChars > 80) {
      return NextResponse.json({ error: "Minimum narration length must be between 5 and 80 characters." }, { status: 400, headers: noStore });
    }

    const settings: FirmSettings = {
      firmName: input.firmName.trim(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      managerMayShare: input.managerMayShare,
      minimumNarrationChars: input.minimumNarrationChars,
    };

    await patchServerDoc("firm_settings", "primary", {
      ...settings,
      updatedAt: new Date(),
      updatedBy: caller.uid,
    });

    return NextResponse.json({ settings, message: "Firm settings saved." }, { headers: noStore });
  } catch (error) {
    console.error("Firm settings update failed:", error);
    return NextResponse.json({ error: "Firm settings could not be saved. Verify the Netlify Firebase service account." }, { status: 503, headers: noStore });
  }
}
