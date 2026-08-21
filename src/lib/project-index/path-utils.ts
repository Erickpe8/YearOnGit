import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function normalizeRel(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

export function sha1Text(text: string): string {
  return createHash("sha1").update(text, "utf8").digest("hex");
}

export function sha1File(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  return createHash("sha1").update(buf).digest("hex");
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function pathExists(abs: string): boolean {
  try {
    fs.accessSync(abs);
    return true;
  } catch {
    return false;
  }
}

export function isDir(abs: string): boolean {
  try {
    return fs.statSync(abs).isDirectory();
  } catch {
    return false;
  }
}

export function stripAccent(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

export function matchIgnore(rel: string, ignore: string[]): boolean {
  const n = normalizeRel(rel);
  return ignore.some((rule) => {
    const r = normalizeRel(rule).replace(/\/$/, "");
    return n === r || n.startsWith(`${r}/`);
  });
}

export function expandPathPattern(
  root: string,
  pattern: string,
  indexableExt: Set<string>,
): string[] {
  const rel = normalizeRel(pattern);
  const abs = path.join(root, rel);

  if (rel.endsWith("/")) {
    return walkFiles(abs, root, indexableExt);
  }

  if (rel.includes("*")) {
    const dirPart = rel.includes("/")
      ? rel.slice(0, rel.lastIndexOf("/") + 1)
      : "";
    const fileGlob = rel.slice(dirPart.length);
    const dirAbs = path.join(root, dirPart);
    if (!isDir(dirAbs)) return [];
    const re = globToRegExp(fileGlob);
    return fs
      .readdirSync(dirAbs)
      .filter((name) => re.test(name))
      .map((name) => normalizeRel(path.join(dirPart, name)))
      .filter((p) => {
        const ext = path.extname(p).toLowerCase();
        return indexableExt.has(ext) || ext === "";
      });
  }

  if (pathExists(abs)) {
    if (isDir(abs)) return walkFiles(abs, root, indexableExt);
    return [rel];
  }
  return [];
}

function globToRegExp(glob: string): RegExp {
  const esc = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${esc}$`);
}

export function walkFiles(
  absDir: string,
  root: string,
  indexableExt: Set<string>,
  ignore: string[] = [],
): string[] {
  if (!isDir(absDir)) return [];
  const out: string[] = [];
  const stack = [absDir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const abs = path.join(cur, ent.name);
      const rel = normalizeRel(path.relative(root, abs));
      if (matchIgnore(rel, ignore)) continue;
      if (ent.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (!ent.isFile()) continue;
      const ext = path.extname(ent.name).toLowerCase();
      if (!indexableExt.has(ext) && !INDEXABLE_BASENAMES.has(ent.name)) continue;
      out.push(rel);
    }
  }
  return out.sort();
}

const INDEXABLE_BASENAMES = new Set([
  "Dockerfile",
  "Makefile",
  ".env.example",
]);

export const INDEXABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  ".md",
  ".mdc",
  ".css",
  ".yml",
  ".yaml",
  ".toml",
  ".prisma",
  ".sql",
  ".txt",
  ".svg",
]);

export function patternSpecificity(pattern: string): number {
  const n = normalizeRel(pattern).replace(/\/$/, "");
  return n.length;
}

export function fileMatchesPattern(file: string, pattern: string): boolean {
  const f = normalizeRel(file);
  const p = normalizeRel(pattern);
  if (p.endsWith("/")) return f === p.slice(0, -1) || f.startsWith(p);
  if (p.includes("*")) {
    const dirPart = p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "";
    const fileGlob = p.slice(dirPart.length);
    if (!f.startsWith(dirPart) && dirPart !== "") return false;
    const base = f.slice(dirPart.length);
    if (base.includes("/")) return false;
    return globToRegExp(fileGlob).test(base);
  }
  if (f === p) return true;
  return f.startsWith(`${p}/`);
}
