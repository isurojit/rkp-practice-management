import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Assignment } from "@/types/assignment";

export async function getAssignments(): Promise<Assignment[]> {
  const snapshot = await getDocs(collection(db, "assignments"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Assignment, "id">),
  }));
}

export async function createAssignment(data: Omit<Assignment, "id">) {
  return await addDoc(collection(db, "assignments"), {
    ...data,
    createdAt: new Date(),
  });
}

export async function getAssignmentById(id: string) {
  const snapshot = await getDoc(doc(db, "assignments", id));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: string,
) {
  await updateDoc(doc(db, "assignments", assignmentId), {
    status,
  });
}
