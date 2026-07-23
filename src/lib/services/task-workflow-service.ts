import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Assignment,
  AssignmentEmployee,
  AssignmentEmployeeProgress,
  AssignmentStatus,
  EmployeeTaskStatus,
} from "@/types/assignment";

import { Timesheet } from "@/types/timesheet";

import {
  completeTimesheet,
  createAssignmentWorkSession,
  getActiveTimesheet,
  getAssignmentTimesheets,
  getTimesheetById,
  pauseTimesheet,
} from "@/lib/services/timesheet-service";

import { logActivity } from "@/lib/services/activity-service";

const ASSIGNMENTS_COLLECTION = "assignments";

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

function normaliseEmployee(
  employee: AssignmentEmployee | string,
): AssignmentEmployee {
  if (typeof employee === "string") {
    return {
      uid: employee,
      name: "Unknown User",
      email: "",
    };
  }

  return {
    uid: employee.uid,
    name: employee.name || "Unknown User",
    email: employee.email || "",
  };
}

function normaliseTimesheetDate(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  const parsedDate = new Date(value as string | number | Date);

  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function isUserAssigned(assignment: Assignment, userId: string): boolean {
  return assignment.assignedUsers.some(
    (employee) => normaliseEmployee(employee).uid === userId,
  );
}

function createInitialEmployeeProgress(
  assignment: Assignment,
): AssignmentEmployeeProgress[] {
  return assignment.assignedUsers.map((employee) => {
    const normalisedEmployee = normaliseEmployee(employee);

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

function getEmployeeProgressList(
  assignment: Assignment,
): AssignmentEmployeeProgress[] {
  const existingProgress =
    assignment.employeeProgress || createInitialEmployeeProgress(assignment);

  const assignedEmployees = assignment.assignedUsers.map(normaliseEmployee);

  return assignedEmployees.map((employee) => {
    const existingEmployeeProgress = existingProgress.find(
      (item) => item.userId === employee.uid,
    );

    if (!existingEmployeeProgress) {
      return {
        userId: employee.uid,
        userName: employee.name,
        userEmail: employee.email || "",

        status: "assigned",

        totalMinutes: 0,
        totalHours: 0,
        sessionCount: 0,
      };
    }

    return {
      ...existingEmployeeProgress,

      userName: existingEmployeeProgress.userName || employee.name,

      userEmail: existingEmployeeProgress.userEmail || employee.email || "",

      totalMinutes: existingEmployeeProgress.totalMinutes || 0,

      totalHours: existingEmployeeProgress.totalHours || 0,

      sessionCount: existingEmployeeProgress.sessionCount || 0,
    };
  });
}

function getCurrentEmployeeProgress(
  assignment: Assignment,
  userId: string,
): AssignmentEmployeeProgress {
  const employeeProgress = getEmployeeProgressList(assignment).find(
    (item) => item.userId === userId,
  );

  if (!employeeProgress) {
    throw new Error("Employee task progress was not found.");
  }

  return employeeProgress;
}

function updateEmployeeProgress(
  employeeProgress: AssignmentEmployeeProgress[],
  user: TaskUser,
  updates: Partial<AssignmentEmployeeProgress>,
): AssignmentEmployeeProgress[] {
  const existingProgress = employeeProgress.find(
    (item) => item.userId === user.uid,
  );

  if (!existingProgress) {
    return [
      ...employeeProgress,
      {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email || "",

        status: "assigned",

        totalMinutes: 0,
        totalHours: 0,
        sessionCount: 0,

        ...updates,
      },
    ];
  }

  return employeeProgress.map((item) =>
    item.userId === user.uid
      ? {
          ...item,

          userName: user.name || item.userName || "Unknown User",

          userEmail: user.email || item.userEmail || "",

          ...updates,
        }
      : item,
  );
}

function calculateOverallAssignmentStatus(
  employeeProgress: AssignmentEmployeeProgress[],
): AssignmentStatus {
  if (employeeProgress.length === 0) {
    return "assigned";
  }

  const statuses = employeeProgress.map((item) => item.status);

  if (statuses.every((status) => status === "completed")) {
    return "completed";
  }

  if (statuses.some((status) => status === "in_progress")) {
    return "in_progress";
  }

  if (statuses.some((status) => status === "paused")) {
    return "paused";
  }

  if (statuses.some((status) => status === "accepted")) {
    return "accepted";
  }

  return "assigned";
}

async function getAssignmentOrThrow(assignmentId: string): Promise<Assignment> {
  const cleanedAssignmentId = assignmentId.trim();

  if (!cleanedAssignmentId) {
    throw new Error("Assignment ID is required.");
  }

  const assignmentReference = doc(
    db,
    ASSIGNMENTS_COLLECTION,
    cleanedAssignmentId,
  );

  const assignmentSnapshot = await getDoc(assignmentReference);

  if (!assignmentSnapshot.exists()) {
    throw new Error("The selected assignment was not found.");
  }

  return {
    id: assignmentSnapshot.id,
    ...(assignmentSnapshot.data() as Omit<Assignment, "id">),
  };
}

function validateUserAssignment(assignment: Assignment, user: TaskUser): void {
  if (!user.uid.trim()) {
    throw new Error("Authenticated user ID is required.");
  }

  if (!isUserAssigned(assignment, user.uid)) {
    throw new Error("This task has not been assigned to you.");
  }
}

async function updateAssignmentProgress(
  assignment: Assignment,
  employeeProgress: AssignmentEmployeeProgress[],
): Promise<AssignmentStatus> {
  if (!assignment.id) {
    throw new Error("Assignment ID is missing.");
  }

  const assignmentStatus = calculateOverallAssignmentStatus(employeeProgress);

  const now = Timestamp.now();

  const updateData: Record<string, unknown> = {
    employeeProgress,
    status: assignmentStatus,
    updatedAt: now,
  };

  if (assignmentStatus === "completed") {
    updateData.completedAt = assignment.completedAt || now;
  }

  if (assignmentStatus !== "completed" && assignment.completedAt) {
    updateData.completedAt = null;
  }

  await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignment.id), updateData);

  return assignmentStatus;
}

async function getCompletedSessionTotals(
  assignmentId: string,
  userId: string,
): Promise<{
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
}> {
  const sessions = await getAssignmentTimesheets(assignmentId);

  const employeeSessions = sessions.filter(
    (session) => session.userId === userId,
  );

  const closedSessions = employeeSessions.filter(
    (session) =>
      session.status !== "active" &&
      Boolean(session.endTime || session.checkOut),
  );

  const totalMinutes = closedSessions.reduce((sum, session) => {
    if (typeof session.totalMinutes === "number") {
      return sum + session.totalMinutes;
    }

    if (typeof session.totalHours === "number") {
      return sum + Math.round(session.totalHours * 60);
    }

    return sum;
  }, 0);

  return {
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(2)),
    sessionCount: employeeSessions.length,
  };
}

async function getCreatedSession(
  documentId: string,
): Promise<Timesheet | undefined> {
  const timesheet = await getTimesheetById(documentId);

  return timesheet || undefined;
}

export async function getActiveTaskSession(
  userId: string,
): Promise<Timesheet | null> {
  if (!userId.trim()) {
    return null;
  }

  return getActiveTimesheet(userId);
}

export async function acceptTask({
  assignmentId,
  user,
}: TaskActionInput): Promise<TaskWorkflowResult> {
  const assignment = await getAssignmentOrThrow(assignmentId);

  validateUserAssignment(assignment, user);

  const currentProgress = getCurrentEmployeeProgress(assignment, user.uid);

  if (currentProgress.status !== "assigned") {
    throw new Error("This task has already been accepted.");
  }

  const now = Timestamp.now();

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "accepted",
      acceptedAt: now,
    },
  );

  const assignmentStatus = await updateAssignmentProgress(
    assignment,
    employeeProgress,
  );

  await logActivity({
    assignmentId,
    assignmentName: assignment.title,

    userId: user.uid,
    userName: user.name,

    entityType: "assignment",
    entityId: assignmentId,

    action: "Accepted Task",
    description: `${user.name} accepted the assignment "${assignment.title}".`,
  });

  return {
    assignmentStatus,
    employeeStatus: "accepted",
  };
}

export async function startTask({
  assignmentId,
  user,
  narration,
}: TaskActionInput): Promise<TaskWorkflowResult> {
  const assignment = await getAssignmentOrThrow(assignmentId);

  validateUserAssignment(assignment, user);

  const currentProgress = getCurrentEmployeeProgress(assignment, user.uid);

  if (currentProgress.status !== "accepted") {
    throw new Error("Accept the task before starting work.");
  }

  const existingActiveSession = await getActiveTimesheet(user.uid);

  if (existingActiveSession) {
    throw new Error(
      `You are already working on "${
        existingActiveSession.assignmentName || "another task"
      }". Pause or complete it before starting this task.`,
    );
  }

  const sessionReference = await createAssignmentWorkSession({
    userId: user.uid,
    userName: user.name,

    assignmentId,
    assignmentName: assignment.title,

    clientId: assignment.clientId,
    clientName: assignment.clientName,

    narration: narration?.trim() || undefined,

    actionType: "start",

    sessionNumber: (currentProgress.sessionCount || 0) + 1,
  });

  const now = Timestamp.now();

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "in_progress",

      firstStartedAt: currentProgress.firstStartedAt || now,

      lastStartedAt: now,

      sessionCount: (currentProgress.sessionCount || 0) + 1,
    },
  );

  const assignmentStatus = await updateAssignmentProgress(
    assignment,
    employeeProgress,
  );

  const session = await getCreatedSession(sessionReference.id);

  return {
    assignmentStatus,
    employeeStatus: "in_progress",
    session,
  };
}

export async function pauseTask({
  assignmentId,
  user,
  narration,
}: TaskActionWithNarrationInput): Promise<TaskWorkflowResult> {
  const cleanedNarration = narration.trim();

  if (!cleanedNarration) {
    throw new Error("Narration is required when pausing a task.");
  }

  const assignment = await getAssignmentOrThrow(assignmentId);

  validateUserAssignment(assignment, user);

  const currentProgress = getCurrentEmployeeProgress(assignment, user.uid);

  if (currentProgress.status !== "in_progress") {
    throw new Error("Only an active task can be paused.");
  }

  const activeSession = await getActiveTimesheet(user.uid);

  if (!activeSession?.id || activeSession.assignmentId !== assignmentId) {
    throw new Error("No active work session was found for this task.");
  }

  const closedSession = await pauseTimesheet(
    activeSession.id,
    cleanedNarration,
  );

  const sessionTotals = await getCompletedSessionTotals(assignmentId, user.uid);

  const now = Timestamp.now();

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "paused",

      pausedAt: now,

      latestNarration: cleanedNarration,

      totalMinutes: sessionTotals.totalMinutes,

      totalHours: sessionTotals.totalHours,

      sessionCount: Math.max(
        currentProgress.sessionCount || 0,
        sessionTotals.sessionCount,
      ),
    },
  );

  const assignmentStatus = await updateAssignmentProgress(
    assignment,
    employeeProgress,
  );

  return {
    assignmentStatus,
    employeeStatus: "paused",
    session: closedSession,
  };
}

export async function resumeTask({
  assignmentId,
  user,
  narration,
}: TaskActionInput): Promise<TaskWorkflowResult> {
  const assignment = await getAssignmentOrThrow(assignmentId);

  validateUserAssignment(assignment, user);

  const currentProgress = getCurrentEmployeeProgress(assignment, user.uid);

  if (currentProgress.status !== "paused") {
    throw new Error("Only a paused task can be resumed.");
  }

  const existingActiveSession = await getActiveTimesheet(user.uid);

  if (existingActiveSession) {
    throw new Error(
      `You are already working on "${
        existingActiveSession.assignmentName || "another task"
      }". Pause or complete it before resuming this task.`,
    );
  }

  const existingSessions = await getAssignmentTimesheets(assignmentId);

  const employeeSessions = existingSessions.filter(
    (session) => session.userId === user.uid,
  );

  const latestEmployeeSession = [...employeeSessions].sort(
    (first, second) =>
      normaliseTimesheetDate(
        second.startTime || second.checkIn || second.createdAt,
      ) -
      normaliseTimesheetDate(
        first.startTime || first.checkIn || first.createdAt,
      ),
  )[0];

  const nextSessionNumber =
    Math.max(currentProgress.sessionCount || 0, employeeSessions.length) + 1;

  const sessionReference = await createAssignmentWorkSession({
    userId: user.uid,
    userName: user.name,

    assignmentId,
    assignmentName: assignment.title,

    clientId: assignment.clientId,
    clientName: assignment.clientName,

    narration: narration?.trim() || undefined,

    actionType: "resume",

    sessionNumber: nextSessionNumber,

    resumedFromSession: latestEmployeeSession?.id,
  });

  const now = Timestamp.now();

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "in_progress",

      lastStartedAt: now,

      sessionCount: nextSessionNumber,
    },
  );

  const assignmentStatus = await updateAssignmentProgress(
    assignment,
    employeeProgress,
  );

  const session = await getCreatedSession(sessionReference.id);

  return {
    assignmentStatus,
    employeeStatus: "in_progress",
    session,
  };
}

export async function endTask({
  assignmentId,
  user,
  narration,
}: TaskActionWithNarrationInput): Promise<TaskWorkflowResult> {
  const cleanedNarration = narration.trim();

  if (!cleanedNarration) {
    throw new Error("Final narration is required when ending a task.");
  }

  const assignment = await getAssignmentOrThrow(assignmentId);

  validateUserAssignment(assignment, user);

  const currentProgress = getCurrentEmployeeProgress(assignment, user.uid);

  if (
    currentProgress.status !== "in_progress" &&
    currentProgress.status !== "paused"
  ) {
    throw new Error("Only an active or paused task can be completed.");
  }

  let closedSession: Timesheet | undefined;

  if (currentProgress.status === "in_progress") {
    const activeSession = await getActiveTimesheet(user.uid);

    if (!activeSession?.id || activeSession.assignmentId !== assignmentId) {
      throw new Error("No active work session was found for this task.");
    }

    closedSession = await completeTimesheet(activeSession.id, cleanedNarration);
  } else {
    await logActivity({
      assignmentId,
      assignmentName: assignment.title,

      userId: user.uid,
      userName: user.name,

      entityType: "assignment",
      entityId: assignmentId,

      action: "Completed Task",
      description: `${user.name} completed the paused assignment "${assignment.title}". Final narration: ${cleanedNarration}`,
    });
  }

  const sessionTotals = await getCompletedSessionTotals(assignmentId, user.uid);

  const now = Timestamp.now();

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "completed",

      completedAt: now,

      latestNarration: cleanedNarration,

      totalMinutes: sessionTotals.totalMinutes,

      totalHours: sessionTotals.totalHours,

      sessionCount: Math.max(
        currentProgress.sessionCount || 0,
        sessionTotals.sessionCount,
      ),
    },
  );

  const assignmentStatus = await updateAssignmentProgress(
    assignment,
    employeeProgress,
  );

  return {
    assignmentStatus,
    employeeStatus: "completed",
    session: closedSession,
  };
}

export async function getEmployeeTaskProgress(
  assignmentId: string,
  userId: string,
): Promise<AssignmentEmployeeProgress | null> {
  if (!userId.trim()) {
    return null;
  }

  const assignment = await getAssignmentOrThrow(assignmentId);

  return (
    getEmployeeProgressList(assignment).find(
      (item) => item.userId === userId,
    ) || null
  );
}

export async function getAssignmentWorkSessions(
  assignmentId: string,
): Promise<Timesheet[]> {
  const sessions = await getAssignmentTimesheets(assignmentId);

  return [...sessions].sort(
    (first, second) =>
      normaliseTimesheetDate(
        second.startTime || second.checkIn || second.createdAt,
      ) -
      normaliseTimesheetDate(
        first.startTime || first.checkIn || first.createdAt,
      ),
  );
}
