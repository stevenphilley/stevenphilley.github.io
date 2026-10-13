/*! Vis-viva: v = sqrt(mu * (2/r - 1/a)).
    Lengths are kilometers. mu is km^3/s^2. Speeds are km/s.
    Sun GM: Sun Fact Sheet, 132,712 × 10^6 km^3/s^2.
    Earth GM: Earth Fact Sheet, 0.39860 × 10^6 km^3/s^2.
    Earth volumetric mean radius: 6,371.000 km.
    Orbital a, e, perihelion, and aphelion: the orbital-parameter tables.
    Classroom schematic. Point-mass, two-body. Not an ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VisViva = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var FACT = {
    sunGm: 132712 * 1e6,
    earthGm: 0.39860 * 1e6,
    earthRadiusKm: 6371,
    sunRadiusKm: 695700
  };

  var PRESETS = [
    {
      id: "earth-sun",
      label: "Earth around Sun",
      central: "Sun",
      craft: "Earth",
      mu: FACT.sunGm,
      muText: "132,712 × 10⁶ km³/s²",
      bodyRadiusKm: FACT.sunRadiusKm,
      aKm: 149.598 * 1e6,
      e: 0.0167,
      sheetRpKm: 147.095 * 1e6,
      sheetRaKm: 152.100 * 1e6,
      sheetVp: 30.29,
      sheetVa: 29.29,
      sheetVmean: 29.78,
      sheetPeriodDays: 365.256,
      aMinKm: 50 * 1e6,
      aMaxKm: 400 * 1e6,
      schematic: false
    },
    {
      id: "moon-earth",
      label: "Moon around Earth",
      central: "Earth",
      craft: "Moon",
      mu: FACT.earthGm,
      muText: "0.39860 × 10⁶ km³/s²",
      bodyRadiusKm: FACT.earthRadiusKm,
      aKm: 0.3844 * 1e6,
      e: 0.0549,
      sheetRpKm: 0.3633 * 1e6,
      sheetRaKm: 0.4055 * 1e6,
      sheetVp: 1.082,
      sheetVa: 0.970,
      sheetVmean: 1.022,
      sheetPeriodDays: 27.3217,
      aMinKm: 0.2 * 1e6,
      aMaxKm: 0.6 * 1e6,
      schematic: false
    },
    {
      id: "mars-sun",
      label: "Mars around Sun",
      central: "Sun",
      craft: "Mars",
      mu: FACT.sunGm,
      muText: "132,712 × 10⁶ km³/s²",
      bodyRadiusKm: FACT.sunRadiusKm,
      aKm: 227.956 * 1e6,
      e: 0.0935,
      sheetRpKm: 206.650 * 1e6,
      sheetRaKm: 249.261 * 1e6,
      sheetVp: 26.50,
      sheetVa: 21.97,
      sheetVmean: 24.08,
      sheetPeriodDays: 686.980,
      aMinKm: 100 * 1e6,
      aMaxKm: 500 * 1e6,
      schematic: false
    },
    {
      id: "leo",
      label: "400 km LEO",
      central: "Earth",
      craft: "Classroom orbit",
      mu: FACT.earthGm,
      muText: "0.39860 × 10⁶ km³/s²",
      bodyRadiusKm: FACT.earthRadiusKm,
      aKm: 6371 + 400,
      e: 0,
      sheetRpKm: null,
      sheetRaKm: null,
      sheetVp: null,
      sheetVa: null,
      sheetVmean: null,
      sheetPeriodDays: null,
      aMinKm: 6500,
      aMaxKm: 50000,
      altitudeKm: 400,
      schematic: false
    },
    {
      id: "schematic",
      label: "Schematic e = 0.5",
      central: "Earth",
      craft: "Schematic",
      mu: FACT.earthGm,
      muText: "0.39860 × 10⁶ km³/s²",
      bodyRadiusKm: FACT.earthRadiusKm,
      aKm: 20000,
      e: 0.5,
      sheetRpKm: null,
      sheetRaKm: null,
      sheetVp: null,
      sheetVa: null,
      sheetVmean: null,
      sheetPeriodDays: null,
      aMinKm: 8000,
      aMaxKm: 80000,
      schematic: true
    }
  ];

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function speed(mu, r, a) {
    if (!(mu > 0) || !(r > 0) || !(a > 0)) return NaN;
    var arg = 2 / r - 1 / a;
    if (!(arg > 0)) return NaN;
    return Math.sqrt(mu * arg);
  }

  function circular(mu, r) {
    if (!(mu > 0) || !(r > 0)) return NaN;
    return Math.sqrt(mu / r);
  }

  function escapeSpeed(mu, r) {
    if (!(mu > 0) || !(r > 0)) return NaN;
    return Math.sqrt(2 * mu / r);
  }

  function periodSeconds(mu, a) {
    if (!(mu > 0) || !(a > 0)) return NaN;
    return 2 * Math.PI * Math.sqrt((a * a * a) / mu);
  }

  function apsides(a, e) {
    return { rp: a * (1 - e), ra: a * (1 + e) };
  }

  function fromApsides(rp, ra) {
    if (!(rp > 0) || !(ra > rp)) return null;
    return { a: (rp + ra) / 2, e: (ra - rp) / (ra + rp), rp: rp, ra: ra };
  }

  function eccentricityToReach(a, rp, ra) {
    if (!(a > 0)) return 0;
    var e = 0;
    if (rp > 0 && rp < a) e = Math.max(e, 1 - rp / a);
    if (ra > a) e = Math.max(e, ra / a - 1);
    return e;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function place(a, e, r) {
    if (!(a > 0) || !(r > 0)) return null;
    if (!(e > 1e-8)) {
      return { theta: 0, x: r, y: 0, tx: 0, ty: 1 };
    }
    var p = a * (1 - e * e);
    var cosT = (p / r - 1) / e;
    if (cosT > 1) cosT = 1;
    if (cosT < -1) cosT = -1;
    var theta = Math.acos(cosT);
    var sinT = Math.sin(theta);
    var x = r * Math.cos(theta);
    var y = r * sinT;
    var den = 1 + e * cosT;
    var dr = den !== 0 ? (r * e * sinT) / den : 0;
    var dx = dr * cosT - r * sinT;
    var dy = dr * sinT + r * cosT;
    var len = Math.hypot(dx, dy) || 1;
    return { theta: theta, x: x, y: y, tx: dx / len, ty: dy / len };
  }

  function evaluate(o) {
    var mu = o.mu;
    var a = o.a;
    var e = o.e;
    if (!(a > 0) || !(mu > 0)) return null;
    if (!(e >= 0)) e = 0;
    if (e > 0.999) e = 0.999;
    var ap = apsides(a, e);
    var rMin = ap.rp;
    var rMax = ap.ra;
    if (o.rMin != null && o.rMin > 0) rMin = Math.min(rMin, o.rMin);
    if (o.rMax != null && o.rMax > 0) rMax = Math.max(rMax, o.rMax);
    if (!(rMax > rMin)) {
      rMin = a;
      rMax = a;
    }
    var r = o.r;
    if (!(r > 0)) r = a;
    r = clamp(r, rMin, rMax);
    if (e < 1e-12) {
      e = 0;
      r = a;
      rMin = a;
      rMax = a;
    }
    var eDraw = Math.max(e, eccentricityToReach(a, rMin, rMax));
    if (eDraw > 0.999) eDraw = 0.999;
    var same = function (x, y) {
      return Math.abs(x - y) <= Math.max(0.5, Math.abs(y) * 1e-9);
    };
    return {
      mu: mu,
      a: a,
      e: e,
      r: r,
      rp: ap.rp,
      ra: ap.ra,
      rMin: rMin,
      rMax: rMax,
      eDraw: eDraw,
      v: speed(mu, r, a),
      vp: speed(mu, ap.rp, a),
      va: speed(mu, ap.ra, a),
      vc: circular(mu, r),
      vesc: escapeSpeed(mu, r),
      vAtA: circular(mu, a),
      periodSeconds: periodSeconds(mu, a),
      atA: same(r, a),
      atPeri: same(r, ap.rp),
      atApo: same(r, ap.ra),
      circularOrbit: e === 0
    };
  }

  function roundTo(n, digits) {
    var p = Math.pow(10, digits);
    return Math.round(n * p) / p;
  }

  function group(n, digits) {
    if (!isFinite(n)) return "—";
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + parts.join(".");
  }

  function fmtSpeed(v) {
    if (!isFinite(v)) return "—";
    return group(v, 3) + " km/s";
  }

  function fmtDist(km) {
    if (!isFinite(km)) return "—";
    if (Math.abs(km) >= 1e5) {
      var m = km / 1e6;
      var digits = Math.abs(m) >= 100 ? 3 : 4;
      return group(m, digits) + " × 10⁶ km";
    }
    var d = Math.abs(km - Math.round(km)) < 0.05 ? 0 : 1;
    return group(km, d) + " km";
  }

  function fmtE(e) {
    if (!isFinite(e)) return "—";
    var s = e.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    if (s.indexOf(".") < 0) s += ".0";
    return s;
  }

  function fmtPeriod(seconds) {
    if (!isFinite(seconds)) return "—";
    var days = seconds / 86400;
    if (days >= 2) return group(days, 3) + " days";
    var hours = seconds / 3600;
    if (hours >= 2) return group(hours, 2) + " h";
    return group(seconds / 60, 2) + " min";
  }

  function unitFor(km) {
    return km >= 1e5 ? "Mkm" : "km";
  }

  function parseLength(text, unit) {
    if (text == null) return NaN;
    var s = String(text).replace(/,/g, "").replace(/×/g, "").replace(/x/gi, "").trim();
    if (!s) return NaN;
    var n = Number(s);
    if (!isFinite(n) || !(n > 0)) return NaN;
    if (unit === "Mkm") return n * 1e6;
    return n;
  }

  function lengthField(km) {
    if (unitFor(km) === "Mkm") {
      var m = km / 1e6;
      var digits = Math.abs(m) >= 100 ? 3 : 4;
      return { unit: "Mkm", text: group(m, digits), unitLabel: "× 10⁶ km" };
    }
    var d = Math.abs(km - Math.round(km)) < 0.05 ? 0 : 1;
    return { unit: "km", text: group(km, d), unitLabel: "km" };
  }

  return {
    FACT: FACT,
    PRESETS: PRESETS,
    presetById: presetById,
    speed: speed,
    circular: circular,
    escapeSpeed: escapeSpeed,
    periodSeconds: periodSeconds,
    apsides: apsides,
    fromApsides: fromApsides,
    eccentricityToReach: eccentricityToReach,
    place: place,
    evaluate: evaluate,
    roundTo: roundTo,
    group: group,
    fmtSpeed: fmtSpeed,
    fmtDist: fmtDist,
    fmtE: fmtE,
    fmtPeriod: fmtPeriod,
    unitFor: unitFor,
    parseLength: parseLength,
    lengthField: lengthField
  };
});
