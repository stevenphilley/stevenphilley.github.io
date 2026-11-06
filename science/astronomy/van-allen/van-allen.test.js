/* Van Allen desk checks. Cited altitudes are not a flux model.
   Run: node science/astronomy/van-allen/van-allen.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var V = require("./van-allen.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(V.INNER_NEAR_KM === 650 && V.INNER_FAR_KM === 9660, "Webb inner kilometer span");
assert(V.INNER_NEAR_MI === 400 && V.INNER_FAR_MI === 6000, "Webb inner miles");
assert(V.OUTER_NEAR_KM === 13500 && V.OUTER_FAR_KM === 60000, "Webb outer kilometer span");
assert(V.OUTER_NEAR_MI === 8400 && V.OUTER_FAR_MI === 36000, "Webb outer miles");
assert(V.INNER_CENTER_KM === 3000, "inner center");
assert(V.OUTER_CENTER_LO_KM === 15000 && V.OUTER_CENTER_HI_KM === 20000, "outer centers");
assert(V.RE_KM === 6378, "fact-sheet radius");
assert(V.ISS_KM === 400 && V.ISS_MILES === 250, "station sentences");
assert(V.DIPOLE_DEG === 9.41, "WMM2020 inclination");
assert(V.COLUMN_BREAK_KM === 10000 && V.COLUMN_TOP_KM === 65000, "column scale is explicit");
assert(V.ISS_KM < V.INNER_NEAR_KM && V.ISS_MILES < V.INNER_NEAR_MI, "station numbers sit below the cited inner edge");

assert(near(V.geocentricRe(0), 1, 1e-12), "surface is one radius");
assert(near(V.geocentricRe(650), (6378 + 650) / 6378, 1e-12), "inner edge conversion");
assert(V.formatRe(V.geocentricRe(3000)) === "1.470", "3,000 km mark");
assert(V.formatRe(V.geocentricRe(15000)) === "3.352", "15,000 km mark");
assert(V.formatRe(V.geocentricRe(400)) === "1.063", "station mark");
assert(V.formatKm(9660) === "9,660" && V.formatKm(650) === "650", "kilometer commas");

var innerTube = V.torus(650, 9660);
var outerTube = V.torus(13500, 60000);
assert(innerTube.innerRe > 1 && innerTube.outerRe < outerTube.innerRe, "lobes stay outside Earth and apart");
assert(near(innerTube.centerRe, (innerTube.innerRe + innerTube.outerRe) / 2, 1e-12), "inner torus center");
assert(near(outerTube.tubeRe, (outerTube.outerRe - outerTube.innerRe) / 2, 1e-12), "outer tube radius");

var eq = V.dipolePoint(2, Math.PI / 2);
assert(eq && near(eq.r, 2, 1e-12) && near(eq.zm, 0, 1e-12), "equator crossing is L");
var foot = V.footTheta(2);
assert(foot != null && near(V.dipolePoint(2, foot).r, 1, 1e-9), "foot is on the surface");
assert(V.dipolePoint(0.5, 1) === null && V.footTheta(0.5) === null, "L below 1 is refused");
var north = V.magToGeo(0, 1);
assert(north && north.z > 0, "magnetic north stays north");
var tilted = V.magToGeo(2, 0);
assert(tilted && tilted.z < 0, "the 9.41° tilt leans the equator");

assert(V.columnFrac(400) < V.columnFrac(650), "station below inner edge on the column");
assert(V.columnFrac(650) < V.columnFrac(9660) && V.columnFrac(9660) < V.COLUMN_LOWER, "inner span below the break");
assert(V.columnFrac(13500) > V.COLUMN_LOWER && V.columnFrac(60000) < 1, "outer span above the break");
assert(V.columnFrac(-5) === 0 && V.columnFrac(1e9) === 1, "column clamps");

assert(V.innerKm(0) === 650 && V.innerKm(1000) === 9660, "inner slider ends");
assert(V.outerKm(0) === 13500 && V.outerKm(1000) === 60000, "outer slider ends");
assert(V.innerKm(-10) === 650 && V.outerKm(5000) === 60000, "sliders clamp");
assert(V.sliderForKm(650, 9660, 3000) === 261, "center is not a round slider percent");

assert(V.innerPreset(3000) === "center" && V.innerPreset(650) === "near" && V.innerPreset(9660) === "far", "inner presets");
assert(V.innerPreset(4000) === "", "between is not a preset");
assert(V.outerPreset(15000) === "center-lo" && V.outerPreset(20000) === "center-hi", "outer centers");
assert(V.outerPreset(13500) === "near" && V.outerPreset(60000) === "far", "outer ends");

assert(V.readoutInner(3000).indexOf("3,000 km") !== -1 && V.readoutInner(3000).indexOf("does not convert") !== -1, "center refuses a mile conversion");
assert(V.readoutInner(650).indexOf("about 400 miles") !== -1, "near end keeps the cited miles");
assert(V.readoutInner(9660).indexOf("about 6,000 miles") !== -1, "far end keeps the cited miles");
assert(V.readoutOuter(13500).indexOf("8,400 miles") !== -1 && V.readoutOuter(60000).indexOf("36,000 miles") !== -1, "outer miles only at the ends");
assert(V.readoutOuter(15000).indexOf("Not a flux model") !== -1, "outer readout refuses a flux");
assert(V.innerSliderText(4000).indexOf("Not a measured flux") !== -1, "mid-slider text");

var overview = V.detail("overview", 3000, 15000);
assert(overview.why.indexOf("Nothing here is a forecast") !== -1, "overview refuses a forecast");
assert(overview.why.indexOf("not a measured cross-section") !== -1, "torus is labeled");
assert(overview.why.indexOf("0.076 Re") !== -1, "offset is not drawn");
assert(overview.stats.length === 6, "overview stats");
var innerCard = V.detail("inner", 3000, 15000);
assert(innerCard.why.indexOf("30 million eV") !== -1 && innerCard.title === "About 3,000 km", "inner center card");
assert(V.detail("outer", 3000, 20000).why.indexOf("hundreds of millions of eV") !== -1, "outer energies stay quoted");
var saa = V.detail("saa", 3000, 15000);
assert(saa.why.indexOf("Not a hazard map") !== -1 && saa.why.indexOf("does not compute a dose") !== -1, "anomaly card");
assert(saa.why.indexOf("safe from harm while inside") !== -1, "ICON station sentence stays quoted");
assert(V.slotSentence().indexOf("it is highly variable") !== -1, "slot caption");
assert(V.stationSentence().indexOf("about 420 km") !== -1 && V.stationSentence().indexOf("Not a dose") !== -1, "420 km stays a different sentence");

var limits = V.limitsNote();
assert(limits.indexOf("Not a radiation forecast") !== -1, "disclaimer");
assert(limits.indexOf("not a dose calculator") !== -1, "not a dose calculator");
assert(limits.indexOf("not a mission design tool") !== -1, "not a mission tool");
assert(limits.indexOf("not a live belt model") !== -1, "not live");
assert(limits.indexOf("does not fill the slot") !== -1, "slot stays empty in the drawing");
assert(limits.indexOf("No dip distance is drawn") !== -1, "no invented dip");
assert(limits.indexOf("10,000 km") !== -1 && limits.indexOf("65,000 km") !== -1, "column scale is named");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/van-allen/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("van-allen.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(limits) !== -1, "disclaimer on the page");
assert(html.indexOf(V.readoutInner(3000)) !== -1, "inner readout on the page");
assert(html.indexOf(V.readoutOuter(15000)) !== -1, "outer readout on the page");
assert(html.indexOf(overview.why) !== -1, "overview on the page");
assert(html.indexOf('id="belt-canvas"') !== -1, "belt canvas");
assert(html.indexOf('id="near-canvas"') !== -1, "near canvas");
assert(html.indexOf('id="alt-canvas"') !== -1, "altitude canvas");
assert(html.indexOf('data-inner="3000"') !== -1 && html.indexOf('data-outer="15000"') !== -1, "cited presets");
assert(html.indexOf('id="saa-button"') !== -1, "anomaly note");
assert(html.indexOf("Educational schematic") !== -1, "educational disclaimer");
assert(html.indexOf("https://www.nasa.gov/solar-system/ahead-of-webb-launch-nasa-is-watching-the-weather-in-space/") !== -1, "Webb note");
assert(html.indexOf("https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/") !== -1, "Basics of Space Flight");
assert(html.indexOf("https://science.nasa.gov/biological-physical/stories/van-allen-belts/") !== -1, "NASA Science belts");
assert(html.indexOf("https://www.nasa.gov/missions/van-allen-probes/nasas-van-allen-probes-revolutionize-view-of-radiation-belts/") !== -1, "Van Allen Probes");
assert(html.indexOf("https://www.nasa.gov/missions/icon/nasa-researchers-track-slowly-splitting-dent-in-earths-magnetic-field/") !== -1, "ICON anomaly");
assert(html.indexOf("https://svs.gsfc.nasa.gov/4557") !== -1, "L-shell note");
assert(html.indexOf("https://science.nasa.gov/sun/auroras/") !== -1, "station altitude");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html") !== -1, "Earth fact sheet");
assert(html.indexOf("https://www.ncei.noaa.gov/products/geomagnetism-frequently-asked-questions") !== -1, "NOAA NCEI");
assert(html.indexOf("/science/astronomy/aurora/") !== -1, "aurora cross-link");
assert(html.indexOf("/science/astronomy/solar-cycle/") !== -1, "solar-cycle cross-link");
assert(html.indexOf("/science/astronomy/satellites/") !== -1, "satellites cross-link");
assert(html.indexOf("/science/atmosphere/") !== -1, "atmosphere cross-link");
assert(html.indexOf("/science/astronomy/atmospheric-escape/") !== -1, "escape cross-link");
assert(html.indexOf("0.8 MeV") !== -1 && html.indexOf("about once every 10 years") !== -1, "storm sentences stay paired");
assert(html.indexOf("about 600 miles") !== -1 && html.indexOf("about 400 miles") !== -1, "near-edge sentences stay distinct");
assert(html.indexOf("about 420 km") !== -1, "lithograph altitude stays distinct");

var js = fs.readFileSync(path.join(__dirname, "van-allen.js"), "utf8");
assert(js.indexOf("fetch(") === -1, "no live feed");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/van-allen/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/van-allen/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/van-allen/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/van-allen/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/van-allen/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/van-allen/") found = true;
  });
});
assert(found, "whats-new lists the desk");
var cycle = fs.readFileSync(path.join(__dirname, "../solar-cycle/index.html"), "utf8");
assert(cycle.indexOf("/science/astronomy/van-allen/") !== -1, "solar-cycle points here");
var aurora = fs.readFileSync(path.join(__dirname, "../aurora/index.html"), "utf8");
assert(aurora.indexOf("/science/astronomy/van-allen/") !== -1, "aurora points here");

console.log("van-allen.test.js: ok");
console.log("Inner center", V.formatRe(V.geocentricRe(3000)), "outer center", V.formatRe(V.geocentricRe(15000)));
