/*! Accretion and the Eddington limit.
    Spherical, pure ionized hydrogen, Thomson opacity only.
    Not a disk model.

    L_Edd = 4π G M m_p c / σ_T
    L     = ε Ṁ c²
    Ṁ_Edd = L_Edd / (ε c²)
    At Eddington ratio λ, the supply rate is λ Ṁ_Edd and the luminosity
    is λ L_Edd. The mass that stays in the hole is (1−ε) of the supply,
    so the mass grows as exp(t / t_S) with

      t_S = [ε / (1−ε)] × σ_T c / (4π G m_p) × 1/λ

    σ_T, m_p, and G are 2022 CODATA central values. c is exact.
    A solar mass is the IAU 2015 nominal GM☉ divided by that G.
    L☉ is the IAU 2015 nominal luminosity, used only as a comparison.
    A year is the Julian year, 365.25 × 86400 s.

    The Schwarzschild ISCO binding energy is 1 − √(8/9).
    The maximal prograde Kerr binding energy used here is the closed
    form 1 − 1/√3. This file does not integrate a Kerr geodesic.
    Named masses are cited central values. The 100 → 10⁹ span is a
    classroom seed, not a named quasar. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Accretion = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var C = 299792458;
  var G = 6.67430e-11;
  var M_P = 1.67262192595e-27;
  /* 2022 CODATA Thomson cross section. Standard uncertainty 6.2 × 10^−38. */
  var SIGMA_T = 6.6524587051e-29;
  var GM_SUN = 1.3271244e20;
  var L_SUN_W = 3.828e26;
  var YEAR_S = 365.25 * 86400;
  var M_SUN_KG = GM_SUN / G;

  var M_MIN = 1;
  var M_MAX = 1e10;
  var EPS_SCHW = 1 - Math.sqrt(8 / 9);
  var EPS_KERR = 1 - 1 / Math.sqrt(3);
  var EPS_DEFAULT = 0.1;
  var EPS_MIN = 0.01;
  var EPS_MAX = EPS_KERR;
  var LAMBDA_DEFAULT = 1;
  var LAMBDA_MIN = 0.01;
  var LAMBDA_MAX = 10;
  var SEED_EXAMPLE = 100;
  var TARGET_EXAMPLE = 1e9;

  var CYG_M = 21.2;
  var SGR_M = 4.297e6;
  var M87_M = 6.5e9;

  /* Eddington time with no efficiency: σ_T c / (4π G m_p). */
  var T_EDD_S = SIGMA_T * C / (4 * Math.PI * G * M_P);

  var SUP = {
    "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
  };

  function sup(exp) {
    return String(exp).split("").map(function (ch) { return SUP[ch] || ch; }).join("");
  }

  function sci(x, n) {
    if (!isFinite(x)) return "";
    if (x === 0) return "0";
    var sign = x < 0 ? "−" : "";
    var ax = Math.abs(x);
    var exp = Math.floor(Math.log10(ax));
    var man = ax / Math.pow(10, exp);
    var m = man.toFixed(n - 1);
    if (Number(m) >= 10) {
      m = (Number(m) / 10).toFixed(n - 1);
      exp += 1;
    }
    if (exp === 0) return sign + m;
    return sign + m + " × 10" + sup(exp);
  }

  function same(a, b) {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
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

  function inRange(v, lo, hi) {
    return typeof v === "number" && isFinite(v) && v >= lo && v <= hi;
  }

  function parseNum(raw) {
    var t = String(raw == null ? "" : raw).trim().replace(/,/g, "").replace(/\u2212/g, "-").replace(/\s/g, "");
    if (!t || !/^[+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(t)) return NaN;
    return Number(t);
  }

  function formatMass(m) {
    if (same(m, 1)) return "1";
    if (same(m, CYG_M)) return "21.2";
    if (same(m, SEED_EXAMPLE)) return "100";
    if (same(m, SGR_M)) return "4.297e6";
    if (same(m, TARGET_EXAMPLE)) return "1e9";
    if (same(m, M87_M)) return "6.5e9";
    if (same(m, M_MAX)) return "1e10";
    if (!(m > 0) || !isFinite(m)) return "";
    if (m >= 1000) {
      var exp = Math.floor(Math.log10(m));
      var man = m / Math.pow(10, exp);
      var mt = Number(man.toPrecision(4));
      if (mt >= 10) {
        mt = 1;
        exp += 1;
      }
      return String(mt) + "e" + exp;
    }
    var n = Number(m.toPrecision(6));
    return String(n);
  }

  function formatPrettyMass(m) {
    var raw = formatMass(m);
    var v = Number(raw);
    if (!isFinite(v)) return raw;
    if (v >= 1000) return sci(v, 4) ;
    return raw;
  }

  function formatEps(eps) {
    if (same(eps, EPS_DEFAULT)) return "0.1";
    if (same(eps, EPS_SCHW)) return EPS_SCHW.toPrecision(6);
    if (same(eps, EPS_KERR)) return EPS_KERR.toPrecision(6);
    if (same(eps, EPS_MIN)) return "0.01";
    return Number(eps.toPrecision(4)).toString();
  }

  function formatCount(x) {
    if (!isFinite(x)) return "";
    if (x === 0) return "0";
    var ax = Math.abs(x);
    if (ax >= 0.001 && ax < 1000) return Number(x.toPrecision(6)).toString();
    return sci(x, 6);
  }

  function massPhrase(m) {
    if (same(m, 1)) return "1 solar mass";
    return formatPrettyMass(m) + " solar masses";
  }

  function formatLambda(lambda) {
    if (same(lambda, 1)) return "1";
    if (same(lambda, LAMBDA_MIN)) return "0.01";
    if (same(lambda, LAMBDA_MAX)) return "10";
    if (lambda >= 0.01 && lambda < 100) {
      var n = Number(lambda.toPrecision(4));
      return String(n);
    }
    return sci(lambda, 4);
  }

  function eddingtonWatts(mSolar) {
    if (!(mSolar > 0)) return NaN;
    return 4 * Math.PI * G * (mSolar * M_SUN_KG) * M_P * C / SIGMA_T;
  }

  function accretionWatts(mSolar, lambda) {
    return lambda * eddingtonWatts(mSolar);
  }

  /* Rest-mass supply rate for L = ε Ṁ c² = λ L_Edd. Kilograms per second. */
  function supplyKgS(mSolar, eps, lambda) {
    if (!(eps > 0) || eps >= 1) return NaN;
    return accretionWatts(mSolar, lambda) / (eps * C * C);
  }

  function salpeterSeconds(eps, lambda) {
    if (!(eps > 0) || eps >= 1 || !(lambda > 0)) return NaN;
    return (eps / (1 - eps)) * T_EDD_S / lambda;
  }

  /* The product that drops (1−ε). Not the time this page uses. */
  function epsilonOnlySeconds(eps, lambda) {
    if (!(eps > 0) || !(lambda > 0)) return NaN;
    return eps * T_EDD_S / lambda;
  }

  function growth(seed, target, eps, lambda) {
    if (!(target > seed)) return null;
    var efolds = Math.log(target / seed);
    var seconds = efolds * salpeterSeconds(eps, lambda);
    if (!isFinite(seconds)) return null;
    return { efolds: efolds, seconds: seconds, years: seconds / YEAR_S };
  }

  function samples(count, lambda) {
    var n = count || 201;
    var lam = lambda == null ? 1 : lambda;
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      var u = n === 1 ? 0 : i / (n - 1);
      var mass = logMap(u, M_MIN, M_MAX);
      out.push({
        mass: mass,
        ledd: eddingtonWatts(mass),
        lacc: accretionWatts(mass, lam)
      });
    }
    return out;
  }

  function massError(m) {
    if (!isFinite(m)) return "Mass from 1 to 10 billion solar masses. A typed word is not a mass.";
    if (m < M_MIN || m > M_MAX) return "Mass from 1 to 10 billion solar masses. Outside that window the slider stops. It is not a physical limit.";
    return "";
  }

  function epsError(eps) {
    if (!isFinite(eps)) return "Efficiency from 0.01 to the maximal prograde Kerr value. A typed word is not an efficiency.";
    if (eps < EPS_MIN || eps > EPS_MAX) return "Efficiency from 0.01 to 1 − 1/√3. The top of the slider is that Kerr binding energy. It is not a disk fit.";
    return "";
  }

  function lambdaError(lambda) {
    if (!isFinite(lambda)) return "Eddington ratio from 0.01 to 10. A typed word is not a ratio.";
    if (lambda < LAMBDA_MIN || lambda > LAMBDA_MAX) return "Eddington ratio from 0.01 to 10. Above 1 is a number on the slider. It is not a super-Eddington disk.";
    return "";
  }

  var LIMITS = "Educational calculator. Not a disk model and not a catalog. The Eddington luminosity is 4π G M m_p c / σ_T for a spherical flow of pure ionized hydrogen, with Thomson scattering as the only opacity. That opacity is the electron-scattering limit in Rybicki and Lightman. σ_T, m_p, and G are 2022 CODATA central values. c is exact. L = ε Ṁ c², the accretion luminosity in Frank, King, and Raine. The e-folding time is ε/(1−ε) × σ_T c / (4π G m_p) / λ. Salpeter 1964 is the name on that clock. Real disks can exceed L_Edd. Super-Eddington flows, geometry, and radiation-pressure effects are not in these formulas. Named masses are cited central values and are labeled approximate. The 100 to 10⁹ solar-mass span is a classroom seed, not a named quasar.";

  function presetById(id) {
    var list = presets();
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function presets() {
    return [
      { id: "sun", mass: 1, seed: null, target: null },
      { id: "cyg", mass: CYG_M, seed: null, target: null },
      { id: "sgr", mass: SGR_M, seed: null, target: null },
      { id: "m87", mass: M87_M, seed: null, target: null },
      { id: "quasar", mass: TARGET_EXAMPLE, seed: SEED_EXAMPLE, target: TARGET_EXAMPLE }
    ];
  }

  function whichPreset(mass, seed, target) {
    if (same(mass, TARGET_EXAMPLE) && same(seed, SEED_EXAMPLE) && same(target, TARGET_EXAMPLE)) return "quasar";
    if (same(mass, 1)) return "sun";
    if (same(mass, CYG_M)) return "cyg";
    if (same(mass, SGR_M)) return "sgr";
    if (same(mass, M87_M)) return "m87";
    return "";
  }

  function objectCopy(id, mass) {
    var massText = formatPrettyMass(mass);
    if (id === "sun") {
      return {
        tier: "Sun · nominal luminosity · approximate",
        name: "1 solar mass",
        why: "The Sun button is one nominal solar mass. L☉ is the IAU 2015 nominal luminosity, 3.828 × 10²⁶ W. It is a conversion constant, not a new measurement of the Sun. The point of the button is the gap: that wattage sits far under L_Edd. The Sun is not accreting at the Eddington limit. The marker on the chart at 1 L☉ is the nominal luminosity. The marker on the line is the limit."
      };
    }
    if (id === "cyg") {
      return {
        tier: "Cygnus X-1 · Miller-Jones et al. 2021 · approximate",
        name: "Cygnus X-1",
        why: "The mass is 21.2 solar masses, the central value in Miller-Jones et al. 2021. The uncertainty is ±2.2. It is not folded into the luminosity. Cygnus X-1 is a wind-fed X-ray binary, and the hole spins. This page does not model the wind, the disk, or the spin. The point on the line is L_Edd at 21.2 solar masses. It is not the observed X-ray luminosity. Approximate."
      };
    }
    if (id === "sgr") {
      return {
        tier: "Sagittarius A* · GRAVITY Collaboration 2022 · approximate",
        name: "Sagittarius A*",
        why: "The mass is 4.297 × 10⁶ solar masses, the GRAVITY Collaboration 2022 central value. The ±0.012 × 10⁶ figure is their statistical error. The systematic uncertainty is about 40,000 solar masses. Neither is folded into L_Edd. A round figure near 4.3 × 10⁶ is the same central value read coarsely. 4.297 × 10⁶ does not get replaced by 4.3 × 10⁶. The point is the limit at that mass. It is not the faint luminosity of Sagittarius A*. Approximate."
      };
    }
    if (id === "m87") {
      return {
        tier: "M87* · EHT 2019 · approximate",
        name: "M87*",
        why: "The mass is 6.5 × 10⁹ solar masses, the EHT Collaboration 2019 Paper VI central value. The paper separates a statistical ±0.2 × 10⁹ from a systematic ±0.7 × 10⁹. Neither is folded into L_Edd. The point is the limit at that mass. It is not a measured jet power. Approximate."
      };
    }
    if (id === "quasar") {
      return {
        tier: "Classroom seed · 100 to 10⁹ · not a named quasar",
        name: "Seed to a billion",
        why: "The button sets a 100 solar-mass seed and a 10⁹ solar-mass target, and it parks the mass marker on the target. Both ends are round classroom numbers. They are not a published mass of a named high-redshift quasar. The question people bring to this clock is whether a seed can reach a billion solar masses while the universe is still young. This page does not assign the button to an object, and it does not compute a redshift."
      };
    }
    return {
      tier: "Slider · not a catalog mass",
      name: massText + " solar masses",
      why: "The mass on the slider is " + massPhrase(mass) + ". It is not a catalog object. The buttons are the Sun, Cygnus X-1, Sagittarius A*, M87*, and a classroom seed. A mass between them is only the slider."
    };
  }

  function scene(o) {
    o = o || {};
    var mass = o.mass == null ? 1 : o.mass;
    var eps = o.eps == null ? EPS_DEFAULT : o.eps;
    var lambda = o.lambda == null ? LAMBDA_DEFAULT : o.lambda;
    var seed = o.seed == null ? SEED_EXAMPLE : o.seed;
    var target = o.target == null ? TARGET_EXAMPLE : o.target;
    if (o.preset) {
      var forced = presetById(o.preset);
      if (!forced) {
        return { ok: false, error: "That preset is not on this page.", limits: LIMITS };
      }
      mass = forced.mass;
      if (forced.seed != null) seed = forced.seed;
      if (forced.target != null) target = forced.target;
    }
    var err = "";
    if (!inRange(mass, M_MIN, M_MAX)) err = massError(mass);
    else if (!inRange(eps, EPS_MIN, EPS_MAX)) err = epsError(eps);
    else if (!inRange(lambda, LAMBDA_MIN, LAMBDA_MAX)) err = lambdaError(lambda);
    else if (!inRange(seed, M_MIN, M_MAX)) err = massError(seed).replace("Mass from", "Seed mass from");
    else if (!inRange(target, M_MIN, M_MAX)) err = massError(target).replace("Mass from", "Target mass from");
    else err = "";
    var preset = whichPreset(mass, seed, target);
    if (err) {
      return { ok: false, error: err, mass: mass, eps: eps, lambda: lambda, seed: seed, target: target, preset: preset, limits: LIMITS };
    }
    var ledd = eddingtonWatts(mass);
    var lacc = accretionWatts(mass, lambda);
    var mdot = supplyKgS(mass, eps, lambda);
    var mdotEdd = supplyKgS(mass, eps, 1);
    var tS = salpeterSeconds(eps, lambda);
    var tEps = epsilonOnlySeconds(eps, lambda);
    var g = growth(seed, target, eps, lambda);
    var perSun = eddingtonWatts(1);
    var copy = objectCopy(preset, mass);
    var ratio = L_SUN_W / ledd;
    var growText = g
      ? formatCount(g.efolds) + " e-folds · " + sci(g.years, 6) + " yr"
      : "no e-folding";
    var growWhy;
    if (!(target > seed)) {
      growWhy = "The target is not above the seed. There is no e-folding to report. Raise the target, or lower the seed. The window is 1 to 10 billion solar masses. It is not a physical limit.";
    } else if (preset === "quasar" || (same(seed, SEED_EXAMPLE) && same(target, TARGET_EXAMPLE))) {
      growWhy = "The seed is 100 solar masses and the target is 10⁹. The number of e-folds is ln(10⁷). At the efficiency and Eddington ratio on the sliders, the time is that count times the e-folding time. This span is the classroom example. It is not a named quasar. Changing ε or λ changes the time and does not change the e-folds.";
    } else {
      growWhy = "The seed is " + formatPrettyMass(seed) + " solar masses and the target is " + formatPrettyMass(target) + ". The e-folds are ln(target / seed). The time is that count times the e-folding time. These two masses are the sliders. They are not a named quasar.";
    }
    var effWhy = "Efficiency ε is the fraction of rest-mass energy that comes out as light, L = ε Ṁ c². The default is 0.1. The Schwarzschild ISCO binding energy is 1 − √(8/9), which is " + formatEps(EPS_SCHW) + ". The maximal prograde Kerr closed form used here is 1 − 1/√3, which is " + formatEps(EPS_KERR) + ". Familiar round figures are 0.057 and 0.42. " + formatEps(EPS_SCHW) + " rounds to 0.0572 at three significant figures and to 0.057 at two. It does not round to 0.057 at three figures. " + formatEps(EPS_KERR) + " rounds to 0.423 at three significant figures and to 0.42 at two. The buttons use the binding energies. 0.057 and 0.42 are not substituted. This page does not integrate a Kerr geodesic.";
    var foldWhy = "The e-folding time is ε/(1−ε) × σ_T c / (4π G m_p) / λ. At these sliders it is " + sci(tS / YEAR_S, 6) + " Julian years. The product that drops (1−ε) and keeps only ε is " + sci(tEps / YEAR_S, 6) + " years. A familiar round figure is about 45 million years, from that shorter product at ε = 0.1 and λ = 1. The calculator uses ε/(1−ε). The two times are not averaged. The mass that stays is (1−ε) of the supply, which is why (1−ε) is in the denominator of the growth rate. Salpeter 1964 is the name on the clock.";
    var aria = "Log-log Eddington luminosity against mass, from 1 to 10 billion solar masses. At " + massPhrase(mass) + ", L_Edd is " + sci(ledd, 6) + " W, which is " + sci(ledd / L_SUN_W, 6) + " solar luminosities. Efficiency " + formatEps(eps) + ", Eddington ratio " + formatLambda(lambda) + ". Accretion luminosity " + sci(lacc, 6) + " W. The nominal solar luminosity is marked at 1 L☉. Preset masses are approximate.";
    return {
      ok: true,
      error: "",
      mass: mass,
      eps: eps,
      lambda: lambda,
      seed: seed,
      target: target,
      preset: preset,
      ledd: ledd,
      lacc: lacc,
      mdot: mdot,
      mdotEdd: mdotEdd,
      salpeterSeconds: tS,
      salpeterYears: tS / YEAR_S,
      epsilonOnlyYears: tEps / YEAR_S,
      growth: g,
      perSun: perSun,
      limits: LIMITS,
      text: {
        tier: copy.tier,
        name: copy.name,
        range: "ε = " + formatEps(eps) + " · λ = " + formatLambda(lambda),
        ledd: sci(ledd, 6) + " W",
        lsun: sci(ledd / L_SUN_W, 6) + " L☉",
        lacc: sci(lacc, 6) + " W",
        ratio: sci(ratio, 6),
        mdot: sci(mdot, 6) + " kg/s",
        mdotYr: sci(mdot * YEAR_S / M_SUN_KG, 6) + " M☉/yr",
        salpeter: sci(tS / YEAR_S, 6) + " yr",
        growth: growText,
        why: copy.why,
        eff: effWhy,
        fold: foldWhy,
        grow: growWhy,
        aria: aria,
        mass: formatMass(mass),
        seed: formatMass(seed),
        target: formatMass(target),
        eps: formatEps(eps),
        lambda: formatLambda(lambda)
      }
    };
  }

  return {
    C: C,
    G: G,
    M_P: M_P,
    SIGMA_T: SIGMA_T,
    GM_SUN: GM_SUN,
    L_SUN_W: L_SUN_W,
    YEAR_S: YEAR_S,
    M_SUN_KG: M_SUN_KG,
    M_MIN: M_MIN,
    M_MAX: M_MAX,
    EPS_SCHW: EPS_SCHW,
    EPS_KERR: EPS_KERR,
    EPS_DEFAULT: EPS_DEFAULT,
    EPS_MIN: EPS_MIN,
    EPS_MAX: EPS_MAX,
    LAMBDA_DEFAULT: LAMBDA_DEFAULT,
    LAMBDA_MIN: LAMBDA_MIN,
    LAMBDA_MAX: LAMBDA_MAX,
    SEED_EXAMPLE: SEED_EXAMPLE,
    TARGET_EXAMPLE: TARGET_EXAMPLE,
    CYG_M: CYG_M,
    SGR_M: SGR_M,
    M87_M: M87_M,
    T_EDD_S: T_EDD_S,
    LIMITS: LIMITS,
    sci: sci,
    same: same,
    logMap: logMap,
    logUnmap: logUnmap,
    parseNum: parseNum,
    formatMass: formatMass,
    formatPrettyMass: formatPrettyMass,
    formatEps: formatEps,
    formatLambda: formatLambda,
    formatCount: formatCount,
    massPhrase: massPhrase,
    eddingtonWatts: eddingtonWatts,
    accretionWatts: accretionWatts,
    supplyKgS: supplyKgS,
    salpeterSeconds: salpeterSeconds,
    epsilonOnlySeconds: epsilonOnlySeconds,
    growth: growth,
    samples: samples,
    presets: presets,
    presetById: presetById,
    scene: scene
  };
});
