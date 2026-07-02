"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import { useAuth } from "@/providers/auth-provider";

import {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
} from "@/lib/services/leave-service";

import { Textarea } from "@/components/ui/textarea";

export default function LeavePage() {
  const { user, role } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaves() {
      try {
        const data = await getLeaveRequests();

        if (role === "super_admin") {
          setRequests(data);
        } else {
          setRequests(data.filter((item) => item.userId === user?.uid));
        }
      } catch (error) {
        console.error("Failed to load leave requests:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaves();
  }, [user, role]);

  const handleApplyLeave = async () => {
    if (!user?.uid) return;

    if (!fromDate || !toDate || !reason.trim()) {
      alert("Please fill all leave fields.");
      return;
    }

    await createLeaveRequest({
      userId: user.uid,
      userName: user.displayName || user.email || "Unknown User",
      fromDate,
      toDate,
      reason,
      status: "pending",
    });

    window.location.reload();
  };

  const handleStatusUpdate = async (
    leaveId: string,
    status: "approved" | "rejected",
  ) => {
    await updateLeaveStatus(leaveId, status);

    setRequests((prev) =>
      prev.map((item) => (item.id === leaveId ? { ...item, status } : item)),
    );
  };

  return (
    <>
      <DashboardHeader />

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-800">
            Leave Management
          </h1>

          <p className="text-slate-600 mt-1">
            Apply, review and manage employee leave requests.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Apply Leave
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border bg-white px-4 py-2"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border bg-white px-4 py-2"
            />

            <button
              onClick={handleApplyLeave}
              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
            >
              Submit Leave
            </button>
          </div>

          <Textarea
            placeholder="Reason for leave"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-4 bg-white"
          />
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Leave Requests
          </h2>

          {loading ? (
            <div className="text-slate-500">Loading leave requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No leave requests found.
            </div>
          ) : (
            <div className="rounded-2xl border bg-white/80 overflow-hidden">
              <table className="w-full">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="p-4 text-left">Employee</th>
                    <th className="p-4 text-left">From</th>
                    <th className="p-4 text-left">To</th>
                    <th className="p-4 text-left">Reason</th>
                    <th className="p-4 text-left">Status</th>
                    {role === "super_admin" && (
                      <th className="p-4 text-left">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {requests.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">{item.userName}</td>
                      <td className="p-4">{item.fromDate}</td>
                      <td className="p-4">{item.toDate}</td>
                      <td className="p-4">{item.reason}</td>
                      <td className="p-4">{item.status}</td>

                      {role === "super_admin" && (
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(item.id, "approved")
                              }
                              className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-700"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                handleStatusUpdate(item.id, "rejected")
                              }
                              className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
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
