#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "computer-history.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  }
}

const cats = new Set((data.categories || []).map((c) => c.id));
const lanes = new Set((data.lanes || []).map((l) => l.id));
assert(cats.size >= 5, "categories are declared");
assert(lanes.has("hardware") && lanes.has("software") && lanes.has("networks") && lanes.has("ai"), "compare lanes exist");

const stops = (data.scale && data.scale.stops) || [];
assert(stops.length >= 2, "scale has stops");
for (let i = 1; i < stops.length; i++) {
  assert(stops[i][0] > stops[i - 1][0] && stops[i][1] > stops[i - 1][1], "scale stops increase at " + i);
}

const events = data.events || [];
assert(events.length >= 120 && events.length <= 200, "event count is " + events.length + ", want 120–200");

const ids = new Set();
const dateRe = {
  year: /^-?\d{1,4}$/,
  month: /^\d{4}-(0[1-9]|1[0-2])$/,
  day: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
};

function sentences(text) {
  return String(text).trim().split(/(?<=[.!?])\s+/).filter(Boolean);
}

events.forEach((ev) => {
  const id = ev && ev.id;
  assert(id && !ids.has(id), "unique id " + id);
  ids.add(id);
  assert(ev.date && ev.precision && dateRe[ev.precision] && dateRe[ev.precision].test(ev.date), id + " date/precision " + ev.date + " " + ev.precision);
  assert(typeof ev.title === "string" && ev.title.trim().length > 0, id + " has a title");
  const n = sentences(ev.summary || "");
  assert(n.length >= 1 && n.length <= 3, id + " summary sentences: " + n.length);
  assert(Array.isArray(ev.categories) && ev.categories.length > 0 && ev.categories.every((c) => cats.has(c)), id + " categories");
  assert(lanes.has(ev.lane), id + " lane");
  assert(Array.isArray(ev.sources) && ev.sources.length > 0, id + " has a source");
  (ev.sources || []).forEach((s, i) => {
    assert(s && s.title && /^https?:\/\//.test(s.url || ""), id + " source " + i + " is an http(s) link");
  });
  if (ev.note != null) assert(typeof ev.note === "string" && ev.note.trim(), id + " note");
  (ev.site || []).forEach((s, i) => {
    assert(s && s.title && typeof s.url === "string" && s.url.startsWith("/"), id + " site link " + i);
  });
});

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("ok  " + events.length + " computer-history events have a date, a title, and a source");
