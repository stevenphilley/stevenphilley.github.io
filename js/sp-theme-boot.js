/*! sp-theme-boot.js — early site theme and typeface, before first paint.
 *  Site themes: neon|emerald|dusk|sage|tide|sand (key: sp-theme, attr: html[data-theme]).
 *  Typeface: sans|mono|system (key: sp-font, attr: html[data-font]). Default sans.
 *  ?font= wins, then localStorage. head-layout.html sets the same attribute
 *  even earlier, including on circular-calendar.html which does NOT load this
 *  file (its ?theme= is for dial skins). Neon collides, so dial keeps ?theme=;
 *  site chrome elsewhere uses ?theme= for sp-theme.
 */
(function () {
  "use strict";
  var SITE = ["neon", "emerald", "dusk", "sage", "tide", "sand"];
  var FONTS = ["sans", "mono", "system"];
  var root = document.documentElement;

  function applyFont(name, persist) {
    name = String(name || "").toLowerCase();
    if (FONTS.indexOf(name) === -1) return false;
    root.setAttribute("data-font", name);
    if (persist) {
      try {
        localStorage.setItem("sp-font", name);
      } catch (e) {}
    }
    return true;
  }

  try {
    var fontParams = new URLSearchParams(location.search);
    var fontRaw = fontParams.get("font");
    if (fontRaw && applyFont(fontRaw, true)) {
      /* query wins */
    } else {
      applyFont(localStorage.getItem("sp-font") || "sans", false);
    }
  } catch (e) {
    applyFont("sans", false);
  }

  function apply(name, persist) {
    if (SITE.indexOf(name) === -1) return false;
    root.setAttribute("data-theme", name);
    if (persist) {
      try {
        localStorage.setItem("sp-theme", name);
      } catch (e) {}
    }
    return true;
  }

  try {
    var params = new URLSearchParams(location.search);
    // sp_theme wins when both exist (escape hatch; dial pages may use it later).
    var raw = params.get("sp_theme") || params.get("theme");
    if (raw) {
      raw = String(raw).toLowerCase();
      if (apply(raw, true)) return;
    }
  } catch (e) {}

  try {
    apply(localStorage.getItem("sp-theme") || "neon", false);
  } catch (e) {
    apply("neon", false);
  }
})();
