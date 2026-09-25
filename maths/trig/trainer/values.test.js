#!/usr/bin/env node
"use strict";

var api = require("./values.js");

var failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    var t = a % b;
    a = b;
    b = t;
  }
  return a;
}

/* Independent of values.js. A wrong fraction string fails even if a shared
   helper would have parsed it the same way. */
function parse(code) {
  if (code === "undef") return null;
  var sign = 1;
  var body = code;
  if (body.charAt(0) === "-") {
    sign = -1;
    body = body.slice(1);
  }
  var table = {
    "0": 0,
    "1": 1,
    "1/2": 1 / 2,
    "√2/2": Math.sqrt(2) / 2,
    "√3/2": Math.sqrt(3) / 2,
    "√3/3": Math.sqrt(3) / 3,
    "√3": Math.sqrt(3)
  };
  if (!Object.prototype.hasOwnProperty.call(table, body)) {
    throw new Error("not an allowed exact value: " + code);
  }
  return sign * table[body];
}

var COS_SIN = {
  "0": 1, "1": 1, "-1": 1,
  "1/2": 1, "-1/2": 1,
  "√2/2": 1, "-√2/2": 1,
  "√3/2": 1, "-√3/2": 1
};
var TAN = {
  "0": 1, "1": 1, "-1": 1,
  "√3/3": 1, "-√3/3": 1,
  "√3": 1, "-√3": 1,
  "undef": 1
};

/* Written out again so the committed table is checked field by field. */
var EXPECTED = [
  [0, 0, 1, "1", "0", "0"],
  [30, 1, 6, "√3/2", "1/2", "√3/3"],
  [45, 1, 4, "√2/2", "√2/2", "1"],
  [60, 1, 3, "1/2", "√3/2", "√3"],
  [90, 1, 2, "0", "1", "undef"],
  [120, 2, 3, "-1/2", "√3/2", "-√3"],
  [135, 3, 4, "-√2/2", "√2/2", "-1"],
  [150, 5, 6, "-√3/2", "1/2", "-√3/3"],
  [180, 1, 1, "-1", "0", "0"],
  [210, 7, 6, "-√3/2", "-1/2", "√3/3"],
  [225, 5, 4, "-√2/2", "-√2/2", "1"],
  [240, 4, 3, "-1/2", "-√3/2", "√3"],
  [270, 3, 2, "0", "-1", "undef"],
  [300, 5, 3, "1/2", "-√3/2", "-√3"],
  [315, 7, 4, "√2/2", "-√2/2", "-1"],
  [330, 11, 6, "√3/2", "-1/2", "-√3/3"]
];

var angles = api.ANGLES;
assert(angles.length === 16, "sixteen standard angles");
assert(EXPECTED.length === 16, "expected table has sixteen rows");

var seenDeg = {};
angles.forEach(function (angle, i) {
  var row = EXPECTED[i];
  var label = angle.deg + "°";
  assert(angle.deg === row[0], label + " degree");
  assert(!seenDeg[angle.deg], label + " is unique");
  seenDeg[angle.deg] = true;

  var g = gcd(angle.deg, 180);
  var n = angle.deg / g;
  var d = 180 / g;
  assert(angle.radNum === n && angle.radDen === d, label + " radian fraction is " + n + "/" + d);
  assert(angle.radNum === row[1] && angle.radDen === row[2], label + " stored radian pair matches the table");

  assert(angle.cos === row[3], label + " cos is " + row[3] + " (got " + angle.cos + ")");
  assert(angle.sin === row[4], label + " sin is " + row[4] + " (got " + angle.sin + ")");
  assert(angle.tan === row[5], label + " tan is " + row[5] + " (got " + angle.tan + ")");
  assert(COS_SIN[angle.cos], label + " cos is an allowed exact value");
  assert(COS_SIN[angle.sin], label + " sin is an allowed exact value");
  assert(TAN[angle.tan], label + " tan is an allowed exact value");

  var rad = angle.deg * Math.PI / 180;
  var cos = parse(angle.cos);
  var sin = parse(angle.sin);
  assert(Math.abs(cos - Math.cos(rad)) < 1e-9, label + " cos matches Math.cos");
  assert(Math.abs(sin - Math.sin(rad)) < 1e-9, label + " sin matches Math.sin");
  assert(Math.abs(cos * cos + sin * sin - 1) < 1e-9, label + " is on the unit circle");
  if (angle.tan === "undef") {
    assert(Math.abs(Math.cos(rad)) < 1e-9, label + " tan is undefined because cos is 0");
  } else {
    assert(Math.abs(parse(angle.tan) - sin / cos) < 1e-9, label + " tan = sin/cos");
  }

  var quad = angle.deg === 0 || angle.deg === 90 || angle.deg === 180 || angle.deg === 270
    ? 0
    : angle.deg < 90 ? 1 : angle.deg < 180 ? 2 : angle.deg < 270 ? 3 : 4;
  assert(angle.quad === quad, label + " quadrant");
  var ref = angle.deg <= 90 ? angle.deg
    : angle.deg <= 180 ? 180 - angle.deg
    : angle.deg <= 270 ? angle.deg - 180
    : 360 - angle.deg;
  assert(angle.ref === ref, label + " reference angle " + ref);

  if (quad === 1) {
    assert(cos > 0 && sin > 0 && parse(angle.tan) > 0, label + " quadrant I signs (all positive)");
  } else if (quad === 2) {
    assert(cos < 0 && sin > 0 && parse(angle.tan) < 0, label + " quadrant II signs (sine only)");
  } else if (quad === 3) {
    assert(cos < 0 && sin < 0 && parse(angle.tan) > 0, label + " quadrant III signs (tangent only)");
  } else if (quad === 4) {
    assert(cos > 0 && sin < 0 && parse(angle.tan) < 0, label + " quadrant IV signs (cosine only)");
  }
});

var q1 = api.quadrantOne();
assert(q1.map(function (a) { return a.deg; }).join(",") === "0,30,45,60,90", "quadrant I starter is 0, 30, 45, 60, 90");

function keysOf(question, keyFn) {
  var keys = question.options.map(keyFn);
  assert(question.options.length === 4, "four choices");
  assert(question.answer >= 0 && question.answer < 4, "answer index in range");
  assert(keys[question.answer] === keyFn(question.options[question.answer]), "answer index matches");
  assert(new Set(keys).size === 4, "choices are distinct");
  return keys;
}

var zeroRng = function () { return 0; };

angles.forEach(function (angle) {
  var point = api.pointQuestion(angle, zeroRng);
  var pointKeys = keysOf(point, function (p) { return p.cos + "|" + p.sin; });
  assert(pointKeys.indexOf(angle.cos + "|" + angle.sin) !== -1, angle.deg + "° point choices include the point");
  point.options.forEach(function (option) {
    assert(COS_SIN[option.cos] && COS_SIN[option.sin], angle.deg + "° distractor point uses exact values");
  });

  ["sin", "cos", "tan"].forEach(function (fn) {
    var value = api.valueQuestion(angle, fn, zeroRng);
    var valueKeys = keysOf(value, function (v) { return v; });
    assert(valueKeys[value.answer] === angle[fn], angle.deg + "° " + fn + " answer");
    var allowed = fn === "tan" ? TAN : COS_SIN;
    value.options.forEach(function (option) {
      assert(allowed[option], angle.deg + "° " + fn + " choice " + option + " is allowed");
    });
  });

  [q1, angles].forEach(function (pool) {
    if (pool.indexOf(angle) === -1) return;
    var named = api.angleQuestion(angle, pool, zeroRng);
    var nameKeys = keysOf(named, function (item) { return String(item.deg); });
    assert(nameKeys.indexOf(String(angle.deg)) !== -1, angle.deg + "° angle choices include itself");
    named.options.forEach(function (option) {
      assert(pool.indexOf(option) !== -1, angle.deg + "° distractor stays inside the active set");
    });
  });
});

var thirty = angles[1];
var thirtyPoint = api.pointQuestion(thirty, zeroRng);
assert(
  thirtyPoint.options.some(function (p) { return p.cos === "1/2" && p.sin === "√3/2"; }),
  "30° distractors include the √3/2 ↔ 1/2 coordinate swap"
);
var sin30 = api.valueQuestion(thirty, "sin", zeroRng);
assert(sin30.options.indexOf("√3/2") !== -1, "sin 30° distractors include √3/2");
assert(sin30.options.indexOf("-1/2") !== -1, "sin 30° distractors include the sign error");
var tan30 = api.valueQuestion(thirty, "tan", zeroRng);
assert(tan30.options.indexOf("√3") !== -1, "tan 30° distractors include √3, the reciprocal mix-up");
assert(api.swapHalf("√3/3") === "√3" && api.swapHalf("-√3") === "-√3/3", "swap keeps the sign on tan reciprocals");
assert(api.neg("-√2/2") === "√2/2" && api.neg("0") === "0" && api.neg("undef") === "undef", "negation of exact values");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all passed");
