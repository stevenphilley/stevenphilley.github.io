/* Thermal escape checks: speeds, lambda, the six-times rule, cited presets.
   Run: node science/astronomy/atmospheric-escape/atmospheric-escape.test.js */
"use strict";

var A = require("./atmospheric-escape.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(A.K === 1.380649e-23, "k");
assert(A.U === 1.66053906892e-27, "u");
assert(A.G === 6.67430e-11, "G");
assert(A.SIX === 6, "six");

/* Mean / most-probable is sqrt(4/pi). */
var ratioSpeeds = A.vMean(1000, 1.008) / A.vMostProbable(1000, 1.008);
assert(near(ratioSpeeds, Math.sqrt(4 / Math.PI), 1e-12), "mean over mp " + ratioSpeeds);

/* RMS is sqrt(3kT/m). */
assert(near(A.vRms(1000, 1) / Math.sqrt(3 * A.K * 1000 / A.U), 1, 1e-12), "rms identity");

/* Six times the mean speed is lambda of about 45.8, because lambda uses v_mp. */
var lamSix = A.lambdaAtSix();
assert(near(lamSix, Math.pow(6 * Math.sqrt(4 / Math.PI), 2), 1e-12), "lambda at six");
assert(near(lamSix, 45.84, 0.02), "lambda at six is about 45.8, got " + lamSix);

/* Earth surface escape from the fact-sheet GM and volumetric radius. */
var earth = A.worldById("earth");
assert(earth.gm === 398600, "earth GM");
assert(earth.radiusKm === 6371, "earth radius");
var vSurf = A.escapeKms(earth.gm, earth.radiusKm);
assert(A.formatKms(vSurf) === "11.186 km/s", "earth surface escape " + vSurf);
assert(near(vSurf, 11.2, 0.02), "earth escape is about 11.2");

/* Jeans radius is volumetric radius plus the cited 500 km. */
assert(earth.exoAltKm === 500, "earth exobase altitude");
assert(near(earth.jeansRadiusKm, 6871, 1e-9), "earth jeans radius");
var vExo = A.escapeKms(earth.gm, earth.jeansRadiusKm);
assert(near(vExo, 10.8, 0.05), "earth exobase escape near 10.8, got " + vExo);

var at1000 = A.evaluate(earth, 1000);
var h = A.rowById(at1000, "h");
var n2 = A.rowById(at1000, "n2");
var o2 = A.rowById(at1000, "o2");
assert(h.held === false, "earth hydrogen is not retained");
assert(h.ratio < 6, "earth hydrogen ratio under 6, got " + h.ratio);
assert(n2.held === true && o2.held === true, "earth N2 and O2 retained");
assert(n2.ratio > 6 && o2.ratio > 6, "earth N2/O2 ratios");
/* Catling and Kasting: lambda about 7 for atomic H at 1000 K at the exobase. */
assert(near(h.lambda, 7, 0.5), "earth H lambda near 7, got " + h.lambda);
/* Digits the page states for the Earth button. */
assert(A.formatKms(vExo) === "10.771 km/s", "exobase digits " + vExo);
assert(A.formatKms(h.vMean) === "4.583 km/s", "H mean " + h.vMean);
assert(A.formatRatio(h.ratio) === "2.35", "H ratio " + h.ratio);
assert(A.formatLambda(h.lambda) === "7.03", "H lambda digits " + h.lambda);
assert(A.formatKms(n2.vMean) === "0.869 km/s", "N2 mean " + n2.vMean);
assert(A.formatRatio(n2.ratio) === "12.4", "N2 ratio " + n2.ratio);
assert(A.formatLambda(n2.lambda) === "195", "N2 lambda " + n2.lambda);
assert(A.formatRatio(o2.ratio) === "13.2", "O2 ratio " + o2.ratio);
assert(A.formatLambda(o2.lambda) === "223", "O2 lambda " + o2.lambda);

/* lambda from speeds equals GMm/(kTr). */
at1000.rows.forEach(function (row) {
  var fromGm = A.lambdaFromGm(earth.gm, row.mu, 1000, earth.jeansRadiusKm);
  assert(near(row.lambda / fromGm, 1, 1e-9), "lambda identity " + row.id + " " + row.lambda + " " + fromGm);
  assert(near(row.vMean / row.vMp, Math.sqrt(4 / Math.PI), 1e-12), "speed ratio " + row.id);
  assert(row.held === (row.ratio >= 6), "held flag " + row.id);
  assert(near(row.line, 6 * row.vMean, 1e-12), "retention line " + row.id);
});

/* Heavier gas, larger lambda, at the same temperature. */
assert(n2.lambda > h.lambda && o2.lambda > n2.lambda, "lambda rises with mass");
assert(h.vMean > n2.vMean && n2.vMean > o2.vMean, "lighter gas is faster");

/* Titan keeps N2 by the rough rule. The Moon, at the black-body stand-in, does not. */
var titan = A.evaluate(A.worldById("titan"), 150);
var moon = A.evaluate(A.worldById("moon"), 270.4);
var titanN2 = A.rowById(titan, "n2");
var moonN2 = A.rowById(moon, "n2");
assert(titanN2.held === true, "titan N2 retained, ratio " + titanN2.ratio);
assert(moonN2.held === false, "moon N2 not retained, ratio " + moonN2.ratio);
assert(A.formatRatio(titanN2.ratio) === "6.24", "titan N2 ratio digits");
assert(A.formatLambda(titanN2.lambda) === "49.5", "titan N2 lambda digits");
assert(A.formatKms(titan.vJeans) === "2.099 km/s", "titan exobase escape");
assert(A.formatKms(titan.vSurf) === "2.641 km/s", "titan surface escape");
assert(A.formatRatio(moonN2.ratio) === "5.25", "moon N2 ratio digits");
assert(A.formatKms(moon.vJeans) === "2.375 km/s", "moon escape digits");
assert(titan.vSurf > moon.vSurf, "titan surface escape is a bit higher");
assert(titan.body.T === 150 && moon.body.T === 270.4, "cited temperatures");

/* Moon hydrogen leaves. Titan hydrogen leaves. Titan N2 is the contrast. */
assert(A.rowById(moon, "h").held === false, "moon H leaks");
assert(A.rowById(titan, "h").held === false, "titan H leaks");

/* Jupiter, Saturn, and Neptune hold atomic hydrogen at the cited temperatures.
   Uranus is the hot, smaller giant: Table 1’s 850 K puts atomic H under the
   rough line, and H2 stays above it. The bulk atmosphere is H2. */
["jupiter", "saturn", "neptune"].forEach(function (id) {
  var w = A.worldById(id);
  var ev = A.evaluate(w, w.T);
  assert(A.rowById(ev, "h").held === true, id + " holds H, ratio " + A.rowById(ev, "h").ratio);
  assert(A.rowById(ev, "h2").held === true, id + " holds H2");
  assert(w.oblate === true, id + " uses the equatorial 1-bar base");
});
var uranus = A.evaluate(A.worldById("uranus"), 850);
assert(A.worldById("uranus").oblate === true, "uranus equatorial base");
assert(A.rowById(uranus, "h").held === false, "uranus atomic H is under the line, ratio " + A.rowById(uranus, "h").ratio);
assert(A.rowById(uranus, "h2").held === true, "uranus H2 stays above the line, ratio " + A.rowById(uranus, "h2").ratio);
assert(A.rowById(uranus, "he").held === true, "uranus He stays above the line");
assert(A.formatRatio(A.rowById(uranus, "h").ratio) === "4.63", "uranus H ratio");
assert(A.formatRatio(A.rowById(uranus, "h2").ratio) === "6.55", "uranus H2 ratio");

/* Pluto N2 is under the rough line at the cold exobase. The atmosphere is
   resupplied. The rule is not a claim that the air is already gone. */
var pluto = A.evaluate(A.worldById("pluto"), 65);
assert(A.rowById(pluto, "n2").held === false, "pluto N2 under the line, ratio " + A.rowById(pluto, "n2").ratio);
assert(near(A.worldById("pluto").jeansRadiusKm, 2898, 1e-6), "pluto jeans radius 1188+1710");
assert(A.formatRatio(A.rowById(pluto, "n2").ratio) === "3.50", "pluto N2 ratio");
assert(A.formatLambda(A.rowById(pluto, "n2").lambda) === "15.6", "pluto N2 lambda");
assert(A.formatKms(pluto.vJeans) === "0.775 km/s", "pluto exobase escape");

/* Fact-sheet surface escapes round to the printed sheet figures. */
function sheetClose(id, printed, tol) {
  var w = A.worldById(id);
  var v = A.escapeKms(w.gm, w.radiusKm);
  assert(near(v, printed, tol), id + " surface " + v + " vs sheet " + printed);
}
sheetClose("mercury", 4.3, 0.06);
sheetClose("venus", 10.36, 0.01);
sheetClose("mars", 5.03, 0.01);
sheetClose("moon", 2.38, 0.01);
sheetClose("pluto", 1.21, 0.01);
/* Giant-planet sheet escape matches the equatorial 1-bar radius, not the volumetric one. */
function eqClose(id, printed, tol) {
  var w = A.worldById(id);
  var v = A.escapeKms(w.gm, w.jeansBaseKm);
  assert(near(v, printed, tol), id + " equatorial " + v + " vs sheet " + printed);
}
eqClose("jupiter", 59.5, 0.1);
eqClose("saturn", 35.5, 0.1);
eqClose("uranus", 21.3, 0.1);
eqClose("neptune", 23.5, 0.1);

/* Titan GM is G times the satellite-sheet mass, and surface escape is about 2.6 km/s. */
var titanBody = A.worldById("titan");
assert(titanBody.mass1e24 === 0.13455, "titan mass");
assert(near(titanBody.gm, A.gmFromMass(0.13455), 1e-6), "titan GM from G");
assert(near(titan.vSurf, 2.6, 0.05), "titan surface escape about 2.6, got " + titan.vSurf);
assert(titanBody.jeansRadiusKm === 4075, "titan jeans radius");

/* Ten gases, eleven worlds, Earth preset is the sanity case. */
assert(A.gases().length === 10, "ten gases");
assert(A.worlds().length === 11, "eleven worlds");
assert(A.worldById("earth").T === 1000, "earth temperature");

/* Custom mass uses G. A zero is refused. */
assert(A.customBody(0, 6371) === null, "refuse zero mass");
assert(A.customBody(5.9722, 0) === null, "refuse zero radius");
var custom = A.customBody(5.9722, 6371);
var customEv = A.evaluate(custom, 1000);
assert(A.formatKms(customEv.vSurf) === "11.186 km/s", "custom earth mass rounds to 11.186, got " + customEv.vSurf);
assert(custom.jeansRadiusKm === 6371, "custom has no added altitude");

/* Retention line is six times the mean speed, and it scales as sqrt(T). */
var line = A.retentionSpeed(1000, 28.014);
assert(near(line, 6 * (A.vMean(1000, 28.014) / 1000), 1e-12), "retention speed");
assert(near(A.retentionSpeed(4000, 28.014) / line, 2, 1e-12), "four times T doubles the line");

/* Low-activity Earth, 500 K, still loses H and keeps N2. */
var at500 = A.evaluate(earth, 500);
assert(A.rowById(at500, "h").held === false, "500 K hydrogen still leaks");
assert(A.rowById(at500, "n2").held === true, "500 K nitrogen still held");
assert(A.rowById(at500, "h").vMean < h.vMean, "cooler gas is slower");

assert(A.inRange(1000, A.T_MIN, A.T_MAX), "1000 in range");
assert(!A.inRange(10, A.T_MIN, A.T_MAX), "10 out of range");
assert(near(A.logMap(A.logUnmap(1000, A.T_MIN, A.T_MAX), A.T_MIN, A.T_MAX), 1000, 1e-6), "log round trip");

console.log("ok");
