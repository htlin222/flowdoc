import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseYaml,
  stringifyYaml,
  parseJson,
  stringifyJson,
  parseCsv,
  stringifyCsv,
} from "../dist/io/index.js";

const sampleDoc = {
  preset: "prisma-2020",
  metadata: {
    title: "Test review",
    authors: ["A", "B"],
    doi: "10.x/y",
  },
  data: {
    db_records: 100,
    registry_records: 10,
    duplicates_removed: 5,
    automation_excluded: 0,
    other_prescreen_removed: 0,
    websites_records: 1,
    organisations_records: 0,
    citation_records: 2,
    records_screened: 105,
    records_excluded: 70,
    reports_sought: 35,
    reports_not_retrieved: 1,
    reports_other_sought: 3,
    reports_other_not_retrieved: 0,
    reports_assessed: 34,
    reports_other_assessed: 3,
    exclusion_reasons: [
      { reason: "Wrong outcome", n: 5 },
      { reason: "Wrong design", n: 3 },
    ],
    exclusion_reasons_other: [{ reason: "Duplicate", n: 1 }],
    studies_included: 28,
    reports_of_included_studies: 28,
  },
};

test("YAML roundtrip preserves data", () => {
  const yaml = stringifyYaml(sampleDoc);
  const back = parseYaml(yaml);
  assert.deepEqual(back, sampleDoc);
});

test("JSON roundtrip preserves data", () => {
  const json = stringifyJson(sampleDoc);
  const back = parseJson(json);
  assert.deepEqual(back, sampleDoc);
});

test("CSV roundtrip preserves data", () => {
  const csv = stringifyCsv(sampleDoc);
  const back = parseCsv(csv);
  assert.equal(back.preset, sampleDoc.preset);
  assert.equal(back.metadata?.title, sampleDoc.metadata?.title);
  assert.deepEqual(back.metadata?.authors, sampleDoc.metadata?.authors);
  for (const [k, v] of Object.entries(sampleDoc.data)) {
    assert.deepEqual(back.data[k], v, `field ${k}`);
  }
});

test("CSV parser rejects malformed header", () => {
  assert.throws(() => parseCsv("foo,bar\nx,1\n"), /header/);
});

test("CSV parser handles quoted fields with commas", () => {
  const csv = `field,value
$preset,prisma-2020
$title,"Hello, World"
db_records,5
`;
  const doc = parseCsv(csv);
  assert.equal(doc.metadata?.title, "Hello, World");
  assert.equal(doc.data.db_records, 5);
});

test("CSV parser handles escaped quotes", () => {
  const csv = `field,value
$preset,prisma-2020
$title,"She said ""hi"""
`;
  const doc = parseCsv(csv);
  assert.equal(doc.metadata?.title, 'She said "hi"');
});

test("CSV parser handles exclusion_reasons_other field by prefix", () => {
  const csv = `field,value
$preset,prisma-2020
exclusion_reasons,"A:1;B:2"
exclusion_reasons_other,"C:3"
`;
  const doc = parseCsv(csv);
  assert.deepEqual(doc.data.exclusion_reasons, [
    { reason: "A", n: 1 },
    { reason: "B", n: 2 },
  ]);
  assert.deepEqual(doc.data.exclusion_reasons_other, [{ reason: "C", n: 3 }]);
});
