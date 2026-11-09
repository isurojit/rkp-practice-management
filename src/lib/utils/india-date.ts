/**
 * Calendar date in Asia/Kolkata. Avoid UTC rollover moving early-morning
 * attendance and timesheet records to the previous business day.
 */
export function getIndiaDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const read = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value || "";

  return [read("year"), read("month"), read("day")].join("-");
}
