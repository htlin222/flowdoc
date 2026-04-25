/**
 * CSV I/O for FlowDoc.
 *
 * The format is intentionally flat so non-coders can fill it in a spreadsheet:
 *
 *   field,value
 *   $preset,prisma-2020
 *   $title,"A systematic review of X on Y"
 *   $authors,"Lin W;Chen Y"
 *   $doi,10.xxxx/xxxx
 *   db_records,1240
 *   registry_records,82
 *   exclusion_reasons,"Wrong population:48;Wrong outcome:36"
 *
 *   - Fields starting with `$` are metadata: $preset, $title, $authors ($date, $doi, $language, $notes).
 *   - `exclusion_reasons` is serialised as "reason:n;reason:n;…".
 *   - Everything else lands in `data[field]` as a number (if numeric) or string.
 *
 * Roundtrips to/from YAML & JSON losslessly.
 */

import type { FlowDocument, ExclusionReason } from "../core/types.js";

const META_KEYS = new Set(["preset", "title", "authors", "doi", "date", "language", "notes"]);

export function parseCsv(src: string): FlowDocument {
  const rows = parseCsvRows(src);
  if (rows.length === 0) throw new Error("CSV is empty.");
  const header = rows[0]!.map((c) => c.trim().toLowerCase());
  if (header.length < 2 || header[0] !== "field" || header[1] !== "value") {
    throw new Error('CSV must have header row: "field,value".');
  }

  const doc: FlowDocument = { preset: "", data: {} };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.every((c) => c.trim() === "")) continue;
    const [rawKey, rawVal] = [row[0] ?? "", row[1] ?? ""];
    const key = rawKey.trim();
    const val = rawVal.trim();
    if (!key) continue;

    if (key.startsWith("$")) {
      const metaKey = key.slice(1).toLowerCase();
      if (!META_KEYS.has(metaKey)) throw new Error(`Unknown metadata key "${key}".`);
      if (metaKey === "preset") {
        doc.preset = val;
      } else {
        doc.metadata ??= {};
        if (metaKey === "authors") {
          doc.metadata.authors = splitList(val);
        } else {
          (doc.metadata as Record<string, unknown>)[metaKey] = val;
        }
      }
      continue;
    }

    if (key === "exclusion_reasons" || key.startsWith("exclusion_reasons_")) {
      doc.data[key] = parseExclusionList(val);
      continue;
    }

    // Plain data field.
    doc.data[key] = parseScalar(val);
  }

  if (!doc.preset) throw new Error('CSV must include a "$preset" row.');
  return doc;
}

export function stringifyCsv(doc: FlowDocument): string {
  const lines: string[] = ["field,value"];
  lines.push(`$preset,${csvField(doc.preset)}`);
  if (doc.metadata) {
    if (doc.metadata.title) lines.push(`$title,${csvField(doc.metadata.title)}`);
    if (doc.metadata.authors?.length) lines.push(`$authors,${csvField(doc.metadata.authors.join(";"))}`);
    if (doc.metadata.doi) lines.push(`$doi,${csvField(doc.metadata.doi)}`);
    if (doc.metadata.date) lines.push(`$date,${csvField(doc.metadata.date)}`);
    if (doc.metadata.language) lines.push(`$language,${csvField(doc.metadata.language)}`);
    if (doc.metadata.notes) lines.push(`$notes,${csvField(doc.metadata.notes)}`);
  }
  for (const [k, v] of Object.entries(doc.data)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      const ser = (v as ExclusionReason[]).map((r) => `${r.reason}:${r.n}`).join(";");
      lines.push(`${k},${csvField(ser)}`);
    } else {
      lines.push(`${k},${csvField(String(v))}`);
    }
  }
  return lines.join("\n") + "\n";
}

/* --------------------------- helpers --------------------------- */

function parseScalar(s: string): number | string {
  if (s === "") return 0;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function splitList(s: string): string[] {
  return s
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function parseExclusionList(s: string): ExclusionReason[] {
  if (!s) return [];
  return s
    .split(";")
    .map((chunk) => chunk.trim())
    .filter((c) => c.length > 0)
    .map((chunk) => {
      const idx = chunk.lastIndexOf(":");
      if (idx === -1) return { reason: chunk, n: 0 };
      const reason = chunk.slice(0, idx).trim();
      const n = Number(chunk.slice(idx + 1).trim());
      return { reason, n: Number.isFinite(n) ? n : 0 };
    });
}

function csvField(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** RFC 4180-ish CSV parser. Handles quoted fields and embedded newlines. */
export function parseCsvRows(src: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(cur);
      cur = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(cur);
      cur = "";
      rows.push(row);
      row = [];
      if (ch === "\r" && src[i + 1] === "\n") i += 2;
      else i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}
