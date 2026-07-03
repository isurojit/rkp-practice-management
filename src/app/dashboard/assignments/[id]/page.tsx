"use client";

import { use, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import ActivityTimeline from "@/components/assignments/activity-timeline";

import {
  getAssignmentById,
  updateAssignmentStatus,
} from "@/lib/services/assignment-service";

import { getAssignmentTimesheets } from "@/lib/services/timesheet-service";
import { getAssignmentActivities } from "@/lib/services/activity-service";

import { Assignment } from "@/types/assignment";
import { Timesheet } from "@/types/timesheet";

const statuses = ["pending", "in_progress", "review", "completed", "billed"];

export default function AssignmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignment() {
      try {
        const assignmentData = await getAssignmentById(id);
        setAssignment(assignmentData as Assignment | null);

        const logs = await getAssignmentTimesheets(id);
        setTimesheets(logs);

        const activityLogs = await getAssignmentActivities(id);
        setActivities(activityLogs);
      } catch (error) {
        console.error("Failed to load assignment:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAssignment();
  }, [id]);

  const actualHours = useMemo(() => {
    return timesheets.reduce(
      (sum, item) => sum + Number(item.totalHours || 0),
      0,
    );
  }, [timesheets]);

  const employeeContributions = useMemo(() => {
    const map: Record<string, number> = {};

    timesheets.forEach((item) => {
      const name = item.userName || "Unknown User";
      map[name] = (map[name] || 0) + Number(item.totalHours || 0);
    });

    return Object.entries(map).map(([name, hours]) => ({
      name,
      hours,
    }));
  }, [timesheets]);

  const handleStatusChange = async (status: string) => {
    if (!assignment?.id) return;

    await updateAssignmentStatus(assignment.id, status);

    setAssignment({
      ...assignment,
      status: status as Assignment["status"],
    });
  };

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <div className="p-6">Loading assignment...</div>
      </>
    );
  }

  if (!assignment) {
    return (
      <>
        <DashboardHeader />
        <div className="p-6">Assignment not found</div>
      </>
    );
  }

  const estimatedHours = Number(assignment.estimatedHours || 0);
  const remainingHours = Math.max(0, estimatedHours - actualHours);

  const progress =
    estimatedHours > 0
      ? Math.min(100, Math.round((actualHours / estimatedHours) * 100))
      : 0;

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">
            {assignment.title}
          </h1>

          <p className="text-slate-600 mt-1">{assignment.clientName}</p>

          <div className="mt-3 inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
            {assignment.status.replace("_", " ").toUpperCase()}
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Estimated Hours</p>
            <h2 className="text-3xl font-black text-slate-800">
              {estimatedHours}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Actual Hours</p>
            <h2 className="text-3xl font-black text-slate-800">
              {actualHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Remaining</p>
            <h2 className="text-3xl font-black text-slate-800">
              {remainingHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Progress</p>
            <h2 className="text-3xl font-black text-slate-800">{progress}%</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
          <div className="flex justify-between mb-3">
            <span className="font-semibold text-slate-700">
              Assignment Progress
            </span>
            <span className="text-slate-600">{progress}%</span>
          </div>

          <div className="h-3 rounded-full bg-sky-100">
            <div
              className="h-3 rounded-full bg-sky-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Workflow Status
          </h2>

          <div className="flex flex-wrap gap-3">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                  assignment.status === status
                    ? "bg-sky-600 text-white"
                    : "bg-white text-slate-700 hover:bg-sky-50"
                }`}
              >
                {status.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Employee Contributions
            </h2>

            {employeeContributions.length === 0 ? (
              <p className="text-slate-500">No work recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {employeeContributions.map((employee) => (
                  <div
                    key={employee.name}
                    className="flex justify-between border-b pb-2"
                  >
                    <span>{employee.name}</span>
                    <span className="font-semibold">
                      {employee.hours.toFixed(2)} hrs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Assignment Info
            </h2>

            <div className="space-y-2 text-slate-600">
              <p>Type: {assignment.assignmentType}</p>
              <p>Priority: {assignment.priority}</p>
              <p>Start Date: {assignment.startDate}</p>
              <p>Due Date: {assignment.dueDate}</p>
              <p>Remarks: {assignment.remarks || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Work History
          </h2>

          {timesheets.length === 0 ? (
            <p className="text-slate-500">No timesheet records found.</p>
          ) : (
            <div className="space-y-3">
              {[...timesheets]
                .sort(
                  (a, b) =>
                    new Date(b.checkIn).getTime() -
                    new Date(a.checkIn).getTime(),
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b pb-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.userName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.workDescription || "No narration"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {Number(item.totalHours || 0).toFixed(2)} hrs
                      </p>
                      <p className="text-sm text-slate-500">{item.date}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <ActivityTimeline activities={activities} />
      </div>
    </>
  );
}
