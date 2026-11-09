"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Clock,
  Loader2,
  MapPin,
  PauseCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { checkoutTimesheet } from "@/lib/services/timesheet-service";

import { Timesheet } from "@/types/timesheet";

interface Props {
  session: Timesheet;
  onSessionEnded?: () => void;
}

function convertToDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }

  const date = new Date(value as string | number);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: unknown): string {
  const date = convertToDate(value);

  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatText(value: unknown): string {
  if (!value) {
    return "Not specified";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ActiveSessionCard({ session, onSessionEnded }: Props) {
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extendedSession = session as Timesheet & {
    checkIn?: unknown;
    startTime?: unknown;
    workType?: string;
    assignmentId?: string;
    assignmentName?: string;
    clientName?: string;
    locationType?: string;
    miscellaneousNarration?: string;
    narration?: string;
  };

  const isMiscellaneous = extendedSession.workType === "miscellaneous";

  const sessionStart = extendedSession.startTime || extendedSession.checkIn;

  const sessionTitle = isMiscellaneous
    ? "Miscellaneous Work"
    : extendedSession.assignmentName || "Assignment Work";

  const sessionDescription = isMiscellaneous
    ? extendedSession.miscellaneousNarration ||
      extendedSession.narration ||
      "Miscellaneous work session"
    : extendedSession.clientName || "Assignment-based work session";

  const handleStopWork = async () => {
    // Assignment sessions must use the task workflow.
    if (!isMiscellaneous) {
      return;
    }

    // Validate the timesheet document ID.
    const timesheetId = session.id;

    if (!timesheetId) {
      setError("Timesheet ID is missing. Unable to stop work.");
      return;
    }

    try {
      setStopping(true);
      setError(null);

      // The service retrieves the original check-in time.
      await checkoutTimesheet(timesheetId);

      // Refresh the parent timesheets page.
      onSessionEnded?.();
    } catch (error) {
      console.error("Failed to stop miscellaneous work:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to stop work. Please try again.",
      );
    } finally {
      setStopping(false);
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-3xl border border-sky-100 bg-white/75 p-6 shadow-xl backdrop-blur-xl"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

            {isMiscellaneous
              ? "Active Miscellaneous Work"
              : "Active Assignment"}
          </div>

          <h2 className="mt-4 text-2xl font-black text-slate-800">
            {sessionTitle}
          </h2>

          <p className="mt-2 max-w-2xl leading-6 text-slate-500">
            {sessionDescription}
          </p>
        </div>

        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 md:flex">
          <BriefcaseBusiness />
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock size={16} />
            Started
          </div>

          <p className="mt-2 font-semibold text-slate-800">
            {formatDateTime(sessionStart)}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} />
            Location
          </div>

          <p className="mt-2 font-semibold text-slate-800">
            {formatText(extendedSession.locationType)}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <PauseCircle size={16} />
            Action
          </div>

          {isMiscellaneous ? (
            <Button
              type="button"
              disabled={stopping}
              onClick={handleStopWork}
              className="mt-3 w-full gap-2 rounded-xl"
            >
              {stopping ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <PauseCircle size={16} />
                  Stop Work
                </>
              )}
            </Button>
          ) : extendedSession.assignmentId ? (
            <Button asChild className="mt-3 w-full gap-2 rounded-xl">
              <Link
                href={`/dashboard/assignments/${extendedSession.assignmentId}`}
              >
                Continue Assignment
                <ArrowRight size={16} />
              </Link>
            </Button>
          ) : (
            <Button type="button" disabled className="mt-3 w-full rounded-xl">
              Assignment unavailable
            </Button>
          )}
        </div>
      </div>

      {!isMiscellaneous && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Assignment work must be paused or completed from the assignment
          details page. This ensures that narration, employee progress and
          activity records remain synchronized.
        </div>
      )}
    </motion.div>
  );
}
