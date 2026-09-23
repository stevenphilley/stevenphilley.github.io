/*! tree.js — two-panel refine browser for the basic mineral set. */
(function () {
  "use strict";

  var catalog = null;
  var materials = null;
  var groups = null;
  var selected = "pure-ferrite";
  var query = "";

  var listEl = document.getElementById("mineral-list");
  var detailEl = document.getElementById("detail");
  var graphEl = document.getElementById("graph");
  var filterEl = document.getElementById("q");
  var statusEl = document.getElementById("status");

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
    var hay = [
      material.name,
      material.short,
      material.symbol,
      material.id,
      material.blurb
    ].concat(material.aliases || []).join(" ").toLowerCase();
    return q.split(/\s+/).every(function (word) {
      return word && hay.indexOf(word) !== -1;
    });
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
    var output = chip(recipe.output, currentId);
    var note = recipe.note ? '<p class="rx-note">' + esc(recipe.note) + "</p>" : "";
    return (
      '<article class="rx">' +
      '<header class="rx-head"><h3>' + esc(recipe.name) + "</h3>" +
      '<span class="tag">' + esc(NmsRefine.refinerLabel(recipe)) + "</span></header>" +
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

  function renderList(neighbors) {
    var near = Object.create(null);
    neighbors.forEach(function (id) { near[id] = true; });
    var html = "";
    var shown = 0;
    (catalog.groups || []).forEach(function (group) {
      var items = (catalog.materials || []).filter(function (material) {
        return material.group === group.id && matches(material, query);
      });
      if (!items.length) return;
      shown += items.length;
      html += '<div class="group"><h2>' + esc(group.label) + "</h2><div class=\"minerals\">";
      items.forEach(function (material) {
        var cls = material.id === selected ? " is-on" : (near[material.id] ? " is-near" : "");
        html +=
          '<button type="button" class="mineral' + cls + '" data-id="' + esc(material.id) + '" aria-pressed="' + (material.id === selected ? "true" : "false") + '">' +
          '<span class="sym">' + esc(material.symbol || "") + "</span>" +
          '<span class="nm">' + esc(material.name) + "</span>" +
          "</button>";
      });
      html += "</div></div>";
    });
    if (!shown) {
      html = '<p class="empty">No material matches that.</p>';
    }
    listEl.innerHTML = html;
  }

  function renderDetail(from, to) {
    var material = materials[selected];
    if (!material) {
      detailEl.innerHTML = '<p class="empty">That material is not in this set.</p>';
      return;
    }
    var group = groups[material.group];
    detailEl.innerHTML =
      '<p class="kicker">' + esc(group ? group.label : "") + (material.tier === "component" ? " · component" : " · mineral") + "</p>" +
      '<div class="detail-title"><h2 id="detail-h" tabindex="-1">' + esc(material.name) + "</h2>" +
      '<span class="sym-lg">' + esc(material.symbol || "") + "</span></div>" +
      '<p class="blurb">' + esc(material.blurb || "") + "</p>" +
      '<div class="split">' +
      section("Converts from", "from-h", from, "Nothing in this set refines into " + material.name + ".", material.id) +
      section("Converts to", "to-h", to, material.name + " is not an input in this set.", material.id) +
      "</div>";
    var countFrom = document.getElementById("m-from");
    var countTo = document.getElementById("m-to");
    if (countFrom) countFrom.textContent = String(from.length);
    if (countTo) countTo.textContent = String(to.length);
    if (statusEl) {
      statusEl.textContent = material.name + " — " + from.length + " way" + (from.length === 1 ? "" : "s") + " in, " + to.length + " way" + (to.length === 1 ? "" : "s") + " out.";
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
      var link = svgEl("a", { href: "#" + id, class: nodeClass(id), "data-id": id });
      link.appendChild(svgEl("rect", { x: x, y: y0, width: NW, height: NH }));
      link.appendChild(svgEl("text", { x: x + 12, y: y0 + 18, class: "g-sym", text: material.symbol || "" }));
      link.appendChild(svgEl("text", { x: x + 12, y: y0 + 34, class: "g-name", text: material.short || material.name }));
      graphEl.appendChild(link);
    }

    function addLabel(text, y0, rowH) {
      var label = svgEl("text", {
        x: PAD,
        y: y0 + rowH / 2 + 4,
        class: "g-label",
        text: text
      });
      graphEl.appendChild(label);
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
          var sy = ny + NH / 2;
          var ty = y + rowH / 2;
          addEdge(xSrc + NW, sy, xTgt, ty, id, line.target);
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

  function render(focusDetail) {
    var from = NmsRefine.sortRecipes(NmsRefine.producing(catalog, selected));
    var to = NmsRefine.sortRecipes(NmsRefine.consuming(catalog, selected));
    var neighbors = NmsRefine.neighborIds(catalog, selected);
    renderList(neighbors);
    renderDetail(from, to);
    renderGraph(neighbors);
    if (focusDetail) {
      var heading = document.getElementById("detail-h");
      if (heading) heading.focus();
    }
  }

  function select(id, focusDetail) {
    if (!materials[id]) id = "pure-ferrite";
    selected = id;
    if (history.replaceState) history.replaceState(null, "", "#" + id);
    render(!!focusDetail);
  }

  function onClick(event) {
    var go = event.target.closest("[data-go]");
    if (go) {
      query = "";
      if (filterEl) filterEl.value = "";
      select(go.getAttribute("data-go"), true);
      return;
    }
    var mineral = event.target.closest("[data-id]");
    if (!mineral) return;
    if (mineral.namespaceURI === "http://www.w3.org/2000/svg" || String(mineral.tagName).toLowerCase() === "a") {
      event.preventDefault();
    }
    select(mineral.getAttribute("data-id"), true);
  }

  listEl.addEventListener("click", onClick);
  detailEl.addEventListener("click", onClick);
  graphEl.addEventListener("click", onClick);

  if (filterEl) {
    filterEl.addEventListener("input", function () {
      query = filterEl.value.trim().toLowerCase();
      render(false);
    });
  }

  window.addEventListener("hashchange", function () {
    var id = (location.hash || "").replace(/^#/, "");
    if (materials[id] && id !== selected) select(id, false);
  });

  fetch("../refine.json", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      var problems = NmsRefine.validate(data);
      if (problems.length) throw new Error(problems[0]);
      catalog = data;
      materials = NmsRefine.byId(catalog.materials);
      groups = NmsRefine.byId(catalog.groups);
      var matCount = document.getElementById("m-mat");
      var rxCount = document.getElementById("m-rx");
      if (matCount) matCount.textContent = String(catalog.materials.length);
      if (rxCount) rxCount.textContent = String(catalog.recipes.length);
      var sources = document.getElementById("sources");
      if (sources && catalog.meta && catalog.meta.sources) {
        sources.innerHTML = catalog.meta.sources.map(function (source) {
          return '<li><a href="' + esc(source.url) + '" rel="noopener">' + esc(source.name) + "</a></li>";
        }).join("");
      }
      var hash = (location.hash || "").replace(/^#/, "");
      selected = materials[hash] ? hash : "pure-ferrite";
      if (history.replaceState) history.replaceState(null, "", "#" + selected);
      render(false);
    })
    .catch(function (err) {
      if (statusEl) statusEl.textContent = "Could not read the refine table.";
      listEl.innerHTML = '<p class="empty">The recipe file did not load.</p>';
      if (typeof console !== "undefined" && console.warn) console.warn(err);
    });
})();
