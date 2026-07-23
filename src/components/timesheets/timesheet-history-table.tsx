"use client";

import Link from "next/link";

import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  MapPin,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Timesheet } from "@/types/timesheet";

interface Props {
  timesheets: Timesheet[];
}

type ExtendedTimesheet = Timesheet & {
  checkIn?: unknown;
  checkOut?: unknown;
  startTime?: unknown;
  endTime?: unknown;

  workType?: string;

  assignmentId?: string;
  assignmentName?: string;

  clientName?: string;

  locationType?: string;

  miscellaneousNarration?: string;
  workDescription?: string;
  narration?: string;
  pauseNarration?: string;
  endNarration?: string;

  userName?: string;
  userEmail?: string;

  totalMinutes?: number;
};

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

  const parsedDate = new Date(value as string | number);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getSessionStart(timesheet: ExtendedTimesheet): Date | null {
  return convertToDate(
    timesheet.startTime || timesheet.checkIn || timesheet.date,
  );
}

function getSessionEnd(timesheet: ExtendedTimesheet): Date | null {
  return convertToDate(timesheet.endTime || timesheet.checkOut);
}

function formatDate(value: unknown): string {
  const date = convertToDate(value);

  if (!date) {
    return value ? String(value) : "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: unknown): string {
  const date = convertToDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatText(value: unknown): string {
  if (!value) {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getWorkedMinutes(timesheet: ExtendedTimesheet): number {
  if (
    typeof timesheet.totalMinutes === "number" &&
    Number.isFinite(timesheet.totalMinutes)
  ) {
    return Math.max(0, timesheet.totalMinutes);
  }

  if (
    typeof timesheet.totalHours === "number" &&
    Number.isFinite(timesheet.totalHours)
  ) {
    return Math.max(0, Math.round(timesheet.totalHours * 60));
  }

  const start = getSessionStart(timesheet);
  const end = getSessionEnd(timesheet);

  if (!start || !end || end <= start) {
    return 0;
  }

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function formatDuration(timesheet: ExtendedTimesheet): string {
  const totalMinutes = getWorkedMinutes(timesheet);

  if (totalMinutes <= 0) {
    return timesheet.status === "active" ? "Running" : "-";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function getNarration(timesheet: ExtendedTimesheet): string {
  if (timesheet.workType === "miscellaneous") {
    return (
      timesheet.miscellaneousNarration ||
      timesheet.narration ||
      timesheet.workDescription ||
      "-"
    );
  }

  return (
    timesheet.endNarration ||
    timesheet.pauseNarration ||
    timesheet.workDescription ||
    timesheet.narration ||
    "-"
  );
}

function getStatusBadgeClasses(status: string): string {
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

function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <PlayCircle className="h-3.5 w-3.5" />;

    case "paused":
      return <PauseCircle className="h-3.5 w-3.5" />;

    case "completed":
    case "stopped":
      return <CheckCircle2 className="h-3.5 w-3.5" />;

    default:
      return <Clock3 className="h-3.5 w-3.5" />;
  }
}

function getWorkTypeBadgeClasses(workType: string): string {
  return workType === "miscellaneous"
    ? "border-orange-200 bg-orange-50 text-orange-700"
    : "border-sky-200 bg-sky-50 text-sky-700";
}

export default function TimesheetHistoryTable({ timesheets }: Props) {
  const sortedTimesheets = [...timesheets].sort((first, second) => {
    const firstDate = getSessionStart(first as ExtendedTimesheet);

    const secondDate = getSessionStart(second as ExtendedTimesheet);

    return (secondDate?.getTime() || 0) - (firstDate?.getTime() || 0);
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white/70 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1450px]">
          <thead className="border-b border-sky-100 bg-sky-50/90">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Date
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Employee
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Work Type
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Work / Assignment
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Client
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Start
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                End
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Duration
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Location
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Narration
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Status
              </th>

              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedTimesheets.map((timesheet) => {
              const item = timesheet as ExtendedTimesheet;

              const isMiscellaneous = item.workType === "miscellaneous";

              const start = getSessionStart(item);
              const end = getSessionEnd(item);

              const title = isMiscellaneous
                ? "Miscellaneous Work"
                : item.assignmentName || "Assignment Work";

              return (
                <tr
                  key={item.id}
                  className="border-b border-sky-50 align-top transition last:border-b-0 hover:bg-sky-50/60"
                >
                  <td className="px-5 py-5">
                    <p className="whitespace-nowrap font-semibold text-slate-800">
                      {formatDate(item.date || start)}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    <div className="min-w-[150px]">
                      <p className="font-semibold text-slate-800">
                        {item.userName || "Employee"}
                      </p>

                      {item.userEmail && (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.userEmail}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <Badge
                      variant="outline"
                      className={`gap-1.5 whitespace-nowrap ${getWorkTypeBadgeClasses(
                        item.workType || "",
                      )}`}
                    >
                      {isMiscellaneous ? (
                        <FileText className="h-3.5 w-3.5" />
                      ) : (
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                      )}

                      {isMiscellaneous ? "Miscellaneous" : "Assignment"}
                    </Badge>
                  </td>

                  <td className="px-5 py-5">
                    <div className="min-w-[190px]">
                      {item.assignmentId && !isMiscellaneous ? (
                        <Link
                          href={`/dashboard/assignments/${item.assignmentId}`}
                          className="font-semibold text-slate-800 transition hover:text-sky-700 hover:underline"
                        >
                          {title}
                        </Link>
                      ) : (
                        <p className="font-semibold text-slate-800">{title}</p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <p className="min-w-[140px] text-slate-700">
                      {isMiscellaneous ? "-" : item.clientName || "-"}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    <p className="whitespace-nowrap font-medium text-slate-700">
                      {formatTime(start)}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    <p className="whitespace-nowrap font-medium text-slate-700">
                      {item.status === "active" ? "Running" : formatTime(end)}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    <div className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-slate-800">
                      <Clock3 className="h-4 w-4 text-sky-600" />

                      {formatDuration(item)}
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex min-w-[130px] items-start gap-2 text-slate-700">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />

                      <span>{formatText(item.locationType)}</span>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <p
                      className="max-w-[280px] whitespace-normal leading-6 text-slate-600"
                      title={getNarration(item)}
                    >
                      {getNarration(item)}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    <Badge
                      variant="outline"
                      className={`gap-1.5 whitespace-nowrap ${getStatusBadgeClasses(
                        item.status,
                      )}`}
                    >
                      {getStatusIcon(item.status)}

                      {formatText(item.status)}
                    </Badge>
                  </td>

                  <td className="px-5 py-5 text-center">
                    {item.assignmentId && !isMiscellaneous ? (
                      <Link
                        href={`/dashboard/assignments/${item.assignmentId}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                      >
                        Open
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
