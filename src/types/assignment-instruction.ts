export interface AssignmentInstruction {
  id?: string;

  assignmentId: string;

  instruction: string;

  createdBy?: string;
  createdByName?: string;

  createdAt?: any;
}
