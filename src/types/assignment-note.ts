export interface AssignmentNote {
  id?: string;

  assignmentId: string;

  note: string;

  createdBy?: string;
  createdByName?: string;

  createdAt?: any;
}
