"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, RefreshCw } from "lucide-react";

import ClientsTable from "@/components/clients/clients-table";
import AddClientDialog from "@/components/clients/add-client-dialog";
import { getClients } from "@/lib/services/client-service";
import type { Client } from "@/types/client";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setClients(await getClients());
    } catch (loadError) {
      console.error("Client records could not be loaded:", loadError);
      setError("Unable to load clients. Verify Firestore permissions and connectivity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadClients(); }, [loadClients]);

  return (
    <div className="rkp-page space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Practice Directory</p>
          <h1 className="mt-1">Clients</h1>
          <p className="mt-2 text-slate-500">
            Manage tax returns, statutory audits, internal audits and other client engagements.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadClients()}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <AddClientDialog onCreated={() => void loadClients()} />
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-slate-500">
          <Loader2 size={20} className="animate-spin" /> Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Building2 size={32} className="mx-auto text-blue-300" />
          <p className="mt-4 font-bold text-slate-800">No clients registered</p>
          <p className="mt-1 text-sm text-slate-500">A Super Admin can create the first client record.</p>
        </div>
      ) : (
        <ClientsTable clients={clients} />
      )}
    </div>
  );
}
