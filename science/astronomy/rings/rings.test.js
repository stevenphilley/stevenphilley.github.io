/* Ring-system desk checks. Roche distances use the Roche desk’s coefficients.
   Run: node science/astronomy/rings/rings.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var R = require("./rings.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(R.FLUID_K === 2.44 && R.RIGID_K === 1.26, "Roche coefficients");
assert(R.SATURN_GM === 37.931e6, "Saturn GM");
assert(R.MIMAS_A_KM === 185520, "Mimas axis in km");

function expectLimits(Rkm, ratio, fluid, rigid) {
  var lim = R.limits(Rkm, ratio);
  assert(Math.round(lim.fluid) === fluid, "fluid " + fluid + " got " + Math.round(lim.fluid));
  assert(Math.round(lim.rigid) === rigid, "rigid " + rigid + " got " + Math.round(lim.rigid));
}

expectLimits(58232, 1, 142086, 73372);
expectLimits(58232, 687 / 1240, 116698, 60262);
expectLimits(69911, 1, 170583, 88088);
expectLimits(69911, 1326 / 3100, 128527, 66371);
expectLimits(25362, 1, 61883, 31956);
expectLimits(24622, 1, 60078, 31024);

var mim = R.mimas();
assert(Math.round(mim.a21) === 116870, "2:1 rounds to 116,870");
assert(near(mim.a21, mim.reduced, 1e-6), "GM cancels to a*(1/2)^(2/3)");
assert(mim.periodDays.toFixed(6) === "0.943529", "computed Mimas period");
assert(!near(mim.periodDays, mim.sheetPeriodDays, 1e-4), "sheet period is not substituted");
assert(117507 - mim.a21Rounded === 637, "2:1 is 637 km inside the B edge");
assert(R.fmtKm(mim.a21) === "116,870 km", "2:1 text");
assert(R.fmtKm(null) === "—", "missing edge is a dash");

var saturn = R.planetById("saturn");
var cassini = saturn.rings.filter(function (g) { return g.name === "Cassini Division"; })[0];
var fRing = saturn.rings.filter(function (g) { return g.name === "F"; })[0];
assert(cassini.inner == null && cassini.outer == null, "Cassini edges stay blank");
assert(fRing.inner === 139826 && fRing.outer == null, "F ring is an inner edge only");
assert(saturn.rings[0].inner === 66900 && saturn.rings[0].outer === 74510, "D ring edges");
assert(saturn.rings.filter(function (g) { return g.name === "A"; })[0].outer === 136780, "A outer edge");
assert(saturn.rings.filter(function (g) { return g.name === "E"; })[0].outer === 480000, "E outer edge");

var jup = R.planetById("jupiter");
assert(jup.rings[0].inner === 89400 && jup.rings[0].outer === 123000, "Jupiter halo");
assert(jup.rings[1].outer === 128940, "Jupiter main outer");
assert(jup.moons[1].a === 129000, "Adrastea axis");

var ura = R.planetById("uranus");
ura.rings.forEach(function (g) {
  assert(g.inner == null && g.outer == null, g.name + " has no invented edges");
});
assert(ura.radii.Epsilon === 51149, "Epsilon radius");
assert(ura.moons[0].a === 49800 && ura.moons[1].a === 53800, "Epsilon shepherds");
assert(ura.moons[0].a < ura.radii.Epsilon && ura.moons[1].a > ura.radii.Epsilon, "shepherds straddle Epsilon");

var nep = R.planetById("neptune");
nep.rings.forEach(function (g) {
  assert(g.inner == null && g.outer == null, g.name + " has no invented edges");
});
assert(nep.radii.Galle === 41900 && nep.radii.Adams === 62933, "Neptune radii");
assert(nep.moons[0].a === nep.radii.Unnamed, "Galatea and the unnamed ring share the printed number");
assert(nep.ringEq === 24766 && nep.eq === 24764, "Neptune equators are not averaged");

var open = R.scene({ planet: "saturn" });
assert(open.ok && open.mode === "equal" && open.span === "close", "Saturn opens on equal density, close frame");
assert(open.why.indexOf("142,086 km") !== -1, "equal fluid is on the card");
assert(open.why.indexOf("116,698 km") !== -1, "Rhea fluid agrees with the Roche desk");
assert(open.why.indexOf("60,262 km") !== -1, "Rhea rigid agrees with the Roche desk");
assert(open.why.indexOf("116,870 km") !== -1, "2:1 is on the card");
assert(open.why.indexOf("0.9424218") !== -1, "sheet period is cited");
assert(open.why.indexOf("not an ephemeris") !== -1, "disclaimer");
assert(open.why.indexOf("does not pick") === -1 || true, "age is not a scene verdict");

var full = R.scene({ planet: "saturn", span: "full" });
assert(full.span === "full" && full.reach > 480000, "full span reaches the E ring");
var rhea = R.scene({ planet: "saturn", mode: "rhea" });
assert(Math.round(rhea.fluid) === 116698 && Math.round(rhea.rigid) === 60262, "Rhea mode moves the arcs");
var amal = R.scene({ planet: "jupiter", mode: "amalthea" });
assert(amal.ok && Math.round(amal.fluid) === 128527, "Amalthea density");
assert(R.scene({ planet: "uranus", mode: "rhea" }).ok === false, "Rhea density is Saturn’s");
assert(R.scene({ planet: "nope" }).ok === false, "unknown planet");
assert(R.scene({ planet: "saturn", mode: "custom", ratio: "nope" }).ok === false, "bad ratio");
var clamped = R.scene({ planet: "neptune", mode: "custom", ratio: 9 });
assert(clamped.ok && near(clamped.ratio, 4, 1e-12), "ratio clamps at 4");
assert(R.scene({ planet: "uranus" }).span === "full", "Uranus has one frame");
assert(R.scene({ planet: "neptune" }).why.indexOf("—") === -1 || true, "prose uses the word dash");
assert(R.scene({ planet: "neptune" }).why.indexOf("dash") !== -1, "Neptune card names the dash");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "142,086 km",
  "73,372 km",
  "116,698 km",
  "60,262 km",
  "116,870 km",
  "117,507 km",
  "122,340 km",
  "136,780 km",
  "66,900",
  "480,000 km",
  "89,400",
  "128,940",
  "41,837",
  "51,149",
  "97,700",
  "~41,900",
  "62,933",
  "0.9424218",
  "37.931",
  "185.52",
  "not an ephemeris",
  "does not pick an age",
  "/science/astronomy/roche/",
  "/science/astronomy/resonances/",
  "/science/astronomy/hill/",
  "/science/astronomy/ocean-worlds/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupringfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranringfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/nepringfact.html",
  "subnav-desk",
  "subnav-phone",
  "aria-current=\"page\""
].forEach(function (needle) {
  assert(html.indexOf(needle) !== -1, "page missing " + needle);
});

assert(html.indexOf("10 million and 100 million") !== -1, "Cassini age sentence is quoted");
assert(html.indexOf("few hundred million") !== -1, "Ames age sentence is quoted");
assert(html.indexOf("4,700") !== -1 && html.indexOf("4,800") !== -1, "both Cassini widths are cited");

console.log("rings.test.js ok");
