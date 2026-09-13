/*! sp-theme-ui.js — site theme swatches: click to choose, drag tiles to reorder favorites.
 *  Persists palette in sp-theme and tile order in sp-theme-order (localStorage).
 *  Shows a "?" tip while reordering (and on ? click).
 */
(function () {
  "use strict";

  var SITE = ["neon", "emerald", "dusk", "sage", "tide", "sand"];
  var ORDER_KEY = "sp-theme-order";
  var THEME_KEY = "sp-theme";
  var HELP =
    "<strong>Themes</strong><br>Click a tile to apply it site-wide.<br>Drag tiles to put favorites first (saved here as sp-theme-order).<br>Keyboard: Alt+← / Alt+→ on a focused tile.";
  var root = document.documentElement;
  var openTip = null;

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

  function showTip(wrap, forceOpen) {
    var tip = wrap.querySelector(".sp-theme-help-tip");
    var btn = wrap.querySelector(".sp-theme-help-btn");
    if (!tip || !btn) return;
    if (openTip && openTip !== tip) {
      openTip.classList.remove("is-open");
      var ob = openTip.parentNode && openTip.parentNode.querySelector(".sp-theme-help-btn");
      if (ob) ob.setAttribute("aria-expanded", "false");
    }
    tip.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    openTip = tip;
    if (!forceOpen) return;
  }

  function hideTip(wrap) {
    var tip = wrap.querySelector(".sp-theme-help-tip");
    var btn = wrap.querySelector(".sp-theme-help-btn");
    if (!tip) return;
    tip.classList.remove("is-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (openTip === tip) openTip = null;
  }

  function ensureHelp(container) {
    var parent = container.parentNode;
    if (!parent) return null;
    if (parent.classList.contains("sp-theme-help-wrap")) return parent;

    var wrap = document.createElement("div");
    wrap.className = "sp-theme-help-wrap";
    parent.insertBefore(wrap, container);
    wrap.appendChild(container);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sp-theme-help-btn";
    btn.setAttribute("aria-label", "How to reorder theme tiles");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("title", "How to reorder");
    btn.textContent = "?";

    var tip = document.createElement("div");
    tip.className = "sp-theme-help-tip";
    tip.setAttribute("role", "status");
    tip.innerHTML = HELP;

    wrap.appendChild(btn);
    wrap.appendChild(tip);

    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (tip.classList.contains("is-open") && !wrap.classList.contains("is-reordering")) {
        hideTip(wrap);
      } else {
        showTip(wrap, true);
      }
    });

    return wrap;
  }

  function wireGroup(container) {
    if (container.getAttribute("data-sp-theme-ui") === "1") return;
    container.setAttribute("data-sp-theme-ui", "1");
    var wrap = ensureHelp(container);
    var label = container.getAttribute("aria-label") || "Colour theme";
    if (label.indexOf("reorder") === -1) {
      container.setAttribute("aria-label", label + " — drag tiles to reorder");
    }
    container.title = "Click a tile to apply · drag to put favorites first";

    Array.prototype.forEach.call(container.querySelectorAll(".swatch[data-set]"), function (btn) {
      var ptr = null;

      btn.addEventListener("pointerdown", function (ev) {
        if (ev.button != null && ev.button !== 0) return;
        ptr = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, dragging: false };
      });

      btn.addEventListener("pointermove", function (ev) {
        if (!ptr || ptr.id !== ev.pointerId) return;
        var dx = ev.clientX - ptr.x;
        var dy = ev.clientY - ptr.y;
        if (!ptr.dragging && dx * dx + dy * dy > 25) {
          ptr.dragging = true;
          btn.classList.add("is-dragging");
          container.classList.add("is-reordering");
          if (wrap) {
            wrap.classList.add("is-reordering");
            showTip(wrap, false); // activating reorder shows ?
          }
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
          if (wrap) wrap.classList.remove("is-reordering");
          var order = orderFromContainer(container);
          writeOrder(order);
          syncAllOrders(order);
          // keep ? tip open briefly after drop so the reminder is readable
          if (wrap) {
            showTip(wrap, true);
            setTimeout(function () {
              if (wrap && !wrap.matches(":hover") && document.activeElement !== wrap.querySelector(".sp-theme-help-btn")) {
                hideTip(wrap);
              }
            }, 3200);
          }
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
          if (wrap) showTip(wrap, true);
          container.querySelector('.swatch[data-set="' + name + '"]').focus();
        } else if (ev.key === "ArrowRight" && ev.altKey && i < order.length - 1) {
          ev.preventDefault();
          order.splice(i, 1);
          order.splice(i + 1, 0, name);
          writeOrder(order);
          syncAllOrders(order);
          if (wrap) showTip(wrap, true);
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

    document.addEventListener("click", function (ev) {
      if (!openTip) return;
      if (ev.target.closest && ev.target.closest(".sp-theme-help-wrap")) return;
      var wraps = document.querySelectorAll(".sp-theme-help-wrap");
      Array.prototype.forEach.call(wraps, function (w) {
        if (!w.classList.contains("is-reordering")) hideTip(w);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
