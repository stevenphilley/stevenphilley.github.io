/*! sp-theme-ui.js — site theme swatches: click to choose, drag tiles to reorder favorites.
 *  Persists palette in sp-theme and tile order in sp-theme-order (localStorage).
 */
(function () {
  "use strict";

  var SITE = ["neon", "emerald", "dusk", "sage", "tide", "sand"];
  var ORDER_KEY = "sp-theme-order";
  var THEME_KEY = "sp-theme";
  var root = document.documentElement;

  function readOrder() {
    try {
      var raw = localStorage.getItem(ORDER_KEY);
      if (!raw) return SITE.slice();
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return SITE.slice();
      var out = [];
      arr.forEach(function (n) {
        n = String(n).toLowerCase();
        if (SITE.indexOf(n) > -1 && out.indexOf(n) === -1) out.push(n);
      });
      SITE.forEach(function (n) {
        if (out.indexOf(n) === -1) out.push(n);
      });
      return out;
    } catch (e) {
      return SITE.slice();
    }
  }

  function writeOrder(order) {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch (e) {}
  }

  function orderFromContainer(container) {
    return Array.prototype.map
      .call(container.querySelectorAll(".swatch[data-set]"), function (b) {
        return b.getAttribute("data-set");
      })
      .filter(function (n) {
        return SITE.indexOf(n) > -1;
      });
  }

  function applyOrder(container, order) {
    var map = {};
    Array.prototype.forEach.call(container.querySelectorAll(".swatch[data-set]"), function (b) {
      map[b.getAttribute("data-set")] = b;
    });
    order.forEach(function (name) {
      if (map[name]) container.appendChild(map[name]);
    });
  }

  function syncAllOrders(order) {
    Array.prototype.forEach.call(document.querySelectorAll(".themes"), function (group) {
      if (!group.querySelector(".swatch[data-set]")) return;
      applyOrder(group, order);
    });
  }

  function setTheme(name, persist) {
    if (SITE.indexOf(name) === -1) return;
    root.setAttribute("data-theme", name);
    Array.prototype.forEach.call(document.querySelectorAll(".swatch[data-set]"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-set") === name ? "true" : "false");
    });
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, name);
      } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: name } }));
  }

  function insertPoint(container, clientX) {
    var swatches = Array.prototype.slice.call(container.querySelectorAll(".swatch[data-set]"));
    for (var i = 0; i < swatches.length; i++) {
      var r = swatches[i].getBoundingClientRect();
      if (clientX < r.left + r.width / 2) return swatches[i];
    }
    return null;
  }

  function wireGroup(container) {
    if (container.getAttribute("data-sp-theme-ui") === "1") return;
    container.setAttribute("data-sp-theme-ui", "1");
    var label = container.getAttribute("aria-label") || "Colour theme";
    if (label.indexOf("reorder") === -1) {
      container.setAttribute("aria-label", label + " — drag tiles to reorder");
    }
    container.title = "Click a tile to apply · drag to put favorites first";

    Array.prototype.forEach.call(container.querySelectorAll(".swatch[data-set]"), function (btn) {
      var ptr = null;

      btn.addEventListener("pointerdown", function (ev) {
        if (ev.button != null && ev.button !== 0) return;
        ptr = {
          id: ev.pointerId,
          x: ev.clientX,
          y: ev.clientY,
          dragging: false
        };
      });

      btn.addEventListener("pointermove", function (ev) {
        if (!ptr || ptr.id !== ev.pointerId) return;
        var dx = ev.clientX - ptr.x;
        var dy = ev.clientY - ptr.y;
        if (!ptr.dragging && dx * dx + dy * dy > 25) {
          ptr.dragging = true;
          btn.classList.add("is-dragging");
          container.classList.add("is-reordering");
          try {
            btn.setPointerCapture(ev.pointerId);
          } catch (e) {}
        }
        if (!ptr.dragging) return;
        ev.preventDefault();
        var before = insertPoint(container, ev.clientX);
        if (before && before !== btn) container.insertBefore(btn, before);
        else if (!before) container.appendChild(btn);
      });

      function endPtr(ev) {
        if (!ptr || ptr.id !== ev.pointerId) return;
        if (ptr.dragging) {
          btn.classList.remove("is-dragging");
          container.classList.remove("is-reordering");
          var order = orderFromContainer(container);
          writeOrder(order);
          syncAllOrders(order);
          btn.__spSuppressClick = true;
          setTimeout(function () {
            btn.__spSuppressClick = false;
          }, 0);
        }
        ptr = null;
      }

      btn.addEventListener("pointerup", endPtr);
      btn.addEventListener("pointercancel", endPtr);

      btn.addEventListener("click", function (ev) {
        if (btn.__spSuppressClick) {
          ev.preventDefault();
          ev.stopPropagation();
          return;
        }
        setTheme(btn.getAttribute("data-set"), true);
      });

      btn.addEventListener("keydown", function (ev) {
        var order = orderFromContainer(container);
        var name = btn.getAttribute("data-set");
        var i = order.indexOf(name);
        if (i < 0) return;
        if (ev.key === "ArrowLeft" && ev.altKey && i > 0) {
          ev.preventDefault();
          order.splice(i, 1);
          order.splice(i - 1, 0, name);
          writeOrder(order);
          syncAllOrders(order);
          container.querySelector('.swatch[data-set="' + name + '"]').focus();
        } else if (ev.key === "ArrowRight" && ev.altKey && i < order.length - 1) {
          ev.preventDefault();
          order.splice(i, 1);
          order.splice(i + 1, 0, name);
          writeOrder(order);
          syncAllOrders(order);
          container.querySelector('.swatch[data-set="' + name + '"]').focus();
        }
      });
    });
  }

  function init() {
    syncAllOrders(readOrder());
    Array.prototype.forEach.call(document.querySelectorAll(".themes"), function (group) {
      if (group.querySelector(".swatch[data-set]")) wireGroup(group);
    });
    setTheme(root.getAttribute("data-theme") || "neon", false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
