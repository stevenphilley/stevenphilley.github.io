/*! whats-new.js — render /whats-new/entries.json into #whats-new-feed */
(function () {
  "use strict";

  var FEED_URL = "/whats-new/entries.json";
  var MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  var WEEKDAYS = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  function parseISODate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }

  function labelFor(iso) {
    var d = parseISODate(iso);
    if (!d || isNaN(d.getTime())) return iso;
    return (
      WEEKDAYS[d.getUTCDay()] +
      ", " +
      MONTHS[d.getUTCMonth()] +
      " " +
      d.getUTCDate() +
      ", " +
      d.getUTCFullYear()
    );
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function entryHTML(entry) {
    var title = esc(entry.title || "Untitled");
    var blurb = esc(entry.blurb || "");
    var href = entry.href ? String(entry.href) : "";
    var titleNode = href
      ? '<a class="wn-title" href="' + esc(href) + '">' + title + "</a>"
      : '<span class="wn-title">' + title + "</span>";
    var go = href
      ? '<a class="wn-go" href="' + esc(href) + '">Open →</a>'
      : "";
    return (
      '<article class="wn-entry">' +
      '<div class="wn-entry-main">' +
      titleNode +
      (blurb ? '<p class="wn-blurb">' + blurb + "</p>" : "") +
      "</div>" +
      go +
      "</article>"
    );
  }

  function groupHTML(group) {
    var date = esc(group.date || "");
    var label = esc(labelFor(group.date));
    var entries = Array.isArray(group.entries) ? group.entries : [];
    var body = entries.map(entryHTML).join("");
    return (
      '<section class="wn-day" aria-labelledby="wn-day-' +
      date +
      '">' +
      '<header class="wn-day-head">' +
      '<time class="wn-date" datetime="' +
      date +
      '" id="wn-day-' +
      date +
      '">' +
      label +
      "</time>" +
      '<span class="wn-day-bar" aria-hidden="true"></span>' +
      '<span class="wn-day-tally">' +
      entries.length +
      (entries.length === 1 ? " item" : " items") +
      "</span>" +
      "</header>" +
      '<div class="wn-day-body">' +
      body +
      "</div>" +
      "</section>"
    );
  }

  function render(groups) {
    var root = document.getElementById("whats-new-feed");
    if (!root) return;
    if (!Array.isArray(groups) || !groups.length) {
      root.innerHTML =
        '<p class="wn-empty">Nothing logged yet — check back as the site grows.</p>';
      return;
    }
    root.innerHTML = groups.map(groupHTML).join("");
    var tally = document.getElementById("wn-count");
    if (tally) {
      var n = 0;
      groups.forEach(function (g) {
        n += Array.isArray(g.entries) ? g.entries.length : 0;
      });
      tally.textContent = n + (n === 1 ? " entry" : " entries");
    }
  }

  function fail(err) {
    var root = document.getElementById("whats-new-feed");
    if (!root) return;
    // Keep no-JS fallback markup if fetch fails.
    if (root.getAttribute("data-fallback") === "1") return;
    root.innerHTML =
      '<p class="wn-empty">Could not load the log. Refresh, or browse the static list below if present.</p>';
    if (typeof console !== "undefined" && console.warn) console.warn(err);
  }

  fetch(FEED_URL, { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(render)
    .catch(fail);
})();
