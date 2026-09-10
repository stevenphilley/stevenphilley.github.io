/*! sp-share.js — Share control with current theme in the URL.
 *  Share URL = canonical page URL with theme param set/replaced (no duplicates).
 *  Site pages: ?theme=<neon|emerald|dusk|sage|tide|sand>
 *  circular-calendar.html: ?theme=<dial skin> (brass|led|vapor|hallow|xmas|neon)
 *  Optional: data-sp-share-param="sp_theme" on <html> to force that query key.
 */
(function () {
  "use strict";

  var SITE = ["neon", "emerald", "dusk", "sage", "tide", "sand"];
  var DIAL = ["brass", "led", "vapor", "hallow", "xmas", "neon"];
  var MARKET = ["accounting", "emerald-light", "emerald-dark"];

  function isDialPage() {
    if (document.documentElement.getAttribute("data-sp-share") === "dial") return true;
    return /\/circular-calendar\.html$/i.test(location.pathname);
  }

  function isMarketsThemePage() {
    if (document.documentElement.getAttribute("data-sp-share") === "markets") return true;
    var t = document.documentElement.getAttribute("data-theme") || "";
    return MARKET.indexOf(t) > -1;
  }

  function themeParamName() {
    var forced = document.documentElement.getAttribute("data-sp-share-param");
    if (forced) return forced;
    return "theme";
  }

  function currentTheme() {
    var root = document.documentElement;
    var body = document.body;
    var t =
      root.getAttribute("data-theme") ||
      (body && body.getAttribute("data-theme")) ||
      "";
    t = String(t).toLowerCase();
    if (isDialPage()) return DIAL.indexOf(t) > -1 ? t : "brass";
    if (isMarketsThemePage()) return MARKET.indexOf(t) > -1 ? t : "accounting";
    if (t === "glow") return "glow"; // chakras-only bloom
    if (SITE.indexOf(t) > -1) return t;
    try {
      var stored = localStorage.getItem("sp-theme") || "neon";
      return SITE.indexOf(stored) > -1 ? stored : "neon";
    } catch (e) {
      return "neon";
    }
  }

  function themedShareUrl(baseHref) {
    var url;
    try {
      url = new URL(baseHref || location.href, location.href);
    } catch (e) {
      return location.href;
    }
    var key = themeParamName();
    var theme = currentTheme();
    // Replace theme / sp_theme cleanly — no duplicate keys.
    url.searchParams.delete("theme");
    url.searchParams.delete("sp_theme");
    url.searchParams.set(key, theme);
    return url.toString();
  }

  function ensureStyles() {
    if (document.getElementById("sp-share-styles")) return;
    var css = document.createElement("style");
    css.id = "sp-share-styles";
    css.textContent =
      ".sp-share-btn{" +
      "appearance:none;background:transparent;border:1px solid var(--line,var(--hair,rgba(255,255,255,.18)));" +
      "color:var(--muted,var(--ink-soft,#9b9a96));font-family:\"IBM Plex Mono\",ui-monospace,monospace;" +
      "font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;cursor:pointer;" +
      "line-height:1;border-radius:1px;opacity:.85;transition:color .15s ease,border-color .15s ease,opacity .15s ease" +
      "}" +
      ".sp-share-btn:hover,.sp-share-btn:focus-visible{color:var(--ink,#e8e6e1);border-color:var(--ink,#e8e6e1);opacity:1;outline:none}" +
      ".sp-share-btn.is-copied{color:var(--accent,var(--ink,#e8e6e1));border-color:currentColor}" +
      ".header-top-right .sp-share-btn,.themes + .sp-share-btn{margin-left:.35rem}" +
      ".sp-share-fab{" +
      "position:fixed;right:14px;bottom:14px;z-index:40;box-shadow:0 8px 24px rgba(0,0,0,.28);" +
      "background:color-mix(in srgb,var(--base,#14161c) 88%,transparent);backdrop-filter:blur(8px)" +
      "}" +
      ".sp-share-toast{" +
      "position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(8px);" +
      "z-index:50;padding:8px 14px;border:1px solid var(--line,rgba(255,255,255,.2));" +
      "background:color-mix(in srgb,var(--base,#14161c) 92%,transparent);color:var(--ink,#e8e6e1);" +
      "font-family:\"IBM Plex Mono\",ui-monospace,monospace;font-size:11px;letter-spacing:.08em;" +
      "text-transform:uppercase;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;" +
      "border-radius:2px;backdrop-filter:blur(8px)" +
      "}" +
      ".sp-share-toast.is-on{opacity:1;transform:translateX(-50%) translateY(0)}" +
      
      ".sp-suggest-btn{" +
      "appearance:none;background:transparent;border:1px solid var(--line,var(--hair,rgba(255,255,255,.18)));" +
      "color:var(--muted,var(--ink-soft,#9b9a96));font-family:\"IBM Plex Mono\",ui-monospace,monospace;" +
      "font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;cursor:pointer;" +
      "line-height:1;border-radius:1px;opacity:.75;transition:color .15s ease,border-color .15s ease,opacity .15s ease;" +
      "text-decoration:none;display:inline-flex;align-items:center" +
      "}" +
      ".sp-suggest-btn:hover,.sp-suggest-btn:focus-visible{color:var(--ink,#e8e6e1);border-color:var(--ink,#e8e6e1);opacity:1;outline:none}" +
      ".header-top-right .sp-suggest-btn,.themes + .sp-share-btn + .sp-suggest-btn,.sp-share-btn + .sp-suggest-btn{margin-left:.35rem}" +
      ".sp-share-fab + .sp-suggest-btn,.sp-suggest-fab{" +
      "position:fixed;right:14px;bottom:52px;z-index:40;box-shadow:0 8px 24px rgba(0,0,0,.28);" +
      "background:color-mix(in srgb,var(--base,#14161c) 88%,transparent);backdrop-filter:blur(8px)" +
      "}";
    document.head.appendChild(css);
  }

  var toastEl = null;
  var toastTimer = null;
  function toast(msg) {
    ensureStyles();
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "sp-share-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-on");
    }, 1600);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-9999px;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function copyUrl(url, btn) {
    function done(ok) {
      if (btn) {
        btn.classList.add("is-copied");
        var prev = btn.getAttribute("data-label") || btn.textContent;
        btn.setAttribute("data-label", prev);
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.textContent = btn.getAttribute("data-label") || "Share";
          btn.classList.remove("is-copied");
        }, 1400);
      }
      toast(ok ? "Copied" : "Copy the address bar to share");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () {
          done(true);
        },
        function () {
          done(legacyCopy(url));
        }
      );
    } else {
      done(legacyCopy(url));
    }
  }

  function shareFrom(btn) {
    var url = themedShareUrl();
    var title = document.title || "Steven Philley";
    var payload = { title: title, url: url };
    if (navigator.share) {
      navigator.share(payload).catch(function (err) {
        if (err && err.name === "AbortError") return;
        copyUrl(url, btn);
      });
    } else {
      copyUrl(url, btn);
    }
  }

  function wire(btn) {
    if (!btn || btn.getAttribute("data-sp-share-wired") === "1") return;
    btn.setAttribute("data-sp-share-wired", "1");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      shareFrom(btn);
    });
  }

  function makeButton(extraClass) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sp-share-btn" + (extraClass ? " " + extraClass : "");
    btn.setAttribute("data-sp-share", "");
    btn.setAttribute("aria-label", "Share this page with current theme");
    btn.title = "Share link with current theme";
    btn.textContent = "Share";
    return btn;
  }

  function suggestHref() {
    var page = location.pathname + (location.search || "");
    return "/suggest/?page=" + encodeURIComponent(page);
  }

  function makeSuggestLink(extraClass) {
    var a = document.createElement("a");
    a.href = suggestHref();
    a.className = "sp-suggest-btn" + (extraClass ? " " + extraClass : "");
    a.setAttribute("data-sp-suggest", "");
    a.setAttribute("aria-label", "Suggest an idea about this page");
    a.title = "Suggest an idea about this page";
    a.textContent = "Suggest";
    return a;
  }

  function placeSuggestBeside(shareEl, fab) {
    if (document.querySelector("[data-sp-suggest]")) return;
    var link = makeSuggestLink(fab ? "sp-suggest-fab" : "");
    if (shareEl && shareEl.parentNode) {
      if (shareEl.nextSibling) shareEl.parentNode.insertBefore(link, shareEl.nextSibling);
      else shareEl.parentNode.appendChild(link);
    } else {
      document.body.appendChild(link);
    }
  }

  function placeButton() {
    var existing = document.querySelectorAll("[data-sp-share], .sp-share-btn");
    if (existing.length) {
      Array.prototype.forEach.call(existing, wire);
      placeSuggestBeside(existing[0], false);
      return;
    }

    // Prefer sitting beside theme swatches / markets theme switcher.
    var anchor =
      document.querySelector(".header-top-right .themes") ||
      document.querySelector(".themes") ||
      document.querySelector("[aria-label='Colour theme'], [aria-label='Color theme'], [aria-label='background theme']");
    if (anchor && anchor.parentNode) {
      var btn = makeButton();
      if (anchor.nextSibling) anchor.parentNode.insertBefore(btn, anchor.nextSibling);
      else anchor.parentNode.appendChild(btn);
      wire(btn);
      placeSuggestBeside(btn, false);
      return;
    }

    // Quiet floating fallback — avoid cluttering photo grids with chrome.
    var fab = makeButton("sp-share-fab");
    document.body.appendChild(fab);
    wire(fab);
    placeSuggestBeside(fab, true);
  }

  // Public helpers for pages with custom share (lightbox, typing results).
  window.spShare = {
    url: themedShareUrl,
    theme: currentTheme,
    share: function () {
      shareFrom(null);
    },
    copy: function (url) {
      copyUrl(url || themedShareUrl(), null);
    },
  };

  function boot() {
    ensureStyles();
    placeButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
