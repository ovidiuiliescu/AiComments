/*[ Small utilities used by the CLI + service layer. ]*/

import { Task } from "./models";

export const EXIT = {
  OK: 0,
  USAGE: 2,
  RUNTIME: 1
} as const;

/*[ ~ `nowIso()` returns the current timestamp in ISO-8601 format. ]*/
export function nowIso(): string {
  return new Date().toISOString();
}

/*[ ? Task IDs are human-friendly and non-cryptographic; do not treat them as secrets. ]*/
/*[ > Add a deterministic ID generator option for tests (e.g. seedable). ]*/
export function createTaskId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `t_${time}_${rand}`;
}

export function formatTaskLine(task: Task): string {
  const status = task.status === "done" ? "[x]" : "[ ]";
  return `${status} ${task.id}  ${task.title}`;
}

/*[ ~ `padRight` must never truncate `value`. ]*/
export function padRight(value: string, width: number): string {
  if (value.length >= width) return value;
  return value + " ".repeat(width - value.length);
}

/*[ ~ `printLines` prints each line exactly once, in order. ]*/
export function printLines(lines: string[]): void {
  for (const line of lines) {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}
