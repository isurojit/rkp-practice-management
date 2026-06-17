import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Timesheet } from "@/types/timesheet";

export async function getClientBillingData(clientId: string) {
  const q = query(
    collection(db, "timesheets"),
    where("clientId", "==", clientId),
    where("status", "==", "stopped"),
  );

  const snapshot = await getDocs(q);

  const timesheets = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Timesheet, "id">),
  }));

  const totalHours = timesheets.reduce(
    (sum, item) => sum + Number(item.totalHours || 0),
    0,
  );

  return {
    timesheets,
    totalHours,
  };
}
