"use client";

import { Building2, IndianRupee } from "lucide-react";
import { Client } from "@/types/client";

interface ClientsTableProps {
  clients: Client[];
}

function formatRate(rate?: number) {
  return Number(rate || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function ClientStatus({ status }: { status: Client["status"] }) {
  const active = status === "active";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#e5eaf3] bg-white shadow-[0_3px_18px_rgba(18,35,63,.035)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-800">Client directory</h2>
          <p className="mt-1 text-xs text-slate-500">Practice relationships and billing profiles</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{clients.length} clients</span>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {clients.map((client, index) => (
          <div key={client.id || client.clientCode || index} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Building2 size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-bold text-slate-800">{client.clientName}</h3>
                <p className="mt-1 text-xs text-slate-500">Code: {client.clientCode || "—"}</p>
              </div>
              <ClientStatus status={client.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs">
              <div><p className="text-slate-400">Contact person</p><p className="mt-1 font-semibold text-slate-700">{client.contactPerson || "—"}</p></div>
              <div><p className="text-slate-400">Billing rate</p><p className="mt-1 flex items-center font-semibold text-slate-700"><IndianRupee size={12} />{formatRate(client.billingRate)} / hr</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Client name</th>
              <th className="text-left">Client code</th>
              <th className="text-left">Contact person</th>
              <th className="text-left">Billing rate</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <tr key={client.id || client.clientCode || index}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 size={18} /></span>
                    <span className="font-semibold text-slate-800">{client.clientName}</span>
                  </div>
                </td>
                <td className="font-medium text-slate-600">{client.clientCode || "—"}</td>
                <td>{client.contactPerson || "—"}</td>
                <td className="font-semibold text-slate-700">₹{formatRate(client.billingRate)} / hr</td>
                <td><ClientStatus status={client.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
