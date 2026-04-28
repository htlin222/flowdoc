import type {
  FlowDocument,
  Preset,
  LaidOutDiagram,
  LaidOutNode,
  LaidOutEdge,
  LaidOutSection,
  NodeDef,
  NodeStyle,
  Port,
} from "./types.js";
import { DEFAULT_STYLE, EXCLUSION_STYLE, SECTION_HEADER_STYLE, mergeStyle } from "./style.js";
import { render as renderTemplate } from "./template.js";
import { measureText, textBlockHeight, wrapText } from "./text.js";

const BOX_PADDING_X = 10;
const BOX_PADDING_Y = 8;

export function layout(doc: FlowDocument, preset: Preset): LaidOutDiagram {
  const data = doc.data;
  const grid = preset.grid;

  // 1. Render text for every node.
  interface Pre {
    def: NodeDef;
    text: string;
    style: NodeStyle;
    width: number;
    lines: string[];
    idealHeight: number;
  }
  const pre: Pre[] = preset.nodes.map((def) => {
    const text = renderTemplate(def.template, data);
    const style = nodeStyle(def);
    const colSpan = def.cell.colSpan ?? 1;
    const width = colSpan * grid.colWidth + (colSpan - 1) * grid.colGap;
    const innerW = width - 2 * BOX_PADDING_X;
    const lines = wrapText(text, innerW, style.fontSize);
    const idealHeight = textBlockHeight(Math.max(lines.length, 1), style.fontSize) + 2 * BOX_PADDING_Y;
    return { def, text, style, width, lines, idealHeight };
  });

  // 2. Compute per-row heights.
  const rowHeights = new Array<number>(grid.rows).fill(grid.rowHeight);
  for (const p of pre) {
    const rs = p.def.cell.rowSpan ?? 1;
    if (rs === 1) {
      const r = p.def.cell.row;
      if (rowHeights[r] === undefined) continue;
      rowHeights[r] = Math.max(rowHeights[r]!, p.idealHeight);
    }
  }
  // Second pass: distribute multi-row nodes' extra demand if any.
  for (const p of pre) {
    const rs = p.def.cell.rowSpan ?? 1;
    if (rs <= 1) continue;
    const span = rs;
    const current =
      (span - 1) * grid.rowGap +
      rowHeights.slice(p.def.cell.row, p.def.cell.row + span).reduce((a, b) => a + b, 0);
    if (p.idealHeight > current) {
      const extra = (p.idealHeight - current) / span;
      for (let i = 0; i < span; i++) {
        const ri = p.def.cell.row + i;
        rowHeights[ri] = (rowHeights[ri] ?? grid.rowHeight) + extra;
      }
    }
  }

  // 3. Column & row origins.
  const colX = new Array<number>(grid.cols).fill(0);
  for (let c = 0; c < grid.cols; c++) {
    colX[c] = grid.padding + grid.sectionLabelWidth + c * (grid.colWidth + grid.colGap);
  }
  const rowY = new Array<number>(grid.rows).fill(0);
  let y = grid.padding;
  for (let r = 0; r < grid.rows; r++) {
    rowY[r] = y;
    y += rowHeights[r]! + grid.rowGap;
  }
  const totalHeight = y - grid.rowGap + grid.padding;
  const totalWidth =
    grid.padding * 2 +
    grid.sectionLabelWidth +
    grid.cols * grid.colWidth +
    (grid.cols - 1) * grid.colGap;

  // 4. Place nodes.
  const nodes: LaidOutNode[] = pre.map((p) => {
    const rs = p.def.cell.rowSpan ?? 1;
    const x = colX[p.def.cell.col]!;
    const yPos = rowY[p.def.cell.row]!;
    const height =
      (rs - 1) * grid.rowGap +
      rowHeights.slice(p.def.cell.row, p.def.cell.row + rs).reduce((a, b) => a + b, 0);
    return {
      id: p.def.id,
      kind: p.def.kind,
      x,
      y: yPos,
      width: p.width,
      height,
      text: p.lines.join("\n"),
      style: p.style,
    };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // 5. Sections.
  const sections: LaidOutSection[] = (preset.sections ?? []).map((s) => {
    const [r0, r1] = s.rows;
    const yStart = rowY[r0] ?? grid.padding;
    const rEnd = Math.min(r1, grid.rows - 1);
    const yEnd = (rowY[rEnd] ?? grid.padding) + (rowHeights[rEnd] ?? grid.rowHeight);
    return {
      id: s.id,
      label: s.label,
      x: grid.padding,
      y: yStart,
      width: grid.sectionLabelWidth - 6,
      height: yEnd - yStart,
    };
  });

  // 6. Edges.
  const edges: LaidOutEdge[] = [];
  for (const ed of preset.edges) {
    const from = byId.get(ed.from);
    const to = byId.get(ed.to);
    if (!from || !to) continue;
    const points = routeEdge(from, to, ed.fromPort ?? "auto", ed.toPort ?? "auto");
    edges.push({
      from: ed.from,
      to: ed.to,
      points,
      arrow: ed.arrow !== false,
      ...(ed.label ? { label: ed.label } : {}),
    });
  }

  return {
    width: totalWidth,
    height: totalHeight,
    nodes,
    edges,
    sections,
    ...(doc.metadata ? { metadata: doc.metadata } : {}),
    preset: { id: preset.id, version: preset.version },
  };
}

function nodeStyle(def: NodeDef): NodeStyle {
  const base =
    def.kind === "exclusion"
      ? EXCLUSION_STYLE
      : def.kind === "section-header"
        ? SECTION_HEADER_STYLE
        : DEFAULT_STYLE;
  return mergeStyle(base, def.style);
}

/* --------------------------- Manhattan routing ----------------------------- */

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function routeEdge(
  from: Box,
  to: Box,
  fromPort: Port,
  toPort: Port,
): Array<{ x: number; y: number }> {
  const fp = resolvePort(from, to, fromPort, "from");
  const tp = resolvePort(to, from, toPort, "to");

  const a = anchor(from, fp);
  const b = anchor(to, tp);

  // Same column, vertical flow.
  if (fp === "s" && tp === "n" && Math.abs(a.x - b.x) < 1) {
    return [a, b];
  }

  // Horizontal between boxes in different columns (exclusion side-branch).
  if ((fp === "e" && tp === "w") || (fp === "w" && tp === "e")) {
    if (Math.abs(a.y - b.y) < 1) return [a, b];
    const midX = (a.x + b.x) / 2;
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
  }

  // Generic L-shape: exit vertical, horizontal to target column, enter vertical.
  if (fp === "s" && tp === "n") {
    // If the target's top edge spans the source's x (e.g. a wide colSpan
    // box like PRISMA's "Studies included in review"), drop a straight
    // vertical onto that edge directly above the source. This avoids
    // snaking the L-shape's horizontal segment through any node sitting
    // between the two rows.
    if (a.x >= to.x && a.x <= to.x + to.width) {
      return [a, { x: a.x, y: to.y }];
    }
    // Different columns: go south, then west/east, then south into target.
    const midY = (a.y + b.y) / 2;
    return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
  }
  if (fp === "s" && tp === "w") {
    return [a, { x: a.x, y: b.y }, b];
  }
  if (fp === "s" && tp === "e") {
    return [a, { x: a.x, y: b.y }, b];
  }
  if (fp === "e" && tp === "n") {
    return [a, { x: b.x, y: a.y }, b];
  }
  if (fp === "w" && tp === "n") {
    return [a, { x: b.x, y: a.y }, b];
  }
  // Fallback direct.
  return [a, b];
}

function resolvePort(self: Box, other: Box, hint: Port, role: "from" | "to"): Exclude<Port, "auto"> {
  if (hint !== "auto") return hint;
  const cx = self.x + self.width / 2;
  const cy = self.y + self.height / 2;
  const ox = other.x + other.width / 2;
  const oy = other.y + other.height / 2;
  const dx = ox - cx;
  const dy = oy - cy;
  // Prefer vertical if roughly aligned in x.
  if (Math.abs(dx) < self.width * 0.6) {
    if (role === "from") return dy > 0 ? "s" : "n";
    return dy > 0 ? "n" : "s";
  }
  if (role === "from") return dx > 0 ? "e" : "w";
  return dx > 0 ? "w" : "e";
}

function anchor(b: Box, p: Exclude<Port, "auto">): { x: number; y: number } {
  switch (p) {
    case "n":
      return { x: b.x + b.width / 2, y: b.y };
    case "s":
      return { x: b.x + b.width / 2, y: b.y + b.height };
    case "e":
      return { x: b.x + b.width, y: b.y + b.height / 2 };
    case "w":
      return { x: b.x, y: b.y + b.height / 2 };
  }
}
