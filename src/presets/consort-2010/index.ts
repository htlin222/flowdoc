/**
 * CONSORT 2010 Flow Diagram preset (parallel-group RCT, two arms).
 *
 * Follows: Schulz KF, Altman DG, Moher D, for the CONSORT Group.
 * CONSORT 2010 Statement: updated guidelines for reporting parallel group
 * randomised trials. BMJ 2010;340:c332. https://doi.org/10.1136/bmj.c332
 *
 * Layout: 3-column grid. Centre column carries the enrolment funnel
 * (assessed -> randomized) with a side-branch exclusion box. Left & right
 * columns carry the two parallel arms (intervention vs control) through
 * Allocation, Follow-up, and Analysis.
 */

import type { Preset } from "../../core/types.js";

export const consort2010: Preset = {
  id: "consort-2010",
  version: "1.0.0",
  name: "CONSORT 2010 (parallel-group RCT)",
  description:
    "CONSORT 2010 flow diagram for two-arm parallel-group randomised controlled trials.",
  citation: {
    text:
      "Schulz KF, Altman DG, Moher D, for the CONSORT Group. CONSORT 2010 Statement: updated guidelines for reporting parallel group randomised trials. BMJ 2010;340:c332.",
    doi: "10.1136/bmj.c332",
    url: "https://www.bmj.com/content/340/bmj.c332",
  },

  grid: {
    cols: 3,
    rows: 6,
    colWidth: 260,
    rowHeight: 80,
    colGap: 40,
    rowGap: 18,
    padding: 24,
    sectionLabelWidth: 40,
  },

  sections: [
    { id: "enrolment", label: "Enrolment", rows: [0, 2] },
    { id: "allocation", label: "Allocation", rows: [3, 3] },
    { id: "followup", label: "Follow-up", rows: [4, 4] },
    { id: "analysis", label: "Analysis", rows: [5, 5] },
  ],

  fields: [
    // Enrolment
    { key: "assessed", type: "number", label: "Assessed for eligibility", required: true, default: 0 },
    { key: "excluded_total", type: "number", label: "Excluded total", default: 0 },
    { key: "excluded_not_meeting", type: "number", label: "Excluded — not meeting inclusion criteria", default: 0 },
    { key: "excluded_declined", type: "number", label: "Excluded — declined to participate", default: 0 },
    { key: "excluded_other", type: "number", label: "Excluded — other reasons", default: 0 },
    { key: "randomized", type: "number", label: "Randomized", required: true, default: 0 },

    // Intervention arm
    { key: "int_name", type: "string", label: "Intervention arm name", default: "Intervention" },
    { key: "int_allocated", type: "number", label: "Allocated to intervention", default: 0 },
    { key: "int_received", type: "number", label: "Received intervention as allocated", default: 0 },
    { key: "int_not_received", type: "number", label: "Did not receive intervention as allocated", default: 0 },
    { key: "int_lost", type: "number", label: "Lost to follow-up (intervention)", default: 0 },
    { key: "int_discontinued", type: "number", label: "Discontinued intervention", default: 0 },
    { key: "int_analysed", type: "number", label: "Analysed (intervention)", default: 0 },
    { key: "int_excluded_analysis", type: "number", label: "Excluded from analysis (intervention)", default: 0 },

    // Control arm
    { key: "ctrl_name", type: "string", label: "Control arm name", default: "Control" },
    { key: "ctrl_allocated", type: "number", label: "Allocated to control", default: 0 },
    { key: "ctrl_received", type: "number", label: "Received control as allocated", default: 0 },
    { key: "ctrl_not_received", type: "number", label: "Did not receive control as allocated", default: 0 },
    { key: "ctrl_lost", type: "number", label: "Lost to follow-up (control)", default: 0 },
    { key: "ctrl_discontinued", type: "number", label: "Discontinued control", default: 0 },
    { key: "ctrl_analysed", type: "number", label: "Analysed (control)", default: 0 },
    { key: "ctrl_excluded_analysis", type: "number", label: "Excluded from analysis (control)", default: 0 },
  ],

  nodes: [
    {
      id: "assessed",
      kind: "box",
      cell: { row: 0, col: 1 },
      template: "Assessed for eligibility\n(n = {{assessed}})",
    },
    {
      id: "excluded",
      kind: "exclusion",
      cell: { row: 1, col: 2 },
      template:
        "Excluded (n = {{excluded_total}})\n" +
        "• Not meeting inclusion criteria (n = {{excluded_not_meeting}})\n" +
        "• Declined to participate (n = {{excluded_declined}})\n" +
        "• Other reasons (n = {{excluded_other}})",
    },
    {
      id: "randomized",
      kind: "box",
      cell: { row: 2, col: 1 },
      template: "Randomized\n(n = {{randomized}})",
      style: { bold: true },
    },

    {
      id: "allocated_int",
      kind: "box",
      cell: { row: 3, col: 0 },
      template:
        "Allocated to {{int_name}} (n = {{int_allocated}})\n" +
        "• Received allocated intervention (n = {{int_received}})\n" +
        "• Did not receive allocated intervention (n = {{int_not_received}})",
    },
    {
      id: "allocated_ctrl",
      kind: "box",
      cell: { row: 3, col: 2 },
      template:
        "Allocated to {{ctrl_name}} (n = {{ctrl_allocated}})\n" +
        "• Received allocated intervention (n = {{ctrl_received}})\n" +
        "• Did not receive allocated intervention (n = {{ctrl_not_received}})",
    },

    {
      id: "followup_int",
      kind: "exclusion",
      cell: { row: 4, col: 0 },
      template:
        "Lost to follow-up (n = {{int_lost}})\n" +
        "Discontinued intervention (n = {{int_discontinued}})",
    },
    {
      id: "followup_ctrl",
      kind: "exclusion",
      cell: { row: 4, col: 2 },
      template:
        "Lost to follow-up (n = {{ctrl_lost}})\n" +
        "Discontinued intervention (n = {{ctrl_discontinued}})",
    },

    {
      id: "analysed_int",
      kind: "box",
      cell: { row: 5, col: 0 },
      template:
        "Analysed (n = {{int_analysed}})\n" +
        "Excluded from analysis (n = {{int_excluded_analysis}})",
      style: { fill: "#eaf1ff", bold: true },
    },
    {
      id: "analysed_ctrl",
      kind: "box",
      cell: { row: 5, col: 2 },
      template:
        "Analysed (n = {{ctrl_analysed}})\n" +
        "Excluded from analysis (n = {{ctrl_excluded_analysis}})",
      style: { fill: "#eaf1ff", bold: true },
    },
  ],

  edges: [
    { from: "assessed", to: "excluded", fromPort: "e", toPort: "w" },
    { from: "assessed", to: "randomized", fromPort: "s", toPort: "n" },
    { from: "randomized", to: "allocated_int", fromPort: "s", toPort: "n" },
    { from: "randomized", to: "allocated_ctrl", fromPort: "s", toPort: "n" },
    { from: "allocated_int", to: "followup_int", fromPort: "s", toPort: "n" },
    { from: "allocated_ctrl", to: "followup_ctrl", fromPort: "s", toPort: "n" },
    { from: "followup_int", to: "analysed_int", fromPort: "s", toPort: "n" },
    { from: "followup_ctrl", to: "analysed_ctrl", fromPort: "s", toPort: "n" },
  ],

  invariants: [
    {
      id: "ENROL_BALANCE",
      description: "assessed should equal excluded_total + randomized",
      lhs: ["assessed"],
      rhs: ["excluded_total", "randomized"],
      severity: "warning",
    },
    {
      id: "EXCLUDED_REASONS",
      description:
        "excluded_total should equal excluded_not_meeting + excluded_declined + excluded_other",
      lhs: ["excluded_total"],
      rhs: ["excluded_not_meeting", "excluded_declined", "excluded_other"],
      severity: "warning",
    },
    {
      id: "RANDOMIZED_BALANCE",
      description: "randomized should equal int_allocated + ctrl_allocated",
      lhs: ["randomized"],
      rhs: ["int_allocated", "ctrl_allocated"],
      severity: "warning",
    },
    {
      id: "INT_ALLOCATED_BALANCE",
      description: "int_allocated should equal int_received + int_not_received",
      lhs: ["int_allocated"],
      rhs: ["int_received", "int_not_received"],
      severity: "warning",
    },
    {
      id: "CTRL_ALLOCATED_BALANCE",
      description: "ctrl_allocated should equal ctrl_received + ctrl_not_received",
      lhs: ["ctrl_allocated"],
      rhs: ["ctrl_received", "ctrl_not_received"],
      severity: "warning",
    },
    {
      id: "INT_ANALYSIS_BALANCE",
      description: "int_allocated should equal int_analysed + int_excluded_analysis",
      lhs: ["int_allocated"],
      rhs: ["int_analysed", "int_excluded_analysis"],
      severity: "warning",
    },
    {
      id: "CTRL_ANALYSIS_BALANCE",
      description: "ctrl_allocated should equal ctrl_analysed + ctrl_excluded_analysis",
      lhs: ["ctrl_allocated"],
      rhs: ["ctrl_analysed", "ctrl_excluded_analysis"],
      severity: "warning",
    },
  ],
};

export default consort2010;
