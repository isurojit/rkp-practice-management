"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";


import { getClients } from "@/lib/services/client-service";
import { getClientBillingData } from "@/lib/services/billing-service";
import { createInvoice } from "@/lib/services/invoice-service";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await getClients();
        setClients(data);
      } catch (error) {
        console.error("Failed to load clients:", error);
      }
    }

    loadClients();
  }, []);

  const selectedClientData = clients.find(
    (client) => client.id === selectedClient,
  );

  const billingRate = Number(selectedClientData?.billingRate || 0);

  const billingAmount = billingData ? billingData.totalHours * billingRate : 0;

  const loadBillingReport = async (
    clientId: string,
    start?: string,
    end?: string,
  ) => {
    if (!clientId) return;

    try {
      setLoading(true);

      const data = await getClientBillingData(clientId, start, end);
      setBillingData(data);
    } catch (error) {
      console.error("Failed to load billing report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId);
    setBillingData(null);

    await loadBillingReport(clientId, fromDate, toDate);
  };

  const handleApplyFilter = async () => {
    if (!selectedClient) {
      alert("Please select a client first.");
      return;
    }

    await loadBillingReport(selectedClient, fromDate, toDate);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedClientData || !billingData) {
      alert("Please select a client first.");
      return;
    }

    if (billingData.timesheets.length === 0 || billingData.totalHours <= 0) {
      alert("No unbilled billable sessions available for this client.");
      return;
    }

    try {
      setGenerating(true);

      const invoiceRef = await createInvoice({
        invoiceNo: "GENERATED_BY_SERVER",

        clientId: selectedClientData.id,
        clientName: selectedClientData.clientName,

        fromDate,
        toDate,

        totalHours: billingData.totalHours,
        billingRate,
        amount: billingAmount,

        lineItems: billingData.timesheets.map((item: any) => ({
          timesheetId: item.id,
          date: item.date,
          employeeName: item.userName,
          assignmentName: item.assignmentName,
          hours: Number(item.totalHours || 0),
          description: item.workDescription || "",
        })),

        status: "generated",
      });

      router.push(`/dashboard/invoices/${invoiceRef.id}`);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      alert(error instanceof Error ? error.message : "Unable to generate invoice");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="rkp-page min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">Reports</h1>

          <p className="text-slate-600 mt-1">
            Client-wise billing and period-wise unbilled work-hour reports
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Client Billing Report
          </h2>

          <div className="grid gap-4 md:grid-cols-4">
            <Select value={selectedClient} onValueChange={handleClientChange}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>

              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white"
            />

            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white"
            />

            <button
              onClick={handleApplyFilter}
              className="rounded-xl bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-700"
            >
              Apply Filter
            </button>
          </div>

          {loading && (
            <div className="mt-6 rounded-2xl border bg-white/80 p-6 text-slate-500">
              Loading billing report...
            </div>
          )}

          {!loading && selectedClient && billingData && (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Unbilled Hours</p>

                  <h3 className="text-3xl font-bold text-slate-800">
                    {billingData.totalHours.toFixed(2)}
                  </h3>
                </div>

                <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Billing Rate</p>

                  <h3 className="text-3xl font-bold text-slate-800">
                    ₹{billingRate.toLocaleString("en-IN")}
                  </h3>
                </div>

                <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Invoice Amount</p>

                  <h3 className="text-3xl font-bold text-slate-800">
                    ₹{billingAmount.toLocaleString("en-IN")}
                  </h3>
                </div>

                <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Unbilled Sessions</p>

                  <h3 className="text-3xl font-bold text-slate-800">
                    {billingData.timesheets.length}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleGenerateInvoice}
                disabled={generating}
                className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {generating ? "Generating Invoice..." : "Generate Invoice"}
              </button>

              <div className="rounded-2xl border bg-white/80 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Employee</th>
                      <th className="p-4 text-left">Assignment</th>
                      <th className="p-4 text-left">Hours</th>
                      <th className="p-4 text-left">Description</th>
                    </tr>
                  </thead>

                  <tbody>
                    {billingData.timesheets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-slate-500"
                        >
                          No unbilled work sessions found for this client and
                          period.
                        </td>
                      </tr>
                    ) : (
                      billingData.timesheets.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-4">{item.date}</td>

                          <td className="p-4">{item.userName}</td>

                          <td className="p-4">{item.assignmentName}</td>

                          <td className="p-4">
                            {Number(item.totalHours || 0).toFixed(2)}
                          </td>

                          <td className="p-4">{item.workDescription || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!selectedClient && (
            <div className="mt-6 rounded-2xl border border-dashed bg-white/60 p-8 text-center text-slate-500">
              Select a client to view unbilled billing report.
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
