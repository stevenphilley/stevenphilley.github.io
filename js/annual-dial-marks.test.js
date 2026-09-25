#!/usr/bin/env node
"use strict";

require("./annual-dial-backup.js");
require("./annual-dial-marks.js");
const m = global.annualDialMarks;
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

const events = {
  "2026-01-15": ["Birthday"],
  "2026-09-25": [{ text: "Dentist", time: "09:30" }, "Note only"],
  "2024-12-25": [{ text: "Dinner", time: "18:00", yearly: true }],
  "2024-02-29": [{ text: "Leap", time: "08:00", yearly: true }],
};

const morning = new Date(2026, 8, 25, 8, 0, 0, 0);
const up = m.upcoming(events, morning, 10);
assert(up[0].text === "Note only" && up[0].allDay, "all-day mark sorts at the start of today");
assert(up[1].text === "Dentist" && up[1].time === "09:30", "timed mark follows later the same morning");
assert(up.some(function (x) { return x.text === "Note only" && x.allDay && x.occurrence === "2026-09-25"; }), "date-only mark is all-day today");
assert(up.some(function (x) { return x.text === "Birthday" && x.occurrence === "2026-01-15"; }) === false, "past date-only mark is not upcoming");
const dinner = up.filter(function (x) { return x.text === "Dinner"; })[0];
assert(dinner && dinner.occurrence === "2026-12-25" && dinner.yearly, "yearly mark uses this year's month-day");
const leap = up.filter(function (x) { return x.text === "Leap"; })[0];
assert(leap && leap.occurrence === "2028-02-29", "yearly Feb 29 skips non-leap years");

const later = new Date(2026, 8, 25, 12, 0, 0, 0);
const upLater = m.upcoming(events, later, 10);
assert(!upLater.some(function (x) { return x.text === "Dentist"; }), "timed mark drops out of upcoming after it passes");
assert(upLater.some(function (x) { return x.text === "Note only"; }), "all-day mark stays until the day ends");

assert(m.formatCountdown(morning.getTime() + 45000, morning.getTime(), false) === "in 45s", "countdown under 90s uses seconds");
assert(m.formatCountdown(new Date(2026, 8, 25).getTime(), morning.getTime(), true) === "today", "all-day countdown says today");

const dueNow = new Date(2026, 8, 25, 9, 30, 30, 0);
const due = m.dueMarks(events, dueNow, 90000);
assert(due.length === 1 && due[0].text === "Dentist", "due alert only for the timed mark inside the grace window");
assert(m.dueMarks(events, new Date(2026, 8, 25, 9, 33, 0, 0), 90000).length === 0, "no due alert after the grace window");
assert(m.dueMarks({ "2026-09-25": ["Note only"] }, dueNow, 90000).length === 0, "date-only marks never come due");

const xmasDue = m.dueMarks(events, new Date(2026, 11, 25, 18, 0, 20, 0), 90000);
assert(xmasDue.length === 1 && xmasDue[0].text === "Dinner" && xmasDue[0].occurrence === "2026-12-25", "yearly mark is due on the occurrence, not only the stored year");

const onDay = m.marksOnDate(events, "2026-12-25");
assert(onDay.length === 1 && onDay[0].echoed && onDay[0].mark.text === "Dinner", "yearly mark shows on later years");
assert(m.hasMarks(events, "2026-01-15") && !m.hasMarks(events, "2026-01-16"), "hasMarks follows stored days");
const fr = m.timeFractions(events, "2026-09-25");
assert(fr.length === 1 && Math.abs(fr[0] - (9 * 60 + 30) / 1440) < 1e-9, "time fraction is minutes into the day");
assert(m.timeFractions(events, "2026-01-15").length === 0, "date-only day has no time tick");

const timed = m.timedMarks(events);
assert(timed.map(function (x) { return x.text; }).join(",") === "Leap,Dinner,Dentist", "timed export list skips date-only marks and sorts by date");

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nall tests passed");
