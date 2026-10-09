/* Logarithmic play-speed checks. Run: node science/astronomy/play-speed.test.js */
"use strict";

var Speed = require("./play-speed.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(Math.abs(Speed.posToDps(0) - Speed.MIN_DPS) < 1e-12, "slider start is 1 hour/s");
assert(Math.abs(Speed.MIN_DPS - 1 / 24) < 1e-15, "min is one hour per second");
assert(Math.abs(Speed.posToDps(Speed.SLIDER_MAX) - Speed.MAX_DPS) < 1e-6, "slider end is 10 years/s");
assert(Math.abs(Speed.MAX_DPS - 10 * 365.25) < 1e-9, "max is ten Julian years per second");
assert(Speed.MAX_DPS > 3 * 365.25, "max is several years per second");

assert(Speed.formatRate(Speed.MIN_DPS).label === "1 hour/s", "min label " + Speed.formatRate(Speed.MIN_DPS).label);
assert(Speed.formatRate(12.3).label === "12.3 days/s", "example label " + Speed.formatRate(12.3).label);
assert(Speed.formatRate(36).label === "36 days/s", "default label");
assert(Speed.formatRate(0.5).label === "12 hours/s", "half day is 12 hours/s");
assert(Speed.formatRate(1).label === "1 day/s", "singular day");
assert(Speed.formatRate(Speed.YEAR_DAYS).label === "1 year/s", "one year");
assert(Speed.formatRate(Speed.MAX_DPS).label === "10 years/s", "ten years");
assert(Speed.formatRate(18).label === "18 days/s", "0.5×");
assert(Speed.formatRate(72).label === "72 days/s", "2×");
assert(Speed.formatRate(180).label === "180 days/s", "5×");
assert(Speed.formatRate(360).label === "360 days/s", "10×");

Speed.PRESETS.forEach(function (mult) {
  var dps = mult * Speed.BASE_DAYS_PER_SEC;
  assert(dps >= Speed.MIN_DPS && dps <= Speed.MAX_DPS, "preset in range " + mult);
  assert(Speed.near(Speed.fromStoredMultiplier(mult), dps), "legacy preset " + mult);
  assert(Speed.near(Speed.fromStoredMultiplier(String(mult)), dps), "legacy string " + mult);
});

assert(Speed.fromStoredMultiplier(0) == null, "reject zero");
assert(Speed.fromStoredMultiplier(-1) == null, "reject negative");
assert(Speed.fromStoredMultiplier("nope") == null, "reject garbage");
assert(Speed.fromStoredMultiplier(1e9) == null, "reject out of range");

var round = Speed.fromStoredMultiplier(Speed.toStoredMultiplier(12.3));
assert(round != null && Speed.near(round, 12.3), "store round trip " + round);

assert(Speed.parseRate("12.3", "days/s") === 12.3, "bare number uses current unit");
assert(Speed.near(Speed.parseRate("12.3 days/s", "hours/s"), 12.3), "explicit days");
assert(Speed.near(Speed.parseRate("2 years", "days/s"), 2 * 365.25), "two years");
assert(Speed.near(Speed.parseRate("6 hours", "days/s"), 0.25), "six hours");
assert(Speed.near(Speed.parseRate("1 hour", "days/s"), 1 / 24), "one hour");
assert(Speed.near(Speed.parseRate("1e2 days", "hours/s"), 100), "scientific days");
assert(Speed.parseRate("", "days/s") == null, "empty");
assert(Speed.parseRate("nope", "days/s") == null, "words");
assert(Speed.parseRate("0", "days/s") == null, "zero");
assert(Speed.parseRate("-4 days", "days/s") == null, "negative");
assert(Speed.near(Speed.parseRate("0.01 hours", "days/s"), Speed.MIN_DPS), "below min clamps");
assert(Speed.near(Speed.parseRate("40 years", "days/s"), Speed.MAX_DPS), "above max clamps");

assert(Speed.near(Speed.nudge(36, 1, false), 36 * Speed.FINE), "fine step");
assert(Speed.near(Speed.nudge(36, 1, true), 36 * Speed.COARSE), "coarse step");
assert(Speed.near(Speed.nudge(36, -1, false), 36 / Speed.FINE), "fine down");
assert(Speed.nudge(Speed.MIN_DPS, -1, true) === Speed.MIN_DPS, "min sticks");
assert(Speed.nudge(Speed.MAX_DPS, 1, true) === Speed.MAX_DPS, "max sticks");

var seen = {};
var dps = Speed.MIN_DPS;
var i;
for (i = 0; i < 250; i++) {
  var label = Speed.formatRate(dps).label;
  assert(!seen[label], "duplicate fine label " + label + " at " + i);
  seen[label] = true;
  var next = Speed.nudge(dps, 1, false);
  assert(next > dps, "fine step increases at " + dps);
  dps = next;
}
assert(Object.keys(seen).length === 250, "250 distinct fine steps");

var prev = -1;
var labels = {};
var nLab = 0;
for (i = 0; i <= 400; i++) {
  var p = (i / 400) * Speed.SLIDER_MAX;
  var v = Speed.posToDps(p);
  assert(v > prev, "slider monotonic at " + p);
  var back = Speed.dpsToPos(v);
  assert(Math.abs(back - p) < 1e-6, "position round trip " + p);
  prev = v;
  var lab = Speed.formatRate(v).label;
  if (!labels[lab]) {
    labels[lab] = true;
    nLab++;
  }
}
assert(nLab >= 200, "slider samples show 200+ distinct rates, got " + nLab);
assert(!/e/i.test(Speed.formatRate(12.3).label), "no scientific notation");

console.log("play-speed.test.js ok", {
  min: Speed.formatRate(Speed.MIN_DPS).label,
  def: Speed.formatRate(36).label,
  mid: Speed.formatRate(12.3).label,
  max: Speed.formatRate(Speed.MAX_DPS).label,
  samples: nLab
});
