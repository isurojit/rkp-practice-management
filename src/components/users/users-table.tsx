"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-4">Name</th>

            <th className="text-left p-4">Email</th>

            <th className="text-left p-4">Role</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.uid} className="border-t">
              <td className="p-4">
                <Link
                  href={`/dashboard/users/${user.uid}`}
                  className="font-medium hover:underline"
                >
                  {user.name}
                </Link>
              </td>

              <td className="p-4">{user.email}</td>

              <td className="p-4">
                <Badge>{user.role}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
