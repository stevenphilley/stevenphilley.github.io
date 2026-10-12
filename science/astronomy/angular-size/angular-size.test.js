/* Angular-size checks against NASA NSSDCA fact-sheet inputs.
   Run: node science/astronomy/angular-size/angular-size.test.js */
"use strict";

var A = require("./angular-size.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

var F = A.FACT;

assert(near(F.moonDiameterKm, 2 * F.moonVolumetricMeanRadiusKm, 1e-9), "Moon diameter is twice the volumetric mean radius");
assert(near(F.sunDiameterKm, 2 * F.sunVolumetricMeanRadiusKm, 1e-6), "Sun diameter is twice the volumetric mean radius");
assert(F.moonPerigeeKm === 363300, "mean perigee is 0.3633 × 10^6 km");
assert(F.moonApogeeKm === 405500, "mean apogee is 0.4055 × 10^6 km");
assert(F.moonSmaKm === 384400, "Moon semimajor axis is 0.3844 × 10^6 km");
assert(F.earthPerihelionKm === 147095000, "perihelion is 147.095 × 10^6 km");
assert(F.earthAphelionKm === 152100000, "aphelion is 152.100 × 10^6 km");
assert(F.earthSmaKm === 149598000, "Earth semimajor axis is 149.598 × 10^6 km");

/* Sheet cross-check: Moon apparent diameter 1896″ at 378,000 km. */
var opp = A.describeKm(F.moonDiameterKm, F.moonMeanOppositionKm);
assert(near(opp.exact.arcsec, 1896.09, 0.02), "opposition arcsec " + opp.exact.arcsec);
assert(Math.round(opp.exact.arcsec) === F.moonApparentArcsecAtOpposition, "opposition rounds to the sheet’s 1896″");

var periMoon = A.describeKm(F.moonDiameterKm, F.moonPerigeeKm);
var apoMoon = A.describeKm(F.moonDiameterKm, F.moonApogeeKm);
var meanMoon = A.describeKm(F.moonDiameterKm, F.moonSmaKm);
assert(periMoon.exact.degText === "0.5480°", "perigee degrees " + periMoon.exact.degText);
assert(periMoon.exact.arcminText === "32.880′", "perigee arcmin " + periMoon.exact.arcminText);
assert(periMoon.exact.arcsecText === "1972.81″", "perigee arcsec " + periMoon.exact.arcsecText);
assert(apoMoon.exact.degText === "0.4910°", "apogee degrees " + apoMoon.exact.degText);
assert(apoMoon.exact.arcminText === "29.458′", "apogee arcmin " + apoMoon.exact.arcminText);
assert(apoMoon.exact.arcsecText === "1767.51″", "apogee arcsec " + apoMoon.exact.arcsecText);
assert(meanMoon.exact.arcminText === "31.075′", "mean Moon arcmin " + meanMoon.exact.arcminText);
var meanPair = A.comparePair(F.moonSmaKm, F.earthSmaKm);
assert(meanPair.kind === "annular" && A.formatRatio(meanPair.ratio) === "0.9719", "mean ratio " + meanPair.ratio);

var sunPeri = A.describeKm(F.sunDiameterKm, F.earthPerihelionKm);
var sunAph = A.describeKm(F.sunDiameterKm, F.earthAphelionKm);
var sunMean = A.describeKm(F.sunDiameterKm, F.earthSmaKm);
assert(sunPeri.exact.degText === "0.5420°", "perihelion degrees " + sunPeri.exact.degText);
assert(sunPeri.exact.arcminText === "32.518′", "perihelion arcmin " + sunPeri.exact.arcminText);
assert(sunPeri.exact.arcsecText === "1951.08″", "perihelion arcsec " + sunPeri.exact.arcsecText);
assert(near(sunPeri.exact.arcsec, F.sunApparentArcsecMax, 1), "perihelion is within 1″ of the sheet’s 1952″");
assert(Math.round(sunPeri.exact.arcsec) === 1951, "perihelion rounds to 1951 arcsec, one under the sheet integer 1952");
assert(sunAph.exact.degText === "0.5241°", "aphelion degrees " + sunAph.exact.degText);
assert(sunAph.exact.arcminText === "31.448′", "aphelion arcmin " + sunAph.exact.arcminText);
assert(sunAph.exact.arcsecText === "1886.88″", "aphelion arcsec " + sunAph.exact.arcsecText);
assert(Math.round(sunAph.exact.arcsec) === F.sunApparentArcsecMin, "aphelion rounds to the sheet’s 1887″");
assert(sunMean.exact.arcminText === "31.974′", "mean Sun arcmin " + sunMean.exact.arcminText);
assert(sunMean.exact.arcsecText === "1918.44″", "mean Sun arcsec " + sunMean.exact.arcsecText);
assert(near(sunMean.exact.arcsec, F.sunApparentArcsecAt1AU, 1), "mean Sun is within 1″ of the sheet’s 1919″");

/* Exact formula and the small-angle line. */
var d = F.moonDiameterKm;
var D = F.moonPerigeeKm;
assert(near(A.angularDiameterRad(d, D), 2 * Math.atan(d / (2 * D)), 0), "exact is 2·arctan(d/2D)");
assert(near(A.smallAngleRad(d, D), d / D, 0), "approximation is d/D");
assert(periMoon.relPct > 0 && periMoon.relPct < 0.001, "small-angle is a hair high for the Moon");

/* A wide object shows the approximation drifting. */
var wide = A.describe(1, 1);
assert(wide.exact.degText === "53.1301°", "right-sized object " + wide.exact.degText);
assert(wide.relPct > 7 && wide.relPct < 8, "small-angle is several percent high when d = D");

/* Eclipse ratio from the same diameters. */
var cover = A.comparePair(F.moonPerigeeKm, F.earthPerihelionKm);
var coverEasy = A.comparePair(F.moonPerigeeKm, F.earthAphelionKm);
var ring = A.comparePair(F.moonApogeeKm, F.earthPerihelionKm);
var ringSoft = A.comparePair(F.moonApogeeKm, F.earthAphelionKm);
assert(cover.kind === "total" && cover.ratio > 1, "perigee Moon covers a perihelion Sun");
assert(A.formatRatio(cover.ratio) === "1.0111", "just-cover ratio " + cover.ratio);
assert(coverEasy.kind === "total" && A.formatRatio(coverEasy.ratio) === "1.0455", "perigee / aphelion " + coverEasy.ratio);
assert(ring.kind === "annular" && A.formatRatio(ring.ratio) === "0.9059", "apogee / perihelion " + ring.ratio);
assert(ringSoft.kind === "annular" && A.formatRatio(ringSoft.ratio) === "0.9367", "apogee / aphelion " + ringSoft.ratio);

/* Match distance: ratio is 1 when the Moon sits there. Same for exact and small-angle. */
var matchPeri = A.matchDistance(F.moonDiameterKm, F.sunDiameterKm, F.earthPerihelionKm);
var matchAph = A.matchDistance(F.moonDiameterKm, F.sunDiameterKm, F.earthAphelionKm);
assert(Math.round(matchPeri) === 367346, "match at perihelion " + matchPeri);
assert(Math.round(matchAph) === 379846, "match at aphelion " + matchAph);
assert(near(A.ratio(F.moonDiameterKm, matchPeri, F.sunDiameterKm, F.earthPerihelionKm), 1, 1e-12), "match ratio is 1");
assert(F.moonPerigeeKm < matchPeri, "mean perigee is inside the cover distance");
assert(F.moonApogeeKm > matchAph, "mean apogee is outside the cover distance");

/* Supermoon / micromoon from the table, and the footnote’s wider span. */
var moon = A.moonSizeNote();
assert(A.formatRatio(moon.diameterRatio) === "1.1162", "perigee/apogee angular ratio " + moon.diameterRatio);
assert(A.formatPct(moon.diameterPct, 3) === "11.616%", "angular percent " + moon.diameterPct);
assert(A.formatPct(moon.areaPct, 3) === "24.580%", "area percent " + moon.areaPct);
assert(A.formatPct(moon.footnotePct, 3) === "14.005%", "footnote percent " + moon.footnotePct);

/* Everyday presets are labeled approximate and sit on the sliders. */
var approx = 0;
var fact = 0;
A.PRESETS.forEach(function (p) {
  if (p.approximate) approx += 1;
  else fact += 1;
  var dM = A.kmToM(p.dKm);
  var DM = A.kmToM(p.DKm);
  assert(dM >= A.DIAM_MIN_M && dM <= A.DIAM_MAX_M, "diameter in slider range " + p.id);
  assert(DM >= A.DIST_MIN_M && DM <= A.DIST_MAX_M, "distance in slider range " + p.id);
  var got = A.describeKm(p.dKm, p.DKm);
  assert(got.ok && !got.inside, "preset is outside the sphere " + p.id);
});
assert(fact === 6, "six fact-sheet presets");
assert(approx === 3, "three approximate everyday presets");

var thumb = A.describeKm(0.00002, 0.00057);
assert(thumb.exact.degText === "2.0102°", "thumb " + thumb.exact.degText);
var coin = A.describeKm(0.000024, 0.0007);
assert(coin.exact.degText === "1.9642°", "coin " + coin.exact.degText);
var half = A.describeKm(0.000005, 0.00057);
assert(half.exact.degText === "0.5026°", "half-degree rule " + half.exact.degText);

/* Slider round-trip keeps a fact-sheet distance on its step, readout stays exact via state. */
var pos = A.valueToPos(A.kmToM(F.moonPerigeeKm), A.DIST_MIN_M, A.DIST_MAX_M);
var back = A.posToValue(pos, A.DIST_MIN_M, A.DIST_MAX_M);
assert(Math.abs(back - A.kmToM(F.moonPerigeeKm)) / A.kmToM(F.moonPerigeeKm) < 0.002, "perigee slider step " + back);

assert(A.parseToMeters("363,300", "km") === 363300000, "grouped km parse");
assert(A.parseToMeters("2", "cm") === 0.02, "cm parse");
assert(A.parseToMeters("0", "km") == null, "reject zero");
assert(A.parseToMeters("-3", "m") == null, "reject negative");
assert(A.inputString(A.kmToM(3474.8), "km") === "3474.8", "diameter field");
assert(A.formatKm(3474.8) === "3,474.8 km", "grouped diameter");
assert(A.formatKm(363300) === "363,300 km", "grouped perigee");
assert(A.formatMeters(0.02) === "2 cm", "thumb width");
assert(A.formatMeters(0.57) === "57 cm", "arm length");
assert(A.formatMeters(0.005) === "5 mm", "half-degree mark");

console.log("angular-size checks ok");
console.log("Moon perigee", periMoon.exact.degText, periMoon.exact.arcminText, periMoon.exact.arcsecText, periMoon.exact.radText);
console.log("Moon apogee", apoMoon.exact.degText, apoMoon.exact.arcminText, apoMoon.exact.arcsecText);
console.log("Sun perihelion", sunPeri.exact.degText, sunPeri.exact.arcminText, sunPeri.exact.arcsecText);
console.log("Sun aphelion", sunAph.exact.degText, sunAph.exact.arcminText, sunAph.exact.arcsecText);
console.log("ratios", A.formatRatio(cover.ratio), A.formatRatio(coverEasy.ratio), A.formatRatio(ring.ratio), A.formatRatio(ringSoft.ratio));
console.log("supermoon", A.formatRatio(moon.diameterRatio), A.formatPct(moon.diameterPct, 3), A.formatPct(moon.areaPct, 3), A.formatPct(moon.footnotePct, 3));
