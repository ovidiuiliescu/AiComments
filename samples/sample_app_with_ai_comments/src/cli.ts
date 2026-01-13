/*[ CLI parser/dispatcher for the Tasker demo app. ]*/

import { isNonEmptyString } from "./models";
import { TaskService } from "./service";
import { EXIT, padRight, printLines } from "./utils";

export type CliResult = {
  exitCode: number;
};

function usage(): string[] {
  return [
    "Tasker (in-memory demo)",
    "",
    "Usage:",
    "  tasker add <title>",
    "  tasker list",
    "  tasker done <id>",
    "  tasker remove <id>",
    "  tasker help",
    "",
    "Examples:",
    "  tasker add \"buy milk\"",
    "  tasker list",
    "  tasker done t_kx9...",
    ""
  ];
}

/*[ ~ `runCli` must never throw for invalid user input; it should return `EXIT.USAGE`. ]*/
/*[ > Add a `rename <id> <new title>` command wired to `TaskService.renameTask`. ]*/
/*[ > Add an `export-json` command that prints tasks as JSON. ]*/
/*[ > Add an `import-json` command that reads tasks JSON from stdin and merges safely. ]*/
export function runCli(argv: string[], service: TaskService): CliResult {
  const [command, ...rest] = argv;

  if (!command || command === "help" || command === "-h" || command === "--help") {
    printLines(usage());
    return { exitCode: EXIT.OK };
  }

  if (command === "add") {
    const title = rest.join(" ");
    if (!isNonEmptyString(title)) {
      printLines(usage());
      return { exitCode: EXIT.USAGE };
    }

    const created = service.addTask(title);
    printLines([`Added ${created.id}`]);
    return { exitCode: EXIT.OK };
  }

  if (command === "list") {
    const tasks = service.listTasks();
    if (tasks.length === 0) {
      printLines(["No tasks yet."]);
      return { exitCode: EXIT.OK };
    }

    const widestId = Math.max(...tasks.map(t => t.id.length));
    const lines = tasks.map(t => {
      const status = t.status === "done" ? "[x]" : "[ ]";
      return `${status} ${padRight(t.id, widestId)}  ${t.title}`;
    });

    printLines(lines);
    return { exitCode: EXIT.OK };
  }

  if (command === "done") {
    const id = rest[0];
    if (!isNonEmptyString(id)) {
      printLines(usage());
      return { exitCode: EXIT.USAGE };
    }

    service.markDone(id);
    printLines([`Marked done: ${id}`]);
    return { exitCode: EXIT.OK };
  }

  if (command === "remove") {
    const id = rest[0];
    if (!isNonEmptyString(id)) {
      printLines(usage());
      return { exitCode: EXIT.USAGE };
    }

    service.remove(id);
    printLines([`Removed: ${id}`]);
    return { exitCode: EXIT.OK };
  }

  printLines([`Unknown command: ${command}`, "", ...usage()]);
  return { exitCode: EXIT.USAGE };
}
