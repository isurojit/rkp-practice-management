export interface ActivityLog {
  id?: string;

  assignmentId?: string;
  assignmentName?: string;

  userId?: string;
  userName?: string;

  action: string;
  description: string;

  entityType:
    | "assignment"
    | "timesheet"
    | "invoice"
    | "leave"
    | "attendance"
    | "client"
    | "user";

  entityId?: string;

  createdAt?: any;
}
