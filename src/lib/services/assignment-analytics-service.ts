import { getAssignments } from "./assignment-service";
import { getTimesheets } from "./timesheet-service";
import { getAssignmentChecklist } from "./assignment-checklist-service";

export async function getAssignmentsWithAnalytics() {
  const assignments = await getAssignments();
  const timesheets = await getTimesheets();

  const result = await Promise.all(
    assignments.map(async (assignment: any) => {
      const assignmentTimesheets = timesheets.filter(
        (item: any) => item.assignmentId === assignment.id,
      );

      const actualHours = assignmentTimesheets.reduce(
        (sum: number, item: any) => sum + Number(item.totalHours || 0),
        0,
      );

      const checklist = await getAssignmentChecklist(assignment.id);

      const checklistProgress =
        checklist.length === 0
          ? 0
          : Math.round(
              (checklist.filter((item) => item.completed).length /
                checklist.length) *
                100,
            );

      return {
        ...assignment,
        actualHours,
        checklistProgress,
      };
    }),
  );

  return result;
}
