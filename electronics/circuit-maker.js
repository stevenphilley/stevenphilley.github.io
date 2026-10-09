/*! Circuit maker UI for /electronics/circuits.html. Lessons stay in the page. */
(function () {
  "use strict";
  var S = window.SPCircuit;
  var root = document.getElementById("maker-root");
  var lessonRoot = document.getElementById("lesson-root");
  var modeLessons = document.getElementById("modeLessons");
  var modeMaker = document.getElementById("modeMaker");
  if (!S || !root || !lessonRoot) return;

  var STORE = "sp-circuit-maker-v1";
  var doc = S.emptyDoc();
  var sel = {};
  var tool = "select";
  var additive = false;
  var wireFrom = null;
  var probeKey = null;
  var meterKeys = [];
  var view = { x: -1, y: -1.5, w: 22, h: 15 };
  var undoStack = [];
  var redoStack = [];
  var clip = null;
  var live = null;
  var running = false;
  var sim = null;
  var dt = 1e-4;
  var scope = [];
  var raf = 0;
  var seq = 1;
  var drag = null;
  var pointers = {};
  var pinch = null;
  var showVolts = true;
  var linkBox = null;
  var selWire = null;
  var booting = true;

  var PALETTE = [
    ["Sources", ["gnd", "vdc", "vac", "idc", "sw"]],
    ["Passives", ["r", "pot", "c", "l"]],
    ["Devices", ["d", "led", "npn", "op"]],
    ["Logic", ["not", "and", "or", "nand", "nor", "ic555"]]
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtV(v) {
    if (v == null || !isFinite(v)) return "—";
    var a = Math.abs(v);
    if (a >= 100) return v.toFixed(0) + " V";
    if (a >= 10) return v.toFixed(2) + " V";
    return v.toFixed(3) + " V";
  }

  function fmtI(v) {
    if (v == null || !isFinite(v)) return "—";
    var a = Math.abs(v);
    if (a >= 1) return v.toFixed(3) + " A";
    if (a >= 0.001) return (v * 1000).toFixed(2) + " mA";
    if (a >= 1e-6) return (v * 1e6).toFixed(1) + " µA";
    return "0 A";
  }

  function fmtOhms(v) {
    v = +v || 0;
    if (v >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 0 : 2) + " MΩ";
    if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 2) + " kΩ";
    return v.toFixed(v >= 10 ? 0 : 1) + " Ω";
  }

  function alloc(prefix) {
    var id = (prefix || "p") + seq;
    seq += 1;
    return id;
  }

  function bumpSeq() {
    var n = 1;
    doc.parts.forEach(function (p) {
      var m = /(\d+)$/.exec(p.id);
      if (m) n = Math.max(n, +m[1] + 1);
    });
    doc.wires.forEach(function (w) {
      var m2 = /(\d+)$/.exec(w.id);
      if (m2) n = Math.max(n, +m2[1] + 1);
    });
    seq = n;
  }

  function snapshot() {
    return JSON.stringify(S.normalizeDoc(doc));
  }

  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 80) undoStack.shift();
    redoStack = [];
  }

  function restore(text) {
    doc = S.normalizeDoc(JSON.parse(text));
    bumpSeq();
    sel = {};
    wireFrom = null;
    stopRun();
    solveNow();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
  }

  function saveLocal() {
    try { localStorage.setItem(STORE, S.serialize(doc)); } catch (e) {}
  }

  function loadLocal() {
    try {
      var text = localStorage.getItem(STORE);
      if (!text) return null;
      return S.deserialize(text);
    } catch (e) {
      return null;
    }
  }

  function selectedIds() {
    return Object.keys(sel).filter(function (id) { return sel[id]; });
  }

  function partById(id) {
    for (var i = 0; i < doc.parts.length; i++) if (doc.parts[i].id === id) return doc.parts[i];
    return null;
  }

  function bbox(part) {
    var pins = S.partPins(part);
    var minx = part.x;
    var miny = part.y;
    var maxx = part.x;
    var maxy = part.y;
    pins.forEach(function (p) {
      if (p.x < minx) minx = p.x;
      if (p.y < miny) miny = p.y;
      if (p.x > maxx) maxx = p.x;
      if (p.y > maxy) maxy = p.y;
    });
    return { x: minx - 0.45, y: miny - 0.7, w: Math.max(1, maxx - minx) + 0.9, h: Math.max(1, maxy - miny) + 1.3 };
  }

  function hitsPart(part, cell) {
    var b = bbox(part);
    return cell.x >= b.x && cell.x <= b.x + b.w && cell.y >= b.y && cell.y <= b.y + b.h;
  }

  function cellOf(ev) {
    var svg = document.getElementById("mk-svg");
    var rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: view.x, y: view.y };
    var px = (ev.clientX - rect.left) / rect.width;
    var py = (ev.clientY - rect.top) / rect.height;
    view.h = view.w * (rect.height / rect.width);
    return { x: view.x + px * view.w, y: view.y + py * view.h };
  }

  function nearestPin(cell, maxD) {
    var best = null;
    var bd = maxD == null ? 0.95 : maxD;
    doc.parts.forEach(function (part) {
      S.partPins(part).forEach(function (pin) {
        var d = Math.hypot(pin.x - cell.x, pin.y - cell.y);
        if (d < bd) {
          bd = d;
          best = pin;
        }
      });
    });
    return best;
  }

  function topPart(cell) {
    for (var i = doc.parts.length - 1; i >= 0; i--) {
      if (hitsPart(doc.parts[i], cell)) return doc.parts[i];
    }
    return null;
  }

  function setTool(next) {
    tool = next;
    wireFrom = null;
    if (next !== "meter") meterKeys = [];
    document.querySelectorAll("[data-tool]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-tool") === next));
    });
    render();
  }

  function selectOnly(id) {
    sel = {};
    if (id) sel[id] = true;
  }

  function pickDt(current) {
    var parts = current.parts || [];
    for (var i = 0; i < parts.length; i++) if (parts[i].type === "ic555") return 5e-5;
    var vac = null;
    var cap = null;
    var ind = null;
    var res = null;
    parts.forEach(function (p) {
      if (p.type === "vac" && !vac) vac = p;
      if (p.type === "c" && !cap) cap = p;
      if (p.type === "l" && !ind) ind = p;
      if (p.type === "r" && !res) res = p;
    });
    if (vac) return 1 / (Math.max(1, +vac.props.hz || 60) * 90);
    if (cap) {
      var r = res ? Math.max(1, +res.props.ohms || 1000) : 1000;
      var tau = r * Math.max(1e-12, +cap.props.farads || 1e-6);
      return Math.min(2e-3, Math.max(1e-7, tau / 280));
    }
    if (ind) {
      var r2 = res ? Math.max(1, +res.props.ohms || 100) : 100;
      var tauL = Math.max(1e-9, +ind.props.henries || 0.1) / r2;
      return Math.min(2e-3, Math.max(1e-7, tauL / 280));
    }
    return 2e-4;
  }

  function stopRun() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function solveNow() {
    stopRun();
    sim = null;
    scope = [];
    try {
      live = S.dcOperatingPoint(doc);
    } catch (e) {
      live = { ok: false, warnings: [{ code: "error", text: "The solver stopped on this circuit." }], pinV: {}, part: {} };
    }
    if (!booting) saveLocal();
    render();
    paintSide();
  }

  function scopeChoice() {
    if (!live) return { v: 0, name: "" };
    if (probeKey && live.pinV && live.pinV[probeKey] != null) return { v: live.pinV[probeKey], name: probeKey };
    var ids = selectedIds();
    if (ids.length && live.part && live.part[ids[0]] && isFinite(live.part[ids[0]].v)) {
      return { v: live.part[ids[0]].v, name: ids[0] };
    }
    var prefer = ["c", "l", "r", "pot", "led", "d", "op", "npn", "ic555", "not", "and", "nand", "or", "nor"];
    var i;
    var p;
    for (p = 0; p < prefer.length; p++) {
      for (i = 0; i < doc.parts.length; i++) {
        if (doc.parts[i].type !== prefer[p]) continue;
        var info = live.part && live.part[doc.parts[i].id];
        if (info && isFinite(info.v)) return { v: info.v, name: doc.parts[i].id };
      }
    }
    return { v: 0, name: "" };
  }

  function scopeSample() {
    return scopeChoice().v;
  }

  function runLoop() {
    if (!running) return;
    if (!sim) sim = S.freshState();
    for (var i = 0; i < 4; i++) {
      try {
        live = S.stepTransient(doc, sim, dt);
      } catch (e) {
        stopRun();
        break;
      }
      scope.push({ t: sim.t, v: scopeSample() });
    }
    if (scope.length > 700) scope = scope.slice(scope.length - 700);
    render();
    paintSide();
    raf = requestAnimationFrame(runLoop);
  }

  function startRun() {
    stopRun();
    sim = S.freshState();
    scope = [];
    dt = pickDt(doc);
    running = true;
    raf = requestAnimationFrame(runLoop);
  }

  function place(type) {
    var spec = S.LIB[type];
    if (!spec) return;
    pushUndo();
    var id = alloc("p");
    var x = Math.round(view.x + view.w * 0.35);
    var y = Math.round(view.y + view.h * 0.35);
    var guard = 0;
    while (guard < 30) {
      var clash = false;
      for (var i = 0; i < doc.parts.length; i++) {
        if (Math.abs(doc.parts[i].x - x) < 2 && Math.abs(doc.parts[i].y - y) < 2) clash = true;
      }
      if (!clash) break;
      x += 2;
      guard += 1;
    }
    var props = JSON.parse(JSON.stringify(spec.props || {}));
    doc.parts.push({ id: id, type: type, x: x, y: y, rot: 0, flip: false, props: props });
    selectOnly(id);
    solveNow();
  }

  function deleteSel() {
    if (selWire) {
      pushUndo();
      doc.wires = doc.wires.filter(function (w) { return w.id !== selWire; });
      selWire = null;
      solveNow();
      return;
    }
    var ids = selectedIds();
    if (!ids.length && !wireFrom) {
      return;
    }
    pushUndo();
    var map = {};
    ids.forEach(function (id) { map[id] = true; });
    doc.parts = doc.parts.filter(function (p) { return !map[p.id]; });
    doc.wires = doc.wires.filter(function (w) {
      return !map[String(w.a).split(".")[0]] && !map[String(w.b).split(".")[0]];
    });
    sel = {};
    solveNow();
  }

  function rotateSel(dir) {
    var ids = selectedIds();
    if (!ids.length) return;
    pushUndo();
    ids.forEach(function (id) {
      var p = partById(id);
      if (!p) return;
      p.rot = ((p.rot || 0) + dir + 4) % 4;
    });
    solveNow();
  }

  function flipSel() {
    var ids = selectedIds();
    if (!ids.length) return;
    pushUndo();
    ids.forEach(function (id) {
      var p = partById(id);
      if (p) p.flip = !p.flip;
    });
    solveNow();
  }

  function copySel() {
    var ids = selectedIds();
    if (!ids.length) return;
    var map = {};
    ids.forEach(function (id) { map[id] = true; });
    clip = {
      parts: doc.parts.filter(function (p) { return map[p.id]; }).map(function (p) { return JSON.parse(JSON.stringify(p)); }),
      wires: doc.wires.filter(function (w) {
        return map[String(w.a).split(".")[0]] && map[String(w.b).split(".")[0]];
      }).map(function (w) { return JSON.parse(JSON.stringify(w)); })
    };
    setStatus("Copied " + clip.parts.length + (clip.parts.length === 1 ? " part" : " parts"));
  }

  function pasteSel() {
    if (!clip || !clip.parts.length) return;
    pushUndo();
    var map = {};
    sel = {};
    clip.parts.forEach(function (p) {
      var id = alloc("p");
      map[p.id] = id;
      var copy = JSON.parse(JSON.stringify(p));
      copy.id = id;
      copy.x = (p.x || 0) + 2;
      copy.y = (p.y || 0) + 2;
      doc.parts.push(copy);
      sel[id] = true;
    });
    clip.wires.forEach(function (w) {
      var a = String(w.a).split(".");
      var b = String(w.b).split(".");
      if (!map[a[0]] || !map[b[0]]) return;
      doc.wires.push({ id: alloc("w"), a: map[a[0]] + "." + a[1], b: map[b[0]] + "." + b[1] });
    });
    solveNow();
  }

  function addWire(a, b) {
    if (!a || !b || a === b) return;
    var dup = doc.wires.some(function (w) {
      return (w.a === a && w.b === b) || (w.a === b && w.b === a);
    });
    if (dup) return;
    pushUndo();
    doc.wires.push({ id: alloc("w"), a: a, b: b });
    solveNow();
  }

  function loadDoc(next, remember) {
    if (remember !== false) pushUndo();
    doc = S.normalizeDoc(next);
    bumpSeq();
    sel = {};
    wireFrom = null;
    probeKey = null;
    meterKeys = [];
    solveNow();
  }

  function loadExample(id) {
    var ex = S.example(id);
    if (!ex) return;
    loadDoc(ex.doc, doc.parts.length > 0);
    setStatus(ex.name);
  }

  function download() {
    var blob = new Blob([S.serialize(doc)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "circuit.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function share() {
    var token = S.encodeShare(doc);
    var url = location.origin + location.pathname + "?maker=1&c=" + token;
    if (linkBox) linkBox.value = url;
    try { history.replaceState(null, "", "?maker=1&c=" + token); } catch (e) {}
    if (url.length > 1900) {
      setStatus("Link is long. The JSON file is the safer copy.");
    } else {
      setStatus("Share link is in the box. It also sits in the address bar.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(function () {});
    }
  }

  function setStatus(text) {
    var el = document.getElementById("mk-status");
    if (el) el.textContent = text;
  }

  function distPointSeg(p, a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var l2 = dx * dx + dy * dy;
    if (l2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
    var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  function nearestWire(cell) {
    var best = null;
    var bd = 0.45;
    doc.wires.forEach(function (w) {
      var a = pinPos(w.a);
      var b = pinPos(w.b);
      if (!a || !b) return;
      var pts = route(a, b);
      for (var i = 0; i < pts.length - 1; i++) {
        var d = distPointSeg(cell, pts[i], pts[i + 1]);
        if (d < bd) {
          bd = d;
          best = w.id;
        }
      }
    });
    return best;
  }

  function route(a, b) {
    if (Math.abs(a.x - b.x) < 0.05 || Math.abs(a.y - b.y) < 0.05) return [a, b];
    var elbow = Math.abs(a.x - b.x) >= Math.abs(a.y - b.y)
      ? { x: b.x, y: a.y }
      : { x: a.x, y: b.y };
    return [a, elbow, b];
  }

  function pinPos(key) {
    var bits = String(key).split(".");
    var part = partById(bits[0]);
    if (!part) return null;
    var pins = S.partPins(part);
    for (var i = 0; i < pins.length; i++) if (pins[i].id === bits[1]) return pins[i];
    return null;
  }

  function wireAmps(w) {
    if (!live || !live.part) return 0;
    var bits = String(w.a).split(".");
    var info = live.part[bits[0]];
    if (!info || !isFinite(info.i)) return 0;
    var pin = bits[1];
    var sign = (pin === "b" || pin === "n" || pin === "k" || pin === "e") ? -1 : 1;
    return sign * info.i;
  }

  function labelFor(part) {
    var p = part.props || {};
    if (part.type === "r") return fmtOhms(p.ohms);
    if (part.type === "pot") return fmtOhms(p.ohms) + " · " + Math.round((+p.wiper || 0) * 100) + "%";
    if (part.type === "vdc") return (+p.v || 0) + " V";
    if (part.type === "vac") return (+p.vpeak || 0) + " Vpk · " + (+p.hz || 0) + " Hz";
    if (part.type === "idc") return fmtI(+p.a || 0);
    if (part.type === "c") {
      var f = +p.farads || 0;
      if (f >= 1e-3) return (f * 1e3).toFixed(2) + " mF";
      if (f >= 1e-6) return (f * 1e6).toFixed(2) + " µF";
      if (f >= 1e-9) return (f * 1e9).toFixed(2) + " nF";
      return (f * 1e12).toFixed(1) + " pF";
    }
    if (part.type === "l") {
      var h = +p.henries || 0;
      if (h >= 1) return h.toFixed(2) + " H";
      if (h >= 1e-3) return (h * 1e3).toFixed(2) + " mH";
      return (h * 1e6).toFixed(1) + " µH";
    }
    if (part.type === "sw") return p.closed ? "closed" : "open";
    if (part.type === "npn") return "β " + (+p.beta || 100);
    if (part.type === "led") return "LED";
    if (part.type === "d") return "D";
    if (part.type === "op") return "op-amp";
    if (part.type === "ic555") return "555";
    if (part.type === "gnd") return "";
    return S.LIB[part.type] ? S.LIB[part.type].label : part.type;
  }

  function symbol(part) {
    var t = part.type;
    var s = "";
    if (t === "r") {
      s += '<path class="mk-sym" d="M0 0 H0.7 L0.95 -0.45 L1.45 0.45 L1.95 -0.45 L2.45 0.45 L2.95 -0.45 L3.3 0 H4"/>';
    } else if (t === "pot") {
      s += '<path class="mk-sym" d="M0 0 H0.7 L0.95 -0.45 L1.45 0.45 L1.95 -0.45 L2.45 0.45 L2.95 -0.45 L3.3 0 H4"/>';
      s += '<path class="mk-sym" d="M2 1 V0.15"/>';
      s += '<path class="mk-sym" d="M1.7 0.45 L2 0.15 L2.3 0.45"/>';
    } else if (t === "c") {
      s += '<path class="mk-sym" d="M0 0 V0.7 M-0.7 0.7 H0.7 M-0.7 1.3 H0.7 M0 1.3 V2"/>';
    } else if (t === "l") {
      s += '<path class="mk-sym" d="M0 0 H0.4 C0.4 -0.7 1.2 -0.7 1.2 0 C1.2 -0.7 2 -0.7 2 0 C2 -0.7 2.8 -0.7 2.8 0 C2.8 -0.7 3.6 -0.7 3.6 0 H4"/>';
    } else if (t === "gnd") {
      s += '<path class="mk-sym" d="M0 0 V0.45 M-0.7 0.45 H0.7 M-0.45 0.75 H0.45 M-0.2 1.05 H0.2"/>';
    } else if (t === "vdc") {
      s += '<path class="mk-sym" d="M0 0 V1.1 M-0.55 1.1 H0.55 M-0.3 1.7 H0.3 M0 1.7 V3"/>';
      s += '<path class="mk-sym" d="M-0.15 0.55 H0.15 M0 0.4 V0.7"/>';
    } else if (t === "vac") {
      s += '<path class="mk-sym" d="M0 0 V0.8 M0 2.2 V3"/>';
      s += '<circle class="mk-sym" cx="0" cy="1.5" r="0.7"/>';
      s += '<path class="mk-sym" d="M-0.45 1.5 C-0.25 1.1 0.05 1.1 0.15 1.5 C0.25 1.9 0.45 1.9 0.5 1.5"/>';
    } else if (t === "idc") {
      s += '<path class="mk-sym" d="M0 0 V0.8 M0 2.2 V3"/>';
      s += '<circle class="mk-sym" cx="0" cy="1.5" r="0.7"/>';
      s += '<path class="mk-sym" d="M0 1.95 V1.05 M-0.2 1.3 L0 1.05 L0.2 1.3"/>';
    } else if (t === "sw") {
      var closed = part.props && part.props.closed;
      s += '<path class="mk-sym" d="M0 0 H0.4"/>';
      s += '<circle class="mk-pin" cx="0.45" cy="0" r="0.12"/>';
      if (closed) s += '<path class="mk-sym" d="M0.55 0 H3"/>';
      else s += '<path class="mk-sym" d="M0.55 0 L2.5 -0.7"/>';
      s += '<circle class="mk-pin" cx="2.7" cy="0" r="0.12"/>';
      s += '<path class="mk-sym" d="M2.8 0 H3"/>';
    } else if (t === "d" || t === "led") {
      s += '<path class="mk-sym" d="M0 0 H0.8 M2.2 0 H3"/>';
      s += '<path class="mk-sym" d="M0.8 -0.55 L0.8 0.55 L2.05 0 Z"/>';
      s += '<path class="mk-sym" d="M2.05 -0.55 V0.55"/>';
      if (t === "led") {
        s += '<path class="mk-sym" d="M1.5 -0.85 L2.05 -1.25 M1.85 -1.25 H2.1 V-1"/>';
        s += '<path class="mk-sym" d="M1.9 -0.7 L2.45 -1.1 M2.25 -1.1 H2.5 V-0.85"/>';
        var lit = live && live.part && live.part[part.id] && live.part[part.id].i > 0.0005;
        if (lit) s += '<path class="mk-sym" d="M0.8 -0.55 L0.8 0.55 L2.05 0 Z" fill="var(--accent,#c8b48a)" fill-opacity="0.45"/>';
      }
    } else if (t === "npn") {
      s += '<path class="mk-sym" d="M0 1 H0.7 M0.7 0.15 V1.85 M0.7 0.55 L2 0 M2 0 V0 M0.7 1.45 L2 2"/>';
      s += '<path class="mk-sym" d="M1.55 1.7 L2 2 L1.7 1.55"/>';
      s += '<path class="mk-sym" d="M2 0 V0.15 M2 2 V1.85"/>';
    } else if (t === "op") {
      s += '<path class="mk-sym" d="M0.3 -0.2 V2.2 L3.4 1 Z"/>';
      s += '<path class="mk-sym" d="M0 0 H0.3 M0 2 H0.3 M3.4 1 H4"/>';
      s += '<path class="mk-sym" d="M0.7 0.45 H1.15 M0.7 1.55 H1.15 M0.92 1.35 V1.75"/>';
      s += '<path class="mk-sym" d="M1 -1 V-0.15 M3 -1 V-0.05"/>';
    } else if (t === "not") {
      s += '<path class="mk-sym" d="M0.2 0.2 V1.8 L2.3 1 Z"/>';
      s += '<circle class="mk-sym" cx="2.55" cy="1" r="0.22"/>';
      s += '<path class="mk-sym" d="M0 1 H0.2 M2.77 1 H3"/>';
    } else if (t === "and" || t === "nand" || t === "or" || t === "nor") {
      var bub = t === "nand" || t === "nor";
      if (t === "or" || t === "nor") {
        s += '<path class="mk-sym" d="M0.35 0 C1.1 0.7 1.1 1.3 0.35 2 C1.3 1.7 2.2 1.5 2.6 1 C2.2 0.5 1.3 0.3 0.35 0"/>';
      } else {
        s += '<path class="mk-sym" d="M0.3 0 H1.4 C2.3 0 2.6 0.4 2.6 1 C2.6 1.6 2.3 2 1.4 2 H0.3 Z"/>';
      }
      s += '<path class="mk-sym" d="M0 0 H0.35 M0 2 H0.35"/>';
      if (bub) {
        s += '<circle class="mk-sym" cx="2.85" cy="1" r="0.2"/>';
        s += '<path class="mk-sym" d="M3.05 1 H3"/>';
      } else {
        s += '<path class="mk-sym" d="M2.6 1 H3"/>';
      }
    } else if (t === "ic555") {
      s += '<rect class="mk-sym" x="0.45" y="-0.25" width="3.1" height="3.5"/>';
      s += '<text class="mk-lab" x="1.15" y="1.55" font-size="0.7">555</text>';
    }
    var spec = S.LIB[t];
    if (spec) {
      spec.pins.forEach(function (pin) {
        var hot = wireFrom === part.id + "." + pin.id || probeKey === part.id + "." + pin.id || meterKeys.indexOf(part.id + "." + pin.id) >= 0;
        s += '<circle class="mk-pin' + (hot ? " hot" : "") + '" cx="' + pin.x + '" cy="' + pin.y + '" r="0.16"/>';
      });
    }
    return s;
  }

  function render() {
    var svg = document.getElementById("mk-svg");
    if (!svg) return;
    var rect = svg.getBoundingClientRect();
    if (rect.width && rect.height) view.h = view.w * (rect.height / rect.width);
    svg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
    var x0 = Math.floor(view.x) - 1;
    var x1 = Math.ceil(view.x + view.w) + 1;
    var y0 = Math.floor(view.y) - 1;
    var y1 = Math.ceil(view.y + view.h) + 1;
    var html = "";
    for (var x = x0; x <= x1; x++) {
      html += '<line class="mk-grid' + (x % 4 === 0 ? " mk-grid-m" : "") + '" x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + y1 + '"/>';
    }
    for (var y = y0; y <= y1; y++) {
      html += '<line class="mk-grid' + (y % 4 === 0 ? " mk-grid-m" : "") + '" x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '"/>';
    }
    doc.wires.forEach(function (w) {
      var a = pinPos(w.a);
      var b = pinPos(w.b);
      if (!a || !b) return;
      var pts = route(a, b).map(function (p) { return p.x + "," + p.y; }).join(" ");
      var amps = wireAmps(w);
      var chosen = selWire === w.id;
      var flow = Math.abs(amps) > 1e-6;
      var dur = Math.max(0.25, Math.min(1.4, 0.12 / Math.max(Math.abs(amps), 1e-4)));
      html += '<polyline class="mk-wire" points="' + pts + '"' + (chosen ? ' stroke="var(--accent,#c8b48a)"' : "") + "/>";
      if (flow) {
        html += '<polyline class="mk-flow' + (amps < 0 ? " rev" : "") + '" points="' + pts + '" style="animation-duration:' + dur.toFixed(2) + 's"/>';
      }
    });
    if (wireFrom) {
      var from = pinPos(wireFrom);
      if (from && drag && drag.kind === "wire") {
        var elbow = route(from, drag.cell);
        html += '<polyline class="mk-wire" points="' + elbow.map(function (p) { return p.x + "," + p.y; }).join(" ") + '" opacity="0.55"/>';
      }
    }
    doc.parts.forEach(function (part) {
      var flip = part.flip ? -1 : 1;
      var rot = ((part.rot || 0) % 4) * 90;
      html += '<g class="mk-part' + (sel[part.id] ? " is-on" : "") + '" data-id="' + esc(part.id) + '" transform="translate(' + part.x + " " + part.y + ") rotate(" + rot + ") scale(" + flip + ' 1)">';
      html += symbol(part);
      html += "</g>";
      var pins = S.partPins(part);
      if (pins.length) {
        var cx = 0;
        var cy = 0;
        pins.forEach(function (p) { cx += p.x; cy += p.y; });
        cx /= pins.length;
        cy = Math.max.apply(null, pins.map(function (p) { return p.y; })) + 0.55;
        var lab = labelFor(part);
        if (lab) html += '<text class="mk-lab" x="' + cx + '" y="' + cy + '" font-size="0.42" text-anchor="middle">' + esc(lab) + "</text>";
      }
    });
    if (showVolts && live && live.pinV && live.nets) {
      var seen = {};
      doc.parts.forEach(function (part) {
        S.partPins(part).forEach(function (pin) {
          var node = live.nets.pinNode[pin.key];
          if (!node || node === "0" || seen[node]) return;
          seen[node] = true;
          html += '<text class="mk-vlab" x="' + (pin.x + 0.25) + '" y="' + (pin.y - 0.28) + '" font-size="0.38">' + esc(fmtV(live.pinV[pin.key])) + "</text>";
        });
      });
    }
    if (drag && drag.kind === "marquee") {
      var x = Math.min(drag.a.x, drag.b.x);
      var y = Math.min(drag.a.y, drag.b.y);
      var w = Math.abs(drag.b.x - drag.a.x);
      var h = Math.abs(drag.b.y - drag.a.y);
      html += '<rect class="mk-box" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
    }
    svg.innerHTML = html;
    var runBtn = document.getElementById("mk-run");
    if (runBtn) runBtn.setAttribute("aria-pressed", String(running));
  }

  function paintSide() {
    var box = document.getElementById("mk-read");
    var warn = document.getElementById("mk-warn");
    var props = document.getElementById("mk-props");
    var scopeEl = document.getElementById("mk-scope");
    if (!box) return;
    var ids = selectedIds();
    var info = ids.length === 1 && live && live.part ? live.part[ids[0]] : null;
    var pv = probeKey && live && live.pinV ? live.pinV[probeKey] : null;
    var mv = null;
    if (meterKeys.length === 2 && live && live.pinV) mv = (live.pinV[meterKeys[0]] || 0) - (live.pinV[meterKeys[1]] || 0);
    box.innerHTML =
      '<div><div class="k">' + (running ? "Transient" : "DC") + "</div><div class=\"n\">" + (ids.length === 1 ? esc(ids[0]) : "—") + "</div></div>" +
      '<div><div class="k">Part V</div><div class="n">' + (info ? esc(fmtV(info.v)) : "—") + "</div></div>" +
      '<div><div class="k">Part I</div><div class="n">' + (info ? esc(fmtI(info.i)) : "—") + "</div></div>" +
      '<div><div class="k">' + (meterKeys.length === 2 ? "Meter" : "Probe") + "</div><div class=\"n\">" + esc(mv != null ? fmtV(mv) : fmtV(pv)) + "</div></div>";
    var warnings = (live && live.warnings) || [];
    if (!warnings.length) {
      warn.innerHTML = '<li style="color:var(--muted,#63666e)">No shorts, floating islands, or LED over-current.</li>';
    } else {
      warn.innerHTML = warnings.map(function (w) { return "<li>" + esc(w.text) + "</li>"; }).join("");
    }
    paintProps(props, ids.length === 1 ? partById(ids[0]) : null);
    paintScope(scopeEl);
    if (!running && live) {
      if (warnings.length) setStatus(warnings[0].text);
      else if (info) setStatus((running ? "Running" : "DC point") + " · " + fmtV(info.v) + " · " + fmtI(info.i));
      else setStatus(running ? "Running" : "DC operating point");
    } else if (running) {
      setStatus("Transient · t = " + (sim && sim.t ? sim.t.toFixed(4) : "0") + " s · dt " + dt.toExponential(1) + " s");
    }
  }

  function field(label, html) {
    return "<label>" + esc(label) + html + "</label>";
  }

  function numInput(key, value, step, min) {
    return '<input type="number" data-prop="' + esc(key) + '" value="' + esc(value) + '" step="' + step + '"' + (min != null ? ' min="' + min + '"' : "") + ">";
  }

  function paintProps(el, part) {
    if (!el) return;
    if (el.contains(document.activeElement) && el.childElementCount) return;
    if (!part) {
      el.innerHTML = '<p class="mk-note">Select a part to edit its value. Drag a lead in Wire to snap a right-angle wire. Probe reads one node. Meter reads the difference of two taps.</p>';
      return;
    }
    var p = part.props || {};
    var html = "<h2>" + esc(S.LIB[part.type].label) + "</h2>";
    if (part.type === "r" || part.type === "pot") html += field("Ohms", numInput("ohms", p.ohms, "1", "0.5"));
    if (part.type === "pot") html += field("Wiper 0 at A, 1 at B", '<input type="range" data-prop="wiper" min="0" max="1" step="0.01" value="' + (+p.wiper || 0) + '">');
    if (part.type === "vdc") html += field("Volts", numInput("v", p.v, "0.1"));
    if (part.type === "vac") {
      html += field("Peak volts", numInput("vpeak", p.vpeak, "0.1", "0"));
      html += field("Hertz", numInput("hz", p.hz, "1", "0.01"));
    }
    if (part.type === "idc") html += field("Amps", numInput("a", p.a, "0.0001"));
    if (part.type === "c") html += field("Farads", numInput("farads", p.farads, "0.0000001", "1e-15"));
    if (part.type === "l") html += field("Henries", numInput("henries", p.henries, "0.001", "1e-9"));
    if (part.type === "npn") html += field("Beta", numInput("beta", p.beta, "1", "1"));
    if (part.type === "op") {
      html += field("Positive rail", numInput("vp", p.vp, "0.5"));
      html += field("Negative rail", numInput("vn", p.vn, "0.5"));
    }
    if (part.type === "sw") {
      html += '<button type="button" id="mk-toggle-sw" aria-pressed="' + (p.closed ? "true" : "false") + '">' + (p.closed ? "Switch closed" : "Switch open") + "</button>";
    }
    if (part.type === "d") html += '<p class="mk-note">Silicon Shockley, Is = 1e−14 A, n = 1. About 0.7 V at a milliamp. Not a datasheet.</p>';
    if (part.type === "led") html += '<p class="mk-note">Shockley LED, about 2 V at 20 mA. Above 20 mA raises an over-current hint. The lesson LED is still a fixed 2 V drop.</p>';
    if (part.type === "ic555") html += '<p class="mk-note">Behavioral 555. Set and reset at 1/3 and 2/3 of Vcc. Discharge is about 1 Ω to ground while the output is low. Run transient for the astable.</p>';
    if (S.isGate(part.type)) html += '<p class="mk-note">Ideal gate. Output steps to Vcc or 0 through 100 Ω. Threshold is half of Vcc. One step of delay, so it can clock.</p>';
    var prev = el.innerHTML;
    if (prev === html) return;
    el.innerHTML = html;
    el.querySelectorAll("[data-prop]").forEach(function (input) {
      input.addEventListener("focus", function () { input.dataset.undo = "1"; });
      input.addEventListener("input", function () {
        if (input.dataset.undo === "1") {
          pushUndo();
          input.dataset.undo = "";
        }
        var key = input.getAttribute("data-prop");
        part.props[key] = +input.value;
        solveNow();
      });
    });
    var sw = document.getElementById("mk-toggle-sw");
    if (sw) {
      sw.addEventListener("click", function () {
        pushUndo();
        part.props.closed = !part.props.closed;
        solveNow();
      });
    }
  }

  function paintScope(svg) {
    if (!svg) return;
    if (scope.length < 2) {
      svg.innerHTML = '<text x="8" y="24" fill="currentColor" font-size="12" font-family="IBM Plex Mono,monospace">Scope · Run transient</text>';
      return;
    }
    var min = scope[0].v;
    var max = scope[0].v;
    var t0 = scope[0].t;
    var t1 = scope[scope.length - 1].t;
    scope.forEach(function (s) {
      if (s.v < min) min = s.v;
      if (s.v > max) max = s.v;
    });
    if (max - min < 1e-6) { max += 0.5; min -= 0.5; }
    var pad = (max - min) * 0.1;
    min -= pad;
    max += pad;
    var w = 280;
    var h = 120;
    var pts = scope.map(function (s) {
      var x = t1 === t0 ? 0 : ((s.t - t0) / (t1 - t0)) * (w - 16) + 8;
      var y = h - 16 - ((s.v - min) / (max - min)) * (h - 28);
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    var choice = scopeChoice();
    svg.innerHTML =
      '<text x="8" y="16" fill="currentColor" font-size="11" font-family="IBM Plex Mono,monospace">' + esc(choice.name || "Scope") + "  " + esc(fmtV(max)) + " … " + esc(fmtV(min)) + "</text>" +
      '<polyline points="' + pts + '" fill="none" stroke="var(--accent,#c8b48a)" stroke-width="1.6"/>';
  }

  function onPointerDown(ev) {
    if (ev.button != null && ev.button !== 0) return;
    var svg = document.getElementById("mk-svg");
    svg.setPointerCapture(ev.pointerId);
    pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      var a = pointers[ids[0]];
      var b = pointers[ids[1]];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), w: view.w, x: view.x, y: view.y };
      drag = null;
      return;
    }
    var cell = cellOf(ev);
    if (tool === "wire") {
      var pin = nearestPin(cell, 1);
      if (!pin) {
        wireFrom = null;
        render();
        return;
      }
      if (!wireFrom) {
        wireFrom = pin.key;
        drag = { kind: "wire", cell: cell };
        render();
        return;
      }
      addWire(wireFrom, pin.key);
      wireFrom = null;
      drag = null;
      return;
    }
    if (tool === "probe" || tool === "meter") {
      var pin2 = nearestPin(cell, 1.1);
      if (!pin2) return;
      if (tool === "probe") probeKey = pin2.key;
      else {
        meterKeys.push(pin2.key);
        if (meterKeys.length > 2) meterKeys = meterKeys.slice(-2);
      }
      render();
      paintSide();
      return;
    }
    var part = topPart(cell);
    if (part) {
      selWire = null;
      if (additive || ev.shiftKey) sel[part.id] = !sel[part.id];
      else if (!sel[part.id]) selectOnly(part.id);
      var starts = {};
      selectedIds().forEach(function (id) {
        var p = partById(id);
        if (p) starts[id] = { x: p.x, y: p.y };
      });
      drag = { kind: "move", cell: cell, origin: cell, starts: starts, moved: false, undo: false };
      paintSide();
      render();
      return;
    }
    var wid = nearestWire(cell);
    if (wid) {
      selWire = wid;
      if (!additive && !ev.shiftKey) sel = {};
      render();
      paintSide();
      return;
    }
    selWire = null;
    if (additive || ev.shiftKey) {
      drag = { kind: "marquee", a: cell, b: cell, base: ev.shiftKey || additive ? Object.assign({}, sel) : {} };
      if (!ev.shiftKey && !additive) sel = {};
      return;
    }
    drag = { kind: "pan", x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
  }

  function onPointerMove(ev) {
    if (pointers[ev.pointerId]) pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var ids = Object.keys(pointers);
    if (pinch && ids.length >= 2) {
      var a = pointers[ids[0]];
      var b = pointers[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.d > 1) {
        var factor = pinch.d / d;
        view.w = Math.max(6, Math.min(80, pinch.w * factor));
        render();
      }
      return;
    }
    if (!drag) return;
    var cell = cellOf(ev);
    if (drag.kind === "pan") {
      var svg = document.getElementById("mk-svg");
      var rect = svg.getBoundingClientRect();
      view.x = drag.vx - ((ev.clientX - drag.x) / rect.width) * view.w;
      view.y = drag.vy - ((ev.clientY - drag.y) / rect.height) * view.h;
      render();
      return;
    }
    if (drag.kind === "wire") {
      drag.cell = cell;
      var pin = nearestPin(cell, 1);
      if (pin) drag.cell = { x: pin.x, y: pin.y };
      render();
      return;
    }
    if (drag.kind === "marquee") {
      drag.b = cell;
      var x0 = Math.min(drag.a.x, drag.b.x);
      var y0 = Math.min(drag.a.y, drag.b.y);
      var x1 = Math.max(drag.a.x, drag.b.x);
      var y1 = Math.max(drag.a.y, drag.b.y);
      sel = Object.assign({}, drag.base || {});
      doc.parts.forEach(function (part) {
        var b = bbox(part);
        var hit = b.x < x1 && b.x + b.w > x0 && b.y < y1 && b.y + b.h > y0;
        if (hit) sel[part.id] = true;
      });
      render();
      return;
    }
    if (drag.kind === "move") {
      var dx = Math.round(cell.x - drag.origin.x);
      var dy = Math.round(cell.y - drag.origin.y);
      if (dx || dy) {
        if (!drag.undo) {
          pushUndo();
          drag.undo = true;
        }
        drag.moved = true;
        Object.keys(drag.starts).forEach(function (id) {
          var p = partById(id);
          if (!p) return;
          p.x = drag.starts[id].x + dx;
          p.y = drag.starts[id].y + dy;
        });
        render();
      }
    }
  }

  function onPointerUp(ev) {
    delete pointers[ev.pointerId];
    if (Object.keys(pointers).length < 2) pinch = null;
    if (drag && drag.kind === "move" && drag.moved) solveNow();
    if (drag && drag.kind === "marquee") {
      render();
      paintSide();
    }
    if (drag && drag.kind !== "wire") drag = null;
    if (drag && drag.kind === "wire" && Object.keys(pointers).length === 0) {
      /* keep wireFrom so the next tap finishes the wire */
      drag = null;
    }
  }

  function zoomBy(factor, center) {
    var svg = document.getElementById("mk-svg");
    var rect = svg.getBoundingClientRect();
    if (rect.width) view.h = view.w * (rect.height / rect.width);
    var cx = center ? center.x : view.x + view.w / 2;
    var cy = center ? center.y : view.y + view.h / 2;
    var nw = Math.max(6, Math.min(80, view.w * factor));
    var k = nw / view.w;
    view.x = cx - (cx - view.x) * k;
    view.y = cy - (cy - view.y) * k;
    view.w = nw;
    render();
  }

  function build() {
    var pal = "";
    PALETTE.forEach(function (group) {
      pal += "<h2>" + esc(group[0]) + "</h2>";
      group[1].forEach(function (type) {
        pal += '<button type="button" data-add="' + type + '">' + esc(S.LIB[type].label) + "</button>";
      });
    });
    var examples = S.examples().map(function (ex) {
      return '<option value="' + esc(ex.id) + '">' + esc(ex.name) + "</option>";
    }).join("");
    root.innerHTML =
      '<div class="mk">' +
        '<div class="mk-pal" id="mk-pal">' + pal + "</div>" +
        '<div class="mk-board">' +
          '<div class="mk-bar" role="toolbar" aria-label="Maker tools">' +
            '<button type="button" data-tool="select" aria-pressed="true">Select</button>' +
            '<button type="button" data-tool="wire" aria-pressed="false">Wire</button>' +
            '<button type="button" data-tool="probe" aria-pressed="false">Probe</button>' +
            '<button type="button" data-tool="meter" aria-pressed="false">Meter</button>' +
            '<button type="button" id="mk-multi" aria-pressed="false">Multi</button>' +
            '<button type="button" id="mk-rot">Rotate</button>' +
            '<button type="button" id="mk-flip">Flip</button>' +
            '<button type="button" id="mk-copy">Copy</button>' +
            '<button type="button" id="mk-paste">Paste</button>' +
            '<button type="button" id="mk-del">Delete</button>' +
            '<button type="button" id="mk-undo">Undo</button>' +
            '<button type="button" id="mk-redo">Redo</button>' +
            '<button type="button" id="mk-zin">Zoom in</button>' +
            '<button type="button" id="mk-zout">Zoom out</button>' +
            '<button type="button" id="mk-volts" aria-pressed="true">Volts</button>' +
          "</div>" +
          '<svg id="mk-svg" class="mk-svg" role="img" aria-label="Circuit canvas"></svg>' +
          '<div class="mk-file">' +
            '<select id="mk-examples" aria-label="Example circuits"><option value="">Examples</option>' + examples + "</select>" +
            '<button type="button" id="mk-dc">DC point</button>' +
            '<button type="button" id="mk-run" aria-pressed="false">Run</button>' +
            '<button type="button" id="mk-stop">Stop</button>' +
            '<button type="button" id="mk-save">Save JSON</button>' +
            '<button type="button" id="mk-load">Load</button>' +
            '<button type="button" id="mk-share">Share link</button>' +
            '<input id="mk-file" type="file" accept="application/json,.json,.txt,text/plain" hidden>' +
          "</div>" +
          '<div class="mk-status" id="mk-status" role="status">DC operating point</div>' +
        "</div>" +
        '<aside class="mk-side">' +
          '<h2>Readout</h2>' +
          '<div class="mk-read" id="mk-read"></div>' +
          '<h2>Scope</h2>' +
          '<svg id="mk-scope" class="mk-scope" role="img" aria-label="Scope"></svg>' +
          '<h2>Hints</h2>' +
          '<ul class="mk-warn" id="mk-warn"></ul>' +
          '<div class="mk-props" id="mk-props"></div>' +
          '<h2>Share</h2>' +
          '<input class="mk-link" id="mk-link" type="text" readonly aria-label="Share link">' +
          '<p class="mk-note">Saved in this browser. JSON file and the share link use the same text. Educational models, not a bench supply.</p>' +
        "</aside>" +
      "</div>";
    linkBox = document.getElementById("mk-link");
    root.querySelectorAll("[data-add]").forEach(function (b) {
      b.addEventListener("click", function () { place(b.getAttribute("data-add")); });
    });
    root.querySelectorAll("[data-tool]").forEach(function (b) {
      b.addEventListener("click", function () { setTool(b.getAttribute("data-tool")); });
    });
    document.getElementById("mk-multi").addEventListener("click", function (ev) {
      additive = !additive;
      ev.currentTarget.setAttribute("aria-pressed", String(additive));
    });
    document.getElementById("mk-rot").addEventListener("click", function () { rotateSel(1); });
    document.getElementById("mk-flip").addEventListener("click", flipSel);
    document.getElementById("mk-copy").addEventListener("click", copySel);
    document.getElementById("mk-paste").addEventListener("click", pasteSel);
    document.getElementById("mk-del").addEventListener("click", deleteSel);
    document.getElementById("mk-undo").addEventListener("click", undo);
    document.getElementById("mk-redo").addEventListener("click", redo);
    document.getElementById("mk-zin").addEventListener("click", function () { zoomBy(0.8); });
    document.getElementById("mk-zout").addEventListener("click", function () { zoomBy(1.25); });
    document.getElementById("mk-volts").addEventListener("click", function (ev) {
      showVolts = !showVolts;
      ev.currentTarget.setAttribute("aria-pressed", String(showVolts));
      render();
    });
    document.getElementById("mk-examples").addEventListener("change", function (ev) {
      if (!ev.target.value) return;
      loadExample(ev.target.value);
      ev.target.value = "";
    });
    document.getElementById("mk-dc").addEventListener("click", solveNow);
    document.getElementById("mk-run").addEventListener("click", function () {
      if (running) stopRun();
      else startRun();
      render();
    });
    document.getElementById("mk-stop").addEventListener("click", function () {
      stopRun();
      solveNow();
    });
    document.getElementById("mk-save").addEventListener("click", download);
    document.getElementById("mk-load").addEventListener("click", function () {
      document.getElementById("mk-file").click();
    });
    document.getElementById("mk-file").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          loadDoc(S.deserialize(String(reader.result)), true);
          setStatus("Loaded " + file.name);
        } catch (err) {
          setStatus("That file is not a circuit JSON document.");
        }
      };
      reader.readAsText(file);
      ev.target.value = "";
    });
    document.getElementById("mk-share").addEventListener("click", share);
    var svg = document.getElementById("mk-svg");
    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("pointercancel", onPointerUp);
    svg.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      zoomBy(ev.deltaY > 0 ? 1.12 : 1 / 1.12, cellOf(ev));
    }, { passive: false });
    document.addEventListener("keydown", onKey);
  }

  function typingTarget(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function helpOpen() {
    var dlg = document.getElementById("circuits-help-dialog");
    return dlg && !dlg.hidden;
  }

  function onKey(ev) {
    if (helpOpen() || typingTarget(ev.target)) return;
    if (lessonRoot && !lessonRoot.classList.contains("hid")) return;
    var meta = ev.metaKey || ev.ctrlKey;
    if (meta && ev.key.toLowerCase() === "z") {
      ev.preventDefault();
      if (ev.shiftKey) redo();
      else undo();
      return;
    }
    if (meta && ev.key.toLowerCase() === "y") { ev.preventDefault(); redo(); return; }
    if (meta && ev.key.toLowerCase() === "c") { copySel(); return; }
    if (meta && ev.key.toLowerCase() === "v") { ev.preventDefault(); pasteSel(); return; }
    if (meta && ev.key.toLowerCase() === "a") {
      ev.preventDefault();
      sel = {};
      doc.parts.forEach(function (p) { sel[p.id] = true; });
      render();
      paintSide();
      return;
    }
    if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); deleteSel(); return; }
    if (ev.key === "r" || ev.key === "R") { rotateSel(ev.shiftKey ? -1 : 1); return; }
    if (ev.key === "f" || ev.key === "F") { flipSel(); return; }
    if (ev.key === "Escape") {
      wireFrom = null;
      drag = null;
      setTool("select");
    }
    if (ev.key === " " && ev.target === document.body) {
      ev.preventDefault();
      if (running) stopRun();
      else startRun();
    }
  }

  function showMode(maker) {
    lessonRoot.classList.toggle("hid", maker);
    root.classList.toggle("hid", !maker);
    if (modeLessons) modeLessons.setAttribute("aria-pressed", String(!maker));
    if (modeMaker) modeMaker.setAttribute("aria-pressed", String(maker));
    if (maker) {
      render();
      paintSide();
    }
  }

  function bootDoc() {
    var params = new URLSearchParams(location.search);
    var fromLink = null;
    if (params.get("c")) {
      try { fromLink = S.decodeShare(params.get("c")); } catch (e) { fromLink = null; }
    }
    if (fromLink) doc = fromLink;
    else {
      var saved = loadLocal();
      doc = saved && saved.parts && saved.parts.length ? saved : S.example("divider").doc;
    }
    doc = S.normalizeDoc(doc);
    bumpSeq();
  }

  function bootHelp() {
    var helpBtn = document.getElementById("circuits-help");
    var helpDialog = document.getElementById("circuits-help-dialog");
    if (!helpBtn || !helpDialog) return;
    var previously = null;
    var scrollLock = "";
    function focusables() {
      return [].slice.call(helpDialog.querySelectorAll("button, a[href]")).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
    }
    function openHelp() {
      if (!helpDialog.hidden) return;
      previously = document.activeElement;
      helpDialog.hidden = false;
      helpBtn.setAttribute("aria-expanded", "true");
      scrollLock = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      var closer = helpDialog.querySelector("[data-help-close]");
      if (closer) closer.focus();
    }
    function closeHelp() {
      if (helpDialog.hidden) return;
      helpDialog.hidden = true;
      helpBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = scrollLock;
      if (previously && previously.focus) previously.focus();
      else helpBtn.focus();
    }
    helpBtn.addEventListener("click", function () {
      if (helpDialog.hidden) openHelp();
      else closeHelp();
    });
    helpDialog.addEventListener("click", function (ev) {
      if (ev.target === helpDialog) closeHelp();
    });
    helpDialog.querySelectorAll("[data-help-close]").forEach(function (b) {
      b.addEventListener("click", closeHelp);
    });
    document.addEventListener("keydown", function (ev) {
      if (helpDialog.hidden) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeHelp();
        return;
      }
      if (ev.key !== "Tab") return;
      var nodes = focusables();
      if (!nodes.length) { ev.preventDefault(); return; }
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      var active = document.activeElement;
      if (ev.shiftKey && (active === first || !helpDialog.contains(active))) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && active === last) {
        ev.preventDefault();
        first.focus();
      }
    });
  }

  build();
  bootHelp();
  bootDoc();
  solveNow();
  booting = false;
  if (modeLessons) modeLessons.addEventListener("click", function () { showMode(false); });
  if (modeMaker) modeMaker.addEventListener("click", function () { showMode(true); });
  var params = new URLSearchParams(location.search);
  showMode(params.get("maker") === "1");
})();
