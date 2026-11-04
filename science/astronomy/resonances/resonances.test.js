/* Resonance checks. Distances and periods come from the formulas, not stored results.
   Run: node science/astronomy/resonances/resonances.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var R = require("./resonances.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(R.YEAR_DAYS === 365.256, "year unit");
assert(R.planetById("jupiter").au === 5.20336301, "Jupiter AU");
assert(R.planetById("jupiter").days === 4332.589, "Jupiter period");
assert(R.planetById("mars").au === 1.52366231, "Mars AU");
assert(R.planetById("neptune").days === 60189.018, "Neptune period");
assert(R.planetById("pluto").au === 39.48168677 && R.planetById("pluto").days === 90560, "Pluto sheet");
assert(R.moonById("io").days === 1.769138 && R.moonById("io").axis === 421.8, "Io");
assert(R.moonById("europa").days === 3.551181 && R.moonById("europa").axis === 671.1, "Europa");
assert(R.moonById("ganymede").days === 7.154553 && R.moonById("ganymede").axis === 1070.4, "Ganymede");
assert(R.trappistById("e").days === 6.101013, "TRAPPIST-1 e");
assert(R.trappistById("b").days === 1.510826 && R.trappistById("h").days === 18.772866, "TRAPPIST ends");

var jup = R.planetById("jupiter");
var gap = R.resonantOrbit(jup, 3, 1, "interior");
assert(near(gap.periodDays, 4332.589 / 3, 1e-9), "3:1 period");
assert(near(gap.au, 5.20336301 * Math.pow(1 / 3, 2 / 3), 1e-12), "3:1 axis");
assert(gap.rays.length === 2, "3:1 has two conjunctions");
assert(near(gap.rays[1], Math.PI, 1e-12), "3:1 rays are opposite");

function expectBelt(p, q) {
  var orbit = R.resonantOrbit(jup, p, q, "interior");
  var scene = R.scene({ mode: "solar", planetId: "jupiter", p: p, q: q, side: "interior" });
  assert(scene.ok, p + ":" + q + " scene");
  assert(scene.text.au === orbit.au.toFixed(6) + " AU", p + ":" + q + " au text");
  assert(scene.text.period === R.formatDays(orbit.periodDays), p + ":" + q + " period text");
  assert(scene.beltId === p + "-" + q, "belt id " + p + ":" + q);
  return scene;
}

var s31 = expectBelt(3, 1);
var s52 = expectBelt(5, 2);
var s73 = expectBelt(7, 3);
var s21 = expectBelt(2, 1);
var s32 = expectBelt(3, 2);
assert(s31.text.au === "2.501516 AU" && s31.text.period === "1,444.196 days", "3:1 display");
assert(s52.text.au === "2.824820 AU" && s52.motion.rays.length === 3, "5:2");
assert(s73.text.au === "2.957783 AU" && s73.motion.rays.length === 4, "7:3");
assert(s21.text.au === "3.277913 AU" && s21.motion.rays.length === 1, "2:1");
assert(s32.text.au === "3.970909 AU" && s32.tier.indexOf("Hilda") === 0, "Hilda");
assert(near(s52.motion.rays[1], 2 * Math.PI / 3, 1e-12), "5:2 spacing");

var reduced = R.scene({ mode: "solar", planetId: "jupiter", p: 4, q: 2, side: "interior" });
assert(reduced.beltId === "2-1" && reduced.text.au === s21.text.au, "4:2 reduces to 2:1");
assert(R.scene({ mode: "solar", planetId: "jupiter", p: 1, q: 3, side: "interior" }).ok === false, "p must exceed q");
assert(R.scene({ mode: "solar", planetId: "jupiter", p: 3.5, q: 1, side: "interior" }).ok === false, "whole numbers");
assert(R.scene({ preset: "nope" }).ok === false, "unknown preset");

var np = R.scene(R.stateFromPreset("neptune-pluto"));
var exact = R.resonantOrbit(R.planetById("neptune"), 3, 2, "exterior");
assert(near(np.periodDays, 60189.018 * 3 / 2, 1e-6), "exact 3:2 period");
assert(np.text.au === exact.au.toFixed(6) + " AU", "exact 3:2 axis text");
assert(np.why.indexOf("90,560 days") !== -1 && np.why.indexOf("39.48168677 AU") !== -1, "Pluto sheet quoted");
assert(np.why.indexOf("1.504593") !== -1, "printed period ratio");
var printed = 90560 / 60189.018;
assert(near(39.48168677 / 30.06896348, Math.pow(printed, 2 / 3), 2e-5), "Kepler maps Pluto’s printed periods");

var io = R.moonById("io");
var eu = R.moonById("europa");
var ga = R.moonById("ganymede");
var residual = R.laplaceResidual(io.days, eu.days, ga.days);
assert(near(residual, 1 - 3 * (io.days / eu.days) + 2 * (io.days / ga.days), 0), "Laplace is the formula");
assert(Math.abs(residual) < 1e-6, "Laplace combination is tiny");
var moons = R.scene(R.stateFromPreset("laplace-io"));
assert(moons.text.laplace === R.formatSci(residual), "Laplace text");
assert(moons.text.ratio === (eu.days / io.days).toFixed(6), "Europa/Io");
assert(moons.text.axis === (eu.axis / io.axis).toFixed(6), "cited axis ratio");
assert(moons.text.kepler === Math.pow(eu.days / io.days, 2 / 3).toFixed(6), "Kepler axis ratio");
assert(moons.motion.bodies.length === 2, "two bodies");
assert(moons.motion.bodies[0].days === io.days && moons.motion.bodies[1].days === eu.days, "printed periods, not 2:1");

var pairs = [
  ["trappist-bc", "8:5"],
  ["trappist-cd", "5:3"],
  ["trappist-de", "3:2"],
  ["trappist-ef", "3:2"],
  ["trappist-fg", "4:3"],
  ["trappist-gh", "3:2"]
];
var pi;
for (pi = 0; pi < pairs.length; pi++) {
  var row = R.scene(R.stateFromPreset(pairs[pi][0]));
  assert(row.ok && row.text.nearest === pairs[pi][1], pairs[pi][0] + " nearest " + row.text.nearest);
}

var belt = R.belt();
assert(belt.marks.length === 5, "five belt marks");
assert(belt.marks[0].au < belt.marks[1].au && belt.marks[3].au < belt.marks[4].au, "gaps then Hilda, outward");
assert(belt.marks[4].au < belt.jupiter.au && belt.marks[0].au > belt.mars.au, "between Mars and Jupiter");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/resonances/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("resonances.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(R.limitsNote()) !== -1, "disclaimer");
assert(html.indexOf(s31.why) !== -1, "3:1 explanation is on the page");
assert(html.indexOf("5.20336301") !== -1 && html.indexOf("4,332.589") !== -1, "Jupiter sheet on the page");
assert(html.indexOf("1.769138") !== -1 && html.indexOf("3.551181") !== -1 && html.indexOf("7.154553") !== -1, "Galilean periods");
assert(html.indexOf("1.510826") !== -1 && html.indexOf("18.772866") !== -1, "TRAPPIST periods");
assert(html.indexOf("90,560") !== -1 && html.indexOf("39.48168677") !== -1, "Pluto sheet");
assert(html.indexOf("60,189.018") !== -1, "Neptune period");
assert(html.indexOf("156,929") !== -1, "JPL histogram count");
assert(html.indexOf('data-preset="kirkwood-3-1"') !== -1, "3:1 preset");
assert(html.indexOf('data-preset="hilda"') !== -1, "Hilda preset");
assert(html.indexOf('data-preset="neptune-pluto"') !== -1, "Neptune–Pluto preset");
assert(html.indexOf('data-preset="laplace-io"') !== -1, "Laplace preset");
assert(html.indexOf('data-preset="trappist-bc"') !== -1, "TRAPPIST preset");
assert(html.indexOf('id="orbit-canvas"') !== -1 && html.indexOf('id="belt-canvas"') !== -1, "canvases");
assert(html.indexOf("/science/astronomy/kepler/") !== -1, "links Kepler");
assert(html.indexOf("Not an ephemeris") !== -1, "educational limit");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/resonances/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/resonances/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/resonances/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/resonances/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/resonances/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/resonances/") found = true;
  });
});
assert(found, "whats-new lists the desk");

console.log("resonances.test.js: ok");
console.log("3:1", s31.text.period, s31.text.au, "Hilda", s32.text.au);
console.log("Laplace", moons.text.laplace, "Europa/Io", moons.text.ratio);
console.log("Neptune–Pluto exact", np.text.period, np.text.au);
