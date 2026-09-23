/*! planner.js — stub that lists pins from the moodboard. */
(function () {
  "use strict";

  var listEl = document.getElementById("pins");
  var statusEl = document.getElementById("status");
  var countEl = document.getElementById("m-pins");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  fetch("../data/graph-v2.json", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (catalog) {
      var problems = NmsRefine.validate(catalog);
      if (problems.length) throw new Error(problems[0]);
      var materials = NmsRefine.byId(catalog.nodes);
      var pins = [];
      var seen = Object.create(null);
      readPins().forEach(function (id) {
        id = NmsRefine.canonId(id);
        if (!materials[id] || seen[id]) return;
        seen[id] = true;
        pins.push(id);
      });
      if (countEl) countEl.textContent = String(pins.length);
      if (!pins.length) {
        listEl.innerHTML = '<li class="empty">Nothing pinned. Star an item on the <a href="../moodboard/">moodboard</a>. The list stays in this browser.</li>';
        if (statusEl) statusEl.textContent = "No pins yet.";
        return;
      }
      listEl.innerHTML = pins.map(function (id) {
        var material = materials[id];
        return '<li><a href="../moodboard/?item=' + encodeURIComponent(id) + '"><span class="sym">' +
          esc(material.symbol || "") + '</span> ' + esc(material.name) + "</a></li>";
      }).join("");
      if (statusEl) statusEl.textContent = pins.length + " pinned. The production planner is not built yet. This list is the start.";
    })
    .catch(function (err) {
      listEl.innerHTML = '<li class="empty">The graph file did not load.</li>';
      if (statusEl) statusEl.textContent = "Could not read the graph.";
      if (typeof console !== "undefined" && console.warn) console.warn(err);
    });
})();
