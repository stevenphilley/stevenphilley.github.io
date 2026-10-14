/* Rocket-equation checks.
   g0 = 9.80665 m/s² exactly.
   Δv figures are the printed Oberth and Hohmann numbers, not new missions.
   Run: node science/astronomy/rocket/rocket.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var R = require("./rocket.js");
var O = require("../oberth/oberth.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(R.G0_MPS2 === 9.80665, "g0 is 9.80665 m/s²");
assert(R.G0_KMS2 === 9.80665e-3, "g0 in km/s² is 9.80665e-3");
assert(near(R.G0_MPS2 / 1000, R.G0_KMS2, 0), "m/s² and km/s² are the same constant");

assert(R.PRINTED.escapeFrom400KmS === 3.178, "escape Δv is the printed 3.178 km/s");
assert(R.PRINTED.earthMarsKmS === 5.594, "Hohmann Δv is the printed 5.594 km/s");

var leo = O.burn(O.FACT.earthGm, O.FACT.earthRadiusKm + 400, 0);
assert(O.fmtSpeed(leo.dvEsc) === "3.178 km/s", "Oberth desk still prints 3.178 km/s, got " + O.fmtSpeed(leo.dvEsc));
assert(R.fmtDv(R.PRINTED.escapeFrom400KmS) === O.fmtSpeed(leo.dvEsc), "rocket preset matches the Oberth print");

var sunMu = 132712 * 1e6;
var rEarth = 149598000;
var rMars = 227956000;
var at = (rEarth + rMars) / 2;
var vc1 = Math.sqrt(sunMu / rEarth);
var vc2 = Math.sqrt(sunMu / rMars);
var vt1 = Math.sqrt(sunMu * (2 / rEarth - 1 / at));
var vt2 = Math.sqrt(sunMu * (2 / rMars - 1 / at));
var hohmann = Math.abs(vt1 - vc1) + Math.abs(vt2 - vc2);
assert(R.fmtDv(hohmann) === "5.594 km/s", "Hohmann inputs still round to 5.594 km/s, got " + R.fmtDv(hohmann));
assert(R.fmtDv(R.PRINTED.earthMarsKmS) === "5.594 km/s", "printed Earth–Mars figure");

var isp = 450;
var dv = 3.178;
var g0 = 9.80665e-3;
var ve = isp * g0;
var remain = Math.exp(-dv / (isp * g0));
var ratio = Math.exp(dv / ve);
var prop = 1 - remain;

assert(near(R.veFromIsp(450), ve, 0), "ve = Isp · g0");
assert(near(R.veFromIsp(450), 4.4129925, 0), "450 s exhaust speed is 4.4129925 km/s");
assert(near(450 * 9.80665, 4412.9925, 1e-9), "450 × 9.80665 m/s² = 4,412.9925 m/s");
assert(R.fmtVe(R.veFromIsp(450)) === "4.413 km/s", "ve rounds to 4.413 km/s");
assert(R.fmtVeMS(450 * R.G0_MPS2) === "4,412.9925 m/s", "unrounded m/s print");
assert(near(R.ispFromVe(R.veFromIsp(450)), 450, 1e-9), "Isp and ve convert both ways");

var m = R.evaluate(dv, isp);
assert(m && !m.overflow, "3.178 km/s at 450 s evaluates");
assert(near(m.remaining, remain, 0), "mf/m0 = exp(−Δv/(Isp·g0))");
assert(near(m.remaining, 0.4866810736647581, 1e-15), "full-precision remaining fraction");
assert(near(m.ratio, ratio, 0), "R = exp(Δv/ve)");
assert(near(m.propellant, prop, 1e-15), "propellant fraction is 1 − mf/m0");
assert(near(m.ratio * m.remaining, 1, 1e-12), "R · (mf/m0) = 1");
assert(near(m.propellant + m.remaining, 1, 1e-12), "fractions sum to 1");
assert(near(m.ve * Math.log(m.ratio), dv, 1e-12), "Δv = ve · ln(R)");
assert(R.fmtFrac(m.remaining) === "0.4867", "remaining prints 0.4867, got " + R.fmtFrac(m.remaining));
assert(R.fmtFrac(m.propellant) === "0.5133", "propellant prints 0.5133, got " + R.fmtFrac(m.propellant));
assert(R.fmtRatio(m.ratio) === "2.055", "mass ratio prints 2.055, got " + R.fmtRatio(m.ratio));
assert(R.fmtPct(m.propellant) === "51.33%", "propellant percent");
assert(R.fmtPct(m.remaining) === "48.67%", "remaining percent");
assert(R.fmtIsp(450) === "450 s", "450 s label");

var chem = R.evaluate(3.178, 300);
assert(R.fmtVe(chem.ve) === "2.942 km/s", "300 s ve " + R.fmtVe(chem.ve));
assert(near(300 * 9.80665, 2941.995, 1e-9), "300 × 9.80665 = 2,941.995 m/s");
assert(R.fmtRatio(chem.ratio) === "2.945", "300 s escape mass ratio " + R.fmtRatio(chem.ratio));
assert(R.fmtFrac(chem.remaining) === "0.3395", "300 s escape remaining " + R.fmtFrac(chem.remaining));
assert(R.fmtPct(chem.propellant) === "66.05%", "300 s escape propellant percent");

var mars450 = R.evaluate(5.594, 450);
assert(R.fmtRatio(mars450.ratio) === "3.552", "450 s Hohmann mass ratio " + R.fmtRatio(mars450.ratio));
assert(R.fmtFrac(mars450.remaining) === "0.2815", "450 s Hohmann remaining " + R.fmtFrac(mars450.remaining));
assert(R.fmtPct(mars450.propellant) === "71.85%", "450 s Hohmann propellant percent");

var mars300 = R.evaluate(5.594, 300);
assert(R.fmtRatio(mars300.ratio) === "6.695", "300 s Hohmann mass ratio " + R.fmtRatio(mars300.ratio));
assert(R.fmtFrac(mars300.remaining) === "0.1494", "300 s Hohmann remaining " + R.fmtFrac(mars300.remaining));
assert(R.fmtPct(mars300.propellant) === "85.06%", "300 s Hohmann propellant percent");
assert(near(mars300.propellant + mars300.remaining, 1, 1e-12), "Hohmann 300 s fractions sum to 1");

var rows = R.classroomRows();
assert(rows.length === 4, "two printed Δv values times two classroom Isp values");
assert(rows[0].dv === 3.178 && rows[0].isp === 300, "first comparison row");
assert(rows[3].dv === 5.594 && rows[3].isp === 450, "last comparison row");

var zero = R.evaluate(0, 450);
assert(zero.ratio === 1, "zero Δv has mass ratio 1");
assert(zero.propellant === 0, "zero Δv burns no propellant");
assert(zero.remaining === 1, "zero Δv keeps the initial mass");
assert(R.fmtPct(zero.propellant) === "0.00%", "zero propellant percent");

assert(R.evaluate(-1, 450) === null, "negative Δv is rejected");
assert(R.evaluate(3, 0) === null, "zero Isp is rejected");
assert(R.evaluate(3, -10) === null, "negative Isp is rejected");

var big = R.evaluate(30, 20);
assert(big && big.overflow, "an extreme ratio is flagged instead of printed as a fake mass");
assert(R.fmtRatio(big.ratio) === "—", "overflow has no mass-ratio print");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("9.80665") !== -1, "page states g0");
assert(html.indexOf("3.178") !== -1, "page reuses 3.178 km/s");
assert(html.indexOf("5.594") !== -1, "page reuses 5.594 km/s");
assert(html.indexOf("0.4867") !== -1, "page prints the 450 s check fraction");
assert(html.indexOf("classroom example") !== -1, "Isp examples are labeled classroom examples");
assert(html.indexOf("no gravity") !== -1, "page says there are no gravity losses");
assert(html.indexOf("no drag") !== -1, "page says there is no drag");
assert(html.indexOf("Not a mission") !== -1, "page says it is not a mission");
assert(html.indexOf("/science/astronomy/escape/") !== -1, "links to Escape");
assert(html.indexOf("/science/astronomy/hohmann/") !== -1, "links to Hohmann");
assert(html.indexOf("/science/astronomy/oberth/") !== -1, "links to Oberth");
assert(html.indexOf("/science/astronomy/vis-viva/") !== -1, "links to vis-viva");
assert(html.indexOf("9.820") !== -1, "page distinguishes fact-sheet surface gravity");
assert(html.indexOf("rocket-help") !== -1, "help control is present");

console.log("ok");
