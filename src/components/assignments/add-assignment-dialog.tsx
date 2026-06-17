"use client";

import { useEffect, useState } from "react";

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

export default function AddAssignmentDialog() {
  const [open, setOpen] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");

  const [assignmentType, setAssignmentType] = useState("tax_audit");

  const [priority, setPriority] = useState("medium");

  const [estimatedHours, setEstimatedHours] = useState("");

  const [startDate, setStartDate] = useState("");

  const [dueDate, setDueDate] = useState("");

  const [remarks, setRemarks] = useState("");

  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const clientData = await getClients();
      const userData = await getUsers();

      setClients(clientData);
      setUsers(userData);
    }

    loadData();
  }, []);

  const handleUserToggle = (uid: string) => {
    setAssignedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await createAssignment({
        title,

        clientId,
        clientName,

        assignmentType: assignmentType as any,

        priority: priority as any,

        assignedUsers,

        estimatedHours: Number(estimatedHours),

        startDate,

        dueDate,

        status: "pending",

        remarks,
      });

      alert("Assignment Created Successfully");

      setOpen(false);

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert("Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Assignment</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Assignment Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Client */}

          <Select
            value={clientId}
            onValueChange={(value) => {
              setClientId(value);

              const selectedClient = clients.find((c) => c.id === value);

              setClientName(selectedClient?.clientName || "");
            }}
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

          {/* Assignment Type */}

          <Select value={assignmentType} onValueChange={setAssignmentType}>
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

          {/* Priority */}

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="high">High</SelectItem>

              <SelectItem value="medium">Medium</SelectItem>

              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Employees */}

          <div className="border rounded-lg p-4">
            <p className="font-medium mb-3">Assign Employees</p>

            <div className="space-y-2">
              {users.map((user) => (
                <label key={user.uid} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assignedUsers.includes(user.uid)}
                    onChange={() => handleUserToggle(user.uid)}
                  />

                  <span>{user.name || user.email}</span>
                </label>
              ))}
            </div>
          </div>

          <Input
            type="number"
            placeholder="Estimated Hours"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
          />

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Textarea
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
