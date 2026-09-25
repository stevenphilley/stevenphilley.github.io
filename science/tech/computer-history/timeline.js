(function () {
  "use strict";

  var app = document.getElementById("ch-app");
  if (!app) return;

  var viewport = document.getElementById("ch-viewport");
  var world = document.getElementById("ch-world");
  var listEl = document.getElementById("ch-list");
  var chipsEl = document.getElementById("ch-chips");
  var legendEl = document.getElementById("ch-legend");
  var countEl = document.getElementById("ch-count");
  var centerEl = document.getElementById("ch-center");
  var live = document.getElementById("ch-live");
  var dialog = document.getElementById("ch-dialog");
  var qInput = document.getElementById("ch-q");
  var yearInput = document.getElementById("ch-year");
  var helpBtn = document.getElementById("ch-help");
  var helpPanel = document.getElementById("ch-help-panel");
  var emptyEl = document.getElementById("ch-empty");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BASE = 6400;
  var zoom = 1;
  var data = null;
  var catOn = {};
  var compare = false;
  var query = "";
  var visible = [];
  var selected = -1;
  var openId = null;
  var buttons = [];
  var urlLock = false;

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function $(id) { return document.getElementById(id); }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function parts(date) {
    var m = /^(-?\d+)(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(date || "");
    if (!m) return { year: 0, month: 1, day: 1 };
    return { year: parseInt(m[1], 10), month: m[2] ? parseInt(m[2], 10) : 1, day: m[3] ? parseInt(m[3], 10) : 1 };
  }

  function valueOf(ev) {
    var p = parts(ev.date);
    if (p.year < 0) return p.year;
    return p.year + ((p.month - 1) + (p.day - 1) / 31) / 12;
  }

  function formatDate(ev) {
    var p = parts(ev.date);
    if (p.year < 0) return Math.abs(p.year) + " BCE";
    if (ev.precision === "year") return String(p.year);
    if (ev.precision === "month") return MONTHS[p.month - 1] + " " + p.year;
    return MONTHS[p.month - 1] + " " + p.day + ", " + p.year;
  }

  function formatYear(y) {
    y = Math.round(y);
    if (y < 0) return Math.abs(y) + " BCE";
    return String(y);
  }

  function ratioOf(year) {
    var stops = data.scale.stops;
    if (year <= stops[0][0]) return stops[0][1];
    var last = stops[stops.length - 1];
    if (year >= last[0]) return last[1];
    for (var i = 1; i < stops.length; i++) {
      var a = stops[i - 1];
      var b = stops[i];
      if (year <= b[0]) {
        var t = (year - a[0]) / (b[0] - a[0]);
        return a[1] + t * (b[1] - a[1]);
      }
    }
    return 1;
  }

  function yearOf(ratio) {
    var stops = data.scale.stops;
    if (ratio <= stops[0][1]) return stops[0][0];
    var last = stops[stops.length - 1];
    if (ratio >= last[1]) return last[0];
    for (var i = 1; i < stops.length; i++) {
      var a = stops[i - 1];
      var b = stops[i];
      if (ratio <= b[1]) {
        var t = (ratio - a[1]) / (b[1] - a[1]);
        return a[0] + t * (b[0] - a[0]);
      }
    }
    return last[0];
  }

  function worldWidth() { return BASE * zoom; }

  function catColor(id) {
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) return data.categories[i].color;
    }
    return "#c8b48a";
  }

  function catLabel(id) {
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) return data.categories[i].label;
    }
    return id;
  }

  function passes(ev) {
    var ok = false;
    for (var i = 0; i < ev.categories.length; i++) {
      if (catOn[ev.categories[i]]) ok = true;
    }
    if (!ok) return false;
    if (!query) return true;
    var blob = (ev.title + " " + ev.summary + " " + (ev.note || "") + " " + ev.categories.join(" ") + " " + ev.id).toLowerCase();
    return blob.indexOf(query) !== -1;
  }

  function sortEvents(list) {
    return list.slice().sort(function (a, b) {
      var d = valueOf(a) - valueOf(b);
      if (d) return d;
      return a.title < b.title ? -1 : 1;
    });
  }

  function refreshVisible() {
    visible = sortEvents(data.events.filter(passes));
    if (selected >= visible.length) selected = visible.length - 1;
    var keep = openId && visible.some(function (e) { return e.id === openId; });
    if (openId && !keep) {
      openId = null;
      if (dialog.open) dialog.close();
    }
  }

  function indexOfId(id) {
    for (var i = 0; i < visible.length; i++) if (visible[i].id === id) return i;
    return -1;
  }

  function say(text) { if (live) live.textContent = text; }

  function renderChrome() {
    chipsEl.textContent = "";
    legendEl.textContent = "";
    data.categories.forEach(function (c) {
      catOn[c.id] = true;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ch-chip";
      b.setAttribute("aria-pressed", "true");
      b.dataset.cat = c.id;
      var sw = document.createElement("span");
      sw.className = "sw";
      sw.style.background = c.color;
      sw.setAttribute("aria-hidden", "true");
      b.appendChild(sw);
      b.appendChild(document.createTextNode(c.label));
      b.addEventListener("click", function () {
        catOn[c.id] = !catOn[c.id];
        b.setAttribute("aria-pressed", catOn[c.id] ? "true" : "false");
        applyFilters(true);
      });
      chipsEl.appendChild(b);
      var leg = document.createElement("span");
      var i = document.createElement("i");
      i.style.background = c.color;
      leg.appendChild(i);
      leg.appendChild(document.createTextNode(c.label));
      legendEl.appendChild(leg);
    });
  }

  function stackRows(items, gap) {
    var last = [];
    items.forEach(function (item) {
      var row = -1;
      for (var r = 0; r < last.length; r++) {
        if (item.x - last[r] >= gap) { row = r; break; }
      }
      if (row < 0) {
        row = last.length;
        last.push(item.x);
      } else last[row] = item.x;
      item.row = row;
    });
    return last.length || 1;
  }

  function buildButton(ev) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ev";
    btn.dataset.id = ev.id;
    btn.setAttribute("aria-label", formatDate(ev) + ", " + ev.title);
    btn.title = formatDate(ev) + " — " + ev.title;
    var dot = document.createElement("span");
    dot.className = "ev-dot";
    dot.style.background = catColor(ev.categories[0]);
    var label = document.createElement("span");
    label.className = "ev-label";
    label.textContent = ev.title;
    btn.appendChild(dot);
    btn.appendChild(label);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var idx = indexOfId(ev.id);
      if (idx >= 0) selected = idx;
      openEvent(ev.id);
    });
    return btn;
  }

  function layout() {
    var keepScroll = viewport.scrollLeft;
    var width = worldWidth();
    world.style.width = width + "px";
    world.classList.toggle("is-sparse", zoom < 0.72);
    world.textContent = "";
    buttons = [];

    var eraTop = 0;
    var eraH = 28;
    data.eras.forEach(function (era, n) {
      var x0 = ratioOf(era.start) * width;
      var x1 = ratioOf(era.end) * width;
      var band = document.createElement("div");
      band.className = "ch-era";
      band.style.left = x0 + "px";
      band.style.width = Math.max(0, x1 - x0) + "px";
      band.style.top = eraTop + "px";
      band.style.background = n % 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.18)";
      band.textContent = era.label;
      world.appendChild(band);
    });

    var axisY = eraH + 22;
    var axis = document.createElement("div");
    axis.className = "ch-axis";
    axis.style.top = axisY + "px";
    world.appendChild(axis);

    var ticks = [-1000, 0, 1000, 1500, 1800, 1900, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2026];
    var lastTick = -1e9;
    ticks.forEach(function (y) {
      var x = ratioOf(y) * width;
      if (x - lastTick < 46) return;
      lastTick = x;
      var tick = document.createElement("div");
      tick.className = "ch-tick";
      tick.style.left = x + "px";
      tick.style.top = (axisY - 8) + "px";
      var mark = document.createElement("i");
      mark.style.top = "8px";
      mark.style.height = "10px";
      var lab = document.createElement("span");
      lab.style.top = "20px";
      lab.textContent = formatYear(y);
      tick.appendChild(mark);
      tick.appendChild(lab);
      world.appendChild(tick);
    });

    var contentTop = axisY + 36;
    var gap = zoom < 0.72 ? 0 : 148;
    var rowH = zoom < 0.72 ? 28 : 54;
    var items = visible.map(function (ev) {
      return { ev: ev, x: ratioOf(valueOf(ev)) * width, row: 0 };
    });

    var height = contentTop + 80;
    if (compare) {
      var laneH = [];
      data.lanes.forEach(function (lane) {
        var group = items.filter(function (it) { return it.ev.lane === lane.id; });
        group.sort(function (a, b) { return a.x - b.x; });
        laneH.push(stackRows(group, gap));
      });
      var y = contentTop;
      data.lanes.forEach(function (lane, li) {
        var rows = laneH[li];
        var h = 28 + rows * rowH + 12;
        var band = document.createElement("div");
        band.className = "ch-lane";
        band.style.top = y + "px";
        band.style.height = h + "px";
        var name = document.createElement("div");
        name.className = "lane-name";
        name.textContent = lane.label;
        band.appendChild(name);
        world.appendChild(band);
        items.forEach(function (it) {
          if (it.ev.lane !== lane.id) return;
          place(it, y + 26 + it.row * rowH);
        });
        y += h;
      });
      height = y + 16;
    } else {
      items.sort(function (a, b) { return a.x - b.x; });
      var rows = stackRows(items, gap);
      items.forEach(function (it) { place(it, contentTop + it.row * rowH); });
      height = contentTop + rows * rowH + 56;
    }

    world.style.height = height + "px";
    viewport.style.height = Math.max(height, 240) + "px";
    if (keepScroll) viewport.scrollLeft = keepScroll;
    markSelected();
    updateCenter();
  }

  function place(item, top) {
    var btn = buildButton(item.ev);
    btn.style.left = item.x + "px";
    btn.style.top = top + "px";
    world.appendChild(btn);
    buttons.push(btn);
  }

  function markSelected() {
    var id = selected >= 0 && visible[selected] ? visible[selected].id : "";
    buttons.forEach(function (b) {
      var on = b.dataset.id === id;
      b.classList.toggle("is-selected", on);
      if (on) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    var nodes = listEl.querySelectorAll("button");
    for (var i = 0; i < nodes.length; i++) {
      var on = nodes[i].dataset.id === id;
      nodes[i].classList.toggle("is-selected", on);
      if (on) nodes[i].setAttribute("aria-current", "true");
      else nodes[i].removeAttribute("aria-current");
    }
  }

  function renderList() {
    listEl.textContent = "";
    if (!visible.length) {
      var li = document.createElement("li");
      var p = document.createElement("p");
      p.className = "ch-empty";
      p.textContent = "No milestones match.";
      li.appendChild(p);
      listEl.appendChild(li);
      return;
    }
    visible.forEach(function (ev) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.id = ev.id;
      var time = document.createElement("time");
      time.dateTime = ev.date;
      time.textContent = formatDate(ev);
      var body = document.createElement("span");
      var strong = document.createElement("strong");
      strong.textContent = ev.title;
      var em = document.createElement("em");
      em.textContent = ev.summary;
      body.appendChild(strong);
      body.appendChild(em);
      btn.appendChild(time);
      btn.appendChild(body);
      btn.addEventListener("click", function () {
        var idx = indexOfId(ev.id);
        if (idx >= 0) selected = idx;
        openEvent(ev.id);
      });
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  function updateCount() {
    countEl.textContent = visible.length + " of " + data.events.length;
    emptyEl.hidden = visible.length > 0;
  }

  function centerYear() {
    var mid = viewport.scrollLeft + viewport.clientWidth / 2;
    return yearOf(mid / worldWidth());
  }

  function updateCenter() {
    if (!viewport.clientWidth) return;
    var y = centerYear();
    centerEl.textContent = "Centered on " + formatYear(y);
    if (yearInput && document.activeElement !== yearInput) yearInput.value = String(Math.round(y));
  }

  function scrollToYear(year, andSelect) {
    var x = ratioOf(year) * worldWidth() - viewport.clientWidth / 2;
    viewport.scrollLeft = Math.max(0, x);
    updateCenter();
    if (andSelect) writeUrl();
  }

  function scrollToEvent(ev) {
    scrollToYear(valueOf(ev), false);
  }

  function writeUrl() {
    if (urlLock || !data) return;
    var params = new URLSearchParams();
    if (openId) params.set("e", openId);
    var y = Math.round(centerYear());
    if (!isNaN(y)) params.set("t", String(y));
    var qs = params.toString();
    var next = location.pathname + (qs ? "?" + qs : "");
    if (next !== location.pathname + location.search) {
      history.replaceState(null, "", next);
    }
  }

  function readUrl() {
    var params = new URLSearchParams(location.search);
    var t = params.get("t");
    var e = params.get("e");
    if (t != null && t !== "" && !isNaN(Number(t))) scrollToYear(Number(t), false);
    if (e) {
      var idx = indexOfId(e);
      if (idx >= 0) {
        selected = idx;
        openEvent(e, true);
      }
    }
  }

  function fillDialog(ev) {
    $("ch-dialog-date").textContent = formatDate(ev) + " · " + ev.precision;
    $("ch-dialog-title").textContent = ev.title;
    $("ch-dialog-summary").textContent = ev.summary;
    var note = $("ch-dialog-note");
    note.textContent = ev.note || "";
    note.hidden = !ev.note;
    var tags = $("ch-dialog-tags");
    tags.textContent = "";
    ev.categories.forEach(function (c) {
      var li = document.createElement("li");
      li.textContent = catLabel(c);
      tags.appendChild(li);
    });
    var sources = $("ch-dialog-sources");
    sources.textContent = "";
    ev.sources.forEach(function (s) {
      if (!/^https?:\/\//.test(s.url || "")) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = s.title;
      li.appendChild(a);
      sources.appendChild(li);
    });
    var site = $("ch-dialog-site");
    site.textContent = "";
    if (ev.site && ev.site.length) {
      var h = document.createElement("h3");
      h.textContent = "On this site";
      site.appendChild(h);
      var ul = document.createElement("ul");
      ev.site.forEach(function (s) {
        if (!s.url || s.url.charAt(0) !== "/") return;
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = s.url;
        a.textContent = s.title;
        li.appendChild(a);
        ul.appendChild(li);
      });
      site.appendChild(ul);
    }
    var idx = indexOfId(ev.id);
    $("ch-prev").disabled = idx <= 0;
    $("ch-next").disabled = idx < 0 || idx >= visible.length - 1;
  }

  function openEvent(id, fromUrl) {
    var idx = indexOfId(id);
    if (idx < 0) return;
    selected = idx;
    openId = id;
    var ev = visible[idx];
    fillDialog(ev);
    markSelected();
    scrollToEvent(ev);
    if (!dialog.open) dialog.showModal();
    say(formatDate(ev) + ". " + ev.title);
    if (!fromUrl) writeUrl();
  }

  function step(dir) {
    if (!visible.length) return;
    if (selected < 0) selected = dir > 0 ? 0 : visible.length - 1;
    else selected = clamp(selected + dir, 0, visible.length - 1);
    var ev = visible[selected];
    markSelected();
    scrollToEvent(ev);
    say(formatDate(ev) + ". " + ev.title);
    if (dialog.open) {
      openId = ev.id;
      fillDialog(ev);
      writeUrl();
    }
    var focusList = listShown();
    if (focusList) {
      var node = listEl.querySelector('button[data-id="' + ev.id + '"]');
      if (node) node.focus();
    } else {
      var b = world.querySelector('button[data-id="' + ev.id + '"]');
      if (b) b.focus();
    }
  }

  function listShown() {
    return window.matchMedia("(max-width: 760px)").matches || app.classList.contains("ch-as-list");
  }

  function applyFilters(refocus) {
    refreshVisible();
    renderList();
    layout();
    updateCount();
    if (refocus && selected >= 0) markSelected();
  }

  function zoomAt(clientX, next) {
    var rect = viewport.getBoundingClientRect();
    var cursor = clientX - rect.left;
    var oldW = worldWidth();
    var ratio = oldW ? (viewport.scrollLeft + cursor) / oldW : 0;
    zoom = clamp(next, 0.18, 8);
    layout();
    viewport.scrollLeft = ratio * worldWidth() - cursor;
    updateCenter();
  }

  function fitYears(a, b) {
    var r0 = ratioOf(a);
    var r1 = ratioOf(b);
    var span = Math.max(0.02, r1 - r0);
    var pad = viewport.clientWidth || 800;
    zoom = clamp((pad * 0.9) / (span * BASE), 0.18, 8);
    layout();
    var mid = (a + b) / 2;
    scrollToYear(mid, true);
  }

  function wire() {
    viewport.addEventListener("wheel", function (e) {
      if (listShown()) return;
      e.preventDefault();
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && !e.ctrlKey) {
        viewport.scrollLeft += e.deltaX;
        updateCenter();
        return;
      }
      var dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      zoomAt(e.clientX, zoom * Math.exp(-dy * 0.00115));
    }, { passive: false });

    var drag = null;
    var pointers = new Map();
    var pinch = null;
    var swallowClick = false;

    viewport.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        var vals = Array.from(pointers.values());
        pinch = {
          dist: Math.hypot(vals[0].x - vals[1].x, vals[0].y - vals[1].y) || 1,
          zoom: zoom,
          mid: (vals[0].x + vals[1].x) / 2
        };
        drag = null;
        return;
      }
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, scroll: viewport.scrollLeft, moved: false, onEv: !!e.target.closest(".ev") };
      if (!drag.onEv) viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2 && pinch) {
        var vals = Array.from(pointers.values());
        var dist = Math.hypot(vals[0].x - vals[1].x, vals[0].y - vals[1].y) || 1;
        zoomAt(pinch.mid, pinch.zoom * (dist / pinch.dist));
        pinch.zoom = zoom;
        pinch.dist = dist;
        return;
      }
      if (!drag || drag.id !== e.pointerId) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved && drag.onEv) viewport.setPointerCapture(e.pointerId);
      drag.moved = true;
      viewport.scrollLeft = drag.scroll - dx;
      updateCenter();
    });

    function endPointer(e) {
      if (drag && drag.id === e.pointerId && drag.moved) swallowClick = true;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (drag && drag.id === e.pointerId) drag = null;
    }
    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
    viewport.addEventListener("click", function (e) {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    viewport.addEventListener("scroll", function () { updateCenter(); }, { passive: true });

    var urlTimer = 0;
    viewport.addEventListener("scroll", function () {
      clearTimeout(urlTimer);
      urlTimer = setTimeout(writeUrl, 240);
    }, { passive: true });

    qInput.addEventListener("input", function () {
      query = qInput.value.trim().toLowerCase();
      applyFilters(false);
    });

    $("ch-go").addEventListener("submit", function (e) {
      e.preventDefault();
      var raw = yearInput.value.trim().toLowerCase();
      var bce = /bce|bc/.test(raw);
      var n = parseInt(raw.replace(/[^\d-]/g, ""), 10);
      if (isNaN(n)) return;
      if (bce && n > 0) n = -n;
      scrollToYear(n, true);
    });

    $("ch-compare").addEventListener("click", function () {
      compare = !compare;
      this.setAttribute("aria-pressed", compare ? "true" : "false");
      layout();
    });

    $("ch-list-toggle").addEventListener("click", function () {
      var on = app.classList.toggle("ch-as-list");
      this.setAttribute("aria-pressed", on ? "true" : "false");
      if (!on) layout();
    });

    $("ch-all").addEventListener("click", function () { fitYears(-3000, 2026); });
    $("ch-age").addEventListener("click", function () { fitYears(1945, 2026); });
    $("ch-in").addEventListener("click", function () {
      zoomAt(viewport.getBoundingClientRect().left + viewport.clientWidth / 2, zoom * 1.25);
    });
    $("ch-out").addEventListener("click", function () {
      zoomAt(viewport.getBoundingClientRect().left + viewport.clientWidth / 2, zoom / 1.25);
    });

    $("ch-prev").addEventListener("click", function () { step(-1); });
    $("ch-next").addEventListener("click", function () { step(1); });
    $("ch-close").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("close", function () {
      openId = null;
      writeUrl();
    });

    helpBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var on = helpPanel.hidden;
      helpPanel.hidden = !on;
      helpBtn.setAttribute("aria-expanded", on ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (helpPanel.hidden) return;
      if (e.target === helpBtn || helpPanel.contains(e.target)) return;
      helpPanel.hidden = true;
      helpBtn.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("keydown", function (e) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable)) {
        if (e.key === "Escape") document.activeElement.blur();
        return;
      }
      if (!app.contains(document.activeElement) && document.activeElement !== document.body && document.activeElement !== document.documentElement) {
        if (!dialog.open) return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        step(e.key === "ArrowRight" ? 1 : -1);
      } else if (e.key === "Enter" && !dialog.open && selected >= 0 && visible[selected]) {
        if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("ch-chip")) return;
        if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("ch-tool")) return;
        e.preventDefault();
        openEvent(visible[selected].id);
      } else if (e.key === "Home") {
        e.preventDefault();
        selected = 0;
        step(0);
      } else if (e.key === "End") {
        e.preventDefault();
        selected = visible.length - 1;
        step(0);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomAt(viewport.getBoundingClientRect().left + viewport.clientWidth / 2, zoom * 1.25);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomAt(viewport.getBoundingClientRect().left + viewport.clientWidth / 2, zoom / 1.25);
      } else if (e.key === "0") {
        fitYears(1945, 2026);
      } else if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        helpBtn.click();
      }
    });

    window.addEventListener("resize", function () { layout(); });
  }

  fetch("/data/computer-history.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (json) {
      data = json;
      renderChrome();
      refreshVisible();
      renderList();
      wire();
      urlLock = true;
      zoom = 1.25;
      layout();
      scrollToYear(1984, false);
      readUrl();
      urlLock = false;
      updateCount();
      if (selected < 0 && visible.length) {
        var y = centerYear();
        var best = 0;
        var bestD = Infinity;
        visible.forEach(function (ev, i) {
          var d = Math.abs(valueOf(ev) - y);
          if (d < bestD) { bestD = d; best = i; }
        });
        selected = best;
      }
      markSelected();
      viewport.setAttribute("tabindex", "0");
    })
    .catch(function (err) {
      emptyEl.hidden = false;
      emptyEl.textContent = "The timeline data did not load.";
      console.error(err);
    });
})();
