import { auth } from "@/lib/firebase";
import { getAssignmentById } from "@/lib/services/assignment-service";

import {
  getActiveTimesheet,
  getAssignmentTimesheets,
} from "@/lib/services/timesheet-service";

import type {
  AssignmentEmployeeProgress,
  AssignmentStatus,
  EmployeeTaskStatus,
} from "@/types/assignment";
import type { Timesheet } from "@/types/timesheet";

interface TaskUser {
  uid: string;
  name: string;
  email?: string;
}

interface TaskActionInput {
  assignmentId: string;
  user: TaskUser;
  narration?: string;
}

interface TaskActionWithNarrationInput extends TaskActionInput {
  narration: string;
}

export interface TaskWorkflowResult {
  assignmentStatus: AssignmentStatus;
  employeeStatus: EmployeeTaskStatus;
  session?: Timesheet;
}

/**
 * All time-changing actions are performed on the server.
 * The authenticated Firebase user is derived from their verified ID token,
 * not from the employee name or UID supplied by the browser.
 */
async function performTaskAction(
  action: "accept" | "start" | "stop" | "complete",
  input: TaskActionInput,
): Promise<TaskWorkflowResult> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== input.user.uid) {
    throw new Error("Sign in again before recording task work.");
  }

  const token = await currentUser.getIdToken();
  const response = await fetch("/api/work-sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      action,
      assignmentId: input.assignmentId,
      narration: input.narration,
    }),
  });

  const result = (await response.json()) as {
    assignmentStatus?: AssignmentStatus;
    employeeStatus?: EmployeeTaskStatus;
    error?: string;
  };

  if (!response.ok || !result.assignmentStatus || !result.employeeStatus) {
    throw new Error(result.error || "Unable to save your work time. Try again.");
  }

  return {
    assignmentStatus: result.assignmentStatus,
    employeeStatus: result.employeeStatus,
  };
}

export async function acceptTask(input: TaskActionInput): Promise<TaskWorkflowResult> {
  return performTaskAction("accept", input);
}

export async function startTask(input: TaskActionInput): Promise<TaskWorkflowResult> {
  return performTaskAction("start", input);
}

export async function pauseTask(input: TaskActionWithNarrationInput): Promise<TaskWorkflowResult> {
  return performTaskAction("stop", input);
}

export async function resumeTask(input: TaskActionInput): Promise<TaskWorkflowResult> {
  return performTaskAction("start", input);
}

export async function endTask(input: TaskActionWithNarrationInput): Promise<TaskWorkflowResult> {
  return performTaskAction("complete", input);
}

export async function getActiveTaskSession(userId: string): Promise<Timesheet | null> {
  if (!userId) return null;
  return getActiveTimesheet(userId);
}

export async function getEmployeeTaskProgress(
  assignmentId: string,
  userId: string,
): Promise<AssignmentEmployeeProgress | null> {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) return null;

  const stored = assignment.employeeProgress?.find((entry) => entry.userId === userId);
  if (stored) return stored;

  const isAssigned = (assignment.assignedUsers || []).some((entry) =>
    (typeof entry === "string" ? entry : entry?.uid) === userId,
  );

  if (!isAssigned) return null;

  return {
    userId,
    userName: "",
    status: "assigned",
    totalMinutes: 0,
    totalHours: 0,
    sessionCount: 0,
  };
}

function sessionStartMillis(session: Timesheet): number {
  const startedAt = session.startTime || session.checkIn;
  const parsed = Date.parse(startedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getAssignmentWorkSessions(assignmentId: string): Promise<Timesheet[]> {
  const sessions = await getAssignmentTimesheets(assignmentId);
  return [...sessions].sort((a, b) => sessionStartMillis(b) - sessionStartMillis(a));
}
