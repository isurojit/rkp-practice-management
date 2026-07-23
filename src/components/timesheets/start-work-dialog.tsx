"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  PlayCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface StartWorkDialogProps {
  onWorkStarted?: () => void;
}

interface AssignmentOption {
  id: string;
  title?: string;
  clientId?: string;
  clientName?: string;
  status?: string;
  assignedUsers?: unknown[];
}

type WorkType = "assignment" | "miscellaneous";

type LocationType = "office" | "home" | "client_site" | "other";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to start work. Please try again.";
}

function isUserAssigned(assignment: AssignmentOption, userId: string): boolean {
  if (!Array.isArray(assignment.assignedUsers)) {
    return true;
  }

  if (assignment.assignedUsers.length === 0) {
    return true;
  }

  return assignment.assignedUsers.some((assignedUser) => {
    if (typeof assignedUser === "string") {
      return assignedUser === userId;
    }

    if (typeof assignedUser === "object" && assignedUser !== null) {
      const user = assignedUser as {
        uid?: string;
        userId?: string;
        id?: string;
      };

      return (
        user.uid === userId || user.userId === userId || user.id === userId
      );
    }

    return false;
  });
}

export default function StartWorkDialog({
  onWorkStarted,
}: StartWorkDialogProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);

  const [workType, setWorkType] = useState<WorkType>("assignment");

  const [assignmentId, setAssignmentId] = useState("");

  const [locationType, setLocationType] = useState<LocationType>("office");

  const [miscellaneousNarration, setMiscellaneousNarration] = useState("");

  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [startingWork, setStartingWork] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !user?.uid) {
      return;
    }

    let active = true;

    async function loadAssignments() {
      try {
        setLoadingAssignments(true);
        setError("");

        const data = await getAssignments();

        if (!active) {
          return;
        }

        setAssignments(Array.isArray(data) ? (data as AssignmentOption[]) : []);
      } catch (error) {
        console.error("Failed to load assignments:", error);

        if (active) {
          setError("Assignments could not be loaded. Please try again.");
        }
      } finally {
        if (active) {
          setLoadingAssignments(false);
        }
      }
    }

    void loadAssignments();

    return () => {
      active = false;
    };
  }, [open, user?.uid]);

  const availableAssignments = useMemo(() => {
    if (!user?.uid) {
      return [];
    }

    return assignments.filter((assignment) => {
      const status = assignment.status?.toLowerCase().replaceAll(" ", "_");

      const isCompleted = status === "completed";

      return !isCompleted && isUserAssigned(assignment, user.uid);
    });
  }, [assignments, user?.uid]);

  const selectedAssignment = useMemo(
    () =>
      availableAssignments.find((assignment) => assignment.id === assignmentId),
    [availableAssignments, assignmentId],
  );

  const resetForm = () => {
    setWorkType("assignment");
    setAssignmentId("");
    setLocationType("office");
    setMiscellaneousNarration("");
    setError("");
    setStartingWork(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleWorkTypeChange = (value: WorkType) => {
    setWorkType(value);
    setError("");

    if (value === "assignment") {
      setMiscellaneousNarration("");
    } else {
      setAssignmentId("");
    }
  };

  const handleContinueToAssignment = () => {
    setError("");

    if (!assignmentId) {
      setError("Please select an assignment.");
      return;
    }

    setOpen(false);

    router.push(`/dashboard/assignments/${assignmentId}`);
  };

  const handleStartMiscellaneousWork = async () => {
    setError("");

    if (!user?.uid) {
      setError("User information is unavailable. Please log in again.");
      return;
    }

    const narration = miscellaneousNarration.trim();

    if (!narration) {
      setError("Please enter narration for miscellaneous work.");
      return;
    }

    if (narration.length < 5) {
      setError("Please enter a meaningful narration of at least 5 characters.");
      return;
    }

    try {
      setStartingWork(true);

      const now = new Date();

      await createTimesheet({
        userId: user.uid,

        userName: user.displayName || user.email || "Unknown User",

        workType: "miscellaneous",

        assignmentId: "",
        assignmentName: "Miscellaneous Work",

        clientId: "",
        clientName: "Miscellaneous",

        date: now.toISOString().split("T")[0],
        checkIn: now.toISOString(),

        locationType: locationType as any,

        workDescription: "",

        miscellaneousNarration: narration,

        status: "active",
        createdAt: now,
      });

      setOpen(false);
      resetForm();

      onWorkStarted?.();
    } catch (error) {
      console.error("Failed to start miscellaneous work:", error);

      setError(getErrorMessage(error));
    } finally {
      setStartingWork(false);
    }
  };

  const handleStart = async () => {
    if (workType === "assignment") {
      handleContinueToAssignment();
      return;
    }

    await handleStartMiscellaneousWork();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl bg-sky-600 px-5 hover:bg-sky-700">
          <PlayCircle className="h-4 w-4" />
          Start Work
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-3xl border-sky-100 bg-white/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-sky-100 bg-gradient-to-br from-sky-50 to-white px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">
              Start Work Session
            </DialogTitle>

            <DialogDescription className="mt-1 text-slate-500">
              Select assignment work or begin a miscellaneous work session.
            </DialogDescription>
          </DialogHeader>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
              <ClipboardList className="h-5 w-5 text-sky-600" />
              Work Type
            </div>

            <Select
              value={workType}
              onValueChange={(value) => handleWorkTypeChange(value as WorkType)}
              disabled={startingWork}
            >
              <SelectTrigger className="h-11 rounded-xl border-sky-100 bg-white">
                <SelectValue placeholder="Select work type" />
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
            <>
              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <BriefcaseBusiness className="h-5 w-5 text-sky-600" />
                  Assignment
                </div>

                <Select
                  value={assignmentId}
                  onValueChange={(value) => {
                    setAssignmentId(value);
                    setError("");
                  }}
                  disabled={loadingAssignments || startingWork}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue
                      placeholder={
                        loadingAssignments
                          ? "Loading assignments..."
                          : "Select an assignment"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {availableAssignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.title || "Untitled Assignment"}

                        {assignment.clientName
                          ? ` — ${assignment.clientName}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!loadingAssignments && availableAssignments.length === 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    No active assignments are currently available for you.
                  </div>
                )}

                {selectedAssignment && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {selectedAssignment.title || "Untitled Assignment"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedAssignment.clientName || "Client not specified"}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                Assignment work is started from the assignment details page.
                This ensures that acceptance, progress, pause, resume and
                completion records stay synchronized.
              </div>
            </>
          )}

          {workType === "miscellaneous" && (
            <>
              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <MapPin className="h-5 w-5 text-sky-600" />
                  Work Location
                </div>

                <Select
                  value={locationType}
                  onValueChange={(value) =>
                    setLocationType(value as LocationType)
                  }
                  disabled={startingWork}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>

                    <SelectItem value="home">Home</SelectItem>

                    <SelectItem value="client_site">Client Site</SelectItem>

                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <FileText className="h-5 w-5 text-sky-600" />
                  Work Narration
                </div>

                <Textarea
                  placeholder="For example: Internal meeting, document sorting, office administration or training."
                  value={miscellaneousNarration}
                  onChange={(event) => {
                    setMiscellaneousNarration(event.target.value);
                    setError("");
                  }}
                  disabled={startingWork}
                  maxLength={500}
                  className="min-h-32 resize-none rounded-xl bg-white"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>A clear narration is required.</span>

                  <span>{miscellaneousNarration.length}/500</span>
                </div>
              </div>
            </>
          )}

          <Button
            type="button"
            className="h-12 w-full gap-2 rounded-xl bg-sky-600 text-base font-semibold hover:bg-sky-700"
            onClick={() => void handleStart()}
            disabled={
              startingWork ||
              (workType === "assignment" &&
                (loadingAssignments || availableAssignments.length === 0))
            }
          >
            {startingWork ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting Work...
              </>
            ) : workType === "assignment" ? (
              <>
                Open Assignment
                <ArrowRight className="h-5 w-5" />
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5" />
                Start Miscellaneous Work
              </>
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
