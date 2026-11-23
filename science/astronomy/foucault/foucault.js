/*! Foucault pendulum desk.
    The swing plane turns at Ω sin φ.
    Ω is one turn per mean sidereal day.
    This page uses 86,164.0905 s (23 h 56 m 4.0905 s).
    JPL’s astrodynamic parameters print 86,164.09054 s,
    cited to Seidelmann (ed.), Explanatory Supplement to
    the Astronomical Almanac (1992). Rounded to four
    decimals in the seconds, that is 86,164.0905.
    The calculator uses 86,164.0905. It does not
    substitute 86,164.09054.
    NASA’s Earth Fact Sheet lists the sidereal rotation
    period as 23.9345 hours. 86,164.0905 / 3600 is
    23.934469583 h, which rounds to 23.9345 at four
    decimals. The fact-sheet rounding is not substituted.
    T = sidereal day / |sin φ|, in mean solar hours.
    At the equator the sine is zero and the plane does
    not precess. Positive φ is north. A positive rate is
    clockwise when viewed from above.
    Educational idealized model, not an engineering design. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Foucault = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Mean sidereal day in seconds of mean solar time.
     JPL prints 86164.09054 s. This page uses 86164.0905 s. */
  var SIDEREAL_DAY_S = 86164.0905;
  var JPL_SIDEREAL_DAY_S = 86164.09054;
  /* Earth Fact Sheet, sidereal rotation period, hours.
     Not used as the divisor. Printed so the rounding stays visible. */
  var FACT_SHEET_HOURS = 23.9345;
  var MEAN_SOLAR_HOUR_S = 3600;
  var LAT_MIN = -90;
  var LAT_MAX = 90;

  /* Round classroom latitudes. Not surveys.
     37.29° N is the latitude the local-sky desk uses for Campbell. */
  var PRESETS = [
    { id: "campbell", name: "Campbell", phi: 37.29 },
    { id: "paris", name: "Paris Panthéon", phi: 48.85 },
    { id: "north", name: "North Pole", phi: 90 },
    { id: "equator", name: "Equator", phi: 0 },
    { id: "sydney", name: "Sydney", phi: -33.87 }
  ];

  var LIMITS = "Educational idealized model, not an engineering design. A real pendulum needs a long wire, a heavy bob, and a drive or a Charron ring to fight damping and elliptical drift. This page leaves those out.";

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function sinLat(phi) {
    return Math.sin(degToRad(phi));
  }

  function finiteLat(phi) {
    return typeof phi === "number" && isFinite(phi) && phi >= LAT_MIN && phi <= LAT_MAX;
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  /* Degrees the swing plane turns per sidereal hour. 15° × sin φ.
     A sidereal hour is 1/24 of the sidereal day, so the Earth
     turns 15° in that hour, and the plane turns the sine of that. */
  function rateDegPerSiderealHour(phi) {
    return 15 * sinLat(phi);
  }

  /* Degrees Earth turns in one mean solar hour of 3600 s. */
  function earthDegPerMeanSolarHour() {
    return 360 * (MEAN_SOLAR_HOUR_S / SIDEREAL_DAY_S);
  }

  function rateDegPerSolarHour(phi) {
    return earthDegPerMeanSolarHour() * sinLat(phi);
  }

  function periodSeconds(phi) {
    var s = Math.abs(sinLat(phi));
    if (s === 0) return Infinity;
    return SIDEREAL_DAY_S / s;
  }

  /* Full-turn period in mean solar hours. */
  function periodHours(phi) {
    var seconds = periodSeconds(phi);
    if (!isFinite(seconds)) return Infinity;
    return seconds / MEAN_SOLAR_HOUR_S;
  }

  /* How many sidereal days one full turn takes. 1/|sin φ|. */
  function siderealDays(phi) {
    var s = Math.abs(sinLat(phi));
    if (s === 0) return Infinity;
    return 1 / s;
  }

  function sense(phi) {
    var s = sinLat(phi);
    if (s === 0) return "none";
    if (s > 0) return "clockwise";
    return "counter-clockwise";
  }

  function formatAbs(n, digits) {
    return Math.abs(n).toFixed(digits);
  }

  function formatSigned(n, digits) {
    var body = formatAbs(n, digits);
    if (Object.is(n, -0) || n < 0) return "\u2212" + body;
    return body;
  }

  function formatLat(phi) {
    var body = formatAbs(phi, 2) + "\u00b0";
    if (phi > 0) return body + " N";
    if (phi < 0) return body + " S";
    return body;
  }

  function formatClock(seconds) {
    if (!isFinite(seconds)) return "does not precess";
    var left = Math.abs(seconds);
    var h = Math.floor(left / 3600 + 1e-12);
    left -= h * 3600;
    var m = Math.floor(left / 60 + 1e-12);
    var sec = left - m * 60;
    var secText = sec.toFixed(4);
    if (secText === "60.0000") {
      secText = "0.0000";
      m += 1;
    }
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
    return h + " h " + m + " m " + secText + " s";
  }

  function formatHours(hours) {
    if (!isFinite(hours)) return "does not precess";
    return formatAbs(hours, 6) + " h";
  }

  function why(phi, view) {
    if (!view.precesses) {
      return "At the equator sin φ is zero. The local vertical is perpendicular to Earth’s spin axis, so the swing plane does not precess. The period is not a large number. It does not turn.";
    }
    var way = view.sense === "clockwise" ? "clockwise" : "counter-clockwise";
    var hemi = phi > 0 ? "northern" : "southern";
    return "T = 86,164.0905 s / |sin φ| = " + view.text.period + " (" + view.text.clock + "), which is " + view.text.turns + ". Viewed from above, the plane turns " + way + ". That is the " + hemi + " sign of sin φ. The rate is " + view.text.rateSidereal + ", and " + view.text.rateSolar + ".";
  }

  function scene(phi) {
    if (phi && typeof phi === "object") phi = phi.phi;
    if (!finiteLat(phi)) return { ok: false };
    var s = sinLat(phi);
    var precesses = s !== 0;
    var hours = periodHours(phi);
    var seconds = periodSeconds(phi);
    var days = siderealDays(phi);
    var sidH = rateDegPerSiderealHour(phi);
    var solH = rateDegPerSolarHour(phi);
    var text = {
      latitude: formatLat(phi),
      sin: formatSigned(s, 6),
      rateSidereal: formatSigned(sidH, 5) + "\u00b0 per sidereal hour",
      rateSolar: formatSigned(solH, 5) + "\u00b0 per mean solar hour",
      period: formatHours(hours),
      clock: formatClock(seconds),
      turns: precesses ? formatAbs(days, 6) + " sidereal days" : "does not precess",
      sense: precesses
        ? (s > 0 ? "Clockwise, viewed from above" : "Counter-clockwise, viewed from above")
        : "Does not precess"
    };
    var view = {
      ok: true,
      phi: phi,
      sin: s,
      precesses: precesses,
      sense: sense(phi),
      rateSidereal: sidH,
      rateSolar: solH,
      periodHours: hours,
      periodSeconds: seconds,
      siderealDays: days,
      text: text
    };
    text.why = why(phi, view);
    text.aria = precesses
      ? ("Top-down swing plane at " + text.latitude + ". Full turn " + text.period + ", " + text.sense + ".")
      : "Top-down swing plane at the equator. The plane does not precess.";
    return view;
  }

  /* Clockwise from north, in radians, after elapsed mean solar hours.
     Positive in the northern hemisphere. */
  function planeAngleRad(phi, elapsedSolarHours) {
    if (!finiteLat(phi) || !isFinite(elapsedSolarHours)) return null;
    return degToRad(rateDegPerSolarHour(phi) * elapsedSolarHours);
  }

  function series(step) {
    var d = step || 1;
    var out = [];
    var phi;
    for (phi = LAT_MIN; phi <= LAT_MAX + 1e-9; phi += d) {
      var p = Math.round(phi * 1e6) / 1e6;
      if (Math.abs(p) < 1e-9) p = 0;
      if (p > LAT_MAX) p = LAT_MAX;
      var sc = scene(p);
      out.push({
        phi: p,
        hours: sc.precesses ? sc.periodHours : null,
        precesses: sc.precesses
      });
      if (p === LAT_MAX) break;
    }
    return out;
  }

  function parseLat(raw) {
    if (typeof raw === "number") return finiteLat(raw) ? raw : null;
    if (typeof raw !== "string") return null;
    var t = raw.trim().replace("\u2212", "-").replace(/\s+/g, "");
    if (!t || t === "-" || t === "+" || t === ".") return null;
    var n = Number(t);
    if (!finiteLat(n)) return null;
    return n;
  }

  return {
    SIDEREAL_DAY_S: SIDEREAL_DAY_S,
    JPL_SIDEREAL_DAY_S: JPL_SIDEREAL_DAY_S,
    FACT_SHEET_HOURS: FACT_SHEET_HOURS,
    MEAN_SOLAR_HOUR_S: MEAN_SOLAR_HOUR_S,
    LAT_MIN: LAT_MIN,
    LAT_MAX: LAT_MAX,
    PRESETS: PRESETS,
    LIMITS: LIMITS,
    presetById: presetById,
    sinLat: sinLat,
    earthDegPerMeanSolarHour: earthDegPerMeanSolarHour,
    rateDegPerSiderealHour: rateDegPerSiderealHour,
    rateDegPerSolarHour: rateDegPerSolarHour,
    periodSeconds: periodSeconds,
    periodHours: periodHours,
    siderealDays: siderealDays,
    sense: sense,
    scene: scene,
    planeAngleRad: planeAngleRad,
    series: series,
    parseLat: parseLat,
    formatLat: formatLat,
    formatClock: formatClock,
    disclaimer: function () { return LIMITS; }
  };
});
