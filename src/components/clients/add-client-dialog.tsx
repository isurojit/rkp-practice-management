"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  onCreated?: () => void;
}

export default function AddClientDialog({ onCreated }: Props) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState({
    clientName: "",
    clientCode: "",
    contactPerson: "",
    email: "",
    phone: "",
    panNo: "",
    gstNo: "",
    address: "",
    billingRate: "0",
  });

  if (role !== "super_admin") return null;

  const update = (name: keyof typeof values, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, billingRate: Number(values.billingRate) }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Client could not be created.");

      setOpen(false);
      setValues({
        clientName: "", clientCode: "", contactPerson: "", email: "", phone: "",
        panNo: "", gstNo: "", address: "", billingRate: "0",
      });
      onCreated?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create client.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!loading) setOpen(next); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl">
          <Plus size={17} /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <p className="text-sm leading-6 text-slate-500">
            Register a client for audit, tax-return and other professional assignments.
          </p>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 sm:grid-cols-2">
          {([
            ["clientName", "Client / organization name", "e.g. ABC Trading Pvt. Ltd."],
            ["clientCode", "Client code", "e.g. ABC2026"],
            ["contactPerson", "Contact person", "Name of authorized contact"],
            ["email", "Email address", "client@company.com"],
            ["phone", "Phone", "Phone number"],
            ["panNo", "PAN (optional)", "PAN"],
            ["gstNo", "GSTIN (optional)", "GST registration number"],
            ["billingRate", "Hourly billing rate (₹)", "0"],
          ] as const).map(([key, title, placeholder]) => (
            <div key={key}>
              <label htmlFor={"client-" + key} className="mb-1.5 block text-sm font-semibold text-slate-700">
                {title}
              </label>
              <Input
                id={"client-" + key}
                type={key === "email" ? "email" : key === "billingRate" ? "number" : "text"}
                min={key === "billingRate" ? 0 : undefined}
                step={key === "billingRate" ? "0.01" : undefined}
                required={key === "clientName" || key === "clientCode" || key === "billingRate"}
                placeholder={placeholder}
                value={values[key]}
                onChange={(event) => update(key, event.target.value)}
                disabled={loading}
              />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label htmlFor="client-address" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Address (optional)
            </label>
            <textarea
              id="client-address"
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={values.address}
              onChange={(event) => update("address", event.target.value)}
              disabled={loading}
              placeholder="Registered / correspondence address"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">
              {error}
            </p>
          )}

          <Button type="submit" className="h-11 rounded-xl sm:col-span-2" disabled={loading}>
            {loading && <Loader2 size={17} className="mr-2 animate-spin" />}
            {loading ? "Saving client..." : "Create client record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
