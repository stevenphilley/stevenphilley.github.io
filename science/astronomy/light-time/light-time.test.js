/* Light-time checks against the JPL Table 1 elements, exact c, and the IAU au.
   Run: node science/astronomy/light-time/light-time.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var L = require("./light-time.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

var file = path.join(__dirname, "../solar-system-3d.js");
var code = fs.readFileSync(file, "utf8");
var context = { console: console, Math: Math };
vm.createContext(context);
vm.runInContext(code, context);
var api = context.SolarSystem3D;
assert(api && typeof api.helio === "function", "solar map helio");

assert(L.C_M_S === 299792458, "exact c");
assert(L.AU_M === 149597870700, "exact IAU au");

var au = L.auLight();
assert(near(au.seconds, 149597870700 / 299792458, 0), "1 AU seconds is au/c");
assert(near(au.seconds, 499.004783836, 1e-6), "1 AU is 499.005 s " + au.seconds);
assert(L.formatDelay(au.seconds) === "8 min 19.0 s", "format 1 AU " + L.formatDelay(au.seconds));
assert(L.formatMinutes(au.seconds) === "8.317 min", "8.317 min " + L.formatMinutes(au.seconds));
assert(near(au.minutes, 8.3, 0.02), "about 8.3 light-minutes");
assert(L.formatDelay(au.roundTrip) === "16 min 38.0 s", "1 AU round trip " + L.formatDelay(au.roundTrip));

var moonMean = L.delayFromKm(L.MOON_A_KM);
assert(Math.round(moonMean.km) === 384400, "mean km");
assert(L.formatDelay(moonMean.oneWay) === "1.282 s", "moon one way " + L.formatDelay(moonMean.oneWay));
assert(L.formatDelay(moonMean.roundTrip) === "2.564 s", "moon round trip " + L.formatDelay(moonMean.roundTrip));
assert(near(moonMean.roundTrip, 2.5, 0.1), "about 2.5 s round trip");
var peri = L.delayFromKm(L.MOON_PERIGEE_KM);
var apo = L.delayFromKm(L.MOON_APOGEE_KM);
assert(peri.oneWay < moonMean.oneWay && moonMean.oneWay < apo.oneWay, "perigee under mean under apogee");
assert(L.formatKm(384400) === "384,400 km", "group km");
assert(L.formatKm(149597870.7) === "149,597,871 km", "1 AU in km " + L.formatKm(149597870.7));

var J2000 = 2451545.0;
var ids = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "moon", "sun"];
/* The solar map flips to Table 2 when 2000 + (jd−J2000)/365.25 exceeds 2050,
   which happens before the calendar end of 2050. Compare on dates both codes
   still treat as Table 1. */
[J2000, L.julianNoonUTC(2026, 10, 28), L.julianNoonUTC(1800, 6, 1), L.julianNoonUTC(2049, 6, 1)].forEach(function (jd) {
  ids.forEach(function (id) {
    var mine = L.helio(id, jd);
    var theirs = api.helio(id, jd);
    assert(mine && theirs, id + " both defined at " + jd);
    assert(near(mine.x, theirs.x, 1e-9), id + " x " + mine.x + " vs " + theirs.x);
    assert(near(mine.y, theirs.y, 1e-9), id + " y");
    assert(near(mine.z, theirs.z, 1e-9), id + " z");
  });
});

assert(L.helio("earth", L.julianNoonUTC(1799, 12, 31)) == null, "before the table");
assert(L.helio("mars", L.julianNoonUTC(2051, 1, 1)) == null, "after the table");
assert(L.pair("earth", "earth", J2000) == null, "same body");
assert(L.pair("earth", "mars", L.julianNoonUTC(1700, 1, 1)) == null, "pair outside");

var earth = L.helio("earth", J2000);
assert(earth.r > 0.98 && earth.r < 0.99, "earth near perihelion at J2000 " + earth.r);
var sunEarth = L.pair("earth", "sun", J2000);
assert(near(sunEarth.au, earth.r, 1e-12), "sun-earth distance is heliocentric r");
assert(sunEarth.oneWay > 8.15 * 60 && sunEarth.oneWay < 8.5 * 60, "earth-sun minutes at J2000 " + sunEarth.oneWay / 60);

/* Perihelion to aphelion of the J2000 Earth elements stays near 8.3 min. */
var e0 = L.elements("earth", J2000);
var q = e0.a * (1 - e0.e);
var Q = e0.a * (1 + e0.e);
assert(q * au.minutes > 8.1 && Q * au.minutes < 8.5, "earth-sun envelope " + (q * au.minutes) + " to " + (Q * au.minutes));

var moonSep = L.pair("earth", "moon", L.julianNoonUTC(2026, 10, 28));
assert(Math.abs(moonSep.km - 384400) < 0.01, "earth-moon mean km " + moonSep.km);
assert(L.formatDelay(moonSep.roundTrip) === "2.564 s", "live moon round trip");

var sheet = L.span("earth", "moon", J2000);
assert(sheet && sheet.kind === "moon-sheet", "moon range is the fact sheet");
assert(sheet.min.km === 363300 && sheet.max.km === 405500, "perigee and apogee");
assert(sheet.yearMin.km === 357000 && sheet.yearMax.km === 407000, "annual range on the sheet");

var syn = L.synodicDays("earth", "mars");
assert(syn > 750 && syn < 820, "earth-mars synodic days " + syn);
var marsSpan = L.span("earth", "mars", L.julianNoonUTC(2026, 10, 28));
assert(marsSpan && marsSpan.kind === "sample", "mars span samples");
assert(marsSpan.min.oneWay <= marsSpan.max.oneWay, "min under max");
assert(marsSpan.min.km > 0.3 * L.AU_KM && marsSpan.max.km < 2.8 * L.AU_KM, "mars span distances " + marsSpan.min.au + " " + marsSpan.max.au);

var env = L.envelope("earth", "mars", 2);
assert(env, "envelope");
var minMin = env.min.oneWay / 60;
var maxMin = env.max.oneWay / 60;
assert(minMin > 2.8 && minMin < 4.5, "earth-mars closest light-minutes " + minMin);
assert(maxMin > 20 && maxMin < 23.5, "earth-mars farthest light-minutes " + maxMin);
console.log("earth-mars envelope min/max light-minutes", minMin.toFixed(3), maxMin.toFixed(3));
console.log("synodic days", syn.toFixed(2));
console.log("2026-10-28 earth-mars", L.formatDelay(L.pair("earth", "mars", L.julianNoonUTC(2026, 10, 28)).oneWay), L.formatAu(L.pair("earth", "mars", L.julianNoonUTC(2026, 10, 28)).au));
console.log("2026-10-28 earth-sun", L.formatMinutes(L.pair("earth", "sun", L.julianNoonUTC(2026, 10, 28)).oneWay));

var today = L.julianNoonUTC(2026, 10, 28);
["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"].forEach(function (id) {
  var hit = L.pair("earth", id, today);
  assert(hit && hit.oneWay > 0 && hit.roundTrip === hit.oneWay * 2, id + " delay");
  var s = L.span("earth", id, today);
  assert(s && s.min.km <= hit.km + 1 && hit.km <= s.max.km + 1, id + " inside its span");
});

assert(L.periodDays("earth") > 365 && L.periodDays("earth") < 366, "earth year " + L.periodDays("earth"));
assert(L.synodicDays("sun", "mars") === L.periodDays("mars"), "sun-mars window is the Martian year");
assert(L.meaning("earth", "sun", sunEarth).indexOf("8.317 min") !== -1, "sun meaning names 8.317");
assert(L.meaning("earth", "mars", L.pair("earth", "mars", today)).indexOf("joysticked") !== -1, "mars meaning");
assert(L.meaning("earth", "moon", moonSep).indexOf("2.5 seconds") !== -1, "moon meaning");
assert(L.rhoNote("earth", "mars").indexOf("25 × 1000 km") !== -1, "mars tolerance");
assert(L.rhoNote("earth", "mars").indexOf("6 × 1000 km") !== -1, "emb tolerance");
assert(L.rhoNote("earth", "pluto").indexOf("no published tolerance") !== -1, "pluto tolerance");
assert(L.orbitXY("earth", J2000, 32).length === 33, "orbit samples");
assert(L.BODIES.length === 11, "eleven bodies");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/light-time/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("light-time.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf("299,792,458") !== -1, "exact c on the page");
assert(html.indexOf("149,597,870,700") !== -1, "exact au on the page");
assert(html.indexOf("8.317") !== -1, "1 AU minutes");
assert(html.indexOf("499.005") !== -1 || html.indexOf("499.004") !== -1, "1 AU seconds");
assert(html.indexOf("384,400") !== -1, "moon mean");
assert(html.indexOf("363,300") !== -1 && html.indexOf("405,500") !== -1, "perigee and apogee");
assert(html.indexOf("2.5") !== -1, "moon round-trip round number");
assert(html.indexOf("joysticked") !== -1, "mars rover sentence");
assert(html.indexOf("roughly 3 to 22") !== -1, "mars envelope in prose");
assert(html.indexOf("Educational") !== -1, "educational label");
assert(html.indexOf("Not a JPL Horizons ephemeris") !== -1, "disclaimer");
assert(html.indexOf("https://ssd.jpl.nasa.gov/planets/approx_pos.html") !== -1, "JPL source");
assert(html.indexOf("https://www.bipm.org/en/si-base-units/metre") !== -1, "BIPM metre");
assert(html.indexOf("IAU 2012") !== -1, "IAU resolution");
assert(html.indexOf("https://ssd.jpl.nasa.gov/horizons/") !== -1, "Horizons link");
assert(html.indexOf("voyager") !== -1, "names Voyager");
assert(html.indexOf("https://voyager.jpl.nasa.gov/mission/status/") !== -1, "Voyager status link");
assert(html.indexOf("/science/astronomy/satellites/") !== -1, "satellites link");
assert(html.indexOf("Standish") !== -1, "names Standish");
assert(html.indexOf("1800") !== -1 && html.indexOf("2050") !== -1, "validity window");
assert(html.indexOf("600 × 1000 km") !== -1, "Jupiter tolerance printed");
assert(html.indexOf("25 × 1000 km") !== -1, "Mars tolerance printed");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/light-time/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/light-time/") !== -1, "science index links the desk");
var satellites = fs.readFileSync(path.join(__dirname, "../satellites/index.html"), "utf8");
assert(satellites.indexOf("/science/astronomy/light-time/") !== -1, "satellites cross-link");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/light-time/") !== -1, "sitemap");
var sitehtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(sitehtml.indexOf("science/astronomy/light-time/") !== -1, "sitemap html");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/light-time/") !== -1, "search index");

console.log("light-time.test.js: ok");
console.log("1 AU", L.formatDelay(au.seconds), L.formatMinutes(au.seconds));
console.log("Moon round trip", L.formatDelay(moonMean.roundTrip));
