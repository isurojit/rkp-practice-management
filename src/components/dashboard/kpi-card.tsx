"use client";

import { motion } from "framer-motion";

interface KPIProps {
  title: string;
  value: string | number;
  description?: string;
}

export default function KPICard({ title, value, description }: KPIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border bg-card p-6 shadow-sm"
    >
      <p className="text-sm text-muted-foreground">{title}</p>

      <h2 className="text-3xl font-bold mt-2">{value}</h2>

      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </motion.div>
  );
}
