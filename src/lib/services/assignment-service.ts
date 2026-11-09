import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Assignment,
  AssignmentEmployee,
  AssignmentEmployeeProgress,
} from "@/types/assignment";


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

/**
 * Historical assignments can have missing arrays or legacy string UIDs.
 * Normalize on read so one incomplete record cannot crash the entire board.
 */
function normaliseAssignmentRecord(
  id: string,
  raw: Record<string, unknown>,
): Assignment {
  const assignedUsers = Array.isArray(raw.assignedUsers)
    ? raw.assignedUsers
        .filter((value) => typeof value === "string" || (value && typeof value === "object"))
        .map((value) => normaliseAssignedEmployee(value as AssignmentEmployee | string))
        .filter((employee) => Boolean(employee.uid))
    : [];

  const employeeProgress = Array.isArray(raw.employeeProgress)
    ? raw.employeeProgress.filter((value): value is AssignmentEmployeeProgress =>
        Boolean(value && typeof value === "object" && typeof value.userId === "string"),
      )
    : [];

  return {
    ...(raw as unknown as Assignment),
    id,
    title: typeof raw.title === "string" ? raw.title : "Untitled assignment",
    clientId: typeof raw.clientId === "string" ? raw.clientId : "",
    clientName: typeof raw.clientName === "string" ? raw.clientName : "Unknown client",
    assignedUsers,
    employeeProgress,
    status:
      raw.status === "accepted" || raw.status === "in_progress" ||
      raw.status === "paused" || raw.status === "completed"
        ? raw.status
        : "assigned",
    priority:
      raw.priority === "urgent" || raw.priority === "high" || raw.priority === "low"
        ? raw.priority
        : "medium",
    estimatedHours: Number.isFinite(Number(raw.estimatedHours))
      ? Number(raw.estimatedHours)
      : 0,
    startDate: typeof raw.startDate === "string" ? raw.startDate : "",
    dueDate: typeof raw.dueDate === "string" ? raw.dueDate : "",
    assignmentType: typeof raw.assignmentType === "string"
      ? (raw.assignmentType as Assignment["assignmentType"])
      : "other",
  };
}

export async function getAssignments(): Promise<Assignment[]> {
  const snapshot = await getDocs(collection(db, "assignments"));

  return snapshot.docs.map((documentItem) =>
    normaliseAssignmentRecord(documentItem.id, documentItem.data()),
  );
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
): Promise<{ id: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in again to create an assignment.");

  const token = await currentUser.getIdToken();
  const response = await fetch("/api/admin/assignments", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as { id?: string; error?: string };
  if (!response.ok || !result.id) {
    throw new Error(result.error || "Assignment could not be created.");
  }
  return { id: result.id };
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

  return normaliseAssignmentRecord(snapshot.id, snapshot.data());
}

