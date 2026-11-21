/* Aberration of starlight. Angles come from v/c and from the relativistic cosine formula.
   Run: node science/astronomy/aberration/aberration.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var A = require("./aberration.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(A.C_KM_S === 299792.458, "exact c in km/s");
assert(A.KAPPA_AS === 20.49552, "IAU constant of aberration");
assert(A.V_EARTH_MEAN === 29.78, "fact-sheet mean orbital velocity");
assert(A.R_EQ_KM === 6378.137, "equatorial radius");
assert(A.SIDEREAL_H === 23.9345, "sidereal rotation");
assert(A.V_VOYAGER === 17.0, "Voyager 1 heliocentric speed");
assert(A.GAMMA_DRA_MAS === 21.14 && A.GAMMA_DRA_ERR_MAS === 0.10, "Hipparcos parallax");
assert(A.REL_BETA === 0.9, "relativistic preset");
assert(near(A.V_MAX, 0.9 * A.C_KM_S, 0), "0.9c in km/s");
assert(A.SUN_GM === 132712 * 1e6, "Sun GM matches vis-viva");
assert(A.EARTH_RP_KM === 147.095e6 && A.EARTH_RA_KM === 152.100e6, "fact-sheet perihelion and aphelion");

var hand = (29.78 / 299792.458) * A.ARCSEC_PER_RAD;
assert(near(A.classicalArcsec(29.78, 90), hand, 1e-9), "classical angle is v/c in arcseconds");
assert(A.formatAngle(hand) === "20.48939″", "printed Earth-mean angle " + A.formatAngle(hand));
assert(near(hand, 20.49, 0.01), "hand figure is about 20.49 arcsec");
assert(A.formatAngle(A.KAPPA_AS) === "20.49552″", "κ prints every digit");
assert(Math.abs(hand - A.KAPPA_AS) > 0.006 && Math.abs(hand - A.KAPPA_AS) < 0.007, "the quotient is not κ");

assert(A.formatSpeed(A.earthPeriSpeed()) === "30.287 km/s", "vis-viva perihelion " + A.formatSpeed(A.earthPeriSpeed()));
assert(A.formatSpeed(A.earthApoSpeed()) === "29.291 km/s", "vis-viva aphelion " + A.formatSpeed(A.earthApoSpeed()));
assert(near(Math.round(A.earthPeriSpeed() * 100) / 100, A.SHEET_VP, 0), "perihelion rounds to the sheet");
assert(near(Math.round(A.earthApoSpeed() * 100) / 100, A.SHEET_VA, 0), "aphelion rounds to the sheet");
assert(A.formatSpeed(A.equatorialSpeed()) === "0.465101 km/s", "equatorial speed " + A.formatSpeed(A.equatorialSpeed()));
assert(A.formatAngle(A.classicalArcsec(A.equatorialSpeed(), 90)) === "0.32000″", "diurnal angle");
assert(A.formatSpeed(17) === "17.0 km/s", "Voyager formatting");
assert(A.formatAngle(A.classicalArcsec(17, 90)) === "11.69643″", "Voyager angle");

var rel = A.scene({ preset: "rel" });
assert(rel.ok && rel.preset === "rel" && rel.beta === 0.9, "0.9c preset");
assert(rel.text.classical === "51.56620°", "first-order at 0.9c " + rel.text.classical);
assert(rel.text.galilean === "41.98721°", "classical tan at 0.9c " + rel.text.galilean);
assert(rel.text.relativistic === "64.15807°", "relativistic at 0.9c " + rel.text.relativistic);
assert(rel.text.classical !== rel.text.relativistic, "they diverge at high β");
assert(near(A.relativisticArcsec(A.V_MAX, 60), A.relativisticTanArcsec(A.V_MAX, 60), 1e-6), "tan θ′ matches the cosine formula");

var th60 = 60 * Math.PI / 180;
var cosTp = (Math.cos(th60) + 0.9) / (1 + 0.9 * Math.cos(th60));
var shift60 = (th60 - Math.acos(cosTp)) * A.ARCSEC_PER_RAD;
assert(near(A.relativisticArcsec(A.V_MAX, 60), shift60, 1e-6), "cosine formula by hand");
assert(near(A.classicalArcsec(A.V_MAX, 0), 0, 0) && near(A.relativisticArcsec(A.V_MAX, 180), 0, 1e-6), "no shift along the velocity");

assert(A.formatAngle(A.gammaDraParallaxArcsec()) === "0.02114″", "γ Dra parallax");
assert(A.gammaDraDistancePc().toFixed(4) === "47.3037", "γ Dra distance");
assert(A.scene().text.ratio === "969.514", "κ over the parallax");

var pole = A.samples(90, 25);
pole.forEach(function (p) {
  var r = Math.hypot(p.aberration.x, p.aberration.y);
  assert(near(r, A.KAPPA_AS, 1e-9), "pole is a circle of radius κ");
});
var flat = A.samples(0, 19);
flat.forEach(function (p) {
  assert(near(p.aberration.y, 0, 1e-9), "ecliptic path has no latitude");
  assert(Math.abs(p.aberration.x) <= A.KAPPA_AS + 1e-9, "ecliptic half-length is κ");
});
var s45 = Math.sin(Math.PI / 4);
var minor = A.axes(A.KAPPA_AS, 45).semiMinor;
assert(near(minor, A.KAPPA_AS * s45, 1e-9), "semi-minor axis is κ sin β");
assert(A.pathShape(90) === "circle" && A.pathShape(0) === "line" && A.pathShape(45) === "ellipse", "three shapes");
A.samples(45, 37).forEach(function (p) {
  var x = p.aberration.x;
  var y = p.aberration.y;
  var e = (x * x) / (A.KAPPA_AS * A.KAPPA_AS) + (y * y) / (minor * minor);
  assert(near(e, 1, 1e-8), "aberration ellipse");
});

var phi = 37;
var ab = A.displacement(A.KAPPA_AS, 33, phi, "aberration");
var ahead = A.displacement(A.KAPPA_AS, 33, phi - 90, "parallax");
assert(near(ab.x, ahead.x, 1e-9) && near(ab.y, ahead.y, 1e-9), "aberration lags parallax by 90°");
var ab0 = A.displacement(A.KAPPA_AS, 45, 0, "aberration");
var par0 = A.displacement(1, 45, 0, "parallax");
assert(ab0.x < 0 && near(ab0.y, 0, 1e-9), "aberration at φ = 0 points along decreasing longitude");
assert(par0.y < 0 && near(par0.x, 0, 1e-9), "parallax at φ = 0 points toward the ecliptic");
assert(near(ab0.x * par0.x + ab0.y * par0.y, 0, 1e-9), "the two arrows are perpendicular at φ = 0");

var open = A.scene();
assert(open.preset === "mean" && open.v === 29.78 && open.theta === 90 && open.betaEcl === 90, "opening controls");
assert(open.text.classical === "20.48939″" && open.text.relativistic === "20.48939″", "opening angles");
assert(open.text.kappa === "20.49552″" && open.text.delta === "3.371 × 10⁻⁸″", "κ and the tiny split");
assert(open.text.distance === "47.3037 pc" && open.shape === "circle", "γ Dra on a circle");
assert(A.scene({ preset: "peri" }).text.speed === "30.287 km/s", "perihelion button");
assert(A.scene({ preset: "apo" }).text.speed === "29.291 km/s", "aphelion button");
assert(A.scene({ preset: "equator" }).text.diurnal === "0.32000″", "equator button");
assert(A.scene({ preset: "voyager" }).text.speed === "17.0 km/s", "Voyager button");
assert(A.scene({ betaEcl: 0 }).shape === "line", "ecliptic is a line");
assert(A.scene({ betaEcl: 45 }).text.semiMinor === "14.49252″", "45° semi-minor");
assert(A.scene({ v: 0 }).ok === false, "zero speed refused");
assert(A.scene({ v: A.V_MAX + 1 }).ok === false, "above 0.9c refused");
assert(A.scene({ theta: 181 }).ok === false && A.scene({ betaEcl: 91 }).ok === false, "angle windows");
assert(A.scene({ distancePc: 0 }).ok === false, "zero distance refused");
assert(A.scene({ preset: "nope" }).ok === false, "unknown preset");
assert(!isFinite(A.parseNum("star")), "a word is not a speed");
assert(A.parseNum("29.78") === 29.78, "parses a speed");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/aberration/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf("subnav-desk{display:none}") !== -1, "desktop nav hides on a phone");
assert(html.indexOf('href="/science/astronomy/aberration/" aria-current="page"') !== -1, "current section");
assert(html.indexOf("aberration.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(A.LIMITS) !== -1, "disclaimer on the page");
assert(html.indexOf(open.text.classical) !== -1, "opening classical angle");
assert(html.indexOf(open.text.kappa) !== -1, "opening κ");
assert(html.indexOf(open.text.delta) !== -1, "opening difference");
assert(html.indexOf(open.text.why) !== -1, "opening why");
assert(html.indexOf(open.text.sky) !== -1, "opening sky note");
assert(html.indexOf(open.text.aria) !== -1, "opening canvas label");
assert(html.indexOf('id="sky"') !== -1 && html.indexOf('id="diverge"') !== -1, "two canvases");
assert(html.indexOf('data-preset="mean"') !== -1, "Earth mean button");
assert(html.indexOf('data-preset="peri"') !== -1 && html.indexOf('data-preset="apo"') !== -1, "vis-viva presets");
assert(html.indexOf('data-preset="equator"') !== -1, "equator button");
assert(html.indexOf('data-preset="voyager"') !== -1, "Voyager button");
assert(html.indexOf('data-preset="rel"') !== -1, "0.9c button");
assert(html.indexOf("20.49552") !== -1, "κ digits");
assert(html.indexOf("21.14") !== -1, "γ Dra parallax digits");
assert(html.indexOf("29.78") !== -1 && html.indexOf("299,792.458") !== -1, "fact-sheet speed and c");
assert(html.indexOf("30.287") !== -1 && html.indexOf("29.291") !== -1, "vis-viva speeds");
assert(html.indexOf("0.465101") !== -1, "equatorial speed");
assert(html.indexOf("17.0") !== -1, "Voyager digits");
assert(html.indexOf("James Bradley") !== -1, "Bradley named");
assert(html.indexOf("van Leeuwen") !== -1, "Hipparcos reduction named");
assert(html.indexOf("Educational schematic") !== -1, "educational disclaimer");
assert(html.indexOf("Not an astrometric reduction") !== -1, "reduction refused");
assert(html.indexOf("nutation") !== -1 && html.indexOf("planetary aberration") !== -1, "omitted effects named");
assert(html.indexOf("/science/astronomy/parallax/") !== -1, "parallax link");
assert(html.indexOf("/science/astronomy/time-dilation/") !== -1, "time-dilation link");
assert(html.indexOf("/science/astronomy/light-time/") !== -1, "light-time link");
assert(html.indexOf("/science/astronomy/vis-viva/") !== -1, "vis-viva link");
assert(html.indexOf("10.1098/rstl.1727.0064") !== -1, "Bradley doi");
assert(html.indexOf("earthfact.html") !== -1, "Earth fact sheet");
assert(html.indexOf("Circular_163.pdf") !== -1, "USNO circular");
assert(html.indexOf("voyager-1") !== -1, "Voyager source");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/aberration/") !== -1, "hub links the desk");
assert(hub.indexOf("20.48939") !== -1 && hub.indexOf("20.49552") !== -1, "hub sentence has both angles");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/aberration/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/aberration/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/aberration/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/aberration/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/aberration/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["parallax", "time-dilation", "light-time"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/aberration/") !== -1, name + " links here");
});

console.log("aberration.test.js: ok");
console.log("29.78 km/s", open.text.classical, "κ", open.text.kappa, "split", open.text.delta);
console.log("0.9c", rel.text.classical, rel.text.galilean, rel.text.relativistic);
console.log("equator", A.formatSpeed(A.equatorialSpeed()), open.text.diurnal);
console.log("γ Dra", open.text.distance, open.text.parallaxExact, "κ/p", open.text.ratio);
