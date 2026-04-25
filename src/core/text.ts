/**
 * Deterministic text wrapping.
 *
 * SVG has no portable measureText API server-side, so we use a character-width
 * model calibrated for sans-serif fonts. Good enough for layout; SVG renderer
 * uses the same numbers so labels never overflow their computed boxes.
 */

// Average advance width relative to font-size for common sans-serif fonts.
// Calibrated against DejaVu Sans / Arial measurements.
const AVG_ADVANCE = 0.56;

export function charWidth(fontSize: number): number {
  return fontSize * AVG_ADVANCE;
}

/** Width of a string in pixels at the given font size. */
export function measureText(text: string, fontSize: number): number {
  // Crude but deterministic: CJK chars ~= 1 em, ASCII ~= 0.56 em.
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (isWide(code)) w += fontSize;
    else w += fontSize * AVG_ADVANCE;
  }
  return w;
}

function isWide(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x20000 && cp <= 0x2fffd) ||
    (cp >= 0x30000 && cp <= 0x3fffd)
  );
}

/**
 * Wrap text into lines that fit in maxWidth. Respects explicit "\n" as hard break.
 * Greedy word-based for ASCII; for CJK, falls back to per-character wrapping when
 * no whitespace is found in a run.
 */
export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const hardLines = text.split("\n");
  const out: string[] = [];
  for (const hard of hardLines) {
    if (hard === "") {
      out.push("");
      continue;
    }
    const pieces = softWrap(hard, maxWidth, fontSize);
    out.push(...pieces);
  }
  return out;
}

function softWrap(line: string, maxWidth: number, fontSize: number): string[] {
  if (measureText(line, fontSize) <= maxWidth) return [line];

  const words = line.split(/(\s+)/); // keep whitespace tokens
  const lines: string[] = [];
  let cur = "";

  for (const w of words) {
    if (!w) continue;
    const tentative = cur + w;
    if (measureText(tentative, fontSize) <= maxWidth) {
      cur = tentative;
    } else {
      if (cur.trim().length) lines.push(cur.trimEnd());
      // token longer than line → break it character-wise
      if (measureText(w, fontSize) > maxWidth) {
        let chunk = "";
        for (const ch of w) {
          if (measureText(chunk + ch, fontSize) > maxWidth && chunk.length) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        cur = chunk;
      } else {
        cur = w.trimStart();
      }
    }
  }
  if (cur.trim().length) lines.push(cur.trimEnd());
  return lines;
}

export function textBlockHeight(lines: number, fontSize: number, lineHeight = 1.25): number {
  return Math.ceil(lines * fontSize * lineHeight);
}
