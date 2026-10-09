/*! ASL trainer: learn, Leitner cards, quizzes, local progress. */
(function () {
  "use strict";

  var KEY = "sp-asl-trainer-v1";
  var INTERVAL = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16 };
  var QUIZ_LEN = 8;

  var state;
  var mode = "learn";
  var learnGroup = "alphabet";
  var learnCat = "Greetings";
  var learnIndex = 0;
  var learnFilter = "";
  var card = null;
  var cardFlipped = false;
  var cardQueue = [];
  var deck = "due";
  var roundSeen = {};
  var quizKind = "recognize";
  var quiz = null;
  var reader = null;
  var readerTimer = null;
  var spell = null;
  var reduced = false;

  function $(id) { return document.getElementById(id); }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function addDays(iso, n) {
    var p = iso.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function yesterdayOf(iso) {
    return addDays(iso, -1);
  }

  function freshState() {
    return {
      version: 1,
      boxes: {},
      stats: {
        reviews: 0,
        correct: 0,
        quizCorrect: 0,
        quizAnswered: 0,
        readerCorrect: 0,
        readerAttempts: 0,
        spellCorrect: 0,
        spellAttempts: 0,
        streak: 0,
        bestStreak: 0,
        lastDay: ""
      }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return freshState();
      var data = JSON.parse(raw);
      if (!data || data.version !== 1 || typeof data.boxes !== "object" || !data.stats) return freshState();
      return data;
    } catch (e) {
      return freshState();
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    paintMini();
  }

  function touchDay() {
    var t = today();
    var stats = state.stats;
    if (stats.lastDay === t) return;
    if (stats.lastDay === yesterdayOf(t)) stats.streak += 1;
    else stats.streak = 1;
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
    stats.lastDay = t;
  }

  function boxOf(id) {
    return state.boxes[id] || { box: 1, due: today(), seen: 0, correct: 0, wrong: 0 };
  }

  function isDue(id) {
    var cardState = state.boxes[id];
    if (!cardState) return true;
    return cardState.due <= today();
  }

  function grade(id, knew) {
    var cardState = boxOf(id);
    cardState.seen += 1;
    if (knew) {
      cardState.correct += 1;
      cardState.box = Math.min(5, (cardState.box || 1) + 1);
    } else {
      cardState.wrong += 1;
      cardState.box = 1;
    }
    cardState.due = addDays(today(), INTERVAL[cardState.box]);
    state.boxes[id] = cardState;
    state.stats.reviews += 1;
    if (knew) state.stats.correct += 1;
    touchDay();
    save();
  }

  function pool() {
    if (learnGroup === "alphabet") return ASLSigns.letters;
    if (learnGroup === "numbers") return ASLSigns.numbers;
    return ASLSigns.words.filter(function (s) { return s.category === learnCat; });
  }

  function filteredPool() {
    var list = pool();
    var q = learnFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (s) {
      return (s.label + " " + s.handshape + " " + s.category).toLowerCase().indexOf(q) !== -1;
    });
  }

  function signTitle(sign, blind) {
    if (blind) return sign.kind === "letter" ? "Handshape" : (sign.kind === "number" ? "Number handshape" : "Sign");
    if (sign.kind === "letter") return "Letter " + sign.label;
    if (sign.kind === "number") return "Number " + sign.label;
    return sign.label;
  }

  function signDesc(sign, blind) {
    var base = sign.picture + " " + sign.handshape + " " + sign.movement;
    if (blind) return base;
    return signTitle(sign, false) + ". " + base;
  }

  function mountSvg(node, sign, blind, mini) {
    node.innerHTML = ASLHands.svg(sign.draw, {
      title: signTitle(sign, blind),
      desc: signDesc(sign, blind),
      mini: !!mini
    });
  }

  function say(text) {
    var live = $("asl-live");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = text; }, 30);
  }

  function setMode(next, fromUser) {
    mode = next;
    document.querySelectorAll("[data-mode]").forEach(function (btn) {
      var on = btn.getAttribute("data-mode") === next;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
    });
    var sel = $("asl-mode-select");
    if (sel && sel.value !== next) sel.value = next;
    ["learn", "cards", "quiz", "progress"].forEach(function (name) {
      var panel = $("panel-" + name);
      if (!panel) return;
      panel.hidden = name !== next;
    });
    if (next === "learn") renderLearn();
    if (next === "cards") renderCards();
    if (next === "quiz") renderQuiz();
    if (next === "progress") renderProgress();
    if (fromUser) {
      var heading = document.querySelector("#panel-" + next + " h2");
      if (heading) heading.focus();
    }
  }

  function currentList() {
    var list = filteredPool();
    if (!list.length) return ASLSigns.letters;
    if (learnIndex >= list.length) learnIndex = 0;
    return list;
  }

  function renderLearn() {
    var list = filteredPool();
    var empty = $("asl-learn-empty");
    var body = $("asl-learn-body");
    if (!list.length) {
      if (body) body.hidden = true;
      if (empty) empty.hidden = false;
      $("asl-grid").innerHTML = "";
      return;
    }
    if (body) body.hidden = false;
    if (empty) empty.hidden = true;
    if (learnIndex >= list.length) learnIndex = 0;
    var sign = list[learnIndex];
    $("asl-kicker").textContent = sign.kind === "word" ? sign.category : sign.category;
    $("asl-label").textContent = sign.label;
    $("asl-handshape").textContent = sign.handshape;
    $("asl-location").textContent = sign.location;
    $("asl-movement").textContent = sign.movement;
    $("asl-palm").textContent = sign.palm;
    $("asl-note").textContent = sign.note || "";
    $("asl-note").hidden = !sign.note;
    $("asl-count").textContent = (learnIndex + 1) + " of " + list.length;
    mountSvg($("asl-stage"), sign, false, false);
    var grid = $("asl-grid");
    grid.innerHTML = "";
    list.forEach(function (item, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "asl-chip" + (i === learnIndex ? " is-on" : "");
      btn.setAttribute("aria-pressed", i === learnIndex ? "true" : "false");
      btn.setAttribute("aria-label", signTitle(item, false));
      var fig = document.createElement("span");
      fig.className = "asl-chip-fig";
      fig.innerHTML = ASLHands.svg(item.draw, {
        title: "",
        desc: "",
        mini: true
      });
      var svg = fig.querySelector("svg");
      if (svg) {
        svg.removeAttribute("role");
        svg.setAttribute("aria-hidden", "true");
        svg.removeAttribute("aria-labelledby");
      }
      var name = document.createElement("span");
      name.className = "asl-chip-name";
      name.textContent = item.label;
      btn.appendChild(fig);
      btn.appendChild(name);
      btn.addEventListener("click", function () {
        learnIndex = i;
        renderLearn();
        var stage = $("asl-stage");
        if (stage) stage.focus();
      });
      grid.appendChild(btn);
    });
    document.querySelectorAll("[data-group]").forEach(function (btn) {
      var on = btn.getAttribute("data-group") === learnGroup;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var cats = $("asl-cats");
    cats.hidden = learnGroup !== "vocabulary";
    document.querySelectorAll("[data-cat]").forEach(function (btn) {
      var on = btn.getAttribute("data-cat") === learnCat;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function stepLearn(delta) {
    var list = filteredPool();
    if (!list.length) return;
    learnIndex = (learnIndex + delta + list.length) % list.length;
    renderLearn();
    say(list[learnIndex].label + ". " + list[learnIndex].handshape);
  }

  function deckPool() {
    var list;
    if (deck === "alphabet") list = ASLSigns.letters.slice();
    else if (deck === "numbers") list = ASLSigns.numbers.slice();
    else if (deck === "vocabulary") list = ASLSigns.words.slice();
    else if (deck === "all") list = ASLSigns.all.slice();
    else {
      list = ASLSigns.all.filter(function (s) { return isDue(s.id) && !roundSeen[s.id]; });
      list.sort(function (a, b) { return boxOf(a.id).box - boxOf(b.id); });
      return list.slice(0, 20);
    }
    return list.filter(function (s) { return !roundSeen[s.id]; });
  }

  function nextCard() {
    if (!cardQueue.length) cardQueue = shuffle(deckPool());
    card = cardQueue.shift() || null;
    cardFlipped = false;
  }

  function renderCards() {
    var due = ASLSigns.all.filter(function (s) { return isDue(s.id); }).length;
    $("asl-due-line").textContent = due + (due === 1 ? " card is due" : " cards are due");
    paintBoxes();
    if (!card) nextCard();
    var empty = $("asl-card-empty");
    var face = $("asl-card-face");
    var emptyActions = $("asl-card-empty-actions");
    if (!card) {
      face.hidden = true;
      empty.hidden = false;
      if (emptyActions) emptyActions.hidden = false;
      return;
    }
    face.hidden = false;
    empty.hidden = true;
    if (emptyActions) emptyActions.hidden = true;
    $("asl-card-kicker").textContent = card.kind === "word" ? card.category : card.category;
    $("asl-card-prompt").textContent = cardFlipped ? card.label : "What is this?";
    $("asl-card-detail").hidden = !cardFlipped;
    if (cardFlipped) {
      $("asl-card-detail").textContent = card.handshape + " " + card.movement;
    }
    mountSvg($("asl-card-stage"), card, !cardFlipped, false);
    $("asl-flip").hidden = cardFlipped;
    $("asl-know").hidden = !cardFlipped;
    $("asl-again").hidden = !cardFlipped;
    var b = boxOf(card.id);
    $("asl-card-box").textContent = state.boxes[card.id] ? ("Box " + b.box) : "New";
  }

  function paintBoxes() {
    var counts = [0, 0, 0, 0, 0];
    ASLSigns.all.forEach(function (s) {
      var known = state.boxes[s.id];
      var b = known ? known.box : 1;
      counts[Math.max(0, Math.min(4, (b || 1) - 1))] += 1;
    });
    ["asl-boxes", "asl-boxes-cards"].forEach(function (id) {
      var row = $(id);
      if (!row) return;
      row.innerHTML = "";
      counts.forEach(function (n, i) {
        var li = document.createElement("li");
        var name = document.createElement("span");
        name.className = "k";
        name.textContent = "Box " + (i + 1);
        var val = document.createElement("span");
        val.className = "v";
        val.textContent = String(n);
        li.appendChild(name);
        li.appendChild(val);
        row.appendChild(li);
      });
    });
  }

  function gradeCard(knew) {
    if (!card || !cardFlipped) return;
    var label = card.label;
    grade(card.id, knew);
    roundSeen[card.id] = true;
    say((knew ? "Knew " : "Again, ") + label);
    card = null;
    renderCards();
  }

  function shuffle(list) {
    var a = list.slice();
    var i, j, tmp;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function pickChoices(correct, source, n) {
    var others = shuffle(source.filter(function (s) { return s.id !== correct.id; })).slice(0, n - 1);
    return shuffle(others.concat([correct]));
  }

  function startQuizRound() {
    if (quizKind === "reader") {
      startReader();
      return;
    }
    if (quizKind === "spell") {
      startSpell();
      return;
    }
    var source = quizKind === "recognize" || quizKind === "recall"
      ? (quiz && quiz.source) || ASLSigns.letters
      : ASLSigns.letters;
    var setSelect = $("asl-quiz-set");
    var which = setSelect ? setSelect.value : "letters";
    if (which === "numbers") source = ASLSigns.numbers;
    else if (which === "vocabulary") source = ASLSigns.words;
    else source = ASLSigns.letters;
    var queue = shuffle(source).slice(0, Math.min(QUIZ_LEN, source.length));
    quiz = { kind: quizKind, source: source, queue: queue, i: 0, correct: 0, item: null, choices: [], answered: false };
    askQuiz();
  }

  function askQuiz() {
    if (!quiz) return;
    if (quiz.i >= quiz.queue.length) {
      quiz.item = null;
      renderQuiz();
      say("Round done. " + quiz.correct + " of " + quiz.queue.length + " correct.");
      return;
    }
    quiz.item = quiz.queue[quiz.i];
    quiz.choices = pickChoices(quiz.item, quiz.source, 4);
    quiz.answered = false;
    quiz.picked = null;
    renderQuiz();
    say("Question " + (quiz.i + 1) + " of " + quiz.queue.length);
  }

  function answerQuiz(choice) {
    if (!quiz || !quiz.item || quiz.answered) return;
    quiz.answered = true;
    quiz.picked = choice.id;
    var ok = choice.id === quiz.item.id;
    if (ok) quiz.correct += 1;
    state.stats.quizAnswered += 1;
    if (ok) state.stats.quizCorrect += 1;
    touchDay();
    save();
    say(ok ? "Correct. " + quiz.item.label : "Answer: " + quiz.item.label);
    renderQuiz();
  }

  function renderQuiz() {
    document.querySelectorAll("[data-quiz]").forEach(function (btn) {
      var on = btn.getAttribute("data-quiz") === quizKind;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var setWrap = $("asl-quiz-set-wrap");
    setWrap.hidden = quizKind === "reader" || quizKind === "spell";
    $("quiz-recognize").hidden = quizKind !== "recognize";
    $("quiz-recall").hidden = quizKind !== "recall";
    $("quiz-reader").hidden = quizKind !== "reader";
    $("quiz-spell").hidden = quizKind !== "spell";
    if (quizKind === "recognize") renderRecognize();
    if (quizKind === "recall") renderRecall();
    if (quizKind === "reader") renderReader();
    if (quizKind === "spell") renderSpell();
  }

  function renderRecognize() {
    var host = $("quiz-recognize");
    var stage = $("recog-stage");
    var choices = $("recog-choices");
    var feedback = $("recog-feedback");
    var meta = $("recog-meta");
    if (!quiz || quiz.kind !== "recognize") {
      meta.textContent = "A handshape, then four answers.";
      stage.innerHTML = "";
      choices.innerHTML = "";
      feedback.textContent = "";
      $("recog-next").hidden = true;
      return;
    }
    if (!quiz.item) {
      meta.textContent = "Round done";
      stage.innerHTML = "";
      choices.innerHTML = "";
      feedback.textContent = quiz.correct + " of " + quiz.queue.length + " correct.";
      $("recog-next").hidden = true;
      return;
    }
    meta.textContent = "Question " + (quiz.i + 1) + " of " + quiz.queue.length;
    mountSvg(stage, quiz.item, true, false);
    choices.innerHTML = "";
    quiz.choices.forEach(function (choice, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "asl-choice";
      btn.textContent = (idx + 1) + ". " + choice.label;
      if (quiz.answered) {
        btn.disabled = true;
        if (choice.id === quiz.item.id) btn.className += " is-right";
        else if (choice.id === quiz.picked) btn.className += " is-wrong";
      }
      btn.addEventListener("click", function () { answerQuiz(choice); });
      choices.appendChild(btn);
    });
    feedback.textContent = quiz.answered
      ? (quiz.picked === quiz.item.id ? "Correct." : "That was " + quiz.item.label + ".")
      : "Pick the matching " + (quiz.item.kind === "word" ? "word" : quiz.item.kind) + ".";
    $("recog-next").hidden = !quiz.answered;
  }

  function renderRecall() {
    var stage = $("recall-prompt");
    var choices = $("recall-choices");
    var feedback = $("recall-feedback");
    var meta = $("recall-meta");
    if (!quiz || quiz.kind !== "recall") {
      meta.textContent = "A word or letter, then four handshapes.";
      stage.textContent = "";
      choices.innerHTML = "";
      feedback.textContent = "";
      $("recall-next").hidden = true;
      return;
    }
    if (!quiz.item) {
      meta.textContent = "Round done";
      stage.textContent = quiz.correct + " of " + quiz.queue.length;
      choices.innerHTML = "";
      feedback.textContent = "Correct this round.";
      $("recall-next").hidden = true;
      return;
    }
    meta.textContent = "Question " + (quiz.i + 1) + " of " + quiz.queue.length;
    stage.textContent = quiz.item.label;
    choices.innerHTML = "";
    quiz.choices.forEach(function (choice, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "asl-hand-choice";
      btn.setAttribute("aria-label", "Choice " + (idx + 1) + ". " + (quiz.answered ? choice.label + ". " : "") + choice.picture);
      var num = document.createElement("span");
      num.className = "n";
      num.textContent = String(idx + 1);
      var fig = document.createElement("span");
      fig.className = "fig";
      mountSvg(fig, choice, !quiz.answered, true);
      btn.appendChild(num);
      btn.appendChild(fig);
      if (quiz.answered) {
        btn.disabled = true;
        if (choice.id === quiz.item.id) btn.className += " is-right";
        else if (choice.id === quiz.picked) btn.className += " is-wrong";
      }
      btn.addEventListener("click", function () { answerQuiz(choice); });
      choices.appendChild(btn);
    });
    feedback.textContent = quiz.answered
      ? (quiz.picked === quiz.item.id ? "Correct." : "The match is highlighted.")
      : "Pick the handshape. Keys 1 to 4.";
    $("recall-next").hidden = !quiz.answered;
  }

  function startReader() {
    stopReader();
    var words = ASLSigns.spellWords;
    var word = words[Math.floor(Math.random() * words.length)];
    reader = { word: word, index: 0, playing: false, revealed: false, shown: false };
    renderReader();
  }

  function stopReader() {
    if (readerTimer) {
      clearTimeout(readerTimer);
      readerTimer = null;
    }
    if (reader) reader.playing = false;
  }

  function readerSpeed() {
    var input = $("reader-speed");
    var n = input ? parseFloat(input.value) : 1;
    if (!isFinite(n) || n < 0.35) n = 1;
    return n * 1000;
  }

  function playReader() {
    if (!reader) startReader();
    stopReader();
    reader.playing = true;
    reader.revealed = false;
    reader.index = 0;
    reader.shown = true;
    stepReader();
  }

  function stepReader() {
    if (!reader || !reader.playing) return;
    renderReader();
    if (reader.index >= reader.word.length - 1) {
      reader.playing = false;
      renderReader();
      var input = $("reader-input");
      if (input) input.focus();
      say("Type the word.");
      return;
    }
    readerTimer = window.setTimeout(function () {
      reader.index += 1;
      stepReader();
    }, readerSpeed());
  }

  function checkReader() {
    if (!reader) return;
    var typed = ($("reader-input").value || "").toUpperCase().replace(/[^A-Z]/g, "");
    var ok = typed === reader.word;
    reader.revealed = true;
    state.stats.readerAttempts += 1;
    if (ok) state.stats.readerCorrect += 1;
    touchDay();
    save();
    say(ok ? "Spelled correctly." : "The word was " + reader.word.split("").join(" ") + ".");
    renderReader();
  }

  function renderReader() {
    var stage = $("reader-stage");
    var slots = $("reader-slots");
    var feedback = $("reader-feedback");
    var speed = $("reader-speed");
    if (speed) $("reader-speed-val").textContent = Number(speed.value).toFixed(1) + " s";
    if (!reader) {
      stage.innerHTML = "";
      slots.textContent = "Press Play. A word is spelled one letter at a time.";
      feedback.textContent = "";
      return;
    }
    var ch = reader.word.charAt(reader.index);
    var sign = ASLSigns.byId["letter-" + ch.toLowerCase()];
    if (sign && reader.shown) mountSvg(stage, sign, !reader.revealed, false);
    else stage.innerHTML = "";
    slots.textContent = reader.word.split("").map(function (letter, i) {
      if (reader.revealed) return letter;
      if (reader.shown && i <= reader.index) return "·";
      return "_";
    }).join(" ");
    $("reader-play").setAttribute("aria-pressed", reader.playing ? "true" : "false");
    $("reader-play").textContent = reader.playing ? "Pause" : "Play";
    if (reader.revealed) {
      var typed = ($("reader-input").value || "").toUpperCase().replace(/[^A-Z]/g, "");
      feedback.textContent = typed === reader.word ? "Correct. " + reader.word : "That was " + reader.word + ".";
    } else {
      feedback.textContent = reader.shown
        ? ("Letter " + (reader.index + 1) + " of " + reader.word.length)
        : "Play spells the word. Then type it.";
    }
  }

  function startSpell() {
    var words = ASLSigns.spellWords;
    var word = words[Math.floor(Math.random() * words.length)];
    spell = { word: word, i: 0, choices: [], misses: 0, locked: false };
    dealSpell();
  }

  function dealSpell() {
    if (!spell) return;
    if (spell.i >= spell.word.length) {
      spell.choices = [];
      var clean = spell.misses === 0;
      state.stats.spellAttempts += 1;
      if (clean) state.stats.spellCorrect += 1;
      touchDay();
      save();
      say(clean ? "Spelled " + spell.word + " with no misses." : "Finished " + spell.word + ".");
      renderSpell();
      return;
    }
    var ch = spell.word.charAt(spell.i);
    var correct = ASLSigns.byId["letter-" + ch.toLowerCase()];
    spell.choices = pickChoices(correct, ASLSigns.letters, 4);
    spell.locked = false;
    renderSpell();
    say("Letter " + (spell.i + 1) + " of " + spell.word.length + ", " + ch);
  }

  function answerSpell(choice) {
    if (!spell || spell.locked || spell.i >= spell.word.length) return;
    var ch = spell.word.charAt(spell.i);
    var correct = ASLSigns.byId["letter-" + ch.toLowerCase()];
    if (choice.id !== correct.id) {
      spell.misses += 1;
      say(ch + " is a different handshape. Try again.");
      renderSpell(choice.id);
      return;
    }
    spell.locked = true;
    spell.i += 1;
    dealSpell();
  }

  function renderSpell(wrongId) {
    var wordEl = $("spell-word");
    var choices = $("spell-choices");
    var feedback = $("spell-feedback");
    var meta = $("spell-meta");
    if (!spell) {
      wordEl.textContent = "A word appears. Match each letter to its handshape.";
      choices.innerHTML = "";
      feedback.textContent = "";
      meta.textContent = "";
      return;
    }
    wordEl.innerHTML = "";
    spell.word.split("").forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "spell-letter" + (i < spell.i ? " is-done" : "") + (i === spell.i && spell.i < spell.word.length ? " is-now" : "");
      span.textContent = ch;
      wordEl.appendChild(span);
    });
    meta.textContent = spell.i >= spell.word.length
      ? "Done"
      : ("Letter " + (spell.i + 1) + " of " + spell.word.length);
    choices.innerHTML = "";
    if (spell.i >= spell.word.length) {
      feedback.textContent = spell.misses
        ? ("Finished " + spell.word + " with " + spell.misses + " missed picks.")
        : ("Finished " + spell.word + " with no misses.");
      return;
    }
    spell.choices.forEach(function (choice, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "asl-hand-choice";
      btn.setAttribute("aria-label", "Choice " + (idx + 1) + ". " + choice.picture);
      var num = document.createElement("span");
      num.className = "n";
      num.textContent = String(idx + 1);
      var fig = document.createElement("span");
      fig.className = "fig";
      mountSvg(fig, choice, true, true);
      btn.appendChild(num);
      btn.appendChild(fig);
      if (wrongId && choice.id === wrongId) btn.className += " is-wrong";
      btn.addEventListener("click", function () { answerSpell(choice); });
      choices.appendChild(btn);
    });
    feedback.textContent = "Choose the handshape for the highlighted letter.";
  }

  function pct(part, total) {
    if (!total) return "—";
    return Math.round((100 * part) / total) + "%";
  }

  function renderProgress() {
    var stats = state.stats;
    var rows = [
      ["Streak", stats.streak + (stats.streak === 1 ? " day" : " days")],
      ["Best streak", stats.bestStreak + (stats.bestStreak === 1 ? " day" : " days")],
      ["Last practice", stats.lastDay || "Not yet"],
      ["Card reviews", String(stats.reviews)],
      ["Card accuracy", pct(stats.correct, stats.reviews)],
      ["Quiz accuracy", pct(stats.quizCorrect, stats.quizAnswered)],
      ["Reader", stats.readerCorrect + " / " + stats.readerAttempts],
      ["Spell-it", stats.spellCorrect + " / " + stats.spellAttempts],
      ["Cards seen", Object.keys(state.boxes).length + " / " + ASLSigns.all.length]
    ];
    var dl = $("asl-progress-stats");
    dl.innerHTML = "";
    rows.forEach(function (row) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      dd.textContent = row[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      dl.appendChild(wrap);
    });
    paintBoxes();
  }

  function paintMini() {
    var el = $("asl-mini");
    if (!el || !state) return;
    var due = ASLSigns.all.filter(function (s) { return isDue(s.id); }).length;
    el.textContent = "Streak " + state.stats.streak + " · Due " + due + " · Reviews " + state.stats.reviews;
  }

  function exportText() {
    return (
      "ASL trainer progress — stevenphilley.com\n" +
      "Saved " + new Date().toISOString() + "\n" +
      "This file stays on your computer. The site does not receive it.\n" +
      "---\n" +
      JSON.stringify(state, null, 2) + "\n"
    );
  }

  function downloadProgress() {
    var blob = new Blob([exportText()], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "asl-trainer-progress.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    say("Progress file downloaded.");
  }

  function applyImport(text) {
    var start = text.indexOf("{");
    var end = text.lastIndexOf("}");
    if (start < 0 || end < start) throw new Error("No JSON object in that file.");
    var data = JSON.parse(text.slice(start, end + 1));
    if (!data || data.version !== 1 || typeof data.boxes !== "object" || typeof data.stats !== "object") {
      throw new Error("That file is not an ASL trainer progress file.");
    }
    state = data;
    save();
    roundSeen = {};
    card = null;
    cardQueue = [];
    renderLearn();
    renderCards();
    renderProgress();
    say("Progress loaded.");
  }

  function resetAll() {
    state = freshState();
    try { localStorage.removeItem(KEY); } catch (e) {}
    roundSeen = {};
    card = null;
    cardQueue = [];
    quiz = null;
    reader = null;
    spell = null;
    save();
    renderLearn();
    renderCards();
    renderQuiz();
    renderProgress();
    say("Progress erased on this browser.");
  }

  function onKey(ev) {
    var tag = (ev.target && ev.target.tagName) || "";
    var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (ev.target && ev.target.isContentEditable);
    if (ev.key === "Escape") return;
    if (!typing && (ev.key === "?" || (ev.shiftKey && ev.key === "/"))) {
      ev.preventDefault();
      openHelp();
      return;
    }
    if (typing) return;
    if (helpOpen()) return;
    if (mode === "learn" && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")) {
      ev.preventDefault();
      stepLearn(ev.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (mode === "cards") {
      if (ev.key === " " || ev.key === "Enter") {
        if (!cardFlipped && card) {
          ev.preventDefault();
          cardFlipped = true;
          renderCards();
          say(card.label + ". " + card.handshape);
        }
        return;
      }
      if (cardFlipped && (ev.key === "1" || ev.key === "2")) {
        ev.preventDefault();
        gradeCard(ev.key === "2");
      }
      return;
    }
    if (mode === "quiz" && (quizKind === "recognize" || quizKind === "recall" || quizKind === "spell")) {
      var n = parseInt(ev.key, 10);
      if (n >= 1 && n <= 4) {
        var buttons = document.querySelectorAll(
          quizKind === "recognize" ? "#recog-choices .asl-choice" :
          quizKind === "recall" ? "#recall-choices .asl-hand-choice" :
          "#spell-choices .asl-hand-choice"
        );
        var btn = buttons[n - 1];
        if (btn && !btn.disabled) {
          ev.preventDefault();
          btn.click();
        }
      }
    }
  }

  var helpBtn, helpDialog, helpPrev, helpLock;

  function helpOpen() {
    return helpDialog && !helpDialog.hidden;
  }

  function focusables(root) {
    return [].slice.call(root.querySelectorAll("button, a[href], input, select, textarea")).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }

  function openHelp() {
    if (!helpDialog || helpOpen()) return;
    helpPrev = document.activeElement;
    helpDialog.hidden = false;
    helpBtn.setAttribute("aria-expanded", "true");
    helpLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    var closer = helpDialog.querySelector("[data-help-close]");
    if (closer) closer.focus();
  }

  function closeHelp() {
    if (!helpDialog || !helpOpen()) return;
    helpDialog.hidden = true;
    helpBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = helpLock;
    var back = helpPrev;
    helpPrev = null;
    if (back && typeof back.focus === "function") back.focus();
    else helpBtn.focus();
  }

  function wireHelp() {
    helpBtn = $("asl-help");
    helpDialog = $("asl-help-dialog");
    if (!helpBtn || !helpDialog) return;
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
      if (!helpOpen()) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeHelp();
        return;
      }
      if (ev.key !== "Tab") return;
      var nodes = focusables(helpDialog);
      if (!nodes.length) {
        ev.preventDefault();
        return;
      }
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

  function wireReset() {
    var dialog = $("asl-reset-dialog");
    var openBtn = $("asl-reset");
    if (!dialog || !openBtn) return;
    function close() {
      dialog.hidden = true;
      openBtn.focus();
    }
    openBtn.addEventListener("click", function () {
      dialog.hidden = false;
      var cancel = dialog.querySelector("[data-reset-close]");
      if (cancel) cancel.focus();
    });
    dialog.querySelectorAll("[data-reset-close]").forEach(function (b) {
      b.addEventListener("click", close);
    });
    $("asl-reset-yes").addEventListener("click", function () {
      dialog.hidden = true;
      resetAll();
    });
    dialog.addEventListener("click", function (ev) {
      if (ev.target === dialog) close();
    });
  }

  function checkData() {
    var bad = ASLSigns.all.filter(function (s) { return !ASLHands.supports(s.draw); });
    if (bad.length && window.console && console.error) {
      console.error("ASL drawings missing for " + bad.map(function (s) { return s.id; }).join(", "));
    }
  }

  function boot() {
    if (!window.ASLSigns || !window.ASLHands) return;
    reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) document.documentElement.setAttribute("data-asl-motion", "reduce");
    checkData();
    state = load();
    document.querySelectorAll("[data-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () { setMode(btn.getAttribute("data-mode"), true); });
    });
    $("asl-mode-select").addEventListener("change", function () {
      setMode($("asl-mode-select").value, true);
    });
    document.querySelectorAll("[data-group]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        learnGroup = btn.getAttribute("data-group");
        learnIndex = 0;
        renderLearn();
      });
    });
    document.querySelectorAll("[data-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        learnCat = btn.getAttribute("data-cat");
        learnIndex = 0;
        renderLearn();
      });
    });
    $("asl-filter").addEventListener("input", function () {
      learnFilter = $("asl-filter").value;
      learnIndex = 0;
      renderLearn();
    });
    $("asl-prev").addEventListener("click", function () { stepLearn(-1); });
    $("asl-next").addEventListener("click", function () { stepLearn(1); });
    $("asl-flip").addEventListener("click", function () {
      if (!card) return;
      cardFlipped = true;
      renderCards();
      say(card.label + ". " + card.handshape);
    });
    $("asl-know").addEventListener("click", function () { gradeCard(true); });
    $("asl-again").addEventListener("click", function () { gradeCard(false); });
    $("asl-deck").addEventListener("change", function () {
      deck = $("asl-deck").value;
      card = null;
      cardQueue = [];
      roundSeen = {};
      renderCards();
    });
    $("asl-card-next-round").addEventListener("click", function () {
      roundSeen = {};
      card = null;
      cardQueue = [];
      renderCards();
    });
    document.querySelectorAll("[data-quiz]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        quizKind = btn.getAttribute("data-quiz");
        quiz = null;
        stopReader();
        if (quizKind === "reader") startReader();
        if (quizKind === "spell") startSpell();
        renderQuiz();
      });
    });
    $("recog-start").addEventListener("click", function () { quizKind = "recognize"; startQuizRound(); });
    $("recall-start").addEventListener("click", function () { quizKind = "recall"; startQuizRound(); });
    $("recog-next").addEventListener("click", function () {
      if (!quiz) return;
      quiz.i += 1;
      askQuiz();
    });
    $("recall-next").addEventListener("click", function () {
      if (!quiz) return;
      quiz.i += 1;
      askQuiz();
    });
    $("reader-play").addEventListener("click", function () {
      if (reader && reader.playing) stopReader();
      else playReader();
      renderReader();
    });
    $("reader-new").addEventListener("click", function () {
      $("reader-input").value = "";
      startReader();
    });
    $("reader-check").addEventListener("click", checkReader);
    $("reader-input").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        checkReader();
      }
    });
    $("reader-speed").addEventListener("input", renderReader);
    $("spell-start").addEventListener("click", startSpell);
    $("asl-save").addEventListener("click", downloadProgress);
    $("asl-load").addEventListener("change", function () {
      var file = $("asl-load").files && $("asl-load").files[0];
      $("asl-load").value = "";
      if (!file) return;
      var readerFile = new FileReader();
      readerFile.onload = function () {
        try { applyImport(String(readerFile.result || "")); }
        catch (err) { say(err.message || "Could not read that file."); }
      };
      readerFile.readAsText(file);
    });
    document.addEventListener("keydown", onKey);
    wireHelp();
    wireReset();
    var stage = $("asl-stage");
    if (stage) stage.tabIndex = -1;
    setMode("learn");
    paintMini();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
