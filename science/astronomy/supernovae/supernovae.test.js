/* Supernova decay-power checks. Luminosities come from the Bateman solution.
   Run: node science/astronomy/supernovae/supernovae.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./supernovae.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(S.U_KG === 1.66053906892e-27, "CODATA u");
assert(S.E_C === 1.602176634e-19, "exact e");
assert(S.G === 6.67430e-11, "CODATA G");
assert(S.GM_SUN === 1.3271244e20, "IAU GM sun");
assert(S.L_SUN_W === 3.828e26, "IAU nominal luminosity");
assert(S.DAY_S === 86400, "SI day");
assert(S.A_NI === 56, "integer mass number");
assert(S.HALF_NI_D === 6.10 && S.HALF_CO_D === 77.12, "printed half-lives");
assert(S.TAU_NI_D === 8.80 && S.TAU_CO_D === 111.3, "printed mean lives");
assert(S.Q_NI_MEV === 1.75, "nickel deposited energy");
assert(S.Q_CO_GAMMA_MEV === 3.61 && S.Q_CO_POSITRON_MEV === 0.12, "cobalt parts");
assert(near(S.Q_CO_MEV, 3.61 + 0.12, 0), "cobalt sum is 3.73");
assert(S.Q_NI_NU_MEV === 0.41 && S.Q_CO_NU_MEV === 0.84, "neutrinos are recorded and not deposited");
assert(Number((6.10 / Math.LN2).toFixed(2)) === 8.80, "6.10 days rounds to 8.80");
assert(Number((77.12 / Math.LN2).toFixed(1)) === 111.3, "77.12 days rounds to 111.3");
assert(S.cobaltPeakDay().toFixed(2) === "24.25", "cobalt maximum rounds to 24.25");
assert(S.cobaltPeakDay().toFixed(4) === "24.2469", "unrounded cobalt maximum");

assert(near(S.M_SUN_KG, 1.988409870698051e30, 1e18), "solar mass quotient");
assert(S.sci(S.M_SUN_KG, 11) === "1.9884098707 × 10³⁰", "solar mass text");
assert(near(S.N_PER_MSUN, S.M_SUN_KG / (56 * S.U_KG), 0), "nuclei per solar mass");
assert(S.sci(S.A_PER_MSUN, 6) === "6.44240 × 10⁴³", "recomputed A");
assert(S.sci(S.B_PER_MSUN, 6) === "1.44295 × 10⁴³", "recomputed B");
assert(Math.abs(S.A_PER_MSUN / S.NAD_A - 1) < 0.002, "A is within 0.2% of 6.45e43");
assert(Math.abs(S.B_PER_MSUN / S.NAD_B - 1) < 0.006, "B is within 0.6% of 1.45e43");

function hand(mass, day) {
  var n0 = S.N_PER_MSUN * mass;
  var eNi = Math.exp(-day / S.TAU_NI_D);
  var eCo = Math.exp(-day / S.TAU_CO_D);
  var nNi = n0 * eNi;
  var nCo = day === 0 ? 0 : n0 * (S.TAU_CO_D / (S.TAU_CO_D - S.TAU_NI_D)) * (eCo - eNi);
  var tauNi = S.TAU_NI_D * S.DAY_S;
  var tauCo = S.TAU_CO_D * S.DAY_S;
  var qNi = S.Q_NI_MEV * 1e6 * S.E_C;
  var qCo = S.Q_CO_MEV * 1e6 * S.E_C;
  return {
    ni: nNi * qNi / tauNi * 1e7,
    co: nCo * qCo / tauCo * 1e7
  };
}

var fid = S.luminosity(0.6, 24.25);
var handFid = hand(0.6, 24.25);
assert(near(fid.niErg, handFid.ni, Math.abs(handFid.ni) * 1e-12), "nickel branch is the formula");
assert(near(fid.coErg, handFid.co, Math.abs(handFid.co) * 1e-12), "cobalt branch is the formula");
assert(near(fid.totErg, S.combinedErg(0.6, 24.25), Math.abs(fid.totErg) * 1e-9), "split matches the combined form");
assert(fid.ratio.toPrecision(4) === "0.4690", "Ni/Co at day 24.25");
assert(near(fid.fracNi + fid.fracCo, 1, 1e-12), "fractions sum to 1");
assert(S.scene().text.total === "9.41979 × 10⁴² erg/s", "opening total");
assert(S.scene().text.frac === "Ni 31.93% · Co 68.07%", "opening fractions");
assert(S.scene().text.lsun === "2.46076 × 10⁹ L☉", "opening solar luminosities");

var zero = S.luminosity(0.6, 0);
assert(zero.coErg === 0 && zero.ratio == null, "day 0 has no cobalt");
assert(near(zero.niErg, zero.totErg, 0), "day 0 is pure nickel");
assert(near(zero.totErg, 0.6 * S.N_PER_MSUN * S.Q_NI_MEV * 1e6 * S.E_C / (S.TAU_NI_D * S.DAY_S) * 1e7, 1), "day 0 nickel rate");

var half = S.luminosity(0.3, 24.25);
assert(near(half.totErg * 2, fid.totErg, fid.totErg * 1e-12), "power scales with nickel mass");
assert(near(half.ratio, fid.ratio, 1e-12), "the ratio does not depend on mass");

var late = S.luminosity(0.6, 400);
assert(late.fracNi < 1e-15, "nickel is gone by day 400");
assert(late.totErg < fid.totErg, "the total falls");

var curve = S.samples(0.6, 401);
assert(curve.length === 401, "day samples");
assert(curve[0].day === 0 && curve[curve.length - 1].day === 400, "0 to 400");
var i;
for (i = 1; i < curve.length; i++) {
  assert(curve[i].totErg < curve[i - 1].totErg, "total declines");
  assert(curve[i].coErg > 0, "cobalt is positive after day 0");
}

var before = S.luminosity(1, S.cobaltPeakDay() - 0.05);
var at = S.luminosity(1, S.cobaltPeakDay());
var after = S.luminosity(1, S.cobaltPeakDay() + 0.05);
assert(at.coErg > before.coErg && at.coErg > after.coErg, "cobalt luminosity peaks at the printed maximum");

assert(S.luminosity(0.009, 10) === null, "mass below the slider is refused");
assert(S.luminosity(1.01, 10) === null, "mass above the slider is refused");
assert(S.luminosity(0.6, -1) === null && S.luminosity(0.6, 401) === null, "day window");
assert(S.scene({ mass: 0.6, day: 24.25 }).preset === "ia", "0.6 is the fiducial");
assert(S.scene({ preset: "sn1987a" }).mass === 0.071, "1987A button");
assert(S.scene({ preset: "sn1987a" }).text.why.indexOf("0.073") !== -1, "Arnett and Fu stays beside 0.071");
assert(S.scene({ preset: "sn1987a" }).text.why.indexOf("not averaged") !== -1, "the two fits are not averaged");
assert(S.scene({ mass: 0.2, day: 10 }).text.why.indexOf("not a named supernova") !== -1, "slider mass is not a catalog object");
assert(S.parseMass("0.071") === 0.071, "parses 0.071");
assert(!isFinite(S.parseMass("1e-2")), "refuses scientific shorthand");
assert(!isFinite(S.parseDay("")), "empty day is refused");

var open = S.scene();
var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/supernovae/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf("subnav-desk{display:none}") !== -1, "desktop nav hides on a phone");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("supernovae.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(S.LIMITS) !== -1, "disclaimer on the page");
assert(html.indexOf(open.text.total) !== -1, "opening total on the page");
assert(html.indexOf(open.text.ratio) !== -1, "opening ratio on the page");
assert(html.indexOf(open.text.aria) !== -1, "opening chart label");
assert(html.indexOf('id="curve"') !== -1, "chart canvas");
assert(html.indexOf('data-preset="ia"') !== -1 && html.indexOf('data-preset="sn1987a"') !== -1, "cited presets");
assert(html.indexOf("0.6") !== -1 && html.indexOf("0.071") !== -1, "preset masses");
assert(html.indexOf("Nadyozhin") !== -1, "energy source named");
assert(html.indexOf("1.75 MeV") !== -1 && html.indexOf("3.73 MeV") !== -1, "deposited energies");
assert(html.indexOf("6.45") !== -1 && html.indexOf("1.45") !== -1, "his rounded coefficients stay visible");
assert(html.indexOf(S.sci(S.A_PER_MSUN, 6)) !== -1, "recomputed coefficient A");
assert(html.indexOf(S.sci(S.B_PER_MSUN, 6)) !== -1, "recomputed coefficient B");
assert(html.indexOf("Timmes") !== -1, "fiducial source");
assert(html.indexOf("Suntzeff") !== -1 && html.indexOf("0.055") !== -1, "1987A range");
assert(html.indexOf("Arnett") !== -1, "Arnett named");
assert(html.indexOf("diffusion") !== -1, "diffusion is named as missing");
assert(html.indexOf("Full gamma-ray trapping") !== -1 || html.indexOf("full gamma-ray trapping") !== -1, "trapping named");
assert(html.indexOf("−19.25") !== -1, "candle is the sourced mean");
assert(html.indexOf("Richardson") !== -1, "candle source");
assert(html.indexOf("/science/astronomy/distance-ladder/") !== -1, "distance-ladder link");
assert(html.indexOf("/science/astronomy/compact-stars/") !== -1, "compact-stars link");
assert(html.indexOf("/science/astronomy/stellar-lifetime/") !== -1, "stellar-lifetime link");
assert(html.indexOf("Educational calculator") !== -1, "educational disclaimer");
assert(html.indexOf("not a light-curve fit") !== -1 || html.indexOf("Not a radiative-transfer model") !== -1, "fit refused");
assert(html.indexOf("https://doi.org/10.1086/192008") !== -1, "Nadyozhin doi");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/supernovae/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/supernovae/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/supernovae/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/supernovae/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/supernovae/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/supernovae/") found = true;
  });
});
assert(found, "whats-new lists the desk");
var ladder = fs.readFileSync(path.join(__dirname, "../distance-ladder/index.html"), "utf8");
assert(ladder.indexOf("/science/astronomy/supernovae/") !== -1, "distance ladder points here");
var compact = fs.readFileSync(path.join(__dirname, "../compact-stars/index.html"), "utf8");
assert(compact.indexOf("/science/astronomy/supernovae/") !== -1, "compact stars points here");
var life = fs.readFileSync(path.join(__dirname, "../stellar-lifetime/index.html"), "utf8");
assert(life.indexOf("/science/astronomy/supernovae/") !== -1, "stellar lifetime points here");

console.log("supernovae.test.js: ok");
console.log("day 24.25, 0.6 Msun", open.text.total, open.text.ratio, open.text.frac);
console.log("A", S.sci(S.A_PER_MSUN, 6), "B", S.sci(S.B_PER_MSUN, 6));
