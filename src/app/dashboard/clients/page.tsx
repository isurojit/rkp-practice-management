"use client";

import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard/dashboard-header";

import ClientsTable from "@/components/clients/clients-table";
import AddClientDialog from "@/components/clients/add-client-dialog";

import { getClients } from "@/lib/services/client-service";
import { Client } from "@/types/client";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await getClients();

        setClients(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  return (
    <>
      <DashboardHeader />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>

            <p className="text-muted-foreground">Manage client records</p>
          </div>

          <AddClientDialog />
        </div>

        {loading ? (
          <div>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="border rounded-xl p-10 text-center">
            No clients found
          </div>
        ) : (
          <ClientsTable clients={clients} />
        )}
      </div>
    </>
  );
}
