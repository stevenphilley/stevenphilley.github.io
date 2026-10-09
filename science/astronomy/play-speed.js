/*! play-speed.js — logarithmic play rate for the solar map.
    Continuous slider coordinate 0..1000 maps from 1 hour/s to 10 Julian years/s.
    1× remains 36 days/s so saved presets 0.5, 1, 2, 5, and 10 still restore. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AstroPlaySpeed = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var YEAR_DAYS = 365.25;
  var BASE_DAYS_PER_SEC = 36;
  var MIN_DPS = 1 / 24;
  var MAX_DPS = 10 * YEAR_DAYS;
  var SLIDER_MAX = 1000;
  var FINE = 1.02;
  var COARSE = 1.25;
  var LN = Math.log(MAX_DPS / MIN_DPS);
  var PRESETS = [0.5, 1, 2, 5, 10];

  function clamp(dps) {
    if (!isFinite(dps)) return BASE_DAYS_PER_SEC;
    if (dps < MIN_DPS) return MIN_DPS;
    if (dps > MAX_DPS) return MAX_DPS;
    return dps;
  }

  function dpsToPos(dps) {
    var c = clamp(dps);
    var t = Math.log(c / MIN_DPS) / LN;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return t * SLIDER_MAX;
  }

  function posToDps(pos) {
    var t = Number(pos);
    if (!isFinite(t)) t = 0;
    t = t / SLIDER_MAX;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return MIN_DPS * Math.exp(t * LN);
  }

  function sigDigits(n, digits) {
    if (!isFinite(n) || n === 0) return "0";
    var abs = Math.abs(n);
    var s = abs.toPrecision(digits);
    if (/e/i.test(s)) {
      var exp = Math.floor(Math.log10(abs));
      s = abs.toFixed(Math.max(0, digits - 1 - exp));
    }
    if (s.indexOf(".") !== -1) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }

  function formatRate(dps) {
    var c = clamp(dps);
    var kind, value;
    if (c < 1) {
      kind = "hour";
      value = c * 24;
    } else if (c < YEAR_DAYS) {
      kind = "day";
      value = c;
    } else {
      kind = "year";
      value = c / YEAR_DAYS;
    }
    var num = sigDigits(value, 4);
    var singular = num === "1";
    var name = kind + (singular ? "" : "s");
    return {
      dps: c,
      num: num,
      unitLabel: name + "/s",
      label: num + " " + name + "/s",
      spoken: num + " " + name + " per second"
    };
  }

  function unitKind(unit) {
    var s = String(unit || "").toLowerCase();
    var ch = s.charAt(0);
    if (ch === "h" || ch === "y" || ch === "d") return ch;
    return "d";
  }

  function parseRate(text, currentUnit) {
    var raw = String(text == null ? "" : text).trim().toLowerCase();
    if (!raw) return null;
    raw = raw.replace(/,/g, "");
    raw = raw.replace(/\s*per\s+sec(?:ond)?\s*$/i, "");
    raw = raw.replace(/\s*\/\s*s(?:ec(?:ond)?)?\s*$/i, "");
    var m = /^([+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z]+)?$/.exec(raw);
    if (!m) return null;
    var n = parseFloat(m[1]);
    if (!isFinite(n) || n <= 0) return null;
    var kind = m[2] ? unitKind(m[2]) : unitKind(currentUnit);
    var dps;
    if (kind === "h") dps = n / 24;
    else if (kind === "y") dps = n * YEAR_DAYS;
    else dps = n;
    return clamp(dps);
  }

  function nudge(dps, direction, coarse) {
    var factor = coarse ? COARSE : FINE;
    if (direction < 0) factor = 1 / factor;
    return clamp(clamp(dps) * factor);
  }

  function near(a, b) {
    var scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= 1e-8 * scale;
  }

  function fromStoredMultiplier(n) {
    if (typeof n === "string") n = parseFloat(n);
    if (!isFinite(n) || n <= 0) return null;
    var dps = n * BASE_DAYS_PER_SEC;
    if (dps < MIN_DPS * (1 - 1e-6) || dps > MAX_DPS * (1 + 1e-6)) return null;
    return clamp(dps);
  }

  function toStoredMultiplier(dps) {
    return (clamp(dps) / BASE_DAYS_PER_SEC).toExponential(12);
  }

  return {
    YEAR_DAYS: YEAR_DAYS,
    BASE_DAYS_PER_SEC: BASE_DAYS_PER_SEC,
    MIN_DPS: MIN_DPS,
    MAX_DPS: MAX_DPS,
    SLIDER_MAX: SLIDER_MAX,
    FINE: FINE,
    COARSE: COARSE,
    PRESETS: PRESETS,
    clamp: clamp,
    dpsToPos: dpsToPos,
    posToDps: posToDps,
    formatRate: formatRate,
    parseRate: parseRate,
    nudge: nudge,
    near: near,
    fromStoredMultiplier: fromStoredMultiplier,
    toStoredMultiplier: toStoredMultiplier
  };
});
