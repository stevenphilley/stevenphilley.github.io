/* CMB checks: Wien peaks, photon density, energy density, redshift, dipole.
   Run: node science/astronomy/cmb/cmb.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var M = require("./cmb.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(M.H === 6.62607015e-34, "h");
assert(M.C === 299792458, "c");
assert(M.K === 1.380649e-23, "k");
assert(M.T0 === 2.72548, "Fixsen T0");
assert(M.T0_ERR === 0.00057, "Fixsen uncertainty");
assert(M.Z_STAR === 1089.92 && M.Z_STAR_ERR === 0.25, "Planck z*");
assert(M.DIPOLE_UK === 3362.08 && M.DIPOLE_UK_ERR === 0.99, "Planck dipole");

var xL = M.wienXLambda();
assert(near((5 - xL) * Math.exp(xL), 5, 1e-9), "wavelength root " + xL);
assert(near(xL, 4.965114231744276, 1e-12), "wavelength root digits");

var xF = M.wienXFreq();
assert(near((3 - xF) * Math.exp(xF), 3, 1e-9), "frequency root " + xF);
assert(near(xF, 2.8214393721220787, 1e-12), "frequency root digits");

var b = M.wienB();
assert(near(b, 2.897771955e-3, 5e-13), "Wien b " + b);
assert(near(M.freqPerKelvin() / 1e9, 58.789, 0.001), "GHz per kelvin " + M.freqPerKelvin());
assert(near(M.zeta3(), 1.202056903159594, 1e-12), "zeta(3) " + M.zeta3());
assert(near(M.sigma() / 5.670374419e-8, 1, 1e-9), "sigma");
assert(near(M.radiationA() / 7.5657e-16, 1, 1e-5), "radiation constant " + M.radiationA());
assert(M.formatSci(M.radiationA(), 4) === "7.5657 × 10⁻¹⁶", "formatted a " + M.formatSci(M.radiationA(), 4));

var today = M.evaluate(M.T0);
assert(near(today.lambdaM * 1e3, 1.063, 0.001), "peak mm " + today.lambdaM);
assert(M.formatLength(today.lambdaM) === "1.0632 mm", "formatted mm " + M.formatLength(today.lambdaM));
assert(near(today.freqHz / 1e9, 160.2, 0.05), "peak GHz " + today.freqHz);
assert(M.formatFreq(today.freqHz) === "160.229 GHz", "formatted GHz " + M.formatFreq(today.freqHz));
assert(near(today.photonM3 / 1e6, 411, 1), "photons per cm3 " + today.photonM3 / 1e6);
assert(M.formatPerCm3(today.photonM3) === "410.7", "formatted n " + M.formatPerCm3(today.photonM3));
assert(M.formatPerCm3(M.photonDensityM3(M.temperatureAtZ(M.Z_STAR))).indexOf("× 10") !== -1, "large n uses scientific notation");
assert(today.lambdaBand === "microwave" && today.freqBand === "microwave", "T0 bands");
assert(today.lambdaFreqHz > today.freqHz, "c/lambda is not the Bν peak");
assert(M.formatFreq(M.freqPerKelvin()) === "58.789 GHz", "formatted ν/T");
assert(M.formatTemp(M.T0) === "2.72548 K", "formatted T0");

var nu = today.freqHz;
var mid = M.planckNu(nu, M.T0);
var left = M.planckNu(nu * 0.995, M.T0);
var right = M.planckNu(nu * 1.005, M.T0);
assert(mid > left && mid > right, "Bν peaks at the frequency root");
assert(M.planckNu(0, M.T0) !== M.planckNu(0, M.T0), "nu 0 is NaN");
assert(M.planckNu(nu, 0) !== M.planckNu(nu, 0), "T 0 is NaN");

[0, 1, 6, M.Z_STAR].forEach(function (z) {
  var T = M.temperatureAtZ(z);
  assert(near(T, M.T0 * (1 + z), 1e-9), "T(z) " + z);
  assert(near(M.redshiftAtT(T), z, 1e-9), "round trip z " + z);
});
assert(M.formatTemp(M.temperatureAtZ(1)) === "5.45096 K", "z=1 temperature");
assert(M.formatTemp(M.temperatureAtZ(6)) === "19.07836 K", "z=6 temperature");
assert(M.formatTemp(M.temperatureAtZ(M.Z_STAR)) === "2973.28 K", "last-scattering temperature");
var last = M.evaluate(M.temperatureAtZ(M.Z_STAR));
assert(last.lambdaBand === "infrared", "last scattering wavelength band " + last.lambdaBand + " " + last.lambdaM);
assert(last.freqBand === "infrared", "last scattering frequency band");
assert(last.lambdaM < 700e-9 * 2 && last.lambdaM > 700e-9, "near the visible edge");

var v = M.planckDipoleSpeed();
assert(near(v / 1000, 369.82, 0.01), "dipole speed km/s " + v / 1000);
assert(M.formatSpeedKms(v) === "369.82 km/s", "formatted speed");
var dT = M.dipoleDeltaT(v);
assert(near(dT * 1e6, 3362.08, 1e-6), "dipole round trip µK " + dT * 1e6);
assert(M.formatMicroK(dT) === "3362.08 µK", "formatted dipole");
assert(near(dT / M.T0, v / M.C, 1e-15), "ΔT/T = v/c");

var list = M.presets();
assert(list.length === 4, "four presets");
assert(list[0].z === 0 && list[1].z === 1 && list[2].z === 6 && list[3].z === M.Z_STAR, "preset redshifts");
assert(M.tOk(M.T0) && !M.tOk(0.1) && !M.tOk(20000), "T range");
assert(M.zOk(0) && M.zOk(M.Z_STAR) && !M.zOk(-0.1), "z range");
assert(M.vOkKms(369.82) && !M.vOkKms(-1) && !M.vOkKms(1001), "v range");
assert(near(M.zFromUnit(M.zToUnit(6)), 6, 1e-9), "z slider round trip");
assert(near(M.logMap(M.logUnmap(M.T0, M.T_MIN, M.T_MAX), M.T_MIN, M.T_MAX), M.T0, 1e-9), "T slider round trip");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "GA lives in the nav include, not a second snippet");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf('class="subnav subnav-desk"') !== -1, "desktop nav");
assert(html.indexOf('class="subnav-phone"') !== -1, "phone nav");
assert(html.indexOf('aria-current="page"') !== -1, "current page");
assert(html.indexOf("/science/astronomy/cmb/") !== -1, "canonical path is in the page");
assert(html.indexOf(M.formatLength(today.lambdaM)) !== -1, "page states the wavelength peak");
assert(html.indexOf(M.formatFreq(today.freqHz)) !== -1, "page states the frequency peak");
assert(html.indexOf(M.formatPerCm3(today.photonM3)) !== -1, "page states the photon density");
assert(html.indexOf("3362.08") !== -1, "page states the dipole amplitude");
assert(html.indexOf("2.72548") !== -1, "page states T0");
assert(html.indexOf("1089.92") !== -1, "page states z*");
assert(html.indexOf("ideal blackbody") !== -1 || html.indexOf("Ideal blackbody") !== -1, "ideal scaling is named");
assert(html.indexOf("1 part in 10") !== -1, "anisotropy level is stated");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/cmb/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>CMB</h3>") !== -1, "hub card");

["blackbody", "redshift", "cosmology"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/cmb/") !== -1, name + " links here");
});

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/cmb/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/cmb/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/cmb/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/cmb/") found = true;
  });
});
assert(found, "whats-new lists the desk");

console.log("cmb.test.js: ok");
console.log("T0", M.formatTemp(M.T0), M.formatLength(today.lambdaM), M.formatFreq(today.freqHz), M.formatPerCm3(today.photonM3) + " /cm³");
console.log("a", M.formatSci(M.radiationA(), 4), "u", M.formatSci(today.energy, 4));
console.log("v", M.formatSpeedKms(v), "z*", M.formatTemp(M.temperatureAtZ(M.Z_STAR)), M.formatLength(last.lambdaM), M.formatFreq(last.freqHz));
