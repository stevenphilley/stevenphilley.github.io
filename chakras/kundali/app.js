/*! Kundali matching page. All calculation stays in the browser. */
(function () {
  "use strict";

  var K = window.KundaliKoota;
  var E = window.KundaliEphem;
  var STORE = "sp-kundali-match";

  var ALIASES = {
    bombay: "mumbai",
    calcutta: "kolkata",
    madras: "chennai",
    benares: "varanasi",
    banaras: "varanasi",
    poona: "pune",
    trivandrum: "thiruvananthapuram",
    baroda: "vadodara",
    bangalore: "bengaluru",
    bengalore: "bengaluru",
    mysore: "mysuru",
    calicut: "kozhikode",
    trichur: "thrissur",
    trichy: "tiruchirappalli",
    cannanore: "kannur",
    tindivanam: "tindivanam"
  };

  var cities = [];
  var tzNames = [];
  var citiesReady = false;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pointsText(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return n.toFixed(1);
  }

  function cityLabel(c) {
    var label = c[0] + ", " + c[1];
    if (c.length > 5 && c[5]) label += " · " + c[5];
    return label;
  }

  function cityRecord(c) {
    return {
      name: c[0],
      cc: c[1],
      lat: c[2],
      lon: c[3],
      tz: tzNames[c[4]],
      admin: c[5] || "",
      label: cityLabel(c)
    };
  }

  function searchCities(q) {
    q = String(q || "").trim().toLowerCase();
    if (q.length < 2) return [];
    var alias = ALIASES[q] || "";
    var hits = [];
    for (var i = 0; i < cities.length; i++) {
      var name = cities[i][0].toLowerCase();
      if (name.indexOf(q) !== -1 || (alias && name.indexOf(alias) !== -1)) hits.push(cities[i]);
    }
    hits.sort(function (a, b) {
      var aq = a[0].toLowerCase();
      var bq = b[0].toLowerCase();
      var as = aq.indexOf(q) === 0 || (alias && aq.indexOf(alias) === 0) ? 0 : 1;
      var bs = bq.indexOf(q) === 0 || (alias && bq.indexOf(alias) === 0) ? 0 : 1;
      return as - bs;
    });
    return hits.slice(0, 12);
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function personRoot(who) {
    return document.querySelector('[data-who="' + who + '"]');
  }

  function field(who, name) {
    return personRoot(who).querySelector('[data-field="' + name + '"]');
  }

  function fillNakshatras() {
    ["A", "B"].forEach(function (who) {
      var sel = field(who, "nak");
      K.NAKSHATRA_NAMES.forEach(function (name, i) {
        var opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = (i + 1) + ". " + name;
        sel.appendChild(opt);
      });
    });
  }

  function setMode(who) {
    var mode = personRoot(who).querySelector('input[data-field="mode"]:checked').value;
    personRoot(who).setAttribute("data-mode", mode);
  }

  function setPlaceMode(who) {
    var mode = personRoot(who).querySelector('input[data-field="placeMode"]:checked').value;
    personRoot(who).setAttribute("data-place", mode);
  }

  function renderCityList(who, query) {
    var list = field(who, "city-list");
    var hits = searchCities(query);
    list.innerHTML = "";
    if (!hits.length) {
      list.hidden = true;
      return;
    }
    hits.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "city-opt";
      btn.textContent = cityLabel(c);
      btn.addEventListener("click", function () {
        chooseCity(who, c);
      });
      list.appendChild(btn);
    });
    list.hidden = false;
  }

  function chooseCity(who, c) {
    var rec = cityRecord(c);
    field(who, "city").value = rec.label;
    field(who, "city").dataset.picked = JSON.stringify(rec);
    field(who, "city-list").hidden = true;
    schedule();
  }

  function pickedCity(who) {
    var raw = field(who, "city").dataset.picked || "";
    if (!raw) return null;
    try {
      var rec = JSON.parse(raw);
      if (field(who, "city").value.trim() !== rec.label) return null;
      return rec;
    } catch (e) {
      return null;
    }
  }

  function groomWho() {
    var el = document.querySelector('input[name="groom"]:checked');
    return el ? el.value : "A";
  }

  function readPerson(who) {
    var root = personRoot(who);
    var mode = root.querySelector('input[data-field="mode"]:checked').value;
    var placeMode = root.querySelector('input[data-field="placeMode"]:checked').value;
    return {
      who: who,
      name: field(who, "name").value.trim(),
      mode: mode,
      date: field(who, "date").value,
      time: field(who, "time").value,
      placeMode: placeMode,
      cityQuery: field(who, "city").value.trim(),
      city: pickedCity(who),
      lat: field(who, "lat").value.trim(),
      lon: field(who, "lon").value.trim(),
      offset: field(who, "offset").value.trim(),
      nak: field(who, "nak").value,
      pada: field(who, "pada").value
    };
  }

  function persist() {
    var box = document.getElementById("remember");
    if (!box.checked) {
      try { localStorage.removeItem(STORE); } catch (e) {}
      return;
    }
    var data = { remember: true, groom: groomWho(), people: { A: readPerson("A"), B: readPerson("B") } };
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {}
  }

  function applyPerson(who, data) {
    if (!data) return;
    field(who, "name").value = data.name || "";
    var mode = data.mode === "nakshatra" ? "nakshatra" : "birth";
    personRoot(who).querySelector('input[data-field="mode"][value="' + mode + '"]').checked = true;
    setMode(who);
    field(who, "date").value = data.date || "";
    field(who, "time").value = data.time || "";
    var placeMode = data.placeMode === "manual" ? "manual" : "city";
    personRoot(who).querySelector('input[data-field="placeMode"][value="' + placeMode + '"]').checked = true;
    setPlaceMode(who);
    field(who, "city").value = data.cityQuery || (data.city && data.city.label) || "";
    if (data.city && data.city.tz) {
      field(who, "city").dataset.picked = JSON.stringify(data.city);
      if (!field(who, "city").value) field(who, "city").value = data.city.label;
    } else {
      delete field(who, "city").dataset.picked;
    }
    field(who, "lat").value = data.lat || "";
    field(who, "lon").value = data.lon || "";
    field(who, "offset").value = data.offset || "";
    if (data.nak != null && data.nak !== "") field(who, "nak").value = String(data.nak);
    if (data.pada) field(who, "pada").value = String(data.pada);
  }

  function restore() {
    var raw = null;
    try { raw = localStorage.getItem(STORE); } catch (e) {}
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      if (!data || !data.remember) return false;
      document.getElementById("remember").checked = true;
      if (data.groom === "B") document.getElementById("groom-b").checked = true;
      applyPerson("A", data.people && data.people.A);
      applyPerson("B", data.people && data.people.B);
      return true;
    } catch (e) {
      return false;
    }
  }

  function findCityByName(name) {
    var q = name.toLowerCase();
    for (var i = 0; i < cities.length; i++) {
      if (cities[i][0].toLowerCase() === q) return cities[i];
    }
    return null;
  }

  function fillExample() {
    document.getElementById("groom-a").checked = true;
    ["A", "B"].forEach(function (who) {
      personRoot(who).querySelector('input[data-field="mode"][value="birth"]').checked = true;
      setMode(who);
      personRoot(who).querySelector('input[data-field="placeMode"][value="city"]').checked = true;
      setPlaceMode(who);
    });
    field("A", "name").value = "A. Rao";
    field("A", "date").value = "1990-08-15";
    field("A", "time").value = "06:40";
    field("B", "name").value = "B. Iyer";
    field("B", "date").value = "1992-03-22";
    field("B", "time").value = "21:05";
    var mumbai = findCityByName("Mumbai");
    var chennai = findCityByName("Chennai");
    if (mumbai) chooseCity("A", mumbai);
    if (chennai) chooseCity("B", chennai);
    document.getElementById("remember").checked = false;
    try { localStorage.removeItem(STORE); } catch (e) {}
  }

  function parseClock(value) {
    var m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value || "");
    if (!m) return null;
    var h = +m[1];
    var min = +m[2];
    var sec = +(m[3] || 0);
    if (h > 23 || min > 59 || sec > 59) return null;
    return { h: h, min: min, sec: sec };
  }

  function parseDate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!m) return null;
    var y = +m[1];
    var mo = +m[2];
    var d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1 || y > 9999) return null;
    return { y: y, m: mo, d: d };
  }

  function formatOffset(seconds) {
    var sign = seconds < 0 ? "−" : "+";
    var a = Math.abs(seconds);
    var h = Math.floor(a / 3600);
    var m = Math.floor((a % 3600) / 60);
    var s = a % 60;
    var text = "UTC" + sign + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    if (s) text += ":" + String(s).padStart(2, "0");
    return text;
  }

  function resolveInstant(person) {
    var date = parseDate(person.date);
    var clock = parseClock(person.time);
    if (!date || !clock) return { error: "Enter a birth date and time." };
    if (person.placeMode === "city") {
      if (!person.city) return { error: "Choose a city from the list, or switch to latitude and longitude." };
      var wall = E.wallTimeToUtc(date.y, date.m, date.d, clock.h, clock.min, clock.sec, person.city.tz);
      if (!wall.exists) {
        return { error: "That clock time does not exist in " + person.city.tz + " (a daylight-saving gap). Move it by an hour." };
      }
      return {
        date: wall.date,
        placeLabel: person.city.label,
        tz: person.city.tz,
        lat: person.city.lat,
        lon: person.city.lon,
        ambiguous: wall.ambiguous,
        offsetText: formatOffset(wall.offsetSeconds)
      };
    }
    var lat = Number(person.lat);
    var lon = Number(person.lon);
    var off = E.parseOffset(person.offset);
    if (!isFinite(lat) || lat < -90 || lat > 90) return { error: "Latitude must be a number from −90 to 90." };
    if (!isFinite(lon) || lon < -180 || lon > 180) return { error: "Longitude must be a number from −180 to 180, east positive." };
    if (off == null) return { error: "Enter a UTC offset such as +05:30 or -4." };
    return {
      date: E.utcFromOffset(date.y, date.m, date.d, clock.h, clock.min, clock.sec, off),
      placeLabel: lat.toFixed(4) + "°, " + lon.toFixed(4) + "°",
      tz: "manual offset " + person.offset.trim(),
      lat: lat,
      lon: lon,
      ambiguous: false,
      offsetText: (off >= 0 ? "UTC+" : "UTC") + String(off)
    };
  }

  function hasClock(person) {
    return !!(person.date && person.time && (person.placeMode === "manual" ? person.lat && person.lon && person.offset : person.city));
  }

  function buildChart(person) {
    var note = "";
    var instant = null;
    var sky = null;
    var chart;
    if (person.mode === "nakshatra") {
      if (person.nak === "" || person.pada === "") return { error: "Choose a nakshatra and a pada." };
      chart = K.chartFromNakPada(+person.nak, +person.pada);
      if (hasClock(person)) {
        instant = resolveInstant(person);
        if (instant.error) return instant;
        sky = E.sky(instant.date);
        note = "The kootas use the nakshatra and pada you entered. The sky position is shown beside them and is not used for the score.";
      }
    } else {
      instant = resolveInstant(person);
      if (instant.error) return instant;
      sky = E.sky(instant.date);
      chart = K.chartFromLongitude(sky.moon.sidereal);
    }
    var lagna = null;
    var marsSign = null;
    var venusSign = null;
    if (instant && sky) {
      lagna = E.ascendant(instant.date, instant.lat, instant.lon);
      marsSign = K.placement(sky.mars.sidereal).rashi;
      venusSign = K.placement(sky.venus.sidereal).rashi;
    }
    return { person: person, chart: chart, instant: instant, sky: sky, lagna: lagna, marsSign: marsSign, venusSign: venusSign, note: note };
  }

  function personTitle(built, role) {
    var name = built.person.name || ("Person " + built.person.who);
    return name + " · " + role;
  }

  function renderFacts(built) {
    var c = built.chart;
    var rows = [
      ["Moon sign", c.rashiName + " (" + c.rashiSanskrit + ")"],
      ["Nakshatra", c.nakshatra + ", pada " + c.pada],
      ["Nakshatra lord", c.nakshatraLord],
      ["Gana", c.gana],
      ["Yoni", c.yoni + ", " + c.yoniGender],
      ["Nadi", c.nadi],
      ["Varna", c.varna],
      ["Vashya", c.vashya]
    ];
    return rows.map(function (row) {
      return "<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>";
    }).join("");
  }

  function renderVashyaSplit(built, other, builtIsBride) {
    var split = built.chart.vashyaSplit;
    if (!split) return "";
    var altName = built.chart.vashya === split.above ? split.below : split.above;
    var alt = Object.assign({}, built.chart, { vashya: altName });
    var altMatch = builtIsBride ? K.match(other.chart, alt) : K.match(alt, other.chart);
    var who = built.person.name || ("Person " + built.person.who);
    return "<p>" + esc(who) + "’s pada crosses a vashya half-sign (" + esc(split.note) +
      "). The score uses " + esc(built.chart.vashya) + ". The other class, " + esc(altName) +
      ", would make the total <strong>" + pointsText(altMatch.total) + "</strong> / 36.</p>";
  }

  function renderBoundary(built, other, builtIsBride) {
    if (!built.sky || built.chart.source !== "longitude") return "";
    var warnings = K.boundaryWarnings(built.chart.lon);
    if (!warnings.length) return "";
    var who = built.person.name || ("Person " + built.person.who);
    return warnings.map(function (w) {
      var alt = K.chartFromLongitude(w.other.lon);
      var altMatch = builtIsBride ? K.match(other.chart, alt) : K.match(alt, other.chart);
      var dist = w.dist < 0.005 ? "essentially on" : w.dist.toFixed(3) + "° from";
      var moved = alt.nakshatra + " pada " + alt.pada + ", " + alt.rashiName;
      if (alt.vashya !== built.chart.vashya) moved += ", vashya " + alt.vashya;
      return "<p>" + esc(who) + "’s Moon is " + dist + " a " + esc(w.kinds.join(" / ")) +
        " boundary" + (w.note ? " (" + esc(w.note) + ")" : "") +
        ". A small error in the birth time can move it to " + esc(moved) +
        ". Holding the other person fixed, that total would be <strong>" +
        pointsText(altMatch.total) + "</strong> / 36.</p>";
    }).join("");
  }

  function renderWorking(built) {
    var c = built.chart;
    var lines = [];
    lines.push("<h3>" + esc(built.person.name || ("Person " + built.person.who)) + "</h3>");
    if (built.instant) {
      lines.push("<p>Local time taken as " + esc(built.person.date) + " " + esc(built.person.time) +
        " at " + esc(built.instant.placeLabel) + " (" + esc(built.instant.tz) + "), " +
        esc(built.instant.offsetText) + ". UTC " + esc(built.instant.date.toISOString()) + "." +
        (built.instant.ambiguous ? " That local time occurred twice; the earlier instant is used." : "") +
        "</p>");
    }
    if (built.note) lines.push("<p>" + esc(built.note) + "</p>");
    if (built.sky) {
      var ayan = built.sky.ayanamsa;
      lines.push("<p>Tropical Moon " + esc(E.formatDMS(built.sky.moon.tropical)) +
        ". Lahiri ayanamsa " + esc(E.formatDMS(ayan.trueDeg)) +
        " (mean " + esc(E.formatDMS(ayan.meanDeg)) + ", nutation " +
        esc((ayan.nutationDeg * 3600).toFixed(2)) + "″). Sidereal Moon " +
        esc(E.formatDMS(built.sky.moon.sidereal)) + ".</p>");
      lines.push("<p>Mars sidereal " + esc(E.formatDMS(built.sky.mars.sidereal)) +
        " (" + esc(K.RASHI_NAMES[built.marsSign]) + "). Venus sidereal " +
        esc(E.formatDMS(built.sky.venus.sidereal)) +
        " (" + esc(K.RASHI_NAMES[built.venusSign]) + ").</p>");
    }
    if (built.lagna) {
      lines.push("<p>Greenwich apparent sidereal time " + built.lagna.gastHours.toFixed(5) +
        " h. RAMC " + esc(E.formatDMS(built.lagna.ramcDeg)) +
        ". True obliquity " + built.lagna.obliquityDeg.toFixed(5) +
        "°. Tropical ascendant " + esc(E.formatDMS(built.lagna.tropicalLon)) +
        ". Sidereal ascendant " + esc(E.formatDMS(built.lagna.siderealLon)) +
        " (" + esc(K.RASHI_NAMES[K.placement(built.lagna.siderealLon).rashi]) + ").</p>");
    }
    lines.push("<p>Sidereal longitude used for the kootas: " + esc(E.formatDMS(c.lon)) +
      " → nakshatra " + (c.nak + 1) + " " + esc(c.nakshatra) +
      ", pada " + c.pada + ", sign " + esc(c.rashiName) +
      ". Lord " + esc(c.nakshatraLord) + ", gana " + esc(c.gana) +
      ", yoni " + esc(c.yoni) + " (" + esc(c.yoniGender) + "), nadi " + esc(c.nadi) +
      ", varna " + esc(c.varna) + ", vashya " + esc(c.vashya) + ".</p>");
    return lines.join("");
  }

  function renderManglik(a, b, groomWhoId) {
    var blocks = [];
    [a, b].forEach(function (built) {
      if (!built.lagna) {
        blocks.push("<p><strong>" + esc(built.person.name || ("Person " + built.person.who)) +
          ".</strong> Manglik is not computed — birth time and place are needed for the ascendant.</p>");
        return;
      }
      var report = K.manglikReport({
        lagnaRashi: K.placement(built.lagna.siderealLon).rashi,
        moonRashi: built.chart.rashi,
        venusRashi: built.venusSign,
        marsRashi: built.marsSign
      });
      built.manglik = report;
      var bits = [report.fromLagna, report.fromMoon, report.fromVenus].map(function (ref) {
        var extra = ref.exception ? " " + ref.exception + " The house is still reported." : "";
        return ref.from + " house " + ref.house + (ref.manglik ? " — in 1, 2, 4, 7, 8, or 12." : " — not one of those houses.") + extra;
      }).join(" ");
      blocks.push("<p><strong>" + esc(built.person.name || ("Person " + built.person.who)) +
        ".</strong> Mars in " + esc(report.marsSign) + ". " + esc(bits) +
        " Common reading (Lagna or Moon): <strong>" + (report.manglik ? "Manglik" : "not Manglik") + "</strong>." +
        (report.fromVenus.manglik && !report.manglik ? " Venus alone would flag it; that reference is shown and is not required for the common flag." : "") +
        "</p>");
    });
    if (a.manglik && b.manglik) {
      var both = a.manglik.manglik && b.manglik.manglik;
      var one = a.manglik.manglik !== b.manglik.manglik;
      blocks.push("<p class=\"mutual\">Mutual rule: " + (both
        ? "both are Manglik by the Lagna-or-Moon reading, so the dosha is traditionally treated as cancelled for the match."
        : one
          ? "only one person is Manglik by that reading, so the usual mutual cancellation does not apply."
          : "neither is Manglik by that reading.") + "</p>");
    }
    return blocks.join("");
  }

  function render(a, b) {
    var groomId = groomWho();
    var groom = groomId === "A" ? a : b;
    var bride = groomId === "A" ? b : a;
    var result = K.match(groom.chart, bride.chart);
    var box = document.getElementById("result");
    var rows = K.KOOTA_META.map(function (meta) {
      var part = result.parts[meta.id];
      return "<tr><th scope=\"row\">" + esc(meta.name) + "</th><td class=\"num\">" +
        pointsText(part.points) + " / " + meta.max + "</td><td>" + esc(meta.about) + "</td></tr>";
    }).join("");
    var cancel = result.cancellations.length
      ? "<ul>" + result.cancellations.map(function (c) {
        return "<li><strong>" + esc(c.koota) + ".</strong> " + esc(c.rule) + " This is not added back into the " + pointsText(result.total) + ".</li>";
      }).join("") + "</ul>"
      : "<p>No Nadi or Bhakoot dosha in the raw score, so no cancellation is in play.</p>";
    var showManglik = !!(a.lagna || b.lagna);
    var boundary = renderBoundary(groom, bride, false) + renderBoundary(bride, groom, true) +
      renderVashyaSplit(groom, bride, false) + renderVashyaSplit(bride, groom, true);
    box.innerHTML =
      "<section class=\"score\" aria-label=\"Score\">" +
      "<p class=\"score-kicker\">Ashtakoota · " + esc(result.band.range) + "</p>" +
      "<p class=\"score-num\"><span>" + pointsText(result.total) + "</span> <small>/ 36</small></p>" +
      "<p class=\"score-band\">" + esc(result.band.label) + "</p>" +
      "<div class=\"bar\" role=\"img\" aria-label=\"" + pointsText(result.total) + " out of 36\"><span style=\"width:" + (result.total / 36 * 100) + "%\"></span></div>" +
      "<p class=\"score-read\">" + esc(bandSentence(result)) + "</p>" +
      "</section>" +
      "<table class=\"kootas\"><caption>The eight kootas</caption><thead><tr><th scope=\"col\">Koota</th><th scope=\"col\">Points</th><th scope=\"col\">What it is traditionally taken to describe</th></tr></thead><tbody>" +
      rows + "</tbody></table>" +
      "<div class=\"pair\">" +
      "<article><h2>" + esc(personTitle(groom, "groom")) + "</h2><dl>" + renderFacts(groom) + "</dl></article>" +
      "<article><h2>" + esc(personTitle(bride, "bride")) + "</h2><dl>" + renderFacts(bride) + "</dl></article>" +
      "</div>" +
      (boundary ? "<aside class=\"warn\"><h2>Near a boundary</h2>" + boundary + "</aside>" : "") +
      "<section class=\"exceptions\"><h2>Exceptions and cancellations</h2><p>These are the usual Nadi and Bhakoot exceptions. They are listed on their own. The score above is the raw table score.</p>" + cancel + "</section>" +
      (showManglik ? "<section class=\"manglik\"><h2>Manglik (Kuja) dosha</h2>" + renderManglik(a, b, groomId) + "</section>" : "") +
      "<details class=\"working\"><summary>Show the working</summary>" +
      renderWorking(groom) + renderWorking(bride) +
      "<h3>Table lookups</h3><ul>" +
      K.KOOTA_META.map(function (meta) {
        return "<li><strong>" + esc(meta.name) + " " + pointsText(result.parts[meta.id].points) + "/" + meta.max + ".</strong> " + esc(result.parts[meta.id].detail) + "</li>";
      }).join("") +
      "</ul></details>";
    box.hidden = false;
    box.setAttribute("data-ready", "1");
  }

  function bandSentence(result) {
    if (result.band.id === "low") return "Under 18 is the traditional line, repeated from Muhurta Chintamani, below which a match was not recommended.";
    if (result.band.id === "average") return "18 to 24 is the average band in the scale used by contemporary North Indian panchangs: acceptable, not distinguished.";
    if (result.band.id === "good") return "25 to 32 is the good band on that scale.";
    return "33 to 36 is the excellent band on that scale.";
  }

  function setMessages(aMsg, bMsg, formMsg) {
    field("A", "msg").textContent = aMsg || "";
    field("B", "msg").textContent = bMsg || "";
    document.getElementById("form-msg").textContent = formMsg || "";
  }

  function calculate() {
    var box = document.getElementById("result");
    box.removeAttribute("data-ready");
    var aIn = readPerson("A");
    var bIn = readPerson("B");
    var a = buildChart(aIn);
    var b = buildChart(bIn);
    if (a.error || b.error) {
      box.hidden = true;
      box.innerHTML = "";
      setMessages(a.error || "", b.error || "", "");
      return;
    }
    setMessages("", "", "");
    render(a, b);
    persist();
  }

  var timer = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(calculate, 60);
  }

  function wirePerson(who) {
    personRoot(who).addEventListener("input", function (ev) {
      var t = ev.target;
      if (t.dataset.field === "city") {
        delete t.dataset.picked;
        renderCityList(who, t.value);
      }
      schedule();
    });
    personRoot(who).addEventListener("change", function (ev) {
      if (ev.target.dataset.field === "mode") setMode(who);
      if (ev.target.dataset.field === "placeMode") setPlaceMode(who);
      schedule();
    });
    personRoot(who).addEventListener("focusout", function () {
      setTimeout(function () { field(who, "city-list").hidden = true; }, 180);
    });
  }

  function init() {
    fillNakshatras();
    setMode("A");
    setMode("B");
    setPlaceMode("A");
    setPlaceMode("B");
    wirePerson("A");
    wirePerson("B");
    document.querySelectorAll('input[name="groom"]').forEach(function (el) {
      el.addEventListener("change", schedule);
    });
    document.getElementById("remember").addEventListener("change", function () {
      if (!document.getElementById("remember").checked) {
        try { localStorage.removeItem(STORE); } catch (e) {}
      } else {
        persist();
      }
    });
    document.getElementById("match-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      calculate();
    });
    document.getElementById("example").addEventListener("click", function () {
      if (!citiesReady) return;
      fillExample();
      calculate();
    });
    var help = document.getElementById("help");
    document.getElementById("help-open").addEventListener("click", function () {
      if (help.showModal) help.showModal();
      else help.setAttribute("open", "");
    });
    fetch("/chakras/kundali/cities.json")
      .then(function (res) { if (!res.ok) throw new Error("cities"); return res.json(); })
      .then(function (data) {
        tzNames = data.tz;
        cities = data.cities;
        citiesReady = true;
        var params = new URLSearchParams(location.search);
        if (params.get("example") === "1") {
          fillExample();
          calculate();
        } else if (restore()) {
          calculate();
        }
      })
      .catch(function () {
        document.getElementById("form-msg").textContent = "The city list did not load. You can still enter latitude, longitude, and a UTC offset.";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
