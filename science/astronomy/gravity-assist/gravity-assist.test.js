/* Gravity-assist checks against NASA NSSDCA fact-sheet inputs.
   The turn is δ = 2 arcsin(1/e). The heliocentric change is V_p plus the
   rotated v∞. Classroom 5 km/s and the matched periapsis ratio are examples.
   Run: node science/astronomy/gravity-assist/gravity-assist.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var G = require("./gravity-assist.js");
var R = require("../rocket/rocket.js");
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

assert(G.FACT.sunGm === 132712 * 1e6, "Sun GM");
assert(G.FACT.sunGm === O.FACT.sunGm, "Sun GM matches the Oberth desk");
assert(G.FACT.earthGm === 0.39860 * 1e6, "Earth GM");
assert(G.FACT.earthGm === O.FACT.earthGm, "Earth GM matches the Oberth desk");
assert(G.FACT.venusGm === 0.32486 * 1e6, "Venus GM");
assert(G.FACT.marsGm === 0.042828 * 1e6, "Mars GM");
assert(G.FACT.jupiterGm === 126.687 * 1e6, "Jupiter GM");
assert(G.FACT.earthRadiusKm === 6371, "Earth volumetric radius");
assert(G.FACT.venusRadiusKm === 6051.8, "Venus volumetric radius");
assert(G.FACT.marsRadiusKm === 3389.5, "Mars volumetric radius");
assert(G.FACT.jupiterRadiusKm === 69911, "Jupiter volumetric radius");
assert(G.FACT.jupiterEqRadiusKm - G.FACT.jupiterRadiusKm === 1581, "Jupiter 1-bar radius is 1,581 km outside the volumetric radius");
assert(G.FACT.earthAKm === 149.598e6, "Earth semimajor axis");
assert(G.FACT.venusAKm === 108.210e6, "Venus semimajor axis");
assert(G.FACT.marsAKm === 227.956e6, "Mars semimajor axis");
assert(G.FACT.jupiterAKm === 778.479e6, "Jupiter semimajor axis");
assert(G.FACT.earthMeanKmS === 29.78, "Earth sheet mean");
assert(G.FACT.venusMeanKmS === 35.02, "Venus sheet mean");
assert(G.FACT.marsMeanKmS === 24.08, "Mars sheet mean");
assert(G.FACT.jupiterMeanKmS === 13.06, "Jupiter sheet mean");
assert(G.G0_MPS2 === 9.80665, "g0 matches the rocket desk");
assert(G.G0_MPS2 === R.G0_MPS2, "same g0 constant");
assert(G.CLASSROOM_VINF === 5, "classroom excess is 5 km/s");
assert(G.CLASSROOM_EARTH_ALT === 400, "classroom Earth altitude is 400 km");

var earth = G.bodyById("earth");
var venus = G.bodyById("venus");
var mars = G.bodyById("mars");
var jupiter = G.bodyById("jupiter");
assert(earth.classroomAltKm === 400, "Earth classroom altitude is exactly 400 km");
assert(near(venus.classroomAltKm, 6051.8 * 400 / 6371, 0), "Venus altitude keeps the Earth periapsis ratio");
assert(near(mars.classroomAltKm, 3389.5 * 400 / 6371, 0), "Mars altitude keeps the Earth periapsis ratio");
assert(near(jupiter.classroomAltKm, 69911 * 400 / 6371, 0), "Jupiter altitude keeps the Earth periapsis ratio");
[earth, venus, mars, jupiter].forEach(function (b) {
  assert(near(b.classroomRpKm / b.radiusKm, 6771 / 6371, 1e-12), b.id + " periapsis ratio");
});

var eCheck = 1.7;
assert(near(Math.sin(G.turnAngle(eCheck) / 2), 1 / eCheck, 1e-12), "sin(δ/2) = 1/e");
assert(near(G.turnAngle(eCheck), 2 * G.asymptoteAnomaly(eCheck) - Math.PI, 1e-12), "δ = 2θ∞ − π");
assert(near(G.turnAngle(2), Math.PI / 3, 1e-12), "e = 2 turns 60°");
var mu = G.FACT.earthGm;
var rp = 6771;
var vCirc = Math.sqrt(mu / rp);
assert(near(G.eccentricity(mu, rp, vCirc), 2, 1e-12), "v∞ = √(μ/r_p) gives e = 2");
assert(near(G.periapsisSpeed(mu, rp, 5), Math.sqrt(25 + 2 * mu / rp), 0), "periapsis speed");
assert(near(G.assistMagnitude(5, eCheck), 2 * 5 / eCheck, 0), "assist magnitude is 2 v∞ / e");
assert(near(G.assistMagnitude(5, eCheck), 2 * 5 * Math.sin(G.turnAngle(eCheck) / 2), 1e-12), "assist magnitude is 2 v∞ sin(δ/2)");

var fly = G.classroom("earth", true);
assert(fly, "Earth classroom evaluates");
assert(G.fmtE(fly.e) === "1.4247", "Earth e " + G.fmtE(fly.e));
assert(G.fmtDeg(fly.delta) === "89.16°", "Earth turn " + G.fmtDeg(fly.delta));
assert(G.fmtSpeed(fly.vPeri) === "11.947 km/s", "Earth periapsis speed " + G.fmtSpeed(fly.vPeri));
assert(G.fmtSpeed(fly.vPlanet) === "29.785 km/s", "Earth circular V_p " + G.fmtSpeed(fly.vPlanet));
assert(G.fmtSpeed(O.circular(O.FACT.sunGm, O.FACT.earthAKm)) === G.fmtSpeed(fly.vPlanet), "V_p matches the Oberth circular speed");
assert(G.fmtSpeed(fly.speedIn) === "26.515 km/s", "Earth heliocentric in " + G.fmtSpeed(fly.speedIn));
assert(G.fmtSpeed(fly.speedOut) === "33.484 km/s", "Earth heliocentric out " + G.fmtSpeed(fly.speedOut));
assert(G.fmtSpeed(fly.assist) === "7.019 km/s", "Earth assist " + G.fmtSpeed(fly.assist));
assert(G.fmtEnergy(fly.deltaEnergy) === "209.063 km²/s²", "Earth Δε " + G.fmtEnergy(fly.deltaEnergy));
assert(G.fmtAlt(fly.altKm) === "400 km", "Earth altitude text");
assert(G.fmtDist(fly.rp) === "6,771 km", "Earth periapsis radius");
assert(near(fly.assist, 2 * fly.vInf / fly.e, 1e-9), "printed assist is 2 v∞ / e");
assert(near(fly.deltaEnergy, fly.vPlanet * fly.assist, 1e-6), "aligned Δε = V_p · |Δv|");
assert(near(fly.speedIn * fly.speedIn, fly.vPlanet * fly.vPlanet + 25 - 2 * fly.vPlanet * 5 / fly.e, 1e-6), "inbound speed");
assert(near(fly.speedOut * fly.speedOut, fly.vPlanet * fly.vPlanet + 25 + 2 * fly.vPlanet * 5 / fly.e, 1e-6), "outbound speed");
assert(fly.speedOut > fly.speedIn, "passing behind raises heliocentric speed");
assert(near(Math.hypot(fly.vInfIn.x, fly.vInfIn.y), 5, 1e-12), "inbound excess magnitude");
assert(near(Math.hypot(fly.vInfOut.x, fly.vInfOut.y), 5, 1e-12), "outbound excess magnitude");
assert(fly.vInfIn.x < 0 && fly.vInfOut.x > 0, "pump-up rotates excess from behind V_p to ahead of it");
assert(near(fly.vInfIn.y, fly.vInfOut.y, 1e-9), "the perpendicular component is unchanged");

var down = G.classroom("earth", false);
assert(G.fmtSpeed(down.speedIn) === G.fmtSpeed(fly.speedOut), "passing ahead swaps the inbound speed");
assert(G.fmtSpeed(down.speedOut) === G.fmtSpeed(fly.speedIn), "passing ahead swaps the outbound speed");
assert(G.fmtEnergy(down.deltaEnergy) === "−209.063 km²/s²", "passing ahead lowers the energy");
assert(near(down.assist, fly.assist, 1e-9), "the assist magnitude does not care which way the hyperbola bends");
assert(down.beta === 0 && fly.beta === Math.PI, "ahead is periapsis on +x; behind is periapsis on −x");

var peri = G.hyperbolaPoint(fly.rp, fly.e, 0, fly.beta);
assert(peri && near(peri.x, -fly.rp, 1e-6) && near(peri.y, 0, 1e-6), "pump-up periapsis is behind the planet");
var i;
for (i = 0; i <= 20; i++) {
  var th = -fly.thetaInf * 0.9 + (1.8 * fly.thetaInf) * i / 20;
  var pt = G.hyperbolaPoint(fly.rp, fly.e, th, fly.beta);
  assert(pt && pt.r + 1e-6 >= fly.rp, "hyperbola stays outside periapsis");
}
assert(G.evaluate({ mu: mu, radiusKm: 6371, aKm: G.FACT.earthAKm, vInf: 5, altKm: -1, pumpUp: true }) === null, "periapsis inside the volumetric radius is rejected");
assert(G.evaluate({ mu: mu, radiusKm: 6371, aKm: G.FACT.earthAKm, vInf: 0, altKm: 400, pumpUp: true }) === null, "a zero excess is not a hyperbola");
var floor = G.evaluate({ mu: mu, radiusKm: 6371, eqRadiusKm: G.FACT.earthEqRadiusKm, aKm: G.FACT.earthAKm, vInf: 5, altKm: 0, pumpUp: true });
assert(floor && floor.onFloor && floor.insideEquator, "altitude 0 is the volumetric floor and inside Earth's equatorial radius");
assert(!fly.insideEquator && !fly.onFloor, "the 400 km cartoon clears Earth's equatorial radius");

var vFly = G.classroom("venus", true);
var mFly = G.classroom("mars", true);
var jFly = G.classroom("jupiter", true);
assert(G.fmtDeg(vFly.delta) === "83.97°", "Venus turn " + G.fmtDeg(vFly.delta));
assert(G.fmtDeg(mFly.delta) === "37.60°", "Mars turn " + G.fmtDeg(mFly.delta));
assert(G.fmtDeg(jFly.delta) === "160.50°", "Jupiter turn " + G.fmtDeg(jFly.delta));
assert(jFly.delta > fly.delta && fly.delta > vFly.delta && vFly.delta > mFly.delta, "same ratio and v∞: Jupiter turns more than Earth, Earth more than Venus, Venus more than Mars");
assert(G.fmtSpeed(vFly.vPlanet) === "35.020 km/s", "Venus circular speed " + G.fmtSpeed(vFly.vPlanet));
assert(G.fmtSpeed(mFly.vPlanet) === "24.128 km/s", "Mars circular speed " + G.fmtSpeed(mFly.vPlanet));
assert(G.fmtSpeed(jFly.vPlanet) === "13.057 km/s", "Jupiter circular speed " + G.fmtSpeed(jFly.vPlanet));
assert(G.fmtSpeed(jFly.assist) === "9.855 km/s", "Jupiter assist " + G.fmtSpeed(jFly.assist));
assert(G.fmtSpeed(mFly.assist) === "3.223 km/s", "Mars assist " + G.fmtSpeed(mFly.assist));
assert(G.fmtAlt(vFly.altKm) === "379.959 km", "Venus altitude " + G.fmtAlt(vFly.altKm));
assert(G.fmtAlt(mFly.altKm) === "212.808 km", "Mars altitude " + G.fmtAlt(mFly.altKm));
assert(G.fmtAlt(jFly.altKm) === "4,389.327 km", "Jupiter altitude " + G.fmtAlt(jFly.altKm));
assert(!jFly.insideEquator, "the Jupiter cartoon periapsis is outside the 1-bar equatorial radius");
var deep = G.evaluate({
  mu: jupiter.mu,
  radiusKm: jupiter.radiusKm,
  eqRadiusKm: jupiter.eqRadiusKm,
  aKm: jupiter.aKm,
  vInf: 5,
  altKm: 1000,
  pumpUp: true
});
assert(deep.insideEquator, "1,000 km above Jupiter's volumetric radius is still inside the 1-bar surface");

assert(G.fmtFrac(fly.stage450.remaining) === "0.2038", "450 s remaining " + G.fmtFrac(fly.stage450.remaining));
assert(G.fmtRatio(fly.stage450.ratio) === "4.907", "450 s mass ratio " + G.fmtRatio(fly.stage450.ratio));
assert(G.fmtFrac(fly.stage300.remaining) === "0.0920", "300 s remaining " + G.fmtFrac(fly.stage300.remaining));
var rocketSame = R.evaluate(fly.assist, 450);
assert(near(rocketSame.remaining, fly.stage450.remaining, 0), "ideal stage matches the rocket desk at the unrounded assist");
assert(near(R.evaluate(3.178, 450).remaining, 0.4866810736647581, 1e-15), "the 3.178 km/s check still matches");
assert(G.idealStage(0, 450).remaining === 1, "zero Δv keeps the mass");
assert(G.idealStage(-1, 450) === null, "negative Δv is rejected");
var big = G.idealStage(400, 300);
assert(big && big.overflow, "an extreme rocket ratio is flagged");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("ga-help") !== -1, "help control is present");
assert(html.indexOf("Not a mission planner") !== -1, "mission-planner disclaimer");
assert(html.indexOf("Horizons") !== -1, "Horizons disclaimer");
assert(html.indexOf("patched conics") !== -1, "patched-conics disclaimer");
assert(html.indexOf("baseball") !== -1, "baseball myth");
assert(html.indexOf("1.4247") !== -1, "Earth eccentricity");
assert(html.indexOf("89.16") !== -1, "Earth turn");
assert(html.indexOf("7.019") !== -1, "Earth assist");
assert(html.indexOf("26.515") !== -1, "inbound speed");
assert(html.indexOf("33.484") !== -1, "outbound speed");
assert(html.indexOf("11.947") !== -1, "periapsis speed");
assert(html.indexOf("160.50") !== -1, "Jupiter turn");
assert(html.indexOf("37.60") !== -1, "Mars turn");
assert(html.indexOf("0.2038") !== -1, "rocket comparison");
assert(html.indexOf("9.80665") !== -1, "g0");
assert(html.indexOf("0.39860") !== -1, "Earth GM");
assert(html.indexOf("126.687") !== -1, "Jupiter GM");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf("/science/astronomy/oberth/") !== -1, "links Oberth");
assert(html.indexOf("/science/astronomy/hohmann/") !== -1, "links Hohmann");
assert(html.indexOf("/science/astronomy/escape/") !== -1, "links Escape");
assert(html.indexOf("/science/astronomy/rocket/") !== -1, "links Rocket");
assert(html.indexOf("/science/astronomy/vis-viva/") !== -1, "links vis-viva");
assert(html.indexOf("/science/astronomy/hill/") !== -1, "links Hill");
assert(html.indexOf("/science/astronomy/") !== -1, "links the astronomy index");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html") !== -1, "Earth fact sheet");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html") !== -1, "Venus fact sheet");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html") !== -1, "Mars fact sheet");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html") !== -1, "Jupiter fact sheet");
assert(html.indexOf("https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html") !== -1, "Sun fact sheet");
assert(html.indexOf("classroom example") !== -1, "classroom label");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("/js/sp-theme-boot.js") !== -1, "theme boot");
assert(html.indexOf("/style.css") !== -1, "site stylesheet");
assert(html.indexOf("Bebas+Neue") !== -1, "display face");
assert(html.indexOf("IBM+Plex+Mono") !== -1, "mono face");

console.log("gravity-assist tests ok");
console.log("Earth", G.fmtDeg(fly.delta), G.fmtSpeed(fly.speedIn), "→", G.fmtSpeed(fly.speedOut), "Δv", G.fmtSpeed(fly.assist));
console.log("Jupiter", G.fmtDeg(jFly.delta), "Mars", G.fmtDeg(mFly.delta), "Venus", G.fmtDeg(vFly.delta));
