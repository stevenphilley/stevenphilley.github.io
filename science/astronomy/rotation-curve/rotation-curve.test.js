/* Rotation-curve desk checks. The cited Sun is 8178 pc and 229.0 km/s.
   Run: node science/astronomy/rotation-curve/rotation-curve.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var RC = require("./rotation-curve.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(RC.G === 6.67430e-11, "CODATA G");
assert(RC.GM_SUN === 1.3271244e20, "IAU GM sun");
assert(RC.AU_M === 149597870700, "IAU AU");
assert(RC.JULIAN_YEAR_S === 31557600, "Julian year");
assert(RC.R0_PC === 8178, "GRAVITY 2019 R0");
assert(RC.R0_KPC === 8.178, "8178 pc is 8.178 kpc");
assert(RC.V_SUN_KMS === 229.0, "Eilers 229.0");
assert(RC.EILERS_R_KPC === 8.122, "Eilers adopted radius");
assert(near(RC.PC_M, (648000 / Math.PI) * RC.AU_M, 0), "parsec is (648000/pi) au");
assert(RC.SUN.pcText === "3.085677581491 × 10^16 m", "parsec digits " + RC.SUN.pcText);
assert(RC.SUN.msunText === "1.9884098707 × 10^30 kg", "solar mass " + RC.SUN.msunText);
assert(near(RC.MSUN_KG, RC.GM_SUN / RC.G, 0), "solar mass is GM/G");

/* Hand arithmetic for the cited Sun. Independent of the module's period helper. */
var R_M = 8178 * (648000 / Math.PI) * 149597870700;
var V_MS = 229.0 * 1000;
var periodMyr = (2 * Math.PI * R_M) / V_MS / (1e6 * 365.25 * 86400);
var massSolar = (V_MS * V_MS * R_M) / 1.3271244e20;
assert(near(periodMyr, 219.4007310751325, 1e-9), "hand period " + periodMyr);
assert(RC.formatMyr(periodMyr) === "219.401 Myr", "period rounds to 219.401");
assert(RC.SUN.periodText === "219.401 Myr", "sun period text");
assert(RC.SUN.periodRaw === "219.400731", "unrounded period " + RC.SUN.periodRaw);
assert(near(RC.SUN.periodMyr, periodMyr, 1e-9), "module period matches the hand quotient");
assert(near(massSolar, 99714193757.6452, 1e-4), "hand mass " + massSolar);
assert(RC.formatSolar(massSolar) === "9.971419 × 10^10 solar masses", "mass text");
assert(RC.SUN.massText === "9.971419 × 10^10 solar masses", "sun mass text");
assert(RC.SUN.massCoeff12 === "9.971419375765", "twelve decimals " + RC.SUN.massCoeff12);
assert(near(8.178 - 8.122, 0.056, 1e-12), "the two radii differ by 0.056 kpc");
assert(near(0.056 * 1.7, 0.0952, 1e-12), "unused slope shift");

function quad(b, d, h) {
  return Math.sqrt(b * b + d * d + h * h);
}

RC.PRESETS.forEach(function (preset) {
  var sc = RC.scene(preset);
  assert(sc.ok, preset.id);
  var sp = RC.speeds(preset, preset.r);
  assert(near(sc.total, quad(sp.bulge, sp.disk, sp.halo), 1e-9), preset.id + " quadrature");
  assert(near(sc.visible, Math.sqrt(sp.bulge * sp.bulge + sp.disk * sp.disk), 1e-9), preset.id + " visible");
  if (sc.total > 0) {
    var m = RC.massFromSpeed(sc.total, sc.r);
    assert(near(sc.mass, m, Math.abs(m) * 1e-12 + 1), preset.id + " mass from v^2 r / GM");
    var p = (2 * Math.PI * sc.r * RC.KPC_M) / (sc.total * 1000) / RC.MYR_S;
    assert(near(sc.periodMyr, p, 1e-9), preset.id + " period 2 pi r / v");
  }
  assert(sc.why.indexOf("not a fit") !== -1, preset.id + " not a fit");
  assert(sc.why.indexOf("Not a mass model") !== -1, preset.id + " disclaimer");
  assert(sc.why.indexOf("219.401 Myr") !== -1, preset.id + " cites the sun period");
});

var mw = RC.scene(RC.presetById("milky-way"));
assert(mw.totalText === "193.039 km/s", "classroom toy " + mw.totalText);
assert(mw.bulgeText === "72.317 km/s", "bulge");
assert(mw.diskText === "140.997 km/s", "disk");
assert(mw.haloText === "110.246 km/s", "halo");
assert(mw.visibleText === "158.461 km/s", "visible");
assert(mw.periodText === "260.273 Myr", "toy period");
assert(mw.massText === "7.085575 × 10^10 solar masses", "toy mass");
assert(mw.totalText !== RC.SUN.speedText, "the toy is not the cited speed");
assert(Math.abs(mw.total - 229.0) > 1, "193 does not round to 229");

var point = RC.presetById("keplerian");
assert(RC.plummerMass(point.bulgeMass, 0, 8) === 8e10, "a = 0 is the whole point mass");
var at8 = RC.speeds(point, 8);
var at16 = RC.speeds(point, 16);
assert(near(at16.total, at8.total / Math.sqrt(2), 1e-9), "point mass falls as r^-1/2");
assert(RC.scene(point).totalText === "207.387 km/s", "point mass speed");
assert(RC.scene(point).periodText === "236.993 Myr", "point mass period");
var rows = RC.series(point, 40);
var prev = rows[0].total;
var i;
for (i = 1; i < rows.length; i++) {
  assert(rows[i].total < prev, "keplerian series declines");
  prev = rows[i].total;
}

var disk = RC.presetById("disk");
var x = 8 / 3;
var diskM = 6e10 * (1 - Math.exp(-x) * (1 + x));
assert(near(RC.diskMass(6e10, 3, 8), diskM, 1), "exponential enclosed mass");
assert(RC.scene(disk).totalText === "155.044 km/s", "disk speed");
assert(RC.scene(disk).bulgeText === "off", "disk preset bulge off");

var halo = RC.presetById("halo");
var f = 1 - (2 / 10) * Math.atan(10 / 2);
assert(near(RC.haloFraction(2, 10), f, 1e-15), "pseudo-isothermal fraction");
assert(near(RC.speeds(halo, 10).total, 220 * Math.sqrt(f), 1e-9), "halo speed");
assert(RC.scene(halo).totalText === "187.365 km/s", "halo text");
var haloRows = RC.series(halo, 30);
for (i = 1; i < haloRows.length; i++) {
  assert(haloRows[i].halo + 1e-9 >= haloRows[i - 1].halo, "halo rises");
  assert(haloRows[i].halo < 220, "halo stays under v infinity");
}

assert(!RC.scene({ r: "nope", bulgeMass: "nope" }).ok, "rejects a non-numeric radius");
var off = RC.scene({
  r: 8,
  bulgeOn: false,
  diskOn: false,
  haloOn: false,
  bulgeMass: 1e10,
  diskMass: 1e10,
  haloV: 200
});
assert(off.ok && off.total === 0 && off.periodText === "—", "all off is a dash");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function has(bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
}
[
  mw.why.replace("<", "&lt;"),
  "219.401 Myr",
  "219.400731",
  "9.971419 × 10^10 solar masses",
  "9.971419375765",
  "3.085677581491",
  "1.9884098707",
  "1.3271244",
  "6.67430",
  "8178",
  "8.122",
  "229.0 km/s",
  "193.039 km/s",
  "260.273 Myr",
  "207.387 km/s",
  "236.993 Myr",
  "155.044 km/s",
  "317.001 Myr",
  "187.365 km/s",
  "327.898 Myr",
  "7.085575",
  "0.0952",
  "8275",
  "1.85",
  "not a mass model",
  "not a fit",
  "classroom",
  "MOND",
  "does not draw",
  "subnav-desk",
  "subnav-phone",
  "id=\"rotation-canvas\"",
  "id=\"radius\"",
  "id=\"radius-num\"",
  "Sections · Rotation curves",
  "/science/astronomy/galaxy/",
  "/science/astronomy/radial-velocity/",
  "/science/astronomy/barycenter/",
  "https://physics.nist.gov/cgi-bin/cuu/Value?bg",
  "https://www.aanda.org/articles/aa/full_html/2019/05/aa35656-19/aa35656-19.html",
  "https://ui.adsabs.harvard.edu/abs/2019ApJ...871..120E/abstract",
  "https://ui.adsabs.harvard.edu/abs/1970ApJ...159..379R/abstract",
  "https://ui.adsabs.harvard.edu/abs/1983ApJ...270..365M/abstract",
  "{% include nav.html %}",
  "{% include head-layout.html %}",
  "{% include footer.html %}"
].forEach(has);
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf('aria-current="page">Rotation curves') !== -1, "this page is current");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/rotation-curve/") !== -1, "hub links the desk");
assert(hub.indexOf(">Rotation curves</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Rotation curves</h3>") !== -1, "hub card");
assert(hub.indexOf("219.401 Myr") !== -1, "hub intro states the period");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/rotation-curve/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Rotation curves</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/rotation-curve/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/rotation-curve/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/rotation-curve/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/rotation-curve/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["galaxy", "radial-velocity"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/rotation-curve/") !== -1, name + " links back");
});

console.log("rotation-curve.test.js: ok");
console.log("Cited Sun", RC.SUN.periodText, RC.SUN.periodRaw, RC.SUN.massText);
console.log("Classroom toy", mw.totalText, mw.periodText, mw.massText);
