import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Timesheet } from "@/types/timesheet";
import { logActivity } from "./activity-service";

export async function getTimesheets(): Promise<Timesheet[]> {
  const snapshot = await getDocs(collection(db, "timesheets"));

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Timesheet, "id">),
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

  const docRef = await addDoc(collection(db, "timesheets"), {
    ...data,
    billingStatus: data.workType === "assignment" ? "unbilled" : "not_billable",
    createdAt: new Date(),
  });

  await logActivity({
    assignmentId: data.assignmentId,
    assignmentName: data.assignmentName,

    userId: data.userId,
    userName: data.userName,

    entityType: "timesheet",
    entityId: docRef.id,

    action: "Started Work",
    description: `${data.userName} started ${
      data.workType === "miscellaneous"
        ? "miscellaneous work"
        : `working on ${data.assignmentName}`
    }`,
  });

  return docRef;
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

  const session = await getDoc(doc(db, "timesheets", id));

  if (session.exists()) {
    const data = session.data() as Timesheet;

    await logActivity({
      assignmentId: data.assignmentId,
      assignmentName: data.assignmentName,

      userId: data.userId,
      userName: data.userName,

      entityType: "timesheet",
      entityId: id,

      action: "Stopped Work",
      description: `${data.userName} stopped ${
        data.workType === "miscellaneous"
          ? "miscellaneous work"
          : `working on ${data.assignmentName}`
      }`,
    });
  }
}

export async function getUserTimesheets(userId: string): Promise<Timesheet[]> {
  const q = query(collection(db, "timesheets"), where("userId", "==", userId));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Timesheet, "id">),
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

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Timesheet, "id">),
  }));
}

export async function getActiveTimesheets(): Promise<Timesheet[]> {
  const q = query(
    collection(db, "timesheets"),
    where("status", "==", "active"),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Timesheet, "id">),
  }));
}

export async function markTimesheetsAsBilled(
  timesheets: Timesheet[],
  invoiceId: string,
) {
  const billableTimesheets = timesheets.filter(
    (item) => item.id && item.workType === "assignment",
  );

  await Promise.all(
    billableTimesheets.map((item) =>
      updateDoc(doc(db, "timesheets", item.id as string), {
        billingStatus: "billed",
        invoiceId,
      }),
    ),
  );
}
