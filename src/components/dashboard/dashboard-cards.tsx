"use client";

import { Users, BriefcaseBusiness, Building2, Clock3 } from "lucide-react";

interface Props {
  stats: {
    totalClients: number;
    totalAssignments: number;
    totalUsers: number;
    totalTimesheets: number;
  };
}

export default function DashboardCards({ stats }: Props) {
  const cards = [
    {
      title: "Clients",
      value: stats.totalClients,
      icon: Building2,
      detail: "Active client directory",
      tone: "blue",
    },
    {
      title: "Assignments",
      value: stats.totalAssignments,
      icon: BriefcaseBusiness,
      detail: "Professional engagements",
      tone: "indigo",
    },
    {
      title: "Employees",
      value: stats.totalUsers,
      icon: Users,
      detail: "Team members",
      tone: "teal",
    },
    {
      title: "Timesheets",
      value: stats.totalTimesheets,
      icon: Clock3,
      detail: "Work session records",
      tone: "amber",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, detail, tone }) => (
        <section
          key={title}
          className={`rkp-metric-card rkp-metric-card--${tone} group relative overflow-hidden rounded-[22px] p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:p-6`}
          aria-label={`${title}: ${value}`}
        >
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="rkp-metric-label text-sm font-semibold">{title}</p>
              <p className="rkp-metric-value mt-3 text-[36px] font-extrabold leading-none tracking-[-0.055em]">
                {value.toLocaleString("en-IN")}
              </p>
            </div>
            <span className="rkp-metric-icon inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
            </span>
          </div>

          <div className="relative z-10 mt-6 flex items-center gap-2">
            <span className="rkp-metric-dot h-2 w-2 rounded-full" aria-hidden="true" />
            <p className="rkp-metric-detail text-xs font-medium">{detail}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
