"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";


import { getInvoices } from "@/lib/services/invoice-service";
import { Invoice } from "@/types/invoice";
import Link from "next/link";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error("Failed to load invoices:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  return (
    <>
      <div className="rkp-page min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">Invoices</h1>
          <p className="text-slate-600 mt-1">View generated client invoices</p>
        </motion.div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
          {loading ? (
            <div className="text-slate-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              No invoices generated yet.
            </div>
          ) : (
            <div className="rounded-2xl border bg-white/80 overflow-hidden">
              <table className="w-full">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="p-4 text-left">Invoice No</th>
                    <th className="p-4 text-left">Client</th>
                    <th className="p-4 text-left">Hours</th>
                    <th className="p-4 text-left">Rate</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t">
                      <td className="p-4">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="font-semibold text-sky-700 hover:underline"
                        >
                          {invoice.invoiceNo}
                        </Link>
                      </td>
                      <td className="p-4">{invoice.clientName}</td>
                      <td className="p-4">{invoice.totalHours.toFixed(2)}</td>
                      <td className="p-4">
                        ₹{invoice.billingRate.toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 font-semibold">
                        ₹{invoice.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-4">{invoice.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
