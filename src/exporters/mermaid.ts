/**
 * Mermaid flowchart exporter.
 *
 * Mermaid's auto-layout is not ideal for PRISMA-style left/right-parallel
 * flows, but Mermaid is rendered natively in GitHub, GitLab, Obsidian, and
 * Notion. We emit a `flowchart TB` (top-to-bottom) and use `subgraph` blocks
 * to approximate the section bands. Where the rendered result diverges from
 * the SVG output, SVG remains the source of truth for publication.
 */

import type { LaidOutDiagram, LaidOutNode } from "../core/types.js";

export function toMermaid(d: LaidOutDiagram): string {
  const lines: string[] = [];
  lines.push("flowchart TB");
  lines.push("  classDef exclusion fill:#fafafa,stroke:#666,color:#1a1a1a;");
  lines.push("  classDef included fill:#eaf1ff,stroke:#333,color:#1a1a1a,font-weight:bold;");

  const nodeById = new Map<string, LaidOutNode>();
  for (const n of d.nodes) nodeById.set(n.id, n);

  // Group node ids by section row-range for subgraphs.
  const sectionOf = new Map<string, string>();
  if (d.sections.length) {
    for (const n of d.nodes) {
      const ns = d.sections.find((s) => n.y >= s.y && n.y < s.y + s.height);
      if (ns) sectionOf.set(n.id, ns.id);
    }
  }

  const bySection = new Map<string, string[]>();
  for (const [nid, sid] of sectionOf) {
    const arr = bySection.get(sid) ?? [];
    arr.push(nid);
    bySection.set(sid, arr);
  }

  for (const s of d.sections) {
    const ids = bySection.get(s.id) ?? [];
    if (ids.length === 0) continue;
    lines.push(`  subgraph ${safe(s.id)}["${escape(s.label)}"]`);
    for (const nid of ids) {
      const n = nodeById.get(nid);
      if (n) lines.push("    " + nodeLine(n));
    }
    lines.push("  end");
  }

  // Any nodes not in a section.
  for (const n of d.nodes) {
    if (!sectionOf.has(n.id)) lines.push("  " + nodeLine(n));
  }

  // Edges.
  for (const e of d.edges) {
    const arrow = e.arrow ? "-->" : "---";
    const label = e.label ? `|${escape(e.label)}|` : "";
    lines.push(`  ${safe(e.from)} ${arrow}${label} ${safe(e.to)}`);
  }

  // Class assignments.
  for (const n of d.nodes) {
    if (n.kind === "exclusion") lines.push(`  class ${safe(n.id)} exclusion;`);
    if (n.id === "included") lines.push(`  class ${safe(n.id)} included;`);
  }

  return lines.join("\n") + "\n";
}

function nodeLine(n: LaidOutNode): string {
  const text = escape(n.text.replace(/\n/g, "<br/>"));
  return `${safe(n.id)}["${text}"]`;
}

function safe(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, "_");
}

function escape(s: string): string {
  // Mermaid doesn't love double quotes inside "…" labels; swap to Unicode left/right quotes.
  return s.replace(/"/g, "\u201d");
}
