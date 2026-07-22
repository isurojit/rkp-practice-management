import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { AssignmentInstruction } from "@/types/assignment-instruction";
import { logActivity } from "@/lib/services/activity-service";

export async function getAssignmentInstructions(
  assignmentId: string,
): Promise<AssignmentInstruction[]> {
  const instructionsQuery = query(
    collection(db, "assignment_instructions"),
    where("assignmentId", "==", assignmentId),
  );

  const snapshot = await getDocs(instructionsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<AssignmentInstruction, "id">),
  }));
}

export async function addAssignmentInstruction(
  data: Omit<AssignmentInstruction, "id">,
) {
  const instructionRef = await addDoc(
    collection(db, "assignment_instructions"),
    {
      ...data,
      createdAt: new Date(),
    },
  );

  await logActivity({
    assignmentId: data.assignmentId,

    userId: data.createdBy,
    userName: data.createdByName,

    entityType: "assignment",
    entityId: data.assignmentId,

    action: "Instruction Added",
    description: `${data.createdByName || "A user"} added an assignment instruction.`,
  });

  return instructionRef;
}
