/**
 * FlowDoc core types.
 *
 * Every reporting-guideline diagram (PRISMA, CONSORT, STROBE, …) is modeled
 * as a directed acyclic graph placed on a rectangular grid. Presets declare
 * the topology, layout, and validation rules. User data only fills in counts
 * and labels — never structure.
 */

/** Top-level document — the thing a user authors. */
export interface FlowDocument {
  $schema?: string;
  preset: string;                  // e.g. "prisma-2020"
  metadata?: DocumentMetadata;
  data: Record<string, DataValue>; // preset-specific flat key/value map
}

export interface DocumentMetadata {
  title?: string;
  authors?: string[];
  doi?: string;
  date?: string;
  language?: string;
  notes?: string;
}

export type DataValue = number | string | ExclusionReason[] | undefined;

export interface ExclusionReason {
  reason: string;
  n: number;
}

/** A preset defines the shape of a diagram. Engine is preset-agnostic. */
export interface Preset {
  id: string;
  version: string;
  name: string;
  description: string;
  citation?: Citation;
  /** Field definitions — drives schema validation, CSV templates, UI forms. */
  fields: FieldDef[];
  /** Node definitions — each references fields via `template`. */
  nodes: NodeDef[];
  /** Edges between nodes. */
  edges: EdgeDef[];
  /** Named sections that group nodes visually. */
  sections?: SectionDef[];
  /** Grid specification. */
  grid: GridSpec;
  /** Flow-accounting invariants checked at validate time. */
  invariants?: Invariant[];
}

export interface Citation {
  text: string;
  doi?: string;
  url?: string;
}

export interface FieldDef {
  key: string;
  type: "number" | "string" | "exclusion_reasons";
  label: string;
  description?: string;
  required?: boolean;
  default?: DataValue;
}

export interface NodeDef {
  id: string;
  kind: "box" | "exclusion" | "section-header";
  /** Position on the grid. */
  cell: { row: number; col: number; rowSpan?: number; colSpan?: number };
  /** Handlebars-lite template — supports `{{field}}` and `{{#each reasons}}…{{/each}}`. */
  template: string;
  /** Optional style override. */
  style?: Partial<NodeStyle>;
}

export interface NodeStyle {
  fill: string;
  stroke: string;
  textColor: string;
  fontSize: number;
  bold: boolean;
  dashed: boolean;
  rounded: boolean;
}

export interface EdgeDef {
  from: string;
  to: string;
  /** Attachment points: "n"|"s"|"e"|"w" or "auto". */
  fromPort?: Port;
  toPort?: Port;
  /** Arrow head at destination (default true). */
  arrow?: boolean;
  /** Optional label. */
  label?: string;
}

export type Port = "n" | "s" | "e" | "w" | "auto";

export interface SectionDef {
  id: string;
  label: string;
  /** Inclusive row range covered by this section. */
  rows: [number, number];
  /** Column where the section label is drawn (default 0). */
  labelCol?: number;
}

export interface GridSpec {
  cols: number;
  rows: number;
  colWidth: number;
  rowHeight: number;
  colGap: number;
  rowGap: number;
  padding: number;
  sectionLabelWidth: number;
}

export interface Invariant {
  id: string;
  description: string;
  /** A simple expression: sum of fields on LHS must equal sum on RHS. */
  lhs: string[];
  rhs: string[];
  severity?: "error" | "warning";
}

/* ----------------------- computed types (post-layout) ----------------------- */

export interface LaidOutNode {
  id: string;
  kind: NodeDef["kind"];
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;   // rendered template
  style: NodeStyle;
}

export interface LaidOutEdge {
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>; // Manhattan poly-line
  arrow: boolean;
  label?: string;
}

export interface LaidOutSection {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaidOutDiagram {
  width: number;
  height: number;
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  sections: LaidOutSection[];
  metadata?: DocumentMetadata;
  preset: { id: string; version: string };
}

/* --------------------------- validation results ---------------------------- */

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
