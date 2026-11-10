import { collection, getDocs } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { Invoice } from "@/types/invoice";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/**
 * Server re-verifies ownership, duration, billing state and rate, then commits
 * invoice + session marks together. Browser-provided hours/rates are not trusted.
 */
export async function createInvoice(data: Omit<Invoice, "id">): Promise<{ id: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in before generating an invoice.");
  const timesheetIds = (data.lineItems || []).map((item) => item.timesheetId);

  const response = await fetch("/api/admin/invoices", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + await user.getIdToken(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: data.clientId,
      timesheetIds,
      fromDate: data.fromDate || "",
      toDate: data.toDate || "",
    }),
    cache: "no-store",
  });

  const result = (await response.json()) as { id?: string; error?: string };
  if (!response.ok || !result.id) {
    throw new Error(result.error || "Invoice could not be generated.");
  }

  return { id: result.id };
}

export async function getInvoices(): Promise<Invoice[]> {
  const snapshot = await getDocs(collection(db, "invoices"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Invoice, "id">),
  }));
}

export function generateInvoiceNo() {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = now.getTime();

  return `RKP-${year}-${timestamp}`;
}

export async function getInvoiceById(id: string) {
  const snapshot = await getDoc(doc(db, "invoices", id));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Invoice, "id">),
  };
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "draft" | "generated" | "paid",
) {
  return await updateDoc(doc(db, "invoices", invoiceId), {
    status,
  });
}
