import {
  addDoc,
  collection,
  doc,
  getDocs,
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

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const snapshot = await getDocs(collection(db, "leave_requests"));

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
