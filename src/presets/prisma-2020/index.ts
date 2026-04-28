/**
 * PRISMA 2020 Flow Diagram preset.
 *
 * Follows: Page MJ et al. BMJ 2021;372:n71. https://doi.org/10.1136/bmj.n71
 * Structure reflects the official "new systematic reviews which included
 * searches of databases, registers and other sources" template.
 */

import type { Preset } from "../../core/types.js";

export const prisma2020: Preset = {
  id: "prisma-2020",
  version: "1.0.0",
  name: "PRISMA 2020",
  description:
    "PRISMA 2020 flow diagram for new systematic reviews with searches of databases, registers, and other sources.",
  citation: {
    text:
      "Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ 2021;372:n71.",
    doi: "10.1136/bmj.n71",
    url: "https://www.bmj.com/content/372/bmj.n71",
  },

  grid: {
    cols: 3,
    rows: 7,
    colWidth: 260,
    rowHeight: 70,
    colGap: 40,
    rowGap: 18,
    padding: 24,
    sectionLabelWidth: 40,
  },

  sections: [
    { id: "identification", label: "Identification", rows: [0, 1] },
    { id: "screening", label: "Screening", rows: [2, 5] },
    { id: "included", label: "Included", rows: [6, 6] },
  ],

  fields: [
    // Identification – databases & registers
    { key: "db_records", type: "number", label: "Records identified from databases", required: true, default: 0 },
    { key: "registry_records", type: "number", label: "Records identified from registers", default: 0 },

    { key: "duplicates_removed", type: "number", label: "Duplicate records removed", default: 0 },
    { key: "automation_excluded", type: "number", label: "Records marked as ineligible by automation tools", default: 0 },
    { key: "other_prescreen_removed", type: "number", label: "Records removed for other reasons", default: 0 },

    // Identification – other methods
    { key: "websites_records", type: "number", label: "Records from websites", default: 0 },
    { key: "organisations_records", type: "number", label: "Records from organisations", default: 0 },
    { key: "citation_records", type: "number", label: "Records from citation searching", default: 0 },

    // Screening
    { key: "records_screened", type: "number", label: "Records screened", required: true, default: 0 },
    { key: "records_excluded", type: "number", label: "Records excluded", default: 0 },

    { key: "reports_sought", type: "number", label: "Reports sought for retrieval (main)", default: 0 },
    { key: "reports_not_retrieved", type: "number", label: "Reports not retrieved (main)", default: 0 },

    { key: "reports_other_sought", type: "number", label: "Reports sought for retrieval (other methods)", default: 0 },
    { key: "reports_other_not_retrieved", type: "number", label: "Reports not retrieved (other methods)", default: 0 },

    { key: "reports_assessed", type: "number", label: "Reports assessed for eligibility (main)", default: 0 },
    { key: "reports_other_assessed", type: "number", label: "Reports assessed for eligibility (other methods)", default: 0 },

    { key: "exclusion_reasons", type: "exclusion_reasons", label: "Reports excluded with reasons (main)", default: [] },
    { key: "exclusion_reasons_other", type: "exclusion_reasons", label: "Reports excluded with reasons (other methods)", default: [] },

    // Included
    { key: "studies_included", type: "number", label: "Studies included in review", required: true, default: 0 },
    { key: "reports_of_included_studies", type: "number", label: "Reports of included studies", default: 0 },
  ],

  nodes: [
    // Row 0: Identification source boxes
    {
      id: "db_sources",
      kind: "box",
      cell: { row: 0, col: 0 },
      template:
        "Records identified from:\n" +
        "Databases (n = {{db_records}})\n" +
        "Registers (n = {{registry_records}})",
    },
    {
      id: "prescreen_removed",
      kind: "exclusion",
      cell: { row: 0, col: 1 },
      template:
        "Records removed before screening:\n" +
        "Duplicate records (n = {{duplicates_removed}})\n" +
        "Records marked as ineligible by automation tools (n = {{automation_excluded}})\n" +
        "Records removed for other reasons (n = {{other_prescreen_removed}})",
    },
    {
      id: "other_sources",
      kind: "box",
      cell: { row: 0, col: 2 },
      template:
        "Records identified from:\n" +
        "Websites (n = {{websites_records}})\n" +
        "Organisations (n = {{organisations_records}})\n" +
        "Citation searching (n = {{citation_records}})",
    },

    // Row 2: Screening
    {
      id: "records_screened",
      kind: "box",
      cell: { row: 2, col: 0 },
      template: "Records screened\n(n = {{records_screened}})",
    },
    {
      id: "records_excluded",
      kind: "exclusion",
      cell: { row: 2, col: 1 },
      template: "Records excluded\n(n = {{records_excluded}})",
    },

    // Row 3: Sought for retrieval
    {
      id: "reports_sought",
      kind: "box",
      cell: { row: 3, col: 0 },
      template: "Reports sought for retrieval\n(n = {{reports_sought}})",
    },
    {
      id: "reports_not_retrieved",
      kind: "exclusion",
      cell: { row: 3, col: 1 },
      template: "Reports not retrieved\n(n = {{reports_not_retrieved}})",
    },
    {
      id: "reports_other_sought",
      kind: "box",
      cell: { row: 3, col: 2 },
      template: "Reports sought for retrieval\n(n = {{reports_other_sought}})",
    },

    // Row 4: Assessed for eligibility — left-track exclusion lives on the
    // same row so the side branch is a direct horizontal arrow.
    {
      id: "reports_assessed",
      kind: "box",
      cell: { row: 4, col: 0 },
      template: "Reports assessed for eligibility\n(n = {{reports_assessed}})",
    },
    {
      id: "reports_excluded",
      kind: "exclusion",
      cell: { row: 4, col: 1 },
      template:
        "Reports excluded:\n" +
        "{{#each exclusion_reasons}}{{reason}} (n = {{n}})\n{{/each}}",
    },
    {
      id: "reports_other_not_retrieved",
      kind: "exclusion",
      cell: { row: 4, col: 2 },
      template: "Reports not retrieved\n(n = {{reports_other_not_retrieved}})",
    },

    // Row 5: Right-track assessed-for-eligibility with its exclusion
    // box folded into col 1 so the right→centre side branch is also
    // a direct horizontal arrow.
    {
      id: "reports_other_excluded",
      kind: "exclusion",
      cell: { row: 5, col: 1 },
      template:
        "{{#if exclusion_reasons_other}}Reports excluded (other methods):\n{{#each exclusion_reasons_other}}{{reason}} (n = {{n}})\n{{/each}}{{/if}}",
    },
    {
      id: "reports_other_assessed",
      kind: "box",
      cell: { row: 5, col: 2 },
      template: "Reports assessed for eligibility\n(n = {{reports_other_assessed}})",
    },

    // Row 6: Included
    {
      id: "included",
      kind: "box",
      cell: { row: 6, col: 0, colSpan: 3 },
      template:
        "Studies included in review (n = {{studies_included}})\n" +
        "Reports of included studies (n = {{reports_of_included_studies}})",
      style: { fill: "#eaf1ff", bold: true },
    },
  ],

  edges: [
    // Main vertical flow (left column).
    { from: "db_sources", to: "records_screened", fromPort: "s", toPort: "n" },
    { from: "records_screened", to: "reports_sought", fromPort: "s", toPort: "n" },
    { from: "reports_sought", to: "reports_assessed", fromPort: "s", toPort: "n" },
    { from: "reports_assessed", to: "included", fromPort: "s", toPort: "n" },

    // Pre-screen removal (to centre col).
    { from: "db_sources", to: "prescreen_removed", fromPort: "e", toPort: "w" },
    // Screening exclusion branches.
    { from: "records_screened", to: "records_excluded", fromPort: "e", toPort: "w" },
    { from: "reports_sought", to: "reports_not_retrieved", fromPort: "e", toPort: "w" },
    { from: "reports_assessed", to: "reports_excluded", fromPort: "e", toPort: "w" },

    // Right-track (other methods).
    { from: "other_sources", to: "reports_other_sought", fromPort: "s", toPort: "n" },
    { from: "reports_other_sought", to: "reports_other_assessed", fromPort: "s", toPort: "n" },
    { from: "reports_other_sought", to: "reports_other_not_retrieved", fromPort: "s", toPort: "n" },
    // Right-track exclusion now lives on the same row as
    // reports_other_assessed; the side branch heads left into col 1.
    { from: "reports_other_assessed", to: "reports_other_excluded", fromPort: "w", toPort: "e" },
    // Merge right → included.
    { from: "reports_other_assessed", to: "included", fromPort: "s", toPort: "n" },
  ],

  invariants: [
    {
      id: "SCREEN_IN",
      description:
        "records_screened should equal db_records + registry_records − duplicates_removed − automation_excluded − other_prescreen_removed",
      lhs: ["records_screened"],
      rhs: [
        "db_records",
        "registry_records",
        "-duplicates_removed",
        "-automation_excluded",
        "-other_prescreen_removed",
      ],
      severity: "warning",
    },
    {
      id: "SCREEN_OUT",
      description: "records_screened should equal records_excluded + reports_sought",
      lhs: ["records_screened"],
      rhs: ["records_excluded", "reports_sought"],
      severity: "warning",
    },
    {
      id: "SOUGHT_OUT",
      description: "reports_sought should equal reports_not_retrieved + reports_assessed",
      lhs: ["reports_sought"],
      rhs: ["reports_not_retrieved", "reports_assessed"],
      severity: "warning",
    },
    {
      id: "INCLUDED_BALANCE",
      description:
        "reports_assessed + reports_other_assessed should equal reports_of_included_studies + Σ exclusion_reasons + Σ exclusion_reasons_other",
      lhs: ["reports_assessed", "reports_other_assessed"],
      rhs: ["reports_of_included_studies", "exclusion_reasons", "exclusion_reasons_other"],
      severity: "warning",
    },
    {
      id: "OTHER_SOUGHT_OUT",
      description:
        "reports_other_sought should equal reports_other_not_retrieved + reports_other_assessed",
      lhs: ["reports_other_sought"],
      rhs: ["reports_other_not_retrieved", "reports_other_assessed"],
      severity: "warning",
    },
  ],
};

export default prisma2020;
