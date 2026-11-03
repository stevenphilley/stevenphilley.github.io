/* Compact-star checks. Radii come from the formulas, not stored results.
   Run: node science/astronomy/compact-stars/compact-stars.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var C = require("./compact-stars.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(C.C_M_S === 299792458, "exact c");
assert(C.GM_SUN === 1.3271244e20, "IAU GM sun");
assert(C.R_SUN_M === 6.957e8, "nominal solar radius");
assert(C.G === 6.67430e-11, "CODATA G");
assert(C.R_EARTH_M === 6371e3, "Earth volumetric radius");
assert(C.G0 === 9.80665, "standard gravity");
assert(C.NAUENBERG_R === 0.0225 && C.NAUENBERG_M === 5.82, "Nauenberg coefficients");
assert(C.MU_HECO === 2, "mu for He C O");
assert(C.MU_FE === 56 / 26, "mu for iron-56");
assert(C.NS_R_LO_KM === 11.79 && C.NS_R_HI_KM === 13.11, "Miller span");
assert(near(C.TSP_M3, 4.92892159375e-6, 1e-18), "US teaspoon volume");
assert(C.chandrasekharMass(2) === 1.455, "Chandrasekhar at mu 2");
assert(near(C.chandrasekharMass(56 / 26), 5.82 / ((56 / 26) * (56 / 26)), 0), "iron limit is the formula");

function handRadius(mass, mu) {
  var mch = 5.82 / (mu * mu);
  var x = mass / mch;
  var x13 = Math.pow(x, 1 / 3);
  return (0.0225 / mu) * Math.sqrt(1 - x * x13) / x13;
}

var siriusR = C.whiteDwarfRadiusSolar(1.018, 2);
assert(near(siriusR, handRadius(1.018, 2), 0), "Sirius model radius is the formula");
assert(near(siriusR, 0.007800186605575237, 1e-15), "Sirius model radius value");
var procyonR = C.whiteDwarfRadiusSolar(0.592, 2);
assert(near(procyonR, handRadius(0.592, 2), 0), "Procyon model radius is the formula");
assert(C.whiteDwarfRadiusSolar(0.6, 2) > C.whiteDwarfRadiusSolar(1.018, 2), "heavier white dwarf is smaller");
assert(C.whiteDwarfRadiusSolar(1, C.MU_FE) < C.whiteDwarfRadiusSolar(1, 2), "iron is smaller at the same mass");
assert(!isFinite(C.whiteDwarfRadiusSolar(1.455, 2)), "no radius at the limit");
assert(!isFinite(C.whiteDwarfRadiusSolar(1.46, 2)), "no radius above the limit");
assert(C.whiteDwarfRadiusSolar(1.4, 2) < C.whiteDwarfRadiusSolar(0.6, 2), "the curve shrinks toward the limit");

var curve = C.sampleWhiteDwarf(2, 40);
assert(curve.length === 40, "curve samples");
var i;
for (i = 1; i < curve.length; i++) {
  assert(curve[i].mass > curve[i - 1].mass, "mass increases along the curve");
  assert(curve[i].radiusM < curve[i - 1].radiusM, "radius falls as mass rises");
}

var rs1 = C.schwarzschildRadiusM(1);
assert(near(rs1, 2 * C.GM_SUN / (C.C_M_S * C.C_M_S), 0), "horizon is 2GM/c^2");
assert(near(rs1 / 1000, 2.95325007610025, 1e-9), "one solar mass is 2.953 km");
var horizon = C.derive(1.4, C.schwarzschildRadiusM(1.4));
assert(near(horizon.compactness, 0.5, 1e-12), "black-hole compactness is 1/2");
assert(near(horizon.vescOverC, 1, 1e-12), "Newtonian escape at the horizon is c");

var siriusObs = C.derive(1.018, 0.008098 * C.R_SUN_M);
assert(siriusObs.logG.toFixed(3) === "8.629", "Sirius published log g " + siriusObs.logG.toFixed(3));
var procyonObs = C.derive(0.592, 0.01232 * C.R_SUN_M);
assert(procyonObs.logG.toFixed(3) === "8.029", "Procyon published log g " + procyonObs.logG.toFixed(3));

var j0030 = C.scene({ preset: "j0030" });
assert(j0030 && j0030.single, "J0030 is a point");
assert(j0030.text.compact === "0.156", "J0030 compactness matches Riley " + j0030.text.compact);
assert(near(j0030.lo.compactness, 0.155678800235025, 1e-12), "J0030 compactness value");
assert(near(j0030.lo.vescOverC, Math.sqrt(2 * j0030.lo.compactness), 0), "escape is sqrt(2C)");
assert(near(j0030.lo.teaspoonKg, j0030.lo.density * C.TSP_M3, 1e-6), "teaspoon is density times volume");
assert(j0030.lo.radiusM === 12710, "J0030 median radius");

var j0740 = C.scene({ preset: "j0740" });
assert(j0740.mass === 2.08 && j0740.lo.radiusM === 12390, "J0740 medians");
assert(j0740.text.compact === "0.248", "J0740 compactness " + j0740.text.compact);
assert(j0740.text.escape === "0.704 c", "J0740 escape " + j0740.text.escape);
assert(near(j0740.lo.radiusOverRs, 12.39 / (j0740.lo.rsM / 1000), 1e-9), "radius over horizon");

var span = C.scene({ preset: "span-14" });
assert(!span.single, "1.4 span is a range");
assert(span.lo.radiusM === 11790 && span.hi.radiusM === 13110, "span edges");
assert(span.lo.density > span.hi.density, "smaller radius is denser");
assert(span.rangeText.radius === "11.79 km–13.11 km", "span label");

var sirius = C.scene({ preset: "sirius-b" });
assert(sirius.text.radius.indexOf("0.007800 R☉") === 0, "Sirius model radius text");
assert(sirius.text.teaspoon === "14,905 kg (14.91 t)", "Sirius teaspoon " + sirius.text.teaspoon);
assert(sirius.observed.logG === "8.629" && sirius.observed.publishedLogG === "8.629", "Sirius log g pair");
assert(sirius.text.radius.indexOf("5,427 km") !== -1, "Sirius kilometres");
var procyon = C.scene({ preset: "procyon-b" });
assert(procyon.text.radius.indexOf("0.01269 R☉") === 0, "Procyon model radius text " + procyon.text.radius);
assert(procyon.observed.radiusText.indexOf("0.01232 R☉") === 0, "Procyon published radius");

assert(C.scene({ kind: "wd", mass: 1.455, mu: 2 }) == null, "limit rejected");
assert(C.scene({ kind: "wd", mass: 0.1, mu: 2 }) == null, "below the slider rejected");
assert(C.scene({ kind: "ns", mass: 0.5 }) == null, "neutron-star mass below the slider rejected");
assert(C.scene({ kind: "ns", mass: 3 }) == null, "neutron-star mass above the slider rejected");
assert(C.scene({ preset: "nope" }) == null, "unknown preset rejected");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/compact-stars/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("compact-stars.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("1.3271244") !== -1, "GM on the page");
assert(html.indexOf("299,792,458") !== -1 || html.indexOf("299792458") !== -1, "c on the page");
assert(html.indexOf("0.0225") !== -1 && html.indexOf("5.82") !== -1, "Nauenberg coefficients on the page");
assert(html.indexOf(C.limitsNote()) !== -1, "disclaimer");
assert(html.indexOf(C.explain(sirius)) !== -1, "Sirius explanation is on the page");
assert(html.indexOf(C.spoonLine(sirius)) !== -1, "teaspoon line is on the page");
assert(html.indexOf('data-preset="sirius-b"') !== -1, "Sirius preset");
assert(html.indexOf('data-preset="procyon-b"') !== -1, "Procyon preset");
assert(html.indexOf('data-preset="j0030"') !== -1, "J0030 preset");
assert(html.indexOf('data-preset="j0740"') !== -1, "J0740 preset");
assert(html.indexOf('data-preset="span-14"') !== -1, "span preset");
assert(html.indexOf("11.79") !== -1 && html.indexOf("13.11") !== -1, "radius span on the page");
assert(html.indexOf("/science/astronomy/black-holes/") !== -1, "links the horizon desk");
assert(html.indexOf("/science/astronomy/pulsars/") !== -1, "links the pulsar desk");
assert(html.indexOf("id=\"mr-canvas\"") !== -1, "chart");
assert(html.indexOf("Not a stellar model") !== -1, "educational limit");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/compact-stars/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/compact-stars/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/compact-stars/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/compact-stars/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/compact-stars/") !== -1, "html sitemap");
JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));

console.log("compact-stars.test.js: ok");
console.log("Sirius model", sirius.text.radius, "teaspoon", sirius.text.teaspoon);
console.log("J0030", j0030.text.compact, j0030.text.escape, "J0740", j0740.text.compact, j0740.text.escape);
