/* Sundial checks.
   Run: node science/astronomy/sundial/sundial.test.js
   Solar position is the NOAA / Meeus series shared with the twilight desk.
   Campbell solstice shadows are compared with 90° − |φ − δ| and h / tan(alt).
   The equation of time is swept at solar noon for 2020 through 2030. */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./sundial.js");
var T = require("../twilight/twilight.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(near(S.julianDay(2000, 1, 1), 2451544.5, 1e-6), "JD 2000-01-01 midnight is 2451544.5");
assert(near(S.julianCent(2451545.0), 0, 1e-15), "J2000 noon is T = 0");
assert(near(S.declination(0), T.declination(0), 1e-12), "declination matches the twilight desk at J2000");
assert(near(S.equationOfTime(0), T.equationOfTime(0), 1e-12), "equation of time matches the twilight desk at J2000");

var campbell = S.presetById("campbell");
assert(campbell.lat === 37.287 && campbell.lon === -121.95, "Campbell preset");
assert(S.presetById("equator").lat === 0 && S.presetById("equator").lon === 0, "equator");
assert(near(S.presetById("cancer").lat, 23.44, 1e-9), "Tropic of Cancer is 23.44° N");
assert(near(S.presetById("arctic").lat, 66.56, 1e-9), "Arctic Circle is 66.56° N");
assert(S.presetById("sydney").lat === -33.87 && S.presetById("sydney").lon === 151.21, "Sydney preset");

/* Sabanski's worked hour: latitude 52°, 1 p.m., 11.9°. */
var onePm = S.hourLineAngle(52, 1);
assert(near(onePm, 11.92, 0.02), "52° N 1 p.m. hour line is 11.92°, got " + onePm);
assert(near(S.hourLineAngle(52, -1), -onePm, 1e-9), "morning and afternoon hour lines mirror");
assert(near(S.hourLineAngle(0, 3), 0, 1e-9), "equator hour lines collapse onto the noon line");
assert(near(S.hourLineAngle(90, 2), 30, 1e-9), "at the pole the hours are 15° apart");

function solarNoon(year, month, day, lat, lon, offset, height) {
  return S.noonOn(year, month, day, lat, lon, offset, height);
}

/* Classroom estimate the page quotes: 90 − 37.29 + 23.44, and 90 − 37.29 − 23.44.
   Campbell's preset is 37.287°. Both are checked. */
function classroomAlt(lat, dec) {
  return 90 - Math.abs(lat - dec);
}
function classroomShadow(lat, dec, height) {
  var alt = classroomAlt(lat, dec);
  return height / Math.tan(alt * Math.PI / 180);
}

var simpleJuneAlt = classroomAlt(37.29, 23.44);
var simpleJuneShadow = classroomShadow(37.29, 23.44, 1.8);
var simpleDecAlt = classroomAlt(37.29, -23.44);
var simpleDecShadow = classroomShadow(37.29, -23.44, 1.8);
assert(near(simpleJuneAlt, 76.15, 0.05), "simple June altitude near 76.2, got " + simpleJuneAlt);
assert(near(simpleJuneShadow, 0.44, 0.02), "simple June shadow near 0.44 m, got " + simpleJuneShadow);
assert(near(simpleDecAlt, 29.27, 0.05), "simple December altitude near 29.3, got " + simpleDecAlt);
assert(near(simpleDecShadow, 3.21, 0.05), "simple December shadow near 3.2 m, got " + simpleDecShadow);

function bestSolstice(year, month, lat, lon, offset, height, sign) {
  var best = null;
  var day;
  var dim = S.daysInMonth(year, month);
  for (day = 1; day <= dim; day++) {
    var row = solarNoon(year, month, day, lat, lon, offset, height);
    if (!best || sign * row.declination > sign * best.declination) best = row;
  }
  return best;
}

var june = bestSolstice(2026, 6, campbell.lat, campbell.lon, -7, 1.8, 1);
var dec = bestSolstice(2026, 12, campbell.lat, campbell.lon, -8, 1.8, -1);
console.log("June solstice day", june.month + "-" + june.day, "dec", june.declination.toFixed(3), "alt", june.altitude.toFixed(3), "shadow", june.shadow.toFixed(3), "noon", S.formatClock(june.solarNoonLocal), "eot", june.equationOfTime.toFixed(2));
console.log("December solstice day", dec.month + "-" + dec.day, "dec", dec.declination.toFixed(3), "alt", dec.altitude.toFixed(3), "shadow", dec.shadow.toFixed(3), "noon", S.formatClock(dec.solarNoonLocal), "eot", dec.equationOfTime.toFixed(2));

assert(june.declination > 23.3 && june.declination < 23.5, "June declination near 23.44, got " + june.declination);
assert(near(june.altitude, classroomAlt(campbell.lat, june.declination), 0.02), "June noon altitude matches 90 − |φ − δ|");
assert(near(june.altitude, 76.2, 0.4), "June noon altitude near 76.2°, got " + june.altitude);
assert(june.shadow != null && near(june.shadow, 0.44, 0.03), "June 1.8 m shadow near 0.44 m, got " + june.shadow);
assert(near(june.azimuth, 180, 0.5) || near(june.azimuth, 0, 0.5), "June noon azimuth is on the meridian, got " + june.azimuth);

assert(dec.declination < -23.3 && dec.declination > -23.5, "December declination near −23.44, got " + dec.declination);
assert(near(dec.altitude, classroomAlt(campbell.lat, dec.declination), 0.02), "December noon altitude matches 90 − |φ − δ|");
assert(near(dec.altitude, 29.3, 0.4), "December noon altitude near 29.3°, got " + dec.altitude);
assert(dec.shadow != null && near(dec.shadow, 3.2, 0.15), "December 1.8 m shadow near 3.2 m, got " + dec.shadow);

/* Northern noon: the Sun is south, the shadow points north. */
assert(june.altitude > 0 && june.altitude < 90, "June noon Sun is up and not overhead at Campbell");
var juneShadow = S.verticalShadow(1.8, june.altitude, june.azimuth);
assert(juneShadow.north > 0 && Math.abs(juneShadow.east) < 0.02, "June noon shadow points north, east " + juneShadow.east + " north " + juneShadow.north);
assert(S.compassPoint(juneShadow.azimuth) === "N", "June noon shadow compass is N, got " + S.compassPoint(juneShadow.azimuth));

/* Three hours before solar noon the Sun is to the east and the shadow to the west. */
var morning = S.positionAt({
  year: 2026, month: 6, day: june.day,
  hour: 8, minute: 0, second: 0,
  lat: campbell.lat, lon: campbell.lon, utcOffsetHours: -7
});
assert(morning.altitude > 0, "Campbell June 08:00 PDT the Sun is up, alt " + morning.altitude);
assert(morning.azimuth > 60 && morning.azimuth < 150, "morning Sun is east of south, az " + morning.azimuth);
var morningShadow = S.verticalShadow(1.8, morning.altitude, morning.azimuth);
assert(morningShadow.east < 0, "morning shadow falls west");

var sydneyNoon = solarNoon(2026, 6, 21, -33.87, 151.21, 10, 1.8);
assert(sydneyNoon.altitude > 20 && sydneyNoon.altitude < 40, "Sydney June noon Sun is low, alt " + sydneyNoon.altitude);
var sydneyShadow = S.verticalShadow(1.8, sydneyNoon.altitude, sydneyNoon.azimuth);
assert(sydneyShadow.north < 0, "Sydney June noon shadow points south, north " + sydneyShadow.north);

/* Tropic of Cancer near the June solstice: the noon shadow can vanish. */
var cancer = bestSolstice(2026, 6, 23.44, 0, 0, 1.8, 1);
console.log("Cancer June", cancer.day, "dec", cancer.declination.toFixed(3), "alt", cancer.altitude.toFixed(3), "shadow", cancer.shadow);
assert(cancer.altitude > 89, "Tropic of Cancer June noon is overhead, alt " + cancer.altitude);
assert(cancer.shadow != null && cancer.shadow < 0.05, "Tropic of Cancer June noon shadow nearly vanishes, got " + cancer.shadow);

/* Arctic Circle near the December solstice: noon Sun on the horizon. */
var arctic = bestSolstice(2026, 12, 66.56, 0, 0, 1.8, -1);
console.log("Arctic December", arctic.day, "dec", arctic.declination.toFixed(3), "alt", arctic.altitude.toFixed(3), "shadow", arctic.shadow);
assert(Math.abs(arctic.altitude) < 0.5, "Arctic Circle December noon is on the horizon, alt " + arctic.altitude);
assert(arctic.shadow == null, "no useful noon shadow when the Sun is within " + S.HORIZON_ALT + "° of the horizon, alt " + arctic.altitude);

var night = S.positionAt({
  year: 2026, month: 6, day: 21,
  hour: 1, minute: 0, second: 0,
  lat: campbell.lat, lon: campbell.lon, utcOffsetHours: -7
});
assert(night.altitude < 0, "Campbell June 01:00 the Sun is down, alt " + night.altitude);
assert(S.shadowLength(1.8, night.altitude) == null, "no shadow below the horizon");
assert(S.nodusShadow(37.287, night.altitude, night.azimuth, 1) == null, "no nodus shadow below the horizon");

var nodus = S.nodusShadow(37.287, june.altitude, june.azimuth, 1);
assert(nodus && nodus.north > 0 && Math.abs(nodus.east) < 0.02, "June nodus shadow is north of center");

/* Equation of time stays inside about ±16.5 minutes. */
var extremes = S.equationOfTimeExtremes(2020, 2030);
console.log("EoT 2020–2030 min", extremes.min.toFixed(2), "max", extremes.max.toFixed(2));
assert(extremes.min > -16.5 && extremes.max < 16.5, "equation of time stays within ±16.5 min, got " + extremes.min + " to " + extremes.max);
assert(extremes.min < -14 && extremes.max > 16, "the sweep still reaches both sides of the analemma");

/* Clock: Campbell is west of the −120° meridian, so mean noon is after 12:00. */
var june21 = solarNoon(2026, 6, 21, campbell.lat, campbell.lon, -7, 1.8);
assert(june21.solarNoonLocal > 13 * 60 && june21.solarNoonLocal < 13 * 60 + 20, "June solar noon PDT is a little after 13:00, got " + S.formatClock(june21.solarNoonLocal));

/* Match twilight's geometric altitude at a shared instant. */
var jd = S.julianDay(2026, 6, 21) + (20 / 24);
var twAlt = T.geometricAltitude(jd, 37.287, -121.95);
var pos = S.positionAt({
  year: 2026, month: 6, day: 21, hour: 13, minute: 0, second: 0,
  lat: 37.287, lon: -121.95, utcOffsetHours: -7
});
assert(near(pos.altitude, twAlt, 0.02), "altitude matches twilight at 13:00 PDT, " + pos.altitude + " vs " + twAlt);

assert(S.dstInEffect("us", 2026, 11, 25) === false, "US DST is off on 2026-11-25");
assert(S.dstInEffect("us", 2026, 7, 1) === true, "US DST is on in July");
assert(S.dstInEffect("au", 2026, 11, 25) === true, "Sydney DST is on on 2026-11-25");
assert(S.dstInEffect("au", 2026, 7, 1) === false, "Sydney DST is off in July");
assert(S.effectiveOffset(-8, true) === -7, "DST adds an hour");

assert(S.parseNumber("−12.5", -180, 180) === -12.5, "unicode minus parses");
assert(S.parseNumber("91", -90, 90) == null, "latitude past 90 is rejected");

var view = S.scene({
  lat: 37.287, lon: -121.95, heightM: 1.8, utcOffsetHours: -7,
  year: 2026, month: 6, day: june.day, hour: 13, minute: 10
});
assert(view.ok && view.altitude > 70, "scene accepts the June noon inputs");
assert(S.scene({ lat: 91, lon: 0, heightM: 1.8, utcOffsetHours: 0, year: 2026, month: 6, day: 21, hour: 12, minute: 0 }).ok === false, "bad latitude");

console.log("simple June", simpleJuneAlt.toFixed(2), simpleJuneShadow.toFixed(3));
console.log("simple December", simpleDecAlt.toFixed(2), simpleDecShadow.toFixed(3));
console.log("sundial.test.js math: ok");

var htmlPath = path.join(__dirname, "index.html");
if (!fs.existsSync(htmlPath)) {
  console.log("index.html not written yet; math checks only");
  process.exit(0);
}

var html = fs.readFileSync(htmlPath, "utf8");
function has(s) {
  assert(html.indexOf(s) !== -1, "page missing: " + s);
}
[
  "subnav-desk",
  "subnav-phone",
  "aria-current=\"page\"",
  "https://gml.noaa.gov/grad/solcalc/calcdetails.html",
  "https://mysundial.ca/tsp/horizontal_sundial.html",
  "https://sundials.org/",
  "Sundials: Their Theory and Construction",
  "https://imagine.gsfc.nasa.gov/features/cosmic/earth_info.html",
  "/science/astronomy/refraction/",
  "/science/astronomy/analemma/",
  "/science/astronomy/seasons/",
  "/science/astronomy/local-sky/",
  "37.287",
  "−121.950",
  "1.8",
  "not for navigation",
  "equation of time"
].forEach(has);
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/sundial/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>Sundial</h3>") !== -1, "hub card");

var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/sundial/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Sundial</h2>") !== -1, "science card");
var exploreAt = science.indexOf("<h4>Explore</h4>");
assert(exploreAt !== -1 && science.indexOf("/science/astronomy/sundial/", exploreAt) !== -1, "explore prose lists the desk");

["analemma", "seasons", "local-sky"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/sundial/") !== -1, name + " links here");
});

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/sundial/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/sundial/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/sundial/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/sundial/") found = true;
  });
});
assert(found, "whats-new lists the desk");

console.log("sundial.test.js: ok");
