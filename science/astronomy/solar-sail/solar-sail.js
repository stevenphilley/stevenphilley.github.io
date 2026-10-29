/*! Radiation pressure on a flat solar sail. Classroom model.

    Irradiance at distance r is the inverse square of the nominal total
    solar irradiance at 1 au:
      S(r) = S_N / (r / 1 au)²
    S_N = 1361 W m⁻² exactly, the IAU 2015 Resolution B3 nominal total
    solar irradiance. A conversion constant, not a claim that the Sun is
    always 1361. Kopp & Lean 2011 report 1360.8 ± 0.5 W m⁻² for the 2008
    solar minimum. That measurement is not substituted.

    1 au = 149597870700 m exactly, IAU 2012 Resolution B2.
    c = 299792458 m/s exactly, the SI defining constant.
    GM☉ = 1.3271244×10^20 m³ s⁻², the IAU 2015 Resolution B3 nominal
    solar mass parameter. Also a conversion constant.

    Optical model, flat sail, front face toward the Sun:
      power on the sail = S · A · cos θ, for |θ| ≤ 90°
      fraction ρ is specularly reflected, fraction 1−ρ is absorbed
      absorbed light is given no thermal re-radiation force
    θ is the tilt of the anti-sunward normal from the outward Sun line,
    positive toward the transverse direction of a prograde orbit.
    The force is
      (S A cos θ / c) · [(1−ρ) r̂ + 2 ρ cos θ n̂]
    with n̂ = cos θ r̂ + sin θ t̂.
    Face-on, that is (1+ρ) S A / c. A perfect absorber is S A / c.
    A perfect reflector is 2 S A / c, and the force lies along n̂ with
    magnitude (2 S A / c) cos² θ.

    Characteristic acceleration is that face-on acceleration at 1 au,
    for this area, mass, and reflectivity. It does not use the current
    tilt or the current distance.

    The lightness number here is the ratio of the radiation acceleration
    to the solar gravitational acceleration at the same distance. Both
    fall as 1/r², so the ratio does not depend on distance.

    Δv = a · t holds the acceleration vector fixed. Not a trajectory.

    Mission presets store area and mass only, from the sources named in
    MISSIONS. The button then evaluates a perfect reflector, face-on, at
    1 au. That is not the spacecraft’s optical model and not its orbit. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SolarSail = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Exact SI speed of light. NIST CODATA, defined. BIPM metre. */
  var C_M_S = 299792458;

  /* IAU 2012 Resolution B2. The astronomical unit is exactly this many metres. */
  var AU_M = 149597870700;

  /* IAU 2015 Resolution B3, nominal total solar irradiance at 1 au.
     Exact as a conversion constant: 1 S^N_☉ = 1361 W m⁻². */
  var S_NOMINAL_W_M2 = 1361;

  /* IAU 2015 Resolution B3, nominal solar mass parameter.
     1 (GM)^N_☉ = 1.3271244 × 10^20 m³ s⁻². */
  var GM_SUN_M3_S2 = 1.3271244e20;

  /* Kopp & Lean 2011, Geophysical Research Letters 38, L01706.
     TIM/SORCE value for the 2008 solar minimum. Cited, not used. */
  var KOPP_LEAN_TSI_W_M2 = 1360.8;
  var KOPP_LEAN_TSI_UNC_W_M2 = 0.5;

  /* A day in the constant-acceleration line is 86400 SI seconds.
     The year button is 365.25 of those days, a Julian span, not an orbit. */
  var DAY_S = 86400;
  var YEAR_DAYS = 365.25;

  var AU_MIN = 0.2;
  var AU_MAX = 40;
  var AREA_MIN_M2 = 1;
  var AREA_MAX_M2 = 10000;
  var MASS_MIN_KG = 0.5;
  var MASS_MAX_KG = 2000;
  var TILT_MIN_DEG = -90;
  var TILT_MAX_DEG = 90;
  var TIME_MIN_DAYS = 0;
  var TIME_MAX_DAYS = 10 * YEAR_DAYS;

  /* NASA NSSDCA fact sheets, Mean Orbital Elements (J2000),
     line "Semimajor axis (AU)". The same digits as the Kepler desk.
     Earth’s line is not exactly 1 au. The nominal irradiance is defined
     at 1 au, so the Earth snap is not the 1 AU button. */
  var PLANETS = [
    { id: "mercury", name: "Mercury", au: 0.38709893, auLabel: "0.38709893" },
    { id: "venus", name: "Venus", au: 0.72333199, auLabel: "0.72333199" },
    { id: "earth", name: "Earth", au: 1.00000011, auLabel: "1.00000011" },
    { id: "mars", name: "Mars", au: 1.52366231, auLabel: "1.52366231" },
    { id: "jupiter", name: "Jupiter", au: 5.20336301, auLabel: "5.20336301" }
  ];

  /* Area and mass only. Reflectivity, tilt, and distance are not stored
     here. idealModel() places each one face-on at 1 au with ρ = 1. */
  var MISSIONS = [
    {
      id: "reference",
      label: "1 m² · 1 kg",
      areaM2: 1,
      massKg: 1
    },
    {
      id: "ikaros",
      label: "IKAROS",
      /* JAXA project page: square of side 14 m. Tsuda et al. table:
         sail size 14×14 m. The button is that product, 196 m². */
      areaM2: 196,
      massKg: 307
    },
    {
      id: "lightsail2",
      label: "LightSail 2",
      /* Mansell et al. 2023, Aerospace 10, 579, Table 2, and the
         LightSail 2 SciTech table: 32 m² and 4.93 kg. */
      areaM2: 32,
      massKg: 4.93
    },
    {
      id: "acs3",
      label: "ACS3",
      /* Wilkie, Small Satellite Conference 2021, SSC21-II-10.
         Total deployed sail area 80 m². Appendix table: total spacecraft
         mass including sail 16 kg; each quadrant 20 m². */
      areaM2: 80,
      massKg: 16
    }
  ];

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "⁺"
  };

  function log10(x) {
    return Math.log(x) / Math.LN10;
  }

  function clamp(x, lo, hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
  }

  function formatSup(exp) {
    var s = String(exp);
    var out = "";
    var k;
    for (k = 0; k < s.length; k++) out += SUP[s.charAt(k)] || s.charAt(k);
    return out;
  }

  function formatSci(x, sig) {
    if (typeof x !== "number" || !isFinite(x)) return "—";
    var sign = x < 0 ? "−" : "";
    var ax = Math.abs(x);
    if (ax === 0) return "0";
    var exp = Math.floor(log10(ax));
    var mant = ax / Math.pow(10, exp);
    var mantNum = Number(mant.toPrecision(sig));
    if (mantNum >= 10) {
      mantNum = mantNum / 10;
      exp += 1;
    }
    var mantStr = String(Number(mantNum.toPrecision(sig)));
    return sign + mantStr + "×10" + formatSup(exp);
  }

  function groupInt(s) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function groupFixed(x, digits) {
    var neg = x < 0;
    var s = Math.abs(x).toFixed(digits);
    var parts = s.split(".");
    return (neg ? "−" : "") + groupInt(parts[0]) + (parts.length > 1 ? "." + parts[1] : "");
  }

  function planetById(id) {
    var i;
    for (i = 0; i < PLANETS.length; i++) if (PLANETS[i].id === id) return PLANETS[i];
    return null;
  }

  function missionById(id) {
    var i;
    for (i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i];
    return null;
  }

  function irradiance(au) {
    if (typeof au !== "number" || !isFinite(au) || !(au > 0)) return NaN;
    return S_NOMINAL_W_M2 / (au * au);
  }

  /* Face-on perfect absorber, S/c, at this distance. */
  function pressureAbsorber(au) {
    var s = irradiance(au);
    if (!isFinite(s)) return NaN;
    return s / C_M_S;
  }

  /* Face-on perfect reflector, 2S/c, at this distance. */
  function pressureReflector(au) {
    var s = irradiance(au);
    if (!isFinite(s)) return NaN;
    return 2 * s / C_M_S;
  }

  function gravity(au) {
    if (typeof au !== "number" || !isFinite(au) || !(au > 0)) return NaN;
    var r = au * AU_M;
    return GM_SUN_M3_S2 / (r * r);
  }

  function auFromUnit(step) {
    if (typeof step !== "number" || !isFinite(step)) return NaN;
    var t = clamp(step, 0, 1000) / 1000;
    return Math.exp(Math.log(AU_MIN) + t * (Math.log(AU_MAX) - Math.log(AU_MIN)));
  }

  function unitFromAu(au) {
    if (typeof au !== "number" || !isFinite(au) || !(au > 0)) return NaN;
    var t = (Math.log(au) - Math.log(AU_MIN)) / (Math.log(AU_MAX) - Math.log(AU_MIN));
    return clamp(t, 0, 1) * 1000;
  }

  function logFromUnit(step, lo, hi) {
    if (typeof step !== "number" || !isFinite(step)) return NaN;
    var t = clamp(step, 0, 1000) / 1000;
    return Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo)));
  }

  function unitFromLog(value, lo, hi) {
    if (typeof value !== "number" || !isFinite(value) || !(value > 0)) return NaN;
    var t = (Math.log(value) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return clamp(t, 0, 1) * 1000;
  }

  function areaFromUnit(step) {
    return logFromUnit(step, AREA_MIN_M2, AREA_MAX_M2);
  }

  function unitFromArea(area) {
    return unitFromLog(area, AREA_MIN_M2, AREA_MAX_M2);
  }

  function massFromUnit(step) {
    return logFromUnit(step, MASS_MIN_KG, MASS_MAX_KG);
  }

  function unitFromMass(mass) {
    return unitFromLog(mass, MASS_MIN_KG, MASS_MAX_KG);
  }

  function inRange(x, lo, hi) {
    return typeof x === "number" && isFinite(x) && x >= lo && x <= hi;
  }

  function model(spec) {
    if (!spec) return null;
    if (!inRange(spec.au, AU_MIN, AU_MAX)) return null;
    if (!inRange(spec.areaM2, AREA_MIN_M2, AREA_MAX_M2)) return null;
    if (!inRange(spec.massKg, MASS_MIN_KG, MASS_MAX_KG)) return null;
    if (!inRange(spec.reflectivity, 0, 1)) return null;
    if (!inRange(spec.tiltDeg, TILT_MIN_DEG, TILT_MAX_DEG)) return null;
    if (!inRange(spec.timeDays, TIME_MIN_DAYS, TIME_MAX_DAYS)) return null;

    var theta = spec.tiltDeg * Math.PI / 180;
    var cth = Math.cos(theta);
    var sth = Math.sin(theta);
    /* ±90° is edge-on. cos(90°) is not a clean zero in binary. */
    if (Math.abs(spec.tiltDeg) >= 90) cth = 0;
    if (cth < 0) cth = 0;
    var rho = spec.reflectivity;
    var s = irradiance(spec.au);
    var scale = s * spec.areaM2 / C_M_S;
    var radialN = scale * cth * (1 - rho + 2 * rho * cth * cth);
    var transverseN = scale * (2 * rho * cth * cth * sth);
    var forceN = Math.sqrt(radialN * radialN + transverseN * transverseN);
    var accel = forceN / spec.massKg;
    var g = gravity(spec.au);
    var faceOn1Au = S_NOMINAL_W_M2 * spec.areaM2 * (1 + rho) / (C_M_S * spec.massKg);
    var timeS = spec.timeDays * DAY_S;
    return {
      au: spec.au,
      areaM2: spec.areaM2,
      massKg: spec.massKg,
      reflectivity: rho,
      tiltDeg: spec.tiltDeg,
      timeDays: spec.timeDays,
      timeS: timeS,
      irradiance: s,
      pressureAbsorber: s / C_M_S,
      pressureReflector: 2 * s / C_M_S,
      pressure: spec.areaM2 > 0 ? forceN / spec.areaM2 : NaN,
      radialN: radialN,
      transverseN: transverseN,
      forceN: forceN,
      accel: accel,
      accelRadial: radialN / spec.massKg,
      accelTransverse: transverseN / spec.massKg,
      forceAngleRad: forceN > 0 ? Math.atan2(transverseN, radialN) : 0,
      characteristic: faceOn1Au,
      gravity: g,
      lightness: accel / g,
      lightnessFaceOn: faceOn1Au / gravity(1),
      deltaV: accel * timeS
    };
  }

  function idealModel(id, timeDays) {
    var mission = missionById(id);
    if (!mission) return null;
    var days = timeDays == null ? 1 : timeDays;
    var row = model({
      au: 1,
      areaM2: mission.areaM2,
      massKg: mission.massKg,
      reflectivity: 1,
      tiltDeg: 0,
      timeDays: days
    });
    if (!row) return null;
    row.id = mission.id;
    row.label = mission.label;
    return row;
  }

  function matchedPlanet(au) {
    if (typeof au !== "number" || !isFinite(au)) return "";
    if (Math.abs(au - 1) <= 1e-12) return "one";
    var i;
    for (i = 0; i < PLANETS.length; i++) {
      if (Math.abs(au - PLANETS[i].au) <= 1e-10) return PLANETS[i].id;
    }
    return "";
  }

  function matchedMission(row) {
    if (!row) return "";
    if (Math.abs(row.au - 1) > 1e-12) return "";
    if (row.reflectivity !== 1 || row.tiltDeg !== 0) return "";
    var i;
    for (i = 0; i < MISSIONS.length; i++) {
      if (Math.abs(row.areaM2 - MISSIONS[i].areaM2) <= 1e-9 &&
          Math.abs(row.massKg - MISSIONS[i].massKg) <= 1e-9) return MISSIONS[i].id;
    }
    return "";
  }

  function formatAu(au) {
    if (typeof au !== "number" || !isFinite(au)) return "—";
    var id = matchedPlanet(au);
    if (id === "one") return "1 AU";
    if (id) return planetById(id).auLabel + " AU";
    if (au >= 10) return au.toFixed(3) + " AU";
    if (au >= 1) return au.toFixed(4) + " AU";
    return au.toFixed(5) + " AU";
  }

  function formatFlux(wm2) {
    if (typeof wm2 !== "number" || !isFinite(wm2)) return "—";
    if (wm2 >= 100) return groupFixed(wm2, 1) + " W/m²";
    if (wm2 >= 10) return wm2.toFixed(2) + " W/m²";
    return wm2.toFixed(3) + " W/m²";
  }

  function formatPressure(pa) {
    if (typeof pa !== "number" || !isFinite(pa)) return "—";
    var u = pa * 1e6;
    if (u === 0) return "0 μN/m²";
    if (u >= 100) return groupFixed(u, 1) + " μN/m²";
    if (u >= 0.001) return u.toFixed(3) + " μN/m²";
    return formatSci(pa, 4) + " N/m²";
  }

  function formatForce(n) {
    if (typeof n !== "number" || !isFinite(n)) return "—";
    var sign = n < 0 ? "−" : "";
    var a = Math.abs(n);
    if (a === 0) return "0 μN";
    if (a >= 1e-3) return sign + groupFixed(a * 1e3, 3) + " mN";
    if (a >= 1e-9) return sign + (a * 1e6).toFixed(3) + " μN";
    return sign + formatSci(a, 4) + " N";
  }

  function formatAccel(mps2) {
    if (typeof mps2 !== "number" || !isFinite(mps2)) return "—";
    var sign = mps2 < 0 ? "−" : "";
    var a = Math.abs(mps2);
    if (a === 0) return "0";
    if (a >= 1e-4) return sign + (a * 1e3).toFixed(3) + " mm/s²";
    if (a >= 1e-5) return sign + (a * 1e3).toFixed(4) + " mm/s²";
    if (a >= 1e-9) return sign + (a * 1e6).toFixed(3) + " μm/s²";
    return sign + formatSci(a, 4) + " m/s²";
  }

  function formatBeta(b) {
    if (typeof b !== "number" || !isFinite(b)) return "—";
    if (b === 0) return "0";
    if (Math.abs(b) >= 0.01) return b.toFixed(4);
    return formatSci(b, 4);
  }

  function formatDv(mps) {
    if (typeof mps !== "number" || !isFinite(mps)) return "—";
    var sign = mps < 0 ? "−" : "";
    var a = Math.abs(mps);
    if (a === 0) return "0 m/s";
    if (a >= 1000) return sign + (a / 1000).toFixed(3) + " km/s";
    if (a >= 10) return sign + a.toFixed(2) + " m/s";
    if (a >= 0.01) return sign + a.toFixed(3) + " m/s";
    return sign + (a * 1000).toFixed(3) + " mm/s";
  }

  function formatArea(m2) {
    if (typeof m2 !== "number" || !isFinite(m2)) return "—";
    if (Math.abs(m2 - Math.round(m2)) < 1e-6) return groupInt(String(Math.round(m2))) + " m²";
    return m2.toFixed(1) + " m²";
  }

  function formatMass(kg) {
    if (typeof kg !== "number" || !isFinite(kg)) return "—";
    if (Math.abs(kg - Math.round(kg)) < 1e-6) return groupInt(String(Math.round(kg))) + " kg";
    var s = kg.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    return s + " kg";
  }

  function formatTilt(deg) {
    if (typeof deg !== "number" || !isFinite(deg)) return "—";
    var sign = deg < 0 ? "−" : (deg > 0 ? "+" : "");
    var a = Math.abs(deg);
    var body = Math.abs(a - Math.round(a)) < 1e-6 ? String(Math.round(a)) : a.toFixed(1);
    return sign + body + "°";
  }

  function formatReflect(rho) {
    if (typeof rho !== "number" || !isFinite(rho)) return "—";
    if (rho === 0) return "0 · perfect absorber";
    if (rho === 1) return "1 · perfect reflector";
    return rho.toFixed(2);
  }

  function formatLoading(kgPerM2) {
    if (typeof kgPerM2 !== "number" || !isFinite(kgPerM2)) return "—";
    if (kgPerM2 >= 0.1) return kgPerM2.toFixed(3) + " kg/m²";
    return (kgPerM2 * 1000).toFixed(1) + " g/m²";
  }

  function formatDays(days) {
    if (typeof days !== "number" || !isFinite(days)) return "—";
    if (days === 1) return "1 day";
    if (Math.abs(days - YEAR_DAYS) < 1e-9) return "365.25 days";
    if (Math.abs(days - Math.round(days)) < 1e-6) return groupInt(String(Math.round(days))) + " days";
    return days.toFixed(2) + " days";
  }

  function loading(row) {
    if (!row || !(row.areaM2 > 0)) return NaN;
    return row.massKg / row.areaM2;
  }

  function explain(row) {
    if (!row) return "";
    var where = matchedPlanet(row.au);
    var place = where === "one"
      ? "1 AU — the distance where the nominal irradiance is defined —"
      : (where ? planetById(where).name + "’s fact-sheet semimajor axis, " + formatAu(row.au) + "," : formatAu(row.au));
    var push = row.tiltDeg === 0
      ? "The force is radial, straight out from the Sun."
      : (row.transverseN > 0
        ? "Part of the force points along a prograde orbit, so the sail gains orbital energy and the path spirals outward."
        : (row.transverseN < 0
          ? "Part of the force points against a prograde orbit, so the sail loses orbital energy and the path spirals inward."
          : "The transverse force is zero. Tilting an absorber only shrinks the projected area. The sideways push is the reflected light."));
    var face = row.tiltDeg === 0
      ? " Face-on, on a circular orbit, the velocity is perpendicular to this push, so at that instant the force does no work."
      : "";
    var earthGap = "";
    if (where === "earth") {
      earthGap = " Earth’s semimajor axis is not exactly 1 au. " + formatFlux(row.irradiance) + " is 1,361 W/m² divided by (1.00000011)². The difference from 1,361.0 sits inside the tenth this page prints.";
    }
    return "Irradiance at " + place + " is " + formatFlux(row.irradiance) + ", the nominal 1,361 W/m² divided by the square of the distance in AU." + earthGap + " A perfect absorber, face-on, would feel " + formatPressure(row.pressureAbsorber) + ". A perfect reflector, face-on, would feel " + formatPressure(row.pressureReflector) + ", twice that, because the light leaves with the opposite momentum. This sail is " + formatReflect(row.reflectivity) + ", tilt " + formatTilt(row.tiltDeg) + ", area " + formatArea(row.areaM2) + ", mass " + formatMass(row.massKg) + ". The pressure on it is " + formatPressure(row.pressure) + " and the force is " + formatForce(row.forceN) + ". " + push + face + " The acceleration is " + formatAccel(row.accel) + ". Characteristic acceleration, the same area, mass, and reflectivity held face-on at 1 AU, is " + formatAccel(row.characteristic) + ". Solar gravity here is " + formatAccel(row.gravity) + ", so the lightness number is " + formatBeta(row.lightness) + ". Both accelerations fall as 1/r², so that ratio does not change with distance. If this acceleration stayed constant for " + formatDays(row.timeDays) + " (" + groupInt(String(Math.round(row.timeS))) + " s), the speed would change by " + formatDv(row.deltaV) + ". That line holds the acceleration fixed. A real sail moves, the irradiance changes, and the orbit curves. It is not a trajectory.";
  }

  function explainWhy() {
    var face = pressureReflector(1);
    var abs = pressureAbsorber(1);
    var ref = idealModel("reference", 1);
    var year = model({
      au: 1, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 0, timeDays: YEAR_DAYS
    });
    var grams = (face / gravity(1)) * 1000;
    return {
      tiny: "At 1 AU a perfect reflector, face-on, feels " + formatPressure(face) + ", about 9.1 micronewtons on a square metre. On the 1 m², 1 kg reference that acceleration is " + formatAccel(ref.accel) + ". A day of it, held constant, is " + formatDv(ref.deltaV) + ". A Julian year of 365.25 days, still held constant, is " + formatDv(year.deltaV) + ". The push is tiny beside a rocket burn, and the sunlight does not switch off. Lightness 1, the same perfect reflector held face-on, would take " + grams.toFixed(3) + " g/m². The reference sail is 1 kg/m².",
      doubled: "An absorbed photon hands the sail its momentum, E/c. Face-on, the pressure is the irradiance divided by c, " + formatPressure(abs) + " at 1 AU. A reflected photon leaves carrying that momentum the other way, so the sail is pushed twice: once by the arrival and once by the departure. The face-on reflector is " + formatPressure(face) + ". The slider is the fraction between those two. Thermal re-radiation of the absorbed energy is left out.",
      tilt: "On a circular orbit the velocity is sideways, perpendicular to the Sun line. Face-on, the force is radial, so at that instant it does no work. Tilt the sail and a reflected photon leaves at an angle. For a perfect reflector the force follows the sail normal. Tip that normal forward, along the motion, and the sail gains orbital energy and spirals outward. Tip it backward and the sail loses energy and spirals inward. A perfect absorber has no transverse force in this model. The photons it catches were traveling radially, and absorbing them does not turn that momentum sideways."
    };
  }

  return {
    C_M_S: C_M_S,
    AU_M: AU_M,
    S_NOMINAL_W_M2: S_NOMINAL_W_M2,
    GM_SUN_M3_S2: GM_SUN_M3_S2,
    KOPP_LEAN_TSI_W_M2: KOPP_LEAN_TSI_W_M2,
    KOPP_LEAN_TSI_UNC_W_M2: KOPP_LEAN_TSI_UNC_W_M2,
    DAY_S: DAY_S,
    YEAR_DAYS: YEAR_DAYS,
    AU_MIN: AU_MIN,
    AU_MAX: AU_MAX,
    AREA_MIN_M2: AREA_MIN_M2,
    AREA_MAX_M2: AREA_MAX_M2,
    MASS_MIN_KG: MASS_MIN_KG,
    MASS_MAX_KG: MASS_MAX_KG,
    TILT_MIN_DEG: TILT_MIN_DEG,
    TILT_MAX_DEG: TILT_MAX_DEG,
    TIME_MIN_DAYS: TIME_MIN_DAYS,
    TIME_MAX_DAYS: TIME_MAX_DAYS,
    PLANETS: PLANETS,
    MISSIONS: MISSIONS,
    planetById: planetById,
    missionById: missionById,
    irradiance: irradiance,
    pressureAbsorber: pressureAbsorber,
    pressureReflector: pressureReflector,
    gravity: gravity,
    auFromUnit: auFromUnit,
    unitFromAu: unitFromAu,
    areaFromUnit: areaFromUnit,
    unitFromArea: unitFromArea,
    massFromUnit: massFromUnit,
    unitFromMass: unitFromMass,
    model: model,
    idealModel: idealModel,
    matchedPlanet: matchedPlanet,
    matchedMission: matchedMission,
    loading: loading,
    formatSci: formatSci,
    formatAu: formatAu,
    formatFlux: formatFlux,
    formatPressure: formatPressure,
    formatForce: formatForce,
    formatAccel: formatAccel,
    formatBeta: formatBeta,
    formatDv: formatDv,
    formatArea: formatArea,
    formatMass: formatMass,
    formatLoading: formatLoading,
    formatTilt: formatTilt,
    formatReflect: formatReflect,
    formatDays: formatDays,
    explain: explain,
    explainWhy: explainWhy
  };
});
