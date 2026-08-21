export const SCHEMA_VERSION = 1;

export const TRUTH_RULE =
  "El índice decide QUÉ LEER, no QUÉ ES VERDAD. El código es la fuente de verdad.";

export type NodeType =
  | "project"
  | "domain"
  | "feature"
  | "service"
  | "infrastructure"
  | "configuration"
  | "test"
  | "documentation";

export type NodeStatus = "implemented";

export type CatalogProject = {
  id: string;
  name: string;
  summary: string;
};

export type CatalogNode = {
  id: string;
  type: NodeType;
  name: string;
  parent: string | null;
  summary: string;
  status: NodeStatus;
  aliases?: string[];
  paths: string[];
  entrypoints: string[];
  depends_on: string[];
};

export type CatalogDefinition = {
  project: CatalogProject;
  scan_roots: string[];
  ignore: string[];
  nodes: CatalogNode[];
};

export type FileFingerprint = {
  hash: string;
  imports: string[];
};

export type FingerprintsFile = {
  schema_version: number;
  files: Record<string, FileFingerprint>;
  catalog_hash: string;
};

export type MetadataFile = {
  schema_version: number;
  generated_at: string;
  commit: string | null;
  dirty: boolean;
  files_hash: string;
  catalog_hash: string;
  mode: "full" | "incremental";
  node_count: number;
  edge_count: number;
  truth_rule: string;
};

export type OverviewDomainChild = {
  id: string;
  type: NodeType;
  name: string;
  summary: string;
};

export type OverviewDomain = {
  id: string;
  name: string;
  summary: string;
  children: OverviewDomainChild[];
};

export type OverviewFile = {
  project: CatalogProject;
  truth_rule: string;
  context_budget: {
    prefer_levels: number[];
    max_initial_files: number;
    note: string;
  };
  how_to_query: string[];
  domains: OverviewDomain[];
};

export type IndexNode = {
  id: string;
  type: NodeType;
  name: string;
  summary: string;
  status: NodeStatus;
  parent: string | null;
  children: string[];
  depends_on: string[];
  entrypoints: string[];
  aliases?: string[];
};

export type IndexFile = {
  nodes: IndexNode[];
  physical: Record<string, string[]>;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: "depends_on" | "uses" | "tests";
  confidence: number;
  source: "catalog" | "import-analysis" | "path-map";
  inferred: boolean;
  weight?: number;
};

export type GraphFile = {
  edges: GraphEdge[];
};

export type FilemapEntry = {
  entrypoints: string[];
  dirs: string[];
  files: string[];
  tests: string[];
};

export type FilemapFile = {
  nodes: Record<string, FilemapEntry>;
};

export type StaleReason =
  | "missing-index"
  | "catalog-changed"
  | "source-files-changed";

export type StaleReport = {
  stale: boolean;
  reasons: StaleReason[];
  warnings: string[];
  affected_nodes?: string[];
};

export type BuildResult = {
  mode: "full" | "incremental";
  affected_nodes: string[];
  node_count: number;
  edge_count: number;
};

export type RelevantHit = {
  id: string;
  name: string;
  summary: string;
  score: number;
  entrypoints: string[];
  depends_on: string[];
  suggested_files: string[];
};
