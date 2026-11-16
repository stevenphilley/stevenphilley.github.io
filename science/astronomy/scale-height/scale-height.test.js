/* Scale-height desk checks. Fact-sheet inputs and the isothermal arithmetic.
   Run: node science/astronomy/scale-height/scale-height.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./scale-height.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(S.WORLDS.length === 8, "eight worlds");
assert(S.K === 1.380649e-23, "exact k");
assert(S.U === 1.66053906892e-27, "2022 CODATA u");
assert(S.G === 6.67430e-11, "2022 CODATA G");
assert(S.TITAN_MASS_1E24 === 0.13455, "titan mass");
assert(S.TITAN_RADIUS_KM === 2575, "titan radius");

/* Doubling T doubles H. Doubling mu or g halves it. */
var base = S.scaleHeightKm(288, 28.97, 9.820);
assert(near(S.scaleHeightKm(576, 28.97, 9.820) / base, 2, 1e-12), "temperature doubles H");
assert(near(S.scaleHeightKm(288, 57.94, 9.820) / base, 0.5, 1e-12), "mass halves H");
assert(near(S.scaleHeightKm(288, 28.97, 19.64) / base, 0.5, 1e-12), "gravity halves H");
assert(!isFinite(S.scaleHeightKm(0, 28.97, 9.820)), "zero temperature");
assert(near(S.pressureRatio(base, base), Math.exp(-1), 1e-12), "one scale height is 1/e");
assert(near(S.pressureRatio(2 * base, base), Math.exp(-2), 1e-12), "two scale heights");

/* The grams-per-mole form agrees at the thousandth this page prints. */
S.WORLDS.forEach(function (b) {
  if (!(b.mu > 0)) return;
  assert(S.formatH(S.scaleHeightKm(b.T, b.mu, b.g)) === S.formatH(S.scaleHeightKmR(b.T, b.mu, b.g)), b.id + " formulas agree");
});

var expect = {
  venus: { T: 737, mu: 43.45, g: 8.87, h: "15.900", sheet: "15.9" },
  earth: { T: 288, mu: 28.97, g: 9.820, h: "8.417", sheet: "8.5" },
  mars: { T: 214, mu: 43.49, g: 3.73, h: "10.969", sheet: "11.0" },
  jupiter: { T: 165, mu: 2.22, g: 25.92, h: "23.841", sheet: "27" },
  saturn: { T: 134, mu: 2.07, g: 11.19, h: "48.099", sheet: "59.5" },
  uranus: { T: 76, mu: 2.64, g: 9.01, h: "26.566", sheet: "27.7" }
};

Object.keys(expect).forEach(function (id) {
  var b = S.bodyById(id);
  var e = expect[id];
  var sc = S.scene({ body: id });
  assert(sc.ok, id);
  assert(b.T === e.T && b.mu === e.mu && b.g === e.g, id + " inputs");
  assert(b.sheetHLabel === e.sheet, id + " sheet label");
  assert(sc.hText === e.h, id + " arithmetic " + sc.hText);
  assert(sc.why.indexOf(e.h) !== -1, id + " why prints the arithmetic");
  assert(sc.why.indexOf(e.sheet) !== -1, id + " why prints the sheet");
  assert(sc.why.indexOf("not averaged") !== -1, id + " not averaged");
  assert(sc.why.indexOf("Isothermal") !== -1, id + " isothermal");
  assert(sc.why.indexOf("not a climate model") !== -1, id + " disclaimer");
  assert(sc.why.indexOf("does not say which temperature") !== -1, id + " reference level");
  assert(sc.curves.length === 1 && sc.curves[0].hText === e.h, id + " one curve");
  assert(near(S.pressureRatio(sc.curves[0].H, sc.curves[0].H), S.oneOverE(), 1e-12), id + " e-fold");
});

var earth = S.scene({ body: "earth" });
assert(earth.why.indexOf("8.417") !== -1 && earth.why.indexOf("8.5") !== -1, "earth both heights");
assert(earth.why.indexOf("does not round to 8.5") !== -1, "earth does not claim 8.5");
assert(earth.why.indexOf("9.80665") !== -1, "standard gravity stays out of the formula");
assert(earth.why.indexOf("9.820") !== -1, "mean gravity is the one used");

var mars = S.scene({ body: "mars" });
assert(mars.why.indexOf("~214") !== -1, "mars tilde stays");
assert(mars.why.indexOf("10.969") !== -1 && mars.why.indexOf("11.0") !== -1, "mars both heights");

var jupiter = S.scene({ body: "jupiter" });
assert(jupiter.why.indexOf("1-bar") !== -1, "jupiter is at 1 bar");
assert(jupiter.why.indexOf("no solid surface") !== -1, "jupiter has no surface");
assert(jupiter.why.indexOf("does not round to 27") !== -1, "jupiter gap stays");

var saturn = S.scene({ body: "saturn" });
assert(saturn.why.indexOf("48.099") !== -1 && saturn.why.indexOf("59.5") !== -1, "saturn both");
assert(saturn.why.indexOf("1-bar") !== -1, "saturn 1 bar");

var neptune = S.scene({ body: "neptune" });
assert(neptune.hText === "20.995 at 2.53; 19.747 at 2.69", "neptune both ends " + neptune.hText);
assert(neptune.sheetHText === "19.1–20.3", "neptune sheet range");
assert(neptune.curves.length === 2, "neptune draws both ends");
assert(neptune.why.indexOf("not averaged") !== -1, "neptune ends are not a mean");
assert(neptune.why.indexOf("Neither arithmetic is a listed end") !== -1, "neptune does not match the listed ends");
assert(S.bodyById("neptune").mu === null, "neptune has no single molecular weight");

var titanG = S.titanGravity();
assert(S.formatG(titanG) === "1.354", "titan gravity prints 1.354, got " + S.formatG(titanG));
var titan = S.scene({ body: "titan", T: 288, mu: 28.97 });
assert(titan.ok && titan.hText === "61.030", "earth air at titan g " + titan.hText);
assert(titan.sheetHText === "—", "titan sheet is a dash");
assert(titan.why.indexOf("does not print") !== -1, "titan omissions are stated");
assert(titan.why.indexOf("1.354") !== -1, "titan g is labeled as computed");
assert(titan.why.indexOf("7.251") !== -1, "titan puff-up factor");
assert(titan.why.indexOf("61.030") !== -1 && titan.why.indexOf("8.417") !== -1, "titan comparison with earth");
assert(titan.why.indexOf("not a gravity line") !== -1, "computed g is not a sheet line");
assert(!S.scene({ body: "titan" }).ok, "titan without a temperature is not a curve");

var venus = S.scene({ body: "venus" });
assert(venus.why.indexOf("rounds to the sheet’s 15.9") !== -1, "venus matches at the tenth");

assert(S.clampT(10) === 40 && S.clampT(5000) === 900, "temperature stops");
assert(S.clampMu(0) === 1 && S.clampMu(80) === 50, "molecular weight stops");
assert(S.clampG(0.1) === 0.5 && S.clampG(40) === 30, "gravity stops");
assert(!S.scene({ T: 0, mu: 28.97, g: 9.82 }).ok, "custom needs a temperature");
var custom = S.scene({ T: 300, mu: 29, g: 10 });
assert(custom.ok && custom.custom && custom.sheetHText === "—", "custom is not a sheet");
assert(custom.why.indexOf("not a fact-sheet") !== -1, "custom disclaimer");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "not a climate model",
  "Isothermal",
  "8.417",
  "15.900",
  "10.969",
  "23.841",
  "48.099",
  "26.566",
  "20.995 at 2.53",
  "19.747 at 2.69",
  "19.1–20.3",
  "9.80665",
  "9.820",
  "1.354",
  "subnav-desk",
  "subnav-phone",
  "id=\"scale-canvas\"",
  "id=\"temp\"",
  "id=\"mu\"",
  "id=\"grav\"",
  "not averaged",
  "~214",
  "1-bar",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/fact_notes.html",
  "https://physics.nist.gov/cgi-bin/cuu/Value?k",
  "/science/astronomy/atmospheric-escape/",
  "/science/astronomy/temperatures/",
  "/science/astronomy/magnetospheres/",
  "{% include nav.html %}",
  "{% include head-layout.html %}"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf('aria-current="page">Scale height') !== -1, "this page is current");

["venus", "earth", "mars", "jupiter", "saturn", "uranus"].forEach(function (id) {
  var sc = S.scene({ body: id });
  assert(html.indexOf(">" + sc.hText + "<") !== -1, "table arithmetic " + id);
});

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/scale-height/") !== -1, "hub links the desk");
assert(hub.indexOf(">Scale height</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Scale height</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/scale-height/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Scale height</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/scale-height/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/scale-height/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/scale-height/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/scale-height/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["atmospheric-escape", "temperatures", "magnetospheres"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/scale-height/") !== -1, name + " links back");
});

console.log("scale-height.test.js: ok");
console.log("Earth", earth.hText, "Venus", venus.hText, "Titan", titan.hText, "Neptune", neptune.hText);
