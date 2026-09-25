/*! annual-dial-marks.js — upcoming marks, countdowns, and due checks.
 *  Depends on annual-dial-backup.js (asMark). Date-only marks stay valid:
 *  they sort as all-day and never fire a due alert.
 *  Times are the visitor's local wall clock.
 */
(function (root) {
  "use strict";

  function backup() {
    return root.annualDialBackup;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function parseIso(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return null;
    return { y: +m[1], m: +m[2], d: +m[3] };
  }

  function isoFromParts(y, m, d) {
    return y + "-" + pad2(m) + "-" + pad2(d);
  }

  function validYmd(y, m, d) {
    var dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function atTime(y, m, d, hhmm) {
    if (!validYmd(y, m, d)) return null;
    var t = backup().normalizeTime(hhmm);
    if (!t) return new Date(y, m - 1, d, 0, 0, 0, 0);
    var p = t.split(":");
    return new Date(y, m - 1, d, +p[0], +p[1], 0, 0);
  }

  function endOfDay(y, m, d) {
    if (!validYmd(y, m, d)) return null;
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }

  function eachStored(events, fn) {
    if (!events || typeof events !== "object") return;
    Object.keys(events).forEach(function (k) {
      var arr = events[k];
      if (typeof arr === "string" || (arr && typeof arr === "object" && !Array.isArray(arr))) arr = [arr];
      if (!Array.isArray(arr)) return;
      arr.forEach(function (raw, index) {
        var mark = backup().asMark(raw);
        if (mark) fn(k, mark, index);
      });
    });
  }

  /* Direct marks on this date, plus yearly marks anchored on the same month-day. */
  function marksOnDate(events, iso) {
    var parts = parseIso(iso);
    if (!parts) return [];
    var md = iso.slice(5);
    var out = [];
    eachStored(events, function (k, mark, index) {
      if (k === iso) {
        out.push({ mark: mark, sourceDate: k, index: index, echoed: false });
        return;
      }
      if (mark.yearly && k.length >= 10 && k.slice(5) === md) {
        out.push({ mark: mark, sourceDate: k, index: index, echoed: true });
      }
    });
    return out;
  }

  function hasMarks(events, iso) {
    return marksOnDate(events, iso).length > 0;
  }

  /* 0 = midnight, 0.5 = noon. At most four distinct times, for dial ticks. */
  function timeFractions(events, iso) {
    var seen = {};
    var out = [];
    marksOnDate(events, iso).forEach(function (row) {
      if (!row.mark.time) return;
      var p = row.mark.time.split(":");
      var frac = ((+p[0]) * 60 + (+p[1])) / (24 * 60);
      var key = frac.toFixed(5);
      if (seen[key]) return;
      seen[key] = true;
      out.push(frac);
    });
    return out.slice(0, 4);
  }

  function nextWhen(sourceDate, mark, now) {
    var parts = parseIso(sourceDate);
    if (!parts) return null;
    var startYear = mark.yearly ? now.getFullYear() - 1 : parts.y;
    var endYear = mark.yearly ? now.getFullYear() + 8 : parts.y;
    if (startYear < parts.y && !mark.yearly) startYear = parts.y;
    for (var y = startYear; y <= endYear; y++) {
      if (mark.time) {
        var when = atTime(y, parts.m, parts.d, mark.time);
        if (!when) continue;
        if (when.getTime() >= now.getTime()) {
          return { when: when, allDay: false, occurrence: isoFromParts(y, parts.m, parts.d) };
        }
      } else {
        var end = endOfDay(y, parts.m, parts.d);
        if (!end) continue;
        if (end.getTime() >= now.getTime()) {
          return {
            when: new Date(y, parts.m - 1, parts.d, 0, 0, 0, 0),
            allDay: true,
            occurrence: isoFromParts(y, parts.m, parts.d),
          };
        }
      }
      if (!mark.yearly) break;
    }
    return null;
  }

  function upcoming(events, now, limit) {
    var items = [];
    eachStored(events, function (k, mark, index) {
      var n = nextWhen(k, mark, now);
      if (!n) return;
      items.push({
        text: mark.text,
        time: mark.time,
        yearly: mark.yearly,
        sourceDate: k,
        index: index,
        when: n.when,
        allDay: n.allDay,
        occurrence: n.occurrence,
      });
    });
    items.sort(function (a, b) {
      var d = a.when.getTime() - b.when.getTime();
      if (d) return d;
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      if (a.text < b.text) return -1;
      if (a.text > b.text) return 1;
      return 0;
    });
    if (limit) return items.slice(0, limit);
    return items;
  }

  function dueId(sourceDate, mark, occurrence) {
    return [sourceDate, mark.time || "", mark.yearly ? "Y" : "N", mark.text, occurrence].join("|");
  }

  /* Timed marks whose local time has arrived within graceMs (default 90s).
   * Date-only marks are never due. */
  function dueMarks(events, now, graceMs) {
    var grace = graceMs == null ? 90000 : graceMs;
    var out = [];
    var seen = {};
    eachStored(events, function (k, mark, index) {
      if (!mark.time) return;
      var parts = parseIso(k);
      if (!parts) return;
      var years = mark.yearly ? [now.getFullYear() - 1, now.getFullYear()] : [parts.y];
      years.forEach(function (y) {
        var when = atTime(y, parts.m, parts.d, mark.time);
        if (!when) return;
        var dt = now.getTime() - when.getTime();
        if (dt < 0 || dt > grace) return;
        var occurrence = isoFromParts(y, parts.m, parts.d);
        var id = dueId(k, mark, occurrence);
        if (seen[id]) return;
        seen[id] = true;
        out.push({
          text: mark.text,
          time: mark.time,
          yearly: mark.yearly,
          sourceDate: k,
          index: index,
          when: when,
          occurrence: occurrence,
          id: id,
        });
      });
    });
    return out;
  }

  function formatCountdown(whenMs, nowMs, allDay) {
    var when = new Date(+whenMs);
    var now = new Date(+nowMs);
    if (allDay) {
      var a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      var b = Date.UTC(when.getFullYear(), when.getMonth(), when.getDate());
      var days = Math.round((b - a) / 86400000);
      if (days <= 0) return "today";
      if (days === 1) return "tomorrow";
      return "in " + days + " days";
    }
    var ms = +whenMs - +nowMs;
    if (ms <= 0) return "now";
    var sec = Math.floor(ms / 1000);
    if (sec < 90) return "in " + sec + "s";
    var min = Math.floor(sec / 60);
    if (min < 60) return "in " + min + "m";
    var hr = Math.floor(min / 60);
    var days2 = Math.floor(hr / 24);
    if (days2 >= 2) return "in " + days2 + " days";
    return "in " + hr + "h " + (min % 60) + "m";
  }

  function formatTimeLabel(hhmm) {
    var t = backup().normalizeTime(hhmm);
    if (!t) return "";
    var p = t.split(":");
    var d = new Date(2000, 0, 1, +p[0], +p[1], 0, 0);
    try {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch (e) {
      return t;
    }
  }

  function timedMarks(events) {
    var out = [];
    eachStored(events, function (k, mark) {
      if (!mark.time) return;
      out.push({ date: k, text: mark.text, time: mark.time, yearly: !!mark.yearly });
    });
    out.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (a.time !== b.time) return a.time < b.time ? -1 : 1;
      if (a.text < b.text) return -1;
      if (a.text > b.text) return 1;
      return 0;
    });
    return out;
  }

  root.annualDialMarks = {
    marksOnDate: marksOnDate,
    hasMarks: hasMarks,
    timeFractions: timeFractions,
    upcoming: upcoming,
    dueMarks: dueMarks,
    formatCountdown: formatCountdown,
    formatTimeLabel: formatTimeLabel,
    timedMarks: timedMarks,
  };
})(typeof window !== "undefined" ? window : globalThis);
