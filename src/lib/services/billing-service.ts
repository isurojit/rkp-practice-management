import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Timesheet } from "@/types/timesheet";

export async function getClientBillingData(
  clientId: string,
  fromDate?: string,
  toDate?: string,
) {
  const q = query(
    collection(db, "timesheets"),
    where("clientId", "==", clientId),
    where("status", "==", "stopped"),
    where("billingStatus", "==", "unbilled"),
  );

  const snapshot = await getDocs(q);

  let timesheets = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as Omit<Timesheet, "id">),
  }));

  if (fromDate) {
    timesheets = timesheets.filter((item) => item.date >= fromDate);
  }

  if (toDate) {
    timesheets = timesheets.filter((item) => item.date <= toDate);
  }

  const totalHours = timesheets.reduce(
    (sum, item) => sum + Number(item.totalHours || 0),
    0,
  );

  return {
    timesheets,
    totalHours,
  };
}
