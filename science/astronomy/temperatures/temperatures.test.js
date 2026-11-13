/* Temperatures desk checks. Fact-sheet values and the sunlight arithmetic.
   Run: node science/astronomy/temperatures/temperatures.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var T = require("./temperatures.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(T.BODIES.length === 10, "ten bodies");
assert(T.L_SUN_W === 382.8e24, "sun sheet luminosity");
assert(T.AU_M === 149597870700, "fact-note AU in metres");
assert(T.S_EARTH_WM2 === 1361.0, "earth irradiance");
assert(near(T.sigma(), 5.670374419e-8, 1e-16), "CODATA sigma");

/* Fast rotator at 1 AU, A = 0, is the sunlight-only ceiling for that distance. */
var bare = T.equilibrium(1, 0, false);
var slowBare = T.equilibrium(1, 0, true);
assert(near(slowBare / bare, Math.pow(2, 0.25), 1e-12), "slow is 2^(1/4) times fast");
assert(T.equilibrium(1, 1, false) === 0, "unit albedo is 0 K");

/* Doubling distance divides temperature by sqrt(2), because flux falls as 1/d² and T as flux^¼. */
var nearSun = T.equilibrium(1, 0.294, false);
var farSun = T.equilibrium(2, 0.294, false);
assert(near(nearSun / farSun, Math.SQRT2, 1e-12), "distance scaling");

var expect = {
  mercury: { A: 0.068, au: 0.38709893, S: 9082.7, bb: 439.6, teq: "439.5", meas: 440 },
  venus: { A: 0.77, au: 0.72333199, S: 2601.3, bb: 226.6, teq: "226.6", meas: 737 },
  earth: { A: 0.294, au: 1.00000011, S: 1361.0, bb: 254.0, teq: "255.1", meas: 288 },
  moon: { A: 0.11, au: 1.00000011, S: 1361.0, bb: 270.4, teq: "270.3", meas: null },
  mars: { A: 0.250, au: 1.52366231, S: 586.2, bb: 209.8, teq: "209.8", meas: 214 },
  jupiter: { A: 0.343, au: 5.20336301, S: 50.26, bb: 109.9, teq: "109.9", meas: 165 },
  saturn: { A: 0.342, au: 9.53707032, S: 14.82, bb: 81.0, teq: "81.2", meas: 134 },
  uranus: { A: 0.300, au: 19.19126393, S: 3.69, bb: 58.1, teq: "58.1", meas: 76 },
  neptune: { A: 0.290, au: 30.06896348, S: 1.508, bb: 46.6, teq: "46.6", meas: 72 },
  pluto: { A: 0.72, au: 39.48168677, S: 0.873, bb: 37.5, teq: "32.2", meas: null }
};

Object.keys(expect).forEach(function (id) {
  var b = T.bodyById(id);
  var e = expect[id];
  var sc = T.scene({ body: id });
  var fromS = T.round1(T.equilibriumFromIrradiance(b.irradiance, b.albedo, false));
  assert(sc.ok, id);
  assert(b.albedo === e.A, id + " albedo");
  assert(b.au === e.au, id + " au");
  assert(b.irradiance === e.S, id + " irradiance");
  assert(b.blackbody === e.bb, id + " black-body");
  assert(T.formatK(sc.teqFast) === e.teq, id + " arithmetic " + T.formatK(sc.teqFast));
  assert(sc.why.indexOf(e.teq) !== -1, id + " why prints the arithmetic");
  assert(sc.why.indexOf(String(e.bb)) !== -1, id + " why prints the sheet black-body");
  assert(sc.why.indexOf("not averaged") !== -1, id + " not averaged");
  assert(sc.why.indexOf("not a climate model") !== -1, id + " disclaimer");
  assert(sc.factor === 4, id + " opens on the fast divisor");
  if (e.meas === null) {
    assert(b.measured === null, id + " has no single measured temperature");
    assert(sc.why.indexOf("—") !== -1 || sc.why.indexOf("does not print") !== -1 || sc.why.indexOf("not a single") !== -1, id + " dash");
  } else {
    assert(b.measured.k === e.meas, id + " measured");
  }
  if (id === "jupiter") assert(fromS === 109.8, "jupiter irradiance path is 109.8, got " + fromS);
  if (id === "saturn") assert(fromS === 81.0, "saturn irradiance path matches 81.0, got " + fromS);
  if (id === "pluto") assert(fromS === 32.2, "pluto irradiance path stays 32.2, got " + fromS);
});

var earth = T.scene({ body: "earth" });
assert(earth.why.indexOf("32.9") !== -1, "earth gap versus the arithmetic");
assert(earth.why.indexOf("34") !== -1, "earth gap versus the sheet black-body");
assert(earth.why.indexOf("255.1") !== -1 && earth.why.indexOf("254.0") !== -1 && earth.why.indexOf("288") !== -1, "earth three temperatures");
assert(T.formatC(earth.teq) === "−18.0", "earth celsius " + T.formatC(earth.teq));
assert(T.formatF(earth.teq) === "−0.4", "earth fahrenheit " + T.formatF(earth.teq));

var venus = T.scene({ body: "venus" });
assert(venus.why.indexOf("510.4") !== -1, "venus greenhouse excess");
assert(venus.why.indexOf("737") !== -1, "venus average");

var mars = T.scene({ body: "mars" });
assert(mars.why.indexOf("4.2") !== -1, "mars small gap");
assert(mars.why.indexOf("~214") !== -1, "mars tilde stays");
assert(mars.why.indexOf("−65") !== -1, "mars comparison cell stays separate");

var moon = T.scene({ body: "moon" });
assert(moon.why.indexOf("does not print an average") !== -1, "moon dash");
assert(moon.why.indexOf("95 K to 390 K") !== -1, "moon diurnal range");
assert(moon.why.indexOf("does not subtract −20") !== -1, "moon comparison is not a gap");
assert(moon.why.indexOf("0.3844") !== -1, "moon distance is not the Earth–Moon axis");
assert(moon.body.au === T.bodyById("earth").au, "moon uses earth's distance");

var pluto = T.scene({ body: "pluto" });
assert(pluto.why.indexOf("does not return 37.5") !== -1, "pluto mismatch is stated");
assert(pluto.why.indexOf("24 to 38") !== -1, "pluto range");
assert(pluto.why.indexOf("39.236") !== -1, "pluto ratio column stays separate");

var jupiter = T.scene({ body: "jupiter" });
assert(jupiter.why.indexOf("109.8") !== -1, "jupiter irradiance tenth");
assert(jupiter.why.indexOf("not a greenhouse excess") !== -1, "jupiter is not a greenhouse gap");
assert(jupiter.why.indexOf("55.1") !== -1, "jupiter kelvin gap");

var saturn = T.scene({ body: "saturn" });
assert(saturn.why.indexOf("81.2") !== -1 && saturn.why.indexOf("81.0") !== -1, "saturn both paths");
assert(saturn.why.indexOf("9.573") !== -1, "saturn ratio column");

var slowEarth = T.scene({ body: "earth", slow: true, greenhouse: true });
assert(slowEarth.factor === 2, "slow divisor");
assert(T.formatK(slowEarth.teq) === "303.4", "earth slow " + T.formatK(slowEarth.teq));
assert(slowEarth.why.indexOf("does not add a term") !== -1, "blanket is not in the formula");
assert(slowEarth.why.indexOf("254.0") !== -1, "slow mode still quotes the fast sheet number");
assert(near(slowEarth.teq / earth.teqFast, Math.pow(2, 0.25), 1e-12), "earth slow ratio");

/* 1361.0 / a² matches Pluto’s printed irradiance at three decimals. The 37.5 K does not follow. */
var plutoFlux = 1361.0 / (39.48168677 * 39.48168677);
assert(plutoFlux.toFixed(3) === "0.873", "pluto irradiance matches the J2000 axis, got " + plutoFlux.toFixed(3));

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "not a climate model",
  "Classroom energy-balance model",
  "382.8",
  "255.1",
  "254.0",
  "32.9",
  "510.4",
  "439.5",
  "439.6",
  "270.3",
  "270.4",
  "109.8",
  "81.2",
  "32.2",
  "37.5",
  "subnav-desk",
  "subnav-phone",
  "id=\"temp-canvas\"",
  "id=\"au\"",
  "id=\"alb\"",
  "Greenhouse blanket",
  "Fast · 4",
  "Slow · 2",
  "not averaged",
  "/science/astronomy/habitable-zone/",
  "/science/astronomy/atmospheric-escape/",
  "/science/astronomy/frost-line/",
  "/science/astronomy/venus/",
  "/science/astronomy/obliquity/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html",
  "https://science.nasa.gov/missions/hubble/nasa-oxford-discover-warmer-uranus-than-once-thought/",
  "{% include nav.html %}",
  "{% include head-layout.html %}"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf('aria-current="page">Temperatures') !== -1, "this page is current");

/* The static table’s arithmetic cells are the fast-rotator rounding, not a second formula. */
T.BODIES.forEach(function (b) {
  var cell = "<td>" + T.formatK(T.equilibrium(b.au, b.albedo, false)) + "</td>";
  assert(html.indexOf(cell) !== -1, "table arithmetic " + b.id + " " + cell);
});

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/temperatures/") !== -1, "hub links the desk");
assert(hub.indexOf(">Temperatures</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Temperatures</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/temperatures/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Temperatures</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/temperatures/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/temperatures/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/temperatures/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/temperatures/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["habitable-zone", "atmospheric-escape", "frost-line", "venus", "obliquity"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/temperatures/") !== -1, name + " links back");
});

console.log("temperatures.test.js: ok");
console.log("Earth", T.formatK(earth.teqFast), "Venus", T.formatK(venus.teq), "Pluto", T.formatK(pluto.teqFast));
