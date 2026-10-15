/* C3 checks against NASA NSSDCA fact-sheet inputs and the sister desks.
   Run: node science/astronomy/c3/c3.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var C = require("./c3.js");
var Rocket = require("../rocket/rocket.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

var MU = C.FACT.earthGm;
var RE = C.FACT.earthRadiusKm;

assert(near(MU, 0.39860 * 1e6, 1e-9), "Earth GM is 0.39860 × 10^6 km^3/s^2");
assert(RE === 6371, "Earth volumetric mean radius is 6,371 km");
assert(C.FACT.earthSiderealHours === 23.9345, "sidereal rotation is 23.9345 h");
assert(C.G0_MPS2 === 9.80665, "g0 is 9.80665 m/s^2");

var surfaceEsc = C.escapeSpeed(MU, RE);
assert(C.fmtSpeed(surfaceEsc) === "11.186 km/s", "surface escape " + C.fmtSpeed(surfaceEsc));
assert(C.roundTo(surfaceEsc, 3) === C.FACT.surfaceEscapeKmS, "surface escape matches the sheet");
assert(near(surfaceEsc, C.circular(MU, RE) * Math.SQRT2, 1e-9), "escape is circular times √2");
assert(C.fmtSpeed(C.circular(MU, RE)) === "7.910 km/s", "surface circular " + C.fmtSpeed(C.circular(MU, RE)));

var r400 = RE + C.CLASSROOM_ALT_KM;
assert(r400 === 6771, "400 km classroom radius is 6,771 km");
var barely = C.atAltitude(400, 0);
assert(barely && barely.parabolic, "C3 = 0 is the parabola");
assert(barely.e === 1, "parabola eccentricity is 1");
assert(barely.vInf === 0, "barely escape has v∞ = 0");
assert(barely.eps === 0, "parabola specific energy is 0");
assert(C.fmtSpeed(barely.vc) === "7.673 km/s", "400 km circular " + C.fmtSpeed(barely.vc));
assert(C.fmtSpeed(barely.vesc) === "10.851 km/s", "400 km escape " + C.fmtSpeed(barely.vesc));
assert(C.fmtSpeed(barely.vp) === "10.851 km/s", "C3 = 0 periapsis speed is escape");
assert(near(barely.vp, barely.vesc, 1e-12), "vp equals escape when v∞ is 0");
assert(C.fmtSpeed(barely.dv) === "3.178 km/s", "C3 = 0 Δv " + C.fmtSpeed(barely.dv));
assert(near(barely.dv, barely.vc * (Math.SQRT2 - 1), 1e-12), "escape Δv is vc(√2 − 1)");
assert(C.fmtEnergy(barely.parkingEps) === "−29.434 km²/s²", "parking energy " + C.fmtEnergy(barely.parkingEps));
assert(C.fmtFrac(barely.stage450.remaining) === "0.4867", "450 s at C3 = 0 " + C.fmtFrac(barely.stage450.remaining));
assert(C.fmtFrac(barely.stage300.remaining) === "0.3395", "300 s at C3 = 0 " + C.fmtFrac(barely.stage300.remaining));
assert(near(barely.stage450.remaining, Rocket.evaluate(barely.dv, 450).remaining, 0), "450 s matches the rocket equation at the unrounded Δv");
assert(near(barely.stage300.remaining, Rocket.evaluate(barely.dv, 300).remaining, 0), "300 s matches the rocket equation");
assert(C.fmtFrac(Rocket.evaluate(3.178, 450).remaining) === "0.4867", "printed 3.178 km/s still formats as 0.4867");

var mild = C.atAltitude(400, 9);
assert(C.fmtC3(mild.c3) === "9.000 km²/s²", "mild C3");
assert(C.fmtSpeed(mild.vInf) === "3.000 km/s", "mild v∞ " + C.fmtSpeed(mild.vInf));
assert(near(mild.c3, mild.vInf * mild.vInf, 1e-12), "C3 = v∞²");
assert(near(mild.eps, mild.c3 / 2, 0), "ε = C3/2");
assert(C.fmtEnergy(mild.eps) === "4.500 km²/s²", "hyperbola energy");
assert(near(mild.vp * mild.vp / 2 - MU / r400, mild.eps, 1e-9), "ε = vp²/2 − μ/r");
assert(near(mild.c3, 2 * mild.eps, 1e-12), "C3 = 2ε");
assert(C.fmtSpeed(mild.vp) === "11.258 km/s", "mild periapsis " + C.fmtSpeed(mild.vp));
assert(near(mild.vp, Math.sqrt(9 + 2 * MU / r400), 1e-12), "vp = √(v∞² + 2μ/r)");
assert(C.fmtSpeed(mild.dv) === "3.585 km/s", "mild Δv " + C.fmtSpeed(mild.dv));
assert(near(mild.dv, mild.vp - mild.vc, 0), "Δv is vp − vc");
assert(C.fmtE(mild.e) === "1.1529", "mild eccentricity " + C.fmtE(mild.e));
assert(near(mild.e, 1 + r400 * 9 / MU, 1e-12), "e = 1 + r C3/μ");
assert(C.fmtFrac(mild.stage450.remaining) === "0.4438", "mild 450 s " + C.fmtFrac(mild.stage450.remaining));
assert(C.fmtFrac(mild.stage300.remaining) === "0.2956", "mild 300 s " + C.fmtFrac(mild.stage300.remaining));
assert(C.fmtRatio(mild.stage450.ratio) === "2.253", "mild 450 s ratio " + C.fmtRatio(mild.stage450.ratio));
assert(mild.dv > barely.dv, "a positive C3 costs more Δv than escape");

var fromV = C.evaluate({ altKm: 400, vInf: 3 });
assert(near(fromV.c3, 9, 1e-12), "v∞ = 3 km/s derives C3 = 9");
assert(near(fromV.dv, mild.dv, 0), "the v∞ path matches the C3 path");

var rGeo = C.geoRadiusKm(MU, C.FACT.earthSiderealHours);
assert(C.fmtDist(rGeo) === "42,164.190 km", "geosynchronous radius " + C.fmtDist(rGeo));
assert(C.fmtAlt(rGeo - RE) === "35,793.190 km", "geosynchronous altitude " + C.fmtAlt(rGeo - RE));
var T = C.FACT.earthSiderealHours * 3600;
var period = 2 * Math.PI * Math.sqrt(rGeo * rGeo * rGeo / MU);
assert(near(period, T, 1e-4), "geosynchronous period matches 23.9345 h");

var higher = C.atAltitude(rGeo - RE, 9);
assert(C.fmtSpeed(higher.vc) === "3.075 km/s", "higher circular " + C.fmtSpeed(higher.vc));
assert(C.fmtSpeed(higher.vesc) === "4.348 km/s", "higher escape " + C.fmtSpeed(higher.vesc));
assert(C.fmtSpeed(higher.vp) === "5.283 km/s", "higher periapsis " + C.fmtSpeed(higher.vp));
assert(C.fmtSpeed(higher.dv) === "2.208 km/s", "higher Δv " + C.fmtSpeed(higher.dv));
assert(higher.dv < mild.dv, "the same C3 costs more Δv from the lower circle");
assert(C.fmtE(higher.e) === "1.9520", "higher eccentricity " + C.fmtE(higher.e));
assert(C.fmtEnergy(higher.parkingEps) === "−4.727 km²/s²", "higher parking energy " + C.fmtEnergy(higher.parkingEps));
assert(higher.parkingEps > barely.parkingEps, "the higher circle is less negative");
assert(C.fmtFrac(higher.stage450.remaining) === "0.6063", "higher 450 s " + C.fmtFrac(higher.stage450.remaining));
assert(C.fmtFrac(higher.stage300.remaining) === "0.4721", "higher 300 s " + C.fmtFrac(higher.stage300.remaining));

var pair = C.classroomPair(9);
assert(pair && pair.low.dv > pair.high.dv, "classroom pair keeps the low orbit more expensive");
assert(C.fmtSpeed(C.classroomPair(0).high.dv) === "1.274 km/s", "C3 = 0 on the higher circle " + C.fmtSpeed(C.classroomPair(0).high.dv));

var list = C.presets();
assert(list.length === 3, "three classroom presets");
assert(list[0].id === "barely" && list[0].c3 === 0 && list[0].altKm === 400, "preset 1 is C3 = 0 at 400 km");
assert(list[1].id === "mild" && list[1].c3 === 9 && list[1].altKm === 400, "preset 2 is C3 = 9 at 400 km");
assert(list[2].id === "higher" && list[2].c3 === 9 && near(list[2].altKm, rGeo - RE, 1e-6), "preset 3 is the same C3 on the higher circle");

assert(C.evaluate({ altKm: -1, c3: 0 }) === null, "altitude below the floor is rejected");
assert(C.evaluate({ altKm: 400, c3: -0.1 }) === null, "negative C3 is still bound and is rejected");
assert(C.evaluate({ altKm: 400, vInf: -1 }) === null, "negative v∞ is rejected");
assert(C.atAltitude(0, 0).onFloor, "altitude 0 is the soft floor");
assert(C.fmtSpeed(C.atAltitude(0, 0).dv) === "3.276 km/s", "surface escape burn from a circular orbit " + C.fmtSpeed(C.atAltitude(0, 0).dv));
assert(near(C.atAltitude(0, 0).vesc, 11.186, 5e-4), "altitude 0 escape is the sheet figure");

var geo = C.hyperbolaGeometry(r400, mild.e);
assert(geo && geo.thetaInf > Math.PI / 2 && geo.thetaInf < Math.PI, "asymptote anomaly is obtuse for a mild hyperbola");
assert(near(geo.centerX - geo.a, r400, 1e-6), "periapsis is one semimajor axis from the hyperbola center");
var far = C.conicPoint(r400, mild.e, geo.thetaInf * 0.995);
assert(far && far.r > r400 * 5, "the branch runs out toward the asymptote");
assert(C.asymptoteResidual(r400, mild.e, geo.thetaInf * 0.995) / far.r < 1e-3, "a far point sits near the asymptote");
assert(C.hyperbolaGeometry(r400, 1) === null, "a parabola has no hyperbola center");
var peri = C.conicPoint(r400, mild.e, 0);
assert(peri && near(peri.x, r400, 1e-6) && near(peri.y, 0, 1e-9), "periapsis is on the +x axis");
var step = C.conicPoint(r400, mild.e, 0.05);
assert(step && step.y > 0, "positive true anomaly leaves prograde, upward");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("c3-help") !== -1, "help control is present");
assert(html.indexOf("Not a mission") !== -1, "not a mission");
assert(html.indexOf("Horizons") !== -1, "Horizons disclaimer");
assert(html.indexOf("launch window") !== -1, "launch-window disclaimer");
assert(html.indexOf("point-mass") !== -1, "point-mass disclaimer");
assert(html.indexOf("no atmosphere") !== -1, "no atmosphere");
assert(html.indexOf("impulsive") !== -1, "impulsive burn");
assert(html.indexOf("11.186") !== -1, "surface escape");
assert(html.indexOf("7.673") !== -1, "400 km circular");
assert(html.indexOf("10.851") !== -1, "400 km escape");
assert(html.indexOf("3.178") !== -1, "C3 = 0 Δv");
assert(html.indexOf("3.585") !== -1, "mild Δv");
assert(html.indexOf("2.208") !== -1, "higher-circle Δv");
assert(html.indexOf("0.4867") !== -1, "450 s escape fraction");
assert(html.indexOf("0.3395") !== -1, "300 s escape fraction");
assert(html.indexOf("0.4438") !== -1, "mild 450 s fraction");
assert(html.indexOf("0.2956") !== -1, "mild 300 s fraction");
assert(html.indexOf("9.80665") !== -1, "g0");
assert(html.indexOf("0.39860") !== -1, "Earth GM");
assert(html.indexOf("6,371.000") !== -1, "volumetric radius");
assert(html.indexOf("6,771") !== -1, "classroom radius");
assert(html.indexOf("42,164.190") !== -1, "geosynchronous radius");
assert(html.indexOf("35,793.190") !== -1, "geosynchronous altitude");
assert(html.indexOf("23.9345") !== -1, "sidereal period");
assert(html.indexOf("does not print") !== -1, "400 km is not on the fact sheet");
assert(html.indexOf("classroom example") !== -1, "classroom label");
assert(html.indexOf("/science/astronomy/escape/") !== -1, "links Escape");
assert(html.indexOf("/science/astronomy/hohmann/") !== -1, "links Hohmann");
assert(html.indexOf("/science/astronomy/vis-viva/") !== -1, "links vis-viva");
assert(html.indexOf("/science/astronomy/oberth/") !== -1, "links Oberth");
assert(html.indexOf("/science/astronomy/rocket/") !== -1, "links Rocket");
assert(html.indexOf("/science/astronomy/gravity-assist/") !== -1, "links gravity assist");
assert(html.indexOf("/science/astronomy/hill/") !== -1, "links Hill");
assert(html.indexOf("/science/astronomy/") !== -1, "links the astronomy hub");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html") !== -1, "Earth fact sheet");
assert(html.indexOf("heliocentric") !== -1, "heliocentric picture is named as a different one");
assert(html.indexOf("not an Earth-relative C3") !== -1 || html.indexOf("not this page’s C3") !== -1, "Hohmann is not called a C3");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("/js/sp-theme-boot.js") !== -1, "theme boot");
assert(html.indexOf("/style.css") !== -1, "site stylesheet");
assert(html.indexOf("Bebas+Neue") !== -1, "display face");
assert(html.indexOf("IBM+Plex+Mono") !== -1, "mono face");
assert(html.indexOf("c3.js") !== -1, "math module");
assert(html.indexOf("data-preset") !== -1, "preset buttons");
assert(html.indexOf("ArrowLeft") !== -1, "arrow keys");

console.log("c3 tests ok");
console.log("C3=0", C.fmtSpeed(barely.dv), "mf", C.fmtFrac(barely.stage450.remaining), C.fmtFrac(barely.stage300.remaining));
console.log("C3=9", C.fmtSpeed(mild.dv), C.fmtSpeed(mild.vp), "higher", C.fmtSpeed(higher.dv));
