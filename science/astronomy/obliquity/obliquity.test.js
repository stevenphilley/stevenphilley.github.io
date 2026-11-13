/* Obliquity desk checks. Fact-sheet angles and the classroom circles.
   Run: node science/astronomy/obliquity/obliquity.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var O = require("./obliquity.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(O.BODIES.length === 9, "eight planets and Pluto");
assert(O.bodyById("pluto").kind === "dwarf", "Pluto is the dwarf");
assert(O.bodyById("ceres") === null, "no extra body");

var expect = {
  mercury: { obl: 34, eq: 34, cmp: "0.034", seasonal: 34, polar: 89966 },
  venus: { obl: 177360, eq: 2640, cmp: "177.4", seasonal: 2640, polar: 87360 },
  earth: { obl: 23440, eq: 23440, cmp: "23.4", seasonal: 23440, polar: 66560 },
  mars: { obl: 25190, eq: 25190, cmp: "25.2", seasonal: 25190, polar: 64810 },
  jupiter: { obl: 3130, eq: 3130, cmp: "3.1", seasonal: 3130, polar: 86870 },
  saturn: { obl: 26730, eq: null, cmp: "26.7", seasonal: 26730, polar: 63270 },
  uranus: { obl: 97770, eq: 82230, cmp: "97.8", seasonal: 82230, polar: 7770 },
  neptune: { obl: 28320, eq: 28320, cmp: "28.3", seasonal: 28320, polar: 61680 },
  pluto: { obl: 119510, eq: 57470, cmp: "119.5", seasonal: 60490, polar: 29510 }
};

Object.keys(expect).forEach(function (id) {
  var b = O.bodyById(id);
  var e = expect[id];
  var sc = O.scene({ planet: id });
  assert(sc.ok, id);
  assert(b.obliquityMilli === e.obl, id + " obliquity");
  assert(b.equatorMilli === e.eq, id + " equator inclination");
  assert(b.comparison === e.cmp, id + " comparison cell");
  assert(sc.geometry.seasonalMilli === e.seasonal, id + " seasonal " + sc.geometry.seasonalLabel);
  assert(sc.geometry.polarMilli === e.polar, id + " polar " + sc.geometry.polarLabel);
  assert(sc.why.indexOf("not an ephemeris") !== -1, id + " disclaimer");
  assert(
    sc.why.indexOf("not averaged") !== -1 ||
    sc.why.indexOf("does not average") !== -1 ||
    b.equatorMilli === null,
    id + " sheets stay separate"
  );
  assert(sc.why.indexOf(O.formatMilli(e.obl)) !== -1, id + " prints its obliquity");
});

assert(O.formatMilli(34) === "0.034", "mercury label");
assert(O.formatMilli(2640) === "2.64", "venus seasonal label");
assert(O.formatMilli(82230) === "82.23", "uranus seasonal label");
assert(O.formatMilli(60490) === "60.49", "pluto subtraction");
assert(O.formatMilli(66560) === "66.56", "earth polar label");
assert(O.formatMilli(89966) === "89.966", "mercury polar label");
assert(O.formatMilli(7770) === "7.77", "uranus polar label");
assert(O.formatMilli(180000) === "180", "straight");
assert(O.formatMilli(0) === "0", "upright");

var venus = O.scene({ planet: "venus" });
assert(venus.geometry.over === true, "venus is past 90");
assert(venus.geometry.seasonalLabel === "2.64", "venus seasonal is the printed equator inclination");
assert(venus.why.indexOf("2.64") !== -1, "venus names 2.64");
assert(venus.why.indexOf("almost 180") !== -1, "venus note");
assert(venus.why.indexOf("87.36") !== -1, "venus polar circle");
assert(venus.why.indexOf("smaller than Earth") !== -1, "venus seasons are the small swing");

var uranus = O.scene({ planet: "uranus" });
assert(uranus.geometry.seasonalLabel === "82.23", "uranus seasonal");
assert(uranus.why.indexOf("almost on its side") !== -1, "uranus note");
assert(uranus.why.indexOf("bands overlap") !== -1, "uranus bands overlap");
assert(uranus.why.indexOf("7.77") !== -1, "uranus polar circle");
assert(uranus.why.indexOf("larger than Earth") !== -1, "uranus swing");

var pluto = O.scene({ planet: "pluto" });
assert(pluto.geometry.supplementLabel === "60.49", "pluto supplement");
assert(pluto.why.indexOf("which is not 57.47") !== -1, "pluto figures are not the same subtraction");
assert(pluto.why.indexOf("does not average") !== -1, "pluto not averaged");
assert(pluto.why.indexOf("60.49") !== -1 && pluto.why.indexOf("57.47") !== -1, "both pluto angles");
assert(pluto.why.indexOf("slightly down") !== -1, "pluto comparison note");
assert(pluto.tier.indexOf("Dwarf") !== -1, "pluto tier");

var saturn = O.scene({ planet: "saturn" });
assert(saturn.why.indexOf("does not print") !== -1, "saturn has no equator line");
assert(saturn.why.indexOf("does not invent") !== -1, "saturn inclination is not invented");
assert(saturn.stats[4][1] === "not printed", "saturn stat");

var earth = O.scene({ planet: "earth" });
assert(earth.geometry.seasonalLabel === "23.44", "earth");
assert(earth.why.indexOf("This is that Earth figure") !== -1, "earth match");
assert(earth.why.indexOf("66.56") !== -1, "earth polar");
assert(earth.why.indexOf("note below") !== -1, "earth points at the cycle note");
assert(earth.why.indexOf("41,000") === -1, "the slider does not invent the cycle sentence");

var mars = O.scene({ planet: "mars" });
assert(mars.why.indexOf("caption quoted below") !== -1, "mars points at the caption");
assert(mars.why.indexOf("60") === -1, "the slider does not restate the chaotic range");

var upright = O.scene({ milli: 0 });
assert(upright.custom === true, "zero is custom");
assert(upright.geometry.seasonalMilli === 0, "zero seasonal");
assert(upright.why.indexOf("no band of midnight sun") !== -1, "zero has no polar band");
assert(upright.why.indexOf("Custom angle") !== -1, "custom disclaimer");

var pole = O.scene({ milli: 90000 });
assert(pole.geometry.over === false, "90 is not the retrograde convention");
assert(pole.why.indexOf("every latitude") !== -1, "90 covers every latitude");
assert(pole.why.indexOf("±90°") !== -1, "tropics at the poles");

var meet = O.scene({ milli: 45000 });
assert(meet.why.indexOf("meet") !== -1, "45 degrees the bands meet");
assert(meet.geometry.polarLabel === "45", "polar at 45");

var flipped = O.scene({ milli: 180000 });
assert(flipped.geometry.over === true, "180 is past 90");
assert(flipped.geometry.seasonalMilli === 0, "180 has no seasonal swing");
assert(flipped.why.indexOf("0°") !== -1, "180 seasonal label");

var customEarth = O.scene({ milli: 23440 });
assert(customEarth.custom === true, "a typed earth angle stays custom");
assert(customEarth.match && customEarth.match.id === "earth", "it still notices the sheet");
assert(customEarth.why.indexOf("matches the Earth sheet") !== -1, "match sentence");

assert(O.scene({ planet: "moon" }).ok === false, "the Moon column is not a body");
assert(O.clampMilli(-5) === 0 && O.clampMilli(200000) === 180000, "clamp");
assert(O.angleFromPointer(0, 1) === 0, "drag up is 0");
assert(O.angleFromPointer(-1, 0) === 90000, "drag toward the sun is 90");
assert(O.angleFromPointer(1, 0) === 90000, "the other side is the same angle");
assert(O.angleFromPointer(0, -1) === 180000, "drag down is 180");
assert(O.angleFromPointer(0, 0) === null, "the center has no angle");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "0.034",
  "177.36",
  "2.64",
  "23.44",
  "23.4",
  "25.19",
  "3.13",
  "26.73",
  "97.77",
  "82.23",
  "28.32",
  "119.51",
  "57.47",
  "60.49",
  "177.4",
  "97.8",
  "119.5",
  "22.1",
  "24.5",
  "41,000",
  "subnav-desk",
  "subnav-phone",
  "id=\"tilt-canvas\"",
  "id=\"tilt\"",
  "not an ephemeris",
  "not averaged",
  "Educational schematic",
  "/science/astronomy/seasons/",
  "/science/astronomy/planet-days/",
  "/science/astronomy/precession/",
  "/science/astronomy/uranus/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/planetfact_notes.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/fact_notes.html",
  "https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/",
  "https://science.nasa.gov/photojournal/the-obliquity-of-mars-periodic-bedding-in-tithonium-chasma/",
  "{% include nav.html %}",
  "{% include head-layout.html %}"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf('aria-current="page">Obliquity') !== -1, "this page is current in the menu");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/obliquity/") !== -1, "hub links the desk");
assert(hub.indexOf(">Obliquity</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Obliquity</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/obliquity/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/obliquity/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/obliquity/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/obliquity/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/obliquity/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["seasons", "planet-days", "precession", "uranus"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/obliquity/") !== -1, name + " links back");
});

console.log("obliquity.test.js: ok");
console.log("Earth", earth.geometry.tropicsLabel, earth.geometry.polarLabel);
console.log("Venus", venus.geometry.seasonalLabel, "Uranus", uranus.geometry.seasonalLabel, "Pluto", pluto.geometry.seasonalLabel);
