"use client";

import { Badge } from "@/components/ui/badge";
import { Client } from "@/types/client";

interface ClientsTableProps {
  clients: Client[];
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-4">Client Name</th>

            <th className="text-left p-4">Client Code</th>

            <th className="text-left p-4">Contact Person</th>

            <th className="text-left p-4">Billing Rate</th>

            <th className="text-left p-4">Status</th>
          </tr>
        </thead>

        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t">
              <td className="p-4">{client.clientName}</td>

              <td className="p-4">{client.clientCode}</td>

              <td className="p-4">{client.contactPerson}</td>

              <td className="p-4">₹{client.billingRate}</td>

              <td className="p-4">
                <Badge>{client.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
