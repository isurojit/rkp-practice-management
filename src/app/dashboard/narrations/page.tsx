"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import { getTimesheets } from "@/lib/services/timesheet-service";
import { Timesheet } from "@/types/timesheet";

export default function NarrationsPage() {
  const [records, setRecords] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    async function loadNarrations() {
      try {
        const data = await getTimesheets();
        setRecords(data);
      } catch (error) {
        console.error("Failed to load narrations:", error);
      } finally {
        setLoading(false);
      }
    }

    loadNarrations();
  }, []);
  const filteredRecords = records.filter((item) => {
    const matchesFrom = fromDate ? item.date >= fromDate : true;
    const matchesTo = toDate ? item.date <= toDate : true;

    const matchesEmployee = employeeSearch
      ? item.userName?.toLowerCase().includes(employeeSearch.toLowerCase())
      : true;

    return matchesFrom && matchesTo && matchesEmployee;
  });
  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">
            Work Narrations
          </h1>

          <p className="text-slate-600 mt-1">
            Review employee work descriptions, miscellaneous notes and daily
            activity.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
          {loading ? (
            <div className="text-slate-500">Loading narrations...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No narration records found.
            </div>
          ) : (
            <div className="rounded-2xl border bg-white/80 overflow-hidden">
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-xl border bg-white text-slate-950 px-4 py-2"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-xl border bg-white text-slate-950 px-4 py-2"
                />

                <input
                  placeholder="Search employee"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="rounded-xl border bg-white text-slate-950 px-4 py-2"
                />
              </div>
              <table className="w-full">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Employee</th>
                    <th className="p-4 text-left">Work Type</th>
                    <th className="p-4 text-left">Client / Misc</th>
                    <th className="p-4 text-left">Assignment</th>
                    <th className="p-4 text-left">Narration</th>
                    <th className="p-4 text-left">Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {[...filteredRecords]
                    .sort(
                      (a, b) =>
                        new Date(b.checkIn).getTime() -
                        new Date(a.checkIn).getTime(),
                    )
                    .map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-4">{item.date}</td>

                        <td className="p-4">{item.userName}</td>

                        <td className="p-4">
                          {item.workType === "miscellaneous"
                            ? "Miscellaneous"
                            : "Assignment"}
                        </td>

                        <td className="p-4">
                          {item.workType === "miscellaneous"
                            ? "Miscellaneous"
                            : item.clientName || "-"}
                        </td>

                        <td className="p-4">
                          {item.workType === "miscellaneous"
                            ? "-"
                            : item.assignmentName || "-"}
                        </td>

                        <td className="p-4">
                          {item.workType === "miscellaneous"
                            ? item.miscellaneousNarration || "-"
                            : item.workDescription || "-"}
                        </td>

                        <td className="p-4">
                          {item.totalHours
                            ? Number(item.totalHours).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
