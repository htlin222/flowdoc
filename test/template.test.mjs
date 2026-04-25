import { test } from "node:test";
import assert from "node:assert/strict";
import { render, evalExpression } from "../dist/core/template.js";

test("simple substitution", () => {
  assert.equal(render("n = {{x}}", { x: 5 }), "n = 5");
});

test("missing field becomes empty", () => {
  assert.equal(render("n = {{missing}}", {}), "n =");
});

test("each iterates with object scope", () => {
  const out = render(
    "{{#each items}}{{reason}}={{n}}\n{{/each}}",
    { items: [{ reason: "A", n: 1 }, { reason: "B", n: 2 }] },
  );
  assert.equal(out, "A=1\nB=2");
});

test("if hides block when value is zero", () => {
  assert.equal(render("{{#if x}}yes{{/if}}", { x: 0 }), "");
});

test("if shows block when value is truthy", () => {
  assert.equal(render("{{#if x}}yes{{/if}}", { x: 5 }), "yes");
});

test("if hides block when array is empty", () => {
  assert.equal(render("{{#if items}}has{{/if}}", { items: [] }), "");
});

test("evalExpression: plain identifier", () => {
  assert.equal(evalExpression("x", { x: 42 }), 42);
});

test("evalExpression: addition", () => {
  assert.equal(evalExpression("a + b", { a: 3, b: 4 }), 7);
});

test("evalExpression: subtraction with negative leading sign", () => {
  assert.equal(evalExpression("-a + b", { a: 3, b: 10 }), 7);
});

test("evalExpression: array sums n values", () => {
  assert.equal(
    evalExpression("reasons", { reasons: [{ reason: "x", n: 5 }, { reason: "y", n: 3 }] }),
    8,
  );
});

test("evalExpression: missing field is 0", () => {
  assert.equal(evalExpression("missing", {}), 0);
});

test("evalExpression: complex sum and difference", () => {
  assert.equal(
    evalExpression("a + b - c - d", { a: 100, b: 50, c: 30, d: 20 }),
    100,
  );
});
