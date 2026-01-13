/*[ Repository abstraction + in-memory implementation. ]*/

import { Task, TaskId, TaskStatus } from "./models";

export interface TaskRepository {
  create(task: Task): void;
  getById(id: TaskId): Task | undefined;
  list(): Task[];
  updateStatus(id: TaskId, status: TaskStatus, completedAtIso?: string): Task;
  remove(id: TaskId): void;
}

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<TaskId, Task>();

  create(task: Task): void {
    this.tasks.set(task.id, task);
  }

  getById(id: TaskId): Task | undefined {
    return this.tasks.get(id);
  }

  /*[ ~ `list()` returns tasks sorted ascending by `createdAtIso`. ]*/
  list(): Task[] {
    return [...this.tasks.values()].sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
  }

  /*[ ~ If `status` is "done", `completedAtIso` must be set; otherwise it must be cleared. ]*/
  updateStatus(id: TaskId, status: TaskStatus, completedAtIso?: string): Task {
    const existing = this.tasks.get(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }

    const updated: Task = {
      ...existing,
      status,
      completedAtIso: status === "done" ? completedAtIso : undefined
    };

    this.tasks.set(id, updated);
    return updated;
  }

  remove(id: TaskId): void {
    this.tasks.delete(id);
  }
}
