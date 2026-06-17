"use client";

interface Props {
  timesheets: any[];
}

export default function TimesheetHistoryTable({ timesheets }: Props) {
  return (
    <div className="rounded-2xl border border-sky-100 overflow-hidden bg-white/60">
      <table className="w-full">
        <thead className="bg-sky-50">
          <tr>
            <th className="p-4 text-left">Date</th>
            <th className="p-4 text-left">Work Type</th>
            <th className="p-4 text-left">Work / Assignment</th>
            <th className="p-4 text-left">Client</th>
            <th className="p-4 text-left">Hours</th>
            <th className="p-4 text-left">Location</th>
            <th className="p-4 text-left">Narration</th>
            <th className="p-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {[...timesheets]
            .sort(
              (a, b) =>
                new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
            )
            .map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-4">{item.date}</td>

                <td className="p-4">
                  {item.workType === "miscellaneous"
                    ? "Miscellaneous"
                    : "Assignment"}
                </td>

                <td className="p-4">
                  {item.workType === "miscellaneous"
                    ? "Miscellaneous Work"
                    : item.assignmentName}
                </td>

                <td className="p-4">
                  {item.workType === "miscellaneous" ? "-" : item.clientName}
                </td>

                <td className="p-4">
                  {item.totalHours
                    ? `${Number(item.totalHours).toFixed(2)} hrs`
                    : "-"}
                </td>

                <td className="p-4">{item.locationType}</td>

                <td className="p-4">
                  {item.workType === "miscellaneous"
                    ? item.miscellaneousNarration || "-"
                    : item.workDescription || "-"}
                </td>

                <td className="p-4">{item.status}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
