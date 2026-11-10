import { auth } from "@/lib/firebase";
import type { Assignment } from "@/types/assignment";

export type BoardAssignment = Assignment & {
  actualHours: number;
  checklistProgress: number;
};

/**
 * A single authorized server request. Do not load all time entries in
 * the browser or make separate checklist requests for each assignment.
 */
export async function getAssignmentsWithAnalytics(): Promise<BoardAssignment[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("Your session expired. Please sign in again.");

  const response = await fetch("/api/assignment-board", {
    method: "GET",
    headers: { Authorization: "Bearer " + await user.getIdToken() },
    cache: "no-store",
  });

  const result = (await response.json()) as {
    assignments?: BoardAssignment[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(result.error || "Unable to load assignment board.");
  }

  return result.assignments || [];
}
