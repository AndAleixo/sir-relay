/**
 * Self-check: CSV export escaping + sections.
 * Run: npx tsx scripts/check-export-csv.ts
 */
import assert from "node:assert/strict";
import { csvCell, toExportCsv, type ExportPayload } from "../src/domain/export";

assert.equal(csvCell("plain"), "plain");
assert.equal(csvCell('say "hi"'), '"say ""hi"""');
assert.equal(csvCell("a,b"), '"a,b"');
assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
assert.equal(csvCell(true), "true");
assert.equal(csvCell(null), "");

const sample: ExportPayload = {
  exportedAt: "2026-07-26T12:00:00.000Z",
  scope: "full",
  users: [
    {
      name: "Ana, Ops",
      email: "ana@example.com",
      role: "operator",
      locale: "pt-br",
      active: true,
      displayName: "Chefe",
      telegramStatus: "linked",
    },
  ],
  tasks: [
    {
      title: 'Fix "pipe"',
      description: "Line 1\nLine 2",
      assigneeName: "Chefe",
      status: "todo",
      dueDate: "2026-07-27",
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-21T10:00:00.000Z",
    },
  ],
  alertPrefs: {
    taskDone: true,
    taskDue: false,
    timezone: "Europe/Lisbon",
    quietHoursStart: 22,
    quietHoursEnd: 7,
  },
};

const csv = toExportCsv(sample);
assert.ok(csv.startsWith("\uFEFF"), "UTF-8 BOM for Excel");
assert.match(csv, /Members/);
assert.match(csv, /Tasks/);
assert.match(csv, /Alert preferences/);
assert.match(csv, /"Ana, Ops"/);
assert.match(csv, /"Fix ""pipe"""/);
assert.match(csv, /"Line 1\nLine 2"/);
assert.match(csv, /Task done,true/);
assert.match(csv, /Quiet hours start,22/);

console.log("check-export-csv: ok");
