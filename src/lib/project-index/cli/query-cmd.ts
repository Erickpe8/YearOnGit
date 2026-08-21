import path from "node:path";
import {
  IndexQuery,
  type QueryAction,
} from "@/lib/project-index/index-query";
import { stringifyPretty } from "@/lib/project-index/index-store";

const ACTIONS = new Set<QueryAction>([
  "overview",
  "node",
  "children",
  "parent",
  "dependencies",
  "dependents",
  "find",
  "path",
  "files",
  "related",
  "context",
  "relevant",
  "stale",
]);

export type QueryCliArgs = {
  action?: QueryAction;
  id?: string;
  q?: string;
  depth?: number;
  path?: string;
  noRefresh?: boolean;
  root?: string;
};

export function parseQueryArgs(argv: string[]): QueryCliArgs {
  const out: QueryCliArgs = {};
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-refresh") out.noRefresh = true;
    else if (a === "--q" || a.startsWith("--q=")) {
      out.q = a.includes("=") ? a.slice(4) : argv[++i];
    } else if (a === "--depth" || a.startsWith("--depth=")) {
      out.depth = Number(a.includes("=") ? a.split("=")[1] : argv[++i]);
    } else if (a === "--path" || a.startsWith("--path=")) {
      out.path = a.includes("=") ? a.split("=")[1] : argv[++i];
    } else if (a === "--root" || a.startsWith("--root=")) {
      out.root = a.includes("=") ? a.split("=")[1] : argv[++i];
    } else if (!a.startsWith("-")) {
      positionals.push(a);
    }
  }
  if (positionals[0] && ACTIONS.has(positionals[0] as QueryAction)) {
    out.action = positionals[0] as QueryAction;
    out.id = positionals[1];
  }
  return out;
}

export function runQueryCli(
  args: QueryCliArgs,
  runtime: { root?: string; log?: (s: string) => void; err?: (s: string) => void } = {},
): number {
  const root = args.root ?? runtime.root ?? process.cwd();
  const projectDir = path.resolve(root, args.path ?? ".project");
  const log = runtime.log ?? ((s) => process.stdout.write(`${s}\n`));
  const err = runtime.err ?? ((s) => process.stderr.write(`${s}\n`));

  if (!args.action) {
    err("usage: project:query <action> [id] [--q=] [--depth=] [--path=] [--no-refresh]");
    return 1;
  }

  try {
    const query = new IndexQuery(root, projectDir);
    const result = query.run({
      root,
      projectPath: projectDir,
      action: args.action,
      id: args.id,
      q: args.q,
      depth: args.depth,
      noRefresh: args.noRefresh,
    });
    log(stringifyPretty(result).trimEnd());
    return 0;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    err(stringifyPretty({ error: message }).trimEnd());
    return 1;
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (
  entry &&
  /project-index[\\/]+cli[\\/]+query-cmd\.(ts|js|mts|mjs)$/.test(entry)
) {
  const code = runQueryCli(parseQueryArgs(process.argv.slice(2)));
  process.exit(code);
}
