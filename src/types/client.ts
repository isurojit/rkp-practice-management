export interface Client {
  id?: string;
  clientName: string;
  clientCode: string;
  gstNo?: string;
  panNo?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  billingRate?: number;
  status: "active" | "inactive";
  createdAt?: any;
}
