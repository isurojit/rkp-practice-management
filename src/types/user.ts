export type UserRole = "super_admin" | "manager" | "employee";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  active?: boolean;
  createdAt?: any;
}
