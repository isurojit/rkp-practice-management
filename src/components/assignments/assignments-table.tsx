"use client";

import { Assignment } from "@/types/assignment";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Props {
  assignments: Assignment[];
}

export default function AssignmentsTable({ assignments }: Props) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-4 text-left">Assignment</th>

            <th className="p-4 text-left">Client</th>

            <th className="p-4 text-left">Type</th>

            <th className="p-4 text-left">Hours</th>

            <th className="p-4 text-left">Status</th>

            <th className="p-4 text-left">Due Date</th>
          </tr>
        </thead>

        <tbody>
          {assignments.map((assignment) => (
            <tr
              key={assignment.id}
              className="border-t hover:bg-muted/50 cursor-pointer"
            >
              <td className="p-4">
                <Link
                  href={`/dashboard/assignments/${assignment.id}`}
                  className="font-medium hover:underline"
                >
                  {assignment.title}
                </Link>
              </td>
              <td className="p-4">{assignment.title}</td>

              <td className="p-4">{assignment.clientName}</td>

              <td className="p-4">{assignment.assignmentType}</td>

              <td className="p-4">{assignment.estimatedHours}</td>

              <td className="p-4">
                <Badge>{assignment.status}</Badge>
              </td>

              <td className="p-4">{assignment.dueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
