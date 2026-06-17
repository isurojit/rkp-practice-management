"use client";

import { motion } from "framer-motion";

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
    },
    {
      title: "Assignments",
      value: stats.totalAssignments,
      icon: BriefcaseBusiness,
    },
    {
      title: "Employees",
      value: stats.totalUsers,
      icon: Users,
    },
    {
      title: "Timesheets",
      value: stats.totalTimesheets,
      icon: Clock3,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.1,
            }}
            whileHover={{
              y: -5,
              scale: 1.02,
            }}
            className="
              backdrop-blur-xl
              bg-white/60
              border border-white/40
              shadow-lg
              rounded-3xl
              p-6
            "
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm">{card.title}</p>

                <h2 className="text-4xl font-bold mt-2 text-slate-800">
                  {card.value}
                </h2>
              </div>

              <div className="bg-sky-100 p-3 rounded-2xl">
                <Icon className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
