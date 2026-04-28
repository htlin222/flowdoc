/**
 * STROBE preset (cohort-study participant-flow diagram).
 *
 * Follows: von Elm E, Altman DG, Egger M, Pocock SJ, Gøtzsche PC,
 * Vandenbroucke JP for the STROBE Initiative. The Strengthening the
 * Reporting of Observational studies in Epidemiology (STROBE) statement:
 * guidelines for reporting observational studies. Lancet 2007;370:1453-7.
 * https://doi.org/10.1016/S0140-6736(07)61602-X
 *
 * STROBE itself does not prescribe a single mandatory flow diagram (unlike
 * PRISMA/CONSORT), but item 13 ("Participants") strongly recommends
 * reporting numbers at each stage of the study. This preset is the
 * commonly-used cohort-study layout: a single funnel from source population
 * to analytic sample, with side-branch exclusion boxes.
 */

import type { Preset } from "../../core/types.js";

export const strobe: Preset = {
  id: "strobe",
  version: "1.0.0",
  name: "STROBE (cohort participant flow)",
  description:
    "STROBE-style participant flow diagram for observational cohort studies (item 13).",
  citation: {
    text:
      "von Elm E, Altman DG, Egger M, et al. The Strengthening the Reporting of Observational studies in Epidemiology (STROBE) statement: guidelines for reporting observational studies. Lancet 2007;370:1453-1457.",
    doi: "10.1016/S0140-6736(07)61602-X",
    url: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(07)61602-X/fulltext",
  },

  grid: {
    cols: 2,
    rows: 5,
    colWidth: 280,
    rowHeight: 80,
    colGap: 40,
    rowGap: 18,
    padding: 24,
    sectionLabelWidth: 40,
  },

  sections: [
    { id: "source", label: "Source", rows: [0, 0] },
    { id: "eligibility", label: "Eligibility", rows: [1, 1] },
    { id: "enrolment", label: "Enrolment", rows: [2, 2] },
    { id: "followup", label: "Follow-up", rows: [3, 3] },
    { id: "analysis", label: "Analysis", rows: [4, 4] },
  ],

  fields: [
    { key: "source_population", type: "number", label: "Source population", required: true, default: 0 },
    { key: "excluded_ineligible", type: "number", label: "Excluded — did not meet inclusion criteria", default: 0 },
    { key: "excluded_other_eligibility", type: "number", label: "Excluded — other eligibility reasons", default: 0 },
    { key: "eligible", type: "number", label: "Eligible participants", required: true, default: 0 },

    { key: "declined", type: "number", label: "Declined to participate", default: 0 },
    { key: "no_consent", type: "number", label: "Could not be consented / contacted", default: 0 },
    { key: "enrolled", type: "number", label: "Enrolled", required: true, default: 0 },

    { key: "lost_followup", type: "number", label: "Lost to follow-up", default: 0 },
    { key: "withdrew", type: "number", label: "Withdrew during follow-up", default: 0 },
    { key: "completed_followup", type: "number", label: "Completed follow-up", default: 0 },

    { key: "excluded_analysis", type: "number", label: "Excluded from analysis (incomplete data, etc.)", default: 0 },
    { key: "analysed", type: "number", label: "Included in analysis", required: true, default: 0 },
  ],

  nodes: [
    {
      id: "source",
      kind: "box",
      cell: { row: 0, col: 0 },
      template: "Source population\n(n = {{source_population}})",
      style: { bold: true },
    },
    {
      id: "excluded_eligibility",
      kind: "exclusion",
      cell: { row: 0, col: 1 },
      template:
        "Excluded (n = {{ sum excluded_ineligible excluded_other_eligibility }})\n" +
        "• Did not meet inclusion criteria (n = {{excluded_ineligible}})\n" +
        "• Other (n = {{excluded_other_eligibility}})",
    },
    {
      id: "eligible",
      kind: "box",
      cell: { row: 1, col: 0 },
      template: "Eligible\n(n = {{eligible}})",
    },
    {
      id: "excluded_consent",
      kind: "exclusion",
      cell: { row: 1, col: 1 },
      template:
        "Not enrolled (n = {{ sum declined no_consent }})\n" +
        "• Declined to participate (n = {{declined}})\n" +
        "• Could not be consented (n = {{no_consent}})",
    },
    {
      id: "enrolled",
      kind: "box",
      cell: { row: 2, col: 0 },
      template: "Enrolled\n(n = {{enrolled}})",
      style: { bold: true },
    },
    {
      id: "lost",
      kind: "exclusion",
      cell: { row: 2, col: 1 },
      template:
        "Did not complete follow-up (n = {{ sum lost_followup withdrew }})\n" +
        "• Lost to follow-up (n = {{lost_followup}})\n" +
        "• Withdrew (n = {{withdrew}})",
    },
    {
      id: "completed",
      kind: "box",
      cell: { row: 3, col: 0 },
      template: "Completed follow-up\n(n = {{completed_followup}})",
    },
    {
      id: "excluded_analysis",
      kind: "exclusion",
      cell: { row: 3, col: 1 },
      template:
        "Excluded from analysis\n(n = {{excluded_analysis}})",
    },
    {
      id: "analysed",
      kind: "box",
      cell: { row: 4, col: 0 },
      template: "Included in analysis\n(n = {{analysed}})",
      style: { fill: "#eaf1ff", bold: true },
    },
  ],

  edges: [
    { from: "source", to: "excluded_eligibility", fromPort: "e", toPort: "w" },
    { from: "source", to: "eligible", fromPort: "s", toPort: "n" },
    { from: "eligible", to: "excluded_consent", fromPort: "e", toPort: "w" },
    { from: "eligible", to: "enrolled", fromPort: "s", toPort: "n" },
    { from: "enrolled", to: "lost", fromPort: "e", toPort: "w" },
    { from: "enrolled", to: "completed", fromPort: "s", toPort: "n" },
    { from: "completed", to: "excluded_analysis", fromPort: "e", toPort: "w" },
    { from: "completed", to: "analysed", fromPort: "s", toPort: "n" },
  ],

  invariants: [
    {
      id: "ELIGIBLE_BALANCE",
      description:
        "source_population should equal eligible + excluded_ineligible + excluded_other_eligibility",
      lhs: ["source_population"],
      rhs: ["eligible", "excluded_ineligible", "excluded_other_eligibility"],
      severity: "warning",
    },
    {
      id: "ENROLLED_BALANCE",
      description: "eligible should equal enrolled + declined + no_consent",
      lhs: ["eligible"],
      rhs: ["enrolled", "declined", "no_consent"],
      severity: "warning",
    },
    {
      id: "FOLLOWUP_BALANCE",
      description:
        "enrolled should equal completed_followup + lost_followup + withdrew",
      lhs: ["enrolled"],
      rhs: ["completed_followup", "lost_followup", "withdrew"],
      severity: "warning",
    },
    {
      id: "ANALYSIS_BALANCE",
      description: "completed_followup should equal analysed + excluded_analysis",
      lhs: ["completed_followup"],
      rhs: ["analysed", "excluded_analysis"],
      severity: "warning",
    },
  ],
};

export default strobe;
