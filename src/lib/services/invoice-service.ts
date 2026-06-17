import { addDoc, collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Invoice } from "@/types/invoice";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function createInvoice(data: Omit<Invoice, "id">) {
  return await addDoc(collection(db, "invoices"), {
    ...data,
    createdAt: new Date(),
  });
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
