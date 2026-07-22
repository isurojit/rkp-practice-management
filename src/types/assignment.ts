export type AssignmentType =
  | "tax_audit"
  | "internal_audit"
  | "gst_audit"
  | "statutory_audit"
  | "roc_compliance"
  | "itr"
  | "tds"
  | "accounting"
  | "other";

export type AssignmentPriority = "low" | "medium" | "high" | "urgent";

export type AssignmentStatus =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "paused"
  | "completed";

export type EmployeeTaskStatus =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "paused"
  | "completed";

export interface AssignmentEmployee {
  uid: string;
  name: string;
  email?: string;
}

export interface AssignmentEmployeeProgress {
  userId: string;
  userName: string;
  userEmail?: string;

  status: EmployeeTaskStatus;

  acceptedAt?: any;
  firstStartedAt?: any;
  lastStartedAt?: any;
  pausedAt?: any;
  completedAt?: any;

  latestNarration?: string;

  totalMinutes?: number;
  totalHours?: number;
  sessionCount?: number;
}

export interface Assignment {
  id?: string;

  title: string;

  clientId: string;
  clientName: string;

  assignmentType: AssignmentType;

  priority: AssignmentPriority;

  /**
   * Employees assigned by admin or super admin.
   */
  assignedUsers: AssignmentEmployee[];

  /**
   * Individual workflow and time summary for each employee.
   */
  employeeProgress?: AssignmentEmployeeProgress[];

  estimatedHours: number;

  startDate: string;
  dueDate: string;

  /**
   * Overall assignment status calculated from employee progress.
   */
  status: AssignmentStatus;

  remarks?: string;

  createdBy?: string;
  createdByName?: string;

  completedAt?: any;

  createdAt?: any;
  updatedAt?: any;
}
