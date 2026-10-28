/*! Light-travel time between solar-system bodies.
    Geometric distance divided by c. Not a Horizons ephemeris.

    Planet positions are NASA JPL "Approximate Positions of the Planets"
    (E. M. Standish and J. G. Williams), Table 1, valid 1800–2050:
    https://ssd.jpl.nasa.gov/planets/approx_pos.html
    Earth is the Earth–Moon barycenter on that table. Table 2 and the
    Table 2b perturbation terms are not used. The date is 12:00 UTC, not
    TDB, and the straight-line delay is not iterated for motion during
    the flight of the signal.

    The Moon is a mean-distance circle, semimajor axis 384,400 km, period
    27.3217 days, inclination 5.145°, the same schematic as the solar map.
    Perigee and apogee are the Moon Fact Sheet figures, not a solved orbit.
    Pluto uses the historical Keplerian row the solar map already carries.
    The current JPL table does not include Pluto and publishes no Pluto error.

    c = 299792458 m/s exactly (SI).
    1 au = 149597870700 m exactly (IAU 2012 Resolution B2). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LightTime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var C_M_S = 299792458;
  var AU_M = 149597870700;
  var AU_KM = AU_M / 1000;
  var J2000 = 2451545.0;

  /* Moon Fact Sheet. The circle uses the semimajor axis and the sidereal
     period. Perigee, apogee, and the rough annual range are labels only. */
  var MOON_A_KM = 384400;
  var MOON_PERIGEE_KM = 363300;
  var MOON_APOGEE_KM = 405500;
  var MOON_YEAR_MIN_KM = 357000;
  var MOON_YEAR_MAX_KM = 407000;
  var MOON_PERIOD_DAYS = 27.3217;
  var MOON_I_DEG = 5.145;
  var MOON_NODE_DEG = 125.08;
  var MOON_L0 = 218.316;

  /* JPL Table 1 heliocentric distance tolerance, 1800–2050, in units of
     1000 km, as published. A separation is not the sum of these. */
  var RHO_1000KM = {
    mercury: 1,
    venus: 4,
    earth: 6,
    mars: 25,
    jupiter: 600,
    saturn: 1500,
    uranus: 1000,
    neptune: 200
  };

  function row(a, da, e, de, I, dI, L, dL, w, dw, O, dO) {
    return { a: a, da: da, e: e, de: de, I: I, dI: dI, L: L, dL: dL, w: w, dw: dw, O: O, dO: dO };
  }

  /* Table 1, 1800 AD – 2050 AD. Earth is the Earth–Moon barycenter. */
  var T1 = {
    mercury: row(0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081),
    venus: row(0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418),
    earth: row(1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0.0, 0.0),
    mars: row(1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343),
    jupiter: row(5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106),
    saturn: row(9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794),
    uranus: row(19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589),
    neptune: row(30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664)
  };

  /* Historical JPL-style row kept by the solar map. Not on the current table. */
  var PLUTO = row(39.48211675, -0.00031596, 0.24882730, 0.00005170, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482);

  var BODIES = [
    { id: "sun", name: "Sun", kind: "star" },
    { id: "mercury", name: "Mercury", kind: "planet" },
    { id: "venus", name: "Venus", kind: "planet" },
    { id: "earth", name: "Earth", kind: "planet" },
    { id: "mars", name: "Mars", kind: "planet" },
    { id: "jupiter", name: "Jupiter", kind: "planet" },
    { id: "saturn", name: "Saturn", kind: "planet" },
    { id: "uranus", name: "Uranus", kind: "planet" },
    { id: "neptune", name: "Neptune", kind: "planet" },
    { id: "moon", name: "Moon", kind: "moon" },
    { id: "pluto", name: "Pluto", kind: "dwarf" }
  ];

  var COLORS = {
    sun: "#ffcc66",
    mercury: "#b8b0a4",
    venus: "#e8c989",
    earth: "#6ec8ff",
    mars: "#e07a4c",
    jupiter: "#d4a574",
    saturn: "#e6d4a8",
    uranus: "#9fd6e8",
    neptune: "#4f7cff",
    moon: "#d5d2cc",
    pluto: "#c9b8a8"
  };

  function bodyById(id) {
    var i;
    for (i = 0; i < BODIES.length; i++) if (BODIES[i].id === id) return BODIES[i];
    return null;
  }

  function norm360(d) {
    d = d % 360;
    if (d < 0) d += 360;
    return d;
  }

  function norm180(d) {
    d = norm360(d);
    if (d > 180) d -= 360;
    return d;
  }

  function julianNoonUTC(year, month, day) {
    return Date.UTC(year, month - 1, day, 12, 0, 0) / 86400000 + 2440587.5;
  }

  var WINDOW_START = julianNoonUTC(1800, 1, 1);
  var WINDOW_END = julianNoonUTC(2050, 12, 31);

  function inWindow(jd) {
    return typeof jd === "number" && isFinite(jd) && jd >= WINDOW_START - 1e-9 && jd <= WINDOW_END + 1e-9;
  }

  function ymdFromJD(jd) {
    var ms = (jd - 2440587.5) * 86400000;
    var d = new Date(ms);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate()
    };
  }

  function isoFromJD(jd) {
    var p = ymdFromJD(jd);
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return p.year + "-" + pad(p.month) + "-" + pad(p.day);
  }

  function elements(id, jd) {
    if (id === "sun" || id === "moon") return null;
    if (!inWindow(jd)) return null;
    var src = id === "pluto" ? PLUTO : T1[id];
    if (!src) return null;
    var T = (jd - J2000) / 36525;
    var e = src.e + src.de * T;
    if (e < 0) e = 0;
    if (e > 0.95) e = 0.95;
    return {
      a: src.a + src.da * T,
      e: e,
      I: src.I + src.dI * T,
      L: src.L + src.dL * T,
      varpi: src.w + src.dw * T,
      Omega: src.O + src.dO * T
    };
  }

  function solveE(M, e) {
    var E = M + e * Math.sin(M);
    var n;
    for (n = 0; n < 15; n++) {
      var dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
      E += dE;
      if (Math.abs(dE) < 1e-12) break;
    }
    return E;
  }

  function rotateOrbit(xp, yp, el) {
    var w = (el.varpi - el.Omega) * Math.PI / 180;
    var Om = el.Omega * Math.PI / 180;
    var I = el.I * Math.PI / 180;
    var cw = Math.cos(w), sw = Math.sin(w);
    var cO = Math.cos(Om), sO = Math.sin(Om);
    var cI = Math.cos(I), sI = Math.sin(I);
    return {
      x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
      y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
      z: (sw * sI) * xp + (cw * sI) * yp
    };
  }

  function positionFromElements(el) {
    var Mdeg = el.L - el.varpi;
    var e = el.e;
    var E = solveE(norm180(Mdeg) * Math.PI / 180, e);
    var xp = el.a * (Math.cos(E) - e);
    var yp = el.a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
    var p = rotateOrbit(xp, yp, el);
    var r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    return { x: p.x, y: p.y, z: p.z, r: r };
  }

  function moonOffset(jd) {
    var days = jd - J2000;
    var nu = norm360(MOON_L0 + (360 / MOON_PERIOD_DAYS) * days) * Math.PI / 180;
    var r = MOON_A_KM / AU_KM;
    var i = MOON_I_DEG * Math.PI / 180;
    var Om = MOON_NODE_DEG * Math.PI / 180;
    var cO = Math.cos(Om), sO = Math.sin(Om);
    var cI = Math.cos(i), sI = Math.sin(i);
    var cv = Math.cos(nu), sv = Math.sin(nu);
    return {
      x: r * (cv * cO - sv * sO * cI),
      y: r * (cv * sO + sv * cO * cI),
      z: r * sv * sI,
      r: r
    };
  }

  function helio(id, jd) {
    if (!inWindow(jd)) return null;
    if (!id || id === "sun") return { x: 0, y: 0, z: 0, r: 0 };
    if (id === "moon") {
      var parent = helio("earth", jd);
      var off = moonOffset(jd);
      return {
        x: parent.x + off.x,
        y: parent.y + off.y,
        z: parent.z + off.z,
        r: Math.sqrt(
          (parent.x + off.x) * (parent.x + off.x) +
          (parent.y + off.y) * (parent.y + off.y) +
          (parent.z + off.z) * (parent.z + off.z)
        )
      };
    }
    var el = elements(id, jd);
    if (!el) return null;
    return positionFromElements(el);
  }

  function orbitXY(id, jd, n) {
    var el = elements(id, jd);
    if (!el) return [];
    var count = n && n > 8 ? n : 180;
    var pts = [];
    var i;
    for (i = 0; i <= count; i++) {
      var E = (i / count) * 2 * Math.PI;
      var xp = el.a * (Math.cos(E) - el.e);
      var yp = el.a * Math.sqrt(Math.max(0, 1 - el.e * el.e)) * Math.sin(E);
      var p = rotateOrbit(xp, yp, el);
      pts.push({ x: p.x, y: p.y });
    }
    return pts;
  }

  function periodDays(id) {
    if (id === "sun") return null;
    if (id === "moon") return MOON_PERIOD_DAYS;
    var src = id === "pluto" ? PLUTO : T1[id];
    if (!src || !src.dL) return null;
    return Math.abs(360 * 36525 / src.dL);
  }

  function synodicDays(idA, idB) {
    var pa = periodDays(idA);
    var pb = periodDays(idB);
    if (pa == null && pb == null) return null;
    if (pa == null) return pb;
    if (pb == null) return pa;
    var inv = Math.abs(1 / pa - 1 / pb);
    if (inv < 1e-16) return null;
    return 1 / inv;
  }

  function delayFromKm(km) {
    var meters = km * 1000;
    var oneWay = meters / C_M_S;
    return {
      km: km,
      au: km / AU_KM,
      meters: meters,
      oneWay: oneWay,
      roundTrip: oneWay * 2
    };
  }

  function pair(idA, idB, jd) {
    if (idA === idB) return null;
    if (!bodyById(idA) || !bodyById(idB)) return null;
    if (!inWindow(jd)) return null;
    var A = helio(idA, jd);
    var B = helio(idB, jd);
    if (!A || !B) return null;
    var dx = A.x - B.x;
    var dy = A.y - B.y;
    var dz = A.z - B.z;
    var au = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var meters = au * AU_M;
    var oneWay = meters / C_M_S;
    return {
      idA: idA,
      idB: idB,
      jd: jd,
      au: au,
      km: meters / 1000,
      meters: meters,
      oneWay: oneWay,
      roundTrip: oneWay * 2,
      ax: A.x,
      ay: A.y,
      bx: B.x,
      by: B.y
    };
  }

  function isEarthMoon(idA, idB) {
    return (idA === "earth" && idB === "moon") || (idA === "moon" && idB === "earth");
  }

  function extreme(idA, idB, jd, km) {
    var d = delayFromKm(km);
    d.idA = idA;
    d.idB = idB;
    d.jd = jd;
    return d;
  }

  function span(idA, idB, jd) {
    if (!pair(idA, idB, jd) && !isEarthMoon(idA, idB)) return null;
    if (!inWindow(jd)) return null;
    if (isEarthMoon(idA, idB)) {
      return {
        kind: "moon-sheet",
        min: extreme(idA, idB, jd, MOON_PERIGEE_KM),
        max: extreme(idA, idB, jd, MOON_APOGEE_KM),
        yearMin: extreme(idA, idB, jd, MOON_YEAR_MIN_KM),
        yearMax: extreme(idA, idB, jd, MOON_YEAR_MAX_KM),
        mean: extreme(idA, idB, jd, MOON_A_KM),
        days: null,
        synodicDays: MOON_PERIOD_DAYS,
        clipped: false,
        label: "Moon Fact Sheet perigee and apogee, not a date on the circle"
      };
    }
    var syn = synodicDays(idA, idB);
    if (!syn || !isFinite(syn)) return null;
    var half = syn / 2;
    var t0 = jd - half;
    var t1 = jd + half;
    var clipped = false;
    if (t0 < WINDOW_START) { t0 = WINDOW_START; clipped = true; }
    if (t1 > WINDOW_END) { t1 = WINDOW_END; clipped = true; }
    if (!(t1 > t0)) return null;
    var steps = 720;
    var i;
    var min = null;
    var max = null;
    for (i = 0; i <= steps; i++) {
      var t = t0 + (t1 - t0) * (i / steps);
      var hit = pair(idA, idB, t);
      if (!hit) continue;
      if (!min || hit.km < min.km) min = hit;
      if (!max || hit.km > max.km) max = hit;
    }
    var cur = pair(idA, idB, jd);
    if (cur) {
      if (!min || cur.km < min.km) min = cur;
      if (!max || cur.km > max.km) max = cur;
    }
    if (!min || !max) return null;
    var sunSide = idA === "sun" || idB === "sun";
    var moonSide = idA === "moon" || idB === "moon";
    var what = sunSide ? "one orbit" : (moonSide ? "one lunar circuit against the other body" : "one synodic period");
    var label = what + ", " + syn.toFixed(1) + " days";
    if (clipped) label += ", clipped to 1800–2050";
    return {
      kind: "sample",
      min: min,
      max: max,
      days: t1 - t0,
      synodicDays: syn,
      clipped: clipped,
      t0: t0,
      t1: t1,
      label: label
    };
  }

  function envelope(idA, idB, stepDays) {
    if (isEarthMoon(idA, idB)) return span(idA, idB, julianNoonUTC(2000, 1, 1));
    var step = stepDays && stepDays > 0 ? stepDays : 2;
    var min = null;
    var max = null;
    var t;
    for (t = WINDOW_START; t <= WINDOW_END; t += step) {
      var hit = pair(idA, idB, t);
      if (!hit) continue;
      if (!min || hit.km < min.km) min = hit;
      if (!max || hit.km > max.km) max = hit;
    }
    if (!min || !max) return null;
    return { min: min, max: max, stepDays: step };
  }

  function groupInt(n) {
    var neg = n < 0;
    var s = String(Math.round(Math.abs(n)));
    var out = "";
    var i;
    for (i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 === 0) out += ",";
      out += s[i];
    }
    return (neg ? "−" : "") + out;
  }

  function formatKm(km) {
    if (!isFinite(km)) return "—";
    return groupInt(km) + " km";
  }

  function formatAu(au) {
    if (!isFinite(au)) return "—";
    var digits = au < 0.01 ? 6 : 5;
    return au.toFixed(digits) + " AU";
  }

  function formatMinutes(seconds) {
    if (!isFinite(seconds)) return "—";
    var m = seconds / 60;
    if (m < 10) return m.toFixed(3) + " min";
    if (m < 100) return m.toFixed(2) + " min";
    return m.toFixed(1) + " min";
  }

  function formatDelay(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "—";
    if (seconds < 0.01) return (seconds * 1000).toFixed(3) + " ms";
    if (seconds < 60) return seconds.toFixed(3) + " s";
    var left = seconds;
    var days = Math.floor(left / 86400);
    left -= days * 86400;
    var hours = Math.floor(left / 3600);
    left -= hours * 3600;
    var mins = Math.floor(left / 60);
    var secs = left - mins * 60;
    var parts = [];
    if (days) parts.push(days + " d");
    if (hours || days) parts.push(hours + " h");
    if (mins || hours || days) parts.push(mins + " min");
    parts.push((seconds < 3600 ? secs.toFixed(1) : secs.toFixed(0)) + " s");
    return parts.join(" ");
  }

  function keyOf(idA, idB) {
    return [idA, idB].slice().sort().join("-");
  }

  function meaning(idA, idB, hit) {
    if (!hit) return "Pick two different bodies inside 1800–2050.";
    var key = keyOf(idA, idB);
    var one = formatDelay(hit.oneWay);
    var two = formatDelay(hit.roundTrip);
    var mins = formatMinutes(hit.oneWay);
    if (key === "earth-sun") {
      return "Sunlight leaving the Sun now reaches the Earth–Moon barycenter in " + one + " (" + mins + "). The reply, if a radio signal went out and came straight back, would take " + two + ". One astronomical unit is " + formatDelay(AU_M / C_M_S) + " (" + formatMinutes(AU_M / C_M_S) + "), about 8.3 minutes. This date is not exactly 1 AU.";
    }
    if (key === "earth-mars") {
      return "A Mars rover cannot be joysticked live. On this date the round trip is " + two + " (" + formatMinutes(hit.roundTrip) + "). The command arrives, the rover acts, and the picture starts back only after that wait. Across 1800–2050 this model runs from roughly 3 to 22 light-minutes, one way. The card’s min and max are one synodic period around this date, not every opposition.";
    }
    if (key === "earth-moon") {
      return "At the fact-sheet mean distance the round trip is " + two + ", about 2.5 seconds. A voice from the Moon can be answered, and the pause is that long before the reply can start. Perigee and apogee move it by a fraction of a second. This circle does not say which of those the Moon is at today.";
    }
    if (key === "earth-jupiter") {
      return "Jupiter is " + one + " away, one way, on this date (" + mins + "). A command and its confirmation take " + two + ". Sequences are written for a later geometry. JPL’s published heliocentric distance tolerance for Jupiter on this table is 600 × 1000 km, about 2 seconds of light, beside a delay of this size.";
    }
    if (idA === "pluto" || idB === "pluto") {
      return "One way is " + one + " and the round trip is " + two + ". Pluto is the historical row, not the current JPL table, so this delay is coarser than the eight planets. It is still a geometric distance over c.";
    }
    if (idA === "moon" || idB === "moon") {
      return "One way is " + one + " and the round trip is " + two + ". The Moon sits on a mean-distance circle, so this figure moves with the planets and does not add perigee and apogee. Those are printed with the range.";
    }
    if (hit.roundTrip < 5) {
      return "The round trip is " + two + ". A conversation still works, with a pause you can hear.";
    }
    if (hit.roundTrip < 180) {
      return "The round trip is " + two + ". Live steering, as if the vehicle were in the room, does not fit in that wait.";
    }
    if (hit.oneWay < 86400) {
      return "One way is " + one + " (" + mins + ") and the round trip is " + two + ". The command is planned for the geometry it will meet, not for the geometry at the moment it is sent.";
    }
    return "One way is " + one + " and the round trip is " + two + ". This is the straight-line distance divided by c, not an iterated light-time solution.";
  }

  function rhoNote(idA, idB) {
    function bit(id) {
      if (id === "sun" || id === "moon") return null;
      if (id === "pluto") return "Pluto has no published tolerance on the current table";
      var n = RHO_1000KM[id];
      if (!n) return null;
      var name = bodyById(id).name;
      if (id === "earth") name = "the Earth–Moon barycenter";
      return name + " " + n + " × 1000 km";
    }
    var a = bit(idA);
    var b = bit(idB);
    if (!a && !b) return "The Moon’s distance here is the fact-sheet mean, not a JPL planetary ρ.";
    var parts = [];
    if (a) parts.push(a);
    if (b) parts.push(b);
    return "JPL’s 1800–2050 heliocentric distance tolerances: " + parts.join("; ") + ". A separation can miss by more than either figure. The delay is still that distance over c.";
  }

  function auLight() {
    var seconds = AU_M / C_M_S;
    return {
      meters: AU_M,
      seconds: seconds,
      minutes: seconds / 60,
      roundTrip: seconds * 2
    };
  }

  return {
    C_M_S: C_M_S,
    AU_M: AU_M,
    AU_KM: AU_KM,
    J2000: J2000,
    WINDOW_START: WINDOW_START,
    WINDOW_END: WINDOW_END,
    MOON_A_KM: MOON_A_KM,
    MOON_PERIGEE_KM: MOON_PERIGEE_KM,
    MOON_APOGEE_KM: MOON_APOGEE_KM,
    MOON_YEAR_MIN_KM: MOON_YEAR_MIN_KM,
    MOON_YEAR_MAX_KM: MOON_YEAR_MAX_KM,
    MOON_PERIOD_DAYS: MOON_PERIOD_DAYS,
    RHO_1000KM: RHO_1000KM,
    BODIES: BODIES,
    COLORS: COLORS,
    bodyById: bodyById,
    julianNoonUTC: julianNoonUTC,
    inWindow: inWindow,
    isoFromJD: isoFromJD,
    ymdFromJD: ymdFromJD,
    elements: elements,
    helio: helio,
    orbitXY: orbitXY,
    periodDays: periodDays,
    synodicDays: synodicDays,
    pair: pair,
    span: span,
    envelope: envelope,
    delayFromKm: delayFromKm,
    formatKm: formatKm,
    formatAu: formatAu,
    formatDelay: formatDelay,
    formatMinutes: formatMinutes,
    meaning: meaning,
    rhoNote: rhoNote,
    auLight: auLight,
    isEarthMoon: isEarthMoon
  };
});
