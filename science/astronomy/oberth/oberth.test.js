/* Oberth checks against NASA NSSDCA fact-sheet inputs.
   Run: node science/astronomy/oberth/oberth.test.js */
"use strict";

var O = require("./oberth.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

var EARTH = O.FACT.earthGm;
var SUN = O.FACT.sunGm;
var RE = O.FACT.earthRadiusKm;

assert(SUN === 132712 * 1e6, "Sun GM is 132,712 × 10^6 km^3/s^2");
assert(near(EARTH, 0.39860 * 1e6, 1e-9), "Earth GM is 0.39860 × 10^6 km^3/s^2");
assert(RE === 6371, "Earth volumetric mean radius is 6,371 km");
assert(O.FACT.earthSiderealHours === 23.9345, "Earth sidereal rotation is 23.9345 h");
assert(O.FACT.earthAKm === 149.598e6, "Earth semimajor axis");
assert(O.FACT.marsAKm === 227.956e6, "Mars semimajor axis");

var surfaceEsc = O.escapeSpeed(EARTH, RE);
assert(O.fmtSpeed(surfaceEsc) === "11.186 km/s", "surface escape " + O.fmtSpeed(surfaceEsc));
assert(O.roundTo(surfaceEsc, 3) === O.FACT.surfaceEscapeKmS, "surface escape matches the sheet's 11.186 km/s");
assert(near(surfaceEsc, O.circular(EARTH, RE) * Math.SQRT2, 1e-9), "surface escape is circular times √2");

var rLeo = RE + 400;
assert(rLeo === 6771, "400 km classroom radius is 6,371 + 400");
var leo0 = O.burn(EARTH, rLeo, 0);
assert(O.fmtSpeed(leo0.vc) === "7.673 km/s", "LEO circular " + O.fmtSpeed(leo0.vc));
assert(O.fmtSpeed(leo0.vesc) === "10.851 km/s", "LEO escape " + O.fmtSpeed(leo0.vesc));
assert(O.fmtSpeed(leo0.dvEsc) === "3.178 km/s", "LEO Δv to escape " + O.fmtSpeed(leo0.dvEsc));
assert(near(leo0.vc + leo0.dvEsc, leo0.vesc, 1e-9), "Δv_esc = v_esc − v_c");
assert(near(leo0.dvEsc, leo0.vc * (Math.SQRT2 - 1), 1e-12), "Δv_esc = v_c(√2 − 1)");
assert(near(leo0.epsBefore, -EARTH / (2 * rLeo), 1e-9), "circular energy is −μ/(2a)");
assert(leo0.bound && leo0.e === 0, "zero burn stays circular");
assert(near(leo0.a, rLeo, 1e-6) && near(leo0.ra, rLeo, 1e-6), "circular apsides are r");

var leoEsc = O.burn(EARTH, rLeo, leo0.dvEsc);
assert(leoEsc.parabolic || Math.abs(leoEsc.epsAfter) < 1e-6, "exact escape burn is parabolic, ε'=" + leoEsc.epsAfter);
assert(near(leoEsc.vInf, 0, 1e-6), "parabolic excess is 0");
assert(near(leoEsc.e, 1, 1e-8), "parabolic eccentricity is 1");
assert(near(leoEsc.deltaEps, leoEsc.epsAfter - leoEsc.epsBefore, 1e-8), "Δε matches the energy difference at escape");
assert(near(leoEsc.deltaEps, leoEsc.cross + leoEsc.quad, 1e-12), "Δε splits into v·Δv and ½(Δv)²");

var rGeo = O.geoRadiusKm(EARTH, O.FACT.earthSiderealHours);
assert(O.fmtDist(rGeo) === "42,164.190 km", "geosynchronous radius " + O.fmtDist(rGeo));
assert(O.fmtDist(rGeo - RE) === "35,793.190 km", "geosynchronous altitude " + O.fmtDist(rGeo - RE));
var T = O.FACT.earthSiderealHours * 3600;
var period = 2 * Math.PI * Math.sqrt(rGeo * rGeo * rGeo / EARTH);
assert(near(period, T, 1e-4), "geosynchronous period matches 23.9345 h");

var one = O.compare(EARTH, rLeo, rGeo, 1);
assert(one && one.lowGainsMore, "1 km/s gains more energy in the low orbit");
assert(O.fmtEnergy(one.low.deltaEps) === "8.173 km²/s²", "LEO Δε at 1 km/s " + O.fmtEnergy(one.low.deltaEps));
assert(O.fmtEnergy(one.high.deltaEps) === "3.575 km²/s²", "GEO Δε at 1 km/s " + O.fmtEnergy(one.high.deltaEps));
assert(O.fmtEnergy(one.low.cross) === "7.673 km²/s²", "LEO cross term " + O.fmtEnergy(one.low.cross));
assert(O.fmtEnergy(one.high.cross) === "3.075 km²/s²", "GEO cross term " + O.fmtEnergy(one.high.cross));
assert(O.fmtEnergy(one.low.quad) === "0.500 km²/s²", "quadratic term " + O.fmtEnergy(one.low.quad));
assert(near(one.low.quad, one.high.quad, 1e-12), "½(Δv)² does not depend on v");
assert(one.low.bound && one.high.bound, "1 km/s stays bound on both circles");
assert(near(one.low.rp, rLeo, 1e-6), "prograde burn periapsis is the burn radius");
assert(O.fmtDist(one.low.a) === "9,373.637 km", "LEO semimajor after 1 km/s " + O.fmtDist(one.low.a));
assert(O.fmtDist(one.low.ra) === "11,976.274 km", "LEO apoapsis after 1 km/s " + O.fmtDist(one.low.ra));
assert(near(one.low.a, -EARTH / (2 * one.low.epsAfter), 1e-4), "a = −μ/(2ε')");
assert(near(one.low.ra, one.low.a * (1 + one.low.e), 1e-3), "apoapsis is a(1+e)");
assert(one.low.ra < rGeo, "the 1 km/s LEO ellipse stays inside the geosynchronous circle");
assert(O.fmtSpeed(one.high.vc) === "3.075 km/s", "geosynchronous circular speed " + O.fmtSpeed(one.high.vc));
assert(O.fmtSpeed(one.high.dvEsc) === "1.274 km/s", "GEO Δv to escape " + O.fmtSpeed(one.high.dvEsc));
assert(O.fmtDist(one.high.a) === "172,988.125 km", "GEO semimajor text " + O.fmtDist(one.high.a));
assert(O.fmtDist(one.high.ra) === "303,812.060 km", "GEO apoapsis text " + O.fmtDist(one.high.ra));
assert(O.outcome(one.low) === "Bound · a = 9,373.637 km", "LEO outcome " + O.outcome(one.low));
assert(O.outcome(one.high) === "Bound · a = 172,988.125 km", "GEO outcome " + O.outcome(one.high));
assert(O.apsisText(one.low) === "r_a 11,976.274 km", "LEO apoapsis text " + O.apsisText(one.low));
assert(O.fmtEnergy(one.low.epsBefore) === "−29.434 km²/s²", "LEO energy before");
assert(O.fmtEnergy(one.high.epsAfter) === "−1.152 km²/s²", "GEO energy after");

var r10 = RE + 10000;
var ten = O.compare(EARTH, rLeo, r10, 1);
assert(ten.lowGainsMore, "400 km gains more energy than 10,000 km");
assert(O.fmtEnergy(ten.high.deltaEps) === "5.434 km²/s²", "10,000 km Δε " + O.fmtEnergy(ten.high.deltaEps));
assert(ten.high.bound && O.fmtDist(ten.high.ra) === "42,771.943 km", "10,000 km apoapsis " + O.fmtDist(ten.high.ra));
assert(O.fmtSpeed(ten.high.vc) === "4.934 km/s", "10,000 km circular " + O.fmtSpeed(ten.high.vc));
assert(O.fmtSpeed(ten.high.dvEsc) === "2.044 km/s", "10,000 km Δv to escape " + O.fmtSpeed(ten.high.dvEsc));

var just = O.compare(EARTH, rLeo, rGeo, leo0.dvEsc);
assert(just.low.parabolic, "low burn at its escape Δv is parabolic");
assert(!just.high.bound, "the same Δv already escapes the higher circle");
assert(O.fmtSpeed(just.high.vInf) === "4.493 km/s", "higher excess at the low escape Δv " + O.fmtSpeed(just.high.vInf));
assert(just.high.vInf > just.low.vInf, "a burn that only just escapes the low circle leaves more excess higher up");

var big = O.compare(EARTH, rLeo, rGeo, 6);
assert(!big.low.bound && !big.high.bound, "6 km/s escapes both");
assert(O.fmtSpeed(big.low.vInf) === "8.319 km/s", "LEO excess at 6 km/s " + O.fmtSpeed(big.low.vInf));
assert(O.fmtSpeed(big.high.vInf) === "7.965 km/s", "GEO excess at 6 km/s " + O.fmtSpeed(big.high.vInf));
assert(big.low.vInf > big.high.vInf, "6 km/s leaves more residual speed from the low circle");
assert(6 > big.excessThreshold, "6 km/s is past the average of the two circular speeds");
assert(O.fmtEnergy(big.low.deltaEps) === "64.036 km²/s²", "LEO Δε at 6 km/s " + O.fmtEnergy(big.low.deltaEps));
assert(O.fmtEnergy(big.high.deltaEps) === "36.448 km²/s²", "GEO Δε at 6 km/s " + O.fmtEnergy(big.high.deltaEps));

var au = O.circular(SUN, O.FACT.earthAKm);
assert(O.fmtSpeed(au) === "29.785 km/s", "circular speed at Earth's a " + O.fmtSpeed(au));
assert(O.fmtSpeed(O.dvToEscape(au)) === "12.337 km/s", "Δv to escape a 1 AU circle " + O.fmtSpeed(O.dvToEscape(au)));
var solar = O.compare(SUN, O.FACT.earthAKm, O.FACT.marsAKm, 1);
assert(solar.lowGainsMore, "1 km/s gains more energy at 1 AU than at Mars's a");
assert(O.fmtEnergy(solar.low.deltaEps) === "30.285 km²/s²", "1 AU Δε " + O.fmtEnergy(solar.low.deltaEps));
assert(O.fmtEnergy(solar.high.deltaEps) === "24.628 km²/s²", "Mars-a Δε " + O.fmtEnergy(solar.high.deltaEps));
assert(O.fmtSpeed(solar.high.vc) === "24.128 km/s", "circular speed at Mars's a " + O.fmtSpeed(solar.high.vc));
assert(solar.low.bound && solar.high.bound, "1 km/s stays bound on both solar circles");

var peri = O.conicPoint(rLeo, one.low.e, 0);
var apo = O.conicPoint(rLeo, one.low.e, Math.PI);
assert(peri && near(peri.x, rLeo, 1e-4) && near(peri.y, 0, 1e-6), "periapsis sits on +x");
assert(apo && near(apo.r, one.low.ra, 1e-3), "apoapsis radius matches r_a");
assert(O.thetaLimit(0.2) === Math.PI, "ellipse traces the full turn");
assert(O.thetaLimit(2) < Math.PI, "hyperbola stops before the asymptote");

console.log("oberth tests ok");
console.log("LEO", O.fmtSpeed(leo0.vc), "escape", O.fmtSpeed(leo0.vesc), "Δv", O.fmtSpeed(leo0.dvEsc));
console.log("1 km/s Δε", O.fmtEnergy(one.low.deltaEps), "vs", O.fmtEnergy(one.high.deltaEps));
console.log("6 km/s v∞", O.fmtSpeed(big.low.vInf), "vs", O.fmtSpeed(big.high.vInf));
console.log("GEO", O.fmtDist(rGeo), "alt", O.fmtDist(rGeo - RE));
