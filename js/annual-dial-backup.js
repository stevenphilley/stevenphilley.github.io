/*! annual-dial-backup.js — local text-file save/restore for Annual Dial.
 *  Format is human-readable .txt (header + YYYY-MM-DD<TAB>note).
 *  Also accepts a JSON blob of events. Nothing is uploaded.
 */
(function (root) {
  "use strict";

  var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  var THEME_LINE = /^#\s*theme:\s*(\S+)/i;
  var ENTRY_RE = /^(\d{4}-\d{2}-\d{2})(?:\t+|\s*\|\s*|\s+)(.*)$/;
  var DEFAULT_THEMES = ["brass", "led", "vapor", "columbus", "hallow", "xmas", "neon"];

  function isIsoDate(s) {
    var m = ISO_RE.exec(String(s || ""));
    if (!m) return false;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
    var dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function isoOf(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function countNotes(events) {
    var n = 0;
    if (!events || typeof events !== "object") return 0;
    Object.keys(events).forEach(function (k) {
      var arr = events[k];
      if (Array.isArray(arr)) n += arr.length;
      else if (typeof arr === "string" && arr) n += 1;
    });
    return n;
  }

  function countDays(events) {
    if (!events || typeof events !== "object") return 0;
    return Object.keys(events).filter(function (k) {
      var v = events[k];
      return Array.isArray(v) ? v.length > 0 : !!v;
    }).length;
  }

  function addNote(out, date, note) {
    var t = String(note == null ? "" : note).replace(/\r?\n/g, " ").trim();
    if (!t || !isIsoDate(date)) return;
    if (!out[date]) out[date] = [];
    out[date].push(t);
  }

  function normalizeEvents(raw) {
    var out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    Object.keys(raw).forEach(function (k) {
      if (!isIsoDate(k)) return;
      var v = raw[k];
      if (Array.isArray(v)) {
        v.forEach(function (n) { addNote(out, k, n); });
      } else if (typeof v === "string") {
        addNote(out, k, v);
      }
    });
    return out;
  }

  function pickTheme(id, allowed) {
    var list = allowed && allowed.length ? allowed : DEFAULT_THEMES;
    var t = String(id || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    return list.indexOf(t) > -1 ? t : null;
  }

  function serializeBackup(opts) {
    opts = opts || {};
    var events = opts.events || {};
    var theme = opts.theme || "";
    var saved = opts.saved || isoOf(new Date());
    var lines = [
      "# Annual Dial",
      "# version: 1",
      "# saved: " + saved,
    ];
    if (theme) lines.push("# theme: " + theme);
    lines.push("#");
    lines.push("# One mark per line: YYYY-MM-DD then a tab then the note.");
    lines.push("# Multiple notes on the same day use multiple lines.");
    lines.push("# Lines starting with # are comments.");
    lines.push("");
    Object.keys(events).sort().forEach(function (k) {
      var notes = events[k];
      if (!Array.isArray(notes)) {
        if (typeof notes === "string" && notes) lines.push(k + "\t" + notes.replace(/\r?\n/g, " "));
        return;
      }
      notes.forEach(function (note) {
        var text = String(note == null ? "" : note).replace(/\r?\n/g, " ").trim();
        if (text) lines.push(k + "\t" + text);
      });
    });
    return lines.join("\n") + "\n";
  }

  function parseJsonBlob(obj, allowedThemes) {
    if (!obj || typeof obj !== "object") return { events: {}, theme: null };
    var events;
    var theme = null;
    if (obj.events && typeof obj.events === "object" && !Array.isArray(obj.events)) {
      events = normalizeEvents(obj.events);
    } else {
      events = normalizeEvents(obj);
    }
    if (typeof obj.theme === "string") theme = pickTheme(obj.theme, allowedThemes);
    return { events: events, theme: theme };
  }

  function parseBackup(text, allowedThemes) {
    var src = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    var trimmed = src.trim();
    if (!trimmed) return { events: {}, theme: null, error: "empty" };

    if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
      try {
        var json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          return { events: {}, theme: null, error: "unrecognized" };
        }
        var fromJson = parseJsonBlob(json, allowedThemes);
        return { events: fromJson.events, theme: fromJson.theme, error: null };
      } catch (e) {
        // Fall through to line parser — someone may have pasted JSON-ish text.
      }
    }

    var events = {};
    var theme = null;
    var lines = src.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim();
      if (!s) continue;
      if (s.charAt(0) === "#") {
        var tm = THEME_LINE.exec(s);
        if (tm) theme = pickTheme(tm[1], allowedThemes);
        continue;
      }
      var m = ENTRY_RE.exec(s);
      if (m && isIsoDate(m[1])) {
        addNote(events, m[1], m[2]);
      }
    }
    return { events: events, theme: theme, error: null };
  }

  function mergeEvents(base, incoming) {
    var out = {};
    var src = base && typeof base === "object" ? base : {};
    var extra = incoming && typeof incoming === "object" ? incoming : {};
    Object.keys(src).forEach(function (k) {
      out[k] = Array.isArray(src[k]) ? src[k].slice() : [];
    });
    Object.keys(extra).forEach(function (k) {
      if (!out[k]) out[k] = [];
      var notes = Array.isArray(extra[k]) ? extra[k] : [];
      notes.forEach(function (n) {
        if (out[k].indexOf(n) === -1) out[k].push(n);
      });
    });
    Object.keys(out).forEach(function (k) {
      if (!out[k].length) delete out[k];
    });
    return out;
  }

  function backupFilename(d) {
    return "annual-dial-" + isoOf(d || new Date()) + ".txt";
  }

  root.annualDialBackup = {
    isIsoDate: isIsoDate,
    isoOf: isoOf,
    countNotes: countNotes,
    countDays: countDays,
    serializeBackup: serializeBackup,
    parseBackup: parseBackup,
    mergeEvents: mergeEvents,
    backupFilename: backupFilename,
    normalizeEvents: normalizeEvents,
  };
})(typeof window !== "undefined" ? window : globalThis);
