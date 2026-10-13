/*! Oberth effect: an impulsive Δv changes specific energy by v·Δv + ½(Δv)².
    Lengths are kilometers. mu is km^3/s^2. Speeds are km/s.
    Earth GM and volumetric mean radius: Earth Fact Sheet.
    Earth sidereal rotation period: Earth Fact Sheet, 23.9345 h.
    Sun GM: Sun Fact Sheet, 132,712 × 10^6 km^3/s^2.
    Earth and Mars semimajor axes: those bodies' orbital-parameter tables.
    Classroom schematic. Point-mass, two-body, impulsive burn. Not a mission. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Oberth = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var FACT = {
    sunGm: 132712 * 1e6,
    earthGm: 0.39860 * 1e6,
    earthRadiusKm: 6371,
    earthSiderealHours: 23.9345,
    sunRadiusKm: 695700,
    earthAKm: 149.598 * 1e6,
    marsAKm: 227.956 * 1e6,
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

  function specificEnergy(mu, r, v) {
    if (!(mu > 0) || !(r > 0) || !isFinite(v)) return NaN;
    return (v * v) / 2 - mu / r;
  }

  function deltaEnergy(v, dv) {
    if (!isFinite(v) || !isFinite(dv)) return NaN;
    return v * dv + 0.5 * dv * dv;
  }

  function dvToEscape(vc) {
    if (!(vc > 0)) return NaN;
    return vc * (Math.SQRT2 - 1);
  }

  function semiMajor(mu, eps) {
    if (!(mu > 0) || !(eps < 0)) return NaN;
    return -mu / (2 * eps);
  }

  function geoRadiusKm(mu, hours) {
    if (!(mu > 0) || !(hours > 0)) return NaN;
    var T = hours * 3600;
    return Math.cbrt(mu * T * T / (4 * Math.PI * Math.PI));
  }

  function conicPoint(rp, e, theta) {
    if (!(rp > 0) || !(e >= 0) || !isFinite(theta)) return null;
    var p = rp * (1 + e);
    var c = Math.cos(theta);
    var denom = 1 + e * c;
    if (!(denom > 1e-8)) return null;
    var r = p / denom;
    return { x: r * c, y: r * Math.sin(theta), r: r };
  }

  function thetaLimit(e) {
    if (!(e >= 0)) return 0;
    if (e < 1 - 1e-9) return Math.PI;
    if (e <= 1 + 1e-8) return Math.PI * 0.97;
    var c = Math.max(-1, Math.min(1, -1 / e));
    return Math.acos(c) * 0.985;
  }

  function burn(mu, r, dv) {
    if (!(mu > 0) || !(r > 0) || !isFinite(dv)) return null;
    var vc = circular(mu, r);
    var vesc = escapeSpeed(mu, r);
    var dvEsc = dvToEscape(vc);
    var vAfter = vc + dv;
    var epsBefore = specificEnergy(mu, r, vc);
    var epsAfter = specificEnergy(mu, r, vAfter);
    var dEps = deltaEnergy(vc, dv);
    var cross = vc * dv;
    var quad = 0.5 * dv * dv;
    var e = (r * vAfter * vAfter) / mu - 1;
    if (Math.abs(dv) < 1e-12) e = 0;
    if (e < 0 && e > -1e-10) e = 0;
    var bound = epsAfter < 0 && e < 1;
    var parabolic = !bound && epsAfter <= 1e-8;
    var out = {
      mu: mu,
      r: r,
      dv: dv,
      vc: vc,
      vesc: vesc,
      dvEsc: dvEsc,
      vBefore: vc,
      vAfter: vAfter,
      epsBefore: epsBefore,
      epsAfter: epsAfter,
      deltaEps: dEps,
      cross: cross,
      quad: quad,
      e: e,
      rp: r,
      bound: bound,
      parabolic: parabolic,
      escape: !bound
    };
    if (bound) {
      var a = e === 0 ? r : semiMajor(mu, epsAfter);
      out.a = a;
      out.ra = e === 0 ? r : 2 * a - r;
      out.vInf = 0;
    } else {
      out.a = NaN;
      out.ra = Infinity;
      out.vInf = Math.sqrt(Math.max(0, 2 * epsAfter));
      if (parabolic) out.e = 1;
    }
    return out;
  }

  function compare(mu, rLow, rHigh, dv) {
    if (!(rHigh > rLow)) return null;
    var low = burn(mu, rLow, dv);
    var high = burn(mu, rHigh, dv);
    if (!low || !high) return null;
    return {
      mu: mu,
      rLow: rLow,
      rHigh: rHigh,
      dv: dv,
      low: low,
      high: high,
      lowGainsMore: low.deltaEps > high.deltaEps + 1e-9,
      excessThreshold: (low.vc + high.vc) / 2
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

  function fmtEnergy(eps) {
    if (!isFinite(eps)) return "—";
    return group(eps, 3) + " km²/s²";
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

  function outcome(b) {
    if (!b) return "—";
    if (b.parabolic) return "Escape · parabolic";
    if (!b.bound) return "Escape · v∞ " + fmtSpeed(b.vInf);
    if (b.e === 0) return "Still circular · a = " + fmtDist(b.a);
    return "Bound · a = " + fmtDist(b.a);
  }

  function apsisText(b) {
    if (!b) return "—";
    if (b.parabolic) return "v∞ = 0";
    if (!b.bound) return "v∞ " + fmtSpeed(b.vInf);
    return "r_a " + fmtDist(b.ra);
  }

  return {
    FACT: FACT,
    circular: circular,
    escapeSpeed: escapeSpeed,
    specificEnergy: specificEnergy,
    deltaEnergy: deltaEnergy,
    dvToEscape: dvToEscape,
    semiMajor: semiMajor,
    geoRadiusKm: geoRadiusKm,
    conicPoint: conicPoint,
    thetaLimit: thetaLimit,
    burn: burn,
    compare: compare,
    roundTo: roundTo,
    group: group,
    fmtSpeed: fmtSpeed,
    fmtEnergy: fmtEnergy,
    fmtDist: fmtDist,
    outcome: outcome,
    apsisText: apsisText
  };
});
