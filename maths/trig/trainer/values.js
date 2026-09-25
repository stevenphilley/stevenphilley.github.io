/* Exact values for the 16 standard unit-circle angles.
   Loaded in the browser as a plain script (window.UnitCircle) and in Node
   via require() for maths/trig/trainer/values.test.js.
   360° is the same point as 0° and is not a separate card. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.UnitCircle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ANGLES = [
    { deg: 0, radNum: 0, radDen: 1, cos: "1", sin: "0", tan: "0", ref: 0, quad: 0 },
    { deg: 30, radNum: 1, radDen: 6, cos: "√3/2", sin: "1/2", tan: "√3/3", ref: 30, quad: 1 },
    { deg: 45, radNum: 1, radDen: 4, cos: "√2/2", sin: "√2/2", tan: "1", ref: 45, quad: 1 },
    { deg: 60, radNum: 1, radDen: 3, cos: "1/2", sin: "√3/2", tan: "√3", ref: 60, quad: 1 },
    { deg: 90, radNum: 1, radDen: 2, cos: "0", sin: "1", tan: "undef", ref: 90, quad: 0 },
    { deg: 120, radNum: 2, radDen: 3, cos: "-1/2", sin: "√3/2", tan: "-√3", ref: 60, quad: 2 },
    { deg: 135, radNum: 3, radDen: 4, cos: "-√2/2", sin: "√2/2", tan: "-1", ref: 45, quad: 2 },
    { deg: 150, radNum: 5, radDen: 6, cos: "-√3/2", sin: "1/2", tan: "-√3/3", ref: 30, quad: 2 },
    { deg: 180, radNum: 1, radDen: 1, cos: "-1", sin: "0", tan: "0", ref: 0, quad: 0 },
    { deg: 210, radNum: 7, radDen: 6, cos: "-√3/2", sin: "-1/2", tan: "√3/3", ref: 30, quad: 3 },
    { deg: 225, radNum: 5, radDen: 4, cos: "-√2/2", sin: "-√2/2", tan: "1", ref: 45, quad: 3 },
    { deg: 240, radNum: 4, radDen: 3, cos: "-1/2", sin: "-√3/2", tan: "√3", ref: 60, quad: 3 },
    { deg: 270, radNum: 3, radDen: 2, cos: "0", sin: "-1", tan: "undef", ref: 90, quad: 0 },
    { deg: 300, radNum: 5, radDen: 3, cos: "1/2", sin: "-√3/2", tan: "-√3", ref: 60, quad: 4 },
    { deg: 315, radNum: 7, radDen: 4, cos: "√2/2", sin: "-√2/2", tan: "-1", ref: 45, quad: 4 },
    { deg: 330, radNum: 11, radDen: 6, cos: "√3/2", sin: "-1/2", tan: "-√3/3", ref: 30, quad: 4 }
  ];

  ANGLES.forEach(function (angle) { Object.freeze(angle); });
  Object.freeze(ANGLES);

  function quadrantOne() {
    return ANGLES.filter(function (angle) { return angle.deg <= 90; });
  }

  function neg(code) {
    if (code === "0" || code === "undef") return code;
    if (code.charAt(0) === "-") return code.slice(1);
    return "-" + code;
  }

  /* 1/2 ↔ √3/2 and √3/3 ↔ √3, sign preserved. Other codes stay put. */
  function swapHalf(code) {
    if (code === "undef") return code;
    var negative = code.charAt(0) === "-";
    var body = negative ? code.slice(1) : code;
    var next = body;
    if (body === "1/2") next = "√3/2";
    else if (body === "√3/2") next = "1/2";
    else if (body === "√3/3") next = "√3";
    else if (body === "√3") next = "√3/3";
    else return code;
    return (negative ? "-" : "") + next;
  }

  function circ(a, b) {
    var d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
  }

  function shuffle(list, rng) {
    var copy = list.slice();
    var rand = rng || Math.random;
    var i, j, tmp;
    for (i = copy.length - 1; i > 0; i--) {
      j = Math.floor(rand() * (i + 1));
      tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function withChoices(correct, candidates, rng, keyFn) {
    var opts = [correct];
    var seen = {};
    seen[keyFn(correct)] = true;
    candidates.forEach(function (candidate) {
      if (opts.length >= 4) return;
      var key = keyFn(candidate);
      if (seen[key]) return;
      seen[key] = true;
      opts.push(candidate);
    });
    var options = shuffle(opts, rng);
    var answer = -1;
    var want = keyFn(correct);
    options.forEach(function (option, index) {
      if (keyFn(option) === want) answer = index;
    });
    return { options: options, answer: answer };
  }

  function pointCandidates(angle) {
    var list = [];
    function add(cos, sin) {
      if (cos === angle.cos && sin === angle.sin) return;
      list.push({ cos: cos, sin: sin });
    }
    add(angle.sin, angle.cos);
    add(swapHalf(angle.cos), swapHalf(angle.sin));
    add(angle.cos, neg(angle.sin));
    add(neg(angle.cos), angle.sin);
    add(neg(angle.cos), neg(angle.sin));
    add(swapHalf(angle.cos), neg(swapHalf(angle.sin)));
    add(neg(swapHalf(angle.cos)), swapHalf(angle.sin));
    var others = ANGLES.filter(function (other) { return other.deg !== angle.deg; });
    others.sort(function (a, b) { return circ(a.deg, angle.deg) - circ(b.deg, angle.deg); });
    others.forEach(function (other) { add(other.cos, other.sin); });
    return list;
  }

  function angleScore(angle, other) {
    var score = 0;
    if (other.ref === angle.ref) score += 6;
    if (other.ref + angle.ref === 90 && other.ref !== angle.ref) score += 5;
    if (circ(other.deg, angle.deg) === 180) score += 3;
    if (circ(other.deg, angle.deg) <= 30) score += 2;
    return score;
  }

  function angleCandidates(angle, pool) {
    var others = pool.filter(function (other) { return other.deg !== angle.deg; });
    others.sort(function (a, b) {
      var diff = angleScore(angle, b) - angleScore(angle, a);
      if (diff) return diff;
      return circ(a.deg, angle.deg) - circ(b.deg, angle.deg);
    });
    return others;
  }

  function fnCandidates(correct, fn) {
    var list = [];
    function add(value) {
      if (value && value !== correct) list.push(value);
    }
    add(swapHalf(correct));
    add(neg(correct));
    if (fn === "tan") {
      add(correct === "undef" ? "0" : "undef");
      add(correct === "1" || correct === "-1" ? "0" : "1");
      add("-1");
      add("√3");
      add("-√3");
      add("√3/3");
      add("-√3/3");
      add("0");
    } else {
      add("0");
      add("1");
      add("-1");
      add("1/2");
      add("-1/2");
      add("√3/2");
      add("-√3/2");
      add("√2/2");
      add("-√2/2");
    }
    return list;
  }

  function pointQuestion(angle, rng) {
    return withChoices(
      { cos: angle.cos, sin: angle.sin },
      pointCandidates(angle),
      rng,
      function (point) { return point.cos + "|" + point.sin; }
    );
  }

  function angleQuestion(angle, pool, rng) {
    return withChoices(angle, angleCandidates(angle, pool), rng, function (item) {
      return String(item.deg);
    });
  }

  function valueQuestion(angle, fn, rng) {
    return withChoices(angle[fn], fnCandidates(angle[fn], fn), rng, function (value) {
      return value;
    });
  }

  return {
    ANGLES: ANGLES,
    quadrantOne: quadrantOne,
    neg: neg,
    swapHalf: swapHalf,
    pointQuestion: pointQuestion,
    angleQuestion: angleQuestion,
    valueQuestion: valueQuestion
  };
});
