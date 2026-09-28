#!/usr/bin/env node
/**
 * Ephemeris checks against JPL Horizons, Lahiri checks against the
 * Swiss Ephemeris / Jagannatha Hora January 1 table, and Ashtakoota
 * worked examples.
 *
 * Run: node chakras/kundali/kundali.test.js
 *
 * Horizons values are apparent geocentric ecliptic longitude of date
 * (airless), DE441, center 500@399, quantity 31, at the stated UT.
 * Lahiri published values are true ayanamsa (nutation included) at
 * 00:00 UT on January 1, rounded to 1″ in the source table.
 */
"use strict";

var Ephem = require("./ephemeris.js");
var Koota = require("./koota.js");

var failures = [];
var checks = 0;

function assert(cond, message) {
  checks += 1;
  if (!cond) failures.push(message);
}

function angDiff(a, b) {
  var d = ((a - b + 540) % 360) - 180;
  return d;
}

function arcsec(deg) {
  return deg * 3600;
}

/* ---------- Moon vs JPL Horizons ---------- */
var moonCases = [
  ["1900-01-01T00:00:00Z", 272.4162663],
  ["1950-01-01T00:00:00Z", 61.4154091],
  ["1992-04-12T00:00:00Z", 133.1763292],
  ["2000-01-01T00:00:00Z", 217.2933209],
  ["2020-01-01T00:00:00Z", 346.1383767],
  ["2024-06-15T18:30:00Z", 191.9748806],
  ["2026-01-01T00:00:00Z", 66.7156363]
];

console.log("Moon, tropical geocentric longitude of date (apparent)");
console.log("  UT                      ours           Horizons      Δ arcsec");
moonCases.forEach(function (row) {
  var got = Ephem.tropicalMoon(new Date(row[0])).lon;
  var d = arcsec(angDiff(got, row[1]));
  console.log(
    "  " + row[0] + "  " + got.toFixed(6) + "  " + row[1].toFixed(6) + "  " + d.toFixed(2)
  );
  assert(Math.abs(d) < 7.2, "Moon " + row[0] + " differs by " + d.toFixed(2) + "″ (limit 7.2″)");
});

/* ---------- Mars and Venus vs Horizons ---------- */
var planetCases = [
  ["1900-01-01T00:00:00Z", "Mars", 283.8676754],
  ["1950-01-01T00:00:00Z", "Mars", 182.2111967],
  ["1992-04-12T00:00:00Z", "Mars", 341.5595187],
  ["2020-01-01T00:00:00Z", "Mars", 238.3846079],
  ["2024-06-15T18:30:00Z", "Mars", 34.8685957],
  ["2026-01-01T00:00:00Z", "Mars", 282.6881475],
  ["1900-01-01T00:00:00Z", "Venus", 306.3743725],
  ["1950-01-01T00:00:00Z", "Venus", 316.9794775],
  ["1992-04-12T00:00:00Z", "Venus", 5.7924309],
  ["2020-01-01T00:00:00Z", "Venus", 314.4094923],
  ["2024-06-15T18:30:00Z", "Venus", 88.1654760],
  ["2026-01-01T00:00:00Z", "Venus", 279.2064734]
];

console.log("\nMars and Venus, geocentric apparent ecliptic longitude of date");
console.log("  UT                      body   ours           Horizons      Δ arcsec");
planetCases.forEach(function (row) {
  var got = Ephem.tropicalBody(row[1], new Date(row[0])).lon;
  var d = arcsec(angDiff(got, row[2]));
  console.log(
    "  " + row[0] + "  " + row[1].padEnd(5) + "  " + got.toFixed(6) + "  " + row[2].toFixed(6) + "  " + d.toFixed(2)
  );
  assert(Math.abs(d) < 7.2, row[1] + " " + row[0] + " differs by " + d.toFixed(2) + "″");
});

/* ---------- Lahiri vs published Jan 1 true ayanamsa ---------- */
function dmsToDeg(d, m, s) {
  return d + m / 60 + s / 3600;
}
var lahiriCases = [
  ["1900-01-01T00:00:00Z", 22, 27, 55],
  ["1950-01-01T00:00:00Z", 23, 9, 28],
  ["2000-01-01T00:00:00Z", 23, 51, 12],
  ["2010-01-01T00:00:00Z", 24, 0, 5],
  ["2020-01-01T00:00:00Z", 24, 7, 55],
  ["2024-01-01T00:00:00Z", 24, 11, 27],
  ["2025-01-01T00:00:00Z", 24, 12, 23],
  ["2026-01-01T00:00:00Z", 24, 13, 19]
];

console.log("\nLahiri true ayanamsa at 00:00 UT vs Swiss Ephemeris / JHora table (rounded to 1″)");
console.log("  date          ours                 table          Δ arcsec");
lahiriCases.forEach(function (row) {
  var got = Ephem.lahiriAyanamsa(new Date(row[0])).trueDeg;
  var pub = dmsToDeg(row[1], row[2], row[3]);
  var d = arcsec(got - pub);
  console.log(
    "  " + row[0].slice(0, 10) + "   " + Ephem.formatDMS(got, 2).padEnd(20) + "  " +
    (row[1] + "° " + row[2] + "′ " + row[3] + "″").padEnd(14) + "  " + d.toFixed(2)
  );
  assert(Math.abs(d) < 1.5, "Lahiri " + row[0] + " differs by " + d.toFixed(2) + "″");
});

/* Sidereal moon is tropical minus the ayanamsa of that instant. */
var sample = new Date("2000-01-01T00:00:00Z");
var sky = Ephem.sky(sample);
assert(
  Math.abs(angDiff(sky.moon.sidereal, sky.moon.tropical - sky.ayanamsa.trueDeg)) < 1e-9,
  "sidereal moon is not tropical minus Lahiri"
);
console.log("\n2000-01-01 00:00 UT sidereal Moon (Lahiri): " + sky.moon.sidereal.toFixed(6) + "°");

/* ---------- Greenwich apparent sidereal time at 2000-01-01 12:00 UT ----------
 * The IAU Earth Rotation Angle at that instant is 0.7790572732640 revolutions
 * = 18.697374558 hours. GAST adds the equation of the equinoxes (about −13″
 * of time-equivalent angle on this date). Astronomy Engine uses the IAU 2006
 * ERA formula, so GAST sits a fraction of a second of time off that ERA value,
 * not a degree.
 */
var gast = Ephem.greenwichSiderealHours(new Date("2000-01-01T12:00:00Z"));
var eraHours = 0.7790572732640 * 24;
console.log("GAST at 2000-01-01 12:00 UT: " + gast.toFixed(6) + " h (IAU ERA " + eraHours.toFixed(6) + " h)");
assert(Math.abs(gast - eraHours) < 0.001, "GAST at 2000-01-01 12:00 UT is " + gast + " h, ERA " + eraHours);
assert(Math.abs(gast - eraHours) > 1e-6, "GAST should include a non-zero equation of the equinoxes");

/* ---------- Ascendant: cardinal RAMC at the equator ----------
 * Obliquity drops out of the atan2 only at these four hour angles.
 * Intermediate hour angles at latitude 0 are not RAMC+90°.
 */
[[0, 90], [90, 180], [180, 270], [270, 0]].forEach(function (pair) {
  var asc = Ephem.tropicalAscendant(pair[0], 0, 23.4392911);
  assert(Math.abs(angDiff(asc, pair[1])) < 1e-6, "equator ascendant ramc " + pair[0] + " got " + asc);
});
/* A northern latitude moves the ascendant off the equator value. */
var shifted = Ephem.tropicalAscendant(0, 28.6, 23.4392911);
assert(Math.abs(angDiff(shifted, 90)) > 1, "latitude should move the ascendant off 90° when RAMC is 0");

/* ---------- Civil time, including historical Asia/Kolkata ---------- */
function expectUtc(label, y, m, d, h, min, sec, zone, iso) {
  var got = Ephem.wallTimeToUtc(y, m, d, h, min, sec, zone);
  var ok = got.exists && got.date.toISOString() === iso;
  console.log((ok ? "  ok  " : "  FAIL ") + label + " → " + (got.date && got.date.toISOString()) + (got.ambiguous ? " (ambiguous, earlier kept)" : ""));
  assert(ok, label + " got " + (got.date && got.date.toISOString()) + " exists=" + got.exists);
}

console.log("\nLocal civil time → UTC");
expectUtc("Kolkata 2000-01-01 05:30 IST", 2000, 1, 1, 5, 30, 0, "Asia/Kolkata", "2000-01-01T00:00:00.000Z");
expectUtc("Kolkata 1943-06-01 06:30 wartime +6:30", 1943, 6, 1, 6, 30, 0, "Asia/Kolkata", "1943-06-01T00:00:00.000Z");
expectUtc("Kolkata 1942-08-31 12:30 still +5:30", 1942, 8, 31, 12, 30, 0, "Asia/Kolkata", "1942-08-31T07:00:00.000Z");
expectUtc("Kolkata 1899-06-01 11:21:10 historical", 1899, 6, 1, 11, 21, 10, "Asia/Kolkata", "1899-06-01T06:00:00.000Z");
expectUtc("New York 2024-01-15 12:00 EST", 2024, 1, 15, 12, 0, 0, "America/New_York", "2024-01-15T17:00:00.000Z");
expectUtc("New York 2024-07-15 12:00 EDT", 2024, 7, 15, 12, 0, 0, "America/New_York", "2024-07-15T16:00:00.000Z");

var gap = Ephem.wallTimeToUtc(2024, 3, 10, 2, 30, 0, "America/New_York");
assert(gap.exists === false, "DST spring-forward gap should not exist");
console.log("  ok   New York 2024-03-10 02:30 flagged as a gap (exists=" + gap.exists + ")");

var overlap = Ephem.wallTimeToUtc(2024, 11, 3, 1, 30, 0, "America/New_York");
assert(overlap.exists === true && overlap.ambiguous === true, "DST fall-back should be ambiguous");
assert(overlap.date.toISOString() === "2024-11-03T05:30:00.000Z", "overlap should keep the earlier UTC, got " + overlap.date.toISOString());
console.log("  ok   New York 2024-11-03 01:30 ambiguous, earlier UTC " + overlap.date.toISOString());

assert(Ephem.parseOffset("+05:30") === 5.5, "parse +05:30");
assert(Ephem.parseOffset("-4") === -4, "parse -4");
assert(Math.abs(Ephem.parseOffset("+5:21:10") - (5 + 21 / 60 + 10 / 3600)) < 1e-9, "parse seconds");
var manual = Ephem.utcFromOffset(2000, 1, 1, 5, 30, 0, 5.5);
assert(manual.toISOString() === "2000-01-01T00:00:00.000Z", "manual offset 5.5");

/* ---------- Koota placement edges ---------- */
function place(lon) {
  return Koota.placement(lon);
}
assert(place(0).nak === 0 && place(0).pada === 1 && place(0).rashi === 0, "0° Ashwini pada 1 Aries");
var bharani = place(360 / 27);
assert(bharani.nak === 1 && bharani.pada === 1, "exactly 13°20′ should be Bharani pada 1, got nak " + bharani.nak + " pada " + bharani.pada);
var krittikaPada2 = place(30);
assert(krittikaPada2.nak === 2 && krittikaPada2.pada === 2 && krittikaPada2.rashi === 1, "30° Krittika pada 2 Taurus");
assert(place(359.999).nak === 26, "end of Revati");

/* Vashya halves. */
assert(Koota.chartFromLongitude(250).vashya === "Manava", "Sagittarius first half is Manava");
assert(Koota.chartFromLongitude(260).vashya === "Chatushpada", "Sagittarius second half is Chatushpada");
assert(Koota.chartFromLongitude(280).vashya === "Chatushpada", "Capricorn first half is Chatushpada");
assert(Koota.chartFromLongitude(290).vashya === "Jalachara", "Capricorn second half is Jalachara");

/* Boundary flag. */
var near = Koota.boundaryWarnings(30 - 0.1);
assert(near.length === 1 && near[0].kinds.indexOf("rashi") !== -1 && near[0].kinds.indexOf("pada") !== -1, "0.1° before 30° flags rashi and pada");
assert(near[0].other.rashi === 1, "alternative across 30° is Taurus");
assert(Koota.boundaryWarnings(15).length === 0, "15° Aries is not near a nakshatra, pada, or rashi boundary");
var sagSplit = Koota.boundaryWarnings(255);
assert(sagSplit.some(function (w) { return w.kinds.indexOf("vashya half-sign") !== -1; }), "15° Sagittarius flags the vashya split");

/* ---------- Worked Ashtakoota examples ---------- */
function showMatch(title, groom, bride, expect) {
  var result = Koota.match(groom, bride);
  console.log("\n" + title);
  console.log("  groom " + groom.nakshatra + " p" + groom.pada + " " + groom.rashiName +
    "  bride " + bride.nakshatra + " p" + bride.pada + " " + bride.rashiName);
  Koota.KOOTA_META.forEach(function (meta) {
    var got = result.parts[meta.id].points;
    var exp = expect[meta.id];
    var mark = got === exp ? "ok" : "FAIL";
    console.log("  " + mark + "  " + meta.name.padEnd(14) + String(got).padStart(4) + " / " + meta.max + "   expected " + exp);
    assert(got === exp, title + " " + meta.name + " got " + got + " expected " + exp);
  });
  console.log("  total " + result.total + " / 36  " + result.band.label + "   expected " + expect.total);
  assert(result.total === expect.total, title + " total");
  assert(result.band.id === expect.band, title + " band");
  return result;
}

var ex1g = Koota.chartFromNakPada(0, 1);
var ex1b = Koota.chartFromNakPada(0, 2);
var ex1 = showMatch("Example 1 — same nakshatra, different pada (Ashwini 1 and Ashwini 2)", ex1g, ex1b, {
  varna: 1, vashya: 2, tara: 0, yoni: 4, graha: 5, gana: 6, bhakoot: 7, nadi: 0, total: 25, band: "good"
});
assert(ex1.cancellations.some(function (c) {
  return c.koota === "Nadi" && c.rule.indexOf("different padas") !== -1;
}), "example 1 should note the same-nakshatra nadi exception");
assert(ex1.parts.nadi.points === 0, "example 1 nadi score stays 0");

var ex2 = showMatch("Example 2 — Rohini pada 2 groom, Jyeshtha pada 3 bride", Koota.chartFromNakPada(3, 2), Koota.chartFromNakPada(17, 3), {
  varna: 0, vashya: 1, tara: 1.5, yoni: 2, graha: 3, gana: 0, bhakoot: 7, nadi: 0, total: 14.5, band: "low"
});
assert(ex2.cancellations.length === 0, "example 2 has nadi dosha without the standard exceptions, got " + JSON.stringify(ex2.cancellations));

var ex3 = showMatch("Example 3 — Ashwini pada 1 groom, Anuradha pada 1 bride (6/8, same lord)", Koota.chartFromNakPada(0, 1), Koota.chartFromNakPada(16, 1), {
  varna: 0, vashya: 1, tara: 1.5, yoni: 3, graha: 5, gana: 6, bhakoot: 0, nadi: 8, total: 24.5, band: "average"
});
assert(ex3.cancellations.some(function (c) {
  return c.koota === "Bhakoot" && c.rule.indexOf("same planet") !== -1;
}), "example 3 should note same-lord bhakoot exception");
assert(ex3.parts.bhakoot.points === 0, "example 3 bhakoot score stays 0");

/* Asymmetry: swapping groom and bride changes Varna when ranks differ. */
var swapped = Koota.match(Koota.chartFromNakPada(17, 3), Koota.chartFromNakPada(3, 2));
assert(swapped.parts.varna.points === 1 && ex2.parts.varna.points === 0, "varna is directional");

/* Yoni enemies both ways are 0, and the diagonal is 4. */
var enemies = [[0, 8], [1, 13], [2, 11], [3, 12], [4, 10], [5, 6], [7, 9]];
enemies.forEach(function (pair) {
  assert(Koota.YONI_MATRIX[pair[0]][pair[1]] === 0, "enemy " + pair.join(","));
  assert(Koota.YONI_MATRIX[pair[1]][pair[0]] === 0, "enemy reverse " + pair.join(","));
});
for (var i = 0; i < 14; i++) assert(Koota.YONI_MATRIX[i][i] === 4, "same yoni " + i);

/* Krittika padas straddle Aries/Taurus: bhakoot 2/12 and nadi, both with exceptions, score unchanged. */
var k1 = Koota.chartFromNakPada(2, 1);
var k2 = Koota.chartFromNakPada(2, 2);
assert(k1.rashiName === "Aries" && k2.rashiName === "Taurus", "Krittika pada 1 Aries, pada 2 Taurus");
var kmatch = Koota.match(k1, k2);
assert(kmatch.parts.bhakoot.points === 0 && kmatch.parts.nadi.points === 0, "Krittika pair carries both doshas");
assert(kmatch.cancellations.filter(function (c) { return c.koota === "Nadi"; }).length >= 1, "nadi exception listed");
assert(kmatch.cancellations.filter(function (c) { return c.koota === "Bhakoot"; }).length >= 1, "bhakoot exception listed");

/* Yoni sex follows the usual male/female pairing. Punarvasu is the male cat, Ashlesha the female. */
assert(Koota.chartFromNakPada(6, 1).yoni === "Cat" && Koota.chartFromNakPada(6, 1).yoniGender === "male", "Punarvasu is male cat");
assert(Koota.chartFromNakPada(8, 1).yoni === "Cat" && Koota.chartFromNakPada(8, 1).yoniGender === "female", "Ashlesha is female cat");

/* A pada that crosses 15° Sagittarius or Capricorn names both vashya classes. */
var purva = Koota.chartFromNakPada(19, 1);
assert(purva.vashyaSplit && purva.vashyaSplit.below === "Manava" && purva.vashyaSplit.above === "Chatushpada", "Purva Ashadha pada 1 crosses the Sagittarius split");
assert(purva.vashya === "Chatushpada", "the pada midpoint is scored on the second half");
var shravana = Koota.chartFromNakPada(21, 2);
assert(shravana.vashyaSplit && shravana.vashyaSplit.below === "Chatushpada" && shravana.vashyaSplit.above === "Jalachara", "Shravana pada 2 crosses the Capricorn split");
assert(Koota.chartFromNakPada(19, 2).vashyaSplit == null, "Purva Ashadha pada 2 does not cross 15°");

/* Published tara walk-through: bride Ashwini, groom Rohini.
 * Inclusive counts are 4 (Kshema) and 25 (Vadha), so one direction only: 1.5.
 * Some web guides print the return count as 24; that is one short.
 */
var taraPair = Koota.match(Koota.chartFromNakPada(3, 1), Koota.chartFromNakPada(0, 1));
assert(taraPair.parts.tara.points === 1.5, "Ashwini bride / Rohini groom tara is 1.5, got " + taraPair.parts.tara.points);
assert(taraPair.parts.tara.fromBrideToGroom.count === 4 && taraPair.parts.tara.fromGroomToBride.count === 25, "Ashwini/Rohini counts 4 and 25");

/* Manglik houses. Mars in Aries, lagna in Aries → house 1. */
var hit = Koota.manglikReport({ lagnaRashi: 0, moonRashi: 3, venusRashi: 4, marsRashi: 0 });
assert(hit.fromLagna.house === 1 && hit.fromLagna.manglik, "Mars in lagna is manglik");
assert(hit.fromMoon.house === 10 && !hit.fromMoon.manglik, "Mars in 10th from Moon is not a manglik house");
assert(hit.manglik === true, "lagna hit makes the common flag true");
var clear = Koota.manglikReport({ lagnaRashi: 0, moonRashi: 0, venusRashi: 0, marsRashi: 2 });
assert(clear.fromLagna.house === 3 && clear.manglik === false, "3rd house is not manglik");

console.log("\n" + checks + " checks, " + failures.length + " failures");
if (failures.length) {
  failures.forEach(function (f) { console.error("  - " + f); });
  process.exit(1);
}
console.log("All checks passed.");
