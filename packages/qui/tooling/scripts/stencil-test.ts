/// <reference types="node" />
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const projects: string[] = [];

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === "--project" && args[index + 1] !== undefined) {
    projects.push(args[index + 1]);
    index += 1;
  } else if (argument?.startsWith("--project=")) {
    projects.push(argument.slice("--project=".length));
  }
}

const testProject = projects.length === 1 ? projects[0] : "all";
const child = spawn("stencil-test", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NODE_ENV: "test",
    STENCIL_TEST_PROJECT: testProject,
  },
});

child.on("error", (error) => {
  console.error("[qui] failed to start stencil-test:", error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
