/* Impact-literacy checks.
   Mass, energy, Collins et al. 2005 eqs. 3, 21, 22, and 27.
   The Barringer-like case is 42 m iron at 15 km/s, 45°, sedimentary
   rock: the Collins et al. 2016 surface-impact case cited by Kring
   (2017), with this desk's iron density of 8000 kg/m³.
   Run: node science/astronomy/impacts/impacts.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var I = require("./impacts.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(I.MT_J === 4.184e15, "megaton in joules");
assert(I.MT_J_PAPER === 4.18e15, "paper rounds the megaton");
assert(I.C_ROCK === 1.161 && I.C_WATER === 1.365, "leading constants");
assert(I.D_TC_COMPLEX_KM === 2.56 && I.D_C_KM === 3.2, "simple-complex thresholds");
assert(I.G_E === 9.81, "surface gravity used in eq. 21");
assert(I.V_MIN === 11.2 && I.V_MAX === 72, "speed ends");
assert(I.V_ESCAPE_FACTSHEET === 11.186, "fact-sheet escape");
assert(I.D_MIN === 1 && I.D_MAX === 15000, "diameter ends");
assert(I.ANGLE_DEFAULT === 45, "most probable angle");

/* Hand mass and energy. 42 m iron sphere, 15 km/s.
   m = π/6 · 8000 · 42³. E = ½mv². */
var m = (Math.PI / 6) * 8000 * Math.pow(42, 3);
var e = 0.5 * m * 15000 * 15000;
assert(near(I.massKg(42, 8000), m, 1), "mass");
assert(near(I.kineticEnergyJ(m, 15000), e, 1), "energy");
assert(near(e / I.MT_J, 8.344442513832238, 1e-9), "8.34 Mt at 4.184e15 J");

/* Eq. 3 at 10 Mt is 109 · 10^0.78. */
assert(near(I.recurrenceYears(10), 109 * Math.pow(10, 0.78), 1e-9), "recurrence at 10 Mt");
assert(I.recurrenceYears(10) > I.recurrenceYears(1), "larger energy is rarer");

var barringer = {
  diameterM: 42,
  density: 8000,
  velocityKms: 15,
  angleDeg: 45,
  targetId: "sedimentary"
};
var row = I.compute(barringer);
assert(row, "barringer computes");
assert(row.crater.kind === "simple", "42 m iron is a simple crater");
assert(near(row.massKg, 3.103390886922141e8, 1), "barringer mass " + row.massKg);
assert(near(row.megatons, 8.344442513832238, 1e-9), "barringer Mt " + row.megatons);
assert(near(row.crater.transientM, 1170.8231442726762, 1e-6), "transient " + row.crater.transientM);
assert(near(row.crater.finalM, 1463.5289303408454, 1e-6), "final " + row.crater.finalM);
assert(near(row.crater.finalM, I.SIMPLE_FACTOR * row.crater.transientM, 1e-6), "eq. 22");

/* Earth Impact Database rim is 1.186 km. The central scaling is about
   1.46 km, a factor of 1.23. The paper's 0.8–1.5 constant range covers
   the database rim. */
var rim = 1186;
assert(row.crater.finalM / rim > 1.15 && row.crater.finalM / rim < 1.35, "within reason of 1.186 km");
assert(row.constantBand.lowM < rim && row.constantBand.highM > rim, "1.186 km is inside the constant band");
assert(row.entry.regime === "may-disrupt" && row.entry.strength === "strong", "small iron may still reach the ground");
assert(row.energyRef.ref.id === "barringer-2016", "nearest energy anchor is the 8.6 Mt model");
assert(near(row.energyRef.ratio, 8.344442513832238 / 8.6, 1e-9), "ratio to 8.6 Mt");

/* Vertical is larger than 45° by 1/sin(45°)^(1/3), eq. 21. */
var vertical = I.compute({
  diameterM: 42,
  density: 8000,
  velocityKms: 15,
  angleDeg: 90,
  targetId: "sedimentary"
});
var angleFactor = 1 / Math.pow(Math.sin(Math.PI / 4), 1 / 3);
assert(near(vertical.crater.transientM / row.crater.transientM, angleFactor, 1e-9), "sin^(1/3) angle");

/* Water uses 1.365 and density 1000, and does not apply the rock collapse. */
var rock = I.compute({
  diameterM: 1000,
  density: 3000,
  velocityKms: 17,
  angleDeg: 45,
  targetId: "sedimentary"
});
var water = I.compute({
  diameterM: 1000,
  density: 3000,
  velocityKms: 17,
  angleDeg: 45,
  targetId: "water"
});
assert(water.crater.kind === "water" && water.crater.finalM == null, "water has no rock final diameter");
var densityFactor = Math.pow(2500 / 1000, 1 / 3);
assert(near(water.crater.transientM / rock.crater.transientM, (I.C_WATER / I.C_ROCK) * densityFactor, 1e-9), "water constant and density");

/* Above 2.56 km transient, eq. 27. A 14 km dense-rock case is complex. */
var chic = I.compute({
  diameterM: 14000,
  density: 3000,
  velocityKms: 17,
  angleDeg: 45,
  targetId: "sedimentary"
});
assert(chic.crater.kind === "complex", "Chicxulub template is complex");
assert(chic.crater.transientM / 1000 > I.D_TC_COMPLEX_KM, "transient above 2.56 km");
var dtcKm = chic.crater.transientM / 1000;
var expectKm = 1.17 * Math.pow(dtcKm, 1.13) / Math.pow(3.2, 0.13);
assert(near(chic.crater.finalM / 1000, expectKm, 1e-9), "eq. 27");
assert(near(chic.joules / 1e23, 6.22833309944791, 1e-9), "joules over Morgan et al. 10^23 J");
assert(chic.entry.regime === "entry-neglected", "entry neglected at 14 km");
/* Morgan et al. say the structure is about 200 km. 148 km is the same order. */
assert(chic.crater.finalM / 200000 > 0.5 && chic.crater.finalM / 200000 < 1, "same order as the 200 km structure");

/* Bodies under 1 km are the ones their entry procedure treats. */
assert(I.entryClass(18, 3000).regime === "may-disrupt", "Chelyabinsk size");
assert(I.entryClass(18, 3000).strength === "intermediate", "dense rock");
assert(I.entryClass(1000, 1000).regime === "entry-neglected", "1 km is the cutoff");
assert(I.entryClass(50, 1000).strength === "weak", "ice is the weak end");

/* Rejected inputs. */
assert(I.compute({ diameterM: 0.5, density: 3000, velocityKms: 17, angleDeg: 45, targetId: "sedimentary" }) == null, "below 1 m");
assert(I.compute({ diameterM: 42, density: 8000, velocityKms: 10, angleDeg: 45, targetId: "sedimentary" }) == null, "below escape");
assert(I.compute({ diameterM: 42, density: 8000, velocityKms: 15, angleDeg: 0, targetId: "sedimentary" }) == null, "grazing angle");
assert(I.compute({ diameterM: 42, density: 8000, velocityKms: 11.186, angleDeg: 45, targetId: "sedimentary" }), "fact-sheet escape is allowed");

/* Log slider round-trip stays inside the ends. */
assert(near(I.diameterFromSlider(0), 1, 1e-12), "slider floor");
assert(near(I.diameterFromSlider(1000), 15000, 1e-6), "slider ceiling");
assert(I.sliderFromDiameter(42) === 389, "42 m step");

/* Presets use only the four densities and the three targets. */
assert(I.PRESETS.length === 4, "four presets");
I.PRESETS.forEach(function (p) {
  assert(I.densityById(p.densityId), p.id + " density");
  assert(I.targetById(p.targetId), p.id + " target");
  assert(p.diameterM >= I.D_MIN && p.diameterM <= I.D_MAX, p.id + " diameter");
  assert(p.velocityKms >= I.V_ESCAPE_FACTSHEET && p.velocityKms <= I.V_MAX, p.id + " speed");
  var hit = I.compute({
    diameterM: p.diameterM,
    density: I.densityById(p.densityId).density,
    velocityKms: p.velocityKms,
    angleDeg: p.angleDeg,
    targetId: p.targetId
  });
  assert(hit, p.id + " computes");
});
assert(I.presetById("barringer").diameterM === 42, "barringer diameter");
assert(I.presetById("barringer").velocityKms === 15, "barringer speed");
assert(I.presetById("chelyabinsk").diameterM === 18, "chelyabinsk diameter");
assert(I.presetById("chelyabinsk").velocityKms === 18.6, "chelyabinsk speed");
assert(I.presetById("tunguska").diameterM === 50, "tunguska low end");
assert(I.presetById("chicxulub").diameterM === 14000, "program template");
assert(I.SCALES.some(function (s) { return s.id === "barringer-rim" && s.meters === 1186; }), "database rim");
assert(I.SCALES.some(function (s) { return s.id === "nevis" && s.meters === 1300; }), "Ben Nevis template");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/impacts/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("/science/astronomy/meteors/") !== -1, "meteors link");
assert(html.indexOf("/science/astronomy/escape/") !== -1, "escape link");
assert(html.indexOf("/science/astronomy/vis-viva/") !== -1, "vis-viva link");
assert(html.indexOf("cneos.jpl.nasa.gov") !== -1, "CNEOS");
assert(html.indexOf("nasa.gov/planetarydefense") !== -1, "planetary defense");
assert(html.indexOf("Collins") !== -1, "names Collins");
assert(html.indexOf("1.161") !== -1, "rock constant");
assert(html.indexOf("1.365") !== -1, "water constant");
assert(html.indexOf("4.184") !== -1, "megaton definition");
assert(html.indexOf("1.186") !== -1, "database rim");
assert(html.indexOf("8.6") !== -1, "Kring energy");
assert(html.indexOf("18.6") !== -1, "Chelyabinsk speed");
assert(html.indexOf("440") !== -1, "Chelyabinsk kilotons");
assert(html.indexOf("10–20") !== -1 || html.indexOf("10-20") !== -1, "Tunguska band");
assert(html.indexOf("50–80") !== -1 || html.indexOf("50-80") !== -1, "Tunguska diameters");
assert(html.indexOf("10^23") !== -1 || html.indexOf("10<sup>23</sup>") !== -1, "Chicxulub energy");
assert(html.indexOf("not a hazard") !== -1, "disclaimer");
assert(html.indexOf("impacts.js") !== -1, "module");

console.log("impacts.test.js: ok");
