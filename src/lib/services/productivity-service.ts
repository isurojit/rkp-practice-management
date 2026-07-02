import { getTimesheets } from "./timesheet-service";

export async function getEmployeeProductivity() {
  const timesheets = await getTimesheets();

  const employeeMap: Record<
    string,
    {
      userName: string;
      totalHours: number;
      assignments: Set<string>;
      active: boolean;
    }
  > = {};

  timesheets.forEach((item: any) => {
    if (!employeeMap[item.userId]) {
      employeeMap[item.userId] = {
        userName: item.userName,
        totalHours: 0,
        assignments: new Set(),
        active: false,
      };
    }

    employeeMap[item.userId].totalHours += Number(item.totalHours || 0);

    if (item.assignmentName) {
      employeeMap[item.userId].assignments.add(item.assignmentName);
    }

    if (item.status === "active") {
      employeeMap[item.userId].active = true;
    }
  });

  return Object.values(employeeMap)
    .map((employee) => ({
      ...employee,
      assignments: employee.assignments.size,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}
