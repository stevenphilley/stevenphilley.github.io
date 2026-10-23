/* Earth-satellite orbit checks.
   Constants are the NASA Earth Fact Sheet (GM, equatorial radius, sidereal day)
   and the defined speed of light. Preset sizes are the cited ones.
   Periods, speeds, the horizon, and the light time are computed.
   Run: node science/astronomy/satellites/satellites.test.js */
"use strict";

var S = require("./satellites.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(S.FACT.earthGm === 0.39860 * 1e6, "Earth GM");
assert(S.FACT.equatorialRadiusKm === 6378.137, "equatorial radius");
assert(S.FACT.siderealHours === 23.9345, "sidereal day");
assert(S.FACT.solarDayHours === 24, "mean solar day");
assert(S.FACT.cKmS === 299792.458, "defined c");
assert(S.ALT_MIN_KM === 160 && S.ALT_MAX_KM === 410000, "slider ends");

var geo = S.evaluate({ altitudeKm: S.geoAltitudeKm() });
assert(geo && geo.geostationary && geo.circular, "geostationary circle");
assert(near(geo.periodSeconds, S.siderealSeconds(), 1e-6), "GEO period is the sidereal day");
assert(S.fmtPeriod(geo.periodSeconds) === "23 h 56.07 min", "GEO period text " + S.fmtPeriod(geo.periodSeconds));
assert(S.fmtAlt(geo.altitudeKm) === "35,786.05 km", "GEO altitude " + S.fmtAlt(geo.altitudeKm));
assert(near(geo.altitudeKm, 35786, 1), "GEO altitude is about 35,786 km");
assert(geo.westwardShiftDeg === 0, "GEO ground track does not step, got " + geo.westwardShiftDeg);
assert(near(geo.orbitsPerSiderealDay, 1, 1e-12), "one orbit per sidereal day");
assert(near(geo.orbitsPerSolarDay, 24 / 23.9345, 1e-12), "solar-day count is 24/23.9345");
assert(S.fmtSpeed(geo.perigeeSpeedKmS) === "3.075 km/s", "GEO speed " + S.fmtSpeed(geo.perigeeSpeedKmS));

var solarAlt = S.solarDayAltitudeKm();
assert(solarAlt > geo.altitudeKm, "a 24-hour circle sits above the sidereal one");
assert(near(solarAlt - geo.altitudeKm, 76.89, 0.01), "about 77 km higher");

var iss = S.presetModel("iss");
assert(S.presetById("iss").altitudeKm === 420, "ISS button is the cited about-420 km");
assert(iss.circular, "ISS preset is a circle");
assert(iss.periodSeconds / 60 > 92 && iss.periodSeconds / 60 < 93, "ISS period is 92–93 min, got " + iss.periodSeconds / 60);
assert(S.fmtPeriod(iss.periodSeconds) === "92.97 min", "ISS period text " + S.fmtPeriod(iss.periodSeconds));
assert(S.fmtSpeed(iss.perigeeSpeedKmS) === "7.657 km/s", "ISS speed " + S.fmtSpeed(iss.perigeeSpeedKmS));
assert(near(iss.orbitsPerSolarDay, 15.489, 0.001), "ISS orbits per solar day");
assert(near(iss.westwardShiftDeg, 23.31, 0.01), "ISS westward shift");
assert(S.fmtPercent(iss.perigee.horizon.surfaceFraction) === "3.09%", "ISS visible surface");
assert(S.fmtDelay(iss.perigee.light.roundTripS) === "2.802 ms", "ISS round trip " + S.fmtDelay(iss.perigee.light.roundTripS));

var low = S.evaluate({ altitudeKm: 160 });
var high = S.evaluate({ altitudeKm: 2000 });
assert(low && high, "range ends evaluate");
assert(low.perigeeSpeedKmS > high.perigeeSpeedKmS, "lower orbit is faster");
assert(low.periodSeconds < high.periodSeconds, "lower orbit has the shorter period");
assert(low.perigee.horizon.surfaceFraction < high.perigee.horizon.surfaceFraction, "higher orbit sees more surface");
assert(low.perigee.horizon.surfaceFraction < 0.5 && high.perigee.horizon.surfaceFraction < 0.5, "outside a sphere you cannot see more than half");

var hubble = S.presetModel("hubble");
assert(S.presetById("hubble").altitudeKm === 483, "Hubble is NASA’s approximate 483 km");
assert(hubble.periodSeconds / 60 > 94 && hubble.periodSeconds / 60 < 95, "Hubble period near 95 min");

var starlink = S.presetModel("starlink");
assert(S.presetById("starlink").altitudeKm === 550, "Starlink shell is the authorized 550 km");
assert(starlink.periodSeconds > hubble.periodSeconds, "550 km is slower around than Hubble’s circle");

var gps = S.presetModel("gps");
assert(S.presetById("gps").radiusKm === 26559.710, "GPS AREF");
assert(near(gps.perigeeRadiusKm, 26559.710, 1e-9), "GPS radius");
assert(near(gps.perigeeAltitudeKm, 20181.573, 0.001), "GPS altitude above the equatorial radius");
assert(near(gps.orbitsPerSiderealDay, 2, 0.001), "GPS is about two orbits per sidereal day, got " + gps.orbitsPerSiderealDay);
assert(near(gps.westwardShiftDeg, 180, 0.05), "GPS equatorial crossing steps about 180°");
assert(gps.perigee.horizon.surfaceFraction > 0.3 && gps.perigee.horizon.surfaceFraction < 0.45, "GPS sees a large cap, not a hemisphere");

var moon = S.presetModel("moon");
var moonP = S.presetById("moon");
assert(moonP.perigeeRadiusKm === 0.3633e6 && moonP.apogeeRadiusKm === 0.4055e6, "Moon sheet apsides");
assert(moonP.sheetSemimajorKm === 0.3844e6 && moonP.sheetE === 0.0549, "Moon sheet a and e");
assert(moonP.sheetPeriodDays === 27.3217, "Moon sheet period is stored, not overwritten");
assert(!moon.circular, "Moon preset is an ellipse");
assert(near(moon.semimajorKm, 0.3844e6, 1e-6), "apsides average to the sheet semimajor axis");
assert(near(moon.eccentricity, 0.0549, 0.00002), "apsides recover the sheet eccentricity");
assert(moon.perigeeSpeedKmS > moon.apogeeSpeedKmS, "faster at perigee");
assert(near(moon.perigeeSpeedKmS, S.visViva(S.FACT.earthGm, moon.perigeeRadiusKm, moon.semimajorKm), 1e-9), "perigee is vis-viva");
assert(Math.abs(moon.periodSeconds / 86400 - moonP.sheetPeriodDays) > 0.05, "Earth-only GM does not reproduce the sheet month");
assert(S.fmtSpeed(moon.perigeeSpeedKmS) === "1.076 km/s", "Moon perigee " + S.fmtSpeed(moon.perigeeSpeedKmS));
assert(S.fmtSpeed(moon.apogeeSpeedKmS) === "0.964 km/s", "Moon apogee " + S.fmtSpeed(moon.apogeeSpeedKmS));
assert(Math.abs(moon.perigeeSpeedKmS - moonP.sheetVp) > 0.004, "sheet max speed is not this GM");

var circleEdge = S.evaluate({ perigeeAltitudeKm: 550, apogeeAltitudeKm: 550 });
assert(circleEdge.circular, "equal apsides are a circle");
assert(near(circleEdge.perigeeSpeedKmS, S.circularSpeed(S.FACT.earthGm, circleEdge.perigeeRadiusKm), 1e-12), "e = 0 is circular speed");
assert(near(circleEdge.perigeeSpeedKmS, starlink.perigeeSpeedKmS, 1e-9), "550/550 matches the Starlink circle");

var r = S.FACT.equatorialRadiusKm + 420;
var h = S.horizonAt(r);
assert(h && near(h.surfaceFraction, (1 - S.FACT.equatorialRadiusKm / r) / 2, 1e-15), "cap fraction");
assert(near(h.slantKm, Math.sqrt(r * r - S.FACT.equatorialRadiusKm * S.FACT.equatorialRadiusKm), 1e-6), "slant horizon");
assert(near(h.arcKm, S.FACT.equatorialRadiusKm * Math.acos(S.FACT.equatorialRadiusKm / r), 1e-6), "ground horizon");
assert(S.horizonAt(S.FACT.equatorialRadiusKm) === null, "no horizon on the surface");

var delay = S.lightTime(420);
assert(delay && near(delay.roundTripS, 2 * 420 / S.FACT.cKmS, 1e-15), "round trip is 2h/c");
assert(near(delay.oneWayS * 2, delay.roundTripS, 0), "one way is half");

assert(S.evaluate({ altitudeKm: 159 }) === null, "below the slider");
assert(S.evaluate({ altitudeKm: 410001 }) === null, "above the slider");
assert(S.evaluate({ perigeeAltitudeKm: 800, apogeeAltitudeKm: 400 }) === null, "perigee inside apogee");
assert(S.evaluate(null) === null, "empty");

assert(near(S.unitFromAlt(160), 0, 1e-12), "slider start");
assert(near(S.unitFromAlt(410000), 1, 1e-12), "slider end");
assert(S.unitFromAlt(420) < S.unitFromAlt(550), "slider climbs with altitude");
assert(near(S.altFromUnit(S.unitFromAlt(35786.05)), 35786.05, 1e-6), "log slider round trip");
assert(S.altFromUnit(0.5) < (160 + 410000) / 2, "midpoint is below the linear mid");

var geoCap = geo.perigee.horizon.surfaceFraction;
assert(geoCap > 0.4 && geoCap < 0.45, "GEO sees about 42% of the surface, got " + geoCap);
assert(S.fmtDelay(geo.perigee.light.roundTripS) === "238.7 ms", "GEO round trip " + S.fmtDelay(geo.perigee.light.roundTripS));

var bandLo = S.evaluate({ altitudeKm: 370 });
var bandHi = S.evaluate({ altitudeKm: 460 });
assert(bandLo.periodSeconds / 60 > 90 && bandHi.periodSeconds / 60 < 95, "cited ISS altitude band stays near 90–93 min");

console.log("satellites tests ok");
console.log("GEO", S.fmtAlt(geo.perigeeAltitudeKm), S.fmtPeriod(geo.periodSeconds), S.fmtSpeed(geo.perigeeSpeedKmS), S.fmtPercent(geoCap));
console.log("ISS", S.fmtPeriod(iss.periodSeconds), S.fmtSpeed(iss.perigeeSpeedKmS), S.fmtDeg(iss.westwardShiftDeg), S.fmtOrbits(iss.orbitsPerSolarDay));
console.log("GPS", S.fmtAlt(gps.perigeeAltitudeKm), S.fmtPeriod(gps.periodSeconds), S.fmtOrbits(gps.orbitsPerSiderealDay));
console.log("Moon", S.fmtPeriod(moon.periodSeconds), S.fmtSpeed(moon.perigeeSpeedKmS), S.fmtSpeed(moon.apogeeSpeedKmS));
