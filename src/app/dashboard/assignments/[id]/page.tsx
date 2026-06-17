"use client";

import { useEffect, useMemo, useState } from "react";

import DashboardHeader from "@/components/dashboard/dashboard-header";

import {
  getAssignmentById,
  updateAssignmentStatus,
} from "@/lib/services/assignment-service";

import { getAssignmentTimesheets } from "@/lib/services/timesheet-service";

import { Timesheet } from "@/types/timesheet";

import { Badge } from "@/components/ui/badge";

export default function AssignmentDetailsPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const [assignment, setAssignment] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  const [actualHours, setActualHours] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const assignmentData = await getAssignmentById(params.id);

        setAssignment(assignmentData);

        const logs = await getAssignmentTimesheets(params.id);

        setTimesheets(logs);

        const hours = logs.reduce(
          (sum, item) => sum + Number(item.totalHours || 0),
          0,
        );

        setActualHours(hours);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  const handleStatusChange = async (status: string) => {
    if (!assignment?.id) return;

    try {
      await updateAssignmentStatus(assignment.id, status);

      setAssignment((prev: any) => ({
        ...prev,
        status,
      }));
    } catch (error) {
      console.error(error);
    }
  };

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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!assignment) {
    return <div className="p-6">Assignment not found</div>;
  }

  const estimatedHours = assignment.estimatedHours || 0;

  const remainingHours = Math.max(0, estimatedHours - actualHours);

  const progress =
    estimatedHours > 0
      ? Math.min(100, Math.round((actualHours / estimatedHours) * 100))
      : 0;

  return (
    <>
      <DashboardHeader />

      <div className="p-6 space-y-6">
        {/* Header */}

        <div>
          <h1 className="text-3xl font-bold">{assignment.title}</h1>

          <p className="text-muted-foreground mt-1">{assignment.clientName}</p>

          <div className="mt-3">
            <Badge>{assignment.status}</Badge>
          </div>
        </div>

        {/* KPI Cards */}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Estimated Hours</p>

            <p className="text-2xl font-bold">{estimatedHours}</p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Actual Hours</p>

            <p className="text-2xl font-bold">{actualHours.toFixed(2)}</p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Remaining Hours</p>

            <p className="text-2xl font-bold">{remainingHours.toFixed(2)}</p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Progress</p>

            <p className="text-2xl font-bold">{progress}%</p>
          </div>
        </div>

        {/* Progress */}

        <div className="border rounded-xl p-6">
          <div className="flex justify-between mb-3">
            <span>Assignment Progress</span>

            <span>{progress}%</span>
          </div>

          <div className="w-full h-3 bg-muted rounded-full">
            <div
              className={`h-3 rounded-full transition-all ${
                progress < 50
                  ? "bg-blue-500"
                  : progress < 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* Workflow */}

        <div className="border rounded-xl p-6">
          <h2 className="font-bold mb-4">Assignment Workflow</h2>

          <div className="flex flex-wrap gap-3">
            {["pending", "in_progress", "review", "completed", "billed"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    assignment.status === status
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  {status.replace("_", " ").toUpperCase()}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Employee Contribution */}

        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Employee Contributions</h2>

          {employeeContributions.length === 0 ? (
            <p>No work recorded yet</p>
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

        {/* Work History */}

        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Work History</h2>

          {timesheets.length === 0 ? (
            <p>No timesheets found</p>
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
                      <p className="font-medium">{item.userName}</p>

                      <p className="text-sm text-muted-foreground">
                        {item.workDescription || "No description"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p>{Number(item.totalHours || 0).toFixed(2)} hrs</p>

                      <p className="text-sm text-muted-foreground">
                        {item.date}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
