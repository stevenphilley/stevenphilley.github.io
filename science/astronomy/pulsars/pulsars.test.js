/* Pulsar spin-down checks. Ages and fields are computed, not stored.
   Run: node science/astronomy/pulsars/pulsars.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var P = require("./pulsars.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(P.C_M_S === 299792458, "exact c");
assert(P.I_G_CM2 === 1e45, "canonical inertia, cgs");
assert(P.I_KG_M2 === 1e38, "canonical inertia, SI");
assert(P.R_KM === 10, "10 km");
assert(P.BRAKING_INDEX === 3, "dipole braking");
assert(P.B_DIPOLE === 3.2e19, "ATNF BSURF coefficient");
assert(P.B_POLAR === 6.4e19, "Harding polar coefficient is twice the dipole");
assert(P.YEAR_S === 365.25 * 86400, "Julian year");
assert(P.CRAB_SN_YEAR === 1054, "supernova year");
assert(P.PAGE_YEAR === 2026, "count year");
assert(P.CRAB_TRUE_AGE_YR === 972, "2026 minus 1054");
assert(P.PRESETS.length === 4, "four cited presets");

/* ATNF v2.9.0 printed P0, P1, and the rounded AGE / BSURF / EDOT columns. */
var cited = {
  crab: { p: 0.0333924123, pd: 4.20972e-13, age: "1.26e+3", b: "3.79e+12", edot: "4.5e+38" },
  vela: { p: 0.089328385024, pd: 1.25008e-13, age: "1.13e+4", b: "3.38e+12", edot: "6.9e+36" },
  j0437: { p: 0.005757451941593412, pd: 5.72922e-20, age: "1.59e+9", b: "5.81e+8", edot: "1.2e+34" },
  b1919: { p: 1.3373021601895, pd: 1.348207e-15, age: "1.57e+7", b: "1.36e+12", edot: "2.2e+31" }
};

Object.keys(cited).forEach(function (id) {
  var spec = cited[id];
  var preset = P.presetById(id);
  var row = P.presetModel(id);
  assert(preset.pSeconds === spec.p, id + " period");
  assert(preset.pDot === spec.pd, id + " derivative");
  assert(row.preset && row.preset.id === id, id + " matches itself");
  assert(near(row.ageSeconds, spec.p / (2 * spec.pd), 0), id + " age is P/(2 Pdot)");
  assert(near(row.bGauss, 3.2e19 * Math.sqrt(spec.p * spec.pd), 0), id + " field formula");
  assert(near(row.edotWatts, 4 * Math.PI * Math.PI * 1e38 * spec.pd / Math.pow(spec.p, 3), 0), id + " edot formula");
  assert(near(row.edotErg, row.edotWatts * 1e7, 0), id + " erg is watts times 1e7");
  assert(near(row.rlcM, 299792458 * spec.p / (2 * Math.PI), 0), id + " light cylinder");
  assert(near(row.bPolarGauss, 2 * row.bGauss, 1e-6 * row.bGauss), id + " polar field is twice the dipole");
  assert(row.ageYears.toPrecision(3) === spec.age, id + " age rounds like ATNF " + row.ageYears.toPrecision(3));
  assert(row.bGauss.toPrecision(3) === spec.b, id + " field rounds like ATNF " + row.bGauss.toPrecision(3));
  assert(row.edotErg.toPrecision(2) === spec.edot, id + " edot rounds like ATNF " + row.edotErg.toPrecision(2));
});

var crab = P.presetModel("crab");
assert(crab.ageYears > 1200 && crab.ageYears < 1300, "Crab characteristic age is about 1 kyr");
assert(crab.bGauss > 1e12 && crab.bGauss < 1e13, "Crab field is order 1e12 G");
assert(crab.edotWatts > 1e31 && crab.edotWatts < 1e32, "Crab power is order 1e31 W");
assert(crab.ageYears > P.CRAB_TRUE_AGE_YR, "characteristic age exceeds the supernova count");
assert(P.formatAge(crab.ageSeconds) === "1,257 yr", "Crab age print " + P.formatAge(crab.ageSeconds));
assert(P.formatB(crab.bGauss) === "3.794×10¹² G", "Crab field print " + P.formatB(crab.bGauss));
assert(P.formatEdot(crab.edotWatts) === "4.463×10³¹ W", "Crab watt print");
assert(P.formatErg(crab.edotErg) === "4.463×10³⁸ erg/s", "Crab erg print");
assert(P.formatKm(crab.rlcM) === "1,593.3 km", "Crab light cylinder " + P.formatKm(crab.rlcM));
assert(P.formatPdot(crab.pDot) === "4.20972×10⁻¹³", "Crab derivative label");
assert(P.formatPeriodPair(crab) === "33.3924123 ms (0.0333924123 s)", "Crab period pair");

var vela = P.presetModel("vela");
var ms = P.presetModel("j0437");
var slow = P.presetModel("b1919");
assert(P.formatAge(vela.ageSeconds) === "11.32 kyr", "Vela age " + P.formatAge(vela.ageSeconds));
assert(ms.ageYears > 1e9 && ms.bGauss < 1e10 && ms.bGauss > 1e8, "millisecond pulsar is old and weakly magnetized");
assert(slow.pSeconds > 1 && slow.ageYears > 1e7 && slow.ageYears < 1e8, "ordinary slow pulsar");
assert(P.formatAge(ms.ageSeconds) === "1.592 Gyr", "J0437 age " + P.formatAge(ms.ageSeconds));
assert(P.formatAge(slow.ageSeconds) === "15.72 Myr", "B1919 age " + P.formatAge(slow.ageSeconds));
assert(P.formatB(ms.bGauss) === "5.812×10⁸ G", "J0437 field");
assert(P.formatKm(ms.rlcM) === "274.71 km", "J0437 light cylinder");
assert(P.formatKm(slow.rlcM) === "63,807 km", "B1919 light cylinder");

assert(P.model({ pSeconds: 0.0009, pDot: 1e-15 }) == null, "below the period floor");
assert(P.model({ pSeconds: 21, pDot: 1e-15 }) == null, "above the period ceiling");
assert(P.model({ pSeconds: 1, pDot: 1e-23 }) == null, "derivative floor");
assert(P.model({ pSeconds: 1, pDot: 1e-8 }) == null, "derivative ceiling");
assert(P.model({ pSeconds: 1, pDot: -1e-15 }) == null, "negative derivative");
assert(near(P.logFromUnit(P.unitFromLog(crab.pSeconds, P.P_MIN_S, P.P_MAX_S), P.P_MIN_S, P.P_MAX_S), crab.pSeconds, 1e-12), "period slider round trip");
assert(near(P.logFromUnit(P.unitFromLog(crab.pDot, P.PDOT_MIN, P.PDOT_MAX), P.PDOT_MIN, P.PDOT_MAX), crab.pDot, crab.pDot * 1e-9), "derivative slider round trip");

/* Constant age is slope +1. Constant field is slope −1. The sketch is slope 3. */
assert(near(P.agePdot(2, 1e6) / P.agePdot(1, 1e6), 2, 1e-12), "age line doubles with period");
assert(near(P.fieldPdot(2, 1e12) / P.fieldPdot(1, 1e12), 0.5, 1e-12), "field line halves with period");
assert(near(P.deathPdot(2) / P.deathPdot(1), 8, 1e-9), "death sketch is P cubed");
var lines = P.diagramLines();
assert(lines.some(function (l) { return l.kind === "age" && l.label === "1 kyr"; }), "1 kyr line");
assert(lines.some(function (l) { return l.kind === "field" && l.label === "10¹² G"; }), "1e12 G line");
assert(lines.some(function (l) { return l.kind === "death"; }), "death sketch");
lines.forEach(function (l) {
  assert(l.p0 >= P.P_MIN_S && l.p1 <= P.P_MAX_S, l.label + " stays on the period axis");
  assert(l.pd0 >= P.PDOT_MIN && l.pd0 <= P.PDOT_MAX, l.label + " start derivative");
  assert(l.pd1 >= P.PDOT_MIN && l.pd1 <= P.PDOT_MAX, l.label + " end derivative");
});

var why = P.explainWhy();
assert(P.explain(crab).indexOf("1,257 yr") !== -1, "explain names the Crab age");
assert(P.explain(crab).indexOf("972") !== -1, "explain names the supernova count");
assert(P.explain(crab).indexOf("Not a timing model") !== -1, "explain disclaimer");
assert(P.explain(ms).indexOf("1,257 yr") !== -1, "other pulsars still name the Crab contrast");
assert(why.spin.indexOf("33.3924123 ms") !== -1, "spin paragraph");
assert(why.age.indexOf("972") !== -1 && why.age.indexOf("1,257 yr") !== -1, "age paragraph contrast");
assert(why.field.indexOf("3.794×10¹² G") !== -1 && why.field.indexOf("1,593.3 km") !== -1, "field paragraph");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/pulsars/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("pulsars.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("Educational calculator") !== -1, "educational disclaimer");
assert(html.indexOf("Not a timing model") !== -1, "timing disclaimer");
assert(html.indexOf("Idealized magnetic dipole") !== -1, "dipole disclaimer");
assert(html.indexOf("972") !== -1, "supernova count on the page");
assert(html.indexOf("1,257 yr") !== -1, "Crab age on the page");
assert(html.indexOf("299,792,458") !== -1, "c on the page");
assert(html.indexOf("3.2×10¹⁹") !== -1, "field coefficient on the page");
assert(html.indexOf("P / (2 Ṗ)") !== -1, "age formula");
assert(html.indexOf("4π² I Ṗ / P³") !== -1, "luminosity formula");
assert(html.indexOf(P.explain(crab)) !== -1, "Crab explanation is on the page");
assert(html.indexOf(why.spin) !== -1, "spin paragraph");
assert(html.indexOf(why.age) !== -1, "age paragraph");
assert(html.indexOf(why.field) !== -1, "field paragraph");
assert(html.indexOf("0.0333924123") !== -1 && html.indexOf("4.20972e-13") !== -1, "Crab catalogue digits");
assert(html.indexOf("0.089328385024") !== -1 && html.indexOf("1.25008") !== -1, "Vela catalogue digits");
assert(html.indexOf("0.005757451941593412") !== -1 && html.indexOf("5.729220") !== -1, "J0437 catalogue digits");
assert(html.indexOf("1.3373021601895") !== -1 && html.indexOf("1.348207") !== -1, "B1919 catalogue digits");
assert(html.indexOf("https://www.atnf.csiro.au/research/pulsar/psrcat/") !== -1, "ATNF catalogue");
assert(html.indexOf("https://doi.org/10.1086/428488") !== -1, "Manchester et al. 2005");
assert(html.indexOf("https://doi.org/10.1093/mnras/stu2118") !== -1, "Lyne et al. 2015");
assert(html.indexOf("https://doi.org/10.1086/339068") !== -1, "Dodson et al. 2002");
assert(html.indexOf("https://doi.org/10.3847/2041-8213/ad614a") !== -1, "Reardon et al. 2024");
assert(html.indexOf("https://doi.org/10.1111/j.1365-2966.2004.08157.x") !== -1, "Hobbs et al. 2004");
assert(html.indexOf("https://arxiv.org/abs/astro-ph/0209160") !== -1, "Harding death-line note");
assert(html.indexOf("https://doi.org/10.1086/172129") !== -1, "Chen and Ruderman");
assert(html.indexOf('data-preset="crab"') !== -1, "Crab button");
assert(html.indexOf('data-preset="vela"') !== -1, "Vela button");
assert(html.indexOf('data-preset="j0437"') !== -1, "millisecond button");
assert(html.indexOf('data-preset="b1919"') !== -1, "slow pulsar button");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/pulsars/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/pulsars/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/pulsars/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/pulsars/") !== -1, "search index");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/pulsars/") !== -1, "html sitemap");
var life = fs.readFileSync(path.join(__dirname, "../stellar-lifetime/index.html"), "utf8");
assert(life.indexOf("/science/astronomy/pulsars/") !== -1, "stellar-lifetime cross-link");

console.log("pulsars.test.js: ok");
console.log("Crab", P.formatAge(crab.ageSeconds), P.formatB(crab.bGauss), P.formatEdot(crab.edotWatts));
console.log("Vela", P.formatAge(vela.ageSeconds), "J0437", P.formatAge(ms.ageSeconds), "B1919", P.formatAge(slow.ageSeconds));
