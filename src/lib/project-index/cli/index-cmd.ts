import path from "node:path";
import { GitHookInstaller } from "@/lib/project-index/git-hook-installer";
import { IndexStore } from "@/lib/project-index/index-store";
import { Indexer } from "@/lib/project-index/indexer";
import { stringifyPretty } from "@/lib/project-index/index-store";

export type IndexCliArgs = {
  full?: boolean;
  check?: boolean;
  ifStale?: boolean;
  installHooks?: boolean;
  path?: string;
  noInteraction?: boolean;
  root?: string;
};

export function parseIndexArgs(argv: string[]): IndexCliArgs {
  const out: IndexCliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--full") out.full = true;
    else if (a === "--check") out.check = true;
    else if (a === "--if-stale") out.ifStale = true;
    else if (a === "--install-hooks") out.installHooks = true;
    else if (a === "--no-interaction") out.noInteraction = true;
    else if (a === "--path" || a.startsWith("--path=")) {
      out.path = a.includes("=") ? a.split("=")[1] : argv[++i];
    } else if (a === "--root" || a.startsWith("--root=")) {
      out.root = a.includes("=") ? a.split("=")[1] : argv[++i];
    }
  }
  return out;
}

export function runIndexCli(
  args: IndexCliArgs,
  runtime: { root?: string; log?: (s: string) => void; err?: (s: string) => void } = {},
): number {
  const root = args.root ?? runtime.root ?? process.cwd();
  const projectDir = path.resolve(root, args.path ?? ".project");
  const log = runtime.log ?? ((s) => process.stdout.write(`${s}\n`));
  const err = runtime.err ?? ((s) => process.stderr.write(`${s}\n`));

  try {
    const store = new IndexStore(projectDir);
    const indexer = new Indexer({ root, store });

    if (args.installHooks) {
      const result = new GitHookInstaller(root).install();
      if (!args.ifStale && !args.check) {
        log(stringifyPretty({ hooks: result }).trimEnd());
      }
    }

    if (args.check) {
      const report = indexer.checkStale();
      log(stringifyPretty(report).trimEnd());
      return report.stale ? 1 : 0;
    }

    if (args.ifStale) {
      const result = indexer.refreshIfStale();
      if (result.refreshed) {
        log(`Índice actualizado (${result.mode})`);
      }
      return 0;
    }

    const result = indexer.build({ full: Boolean(args.full) || !store.hasIndex() });
    const orphans = indexer.orphanSourceFiles();
    log(
      stringifyPretty({
        ok: true,
        ...result,
        project_path: projectDir,
        orphan_src_files: orphans,
      }).trimEnd(),
    );
    if (orphans.length) {
      err(`warning: ${orphans.length} src orphans not mapped in catalog`);
    }
    return 0;
  } catch (e) {
    if (args.noInteraction && (args.ifStale || args.installHooks)) {
      return 0;
    }
    err(e instanceof Error ? e.message : String(e));
    return 1;
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (
  entry &&
  /project-index[\\/]+cli[\\/]+index-cmd\.(ts|js|mts|mjs)$/.test(entry)
) {
  const code = runIndexCli(parseIndexArgs(process.argv.slice(2)));
  process.exit(code);
}
