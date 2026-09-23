/*! tree.js — edge explorer for the shared No Man's Sky graph. */
(function () {
  "use strict";

  var catalog = null;
  var materials = null;
  var categories = null;
  var selected = "pure_ferrite";
  var query = "";
  var tier = "all";
  var category = "all";

  var listEl = document.getElementById("list");
  var detailEl = document.getElementById("detail");
  var graphEl = document.getElementById("graph");
  var filterEl = document.getElementById("q");
  var statusEl = document.getElementById("status");
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

  function renderList(neighbors) {
    var near = Object.create(null);
    neighbors.forEach(function (id) { near[id] = true; });
    var html = "";
    var shown = 0;
    (catalog.categories || []).forEach(function (cat) {
      var items = (catalog.nodes || []).filter(function (material) {
        return material.category === cat.id && visible(material);
      });
      if (!items.length) return;
      shown += items.length;
      html += '<section class="list-group" aria-labelledby="cat-' + esc(cat.id) + '">' +
        '<h2 id="cat-' + esc(cat.id) + '"><i class="swatch cat-' + esc(cat.id) + '" aria-hidden="true"></i>' + esc(cat.label) + "</h2>";
      items.forEach(function (material) {
        var cls = material.id === selected ? " is-on" : (near[material.id] ? " is-near" : "");
        html += '<button type="button" class="row' + cls + '" data-id="' + esc(material.id) + '" aria-pressed="' +
          (material.id === selected ? "true" : "false") + '">' +
          '<span class="sym">' + esc(material.symbol || "") + "</span>" +
          '<span class="nm">' + esc(material.name) + "</span></button>";
      });
      html += "</section>";
    });
    if (!shown) html = '<p class="empty">No item matches that.</p>';
    listEl.innerHTML = html;
  }

  function renderDetail(from, to) {
    var material = materials[selected];
    if (!material) {
      detailEl.innerHTML = '<p class="empty">That item is not in this set.</p>';
      return;
    }
    var cat = categories[material.category];
    detailEl.innerHTML =
      '<p class="kicker">' + esc(cat ? cat.label : "") + " · " + esc(material.kind || "") + "</p>" +
      '<div class="detail-title"><h2 id="detail-h" tabindex="-1">' + esc(material.name) + "</h2>" +
      '<span class="sym-lg">' + esc(material.symbol || "") + "</span></div>" +
      '<p class="blurb">' + esc(material.blurb || "") + "</p>" +
      '<p class="rx-note"><a href="../moodboard/?item=' + encodeURIComponent(material.id) + '">Open on the moodboard</a></p>' +
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
        " in, " + to.length + " way" + (to.length === 1 ? "" : "s") + " out. " + shown + " in the list.";
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
    renderList(neighbors);
    renderDetail(from, to);
    renderGraph(neighbors);
    if (focus === "detail") {
      var heading = document.getElementById("detail-h");
      if (heading) heading.focus();
    }
    if (focus === "row") {
      var row = listEl.querySelector('[data-id="' + selected + '"]');
      if (row) row.focus();
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

  function writeAddress() {
    if (!history.replaceState) return;
    var params = new URLSearchParams(location.search);
    var extra = [];
    ["theme", "sp_theme"].forEach(function (key) {
      if (params.has(key)) extra.push(key + "=" + encodeURIComponent(params.get(key)));
    });
    var next = NmsRefine.formatShare(selected, null);
    if (extra.length) next += (next ? "&" : "?") + extra.join("&");
    history.replaceState(null, "", location.pathname + next);
  }

  function onClick(event) {
    var go = event.target.closest("[data-go]");
    if (go) {
      query = "";
      if (filterEl) filterEl.value = "";
      select(go.getAttribute("data-go"), "detail");
      return;
    }
    var row = event.target.closest(".row[data-id]");
    if (!row || !listEl.contains(row)) return;
    select(row.getAttribute("data-id"), "view");
    if (window.matchMedia && window.matchMedia("(max-width: 800px)").matches) {
      var heading = document.getElementById("detail-h");
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  listEl.addEventListener("click", onClick);
  detailEl.addEventListener("click", onClick);
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
    }
  });

  function applyLocation() {
    var share = NmsRefine.parseShare(location.search);
    var hash = (location.hash || "").replace(/^#/, "");
    if (materials[share.item]) selected = share.item;
    else if (materials[hash]) selected = hash;
    else if (!materials[selected]) selected = "pure_ferrite";
    writeAddress();
    render(false);
  }

  window.addEventListener("popstate", function () {
    if (!materials) return;
    applyLocation();
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
      var rxCount = document.getElementById("m-rx");
      if (matCount) matCount.textContent = String(catalog.nodes.length);
      if (rxCount) rxCount.textContent = String(catalog.edges.length);
      var sources = document.getElementById("sources");
      if (sources && catalog.meta && catalog.meta.sources) {
        sources.innerHTML = catalog.meta.sources.map(function (source) {
          return '<li><a href="' + esc(source.url) + '" rel="noopener">' + esc(source.name) + "</a></li>";
        }).join("");
      }
      var note = document.getElementById("graph-note");
      if (note && catalog.meta && catalog.meta.disclaimer) note.textContent = catalog.meta.disclaimer;
      applyLocation();
    })
    .catch(function (err) {
      if (statusEl) statusEl.textContent = "Could not read the graph.";
      listEl.innerHTML = '<p class="empty">The graph file did not load.</p>';
      if (typeof console !== "undefined" && console.warn) console.warn(err);
    });
})();
