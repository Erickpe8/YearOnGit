import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import type { CatalogDefinition } from "@/lib/project-index/types";
import { ImportScanner } from "@/lib/project-index/import-scanner";
import { IndexStore } from "@/lib/project-index/index-store";
import { Indexer } from "@/lib/project-index/indexer";
import { IndexQuery, tokenize } from "@/lib/project-index/index-query";
import { GitHookInstaller } from "@/lib/project-index/git-hook-installer";
import { runIndexCli } from "@/lib/project-index/cli/index-cmd";
import { runQueryCli } from "@/lib/project-index/cli/query-cmd";

function makeTempRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "yog-pi-"));
  fs.mkdirSync(path.join(root, "src/alpha"), { recursive: true });
  fs.mkdirSync(path.join(root, "src/beta"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "src/alpha/main.ts"),
    `import { helper } from "@/beta/helper";\nexport const x = helper();\n`,
  );
  fs.writeFileSync(
    path.join(root, "src/beta/helper.ts"),
    `export function helper() { return 1; }\n`,
  );
  fs.writeFileSync(
    path.join(root, "src/alpha/main.test.ts"),
    `import { x } from "./main";\n`,
  );
  return root;
}

function miniCatalog(): CatalogDefinition {
  return {
    project: {
      id: "demo",
      name: "Demo",
      summary: "Fixture demo",
    },
    scan_roots: ["src"],
    ignore: [".project/fingerprints.json"],
    nodes: [
      {
        id: "demo",
        type: "project",
        name: "Demo",
        parent: null,
        summary: "Root",
        status: "implemented",
        paths: [],
        entrypoints: ["src/alpha/main.ts"],
        depends_on: [],
        aliases: [],
      },
      {
        id: "domain.app",
        type: "domain",
        name: "App",
        parent: "demo",
        summary: "App domain",
        status: "implemented",
        paths: [],
        entrypoints: [],
        depends_on: [],
        aliases: [],
      },
      {
        id: "feature.alpha",
        type: "feature",
        name: "Alpha",
        parent: "domain.app",
        summary: "Alpha feature handles main entry",
        status: "implemented",
        paths: ["src/alpha/"],
        entrypoints: ["src/alpha/main.ts"],
        depends_on: ["feature.beta"],
        aliases: ["alpha-main", "entrada"],
      },
      {
        id: "feature.beta",
        type: "feature",
        name: "Beta Helper",
        parent: "domain.app",
        summary: "Beta helper service utilities",
        status: "implemented",
        paths: ["src/beta/"],
        entrypoints: ["src/beta/helper.ts"],
        depends_on: [],
        aliases: ["helper", "beta"],
      },
      {
        id: "test.suites",
        type: "test",
        name: "Tests",
        parent: "domain.app",
        summary: "Test suite node",
        status: "implemented",
        paths: [],
        entrypoints: [],
        depends_on: [],
        aliases: ["tests"],
      },
    ],
  };
}

describe("project-index unit", () => {
  let root = "";
  let projectDir = "";

  before(() => {
    root = makeTempRoot();
    projectDir = path.join(root, ".project");
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("validates unique ids and parents", () => {
    const store = new IndexStore(projectDir);
    const indexer = new Indexer({ root, store, catalog: miniCatalog() });
    assert.deepEqual(indexer.validateCatalog(), []);
  });

  it("scans simple and alias imports", () => {
    const scanner = new ImportScanner(root);
    const imports = scanner.scanFile("src/alpha/main.ts");
    assert.ok(imports.includes("src/beta/helper.ts"));
  });

  it("scans grouped-style multiline import blocks", () => {
    const scanner = new ImportScanner(root);
    const src = `import {\n  helper as h,\n} from "@/beta/helper";\n`;
    const imports = scanner.scanSource(src, "src/alpha/other.ts");
    assert.ok(imports.includes("src/beta/helper.ts"));
  });

  it("builds filemap, catalog depends_on and inferred uses", () => {
    const store = new IndexStore(projectDir);
    const indexer = new Indexer({ root, store, catalog: miniCatalog() });
    const result = indexer.build({ full: true });
    assert.equal(result.mode, "full");
    const filemap = store.readFilemap();
    assert.ok(filemap?.nodes["feature.alpha"]?.entrypoints.includes("src/alpha/main.ts"));
    const graph = store.readGraph();
    assert.ok(
      graph?.edges.some(
        (e) =>
          e.from === "feature.alpha" &&
          e.to === "feature.beta" &&
          e.type === "depends_on" &&
          e.inferred === false,
      ),
    );
    assert.ok(
      graph?.edges.some(
        (e) =>
          e.from === "feature.alpha" &&
          e.to === "feature.beta" &&
          e.type === "uses" &&
          e.inferred === true,
      ),
    );
  });

  it("incremental rebuild marks affected nodes when a file changes", () => {
    const store = new IndexStore(projectDir);
    const indexer = new Indexer({ root, store, catalog: miniCatalog() });
    indexer.build({ full: true });
    fs.writeFileSync(
      path.join(root, "src/beta/helper.ts"),
      `export function helper() { return 2; }\n`,
    );
    const result = indexer.build({ full: false });
    assert.equal(result.mode, "incremental");
    assert.ok(result.affected_nodes.includes("feature.beta"));
  });

  it("relevant finds beta helper", () => {
    const store = new IndexStore(projectDir);
    const indexer = new Indexer({ root, store, catalog: miniCatalog() });
    indexer.build({ full: true });
    const query = new IndexQuery(root, projectDir);
    const out = query.run({
      root,
      projectPath: projectDir,
      action: "relevant",
      q: "helper beta",
      noRefresh: true,
    }) as { hits: { id: string }[] };
    assert.ok(out.hits.some((h) => h.id === "feature.beta"));
  });

  it("stale detects source-files-changed", () => {
    const store = new IndexStore(projectDir);
    const indexer = new Indexer({ root, store, catalog: miniCatalog() });
    indexer.build({ full: true });
    fs.writeFileSync(
      path.join(root, "src/alpha/main.ts"),
      `import { helper } from "@/beta/helper";\nexport const x = helper() + 1;\n`,
    );
    const report = indexer.checkStale();
    assert.equal(report.stale, true);
    assert.ok(report.reasons.includes("source-files-changed"));
  });

  it("refreshIfStale no-op when current; rebuilds when file changed", () => {
    const store = new IndexStore(projectDir);
    const indexer = new Indexer({ root, store, catalog: miniCatalog() });
    indexer.build({ full: true });
    const a = indexer.refreshIfStale();
    assert.equal(a.refreshed, false);
    assert.equal(a.mode, "current");
    fs.writeFileSync(
      path.join(root, "src/beta/helper.ts"),
      `export function helper() { return 3; }\n`,
    );
    const b = indexer.refreshIfStale();
    assert.equal(b.refreshed, true);
  });

  it("GitHookInstaller copies hooks into temp .git/hooks", () => {
    const hookRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yog-hooks-"));
    fs.mkdirSync(path.join(hookRoot, ".githooks"));
    fs.mkdirSync(path.join(hookRoot, ".git"));
    fs.writeFileSync(path.join(hookRoot, ".githooks", "post-commit"), "#!/bin/sh\nexit 0\n");
    const result = new GitHookInstaller(hookRoot).install();
    assert.ok(result.installed.includes("post-commit"));
    assert.ok(fs.existsSync(path.join(hookRoot, ".git/hooks/post-commit")));
    fs.rmSync(hookRoot, { recursive: true, force: true });
  });

  it("tokenize drops short tokens and stopwords", () => {
    const tokens = tokenize("fix the auth oauth flow");
    assert.ok(tokens.includes("auth"));
    assert.ok(tokens.includes("oauth"));
    assert.ok(tokens.includes("flow"));
    assert.ok(!tokens.includes("the"));
    assert.ok(!tokens.includes("fix"));
  });
});

describe("project-index CLI against real repo", () => {
  const root = process.cwd();
  let tempProject = "";
  const logs: string[] = [];

  before(() => {
    tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "yog-pi-cli-"));
  });

  after(() => {
    fs.rmSync(tempProject, { recursive: true, force: true });
  });

  it("index --full creates artifacts", () => {
    logs.length = 0;
    const code = runIndexCli(
      { full: true, path: tempProject },
      { root, log: (s) => logs.push(s), err: () => {} },
    );
    assert.equal(code, 0);
    assert.ok(fs.existsSync(path.join(tempProject, "metadata.json")));
    assert.ok(fs.existsSync(path.join(tempProject, "overview.json")));
    assert.ok(fs.existsSync(path.join(tempProject, "index.json")));
    assert.ok(fs.existsSync(path.join(tempProject, "graph.json")));
    assert.ok(fs.existsSync(path.join(tempProject, "filemap.json")));
  });

  it("relevant finds a real domain feature", () => {
    logs.length = 0;
    const code = runQueryCli(
      {
        action: "relevant",
        q: "profile card",
        path: tempProject,
        noRefresh: true,
      },
      { root, log: (s) => logs.push(s), err: () => {} },
    );
    assert.equal(code, 0);
    const payload = JSON.parse(logs.join("\n"));
    assert.ok(payload.hits.length >= 1 && payload.hits.length <= 5);
    assert.ok(payload.hits.some((h: { id: string }) => h.id === "feature.profile-card"));
    assert.ok(payload.hits[0].entrypoints?.length);
  });

  it("known entrypoint appears in filemap", () => {
    logs.length = 0;
    const code = runQueryCli(
      {
        action: "files",
        id: "feature.github-api",
        path: tempProject,
        noRefresh: true,
      },
      { root, log: (s) => logs.push(s), err: () => {} },
    );
    assert.equal(code, 0);
    const payload = JSON.parse(logs.join("\n"));
    assert.ok(payload.entrypoints.includes("src/lib/github/client.ts"));
  });

  it("--check is OK right after index", () => {
    logs.length = 0;
    const code = runIndexCli(
      { check: true, path: tempProject },
      { root, log: (s) => logs.push(s), err: () => {} },
    );
    assert.equal(code, 0);
    const report = JSON.parse(logs.join("\n"));
    assert.equal(report.stale, false);
  });

  it("query --no-refresh without index fails", () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "yog-pi-empty-"));
    const err: string[] = [];
    const code = runQueryCli(
      { action: "overview", path: empty, noRefresh: true },
      { root, log: () => {}, err: (s) => err.push(s) },
    );
    assert.equal(code, 1);
    assert.ok(err.join("").includes("missing-index"));
    fs.rmSync(empty, { recursive: true, force: true });
  });

  it("query without index creates then responds", () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "yog-pi-auto-"));
    const out: string[] = [];
    const code = runQueryCli(
      { action: "overview", path: empty },
      { root, log: (s) => out.push(s), err: () => {} },
    );
    assert.equal(code, 0);
    const payload = JSON.parse(out.join("\n"));
    assert.equal(payload.project.id, "yearongit");
    assert.ok(fs.existsSync(path.join(empty, "index.json")));
    fs.rmSync(empty, { recursive: true, force: true });
  });

  it("--if-stale when current does not print actualizado", () => {
    const out: string[] = [];
    runIndexCli(
      { full: true, path: tempProject },
      { root, log: () => {}, err: () => {} },
    );
    const code = runIndexCli(
      { ifStale: true, path: tempProject },
      { root, log: (s) => out.push(s), err: () => {} },
    );
    assert.equal(code, 0);
    assert.ok(!out.some((l) => /actualizado/i.test(l)));
  });
});
