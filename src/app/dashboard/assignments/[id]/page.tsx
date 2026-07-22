"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import ActivityTimeline from "@/components/assignments/activity-timeline";
import AssignmentChecklist from "@/components/assignments/assignment-checklist";
import AssignmentNotes from "@/components/assignments/assignment-notes";
import AssignmentInstructions from "@/components/assignments/assignment-instructions";
import TaskActionPanel from "@/components/assignments/task-action-panel";

import { getAssignmentById } from "@/lib/services/assignment-service";

import { getAssignmentTimesheets } from "@/lib/services/timesheet-service";
import { getAssignmentActivities } from "@/lib/services/activity-service";

import {
  getAssignmentChecklist,
  toggleChecklistItem,
} from "@/lib/services/assignment-checklist-service";

import {
  addAssignmentNote,
  getAssignmentNotes,
} from "@/lib/services/assignment-note-service";

import {
  addAssignmentInstruction,
  getAssignmentInstructions,
} from "@/lib/services/assignment-instruction-service";

import {
  acceptTask,
  endTask,
  pauseTask,
  resumeTask,
  startTask,
} from "@/lib/services/task-workflow-service";

import { getAssignmentHealth } from "@/lib/utils/assignment-health";

import { useAuth } from "@/providers/auth-provider";

import { Assignment } from "@/types/assignment";
import { Timesheet } from "@/types/timesheet";
import { AssignmentChecklistItem } from "@/types/assignment-checklist";
import { AssignmentNote } from "@/types/assignment-note";
import { AssignmentInstruction } from "@/types/assignment-instruction";

interface WorkflowMessage {
  type: "success" | "error";
  text: string;
}

function getTimestampMilliseconds(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  const date = new Date(value as string | number | Date);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getTimesheetStartMilliseconds(timesheet: Timesheet): number {
  const extendedTimesheet = timesheet as Timesheet & {
    startTime?: unknown;
    checkIn?: unknown;
    createdAt?: unknown;
  };

  return getTimestampMilliseconds(
    extendedTimesheet.startTime ||
      extendedTimesheet.checkIn ||
      extendedTimesheet.createdAt,
  );
}

function getTimesheetNarration(timesheet: Timesheet): string {
  const extendedTimesheet = timesheet as Timesheet & {
    narration?: string;
    workDescription?: string;
    miscellaneousNarration?: string;
  };

  return (
    extendedTimesheet.narration ||
    extendedTimesheet.workDescription ||
    extendedTimesheet.miscellaneousNarration ||
    "No narration"
  );
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

export default function AssignmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, role } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  const [activities, setActivities] = useState<any[]>([]);

  const [checklist, setChecklist] = useState<AssignmentChecklistItem[]>([]);

  const [notes, setNotes] = useState<AssignmentNote[]>([]);

  const [instructions, setInstructions] = useState<AssignmentInstruction[]>([]);

  const [loading, setLoading] = useState(true);

  const [processingTask, setProcessingTask] = useState(false);

  const [workflowMessage, setWorkflowMessage] =
    useState<WorkflowMessage | null>(null);

  const loadAssignmentData = useCallback(
    async (showPageLoader = false) => {
      if (showPageLoader) {
        setLoading(true);
      }

      try {
        const [
          assignmentData,
          logs,
          activityLogs,
          checklistItems,
          assignmentNotes,
          assignmentInstructions,
        ] = await Promise.all([
          getAssignmentById(id),
          getAssignmentTimesheets(id),
          getAssignmentActivities(id),
          getAssignmentChecklist(id),
          getAssignmentNotes(id),
          getAssignmentInstructions(id),
        ]);

        setAssignment(assignmentData as Assignment | null);

        setTimesheets(logs);
        setActivities(activityLogs);
        setChecklist(checklistItems);
        setNotes(assignmentNotes);
        setInstructions(assignmentInstructions);
      } catch (error) {
        console.error("Failed to load assignment:", error);

        setWorkflowMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "The assignment details could not be loaded.",
        });
      } finally {
        if (showPageLoader) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    void loadAssignmentData(true);
  }, [loadAssignmentData]);

  const actualHours = useMemo(() => {
    return timesheets.reduce(
      (sum, item) => sum + Number(item.totalHours || 0),
      0,
    );
  }, [timesheets]);

  const employeeContributions = useMemo(() => {
    const contributionMap: Record<string, number> = {};

    timesheets.forEach((item) => {
      const name = item.userName || "Unknown User";

      contributionMap[name] =
        (contributionMap[name] || 0) + Number(item.totalHours || 0);
    });

    return Object.entries(contributionMap)
      .map(([name, hours]) => ({
        name,
        hours,
      }))
      .sort((first, second) => second.hours - first.hours);
  }, [timesheets]);

  const checklistProgress = useMemo(() => {
    if (checklist.length === 0) {
      return 0;
    }

    const completedItems = checklist.filter((item) => item.completed).length;

    return Math.round((completedItems / checklist.length) * 100);
  }, [checklist]);

  const currentUserIsAssigned = useMemo(() => {
    if (!assignment || !user?.uid) {
      return false;
    }

    return assignment.assignedUsers.some(
      (employee) => getAssignedEmployeeId(employee) === user.uid,
    );
  }, [assignment, user?.uid]);

  const handleTaskAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    if (processingTask) {
      return;
    }

    try {
      setProcessingTask(true);
      setWorkflowMessage(null);

      await action();

      await loadAssignmentData();

      setWorkflowMessage({
        type: "success",
        text: successMessage,
      });
    } catch (error) {
      console.error("Task workflow action failed:", error);

      setWorkflowMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The task action could not be completed.",
      });

      throw error;
    } finally {
      setProcessingTask(false);
    }
  };

  const handleAcceptTask = async () => {
    if (!user?.uid) {
      throw new Error(
        "Your authenticated user account could not be identified.",
      );
    }

    await handleTaskAction(
      () =>
        acceptTask({
          assignmentId: id,
          user: {
            uid: user.uid,
            name: user.displayName || user.email || "Employee",
            email: user.email || undefined,
          },
        }),
      "Task accepted successfully.",
    );
  };

  const handleStartTask = async () => {
    if (!user?.uid) {
      throw new Error(
        "Your authenticated user account could not be identified.",
      );
    }

    await handleTaskAction(
      () =>
        startTask({
          assignmentId: id,
          user: {
            uid: user.uid,
            name: user.displayName || user.email || "Employee",
            email: user.email || undefined,
          },
        }),
      "Work session started successfully.",
    );
  };

  const handlePauseTask = async (narration: string) => {
    if (!user?.uid) {
      throw new Error(
        "Your authenticated user account could not be identified.",
      );
    }

    await handleTaskAction(
      () =>
        pauseTask({
          assignmentId: id,
          user: {
            uid: user.uid,
            name: user.displayName || user.email || "Employee",
            email: user.email || undefined,
          },
          narration,
        }),
      "Task paused and work session recorded.",
    );
  };

  const handleResumeTask = async () => {
    if (!user?.uid) {
      throw new Error(
        "Your authenticated user account could not be identified.",
      );
    }

    await handleTaskAction(
      () =>
        resumeTask({
          assignmentId: id,
          user: {
            uid: user.uid,
            name: user.displayName || user.email || "Employee",
            email: user.email || undefined,
          },
        }),
      "Task resumed successfully.",
    );
  };

  const handleEndTask = async (narration: string) => {
    if (!user?.uid) {
      throw new Error(
        "Your authenticated user account could not be identified.",
      );
    }

    await handleTaskAction(
      () =>
        endTask({
          assignmentId: id,
          user: {
            uid: user.uid,
            name: user.displayName || user.email || "Employee",
            email: user.email || undefined,
          },
          narration,
        }),
      "Your work on this task has been completed.",
    );
  };

  const handleToggleChecklist = async (
    item: AssignmentChecklistItem,
    completed: boolean,
  ) => {
    if (!item.id) {
      return;
    }

    try {
      await toggleChecklistItem(item.id, completed);

      setChecklist((previous) =>
        previous.map((checkItem) =>
          checkItem.id === item.id
            ? {
                ...checkItem,
                completed,
                completedAt: completed ? new Date() : undefined,
              }
            : checkItem,
        ),
      );
    } catch (error) {
      console.error("Failed to update checklist:", error);
    }
  };

  const handleAddNote = async (note: string) => {
    const createdByName = user?.displayName || user?.email || "Unknown User";

    const noteReference = await addAssignmentNote({
      assignmentId: id,
      note,
      createdBy: user?.uid || "",
      createdByName,
    });

    setNotes((previous) => [
      ...previous,
      {
        id: noteReference.id,
        assignmentId: id,
        note,
        createdBy: user?.uid || "",
        createdByName,
        createdAt: new Date(),
      },
    ]);
  };

  const handleAddInstruction = async (instruction: string) => {
    const createdByName = user?.displayName || user?.email || "Unknown User";

    const instructionReference = await addAssignmentInstruction({
      assignmentId: id,
      instruction,
      createdBy: user?.uid || "",
      createdByName,
    });

    setInstructions((previous) => [
      ...previous,
      {
        id: instructionReference.id,
        assignmentId: id,
        instruction,
        createdBy: user?.uid || "",
        createdByName,
        createdAt: new Date(),
      },
    ]);

    const refreshedActivities = await getAssignmentActivities(id);

    setActivities(refreshedActivities);
  };

  if (loading) {
    return (
      <>
        <DashboardHeader />

        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-6">
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-8 text-slate-500 shadow-lg">
            Loading assignment...
          </div>
        </div>
      </>
    );
  }

  if (!assignment) {
    return (
      <>
        <DashboardHeader />

        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-6">
          <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-red-700">
            Assignment not found.
          </div>
        </div>
      </>
    );
  }

  const estimatedHours = Number(assignment.estimatedHours || 0);

  const remainingHours = Math.max(0, estimatedHours - actualHours);

  const hoursProgress =
    estimatedHours > 0
      ? Math.min(100, Math.round((actualHours / estimatedHours) * 100))
      : 0;

  const overallProgress = Math.round((hoursProgress + checklistProgress) / 2);

  const health = getAssignmentHealth({
    assignment,
    actualHours,
    checklistProgress,
  });

  const canAddInstruction = role === "super_admin" || role === "manager";

  const shouldShowTaskPanel = role === "employee" || currentUserIsAssigned;

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen space-y-6 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-6">
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <h1 className="text-4xl font-black text-slate-800">
            {assignment.title}
          </h1>

          <p className="mt-1 text-slate-600">{assignment.clientName}</p>

          <div className="mt-3 flex flex-wrap gap-3">
            <span className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
              {assignment.status.replaceAll("_", " ").toUpperCase()}
            </span>

            <span className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-semibold text-orange-700">
              {assignment.priority.toUpperCase()}
            </span>

            <span className="inline-flex rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-slate-600">
              Due: {assignment.dueDate || "-"}
            </span>
          </div>
        </motion.div>

        {workflowMessage && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
              workflowMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {workflowMessage.text}
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Estimated Hours</p>

            <h2 className="text-3xl font-black text-slate-800">
              {estimatedHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Actual Hours</p>

            <h2 className="text-3xl font-black text-slate-800">
              {actualHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Remaining Hours</p>

            <h2 className="text-3xl font-black text-slate-800">
              {remainingHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Checklist</p>

            <h2 className="text-3xl font-black text-slate-800">
              {checklistProgress}%
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Overall Progress</p>

            <h2 className="text-3xl font-black text-slate-800">
              {overallProgress}%
            </h2>
          </div>
        </div>

        <div
          className={`rounded-3xl border p-6 shadow-lg ${
            health.color === "red"
              ? "border-red-100 bg-red-50"
              : health.color === "orange"
                ? "border-orange-100 bg-orange-50"
                : health.color === "green"
                  ? "border-green-100 bg-green-50"
                  : "border-sky-100 bg-white/70"
          }`}
        >
          <p className="text-sm text-slate-500">Assignment Health</p>

          <h2 className="mt-1 text-3xl font-black text-slate-800">
            {health.label}
          </h2>

          <p className="mt-2 text-slate-600">{health.message}</p>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-700">
              Overall Progress
            </span>

            <span className="text-slate-600">{overallProgress}%</span>
          </div>

          <div className="h-3 rounded-full bg-sky-100">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${overallProgress}%`,
              }}
              className="h-3 rounded-full bg-sky-600"
            />
          </div>
        </div>

        {shouldShowTaskPanel && (
          <TaskActionPanel
            assignment={assignment}
            userId={user?.uid || ""}
            userName={user?.displayName || user?.email || "Employee"}
            userEmail={user?.email || undefined}
            processing={processingTask}
            onAccept={handleAcceptTask}
            onStart={handleStartTask}
            onPause={handlePauseTask}
            onResume={handleResumeTask}
            onEnd={handleEndTask}
          />
        )}

        <AssignmentChecklist
          checklist={checklist}
          onToggle={handleToggleChecklist}
        />

        <AssignmentNotes notes={notes} onAddNote={handleAddNote} />

        <AssignmentInstructions
          instructions={instructions}
          onAddInstruction={handleAddInstruction}
          canAddInstruction={canAddInstruction}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              Employee Contributions
            </h2>

            {employeeContributions.length === 0 ? (
              <p className="text-slate-500">No work recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {employeeContributions.map((employee) => (
                  <div
                    key={employee.name}
                    className="flex items-center justify-between border-b border-sky-50 pb-3"
                  >
                    <span className="text-slate-700">{employee.name}</span>

                    <span className="font-semibold text-slate-800">
                      {employee.hours.toFixed(2)} hrs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-slate-800">
              Assignment Information
            </h2>

            <div className="space-y-3 text-slate-600">
              <p>
                <span className="font-semibold text-slate-700">Type:</span>{" "}
                {assignment.assignmentType.replaceAll("_", " ").toUpperCase()}
              </p>

              <p>
                <span className="font-semibold text-slate-700">Priority:</span>{" "}
                {assignment.priority.toUpperCase()}
              </p>

              <p>
                <span className="font-semibold text-slate-700">
                  Start Date:
                </span>{" "}
                {assignment.startDate || "-"}
              </p>

              <p>
                <span className="font-semibold text-slate-700">Due Date:</span>{" "}
                {assignment.dueDate || "-"}
              </p>

              <p>
                <span className="font-semibold text-slate-700">Remarks:</span>{" "}
                {assignment.remarks || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-slate-800">
            Work History
          </h2>

          {timesheets.length === 0 ? (
            <p className="text-slate-500">No timesheet records found.</p>
          ) : (
            <div className="space-y-3">
              {[...timesheets]
                .sort(
                  (first, second) =>
                    getTimesheetStartMilliseconds(second) -
                    getTimesheetStartMilliseconds(first),
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 border-b border-sky-50 pb-4 md:flex-row"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.userName || "Unknown User"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {getTimesheetNarration(item)}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="font-semibold text-slate-800">
                        {Number(item.totalHours || 0).toFixed(2)} hrs
                      </p>

                      <p className="text-sm text-slate-500">
                        {item.date || "-"}
                      </p>
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
