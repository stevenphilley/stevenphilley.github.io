/*! Atmospheric refraction desk.
    Classroom arithmetic. Not a forecast and not an ephemeris.
    Bennett, Journal of Navigation 35, 255 (1982), from apparent altitude:
      R = cot( h_a + 7.31 / (h_a + 4.4) )
    Sæmundsson, Sky & Telescope 72, 70 (1986), from true altitude:
      R = 1.02 cot( h + 10.3 / (h + 5.11) )
    R is in arcminutes and the altitude is in degrees.
    Meeus, Astronomical Algorithms, chapter 16, multiplies both by
      (P/1010) × (283/(273+T))
    at a standard 1010 hPa and 10°C. 1010 hPa is 101.0 kPa.
    The sunrise allowances, about 34′ and about 16′, and the geometric
    altitude −0.833°, are the NOAA figures the twilight and airmass
    desks already use. They are not a second measurement of the Sun. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Refraction = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var BENNETT_NUM = 7.31;
  var BENNETT_DEN = 4.4;
  var SAEM_SCALE = 1.02;
  var SAEM_NUM = 10.3;
  var SAEM_DEN = 5.11;
  var P_STD = 1010;
  var T_STD = 10;
  var T_ZERO = 273;
  var T_NUM = 283;

  /* NOAA’s sunrise note. −0.833° is about 34′ of refraction plus
     about 16′ of solar semi-diameter. The 16′ is an allowance, not
     a new angular diameter. Twice 16′ is the 32′ horizontal diameter
     this page holds fixed. */
  var NOAA_REFRACTION_ARCMIN = 34;
  var SOLAR_SEMIDIAMETER_ARCMIN = 16;
  var SUNRISE_ALT_DEG = -0.833;

  /* Earth Fact Sheet obliquity, the same 23.44° the analemma desk uses.
     Solstice declination buttons use it. They do not invent a new tilt. */
  var OBLIQUITY_DEG = 23.44;

  /* Campbell latitude the local-sky desk stores. Not a new survey. */
  var CAMPBELL_LAT = 37.29;

  var ALT_MIN = 0;
  var ALT_MAX = 90;
  var P_MIN = 400;
  var P_MAX = 1100;
  var T_MIN = -80;
  var T_MAX = 50;
  var LAT_MIN = -90;
  var LAT_MAX = 90;
  var DEC_MIN = -OBLIQUITY_DEG;
  var DEC_MAX = OBLIQUITY_DEG;

  /* Log chart floor, arcminutes. Bennett’s zenith residual is negative
     and a log axis cannot plot it. Points at or below the floor share
     the bottom line. The readout still prints the formula. */
  var CHART_FLOOR_ARCMIN = 0.01;

  var PRESETS = [
    { id: "zenith", name: "Zenith", altitudeDeg: 90, pressureHpa: P_STD, tempC: T_STD, mode: "apparent" },
    { id: "fortyfive", name: "45°", altitudeDeg: 45, pressureHpa: P_STD, tempC: T_STD, mode: "apparent" },
    { id: "ten", name: "10°", altitudeDeg: 10, pressureHpa: P_STD, tempC: T_STD, mode: "apparent" },
    { id: "horizon", name: "Horizon", altitudeDeg: 0, pressureHpa: P_STD, tempC: T_STD, mode: "apparent" },
    { id: "campbell", name: "Sunrise · Campbell", altitudeDeg: 0, pressureHpa: P_STD, tempC: T_STD, mode: "apparent", lat: CAMPBELL_LAT, dec: 0 },
    { id: "arctic", name: "Cold arctic air", altitudeDeg: 0, pressureHpa: 1030, tempC: -30, mode: "apparent" },
    { id: "kea", name: "Mauna Kea", altitudeDeg: 0, pressureHpa: 615, tempC: 0, mode: "apparent" }
  ];

  var LIMITS = "Educational calculator. Not a forecast and not an ephemeris. Bennett and Sæmundsson are standard approximations for a standard atmosphere. Meeus reports Bennett within 0.07′ of Garfinkel from the zenith to the horizon, and Sæmundsson within about 0.1′ of Bennett. Real horizon refraction varies a lot with temperature inversions. A ground temperature and a pressure do not describe that profile.";

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function inRange(x, lo, hi) {
    return typeof x === "number" && isFinite(x) && x >= lo && x <= hi;
  }

  function pressureFactor(pressureHpa, tempC) {
    return (pressureHpa / P_STD) * (T_NUM / (T_ZERO + tempC));
  }

  function bennettArcmin(altDeg, pressureHpa, tempC) {
    var p = pressureHpa == null ? P_STD : pressureHpa;
    var t = tempC == null ? T_STD : tempC;
    var arg = altDeg + BENNETT_NUM / (altDeg + BENNETT_DEN);
    var r0 = 1 / Math.tan(arg * Math.PI / 180);
    return r0 * pressureFactor(p, t);
  }

  function saemundssonArcmin(trueAltDeg, pressureHpa, tempC) {
    var p = pressureHpa == null ? P_STD : pressureHpa;
    var t = tempC == null ? T_STD : tempC;
    var arg = trueAltDeg + SAEM_NUM / (trueAltDeg + SAEM_DEN);
    var r0 = SAEM_SCALE / Math.tan(arg * Math.PI / 180);
    return r0 * pressureFactor(p, t);
  }

  /* Apparent vertical solar diameter when the lower limb is at 0°
     apparent and the true angular diameter is 32′. Bennett supplies
     R at each apparent limb. The flattening is R(lower) − R(upper),
     which is also 32′ minus the apparent vertical diameter. */
  function solarFlattening(pressureHpa, tempC) {
    var horizontal = 2 * SOLAR_SEMIDIAMETER_ARCMIN;
    var trueDeg = horizontal / 60;
    var lower = 0;
    var D = trueDeg;
    var i, hU, rL, rU, gap;
    for (i = 0; i < 60; i++) {
      hU = lower + D;
      rL = bennettArcmin(lower, pressureHpa, tempC);
      rU = bennettArcmin(hU, pressureHpa, tempC);
      if (!isFinite(rL) || !isFinite(rU)) return null;
      gap = (hU - rU / 60) - (lower - rL / 60);
      D += trueDeg - gap;
      if (Math.abs(trueDeg - gap) < 1e-14) break;
    }
    hU = lower + D;
    rL = bennettArcmin(lower, pressureHpa, tempC);
    rU = bennettArcmin(hU, pressureHpa, tempC);
    return {
      horizontalArcmin: horizontal,
      apparentVerticalArcmin: D * 60,
      flatteningArcmin: rL - rU,
      lowerArcmin: rL,
      upperArcmin: rU,
      upperApparentDeg: hU,
      fixedApparentGapArcmin: bennettArcmin(0, pressureHpa, tempC) - bennettArcmin(horizontal / 60, pressureHpa, tempC)
    };
  }

  function hourAngleDeg(altDeg, latDeg, decDeg) {
    var lat = degToRad(latDeg);
    var dec = degToRad(decDeg);
    var denom = Math.cos(lat) * Math.cos(dec);
    if (Math.abs(denom) < 1e-12) return null;
    var cosH = (Math.sin(degToRad(altDeg)) - Math.sin(lat) * Math.sin(dec)) / denom;
    if (cosH > 1 || cosH < -1) return null;
    return Math.acos(cosH) * 180 / Math.PI;
  }

  /* Extra minutes of daylight, sunrise and sunset together.
     2 × (H(altLow) − H(altHigh)) / 15° per hour × 60. */
  function extraMinutes(altLow, altHigh, latDeg, decDeg) {
    var low = hourAngleDeg(altLow, latDeg, decDeg);
    var high = hourAngleDeg(altHigh, latDeg, decDeg);
    if (low == null || high == null) return null;
    return 2 * (low - high) / 15 * 60;
  }

  /* One horizon is R / (15°/h · cos φ · cos δ). Both horizons are twice that.
     The rate assumes sin H = 1, a vertical path. */
  function simpleBothMinutes(rArcmin, latDeg, decDeg) {
    var rate = 15 * Math.cos(degToRad(latDeg)) * Math.cos(degToRad(decDeg));
    if (!(rate > 1e-8) || !isFinite(rArcmin)) return null;
    return 2 * ((rArcmin / 60) / rate) * 60;
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function formatAbs(n, digits) {
    return Math.abs(n).toFixed(digits);
  }

  function formatSigned(n, digits) {
    var body = formatAbs(n, digits);
    if (Object.is(n, -0) || n < 0) return "\u2212" + body;
    return body;
  }

  function formatArcmin(r) {
    if (!isFinite(r)) return "\u2014";
    var digits = Math.abs(r) >= 10 ? 1 : (Math.abs(r) >= 1 ? 2 : 3);
    if (digits > 0 && Math.abs(r - Math.round(r)) < 1e-9) digits = 0;
    return formatSigned(r, digits) + "\u2032";
  }

  function formatDeg(d) {
    if (!isFinite(d)) return "\u2014";
    var digits = Math.abs(d) >= 10 ? 2 : 3;
    if (Math.abs(d) < 5e-7) return "0\u00b0";
    return formatSigned(d, digits) + "\u00b0";
  }

  function formatLat(phi) {
    var body = formatAbs(phi, 2) + "\u00b0";
    if (phi > 0) return body + " N";
    if (phi < 0) return body + " S";
    return body;
  }

  function formatDec(dec) {
    if (Math.abs(dec) < 5e-7) return "0\u00b0";
    return formatSigned(dec, 2) + "\u00b0";
  }

  function formatMinutes(m) {
    if (m == null || !isFinite(m)) return "does not cross";
    return m.toFixed(2) + " min";
  }

  function formatFactor(f) {
    if (!isFinite(f)) return "\u2014";
    return f.toFixed(4);
  }

  function parseNumber(raw, lo, hi) {
    if (typeof raw === "number") return inRange(raw, lo, hi) ? raw : null;
    if (typeof raw !== "string") return null;
    var t = raw.trim().replace("\u2212", "-").replace(/\s+/g, "");
    if (!t || t === "-" || t === "+" || t === ".") return null;
    var n = Number(t);
    if (!inRange(n, lo, hi)) return null;
    return n;
  }

  function daylightBlock(pressureHpa, tempC, lat, dec) {
    var r = bennettArcmin(0, pressureHpa, tempC);
    var semiDeg = -SOLAR_SEMIDIAMETER_ARCMIN / 60;
    var withRef = -(r + SOLAR_SEMIDIAMETER_ARCMIN) / 60;
    var numerical = extraMinutes(withRef, semiDeg, lat, dec);
    var noaaSemi = extraMinutes(SUNRISE_ALT_DEG, semiDeg, lat, dec);
    var noaaZero = extraMinutes(SUNRISE_ALT_DEG, 0, lat, dec);
    var simple = simpleBothMinutes(r, lat, dec);
    return {
      horizonBennettArcmin: r,
      centerDeg: withRef,
      semiOnlyDeg: semiDeg,
      numericalMin: numerical,
      noaaSemiMin: noaaSemi,
      noaaZeroMin: noaaZero,
      simpleMin: simple,
      crosses: numerical != null
    };
  }

  function whyText(view) {
    var t = view.text;
    var modeSentence = view.mode === "apparent"
      ? "The typed altitude is apparent, so Bennett’s formula is the lift: " + t.bennett + " at " + view.pressureHpa + " hPa and " + formatSigned(view.tempC, 0) + "\u00b0C. The true altitude is " + t.otherAltitude + ". Sæmundsson at that true altitude is " + t.companion + ". The gap is " + t.gap + ". Sæmundsson at the typed altitude, as if that number were already true, is " + t.saemundsson + "."
      : "The typed altitude is true, so Sæmundsson’s formula is the lift: " + t.saemundsson + " at " + view.pressureHpa + " hPa and " + formatSigned(view.tempC, 0) + "\u00b0C. The apparent altitude is " + t.otherAltitude + ". Bennett at that apparent altitude is " + t.companion + ". The gap is " + t.gap + ". Bennett at the typed altitude, as if that number were already apparent, is " + t.bennett + ".";
    var day = view.daylight.crosses
      ? "The hour-angle method compares the center at " + t.center + " with " + t.semiOnly + ". Day length is 2H/15 hours, and cos H = (sin a − sin φ sin δ) / (cos φ cos δ). At " + t.latitude + " and declination " + t.declination + " the extra daylight, sunrise and sunset together, is " + t.extra + ". The simple estimate 2R / (15°/h · cos φ · cos δ) is " + t.simple + ". It assumes sin H = 1. NOAA’s fixed pair, −0.833° against " + t.semiOnly + ", is " + t.noaa + " and does not follow the sliders. The same pair against 0° is " + t.noaaZero + ", refraction and semi-diameter together."
      : "At " + t.latitude + " and declination " + t.declination + " the Sun does not cross both of those altitudes, so the hour-angle difference is not a day length. The formula divides by cos φ cos δ and needs a cosine of the hour angle between −1 and 1.";
    var sun = " The horizontal diameter stays " + t.horizontal + ", twice NOAA’s 16′. With that true diameter and the lower limb at apparent 0°, the apparent vertical diameter is " + t.vertical + ". The flattening, Bennett on the lower limb minus Bennett on the upper limb, is " + t.flattening + ". Bennett(0°) − Bennett(32′) is " + t.fixedGap + ", a different subtraction: there the apparent separation is held at 32′.";
    return modeSentence + " The factor (P/1010)×(283/(273+T)) is " + t.factor + ". " + day + sun;
  }

  function scene(input) {
    if (!input) return { ok: false };
    var mode = input.mode === "true" ? "true" : (input.mode === "apparent" ? "apparent" : null);
    if (!mode) return { ok: false };
    if (!inRange(input.altitudeDeg, ALT_MIN, ALT_MAX)) return { ok: false };
    if (!inRange(input.pressureHpa, P_MIN, P_MAX)) return { ok: false };
    if (!inRange(input.tempC, T_MIN, T_MAX)) return { ok: false };
    if (!inRange(input.lat, LAT_MIN, LAT_MAX)) return { ok: false };
    if (!inRange(input.dec, DEC_MIN, DEC_MAX)) return { ok: false };

    var h = input.altitudeDeg;
    var p = input.pressureHpa;
    var temp = input.tempC;
    var bennett = bennettArcmin(h, p, temp);
    var saem = saemundssonArcmin(h, p, temp);
    var primary = mode === "apparent" ? bennett : saem;
    var other = mode === "apparent" ? h - primary / 60 : h + primary / 60;
    var companion = mode === "apparent"
      ? saemundssonArcmin(other, p, temp)
      : bennettArcmin(other, p, temp);
    var day = daylightBlock(p, temp, input.lat, input.dec);
    var sun = solarFlattening(p, temp);
    var factor = pressureFactor(p, temp);

    var text = {
      bennett: formatArcmin(bennett),
      saemundsson: formatArcmin(saem),
      companion: formatArcmin(companion),
      gap: formatArcmin(primary - companion),
      factor: formatFactor(factor),
      altitude: formatDeg(h),
      otherAltitude: formatDeg(other),
      otherLabel: mode === "apparent" ? "True altitude" : "Apparent altitude",
      horizon: formatArcmin(day.horizonBennettArcmin),
      center: formatDeg(day.centerDeg),
      semiOnly: formatDeg(day.semiOnlyDeg),
      extra: formatMinutes(day.numericalMin),
      noaa: formatMinutes(day.noaaSemiMin),
      noaaZero: formatMinutes(day.noaaZeroMin),
      simple: formatMinutes(day.simpleMin),
      horizontal: formatArcmin(sun.horizontalArcmin),
      vertical: formatArcmin(sun.apparentVerticalArcmin),
      flattening: formatArcmin(sun.flatteningArcmin),
      fixedGap: formatArcmin(sun.fixedApparentGapArcmin),
      latitude: formatLat(input.lat),
      declination: formatDec(input.dec),
      mode: mode === "apparent" ? "Apparent altitude" : "True altitude"
    };

    var view = {
      ok: true,
      mode: mode,
      altitudeDeg: h,
      pressureHpa: p,
      tempC: temp,
      lat: input.lat,
      dec: input.dec,
      bennettArcmin: bennett,
      saemundssonArcmin: saem,
      primaryArcmin: primary,
      companionArcmin: companion,
      gapArcmin: primary - companion,
      otherAltitudeDeg: other,
      factor: factor,
      daylight: day,
      sun: sun,
      text: text
    };
    text.why = whyText(view);
    text.aria = text.mode + " " + text.altitude + ". Bennett " + text.bennett + ". Sæmundsson " + text.saemundsson + ". Horizon Bennett " + text.horizon + ".";
    return view;
  }

  function series(pressureHpa, tempC, step) {
    var d = step || 1;
    var out = [];
    var h;
    for (h = 0; h <= ALT_MAX + 1e-9; h += d) {
      var alt = Math.round(h * 1e6) / 1e6;
      if (alt > ALT_MAX) alt = ALT_MAX;
      out.push({
        alt: alt,
        bennett: bennettArcmin(alt, pressureHpa, tempC),
        saemundsson: saemundssonArcmin(alt, pressureHpa, tempC)
      });
      if (alt === ALT_MAX) break;
    }
    return out;
  }

  return {
    BENNETT_NUM: BENNETT_NUM,
    BENNETT_DEN: BENNETT_DEN,
    SAEM_SCALE: SAEM_SCALE,
    SAEM_NUM: SAEM_NUM,
    SAEM_DEN: SAEM_DEN,
    P_STD: P_STD,
    T_STD: T_STD,
    NOAA_REFRACTION_ARCMIN: NOAA_REFRACTION_ARCMIN,
    SOLAR_SEMIDIAMETER_ARCMIN: SOLAR_SEMIDIAMETER_ARCMIN,
    SUNRISE_ALT_DEG: SUNRISE_ALT_DEG,
    OBLIQUITY_DEG: OBLIQUITY_DEG,
    CAMPBELL_LAT: CAMPBELL_LAT,
    ALT_MIN: ALT_MIN,
    ALT_MAX: ALT_MAX,
    P_MIN: P_MIN,
    P_MAX: P_MAX,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    LAT_MIN: LAT_MIN,
    LAT_MAX: LAT_MAX,
    DEC_MIN: DEC_MIN,
    DEC_MAX: DEC_MAX,
    CHART_FLOOR_ARCMIN: CHART_FLOOR_ARCMIN,
    PRESETS: PRESETS,
    LIMITS: LIMITS,
    pressureFactor: pressureFactor,
    bennettArcmin: bennettArcmin,
    saemundssonArcmin: saemundssonArcmin,
    solarFlattening: solarFlattening,
    hourAngleDeg: hourAngleDeg,
    extraMinutes: extraMinutes,
    simpleBothMinutes: simpleBothMinutes,
    presetById: presetById,
    scene: scene,
    series: series,
    parseNumber: parseNumber,
    formatArcmin: formatArcmin,
    formatDeg: formatDeg,
    formatLat: formatLat,
    formatDec: formatDec,
    formatMinutes: formatMinutes,
    formatFactor: formatFactor,
    disclaimer: function () { return LIMITS; }
  };
});
