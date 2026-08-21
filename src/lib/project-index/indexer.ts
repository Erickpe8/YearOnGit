import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Catalog } from "@/lib/project-index/catalog";
import { ImportScanner } from "@/lib/project-index/import-scanner";
import { IndexStore } from "@/lib/project-index/index-store";
import {
  INDEXABLE_EXTENSIONS,
  expandPathPattern,
  fileMatchesPattern,
  isDir,
  matchIgnore,
  normalizeRel,
  patternSpecificity,
  sha1File,
  sha1Text,
  walkFiles,
} from "@/lib/project-index/path-utils";
import type {
  BuildResult,
  CatalogDefinition,
  CatalogNode,
  FilemapEntry,
  FilemapFile,
  FingerprintsFile,
  GraphEdge,
  GraphFile,
  IndexFile,
  IndexNode,
  MetadataFile,
  NodeType,
  OverviewFile,
  StaleReport,
} from "@/lib/project-index/types";
import { SCHEMA_VERSION, TRUTH_RULE } from "@/lib/project-index/types";

const PRIMARY_SKIP = new Set<NodeType>([
  "project",
  "domain",
  "test",
  "documentation",
  "configuration",
  "infrastructure",
]);

export type IndexerOptions = {
  root: string;
  store: IndexStore;
  catalog?: CatalogDefinition;
};

export class Indexer {
  private readonly root: string;
  private readonly store: IndexStore;
  private readonly catalog: CatalogDefinition;
  private readonly scanner: ImportScanner;

  constructor(opts: IndexerOptions) {
    this.root = opts.root;
    this.store = opts.store;
    this.catalog = opts.catalog ?? Catalog.definition();
    this.scanner = new ImportScanner(this.root);
  }

  catalogHash(): string {
    return sha1Text(JSON.stringify(this.catalog));
  }

  listSourceFiles(): string[] {
    const files = new Set<string>();
    for (const rootEntry of this.catalog.scan_roots) {
      const abs = path.join(this.root, rootEntry);
      if (!fs.existsSync(abs)) continue;
      if (isDir(abs)) {
        for (const f of walkFiles(
          abs,
          this.root,
          INDEXABLE_EXTENSIONS,
          this.catalog.ignore,
        )) {
          files.add(f);
        }
      } else if (!matchIgnore(rootEntry, this.catalog.ignore)) {
        files.add(normalizeRel(rootEntry));
      }
    }
    return [...files].sort();
  }

  filesHash(fileHashes: Record<string, string>): string {
    const lines = Object.keys(fileHashes)
      .sort()
      .map((p) => `${p}:${fileHashes[p]}`);
    return sha1Text(lines.join("\n"));
  }

  gitCommit(): string | null {
    try {
      return execSync("git rev-parse HEAD", {
        cwd: this.root,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString("utf8")
        .trim();
    } catch {
      return null;
    }
  }

  gitDirty(): boolean {
    try {
      const out = execSync("git status --porcelain", {
        cwd: this.root,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString("utf8")
        .trim();
      return out.length > 0;
    } catch {
      return false;
    }
  }

  validateCatalog(): string[] {
    const errors: string[] = [];
    const ids = new Set<string>();
    for (const node of this.catalog.nodes) {
      if (ids.has(node.id)) errors.push(`duplicate id: ${node.id}`);
      ids.add(node.id);
    }
    for (const node of this.catalog.nodes) {
      if (node.parent && !ids.has(node.parent)) {
        errors.push(`missing parent ${node.parent} for ${node.id}`);
      }
      for (const dep of node.depends_on) {
        if (!ids.has(dep)) {
          errors.push(`invalid depends_on ${dep} on ${node.id}`);
        }
      }
      for (const ep of node.entrypoints) {
        const abs = path.join(this.root, ep);
        if (!fs.existsSync(abs)) {
          errors.push(`missing entrypoint ${ep} on ${node.id}`);
        }
      }
    }
    return errors;
  }

  orphanSourceFiles(): string[] {
    const mapped = new Set<string>();
    for (const node of this.catalog.nodes) {
      for (const pattern of node.paths) {
        for (const f of expandPathPattern(
          this.root,
          pattern,
          INDEXABLE_EXTENSIONS,
        )) {
          mapped.add(f);
        }
      }
    }
    const srcFiles = this.listSourceFiles().filter((f) =>
      f.startsWith("src/"),
    );
    return srcFiles.filter((f) => !mapped.has(f));
  }

  checkStale(): StaleReport {
    const warnings: string[] = [];
    const reasons: StaleReport["reasons"] = [];

    if (this.gitDirty()) warnings.push("working-tree-dirty");

    if (!this.store.hasIndex()) {
      return { stale: true, reasons: ["missing-index"], warnings };
    }

    const meta = this.store.readMetadata();
    const fps = this.store.readFingerprints();
    const catalogHash = this.catalogHash();

    if (!meta || meta.catalog_hash !== catalogHash) {
      reasons.push("catalog-changed");
    }

    const currentHashes: Record<string, string> = {};
    for (const f of this.listSourceFiles()) {
      currentHashes[f] = sha1File(path.join(this.root, f));
    }
    const filesHash = this.filesHash(currentHashes);

    if (!meta || meta.files_hash !== filesHash) {
      reasons.push("source-files-changed");
    }

    const commit = this.gitCommit();
    if (meta?.commit && commit && meta.commit !== commit) {
      warnings.push("commit-changed");
    }

    const affected: string[] = [];
    if (fps && reasons.includes("source-files-changed")) {
      for (const [file, hash] of Object.entries(currentHashes)) {
        const prev = fps.files[file];
        if (!prev || prev.hash !== hash) {
          affected.push(...this.nodesForFile(file).map((n) => n.id));
        }
      }
      for (const prevFile of Object.keys(fps.files)) {
        if (!(prevFile in currentHashes)) {
          affected.push(...this.nodesForFile(prevFile).map((n) => n.id));
        }
      }
    }

    return {
      stale: reasons.length > 0,
      reasons,
      warnings,
      affected_nodes: [...new Set(affected)].sort(),
    };
  }

  refreshIfStale(): { refreshed: boolean; mode: string; result?: BuildResult } {
    const report = this.checkStale();
    if (!report.stale) {
      return { refreshed: false, mode: "current" };
    }
    const full =
      report.reasons.includes("missing-index") ||
      report.reasons.includes("catalog-changed");
    const result = this.build({ full });
    return { refreshed: true, mode: result.mode, result };
  }

  build(opts: { full?: boolean } = {}): BuildResult {
    const catalogErrors = this.validateCatalog();
    if (catalogErrors.length) {
      throw new Error(`Catalog invalid:\n${catalogErrors.join("\n")}`);
    }

    const full = Boolean(opts.full) || !this.store.hasIndex();
    const catalogHash = this.catalogHash();
    const prevFp = this.store.readFingerprints();

    const sourceFiles = this.listSourceFiles();
    const fileHashes: Record<string, string> = {};
    const fingerprints: FingerprintsFile = {
      schema_version: SCHEMA_VERSION,
      catalog_hash: catalogHash,
      files: {},
    };

    const changedFiles: string[] = [];
    for (const file of sourceFiles) {
      const hash = sha1File(path.join(this.root, file));
      fileHashes[file] = hash;
      const prev = prevFp?.files[file];
      const needParse =
        full ||
        !prev ||
        prev.hash !== hash ||
        prevFp?.catalog_hash !== catalogHash;
      let imports = prev?.imports ?? [];
      if (needParse && isCodeFile(file)) {
        imports = this.scanner.scanFile(file);
        changedFiles.push(file);
      } else if (needParse) {
        changedFiles.push(file);
      }
      fingerprints.files[file] = { hash, imports };
    }

    const mode: "full" | "incremental" =
      full || !prevFp || prevFp.catalog_hash !== catalogHash
        ? "full"
        : "incremental";

    const nodeById = new Map(this.catalog.nodes.map((n) => [n.id, n]));
    const childrenMap = new Map<string, string[]>();
    for (const node of this.catalog.nodes) {
      if (!node.parent) continue;
      const list = childrenMap.get(node.parent) ?? [];
      list.push(node.id);
      childrenMap.set(node.parent, list);
    }

    const indexNodes: IndexNode[] = this.catalog.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      name: node.name,
      summary: node.summary,
      status: node.status,
      parent: node.parent,
      children: (childrenMap.get(node.id) ?? []).sort(),
      depends_on: [...node.depends_on],
      entrypoints: [...node.entrypoints],
      ...(node.aliases?.length ? { aliases: [...node.aliases] } : {}),
    }));

    const physical: Record<string, string[]> = {};
    for (const node of this.catalog.nodes) {
      for (const pattern of node.paths) {
        if (!pattern.endsWith("/") && !pattern.includes("*")) continue;
        const key = pattern.endsWith("/")
          ? normalizeRel(pattern)
          : normalizeRel(pattern.replace(/\/[^/]*\*.*$/, "/"));
        if (!key.endsWith("/")) continue;
        const list = physical[key] ?? [];
        if (!list.includes(node.id)) list.push(node.id);
        physical[key] = list;
      }
    }

    const indexFile: IndexFile = { nodes: indexNodes, physical };
    const filemap = this.buildFilemap(nodeById);
    const graph = this.buildGraph(fingerprints, nodeById);
    const overview = this.buildOverview();

    const filesHash = this.filesHash(fileHashes);
    const metadata: MetadataFile = {
      schema_version: SCHEMA_VERSION,
      generated_at: new Date().toISOString(),
      commit: this.gitCommit(),
      dirty: this.gitDirty(),
      files_hash: filesHash,
      catalog_hash: catalogHash,
      mode,
      node_count: indexNodes.length,
      edge_count: graph.edges.length,
      truth_rule: TRUTH_RULE,
    };

    this.store.writeMetadata(metadata);
    this.store.writeOverview(overview);
    this.store.writeIndex(indexFile);
    this.store.writeGraph(graph);
    this.store.writeFilemap(filemap);
    this.store.writeFingerprints(fingerprints);

    const affected = new Set<string>();
    for (const f of changedFiles) {
      for (const n of this.nodesForFile(f)) affected.add(n.id);
    }

    return {
      mode,
      affected_nodes: [...affected].sort(),
      node_count: metadata.node_count,
      edge_count: metadata.edge_count,
    };
  }

  nodesForFile(file: string): CatalogNode[] {
    return this.catalog.nodes.filter((n) =>
      n.paths.some((p) => fileMatchesPattern(file, p)),
    );
  }

  primaryNodeForFile(file: string): CatalogNode | null {
    const candidates = this.nodesForFile(file).filter(
      (n) => !PRIMARY_SKIP.has(n.type),
    );
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const sa = Math.max(...a.paths.map(patternSpecificity));
      const sb = Math.max(...b.paths.map(patternSpecificity));
      if (sb !== sa) return sb - sa;
      const rank = (t: NodeType) => (t === "service" ? 1 : 0);
      return rank(b.type) - rank(a.type);
    });
    return candidates[0] ?? null;
  }

  private buildFilemap(nodeById: Map<string, CatalogNode>): FilemapFile {
    const nodes: Record<string, FilemapEntry> = {};
    for (const node of this.catalog.nodes) {
      if (node.type === "project" || node.type === "domain") continue;

      const allFiles = new Set<string>();
      for (const pattern of node.paths) {
        for (const f of expandPathPattern(
          this.root,
          pattern,
          INDEXABLE_EXTENSIONS,
        )) {
          allFiles.add(f);
        }
      }

      const tests: string[] = [];
      const files: string[] = [];
      for (const f of [...allFiles].sort()) {
        if (/\.(test|spec)\./.test(f) || /\/__tests__\//.test(f)) tests.push(f);
        else files.push(f);
      }

      const { collapsedFiles, dirs } = collapseFiles(files, 12);
      const { collapsedFiles: collapsedTests, dirs: testDirs } = collapseFiles(
        tests,
        8,
      );

      nodes[node.id] = {
        entrypoints: [...node.entrypoints],
        dirs: [...new Set([...dirs, ...testDirs])].sort(),
        files: collapsedFiles,
        tests: collapsedTests,
      };
    }

    const suite = nodeById.get("test.suites");
    if (suite) {
      const allTests = Object.values(nodes).flatMap((e) => e.tests);
      nodes["test.suites"] = {
        entrypoints: [...suite.entrypoints],
        dirs: [],
        files: [],
        tests: [...new Set(allTests)].sort().slice(0, 50),
      };
    }

    return { nodes };
  }

  private buildGraph(
    fingerprints: FingerprintsFile,
    nodeById: Map<string, CatalogNode>,
  ): GraphFile {
    const edges: GraphEdge[] = [];
    const useKey = new Map<string, GraphEdge>();

    for (const node of this.catalog.nodes) {
      for (const dep of node.depends_on) {
        if (!nodeById.has(dep)) continue;
        edges.push({
          from: node.id,
          to: dep,
          type: "depends_on",
          confidence: 1,
          source: "catalog",
          inferred: false,
        });
      }
    }

    for (const [file, fp] of Object.entries(fingerprints.files)) {
      const fromNode = this.primaryNodeForFile(file);
      if (!fromNode) continue;
      for (const imp of fp.imports) {
        const toNode = this.primaryNodeForFile(imp);
        if (!toNode || toNode.id === fromNode.id) continue;
        const key = `${fromNode.id}->${toNode.id}`;
        const existing = useKey.get(key);
        if (existing) {
          existing.weight = (existing.weight ?? 1) + 1;
        } else {
          const edge: GraphEdge = {
            from: fromNode.id,
            to: toNode.id,
            type: "uses",
            confidence: 0.85,
            source: "import-analysis",
            inferred: true,
            weight: 1,
          };
          useKey.set(key, edge);
          edges.push(edge);
        }
      }

      if (/\.(test|spec)\./.test(file)) {
        const feature = this.nodesForFile(file).find((n) => n.type === "feature");
        const suite = nodeById.get("test.suites");
        if (feature && suite) {
          edges.push({
            from: suite.id,
            to: feature.id,
            type: "tests",
            confidence: 0.9,
            source: "path-map",
            inferred: true,
          });
        }
      }
    }

    const seen = new Set<string>();
    const deduped: GraphEdge[] = [];
    for (const e of edges) {
      const k = `${e.type}:${e.from}->${e.to}:${e.source}`;
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(e);
    }

    return { edges: deduped };
  }

  private buildOverview(): OverviewFile {
    const domains = this.catalog.nodes
      .filter((n) => n.type === "domain")
      .map((d) => ({
        id: d.id,
        name: d.name,
        summary: d.summary,
        children: this.catalog.nodes
          .filter((c) => c.parent === d.id)
          .map((c) => ({
            id: c.id,
            type: c.type,
            name: c.name,
            summary: c.summary,
          })),
      }));

    return {
      project: this.catalog.project,
      truth_rule: TRUTH_RULE,
      context_budget: {
        prefer_levels: [0, 1, 2],
        max_initial_files: 5,
        note: "Leer overview → relevant/context → entrypoints; ampliar solo si hace falta.",
      },
      how_to_query: [
        "npm run project:query -- overview",
        "npm run project:query -- relevant --q=\"tu tarea\"",
        "npm run project:query -- context <id>",
        "npm run project:query -- files <id>",
        "npm run project:query -- stale",
      ],
      domains,
    };
  }
}

function isCodeFile(rel: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs|mts|cts)$/.test(rel);
}

function collapseFiles(
  files: string[],
  limit: number,
): { collapsedFiles: string[]; dirs: string[] } {
  if (files.length <= limit) {
    return { collapsedFiles: files, dirs: [] };
  }

  const byDir = new Map<string, string[]>();
  for (const f of files) {
    const dir = f.includes("/") ? `${f.slice(0, f.lastIndexOf("/") + 1)}` : "";
    const list = byDir.get(dir) ?? [];
    list.push(f);
    byDir.set(dir, list);
  }

  const dirs: string[] = [];
  const collapsedFiles: string[] = [];
  for (const [dir, list] of [...byDir.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    if (dir && list.length > Math.min(limit, 8)) {
      dirs.push(dir);
    } else {
      collapsedFiles.push(...list);
    }
  }

  if (collapsedFiles.length > limit) {
    return {
      collapsedFiles: collapsedFiles.slice(0, limit),
      dirs: [...dirs, ...(collapsedFiles.length > limit ? [] : [])].sort(),
    };
  }
  return { collapsedFiles: collapsedFiles.sort(), dirs: dirs.sort() };
}
