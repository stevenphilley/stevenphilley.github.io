/*! sp-font-ui.js — typeface switch next to the theme swatches.
 *  Options: sans (Helvetica Neue / Helvetica / Arial), mono (IBM Plex Mono),
 *  system (system-ui). Persists as sp-font. html[data-font] is set before
 *  first paint by head-layout.html and sp-theme-boot.js.
 */
(function () {
  "use strict";

  var FONTS = ["sans", "mono", "system"];
  var KEY = "sp-font";
  var root = document.documentElement;

  function setFont(name, persist) {
    name = String(name || "").toLowerCase();
    if (FONTS.indexOf(name) === -1) return;
    root.setAttribute("data-font", name);
    Array.prototype.forEach.call(document.querySelectorAll(".sp-font-btn[data-sp-font]"), function (b) {
      var on = b.getAttribute("data-sp-font") === name;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    if (persist) {
      try {
        localStorage.setItem(KEY, name);
      } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("fontchange", { detail: { font: name } }));
  }

  function init() {
    setFont(root.getAttribute("data-font") || "sans", false);
    Array.prototype.forEach.call(document.querySelectorAll(".sp-fonts"), function (group) {
      group.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest(".sp-font-btn") : null;
        if (!btn || !group.contains(btn)) return;
        setFont(btn.getAttribute("data-sp-font"), true);
      });
      group.addEventListener("keydown", function (ev) {
        var btn = ev.target.closest ? ev.target.closest(".sp-font-btn") : null;
        if (!btn || !group.contains(btn)) return;
        var buttons = Array.prototype.slice.call(group.querySelectorAll(".sp-font-btn"));
        var i = buttons.indexOf(btn);
        if (i < 0) return;
        var next = -1;
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown") next = (i + 1) % buttons.length;
        else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") next = (i - 1 + buttons.length) % buttons.length;
        else if (ev.key === "Home") next = 0;
        else if (ev.key === "End") next = buttons.length - 1;
        else return;
        ev.preventDefault();
        setFont(buttons[next].getAttribute("data-sp-font"), true);
        buttons[next].focus();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
