/* Eddington-limit checks. Luminosities come from 4π G M m_p c / σ_T.
   Run: node science/astronomy/accretion/accretion.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var A = require("./accretion.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(A.C === 299792458, "exact c");
assert(A.G === 6.67430e-11, "CODATA G");
assert(A.M_P === 1.67262192595e-27, "CODATA proton mass");
assert(A.SIGMA_T === 6.6524587051e-29, "CODATA Thomson cross section");
assert(A.GM_SUN === 1.3271244e20, "IAU GM sun");
assert(A.L_SUN_W === 3.828e26, "IAU nominal luminosity");
assert(A.YEAR_S === 365.25 * 86400, "Julian year");
assert(near(A.M_SUN_KG, A.GM_SUN / A.G, 0), "solar mass quotient");
assert(A.M_MIN === 1 && A.M_MAX === 1e10, "mass window");
assert(A.EPS_DEFAULT === 0.1, "default efficiency");
assert(A.LAMBDA_DEFAULT === 1, "default Eddington ratio");
assert(near(A.EPS_SCHW, 1 - Math.sqrt(8 / 9), 0), "Schwarzschild binding energy");
assert(near(A.EPS_KERR, 1 - 1 / Math.sqrt(3), 0), "Kerr binding energy");
assert(A.EPS_MAX === A.EPS_KERR, "slider tops out at the Kerr value");
assert(A.formatEps(A.EPS_SCHW) === "0.0571910", "Schwarzschild digits");
assert(A.formatEps(A.EPS_KERR) === "0.422650", "Kerr digits");
assert(A.CYG_M === 21.2 && A.SGR_M === 4.297e6 && A.M87_M === 6.5e9, "cited central masses");
assert(A.SEED_EXAMPLE === 100 && A.TARGET_EXAMPLE === 1e9, "classroom seed");

function handLedd(mSolar) {
  return 4 * Math.PI * A.G * (mSolar * A.M_SUN_KG) * A.M_P * A.C / A.SIGMA_T;
}

var one = A.eddingtonWatts(1);
assert(near(one, handLedd(1), 0), "L_Edd is the formula");
assert(near(one, 1.26e31, 1.26e31 * 0.005), "one solar mass is about 1.26e31 W");
assert(A.sci(one, 6) === "1.25707 × 10³¹", "printed watts");
assert(A.sci(one / A.L_SUN_W, 6) === "3.28387 × 10⁴", "printed solar luminosities");
assert(near(A.eddingtonWatts(21.2), 21.2 * one, one * 1e-12), "luminosity scales with mass");
assert(near(A.accretionWatts(1, 1), one, 0), "λ = 1 is the limit");
assert(near(A.accretionWatts(4.297e6, 0.2), 0.2 * A.eddingtonWatts(4.297e6), one), "λ scales the light");

var mdot = A.supplyKgS(1, 0.1, 1);
assert(near(mdot, one / (0.1 * A.C * A.C), Math.abs(mdot) * 1e-12), "Ṁ_Edd = L_Edd / (ε c²)");
assert(near(0.1 * mdot * A.C * A.C, one, one * 1e-12), "L = ε Ṁ c² closes");
assert(A.sci(mdot * A.YEAR_S / A.M_SUN_KG, 6) === "2.21980 × 10⁻⁸", "solar masses per year");

var tS = A.salpeterSeconds(0.1, 1);
var handT = (0.1 / 0.9) * A.SIGMA_T * A.C / (4 * Math.PI * A.G * A.M_P);
assert(near(tS, handT, handT * 1e-12), "Salpeter time is ε/(1−ε) times the Eddington time");
assert(near(tS / A.YEAR_S, 4.5e7, 6e6), "about 4.5e7 years, the ε/(1−ε) value sits near 5.0e7");
assert(tS / A.YEAR_S > 4.9e7 && tS / A.YEAR_S < 5.1e7, "the (1−ε) time is about 50 million years");
var tEps = A.epsilonOnlySeconds(0.1, 1);
assert(near(tEps / A.YEAR_S, 4.50490e7, 1e3), "the ε-only product is the 45 million year figure");
assert(tS > tEps, "the page does not drop (1−ε)");
assert(near(A.salpeterSeconds(0.1, 2) * 2, tS, tS * 1e-12), "time scales as 1/λ");
assert(!isFinite(A.salpeterSeconds(1, 1)), "ε = 1 does not grow");

var grown = A.growth(100, 1e9, 0.1, 1);
assert(grown && near(grown.efolds, Math.log(1e7), 1e-12), "e-folds are ln(target/seed)");
assert(near(grown.seconds, grown.efolds * tS, tS * 1e-9), "time is e-folds times the Salpeter time");
assert(A.formatCount(grown.efolds) === "16.1181", "printed e-folds");
assert(A.growth(1e9, 100, 0.1, 1) === null, "a target below the seed is refused");
assert(A.growth(10, 10, 0.1, 1) === null, "equal masses are not a growth");

var curve = A.samples(51, 1);
assert(curve.length === 51, "mass samples");
assert(curve[0].mass === 1 && curve[curve.length - 1].mass === 1e10, "endpoints");
var i;
for (i = 1; i < curve.length; i++) {
  assert(curve[i].mass > curve[i - 1].mass, "mass increases");
  assert(curve[i].ledd > curve[i - 1].ledd, "L_Edd increases");
  assert(near(curve[i].lacc, curve[i].ledd, curve[i].ledd * 1e-12), "λ = 1 lies on the limit");
}
assert(near(A.logMap(A.logUnmap(21.2, A.M_MIN, A.M_MAX), A.M_MIN, A.M_MAX), 21.2, 1e-9), "mass log round trip");
assert(A.logMap(0, A.M_MIN, A.M_MAX) === 1, "slider start");
assert(A.logMap(1, A.M_MIN, A.M_MAX) === 1e10, "slider end");

assert(!isFinite(A.eddingtonWatts(0)), "non-positive mass is not a luminosity");
assert(A.scene({ mass: 0.5 }).ok === false, "below the slider");
assert(A.scene({ mass: 1e10 + 1 }).ok === false, "above the slider");
assert(A.scene({ eps: 0.001 }).ok === false, "efficiency below the slider");
assert(A.scene({ eps: 0.5 }).ok === false, "efficiency above the Kerr value");
assert(A.scene({ lambda: 0 }).ok === false && A.scene({ lambda: 11 }).ok === false, "lambda window");
assert(A.scene({ preset: "nope" }).ok === false, "unknown preset");
assert(A.parseNum("4.297e6") === 4.297e6, "parses scientific mass");
assert(!isFinite(A.parseNum("sun")), "a word is not a mass");
assert(!isFinite(A.parseNum("")), "empty is refused");

var open = A.scene();
assert(open.preset === "sun" && open.mass === 1 && open.eps === 0.1 && open.lambda === 1, "opening is the Sun");
assert(open.seed === 100 && open.target === 1e9, "opening growth is the classroom span");
assert(open.text.ledd === "1.25707 × 10³¹ W", "opening watts");
assert(open.text.salpeter === "5.00545 × 10⁷ yr", "opening e-folding");
assert(A.scene({ preset: "cyg" }).mass === 21.2, "Cygnus button");
assert(A.scene({ preset: "sgr" }).mass === 4.297e6, "Sgr A* button");
assert(A.scene({ preset: "m87" }).mass === 6.5e9, "M87* button");
var q = A.scene({ preset: "quasar" });
assert(q.mass === 1e9 && q.seed === 100 && q.target === 1e9 && q.preset === "quasar", "seed button");
assert(q.text.why.indexOf("not a published mass") !== -1, "the seed is not a catalog object");
assert(q.text.grow.indexOf("not a named quasar") !== -1, "growth copy refuses a named quasar");
assert(A.scene({ mass: 21.2 }).text.why.indexOf("not the observed") !== -1, "Cygnus point is the limit");
assert(A.scene({ mass: 3 }).preset === "" && A.scene({ mass: 3 }).text.why.indexOf("not a catalog") !== -1, "slider mass");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/accretion/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf("subnav-desk{display:none}") !== -1, "desktop nav hides on a phone");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("accretion.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(A.LIMITS) !== -1, "disclaimer on the page");
assert(html.indexOf(open.text.ledd) !== -1, "opening luminosity");
assert(html.indexOf(open.text.lsun) !== -1, "opening solar luminosities");
assert(html.indexOf(open.text.salpeter) !== -1, "opening e-folding");
assert(html.indexOf(open.text.growth) !== -1, "opening growth");
assert(html.indexOf(open.text.aria) !== -1, "opening chart label");
assert(html.indexOf(open.text.why) !== -1, "opening why");
assert(html.indexOf('id="curve"') !== -1, "chart canvas");
assert(html.indexOf('data-preset="sun"') !== -1, "Sun button");
assert(html.indexOf('data-preset="cyg"') !== -1, "Cygnus button");
assert(html.indexOf('data-preset="sgr"') !== -1, "Sgr A* button");
assert(html.indexOf('data-preset="m87"') !== -1, "M87 button");
assert(html.indexOf('data-preset="quasar"') !== -1, "seed button");
assert(html.indexOf("21.2") !== -1 && html.indexOf("4.297") !== -1 && html.indexOf("6.5") !== -1, "cited digits");
assert(html.indexOf("Miller-Jones") !== -1, "Cygnus source");
assert(html.indexOf("GRAVITY") !== -1, "Sgr A* source");
assert(html.indexOf("EHT") !== -1, "M87 source");
assert(html.indexOf("Salpeter") !== -1, "Salpeter named");
assert(html.indexOf("Frank, King") !== -1, "accretion textbook");
assert(html.indexOf("Rybicki") !== -1, "Thomson textbook");
assert(html.indexOf("6.6524587051") !== -1, "Thomson cross section digits");
assert(html.indexOf("1.67262192595") !== -1, "proton mass digits");
assert(html.indexOf("Educational calculator") !== -1, "educational disclaimer");
assert(html.indexOf("Not a disk model") !== -1 || html.indexOf("not a disk model") !== -1, "disk refused");
assert(html.indexOf("super-Eddington") !== -1 || html.indexOf("Super-Eddington") !== -1, "super-Eddington named");
assert(html.indexOf("/science/astronomy/black-holes/") !== -1, "black-hole link");
assert(html.indexOf("/science/astronomy/compact-stars/") !== -1, "compact-star link");
assert(html.indexOf("/science/astronomy/supernovae/") !== -1, "supernova link");
assert(html.indexOf("https://doi.org/10.1086/147973") !== -1, "Salpeter doi");
assert(html.indexOf("approximate") !== -1, "presets labeled approximate");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/accretion/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/accretion/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/accretion/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/accretion/") !== -1, "search index");
var searchJson = JSON.parse(search);
assert(searchJson.count === searchJson.pages.length, "search count matches pages");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/accretion/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/accretion/") found = true;
  });
});
assert(found, "whats-new lists the desk");
var holes = fs.readFileSync(path.join(__dirname, "../black-holes/index.html"), "utf8");
assert(holes.indexOf("/science/astronomy/accretion/") !== -1, "black holes point here");
var compact = fs.readFileSync(path.join(__dirname, "../compact-stars/index.html"), "utf8");
assert(compact.indexOf("/science/astronomy/accretion/") !== -1, "compact stars point here");
var sn = fs.readFileSync(path.join(__dirname, "../supernovae/index.html"), "utf8");
assert(sn.indexOf("/science/astronomy/accretion/") !== -1, "supernovae point here");

console.log("accretion.test.js: ok");
console.log("1 Msun", open.text.ledd, open.text.lsun, open.text.salpeter);
console.log("growth", open.text.growth);
