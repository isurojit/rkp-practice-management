"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";

export default function DashboardHeader() {
  const { user, role } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="h-16 border-b px-6 flex items-center justify-between">
      <h1 className="font-semibold">Dashboard</h1>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user?.email}</p>

          <p className="text-xs text-muted-foreground">{role}</p>
        </div>

        <button onClick={handleLogout} className="border px-3 py-2 rounded-md">
          Logout
        </button>
      </div>
    </header>
  );
}
