/* Standard 16-angle study unit circle.
   Depends on exact-math.js (window.ExactMath) and trainer/values.js (window.UnitCircle).
   Browser boot looks for #uc-chart. Node can require() the layout for tests. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.UnitCircleChart = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", api.boot);
    else api.boot();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var R = 430;
  var SIZE = { rad: 17, deg: 16, coord: 20 };

  /* Radii are hand-set so 15° neighbors sit on different rings.
     Diagonal angles (45°) stay closer; 30°/60° family sits further out. */
  var RING = {
    rad: R - 74,
    deg: R + 42,
    coordAxis: R + 148,
    coordDiag: R + 156,
    coordOff: R + 268
  };
  var TANGENT = 22;

  var QUADS = [
    { deg: 45, roman: "I", astc: "A", name: "all positive" },
    { deg: 135, roman: "II", astc: "S", name: "sine positive" },
    { deg: 225, roman: "III", astc: "T", name: "tangent positive" },
    { deg: 315, roman: "IV", astc: "C", name: "cosine positive" }
  ];

  function round(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function family(deg) {
    var m = ((deg % 360) + 360) % 360 % 90;
    if (m === 0) return "axis";
    if (m === 45) return "diag";
    return "off";
  }

  function polar(deg, radius, tangent) {
    var a = deg * Math.PI / 180;
    return {
      x: Math.cos(a) * radius - Math.sin(a) * tangent,
      y: -Math.sin(a) * radius - Math.cos(a) * tangent
    };
  }

  function angOf(item) {
    return Math.atan2(-item.y, item.x);
  }

  function radiusOf(item) {
    return Math.hypot(item.x, item.y);
  }

  function setPolar(item, radius) {
    var a = angOf(item);
    item.x = Math.cos(a) * radius;
    item.y = -Math.sin(a) * radius;
  }

  function rotate(item, delta) {
    var a = angOf(item) + delta;
    var radius = radiusOf(item);
    item.x = Math.cos(a) * radius;
    item.y = -Math.sin(a) * radius;
  }

  function hit(a, b, pad) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad &&
      Math.abs(a.y - b.y) < (a.h + b.h) / 2 + pad;
  }

  function clampZone(item) {
    if (item.locked) return;
    var radius = radiusOf(item);
    var minR;
    var maxR;
    if (item.kind === "rad") {
      minR = 168;
      maxR = R - 16;
    } else if (item.kind === "deg") {
      minR = R + 22;
      maxR = R + 96;
    } else {
      minR = R + 110;
      maxR = R + 460;
    }
    if (radius < minR) setPolar(item, minR);
    else if (radius > maxR) setPolar(item, maxR);
  }

  function separate(a, b) {
    var rank = { rad: 1, deg: 2, coord: 3, fixed: 0 };
    var step = 0.012;
    if (a.locked && b.locked) return;
    if (a.locked) {
      setPolar(b, radiusOf(b) + (b.kind === "rad" ? -4 : 6));
      return;
    }
    if (b.locked) {
      setPolar(a, radiusOf(a) + (a.kind === "rad" ? -4 : 6));
      return;
    }
    if (rank[a.kind] !== rank[b.kind]) {
      var outer = rank[a.kind] > rank[b.kind] ? a : b;
      setPolar(outer, radiusOf(outer) + 6);
      return;
    }
    var d = angOf(b) - angOf(a);
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    var sign = d >= 0 ? 1 : -1;
    if (Math.abs(d) < 1e-4) sign = 1;
    rotate(a, -sign * step);
    rotate(b, sign * step);
    if (a.kind === "coord") {
      setPolar(a, radiusOf(a) + 2);
      setPolar(b, radiusOf(b) + 2);
    }
  }

  function resolve(items) {
    var pad = 12;
    var n;
    var i;
    var j;
    for (n = 0; n < 80; n++) {
      var moved = false;
      for (i = 0; i < items.length; i++) {
        for (j = i + 1; j < items.length; j++) {
          if (!hit(items[i], items[j], pad)) continue;
          separate(items[i], items[j]);
          clampZone(items[i]);
          clampZone(items[j]);
          moved = true;
        }
      }
      if (!moved) return n;
    }
    return 80;
  }

  function cornerRadii(item) {
    var xs = [item.x - item.w / 2, item.x + item.w / 2];
    var ys = [item.y - item.h / 2, item.y + item.h / 2];
    var min = Infinity;
    var max = 0;
    xs.forEach(function (x) {
      ys.forEach(function (y) {
        var d = Math.hypot(x, y);
        if (d < min) min = d;
        if (d > max) max = d;
      });
    });
    return { min: min, max: max };
  }

  function clearRing(items) {
    items.forEach(function (item) {
      if (item.locked) return;
      var guard = 10;
      var i;
      for (i = 0; i < 12; i++) {
        var c = cornerRadii(item);
        if (item.kind === "rad" && c.max > R - guard) setPolar(item, radiusOf(item) - 4);
        else if (item.kind !== "rad" && c.min < R + guard) setPolar(item, radiusOf(item) + 4);
        else break;
      }
    });
  }

  function axisNudge(deg, kind, point, h) {
    if (family(deg) !== "axis" || kind === "rad") return point;
    var shift = h * 0.62 + 6;
    if (deg === 0 || deg === 180) point.y -= shift;
    return point;
  }

  function speakCode(code) {
    if (code === "undef") return "undefined";
    var sign = "";
    var body = code;
    if (body.charAt(0) === "-") {
      sign = "negative ";
      body = body.slice(1);
    }
    var words = {
      "0": "0",
      "1": "1",
      "1/2": "1 over 2",
      "√2/2": "square root of 2 over 2",
      "√3/2": "square root of 3 over 2",
      "√3/3": "square root of 3 over 3",
      "√3": "square root of 3"
    };
    return sign + (words[body] || body);
  }

  function speakRad(angle) {
    var n = angle.radNum;
    var d = angle.radDen;
    if (n === 0) return "0 radians";
    if (n === 1 && d === 1) return "pi radians";
    if (d === 1) return n + " pi radians";
    if (n === 1) return "pi over " + d;
    return n + " pi over " + d;
  }

  function quadItems() {
    return QUADS.map(function (quad) {
      var p = polar(quad.deg, 124, 0);
      return {
        kind: "fixed",
        locked: true,
        deg: quad.deg,
        x: p.x,
        y: p.y,
        w: quad.roman.length > 2 ? 46 : quad.roman.length > 1 ? 36 : 28,
        h: 46
      };
    });
  }

  function computeLayout(angles, math) {
    var items = [];
    angles.forEach(function (angle) {
      var boxes = {
        rad: math.groupRad(angle.radNum, angle.radDen, SIZE.rad),
        deg: math.groupDeg(angle.deg, SIZE.deg),
        coord: math.groupPoint(angle.cos, angle.sin, SIZE.coord)
      };
      ["rad", "deg", "coord"].forEach(function (kind) {
        var box = boxes[kind];
        var fam = family(angle.deg);
        var radius = RING.rad;
        var tangent = kind === "rad" ? TANGENT : 0;
        if (kind === "deg") radius = RING.deg;
        if (kind === "coord") {
          radius = fam === "axis" ? RING.coordAxis : fam === "diag" ? RING.coordDiag : RING.coordOff;
        }
        var point = polar(angle.deg, radius, tangent);
        point = axisNudge(angle.deg, kind, point, box.h);
        items.push({
          kind: kind,
          locked: false,
          deg: angle.deg,
          angle: angle,
          x: point.x,
          y: point.y,
          w: box.w,
          h: box.h,
          markup: box.markup
        });
      });
    });
    var locked = quadItems();
    var all = items.concat(locked);
    resolve(all);
    clearRing(items);
    resolve(all);
    clearRing(items);
    return {
      R: R,
      items: items,
      quads: QUADS
    };
  }

  function overlaps(items, pad) {
    var found = [];
    var gap = pad == null ? 0 : pad;
    var i;
    var j;
    for (i = 0; i < items.length; i++) {
      for (j = i + 1; j < items.length; j++) {
        if (hit(items[i], items[j], gap)) {
          found.push([items[i], items[j]]);
        }
      }
    }
    return found;
  }

  function xy(deg, radius) {
    var a = deg * Math.PI / 180;
    return [Math.cos(a) * radius, -Math.sin(a) * radius];
  }

  function arcPath(radius, deg) {
    var end = xy(deg, radius);
    return "M " + round(radius) + " 0 A " + round(radius) + " " + round(radius) + " 0 0 0 " + round(end[0]) + " " + round(end[1]);
  }

  function trianglePath(deg) {
    var tip = xy(deg, R);
    var foot = [tip[0], 0];
    return "M 0 0 L " + round(foot[0]) + " 0 L " + round(tip[0]) + " " + round(tip[1]) + " Z";
  }

  function squarePath(deg) {
    var tip = xy(deg, R);
    var s = 16;
    var x = tip[0];
    var dir = x >= 0 ? -1 : 1;
    return "M " + round(x) + " 0 L " + round(x + dir * s) + " 0 L " + round(x + dir * s) + " " + round(-s) + " L " + round(x) + " " + round(-s) + " Z";
  }

  function arrow(tipX, tipY, deg) {
    var a = deg * Math.PI / 180;
    var len = 13;
    var hw = 5.5;
    var ux = Math.cos(a);
    var uy = -Math.sin(a);
    var px = Math.sin(a);
    var py = Math.cos(a);
    var bx = tipX - ux * len;
    var by = tipY - uy * len;
    return "M " + round(tipX) + " " + round(tipY) +
      " L " + round(bx + px * hw) + " " + round(by + py * hw) +
      " L " + round(bx - px * hw) + " " + round(by - py * hw) + " Z";
  }

  function labelAria(item) {
    var angle = item.angle;
    if (item.kind === "deg") return angle.deg + " degrees";
    if (item.kind === "rad") return speakRad(angle);
    return "cosine " + speakCode(angle.cos) + ", sine " + speakCode(angle.sin);
  }

  function geomMarkup(items) {
    var parts = [];
    parts.push('<g class="tris" aria-hidden="true">');
    [30, 60, 45].forEach(function (deg) {
      parts.push('<path class="tri tri-' + deg + '" d="' + trianglePath(deg) + '"></path>');
    });
    [30, 45, 60].forEach(function (deg) {
      var tip = xy(deg, R);
      parts.push('<line class="tri-leg" x1="' + round(tip[0]) + '" y1="0" x2="' + round(tip[0]) + '" y2="' + round(tip[1]) + '"></line>');
      parts.push('<path class="tri-square" d="' + squarePath(deg) + '"></path>');
    });
    parts.push('<path class="arc arc-30" d="' + arcPath(48, 30) + '"></path>');
    parts.push('<path class="arc arc-45" d="' + arcPath(66, 45) + '"></path>');
    parts.push('<path class="arc arc-60" d="' + arcPath(84, 60) + '"></path>');
    parts.push("</g>");

    parts.push('<g class="axes" aria-hidden="true">');
    parts.push('<line class="axis" x1="' + round(-R - 6) + '" y1="0" x2="' + round(R + 4) + '" y2="0"></line>');
    parts.push('<line class="axis" x1="0" y1="' + round(R + 6) + '" x2="0" y2="' + round(-R - 4) + '"></line>');
    parts.push('<path class="arrow" d="' + arrow(R + 18, 0, 0) + '"></path>');
    parts.push('<path class="arrow" d="' + arrow(0, -(R + 18), 90) + '"></path>');
    parts.push("</g>");

    parts.push('<g class="spokes" aria-hidden="true">');
    items.forEach(function (item) {
      if (item.kind !== "deg") return;
      if (family(item.deg) === "axis") return;
      var tip = xy(item.deg, R);
      parts.push('<line class="spoke" x1="0" y1="0" x2="' + round(tip[0]) + '" y2="' + round(tip[1]) + '"></line>');
    });
    parts.push("</g>");

    parts.push('<circle class="ring" cx="0" cy="0" r="' + R + '"></circle>');
    parts.push('<circle class="origin" cx="0" cy="0" r="3.5"></circle>');

    parts.push('<g class="dots" aria-hidden="true">');
    items.forEach(function (item) {
      if (item.kind !== "deg") return;
      var tip = xy(item.deg, R);
      parts.push('<circle class="dot" data-deg="' + item.deg + '" cx="' + round(tip[0]) + '" cy="' + round(tip[1]) + '" r="4.5"><title>' +
        item.deg + "° · " + speakRad(item.angle).replace(" radians", "") + " · (" + item.angle.cos + ", " + item.angle.sin + ")</title></circle>");
    });
    parts.push("</g>");

    parts.push('<g class="quads">');
    QUADS.forEach(function (quad) {
      var p = polar(quad.deg, 124, 0);
      parts.push('<g class="quad" transform="translate(' + round(p.x) + "," + round(p.y) + ')" aria-label="Quadrant ' + quad.roman + ", " + quad.name + '">');
      parts.push('<rect class="knock" x="-20" y="-22" width="40" height="44" rx="2"></rect>');
      parts.push('<text class="q-roman" text-anchor="middle" x="0" y="-2">' + quad.roman + "</text>");
      parts.push('<text class="q-astc" text-anchor="middle" x="0" y="16">' + quad.astc + "</text>");
      parts.push("</g>");
    });
    parts.push("</g>");
    return parts.join("");
  }

  function labelMarkup(item) {
    var angle = item.angle;
    var attrs = 'class="lbl lbl-' + item.kind + '" data-kind="' + item.kind + '" data-deg="' + angle.deg + '"';
    if (item.kind === "coord") {
      attrs += ' data-cos="' + esc(angle.cos) + '" data-sin="' + esc(angle.sin) + '" data-tan="' + esc(angle.tan) + '"';
    }
    if (item.kind === "rad") attrs += ' data-rad-num="' + angle.radNum + '" data-rad-den="' + angle.radDen + '"';
    var tx = item.x - item.w / 2;
    var ty = item.y - item.h / 2;
    return '<g ' + attrs + ' role="img" aria-label="' + esc(labelAria(item)) + '" transform="translate(' + round(tx) + "," + round(ty) + ')">' +
      '<rect class="knock" x="-5" y="-4" width="' + round(item.w + 10) + '" height="' + round(item.h + 8) + '" rx="2"></rect>' +
      item.markup + "</g>";
  }

  function boundsOf(items) {
    var minX = -R - 28;
    var minY = -R - 28;
    var maxX = R + 28;
    var maxY = R + 28;
    items.forEach(function (item) {
      minX = Math.min(minX, item.x - item.w / 2 - 8);
      minY = Math.min(minY, item.y - item.h / 2 - 8);
      maxX = Math.max(maxX, item.x + item.w / 2 + 8);
      maxY = Math.max(maxY, item.y + item.h / 2 + 8);
    });
    var pad = 18;
    return {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2
    };
  }

  function tableRows(angles, math) {
    return angles.map(function (angle) {
      return "<tr data-deg=\"" + angle.deg + "\">" +
        "<td data-label=\"Degrees\">" + math.htmlDeg(angle.deg, 18) + "</td>" +
        "<td data-label=\"Radians\">" + math.htmlRad(angle.radNum, angle.radDen, 18) + "</td>" +
        "<td data-label=\"(cos, sin)\">" + math.htmlPoint(angle.cos, angle.sin, 18) + "</td>" +
        "<td data-label=\"tan\">" + math.htmlValue(angle.tan, 18) + "</td>" +
        "</tr>";
    }).join("");
  }

  function renderChart(host, listHost, angles, math) {
    var layout = computeLayout(angles, math);
    var box = boundsOf(layout.items);
    var svg = '<svg class="uc-svg" role="img" aria-labelledby="uc-title uc-desc" viewBox="' +
      round(box.x) + " " + round(box.y) + " " + round(box.w) + " " + round(box.h) + '">' +
      '<title id="uc-title">Standard unit circle</title>' +
      '<desc id="uc-desc">Sixteen standard angles. Radian measure sits inside the circle, degrees sit just outside each spoke, and exact cosine and sine coordinates sit further out.</desc>' +
      geomMarkup(layout.items) +
      '<g class="labels">' + layout.items.map(labelMarkup).join("") + "</g></svg>";
    host.innerHTML = svg;
    if (listHost) {
      var body = listHost.querySelector("tbody");
      if (body) body.innerHTML = tableRows(angles, math);
    }
    applyLayers(host);
    return layout;
  }

  var LAYERS = ["deg", "rad", "coord"];
  var STORE = "sp-uc-chart-layers";

  function readLayers() {
    var state = { deg: true, rad: true, coord: true };
    try {
      var raw = sessionStorage.getItem(STORE);
      if (!raw) return state;
      var data = JSON.parse(raw);
      LAYERS.forEach(function (key) {
        if (data && typeof data[key] === "boolean") state[key] = data[key];
      });
    } catch (e) {}
    return state;
  }

  function writeLayers(state) {
    try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  function applyLayers(host) {
    var svg = host.querySelector(".uc-svg");
    if (!svg) return;
    var state = readLayers();
    LAYERS.forEach(function (key) {
      svg.classList.toggle("hide-" + key, !state[key]);
      var button = document.querySelector('[data-layer="' + key + '"]');
      if (button) button.setAttribute("aria-pressed", state[key] ? "true" : "false");
    });
  }

  function wireToggles(host) {
    var bar = document.getElementById("uc-toggles");
    if (!bar || bar.getAttribute("data-wired") === "1") return;
    bar.setAttribute("data-wired", "1");
    [].slice.call(bar.querySelectorAll("[data-layer]")).forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-layer");
        var state = readLayers();
        state[key] = !state[key];
        writeLayers(state);
        applyLayers(host);
      });
    });
  }

  function wireHelp() {
    var button = document.getElementById("help");
    var tip = document.getElementById("help-tip");
    if (!button || !tip || button.getAttribute("data-wired") === "1") return;
    button.setAttribute("data-wired", "1");
    function setOpen(open) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
      tip.classList.toggle("is-open", open);
    }
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("click", function (event) {
      if (button.contains(event.target) || tip.contains(event.target)) return;
      setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    });
  }

  function wireSheet() {
    var sheet = document.getElementById("value-sheet");
    if (!sheet) return;
    var mq = window.matchMedia("(max-width: 800px)");
    function sync() {
      if (mq.matches) sheet.setAttribute("open", "");
    }
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync);
    window.addEventListener("beforeprint", function () { sheet.setAttribute("open", ""); });
  }

  function boot() {
    var host = document.getElementById("uc-chart");
    var list = document.getElementById("value-table");
    var g = typeof globalThis !== "undefined" ? globalThis : window;
    if (!host || !g.ExactMath || !g.UnitCircle) return;
    var math = g.ExactMath;
    var angles = g.UnitCircle.ANGLES;

    function draw() {
      try {
        var family = getComputedStyle(document.body).fontFamily;
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        math.setMeasure(function (text, size) {
          ctx.font = "400 " + size + "px " + family;
          return Math.max(ctx.measureText(text).width, size * 0.45);
        });
      } catch (e) {}
      renderChart(host, list, angles, math);
    }

    wireToggles(host);
    wireHelp();
    wireSheet();
    draw();
    var refreshQuiz = function () {};
    var qtext = document.getElementById("qtext");
    if (qtext && !qtext.getAttribute("data-wired")) {
      qtext.setAttribute("data-wired", "1");
      refreshQuiz = wireQuiz(math);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(function () {
        draw();
        refreshQuiz();
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-font"]
      });
    }
  }

  function optionHtml(math, text) {
    var code = String(text).replace(/−/g, "-");
    if (/^-?(?:√?(?:\d+\/\d+|\d+)|(?:\d+\/\d+))$/.test(code)) return math.htmlValue(code, 16);
    return esc(text);
  }

  function wireQuiz(math) {
    var questions = [
      { q: "In a right triangle, SOH means sin θ equals…", opts: ["opposite / hypotenuse", "adjacent / hypotenuse", "opposite / adjacent", "hypotenuse / opposite"], a: 0 },
      { q: "On the unit circle, cos θ is the…", opts: ["x-coordinate of the point", "y-coordinate of the point", "slope of the radius", "arc length"], a: 0 },
      { q: "sin²θ + cos²θ equals…", opts: ["0", "1", "tan θ", "θ"], a: 1 },
      { q: "tan θ is undefined when…", opts: ["sin θ = 0", "cos θ = 0", "θ = 45°", "θ = 0°"], a: 1 },
      { q: "sin(90°) equals…", opts: ["0", "1", "√2/2", "1/2"], a: 1 },
      { q: "cos(60°) equals…", opts: ["√3/2", "1/2", "0", "1"], a: 1 },
      { q: "CAH means cos θ equals…", opts: ["adjacent / hypotenuse", "opposite / hypotenuse", "opposite / adjacent", "hypotenuse / adjacent"], a: 0 }
    ];
    var qi = 0;
    function showQ() {
      var Q = questions[qi % questions.length];
      document.getElementById("qtext").textContent = Q.q;
      document.getElementById("qfb").textContent = "";
      var opts = document.getElementById("qopts");
      opts.innerHTML = "";
      Q.opts.forEach(function (t, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = optionHtml(math, t);
        b.addEventListener("click", function () {
          document.getElementById("qfb").textContent = i === Q.a ? "Correct." : "Not quite — try again or next.";
        });
        opts.appendChild(b);
      });
    }
    document.getElementById("qnext").addEventListener("click", function () { qi++; showQ(); });
    showQ();
    return showQ;
  }

  return {
    R: R,
    RING: RING,
    computeLayout: computeLayout,
    overlaps: overlaps,
    cornerRadii: cornerRadii,
    boot: boot,
    renderChart: renderChart
  };
});
