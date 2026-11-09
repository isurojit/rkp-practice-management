import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { ActivityLog } from "@/types/activity";

export async function logActivity(data: ActivityLog) {
  return await addDoc(collection(db, "activity_logs"), {
    ...data,
    createdAt: new Date(),
  });
}

export async function getAssignmentActivities(
  assignmentId: string,
  userId?: string,
): Promise<ActivityLog[]> {
  const q = userId
    ? query(collection(db, "activity_logs"), where("userId", "==", userId))
    : query(collection(db, "activity_logs"), where("assignmentId", "==", assignmentId));

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...(document.data() as Omit<ActivityLog, "id">),
    }))
    .filter((entry) => entry.assignmentId === assignmentId);
}

export async function getAllActivities(): Promise<ActivityLog[]> {
  const snapshot = await getDocs(collection(db, "activity_logs"));

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<ActivityLog, "id">),
  }));
}
