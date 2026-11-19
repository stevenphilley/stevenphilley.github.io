/*! Star formation desk. Uniform-sphere Jeans mass.
    M_J = (5 k T / (G μ m_H))^(3/2) * (3 / (4 π ρ))^(1/2)
    ρ = n μ m_H
    R_J = (15 k T / (4 π G μ m_H ρ))^(1/2)
    t_ff = (3 π / (32 G ρ))^(1/2)
    This is the virial boundary 2K = |U| for a uniform sphere,
    U = −(3/5) G M²/R and K = (3/2) N k T, N = M / (μ m_H).
    Rice University ASTR 350 (28 October 2021) prints this mass and
    calls R_J the Jeans length. University of Toronto AST 320 notes
    print the same mass and the exact free-fall time.
    A wavelength form, (π k T / (G μ m_H ρ))^(1/2), is not substituted.
    Preset temperatures, densities, and mean masses are round textbook
    values. They are not measurements of a named cloud.
    k, G, m_p, and m_e are 2022 CODATA central values. m_H is m_p + m_e.
    The 13.6 eV binding energy is omitted. A solar mass is the IAU 2015
    nominal GM☉ divided by G. One parsec is (648000/π) au. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StarFormation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* 2022 CODATA. k is exact. G, m_p, and m_e are central values.
     Parenthetical uncertainties are not folded in. */
  var K = 1.380649e-23;
  var G = 6.67430e-11;
  var M_P = 1.67262192595e-27;
  var M_E = 9.1093837139e-31;
  var M_H = M_P + M_E;

  /* IAU 2015 nominal solar mass parameter. A solar mass is GM☉ / G. */
  var GM_SUN = 1.3271244e20;
  var M_SUN = GM_SUN / G;

  /* IAU 2012 au, and the parsec of IAU 2015 Resolution B2 footnote 4. */
  var AU_M = 149597870700;
  var PC_M = (648000 / Math.PI) * AU_M;
  var YEAR_S = 31557600;

  /* University of Toronto AST 320 notes, equation (2.1) and (2.2),
     at μ = 1, T = 10 K, n = 10^4 cm^−3. Printed coefficients.
     This page’s arithmetic is not averaged with them. */
  var NOTES_MASS = 29;
  var NOTES_RADIUS_PC = 0.30;

  var T_MIN = 3;
  var T_MAX = 30000;
  var N_MIN = 1;
  var N_MAX = 1e7;
  var MU_MIN = 0.5;
  var MU_MAX = 3;
  var SLIDER_STEPS = 1000;

  /* R_J / λ_wave = √15 / (2 π). Independent of T, n, and μ. */
  var LENGTH_RATIO = Math.sqrt(15) / (2 * Math.PI);

  var PRESETS = [
    {
      id: "atomic",
      name: "Diffuse atomic",
      tier: "Typical textbook values · not a named cloud",
      T: 100,
      n: 10,
      mu: 1.3,
      why: "Typical textbook values for a diffuse atomic cloud: 100 K, 10 particles per cubic centimetre, and μ = 1.3. 1.3 is a round mean mass per particle for neutral atomic gas with helium. It is not a measured abundance. Not a named cloud."
    },
    {
      id: "gmc",
      name: "Molecular cloud",
      tier: "Typical textbook values · not a named cloud",
      T: 10,
      n: 100,
      mu: 2.33,
      why: "Typical textbook values for a giant molecular cloud: 10 K, 100 particles per cubic centimetre, and μ = 2.33. 2.33 is a round mean mass per particle for cold molecular gas. It already includes molecular hydrogen and helium. It is not a measured abundance. Not a named cloud."
    },
    {
      id: "core",
      name: "Dense core",
      tier: "Typical textbook values · not a named cloud",
      T: 10,
      n: 10000,
      mu: 2.33,
      why: "Typical textbook values for a dense core: 10 K, 10^4 particles per cubic centimetre, and μ = 2.33. The mass is a few solar masses. 2.33 is a round mean mass per particle for cold molecular gas. It is not a measured abundance. Not a named cloud."
    },
    {
      id: "hii",
      name: "Warm H II",
      tier: "Typical textbook values · not a named cloud",
      T: 10000,
      n: 100,
      mu: 0.6,
      why: "Typical textbook values for warm H II gas: 10,000 K, 100 particles per cubic centimetre, and μ = 0.6. 0.6 is a round mean mass per particle for ionized hydrogen plus helium, counting the electrons. It is not a measured abundance. The Jeans mass is far above one star. This gas does not collapse until it cools. Not a named cloud."
    }
  ];

  function presets() {
    return PRESETS.map(function (p) {
      return { id: p.id, name: p.name, tier: p.tier, T: p.T, n: p.n, mu: p.mu, why: p.why };
    });
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return presets()[i];
    }
    return null;
  }

  function density(nCm3, mu) {
    if (!(nCm3 > 0) || !(mu > 0)) return NaN;
    return nCm3 * 1e6 * mu * M_H;
  }

  function jeansMassKg(T, nCm3, mu) {
    var rho = density(nCm3, mu);
    if (!(T > 0) || !(rho > 0)) return NaN;
    var thermal = (5 * K * T) / (G * mu * M_H);
    return Math.pow(thermal, 1.5) * Math.sqrt(3 / (4 * Math.PI * rho));
  }

  function jeansLengthM(T, nCm3, mu) {
    var rho = density(nCm3, mu);
    if (!(T > 0) || !(rho > 0)) return NaN;
    return Math.sqrt((15 * K * T) / (4 * Math.PI * G * mu * M_H * rho));
  }

  /* Wavelength form. Not the length this page reports. */
  function waveLengthM(T, nCm3, mu) {
    var rho = density(nCm3, mu);
    if (!(T > 0) || !(rho > 0)) return NaN;
    return Math.sqrt((Math.PI * K * T) / (G * mu * M_H * rho));
  }

  function freeFallS(nCm3, mu) {
    var rho = density(nCm3, mu);
    if (!(rho > 0)) return NaN;
    return Math.sqrt((3 * Math.PI) / (32 * G * rho));
  }

  function sigParts(v, sig) {
    var exp = Math.floor(Math.log10(v) + 1e-15);
    var mant = v / Math.pow(10, exp);
    var p = Math.pow(10, sig - 1);
    var rm = Math.round(mant * p) / p;
    if (rm >= 10) {
      rm = rm / 10;
      exp += 1;
    }
    return { mant: rm, exp: exp };
  }

  function formatSig(v, sig) {
    if (!(v > 0) || !isFinite(v)) return "—";
    var parts = sigParts(v, sig);
    if (parts.exp >= 0 && parts.exp < 3) {
      var decimals = (sig - 1) - parts.exp;
      var value = parts.mant * Math.pow(10, parts.exp);
      return value.toFixed(decimals);
    }
    if (parts.exp < 0 && parts.exp >= -3) {
      var dec = (sig - 1) - parts.exp;
      var plain = parts.mant * Math.pow(10, parts.exp);
      return plain.toFixed(dec);
    }
    var sign = parts.exp < 0 ? "\u2212" : "";
    return parts.mant.toFixed(sig - 1) + " \u00d7 10^" + sign + Math.abs(parts.exp);
  }

  function formatSolar(ms) {
    if (!(ms > 0) || !isFinite(ms)) return "—";
    return formatSig(ms, 6) + " solar masses";
  }

  function formatPc(pc) {
    if (!(pc > 0) || !isFinite(pc)) return "—";
    return formatSig(pc, 6) + " pc";
  }

  function formatTime(years) {
    if (!(years > 0) || !isFinite(years)) return "—";
    if (years >= 1e6) return formatSig(years / 1e6, 6) + " million years";
    if (years >= 1e3) return formatSig(years / 1e3, 6) + " thousand years";
    return formatSig(years, 6) + " years";
  }

  function formatYearsRaw(years) {
    if (!(years > 0) || !isFinite(years)) return "—";
    return years.toFixed(3);
  }

  function formatT(t) {
    if (!(t > 0) || !isFinite(t)) return "—";
    if (Math.abs(t - Math.round(t)) < 1e-6) return formatN(Math.round(t));
    return formatSig(t, 4);
  }

  function formatMu(mu) {
    if (!(mu > 0) || !isFinite(mu)) return "—";
    var rounded = Math.round(mu * 1e6) / 1e6;
    var text = rounded.toFixed(6);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatN(n) {
    if (!(n > 0) || !isFinite(n)) return "—";
    var rounded = Math.round(n);
    if (Math.abs(n - rounded) <= n * 1e-9 && rounded < 1e8) {
      return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return formatSig(n, 6);
  }

  function formatNm3(n) {
    if (!(n > 0) || !isFinite(n)) return "—";
    return formatSig(n * 1e6, 6) + " m^\u22123";
  }

  function formatRho(rho) {
    if (!(rho > 0) || !isFinite(rho)) return "—";
    return formatSig(rho, 6) + " kg/m\u00b3";
  }

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  function sliderPos(value, min, max, log) {
    if (!(value > 0) || !(max > min)) return 0;
    var t;
    if (log) {
      t = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
    } else {
      t = (value - min) / (max - min);
    }
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.round(t * SLIDER_STEPS);
  }

  function valueFromSlider(pos, min, max, log) {
    var t = pos / SLIDER_STEPS;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    if (log) return Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
    return min + t * (max - min);
  }

  function same(a, b) {
    if (!isFinite(a) || !isFinite(b)) return false;
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function matchPreset(T, n, mu) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      if (same(T, p.T) && same(n, p.n) && same(mu, p.mu)) return presets()[i];
    }
    return null;
  }

  function scene(opts) {
    opts = opts || {};
    var T = Number(opts.T);
    var n = Number(opts.n);
    var mu = Number(opts.mu);
    if (!(T > 0) || !(n > 0) || !(mu > 0)) return { ok: false, why: "" };
    if (!isFinite(T) || !isFinite(n) || !isFinite(mu)) return { ok: false, why: "" };
    var rho = density(n, mu);
    var massKg = jeansMassKg(T, n, mu);
    var lengthM = jeansLengthM(T, n, mu);
    var waveM = waveLengthM(T, n, mu);
    var tS = freeFallS(n, mu);
    if (!isFinite(massKg) || !isFinite(lengthM) || !isFinite(tS)) return { ok: false, why: "" };
    var solar = massKg / M_SUN;
    var pc = lengthM / PC_M;
    var years = tS / YEAR_S;
    var preset = opts.id ? presetById(opts.id) : null;
    if (preset && !(same(T, preset.T) && same(n, preset.n) && same(mu, preset.mu))) preset = null;
    if (!preset) preset = matchPreset(T, n, mu);
    var massText = formatSolar(solar);
    var lengthText = formatPc(pc);
    var timeText = formatTime(years);
    var timeRaw = formatYearsRaw(years);
    var waveText = formatPc(waveM / PC_M);
    var ratioText = formatSig(lengthM / waveM, 6);
    var tText = formatT(T);
    var nText = formatN(n);
    var muText = formatMu(mu);
    var custom = "Sliders. These inputs are not one of the four textbook buttons. They are not a measurement of a named cloud.";
    var tail = preset ? preset.why : custom;
    var why = "Uniform-sphere Jeans mass. M_J = (5 k T / (G \u03bc m_H))^(3/2) * (3 / (4 \u03c0 \u03c1))^(1/2), with \u03c1 = n \u03bc m_H. "
      + "At " + tText + " K, n = " + nText + " per cm^3, and \u03bc = " + muText + ", this arithmetic is " + massText + ". "
      + "The Jeans length on this page is the critical radius of that sphere, R_J = (15 k T / (4 \u03c0 G \u03bc m_H \u03c1))^(1/2), which is " + lengthText + ". "
      + "The free-fall time t_ff = (3 \u03c0 / (32 G \u03c1))^(1/2) is " + timeText + ". The unrounded time is " + timeRaw + " years. "
      + "A wavelength form, (\u03c0 k T / (G \u03bc m_H \u03c1))^(1/2), is " + waveText + " here. This page does not substitute it. "
      + "The ratio of the two lengths is \u221a15 / (2 \u03c0), which is " + ratioText + ". "
      + tail + " Classroom uniform-sphere picture, not a simulation of a cloud.";
    return {
      ok: true,
      T: T,
      n: n,
      mu: mu,
      rho: rho,
      massKg: massKg,
      solar: solar,
      lengthM: lengthM,
      pc: pc,
      waveM: waveM,
      seconds: tS,
      years: years,
      preset: preset,
      id: preset ? preset.id : "",
      title: preset ? preset.name : "Custom",
      tier: preset ? preset.tier : "Sliders · not a named cloud",
      tText: tText,
      nText: nText,
      muText: muText,
      massText: massText,
      lengthText: lengthText,
      timeText: timeText,
      timeRaw: timeRaw,
      waveText: waveText,
      ratioText: ratioText,
      rhoText: formatRho(rho),
      nM3Text: formatNm3(n),
      range: massText + " · " + lengthText + " · " + timeText,
      why: why,
      aria: "Jeans mass " + massText + " at " + tText + " kelvin and " + nText + " per cubic centimetre. Jeans length " + lengthText + ". Free-fall time " + timeText + ". Not a simulation of a cloud."
    };
  }

  function series(T, mu, steps) {
    var count = steps || 64;
    var pts = [];
    var i;
    for (i = 0; i <= count; i++) {
      var u = i / count;
      var n = Math.exp(Math.log(N_MIN) + u * (Math.log(N_MAX) - Math.log(N_MIN)));
      if (i === 0) n = N_MIN;
      if (i === count) n = N_MAX;
      pts.push({ n: n, solar: jeansMassKg(T, n, mu) / M_SUN });
    }
    return pts;
  }

  function reference() {
    return scene({ T: 10, n: 10000, mu: 1 });
  }

  return {
    K: K,
    G: G,
    M_P: M_P,
    M_E: M_E,
    M_H: M_H,
    GM_SUN: GM_SUN,
    M_SUN: M_SUN,
    AU_M: AU_M,
    PC_M: PC_M,
    YEAR_S: YEAR_S,
    NOTES_MASS: NOTES_MASS,
    NOTES_RADIUS_PC: NOTES_RADIUS_PC,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    N_MIN: N_MIN,
    N_MAX: N_MAX,
    MU_MIN: MU_MIN,
    MU_MAX: MU_MAX,
    SLIDER_STEPS: SLIDER_STEPS,
    LENGTH_RATIO: LENGTH_RATIO,
    presets: presets,
    presetById: presetById,
    density: density,
    jeansMassKg: jeansMassKg,
    jeansLengthM: jeansLengthM,
    waveLengthM: waveLengthM,
    freeFallS: freeFallS,
    formatSig: formatSig,
    formatSolar: formatSolar,
    formatPc: formatPc,
    formatTime: formatTime,
    formatYearsRaw: formatYearsRaw,
    formatT: formatT,
    formatMu: formatMu,
    formatN: formatN,
    formatRho: formatRho,
    clamp: clamp,
    sliderPos: sliderPos,
    valueFromSlider: valueFromSlider,
    scene: scene,
    series: series,
    reference: reference,
    matchPreset: matchPreset
  };
});
