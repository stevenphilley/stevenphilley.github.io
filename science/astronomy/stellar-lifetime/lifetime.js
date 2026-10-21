/*! Stellar-lifetime desk.
    Luminosity scaling is the six-piece main-sequence mass–luminosity fit of
    Eker et al. 2018, MNRAS 479, 5491 (arXiv:1807.02568), Table 4:
    log10(L/L☉) = a log10(M/M☉) + b, inside 0.179 < M/M☉ ≤ 31.
    The pieces are separate least-squares lines. They are not forced to meet.
    Main-sequence lifetime scaling is t = 10 Gyr × (M/M☉) / (L/L☉).
    The 10 Gyr zero is the classroom round number next to NASA's 4.6 Gyr solar
    age plus about 5 Gyr still on the main sequence (sum 9.6). It is not a
    published stellar-model age.
    End-state labels follow NASA Science "Star types": less than 8 M☉ white
    dwarf, about 8 to 20 M☉ neutron star, heavier a black hole. Those edges
    are approximate. Heger et al. 2003 move them with metallicity, rotation,
    and mass loss.
    Preset masses and luminosities are cited central values. Formula outputs
    are scaling estimates and are not those measured or adopted numbers. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Lifetime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Classroom zero for t ≈ 10 Gyr × (M/M☉) / (L/L☉). Not a model age. */
  var TAU_SUN_GYR = 10;

  /* Planck Collaboration 2020, A&A 641, A6, Table 2.
     Column TT,TE,EE+lowE+lensing. The +BAO column is kept beside it. */
  var AGE_UNIVERSE_GYR = 13.797;
  var AGE_UNIVERSE_ERR = 0.023;
  var AGE_UNIVERSE_BAO_GYR = 13.787;
  var AGE_UNIVERSE_BAO_ERR = 0.020;

  /* NASA Science, Star types. Classroom split, not a sharp boundary. */
  var WD_LIMIT = 8;
  var NS_LIMIT = 20;

  /* Slider domain. The Eker fit is narrower than the slider. */
  var M_MIN = 0.1;
  var M_MAX = 60;

  /* Eker et al. 2018, Table 4. Lower edge of each piece is exclusive. */
  var MLR_LO = 0.179;
  var MLR_HI = 31;

  /* Plot window. Long life is up. Low mass is left. */
  var T_MIN = 1e-4;
  var T_MAX = 3000;

  /* Table 4. aErr and bErr are the parenthetical uncertainties on a and b.
     sigma is the standard deviation of that piece, in log10 L. n is the
     number of stars. r2 is the printed correlation coefficient. */
  var PIECES = [
    { id: "ultra", name: "Ultra low-mass", lo: 0.179, hi: 0.45, a: 2.028, aErr: 0.135, b: -0.976, bErr: 0.070, sigma: 0.076, n: 22, r2: 0.919 },
    { id: "very-low", name: "Very low-mass", lo: 0.45, hi: 0.72, a: 4.572, aErr: 0.319, b: -0.102, bErr: 0.076, sigma: 0.109, n: 35, r2: 0.857 },
    { id: "low", name: "Low mass", lo: 0.72, hi: 1.05, a: 5.743, aErr: 0.413, b: -0.007, bErr: 0.026, sigma: 0.129, n: 53, r2: 0.787 },
    { id: "intermediate", name: "Intermediate mass", lo: 1.05, hi: 2.4, a: 4.329, aErr: 0.087, b: 0.010, bErr: 0.019, sigma: 0.140, n: 275, r2: 0.901 },
    { id: "high", name: "High mass", lo: 2.4, hi: 7, a: 3.967, aErr: 0.143, b: 0.093, bErr: 0.083, sigma: 0.165, n: 80, r2: 0.907 },
    { id: "very-high", name: "Very high mass", lo: 7, hi: 31, a: 2.865, aErr: 0.155, b: 1.105, bErr: 0.176, sigma: 0.152, n: 44, r2: 0.888 }
  ];

  function pieces() {
    return PIECES.map(function (p) {
      return {
        id: p.id, name: p.name, lo: p.lo, hi: p.hi,
        a: p.a, aErr: p.aErr, b: p.b, bErr: p.bErr,
        sigma: p.sigma, n: p.n, r2: p.r2
      };
    });
  }

  function pieceFor(m) {
    if (!(m > MLR_LO) || m > MLR_HI) return null;
    var i;
    for (i = 0; i < PIECES.length; i++) {
      var p = PIECES[i];
      if (m > p.lo && m <= p.hi) return pieces()[i];
    }
    return null;
  }

  function inFit(m) {
    return pieceFor(m) != null;
  }

  /* Central fit. Null outside 0.179 < M ≤ 31. Not extrapolated. */
  function scalingLogL(m) {
    var p = pieceFor(m);
    if (!p) return NaN;
    return p.a * Math.log10(m) + p.b;
  }

  function scalingLuminosity(m) {
    var logL = scalingLogL(m);
    if (!isFinite(logL)) return NaN;
    return Math.pow(10, logL);
  }

  /* Approximate scaling. L is L/L☉, m is M/M☉. */
  function lifetimeGyr(m, l) {
    if (!(m > 0) || !(l > 0)) return NaN;
    return TAU_SUN_GYR * m / l;
  }

  function scalingLifetime(m) {
    return lifetimeGyr(m, scalingLuminosity(m));
  }

  function endState(m) {
    if (!(m > 0)) return null;
    if (m < WD_LIMIT) {
      return {
        id: "wd",
        name: "White dwarf",
        why: "Below 8 solar masses, NASA’s classroom split leaves a white dwarf after the giant sheds its envelope. The edge is approximate."
      };
    }
    if (m <= NS_LIMIT) {
      return {
        id: "ns",
        name: "Neutron star",
        why: "From about 8 to 20 solar masses, NASA’s classroom split leaves a neutron star after core collapse. Heger et al. carry neutron stars up to about 20–25 solar masses in a solar-metallicity sketch. The edge is approximate."
      };
    }
    return {
      id: "bh",
      name: "Black hole",
      why: "Above about 20 solar masses, NASA’s classroom split leaves a black hole. Heger et al. 2003 place fallback black holes near a 25 solar-mass main-sequence star in one no-mass-loss mapping, and they say metallicity, rotation, and mass loss move the result."
    };
  }

  function logMap(u, lo, hi) {
    var t = Math.min(1, Math.max(0, u));
    return Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo)));
  }

  function logUnmap(v, lo, hi) {
    if (!(v > 0)) return 0;
    var t = (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return Math.min(1, Math.max(0, t));
  }

  function xFrac(m) {
    return (Math.log(m) - Math.log(M_MIN)) / (Math.log(M_MAX) - Math.log(M_MIN));
  }

  function mFromXFrac(f) {
    var u = Math.min(1, Math.max(0, f));
    return Math.exp(Math.log(M_MIN) + u * (Math.log(M_MAX) - Math.log(M_MIN)));
  }

  /* 0 at the top (long life), 1 at the bottom (short life). */
  function yFrac(t) {
    var u = (Math.log(t) - Math.log(T_MIN)) / (Math.log(T_MAX) - Math.log(T_MIN));
    return 1 - u;
  }

  function tFromYFrac(f) {
    var u = 1 - Math.min(1, Math.max(0, f));
    return Math.exp(Math.log(T_MIN) + u * (Math.log(T_MAX) - Math.log(T_MIN)));
  }

  function curveSegments(steps) {
    var n = steps || 48;
    return PIECES.map(function (p) {
      var pts = [];
      var i;
      var lo = p.lo * (1 + 1e-9);
      for (i = 0; i <= n; i++) {
        var u = i / n;
        var m = Math.exp(Math.log(lo) + u * (Math.log(p.hi) - Math.log(lo)));
        if (i === n) m = p.hi;
        var L = scalingLuminosity(m);
        pts.push({ m: m, L: L, t: lifetimeGyr(m, L) });
      }
      return { id: p.id, name: p.name, points: pts };
    });
  }

  function trimFixed(v, digits) {
    var t = v.toFixed(digits);
    return t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function formatLum(v) {
    if (!(v > 0) || !isFinite(v)) return "—";
    var exp = Math.floor(Math.log10(v));
    if (exp >= -3 && exp < 3) {
      var p = Math.pow(10, 2 - exp);
      var r = Math.round(v * p) / p;
      return trimFixed(r, Math.max(0, 2 - exp));
    }
    var mant = v / Math.pow(10, exp);
    mant = Math.round(mant * 100) / 100;
    if (mant >= 10) {
      mant = Math.round((mant / 10) * 100) / 100;
      exp += 1;
    }
    return trimFixed(mant, 2) + "×10^" + exp;
  }

  function formatMass(v) {
    if (!(v > 0) || !isFinite(v)) return "—";
    var exp = Math.floor(Math.log10(v));
    var p = Math.pow(10, 2 - exp);
    var r = Math.round(v * p) / p;
    return trimFixed(r, Math.max(0, 2 - exp));
  }

  function formatLife(gyr) {
    if (!(gyr > 0) || !isFinite(gyr)) return "—";
    if (gyr >= 100) return trimFixed(gyr, 0) + " Gyr";
    if (gyr >= 10) return trimFixed(gyr, 2) + " Gyr";
    if (gyr >= 1) return trimFixed(gyr, 2) + " Gyr";
    var myr = gyr * 1000;
    if (myr >= 100) return trimFixed(myr, 0) + " Myr";
    if (myr >= 10) return trimFixed(myr, 1) + " Myr";
    if (myr >= 1) return trimFixed(myr, 2) + " Myr";
    var kyr = myr * 1000;
    if (kyr >= 10) return trimFixed(kyr, 1) + " kyr";
    return trimFixed(kyr, 2) + " kyr";
  }

  function formatLifeTick(gyr) {
    if (gyr >= 1) return trimFixed(gyr, gyr >= 100 ? 0 : 0) + " Gyr";
    var myr = gyr * 1000;
    if (myr >= 1) return trimFixed(myr, 0) + " Myr";
    return trimFixed(myr * 1000, 0) + " kyr";
  }

  /* Cited presets. L and M are the published numbers. The fit is separate.
     massText and lumText are the printed central values, so the page does
     not invent extra digits. mainSequence is false only for Rigel. */
  function presets() {
    return [
      {
        id: "sun",
        name: "Sun",
        tier: "Nominal luminosity · mass is 1 by definition",
        M: 1,
        massText: "1",
        dMPlus: 0,
        dMMinus: 0,
        L: 1,
        lumText: "1",
        lumKind: "nominal",
        mainSequence: true,
        ageText: "4.6 Gyr",
        why: "The nominal luminosity is 1 L☉. The fit at 1 M☉ is not exactly 1, because the low-mass line was not forced through the Sun. The lifetime scaling with L = 1 is exactly 10 Gyr.",
        note: "IAU 2015 Resolution B3 sets the nominal solar luminosity at 3.828 × 10²⁶ W, which is 1 L☉ on this page. NASA Science calls the Sun a 4.6-billion-year-old main-sequence star and expects about another 5 billion years of core hydrogen fusion. This desk’s 10 Gyr zero is the round classroom number beside that 9.6 Gyr sum, not a model age."
      },
      {
        id: "proxima",
        name: "Proxima Centauri",
        tier: "Ribas et al. 2017 · below the fit",
        M: 0.120,
        massText: "0.120",
        dMPlus: 0.003,
        dMMinus: 0.003,
        L: 0.00151,
        lumText: "0.00151",
        lumKind: "published",
        mainSequence: true,
        ageText: "",
        why: "Published mass 0.120 M☉ sits below 0.179 M☉, so the six-piece fit is not applied. The lifetime row uses the published luminosity. It is still only M/L.",
        note: "Ribas et al. 2017: M = 0.120 ± 0.003 M☉, L = 0.00151 ± 0.00008 L☉. The mass is from their stellar analysis, not a dynamical orbit. The fit starts above 0.179 M☉ and is not extrapolated down."
      },
      {
        id: "sirius-a",
        name: "Sirius A",
        tier: "Bond et al. 2017 · dynamical mass",
        M: 2.063,
        massText: "2.063",
        dMPlus: 0.023,
        dMMinus: 0.023,
        L: 24.74,
        lumText: "24.74",
        lumKind: "published",
        mainSequence: true,
        ageText: "237 ± 15 Myr",
        why: "Dynamical mass and the adopted luminosity are both from Bond et al. 2017. The fit’s luminosity is a mean main-sequence line, not that measurement. The cited age is a model age from zero-age main sequence, not this scaling.",
        note: "Bond et al. 2017: dynamical mass 2.063 ± 0.023 M☉, luminosity 24.74 ± 0.70 L☉ adopted from Davis et al. 2011 adjusted to their parallax. Their YREC age, relative to the zero-age main sequence, is 237 ± 15 Myr. Sirius A is still on the main sequence in that comparison. The white-dwarf label is the rough end for a single star of this mass, not a description of Sirius B."
      },
      {
        id: "vega",
        name: "Vega",
        tier: "Monnier mass · Hill luminosity",
        M: 2.15,
        massText: "2.15",
        dMPlus: 0.10,
        dMMinus: 0.15,
        L: 44,
        lumText: "44",
        lumKind: "published",
        mainSequence: true,
        ageText: "700 Myr",
        why: "The mass and the luminosity are from two papers. Vega rotates rapidly and is seen nearly pole-on, so a mean mass–luminosity line for binary components is not a prediction of this star. The cited age is Monnier et al.’s evolutionary age, not M/L.",
        note: "Monnier et al. 2012: mass 2.15 M☉ with uncertainties +0.10 and −0.15, age 700 Myr with uncertainties −75 and +150, from rotating Geneva tracks. Hill, Gulliver, and Adelman 2010: luminosity 44 ± 2 L☉. The mass is an evolutionary estimate, not a dynamical mass."
      },
      {
        id: "rigel",
        name: "Rigel",
        tier: "Blue supergiant · not on the main sequence",
        M: 23,
        massText: "23",
        dMPlus: 0,
        dMMinus: 0,
        L: Math.pow(10, 5.08),
        lumText: "10^5.08",
        logL: 5.08,
        lumKind: "published",
        mainSequence: false,
        ageText: "",
        why: "Rigel is a blue supergiant. The fit describes main-sequence stars. The number it returns at 23 M☉ is the scaling for a main-sequence star of that mass, not Rigel’s present luminosity. Putting the published luminosity into M/L is not a main-sequence lifetime either.",
        note: "Moravveji et al. 2012 adopt log(L/L☉) = 5.08, uncertainties +0.07 and −0.10, and a mass of 23 M☉ from Przybilla et al. 2010 Geneva tracks that include rotation. They do not print an uncertainty on 23. The mass is a track mass, not a dynamical mass. Rigel has left the main sequence."
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

  function publishedLifetime(preset) {
    if (!preset) return NaN;
    return lifetimeGyr(preset.M, preset.L);
  }

  return {
    TAU_SUN_GYR: TAU_SUN_GYR,
    AGE_UNIVERSE_GYR: AGE_UNIVERSE_GYR,
    AGE_UNIVERSE_ERR: AGE_UNIVERSE_ERR,
    AGE_UNIVERSE_BAO_GYR: AGE_UNIVERSE_BAO_GYR,
    AGE_UNIVERSE_BAO_ERR: AGE_UNIVERSE_BAO_ERR,
    WD_LIMIT: WD_LIMIT,
    NS_LIMIT: NS_LIMIT,
    M_MIN: M_MIN,
    M_MAX: M_MAX,
    MLR_LO: MLR_LO,
    MLR_HI: MLR_HI,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    pieces: pieces,
    pieceFor: pieceFor,
    inFit: inFit,
    scalingLogL: scalingLogL,
    scalingLuminosity: scalingLuminosity,
    lifetimeGyr: lifetimeGyr,
    scalingLifetime: scalingLifetime,
    endState: endState,
    logMap: logMap,
    logUnmap: logUnmap,
    xFrac: xFrac,
    mFromXFrac: mFromXFrac,
    yFrac: yFrac,
    tFromYFrac: tFromYFrac,
    curveSegments: curveSegments,
    formatLum: formatLum,
    formatMass: formatMass,
    formatLife: formatLife,
    formatLifeTick: formatLifeTick,
    presets: presets,
    presetById: presetById,
    publishedLifetime: publishedLifetime
  };
});
