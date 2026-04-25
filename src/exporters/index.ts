import type { LaidOutDiagram } from "../core/types.js";
import { renderSvg, type SvgOptions } from "../core/render.js";
import { toDrawio } from "./drawio.js";
import { toMermaid } from "./mermaid.js";
import { toPdf, type PdfOptions } from "./pdf.js";
import { toPng, type PngOptions } from "./png.js";

export type ExportFormat = "svg" | "drawio" | "mermaid" | "pdf" | "png";

/** Export formats whose output is a binary buffer rather than text. */
export const BINARY_FORMATS = new Set<ExportFormat>(["pdf", "png"]);

export function isBinaryFormat(format: ExportFormat): boolean {
  return BINARY_FORMATS.has(format);
}

export interface ExportOptions {
  svg?: SvgOptions;
  pdf?: PdfOptions;
  png?: PngOptions;
}

export function exportDiagram(
  d: LaidOutDiagram,
  format: ExportFormat,
  opts: ExportOptions = {},
): string | Uint8Array {
  switch (format) {
    case "svg":
      return renderSvg(d, opts.svg);
    case "drawio":
      return toDrawio(d);
    case "mermaid":
      return toMermaid(d);
    case "pdf":
      return toPdf(d, opts.pdf);
    case "png":
      return toPng(d, opts.png);
  }
}

export { toDrawio } from "./drawio.js";
export { toMermaid } from "./mermaid.js";
export { toPdf, type PdfOptions } from "./pdf.js";
export { toPng, type PngOptions } from "./png.js";
