"use client";

import { motion } from "framer-motion";

interface Props {
  employees: any[];
}

export default function ActiveEmployeesWidget({ employees }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        backdrop-blur-xl
        bg-white/60
        border border-white/40
        rounded-3xl
        p-6
        shadow-xl
      "
    >
      <h2 className="text-xl font-bold mb-4">Employees Working Right Now</h2>

      {employees.length === 0 ? (
        <p className="text-slate-500">No active sessions</p>
      ) : (
        <div className="space-y-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex justify-between items-center border-b pb-3"
            >
              <div>
                <p className="font-semibold">{employee.userName}</p>

                <p className="text-sm text-slate-500">
                  {employee.assignmentName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />

                <span className="text-sm text-slate-500">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
