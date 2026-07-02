export interface Attendance {
  id?: string;

  userId: string;
  userName: string;

  date: string;

  checkIn: string;
  checkOut?: string;

  status: "present" | "half_day" | "absent";

  locationType: "office" | "home" | "client_site" | "other";

  createdAt?: any;
}
