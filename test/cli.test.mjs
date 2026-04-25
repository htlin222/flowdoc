import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = new URL("../bin/flowdoc.mjs", import.meta.url).pathname;
const example = new URL("../examples/prisma-review.yaml", import.meta.url).pathname;

function run(args, opts = {}) {
  return execFileSync("node", [cli, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

test("CLI: --version", () => {
  const out = run(["--version"]);
  assert.match(out, /flowdoc v/);
});

test("CLI: presets list includes prisma-2020", () => {
  const out = run(["presets", "list"]);
  assert.match(out, /prisma-2020/);
});

test("CLI: validate succeeds on example", () => {
  // Should exit 0; output goes to stderr.
  run(["validate", example]);
});

test("CLI: render produces SVG file", () => {
  const dir = mkdtempSync(join(tmpdir(), "flowdoc-"));
  const out = join(dir, "out.svg");
  run(["render", example, "-o", out, "--generated-at", "2026-04-25T00:00:00Z"]);
  assert.ok(existsSync(out));
  const svg = readFileSync(out, "utf8");
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /<\/svg>$/);
});

test("CLI: export drawio produces XML file", () => {
  const dir = mkdtempSync(join(tmpdir(), "flowdoc-"));
  const out = join(dir, "out.drawio");
  run(["export", example, "--format", "drawio", "-o", out]);
  const x = readFileSync(out, "utf8");
  assert.match(x, /<mxfile/);
});

test("CLI: export mermaid produces flowchart file", () => {
  const dir = mkdtempSync(join(tmpdir(), "flowdoc-"));
  const out = join(dir, "out.mmd");
  run(["export", example, "--format", "mermaid", "-o", out]);
  const m = readFileSync(out, "utf8");
  assert.match(m, /^flowchart TB/);
});

test("CLI: convert YAML → CSV → YAML preserves data", () => {
  const dir = mkdtempSync(join(tmpdir(), "flowdoc-"));
  const csv = join(dir, "doc.csv");
  const yaml2 = join(dir, "doc2.yaml");
  run(["convert", example, "-o", csv]);
  run(["convert", csv, "-o", yaml2]);
  // Render both, compare modulo timestamp.
  const svgA = join(dir, "a.svg");
  const svgB = join(dir, "b.svg");
  run(["render", example, "-o", svgA, "--generated-at", "T"]);
  run(["render", yaml2, "-o", svgB, "--generated-at", "T"]);
  assert.equal(readFileSync(svgA, "utf8"), readFileSync(svgB, "utf8"));
});

test("CLI: init writes blank YAML template", () => {
  const dir = mkdtempSync(join(tmpdir(), "flowdoc-"));
  const out = join(dir, "blank.yaml");
  run(["init", "--preset", "prisma-2020", "-o", out]);
  const text = readFileSync(out, "utf8");
  assert.match(text, /preset: prisma-2020/);
});

test("CLI: validate fails on bad data", () => {
  const dir = mkdtempSync(join(tmpdir(), "flowdoc-"));
  const bad = join(dir, "bad.yaml");
  writeFileSync(
    bad,
    `preset: prisma-2020\ndata:\n  db_records: not-a-number\n`,
    "utf8",
  );
  let failed = false;
  try {
    run(["validate", bad], { stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    failed = true;
  }
  assert.equal(failed, true);
});
