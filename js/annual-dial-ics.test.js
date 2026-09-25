#!/usr/bin/env node
"use strict";

require("./annual-dial-ics.js");
const ics = global.annualDialIcs;
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

const now = new Date(Date.UTC(2026, 8, 25, 12, 0, 0));
const utcCal = ics.buildCalendar({
  timeZone: "UTC",
  alarm: "PT0S",
  now: now,
  marks: [
    { date: "2026-09-25", time: "09:30", text: "Dentist, please; bring x\\y", yearly: false },
    { date: "2026-12-25", time: "18:00", text: "Dinner", yearly: true },
    { date: "2026-01-15", text: "Birthday" },
  ],
});

assert(utcCal.endsWith("\r\n"), "file ends with CRLF");
assert(!/(^|[^\r])\n/.test(utcCal), "every line break is CRLF");
assert(utcCal.includes("BEGIN:VCALENDAR\r\n"), "calendar header");
assert(utcCal.includes("VERSION:2.0\r\n"), "version");
assert(utcCal.includes("UID:annual-dial-"), "UID");
assert(utcCal.includes("DTSTAMP:20260925T120000Z\r\n"), "DTSTAMP is UTC");
assert(utcCal.includes("DTSTART:20260925T093000Z\r\n"), "UTC start");
assert(utcCal.includes("DTEND:20260925T100000Z\r\n"), "UTC end is 30 minutes later");
assert(utcCal.includes("SUMMARY:Dentist\\, please\\; bring x\\\\y\r\n"), "TEXT escaping");
assert(utcCal.includes("RRULE:FREQ=YEARLY\r\n"), "yearly RRULE");
assert(utcCal.includes("TRIGGER:PT0S\r\n"), "VALARM at event time");
assert(utcCal.includes("BEGIN:VALARM\r\n"), "VALARM block");
assert((utcCal.match(/BEGIN:VEVENT/g) || []).length === 2, "date-only mark is omitted");
assert(!utcCal.includes("Birthday"), "untimed text is not in the calendar");

const lead = ics.buildCalendar({
  timeZone: "UTC",
  alarm: "-PT15M",
  now: now,
  marks: [{ date: "2026-09-25", time: "09:30", text: "Dentist" }],
});
assert(lead.includes("TRIGGER:-PT15M\r\n"), "chosen lead time");
assert(ics.buildCalendar({
  timeZone: "UTC",
  alarm: "DROP TABLE",
  now: now,
  marks: [{ date: "2026-09-25", time: "09:30", text: "Dentist" }],
}).includes("TRIGGER:PT0S\r\n"), "unknown alarm falls back to event time");

const la = ics.buildCalendar({
  timeZone: "America/Los_Angeles",
  alarm: "-PT1H",
  now: now,
  marks: [{ date: "2026-09-25", time: "09:30", text: "Dentist", yearly: true }],
});
assert(la.includes("BEGIN:VTIMEZONE\r\n"), "named zone includes VTIMEZONE");
assert(la.includes("TZID:America/Los_Angeles\r\n"), "TZID");
assert(la.includes("DTSTART;TZID=America/Los_Angeles:20260925T093000\r\n"), "wall-clock DTSTART");
assert(la.includes("DTEND;TZID=America/Los_Angeles:20260925T100000\r\n"), "wall-clock DTEND");
assert(la.includes("RRULE:FREQ=YEARLY\r\n"), "TZID event can repeat yearly");
assert(la.includes("TRIGGER:-PT1H\r\n"), "hour lead");
assert(!/(^|[^\r])\n/.test(la), "TZID calendar is CRLF too");

const longNote = "A".repeat(120) + ", keep";
const folded = ics.buildCalendar({
  timeZone: "UTC",
  now: now,
  marks: [{ date: "2026-09-25", time: "09:30", text: longNote }],
});
assert(/\r\n [A]/.test(folded), "long summary is folded with CRLF + space");

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nall tests passed");
