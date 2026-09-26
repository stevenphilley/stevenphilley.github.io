/*! tech.js — craftable technology on the moodboard. */
(function () {
  "use strict";

  var PIN_KEY = "nms-tech-pins";

  var tech = null;
  var graph = null;
  var index = null;
  var focusId = "";
  var query = "";
  var slot = "all";
  var sub = "all";
  var pins = [];

  var desk = document.getElementById("tech-desk");
  var boardEl = document.getElementById("tech-board");
  var detailEl = document.getElementById("tech-detail");
  var filterEl = document.getElementById("tech-q");
  var catsEl = document.getElementById("tech-cats");
  var subEl = document.getElementById("tech-sub");
  var trayEl = document.getElementById("tech-tray");
  var statusEl = document.getElementById("tech-status");
  var materialsDesk = document.getElementById("desk");
  var materialsMetrics = document.getElementById("materials-metrics");

  if (!desk || !boardEl || !detailEl) return;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function itemName(id) {
    return index[id] ? index[id].name : id;
  }

  function matches(item, q) {
    if (!q) return true;
    var hay = [
      item.name,
      item.gameId,
      item.id.replace(/[_-]/g, " "),
      item.subcategory,
      item.slotLabel,
      item.blurb,
      item.kind,
      item.symbol
    ].concat(item.aliases || []).join(" ").toLowerCase();
    return q.split(/\s+/).every(function (word) {
      return word && hay.indexOf(word) !== -1;
    });
  }

  function visible(item) {
    if (slot !== "all" && item.slot !== slot) return false;
    if (sub !== "all" && item.subcategory !== sub) return false;
    return matches(item, query);
  }

  function cleanIds(list) {
    var out = [];
    var seen = Object.create(null);
    (list || []).forEach(function (id) {
      id = NmsRefine.canonId(id);
      if (!index[id] || seen[id]) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  function readPins() {
    try {
      var raw = localStorage.getItem(PIN_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return cleanIds(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      return [];
    }
  }

  function writePins() {
    try { localStorage.setItem(PIN_KEY, JSON.stringify(pins)); } catch (e) {}
  }

  function writeAddress() {
    if (!history.replaceState) return;
    var params = new URLSearchParams(location.search);
    var extra = [];
    ["theme", "sp_theme"].forEach(function (key) {
      if (params.has(key)) extra.push(key + "=" + encodeURIComponent(params.get(key)));
    });
    var next = "?view=tech";
    if (focusId) next += "&item=" + encodeURIComponent(focusId);
    if (extra.length) next += "&" + extra.join("&");
    history.replaceState(null, "", location.pathname + next);
  }

  function setView(view) {
    var techOn = view === "tech";
    desk.hidden = !techOn;
    if (materialsDesk) materialsDesk.hidden = techOn;
    if (materialsMetrics) materialsMetrics.hidden = techOn;
    var matBtn = document.getElementById("view-materials");
    var techBtn = document.getElementById("view-tech");
    if (matBtn) matBtn.setAttribute("aria-pressed", techOn ? "false" : "true");
    if (techBtn) techBtn.setAttribute("aria-pressed", techOn ? "true" : "false");
    if (techOn) {
      writeAddress();
      render(false);
    }
  }

  function renderCats() {
    if (!catsEl) return;
    var html = '<button type="button" data-slot="all" aria-pressed="' + (slot === "all" ? "true" : "false") + '">All</button>';
    (tech.slots || []).forEach(function (row) {
      html += '<button type="button" data-slot="' + esc(row.id) + '" aria-pressed="' + (slot === row.id ? "true" : "false") + '">' + esc(row.label) + "</button>";
    });
    catsEl.innerHTML = html;
  }

  function renderSub() {
    if (!subEl) return;
    var seen = Object.create(null);
    var options = ['<option value="all">All subcategories</option>'];
    (tech.items || []).forEach(function (item) {
      if (slot !== "all" && item.slot !== slot) return;
      if (!item.subcategory || seen[item.subcategory]) return;
      seen[item.subcategory] = true;
      options.push('<option value="' + esc(item.subcategory) + '">' + esc(item.subcategory) + "</option>");
    });
    subEl.innerHTML = options.join("");
    subEl.value = seen[sub] || sub === "all" ? sub : "all";
    if (subEl.value !== sub) sub = subEl.value;
  }

  function renderTray() {
    if (!trayEl) return;
    if (!pins.length) {
      trayEl.innerHTML = '<p class="tray-empty"><span class="tray-label">Pins</span> Nothing pinned.</p>';
      return;
    }
    var html = '<p class="tray-label">Pins · ' + pins.length + "</p>";
    pins.forEach(function (id) {
      var item = index[id];
      if (!item) return;
      html += '<span class="chip' + (id === focusId ? " is-on" : "") + '">' +
        '<button type="button" class="go" data-go="' + esc(id) + '"><span class="sym">' + esc(item.symbol || "") + "</span> " + esc(item.name) + "</button>" +
        '<button type="button" class="x" data-unpin="' + esc(id) + '" aria-label="Unpin ' + esc(item.name) + '">×</button></span>';
    });
    trayEl.innerHTML = html;
  }

  function renderBoard() {
    var pinned = Object.create(null);
    pins.forEach(function (id) { pinned[id] = true; });
    var html = "";
    var shown = 0;
    (tech.slots || []).forEach(function (row) {
      var group = (tech.items || []).filter(function (item) {
        return item.slot === row.id && visible(item);
      });
      if (!group.length) return;
      shown += group.length;
      html += '<section class="board-group"><h2>' + esc(row.label) + "</h2><div class=\"board\">";
      group.forEach(function (item) {
        var on = item.id === focusId;
        html += '<div class="cell"><button type="button" class="tile' + (on ? " is-on" : "") + '" data-cat="' + esc(item.slot) + '" data-id="' + esc(item.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          '<span class="sym">' + esc(item.symbol || "") + "</span>" +
          '<span class="nm">' + esc(item.name) + "</span></button>" +
          '<button type="button" class="pin" data-pin="' + esc(item.id) + '" aria-pressed="' + (pinned[item.id] ? "true" : "false") + '" aria-label="' + esc((pinned[item.id] ? "Unpin " : "Pin ") + item.name) + '">' +
          (pinned[item.id] ? "★" : "☆") + "</button></div>";
      });
      html += "</div></section>";
    });
    if (!shown) html = '<p class="empty">No technology matches that.</p>';
    boardEl.innerHTML = html;
    var count = document.getElementById("t-shown");
    if (count) count.textContent = String(shown);
    var pinCount = document.getElementById("t-pins");
    if (pinCount) pinCount.textContent = String(pins.length);
  }

  function treeNode(node, depth) {
    var name = itemName(node.id);
    var label = node.qty + " " + name;
    if (!node.children || !node.children.length) {
      var tail = node.cycle ? "cycle" : "raw";
      return '<li class="tree-leaf"><button type="button" class="jump" data-go="' + esc(node.id) + '">' + esc(label) + "</button> <span class=\"tag\">" + tail + "</span></li>";
    }
    var open = depth < 2;
    var tag = node.refine ? "Refiner" : "Craft";
    if (node.batches) tag += " · " + node.batches + "×" + node.outQty;
    return '<li><button type="button" class="twig" aria-expanded="' + (open ? "true" : "false") + '"><span>' + esc(label) + '</span> <span class="tag">' + esc(tag) + "</span></button>" +
      '<ul' + (open ? "" : " hidden") + ">" + node.children.map(function (child) {
        return treeNode(child, depth + 1);
      }).join("") + "</ul></li>";
  }

  function renderDetail() {
    var item = index[focusId];
    if (!item) {
      detailEl.innerHTML = '<p class="empty">Select a technology.</p>';
      return;
    }
    var expanded = NmsCraft.expand(tech, graph, item.id, 1);
    var rawKeys = Object.keys(expanded.raw).sort(function (a, b) {
      if (itemName(a) < itemName(b)) return -1;
      if (itemName(a) > itemName(b)) return 1;
      return 0;
    });
    var rawHtml = rawKeys.length
      ? rawKeys.map(function (id) {
        return '<li><button type="button" class="jump" data-go="' + esc(id) + '">' + esc(expanded.raw[id] + " " + itemName(id)) + "</button></li>";
      }).join("")
      : '<li class="empty">No raw bill.</li>';
    var used = NmsCraft.usedIn(tech, item.id);
    var usedHtml = used.length
      ? used.map(function (row) {
        return '<li><button type="button" class="jump" data-go="' + esc(row.id) + '">' + esc(row.name) + "</button> <span class=\"tag\">" + esc(row.slotLabel) + "</span></li>";
      }).join("")
      : '<li class="empty">Nothing in this set uses ' + esc(item.name) + ".</li>";
    var pinned = pins.indexOf(item.id) !== -1;
    var blueprint = item.blueprint && item.blueprint.summary ? '<p class="blurb">' + esc(item.blueprint.summary) + "</p>" : "";
    var repair = '<p class="rx-note">Repair cost is not a separate list in the technology table. The install recipe above is the Requirements list.</p>';
    if (item.kind === "procedural") repair = '<p class="rx-note">Procedural S/A/B/C modules are bought or found. They are not crafted from a blueprint.</p>';
    if (item.kind === "gathered" || item.kind === "resource" || item.kind === "product") repair = "";
    var planBits = [];
    if (item.graphId) planBits.push('<a href="../planner/?item=' + encodeURIComponent(item.graphId) + '">Plan the raw bill</a>');
    if (item.recipe) planBits.push('<a href="../logistics/?recipe=' + encodeURIComponent(item.id) + '&amp;bill=raw&amp;qty=1#plan">Add the raw bill to logistics</a>');
    var plan = planBits.length ? '<p class="rx-note">' + planBits.join(" · ") + "</p>" : "";
    var refine = item.graphId
      ? '<p class="rx-note"><a href="../refine/?item=' + encodeURIComponent(item.graphId) + '">Other refiner paths</a></p>'
      : "";
    var worth = item.value ? '<p class="blurb">Base value ' + esc(String(item.value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " units.</p>" : "";
    var kind = item.kind === "upgrade" ? "Craftable upgrade" : (item.kind === "procedural" ? "Procedural module" : item.slotLabel);
    detailEl.innerHTML =
      '<p class="kicker">' + esc(kind) + (item.subcategory ? " · " + esc(item.subcategory) : "") + "</p>" +
      '<div class="detail-title"><h2 id="tech-h" tabindex="-1">' + esc(item.name) + "</h2>" +
      '<div class="detail-side"><span class="sym-lg">' + esc(item.gameId || "") + "</span>" +
      '<button type="button" class="pin-lg" data-pin="' + esc(item.id) + '" aria-pressed="' + (pinned ? "true" : "false") + '">' +
      (pinned ? "Pinned" : "Pin") + "</button></div></div>" +
      '<p class="blurb">' + esc(item.blurb || "") + "</p>" +
      worth +
      blueprint + repair + plan + refine +
      '<section class="pane"><h2>Crafting tree</h2><ul class="tree">' + treeNode(expanded.tree, 0) + "</ul></section>" +
      '<section class="pane"><h2>Raw bill</h2><ul class="bill">' + rawHtml + "</ul></section>" +
      '<section class="pane"><h2>Used in</h2><ul class="bill">' + usedHtml + "</ul></section>";
    if (statusEl) {
      var shown = (tech.items || []).filter(visible).length;
      statusEl.textContent = item.name + " — " + rawKeys.length + " raw lines. " + used.length + " used in. " + pins.length + " pinned. " + shown + " on the board.";
    }
  }

  function render(focus) {
    renderCats();
    renderSub();
    renderTray();
    renderBoard();
    renderDetail();
    if (focus === "detail") {
      var heading = document.getElementById("tech-h");
      if (heading) heading.focus();
    }
  }

  function openItem(id, mode) {
    if (!index[id]) return;
    focusId = id;
    if (index[id].slot !== slot && slot !== "all") slot = "all";
    writeAddress();
    render(mode || false);
    if (mode === "view" && window.matchMedia && window.matchMedia("(max-width: 980px)").matches) {
      var panel = document.querySelector("#tech-desk .detail-col") || detailEl;
      panel.scrollIntoView({ block: "start" });
    }
  }

  function pin(id) {
    if (!index[id]) return;
    pins = NmsRefine.togglePin(pins, id);
    writePins();
    render(false);
  }

  boardEl.addEventListener("click", function (event) {
    var pinBtn = event.target.closest("[data-pin]");
    if (pinBtn) { pin(pinBtn.getAttribute("data-pin")); return; }
    var tile = event.target.closest(".tile[data-id]");
    if (!tile) return;
    openItem(tile.getAttribute("data-id"), "view");
  });

  detailEl.addEventListener("click", function (event) {
    var pinBtn = event.target.closest("[data-pin]");
    if (pinBtn) { pin(pinBtn.getAttribute("data-pin")); return; }
    var twig = event.target.closest(".twig");
    if (twig) {
      var list = twig.nextElementSibling;
      var open = twig.getAttribute("aria-expanded") === "true";
      twig.setAttribute("aria-expanded", open ? "false" : "true");
      if (list) list.hidden = open;
      return;
    }
    var go = event.target.closest("[data-go]");
    if (go) openItem(go.getAttribute("data-go"), "detail");
  });

  if (trayEl) {
    trayEl.addEventListener("click", function (event) {
      var unpin = event.target.closest("[data-unpin]");
      if (unpin) { pin(unpin.getAttribute("data-unpin")); return; }
      var go = event.target.closest("[data-go]");
      if (go) openItem(go.getAttribute("data-go"), "detail");
    });
  }

  if (catsEl) {
    catsEl.addEventListener("click", function (event) {
      var button = event.target.closest("[data-slot]");
      if (!button) return;
      slot = button.getAttribute("data-slot") || "all";
      sub = "all";
      render(false);
    });
  }

  if (subEl) {
    subEl.addEventListener("change", function () {
      sub = subEl.value || "all";
      render(false);
    });
  }

  if (filterEl) {
    filterEl.addEventListener("input", function () {
      query = filterEl.value.trim().toLowerCase();
      if (query) {
        slot = "all";
        sub = "all";
      }
      render(false);
    });
  }

  var matBtn = document.getElementById("view-materials");
  var techBtn = document.getElementById("view-tech");
  if (matBtn) {
    matBtn.addEventListener("click", function () {
      var params = new URLSearchParams(location.search);
      params.set("view", "materials");
      var item = params.get("item") || "";
      if (index[item] && index[item].kind !== "resource" && index[item].kind !== "product" && index[item].kind !== "gathered") {
        params.set("item", "pure-ferrite");
      }
      history.replaceState(null, "", location.pathname + "?" + params.toString());
      setView("materials");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  }
  if (techBtn) {
    techBtn.addEventListener("click", function () {
      setView("tech");
    });
  }

  var helpBtn = document.getElementById("tech-help");
  var helpTip = document.getElementById("tech-help-tip");
  if (helpBtn && helpTip) {
    helpBtn.addEventListener("click", function () {
      var open = helpBtn.getAttribute("aria-expanded") === "true";
      helpBtn.setAttribute("aria-expanded", open ? "false" : "true");
      helpTip.hidden = open;
    });
  }

  function boot(techData, graphData) {
    tech = techData;
    graph = graphData;
    index = NmsCraft.byId(tech.items);
    var params = new URLSearchParams(location.search);
    var requested = NmsRefine.canonId(params.get("item") || "");
    var requestedItem = index[requested];
    focusId = requestedItem ? requested : "jetpack";
    if (!index[focusId]) focusId = tech.items[0] ? tech.items[0].id : "";
    pins = readPins();
    var techCount = document.getElementById("t-tech");
    var upCount = document.getElementById("t-up");
    var procCount = document.getElementById("t-proc");
    if (techCount) techCount.textContent = String(tech.items.filter(function (item) { return item.kind === "technology"; }).length);
    if (upCount) upCount.textContent = String(tech.items.filter(function (item) { return item.kind === "upgrade"; }).length);
    if (procCount) procCount.textContent = String(tech.items.filter(function (item) { return item.kind === "procedural"; }).length);
    var view = params.get("view");
    var openTech = view === "tech" || (!view && requestedItem && (requestedItem.kind === "technology" || requestedItem.kind === "upgrade" || requestedItem.kind === "procedural"));
    setView(openTech ? "tech" : "materials");
    if (!openTech && statusEl) statusEl.textContent = "";
  }

  Promise.all([
    fetch("../data/technology.json", { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("technology");
      return res.json();
    }),
    fetch("../data/graph-v2.json", { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("graph");
      return res.json();
    })
  ]).then(function (pair) {
    boot(pair[0], pair[1]);
  }).catch(function () {
    boardEl.innerHTML = '<p class="empty">The technology file did not load.</p>';
    if (statusEl) statusEl.textContent = "Could not read the technology catalog.";
  });
})();
