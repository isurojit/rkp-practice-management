import { getDocs, collection } from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function getDashboardStats() {
  const [clients, assignments, users, timesheets] = await Promise.all([
    getDocs(collection(db, "clients")),
    getDocs(collection(db, "assignments")),
    getDocs(collection(db, "users")),
    getDocs(collection(db, "timesheets")),
  ]);

  return {
    totalClients: clients.size,

    totalAssignments: assignments.size,

    totalUsers: users.size,

    totalTimesheets: timesheets.size,
  };
}
