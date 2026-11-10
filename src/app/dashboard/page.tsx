"use client";

import Link from "next/link";

import { useCallback, useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";

import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileBarChart,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  TimerReset,
  Users,
} from "lucide-react";


import DashboardCards from "@/components/dashboard/dashboard-cards";
import ActiveEmployeesWidget from "@/components/dashboard/active-employees-widget";

import { Button } from "@/components/ui/button";

import { getDashboardStats } from "@/lib/services/dashboard-service";

import { getActiveTimesheets, getUserTimesheets } from "@/lib/services/timesheet-service";

import { getAssignments } from "@/lib/services/assignment-service";

import { useAuth } from "@/providers/auth-provider";

import { Assignment } from "@/types/assignment";
import { Timesheet } from "@/types/timesheet";

interface DashboardMessage {
  type: "success" | "error";
  text: string;
}

interface EmployeeDashboardCounts {
  assigned: number;
  accepted: number;
  inProgress: number;
  paused: number;
  completed: number;
}

function getAssignedEmployeeId(
  employee:
    | string
    | {
        uid?: string;
      },
): string {
  if (typeof employee === "string") {
    return employee;
  }

  return employee.uid || "";
}

function getTimestampMilliseconds(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (
      value as {
        toMillis?: unknown;
      }
    ).toMillis === "function"
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .getTime();
  }

  const date = new Date(value as string | number | Date);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getTimesheetMinutes(timesheet: Timesheet): number {
  const extendedTimesheet = timesheet as Timesheet & {
    totalMinutes?: number;
    startTime?: unknown;
    endTime?: unknown;
    checkIn?: unknown;
    checkOut?: unknown;
  };

  if (typeof extendedTimesheet.totalMinutes === "number") {
    return extendedTimesheet.totalMinutes;
  }

  if (typeof timesheet.totalHours === "number") {
    return Math.round(timesheet.totalHours * 60);
  }

  const startMilliseconds = getTimestampMilliseconds(
    extendedTimesheet.startTime || extendedTimesheet.checkIn,
  );

  const endMilliseconds = getTimestampMilliseconds(
    extendedTimesheet.endTime || extendedTimesheet.checkOut,
  );

  if (startMilliseconds <= 0 || endMilliseconds <= startMilliseconds) {
    return 0;
  }

  return Math.round((endMilliseconds - startMilliseconds) / 60000);
}

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getEmployeeAssignmentStatus(
  assignment: Assignment,
  userId: string,
): string {
  const employeeProgress = assignment.employeeProgress?.find(
    (item) => item.userId === userId,
  );

  return employeeProgress?.status || assignment.status || "assigned";
}

function getAssignmentStatusClasses(status: string): string {
  switch (status) {
    case "assigned":
      return "border-slate-200 bg-slate-50 text-slate-700";

    case "accepted":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "in_progress":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "completed":
      return "border-violet-200 bg-violet-50 text-violet-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function DashboardPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<any>(null);

  const [activeEmployees, setActiveEmployees] = useState<Timesheet[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState<DashboardMessage | null>(null);

  const isManagement =
    role === "super_admin" || role === "manager";

  const loadDashboard = useCallback(
    async ({
      showPageLoader = false,
      showRefreshLoader = false,
    }: {
      showPageLoader?: boolean;
      showRefreshLoader?: boolean;
    } = {}) => {
      if (showPageLoader) {
        setLoading(true);
      }

      if (showRefreshLoader) {
        setRefreshing(true);
      }

      try {
        setMessage(null);

        const [dashboardStats, activeSessions, assignmentData] =
          await Promise.all([
            isManagement ? getDashboardStats() : Promise.resolve(null),

            isManagement ? getActiveTimesheets() : user?.uid ? getUserTimesheets(user.uid) : Promise.resolve([]),

            getAssignments(),
          ]);

        setStats(dashboardStats);

        setActiveEmployees(activeSessions as Timesheet[]);

        setAssignments(assignmentData);

        if (showRefreshLoader) {
          setMessage({
            type: "success",
            text: "Dashboard refreshed successfully.",
          });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);

        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Dashboard data could not be loaded.",
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
    [isManagement, user?.uid],
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void loadDashboard({
      showPageLoader: true,
    });
  }, [authLoading, loadDashboard]);

  const myAssignments = useMemo(() => {
    if (!user?.uid) {
      return [];
    }

    return assignments.filter((assignment) =>
      (assignment.assignedUsers || []).some(
        (employee) => getAssignedEmployeeId(employee) === user.uid,
      ),
    );
  }, [assignments, user?.uid]);

  const myActiveSession = useMemo(() => {
    if (!user?.uid) {
      return null;
    }

    return (
      activeEmployees.find(
        (timesheet) =>
          timesheet.userId === user.uid && timesheet.status === "active",
      ) || null
    );
  }, [activeEmployees, user?.uid]);

  const myAssignmentCounts = useMemo<EmployeeDashboardCounts>(() => {
    return myAssignments.reduce(
      (counts, assignment) => {
        const status = getEmployeeAssignmentStatus(assignment, user?.uid || "");

        switch (status) {
          case "assigned":
            counts.assigned += 1;
            break;

          case "accepted":
            counts.accepted += 1;
            break;

          case "in_progress":
            counts.inProgress += 1;
            break;

          case "paused":
            counts.paused += 1;
            break;

          case "completed":
            counts.completed += 1;
            break;
        }

        return counts;
      },
      {
        assigned: 0,
        accepted: 0,
        inProgress: 0,
        paused: 0,
        completed: 0,
      },
    );
  }, [myAssignments, user?.uid]);

  const todayHours = useMemo(() => {
    if (!user?.uid) {
      return 0;
    }

    const today = getTodayDate();

    const todayMinutes = activeEmployees
      .filter(
        (timesheet) =>
          timesheet.userId === user.uid &&
          timesheet.date === today &&
          timesheet.status !== "active",
      )
      .reduce((total, timesheet) => total + getTimesheetMinutes(timesheet), 0);

    return Number((todayMinutes / 60).toFixed(2));
  }, [activeEmployees, user?.uid]);

  const priorityAssignments = useMemo(() => {
    return myAssignments
      .filter((assignment) => {
        const status = getEmployeeAssignmentStatus(assignment, user?.uid || "");

        return status !== "completed";
      })
      .sort((first, second) => {
        const priorityOrder: Record<string, number> = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
        };

        const firstPriority = priorityOrder[first.priority] ?? 4;

        const secondPriority = priorityOrder[second.priority] ?? 4;

        if (firstPriority !== secondPriority) {
          return firstPriority - secondPriority;
        }

        return String(first.dueDate || "").localeCompare(
          String(second.dueDate || ""),
        );
      })
      .slice(0, 5);
  }, [myAssignments, user?.uid]);

  if (authLoading || loading) {
    return (
      <>
        <div className="rkp-page min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-6">
          <div className="flex h-[60vh] items-center justify-center">
            <div className="flex items-center rounded-3xl border border-sky-100 bg-white/70 px-8 py-6 text-slate-500 shadow-lg backdrop-blur-xl">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Loading dashboard...
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rkp-page min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="space-y-7">
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rkp-hero-panel flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                RKP Associates
              </p>

              <h1 className="mt-1 text-[clamp(2rem,3.2vw,3rem)] font-extrabold tracking-[-0.05em]">
                Dashboard
              </h1>

              <p className="mt-3 text-lg text-slate-600">
                {isManagement
                  ? "Operations, assignments and employee productivity overview."
                  : `Welcome back, ${
                      user?.displayName || user?.email || "Employee"
                    }.`}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() =>
                void loadDashboard({
                  showRefreshLoader: true,
                })
              }
              className="rkp-secondary-action gap-2 self-start rounded-xl"
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}

              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </motion.div>

          {message && (
            <div
              className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold ${
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

          {isManagement ? (
            <>
              {stats && <DashboardCards stats={stats} />}

              <div className="grid gap-6 xl:grid-cols-2">
                <ActiveEmployeesWidget employees={activeEmployees} />

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 24,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.15,
                  }}
                  className="rkp-surface-card rounded-[24px] p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <TimerReset className="text-sky-700" />

                    <h2 className="text-xl font-bold text-slate-800">
                      Work Session Rules
                    </h2>
                  </div>

                  <div className="space-y-3 text-slate-600">
                    <p>
                      Each employee may have only one active work session at a
                      time.
                    </p>

                    <p>
                      Pausing closes the current session and requires a work
                      narration.
                    </p>

                    <p>
                      Resuming creates a new session so actual work duration
                      remains accurate.
                    </p>

                    <p>
                      Completion requires a final narration and closes the
                      employee’s assignment workflow.
                    </p>
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-3xl border border-slate-200 bg-white/75 p-5 shadow-lg">
                  <BriefcaseBusiness className="text-slate-700" />

                  <p className="mt-4 text-sm text-slate-500">Assigned</p>

                  <p className="text-3xl font-black text-slate-800">
                    {myAssignmentCounts.assigned}
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-white/75 p-5 shadow-lg">
                  <CheckCircle2 className="text-blue-700" />

                  <p className="mt-4 text-sm text-slate-500">Accepted</p>

                  <p className="text-3xl font-black text-slate-800">
                    {myAssignmentCounts.accepted}
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-white/75 p-5 shadow-lg">
                  <PlayCircle className="text-emerald-700" />

                  <p className="mt-4 text-sm text-slate-500">In Progress</p>

                  <p className="text-3xl font-black text-slate-800">
                    {myAssignmentCounts.inProgress}
                  </p>
                </div>

                <div className="rounded-3xl border border-amber-100 bg-white/75 p-5 shadow-lg">
                  <PauseCircle className="text-amber-700" />

                  <p className="mt-4 text-sm text-slate-500">Paused</p>

                  <p className="text-3xl font-black text-slate-800">
                    {myAssignmentCounts.paused}
                  </p>
                </div>

                <div className="rounded-3xl border border-violet-100 bg-white/75 p-5 shadow-lg">
                  <Clock3 className="text-violet-700" />

                  <p className="mt-4 text-sm text-slate-500">
                    Today&apos;s Hours
                  </p>

                  <p className="text-3xl font-black text-slate-800">
                    {todayHours.toFixed(2)}
                  </p>
                </div>
              </div>

              {myActiveSession ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-lg">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-emerald-100 p-3">
                        <PlayCircle className="text-emerald-700" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                          Active Work Session
                        </p>

                        <h2 className="mt-1 text-2xl font-black text-emerald-900">
                          {myActiveSession.assignmentName ||
                            "Current work session"}
                        </h2>

                        <p className="mt-1 text-sm text-emerald-700">
                          Started at{" "}
                          {getTimestampMilliseconds(
                            myActiveSession.startTime ||
                              myActiveSession.checkIn,
                          )
                            ? new Intl.DateTimeFormat("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(
                                new Date(
                                  getTimestampMilliseconds(
                                    myActiveSession.startTime ||
                                      myActiveSession.checkIn,
                                  ),
                                ),
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {myActiveSession.assignmentId && (
                      <Link
                        href={`/dashboard/assignments/${myActiveSession.assignmentId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                      >
                        Open Active Task
                        <ArrowRight size={17} />
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-sky-100 bg-white/75 p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-sky-100 p-3">
                      <Clock3 className="text-sky-700" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        No active work session
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Open one of your assignments to accept, start or resume
                        work.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 24,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="rkp-surface-card rounded-[24px] p-6"
              >
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Priority Assignments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Your pending work, ordered by priority.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/assignments"
                    className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-800"
                  >
                    View All
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {priorityAssignments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-8 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-600" />

                    <h3 className="mt-3 font-bold text-slate-800">
                      No pending assignments
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Your assigned work is currently clear.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {priorityAssignments.map((assignment) => {
                      const status = getEmployeeAssignmentStatus(
                        assignment,
                        user?.uid || "",
                      );

                      return (
                        <Link
                          key={assignment.id}
                          href={`/dashboard/assignments/${assignment.id}`}
                          className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-slate-800">
                              {assignment.title}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {assignment.clientName}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${getAssignmentStatusClasses(
                                  status,
                                )}`}
                              >
                                {formatStatus(status)}
                              </span>

                              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                                {formatStatus(assignment.priority)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-left md:text-right">
                              <p className="text-xs text-slate-400">Due Date</p>

                              <p className="font-semibold text-slate-700">
                                {assignment.dueDate || "-"}
                              </p>
                            </div>

                            <ArrowRight className="text-sky-700" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </>
          )}

          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
            }}
            className="rkp-surface-card rounded-[24px] p-7"
          >
            <h2 className="mb-3 text-2xl font-bold text-slate-800">
              Welcome to RKP Associates
            </h2>

            <p className="max-w-4xl leading-relaxed text-slate-600">
              Monitor assignments, employee productivity, audit progress, client
              billing, work sessions and invoice generation from one centralized
              platform.
            </p>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.35,
            }}
            className="rkp-surface-card rounded-[24px] p-7"
          >
            <h2 className="mb-6 text-2xl font-bold text-slate-800">
              Quick Actions
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/dashboard/assignments"
                className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <BriefcaseBusiness className="text-sky-700" />

                <h3 className="mt-4 font-semibold text-slate-800">
                  {isManagement ? "Manage Assignments" : "My Assignments"}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {isManagement
                    ? "Create, allocate and monitor professional work."
                    : "Accept, start, pause, resume and complete your tasks."}
                </p>
              </Link>

              {isManagement && (
                <Link
                  href="/dashboard/clients"
                  className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <Users className="text-sky-700" />

                  <h3 className="mt-4 font-semibold text-slate-800">
                    Manage Clients
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Register and maintain client records.
                  </p>
                </Link>
              )}

              <Link
                href="/dashboard/timesheets"
                className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <Clock3 className="text-sky-700" />

                <h3 className="mt-4 font-semibold text-slate-800">
                  Timesheets
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Review work sessions and recorded hours.
                </p>
              </Link>

              {isManagement && (
                <Link
                  href="/dashboard/reports"
                  className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <FileBarChart className="text-sky-700" />

                  <h3 className="mt-4 font-semibold text-slate-800">Reports</h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Generate productivity and billing reports.
                  </p>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
