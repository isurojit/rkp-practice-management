"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowUpRight, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import type { AppUser } from "@/types/user";

interface UsersTableProps {
  users: AppUser[];
}

function roleName(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function UsersTable({ users }: UsersTableProps) {
  const { role } = useAuth();
  const [resettingUid, setResettingUid] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canResetPasswords = role === "super_admin";

  async function requestReset(employee: AppUser) {
    if (!canResetPasswords || resettingUid) return;
    const email = employee.email?.trim();
    if (!email) {
      setNotice({ type: "error", text: "This employee does not have a registered email address." });
      return;
    }

    if (!window.confirm("Send a password reset email to " + email + "?")) return;

    setNotice(null);
    setResettingUid(employee.uid);
    try {
      // Firebase sends the reset link to the user; the Super Admin never sees
      // or changes the employee's password and is not signed out.
      await sendPasswordResetEmail(auth, email);
      setNotice({
        type: "success",
        text: "Password reset requested for " + email + ". Ask the employee to check their inbox and spam folder.",
      });
    } catch (error) {
      console.error("Employee password reset request failed:", error);
      setNotice({
        type: "error",
        text: "Unable to send the reset email. Check Firebase email/password provider, authorized domains and email quotas.",
      });
    } finally {
      setResettingUid(null);
    }
  }

  function ResetButton({ employee }: { employee: AppUser }) {
    if (!canResetPasswords) return null;
    return (
      <button
        type="button"
        disabled={Boolean(resettingUid) || !employee.email}
        onClick={() => void requestReset(employee)}
        title={"Send reset email to " + employee.email}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resettingUid === employee.uid
          ? <Loader2 size={15} className="animate-spin"/>
          : <KeyRound size={15}/>}
        {resettingUid === employee.uid ? "Sending..." : "Send password reset"}
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#e5eaf3] bg-white shadow-[0_3px_18px_rgba(18,35,63,.035)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-800">Team directory</h2>
          <p className="mt-1 text-xs text-slate-500">
            {users.length} members · Password recovery is managed through Firebase
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {users.length} members
        </span>
      </div>

      {notice && (
        <div role={notice.type === "error" ? "alert" : "status"}
          className={notice.type === "error"
            ? "m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            : "m-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"}>
          {notice.type === "success" && <ShieldCheck size={17} className="mt-0.5 shrink-0"/>}
          {notice.text}
        </div>
      )}

      <div className="space-y-3 p-4 md:hidden">
        {users.map((employee) => (
          <div key={employee.uid} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                {employee.name?.charAt(0).toUpperCase() || "U"}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={"/dashboard/users/" + employee.uid}
                  className="block truncate text-sm font-bold text-slate-800 hover:text-blue-700">
                  {employee.name || "Employee"}
                </Link>
                <p className="mt-1 truncate text-xs text-slate-500">{employee.email}</p>
                <span className="mt-2 inline-flex rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {roleName(employee.role)}
                </span>
              </div>
              <Link href={"/dashboard/users/" + employee.uid} aria-label={"Open " + employee.name + " profile"}>
                <ArrowUpRight size={17} className="text-slate-400"/>
              </Link>
            </div>
            {canResetPasswords && <div className="mt-3 border-t border-slate-100 pt-3"><ResetButton employee={employee}/></div>}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Employee</th>
              <th className="text-left">Contact</th>
              <th className="text-left">Access role</th>
              {canResetPasswords && <th className="text-left">Password recovery</th>}
              <th className="text-right">Profile</th>
            </tr>
          </thead>
          <tbody>
            {users.map((employee) => (
              <tr key={employee.uid}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                      {employee.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                    <Link href={"/dashboard/users/" + employee.uid}
                      className="font-semibold text-slate-800 hover:text-blue-700">
                      {employee.name || "Employee"}
                    </Link>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <Mail size={15} className="text-slate-400"/> {employee.email}
                  </span>
                </td>
                <td>
                  <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                    {roleName(employee.role)}
                  </span>
                </td>
                {canResetPasswords && <td><ResetButton employee={employee}/></td>}
                <td className="text-right">
                  <Link href={"/dashboard/users/" + employee.uid}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">
                    View <ArrowUpRight size={14}/>
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
