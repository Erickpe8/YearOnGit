import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (process.env.VERCEL || process.env.CI) {
  process.exit(0);
}

const cli = path.join(root, "src/lib/project-index/cli/index-cmd.ts");
if (!fs.existsSync(cli)) {
  process.exit(0);
}

const tsxJs = path.join(root, "node_modules/tsx/dist/cli.mjs");
const tsxBin = path.join(
  root,
  "node_modules/.bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);
const runner = fs.existsSync(tsxJs)
  ? { cmd: process.execPath, args: [tsxJs, cli] }
  : fs.existsSync(tsxBin)
    ? { cmd: tsxBin, args: [cli] }
    : null;

if (!runner) {
  process.exit(0);
}

const result = spawnSync(
  runner.cmd,
  [...runner.args, "--if-stale", "--install-hooks", "--no-interaction"],
  {
    cwd: root,
    stdio: "ignore",
    shell: process.platform === "win32",
    env: process.env,
  },
);

process.exit(0);
void result;
