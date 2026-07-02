"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Clock3, FileText, IndianRupee } from "lucide-react";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import { getClientAnalytics } from "@/lib/services/client-analytics-service";

export default function ClientAnalyticsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientAnalytics() {
      try {
        const data = await getClientAnalytics();
        setClients(data);
      } catch (error) {
        console.error("Failed to load client analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    loadClientAnalytics();
  }, []);

  const totalHours = useMemo(
    () => clients.reduce((sum, item) => sum + Number(item.totalHours || 0), 0),
    [clients],
  );

  const totalUnbilledHours = useMemo(
    () =>
      clients.reduce((sum, item) => sum + Number(item.unbilledHours || 0), 0),
    [clients],
  );

  const totalInvoiceAmount = useMemo(
    () =>
      clients.reduce((sum, item) => sum + Number(item.invoiceAmount || 0), 0),
    [clients],
  );

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">
            Client Analytics
          </h1>

          <p className="text-slate-600 mt-1">
            Client-wise hours, billing status and invoice value.
          </p>
        </motion.div>

        {loading ? (
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-8 shadow-lg">
            Loading client analytics...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Clients</p>
                    <h2 className="text-3xl font-black text-slate-800">
                      {clients.length}
                    </h2>
                  </div>

                  <Building2 className="text-sky-600" />
                </div>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Hours</p>
                    <h2 className="text-3xl font-black text-slate-800">
                      {totalHours.toFixed(2)}
                    </h2>
                  </div>

                  <Clock3 className="text-sky-600" />
                </div>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Unbilled Hours</p>
                    <h2 className="text-3xl font-black text-slate-800">
                      {totalUnbilledHours.toFixed(2)}
                    </h2>
                  </div>

                  <FileText className="text-orange-500" />
                </div>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Invoice Value</p>
                    <h2 className="text-3xl font-black text-slate-800">
                      ₹{totalInvoiceAmount.toLocaleString("en-IN")}
                    </h2>
                  </div>

                  <IndianRupee className="text-green-600" />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Client-wise Summary
              </h2>

              {clients.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  No client records found.
                </div>
              ) : (
                <div className="rounded-2xl border bg-white/80 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-sky-50">
                      <tr>
                        <th className="p-4 text-left">Client</th>
                        <th className="p-4 text-left">Total Hours</th>
                        <th className="p-4 text-left">Billed Hours</th>
                        <th className="p-4 text-left">Unbilled Hours</th>
                        <th className="p-4 text-left">Invoices</th>
                        <th className="p-4 text-left">Invoice Value</th>
                      </tr>
                    </thead>

                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.clientId} className="border-t">
                          <td className="p-4 font-medium">
                            {client.clientName}
                          </td>

                          <td className="p-4">
                            {Number(client.totalHours || 0).toFixed(2)}
                          </td>

                          <td className="p-4">
                            {Number(client.billedHours || 0).toFixed(2)}
                          </td>

                          <td className="p-4">
                            {Number(client.unbilledHours || 0).toFixed(2)}
                          </td>

                          <td className="p-4">{client.invoices}</td>

                          <td className="p-4 font-semibold">
                            ₹
                            {Number(client.invoiceAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
