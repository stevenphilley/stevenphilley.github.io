/* CME desk checks. Cited speeds, one division, no forecast.
   Run: node science/astronomy/cme/cme.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var C = require("./cme.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(C.AU_MILLION_KM === 149.598 && C.AU_KM === 149598000, "fact-sheet semimajor axis");
assert(C.CME_BOUND_KMS === 250 && C.CME_FAST_KMS === 3000, "NOAA CME bounds");
assert(C.STREAMER_KMS === 300 && C.SLOW_KMS === 400 && C.FAST_KMS === 800, "Marshall marks");
assert(C.SVS_SLOW_LO === 300 && C.SVS_SLOW_HI === 500, "SVS slow band");
assert(C.SVS_FAST_LO === 500 && C.SVS_FAST_HI === 800, "SVS fast band");
assert(C.NOAA_HOLE_LO === 500 && C.NOAA_HOLE_HI === 800, "NOAA coronal-hole band");
assert(C.ROTATION_DAYS === 27, "NOAA rotation sentence");
assert(C.CLASSROOM_CROSS_MS === 8000, "classroom timer is named");
assert(C.OPENING_KMS === 400, "page opens on the about-400 mark");

assert(C.clampSpeed(null) === 400 && C.clampSpeed(NaN) === 400, "missing speed opens at 400");
assert(C.clampSpeed(0) === 250 && C.clampSpeed(9000) === 3000, "slider clamps to the quoted ends");
assert(C.clampSpeed(400.4) === 400 && C.clampSpeed(400.5) === 401, "speed rounds to a kilometer per second");

[250, 300, 400, 500, 800, 3000].forEach(function (v) {
  var t = C.travel(v);
  assert(near(t.seconds, C.AU_KM / v, 1e-6), "seconds are distance over speed at " + v);
  assert(near(t.hours, t.seconds / 3600, 1e-9) && near(t.days, t.seconds / 86400, 1e-9), "hours and days follow the seconds");
});

assert(C.travel(400).hoursText === "103.89" && C.travel(400).daysText === "4.33", "about 400 km/s");
assert(C.travel(300).hoursText === "138.52" && C.travel(300).daysText === "5.77", "300 km/s");
assert(C.travel(250).hoursText === "166.22" && C.travel(250).daysText === "6.93", "250 km/s boundary");
assert(C.travel(500).hoursText === "83.11" && C.travel(500).daysText === "3.46", "500 km/s");
assert(C.travel(800).hoursText === "51.94" && C.travel(800).daysText === "2.16", "800 km/s");
assert(C.travel(3000).hoursText === "13.85" && C.travel(3000).daysText === "0.58", "near 3000 km/s");
assert(C.travel(2771).hoursText === "15.00" && C.readout(2771, "earth").indexOf("less than 15.00") === -1, "15.00 hours is not called shorter");
assert(C.travel(2772).hoursText === "14.99" && C.readout(2772, "earth").indexOf("less than 15.00") !== -1, "14.99 hours names the rounding");

assert(C.presetId(400) === "slow" && C.presetId(250) === "bound" && C.presetId(3000) === "cme-fast", "presets");
assert(C.presetId(401) === "" && C.presetId(650) === "", "between is not a preset");
assert(C.band(400).id === "about-400" && C.band(650).id === "fast-band" && C.band(2000).id === "above-wind", "bands");

var slow = C.readout(400, "earth");
var glance = C.readout(400, "glance");
assert(slow.indexOf("103.89 hours") !== -1 && glance.indexOf("103.89 hours") !== -1, "aim does not change the time");
assert(slow.indexOf("on the Sun–Earth line") !== -1 && glance.indexOf("off the Sun–Earth line") !== -1, "aim changes the cartoon sentence");
assert(slow.indexOf("15–18 hours") !== -1 && slow.indexOf("not this division") !== -1, "arrival sentences stay separate");
assert(slow.indexOf("does not convert") !== -1, "400 km/s does not convert miles per hour");
assert(C.readout(3000, "earth").indexOf("does not convert 3,000") !== -1, "fast end refuses a miles-per-hour conversion");
assert(C.readout(250, "earth").indexOf("does not print a slower floor") !== -1, "no invented floor below 250");
assert(C.sliderText(650).indexOf("between cited marks") !== -1 && C.sliderText(650).indexOf("Not an arrival") !== -1, "mid-slider text");

var card = C.detail(400, "earth");
assert(card.title === "About 400 km/s" && card.stats.length === 5, "opening card");
assert(card.stats[1][1] === "103.89 hours" && card.stats[4][1] === "On the Sun–Earth line", "opening stats");
assert(card.why.indexOf("Nothing here is a forecast") !== -1, "card refuses a forecast");
assert(card.why.indexOf("8 seconds") !== -1, "timer is named on the card");
assert(C.detail(3000, "glance").stats[4][1] === "Off the line · not an angle", "glance stat");
assert(C.detail(3000, "glance").why.indexOf("less than 15.00 hours") !== -1, "fast card names the shorter division");
assert(C.detail(400, "earth").why === C.detail(400, "earth").why, "detail is stable");

var spiralA = C.spiralNote();
var spiralB = C.spiralNote();
assert(spiralA === spiralB && spiralA.indexOf("27 days") !== -1 && spiralA.indexOf("not an angle") !== -1, "spiral note");
assert(spiralA.indexOf("°") === -1 && spiralA.indexOf("45") === -1, "no invented spiral angle");

var limits = C.limitsNote();
assert(limits.indexOf("Educational schematic") !== -1, "educational");
assert(limits.indexOf("Not a space-weather forecast") !== -1, "not a forecast");
assert(limits.indexOf("not a Kp or G-scale predictor") !== -1, "not a Kp or G-scale predictor");
assert(limits.indexOf("not a live CME catalog") !== -1, "not a live catalog");
assert(limits.indexOf("not a mission design tool") !== -1, "not a mission tool");
assert(limits.indexOf("8 seconds") !== -1, "timer in the disclaimer");
assert(limits.indexOf("No angle is computed") !== -1, "no angle");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/cme/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("cme.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(limits) !== -1, "disclaimer on the page");
assert(html.indexOf(slow) !== -1, "opening readout on the page");
assert(html.indexOf(card.why) !== -1, "opening explanation on the page");
assert(html.indexOf(spiralA) !== -1, "spiral note on the page");
assert(html.indexOf('id="path-canvas"') !== -1, "path canvas");
assert(html.indexOf('id="spiral-canvas"') !== -1, "spiral canvas");
assert(html.indexOf('data-speed="400"') !== -1 && html.indexOf('data-speed="3000"') !== -1, "cited presets");
assert(html.indexOf('data-aim="earth"') !== -1 && html.indexOf('data-aim="glance"') !== -1, "cartoon toggle");
assert(html.indexOf("Educational schematic") !== -1, "educational disclaimer");
assert(html.indexOf("https://www.swpc.noaa.gov/phenomena/coronal-mass-ejections") !== -1, "NOAA CME page");
assert(html.indexOf("https://www.swpc.noaa.gov/phenomena/solar-wind") !== -1, "NOAA solar wind");
assert(html.indexOf("https://science.nasa.gov/sun/solar-storms-and-flares/") !== -1, "NASA storms");
assert(html.indexOf("https://science.nasa.gov/sun/what-is-the-solar-wind/") !== -1, "NASA solar wind");
assert(html.indexOf("https://svs.gsfc.nasa.gov/20347/") !== -1, "NASA SVS bands");
assert(html.indexOf("https://solarscience.msfc.nasa.gov/SolarWind.shtml") !== -1, "Marshall solar wind");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html") !== -1, "Earth fact sheet");
assert(html.indexOf("/science/astronomy/solar-cycle/") !== -1, "solar-cycle cross-link");
assert(html.indexOf("/science/astronomy/aurora/") !== -1, "aurora cross-link");
assert(html.indexOf("/science/astronomy/van-allen/") !== -1, "van-allen cross-link");
assert(html.indexOf("not a forecast") !== -1, "forecast refused in prose");
assert(html.indexOf("G-scale") !== -1, "G-scale named in the refusal");
assert(html.indexOf("live CME catalog") !== -1, "catalog refused");
assert(html.indexOf("375 km/s") === -1, "glossary 375 km/s stays on the aurora desk");
assert(html.indexOf("15 to 60 minutes") !== -1, "L1 warning stays a different clock");
assert(html.indexOf("nearly a quarter") !== -1, "NOAA size sentence is quoted");

var js = fs.readFileSync(path.join(__dirname, "cme.js"), "utf8");
assert(js.indexOf("fetch(") === -1, "no live feed");
assert(js.indexOf("45") === -1, "module invents no 45-degree spiral");

var pageJs = html.slice(html.indexOf("function paintSpiral"));
assert(pageJs.indexOf("function paintSpiral") !== -1, "spiral painter exists");
var spiralFn = pageJs.slice(0, pageJs.indexOf("function paintPath"));
assert(spiralFn.indexOf("speed") === -1, "spiral painter does not read the slider");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/cme/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/cme/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/cme/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/cme/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/cme/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/cme/") found = true;
  });
});
assert(found, "whats-new lists the desk");
var cycle = fs.readFileSync(path.join(__dirname, "../solar-cycle/index.html"), "utf8");
assert(cycle.indexOf("/science/astronomy/cme/") !== -1, "solar-cycle points here");
var aurora = fs.readFileSync(path.join(__dirname, "../aurora/index.html"), "utf8");
assert(aurora.indexOf("/science/astronomy/cme/") !== -1, "aurora points here");
var belts = fs.readFileSync(path.join(__dirname, "../van-allen/index.html"), "utf8");
assert(belts.indexOf("/science/astronomy/cme/") !== -1, "van-allen points here");

console.log("cme.test.js: ok");
console.log("400 km/s", C.travel(400).hoursText, "hours", C.travel(400).daysText, "days");
console.log("3000 km/s", C.travel(3000).hoursText, "hours");
