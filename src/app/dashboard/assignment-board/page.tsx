"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import { getAssignmentHealth } from "@/lib/utils/assignment-health";

import { updateAssignmentStatus } from "@/lib/services/assignment-service";
import { getAssignmentsWithAnalytics } from "@/lib/services/assignment-analytics-service";

const columns = [
  { key: "pending", title: "Pending" },
  { key: "in_progress", title: "In Progress" },
  { key: "review", title: "Review" },
  { key: "completed", title: "Completed" },
  { key: "billed", title: "Billed" },
];

export default function AssignmentBoardPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const data = await getAssignmentsWithAnalytics();
        setAssignments(data);
      } catch (error) {
        console.error("Failed to load assignments:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  const handleMoveStatus = async (assignmentId: string, status: string) => {
    try {
      await updateAssignmentStatus(assignmentId, status);

      setAssignments((prev) =>
        prev.map((item) =>
          item.id === assignmentId ? { ...item, status } : item,
        ),
      );
    } catch (error) {
      console.error("Failed to update assignment status:", error);
    }
  };

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">
            Assignment Board
          </h1>

          <p className="mt-1 text-slate-600">
            Track and move assignments across lifecycle stages.
          </p>
        </motion.div>

        {loading ? (
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-8 shadow-lg">
            Loading board...
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-5">
            {columns.map((column) => {
              const items = assignments.filter(
                (item) => item.status === column.key,
              );

              return (
                <div
                  key={column.key}
                  className="rounded-3xl border border-sky-100 bg-white/70 p-4 shadow-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">{column.title}</h2>

                    <span className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-700">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400">No assignments</p>
                    ) : (
                      items.map((assignment) => {
                        const health = getAssignmentHealth({
                          assignment,
                          actualHours: assignment.actualHours || 0,
                          checklistProgress: assignment.checklistProgress || 0,
                        });

                        return (
                          <motion.div
                            key={assignment.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border bg-white/80 p-4 transition-all hover:-translate-y-1 hover:shadow-md"
                          >
                            <Link
                              href={`/dashboard/assignments/${assignment.id}`}
                              className="block"
                            >
                              <h3 className="font-semibold text-slate-800">
                                {assignment.title}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {assignment.clientName}
                              </p>

                              <span
                                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  health.color === "red"
                                    ? "bg-red-100 text-red-700"
                                    : health.color === "orange"
                                      ? "bg-orange-100 text-orange-700"
                                      : health.color === "green"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-sky-100 text-sky-700"
                                }`}
                              >
                                {health.label}
                              </span>

                              <div className="mt-3 text-sm text-slate-500">
                                Est. Hours: {assignment.estimatedHours || 0}
                              </div>

                              <div className="text-sm text-slate-500">
                                Due: {assignment.dueDate || "-"}
                              </div>
                            </Link>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {columns
                                .filter(
                                  (target) => target.key !== assignment.status,
                                )
                                .map((target) => (
                                  <button
                                    key={target.key}
                                    onClick={() =>
                                      handleMoveStatus(
                                        assignment.id,
                                        target.key,
                                      )
                                    }
                                    className="rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100"
                                  >
                                    Move to {target.title}
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
