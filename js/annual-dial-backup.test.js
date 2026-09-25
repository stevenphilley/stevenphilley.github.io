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
assert(text.startsWith("# Annual Dial\n# version: 2\n"), "header names Annual Dial + version");
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

const oldFile = [
  "# Annual Dial",
  "# version: 1",
  "# saved: 2020-01-01",
  "# theme: columbus",
  "",
  "2026-10-12\tParade",
  "2026-01-15\t09:30 meeting",
  "2026-03-22 | Plant tomatoes",
].join("\n");
const oldParsed = b.parseBackup(oldFile);
eq(oldParsed.events, {
  "2026-10-12": ["Parade"],
  "2026-01-15": ["09:30 meeting"],
  "2026-03-22": ["Plant tomatoes"],
}, "version 1 keeps date-only notes, even if they look like a time");
assert(oldParsed.theme === "columbus", "version 1 theme still reads");
assert(oldParsed.version === 1, "version 1 is recorded");

const noVersion = b.parseBackup("2026-04-01\t09:30\tLooks like columns\n");
eq(noVersion.events, { "2026-04-01": ["09:30\tLooks like columns"] }, "no version line does not invent a time column");

const timed = {
  "2026-09-25": [
    { text: "Dentist", time: "09:30" },
    { text: "Dinner", time: "18:00", yearly: true },
    { text: "Anniversary", yearly: true },
  ],
  "2026-10-12": ["Parade"],
};
const timedText = b.serializeBackup({
  events: timed,
  theme: "brass",
  timezone: "America/Los_Angeles",
  saved: "2026-09-25",
});
assert(timedText.includes("# version: 2"), "timed file is version 2");
assert(timedText.includes("# timezone: America/Los_Angeles"), "timezone comment");
assert(timedText.includes("2026-09-25\t09:30\tDentist"), "timed line");
assert(timedText.includes("2026-09-25\t18:00\tyearly\tDinner"), "timed yearly line");
assert(timedText.includes("2026-09-25\tyearly\tAnniversary"), "untimed yearly line");
assert(timedText.includes("2026-10-12\tParade"), "date-only line stays a single column");
const timedParsed = b.parseBackup(timedText);
eq(timedParsed.events, timed, "version 2 round-trip with times");
assert(timedParsed.timezone === "America/Los_Angeles", "timezone round-trip");
assert(timedParsed.theme === "brass", "theme still round-trips beside timezone");

const pipeV2 = b.parseBackup("# version: 2\n2026-07-04 | 09:30 | Fireworks\n2026-07-04 | yearly | Picnic\n");
eq(pipeV2.events, {
  "2026-07-04": [
    { text: "Fireworks", time: "09:30" },
    { text: "Picnic", yearly: true },
  ],
}, "version 2 accepts pipes");

const noteIsTime = b.parseBackup("# version: 2\n2026-08-01\t09:30\n2026-08-02\tyearly\n");
eq(noteIsTime.events, {
  "2026-08-01": ["09:30"],
  "2026-08-02": ["yearly"],
}, "a lone time or yearly token stays the note");

const jsonMixed = b.parseBackup(JSON.stringify({
  version: 2,
  theme: "hallow",
  timezone: "Europe/London",
  events: {
    "2026-01-15": ["Birthday", { text: "Call", time: "14:00", yearly: true }],
  },
}));
eq(jsonMixed.events, {
  "2026-01-15": ["Birthday", { text: "Call", time: "14:00", yearly: true }],
}, "JSON mixes old strings and timed objects");
assert(jsonMixed.theme === "hallow", "theme from versioned JSON");
assert(jsonMixed.timezone === "Europe/London", "timezone from JSON");

const stored = b.normalizeEvents({
  "2026-05-05": ["Keep me", { text: "Noon", time: "12:00" }, { text: "", time: "01:00" }, { text: "Bad", time: "25:99" }],
});
eq(stored, {
  "2026-05-05": ["Keep me", { text: "Noon", time: "12:00" }, "Bad"],
}, "normalize keeps strings, packs times, drops empty and invalid times");

const mergedTimed = b.mergeEvents(
  { "2026-09-25": ["Parade", { text: "Dentist", time: "09:30" }] },
  { "2026-09-25": [{ text: "Dentist", time: "09:30" }, { text: "Dentist", time: "10:00" }], "2026-10-01": ["New"] }
);
eq(mergedTimed, {
  "2026-09-25": ["Parade", { text: "Dentist", time: "09:30" }, { text: "Dentist", time: "10:00" }],
  "2026-10-01": ["New"],
}, "merge dedupes the same text+time and keeps a different time");

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nall tests passed");
