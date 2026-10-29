/* Time-dilation checks. Rates come from the formulas, not from stored results.
   Run: node science/astronomy/time-dilation/time-dilation.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var T = require("./time-dilation.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(T.C_M_S === 299792458, "exact c");
assert(T.GM_M3_S2 === 3.986004418e14, "IERS / Ashby GM");
assert(T.EARTH_RADIUS_M === 6378137, "equatorial radius");
assert(T.SIDEREAL_HOURS === 23.9345, "fact-sheet sidereal day");
assert(T.SOLAR_DAY_S === 86400, "SI day");
assert(T.GPS_RADIUS_M === 26559710, "IS-GPS-200N AREF");
assert(T.ISS_ALTITUDE_KM === 420, "ISS lithograph altitude");
assert(T.MOON_RADIUS_M === 0.3844e9, "Moon fact-sheet semimajor axis");
assert(T.IAU_LG === 6.969290134e-10, "IAU L_G");
assert(T.ASHBY_PRINTED_SUM === -4.4647e-10, "Ashby eq 35 sum");
assert(T.ASHBY_PRINTED_DOPPLER === 2.5046e-10, "Ashby eq 35 first term");
assert(T.ASHBY_A_M === 2.656175e7, "Ashby a0");
assert(T.NIST_SLOW_US === 7 && T.NIST_FAST_US === 45 && T.NIST_NET_US === 38, "NIST integers");

var c2 = T.C_M_S * T.C_M_S;

function hand(radiusM) {
  var v = Math.sqrt(T.GM_M3_S2 / radiusM);
  var lorentz = Math.sqrt(1 - (v * v) / c2) - 1;
  var grav = (T.GM_M3_S2 / c2) * (1 / T.EARTH_RADIUS_M - 1 / radiusM);
  var day = T.SOLAR_DAY_S * 1e6;
  return { v: v, lorentz: lorentz, grav: grav, velUs: lorentz * day, gravUs: grav * day, netUs: (grav + lorentz) * day };
}

var gps = T.presetModel("gps");
var gpsHand = hand(T.GPS_RADIUS_M);
assert(gps.circular === true, "GPS is circular");
assert(near(gps.radiusM, T.GPS_RADIUS_M, 1e-6), "GPS radius");
assert(near(gps.speedMps, gpsHand.v, 0), "GPS speed is √(GM/r)");
assert(near(gps.velocityUs, gpsHand.velUs, 1e-9), "GPS velocity from the Lorentz rate");
assert(near(gps.gravityUs, gpsHand.gravUs, 1e-9), "GPS gravity from the potential difference");
assert(near(gps.netUs, gps.velocityUs + gps.gravityUs, 1e-6), "GPS net is the sum");
assert(gps.velocityUs < -6 && gps.velocityUs > -8, "GPS velocity near −7, got " + gps.velocityUs);
assert(gps.gravityUs > 44 && gps.gravityUs < 47, "GPS gravity near +45, got " + gps.gravityUs);
assert(gps.netUs > 36 && gps.netUs < 40, "GPS net near +38, got " + gps.netUs);
assert(T.formatUs(gps.velocityUs) === "−7.21 μs/day", "format GPS velocity " + T.formatUs(gps.velocityUs));
assert(T.formatUs(gps.gravityUs) === "+45.65 μs/day", "format GPS gravity " + T.formatUs(gps.gravityUs));
assert(T.formatUs(gps.netUs) === "+38.44 μs/day", "format GPS net " + T.formatUs(gps.netUs));
assert(T.formatUs(gps.velocityUs) === T.formatUs(gps.dopplerUs), "orbital Lorentz and −v²/2c² print the same");
assert(T.formatGamma(gps.gamma).indexOf("1 + ") === 0, "GPS gamma is 1 plus a small term");

var iss = T.presetModel("iss");
var issHand = hand(T.EARTH_RADIUS_M + 420000);
assert(near(iss.velocityUs, issHand.velUs, 1e-9), "ISS velocity");
assert(near(iss.gravityUs, issHand.gravUs, 1e-9), "ISS gravity");
assert(iss.netUs < 0, "ISS net is slow");
assert(T.formatUs(iss.velocityUs) === "−28.18 μs/day", "format ISS velocity");
assert(T.formatUs(iss.gravityUs) === "+3.71 μs/day", "format ISS gravity");
assert(T.formatUs(iss.netUs) === "−24.47 μs/day", "format ISS net");
assert(T.formatPeriod(iss.periodS) === "92.97 min", "ISS period " + T.formatPeriod(iss.periodS));
assert(T.formatSpeed(iss.speedMps) === "7.657 km/s", "ISS speed");

var geo = T.presetModel("geo");
assert(near(geo.periodS, T.SIDEREAL_HOURS * 3600, 1e-4), "GEO period is the sidereal day");
assert(near(geo.radiusM, T.geoRadiusM(), 1e-6), "GEO radius from the period");
assert(T.formatKmFromM(geo.altitudeM) === "35,786.07 km", "GEO altitude " + T.formatKmFromM(geo.altitudeM));
assert(T.formatUs(geo.netUs) === "+46.45 μs/day", "GEO net");

var moon = T.presetModel("moon");
assert(near(moon.radiusM, T.MOON_RADIUS_M, 1e-3), "Moon radius");
assert(near(moon.speedMps, Math.sqrt(T.GM_M3_S2 / T.MOON_RADIUS_M), 0), "Moon speed is the test particle");
assert(T.formatSpeed(moon.speedMps) === "1.018 km/s", "Moon circle speed " + T.formatSpeed(moon.speedMps));
assert(T.formatPeriod(moon.periodS) === "27.452 d", "Moon circle period " + T.formatPeriod(moon.periodS));
assert(Math.abs(moon.periodS / 86400 - 27.3217) > 0.05, "Earth-only GM does not reproduce the sheet month");

/* Ashby’s printed 2.5046×10⁻¹⁰ is this page’s 3 GM / (2 a0 c²), to his digits. */
assert(T.formatSci(T.ashbyRecomputedTerm(), 5) === "2.5046×10⁻¹⁰", "recomputed Ashby term " + T.formatSci(T.ashbyRecomputedTerm(), 5));
assert(T.formatUs(T.ashbyQuotedFastUs()) === "+38.58 μs/day", "Ashby printed offset in a day " + T.formatUs(T.ashbyQuotedFastUs()));
var atAshby = hand(T.ASHBY_A_M);
assert(atAshby.velUs < -7 && atAshby.velUs > -7.3, "Ashby radius velocity still near −7");
assert(T.formatUs(atAshby.netUs) === "+38.44 μs/day", "same formulas at Ashby’s a0");
assert(T.ashbyQuotedFastUs() - atAshby.netUs > 0.1 && T.ashbyQuotedFastUs() - atAshby.netUs < 0.2, "geoid gap is a fraction of a microsecond");

var balance = T.balanceRadiusM();
assert(near(balance, 1.5 * T.EARTH_RADIUS_M, 0), "balance is 3R/2");
var vBal = Math.sqrt(T.GM_M3_S2 / balance);
var dopplerBal = -(vBal * vBal) / (2 * c2);
var gravBal = (T.GM_M3_S2 / c2) * (1 / T.EARTH_RADIUS_M - 1 / balance);
assert(Math.abs(gravBal + dopplerBal) < 1e-18, "monopole circular balance " + (gravBal + dopplerBal));
assert(T.formatKmFromM(balance) === "9,567.21 km", "balance radius");

var g99 = 1 / Math.sqrt(1 - 0.99 * 0.99);
var twin = T.twin(0.99);
assert(near(twin.gamma, g99, 0), "0.99c gamma");
assert(twin.homeYears === twin.gamma, "one year aboard is gamma years");
assert(T.formatGamma(twin.gamma) === "7.0888", "format 0.99c " + T.formatGamma(twin.gamma));
assert(T.formatYears(twin.homeYears) === "7.0888 years", "format years");
assert(T.twin(0).gamma === 1, "rest gamma");
assert(T.twin(-0.01) == null && T.twin(0.991) == null && T.twin("0.5") == null, "rejected beta");
assert(near(T.betaFromSlider(0), 0, 0) && near(T.betaFromSlider(990), 0.99, 0), "beta slider ends");
assert(near(T.betaFromSlider(T.sliderFromBeta(0.8)), 0.8, 1e-12), "beta slider round trip");

assert(T.model({ altitudeKm: -1, circular: true }) == null, "negative altitude");
assert(T.model({ altitudeKm: 410001, circular: true }) == null, "altitude ceiling");
assert(T.model({ altitudeKm: 400, circular: false, speedMps: T.C_M_S }) == null, "speed of light rejected");
assert(T.model({ altitudeKm: 400, circular: false, speedMps: -1 }) == null, "negative speed");
var hover = T.model({ altitudeKm: 20181.57, circular: false, speedMps: 0 });
assert(hover && hover.velocityUs === 0 && hover.gravityUs > 0, "a held clock is gravity only");
assert(near(T.altFromUnit(0), 0, 1e-9), "altitude slider floor");
assert(near(T.altFromUnit(1000), T.ALT_MAX_KM, 1e-6), "altitude slider ceiling");
assert(near(T.altFromUnit(T.unitFromAlt(20181.57)), 20181.57, 1e-6), "altitude slider round trip");

assert(T.rows().length === 4, "four presets");
assert(T.explainOrbit(gps).indexOf("−7.21 μs/day") !== -1, "GPS prose velocity");
assert(T.explainOrbit(gps).indexOf("+45.65 μs/day") !== -1, "GPS prose gravity");
assert(T.explainOrbit(gps).indexOf("+38.44 μs/day") !== -1, "GPS prose net");
assert(T.explainTwin(0.99).indexOf("7.0888 years") !== -1, "twin prose");
assert(T.explainTwin(0.99).indexOf("turnaround") !== -1, "turnaround named");
assert(T.explainAshby().indexOf("7 microseconds") !== -1, "NIST 7");
assert(T.explainAshby().indexOf("45 microseconds") !== -1, "NIST 45");
assert(T.explainAshby().indexOf("38 microseconds") !== -1, "NIST 38");
assert(T.explainAshby().indexOf("−4.4647×10⁻¹⁰") !== -1, "Ashby sum quoted");
assert(T.explainAshby().indexOf("+38.58 μs/day") !== -1, "Ashby day");
assert(T.explainAshby().indexOf("−7.21 μs/day") !== -1 && T.explainAshby().indexOf("+38.44 μs/day") !== -1, "page versus source");
assert(T.explainLimits().indexOf("1.022 km/s") !== -1, "sheet Moon speed is named and not used");
assert(T.explainLimits().indexOf("35,786.05 km") !== -1, "satellites-desk altitude named");
assert(T.explainLimits().indexOf("35,786.07 km") !== -1, "this page’s geostationary altitude");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/time-dilation/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("time-dilation.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("3.986004418") !== -1, "GM on the page");
assert(html.indexOf("299,792,458") !== -1 || html.indexOf("299792458") !== -1, "c on the page");
assert(html.indexOf("6,378,137") !== -1, "radius on the page");
assert(html.indexOf("−7.21") !== -1 && html.indexOf("+45.65") !== -1 && html.indexOf("+38.44") !== -1, "GPS rates on the page");
assert(html.indexOf("Not for navigation") !== -1, "disclaimer");
assert(html.indexOf("weak-field") !== -1 || html.indexOf("Weak-field") !== -1 || html.indexOf("weak field") !== -1, "weak-field label");
assert(html.indexOf("Ashby") !== -1, "names Ashby");
assert(html.indexOf("NIST") !== -1, "names NIST");
assert(html.indexOf("IERS") !== -1, "names IERS");
assert(html.indexOf(T.explainOrbit(gps)) !== -1, "GPS explanation is on the page");
assert(html.indexOf(T.explainTwin(0.8)) !== -1, "twin explanation is on the page");
assert(html.indexOf(T.explainAshby()) !== -1, "comparison is on the page");
assert(html.indexOf(T.explainLimits()) !== -1, "limits note is on the page");
assert(html.indexOf('data-orbit="iss"') !== -1 && html.indexOf('data-orbit="moon"') !== -1, "preset buttons");
assert(html.indexOf('id="beta-slider"') !== -1, "speed slider");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/time-dilation/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/time-dilation/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/time-dilation/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/time-dilation/") !== -1, "search index");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/time-dilation/") !== -1, "html sitemap");

console.log("time-dilation.test.js: ok");
console.log("GPS", T.formatUs(gps.velocityUs), T.formatUs(gps.gravityUs), T.formatUs(gps.netUs));
console.log("ISS", T.formatUs(iss.netUs), "GEO", T.formatKmFromM(geo.altitudeM), "Moon", T.formatSpeed(moon.speedMps));
