export type TaskId = string;

export type TaskStatus = "open" | "done";

export interface Task {
  id: TaskId;
  title: string;
  status: TaskStatus;
  createdAtIso: string;
  completedAtIso?: string;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
