/* Hydrogen Rydberg checks against 2022 CODATA and NIST ASD centers.
   Run: node science/astronomy/spectra/spectra.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./spectra.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(S.R_INF === 10973731.568157, "CODATA R infinity");
assert(S.MP_OVER_ME === 1836.152673426, "CODATA mass ratio");
assert(S.C_M_S === 299792458, "exact c");
assert(S.H_J_S === 6.62607015e-34, "exact h");
assert(S.E_C === 1.602176634e-19, "exact e");

/* The working constant is the reduced-mass Rydberg, six significant figures. */
var raw = S.reducedMassRydberg();
assert(raw > 10967758 && raw < 10967759, "unrounded R_H " + raw);
assert(S.roundSig(raw, 6) === S.R_H, "six-figure rounding " + S.roundSig(raw, 6));
assert(S.R_H === 1.09678e7, "R_H used by the formula");

/* NIST vacuum from the printed level wavenumbers. */
var ha = S.anchorView(S.anchorByLevels(2, 3));
var hb = S.anchorView(S.anchorByLevels(2, 4));
var ly = S.anchorView(S.anchorByLevels(1, 2));
assert(near(ha.sigmaCm, 15233.146, 1e-9), "Hα wavenumber " + ha.sigmaCm);
assert(near(ha.vacNm, 1e7 / ha.sigmaCm, 0), "Hα vacuum is 10^7 over its wavenumber");
assert(near(ha.vacNm, 1e7 / 15233.146, 1e-9), "Hα vacuum from σ");
assert(near(ha.vacNm, 656.463, 0.0005), "Hα vacuum rounds to 656.463 " + ha.vacNm);
assert(ha.airNm === 656.28, "Hα customary air nm " + ha.airNm);
assert(ha.observedNm === 656.279, "Hα ASD observed air");
assert(near(hb.vacNm, 486.269, 0.0005), "Hβ vacuum " + hb.vacNm);
assert(near(hb.airNm, 486.132, 1e-9), "Hβ customary air " + hb.airNm);
assert(ly.observedNm === 121.56701, "Lyα tabulated vacuum");
assert(near(ly.vacNm, 121.56701, 0.00001), "Lyα from the n=2 center " + ly.vacNm);

/* Formula versus those NIST vacuum centers: within 0.01 nm.
   The residual is the six-figure rounding plus fine structure,
   which the Bohr formula does not include. */
var fHa = S.vacuumNm(2, 3);
var fHb = S.vacuumNm(2, 4);
var fLy = S.vacuumNm(1, 2);
assert(Math.abs(fHa - ha.vacNm) < 0.01, "Hα formula vs NIST " + fHa + " vs " + ha.vacNm);
assert(Math.abs(fHb - hb.vacNm) < 0.01, "Hβ formula vs NIST " + fHb + " vs " + hb.vacNm);
assert(Math.abs(fLy - ly.vacNm) < 0.01, "Lyα formula vs NIST " + fLy + " vs " + ly.vacNm);
assert(S.formatNm(fHa) === "656.467 nm", "format Hα " + S.formatNm(fHa));
assert(S.formatNm(fHb) === "486.272 nm", "format Hβ " + S.formatNm(fHb));
assert(S.formatNm(fLy) === "121.568 nm", "format Lyα " + S.formatNm(fLy));

/* The user's air / vacuum example: 656.28 nm air, 656.46 nm vacuum. */
assert(near(ha.airNm, 656.28, 0), "air example");
assert(near(ha.vacNm, 656.46, 0.005), "vacuum example rounds to 656.46");

/* Frequency and energy are the same photon. E = hν/e. */
var row = S.transition(2, 3, 0);
assert(row.series === "Balmer" && row.name === "Hα", "Hα name");
assert(row.restBand === "visible" && row.band === "visible", "Hα visible");
assert(near(row.freqHz, S.C_M_S / (fHa * 1e-9), 0), "frequency is c/λ");
assert(near(row.energyEv, S.H_J_S * row.freqHz / S.E_C, 1e-9), "energy is hν/e");
assert(S.formatHz(row.freqHz) === "4.5668×10¹⁴ Hz", "format Hα frequency " + S.formatHz(row.freqHz));
assert(S.formatEv(row.energyEv) === "1.8887 eV", "format Hα energy " + S.formatEv(row.energyEv));

assert(S.transition(1, 2, 0).series === "Lyman", "Lyman");
assert(S.transition(1, 2, 0).restBand === "ultraviolet", "Lyα UV");
assert(S.transition(3, 4, 0).series === "Paschen", "Paschen");
assert(S.transition(3, 4, 0).name === "Paα", "Paα");
assert(S.transition(3, 4, 0).restBand === "infrared", "Paα IR");
assert(S.transition(4, 5, 0).series === "Brackett" && S.transition(4, 5, 0).name === "Brα", "Brackett");
assert(S.transition(5, 6, 0).series === "Pfund" && S.transition(5, 6, 0).name === "Pfα", "Pfund");
assert(S.seriesName(6) === "n₁ = 6", "unnamed higher series");

/* Redshift. Lyα reaches the 400 nm edge inside z = 0 to 5,
   and it has left the window again before z = 5. */
var enter = S.zPresetById("enter");
var beside = S.zPresetById("beside");
assert(near(enter.z, S.VIS_MIN_NM / fLy - 1, 1e-12), "enter z");
assert(enter.z > 2 && enter.z < 3, "Lyα enters in the twos " + enter.z);
var atEdge = S.transition(1, 2, enter.z);
assert(near(atEdge.obsNm, 400, 1e-9), "Lyα on 400 nm");
assert(atEdge.band === "visible", "edge counts as visible");
assert(S.transition(1, 2, enter.z - 0.01).band === "ultraviolet", "still UV a step earlier");
assert(near(beside.z, fHa / fLy - 1, 1e-12), "beside Hα");
assert(beside.z < S.Z_MAX, "beside preset is on the slider");
assert(S.transition(1, 2, S.Z_MAX).obsNm > S.VIS_MAX_NM, "Lyα has left by z = 5");
assert(S.transition(1, 2, S.Z_MAX).band === "infrared", "Lyα infrared at z = 5");
assert(near(S.observedNm(656.467, 1), 656.467 * 2, 1e-9), "1+z");

/* Rejected controls. */
assert(S.transition(2, 2, 0) == null, "n2 must exceed n1");
assert(S.transition(0, 2, 0) == null, "n1 floor");
assert(S.transition(2, 21, 0) == null, "n2 ceiling");
assert(S.transition(2, 3, -0.01) == null, "no blueshift on this slider");
assert(S.transition(2, 3, 5.01) == null, "z ceiling");
assert(S.transition(2.5, 4, 0) == null, "levels are integers");

assert(S.linePresets().length === 6, "six line presets");
assert(S.presetById("ha").n1 === 2 && S.presetById("ha").n2 === 3, "Hα preset");
assert(S.seriesMembers(2, 0).length === 12, "twelve Balmer marks");
assert(S.seriesMembers(2, 0)[0].name === "Hα", "series starts at α");
assert(near(S.limitNm(2), 4 / S.R_H * 1e9, 0), "Balmer limit");
assert(S.limitNm(2) < S.VIS_MIN_NM, "Balmer limit is UV");
assert(near(S.ionizationEv(), S.HC_EV_NM * S.R_H * 1e-9, 0), "ionization is hcR");
assert(near(S.levelEv(1), -S.ionizationEv(), 0), "ground level");
assert(S.levelEv(2) > S.levelEv(1), "levels climb");

/* The sketch is only a finder. Hα is redder than Hβ. */
assert(S.sketchRgb(fHa).indexOf("rgb(") === 0, "sketch returns rgb");
function redOf(nm) {
  return Number(S.sketchRgb(nm).split(",")[0].replace("rgb(", ""));
}
assert(redOf(fHa) > redOf(fHb), "Hα sketches redder than Hβ");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/spectra/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("spectra.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf("/science/astronomy/redshift/") !== -1, "redshift link");
assert(html.indexOf("/science/astronomy/blackbody/") !== -1, "blackbody link");
assert(html.indexOf("/science/astronomy/hr/") !== -1, "HR link");
assert(html.indexOf("/science/astronomy/stars/") !== -1, "stars link");
assert(html.indexOf("1.09678") !== -1, "R_H on the page");
assert(html.indexOf("10973731.568157") !== -1, "R infinity on the page");
assert(html.indexOf("1836.152673426") !== -1, "mass ratio on the page");
assert(html.indexOf("656.280") !== -1, "Hα air");
assert(html.indexOf("656.463") !== -1, "Hα NIST vacuum");
assert(html.indexOf("656.279") !== -1, "Hα ASD observed air");
assert(html.indexOf("121.567") !== -1, "Lyα");
assert(html.indexOf("486.132") !== -1, "Hβ air");
assert(html.indexOf("486.269") !== -1, "Hβ NIST vacuum");
assert(html.indexOf("82259.158") !== -1 && html.indexOf("97492.304") !== -1, "Hα levels");
assert(html.indexOf("Kirchhoff") !== -1, "names Kirchhoff");
assert(html.indexOf("Educational") !== -1, "educational label");
assert(html.indexOf("Not a line list") !== -1, "disclaimer");
assert(html.indexOf("Lyman") !== -1 && html.indexOf("Balmer") !== -1, "series names");
assert(html.indexOf("Brackett") !== -1 && html.indexOf("Pfund") !== -1, "later series");
assert(html.indexOf("400") !== -1 && html.indexOf("700") !== -1, "visible window");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/spectra/") !== -1, "hub links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/spectra/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/spectra/") !== -1, "search index");

console.log("spectra.test.js: ok");
console.log("Lyα", S.formatNm(fLy), "Hβ", S.formatNm(fHb), "Hα", S.formatNm(fHa));
console.log("NIST vac", ly.vacNm.toFixed(5), hb.vacNm.toFixed(3), ha.vacNm.toFixed(3));
console.log("deltas nm", (fLy - ly.vacNm).toFixed(4), (fHb - hb.vacNm).toFixed(4), (fHa - ha.vacNm).toFixed(4));
console.log("Lyα enters visible at z", enter.z.toFixed(3));
