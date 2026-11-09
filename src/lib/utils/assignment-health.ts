import { Assignment } from "@/types/assignment";

export function getAssignmentHealth({
  assignment,
  actualHours,
  checklistProgress,
}: {
  assignment: Assignment;
  actualHours: number;
  checklistProgress: number;
}) {
  const today = new Date();
  const dueDate = new Date(assignment.dueDate);

  const daysRemaining = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const estimatedHours = Number(assignment.estimatedHours || 0);

  if (assignment.status === "completed") {
    return {
      label: "Completed",
      color: "green",
      message: "Assignment has been completed.",
      daysRemaining,
    };
  }

  if (daysRemaining < 0) {
    return {
      label: "Overdue",
      color: "red",
      message: `Overdue by ${Math.abs(daysRemaining)} day(s).`,
      daysRemaining,
    };
  }

  if (estimatedHours > 0 && actualHours > estimatedHours) {
    return {
      label: "Over Budget",
      color: "red",
      message: "Actual hours exceeded estimated hours.",
      daysRemaining,
    };
  }

  if (daysRemaining <= 3 && checklistProgress < 80) {
    return {
      label: "At Risk",
      color: "orange",
      message: "Due date is near and checklist is not sufficiently completed.",
      daysRemaining,
    };
  }

  return {
    label: "On Track",
    color: "sky",
    message: `${daysRemaining} day(s) remaining.`,
    daysRemaining,
  };
}
