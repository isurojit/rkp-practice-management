"use client";

import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import StartWorkDialog from "@/components/timesheets/start-work-dialog";
import ActiveSessionCard from "@/components/timesheets/active-session-card";

import { getActiveTimesheet } from "@/lib/services/timesheet-service";
import { useAuth } from "@/providers/auth-provider";
import {
  getTimesheets,
  getUserTimesheets,
} from "@/lib/services/timesheet-service";

import TimesheetHistoryTable from "@/components/timesheets/timesheet-history-table";

export default function TimesheetsPage() {
  const { user, role } = useAuth();

  const [activeSession, setActiveSession] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<any[]>([]);

  useEffect(() => {
    async function loadSession() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      let history = [];

      if (role === "super_admin") {
        history = await getTimesheets();
      } else {
        history = await getUserTimesheets(user.uid);
      }

      setTimesheets(history);

      try {
        const active = await getActiveTimesheet(user.uid);

        setActiveSession(active);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [user]);

  return (
    <>
      <DashboardHeader />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timesheets</h1>

            <p className="text-muted-foreground">Track employee work hours</p>
          </div>

          <StartWorkDialog />
        </div>

        {loading ? (
          <div className="border rounded-xl p-6">Loading...</div>
        ) : (
          <>
            {activeSession ? (
              <ActiveSessionCard session={activeSession} />
            ) : (
              <div className="border rounded-xl p-10 text-center text-muted-foreground">
                No active work session
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Timesheet History</h2>

              {timesheets.length === 0 ? (
                <div className="border rounded-xl p-6 text-center">
                  No timesheets found
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
