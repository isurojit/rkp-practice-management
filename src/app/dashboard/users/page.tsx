"use client";

import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import AddUserDialog from "@/components/users/add-user-dialog";
import UsersTable from "@/components/users/users-table";

import { getUsers } from "@/lib/services/user-service";
import { AppUser } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <>
      <DashboardHeader />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">
              Manage employees and system users
            </p>
          </div>

          <AddUserDialog />
        </div>

        {/* Content */}
        {loading ? (
          <div className="border rounded-xl p-10 text-center">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="border rounded-xl p-10 text-center text-muted-foreground">
            No users found
          </div>
        ) : (
          <UsersTable users={users} />
        )}
      </div>
    </>
  );
}
