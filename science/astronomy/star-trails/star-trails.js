/*! Star trails and sky rotation.
    Earth's sidereal turn is one revolution per mean sidereal day.
    This page uses 86,164.0905 s, the same rounding as the Foucault desk.
    JPL's astrodynamic parameters print 86,164.09054 s, cited to
    Seidelmann (ed.), Explanatory Supplement to the Astronomical
    Almanac (1992). Rounded to four decimals in the seconds, that is
    86,164.0905. The calculator uses 86,164.0905. It does not
    substitute 86,164.09054, and it does not substitute the Earth
    Fact Sheet's 23.9345 h.
    The sky angle around the pole is that rate times the exposure.
    The path length on the sky is that angle times cos δ.
    On the sensor, for a short trail, length ≈ f · θ, with θ in radians.
    The 500 rule and the NPF rule are labeled approximations.
    NPF is Frédéric Michaud's printed pair, Société Astronomique du Havre:
      t_simple = (35 N + 30 p_µm) / f_mm
      t_expo = k (16.9 N + 0.10 f_mm + 13.7 p_µm) / (f_mm cos δ)
    Educational calculator. Not an exposure to trust on a given night. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StarTrails = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SIDEREAL_DAY_S = 86164.0905;
  var JPL_SIDEREAL_DAY_S = 86164.09054;
  var FACT_SHEET_HOURS = 23.9345;
  var MEAN_SOLAR_DAY_S = 24.0000 * 3600;
  var CAMPBELL_LAT = 37.29;

  /* Arcseconds in one radian. 180 × 3600 / π. A definition, not a survey. */
  var ARCSEC_PER_RAD = (180 * 3600) / Math.PI;

  var DEC_MIN = -90;
  var DEC_MAX = 90;
  var EXPOSURE_MIN = 0.1;
  var EXPOSURE_MAX = 43200;
  var FOCAL_MIN = 1;
  var FOCAL_MAX = 2000;
  var PITCH_MIN = 0.5;
  var PITCH_MAX = 50;
  var CROP_MIN = 0.5;
  var CROP_MAX = 10;
  var BLUR_MIN = 0.1;
  var BLUR_MAX = 100;
  var APERTURE_MIN = 0.5;
  var APERTURE_MAX = 64;
  var LAT_MIN = -90;
  var LAT_MAX = 90;

  /* Illustrative sensor examples. Not measurements of one camera.
     5.9 µm sits near 36 mm / 6,000 photosites = 6.0 µm.
     Crop 1 is the 500 rule's full-frame factor.
     Crop 1.5 and 2 are the usual APS-C and Micro Four Thirds comparisons
     with a 36 mm frame. 3.9 µm and 3.3 µm are round pitches for those buttons. */
  var SENSORS = [
    { id: "ff", name: "Full frame", pitchUm: 5.9, crop: 1 },
    { id: "apsc", name: "APS-C", pitchUm: 3.9, crop: 1.5 },
    { id: "mft", name: "Micro Four Thirds", pitchUm: 3.3, crop: 2 }
  ];

  var FOCALS = [14, 24, 50, 200];

  var RULE_500 = 500;

  /* Michaud's printed coefficients. Not re-derived on this page. */
  var NPF_SIMPLE_N = 35;
  var NPF_SIMPLE_P = 30;
  var NPF_N = 16.9;
  var NPF_F = 0.10;
  var NPF_P = 13.7;

  var DEFAULTS = {
    dec: 0,
    exposureS: 1800,
    focalMm: 24,
    pitchUm: 5.9,
    crop: 1,
    blurPx: 1,
    aperture: 2.8,
    k: 1,
    lat: CAMPBELL_LAT,
    tracking: false
  };

  var LIMITS = "Educational calculator. Not an exposure to trust on a given night, and not a model of a lens. The sensor length is the small-angle arc f · θ. A flat sensor, seeing, diffraction, and focus are left out. The 500 rule and the NPF rule are approximations. The pixel pitches and crop factors on the buttons are illustrative examples, not measurements of one camera.";

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function inRange(x, lo, hi) {
    return typeof x === "number" && isFinite(x) && x >= lo && x <= hi;
  }

  function cosDec(dec) {
    if (Math.abs(dec) >= 90) return 0;
    var c = Math.cos(degToRad(dec));
    if (Math.abs(c) < 1e-15) return 0;
    return c;
  }

  function rateArcsecPerSec() {
    return (360 * 3600) / SIDEREAL_DAY_S;
  }

  function solarRateArcsecPerSec() {
    return (360 * 3600) / MEAN_SOLAR_DAY_S;
  }

  function apparentRateArcsecPerSec(dec) {
    return rateArcsecPerSec() * cosDec(dec);
  }

  /* Angle swept around the pole. Independent of declination. */
  function trailArcDeg(exposureS) {
    return 360 * exposureS / SIDEREAL_DAY_S;
  }

  function trailArcArcsec(exposureS) {
    return rateArcsecPerSec() * exposureS;
  }

  /* Path length on the sky, in arcseconds. Rate × cos δ × time. */
  function skyArcsec(dec, exposureS) {
    return apparentRateArcsecPerSec(dec) * exposureS;
  }

  /* Pixels of trail on the sensor. f · θ, θ in radians, pitch in mm.
     A perfect sidereal track cancels it. */
  function driftPixels(focalMm, pitchUm, dec, exposureS, tracking) {
    if (tracking) return 0;
    var thetaRad = skyArcsec(dec, exposureS) / ARCSEC_PER_RAD;
    var pitchMm = pitchUm * 0.001;
    return (focalMm * thetaRad) / pitchMm;
  }

  function driftPixelsPerSec(focalMm, pitchUm, dec, tracking) {
    return driftPixels(focalMm, pitchUm, dec, 1, tracking);
  }

  function exposureForBlur(focalMm, pitchUm, dec, blurPx, tracking) {
    if (tracking) return Infinity;
    var rate = driftPixelsPerSec(focalMm, pitchUm, dec, false);
    if (rate === 0) return Infinity;
    return blurPx / rate;
  }

  function rule500Seconds(crop, focalMm) {
    return RULE_500 / (crop * focalMm);
  }

  function npfSimpleSeconds(aperture, pitchUm, focalMm) {
    return (NPF_SIMPLE_N * aperture + NPF_SIMPLE_P * pitchUm) / focalMm;
  }

  function npfCompleteSeconds(k, aperture, pitchUm, focalMm, dec) {
    var c = cosDec(dec);
    if (c === 0) return Infinity;
    return k * (NPF_N * aperture + NPF_F * focalMm + NPF_P * pitchUm) / (focalMm * c);
  }

  /* Pixels the 500 rule allows at this pitch, crop, and declination.
     The focal length cancels: both the rule and the drift scale as 1/f. */
  function rule500BlurPx(crop, pitchUm, dec) {
    var t = rule500Seconds(crop, 1);
    return driftPixels(1, pitchUm, dec, t, false);
  }

  function poleAltitudeDeg(lat) {
    return lat;
  }

  function poleName(lat) {
    if (lat > 0) return "north";
    if (lat < 0) return "south";
    return "horizon";
  }

  function formatFixed(n, digits) {
    if (!isFinite(n)) return "—";
    return Math.abs(n).toFixed(digits);
  }

  function formatSigned(n, digits) {
    if (!isFinite(n)) return "—";
    var body = formatFixed(n, digits);
    if (Object.is(n, -0) || n < 0) return "\u2212" + body;
    return body;
  }

  function formatArcsec(arcsec) {
    if (!isFinite(arcsec)) return "—";
    var abs = Math.abs(arcsec);
    var digits = abs >= 100 ? 2 : (abs >= 10 ? 2 : 3);
    return formatFixed(abs, digits) + "\u2033";
  }

  function formatArcmin(arcsec) {
    if (!isFinite(arcsec)) return "—";
    return formatFixed(Math.abs(arcsec) / 60, 2) + "\u2032";
  }

  function formatSky(arcsec) {
    if (!isFinite(arcsec)) return "—";
    var abs = Math.abs(arcsec);
    if (abs >= 3600) return formatFixed(abs / 3600, 3) + "\u00b0";
    if (abs >= 60) return formatArcmin(abs);
    return formatArcsec(abs);
  }

  function formatSeconds(s) {
    if (!isFinite(s)) return "no finite time";
    if (s >= 3600) {
      var h = Math.floor(s / 3600);
      var m = Math.floor((s - h * 3600) / 60);
      var sec = s - h * 3600 - m * 60;
      return h + " h " + m + " m " + sec.toFixed(1) + " s";
    }
    if (s >= 60) {
      var min = Math.floor(s / 60);
      var rem = s - min * 60;
      return min + " m " + rem.toFixed(1) + " s";
    }
    var digits = s >= 10 ? 2 : 3;
    return formatFixed(s, digits) + " s";
  }

  function formatPx(px) {
    if (!isFinite(px)) return "—";
    var abs = Math.abs(px);
    var digits = abs >= 100 ? 1 : (abs >= 10 ? 2 : 4);
    return formatFixed(abs, digits) + " px";
  }

  function formatRate(arcsecPerSec) {
    return formatFixed(arcsecPerSec, 6) + "\u2033/s";
  }

  function formatLat(lat) {
    var body = formatFixed(lat, 2) + "\u00b0";
    if (lat > 0) return body + " N";
    if (lat < 0) return body + " S";
    return body;
  }

  function finiteInput(input) {
    if (!input || typeof input !== "object") return "Set the fields.";
    if (!inRange(input.dec, DEC_MIN, DEC_MAX)) return "Declination is a number from \u221290 to 90.";
    if (!inRange(input.exposureS, EXPOSURE_MIN, EXPOSURE_MAX)) return "Exposure is a number from 0.1 s to 43,200 s.";
    if (!inRange(input.focalMm, FOCAL_MIN, FOCAL_MAX)) return "Focal length is a number from 1 mm to 2,000 mm.";
    if (!inRange(input.pitchUm, PITCH_MIN, PITCH_MAX)) return "Pixel pitch is a number from 0.5 \u00b5m to 50 \u00b5m.";
    if (!inRange(input.crop, CROP_MIN, CROP_MAX)) return "Crop factor is a number from 0.5 to 10.";
    if (!inRange(input.blurPx, BLUR_MIN, BLUR_MAX)) return "Max blur is a number from 0.1 px to 100 px.";
    if (!inRange(input.aperture, APERTURE_MIN, APERTURE_MAX)) return "Aperture is a number from 0.5 to 64.";
    if (input.k !== 1 && input.k !== 2 && input.k !== 3) return "NPF k is 1, 2, or 3.";
    if (!inRange(input.lat, LAT_MIN, LAT_MAX)) return "Latitude is a number from \u221290 to 90.";
    return "";
  }

  function scene(input) {
    var err = finiteInput(input);
    if (err) return { ok: false, error: err };
    var dec = input.dec;
    var exposureS = input.exposureS;
    var focalMm = input.focalMm;
    var pitchUm = input.pitchUm;
    var crop = input.crop;
    var blurPx = input.blurPx;
    var aperture = input.aperture;
    var k = input.k;
    var lat = input.lat;
    var tracking = !!input.tracking;
    var c = cosDec(dec);
    var onPole = c === 0;
    var rate = rateArcsecPerSec();
    var apparent = apparentRateArcsecPerSec(dec);
    var arc = trailArcArcsec(exposureS);
    var sky = skyArcsec(dec, exposureS);
    var px = driftPixels(focalMm, pitchUm, dec, exposureS, tracking);
    var pxRate = driftPixelsPerSec(focalMm, pitchUm, dec, tracking);
    var sharp = exposureForBlur(focalMm, pitchUm, dec, blurPx, tracking);
    var t500 = rule500Seconds(crop, focalMm);
    var blur500 = rule500BlurPx(crop, pitchUm, dec);
    var simple = npfSimpleSeconds(aperture, pitchUm, focalMm);
    var complete = npfCompleteSeconds(k, aperture, pitchUm, focalMm, dec);
    var pole = poleAltitudeDeg(lat);
    var small = sky <= 3600;

    var text = {
      rate: formatRate(rate),
      solarRate: formatRate(solarRateArcsecPerSec()),
      apparent: onPole ? "0\u2033/s" : formatRate(apparent),
      trail: formatSky(arc),
      trailArcsec: formatArcsec(arc),
      trailArcmin: formatArcmin(arc),
      sky: onPole ? "0\u2033" : formatSky(sky),
      skyArcsec: onPole ? "0\u2033" : formatArcsec(sky),
      skyArcmin: onPole ? "0.00\u2032" : formatArcmin(sky),
      drift: tracking ? "0 px" : (onPole ? "0 px" : formatPx(px)),
      driftRate: tracking ? "0 px/s" : (onPole ? "0 px/s" : formatPx(pxRate).replace(" px", " px/s")),
      sharp: formatSeconds(sharp),
      rule500: formatSeconds(t500),
      rule500Blur: onPole ? "0 px" : formatPx(blur500),
      npfSimple: formatSeconds(simple),
      npf: formatSeconds(complete),
      pole: formatLat(pole),
      cos: formatFixed(c, 4)
    };

    var why;
    if (tracking) {
      why = "A mount turning once per sidereal day, about an axis aimed at the pole, cancels this trail. The sky still sweeps " + text.trail + " around the pole. The sensor drift is set to zero. Periodic error, polar misalignment, flexure, and refraction are not in that zero.";
    } else if (onPole) {
      why = "At \u00b190\u00b0 of declination, cos \u03b4 is zero. The star sits on the pole, so the path length on the sky is zero and the sensor does not drift. The angle around the pole is still " + text.trail + ", on a circle of no radius.";
    } else if (dec === 0) {
      why = "On the equator cos \u03b4 is 1, so the path on the sky equals the angle around the pole. In " + formatSeconds(exposureS) + " that is " + text.sky + " (" + text.skyArcsec + "). At " + formatFixed(focalMm, 1) + " mm and " + formatFixed(pitchUm, 1) + " \u00b5m the small-angle length is " + text.drift + ", " + text.driftRate + ".";
    } else {
      why = "Declination " + formatSigned(dec, 2) + "\u00b0 multiplies the path by cos \u03b4 = " + text.cos + ". The angle around the pole stays " + text.trail + ". The path on the sky is " + text.sky + " (" + text.skyArcsec + "). The sensor moves " + text.drift + ".";
    }
    if (!tracking && !onPole && !small) {
      why += " The trail is longer than 1\u00b0. f \u00b7 \u03b8 is the arc length. A flat sensor does not lay a long arc down as that straight length.";
    }
    text.why = why;

    return {
      ok: true,
      dec: dec,
      exposureS: exposureS,
      focalMm: focalMm,
      pitchUm: pitchUm,
      crop: crop,
      blurPx: blurPx,
      aperture: aperture,
      k: k,
      lat: lat,
      tracking: tracking,
      onPole: onPole,
      cosDec: c,
      rateArcsecPerSec: rate,
      apparentArcsecPerSec: apparent,
      trailArcsec: arc,
      trailDeg: trailArcDeg(exposureS),
      skyArcsec: sky,
      driftPx: px,
      driftPxPerSec: pxRate,
      sharpSeconds: sharp,
      rule500Seconds: t500,
      rule500BlurPx: blur500,
      npfSimpleSeconds: simple,
      npfSeconds: complete,
      poleAltitudeDeg: pole,
      poleName: poleName(lat),
      smallAngle: small,
      text: text
    };
  }

  function chartSeries(input, fMin, fMax, steps) {
    var lo = fMin || 10;
    var hi = fMax || 400;
    var n = steps || 60;
    var out = [];
    var i;
    for (i = 0; i <= n; i++) {
      var f = lo + (hi - lo) * (i / n);
      var row = {
        focalMm: f,
        sharp: exposureForBlur(f, input.pitchUm, input.dec, input.blurPx, false),
        rule500: rule500Seconds(input.crop, f),
        npf: npfCompleteSeconds(input.k, input.aperture, input.pitchUm, f, input.dec)
      };
      out.push(row);
    }
    return out;
  }

  function focalRows(input) {
    return FOCALS.map(function (f) {
      var copy = {};
      var key;
      for (key in input) copy[key] = input[key];
      copy.focalMm = f;
      copy.tracking = false;
      return scene(copy);
    });
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

  return {
    SIDEREAL_DAY_S: SIDEREAL_DAY_S,
    JPL_SIDEREAL_DAY_S: JPL_SIDEREAL_DAY_S,
    FACT_SHEET_HOURS: FACT_SHEET_HOURS,
    MEAN_SOLAR_DAY_S: MEAN_SOLAR_DAY_S,
    CAMPBELL_LAT: CAMPBELL_LAT,
    ARCSEC_PER_RAD: ARCSEC_PER_RAD,
    RULE_500: RULE_500,
    NPF_SIMPLE_N: NPF_SIMPLE_N,
    NPF_SIMPLE_P: NPF_SIMPLE_P,
    NPF_N: NPF_N,
    NPF_F: NPF_F,
    NPF_P: NPF_P,
    SENSORS: SENSORS,
    FOCALS: FOCALS,
    DEFAULTS: DEFAULTS,
    LIMITS: LIMITS,
    DEC_MIN: DEC_MIN,
    DEC_MAX: DEC_MAX,
    rateArcsecPerSec: rateArcsecPerSec,
    solarRateArcsecPerSec: solarRateArcsecPerSec,
    apparentRateArcsecPerSec: apparentRateArcsecPerSec,
    trailArcDeg: trailArcDeg,
    skyArcsec: skyArcsec,
    driftPixels: driftPixels,
    driftPixelsPerSec: driftPixelsPerSec,
    exposureForBlur: exposureForBlur,
    rule500Seconds: rule500Seconds,
    npfSimpleSeconds: npfSimpleSeconds,
    npfCompleteSeconds: npfCompleteSeconds,
    rule500BlurPx: rule500BlurPx,
    scene: scene,
    chartSeries: chartSeries,
    focalRows: focalRows,
    parseNumber: parseNumber,
    formatSky: formatSky,
    formatSeconds: formatSeconds,
    cosDec: cosDec,
    disclaimer: function () { return LIMITS; }
  };
});
