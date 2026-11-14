/* Magnetospheres desk checks. Fact-sheet dipoles and the pressure-balance arithmetic.
   Run: node science/astronomy/magnetospheres/magnetospheres.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var M = require("./magnetospheres.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(M.PLANETS.length === 6, "six dipoles");
assert(M.K_FACTOR === 2, "compression factor");
assert(M.PROTON_MASS_KG === 1.67262192595e-27, "CODATA proton mass");
assert(M.GAUSS_TO_TESLA === 1e-4, "gauss to tesla");
assert(near(M.MU0, 4 * Math.PI * 1e-7, 0), "conventional mu0");
assert(M.N_GLOSSARY === 5 && M.V_ABOUT_400 === 400 && M.V_GLOSSARY === 375, "1 AU marks");

/* Density falls as 1/r². Speed does not enter that quotient. */
var earth = M.bodyById("earth");
var jup = M.bodyById("jupiter");
assert(near(M.localDensity(earth.au, 5), 5 / (earth.au * earth.au), 1e-12), "earth density");
assert(near(M.localDensity(jup.au, 5) * jup.au * jup.au, 5, 1e-9), "jupiter 1/r²");
assert(near(M.localDensity(2, 5) / M.localDensity(1, 5), 0.25, 1e-12), "double distance");

/* Doubling density, or doubling speed, scales the standoff by the pressure exponent. */
var base = M.standoffRatio(earth.dipoleGauss, earth.au, 5, 400);
var dense = M.standoffRatio(earth.dipoleGauss, earth.au, 10, 400);
var fast = M.standoffRatio(earth.dipoleGauss, earth.au, 5, 800);
assert(near(dense / base, Math.pow(2, -1 / 6), 1e-12), "density exponent");
assert(near(fast / base, Math.pow(4, -1 / 6), 1e-12), "speed exponent");
assert(M.standoffRatio(earth.dipoleGauss, earth.au, 0, 400) !== M.standoffRatio(earth.dipoleGauss, earth.au, 0, 400) || !isFinite(M.standoffRatio(0, 1, 5, 400)), "zero field is not a standoff");

var expect = {
  mercury: { g: 0.002, au: 0.38709893, ratio: "1.236", nPa: "8.9298", n: "33.367684" },
  earth: { g: 0.306, au: 1.00000011, ratio: "9.070", nPa: "1.3381", n: "4.999999" },
  jupiter: { g: 4.30, au: 5.20336301, ratio: "37.929", nPa: "0.0494", n: "0.184672" },
  saturn: { g: 0.215, au: 9.53707032, ratio: "17.100", nPa: "0.0147", n: "0.054972" },
  uranus: { g: 0.228, au: 19.19126393, ratio: "22.016", nPa: "0.0036", n: "0.013576" },
  neptune: { g: 0.142, au: 30.06896348, ratio: "21.837", nPa: "0.0015", n: "0.005530" }
};

Object.keys(expect).forEach(function (id) {
  var b = M.bodyById(id);
  var e = expect[id];
  var sc = M.scene({ planet: id });
  assert(sc.ok, id);
  assert(b.dipoleGauss === e.g, id + " dipole");
  assert(b.au === e.au, id + " au");
  assert(sc.ratioText === e.ratio, id + " arithmetic " + sc.ratioText);
  assert(sc.pressureText === e.nPa, id + " pressure " + sc.pressureText);
  assert(M.formatN(sc.nLocal) === e.n, id + " density " + M.formatN(sc.nLocal));
  assert(sc.why.indexOf(e.ratio) !== -1, id + " why prints the arithmetic");
  assert(sc.why.indexOf("not averaged") !== -1, id + " not averaged");
  assert(sc.why.indexOf("not mission-grade") !== -1, id + " disclaimer");
  assert(sc.why.indexOf("k = 2") !== -1, id + " states k");
  assert(sc.stats.length === 6, id + " stats");
});

var earthSc = M.scene({ planet: "earth" });
assert(earthSc.ratioText === "9.070", "earth near 10 is 9.070, not rounded to 10");
assert(earthSc.why.indexOf("does not round to 10") !== -1, "earth does not claim 10");
assert(earthSc.why.indexOf("six to 10") !== -1, "NASA span");
assert(earthSc.why.indexOf("about 10") !== -1, "NOAA about 10");
assert(earthSc.why.indexOf("0.24 to 0.66") !== -1, "surface range stays out of the formula");
assert(earthSc.why.indexOf("9.41") !== -1, "tilt is not invented here");
assert(earthSc.why.indexOf("4.999999") !== -1, "J2000 axis does not leave the density exactly 5");

var gloss = M.scene({ planet: "earth", v: 375, n1: 5 });
assert(gloss.ratioText === "9.268", "glossary speed " + gloss.ratioText);
assert(gloss.why.indexOf("not this setting") !== -1, "375 is not averaged with 400");
assert(gloss.why.indexOf("9.268") !== -1, "375 arithmetic is its own number");

var merc = M.scene({ planet: "mercury" });
assert(merc.why.indexOf("1.45") !== -1 && merc.why.indexOf("14.3") !== -1, "Winslow stays beside the arithmetic");
assert(merc.why.indexOf("8.9298") !== -1, "mercury pressure");

var jSc = M.scene({ planet: "jupiter" });
assert(jSc.why.indexOf("37.929") !== -1 && jSc.why.indexOf("71,398") !== -1 && jSc.why.indexOf("71,492") !== -1, "jupiter radii stay apart");
assert(jSc.why.indexOf("63 to 92") !== -1 && jSc.why.indexOf("does not round to 42") !== -1, "jupiter observed span");
assert(jSc.why.indexOf("does not add that plasma pressure") !== -1, "no invented plasma term");

var sat = M.scene({ planet: "saturn" });
assert(sat.why.indexOf("quadrapole") !== -1, "sheet spelling");
assert(sat.why.indexOf("about 22") !== -1 && sat.why.indexOf("about 27") !== -1, "saturn states");

var ura = M.scene({ planet: "uranus" });
assert(ura.why.indexOf("58.6") !== -1 && ura.why.indexOf("does not round to 18") !== -1, "uranus tilt and standoff");

var nep = M.scene({ planet: "neptune" });
assert(nep.why.indexOf("46.9") !== -1 && nep.why.indexOf("outside that span") !== -1, "neptune");

assert(M.clampV(10) === 300 && M.clampV(9000) === 800, "speed stops");
assert(M.clampN(0) === 0.5 && M.clampN(40) === 20, "density stops");
assert(!M.scene({ planet: "venus" }).ok, "venus is not a dipole button");
assert(!M.scene({ planet: "mars" }).ok, "mars is not a dipole button");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "not mission-grade",
  "Simplified pressure-balance model",
  "k = 2",
  "9.070",
  "1.236",
  "37.929",
  "17.100",
  "22.016",
  "21.837",
  "4.999999",
  "0.306",
  "0.24",
  "0.66",
  "subnav-desk",
  "subnav-phone",
  "id=\"mag-canvas\"",
  "id=\"wind-speed\"",
  "id=\"wind-density\"",
  "not averaged",
  "induced magnetic field",
  "fossil",
  "quadrapole",
  "Ganymede",
  "one ton per second",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html",
  "https://www.swpc.noaa.gov/content/space-weather-glossary",
  "https://www.swpc.noaa.gov/phenomena/solar-wind",
  "https://science.nasa.gov/venus/venus-facts/",
  "https://science.nasa.gov/jupiter/jupiter-moons/ganymede/",
  "https://doi.org/10.1002/jgra.50237",
  "https://doi.org/10.1093/acrefore/9780190647926.013.165",
  "https://doi.org/10.1098/rsta.2019.0480",
  "/science/astronomy/aurora/",
  "/science/astronomy/van-allen/",
  "/science/astronomy/cme/",
  "/science/astronomy/solar-cycle/",
  "/science/astronomy/jupiter/",
  "{% include nav.html %}",
  "{% include head-layout.html %}"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf('aria-current="page">Magnetospheres') !== -1, "this page is current");

M.PLANETS.forEach(function (b) {
  var sc = M.scene({ planet: b.id });
  var cell = ">" + sc.ratioText + " " + b.modelSymbol + "<";
  assert(html.indexOf(cell) !== -1, "table arithmetic " + b.id + " " + cell);
});

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/magnetospheres/") !== -1, "hub links the desk");
assert(hub.indexOf(">Magnetospheres</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Magnetospheres</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/magnetospheres/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Magnetospheres</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/magnetospheres/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/magnetospheres/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/magnetospheres/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/magnetospheres/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["aurora", "van-allen", "cme", "solar-cycle", "jupiter"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/magnetospheres/") !== -1, name + " links back");
});

console.log("magnetospheres.test.js: ok");
console.log("Earth", earthSc.ratioText, "Mercury", merc.ratioText, "Jupiter", jSc.ratioText);
