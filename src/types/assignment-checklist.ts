export interface AssignmentChecklistItem {
  id?: string;

  assignmentId: string;

  title: string;

  completed: boolean;

  completedBy?: string;
  completedByName?: string;

  createdAt?: any;
  completedAt?: any;
}
