"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Share2 } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getUsers } from "@/lib/services/user-service";
import type { AppUser } from "@/types/user";
import type { Assignment } from "@/types/assignment";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  assignment: Assignment;
  onShared?: () => void;
}

export default function ShareAssignmentDialog({ assignment, onShared }: Props) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const mayShare = role === "super_admin" || role === "manager";
  const assignedIds = useMemo(
    () => new Set((assignment.assignedUsers || []).map((value) =>
      typeof value === "string" ? value : value.uid,
    )),
    [assignment.assignedUsers],
  );

  useEffect(() => {
    if (!open || !mayShare) return;
    setLoading(true);
    setError("");
    getUsers()
      .then((data) => setEmployees(data.filter((entry) => entry.role === "employee" && entry.active !== false)))
      .catch(() => setError("Unable to load employees."))
      .finally(() => setLoading(false));
  }, [open, mayShare]);

  if (!mayShare || !assignment.id) return null;

  const candidates = employees.filter((employee) => !assignedIds.has(employee.uid));

  const handleShare = async () => {
    if (!user || !employeeId || !assignment.id || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/assignments/" + encodeURIComponent(assignment.id) + "/share", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
        cache: "no-store",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to share task.");
      setOpen(false);
      setEmployeeId("");
      onShared?.();
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Unable to share task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) setOpen(next); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 self-start rounded-xl bg-white">
          <Share2 size={17} />
          Share with employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share existing assignment</DialogTitle>
          <p className="text-sm leading-6 text-slate-500">
            Add an employee to this assignment. Previous employees, sessions and records remain unchanged.
          </p>
        </DialogHeader>
        <p className="text-sm font-semibold text-slate-800">{assignment.title}</p>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Loading employees...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="share-employee" className="mb-2 block text-sm font-semibold text-slate-700">
                Add employee
              </label>
              <select
                id="share-employee"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                disabled={submitting}
              >
                <option value="">Select an unassigned employee</option>
                {candidates.map((employee) => (
                  <option key={employee.uid} value={employee.uid}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>
            </div>
            {candidates.length === 0 && (
              <p className="text-sm text-slate-500">Every active employee is already assigned.</p>
            )}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button
              onClick={() => void handleShare()}
              disabled={!employeeId || submitting}
              className="h-11 w-full gap-2 rounded-xl"
            >
              {submitting && <Loader2 size={17} className="animate-spin" />}
              {submitting ? "Sharing..." : "Share assignment"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
