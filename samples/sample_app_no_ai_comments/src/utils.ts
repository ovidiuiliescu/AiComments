import { Task } from "./models";

export const EXIT = {
  OK: 0,
  USAGE: 2,
  RUNTIME: 1
} as const;

export function nowIso(): string {
  return new Date().toISOString();
}

export function createTaskId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `t_${time}_${rand}`;
}

export function formatTaskLine(task: Task): string {
  const status = task.status === "done" ? "[x]" : "[ ]";
  return `${status} ${task.id}  ${task.title}`;
}

export function padRight(value: string, width: number): string {
  if (value.length >= width) return value;
  return value + " ".repeat(width - value.length);
}

export function printLines(lines: string[]): void {
  for (const line of lines) {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}
