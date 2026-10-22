/* Schwarzschild black-hole checks: IAU nominal GM☉, CODATA 2022 G,
   exact SI constants, radii, tide, Hawking temperature, evaporation time,
   and cited preset masses.
   Run: node science/astronomy/black-holes/black-holes.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var BH = require("./black-holes.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(BH.C === 299792458, "exact c");
assert(BH.H === 6.62607015e-34, "exact h");
assert(BH.K === 1.380649e-23, "exact k");
assert(near(BH.HBAR, BH.H / (2 * Math.PI), 0), "hbar is h/2pi");
assert(BH.G === 6.67430e-11, "CODATA 2022 G");
assert(BH.GM_SUN === 1.3271244e20, "IAU nominal GM sun");
assert(BH.AU === 149597870700, "exact AU");
assert(BH.G0 === 9.80665, "standard gravity");
assert(BH.JULIAN_YEAR_S === 31557600, "Julian year");
assert(BH.BODY_M === 2, "2 m body");
assert(BH.M_MIN === 1 && BH.M_MAX === 1e10, "mass window");
assert(BH.R_MIN === 1.2 && BH.R_MAX === 30 && BH.R_DEFAULT === 10, "observer window");
assert(BH.PHOTON_FACTOR === 1.5 && BH.ISCO_FACTOR === 3, "orbit factors");
assert(near(BH.EVAP_COEFF, 5120 * Math.PI, 0), "evaporation coefficient");

var rs = BH.schwarzschildRadius(1);
assert(near(rs / 1000, 2.953, 0.001), "solar Schwarzschild radius is about 2.95 km, got " + (rs / 1000));
assert(near(rs, 2 * BH.GM_SUN / (BH.C * BH.C), 0), "rs = 2GM/c^2");
assert(near(BH.photonSphere(1), 1.5 * rs, 0), "photon sphere is 1.5 rs");
assert(near(BH.isco(1), 3 * rs, 0), "ISCO is 3 rs");
assert(near(BH.schwarzschildRadius(10), 10 * rs, 1e-6), "radii scale with mass");

var rho = BH.meanDensity(1);
var closed = 3 * Math.pow(BH.C, 6) / (32 * Math.PI * BH.G * BH.GM_SUN * BH.GM_SUN);
assert(near(rho, closed, closed * 1e-12), "density matches the closed form");
assert(near(BH.meanDensity(10), rho / 100, rho * 1e-12), "density scales as 1/M^2");

assert(BH.timeDilation(1) !== BH.timeDilation(1), "horizon factor is not defined for a static observer");
assert(near(BH.timeDilation(10), Math.sqrt(0.9), 1e-15), "factor at 10 rs");
assert(near(BH.timeDilation(1.2), Math.sqrt(1 - 1 / 1.2), 1e-15), "factor at 1.2 rs");
assert(BH.timeDilation(10) < 1 && BH.timeDilation(30) > BH.timeDilation(10), "farther clocks run closer to the distant rate");

var tide = BH.tidalAcceleration(1, 2);
assert(near(tide, 2 * BH.GM_SUN * 2 / (rs * rs * rs), 0), "tide is 2GM L / r^3 at the horizon");
assert(near(tide, BH.C * BH.C * 2 / (rs * rs), tide * 1e-12), "horizon tide is c^2 L / rs^2");
assert(near(BH.tidalAcceleration(10, 2), tide / 100, tide * 1e-12), "tide scales as 1/M^2");

var temp = BH.hawkingTemperature(1);
var tempClosed = BH.HBAR * Math.pow(BH.C, 3) / (8 * Math.PI * BH.GM_SUN * BH.K);
assert(near(temp, tempClosed, tempClosed * 1e-12), "Hawking temperature");
assert(near(BH.hawkingTemperature(10), temp / 10, temp * 1e-12), "temperature scales as 1/M");

var seconds = BH.evaporationSeconds(1);
var years = BH.evaporationYears(1);
var mass = BH.GM_SUN / BH.G;
var evapClosed = 5120 * Math.PI * BH.G * BH.G * mass * mass * mass / (BH.HBAR * Math.pow(BH.C, 4));
assert(near(seconds, evapClosed, evapClosed * 1e-12), "evaporation seconds");
assert(near(years, seconds / 31557600, years * 1e-12), "Julian years");
assert(years > 1e67 && years < 1e68, "solar-mass lifetime is order 10^67 years, got " + years);
assert(near(BH.evaporationYears(10), years * 1000, years), "lifetime scales as M^3");

var model = BH.compute(1, 10);
assert(model && near(model.rs, rs, 0) && near(model.dilation, Math.sqrt(0.9), 1e-15), "compute at the default observer");
assert(BH.compute(0.5, 10) == null, "below the slider");
assert(BH.compute(1e10 + 1, 10) == null, "above the slider");
assert(BH.compute(1, 1) == null, "on the horizon");
assert(BH.compute(1, 1.2) && BH.compute(1e10, 30), "endpoints are allowed");

assert(near(BH.logMap(BH.logUnmap(21.2, BH.M_MIN, BH.M_MAX), BH.M_MIN, BH.M_MAX), 21.2, 1e-9), "mass log round trip");
assert(BH.logMap(0, BH.M_MIN, BH.M_MAX) === 1, "slider start");
assert(BH.logMap(1, BH.M_MIN, BH.M_MAX) === 1e10, "slider end is exact");
assert(BH.compute(BH.logMap(1, BH.M_MIN, BH.M_MAX), 10), "the top of the slider still computes");

assert(BH.formatLength(rs) === "2.953 km", "display the solar radius");
assert(BH.formatLength(1.5 * rs) === "4.430 km", "photon sphere display");
assert(BH.formatLength(3 * rs) === "8.860 km", "ISCO display");
assert(BH.formatFactor(Math.sqrt(0.9)) === "0.9487", "dilation display");
assert(BH.formatTemp(temp).indexOf("6.170×10^-8") === 0, "temperature display " + BH.formatTemp(temp));
assert(BH.formatYears(years).indexOf("2.095×10^67") === 0, "lifetime display " + BH.formatYears(years));
assert(BH.formatDensity(rho).indexOf("1.843×10^19") === 0, "density display");
assert(BH.formatTide(tide).indexOf("2.061×10^10") === 0, "tide display " + BH.formatTide(tide));
assert(BH.formatLength(BH.schwarzschildRadius(4.297e6)).indexOf("0.08483 AU") === 0, "Sgr A* radius");
assert(BH.formatLength(BH.schwarzschildRadius(6.5e9)).indexOf("128.3 AU") === 0, "M87* radius");
assert(BH.formatMass(1) === "1" && BH.formatMass(21.2) === "21.2", "mass text keeps cited digits");

var ids = ["m1", "m10", "cyg-x1", "sgr-a", "m87"];
var list = BH.presets();
assert(list.length === 5, "five presets");
ids.forEach(function (id, i) {
  assert(list[i].id === id, "order " + id);
  assert(list[i].M >= BH.M_MIN && list[i].M <= BH.M_MAX, id + " on the slider");
  assert(list[i].why && list[i].note && list[i].massText, id + " has copy");
  assert(BH.compute(list[i].M, BH.R_DEFAULT), id + " computes");
});

var sun = BH.presetById("m1");
var ten = BH.presetById("m10");
var cyg = BH.presetById("cyg-x1");
var sgr = BH.presetById("sgr-a");
var m87 = BH.presetById("m87");
assert(sun.M === 1 && sun.kind === "computed", "1 solar mass");
assert(ten.M === 10 && ten.kind === "computed", "10 solar masses");
assert(cyg.M === 21.2 && cyg.dM === 2.2, "Cygnus X-1");
assert(sgr.M === 4.297e6 && sgr.dM === 0.012e6 && sgr.dMSys === 40000, "Sagittarius A*");
assert(m87.M === 6.5e9 && m87.dMStat === 0.2e9 && m87.dMSys === 0.7e9, "M87*");
assert(BH.meanDensity(m87.M) < 1000, "M87* mean density is below water");
assert(BH.tidalAcceleration(sgr.M, 2) < BH.G0, "Sgr A* horizon tide is under 1 g");
assert(BH.tidalAcceleration(1, 2) > 1e9 * BH.G0, "solar-mass horizon tide is enormous");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/black-holes/") !== -1, "canonical path");
assert(html.indexOf("/science/astronomy/escape/") !== -1, "escape link");
assert(html.indexOf("/science/astronomy/stellar-lifetime/") !== -1, "stellar-lifetime link");
assert(html.indexOf("/science/gravity/") !== -1, "gravity link");
assert(html.indexOf("/science/astronomy/redshift/") !== -1, "redshift link");
assert(html.indexOf("2.953") !== -1, "solar radius digits");
assert(html.indexOf("4.297") !== -1, "Sgr A* digits");
assert(html.indexOf("6.5") !== -1, "M87 digits");
assert(html.indexOf("21.2") !== -1, "Cygnus X-1 digits");
assert(html.indexOf("6.67430") !== -1, "CODATA G");
assert(html.indexOf("1.3271244") !== -1, "IAU GM");
assert(html.indexOf("Schwarzschild") !== -1, "names the geometry");
assert(html.indexOf("Kerr") !== -1, "names spin");
assert(html.indexOf("order of magnitude") !== -1, "evaporation caveat");
assert(html.indexOf("data-preset=\"m1\"") !== -1, "1 solar mass button");
assert(html.indexOf("data-preset=\"sgr-a\"") !== -1, "Sgr A* button");
assert(html.indexOf("data-preset=\"m87\"") !== -1, "M87 button");
assert(html.indexOf("aria-current=\"page\"") !== -1, "current nav item");
assert(html.indexOf("black-holes.js") !== -1, "math module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");

console.log("rs km", rs / 1000);
console.log("rho", rho);
console.log("tide m/s2", tide, "g", tide / BH.G0);
console.log("T", temp);
console.log("years", years);
console.log("sgr rs", BH.formatLength(BH.schwarzschildRadius(sgr.M)));
console.log("m87 rs", BH.formatLength(BH.schwarzschildRadius(m87.M)));
console.log("black-holes.test.js ok");
