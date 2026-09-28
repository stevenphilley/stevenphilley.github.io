/*!
 * Sidereal Moon, Mars, Venus, and ascendant for kundali matching.
 *
 * Tropical positions: Astronomy Engine 2.1.19 (Don Cross, MIT), vendored
 * at /js/vendor/astronomy.js. The Moon is the Brown / Improved Lunar
 * Ephemeris series as given by Montenbruck & Pfleger. Mars and Venus are
 * geocentric apparent positions (light-time and aberration).
 *
 * Lahiri (Chitrapaksha) ayanamsa, true of date:
 *   Mean value anchored to the Indian Astronomical Ephemeris definition
 *   used by Swiss Ephemeris SE_SIDM_LAHIRI:
 *     epoch JD 2435553.5 TT (1956 March 21, 0h TT)
 *     mean ayanamsa 23.250182778° − 0.004658035°
 *       (IAE 1989 p. 556 value, with the epoch nutation removed)
 *   Precession in longitude: IAU 2006 / Capitaine polynomial.
 *   Nutation in longitude: IAU 2000B, from Astronomy Engine e_tilt().dpsi.
 *   True ayanamsa = mean + nutation.
 *   This is a computed angle, not a constant. It follows the published
 *   Swiss Ephemeris / Jagannatha Hora January 1 table to about 1″.
 *
 * Local civil time is turned into UTC with Intl and the IANA zone, so
 * historical offsets (including Asia/Kolkata before 1906, and the
 * 1942–1945 +6:30 wartime offset) come from the platform timezone data.
 */
(function (root, factory) {
  var Astronomy = (typeof module === "object" && module.exports)
    ? require("../../js/vendor/astronomy.js")
    : root.Astronomy;
  var api = factory(Astronomy);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KundaliEphem = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Astronomy) {
  "use strict";

  if (!Astronomy || !Astronomy.EclipticGeoMoon) {
    throw new Error("Astronomy Engine did not load");
  }

  var JD_LAHIRI = 2435553.5;
  var AYAN_MEAN_AT_EPOCH = 23.250182778 - 0.004658035;
  var J2000 = 2451545.0;

  function precessionArcsec(T) {
    return 5028.796195 * T +
      1.1054348 * T * T +
      0.00007964 * T * T * T -
      0.000023857 * T * T * T * T -
      0.0000000383 * T * T * T * T * T;
  }

  function norm360(deg) {
    var x = deg % 360;
    if (x < 0) x += 360;
    return x;
  }

  function lahiriAyanamsa(date) {
    var time = Astronomy.MakeTime(date);
    var T = time.tt / 36525;
    var T0 = (JD_LAHIRI - J2000) / 36525;
    var mean = AYAN_MEAN_AT_EPOCH + (precessionArcsec(T) - precessionArcsec(T0)) / 3600;
    var nut = Astronomy.e_tilt(time).dpsi / 3600;
    return {
      meanDeg: mean,
      nutationDeg: nut,
      trueDeg: mean + nut,
      tt: time.tt
    };
  }

  function tropicalMoon(date) {
    var moon = Astronomy.EclipticGeoMoon(date);
    return { lon: norm360(moon.lon), lat: moon.lat, distAu: moon.dist };
  }

  function tropicalBody(name, date) {
    var body = Astronomy.Body[name];
    if (!body) throw new Error("Unknown body " + name);
    var vec = Astronomy.GeoVector(body, date, true);
    var ecl = Astronomy.Ecliptic(vec);
    return { lon: norm360(ecl.elon), lat: ecl.elat };
  }

  function siderealLongitude(tropicalLon, ayanamsaDeg) {
    return norm360(tropicalLon - ayanamsaDeg);
  }

  function greenwichSiderealHours(date) {
    return Astronomy.SiderealTime(date);
  }

  function trueObliquity(date) {
    return Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl;
  }

  /**
   * Tropical ascendant, degrees, true equinox of date.
   * ramcDeg is local sidereal time in degrees (GAST + east longitude).
   * latDeg is geographic latitude, north positive.
   */
  function tropicalAscendant(ramcDeg, latDeg, obliquityDeg) {
    var ramc = ramcDeg * Math.PI / 180;
    var lat = latDeg * Math.PI / 180;
    var eps = obliquityDeg * Math.PI / 180;
    var y = Math.cos(ramc);
    var x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
    var asc = Math.atan2(y, x) * 180 / Math.PI;
    return norm360(asc);
  }

  function ascendant(date, latDeg, lonEastDeg) {
    var gast = greenwichSiderealHours(date);
    var ramc = norm360(gast * 15 + lonEastDeg);
    var obl = trueObliquity(date);
    var tropical = tropicalAscendant(ramc, latDeg, obl);
    var ayan = lahiriAyanamsa(date);
    return {
      gastHours: gast,
      ramcDeg: ramc,
      obliquityDeg: obl,
      tropicalLon: tropical,
      ayanamsaDeg: ayan.trueDeg,
      siderealLon: siderealLongitude(tropical, ayan.trueDeg)
    };
  }

  function formatDMS(deg, secDigits) {
    if (secDigits == null) secDigits = 1;
    var sign = deg < 0 ? -1 : 1;
    var x = Math.abs(deg);
    var d = Math.floor(x);
    var mf = (x - d) * 60;
    var m = Math.floor(mf);
    var s = (mf - m) * 60;
    if (s >= 60 - 5e-7) {
      s = 0;
      m += 1;
    }
    if (m >= 60) {
      m = 0;
      d += 1;
    }
    var text = (sign < 0 ? "−" : "") + d + "° " +
      String(m).padStart(2, "0") + "′ " +
      s.toFixed(secDigits) + "″";
    return text;
  }

  function zonedParts(ms, timeZone) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    var p = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 };
    fmt.formatToParts(new Date(ms)).forEach(function (part) {
      if (part.type !== "literal") p[part.type] = +part.value;
    });
    if (p.hour === 24) p.hour = 0;
    return p;
  }

  function partsMatch(p, y, m, d, h, min, sec) {
    return p.year === y && p.month === m && p.day === d &&
      p.hour === h && p.minute === min && p.second === sec;
  }

  /**
   * Civil local time in an IANA zone → UTC Date.
   * exists: false when the clock time falls in a DST gap.
   * ambiguous: true when the clock time occurs twice (fall back).
   * On an overlap the earlier UTC instant is returned.
   */
  function wallTimeToUtc(y, m, d, h, min, sec, timeZone) {
    var desired = Date.UTC(y, m - 1, d, h, min, sec);
    var utc = desired;
    var i;
    for (i = 0; i < 4; i++) {
      var p = zonedParts(utc, timeZone);
      var got = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      var diff = desired - got;
      if (diff === 0) break;
      utc += diff;
    }
    var back = zonedParts(utc, timeZone);
    var exists = partsMatch(back, y, m, d, h, min, sec);
    var instants = [];
    if (exists) instants.push(utc);
    var step;
    for (step = -3; step <= 3; step++) {
      if (step === 0) continue;
      var t = utc + step * 3600000;
      var q = zonedParts(t, timeZone);
      if (partsMatch(q, y, m, d, h, min, sec)) instants.push(t);
    }
    instants = instants.filter(function (t, idx, arr) {
      return arr.indexOf(t) === idx;
    }).sort(function (a, b) { return a - b; });
    var chosen = instants.length ? instants[0] : utc;
    var chosenParts = zonedParts(chosen, timeZone);
    var asUtc = Date.UTC(chosenParts.year, chosenParts.month - 1, chosenParts.day, chosenParts.hour, chosenParts.minute, chosenParts.second);
    return {
      date: new Date(chosen),
      exists: exists,
      ambiguous: instants.length > 1,
      offsetSeconds: exists ? Math.round((asUtc - chosen) / 1000) : null
    };
  }

  function parseOffset(text) {
    var raw = String(text == null ? "" : text).trim();
    if (!raw) return null;
    var sign = 1;
    if (raw[0] === "+") raw = raw.slice(1);
    else if (raw[0] === "-") { sign = -1; raw = raw.slice(1); }
    var hours;
    if (raw.indexOf(":") !== -1) {
      var bits = raw.split(":");
      var h = +bits[0];
      var m = +(bits[1] || 0);
      var s = +(bits[2] || 0);
      if (!isFinite(h) || !isFinite(m) || !isFinite(s)) return null;
      hours = h + m / 60 + s / 3600;
    } else {
      hours = +raw;
      if (!isFinite(hours)) return null;
    }
    hours *= sign;
    if (hours < -14 || hours > 14) return null;
    return hours;
  }

  function utcFromOffset(y, m, d, h, min, sec, offsetHours) {
    return new Date(Date.UTC(y, m - 1, d, h, min, sec) - offsetHours * 3600000);
  }

  function sky(date) {
    var ayan = lahiriAyanamsa(date);
    var moon = tropicalMoon(date);
    var mars = tropicalBody("Mars", date);
    var venus = tropicalBody("Venus", date);
    return {
      ayanamsa: ayan,
      moon: {
        tropical: moon.lon,
        latitude: moon.lat,
        sidereal: siderealLongitude(moon.lon, ayan.trueDeg)
      },
      mars: {
        tropical: mars.lon,
        sidereal: siderealLongitude(mars.lon, ayan.trueDeg)
      },
      venus: {
        tropical: venus.lon,
        sidereal: siderealLongitude(venus.lon, ayan.trueDeg)
      }
    };
  }

  return {
    Astronomy: Astronomy,
    lahiriAyanamsa: lahiriAyanamsa,
    tropicalMoon: tropicalMoon,
    tropicalBody: tropicalBody,
    siderealLongitude: siderealLongitude,
    greenwichSiderealHours: greenwichSiderealHours,
    trueObliquity: trueObliquity,
    tropicalAscendant: tropicalAscendant,
    ascendant: ascendant,
    formatDMS: formatDMS,
    wallTimeToUtc: wallTimeToUtc,
    parseOffset: parseOffset,
    utcFromOffset: utcFromOffset,
    sky: sky
  };
});
