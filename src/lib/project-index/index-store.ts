import fs from "node:fs";
import path from "node:path";
import type {
  FilemapFile,
  FingerprintsFile,
  GraphFile,
  IndexFile,
  MetadataFile,
  OverviewFile,
} from "@/lib/project-index/types";
import { ensureDir } from "@/lib/project-index/path-utils";

export function stringifyPretty(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export class IndexStore {
  constructor(private readonly projectDir: string) {
    ensureDir(projectDir);
  }

  get dir(): string {
    return this.projectDir;
  }

  pathFor(name: string): string {
    return path.join(this.projectDir, name);
  }

  hasIndex(): boolean {
    return (
      fs.existsSync(this.pathFor("metadata.json")) &&
      fs.existsSync(this.pathFor("index.json"))
    );
  }

  readJson<T>(name: string): T | null {
    const p = this.pathFor(name);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  }

  writeJson(name: string, value: unknown): void {
    fs.writeFileSync(this.pathFor(name), stringifyPretty(value), "utf8");
  }

  readMetadata(): MetadataFile | null {
    return this.readJson("metadata.json");
  }
  writeMetadata(v: MetadataFile): void {
    this.writeJson("metadata.json", v);
  }

  readOverview(): OverviewFile | null {
    return this.readJson("overview.json");
  }
  writeOverview(v: OverviewFile): void {
    this.writeJson("overview.json", v);
  }

  readIndex(): IndexFile | null {
    return this.readJson("index.json");
  }
  writeIndex(v: IndexFile): void {
    this.writeJson("index.json", v);
  }

  readGraph(): GraphFile | null {
    return this.readJson("graph.json");
  }
  writeGraph(v: GraphFile): void {
    this.writeJson("graph.json", v);
  }

  readFilemap(): FilemapFile | null {
    return this.readJson("filemap.json");
  }
  writeFilemap(v: FilemapFile): void {
    this.writeJson("filemap.json", v);
  }

  readFingerprints(): FingerprintsFile | null {
    return this.readJson("fingerprints.json");
  }
  writeFingerprints(v: FingerprintsFile): void {
    this.writeJson("fingerprints.json", v);
  }
}
