/* Foucault pendulum checks. T = sidereal day / |sin φ|.
   Run: node science/astronomy/foucault/foucault.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var F = require("./foucault.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(F.SIDEREAL_DAY_S === 86164.0905, "sidereal day seconds");
assert(F.JPL_SIDEREAL_DAY_S === 86164.09054, "JPL printed seconds stay beside");
assert(F.FACT_SHEET_HOURS === 23.9345, "fact-sheet hours stay beside");
assert(F.SIDEREAL_DAY_S !== F.JPL_SIDEREAL_DAY_S, "JPL extra digit is not substituted");
assert((F.SIDEREAL_DAY_S / 3600).toFixed(4) === "23.9345", "four decimals match the fact sheet");
assert(F.SIDEREAL_DAY_S / 3600 !== F.FACT_SHEET_HOURS, "fact-sheet rounding is not the divisor");

var pole = F.scene(90);
var southPole = F.scene(-90);
var thirty = F.scene(30);
var southThirty = F.scene(-30);
var equator = F.scene(0);
assert(pole.ok && thirty.ok && equator.ok, "scenes accept the test latitudes");

assert(near(pole.periodHours, F.SIDEREAL_DAY_S / 3600, 0), "90° is one sidereal day");
assert(pole.periodHours.toFixed(4) === "23.9345", "90° rounds to 23.9345 h");
assert(pole.text.clock === "23 h 56 m 4.0905 s", "pole clock " + pole.text.clock);
assert(pole.sense === "clockwise" && pole.text.sense === "Clockwise, viewed from above", "north pole sense");
assert(near(pole.rateSidereal, 15, 0), "15° per sidereal hour at the pole");
assert(near(pole.siderealDays, 1, 0), "one sidereal day");

assert(near(thirty.periodHours / pole.periodHours, 2, 1e-12), "30° is twice one sidereal day");
assert(near(thirty.siderealDays, 2, 1e-12), "30° is two sidereal days");
assert(thirty.text.turns === "2.000000 sidereal days", "30° text " + thirty.text.turns);
assert(near(thirty.rateSidereal, 7.5, 1e-12), "7.5° per sidereal hour at 30°");

assert(equator.precesses === false, "equator does not precess");
assert(equator.periodHours === Infinity && equator.periodSeconds === Infinity, "equator period is infinite");
assert(equator.rateSidereal === 0 && equator.rateSolar === 0, "equator rate is zero");
assert(equator.sense === "none", "equator has no sense");
assert(equator.text.period === "does not precess", "equator words");
assert(equator.text.sense === "Does not precess", "equator sense words");

assert(near(southThirty.rateSidereal, -thirty.rateSidereal, 0), "rate sign flips at 30° S");
assert(near(southThirty.rateSolar, -thirty.rateSolar, 0), "solar-hour rate sign flips");
assert(near(southThirty.periodHours, thirty.periodHours, 0), "period uses the absolute sine");
assert(southThirty.sense === "counter-clockwise", "south sense");
assert(southPole.sense === "counter-clockwise" && southPole.periodHours === pole.periodHours, "south pole");
assert(F.sense(45) === "clockwise" && F.sense(-45) === "counter-clockwise", "sign flips across the equator");

var campbell = F.scene(F.presetById("campbell").phi);
var paris = F.scene(F.presetById("paris").phi);
var sydney = F.scene(F.presetById("sydney").phi);
assert(F.presetById("campbell").phi === 37.29, "Campbell latitude");
assert(F.presetById("paris").phi === 48.85, "Paris latitude");
assert(F.presetById("sydney").phi === -33.87, "Sydney latitude");
assert(campbell.sense === "clockwise" && paris.sense === "clockwise", "northern presets");
assert(sydney.sense === "counter-clockwise", "Sydney is southern");
assert(near(campbell.periodSeconds, F.SIDEREAL_DAY_S / Math.abs(Math.sin(37.29 * Math.PI / 180)), 0), "Campbell is the formula");
assert(near(paris.periodSeconds, F.SIDEREAL_DAY_S / Math.abs(Math.sin(48.85 * Math.PI / 180)), 0), "Paris is the formula");
assert(campbell.text.period === "39.505632 h", "Campbell hours " + campbell.text.period);
assert(paris.text.period === "31.785930 h", "Paris hours " + paris.text.period);
assert(sydney.text.period === "42.946387 h", "Sydney hours " + sydney.text.period);
assert(campbell.text.rateSidereal.indexOf("9.08774") === 0, "Campbell sidereal rate " + campbell.text.rateSidereal);
assert(paris.text.rateSidereal.indexOf("11.29484") === 0, "Paris sidereal rate " + paris.text.rateSidereal);
assert(sydney.text.rateSidereal.charAt(0) === "\u2212", "Sydney rate carries a minus");

assert(F.scene(90.0001).ok === false && F.scene(-90.1).ok === false, "latitude window");
assert(F.scene(NaN).ok === false && F.parseLat("pole") === null, "a word is not a latitude");
assert(F.parseLat("37.29") === 37.29 && F.parseLat("\u221248.85") === -48.85, "parses a latitude");
assert(F.parseLat("91") === null && F.parseLat("") === null, "rejects an empty or out-of-range latitude");

var line = F.series(1);
assert(line[0].phi === -90 && line[line.length - 1].phi === 90, "series spans the poles");
assert(line.some(function (row) { return row.phi === 0 && row.precesses === false; }), "series marks the equator");
assert(line.every(function (row) {
  if (!row.precesses) return row.hours === null;
  return row.hours >= pole.periodHours - 1e-9;
}), "nothing turns faster than the pole");

var angle = F.planeAngleRad(90, F.SIDEREAL_DAY_S / 3600);
assert(near(angle, 2 * Math.PI, 1e-12), "one sidereal day at the pole is one clockwise turn");
assert(near(F.planeAngleRad(-90, F.SIDEREAL_DAY_S / 3600), -2 * Math.PI, 1e-12), "south pole turns the other way");
assert(F.planeAngleRad(0, 10) === 0, "equator angle stays put");
assert(F.disclaimer().indexOf("not an engineering design") !== -1, "disclaimer");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function has(bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
}
[
  "{% include nav.html %}",
  "{% include head-layout.html %}",
  "{% include footer.html %}",
  "subnav-desk",
  "subnav-phone",
  "subnav-desk{display:none}",
  "foucault.js",
  "min-height:44px",
  "class=\"help-q\"",
  "help-dialog",
  "aria-haspopup=\"dialog\"",
  "data-help-close",
  "id=\"plane\"",
  "id=\"period-chart\"",
  "id=\"lat\"",
  "id=\"lat-num\"",
  "id=\"play\"",
  "data-preset=\"campbell\"",
  "data-preset=\"paris\"",
  "data-preset=\"north\"",
  "data-preset=\"equator\"",
  "data-preset=\"sydney\"",
  "aria-current=\"page\">Foucault",
  "Sections \u00b7 Foucault",
  F.LIMITS,
  "86164.0905",
  "86,164.0905",
  "23.9345",
  "86164.09054",
  campbell.text.period,
  paris.text.period,
  sydney.text.period,
  pole.text.period,
  thirty.text.period,
  "does not precess",
  "Clockwise, viewed from above",
  "Counter-clockwise, viewed from above",
  "L\u00e9on Foucault",
  "Panth\u00e9on",
  "Coriolis",
  "Charron",
  "/science/astronomy/sidereal/",
  "/science/astronomy/precession/",
  "/science/astronomy/local-sky/",
  "https://ssd.jpl.nasa.gov/astro_par.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "10.1016/j.crhy.2017.11.003"
].forEach(has);
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf('type="number"') !== -1, "number field");
assert(html.indexOf('type="range"') !== -1, "slider");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/foucault/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>Foucault</h3>") !== -1, "hub card");
assert(hub.indexOf(campbell.text.period) !== -1 && hub.indexOf(paris.text.period) !== -1, "hub states both periods");

var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/foucault/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Foucault</h2>") !== -1, "science card");
assert(science.indexOf("Explore") !== -1, "explore heading");
var exploreAt = science.indexOf("<h4>Explore</h4>");
assert(exploreAt !== -1 && science.indexOf("/science/astronomy/foucault/", exploreAt) !== -1, "explore prose lists the desk");

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/foucault/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/foucault/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/foucault/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/foucault/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["sidereal", "precession"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/foucault/") !== -1, name + " links here");
});

console.log("foucault.test.js: ok");
console.log("Campbell", campbell.phi, campbell.text.period, campbell.text.clock, campbell.text.turns, campbell.text.rateSidereal, campbell.text.rateSolar, campbell.text.sense);
console.log("Paris", paris.phi, paris.text.period, paris.text.clock, paris.text.turns, paris.text.rateSidereal, paris.text.rateSolar, paris.text.sense);
console.log("Sydney", sydney.text.period, sydney.text.clock, sydney.text.sense);
console.log("Pole", pole.text.period, pole.text.clock, "30°", thirty.text.period, thirty.text.clock);
