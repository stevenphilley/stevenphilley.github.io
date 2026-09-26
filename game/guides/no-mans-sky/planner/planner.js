/*! planner.js — craft search, raw bill, and moodboard pins. */
(function () {
  "use strict";

  var listEl = document.getElementById("pins");
  var statusEl = document.getElementById("status");
  var countEl = document.getElementById("m-pins");
  var findEl = document.getElementById("find");
  var qtyEl = document.getElementById("qty");
  var matchesEl = document.getElementById("matches");
  var billEl = document.getElementById("bill");
  var useBillEl = document.getElementById("use-bill");
  var catalog = null;
  var materials = null;
  var focusId = "";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function units(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function qty() {
    var n = Number(qtyEl && qtyEl.value);
    return n > 0 && n === (n | 0) ? n : 1;
  }

  function byName(a, b) {
    var an = (a.name || a.id || "").toLowerCase();
    var bn = (b.name || b.id || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  }

  function nameOf(id) {
    var node = materials && materials[id];
    return node ? node.name : id;
  }

  function readPins() {
    function read(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        return null;
      }
    }
    return read(NmsRefine.PIN_KEY) || read(NmsRefine.PIN_KEY_LEGACY) || [];
  }

  function currentPins() {
    var pins = [];
    var seen = Object.create(null);
    readPins().forEach(function (id) {
      id = NmsRefine.canonId(id);
      if (!materials[id] || seen[id]) return;
      seen[id] = true;
      pins.push(id);
    });
    return pins;
  }

  function renderPins() {
    var pins = currentPins();
    if (countEl) countEl.textContent = String(pins.length);
    if (!pins.length) {
      listEl.innerHTML = '<li class="empty">Nothing pinned. Star an item on the <a href="../moodboard/">moodboard</a>. The list stays in this browser.</li>';
      if (statusEl) statusEl.textContent = "No pins yet.";
      return pins;
    }
    listEl.innerHTML = pins.map(function (id) {
      var material = materials[id];
      return '<li><a href="../moodboard/?item=' + encodeURIComponent(id) + '"><span class="sym">' +
        esc(material.symbol || "") + "</span> " + esc(material.name) + "</a></li>";
    }).join("");
    if (statusEl) statusEl.textContent = pins.length + " pinned. Use them as demands on the logistics page, or open a name to see it on the moodboard.";
    return pins;
  }

  function candidates() {
    var q = findEl ? findEl.value : "";
    var list = String(q || "").trim()
      ? NmsRefine.searchItems(catalog, q)
      : NmsRefine.craftableItems(catalog);
    return list.slice().sort(byName);
  }

  function renderMatches() {
    if (!matchesEl) return;
    var list = candidates();
    if (!list.length) {
      matchesEl.innerHTML = '<li class="empty">No item matches that.</li>';
      return;
    }
    matchesEl.innerHTML = list.map(function (node) {
      var on = node.id === focusId;
      return '<li><button type="button" data-id="' + esc(node.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        esc(node.name) + "</button></li>";
    }).join("");
  }

  function renderBill() {
    if (!billEl) return;
    var material = materials[focusId];
    if (!material) {
      billEl.innerHTML = "";
      if (useBillEl) useBillEl.disabled = true;
      return;
    }
    var expanded = NmsRefine.expandBill(catalog, material.id, qty());
    var rawKeys = Object.keys(expanded.raw || {}).sort(function (a, b) {
      var an = nameOf(a).toLowerCase();
      var bn = nameOf(b).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
    var worth = material.value ? '<p class="worth">Base value ' + esc(units(material.value)) + " units.</p>" : "";
    var lines = rawKeys.length
      ? rawKeys.map(function (id) {
        return "<li>" + esc(units(expanded.raw[id]) + " " + nameOf(id)) + "</li>";
      }).join("")
      : '<li class="empty">That item is already a raw input.</li>';
    billEl.innerHTML =
      "<h3>" + esc(material.name) + "</h3>" +
      worth +
      "<h3>Raw bill</h3>" +
      '<ul class="bill">' + lines + "</ul>";
    if (useBillEl) useBillEl.disabled = !rawKeys.length;
  }

  function selectItem(id) {
    if (!materials[id]) return;
    focusId = id;
    renderMatches();
    renderBill();
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("item", id);
      window.history.replaceState(null, "", url.pathname + url.search);
    } catch (e) { /* the bill is already on the page */ }
  }

  function applyQuery() {
    var params = new URLSearchParams(window.location.search);
    var item = NmsRefine.canonId(params.get("item") || "");
    var q = params.get("q") || "";
    if (item && materials[item]) {
      if (findEl) findEl.value = materials[item].name;
      focusId = item;
    } else if (q && findEl) {
      findEl.value = q;
      var hits = NmsRefine.searchItems(catalog, q);
      if (hits.length === 1) focusId = hits[0].id;
    }
    renderMatches();
    renderBill();
  }

  if (findEl) {
    findEl.addEventListener("input", function () {
      var list = candidates();
      if (String(findEl.value || "").trim() && list.length === 1) focusId = list[0].id;
      else if (focusId && !list.some(function (node) { return node.id === focusId; })) focusId = "";
      renderMatches();
      renderBill();
    });
  }
  if (qtyEl) qtyEl.addEventListener("input", renderBill);
  if (matchesEl) {
    matchesEl.addEventListener("click", function (ev) {
      var button = ev.target.closest ? ev.target.closest("[data-id]") : null;
      if (!button) return;
      selectItem(button.getAttribute("data-id"));
    });
  }
  var findForm = document.getElementById("find-form");
  if (findForm) findForm.addEventListener("submit", function (ev) { ev.preventDefault(); });
  if (useBillEl) {
    useBillEl.addEventListener("click", function () {
      var material = materials && materials[focusId];
      if (!material || typeof NmsLogistics === "undefined") return;
      var expanded = NmsRefine.expandBill(catalog, material.id, qty());
      if (!Object.keys(expanded.raw || {}).length) return;
      var held = NmsLogistics.ensureUnassigned(NmsLogistics.loadStore(localStorage));
      var seeded = NmsLogistics.seedRawBill(held.store, expanded.raw, held.locationId, material.name, material.id);
      if (!seeded.project) return;
      NmsLogistics.saveStore(localStorage, seeded.store);
      if (statusEl) statusEl.textContent = "The raw bill for " + material.name + " is a project aimed at Unassigned. Open logistics to set it against what you hold.";
    });
  }

  fetch("../data/graph-v2.json", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      var problems = NmsRefine.validate(data);
      if (problems.length) throw new Error(problems[0]);
      catalog = data;
      materials = NmsRefine.byId(catalog.nodes);
      var pins = renderPins();
      applyQuery();
      var seed = document.getElementById("seed");
      if (seed) seed.addEventListener("click", function () {
        if (!pins.length) {
          if (statusEl) statusEl.textContent = "No pins yet. Star an item on the moodboard first.";
          return;
        }
        if (typeof NmsLogistics === "undefined") return;
        var saved = NmsLogistics.loadStore(localStorage);
        var target = null;
        saved.locations.forEach(function (loc) { if (loc.id === "manual:unassigned") target = loc; });
        if (!target) {
          saved.locations.push({
            id: "manual:unassigned",
            source: "manual",
            kind: "custom",
            category: "custom",
            name: "Unassigned",
            items: [],
            note: "Pins land here until you move each demand onto a real hold."
          });
        }
        var seeded = NmsLogistics.seedPins(saved, pins, "manual:unassigned", "Moodboard pins");
        NmsLogistics.saveStore(localStorage, seeded.store);
        if (statusEl) statusEl.textContent = "Those pins are demands under Moodboard pins, aimed at Unassigned. Open logistics to move them.";
      });
    })
    .catch(function (err) {
      listEl.innerHTML = '<li class="empty">The graph file did not load.</li>';
      if (matchesEl) matchesEl.innerHTML = '<li class="empty">The graph file did not load.</li>';
      if (statusEl) statusEl.textContent = "Could not read the graph.";
      if (typeof console !== "undefined" && console.warn) console.warn(err);
    });
})();
