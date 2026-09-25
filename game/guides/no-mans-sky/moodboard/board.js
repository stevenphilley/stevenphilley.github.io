/*! board.js — selection surface for the shared No Man's Sky graph. */
(function () {
  "use strict";

  var SELECT_KEY = "nms-graph-selected";

  var catalog = null;
  var materials = null;
  var categories = null;
  var focusId = "pure-ferrite";
  var anchorId = "pure-ferrite";
  var selected = [];
  var query = "";
  var category = "all";
  var pins = [];

  var boardEl = document.getElementById("board");
  var detailEl = document.getElementById("detail");
  var filterEl = document.getElementById("q");
  var statusEl = document.getElementById("status");
  var trayEl = document.getElementById("tray");
  var catsEl = document.getElementById("cats");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function materialName(id) {
    return materials[id] ? materials[id].name : id;
  }

  function qtyName(part) {
    return part.qty + " " + materialName(part.id);
  }

  function matches(material, q) {
    if (!q) return true;
    var cat = categories[material.category];
    var hay = [
      material.name,
      material.short,
      material.symbol,
      material.id.replace(/[_-]/g, " "),
      material.blurb,
      material.category,
      cat ? cat.label : ""
    ].concat(material.aliases || []).join(" ").toLowerCase();
    return q.split(/\s+/).every(function (word) {
      return word && hay.indexOf(word) !== -1;
    });
  }

  function visible(material) {
    if (category !== "all" && material.category !== category) return false;
    return matches(material, query);
  }

  function visibleIds() {
    return (catalog.nodes || []).filter(visible).map(function (material) {
      return material.id;
    });
  }

  function cleanIds(list) {
    var out = [];
    var seen = Object.create(null);
    (list || []).forEach(function (id) {
      id = NmsRefine.canonId(id);
      if (!materials[id] || seen[id]) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  function readJson(storage, key) {
    try {
      var raw = storage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function readPins() {
    var stored = readJson(localStorage, NmsRefine.PIN_KEY);
    if (stored) return cleanIds(stored);
    var legacy = readJson(localStorage, NmsRefine.PIN_KEY_LEGACY);
    return cleanIds(legacy || []);
  }

  function writePins() {
    try {
      localStorage.setItem(NmsRefine.PIN_KEY, JSON.stringify(pins));
    } catch (e) {}
  }

  function readSelected() {
    return cleanIds(readJson(sessionStorage, SELECT_KEY) || []);
  }

  function writeSelected() {
    try {
      sessionStorage.setItem(SELECT_KEY, JSON.stringify(selected));
    } catch (e) {}
  }

  function currentView() {
    return new URLSearchParams(location.search).get("view") || "";
  }

  function writeAddress() {
    if (!history.replaceState) return;
    if (currentView() === "tech") return;
    var params = new URLSearchParams(location.search);
    var requested = NmsRefine.canonId(params.get("item") || "");
    if (requested && !materials[requested]) return;
    var extra = [];
    ["theme", "sp_theme", "view"].forEach(function (key) {
      if (params.has(key)) extra.push(key + "=" + encodeURIComponent(params.get(key)));
    });
    var next = NmsRefine.formatShare(focusId, null);
    if (extra.length) next += (next ? "&" : "?") + extra.join("&");
    history.replaceState(null, "", location.pathname + next);
  }

  function chip(part, currentId) {
    if (part.id === currentId) {
      return '<span class="self">' + esc(qtyName(part)) + "</span>";
    }
    return '<button type="button" class="jump" data-go="' + esc(part.id) + '">' + esc(qtyName(part)) + "</button>";
  }

  function recipeCard(recipe, currentId) {
    var inputs = (recipe.inputs || []).map(function (part) {
      return chip(part, currentId);
    }).join('<span class="op">+</span>');
    var output = chip(recipe.out, currentId);
    var expansion = recipe.expansion ? '<span class="tag exp">Expansion</span>' : "";
    return (
      '<article class="rx">' +
      '<header class="rx-head"><h3>' + esc(recipe.name) + expansion + "</h3>" +
      '<span class="tag">' + esc(NmsRefine.slotLabel(recipe)) + "</span></header>" +
      '<p class="ratio">' + inputs + '<span class="op arr" aria-hidden="true">→</span>' + output + "</p>" +
      "</article>"
    );
  }

  function units(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function treeNode(node, depth) {
    var label = node.qty + " " + materialName(node.id);
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

  function section(title, id, recipes, empty, currentId) {
    var body = recipes.length
      ? recipes.map(function (recipe) { return recipeCard(recipe, currentId); }).join("")
      : '<p class="empty">' + esc(empty) + "</p>";
    return (
      '<section class="pane" aria-labelledby="' + id + '">' +
      '<h2 id="' + id + '">' + esc(title) + "</h2>" +
      body +
      "</section>"
    );
  }

  function renderCats() {
    if (!catsEl) return;
    var html = '<button type="button" data-cat="all" aria-pressed="' + (category === "all" ? "true" : "false") + '">All</button>';
    (catalog.categories || []).forEach(function (cat) {
      html += '<button type="button" data-cat="' + esc(cat.id) + '" aria-pressed="' + (category === cat.id ? "true" : "false") + '">' +
        '<i class="swatch cat-' + esc(cat.id) + '" aria-hidden="true"></i>' + esc(cat.label) + "</button>";
    });
    catsEl.innerHTML = html;
  }

  function renderTray() {
    if (!trayEl) return;
    if (!pins.length) {
      trayEl.innerHTML = '<p class="tray-empty"><span class="tray-label">Pins</span> Nothing pinned. A star keeps a short list in this browser. A pin is not a mark.</p>';
      return;
    }
    var html = '<p class="tray-label">Pins · ' + pins.length + "</p>";
    pins.forEach(function (id) {
      var material = materials[id];
      if (!material) return;
      var on = id === focusId ? " is-on" : "";
      html += '<span class="chip' + on + '">' +
        '<button type="button" class="go" data-go="' + esc(id) + '"><span class="sym">' + esc(material.symbol || "") + "</span> " + esc(material.name) + "</button>" +
        '<button type="button" class="x" data-unpin="' + esc(id) + '" aria-label="Unpin ' + esc(material.name) + '">×</button>' +
        "</span>";
    });
    trayEl.innerHTML = html;
  }

  function renderBoard() {
    var marked = Object.create(null);
    selected.forEach(function (id) { marked[id] = true; });
    var pinned = Object.create(null);
    pins.forEach(function (id) { pinned[id] = true; });
    var html = "";
    var shown = 0;
    (catalog.categories || []).forEach(function (cat) {
      var items = (catalog.nodes || []).filter(function (material) {
        return material.category === cat.id && visible(material);
      });
      if (!items.length) return;
      shown += items.length;
      html += '<section class="board-group" aria-labelledby="cat-' + esc(cat.id) + '">' +
        '<h2 id="cat-' + esc(cat.id) + '"><i class="swatch cat-' + esc(cat.id) + '" aria-hidden="true"></i>' + esc(cat.label) + "</h2>" +
        '<div class="board">';
      items.forEach(function (material) {
        var cls = (material.id === focusId ? " is-on" : "") + (marked[material.id] ? " is-marked" : "");
        var pinOn = pinned[material.id] ? "true" : "false";
        var markOn = marked[material.id] ? "true" : "false";
        html += '<div class="cell">' +
          '<button type="button" class="tile' + cls + '" data-id="' + esc(material.id) + '" data-cat="' + esc(material.category) + '" aria-pressed="' + (material.id === focusId ? "true" : "false") + '">' +
          '<span class="sym">' + esc(material.symbol || "") + "</span>" +
          '<span class="nm">' + esc(material.short || material.name) + "</span>" +
          "</button>" +
          '<button type="button" class="mark" data-mark="' + esc(material.id) + '" aria-pressed="' + markOn + '" aria-label="' + esc((marked[material.id] ? "Unmark " : "Mark ") + material.name) + '">Mark</button>' +
          '<button type="button" class="pin" data-pin="' + esc(material.id) + '" aria-pressed="' + pinOn + '" aria-label="' + esc((pinned[material.id] ? "Unpin " : "Pin ") + material.name) + '">' +
          (pinned[material.id] ? "★" : "☆") + "</button>" +
          "</div>";
      });
      html += "</div></section>";
    });
    if (!shown) html = '<p class="empty">No item matches that.</p>';
    boardEl.innerHTML = html;
    var markedCount = document.getElementById("m-marked");
    var pinCount = document.getElementById("m-pins");
    if (markedCount) markedCount.textContent = String(selected.length);
    if (pinCount) pinCount.textContent = String(pins.length);
  }

  function renderDetail() {
    var material = materials[focusId];
    if (!material) {
      detailEl.innerHTML = '<p class="empty">That item is not in this set.</p>';
      return;
    }
    var made = NmsRefine.sortEdges(NmsRefine.producing(catalog, material.id));
    var used = NmsRefine.consuming(catalog, material.id);
    var converts = NmsRefine.sortEdges(used.filter(function (edge) { return edge.kind === "refine"; }));
    var crafts = NmsRefine.sortEdges(used.filter(function (edge) { return edge.kind === "craft"; }));
    var cat = categories[material.category];
    var pinned = pins.indexOf(material.id) !== -1;
    var marked = selected.indexOf(material.id) !== -1;
    var expanded = NmsRefine.expandBill(catalog, material.id, 1);
    var hasTree = expanded.tree && expanded.tree.children && expanded.tree.children.length;
    var rawKeys = Object.keys(expanded.raw || {}).sort(function (a, b) {
      if (materialName(a) < materialName(b)) return -1;
      if (materialName(a) > materialName(b)) return 1;
      return 0;
    });
    var worth = material.value ? '<p class="blurb">Base value ' + esc(units(material.value)) + " units.</p>" : "";
    var treeHtml = hasTree
      ? '<section class="pane"><h2>Crafting tree</h2><ul class="tree">' + treeNode(expanded.tree, 0) + "</ul></section>" +
        '<section class="pane"><h2>Raw bill</h2><ul class="bill">' + rawKeys.map(function (id) {
          return '<li><button type="button" class="jump" data-go="' + esc(id) + '">' + esc(expanded.raw[id] + " " + materialName(id)) + "</button></li>";
        }).join("") + "</ul></section>"
      : "";
    var rawLink = hasTree
      ? ' · <a href="../logistics/?recipe=' + encodeURIComponent(material.id) + '&amp;bill=raw&amp;qty=1#plan">Add the raw bill to a plan</a>'
      : "";
    detailEl.innerHTML =
      '<p class="kicker">' + esc(cat ? cat.label : "") + (selected.length > 1 ? " · " + selected.length + " marked" : "") + "</p>" +
      '<div class="detail-title"><h2 id="detail-h" tabindex="-1">' + esc(material.name) + "</h2>" +
      '<div class="detail-side"><span class="sym-lg">' + esc(material.symbol || "") + "</span>" +
      '<button type="button" class="pin-lg" data-pin="' + esc(material.id) + '" aria-pressed="' + (pinned ? "true" : "false") + '">' +
      (pinned ? "Pinned" : "Pin") + "</button>" +
      '<button type="button" class="mark-lg" data-mark="' + esc(material.id) + '" aria-pressed="' + (marked ? "true" : "false") + '">' +
      (marked ? "Marked" : "Mark") + "</button></div></div>" +
      '<p class="blurb">' + esc(material.blurb || "") + "</p>" +
      worth +
      '<p class="rx-note"><a href="../refine/?item=' + encodeURIComponent(material.id) + '">Open in the edge explorer</a> · <a href="../logistics/?recipe=' + encodeURIComponent(material.id) + '#plan">Plan the build cost</a>' + rawLink + "</p>" +
      treeHtml +
      '<div class="split">' +
      section("Made from", "from-h", made, "Nothing in this set makes " + material.name + ".", material.id) +
      section("Converts to", "to-h", converts, material.name + " is not spent in a refiner in this set.", material.id) +
      section("Crafts into", "craft-h", crafts, material.name + " is not spent by an inventory recipe in this set.", material.id) +
      "</div>";
    var countFrom = document.getElementById("m-from");
    if (countFrom) countFrom.textContent = String(made.length);
    if (statusEl) {
      var shown = (catalog.nodes || []).filter(visible).length;
      statusEl.textContent = material.name + " — " + made.length + " in, " + converts.length + " refine, " +
        crafts.length + " inventory. " + selected.length + " marked. " + pins.length + " pinned. " + shown + " on the board.";
    }
  }

  function render(focus) {
    renderCats();
    renderTray();
    renderBoard();
    renderDetail();
    if (focus === "detail") {
      var heading = document.getElementById("detail-h");
      if (heading) heading.focus();
    }
    if (focus === "tile") {
      var tile = boardEl.querySelector('.tile[data-id="' + focusId + '"]');
      if (tile) tile.focus();
    }
    if (focus === "view" && window.matchMedia && window.matchMedia("(max-width: 980px)").matches) {
      var panel = document.querySelector(".detail-col") || detailEl;
      var root = document.documentElement;
      var previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      panel.scrollIntoView({ block: "start", behavior: "auto" });
      root.style.scrollBehavior = previous;
    }
  }

  function setFocus(id, mode) {
    if (!materials[id]) id = "pure-ferrite";
    focusId = id;
    anchorId = id;
    writeAddress();
    writeSelected();
    render(mode || false);
  }

  function openOne(id, mode) {
    selected = [id];
    setFocus(id, mode);
  }

  function toggleMark(id) {
    if (!materials[id]) return;
    selected = NmsRefine.togglePin(selected, id);
    writeSelected();
    render(false);
  }

  function rangeMark(id) {
    var ids = visibleIds();
    var from = ids.indexOf(anchorId);
    var to = ids.indexOf(id);
    if (from === -1 || to === -1) {
      if (selected.indexOf(id) === -1) selected = selected.concat([id]);
    } else {
      var lo = Math.min(from, to);
      var hi = Math.max(from, to);
      var add = ids.slice(lo, hi + 1);
      var seen = Object.create(null);
      selected.forEach(function (item) { seen[item] = true; });
      add.forEach(function (item) {
        if (!seen[item]) {
          seen[item] = true;
          selected.push(item);
        }
      });
    }
    setFocus(id, "view");
  }

  function pin(id) {
    if (!materials[id]) return;
    pins = NmsRefine.togglePin(pins, id);
    writePins();
    render(false);
  }

  function onBoardClick(event) {
    var unpin = event.target.closest("[data-unpin]");
    if (unpin) {
      pin(unpin.getAttribute("data-unpin"));
      return;
    }
    var pinBtn = event.target.closest("[data-pin]");
    if (pinBtn) {
      pin(pinBtn.getAttribute("data-pin"));
      return;
    }
    var markBtn = event.target.closest("[data-mark]");
    if (markBtn) {
      toggleMark(markBtn.getAttribute("data-mark"));
      return;
    }
    var tile = event.target.closest(".tile[data-id]");
    if (!tile || !boardEl.contains(tile)) return;
    var id = tile.getAttribute("data-id");
    if (event.shiftKey) {
      rangeMark(id);
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      selected = NmsRefine.togglePin(selected, id);
      setFocus(id, "view");
      return;
    }
    openOne(id, "view");
    if (window.matchMedia && window.matchMedia("(max-width: 980px)").matches) {
      var heading = document.getElementById("detail-h");
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  boardEl.addEventListener("click", onBoardClick);
  detailEl.addEventListener("click", function (event) {
    var pinBtn = event.target.closest("[data-pin]");
    if (pinBtn) {
      pin(pinBtn.getAttribute("data-pin"));
      return;
    }
    var markBtn = event.target.closest("[data-mark]");
    if (markBtn) {
      toggleMark(markBtn.getAttribute("data-mark"));
      return;
    }
    var twig = event.target.closest(".twig");
    if (twig) {
      var list = twig.nextElementSibling;
      var open = twig.getAttribute("aria-expanded") === "true";
      twig.setAttribute("aria-expanded", open ? "false" : "true");
      if (list) list.hidden = open;
      return;
    }
    var go = event.target.closest("[data-go]");
    if (go) {
      query = "";
      if (filterEl) filterEl.value = "";
      openOne(go.getAttribute("data-go"), "detail");
    }
  });
  if (trayEl) {
    trayEl.addEventListener("click", function (event) {
      var unpin = event.target.closest("[data-unpin]");
      if (unpin) {
        pin(unpin.getAttribute("data-unpin"));
        return;
      }
      var go = event.target.closest("[data-go]");
      if (!go) return;
      query = "";
      if (filterEl) filterEl.value = "";
      openOne(go.getAttribute("data-go"), "detail");
    });
  }

  if (catsEl) {
    catsEl.addEventListener("click", function (event) {
      var button = event.target.closest("[data-cat]");
      if (!button) return;
      category = button.getAttribute("data-cat") || "all";
      query = "";
      if (filterEl) filterEl.value = "";
      render(false);
    });
  }

  if (filterEl) {
    filterEl.addEventListener("input", function () {
      query = filterEl.value.trim().toLowerCase();
      if (query) category = "all";
      render(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    var tag = (event.target && event.target.tagName || "").toLowerCase();
    var typing = tag === "input" || tag === "textarea" || (event.target && event.target.isContentEditable);
    if (event.key === "Escape") {
      if (filterEl && (filterEl.value || query)) {
        filterEl.value = "";
        query = "";
        render(false);
      }
      if (typing && event.target.blur) event.target.blur();
      return;
    }
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "/" || (event.key.length === 1 && /[a-z0-9]/i.test(event.key))) {
      if (!filterEl) return;
      event.preventDefault();
      filterEl.focus();
      if (event.key === "/") return;
      filterEl.value = (filterEl.value || "") + event.key;
      query = filterEl.value.trim().toLowerCase();
      if (query) category = "all";
      render(false);
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveBoard(event.key);
    }
  });

  function moveBoard(key) {
    var tiles = [].slice.call(boardEl.querySelectorAll(".tile"));
    if (!tiles.length) return;
    var rows = [];
    tiles.forEach(function (tile) {
      var top = tile.getBoundingClientRect().top;
      var row = null;
      rows.forEach(function (candidate) {
        if (Math.abs(candidate.top - top) < 8) row = candidate;
      });
      if (!row) {
        row = { top: top, tiles: [] };
        rows.push(row);
      }
      row.tiles.push(tile);
    });
    var r = 0;
    var c = 0;
    var found = false;
    rows.forEach(function (row, ri) {
      row.tiles.forEach(function (tile, ci) {
        if (tile.getAttribute("data-id") === focusId) {
          r = ri;
          c = ci;
          found = true;
        }
      });
    });
    if (!found) {
      openOne(rows[0].tiles[0].getAttribute("data-id"), "tile");
      return;
    }
    if (key === "ArrowRight") {
      c += 1;
      if (c >= rows[r].tiles.length) {
        r = Math.min(rows.length - 1, r + 1);
        c = 0;
      }
    } else if (key === "ArrowLeft") {
      c -= 1;
      if (c < 0) {
        r = Math.max(0, r - 1);
        c = rows[r].tiles.length - 1;
      }
    } else if (key === "ArrowDown") {
      r = Math.min(rows.length - 1, r + 1);
      c = Math.min(c, rows[r].tiles.length - 1);
    } else if (key === "ArrowUp") {
      r = Math.max(0, r - 1);
      c = Math.min(c, rows[r].tiles.length - 1);
    }
    openOne(rows[r].tiles[c].getAttribute("data-id"), "tile");
  }

  function applyLocation(write) {
    var share = NmsRefine.parseShare(location.search);
    var hash = (location.hash || "").replace(/^#/, "");
    var ownsItem = currentView() !== "tech";
    if (ownsItem && materials[share.item]) focusId = share.item;
    else if (ownsItem && materials[hash]) focusId = hash;
    else if (!materials[focusId]) focusId = "pure-ferrite";
    anchorId = focusId;
    if (share.pins) pins = cleanIds(share.pins);
    else pins = readPins();
    writePins();
    var stored = readSelected();
    if (stored.length) selected = stored;
    if (selected.indexOf(focusId) === -1) selected = [focusId].concat(selected);
    if (write && ownsItem) {
      writeAddress();
      writeSelected();
    }
    render(false);
  }

  window.addEventListener("popstate", function () {
    if (!materials) return;
    if (currentView() === "tech") return;
    var share = NmsRefine.parseShare(location.search);
    if (materials[share.item]) {
      focusId = share.item;
      anchorId = focusId;
      if (selected.indexOf(focusId) === -1) selected = [focusId].concat(selected);
      writeSelected();
    }
    render(false);
  });

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
      categories = NmsRefine.byId(catalog.categories);
      var matCount = document.getElementById("m-mat");
      if (matCount) matCount.textContent = String(catalog.nodes.length);
      applyLocation(true);
    })
    .catch(function (err) {
      if (statusEl) statusEl.textContent = "Could not read the graph.";
      boardEl.innerHTML = '<p class="empty">The graph file did not load.</p>';
      if (typeof console !== "undefined" && console.warn) console.warn(err);
    });
})();
