"use client";

import { use, useEffect, useMemo, useState } from "react";


import TimesheetHistoryTable from "@/components/timesheets/timesheet-history-table";

import { getUserById } from "@/lib/services/user-service";
import { getUserTimesheets } from "@/lib/services/timesheet-service";

import { Timesheet } from "@/types/timesheet";

export default function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [employee, setEmployee] = useState<any>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const employeeData = await getUserById(id);
        setEmployee(employeeData);

        const data = await getUserTimesheets(id);
        setTimesheets(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const totalHours = useMemo(() => {
    return timesheets.reduce(
      (sum, item) => sum + Number(item.totalHours || 0),
      0,
    );
  }, [timesheets]);

  const activeSession = timesheets.find((item) => item.status === "active");

  return (
    <>
      <div className="rkp-page min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800">
            {employee?.name || "Employee Work Record"}
          </h1>

          <p className="text-slate-600 mt-1">
            {employee?.email ||
              "View task-wise work history and active sessions."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Total Sessions</p>
            <h2 className="text-3xl font-bold text-slate-800">
              {timesheets.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Total Hours</p>
            <h2 className="text-3xl font-bold text-slate-800">
              {totalHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Current Status</p>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeSession ? "Working Now" : "Not Working"}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-8">
            Loading employee records...
          </div>
        ) : (
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Work History
            </h2>

            {timesheets.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                No work records found
              </div>
            ) : (
              <TimesheetHistoryTable timesheets={timesheets} />
            )}
          </div>
        )}
      </div>
    </>
  );
}
