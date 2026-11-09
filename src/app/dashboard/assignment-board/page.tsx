"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { ArrowUpRight, BriefcaseBusiness, RefreshCw } from "lucide-react";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import { getAssignmentHealth } from "@/lib/utils/assignment-health";
import { getAssignmentsWithAnalytics } from "@/lib/services/assignment-analytics-service";
import type { Assignment, AssignmentStatus } from "@/types/assignment";

interface BoardAssignment extends Assignment {
  actualHours: number;
  checklistProgress: number;
}

const columns: {
  key: AssignmentStatus;
  title: string;
}[] = [
  { key: "assigned", title: "Assigned" },
  { key: "accepted", title: "Accepted" },
  { key: "in_progress", title: "In Progress" },
  { key: "paused", title: "Paused" },
  { key: "completed", title: "Completed" },
];

export default function AssignmentBoardPage() {
  const [assignments, setAssignments] = useState<BoardAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAssignmentsWithAnalytics();

      setAssignments(data as BoardAssignment[]);
    } catch (err) {
      console.error("Failed to load assignment board:", err);

      setError("Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen space-y-6 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-black text-slate-800 md:text-4xl">
              Assignment Board
            </h1>

            <p className="mt-2 text-slate-600">
              Track assignment progress across workflow stages.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAssignments()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </motion.div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-sky-100 bg-white/80 p-8 text-center text-slate-500 shadow-sm">
            Loading assignment board...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {columns.map((column) => {
                const count = assignments.filter(
                  (assignment) => assignment.status === column.key,
                ).length;

                return (
                  <div
                    key={column.key}
                    className="rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm"
                  >
                    <p className="text-sm font-medium text-slate-500">
                      {column.title}
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-800">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              {columns.map((column) => {
                const items = assignments.filter(
                  (item) => item.status === column.key,
                );

                return (
                  <div
                    key={column.key}
                    className="min-h-72 rounded-3xl border border-sky-100 bg-white/70 p-4 shadow-lg backdrop-blur-xl"
                  >
                    <div className="mb-5 flex items-center justify-between gap-2">
                      <h2 className="font-bold text-slate-800">
                        {column.title}
                      </h2>

                      <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                        {items.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {items.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">
                          No assignments
                        </p>
                      ) : (
                        items.map((assignment, index) => {
                          const health = getAssignmentHealth({
                            assignment,
                            actualHours: assignment.actualHours || 0,
                            checklistProgress:
                              assignment.checklistProgress || 0,
                          });

                          const healthClasses =
                            health.color === "red"
                              ? "bg-red-100 text-red-700"
                              : health.color === "orange"
                                ? "bg-orange-100 text-orange-700"
                                : health.color === "green"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-sky-100 text-sky-700";

                          return (
                            <motion.div
                              key={assignment.id || `${column.key}-${index}`}
                              initial={{
                                opacity: 0,
                                y: 12,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
                                  <BriefcaseBusiness size={18} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h3 className="font-bold text-slate-800">
                                    {assignment.title}
                                  </h3>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {assignment.clientName}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${healthClasses}`}
                                >
                                  {health.label}
                                </span>
                              </div>

                              <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex justify-between gap-2">
                                  <span>Estimated</span>
                                  <span className="font-semibold">
                                    {assignment.estimatedHours || 0} hrs
                                  </span>
                                </div>

                                <div className="flex justify-between gap-2">
                                  <span>Worked</span>
                                  <span className="font-semibold">
                                    {Number(
                                      assignment.actualHours || 0,
                                    ).toFixed(2)}{" "}
                                    hrs
                                  </span>
                                </div>

                                <div className="flex justify-between gap-2">
                                  <span>Checklist</span>
                                  <span className="font-semibold">
                                    {assignment.checklistProgress || 0}%
                                  </span>
                                </div>

                                <div className="flex justify-between gap-2">
                                  <span>Due Date</span>
                                  <span className="font-semibold">
                                    {assignment.dueDate || "-"}
                                  </span>
                                </div>
                              </div>

                              {assignment.id && (
                                <Link
                                  href={`/dashboard/assignments/${assignment.id}`}
                                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                                >
                                  View Assignment
                                  <ArrowUpRight size={16} />
                                </Link>
                              )}
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
