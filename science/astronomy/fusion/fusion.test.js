/* Mass-defect checks against AME2020 atomic masses and 2022 CODATA.
   Run: node science/astronomy/fusion/fusion.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var F = require("./fusion.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(F.U_C2_MEV === 931.49410372, "CODATA MeV per u");
assert(F.U_KG === 1.66053906892e-27, "CODATA kg per u");
assert(F.C_M_S === 299792458, "exact c");
assert(F.E_C === 1.602176634e-19, "exact e");
assert(F.L_SUN_W === 3.828e26, "IAU nominal luminosity");

assert(F.nuclideById("h1").uText === "1.007825031898", "printed ¹H mass");
assert(F.nuclideById("he4").uText === "4.00260325413", "printed ⁴He mass");
assert(F.nuclideById("h2").uText === "2.014101777844", "printed ²H mass");
assert(F.nuclideById("h3").uText === "3.01604928132", "printed ³H mass");
assert(F.nuclideById("n").uText === "1.00866491590", "printed neutron mass");
assert(F.nuclideById("c12").u === 12, "¹²C is exactly 12 u");
assert(F.nuclideById("ni62").ameBeKeV === 8794.5555, "AME ⁶²Ni keV per nucleon");
assert(F.nuclideById("fe56").ameBeKeV === 8790.3563, "AME ⁵⁶Fe keV per nucleon");
assert(F.nuclideById("fe58").ameBeKeV === 8792.2534, "AME ⁵⁸Fe keV per nucleon");

/* Hand arithmetic: 4 × 1.007825031898 − 4.00260325413 = 0.028696873462 u. */
var ppDm = 4 * F.nuclideById("h1").u - F.nuclideById("he4").u;
assert(near(ppDm, 0.028696873462, 1e-12), "pp Δm " + ppDm);
var pp = F.qValue("pp");
assert(near(pp.dmU, ppDm, 0), "pp uses the atomic masses");
assert(near(pp.mev, ppDm * F.U_C2_MEV, 0), "pp MeV is Δm × uc²");
assert(near(pp.mev, 26.7, 0.05), "pp net is the 26.7 MeV round " + pp.mev);
assert(F.formatMeV(pp.mev) === "26.7310 MeV", "format pp " + F.formatMeV(pp.mev));
assert(F.formatU(pp.dmU) === "0.02869687 u", "format pp Δm " + F.formatU(pp.dmU));
assert(F.formatPercent(pp.fraction) === "0.712%", "fraction " + F.formatPercent(pp.fraction));
assert((pp.fraction * 100).toFixed(1) === "0.7", "one-decimal percent is 0.7");
assert(F.qValue("cno").mev === pp.mev, "CNO net matches pp net");

/* D+T: 2.014101777844 + 3.01604928132 − 4.00260325413 − 1.00866491590. */
var dtDm = F.nuclideById("h2").u + F.nuclideById("h3").u - F.nuclideById("he4").u - F.nuclideById("n").u;
var dt = F.qValue("dt");
assert(near(dt.dmU, dtDm, 1e-12), "dt masses " + dt.dmU + " vs " + dtDm);
assert(near(dt.mev, 17.6, 0.05), "D+T is the 17.6 MeV round " + dt.mev);
assert(F.formatMeV(dt.mev) === "17.5893 MeV", "format dt " + F.formatMeV(dt.mev));

var ddn = F.qValue("ddn");
var ddp = F.qValue("ddp");
assert(F.formatMeV(ddn.mev) === "3.2689 MeV", "D+D neutron branch " + F.formatMeV(ddn.mev));
assert(F.formatMeV(ddp.mev) === "4.0327 MeV", "D+D proton branch " + F.formatMeV(ddp.mev));
assert(ddn.mev > 0 && ddp.mev > 0, "both D+D branches release energy");

var tri = F.qValue("3a");
assert(F.formatMeV(tri.mev) === "7.2747 MeV", "triple-alpha " + F.formatMeV(tri.mev));
assert(tri.mev > 0, "net triple-alpha is exothermic");
var be8 = F.beryllium8Q();
assert(be8.mev < 0, "⁸Be is above two alphas " + be8.mev);
assert(F.formatMeV(be8.mev) === "−0.0918 MeV", "format ⁸Be step " + F.formatMeV(be8.mev));

/* Joules from Δm c² and from Q × e agree far inside the CODATA uncertainty. */
assert(near(pp.joules, pp.dmU * F.U_KG * F.C_M_S * F.C_M_S, 0), "joules are Δm c²");
var viaE = pp.mev * 1e6 * F.E_C;
assert(Math.abs(pp.joules - viaE) / pp.joules < 1e-9, "MeV×e matches Δm c²");
assert(F.formatJ(pp.joules) === "4.2828×10⁻¹² J", "format pp joules " + F.formatJ(pp.joules));

/* Recomputed BE/A stays with the AME2020 column. The gap is the
   evaluation's energy unit versus the 2022 CODATA MeV-per-u. */
var rows = F.curve();
assert(rows.length === 27, "curve length");
assert(rows[0].id === "h2" && rows[rows.length - 1].id === "u238", "curve order");
var k;
for (k = 0; k < rows.length; k++) {
  var deltaKeV = (rows[k].perAMeV - rows[k].amePerAMeV) * 1000;
  assert(Math.abs(deltaKeV) < 0.001, rows[k].id + " BE/A versus AME " + deltaKeV);
}
var fe = F.binding("fe56");
var fe58 = F.binding("fe58");
var ni = F.binding("ni62");
assert(fe.perAMeV < fe58.perAMeV && fe58.perAMeV < ni.perAMeV, "⁵⁶Fe < ⁵⁸Fe < ⁶²Ni");
assert(F.peak().id === "ni62", "peak is ⁶²Ni");
assert(F.formatMeV(ni.perAMeV) === "8.7946 MeV", "format peak " + F.formatMeV(ni.perAMeV));
assert(F.formatMeV(fe.perAMeV) === "8.7904 MeV", "format ⁵⁶Fe " + F.formatMeV(fe.perAMeV));
assert(F.binding("h1").mev === 0, "¹H binding is zero by the formula");
assert(F.binding("n") == null, "a free neutron has no binding row");

var sun = F.solar(1);
assert(sun.watts === F.L_SUN_W, "one nominal sun");
assert(near(sun.massKgS, F.L_SUN_W / (F.C_M_S * F.C_M_S), 0), "mass rate is L/c²");
assert(near(sun.hydrogenKgS, sun.massKgS / sun.fraction, 1e-3), "hydrogen is the mass rate over the fraction");
assert(near(sun.heliumKgS, sun.hydrogenKgS - sun.massKgS, 1e-2), "helium is hydrogen minus the defect");
assert(F.formatRate(sun.massKgS) === "4.259×10⁹ kg/s", "format mass rate " + F.formatRate(sun.massKgS));
assert(F.formatRate(sun.hydrogenKgS) === "5.983×10¹¹ kg/s", "format hydrogen " + F.formatRate(sun.hydrogenKgS));
assert(F.formatSci(sun.watts, 4) === "3.828×10²⁶", "format watts " + F.formatSci(sun.watts, 4));
assert(F.solar(0.01) != null && F.solar(100) != null, "slider ends");
assert(F.solar(0.009) == null && F.solar(101) == null && F.solar("1") == null, "rejected luminosity");
assert(near(F.luminosityFromSlider(0), 0.01, 1e-12), "slider floor");
assert(near(F.luminosityFromSlider(1000), 100, 1e-9), "slider ceiling");
assert(near(F.luminosityFromSlider(F.sliderFromLuminosity(1)), 1, 1e-9), "slider round trip");
assert(near(F.solar(10).massKgS, sun.massKgS * 10, sun.massKgS * 1e-12), "rates scale with luminosity");

assert(F.reactions().length === 6, "six reactions");
assert(F.explain("pp").indexOf("26.7310 MeV") !== -1, "pp prose");
assert(F.explain("pp").indexOf("26.7 MeV") !== -1, "pp round number");
assert(F.explain("dt").indexOf("17.5893 MeV") !== -1 && F.explain("dt").indexOf("17.6 MeV") !== -1, "dt prose");
assert(F.explain("cno").indexOf("99%") !== -1 && F.explain("cno").indexOf("T^18") !== -1, "CNO prose");
assert(F.explain("3a").indexOf("−0.0918 MeV") !== -1, "beryllium step in the prose");
assert(F.curveNote("ni62").indexOf("highest") !== -1, "peak note");
assert(F.curveNote("u238").indexOf("Fission") !== -1, "fission note");
assert(F.solarNote(1).indexOf("0.7%") !== -1 && F.solarNote(1).indexOf("4.259×10⁹ kg/s") !== -1, "solar prose");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/fusion/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("fusion.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf("26.7310") !== -1, "pp MeV on the page");
assert(html.indexOf("17.5893") !== -1, "D+T MeV on the page");
assert(html.indexOf("0.712%") !== -1 && html.indexOf("0.7%") !== -1, "efficiency on the page");
assert(html.indexOf("3.828") !== -1, "nominal luminosity");
assert(html.indexOf("931.49410372") !== -1, "CODATA MeV per u");
assert(html.indexOf("1.007825031898") !== -1, "hydrogen mass shown");
assert(html.indexOf("8794.5555") !== -1 && html.indexOf("8790.3563") !== -1, "AME peak keV");
assert(html.indexOf("8792.2534") !== -1, "⁵⁸Fe between them");
assert(html.indexOf("Educational") !== -1, "educational label");
assert(html.indexOf("Not a stellar-evolution model") !== -1, "disclaimer");
assert(html.indexOf("Adelberger") !== -1, "names Adelberger");
assert(html.indexOf("AME2020") !== -1 || html.indexOf("AME 2020") !== -1, "names the mass evaluation");
assert(html.indexOf("/science/astronomy/stellar-lifetime/") !== -1, "lifetime link");
assert(html.indexOf("/science/astronomy/hr/") !== -1, "HR link");
assert(html.indexOf("/science/standard-model/") !== -1, "standard-model link");
assert(html.indexOf(F.explain("pp")) !== -1, "pp explanation is on the page");
assert(html.indexOf(F.solarNote(1)) !== -1, "solar explanation is on the page");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/fusion/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/fusion/") !== -1, "science index links the desk");
var life = fs.readFileSync(path.join(__dirname, "../stellar-lifetime/index.html"), "utf8");
assert(life.indexOf("/science/astronomy/fusion/") !== -1, "lifetime cross-link");
var hr = fs.readFileSync(path.join(__dirname, "../hr/index.html"), "utf8");
assert(hr.indexOf("/science/astronomy/fusion/") !== -1, "HR cross-link");
var sm = fs.readFileSync(path.join(__dirname, "../../standard-model/index.html"), "utf8");
assert(sm.indexOf("/science/astronomy/fusion/") !== -1, "standard-model cross-link");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/fusion/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/fusion/") !== -1, "search index");

console.log("fusion.test.js: ok");
console.log("pp", F.formatMeV(pp.mev), "dt", F.formatMeV(dt.mev), "3a", F.formatMeV(tri.mev));
console.log("fraction", F.formatPercent(pp.fraction), "mass", F.formatRate(sun.massKgS), "hydrogen", F.formatRate(sun.hydrogenKgS));
