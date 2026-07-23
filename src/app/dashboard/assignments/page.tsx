"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Loader2,
  PauseCircle,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/dashboard-header";

import AssignmentsTable from "@/components/assignments/assignments-table";
import AddAssignmentDialog from "@/components/assignments/add-assignment-dialog";

import { Button } from "@/components/ui/button";

import { getAssignments } from "@/lib/services/assignment-service";

import { useAuth } from "@/providers/auth-provider";

import { Assignment, AssignmentStatus } from "@/types/assignment";

type AssignmentFilter = "all" | AssignmentStatus;

interface PageMessage {
  type: "success" | "error";
  text: string;
}

function normaliseText(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getAssignmentEmployeeId(
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

export default function AssignmentsPage() {
  const { user, role } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<AssignmentFilter>("all");

  const [onlyMyAssignments, setOnlyMyAssignments] = useState(
    role === "employee",
  );

  const [message, setMessage] = useState<PageMessage | null>(null);

  const loadAssignments = useCallback(
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

        const data = await getAssignments();

        setAssignments(data);

        if (showRefreshLoader) {
          setMessage({
            type: "success",
            text: "Assignments refreshed successfully.",
          });
        }
      } catch (error) {
        console.error("Failed to load assignments:", error);

        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Assignments could not be loaded.",
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
    [],
  );

  useEffect(() => {
    void loadAssignments({
      showPageLoader: true,
    });
  }, [loadAssignments]);

  useEffect(() => {
    if (role === "employee") {
      setOnlyMyAssignments(true);
    }
  }, [role]);

  const assignmentCounts = useMemo(() => {
    return assignments.reduce(
      (counts, assignment) => {
        counts.total += 1;

        switch (assignment.status) {
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
        total: 0,
        assigned: 0,
        accepted: 0,
        inProgress: 0,
        paused: 0,
        completed: 0,
      },
    );
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const cleanedSearchTerm = normaliseText(searchTerm);

    return assignments.filter((assignment) => {
      if (statusFilter !== "all" && assignment.status !== statusFilter) {
        return false;
      }

      if (onlyMyAssignments && user?.uid) {
        const isAssignedToCurrentUser = assignment.assignedUsers.some(
          (employee) => getAssignmentEmployeeId(employee) === user.uid,
        );

        if (!isAssignedToCurrentUser) {
          return false;
        }
      }

      if (!cleanedSearchTerm) {
        return true;
      }

      const searchableText = [
        assignment.title,
        assignment.clientName,
        assignment.assignmentType,
        assignment.priority,
        assignment.status,
        assignment.remarks,
        assignment.startDate,
        assignment.dueDate,
      ]
        .map(normaliseText)
        .join(" ");

      return searchableText.includes(cleanedSearchTerm);
    });
  }, [assignments, onlyMyAssignments, searchTerm, statusFilter, user?.uid]);

  const canCreateAssignment =
    role === "super_admin" || role === "admin" || role === "manager";

  const statusOptions: Array<{
    value: AssignmentFilter;
    label: string;
    count: number;
  }> = [
    {
      value: "all",
      label: "All",
      count: assignmentCounts.total,
    },
    {
      value: "assigned",
      label: "Assigned",
      count: assignmentCounts.assigned,
    },
    {
      value: "accepted",
      label: "Accepted",
      count: assignmentCounts.accepted,
    },
    {
      value: "in_progress",
      label: "In Progress",
      count: assignmentCounts.inProgress,
    },
    {
      value: "paused",
      label: "Paused",
      count: assignmentCounts.paused,
    },
    {
      value: "completed",
      label: "Completed",
      count: assignmentCounts.completed,
    },
  ];

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen space-y-6 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Assignment Management
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-800 sm:text-4xl">
              Assignments
            </h1>

            <p className="mt-2 text-slate-600">
              Manage audit, tax and other professional assignments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={refreshing || loading}
              onClick={() =>
                void loadAssignments({
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

            {canCreateAssignment && <AddAssignmentDialog />}
          </div>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl border border-sky-100 bg-white/75 p-5 shadow-lg">
            <BriefcaseBusiness className="text-sky-700" />

            <p className="mt-4 text-sm text-slate-500">Total</p>

            <p className="text-3xl font-black text-slate-800">
              {assignmentCounts.total}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/75 p-5 shadow-lg">
            <UserCheck className="text-slate-700" />

            <p className="mt-4 text-sm text-slate-500">Assigned</p>

            <p className="text-3xl font-black text-slate-800">
              {assignmentCounts.assigned}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/75 p-5 shadow-lg">
            <CheckCircle2 className="text-blue-700" />

            <p className="mt-4 text-sm text-slate-500">Accepted</p>

            <p className="text-3xl font-black text-slate-800">
              {assignmentCounts.accepted}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white/75 p-5 shadow-lg">
            <Clock3 className="text-emerald-700" />

            <p className="mt-4 text-sm text-slate-500">In Progress</p>

            <p className="text-3xl font-black text-slate-800">
              {assignmentCounts.inProgress}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white/75 p-5 shadow-lg">
            <PauseCircle className="text-amber-700" />

            <p className="mt-4 text-sm text-slate-500">Paused</p>

            <p className="text-3xl font-black text-slate-800">
              {assignmentCounts.paused}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white/75 p-5 shadow-lg">
            <CheckCircle2 className="text-violet-700" />

            <p className="mt-4 text-sm text-slate-500">Completed</p>

            <p className="text-3xl font-black text-slate-800">
              {assignmentCounts.completed}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/75 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search assignments, clients, type or priority..."
                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((option) => {
                const isActive = statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-sky-100 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                    }`}
                  >
                    {option.label}

                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {user?.uid && (
            <label className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={onlyMyAssignments}
                onChange={(event) => setOnlyMyAssignments(event.target.checked)}
                className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
              />
              Show only assignments allocated to me
            </label>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-3xl border border-sky-100 bg-white/75 p-8 text-slate-500 shadow-lg">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-3xl border border-sky-100 bg-white/75 p-10 text-center shadow-lg">
            <BriefcaseBusiness size={38} className="mx-auto text-sky-300" />

            <h2 className="mt-4 text-xl font-bold text-slate-800">
              No assignments found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {assignments.length === 0
                ? "No assignments have been created yet."
                : "No assignments match the selected search and filters."}
            </p>

            {(searchTerm || statusFilter !== "all" || onlyMyAssignments) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");

                  if (role !== "employee") {
                    setOnlyMyAssignments(false);
                  }
                }}
                className="mt-5 rounded-xl"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-sky-100 bg-white/75 p-4 shadow-lg backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Assignment List
                </h2>

                <p className="text-sm text-slate-500">
                  Showing {filteredAssignments.length} of {assignments.length}{" "}
                  assignments
                </p>
              </div>

              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                {formatStatus(
                  statusFilter === "all" ? "all assignments" : statusFilter,
                )}
              </span>
            </div>

            <AssignmentsTable assignments={filteredAssignments} />
          </div>
        )}
      </div>
    </>
  );
}
