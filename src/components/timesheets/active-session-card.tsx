"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, PauseCircle, BriefcaseBusiness } from "lucide-react";

import { Button } from "@/components/ui/button";
import { checkoutTimesheet } from "@/lib/services/timesheet-service";

interface Props {
  session: any;
}

export default function ActiveSessionCard({ session }: Props) {
  const handleStopWork = async () => {
    try {
      await checkoutTimesheet(session.id, session.checkIn);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to stop work");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-sky-100 bg-white/75 backdrop-blur-xl p-6 shadow-xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Active Session
          </div>

          <h2 className="mt-4 text-2xl font-black text-slate-800">
            {session.workType === "miscellaneous"
              ? "Miscellaneous Work"
              : session.assignmentName}
          </h2>

          <p className="mt-1 text-slate-500">
            {session.workType === "miscellaneous"
              ? session.miscellaneousNarration
              : session.clientName}
          </p>
        </div>

        <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <BriefcaseBusiness />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-sky-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Clock size={16} />
            Started
          </div>
          <p className="mt-2 font-semibold text-slate-800">
            {new Date(session.checkIn).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-sky-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <MapPin size={16} />
            Location
          </div>
          <p className="mt-2 font-semibold text-slate-800">
            {session.locationType}
          </p>
        </div>

        <div className="rounded-2xl bg-sky-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <PauseCircle size={16} />
            Action
          </div>

          <Button className="mt-3 w-full" onClick={handleStopWork}>
            Stop / Pause Work
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
