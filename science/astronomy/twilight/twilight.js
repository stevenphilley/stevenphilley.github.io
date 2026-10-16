/*! Twilight desk — NOAA solar position, in the browser.
    Equations from NOAA's solar calculator (Global Monitoring Laboratory),
    which follows Jean Meeus, Astronomical Algorithms:
    https://gml.noaa.gov/grad/solcalc/
    https://gml.noaa.gov/grad/solcalc/calcdetails.html
    Geometric altitude of the Sun's center. No atmospheric refraction in the
    altitude itself. Sunrise and sunset use the standard −0.833°:
    about 34′ of refraction plus about 16′ of solar semi-diameter,
    NOAA's zenith of 90.833°.
    Civil −6°, nautical −12°, astronomical −18°.
    Golden hour and blue hour are approximate photography bands,
    roughly −4° to +6° and −6° to −4°. They are not NOAA terms.
    Classroom calculator. Not a USNO almanac and not for navigation. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Twilight = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ALT = {
    sunrise: -0.833,
    civil: -6,
    nautical: -12,
    astronomical: -18,
    goldenLow: -4,
    goldenHigh: 6,
    blueLow: -6,
    blueHigh: -4
  };

  var PRESETS = [
    {
      id: "campbell",
      label: "Campbell, CA",
      lat: 37.287,
      lon: -121.95,
      tz: "America/Los_Angeles",
      note: "South Bay default"
    },
    {
      id: "equator",
      label: "Equator",
      lat: 0,
      lon: 0,
      tz: "Etc/UTC",
      note: "0° N, 0° E · UTC"
    },
    {
      id: "london",
      label: "London",
      lat: 51.507,
      lon: -0.128,
      tz: "Europe/London",
      note: ""
    },
    {
      id: "reykjavik",
      label: "Reykjavík",
      lat: 64.147,
      lon: -21.942,
      tz: "Atlantic/Reykjavik",
      note: "Iceland keeps UTC all year"
    },
    {
      id: "tromso",
      label: "Tromsø",
      lat: 69.649,
      lon: 18.956,
      tz: "Europe/Oslo",
      note: ""
    },
    {
      id: "south-pole",
      label: "South Pole",
      lat: -90,
      lon: 0,
      tz: "Pacific/Auckland",
      note: "Amundsen–Scott uses New Zealand civil time"
    }
  ];

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function degToRad(d) { return Math.PI * d / 180; }
  function radToDeg(r) { return 180 * r / Math.PI; }

  function wrap360(x) {
    var y = x % 360;
    if (y < 0) y += 360;
    return y;
  }

  function julianDay(year, month, day) {
    var y = year;
    var m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  }

  function julianCent(jd) {
    return (jd - 2451545.0) / 36525.0;
  }

  function jdFromUnixMs(utcMs) {
    return utcMs / 86400000 + 2440587.5;
  }

  function geomMeanLongSun(t) {
    return wrap360(280.46646 + t * (36000.76983 + t * 0.0003032));
  }

  function geomMeanAnomalySun(t) {
    return 357.52911 + t * (35999.05029 - 0.0001537 * t);
  }

  function eccentricityEarthOrbit(t) {
    return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  }

  function sunEqOfCenter(t) {
    var m = geomMeanAnomalySun(t);
    var mrad = degToRad(m);
    var sinm = Math.sin(mrad);
    var sin2m = Math.sin(2 * mrad);
    var sin3m = Math.sin(3 * mrad);
    return sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) +
      sin2m * (0.019993 - 0.000101 * t) +
      sin3m * 0.000289;
  }

  function sunTrueLong(t) {
    return geomMeanLongSun(t) + sunEqOfCenter(t);
  }

  function sunApparentLong(t) {
    var omega = 125.04 - 1934.136 * t;
    return sunTrueLong(t) - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
  }

  function meanObliquity(t) {
    var seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813));
    return 23 + (26 + seconds / 60) / 60;
  }

  function obliquityCorrection(t) {
    var omega = 125.04 - 1934.136 * t;
    return meanObliquity(t) + 0.00256 * Math.cos(degToRad(omega));
  }

  function declination(t) {
    var e = obliquityCorrection(t);
    var lambda = sunApparentLong(t);
    var sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
    if (sint > 1) sint = 1;
    else if (sint < -1) sint = -1;
    return radToDeg(Math.asin(sint));
  }

  function equationOfTime(t) {
    var epsilon = obliquityCorrection(t);
    var l0 = geomMeanLongSun(t);
    var e = eccentricityEarthOrbit(t);
    var m = geomMeanAnomalySun(t);
    var y = Math.tan(degToRad(epsilon) / 2);
    y *= y;
    var sin2l0 = Math.sin(2 * degToRad(l0));
    var sinm = Math.sin(degToRad(m));
    var cos2l0 = Math.cos(2 * degToRad(l0));
    var sin4l0 = Math.sin(4 * degToRad(l0));
    var sin2m = Math.sin(2 * degToRad(m));
    var Etime = y * sin2l0 - 2 * e * sinm + 4 * e * y * sinm * cos2l0 -
      0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
    return radToDeg(Etime) * 4;
  }

  function geometricAltitude(jd, latitude, longitude) {
    var T = julianCent(jd);
    var eqTime = equationOfTime(T);
    var theta = declination(T);
    var dayFrac = (jd + 0.5) % 1;
    if (dayFrac < 0) dayFrac += 1;
    var minutesUT = dayFrac * 1440;
    var trueSolarTime = minutesUT + eqTime + 4 * longitude;
    trueSolarTime = ((trueSolarTime % 1440) + 1440) % 1440;
    var hourAngle = trueSolarTime / 4 - 180;
    if (hourAngle < -180) hourAngle += 360;
    var haRad = degToRad(hourAngle);
    var latRad = degToRad(latitude);
    var decRad = degToRad(theta);
    var csz = Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    if (csz > 1) csz = 1;
    else if (csz < -1) csz = -1;
    return 90 - radToDeg(Math.acos(csz));
  }

  /* NOAA hour angle for a geometric altitude. kind is "cross", "above", or "below".
     "above" means the Sun stays above the altitude all day. "below" means it never reaches it.
     At the poles the hour angle is undefined; the caller uses the altitude itself. */
  function hourAngle(lat, dec, altitudeDeg) {
    var latRad = degToRad(lat);
    var decRad = degToRad(dec);
    var cosLat = Math.cos(latRad);
    if (Math.abs(cosLat) < 1e-8 || Math.abs(Math.cos(decRad)) < 1e-12) return null;
    var cosH = (Math.sin(degToRad(altitudeDeg)) - Math.sin(latRad) * Math.sin(decRad)) /
      (cosLat * Math.cos(decRad));
    if (cosH > 1) return { kind: "below" };
    if (cosH < -1) return { kind: "above" };
    return { kind: "cross", ha: radToDeg(Math.acos(cosH)) };
  }

  function solarNoonUtcMinutes(year, month, day, longitude) {
    var jd = julianDay(year, month, day);
    var tnoon = julianCent(jd - longitude / 360);
    var eqTime = equationOfTime(tnoon);
    var solNoonOffset = 720 - longitude * 4 - eqTime;
    var newt = julianCent(jd - 0.5 + solNoonOffset / 1440);
    eqTime = equationOfTime(newt);
    return 720 - longitude * 4 - eqTime;
  }

  /* Minutes from 0h UT on the given Gregorian date. May fall outside 0–1440.
     rising true: Sun climbing through altitudeDeg. False: descending.
     One refinement, then a second, matching NOAA's sunrise iteration. */
  function crossingUtcMinutes(year, month, day, latitude, longitude, altitudeDeg, rising) {
    var JD = julianDay(year, month, day);
    function once(jd) {
      var T = julianCent(jd);
      var eqTime = equationOfTime(T);
      var dec = declination(T);
      var ha = hourAngle(latitude, dec, altitudeDeg);
      if (!ha || ha.kind !== "cross") return null;
      var haDeg = rising ? ha.ha : -ha.ha;
      var delta = longitude + haDeg;
      return 720 - 4 * delta - eqTime;
    }
    var t0 = once(JD);
    if (t0 == null) {
      var noon = solarNoonUtcMinutes(year, month, day, longitude);
      t0 = once(JD + noon / 1440);
    }
    if (t0 == null || !isFinite(t0)) return null;
    var t1 = once(JD + t0 / 1440);
    if (t1 == null || !isFinite(t1)) return t0;
    var t2 = once(JD + t1 / 1440);
    if (t2 == null || !isFinite(t2)) return t1;
    return t2;
  }

  function addUtcDays(year, month, day, delta) {
    var t = new Date(Date.UTC(year, month - 1, day + delta));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }

  function minutesAbove(year, month, day, latitude, longitude, altitudeDeg) {
    var noonMin = solarNoonUtcMinutes(year, month, day, longitude);
    var jd = julianDay(year, month, day) + noonMin / 1440;
    var dec = declination(julianCent(jd));
    if (Math.abs(latitude) >= 89.999) {
      var alt = latitude > 0 ? dec : -dec;
      return alt >= altitudeDeg ? 1440 : 0;
    }
    var ha = hourAngle(latitude, dec, altitudeDeg);
    if (!ha) {
      var altPole = geometricAltitude(jd, latitude, longitude);
      return altPole >= altitudeDeg ? 1440 : 0;
    }
    if (ha.kind === "above") return 1440;
    if (ha.kind === "below") return 0;
    var above = ha.ha * 8;
    if (above < 0) above = 0;
    if (above > 1440) above = 1440;
    return above;
  }

  function bandDurations(year, month, day, latitude, longitude) {
    var dayM = minutesAbove(year, month, day, latitude, longitude, ALT.sunrise);
    var aboveCivil = minutesAbove(year, month, day, latitude, longitude, ALT.civil);
    var aboveNaut = minutesAbove(year, month, day, latitude, longitude, ALT.nautical);
    var aboveAst = minutesAbove(year, month, day, latitude, longitude, ALT.astronomical);
    var aboveGoldLow = minutesAbove(year, month, day, latitude, longitude, ALT.goldenLow);
    var aboveGoldHigh = minutesAbove(year, month, day, latitude, longitude, ALT.goldenHigh);
    function gap(wider, narrower) {
      var d = wider - narrower;
      if (d < 0 && d > -0.05) d = 0;
      return d;
    }
    return {
      day: dayM,
      civil: gap(aboveCivil, dayM),
      nautical: gap(aboveNaut, aboveCivil),
      astronomical: gap(aboveAst, aboveNaut),
      night: gap(1440, aboveAst),
      /* Time spent between the two altitudes: above the lower line, and not above the upper line. */
      golden: gap(aboveGoldLow, aboveGoldHigh),
      blue: gap(aboveCivil, aboveGoldLow)
    };
  }

  function localMidnightMs(year, month, day, utcOffsetHours) {
    return Date.UTC(year, month - 1, day) - utcOffsetHours * 3600000;
  }

  /* Solar noon of the UTC date can fall on the previous or next civil day
     when the zone offset is large. Pick the noon that sits inside this
     clock day. Longitude 0 in UTC+12 is the case: noon is 12:00 UT, which
     is 00:00 the next calendar date in that zone, so the noon that belongs
     to the civil day is the previous UT noon. */
  function solarNoonOnLocalDay(year, month, day, lon, utcOffsetHours) {
    var midnight = localMidnightMs(year, month, day, utcOffsetHours);
    var end = midnight + 1440 * 60000;
    var start = new Date(midnight);
    var y0 = start.getUTCFullYear();
    var m0 = start.getUTCMonth() + 1;
    var d0 = start.getUTCDate();
    var shifts = [0, -1, 1, 2, -2];
    var i, dt, noonUtc, utcMs, localMin, best, bestAbs;
    best = null;
    bestAbs = Infinity;
    for (i = 0; i < shifts.length; i++) {
      dt = addUtcDays(y0, m0, d0, shifts[i]);
      noonUtc = solarNoonUtcMinutes(dt.y, dt.m, dt.d, lon);
      if (!isFinite(noonUtc)) continue;
      utcMs = Date.UTC(dt.y, dt.m - 1, dt.d) + noonUtc * 60000;
      localMin = (utcMs - midnight) / 60000;
      if (utcMs >= midnight - 500 && utcMs < end - 500) {
        return { minutes: localMin, jd: jdFromUnixMs(utcMs) };
      }
      if (Math.abs(localMin - 720) < bestAbs) {
        bestAbs = Math.abs(localMin - 720);
        best = { minutes: localMin, jd: jdFromUnixMs(utcMs) };
      }
    }
    if (best) return best;
    noonUtc = solarNoonUtcMinutes(year, month, day, lon);
    utcMs = Date.UTC(year, month - 1, day) + noonUtc * 60000;
    return { minutes: (utcMs - midnight) / 60000, jd: jdFromUnixMs(utcMs) };
  }

  function eventOnLocalDay(year, month, day, lat, lon, altitudeDeg, rising, utcOffsetHours) {
    var midnight = localMidnightMs(year, month, day, utcOffsetHours);
    var end = midnight + 1440 * 60000;
    var start = new Date(midnight);
    var y0 = start.getUTCFullYear();
    var m0 = start.getUTCMonth() + 1;
    var d0 = start.getUTCDate();
    var shifts = [0, 1, -1, 2, -2];
    var i, dt, utcMin, utcMs;
    for (i = 0; i < shifts.length; i++) {
      dt = addUtcDays(y0, m0, d0, shifts[i]);
      utcMin = crossingUtcMinutes(dt.y, dt.m, dt.d, lat, lon, altitudeDeg, rising);
      if (utcMin == null) continue;
      utcMs = Date.UTC(dt.y, dt.m - 1, dt.d) + utcMin * 60000;
      if (utcMs >= midnight - 500 && utcMs < end - 500) return (utcMs - midnight) / 60000;
    }
    return null;
  }

  function sampleCurve(year, month, day, lat, lon, utcOffsetHours, stepMin) {
    var midnight = localMidnightMs(year, month, day, utcOffsetHours);
    var n = Math.round(1440 / stepMin);
    var curve = new Array(n + 1);
    var i, localMin, jd, alt;
    var minAlt = Infinity;
    var maxAlt = -Infinity;
    var minAt = 0;
    var maxAt = 0;
    for (i = 0; i <= n; i++) {
      localMin = i * stepMin;
      jd = jdFromUnixMs(midnight + localMin * 60000);
      alt = geometricAltitude(jd, lat, lon);
      curve[i] = { t: localMin, alt: alt };
      if (alt < minAlt) { minAlt = alt; minAt = localMin; }
      if (alt > maxAlt) { maxAlt = alt; maxAt = localMin; }
    }
    return { curve: curve, minAlt: minAlt, maxAlt: maxAlt, minAt: minAt, maxAt: maxAt, stepMin: stepMin };
  }

  function bandOf(alt) {
    if (alt >= ALT.sunrise) return "day";
    if (alt >= ALT.civil) return "civil";
    if (alt >= ALT.nautical) return "nautical";
    if (alt >= ALT.astronomical) return "astronomical";
    return "night";
  }

  function segmentsFromCurve(curve) {
    var segs = [];
    var i, b, cur;
    for (i = 0; i < curve.length - 1; i++) {
      b = bandOf(curve[i].alt);
      if (!cur || cur.band !== b) {
        cur = { band: b, start: curve[i].t, end: curve[i + 1].t };
        segs.push(cur);
      } else {
        cur.end = curve[i + 1].t;
      }
    }
    return segs;
  }

  function maskIntervals(curve, inside) {
    var out = [];
    var start = null;
    var i, inn;
    for (i = 0; i < curve.length - 1; i++) {
      inn = inside(curve[i].alt);
      if (inn && start == null) start = curve[i].t;
      if (!inn && start != null) {
        out.push({ start: start, end: curve[i].t });
        start = null;
      }
    }
    if (start != null) out.push({ start: start, end: curve[curve.length - 1].t });
    return out;
  }

  function integrateMask(curve, inside) {
    var total = 0;
    var i;
    for (i = 0; i < curve.length - 1; i++) {
      if (inside(curve[i].alt)) total += curve[i + 1].t - curve[i].t;
    }
    return total;
  }

  var EVENT_DEFS = [
    { id: "astronomicalDawn", alt: ALT.astronomical, rising: true },
    { id: "nauticalDawn", alt: ALT.nautical, rising: true },
    { id: "civilDawn", alt: ALT.civil, rising: true },
    { id: "goldenDawnStart", alt: ALT.goldenLow, rising: true },
    { id: "sunrise", alt: ALT.sunrise, rising: true },
    { id: "goldenDawnEnd", alt: ALT.goldenHigh, rising: true },
    { id: "goldenDuskStart", alt: ALT.goldenHigh, rising: false },
    { id: "sunset", alt: ALT.sunrise, rising: false },
    { id: "goldenDuskEnd", alt: ALT.goldenLow, rising: false },
    { id: "civilDusk", alt: ALT.civil, rising: false },
    { id: "nauticalDusk", alt: ALT.nautical, rising: false },
    { id: "astronomicalDusk", alt: ALT.astronomical, rising: false }
  ];

  function curveCrossing(curve, altitudeDeg, rising) {
    var i, a0, a1, f;
    for (i = 0; i < curve.length - 1; i++) {
      a0 = curve[i].alt;
      a1 = curve[i + 1].alt;
      if (rising && a0 < altitudeDeg && a1 >= altitudeDeg) {
        f = (altitudeDeg - a0) / (a1 - a0);
        return curve[i].t + f * (curve[i + 1].t - curve[i].t);
      }
      if (!rising && a0 >= altitudeDeg && a1 < altitudeDeg) {
        f = (a0 - altitudeDeg) / (a0 - a1);
        return curve[i].t + f * (curve[i + 1].t - curve[i].t);
      }
    }
    return null;
  }

  function dayReport(spec) {
    var year = spec.year;
    var month = spec.month;
    var day = spec.day;
    var lat = spec.lat;
    var lon = spec.lon;
    var offset = spec.utcOffsetHours;
    var step = spec.stepMin || 1;
    var sampled = sampleCurve(year, month, day, lat, lon, offset, step);
    var noon = solarNoonOnLocalDay(year, month, day, lon, offset);
    var noonJd = noon.jd;
    var dec = declination(julianCent(noonJd));
    var eot = equationOfTime(julianCent(noonJd));
    var solarNoonLocal = noon.minutes;
    var events = {};
    var i, def, mins;
    for (i = 0; i < EVENT_DEFS.length; i++) {
      def = EVENT_DEFS[i];
      mins = eventOnLocalDay(year, month, day, lat, lon, def.alt, def.rising, offset);
      if (mins == null) mins = curveCrossing(sampled.curve, def.alt, def.rising);
      events[def.id] = mins;
    }
    var durations = bandDurations(year, month, day, lat, lon);
    var curveDurations = {
      day: integrateMask(sampled.curve, function (a) { return a >= ALT.sunrise; }),
      civil: integrateMask(sampled.curve, function (a) { return a >= ALT.civil && a < ALT.sunrise; }),
      nautical: integrateMask(sampled.curve, function (a) { return a >= ALT.nautical && a < ALT.civil; }),
      astronomical: integrateMask(sampled.curve, function (a) { return a >= ALT.astronomical && a < ALT.nautical; }),
      night: integrateMask(sampled.curve, function (a) { return a < ALT.astronomical; }),
      golden: integrateMask(sampled.curve, function (a) { return a >= ALT.goldenLow && a <= ALT.goldenHigh; }),
      blue: integrateMask(sampled.curve, function (a) { return a >= ALT.blueLow && a < ALT.blueHigh; })
    };
    var minAlt = sampled.minAlt;
    var maxAlt = sampled.maxAlt;
    var polarDay = minAlt >= ALT.sunrise;
    var polarNight = maxAlt < ALT.sunrise;
    var noTrueNight = minAlt > ALT.astronomical;
    var twilightAllNight = !polarDay && !polarNight && noTrueNight;
    var flags = {
      polarDay: polarDay,
      polarNight: polarNight,
      noTrueNight: noTrueNight,
      twilightAllNight: twilightAllNight,
      civilAllNight: twilightAllNight && minAlt > ALT.civil,
      nauticalAllNight: twilightAllNight && minAlt <= ALT.civil && minAlt > ALT.nautical,
      astronomicalAllNight: twilightAllNight && minAlt <= ALT.nautical
    };
    return {
      year: year,
      month: month,
      day: day,
      lat: lat,
      lon: lon,
      utcOffsetHours: offset,
      declination: dec,
      equationOfTime: eot,
      solarNoonLocal: solarNoonLocal,
      altitudeNoon: geometricAltitude(noonJd, lat, lon),
      altitudeMin: minAlt,
      altitudeMax: maxAlt,
      altitudeMinAt: sampled.minAt,
      altitudeMaxAt: sampled.maxAt,
      events: events,
      durations: durations,
      curveDurations: curveDurations,
      flags: flags,
      segments: segmentsFromCurve(sampled.curve),
      goldenIntervals: maskIntervals(sampled.curve, function (a) {
        return a >= ALT.goldenLow && a <= ALT.goldenHigh;
      }),
      blueIntervals: maskIntervals(sampled.curve, function (a) {
        return a >= ALT.blueLow && a < ALT.blueHigh;
      }),
      curve: sampled.curve
    };
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function yearSeries(year, latitude, longitude) {
    var n = isLeapYear(year) ? 366 : 365;
    var out = new Array(n);
    var monthDays = [31, n === 366 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var i = 0;
    var m, d, dur;
    for (m = 1; m <= 12; m++) {
      for (d = 1; d <= monthDays[m - 1]; d++) {
        dur = bandDurations(year, m, d, latitude, longitude);
        out[i] = {
          month: m,
          date: d,
          index: i,
          day: dur.day,
          civil: dur.civil,
          nautical: dur.nautical,
          astronomical: dur.astronomical,
          night: dur.night,
          golden: dur.golden,
          blue: dur.blue
        };
        i++;
      }
    }
    return out;
  }

  function formatClock(minutes) {
    if (minutes == null || !isFinite(minutes)) return null;
    var shift = 0;
    var m = minutes;
    while (m < -0.5) { m += 1440; shift -= 1; }
    while (m >= 1439.5) { m -= 1440; shift += 1; }
    var rounded = Math.round(m);
    if (rounded === 1440) { rounded = 0; shift += 1; }
    if (rounded < 0) rounded = 0;
    var hh = Math.floor(rounded / 60);
    var mm = rounded % 60;
    var text = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
    if (shift === -1) text += " (previous day)";
    else if (shift === 1) text += " (next day)";
    else if (shift !== 0) text += shift < 0 ? " (" + (-shift) + " days earlier)" : " (" + shift + " days later)";
    return text;
  }

  function formatDuration(mins) {
    if (mins == null || !isFinite(mins)) return "—";
    var m = Math.round(mins);
    if (m < 0) m = 0;
    var h = Math.floor(m / 60);
    var r = m % 60;
    if (h <= 0) return r + " min";
    if (r === 0) return h + " h";
    return h + " h " + r + " min";
  }

  function formatSigned(n, digits, unit) {
    if (!isFinite(n)) return "—";
    var sign = n > 0 ? "+" : n < 0 ? "−" : "";
    var v = Math.abs(n);
    var text = v.toFixed(digits);
    return sign + text + (unit || "");
  }

  function zoneOffsetHours(timeZone, utcMs) {
    var fmt, parts, i, name, match, sign, hours, minutes;
    try {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone,
        timeZoneName: "shortOffset",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      });
    } catch (err) {
      return NaN;
    }
    parts = fmt.formatToParts(new Date(utcMs));
    name = "";
    for (i = 0; i < parts.length; i++) {
      if (parts[i].type === "timeZoneName") name = parts[i].value;
    }
    if (name === "GMT" || name === "UTC") return 0;
    match = /(?:GMT|UTC)([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
    if (!match) return NaN;
    sign = match[1] === "-" ? -1 : 1;
    hours = +match[2];
    minutes = match[3] ? +match[3] : 0;
    return sign * (hours + minutes / 60);
  }

  function zoneAbbrev(timeZone, utcMs) {
    var fmt, parts, i;
    try {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone,
        timeZoneName: "short"
      });
    } catch (err) {
      return timeZone;
    }
    parts = fmt.formatToParts(new Date(utcMs));
    for (i = 0; i < parts.length; i++) {
      if (parts[i].type === "timeZoneName") return parts[i].value;
    }
    return timeZone;
  }

  function offsetLabel(hours) {
    if (!isFinite(hours)) return "UTC";
    var sign = hours < 0 ? "−" : "+";
    var abs = Math.abs(hours);
    var h = Math.floor(abs + 1e-9);
    var m = Math.round((abs - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    if (h === 0 && m === 0) return "UTC";
    return "UTC" + sign + h + (m ? ":" + (m < 10 ? "0" : "") + m : "");
  }

  return {
    ALT: ALT,
    PRESETS: PRESETS,
    EVENT_DEFS: EVENT_DEFS,
    presetById: presetById,
    julianDay: julianDay,
    julianCent: julianCent,
    declination: declination,
    equationOfTime: equationOfTime,
    geometricAltitude: geometricAltitude,
    hourAngle: hourAngle,
    solarNoonUtcMinutes: solarNoonUtcMinutes,
    crossingUtcMinutes: crossingUtcMinutes,
    minutesAbove: minutesAbove,
    bandDurations: bandDurations,
    dayReport: dayReport,
    yearSeries: yearSeries,
    isLeapYear: isLeapYear,
    formatClock: formatClock,
    formatDuration: formatDuration,
    formatSigned: formatSigned,
    zoneOffsetHours: zoneOffsetHours,
    zoneAbbrev: zoneAbbrev,
    offsetLabel: offsetLabel,
    bandOf: bandOf
  };
});
