"use client";

import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTableProps {
  users: User[];
}

function roleName(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#e5eaf3] bg-white shadow-[0_3px_18px_rgba(18,35,63,.035)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-800">Team directory</h2>
          <p className="mt-1 text-xs text-slate-500">{users.length} people in your workspace</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{users.length} members</span>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {users.map((user) => (
          <Link
            key={user.uid}
            href={`/dashboard/users/${user.uid}`}
            className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
              {user.name.charAt(0).toUpperCase() || "U"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-800">{user.name}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{user.email}</span>
              <span className="mt-2 inline-flex rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {roleName(user.role)}
              </span>
            </span>
            <ArrowUpRight size={17} className="shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Employee</th>
              <th className="text-left">Contact</th>
              <th className="text-left">Access role</th>
              <th className="text-right">Profile</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                      {user.name.charAt(0).toUpperCase() || "U"}
                    </span>
                    <Link href={`/dashboard/users/${user.uid}`} className="font-semibold text-slate-800 hover:text-blue-700">
                      {user.name}
                    </Link>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-2 text-slate-600"><Mail size={15} className="text-slate-400" /> {user.email}</span>
                </td>
                <td>
                  <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                    {roleName(user.role)}
                  </span>
                </td>
                <td className="text-right">
                  <Link href={`/dashboard/users/${user.uid}`} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">
                    View <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
