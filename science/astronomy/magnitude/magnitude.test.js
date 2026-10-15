/* Magnitude checks: flux ratio, distance modulus, Sun at 10 pc and at 1 AU.
   Run: node science/astronomy/magnitude/magnitude.test.js */
"use strict";

var M = require("./magnitude.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

var F = M.FACT;

assert(near(M.LY_PER_PC_EXACT, 3.261563777, 1e-9), "unrounded pc/ly " + M.LY_PER_PC_EXACT);
assert(M.LY_PER_PC === 3.2616, "display conversion is 3.2616");
assert(Number(M.LY_PER_PC_EXACT.toFixed(4)) === 3.2616, "four decimals of the quotient is 3.2616");

/* Five magnitudes is a factor of 100. Both formulas. */
assert(near(M.fluxRatio(5), 100, 1e-9), "10^(0.4·5) is 100, got " + M.fluxRatio(5));
assert(M.fluxRatioHundred(5) === 100, "100^(5/5) is 100");
assert(near(M.fluxRatio(1), Math.pow(10, 0.4), 0), "one magnitude is 10^0.4");
assert(near(M.fluxRatio(1), 2.51188643150958, 1e-12), "one magnitude ≈ 2.5119");
assert(M.formatRatio(M.fluxRatio(1)) === "2.512", "one magnitude formats as 2.512");
assert(M.formatRatio(100) === "100", "ratio 100 formats as 100");
assert(M.formatRatio(1) === "1", "ratio 1");
assert(near(M.deltaFromRatio(100), 5, 1e-12), "inverse of 100 is 5");
assert(near(M.deltaFromRatio(M.fluxRatio(1)), 1, 1e-12), "inverse of one magnitude");

[0, 1, 5, -2.5, 2.5, 10, -1].forEach(function (dm) {
  assert(near(M.fluxRatio(dm), M.fluxRatioHundred(dm), 1e-9), "formulas agree at Δm " + dm);
  if (M.fluxRatio(dm) > 0) {
    assert(near(M.deltaFromRatio(M.fluxRatio(dm)), dm, 1e-9), "inverse round trip " + dm);
  }
});

/* Brighter is the smaller magnitude: it has the larger flux. */
assert(M.fluxRatio(F.vegaV - F.siriusV) > 1, "Sirius is brighter than Vega, so the flux ratio exceeds 1");

/* Distance modulus. d = 10 pc gives m = M. */
assert(M.distanceModulus(10) === 0, "modulus at 10 pc is 0");
assert(M.apparent(F.sunM, 10) === F.sunM, "Sun at 10 pc equals its absolute magnitude");
assert(M.sunAt10Pc() === F.sunM, "sunAt10Pc");
assert(M.formatAbs(M.sunAt10Pc()) === "+4.83", "Sun at 10 pc formats as +4.83");
assert(M.formatAbs(0) === "0", "zero magnitude");

/* Sun at 1 AU, no extinction, rounds to the fact sheet’s −26.74. */
var atAu = M.sunAtAu();
assert(near(atAu, -26.7421256658823, 1e-9), "Sun at 1 AU " + atAu);
assert(Math.round(atAu * 100) / 100 === F.sunV, "Sun at 1 AU rounds to −26.74");
assert(near(M.pcFromAu(1) * M.AU_PER_PC, 1, 1e-12), "1 AU round trip");
assert(M.formatAu(M.pcFromAu(1)) === "1 AU", "format 1 AU");

/* Parallax tie-in. */
assert(M.parallaxArcsec(1) === 1, "1 pc is 1 arcsec");
assert(M.parallaxArcsec(10) === 0.1, "10 pc is 0.1 arcsec");
assert(near(M.pcFromParallax(F.siriusParallaxArcsec), 1 / 0.37921, 0), "Sirius distance");
assert(M.parallaxIsStellar(10) === true, "10 pc is a stellar parallax");
assert(M.parallaxIsStellar(M.pcFromAu(1)) === false, "1 AU is not a stellar parallax");

var siriusD = M.siriusDistancePc();
var siriusM = M.siriusAbsolute();
assert(near(M.apparent(siriusM, siriusD), F.siriusV, 1e-10), "Sirius apparent round trip");
assert(M.formatParallax(10) === "0.1″ · 100 mas", "10 pc parallax text " + M.formatParallax(10));

/* Light-years use the stated 3.2616 approximation, both ways. */
assert(near(M.lyFromPc(1), 3.2616, 1e-12), "1 pc → 3.2616 ly");
assert(near(M.lyFromPc(10), 32.616, 1e-9), "10 pc → 32.616 ly");
assert(near(M.pcFromLy(32.616), 10, 1e-9), "32.616 ly → 10 pc");
assert(M.formatLy(1) === "3.2616 ly", "format 1 pc in ly: " + M.formatLy(1));
assert(M.formatLy(10) === "32.616 ly", "format 10 pc in ly: " + M.formatLy(10));
assert(M.formatPc(10) === "10 pc", "format 10 pc");

/* Naked-eye classes. Sun at 10 pc is a dark-sky star, past the inner-city line. */
assert(M.visibility(F.sunM) === "dark-only", "Sun at 10 pc");
assert(M.visibility(F.sunV) === "city-and-dark", "Sun in our sky");
assert(M.visibility(4) === "city-and-dark", "mag 4 is the inner-city boundary");
assert(M.visibility(4.0001) === "dark-only", "just fainter than 4");
assert(M.visibility(6) === "dark-only", "mag 6 is still the bright side of the ideal range");
assert(M.visibility(6.25) === "faint-end", "between 6 and 6.5");
assert(M.visibility(6.5) === "faint-end", "6.5 is the faint end");
assert(M.visibility(6.5001) === "beyond", "past 6.5");

/* Distance that puts the Sun at a chosen apparent magnitude. */
var d4 = M.distanceForApparent(F.sunM, 4);
var d6 = M.distanceForApparent(F.sunM, 6);
assert(near(M.apparent(F.sunM, d4), 4, 1e-9), "Sun moved to mag 4");
assert(near(M.apparent(F.sunM, d6), 6, 1e-9), "Sun moved to mag 6");
assert(d4 < 10 && d6 > 10, "mag 4 is closer than 10 pc; mag 6 is farther");

/* Slider domain holds 1 AU and 10 pc. */
assert(M.pcFromAu(1) > M.DIST_MIN_PC && M.pcFromAu(1) < M.DIST_MAX_PC, "1 AU is on the slider");
assert(near(M.posToDist(M.distToPos(10)), 10, 1e-9), "10 pc slider round trip");
assert(near(M.posToDist(M.distToPos(M.pcFromAu(1))), M.pcFromAu(1), M.pcFromAu(1) * 1e-9), "1 AU slider round trip");

assert(M.parseNumber("−26.74") === -26.74, "unicode minus");
assert(M.parseNumber("32.616") === 32.616, "plain number");
assert(M.parseNumber("nope") === null, "reject words");
assert(M.parseNumber("") === null, "reject empty");

assert(M.findScale("vega").m === 0.03, "Vega preset");
assert(M.findScale("ideal").kind === "range", "ideal sky is a range");
assert(M.findScale("polaris").approx === true, "Polaris marked approximate");
assert(M.findScale("sirius").approx === false, "Sirius catalog value");

console.log("magnitude.test.js: all checks passed");
