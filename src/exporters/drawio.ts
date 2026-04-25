/**
 * drawio / diagrams.net exporter.
 *
 * Produces an `.drawio` (mxfile) XML document that opens natively in
 * app.diagrams.net, VS Code drawio extension, and the drawio desktop app.
 *
 * The layout coordinates are taken straight from our laid-out diagram so
 * users can open the file and immediately tweak without re-running a layout.
 */

import type { LaidOutDiagram, LaidOutNode } from "../core/types.js";

export function toDrawio(d: LaidOutDiagram): string {
  const created = new Date().toISOString();

  const cells: string[] = [];
  cells.push(`<mxCell id="0"/>`);
  cells.push(`<mxCell id="1" parent="0"/>`);

  // Section background rectangles.
  let sid = 2;
  for (const s of d.sections) {
    cells.push(
      `<mxCell id="s${sid}" value="${xml(s.label)}" ` +
        `style="shape=rect;fillColor=#f3f6fb;strokeColor=none;fontSize=13;fontStyle=1;fontColor=#37475a;verticalAlign=middle;horizontal=0;" ` +
        `vertex="1" parent="1">` +
        `<mxGeometry x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" as="geometry"/>` +
        `</mxCell>`,
    );
    sid++;
  }

  // Nodes.
  const idMap = new Map<string, string>();
  for (const n of d.nodes) {
    const cellId = `n_${safeId(n.id)}`;
    idMap.set(n.id, cellId);
    cells.push(nodeCell(cellId, n));
  }

  // Edges.
  let eid = 0;
  for (const e of d.edges) {
    const src = idMap.get(e.from);
    const tgt = idMap.get(e.to);
    if (!src || !tgt) continue;
    const style =
      "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=" +
      (e.arrow ? "classic" : "none") +
      ";endFill=1;strokeColor=#222222;strokeWidth=1.3;";
    cells.push(
      `<mxCell id="e${eid}" style="${style}" edge="1" source="${src}" target="${tgt}" parent="1">` +
        `<mxGeometry relative="1" as="geometry"/>` +
        `</mxCell>`,
    );
    eid++;
  }

  const w = d.width;
  const h = d.height;
  const model =
    `<mxGraphModel dx="${w}" dy="${h}" grid="1" gridSize="10" guides="1" ` +
    `tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" ` +
    `pageWidth="${w}" pageHeight="${h}" math="0" shadow="0">` +
    `<root>${cells.join("")}</root></mxGraphModel>`;

  const diagram = `<diagram id="flowdoc-main" name="Flow Diagram">${encodeDrawio(model)}</diagram>`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<mxfile host="flowdoc" modified="${created}" agent="FlowDoc" version="1.0">` +
    diagram +
    `</mxfile>\n`
  );
}

function nodeCell(id: string, n: LaidOutNode): string {
  const s = n.style;
  const rx = s.rounded ? ";rounded=1" : ";rounded=0";
  const dashed = s.dashed ? ";dashed=1" : "";
  const bold = s.bold ? ";fontStyle=1" : "";
  const style =
    `shape=rect${rx}${dashed}${bold};whiteSpace=wrap;html=1;` +
    `fillColor=${s.fill};strokeColor=${s.stroke};fontColor=${s.textColor};fontSize=${s.fontSize};` +
    `verticalAlign=middle;align=center;`;

  // drawio uses <br> for newlines and auto-wraps, so we swap \n -> <br> and XML-escape the rest.
  const value = xmlNewlineToBr(n.text);

  return (
    `<mxCell id="${id}" value="${value}" style="${style}" vertex="1" parent="1">` +
    `<mxGeometry x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" as="geometry"/>` +
    `</mxCell>`
  );
}

function safeId(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, "_");
}

function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlNewlineToBr(s: string): string {
  return xml(s).replace(/\n/g, "&#10;");
}

// Newer drawio accepts uncompressed inline mxGraphModel inside <diagram>;
// we use that path so the file stays diff-friendly and round-trippable.
function encodeDrawio(model: string): string {
  return model;
}
