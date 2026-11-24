/* Proper motion and space velocity.
   Run: node science/astronomy/proper-motion/proper-motion.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var P = require("./proper-motion.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(P.AU_KM === 149597870.7, "IAU astronomical unit");
assert(P.JULIAN_YEAR_S === 365.25 * 86400, "Julian year");
assert(near(P.FACTOR, P.AU_KM / P.JULIAN_YEAR_S, 0), "factor is AU per Julian year");
assert(P.formatFactor() === "4.74047046", "printed quotient");
assert(Math.round(P.FACTOR * 1e5) / 1e5 === 4.74047, "five-decimal rounding is 4.74047");
assert(P.MOON_AS === 1800 && P.DEGREE_AS === 3600, "half a degree and one degree");

var barn = P.presetById("barnard");
var mu = P.totalMuMas(barn.pmra, barn.pmdec) / 1000;
var d = 1000 / barn.plx;
var hand = (149597870.7 / (365.25 * 86400)) * mu * d;
assert(near(P.tangential(mu, d), hand, 0), "tangential speed is the quotient");
assert(near(hand, 90.076, 0.0005), "Barnard's Star tangential speed is about 90 km/s");
assert(near(4.74047 * mu * d, hand, 0.0005), "4.74047 agrees at the printed thousandths");

var open = P.scene({ preset: "barnard" });
assert(open.ok && open.name === "Barnard's Star", "opens on Barnard's Star");
assert(open.text.vt === "90.076 km/s", "printed tangential speed " + open.text.vt);
assert(open.text.v === "142.537 km/s", "printed space velocity " + open.text.v);
assert(open.text.vr === "−110.468 km/s", "printed radial velocity");
assert(open.text.mu === "10.393349″/yr", "printed proper motion");
assert(open.text.distance === "1.828234 pc", "printed distance");
assert(open.text.angle === "140.81°", "angle from the outward line of sight");
assert(open.when === "future", "Barnard's Star is approaching");
assert(open.text.moon === "173.2 yr", "years to drift half a degree");
assert(open.text.degree === "346.4 yr", "years to drift one degree");
assert(open.text.span === "1,039.3″", "century of motion");
assert(open.text.closestTime === "9,719.8 yr", "closest approach");
assert(near(open.rMinPc, open.distancePc * open.vt / open.v, 1e-9), "minimum distance formula");
assert(near(open.tYr, -(open.distancePc * open.rv) / (open.v * open.v) * P.YEARS_PER_PC_AT_1KMS, 1e-6), "closest-approach time");
assert(near(open.paDeg, 355.58, 0.01), "position angle is nearly north");
assert(near(Math.hypot(open.end.east, open.end.north), open.muAsYr * 100, 1e-9), "track length is μ times years");

var kap = P.scene({ preset: "kapteyn" });
assert(kap.when === "past" && kap.rv > 0, "Kapteyn's Star is receding");
assert(kap.text.vt === "161.205 km/s", "Kapteyn tangential speed");

var den = P.scene({ preset: "deneb" });
assert(den.muAsYr < 0.01 && den.distancePc > 400, "Deneb is slow and distant");
assert(den.text.vt === "5.606 km/s", "Deneb tangential speed");

["proxima", "cygni", "arcturus"].forEach(function (id) {
  var sc = P.scene({ preset: id });
  assert(sc.ok && sc.vt > 0 && sc.v >= sc.vt, id + " has a space velocity");
});

assert(P.scene({ muAsYr: -1, distancePc: 1, rv: 0 }).ok === false, "negative proper motion refused");
assert(P.scene({ muAsYr: 1, distancePc: 0, rv: 0 }).ok === false, "zero distance refused");
assert(P.scene({ preset: "nope" }).ok === false, "unknown preset");
assert(!isFinite(P.parseNum("star")), "a word is not a number");
assert(P.parseNum("−110.468") === -110.468, "parses a unicode minus");
assert(near(P.muFromInputs(10393.349, "mas"), 10.393349, 1e-9), "mas converts to arcsec");
assert(near(P.distancePcFromInputs(546.9759, "plx"), d, 1e-9), "parallax converts to parsecs");
assert(near(P.distancePcFromInputs(d * P.LY_PER_PC, "ly"), d, 1e-6), "light-years convert back");

var moved = P.offset(10, 0, 1);
assert(near(moved.north, 10, 1e-12) && near(moved.east, 0, 1e-12), "position angle 0 is north");
var east = P.offset(10, 90, 1);
assert(near(east.east, 10, 1e-12) && near(east.north, 0, 1e-12), "position angle 90 is east");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/proper-motion/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf("subnav-desk{display:none}") !== -1, "desktop nav hides on a phone");
assert(html.indexOf('href="/science/astronomy/proper-motion/" aria-current="page"') !== -1, "current section");
assert(html.indexOf("proper-motion.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(P.LIMITS) !== -1, "disclaimer on the page");
assert(html.indexOf(open.text.vt) !== -1, "opening tangential speed");
assert(html.indexOf(open.text.v) !== -1, "opening space velocity");
assert(html.indexOf(open.text.mu) !== -1, "opening proper motion");
assert(html.indexOf(open.text.aria) !== -1, "opening canvas label");
assert(html.indexOf('id="sky"') !== -1, "canvas");
assert(html.indexOf('data-preset="barnard"') !== -1, "Barnard button");
assert(html.indexOf('data-preset="kapteyn"') !== -1, "Kapteyn button");
assert(html.indexOf('data-preset="proxima"') !== -1, "Proxima button");
assert(html.indexOf('data-preset="cygni"') !== -1, "61 Cygni button");
assert(html.indexOf('data-preset="arcturus"') !== -1, "Arcturus button");
assert(html.indexOf('data-preset="deneb"') !== -1, "Deneb button");
assert(html.indexOf("546.9759") !== -1 && html.indexOf("4472832130942575872") !== -1, "Barnard Gaia source");
assert(html.indexOf("254.1986") !== -1 && html.indexOf("4810594479418041856") !== -1, "Kapteyn Gaia source");
assert(html.indexOf("768.0665") !== -1 && html.indexOf("5853498713190525696") !== -1, "Proxima Gaia source");
assert(html.indexOf("285.9949") !== -1 && html.indexOf("1872046609345556480") !== -1, "61 Cygni Gaia source");
assert(html.indexOf("88.83") !== -1 && html.indexOf("HIP 69673") !== -1, "Arcturus Hipparcos");
assert(html.indexOf("2.31") !== -1 && html.indexOf("HIP 102098") !== -1, "Deneb Hipparcos");
assert(html.indexOf("4.74047") !== -1 && html.indexOf("4.74047046") !== -1, "both forms of the constant");
assert(html.indexOf("977,792.22") !== -1, "parsec at 1 km/s");
assert(html.indexOf("Linear approximation") !== -1 || html.indexOf("linear approximation") !== -1, "closest approach labeled");
assert(html.indexOf("Edmond Halley") !== -1 && html.indexOf("10.1098/rstl.1717.0025") !== -1, "Halley cited");
assert(html.indexOf("E. E. Barnard") !== -1 && html.indexOf("10.1086/104156") !== -1, "Barnard cited");
assert(html.indexOf("van Leeuwen") !== -1 && html.indexOf("Gontcharov") !== -1, "Hipparcos and radial-velocity sources");
assert(html.indexOf("Educational schematic") !== -1, "educational disclaimer");
assert(html.indexOf("Big Dipper") !== -1, "qualitative Dipper note");
assert(html.indexOf("/science/astronomy/parallax/") !== -1, "parallax link");
assert(html.indexOf("/science/astronomy/radial-velocity/") !== -1, "radial-velocity link");
assert(html.indexOf("/science/astronomy/nearest-stars/") !== -1, "nearest-stars link");
assert(html.indexOf("/science/astronomy/aberration/") !== -1, "aberration link");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/proper-motion/") !== -1, "hub links the desk");
assert(hub.indexOf("90.076") !== -1, "hub card has the tangential speed");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/proper-motion/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/proper-motion/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/proper-motion/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/proper-motion/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/proper-motion/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["parallax", "radial-velocity", "nearest-stars", "aberration"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/proper-motion/") !== -1, name + " links here");
});

console.log("proper-motion.test.js: ok");
console.log("Barnard", open.text.vt, open.text.v, open.text.angle, open.text.moon);
console.log("Deneb", den.text.vt, den.text.distance);
