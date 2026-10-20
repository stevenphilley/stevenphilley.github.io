/*! Stellar flux, equilibrium temperature, and the Kopparapu et al. 2014 habitable zone.
    Classroom model: full heat redistribution, emissivity 1, circular orbit.
    Not a habitability verdict. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HZ = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Defined SI constants (CODATA; exact since the 2019 redefinition).
     σ = 2π⁵k⁴ / (15 h³ c²). Same computation as the blackbody desk. */
  var H = 6.62607015e-34;
  var C = 299792458;
  var K = 1.380649e-23;

  /* IAU 2015 Resolution B3 nominal solar conversion constants. Exact. */
  var R_SUN_M = 6.957e8;
  var T_SUN_K = 5772;
  var L_SUN_NOMINAL_W = 3.828e26;

  /* IAU 2012 Resolution B2. The astronomical unit is exactly this many metres.
     Used only to compare the radius form of T_eq with the flux form. */
  var AU_M = 149597870700;

  /* NASA NSSDCA Earth Fact Sheet, solar irradiance. The desk's S⊕. */
  var S_EARTH_WM2 = 1361.0;

  /* Kopparapu et al. 2014, ApJL 787, L29, Eq. (4) and Table 1, 1 M⊕ row.
     Digits are as printed. T★ = Teff − 5780 K. Valid for 2600 K ≤ Teff ≤ 7200 K.
     Recent Venus, maximum greenhouse, and early Mars do not depend on mass in that table.
     Runaway greenhouse does; this row is 1 M⊕. */
  var HZ_T_MIN = 2600;
  var HZ_T_MAX = 7200;
  var HZ_T_ZERO = 5780;

  var LIMITS = {
    recentVenus: { s: 1.776, a: 2.136e-4, b: 2.533e-8, c: -1.332e-11, d: -3.097e-15 },
    runaway: { s: 1.107, a: 1.332e-4, b: 1.58e-8, c: -8.308e-12, d: -1.931e-15 },
    maximumGreenhouse: { s: 0.356, a: 6.171e-5, b: 1.698e-9, c: -3.198e-12, d: -5.575e-16 },
    earlyMars: { s: 0.32, a: 5.547e-5, b: 1.526e-9, c: -2.874e-12, d: -5.011e-16 }
  };

  var L_MIN = 1e-5;
  var L_MAX = 100;
  var T_MIN = 1500;
  var T_MAX = 10000;
  var A_MIN = 0.005;
  var A_MAX = 40;
  var ALBEDO_MIN = 0;
  var ALBEDO_MAX = 1;

  var sigmaCache = 0;

  function sigma() {
    if (sigmaCache) return sigmaCache;
    sigmaCache = (2 * Math.pow(Math.PI, 5) * Math.pow(K, 4)) / (15 * Math.pow(H, 3) * Math.pow(C, 2));
    return sigmaCache;
  }

  function inHzRange(teff) {
    return teff >= HZ_T_MIN && teff <= HZ_T_MAX;
  }

  /* S_eff = S_eff☉ + a T★ + b T★² + c T★³ + d T★⁴. */
  function seff(limitId, teff) {
    var c = LIMITS[limitId];
    if (!c) return NaN;
    var t = teff - HZ_T_ZERO;
    return c.s + c.a * t + c.b * t * t + c.c * t * t * t + c.d * t * t * t * t;
  }

  /* d = sqrt( (L/L☉) / S_eff ) AU. Kopparapu et al. 2014 Eq. (5). */
  function edgeAu(limitId, teff, lum) {
    var s = seff(limitId, teff);
    if (!(s > 0) || !(lum > 0)) return NaN;
    return Math.sqrt(lum / s);
  }

  function habitableZone(teff, lum) {
    if (!inHzRange(teff) || !(lum > 0)) return null;
    var recentVenus = edgeAu("recentVenus", teff, lum);
    var runaway = edgeAu("runaway", teff, lum);
    var maximumGreenhouse = edgeAu("maximumGreenhouse", teff, lum);
    var earlyMars = edgeAu("earlyMars", teff, lum);
    if (!(recentVenus > 0) || !(runaway > 0) || !(maximumGreenhouse > 0) || !(earlyMars > 0)) return null;
    return {
      recentVenus: recentVenus,
      runaway: runaway,
      maximumGreenhouse: maximumGreenhouse,
      earlyMars: earlyMars,
      seff: {
        recentVenus: seff("recentVenus", teff),
        runaway: seff("runaway", teff),
        maximumGreenhouse: seff("maximumGreenhouse", teff),
        earlyMars: seff("earlyMars", teff)
      }
    };
  }

  /* S/S⊕ = (L/L☉) / d², d in AU. */
  function fluxRatio(lum, au) {
    return lum / (au * au);
  }

  function fluxWm2(lum, au) {
    return S_EARTH_WM2 * fluxRatio(lum, au);
  }

  /* T_eq = [ F (1−A) / (4 σ) ]^¼. Full redistribution, emissivity 1. */
  function equilibriumTemperature(lum, au, albedo) {
    var absorbed = fluxWm2(lum, au) * (1 - albedo) / 4;
    if (!(absorbed > 0)) return 0;
    return Math.pow(absorbed / sigma(), 0.25);
  }

  /* R from L = 4πR²σT⁴, with L = (L/L☉) × L☉^N. */
  function radiusSolar(lum, teff) {
    var watts = lum * L_SUN_NOMINAL_W;
    var r = Math.sqrt(watts / (4 * Math.PI * sigma() * Math.pow(teff, 4)));
    return r / R_SUN_M;
  }

  /* T_eq = T_star √(R_star / 2a) (1−A)^¼. a and R in metres. */
  function equilibriumTemperatureRadius(teff, rSolar, au, albedo) {
    var r = rSolar * R_SUN_M;
    var a = au * AU_M;
    if (!(r > 0) || !(a > 0)) return NaN;
    return teff * Math.sqrt(r / (2 * a)) * Math.pow(1 - albedo, 0.25);
  }

  /* Where the planet sits relative to the four limits. Central values only. */
  function classify(teff, lum, au) {
    var zone = habitableZone(teff, lum);
    if (!zone) {
      return {
        ok: false,
        reason: teff < HZ_T_MIN ? "below" : "above",
        zone: null
      };
    }
    var code;
    if (au < zone.recentVenus) code = "hotter";
    else if (au < zone.runaway) code = "optimistic-inner";
    else if (au <= zone.maximumGreenhouse) code = "conservative";
    else if (au <= zone.earlyMars) code = "optimistic-outer";
    else code = "colder";
    return { ok: true, code: code, zone: zone };
  }

  function logMap(t, min, max) {
    var u = Math.min(1, Math.max(0, t));
    return min * Math.pow(max / min, u);
  }

  function logUnmap(v, min, max) {
    if (!(v > 0)) return 0;
    return Math.log(v / min) / Math.log(max / min);
  }

  function trimFixed(v, digits) {
    return v.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatRatio(s) {
    if (!isFinite(s)) return "";
    if (Math.abs(s - 1) < 5e-4) return "1.000";
    var a = Math.abs(s);
    if (a >= 100 || (a > 0 && a < 0.01)) {
      var exp = Math.floor(Math.log10(a));
      var mant = s / Math.pow(10, exp);
      return trimFixed(mant, 3) + "e" + exp;
    }
    if (a >= 10) return s.toFixed(2);
    if (a >= 1) return s.toFixed(3);
    return s.toFixed(3);
  }

  function formatFlux(w) {
    if (!isFinite(w)) return "";
    if (w >= 100) return w.toFixed(1);
    if (w >= 10) return w.toFixed(2);
    if (w >= 1) return w.toFixed(2);
    return w.toFixed(3);
  }

  function formatAu(a) {
    if (!(a > 0) || !isFinite(a)) return "";
    if (a >= 10) return a.toFixed(2);
    if (a >= 1) return a.toFixed(3);
    if (a >= 0.1) return a.toFixed(4);
    return a.toFixed(5);
  }

  function formatTemp(t) {
    if (!isFinite(t)) return "";
    return t.toFixed(1);
  }

  function formatCelsius(k) {
    if (!isFinite(k)) return "";
    var c = k - 273.15;
    var body = Math.abs(c).toFixed(1);
    return (c < 0 ? "−" : "") + body;
  }

  function formatLum(l) {
    if (!(l > 0) || !isFinite(l)) return "";
    if (Math.abs(l - 1) < 5e-4) return "1";
    if (l >= 100 || l < 0.001) {
      var exp = Math.floor(Math.log10(l));
      var mant = l / Math.pow(10, exp);
      return trimFixed(mant, 3) + "e" + exp;
    }
    var digits = l >= 10 ? 2 : l >= 1 ? 3 : 5;
    return trimFixed(l, digits);
  }

  function formatRadius(r) {
    if (!(r > 0) || !isFinite(r)) return "";
    if (Math.abs(r - 1) < 5e-4) return "1.000";
    if (r >= 10) return r.toFixed(2);
    if (r >= 1) return r.toFixed(3);
    return trimFixed(r, 4);
  }

  function albedoPresets() {
    return [
      { id: "earth", name: "Earth", A: 0.294 },
      { id: "venus", name: "Venus", A: 0.77 },
      { id: "mars", name: "Mars", A: 0.250 }
    ];
  }

  function presets() {
    return [
      {
        id: "earth",
        name: "Earth",
        star: "Sun",
        L: 1,
        T: T_SUN_K,
        a: 1.00000011,
        A: 0.294,
        albedoMeasured: true,
        tier: "Sun · Earth",
        why: "At 1 AU a solar luminosity is one Earth flux. With the fact-sheet Bond albedo 0.294, full redistribution gives 255.1 K. The sheet lists a black-body temperature of 254.0 K and an average surface temperature of 288 K.",
        note: "Semimajor axis 1.00000011 AU, Bond albedo 0.294, solar irradiance 1361.0 W/m², black-body temperature 254.0 K, and average temperature 288 K (15 °C) are the NASA Earth Fact Sheet. Teff 5772 K and L/L☉ = 1 are the IAU 2015 nominal solar values. This formula applied to 1361.0 and 0.294 returns 255.1 K, not the sheet’s 254.0 K."
      },
      {
        id: "venus",
        name: "Venus",
        star: "Sun",
        L: 1,
        T: T_SUN_K,
        a: 0.72333199,
        A: 0.77,
        albedoMeasured: true,
        tier: "Sun · Venus",
        why: "Inside the recent-Venus distance. That limit is named for a younger Venus, not for liquid water on the Venus of the fact sheet. The sheet’s average temperature is 737 K.",
        note: "Semimajor axis 0.72333199 AU, Bond albedo 0.77, solar irradiance 2601.3 W/m², black-body temperature 226.6 K, average temperature 737 K. NASA Venus Fact Sheet. This desk’s flux and T_eq use the Earth-sheet 1361.0 W/m² times 1/a²."
      },
      {
        id: "mars",
        name: "Mars",
        star: "Sun",
        L: 1,
        T: T_SUN_K,
        a: 1.52366231,
        A: 0.250,
        albedoMeasured: true,
        tier: "Sun · Mars",
        why: "Inside the conservative strip. The fact sheet’s average temperature is about 214 K, close to the no-greenhouse number. A place in the strip is not a liquid-water surface.",
        note: "Semimajor axis 1.52366231 AU, Bond albedo 0.250, solar irradiance 586.2 W/m², black-body temperature 209.8 K, average temperature ~214 K. NASA Mars Fact Sheet."
      },
      {
        id: "proxima-b",
        name: "Proxima b",
        star: "Proxima Centauri",
        L: 0.00151,
        T: 2980,
        a: 0.0485,
        A: 0.294,
        albedoMeasured: false,
        tier: "Proxima Centauri · b",
        why: "The central orbit sits in the conservative strip for these stellar parameters. Proxima flares. This page does not model that, and the Bond albedo is not a measurement of the planet.",
        note: "Star: Ribas et al. 2017, T_eff = 2980 ± 80 K, L = 0.00151 ± 0.00008 L☉. Orbit: Anglada-Escudé et al. 2016, a = 0.0485 AU, credible interval 0.0434–0.0526 AU. That paper’s star was T_eff = 3050 K and L = 0.00155 L☉."
      },
      {
        id: "trappist-1-e",
        name: "TRAPPIST-1 e",
        star: "TRAPPIST-1",
        L: 0.000553,
        T: 2566,
        a: 0.02925,
        A: 0.294,
        albedoMeasured: false,
        tier: "TRAPPIST-1 · e",
        why: "Flux and equilibrium temperature still compute. The habitable-zone polynomial does not: 2566 K is below the paper’s 2600 K floor, so the strip is not drawn.",
        note: "Agol et al. 2021: T_eff = 2566 ± 26 K, semimajor axis 0.02925 ± 0.00025 AU, adopting L = (5.53 ± 0.19) × 10⁻⁴ L☉ from Ducrot et al. 2020."
      },
      {
        id: "kepler-452b",
        name: "Kepler-452b",
        star: "Kepler-452",
        L: 1.10 * 1.046 * 1.046,
        T: 5757,
        a: 1.046,
        A: 0.294,
        albedoMeasured: false,
        tier: "Kepler-452 · b",
        why: "The central insolation 1.10 sits just under the 2014 runaway-greenhouse flux, so the central distance is just inside the conservative inner edge. Jenkins et al. used the 2013 coefficients and called it slightly outside that edge. Their insolation uncertainty, +0.29 and −0.22, is much wider than the gap.",
        note: "Jenkins et al. 2015: T_eff = 5757 ± 85 K, a = 1.046 AU (+0.019, −0.015), insolation 1.10 S⊕ (+0.29, −0.22). L/L☉ is 1.10 × (1.046)² so this desk’s flux ratio is that central insolation. The paper does not print a luminosity. Their T_eq is 265 K (+15, −13) assuming Bond albedo 0.3 and full redistribution. That albedo is an assumption in the paper, not a measurement."
      }
    ];
  }

  function presetById(id) {
    var list = presets();
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  return {
    H: H,
    C: C,
    K: K,
    R_SUN_M: R_SUN_M,
    T_SUN_K: T_SUN_K,
    L_SUN_NOMINAL_W: L_SUN_NOMINAL_W,
    AU_M: AU_M,
    S_EARTH_WM2: S_EARTH_WM2,
    HZ_T_MIN: HZ_T_MIN,
    HZ_T_MAX: HZ_T_MAX,
    HZ_T_ZERO: HZ_T_ZERO,
    LIMITS: LIMITS,
    L_MIN: L_MIN,
    L_MAX: L_MAX,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    A_MIN: A_MIN,
    A_MAX: A_MAX,
    ALBEDO_MIN: ALBEDO_MIN,
    ALBEDO_MAX: ALBEDO_MAX,
    sigma: sigma,
    inHzRange: inHzRange,
    seff: seff,
    edgeAu: edgeAu,
    habitableZone: habitableZone,
    fluxRatio: fluxRatio,
    fluxWm2: fluxWm2,
    equilibriumTemperature: equilibriumTemperature,
    radiusSolar: radiusSolar,
    equilibriumTemperatureRadius: equilibriumTemperatureRadius,
    classify: classify,
    logMap: logMap,
    logUnmap: logUnmap,
    formatRatio: formatRatio,
    formatFlux: formatFlux,
    formatAu: formatAu,
    formatTemp: formatTemp,
    formatCelsius: formatCelsius,
    formatLum: formatLum,
    formatRadius: formatRadius,
    albedoPresets: albedoPresets,
    presets: presets,
    presetById: presetById
  };
});
