"use client";

import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import StartWorkDialog from "@/components/timesheets/start-work-dialog";
import ActiveSessionCard from "@/components/timesheets/active-session-card";
import TimesheetHistoryTable from "@/components/timesheets/timesheet-history-table";

import {
  getActiveTimesheet,
  getTimesheets,
  getUserTimesheets,
} from "@/lib/services/timesheet-service";

import { useAuth } from "@/providers/auth-provider";

export default function TimesheetsPage() {
  const { user, role } = useAuth();

  const [activeSession, setActiveSession] = useState<any>(null);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimesheetData() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const active = await getActiveTimesheet(user.uid);
        setActiveSession(active);

        const history =
          role === "super_admin"
            ? await getTimesheets()
            : await getUserTimesheets(user.uid);

        setTimesheets(history);
      } catch (error) {
        console.error("Timesheet loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTimesheetData();
  }, [user, role]);

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-800">Timesheets</h1>

            <p className="text-slate-600 mt-1">
              Start, stop and switch between assignment or miscellaneous work
              sessions.
            </p>
          </div>

          {!activeSession && <StartWorkDialog />}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-8 shadow-lg">
            Loading timesheets...
          </div>
        ) : (
          <>
            {activeSession ? (
              <ActiveSessionCard session={activeSession} />
            ) : (
              <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-10 text-center text-slate-500 shadow-lg">
                No active work session. You can start a new task.
              </div>
            )}

            <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Work Session History
              </h2>

              {timesheets.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  No timesheet records found
                </div>
              ) : (
                <TimesheetHistoryTable timesheets={timesheets} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
