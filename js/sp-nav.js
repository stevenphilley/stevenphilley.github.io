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
    var narrow = window.matchMedia("(max-width: 1240px)").matches;
    if (narrow) return document.getElementById("sp-q-mobile");
    return document.getElementById("sp-q");
  }

  function focusSearch() {
    var narrow = window.matchMedia("(max-width: 1240px)").matches;
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
        if (window.matchMedia("(max-width: 1240px)").matches) {
          menuBox.checked = false;
          if (menuLabel) menuLabel.setAttribute("aria-expanded", "false");
        }
      });
    }
  });

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
