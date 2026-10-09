/*! Original stylized ASL hand diagrams. Not traced from photos or video. */
(function (global) {
  "use strict";

  var seq = 0;

  function uid(prefix) {
    seq += 1;
    return prefix + seq;
  }

  function rr(x, y, w, h, r) {
    r = Math.min(r == null ? 8 : r, Math.abs(w) / 2, Math.abs(h) / 2);
    var x2 = x + w;
    var y2 = y + h;
    return (
      "M" + (x + r) + " " + y +
      "H" + (x2 - r) +
      "A" + r + " " + r + " 0 0 1 " + x2 + " " + (y + r) +
      "V" + (y2 - r) +
      "A" + r + " " + r + " 0 0 1 " + (x2 - r) + " " + y2 +
      "H" + (x + r) +
      "A" + r + " " + r + " 0 0 1 " + x + " " + (y2 - r) +
      "V" + (y + r) +
      "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y +
      "Z"
    );
  }

  /* Palm center is the origin. Fingers point up (negative y).
     Viewer faces a signer's right palm: thumb is on the right. */
  var SLOT = { pinky: -33, ring: -11, middle: 11, index: 33 };
  var FW = 16;

  function nail(cx, cy, rx) {
    return '<ellipse class="nail" cx="' + cx + '" cy="' + cy + '" rx="' + (rx || 4) + '" ry="5"/>';
  }

  function finger(cx, len, angle, w) {
    w = w || FW;
    len = len || 76;
    var base = -4;
    var x = cx - w / 2;
    var y = base - len;
    var rot = angle ? ' transform="rotate(' + angle + " " + cx + " " + base + ')"' : "";
    return (
      "<g" + rot + '><path class="skin finger" d="' + rr(x, y, w, len + 8, w / 2) + '"/>' +
      nail(cx, y + 11, w * 0.26) + "</g>"
    );
  }

  function knuckles(n, x0) {
    var i, out = "";
    var start = x0 == null ? -36 : x0;
    for (i = 0; i < n; i++) {
      out += '<path class="skin finger" d="' + rr(start + i * 18, -18, 16, 28, 8) + '"/>';
    }
    return out;
  }

  function palm(back) {
    var body = '<path class="skin ' + (back ? "back" : "palm") + '" d="' + rr(-24, 48, 48, 40, 12) + '"/>';
    body += '<path class="skin ' + (back ? "back" : "palm") + '" d="' + rr(-48, -6, 96, 68, 24) + '"/>';
    if (back) {
      body += '<g class="crease">';
      [-28, -8, 12, 30].forEach(function (x) {
        body += '<ellipse cx="' + x + '" cy="8" rx="5" ry="3.2"/>';
      });
      body += "</g>";
    } else {
      body += '<path class="crease" d="M-22 16 Q0 26 22 16"/>';
      body += '<path class="crease" d="M-14 30 Q2 38 20 30"/>';
    }
    return body;
  }

  function thumbUp() {
    return '<path class="skin thumb" d="' + rr(34, -46, 20, 64, 10) + '"/>' + nail(44, -34, 4.5);
  }

  function thumbAcross(y, len) {
    y = y == null ? 2 : y;
    len = len == null ? 62 : len;
    return '<path class="skin thumb" d="' + rr(-8, y, len, 16, 8) + '"/>' + nail(-8 + len - 10, y + 8, 4);
  }

  function thumbOut(angle) {
    angle = angle == null ? -36 : angle;
    return (
      '<g transform="rotate(' + angle + ' 36 22)">' +
      '<path class="skin thumb" d="' + rr(24, 8, 58, 16, 8) + '"/>' +
      nail(74, 16, 4) + "</g>"
    );
  }

  function thumbTo(x, y) {
    return (
      '<path class="skin thumb" d="M38 28 C52 24, ' + (x + 16) + " " + (y + 28) + ", " + x + " " + y +
      " C" + (x - 8) + " " + (y + 8) + ", 28 40, 38 28 Z\"/>" +
      '<circle class="join" cx="' + x + '" cy="' + y + '" r="7"/>'
    );
  }

  function fist() {
    return palm(false) + knuckles(4, -36);
  }

  function spread(names, angles) {
    var out = "";
    names.forEach(function (name, i) {
      out += finger(SLOT[name], 78, angles[i]);
    });
    return out;
  }

  function touchPose(which) {
    var order = ["pinky", "ring", "middle", "index"];
    var out = palm(false);
    order.forEach(function (name) {
      if (name === which) {
        out += finger(SLOT[name], 36, 0, 15);
      } else {
        out += finger(SLOT[name], 78, 0);
      }
    });
    out += thumbTo(SLOT[which], -28);
    return out;
  }

  function poseK() {
    return (
      palm(false) +
      knuckles(2, -36) +
      finger(SLOT.middle, 70, 18) +
      finger(SLOT.index, 82, -6) +
      '<path class="skin thumb" d="M28 20 C40 8, 22 -8, 16 -20 C10 -8, 18 16, 28 20 Z"/>'
    );
  }

  function poseG() {
    return (
      '<path class="skin palm" d="' + rr(8, -24, 52, 50, 16) + '"/>' +
      '<path class="skin finger" d="' + rr(-78, -30, 92, 16, 8) + '"/>' +
      nail(-70, -22, 4) +
      '<path class="skin thumb" d="' + rr(-70, -6, 78, 14, 7) + '"/>' +
      nail(-62, 1, 3.5)
    );
  }

  function poseH() {
    return (
      '<path class="skin palm" d="' + rr(8, -16, 52, 48, 16) + '"/>' +
      '<path class="skin finger" d="' + rr(-82, -34, 96, 14, 7) + '"/>' +
      '<path class="skin finger" d="' + rr(-82, -16, 96, 14, 7) + '"/>' +
      nail(-74, -27, 3.5) +
      nail(-74, -9, 3.5) +
      '<path class="skin thumb" d="' + rr(18, 10, 28, 14, 7) + '"/>'
    );
  }

  function poseC(closed) {
    var fingers = closed
      ? "M-40 0 C-46 -58 -4 -86 30 -58 C36 -46 16 -28 -2 -16 C-18 -8 -30 -2 -40 0 Z"
      : "M-42 2 C-50 -52 -8 -84 26 -62 C18 -40 0 -22 -16 -8 C-28 -2 -36 0 -42 2 Z";
    var thumb = closed
      ? "M18 -8 C42 -18 54 16 36 36 C22 48 4 28 8 10 C10 0 12 -4 18 -8 Z"
      : "M34 16 C58 10 70 36 60 54 C50 66 32 52 30 36 C28 24 26 18 34 16 Z";
    return palm(false) + '<path class="skin finger" d="' + fingers + '"/><path class="skin thumb" d="' + thumb + '"/>';
  }

  function poseE() {
    return (
      palm(false) +
      thumbAcross(8, 58) +
      '<path class="skin finger" d="M-40 -4 C-44 -36 -20 -28 -16 6 Z"/>' +
      '<path class="skin finger" d="M-18 -4 C-16 -40 4 -30 6 6 Z"/>' +
      '<path class="skin finger" d="M4 -4 C8 -40 26 -30 24 6 Z"/>' +
      '<path class="skin finger" d="M24 -2 C30 -34 46 -24 40 8 Z"/>'
    );
  }

  function poseD() {
    return (
      palm(false) +
      '<path class="skin finger" d="M-30 8 C-36 -20 -8 -36 8 -8 C16 6 4 18 -10 16 C-24 14 -26 12 -30 8 Z"/>' +
      '<path class="skin thumb" d="M10 16 C28 8 32 -8 16 -16 C6 -8 4 10 10 16 Z"/>' +
      finger(SLOT.index, 84, 0)
    );
  }

  function poseR() {
    return (
      palm(false) +
      knuckles(2, -36) +
      thumbAcross(18, 40) +
      finger(8, 78, 8) +
      finger(22, 78, -16)
    );
  }

  function poseX() {
    return (
      fist() +
      thumbAcross(16, 36) +
      '<path class="skin finger" d="M24 -8 C22 -48 34 -62 40 -40 C44 -24 36 -6 30 2 C26 -2 25 -4 24 -8 Z"/>'
    );
  }

  function poseY() {
    return (
      palm(false) +
      knuckles(2, -14) +
      finger(SLOT.pinky, 70, -28) +
      thumbOut(-18)
    );
  }

  function poseFlatO() {
    return (
      palm(false) +
      '<path class="skin finger" d="M-28 -2 C-34 -40 28 -44 30 -4 C22 8 -20 8 -28 -2 Z"/>' +
      '<path class="skin thumb" d="M22 8 C36 0 34 -18 18 -16 C12 -8 14 6 22 8 Z"/>' +
      '<ellipse class="join" cx="2" cy="-22" rx="8" ry="6"/>'
    );
  }

  function poseClaw() {
    var names = ["pinky", "ring", "middle", "index"];
    var angles = [-20, -6, 8, 20];
    var out = palm(false);
    names.forEach(function (name, i) {
      var cx = SLOT[name];
      out += '<g transform="rotate(' + angles[i] + " " + cx + ' -4)">';
      out += '<path class="skin finger" d="' + rr(cx - 8, -40, 16, 40, 8) + '"/>';
      out += '<path class="skin finger" d="M' + (cx - 7) + " -40 C" + (cx - 16) + " -62 " + (cx + 10) + " -58 " + (cx + 6) + ' -36 Z"/>';
      out += "</g>";
    });
    out += thumbOut(-50);
    return out;
  }

  function posePinch() {
    return (
      palm(false) +
      knuckles(3, -40) +
      '<path class="skin finger" d="M18 -6 C16 -36 36 -40 34 -12 Z"/>' +
      '<path class="skin thumb" d="M30 16 C48 8 42 -16 28 -18 C20 -10 20 8 30 16 Z"/>' +
      '<circle class="join" cx="30" cy="-16" r="6"/>'
    );
  }

  function poseOpenPinch() {
    return (
      palm(false) +
      knuckles(3, -40) +
      finger(30, 62, -8) +
      thumbOut(-24)
    );
  }

  function poseM(count) {
    var bars = "";
    var i;
    for (i = 0; i < count; i++) {
      bars += '<path class="skin finger" d="' + rr(-40 + i * 4, -22 + i * 10, 70 - i * 2, 14, 7) + '"/>';
    }
    return (
      palm(false) +
      '<path class="skin thumb" d="' + rr(18, -6, 16, 40, 8) + '"/>' +
      bars +
      '<circle class="join" cx="36" cy="' + (count === 3 ? 16 : 4) + '" r="6"/>'
    );
  }

  function poseW() {
    return palm(false) + finger(SLOT.pinky, 28, 0, 14) + thumbAcross(22, 28) + spread(["ring", "middle", "index"], [-14, 0, 16]);
  }

  function pose3() {
    return palm(false) + knuckles(2, -40) + spread(["middle", "index"], [-8, 14]) + thumbOut(-32);
  }

  function pose4() {
    return palm(true) + spread(["pinky", "ring", "middle", "index"], [-18, -6, 6, 18]) + '<path class="skin thumb" d="' + rr(8, 18, 30, 14, 7) + '"/>';
  }

  function pose5() {
    return palm(false) + spread(["pinky", "ring", "middle", "index"], [-24, -8, 8, 24]) + thumbOut(-48);
  }

  function poseB() {
    return (
      palm(false) +
      '<path class="skin finger" d="' + rr(-40, -86, 74, 90, 16) + '"/>' +
      nail(-22, -74, 4) + nail(-4, -76, 4) + nail(14, -76, 4) + nail(28, -72, 4) +
      thumbAcross(6, 52)
    );
  }

  function poseU() {
    return palm(false) + knuckles(2, -40) + thumbAcross(16, 34) + finger(-2, 80, 0, 15) + finger(16, 80, 0, 15);
  }

  function poseV() {
    return palm(false) + knuckles(2, -40) + thumbAcross(18, 32) + spread(["middle", "index"], [-16, 16]);
  }

  function poseOne() {
    return fist() + thumbAcross(14, 34) + finger(SLOT.index, 84, 0);
  }

  function poseI() {
    return fist() + thumbAcross(12, 40) + finger(SLOT.pinky, 72, -8);
  }

  function poseL() {
    return fist() + finger(SLOT.index, 82, 0) + thumbOut(-8);
  }

  function poseF() {
    return touchPose("index");
  }

  function poseCradle() {
    return (
      '<path class="arm" d="M-86 8 Q-16 62 58 -8"/>' +
      '<path class="arm" d="M-64 26 Q-4 78 74 8"/>' +
      '<path class="skin palm" d="' + rr(-78, -8, 22, 22, 10) + '"/>' +
      '<path class="skin palm" d="' + rr(52, -16, 22, 22, 10) + '"/>'
    );
  }

  function poseForearm() {
    return (
      '<path class="skin palm" d="' + rr(-78, -12, 92, 24, 12) + '"/>' +
      '<circle class="skin palm" cx="28" cy="0" r="16"/>'
    );
  }

  var BUILD = {
    a: function () { return fist() + thumbUp(); },
    b: poseB,
    c: function () { return poseC(false); },
    d: poseD,
    e: poseE,
    f: poseF,
    g: poseG,
    h: poseH,
    i: poseI,
    k: poseK,
    l: poseL,
    m: function () { return poseM(3); },
    n: function () { return poseM(2); },
    o: function () { return poseC(true); },
    p: poseK,
    q: poseG,
    r: poseR,
    s: function () { return fist() + thumbAcross(-8, 70); },
    t: function () { return fist() + '<ellipse class="skin thumb" cx="6" cy="-22" rx="8" ry="11"/>'; },
    u: poseU,
    v: poseV,
    w: poseW,
    x: poseX,
    y: poseY,
    one: poseOne,
    three: pose3,
    four: pose4,
    five: pose5,
    six: function () { return touchPose("pinky"); },
    seven: function () { return touchPose("ring"); },
    eight: function () { return touchPose("middle"); },
    flato: poseFlatO,
    claw: poseClaw,
    pinch: posePinch,
    openpinch: poseOpenPinch,
    open2: function () {
      return palm(false) + knuckles(2, -40) + spread(["middle", "index"], [-12, 12]) + thumbOut(-20);
    },
    cradle: poseCradle,
    forearm: poseForearm
  };

  var ROTATE = { p: 168, q: 78 };

  function motionPath(kind, id) {
    var d = "";
    if (kind === "j") d = "M-36 -78 L-36 18 Q-36 58 -78 48";
    else if (kind === "z") d = "M78 -96 H138 L78 -48 H138";
    else if (kind === "twist") d = "M46 62 A28 28 0 1 1 18 78";
    else if (kind === "bounce") d = "M48 -96 l10 -16 M64 -90 l10 -16";
    else if (kind === "wiggle") d = "M-20 -100 q16 -14 8 -28 M20 -100 q-16 -14 -8 -28";
    else if (kind === "out") d = "M70 -20 H128";
    else if (kind === "up") d = "M0 -96 V-132";
    else if (kind === "down") d = "M0 20 V70";
    else if (kind === "side") d = "M-70 -40 H-118 M78 -40 H126";
    else if (kind === "circle") d = "M-20 -20 A36 28 0 1 1 18 8";
    else if (kind === "forward") d = "M20 -10 Q70 -40 96 -8";
    else if (kind === "back") d = "M10 -10 Q-20 -40 -70 -6";
    else if (kind === "rock") d = "M-40 40 Q0 8 40 40";
    else if (kind === "nod") d = "M52 -70 V-40 M70 -64 V-34";
    else if (kind === "tap") d = "M-36 -10 L28 24";
    else return "";
    var head = kind === "bounce" || kind === "side" || kind === "wiggle" ? "" : ' marker-end="url(#' + id + ')"';
    var extra = "";
    if (kind === "bounce" || kind === "nod") {
      var a1 = kind === "nod" ? "M46 -78 V-48" : "M48 -96 l10 -16";
      var a2 = kind === "nod" ? "M68 -70 V-40" : "M66 -88 l10 -16";
      return '<path class="motion" d="' + a1 + '" marker-end="url(#' + id + ')"/>' +
        '<path class="motion" d="' + a2 + '" marker-end="url(#' + id + ')"/>';
    }
    if (kind === "wiggle") {
      return '<path class="motion" d="M-8 -104 q18 -16 6 -30" marker-end="url(#' + id + ')"/>' +
        '<path class="motion" d="M22 -104 q-18 -16 -6 -30" marker-end="url(#' + id + ')"/>';
    }
    if (kind === "side") {
      return '<path class="motion" d="M-55 -36 H-110" marker-end="url(#' + id + ')"/>' +
        '<path class="motion" d="M55 -36 H110" marker-end="url(#' + id + ')"/>';
    }
    return '<path class="motion" d="' + d + '"' + head + "/>";
  }

  function marker(id) {
    return (
      "<defs><marker id=\"" + id + "\" viewBox=\"0 0 10 10\" refX=\"8\" refY=\"5\" markerWidth=\"7\" markerHeight=\"7\" orient=\"auto-start-reverse\">" +
      '<path class="arrow-head" d="M0 0 L10 5 L0 10 Z"/></marker></defs>'
    );
  }

  function handMarkup(pose) {
    var build = BUILD[pose];
    if (!build) return "";
    var rot = ROTATE[pose] || 0;
    var inner = build();
    if (rot) inner = '<g transform="rotate(' + rot + ')">' + inner + "</g>";
    return '<g class="hand" data-pose="' + pose + '">' + inner + "</g>";
  }

  function locator(where) {
    if (!where || where === "neutral") return "";
    var dots = {
      forehead: [0, -16],
      temple: [20, -8],
      ear: [32, 2],
      cheek: [18, 16],
      mouth: [0, 20],
      chin: [6, 34],
      chest: [0, 102],
      wrist: [34, 78]
    };
    var pt = dots[where];
    if (!pt) return "";
    return (
      '<g class="locator" transform="translate(168,-20) scale(0.72)">' +
      '<circle class="body-line" cx="0" cy="0" r="28"/>' +
      '<path class="body-line" d="M0 28 V48"/>' +
      '<path class="body-line" d="M-46 62 C-10 48 10 48 46 62"/>' +
      '<path class="body-line" d="M-28 60 V150 Q-28 176 0 176 Q28 176 28 150 V60"/>' +
      '<circle class="where" cx="' + pt[0] + '" cy="' + pt[1] + '" r="7"/>' +
      "</g>"
    );
  }

  function frameBlock(frame, index, ox) {
    var cap = frame.caption ? '<text class="frame-num" x="' + ox + '" y="128" text-anchor="middle">' + escapeText(frame.caption) + "</text>" : "";
    var rot = frame.rotate || 0;
    return '<g transform="translate(' + ox + " -10) rotate(" + rot + ')">' + handMarkup(frame.pose) + "</g>" + cap;
  }

  function drawOne(spec) {
    var id = uid("ah");
    var pose = spec.pose;
    var motion = spec.motion ? motionPath(spec.motion, id) : "";
    var loc = locator(spec.where);
    var vb = loc ? "-150 -160 390 320" : "-150 -160 300 320";
    return {
      vb: vb,
      body: marker(id) + '<g class="figure">' + handMarkup(pose) + motion + loc + "</g>"
    };
  }

  function drawFrames(spec) {
    var id = uid("ah");
    var frames = spec.frames || [];
    var gap = 210;
    var parts = frames.map(function (frame, i) {
      return frameBlock(frame, i, (i - (frames.length - 1) / 2) * gap);
    }).join("");
    var motion = spec.motion ? motionPath(spec.motion, id) : "";
    var loc = locator(spec.where);
    var width = Math.max(300, frames.length * gap + 40) + (loc ? 80 : 0);
    return {
      vb: (-width / 2) + " -170 " + (width + (loc ? 80 : 0)) + " 340",
      body: marker(id) + parts + motion + loc
    };
  }

  function drawPair(spec) {
    var id = uid("ah");
    var parts = (spec.pair || []).map(function (actor) {
      var sc = actor.scale || 0.82;
      var rot = actor.rotate || 0;
      return '<g transform="translate(' + actor.x + " " + actor.y + ") scale(" + sc + ") rotate(" + rot + ')">' +
        handMarkup(actor.pose) + "</g>";
    }).join("");
    var arrows = (spec.arrows || []).map(function (a) {
      return '<path class="motion" d="' + a.d + '" marker-end="url(#' + id + ')"/>';
    }).join("");
    if (spec.motion) arrows += motionPath(spec.motion, id);
    var loc = locator(spec.where);
    var vb = loc ? "-180 -170 430 340" : "-180 -170 360 340";
    return { vb: vb, body: marker(id) + parts + arrows + loc };
  }

  function renderSpec(spec) {
    if (!spec) return { vb: "0 0 10 10", body: "" };
    if (spec.frames && spec.frames.length) return drawFrames(spec);
    if (spec.pair && spec.pair.length) return drawPair(spec);
    return drawOne(spec);
  }

  function supports(spec) {
    if (!spec) return false;
    if (spec.frames) {
      return spec.frames.every(function (f) { return !!BUILD[f.pose]; });
    }
    if (spec.pair) {
      return spec.pair.every(function (a) { return !!BUILD[a.pose]; });
    }
    return !!BUILD[spec.pose];
  }

  function svg(spec, opts) {
    opts = opts || {};
    var drawn = renderSpec(spec);
    var titleId = uid("ttl");
    var descId = uid("dsc");
    var title = opts.title || "Handshape diagram";
    var desc = opts.desc || "Simplified original drawing of a handshape.";
    var cls = "asl-svg" + (opts.mini ? " is-mini" : "") + (opts.className ? " " + opts.className : "");
    return (
      '<svg class="' + cls + '" viewBox="' + drawn.vb + '" role="img" aria-labelledby="' + titleId + " " + descId + '">' +
      "<title id=\"" + titleId + "\">" + escapeText(title) + "</title>" +
      "<desc id=\"" + descId + "\">" + escapeText(desc) + "</desc>" +
      drawn.body +
      "</svg>"
    );
  }

  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  global.ASLHands = {
    svg: svg,
    supports: supports,
    poses: function () { return Object.keys(BUILD); }
  };
})(window);
