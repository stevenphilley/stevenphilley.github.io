/* Interstellar-orbit checks. Shape and v∞ come from the formulas.
   Run: node science/astronomy/interstellar/interstellar.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var I = require("./interstellar.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(I.AU_M === 149597870700, "exact AU");
assert(I.SUN_GM === 132712 * 1e6, "Sun fact-sheet GM");
assert(I.EARTH_MEAN_KMS === 29.78, "Earth mean orbital speed");
assert(I.E_MIN === 0 && I.E_MAX === 6.5, "slider span");

["1I", "2I", "3I"].forEach(function (id) {
  var b = I.catalogById(id);
  assert(b && b.schematic === false, id + " is a catalog orbit");
  assert(b.e > 1, id + " is hyperbolic");
  assert(near(I.signedA(b.e, b.q), b.a, 1e-12), id + " a = q/(1−e)");
  assert(near((b.e - 1) / b.q, -1 / b.a, 1e-12), id + " (e−1)/q = −1/a");
  assert(near(I.vInf(b.e, b.q), I.vInfFromA(b.a), 1e-9), id + " v∞ from q matches v∞ from a");
  var qKm = b.q * I.AU_KM;
  var aKm = b.a * I.AU_KM;
  var vivi = I.SUN_GM * (2 / qKm - 1 / aKm);
  assert(near(I.vPeri(b.e, b.q), Math.sqrt(vivi), 1e-8), id + " perihelion speed is vis-viva");
  var sc = I.scene(I.stateFromPreset(id));
  assert(sc.ok && sc.kind === "hyperbola" && sc.bound === false, id + " scene is unbound");
  assert(sc.text.vInf === I.fmtSpeed(I.vInf(b.e, b.q)) + " km/s", id + " excess readout");
  var mid = sc.curve.points[(sc.curve.points.length / 2) | 0];
  assert(near(mid.x, b.q, 1e-9) && near(mid.y, 0, 1e-9), id + " perihelion is on the right");
  sc.curve.points.forEach(function (p) {
    var th = Math.atan2(p.y, p.x);
    var r = Math.hypot(p.x, p.y);
    var expect = (b.q / (b.e - 1)) * (b.e * b.e - 1) / (1 + b.e * Math.cos(th));
    assert(near(r, expect, 1e-6), id + " polar hyperbola");
    assert(Math.abs(th) < Math.acos(-1 / b.e) + 1e-6, id + " stays inside the asymptote");
  });
});

assert(I.fmtE(I.ATLAS.e) === "6.123467", "3I eccentricity is about 6, from JPL");
assert(I.fmtQ(I.ATLAS.q) === "1.351999", "3I perihelion display");
assert(I.scene(I.stateFromPreset("1I")).text.vInf === "26.405 km/s", "1I excess");
assert(I.scene(I.stateFromPreset("1I")).text.vPeri === "87.352 km/s", "1I perihelion speed");
assert(I.scene(I.stateFromPreset("2I")).text.vInf === "32.278 km/s", "2I excess");
assert(I.scene(I.stateFromPreset("3I")).text.vInf === "57.981 km/s", "3I excess");
assert(I.catalogSentence(I.ATLAS).indexOf("Temporary solution to support JWST Program 13145") !== -1, "3I solution comment");
assert(I.catalogSentence(I.OUMUAMUA).indexOf("Hyperbolic Asteroid") !== -1, "1I class");
assert(I.catalogSentence(I.BORISOV).indexOf("Hyperbolic Comet") !== -1, "2I class");

var hal = I.scene(I.stateFromPreset("halley"));
assert(hal.ok && hal.kind === "ellipse" && hal.text.vInf === "none — bound", "Halley is bound");
assert(hal.text.vPeri === "55.108 km/s", "Halley perihelion matches the comets desk");

var circ = I.scene({ e: 0, q: 1, preset: null });
assert(circ.ok && circ.kind === "ellipse" && circ.curve.closed && circ.vInf === null, "circle");
circ.curve.points.forEach(function (p) {
  assert(near(Math.hypot(p.x, p.y), 1, 1e-9), "circle radius");
});
assert(circ.frame.clipped === false, "a circle is shown whole");

var para = I.scene({ e: 1, q: 1, preset: null });
assert(para.ok && para.kind === "parabola" && para.vInf === 0 && para.curve.closed === false, "parabola excess is zero");
assert(near(para.curve.points[(para.curve.points.length / 2) | 0].x, 1, 1e-9), "parabola perihelion");

var mild = I.scene({ e: 0.5, q: 1, preset: null });
var end = mild.curve.points[180];
assert(near(end.x, -3, 1e-9) && near(end.y, 0, 1e-9), "aphelion of e = 0.5 is −a(1+e)");

assert(I.vInf(0.2, 1) === null && I.boundOf(0.2) === true, "bound orbits have no v∞");
assert(I.scene({ e: 1.2, q: 0 }).ok === false, "q required");
assert(I.validate(7, 1).length > 0, "e above 6.5 rejected");
assert(I.validate(-0.1, 1).length > 0, "negative e rejected");
assert(I.validate(2, 0.001).length > 0, "inside the Sun rejected");
assert(I.scene({ e: 2, q: 1 }).ok === true, "classroom hyperbola");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/interstellar/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("interstellar.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("@media (max-width:899px)") !== -1, "phone nav breakpoint");
assert(html.indexOf("subnav-desk{display:none}") !== -1, "desktop nav hides on a phone");
assert(html.indexOf("subnav-phone{display:block") !== -1, "phone nav shows on a phone");
assert(html.indexOf(I.limitsNote()) !== -1, "disclaimer");
assert(html.indexOf(I.catalogSentence(I.OUMUAMUA)) !== -1, "1I explanation is on the page");
assert(html.indexOf(I.catalogSentence(I.BORISOV)) !== -1, "2I explanation is on the page");
assert(html.indexOf(I.catalogSentence(I.ATLAS)) !== -1, "3I explanation is on the page");
assert(html.indexOf(I.catalogSentence(I.HALLEY)) !== -1, "Halley comparison is on the page");
assert(html.indexOf(I.shapeSentence(0)) !== -1, "bound sentence");
assert(html.indexOf(I.shapeSentence(1)) !== -1, "parabola sentence");
assert(html.indexOf(I.shapeSentence(2)) !== -1, "hyperbola sentence");
assert(html.indexOf("v∞² = GM") !== -1 || html.indexOf("v∞² = GM") !== -1, "formula is stated");
assert(html.indexOf("26.405 km/s") !== -1 && html.indexOf("32.278 km/s") !== -1 && html.indexOf("57.981 km/s") !== -1, "computed excess speeds");
assert(html.indexOf("6.123467") !== -1, "3I eccentricity displayed");
assert(html.indexOf('data-preset="1I"') !== -1, "1I preset");
assert(html.indexOf('data-preset="2I"') !== -1, "2I preset");
assert(html.indexOf('data-preset="3I"') !== -1, "3I preset");
assert(html.indexOf('id="orbit-canvas"') !== -1, "canvas");
assert(html.indexOf('id="ecc"') !== -1, "eccentricity control");
assert(html.indexOf("/science/astronomy/comets/") !== -1, "links comets");
assert(html.indexOf("/science/astronomy/asteroids/") !== -1, "links asteroids");
assert(html.indexOf("/science/astronomy/eccentricity/") !== -1, "links eccentricity");
assert(html.indexOf("/science/astronomy/vis-viva/") !== -1, "links vis-viva");
assert(html.indexOf("https://science.nasa.gov/solar-system/comets/oumuamua/") !== -1, "NASA 1I");
assert(html.indexOf("https://science.nasa.gov/solar-system/comets/2i-borisov/") !== -1, "NASA 2I");
assert(html.indexOf("https://science.nasa.gov/solar-system/comets/3i-atlas/") !== -1, "NASA 3I");
assert(html.indexOf("https://www.esa.int/Science_Exploration/Space_Science/Comet_Interceptor") !== -1, "ESA Comet Interceptor");
assert(html.indexOf("https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=1I") !== -1, "JPL 1I");
assert(html.indexOf("https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2I") !== -1, "JPL 2I");
assert(html.indexOf("https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3I") !== -1, "JPL 3I");
assert(html.indexOf("Not a JPL Horizons ephemeris") !== -1, "educational limit");
assert(html.indexOf("Educational schematic") !== -1, "educational disclaimer");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/interstellar/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/interstellar/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/interstellar/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/interstellar/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/interstellar/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/interstellar/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["comets", "asteroids", "eccentricity", "vis-viva"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/interstellar/") !== -1, name + " links the desk");
});

console.log("interstellar.test.js: ok");
console.log("1I", I.scene(I.stateFromPreset("1I")).text.vInf, I.scene(I.stateFromPreset("1I")).text.vPeri);
console.log("2I", I.scene(I.stateFromPreset("2I")).text.vInf);
console.log("3I", I.fmtE(I.ATLAS.e), I.scene(I.stateFromPreset("3I")).text.vInf);
