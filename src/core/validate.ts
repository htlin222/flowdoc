import type {
  FlowDocument,
  Preset,
  ValidationResult,
  ValidationIssue,
  ExclusionReason,
  DataValue,
} from "./types.js";
import { evalExpression } from "./template.js";

export function validate(doc: FlowDocument, preset: Preset): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!doc || typeof doc !== "object") {
    return { valid: false, issues: [err("E_NOT_OBJECT", "Document must be an object.")] };
  }
  if (doc.preset !== preset.id) {
    issues.push(err("E_PRESET_MISMATCH", `Document preset "${doc.preset}" does not match preset "${preset.id}".`, "/preset"));
  }

  const data = doc.data ?? {};
  if (!data || typeof data !== "object") {
    return { valid: false, issues: [err("E_DATA_MISSING", "Document.data is required.", "/data")] };
  }

  // Schema validation.
  for (const field of preset.fields) {
    const raw = data[field.key];
    const present = raw !== undefined && raw !== null;
    if (field.required && !present) {
      issues.push(err("E_REQUIRED", `Field "${field.key}" is required.`, `/data/${field.key}`));
      continue;
    }
    if (!present) continue;
    if (!checkType(raw, field.type)) {
      issues.push(
        err(
          "E_TYPE",
          `Field "${field.key}" expected ${field.type}, got ${describe(raw)}.`,
          `/data/${field.key}`,
        ),
      );
    }
    if (field.type === "number" && typeof raw === "number" && raw < 0) {
      issues.push(warn("W_NEGATIVE", `Field "${field.key}" is negative (${raw}).`, `/data/${field.key}`));
    }
  }

  // Unknown fields.
  const known = new Set(preset.fields.map((f) => f.key));
  for (const k of Object.keys(data)) {
    if (!known.has(k)) {
      issues.push(warn("W_UNKNOWN_FIELD", `Unknown field "${k}" (ignored).`, `/data/${k}`));
    }
  }

  // Flow accounting invariants.
  if (preset.invariants) {
    for (const inv of preset.invariants) {
      const lhs = inv.lhs.reduce((a, e) => a + evalExpression(e, data), 0);
      const rhs = inv.rhs.reduce((a, e) => a + evalExpression(e, data), 0);
      if (lhs !== rhs) {
        const severity = inv.severity ?? "warning";
        const msg = `${inv.description} (expected ${inv.lhs.join(" + ")} = ${inv.rhs.join(" + ")}, got ${lhs} vs ${rhs}).`;
        issues.push(severity === "error" ? err(`E_INV_${inv.id}`, msg) : warn(`W_INV_${inv.id}`, msg));
      }
    }
  }

  const valid = !issues.some((i) => i.severity === "error");
  return { valid, issues };
}

function checkType(v: DataValue, t: "number" | "string" | "exclusion_reasons"): boolean {
  if (t === "number") return typeof v === "number" && Number.isFinite(v);
  if (t === "string") return typeof v === "string";
  if (t === "exclusion_reasons") {
    return (
      Array.isArray(v) &&
      v.every(
        (x) =>
          x !== null &&
          typeof x === "object" &&
          typeof (x as ExclusionReason).reason === "string" &&
          typeof (x as ExclusionReason).n === "number",
      )
    );
  }
  return false;
}

function describe(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function err(code: string, message: string, path?: string): ValidationIssue {
  return { severity: "error", code, message, ...(path ? { path } : {}) };
}
function warn(code: string, message: string, path?: string): ValidationIssue {
  return { severity: "warning", code, message, ...(path ? { path } : {}) };
}
