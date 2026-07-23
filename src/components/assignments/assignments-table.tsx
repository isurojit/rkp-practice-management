"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CirclePause,
  Clock3,
  FileText,
  User2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Assignment } from "@/types/assignment";

interface Props {
  assignments: Assignment[];
}

function formatText(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusVariant(status: string) {
  switch (status) {
    case "assigned":
      return "secondary";

    case "accepted":
      return "default";

    case "in_progress":
      return "default";

    case "paused":
      return "outline";

    case "completed":
      return "default";

    default:
      return "secondary";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "assigned":
      return <User2 className="h-3 w-3" />;

    case "accepted":
      return <FileText className="h-3 w-3" />;

    case "in_progress":
      return <Clock3 className="h-3 w-3" />;

    case "paused":
      return <CirclePause className="h-3 w-3" />;

    case "completed":
      return <CheckCircle2 className="h-3 w-3" />;

    default:
      return null;
  }
}

function getAssignedEmployeeCount(assignment: Assignment) {
  return assignment.assignedUsers.length;
}

function getCompletedEmployees(assignment: Assignment) {
  return (
    assignment.employeeProgress?.filter(
      (employee) => employee.status === "completed",
    ).length || 0
  );
}

export default function AssignmentsTable({ assignments }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px]">
          <thead className="border-b bg-sky-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                Assignment
              </th>

              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                Client
              </th>

              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                Type
              </th>

              <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                Employees
              </th>

              <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                Progress
              </th>

              <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                Hours
              </th>

              <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                Status
              </th>

              <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                Due
              </th>

              <th className="px-6 py-4 text-center text-sm font-bold text-slate-700"></th>
            </tr>
          </thead>

          <tbody>
            {assignments.map((assignment) => {
              const completed = getCompletedEmployees(assignment);

              const totalEmployees = getAssignedEmployeeCount(assignment);

              return (
                <tr
                  key={assignment.id}
                  className="border-b transition hover:bg-sky-50"
                >
                  <td className="px-6 py-5">
                    <div>
                      <Link
                        href={`/dashboard/assignments/${assignment.id}`}
                        className="font-semibold text-slate-800 hover:text-sky-700 hover:underline"
                      >
                        {assignment.title}
                      </Link>

                      {assignment.remarks && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {assignment.remarks}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-slate-700">
                    {assignment.clientName}
                  </td>

                  <td className="px-6 py-5">
                    <Badge variant="outline">
                      {formatText(assignment.assignmentType)}
                    </Badge>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="font-semibold">{totalEmployees}</div>

                    <div className="text-xs text-slate-500">Assigned</div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="font-semibold">
                      {completed}/{totalEmployees}
                    </div>

                    <div className="text-xs text-slate-500">Completed</div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="font-semibold">
                      {Number(assignment.estimatedHours).toFixed(1)}
                    </div>

                    <div className="text-xs text-slate-500">Est.</div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <Badge
                      variant={getStatusVariant(assignment.status)}
                      className="gap-1"
                    >
                      {getStatusIcon(assignment.status)}

                      {formatText(assignment.status)}
                    </Badge>
                  </td>

                  <td className="px-6 py-5 text-center text-slate-700">
                    {assignment.dueDate || "-"}
                  </td>

                  <td className="px-6 py-5 text-center">
                    <Link
                      href={`/dashboard/assignments/${assignment.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
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
