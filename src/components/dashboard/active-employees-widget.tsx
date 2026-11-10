"use client";

import { Activity, UsersRound } from "lucide-react";

interface ActiveEmployee {
  id?: string;
  userId?: string;
  userName?: string;
  assignmentName?: string;
}

export default function ActiveEmployeesWidget({ employees }: { employees: ActiveEmployee[] }) {
  return (
    <section className="rkp-surface-card rounded-[24px] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rkp-metric-card--teal rkp-metric-icon inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200">
              <Activity size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <h2 className="text-[18px] font-bold tracking-tight">
              Employees working right now
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Live work session overview
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {employees.length} active
        </span>
      </div>

      {employees.length === 0 ? (
        <div className="rkp-empty-surface flex flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-9 text-center">
          <span className="rkp-empty-icon flex h-12 w-12 items-center justify-center rounded-2xl">
            <UsersRound size={23} aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-bold">No active work sessions</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Team members currently tracking time will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {employees.map((employee, index) => (
            <li key={employee.id || employee.userId || index} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-3">
                <span className="rkp-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                  {String(employee.userName || "E").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{employee.userName || "Employee"}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{employee.assignmentName || "Work in progress"}</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Working
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
