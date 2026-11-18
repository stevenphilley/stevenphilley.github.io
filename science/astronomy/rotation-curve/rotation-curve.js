/*! Galaxy rotation curves. Educational schematic, not a mass model.
    v(r) = sqrt(G M(<r) / r). Components add in quadrature,
    which is the same statement as adding enclosed masses.
    Bulge: Plummer sphere. a = 0 is a point mass, v ∝ r^(−1/2).
    Disk: exponential surface density, mass inside a cylinder,
    then v^2 = G M / r as if that mass were spherical.
    Halo: pseudo-isothermal, v^2 = v∞^2 (1 − (rc/r) arctan(r/rc)).
    G is the NIST 2022 CODATA central value, 6.67430 × 10^−11.
    A solar mass is the IAU 2015 nominal GM☉ divided by that G,
    so M/M☉ = v^2 r / GM☉ and G cancels.
    The cited Sun uses GRAVITY Collaboration 2019, R0 = 8178 pc,
    and Eilers et al. 2019, vc = 229.0 km/s. Eilers adopted
    8.122 kpc. Those two radii are not averaged.
    Slider values are classroom numbers, not fits. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.RotationCurve = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* NIST 2022 CODATA. Standard uncertainty 0.00015 × 10^−11.
     https://physics.nist.gov/cgi-bin/cuu/Value?bg */
  var G = 6.67430e-11;

  /* IAU 2015 Resolution B3, nominal solar mass parameter. Exact as printed.
     The same constant the black-hole desk uses. */
  var GM_SUN = 1.3271244e20;

  /* IAU 2012 Resolution B2. The astronomical unit is exactly this many metres. */
  var AU_M = 149597870700;

  /* IAU 2015 Resolution B2, footnote 4: 1 pc = (648000/π) au exactly.
     The footnote's leading digits are 3.085 677 581 … × 10^16 m. */
  var PC_M = (648000 / Math.PI) * AU_M;
  var KPC_M = 1000 * PC_M;

  /* Julian year: 365.25 days of 86400 s. The black-hole desk uses the same year.
     365.25 × 86400 = 31557600. Not the fact-sheet sidereal year of 365.256 days. */
  var JULIAN_YEAR_S = 365.25 * 86400;
  var MYR_S = 1e6 * JULIAN_YEAR_S;

  /* GRAVITY Collaboration 2019, A&A 625, L10.
     R0 = 8178 ± 13 statistical ± 22 systematic pc.
     8178 pc is 8.178 kpc. The 2021 aberration paper's 8275 pc is not substituted. */
  var R0_PC = 8178;
  var R0_KPC = 8178 / 1000;

  /* Eilers et al. 2019, ApJ 871, 120.
     vc(R⊙) = 229.0 ± 0.2 km/s. Their adopted R⊙ is 8.122 ± 0.031 kpc
     (Gravity Collaboration 2018). The period on this page does not use 8.122. */
  var V_SUN_KMS = 229.0;
  var EILERS_R_KPC = 8.122;

  var R_MIN = 0.5;
  var R_MAX = 30;
  var MASS_MAX = 2e11;
  var BULGE_A_MAX = 4;
  var DISK_RD_MIN = 0.5;
  var DISK_RD_MAX = 8;
  var HALO_V_MAX = 300;
  var HALO_RC_MIN = 0.5;
  var HALO_RC_MAX = 15;
  var SLIDER_STEPS = 1000;
  var PLOT_MIN = 0.5;
  var PLOT_MAX = 30;

  var MSUN_KG = GM_SUN / G;

  function clamp(x, lo, hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
  }

  function finite(x) {
    return typeof x === "number" && isFinite(x);
  }

  function formatInt(n) {
    var sign = n < 0 ? "-" : "";
    var s = String(Math.round(Math.abs(n)));
    var out = "";
    var i;
    for (i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 === 0) out += ",";
      out += s.charAt(i);
    }
    return sign + out;
  }

  function formatKpc(r) {
    if (!finite(r)) return "—";
    return r.toFixed(3) + " kpc";
  }

  function formatSpeed(v) {
    if (!finite(v) || v < 0) return "—";
    return v.toFixed(3) + " km/s";
  }

  function formatMyr(p) {
    if (!finite(p) || !(p > 0)) return "—";
    return p.toFixed(3) + " Myr";
  }

  function sciParts(x) {
    if (!finite(x) || !(x > 0)) return null;
    var exp = Math.floor(Math.log10(x));
    var coeff = x / Math.pow(10, exp);
    /* log10(10^n) can land a hair under the integer. */
    if (coeff >= 10) {
      coeff /= 10;
      exp += 1;
    }
    if (coeff < 1) {
      coeff *= 10;
      exp -= 1;
    }
    return { coeff: coeff, exp: exp };
  }

  function formatSci(x, digits, unit) {
    var p = sciParts(x);
    if (!p) return "—";
    var text = p.coeff.toFixed(digits) + " × 10^" + p.exp;
    return unit ? text + " " + unit : text;
  }

  function formatSolar(m) {
    return formatSci(m, 6, "solar masses");
  }

  /* v in km/s from an enclosed mass in solar masses at r in kpc.
     v^2 = GM☉ M / r, then convert m/s to km/s. */
  function speedFromMass(massSolar, rKpc) {
    if (!(massSolar > 0) || !(rKpc > 0)) return 0;
    return Math.sqrt(GM_SUN * massSolar / (rKpc * KPC_M)) / 1000;
  }

  function massFromSpeed(vKms, rKpc) {
    if (!(vKms > 0) || !(rKpc > 0)) return 0;
    var v = vKms * 1000;
    return v * v * (rKpc * KPC_M) / GM_SUN;
  }

  function periodMyr(vKms, rKpc) {
    if (!(vKms > 0) || !(rKpc > 0)) return NaN;
    return (2 * Math.PI * rKpc * KPC_M) / (vKms * 1000) / MYR_S;
  }

  /* Plummer enclosed mass. a = 0 is the point-mass limit. */
  function plummerMass(mb, aKpc, rKpc) {
    if (!(mb > 0) || !(rKpc > 0)) return 0;
    var a = aKpc > 0 ? aKpc : 0;
    var r2 = rKpc * rKpc;
    return mb * (r2 * rKpc) / Math.pow(r2 + a * a, 1.5);
  }

  /* Exponential disk, mass inside cylindrical radius r.
     M = Md [1 − exp(−x) (1 + x)], x = r / Rd. */
  function diskMass(md, rdKpc, rKpc) {
    if (!(md > 0) || !(rdKpc > 0) || !(rKpc > 0)) return 0;
    var x = rKpc / rdKpc;
    return md * (1 - Math.exp(-x) * (1 + x));
  }

  /* Pseudo-isothermal fraction of v∞^2.
     f = 1 − (rc/r) arctan(r/rc). f → 0 at the center and → 1 at large r. */
  function haloFraction(rcKpc, rKpc) {
    if (!(rcKpc > 0) || !(rKpc > 0)) return 0;
    var x = rKpc / rcKpc;
    var f = 1 - Math.atan(x) / x;
    if (f < 0) return 0;
    if (f > 1) return 1;
    return f;
  }

  function speeds(state, rKpc) {
    var r = rKpc;
    var bulgeM = 0;
    var diskM = 0;
    var bulgeV = 0;
    var diskV = 0;
    var haloV = 0;
    if (state.bulgeOn) {
      bulgeM = plummerMass(state.bulgeMass, state.bulgeScale, r);
      bulgeV = speedFromMass(bulgeM, r);
    }
    if (state.diskOn) {
      diskM = diskMass(state.diskMass, state.diskScale, r);
      diskV = speedFromMass(diskM, r);
    }
    if (state.haloOn && state.haloV > 0 && state.haloRc > 0 && r > 0) {
      haloV = state.haloV * Math.sqrt(haloFraction(state.haloRc, r));
    }
    var haloM = massFromSpeed(haloV, r);
    var visible = Math.sqrt(bulgeV * bulgeV + diskV * diskV);
    var total = Math.sqrt(visible * visible + haloV * haloV);
    return {
      r: r,
      bulge: bulgeV,
      disk: diskV,
      halo: haloV,
      visible: visible,
      total: total,
      bulgeMass: bulgeM,
      diskMass: diskM,
      haloMass: haloM,
      mass: bulgeM + diskM + haloM
    };
  }

  function sunOrbit() {
    var period = periodMyr(V_SUN_KMS, R0_KPC);
    var mass = massFromSpeed(V_SUN_KMS, R0_KPC);
    return {
      rPc: R0_PC,
      rKpc: R0_KPC,
      vKms: V_SUN_KMS,
      eilersKpc: EILERS_R_KPC,
      periodMyr: period,
      massSolar: mass,
      periodText: formatMyr(period),
      periodRaw: period.toFixed(6),
      massText: formatSolar(mass),
      massCoeff12: sciParts(mass).coeff.toFixed(12),
      rText: formatKpc(R0_KPC),
      speedText: "229.0 km/s",
      eilersText: formatKpc(EILERS_R_KPC),
      pcText: formatSci(PC_M, 12, "m"),
      msunText: formatSci(MSUN_KG, 10, "kg"),
      yearText: formatInt(JULIAN_YEAR_S) + " s"
    };
  }

  var SUN = sunOrbit();

  function copyState(s) {
    return {
      id: s.id,
      name: s.name,
      r: s.r,
      bulgeOn: s.bulgeOn,
      bulgeMass: s.bulgeMass,
      bulgeScale: s.bulgeScale,
      diskOn: s.diskOn,
      diskMass: s.diskMass,
      diskScale: s.diskScale,
      haloOn: s.haloOn,
      haloV: s.haloV,
      haloRc: s.haloRc
    };
  }

  /* Round classroom values. Not fits to the Milky Way or to M31. */
  var PRESETS = [
    {
      id: "milky-way",
      name: "Milky Way classroom",
      r: R0_KPC,
      bulgeOn: true,
      bulgeMass: 1e10,
      bulgeScale: 0.5,
      diskOn: true,
      diskMass: 5e10,
      diskScale: 3,
      haloOn: true,
      haloV: 180,
      haloRc: 5
    },
    {
      id: "keplerian",
      name: "Point mass",
      r: 8,
      bulgeOn: true,
      bulgeMass: 8e10,
      bulgeScale: 0,
      diskOn: false,
      diskMass: 5e10,
      diskScale: 3,
      haloOn: false,
      haloV: 180,
      haloRc: 5
    },
    {
      id: "disk",
      name: "Exponential disk",
      r: 8,
      bulgeOn: false,
      bulgeMass: 1e10,
      bulgeScale: 0.5,
      diskOn: true,
      diskMass: 6e10,
      diskScale: 3,
      haloOn: false,
      haloV: 180,
      haloRc: 5
    },
    {
      id: "halo",
      name: "Halo only",
      r: 10,
      bulgeOn: false,
      bulgeMass: 1e10,
      bulgeScale: 0.5,
      diskOn: false,
      diskMass: 5e10,
      diskScale: 3,
      haloOn: true,
      haloV: 220,
      haloRc: 2
    }
  ];

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return copyState(PRESETS[i]);
    }
    return null;
  }

  function normalize(input) {
    var base = presetById("milky-way");
    var src = input || {};
    if (src.preset && src.r == null && src.bulgeMass == null) {
      var loaded = presetById(src.preset);
      if (loaded) src = loaded;
    }
    var bulgeOn = src.bulgeOn != null ? !!src.bulgeOn : base.bulgeOn;
    var diskOn = src.diskOn != null ? !!src.diskOn : base.diskOn;
    var haloOn = src.haloOn != null ? !!src.haloOn : base.haloOn;
    var r = finite(src.r) ? src.r : (finite(Number(src.r)) ? Number(src.r) : base.r);
    if (typeof src.r === "string" && src.r.trim() !== "") r = Number(src.r);
    if (!finite(r)) return null;
    var state = {
      id: src.id || src.preset || "",
      name: src.name || "",
      r: clamp(r, R_MIN, R_MAX),
      bulgeOn: bulgeOn,
      bulgeMass: clamp(finite(Number(src.bulgeMass)) ? Number(src.bulgeMass) : base.bulgeMass, 0, MASS_MAX),
      bulgeScale: clamp(finite(Number(src.bulgeScale)) ? Number(src.bulgeScale) : base.bulgeScale, 0, BULGE_A_MAX),
      diskOn: diskOn,
      diskMass: clamp(finite(Number(src.diskMass)) ? Number(src.diskMass) : base.diskMass, 0, MASS_MAX),
      diskScale: clamp(finite(Number(src.diskScale)) ? Number(src.diskScale) : base.diskScale, DISK_RD_MIN, DISK_RD_MAX),
      haloOn: haloOn,
      haloV: clamp(finite(Number(src.haloV)) ? Number(src.haloV) : base.haloV, 0, HALO_V_MAX),
      haloRc: clamp(finite(Number(src.haloRc)) ? Number(src.haloRc) : base.haloRc, HALO_RC_MIN, HALO_RC_MAX)
    };
    if (!finite(state.bulgeMass) || !finite(state.diskMass) || !finite(state.haloV)) return null;
    return state;
  }

  function partText(on, v) {
    if (!on) return "off";
    return formatSpeed(v);
  }

  function whyFor(state, sp) {
    var bits = [];
    bits.push("v = sqrt(G M(<r) / r). The three toys add in quadrature, which adds their enclosed masses.");
    if (!state.bulgeOn && !state.diskOn && !state.haloOn) {
      bits.push("Every component is off, so the speed is zero and the period is a dash.");
    } else {
      bits.push("At " + formatKpc(sp.r) + " the toy speed is " + formatSpeed(sp.total) + ".");
      bits.push("Bulge " + partText(state.bulgeOn, sp.bulge) + ", disk " + partText(state.diskOn, sp.disk) + ", halo " + partText(state.haloOn, sp.halo) + ".");
      bits.push("The visible toy, bulge plus disk, is " + formatSpeed(sp.visible) + ".");
      if (sp.total > 0) {
        bits.push("The toy period is " + formatMyr(periodMyr(sp.total, sp.r)) + ", from 2πr/v.");
        bits.push("The toy enclosed mass is " + formatSolar(sp.mass) + ", from v²r/GM☉.");
      }
    }
    bits.push("The printed speeds are rounded at three decimals. The total is rounded from the unrounded sum of squares.");
    bits.push("A point mass matched to the toy speed at this radius is the dashed curve. It falls as r^−1/2.");
    bits.push("The cited Sun is a different number. " + SUN.rPc + " pc and " + SUN.speedText + " give " + SUN.periodText + ".");
    bits.push(formatSpeed(sp.total) + " does not have to round to " + SUN.speedText + ".");
    bits.push("The sliders are classroom values, not a fit. Not a mass model.");
    return bits.join(" ");
  }

  function scene(input) {
    var state = normalize(input);
    if (!state) return { ok: false };
    var sp = speeds(state, state.r);
    var period = periodMyr(sp.total, sp.r);
    var known = presetById(state.id);
    var name = state.name || (known ? known.name : "Custom");
    var aria = name + ". Toy speed " + formatSpeed(sp.total) + " at " + formatKpc(sp.r) + ". ";
    aria += "Cited Sun " + SUN.speedText + " at " + SUN.rText + ", period " + SUN.periodText + ". ";
    aria += "Not a mass model.";
    return {
      ok: true,
      id: state.id,
      name: name,
      state: state,
      r: sp.r,
      bulge: sp.bulge,
      disk: sp.disk,
      halo: sp.halo,
      visible: sp.visible,
      total: sp.total,
      mass: sp.mass,
      periodMyr: period,
      rText: formatKpc(sp.r),
      bulgeText: partText(state.bulgeOn, sp.bulge),
      diskText: partText(state.diskOn, sp.disk),
      haloText: partText(state.haloOn, sp.halo),
      visibleText: formatSpeed(sp.visible),
      totalText: formatSpeed(sp.total),
      massText: sp.total > 0 ? formatSolar(sp.mass) : "—",
      periodText: formatMyr(period),
      range: "Toy " + formatSpeed(sp.total) + " · cited Sun " + SUN.periodText,
      why: whyFor(state, sp),
      aria: aria,
      sun: SUN
    };
  }

  function series(input, count) {
    var state = normalize(input);
    var n = count > 2 ? count : 241;
    var rows = [];
    if (!state) return rows;
    var i;
    var probe = speeds(state, state.r);
    for (i = 0; i < n; i++) {
      var t = n === 1 ? 0 : i / (n - 1);
      var r = PLOT_MIN + (PLOT_MAX - PLOT_MIN) * t;
      var sp = speeds(state, r);
      var kepler = 0;
      if (probe.total > 0 && r > 0) kepler = probe.total * Math.sqrt(state.r / r);
      rows.push({
        r: r,
        bulge: sp.bulge,
        disk: sp.disk,
        halo: sp.halo,
        visible: sp.visible,
        total: sp.total,
        kepler: kepler
      });
    }
    return rows;
  }

  function sliderPos(value, min, max) {
    if (!(max > min)) return 0;
    var t = (value - min) / (max - min);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.round(t * SLIDER_STEPS);
  }

  function valueFromSlider(pos, min, max) {
    var t = Number(pos) / SLIDER_STEPS;
    if (!finite(t)) t = 0;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return min + t * (max - min);
  }

  return {
    G: G,
    GM_SUN: GM_SUN,
    AU_M: AU_M,
    PC_M: PC_M,
    KPC_M: KPC_M,
    JULIAN_YEAR_S: JULIAN_YEAR_S,
    MYR_S: MYR_S,
    MSUN_KG: MSUN_KG,
    R0_PC: R0_PC,
    R0_KPC: R0_KPC,
    V_SUN_KMS: V_SUN_KMS,
    EILERS_R_KPC: EILERS_R_KPC,
    R_MIN: R_MIN,
    R_MAX: R_MAX,
    MASS_MAX: MASS_MAX,
    BULGE_A_MAX: BULGE_A_MAX,
    DISK_RD_MIN: DISK_RD_MIN,
    DISK_RD_MAX: DISK_RD_MAX,
    HALO_V_MAX: HALO_V_MAX,
    HALO_RC_MIN: HALO_RC_MIN,
    HALO_RC_MAX: HALO_RC_MAX,
    SLIDER_STEPS: SLIDER_STEPS,
    PLOT_MIN: PLOT_MIN,
    PLOT_MAX: PLOT_MAX,
    PRESETS: PRESETS,
    SUN: SUN,
    presetById: presetById,
    normalize: normalize,
    speeds: speeds,
    plummerMass: plummerMass,
    diskMass: diskMass,
    haloFraction: haloFraction,
    speedFromMass: speedFromMass,
    massFromSpeed: massFromSpeed,
    periodMyr: periodMyr,
    scene: scene,
    series: series,
    formatKpc: formatKpc,
    formatSpeed: formatSpeed,
    formatMyr: formatMyr,
    formatSolar: formatSolar,
    formatSci: formatSci,
    formatInt: formatInt,
    sliderPos: sliderPos,
    valueFromSlider: valueFromSlider
  };
});
