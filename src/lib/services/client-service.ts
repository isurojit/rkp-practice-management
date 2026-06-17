import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Client } from "@/types/client";

export async function getClients(): Promise<Client[]> {
  const snapshot = await getDocs(collection(db, "clients"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Client, "id">),
  }));
}
