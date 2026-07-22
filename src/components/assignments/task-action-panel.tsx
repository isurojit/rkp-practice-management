"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Loader2,
  Play,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Assignment,
  AssignmentEmployeeProgress,
  EmployeeTaskStatus,
} from "@/types/assignment";

interface TaskActionPanelProps {
  assignment: Assignment;

  userId: string;
  userName: string;
  userEmail?: string;

  processing?: boolean;

  onAccept: () => Promise<void>;
  onStart: () => Promise<void>;
  onPause: (narration: string) => Promise<void>;
  onResume: () => Promise<void>;
  onEnd: (narration: string) => Promise<void>;
}

type NarrationAction = "pause" | "end" | null;

function normaliseEmployeeId(
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

function formatStatus(status: EmployeeTaskStatus): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClasses(status: EmployeeTaskStatus): string {
  switch (status) {
    case "assigned":
      return "border-slate-200 bg-slate-100 text-slate-700";

    case "accepted":
      return "border-blue-200 bg-blue-100 text-blue-700";

    case "in_progress":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";

    case "paused":
      return "border-amber-200 bg-amber-100 text-amber-700";

    case "completed":
      return "border-violet-200 bg-violet-100 text-violet-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getCurrentEmployeeProgress(
  assignment: Assignment,
  userId: string,
): AssignmentEmployeeProgress | null {
  const existingProgress = assignment.employeeProgress?.find(
    (item) => item.userId === userId,
  );

  if (existingProgress) {
    return existingProgress;
  }

  const isAssigned = assignment.assignedUsers.some(
    (employee) => normaliseEmployeeId(employee) === userId,
  );

  if (!isAssigned) {
    return null;
  }

  return {
    userId,
    userName: "",
    status: "assigned",
    totalMinutes: 0,
    totalHours: 0,
    sessionCount: 0,
  };
}

export default function TaskActionPanel({
  assignment,
  userId,
  userName,
  userEmail,
  processing = false,
  onAccept,
  onStart,
  onPause,
  onResume,
  onEnd,
}: TaskActionPanelProps) {
  const [narrationAction, setNarrationAction] = useState<NarrationAction>(null);

  const [narration, setNarration] = useState("");

  const [error, setError] = useState("");

  const employeeProgress = useMemo(
    () => getCurrentEmployeeProgress(assignment, userId),
    [assignment, userId],
  );

  const employeeStatus = employeeProgress?.status || "assigned";

  const totalHours = Number(employeeProgress?.totalHours || 0);

  const totalMinutes = Number(employeeProgress?.totalMinutes || 0);

  const sessionCount = Number(employeeProgress?.sessionCount || 0);

  const isAssigned = assignment.assignedUsers.some(
    (employee) => normaliseEmployeeId(employee) === userId,
  );

  const resetNarration = () => {
    setNarration("");
    setNarrationAction(null);
    setError("");
  };

  const runSimpleAction = async (action: () => Promise<void>) => {
    try {
      setError("");
      await action();
    } catch (actionError) {
      console.error("Task action failed:", actionError);

      setError(
        actionError instanceof Error
          ? actionError.message
          : "The task action could not be completed.",
      );
    }
  };

  const submitNarrationAction = async () => {
    const cleanedNarration = narration.trim();

    if (!narrationAction) {
      return;
    }

    if (!cleanedNarration) {
      setError(
        narrationAction === "pause"
          ? "Narration is required before pausing the task."
          : "Final narration is required before ending the task.",
      );

      return;
    }

    try {
      setError("");

      if (narrationAction === "pause") {
        await onPause(cleanedNarration);
      } else {
        await onEnd(cleanedNarration);
      }

      resetNarration();
    } catch (actionError) {
      console.error("Narration action failed:", actionError);

      setError(
        actionError instanceof Error
          ? actionError.message
          : "The task action could not be completed.",
      );
    }
  };

  if (!userId) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
        <p className="font-semibold text-amber-800">
          Your user account could not be identified.
        </p>
      </section>
    );
  }

  if (!isAssigned) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
        <p className="font-semibold text-slate-700">
          This task is not assigned to you.
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Only assigned employees can accept and work on this task.
        </p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-3xl border border-sky-100 bg-white/75 p-6 shadow-lg backdrop-blur-xl"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Your task workflow
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800">
              {userName || userEmail || "Employee"}
            </h2>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                employeeStatus,
              )}`}
            >
              {formatStatus(employeeStatus)}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Accept the assigned task, start work, pause with narration, resume
            later, or end the task with a final narration.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Total Hours</p>

            <p className="mt-1 text-xl font-black text-slate-800">
              {totalHours.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Minutes</p>

            <p className="mt-1 text-xl font-black text-slate-800">
              {totalMinutes}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Sessions</p>

            <p className="mt-1 text-xl font-black text-slate-800">
              {sessionCount}
            </p>
          </div>
        </div>
      </div>

      {employeeProgress?.latestNarration && (
        <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Latest Narration
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {employeeProgress.latestNarration}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {employeeStatus === "assigned" && (
          <Button
            type="button"
            disabled={processing}
            onClick={() => runSimpleAction(onAccept)}
            className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            {processing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Accept Task
          </Button>
        )}

        {employeeStatus === "accepted" && (
          <Button
            type="button"
            disabled={processing}
            onClick={() => runSimpleAction(onStart)}
            className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
          >
            {processing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Play size={17} />
            )}
            Start Task
          </Button>
        )}

        {employeeStatus === "in_progress" && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={processing}
              onClick={() => {
                setNarrationAction("pause");
                setNarration("");
                setError("");
              }}
              className="gap-2 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <CirclePause size={17} />
              Pause Task
            </Button>

            <Button
              type="button"
              disabled={processing}
              onClick={() => {
                setNarrationAction("end");
                setNarration("");
                setError("");
              }}
              className="gap-2 rounded-xl bg-rose-600 hover:bg-rose-700"
            >
              <Square size={16} />
              End Task
            </Button>
          </>
        )}

        {employeeStatus === "paused" && (
          <>
            <Button
              type="button"
              disabled={processing}
              onClick={() => runSimpleAction(onResume)}
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <CirclePlay size={17} />
              )}
              Resume Task
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={processing}
              onClick={() => {
                setNarrationAction("end");
                setNarration("");
                setError("");
              }}
              className="gap-2 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              <Square size={16} />
              End Task
            </Button>
          </>
        )}

        {employeeStatus === "completed" && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 font-semibold text-violet-700">
            <CheckCircle2 size={18} />
            Your work on this task is completed
          </div>
        )}
      </div>

      {narrationAction && (
        <motion.div
          initial={{
            opacity: 0,
            height: 0,
          }}
          animate={{
            opacity: 1,
            height: "auto",
          }}
          className="mt-6 overflow-hidden"
        >
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
            <div>
              <h3 className="font-bold text-slate-800">
                {narrationAction === "pause" ? "Pause Task" : "End Task"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {narrationAction === "pause"
                  ? "Describe the work completed so far and why the task is being paused."
                  : "Enter the final narration describing the work completed."}
              </p>
            </div>

            <Textarea
              value={narration}
              onChange={(event) => {
                setNarration(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              disabled={processing}
              placeholder={
                narrationAction === "pause"
                  ? "Example: Completed bank reconciliation up to March. Waiting for client confirmation."
                  : "Example: Completed ledger scrutiny and prepared the final exception summary."
              }
              className="mt-4 min-h-32 resize-y border-white bg-white/90"
            />

            {error && (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={processing}
                onClick={resetNarration}
                className="rounded-xl"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={processing}
                onClick={submitNarrationAction}
                className={`gap-2 rounded-xl ${
                  narrationAction === "pause"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {processing ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : narrationAction === "pause" ? (
                  <CirclePause size={17} />
                ) : (
                  <Square size={16} />
                )}

                {processing
                  ? "Processing..."
                  : narrationAction === "pause"
                    ? "Confirm Pause"
                    : "Confirm End"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {!narrationAction && error && (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      )}
    </motion.section>
  );
}
