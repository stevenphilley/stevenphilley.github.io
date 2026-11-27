/* Seeing and adaptive-optics checks.
   r0 ∝ λ^(6/5) (sec z)^(−3/5), seeing 0.98 λ/r0, Rayleigh 1.22 λ/D,
   τ0 = 0.314 r0/v, θ0 = 0.314 cos(z) r0/h̄.
   Run: node science/astronomy/seeing/seeing.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./seeing.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(S.REF_NM === 500, "reference wavelength");
assert(S.SEEING_FACTOR === 0.98, "seeing factor is the 0.98 rounding");
assert(S.RAYLEIGH_FACTOR === 1.22, "Rayleigh factor");
assert(S.TIME_FACTOR === 0.314, "coherence-time factor");
assert(S.ISO_FACTOR === 0.314, "isoplanatic factor");
assert(near(S.ARCSEC_PER_RAD, (180 / Math.PI) * 3600, 0), "arcseconds per radian");

/* Bessel J1, shared construction with the telescope desk. */
assert(S.besselJ1(0) === 0, "J1(0)");
assert(near(S.besselJ1(1), 0.4400505857449335, 1e-12), "J1(1)");
assert(near(S.J1_ZERO, 3.83170597, 1e-6), "first zero " + S.J1_ZERO);
assert(near(S.RAYLEIGH_EXACT, 1.21966989, 1e-6), "zero/π");
assert(S.RAYLEIGH_EXACT < 1.22 && S.RAYLEIGH_EXACT > 1.219, "1.22 rounds the exact factor");

var ray550 = S.rayleighArcsec(20, 550);
assert(near(ray550, 1.22 * 550e-9 / 0.2 * S.ARCSEC_PER_RAD, 0), "20 cm Rayleigh");
assert(S.formatArcsec(ray550) === "0.692″", "20 cm at 550 nm prints 0.692″ " + S.formatArcsec(ray550));
assert(S.airyIntensity(0, 550, 20) === 1, "Airy peak");
assert(S.airyIntensity(ray550 / S.ARCSEC_PER_RAD, 550, 20) < 1e-4, "dark ring at 1.22 λ/D");

/* r0 = 10 cm at 500 nm, zenith. Seeing FWHM = 0.98 λ/r0. */
var ref = S.solve({
  r0Cm: 10,
  zenithDeg: 0,
  lambdaNm: 500,
  dCm: 20,
  windMs: 10,
  heightM: 5000
});
assert(ref && ref.ok, "reference solves");
assert(ref.airmass === 1, "zenith airmass");
assert(ref.r0m === 0.1, "r0 stays 10 cm at the reference");
var expectSeeing = 0.98 * 500e-9 / 0.1 * S.ARCSEC_PER_RAD;
assert(near(ref.seeingArcsec, expectSeeing, 1e-12), "seeing arithmetic");
assert(S.formatArcsec(ref.seeingArcsec) === "1.011″", "10 cm at 500 nm prints 1.011″ " + S.formatArcsec(ref.seeingArcsec));
assert(ref.seeingLimited === true, "20 cm is wider than 10 cm");
assert(ref.dominant === "seeing", "seeing is the larger angle");
assert(near(ref.effectiveArcsec, ref.seeingArcsec, 0), "effective is the larger angle");

/* Wavelength: r0 ∝ λ^(6/5), seeing ∝ λ^(−1/5). K is 2.2 µm. */
var k = S.solve({
  r0Cm: 10,
  zenithDeg: 0,
  lambdaNm: 2200,
  dCm: 800,
  windMs: 10,
  heightM: 5000
});
assert(near(k.r0m / 0.1, Math.pow(2200 / 500, 6 / 5), 1e-12), "K-band r0 exponent");
assert(S.formatCm(k.r0HereCm) === "59.18 cm", "K-band r0 prints 59.18 cm " + S.formatCm(k.r0HereCm));
assert(near(k.seeingArcsec / ref.seeingArcsec, Math.pow(2200 / 500, -1 / 5), 1e-12), "seeing ∝ λ^(−1/5)");
assert(S.formatArcsec(k.seeingArcsec) === "0.752″", "K-band seeing prints 0.752″ " + S.formatArcsec(k.seeingArcsec));
assert(k.seeingLimited === true, "8 m is seeing-limited at K for r0 = 10 cm");

/* 8 m at 550 nm. */
var eight = S.rayleighArcsec(800, 550);
assert(near(eight, ray550 / 40, 1e-12), "8 m is 40 times a 20 cm aperture");
assert(S.formatArcsec(eight) === "0.0173″", "8 m at 550 nm prints 0.0173″ " + S.formatArcsec(eight));

/* Zenith angle. sec(60°) = 2, and r0 scales as 2^(−3/5). */
var z60 = S.solve({
  r0Cm: 10,
  zenithDeg: 60,
  lambdaNm: 500,
  dCm: 20,
  windMs: 10,
  heightM: 5000
});
assert(near(z60.airmass, 2, 1e-12), "sec 60°");
assert(near(z60.r0m / 0.1, Math.pow(2, -3 / 5), 1e-12), "(sec z)^(−3/5)");
assert(near(z60.seeingArcsec / ref.seeingArcsec, Math.pow(2, 3 / 5), 1e-12), "seeing ∝ (sec z)^(3/5)");
assert(near(S.zenithFromAirmass(2), 60, 1e-9), "airmass writes back to zenith angle");

/* The angles meet later than D = r0, because 1.22 and 0.98 differ.
   At D = 11 cm and r0 = 10 cm the wavefront is seeing-limited and
   the Rayleigh angle is still larger. */
var edge = S.solve({
  r0Cm: 10,
  zenithDeg: 0,
  lambdaNm: 500,
  dCm: 11,
  windMs: 10,
  heightM: 5000
});
assert(edge.seeingLimited === true, "11 cm is past r0");
assert(edge.dominant === "diffraction", "Rayleigh is still the larger angle");
assert(near(edge.angleCrossCm / edge.r0HereCm, 1.22 / 0.98, 1e-12), "crossover is 1.22/0.98");

/* 7×50 at V, r0 = 10 cm. The aperture is inside one cell. */
var bino = S.solve({
  r0Cm: 10,
  zenithDeg: 0,
  lambdaNm: 550,
  dCm: 5,
  windMs: 10,
  heightM: 5000
});
assert(bino.seeingLimited === false, "50 mm is inside r0 at V");
assert(bino.dominant === "diffraction", "binoculars are diffraction-limited here");
assert(near(bino.r0HereCm / 10, Math.pow(550 / 500, 6 / 5), 1e-12), "V-band r0");

/* Coherence time and isoplanatic angle. */
assert(near(S.coherenceSeconds(0.1, 10), 0.00314, 1e-15), "Dhillon’s 10 cm and 10 m/s");
assert(S.formatTime(ref.tauSec) === "3.14 ms", "prints 3.14 ms");
assert(near(S.isoplanaticArcsec(0.2, 7000, 0), 0.314 * 0.2 / 7000 * S.ARCSEC_PER_RAD, 0), "Quirrenbach arithmetic");
assert(S.formatArcsec(S.isoplanaticArcsec(0.2, 7000, 0)) === "1.850″", "20 cm and 7 km prints 1.850″");
var theta60 = S.isoplanaticArcsec(z60.r0m, 5000, 60);
assert(near(theta60, 0.314 * Math.cos(60 * Math.PI / 180) * z60.r0m / 5000 * S.ARCSEC_PER_RAD, 0), "cos z on θ0");

/* Gaussian FWHM. */
var fwhmRad = 1 / S.ARCSEC_PER_RAD;
assert(near(S.gaussianIntensity(0, 1), 1, 0), "Gaussian peak");
assert(near(S.gaussianIntensity(0.5 * fwhmRad, 1), 0.5, 1e-12), "Gaussian half maximum");

/* Presets and bounds. */
assert(S.BANDS.length === 7, "seven wavelength buttons");
assert(S.bandById("K").nm === 2200, "K is 2.2 µm");
assert(S.bandById("J").nm === 1250, "J is 1.25 µm");
assert(S.bandById("H").nm === 1650, "H is 1.65 µm");
assert(S.bandById("V").nm === 550, "V is 550 nm");
assert(S.SITES.length === 3, "three illustrative sites");
assert(S.siteById("suburban").r0Cm === 5, "suburban 5 cm");
assert(S.siteById("mountain").r0Cm === 10, "mountain 10 cm");
assert(S.siteById("excellent").r0Cm === 15, "excellent 15 cm");
assert(S.TELESCOPES.length === 5, "five apertures");
assert(S.telescopeById("bino").dCm === 5, "7×50");
assert(S.telescopeById("amateur").dCm === 20, "20 cm");
assert(S.telescopeById("elt").dCm === 3900, "39 m");
assert(S.matchedSite(10).id === "mountain", "10 cm matches the mountain button");
assert(S.matchedBand(2200).id === "K", "2200 nm matches K");
assert(!S.matchedBand(600), "600 nm is not a button");
assert(S.solve({ r0Cm: 0.5, zenithDeg: 0, lambdaNm: 500, dCm: 20, windMs: 10, heightM: 5000 }) === null, "r0 below the floor");
assert(S.solve({ r0Cm: 10, zenithDeg: 71, lambdaNm: 500, dCm: 20, windMs: 10, heightM: 5000 }) === null, "zenith past 70°");
assert(S.solve({ r0Cm: 10, zenithDeg: 0, lambdaNm: 300, dCm: 20, windMs: 10, heightM: 5000 }) === null, "wavelength below the floor");
assert(S.solve(S.opening()).ok, "opening solves");

var open = S.solve(S.opening());
assert(S.why(open).indexOf(S.formatArcsec(open.seeingArcsec)) !== -1, "why names the seeing");
assert(S.why(open).indexOf("not a measurement") !== -1, "why refuses a measurement");
assert(S.limitsNote().indexOf("Educational calculator") !== -1, "disclaimer");
assert(S.limitsNote().indexOf("not a forecast") !== -1, "not a forecast");
assert(S.limitsNote().indexOf("0.981") !== -1, "0.981 is named and not used");
assert(S.limitsNote().indexOf("Gaussian") !== -1, "schematic Gaussian");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("---\n---\n<!DOCTYPE html>") === 0, "front matter so GitHub Pages processes the includes");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "GA lives in the nav include");
assert(html.indexOf("googletagmanager") === -1, "no second snippet");
assert(html.indexOf('class="subnav subnav-desk"') !== -1, "desktop nav");
assert(html.indexOf('class="subnav-phone"') !== -1, "phone nav");
assert(html.indexOf('aria-current="page">Seeing') !== -1, "current page");
assert(html.indexOf('id="star"') !== -1, "star canvas");
assert(html.indexOf('id="chart"') !== -1, "wavelength chart");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1, "help control");
assert(html.indexOf("1.011") !== -1, "page states the 10 cm seeing");
assert(html.indexOf("59.18") !== -1, "page states the K-band r0");
assert(html.indexOf("0.752") !== -1, "page states the K-band seeing");
assert(html.indexOf("0.692") !== -1, "page states the 20 cm Rayleigh angle");
assert(html.indexOf("0.0173") !== -1, "page states the 8 m Rayleigh angle");
assert(html.indexOf("0.98") !== -1, "page states the seeing factor");
assert(html.indexOf("1.22") !== -1, "page states Rayleigh");
assert(html.indexOf("0.314") !== -1, "page states the 0.314 factor");
assert(html.indexOf("illustrative") !== -1, "site values are labelled illustrative");
assert(html.indexOf("Not a forecast") !== -1, "forecast refused");
assert(html.indexOf("schematic") !== -1, "drawing is a schematic");
assert(html.indexOf('data-band="K"') !== -1, "K button");
assert(html.indexOf('data-site="excellent"') !== -1, "excellent-site button");
assert(html.indexOf('data-scope="elt"') !== -1, "ELT button");
assert(html.indexOf("/science/astronomy/telescope/") !== -1, "telescope link");
assert(html.indexOf("/science/astronomy/refraction/") !== -1, "refraction link");
assert(html.indexOf("/science/astronomy/airmass/") !== -1, "airmass link");
assert(html.indexOf("/science/light-pollution/") !== -1, "light-pollution link");
assert(html.indexOf("https://doi.org/10.1364/JOSA.56.001372") !== -1, "Fried 1966");
assert(html.indexOf("https://doi.org/10.3390/atmos14111694") !== -1, "Tokovinin 2023");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/seeing/") !== -1, "hub links the desk");
assert(hub.indexOf("<h3>Seeing</h3>") !== -1, "hub card");

["telescope", "refraction", "airmass"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/seeing/") !== -1, name + " links here");
});

var glow = fs.readFileSync(path.join(__dirname, "../../light-pollution/index.html"), "utf8");
assert(glow.indexOf("/science/astronomy/seeing/") !== -1, "light pollution links here");

var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/seeing/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/seeing/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/seeing/") !== -1, "html sitemap");

var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/seeing/") found = true;
  });
});
assert(found, "whats-new lists the desk");

var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/seeing/") !== -1, "science index links the desk");

console.log("seeing.test.js ok");
console.log("r0 = 10 cm at 500 nm", S.formatArcsec(ref.seeingArcsec));
console.log("K band", S.formatCm(k.r0HereCm), S.formatArcsec(k.seeingArcsec));
console.log("Rayleigh 20 cm and 8 m at 550 nm", S.formatArcsec(ray550), S.formatArcsec(eight));
