"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";


import { useAuth } from "@/providers/auth-provider";

import {
  getAttendanceRecords,
  getTodayAttendance,
  markAttendanceIn,
  markAttendanceOut,
} from "@/lib/services/attendance-service";

export default function AttendancePage() {
  const { user, role } = useAuth();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const today = await getTodayAttendance(user.uid);
        setTodayAttendance(today);

        const allRecords = await getAttendanceRecords();

        if (role === "super_admin") {
          setRecords(allRecords);
        } else {
          setRecords(allRecords.filter((item) => item.userId === user.uid));
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [user, role]);

  const handleAttendanceIn = async () => {
    if (!user?.uid) return;

    await markAttendanceIn({
      userId: user.uid,
      userName: user.displayName || user.email || "Unknown User",
      date: new Date().toISOString().split("T")[0],
      checkIn: new Date().toISOString(),
      status: "present",
      locationType: "office",
    });

    window.location.reload();
  };

  const handleAttendanceOut = async () => {
    if (!todayAttendance?.id) return;

    await markAttendanceOut(todayAttendance.id);

    window.location.reload();
  };

  return (
    <>
      <div className="rkp-page min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">Attendance</h1>

          <p className="text-slate-600 mt-1">
            Daily attendance and presence tracking
          </p>
        </motion.div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Today&apos;s Attendance
          </h2>

          {loading ? (
            <div className="text-slate-500">Loading attendance...</div>
          ) : todayAttendance ? (
            <div className="space-y-4">
              <p className="text-slate-700">
                Checked in at:{" "}
                <strong>
                  {new Date(todayAttendance.checkIn).toLocaleString()}
                </strong>
              </p>

              {todayAttendance.checkOut ? (
                <p className="text-slate-700">
                  Checked out at:{" "}
                  <strong>
                    {new Date(todayAttendance.checkOut).toLocaleString()}
                  </strong>
                </p>
              ) : (
                <button
                  onClick={handleAttendanceOut}
                  className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
                >
                  Mark Attendance Out
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleAttendanceIn}
              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
            >
              Mark Attendance In
            </button>
          )}
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Attendance History
          </h2>

          {records.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No attendance records found.
            </div>
          ) : (
            <div className="rounded-2xl border bg-white/80 overflow-hidden">
              <table className="w-full">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Employee</th>
                    <th className="p-4 text-left">Check In</th>
                    <th className="p-4 text-left">Check Out</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {[...records]
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
                          {new Date(item.checkIn).toLocaleTimeString()}
                        </td>
                        <td className="p-4">
                          {item.checkOut
                            ? new Date(item.checkOut).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td className="p-4">{item.status}</td>
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
