/* Parker spiral checks. Constant-speed equatorial winding.
   Run: node science/astronomy/parker-spiral/parker.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var P = require("./parker.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(P.AU_M === 149597870700, "IAU AU");
assert(P.SIDEREAL_HOURS === 609.12, "fact-sheet hours");
assert(P.SIDEREAL_DAYS === 25.38, "25.38 days");
assert(near(P.SIDEREAL_HOURS / 24, 25.38, 0), "hours divide to days");
assert(P.V_SLOW === 400 && P.V_FAST === 750, "classroom speeds");
assert(P.V_MIN === 250 && P.V_MAX === 900, "slider ends");
assert(P.R_MIN === 0.1 && P.R_MAX === 40 && P.R_EARTH === 1, "distance ends");
assert(P.SUN_RADIUS_KM === 695700, "solar radius");
assert(P.SOURCE_SURFACE_RADII === 2.5, "named source surface");
assert(P.NOAA_ROTATION_DAYS === 27, "NOAA sentence stays 27 days");
assert(P.CIR_AHEAD_DEG === 25, "classroom stream offset");
assert(P.PRESETS.length === 8, "eight presets");

var open = P.opening();
assert(near(open.psiDeg, 45, 3), "about 45 degrees, " + open.psiDeg);
assert(P.formatDeg(open.psiDeg) === "46.98°", "printed angle " + P.formatDeg(open.psiDeg));
assert(P.formatDeg(open.psiDeg) !== "45.00°", "45 is not substituted");
assert(P.formatDays(open.days) === "4.33", "printed days " + P.formatDays(open.days));
assert(P.formatHours(open.hours) === "103.89", "printed hours " + P.formatHours(open.hours));
assert(near(open.days, 4.3, 0.05), "about 4.3 days");
assert(P.formatDeg(open.westDeg) === "61.40°", "printed footpoint " + P.formatDeg(open.westDeg));
assert(P.formatTurns(open.turns) === "0.17", "printed turns");
assert(near(Math.tan(open.psiDeg * Math.PI / 180), open.ratio, 1e-12), "tan psi is Ω r / v");
assert(near(open.westDeg, open.ratio * 180 / Math.PI, 1e-9), "turn is the same product");
assert(near(open.seconds, open.rKm / 400, 1e-6), "time is distance over speed");
assert(near(open.days * P.DAY_S, open.seconds, 1e-6), "days follow seconds");

var syn = P.evaluate(400, 1, 27);
assert(P.formatDeg(syn.psiDeg) === "45.21°", "27 days is a different angle " + P.formatDeg(syn.psiDeg));
assert(P.formatDays(syn.days) === "4.33", "period does not change the transit");

var eq = P.equatorDays();
assert(P.formatDays(eq) === "25.05", "equator term prints 25.05 " + P.formatDays(eq));
assert(P.formatAu(P.sourceSurfaceAu()) === "0.0116", "source surface " + P.formatAu(P.sourceSurfaceAu()));
assert(P.sourceSurfaceAu() < P.R_MIN, "slider starts outside the source surface");

var foot = P.footRad(400, 1, P.SIDEREAL_DAYS);
assert(near(P.thetaAt(1, foot, 400, P.SIDEREAL_DAYS), 0, 1e-9), "highlighted line meets the observer");
assert(P.thetaAt(0.5, foot, 400, P.SIDEREAL_DAYS) > 0, "the spiral trails, footpoint counter-clockwise");

var fast = P.evaluate(750, 1, P.SIDEREAL_DAYS);
assert(fast.psiDeg < open.psiDeg, "faster wind is less wound");
assert(P.formatDeg(fast.psiDeg) === "29.75°", "fast angle " + P.formatDeg(fast.psiDeg));
assert(P.formatDays(fast.days) === "2.31", "fast transit " + P.formatDays(fast.days));

["mars-slow", "jupiter-slow", "neptune-slow"].forEach(function (id) {
  var preset = P.presetById(id);
  var ev = P.evaluate(preset.v, preset.au, P.SIDEREAL_DAYS);
  assert(ev.psiDeg > open.psiDeg, id + " is more wound than Earth");
  assert(P.matchedPreset(preset.v, preset.au).id === id, "preset match " + id);
});
assert(P.matchedPreset(400, 1).id === "earth-slow", "earth slow");
assert(P.matchedPreset(750, 1).id === "earth-fast", "earth fast");
assert(!P.matchedPreset(401, 1), "between speeds is not a preset");

var mars = P.planetById("mars");
var jup = P.planetById("jupiter");
var nep = P.planetById("neptune");
assert(mars.au === 1.52366231 && jup.au === 5.20336301 && nep.au === 30.06896348, "fact-sheet axes");
assert(P.planetById("earth").au === 1.00000011, "Earth orbit is the fact sheet, not the button");
assert(P.presetById("earth-slow").au === 1, "Earth button is 1 AU");

var samples = P.chartSamples(400, P.SIDEREAL_DAYS, 41);
assert(samples.length === 41, "chart samples");
assert(near(samples[0].r, 0.1, 1e-12) && near(samples[samples.length - 1].r, 40, 1e-9), "chart ends");
var i;
for (i = 1; i < samples.length; i++) {
  assert(samples[i].psi > samples[i - 1].psi, "angle grows with distance");
}
assert(near(P.cirCrossingAu(P.SIDEREAL_DAYS), 0.8725, 0.0001), "CIR crossing " + P.cirCrossingAu(P.SIDEREAL_DAYS));
assert(P.formatAu(P.cirCrossingAu(P.SIDEREAL_DAYS)) === "0.8725", "printed crossing");

var far = P.evaluate(400, 30.06896348, P.SIDEREAL_DAYS);
assert(P.formatDeg(far.westDeg) === "1,846.21°", "Neptune turn " + P.formatDeg(far.westDeg));
assert(far.turns > 5 && far.diskDeg < 90, "Neptune footpoint is several turns west, then on the western disk");
var jupiterWind = P.evaluate(400, 5.20336301, P.SIDEREAL_DAYS);
assert(jupiterWind.diskDeg > 180, "Jupiter footpoint has wrapped past the limb");
assert(P.why(jupiterWind).indexOf("east of the central meridian") !== -1, "wrapped footpoint is placed");
assert(P.why(open).indexOf("46.98°") !== -1 && P.why(open).indexOf("not substituted") !== -1, "opening explanation");
assert(P.why(open).indexOf("Not a forecast.") !== -1, "forecast refused");
assert(P.limitsNote().indexOf("Educational calculator") !== -1, "disclaimer");
assert(P.limitsNote().indexOf("Not a space-weather forecast") !== -1, "not a forecast");
assert(!P.vOk(249) && P.vOk(250) && P.vOk(900) && !P.vOk(901), "speed range");
assert(!P.rOk(0.09) && P.rOk(0.1) && P.rOk(40) && !P.rOk(40.1), "distance range");
assert(!P.pOk(19) && P.pOk(25.38) && !P.pOk(41), "period range");
assert(near(P.rFromUnit(P.rToUnit(1)), 1, 1e-12), "log slider round trip");
assert(P.viewAu(1) === 2.2, "inner view reaches Mars");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "GA lives in the nav include");
assert(html.indexOf("googletagmanager") === -1, "no second snippet");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf('class="subnav subnav-desk"') !== -1, "desktop nav");
assert(html.indexOf('class="subnav-phone"') !== -1, "phone nav");
assert(html.indexOf('aria-current="page">Parker spiral') !== -1, "current page");
assert(html.indexOf("/science/astronomy/parker-spiral/") !== -1, "canonical path");
assert(html.indexOf(P.formatDeg(open.psiDeg)) !== -1, "page states the angle");
assert(html.indexOf(P.formatDays(open.days)) !== -1, "page states the transit");
assert(html.indexOf(P.formatHours(open.hours)) !== -1, "page states the hours");
assert(html.indexOf(P.formatDeg(open.westDeg)) !== -1, "page states the footpoint");
assert(html.indexOf("609.12") !== -1, "page states the fact-sheet hours");
assert(html.indexOf("25.38") !== -1, "page states 25.38 days");
assert(html.indexOf("45.21°") !== -1, "page states the 27-day comparison");
assert(html.indexOf("0.0116") !== -1, "page states the source-surface distance");
assert(html.indexOf("0.8725") !== -1, "page states the stream crossing");
assert(html.indexOf(P.limitsNote()) !== -1, "disclaimer on the page");
assert(html.indexOf(P.why(open)) !== -1, "opening explanation on the page");
assert(html.indexOf('id="map"') !== -1, "map canvas");
assert(html.indexOf('id="angle"') !== -1, "angle chart");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1, "help control");
assert(html.indexOf("data-preset=\"earth-slow\"") !== -1, "earth slow preset");
assert(html.indexOf("data-preset=\"neptune-fast\"") !== -1, "neptune fast preset");
assert(html.indexOf("https://doi.org/10.1086/146579") !== -1, "Parker 1958");
assert(html.indexOf("https://www.swpc.noaa.gov/phenomena/solar-wind") !== -1, "NOAA solar wind");
assert(html.indexOf("1.52366231") !== -1 && html.indexOf("5.20336301") !== -1 && html.indexOf("30.06896348") !== -1, "planet axes");
assert(html.indexOf("/science/astronomy/cme/") !== -1, "cme link");
assert(html.indexOf("/science/astronomy/aurora/") !== -1, "aurora link");
assert(html.indexOf("/science/astronomy/magnetospheres/") !== -1, "magnetospheres link");
assert(html.indexOf("/science/astronomy/solar-cycle/") !== -1, "solar-cycle link");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/parker-spiral/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>Parker spiral</h3>") !== -1, "hub card");

["cme", "solar-cycle", "aurora", "magnetospheres"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/parker-spiral/") !== -1, name + " links here");
});

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/parker-spiral/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/parker-spiral/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/parker-spiral/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/parker-spiral/") found = true;
  });
});
assert(found, "whats-new lists the desk");

var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/parker-spiral/") !== -1, "science index links the desk");

console.log("parker.test.js: ok");
console.log("400 km/s at 1 AU", P.formatDeg(open.psiDeg), P.formatDays(open.days), "days", P.formatHours(open.hours), "h", P.formatDeg(open.westDeg), "west");
console.log("750 km/s", P.formatDeg(fast.psiDeg), P.formatDays(fast.days), "days");
console.log("27 d comparison", P.formatDeg(syn.psiDeg));
