/*[ Task domain types and small validation helpers. ]*/

/*[ ~ `TaskStatus` must be either "open" or "done". ]*/
export type TaskId = string;

export type TaskStatus = "open" | "done";

/*[ ~ `createdAtIso` and `completedAtIso` are ISO-8601 strings (from `Date#toISOString()`). ]*/
export interface Task {
  id: TaskId;
  title: string;
  status: TaskStatus;
  createdAtIso: string;
  completedAtIso?: string;
}

/*[ ~ Treat whitespace-only strings as empty/invalid input. ]*/
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
