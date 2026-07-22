export type WorkType = "assignment" | "miscellaneous";

export type TimesheetStatus = "active" | "paused" | "completed";

export type TaskActionType = "start" | "resume" | "pause" | "end";

export interface Timesheet {
  id?: string;

  /* ===========================
     Employee
  =========================== */

  userId: string;
  userName: string;

  /* ===========================
     Billing
  =========================== */

  billingStatus?: "unbilled" | "billed";
  invoiceId?: string;

  /* ===========================
     Assignment
  =========================== */

  workType: WorkType;

  assignmentId?: string;
  assignmentName?: string;

  clientId?: string;
  clientName?: string;

  /* ===========================
     Date
  =========================== */

  date: string;

  /*
   Existing fields
   (Do NOT remove)
  */

  checkIn: string;
  checkOut?: string;

  /*
   New workflow fields
  */

  startTime?: string;
  endTime?: string;

  /* ===========================
     Duration
  =========================== */

  totalMinutes?: number;
  totalHours?: number;

  /* ===========================
     Location
  =========================== */

  locationType: "office" | "home" | "client_site" | "other";

  manualLocation?: string;

  /* ===========================
     Narration
  =========================== */

  /*
   Existing narration
  */

  workDescription?: string;
  miscellaneousNarration?: string;

  /*
   New workflow narration
  */

  narration?: string;

  pauseReason?: string;
  completionRemarks?: string;

  remarks?: string;

  /* ===========================
     Workflow
  =========================== */

  status: TimesheetStatus;

  actionType?: TaskActionType;

  sessionNumber?: number;

  resumedFromSession?: string;

  /* ===========================
     Metadata
  =========================== */

  createdAt?: any;
  updatedAt?: any;
}
