import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { TaskActionType, Timesheet, TimesheetStatus } from "@/types/timesheet";

import { logActivity } from "@/lib/services/activity-service";

interface CreateAssignmentSessionInput {
  userId: string;
  userName: string;

  assignmentId: string;
  assignmentName: string;

  clientId?: string;
  clientName?: string;

  locationType?: "office" | "home" | "client_site" | "other";

  manualLocation?: string;
  narration?: string;

  actionType?: Extract<TaskActionType, "start" | "resume">;

  sessionNumber?: number;
  resumedFromSession?: string;
}

interface StopTimesheetInput {
  timesheetId: string;

  finalStatus: Extract<TimesheetStatus, "paused" | "completed">;

  narration: string;

  actionType: Extract<TaskActionType, "pause" | "end">;
}

function mapTimesheetDocument(documentItem: {
  id: string;
  data: () => unknown;
}): Timesheet {
  return {
    id: documentItem.id,
    ...(documentItem.data() as Omit<Timesheet, "id">),
  };
}

function getSessionStartTime(timesheet: Timesheet): string {
  return timesheet.startTime || timesheet.checkIn;
}

function calculateDuration(startTime: string, endTime: Date) {
  const start = new Date(startTime);

  if (Number.isNaN(start.getTime())) {
    throw new Error("The work session has an invalid start time.");
  }

  const totalMilliseconds = endTime.getTime() - start.getTime();

  const totalMinutes = Math.max(0, Math.round(totalMilliseconds / (1000 * 60)));

  const totalHours = Number((totalMinutes / 60).toFixed(2));

  return {
    totalMinutes,
    totalHours,
  };
}

function getActivityDescription(
  timesheet: Timesheet,
  action: "started" | "resumed" | "paused" | "completed",
) {
  const workDescription =
    timesheet.workType === "miscellaneous"
      ? "miscellaneous work"
      : `work on ${timesheet.assignmentName || "the assignment"}`;

  return `${timesheet.userName} ${action} ${workDescription}.`;
}

export async function getTimesheets(): Promise<Timesheet[]> {
  const snapshot = await getDocs(collection(db, "timesheets"));

  return snapshot.docs.map(mapTimesheetDocument);
}

export async function getTimesheetById(
  timesheetId: string,
): Promise<Timesheet | null> {
  if (!timesheetId.trim()) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "timesheets", timesheetId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Timesheet, "id">),
  };
}

export async function getActiveTimesheet(
  userId: string,
): Promise<Timesheet | null> {
  if (!userId.trim()) {
    return null;
  }

  const activeTimesheetQuery = query(
    collection(db, "timesheets"),
    where("userId", "==", userId),
    where("status", "==", "active"),
  );

  const snapshot = await getDocs(activeTimesheetQuery);

  if (snapshot.empty) {
    return null;
  }

  return mapTimesheetDocument(snapshot.docs[0]);
}

export async function createTimesheet(data: Timesheet) {
  const activeSession = await getActiveTimesheet(data.userId);

  if (activeSession) {
    throw new Error(
      "You already have an active work session. Pause or complete it before starting another task.",
    );
  }

  const startTime = data.startTime || data.checkIn || new Date().toISOString();

  const timesheetData: Omit<Timesheet, "id"> = {
    ...data,

    checkIn: startTime,
    startTime,

    status: "active",

    billingStatus:
      data.workType === "assignment"
        ? data.billingStatus || "unbilled"
        : undefined,

    actionType: data.actionType || "start",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const documentReference = await addDoc(
    collection(db, "timesheets"),
    timesheetData,
  );

  await logActivity({
    assignmentId: data.assignmentId,
    assignmentName: data.assignmentName,

    userId: data.userId,
    userName: data.userName,

    entityType: "timesheet",
    entityId: documentReference.id,

    action:
      timesheetData.actionType === "resume" ? "Resumed Work" : "Started Work",

    description: getActivityDescription(
      timesheetData as Timesheet,
      timesheetData.actionType === "resume" ? "resumed" : "started",
    ),
  });

  return documentReference;
}

export async function createAssignmentWorkSession(
  input: CreateAssignmentSessionInput,
) {
  const activeSession = await getActiveTimesheet(input.userId);

  if (activeSession) {
    const activeAssignmentName = activeSession.assignmentName || "another task";

    throw new Error(
      `You already have an active work session on ${activeAssignmentName}. Pause or complete it first.`,
    );
  }

  const now = new Date().toISOString();

  const timesheet: Timesheet = {
    userId: input.userId,
    userName: input.userName,

    workType: "assignment",

    assignmentId: input.assignmentId,
    assignmentName: input.assignmentName,

    clientId: input.clientId,
    clientName: input.clientName,

    date: now.slice(0, 10),

    checkIn: now,
    startTime: now,

    locationType: input.locationType || "office",

    manualLocation: input.manualLocation,

    narration: input.narration?.trim() || undefined,

    workDescription: input.narration?.trim() || undefined,

    status: "active",

    billingStatus: "unbilled",

    actionType: input.actionType || "start",

    sessionNumber: input.sessionNumber,

    resumedFromSession: input.resumedFromSession,
  };

  return createTimesheet(timesheet);
}

export async function stopTimesheetSession(input: StopTimesheetInput) {
  const timesheet = await getTimesheetById(input.timesheetId);

  if (!timesheet) {
    throw new Error("The active work session could not be found.");
  }

  if (timesheet.status !== "active") {
    throw new Error("This work session is no longer active.");
  }

  const narration = input.narration.trim();

  if (!narration) {
    throw new Error(
      input.finalStatus === "paused"
        ? "Pause narration is required."
        : "Completion narration is required.",
    );
  }

  const endTime = new Date();

  const duration = calculateDuration(getSessionStartTime(timesheet), endTime);

  const updateData: Partial<Timesheet> = {
    checkOut: endTime.toISOString(),
    endTime: endTime.toISOString(),

    totalMinutes: duration.totalMinutes,
    totalHours: duration.totalHours,

    status: input.finalStatus,
    actionType: input.actionType,

    narration,
    workDescription: narration,

    remarks: narration,

    updatedAt: serverTimestamp(),
  };

  if (input.finalStatus === "paused") {
    updateData.pauseReason = narration;
  }

  if (input.finalStatus === "completed") {
    updateData.completionRemarks = narration;
  }

  await updateDoc(doc(db, "timesheets", input.timesheetId), updateData);

  await logActivity({
    assignmentId: timesheet.assignmentId,
    assignmentName: timesheet.assignmentName,

    userId: timesheet.userId,
    userName: timesheet.userName,

    entityType: "timesheet",
    entityId: input.timesheetId,

    action: input.finalStatus === "paused" ? "Paused Work" : "Completed Work",

    description: `${getActivityDescription(
      timesheet,
      input.finalStatus === "paused" ? "paused" : "completed",
    )} Narration: ${narration}`,
  });

  return {
    ...timesheet,
    ...updateData,
  } as Timesheet;
}

export async function pauseTimesheet(timesheetId: string, narration: string) {
  return stopTimesheetSession({
    timesheetId,
    finalStatus: "paused",
    narration,
    actionType: "pause",
  });
}

export async function completeTimesheet(
  timesheetId: string,
  narration: string,
) {
  return stopTimesheetSession({
    timesheetId,
    finalStatus: "completed",
    narration,
    actionType: "end",
  });
}

export async function checkoutTimesheet(id: string, checkIn?: string) {
  const timesheet = await getTimesheetById(id);

  if (!timesheet) {
    throw new Error("Timesheet session was not found.");
  }

  if (timesheet.status !== "active") {
    throw new Error("This work session is no longer active.");
  }

  const startTime = checkIn || timesheet.startTime || timesheet.checkIn;

  const checkOut = new Date();

  const duration = calculateDuration(startTime, checkOut);

  await updateDoc(doc(db, "timesheets", id), {
    checkOut: checkOut.toISOString(),
    endTime: checkOut.toISOString(),

    totalMinutes: duration.totalMinutes,
    totalHours: duration.totalHours,

    status: "completed",
    actionType: "end",

    updatedAt: serverTimestamp(),
  });

  await logActivity({
    assignmentId: timesheet.assignmentId,
    assignmentName: timesheet.assignmentName,

    userId: timesheet.userId,
    userName: timesheet.userName,

    entityType: "timesheet",
    entityId: id,

    action: "Stopped Work",
    description: getActivityDescription(timesheet, "completed"),
  });
}

export async function getUserTimesheets(userId: string): Promise<Timesheet[]> {
  const userTimesheetsQuery = query(
    collection(db, "timesheets"),
    where("userId", "==", userId),
  );

  const snapshot = await getDocs(userTimesheetsQuery);

  return snapshot.docs.map(mapTimesheetDocument);
}

export async function getAssignmentTimesheets(
  assignmentId: string,
): Promise<Timesheet[]> {
  const assignmentTimesheetsQuery = query(
    collection(db, "timesheets"),
    where("assignmentId", "==", assignmentId),
  );

  const snapshot = await getDocs(assignmentTimesheetsQuery);

  return snapshot.docs.map(mapTimesheetDocument);
}

export async function getUserAssignmentTimesheets(
  userId: string,
  assignmentId: string,
): Promise<Timesheet[]> {
  const userAssignmentTimesheetsQuery = query(
    collection(db, "timesheets"),
    where("userId", "==", userId),
    where("assignmentId", "==", assignmentId),
  );

  const snapshot = await getDocs(userAssignmentTimesheetsQuery);

  return snapshot.docs.map(mapTimesheetDocument);
}

export async function getActiveAssignmentTimesheet(
  userId: string,
  assignmentId: string,
): Promise<Timesheet | null> {
  const activeSession = await getActiveTimesheet(userId);

  if (!activeSession || activeSession.assignmentId !== assignmentId) {
    return null;
  }

  return activeSession;
}

export async function getActiveTimesheets(): Promise<Timesheet[]> {
  const activeTimesheetsQuery = query(
    collection(db, "timesheets"),
    where("status", "==", "active"),
  );

  const snapshot = await getDocs(activeTimesheetsQuery);

  return snapshot.docs.map(mapTimesheetDocument);
}

export async function markTimesheetsAsBilled(
  timesheets: Timesheet[],
  invoiceId: string,
) {
  if (!invoiceId.trim()) {
    throw new Error("Invoice ID is required.");
  }

  const billableTimesheets = timesheets.filter(
    (item) =>
      item.id &&
      item.workType === "assignment" &&
      item.billingStatus !== "billed",
  );

  await Promise.all(
    billableTimesheets.map((item) =>
      updateDoc(doc(db, "timesheets", item.id as string), {
        billingStatus: "billed",
        invoiceId,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
}
