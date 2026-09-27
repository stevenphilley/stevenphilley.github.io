#!/usr/bin/env node
"use strict";

var math = require("./exact-math.js");
var chart = require("./unit-circle.js");
var values = require("./trainer/values.js");

var failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

function textsOf(markup) {
  var out = [];
  var re = /<text[^>]*>([^<]*)<\/text>/g;
  var m;
  while ((m = re.exec(markup))) out.push(m[1]);
  return out.join("");
}

function count(markup, cls) {
  var re = new RegExp('class="' + cls + '"', "g");
  return (markup.match(re) || []).length;
}

var EXPECTED = [
  [0, "1", "0", "0", 0, 1],
  [30, "√3/2", "1/2", "√3/3", 1, 6],
  [45, "√2/2", "√2/2", "1", 1, 4],
  [60, "1/2", "√3/2", "√3", 1, 3],
  [90, "0", "1", "undef", 1, 2],
  [120, "-1/2", "√3/2", "-√3", 2, 3],
  [135, "-√2/2", "√2/2", "-1", 3, 4],
  [150, "-√3/2", "1/2", "-√3/3", 5, 6],
  [180, "-1", "0", "0", 1, 1],
  [210, "-√3/2", "-1/2", "√3/3", 7, 6],
  [225, "-√2/2", "-√2/2", "1", 5, 4],
  [240, "-1/2", "-√3/2", "√3", 4, 3],
  [270, "0", "-1", "undef", 3, 2],
  [300, "1/2", "-√3/2", "-√3", 5, 3],
  [315, "√2/2", "-√2/2", "-1", 7, 4],
  [330, "√3/2", "-1/2", "-√3/3", 11, 6]
];

assert(values.ANGLES.length === 16, "sixteen angles from values.js");

EXPECTED.forEach(function (row, i) {
  var angle = values.ANGLES[i];
  var label = row[0] + "°";
  assert(angle.deg === row[0], label + " degree");
  assert(angle.cos === row[1] && angle.sin === row[2] && angle.tan === row[3], label + " exact cos/sin/tan");
  assert(angle.radNum === row[4] && angle.radDen === row[5], label + " radian fraction");

  var point = math.groupPoint(angle.cos, angle.sin, 20);
  var text = textsOf(point.markup);
  assert(count(point.markup, "paren") === 2, label + " coordinate has two parentheses");
  [angle.cos, angle.sin].forEach(function (code) {
    var body = code.charAt(0) === "-" ? code.slice(1) : code;
    if (code.charAt(0) === "-") assert(text.indexOf("−") !== -1, label + " " + code + " renders a minus sign");
    if (body.charAt(0) === "√") {
      assert(count(point.markup, "surd") >= 1, label + " " + code + " has a radical with vinculum");
      assert(text.indexOf(body.slice(1).split("/")[0]) !== -1, label + " radical shows " + body.slice(1));
    }
    if (body.indexOf("/") !== -1) {
      assert(count(point.markup, "bar") >= 1, label + " " + code + " has a fraction bar");
      assert(text.indexOf(body.split("/").pop()) !== -1, label + " denominator " + body.split("/").pop());
    } else if (body.charAt(0) !== "√") {
      assert(text.indexOf(body) !== -1, label + " shows " + body);
    }
  });

  var rad = math.groupRad(angle.radNum, angle.radDen, 17);
  var radText = textsOf(rad.markup);
  if (angle.radNum === 0) assert(radText === "0", label + " radian glyph is 0");
  else {
    assert(radText.indexOf("π") !== -1, label + " radian glyph contains π");
    if (angle.radDen !== 1) {
      assert(count(rad.markup, "bar") === 1, label + " radian is a stacked fraction");
      assert(radText.indexOf(String(angle.radDen)) !== -1, label + " radian denominator");
    }
  }
  var deg = math.groupDeg(angle.deg, 16);
  assert(textsOf(deg.markup) === angle.deg + "°", label + " degree glyph");

  var value = math.groupValue(angle.tan, 18);
  if (angle.tan === "undef") assert(textsOf(value.markup) === "undefined", label + " tan undefined");
  else if (angle.tan.indexOf("√") !== -1) assert(count(value.markup, "surd") >= 1, label + " tan radical");
});

var layout = chart.computeLayout(values.ANGLES, math);
assert(layout.items.length === 48, "three labels for each of 16 angles");

var byDeg = {};
layout.items.forEach(function (item) {
  byDeg[item.deg] = byDeg[item.deg] || {};
  byDeg[item.deg][item.kind] = item;
});

EXPECTED.forEach(function (row) {
  var deg = row[0];
  var bag = byDeg[deg];
  assert(bag && bag.rad && bag.deg && bag.coord, deg + "° has radian, degree, and coordinate labels");
  var radR = Math.hypot(bag.rad.x, bag.rad.y);
  var degR = Math.hypot(bag.deg.x, bag.deg.y);
  var coordR = Math.hypot(bag.coord.x, bag.coord.y);
  assert(radR < chart.R - 12, deg + "° radian label is inside the circle (" + radR.toFixed(1) + ")");
  assert(degR > chart.R + 12, deg + "° degree label is outside the circle (" + degR.toFixed(1) + ")");
  assert(coordR > degR + 8, deg + "° coordinates sit further out than degrees");
  var radCorners = chart.cornerRadii(bag.rad);
  var degCorners = chart.cornerRadii(bag.deg);
  assert(radCorners.max < chart.R - 4, deg + "° radian glyphs stay inside the ring");
  assert(degCorners.min > chart.R + 4, deg + "° degree glyphs stay outside the ring");
  assert(bag.coord.angle.cos === row[1] && bag.coord.angle.sin === row[2], deg + "° coordinate data");
});

var hits = chart.overlaps(layout.items, 2);
if (hits.length) {
  hits.forEach(function (pair) {
    console.error(
      "overlap",
      pair[0].kind, pair[0].deg + "°",
      "with",
      pair[1].kind, pair[1].deg + "°"
    );
  });
}
assert(hits.length === 0, "no label boxes overlap (gap ≥ 2)");

var quads = chart.overlaps(layout.items.concat([
  { kind: "fixed", locked: true, deg: 45, x: Math.cos(Math.PI / 4) * 124, y: -Math.sin(Math.PI / 4) * 124, w: 36, h: 46 },
  { kind: "fixed", locked: true, deg: 135, x: Math.cos(3 * Math.PI / 4) * 124, y: -Math.sin(3 * Math.PI / 4) * 124, w: 36, h: 46 },
  { kind: "fixed", locked: true, deg: 225, x: Math.cos(5 * Math.PI / 4) * 124, y: -Math.sin(5 * Math.PI / 4) * 124, w: 46, h: 46 },
  { kind: "fixed", locked: true, deg: 315, x: Math.cos(7 * Math.PI / 4) * 124, y: -Math.sin(7 * Math.PI / 4) * 124, w: 36, h: 46 }
]), 1);
assert(quads.length === 0, "labels clear the quadrant numerals");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all passed");
