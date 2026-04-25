import { parseYaml, stringifyYaml } from "./yaml.js";
import { parseJson, stringifyJson } from "./json.js";
import { parseCsv, stringifyCsv } from "./csv.js";
import type { FlowDocument } from "../core/types.js";

export type DocFormat = "yaml" | "json" | "csv";

export function detectFormat(filename: string): DocFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".csv") || lower.endsWith(".tsv")) return "csv";
  throw new Error(`Cannot detect format from filename "${filename}". Use .yaml/.yml/.json/.csv.`);
}

export function parseDocument(src: string, format: DocFormat): FlowDocument {
  switch (format) {
    case "yaml":
      return parseYaml(src);
    case "json":
      return parseJson(src);
    case "csv":
      return parseCsv(src);
  }
}

export function stringifyDocument(doc: FlowDocument, format: DocFormat): string {
  switch (format) {
    case "yaml":
      return stringifyYaml(doc);
    case "json":
      return stringifyJson(doc);
    case "csv":
      return stringifyCsv(doc);
  }
}

export { parseYaml, stringifyYaml } from "./yaml.js";
export { parseJson, stringifyJson } from "./json.js";
export { parseCsv, stringifyCsv } from "./csv.js";
