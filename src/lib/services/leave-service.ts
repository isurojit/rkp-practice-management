import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { LeaveRequest } from "@/types/leave";

export async function createLeaveRequest(data: Omit<LeaveRequest, "id">) {
  return await addDoc(collection(db, "leave_requests"), {
    ...data,
    createdAt: new Date(),
  });
}

export async function getLeaveRequests(userId?: string): Promise<LeaveRequest[]> {
  const target = userId
    ? query(collection(db, "leave_requests"), where("userId", "==", userId))
    : collection(db, "leave_requests");
  const snapshot = await getDocs(target);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<LeaveRequest, "id">),
  }));
}

export async function updateLeaveStatus(
  leaveId: string,
  status: "approved" | "rejected",
) {
  return await updateDoc(doc(db, "leave_requests", leaveId), {
    status,
  });
}
