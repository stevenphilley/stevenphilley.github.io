/* Unit circle memory trainer. Depends on values.js (window.UnitCircle). */
(function () {
  "use strict";

  var UC = window.UnitCircle;
  var STORE = "sp-uc-trainer-v1";
  var VB = 640;
  var CX = 320;
  var CY = 320;
  var R = 214;

  var progress = loadProgress();
  var mode = "a2p";
  var scope = "q1";
  var promptUnit = "mix";
  var answerUnit = "deg";
  var current = null;
  var locked = false;
  var lastCardId = "";
  var advanceTimer = 0;
  var timed = false;
  var endsAt = 0;
  var roundScore = 0;
  var clockTimer = 0;
  var resetArmed = false;
  var resetTimer = 0;
  var hidden = {};
  var studyFocus = null;

  var els = {};

  function loadProgress() {
    var blank = { cards: {}, seen: 0, correct: 0, streak: 0, bestTimed: null };
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return blank;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || Array.isArray(data)) return blank;
      data.cards = data.cards && typeof data.cards === "object" ? data.cards : {};
      data.seen = Number(data.seen) || 0;
      data.correct = Number(data.correct) || 0;
      data.streak = Number(data.streak) || 0;
      if (data.bestTimed != null) data.bestTimed = Number(data.bestTimed) || 0;
      return data;
    } catch (e) {
      return blank;
    }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch (e) {}
  }

  function $(id) { return document.getElementById(id); }

  function htmlEscape(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function htmlValue(code) {
    if (code === "undef") return "<span class=\"m\">undefined</span>";
    var sign = "";
    var body = code;
    if (body.charAt(0) === "-") {
      sign = "<span class=\"sgn\">−</span>";
      body = body.slice(1);
    }
    var slash = body.indexOf("/");
    if (slash === -1) return sign + "<span class=\"m\">" + htmlEscape(body) + "</span>";
    return sign + "<span class=\"frac\"><span class=\"num\">" + htmlEscape(body.slice(0, slash)) + "</span><span class=\"den\">" + htmlEscape(body.slice(slash + 1)) + "</span></span>";
  }

  function htmlPoint(cos, sin) {
    return "<span class=\"pair\">(" + htmlValue(cos) + "<span class=\"comma\">,</span> " + htmlValue(sin) + ")</span>";
  }

  function htmlRad(angle) {
    var n = angle.radNum;
    var d = angle.radDen;
    if (n === 0) return "<span class=\"m\">0</span>";
    var num = (n === 1 ? "π" : String(n) + "π");
    if (d === 1) return "<span class=\"m\">" + num + "</span>";
    return "<span class=\"frac\"><span class=\"num\">" + num + "</span><span class=\"den\">" + d + "</span></span>";
  }

  function htmlDeg(angle) {
    return "<span class=\"m\">" + angle.deg + "°</span>";
  }

  function htmlAngle(angle, unit) {
    return unit === "rad" ? htmlRad(angle) : htmlDeg(angle);
  }

  function speakValue(code) {
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

  function speakPoint(cos, sin) {
    return "cosine " + speakValue(cos) + ", sine " + speakValue(sin);
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

  function speakDeg(angle) {
    return angle.deg + " degrees";
  }

  function speakAngle(angle, unit) {
    return unit === "rad" ? speakRad(angle) : speakDeg(angle);
  }

  function radPlain(angle) {
    var n = angle.radNum;
    var d = angle.radDen;
    if (n === 0) return "0";
    var num = n === 1 ? "π" : String(n) + "π";
    return d === 1 ? num : num + "/" + d;
  }

  function pool() {
    return scope === "q1" ? UC.quadrantOne() : UC.ANGLES.slice();
  }

  function unitsForPrompt() {
    if (promptUnit === "deg" || promptUnit === "rad") return [promptUnit];
    return ["deg", "rad"];
  }

  function cardsForMode() {
    var angles = pool();
    var list = [];
    if (mode === "a2p" || mode === "tap" || mode === "fn") {
      var units = unitsForPrompt();
      angles.forEach(function (angle) {
        units.forEach(function (unit) {
          if (mode === "fn") {
            ["sin", "cos", "tan"].forEach(function (fn) {
              list.push({ id: "fn:" + angle.deg + ":" + fn + ":" + unit, mode: "fn", angle: angle, fn: fn, unit: unit });
            });
          } else {
            list.push({ id: mode + ":" + angle.deg + ":" + unit, mode: mode, angle: angle, unit: unit });
          }
        });
      });
    } else if (mode === "p2a") {
      angles.forEach(function (angle) {
        list.push({ id: "p2a:" + angle.deg + ":" + answerUnit, mode: "p2a", angle: angle, unit: answerUnit });
      });
    } else {
      angles.forEach(function (angle) {
        ["to-rad", "to-deg"].forEach(function (dir) {
          list.push({ id: "conv:" + angle.deg + ":" + dir, mode: "conv", angle: angle, dir: dir });
        });
      });
    }
    return list;
  }

  function weightOf(id) {
    var card = progress.cards[id];
    if (!card || !card.seen) return 4;
    var accuracy = card.correct / card.seen;
    return 0.4 + (1 - accuracy) * 3 + (card.missStreak || 0) * 1.25;
  }

  function pickWeighted(cards) {
    var weights = [];
    var total = 0;
    cards.forEach(function (card) {
      var weight = weightOf(card.id);
      if (card.id === lastCardId && cards.length > 1) weight *= 0.08;
      weights.push(weight);
      total += weight;
    });
    var mark = Math.random() * total;
    var running = 0;
    for (var i = 0; i < cards.length; i++) {
      running += weights[i];
      if (mark <= running) return cards[i];
    }
    return cards[cards.length - 1];
  }

  function buildQuestion(card) {
    var active = pool();
    if (card.mode === "a2p") return UC.pointQuestion(card.angle);
    if (card.mode === "p2a" || card.mode === "conv") return UC.angleQuestion(card.angle, active);
    if (card.mode === "fn") return UC.valueQuestion(card.angle, card.fn);
    return null;
  }

  function optionView(card, option) {
    if (card.mode === "a2p") {
      return { html: htmlPoint(option.cos, option.sin), speak: speakPoint(option.cos, option.sin) };
    }
    if (card.mode === "p2a") {
      return { html: htmlAngle(option, card.unit), speak: speakAngle(option, card.unit) };
    }
    if (card.mode === "conv") {
      var unit = card.dir === "to-rad" ? "rad" : "deg";
      return { html: htmlAngle(option, unit), speak: speakAngle(option, unit) };
    }
    return { html: htmlValue(option), speak: speakValue(option) };
  }

  function promptView(card) {
    var angle = card.angle;
    if (card.mode === "a2p") {
      return {
        kicker: "Angle to point",
        html: htmlAngle(angle, card.unit),
        note: "Choose (cos, sin).",
        speak: "Where is " + speakAngle(angle, card.unit) + "? Choose cosine and sine."
      };
    }
    if (card.mode === "p2a") {
      return {
        kicker: "Point to angle",
        html: "<span class=\"m\">Name this point</span>",
        note: card.unit === "rad" ? "Answer in radians." : "Answer in degrees.",
        speak: "Name the highlighted point in " + (card.unit === "rad" ? "radians" : "degrees") + ". Coordinates " + speakPoint(angle.cos, angle.sin) + "."
      };
    }
    if (card.mode === "conv") {
      var from = card.dir === "to-rad" ? "deg" : "rad";
      var toward = card.dir === "to-rad" ? "radians" : "degrees";
      return {
        kicker: "Convert",
        html: htmlAngle(angle, from),
        note: "In " + toward + ".",
        speak: "Convert " + speakAngle(angle, from) + " to " + toward + "."
      };
    }
    if (card.mode === "fn") {
      var name = card.fn === "sin" ? "sin" : card.fn === "cos" ? "cos" : "tan";
      var spoken = card.fn === "sin" ? "Sine" : card.fn === "cos" ? "Cosine" : "Tangent";
      return {
        kicker: "Function value",
        html: "<span class=\"fn\">" + name + "</span> " + htmlAngle(angle, card.unit),
        note: "Exact value.",
        speak: spoken + " of " + speakAngle(angle, card.unit) + "."
      };
    }
    return {
      kicker: "Tap the circle",
      html: htmlAngle(angle, card.unit),
      note: "Tap this angle.",
      speak: "Tap " + speakAngle(angle, card.unit) + " on the circle."
    };
  }

  function quadrantSentence(angle) {
    if (angle.deg === 0) return "Positive x-axis: cosine is 1, sine is 0, tangent is 0.";
    if (angle.deg === 90) return "Positive y-axis: sine is 1, cosine is 0, tangent is undefined.";
    if (angle.deg === 180) return "Negative x-axis: cosine is −1, sine is 0, tangent is 0.";
    if (angle.deg === 270) return "Negative y-axis: sine is −1, cosine is 0, tangent is undefined.";
    if (angle.quad === 1) return "Quadrant I: sine, cosine, and tangent are all positive (All Students Take Calculus — All).";
    if (angle.quad === 2) return "Quadrant II: sine is positive; cosine and tangent are negative (All Students Take Calculus — Sine).";
    if (angle.quad === 3) return "Quadrant III: tangent is positive; sine and cosine are negative (All Students Take Calculus — Tangent).";
    return "Quadrant IV: cosine is positive; sine and tangent are negative (All Students Take Calculus — Cosine).";
  }

  function hintText(angle) {
    var pattern = "";
    if (angle.ref === 30 || angle.ref === 45 || angle.ref === 60) {
      pattern = " The 1-2-3 pattern: sine of 30°, 45°, and 60° is √1/2, √2/2, √3/2 (√1/2 is 1/2). Cosine of those angles runs √3/2, √2/2, √1/2. Take the reference angle, then apply the quadrant signs.";
    } else if (angle.quad === 0) {
      pattern = " Axis points are (1, 0), (0, 1), (−1, 0), and (0, −1).";
    }
    return "Reference angle " + angle.ref + "°. " + quadrantSentence(angle) + pattern;
  }

  function correctLine(card) {
    var angle = card.angle;
    if (card.mode === "a2p") {
      return {
        html: "Correct. " + htmlAngle(angle, card.unit) + " is " + htmlPoint(angle.cos, angle.sin) + ".",
        speak: "Correct. " + speakAngle(angle, card.unit) + " is " + speakPoint(angle.cos, angle.sin) + ". Streak " + progress.streak + "."
      };
    }
    if (card.mode === "p2a" || card.mode === "tap") {
      return {
        html: "Correct. " + htmlDeg(angle) + " · " + htmlRad(angle) + ".",
        speak: "Correct. " + speakDeg(angle) + ", " + speakRad(angle) + ". Streak " + progress.streak + "."
      };
    }
    if (card.mode === "conv") {
      return {
        html: "Correct. " + htmlDeg(angle) + " is " + htmlRad(angle) + ".",
        speak: "Correct. " + speakDeg(angle) + " is " + speakRad(angle) + ". Streak " + progress.streak + "."
      };
    }
    var name = card.fn;
    return {
      html: "Correct. " + name + " " + htmlAngle(angle, card.unit) + " = " + htmlValue(angle[name]) + ".",
      speak: "Correct. " + name + " of " + speakAngle(angle, card.unit) + " is " + speakValue(angle[name]) + ". Streak " + progress.streak + "."
    };
  }

  function wrongLine(card) {
    var angle = card.angle;
    var hint = " " + hintText(angle);
    if (card.mode === "a2p") {
      return {
        html: "Not that one. " + htmlAngle(angle, card.unit) + " is " + htmlPoint(angle.cos, angle.sin) + "." + hint,
        speak: "Not that one. " + speakAngle(angle, card.unit) + " is " + speakPoint(angle.cos, angle.sin) + "." + hint
      };
    }
    if (card.mode === "fn") {
      return {
        html: "Not that one. " + card.fn + " " + htmlAngle(angle, card.unit) + " = " + htmlValue(angle[card.fn]) + "." + hint,
        speak: "Not that one. " + card.fn + " of " + speakAngle(angle, card.unit) + " is " + speakValue(angle[card.fn]) + "." + hint
      };
    }
    return {
      html: "Not that one. It is " + htmlDeg(angle) + ", " + htmlRad(angle) + "." + hint,
      speak: "Not that one. It is " + speakDeg(angle) + ", " + speakRad(angle) + "." + hint
    };
  }

  function showFeedback(visual, spoken, ok) {
    els.feedback.className = "feedback " + (ok ? "is-ok" : ok === false ? "is-bad" : "");
    els.feedback.innerHTML = visual;
    els.live.textContent = spoken;
    if (visual) {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      els.feedback.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  }

  function paintStats() {
    els.streak.textContent = String(progress.streak || 0);
    var seen = progress.seen || 0;
    els.acc.textContent = seen ? Math.round(100 * progress.correct / seen) + "% (" + progress.correct + "/" + seen + ")" : "—";
    els.best.textContent = progress.bestTimed == null ? "—" : String(progress.bestTimed);
    els.roundScore.hidden = !timed;
    els.roundScore.textContent = timed ? "This round " + roundScore : "";
  }

  function record(id, ok) {
    var card = progress.cards[id] || { seen: 0, correct: 0, missStreak: 0 };
    card.seen += 1;
    if (ok) {
      card.correct += 1;
      card.missStreak = 0;
      progress.streak = (progress.streak || 0) + 1;
      progress.correct += 1;
    } else {
      card.missStreak = (card.missStreak || 0) + 1;
      progress.streak = 0;
    }
    progress.seen += 1;
    progress.cards[id] = card;
    save();
  }

  function polar(deg, radius) {
    var rad = deg * Math.PI / 180;
    return [CX + Math.cos(rad) * radius, CY - Math.sin(rad) * radius];
  }

  function circleMarkup(opts) {
    var ticks = opts.ticks || opts.angles;
    var parts = [];
    parts.push("<div class=\"circle-box\" id=\"" + opts.boxId + "\"" + (opts.interactive ? " tabindex=\"0\"" : "") + ">");
    parts.push("<svg viewBox=\"0 0 " + VB + " " + VB + "\" role=\"img\" aria-label=\"" + htmlEscape(opts.label) + "\">");
    parts.push("<circle class=\"ring\" cx=\"" + CX + "\" cy=\"" + CY + "\" r=\"" + R + "\"></circle>");
    parts.push("<line class=\"axis\" x1=\"48\" y1=\"" + CY + "\" x2=\"592\" y2=\"" + CY + "\"></line>");
    parts.push("<line class=\"axis\" x1=\"" + CX + "\" y1=\"48\" x2=\"" + CX + "\" y2=\"592\"></line>");
    ticks.forEach(function (angle) {
      var outer = polar(angle.deg, R);
      var inner = polar(angle.deg, R - 12);
      parts.push("<line class=\"tick\" x1=\"" + inner[0] + "\" y1=\"" + inner[1] + "\" x2=\"" + outer[0] + "\" y2=\"" + outer[1] + "\"></line>");
    });
    if (opts.labels) {
      opts.angles.forEach(function (angle) {
        if (hidden[angle.deg]) return;
        var radius = angle.ref === 45 ? 300 : angle.quad === 0 ? 252 : 268;
        var at = polar(angle.deg, radius);
        parts.push("<text class=\"clabel\" x=\"" + at[0] + "\" y=\"" + at[1] + "\" text-anchor=\"middle\">");
        parts.push("<tspan x=\"" + at[0] + "\" dy=\"-0.15em\">" + angle.deg + "°</tspan>");
        parts.push("<tspan class=\"clabel-rad\" x=\"" + at[0] + "\" dy=\"1.25em\">" + htmlEscape(radPlain(angle)) + "</tspan>");
        parts.push("</text>");
      });
    }
    parts.push("</svg>");
    parts.push("<div class=\"dot-layer\">");
    opts.angles.forEach(function (angle) {
      var at = polar(angle.deg, R);
      var left = (at[0] / VB) * 100;
      var top = (at[1] / VB) * 100;
      var classes = "dot";
      if (opts.highlight === angle.deg) classes += " is-hot";
      if (opts.correct === angle.deg) classes += " is-right";
      if (opts.wrong === angle.deg) classes += " is-wrong";
      if (opts.labels && hidden[angle.deg]) classes += " is-hidden";
      var label = opts.labels
        ? (hidden[angle.deg] ? speakDeg(angle) + ", hidden. Activate to reveal." : speakDeg(angle) + ", " + speakRad(angle) + ", shown. Activate to hide.")
        : speakDeg(angle) + ", " + speakRad(angle);
      var attrs = opts.interactive
        ? "aria-label=\"" + htmlEscape(label) + "\""
        : "tabindex=\"-1\" aria-hidden=\"true\"";
      parts.push("<button type=\"button\" class=\"" + classes + "\" style=\"left:" + left + "%;top:" + top + "%\" data-deg=\"" + angle.deg + "\" " + attrs + "></button>");
    });
    parts.push("</div></div>");
    return parts.join("");
  }

  function nearestDeg(box, event) {
    var svg = box.querySelector("svg");
    var rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    var x = ((event.clientX - rect.left) / rect.width) * VB;
    var y = ((event.clientY - rect.top) / rect.height) * VB;
    var dx = x - CX;
    var dy = CY - y;
    var dist = Math.hypot(dx, dy);
    if (dist < R * 0.48 || dist > R * 1.58) return null;
    var ang = Math.atan2(dy, dx);
    if (ang < 0) ang += Math.PI * 2;
    var best = null;
    var bestDiff = 22 * Math.PI / 180;
    [].slice.call(box.querySelectorAll(".dot")).forEach(function (dot) {
      var deg = Number(dot.getAttribute("data-deg"));
      var diff = Math.abs(Math.atan2(Math.sin(ang - deg * Math.PI / 180), Math.cos(ang - deg * Math.PI / 180)));
      if (diff < bestDiff) {
        bestDiff = diff;
        best = deg;
      }
    });
    return best;
  }

  function bindDots(box, onPick) {
    if (!box) return;
    var dots = [].slice.call(box.querySelectorAll(".dot")).filter(function (dot) {
      return dot.getAttribute("aria-hidden") !== "true";
    });
    if (!dots.length) return;
    dots.forEach(function (dot, index) {
      dot.tabIndex = index === 0 ? 0 : -1;
      dot.addEventListener("click", function () {
        onPick(Number(dot.getAttribute("data-deg")), dot);
      });
      dot.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = dots[(index + 1) % dots.length];
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = dots[(index - 1 + dots.length) % dots.length];
        if (next) {
          dots.forEach(function (item) { item.tabIndex = -1; });
          next.tabIndex = 0;
          next.focus();
          event.preventDefault();
          event.stopPropagation();
        }
      });
    });
    box.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest(".dot")) return;
      var deg = nearestDeg(box, event);
      if (deg == null) return;
      onPick(deg);
    });
    box.addEventListener("keydown", function (event) {
      if (event.target !== box) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "ArrowDown" || event.key === "ArrowUp") {
        var first = box.querySelector(".dot[tabindex=\"0\"]") || dots[0];
        if (first) first.focus();
        event.preventDefault();
      }
    });
  }

  function renderStage(card, marks) {
    els.stage.hidden = !(card.mode === "tap" || card.mode === "p2a");
    if (els.stage.hidden) {
      els.stage.innerHTML = "";
      return;
    }
    var interactive = card.mode === "tap" && !locked;
    els.stage.innerHTML = circleMarkup({
      boxId: "quiz-circle",
      angles: pool(),
      ticks: pool(),
      highlight: card.mode === "p2a" ? card.angle.deg : null,
      correct: marks && marks.correct,
      wrong: marks && marks.wrong,
      interactive: interactive,
      label: card.mode === "tap" ? "Unit circle. Choose the prompted angle." : "Unit circle with one point highlighted."
    });
    if (interactive) {
      bindDots($("quiz-circle"), function (deg) { answerTap(deg); });
    }
  }

  function renderChoices(card) {
    els.choices.innerHTML = "";
    els.choices.hidden = card.mode === "tap";
    if (card.mode === "tap") return;
    card.built.options.forEach(function (option, index) {
      var view = optionView(card, option);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.dataset.i = String(index);
      button.innerHTML = "<span class=\"key\" aria-hidden=\"true\">" + (index + 1) + "</span><span class=\"math\">" + view.html + "</span>";
      button.setAttribute("aria-label", (index + 1) + ". " + view.speak);
      button.addEventListener("click", function () { answerChoice(index); });
      els.choices.appendChild(button);
    });
  }

  function deal() {
    window.clearTimeout(advanceTimer);
    locked = false;
    var cards = cardsForMode();
    var card = pickWeighted(cards);
    lastCardId = card.id;
    card.built = buildQuestion(card);
    current = card;
    var view = promptView(card);
    els.kicker.textContent = view.kicker;
    els.prompt.innerHTML = view.html;
    els.note.textContent = view.note;
    els.promptLive.textContent = view.speak;
    els.feedback.innerHTML = "";
    els.feedback.className = "feedback";
    els.next.hidden = true;
    renderStage(card);
    renderChoices(card);
    syncControls();
  }

  function finishAnswer(ok, marks) {
    var line = ok ? correctLine(current) : wrongLine(current);
    if (ok) line.html = line.html.replace(/\.$/, ". Streak " + progress.streak + ".");
    showFeedback(line.html, line.speak, ok);
    if (current.mode === "tap" || current.mode === "p2a") renderStage(current, marks);
    [].slice.call(els.choices.querySelectorAll(".choice")).forEach(function (button) {
      button.disabled = true;
      var index = Number(button.dataset.i);
      if (current.built && index === current.built.answer) button.classList.add("is-right");
    });
    els.next.hidden = false;
    paintStats();
    if (timed && Date.now() >= endsAt) {
      finishRound();
      return;
    }
    var delay = ok ? 750 : (timed ? 2400 : 0);
    if (delay) {
      advanceTimer = window.setTimeout(function () {
        if (timed && Date.now() >= endsAt) finishRound();
        else deal();
      }, delay);
    }
  }

  function answerChoice(index) {
    if (locked || !current || !current.built) return;
    if (timed && Date.now() >= endsAt) { finishRound(); return; }
    locked = true;
    var ok = index === current.built.answer;
    record(current.id, ok);
    if (ok && timed) roundScore += 1;
    var button = els.choices.querySelector(".choice[data-i=\"" + index + "\"]");
    if (button && !ok) button.classList.add("is-wrong");
    finishAnswer(ok, null);
  }

  function answerTap(deg) {
    if (locked || !current || current.mode !== "tap") return;
    if (timed && Date.now() >= endsAt) { finishRound(); return; }
    locked = true;
    var ok = deg === current.angle.deg;
    record(current.id, ok);
    if (ok && timed) roundScore += 1;
    finishAnswer(ok, { correct: current.angle.deg, wrong: ok ? null : deg });
  }

  function paintClock() {
    var left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    var secs = left % 60;
    els.clock.textContent = Math.floor(left / 60) + ":" + (secs < 10 ? "0" : "") + secs;
    if (left === 0) finishRound();
  }

  function finishRound() {
    if (!timed) return;
    timed = false;
    window.clearInterval(clockTimer);
    window.clearTimeout(advanceTimer);
    locked = true;
    var previous = progress.bestTimed;
    if (previous == null || roundScore > previous) {
      progress.bestTimed = roundScore;
      save();
    }
    var best = progress.bestTimed;
    var spoken = "Time. Score " + roundScore + ". Best " + best + ".";
    showFeedback(spoken, spoken, roundScore > 0);
    els.clock.textContent = "0:00";
    els.timed.textContent = "60-second round";
    els.timed.setAttribute("aria-pressed", "false");
    els.next.hidden = false;
    paintStats();
  }

  function startRound() {
    roundScore = 0;
    timed = true;
    endsAt = Date.now() + 60000;
    els.timed.textContent = "Stop round";
    els.timed.setAttribute("aria-pressed", "true");
    els.clock.hidden = false;
    paintClock();
    window.clearInterval(clockTimer);
    clockTimer = window.setInterval(paintClock, 200);
    deal();
    els.live.textContent = "60-second round started. " + els.promptLive.textContent;
  }

  function stopRound() {
    timed = false;
    window.clearInterval(clockTimer);
    els.timed.textContent = "60-second round";
    els.timed.setAttribute("aria-pressed", "false");
    els.clock.hidden = true;
    showFeedback("Round stopped.", "Round stopped.", null);
    paintStats();
  }

  function syncControls() {
    var showPromptUnit = mode === "a2p" || mode === "fn" || mode === "tap";
    els.promptUnit.hidden = !showPromptUnit;
    els.answerUnit.hidden = mode !== "p2a";
    els.clock.hidden = !timed;
  }

  function wireRadios(container, get, set) {
    var buttons = [].slice.call(container.querySelectorAll("[role=\"radio\"]"));
    function paint(value, focus) {
      buttons.forEach(function (button) {
        var on = button.getAttribute("data-value") === value;
        button.setAttribute("aria-checked", on ? "true" : "false");
        button.tabIndex = on ? 0 : -1;
        if (on && focus) button.focus();
      });
    }
    buttons.forEach(function (button, index) {
      button.addEventListener("click", function () {
        var value = button.getAttribute("data-value");
        if (value === get()) return;
        set(value);
        paint(value, false);
      });
      button.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = buttons[(index + 1) % buttons.length];
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = buttons[(index - 1 + buttons.length) % buttons.length];
        if (!next) return;
        var value = next.getAttribute("data-value");
        set(value);
        paint(value, true);
        event.preventDefault();
        event.stopPropagation();
      });
    });
    paint(get(), false);
  }

  function drawStudy() {
    els.study.innerHTML = circleMarkup({
      boxId: "study-circle",
      angles: UC.ANGLES,
      ticks: UC.ANGLES,
      labels: true,
      interactive: true,
      label: "Study circle. Each point can be hidden or revealed."
    });
    bindDots($("study-circle"), function (deg, dot) {
      if (hidden[deg]) delete hidden[deg];
      else hidden[deg] = true;
      studyFocus = deg;
      var angle = UC.ANGLES.filter(function (item) { return item.deg === deg; })[0];
      drawStudy();
      var again = document.querySelector("#study-circle .dot[data-deg=\"" + deg + "\"]");
      if (again) again.focus();
      paintStudyDetail(angle);
      dot = again;
    });
    if (studyFocus != null) {
      var keep = document.querySelector("#study-circle .dot[data-deg=\"" + studyFocus + "\"]");
      if (keep) {
        [].slice.call(document.querySelectorAll("#study-circle .dot")).forEach(function (dot) {
          dot.tabIndex = dot === keep ? 0 : -1;
        });
      }
    }
  }

  function paintStudyDetail(angle) {
    if (!angle) {
      els.studyDetail.textContent = "Click a point to hide or reveal it.";
      return;
    }
    if (hidden[angle.deg]) {
      els.studyDetail.textContent = speakDeg(angle) + " is hidden.";
      return;
    }
    els.studyDetail.innerHTML = htmlDeg(angle) + " · " + htmlRad(angle) + " · " + htmlPoint(angle.cos, angle.sin) + " · tan " + htmlValue(angle.tan);
  }

  function wireHelp() {
    var button = $("help");
    var tip = $("help-tip");
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

  function init() {
    els = {
      kicker: $("q-kicker"),
      prompt: $("prompt"),
      note: $("prompt-note"),
      promptLive: $("prompt-live"),
      stage: $("stage"),
      choices: $("choices"),
      feedback: $("feedback"),
      live: $("live"),
      next: $("next"),
      streak: $("streak"),
      acc: $("acc"),
      best: $("best"),
      roundScore: $("round-score"),
      clock: $("clock"),
      timed: $("timed"),
      promptUnit: $("prompt-unit"),
      answerUnit: $("answer-unit"),
      study: $("study"),
      studyDetail: $("study-detail")
    };

    wireRadios($("modes"), function () { return mode; }, function (value) {
      mode = value;
      deal();
    });
    wireRadios($("scope"), function () { return scope; }, function (value) {
      scope = value;
      deal();
    });
    wireRadios($("prompt-unit"), function () { return promptUnit; }, function (value) {
      promptUnit = value;
      deal();
    });
    wireRadios($("answer-unit"), function () { return answerUnit; }, function (value) {
      answerUnit = value;
      deal();
    });

    els.next.addEventListener("click", function () {
      if (timed && Date.now() >= endsAt) { finishRound(); return; }
      deal();
    });

    els.timed.addEventListener("click", function () {
      if (timed) stopRound();
      else startRound();
    });

    $("reset").addEventListener("click", function () {
      var button = $("reset");
      if (!resetArmed) {
        resetArmed = true;
        button.textContent = "Click again to reset";
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          resetArmed = false;
          button.textContent = "Reset progress";
        }, 4000);
        return;
      }
      resetArmed = false;
      window.clearTimeout(resetTimer);
      if (timed) {
        timed = false;
        window.clearInterval(clockTimer);
        els.timed.textContent = "60-second round";
        els.timed.setAttribute("aria-pressed", "false");
      }
      progress = { cards: {}, seen: 0, correct: 0, streak: 0, bestTimed: null };
      save();
      button.textContent = "Reset progress";
      paintStats();
      showFeedback("Progress cleared on this browser.", "Progress cleared on this browser.", null);
      deal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      var tag = event.target && event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key >= "1" && event.key <= "4") {
        var button = els.choices.querySelector(".choice[data-i=\"" + (Number(event.key) - 1) + "\"]");
        if (button && !button.disabled) {
          button.click();
          event.preventDefault();
        }
      }
    });

    $("study-show").addEventListener("click", function () {
      hidden = {};
      drawStudy();
      els.studyDetail.textContent = "All sixteen labels are showing.";
    });
    $("study-hide").addEventListener("click", function () {
      UC.ANGLES.forEach(function (angle) { hidden[angle.deg] = true; });
      drawStudy();
      els.studyDetail.textContent = "Labels hidden. Click a point to reveal it.";
    });

    wireHelp();
    paintStats();
    drawStudy();
    deal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
