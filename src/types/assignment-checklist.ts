export interface AssignmentChecklistItem {
  id?: string;

  assignmentId: string;

  title: string;

  completed: boolean;

  createdAt?: any;
  completedAt?: any;
}
