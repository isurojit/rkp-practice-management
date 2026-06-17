export interface Invoice {
  id?: string;

  invoiceNo: string;

  clientId: string;
  clientName: string;

  totalHours: number;
  billingRate: number;
  amount: number;

  status: "draft" | "generated" | "paid";

  createdAt?: any;
}
