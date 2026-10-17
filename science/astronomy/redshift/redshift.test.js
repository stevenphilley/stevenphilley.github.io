/* Redshift checks: z definition, relativistic β, cited presets, Hubble toy.
   Run: node science/astronomy/redshift/redshift.test.js */
"use strict";

var R = require("./redshift.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(R.C_M_S === 299792458, "c m/s");
assert(R.C_KM_S === 299792.458, "c km/s");
assert(R.VIS_MIN_NM === 400 && R.VIS_MAX_NM === 700, "visible window");
assert(R.H0_PLANCK === 67.4 && R.H0_PLANCK_ERR === 0.5, "Planck H0");
assert(R.H0_SHOES === 73.04 && R.H0_SHOES_ERR === 1.04, "SH0ES H0");

/* z = 1 → β = 3/5 = 0.6 exactly, from ((1+z)²−1)/((1+z)²+1). */
var beta1 = R.relativisticBeta(1);
assert(near(beta1, 0.6, 1e-15), "z=1 beta " + beta1);
assert(near(R.zFromBeta(0.6), 1, 1e-12), "beta 0.6 returns z=1");
assert(near(R.czKmS(1), R.C_KM_S, 1e-9), "z=1 cz is c");
assert(R.czKmS(1) > R.C_KM_S - 1, "z=1 cz is not a subluminal speed");
assert(near(R.relativisticKmS(1), 0.6 * R.C_KM_S, 1e-6), "z=1 relativistic speed");
assert(near(R.speedGap(1), (1 - 0.6) / 0.6, 1e-12), "z=1 gap is 2/3");
assert(near(R.scaleThenOverNow(1), 0.5, 1e-15), "z=1 scale ratio 1/2");

/* Round-trip the Doppler formula across a signed range. */
[-0.01, -0.001, 0, 0.00158, 0.1, 0.15756751, 1, 2.29, 10.6034].forEach(function (z) {
  var beta = R.relativisticBeta(z);
  var back = R.zFromBeta(beta);
  assert(near(back, z, 1e-10), "roundtrip " + z + " -> " + back);
  var onePlus = Math.sqrt((1 + beta) / (1 - beta));
  assert(near(onePlus, 1 + z, 1e-10), "Hogg eq 9 " + z);
  assert(near(R.observedNm(656.280, z), 656.280 * (1 + z), 1e-9), "Hα shift " + z);
});

assert(isNaN(R.relativisticBeta(-1)), "z=-1 is undefined");
assert(R.speedGap(0) === 0, "no gap at rest");

/* At z = 0.1 the non-relativistic product is already ~5.2% high. */
var gap01 = R.speedGap(0.1);
assert(near(gap01, 0.05238095238095141, 1e-12), "z=0.1 gap " + gap01);
assert(gap01 > 0.05 && gap01 < 0.06, "z=0.1 gap is about 5%");

/* NIST rest wavelengths, nm. */
var expectLines = {
  lya: [121.567, "vacuum"],
  cak: [393.36614, "air"],
  cah: [396.84673, "air"],
  hb: [486.132, "air"],
  ha: [656.280, "air"]
};
var list = R.lines();
assert(list.length === 5, "five lines");
list.forEach(function (line) {
  assert(expectLines[line.id][0] === line.restNm, "rest " + line.id);
  assert(expectLines[line.id][1] === line.medium, "medium " + line.id);
});

/* Bands: Lyα is ultraviolet at rest, visible near z=3, infrared by z=5. */
assert(R.bandOf(R.observedNm(121.567, 0)) === "ultraviolet", "Lyα rest UV");
assert(R.bandOf(R.observedNm(121.567, 3)) === "visible", "Lyα z=3 visible");
assert(near(R.observedNm(121.567, 3), 486.268, 1e-9), "Lyα z=3 nm");
assert(R.bandOf(R.observedNm(121.567, 5)) === "infrared", "Lyα z=5 IR");
assert(R.bandOf(656.280) === "visible", "Hα rest visible");
assert(R.bandOf(R.observedNm(656.280, 0.07)) === "infrared", "Hα leaves visible");
assert(R.bandOf(400) === "visible" && R.bandOf(700) === "visible", "window edges");
assert(R.bandOf(399.999) === "ultraviolet" && R.bandOf(700.001) === "infrared", "just outside");

/* Cited presets. */
var ids = { rest: 0, m31: -0.001, n4258: 0.00158, "3c273": 0.15756751, gnz11: 10.6034 };
var presetList = R.presets();
assert(presetList.length === 5, "five presets");
presetList.forEach(function (p) {
  assert(ids[p.id] === p.z, "preset z " + p.id + " " + p.z);
  assert(R.zOk(p.z), "preset in slider range " + p.id);
});

/* Andromeda: SIMBAD cz = −299.85 ± 4. Desk c·z uses exact c. */
var m31 = R.czKmS(-0.001);
assert(near(m31, -299.792458, 1e-6), "M31 cz " + m31);
assert(Math.abs(m31 - (-299.85)) < 0.1, "M31 cz inside the published ±4 and near −299.85");

/* NGC 4258: BASS table z = 0.00158. */
assert(near(R.czKmS(0.00158), 473.67208364, 1e-6), "NGC 4258 cz");

/* 3C 273: SIMBAD radial velocity 43555 km/s and cz 47237.5511 km/s. */
var qso = R.presetById("3c273");
var qRel = R.relativisticKmS(qso.z);
var qCz = R.czKmS(qso.z);
assert(Math.abs(qRel - 43555) < 1, "3C 273 relativistic " + qRel);
assert(Math.abs(qCz - 47237.5511) < 0.001, "3C 273 cz " + qCz);
assert(qCz > qRel, "3C 273 cz exceeds the relativistic speed");

/* GN-z11: z = 10.6034, c·z is many times c, scale factor is 1/11.6034. */
var hi = R.presetById("gnz11");
assert(R.czKmS(hi.z) > 10 * R.C_KM_S, "GN-z11 cz exceeds 10 c");
assert(near(R.scaleThenOverNow(hi.z), 1 / 11.6034, 1e-12), "GN-z11 scale");
assert(R.relativisticBeta(hi.z) < 1 && R.relativisticBeta(hi.z) > 0.98, "GN-z11 beta still below 1");
var hiLines = R.lineState(hi.z);
hiLines.forEach(function (line) {
  assert(line.band !== "visible", "GN-z11 " + line.id + " is not in the visible window");
});

/* Hubble toy. v = H0 · d. At 10 Mpc the two central values are 674 and 730.4. */
assert(R.hubbleVelocity(R.H0_PLANCK, 10) === 674, "Planck 10 Mpc");
assert(near(R.hubbleVelocity(R.H0_SHOES, 10), 730.4, 1e-12), "SH0ES 10 Mpc");
assert(near(R.hubbleZ(R.H0_PLANCK, 10), 674 / R.C_KM_S, 1e-15), "Planck z");
assert(R.hubbleZ(R.H0_PLANCK, 100) < 0.03, "100 Mpc is still a small z");
assert(R.dOk(0) && R.dOk(100) && !R.dOk(100.1) && !R.dOk(-1), "distance bounds");
assert(R.zOk(0) && R.zOk(-0.01) && R.zOk(11) && !R.zOk(-0.011) && !R.zOk(11.001), "z bounds");

/* Slider reaches both ends and the cited presets. */
assert(near(R.zFromUnit(0), R.Z_MIN, 1e-12), "slider start");
assert(near(R.zFromUnit(1), R.Z_MAX, 1e-9), "slider end");
presetList.forEach(function (p) {
  var u = R.unitFromZ(p.z);
  assert(u >= 0 && u <= 1, "preset unit " + p.id);
  assert(near(R.zFromUnit(u), p.z, 1e-10), "slider roundtrip " + p.id);
});

assert(R.formatNm(393.36614) === "393.36614 nm", "format Ca K");
assert(R.formatNm(656.280) === "656.280 nm", "format Hα");
assert(R.formatNm(121.567) === "121.567 nm", "format Lyα");
assert(R.formatSpeed(674) === "674 km/s", "format 674");
assert(R.formatSpeed(730.4) === "730.4 km/s", "format 730.4");
assert(R.formatSpeed(43555.48595565044) === "43,555.49 km/s", "format 3C 273 v");
assert(R.formatSpeed(-299.792458) === "-299.79 km/s", "format Andromeda cz");

assert(R.formatZ(1) === "1", "format z=1");
assert(R.formatZ(0.15756751) === "0.15756751", "format 3C 273");
assert(R.formatZ(10.6034) === "10.6034", "format GN-z11");
assert(R.formatZ(-0.001) === "-0.001", "format Andromeda");
assert(R.formatBeta(0.6) === "0.6", "format beta");
assert(R.formatGap(2 / 3).indexOf("66.7") === 0, "format gap " + R.formatGap(2 / 3));

console.log("ok");
