#!/usr/bin/env node
"use strict";

require("./annual-dial-backup.js");
const b = global.annualDialBackup;
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

function eq(a, b, msg) {
  const same = JSON.stringify(a) === JSON.stringify(b);
  assert(same, msg + (same ? "" : "\n    got " + JSON.stringify(a) + "\n    exp " + JSON.stringify(b)));
}

const events = {
  "2026-01-15": ["Birthday", "Call mom"],
  "2026-03-22": ["Plant tomatoes"],
};

const text = b.serializeBackup({ events, theme: "led", saved: "2026-09-17" });
assert(text.startsWith("# Annual Dial\n# version: 1\n"), "header names Annual Dial + version");
assert(text.includes("# theme: led"), "optional theme line");
assert(text.includes("2026-01-15\tBirthday"), "tab-separated first note");
assert(text.includes("2026-01-15\tCall mom"), "second note on same day is its own line");
assert(b.backupFilename(new Date(2026, 8, 17)) === "annual-dial-2026-09-17.txt", "filename uses local ISO date");

const parsed = b.parseBackup(text);
eq(parsed.events, events, "round-trip events");
assert(parsed.theme === "led", "round-trip theme");
assert(parsed.error === null, "no parse error on canonical text");

const comments = b.parseBackup("# Annual Dial\n# theme: vapor\n\n# skip me\n2026-07-04 | Fireworks\n\n2026-07-04\tPicnic\n");
eq(comments.events, { "2026-07-04": ["Fireworks", "Picnic"] }, "skip blanks/# and accept pipe or tab");
assert(comments.theme === "vapor", "theme from comment line");

const jsonOnly = b.parseBackup(JSON.stringify(events));
eq(jsonOnly.events, events, "accepts a raw events JSON blob");

const wrapped = b.parseBackup(JSON.stringify({ theme: "neon", events }));
eq(wrapped.events, events, "accepts {events, theme} JSON");
assert(wrapped.theme === "neon", "theme from JSON wrapper");

const empty = b.parseBackup("   \n# only comments\n");
eq(empty.events, {}, "comment-only file is empty events, not an error");
assert(empty.error === null, "comment-only is valid");

assert(b.parseBackup("").error === "empty", "blank file is empty error");
assert(b.parseBackup("[]").error === "unrecognized", "JSON array is unrecognized");

const merged = b.mergeEvents(
  { "2026-01-15": ["Birthday"], "2026-02-01": ["Keep"] },
  { "2026-01-15": ["Birthday", "New"], "2026-03-01": ["Added"] }
);
eq(merged, {
  "2026-01-15": ["Birthday", "New"],
  "2026-02-01": ["Keep"],
  "2026-03-01": ["Added"],
}, "merge keeps current, appends new, skips exact dupes");

assert(b.countNotes(events) === 3, "countNotes");
assert(b.countDays(events) === 2, "countDays");
assert(b.isIsoDate("2026-02-28") && !b.isIsoDate("2026-02-29") && !b.isIsoDate("2026-13-01"), "ISO date validation");

const crlf = b.parseBackup("2026-05-01\tHello\r\n2026-05-02 | There\r\n");
eq(crlf.events, { "2026-05-01": ["Hello"], "2026-05-02": ["There"] }, "CRLF lines");

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nall tests passed");
