"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import {
  getInvoiceById,
  updateInvoiceStatus,
} from "@/lib/services/invoice-service";
import { Invoice } from "@/types/invoice";

export default function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const data = await getInvoiceById(id);
        setInvoice(data as Invoice | null);
      } catch (error) {
        console.error("Failed to load invoice:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [id]);

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <div className="p-6">Loading invoice...</div>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <DashboardHeader />
        <div className="p-6">Invoice not found</div>
      </>
    );
  }
  const handleStatusChange = async (status: "draft" | "generated" | "paid") => {
    if (!invoice?.id) return;

    await updateInvoiceStatus(invoice.id, status);

    setInvoice({
      ...invoice,
      status,
    });
  };

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="print:hidden"
        >
          <h1 className="text-4xl font-black text-slate-800">Invoice</h1>

          <p className="text-slate-600 mt-1">{invoice.invoiceNo}</p>
        </motion.div>
        <div className="print:hidden flex flex-wrap gap-3">
          {["draft", "generated", "paid"].map((status) => (
            <button
              key={status}
              onClick={() =>
                handleStatusChange(status as "draft" | "generated" | "paid")
              }
              className={`rounded-xl border px-4 py-2 font-medium ${
                invoice.status === status
                  ? "bg-sky-600 text-white"
                  : "bg-white/70 text-slate-700"
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="print:hidden rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
        >
          Download / Print Invoice
        </button>

        <div
          id="invoice-print-area"
          className="rounded-3xl border border-sky-100 bg-white/80 backdrop-blur-xl p-8 shadow-lg max-w-4xl print:shadow-none print:border-none print:bg-white"
        >
          <div className="flex justify-between border-b pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                RKP Associates
              </h2>

              <p className="text-slate-500">Professional Services Invoice</p>
            </div>

            <div className="text-right">
              <p className="font-semibold">{invoice.invoiceNo}</p>

              <p className="text-sm text-slate-500">Status: {invoice.status}</p>
            </div>
          </div>

          <div className="grid gap-6 py-6 border-b md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Bill To</p>

              <h3 className="text-xl font-bold text-slate-800">
                {invoice.clientName}
              </h3>
            </div>

            <div className="md:text-right">
              <p className="text-sm text-slate-500">Billing Rate</p>

              <h3 className="text-xl font-bold text-slate-800">
                ₹{invoice.billingRate.toLocaleString("en-IN")} / hr
              </h3>
            </div>
          </div>

          <div className="py-6">
            <table className="w-full">
              <thead className="bg-sky-50">
                <tr>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-right">Hours</th>
                  <th className="p-4 text-right">Rate</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-t">
                  <td className="p-4">Professional service hours</td>

                  <td className="p-4 text-right">
                    {invoice.totalHours.toFixed(2)}
                  </td>

                  <td className="p-4 text-right">
                    ₹{invoice.billingRate.toLocaleString("en-IN")}
                  </td>

                  <td className="p-4 text-right font-semibold">
                    ₹{invoice.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t pt-6">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between">
                <span>Total</span>

                <span className="font-bold">
                  ₹{invoice.amount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-2xl font-black text-slate-800">
                <span>Payable</span>

                <span>₹{invoice.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-sm text-slate-500">
            <p>
              This invoice has been generated from recorded work sessions and
              billable hours in the RKP Associates management system.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
