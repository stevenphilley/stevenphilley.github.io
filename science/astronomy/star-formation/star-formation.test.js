/* Star-formation checks. Uniform-sphere Jeans mass.
   At 10 K, n = 10^4 cm^-3, and μ = 2.33 the mass is a few solar masses.
   Run: node science/astronomy/star-formation/star-formation.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var SF = require("./star-formation.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(SF.K === 1.380649e-23, "exact k");
assert(SF.G === 6.67430e-11, "2022 CODATA G");
assert(SF.M_P === 1.67262192595e-27, "proton mass");
assert(SF.M_E === 9.1093837139e-31, "electron mass");
assert(SF.M_H === SF.M_P + SF.M_E, "m_H is the proton plus the electron");
assert(SF.GM_SUN === 1.3271244e20, "IAU GM sun");
assert(near(SF.M_SUN, SF.GM_SUN / SF.G, 0), "solar mass is GM/G");
assert(SF.AU_M === 149597870700, "IAU au");
assert(near(SF.PC_M, (648000 / Math.PI) * SF.AU_M, 0), "parsec");
assert(SF.YEAR_S === 31557600, "Julian year");
assert(SF.NOTES_MASS === 29 && SF.NOTES_RADIUS_PC === 0.3, "Toronto printed coefficients");
assert(SF.N_MIN === 1 && SF.N_MAX === 1e7, "density slider");
assert(SF.T_MIN === 3 && SF.T_MAX === 30000, "temperature slider");
assert(near(SF.LENGTH_RATIO, Math.sqrt(15) / (2 * Math.PI), 0), "length ratio");
assert((SF.M_SUN / 1e30).toFixed(10) === "1.9884098707", "solar mass digits");
assert((SF.PC_M / 1e16).toFixed(12) === "3.085677581491", "parsec digits");
assert((SF.M_H / 1e-27).toFixed(11) === "1.67353286432", "hydrogen mass digits");

/* Hand arithmetic. Independent of the module's helpers. */
var mH = 1.67262192595e-27 + 9.1093837139e-31;
var G = 6.67430e-11;
var k = 1.380649e-23;
var rho = 10000 * 1e6 * 2.33 * mH;
var thermal = (5 * k * 10) / (G * 2.33 * mH);
var massKg = Math.pow(thermal, 1.5) * Math.sqrt(3 / (4 * Math.PI * rho));
var radiusM = Math.sqrt((15 * k * 10) / (4 * Math.PI * G * 2.33 * mH * rho));
var tS = Math.sqrt((3 * Math.PI) / (32 * G * rho));
var solar = massKg / (1.3271244e20 / G);
var years = tS / 31557600;
assert(near(solar, 5.375771460534531, 1e-9), "hand mass " + solar);
assert(solar > 1 && solar < 20, "a few solar masses");
var fromMass = Math.pow((3 * massKg) / (4 * Math.PI * rho), 1 / 3);
assert(near(radiusM, fromMass, fromMass * 1e-12), "radius is the sphere that holds the mass");
assert(near(SF.jeansMassKg(10, 10000, 2.33), massKg, massKg * 1e-12), "module mass");
assert(near(SF.jeansLengthM(10, 10000, 2.33), radiusM, radiusM * 1e-12), "module length");
assert(near(SF.freeFallS(10000, 2.33), tS, tS * 1e-12), "module free-fall");
assert(near(SF.scene({ T: 10, n: 10000, mu: 2.33 }).years, SF.scene({ T: 100, n: 10000, mu: 2.33 }).years, 1e-9), "free-fall ignores temperature");
assert(near(SF.jeansLengthM(10, 10000, 2.33) / SF.waveLengthM(10, 10000, 2.33), SF.LENGTH_RATIO, 1e-12), "ratio");

var core = SF.scene({ T: 10, n: 10000, mu: 2.33 });
assert(core.ok && core.id === "core", "dense core matches the button");
assert(core.massText === "5.37577 solar masses", "core mass text " + core.massText);
assert(core.lengthText === "0.130599 pc", "core length " + core.lengthText);
assert(core.timeText === "337.100 thousand years", "core time " + core.timeText);
assert(core.timeRaw === "337099.930", "unrounded years " + core.timeRaw);
assert(core.waveText === "0.211872 pc", "wave length");
assert(core.ratioText === "0.616404", "ratio text");
assert(near(core.years, years, 1e-6), "scene years");
assert(core.why.indexOf("does not substitute") !== -1, "wavelength stays out");
assert(core.why.indexOf("not a simulation of a cloud") !== -1, "disclaimer");
assert(core.why.indexOf("Not a named cloud") !== -1, "not a named cloud");
assert(core.why.indexOf("few solar masses") !== -1, "order of magnitude in the sentence");

var twiceN = SF.scene({ T: 10, n: 20000, mu: 2.33 });
assert(near(twiceN.solar, core.solar / Math.sqrt(2), core.solar * 1e-12), "double n divides mass by sqrt(2)");
assert(near(twiceN.pc, core.pc / Math.sqrt(2), core.pc * 1e-12), "double n divides length by sqrt(2)");
assert(near(twiceN.years, core.years / Math.sqrt(2), core.years * 1e-12), "double n divides free-fall by sqrt(2)");
var hot = SF.scene({ T: 1000, n: 10000, mu: 2.33 });
assert(near(hot.solar / core.solar, Math.pow(100, 1.5), 1e-9), "mass scales as T^3/2");
var heavy = SF.scene({ T: 10, n: 10000, mu: 4.66 });
assert(near(core.solar / heavy.solar, 4, 1e-9), "mass scales as mu^-2");
var hundred = SF.scene({ T: 10, n: 1000000, mu: 2.33 });
assert(near(core.solar / hundred.solar, 10, 1e-9), "n times 100 divides mass by 10");

var list = SF.presets();
assert(list.length === 4, "four presets");
["atomic", "gmc", "core", "hii"].forEach(function (id, i) {
  assert(list[i].id === id, "order " + id);
  var sc = SF.scene(list[i]);
  assert(sc.ok && sc.id === id, id + " scene");
  assert(sc.why.indexOf("Typical textbook values") !== -1, id + " textbook");
  assert(sc.why.indexOf("Not a named cloud") !== -1, id + " unnamed");
  assert(sc.why.indexOf("not a simulation of a cloud") !== -1, id + " disclaimer");
});
assert(SF.scene(SF.presetById("atomic")).massText === "1.72690 \u00d7 10^4 solar masses", "atomic mass");
assert(SF.scene(SF.presetById("gmc")).massText === "53.7577 solar masses", "gmc mass");
assert(SF.scene(SF.presetById("gmc")).lengthText === "1.30599 pc", "gmc length");
assert(SF.scene(SF.presetById("gmc")).timeText === "3.37100 million years", "gmc time");
assert(near(SF.scene(SF.presetById("gmc")).solar / core.solar, 10, 1e-12), "gmc is ten times the core");
assert(SF.scene(SF.presetById("hii")).massText === "2.56360 \u00d7 10^7 solar masses", "hii mass");
assert(SF.scene(SF.presetById("hii")).solar > 1e6, "warm gas is not a stellar mass");
assert(SF.scene(SF.presetById("atomic")).timeText === "14.2713 million years", "atomic time");
assert(SF.scene(SF.presetById("hii")).timeText === "6.64295 million years", "hii time");

var ref = SF.reference();
assert(ref.massText === "29.1845 solar masses", "mu = 1 mass " + ref.massText);
assert(ref.lengthText === "0.304295 pc", "mu = 1 length " + ref.lengthText);
assert(Math.round(ref.solar) === SF.NOTES_MASS, "29.1845 rounds to 29");
assert(ref.pc.toFixed(2) === "0.30", "0.304295 rounds to 0.30");
assert(!SF.scene({ T: 0, n: 10000, mu: 2.33 }).ok, "rejects zero temperature");
assert(!SF.scene({ T: 10, n: "nope", mu: 2.33 }).ok, "rejects a non-numeric density");

var rows = SF.series(10, 2.33, 40);
assert(rows.length === 41, "series samples");
assert(rows[0].n === SF.N_MIN && rows[rows.length - 1].n === SF.N_MAX, "series spans the slider");
var i;
for (i = 1; i < rows.length; i++) {
  assert(rows[i].solar < rows[i - 1].solar, "mass falls as density rises");
}
var slope = Math.log(rows[rows.length - 1].solar / rows[0].solar) / Math.log(rows[rows.length - 1].n / rows[0].n);
assert(near(slope, -0.5, 1e-9), "log-log slope is -1/2 " + slope);
assert(SF.sliderPos(SF.N_MIN, SF.N_MIN, SF.N_MAX, true) === 0, "slider start");
assert(SF.sliderPos(SF.N_MAX, SF.N_MIN, SF.N_MAX, true) === SF.SLIDER_STEPS, "slider end");
assert(near(SF.valueFromSlider(0, SF.T_MIN, SF.T_MAX, true), SF.T_MIN, 1e-9), "temperature min");
assert(SF.clamp(0.1, SF.MU_MIN, SF.MU_MAX) === SF.MU_MIN, "mu stops");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function has(bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
}
[
  core.why,
  "5.37577 solar masses",
  "0.130599 pc",
  "337.100 thousand years",
  "337099.930",
  "29.1845 solar masses",
  "0.304295 pc",
  "1.72690 \u00d7 10^4 solar masses",
  "53.7577 solar masses",
  "2.56360 \u00d7 10^7 solar masses",
  "14.2713 million years",
  "3.37100 million years",
  "6.64295 million years",
  "0.616404",
  "1.67353286432",
  "1.9884098707",
  "3.085677581491",
  "6.67430",
  "1.380649",
  "1.67262192595",
  "9.1093837139",
  "1.3271244",
  "not a simulation of a cloud",
  "not a named cloud",
  "does not substitute",
  "typical textbook",
  "subnav-desk",
  "subnav-phone",
  "id=\"sf-canvas\"",
  "id=\"density\"",
  "id=\"density-num\"",
  "id=\"temp\"",
  "id=\"mu\"",
  "Sections \u00b7 Star formation",
  "/science/astronomy/stellar-lifetime/",
  "/science/astronomy/hr/",
  "/science/astronomy/nearest-stars/",
  "https://physics.nist.gov/cgi-bin/cuu/Value?bg",
  "https://physics.nist.gov/cgi-bin/cuu/Value?k",
  "https://physics.nist.gov/cgi-bin/cuu/Value?mp",
  "https://physics.nist.gov/cgi-bin/cuu/Value?me",
  "https://www.ruf.rice.edu/~baring/astr350/astr350_2021_lec_1028.pdf",
  "https://www.astro.utoronto.ca/~mhvk/AST1410/ast320notes.pdf",
  "https://www.sfu.ca/~boal/390lecs/390lec25.pdf",
  "https://science.nasa.gov/universe/stars/",
  "{% include nav.html %}",
  "{% include head-layout.html %}",
  "{% include footer.html %}"
].forEach(has);
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf('aria-current="page">Star formation') !== -1, "this page is current");
assert(html.indexOf('type="number"') !== -1, "number fields");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/star-formation/") !== -1, "hub links the desk");
assert(hub.indexOf(">Star formation</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Star formation</h3>") !== -1, "hub card");
assert(hub.indexOf("5.37577 solar masses") !== -1, "hub intro states the mass");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/star-formation/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Star formation</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/star-formation/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/star-formation/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/star-formation/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/star-formation/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["stellar-lifetime", "hr", "nearest-stars"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/star-formation/") !== -1, name + " links back");
});

console.log("star-formation.test.js: ok");
console.log("Dense core", core.massText, core.lengthText, core.timeText);
console.log("mu = 1", ref.massText, ref.lengthText);
