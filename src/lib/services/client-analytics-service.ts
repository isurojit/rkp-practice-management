import { getClients } from "./client-service";
import { getTimesheets } from "./timesheet-service";
import { getInvoices } from "./invoice-service";

export async function getClientAnalytics() {
  const [clients, timesheets, invoices] = await Promise.all([
    getClients(),
    getTimesheets(),
    getInvoices(),
  ]);

  return clients.map((client: any) => {
    const clientTimesheets = timesheets.filter(
      (item: any) => item.clientId === client.id,
    );

    const totalHours = clientTimesheets.reduce(
      (sum: number, item: any) => sum + Number(item.totalHours || 0),
      0,
    );

    const unbilledHours = clientTimesheets
      .filter((item: any) => item.billingStatus === "unbilled")
      .reduce(
        (sum: number, item: any) => sum + Number(item.totalHours || 0),
        0,
      );

    const billedHours = clientTimesheets
      .filter((item: any) => item.billingStatus === "billed")
      .reduce(
        (sum: number, item: any) => sum + Number(item.totalHours || 0),
        0,
      );

    const clientInvoices = invoices.filter(
      (invoice: any) => invoice.clientId === client.id,
    );

    const invoiceAmount = clientInvoices.reduce(
      (sum: number, invoice: any) => sum + Number(invoice.amount || 0),
      0,
    );

    return {
      clientId: client.id,
      clientName: client.clientName,
      billingRate: Number(client.billingRate || 0),
      totalHours,
      billedHours,
      unbilledHours,
      invoiceAmount,
      invoices: clientInvoices.length,
    };
  });
}
