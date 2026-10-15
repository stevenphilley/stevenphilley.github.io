/*! Characteristic energy: C3 = v∞² = 2ε for a hyperbolic departure.
    Specific energy ε = v²/2 − μ/r. At periapsis radius r,
    circular speed is √(μ/r), escape speed is √(2μ/r), and
    the impulsive prograde burn from that circle is
    Δv = √(C3 + 2μ/r) − √(μ/r).
    Lengths are kilometers. mu is km^3/s^2. Speeds are km/s.
    C3 is km^2/s^2.
    Earth GM and volumetric mean radius: Earth Fact Sheet.
    Earth sidereal rotation period: Earth Fact Sheet, 23.9345 h.
    The 400 km altitude is a classroom example. The sheet does not print it.
    g0 = 9.80665 m/s² is the rocket desk's standard gravity, not 9.820.
    300 s and 450 s are that desk's classroom examples.
    Point-mass, impulsive, no atmosphere. Not a mission. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.C3Desk = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var G0_MPS2 = 9.80665;
  var G0_KMS2 = 9.80665e-3;
  var CLASSROOM_ALT_KM = 400;
  var MILD_VINF = 3;
  var MILD_C3 = 9;

  var FACT = {
    earthGm: 0.39860 * 1e6,
    earthRadiusKm: 6371,
    earthSiderealHours: 23.9345,
    surfaceEscapeKmS: 11.186
  };

  function circular(mu, r) {
    if (!(mu > 0) || !(r > 0)) return NaN;
    return Math.sqrt(mu / r);
  }

  function escapeSpeed(mu, r) {
    if (!(mu > 0) || !(r > 0)) return NaN;
    return Math.sqrt(2 * mu / r);
  }

  function geoRadiusKm(mu, hours) {
    if (!(mu > 0) || !(hours > 0)) return NaN;
    var T = hours * 3600;
    return Math.cbrt(mu * T * T / (4 * Math.PI * Math.PI));
  }

  function c3FromVinf(vInf) {
    if (!isFinite(vInf) || vInf < 0) return NaN;
    return vInf * vInf;
  }

  function vinfFromC3(c3) {
    if (!isFinite(c3) || c3 < 0) return NaN;
    return Math.sqrt(c3);
  }

  function specificEnergy(c3) {
    if (!isFinite(c3)) return NaN;
    return c3 / 2;
  }

  function parkingEnergy(mu, r) {
    if (!(mu > 0) || !(r > 0)) return NaN;
    return -mu / (2 * r);
  }

  function periapsisSpeed(mu, r, vInf) {
    if (!(mu > 0) || !(r > 0) || !isFinite(vInf) || vInf < 0) return NaN;
    return Math.sqrt(vInf * vInf + 2 * mu / r);
  }

  function departureDv(mu, r, vInf) {
    var vp = periapsisSpeed(mu, r, vInf);
    var vc = circular(mu, r);
    if (!isFinite(vp) || !isFinite(vc)) return NaN;
    return vp - vc;
  }

  function eccentricity(mu, r, c3) {
    if (!(mu > 0) || !(r > 0) || !isFinite(c3) || c3 < 0) return NaN;
    if (c3 === 0) return 1;
    return 1 + (r * c3) / mu;
  }

  function conicPoint(rp, e, theta) {
    if (!(rp > 0) || !(e >= 1) || !isFinite(theta)) return null;
    var denom = 1 + e * Math.cos(theta);
    if (!(denom > 1e-8)) return null;
    var rad = rp * (1 + e) / denom;
    if (!isFinite(rad) || rad <= 0) return null;
    return {
      x: rad * Math.cos(theta),
      y: rad * Math.sin(theta),
      r: rad,
      theta: theta
    };
  }

  function hyperbolaGeometry(rp, e) {
    if (!(rp > 0) || !(e > 1)) return null;
    var a = rp / (e - 1);
    var b = a * Math.sqrt(e * e - 1);
    var centerX = a * e;
    var thetaInf = Math.acos(Math.max(-1, Math.min(1, -1 / e)));
    return {
      a: a,
      b: b,
      centerX: centerX,
      thetaInf: thetaInf,
      slope: b / a
    };
  }

  /* Upper outgoing asymptote of the polar branch whose periapsis is at +rp.
     The center sits at x = a e. The branch is the left-hand one, so the
     upper asymptote is y = −(b/a) (x − centerX). */
  function asymptoteResidual(rp, e, theta) {
    var g = hyperbolaGeometry(rp, e);
    var p = conicPoint(rp, e, theta);
    if (!g || !p) return NaN;
    var line = p.y + g.slope * (p.x - g.centerX);
    var norm = Math.sqrt(1 + g.slope * g.slope);
    return Math.abs(line) / norm;
  }

  function departureLimit(e) {
    if (!(e >= 1)) return 0;
    if (e <= 1 + 1e-8) return 2.4;
    return Math.acos(Math.max(-1, Math.min(1, -1 / e))) * 0.97;
  }

  function idealStage(dv, isp) {
    if (!isFinite(dv) || dv < 0 || !(isp > 0) || !isFinite(isp)) return null;
    var ve = isp * G0_KMS2;
    var exponent = dv / ve;
    var overflow = exponent > 80;
    var ratio = overflow ? Infinity : Math.exp(exponent);
    var remaining = overflow ? 0 : Math.exp(-exponent);
    var propellant = overflow ? 1 : 1 - remaining;
    return {
      dv: dv,
      isp: isp,
      ve: ve,
      exponent: exponent,
      ratio: ratio,
      remaining: remaining,
      propellant: propellant,
      overflow: overflow
    };
  }

  function evaluate(o) {
    if (!o) return null;
    var mu = o.mu == null ? FACT.earthGm : o.mu;
    var radius = o.radiusKm == null ? FACT.earthRadiusKm : o.radiusKm;
    var alt = o.altKm;
    var c3 = o.c3;
    if (c3 == null && o.vInf != null) c3 = c3FromVinf(o.vInf);
    if (!(mu > 0) || !(radius > 0)) return null;
    if (!isFinite(alt) || alt < -1e-9) return null;
    if (alt < 0) alt = 0;
    if (!isFinite(c3) || c3 < -1e-12) return null;
    if (c3 < 0) c3 = 0;
    var r = radius + alt;
    var vInf = Math.sqrt(c3);
    var vc = circular(mu, r);
    var vesc = escapeSpeed(mu, r);
    var vp = periapsisSpeed(mu, r, vInf);
    var dv = vp - vc;
    var e = eccentricity(mu, r, c3);
    var eps = specificEnergy(c3);
    var park = parkingEnergy(mu, r);
    return {
      mu: mu,
      radiusKm: radius,
      altKm: alt,
      r: r,
      c3: c3,
      vInf: vInf,
      vc: vc,
      vesc: vesc,
      vp: vp,
      dv: dv,
      e: e,
      eps: eps,
      parkingEps: park,
      onFloor: alt <= 1e-6,
      parabolic: c3 <= 1e-12,
      stage450: idealStage(dv, 450),
      stage300: idealStage(dv, 300)
    };
  }

  function atAltitude(altKm, c3) {
    return evaluate({ altKm: altKm, c3: c3 });
  }

  function classroomPair(c3) {
    var low = atAltitude(CLASSROOM_ALT_KM, c3);
    var highAlt = geoRadiusKm(FACT.earthGm, FACT.earthSiderealHours) - FACT.earthRadiusKm;
    var high = atAltitude(highAlt, c3);
    if (!low || !high) return null;
    return { c3: c3, low: low, high: high, highAltKm: highAlt };
  }

  function presets() {
    var highAlt = geoRadiusKm(FACT.earthGm, FACT.earthSiderealHours) - FACT.earthRadiusKm;
    return [
      {
        id: "barely",
        altKm: CLASSROOM_ALT_KM,
        c3: 0,
        label: "C3 = 0 · 400 km"
      },
      {
        id: "mild",
        altKm: CLASSROOM_ALT_KM,
        c3: MILD_C3,
        label: "v∞ = 3 km/s · 400 km"
      },
      {
        id: "higher",
        altKm: highAlt,
        c3: MILD_C3,
        label: "Same C3 · higher circle"
      }
    ];
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

  function fmtEnergy(eps) {
    if (!isFinite(eps)) return "—";
    return group(eps, 3) + " km²/s²";
  }

  function fmtC3(c3) {
    return fmtEnergy(c3);
  }

  function fmtE(e) {
    if (!isFinite(e)) return "—";
    return group(e, 4);
  }

  function fmtDist(km) {
    if (!isFinite(km)) return "—";
    if (Math.abs(km) >= 1e6) {
      var m = km / 1e6;
      var digits = Math.abs(m) >= 100 ? 3 : 4;
      return group(m, digits) + " × 10⁶ km";
    }
    var digits = Math.abs(km - Math.round(km)) < 5e-4 ? 0 : 3;
    return group(km, digits) + " km";
  }

  function fmtAlt(km) {
    if (!isFinite(km)) return "—";
    if (Math.abs(km - Math.round(km)) < 5e-4) return group(Math.round(km), 0) + " km";
    if (Math.abs(km) >= 10000) return group(km, 3) + " km";
    return group(km, 3) + " km";
  }

  function fmtFrac(f) {
    if (!isFinite(f)) return "—";
    return group(f, 4);
  }

  function fmtRatio(r) {
    if (!isFinite(r) || !(r > 0)) return "—";
    if (r >= 1e6) {
      var exp = Math.floor(Math.log10(r));
      var mant = r / Math.pow(10, exp);
      return group(mant, 3) + " × 10^" + exp;
    }
    if (r < 10) return group(r, 3);
    if (r < 100) return group(r, 2);
    if (r < 1000) return group(r, 1);
    return group(r, 0);
  }

  return {
    G0_MPS2: G0_MPS2,
    G0_KMS2: G0_KMS2,
    CLASSROOM_ALT_KM: CLASSROOM_ALT_KM,
    MILD_VINF: MILD_VINF,
    MILD_C3: MILD_C3,
    FACT: FACT,
    circular: circular,
    escapeSpeed: escapeSpeed,
    geoRadiusKm: geoRadiusKm,
    c3FromVinf: c3FromVinf,
    vinfFromC3: vinfFromC3,
    specificEnergy: specificEnergy,
    parkingEnergy: parkingEnergy,
    periapsisSpeed: periapsisSpeed,
    departureDv: departureDv,
    eccentricity: eccentricity,
    conicPoint: conicPoint,
    hyperbolaGeometry: hyperbolaGeometry,
    asymptoteResidual: asymptoteResidual,
    departureLimit: departureLimit,
    idealStage: idealStage,
    evaluate: evaluate,
    atAltitude: atAltitude,
    classroomPair: classroomPair,
    presets: presets,
    roundTo: roundTo,
    group: group,
    fmtSpeed: fmtSpeed,
    fmtEnergy: fmtEnergy,
    fmtC3: fmtC3,
    fmtE: fmtE,
    fmtDist: fmtDist,
    fmtAlt: fmtAlt,
    fmtFrac: fmtFrac,
    fmtRatio: fmtRatio
  };
});
