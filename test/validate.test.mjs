import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, getPreset, blankDocument } from "../dist/index.js";

test("blank document is valid (only warnings allowed)", () => {
  const doc = blankDocument("prisma-2020");
  const preset = getPreset("prisma-2020");
  // Required fields have defaults of 0, so structurally valid even if all-zeros.
  const r = validate(doc, preset);
  assert.equal(r.valid, true);
});

test("type mismatch raises error", () => {
  const preset = getPreset("prisma-2020");
  const doc = {
    preset: "prisma-2020",
    data: { db_records: "not a number" },
  };
  const r = validate(doc, preset);
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "E_TYPE"));
});

test("preset id mismatch raises error", () => {
  const preset = getPreset("prisma-2020");
  const r = validate({ preset: "wrong", data: {} }, preset);
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "E_PRESET_MISMATCH"));
});

test("unknown field raises warning, not error", () => {
  const preset = getPreset("prisma-2020");
  const r = validate(
    {
      preset: "prisma-2020",
      data: {
        db_records: 0,
        records_screened: 0,
        studies_included: 0,
        foo_bar: 1,
      },
    },
    preset,
  );
  assert.equal(r.valid, true, JSON.stringify(r.issues));
  assert.ok(r.issues.some((i) => i.code === "W_UNKNOWN_FIELD"));
});

test("flow accounting invariant fires when imbalanced", () => {
  const preset = getPreset("prisma-2020");
  const r = validate(
    {
      preset: "prisma-2020",
      data: {
        db_records: 100,
        registry_records: 0,
        duplicates_removed: 0,
        automation_excluded: 0,
        other_prescreen_removed: 0,
        records_screened: 999, // Should be 100 — wildly imbalanced.
        records_excluded: 0,
        reports_sought: 0,
        reports_not_retrieved: 0,
        reports_assessed: 0,
        reports_other_sought: 0,
        reports_other_not_retrieved: 0,
        reports_other_assessed: 0,
        studies_included: 0,
        reports_of_included_studies: 0,
        exclusion_reasons: [],
        exclusion_reasons_other: [],
      },
    },
    preset,
  );
  assert.ok(r.issues.some((i) => i.code === "W_INV_SCREEN_IN"));
});

test("flow accounting passes for self-consistent data", () => {
  const preset = getPreset("prisma-2020");
  const r = validate(
    {
      preset: "prisma-2020",
      data: {
        db_records: 100,
        registry_records: 0,
        duplicates_removed: 5,
        automation_excluded: 0,
        other_prescreen_removed: 0,
        records_screened: 95,
        records_excluded: 60,
        reports_sought: 35,
        reports_not_retrieved: 0,
        reports_assessed: 35,
        reports_other_sought: 0,
        reports_other_not_retrieved: 0,
        reports_other_assessed: 0,
        studies_included: 25,
        reports_of_included_studies: 25,
        exclusion_reasons: [{ reason: "Wrong design", n: 10 }],
        exclusion_reasons_other: [],
      },
    },
    preset,
  );
  assert.equal(r.valid, true, JSON.stringify(r.issues, null, 2));
  assert.equal(r.issues.length, 0, JSON.stringify(r.issues, null, 2));
});
