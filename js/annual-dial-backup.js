/*! annual-dial-backup.js — local text-file save/restore for Annual Dial.
 *
 *  Nothing is uploaded. Marks stay in this browser and in the file the
 *  visitor downloads.
 *
 *  TEXT FORMAT (version 2), UTF-8. Lines starting with # are comments.
 *
 *    # Annual Dial
 *    # version: 2
 *    # saved: YYYY-MM-DD          (local date the file was written)
 *    # theme: <dial skin>         (optional)
 *    # timezone: <IANA name>      (optional; wall-clock zone times were typed in)
 *    #
 *    YYYY-MM-DD <TAB> note
 *    YYYY-MM-DD <TAB> HH:MM <TAB> note
 *    YYYY-MM-DD <TAB> HH:MM <TAB> yearly <TAB> note
 *    YYYY-MM-DD <TAB> yearly <TAB> note
 *
 *  A pipe (|) may be used instead of a tab between columns. Times are
 *  24-hour local wall-clock values (HH:MM), never UTC. "yearly" repeats
 *  the mark each year on that month and day. The word "yearly" is a flag
 *  only when another column (the note) follows it. A note that is exactly
 *  "09:30" or "yearly" stays a note.
 *
 *  VERSION 1 (and files with no version line) — still accepted:
 *
 *    YYYY-MM-DD <TAB or pipe or spaces> note
 *
 *  The entire remainder of the line is the note. A note that looks like a
 *  time is NOT parsed as a time. Date-only marks remain valid.
 *
 *  JSON — still accepted, including older blobs of string notes:
 *
 *    { "YYYY-MM-DD": ["note", { "text": "note", "time": "09:30", "yearly": true }] }
 *    { "version": 2, "theme": "brass", "timezone": "America/Los_Angeles", "events": { ... } }
 *
 *  localStorage key "annual-dial-entries" stores that events object.
 *  Date-only marks are plain strings. A mark is an object only when it has
 *  a time and/or yearly. Older string-only saves load unchanged.
 */
(function (root) {
  "use strict";

  var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  var THEME_LINE = /^#\s*theme:\s*(\S+)/i;
  var VERSION_LINE = /^#\s*version:\s*(\d+)/i;
  var TZ_LINE = /^#\s*timezone:\s*(\S+)/i;
  var TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
  var ENTRY_RE = /^(\d{4}-\d{2}-\d{2})(?:\t+|\s*\|\s*|\s+)(.*)$/;
  var DEFAULT_THEMES = ["brass", "led", "vapor", "columbus", "hallow", "xmas", "neon"];
  var FORMAT_VERSION = 2;

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

  function normalizeTime(value) {
    var m = TIME_RE.exec(String(value == null ? "" : value).trim());
    if (!m) return null;
    return m[1] + ":" + m[2];
  }

  function cleanText(value) {
    return String(value == null ? "" : value).replace(/\r?\n/g, " ").trim();
  }

  /* A mark is {text, time|null, yearly}. Date-only notes are still strings
   * on disk; asMark/packMark convert at the edges. */
  function asMark(raw) {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      var text = cleanText(raw.text != null ? raw.text : raw.note);
      if (!text) return null;
      var yearly = raw.yearly === true || raw.repeat === "yearly";
      return { text: text, time: normalizeTime(raw.time), yearly: yearly };
    }
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    var t = cleanText(raw);
    if (!t) return null;
    return { text: t, time: null, yearly: false };
  }

  function packMark(raw) {
    var mark = asMark(raw);
    if (!mark) return null;
    if (!mark.time && !mark.yearly) return mark.text;
    var o = { text: mark.text };
    if (mark.time) o.time = mark.time;
    if (mark.yearly) o.yearly = true;
    return o;
  }

  function markKey(raw) {
    var mark = asMark(raw);
    if (!mark) return "";
    return mark.text + "\u0000" + (mark.time || "") + "\u0000" + (mark.yearly ? "1" : "0");
  }

  function countNotes(events) {
    var n = 0;
    if (!events || typeof events !== "object") return 0;
    Object.keys(events).forEach(function (k) {
      var arr = events[k];
      if (Array.isArray(arr)) n += arr.length;
      else if (typeof arr === "string" && arr) n += 1;
      else if (arr && typeof arr === "object") n += 1;
    });
    return n;
  }

  function countDays(events) {
    if (!events || typeof events !== "object") return 0;
    return Object.keys(events).filter(function (k) {
      var v = events[k];
      if (Array.isArray(v)) return v.length > 0;
      return !!v;
    }).length;
  }

  function addPacked(out, date, packed) {
    if (packed == null || !isIsoDate(date)) return;
    if (!out[date]) out[date] = [];
    out[date].push(packed);
  }

  function normalizeEvents(raw) {
    var out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    Object.keys(raw).forEach(function (k) {
      if (!isIsoDate(k)) return;
      var v = raw[k];
      if (Array.isArray(v)) {
        v.forEach(function (n) { addPacked(out, k, packMark(n)); });
      } else if (typeof v === "string" || (v && typeof v === "object")) {
        addPacked(out, k, packMark(v));
      }
    });
    return out;
  }

  function pickTheme(id, allowed) {
    var list = allowed && allowed.length ? allowed : DEFAULT_THEMES;
    var t = String(id || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    return list.indexOf(t) > -1 ? t : null;
  }

  function lineFor(date, raw) {
    var mark = asMark(raw);
    if (!mark) return null;
    if (mark.time && mark.yearly) return date + "\t" + mark.time + "\tyearly\t" + mark.text;
    if (mark.time) return date + "\t" + mark.time + "\t" + mark.text;
    if (mark.yearly) return date + "\tyearly\t" + mark.text;
    return date + "\t" + mark.text;
  }

  function serializeBackup(opts) {
    opts = opts || {};
    var events = opts.events || {};
    var theme = opts.theme || "";
    var saved = opts.saved || isoOf(new Date());
    var timezone = opts.timezone ? String(opts.timezone).trim() : "";
    var lines = [
      "# Annual Dial",
      "# version: " + FORMAT_VERSION,
      "# saved: " + saved,
    ];
    if (theme) lines.push("# theme: " + theme);
    if (timezone) lines.push("# timezone: " + timezone);
    lines.push("#");
    lines.push("# One mark per line. Columns are separated by a tab.");
    lines.push("#   YYYY-MM-DD <TAB> note");
    lines.push("#   YYYY-MM-DD <TAB> HH:MM <TAB> note");
    lines.push("#   YYYY-MM-DD <TAB> HH:MM <TAB> yearly <TAB> note");
    lines.push("#   YYYY-MM-DD <TAB> yearly <TAB> note");
    lines.push("# Version 1 files (date, then the whole note) still load.");
    lines.push("# HH:MM is a local wall-clock time in the timezone above, not UTC.");
    lines.push("# yearly repeats the mark each year on that month and day.");
    lines.push("# Lines starting with # are comments.");
    lines.push("");
    Object.keys(events).sort().forEach(function (k) {
      if (!isIsoDate(k)) return;
      var notes = events[k];
      if (!Array.isArray(notes)) notes = [notes];
      notes.forEach(function (note) {
        var line = lineFor(k, note);
        if (line) lines.push(line);
      });
    });
    return lines.join("\n") + "\n";
  }

  function parseJsonBlob(obj, allowedThemes) {
    if (!obj || typeof obj !== "object") return { events: {}, theme: null, timezone: null };
    var events;
    var theme = null;
    var timezone = null;
    if (obj.events && typeof obj.events === "object" && !Array.isArray(obj.events)) {
      events = normalizeEvents(obj.events);
    } else {
      events = normalizeEvents(obj);
    }
    if (typeof obj.theme === "string") theme = pickTheme(obj.theme, allowedThemes);
    if (typeof obj.timezone === "string" && obj.timezone.trim()) timezone = obj.timezone.trim();
    return { events: events, theme: theme, timezone: timezone };
  }

  function detectVersion(lines) {
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim();
      if (!s || s.charAt(0) !== "#") continue;
      var vm = VERSION_LINE.exec(s);
      if (vm) return Math.max(1, parseInt(vm[1], 10) || 1);
    }
    return 1;
  }

  /* Version 2 columns. Time and "yearly" are flags only when a note column follows. */
  function parseV2Entry(line) {
    var m = /^(\d{4}-\d{2}-\d{2})([\t| ].*)$/.exec(line);
    if (!m || !isIsoDate(m[1])) return null;
    var rest = m[2];
    var parts;
    if (rest.charAt(0) === "\t" || /^\t/.test(rest)) {
      parts = rest.replace(/^\t+/, "").split(/\t/);
    } else if (/^\s*\|/.test(rest)) {
      parts = rest.replace(/^\s*\|\s*/, "").split(/\s*\|\s*/);
    } else {
      /* Spaces: version-1 style note, even inside a version-2 file. */
      var loose = ENTRY_RE.exec(line);
      if (!loose) return null;
      return packMark(loose[2]);
    }
    parts = parts.map(function (p) { return String(p).trim(); }).filter(function (p) { return p.length > 0; });
    if (!parts.length) return null;
    var time = null;
    var yearly = false;
    if (parts.length >= 2 && TIME_RE.test(parts[0])) {
      time = normalizeTime(parts.shift());
    }
    if (parts.length >= 2 && /^yearly$/i.test(parts[0])) {
      yearly = true;
      parts.shift();
    }
    var text = parts.join(" ").trim();
    if (!text) return null;
    return packMark({ text: text, time: time, yearly: yearly });
  }

  function parseBackup(text, allowedThemes) {
    var src = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    var trimmed = src.trim();
    if (!trimmed) return { events: {}, theme: null, timezone: null, version: 1, error: "empty" };

    if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
      try {
        var json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          return { events: {}, theme: null, timezone: null, version: 1, error: "unrecognized" };
        }
        var fromJson = parseJsonBlob(json, allowedThemes);
        return {
          events: fromJson.events,
          theme: fromJson.theme,
          timezone: fromJson.timezone,
          version: typeof json.version === "number" ? json.version : 1,
          error: null,
        };
      } catch (e) {
        /* Fall through to the line parser. */
      }
    }

    var lines = src.split(/\r?\n/);
    var version = detectVersion(lines);
    var events = {};
    var theme = null;
    var timezone = null;
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim();
      if (!s) continue;
      if (s.charAt(0) === "#") {
        var tm = THEME_LINE.exec(s);
        if (tm) theme = pickTheme(tm[1], allowedThemes);
        var zm = TZ_LINE.exec(s);
        if (zm) timezone = zm[1];
        continue;
      }
      if (version >= 2) {
        var packed = parseV2Entry(s);
        var dm = /^(\d{4}-\d{2}-\d{2})/.exec(s);
        if (packed && dm) addPacked(events, dm[1], packed);
        continue;
      }
      var m = ENTRY_RE.exec(s);
      if (m && isIsoDate(m[1])) addPacked(events, m[1], packMark(m[2]));
    }
    return { events: events, theme: theme, timezone: timezone, version: version, error: null };
  }

  function mergeEvents(base, incoming) {
    var out = {};
    var src = base && typeof base === "object" ? base : {};
    var extra = incoming && typeof incoming === "object" ? incoming : {};
    function take(bucket) {
      Object.keys(bucket).forEach(function (k) {
        if (!out[k]) out[k] = [];
        var notes = Array.isArray(bucket[k]) ? bucket[k] : [bucket[k]];
        var seen = {};
        out[k].forEach(function (n) { seen[markKey(n)] = true; });
        notes.forEach(function (n) {
          var packed = packMark(n);
          if (packed == null) return;
          var key = markKey(packed);
          if (!key || seen[key]) return;
          seen[key] = true;
          out[k].push(packed);
        });
      });
    }
    take(src);
    take(extra);
    Object.keys(out).forEach(function (k) {
      if (!out[k].length) delete out[k];
    });
    return out;
  }

  function backupFilename(d) {
    return "annual-dial-" + isoOf(d || new Date()) + ".txt";
  }

  root.annualDialBackup = {
    FORMAT_VERSION: FORMAT_VERSION,
    isIsoDate: isIsoDate,
    isoOf: isoOf,
    normalizeTime: normalizeTime,
    asMark: asMark,
    packMark: packMark,
    markKey: markKey,
    countNotes: countNotes,
    countDays: countDays,
    serializeBackup: serializeBackup,
    parseBackup: parseBackup,
    mergeEvents: mergeEvents,
    backupFilename: backupFilename,
    normalizeEvents: normalizeEvents,
  };
})(typeof window !== "undefined" ? window : globalThis);
