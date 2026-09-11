/*! sp-md-reader.js — live Markdown reader for stevenphilley.com
 *  Config via window.SP_MD_READER before this script loads:
 *    { allowlist: [{path, label}], defaultDoc, lockDoc?: boolean,
 *      titleEl?: selector, kicker?: string, disclaimer?: string }
 */
(function () {
  "use strict";

  var FONT_KEY = "sp-reader-font-size";
  var THEMES = ["neon", "emerald", "dusk", "sage", "tide", "sand"];
  var THEME_KEY = "sp-theme";
  var cfg = window.SP_MD_READER || {};
  var allowlist = Array.isArray(cfg.allowlist) ? cfg.allowlist : [];
  var allowMap = {};
  allowlist.forEach(function (d) {
    if (d && d.path) allowMap[normalizePath(d.path)] = d;
  });

  var defaultDoc = normalizePath(cfg.defaultDoc || (allowlist[0] && allowlist[0].path) || "");
  var lockDoc = !!cfg.lockDoc;

  var els = {};
  var currentPath = defaultDoc;
  var headings = [];

  function normalizePath(p) {
    if (!p) return "";
    p = String(p).trim();
    try {
      // Reject absolute URLs / protocols / escapes
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(p)) return "";
      if (p.indexOf("//") === 0) return "";
      if (p.indexOf("\\") !== -1) return "";
      if (p.indexOf("..") !== -1) return "";
      if (p.charAt(0) !== "/") p = "/" + p;
      // Collapse duplicate slashes
      p = p.replace(/\/+/g, "/");
      return p;
    } catch (e) {
      return "";
    }
  }

  function resolveDocFromQuery() {
    if (lockDoc) return defaultDoc;
    try {
      var q = new URLSearchParams(location.search).get("doc");
      if (!q) return defaultDoc;
      var n = normalizePath(q);
      if (n && allowMap[n]) return n;
    } catch (e) {}
    return defaultDoc;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function paintTheme() {
    var cur = document.documentElement.getAttribute("data-theme") || "neon";
    document.querySelectorAll("[data-set-theme]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-theme") === cur));
    });
  }

  function setTheme(name) {
    if (THEMES.indexOf(name) < 0) name = "neon";
    document.documentElement.setAttribute("data-theme", name);
    try {
      localStorage.setItem(THEME_KEY, name);
    } catch (e) {}
    paintTheme();
  }

  function getFontSize() {
    try {
      var v = parseInt(localStorage.getItem(FONT_KEY), 10);
      if (v >= 14 && v <= 28) return v;
    } catch (e) {}
    return 18;
  }

  function setFontSize(px) {
    px = Math.max(14, Math.min(28, px));
    document.documentElement.style.setProperty("--reader-font", px + "px");
    try {
      localStorage.setItem(FONT_KEY, String(px));
    } catch (e) {}
    var label = $("rd-font-label");
    if (label) label.textContent = px + "px";
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/&[^;]+;/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "section";
  }

  function uniqueId(base, used) {
    var id = base;
    var n = 2;
    while (used[id]) {
      id = base + "-" + n;
      n++;
    }
    used[id] = true;
    return id;
  }

  function buildToc(article) {
    var tocNav = $("rd-toc");
    var tocMobile = $("rd-toc-mobile");
    if (!tocNav) return;
    tocNav.innerHTML = "";
    if (tocMobile) tocMobile.innerHTML = "";
    headings = [];
    var used = {};
    var nodes = article.querySelectorAll("h1, h2, h3");
    nodes.forEach(function (h) {
      var level = parseInt(h.tagName.charAt(1), 10);
      var text = h.textContent.trim();
      if (!text) return;
      var id = h.id || uniqueId(slugify(text), used);
      h.id = id;
      headings.push({ id: id, text: text, level: level, el: h });
      var a = document.createElement("a");
      a.href = "#" + id;
      a.textContent = text;
      a.className = "rd-toc-link rd-toc-l" + level;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + id);
        closeMobileToc();
      });
      tocNav.appendChild(a);
      if (tocMobile) {
        var a2 = a.cloneNode(true);
        a2.addEventListener("click", function (e) {
          e.preventDefault();
          h.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", "#" + id);
          closeMobileToc();
        });
        tocMobile.appendChild(a2);
      }
    });
    var empty = $("rd-toc-empty");
    if (empty) empty.hidden = headings.length > 0;
  }

  function updateProgress() {
    var bar = $("rd-progress");
    if (!bar) return;
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop;
    var height = doc.scrollHeight - window.innerHeight;
    var pct = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
    bar.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function updateActiveToc() {
    if (!headings.length) return;
    var y = window.scrollY + 120;
    var active = headings[0];
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].el.offsetTop <= y) active = headings[i];
      else break;
    }
    document.querySelectorAll(".rd-toc-link").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + active.id);
    });
  }

  function openMobileToc() {
    var drawer = $("rd-toc-drawer");
    if (drawer) {
      drawer.hidden = false;
      drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("rd-toc-open");
    }
  }

  function closeMobileToc() {
    var drawer = $("rd-toc-drawer");
    if (drawer) {
      drawer.hidden = true;
      drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("rd-toc-open");
    }
  }

  function setStatus(msg, isError) {
    var s = $("rd-status");
    if (!s) return;
    s.textContent = msg || "";
    s.classList.toggle("is-error", !!isError);
  }

  function updateChrome(path) {
    var meta = allowMap[path] || { path: path, label: path };
    var title = $("rd-doc-title");
    if (title) title.textContent = meta.label || path;
    var dl = $("rd-download");
    var raw = $("rd-raw");
    if (dl) {
      dl.href = path;
      dl.setAttribute("download", path.split("/").pop() || "document.md");
    }
    if (raw) raw.href = path;
    var picker = $("rd-doc-picker");
    if (picker && !lockDoc) {
      picker.value = path;
    }
    if (!lockDoc) {
      try {
        var url = new URL(location.href);
        url.searchParams.set("doc", path);
        // Keep theme param if present via share, don't strip
        history.replaceState(null, "", url.pathname + url.search + location.hash);
      } catch (e) {}
    }
    if (cfg.onDocChange) {
      try {
        cfg.onDocChange(path, meta);
      } catch (e) {}
    }
  }

  function renderMarkdown(md) {
    var article = $("rd-article");
    if (!article) return;
    var html;
    if (typeof marked !== "undefined" && marked.parse) {
      if (marked.setOptions) {
        marked.setOptions({
          gfm: true,
          breaks: false,
          headerIds: false,
          mangle: false
        });
      }
      html = marked.parse(md);
    } else {
      html = "<pre class=\"rd-fallback\">" + escapeHtml(md) + "</pre>";
      setStatus("Markdown parser unavailable — showing plain text.", true);
    }
    if (typeof DOMPurify !== "undefined") {
      html = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ["target", "rel"]
      });
    }
    article.innerHTML = html;
    // Soften external links
    article.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute("rel", "noopener noreferrer");
        a.setAttribute("target", "_blank");
      }
    });
    buildToc(article);
    // Jump to hash if present
    if (location.hash.length > 1) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) {
        setTimeout(function () {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    }
    updateProgress();
    updateActiveToc();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function loadDoc(path) {
    path = normalizePath(path);
    if (!path || !allowMap[path]) {
      setStatus("Document not on the allowlist.", true);
      return;
    }
    currentPath = path;
    updateChrome(path);
    setStatus("Loading…");
    var article = $("rd-article");
    if (article) article.setAttribute("aria-busy", "true");

    fetch(path, { credentials: "same-origin", cache: "force-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (md) {
        renderMarkdown(md);
        setStatus("");
        if (article) article.setAttribute("aria-busy", "false");
      })
      .catch(function (err) {
        setStatus("Could not load " + path + " (" + (err && err.message ? err.message : "error") + ").", true);
        if (article) {
          article.innerHTML = "<p class=\"rd-error\">Failed to load document.</p>";
          article.setAttribute("aria-busy", "false");
        }
      });
  }

  function fillPicker() {
    var picker = $("rd-doc-picker");
    if (!picker || lockDoc) {
      var wrap = $("rd-picker-wrap");
      if (wrap && lockDoc) wrap.hidden = true;
      return;
    }
    picker.innerHTML = "";
    allowlist.forEach(function (d) {
      var opt = document.createElement("option");
      opt.value = d.path;
      opt.textContent = d.label || d.path;
      picker.appendChild(opt);
    });
    picker.addEventListener("change", function () {
      loadDoc(picker.value);
    });
  }

  function wireUi() {
    document.querySelectorAll("[data-set-theme]").forEach(function (b) {
      b.addEventListener("click", function () {
        setTheme(b.getAttribute("data-set-theme"));
      });
    });
    paintTheme();

    var minus = $("rd-font-minus");
    var plus = $("rd-font-plus");
    if (minus) minus.addEventListener("click", function () { setFontSize(getFontSize() - 1); });
    if (plus) plus.addEventListener("click", function () { setFontSize(getFontSize() + 1); });
    setFontSize(getFontSize());

    var tocBtn = $("rd-toc-toggle");
    if (tocBtn) tocBtn.addEventListener("click", openMobileToc);
    var tocClose = $("rd-toc-close");
    if (tocClose) tocClose.addEventListener("click", closeMobileToc);
    var tocBackdrop = $("rd-toc-backdrop");
    if (tocBackdrop) tocBackdrop.addEventListener("click", closeMobileToc);

    window.addEventListener("scroll", function () {
      updateProgress();
      updateActiveToc();
    }, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileToc();
    });
  }

  function boot() {
    fillPicker();
    wireUi();
    var path = resolveDocFromQuery();
    loadDoc(path);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.SPMdReader = { loadDoc: loadDoc, setTheme: setTheme };
})();
