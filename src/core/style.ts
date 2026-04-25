import type { NodeStyle } from "./types.js";

export const DEFAULT_STYLE: NodeStyle = {
  fill: "#ffffff",
  stroke: "#222222",
  textColor: "#1a1a1a",
  fontSize: 12,
  bold: false,
  dashed: false,
  rounded: false,
};

export const EXCLUSION_STYLE: NodeStyle = {
  ...DEFAULT_STYLE,
  fill: "#fafafa",
  dashed: false,
};

export const SECTION_HEADER_STYLE: NodeStyle = {
  ...DEFAULT_STYLE,
  fill: "#e8eef5",
  bold: true,
  fontSize: 13,
};

export function mergeStyle(base: NodeStyle, override?: Partial<NodeStyle>): NodeStyle {
  if (!override) return base;
  return { ...base, ...override };
}
