import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Assignment,
  AssignmentEmployee,
  AssignmentEmployeeProgress,
  AssignmentStatus,
  EmployeeTaskStatus,
} from "@/types/assignment";

const ASSIGNMENTS_COLLECTION = "assignments";
const TIMESHEETS_COLLECTION = "timesheets";

export type TaskSessionStatus = "active" | "paused" | "completed";

export type TaskSessionAction = "start" | "resume";

export interface TaskWorkSession {
  id?: string;

  assignmentId: string;
  assignmentName: string;

  clientId: string;
  clientName: string;

  userId: string;
  userName: string;
  userEmail?: string;

  date: string;

  startTime: any;
  endTime?: any;

  totalMinutes: number;
  totalHours: number;

  status: TaskSessionStatus;
  actionType: TaskSessionAction;

  narration?: string;

  createdAt?: any;
  updatedAt?: any;
}

interface TaskUser {
  uid: string;
  name: string;
  email?: string;
}

interface TaskActionInput {
  assignmentId: string;
  user: TaskUser;
}

interface TaskActionWithNarrationInput extends TaskActionInput {
  narration: string;
}

interface TaskWorkflowResult {
  assignmentStatus: AssignmentStatus;
  employeeStatus: EmployeeTaskStatus;
  session?: TaskWorkSession;
}

function getTodayDate(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function timestampToMilliseconds(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (
      value as {
        toMillis?: unknown;
      }
    ).toMillis === "function"
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .getTime();
  }

  const parsedDate = new Date(value as string | number | Date);

  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function calculateSessionDuration(
  startTime: unknown,
  endTime: unknown,
): {
  totalMinutes: number;
  totalHours: number;
} {
  const startMilliseconds = timestampToMilliseconds(startTime);

  const endMilliseconds = timestampToMilliseconds(endTime);

  if (startMilliseconds <= 0 || endMilliseconds <= startMilliseconds) {
    return {
      totalMinutes: 0,
      totalHours: 0,
    };
  }

  const durationMilliseconds = endMilliseconds - startMilliseconds;

  const totalMinutes = Math.max(
    0,
    Math.round(durationMilliseconds / (1000 * 60)),
  );

  const totalHours = Number((totalMinutes / 60).toFixed(2));

  return {
    totalMinutes,
    totalHours,
  };
}

function normaliseEmployee(
  employee: AssignmentEmployee | string,
): AssignmentEmployee {
  if (typeof employee === "string") {
    return {
      uid: employee,
      name: "Unknown User",
    };
  }

  return employee;
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
  const existingProgress = assignment.employeeProgress || [];

  const assignedEmployees = assignment.assignedUsers.map(normaliseEmployee);

  return assignedEmployees.map((employee) => {
    const progress = existingProgress.find(
      (item) => item.userId === employee.uid,
    );

    if (progress) {
      return {
        ...progress,
        userName: progress.userName || employee.name,
        userEmail: progress.userEmail || employee.email || "",
        totalMinutes: progress.totalMinutes || 0,
        totalHours: progress.totalHours || 0,
        sessionCount: progress.sessionCount || 0,
      };
    }

    return {
      userId: employee.uid,
      userName: employee.name,
      userEmail: employee.email || "",

      status: "assigned",

      totalMinutes: 0,
      totalHours: 0,
      sessionCount: 0,
    };
  });
}

function calculateOverallAssignmentStatus(
  employeeProgress: AssignmentEmployeeProgress[],
): AssignmentStatus {
  if (employeeProgress.length === 0) {
    return "assigned";
  }

  const statuses = employeeProgress.map((item) => item.status);

  const allCompleted = statuses.every((status) => status === "completed");

  if (allCompleted) {
    return "completed";
  }

  const anyInProgress = statuses.some((status) => status === "in_progress");

  if (anyInProgress) {
    return "in_progress";
  }

  const anyPaused = statuses.some((status) => status === "paused");

  if (anyPaused) {
    return "paused";
  }

  const anyAccepted = statuses.some((status) => status === "accepted");

  if (anyAccepted) {
    return "accepted";
  }

  return "assigned";
}

function updateEmployeeProgress(
  progressList: AssignmentEmployeeProgress[],
  user: TaskUser,
  updates: Partial<AssignmentEmployeeProgress>,
): AssignmentEmployeeProgress[] {
  const existingProgress = progressList.find(
    (item) => item.userId === user.uid,
  );

  if (!existingProgress) {
    return [
      ...progressList,
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

  return progressList.map((item) =>
    item.userId === user.uid
      ? {
          ...item,

          userName: user.name || item.userName,

          userEmail: user.email || item.userEmail || "",

          ...updates,
        }
      : item,
  );
}

async function getAssignmentOrThrow(assignmentId: string): Promise<Assignment> {
  if (!assignmentId.trim()) {
    throw new Error("Assignment ID is required.");
  }

  const assignmentReference = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);

  const assignmentSnapshot = await getDoc(assignmentReference);

  if (!assignmentSnapshot.exists()) {
    throw new Error("The selected assignment was not found.");
  }

  return {
    id: assignmentSnapshot.id,
    ...(assignmentSnapshot.data() as Omit<Assignment, "id">),
  };
}

async function getUserSessions(userId: string): Promise<TaskWorkSession[]> {
  const sessionsQuery = query(
    collection(db, TIMESHEETS_COLLECTION),
    where("userId", "==", userId),
  );

  const snapshot = await getDocs(sessionsQuery);

  return snapshot.docs.map((sessionDocument) => ({
    id: sessionDocument.id,
    ...(sessionDocument.data() as Omit<TaskWorkSession, "id">),
  }));
}

export async function getActiveTaskSession(
  userId: string,
): Promise<TaskWorkSession | null> {
  if (!userId) {
    return null;
  }

  const sessions = await getUserSessions(userId);

  return (
    sessions.find(
      (session) => session.status === "active" && !session.endTime,
    ) || null
  );
}

async function getActiveAssignmentSession(
  assignmentId: string,
  userId: string,
): Promise<TaskWorkSession | null> {
  const activeSession = await getActiveTaskSession(userId);

  if (!activeSession || activeSession.assignmentId !== assignmentId) {
    return null;
  }

  return activeSession;
}

async function updateAssignmentProgress(
  assignment: Assignment,
  employeeProgress: AssignmentEmployeeProgress[],
): Promise<AssignmentStatus> {
  if (!assignment.id) {
    throw new Error("Assignment ID is missing.");
  }

  const assignmentStatus = calculateOverallAssignmentStatus(employeeProgress);

  const updateData: Record<string, unknown> = {
    employeeProgress,
    status: assignmentStatus,
    updatedAt: Timestamp.now(),
  };

  if (assignmentStatus === "completed") {
    updateData.completedAt = Timestamp.now();
  }

  await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignment.id), updateData);

  return assignmentStatus;
}

function validateUserAssignment(assignment: Assignment, user: TaskUser): void {
  if (!user.uid) {
    throw new Error("Authenticated user ID is required.");
  }

  if (!isUserAssigned(assignment, user.uid)) {
    throw new Error("This task has not been assigned to you.");
  }
}

function getCurrentEmployeeProgress(
  assignment: Assignment,
  userId: string,
): AssignmentEmployeeProgress {
  const progressList = getEmployeeProgressList(assignment);

  const progress = progressList.find((item) => item.userId === userId);

  if (!progress) {
    throw new Error("Employee task progress was not found.");
  }

  return progress;
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

  return {
    assignmentStatus,
    employeeStatus: "accepted",
  };
}

export async function startTask({
  assignmentId,
  user,
}: TaskActionInput): Promise<TaskWorkflowResult> {
  const assignment = await getAssignmentOrThrow(assignmentId);

  validateUserAssignment(assignment, user);

  const currentProgress = getCurrentEmployeeProgress(assignment, user.uid);

  if (currentProgress.status !== "accepted") {
    throw new Error("Accept the task before starting work.");
  }

  const existingActiveSession = await getActiveTaskSession(user.uid);

  if (existingActiveSession) {
    throw new Error(
      `You are already working on "${existingActiveSession.assignmentName}". Pause or end that task before starting another one.`,
    );
  }

  const now = Timestamp.now();

  const sessionData: Omit<TaskWorkSession, "id"> = {
    assignmentId,
    assignmentName: assignment.title,

    clientId: assignment.clientId,
    clientName: assignment.clientName,

    userId: user.uid,
    userName: user.name,
    userEmail: user.email || "",

    date: getTodayDate(),

    startTime: now,

    totalMinutes: 0,
    totalHours: 0,

    status: "active",
    actionType: "start",

    narration: "",

    createdAt: now,
    updatedAt: now,
  };

  const sessionReference = await addDoc(
    collection(db, TIMESHEETS_COLLECTION),
    sessionData,
  );

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

  return {
    assignmentStatus,
    employeeStatus: "in_progress",

    session: {
      id: sessionReference.id,
      ...sessionData,
    },
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

  const activeSession = await getActiveAssignmentSession(
    assignmentId,
    user.uid,
  );

  if (!activeSession?.id) {
    throw new Error("No active work session was found for this task.");
  }

  const now = Timestamp.now();

  const { totalMinutes, totalHours } = calculateSessionDuration(
    activeSession.startTime,
    now,
  );

  await updateDoc(doc(db, TIMESHEETS_COLLECTION, activeSession.id), {
    endTime: now,

    totalMinutes,
    totalHours,

    status: "paused",
    narration: cleanedNarration,

    updatedAt: now,
  });

  const employeeTotalMinutes =
    (currentProgress.totalMinutes || 0) + totalMinutes;

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "paused",

      pausedAt: now,

      latestNarration: cleanedNarration,

      totalMinutes: employeeTotalMinutes,

      totalHours: Number((employeeTotalMinutes / 60).toFixed(2)),
    },
  );

  const assignmentStatus = await updateAssignmentProgress(
    assignment,
    employeeProgress,
  );

  return {
    assignmentStatus,
    employeeStatus: "paused",

    session: {
      ...activeSession,

      endTime: now,

      totalMinutes,
      totalHours,

      status: "paused",
      narration: cleanedNarration,

      updatedAt: now,
    },
  };
}

export async function resumeTask({
  assignmentId,
  user,
}: TaskActionInput): Promise<TaskWorkflowResult> {
  const assignment = await getAssignmentOrThrow(assignmentId);

  validateUserAssignment(assignment, user);

  const currentProgress = getCurrentEmployeeProgress(assignment, user.uid);

  if (currentProgress.status !== "paused") {
    throw new Error("Only a paused task can be resumed.");
  }

  const existingActiveSession = await getActiveTaskSession(user.uid);

  if (existingActiveSession) {
    throw new Error(
      `You are already working on "${existingActiveSession.assignmentName}". Pause or end that task before resuming this one.`,
    );
  }

  const now = Timestamp.now();

  const sessionData: Omit<TaskWorkSession, "id"> = {
    assignmentId,
    assignmentName: assignment.title,

    clientId: assignment.clientId,
    clientName: assignment.clientName,

    userId: user.uid,
    userName: user.name,
    userEmail: user.email || "",

    date: getTodayDate(),

    startTime: now,

    totalMinutes: 0,
    totalHours: 0,

    status: "active",
    actionType: "resume",

    narration: "",

    createdAt: now,
    updatedAt: now,
  };

  const sessionReference = await addDoc(
    collection(db, TIMESHEETS_COLLECTION),
    sessionData,
  );

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "in_progress",

      lastStartedAt: now,

      sessionCount: (currentProgress.sessionCount || 0) + 1,
    },
  );

  const assignmentStatus = await updateAssignmentProgress(
    assignment,
    employeeProgress,
  );

  return {
    assignmentStatus,
    employeeStatus: "in_progress",

    session: {
      id: sessionReference.id,
      ...sessionData,
    },
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

  const now = Timestamp.now();

  let closedSession: TaskWorkSession | undefined;

  let sessionMinutes = 0;

  if (currentProgress.status === "in_progress") {
    const activeSession = await getActiveAssignmentSession(
      assignmentId,
      user.uid,
    );

    if (!activeSession?.id) {
      throw new Error("No active work session was found for this task.");
    }

    const duration = calculateSessionDuration(activeSession.startTime, now);

    sessionMinutes = duration.totalMinutes;

    await updateDoc(doc(db, TIMESHEETS_COLLECTION, activeSession.id), {
      endTime: now,

      totalMinutes: duration.totalMinutes,

      totalHours: duration.totalHours,

      status: "completed",
      narration: cleanedNarration,

      updatedAt: now,
    });

    closedSession = {
      ...activeSession,

      endTime: now,

      totalMinutes: duration.totalMinutes,

      totalHours: duration.totalHours,

      status: "completed",
      narration: cleanedNarration,

      updatedAt: now,
    };
  }

  const employeeTotalMinutes =
    (currentProgress.totalMinutes || 0) + sessionMinutes;

  const employeeProgress = updateEmployeeProgress(
    getEmployeeProgressList(assignment),
    user,
    {
      status: "completed",

      completedAt: now,

      latestNarration: cleanedNarration,

      totalMinutes: employeeTotalMinutes,

      totalHours: Number((employeeTotalMinutes / 60).toFixed(2)),
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
  const assignment = await getAssignmentOrThrow(assignmentId);

  const progressList = getEmployeeProgressList(assignment);

  return progressList.find((item) => item.userId === userId) || null;
}

export async function getAssignmentWorkSessions(
  assignmentId: string,
): Promise<TaskWorkSession[]> {
  const sessionsQuery = query(
    collection(db, TIMESHEETS_COLLECTION),
    where("assignmentId", "==", assignmentId),
  );

  const snapshot = await getDocs(sessionsQuery);

  return snapshot.docs
    .map((sessionDocument) => ({
      id: sessionDocument.id,
      ...(sessionDocument.data() as Omit<TaskWorkSession, "id">),
    }))
    .sort(
      (first, second) =>
        timestampToMilliseconds(second.startTime) -
        timestampToMilliseconds(first.startTime),
    );
}
