export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: "super_admin" | "manager" | "employee";
  designation?: string;
  active?: boolean;
  createdAt?: any;
}
