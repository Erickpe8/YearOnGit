import fs from "node:fs";
import path from "node:path";
import { normalizeRel, pathExists, toPosix } from "@/lib/project-index/path-utils";

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\s*\(\s*["']([^"']+)["']\s*\)/g;

export class ImportScanner {
  constructor(
    private readonly root: string,
    private readonly aliasPrefix = "@/",
    private readonly aliasTarget = "src/",
  ) {}

  scanFile(relPath: string): string[] {
    const abs = path.join(this.root, relPath);
    let source: string;
    try {
      source = fs.readFileSync(abs, "utf8");
    } catch {
      return [];
    }
    return this.scanSource(source, relPath);
  }

  scanSource(source: string, fromRel: string): string[] {
    const found = new Set<string>();
    const cleaned = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

    for (const match of cleaned.matchAll(IMPORT_RE)) {
      const spec = match[1] || match[2] || match[3];
      if (!spec) continue;
      const resolved = this.resolveSpecifier(spec, fromRel);
      if (resolved) found.add(resolved);
    }
    return [...found].sort();
  }

  resolveSpecifier(spec: string, fromRel: string): string | null {
    if (
      spec.startsWith("node:") ||
      (!spec.startsWith(".") && !spec.startsWith(this.aliasPrefix))
    ) {
      if (!spec.startsWith(this.aliasPrefix)) return null;
    }

    let candidate: string;
    if (spec.startsWith(this.aliasPrefix)) {
      candidate = this.aliasTarget + spec.slice(this.aliasPrefix.length);
    } else {
      const fromDir = path.posix.dirname(normalizeRel(fromRel));
      candidate = toPosix(path.posix.normalize(`${fromDir}/${spec}`));
    }

    candidate = normalizeRel(candidate);
    return this.resolveExisting(candidate);
  }

  private resolveExisting(relNoExt: string): string | null {
    const tries = [
      relNoExt,
      `${relNoExt}.ts`,
      `${relNoExt}.tsx`,
      `${relNoExt}.js`,
      `${relNoExt}.jsx`,
      `${relNoExt}.mjs`,
      `${relNoExt}.mts`,
      `${relNoExt}/index.ts`,
      `${relNoExt}/index.tsx`,
      `${relNoExt}/index.js`,
    ];
    for (const t of tries) {
      const abs = path.join(this.root, t);
      if (pathExists(abs) && fs.statSync(abs).isFile()) {
        return normalizeRel(t);
      }
    }
    return null;
  }
}
