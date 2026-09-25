/*! annual-dial-ics.js — downloadable iCalendar reminders for Annual Dial.
 *
 *  Timed marks become VEVENTs. Date-only marks are omitted (they are not
 *  reminders). Yearly marks get RRULE:FREQ=YEARLY.
 *
 *  Wall-clock times use TZID plus a VTIMEZONE built from the zone's real
 *  offsets, so 9:30 stays 9:30 in the visitor's calendar. UTC zones use
 *  Zulu times. VALARM TRIGGER is a duration (PT0S at the event, or a
 *  negative lead such as -PT15M).
 *
 *  Output is CRLF, with UID, DTSTAMP, and TEXT escaping (\\ \; \, \n).
 */
(function (root) {
  "use strict";

  var ALARMS = {
    PT0S: "PT0S",
    "-PT15M": "-PT15M",
    "-PT1H": "-PT1H",
    "-P1D": "-P1D",
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function escText(s) {
    return String(s == null ? "" : s)
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  }

  function foldLine(line) {
    var encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
    function octets(ch) {
      if (!encoder) return ch.length;
      return encoder.encode(ch).length;
    }
    var total = 0;
    for (var i = 0; i < line.length;) {
      var cp = line.codePointAt(i);
      var ch = String.fromCodePoint(cp);
      total += octets(ch);
      i += ch.length;
    }
    if (total <= 75) return line;
    var out = "";
    var bytes = 0;
    var limit = 75;
    for (var j = 0; j < line.length;) {
      var cp2 = line.codePointAt(j);
      var ch2 = String.fromCodePoint(cp2);
      var n = octets(ch2);
      if (bytes + n > limit) {
        out += "\r\n ";
        bytes = 1;
        limit = 75;
      }
      out += ch2;
      bytes += n;
      j += ch2.length;
    }
    return out;
  }

  function joinCrlf(lines) {
    var folded = [];
    for (var i = 0; i < lines.length; i++) folded.push(foldLine(lines[i]));
    return folded.join("\r\n") + "\r\n";
  }

  function stampUTC(date) {
    return date.getUTCFullYear() +
      pad2(date.getUTCMonth() + 1) +
      pad2(date.getUTCDate()) + "T" +
      pad2(date.getUTCHours()) +
      pad2(date.getUTCMinutes()) +
      pad2(date.getUTCSeconds()) + "Z";
  }

  function wallStamp(isoDate, hhmm) {
    var d = String(isoDate).replace(/-/g, "");
    var t = String(hhmm).replace(":", "") + "00";
    return d + "T" + t;
  }

  function fnv(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function isUtcZone(tz) {
    var z = String(tz || "").trim();
    return !z || z === "UTC" || z === "Etc/UTC" || z === "Etc/GMT" || z === "GMT" || z === "Z";
  }

  function zoneOffsetMinutes(utcDate, timeZone) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    var parts = fmt.formatToParts(utcDate);
    var map = {};
    parts.forEach(function (p) { if (p.type !== "literal") map[p.type] = p.value; });
    var hour = +map.hour;
    var day = +map.day;
    if (hour === 24) { hour = 0; day += 1; }
    var asUTC = Date.UTC(+map.year, +map.month - 1, day, hour, +map.minute, +map.second);
    return Math.round((asUTC - utcDate.getTime()) / 60000);
  }

  function formatOffset(mins) {
    var sign = mins >= 0 ? "+" : "-";
    var a = Math.abs(mins);
    return sign + pad2(Math.floor(a / 60)) + pad2(a % 60);
  }

  function formatWallFromUtc(utcMs, offsetMin) {
    var d = new Date(utcMs + offsetMin * 60000);
    return d.getUTCFullYear() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) + "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds());
  }

  function tzName(utcDate, timeZone) {
    try {
      var fmt = new Intl.DateTimeFormat("en-US", { timeZone: timeZone, timeZoneName: "short" });
      var parts = fmt.formatToParts(utcDate);
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].type === "timeZoneName" && parts[i].value) return parts[i].value;
      }
    } catch (e) {}
    return timeZone;
  }

  function findTransition(t0, t1, timeZone, off0) {
    var lo = t0;
    var hi = t1;
    while (hi - lo > 60000) {
      var mid = Math.floor((lo + hi) / 2);
      var om = zoneOffsetMinutes(new Date(mid), timeZone);
      if (om === off0) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  /* Non-recurring STANDARD/DAYLIGHT blocks covering [fromYear, toYear]. */
  function vtimezoneLines(timeZone, fromYear, toYear) {
    var start = Date.UTC(fromYear, 0, 1, 0, 0, 0);
    var end = Date.UTC(toYear + 1, 0, 1, 0, 0, 0);
    var step = 6 * 60 * 60 * 1000;
    var samples = [start];
    for (var t = start; t < end; t += step) samples.push(Math.min(t + step, end));
    var transitions = [];
    var off = zoneOffsetMinutes(new Date(start), timeZone);
    for (var i = 1; i < samples.length; i++) {
      var offNext = zoneOffsetMinutes(new Date(samples[i]), timeZone);
      if (offNext === off) continue;
      var at = findTransition(samples[i - 1], samples[i], timeZone, off);
      var to = zoneOffsetMinutes(new Date(at), timeZone);
      transitions.push({ utc: at, from: off, to: to });
      off = to;
    }
    var lines = ["BEGIN:VTIMEZONE", "TZID:" + timeZone];
    if (!transitions.length) {
      var only = zoneOffsetMinutes(new Date(start), timeZone);
      lines.push("BEGIN:STANDARD");
      lines.push("DTSTART:19700101T000000");
      lines.push("TZOFFSETFROM:" + formatOffset(only));
      lines.push("TZOFFSETTO:" + formatOffset(only));
      lines.push("TZNAME:" + escText(tzName(new Date(start), timeZone)));
      lines.push("END:STANDARD");
    } else {
      transitions.forEach(function (tr) {
        var daylight = tr.to > tr.from;
        lines.push(daylight ? "BEGIN:DAYLIGHT" : "BEGIN:STANDARD");
        lines.push("DTSTART:" + formatWallFromUtc(tr.utc, tr.from));
        lines.push("TZOFFSETFROM:" + formatOffset(tr.from));
        lines.push("TZOFFSETTO:" + formatOffset(tr.to));
        lines.push("TZNAME:" + escText(tzName(new Date(tr.utc + 60000), timeZone)));
        lines.push(daylight ? "END:DAYLIGHT" : "END:STANDARD");
      });
    }
    lines.push("END:VTIMEZONE");
    return lines;
  }

  function addWall(isoDate, hhmm, minutes) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    var t = /^(\d{2}):(\d{2})$/.exec(hhmm);
    if (!m || !t) return { date: isoDate, time: hhmm };
    var total = (+t[1]) * 60 + (+t[2]) + minutes;
    var shift = Math.floor(total / 1440);
    total = ((total % 1440) + 1440) % 1440;
    var dt = new Date(+m[1], +m[2] - 1, +m[3] + shift, 0, 0, 0, 0);
    return {
      date: dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate()),
      time: pad2(Math.floor(total / 60)) + ":" + pad2(total % 60),
    };
  }

  function zuluFromWall(isoDate, hhmm, timeZone) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    var t = /^(\d{2}):(\d{2})$/.exec(hhmm);
    if (!m || !t) return new Date();
    var y = +m[1], mo = +m[2], d = +m[3], hh = +t[1], mm = +t[2];
    if (isUtcZone(timeZone)) return new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
    var guess = Date.UTC(y, mo - 1, d, hh, mm, 0);
    var off = zoneOffsetMinutes(new Date(guess), timeZone);
    var utc = guess - off * 60000;
    var off2 = zoneOffsetMinutes(new Date(utc), timeZone);
    if (off2 !== off) utc = guess - off2 * 60000;
    return new Date(utc);
  }

  function normalizeAlarm(alarm) {
    var key = String(alarm == null ? "PT0S" : alarm).trim();
    return ALARMS[key] || "PT0S";
  }

  function buildCalendar(opts) {
    opts = opts || {};
    var marks = Array.isArray(opts.marks) ? opts.marks : [];
    var timeZone = opts.timeZone ? String(opts.timeZone) : "UTC";
    var alarm = normalizeAlarm(opts.alarm);
    var now = opts.now instanceof Date ? opts.now : new Date();
    var uidHost = opts.uidHost || "stevenphilley.com";
    var useUtc = isUtcZone(timeZone);
    var dtstamp = stampUTC(now);

    var timed = [];
    marks.forEach(function (mark) {
      if (!mark || !mark.date || !mark.time || !mark.text) return;
      var time = String(mark.time);
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(mark.date)) return;
      timed.push({
        date: mark.date,
        time: time,
        text: String(mark.text).replace(/\r?\n/g, " ").trim(),
        yearly: !!mark.yearly,
      });
    });

    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//stevenphilley.com//Annual Dial//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Annual Dial",
    ];
    if (!useUtc) {
      lines.push("X-WR-TIMEZONE:" + timeZone);
      var minY = now.getFullYear() - 1;
      var maxY = now.getFullYear() + 6;
      timed.forEach(function (mark) {
        var y = +mark.date.slice(0, 4);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
      vtimezoneLines(timeZone, minY, maxY).forEach(function (ln) { lines.push(ln); });
    }

    timed.forEach(function (mark) {
      var end = addWall(mark.date, mark.time, 30);
      var uidSrc = [mark.date, mark.time, mark.yearly ? "Y" : "N", mark.text].join("|");
      var uid = "annual-dial-" + fnv(uidSrc) + "@" + uidHost;
      var summary = escText(mark.text);
      var desc = escText(
        "Annual Dial reminder. Local time " + mark.time +
        " (" + timeZone + "). A static page cannot notify you after you close it; this alarm fires in your calendar."
      );
      lines.push("BEGIN:VEVENT");
      lines.push("UID:" + uid);
      lines.push("DTSTAMP:" + dtstamp);
      if (useUtc) {
        lines.push("DTSTART:" + stampUTC(zuluFromWall(mark.date, mark.time, "UTC")));
        lines.push("DTEND:" + stampUTC(zuluFromWall(end.date, end.time, "UTC")));
      } else {
        lines.push("DTSTART;TZID=" + timeZone + ":" + wallStamp(mark.date, mark.time));
        lines.push("DTEND;TZID=" + timeZone + ":" + wallStamp(end.date, end.time));
      }
      lines.push("SUMMARY:" + summary);
      lines.push("DESCRIPTION:" + desc);
      if (mark.yearly) lines.push("RRULE:FREQ=YEARLY");
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push("DESCRIPTION:" + summary);
      lines.push("TRIGGER:" + alarm);
      lines.push("END:VALARM");
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return joinCrlf(lines);
  }

  root.annualDialIcs = {
    ALARMS: ALARMS,
    escText: escText,
    buildCalendar: buildCalendar,
    normalizeAlarm: normalizeAlarm,
  };
})(typeof window !== "undefined" ? window : globalThis);
