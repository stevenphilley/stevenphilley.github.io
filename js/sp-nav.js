/*! sp-nav.js — keyboard and disclosure behaviour for the shared primary nav.
 *  The markup and the search form live in _includes/nav.html and work without this file.
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function visibleSearch() {
    var narrow = window.matchMedia("(max-width: 1400px)").matches;
    if (narrow) return document.getElementById("sp-q-mobile");
    return document.getElementById("sp-q");
  }

  function focusSearch() {
    var narrow = window.matchMedia("(max-width: 1400px)").matches;
    var box = document.getElementById("sp-search-open");
    var pin = document.querySelector(".sp-search-pin");
    if (narrow && box) {
      box.checked = true;
      if (pin) pin.setAttribute("aria-expanded", "true");
      var mobile = document.getElementById("sp-q-mobile");
      if (mobile) {
        mobile.focus();
        if (typeof mobile.select === "function") mobile.select();
      }
      return;
    }
    var input = document.getElementById("sp-q");
    if (!input) return;
    input.focus();
    if (typeof input.select === "function") input.select();
  }

  function typingTarget(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var tag = (el.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function closeSubs(except) {
    var items = document.querySelectorAll(".sp-item.is-open");
    Array.prototype.forEach.call(items, function (item) {
      if (except && item === except) return;
      item.classList.remove("is-open");
      var btn = item.querySelector(".sp-sub-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  ready(function () {
    Array.prototype.forEach.call(document.querySelectorAll(".sp-year"), function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    var menuBox = document.getElementById("sp-menu-open");
    var menuLabel = document.querySelector(".sp-menu-btn");
    if (menuBox && menuLabel) {
      menuBox.addEventListener("change", function () {
        menuLabel.setAttribute("aria-expanded", menuBox.checked ? "true" : "false");
      });
    }
    var searchBox = document.getElementById("sp-search-open");
    var searchPin = document.querySelector(".sp-search-pin");
    if (searchBox) {
      searchBox.addEventListener("change", function () {
        if (searchPin) searchPin.setAttribute("aria-expanded", searchBox.checked ? "true" : "false");
        if (searchBox.checked) {
          var mobile = document.getElementById("sp-q-mobile");
          if (mobile) mobile.focus();
        }
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".sp-sub-toggle"), function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var item = btn.closest(".sp-item");
        if (!item) return;
        var willOpen = !item.classList.contains("is-open");
        closeSubs(willOpen ? item : null);
        item.classList.toggle("is-open", willOpen);
        btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
      btn.addEventListener("keydown", function (ev) {
        var item = btn.closest(".sp-item");
        if (!item) return;
        if (ev.key === "ArrowDown" || ev.key === "Enter" || ev.key === " ") {
          if (ev.key === "Enter" || ev.key === " ") ev.preventDefault();
          if (ev.key === "ArrowDown") ev.preventDefault();
          closeSubs(item);
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
          var first = item.querySelector(".sp-sub a");
          if (first && ev.key === "ArrowDown") first.focus();
        } else if (ev.key === "Escape") {
          item.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
          btn.focus();
        }
      });
    });

    document.addEventListener("click", function (ev) {
      if (!ev.target.closest || !ev.target.closest(".sp-item")) closeSubs(null);
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        closeSubs(null);
        if (menuBox && menuBox.checked) {
          menuBox.checked = false;
          if (menuLabel) menuLabel.setAttribute("aria-expanded", "false");
        }
        if (searchBox && searchBox.checked && document.activeElement && document.activeElement.id === "sp-q-mobile" && !document.getElementById("sp-q-mobile").value) {
          searchBox.checked = false;
          if (searchPin) searchPin.setAttribute("aria-expanded", "false");
        }
      }
    });

    var menu = document.getElementById("sp-menu");
    if (menu) {
      menu.addEventListener("click", function (ev) {
        var link = ev.target.closest && ev.target.closest("a");
        if (!link || !menuBox) return;
        if (window.matchMedia("(max-width: 1400px)").matches) {
          menuBox.checked = false;
          if (menuLabel) menuLabel.setAttribute("aria-expanded", "false");
        }
      });
    }

    setupLayoutWidth();
  });

  function layoutMode() {
    return document.documentElement.classList.contains("layout-fill") ? "fill" : "std";
  }

  function paintLayout(mode) {
    var fill = mode === "fill";
    document.documentElement.classList.toggle("layout-fill", fill);
    var buttons = document.querySelectorAll("[data-sp-layout]");
    Array.prototype.forEach.call(buttons, function (btn) {
      var on = btn.getAttribute("data-sp-layout") === (fill ? "fill" : "std");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
    });
  }

  function chooseLayout(mode, track) {
    if (mode !== "std" && mode !== "fill") return;
    var changed = mode !== layoutMode();
    paintLayout(mode);
    try {
      localStorage.setItem("sp-layout", mode);
    } catch (e) {}
    if (track && changed && typeof window.gtag === "function") {
      window.gtag("event", "layout_width", { mode: mode });
    }
    if (changed) {
      requestAnimationFrame(function () {
        window.dispatchEvent(new Event("resize"));
      });
    }
  }

  function setupLayoutWidth() {
    paintLayout(layoutMode());
    var groups = document.querySelectorAll(".sp-width");
    Array.prototype.forEach.call(groups, function (group) {
      var buttons = group.querySelectorAll("[data-sp-layout]");
      Array.prototype.forEach.call(buttons, function (btn) {
        btn.addEventListener("click", function () {
          chooseLayout(btn.getAttribute("data-sp-layout"), true);
          btn.focus();
        });
      });
      group.addEventListener("keydown", function (ev) {
        var key = ev.key;
        if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown" && key !== "Home" && key !== "End") return;
        var list = Array.prototype.slice.call(buttons);
        if (!list.length) return;
        ev.preventDefault();
        var index = list.indexOf(document.activeElement);
        if (index < 0) index = list.findIndex(function (b) { return b.getAttribute("aria-pressed") === "true"; });
        if (index < 0) index = 0;
        var next = index;
        if (key === "Home" || key === "ArrowLeft" || key === "ArrowUp") next = key === "Home" ? 0 : (index + list.length - 1) % list.length;
        if (key === "End" || key === "ArrowRight" || key === "ArrowDown") next = key === "End" ? list.length - 1 : (index + 1) % list.length;
        chooseLayout(list[next].getAttribute("data-sp-layout"), true);
        list[next].focus();
      });
    });
  }

  document.addEventListener(
    "keydown",
    function (ev) {
      if (ev.defaultPrevented) return;
      if (typingTarget(ev.target)) return;
      var key = ev.key;
      var chord = (ev.metaKey || ev.ctrlKey) && !ev.altKey && (key === "k" || key === "K");
      var slash = key === "/" && !ev.metaKey && !ev.ctrlKey && !ev.altKey;
      if (!chord && !slash) return;
      if (!visibleSearch() && !document.getElementById("sp-q")) return;
      ev.preventDefault();
      ev.stopPropagation();
      focusSearch();
    },
    true
  );
})();
