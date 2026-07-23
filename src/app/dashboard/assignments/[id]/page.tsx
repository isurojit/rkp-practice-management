"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  TimerReset,
  Users,
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import ActivityTimeline from "@/components/assignments/activity-timeline";
import AssignmentChecklist from "@/components/assignments/assignment-checklist";
import AssignmentNotes from "@/components/assignments/assignment-notes";
import AssignmentInstructions from "@/components/assignments/assignment-instructions";
import TaskActionPanel from "@/components/assignments/task-action-panel";

import { Button } from "@/components/ui/button";

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

import {
  Assignment,
  AssignmentEmployeeProgress,
  EmployeeTaskStatus,
} from "@/types/assignment";

import { Timesheet } from "@/types/timesheet";
import { AssignmentChecklistItem } from "@/types/assignment-checklist";
import { AssignmentNote } from "@/types/assignment-note";
import { AssignmentInstruction } from "@/types/assignment-instruction";

interface WorkflowMessage {
  type: "success" | "error";
  text: string;
}

interface EmployeeContribution {
  userId: string;
  name: string;
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
  status: EmployeeTaskStatus;
  latestNarration?: string;
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

function getTimesheetStartMilliseconds(timesheet: Timesheet): number {
  return getTimestampMilliseconds(
    timesheet.startTime || timesheet.checkIn || timesheet.createdAt,
  );
}

function getTimesheetEndMilliseconds(timesheet: Timesheet): number {
  return getTimestampMilliseconds(
    timesheet.endTime || timesheet.checkOut || timesheet.updatedAt,
  );
}

function getTimesheetNarration(timesheet: Timesheet): string {
  return (
    timesheet.narration ||
    timesheet.pauseReason ||
    timesheet.completionRemarks ||
    timesheet.workDescription ||
    timesheet.miscellaneousNarration ||
    "No narration entered."
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

function getAssignedEmployeeName(
  employee:
    | string
    | {
        uid?: string;
        name?: string;
        email?: string;
      },
): string {
  if (typeof employee === "string") {
    return "Assigned Employee";
  }

  return employee.name || employee.email || "Assigned Employee";
}

function formatStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDateTime(value: unknown): string {
  const milliseconds = getTimestampMilliseconds(value);

  if (!milliseconds) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(milliseconds));
}

function getSessionStatusClasses(status: Timesheet["status"]): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "completed":
    case "stopped":
      return "border-violet-200 bg-violet-50 text-violet-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getEmployeeStatusClasses(status: EmployeeTaskStatus): string {
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

function calculateSessionMinutes(timesheet: Timesheet): number {
  if (typeof timesheet.totalMinutes === "number") {
    return timesheet.totalMinutes;
  }

  if (typeof timesheet.totalHours === "number") {
    return Math.round(timesheet.totalHours * 60);
  }

  const startMilliseconds = getTimesheetStartMilliseconds(timesheet);

  const endMilliseconds = getTimesheetEndMilliseconds(timesheet);

  if (startMilliseconds <= 0 || endMilliseconds <= startMilliseconds) {
    return 0;
  }

  return Math.round((endMilliseconds - startMilliseconds) / 60000);
}

export default function AssignmentDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
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

  const [refreshing, setRefreshing] = useState(false);

  const [processingTask, setProcessingTask] = useState(false);

  const [workflowMessage, setWorkflowMessage] =
    useState<WorkflowMessage | null>(null);

  const loadAssignmentData = useCallback(
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
        const [
          assignmentData,
          assignmentTimesheets,
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

        setTimesheets(assignmentTimesheets);

        setActivities(activityLogs);

        setChecklist(checklistItems);

        setNotes(assignmentNotes);

        setInstructions(assignmentInstructions);

        return assignmentData;
      } catch (error) {
        console.error("Failed to load assignment:", error);

        setWorkflowMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "The assignment details could not be loaded.",
        });

        return null;
      } finally {
        if (showPageLoader) {
          setLoading(false);
        }

        if (showRefreshLoader) {
          setRefreshing(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    void loadAssignmentData({
      showPageLoader: true,
    });
  }, [loadAssignmentData]);

  const closedTimesheets = useMemo(
    () =>
      timesheets.filter(
        (item) =>
          item.status !== "active" &&
          Boolean(
            item.endTime ||
            item.checkOut ||
            item.totalMinutes ||
            item.totalHours,
          ),
      ),
    [timesheets],
  );

  const activeTimesheets = useMemo(
    () =>
      timesheets.filter(
        (item) => item.status === "active" && !item.endTime && !item.checkOut,
      ),
    [timesheets],
  );

  const actualMinutes = useMemo(
    () =>
      closedTimesheets.reduce(
        (sum, item) => sum + calculateSessionMinutes(item),
        0,
      ),
    [closedTimesheets],
  );

  const actualHours = useMemo(
    () => Number((actualMinutes / 60).toFixed(2)),
    [actualMinutes],
  );

  const employeeContributions = useMemo<EmployeeContribution[]>(() => {
    if (!assignment) {
      return [];
    }

    const progressList = assignment.employeeProgress || [];

    return assignment.assignedUsers
      .map((employee) => {
        const userId = getAssignedEmployeeId(employee);

        const userName = getAssignedEmployeeName(employee);

        const progress = progressList.find((item) => item.userId === userId);

        const employeeTimesheets = timesheets.filter(
          (item) => item.userId === userId,
        );

        const calculatedMinutes = employeeTimesheets
          .filter((item) => item.status !== "active")
          .reduce((sum, item) => sum + calculateSessionMinutes(item), 0);

        const totalMinutes = progress?.totalMinutes ?? calculatedMinutes;

        return {
          userId,
          name: progress?.userName || userName,
          totalMinutes,
          totalHours: Number((totalMinutes / 60).toFixed(2)),
          sessionCount: progress?.sessionCount ?? employeeTimesheets.length,
          status: progress?.status || "assigned",
          latestNarration: progress?.latestNarration,
        };
      })
      .sort((first, second) => second.totalMinutes - first.totalMinutes);
  }, [assignment, timesheets]);

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

  const currentUserProgress = useMemo<AssignmentEmployeeProgress | null>(() => {
    if (!assignment || !user?.uid) {
      return null;
    }

    return (
      assignment.employeeProgress?.find((item) => item.userId === user.uid) ||
      null
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

      const refreshedAssignment = await loadAssignmentData();

      if (!refreshedAssignment) {
        throw new Error(
          "The task was updated, but the refreshed assignment could not be loaded.",
        );
      }

      setWorkflowMessage({
        type: "success",
        text: successMessage,
      });
    } catch (error) {
      console.error("Task workflow action failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "The task action could not be completed.";

      setWorkflowMessage({
        type: "error",
        text: message,
      });

      throw error;
    } finally {
      setProcessingTask(false);
    }
  };

  const getWorkflowUser = () => {
    if (!user?.uid) {
      throw new Error(
        "Your authenticated user account could not be identified.",
      );
    }

    return {
      uid: user.uid,
      name: user.displayName || user.email || "Employee",
      email: user.email || undefined,
    };
  };

  const handleAcceptTask = async () => {
    await handleTaskAction(
      () =>
        acceptTask({
          assignmentId: id,
          user: getWorkflowUser(),
        }),
      "Task accepted successfully.",
    );
  };

  const handleStartTask = async () => {
    await handleTaskAction(
      () =>
        startTask({
          assignmentId: id,
          user: getWorkflowUser(),
        }),
      "Work session started successfully.",
    );
  };

  const handlePauseTask = async (narration: string) => {
    await handleTaskAction(
      () =>
        pauseTask({
          assignmentId: id,
          user: getWorkflowUser(),
          narration,
        }),
      "Task paused and the completed work session was recorded.",
    );
  };

  const handleResumeTask = async () => {
    await handleTaskAction(
      () =>
        resumeTask({
          assignmentId: id,
          user: getWorkflowUser(),
        }),
      "Task resumed in a new work session.",
    );
  };

  const handleEndTask = async (narration: string) => {
    await handleTaskAction(
      () =>
        endTask({
          assignmentId: id,
          user: getWorkflowUser(),
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

      setWorkflowMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The checklist item could not be updated.",
      });
    }
  };

  const handleAddNote = async (note: string) => {
    if (!user?.uid) {
      throw new Error("You must be signed in to add a note.");
    }

    const createdByName = user.displayName || user.email || "Unknown User";

    const noteReference = await addAssignmentNote({
      assignmentId: id,
      note,
      createdBy: user.uid,
      createdByName,
    });

    setNotes((previous) => [
      ...previous,
      {
        id: noteReference.id,
        assignmentId: id,
        note,
        createdBy: user.uid,
        createdByName,
        createdAt: new Date(),
      },
    ]);
  };

  const handleAddInstruction = async (instruction: string) => {
    if (!user?.uid) {
      throw new Error("You must be signed in to add an instruction.");
    }

    const createdByName = user.displayName || user.email || "Unknown User";

    const instructionReference = await addAssignmentInstruction({
      assignmentId: id,
      instruction,
      createdBy: user.uid,
      createdByName,
    });

    setInstructions((previous) => [
      ...previous,
      {
        id: instructionReference.id,
        assignmentId: id,
        instruction,
        createdBy: user.uid,
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
          <div className="flex min-h-56 items-center justify-center rounded-3xl border border-sky-100 bg-white/70 p-8 text-slate-500 shadow-lg">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
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
            <div className="flex items-center gap-3">
              <AlertCircle size={22} />

              <h1 className="text-xl font-bold">Assignment not found</h1>
            </div>

            <p className="mt-2 text-sm">
              The assignment may have been removed, or you may not have
              permission to view it.
            </p>

            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() =>
                void loadAssignmentData({
                  showRefreshLoader: true,
                })
              }
              className="mt-5 gap-2 rounded-xl"
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Try Again
            </Button>
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

  const overallProgress =
    assignment.status === "completed"
      ? 100
      : checklist.length > 0
        ? Math.round((hoursProgress + checklistProgress) / 2)
        : hoursProgress;

  const health = getAssignmentHealth({
    assignment,
    actualHours,
    checklistProgress,
  });

  const canAddInstruction =
    role === "super_admin" || role === "admin" || role === "manager";

  const shouldShowTaskPanel = currentUserIsAssigned;

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen space-y-6 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-slate-800 sm:text-4xl">
              {assignment.title}
            </h1>

            <p className="mt-1 text-slate-600">{assignment.clientName}</p>

            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
                {formatStatus(assignment.status)}
              </span>

              <span className="inline-flex rounded-full bg-orange-100 px-4 py-1 text-sm font-semibold text-orange-700">
                {formatStatus(assignment.priority)}
              </span>

              <span className="inline-flex rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-slate-600">
                Due: {assignment.dueDate || "-"}
              </span>

              <span className="inline-flex rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-slate-600">
                {assignment.assignedUsers.length} employee
                {assignment.assignedUsers.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={refreshing || processingTask}
            onClick={() =>
              void loadAssignmentData({
                showRefreshLoader: true,
              })
            }
            className="gap-2 self-start rounded-xl border-sky-200 bg-white/70"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </Button>
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
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
              workflowMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {workflowMessage.type === "success" ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
            )}

            <span>{workflowMessage.text}</span>
          </motion.div>
        )}

        {activeTimesheets.length > 0 && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <PlayCircle className="text-emerald-700" />

              <div>
                <p className="font-bold text-emerald-800">
                  Active work session
                  {activeTimesheets.length > 1 ? "s" : ""}
                </p>

                <p className="text-sm text-emerald-700">
                  {activeTimesheets
                    .map((item) => item.userName || "Employee")
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Estimated Hours</p>

            <h2 className="mt-1 text-3xl font-black text-slate-800">
              {estimatedHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Recorded Hours</p>

            <h2 className="mt-1 text-3xl font-black text-slate-800">
              {actualHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Remaining Hours</p>

            <h2 className="mt-1 text-3xl font-black text-slate-800">
              {remainingHours.toFixed(2)}
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Checklist</p>

            <h2 className="mt-1 text-3xl font-black text-slate-800">
              {checklistProgress}%
            </h2>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
            <p className="text-sm text-slate-500">Overall Progress</p>

            <h2 className="mt-1 text-3xl font-black text-slate-800">
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

          <div className="h-3 overflow-hidden rounded-full bg-sky-100">
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

        {!shouldShowTaskPanel && role === "employee" && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-amber-700" />

              <div>
                <p className="font-bold text-amber-800">
                  This assignment is not assigned to you
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  You can view the assignment details, but workflow actions are
                  unavailable.
                </p>
              </div>
            </div>
          </div>
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
            <div className="mb-5 flex items-center gap-3">
              <Users className="text-sky-700" />

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Employee Progress
                </h2>

                <p className="text-sm text-slate-500">
                  Individual status and recorded work
                </p>
              </div>
            </div>

            {employeeContributions.length === 0 ? (
              <p className="text-slate-500">No employees assigned.</p>
            ) : (
              <div className="space-y-4">
                {employeeContributions.map((employee) => (
                  <div
                    key={employee.userId || employee.name}
                    className="rounded-2xl border border-sky-100 bg-white/70 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-slate-800">
                          {employee.name}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getEmployeeStatusClasses(
                              employee.status,
                            )}`}
                          >
                            {formatStatus(employee.status)}
                          </span>

                          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {employee.sessionCount} session
                            {employee.sessionCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-2xl font-black text-slate-800">
                          {employee.totalHours.toFixed(2)}
                        </p>

                        <p className="text-xs text-slate-500">recorded hours</p>
                      </div>
                    </div>

                    {employee.latestNarration && (
                      <p className="mt-3 border-t border-sky-50 pt-3 text-sm leading-6 text-slate-600">
                        {employee.latestNarration}
                      </p>
                    )}
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
                {formatStatus(assignment.assignmentType)}
              </p>

              <p>
                <span className="font-semibold text-slate-700">Priority:</span>{" "}
                {formatStatus(assignment.priority)}
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

              {currentUserIsAssigned && (
                <p>
                  <span className="font-semibold text-slate-700">
                    Your Status:
                  </span>{" "}
                  {formatStatus(currentUserProgress?.status || "assigned")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <TimerReset className="text-sky-700" />

            <div>
              <h2 className="text-xl font-bold text-slate-800">Work History</h2>

              <p className="text-sm text-slate-500">
                Each resume action creates a separate session
              </p>
            </div>
          </div>

          {timesheets.length === 0 ? (
            <p className="text-slate-500">No timesheet records found.</p>
          ) : (
            <div className="space-y-4">
              {[...timesheets]
                .sort(
                  (first, second) =>
                    getTimesheetStartMilliseconds(second) -
                    getTimesheetStartMilliseconds(first),
                )
                .map((item, index) => {
                  const sessionMinutes = calculateSessionMinutes(item);

                  const sessionHours = Number((sessionMinutes / 60).toFixed(2));

                  return (
                    <div
                      key={item.id || `${item.userId}-${index}`}
                      className="rounded-2xl border border-sky-100 bg-white/70 p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-800">
                              {item.userName || "Unknown User"}
                            </p>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${getSessionStatusClasses(
                                item.status,
                              )}`}
                            >
                              {formatStatus(item.status)}
                            </span>

                            {item.actionType && (
                              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {formatStatus(item.actionType)}
                              </span>
                            )}

                            {item.sessionNumber && (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                Session {item.sessionNumber}
                              </span>
                            )}
                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {getTimesheetNarration(item)}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <PlayCircle size={14} />
                              Started:{" "}
                              {formatDateTime(item.startTime || item.checkIn)}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              {item.status === "paused" ? (
                                <PauseCircle size={14} />
                              ) : (
                                <Clock3 size={14} />
                              )}
                              Ended:{" "}
                              {formatDateTime(item.endTime || item.checkOut)}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 md:text-right">
                          <p className="text-2xl font-black text-slate-800">
                            {sessionHours.toFixed(2)} hrs
                          </p>

                          <p className="text-sm text-slate-500">
                            {sessionMinutes} minutes
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.date || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <ActivityTimeline activities={activities} />
      </div>
    </>
  );
}
