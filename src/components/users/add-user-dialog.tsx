"use client";

import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProvisionRole = "employee" | "manager";

interface Props {
  onCreated?: () => void;
}

export default function AddUserDialog({ onCreated }: Props) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProvisionRole>("employee");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (role !== "super_admin") return null;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !user) return;

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          designation: designation.trim(),
          role: selectedRole,
        }),
        cache: "no-store",
      });

      const result = (await response.json()) as {
        error?: string;
        email?: string;
      };

      if (!response.ok || !result.email) {
        throw new Error(result.error || "Unable to create employee.");
      }

      let inviteSent = false;
      try {
        await sendPasswordResetEmail(auth, result.email);
        inviteSent = true;
      } catch (inviteError) {
        console.error("Employee password setup email could not be sent:", inviteError);
      }

      setSuccess(
        inviteSent
          ? "Account created. A password setup email was sent to " + result.email + "."
          : "Account created, but the password setup email was not sent. Ask the employee to use password reset or check Firebase email templates.",
      );
      setName("");
      setEmail("");
      setDesignation("");
      setSelectedRole("employee");
      onCreated?.();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Employee creation failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (submitting) return;
      setOpen(next);
      if (!next) { setError(""); setSuccess(""); }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl">
          <UserPlus size={18} />
          Add team member
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Create employee or manager</DialogTitle>
          <p className="text-sm leading-6 text-slate-500">
            Only Super Admin can create an account. The new team member receives
            an email to set their password.
          </p>
        </DialogHeader>

        <form onSubmit={(event) => void handleCreate(event)} className="mt-3 space-y-4">
          <div>
            <label htmlFor="new-user-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Full name
            </label>
            <Input id="new-user-name" required minLength={2} maxLength={100}
              value={name} onChange={(event) => setName(event.target.value)}
              disabled={submitting} placeholder="Employee's full name" />
          </div>

          <div>
            <label htmlFor="new-user-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <Input id="new-user-email" type="email" autoComplete="off" required maxLength={254}
              value={email} onChange={(event) => setEmail(event.target.value)}
              disabled={submitting} placeholder="employee@company.com" />
          </div>

          <div>
            <label htmlFor="new-user-designation" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Designation <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input id="new-user-designation" maxLength={100}
              value={designation} onChange={(event) => setDesignation(event.target.value)}
              disabled={submitting} placeholder="e.g. Audit Associate, Tax Executive" />
          </div>

          <div>
            <label htmlFor="new-user-role" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Access role
            </label>
            <select
              id="new-user-role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as ProvisionRole)}
              disabled={submitting}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="employee">Employee — assigned task work only</option>
              <option value="manager">Manager — monitor and delegate assigned work</option>
            </select>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" className="h-11 w-full rounded-xl" disabled={submitting}>
            {submitting && <Loader2 size={18} className="mr-2 animate-spin" />}
            {submitting ? "Creating account..." : "Create account and send invite"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
