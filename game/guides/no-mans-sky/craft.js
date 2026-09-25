/*! craft.js — technology install tree. Recipes come from technology.json.
 *  Refiner steps reuse a fixed list of edges in graph-v2.json.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NmsCraft = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // One-way ladders. Copper is the yellow-star path into chromatic metal.
  var PRIMARY_REFINE = {
    "extract-metallic-elements": true,
    "magnetise-metal": true,
    "condense-carbon": true,
    "process-sodium": true,
    "ionise-mineral": true,
    "concentrate-salt-salt-2": true,
    "chromatic-copper": true
  };

  function byId(list) {
    var map = Object.create(null);
    (list || []).forEach(function (item) {
      if (item && item.id) map[item.id] = item;
    });
    return map;
  }

  function itemsOf(tech) {
    return (tech && tech.items) || [];
  }

  function recipeOf(item) {
    if (!item || item.procedural || !item.recipe) return null;
    if (!item.recipe.inputs || !item.recipe.inputs.length) return null;
    return item.recipe;
  }

  function refineEdge(graph, id) {
    var found = null;
    ((graph && graph.edges) || []).forEach(function (edge) {
      if (found || !edge || !PRIMARY_REFINE[edge.id]) return;
      if (!edge.out || edge.out.id !== id) return;
      if (edge.expansion) return;
      found = edge;
    });
    return found;
  }

  function usedIn(tech, id) {
    var rows = [];
    itemsOf(tech).forEach(function (item) {
      var recipe = recipeOf(item);
      if (!recipe) return;
      (recipe.inputs || []).forEach(function (input) {
        if (input.id === id) rows.push(item);
      });
    });
    rows.sort(function (a, b) {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    return rows;
  }

  function expand(tech, graph, itemId, qty) {
    var index = byId(itemsOf(tech));
    var asked = qty == null ? 1 : qty;
    var steps = [];
    var raw = Object.create(null);
    var cycles = [];
    var visiting = Object.create(null);

    function addRaw(id, amount) {
      raw[id] = (raw[id] || 0) + amount;
    }

    function walk(id, amount, stack) {
      if (!(amount > 0)) return { id: id, qty: 0, children: [] };
      if (visiting[id]) {
        var cycle = stack.concat(id).join(" -> ");
        if (cycles.indexOf(cycle) === -1) cycles.push(cycle);
        addRaw(id, amount);
        return { id: id, qty: amount, cycle: true, children: [] };
      }
      var item = index[id];
      var craft = recipeOf(item);
      var refine = craft ? null : refineEdge(graph, id);
      var edge = craft || (refine ? {
        outQty: refine.out.qty,
        inputs: refine.inputs,
        source: "graph-v2:" + refine.id,
        name: refine.name
      } : null);
      if (!edge || !(edge.outQty > 0)) {
        addRaw(id, amount);
        return { id: id, qty: amount, leaf: true, children: [] };
      }
      var batches = Math.ceil(amount / edge.outQty);
      visiting[id] = true;
      var children = (edge.inputs || []).map(function (input) {
        return walk(input.id, input.qty * batches, stack.concat(id));
      });
      visiting[id] = false;
      steps.push({
        id: id,
        source: edge.source || "",
        name: edge.name || (item && item.name) || id,
        batches: batches,
        outQty: edge.outQty,
        asked: amount
      });
      return {
        id: id,
        qty: amount,
        batches: batches,
        outQty: edge.outQty,
        source: edge.source || (craft && craft.source) || "",
        recipeName: edge.name || "",
        refine: !craft,
        children: children
      };
    }

    var tree = walk(itemId, asked, []);
    return { tree: tree, steps: steps, raw: raw, cycles: cycles };
  }

  function craftCycles(tech) {
    var index = byId(itemsOf(tech));
    var cycles = [];
    var color = Object.create(null);

    function walk(id, stack) {
      if (color[id] === 1) {
        var loop = stack.slice(stack.indexOf(id)).concat(id).join(" -> ");
        if (cycles.indexOf(loop) === -1) cycles.push(loop);
        return;
      }
      if (color[id] === 2) return;
      color[id] = 1;
      var recipe = recipeOf(index[id]);
      if (recipe) {
        (recipe.inputs || []).forEach(function (input) {
          walk(input.id, stack.concat(id));
        });
      }
      color[id] = 2;
    }

    Object.keys(index).forEach(function (id) { walk(id, []); });
    return cycles;
  }

  function validate(tech, graph) {
    var errors = [];
    if (!tech || !Array.isArray(tech.items)) return ["technology catalog missing"];
    var index = byId(tech.items);
    var graphNodes = byId((graph && graph.nodes) || []);
    var seen = Object.create(null);
    var known = Object.create(null);
    ((tech.meta && tech.meta.knownCycles) || []).forEach(function (cycle) {
      known[cycle] = true;
    });
    tech.items.forEach(function (item) {
      if (!item.id) {
        errors.push("item missing id");
        return;
      }
      if (seen[item.id]) errors.push("duplicate id " + item.id);
      seen[item.id] = true;
      if (!item.name) errors.push("missing name " + item.id);
      if (!item.slot) errors.push("missing slot " + item.id);
      if (item.procedural && item.recipe) errors.push("procedural item has a recipe " + item.id);
      if (item.kind === "procedural" && item.recipe) errors.push("procedural kind has a recipe " + item.id);
      var recipe = item.recipe;
      if (!recipe) return;
      if (!(recipe.outQty > 0) || recipe.outQty !== (recipe.outQty | 0)) errors.push("bad out qty " + item.id);
      if (!recipe.inputs || !recipe.inputs.length) errors.push("empty recipe " + item.id);
      (recipe.inputs || []).forEach(function (input) {
        if (!input || !index[input.id]) errors.push("unknown ingredient " + (input && input.id) + " on " + item.id);
        if (!(input.qty > 0) || input.qty !== (input.qty | 0)) errors.push("bad qty on " + item.id);
      });
      if (item.graphId && graph && !graphNodes[item.graphId]) errors.push("graph id missing " + item.graphId);
    });
    craftCycles(tech).forEach(function (cycle) {
      if (!known[cycle]) errors.push("cycle " + cycle);
    });
    return errors;
  }

  function mergeCatalog(graph, tech) {
    var nodes = (graph.nodes || []).map(function (node) {
      var copy = {};
      Object.keys(node).forEach(function (key) { copy[key] = node[key]; });
      copy.aliases = (node.aliases || []).slice();
      return copy;
    });
    var edges = (graph.edges || []).slice();
    var have = byId(nodes);
    var craftOut = Object.create(null);
    edges.forEach(function (edge) {
      if (edge && edge.kind === "craft" && edge.out) craftOut[edge.out.id] = true;
    });
    itemsOf(tech).forEach(function (item) {
      if (!item || item.procedural || item.kind === "procedural") return;
      if (!have[item.id]) {
        nodes.push({
          id: item.id,
          name: item.name,
          short: item.name,
          symbol: item.symbol || "",
          blurb: item.blurb || "",
          category: item.slot === "resource" ? "minerals" : "components",
          kind: item.kind === "resource" ? "resource" : "component",
          aliases: (item.aliases || []).slice()
        });
        have[item.id] = nodes[nodes.length - 1];
      } else {
        (item.aliases || []).forEach(function (alias) {
          if (have[item.id].aliases.indexOf(alias) === -1) have[item.id].aliases.push(alias);
        });
      }
      var recipe = recipeOf(item);
      if (!recipe || craftOut[item.id]) return;
      edges.push({
        id: "tech-" + item.id,
        name: item.name,
        kind: "craft",
        station: "inventory",
        inputs: recipe.inputs.map(function (input) {
          return { id: input.id, qty: input.qty };
        }),
        out: { id: item.id, qty: recipe.outQty }
      });
      craftOut[item.id] = true;
    });
    return {
      meta: graph.meta,
      groups: graph.groups,
      categories: graph.categories,
      nodes: nodes,
      edges: edges,
      lines: graph.lines
    };
  }

  return {
    PRIMARY_REFINE: PRIMARY_REFINE,
    byId: byId,
    recipeOf: recipeOf,
    refineEdge: refineEdge,
    usedIn: usedIn,
    expand: expand,
    craftCycles: craftCycles,
    validate: validate,
    mergeCatalog: mergeCatalog
  };
});
