/* Transit depth and radial-velocity checks.
   Run: node science/astronomy/transit/transit.test.js */
"use strict";

var T = require("./transit.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(T.GM_SUN === 132712e6 * 1e9, "Sun GM");
assert(near(T.GM_EARTH, 0.39860e6 * 1e9, 1), "Earth GM");
assert(near(T.GM_JUPITER, 126.687e6 * 1e9, 1), "Jupiter GM");
assert(T.R_SUN_M === 695700e3, "Sun radius");
assert(T.R_EARTH_M === 6371.0e3, "Earth radius");
assert(T.R_JUPITER_M === 69911e3, "Jupiter radius");
assert(T.AU_M === 149597870700, "IAU au");
assert(T.DAY_S === 86400, "day");

/* Depth is the area ratio. Independent of period and inclination. */
var earthDepth = Math.pow(6371.0 / 695700, 2);
var jupDepth = Math.pow(69911 / 695700, 2);
assert(near(T.depthFraction(T.R_EARTH_M, T.R_SUN_M), earthDepth, 1e-15), "earth depth");
assert(near(T.depthFraction(T.R_JUPITER_M, T.R_SUN_M), jupDepth, 1e-15), "jupiter depth");
assert(T.formatPpm(earthDepth) === "83.86", "earth ppm prints 83.86, got " + T.formatPpm(earthDepth));
assert(T.formatPercent(earthDepth) === "0.008386", "earth percent " + T.formatPercent(earthDepth));
assert(T.formatPpm(jupDepth) === "10,098", "jupiter ppm " + T.formatPpm(jupDepth));
assert(T.formatPercent(jupDepth) === "1.010", "jupiter percent " + T.formatPercent(jupDepth));

function run(preset) {
  return T.solve({
    rStar: preset.rStar,
    mStar: preset.mStar,
    rp: preset.rp,
    mp: preset.mp,
    unit: preset.unit,
    inclDeg: preset.inclDeg,
    periodDays: preset.periodDays,
    driver: "period"
  });
}

var earth = run(T.presetById("earth"));
var jupiter = run(T.presetById("jupiter"));
assert(earth.ok && jupiter.ok, "solar presets solve");
assert(earth.transits && jupiter.transits, "edge-on solar planets transit");
assert(T.formatImpact(earth.impact) === "0.00", "earth b is 0, got " + earth.impact);
assert(T.formatMetersPerSecond(earth.kMs) === "0.0895", "earth K m/s " + T.formatMetersPerSecond(earth.kMs));
assert(T.formatCmPerSecond(earth.kMs) === "8.95", "earth K cm/s " + T.formatCmPerSecond(earth.kMs));
assert(near(earth.kMs, 0.089, 0.001), "earth K near 9 cm/s, got " + earth.kMs);
assert(T.formatMetersPerSecond(jupiter.kMs) === "12.46", "jupiter K " + T.formatMetersPerSecond(jupiter.kMs));
assert(near(jupiter.kMs, 12.5, 0.1), "jupiter K near 12.5 m/s");
assert(T.formatHours(earth.durationHours) === "13.10 h", "earth duration " + T.formatHours(earth.durationHours));
assert(T.formatHours(jupiter.durationHours) === "32.56 h", "jupiter duration " + T.formatHours(jupiter.durationHours));
assert(T.formatPercent(earth.probStar) === "0.4650", "earth geometric % " + T.formatPercent(earth.probStar));
assert(T.formatOdds(earth.probStar) === "1 in 215", "earth odds " + T.formatOdds(earth.probStar));
assert(T.formatOdds(jupiter.probStar) === "1 in 1,119", "jupiter odds " + T.formatOdds(jupiter.probStar));
assert(T.formatAu(earth.axisAU) === "1.0000", "earth Kepler a " + T.formatAu(earth.axisAU));
assert(T.formatAu(jupiter.axisAU) === "5.2028", "jupiter Kepler a " + T.formatAu(jupiter.axisAU));
assert(near(earth.axisAU, 1, 0.002), "earth a near 1 AU");
assert(near(jupiter.axisAU, 5.204, 0.01), "jupiter a near the fact-sheet 5.204 AU");
assert(T.formatDays(earth.periodDays) === "365.256", "earth period");
assert(T.formatDays(jupiter.periodDays) === "4,332.589", "jupiter period " + T.formatDays(jupiter.periodDays));

/* Mid-transit of a central transit blocks exactly (Rp/R*)^2. */
assert(near(T.flux(earth.rStarM, earth.rPlanetM, earth.axisM, Math.PI / 2, 0), 1 - earthDepth, 1e-12), "earth mid-transit flux");
assert(near(T.flux(earth.rStarM, earth.rPlanetM, earth.axisM, Math.PI / 2, 0.25), 1, 1e-12), "quadrature is full light");
assert(near(T.radialVelocity(earth.kMs, 0), 0, 1e-12), "RV is zero at mid-transit");
assert(near(T.radialVelocity(earth.kMs, 0.25), earth.kMs, 1e-9), "RV peaks a quarter orbit later");

/* K scales with sin i. Face-on is silent and does not transit. */
var face = T.solve({
  rStar: 1, mStar: 1, rp: 1, mp: 1, unit: "earth",
  inclDeg: 0, periodDays: 365.256, driver: "period"
});
assert(face.kMs === 0, "face-on K is 0");
assert(face.transits === false, "face-on does not transit");
var tilted = T.solve({
  rStar: 1, mStar: 1, rp: 1, mp: 1, unit: "earth",
  inclDeg: 30, periodDays: 365.256, driver: "period"
});
assert(near(tilted.kMs, earth.kMs * Math.sin(30 * Math.PI / 180), 1e-9), "K sin i");
assert(near(tilted.mSinI, 0.5, 1e-12), "m sin i at 30°");

/* Period and distance are the same orbit. */
var fromAxis = T.solve({
  rStar: 1, mStar: 1, rp: 1, mp: 1, unit: "earth",
  inclDeg: 90, axisAU: earth.axisAU, driver: "axis"
});
assert(near(fromAxis.periodDays, 365.256, 1e-6), "axis driver returns the period");
assert(near(fromAxis.kMs, earth.kMs, 1e-9), "same K either way");

/* A smaller star at the same period is a deeper dip and a larger K. */
var smallStar = T.solve({
  rStar: 0.2, mStar: 0.2, rp: 1, mp: 1, unit: "earth",
  inclDeg: 90, periodDays: 365.256, driver: "period"
});
assert(smallStar.depth > earth.depth * 20, "smaller star, deeper dip");
assert(smallStar.kMs > earth.kMs, "lighter star, larger K");

/* HD 209458 b: Bonomo et al. 2017 measured K is 84.27 m/s. */
var hd = run(T.presetById("hd-209458-b"));
assert(hd.transits, "HD 209458 b transits");
assert(near(hd.kMs, 84.27, 0.5), "HD K near 84.27, got " + hd.kMs);
assert(near(hd.axisAU, 0.04707, 0.0005), "HD a near 0.04707, got " + hd.axisAU);
assert(hd.depth > 0.01 && hd.depth < 0.02, "HD depth is about a percent, got " + hd.depth);
assert(T.formatHours(hd.durationHours) === "3.08 h", "HD duration " + T.formatHours(hd.durationHours));
assert(T.formatImpact(hd.impact) === "0.50", "HD b " + T.formatImpact(hd.impact));

/* 51 Peg b does not transit. m sin i is the classic minimum mass. No radius is loaded. */
var pegP = T.presetById("51-peg-b");
assert(pegP.rp == null, "51 Peg has no measured radius");
var peg = run(pegP);
assert(peg.rpKnown === false, "radius stays unknown");
assert(peg.transits === false, "51 Peg misses at 49.8°");
assert(peg.depth == null && peg.durationHours == null, "no depth or duration without a radius");
assert(peg.probStar > 0.05, "geometric chance is still large for a close orbit");
assert(near(peg.kMs, 55.77, 0.5), "51 Peg K near 55.77, got " + peg.kMs);
assert(near(peg.mSinI, 0.466, 0.005), "51 Peg m sin i near 0.47 MJup, got " + peg.mSinI);
assert(T.flux(peg.rStarM, peg.rPlanetM, peg.axisM, peg.inclDeg * Math.PI / 180, 0) === 1, "flat light curve");

/* TRAPPIST-1 e: Agol et al. 2021. Much easier than Earth–Sun. */
var tr = run(T.presetById("trappist-1-e"));
assert(tr.transits, "TRAPPIST-1 e transits");
assert(near(tr.axisAU, 0.02925, 0.0002), "TRAPPIST a " + tr.axisAU);
assert(tr.depth > 50 * earth.depth, "TRAPPIST depth is much deeper than Earth–Sun, got " + (tr.depth / earth.depth));
assert(tr.probStar > 3 * earth.probStar, "closer-in around a small star is likelier to transit");
assert(tr.kMs > 1, "TRAPPIST K is meters per second, not centimeters, got " + tr.kMs);
assert(T.formatHours(tr.durationHours).indexOf("min") > 0, "TRAPPIST duration in minutes " + T.formatHours(tr.durationHours));

/* GJ 1214 b: Mahajan et al. 2024 K = 14.38 m/s, depth 0.013430. */
var gj = run(T.presetById("gj-1214-b"));
assert(gj.transits, "GJ 1214 b transits");
assert(near(gj.kMs, 14.38, 0.15), "GJ K near 14.38, got " + gj.kMs);
assert(near(gj.depth, 0.01343, 0.0002), "GJ depth near the paper's square, got " + gj.depth);
assert(near(gj.axisAU, 0.01505, 0.0002), "GJ a " + gj.axisAU);
assert(near(gj.impact, 0.264, 0.02), "GJ b near the paper's 0.264, got " + gj.impact);

assert(T.presets().length === 6, "six presets");
assert(T.presetById("kepler-22-b") == null, "Kepler-22 b is not invented here");

/* Log sliders round-trip. */
assert(near(T.logMap(0, T.P_MIN, T.P_MAX), T.P_MIN, 1e-12), "P slider start");
assert(near(T.logMap(1, T.P_MIN, T.P_MAX), T.P_MAX, 1e-6), "P slider end");
assert(near(T.logMap(T.logUnmap(365.256, T.P_MIN, T.P_MAX), T.P_MIN, T.P_MAX), 365.256, 1e-6), "P round trip");

console.log("ok", {
  earthPpm: T.formatPpm(earth.depth),
  earthCms: T.formatCmPerSecond(earth.kMs),
  earthProb: T.formatPercent(earth.probStar),
  earthHours: T.formatHours(earth.durationHours),
  jupiterPercent: T.formatPercent(jupiter.depth),
  jupiterMs: T.formatMetersPerSecond(jupiter.kMs),
  jupiterHours: T.formatHours(jupiter.durationHours)
});
