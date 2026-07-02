"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardCards from "@/components/dashboard/dashboard-cards";
import ActiveEmployeesWidget from "@/components/dashboard/active-employees-widget";

import { getDashboardStats } from "@/lib/services/dashboard-service";
import { getActiveTimesheets } from "@/lib/services/timesheet-service";
import RoleGuard from "@/components/dashboard/role-guard";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);

        const active = await getActiveTimesheets();
        setActiveEmployees(active);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <>
        <DashboardHeader />

        <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50 p-6">
          <div className="flex h-[60vh] items-center justify-center">
            <div className="rounded-3xl border border-sky-100 bg-white/70 px-8 py-6 text-slate-500 shadow-lg backdrop-blur-xl">
              Loading Dashboard...
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <RoleGuard allowedRoles={["super_admin", "manager"]}>
        <>
          <DashboardHeader />
          {/* existing page content */}
        </>
      </RoleGuard>

      <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="space-y-8 p-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="bg-linear-to-r from-sky-600 via-blue-600 to-cyan-600 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
              Dashboard
            </h1>

            <p className="mt-3 text-lg text-slate-600">
              RKP Associates operations overview
            </p>
          </motion.div>

          {stats && <DashboardCards stats={stats} />}

          <div className="grid gap-6 xl:grid-cols-2">
            <ActiveEmployeesWidget employees={activeEmployees} />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-xl backdrop-blur-xl"
            >
              <h2 className="mb-3 text-xl font-bold text-slate-800">
                Work Session Rules
              </h2>

              <div className="space-y-3 text-slate-600">
                <p>
                  Employees can start, stop and switch between assignment work
                  and miscellaneous work.
                </p>

                <p>
                  Only one active session is allowed at a time to keep billing
                  and productivity reports accurate.
                </p>

                <p>
                  Super Admin can review employee-wise, client-wise and
                  assignment-wise work records.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl border border-sky-100 bg-white/70 p-8 shadow-xl backdrop-blur-xl"
          >
            <h2 className="mb-3 text-2xl font-bold text-slate-800">
              Welcome to RKP Associates
            </h2>

            <p className="max-w-4xl leading-relaxed text-slate-600">
              Monitor assignments, employee productivity, audit progress, client
              billing, work sessions and invoice generation from one centralized
              platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-3xl border border-sky-100 bg-white/70 p-8 shadow-xl backdrop-blur-xl"
          >
            <h2 className="mb-6 text-2xl font-bold text-slate-800">
              Quick Actions
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <a
                href="/dashboard/assignments"
                className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-semibold text-slate-800">
                  Create Assignment
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Assign audit, tax or compliance work.
                </p>
              </a>

              <a
                href="/dashboard/clients"
                className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-semibold text-slate-800">Add Client</h3>

                <p className="mt-2 text-sm text-slate-500">
                  Register and manage client records.
                </p>
              </a>

              <a
                href="/dashboard/timesheets"
                className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-semibold text-slate-800">Timesheets</h3>

                <p className="mt-2 text-sm text-slate-500">
                  Start, stop and review work sessions.
                </p>
              </a>

              <a
                href="/dashboard/reports"
                className="rounded-2xl border border-sky-100 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-semibold text-slate-800">Reports</h3>

                <p className="mt-2 text-sm text-slate-500">
                  Generate client billing reports.
                </p>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
