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
import { AssignmentChecklistItem } from "@/types/assignment-checklist";

export async function getAssignmentChecklist(
  assignmentId: string,
): Promise<AssignmentChecklistItem[]> {
  const q = query(
    collection(db, "assignment_checklists"),
    where("assignmentId", "==", assignmentId),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<AssignmentChecklistItem, "id">),
  }));
}

export async function addChecklistItem(assignmentId: string, title: string) {
  return await addDoc(collection(db, "assignment_checklists"), {
    assignmentId,
    title,
    completed: false,
    createdAt: new Date(),
  });
}

export async function toggleChecklistItem(itemId: string, completed: boolean) {
  return await updateDoc(doc(db, "assignment_checklists", itemId), {
    completed,
    completedAt: completed ? new Date() : null,
  });
}
