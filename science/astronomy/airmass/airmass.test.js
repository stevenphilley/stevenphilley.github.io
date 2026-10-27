/* Airmass, extinction, and refraction checks.
   Kasten & Young 1989 Table II, Bennett 1982, Sæmundsson 1986,
   and the Krisciunas extinction slopes.
   Run: node science/astronomy/airmass/airmass.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var A = require("./airmass.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(A.KY_A === 0.50572 && A.KY_B === 6.07995 && A.KY_C === 1.6364, "Kasten & Young coefficients");
assert(A.P_STD === 1010 && A.T_STD === 10, "standard air");
assert(A.T_NUM === 283 && A.T_ZERO === 273, "Meeus temperature constants");
assert(A.HORIZON_REFRACTION_ARCMIN === 34, "almanac horizon refraction");
assert(A.SOLAR_SEMIDIAMETER_ARCMIN === 16, "solar semi-diameter");
assert(A.SUNRISE_ALT_DEG === -0.833, "NOAA sunrise altitude");

/* Zenith is about 1. Thirty degrees of altitude is about 2.
   The horizon stays near 38. sec(z) does not. */
assert(near(A.kastenYoung(90), 1, 0.001), "zenith airmass " + A.kastenYoung(90));
assert(near(A.kastenYoung(30), 2, 0.01), "30° airmass " + A.kastenYoung(30));
assert(A.kastenYoung(0) > 37 && A.kastenYoung(0) < 39, "horizon airmass " + A.kastenYoung(0));
assert(A.planeParallel(90) === 1, "sec 0");
assert(near(A.planeParallel(30), 2, 1e-12), "sec 60°");
assert(A.planeParallel(0) === Infinity, "plane-parallel horizon");
assert(A.planeParallel(10) > A.kastenYoung(10), "sec(z) already high at 10°");

/* The paper’s r is essentially (table − formula) / table, in percent.
   This evaluation stays within 0.02 percentage points of the printed r. */
A.TABLE.forEach(function (row) {
  var f = A.kastenYoung(row.alt);
  var rel = (f - row.m) / row.m * 100;
  assert(Math.abs(rel + row.rPercent) < 0.02, row.alt + "° relative error " + rel + " vs printed " + row.rPercent);
});
assert(A.tableAt(0).m === 38.0868, "table horizon");
assert(A.tableAt(30).m === 1.9939, "table 30°");
assert(A.tableAt(90).m === 1, "table zenith");

/* Bennett at the apparent horizon is about 34.5′, inside 34′ to 35′.
   At the zenith the residual is far under 0.01′. */
var horizonR = A.bennettArcmin(0);
assert(horizonR > 34 && horizonR < 35, "Bennett horizon " + horizonR);
assert(Math.abs(A.bennettArcmin(90)) < 0.01, "Bennett zenith " + A.bennettArcmin(90));
assert(near(A.bennettArcmin(45), 1.0, 0.05), "Bennett 45° " + A.bennettArcmin(45));
assert(A.pressureFactor(1010, 10) === 1, "standard factor");
assert(near(A.bennettArcmin(0, 2020, 10), 2 * horizonR, 1e-9), "pressure doubles refraction");
assert(A.bennettArcmin(0, 1010, 0) > horizonR, "colder air refracts more");

/* Sæmundsson from the true altitude that Bennett implies agrees closely. */
[0, 5, 10, 30, 60, 90].forEach(function (h) {
  var b = A.bennettArcmin(h);
  var tru = h - b / 60;
  var s = A.saemundssonArcmin(tru);
  assert(Math.abs(b - s) < 0.1, h + "° Bennett and Sæmundsson differ by " + (b - s));
});

/* Setting Sun: center one semi-diameter up, so the lower limb is at 0°.
   Vertical diameter comes out shorter than the about-32′ horizontal. */
var setAlt = A.presetById("setting-sun").altitudeDeg;
assert(near(setAlt, 16 / 60, 0), "setting Sun is 16′");
var vert = A.sunVerticalArcmin(0);
assert(vert < 32 && vert > 24, "flattened vertical diameter " + vert);
var roundZenith = A.sunVerticalArcmin(90 - 16 / 60);
assert(near(roundZenith, 32, 0.05), "zenith disk is round " + roundZenith);

/* Extinction. Summit V is 0.11. Hazy sea-level V is 0.341.
   Vega at the horizon on the summit stays brighter than 6.5 and
   fainter than an inner-city 4.0. Polaris crosses 6.0. */
assert(A.bandOn(A.siteById("summit"), "V").k === 0.11, "summit V");
assert(A.bandOn(A.siteById("summit"), "B").k === 0.19, "summit B");
assert(A.bandOn(A.siteById("sea-haze"), "V").k === 0.341, "hazy V");
assert(A.bandOn(A.siteById("sea-clear"), "V").k === 0.187, "clearer sea-level V");
assert(A.bandOn(A.siteById("mid"), "V").k === 0.172, "2800 m V");

function rowAt(alt, objectId, siteId, bandId, limit) {
  return A.compute({
    altitudeDeg: alt,
    objectId: objectId,
    siteId: siteId,
    bandId: bandId,
    limit: limit == null ? 6 : limit,
    pressureHpa: 1010,
    tempC: 10
  });
}

var vega30 = rowAt(30, "vega", "summit", "V", 6);
assert(vega30, "vega 30 computes");
assert(near(vega30.deltaMag, 0.11 * A.kastenYoung(30), 0), "dimming is k times airmass");
assert(near(vega30.extinctedV, 0.03 + vega30.deltaMag, 0), "Vega after extinction");
assert(vega30.visible === true, "Vega at 30° is above magnitude 6");
assert(near(vega30.fluxFactor, Math.pow(10, 0.4 * vega30.deltaMag), 0), "Pogson factor");

var vegaH = rowAt(0, "vega", "summit", "V", 6);
assert(vegaH.extinctedV > 4 && vegaH.extinctedV < 4.5, "Vega horizon summit " + vegaH.extinctedV);
assert(vegaH.visible === true, "still above 6.0");
assert(rowAt(0, "vega", "summit", "V", 4).visible === false, "lost at the inner-city 4.0");

var polH = rowAt(0, "polaris", "summit", "V", 6);
assert(polH.extinctedV > 6 && polH.extinctedV < 6.5, "Polaris horizon " + polH.extinctedV);
assert(polH.visible === false, "Polaris drops past 6.0");
assert(rowAt(0, "polaris", "summit", "V", 6.5).visible === true, "Polaris still inside 6.5");

var sunHaze = rowAt(0, "sun", "sea-haze", "V", 6);
assert(sunHaze.extinctedV < -12, "hazy horizon Sun still brilliant " + sunHaze.extinctedV);
assert(sunHaze.extinctedV < A.objectById("moon").v, "still brighter than the catalog full Moon " + sunHaze.extinctedV);
assert(sunHaze.visible === true, "Sun stays above the naked-eye limit");

var siriusHaze = rowAt(0, "sirius", "sea-haze", "V", 6.5);
assert(siriusHaze.extinctedV > 6.5, "Sirius lost on the hazy horizon " + siriusHaze.extinctedV);

/* A non-V band does not invent a stellar magnitude. */
var bBand = rowAt(30, "vega", "summit", "B", 6);
assert(bBand.visual === false && bBand.extinctedV == null, "B does not rewrite V");
assert(near(bBand.deltaMag, 0.19 * A.kastenYoung(30), 0), "B dimming");
assert(bBand.deltaMag > vega30.deltaMag, "B dims more than V");

/* Rejected controls. */
assert(A.compute({ altitudeDeg: -1, objectId: "vega", siteId: "summit", bandId: "V", limit: 6, pressureHpa: 1010, tempC: 10 }) == null, "below horizon");
assert(A.compute({ altitudeDeg: 91, objectId: "vega", siteId: "summit", bandId: "V", limit: 6, pressureHpa: 1010, tempC: 10 }) == null, "past zenith");
assert(A.compute({ altitudeDeg: 30, objectId: "vega", siteId: "summit", bandId: "U", limit: 6, pressureHpa: 1010, tempC: 10 }) == null, "no U coefficient");
assert(A.PRESETS.length === 5, "five presets");
assert(A.presetById("horizon").altitudeDeg === 0, "horizon preset");
assert(A.presetById("thirty").altitudeDeg === 30, "30° preset");

assert(A.formatAirmass(A.kastenYoung(90)).indexOf("0.9997") === 0 || A.formatAirmass(A.kastenYoung(90)) === "0.9997", "format zenith " + A.formatAirmass(A.kastenYoung(90)));
assert(A.formatAirmass(A.kastenYoung(30)) === "1.9943", "format 30° " + A.formatAirmass(A.kastenYoung(30)));
assert(A.formatAirmass(A.kastenYoung(0)) === "37.92", "format horizon " + A.formatAirmass(A.kastenYoung(0)));
assert(A.formatAirmass(Infinity) === "unbounded", "format sec horizon");
assert(A.formatArcmin(horizonR) === "34.5′", "format Bennett horizon " + A.formatArcmin(horizonR));
assert(A.formatMag(0.03) === "+0.03", "format Vega");
assert(A.formatMag(-26.74) === "−26.74", "format Sun");
assert(A.formatAltitude(16 / 60) === "16′", "format setting Sun altitude");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/airmass/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("airmass.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf("/science/astronomy/twilight/") !== -1, "twilight link");
assert(html.indexOf("/science/astronomy/magnitude/") !== -1, "magnitude link");
assert(html.indexOf("/science/astronomy/local-sky/") !== -1, "local-sky link");
assert(html.indexOf("/science/astronomy/telescope/") !== -1, "telescope link");
assert(html.indexOf("/science/light-pollution/") !== -1, "light-pollution link");
assert(html.indexOf("/science/atmosphere/") !== -1, "atmosphere link");
assert(html.indexOf("Kasten") !== -1 && html.indexOf("Young") !== -1, "names Kasten and Young");
assert(html.indexOf("0.50572") !== -1, "airmass coefficient");
assert(html.indexOf("6.07995") !== -1, "airmass offset");
assert(html.indexOf("1.6364") !== -1, "airmass exponent");
assert(html.indexOf("38.0868") !== -1, "table horizon");
assert(html.indexOf("Bennett") !== -1, "names Bennett");
assert(html.indexOf("7.31") !== -1 && html.indexOf("4.4") !== -1, "Bennett constants");
assert(html.indexOf("Sæmundsson") !== -1 || html.indexOf("Saemundsson") !== -1, "names Sæmundsson");
assert(html.indexOf("1.02") !== -1 && html.indexOf("10.3") !== -1 && html.indexOf("5.11") !== -1, "Sæmundsson constants");
assert(html.indexOf("1010") !== -1, "standard pressure");
assert(html.indexOf("34") !== -1 && html.indexOf("16") !== -1 && html.indexOf("0.833") !== -1, "sunrise allowance");
assert(html.indexOf("Krisciunas") !== -1, "names Krisciunas");
assert(html.indexOf("0.11") !== -1 && html.indexOf("0.341") !== -1, "V slopes");
assert(html.indexOf("0.19") !== -1, "summit B");
assert(html.indexOf("Not a forecast") !== -1, "disclaimer");
assert(html.indexOf("Educational") !== -1, "educational label");

console.log("airmass.test.js: ok");
console.log("zenith", A.formatAirmass(A.kastenYoung(90)), "30°", A.formatAirmass(A.kastenYoung(30)), "horizon", A.formatAirmass(A.kastenYoung(0)));
console.log("Bennett horizon", A.formatArcmin(horizonR), "vertical at limb 0", vert.toFixed(2) + "′");
