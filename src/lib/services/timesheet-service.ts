import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Timesheet } from "@/types/timesheet";

export async function getTimesheets(): Promise<Timesheet[]> {
  const snapshot = await getDocs(collection(db, "timesheets"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Timesheet, "id">),
  }));
}

export async function getActiveTimesheet(
  userId: string,
): Promise<Timesheet | null> {
  const q = query(
    collection(db, "timesheets"),
    where("userId", "==", userId),
    where("status", "==", "active"),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docItem = snapshot.docs[0];

  return {
    id: docItem.id,
    ...(docItem.data() as Omit<Timesheet, "id">),
  };
}

export async function createTimesheet(data: Timesheet) {
  const activeSession = await getActiveTimesheet(data.userId);

  if (activeSession) {
    throw new Error(
      "You already have an active work session. Please stop it before starting another task.",
    );
  }

  return await addDoc(collection(db, "timesheets"), data);
}

export async function checkoutTimesheet(id: string, checkIn: string) {
  const checkOut = new Date();
  const start = new Date(checkIn);

  const totalHours = (checkOut.getTime() - start.getTime()) / (1000 * 60 * 60);

  await updateDoc(doc(db, "timesheets", id), {
    checkOut: checkOut.toISOString(),
    totalHours: Number(totalHours.toFixed(2)),
    status: "stopped",
  });
}

export async function getUserTimesheets(userId: string): Promise<Timesheet[]> {
  const q = query(collection(db, "timesheets"), where("userId", "==", userId));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Timesheet, "id">),
  }));
}

export async function getAssignmentTimesheets(
  assignmentId: string,
): Promise<Timesheet[]> {
  const q = query(
    collection(db, "timesheets"),
    where("assignmentId", "==", assignmentId),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Timesheet, "id">),
  }));
}

export async function getActiveTimesheets(): Promise<Timesheet[]> {
  const q = query(
    collection(db, "timesheets"),
    where("status", "==", "active"),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Timesheet, "id">),
  }));
}
