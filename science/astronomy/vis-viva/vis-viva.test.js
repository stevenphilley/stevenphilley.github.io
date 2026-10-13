/* Vis-viva checks against NASA NSSDCA fact-sheet inputs.
   Run: node science/astronomy/vis-viva/vis-viva.test.js */
"use strict";

var V = require("./vis-viva.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

var SUN = V.FACT.sunGm;
var EARTH = V.FACT.earthGm;

assert(SUN === 132712 * 1e6, "Sun GM is 132,712 × 10^6 km^3/s^2");
assert(near(EARTH, 0.39860 * 1e6, 1e-9), "Earth GM is 0.39860 × 10^6 km^3/s^2");
assert(V.FACT.earthRadiusKm === 6371, "Earth volumetric mean radius is 6,371 km");

var earth = V.presetById("earth-sun");
var moon = V.presetById("moon-earth");
var mars = V.presetById("mars-sun");
var leo = V.presetById("leo");
var schematic = V.presetById("schematic");

assert(earth.aKm === 149.598e6, "Earth a");
assert(earth.e === 0.0167, "Earth e");
assert(earth.sheetRpKm === 147.095e6, "Earth perihelion");
assert(earth.sheetRaKm === 152.100e6, "Earth aphelion");

var vPeriSheet = V.speed(SUN, earth.sheetRpKm, earth.aKm);
var vApoSheet = V.speed(SUN, earth.sheetRaKm, earth.aKm);
assert(V.fmtSpeed(vPeriSheet) === "30.287 km/s", "Earth printed perihelion " + V.fmtSpeed(vPeriSheet));
assert(V.fmtSpeed(vApoSheet) === "29.291 km/s", "Earth printed aphelion " + V.fmtSpeed(vApoSheet));
assert(V.roundTo(vPeriSheet, 2) === 30.29, "perihelion rounds to the sheet max 30.29");
assert(V.roundTo(vApoSheet, 2) === 29.29, "aphelion rounds to the sheet min 29.29");

var earthAp = V.apsides(earth.aKm, earth.e);
var vPeriE = V.speed(SUN, earthAp.rp, earth.aKm);
var vApoE = V.speed(SUN, earthAp.ra, earth.aKm);
assert(V.roundTo(vPeriE, 2) === 30.29, "r_p = a(1-e) also rounds to 30.29");
assert(V.roundTo(vApoE, 2) === 29.29, "r_a = a(1+e) also rounds to 29.29");
assert(V.fmtDist(earthAp.rp) === "147.100 × 10⁶ km", "formula periapsis " + V.fmtDist(earthAp.rp));

var atA = V.speed(SUN, earth.aKm, earth.aKm);
var circA = V.circular(SUN, earth.aKm);
assert(near(atA, circA, 1e-9), "r = a is the circular speed at a, even when e is not 0");
assert(V.fmtSpeed(atA) === "29.785 km/s", "Earth speed at a " + V.fmtSpeed(atA));

var pEarth = V.periodSeconds(SUN, earth.aKm) / 86400;
assert(near(pEarth, 365.256, 0.01), "Earth period is within 0.01 day of 365.256, got " + pEarth);

var marsPeri = V.speed(SUN, mars.sheetRpKm, mars.aKm);
var marsApo = V.speed(SUN, mars.sheetRaKm, mars.aKm);
assert(V.roundTo(marsPeri, 2) === 26.5, "Mars perihelion rounds to 26.50, got " + marsPeri);
assert(V.roundTo(marsApo, 2) === 21.97, "Mars aphelion rounds to 21.97, got " + marsApo);
assert(V.fmtSpeed(marsPeri) === "26.500 km/s", "Mars perihelion text " + V.fmtSpeed(marsPeri));
assert(V.fmtSpeed(marsApo) === "21.970 km/s", "Mars aphelion text " + V.fmtSpeed(marsApo));

var moonPeri = V.speed(EARTH, moon.sheetRpKm, moon.aKm);
var moonApo = V.speed(EARTH, moon.sheetRaKm, moon.aKm);
assert(V.fmtSpeed(moonPeri) === "1.076 km/s", "Moon perigee " + V.fmtSpeed(moonPeri));
assert(V.fmtSpeed(moonApo) === "0.964 km/s", "Moon apogee " + V.fmtSpeed(moonApo));
assert(Math.abs(V.roundTo(moonPeri, 3) - moon.sheetVp) > 0.004, "Moon sheet max is not this GM to 0.001 km/s");

var leoModel = V.evaluate({ mu: leo.mu, a: leo.aKm, e: 0, r: leo.aKm });
assert(leo.aKm === 6771, "400 km LEO radius is 6,371 + 400");
assert(leoModel.circularOrbit, "LEO is circular");
assert(near(leoModel.v, leoModel.vc, 1e-12), "e = 0 collapses vis-viva to circular speed");
assert(near(leoModel.v, leoModel.vp, 1e-12), "circular periapsis speed matches");
assert(V.fmtSpeed(leoModel.v) === "7.673 km/s", "LEO speed " + V.fmtSpeed(leoModel.v));
assert(V.fmtSpeed(leoModel.vesc) === "10.851 km/s", "LEO escape " + V.fmtSpeed(leoModel.vesc));
assert(V.fmtPeriod(leoModel.periodSeconds) === "92.41 min", "LEO period " + V.fmtPeriod(leoModel.periodSeconds));

var sch = V.evaluate({ mu: schematic.mu, a: schematic.aKm, e: schematic.e, r: schematic.aKm * (1 - schematic.e) });
assert(near(sch.rp, 10000, 1e-6), "schematic periapsis is 10,000 km");
assert(near(sch.ra, 30000, 1e-6), "schematic apoapsis is 30,000 km");
assert(sch.rp > V.FACT.earthRadiusKm, "schematic periapsis clears Earth's volumetric radius");
assert(V.fmtSpeed(sch.vp) === "7.732 km/s", "schematic periapsis " + V.fmtSpeed(sch.vp));
assert(V.fmtSpeed(sch.va) === "2.577 km/s", "schematic apoapsis " + V.fmtSpeed(sch.va));
var schAtA = V.evaluate({ mu: schematic.mu, a: schematic.aKm, e: schematic.e, r: schematic.aKm });
assert(schAtA.atA, "r = a is flagged");
assert(near(schAtA.v, schAtA.vAtA, 1e-9), "schematic r = a equals circular speed at a");

var placed = V.place(earth.aKm, earth.e, earthAp.rp);
assert(placed && near(placed.theta, 0, 1e-6), "periapsis true anomaly is 0");
assert(near(placed.ty, 1, 1e-6) && near(placed.tx, 0, 1e-6), "periapsis velocity points along +y");

var circle = V.place(leo.aKm, 0, leo.aKm);
assert(circle && near(circle.x, leo.aKm, 1e-6), "circular place sits at r");

var reached = V.eccentricityToReach(earth.aKm, earth.sheetRpKm, earth.sheetRaKm);
assert(reached > earth.e, "printed perihelion needs a slightly larger e than 0.0167");
assert(near(earth.aKm * (1 - reached), earth.sheetRpKm, 1), "drawing e reaches the printed perihelion");

var back = V.fromApsides(10000, 30000);
assert(back && near(back.a, 20000, 1e-6) && near(back.e, 0.5, 1e-12), "apsides recover a and e");

console.log("vis-viva tests ok");
console.log("Earth perihelion", V.fmtSpeed(vPeriSheet), "aphelion", V.fmtSpeed(vApoSheet));
console.log("Mars perihelion", V.fmtSpeed(marsPeri), "aphelion", V.fmtSpeed(marsApo));
console.log("Moon perigee", V.fmtSpeed(moonPeri), "apogee", V.fmtSpeed(moonApo));
console.log("LEO", V.fmtSpeed(leoModel.v), V.fmtPeriod(leoModel.periodSeconds));
