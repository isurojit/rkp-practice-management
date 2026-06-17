"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function AddUserDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input
            placeholder="Full Name"
            className="w-full border rounded-md p-2"
          />

          <input placeholder="Email" className="w-full border rounded-md p-2" />

          <select className="w-full border rounded-md p-2">
            <option>Employee</option>

            <option>Manager</option>
          </select>

          <Button className="w-full">Create User</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
