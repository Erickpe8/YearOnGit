import path from "node:path";
import { Indexer } from "@/lib/project-index/indexer";
import { IndexStore } from "@/lib/project-index/index-store";
import { STOPWORDS } from "@/lib/project-index/stopwords";
import { normalizeRel, stripAccent } from "@/lib/project-index/path-utils";
import type {
  IndexNode,
  RelevantHit,
  StaleReport,
} from "@/lib/project-index/types";
import { TRUTH_RULE } from "@/lib/project-index/types";

export type QueryAction =
  | "overview"
  | "node"
  | "children"
  | "parent"
  | "dependencies"
  | "dependents"
  | "find"
  | "path"
  | "files"
  | "related"
  | "context"
  | "relevant"
  | "stale";

export type QueryOptions = {
  root: string;
  projectPath: string;
  action: QueryAction;
  id?: string;
  q?: string;
  depth?: number;
  noRefresh?: boolean;
};

export class IndexQuery {
  private readonly store: IndexStore;
  private readonly indexer: Indexer;

  constructor(
    private readonly root: string,
    projectPath: string,
  ) {
    this.store = new IndexStore(projectPath);
    this.indexer = new Indexer({ root, store: this.store });
  }

  getStore(): IndexStore {
    return this.store;
  }

  getIndexer(): Indexer {
    return this.indexer;
  }

  ensureFresh(noRefresh: boolean): void {
    if (noRefresh) {
      if (!this.store.hasIndex()) {
        throw new Error("missing-index");
      }
      return;
    }
    this.indexer.refreshIfStale();
    if (!this.store.hasIndex()) {
      this.indexer.build({ full: true });
    }
  }

  run(opts: QueryOptions): unknown {
    if (opts.action !== "stale") {
      this.ensureFresh(Boolean(opts.noRefresh));
    }

    switch (opts.action) {
      case "overview":
        return this.store.readOverview();
      case "node":
        return this.requireNode(opts.id);
      case "children":
        return this.children(opts.id, opts.depth ?? 1);
      case "parent":
        return this.parentOf(opts.id);
      case "dependencies":
        return this.dependencies(opts.id, opts.depth ?? 1);
      case "dependents":
        return this.dependents(opts.id);
      case "find":
        return this.find(opts.q ?? "");
      case "path":
        return this.pathLookup(opts.q ?? opts.id ?? "");
      case "files":
        return this.files(opts.id);
      case "related":
        return this.related(opts.id);
      case "context":
        return this.context(opts.id);
      case "relevant":
        return this.relevant(opts.q ?? "");
      case "stale":
        return this.stale();
      default:
        throw new Error(`unknown action: ${opts.action}`);
    }
  }

  private nodes(): IndexNode[] {
    const idx = this.store.readIndex();
    if (!idx) throw new Error("missing-index");
    return idx.nodes;
  }

  private requireNode(id?: string): IndexNode {
    if (!id) throw new Error("id required");
    const node = this.nodes().find((n) => n.id === id);
    if (!node) throw new Error(`node not found: ${id}`);
    return node;
  }

  private children(id?: string, depth = 1): unknown {
    const node = this.requireNode(id);
    const all = this.nodes();
    const collect = (nid: string, d: number): unknown[] => {
      if (d <= 0) return [];
      return all
        .filter((n) => n.parent === nid)
        .map((n) => ({
          id: n.id,
          type: n.type,
          name: n.name,
          summary: n.summary,
          children: collect(n.id, d - 1),
        }));
    };
    return { id: node.id, children: collect(node.id, depth) };
  }

  private parentOf(id?: string): unknown {
    const node = this.requireNode(id);
    if (!node.parent) return { id: node.id, parent: null };
    return { id: node.id, parent: this.requireNode(node.parent) };
  }

  private walkDeps(id: string, depth: number): string[] {
    const node = this.requireNode(id);
    const out: string[] = [];
    const visit = new Set<string>();
    const walk = (nid: string, d: number) => {
      if (d < 0 || visit.has(nid)) return;
      visit.add(nid);
      const n = this.nodes().find((x) => x.id === nid);
      if (!n) return;
      for (const dep of n.depends_on) {
        out.push(dep);
        walk(dep, d - 1);
      }
    };
    walk(node.id, depth);
    return [...new Set(out)];
  }

  private dependencies(id?: string, depth = 1): unknown {
    const node = this.requireNode(id);
    const ids = this.walkDeps(node.id, depth);
    return {
      id: node.id,
      dependencies: ids.map((i) => summarize(this.requireNode(i))),
    };
  }

  private dependents(id?: string): unknown {
    const node = this.requireNode(id);
    const graph = this.store.readGraph();
    const fromCatalog = this.nodes()
      .filter((n) => n.depends_on.includes(node.id))
      .map((n) => n.id);
    const fromEdges =
      graph?.edges
        .filter((e) => e.to === node.id && (e.type === "uses" || e.type === "depends_on"))
        .map((e) => e.from) ?? [];
    const ids = [...new Set([...fromCatalog, ...fromEdges])];
    return {
      id: node.id,
      dependents: ids.map((i) => summarize(this.requireNode(i))),
    };
  }

  private find(q: string): unknown {
    const tokens = tokenize(q);
    const hits = this.nodes()
      .map((n) => ({ node: n, score: scoreNode(n, tokens) }))
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((h) => ({ ...summarize(h.node), score: h.score }));
    return { q, hits };
  }

  private pathLookup(filePath: string): unknown {
    const rel = normalizeRel(filePath);
    const absTry = path.isAbsolute(filePath)
      ? normalizeRel(path.relative(this.root, filePath))
      : rel;
    const nodes = this.indexer.nodesForFile(absTry).map((n) => n.id);
    const primary = this.indexer.primaryNodeForFile(absTry);
    return {
      path: absTry,
      nodes,
      primary: primary?.id ?? null,
    };
  }

  private files(id?: string): unknown {
    const node = this.requireNode(id);
    const fm = this.store.readFilemap()?.nodes[node.id] ?? {
      entrypoints: node.entrypoints,
      dirs: [],
      files: [],
      tests: [],
    };
    return { id: node.id, ...fm };
  }

  private related(id?: string): unknown {
    const node = this.requireNode(id);
    const deps = this.walkDeps(node.id, 1);
    const graph = this.store.readGraph();
    const uses =
      graph?.edges
        .filter((e) => e.from === node.id && e.type === "uses")
        .map((e) => e.to) ?? [];
    const ids = [...new Set([...deps, ...uses, ...node.children])];
    return {
      id: node.id,
      related: ids.map((i) => summarize(this.requireNode(i))),
    };
  }

  private context(id?: string): unknown {
    const node = this.requireNode(id);
    const parent = node.parent
      ? summarize(this.requireNode(node.parent))
      : null;
    const children = node.children.map((c) => summarize(this.requireNode(c)));
    const dependencies = node.depends_on.map((d) =>
      summarize(this.requireNode(d)),
    );
    const dependents = (
      this.dependents(node.id) as { dependents: ReturnType<typeof summarize>[] }
    ).dependents;
    const files = this.files(node.id);
    return {
      truth_rule: TRUTH_RULE,
      node: summarize(node),
      parent,
      children,
      dependencies,
      dependents,
      files,
      next_step:
        "Leer entrypoints del nodo; validar en código; ampliar con dependencies solo si la tarea lo requiere.",
    };
  }

  private relevant(q: string): unknown {
    const tokens = tokenize(q);
    const hits: RelevantHit[] = this.nodes()
      .filter((n) => n.type !== "project" && n.type !== "domain")
      .map((n) => {
        const score = scoreNode(n, tokens);
        const fm = this.store.readFilemap()?.nodes[n.id];
        const suggested = [
          ...n.entrypoints,
          ...(fm?.files ?? []).slice(0, 3),
        ].slice(0, 8);
        return {
          id: n.id,
          name: n.name,
          summary: n.summary,
          score,
          entrypoints: n.entrypoints,
          depends_on: n.depends_on,
          suggested_files: [...new Set(suggested)],
        };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      truth_rule: TRUTH_RULE,
      q,
      hits,
    };
  }

  private stale(): StaleReport {
    return this.indexer.checkStale();
  }
}

function summarize(n: IndexNode) {
  return {
    id: n.id,
    type: n.type,
    name: n.name,
    summary: n.summary,
  };
}

export function tokenize(q: string): string[] {
  return stripAccent(q.toLowerCase())
    .split(/[^a-z0-9_/-]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function scoreNode(n: IndexNode, tokens: string[]): number {
  if (!tokens.length) return 0;
  let score = 0;
  const id = stripAccent(n.id.toLowerCase());
  const name = stripAccent(n.name.toLowerCase());
  const aliases = (n.aliases ?? []).map((a) => stripAccent(a.toLowerCase()));
  const haystack = stripAccent(
    `${n.summary} ${n.entrypoints.join(" ")}`.toLowerCase(),
  );

  for (const t of tokens) {
    if (id === t || id.endsWith(`.${t}`) || id.includes(t)) score += 5;
    if (name.includes(t)) score += 4;
    if (aliases.some((a) => a === t || a.includes(t))) score += 4;
    if (haystack.includes(t)) score += 1;
  }
  return score;
}
