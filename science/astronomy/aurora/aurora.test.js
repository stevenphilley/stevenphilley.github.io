/* Aurora desk checks. Cited latitudes and altitudes are not recomputed from a storm model.
   Run: node science/astronomy/aurora/aurora.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var A = require("./aurora.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(A.NOON_MLAT === 75 && A.MIDNIGHT_MLAT === 67, "glossary oval latitudes");
assert(A.DAYSIDE_OUTER_RE === 10 && A.DAYSIDE_INNER_RE === 6, "NASA dayside span");
assert(A.SHEATH_RE === 2, "glossary sheath");
assert(A.SKETCH_EXPAND_DEG === 12, "classroom offset is explicit");
assert(A.DIPOLE_DEG === 9.41, "WMM2020 inclination");
assert(A.MOON_RE === 60, "Moon orbit in Earth radii");
assert(A.FORMATION_KM[0] === 80 && A.FORMATION_KM[1] === 500, "NOAA formation range");
assert(A.TYPICAL_KM[0] === 100 && A.TYPICAL_KM[1] === 250, "glossary typical height");
assert(A.GLOSSARY_RANGE_KM[1] === 1000, "glossary full range");
assert(A.ISS_KM === 400 && A.COLUMN_TOP_KM === 500, "station and column");

assert(A.daysideRe(0) === 10 && A.daysideRe(1) === 6 && A.daysideRe(0.5) === 8, "dayside ends");
assert(A.daysideRe(-1) === 10 && A.daysideRe(2) === 6, "dayside clamps");
assert(A.bowShockRe(0) === 12 && A.bowShockRe(1) === 8, "sheath stacked on the slider");

var quiet = A.ovalLocus(0);
assert(quiet.noon === 75 && quiet.midnight === 67 && quiet.expand === 0 && quiet.sketch === false, "average oval is the glossary pair");
var storm = A.ovalLocus(1);
assert(storm.noon === 63 && storm.midnight === 55 && storm.expand === 12 && storm.sketch === true, "storm sketch is the classroom slide");
assert(A.ovalLocus(2).expand === 12 && A.ovalLocus(-0.2).noon === 75, "oval clamps");

var fit = A.ovalFit(75, 67);
assert(fit.noonColat === 15 && fit.midnightColat === 23, "colatitudes");
assert(fit.radiusDeg === 19 && fit.offsetDeg === 4, "circle fitted to the two latitudes");
var slid = A.ovalFit(63, 55);
assert(slid.radiusDeg === 31 && slid.offsetDeg === 4, "a pure slide keeps the offset");

var north = A.footpoint(67, "midnight");
var south = A.footpoint(-67, "midnight");
var noon = A.footpoint(75, "noon");
assert(north && south && noon, "footpoints exist");
assert(near(north.x * north.x + north.z * north.z, 1, 1e-9), "midnight foot is on the unit circle");
assert(north.z > 0 && south.z < 0, "northern and southern feet");
assert(north.x > 0 && noon.x < 0, "midnight is tailward and noon is sunward");
assert(A.footpoint(67, "dusk") === null, "unknown meridian");

assert(A.presetId(0) === "average" && A.presetId(1) === "storm" && A.presetId(0.5) === "", "presets");
assert(A.sliderText(0).indexOf("75°") !== -1 && A.sliderText(1).indexOf("Not a Kp map") !== -1, "slider text");
assert(A.readoutMagnet(0).indexOf("10 Earth radii") !== -1 && A.readoutMagnet(0).indexOf("not a forecast") !== -1, "magnet readout");
assert(A.readoutMagnet(1).indexOf("6 Earth radii") !== -1 && A.readoutMagnet(1).indexOf("8 Earth radii") !== -1, "compressed readout");
assert(A.readoutOval(0).indexOf("not a traced oval") !== -1 && A.readoutOval(0).indexOf("9.41°") !== -1, "quiet oval readout");
assert(A.readoutOval(1).indexOf("63°") !== -1 && A.readoutOval(1).indexOf("not a Kp contour") !== -1, "storm oval readout");
assert(A.readoutOval(1).indexOf("Twelve degrees is the classroom end") !== -1, "twelve degrees is labeled");

var card = A.detail(0);
assert(card.tier.indexOf("Average") !== -1, "average card");
assert(card.why.indexOf("Nothing here is a forecast") !== -1, "average card refuses a forecast");
assert(card.why.indexOf("60 and 75 degrees") !== -1, "observing latitudes stay distinct");
assert(card.stats.length === 6, "average stats");
var stormCard = A.detail(1);
assert(stormCard.why.indexOf("not a map of the United States") !== -1, "storm card is not a map");
assert(stormCard.why.indexOf("63°") !== -1 && stormCard.stats.some(function (row) { return row[0] === "Classroom slide"; }), "storm slide is labeled");
var mid = A.detail(0.5);
assert(mid.why.indexOf("8 Earth radii") !== -1 && mid.why.indexOf("not an observed latitude") !== -1, "mid slider");

["green", "red", "blue", "pink"].forEach(function (id) {
  var lay = A.layer(id);
  assert(lay && lay.why.indexOf("does not list a wavelength") !== -1, id + " refuses a wavelength");
});
assert(A.layer("green").km[0] === 100 && A.layer("green").km[1] === 200, "green band");
assert(A.layer("red").km[0] === 200, "red band");
assert(A.layer("pink").km[0] === 80 && A.layer("pink").km[1] === 100, "pink edge inside both sentences");
assert(A.layer("typical").why.indexOf("100 to 250 km") !== -1 && A.layer("typical").why.indexOf("1000 km") !== -1, "typical height");
assert(A.layer("nope") === null, "unknown layer");

var limits = A.limitsNote();
assert(limits.indexOf("Not a space-weather forecast") !== -1, "disclaimer");
assert(limits.indexOf("not a Kp product") !== -1, "not a Kp product");
assert(limits.indexOf("not a live oval") !== -1, "not live");
assert(limits.indexOf("Twelve degrees is a classroom offset") !== -1, "offset labeled in the disclaimer");
assert(limits.indexOf("does not list wavelengths") !== -1, "no wavelengths");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/aurora/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("aurora.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(limits) !== -1, "disclaimer on the page");
assert(html.indexOf(A.readoutMagnet(0)) !== -1, "magnet readout on the page");
assert(html.indexOf(A.readoutOval(0)) !== -1, "oval readout on the page");
assert(html.indexOf(card.why) !== -1, "average explanation on the page");
assert(html.indexOf(A.layer("green").why) !== -1, "green explanation on the page");
assert(html.indexOf('id="shield-canvas"') !== -1, "magnetosphere canvas");
assert(html.indexOf('id="oval-canvas"') !== -1, "oval canvas");
assert(html.indexOf('id="alt-canvas"') !== -1, "altitude canvas");
assert(html.indexOf('data-activity="0"') !== -1 && html.indexOf('data-activity="1"') !== -1, "activity presets");
assert(html.indexOf('data-layer="green"') !== -1 && html.indexOf('data-layer="typical"') !== -1, "color presets");
assert(html.indexOf("not a Kp") !== -1, "not a Kp product");
assert(html.indexOf("557.7") === -1 && html.indexOf("630.0") === -1, "no fabricated wavelengths");
assert(html.indexOf("Educational schematic") !== -1, "educational disclaimer");
assert(html.indexOf("https://science.nasa.gov/heliophysics/focus-areas/magnetosphere-ionosphere/") !== -1, "NASA magnetospheres");
assert(html.indexOf("https://science.nasa.gov/sun/auroras/") !== -1, "NASA auroras");
assert(html.indexOf("https://science.nasa.gov/sun/solar-storms-and-flares/") !== -1, "NASA storms");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html") !== -1, "Earth fact sheet");
assert(html.indexOf("https://www.ncei.noaa.gov/products/geomagnetism-frequently-asked-questions") !== -1, "NOAA NCEI");
assert(html.indexOf("https://www.swpc.noaa.gov/phenomena/aurora") !== -1, "NOAA aurora");
assert(html.indexOf("https://www.swpc.noaa.gov/content/space-weather-glossary") !== -1, "NOAA glossary");
assert(html.indexOf("/science/astronomy/solar-cycle/") !== -1, "solar-cycle cross-link");
assert(html.indexOf("/science/astronomy/seasons/") !== -1, "seasons cross-link");
assert(html.indexOf("/science/atmosphere/") !== -1, "atmosphere cross-link");
assert(html.indexOf("9.41") !== -1 && html.indexOf("11.5") !== -1 && html.indexOf("approximately 11") !== -1, "tilt figures stay distinct");
assert(html.indexOf("0.306") !== -1 && html.indexOf("0.24") !== -1, "fact-sheet field");
assert(html.indexOf("375 km/s") !== -1, "solar-wind speed");
assert(html.indexOf("Kp index") !== -1 || html.indexOf("Kp map") !== -1 || html.indexOf("Kp product") !== -1 || html.indexOf("Kp contour") !== -1, "Kp is refused");

var js = fs.readFileSync(path.join(__dirname, "aurora.js"), "utf8");
assert(js.indexOf("557.7") === -1 && js.indexOf("630.0") === -1, "module lists no wavelengths");
assert(js.indexOf("fetch(") === -1, "no live feed");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/aurora/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/aurora/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/aurora/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/aurora/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/aurora/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/aurora/") found = true;
  });
});
assert(found, "whats-new lists the desk");
var cycle = fs.readFileSync(path.join(__dirname, "../solar-cycle/index.html"), "utf8");
assert(cycle.indexOf("/science/astronomy/aurora/") !== -1, "solar-cycle points here");

console.log("aurora.test.js: ok");
console.log("Average oval", quiet.noon, quiet.midnight, "dayside", A.daysideRe(0));
console.log("Storm sketch", storm.noon, storm.midnight, "dayside", A.daysideRe(1));
