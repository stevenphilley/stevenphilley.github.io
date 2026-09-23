/*! refine.js — both directions of the basic-mineral edge list. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NmsRefine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var NODES = [
    "ferrite_dust", "pure_ferrite", "magnetised_ferrite", "rusted_metal",
    "carbon", "condensed_carbon", "sodium", "sodium_nitrate", "oxygen",
    "cobalt", "ionised_cobalt", "copper", "cadmium", "emeril", "indium",
    "chromatic_metal", "paraffinium"
  ];

  function byId(list) {
    var map = Object.create(null);
    (list || []).forEach(function (item) {
      if (item && item.id) map[item.id] = item;
    });
    return map;
  }

  function edges(catalog) {
    return (catalog && catalog.edges) || [];
  }

  function outOf(edge) {
    return edge && edge.out;
  }

  function producing(catalog, id) {
    return edges(catalog).filter(function (edge) {
      var out = outOf(edge);
      return out && out.id === id;
    });
  }

  function consuming(catalog, id) {
    return edges(catalog).filter(function (edge) {
      return (edge.inputs || []).some(function (input) {
        return input.id === id;
      });
    });
  }

  function neighborIds(catalog, id) {
    var set = Object.create(null);
    producing(catalog, id).forEach(function (edge) {
      (edge.inputs || []).forEach(function (input) {
        if (input.id !== id) set[input.id] = true;
      });
    });
    consuming(catalog, id).forEach(function (edge) {
      var out = outOf(edge);
      if (out && out.id !== id) set[out.id] = true;
      (edge.inputs || []).forEach(function (input) {
        if (input.id !== id) set[input.id] = true;
      });
    });
    return Object.keys(set);
  }

  function sortEdges(list) {
    return (list || []).slice().sort(function (a, b) {
      var as = a.slots || 9;
      var bs = b.slots || 9;
      if (as !== bs) return as - bs;
      var ai = (a.inputs || []).length;
      var bi = (b.inputs || []).length;
      if (ai !== bi) return ai - bi;
      var an = a.name || "";
      var bn = b.name || "";
      if (an < bn) return -1;
      if (an > bn) return 1;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
  }

  function slotLabel(edge) {
    if (!edge) return "";
    if (edge.slots === 1) return "1 Portable";
    if (edge.slots === 2) return "2 Medium+";
    return edge.slots ? String(edge.slots) : "";
  }

  function passesTier(edge, tier) {
    if (!tier || tier === "all") return true;
    return String(edge.slots) === String(tier);
  }

  function sameInputs(edge, inputs) {
    if ((edge.inputs || []).length !== inputs.length) return false;
    return inputs.every(function (want) {
      return (edge.inputs || []).some(function (input) {
        return input.id === want.id && input.qty === want.qty;
      });
    });
  }

  function findEdges(catalog, outId, outQty, inputs) {
    return edges(catalog).filter(function (edge) {
      var out = outOf(edge);
      if (!out || out.id !== outId) return false;
      if (outQty != null && out.qty !== outQty) return false;
      if (inputs && !sameInputs(edge, inputs)) return false;
      return true;
    });
  }

  function links(catalog, aId, bId) {
    var aToB = false;
    var bToA = false;
    edges(catalog).forEach(function (edge) {
      var out = outOf(edge);
      if (!out) return;
      var hasA = (edge.inputs || []).some(function (input) { return input.id === aId; });
      var hasB = (edge.inputs || []).some(function (input) { return input.id === bId; });
      if (out.id === bId && hasA) aToB = true;
      if (out.id === aId && hasB) bToA = true;
    });
    return { aToB: aToB, bToA: bToA };
  }

  function validate(catalog) {
    var errors = [];
    if (!catalog || typeof catalog !== "object") return ["catalog missing"];
    var nodes = byId(catalog.nodes);
    var groups = byId(catalog.groups);
    var seen = Object.create(null);
    (catalog.nodes || []).forEach(function (node) {
      if (!node.id) {
        errors.push("node missing id");
        return;
      }
      if (seen[node.id]) errors.push("duplicate node " + node.id);
      seen[node.id] = true;
      if (!node.name) errors.push("node missing name " + node.id);
      if (node.group && !groups[node.group]) errors.push("unknown group " + node.group + " on " + node.id);
      if (/ionized|magnetized/i.test(node.name || "")) errors.push("American spelling on " + node.id);
    });
    NODES.forEach(function (id) {
      if (!nodes[id]) errors.push("missing node " + id);
    });
    Object.keys(seen).forEach(function (id) {
      if (NODES.indexOf(id) === -1) errors.push("unexpected node " + id);
    });
    if (nodes.silver) errors.push("silver node is out of v1");
    var seenE = Object.create(null);
    edges(catalog).forEach(function (edge) {
      if (!edge.id) {
        errors.push("edge missing id");
        return;
      }
      if (seenE[edge.id]) errors.push("duplicate edge " + edge.id);
      seenE[edge.id] = true;
      if (!edge.name) errors.push("edge missing name " + edge.id);
      if (edge.slots !== 1 && edge.slots !== 2) errors.push("bad slots on " + edge.id);
      var out = outOf(edge);
      if (!out || !nodes[out.id]) errors.push("bad out on " + edge.id);
      else if (!(out.qty > 0) || out.qty !== (out.qty | 0)) errors.push("bad out qty on " + edge.id);
      if (!edge.inputs || !edge.inputs.length) errors.push("no inputs on " + edge.id);
      if ((edge.inputs || []).length !== edge.slots) errors.push("slots do not match inputs on " + edge.id);
      (edge.inputs || []).forEach(function (input) {
        if (!nodes[input.id]) errors.push("bad input " + (input && input.id) + " on " + edge.id);
        if (input.id === "silver") errors.push("silver edge " + edge.id);
        if (!(input.qty > 0) || input.qty !== (input.qty | 0)) errors.push("bad input qty on " + edge.id);
      });
      if (edge.name === "Mineral Alchemy") errors.push("mineral alchemy omitted " + edge.id);
    });
    (catalog.lines || []).forEach(function (line) {
      var ids = line.layout === "fan"
        ? (line.sources || []).concat(line.target ? [line.target] : [])
        : (line.nodes || []);
      ids.forEach(function (id) {
        if (!nodes[id]) errors.push("line " + (line.id || "?") + " missing " + id);
      });
    });
    return errors;
  }

  return {
    NODES: NODES,
    byId: byId,
    producing: producing,
    consuming: consuming,
    neighborIds: neighborIds,
    sortEdges: sortEdges,
    slotLabel: slotLabel,
    passesTier: passesTier,
    findEdges: findEdges,
    links: links,
    validate: validate
  };
});
