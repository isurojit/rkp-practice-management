"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function ActivityTimeline({
  activities,
}: {
  activities: any[];
}) {
  return (
    <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-2">
        <Activity className="text-sky-600" />

        <h2 className="text-xl font-bold text-slate-800">Activity Timeline</h2>
      </div>

      {activities.length === 0 ? (
        <p className="text-slate-500">No activity recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {[...activities]
            .sort((a, b) => {
              const aTime = a.createdAt?.toDate
                ? a.createdAt.toDate().getTime()
                : new Date(a.createdAt).getTime();

              const bTime = b.createdAt?.toDate
                ? b.createdAt.toDate().getTime()
                : new Date(b.createdAt).getTime();

              return bTime - aTime;
            })
            .map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-l-4 border-sky-300 pl-4"
              >
                <p className="font-semibold text-slate-800">{item.action}</p>

                <p className="text-sm text-slate-600">{item.description}</p>

                <p className="mt-1 text-xs text-slate-400">
                  {item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleString()
                    : item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ""}
                </p>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
