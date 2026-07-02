export interface InvoiceLineItem {
  timesheetId: string;
  date: string;
  employeeName: string;
  assignmentName: string;
  hours: number;
  description?: string;
}

export interface Invoice {
  id?: string;

  invoiceNo: string;

  clientId: string;
  clientName: string;

  fromDate?: string;
  toDate?: string;

  totalHours: number;
  billingRate: number;
  amount: number;

  lineItems?: InvoiceLineItem[];

  status: "draft" | "generated" | "paid";

  createdAt?: any;
}
