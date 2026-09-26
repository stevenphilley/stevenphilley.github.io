#!/usr/bin/env node
"use strict";

require("./annual-dial-hue.js");
const h = global.annualDialHue;
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

assert(h.normalizeHue("120") === 120, "normalize integer string");
assert(h.normalizeHue(360) === 360, "360 stays on the slider end");
assert(h.normalizeHue(361) === 360, "above 360 clamps");
assert(h.normalizeHue(-5) === 0, "below 0 clamps");
assert(h.normalizeHue("nope") === 0, "junk is 0");
assert(h.normalizeHue("") === 0, "empty is 0");
assert(h.normalizeHue(119.6) === 120, "rounds to a degree");

assert(h.spin(350, 20) === 10, "spin wraps past 360");
assert(h.spin(10, 360) === 10, "spin of 360 is a no-op");
assert(h.spin(40, 120) === 160, "spin adds the offset");
assert(h.spin(353, 120) === 113, "christmas red plus 120");

assert(h.rotateColors("#FF0000", 0) === "#FF0000", "zero offset is identity");
assert(h.rotateColors("#FF0000", 360) === "#FF0000", "360 offset is identity");
assert(h.rotateColors("#FF0000", 120) === "rgb(0, 255, 0)", "red plus 120 is green");
assert(h.rotateColors("#00FF00", 120) === "rgb(0, 0, 255)", "green plus 120 is blue");
assert(h.rotateColors("#0000FF", 120) === "rgb(255, 0, 0)", "blue plus 120 is red");
assert(h.rotateColors("#FF0000", 240) === "rgb(0, 0, 255)", "red plus 240 is blue");
assert(h.rotateColors("rgba(255, 0, 0, 0.28)", 240) === "rgba(0, 0, 255, 0.28)", "alpha is kept");
assert(h.rotateColors("hsla(0, 100%, 50%, .5)", 120) === "rgba(0, 255, 0, 0.5)", "hsla rotates");
assert(h.rotateColors("#fff", 180) === "#fff", "neutral white is left alone");
assert(h.rotateColors("none", 120) === "none", "non-colors pass through");

var aura = "radial-gradient(60% 50% at 12% 8%, rgba(255,92,214,.22), transparent 62%)";
var spun = h.rotateColors(aura, 120);
assert(spun.indexOf("radial-gradient(60% 50% at 12% 8%, ") === 0, "gradient preamble stays");
assert(spun.indexOf("transparent 62%") > 0, "transparent stop stays");
assert(spun.indexOf("rgba(255, 92, 214") === -1 && spun.indexOf("rgba(255,92,214") === -1, "pink stop is recolored");

var glow = "0 0 12px rgba(255,45,200,.65), 0 0 26px rgba(0,240,255,.28)";
assert(h.rotateColors(glow, 0) === glow, "zero keeps a two-stop glow");
var glow2 = h.rotateColors(glow, 120);
assert(glow2.indexOf("0 0 12px ") === 0, "first shadow offset stays");
assert(glow2.indexOf(", 0 0 26px ") > 0, "second shadow offset stays");
assert((glow2.match(/rgba\(/g) || []).length === 2, "both glow colors rotate");

var brass = h.rotateColors("#C8A45C", 120);
assert(brass !== "#C8A45C" && brass.indexOf("rgb(") === 0, "brass accent moves");
var back = h.rotateColors(h.rotateColors(brass, 120), 120);
assert(back.indexOf("rgb(") === 0, "full turn still a color");

assert(h.PALETTE_PROPS.indexOf("--accent") !== -1, "accent is in the palette");
assert(h.PALETTE_PROPS.indexOf("--aura") !== -1, "aura is in the palette");
assert(h.PALETTE_PROPS.indexOf("--sp-accent") === -1, "site nav tokens are not rotated");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all passed");
