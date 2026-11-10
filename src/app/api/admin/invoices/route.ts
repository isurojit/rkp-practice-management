import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  commitServerWrites, fromFirestoreFields, getCallerRole,
  getServerDocumentName, readServerDoc, toFirestoreFields,
} from "@/lib/server/firebase-admin-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InvoiceInput {
  clientId?: unknown;
  timesheetIds?: unknown;
  fromDate?: unknown;
  toDate?: unknown;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getCallerRole(request.headers.get("authorization"));
    if (!caller) return errorResponse("Please sign in again.", 401);
    if (caller.role !== "super_admin") {
      return errorResponse("Only Super Admin may generate client invoices.", 403);
    }
    if (Number(request.headers.get("content-length") || 0) > 20000) {
      return errorResponse("The invoice request is too large.", 413);
    }

    const input = (await request.json()) as InvoiceInput;
    const clientId = typeof input.clientId === "string" ? input.clientId.trim() : "";
    const fromDate = typeof input.fromDate === "string" ? input.fromDate.trim() : "";
    const toDate = typeof input.toDate === "string" ? input.toDate.trim() : "";

    if (!clientId || clientId.length > 300 || clientId.includes("/")) {
      return errorResponse("Select a valid client.", 400);
    }
    if ((fromDate && !/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) ||
        (toDate && !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) ||
        (fromDate && toDate && fromDate > toDate)) {
      return errorResponse("Please select a valid billing date range.", 400);
    }

    const requestedIds = Array.isArray(input.timesheetIds) ? input.timesheetIds : [];
    const timesheetIds = requestedIds.filter((value): value is string =>
      typeof value === "string" && value.length > 0 && value.length <= 300 && !value.includes("/"),
    );

    if (timesheetIds.length === 0 || timesheetIds.length > 200 ||
        timesheetIds.length !== requestedIds.length ||
        new Set(timesheetIds).size !== timesheetIds.length) {
      return errorResponse("Select 1–200 unique completed work sessions.", 400);
    }

    const [clientDoc, ...sessionDocs] = await Promise.all([
      readServerDoc("clients", clientId),
      ...timesheetIds.map((id) => readServerDoc("timesheets", id)),
    ]);

    if (!clientDoc) return errorResponse("Client record not found.", 404);
    if (sessionDocs.some((doc) => !doc)) return errorResponse("A work session could not be found. Refresh the billing report.", 409);

    const client = fromFirestoreFields(clientDoc.fields);
    const rate = Number(client.billingRate);

    if (!Number.isFinite(rate) || rate < 0 || rate > 10000000) {
      return errorResponse("Client billing rate is not valid.", 409);
    }

    const entries = sessionDocs.map((document, index) => {
      if (!document) throw new Error("Session was removed during invoice preparation.");
      const session = fromFirestoreFields(document.fields);
      const date = typeof session.date === "string" ? session.date : "";

      if (
        session.clientId !== clientId ||
        session.status === "active" ||
        !Boolean(session.checkOut || session.endTime) ||
        session.billingStatus === "billed" ||
        (fromDate && date < fromDate) ||
        (toDate && date > toDate)
      ) {
        throw new Error("A selected session is active, already billed, or outside the chosen range. Refresh and try again.");
      }

      const hours = typeof session.totalSeconds === "number"
        ? session.totalSeconds / 3600
        : Number(session.totalHours || 0);

      if (!Number.isFinite(hours) || hours <= 0 || hours > 100000) {
        throw new Error("A session has invalid or zero billable hours.");
      }

      return {
        id: timesheetIds[index],
        updateTime: document.updateTime,
        line: {
          timesheetId: timesheetIds[index],
          date,
          employeeName: String(session.userName || "Employee"),
          assignmentName: String(session.assignmentName || "Assignment"),
          hours: Number(hours.toFixed(6)),
          description: String(session.workDescription || session.narration || ""),
        },
      };
    });

    const totalHours = Number(entries.reduce((sum, entry) => sum + entry.line.hours, 0).toFixed(6));
    const amount = Number((totalHours * rate).toFixed(2));
    const now = new Date();
    const id = randomUUID();
    const invoiceNo = "RKP-" + now.getUTCFullYear() + "-" + Date.now() + "-" +
      randomBytes(3).toString("hex").toUpperCase();

    const writes: Record<string, unknown>[] = [{
      update: {
        name: getServerDocumentName("invoices", id),
        fields: toFirestoreFields({
          invoiceNo,
          clientId,
          clientName: String(client.clientName || "Client"),
          fromDate,
          toDate,
          totalHours,
          billingRate: rate,
          amount,
          status: "generated",
          lineItems: entries.map((entry) => entry.line),
          createdAt: now,
          createdBy: caller.uid,
        }),
      },
      currentDocument: { exists: false },
    }];

    for (const session of entries) {
      const write: Record<string, unknown> = {
        update: {
          name: getServerDocumentName("timesheets", session.id),
          fields: toFirestoreFields({
            billingStatus: "billed",
            invoiceId: id,
            updatedAt: now,
          }),
        },
        updateMask: { fieldPaths: ["billingStatus", "invoiceId", "updatedAt"] },
      };
      if (session.updateTime) write.currentDocument = { updateTime: session.updateTime };
      writes.push(write);
    }

    // One Firestore commit: the invoice and all its billable sessions
    // either succeed together or none are marked as invoiced.
    await commitServerWrites(writes);

    return NextResponse.json({ id, invoiceNo, amount }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Invoice creation failed:", error);
    const message = error instanceof Error ? error.message : "";
    if (/session is active|already billed|outside|session has|removed during|work record changed/i.test(message)) {
      return errorResponse(message, 409);
    }
    return errorResponse(
      /not configured|credentials|service account/i.test(message)
        ? "Firebase server administration is not configured. Ask Super Admin to set the secure Netlify Functions credential."
        : "Invoice could not be generated. No session should be marked billed unless the atomic server transaction succeeds.",
      503,
    );
  }
}
