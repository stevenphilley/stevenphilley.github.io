/* Distance-ladder checks: modulus with extinction, parallax inversion and
   its asymmetric error, Benedict et al. 2007 Table 12, Richardson et al. 2014
   M_B, and cz/H0 for the two cited Hubble constants.
   Run: node science/astronomy/distance-ladder/distance-ladder.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var DL = require("./distance-ladder.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(DL.LY_PER_PC === 3.2616, "light-year rounding matches the magnitude desk");
assert(DL.C_KM_S === 299792.458, "defined c");
assert(DL.H0_PLANCK === 67.4 && DL.H0_PLANCK_ERR === 0.5, "Planck 2018");
assert(DL.H0_SHOES === 73.04 && DL.H0_SHOES_ERR === 1.04, "SH0ES 2022");
assert(DL.CEP_A === -4.05 && DL.CEP_A_ERR === 0.02, "Benedict V zero-point");
assert(DL.CEP_B === -2.43 && DL.CEP_B_ERR === 0.12, "Benedict V slope");
assert(DL.CEP_LOGP_LO === 0.6504 && DL.CEP_LOGP_HI === 1.5509, "ten-star log P window");
assert(DL.CEP_SCATTER_MAG === 0.10, "V residual scatter");
assert(DL.SN_MB === -19.25 && DL.SN_MB_ERR === 0.20 && DL.SN_SIGMA === 0.50, "Richardson mean");
assert(DL.SUN_MV === 4.83, "Sun fact-sheet absolute magnitude");

/* Hand example: m = 10, M = 0, A = 0 → d = 1000 pc exactly. */
assert(DL.distancePc(10, 0, 0) === 1000, "1000 pc from modulus 10");
assert(DL.apparentMag(0, 1000, 0) === 10, "apparent from that distance");
assert(DL.absoluteMag(10, 1000, 0) === 0, "absolute from that distance");
assert(DL.distanceModulus(10) === 0, "modulus vanishes at 10 pc");
assert(DL.apparentMag(4.83, 10, 0) === 4.83, "Sun at 10 pc is unchanged");

/* Hand example: A = 1 mag makes the same star look farther by 10^0.2. */
var dExt = DL.distancePc(10, 0, 1);
assert(near(dExt, 10 * Math.pow(10, 1.8), 1e-9), "A = 1, modulus 9");
assert(near(dExt / 1000, Math.pow(10, -0.2), 1e-12), "one magnitude of extinction");
assert(near(DL.apparentMag(0, 1000, 1), 11, 1e-12), "extinction brightens the apparent modulus");
assert(near(DL.lyFromPc(10), 32.616, 1e-12), "10 pc in light-years");
assert(near(DL.pcFromLy(32.616), 10, 1e-12), "light-year round trip");
assert(DL.pcFromMpc(1) === 1e6 && DL.mpcFromPc(1e6) === 1, "megaparsec");

/* Sirius: ESA prints p = 0.37921″ and 1/p = 2.637 pc. */
var sirius = DL.presetById("sirius");
assert(sirius.pArcsec === 0.37921 && sirius.sigmaArcsec == null, "Sirius parallax, no invented error");
assert(near(DL.pcFromParallaxArcsec(0.37921), 1 / 0.37921, 0), "Sirius inversion");
assert(near(1 / 0.37921, 2.637, 5e-4), "ESA rounds that quotient to 2.637");
var siriusErr = DL.parallaxError(0.37921, null);
assert(siriusErr.hasSigma === false && near(siriusErr.dPc, 1 / 0.37921, 0), "no sigma");

/* δ Cep: 3.66 ± 0.15 mas. Fractional error equals σ/p.
   Near bound 1000/3.81, far bound 1000/3.51. */
var dCepP = DL.presetById("delta-cep-plx");
assert(dCepP.pMas === 3.66 && dCepP.sigmaMas === 0.15, "δ Cep parallax");
var p = 3.66 / 1000;
var sig = 0.15 / 1000;
var bounds = DL.parallaxError(p, sig);
assert(near(bounds.dPc, 1000 / 3.66, 1e-9), "δ Cep distance");
assert(near(bounds.fraction, 0.15 / 3.66, 1e-12), "fractional parallax error");
assert(near(bounds.linearSigmaPc, bounds.dPc * bounds.fraction, 1e-9), "linear distance error");
assert(near(bounds.dNearPc, 1000 / 3.81, 1e-9), "near bound");
assert(near(bounds.dFarPc, 1000 / 3.51, 1e-9), "far bound");
assert(bounds.dFarPc - bounds.dPc > bounds.dPc - bounds.dNearPc, "far error is the larger one");
assert(bounds.unbounded === false, "3.66 mas is resolved");
var blown = DL.parallaxError(1, 1);
assert(blown.unbounded === true && blown.dFarPc === Infinity, "sigma equal to p is unbounded");

/* The paper’s (m−M)0 = 7.19 includes LKH. Plain 1/p does not. */
var plainMu = DL.distanceModulus(1000 / 3.66);
assert(Math.abs(plainMu - DL.DELTA_CEP_MU) > 0.005, "inversion is not the LKH modulus");
assert(DL.DELTA_CEP_LKH === -0.01 && DL.DELTA_CEP_MV === -3.47, "Table 11 comparison figures");

/* P = 10 days sits on the zero-point: M_V = −4.05 exactly. */
assert(near(DL.cepheidMV(10), -4.05, 1e-12), "ten-day Cepheid");
assert(DL.cepheidInSample(10) === true, "log P = 1 is inside the sample");
assert(DL.cepheidInSample(2) === false, "2 days is outside");
assert(near(Math.log10(35.551341), 1.5509, 5e-5), "ℓ Car’s printed log P");

/* δ Cep Cepheid preset. M from the period, distance from ⟨V⟩ and A_V. */
var cep = DL.presetById("delta-cep");
assert(cep.periodDays === 5.36627 && cep.vMean === 3.960 && cep.aV === 0.23, "Table 2 inputs");
assert(cep.logPPrinted === 0.7297, "printed log P");
var mv = DL.cepheidMV(cep.periodDays);
var mvPrinted = DL.CEP_A + DL.CEP_B * (cep.logPPrinted - 1);
assert(Math.abs(mv - mvPrinted) < 0.002, "computed log stays near the printed log");
var dCep = DL.distancePc(cep.vMean, mv, cep.aV);
assert(near(dCep, 10 * Math.pow(10, (3.730 - mv) / 5), 1e-6), "extinction-corrected modulus");
assert(DL.cepheidInSample(cep.periodDays), "δ Cep is inside the ten-star window");
assert(near(DL.fractionalDistanceFromMag(0.10), Math.LN10 / 50, 1e-12), "0.10 mag residual");
assert(near(DL.distanceFactorFromMag(0.10), Math.pow(10, 0.02), 1e-12), "distance factor of the scatter");

/* SN 2011fe. μ = 10.00 − 0.11 − (−19.25) = 29.14. */
var sn = DL.presetById("sn2011fe");
assert(sn.bPeak === 10.00 && sn.aB === 0.11, "Richmond & Smith B peak and A_B");
var muSn = sn.bPeak - sn.aB - DL.SN_MB;
assert(near(muSn, 29.14, 1e-12), "modulus 29.14");
var dSn = DL.distancePc(sn.bPeak, DL.SN_MB, sn.aB);
assert(near(dSn, 10 * Math.pow(10, 29.14 / 5), 1e-4), "SN distance");
assert(near(DL.m101Pc(), 10 * Math.pow(10, 29.10 / 5), 1e-4), "adopted M101 modulus is a different number");
assert(Math.abs(DL.mpcFromPc(dSn) - DL.mpcFromPc(DL.m101Pc())) > 0.05, "candle and adopted modulus are not forced to agree");

/* Coma. d = cz/H0. Both cited central values. */
var coma = DL.presetById("coma");
assert(coma.cz === 6853 && coma.sigmaCz === 1082, "Colless & Dunn 1996");
var dP = DL.hubbleMpc(6853, DL.H0_PLANCK);
var dS = DL.hubbleMpc(6853, DL.H0_SHOES);
assert(near(dP, 6853 / 67.4, 1e-12), "Planck distance");
assert(near(dS, 6853 / 73.04, 1e-12), "SH0ES distance");
assert(dP > dS, "smaller H0 is the larger distance");
var tension = dP - dS;
var peculiar = 1082 / 67.4;
assert(peculiar > tension, "the dispersion scale exceeds the H0 difference");
assert(near(DL.zFromCz(6853), 6853 / 299792.458, 0), "non-relativistic z");
assert(DL.zFromCz(6853) < 0.03, "still the low-z toy");

var bars = DL.ladder();
assert(bars.length === 4, "four rungs on the sketch");
assert(bars[0].loPc === 1.3 && bars[0].hiPc === 100, "parallax sketch edges");
assert(near(bars[1].hiPc, 40e6, 0), "Cepheid reach 40 Mpc");
assert(bars[3].loPc === 100e6 && bars[3].hiPc === 600e6, "Hubble-flow sentence");
assert(bars[0].sketch && bars[3].sketch, "edges are labeled sketches");

var ids = ["sun-10pc", "sirius", "delta-cep-plx", "delta-cep", "sn2011fe", "coma"];
var list = DL.presets();
assert(list.length === 6, "six presets");
ids.forEach(function (id, i) {
  assert(list[i].id === id, "order " + id);
});

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("/science/astronomy/distance-ladder/") !== -1, "canonical path");
assert(html.indexOf("Educational") !== -1, "disclaimer");
assert(html.indexOf("Not a catalog") !== -1, "catalog disclaimer");
assert(html.indexOf("Benedict et al. 2007") !== -1, "Cepheid citation");
assert(html.indexOf("−4.05") !== -1 && html.indexOf("−2.43") !== -1, "coefficients as printed");
assert(html.indexOf("Richardson et al. 2014") !== -1, "SN citation");
assert(html.indexOf("−19.25") !== -1, "published mean, not a rounded −19.3");
assert(html.indexOf("Colless") !== -1 && html.indexOf("6853") !== -1, "Coma cz");
assert(html.indexOf("67.4") !== -1 && html.indexOf("73.04") !== -1, "both H0 values");
assert(html.indexOf("/science/astronomy/redshift/") !== -1, "redshift link");
assert(html.indexOf("/science/astronomy/parallax/") !== -1, "parallax link");
assert(html.indexOf("/science/astronomy/magnitude/") !== -1, "magnitude link");
assert(html.indexOf("aria-current=\"page\"") !== -1, "current nav item");
assert(html.indexOf("data-preset=\"delta-cep\"") !== -1, "Cepheid preset");
assert(html.indexOf("data-preset=\"sn2011fe\"") !== -1, "SN preset");
assert(html.indexOf("data-preset=\"coma\"") !== -1, "Coma preset");

console.log("hand 1000 pc", DL.distancePc(10, 0, 0));
console.log("hand A=1 pc", dExt);
console.log("sirius pc", 1 / 0.37921, "ly", DL.lyFromPc(1 / 0.37921));
console.log("delta cep pc", bounds.dPc, "frac", bounds.fraction, "near", bounds.dNearPc, "far", bounds.dFarPc);
console.log("plain mu", plainMu, "paper mu", DL.DELTA_CEP_MU);
console.log("cepheid MV", mv, "printed-log MV", mvPrinted, "d pc", dCep, "Mpc", DL.mpcFromPc(dCep));
console.log("scatter frac", DL.fractionalDistanceFromMag(0.10), "factor", DL.distanceFactorFromMag(0.10));
console.log("SN pc", dSn, "Mpc", DL.mpcFromPc(dSn), "M101 adopted Mpc", DL.mpcFromPc(DL.m101Pc()));
console.log("Coma Planck", dP, "SH0ES", dS, "diff", tension, "peculiar", peculiar, "z", DL.zFromCz(6853));
console.log("distance-ladder.test.js ok");
