/* Density desk checks. Fact-sheet mass and radius, and the sphere arithmetic.
   Run: node science/astronomy/density/density.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var D = require("./density.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(D.BODIES.length === 15, "fifteen bodies");
assert(D.G === 6.67430e-11, "2022 CODATA G");
assert(D.EARTH_MASS_KG === 5.9722e24, "earth mass unit is the sheet");
assert(D.EARTH_RADIUS_M === 6371000, "earth radius unit is the sheet");
assert(D.WATER_KG_M3 === 1000, "water line");
assert(D.ROCK_G_CM3 === 3 && D.IRON_G_CM3 === 7.9, "reference marks");

/* Doubling mass doubles density and g. Doubling radius divides density by 8 and g by 4. */
var earth = D.bodyById("earth");
var base = D.meanDensity(earth.massKg, earth.radiusM);
var baseG = D.surfaceGravity(earth.massKg, earth.radiusM);
assert(near(D.meanDensity(earth.massKg * 2, earth.radiusM) / base, 2, 1e-12), "mass doubles density");
assert(near(D.meanDensity(earth.massKg, earth.radiusM * 2) / base, 0.125, 1e-12), "radius divides density by 8");
assert(near(D.surfaceGravity(earth.massKg * 2, earth.radiusM) / baseG, 2, 1e-12), "mass doubles g");
assert(near(D.surfaceGravity(earth.massKg, earth.radiusM * 2) / baseG, 0.25, 1e-12), "radius divides g by 4");
assert(!isFinite(D.meanDensity(0, earth.radiusM)), "zero mass");
assert(!isFinite(D.meanDensity(earth.massKg, 0)), "zero radius");
assert(!isFinite(D.surfaceGravity(0, earth.radiusM)), "zero mass gravity");

/* Volume of the equivalent sphere. Independent of the module’s formatter. */
function rhoOf(massKg, radiusM) {
  return massKg / ((4 / 3) * Math.PI * radiusM * radiusM * radiusM);
}

var expect = {
  mercury: { rho: "5426.8", gcm: "5.4268", g: "3.702", sheet: "5429", rounds: false },
  venus: { rho: "5242.6", gcm: "5.2426", g: "8.870", sheet: "5243", rounds: true },
  earth: { rho: "5513.4", gcm: "5.5134", g: "9.820", sheet: "5513", rounds: true },
  moon: { rho: "3344.0", gcm: "3.3440", g: "1.624", sheet: "3344", rounds: true },
  mars: { rho: "3934.0", gcm: "3.9340", g: "3.728", sheet: "3934", rounds: true },
  jupiter: { rho: "1326.2", gcm: "1.3262", g: "25.920", sheet: "1,326", rounds: true },
  saturn: { rho: "687.1", gcm: "0.6871", g: "11.186", sheet: "687", rounds: true },
  uranus: { rho: "1270.4", gcm: "1.2704", g: "9.008", sheet: "1,270", rounds: true },
  neptune: { rho: "1637.9", gcm: "1.6379", g: "11.274", sheet: "1,638", rounds: true },
  pluto: { rho: "1855.3", gcm: "1.8553", g: "0.616", sheet: "1854", rounds: false },
  io: { rho: "3528.4", gcm: "3.5284", g: "1.797", sheet: "3530", rounds: false },
  europa: { rho: "3013.8", gcm: "3.0138", g: "1.315", sheet: "3010", rounds: false },
  ganymede: { rho: "1942.1", gcm: "1.9421", g: "1.429", sheet: "1940", rounds: false },
  callisto: { rho: "1834.3", gcm: "1.8343", g: "1.236", sheet: "1830", rounds: false },
  titan: { rho: "1881.3", gcm: "1.8813", g: "1.354", sheet: "1880", rounds: false }
};

Object.keys(expect).forEach(function (id) {
  var b = D.bodyById(id);
  var e = expect[id];
  var sc = D.scene({ body: id });
  var independent = rhoOf(b.massKg, b.radiusM);
  assert(sc.ok, id);
  assert(near(sc.rho, independent, independent * 1e-12), id + " formula");
  assert(near(b.massKg, b.massCoeff * Math.pow(10, b.massExp), 0), id + " mass rebuilds");
  assert(sc.rhoText === e.rho, id + " rho " + sc.rhoText);
  assert(sc.gcmText === e.gcm, id + " g/cm3 " + sc.gcmText);
  assert(sc.gText === e.g, id + " g " + sc.gText);
  assert(sc.sheetRhoText === e.sheet, id + " sheet label");
  assert(e.gcm === (Number(e.rho) / 1000).toFixed(4), id + " g/cm3 is the tenth");
  assert(sc.why.indexOf(e.rho) !== -1, id + " why prints the arithmetic");
  assert(sc.why.indexOf(e.sheet) !== -1, id + " why prints the sheet");
  assert(sc.why.indexOf("not averaged") !== -1, id + " not averaged");
  assert(sc.why.indexOf("not an interior model") !== -1, id + " disclaimer");
  assert(sc.why.indexOf(e.rounds ? "rounds to the sheet’s" : "does not round to") !== -1, id + " rounding sentence");
  assert(b.massKg > D.MASS_MIN && b.massKg < D.MASS_MAX, id + " mass inside the slider");
  assert(b.radiusM > D.RADIUS_MIN && b.radiusM < D.RADIUS_MAX, id + " radius inside the slider");
});

var earthSc = D.scene({ body: "earth" });
assert(earthSc.why.indexOf("5513.4") !== -1 && earthSc.why.indexOf("5513") !== -1, "earth both densities");
assert(earthSc.why.indexOf("5,514") !== -1, "comparison table 5514 stays out");
assert(earthSc.why.indexOf("5.9724") !== -1, "moon-sheet earth column stays out");
assert(earthSc.why.indexOf("3485") !== -1, "earth core radius is named and not used as R");
assert(earthSc.why.indexOf("does not print a core mass") !== -1, "no invented core mass");
assert(earthSc.why.indexOf("9.820") !== -1, "earth gravity");
assert(D.formatEarthMass(earth.massKg) === "1.000000", "earth mass unit");
assert(D.formatEarthRadius(earth.radiusM) === "1.000000", "earth radius unit");
assert(D.formatSiMass(earth.massKg, earth) === "5.9722e24", "si mass uses the printed coefficient");

var saturn = D.scene({ body: "saturn" });
assert(saturn.rho < 1000 && Number(saturn.sheetRhoText) < 1000, "saturn below water");
assert(saturn.why.indexOf("less than water") !== -1, "saturn water sentence");
assert(saturn.why.indexOf("687.1") !== -1 && saturn.why.indexOf("687") !== -1, "saturn both densities");
assert(saturn.why.indexOf("1 bar") !== -1, "saturn radius is the 1-bar volumetric line");

var mercury = D.scene({ body: "mercury" });
assert(mercury.why.indexOf("2,074") !== -1, "nasa core radius is cited");
assert(mercury.why.indexOf("not the R") !== -1, "core radius is not the density radius");
assert(mercury.why.indexOf("5427") !== -1, "nearest integer stays visible");

var pluto = D.scene({ body: "pluto" });
assert(pluto.why.indexOf("1,850") !== -1, "comparison-table pluto stays out");
assert(pluto.why.indexOf("does not round to 1854") !== -1, "pluto gap stays");

var titan = D.scene({ body: "titan" });
assert(titan.gText === "1.354", "titan gravity matches the scale-height figure");
assert(titan.why.indexOf("does not print a surface gravity") !== -1, "titan g is not a sheet line");
assert(titan.why.indexOf("one radius") !== -1, "titan uses the printed radius");
assert(D.bodyById("io").sheetG === null, "io has no sheet gravity");
assert(D.bodyById("europa").sheetG === null, "europa has no sheet gravity");
assert(D.bodyById("ganymede").sheetG === null, "ganymede has no sheet gravity");
assert(D.bodyById("callisto").sheetG === null, "callisto has no sheet gravity");

var jupiter = D.scene({ body: "jupiter" });
assert(jupiter.why.indexOf("71,492") !== -1 && jupiter.why.indexOf("69,911") !== -1, "jupiter radii stay apart");
assert(jupiter.why.indexOf("no solid surface") !== -1, "jupiter has no surface");

assert(D.clampMass(0) === D.MASS_MIN && D.clampMass(1e30) === D.MASS_MAX, "mass stops");
assert(D.clampRadius(1) === D.RADIUS_MIN && D.clampRadius(1e12) === D.RADIUS_MAX, "radius stops");
assert(D.sliderPos(D.MASS_MIN, D.MASS_MIN, D.MASS_MAX) === 0, "slider start");
assert(D.sliderPos(D.MASS_MAX, D.MASS_MIN, D.MASS_MAX) === D.SLIDER_STEPS, "slider end");
assert(near(D.valueFromSlider(0, D.MASS_MIN, D.MASS_MAX), D.MASS_MIN, D.MASS_MIN * 1e-12), "slider min value");
assert(near(D.valueFromSlider(D.SLIDER_STEPS, D.RADIUS_MIN, D.RADIUS_MAX), D.RADIUS_MAX, 1), "slider max radius");
assert(!D.scene({ massKg: 0, radiusM: earth.radiusM }).ok, "custom needs a mass");
var custom = D.scene({ massKg: earth.massKg * 1.5, radiusM: earth.radiusM });
assert(custom.ok && custom.custom && custom.sheetRhoText === "—", "custom is not a sheet");
assert(custom.why.indexOf("not a fact-sheet") !== -1, "custom disclaimer");
assert(near(custom.rho / base, 1.5, 1e-12), "custom scales");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "not an interior model",
  "5513.4",
  "5426.8",
  "687.1",
  "1855.3",
  "3528.4",
  "3013.8",
  "1881.3",
  "1.354",
  "subnav-desk",
  "subnav-phone",
  "id=\"density-canvas\"",
  "id=\"mass\"",
  "id=\"mass-num\"",
  "id=\"radius\"",
  "id=\"radius-num\"",
  "not averaged",
  "uncompressed",
  "does not invent",
  "less than water",
  "7.9",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/fact_notes.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html",
  "https://science.nasa.gov/saturn/facts/",
  "https://science.nasa.gov/mercury/facts/",
  "https://science.nasa.gov/jupiter/facts/",
  "https://starchild.gsfc.nasa.gov/docs/StarChild/teachers/densities.html",
  "https://physics.nist.gov/cgi-bin/cuu/Value?bg",
  "/science/astronomy/scale-height/",
  "/science/astronomy/escape/",
  "/science/astronomy/temperatures/",
  "{% include nav.html %}",
  "{% include head-layout.html %}"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf('aria-current="page">Density') !== -1, "this page is current");
assert(html.indexOf('type="number"') !== -1, "number fields");

D.BODIES.forEach(function (b) {
  var sc = D.scene({ body: b.id });
  assert(html.indexOf("<td>" + sc.rhoText + "</td>") !== -1, "table arithmetic " + b.id);
  assert(html.indexOf("<td>" + sc.gcmText + "</td>") !== -1, "table g/cm3 " + b.id);
  assert(html.indexOf("<td>" + sc.gText + "</td>") !== -1, "table g " + b.id);
  assert(html.indexOf(b.massLabel) !== -1, "table mass " + b.id);
});

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/density/") !== -1, "hub links the desk");
assert(hub.indexOf(">Density</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Density</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/density/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Density</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/density/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/density/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/density/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/density/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["scale-height", "escape", "temperatures"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/density/") !== -1, name + " links back");
});

console.log("density.test.js: ok");
console.log("Earth", earthSc.rhoText, earthSc.gcmText, "Saturn", saturn.rhoText, "Titan", titan.gText);
