"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

import { AssignmentChecklistItem } from "@/types/assignment-checklist";

export default function AssignmentChecklist({
  checklist,
  onToggle,
}: {
  checklist: AssignmentChecklistItem[];
  onToggle: (item: AssignmentChecklistItem, completed: boolean) => void;
}) {
  const completedItems = checklist.filter((i) => i.completed).length;

  const progress =
    checklist.length === 0
      ? 0
      : Math.round((completedItems / checklist.length) * 100);

  return (
    <div className="rounded-3xl border border-sky-100 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Checklist</h2>

          <p className="text-sm text-slate-500">
            {completedItems} of {checklist.length} completed
          </p>
        </div>

        <div className="text-3xl font-black text-sky-600">{progress}%</div>
      </div>

      <div className="mb-6 h-3 rounded-full bg-sky-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-3 rounded-full bg-sky-600"
        />
      </div>

      <div className="space-y-3">
        {checklist.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between rounded-xl border bg-white p-4"
          >
            <button
              className="flex items-center gap-3"
              onClick={() => onToggle(item, !item.completed)}
            >
              {item.completed ? (
                <CheckCircle2 className="text-green-600" size={22} />
              ) : (
                <Circle className="text-slate-400" size={22} />
              )}

              <span
                className={
                  item.completed
                    ? "line-through text-slate-400"
                    : "text-slate-800"
                }
              >
                {item.title}
              </span>
            </button>

            {item.completedAt && (
              <span className="text-xs text-slate-400">✓ Completed</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
