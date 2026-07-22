"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createAssignment } from "@/lib/services/assignment-service";
import { getClients } from "@/lib/services/client-service";
import { getUsers } from "@/lib/services/user-service";

import {
  AssignmentEmployee,
  AssignmentPriority,
  AssignmentType,
} from "@/types/assignment";

interface ClientOption {
  id: string;
  clientName: string;
}

interface UserOption {
  uid: string;
  name?: string;
  email?: string;
  role?: string;
}

const initialAssignmentType: AssignmentType = "tax_audit";
const initialPriority: AssignmentPriority = "medium";

export default function AddAssignmentDialog() {
  const [open, setOpen] = useState(false);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");

  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    initialAssignmentType,
  );

  const [priority, setPriority] = useState<AssignmentPriority>(initialPriority);

  const [estimatedHours, setEstimatedHours] = useState("");

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [remarks, setRemarks] = useState("");

  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadData() {
      try {
        setLoadingData(true);
        setError("");

        const [clientData, userData] = await Promise.all([
          getClients(),
          getUsers(),
        ]);

        setClients(clientData as ClientOption[]);
        setUsers(userData as UserOption[]);
      } catch (loadError) {
        console.error("Failed to load assignment form data:", loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Clients and employees could not be loaded.",
        );
      } finally {
        setLoadingData(false);
      }
    }

    void loadData();
  }, [open]);

  const availableEmployees = useMemo(() => {
    return users.filter((user) => {
      if (!user.uid) {
        return false;
      }

      return user.role === "employee" || user.role === "manager" || !user.role;
    });
  }, [users]);

  const selectedEmployees = useMemo<AssignmentEmployee[]>(() => {
    return assignedUserIds
      .map((uid) => {
        const selectedUser = users.find((user) => user.uid === uid);

        if (!selectedUser) {
          return null;
        }

        return {
          uid: selectedUser.uid,
          name: selectedUser.name || selectedUser.email || "Unknown User",
          email: selectedUser.email || "",
        };
      })
      .filter((employee): employee is AssignmentEmployee => employee !== null);
  }, [assignedUserIds, users]);

  const resetForm = () => {
    setTitle("");
    setClientId("");
    setClientName("");

    setAssignmentType(initialAssignmentType);
    setPriority(initialPriority);

    setEstimatedHours("");
    setStartDate("");
    setDueDate("");
    setRemarks("");

    setAssignedUserIds([]);

    setError("");
  };

  const handleDialogChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen && !submitting) {
      resetForm();
    }
  };

  const handleUserToggle = (uid: string) => {
    setAssignedUserIds((previous) =>
      previous.includes(uid)
        ? previous.filter((id) => id !== uid)
        : [...previous, uid],
    );

    if (error) {
      setError("");
    }
  };

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return "Assignment name is required.";
    }

    if (!clientId) {
      return "Please select a client.";
    }

    if (selectedEmployees.length === 0) {
      return "Please assign at least one employee.";
    }

    const numericEstimatedHours = Number(estimatedHours);

    if (
      !estimatedHours ||
      Number.isNaN(numericEstimatedHours) ||
      numericEstimatedHours <= 0
    ) {
      return "Estimated hours must be greater than zero.";
    }

    if (!startDate) {
      return "Start date is required.";
    }

    if (!dueDate) {
      return "Due date is required.";
    }

    if (new Date(dueDate).getTime() < new Date(startDate).getTime()) {
      return "Due date cannot be earlier than the start date.";
    }

    return null;
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createAssignment({
        title: title.trim(),

        clientId,
        clientName,

        assignmentType,
        priority,

        assignedUsers: selectedEmployees,

        estimatedHours: Number(estimatedHours),

        startDate,
        dueDate,

        remarks: remarks.trim(),

        createdBy: "",
        createdByName: "",
      });

      alert("Assignment created successfully.");

      setOpen(false);
      resetForm();

      window.location.reload();
    } catch (submitError) {
      console.error("Failed to create assignment:", submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create assignment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button>Create Assignment</Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Assignment Name"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);

              if (error) {
                setError("");
              }
            }}
            disabled={submitting}
          />

          <Select
            value={clientId}
            onValueChange={(value) => {
              setClientId(value);

              const selectedClient = clients.find(
                (client) => client.id === value,
              );

              setClientName(selectedClient?.clientName || "");

              if (error) {
                setError("");
              }
            }}
            disabled={loadingData || submitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Client" />
            </SelectTrigger>

            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={assignmentType}
            onValueChange={(value) =>
              setAssignmentType(value as AssignmentType)
            }
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assignment Type" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="tax_audit">Tax Audit</SelectItem>

              <SelectItem value="internal_audit">Internal Audit</SelectItem>

              <SelectItem value="gst_audit">GST Audit</SelectItem>

              <SelectItem value="statutory_audit">Statutory Audit</SelectItem>

              <SelectItem value="roc_compliance">ROC Compliance</SelectItem>

              <SelectItem value="itr">ITR Filing</SelectItem>

              <SelectItem value="tds">TDS Return</SelectItem>

              <SelectItem value="accounting">Accounting</SelectItem>

              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as AssignmentPriority)}
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>

              <SelectItem value="high">High</SelectItem>

              <SelectItem value="medium">Medium</SelectItem>

              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-medium">Assign Employees</p>

              <span className="text-sm text-slate-500">
                {assignedUserIds.length} selected
              </span>
            </div>

            {loadingData ? (
              <p className="text-sm text-slate-500">Loading employees...</p>
            ) : availableEmployees.length === 0 ? (
              <p className="text-sm text-slate-500">No employees found.</p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {availableEmployees.map((user) => (
                  <label
                    key={user.uid}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition hover:border-sky-100 hover:bg-sky-50"
                  >
                    <input
                      type="checkbox"
                      checked={assignedUserIds.includes(user.uid)}
                      onChange={() => handleUserToggle(user.uid)}
                      disabled={submitting}
                      className="h-4 w-4"
                    />

                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-700">
                        {user.name || user.email || "Unknown User"}
                      </span>

                      {user.name && user.email && (
                        <span className="block truncate text-xs text-slate-500">
                          {user.email}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Input
            type="number"
            min="0.25"
            step="0.25"
            placeholder="Estimated Hours"
            value={estimatedHours}
            onChange={(event) => {
              setEstimatedHours(event.target.value);

              if (error) {
                setError("");
              }
            }}
            disabled={submitting}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-600">
                Start Date
              </p>

              <Input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                disabled={submitting}
              />
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-slate-600">
                Due Date
              </p>

              <Input
                type="date"
                value={dueDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setDueDate(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                disabled={submitting}
              />
            </div>
          </div>

          <Textarea
            placeholder="Remarks"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            disabled={submitting}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={handleSubmit}
            disabled={loadingData || submitting}
          >
            {submitting ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
