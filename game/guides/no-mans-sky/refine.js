/*! refine.js — shared refine and craft graph for the moodboard, explorer, and planner. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NmsRefine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PIN_KEY = "nms-graph-pins";
  var PIN_KEY_LEGACY = "nms-tech-pins";

  var NODES = [
    "ferrite_dust", "pure_ferrite", "magnetised_ferrite", "rusted_metal",
    "carbon", "condensed_carbon", "sodium", "sodium_nitrate", "oxygen",
    "cobalt", "ionised_cobalt", "copper", "cadmium", "emeril", "indium",
    "chromatic_metal", "paraffinium",
    "salt", "chlorine", "di_hydrogen", "di_hydrogen_jelly", "tritium",
    "nitrogen", "sulphurine", "radon",
    "metal_plating", "hermetic_seal", "carbon_nanotubes", "microprocessor",
    "antimatter_housing", "antimatter", "ion_battery",
    "life_support_gel", "warp_cell",
    "cactus_flesh", "fungal_mould", "gamma_root", "solanium", "star_bulb",
    "frost_crystal", "kelp_sac", "faecium", "mordite",
    "dioxite", "phosphorus", "uranium", "ammonia", "pyrite", "silicate_powder",
    "glass", "lubricant", "heat_capacitor", "poly_fibre", "circuit_board",
    "living_glass", "nitrogen_salt", "enriched_carbon", "thermic_condensate",
    "unstable_plasma"
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
    if (edge.kind === "craft") return "Inventory";
    if (edge.slots === 1) return "1 Portable";
    if (edge.slots === 2) return "2 Medium+";
    return edge.slots ? String(edge.slots) : "";
  }

  function passesTier(edge, tier) {
    if (!tier || tier === "all") return true;
    if (tier === "craft" || tier === "inventory") return edge.kind === "craft";
    if (edge.kind === "craft") return false;
    return String(edge.slots) === String(tier);
  }

  function parseShare(search) {
    var params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
    var item = params.get("item") || "";
    var pins = null;
    if (params.has("pins")) {
      pins = String(params.get("pins") || "").split(",").map(function (id) {
        return id.trim();
      }).filter(Boolean);
    }
    return { item: item, pins: pins };
  }

  function formatShare(item, pins) {
    var parts = [];
    if (item) parts.push("item=" + encodeURIComponent(item));
    if (pins && pins.length) {
      parts.push("pins=" + pins.map(function (id) {
        return encodeURIComponent(id);
      }).join(","));
    }
    return parts.length ? "?" + parts.join("&") : "";
  }

  function togglePin(pins, id) {
    var next = (pins || []).slice();
    var index = next.indexOf(id);
    if (index === -1) next.push(id);
    else next.splice(index, 1);
    return next;
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
    var categories = byId(catalog.categories);
    var seen = Object.create(null);
    (catalog.nodes || []).forEach(function (node) {
      if (!node.id) {
        errors.push("node missing id");
        return;
      }
      if (seen[node.id]) errors.push("duplicate node " + node.id);
      seen[node.id] = true;
      if (!node.name) errors.push("node missing name " + node.id);
      if (node.kind !== "resource" && node.kind !== "component") errors.push("bad kind on " + node.id);
      if (!node.category || !categories[node.category]) errors.push("unknown category " + node.category + " on " + node.id);
      if (node.group && !groups[node.group]) errors.push("unknown group " + node.group + " on " + node.id);
      if (/ionized|magnetized|sulfurine/i.test(node.name || "")) errors.push("American spelling on " + node.id);
    });
    NODES.forEach(function (id) {
      if (!nodes[id]) errors.push("missing node " + id);
    });
    Object.keys(seen).forEach(function (id) {
      if (NODES.indexOf(id) === -1) errors.push("unexpected node " + id);
    });
    var seenE = Object.create(null);
    edges(catalog).forEach(function (edge) {
      if (!edge.id) {
        errors.push("edge missing id");
        return;
      }
      if (seenE[edge.id]) errors.push("duplicate edge " + edge.id);
      seenE[edge.id] = true;
      if (!edge.name) errors.push("edge missing name " + edge.id);
      if (edge.kind !== "refine" && edge.kind !== "craft") errors.push("bad edge kind on " + edge.id);
      if (edge.kind === "refine") {
        if (edge.slots !== 1 && edge.slots !== 2) errors.push("bad slots on " + edge.id);
        if ((edge.inputs || []).length !== edge.slots) errors.push("slots do not match inputs on " + edge.id);
      } else if (edge.slots != null) {
        errors.push("craft edge has slots " + edge.id);
      }
      var out = outOf(edge);
      if (!out || !nodes[out.id]) errors.push("bad out on " + edge.id);
      else if (!(out.qty > 0) || out.qty !== (out.qty | 0)) errors.push("bad out qty on " + edge.id);
      if (!edge.inputs || !edge.inputs.length) errors.push("no inputs on " + edge.id);
      (edge.inputs || []).forEach(function (input) {
        if (!nodes[input.id]) errors.push("bad input " + (input && input.id) + " on " + edge.id);
        if (!(input.qty > 0) || input.qty !== (input.qty | 0)) errors.push("bad input qty on " + edge.id);
      });
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
    PIN_KEY: PIN_KEY,
    PIN_KEY_LEGACY: PIN_KEY_LEGACY,
    NODES: NODES,
    byId: byId,
    producing: producing,
    consuming: consuming,
    neighborIds: neighborIds,
    sortEdges: sortEdges,
    slotLabel: slotLabel,
    passesTier: passesTier,
    parseShare: parseShare,
    formatShare: formatShare,
    togglePin: togglePin,
    findEdges: findEdges,
    links: links,
    validate: validate
  };
});
