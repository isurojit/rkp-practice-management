import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { AppUser } from "@/types/user";

export async function getUsers(): Promise<AppUser[]> {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      uid: data.uid || doc.id,
      name: data.name || "",
      email: data.email || "",
      role: data.role || "employee",
      designation: data.designation || "",
      active: data.active ?? true,
      createdAt: data.createdAt || null,
    };
  });
}

export async function getUserById(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) return null;

  return {
    uid: snapshot.id,
    ...snapshot.data(),
  };
}
