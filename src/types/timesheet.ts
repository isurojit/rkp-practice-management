export interface Timesheet {
  id?: string;

  userId: string;
  userName: string;

  billingStatus?: "unbilled" | "billed";
  invoiceId?: string;

  workType: "assignment" | "miscellaneous";

  assignmentId?: string;
  assignmentName?: string;

  clientId?: string;
  clientName?: string;

  date: string;

  checkIn: string;
  checkOut?: string;

  totalHours?: number;

  locationType: "office" | "home" | "client_site" | "other";

  manualLocation?: string;

  workDescription?: string;

  miscellaneousNarration?: string;

  remarks?: string;

  status: "active" | "stopped";

  createdAt?: any;
}
