/* Habitable-zone checks: flux, equilibrium temperature, Kopparapu edges, presets.
   Run: node science/astronomy/habitable-zone/hz.test.js */
"use strict";

var HZ = require("./hz.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(HZ.H === 6.62607015e-34, "h");
assert(HZ.C === 299792458, "c");
assert(HZ.K === 1.380649e-23, "k");
assert(HZ.T_SUN_K === 5772, "nominal solar Teff");
assert(HZ.L_SUN_NOMINAL_W === 3.828e26, "nominal solar luminosity");
assert(HZ.R_SUN_M === 6.957e8, "nominal solar radius");
assert(HZ.AU_M === 149597870700, "IAU au");
assert(HZ.S_EARTH_WM2 === 1361.0, "Earth fact-sheet irradiance");
assert(HZ.HZ_T_MIN === 2600 && HZ.HZ_T_MAX === 7200, "Teff window");
assert(HZ.HZ_T_ZERO === 5780, "polynomial zero");

/* CODATA display σ = 5.670374419… × 10⁻⁸. */
var sigma = HZ.sigma();
assert(near(sigma / 5.670374419e-8, 1, 1e-9), "sigma " + sigma);

/* At Teff = 5780 the polynomial is the printed S_eff☉. */
assert(HZ.seff("recentVenus", 5780) === 1.776, "recent Venus anchor");
assert(HZ.seff("runaway", 5780) === 1.107, "runaway anchor");
assert(HZ.seff("maximumGreenhouse", 5780) === 0.356, "maximum greenhouse anchor");
assert(HZ.seff("earlyMars", 5780) === 0.32, "early Mars anchor");

/* Solar luminosity at 5780 K: the four distances from Eq. (5). */
assert(near(HZ.edgeAu("recentVenus", 5780, 1), Math.sqrt(1 / 1.776), 1e-12), "RV distance");
assert(near(HZ.edgeAu("runaway", 5780, 1), Math.sqrt(1 / 1.107), 1e-12), "RG distance");
assert(near(HZ.edgeAu("maximumGreenhouse", 5780, 1), Math.sqrt(1 / 0.356), 1e-12), "MG distance");
assert(near(HZ.edgeAu("earlyMars", 5780, 1), Math.sqrt(1 / 0.32), 1e-12), "EM distance");

/* Order holds across the published window, including the endpoints. */
[2600, 2980, 4000, 5772, 5780, 6500, 7200].forEach(function (T) {
  var z = HZ.habitableZone(T, 1);
  assert(z, "zone at " + T);
  assert(z.recentVenus < z.runaway && z.runaway < z.maximumGreenhouse && z.maximumGreenhouse < z.earlyMars, "order " + T);
  assert(z.seff.recentVenus > z.seff.runaway && z.seff.runaway > z.seff.maximumGreenhouse && z.seff.maximumGreenhouse > z.seff.earlyMars, "flux order " + T);
});

assert(HZ.habitableZone(2599.999, 1) === null, "just below 2600 is not extrapolated");
assert(HZ.habitableZone(7200.001, 1) === null, "just above 7200 is not extrapolated");
assert(HZ.habitableZone(2566, 0.000553) === null, "TRAPPIST-1 Teff is outside");
assert(HZ.classify(2566, 0.000553, 0.02925).ok === false, "TRAPPIST classify refuses");
assert(HZ.classify(2566, 0.000553, 0.02925).reason === "below", "below, not above");
assert(HZ.classify(8000, 2, 1).reason === "above", "above");

/* Earth preset: S ≈ 1, T_eq ≈ 255 K, A = 0.294. */
var earth = HZ.presetById("earth");
assert(earth.A === 0.294 && earth.L === 1 && earth.T === 5772, "earth inputs");
var earthS = HZ.fluxRatio(earth.L, earth.a);
var earthF = HZ.fluxWm2(earth.L, earth.a);
var earthT = HZ.equilibriumTemperature(earth.L, earth.a, earth.A);
assert(near(earthS, 1, 0.001), "earth S/S⊕ " + earthS);
assert(HZ.formatRatio(earthS) === "1.000", "earth ratio prints 1.000");
assert(HZ.formatFlux(earthF) === "1361.0", "earth flux prints 1361.0, got " + HZ.formatFlux(earthF));
assert(HZ.formatTemp(earthT) === "255.1", "earth Teq prints 255.1, got " + HZ.formatTemp(earthT));
assert(near(earthT, 255, 0.2), "earth Teq near 255, got " + earthT);
assert(HZ.formatCelsius(earthT) === "−18.0", "earth celsius " + HZ.formatCelsius(earthT));
assert(HZ.classify(earth.T, earth.L, earth.a).code === "conservative", "earth in conservative HZ");

/* Radius form and flux form agree at the printed tenth of a kelvin. */
var earthR = HZ.radiusSolar(earth.L, earth.T);
var earthTr = HZ.equilibriumTemperatureRadius(earth.T, earthR, earth.a, earth.A);
assert(near(earthR, 1, 0.001), "sun radius near 1, got " + earthR);
assert(Math.abs(earthTr - earthT) < 0.02, "forms agree, delta " + (earthTr - earthT));
assert(HZ.formatTemp(earthTr) === HZ.formatTemp(earthT), "forms print the same tenth");

/* Doubling the distance quarters the flux. Albedo 0 is hotter than 0.294 by (1/0.706)^¼. */
assert(near(HZ.fluxRatio(1, 2), 0.25, 1e-12), "2 AU is 1/4");
assert(near(HZ.fluxRatio(4, 2), 1, 1e-12), "4 L☉ at 2 AU is 1");
var hot = HZ.equilibriumTemperature(1, 1, 0);
var warm = HZ.equilibriumTemperature(1, 1, 0.294);
assert(near(hot / warm, Math.pow(1 / 0.706, 0.25), 1e-9), "albedo scaling");

/* Venus and Mars match the fact-sheet irradiance and black-body temperature at the printed digit. */
var venus = HZ.presetById("venus");
var mars = HZ.presetById("mars");
assert(HZ.formatFlux(HZ.fluxWm2(venus.L, venus.a)) === "2601.3", "venus flux");
assert(HZ.formatTemp(HZ.equilibriumTemperature(venus.L, venus.a, venus.A)) === "226.6", "venus Teq");
assert(HZ.formatFlux(HZ.fluxWm2(mars.L, mars.a)) === "586.2", "mars flux");
assert(HZ.formatTemp(HZ.equilibriumTemperature(mars.L, mars.a, mars.A)) === "209.8", "mars Teq");
assert(HZ.classify(venus.T, venus.L, venus.a).code === "hotter", "venus is inside the recent-Venus distance");
assert(HZ.classify(mars.T, mars.L, mars.a).code === "conservative", "mars is inside the conservative strip");

/* Proxima b: Ribas luminosity and the discovery semimajor axis. Inside the conservative strip. */
var prox = HZ.presetById("proxima-b");
assert(prox.L === 0.00151 && prox.T === 2980 && prox.a === 0.0485, "proxima inputs");
assert(prox.albedoMeasured === false, "proxima albedo is not a measurement");
var proxS = HZ.fluxRatio(prox.L, prox.a);
assert(near(proxS, 0.6419, 0.001), "proxima S " + proxS);
assert(HZ.classify(prox.T, prox.L, prox.a).code === "conservative", "proxima b conservative");
assert(HZ.inHzRange(prox.T), "proxima Teff is inside the window");

/* TRAPPIST-1 e: Agol / Ducrot numbers. Zone refused. Flux still defined. */
var tr = HZ.presetById("trappist-1-e");
assert(tr.T === 2566 && tr.L === 0.000553 && tr.a === 0.02925, "trappist inputs");
var trS = HZ.fluxRatio(tr.L, tr.a);
assert(near(trS, 0.6464, 0.001), "trappist S " + trS);
assert(HZ.equilibriumTemperature(tr.L, tr.a, tr.A) > 0, "trappist Teq still computes");
assert(HZ.classify(tr.T, tr.L, tr.a).ok === false, "trappist zone not drawn");

/* Kepler-452b: L is set so S/S⊕ is the paper's central 1.10. */
var k452 = HZ.presetById("kepler-452b");
assert(near(HZ.fluxRatio(k452.L, k452.a), 1.10, 1e-12), "kepler-452 insolation");
assert(k452.T === 5757 && k452.a === 1.046, "kepler-452 inputs");
var kZone = HZ.classify(k452.T, k452.L, k452.a);
assert(kZone.ok && kZone.code === "conservative", "central Kepler-452b is just inside the 2014 conservative edge");
assert(k452.a - kZone.zone.runaway < 0.01, "the gap is small, " + (k452.a - kZone.zone.runaway));
/* Their quoted T_eq assumes A = 0.3. This formula at that albedo is near 261 K, inside 265 +15/−13. */
var kT = HZ.equilibriumTemperature(k452.L, k452.a, 0.3);
assert(kT > 252 && kT < 280, "inside the paper's Teq uncertainty, got " + kT);
assert(near(kT, 260.7, 0.2), "central A=0.3 Teq " + kT);

/* A=1 absorbs nothing. */
assert(HZ.equilibriumTemperature(1, 1, 1) === 0, "unit albedo is 0 K");

/* Log sliders round-trip. */
assert(near(HZ.logMap(0, HZ.L_MIN, HZ.L_MAX), HZ.L_MIN, 1e-15), "L slider start");
assert(near(HZ.logMap(1, HZ.L_MIN, HZ.L_MAX), HZ.L_MAX, 1e-9), "L slider end");
assert(near(HZ.logMap(HZ.logUnmap(0.00151, HZ.L_MIN, HZ.L_MAX), HZ.L_MIN, HZ.L_MAX), 0.00151, 1e-12), "L round trip");
assert(near(HZ.logMap(HZ.logUnmap(0.02925, HZ.A_MIN, HZ.A_MAX), HZ.A_MIN, HZ.A_MAX), 0.02925, 1e-12), "a round trip");

assert(HZ.presets().length === 6, "six system presets");
assert(HZ.albedoPresets().length === 3, "three albedo presets");
assert(HZ.albedoPresets()[0].A === 0.294 && HZ.albedoPresets()[1].A === 0.77 && HZ.albedoPresets()[2].A === 0.250, "albedo values");

console.log("ok");
