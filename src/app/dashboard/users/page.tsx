"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Users } from "lucide-react";

import AddUserDialog from "@/components/users/add-user-dialog";
import UsersTable from "@/components/users/users-table";
import { getUsers } from "@/lib/services/user-service";
import { useAuth } from "@/providers/auth-provider";
import type { AppUser } from "@/types/user";

export default function UsersPage() {
  const { role } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (loadError) {
      console.error("Failed to load team:", loadError);
      setError("Team records could not be loaded. Check your access permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  return (
    <div className="rkp-page space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">People & Operations</p>
          <h1 className="mt-1 text-3xl font-bold">Team Directory</h1>
          <p className="mt-2 text-slate-500">
            {role === "super_admin"
              ? "Create and manage employee and manager accounts."
              : "Monitor team members and their professional work records."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {role === "super_admin" && <AddUserDialog onCreated={() => void loadUsers()} />}
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-slate-500">
          <Loader2 size={20} className="animate-spin" /> Loading team records...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-14 text-center">
          <Users size={32} className="mx-auto text-blue-300" />
          <p className="mt-4 font-bold text-slate-800">No team members found</p>
          <p className="mt-1 text-sm text-slate-500">A Super Admin can invite the first employee.</p>
        </div>
      ) : (
        <UsersTable users={users} />
      )}
    </div>
  );
}
