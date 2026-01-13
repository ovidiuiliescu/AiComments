/*[ Service layer: enforces business rules and coordinates repository calls. ]*/

import { Task, TaskId } from "./models";
import { TaskRepository } from "./repository";
import { createTaskId, nowIso } from "./utils";

export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  /*[ ~ `addTask` must trim the title before storing it. ]*/
  addTask(title: string): Task {
    const task: Task = {
      id: createTaskId(),
      title: title.trim(),
      status: "open",
      createdAtIso: nowIso()
    };

    this.repo.create(task);
    return task;
  }

  listTasks(): Task[] {
    return this.repo.list();
  }

  /*[ ~ `markDone` must set `completedAtIso` to a current ISO timestamp. ]*/
  markDone(id: TaskId): Task {
    return this.repo.updateStatus(id, "done", nowIso());
  }

  /*[ > Add `renameTask(id, newTitle)` that trims and validates input. ]*/

  remove(id: TaskId): void {
    this.repo.remove(id);
  }
}
