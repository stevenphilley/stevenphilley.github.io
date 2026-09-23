/*! tree.js — moodboard for the No Man's Sky tech tree. */
(function () {
  "use strict";

  var PIN_KEY = "nms-tech-pins";

  var catalog = null;
  var materials = null;
  var categories = null;
  var selected = "pure_ferrite";
  var query = "";
  var tier = "all";
  var category = "all";
  var pins = [];

  var boardEl = document.getElementById("board");
  var detailEl = document.getElementById("detail");
  var graphEl = document.getElementById("graph");
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
      material.id,
      material.blurb,
      material.kind,
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

  function cleanPins(list) {
    var out = [];
    var seen = Object.create(null);
    (list || []).forEach(function (id) {
      if (!materials[id] || seen[id]) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  function readStoredPins() {
    try {
      var raw = localStorage.getItem(PIN_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeStoredPins() {
    try {
      localStorage.setItem(PIN_KEY, JSON.stringify(pins));
    } catch (e) {}
  }

  function writeAddress() {
    if (!history.replaceState) return;
    var params = new URLSearchParams(location.search);
    var extra = [];
    ["theme", "sp_theme"].forEach(function (key) {
      if (params.has(key)) extra.push(key + "=" + encodeURIComponent(params.get(key)));
    });
    var next = NmsRefine.formatShare(selected, pins);
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
    var note = recipe.note ? '<p class="rx-note">' + esc(recipe.note) + "</p>" : "";
    var expansion = recipe.expansion ? '<span class="tag exp">Expansion</span>' : "";
    return (
      '<article class="rx">' +
      '<header class="rx-head"><h3>' + esc(recipe.name) + expansion + "</h3>" +
      '<span class="tag">' + esc(NmsRefine.slotLabel(recipe)) + "</span></header>" +
      '<p class="ratio">' + inputs + '<span class="op arr" aria-hidden="true">→</span>' + output + "</p>" +
      note +
      "</article>"
    );
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
      trayEl.innerHTML = '<p class="tray-empty"><span class="tray-label">Pinned</span> Nothing pinned. Pin a tile to keep a short list in this browser.</p>';
      return;
    }
    var html = '<div class="tray-row"><span class="tray-label">Pinned · ' + pins.length + "</span>";
    pins.forEach(function (id) {
      var material = materials[id];
      if (!material) return;
      var on = id === selected ? " is-on" : "";
      html += '<span class="chip' + on + '">' +
        '<button type="button" class="go" data-go="' + esc(id) + '"><span class="sym">' + esc(material.symbol || "") + "</span> " + esc(material.name) + "</button>" +
        '<button type="button" class="x" data-unpin="' + esc(id) + '" aria-label="Unpin ' + esc(material.name) + '">×</button>' +
        "</span>";
    });
    html += "</div>";
    trayEl.innerHTML = html;
  }

  function renderBoard(neighbors) {
    var near = Object.create(null);
    neighbors.forEach(function (id) { near[id] = true; });
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
        var cls = material.id === selected ? " is-on" : (near[material.id] ? " is-near" : "");
        var pressed = material.id === selected ? "true" : "false";
        var pinPressed = pinned[material.id] ? "true" : "false";
        var pinLabel = (pinned[material.id] ? "Unpin " : "Pin ") + material.name;
        html += '<div class="cell">' +
          '<button type="button" class="tile' + cls + '" data-id="' + esc(material.id) + '" data-cat="' + esc(material.category) + '" aria-pressed="' + pressed + '">' +
          '<span class="sym">' + esc(material.symbol || "") + "</span>" +
          '<span class="nm">' + esc(material.name) + "</span>" +
          '<span class="catlab">' + esc(cat.label) + "</span>" +
          "</button>" +
          '<button type="button" class="pin" data-pin="' + esc(material.id) + '" aria-pressed="' + pinPressed + '" aria-label="' + esc(pinLabel) + '">' +
          (pinned[material.id] ? "Pinned" : "Pin") + "</button>" +
          "</div>";
      });
      html += "</div></section>";
    });
    if (!shown) html = '<p class="empty">No item matches that.</p>';
    boardEl.innerHTML = html;
  }

  function renderDetail(from, to) {
    var material = materials[selected];
    if (!material) {
      detailEl.innerHTML = '<p class="empty">That item is not in this set.</p>';
      return;
    }
    var cat = categories[material.category];
    var pinned = pins.indexOf(material.id) !== -1;
    detailEl.innerHTML =
      '<p class="kicker">' + esc(cat ? cat.label : "") + " · " + esc(material.kind || "") + "</p>" +
      '<div class="detail-title"><h2 id="detail-h" tabindex="-1">' + esc(material.name) + "</h2>" +
      '<div class="detail-side"><span class="sym-lg">' + esc(material.symbol || "") + "</span>" +
      '<button type="button" class="pin-lg" data-pin="' + esc(material.id) + '" aria-pressed="' + (pinned ? "true" : "false") + '">' +
      (pinned ? "Pinned" : "Pin") + "</button></div></div>" +
      '<p class="blurb">' + esc(material.blurb || "") + "</p>" +
      '<div class="split">' +
      section("Made from", "from-h", from, "Nothing in this set makes " + material.name + " at this tier.", material.id) +
      section("Converts to", "to-h", to, material.name + " is not spent by anything in this set at this tier.", material.id) +
      "</div>" +
      (touchesExpansion(material.id)
        ? '<p class="rx-note">Chromatic Expansion can be paired with Extract Chromatic Material and repeated. The ratio is listed. This page does not walk through multiplying a stock.</p>'
        : "");
    var countFrom = document.getElementById("m-from");
    var countTo = document.getElementById("m-to");
    if (countFrom) countFrom.textContent = String(from.length);
    if (countTo) countTo.textContent = String(to.length);
    if (statusEl) {
      var shown = (catalog.nodes || []).filter(visible).length;
      statusEl.textContent = material.name + " — " + from.length + " way" + (from.length === 1 ? "" : "s") +
        " in, " + to.length + " way" + (to.length === 1 ? "" : "s") + " out. " +
        pins.length + " pinned. " + shown + " on the board.";
    }
  }

  function svgEl(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function renderGraph(neighbors) {
    if (!graphEl) return;
    while (graphEl.firstChild) graphEl.removeChild(graphEl.firstChild);
    var near = Object.create(null);
    neighbors.forEach(function (id) { near[id] = true; });
    var NW = 148;
    var NH = 46;
    var GAP = 40;
    var LABEL = 96;
    var PAD = 10;
    var y = PAD;
    var width = 640;

    var defs = svgEl("defs", {});
    ["arrow", "arrow-hot"].forEach(function (id, index) {
      var marker = svgEl("marker", {
        id: id,
        viewBox: "0 0 8 8",
        refX: "7",
        refY: "4",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto"
      });
      marker.appendChild(svgEl("path", {
        d: "M0,0 L8,4 L0,8 Z",
        fill: index === 0 ? "#8d9098" : "#c8b48a"
      }));
      defs.appendChild(marker);
    });
    graphEl.appendChild(defs);
    var edgeLayer = svgEl("g", { class: "g-edges" });
    graphEl.appendChild(edgeLayer);

    function nodeClass(id) {
      if (id === selected) return "g-node is-on";
      if (near[id]) return "g-node is-near";
      return "g-node";
    }

    function addNode(id, x, y0) {
      var material = materials[id];
      if (!material) return;
      var link = svgEl("a", { href: "?item=" + id, class: nodeClass(id), "data-id": id });
      link.appendChild(svgEl("rect", { x: x, y: y0, width: NW, height: NH }));
      link.appendChild(svgEl("text", { x: x + 12, y: y0 + 18, class: "g-sym", text: material.symbol || "" }));
      link.appendChild(svgEl("text", { x: x + 12, y: y0 + 34, class: "g-name", text: material.short || material.name }));
      graphEl.appendChild(link);
    }

    function addLabel(text, y0, rowH) {
      graphEl.appendChild(svgEl("text", {
        x: PAD,
        y: y0 + rowH / 2 + 4,
        class: "g-label",
        text: text
      }));
    }

    function addEdge(x1, y1, x2, y2, aId, bId) {
      var pair = NmsRefine.links(catalog, aId, bId);
      var hot = selected === aId || selected === bId;
      function line(ax, ay, bx, by) {
        var edge = svgEl("line", {
          x1: ax,
          y1: ay,
          x2: bx,
          y2: by,
          class: "g-edge" + (hot ? " is-hot" : "")
        });
        edge.setAttribute("marker-end", hot ? "url(#arrow-hot)" : "url(#arrow)");
        edgeLayer.appendChild(edge);
      }
      if (pair.aToB && pair.bToA) {
        line(x1, y1 - 4, x2, y2 - 4);
        line(x2, y2 + 4, x1, y1 + 4);
      } else if (pair.aToB) {
        line(x1, y1, x2, y2);
      } else if (pair.bToA) {
        line(x2, y2, x1, y1);
      }
    }

    (catalog.lines || []).forEach(function (line) {
      if (line.layout === "fan") {
        var sources = line.sources || [];
        var stack = sources.length * NH + Math.max(0, sources.length - 1) * 8;
        var rowH = Math.max(stack, NH);
        addLabel(line.label, y, rowH);
        var xSrc = LABEL;
        var xTgt = LABEL + NW + 72;
        sources.forEach(function (id, index) {
          var ny = y + index * (NH + 8);
          addNode(id, xSrc, ny);
          addEdge(xSrc + NW, ny + NH / 2, xTgt, y + rowH / 2, id, line.target);
        });
        addNode(line.target, xTgt, y + (rowH - NH) / 2);
        width = Math.max(width, xTgt + NW + PAD);
        y += rowH + 16;
        return;
      }
      var nodes = line.nodes || [];
      addLabel(line.label, y, NH);
      nodes.forEach(function (id, index) {
        var x = LABEL + index * (NW + GAP);
        addNode(id, x, y);
        if (index > 0) {
          var prev = nodes[index - 1];
          addEdge(LABEL + (index - 1) * (NW + GAP) + NW, y + NH / 2, x, y + NH / 2, prev, id);
        }
      });
      if (nodes.length) width = Math.max(width, LABEL + nodes.length * (NW + GAP) - GAP + PAD);
      y += NH + 16;
    });

    graphEl.setAttribute("viewBox", "0 0 " + width + " " + (y + 4));
    graphEl.setAttribute("width", String(width));
    graphEl.setAttribute("height", String(y + 4));
  }

  function touchesExpansion(id) {
    return (catalog.edges || []).some(function (edge) {
      if (edge.name !== "Chromatic Expansion") return false;
      if (edge.out && edge.out.id === id) return true;
      return (edge.inputs || []).some(function (input) { return input.id === id; });
    });
  }

  function tiered(list) {
    return NmsRefine.sortEdges(list.filter(function (edge) {
      return NmsRefine.passesTier(edge, tier);
    }));
  }

  function render(focus) {
    var from = tiered(NmsRefine.producing(catalog, selected));
    var to = tiered(NmsRefine.consuming(catalog, selected));
    var neighbors = NmsRefine.neighborIds(catalog, selected);
    renderCats();
    renderTray();
    renderBoard(neighbors);
    renderDetail(from, to);
    renderGraph(neighbors);
    if (focus === "detail") {
      var heading = document.getElementById("detail-h");
      if (heading) heading.focus();
    }
    if (focus === "tile") {
      var tile = boardEl.querySelector('[data-id="' + selected + '"]');
      if (tile) tile.focus();
    }
    if (focus === "view" && window.matchMedia && window.matchMedia("(max-width: 800px)").matches) {
      var panel = document.querySelector(".detail-col") || detailEl;
      var root = document.documentElement;
      var previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      panel.scrollIntoView({ block: "start", behavior: "auto" });
      root.style.scrollBehavior = previous;
    }
  }

  function select(id, focus) {
    if (!materials[id]) id = "pure_ferrite";
    selected = id;
    writeAddress();
    render(focus || false);
  }

  function pin(id) {
    if (!materials[id]) return;
    pins = NmsRefine.togglePin(pins, id);
    writeStoredPins();
    writeAddress();
    render(false);
  }

  function onClick(event) {
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
    var go = event.target.closest("[data-go]");
    if (go) {
      query = "";
      if (filterEl) filterEl.value = "";
      select(go.getAttribute("data-go"), "detail");
      return;
    }
    var tile = event.target.closest(".tile[data-id]");
    if (!tile || !boardEl.contains(tile)) return;
    select(tile.getAttribute("data-id"), "view");
    if (window.matchMedia && window.matchMedia("(max-width: 800px)").matches) {
      var heading = document.getElementById("detail-h");
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  boardEl.addEventListener("click", onClick);
  detailEl.addEventListener("click", onClick);
  if (trayEl) trayEl.addEventListener("click", onClick);
  if (graphEl) {
    graphEl.addEventListener("click", function (event) {
      var node = event.target.closest("[data-id]");
      if (!node) return;
      event.preventDefault();
      query = "";
      if (filterEl) filterEl.value = "";
      select(node.getAttribute("data-id"), "detail");
    });
  }

  if (catsEl) {
    catsEl.addEventListener("click", function (event) {
      var button = event.target.closest("[data-cat]");
      if (!button) return;
      category = button.getAttribute("data-cat") || "all";
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

  var tierEl = document.getElementById("tiers");
  if (tierEl) {
    tierEl.addEventListener("click", function (event) {
      var button = event.target.closest("[data-tier]");
      if (!button) return;
      tier = button.getAttribute("data-tier") || "all";
      [].slice.call(tierEl.querySelectorAll("[data-tier]")).forEach(function (el) {
        el.setAttribute("aria-pressed", String(el === button));
      });
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
        if (tile.getAttribute("data-id") === selected) {
          r = ri;
          c = ci;
          found = true;
        }
      });
    });
    if (!found) {
      select(rows[0].tiles[0].getAttribute("data-id"), "tile");
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
    select(rows[r].tiles[c].getAttribute("data-id"), "tile");
  }

  function applyLocation(write) {
    var share = NmsRefine.parseShare(location.search);
    var hash = (location.hash || "").replace(/^#/, "");
    if (materials[share.item]) selected = share.item;
    else if (materials[hash]) selected = hash;
    else if (!materials[selected]) selected = "pure_ferrite";
    if (share.pins) pins = cleanPins(share.pins);
    else pins = cleanPins(readStoredPins());
    writeStoredPins();
    if (write) writeAddress();
    render(false);
  }

  window.addEventListener("popstate", function () {
    if (!materials) return;
    applyLocation(false);
  });

  fetch("minerals.json", { credentials: "same-origin" })
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
      var rxCount = document.getElementById("m-rx");
      if (matCount) matCount.textContent = String(catalog.nodes.length);
      if (rxCount) rxCount.textContent = String(catalog.edges.length);
      var sources = document.getElementById("sources");
      if (sources && catalog.meta && catalog.meta.sources) {
        sources.innerHTML = catalog.meta.sources.map(function (source) {
          return '<li><a href="' + esc(source.url) + '" rel="noopener">' + esc(source.name) + "</a></li>";
        }).join("");
      }
      applyLocation(true);
    })
    .catch(function (err) {
      if (statusEl) statusEl.textContent = "Could not read the tech tree.";
      boardEl.innerHTML = '<p class="empty">The recipe file did not load.</p>';
      if (typeof console !== "undefined" && console.warn) console.warn(err);
    });
})();
