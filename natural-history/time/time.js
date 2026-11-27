/* Geologic time scale. Ages and colours: ICS chart v2024/12. No build step. */
(function () {
  var UNITS = [];
  var BY = {};
  var KIDS = {};
  var NARR = {};
  var EXT = [];
  var GALLERY = [];
  var MAP = window.NH_TIME_GALLERY || {};
  var mode = "proportional";
  var zoom = null;
  var selected = null;
  var focusId = null;
  var booted = false;

  var RANK_LABEL = {
    eon: "Eon",
    era: "Era",
    period: "Period",
    subperiod: "Subperiod",
    epoch: "Epoch",
    age: "Age"
  };

  try {
    if (sessionStorage.getItem("gt-mode") === "expanded") mode = "expanded";
  } catch (e) {}

  function $(id) { return document.getElementById(id); }

  function children(id) { return KIDS[id || ""] || []; }

  function hasRank(u, rank) {
    if (u.rank === rank) return true;
    return children(u.id).some(function (k) { return hasRank(k, rank); });
  }

  function trimNum(n) {
    if (n === 0) return "0";
    var s = n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }

  function formatBound(n, approx) {
    var t = approx ? "~" : "";
    if (n === 0) return "the present";
    if (n < 0.5) {
      var years = Math.round(n * 1e6);
      return t + trimNum(n) + " Ma (" + years.toLocaleString("en-US") + " years ago)";
    }
    return t + trimNum(n) + " Ma";
  }

  function formatDuration(start, end) {
    var d = start - end;
    if (d >= 1) {
      var s = trimNum(Math.round(d * 1000) / 1000);
      return s + " million years";
    }
    return Math.round(d * 1e6).toLocaleString("en-US") + " years";
  }

  function textOn(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y > 155 ? "#1a140c" : "#ffffff";
  }

  function bounds() {
    if (!zoom) return { start: 4567, end: 0 };
    return { start: BY[zoom].start, end: BY[zoom].end };
  }

  function slices() {
    if (zoom) {
      var kids = children(zoom);
      return kids.length ? kids : [BY[zoom]];
    }
    var out = [];
    function walk(u) {
      var kids = children(u.id);
      if (u.rank === "period") { out.push(u); return; }
      if (!kids.length) { out.push(u); return; }
      if (u.rank === "era" && !hasRank(u, "period")) { out.push(u); return; }
      kids.forEach(walk);
    }
    children("").forEach(walk);
    return out;
  }

  function contains(outer, inner) {
    return outer.start + 0.02 >= inner.start && outer.end - 0.02 <= inner.end;
  }

  function edges(unit) {
    var b = bounds();
    if (mode === "proportional") {
      var span = b.start - b.end;
      var a = Math.min(unit.start, b.start);
      var c = Math.max(unit.end, b.end);
      if (a <= c) return null;
      return { left: (b.start - a) / span * 100, width: (a - c) / span * 100 };
    }
    var sl = slices();
    var n = sl.length;
    var contained = [];
    sl.forEach(function (s, i) {
      if (s.id === unit.id || contains(unit, s)) contained.push(i);
    });
    if (contained.length && (unit.id === sl[contained[0]].id || contains(unit, sl[contained[0]]))) {
      var i0 = contained[0];
      var i1 = contained[contained.length - 1];
      return { left: i0 / n * 100, width: (i1 - i0 + 1) / n * 100 };
    }
    var host = -1;
    sl.forEach(function (s, i) {
      if (contains(s, unit)) host = i;
    });
    if (host < 0) return null;
    var left = host / n;
    var width = 1 / n;
    var chain = [];
    var cur = unit;
    while (cur && cur.id !== sl[host].id) {
      chain.push(cur);
      cur = cur.parent ? BY[cur.parent] : null;
    }
    chain.reverse();
    var parent = sl[host];
    for (var i = 0; i < chain.length; i++) {
      var sibs = children(parent.id);
      var idx = -1;
      for (var j = 0; j < sibs.length; j++) if (sibs[j].id === chain[i].id) idx = j;
      if (idx < 0) return null;
      var w = width / sibs.length;
      left = left + idx * w;
      width = w;
      parent = chain[i];
    }
    return { left: left * 100, width: width * 100 };
  }

  function pos(age) {
    var b = bounds();
    if (age > b.start) age = b.start;
    if (age < b.end) age = b.end;
    if (mode === "proportional") {
      return (b.start - age) / (b.start - b.end) * 100;
    }
    var sl = slices();
    var n = sl.length;
    for (var i = 0; i < n; i++) {
      var s = sl[i];
      if (age > s.start + 0.0001) continue;
      if (age >= s.end - 0.0001) return pointInside(s, age, i / n, 1 / n) * 100;
    }
    return 100;
  }

  function pointInside(unit, age, left, width) {
    if (Math.abs(age - unit.end) < 0.0001) return left + width;
    if (Math.abs(age - unit.start) < 0.0001) return left;
    var kids = children(unit.id);
    if (!kids.length) {
      var f = (unit.start - age) / (unit.start - unit.end);
      return left + f * width;
    }
    var w = width / kids.length;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (age <= k.start + 0.0001 && age >= k.end - 0.0001) {
        return pointInside(k, age, left + i * w, w);
      }
    }
    return left + width;
  }

  function rows() {
    var list;
    if (!zoom) list = ["eon", "era", "period", "epoch"];
    else if (BY[zoom].rank === "eon") list = ["era", "period", "epoch"];
    else if (BY[zoom].rank === "era") list = ["period", "epoch", "age"];
    else if (BY[zoom].rank === "period") {
      list = children(zoom).some(function (k) { return k.rank === "subperiod"; })
        ? ["subperiod", "epoch", "age"] : ["epoch", "age"];
    } else if (BY[zoom].rank === "subperiod") list = ["epoch", "age"];
    else if (BY[zoom].rank === "epoch") list = ["age"];
    else list = [];
    return list.filter(function (r) { return rowUnits(r).length; });
  }

  function rowUnits(rank) {
    var b = bounds();
    return UNITS.filter(function (u) {
      return u.rank === rank && u.start > b.end + 0.0001 && u.end < b.start - 0.0001;
    });
  }

  function chartPx() {
    var sl = slices();
    var per = mode === "expanded" ? 78 : 0;
    var base = mode === "proportional" ? 1400 : 720;
    var scroll = $("gt-scroll");
    var view = scroll ? scroll.clientWidth : 720;
    return Math.max(base, sl.length * per, view);
  }

  function ariaUnit(u) {
    return u.name + ", " + RANK_LABEL[u.rank] + ", " +
      formatBound(u.start, u.startApprox) + " to " + formatBound(u.end, u.endApprox);
  }

  function render() {
    var chart = $("gt-chart");
    var gutter = $("gt-gutter");
    var scroll = $("gt-scroll");
    if (!chart) return;
    var restoreFocus = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("gt-unit");
    var px = chartPx();
    chart.style.width = px + "px";
    chart.textContent = "";
    gutter.textContent = "";
    var b = bounds();
    var rankRows = rows();

    var laneG = document.createElement("span");
    laneG.className = "is-lane";
    laneG.textContent = "Extinctions";
    gutter.appendChild(laneG);
    var lane = document.createElement("div");
    lane.className = "gt-lane";
    EXT.forEach(function (ex, n) {
      if (ex.age > b.start + 0.01 || ex.age < b.end - 0.01) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gt-x";
      btn.style.left = pos(ex.age) + "%";
      var showName = mode === "expanded" || zoom;
      var label = document.createElement("span");
      label.textContent = showName ? ex.name : String(n + 1);
      var diamond = document.createElement("i");
      btn.appendChild(diamond);
      btn.appendChild(label);
      btn.setAttribute("aria-label", ex.name + " mass extinction, " + trimNum(ex.age) + " million years ago. Show " + BY[ex.unit].name);
      btn.addEventListener("click", function () { select(ex.unit, { zoomTo: true, scroll: true }); });
      var line = document.createElement("div");
      line.className = "gt-xline";
      line.style.left = pos(ex.age) + "%";
      line.setAttribute("aria-hidden", "true");
      chart.appendChild(line);
      chart.appendChild(btn);
    });
    chart.appendChild(lane);

    if (b.end <= 0.0001) {
      var pin = document.createElement("div");
      pin.className = "gt-pin";
      pin.style.left = pos(0) + "%";
      var cap = document.createElement("span");
      cap.textContent = "You are here";
      pin.appendChild(cap);
      chart.appendChild(pin);
    }

    if (!rankRows.length) {
      var empty = document.createElement("p");
      empty.className = "gt-empty";
      empty.textContent = BY[zoom].name + " is not divided any further on this chart.";
      chart.appendChild(empty);
      var gEmpty = document.createElement("span");
      gEmpty.className = "is-row";
      gutter.appendChild(gEmpty);
    }

    rankRows.forEach(function (rank) {
      var g = document.createElement("span");
      g.className = "is-row";
      g.textContent = RANK_LABEL[rank];
      gutter.appendChild(g);
      var row = document.createElement("div");
      row.className = "gt-row";
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", RANK_LABEL[rank] + "s");
      rowUnits(rank).forEach(function (u) {
        var box = edges(u);
        if (!box || box.width <= 0) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "gt-unit";
        btn.style.left = box.left + "%";
        btn.style.width = box.width + "%";
        btn.style.background = u.color;
        btn.style.color = textOn(u.color);
        btn.dataset.id = u.id;
        btn.dataset.row = rank;
        btn.tabIndex = -1;
        btn.setAttribute("aria-pressed", selected === u.id ? "true" : "false");
        btn.setAttribute("aria-label", ariaUnit(u));
        var widthPx = box.width / 100 * px;
        btn.textContent = (widthPx < 64 && u.abbr) ? u.abbr : u.name;
        btn.title = u.name;
        btn.addEventListener("click", function () { select(u.id, { scroll: true }); });
        row.appendChild(btn);
      });
      chart.appendChild(row);
    });

    var axisG = document.createElement("span");
    axisG.className = "is-axis";
    axisG.textContent = mode === "expanded" ? "Equal" : "Ma";
    gutter.appendChild(axisG);
    var axis = document.createElement("div");
    axis.className = "gt-axis";
    var startTick = document.createElement("span");
    startTick.className = "gt-tick";
    startTick.style.left = "0";
    startTick.style.transform = "none";
    startTick.textContent = trimNum(b.start) + " Ma";
    var endTick = document.createElement("span");
    endTick.className = "gt-tick end";
    endTick.style.left = "100%";
    endTick.textContent = b.end === 0 ? "today" : trimNum(b.end) + " Ma";
    axis.appendChild(startTick);
    axis.appendChild(endTick);
    if (mode === "proportional" && !zoom) {
      [4000, 2500, 1000, 538.8, 252, 66].forEach(function (age) {
        var t = document.createElement("span");
        t.className = "gt-tick";
        t.style.left = pos(age) + "%";
        t.textContent = trimNum(age);
        axis.appendChild(t);
      });
    }
    chart.appendChild(axis);

    var buttons = chart.querySelectorAll(".gt-unit");
    var focusBtn = null;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].dataset.id === (focusId || selected)) focusBtn = buttons[i];
    }
    if (!focusBtn && buttons.length) focusBtn = buttons[0];
    if (focusBtn) {
      focusBtn.tabIndex = 0;
      if (restoreFocus) focusBtn.focus();
    }

    renderCrumbs();
    renderStatus();
    renderDetail();
    if (scroll && selected) {
      var on = chart.querySelector('.gt-unit[data-id="' + selected + '"]');
      if (on) {
        var sl = scroll.scrollLeft;
        var left = on.offsetLeft;
        var right = left + on.offsetWidth;
        if (left < sl || right > sl + scroll.clientWidth) {
          scroll.scrollLeft = Math.max(0, left - 24);
        }
      }
    }
  }

  function renderCrumbs() {
    var nav = $("gt-crumbs");
    nav.textContent = "";
    var chain = [];
    if (zoom) {
      var cur = BY[zoom];
      while (cur) {
        chain.push(cur);
        cur = cur.parent ? BY[cur.parent] : null;
      }
      chain.reverse();
    }
    function addCrumb(label, id, current) {
      if (nav.childNodes.length) nav.appendChild(document.createTextNode(" / "));
      if (current) {
        var span = document.createElement("span");
        span.textContent = label;
        span.setAttribute("aria-current", "page");
        nav.appendChild(span);
      } else {
        var a = document.createElement("button");
        a.type = "button";
        a.textContent = label;
        a.addEventListener("click", function () {
          zoom = id;
          render();
        });
        nav.appendChild(a);
      }
    }
    addCrumb("All of geologic time", null, !zoom);
    chain.forEach(function (u, i) {
      addCrumb(u.name, u.id, i === chain.length - 1);
    });
    $("gt-zoomout").hidden = !zoom;
  }

  function renderStatus() {
    var el = $("gt-status");
    if (mode === "proportional" && !zoom) {
      el.textContent = "True scale, in millions of years. The Phanerozoic is the last 538.8 of 4,567, about 12 percent of the bar. Switch to Expanded to read the period names.";
    } else if (mode === "expanded" && !zoom) {
      el.textContent = "Expanded. Each period has the same width, and each Archean era and the Hadean do too. Years are not equal along the bar.";
    } else if (zoom) {
      var u = BY[zoom];
      el.textContent = "Zoomed to the " + u.name + ", " + formatBound(u.start, u.startApprox) + " to " + formatBound(u.end, u.endApprox) + ".";
    }
  }

  function boundarySentence(u) {
    var gssa = [4567, 4031, 3600, 3200, 2800, 2500, 2300, 2050, 1800, 1600, 1400, 1200, 1000];
    var isGssa = gssa.some(function (a) { return Math.abs(a - u.start) < 0.01; });
    if (u.informal && u.id === "hadean") {
      return "The Hadean is informal. Its base is the age of the Earth, about 4,567 Ma, not a golden spike.";
    }
    if (u.informal && !u.gssp) {
      return "Informal on the 2024 chart. The name, the boundary, or both are still placeholders.";
    }
    if (isGssa) {
      return "The base is a Global Standard Stratigraphic Age, a round number in millions of years, rather than a golden spike in a measured cliff.";
    }
    if (u.gssp && u.startApprox) {
      return "The base is a golden spike, a ratified GSSP. The number of millions of years attached to it is still approximate.";
    }
    if (u.gssp) {
      return "The base is a golden spike: a ratified Global Boundary Stratotype Section and Point.";
    }
    if (u.startApprox) {
      return "The base is approximate. A golden spike has not yet fixed it.";
    }
    return "The base is not marked by a ratified golden spike on this chart.";
  }

  function descendants(id) {
    var ids = {};
    var stack = [id];
    while (stack.length) {
      var cur = stack.pop();
      ids[cur] = true;
      children(cur).forEach(function (k) { stack.push(k.id); });
    }
    return ids;
  }

  function galleryFor(id) {
    var ids = descendants(id);
    return GALLERY.filter(function (it) {
      var m = MAP[it.n];
      return m && ids[m.unit];
    });
  }

  function extinctionsFor(u) {
    return EXT.filter(function (ex) {
      return Math.abs(ex.age - u.end) < 0.05 || ex.unit === u.id;
    });
  }

  function addFact(dl, term, text) {
    var wrap = document.createElement("div");
    var dt = document.createElement("dt");
    dt.textContent = term;
    var dd = document.createElement("dd");
    dd.textContent = text;
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    dl.appendChild(wrap);
  }

  function renderDetail() {
    var panel = $("gt-detail");
    var live = $("gt-live");
    panel.textContent = "";
    if (!selected || !BY[selected]) {
      var prompt = document.createElement("p");
      prompt.textContent = "Select a band. Tap or click it, or use the arrow keys and Enter. A link such as #jurassic opens that unit.";
      panel.appendChild(prompt);
      return;
    }
    var u = BY[selected];
    var narr = NARR[u.id] || {};
    var tag = document.createElement("p");
    tag.className = "gt-ranktag";
    var parentName = u.parent ? BY[u.parent].name : "the chart";
    tag.textContent = RANK_LABEL[u.rank] + " · " + parentName;
    var h = document.createElement("h2");
    h.id = "gt-detail-title";
    h.textContent = u.name;
    var when = document.createElement("p");
    when.className = "gt-when";
    when.textContent = formatBound(u.start, u.startApprox) + " → " + formatBound(u.end, u.endApprox) +
      " · " + formatDuration(u.start, u.end);
    var dl = document.createElement("dl");
    addFact(dl, "Name", narr.etymology || "");
    addFact(dl, "Climate and geography", narr.climate || "");
    addFact(dl, "Life", narr.life || "");
    addFact(dl, "How it ended", narr.ending || "");
    addFact(dl, "How the boundary is set", boundarySentence(u));
    panel.appendChild(tag);
    panel.appendChild(h);
    panel.appendChild(when);
    panel.appendChild(dl);

    extinctionsFor(u).forEach(function (ex) {
      var flag = document.createElement("p");
      flag.className = "gt-flag";
      flag.textContent = "Big Five. " + ex.name + " mass extinction at " + trimNum(ex.age) + " Ma. " + ex.summary;
      panel.appendChild(flag);
    });

    var actions = document.createElement("div");
    actions.className = "gt-actions";
    if (children(u.id).length) {
      var zoomBtn = document.createElement("button");
      zoomBtn.type = "button";
      var kidRank = children(u.id)[0].rank;
      zoomBtn.textContent = "Zoom in to " + RANK_LABEL[kidRank].toLowerCase() + "s";
      zoomBtn.addEventListener("click", function () {
        zoom = u.id;
        focusId = children(u.id)[0].id;
        render();
        var first = $("gt-chart").querySelector(".gt-unit");
        if (first) first.focus();
      });
      actions.appendChild(zoomBtn);
    }
    var link = document.createElement("a");
    link.href = "/natural-history/";
    link.textContent = "Natural history gallery";
    actions.appendChild(link);
    panel.appendChild(actions);

    var items = galleryFor(u.id);
    if (items.length) {
      var gal = document.createElement("div");
      gal.className = "gt-gallery";
      var gh = document.createElement("h3");
      gh.textContent = "From the gallery";
      var note = document.createElement("p");
      note.className = "ai";
      note.textContent = "These pictures are AI-generated with Grok Imagine. They are artistic reconstructions, not photographs, and they are not scientifically exact.";
      var ul = document.createElement("ul");
      ul.className = "gt-thumbs";
      items.forEach(function (it) {
        var m = MAP[it.n];
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = it.image;
        var img = document.createElement("img");
        img.src = it.thumb;
        img.alt = it.title + ". AI-generated image, not a photograph. " + (m.note || "");
        img.loading = "lazy";
        img.width = 320;
        img.height = 180;
        var p = document.createElement("p");
        if (m.speculative) {
          var badge = document.createElement("span");
          badge.className = "gt-spec";
          badge.textContent = "Speculative scene";
          p.appendChild(badge);
        }
        var strong = document.createElement("strong");
        strong.textContent = it.title;
        p.appendChild(strong);
        p.appendChild(document.createTextNode(m.note || it.caption));
        a.appendChild(img);
        a.appendChild(p);
        li.appendChild(a);
        ul.appendChild(li);
      });
      gal.appendChild(gh);
      gal.appendChild(note);
      gal.appendChild(ul);
      panel.appendChild(gal);
    }
    if (live) live.textContent = u.name + ", " + RANK_LABEL[u.rank] + ", " + formatDuration(u.start, u.end);
  }

  function isDrawn(id) {
    var u = BY[id];
    if (!u) return false;
    return rows().indexOf(u.rank) !== -1 && rowUnits(u.rank).some(function (x) { return x.id === id; });
  }

  function reveal(id) {
    var u = BY[id];
    if (!u) return;
    if (u.rank === "age" || u.rank === "epoch" || u.rank === "subperiod") {
      var a = u;
      while (a && a.rank !== "period") a = a.parent ? BY[a.parent] : null;
      zoom = a ? a.id : null;
    } else if (!isDrawn(id) && u.parent) {
      zoom = u.parent;
    }
  }

  function select(id, opt) {
    opt = opt || {};
    if (!BY[id]) return;
    selected = id;
    focusId = id;
    if (opt.zoomTo || !isDrawn(id)) reveal(id);
    var next = "#" + id;
    if (!opt.silentHash && location.hash !== next) {
      history.replaceState(null, "", next);
    }
    render();
    if (opt.scroll && window.matchMedia("(max-width: 800px)").matches) {
      $("gt-detail").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onKey(e) {
    var btn = e.target.closest ? e.target.closest(".gt-unit") : null;
    if (!btn) return;
    var row = btn.dataset.row;
    var buttons = Array.prototype.slice.call($("gt-chart").querySelectorAll('.gt-unit[data-row="' + row + '"]'));
    var i = buttons.indexOf(btn);
    var next = null;
    if (e.key === "ArrowRight") next = buttons[Math.min(buttons.length - 1, i + 1)];
    else if (e.key === "ArrowLeft") next = buttons[Math.max(0, i - 1)];
    else if (e.key === "Home") next = buttons[0];
    else if (e.key === "End") next = buttons[buttons.length - 1];
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var ranks = rows();
      var ri = ranks.indexOf(row) + (e.key === "ArrowDown" ? 1 : -1);
      if (ri < 0 || ri >= ranks.length) return;
      var mid = BY[btn.dataset.id];
      var age = (mid.start + mid.end) / 2;
      var candidates = $("gt-chart").querySelectorAll('.gt-unit[data-row="' + ranks[ri] + '"]');
      var best = candidates[0];
      var bestD = Infinity;
      for (var c = 0; c < candidates.length; c++) {
        var cu = BY[candidates[c].dataset.id];
        var d = Math.abs(((cu.start + cu.end) / 2) - age);
        if (age <= cu.start && age >= cu.end) { best = candidates[c]; break; }
        if (d < bestD) { bestD = d; best = candidates[c]; }
      }
      next = best;
    } else if (e.key === "Enter" || e.key === " ") {
      select(btn.dataset.id, { scroll: true });
      e.preventDefault();
      return;
    } else if (e.key === "Escape") {
      if (zoom) { zoom = BY[zoom].parent || null; render(); }
      e.preventDefault();
      return;
    } else return;
    if (!next || next === btn) return;
    e.preventDefault();
    buttons.forEach(function (b) { b.tabIndex = -1; });
    var all = $("gt-chart").querySelectorAll(".gt-unit");
    for (var k = 0; k < all.length; k++) all[k].tabIndex = -1;
    next.tabIndex = 0;
    focusId = next.dataset.id;
    next.focus();
  }

  function setMode(next) {
    mode = next;
    try { sessionStorage.setItem("gt-mode", mode); } catch (e) {}
    $("gt-prop").setAttribute("aria-pressed", mode === "proportional" ? "true" : "false");
    $("gt-equal").setAttribute("aria-pressed", mode === "expanded" ? "true" : "false");
    render();
    if (mode === "expanded" && !zoom && !selected) {
      var cam = document.querySelector('.gt-unit[data-id="cambrian"]');
      if (cam) $("gt-scroll").scrollLeft = Math.max(0, cam.offsetLeft - 8);
    }
  }

  var quizIndex = 0;
  var quizScore = 0;
  var quizOrder = [];

  function periodIds() {
    return UNITS.filter(function (u) { return u.rank === "period" && u.start <= 538.8; })
      .sort(function (a, b) { return b.start - a.start; })
      .map(function (u) { return u.id; });
  }

  function startQuiz() {
    if (!booted) return;
    var ids = periodIds();
    quizOrder = [];
    while (quizOrder.length < 8) {
      var i = Math.floor(Math.random() * (ids.length - 1));
      quizOrder.push(i);
    }
    quizIndex = 0;
    quizScore = 0;
    $("gt-quiz-card").hidden = true;
    $("gt-quiz-play").hidden = false;
    askQuiz();
  }

  function askQuiz() {
    var ids = periodIds();
    var i = quizOrder[quizIndex];
    var correct = ids[i + 1];
    var pool = ids.filter(function (id) { return id !== correct; });
    var choices = [correct];
    while (choices.length < 4 && pool.length) {
      var pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      choices.push(pick);
    }
    choices.sort(function () { return Math.random() - 0.5; });
    $("gt-q").textContent = "Question " + (quizIndex + 1) + " of 8. Which period comes immediately after the " + BY[ids[i]].name + "?";
    var box = $("gt-choices");
    box.textContent = "";
    choices.forEach(function (id) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = BY[id].name;
      b.addEventListener("click", function () {
        var ok = id === correct;
        if (ok) quizScore++;
        Array.prototype.forEach.call(box.querySelectorAll("button"), function (btn) {
          btn.disabled = true;
          if (btn.textContent === BY[correct].name) btn.setAttribute("aria-pressed", "true");
        });
        $("gt-qscore").textContent = ok
          ? "Yes. " + BY[ids[i]].name + " is followed by the " + BY[correct].name + ". Score: " + quizScore + "."
          : "The next period is the " + BY[correct].name + ". Score: " + quizScore + ".";
        quizIndex++;
        var again = $("gt-qnext");
        again.hidden = false;
        if (quizIndex >= 8) {
          again.textContent = "Start again";
          again.onclick = function () { startQuiz(); };
          $("gt-qscore").textContent += " Finished. " + quizScore + " of 8.";
        } else {
          again.textContent = "Next question";
          again.onclick = function () {
            again.hidden = true;
            $("gt-qscore").textContent = "";
            askQuiz();
          };
        }
      });
      box.appendChild(b);
    });
  }

  var cardAt = 0;
  function showCard(reveal) {
    if (!booted) return;
    var ids = periodIds();
    var u = BY[ids[cardAt]];
    var narr = NARR[u.id] || {};
    var face = $("gt-cardface");
    face.textContent = "";
    var name = document.createElement("strong");
    name.textContent = u.name;
    face.appendChild(name);
    if (reveal) {
      var p = document.createElement("p");
      p.textContent = formatBound(u.start, u.startApprox) + " to " + formatBound(u.end, u.endApprox) + ". " + (narr.life || "");
      face.appendChild(p);
    }
  }

  function boot(intervals, narratives, manifest) {
    UNITS = intervals.units;
    NARR = narratives;
    EXT = intervals.extinctions;
    GALLERY = (manifest && manifest.items) ? manifest.items : [];
    KIDS = { "": [] };
    UNITS.forEach(function (u) {
      BY[u.id] = u;
      var key = u.parent || "";
      if (!KIDS[key]) KIDS[key] = [];
      KIDS[key].push(u);
    });
    Object.keys(KIDS).forEach(function (k) {
      KIDS[k].sort(function (a, b) { return b.start - a.start; });
    });
    setMode(mode);
    var hash = decodeURIComponent((location.hash || "").replace(/^#/, "")).toLowerCase();
    if (BY[hash]) select(hash, { silentHash: true, zoomTo: true });
    window.addEventListener("hashchange", function () {
      var id = decodeURIComponent((location.hash || "").replace(/^#/, "")).toLowerCase();
      if (BY[id] && id !== selected) select(id, { silentHash: true, zoomTo: true });
    });
    booted = true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("gt-prop").addEventListener("click", function () { setMode("proportional"); });
    $("gt-equal").addEventListener("click", function () { setMode("expanded"); });
    $("gt-zoomout").addEventListener("click", function () {
      if (!zoom) return;
      zoom = BY[zoom].parent || null;
      render();
    });
    $("gt-chart").addEventListener("keydown", onKey);
    Array.prototype.forEach.call(document.querySelectorAll("[data-extinct]"), function (btn) {
      btn.addEventListener("click", function () {
        if (!booted) return;
        select(btn.getAttribute("data-extinct"), { zoomTo: true, scroll: true });
      });
    });
    $("gt-quiz-start").addEventListener("click", startQuiz);
    $("gt-flash").addEventListener("click", function () {
      $("gt-quiz-play").hidden = true;
      $("gt-quiz-card").hidden = false;
      cardAt = 0;
      showCard(false);
    });
    $("gt-card-reveal").addEventListener("click", function () { showCard(true); });
    $("gt-card-next").addEventListener("click", function () {
      cardAt = (cardAt + 1) % periodIds().length;
      showCard(false);
    });

    Promise.all([
      fetch("/natural-history/time/intervals.json").then(function (r) { return r.json(); }),
      fetch("/natural-history/time/narratives.json").then(function (r) { return r.json(); }),
      fetch("/natural-history/manifest.json").then(function (r) { return r.json(); })
    ]).then(function (all) {
      boot(all[0], all[1], all[2]);
    }).catch(function () {
      $("gt-status").textContent = "The chart data did not load. Reload the page.";
    });
  });
})();
