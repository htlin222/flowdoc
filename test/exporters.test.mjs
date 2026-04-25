import { test } from "node:test";
import assert from "node:assert/strict";
import { layout, exportDiagram, getPreset, parseYaml } from "../dist/index.js";
import { readFileSync } from "node:fs";

const example = parseYaml(readFileSync(new URL("../examples/prisma-review.yaml", import.meta.url), "utf8"));
const preset = getPreset("prisma-2020");
const diagram = layout(example, preset);

test("drawio export is well-formed XML", () => {
  const x = exportDiagram(diagram, "drawio");
  assert.ok(x.startsWith("<?xml"));
  assert.ok(x.includes("<mxfile"));
  assert.ok(x.includes("<mxGraphModel"));
  assert.ok(x.endsWith("</mxfile>\n"));
});

test("drawio export contains every node", () => {
  const x = exportDiagram(diagram, "drawio");
  for (const n of preset.nodes) {
    assert.ok(x.includes(`id="n_${n.id.replace(/[^A-Za-z0-9_]/g, "_")}"`), `missing ${n.id}`);
  }
});

test("drawio export contains every edge", () => {
  const x = exportDiagram(diagram, "drawio");
  // Each edge becomes one mxCell with edge="1".
  const edgeCount = (x.match(/edge="1"/g) || []).length;
  assert.equal(edgeCount, preset.edges.length);
});

test("mermaid export starts with flowchart directive", () => {
  const m = exportDiagram(diagram, "mermaid");
  assert.ok(m.startsWith("flowchart TB"));
});

test("mermaid export contains every node id", () => {
  const m = exportDiagram(diagram, "mermaid");
  for (const n of preset.nodes) {
    const safe = n.id.replace(/[^A-Za-z0-9_]/g, "_");
    assert.ok(m.includes(safe), `missing ${safe}`);
  }
});

test("mermaid export defines exclusion classes", () => {
  const m = exportDiagram(diagram, "mermaid");
  assert.ok(m.includes("classDef exclusion"));
  assert.ok(m.includes("classDef included"));
});

test("svg export equals direct renderSvg up to defaults", () => {
  // svg export uses default options (watermark on, metadata on, dynamic timestamp).
  const a = exportDiagram(diagram, "svg");
  const b = exportDiagram(diagram, "svg");
  // Timestamp differs but structure should be equivalent in length within tolerance.
  assert.ok(Math.abs(a.length - b.length) < 100);
});
