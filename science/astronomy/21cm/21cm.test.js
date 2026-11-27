/* 21-cm hydrogen line checks.
   Run: node science/astronomy/21cm/21cm.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var H = require("./21cm.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(H.F_MHZ === 1420.405751768, "Hellwig frequency");
assert(H.C_M === 299792458, "exact c");
assert(H.H_PLANCK === 6.62607015e-34, "exact h");
assert(H.K_B === 1.380649e-23, "exact k");
assert(H.Q_E === 1.602176634e-19, "exact e");
assert(H.A10 === 2.85e-15, "approximate A10");
assert(H.YEAR_S === 31557600, "Julian year");
assert(H.N_FACTOR === 1.823e18, "thin-gas factor");
assert(near(H.GAUSS, Math.sqrt(Math.PI / (4 * Math.LN2)), 0), "gaussian factor");
assert(H.formatIntegral(H.GAUSS) === "1.064", "six-digit factor is not the three-digit integral format");
assert(H.Z_MIN === 0 && H.Z_MAX === 20, "redshift slider");
assert(H.V_ANDROMEDA === -300, "Andromeda velocity");
assert(H.Z_VIRGO === 0.004, "round Virgo redshift");
assert(H.Z_RE === 7.67, "Planck z_re central value");
assert(H.Z_DAWN === 17, "Cosmic Dawn mark");
assert(H.EDGES_MHZ === 78, "reported EDGES center");
assert(H.FM_LO === 88 && H.FM_HI === 108, "FM band");
assert(H.PRESETS.length === 5, "five presets");

var rest = H.rest();
assert(near(rest.cm, H.C_M / (H.F_MHZ * 1e6) * 100, 1e-9), "wavelength is c/f");
assert(H.formatCm(rest.cm) === "21.106114", "printed wavelength " + H.formatCm(rest.cm));
assert(H.formatUeV(rest.uEv) === "5.87433", "printed energy " + H.formatUeV(rest.uEv));
assert(H.formatKelvin(rest.kelvin) === "0.068169", "printed temperature " + H.formatKelvin(rest.kelvin));
assert(H.formatMHz(rest.mhz) === "1,420.406", "z = 0 prints 1,420.406");
assert(H.formatSci(rest.lifeS, 5) === "3.50877×10^14", "lifetime seconds");
assert(H.formatSci(rest.lifeYr, 5) === "1.11186×10^7", "lifetime years");
assert(near(rest.lifeYr, 1.1e7, 0.02e7), "about 1.1e7 years");
assert(near(rest.lifeS, 1 / H.A10, 0), "lifetime is 1/A");

var z17 = H.observeZ(17);
assert(near(z17.mhz, H.F_MHZ / 18, 1e-12), "z = 17 divides by 18");
assert(H.formatMHz(z17.mhz) === "78.911", "z = 17 prints 78.911 " + H.formatMHz(z17.mhz));
assert(near(z17.cm, rest.cm * 18, 1e-9), "wavelength stretches with 1+z");

var one = H.observeV(1);
assert(near(one.radio, H.F_MHZ * (1 - 1 / H.C_KM), 1e-12), "radio convention");
assert(H.formatMHz(one.radio) === "1,420.401", "1 km/s prints 1,420.401");
assert(H.formatKHz(H.kHzPerKms()) === "4.738", "4.738 kHz per km/s");
assert(near(H.shiftKHz(1), H.kHzPerKms(), 1e-9), "1 km/s shift is the scale");

var and = H.observeV(-300);
assert(and.radio > H.F_MHZ, "approach is a blueshift");
assert(H.formatMHz(and.radio) === "1,421.827", "Andromeda radio MHz");
assert(H.formatMHz4(and.radio) === "1,421.8271", "radio at 4 decimals");
assert(H.formatMHz4(and.optical) === "1,421.8286", "optical at 4 decimals");
assert(H.formatMHz4(and.relativistic) === "1,421.8279", "relativistic at 4 decimals");
assert(H.formatMHz4(and.radio) !== H.formatMHz4(and.optical), "conventions are not substituted");
assert(H.formatMHz4(H.observeZ(-0.001).mhz) === "1,421.8276", "z = -0.001 is a different frequency");

var edgesZ = H.zAtMHz(78);
assert(H.formatZ(edgesZ) === "17.2103", "78 MHz is z = 17.2103 " + H.formatZ(edgesZ));
assert(Math.abs(edgesZ - 17) > 0.2, "z = 17 is not the 78 MHz center");

var virgo = H.observeZ(0.004);
assert(H.formatMHz(virgo.mhz) === "1,414.747", "Virgo frequency");
assert(H.formatV(0.004 * H.C_KM) === "1,199.17", "c times 0.004");
assert(H.formatZ(1050 / H.C_KM) !== "0.004", "1050 km/s is not z = 0.004");

assert(H.formatMHz(H.observeZ(6).mhz) === "202.915", "z = 6");
assert(H.formatMHz(H.observeZ(10).mhz) === "129.128", "z = 10");
assert(H.formatMHz(H.observeZ(7.67).mhz) === "163.830", "z_re frequency");

var col = H.column(100, 10);
assert(near(col.integral, H.GAUSS * 100 * 10, 1e-9), "gaussian integral");
assert(near(col.nHi, 1.823e18 * col.integral, 1e-3), "thin-gas column");
assert(H.formatSci(col.nHi, 5) === "1.94052×10^21", "printed column");
assert(H.formatIntegral(col.integral) === "1,064.467", "printed integral");

var samples = H.chartSamples(41);
assert(samples.length === 41, "chart samples");
assert(samples[0].z === 0 && samples[samples.length - 1].z === 20, "chart ends");
var i;
for (i = 1; i < samples.length; i++) {
  assert(samples[i].mhz < samples[i - 1].mhz, "frequency falls with redshift");
}
assert(H.zAtMHz(108) > 12 && H.zAtMHz(88) < 16, "FM band sits between reionization and z = 17");
assert(H.zAtMHz(108) < H.EOR_HI === false || H.zAtMHz(108) > H.EOR_HI, "FM is past z = 10");

assert(H.matchedPreset("z", 0, 0).id === "milky-way", "milky way");
assert(H.matchedPreset("v", 0, -300).id === "andromeda", "andromeda");
assert(H.matchedPreset("z", 0.004, 0).id === "virgo", "virgo");
assert(H.matchedPreset("z", 7.67, 0).id === "eor", "reionization");
assert(H.matchedPreset("z", 17, 0).id === "dawn", "dawn");
assert(!H.matchedPreset("z", 1, 0), "z = 1 is not a preset");
assert(!H.zOk(-0.001) && H.zOk(0) && H.zOk(20) && !H.zOk(20.1), "redshift range");
assert(!H.vOk(-1001) && H.vOk(-300) && H.vOk(5000) && !H.vOk(5001), "velocity range");
assert(H.why(H.opening()).indexOf("1,420.406") !== -1, "opening names the rounded frequency");
assert(H.why(H.opening()).indexOf("Not a survey.") !== -1, "survey refused");
assert(H.why({ mode: "z", z: 17, v: 0, tPeak: 100, fwhm: 10 }).indexOf("78.911") !== -1, "dawn explanation");
assert(H.why({ mode: "z", z: 17, v: 0, tPeak: 100, fwhm: 10 }).indexOf("dispute") !== -1, "EDGES stays disputed");
assert(H.why({ mode: "v", z: 0, v: -300, tPeak: 100, fwhm: 10 }).indexOf("not substituted") !== -1, "velocity conventions stay apart");
assert(H.limitsNote().indexOf("Educational calculator") !== -1, "disclaimer");
assert(H.limitsNote().indexOf("not a detection claim") !== -1, "no detection claim");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "GA lives in the nav include");
assert(html.indexOf("googletagmanager") === -1, "no second snippet");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("---\n---\n<!DOCTYPE html>") === 0, "front matter so GitHub Pages processes the includes");
assert(html.indexOf('class="subnav subnav-desk"') !== -1, "desktop nav");
assert(html.indexOf('class="subnav-phone"') !== -1, "phone nav");
assert(html.indexOf('aria-current="page">21 cm') !== -1, "current page");
assert(html.indexOf("/science/astronomy/21cm/") !== -1, "canonical path");
assert(html.indexOf("1420.405751768") !== -1, "page states the unrounded frequency");
assert(html.indexOf("1420.406") !== -1, "page states the rounded megahertz");
assert(html.indexOf("78.911") !== -1, "page states z = 17");
assert(html.indexOf("78.91") !== -1, "page states the two-decimal dawn frequency");
assert(html.indexOf("21.106114") !== -1, "page states the wavelength");
assert(html.indexOf("5.87433") !== -1, "page states the photon energy");
assert(html.indexOf("0.068169") !== -1, "page states hν/k");
assert(html.indexOf("0.0682") !== -1, "page states the rounded temperature");
assert(html.indexOf("4.738") !== -1, "page states the km/s shift");
assert(html.indexOf("1.823") !== -1, "page states the column factor");
assert(html.indexOf("1.064467") !== -1, "page states the gaussian factor");
assert(html.indexOf("1.11186") !== -1, "page states the lifetime");
assert(html.indexOf(H.limitsNote()) !== -1, "disclaimer on the page");
assert(html.indexOf(H.why(H.opening())) !== -1, "opening explanation on the page");
assert(html.indexOf('id="freq"') !== -1, "frequency chart");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1, "help control");
assert(html.indexOf('data-preset="milky-way"') !== -1, "milky way preset");
assert(html.indexOf('data-preset="dawn"') !== -1, "dawn preset");
assert(html.indexOf('data-preset="andromeda"') !== -1, "andromeda preset");
assert(html.indexOf("https://doi.org/10.1109/tim.1970.4313902") !== -1, "Hellwig 1970");
assert(html.indexOf("/science/astronomy/rotation-curve/") !== -1, "rotation-curve link");
assert(html.indexOf("/science/astronomy/redshift/") !== -1, "redshift link");
assert(html.indexOf("/science/astronomy/spectra/") !== -1, "spectra link");
assert(html.indexOf("/science/astronomy/cmb/") !== -1, "cmb link");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/21cm/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>21 cm</h3>") !== -1, "hub card");

["redshift", "spectra", "rotation-curve", "cmb"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/21cm/") !== -1, name + " links here");
});

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/21cm/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/21cm/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/21cm/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/21cm/") found = true;
  });
});
assert(found, "whats-new lists the desk");

var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/21cm/") !== -1, "science index links the desk");

console.log("21cm.test.js: ok");
console.log("z = 0", H.formatMHz(rest.mhz), "MHz", H.formatCm(rest.cm), "cm", H.formatUeV(rest.uEv), "µeV", H.formatKelvin(rest.kelvin), "K");
console.log("z = 17", H.formatMHz(z17.mhz), "MHz");
console.log("1 km/s", H.formatMHz(one.radio), "MHz", H.formatKHz(H.kHzPerKms()), "kHz");
console.log("column 100 K × 10 km/s", H.formatSci(col.nHi, 5), "cm^-2");
