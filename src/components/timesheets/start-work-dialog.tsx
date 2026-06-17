"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, ClipboardList, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getAssignments } from "@/lib/services/assignment-service";
import { createTimesheet } from "@/lib/services/timesheet-service";
import { useAuth } from "@/providers/auth-provider";

export default function StartWorkDialog() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [workType, setWorkType] = useState<"assignment" | "miscellaneous">(
    "assignment",
  );

  const [assignmentId, setAssignmentId] = useState("");
  const [locationType, setLocationType] = useState("office");
  const [workDescription, setWorkDescription] = useState("");
  const [miscellaneousNarration, setMiscellaneousNarration] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAssignments() {
      const data = await getAssignments();
      setAssignments(data);
    }

    loadAssignments();
  }, []);

  const handleStart = async () => {
    setError("");

    if (!user?.uid) {
      setError("User not found. Please login again.");
      return;
    }

    if (workType === "assignment" && !assignmentId) {
      setError("Please select an assignment.");
      return;
    }

    if (workType === "miscellaneous" && !miscellaneousNarration.trim()) {
      setError("Please enter narration for miscellaneous work.");
      return;
    }

    try {
      setLoading(true);

      const selectedAssignment = assignments.find((a) => a.id === assignmentId);

      await createTimesheet({
        userId: user.uid,
        userName: user.displayName || user.email || "Unknown User",

        workType,

        assignmentId: workType === "assignment" ? assignmentId : "",
        assignmentName:
          workType === "assignment"
            ? selectedAssignment?.title || ""
            : "Miscellaneous Work",

        clientId:
          workType === "assignment" ? selectedAssignment?.clientId || "" : "",
        clientName:
          workType === "assignment"
            ? selectedAssignment?.clientName || ""
            : "Miscellaneous",

        date: new Date().toISOString().split("T")[0],
        checkIn: new Date().toISOString(),

        locationType: locationType as any,

        workDescription: workType === "assignment" ? workDescription : "",

        miscellaneousNarration:
          workType === "miscellaneous" ? miscellaneousNarration : "",

        status: "active",
        createdAt: new Date(),
      });

      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      setError(error.message || "Failed to start work.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-sky-600 hover:bg-sky-700">
          Start Work
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl border-sky-100 bg-white/90 backdrop-blur-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-800">
            Start Work Session
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
              <ClipboardList size={18} />
              Work Type
            </div>

            <Select
              value={workType}
              onValueChange={(value) =>
                setWorkType(value as "assignment" | "miscellaneous")
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select Work Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="assignment">Assignment Work</SelectItem>
                <SelectItem value="miscellaneous">
                  Miscellaneous Work
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {workType === "assignment" && (
            <div className="rounded-2xl border border-sky-100 bg-white/70 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
                <BriefcaseBusiness size={18} />
                Assignment
              </div>

              <Select value={assignmentId} onValueChange={setAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Assignment" />
                </SelectTrigger>

                <SelectContent>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title} - {assignment.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-2xl border border-sky-100 bg-white/70 p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
              <MapPin size={18} />
              Location
            </div>

            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="client_site">Client Site</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {workType === "assignment" ? (
            <Textarea
              placeholder="Work description, e.g. Verified GST reconciliation"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="min-h-28 bg-white"
            />
          ) : (
            <Textarea
              placeholder="Narration for miscellaneous work, e.g. Internal meeting, document sorting, office admin work"
              value={miscellaneousNarration}
              onChange={(e) => setMiscellaneousNarration(e.target.value)}
              className="min-h-28 bg-white"
            />
          )}

          <Button
            className="w-full rounded-xl bg-sky-600 hover:bg-sky-700"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? "Starting..." : "Start Work Session"}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
