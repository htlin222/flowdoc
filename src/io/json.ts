import type { FlowDocument } from "../core/types.js";

export function parseJson(src: string): FlowDocument {
  const obj = JSON.parse(src);
  if (!obj || typeof obj !== "object") throw new Error("JSON did not parse to an object.");
  return obj as FlowDocument;
}

export function stringifyJson(doc: FlowDocument): string {
  return JSON.stringify(doc, null, 2) + "\n";
}
