"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  Clock3,
  FileText,
  IndianRupee,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { getClientAnalytics } from "@/lib/services/client-analytics-service";

type ClientRecord = Awaited<ReturnType<typeof getClientAnalytics>>[number];

function formatCurrency(value: number): string {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatHours(value: number): string {
  return Number(value || 0).toFixed(2);
}

export default function ClientAnalyticsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setClients(await getClientAnalytics());
    } catch (cause) {
      console.error("Failed to load client analytics:", cause);
      setError("Client data could not be loaded. Check your access permissions or retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const summary = useMemo(() => ({
    totalHours: clients.reduce((sum, item) => sum + Number(item.totalHours || 0), 0),
    unbilledHours: clients.reduce((sum, item) => sum + Number(item.unbilledHours || 0), 0),
    invoiceAmount: clients.reduce((sum, item) => sum + Number(item.invoiceAmount || 0), 0),
  }), [clients]);

  const metrics = [
    {
      title: "Clients",
      value: clients.length.toLocaleString("en-IN"),
      detail: "Client records",
      icon: Building2,
      tone: "blue",
    },
    {
      title: "Total Hours",
      value: formatHours(summary.totalHours),
      detail: "Recorded work time",
      icon: Clock3,
      tone: "indigo",
    },
    {
      title: "Unbilled Hours",
      value: formatHours(summary.unbilledHours),
      detail: "Pending invoicing",
      icon: FileText,
      tone: "amber",
    },
    {
      title: "Invoice Value",
      value: formatCurrency(summary.invoiceAmount),
      detail: "All recorded invoices",
      icon: IndianRupee,
      tone: "teal",
    },
  ] as const;

  return (
    <div className="rkp-page space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rkp-hero-panel flex flex-col justify-between gap-5 sm:flex-row sm:items-center"
      >
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-700 dark:text-sky-300">
            Practice intelligence / Clients
          </p>
          <h1 className="text-[clamp(1.9rem,3vw,2.75rem)] font-extrabold tracking-[-0.045em]">
            Client Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Client-wise work hours, billing status, and invoice value — all in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="rkp-secondary-action inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.header>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rkp-surface-card flex min-h-56 items-center justify-center gap-3 rounded-3xl text-sm font-medium text-slate-600">
          <Loader2 size={20} className="animate-spin" aria-hidden="true" />
          Loading client analytics…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ title, value, detail, icon: Icon, tone }, index) => (
              <motion.section
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className={`rkp-metric-card rkp-metric-card--${tone} relative overflow-hidden rounded-[22px] p-5 sm:p-6`}
                aria-label={`${title}: ${value}`}
              >
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <p className="rkp-metric-label text-sm font-semibold">{title}</p>
                  <span className="rkp-metric-icon inline-flex h-11 w-11 items-center justify-center rounded-2xl">
                    <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                </div>
                <p className="rkp-metric-value relative z-10 mt-3 truncate text-[clamp(1.75rem,2.4vw,2.25rem)] font-extrabold tracking-tight">
                  {value}
                </p>
                <p className="rkp-metric-detail relative z-10 mt-3 flex items-center gap-2 text-xs font-medium">
                  <span className="rkp-metric-dot h-1.5 w-1.5 rounded-full" />
                  {detail}
                </p>
              </motion.section>
            ))}
          </div>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rkp-surface-card rounded-[24px] p-4 sm:p-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Client-wise Summary</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Detailed distribution of hours, invoicing and billed balances
                </p>
              </div>
              <span className="rkp-secondary-action inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
                {clients.length} clients
                <ArrowUpRight size={14} aria-hidden="true" />
              </span>
            </div>

            {clients.length === 0 ? (
              <div className="rkp-empty-surface rounded-2xl border border-dashed px-5 py-12 text-center">
                <Building2 className="mx-auto text-blue-600 dark:text-sky-300" size={27} aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">No client records found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Client analytics will populate as your firm adds engagements.
                </p>
              </div>
            ) : (
              <div className="rkp-table-shell">
                <table aria-label="Client-wise billing and working hour summary">
                  <thead>
                    <tr>
                      <th scope="col" className="text-left">Client</th>
                      <th scope="col" className="text-right">Total Hours</th>
                      <th scope="col" className="text-right">Billed Hours</th>
                      <th scope="col" className="text-right">Unbilled Hours</th>
                      <th scope="col" className="text-right">Invoices</th>
                      <th scope="col" className="text-right">Invoice Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={String(client.clientId)}>
                        <td className="font-semibold">
                          {client.clientName || "Unnamed client"}
                        </td>
                        <td className="text-right tabular-nums">{formatHours(client.totalHours)}</td>
                        <td className="text-right tabular-nums">{formatHours(client.billedHours)}</td>
                        <td className="text-right tabular-nums">{formatHours(client.unbilledHours)}</td>
                        <td className="text-right tabular-nums">{client.invoices}</td>
                        <td className="text-right font-bold tabular-nums">
                          {formatCurrency(client.invoiceAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}
