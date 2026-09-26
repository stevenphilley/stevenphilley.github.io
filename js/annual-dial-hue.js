/*! annual-dial-hue.js — rotate an Annual Dial skin's palette by a hue offset.
 *
 *  Colors are converted to HSL, the hue is turned, and saturation, lightness,
 *  and alpha stay put so contrast inside the skin holds. Neutrals (no chroma)
 *  are left as written. A 0° or 360° offset returns the original string.
 *
 *  This is not a CSS hue-rotate filter. Only the palette strings passed in
 *  are recolored.
 *
 *  PALETTE_PROPS are the custom properties on the dial skins (and the
 *  decorative washes that reference them). The page reads each theme's
 *  authored values, runs them through rotateColors, and writes the results
 *  back onto <html>. localStorage key: annual-dial-hue.
 */
(function (root) {
  "use strict";

  var PALETTE_PROPS = [
    "--page-1", "--page-2", "--page-3",
    "--plate-0", "--plate-1", "--plate-2",
    "--rim", "--hair", "--sector",
    "--cell-wd", "--cell-we", "--cell-ev", "--cell-now",
    "--accent", "--accent-lit", "--second",
    "--text", "--text-dim",
    "--hub", "--on-accent",
    "--panel", "--field",
    "--glow", "--aura",
    "--dial-wash-1", "--dial-wash-2", "--dial-wash-3",
    "--dial-wash-4", "--dial-wash-5", "--dial-wash-6",
    "--dial-tick-1", "--dial-tick-2", "--dial-tick-3",
    "--dial-note", "--dial-em",
    "--dial-edge-1", "--dial-edge-2", "--dial-edge-3",
    "--dial-rose-1", "--dial-rose-2", "--dial-rose-ring",
    "--dial-rose-inset", "--dial-rose-sea"
  ];

  function normalizeHue(value) {
    var n = Math.round(Number(value));
    if (!isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 360) return 360;
    return n;
  }

  function spin(h, offset) {
    var n = Number(h) + (Number(offset) || 0);
    if (!isFinite(n)) return 0;
    n = n % 360;
    if (n < 0) n += 360;
    return n;
  }

  function clamp255(n) {
    n = Math.round(Number(n));
    if (!isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 255) return 255;
    return n;
  }

  function parseAlpha(token) {
    if (token == null || token === "") return 1;
    var s = String(token).trim();
    if (!s) return 1;
    if (s.charAt(s.length - 1) === "%") return clamp01(parseFloat(s) / 100);
    return clamp01(parseFloat(s));
  }

  function clamp01(n) {
    if (!isFinite(n)) return 1;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  function parseChannel(v) {
    v = String(v).trim();
    if (v.charAt(v.length - 1) === "%") return clamp255(parseFloat(v) * 2.55);
    return clamp255(parseFloat(v));
  }

  function parsePercent(v) {
    v = String(v).trim();
    if (v.charAt(v.length - 1) === "%") return parseFloat(v);
    return parseFloat(v);
  }

  function parseHue(v) {
    v = String(v).trim().toLowerCase();
    if (v.slice(-3) === "deg") return parseFloat(v);
    if (v.slice(-4) === "turn") return parseFloat(v) * 360;
    if (v.slice(-3) === "rad") return parseFloat(v) * (180 / Math.PI);
    if (v.slice(-4) === "grad") return parseFloat(v) * 0.9;
    return parseFloat(v);
  }

  function parseHex(token) {
    var h = token.slice(1);
    if (h.length === 3 || h.length === 4) {
      h = h.split("").map(function (c) { return c + c; }).join("");
    }
    if (h.length !== 6 && h.length !== 8) return null;
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some(function (n) { return !isFinite(n); })) return null;
    var a = 1;
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
    return { r: r, g: g, b: b, a: a };
  }

  function parseColor(token) {
    var s = String(token).trim();
    if (s.charAt(0) === "#") return parseHex(s);
    var m = /^(rgba?|hsla?)\((.*)\)$/i.exec(s);
    if (!m) return null;
    var kind = m[1].toLowerCase();
    var body = m[2].trim();
    var alphaPart = null;
    var main = body;
    var slash = body.indexOf("/");
    if (slash !== -1) {
      main = body.slice(0, slash);
      alphaPart = body.slice(slash + 1);
    }
    var comps = main.replace(/,/g, " ").trim().split(/\s+/).filter(Boolean);
    if (comps.length < 3) return null;
    if (comps.length >= 4 && alphaPart == null) alphaPart = comps[3];
    if (kind.charAt(0) === "r") {
      return {
        r: parseChannel(comps[0]),
        g: parseChannel(comps[1]),
        b: parseChannel(comps[2]),
        a: parseAlpha(alphaPart)
      };
    }
    var rgb = hslToRgb(parseHue(comps[0]), parsePercent(comps[1]), parsePercent(comps[2]));
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: parseAlpha(alphaPart) };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    var d = max - min;
    if (d > 1e-8) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var hp = h / 60;
    var x = c * (1 - Math.abs((hp % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (hp < 1) { r = c; g = x; }
    else if (hp < 2) { r = x; g = c; }
    else if (hp < 3) { g = c; b = x; }
    else if (hp < 4) { g = x; b = c; }
    else if (hp < 5) { r = x; b = c; }
    else { r = c; b = x; }
    return [
      clamp255((r + m) * 255),
      clamp255((g + m) * 255),
      clamp255((b + m) * 255)
    ];
  }

  function formatRgb(c) {
    var r = clamp255(c.r), g = clamp255(c.g), b = clamp255(c.b);
    if (c.a >= 0.999) return "rgb(" + r + ", " + g + ", " + b + ")";
    var a = Math.round(c.a * 1000) / 1000;
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
  }

  function rotateToken(token, deg) {
    var c = parseColor(token);
    if (!c) return token;
    var hsl = rgbToHsl(c.r, c.g, c.b);
    if (hsl[1] < 1) return token;
    var rgb = hslToRgb(hsl[0] + deg, hsl[1], hsl[2]);
    return formatRgb({ r: rgb[0], g: rgb[1], b: rgb[2], a: c.a });
  }

  function rotateColors(value, offset) {
    if (value == null) return value;
    var deg = Number(offset) || 0;
    deg = ((deg % 360) + 360) % 360;
    if (deg === 0) return value;
    return String(value).replace(
      /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|hsla?\([^)]*\)|rgba?\([^)]*\)/g,
      function (token) { return rotateToken(token, deg); }
    );
  }

  root.annualDialHue = {
    PALETTE_PROPS: PALETTE_PROPS,
    normalizeHue: normalizeHue,
    spin: spin,
    rotateColors: rotateColors
  };
})(typeof window !== "undefined" ? window : globalThis);
