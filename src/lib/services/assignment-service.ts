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
import { createChecklistFromTemplate } from "@/lib/services/assignment-checklist-service";
import { logActivity } from "@/lib/services/activity-service";

export async function getAssignments(): Promise<Assignment[]> {
  const snapshot = await getDocs(collection(db, "assignments"));

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Assignment, "id">),
  }));
}

export async function createAssignment(data: Omit<Assignment, "id">) {
  const assignmentRef = await addDoc(collection(db, "assignments"), {
    ...data,
    createdAt: new Date(),
  });

  await createChecklistFromTemplate(assignmentRef.id, data.assignmentType);

  await logActivity({
    assignmentId: assignmentRef.id,
    assignmentName: data.title,

    entityType: "assignment",
    entityId: assignmentRef.id,

    action: "Assignment Created",
    description: `Assignment "${data.title}" was created for ${data.clientName}.`,
  });

  return assignmentRef;
}

export async function getAssignmentById(id: string) {
  const snapshot = await getDoc(doc(db, "assignments", id));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Assignment, "id">),
  };
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: string,
) {
  const assignment = await getAssignmentById(assignmentId);

  await updateDoc(doc(db, "assignments", assignmentId), {
    status,
  });

  await logActivity({
    assignmentId,
    assignmentName: assignment?.title,

    entityType: "assignment",
    entityId: assignmentId,

    action: "Status Updated",
    description: `Assignment status changed to ${status.replace("_", " ")}.`,
  });
}
