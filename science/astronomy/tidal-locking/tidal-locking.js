/*! Tidal-locking desk. Order-of-magnitude despinning time.
    t_lock = (ω a^6 I Q) / (3 G m_p^2 k2 R^5)
    I = f m_s R^2. The uniform-sphere default is f = 0.4.
    This is the inversion of equation (2) in Hinkel & Kane 2013,
    ApJ 774, 27 (arXiv:1307.4760): the tidal locking radius
    r_TL ≈ (3 G M_p^2 k2 R^5 t_L / (ω0 I Q))^(1/6).
    They attribute that expression to Peale 1977 and
    Gladman et al. 1996, Icarus 122, 166. This page has not
    re-read those two. Cuartas-Restrepo et al., arXiv:1606.07546,
    equation (5), print twice this time and also cite Gladman.
    The factor of two is not substituted. They are not averaged.
    Q and k2 are very uncertain. Order of magnitude only.
    Not a tidal-evolution model. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TidalLock = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* 2022 CODATA central value. The uncertainty is not folded in.
     https://physics.nist.gov/cgi-bin/cuu/Value?bg */
  var G = 6.67430e-11;

  /* IAU 2012 Resolution B2. The astronomical unit is exactly this many metres.
     Used only to turn the archive’s AU into metres. */
  var AU_M = 149597870700;

  /* Julian year, 365.25 × 86400 s. Not a fact-sheet sidereal year. */
  var YEAR_S = 365.25 * 86400;

  /* Earth Fact Sheet, volumetric mean radius. The Proxima radius is
     1.02 of this length. The archive row does not print its Earth radius. */
  var EARTH_RADIUS_M = 6371.000 * 1000;

  /* Earth Fact Sheet mass, 15 November 2024. Not the Moon sheet’s Earth column. */
  var EARTH_MASS_KG = 5.9722e24;

  /* Sun Fact Sheet mass, 1,988,400 × 10^24 kg. */
  var SUN_MASS_KG = 1988400 * 1e24;

  /* Jupiter Fact Sheet mass. */
  var JUPITER_MASS_KG = 1898.13 * 1e24;

  /* Hinkel & Kane 2013, citing Kasting et al. 1993.
     One rotation per 13.5 hours, and Q = 100.
     k2 = 0.3 is Hinkel & Kane’s own value.
     These are assumptions on every preset. They are not measurements. */
  var ASSUMED_SPIN_H = 13.5;
  var ASSUMED_Q = 100;
  var ASSUMED_K2 = 0.3;
  var ASSUMED_F = 0.4;

  var SPIN_MIN = 0.5;
  var SPIN_MAX = 2000;
  var A_MIN_KM = 1e5;
  var A_MAX_KM = 1e8;
  var MASS_MIN = 1e20;
  var MASS_MAX = 1e26;
  var PARTNER_MIN = 1e22;
  var PARTNER_MAX = 5e30;
  var RADIUS_MIN = 100;
  var RADIUS_MAX = 20000;
  var Q_MIN = 1;
  var Q_MAX = 1e5;
  var K2_MIN = 0.001;
  var K2_MAX = 1.5;
  var F_MIN = 0.2;
  var F_MAX = 0.5;
  var SLIDER_STEPS = 1000;

  /* Pluto sheet: |sidereal rotation| / 24 equals Charon’s printed period.
     Checked here so the mutual-lock note does not invent the match. */
  var PLUTO_ROT_H = 153.2928;
  var CHARON_DAYS = 6.3872;

  var PRESETS = [
    {
      id: "moon",
      name: "Moon–Earth",
      tier: "Moon Fact Sheet · assumed Q, k2, and initial spin",
      spinH: ASSUMED_SPIN_H,
      aKm: 0.3844e6,
      massKg: 0.07346e24,
      radiusKm: 1737.4,
      partnerKg: EARTH_MASS_KG,
      q: ASSUMED_Q,
      k2: ASSUMED_K2,
      f: 0.394,
      spinAssumed: true,
      qAssumed: true,
      k2Assumed: true,
      fAssumed: false,
      massNote: "minimum-mass",
      radiusNote: "volumetric"
    },
    {
      id: "io",
      name: "Io–Jupiter",
      tier: "Jovian Satellite Fact Sheet · assumed Q, k2, f, and initial spin",
      spinH: ASSUMED_SPIN_H,
      aKm: 421.8e3,
      massKg: 893.2e20,
      radiusKm: 1821.5,
      partnerKg: JUPITER_MASS_KG,
      q: ASSUMED_Q,
      k2: ASSUMED_K2,
      f: ASSUMED_F,
      spinAssumed: true,
      qAssumed: true,
      k2Assumed: true,
      fAssumed: true,
      massNote: "printed",
      radiusNote: "printed"
    },
    {
      id: "mercury",
      name: "Mercury–Sun",
      tier: "Mercury Fact Sheet · 3:2, not 1:1 · assumed Q, k2, and initial spin",
      spinH: ASSUMED_SPIN_H,
      aKm: 57.909e6,
      massKg: 0.33010e24,
      radiusKm: 2439.7,
      partnerKg: SUN_MASS_KG,
      q: ASSUMED_Q,
      k2: ASSUMED_K2,
      f: 0.35,
      spinAssumed: true,
      qAssumed: true,
      k2Assumed: true,
      fAssumed: false,
      massNote: "printed",
      radiusNote: "volumetric"
    },
    {
      id: "proxima",
      name: "Proxima b",
      tier: "NASA Exoplanet Archive · assumed radius unit, Q, k2, f, and initial spin",
      spinH: ASSUMED_SPIN_H,
      aKm: 0.04848 * AU_M / 1000,
      massKg: 1.055 * EARTH_MASS_KG,
      radiusKm: 1.02 * EARTH_RADIUS_M / 1000,
      partnerKg: 0.1221 * SUN_MASS_KG,
      q: ASSUMED_Q,
      k2: ASSUMED_K2,
      f: ASSUMED_F,
      spinAssumed: true,
      qAssumed: true,
      k2Assumed: true,
      fAssumed: true,
      massNote: "minimum-mass",
      radiusNote: "estimate"
    }
  ];

  function finite(x) {
    return typeof x === "number" && isFinite(x);
  }

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
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
    if (parts.exp >= 0 && parts.exp < 6) {
      var decimals = (sig - 1) - parts.exp;
      if (decimals < 0) decimals = 0;
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

  function formatTime(years) {
    if (!(years > 0) || !isFinite(years)) return "—";
    if (years >= 1e12) return formatSig(years / 1e12, 6) + " trillion years";
    if (years >= 1e9) return formatSig(years / 1e9, 6) + " billion years";
    if (years >= 1e6) return formatSig(years / 1e6, 6) + " million years";
    if (years >= 1e3) return formatSig(years / 1e3, 6) + " thousand years";
    if (years >= 1) return formatSig(years, 6) + " years";
    var days = years * 365.25;
    if (days >= 1) return formatSig(days, 6) + " days";
    var hours = days * 24;
    if (hours >= 1) return formatSig(hours, 6) + " hours";
    return formatSig(years, 6) + " years";
  }

  function formatYearsRaw(years) {
    if (!(years > 0) || !isFinite(years)) return "—";
    return formatSig(years, 6);
  }

  function omegaFromHours(hours) {
    if (!(hours > 0)) return NaN;
    return (2 * Math.PI) / (hours * 3600);
  }

  /* Seconds. Constant-magnitude torque at the initial spin.
     The orbital rate is not subtracted. a is held fixed. */
  function lockSeconds(opts) {
    opts = opts || {};
    var spinH = Number(opts.spinH);
    var aKm = Number(opts.aKm);
    var massKg = Number(opts.massKg);
    var radiusKm = Number(opts.radiusKm);
    var partnerKg = Number(opts.partnerKg);
    var q = Number(opts.q);
    var k2 = Number(opts.k2);
    var f = Number(opts.f);
    if (!(spinH > 0) || !(aKm > 0) || !(massKg > 0) || !(radiusKm > 0)) return NaN;
    if (!(partnerKg > 0) || !(q > 0) || !(k2 > 0) || !(f > 0)) return NaN;
    if (!finite(spinH) || !finite(aKm) || !finite(massKg) || !finite(radiusKm)) return NaN;
    if (!finite(partnerKg) || !finite(q) || !finite(k2) || !finite(f)) return NaN;
    var a = aKm * 1000;
    var r = radiusKm * 1000;
    var inertia = f * massKg * r * r;
    var omega = omegaFromHours(spinH);
    var num = omega * Math.pow(a, 6) * inertia * q;
    var den = 3 * G * partnerKg * partnerKg * k2 * Math.pow(r, 5);
    if (!(den > 0)) return NaN;
    return num / den;
  }

  function lockYears(opts) {
    var s = lockSeconds(opts);
    if (!(s > 0)) return NaN;
    return s / YEAR_S;
  }

  function presets() {
    return PRESETS.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        tier: p.tier,
        spinH: p.spinH,
        aKm: p.aKm,
        massKg: p.massKg,
        radiusKm: p.radiusKm,
        partnerKg: p.partnerKg,
        q: p.q,
        k2: p.k2,
        f: p.f,
        spinAssumed: p.spinAssumed,
        qAssumed: p.qAssumed,
        k2Assumed: p.k2Assumed,
        fAssumed: p.fAssumed,
        massNote: p.massNote,
        radiusNote: p.radiusNote
      };
    });
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return presets()[i];
    }
    return null;
  }

  function same(a, b) {
    if (!finite(a) || !finite(b)) return false;
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function matchPreset(opts) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      if (same(opts.spinH, p.spinH) && same(opts.aKm, p.aKm) && same(opts.massKg, p.massKg) &&
          same(opts.radiusKm, p.radiusKm) && same(opts.partnerKg, p.partnerKg) &&
          same(opts.q, p.q) && same(opts.k2, p.k2) && same(opts.f, p.f)) {
        return presets()[i];
      }
    }
    return null;
  }

  function sliderPos(value, min, max, log) {
    if (!(value > 0) || !(max > min)) return 0;
    var t;
    if (log) t = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
    else t = (value - min) / (max - min);
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

  function disclaimer() {
    return "Order of magnitude only. Q and k2 are very uncertain. Not a tidal-evolution model.";
  }

  function whyFor(preset, years, halfYears, f) {
    var time = formatTime(years);
    var half = formatTime(halfYears);
    var common = " The formula is t_lock = (ω a^6 I Q) / (3 G m_p^2 k2 R^5), with ω = 2π divided by the initial spin period. It is the inversion of Hinkel & Kane 2013, equation (2). Cuartas-Restrepo et al., arXiv:1606.07546, equation (5), print twice this time. The factor of two is not substituted. Q = 100 and k2 = 0.3 are the assumptions Hinkel & Kane state, with the 13.5 hour spin and Q = 100 taken by them from Kasting et al. 1993. They are not measurements of this body. The present semimajor axis is held fixed. A real body may have locked closer in, and t_lock scales as a^6. At half this distance the same other inputs give " + half + ", this time divided by 64. Eccentricity is not in the formula. " + disclaimer();
    if (!preset) {
      return "Custom inputs. I = " + formatSig(f, 4) + " m_s R^2. The time is " + time + "." + common;
    }
    if (preset.id === "moon") {
      return "Moon–Earth. The Moon Fact Sheet prints mass 0.07346 × 10^24 kg, volumetric mean radius 1,737.4 km, I/MR^2 = 0.394, and semimajor axis 0.3844 × 10^6 km. The partner is the Earth Fact Sheet mass 5.9722 × 10^24 kg. The Moon sheet’s Earth column, 5.9724 × 10^24 kg, is not substituted. The sheet’s sidereal rotation, 655.720 hours, is the locked state. It is not this initial spin. The initial spin is the assumed 13.5 hours. Q and k2 are assumed. The time is " + time + "." + common;
    }
    if (preset.id === "io") {
      return "Io–Jupiter. The Jovian Satellite Fact Sheet prints Io’s mass 893.2 × 10^20 kg, radius 1,821.5 km, and semimajor axis 421.8 × 10^3 km. The rotation column is S, synchronous, with orbital period 1.769138 days. That present lock is not the initial spin. The partner is the Jupiter Fact Sheet mass 1,898.13 × 10^24 kg. The satellite sheet does not print I/MR^2, so f = 0.4 is assumed. Q and k2 are assumed. The time is " + time + "." + common;
    }
    if (preset.id === "mercury") {
      return "Mercury–Sun. The Mercury Fact Sheet prints mass 0.33010 × 10^24 kg, volumetric mean radius 2,439.7 km, I/MR^2 = 0.35, and semimajor axis 57.909 × 10^6 km. Divided by the IAU 2012 astronomical unit that length is 0.387098 AU. The same sheet’s J2000 semimajor axis, 0.38709893 AU, is not substituted. The partner is the Sun Fact Sheet mass 1,988,400 × 10^24 kg. The sidereal rotation is 1407.6 hours and the sidereal orbit is 87.969 days. Orbits per sidereal rotation are 1.4999, near 3/2, not exactly 3/2. NASA Science calls that a 3:2 resonance: three turns for every two revolutions. It is not 1:1. This time is the order-of-magnitude despinning time toward synchronous rotation. It is not a capture time into the 3:2. The initial spin, Q, and k2 are assumed. The time is " + time + "." + common;
    }
    return "Proxima b, a habitable-zone planet around an M dwarf on the habitable-zone desk. The NASA Exoplanet Archive composite row prints pl_bmasse = 1.055 M⊕ with pl_bmassprov Msini, pl_rade = 1.02 with a null error, pl_orbsmax = 0.04848 AU, pl_orbper = 11.18465 days, and st_mass = 0.1221 M☉. NASA Science’s catalog card prints mass 1.055 Earths, radius 1.02 × Earth (estimate), and orbital radius 0.04848 AU. The sentence on that card says 1.07 Earths, 11.2 days, and 0.04856 AU. Those are not averaged. 1.055 M⊕ is a minimum mass. Using it as the true mass assumes an edge-on orbit. 1.02 R⊕ uses the Earth sheet’s volumetric mean radius, 6,371.000 km. The archive does not print that unit. 0.1221 M☉ uses the Sun sheet’s mass. f = 0.4, Q, k2, and the initial spin are assumed. The time is " + time + "." + common;
  }

  function scene(opts) {
    opts = opts || {};
    var spinH = Number(opts.spinH);
    var aKm = Number(opts.aKm);
    var massKg = Number(opts.massKg);
    var radiusKm = Number(opts.radiusKm);
    var partnerKg = Number(opts.partnerKg);
    var q = Number(opts.q);
    var k2 = Number(opts.k2);
    var f = Number(opts.f);
    var years = lockYears({
      spinH: spinH, aKm: aKm, massKg: massKg, radiusKm: radiusKm,
      partnerKg: partnerKg, q: q, k2: k2, f: f
    });
    if (!(years > 0)) return { ok: false, why: "" };
    var half = lockYears({
      spinH: spinH, aKm: aKm / 2, massKg: massKg, radiusKm: radiusKm,
      partnerKg: partnerKg, q: q, k2: k2, f: f
    });
    var preset = matchPreset({
      spinH: spinH, aKm: aKm, massKg: massKg, radiusKm: radiusKm,
      partnerKg: partnerKg, q: q, k2: k2, f: f
    });
    var au = (aKm * 1000) / AU_M;
    return {
      ok: true,
      id: preset ? preset.id : "",
      name: preset ? preset.name : "Custom",
      tier: preset ? preset.tier : "Custom inputs · order of magnitude only",
      years: years,
      halfYears: half,
      timeText: formatTime(years),
      halfText: formatTime(half),
      timeRaw: formatYearsRaw(years),
      halfRaw: formatYearsRaw(half),
      auText: formatSig(au, 6) + " AU",
      spinText: formatSig(spinH, 4) + " h",
      qText: formatSig(q, 4),
      k2Text: formatSig(k2, 4),
      fText: formatSig(f, 4),
      assumedQ: true,
      assumedK2: true,
      why: whyFor(preset, years, half, f)
    };
  }

  function series(opts, count) {
    var n = count || 48;
    var rows = [];
    var i;
    for (i = 0; i < n; i++) {
      var t = n === 1 ? 0 : i / (n - 1);
      var a = Math.exp(Math.log(A_MIN_KM) + t * (Math.log(A_MAX_KM) - Math.log(A_MIN_KM)));
      var years = lockYears({
        spinH: opts.spinH,
        aKm: a,
        massKg: opts.massKg,
        radiusKm: opts.radiusKm,
        partnerKg: opts.partnerKg,
        q: opts.q,
        k2: opts.k2,
        f: opts.f
      });
      rows.push({ aKm: a, years: years });
    }
    return rows;
  }

  return {
    G: G,
    AU_M: AU_M,
    YEAR_S: YEAR_S,
    EARTH_RADIUS_M: EARTH_RADIUS_M,
    EARTH_MASS_KG: EARTH_MASS_KG,
    SUN_MASS_KG: SUN_MASS_KG,
    JUPITER_MASS_KG: JUPITER_MASS_KG,
    ASSUMED_SPIN_H: ASSUMED_SPIN_H,
    ASSUMED_Q: ASSUMED_Q,
    ASSUMED_K2: ASSUMED_K2,
    ASSUMED_F: ASSUMED_F,
    SPIN_MIN: SPIN_MIN,
    SPIN_MAX: SPIN_MAX,
    A_MIN_KM: A_MIN_KM,
    A_MAX_KM: A_MAX_KM,
    MASS_MIN: MASS_MIN,
    MASS_MAX: MASS_MAX,
    PARTNER_MIN: PARTNER_MIN,
    PARTNER_MAX: PARTNER_MAX,
    RADIUS_MIN: RADIUS_MIN,
    RADIUS_MAX: RADIUS_MAX,
    Q_MIN: Q_MIN,
    Q_MAX: Q_MAX,
    K2_MIN: K2_MIN,
    K2_MAX: K2_MAX,
    F_MIN: F_MIN,
    F_MAX: F_MAX,
    SLIDER_STEPS: SLIDER_STEPS,
    PLUTO_ROT_H: PLUTO_ROT_H,
    CHARON_DAYS: CHARON_DAYS,
    presets: presets,
    presetById: presetById,
    lockSeconds: lockSeconds,
    lockYears: lockYears,
    scene: scene,
    series: series,
    formatTime: formatTime,
    formatSig: formatSig,
    sliderPos: sliderPos,
    valueFromSlider: valueFromSlider,
    clamp: clamp,
    disclaimer: disclaimer,
    omegaFromHours: omegaFromHours
  };
});
