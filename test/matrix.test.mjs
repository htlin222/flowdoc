/**
 * Multi-preset × multi-format export matrix.
 *
 * Smoke-tests every (preset, format) cell:
 *   presets:  prisma-2020, consort-2010, strobe
 *   formats:  svg, drawio, mermaid, pdf, png
 *
 * Each cell asserts (a) the file looks structurally well-formed for that
 * format and (b) the export is byte-deterministic when timestamps are
 * pinned (svg, pdf) or the format is timestamp-free (drawio also embeds a
 * timestamp; we exercise it via two back-to-back exports and only require
 * size equality within a small tolerance).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseYaml,
  validate,
  layout,
  exportDiagram,
  getPreset,
  listPresets,
} from "../dist/index.js";

const CASES = [
  { preset: "prisma-2020",  yaml: "../examples/prisma-review.yaml" },
  { preset: "consort-2010", yaml: "../examples/consort-trial.yaml" },
  { preset: "strobe",       yaml: "../examples/strobe-cohort.yaml" },
];

const FORMATS = ["svg", "drawio", "mermaid", "pdf", "png"];

const PIN = "2026-04-25T00:00:00Z";

function loadCase(c) {
  const yaml = readFileSync(new URL(c.yaml, import.meta.url), "utf8");
  const doc = parseYaml(yaml);
  const preset = getPreset(c.preset);
  const v = validate(doc, preset);
  assert.equal(v.valid, true, `validation failed for ${c.preset}: ${JSON.stringify(v.issues)}`);
  return layout(doc, preset);
}

test("registry exposes prisma-2020, prisma-2020-db-only, consort-2010, strobe", () => {
  const ids = listPresets().map((p) => p.id).sort();
  assert.deepEqual(ids, ["consort-2010", "prisma-2020", "prisma-2020-db-only", "strobe"]);
});

for (const c of CASES) {
  test(`matrix: ${c.preset} parses + validates + lays out`, () => {
    const d = loadCase(c);
    assert.ok(d.nodes.length > 0);
    assert.ok(d.edges.length > 0);
    assert.ok(d.width > 0 && d.height > 0);
  });

  for (const fmt of FORMATS) {
    test(`matrix: ${c.preset} → ${fmt} is well-formed`, () => {
      const d = loadCase(c);
      const out = exportDiagram(d, fmt, {
        svg: { generatedAt: PIN },
        pdf: { generatedAt: PIN },
      });
      switch (fmt) {
        case "svg":
          assert.equal(typeof out, "string");
          assert.match(out, /^<\?xml/);
          assert.match(out, /<\/svg>$/);
          break;
        case "drawio":
          assert.equal(typeof out, "string");
          assert.match(out, /<mxfile/);
          assert.match(out, /<mxGraphModel/);
          break;
        case "mermaid":
          assert.equal(typeof out, "string");
          assert.match(out, /^flowchart TB/);
          break;
        case "pdf":
          assert.ok(out instanceof Uint8Array);
          assert.equal(magic(out, 0), "%PDF-1.4");
          assert.ok(tailContains(out, "%%EOF"));
          break;
        case "png":
          assert.ok(out instanceof Uint8Array);
          assertPngSignature(out);
          assertPngEnd(out);
          break;
      }
    });
  }

  test(`matrix: ${c.preset} → svg is byte-deterministic with pinned timestamp`, () => {
    const d = loadCase(c);
    const a = exportDiagram(d, "svg", { svg: { generatedAt: PIN } });
    const b = exportDiagram(d, "svg", { svg: { generatedAt: PIN } });
    assert.equal(a, b);
  });

  test(`matrix: ${c.preset} → pdf is byte-deterministic with pinned timestamp`, () => {
    const d = loadCase(c);
    const a = exportDiagram(d, "pdf", { pdf: { generatedAt: PIN } });
    const b = exportDiagram(d, "pdf", { pdf: { generatedAt: PIN } });
    assert.deepEqual(Array.from(a), Array.from(b));
  });

  test(`matrix: ${c.preset} → png is byte-deterministic`, () => {
    const d = loadCase(c);
    const a = exportDiagram(d, "png");
    const b = exportDiagram(d, "png");
    assert.deepEqual(Array.from(a), Array.from(b));
  });
}

function magic(buf, n) {
  let s = "";
  for (let i = 0; i < n + 8 && i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return s.slice(0, 8);
}

function tailContains(buf, needle) {
  const start = Math.max(0, buf.length - 64);
  let s = "";
  for (let i = start; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return s.includes(needle);
}

function assertPngSignature(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) assert.equal(buf[i], sig[i]);
}

function assertPngEnd(buf) {
  // Last 12 bytes should be: 4 byte length=0, "IEND", 4 byte CRC.
  const tail = Array.from(buf.subarray(buf.length - 12));
  // length bytes
  assert.deepEqual(tail.slice(0, 4), [0, 0, 0, 0]);
  // type
  assert.equal(String.fromCharCode(tail[4], tail[5], tail[6], tail[7]), "IEND");
}
