/*! Sundial and shadow length.
    Solar altitude, azimuth, declination, and the equation of time follow
    NOAA's solar calculator (Global Monitoring Laboratory), which uses
    Jean Meeus, Astronomical Algorithms:
    https://gml.noaa.gov/grad/solcalc/calcdetails.html
    Longitude is positive east, as in NOAA's solar-equations note and the
    twilight desk on this site. Geometric altitude of the Sun's center.
    Atmospheric refraction is not applied.
    A horizontal dial's hour lines use tan θ = sin φ · tan(15° × (t − 12)),
    the relation Carl Sabanski prints for a polar-pointing style whose
    angle equals the latitude:
    https://mysundial.ca/tsp/horizontal_sundial.html
    Classroom calculator. Not for navigation or survey. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Sundial = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Earth Fact Sheet obliquity, the same 23.44° the seasons and refraction
     desks use. The tropic and arctic-circle presets are this angle and
     90° minus this angle. They are not a surveyed monument. */
  var OBLIQUITY = 23.44;

  var PRESETS = [
    {
      id: "campbell",
      label: "Campbell, CA",
      lat: 37.287,
      lon: -121.95,
      standardOffset: -8,
      dstRule: "us",
      timeZone: "America/Los_Angeles",
      note: "37.287° N, 121.950° W"
    },
    {
      id: "equator",
      label: "Equator",
      lat: 0,
      lon: 0,
      standardOffset: 0,
      dstRule: "none",
      timeZone: "Etc/UTC",
      note: "0°, 0° · UTC"
    },
    {
      id: "cancer",
      label: "Tropic of Cancer",
      lat: OBLIQUITY,
      lon: 0,
      standardOffset: 0,
      dstRule: "none",
      timeZone: "Etc/UTC",
      note: "23.44° N · the fact-sheet obliquity · longitude 0°"
    },
    {
      id: "arctic",
      label: "Arctic Circle",
      lat: 90 - OBLIQUITY,
      lon: 0,
      standardOffset: 0,
      dstRule: "none",
      timeZone: "Etc/UTC",
      note: "66.56° N · 90° minus 23.44° · longitude 0°"
    },
    {
      id: "sydney",
      label: "Sydney",
      lat: -33.87,
      lon: 151.21,
      standardOffset: 10,
      dstRule: "au",
      timeZone: "Australia/Sydney",
      note: "33.87° S, 151.21° E"
    }
  ];

  var HEIGHTS = [
    { id: "person", label: "1.8 m person", meters: 1.8 },
    { id: "stick", label: "1 m stick", meters: 1 }
  ];

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function degToRad(d) { return Math.PI * d / 180; }
  function radToDeg(r) { return 180 * r / Math.PI; }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function wrap360(x) {
    var y = x % 360;
    if (y < 0) y += 360;
    return y;
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function daysInMonth(year, month) {
    var lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return lengths[month - 1];
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

  /* Minutes. Positive: apparent solar time is ahead of mean solar time. */
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

  function solarNoonUtcMinutes(year, month, day, longitude) {
    var jd = julianDay(year, month, day);
    var tnoon = julianCent(jd - longitude / 360);
    var eqTime = equationOfTime(tnoon);
    var solNoonOffset = 720 - longitude * 4 - eqTime;
    var newt = julianCent(jd + solNoonOffset / 1440);
    eqTime = equationOfTime(newt);
    return 720 - longitude * 4 - eqTime;
  }

  /* NOAA azimuth: degrees clockwise from north.
     The arccos form is the one in NOAA's calculator. Its denominator
     vanishes at the zenith and at the poles, so those two cases use the
     east/north atan2, which is the same angle everywhere else. */
  function azimuthNOAA(lat, dec, zenith, hourAngle) {
    var latRad = degToRad(lat);
    var decRad = degToRad(dec);
    var zenRad = degToRad(zenith);
    var azDenom = Math.cos(latRad) * Math.sin(zenRad);
    var azimuth;
    if (Math.abs(azDenom) > 0.001) {
      var azRad = (Math.sin(latRad) * Math.cos(zenRad) - Math.sin(decRad)) / azDenom;
      if (azRad > 1) azRad = 1;
      else if (azRad < -1) azRad = -1;
      azimuth = 180 - radToDeg(Math.acos(azRad));
      if (hourAngle > 0) azimuth = -azimuth;
    } else {
      var haRad = degToRad(hourAngle);
      var east = -Math.cos(decRad) * Math.sin(haRad);
      var north = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(haRad);
      azimuth = radToDeg(Math.atan2(east, north));
    }
    return wrap360(azimuth);
  }

  function altitudeZenith(lat, dec, hourAngle) {
    var haRad = degToRad(hourAngle);
    var latRad = degToRad(lat);
    var decRad = degToRad(dec);
    var csz = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    if (csz > 1) csz = 1;
    else if (csz < -1) csz = -1;
    var zenith = radToDeg(Math.acos(csz));
    return { altitude: 90 - zenith, zenith: zenith };
  }

  /* Local clock on the given Gregorian date. utcOffsetHours is the offset
     in use, including daylight saving if the clock has been moved. */
  function positionAt(spec) {
    var year = spec.year;
    var month = spec.month;
    var day = spec.day;
    var hour = spec.hour || 0;
    var minute = spec.minute || 0;
    var second = spec.second || 0;
    var lat = spec.lat;
    var lon = spec.lon;
    var offset = spec.utcOffsetHours;
    var localMinutes = hour * 60 + minute + second / 60;
    var utcMinutes = localMinutes - offset * 60;
    var jd = julianDay(year, month, day) + utcMinutes / 1440;
    var T = julianCent(jd);
    var eqTime = equationOfTime(T);
    var dec = declination(T);
    var trueSolar = utcMinutes + eqTime + 4 * lon;
    trueSolar = ((trueSolar % 1440) + 1440) % 1440;
    var hourAngle = trueSolar / 4 - 180;
    if (hourAngle < -180) hourAngle += 360;
    var alt = altitudeZenith(lat, dec, hourAngle);
    var azimuth = azimuthNOAA(lat, dec, alt.zenith, hourAngle);
    var clockDiff = eqTime + 4 * lon - 60 * offset;
    return {
      altitude: alt.altitude,
      zenith: alt.zenith,
      azimuth: azimuth,
      declination: dec,
      equationOfTime: eqTime,
      hourAngle: hourAngle,
      trueSolarMinutes: trueSolar,
      clockDiffMinutes: clockDiff,
      julianDay: jd
    };
  }

  function solarNoonLocalMinutes(year, month, day, longitude, utcOffsetHours) {
    return solarNoonUtcMinutes(year, month, day, longitude) + utcOffsetHours * 60;
  }

  /* Below this altitude a 1.8 m person would throw a shadow longer than
     about 500 m. The length is not a useful figure, and a noon Sun this
     close to the horizon is the polar-night edge of the approximation. */
  var HORIZON_ALT = 0.2;

  /* Vertical object on level ground. Geometric altitude, no refraction.
     Null when the Sun is below the horizon or within HORIZON_ALT of it. */
  function shadowLength(heightM, altitudeDeg) {
    if (!(heightM > 0) || !isFinite(altitudeDeg)) return null;
    if (altitudeDeg <= HORIZON_ALT) return null;
    if (altitudeDeg >= 89.95) return 0;
    var meters = heightM / Math.tan(degToRad(altitudeDeg));
    if (!isFinite(meters) || meters < 0) return null;
    return meters;
  }

  /* Shadow of a vertical object, meters east and north of its base.
     Azimuth is the Sun's, clockwise from north. */
  function verticalShadow(heightM, altitudeDeg, sunAzimuthDeg) {
    var length = shadowLength(heightM, altitudeDeg);
    if (length == null) return null;
    var shadowAz = wrap360(sunAzimuthDeg + 180);
    return {
      length: length,
      azimuth: shadowAz,
      east: length * Math.sin(degToRad(shadowAz)),
      north: length * Math.cos(degToRad(shadowAz))
    };
  }

  /* Hour-line angle of a horizontal dial, degrees from the north toward the east.
     θ = arctan(sin φ · tan H), written as atan2 so the line stays continuous
     past 6 a.m. and 6 p.m. H is 15° × (t − 12), negative in the morning.
     At the equator sin φ is 0 and every line falls on the north–south line. */
  function hourLineAngle(latDeg, hoursFromNoon) {
    var H = degToRad(15 * hoursFromNoon);
    return radToDeg(Math.atan2(Math.sin(degToRad(latDeg)) * Math.sin(H), Math.cos(H)));
  }

  /* The ray the style's shadow occupies. Northern noon points north.
     Southern noon points south. */
  function shadowRayAngle(latDeg, hoursFromNoon) {
    var line = hourLineAngle(latDeg, hoursFromNoon);
    if (latDeg < 0) return wrap360(line + 180);
    return wrap360(line);
  }

  /* Nodus on a polar style, a height `height` above the plate.
     Returns meters east and north of the dial center, in units of `height`
     when height is 1. Null when the Sun is on or below the horizon.
     Within half a degree of the equator the style lies on the plate, so the
     point used is a vertical stick of the same height at the center. */
  function nodusShadow(latDeg, altitudeDeg, sunAzimuthDeg, height) {
    if (!(height > 0) || !(altitudeDeg > 0)) return null;
    var alt = degToRad(altitudeDeg);
    var az = degToRad(sunAzimuthDeg);
    var sz = Math.sin(alt);
    if (sz < 1e-6) return null;
    var sx = Math.sin(az) * Math.cos(alt);
    var sy = Math.cos(az) * Math.cos(alt);
    var nx = 0;
    var ny = 0;
    var nz = height;
    if (Math.abs(latDeg) >= 0.5) {
      var reach = height / Math.tan(degToRad(Math.abs(latDeg)));
      ny = (latDeg > 0 ? 1 : -1) * reach;
    }
    var t = nz / sz;
    return {
      east: nx - t * sx,
      north: ny - t * sy,
      footNorth: ny,
      styleFlat: Math.abs(latDeg) < 0.5
    };
  }

  function eachDay(year, fn) {
    var month;
    var out = [];
    for (month = 1; month <= 12; month++) {
      var dim = daysInMonth(year, month);
      var day;
      for (day = 1; day <= dim; day++) out.push(fn(year, month, day));
    }
    return out;
  }

  function noonOn(year, month, day, lat, lon, utcOffsetHours, heightM) {
    var noonLocal = solarNoonLocalMinutes(year, month, day, lon, utcOffsetHours);
    var shift = 0;
    var minutes = noonLocal;
    while (minutes < 0) { minutes += 1440; shift -= 1; }
    while (minutes >= 1440) { minutes -= 1440; shift += 1; }
    var date = shiftDate(year, month, day, shift);
    var pos = positionAt({
      year: date.year,
      month: date.month,
      day: date.day,
      hour: Math.floor(minutes / 60),
      minute: 0,
      second: (minutes % 60) * 60,
      lat: lat,
      lon: lon,
      utcOffsetHours: utcOffsetHours
    });
    /* The split above can drop a fraction of a second. Recompute from the
       exact solar-noon minute so the hour angle is zero within rounding. */
    var utc = solarNoonUtcMinutes(year, month, day, lon);
    var jd = julianDay(year, month, day) + utc / 1440;
    var T = julianCent(jd);
    var dec = declination(T);
    var eq = equationOfTime(T);
    var alt = altitudeZenith(lat, dec, 0);
    var az = azimuthNOAA(lat, dec, alt.zenith, 0);
    return {
      year: year,
      month: month,
      day: day,
      declination: dec,
      equationOfTime: eq,
      altitude: alt.altitude,
      azimuth: az,
      shadow: shadowLength(heightM, alt.altitude),
      solarNoonLocal: noonLocal,
      position: pos
    };
  }

  function shiftDate(year, month, day, shift) {
    var utc = Date.UTC(year, month - 1, day) + shift * 86400000;
    var d = new Date(utc);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }

  function yearNoonShadows(lat, lon, utcOffsetHours, heightM, year) {
    return eachDay(year, function (y, m, d) {
      var row = noonOn(y, m, d, lat, lon, utcOffsetHours, heightM);
      return {
        month: m,
        day: d,
        doy: dayOfYear(y, m, d),
        declination: row.declination,
        altitude: row.altitude,
        equationOfTime: row.equationOfTime,
        shadow: row.shadow
      };
    });
  }

  function dayOfYear(year, month, day) {
    var n = day;
    var m;
    for (m = 1; m < month; m++) n += daysInMonth(year, m);
    return n;
  }

  function equationOfTimeExtremes(yearStart, yearEnd) {
    var min = Infinity;
    var max = -Infinity;
    var year;
    for (year = yearStart; year <= yearEnd; year++) {
      eachDay(year, function (y, m, d) {
        var utc = solarNoonUtcMinutes(y, m, d, 0);
        var T = julianCent(julianDay(y, m, d) + utc / 1440);
        var eq = equationOfTime(T);
        if (eq < min) min = eq;
        if (eq > max) max = eq;
      });
    }
    return { min: min, max: max };
  }

  function nthSunday(year, month, n) {
    var firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return 1 + (7 - firstDow) % 7 + (n - 1) * 7;
  }

  /* Civil-date sketch of the usual rules, for the preset button only.
     The toggle itself is the control. The transition hour is not modeled. */
  function dstInEffect(rule, year, month, day) {
    if (rule === "us") {
      var start = nthSunday(year, 3, 2);
      var end = nthSunday(year, 11, 1);
      if (month < 3 || month > 11) return false;
      if (month > 3 && month < 11) return true;
      if (month === 3) return day >= start;
      return day < end;
    }
    if (rule === "au") {
      var begin = nthSunday(year, 10, 1);
      var finish = nthSunday(year, 4, 1);
      if (month > 10 || month < 4) return true;
      if (month === 10) return day >= begin;
      if (month === 4) return day < finish;
      return false;
    }
    return false;
  }

  function effectiveOffset(standardOffset, dst) {
    return standardOffset + (dst ? 1 : 0);
  }

  function parseNumber(raw, lo, hi) {
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    var text = String(raw).replace(/\u2212/g, "-").trim();
    if (!text || !/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(text)) return null;
    var n = Number(text);
    if (!isFinite(n) || n < lo || n > hi) return null;
    return n;
  }

  function formatDegrees(deg, digits) {
    if (!isFinite(deg)) return "—";
    var d = digits == null ? 1 : digits;
    var sign = deg < 0 ? "\u2212" : "";
    return sign + Math.abs(deg).toFixed(d) + "\u00b0";
  }

  function formatLat(deg) {
    if (!isFinite(deg)) return "—";
    var hemi = deg > 0 ? "N" : deg < 0 ? "S" : "";
    var body = Math.abs(deg).toFixed(2) + "\u00b0";
    return hemi ? body + " " + hemi : body;
  }

  function formatLon(deg) {
    if (!isFinite(deg)) return "—";
    var hemi = deg > 0 ? "E" : deg < 0 ? "W" : "";
    var body = Math.abs(deg).toFixed(2) + "\u00b0";
    return hemi ? body + " " + hemi : body;
  }

  function formatMeters(m) {
    if (m == null || !isFinite(m)) return "—";
    if (m === 0) return "0 m";
    if (m >= 100) return m.toFixed(0) + " m";
    if (m >= 10) return m.toFixed(1) + " m";
    return m.toFixed(2) + " m";
  }

  function formatSignedMinutes(min) {
    if (!isFinite(min)) return "—";
    var sign = min > 0.05 ? "+" : min < -0.05 ? "\u2212" : "";
    var v = Math.abs(min);
    var text = v.toFixed(1) + " min";
    return sign ? sign + text : text;
  }

  function formatClock(minutes) {
    if (!isFinite(minutes)) return "—";
    var m = minutes;
    var shift = 0;
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

  var COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

  function compassPoint(azimuthDeg) {
    if (!isFinite(azimuthDeg)) return "—";
    var i = Math.round(wrap360(azimuthDeg) / 22.5) % 16;
    return COMPASS[i];
  }

  function offsetLabel(hours) {
    if (!isFinite(hours)) return "UTC";
    var sign = hours < 0 ? "\u2212" : "+";
    var abs = Math.abs(hours);
    var h = Math.floor(abs + 1e-9);
    var m = Math.round((abs - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    if (h === 0 && m === 0) return "UTC";
    return "UTC" + sign + h + (m ? ":" + (m < 10 ? "0" : "") + m : "");
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

  function nowParts(utcOffsetHours, utcMs) {
    var ms = (utcMs == null ? Date.now() : utcMs) + utcOffsetHours * 3600000;
    var d = new Date(ms);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes()
    };
  }

  function scene(state) {
    var lat = state.lat;
    var lon = state.lon;
    var height = state.heightM;
    var offset = state.utcOffsetHours;
    if (!isFinite(lat) || lat < -90 || lat > 90) return { ok: false, error: "Latitude is a number from −90 to 90." };
    if (!isFinite(lon) || lon < -180 || lon > 180) return { ok: false, error: "Longitude is a number from −180 to 180. East is positive." };
    if (!isFinite(height) || height < 0.05 || height > 100) return { ok: false, error: "Height is a number from 0.05 m to 100 m." };
    if (!isFinite(offset) || offset < -12 || offset > 14) return { ok: false, error: "UTC offset is a number from −12 to +14 hours." };
    if (!isFinite(state.year) || state.year < 1800 || state.year > 2100) return { ok: false, error: "The year is from 1800 to 2100. NOAA calls the approximations good in that span." };
    if (!isFinite(state.month) || state.month < 1 || state.month > 12) return { ok: false, error: "Month is 1 to 12." };
    var dim = daysInMonth(state.year, state.month);
    if (!isFinite(state.day) || state.day < 1 || state.day > dim) return { ok: false, error: "That day is not in the month." };
    if (!isFinite(state.hour) || state.hour < 0 || state.hour > 23) return { ok: false, error: "Hour is 0 to 23." };
    if (!isFinite(state.minute) || state.minute < 0 || state.minute > 59) return { ok: false, error: "Minute is 0 to 59." };

    var pos = positionAt({
      year: state.year,
      month: state.month,
      day: state.day,
      hour: state.hour,
      minute: state.minute,
      second: 0,
      lat: lat,
      lon: lon,
      utcOffsetHours: offset
    });
    var shadow = verticalShadow(height, pos.altitude, pos.azimuth);
    var noon = noonOn(state.year, state.month, state.day, lat, lon, offset, height);
    var below = pos.altitude <= 0;
    var overhead = pos.altitude >= 89.95;
    return {
      ok: true,
      lat: lat,
      lon: lon,
      heightM: height,
      utcOffsetHours: offset,
      altitude: pos.altitude,
      azimuth: pos.azimuth,
      declination: pos.declination,
      equationOfTime: pos.equationOfTime,
      hourAngle: pos.hourAngle,
      clockDiffMinutes: pos.clockDiffMinutes,
      trueSolarMinutes: pos.trueSolarMinutes,
      solarNoonLocal: noon.solarNoonLocal,
      noonAltitude: noon.altitude,
      noonShadow: noon.shadow,
      noonDeclination: noon.declination,
      shadow: shadow,
      below: below,
      overhead: overhead,
      styleAngle: Math.abs(lat),
      stylePoints: lat > 0 ? "north" : lat < 0 ? "south" : "along the plate",
      hourLinesCollapse: Math.abs(lat) < 0.5
    };
  }

  return {
    OBLIQUITY: OBLIQUITY,
    HORIZON_ALT: HORIZON_ALT,
    PRESETS: PRESETS,
    HEIGHTS: HEIGHTS,
    presetById: presetById,
    julianDay: julianDay,
    julianCent: julianCent,
    declination: declination,
    equationOfTime: equationOfTime,
    solarNoonUtcMinutes: solarNoonUtcMinutes,
    solarNoonLocalMinutes: solarNoonLocalMinutes,
    positionAt: positionAt,
    shadowLength: shadowLength,
    verticalShadow: verticalShadow,
    hourLineAngle: hourLineAngle,
    shadowRayAngle: shadowRayAngle,
    nodusShadow: nodusShadow,
    noonOn: noonOn,
    yearNoonShadows: yearNoonShadows,
    equationOfTimeExtremes: equationOfTimeExtremes,
    dayOfYear: dayOfYear,
    daysInMonth: daysInMonth,
    isLeapYear: isLeapYear,
    nthSunday: nthSunday,
    dstInEffect: dstInEffect,
    effectiveOffset: effectiveOffset,
    parseNumber: parseNumber,
    formatDegrees: formatDegrees,
    formatLat: formatLat,
    formatLon: formatLon,
    formatMeters: formatMeters,
    formatSignedMinutes: formatSignedMinutes,
    formatClock: formatClock,
    compassPoint: compassPoint,
    offsetLabel: offsetLabel,
    zoneOffsetHours: zoneOffsetHours,
    nowParts: nowParts,
    scene: scene,
    shiftDate: shiftDate
  };
});
