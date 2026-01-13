import { InMemoryTaskRepository } from "./repository";
import { TaskService } from "./service";
import { runCli } from "./cli";

function main(): number {
  const repo = new InMemoryTaskRepository();
  const service = new TaskService(repo);

  const argv = process.argv.slice(2);
  const result = runCli(argv, service);
  return result.exitCode;
}

process.exit(main());
