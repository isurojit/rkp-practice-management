"use client";

import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard/dashboard-header";

import AssignmentsTable from "@/components/assignments/assignments-table";
import AddAssignmentDialog from "@/components/assignments/add-assignment-dialog";

import { getAssignments } from "@/lib/services/assignment-service";
import { Assignment } from "@/types/assignment";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const data = await getAssignments();

        setAssignments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  return (
    <>
      <DashboardHeader />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Assignments</h1>

            <p className="text-muted-foreground">
              Manage audit and tax assignments
            </p>
          </div>

          <AddAssignmentDialog />
        </div>

        {loading ? (
          <div>Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="border rounded-xl p-10 text-center">
            No assignments found
          </div>
        ) : (
          <AssignmentsTable assignments={assignments} />
        )}
      </div>
    </>
  );
}
