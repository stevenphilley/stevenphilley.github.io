/* Blackbody checks: Wien, Stefan–Boltzmann, solar ratio, presets, sRGB chip.
   Run: node science/astronomy/blackbody/blackbody.test.js */
"use strict";

var B = require("./blackbody.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

/* Defined constants. */
assert(B.H === 6.62607015e-34, "h");
assert(B.C === 299792458, "c");
assert(B.K === 1.380649e-23, "k");
assert(B.R_SUN_M === 6.957e8, "nominal solar radius");
assert(B.T_SUN_K === 5772, "nominal solar Teff");
assert(B.L_SUN_NOMINAL_W === 3.828e26, "nominal solar luminosity");
assert(B.VIS_MIN_NM === 400 && B.VIS_MAX_NM === 700, "visible window");

/* Wien root of (5 − x) e^x = 5. */
var x = B.wienX();
assert(near((5 - x) * Math.exp(x), 5, 1e-9), "Wien root residual " + x);
assert(near(x, 4.965114231744276, 1e-12), "Wien root digits " + x);

/* CODATA 2022 displays b = 2.897771955… × 10⁻³ m·K, exact. */
var b = B.wienB();
assert(near(b, 2.897771955e-3, 5e-13), "Wien b " + b);

/* CODATA displays σ = 5.670374419… × 10⁻⁸, exact. */
var sigma = B.sigma();
assert(near(sigma / 5.670374419e-8, 1, 1e-9), "sigma " + sigma);

/* λ_max = b/T. Nominal solar temperature peaks near 502 nm. */
var sunNm = B.wienNm(5772);
assert(near(sunNm, b / 5772 * 1e9, 1e-6), "sun peak identity");
assert(near(sunNm, 502.04, 0.02), "sun peak near 502 nm, got " + sunNm);
assert(B.peakBand(sunNm) === "visible", "sun peak is in the visible window");
assert(B.peakBand(B.wienNm(2000)) === "infrared", "2000 K peak is infrared");
assert(B.peakBand(B.wienNm(40000)) === "ultraviolet", "40000 K peak is ultraviolet");

/* Planck's law peaks at the Wien wavelength, within the sample. */
[2000, 2980, 3500, 5772, 9560, 12100, 40000].forEach(function (T) {
  var peak = B.wienLambdaM(T);
  var left = B.planck(peak * 0.995, T);
  var mid = B.planck(peak, T);
  var right = B.planck(peak * 1.005, T);
  assert(mid > left && mid > right, "Planck peaks at Wien for " + T + " " + left + " " + mid + " " + right);
});

/* Solar formula ratio is 1 at the nominal T and R. */
assert(near(B.luminosityRatio(5772, 1), 1, 1e-12), "solar formula ratio");
var nom = B.nominalLuminosityRatio(5772, 1);
assert(near(nom, 1, 0.002), "nominal luminosity ratio is close to 1, got " + nom);
assert(B.flux(5772) > 6e7 && B.flux(5772) < 7e7, "solar surface flux order " + B.flux(5772));

/* (R/R☉)² (T/T☉)⁴. */
assert(near(B.luminosityRatio(5772 * 2, 1), 16, 1e-9), "twice T is 16×");
assert(near(B.luminosityRatio(5772, 2), 4, 1e-9), "twice R is 4×");

/* Proxima's published luminosity is 0.00151 ± 0.00008. The formula at the
   central T and R should land inside that uncertainty. */
var prox = B.luminosityRatio(2980, 0.146);
assert(near(prox, 0.00151, 0.00008), "Proxima ratio " + prox);

/* Presets carry the cited central values. */
var ids = { sun: [5772, 1], proxima: [2980, 0.146], vega: [9560, 2.75], rigel: [12100, 78.9], betelgeuse: [3500, 887] };
var list = B.presets();
assert(list.length === 5, "five presets");
list.forEach(function (p) {
  assert(ids[p.id][0] === p.T && ids[p.id][1] === p.R, "preset " + p.id);
  assert(p.T >= B.T_MIN && p.T <= B.T_MAX, "preset T in range " + p.id);
  assert(p.R >= B.R_MIN && p.R <= B.R_MAX, "preset R in range " + p.id);
  if (p.id !== "sun") assert(p.uncertain === true, p.id + " is marked uncertain");
});
assert(B.presets()[0].uncertain === false, "solar nominals are exact conversion constants");

/* Log slider endpoints. */
assert(near(B.logMap(0, B.T_MIN, B.T_MAX), 2000, 1e-9), "T slider start");
assert(near(B.logMap(1, B.T_MIN, B.T_MAX), 40000, 1e-6), "T slider end");
assert(near(B.logUnmap(5772, B.T_MIN, B.T_MAX), Math.log(5772 / 2000) / Math.log(40000 / 2000), 1e-12), "T unmap");
assert(near(B.logMap(B.logUnmap(0.146, B.R_MIN, B.R_MAX), B.R_MIN, B.R_MAX), 0.146, 1e-12), "R round trip");

/* sRGB matrix sends D65 (Y=1) to linear white. */
var m = B.xyzToLinearMatrix();
var W = [0.3127 / 0.329, 1, (1 - 0.3127 - 0.329) / 0.329];
var rw = m[0] * W[0] + m[1] * W[1] + m[2] * W[2];
var gw = m[3] * W[0] + m[4] * W[1] + m[5] * W[2];
var bw = m[6] * W[0] + m[7] * W[1] + m[8] * W[2];
assert(near(rw, 1, 1e-9) && near(gw, 1, 1e-9) && near(bw, 1, 1e-9), "D65 maps to white " + rw + " " + gw + " " + bw);

/* CMF table is the 5 nm slice, ȳ peaks at 555 nm. */
assert(B.CMF[0][0] === 360 && B.CMF[B.CMF.length - 1][0] === 830, "CMF span");
assert(B.CMF.length === 95, "95 samples");
var yPeak = B.CMF.filter(function (row) { return row[0] === 555; })[0];
assert(yPeak && yPeak[2] === 1, "ȳ(555 nm) = 1");

/* Cool is red-dominant. Hot is blue-dominant. The Sun is not green. */
var cool = B.color(2000);
var sun = B.color(5772);
var hot = B.color(10000);
var veryHot = B.color(40000);
assert(cool.r > cool.g && cool.g > cool.b, "2000 K is red-dominant " + cool.hex);
assert(cool.b < 40, "2000 K has little blue " + cool.hex);
assert(hot.b > hot.r && hot.b >= hot.g, "10000 K is blue-weighted " + hot.hex);
assert(veryHot.b > veryHot.g && veryHot.g > veryHot.r, "40000 K is blue " + veryHot.hex);
assert(sun.g > sun.b && sun.r > sun.b, "Sun is not blue " + sun.hex);
assert(Math.abs(sun.r - sun.g) < 40, "Sun is near white, not a green lamp " + sun.hex);
assert(/^#[0-9a-f]{6}$/.test(sun.hex), "hex " + sun.hex);

/* Formatters used on the page. */
assert(B.formatNm(sunNm).indexOf("nm") > 0, "format nm");
assert(B.formatRatio(1) === "1", "ratio 1");
assert(B.formatRatio(prox).indexOf("0.0015") === 0, "proxima formats " + B.formatRatio(prox));
assert(B.formatTemp(5772.4) === "5772", "temp format");
assert(B.formatRadius(0.146) === "0.146", "radius format " + B.formatRadius(0.146));
assert(B.formatRadius(78.9) === "78.9", "rigel radius format " + B.formatRadius(78.9));
assert(B.why(5772).indexOf("502") > 0, "why mentions the solar peak");
assert(B.why(2000).indexOf("infrared") > 0, "why for a cool star");
assert(B.why(40000).indexOf("ultraviolet") > 0, "why for a hot star");

console.log("ok");
console.log("b", b);
console.log("sigma", sigma);
console.log("sun nm", sunNm);
console.log("sun flux", B.flux(5772));
console.log("L/L_N", nom);
console.log("proxima", prox, B.formatRatio(prox));
console.log("vega", B.luminosityRatio(9560, 2.75), B.formatRatio(B.luminosityRatio(9560, 2.75)));
console.log("rigel", B.luminosityRatio(12100, 78.9), B.formatRatio(B.luminosityRatio(12100, 78.9)));
console.log("betelgeuse", B.luminosityRatio(3500, 887), B.formatRatio(B.luminosityRatio(3500, 887)));
console.log("colors", cool.hex, sun.hex, hot.hex, veryHot.hex, "clipped", cool.clipped, sun.clipped, hot.clipped, veryHot.clipped);
