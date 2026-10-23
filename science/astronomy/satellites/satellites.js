/*! Earth-satellite orbits. Circular unless an ellipse is set.
    μ and the sidereal day are the NASA Earth Fact Sheet.
    The radius in the horizon and the altitude is the sheet’s equatorial radius.
    Lengths are kilometers. Speeds are km/s.
    Point-mass, two-body, no drag, no oblateness. Not a mission. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Satellites = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* NASA NSSDCA Earth Fact Sheet. GM 0.39860 × 10^6 km^3/s^2.
     Equatorial radius 6,378.137 km. Sidereal rotation 23.9345 h.
     Length of day 24.0000 h. Same GM and sidereal day as the Hohmann
     around-Earth case. That desk subtracts the volumetric radius.
     This desk subtracts the equatorial radius, which is the 35,786 km figure. */
  var EARTH_GM = 0.39860 * 1e6;
  var EQUATORIAL_RADIUS_KM = 6378.137;
  var SIDEREAL_HOURS = 23.9345;
  var SOLAR_DAY_HOURS = 24.0000;

  /* NIST CODATA defined speed of light. Same c as the cosmology desk. */
  var C_KM_S = 299792.458;

  /* Slider floor and ceiling. 160 km is the low end of the control, not a
     cited boundary. 410,000 km reaches the Moon Fact Sheet apogee as an
     altitude above the equatorial radius (405,500 − 6,378.137 km). */
  var ALT_MIN_KM = 160;
  var ALT_MAX_KM = 410000;

  /* IS-GPS-200N: AREF = 26,559,710 m. The nominal semi-major axis when ΔA = 0.
     gps.gov’s “about 20,200 km” is the altitude, not this radius. */
  var GPS_RADIUS_KM = 26559.710;

  /* Moon Fact Sheet, center to center. Same figures as the vis-viva desk. */
  var MOON_PERIGEE_KM = 0.3633 * 1e6;
  var MOON_APOGEE_KM = 0.4055 * 1e6;
  var MOON_A_KM = 0.3844 * 1e6;
  var MOON_E = 0.0549;
  var MOON_PERIOD_DAYS = 27.3217;
  var MOON_SHEET_VP = 1.082;
  var MOON_SHEET_VA = 0.970;

  var PRESETS = [
    {
      id: "iss",
      label: "ISS",
      kind: "circular",
      altitudeKm: 420
    },
    {
      id: "hubble",
      label: "Hubble",
      kind: "circular",
      altitudeKm: 483
    },
    {
      id: "starlink",
      label: "Starlink",
      kind: "circular",
      altitudeKm: 550
    },
    {
      id: "gps",
      label: "GPS",
      kind: "circular",
      radiusKm: GPS_RADIUS_KM
    },
    {
      id: "geo",
      label: "Geostationary",
      kind: "geostationary"
    },
    {
      id: "moon",
      label: "Moon",
      kind: "ellipse",
      perigeeRadiusKm: MOON_PERIGEE_KM,
      apogeeRadiusKm: MOON_APOGEE_KM,
      sheetSemimajorKm: MOON_A_KM,
      sheetE: MOON_E,
      sheetPeriodDays: MOON_PERIOD_DAYS,
      sheetVp: MOON_SHEET_VP,
      sheetVa: MOON_SHEET_VA
    }
  ];

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function siderealSeconds() {
    return SIDEREAL_HOURS * 3600;
  }

  function solarDaySeconds() {
    return SOLAR_DAY_HOURS * 3600;
  }

  function periodSeconds(mu, a) {
    if (!(mu > 0) || !(a > 0)) return NaN;
    return 2 * Math.PI * Math.sqrt((a * a * a) / mu);
  }

  function radiusForPeriod(mu, seconds) {
    if (!(mu > 0) || !(seconds > 0)) return NaN;
    return Math.cbrt(mu * seconds * seconds / (4 * Math.PI * Math.PI));
  }

  function circularSpeed(mu, r) {
    if (!(mu > 0) || !(r > 0)) return NaN;
    return Math.sqrt(mu / r);
  }

  function visViva(mu, r, a) {
    if (!(mu > 0) || !(r > 0) || !(a > 0)) return NaN;
    var arg = 2 / r - 1 / a;
    if (!(arg > 0)) return NaN;
    return Math.sqrt(mu * arg);
  }

  function geoRadiusKm() {
    return radiusForPeriod(EARTH_GM, siderealSeconds());
  }

  function geoAltitudeKm() {
    return geoRadiusKm() - EQUATORIAL_RADIUS_KM;
  }

  function solarDayRadiusKm() {
    return radiusForPeriod(EARTH_GM, solarDaySeconds());
  }

  function solarDayAltitudeKm() {
    return solarDayRadiusKm() - EQUATORIAL_RADIUS_KM;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function altitudeOk(km) {
    return typeof km === "number" && isFinite(km) && km >= ALT_MIN_KM && km <= ALT_MAX_KM;
  }

  function unitFromAlt(km) {
    if (!(km > 0)) return NaN;
    var lo = Math.log(ALT_MIN_KM);
    var hi = Math.log(ALT_MAX_KM);
    return (Math.log(km) - lo) / (hi - lo);
  }

  function altFromUnit(u) {
    if (!isFinite(u)) return NaN;
    var t = clamp(u, 0, 1);
    var lo = Math.log(ALT_MIN_KM);
    var hi = Math.log(ALT_MAX_KM);
    return Math.exp(lo + t * (hi - lo));
  }

  function horizonAt(r) {
    if (!(r > EQUATORIAL_RADIUS_KM)) return null;
    var ratio = EQUATORIAL_RADIUS_KM / r;
    if (ratio > 1) ratio = 1;
    var alpha = Math.acos(ratio);
    return {
      radiusKm: r,
      altitudeKm: r - EQUATORIAL_RADIUS_KM,
      surfaceFraction: (1 - ratio) / 2,
      centralAngleRad: alpha,
      slantKm: Math.sqrt(r * r - EQUATORIAL_RADIUS_KM * EQUATORIAL_RADIUS_KM),
      arcKm: EQUATORIAL_RADIUS_KM * alpha
    };
  }

  function lightTime(altitudeKm) {
    if (!(altitudeKm >= 0)) return null;
    var one = altitudeKm / C_KM_S;
    return { oneWayS: one, roundTripS: 2 * one };
  }

  function evaluate(o) {
    var rp;
    var ra;
    if (!o) return null;
    if (o.perigeeRadiusKm != null || o.apogeeRadiusKm != null) {
      rp = o.perigeeRadiusKm;
      ra = o.apogeeRadiusKm;
    } else if (o.perigeeAltitudeKm != null || o.apogeeAltitudeKm != null) {
      if (!altitudeOk(o.perigeeAltitudeKm) || !altitudeOk(o.apogeeAltitudeKm)) return null;
      rp = EQUATORIAL_RADIUS_KM + o.perigeeAltitudeKm;
      ra = EQUATORIAL_RADIUS_KM + o.apogeeAltitudeKm;
    } else if (o.radiusKm != null) {
      rp = o.radiusKm;
      ra = o.radiusKm;
    } else if (o.altitudeKm != null) {
      if (!altitudeOk(o.altitudeKm)) return null;
      rp = EQUATORIAL_RADIUS_KM + o.altitudeKm;
      ra = rp;
    } else return null;

    if (!(rp > EQUATORIAL_RADIUS_KM) || !(ra >= rp)) return null;
    var hp = rp - EQUATORIAL_RADIUS_KM;
    var ha = ra - EQUATORIAL_RADIUS_KM;
    if (!altitudeOk(hp) || !altitudeOk(ha)) return null;

    var a = (rp + ra) / 2;
    var e = (ra - rp) / (ra + rp);
    var circular = ra - rp <= 1e-6;
    var T = periodSeconds(EARTH_GM, a);
    var sid = siderealSeconds();
    var solar = solarDaySeconds();
    var turns = T / sid;
    var turnDeg = turns * 360;
    var shift = turnDeg % 360;
    if (shift < 0) shift += 360;
    if (Math.abs(shift) < 1e-8 || Math.abs(shift - 360) < 1e-8) shift = 0;

    var periH = horizonAt(rp);
    var apoH = horizonAt(ra);
    var periL = lightTime(hp);
    var apoL = lightTime(ha);
    var vp = circular ? circularSpeed(EARTH_GM, rp) : visViva(EARTH_GM, rp, a);
    var va = circular ? vp : visViva(EARTH_GM, ra, a);
    if (!periH || !apoH || !periL || !apoL || !isFinite(vp) || !isFinite(va)) return null;

    var geoAlt = geoAltitudeKm();
    var geostationary = circular && Math.abs(hp - geoAlt) < 0.05;

    return {
      circular: circular,
      geostationary: geostationary,
      altitudeKm: circular ? hp : null,
      perigeeRadiusKm: rp,
      apogeeRadiusKm: ra,
      perigeeAltitudeKm: hp,
      apogeeAltitudeKm: ha,
      semimajorKm: a,
      eccentricity: circular ? 0 : e,
      periodSeconds: T,
      perigeeSpeedKmS: vp,
      apogeeSpeedKmS: va,
      orbitsPerSolarDay: solar / T,
      orbitsPerSiderealDay: sid / T,
      earthTurns: turns,
      earthTurnDeg: turnDeg,
      westwardShiftDeg: shift,
      westwardKm: EQUATORIAL_RADIUS_KM * (shift * Math.PI / 180),
      perigee: {
        horizon: periH,
        light: periL,
        speedKmS: vp
      },
      apogee: {
        horizon: apoH,
        light: apoL,
        speedKmS: va
      }
    };
  }

  function presetModel(id) {
    var p = presetById(id);
    if (!p) return null;
    if (p.kind === "geostationary") return evaluate({ altitudeKm: geoAltitudeKm() });
    if (p.kind === "ellipse") {
      return evaluate({
        perigeeRadiusKm: p.perigeeRadiusKm,
        apogeeRadiusKm: p.apogeeRadiusKm
      });
    }
    if (p.radiusKm != null) return evaluate({ radiusKm: p.radiusKm });
    return evaluate({ altitudeKm: p.altitudeKm });
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var out = parts[0];
    if (digits > 0) out += "." + parts[1];
    return (neg ? "−" : "") + out;
  }

  function fmtSpeed(v) {
    if (!isFinite(v)) return "—";
    return group(v, 3) + " km/s";
  }

  function fmtAlt(km) {
    if (!isFinite(km)) return "—";
    var digits = km >= 1000 ? 2 : (Math.abs(km - Math.round(km)) < 0.005 ? 0 : 2);
    return group(km, digits) + " km";
  }

  function fmtHorizon(km) {
    if (!isFinite(km)) return "—";
    return group(km, km >= 10000 ? 0 : 1) + " km";
  }

  function fmtPeriod(seconds) {
    var h, m;
    if (!(seconds > 0) || !isFinite(seconds)) return "—";
    if (seconds < 2 * 3600) return group(seconds / 60, 2) + " min";
    if (seconds < 2 * 86400) {
      h = Math.floor(seconds / 3600);
      m = (seconds - h * 3600) / 60;
      return h + " h " + group(m, 2) + " min";
    }
    return group(seconds / 86400, 3) + " days";
  }

  function fmtDeg(deg) {
    if (!isFinite(deg)) return "—";
    return group(deg, 2) + "°";
  }

  function fmtPercent(fraction) {
    if (!isFinite(fraction)) return "—";
    return group(fraction * 100, 2) + "%";
  }

  function fmtDelay(seconds) {
    if (!(seconds >= 0) || !isFinite(seconds)) return "—";
    if (seconds < 0.01) return group(seconds * 1000, 3) + " ms";
    if (seconds < 1) return group(seconds * 1000, 1) + " ms";
    return group(seconds, 3) + " s";
  }

  function fmtOrbits(n) {
    if (!isFinite(n)) return "—";
    return group(n, 3);
  }

  return {
    FACT: {
      earthGm: EARTH_GM,
      equatorialRadiusKm: EQUATORIAL_RADIUS_KM,
      siderealHours: SIDEREAL_HOURS,
      solarDayHours: SOLAR_DAY_HOURS,
      cKmS: C_KM_S
    },
    ALT_MIN_KM: ALT_MIN_KM,
    ALT_MAX_KM: ALT_MAX_KM,
    GPS_RADIUS_KM: GPS_RADIUS_KM,
    MOON_PERIGEE_KM: MOON_PERIGEE_KM,
    MOON_APOGEE_KM: MOON_APOGEE_KM,
    MOON_A_KM: MOON_A_KM,
    MOON_E: MOON_E,
    MOON_PERIOD_DAYS: MOON_PERIOD_DAYS,
    MOON_SHEET_VP: MOON_SHEET_VP,
    MOON_SHEET_VA: MOON_SHEET_VA,
    PRESETS: PRESETS,
    presetById: presetById,
    presetModel: presetModel,
    siderealSeconds: siderealSeconds,
    solarDaySeconds: solarDaySeconds,
    periodSeconds: periodSeconds,
    radiusForPeriod: radiusForPeriod,
    circularSpeed: circularSpeed,
    visViva: visViva,
    geoRadiusKm: geoRadiusKm,
    geoAltitudeKm: geoAltitudeKm,
    solarDayRadiusKm: solarDayRadiusKm,
    solarDayAltitudeKm: solarDayAltitudeKm,
    unitFromAlt: unitFromAlt,
    altFromUnit: altFromUnit,
    horizonAt: horizonAt,
    lightTime: lightTime,
    evaluate: evaluate,
    altitudeOk: altitudeOk,
    group: group,
    fmtSpeed: fmtSpeed,
    fmtAlt: fmtAlt,
    fmtHorizon: fmtHorizon,
    fmtPeriod: fmtPeriod,
    fmtDeg: fmtDeg,
    fmtPercent: fmtPercent,
    fmtDelay: fmtDelay,
    fmtOrbits: fmtOrbits
  };
});
