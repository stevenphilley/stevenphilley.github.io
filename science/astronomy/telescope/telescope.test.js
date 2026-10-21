/* Telescope-optics checks: focal ratio, magnification, exit pupil,
   Rayleigh 1.22 λ/D, Dawes 116/D and 4.56/D, Bowen, and the presets.
   Run: node science/astronomy/telescope/telescope.test.js */
"use strict";

var T = require("./telescope.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(T.INCH_MM === 25.4, "international inch");
assert(T.PUPIL_MM === 7, "comparison pupil");
assert(T.RAYLEIGH_FACTOR === 1.22, "conventional Rayleigh factor");
assert(T.DAWES_PER_MM === 116, "Dawes millimetre form");
assert(T.DAWES_PER_INCH === 4.56, "Dawes inch form");
assert(near(T.DAWES_PER_INCH * T.INCH_MM, 115.824, 1e-9), "4.56 × 25.4");
assert(near(T.RULE_PER_INCH / T.INCH_MM, 1.968503937, 1e-9), "50 per inch in per-mm units");

/* Bessel J1. Known values, and a computed first zero. */
assert(T.besselJ1(0) === 0, "J1(0)");
assert(near(T.besselJ1(1), 0.4400505857449335, 1e-12), "J1(1) " + T.besselJ1(1));
assert(near(T.besselJ1(2), 0.5767248077568734, 1e-12), "J1(2)");
assert(near(T.besselJ1(5), -0.3275791375914652, 1e-12), "J1(5) " + T.besselJ1(5));
assert(near(T.besselJ1(10), 0.0434727461688616, 1e-12), "J1(10) " + T.besselJ1(10));
/* Series at 15. The asymptotic path, used past 15, is checked at 20
   against that same series (they agree before the series overflows). */
assert(near(T.besselJ1(15), 0.2051040386071169, 1e-12), "J1(15) " + T.besselJ1(15));
assert(near(T.besselJ1(20), 0.06683312358213858, 1e-8), "J1(20) asymptotic " + T.besselJ1(20));
assert(near(T.besselJ1(-10), -T.besselJ1(10), 0), "J1 is odd");
assert(near(T.J1_ZERO, 3.83170597, 1e-6), "first J1 zero " + T.J1_ZERO);
assert(Math.abs(T.besselJ1(T.J1_ZERO)) < 1e-10, "J1 at the root");
assert(near(T.RAYLEIGH_EXACT, 1.21966989, 1e-6), "zero/π " + T.RAYLEIGH_EXACT);
assert(T.RAYLEIGH_EXACT < 1.22 && T.RAYLEIGH_EXACT > 1.219, "1.22 rounds the exact factor");

/* Airy peak and the first dark ring. */
assert(near(T.airyIntensity(0, 550, 200), 1, 1e-12), "Airy peak");
var ray = T.rayleighArcsec(550, 200);
var thetaRay = ray / T.ARCSEC_PER_RAD;
assert(T.airyIntensity(thetaRay, 550, 200) < 1e-4, "intensity at 1.22 λ/D is the dark ring");
var thetaExact = (T.RAYLEIGH_EXACT * 550e-9 / 0.2) ;
assert(T.airyIntensity(thetaExact, 550, 200) < 1e-8, "intensity at the exact zero");

/* 200 mm, 1200 mm, 25 mm eyepiece, Barlow 1, 550 nm, naked-eye 6. */
var dob = T.solve({
  apertureMm: 200,
  focalMm: 1200,
  eyeMm: 25,
  afov: 50,
  barlow: 1,
  lambdaNm: 550,
  nelm: 6,
  sepArcsec: 1,
  eyepiece: true
});
assert(dob.ok, "dob solves");
assert(dob.focalRatio === 6, "f/6");
assert(dob.magnification === 48, "48×");
assert(near(dob.exitPupilMm, 200 / 48, 0), "exit pupil");
assert(near(dob.trueFieldDeg, 50 / 48, 0), "true field");
assert(near(dob.geometricGrasp, (200 / 7) * (200 / 7), 0), "grasp");
assert(dob.graspClipped === false, "4.17 mm exit fits in 7 mm");
assert(near(dob.areaLimit, 6 + 5 * Math.log(200 / 7) / Math.LN10, 1e-12), "area limit");
assert(near(dob.bowenLimit, 6.5 + 2.5 * Math.log(200 / 25.4) / Math.LN10 + 2.5 * Math.log(48) / Math.LN10, 1e-12), "Bowen");
assert(dob.bowenInRange === true, "Bowen range for the classroom Dob");
assert(near(dob.rayleighArcsec, 1.22 * 550e-9 / 0.2 * T.ARCSEC_PER_RAD, 0), "Rayleigh");
assert(dob.dawesMmArcsec === 116 / 200, "Dawes 116/D");
assert(near(dob.dawesInchArcsec, 4.56 / (200 / 25.4), 0), "Dawes 4.56/D");
assert(dob.dawesMmArcsec > dob.dawesInchArcsec, "116 rounding is slightly looser");
assert(near(dob.ruleMin, 200 / 7, 0), "minimum magnification rule");
assert(near(dob.ruleMaxInch, 50 * (200 / 25.4), 0), "50× per inch");
assert(dob.ruleMaxMm === 400, "2× per mm");
assert(near(dob.ruleAvgInch, 30 * (200 / 25.4), 0), "30× per inch");
assert(T.formatFocalRatio(dob.focalRatio) === "f/6", "format f/6");
assert(T.formatMag(dob.magnification) === "48×", "format 48×");
assert(T.formatMm(dob.exitPupilMm) === "4.17 mm", "format exit " + T.formatMm(dob.exitPupilMm));
assert(T.formatArcsec(dob.rayleighArcsec) === "0.692″", "format Rayleigh " + T.formatArcsec(dob.rayleighArcsec));
assert(T.formatArcsec(dob.dawesMmArcsec) === "0.580″", "format Dawes mm");
assert(T.formatArcsec(dob.dawesInchArcsec) === "0.579″", "format Dawes in " + T.formatArcsec(dob.dawesInchArcsec));
assert(T.formatLim(dob.areaLimit) === "13.28", "format area limit " + T.formatLim(dob.areaLimit));
assert(T.formatLim(dob.bowenLimit) === "12.94", "format Bowen " + T.formatLim(dob.bowenLimit));
assert(T.formatGrasp(dob.geometricGrasp) === "816×", "format grasp " + T.formatGrasp(dob.geometricGrasp));
assert(T.formatDeg(dob.trueFieldDeg) === "1.042°", "format field " + T.formatDeg(dob.trueFieldDeg));
assert(T.formatArcmin(dob.trueFieldDeg) === "62.5′", "format field arcmin " + T.formatArcmin(dob.trueFieldDeg));

/* Barlow 2 doubles magnification, halves exit pupil and true field, doubles f ratio. */
var bar = T.solve({
  apertureMm: 200,
  focalMm: 1200,
  eyeMm: 25,
  afov: 50,
  barlow: 2,
  lambdaNm: 550,
  nelm: 6,
  sepArcsec: 1,
  eyepiece: true
});
assert(bar.magnification === 96, "Barlow doubles magnification");
assert(near(bar.exitPupilMm, dob.exitPupilMm / 2, 1e-12), "Barlow halves exit pupil");
assert(near(bar.trueFieldDeg, dob.trueFieldDeg / 2, 1e-12), "Barlow halves true field");
assert(bar.effectiveFocalRatio === 12, "effective f/12");
assert(bar.focalRatio === 6, "objective f/6 is unchanged");
assert(bar.bowenLimit > dob.bowenLimit, "Bowen gets fainter as magnification rises");
assert(near(bar.areaLimit, dob.areaLimit, 1e-12), "area line does not move once the beam fits");

/* 7×50 classroom: exit pupil slightly over 7 mm, so the eye clips a little. */
var bino = T.presetById("bino-7x50");
var binoSol = T.solve({
  apertureMm: bino.apertureMm,
  focalMm: bino.focalMm,
  eyeMm: bino.eyeMm,
  afov: bino.afov,
  barlow: bino.barlow,
  lambdaNm: bino.lambdaNm,
  nelm: 6,
  sepArcsec: 1,
  eyepiece: true
});
assert(binoSol.magnification === 7, "7×");
assert(near(binoSol.exitPupilMm, 50 / 7, 0), "7×50 exit pupil");
assert(binoSol.graspClipped === true, "exit pupil over 7 mm");
assert(near(binoSol.acceptedApertureMm, 49, 1e-12), "accepted aperture is 7 × 7 mm");
assert(near(binoSol.areaLimit, 6 + 5 * Math.log(7) / Math.LN10, 1e-12), "clipped area limit is 5 log M");
assert(T.formatMm(binoSol.exitPupilMm) === "7.14 mm", "format 7.14 " + T.formatMm(binoSol.exitPupilMm));

/* 80 mm classroom. */
var r80 = T.presetById("refractor-80");
var r80s = T.solve({
  apertureMm: r80.apertureMm,
  focalMm: r80.focalMm,
  eyeMm: r80.eyeMm,
  afov: r80.afov,
  barlow: 1,
  lambdaNm: 550,
  nelm: 6.5,
  sepArcsec: 1,
  eyepiece: true
});
assert(r80s.focalRatio === 7, "80 mm is f/7");
assert(r80s.magnification === 28, "80 mm at 20 mm is 28×");

/* Crossover wavelength is independent of aperture. */
var cross = T.dawesRayleighCrossoverNm();
assert(near(cross, 461.0, 0.05), "crossover nm " + cross);
assert(near(T.rayleighArcsec(cross, 80), T.dawesMmArcsec(80), 1e-6), "forms meet at 80 mm");
assert(near(T.rayleighArcsec(cross, 2400), T.dawesMmArcsec(2400), 1e-6), "forms meet at 2.4 m");
assert(T.formatNm(cross) === "461 nm", "format crossover " + T.formatNm(cross));

/* Hubble: f/24 from 57.6 m and 2.4 m. No eyepiece lines. */
var hub = T.presetById("hubble");
assert(hub.focalMm / hub.apertureMm === 24, "Hubble focal length is f/24 × 2.4 m");
var hubs = T.solve({
  apertureMm: hub.apertureMm,
  focalMm: hub.focalMm,
  lambdaNm: hub.lambdaNm,
  nelm: 6,
  sepArcsec: 1,
  eyepiece: false
});
assert(hubs.ok && hubs.eyepiece === false, "Hubble solves without an eyepiece");
assert(hubs.focalRatio === 24, "Hubble f/24");
assert(hubs.magnification === null, "no magnification");
assert(hubs.areaLimit === null, "no visual limit without an eyepiece");
assert(T.formatGrasp(hubs.geometricGrasp) === "117,551×", "Hubble grasp " + T.formatGrasp(hubs.geometricGrasp));
assert(T.formatGrasp(hubs.geometricGrasp) !== "40,000×", "NASA’s 40,000 is a different statement");
assert(near(hubs.rayleighArcsec, 1.22 * 500e-9 / 2.4 * T.ARCSEC_PER_RAD, 1e-12), "Hubble Rayleigh at 500 nm");

/* JWST: 6.5 m and 131.4 m. Clear aperture 25 m² is a separate area ratio. */
var jw = T.presetById("jwst");
var jws = T.solve({
  apertureMm: jw.apertureMm,
  focalMm: jw.focalMm,
  lambdaNm: jw.lambdaNm,
  nelm: 6,
  sepArcsec: 1,
  eyepiece: false,
  clearAreaM2: jw.clearAreaM2
});
assert(T.formatFocalRatio(jws.focalRatio) === "f/20.22", "JWST focal ratio " + T.formatFocalRatio(jws.focalRatio));
assert(near(jws.focalRatio, 131400 / 6500, 0), "131.4 / 6.5");
assert(jws.clearGrasp > 0, "clear-aperture grasp");
assert(jws.clearGrasp < jws.geometricGrasp, "25 m² is less than a filled 6.5 m disk");
var pupilArea = Math.PI * 0.0035 * 0.0035;
assert(near(jws.clearGrasp, 25 / pupilArea, 1e-6), "25 m² over a 7 mm pupil");
assert(T.formatGrasp(jws.clearGrasp) === "649,612×", "JWST clear grasp " + T.formatGrasp(jws.clearGrasp));

/* Albireo separation is the catalog figure, wider than either limit of the classroom Dob. */
assert(T.ALBIREO_SEP_ARCSEC === 34.70, "Albireo sep2");
assert(T.ALBIREO_SEP_ARCSEC > dob.rayleighArcsec, "Albireo is wider than Rayleigh on the Dob");
assert(T.ALBIREO_SEP_ARCSEC > dob.dawesMmArcsec, "Albireo is wider than Dawes on the Dob");
var pairCenter = T.pairIntensity(0, dob.rayleighArcsec, 550, 200);
var pairPeak = T.pairIntensity(dob.rayleighArcsec / T.ARCSEC_PER_RAD / 2, dob.rayleighArcsec, 550, 200);
assert(pairPeak > pairCenter, "at Rayleigh the two peaks still stand above the middle");

/* Bad input. */
assert(T.solve({ apertureMm: 0, focalMm: 1200, lambdaNm: 550, nelm: 6, sepArcsec: 1, eyepiece: false }).ok === false, "zero aperture");
assert(T.solve({
  apertureMm: 200, focalMm: 1200, eyeMm: 0, afov: 50, barlow: 1,
  lambdaNm: 550, nelm: 6, sepArcsec: 1, eyepiece: true
}).ok === false, "zero eyepiece");

/* Inner-city sky is 2.5 magnitudes brighter in the limit, same aperture. */
var city = T.solve({
  apertureMm: 200, focalMm: 1200, eyeMm: 25, afov: 50, barlow: 1,
  lambdaNm: 550, nelm: 4, sepArcsec: 1, eyepiece: true
});
assert(near(dob.areaLimit - city.areaLimit, 2, 1e-12), "NELM shifts the area line one for one");

console.log("ok");
console.log("dob Rayleigh", T.formatArcsec(dob.rayleighArcsec), "Dawes", T.formatArcsec(dob.dawesMmArcsec), dob.dawesInchArcsec);
console.log("area", T.formatLim(dob.areaLimit), "bowen", T.formatLim(dob.bowenLimit), "grasp", T.formatGrasp(dob.geometricGrasp));
console.log("field", T.formatDeg(dob.trueFieldDeg), T.formatArcmin(dob.trueFieldDeg));
console.log("crossover", cross, T.formatNm(cross));
console.log("hubble grasp", T.formatGrasp(hubs.geometricGrasp), "rayleigh", T.formatArcsec(hubs.rayleighArcsec));
console.log("jwst f", T.formatFocalRatio(jws.focalRatio), "clear", T.formatGrasp(jws.clearGrasp), "disk", T.formatGrasp(jws.geometricGrasp), "rayleigh", T.formatArcsec(jws.rayleighArcsec));
console.log("bino area", T.formatLim(binoSol.areaLimit), "exit", T.formatMm(binoSol.exitPupilMm));
console.log("80 rayleigh", T.formatArcsec(r80s.rayleighArcsec), "area", T.formatLim(r80s.areaLimit));
