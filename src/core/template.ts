/**
 * Tiny handlebars-lite template engine.
 *
 * Supports:
 *   {{field}}                         — simple substitution
 *   {{#if field}}...{{/if}}           — conditional (truthy/non-zero)
 *   {{#each field}}...{{/each}}       — iterate over array; inside, {{.}}, {{reason}}, {{n}} available
 *   {{sum a b c}}                     — inline sum helper
 *   {{nlEach field "reason (n=n)"}}   — newline-joined each with inline template
 *
 * Intentionally small; we own the syntax so there are no escaping surprises.
 */
import type { DataValue, ExclusionReason } from "./types.js";

type Scope = Record<string, unknown>;

export function render(template: string, data: Record<string, DataValue>): string {
  return renderScope(template, data as Scope).replace(/\s+\n/g, "\n").trim();
}

function renderScope(tpl: string, scope: Scope): string {
  // Process block helpers first (each, if), innermost-out.
  let out = tpl;

  // Iteratively resolve all {{#each}} and {{#if}} blocks.
  const blockRe = /\{\{#(each|if)\s+([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/;
  for (let guard = 0; guard < 50; guard++) {
    const m = out.match(blockRe);
    if (!m) break;
    const [whole, kind, key, inner] = m;
    const value = lookup(scope, key!);
    let replacement = "";
    if (kind === "each") {
      if (Array.isArray(value)) {
        replacement = value
          .map((item) => {
            const childScope: Scope =
              typeof item === "object" && item !== null
                ? { ...scope, ...(item as Scope), ".": item }
                : { ...scope, ".": item };
            return renderScope(inner!, childScope);
          })
          .join("");
      }
    } else if (kind === "if") {
      if (truthy(value)) {
        replacement = renderScope(inner!, scope);
      }
    }
    out = out.replace(whole!, replacement);
  }

  // Inline helpers & substitutions.
  out = out.replace(/\{\{\s*(sum|nlEach|commaEach)\s+([^}]+?)\s*\}\}/g, (_m, helper, args) => {
    const argList = splitArgs(args);
    if (helper === "sum") {
      return sumArgs(argList, scope).toString();
    }
    if (helper === "nlEach" || helper === "commaEach") {
      return eachHelper(helper === "nlEach" ? "\n" : ", ", argList, scope);
    }
    return "";
  });

  // Simple {{field}} substitutions.
  out = out.replace(/\{\{\s*([^#/\s][^}]*?)\s*\}\}/g, (_m, key: string) => {
    const v = lookup(scope, key);
    if (v === undefined || v === null) return "";
    if (Array.isArray(v)) return v.length.toString();
    return String(v);
  });

  return out;
}

function lookup(scope: Scope, key: string): unknown {
  if (key === ".") return scope["."];
  const parts = key.split(".");
  let cur: unknown = scope;
  for (const p of parts) {
    if (cur && typeof cur === "object") {
      cur = (cur as Scope)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function truthy(v: unknown): boolean {
  if (v === undefined || v === null || v === false) return false;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function splitArgs(src: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inStr: string | null = null;
  for (const ch of src) {
    if (inStr) {
      if (ch === inStr) {
        out.push(cur);
        cur = "";
        inStr = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur.length) {
        out.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur.length) out.push(cur);
  return out;
}

function sumArgs(args: string[], scope: Scope): number {
  let total = 0;
  for (const a of args) {
    const v = lookup(scope, a);
    if (typeof v === "number") total += v;
    else if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) total += Number(v);
  }
  return total;
}

function eachHelper(sep: string, args: string[], scope: Scope): string {
  const [fieldKey, itemTpl] = args;
  if (!fieldKey || !itemTpl) return "";
  const arr = lookup(scope, fieldKey);
  if (!Array.isArray(arr)) return "";
  return (arr as ExclusionReason[])
    .map((item) => {
      const childScope: Scope =
        typeof item === "object" && item !== null
          ? { ...scope, ...(item as unknown as Scope) }
          : { ...scope, ".": item };
      return renderScope(itemTpl, childScope);
    })
    .join(sep);
}

/** Computed-field evaluation: simple arithmetic on field names + literals. */
export function evalExpression(expr: string, data: Record<string, DataValue>): number {
  const s = expr.trim();
  if (s === "") return 0;
  // Plain identifier fast path.
  if (/^\w+$/.test(s)) {
    const v = data[s];
    if (typeof v === "number") return v;
    if (Array.isArray(v)) {
      return (v as ExclusionReason[]).reduce((a, r) => a + (r?.n ?? 0), 0);
    }
    return 0;
  }
  // Tokenise into a sequence of (sign, term) pairs.
  // Accept leading sign; treat each `+` / `-` between terms as the next term's sign.
  const tokens = s.split(/\s*([+\-])\s*/);
  let total = 0;
  let sign = 1;
  let expectTerm = true;
  for (const tok of tokens) {
    if (tok === "") continue;
    if (tok === "+") {
      sign = expectTerm ? sign : 1;
      expectTerm = true;
      continue;
    }
    if (tok === "-") {
      sign = expectTerm ? -sign : -1;
      expectTerm = true;
      continue;
    }
    total += sign * resolveTerm(tok, data);
    sign = 1;
    expectTerm = false;
  }
  return total;
}

function resolveTerm(term: string, data: Record<string, DataValue>): number {
  const t = term.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^sum\(([^)]+)\)$/.test(t)) {
    const inner = t.slice(4, -1).split(",").map((x) => x.trim());
    return inner.reduce((a, k) => a + resolveTerm(k, data), 0);
  }
  const v = data[t];
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.reduce((a, r) => a + ((r as ExclusionReason).n ?? 0), 0);
  return 0;
}
