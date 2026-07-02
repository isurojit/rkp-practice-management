export interface LeaveRequest {
  id?: string;

  userId: string;
  userName: string;

  fromDate: string;
  toDate: string;

  reason: string;

  status: "pending" | "approved" | "rejected";

  createdAt?: any;
}
