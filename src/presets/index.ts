import type { FlowDocument, Preset } from "../core/types.js";
import { stringifyYaml } from "../io/yaml.js";
import prisma2020 from "./prisma-2020/index.js";
import prisma2020DbOnly from "./prisma-2020-db-only/index.js";
import consort2010 from "./consort-2010/index.js";
import strobe from "./strobe/index.js";

const registry = new Map<string, Preset>();
registry.set(prisma2020.id, prisma2020);
registry.set(prisma2020DbOnly.id, prisma2020DbOnly);
registry.set(consort2010.id, consort2010);
registry.set(strobe.id, strobe);

export function listPresets(): Preset[] {
  return [...registry.values()];
}

export function getPreset(id: string): Preset {
  const p = registry.get(id);
  if (!p) throw new Error(`Unknown preset "${id}". Available: ${[...registry.keys()].join(", ")}.`);
  return p;
}

export function registerPreset(p: Preset): void {
  registry.set(p.id, p);
}

/** Build a blank FlowDocument filled with preset defaults. */
export function blankDocument(presetId: string): FlowDocument {
  const p = getPreset(presetId);
  const doc: FlowDocument = {
    $schema: "https://flowdoc.dev/schema/v1",
    preset: p.id,
    metadata: {
      title: "",
      authors: [],
      date: new Date().toISOString().slice(0, 10),
    },
    data: {},
  };
  for (const f of p.fields) {
    if (f.default !== undefined) doc.data[f.key] = f.default;
  }
  return doc;
}

export function blankDocumentYaml(presetId: string): string {
  return stringifyYaml(blankDocument(presetId));
}

export { prisma2020, prisma2020DbOnly, consort2010, strobe };
