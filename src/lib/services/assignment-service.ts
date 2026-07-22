import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Assignment,
  AssignmentEmployee,
  AssignmentEmployeeProgress,
  AssignmentStatus,
} from "@/types/assignment";

import { createChecklistFromTemplate } from "@/lib/services/assignment-checklist-service";
import { logActivity } from "@/lib/services/activity-service";

function normaliseAssignedEmployee(
  employee: AssignmentEmployee | string,
): AssignmentEmployee {
  if (typeof employee === "string") {
    return {
      uid: employee,
      name: "Unknown User",
    };
  }

  return {
    uid: employee.uid,
    name: employee.name || "Unknown User",
    email: employee.email || "",
  };
}

function createInitialEmployeeProgress(
  assignedUsers: Array<AssignmentEmployee | string>,
): AssignmentEmployeeProgress[] {
  return assignedUsers.map((employee) => {
    const normalisedEmployee = normaliseAssignedEmployee(employee);

    return {
      userId: normalisedEmployee.uid,
      userName: normalisedEmployee.name,
      userEmail: normalisedEmployee.email || "",

      status: "assigned",

      totalMinutes: 0,
      totalHours: 0,
      sessionCount: 0,
    };
  });
}

export async function getAssignments(): Promise<Assignment[]> {
  const snapshot = await getDocs(collection(db, "assignments"));

  return snapshot.docs.map((documentItem) => ({
    id: documentItem.id,
    ...(documentItem.data() as Omit<Assignment, "id">),
  }));
}

export async function createAssignment(
  data: Omit<
    Assignment,
    | "id"
    | "status"
    | "employeeProgress"
    | "createdAt"
    | "updatedAt"
    | "completedAt"
  >,
) {
  if (!data.title.trim()) {
    throw new Error("Assignment title is required.");
  }

  if (!data.clientId) {
    throw new Error("A client must be selected.");
  }

  if (!data.assignedUsers || data.assignedUsers.length === 0) {
    throw new Error("At least one employee must be assigned.");
  }

  const assignedUsers = data.assignedUsers.map(normaliseAssignedEmployee);

  const employeeProgress = createInitialEmployeeProgress(assignedUsers);

  const assignmentData = {
    ...data,

    assignedUsers,
    employeeProgress,

    status: "assigned" as AssignmentStatus,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const assignmentReference = await addDoc(
    collection(db, "assignments"),
    assignmentData,
  );

  await createChecklistFromTemplate(
    assignmentReference.id,
    data.assignmentType,
  );

  await logActivity({
    assignmentId: assignmentReference.id,
    assignmentName: data.title,

    entityType: "assignment",
    entityId: assignmentReference.id,

    action: "Assignment Created",
    description: `Assignment "${data.title}" was created for ${data.clientName} and assigned to ${assignedUsers.length} employee${
      assignedUsers.length === 1 ? "" : "s"
    }.`,
  });

  return assignmentReference;
}

export async function getAssignmentById(
  id: string,
): Promise<Assignment | null> {
  if (!id.trim()) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "assignments", id));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Assignment, "id">),
  };
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment was not found.");
  }

  await updateDoc(doc(db, "assignments", assignmentId), {
    status,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    assignmentId,
    assignmentName: assignment.title,

    entityType: "assignment",
    entityId: assignmentId,

    action: "Status Updated",
    description: `Assignment status changed to ${status
      .replaceAll("_", " ")
      .toUpperCase()}.`,
  });
}
