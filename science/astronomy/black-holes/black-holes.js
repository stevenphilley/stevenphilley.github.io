/*! Schwarzschild black-hole desk.
    Non-rotating hole. Educational approximation.
    r_s = 2GM/c². Photon sphere = 1.5 r_s. ISCO = 3 r_s.
    A mass in solar masses uses the IAU 2015 Resolution B3 nominal solar
    mass parameter, GM☉ = 1.3271244 × 10^20 m³ s^−2, times that number.
    c = 299792458 m/s, h = 6.62607015 × 10^−34 J s, and
    k = 1.380649 × 10^−23 J/K are exact SI defining constants.
    ħ = h/(2π). G = 6.67430 × 10^−11 m³ kg^−1 s^−2 is the NIST 2022
    CODATA central value. Radii, the horizon tide, and the Hawking
    temperature use GM and do not divide by G. Mean density and the
    evaporation time do.
    The evaporation time is the horizon-area Stefan–Boltzmann estimate
    t = 5120 π G² M³ / (ħ c⁴). Order of magnitude. Not Page's greybody integral.
    Preset masses for named objects are cited central values. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BlackHole = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Exact SI defining constants. */
  var C = 299792458;
  var H = 6.62607015e-34;
  var K = 1.380649e-23;
  var HBAR = H / (2 * Math.PI);

  /* NIST 2022 CODATA central value. Standard uncertainty 0.00015 × 10^−11.
     Used for density and the evaporation time. */
  var G = 6.67430e-11;

  /* IAU 2015 Resolution B3, nominal solar mass parameter. Exact as printed. */
  var GM_SUN = 1.3271244e20;

  /* IAU 2012 Resolution B2. The astronomical unit is exactly this many metres. */
  var AU = 149597870700;

  /* Conventional standard gravity, 3rd CGPM (1901). Exact. Comparison only. */
  var G0 = 9.80665;

  /* Julian year: 365.25 days of 86400 s. */
  var JULIAN_YEAR_S = 365.25 * 86400;

  /* Classroom body length for the horizon tide, metres. */
  var BODY_M = 2;

  /* Slider domain, solar masses. Stellar-mass through supermassive. */
  var M_MIN = 1;
  var M_MAX = 1e10;

  /* Hovering observer, in units of r_s. Must stay outside the horizon. */
  var R_MIN = 1.2;
  var R_MAX = 30;
  var R_DEFAULT = 10;

  var PHOTON_FACTOR = 1.5;
  var ISCO_FACTOR = 3;

  /* Horizon-area Stefan–Boltzmann lifetime.
     A = 4π r_s² and T = ħ c³ / (8π G M k) give
     P = ħ c^6 / (15360 π G² M²). Then dM/dt = −P/c².
     Integrating from the starting mass down to zero gives
     t = 5120 π G² M³ / (ħ c⁴). */
  var EVAP_COEFF = 5120 * Math.PI;

  function gm(mSolar) {
    if (!(mSolar > 0)) return NaN;
    return mSolar * GM_SUN;
  }

  function massKg(mSolar) {
    var gmv = gm(mSolar);
    if (!(gmv > 0)) return NaN;
    return gmv / G;
  }

  function schwarzschildRadius(mSolar) {
    var gmv = gm(mSolar);
    if (!(gmv > 0)) return NaN;
    return 2 * gmv / (C * C);
  }

  function photonSphere(mSolar) {
    var rs = schwarzschildRadius(mSolar);
    if (!(rs > 0)) return NaN;
    return PHOTON_FACTOR * rs;
  }

  function isco(mSolar) {
    var rs = schwarzschildRadius(mSolar);
    if (!(rs > 0)) return NaN;
    return ISCO_FACTOR * rs;
  }

  function meanDensity(mSolar) {
    var rs = schwarzschildRadius(mSolar);
    var mass = massKg(mSolar);
    if (!(rs > 0) || !(mass > 0)) return NaN;
    return mass / ((4 / 3) * Math.PI * rs * rs * rs);
  }

  /* dτ/dt for a static observer, relative to a clock at infinity.
     rOverRs is r / r_s. The horizon is 1. A static observer needs r > r_s. */
  function timeDilation(rOverRs) {
    if (!(rOverRs > 1)) return NaN;
    return Math.sqrt(1 - 1 / rOverRs);
  }

  /* Newtonian radial tidal difference 2GM L / r³, evaluated at r = r_s. */
  function tidalAcceleration(mSolar, lengthM) {
    var gmv = gm(mSolar);
    var rs = schwarzschildRadius(mSolar);
    var L = lengthM == null ? BODY_M : lengthM;
    if (!(gmv > 0) || !(rs > 0) || !(L > 0)) return NaN;
    return 2 * gmv * L / (rs * rs * rs);
  }

  /* T = ħ c³ / (8 π G M k) = ħ c³ / (8 π k GM). */
  function hawkingTemperature(mSolar) {
    var gmv = gm(mSolar);
    if (!(gmv > 0)) return NaN;
    return HBAR * C * C * C / (8 * Math.PI * gmv * K);
  }

  function evaporationSeconds(mSolar) {
    var gmv = gm(mSolar);
    if (!(gmv > 0)) return NaN;
    return EVAP_COEFF * gmv * gmv * gmv / (G * HBAR * C * C * C * C);
  }

  function evaporationYears(mSolar) {
    var s = evaporationSeconds(mSolar);
    if (!(s > 0)) return NaN;
    return s / JULIAN_YEAR_S;
  }

  function logMap(u, lo, hi) {
    var t = Math.min(1, Math.max(0, u));
    if (t === 0) return lo;
    if (t === 1) return hi;
    return Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo)));
  }

  function logUnmap(v, lo, hi) {
    if (!(v > 0)) return 0;
    var t = (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return Math.min(1, Math.max(0, t));
  }

  function compute(mSolar, rOverRs) {
    if (!(mSolar >= M_MIN) || mSolar > M_MAX) return null;
    if (!(rOverRs >= R_MIN) || rOverRs > R_MAX) return null;
    var rs = schwarzschildRadius(mSolar);
    return {
      mSolar: mSolar,
      massKg: massKg(mSolar),
      rs: rs,
      photon: PHOTON_FACTOR * rs,
      isco: ISCO_FACTOR * rs,
      density: meanDensity(mSolar),
      rOverRs: rOverRs,
      dilation: timeDilation(rOverRs),
      tidal: tidalAcceleration(mSolar, BODY_M),
      temperature: hawkingTemperature(mSolar),
      evaporationSeconds: evaporationSeconds(mSolar),
      evaporationYears: evaporationYears(mSolar)
    };
  }

  function trimFixed(v, digits) {
    var t = v.toFixed(digits);
    return t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  /* toPrecision keeps significant trailing zeros (4.430, 6.170). */
  function sig(v, digits) {
    if (!isFinite(v)) return "—";
    return Number(v).toPrecision(digits);
  }

  function formatSci(v, digits) {
    if (!(v > 0) || !isFinite(v)) return "—";
    var exp = Math.floor(Math.log10(v));
    var mant = v / Math.pow(10, exp);
    var mantText = Number(mant).toPrecision(digits);
    if (Number(mantText) >= 10) {
      mantText = Number(mant / 10).toPrecision(digits);
      exp += 1;
    }
    if (exp === 0) return mantText;
    return mantText + "×10^" + exp;
  }

  function formatMass(v) {
    if (!(v > 0) || !isFinite(v)) return "—";
    if (v >= 1e4) return formatSci(v, 4);
    if (v >= 100) return trimFixed(v, 1);
    if (v >= 10) return trimFixed(v, 2);
    return trimFixed(v, 3);
  }

  function formatLength(meters) {
    if (!(meters > 0) || !isFinite(meters)) return "—";
    var km = meters / 1000;
    if (km < 10000) return sig(km, 4) + " km";
    var au = meters / AU;
    var lightSeconds = meters / C;
    if (au < 1) return sig(au, 4) + " AU · " + sig(lightSeconds, 4) + " light-seconds";
    var lightHours = lightSeconds / 3600;
    if (lightHours < 48) return sig(au, 4) + " AU · " + sig(lightHours, 4) + " light-hours";
    return sig(au, 4) + " AU · " + sig(lightHours / 24, 4) + " light-days";
  }

  function formatFactor(f) {
    if (!(f >= 0) || !isFinite(f)) return "—";
    if (f === 0) return "0";
    if (f >= 0.01) return sig(f, 4);
    return formatSci(f, 4);
  }

  function formatDensity(kgPerM3) {
    if (!(kgPerM3 > 0) || !isFinite(kgPerM3)) return "—";
    var water = kgPerM3 / 1000;
    return formatSci(kgPerM3, 4) + " kg/m³ · " + formatSci(water, 4) + " × water";
  }

  function formatTide(ms2) {
    if (!(ms2 > 0) || !isFinite(ms2)) return "—";
    var gees = ms2 / G0;
    if (gees >= 0.01) return formatSci(ms2, 4) + " m/s² · " + formatSci(gees, 4) + " g";
    return formatSci(ms2, 4) + " m/s² · " + formatSci(gees, 3) + " g";
  }

  function formatTemp(kelvin) {
    if (!(kelvin > 0) || !isFinite(kelvin)) return "—";
    if (kelvin >= 0.01 && kelvin < 1000) return sig(kelvin, 4) + " K";
    return formatSci(kelvin, 4) + " K";
  }

  function formatYears(years) {
    if (!(years > 0) || !isFinite(years)) return "—";
    if (years < 1000) return sig(years, 4) + " yr";
    return formatSci(years, 4) + " yr";
  }

  /* Cited presets. M is the central value the formulas use.
     massText is the printed central value, so the field does not invent digits. */
  function presets() {
    return [
      {
        id: "m1",
        name: "1 solar mass",
        button: "1 M☉",
        tier: "Computed · nominal solar mass parameter",
        M: 1,
        massText: "1",
        kind: "computed",
        why: "One nominal solar mass. r_s = 2GM☉/c². The IAU nominal solar mass parameter and the exact speed of light fix that length. The Sun does not become a black hole.",
        note: "IAU 2015 Resolution B3 sets GM☉ = 1.3271244 × 10²⁰ m³ s⁻². NASA Science’s star-types page puts a main-sequence star under eight solar masses on the white-dwarf path. This button is a computed anchor."
      },
      {
        id: "m10",
        name: "10 solar masses",
        button: "10 M☉",
        tier: "Computed · round stellar-mass example",
        M: 10,
        massText: "10",
        kind: "computed",
        why: "Ten times the nominal solar mass parameter. Every Schwarzschild length is ten times the one-solar-mass length. This is not a named star.",
        note: "NASA’s classroom split puts about 8 to 20 solar masses on the neutron-star side, and calls the edge approximate. The button still evaluates the black-hole formulas at 10 solar masses."
      },
      {
        id: "cyg-x1",
        name: "Cygnus X-1",
        button: "Cyg X-1",
        tier: "Miller-Jones et al. 2021 · stellar mass",
        M: 21.2,
        massText: "21.2",
        dM: 2.2,
        kind: "cited",
        why: "The formulas use 21.2 solar masses, the published central value. The uncertainty ±2.2 is not folded into the radii.",
        note: "Miller-Jones et al. 2021, Science 371, 1046: black-hole mass 21.2 ± 2.2 solar masses, from a radio distance 2.22 kpc with uncertainties +0.18 and −0.17 combined with archival optical data. The hole spins. These radii ignore that spin."
      },
      {
        id: "sgr-a",
        name: "Sagittarius A*",
        button: "Sgr A*",
        tier: "GRAVITY Collaboration 2022",
        M: 4.297e6,
        massText: "4.297e6",
        dM: 0.012e6,
        dMSys: 40000,
        kind: "cited",
        why: "The formulas use 4.297 × 10⁶ solar masses. The ±0.012 × 10⁶ figure is the paper’s statistical error. The systematic uncertainty is about 40,000 solar masses.",
        note: "GRAVITY Collaboration 2022, A&A 657, L12: M• = (4.297 ± 0.012) × 10⁶ M☉, statistical, with systematics of about 40,000 M☉, and R₀ = (8277 ± 9) pc. EHT Collaboration 2022, ApJL 930, L12, finds a ring consistent with a Kerr hole of about 4 × 10⁶ solar masses from those stellar orbits. This page uses the GRAVITY central value and the Schwarzschild radii."
      },
      {
        id: "m87",
        name: "M87*",
        button: "M87*",
        tier: "EHT Collaboration 2019 · Paper VI",
        M: 6.5e9,
        massText: "6.5e9",
        dMStat: 0.2e9,
        dMSys: 0.7e9,
        kind: "cited",
        why: "The formulas use 6.5 × 10⁹ solar masses. The paper separates a statistical ±0.2 × 10⁹ from a systematic ±0.7 × 10⁹. Neither is folded into the radii.",
        note: "Event Horizon Telescope Collaboration 2019, ApJL 875, L6: M = 6.5 ± 0.2 (stat) ± 0.7 (sys) × 10⁹ M☉, with distance 16.8 Mpc and uncertainties +0.8 and −0.7. The image is of a Kerr hole. This page is the non-spinning calculation at that mass."
      }
    ];
  }

  function presetById(id) {
    var list = presets();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  return {
    C: C,
    H: H,
    K: K,
    HBAR: HBAR,
    G: G,
    GM_SUN: GM_SUN,
    AU: AU,
    G0: G0,
    JULIAN_YEAR_S: JULIAN_YEAR_S,
    BODY_M: BODY_M,
    M_MIN: M_MIN,
    M_MAX: M_MAX,
    R_MIN: R_MIN,
    R_MAX: R_MAX,
    R_DEFAULT: R_DEFAULT,
    PHOTON_FACTOR: PHOTON_FACTOR,
    ISCO_FACTOR: ISCO_FACTOR,
    EVAP_COEFF: EVAP_COEFF,
    gm: gm,
    massKg: massKg,
    schwarzschildRadius: schwarzschildRadius,
    photonSphere: photonSphere,
    isco: isco,
    meanDensity: meanDensity,
    timeDilation: timeDilation,
    tidalAcceleration: tidalAcceleration,
    hawkingTemperature: hawkingTemperature,
    evaporationSeconds: evaporationSeconds,
    evaporationYears: evaporationYears,
    logMap: logMap,
    logUnmap: logUnmap,
    compute: compute,
    formatMass: formatMass,
    formatLength: formatLength,
    formatFactor: formatFactor,
    formatDensity: formatDensity,
    formatTide: formatTide,
    formatTemp: formatTemp,
    formatYears: formatYears,
    formatSci: formatSci,
    presets: presets,
    presetById: presetById
  };
});
