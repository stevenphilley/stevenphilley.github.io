/* Twilight checks against the NOAA solar calculator and published almanac times.
   Run: node science/astronomy/twilight/twilight.test.js
   Clock fixtures are U.S. Naval Observatory rise/set/civil twilight
   (https://aa.usno.navy.mil/api/rstt/oneday) for 21 June 2024 and 21 December 2024.
   Nautical and astronomical times for Campbell are timeanddate.com for the same date.
   NOAA states the sunrise result is within about a minute between ±72° latitude. */
"use strict";

var T = require("./twilight.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

function hm(h, m) {
  return h * 60 + m;
}

function clockDelta(reportMinutes, expectMinutes) {
  return Math.abs(reportMinutes - expectMinutes);
}

assert(near(T.julianDay(2000, 1, 1), 2451544.5, 1e-6), "JD 2000-01-01 midnight is 2451544.5");
assert(near(T.julianCent(2451545.0), 0, 1e-15), "J2000 noon is T = 0");

var t0 = 0;
var dec0 = T.declination(t0);
var eot0 = T.equationOfTime(t0);
assert(dec0 > -24 && dec0 < -22, "declination at J2000 is about −23°, got " + dec0);
assert(eot0 > -20 && eot0 < 20, "equation of time at J2000 is a few minutes, got " + eot0);

var haCos = Math.cos((90.833) * Math.PI / 180);
var haSin = Math.sin(T.ALT.sunrise * Math.PI / 180);
assert(near(haCos, haSin, 1e-12), "NOAA zenith 90.833° is geometric altitude −0.833°");

var campbell = T.presetById("campbell");
assert(campbell.lat === 37.287 && campbell.lon === -121.95, "Campbell preset");
assert(T.presetById("equator").lat === 0 && T.presetById("equator").lon === 0, "equator preset");
assert(T.presetById("south-pole").lat === -90, "south pole preset");

function checkEvent(report, id, expect, tol, label) {
  var got = report.events[id];
  assert(got != null && isFinite(got), label + " missing, got " + got);
  assert(clockDelta(got, expect) <= tol, label + " got " + T.formatClock(got) + " (" + got.toFixed(2) + " min), expected " + T.formatClock(expect));
}

/* USNO Campbell, 21 June 2024, Pacific Daylight Time (UTC−7).
   Begin civil 05:17, rise 05:48, upper transit 13:10, set 20:32, end civil 21:03. */
var jun = T.dayReport({
  year: 2024, month: 6, day: 21,
  lat: 37.287, lon: -121.95,
  utcOffsetHours: -7
});
checkEvent(jun, "civilDawn", hm(5, 17), 1.5, "Campbell Jun 21 civil dawn");
checkEvent(jun, "sunrise", hm(5, 48), 1.5, "Campbell Jun 21 sunrise");
checkEvent(jun, "sunset", hm(20, 32), 1.5, "Campbell Jun 21 sunset");
checkEvent(jun, "civilDusk", hm(21, 3), 1.5, "Campbell Jun 21 civil dusk");
assert(clockDelta(jun.solarNoonLocal, hm(13, 10)) <= 1.5, "Campbell Jun 21 solar noon " + T.formatClock(jun.solarNoonLocal));

/* timeanddate Campbell 21 June 2024, local DST:
   astronomical 03:54–22:25, nautical 04:37–21:41. */
checkEvent(jun, "astronomicalDawn", hm(3, 54), 2, "Campbell Jun 21 astronomical dawn");
checkEvent(jun, "astronomicalDusk", hm(22, 25), 2, "Campbell Jun 21 astronomical dusk");
checkEvent(jun, "nauticalDawn", hm(4, 37), 2, "Campbell Jun 21 nautical dawn");
checkEvent(jun, "nauticalDusk", hm(21, 41), 2, "Campbell Jun 21 nautical dusk");

assert(!jun.flags.polarDay && !jun.flags.polarNight && !jun.flags.twilightAllNight, "Campbell June is an ordinary day");
assert(jun.durations.night > 0, "Campbell June still has true night");
var bandSum = jun.durations.day + jun.durations.civil + jun.durations.nautical + jun.durations.astronomical + jun.durations.night;
assert(near(bandSum, 1440, 0.05), "June band durations sum to 24 h, got " + bandSum);

var dayLen = jun.events.sunset - jun.events.sunrise;
assert(near(dayLen, hm(14, 44), 2), "Campbell June day length about 14 h 44 min, got " + dayLen);
assert(near(jun.durations.day, dayLen, 2), "hour-angle day length matches the clock, " + jun.durations.day + " vs " + dayLen);
assert(jun.durations.golden > 60 && jun.durations.golden < 240, "golden-hour band is a couple of hours, got " + jun.durations.golden);
assert(jun.durations.blue > 20 && jun.durations.blue < 120, "blue-hour band is shorter, got " + jun.durations.blue);
assert(jun.declination > 23 && jun.declination < 23.5, "June solstice declination near 23.44°, got " + jun.declination);

/* USNO Campbell, 21 December 2024, Pacific Standard Time (UTC−8).
   Begin civil 06:49, rise 07:18, upper transit 12:06, set 16:54, end civil 17:23. */
var dec = T.dayReport({
  year: 2024, month: 12, day: 21,
  lat: 37.287, lon: -121.95,
  utcOffsetHours: -8
});
checkEvent(dec, "civilDawn", hm(6, 49), 1.5, "Campbell Dec 21 civil dawn");
checkEvent(dec, "sunrise", hm(7, 18), 1.5, "Campbell Dec 21 sunrise");
checkEvent(dec, "sunset", hm(16, 54), 1.5, "Campbell Dec 21 sunset");
checkEvent(dec, "civilDusk", hm(17, 23), 1.5, "Campbell Dec 21 civil dusk");
assert(clockDelta(dec.solarNoonLocal, hm(12, 6)) <= 1.5, "Campbell Dec 21 solar noon " + T.formatClock(dec.solarNoonLocal));
assert(dec.declination < -23 && dec.declination > -23.5, "December declination near −23.44°, got " + dec.declination);
assert(dec.events.sunset - dec.events.sunrise < jun.events.sunset - jun.events.sunrise, "December day is shorter than June at Campbell");

/* USNO London, 21 June 2024. The table was requested with daylight time included,
   so the printed clock is British Summer Time (UTC+1), even though the zone
   line on that page still said Universal Time: civil 03:55, rise 04:43,
   transit 13:02, set 21:22, end civil 22:09. In UT those are an hour earlier.
   04:43 BST is the solstice sunrise. */
var london = T.dayReport({
  year: 2024, month: 6, day: 21,
  lat: 51.507, lon: -0.128,
  utcOffsetHours: 1
});
checkEvent(london, "civilDawn", hm(3, 55), 1.5, "London Jun 21 civil dawn BST");
checkEvent(london, "sunrise", hm(4, 43), 1.5, "London Jun 21 sunrise BST");
checkEvent(london, "sunset", hm(21, 22), 1.5, "London Jun 21 sunset BST");
checkEvent(london, "civilDusk", hm(22, 9), 1.5, "London Jun 21 civil dusk BST");
assert(clockDelta(london.solarNoonLocal, hm(13, 2)) <= 1.5, "London Jun 21 solar noon " + T.formatClock(london.solarNoonLocal));
assert(london.events.astronomicalDawn == null && london.events.astronomicalDusk == null, "London June has no astronomical night");
assert(london.flags.twilightAllNight, "London June is twilight all night");
assert(london.flags.astronomicalAllNight, "London June darkest band is astronomical twilight");
assert(near(london.durations.night, 0, 0.05), "London June night duration is 0");
assert(london.altitudeMin < -12 && london.altitudeMin > -18, "London June solar midnight is between −18° and −12°, got " + london.altitudeMin);

/* USNO New York, 21 June 2024, Eastern Daylight Time (UTC−4).
   40.73 N, 73.92 W. Civil 04:51, rise 05:25, transit 12:58, set 20:31, civil end 21:04. */
var nyc = T.dayReport({
  year: 2024, month: 6, day: 21,
  lat: 40.73, lon: -73.92,
  utcOffsetHours: -4
});
checkEvent(nyc, "civilDawn", hm(4, 51), 1.5, "New York Jun 21 civil dawn");
checkEvent(nyc, "sunrise", hm(5, 25), 1.5, "New York Jun 21 sunrise");
checkEvent(nyc, "sunset", hm(20, 31), 1.5, "New York Jun 21 sunset");
checkEvent(nyc, "civilDusk", hm(21, 4), 1.5, "New York Jun 21 civil dusk");
assert(clockDelta(nyc.solarNoonLocal, hm(12, 58)) <= 1.5, "New York Jun 21 solar noon " + T.formatClock(nyc.solarNoonLocal));

/* Tromsø, 21 June 2024. USNO: continuously above the horizon. */
var tromso = T.dayReport({
  year: 2024, month: 6, day: 21,
  lat: 69.649, lon: 18.956,
  utcOffsetHours: 2
});
assert(tromso.flags.polarDay, "Tromsø June is polar day");
assert(tromso.events.sunrise == null && tromso.events.sunset == null, "Tromsø June has no sunrise or sunset");
assert(near(tromso.durations.day, 1440, 0.05), "Tromsø June day length is 24 h");
assert(tromso.altitudeMin > T.ALT.sunrise, "Tromsø June stays above −0.833°, min " + tromso.altitudeMin);

/* Reykjavík, 21 June 2024. The Sun sets, but it stays above −6°. Civil twilight all night. */
var rvk = T.dayReport({
  year: 2024, month: 6, day: 21,
  lat: 64.147, lon: -21.942,
  utcOffsetHours: 0
});
assert(rvk.flags.twilightAllNight && rvk.flags.civilAllNight, "Reykjavík June is civil twilight all night");
assert(rvk.events.sunrise != null && rvk.events.sunset != null, "Reykjavík June still has a sunrise and sunset");
assert(rvk.events.civilDawn == null && rvk.events.civilDusk == null, "Reykjavík June never reaches −6°");
assert(rvk.altitudeMin > -6 && rvk.altitudeMin < T.ALT.sunrise, "Reykjavík June solar midnight is a shallow twilight, got " + rvk.altitudeMin);

/* South Pole. June solstice is night; December solstice is day. Altitude tracks minus declination. */
var poleJun = T.dayReport({
  year: 2024, month: 6, day: 21,
  lat: -90, lon: 0,
  utcOffsetHours: 12
});
assert(poleJun.flags.polarNight, "South Pole in June is polar night");
assert(poleJun.altitudeMax < T.ALT.astronomical, "South Pole June is below −18° all day, max " + poleJun.altitudeMax);
assert(near(poleJun.durations.night, 1440, 0.05), "South Pole June is 24 h of night");
assert(poleJun.events.sunrise == null, "South Pole June has no sunrise");
assert(poleJun.solarNoonLocal >= 0 && poleJun.solarNoonLocal < 1440, "South Pole June solar noon is on this clock day, got " + poleJun.solarNoonLocal);
assert(T.formatClock(poleJun.solarNoonLocal).indexOf("day") < 0, "South Pole June solar noon is not labeled another day: " + T.formatClock(poleJun.solarNoonLocal));

var poleDec = T.dayReport({
  year: 2024, month: 12, day: 21,
  lat: -90, lon: 0,
  utcOffsetHours: 13
});
assert(poleDec.flags.polarDay, "South Pole in December is polar day");
assert(near(poleDec.durations.day, 1440, 0.05), "South Pole December is 24 h of day");
assert(poleDec.altitudeMin > 20, "South Pole December Sun stays high, min " + poleDec.altitudeMin);
assert(poleDec.solarNoonLocal >= 0 && poleDec.solarNoonLocal < 1440, "South Pole December solar noon is on this clock day, got " + poleDec.solarNoonLocal);

/* Tromsø, 21 December 2024, Central European Time (UTC+1). The Sun stays
   below the horizon. Noon altitude is still inside civil twilight. */
var tromsoDec = T.dayReport({
  year: 2024, month: 12, day: 21,
  lat: 69.649, lon: 18.956,
  utcOffsetHours: 1
});
assert(tromsoDec.flags.polarNight, "Tromsø December is polar night");
assert(tromsoDec.events.sunrise == null && tromsoDec.events.sunset == null, "Tromsø December has no sunrise");
assert(tromsoDec.altitudeMax < T.ALT.sunrise && tromsoDec.altitudeMax > T.ALT.civil, "Tromsø December noon is civil twilight, max " + tromsoDec.altitudeMax);
/* USNO 21 December 2024, tz +1: continuously below the horizon, civil twilight 09:32–13:53. */
checkEvent(tromsoDec, "civilDawn", hm(9, 32), 1.5, "Tromsø Dec 21 civil dawn");
checkEvent(tromsoDec, "civilDusk", hm(13, 53), 1.5, "Tromsø Dec 21 civil dusk");
assert(tromsoDec.durations.night > 0 && tromsoDec.durations.day === 0, "Tromsø December has night and no day");

/* Equator near equinox: day length close to 12 hours. 20 March 2024. */
var eq = T.bandDurations(2024, 3, 20, 0, 0);
assert(near(eq.day, 12 * 60, 8), "equator near equinox is about 12 h, got " + eq.day);
var eqSum = eq.day + eq.civil + eq.nautical + eq.astronomical + eq.night;
assert(near(eqSum, 1440, 0.05), "equator bands sum to 24 h");

/* Year series covers the chosen year and still sums each day. */
var series = T.yearSeries(2024, 37.287, -121.95);
assert(series.length === 366, "2024 is a leap year");
assert(series[0].month === 1 && series[0].date === 1, "series starts 1 January");
assert(series[365].month === 12 && series[365].date === 31, "series ends 31 December");
var juneDay = series.filter(function (row) { return row.month === 6 && row.date === 21; })[0];
assert(near(juneDay.day, jun.durations.day, 0.05), "year series June 21 matches the day report");
var maxDay = 0;
var minDay = 1440;
series.forEach(function (row) {
  var sum = row.day + row.civil + row.nautical + row.astronomical + row.night;
  assert(near(sum, 1440, 0.2), "year row " + row.month + "/" + row.date + " sums to 24 h, got " + sum);
  if (row.day > maxDay) maxDay = row.day;
  if (row.day < minDay) minDay = row.day;
});
assert(maxDay - minDay > 4 * 60, "Campbell day length swings by more than 4 hours across the year");

/* Zone helper: Campbell's civil offset flips with daylight time. */
if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
  var junOff = T.zoneOffsetHours("America/Los_Angeles", Date.UTC(2024, 5, 21, 19, 0, 0));
  var decOff = T.zoneOffsetHours("America/Los_Angeles", Date.UTC(2024, 11, 21, 20, 0, 0));
  assert(junOff === -7, "Los Angeles in June 2024 is UTC−7, got " + junOff);
  assert(decOff === -8, "Los Angeles in December 2024 is UTC−8, got " + decOff);
  assert(T.offsetLabel(-7) === "UTC−7", "offset label " + T.offsetLabel(-7));
  assert(T.zoneOffsetHours("Etc/UTC", Date.UTC(2024, 5, 21, 12, 0, 0)) === 0, "UTC offset is 0");
  var londonOff = T.zoneOffsetHours("Europe/London", Date.UTC(2024, 5, 21, 12, 0, 0));
  assert(londonOff === 1, "London in June 2024 is UTC+1, got " + londonOff);
  var rvkOff = T.zoneOffsetHours("Atlantic/Reykjavik", Date.UTC(2024, 5, 21, 12, 0, 0));
  assert(rvkOff === 0, "Reykjavík stays on UTC, got " + rvkOff);
}

assert(T.formatClock(hm(5, 48)) === "05:48", "clock format");
assert(T.formatDuration(hm(14, 44)) === "14 h 44 min", "duration format " + T.formatDuration(hm(14, 44)));
assert(T.formatClock(null) == null, "missing event has no clock");

console.log("ok");
console.log("Campbell 2024-06-21 PDT  sunrise " + T.formatClock(jun.events.sunrise) +
  "  sunset " + T.formatClock(jun.events.sunset) +
  "  solar noon " + T.formatClock(jun.solarNoonLocal) +
  "  day " + T.formatDuration(jun.durations.day));
console.log("Campbell 2024-06-21  civil " + T.formatClock(jun.events.civilDawn) + "–" + T.formatClock(jun.events.civilDusk) +
  "  nautical " + T.formatClock(jun.events.nauticalDawn) + "–" + T.formatClock(jun.events.nauticalDusk) +
  "  astronomical " + T.formatClock(jun.events.astronomicalDawn) + "–" + T.formatClock(jun.events.astronomicalDusk));
console.log("Campbell 2024-12-21 PST  sunrise " + T.formatClock(dec.events.sunrise) +
  "  sunset " + T.formatClock(dec.events.sunset) +
  "  solar noon " + T.formatClock(dec.solarNoonLocal));
console.log("London 2024-06-21 BST  sunrise " + T.formatClock(london.events.sunrise) +
  "  sunset " + T.formatClock(london.events.sunset) +
  "  min altitude " + london.altitudeMin.toFixed(2) + "°  twilight all night");
console.log("Tromsø 2024-06-21  polar day  min altitude " + tromso.altitudeMin.toFixed(2) + "°");
console.log("Reykjavík 2024-06-21  sunrise " + T.formatClock(rvk.events.sunrise) +
  "  sunset " + T.formatClock(rvk.events.sunset) +
  "  min altitude " + rvk.altitudeMin.toFixed(2) + "°  civil all night");
