/*! sp-theme-boot.js — early site theme from ?theme= / ?sp_theme= then localStorage.
 *  Site themes: neon|emerald|dusk|sage|tide|sand (key: sp-theme, attr: html[data-theme]).
 *  circular-calendar.html does NOT load this file: its ?theme= is for dial skins
 *  (brass|led|vapor|hallow|xmas|neon) under annual-dial-theme. Neon collides, so
 *  dial keeps ?theme=; site chrome elsewhere uses ?theme= for sp-theme.
 */
(function () {
  "use strict";
  var SITE = ["neon", "emerald", "dusk", "sage", "tide", "sand"];
  var root = document.documentElement;

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
