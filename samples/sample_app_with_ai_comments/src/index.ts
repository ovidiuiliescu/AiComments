/*[ App entrypoint: wires up repository + service + CLI. ]*/

import { InMemoryTaskRepository } from "./repository";
import { TaskService } from "./service";
import { runCli } from "./cli";

/*[ ? This sample intentionally uses in-memory storage to keep the demo tiny. ]*/
/*[ > Add a file-backed repository (e.g. JSON on disk) and switch to it via an env var. ]*/
function main(): number {
  const repo = new InMemoryTaskRepository();
  const service = new TaskService(repo);

  const argv = process.argv.slice(2);
  const result = runCli(argv, service);
  return result.exitCode;
}

process.exit(main());
