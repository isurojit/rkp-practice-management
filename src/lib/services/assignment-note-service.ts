import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { AssignmentNote } from "@/types/assignment-note";

export async function getAssignmentNotes(
  assignmentId: string,
): Promise<AssignmentNote[]> {
  const q = query(
    collection(db, "assignment_notes"),
    where("assignmentId", "==", assignmentId),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<AssignmentNote, "id">),
  }));
}

export async function addAssignmentNote(data: Omit<AssignmentNote, "id">) {
  return await addDoc(collection(db, "assignment_notes"), {
    ...data,
    createdAt: new Date(),
  });
}
