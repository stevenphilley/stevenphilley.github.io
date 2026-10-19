/* HR diagram checks: Stefan–Boltzmann radius lines, IAU bolometric magnitude,
   cited presets, hot-left / bright-up mapping, and the cartoon regions.
   Run: node science/astronomy/hr/hr.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var HR = require("./hr.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(HR.H === 6.62607015e-34, "h");
assert(HR.C === 299792458, "c");
assert(HR.K === 1.380649e-23, "k");
assert(HR.R_SUN_M === 6.957e8, "nominal solar radius");
assert(HR.T_SUN_K === 5772, "nominal solar Teff");
assert(HR.L_SUN_NOMINAL_W === 3.828e26, "nominal solar luminosity");
assert(HR.M_BOL_SUN === 4.74, "nominal solar bolometric magnitude");

var sigma = HR.sigma();
assert(near(sigma / 5.670374419e-8, 1, 1e-9), "sigma " + sigma);

assert(near(HR.luminosityRatio(5772, 1), 1, 1e-12), "solar formula ratio");
assert(near(HR.luminosityRatio(5772 * 2, 1), 16, 1e-9), "twice T is 16×");
assert(near(HR.luminosityRatio(5772, 10), 100, 1e-9), "10 R is 100×");
assert(near(HR.radiusFromLuminosity(5772, 1), 1, 1e-12), "invert the Sun");
assert(near(HR.radiusFromLuminosity(9845, HR.luminosityRatio(9845, 1.7144)), 1.7144, 1e-9), "invert a radius");

var nom = HR.nominalLuminosityRatio(5772, 1);
assert(near(nom, 1, 1e-4), "nominal solar ratio near 1 " + nom);

assert(HR.bolometricMagnitude(1) === 4.74, "Sun bolometric");
assert(near(HR.bolometricMagnitude(100), 4.74 - 5, 1e-12), "100 L is five magnitudes");
assert(near(HR.bolometricMagnitude(Math.pow(10, 5.1)), 4.74 - 2.5 * 5.1, 1e-12), "log L magnitude");

assert(HR.xFrac(40000) < HR.xFrac(5772), "hotter is left of the Sun");
assert(HR.xFrac(5772) < HR.xFrac(3500), "Sun is left of Betelgeuse");
assert(HR.yFrac(1e5) < HR.yFrac(1), "brighter is above the Sun");
assert(HR.yFrac(1) < HR.yFrac(0.001), "Sun is above a faint dwarf");
assert(near(HR.tFromXFrac(HR.xFrac(9845)), 9845, 1e-6), "T round trip");
assert(near(HR.lFromYFrac(HR.yFrac(24.74)), 24.74, 1e-9), "L round trip");

var ids = ["sun", "proxima", "vega", "sirius-a", "sirius-b", "betelgeuse", "rigel"];
var list = HR.presets();
assert(list.length === 7, "seven presets");
ids.forEach(function (id, i) {
  assert(list[i].id === id, "order " + id);
  assert(list[i].T >= HR.T_MIN && list[i].T <= HR.T_MAX, id + " T on scale");
  assert(list[i].L >= HR.L_MIN && list[i].L <= HR.L_MAX, id + " L on scale");
  assert(list[i].note && list[i].why, id + " has copy");
});

var sun = HR.presetById("sun");
assert(sun.T === 5772 && sun.L === 1 && sun.R === 1, "Sun preset");
assert(sun.uncertain === false, "solar nominals are exact");

var prox = HR.presetById("proxima");
assert(prox.T === 2980 && prox.dT === 80, "Proxima T");
assert(prox.L === 0.00151 && prox.dL === 0.00008, "Proxima L");
assert(prox.R === 0.146, "Proxima R");

var vega = HR.presetById("vega");
assert(vega.T === 9560 && vega.L === 44 && vega.R === 2.75, "Vega");

var sa = HR.presetById("sirius-a");
assert(sa.T === 9845 && sa.L === 24.74 && sa.R === 1.7144, "Sirius A");

var sb = HR.presetById("sirius-b");
assert(sb.T === 25369 && sb.L === 0.02448 && sb.R === 0.008098, "Sirius B");
assert(sb.L < 1 && sb.T > sa.T, "Sirius B is hotter and fainter than Sirius A");

var bet = HR.presetById("betelgeuse");
assert(bet.T === 3500 && bet.logL === 5.1 && near(bet.L, Math.pow(10, 5.1), 0), "Betelgeuse");
assert(bet.R === 887, "Betelgeuse radius");

var rig = HR.presetById("rigel");
assert(rig.T === 12100 && rig.logL === 5.08 && near(rig.L, Math.pow(10, 5.08), 0), "Rigel");
var rigErr = HR.lError(rig);
assert(near(rigErr.hi, Math.pow(10, 5.15), 1e-6), "Rigel upper log");
assert(near(rigErr.lo, Math.pow(10, 4.98), 1e-6), "Rigel lower log");
var betErr = HR.lError(bet);
assert(near(betErr.hi / bet.L, Math.pow(10, 0.22), 1e-9), "Betelgeuse log error");

assert(HR.regionAt(sun.T, sun.L).id === "ms", "Sun on the cartoon main sequence");
assert(HR.regionAt(prox.T, prox.L).id === "ms", "Proxima on the cartoon main sequence");
assert(HR.regionAt(sa.T, sa.L).id === "ms", "Sirius A on the cartoon main sequence");
assert(HR.regionAt(vega.T, vega.L).id === "ms", "Vega on the cartoon main sequence");
assert(HR.regionAt(bet.T, bet.L).id === "giants", "Betelgeuse with the giants");
assert(HR.regionAt(rig.T, rig.L).id === "giants", "Rigel with the giants");
assert(HR.regionAt(sb.T, sb.L).id === "wd", "Sirius B with the white dwarfs");

["sun", "proxima", "vega", "sirius-a"].forEach(function (id) {
  var p = HR.presetById(id);
  assert(HR.regionAt(p.T, p.L).id !== "wd", id + " is not a white dwarf");
  assert(HR.regionAt(p.T, p.L).id !== "giants", id + " is not a giant");
});
assert(HR.regionAt(sb.T, sb.L).id !== "ms", "Sirius B is not on the main sequence");
assert(HR.regionAt(bet.T, bet.L).id !== "ms", "Betelgeuse is not on the main sequence");

assert(HR.whyFor(sb.T, sb.L, sb).indexOf("tiny") > 0, "white dwarf sentence");
assert(HR.regionAt(sun.T, 0.5).id === "ms", "a neighbor of the Sun stays on the cartoon");
assert(HR.whyFor(sun.T, 0.5, null).indexOf("cited dwarfs") > 0, "custom on the band");

assert(HR.SUN_MV === 4.83, "Sun visual absolute");
assert(HR.SIRIUS_V === -1.46, "Sirius V");
assert(HR.SIRIUS_PARALLAX_ARCSEC === 0.37921, "Sirius parallax");
var siriusMv = HR.siriusVisualAbsolute();
assert(near(siriusMv, -1.46 - 5 * Math.log10((1 / 0.37921) / 10), 1e-12), "Sirius visual absolute");
assert(HR.formatMag(4.74) === "+4.74", "format bolometric Sun");
assert(HR.formatMag(siriusMv).charAt(0) === "+", "Sirius visual is positive");

assert(HR.formatLLabel(bet, bet.L) === "10^5.10", "Betelgeuse label");
assert(HR.formatLLabel(rig, rig.L) === "10^5.08", "Rigel label");
assert(HR.RADIUS_LINES.indexOf(1) >= 0 && HR.RADIUS_LINES.indexOf(0.01) >= 0 && HR.RADIUS_LINES.indexOf(10) >= 0, "radius set");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("/science/astronomy/hr/") !== -1, "canonical path");
assert(html.indexOf("not a Gaia catalog") !== -1, "disclaimer");
assert(html.indexOf("not an ephemeris") !== -1, "ephemeris disclaimer");
assert(html.indexOf("/science/astronomy/stars/") !== -1, "stars link");
assert(html.indexOf("/science/astronomy/blackbody/") !== -1, "blackbody link");
assert(html.indexOf("/science/astronomy/magnitude/") !== -1, "magnitude link");
assert(html.indexOf("/science/astronomy/nearest-stars/") !== -1, "nearest stars link");
assert(html.indexOf("/science/astronomy/parallax/") !== -1, "parallax link");
assert(html.indexOf("/science/astronomy/") !== -1, "astronomy hub link");
assert(html.indexOf("data-preset=\"sirius-b\"") !== -1, "Sirius B button");
assert(html.indexOf("5.670374419") !== -1, "CODATA sigma digits");
assert(html.indexOf("5772") !== -1, "nominal solar temperature");

list.forEach(function (p) {
  var implied = HR.radiusFromLuminosity(p.T, p.L);
  var lineL = HR.luminosityRatio(p.T, p.R);
  console.log(p.id, "cited R", p.R, "R from L", implied.toFixed(4), "L from R", lineL.toExponential(3));
});

console.log("sigma", sigma);
console.log("nominal solar ratio", nom);
console.log("Sirius A visual MV", siriusMv);
console.log("hr.test.js ok");
