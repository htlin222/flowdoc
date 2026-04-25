import yaml from "js-yaml";
import type { FlowDocument } from "../core/types.js";

export function parseYaml(src: string): FlowDocument {
  const obj = yaml.load(src);
  if (!obj || typeof obj !== "object") throw new Error("YAML did not parse to an object.");
  return obj as FlowDocument;
}

export function stringifyYaml(doc: FlowDocument): string {
  return yaml.dump(doc, { lineWidth: 100, noRefs: true, sortKeys: false });
}
