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
    { title: "Clients", value: stats.totalClients, icon: Building2, color: "text-blue-600", tint: "bg-blue-50" },
    { title: "Assignments", value: stats.totalAssignments, icon: BriefcaseBusiness, color: "text-indigo-600", tint: "bg-indigo-50" },
    { title: "Employees", value: stats.totalUsers, icon: Users, color: "text-teal-600", tint: "bg-teal-50" },
    { title: "Timesheets", value: stats.totalTimesheets, icon: Clock3, color: "text-amber-600", tint: "bg-amber-50" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="group rounded-[22px] border border-[#e5eaf3] bg-white p-5 shadow-[0_3px_18px_rgba(18,35,63,.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_24px_rgba(18,35,63,.07)] sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-slate-500">{card.title}</span>
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.tint} ${card.color}`}>
                <Icon size={21} strokeWidth={1.9} />
              </span>
            </div>

            <p className="mt-3 text-[35px] font-bold leading-none tracking-[-.055em] text-[#102340]">
              {card.value}
            </p>
            <div className="mt-5 h-1 w-full rounded-full bg-slate-100">
              <div className={`h-1 w-1/3 rounded-full ${card.tint.replace("50","200")}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
