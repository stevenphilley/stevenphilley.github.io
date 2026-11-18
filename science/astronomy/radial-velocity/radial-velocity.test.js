/* Radial-velocity desk checks. K is computed, not pasted.
   Run: node science/astronomy/radial-velocity/radial-velocity.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var RV = require("./radial-velocity.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(RV.G === 6.67430e-11, "CODATA G");
assert(RV.SUN_MASS_KG === 1988400 * 1e24, "sun sheet mass");
assert(RV.EARTH_MASS_KG === 5.9722e24, "earth sheet mass");
assert(RV.JUPITER_MASS_KG === 1898.13 * 1e24, "jupiter sheet mass");
assert(RV.AU_M === 149597870700, "IAU AU");
assert(RV.DAY_S === 86400, "day");
assert(RV.HARPS_ABOUT_MS === 1, "HARPS comparison figure");
assert(RV.ESPRESSO_REQUIREMENT_MS === 0.1, "ESPRESSO requirement figure");
assert(RV.E_MAX === 0.9, "eccentricity cap");
assert(RV.PRESETS.length === 5, "five presets");

function independentK(mStarKg, mpKg, periodDays, e, inclDeg) {
  var P = periodDays * 86400;
  var total = mStarKg + mpKg;
  return Math.pow((2 * Math.PI * RV.G) / P, 1 / 3) * mpKg * Math.sin(inclDeg * Math.PI / 180) / Math.pow(total, 2 / 3) / Math.sqrt(1 - e * e);
}

function run(id) {
  return RV.model({ preset: id });
}

var jup = run("sun-jupiter");
var earth = run("sun-earth");
var peg = run("51-peg-b");
var prox = run("proxima-b");
var gj = run("gj-436-b");

assert(jup.ok && earth.ok && peg.ok && prox.ok && gj.ok, "presets solve");
assert(jup.kText === "12.47 m/s", "jupiter K " + jup.kText);
assert(jup.kCircularText === "12.46 m/s", "jupiter circular " + jup.kCircularText);
assert(near(jup.kMs, 12.5, 0.1), "jupiter K is the familiar 12.5 class, got " + jup.kMs);
assert(near(jup.kMs, independentK(RV.SUN_MASS_KG, RV.JUPITER_MASS_KG, 4332.589, 0.0487, 90), 1e-9), "jupiter formula");
assert(earth.kText === "0.0895 m/s", "earth K " + earth.kText);
assert(earth.cmText === "8.95 cm/s", "earth cm/s " + earth.cmText);
assert(near(earth.kMs, 0.09, 0.002), "earth K is the 0.09 m/s class");
assert(near(earth.kMs, independentK(RV.SUN_MASS_KG, RV.EARTH_MASS_KG, 365.256, 0.0167, 90), 1e-12), "earth formula");

/* K from the star's barycentric axis matches the mass formula. */
[jup, earth, peg, gj].forEach(function (row) {
  var fromAxis = (2 * Math.PI * row.aStarM / row.periodS) * Math.sin(row.inclDeg * Math.PI / 180) / Math.sqrt(1 - row.e * row.e);
  assert(near(fromAxis, row.kMs, 1e-9), row.name + " axis form");
});

assert(peg.kText === "55.95 m/s", "51 Peg arithmetic " + peg.kText);
assert(peg.mSinIText === "0.4659 MJup", "51 Peg m sin i " + peg.mSinIText);
assert(peg.why.indexOf("does not round to the listed central value 55.77 m/s") !== -1, "51 Peg K is not pasted");
assert(prox.kText === "1.2257 m/s", "Proxima arithmetic " + prox.kText);
assert(prox.why.indexOf("rounds to 1.226 m/s at three decimals") !== -1, "Proxima rounds, and is not averaged");
assert(prox.why.indexOf("minimum mass") !== -1, "Proxima inclination is not measured");
assert(prox.why.indexOf("90° is not a measured inclination") !== -1, "90° is labeled as a setting");
assert(gj.kText === "17.04 m/s", "GJ 436 arithmetic " + gj.kText);
assert(gj.kCircularText === "16.87 m/s", "GJ 436 circular " + gj.kCircularText);
assert(gj.why.indexOf("does not round to the listed central value 17.09 m/s") !== -1, "GJ K is not pasted");
assert(gj.why.indexOf("0.07") !== -1, "the Jupiter-mass column is named and not used");

[jup, earth, peg, prox, gj].forEach(function (row) {
  assert(row.why.indexOf("not a measured orbit and not a detection") !== -1, row.name + " disclaimer");
  assert(row.why.indexOf("6.67430") !== -1, row.name + " cites G");
  assert(row.detect.indexOf("not a detection threshold") !== -1, row.name + " instrument caveat");
  assert(row.detect.indexOf("about 1 m/s") !== -1, row.name + " HARPS figure");
  assert(row.detect.indexOf("below 10 cm/s") !== -1, row.name + " ESPRESSO requirement");
});

assert(jup.detect.indexOf("12.47 times") !== -1, "jupiter versus HARPS");
assert(jup.detect.indexOf("above 10 cm/s") !== -1, "jupiter above the ESPRESSO line");
assert(earth.detect.indexOf("under 10 cm/s") !== -1, "earth under the ESPRESSO line");
assert(earth.detect.indexOf("8.95 cm/s") !== -1, "earth centimeters in the comparison");
assert(jup.why.indexOf("1.304°") !== -1, "ecliptic inclination is not the line of sight");
assert(jup.why.indexOf("742,428.6 km") !== -1, "barycenter length stays beside this one");
assert(earth.why.indexOf("449.318 km") !== -1, "unrounded earth axis");

/* sin i. Face-on is silent. */
var face = RV.solve({
  mStar: 1, mp: 1, unit: "earth", periodDays: 365.256, e: 0.0167, inclDeg: 0, omegaDeg: 90
});
assert(face.ok && face.kMs === 0, "face-on K is 0");
var tilt = RV.solve({
  mStar: 1, mp: 1, unit: "jupiter", periodDays: 4332.589, e: 0.0487, inclDeg: 30, omegaDeg: 90
});
assert(near(tilt.kMs, jup.kMs * Math.sin(30 * Math.PI / 180), 1e-9), "K sin i");

/* Kepler's equation, including the desk's eccentricity cap. */
[0.1, 0.13827, 0.5, 0.9].forEach(function (e) {
  [0.2, 1.2, 2.5, 4.2].forEach(function (M) {
    var E = RV.eccentricFromMean(M, e);
    var wrapped = Math.atan2(Math.sin(M), Math.cos(M));
    var residual = E - e * Math.sin(E) - wrapped;
    assert(Math.abs(residual) < 1e-10, "Kepler residual e=" + e + " M=" + M + " " + residual);
  });
});

/* ω = 0: periastron is the fast peak, K(1+e); apoastron is −K(1−e). */
var ePeak = 0.5;
var peri = RV.radialVelocity(10, ePeak, 0, 0);
var apo = RV.radialVelocity(10, ePeak, 0, Math.PI);
assert(near(peri, 10 * (1 + ePeak), 1e-9), "periastron peak " + peri);
assert(near(apo, -10 * (1 - ePeak), 1e-9), "apoastron peak " + apo);

/* A circular curve with ω = 90° is −K sin M, amplitude K. */
var samples = RV.series(3, 0, 90, 1, 360);
var maxAbs = 0;
samples.forEach(function (s) {
  if (Math.abs(s.v) > maxAbs) maxAbs = Math.abs(s.v);
});
assert(near(maxAbs, 3, 1e-9), "circular amplitude " + maxAbs);
assert(near(RV.radialVelocity(3, 0, Math.PI / 2, 0), 0, 1e-12), "zero at periastron when ω = 90°");

/* The star is opposite the planet and at a(1−e) at periastron. */
var off = RV.starOffset(1000, 0.2, 0);
assert(near(off.y, 0, 1e-9), "periastron on the axis");
assert(near(Math.hypot(off.x, off.y), 1000 * 0.8, 1e-6), "star periapsis distance");

assert(!RV.solve({ mStar: 1, mp: 1, unit: "earth", periodDays: 10, e: 0.95, inclDeg: 90, omegaDeg: 0 }).ok, "e past 0.9");
assert(!RV.solve({ mStar: 0, mp: 1, unit: "earth", periodDays: 10, e: 0, inclDeg: 90, omegaDeg: 0 }).ok, "zero star mass");
assert(near(RV.logMap(RV.logUnmap(365.256, RV.P_MIN, RV.P_MAX), RV.P_MIN, RV.P_MAX), 365.256, 1e-6), "period slider round trip");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "Classroom Doppler model",
  "not a detection",
  "12.47 m/s",
  "0.0895 m/s",
  "8.95 cm/s",
  "55.95 m/s",
  "55.77",
  "1.2257 m/s",
  "1.226",
  "17.04 m/s",
  "17.09",
  "m sin i",
  "subnav-desk",
  "subnav-phone",
  "id=\"rv-canvas\"",
  "id=\"btn-play\"",
  "type=\"number\"",
  "6.67430",
  "https://physics.nist.gov/cgi-bin/cuu/Value?bg",
  "https://www.eso.org/sci/facilities/lasilla/instruments/harps/overview.html",
  "https://www.eso.org/sci/facilities/paranal/instruments/espresso/overview.html",
  "https://exoplanetarchive.ipac.caltech.edu/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
  "/science/astronomy/barycenter/",
  "/science/astronomy/exoplanets/",
  "/science/astronomy/transit/",
  "/science/astronomy/spectra/",
  "/science/astronomy/redshift/",
  "/science/astronomy/kepler/",
  "{% include nav.html %}",
  "{% include head-layout.html %}",
  "{% include footer.html %}",
  "aria-current=\"page\">Radial velocity"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/radial-velocity/") !== -1, "hub links the desk");
assert(hub.indexOf(">Radial velocity</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Radial velocity</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/radial-velocity/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Radial velocity</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/radial-velocity/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/radial-velocity/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/radial-velocity/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/radial-velocity/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["barycenter", "exoplanets"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/radial-velocity/") !== -1, name + " links here");
});

console.log("radial-velocity.test.js: ok");
console.log("Sun–Jupiter", jup.kText, "Sun–Earth", earth.kText, earth.cmText);
console.log("51 Peg", peg.kText, "Proxima", prox.kText, "GJ 436", gj.kText);
