/* Tidal-locking checks. t_lock = (ω a^6 I Q) / (3 G m_p^2 k2 R^5).
   Run: node science/astronomy/tidal-locking/tidal-locking.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var TL = require("./tidal-locking.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(TL.G === 6.67430e-11, "2022 CODATA G");
assert(TL.AU_M === 149597870700, "IAU au");
assert(TL.YEAR_S === 31557600, "Julian year");
assert(TL.EARTH_MASS_KG === 5.9722e24, "Earth sheet mass");
assert(TL.SUN_MASS_KG === 1988400 * 1e24, "Sun sheet mass");
assert(TL.JUPITER_MASS_KG === 1898.13 * 1e24, "Jupiter sheet mass");
assert(TL.EARTH_RADIUS_M === 6371000, "Earth volumetric radius");
assert(TL.ASSUMED_Q === 100 && TL.ASSUMED_K2 === 0.3 && TL.ASSUMED_SPIN_H === 13.5, "Hinkel assumptions");
assert(TL.ASSUMED_F === 0.4, "uniform-sphere factor");
assert(near(TL.PLUTO_ROT_H / 24, TL.CHARON_DAYS, 0), "Pluto rotation matches Charon");
assert((87.969 / (1407.6 / 24)).toFixed(4) === "1.4999", "Mercury near 3/2");

/* Hand arithmetic. Independent of the module helpers. */
function handYears(p) {
  var a = p.aKm * 1000;
  var r = p.radiusKm * 1000;
  var omega = (2 * Math.PI) / (p.spinH * 3600);
  var inertia = p.f * p.massKg * r * r;
  var seconds = (omega * Math.pow(a, 6) * inertia * p.q) / (3 * TL.G * p.partnerKg * p.partnerKg * p.k2 * Math.pow(r, 5));
  return seconds / 31557600;
}

var moon = TL.presetById("moon");
var moonYears = handYears(moon);
assert(near(TL.lockYears(moon), moonYears, moonYears * 1e-12), "module matches hand arithmetic");
assert(TL.scene(moon).timeText === "3.40464 million years", "moon text " + TL.scene(moon).timeText);
assert(TL.scene(moon).timeRaw === "3.40464 \u00d7 10^6", "moon raw " + TL.scene(moon).timeRaw);
assert(TL.scene(moon).halfText === "53.1974 thousand years", "half distance " + TL.scene(moon).halfText);
assert(near(TL.scene(moon).halfYears * 64, TL.scene(moon).years, TL.scene(moon).years * 1e-9), "half distance is /64");

var doubled = handYears({
  spinH: moon.spinH,
  aKm: moon.aKm * 2,
  massKg: moon.massKg,
  radiusKm: moon.radiusKm,
  partnerKg: moon.partnerKg,
  q: moon.q,
  k2: moon.k2,
  f: moon.f
});
assert(near(doubled / moonYears, 64, 1e-9), "a^6: double distance multiplies by 64");
assert(near(handYears(Object.assign({}, moon, { q: moon.q * 10 })) / moonYears, 10, 1e-9), "Q scales linearly");
assert(near(handYears(Object.assign({}, moon, { k2: moon.k2 * 2 })) / moonYears, 0.5, 1e-9), "k2 scales inversely");
assert(near(handYears(Object.assign({}, moon, { partnerKg: moon.partnerKg * 2 })) / moonYears, 0.25, 1e-9), "partner mass squared");
assert(near(handYears(Object.assign({}, moon, { spinH: moon.spinH * 2 })) / moonYears, 0.5, 1e-9), "slower initial spin is a shorter time");
assert(near(handYears(Object.assign({}, moon, { radiusKm: moon.radiusKm * 2 })) / moonYears, 0.125, 1e-9), "radius: I~R^2 and R^5");

var io = TL.scene(TL.presetById("io"));
var mercury = TL.scene(TL.presetById("mercury"));
var proxima = TL.scene(TL.presetById("proxima"));
assert(io.timeText === "63.0232 years", "io " + io.timeText);
assert(io.halfText === "359.675 days", "io half " + io.halfText);
assert(mercury.timeText === "517.565 million years", "mercury " + mercury.timeText);
assert(mercury.halfText === "8.08695 million years", "mercury half " + mercury.halfText);
assert(mercury.auText === "0.387098 AU", "mercury au " + mercury.auText);
assert(proxima.timeText === "154.634 thousand years", "proxima " + proxima.timeText);
assert(proxima.halfText === "2.41615 thousand years", "proxima half " + proxima.halfText);
assert(proxima.auText === "0.0484800 AU", "proxima au " + proxima.auText);
assert(io.why.indexOf("assumed") !== -1, "Io flags the assumption");
assert(mercury.why.indexOf("not 1:1") !== -1, "Mercury is not synchronous");
assert(mercury.why.indexOf("1.4999") !== -1, "Mercury ratio");
assert(mercury.why.indexOf("0.38709893") !== -1, "J2000 axis stays beside");
assert(proxima.why.indexOf("minimum mass") !== -1, "Proxima mass is a minimum");
assert(proxima.why.indexOf("estimate") !== -1, "Proxima radius is an estimate");
assert(moon && TL.scene(moon).why.indexOf("Order of magnitude only") !== -1, "caveat");
assert(TL.scene(moon).why.indexOf("very uncertain") !== -1, "Q and k2 caveat");
assert(TL.scene(moon).why.indexOf("not substituted") !== -1, "factor of two stays out");
assert(TL.disclaimer().indexOf("Not a tidal-evolution model") !== -1, "disclaimer");
assert(!TL.scene({ spinH: 0, aKm: 1, massKg: 1, radiusKm: 1, partnerKg: 1, q: 1, k2: 1, f: 0.4 }).ok, "rejects a zero spin");

var line = TL.series(moon, 5);
assert(line.length === 5, "series length");
assert(near((line[4].years / line[0].years) / Math.pow(line[4].aKm / line[0].aKm, 6), 1, 1e-9), "series is a^6");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function has(bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
}
[
  "3.40464 million years",
  "53.1974 thousand years",
  "63.0232 years",
  "359.675 days",
  "517.565 million years",
  "8.08695 million years",
  "154.634 thousand years",
  "2.41615 thousand years",
  "1.4999",
  "0.394",
  "0.35",
  "0.04848",
  "6.3872",
  "655.720",
  "1407.6",
  "13.5",
  "Order of magnitude only",
  "Q and k2 are very uncertain",
  "Not a tidal-evolution model",
  "not substituted",
  "not 1:1",
  "minimum mass",
  "estimate",
  "subnav-desk",
  "subnav-phone",
  "id=\"bulge-canvas\"",
  "id=\"lock-chart\"",
  "id=\"spin\"",
  "id=\"spin-num\"",
  "id=\"axis\"",
  "id=\"quality\"",
  "id=\"love\"",
  "id=\"inertia\"",
  "Sections \u00b7 Tidal locking",
  "aria-current=\"page\">Tidal locking",
  "/science/astronomy/tides/",
  "/science/astronomy/libration/",
  "/science/astronomy/resonances/",
  "/science/astronomy/habitable-zone/",
  "https://arxiv.org/abs/1307.4760",
  "https://ar5iv.labs.arxiv.org/html/1606.07546",
  "https://science.nasa.gov/moon/tidal-locking/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html",
  "https://science.nasa.gov/exoplanet-catalog/proxima-centauri-b/",
  "https://physics.nist.gov/cgi-bin/cuu/Value?bg",
  "{% include nav.html %}",
  "{% include head-layout.html %}",
  "{% include footer.html %}"
].forEach(has);
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf('type="number"') !== -1, "number fields");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/tidal-locking/") !== -1, "hub links the desk");
assert(hub.indexOf(">Tidal locking</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Tidal locking</h3>") !== -1, "hub card");
assert(hub.indexOf("3.40464 million years") !== -1, "hub intro states the time");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/tidal-locking/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Tidal locking</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/tidal-locking/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/tidal-locking/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/tidal-locking/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/tidal-locking/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["tides", "libration"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/tidal-locking/") !== -1, name + " links back");
});

console.log("tidal-locking.test.js: ok");
console.log("Moon", TL.scene(moon).timeText, "Io", io.timeText, "Mercury", mercury.timeText, "Proxima", proxima.timeText);
