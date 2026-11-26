/*! Parker spiral: constant-speed equatorial winding.

    tan ψ = Ω r / v. ψ is the angle of the field from the radial direction.
    The same product Ω r / v, in degrees, is how far the Sun turns while
    the wind coasts from the center to r, and it is the western footpoint
    offset of the field line that reaches the observer.

    Ω comes from the Sun Fact Sheet sidereal period, 609.12 hours, the
    adopted period at 16° latitude. One astronomical unit is the IAU 2012
    length, 149,597,870,700 m. Planet orbits are the J2000 semimajor axes
    on the NSSDCA fact sheets, the same numbers the resonances desk uses.
    The Earth button is exactly 1 AU. The sheet’s 1.00000011 AU is not
    substituted.

    400 km/s is NOAA’s about-400 km/s slow wind. 750 km/s is a classroom
    mark inside NOAA’s 500–800 km/s coronal-hole range. It is not a
    measured wind. Constant radial speed. Not a forecast. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Parker = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* IAU 2012 Resolution B2. Exactly this many metres. */
  var AU_M = 149597870700;
  var AU_KM = AU_M / 1000;
  var DAY_S = 86400;

  /* NASA NSSDCA Sun Fact Sheet. Sidereal rotation period, hours.
     The footnote says this is the adopted period at 16° latitude. */
  var SIDEREAL_HOURS = 609.12;
  var SIDEREAL_DAYS = SIDEREAL_HOURS / 24;

  /* Same footnote, the latitude formula’s equatorial term, degrees per day.
     360 divided by this rate is not the adopted period. */
  var EQUATOR_DEG_PER_DAY = 14.37;

  /* Volumetric mean radius, km, Sun Fact Sheet. */
  var SUN_RADIUS_KM = 695700;

  /* A common potential-field source surface, in solar radii.
     This page names it and does not subtract it. */
  var SOURCE_SURFACE_RADII = 2.5;

  /* NOAA SWPC: most common slow wind in the equatorial plane, about 400 km/s.
     Coronal holes, 500 to 800 km/s. 750 sits inside that band. */
  var V_SLOW = 400;
  var V_FAST = 750;
  var V_MIN = 250;
  var V_MAX = 900;

  var R_MIN = 0.1;
  var R_MAX = 40;
  var R_EARTH = 1;

  var P_MIN = 20;
  var P_MAX = 40;

  /* NOAA’s solar-wind page says the Sun rotates every 27 days.
     That sentence is not this sidereal period. */
  var NOAA_ROTATION_DAYS = 27;

  /* Classroom longitude between a fast spiral and the slow spiral ahead of it.
     Not a measured stream width. */
  var CIR_AHEAD_DEG = 25;

  /* J2000 semimajor axes, NSSDCA fact sheets. Earth is listed for the orbit
     drawing. The Earth preset uses 1 AU, not this 1.00000011. */
  var PLANETS = [
    { id: "mercury", name: "Mercury", au: 0.38709893, auLabel: "0.38709893", swatch: "#c4b8a5" },
    { id: "venus", name: "Venus", au: 0.72333199, auLabel: "0.72333199", swatch: "#e6d7a8" },
    { id: "earth", name: "Earth", au: 1.00000011, auLabel: "1.00000011", swatch: "#6ea4b8" },
    { id: "mars", name: "Mars", au: 1.52366231, auLabel: "1.52366231", swatch: "#d4846a" },
    { id: "jupiter", name: "Jupiter", au: 5.20336301, auLabel: "5.20336301", swatch: "#d4a574" },
    { id: "saturn", name: "Saturn", au: 9.53707032, auLabel: "9.53707032", swatch: "#e6d3a3" },
    { id: "uranus", name: "Uranus", au: 19.19126393, auLabel: "19.19126393", swatch: "#8fd0c8" },
    { id: "neptune", name: "Neptune", au: 30.06896348, auLabel: "30.06896348", swatch: "#6a8fd4" }
  ];

  var PRESETS = [
    { id: "earth-slow", name: "Earth · 400", v: V_SLOW, au: R_EARTH, auLabel: "1", speedName: "slow" },
    { id: "earth-fast", name: "Earth · 750", v: V_FAST, au: R_EARTH, auLabel: "1", speedName: "fast" },
    { id: "mars-slow", name: "Mars · 400", v: V_SLOW, au: 1.52366231, auLabel: "1.52366231", speedName: "slow" },
    { id: "mars-fast", name: "Mars · 750", v: V_FAST, au: 1.52366231, auLabel: "1.52366231", speedName: "fast" },
    { id: "jupiter-slow", name: "Jupiter · 400", v: V_SLOW, au: 5.20336301, auLabel: "5.20336301", speedName: "slow" },
    { id: "jupiter-fast", name: "Jupiter · 750", v: V_FAST, au: 5.20336301, auLabel: "5.20336301", speedName: "fast" },
    { id: "neptune-slow", name: "Neptune · 400", v: V_SLOW, au: 30.06896348, auLabel: "30.06896348", speedName: "slow" },
    { id: "neptune-fast", name: "Neptune · 750", v: V_FAST, au: 30.06896348, auLabel: "30.06896348", speedName: "fast" }
  ];

  function omega(periodDays) {
    return 2 * Math.PI / (periodDays * DAY_S);
  }

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function vOk(v) {
    return finite(v) && v >= V_MIN && v <= V_MAX;
  }

  function rOk(r) {
    return finite(r) && r >= R_MIN && r <= R_MAX;
  }

  function pOk(p) {
    return finite(p) && p >= P_MIN && p <= P_MAX;
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var bits = s.split(".");
    bits[0] = bits[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + bits.join(".");
  }

  function formatDeg(n) {
    return group(n, 2) + "°";
  }

  function formatDays(n) {
    return group(n, 2);
  }

  function formatHours(n) {
    return group(n, 2);
  }

  function formatTurns(n) {
    return group(n, 2);
  }

  function formatAu(n) {
    if (Math.abs(n - 1) < 1e-12) return "1";
    if (n >= 10) return group(n, 2);
    if (n >= 1) return n.toFixed(4);
    return n.toFixed(4);
  }

  function formatSpeed(v) {
    return String(Math.round(v));
  }

  function formatPeriod(days) {
    return group(days, 2);
  }

  function sourceSurfaceAu() {
    return SOURCE_SURFACE_RADII * SUN_RADIUS_KM / AU_KM;
  }

  function equatorDays() {
    return 360 / EQUATOR_DEG_PER_DAY;
  }

  function evaluate(vKms, rAu, periodDays) {
    var rKm = rAu * AU_KM;
    var om = omega(periodDays);
    var ratio = om * rKm / vKms;
    var psiDeg = Math.atan(ratio) * 180 / Math.PI;
    var seconds = rKm / vKms;
    var westDeg = ratio * 180 / Math.PI;
    var disk = westDeg % 360;
    if (disk < 0) disk += 360;
    return {
      vKms: vKms,
      rAu: rAu,
      periodDays: periodDays,
      rKm: rKm,
      omega: om,
      ratio: ratio,
      psiDeg: psiDeg,
      seconds: seconds,
      days: seconds / DAY_S,
      hours: seconds / 3600,
      westDeg: westDeg,
      turns: westDeg / 360,
      diskDeg: disk
    };
  }

  function opening() {
    return evaluate(V_SLOW, R_EARTH, SIDEREAL_DAYS);
  }

  function footRad(vKms, rAu, periodDays) {
    return omega(periodDays) * (rAu * AU_KM) / vKms;
  }

  /* Inertial azimuth of the spiral. θ increases counter-clockwise from the
     observer’s direction. The footpoint is ahead of the plasma, so θ falls
     as r grows. */
  function thetaAt(rAu, foot, vKms, periodDays) {
    return foot - omega(periodDays) * (rAu * AU_KM) / vKms;
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  function matchedPreset(vKms, rAu) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (Math.abs(PRESETS[i].v - vKms) < 0.5 && Math.abs(PRESETS[i].au - rAu) < 1e-8) return PRESETS[i];
    }
    return null;
  }

  function samePeriod(days) {
    return Math.abs(days - SIDEREAL_DAYS) < 1e-9;
  }

  function diskPhrase(ev) {
    if (ev.westDeg <= 180) {
      if (ev.diskDeg <= 90) {
        return formatDeg(ev.diskDeg) + " west of the sub-observer meridian, on the western half of the disk.";
      }
      return formatDeg(ev.diskDeg) + " west of the sub-observer meridian, past the western limb.";
    }
    if (ev.diskDeg <= 180) {
      return formatDeg(ev.westDeg) + " west in all. Full turns removed, the footpoint is " + formatDeg(ev.diskDeg) + " west of the central meridian.";
    }
    var east = 360 - ev.diskDeg;
    return formatDeg(ev.westDeg) + " west in all. Full turns removed, that longitude sits " + formatDeg(east) + " east of the central meridian. The field line still took the long way west.";
  }

  function why(ev) {
    var syn = evaluate(V_SLOW, R_EARTH, NOAA_ROTATION_DAYS);
    var parts = [];
    parts.push("Constant radial speed. The spiral angle is the arctangent of Ω r / v, " + formatDeg(ev.psiDeg) + " here.");
    parts.push("The radial travel time is the distance divided by that speed: " + formatDays(ev.days) + " days, which is " + formatHours(ev.hours) + " hours.");
    parts.push("In that time the Sun turns " + formatDeg(ev.westDeg) + ". That turn is the western footpoint offset.");
    parts.push(diskPhrase(ev));
    parts.push("The wind is not accelerated. Winding is not held off inside a source surface. A surface near 2.5 solar radii is " + formatAu(sourceSurfaceAu()) + " AU with the Sun sheet’s 695,700 km. That length is not subtracted.");
    if (Math.abs(ev.vKms - V_SLOW) < 0.5 && Math.abs(ev.rAu - R_EARTH) < 1e-8 && samePeriod(ev.periodDays)) {
      parts.push("A familiar round figure for about 400 km/s at Earth is 45°. " + formatDeg(ev.psiDeg) + " does not round to 45. They are not averaged.");
      parts.push("NOAA’s 27 days, fed into the same formula at 400 km/s and 1 AU, gives " + formatDeg(syn.psiDeg) + ". That period is a different sentence. " + formatDeg(syn.psiDeg) + " is not substituted for " + formatDeg(ev.psiDeg) + ".");
    }
    if (Math.abs(ev.vKms - V_FAST) < 0.5) {
      parts.push("750 km/s is a classroom mark inside NOAA’s coronal-hole range, 500 to 800 km/s. It is not a measured wind. Marshall’s 800 km/s is not substituted.");
    }
    parts.push("Not a forecast.");
    return parts.join(" ");
  }

  function tier(ev) {
    var hit = matchedPreset(ev.vKms, ev.rAu);
    if (hit && samePeriod(ev.periodDays)) return hit.name + " · 25.38 d";
    if (hit) return hit.name + " · period edited";
    return "Slider";
  }

  function sense(ev) {
    var hit = matchedPreset(ev.vKms, ev.rAu);
    var auBit = hit ? hit.auLabel : formatAu(ev.rAu);
    return formatSpeed(ev.vKms) + " km/s · " + auBit + " AU · " + formatPeriod(ev.periodDays) + " d";
  }

  function chartSamples(vKms, periodDays, count) {
    var n = count || 81;
    var a = Math.log(R_MIN);
    var b = Math.log(R_MAX);
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      var u = n === 1 ? 0 : i / (n - 1);
      var r = Math.exp(a + u * (b - a));
      var ev = evaluate(vKms, r, periodDays);
      out.push({ r: r, psi: ev.psiDeg });
    }
    return out;
  }

  function rToUnit(r) {
    return (Math.log(r) - Math.log(R_MIN)) / (Math.log(R_MAX) - Math.log(R_MIN));
  }

  function rFromUnit(u) {
    return Math.exp(Math.log(R_MIN) + u * (Math.log(R_MAX) - Math.log(R_MIN)));
  }

  function viewAu(rAu) {
    if (rAu <= 2) return 2.2;
    return rAu * 1.18;
  }

  function cirCrossingAu(periodDays) {
    var delta = CIR_AHEAD_DEG * Math.PI / 180;
    var rKm = delta / (omega(periodDays) * (1 / V_SLOW - 1 / V_FAST));
    return rKm / AU_KM;
  }

  function limitsNote() {
    return "Educational calculator. Constant radial speed, an Archimedean spiral, and a western footpoint of Ω r / v. The wind is not accelerated near the Sun. Corotation inside a source surface near 2.5 solar radii is not applied. The fast and slow overlay is a qualitative corotating interaction region, not a measured stream. Not a space-weather forecast, not a flare score, and not a mission design tool.";
  }

  function planetById(id) {
    var i;
    for (i = 0; i < PLANETS.length; i++) {
      if (PLANETS[i].id === id) return PLANETS[i];
    }
    return null;
  }

  return {
    AU_M: AU_M,
    AU_KM: AU_KM,
    DAY_S: DAY_S,
    SIDEREAL_HOURS: SIDEREAL_HOURS,
    SIDEREAL_DAYS: SIDEREAL_DAYS,
    EQUATOR_DEG_PER_DAY: EQUATOR_DEG_PER_DAY,
    SUN_RADIUS_KM: SUN_RADIUS_KM,
    SOURCE_SURFACE_RADII: SOURCE_SURFACE_RADII,
    V_SLOW: V_SLOW,
    V_FAST: V_FAST,
    V_MIN: V_MIN,
    V_MAX: V_MAX,
    R_MIN: R_MIN,
    R_MAX: R_MAX,
    R_EARTH: R_EARTH,
    P_MIN: P_MIN,
    P_MAX: P_MAX,
    NOAA_ROTATION_DAYS: NOAA_ROTATION_DAYS,
    CIR_AHEAD_DEG: CIR_AHEAD_DEG,
    PLANETS: PLANETS,
    PRESETS: PRESETS,
    omega: omega,
    vOk: vOk,
    rOk: rOk,
    pOk: pOk,
    formatDeg: formatDeg,
    formatDays: formatDays,
    formatHours: formatHours,
    formatTurns: formatTurns,
    formatAu: formatAu,
    formatSpeed: formatSpeed,
    formatPeriod: formatPeriod,
    sourceSurfaceAu: sourceSurfaceAu,
    equatorDays: equatorDays,
    evaluate: evaluate,
    opening: opening,
    footRad: footRad,
    thetaAt: thetaAt,
    presetById: presetById,
    matchedPreset: matchedPreset,
    samePeriod: samePeriod,
    diskPhrase: diskPhrase,
    why: why,
    tier: tier,
    sense: sense,
    chartSamples: chartSamples,
    rToUnit: rToUnit,
    rFromUnit: rFromUnit,
    viewAu: viewAu,
    cirCrossingAu: cirCrossingAu,
    limitsNote: limitsNote,
    planetById: planetById
  };
});
