/* Atmospheric refraction checks.
   Bennett 1982, Sæmundsson 1986, Meeus pressure factor,
   hour-angle daylight, and the horizon solar flattening.
   Run: node science/astronomy/refraction/refraction.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var R = require("./refraction.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(R.P_STD === 1010 && R.T_STD === 10, "standard air");
assert(R.NOAA_REFRACTION_ARCMIN === 34, "NOAA refraction allowance");
assert(R.SOLAR_SEMIDIAMETER_ARCMIN === 16, "NOAA semi-diameter");
assert(R.SUNRISE_ALT_DEG === -0.833, "NOAA sunrise altitude");
assert(R.OBLIQUITY_DEG === 23.44, "fact-sheet obliquity");
assert(R.CAMPBELL_LAT === 37.29, "Campbell latitude");
assert(near(R.pressureFactor(1010, 10), 1, 0), "standard factor is 1");

var horizon = R.bennettArcmin(0);
assert(horizon > 34 && horizon < 35, "Bennett horizon " + horizon);
assert(R.formatArcmin(horizon) === "34.5\u2032", "format Bennett horizon " + R.formatArcmin(horizon));
assert(near(R.bennettArcmin(45), 1.0, 0.05), "Bennett 45° " + R.bennettArcmin(45));
assert(R.formatArcmin(R.bennettArcmin(45)) === "0.995\u2032", "format 45° " + R.formatArcmin(R.bennettArcmin(45)));
assert(Math.abs(R.bennettArcmin(90)) < 0.01, "Bennett zenith " + R.bennettArcmin(90));
assert(R.bennettArcmin(90) < 0, "zenith residual is the formula, not forced to zero");
assert(near(R.bennettArcmin(0, 2020, 10), 2 * horizon, 1e-9), "pressure doubles refraction");
assert(near(R.bennettArcmin(10), 5.39, 0.01), "Bennett 10° " + R.bennettArcmin(10));

/* Sæmundsson at the true altitude Bennett implies stays within 0.1′. */
[0, 5, 10, 20, 30, 45, 60, 80].forEach(function (h) {
  var b = R.bennettArcmin(h);
  var s = R.saemundssonArcmin(h - b / 60);
  assert(Math.abs(b - s) < 0.1, h + "° Bennett and Sæmundsson differ by " + (b - s));
});

var arctic = R.bennettArcmin(0, 1030, -30);
var kea = R.bennettArcmin(0, 615, 0);
assert(arctic > horizon && kea < horizon, "cold dense air lifts more than thin summit air");
assert(near(arctic / horizon, R.pressureFactor(1030, -30), 1e-12), "arctic is the factor");
assert(near(kea / horizon, R.pressureFactor(615, 0), 1e-12), "Mauna Kea is the factor");

var open = R.scene({
  mode: "apparent",
  altitudeDeg: 0,
  pressureHpa: 1010,
  tempC: 10,
  lat: 37.29,
  dec: 0
});
assert(open.ok, "opening scene");
assert(open.text.bennett === "34.5\u2032", "opening Bennett " + open.text.bennett);
assert(open.text.saemundsson === "29.0\u2032", "Sæmundsson at true 0° " + open.text.saemundsson);
assert(open.text.companion === "34.4\u2032", "companion " + open.text.companion);
assert(open.text.gap === "0.037\u2032", "gap " + open.text.gap);
assert(open.text.otherAltitude === "\u22120.575\u00b0", "true altitude " + open.text.otherAltitude);
assert(open.text.center === "\u22120.841\u00b0", "geometric center " + open.text.center);
assert(open.text.semiOnly === "\u22120.267\u00b0", "semi-diameter altitude " + open.text.semiOnly);
assert(open.text.extra === "5.78 min", "Campbell equinox extra " + open.text.extra);
assert(open.text.simple === "5.78 min", "simple estimate matches at equinox " + open.text.simple);
assert(open.text.noaa === "5.69 min", "NOAA pair " + open.text.noaa);
assert(open.text.noaaZero === "8.38 min", "NOAA against 0° " + open.text.noaaZero);
assert(open.text.horizontal === "32.0\u2032" || open.text.horizontal === "32\u2032", "horizontal " + open.text.horizontal);
assert(open.text.vertical === "26.8\u2032", "apparent vertical " + open.text.vertical);
assert(open.text.flattening === "5.18\u2032", "flattening " + open.text.flattening);
assert(open.daylight.centerDeg < 0, "center is geometrically below the horizon");
assert(near(open.sun.flatteningArcmin, open.sun.horizontalArcmin - open.sun.apparentVerticalArcmin, 1e-6), "flattening is the diameter difference");

var zenith = R.scene({ mode: "apparent", altitudeDeg: 90, pressureHpa: 1010, tempC: 10, lat: 37.29, dec: 0 });
assert(zenith.text.bennett === "\u22120.001\u2032", "zenith text " + zenith.text.bennett);
var mid = R.scene({ mode: "apparent", altitudeDeg: 45, pressureHpa: 1010, tempC: 10, lat: 37.29, dec: 0 });
assert(mid.text.bennett === "0.995\u2032", "45° text");
var ten = R.scene({ mode: "true", altitudeDeg: 10, pressureHpa: 1010, tempC: 10, lat: 37.29, dec: 0 });
assert(ten.ok && ten.mode === "true", "true-altitude mode");
assert(ten.otherAltitudeDeg > 10, "apparent altitude sits above the true altitude");

var june = R.scene({ mode: "apparent", altitudeDeg: 0, pressureHpa: 1010, tempC: 10, lat: 37.29, dec: 23.44 });
assert(june.daylight.numericalMin > open.daylight.numericalMin, "solstice path is shallower, so the extra minutes grow");
assert(june.daylight.simpleMin < june.daylight.numericalMin, "sin H = 1 runs short off the equinox");

var pole = R.scene({ mode: "apparent", altitudeDeg: 0, pressureHpa: 1010, tempC: 10, lat: 90, dec: 0 });
assert(pole.ok && pole.daylight.crosses === false, "pole does not use the hour-angle quotient");
assert(pole.text.extra === "does not cross", "pole words");

assert(R.scene({ mode: "apparent", altitudeDeg: -0.1, pressureHpa: 1010, tempC: 10, lat: 0, dec: 0 }).ok === false, "altitude window");
assert(R.scene({ mode: "apparent", altitudeDeg: 0, pressureHpa: 615, tempC: 0, lat: 37.29, dec: 0 }).text.horizon === R.formatArcmin(kea), "Mauna Kea horizon follows the factor");
assert(R.presetById("arctic").tempC === -30 && R.presetById("arctic").pressureHpa === 1030, "arctic preset");
assert(R.presetById("kea").pressureHpa === 615 && R.presetById("kea").tempC === 0, "Mauna Kea preset");
assert(R.presetById("campbell").lat === 37.29 && R.presetById("campbell").dec === 0, "Campbell sunrise preset");
assert(R.parseNumber("\u221230", -80, 50) === -30, "parses a minus");
assert(R.parseNumber("90.1", 0, 90) === null, "rejects an altitude past 90");

var line = R.series(1010, 10, 1);
assert(line[0].alt === 0 && line[line.length - 1].alt === 90, "series spans the sky");
assert(line[0].bennett > line[line.length - 1].bennett, "refraction falls from the horizon toward the zenith");

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
  "refraction.js",
  "min-height:44px",
  "class=\"help-q\"",
  "help-dialog",
  "aria-haspopup=\"dialog\"",
  "data-help-close",
  "id=\"lift\"",
  "id=\"chart\"",
  "aria-current=\"page\">Refraction",
  "Sections \u00b7 Refraction",
  "7.31",
  "4.4",
  "1.02",
  "10.3",
  "5.11",
  "1010",
  "0.833",
  "Bennett",
  "S\u00e6mundsson",
  "Meeus",
  "green flash",
  "Novaya Zemlya",
  "0.07",
  "0.1",
  open.text.bennett,
  open.text.companion,
  open.text.extra,
  open.text.vertical,
  open.text.flattening,
  R.LIMITS,
  "/science/astronomy/airmass/",
  "/science/astronomy/twilight/",
  "/science/astronomy/local-sky/",
  "/science/astronomy/angular-size/",
  "https://doi.org/10.1017/S0373463300022037",
  "1986S&amp;T....72...70S"
].forEach(has);
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf('type="number"') !== -1, "number field");
assert(html.indexOf('type="range"') !== -1, "slider");
assert(html.indexOf("Not a forecast") !== -1, "disclaimer");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/refraction/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>Refraction</h3>") !== -1, "hub card");

var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/refraction/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Refraction</h2>") !== -1, "science card");
var exploreAt = science.indexOf("<h4>Explore</h4>");
assert(exploreAt !== -1 && science.indexOf("/science/astronomy/refraction/", exploreAt) !== -1, "explore prose lists the desk");

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/refraction/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/refraction/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/refraction/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/refraction/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["airmass", "twilight", "local-sky"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/refraction/") !== -1, name + " links here");
});

console.log("refraction.test.js: ok");
console.log("horizon", open.text.bennett, "companion", open.text.companion, "gap", open.text.gap, "true", open.text.otherAltitude);
console.log("45", mid.text.bennett, "zenith", zenith.text.bennett, "10 Bennett", R.formatArcmin(R.bennettArcmin(10)));
console.log("center", open.text.center, "extra", open.text.extra, "noaa", open.text.noaa, "simple", open.text.simple);
console.log("sun", open.text.horizontal, open.text.vertical, open.text.flattening, "fixed gap", open.text.fixedGap);
console.log("arctic", R.formatArcmin(arctic), "kea", R.formatArcmin(kea));
console.log("june extra", june.text.extra, "simple", june.text.simple);
