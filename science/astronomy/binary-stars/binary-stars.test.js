/* Binary-star checks. Masses, axes, and speeds come from the formulas.
   Run: node science/astronomy/binary-stars/binary-stars.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var B = require("./binary-stars.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(B.YEAR_DAYS === 365.256, "year unit");
assert(B.AU_M === 149597870700, "exact AU");
assert(B.R_SUN_M === 6.957e8, "nominal solar radius");
assert(near(B.auPerYearToKms(2 * Math.PI), 29.784765, 1e-4), "Earth-Sun circular speed");
assert(B.formatKms(B.auPerYearToKms(2 * Math.PI)) === "29.785 km/s", "speed text");

var aSir = B.geometricAu(7.4957, 0.3789);
assert(near(aSir, 7.4957 / 0.3789, 0), "Sirius axis is a/π");
var mSir = B.totalMass(aSir, 50.1284);
assert(near(mSir, 3.081, 0.001), "Sirius a³/P² near 3.081, got " + mSir);
assert(B.formatMass(mSir) === "3.081024", "Sirius mass text");

var sir = B.scene(B.stateFromPreset("sirius"));
assert(sir.ok && sir.text.mKepler === "3.081024" && sir.text.a === "19.782792 AU", "Sirius scene");
assert(near(sir.norm.a1 + sir.norm.a2, sir.norm.aAu, 1e-12), "axes sum to a");
assert(near(sir.norm.a1 / sir.norm.a2, 1.018 / 2.063, 1e-12), "inverse mass ratio");
assert(sir.norm.a1 < sir.norm.a2, "heavier Sirius A is closer");
assert(near(Math.abs(sir.k1) / sir.v1, Math.abs(Math.sin(136.336 * Math.PI / 180)) / Math.sqrt(1 - 0.59142 * 0.59142), 1e-12), "K is v |sin i| / sqrt(1-e²)");

var aCenAu = B.geometricAu(17.4930, 750.81 / 1000);
var mCen = B.totalMass(aCenAu, 79.762);
assert(near(mCen, 1.0788 + 0.9092, 0.001), "Alpha Cen a³/P² near 1.988, got " + mCen);
var cen = B.scene(B.stateFromPreset("acen"));
assert(cen.ok && cen.text.mKepler === "1.987974" && cen.text.a === "23.298837 AU", "Alpha Cen scene");
assert(cen.eclipsing === false && cen.minFlux === 1, "Alpha Cen does not eclipse");

var alg = B.scene(B.stateFromPreset("algol"));
assert(alg.ok, "Algol scene");
assert(near(Math.abs(alg.k1), 44.1, 0.05), "Algol K_A near 44.1, got " + alg.k1);
assert(near(Math.abs(alg.k2), 194.2, 0.2), "Algol K_B near 194.2, got " + alg.k2);
assert(alg.text.k1 === "44.112 km/s" && alg.text.k2 === "194.205 km/s", "Algol K text");
assert(near(B.auToRsun(alg.norm.aAu), 13.65, 0.02), "Algol axis near 13.65 Rsun, got " + B.auToRsun(alg.norm.aAu));
assert(alg.text.aRsun === "13.660", "Algol radius text");
assert(alg.eclipsing === true && alg.minFlux < 0.5, "Algol eclipses");
assert(alg.text.minFlux === "0.3168", "Algol minimum flux");
assert(near(alg.norm.periodDays, 2.867328, 1e-12), "Algol period is the adopted day count");

var edge = B.scene(B.stateFromPreset("equal"));
assert(edge.ok && near(edge.norm.aAu, Math.pow(2, 1 / 3), 1e-12), "equal-mass axis");
assert(near(edge.k1, edge.k2, 1e-12) && near(edge.k1, edge.v1, 1e-12), "edge-on circular K is the speed");
var face = B.scene({ mode: "period", m1: 1, m2: 1, periodYears: 1, e: 0, i: 0, omega: 90 });
var tilt = B.scene({ mode: "period", m1: 1, m2: 1, periodYears: 1, e: 0, i: 30, omega: 90 });
assert(face.k1 === 0, "face-on is silent");
assert(near(tilt.k1, edge.k1 * Math.sin(Math.PI / 6), 1e-9), "K scales with sin i");

var samples = alg.samples;
var max = Math.max.apply(null, samples.rv1);
var min = Math.min.apply(null, samples.rv1);
assert(near(max - min, 2 * Math.abs(alg.k1), 1e-6), "peak-to-peak is 2K");

function recessionMatches(id) {
  var n = B.normalize(B.stateFromPreset(id));
  var M = 0.85;
  var dt = 1e-8;
  var f0 = B.frame(n, M - Math.PI * dt / n.periodYears);
  var f1 = B.frame(n, M + Math.PI * dt / n.periodYears);
  var rec = B.auPerYearToKms(-(f1.sky1.Z - f0.sky1.Z) / dt);
  var mid = B.frame(n, M);
  assert(near(rec, mid.rv1, 1e-3), id + " radial velocity is −dZ/dt");
}
recessionMatches("sirius");
recessionMatches("acen");
recessionMatches("algol");
recessionMatches("equal");

var M = 1.2;
var E = B.eccentricFromMean(M, 0.59142);
assert(near(E - 0.59142 * Math.sin(E), M, 1e-12), "Kepler’s equation");

assert(B.scene({ mode: "nope", m1: 1, m2: 1 }).ok === false, "unknown mode");
assert(B.scene({ mode: "period", m1: 0, m2: 1, periodYears: 1, e: 0, i: 90, omega: 0 }).ok === false, "mass required");
assert(B.scene({ mode: "period", m1: 1, m2: 1, periodYears: 1, e: 1.2, i: 90, omega: 0 }).ok === false, "eccentricity bound");
assert(B.scene({ mode: "mass", m1: 1, m2: 1, periodYears: 1, aAu: 1, e: 0, i: 90, omega: 0, r1: 1 }).ok === false, "one radius is not enough");

var sun = B.scene({ mode: "mass", name1: "Sun", name2: "Earth", m1: 1, m2: 3.003e-6, aAu: 1, periodYears: 1, e: 0, i: 90, omega: 0 });
assert(sun.ok && sun.text.mKepler === "1.000000", "Earth-Sun total is 1");
assert(near(B.auPerYearToKms(2 * Math.PI * sun.norm.a2), Math.abs(sun.k2), 1e-9), "edge-on Earth K is its orbital speed");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/binary-stars/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("binary-stars.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(B.limitsNote()) !== -1, "disclaimer");
assert(html.indexOf(sir.why) !== -1, "Sirius explanation is on the page");
assert(html.indexOf("3.081024") !== -1 && html.indexOf("19.782792") !== -1, "Sirius orbit on the page");
assert(html.indexOf("7.4957") !== -1 && html.indexOf("0.3789") !== -1 && html.indexOf("50.1284") !== -1, "Bond elements");
assert(html.indexOf("17.4930") !== -1 && html.indexOf("750.81") !== -1 && html.indexOf("1.987974") !== -1, "Alpha Cen elements");
assert(html.indexOf("2.867328") !== -1 && html.indexOf("44.112") !== -1 && html.indexOf("194.205") !== -1, "Algol elements");
assert(html.indexOf("13.660") !== -1 && html.indexOf("13.65") !== -1, "Algol axis");
assert(html.indexOf('data-preset="sirius"') !== -1, "Sirius preset");
assert(html.indexOf('data-preset="acen"') !== -1, "Alpha Cen preset");
assert(html.indexOf('data-preset="algol"') !== -1, "Algol preset");
assert(html.indexOf('data-preset="equal"') !== -1, "classroom preset");
assert(html.indexOf('id="orbit-canvas"') !== -1 && html.indexOf('id="rv-canvas"') !== -1 && html.indexOf('id="lc-canvas"') !== -1, "canvases");
assert(html.indexOf("/science/astronomy/kepler/") !== -1, "links Kepler");
assert(html.indexOf("29.785") !== -1, "AU per year conversion");
assert(html.indexOf("Not an ephemeris") !== -1, "educational limit");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/binary-stars/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/binary-stars/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/binary-stars/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/binary-stars/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/binary-stars/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/binary-stars/") found = true;
  });
});
assert(found, "whats-new lists the desk");

console.log("binary-stars.test.js: ok");
console.log("Sirius", sir.text.mKepler, sir.text.a, "K", sir.text.k1, sir.text.k2);
console.log("Alpha Cen", cen.text.mKepler, cen.text.a);
console.log("Algol", alg.text.aRsun, "R☉", alg.text.k1, alg.text.k2, "flux", alg.text.minFlux);
console.log("Earth-Sun", B.formatKms(B.auPerYearToKms(2 * Math.PI)));
