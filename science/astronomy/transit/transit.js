/*! Transit depth and radial-velocity semi-amplitude.
    Classroom model: circular orbit, uniform stellar disk, no limb darkening.
    Not a catalog and not a fitted light curve. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Transit = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* NASA NSSDCA fact-sheet GM values, km^3/s^2, then converted to m^3/s^2.
     Sun Fact Sheet: 132,712 × 10^6. Earth: 0.39860 × 10^6. Jupiter: 126.687 × 10^6.
     Mass ratios on this desk are GM ratios, so G cancels. */
  var GM_SUN = 132712e6 * 1e9;
  var GM_EARTH = 0.39860e6 * 1e9;
  var GM_JUPITER = 126.687e6 * 1e9;

  /* Volumetric mean radii. Sun Fact Sheet 695,700 km. Earth 6,371.0 km.
     Jupiter 69,911 km. */
  var R_SUN_M = 695700e3;
  var R_EARTH_M = 6371.0e3;
  var R_JUPITER_M = 69911e3;

  /* IAU 2012 Resolution B2. Used to report a in AU. */
  var AU_M = 149597870700;
  var DAY_S = 86400;

  var R_STAR_MIN = 0.05;
  var R_STAR_MAX = 10;
  var M_STAR_MIN = 0.02;
  var M_STAR_MAX = 5;
  var RP_EARTH_MIN = 0.2;
  var RP_EARTH_MAX = 30;
  var MP_EARTH_MIN = 0.05;
  var MP_EARTH_MAX = 5000;
  var P_MIN = 0.2;
  var P_MAX = 20000;
  var A_MIN = 0.003;
  var A_MAX = 40;
  var I_MIN = 0;
  var I_MAX = 90;

  function gmPlanet(mass, unit) {
    return mass * (unit === "jupiter" ? GM_JUPITER : GM_EARTH);
  }

  function radiusPlanet(radius, unit) {
    return radius * (unit === "jupiter" ? R_JUPITER_M : R_EARTH_M);
  }

  /* P = 2π √(a³ / GM_total). Circular two-body. */
  function periodSecondsFromAxis(axisM, gmTotal) {
    return 2 * Math.PI * Math.sqrt((axisM * axisM * axisM) / gmTotal);
  }

  function axisFromPeriod(periodS, gmTotal) {
    return Math.cbrt((gmTotal * periodS * periodS) / (4 * Math.PI * Math.PI));
  }

  /* K = (2π/P)^(1/3) * GM_p * sin i / (GM* + GM_p)^(2/3).
     Circular orbit. The sin i is why a measured K is a minimum mass. */
  function semiAmplitude(periodS, gmP, gmS, inclRad) {
    var total = gmS + gmP;
    return Math.pow((2 * Math.PI) / periodS, 1 / 3) * gmP * Math.sin(inclRad) / Math.pow(total, 2 / 3);
  }

  /* b = (a / R*) cos i, in units of the stellar radius. i = 90° is edge-on. */
  function impactParameter(axisM, rStarM, inclRad) {
    return (axisM * Math.cos(inclRad)) / rStarM;
  }

  function depthFraction(rPlanetM, rStarM) {
    var k = rPlanetM / rStarM;
    return k * k;
  }

  /* Winn 2010 circular-orbit duration, first contact to fourth.
     T14 = (P/pi) arcsin[ (Rstar/a) * sqrt((1+k)^2 - b^2) / sin i ]. */
  function durationSeconds(periodS, axisM, rStarM, rPlanetM, inclRad) {
    var k = rPlanetM / rStarM;
    var b = impactParameter(axisM, rStarM, inclRad);
    if (!(Math.abs(b) < 1 + k)) return null;
    var sini = Math.sin(inclRad);
    if (!(sini > 0)) return null;
    var inside = (1 + k) * (1 + k) - b * b;
    if (!(inside > 0)) return null;
    var arg = (rStarM / axisM) * Math.sqrt(inside) / sini;
    if (!(arg > 0)) return null;
    if (arg >= 1) return periodS / 2;
    return (periodS / Math.PI) * Math.asin(arg);
  }

  /* Sky-projected star–planet separation. Phase 0 is mid-transit. */
  function skySeparation(axisM, inclRad, phase) {
    var theta = 2 * Math.PI * phase;
    var s = Math.sin(theta);
    var c = Math.cos(theta);
    var cosi = Math.cos(inclRad);
    return axisM * Math.sqrt(s * s + cosi * cosi * c * c);
  }

  /* Area of overlap of two disks. Uniform brightness, so the blocked fraction is this over π R*². */
  function overlapArea(rStarM, rPlanetM, separation) {
    if (!(rStarM > 0) || !(rPlanetM > 0)) return 0;
    var d = Math.abs(separation);
    if (d >= rStarM + rPlanetM) return 0;
    if (d <= Math.abs(rStarM - rPlanetM)) {
      var smaller = Math.min(rStarM, rPlanetM);
      return Math.PI * smaller * smaller;
    }
    var r2 = rStarM * rStarM;
    var p2 = rPlanetM * rPlanetM;
    var d2 = d * d;
    var alpha = Math.acos((d2 + r2 - p2) / (2 * d * rStarM));
    var beta = Math.acos((d2 + p2 - r2) / (2 * d * rPlanetM));
    var root = (-d + rStarM + rPlanetM) * (d + rStarM - rPlanetM) * (d - rStarM + rPlanetM) * (d + rStarM + rPlanetM);
    return r2 * alpha + p2 * beta - 0.5 * Math.sqrt(Math.max(0, root));
  }

  function flux(rStarM, rPlanetM, axisM, inclRad, phase) {
    if (!(rPlanetM > 0)) return 1;
    var blocked = overlapArea(rStarM, rPlanetM, skySeparation(axisM, inclRad, phase));
    return 1 - blocked / (Math.PI * rStarM * rStarM);
  }

  /* Stellar radial velocity. Zero at mid-transit, positive afterward (redshift). */
  function radialVelocity(kMs, phase) {
    return kMs * Math.sin(2 * Math.PI * phase);
  }

  function solve(spec) {
    var unit = spec.unit === "jupiter" ? "jupiter" : "earth";
    var rStar = spec.rStar;
    var mStar = spec.mStar;
    var rp = spec.rp;
    var mp = spec.mp;
    var inclDeg = spec.inclDeg;
    var driver = spec.driver === "axis" ? "axis" : "period";
    var rpKnown = rp != null && isFinite(rp) && rp > 0;
    if (!(rStar > 0) || !(mStar > 0) || !(mp > 0) || !isFinite(inclDeg)) {
      return { ok: false };
    }
    var inclRad = inclDeg * Math.PI / 180;
    var gmS = mStar * GM_SUN;
    var gmP = gmPlanet(mp, unit);
    var rStarM = rStar * R_SUN_M;
    var rPlanetM = rpKnown ? radiusPlanet(rp, unit) : null;
    var periodS;
    var axisM;
    if (driver === "axis") {
      if (!(spec.axisAU > 0)) return { ok: false };
      axisM = spec.axisAU * AU_M;
      periodS = periodSecondsFromAxis(axisM, gmS + gmP);
    } else {
      if (!(spec.periodDays > 0)) return { ok: false };
      periodS = spec.periodDays * DAY_S;
      axisM = axisFromPeriod(periodS, gmS + gmP);
    }
    var kRatio = rpKnown ? rPlanetM / rStarM : null;
    var depth = rpKnown ? kRatio * kRatio : null;
    var b = impactParameter(axisM, rStarM, inclRad);
    var crosses = rpKnown ? Math.abs(b) < 1 + kRatio : Math.abs(b) < 1;
    var dur = rpKnown ? durationSeconds(periodS, axisM, rStarM, rPlanetM, inclRad) : null;
    var kMs = semiAmplitude(periodS, gmP, gmS, inclRad);
    var mSinI = mp * Math.sin(inclRad);
    return {
      ok: true,
      unit: unit,
      rpKnown: rpKnown,
      driver: driver,
      periodDays: periodS / DAY_S,
      axisAU: axisM / AU_M,
      axisM: axisM,
      rStarM: rStarM,
      rPlanetM: rPlanetM,
      kRatio: kRatio,
      depth: depth,
      probStar: rStarM / axisM,
      probFull: rpKnown ? (rStarM + rPlanetM) / axisM : null,
      impact: b,
      transits: crosses,
      durationSeconds: dur,
      durationHours: dur == null ? null : dur / 3600,
      kMs: kMs,
      mSinI: mSinI,
      inclDeg: inclDeg
    };
  }

  function logMap(t, min, max) {
    var u = Math.min(1, Math.max(0, t));
    return min * Math.pow(max / min, u);
  }

  function logUnmap(v, min, max) {
    if (!(v > 0)) return 0;
    return Math.log(v / min) / Math.log(max / min);
  }

  function commas(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatPpm(fraction) {
    if (!(fraction >= 0) || !isFinite(fraction)) return "";
    var ppm = fraction * 1e6;
    if (ppm >= 1000) return commas(Math.round(ppm));
    if (ppm >= 100) return ppm.toFixed(1);
    return ppm.toFixed(2);
  }

  function formatPercent(fraction) {
    if (!isFinite(fraction)) return "";
    var p = fraction * 100;
    var body;
    if (Math.abs(p) >= 10) body = p.toFixed(2);
    else if (Math.abs(p) >= 1) body = p.toFixed(3);
    else if (Math.abs(p) >= 0.01) body = p.toFixed(4);
    else body = p.toFixed(6);
    return body;
  }

  function formatMetersPerSecond(ms) {
    if (!isFinite(ms)) return "";
    var a = Math.abs(ms);
    if (a >= 100) return ms.toFixed(1);
    if (a >= 1) return ms.toFixed(2);
    if (a >= 0.1) return ms.toFixed(3);
    return ms.toFixed(4);
  }

  function formatCmPerSecond(ms) {
    if (!isFinite(ms)) return "";
    return (ms * 100).toFixed(2);
  }

  function formatHours(hours) {
    if (!(hours >= 0) || !isFinite(hours)) return "";
    if (hours < 2) return (hours * 60).toFixed(1) + " min";
    return hours.toFixed(2) + " h";
  }

  function formatOdds(prob) {
    if (!(prob > 0) || !isFinite(prob)) return "";
    return "1 in " + commas(Math.round(1 / prob));
  }

  function formatAu(a) {
    if (!(a > 0) || !isFinite(a)) return "";
    if (a >= 10) return a.toFixed(2);
    if (a >= 1) return a.toFixed(4);
    if (a >= 0.1) return a.toFixed(4);
    return a.toFixed(5);
  }

  function formatDays(d) {
    if (!(d > 0) || !isFinite(d)) return "";
    if (d >= 1000) return commas(Number(d.toFixed(3)));
    if (d >= 10) return d.toFixed(3);
    return d.toFixed(6);
  }

  function formatImpact(b) {
    if (!isFinite(b)) return "";
    return Math.abs(b).toFixed(2);
  }

  function formatMass(m) {
    if (!(m > 0) || !isFinite(m)) return "";
    if (m >= 100) return m.toFixed(1);
    if (m >= 10) return m.toFixed(2);
    if (m >= 1) return m.toFixed(3);
    if (m >= 0.1) return m.toFixed(3);
    if (m >= 0.01) return m.toFixed(4);
    return m.toFixed(5);
  }

  function radiusRange(unit) {
    var scale = unit === "jupiter" ? R_EARTH_M / R_JUPITER_M : 1;
    return { min: RP_EARTH_MIN * scale, max: RP_EARTH_MAX * scale };
  }

  function massRange(unit) {
    var scale = unit === "jupiter" ? GM_EARTH / GM_JUPITER : 1;
    return { min: MP_EARTH_MIN * scale, max: MP_EARTH_MAX * scale };
  }

  function presets() {
    return [
      {
        id: "earth",
        name: "Earth",
        tier: "Sun · Earth, seen edge-on",
        rStar: 1,
        mStar: 1,
        rp: 1,
        mp: 1,
        unit: "earth",
        periodDays: 365.256,
        inclDeg: 90,
        why: "An external observer who sees Earth cross the Sun. The fact sheet’s orbit inclination, 0°, is measured against Earth’s own ecliptic, not against that line of sight. The dip is tens of parts per million. The wobble is under 10 cm/s.",
        note: "Volumetric mean radii: Sun 695,700 km, Earth 6,371.0 km. GM: Sun 132,712 × 10^6 km³/s², Earth 0.39860 × 10^6 km³/s². Sidereal orbit period 365.256 days. The sheet’s semimajor axis is 149.598 × 10^6 km. The distance on this card is the circular two-body value for that period and those GM values. Inclination is set to 90°."
      },
      {
        id: "jupiter",
        name: "Jupiter",
        tier: "Sun · Jupiter, seen edge-on",
        rStar: 1,
        mStar: 1,
        rp: 1,
        mp: 1,
        unit: "jupiter",
        periodDays: 4332.589,
        inclDeg: 90,
        why: "The same external edge-on view for Jupiter. The dip is about one percent of the Sun. The wobble is meters per second.",
        note: "Volumetric mean radius 69,911 km. GM 126.687 × 10^6 km³/s². Sidereal period 4,332.589 days. Semimajor axis on the sheet 778.479 × 10^6 km. Inclination here is 90°, not the sheet’s 1.304° to the ecliptic."
      },
      {
        id: "hd-209458-b",
        name: "HD 209458 b",
        tier: "HD 209458 · b",
        rStar: 1.155,
        mStar: 1.119,
        rp: 1.359,
        mp: 0.682,
        unit: "jupiter",
        periodDays: 3.52474859,
        inclDeg: 86.71,
        why: "A transiting hot Jupiter. Bonomo et al. 2017 list a measured stellar K of 84.27 m/s. The wobble on this card is the circular formula applied to their central mass, period, stellar mass, and inclination.",
        note: "Bonomo et al. 2017, as listed on the NASA Exoplanet Archive: M* = 1.119 ± 0.033 M☉, R* = 1.155 (+0.014, −0.016) R☉, Mp = 0.682 (+0.014, −0.015) MJup, Rp = 1.359 (+0.016, −0.019) RJup, P = 3.52474859 ± 0.00000038 days, i = 86.710 ± 0.050°, a = 0.04707 (+0.00045, −0.00047) AU, K = 84.27 (+0.69, −0.70) m/s. That column’s eccentricity is an upper limit, < 0.0081. This desk uses the central values and e = 0."
      },
      {
        id: "51-peg-b",
        name: "51 Peg b",
        tier: "51 Pegasi · b",
        rStar: 1.19,
        mStar: 1.07,
        rp: null,
        mp: 0.61,
        unit: "jupiter",
        periodDays: 4.2307966,
        inclDeg: 49.8,
        why: "The first planet found around a Sun-like star, by the wobble, not by a dip. Cont et al. 2026 give i = 49.8°, so this line of sight misses the star. Their stellar K is 55.77 m/s. No measured planet radius is loaded.",
        note: "Cont et al. 2026, Table 1: Mp = 0.61 (+0.06, −0.05) MJup, i = 49.8 (+5.8, −5.7)°, P = 4.2307966 ± 0.0000027 days, stellar K = 55.77 ± 0.15 m/s. Stellar mass 1.07 ± 0.05 M☉, stellar radius 1.19 ± 0.03 R☉, and a = 0.052 AU are adopted there from Rosenthal et al. 2021. The archive flags the default planet radius as calculated, not measured, so this preset leaves it blank. Mayor and Queloz 1995 reported m sin i, not a true mass."
      },
      {
        id: "trappist-1-e",
        name: "TRAPPIST-1 e",
        tier: "TRAPPIST-1 · e",
        rStar: 0.1192,
        mStar: 0.0898,
        rp: 0.92,
        mp: 0.692,
        unit: "earth",
        periodDays: 6.101013,
        inclDeg: 89.793,
        why: "Almost an Earth radius, on a star much smaller than the Sun, and much closer in. The dip is thousands of parts per million, not tens. A smaller, lighter star makes both signals larger.",
        note: "Agol et al. 2021: radius 0.920 (+0.013, −0.012) R⊕, mass 0.692 ± 0.022 M⊕, period 6.101013 ± 0.000035 days, inclination 89.793 ± 0.048°, semimajor axis 0.02925 ± 0.00025 AU. Stellar radius 0.1192 ± 0.0013 R☉ in that paper. Stellar mass 0.0898 ± 0.0023 M☉, adopted there from Mann et al. The published orbit is slightly eccentric. This desk sets e = 0. The radius is entered as 0.920."
      },
      {
        id: "gj-1214-b",
        name: "GJ 1214 b",
        tier: "GJ 1214 · b",
        rStar: 0.2162,
        mStar: 0.182,
        rp: 2.733,
        mp: 8.41,
        unit: "earth",
        periodDays: 1.580404531,
        inclDeg: 88.98,
        why: "A mini-Neptune in front of a small star. Mahajan et al. 2024 print (Rp/R*)² = 0.013430 and K = 14.38 m/s. This card recomputes both from their central radii, masses, period, and inclination. The unit conversion is the fact-sheet Earth and Sun radii, so the depth is not pasted from that square.",
        note: "Mahajan, Eastman, and Kirk 2024, Table 3, central values: M* = 0.1820 M☉, R* = 0.2162 R☉, P = 1.580404531 days, Rp = 2.733 R⊕, Mp = 8.41 M⊕, a = 0.01505 AU, i = 88.980°, K = 14.38 m/s. Their eccentricity is 0.0062. This desk uses e = 0."
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
    GM_SUN: GM_SUN,
    GM_EARTH: GM_EARTH,
    GM_JUPITER: GM_JUPITER,
    R_SUN_M: R_SUN_M,
    R_EARTH_M: R_EARTH_M,
    R_JUPITER_M: R_JUPITER_M,
    AU_M: AU_M,
    DAY_S: DAY_S,
    R_STAR_MIN: R_STAR_MIN,
    R_STAR_MAX: R_STAR_MAX,
    M_STAR_MIN: M_STAR_MIN,
    M_STAR_MAX: M_STAR_MAX,
    RP_EARTH_MIN: RP_EARTH_MIN,
    RP_EARTH_MAX: RP_EARTH_MAX,
    MP_EARTH_MIN: MP_EARTH_MIN,
    MP_EARTH_MAX: MP_EARTH_MAX,
    P_MIN: P_MIN,
    P_MAX: P_MAX,
    A_MIN: A_MIN,
    A_MAX: A_MAX,
    I_MIN: I_MIN,
    I_MAX: I_MAX,
    gmPlanet: gmPlanet,
    radiusPlanet: radiusPlanet,
    periodSecondsFromAxis: periodSecondsFromAxis,
    axisFromPeriod: axisFromPeriod,
    semiAmplitude: semiAmplitude,
    impactParameter: impactParameter,
    depthFraction: depthFraction,
    durationSeconds: durationSeconds,
    skySeparation: skySeparation,
    overlapArea: overlapArea,
    flux: flux,
    radialVelocity: radialVelocity,
    solve: solve,
    logMap: logMap,
    logUnmap: logUnmap,
    formatPpm: formatPpm,
    formatPercent: formatPercent,
    formatMetersPerSecond: formatMetersPerSecond,
    formatCmPerSecond: formatCmPerSecond,
    formatHours: formatHours,
    formatOdds: formatOdds,
    formatAu: formatAu,
    formatDays: formatDays,
    formatImpact: formatImpact,
    formatMass: formatMass,
    radiusRange: radiusRange,
    massRange: massRange,
    presets: presets,
    presetById: presetById
  };
});
