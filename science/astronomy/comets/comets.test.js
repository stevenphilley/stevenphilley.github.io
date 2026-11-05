/* Comet-orbit checks. Distances, speeds, and the tail geometry come from the formulas.
   Run: node science/astronomy/comets/comets.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var C = require("./comets.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(C.AU_M === 149597870700, "exact AU");
assert(C.SUN_GM === 132712 * 1e6, "Sun fact-sheet GM");
assert(C.SUN_RADIUS_KM === 695700, "Sun radius");
assert(C.YEAR_DAYS === 365.256, "year unit");
assert(C.WATER_AU === 3, "water-ice line");

var ids = ["halley", "encke", "67p", "hale-bopp"];
ids.forEach(function (id) {
  var p = C.presetById(id);
  assert(p && p.schematic === false, id + " is a catalog preset");
  assert(near(p.q / (1 - p.e), p.a, 1e-12), id + " a = q/(1−e)");
  assert(near(p.a * (1 - p.e), p.q, 1e-12), id + " q = a(1−e)");
  assert(near(p.a * (1 + p.e), p.aphelion, 1e-9), id + " aphelion is a(1+e)");
  assert(p.e < 1, id + " is a bound ellipse");
  var mean = [0, 0.2, 1.2, Math.PI, 2.4, -0.4];
  mean.forEach(function (M) {
    var E = C.eccentricFromMean(M, p.e);
    var wrapped = Math.atan2(Math.sin(M), Math.cos(M));
    assert(near(E - p.e * Math.sin(E), wrapped, 1e-10), id + " Kepler residual at " + M);
  });
});

var hal = C.scene(C.stateFromPreset("halley"));
assert(hal.ok, "Halley scene");
assert(hal.text.r === "0.574864 AU" && hal.text.v === "55.108 km/s", "Halley perihelion readout");
assert(hal.text.period === "75.914 years" && hal.text.a === "17.928635 AU", "Halley period and axis");
assert(hal.water === "inside", "Halley perihelion is inside 3 AU");
assert(near(hal.r, 0.5748638313743413, 1e-12), "Halley r is q");
assert(near(hal.v, C.speed(hal.norm.a, hal.norm.q), 0), "speed is vis-viva");

var apo = C.scene({ preset: "halley", mode: "q", q: C.presetById("halley").q, e: C.presetById("halley").e, meanDeg: 180 });
assert(apo.water === "outside" && apo.text.v === "0.898 km/s", "Halley aphelion is outside 3 AU and slow");
assert(apo.tailFraction < hal.tailFraction, "tail is longer at perihelion");
assert(near(C.tailFraction(hal.norm.q, hal.norm.q), 1, 0), "full tail at perihelion");

var enc = C.scene(C.stateFromPreset("encke"));
assert(enc.ok && enc.text.r === "0.339459 AU" && enc.text.v === "69.475 km/s", "Encke perihelion");
assert(enc.text.period === "3.304 years", "Encke period");
var encApo = C.scene({ preset: "encke", mode: "q", q: C.presetById("encke").q, e: C.presetById("encke").e, meanDeg: 180 });
assert(encApo.water === "outside", "Encke aphelion is beyond 3 AU");

var p67 = C.scene(C.stateFromPreset("67p"));
assert(p67.ok && p67.text.r === "1.243266 AU" && p67.text.v === "34.218 km/s" && p67.text.period === "6.442 years", "67P perihelion");

var hb = C.scene(C.stateFromPreset("hale-bopp"));
assert(hb.ok && hb.text.r === "0.890538 AU" && hb.text.v === "44.580 km/s" && hb.text.period === "2,363.496 years", "Hale–Bopp perihelion");
assert(hb.water === "inside", "Hale–Bopp perihelion is inside 3 AU");

var room = C.scene(C.stateFromPreset("classroom"));
assert(room.ok && room.norm.a === 2.5 && room.norm.ra === 4 && room.text.v === "37.675 km/s", "classroom ellipse");
assert(room.preset.schematic === true, "classroom is not a catalog orbit");

assert(C.waterState(2.9) === "inside" && C.waterState(3) === "at" && C.waterState(3.1) === "outside", "water line");

var ion = C.ionEnd(hal.pos.x, hal.pos.y, 1.5);
assert(ion.x > hal.pos.x && near(ion.y, 0, 1e-9), "ion tail leaves perihelion away from the Sun");
var cross = hal.pos.x * (ion.y - hal.pos.y) - hal.pos.y * (ion.x - hal.pos.x);
assert(near(cross, 0, 1e-9), "ion tail is radial");

var dust = C.dustPoint(hal.norm.a, hal.norm.e, hal.E, 0.2, 0.1);
assert(dust.y < 0 && dust.x > 0, "dust lags behind perihelion");
assert(dust.rDust > dust.rOrbit, "dust is pushed outward");

assert(C.scene({ mode: "q", q: 0, e: 0.5 }).ok === false, "q required");
assert(C.scene({ mode: "q", q: 1, e: 1 }).ok === false, "parabola rejected");
assert(C.scene({ mode: "q", q: 1, e: 1.2 }).ok === false, "hyperbola rejected");
assert(C.scene({ mode: "a", a: 1, e: 0 }).ok === true, "circle from a and e");
var fromA = C.scene({ mode: "a", a: 17.92863504856923, e: 0.9679359956953211, meanDeg: 0 });
assert(fromA.ok && near(fromA.norm.q, 0.5748638313743413, 1e-12), "q from a and e");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/comets/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("comets.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(C.limitsNote()) !== -1, "disclaimer");
assert(html.indexOf(hal.why) !== -1, "Halley explanation is on the page");
assert(html.indexOf(enc.why) !== -1, "Encke explanation is on the page");
assert(html.indexOf(p67.why) !== -1, "67P explanation is on the page");
assert(html.indexOf(hb.why) !== -1, "Hale–Bopp explanation is on the page");
assert(html.indexOf(room.why) !== -1, "classroom explanation is on the page");
assert(html.indexOf("0.5748638313743413") !== -1 && html.indexOf("0.9679359956953211") !== -1, "Halley elements");
assert(html.indexOf("0.3394588840071771") !== -1 && html.indexOf("0.846979230409067") !== -1, "Encke elements");
assert(html.indexOf("1.243265640702404") !== -1 && html.indexOf("0.6409081308996354") !== -1, "67P elements");
assert(html.indexOf("0.890537663547794") !== -1 && html.indexOf("0.9949810027633206") !== -1, "Hale–Bopp elements");
assert(html.indexOf('data-preset="halley"') !== -1, "Halley preset");
assert(html.indexOf('data-preset="encke"') !== -1, "Encke preset");
assert(html.indexOf('data-preset="67p"') !== -1, "67P preset");
assert(html.indexOf('data-preset="hale-bopp"') !== -1, "Hale–Bopp preset");
assert(html.indexOf('data-preset="classroom"') !== -1, "classroom preset");
assert(html.indexOf('id="orbit-canvas"') !== -1, "canvas");
assert(html.indexOf("/science/astronomy/vis-viva/") !== -1, "links vis-viva");
assert(html.indexOf("/science/astronomy/kepler/") !== -1, "links Kepler");
assert(html.indexOf("Not a JPL Horizons ephemeris") !== -1, "educational limit");
assert(html.indexOf("Educational") !== -1 || html.indexOf("educational") !== -1, "educational disclaimer");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/comets/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/comets/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/comets/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/comets/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/comets/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/comets/") found = true;
  });
});
assert(found, "whats-new lists the desk");

console.log("comets.test.js: ok");
console.log("Halley", hal.text.r, hal.text.v, hal.text.period);
console.log("Encke", enc.text.r, enc.text.v, enc.text.period);
console.log("67P", p67.text.r, p67.text.v, p67.text.period);
console.log("Hale–Bopp", hb.text.r, hb.text.v, hb.text.period);
