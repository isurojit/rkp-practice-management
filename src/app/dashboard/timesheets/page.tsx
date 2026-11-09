"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileClock,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  TimerReset,
} from "lucide-react";


import StartWorkDialog from "@/components/timesheets/start-work-dialog";
import ActiveSessionCard from "@/components/timesheets/active-session-card";
import TimesheetHistoryTable from "@/components/timesheets/timesheet-history-table";

import { Button } from "@/components/ui/button";

import {
  getActiveTimesheet,
  getTimesheets,
  getUserTimesheets,
} from "@/lib/services/timesheet-service";

import { useAuth } from "@/providers/auth-provider";

import { Timesheet } from "@/types/timesheet";

type TimesheetStatusFilter = "all" | "active" | "paused" | "completed";

interface PageMessage {
  type: "success" | "error";
  text: string;
}

function normaliseText(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getTimesheetMinutes(timesheet: Timesheet): number {
  const extendedTimesheet = timesheet as Timesheet & {
    totalMinutes?: number;
  };

  if (typeof extendedTimesheet.totalMinutes === "number") {
    return extendedTimesheet.totalMinutes;
  }

  if (typeof timesheet.totalHours === "number") {
    return Math.round(timesheet.totalHours * 60);
  }

  return 0;
}

function getLocalDateString(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function TimesheetsPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [activeSession, setActiveSession] = useState<Timesheet | null>(null);

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<TimesheetStatusFilter>("all");

  const [message, setMessage] = useState<PageMessage | null>(null);

  const canViewAllTimesheets =
    role === "super_admin" || role === "admin" || role === "manager";

  const loadTimesheetData = useCallback(
    async ({
      showPageLoader = false,
      showRefreshLoader = false,
    }: {
      showPageLoader?: boolean;
      showRefreshLoader?: boolean;
    } = {}) => {
      if (!user?.uid) {
        setActiveSession(null);
        setTimesheets([]);
        setLoading(false);
        return;
      }

      if (showPageLoader) {
        setLoading(true);
      }

      if (showRefreshLoader) {
        setRefreshing(true);
      }

      try {
        setMessage(null);

        const [history, active] = await Promise.all([
          canViewAllTimesheets ? getTimesheets() : getUserTimesheets(user.uid),

          getActiveTimesheet(user.uid),
        ]);

        setTimesheets(history);
        setActiveSession(active);

        if (showRefreshLoader) {
          setMessage({
            type: "success",
            text: "Timesheet records refreshed successfully.",
          });
        }
      } catch (error) {
        console.error("Failed to load timesheet data:", error);

        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Timesheet records could not be loaded.",
        });
      } finally {
        if (showPageLoader) {
          setLoading(false);
        }

        if (showRefreshLoader) {
          setRefreshing(false);
        }
      }
    },
    [canViewAllTimesheets, user?.uid],
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void loadTimesheetData({
      showPageLoader: true,
    });
  }, [authLoading, loadTimesheetData]);

  useEffect(() => {
    const refreshOnFocus = () => {
      void loadTimesheetData();
    };

    window.addEventListener("focus", refreshOnFocus);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [loadTimesheetData]);

  const filteredTimesheets = useMemo(() => {
    const cleanedSearch = normaliseText(searchTerm);

    return timesheets.filter((timesheet) => {
      if (statusFilter !== "all" && timesheet.status !== statusFilter) {
        return false;
      }

      if (!cleanedSearch) {
        return true;
      }

      const searchableText = [
        timesheet.userName,
        timesheet.assignmentName,
        timesheet.clientName,
        timesheet.narration,
        timesheet.workDescription,
        timesheet.miscellaneousNarration,
        timesheet.date,
        timesheet.status,
      ]
        .map(normaliseText)
        .join(" ");

      return searchableText.includes(cleanedSearch);
    });
  }, [searchTerm, statusFilter, timesheets]);

  const summary = useMemo(() => {
    const today = getLocalDateString();

    return timesheets.reduce(
      (result, timesheet) => {
        const minutes = getTimesheetMinutes(timesheet);

        result.totalMinutes += minutes;

        if (timesheet.date === today) {
          result.todayMinutes += minutes;
        }

        switch (timesheet.status) {
          case "active":
            result.active += 1;
            break;

          case "paused":
            result.paused += 1;
            break;

          case "completed":
            result.completed += 1;
            break;
        }

        return result;
      },
      {
        totalMinutes: 0,
        todayMinutes: 0,
        active: 0,
        paused: 0,
        completed: 0,
      },
    );
  }, [timesheets]);

  const statusOptions: Array<{
    value: TimesheetStatusFilter;
    label: string;
  }> = [
    {
      value: "all",
      label: "All Sessions",
    },
    {
      value: "active",
      label: "Active",
    },
    {
      value: "paused",
      label: "Paused",
    },
    {
      value: "completed",
      label: "Completed",
    },
  ];

  if (authLoading || loading) {
    return (
      <>
        <div className="rkp-page min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-6">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center rounded-3xl border border-sky-100 bg-white/75 px-8 py-6 text-slate-500 shadow-xl backdrop-blur-xl">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Loading timesheets...
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rkp-page min-h-screen space-y-6 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Work Session Management
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-800 sm:text-4xl">
              Timesheets
            </h1>

            <p className="mt-2 text-slate-600">
              {canViewAllTimesheets
                ? "Review employee work sessions, recorded hours and assignment activity."
                : "Review your active session and completed work history."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() =>
                void loadTimesheetData({
                  showRefreshLoader: true,
                })
              }
              className="gap-2 rounded-xl border-sky-200 bg-white/80"
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}

              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>

            <StartWorkDialog onWorkStarted={() => void loadTimesheetData()} />
          </div>
        </div>

        {message && (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
            )}

            <span>{message.text}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-sky-100 bg-white/75 p-5 shadow-lg">
            <FileClock className="text-sky-700" />

            <p className="mt-4 text-sm text-slate-500">Total Sessions</p>

            <p className="text-3xl font-black text-slate-800">
              {timesheets.length}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white/75 p-5 shadow-lg">
            <PlayCircle className="text-emerald-700" />

            <p className="mt-4 text-sm text-slate-500">Active Sessions</p>

            <p className="text-3xl font-black text-slate-800">
              {summary.active}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white/75 p-5 shadow-lg">
            <PauseCircle className="text-amber-700" />

            <p className="mt-4 text-sm text-slate-500">Paused Sessions</p>

            <p className="text-3xl font-black text-slate-800">
              {summary.paused}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white/75 p-5 shadow-lg">
            <Clock3 className="text-violet-700" />

            <p className="mt-4 text-sm text-slate-500">Today&apos;s Hours</p>

            <p className="text-3xl font-black text-slate-800">
              {(summary.todayMinutes / 60).toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/75 p-5 shadow-lg">
            <TimerReset className="text-blue-700" />

            <p className="mt-4 text-sm text-slate-500">Total Recorded Hours</p>

            <p className="text-3xl font-black text-slate-800">
              {(summary.totalMinutes / 60).toFixed(2)}
            </p>
          </div>
        </div>

        {activeSession ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-2 shadow-lg">
            <div className="mb-2 flex items-center gap-2 px-4 pt-3 text-sm font-bold text-emerald-800">
              <PlayCircle size={18} />
              Your Active Work Session
            </div>

            <ActiveSessionCard
              session={activeSession}
              onSessionEnded={() =>
                void loadTimesheetData({
                  showRefreshLoader: true,
                })
              }
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-sky-100 bg-white/75 p-8 text-center shadow-lg">
            <Clock3 size={38} className="mx-auto text-sky-300" />

            <h2 className="mt-4 text-xl font-bold text-slate-800">
              No active work session
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Start miscellaneous work here, or open an assigned task to start
              or resume assignment-based work.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-sky-100 bg-white/75 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  canViewAllTimesheets
                    ? "Search employee, assignment, client or narration..."
                    : "Search assignment, client or narration..."
                }
                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === option.value
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-sky-100 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/75 p-4 shadow-lg backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Timesheet History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredTimesheets.length} of {timesheets.length} work
                sessions.
              </p>
            </div>

            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
              {canViewAllTimesheets ? "All Employees" : "My Sessions"}
            </span>
          </div>

          {filteredTimesheets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-10 text-center">
              <FileClock size={36} className="mx-auto text-sky-300" />

              <h3 className="mt-4 font-bold text-slate-800">
                No timesheets found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {timesheets.length === 0
                  ? "No work sessions have been recorded yet."
                  : "No records match the selected search and status filter."}
              </p>

              {(searchTerm || statusFilter !== "all") && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="mt-5 rounded-xl"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <TimesheetHistoryTable timesheets={filteredTimesheets} />
          )}
        </div>
      </div>
    </>
  );
}
