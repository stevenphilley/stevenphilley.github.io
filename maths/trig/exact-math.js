/* Exact unit-circle glyphs: stacked fractions and radicals with a vinculum.
   Shared by the study chart and the trainer. No external math library.
   Browser: window.ExactMath. Node: require("./exact-math.js"). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ExactMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var customMeasure = null;

  function round(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* Generous widths so a vinculum still covers the radicand if the live
     font is a hair wider than the canvas measurement. */
  function estimate(text, size) {
    var w = 0;
    var i;
    for (i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      var u = 0.62;
      if (c >= "0" && c <= "9") u = 0.62;
      else if (c === "π") u = 0.92;
      else if (c === "°") u = 0.62;
      else if (c === "−" || c === "-") u = 0.7;
      else if (c === ",") u = 0.34;
      else if (c === "(" || c === ")") u = 0.4;
      else if (c === " ") u = 0.34;
      else if (c === "i" || c === "l") u = 0.32;
      else if (c === "m" || c === "w") u = 0.9;
      w += u;
    }
    return w * size;
  }

  function browserMeasure() {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    return function (text, size) {
      var family = "Helvetica, Arial, sans-serif";
      try {
        family = getComputedStyle(document.body).fontFamily || family;
      } catch (e) {}
      ctx.font = "400 " + size + "px " + family;
      var measured = ctx.measureText(text).width;
      return Math.max(measured, estimate(text, size) * 0.92);
    };
  }

  function measureWidth(text, size) {
    if (customMeasure) return customMeasure(text, size);
    if (typeof document !== "undefined") {
      customMeasure = browserMeasure();
      return customMeasure(text, size);
    }
    return estimate(text, size);
  }

  function setMeasure(fn) {
    customMeasure = fn;
  }

  function textBox(str, size) {
    var w = Math.max(measureWidth(str, size), size * 0.28);
    var ascent = size * 0.78;
    var descent = size * 0.24;
    return {
      w: w,
      h: ascent + descent,
      draw: function (x, yTop) {
        return '<text x="' + round(x) + '" y="' + round(yTop + ascent) + '" font-size="' + round(size) + '">' + esc(str) + "</text>";
      }
    };
  }

  function radBox(innerText, size) {
    var inner = textBox(innerText, size);
    var sw = Math.max(1.35, size * 0.078);
    var surdW = size * 0.92;
    var gap = size * 0.1;
    var over = size * 0.2;
    var contentLeft = surdW + gap;
    var w = contentLeft + inner.w + over;
    var vinculumY = sw * 0.55;
    var textTop = vinculumY + size * 0.12;
    var h = textTop + inner.h + size * 0.04;
    return {
      w: w,
      h: h,
      draw: function (x, y) {
        var top = y + vinculumY;
        var bot = y + h - Math.max(1, size * 0.06);
        var hookY = y + h * 0.64;
        var x0 = x + size * 0.04;
        var x1 = x + surdW * 0.38;
        var x2 = x + surdW * 0.64;
        var x3 = x + surdW * 0.96;
        var xEnd = x + w - size * 0.02;
        var d = [
          "M", round(x0), round(hookY),
          "L", round(x1), round(hookY),
          "L", round(x2), round(bot),
          "L", round(x3), round(top),
          "L", round(xEnd), round(top)
        ].join(" ");
        return '<path class="surd" d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + round(sw) + '" stroke-linejoin="miter" stroke-linecap="square"/>' +
          inner.draw(x + contentLeft, y + textTop);
      }
    };
  }

  function atomBox(body, size) {
    if (body.charAt(0) === "√") return radBox(body.slice(1), size);
    return textBox(body, size);
  }

  function fracBox(numBox, denBox, size) {
    var padX = size * 0.28;
    var gap = size * 0.2;
    var barW = Math.max(1.25, size * 0.07);
    var w = Math.max(numBox.w, denBox.w) + padX * 2;
    var h = numBox.h + gap + denBox.h;
    return {
      w: w,
      h: h,
      draw: function (x, y) {
        var barY = y + numBox.h + gap * 0.42;
        var numX = x + (w - numBox.w) / 2;
        var denX = x + (w - denBox.w) / 2;
        var denY = barY + barW + size * 0.06;
        return numBox.draw(numX, y) +
          '<line class="bar" x1="' + round(x + size * 0.06) + '" y1="' + round(barY) + '" x2="' + round(x + w - size * 0.06) + '" y2="' + round(barY) + '" stroke="currentColor" stroke-width="' + round(barW) + '"/>' +
          denBox.draw(denX, denY);
      }
    };
  }

  function valueBox(code, size) {
    if (code === "undef") return textBox("undefined", size * 0.78);
    var sign = "";
    var body = code;
    if (body.charAt(0) === "-") {
      sign = "−";
      body = body.slice(1);
    }
    var slash = body.indexOf("/");
    var core;
    if (slash === -1) core = atomBox(body, size);
    else core = fracBox(atomBox(body.slice(0, slash), size * 0.92), atomBox(body.slice(slash + 1), size * 0.92), size);
    if (!sign) return core;
    var minus = textBox(sign, size * 1.05);
    var gap = size * 0.06;
    var w = minus.w + gap + core.w;
    var h = Math.max(minus.h, core.h);
    return {
      w: w,
      h: h,
      draw: function (x, y) {
        return minus.draw(x, y + (h - minus.h) / 2) + core.draw(x + minus.w + gap, y + (h - core.h) / 2);
      }
    };
  }

  function parenMetrics(h, size) {
    var w = Math.max(size * 0.42, Math.min(h * 0.26, size * 0.85));
    var sw = Math.max(1.25, size * 0.07);
    function path(x, y, side) {
      var xOuter = side === "left" ? x + w * 0.9 : x + w * 0.1;
      var xInner = side === "left" ? x + w * 0.12 : x + w * 0.88;
      var y0 = y + sw;
      var y1 = y + h - sw;
      var ym = y + h / 2;
      var d = "M " + round(xOuter) + " " + round(y0) + " Q " + round(xInner) + " " + round(ym) + " " + round(xOuter) + " " + round(y1);
      return '<path class="paren" d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + round(sw) + '" stroke-linecap="round"/>';
    }
    return {
      w: w,
      left: function (x, y) { return path(x, y, "left"); },
      right: function (x, y) { return path(x, y, "right"); }
    };
  }

  function pointBox(cos, sin, size) {
    var c = valueBox(cos, size);
    var s = valueBox(sin, size);
    var comma = textBox(",", size * 0.92);
    var bodyH = Math.max(c.h, s.h);
    var commaTop = Math.max(bodyH * 0.42, bodyH - comma.h * 0.2);
    var h = Math.max(bodyH, commaTop + comma.h);
    var paren = parenMetrics(h, size);
    var gapL = size * 0.08;
    var beforeComma = size * 0.02;
    var afterComma = size * 0.22;
    var w = paren.w + gapL + c.w + beforeComma + comma.w + afterComma + s.w + gapL + paren.w;
    return {
      w: w,
      h: h,
      draw: function (x, y) {
        var cx = x;
        var out = paren.left(cx, y);
        cx += paren.w + gapL;
        out += c.draw(cx, y + (h - c.h) / 2);
        cx += c.w + beforeComma;
        out += comma.draw(cx, y + commaTop);
        cx += comma.w + afterComma;
        out += s.draw(cx, y + (h - s.h) / 2);
        cx += s.w + gapL;
        out += paren.right(cx, y);
        return out;
      }
    };
  }

  function radNodeBox(n, d, size) {
    if (n === 0) return textBox("0", size);
    var numText = n === 1 ? "π" : String(n) + "π";
    if (d === 1) return textBox(numText, size);
    return fracBox(textBox(numText, size * 0.92), textBox(String(d), size * 0.92), size);
  }

  function padBox(box, size) {
    var pad = Math.max(1.5, (size || 16) * 0.06);
    return {
      w: box.w + pad * 2,
      h: box.h + pad * 2,
      markup: box.draw(pad, pad)
    };
  }

  function svgWrap(box, className) {
    return '<svg class="xm ' + className + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + round(box.w) + " " + round(box.h) + '" width="' + round(box.w) + '" height="' + round(box.h) + '" role="presentation" focusable="false" aria-hidden="true"><g class="glyph">' + box.markup + "</g></svg>";
  }

  function valueClass(code) {
    if (!code || code === "undef") return "xm-atom";
    if (code.indexOf("/") !== -1) return "xm-frac";
    if (code.indexOf("√") !== -1) return "xm-rad";
    return "xm-atom";
  }

  function htmlValue(code, size) {
    var px = size || 18;
    if (code === "undef") return '<span class="xm-undef">undefined</span>';
    return svgWrap(padBox(valueBox(code, px), px), valueClass(code));
  }

  function htmlPoint(cos, sin, size) {
    var px = size || 18;
    var flat = cos.indexOf("/") === -1 && sin.indexOf("/") === -1;
    var cls = "xm-point" + (flat ? " xm-flat" : "");
    return svgWrap(padBox(pointBox(cos, sin, px), px), cls);
  }

  function htmlRad(n, d, size) {
    var px = size || 18;
    var cls = n === 0 || d === 1 ? "xm-atom" : "xm-frac";
    return svgWrap(padBox(radNodeBox(n, d, px), px), cls);
  }

  function htmlDeg(deg, size) {
    var px = size || 18;
    return svgWrap(padBox(textBox(String(deg) + "°", px), px), "xm-atom");
  }

  function groupValue(code, size) {
    var px = size || 18;
    var boxed = padBox(valueBox(code, px), px);
    boxed.kind = "value";
    return boxed;
  }

  function groupPoint(cos, sin, size) {
    var px = size || 18;
    var boxed = padBox(pointBox(cos, sin, px), px);
    boxed.kind = "point";
    return boxed;
  }

  function groupRad(n, d, size) {
    var px = size || 18;
    var boxed = padBox(radNodeBox(n, d, px), px);
    boxed.kind = "rad";
    return boxed;
  }

  function groupDeg(deg, size) {
    var px = size || 18;
    var boxed = padBox(textBox(String(deg) + "°", px), px);
    boxed.kind = "deg";
    return boxed;
  }

  return {
    setMeasure: setMeasure,
    htmlValue: htmlValue,
    htmlPoint: htmlPoint,
    htmlRad: htmlRad,
    htmlDeg: htmlDeg,
    groupValue: groupValue,
    groupPoint: groupPoint,
    groupRad: groupRad,
    groupDeg: groupDeg,
    valueClass: valueClass
  };
});
