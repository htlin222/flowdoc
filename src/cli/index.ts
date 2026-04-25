/**
 * FlowDoc CLI.
 *
 * Usage:
 *   flowdoc init [--preset ID] [--format yaml|json|csv] [-o FILE]
 *   flowdoc validate <FILE>
 *   flowdoc render <FILE> -o <OUT.svg> [--no-watermark] [--no-metadata]
 *   flowdoc export <FILE> --format svg|drawio|mermaid -o <OUT>
 *   flowdoc convert <IN> -o <OUT>              (format detected by extension)
 *   flowdoc presets [list|show ID]
 *   flowdoc --help
 *   flowdoc --version
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { layout } from "../core/layout.js";
import { validate } from "../core/validate.js";
import { renderSvg } from "../core/render.js";
import { exportDiagram, isBinaryFormat, type ExportFormat } from "../exporters/index.js";
import {
  parseDocument,
  stringifyDocument,
  detectFormat,
  type DocFormat,
} from "../io/index.js";
import {
  getPreset,
  listPresets,
  blankDocument,
} from "../presets/index.js";
import type { FlowDocument } from "../core/types.js";

const VERSION = "0.1.0";

export function main(argv: string[]): number {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return 0;
  }
  if (args[0] === "--version" || args[0] === "-v") {
    console.log(`flowdoc v${VERSION}`);
    return 0;
  }
  const cmd = args[0]!;
  const rest = args.slice(1);

  try {
    switch (cmd) {
      case "init":
        return cmdInit(rest);
      case "validate":
        return cmdValidate(rest);
      case "render":
        return cmdRender(rest);
      case "export":
        return cmdExport(rest);
      case "convert":
        return cmdConvert(rest);
      case "presets":
        return cmdPresets(rest);
      default:
        console.error(`Unknown command: ${cmd}`);
        printHelp();
        return 2;
    }
  } catch (e) {
    console.error(`error: ${(e as Error).message}`);
    return 1;
  }
}

/* --------------------------- commands --------------------------- */

function cmdInit(args: string[]): number {
  const presetId = takeOption(args, "--preset") ?? "prisma-2020";
  const fmt = (takeOption(args, "--format") ?? "yaml") as DocFormat;
  const out = takeOption(args, "-o") ?? takeOption(args, "--out");
  const doc = blankDocument(presetId);
  const text = stringifyDocument(doc, fmt);
  if (out) {
    writeFileSync(out, text, "utf8");
    console.error(`Wrote blank ${presetId} template → ${out}`);
  } else {
    process.stdout.write(text);
  }
  return 0;
}

function cmdValidate(args: string[]): number {
  const file = expectFile(args);
  const doc = readDoc(file);
  const preset = getPreset(doc.preset);
  const result = validate(doc, preset);
  for (const i of result.issues) {
    const prefix = i.severity === "error" ? "✗" : "!";
    const tag = i.path ? ` ${i.path}` : "";
    console.error(`${prefix} [${i.code}]${tag}: ${i.message}`);
  }
  if (result.valid) {
    console.error(
      `✓ ${basename(file)} is valid for preset "${preset.id}" (${result.issues.length} warning${
        result.issues.length === 1 ? "" : "s"
      }).`,
    );
    return 0;
  }
  return 1;
}

function cmdRender(args: string[]): number {
  const file = expectFile(args);
  const out = takeOption(args, "-o") ?? takeOption(args, "--out");
  if (!out) throw new Error("`render` requires -o <FILE.svg>.");
  const noWatermark = takeFlag(args, "--no-watermark");
  const noMetadata = takeFlag(args, "--no-metadata");
  const generatedAt = takeOption(args, "--generated-at");

  const doc = readDoc(file);
  const preset = getPreset(doc.preset);
  const v = validate(doc, preset);
  if (!v.valid) {
    for (const i of v.issues.filter((x) => x.severity === "error")) {
      console.error(`✗ [${i.code}]: ${i.message}`);
    }
    throw new Error("Document has validation errors; fix them or use --force (not yet implemented).");
  }
  for (const i of v.issues) {
    const prefix = i.severity === "error" ? "✗" : "!";
    console.error(`${prefix} [${i.code}]: ${i.message}`);
  }
  const d = layout(doc, preset);
  const svg = renderSvg(d, {
    watermark: !noWatermark,
    embedMetadata: !noMetadata,
    ...(generatedAt ? { generatedAt } : {}),
  });
  writeFileSync(out, svg, "utf8");
  console.error(`Rendered → ${out} (${d.width}×${d.height})`);
  return 0;
}

function cmdExport(args: string[]): number {
  const file = expectFile(args);
  const format = takeOption(args, "--format") as ExportFormat | undefined;
  const out = takeOption(args, "-o") ?? takeOption(args, "--out");
  const generatedAt = takeOption(args, "--generated-at");
  if (!format) {
    throw new Error("`export` requires --format svg|drawio|mermaid|pdf|png.");
  }
  if (!out) throw new Error("`export` requires -o <FILE>.");
  const doc = readDoc(file);
  const preset = getPreset(doc.preset);
  const v = validate(doc, preset);
  if (!v.valid) {
    for (const i of v.issues.filter((x) => x.severity === "error")) {
      console.error(`✗ [${i.code}]: ${i.message}`);
    }
    throw new Error("Document has validation errors.");
  }
  for (const i of v.issues) {
    if (i.severity === "warning") console.error(`! [${i.code}]: ${i.message}`);
  }
  const d = layout(doc, preset);
  const opts = generatedAt
    ? { svg: { generatedAt }, pdf: { generatedAt } }
    : {};
  const result = exportDiagram(d, format, opts);
  if (isBinaryFormat(format)) {
    writeFileSync(out, result as Uint8Array);
  } else {
    writeFileSync(out, result as string, "utf8");
  }
  console.error(`Exported ${format} → ${out}`);
  return 0;
}

function cmdConvert(args: string[]): number {
  const input = expectFile(args);
  const out = takeOption(args, "-o") ?? takeOption(args, "--out");
  if (!out) throw new Error("`convert` requires -o <OUT>.");
  const inFmt = detectFormat(input);
  const outFmt = detectFormat(out);
  const doc = parseDocument(readFileSync(input, "utf8"), inFmt);
  // Lightweight sanity: make sure preset is known.
  getPreset(doc.preset);
  writeFileSync(out, stringifyDocument(doc, outFmt), "utf8");
  console.error(`Converted ${inFmt} → ${outFmt}: ${out}`);
  return 0;
}

function cmdPresets(args: string[]): number {
  const sub = args[0] ?? "list";
  if (sub === "list") {
    for (const p of listPresets()) {
      console.log(`${p.id}@${p.version}\t${p.name}\t${p.description}`);
    }
    return 0;
  }
  if (sub === "show") {
    const id = args[1];
    if (!id) throw new Error("`presets show` requires a preset id.");
    const p = getPreset(id);
    console.log(JSON.stringify(p, null, 2));
    return 0;
  }
  throw new Error(`Unknown subcommand: presets ${sub}`);
}

/* --------------------------- helpers --------------------------- */

function readDoc(path: string): FlowDocument {
  const fmt = detectFormat(path);
  return parseDocument(readFileSync(path, "utf8"), fmt);
}

function expectFile(args: string[]): string {
  for (const a of args) {
    if (!a.startsWith("-")) return a;
  }
  throw new Error("Missing input file argument.");
}

function takeOption(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const val = args[i + 1];
  if (!val || val.startsWith("-")) {
    throw new Error(`Option ${name} requires a value.`);
  }
  args.splice(i, 2);
  return val;
}

function takeFlag(args: string[], name: string): boolean {
  const i = args.indexOf(name);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
}

function printHelp(): void {
  console.log(
    [
      "flowdoc — deterministic flow diagrams for reporting guidelines",
      "",
      "Usage:",
      "  flowdoc init [--preset ID] [--format yaml|json|csv] [-o FILE]",
      "  flowdoc validate <FILE>",
      "  flowdoc render <FILE> -o <OUT.svg> [--no-watermark] [--no-metadata]",
      "  flowdoc export <FILE> --format svg|drawio|mermaid|pdf|png -o <OUT>",
      "  flowdoc convert <IN> -o <OUT>    (format detected by extension)",
      "  flowdoc presets [list|show ID]",
      "  flowdoc --version",
      "",
      "Examples:",
      "  flowdoc init --preset prisma-2020 -o review.yaml",
      "  flowdoc validate review.yaml",
      "  flowdoc render review.yaml -o fig1.svg",
      "  flowdoc export review.yaml --format drawio -o fig1.drawio",
      "  flowdoc export review.yaml --format pdf -o fig1.pdf",
      "  flowdoc export review.yaml --format png -o fig1.png",
      "  flowdoc convert review.yaml -o review.csv",
    ].join("\n"),
  );
}
