/*! Gravity assist: an unpowered hyperbola turns v∞; the planet keeps moving.
    Lengths are kilometers. mu is km^3/s^2. Speeds are km/s.
    Planet GM and volumetric mean radius: the NASA NSSDCA fact sheets,
    the same figures the Escape desk uses.
    Sun GM and semimajor axes: the Sun, Earth, Venus, Mars, and Jupiter sheets,
    the same kilometer lines the Hohmann desk uses.
    V_p is the circular speed at that semimajor axis, not the sheet's mean.
    The 5 km/s excess and the matched periapsis ratio are classroom examples.
    g0 = 9.80665 m/s² is the rocket desk's standard gravity, for a mass
    comparison only. Not a mission. Not patched conics. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GravityAssist = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var G0_MPS2 = 9.80665;
  var G0_KMS2 = 9.80665e-3;
  var CLASSROOM_VINF = 5;
  var CLASSROOM_EARTH_ALT = 400;
  var CLASSROOM_ISP = [300, 450];

  var FACT = {
    sunGm: 132712 * 1e6,
    earthGm: 0.39860 * 1e6,
    venusGm: 0.32486 * 1e6,
    marsGm: 0.042828 * 1e6,
    jupiterGm: 126.687 * 1e6,
    earthRadiusKm: 6371,
    venusRadiusKm: 6051.8,
    marsRadiusKm: 3389.5,
    jupiterRadiusKm: 69911,
    earthEqRadiusKm: 6378.137,
    venusEqRadiusKm: 6051.8,
    marsEqRadiusKm: 3396.2,
    jupiterEqRadiusKm: 71492,
    earthAKm: 149.598 * 1e6,
    venusAKm: 108.210 * 1e6,
    marsAKm: 227.956 * 1e6,
    jupiterAKm: 778.479 * 1e6,
    earthMeanKmS: 29.78,
    venusMeanKmS: 35.02,
    marsMeanKmS: 24.08,
    jupiterMeanKmS: 13.06
  };

  function body(o) {
    o.classroomAltKm = o.radiusKm * CLASSROOM_EARTH_ALT / FACT.earthRadiusKm;
    o.classroomRpKm = o.radiusKm + o.classroomAltKm;
    return o;
  }

  var BODIES = [
    body({
      id: "earth",
      name: "Earth",
      mu: FACT.earthGm,
      muText: "0.39860 × 10⁶ km³/s²",
      radiusKm: FACT.earthRadiusKm,
      radiusText: "6,371.000 km",
      eqRadiusKm: FACT.earthEqRadiusKm,
      eqText: "6,378.137 km",
      aKm: FACT.earthAKm,
      aText: "149.598 × 10⁶ km",
      sheetMeanKmS: FACT.earthMeanKmS,
      gas: false,
      air: true
    }),
    body({
      id: "venus",
      name: "Venus",
      mu: FACT.venusGm,
      muText: "0.32486 × 10⁶ km³/s²",
      radiusKm: FACT.venusRadiusKm,
      radiusText: "6,051.8 km",
      eqRadiusKm: FACT.venusEqRadiusKm,
      eqText: "6,051.8 km",
      aKm: FACT.venusAKm,
      aText: "108.210 × 10⁶ km",
      sheetMeanKmS: FACT.venusMeanKmS,
      gas: false,
      air: true
    }),
    body({
      id: "mars",
      name: "Mars",
      mu: FACT.marsGm,
      muText: "0.042828 × 10⁶ km³/s²",
      radiusKm: FACT.marsRadiusKm,
      radiusText: "3,389.5 km",
      eqRadiusKm: FACT.marsEqRadiusKm,
      eqText: "3,396.2 km",
      aKm: FACT.marsAKm,
      aText: "227.956 × 10⁶ km",
      sheetMeanKmS: FACT.marsMeanKmS,
      gas: false,
      air: true
    }),
    body({
      id: "jupiter",
      name: "Jupiter",
      mu: FACT.jupiterGm,
      muText: "126.687 × 10⁶ km³/s²",
      radiusKm: FACT.jupiterRadiusKm,
      radiusText: "69,911 km",
      eqRadiusKm: FACT.jupiterEqRadiusKm,
      eqText: "71,492 km",
      aKm: FACT.jupiterAKm,
      aText: "778.479 × 10⁶ km",
      sheetMeanKmS: FACT.jupiterMeanKmS,
      gas: true,
      air: false
    })
  ];

  function bodyById(id) {
    var i;
    for (i = 0; i < BODIES.length; i++) if (BODIES[i].id === id) return BODIES[i];
    return null;
  }

  function circular(mu, r) {
    if (!(mu > 0) || !(r > 0)) return NaN;
    return Math.sqrt(mu / r);
  }

  function eccentricity(mu, rp, vInf) {
    if (!(mu > 0) || !(rp > 0) || !(vInf > 0)) return NaN;
    return 1 + (rp * vInf * vInf) / mu;
  }

  function turnAngle(e) {
    if (!(e >= 1)) return NaN;
    var s = 1 / e;
    if (s > 1) s = 1;
    if (s < -1) s = -1;
    return 2 * Math.asin(s);
  }

  function asymptoteAnomaly(e) {
    if (!(e >= 1)) return NaN;
    var c = -1 / e;
    if (c < -1) c = -1;
    if (c > 1) c = 1;
    return Math.acos(c);
  }

  function periapsisSpeed(mu, rp, vInf) {
    if (!(mu > 0) || !(rp > 0) || !(vInf >= 0)) return NaN;
    return Math.sqrt(vInf * vInf + (2 * mu) / rp);
  }

  function semiMajor(mu, vInf) {
    if (!(mu > 0) || !(vInf > 0)) return NaN;
    return mu / (vInf * vInf);
  }

  function assistMagnitude(vInf, e) {
    if (!(vInf >= 0) || !(e >= 1)) return NaN;
    return (2 * vInf) / e;
  }

  function betaFor(pumpUp) {
    return pumpUp ? Math.PI : 0;
  }

  function velocityAdd(vPlanet, vInf, e, pumpUp) {
    if (!(vPlanet >= 0) || !(vInf >= 0) || !(e >= 1)) return null;
    var half = turnAngle(e) / 2;
    var s = Math.sin(half);
    var c = Math.cos(half);
    var sign = pumpUp ? 1 : -1;
    var vInfIn = { x: -sign * vInf * s, y: vInf * c };
    var vInfOut = { x: sign * vInf * s, y: vInf * c };
    var vIn = { x: vPlanet + vInfIn.x, y: vInfIn.y };
    var vOut = { x: vPlanet + vInfOut.x, y: vInfOut.y };
    var dvx = vOut.x - vIn.x;
    var dvy = vOut.y - vIn.y;
    return {
      pumpUp: !!pumpUp,
      vInfIn: vInfIn,
      vInfOut: vInfOut,
      vHelioIn: vIn,
      vHelioOut: vOut,
      speedIn: Math.hypot(vIn.x, vIn.y),
      speedOut: Math.hypot(vOut.x, vOut.y),
      assist: Math.hypot(dvx, dvy),
      deltaX: dvx,
      deltaY: dvy
    };
  }

  function conicPoint(rp, e, theta) {
    if (!(rp > 0) || !(e >= 1) || !isFinite(theta)) return null;
    var c = Math.cos(theta);
    var denom = 1 + e * c;
    if (!(denom > 1e-8)) return null;
    var r = (rp * (1 + e)) / denom;
    return { x: r * c, y: r * Math.sin(theta), r: r };
  }

  function hyperbolaPoint(rp, e, theta, beta) {
    var p = conicPoint(rp, e, theta);
    if (!p) return null;
    var ang = theta + beta;
    return {
      x: p.r * Math.cos(ang),
      y: p.r * Math.sin(ang),
      r: p.r,
      theta: theta
    };
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
    var mu = o.mu;
    var radius = o.radiusKm;
    var vInf = o.vInf;
    var alt = o.altKm;
    var aKm = o.aKm;
    if (!(mu > 0) || !(radius > 0) || !(aKm > 0)) return null;
    if (!(vInf > 0) || !isFinite(vInf)) return null;
    if (!isFinite(alt) || alt < -1e-9) return null;
    if (alt < 0) alt = 0;
    var rp = radius + alt;
    var e = eccentricity(mu, rp, vInf);
    var delta = turnAngle(e);
    var thetaInf = asymptoteAnomaly(e);
    var pumpUp = o.pumpUp !== false;
    var vPlanet = circular(FACT.sunGm, aKm);
    var added = velocityAdd(vPlanet, vInf, e, pumpUp);
    if (!added) return null;
    var epsIn = (added.speedIn * added.speedIn) / 2 - FACT.sunGm / aKm;
    var epsOut = (added.speedOut * added.speedOut) / 2 - FACT.sunGm / aKm;
    var eq = o.eqRadiusKm;
    return {
      mu: mu,
      radiusKm: radius,
      eqRadiusKm: eq,
      aKm: aKm,
      rp: rp,
      altKm: alt,
      ratio: rp / radius,
      vInf: vInf,
      e: e,
      delta: delta,
      thetaInf: thetaInf,
      beta: betaFor(pumpUp),
      pumpUp: pumpUp,
      aHyper: semiMajor(mu, vInf),
      vPeri: periapsisSpeed(mu, rp, vInf),
      vPlanet: vPlanet,
      speedIn: added.speedIn,
      speedOut: added.speedOut,
      assist: added.assist,
      deltaEnergy: epsOut - epsIn,
      epsIn: epsIn,
      epsOut: epsOut,
      vInfIn: added.vInfIn,
      vInfOut: added.vInfOut,
      vHelioIn: added.vHelioIn,
      vHelioOut: added.vHelioOut,
      onFloor: alt <= 1e-6,
      insideEquator: !!(eq > radius && rp < eq - 1e-6),
      stage450: idealStage(added.assist, 450),
      stage300: idealStage(added.assist, 300)
    };
  }

  function classroom(id, pumpUp) {
    var b = bodyById(id);
    if (!b) return null;
    return evaluate({
      mu: b.mu,
      radiusKm: b.radiusKm,
      eqRadiusKm: b.eqRadiusKm,
      aKm: b.aKm,
      vInf: CLASSROOM_VINF,
      altKm: b.classroomAltKm,
      pumpUp: pumpUp !== false
    });
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

  function fmtDeg(rad) {
    if (!isFinite(rad)) return "—";
    return group(rad * 180 / Math.PI, 2) + "°";
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
    if (Math.abs(km) >= 10000) return group(km, 1) + " km";
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
    CLASSROOM_VINF: CLASSROOM_VINF,
    CLASSROOM_EARTH_ALT: CLASSROOM_EARTH_ALT,
    CLASSROOM_ISP: CLASSROOM_ISP,
    FACT: FACT,
    BODIES: BODIES,
    bodyById: bodyById,
    circular: circular,
    eccentricity: eccentricity,
    turnAngle: turnAngle,
    asymptoteAnomaly: asymptoteAnomaly,
    periapsisSpeed: periapsisSpeed,
    semiMajor: semiMajor,
    assistMagnitude: assistMagnitude,
    betaFor: betaFor,
    velocityAdd: velocityAdd,
    conicPoint: conicPoint,
    hyperbolaPoint: hyperbolaPoint,
    idealStage: idealStage,
    evaluate: evaluate,
    classroom: classroom,
    roundTo: roundTo,
    group: group,
    fmtSpeed: fmtSpeed,
    fmtEnergy: fmtEnergy,
    fmtDeg: fmtDeg,
    fmtE: fmtE,
    fmtDist: fmtDist,
    fmtAlt: fmtAlt,
    fmtFrac: fmtFrac,
    fmtRatio: fmtRatio
  };
});
