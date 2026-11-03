/* Gravitational-lensing checks. Angles come from the formulas, not stored results.
   Run: node science/astronomy/lensing/lensing.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var L = require("./lensing.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(L.C_M_S === 299792458, "exact c");
assert(L.GM_SUN === 1.3271244e20, "IAU GM sun");
assert(L.R_SUN_M === 6.957e8, "nominal solar radius");
assert(L.AU_M === 149597870700, "exact AU");
assert(near(L.PC_M, (648000 / Math.PI) * L.AU_M, 0), "parsec from the AU");
assert(L.GM_JUPITER === 126.687e6 * 1e9, "Jupiter fact-sheet GM");
assert(L.R_JUPITER_M === 69911e3, "Jupiter volumetric radius");
assert(L.OGLE_U0 === 0.332 && L.OGLE_TE_DAYS === 11.735, "OGLE single-lens fit");
assert(L.OGLE_AMAX_PRINTED === 3.136 && L.OGLE_AMAX_ERR === 0.044, "OGLE printed Amax");
assert(L.NATURE_U0 === 0.359 && L.NATURE_TE_DAYS === 11.03, "Nature binary-lens parameters are stored, not plotted as the preset");
assert(L.PAPER_EINSTEIN_LIMB === "1.75″" && L.PAPER_NEWTON_LIMB === "0.87″", "1919 paper quotes");
assert(L.SOBRAL_LIMB === "1.98″" && L.YEE_SEPARATION === "1.8″" && L.J1004_SEPARATION === "14.62″", "cited separations");

var sun = L.deflection(1, L.R_SUN_M);
var sunHand = 4 * L.GM_SUN / (L.C_M_S * L.C_M_S * L.R_SUN_M) * L.ARCSEC_PER_RAD;
assert(near(sun.arcsec, sunHand, 0), "sun deflection is the formula");
assert(sun.primary === "1.751″", "sun primary " + sun.primary);
assert(sun.arcsecText === "1.751″", "sun arcsec");
assert(sun.masText === "1,751 mas", "sun mas " + sun.masText);
assert(sun.uasText === "1.751×10⁶ μas", "sun uas " + sun.uasText);
assert(sun.halfText === "0.8756″", "half " + sun.halfText);
assert(near(sun.halfArcsec * 2, sun.arcsec, 1e-12), "half is alpha/2");
assert(sun.arcsec > 1.74 && sun.arcsec < 1.76, "sun near 1.75, got " + sun.arcsec);

var jup = L.deflection(L.GM_JUPITER / L.GM_SUN, L.R_JUPITER_M);
var jupHand = 4 * L.GM_JUPITER / (L.C_M_S * L.C_M_S * L.R_JUPITER_M) * L.ARCSEC_PER_RAD;
assert(near(jup.arcsec, jupHand, 1e-12), "jupiter deflection is the formula");
assert(jup.primary === "16.64 mas", "jupiter primary " + jup.primary);
assert(jup.masText === "16.64 mas" && jup.uasText === "16,640 μas", "jupiter units");

var e = L.einstein(1, 4000, 8000);
var dL = 4000 * L.PC_M;
var dS = 8000 * L.PC_M;
var eHand = Math.sqrt((4 * L.GM_SUN / (L.C_M_S * L.C_M_S)) * (dS - dL) / (dL * dS)) * L.ARCSEC_PER_RAD;
assert(near(e.arcsec, eHand, 0), "einstein radius is the formula");
assert(e.primary === "1.009 mas", "opening theta_E " + e.primary);
assert(e.arcsecText === "0.001009″" && e.uasText === "1,009 μas", "opening units");
assert(e.dLSPc === 4000, "flat D_LS");

var beta = 0.5 * e.radians;
var img = L.imagePositions(beta, e.radians);
function residual(theta) {
  return theta - (e.radians * e.radians) / theta - beta;
}
assert(Math.abs(residual(img.plus)) < 1e-15, "plus image solves the lens equation");
assert(Math.abs(residual(img.minus)) < 1e-15, "minus image solves the lens equation");
assert(Math.abs(img.plus * img.minus + e.radians * e.radians) < 1e-18, "product is minus theta_E squared");
assert(near(img.plus + img.minus, beta, 1e-15), "sum is beta");

var u = 0.5;
var Ahand = (u * u + 2) / (u * Math.sqrt(u * u + 4));
assert(L.magnification(u) === Ahand, "magnification formula");
var mags = L.imageMags(u);
assert(near(mags.plus + mags.minus, Ahand, 1e-12), "absolute magnifications add to A");
assert(near(mags.plus - mags.minus, 1, 1e-12), "absolute magnifications differ by 1");
assert(L.formatMag(Ahand) === "2.183", "format A at u=0.5 " + L.formatMag(Ahand));

var aligned = L.imagePositions(0, e.radians);
assert(near(aligned.plus, e.radians, 0) && near(aligned.minus, -e.radians, 0), "aligned images sit on the ring");
assert(L.magnification(0) === Infinity, "aligned point source is unbounded");

var sc = L.scene(1, 4000, 8000, 0.5);
assert(sc && L.formatMag(sc.mag.total) === "2.183", "opening scene magnification");
var neg = L.scene(1, 4000, 8000, -0.5);
assert(neg.minusRad < 0 && Math.abs(neg.minusRad) > Math.abs(neg.plusRad), "negative offset puts the major image on the source side");

var u0 = L.OGLE_U0;
var tE = L.OGLE_TE_DAYS;
var peak = L.magnification(u0);
assert(L.formatMag(peak) === "3.135", "OGLE recomputed peak " + L.formatMag(peak));
assert(Math.abs(peak - L.OGLE_AMAX_PRINTED) < 0.01, "recomputed peak sits inside the survey uncertainty");
var at = L.uOfTime(u0, 2 * tE, tE);
assert(near(at, Math.sqrt(u0 * u0 + 4), 1e-12), "u(t) at two crossing times");
var pts = L.lightCurve(u0, tE, 201);
assert(pts && pts.length === 201, "curve samples");
assert(near(pts[100].tDays, 0, 1e-9), "middle sample is closest approach");
assert(near(pts[100].A, peak, 1e-12), "peak is on the curve");
assert(pts[0].A < pts[100].A && pts[200].A < pts[100].A, "wings are fainter than the peak");

assert(L.deflection(0, L.R_SUN_M) == null, "zero mass rejected");
assert(L.deflection(1, 0) == null, "zero impact rejected");
assert(L.deflection(1e16, L.R_SUN_M) == null, "mass above the slider rejected");
assert(L.einstein(1, 8000, 4000) == null, "source closer than the lens rejected");
assert(L.einstein(1, 4000, 4000) == null, "equal distances rejected");
assert(L.scene(1, 4000, 8000, 4) == null, "offset past 3 rejected");
assert(L.lightCurve(0, 10) == null, "u0 of 0 rejected");
assert(L.presetById("sun").bMeters === L.R_SUN_M, "sun preset is the limb");
assert(L.presetById("jupiter").bMeters === L.R_JUPITER_M, "jupiter preset is the limb");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/lensing/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("lensing.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("1.3271244") !== -1, "GM on the page");
assert(html.indexOf("299,792,458") !== -1 || html.indexOf("299792458") !== -1, "c on the page");
assert(html.indexOf("695,700") !== -1, "solar radius on the page");
assert(html.indexOf("Not a cosmological lens model") !== -1, "disclaimer");
assert(html.indexOf("Not a fit to the photometry") !== -1, "light-curve disclaimer");
assert(html.indexOf(L.explainSun(sun)) !== -1, "sun explanation is on the page");
assert(html.indexOf(L.explainJupiter(jup)) !== -1, "jupiter explanation is on the page");
assert(html.indexOf(L.explainEinstein(e)) !== -1, "einstein explanation is on the page");
assert(html.indexOf(L.explainScene(sc)) !== -1, "image explanation is on the page");
assert(html.indexOf(L.explainScene(L.scene(1, 4000, 8000, 0))) !== -1, "ring explanation is on the page");
assert(html.indexOf(L.explainOgle()) !== -1, "OGLE explanation is on the page");
assert(html.indexOf(L.explainLimits()) !== -1, "limits note is on the page");
assert(html.indexOf('data-preset="sun"') !== -1 && html.indexOf('data-preset="jupiter"') !== -1, "deflection presets");
assert(html.indexOf('data-curve="ogle"') !== -1, "light-curve preset");
assert(html.indexOf("Q2237+0305") !== -1 && html.indexOf("14.62") !== -1, "cited lenses named, not used as inputs");
assert(html.indexOf("SDSS J1004+4112") !== -1, "cluster named");
assert(html.indexOf("id=\"lens-canvas\"") !== -1 && html.indexOf("id=\"curve-canvas\"") !== -1, "canvases");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/lensing/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/lensing/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/lensing/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/lensing/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/lensing/") !== -1, "html sitemap");
JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));

console.log("lensing.test.js: ok");
console.log("Sun", sun.primary, "half", sun.halfText, "Jupiter", jup.primary, "theta_E", e.primary, "A(0.5)", L.formatMag(Ahand), "OGLE", L.formatMag(peak));
