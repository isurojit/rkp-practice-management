import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getIndiaDate } from "@/lib/utils/india-date";
import { Attendance } from "@/types/attendance";

export async function getAttendanceRecords(userId?: string): Promise<Attendance[]> {
  const target = userId
    ? query(collection(db, "attendance"), where("userId", "==", userId))
    : collection(db, "attendance");
  const snapshot = await getDocs(target);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Attendance, "id">),
  }));
}

export async function getTodayAttendance(userId: string) {
  const today = getIndiaDate();

  const q = query(
    collection(db, "attendance"),
    where("userId", "==", userId),
    where("date", "==", today),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docItem = snapshot.docs[0];

  return {
    id: docItem.id,
    ...(docItem.data() as Omit<Attendance, "id">),
  };
}

export async function markAttendanceIn(data: Attendance) {
  return await addDoc(collection(db, "attendance"), {
    ...data,
    createdAt: new Date(),
  });
}

export async function markAttendanceOut(id: string) {
  const checkOut = new Date();

  await updateDoc(doc(db, "attendance", id), {
    checkOut: checkOut.toISOString(),
  });
}
