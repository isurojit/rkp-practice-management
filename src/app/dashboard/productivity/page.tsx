"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, Trophy, Users } from "lucide-react";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import { getEmployeeProductivity } from "@/lib/services/productivity-service";

export default function ProductivityPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProductivity() {
      try {
        const data = await getEmployeeProductivity();
        setEmployees(data);
      } catch (error) {
        console.error("Failed to load productivity:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProductivity();
  }, []);

  const totalHours = useMemo(() => {
    return employees.reduce(
      (sum, employee) => sum + Number(employee.totalHours || 0),
      0,
    );
  }, [employees]);

  const activeEmployees = employees.filter(
    (employee) => employee.active,
  ).length;

  const topEmployee = employees[0];

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">Productivity</h1>

          <p className="text-slate-600 mt-1">
            Employee-wise work hours, activity and assignment contribution
          </p>
        </motion.div>

        {loading ? (
          <div className="rounded-3xl border border-sky-100 bg-white/70 p-8 shadow-lg">
            Loading productivity data...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Employees</p>
                    <h2 className="text-3xl font-black text-slate-800">
                      {employees.length}
                    </h2>
                  </div>

                  <Users className="text-sky-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Hours</p>
                    <h2 className="text-3xl font-black text-slate-800">
                      {totalHours.toFixed(2)}
                    </h2>
                  </div>

                  <Clock3 className="text-sky-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Active Now</p>
                    <h2 className="text-3xl font-black text-slate-800">
                      {activeEmployees}
                    </h2>
                  </div>

                  <Activity className="text-green-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Top Performer</p>
                    <h2 className="text-lg font-black text-slate-800">
                      {topEmployee?.userName || "-"}
                    </h2>
                  </div>

                  <Trophy className="text-yellow-500" />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Employee Productivity Ranking
              </h2>

              {employees.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  No productivity records found.
                </div>
              ) : (
                <div className="rounded-2xl border bg-white/80 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-sky-50">
                      <tr>
                        <th className="p-4 text-left">Rank</th>
                        <th className="p-4 text-left">Employee</th>
                        <th className="p-4 text-left">Total Hours</th>
                        <th className="p-4 text-left">Assignments</th>
                        <th className="p-4 text-left">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {employees.map((employee, index) => (
                        <tr key={employee.userName} className="border-t">
                          <td className="p-4 font-semibold">#{index + 1}</td>

                          <td className="p-4">{employee.userName}</td>

                          <td className="p-4">
                            {Number(employee.totalHours || 0).toFixed(2)}
                          </td>

                          <td className="p-4">{employee.assignments}</td>

                          <td className="p-4">
                            {employee.active ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                                Working Now
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                                Not Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
