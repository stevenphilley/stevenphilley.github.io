/* Star trails and sky rotation.
   Sidereal rate from 86,164.0905 s, sensor drift f · θ,
   the 500 rule, and Michaud's printed NPF pair.
   Run: node science/astronomy/star-trails/star-trails.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./star-trails.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(S.SIDEREAL_DAY_S === 86164.0905, "sidereal day seconds");
assert(S.JPL_SIDEREAL_DAY_S === 86164.09054, "JPL printed seconds stay beside");
assert(S.FACT_SHEET_HOURS === 23.9345, "fact-sheet hours stay beside");
assert(S.SIDEREAL_DAY_S !== S.JPL_SIDEREAL_DAY_S, "JPL extra digit is not substituted");
assert(S.MEAN_SOLAR_DAY_S === 86400, "mean solar day is 24.0000 h");
assert(S.solarRateArcsecPerSec() === 15, "a mean solar day is 15 arcsec per second");
assert(S.CAMPBELL_LAT === 37.29, "Campbell latitude");
assert(near(S.ARCSEC_PER_RAD, 206264.80624709636, 1e-9), "arcseconds in a radian");

var rate = S.rateArcsecPerSec();
assert(near(rate, 1296000 / 86164.0905, 0), "rate is a full circle over the sidereal day");
assert(near(rate, 15.041068645644208, 1e-12), "rate digits " + rate);
assert(S.formatSky(rate) === "15.04\u2033", "a bare rate under a minute formats as arcseconds");
var openRate = S.scene(S.DEFAULTS);
assert(openRate.text.rate === "15.041069\u2033/s", "formatted rate " + openRate.text.rate);
assert(openRate.text.solarRate === "15.000000\u2033/s", "formatted solar rate");

/* δ = 0, 30 s → 7.52′ and 451.23″. */
var check = {
  dec: 0,
  exposureS: 30,
  focalMm: 24,
  pitchUm: 5.9,
  crop: 1,
  blurPx: 1,
  aperture: 2.8,
  k: 1,
  lat: S.CAMPBELL_LAT,
  tracking: false
};
var eq = S.scene(check);
assert(eq.ok, "equator scene");
assert(near(eq.skyArcsec, rate * 30, 0), "thirty seconds is thirty times the rate");
assert(near(eq.skyArcsec, 451.23205936932624, 1e-9), "451.23 arcsec " + eq.skyArcsec);
assert(eq.text.sky === "7.52\u2032", "7.52 arcmin " + eq.text.sky);
assert(eq.text.skyArcsec === "451.23\u2033", "arcsec text " + eq.text.skyArcsec);
assert(eq.text.trail === "7.52\u2032", "pole angle matches the sky at δ = 0");
assert(near(eq.trailDeg, 0.12534223871370173, 1e-12), "pole angle in degrees");

/* 24 mm, 5.9 µm, δ = 0 → 0.2966 px/s. f · θ, θ in radians. */
var theta = eq.skyArcsec / S.ARCSEC_PER_RAD;
var byHand = (24 * theta) / 0.0059;
assert(near(eq.driftPx, byHand, 1e-9), "drift is f · θ over the pitch " + eq.driftPx + " vs " + byHand);
assert(near(eq.driftPxPerSec, byHand / 30, 1e-12), "per second");
assert(near(eq.driftPxPerSec, 0.29662844167793856, 1e-12), "0.2966 px/s " + eq.driftPxPerSec);
assert(eq.text.driftRate === "0.2966 px/s", "drift rate text " + eq.text.driftRate);
assert(eq.text.drift === "8.8989 px", "thirty-second drift " + eq.text.drift);
assert(near(eq.sharpSeconds, 1 / eq.driftPxPerSec, 1e-12), "one pixel is the reciprocal of the rate");
assert(eq.text.sharp === "3.371 s", "one-pixel exposure " + eq.text.sharp);

assert(eq.rule500Seconds === 500 / 24, "500 rule");
assert(eq.text.rule500 === "20.83 s", "500 rule text " + eq.text.rule500);
assert(near(eq.rule500BlurPx, eq.rule500Seconds * eq.driftPxPerSec, 1e-12), "500-rule blur is time times rate");
assert(eq.text.rule500Blur === "6.1798 px", "500-rule pixels " + eq.text.rule500Blur);

assert(eq.npfSimpleSeconds === (35 * 2.8 + 30 * 5.9) / 24, "NPF simplified, as printed");
assert(eq.text.npfSimple === "11.46 s", "NPF simple text " + eq.text.npfSimple);
assert(eq.npfSeconds === (1 * (16.9 * 2.8 + 0.10 * 24 + 13.7 * 5.9)) / 24, "NPF complete, as printed");
assert(eq.text.npf === "5.440 s", "NPF complete text " + eq.text.npf);
assert(eq.text.pole === "37.29\u00b0 N", "Campbell pole altitude " + eq.text.pole);
assert(eq.poleAltitudeDeg === 37.29, "pole altitude equals the latitude");

/* Declination scales the path, not the angle around the pole. */
var mid = S.scene({
  dec: 60,
  exposureS: 30,
  focalMm: 24,
  pitchUm: 5.9,
  crop: 1,
  blurPx: 1,
  aperture: 2.8,
  k: 1,
  lat: 37.29,
  tracking: false
});
assert(near(mid.cosDec, 0.5, 1e-15), "cos 60°");
assert(near(mid.skyArcsec, eq.skyArcsec / 2, 1e-9), "half the equatorial path");
assert(near(mid.trailArcsec, eq.trailArcsec, 0), "the pole angle does not change");
assert(mid.text.sky === "3.76\u2032", "half path text " + mid.text.sky);
assert(mid.text.trail === "7.52\u2032", "pole angle text stays");
assert(near(mid.driftPxPerSec, eq.driftPxPerSec / 2, 1e-12), "half the drift");
assert(near(mid.npfSeconds, eq.npfSeconds / 0.5, 1e-12), "NPF complete divides by cos δ");
assert(mid.rule500Seconds === eq.rule500Seconds, "the 500 rule ignores declination");

var pole = S.scene({
  dec: 90,
  exposureS: 30,
  focalMm: 24,
  pitchUm: 5.9,
  crop: 1,
  blurPx: 1,
  aperture: 2.8,
  k: 1,
  lat: 37.29,
  tracking: false
});
assert(pole.onPole && pole.driftPx === 0, "a pole star does not drift");
assert(pole.sharpSeconds === Infinity, "no pixel limit at the pole");
assert(pole.npfSeconds === Infinity, "NPF complete divides by zero at the pole");
assert(pole.text.drift === "0 px", "pole drift text");
assert(pole.text.npf === "no finite time", "pole NPF text");
assert(near(pole.trailArcsec, eq.trailArcsec, 0), "the pole angle is still the Earth's turn");

var tracked = S.scene({
  dec: 0,
  exposureS: 30,
  focalMm: 24,
  pitchUm: 5.9,
  crop: 1,
  blurPx: 1,
  aperture: 2.8,
  k: 1,
  lat: 37.29,
  tracking: true
});
assert(tracked.driftPx === 0 && tracked.driftPxPerSec === 0, "a sidereal mount cancels the drift");
assert(tracked.sharpSeconds === Infinity, "tracking has no pixel limit on this page");
assert(near(tracked.trailArcsec, eq.trailArcsec, 0), "the sky still turns");

var south = S.scene({
  dec: 0,
  exposureS: 1800,
  focalMm: 24,
  pitchUm: 5.9,
  crop: 1,
  blurPx: 1,
  aperture: 2.8,
  k: 1,
  lat: -33.87,
  tracking: false
});
assert(south.poleName === "south" && south.poleAltitudeDeg === -33.87, "southern pole");
assert(south.text.pole === "33.87\u00b0 S", "southern label " + south.text.pole);

/* Opening is thirty minutes, so the arcs are long enough to see.
   Sixty times thirty seconds, and an arcminute is sixty arcseconds,
   so the arcminute text matches the thirty-second arcsecond text. */
var halfHour = S.scene(S.DEFAULTS);
assert(S.DEFAULTS.exposureS === 1800, "page opens on 30 minutes");
assert(halfHour.text.trail === "7.521\u00b0", "opening angle " + halfHour.text.trail);
assert(halfHour.text.trailArcmin === eq.text.skyArcsec.replace("\u2033", "\u2032"), "30 min in arcminutes matches 30 s in arcseconds");
assert(halfHour.text.driftRate === "0.2966 px/s", "opening drift rate");
assert(halfHour.text.sharp === "3.371 s", "opening one-pixel time");
assert(halfHour.smallAngle === false, "30 min is past one degree");
assert(eq.smallAngle === true, "30 s is still a small angle");

var rows = S.focalRows(check);
assert(rows.length === 4, "four focal lengths");
assert(rows[0].focalMm === 14 && rows[0].text.driftRate === "0.1730 px/s", "14 mm " + rows[0].text.driftRate);
assert(rows[1].text.driftRate === "0.2966 px/s", "24 mm row");
assert(rows[2].text.rule500 === "10.00 s", "50 mm 500 rule " + rows[2].text.rule500);
assert(rows[3].focalMm === 200 && rows[3].text.sharp === "0.405 s", "200 mm " + rows[3].text.sharp);
assert(near(rows[0].sharpSeconds / rows[1].sharpSeconds, 24 / 14, 1e-12), "pixel time scales as 1/f");

var chart = S.chartSeries(check, 10, 400, 39);
assert(chart.length === 40, "chart samples");
assert(near(chart[0].focalMm, 10, 1e-9) && near(chart[chart.length - 1].focalMm, 400, 1e-9), "chart ends");
assert(near(chart[0].rule500, 500 / (1 * 10), 1e-12), "chart 500 rule");

assert(S.scene({ dec: 91, exposureS: 30, focalMm: 24, pitchUm: 5.9, crop: 1, blurPx: 1, aperture: 2.8, k: 1, lat: 37.29, tracking: false }).ok === false, "declination out of range");
assert(S.scene({ dec: 0, exposureS: 30, focalMm: 24, pitchUm: 5.9, crop: 1, blurPx: 1, aperture: 2.8, k: 1.5, lat: 37.29, tracking: false }).ok === false, "k is 1, 2, or 3");
assert(S.npfCompleteSeconds(2, 2.8, 5.9, 24, 0) === 2 * eq.npfSeconds, "k scales the complete rule");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function has(s) {
  assert(html.indexOf(s) !== -1, "page missing: " + s);
}
[
  "86,164.0905",
  "15.041069",
  "7.52\u2032",
  "451.23\u2033",
  "0.2966 px/s",
  "7.521\u00b0",
  "3.371 s",
  "20.83 s",
  "5.440 s",
  "11.46 s",
  "37.29",
  "Fr\u00e9d\u00e9ric Michaud",
  "Soci\u00e9t\u00e9 Astronomique du Havre",
  "https://sahavre.fr/wp/regle-npf-rule/",
  "16.9",
  "13.7",
  "subnav-desk",
  "subnav-phone",
  'aria-current="page"',
  'type="number"',
  'type="range"',
  "Polaris",
  "illustrative",
  "/science/astronomy/sidereal/",
  "/science/astronomy/local-sky/",
  "/science/astronomy/telescope/",
  "https://ssd.jpl.nasa.gov/astro_par.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  S.LIMITS,
  "Not an exposure"
].forEach(has);
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("Soci\u00e9t\u00e9 Astronomique de France") === -1, "NPF is credited to Le Havre, as the author's page prints");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/star-trails/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>Star trails</h3>") !== -1, "hub card");
assert(hub.indexOf("0.2966 px/s") !== -1, "hub states the drift");

var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/star-trails/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Star trails</h2>") !== -1, "science card");
var exploreAt = science.indexOf("<h4>Explore</h4>");
assert(exploreAt !== -1 && science.indexOf("/science/astronomy/star-trails/", exploreAt) !== -1, "explore prose lists the desk");

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/star-trails/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/star-trails/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/star-trails/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/star-trails/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["sidereal", "local-sky", "telescope"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/star-trails/") !== -1, name + " links here");
});

console.log("star-trails.test.js: ok");
console.log("30 s", eq.text.sky, eq.text.skyArcsec, eq.text.driftRate, eq.text.drift, eq.text.sharp);
console.log("500", eq.text.rule500, eq.text.rule500Blur, "NPF", eq.text.npfSimple, eq.text.npf);
console.log("30 min", halfHour.text.trail, halfHour.text.drift, halfHour.text.driftRate);
