export interface Assignment {
  id?: string;

  title: string;

  clientId: string;
  clientName: string;

  assignmentType:
    | "tax_audit"
    | "internal_audit"
    | "gst_audit"
    | "statutory_audit"
    | "roc_compliance"
    | "itr"
    | "tds"
    | "accounting"
    | "other";

  priority: "low" | "medium" | "high";

  assignedUsers: string[];

  estimatedHours: number;

  startDate: string;

  dueDate: string;

  status: "pending" | "in_progress" | "review" | "completed" | "billed";

  remarks?: string;

  createdAt?: any;
}
