/*! refine.js — derive both directions of the No Man's Sky basic-mineral refine set. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NmsRefine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var REFINERS = {
    any: "Portable, medium, or large",
    medium: "Medium or large",
    large: "Large",
    inventory: "Inventory blueprint"
  };

  function byId(list) {
    var map = Object.create(null);
    (list || []).forEach(function (item) {
      if (item && item.id) map[item.id] = item;
    });
    return map;
  }

  function producing(catalog, id) {
    return (catalog.recipes || []).filter(function (recipe) {
      return recipe.output && recipe.output.id === id;
    });
  }

  function consuming(catalog, id) {
    return (catalog.recipes || []).filter(function (recipe) {
      return (recipe.inputs || []).some(function (input) {
        return input.id === id;
      });
    });
  }

  function neighborIds(catalog, id) {
    var set = Object.create(null);
    producing(catalog, id).forEach(function (recipe) {
      (recipe.inputs || []).forEach(function (input) {
        if (input.id !== id) set[input.id] = true;
      });
    });
    consuming(catalog, id).forEach(function (recipe) {
      if (recipe.output && recipe.output.id !== id) set[recipe.output.id] = true;
      (recipe.inputs || []).forEach(function (input) {
        if (input.id !== id) set[input.id] = true;
      });
    });
    return Object.keys(set);
  }

  function sortRecipes(list) {
    return (list || []).slice().sort(function (a, b) {
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

  function refinerLabel(recipe) {
    if (!recipe) return "";
    if (recipe.method === "blueprint") return REFINERS.inventory;
    return REFINERS[recipe.refiner] || recipe.refiner || "";
  }

  function sameInputs(recipe, inputs) {
    if ((recipe.inputs || []).length !== inputs.length) return false;
    return inputs.every(function (want) {
      return (recipe.inputs || []).some(function (input) {
        return input.id === want.id && input.qty === want.qty;
      });
    });
  }

  function findRecipes(catalog, outputId, outputQty, inputs) {
    return (catalog.recipes || []).filter(function (recipe) {
      if (!recipe.output || recipe.output.id !== outputId) return false;
      if (outputQty != null && recipe.output.qty !== outputQty) return false;
      if (inputs && !sameInputs(recipe, inputs)) return false;
      return true;
    });
  }

  function links(catalog, aId, bId) {
    var aToB = false;
    var bToA = false;
    (catalog.recipes || []).forEach(function (recipe) {
      if (!recipe.output) return;
      var hasA = (recipe.inputs || []).some(function (input) { return input.id === aId; });
      var hasB = (recipe.inputs || []).some(function (input) { return input.id === bId; });
      if (recipe.output.id === bId && hasA) aToB = true;
      if (recipe.output.id === aId && hasB) bToA = true;
    });
    return { aToB: aToB, bToA: bToA };
  }

  function validate(catalog) {
    var errors = [];
    if (!catalog || typeof catalog !== "object") return ["catalog missing"];
    var materials = byId(catalog.materials);
    var groups = byId(catalog.groups);
    var seenM = Object.create(null);
    (catalog.materials || []).forEach(function (material) {
      if (!material.id) {
        errors.push("material missing id");
        return;
      }
      if (seenM[material.id]) errors.push("duplicate material " + material.id);
      seenM[material.id] = true;
      if (!material.name) errors.push("material missing name " + material.id);
      if (material.group && !groups[material.group]) {
        errors.push("unknown group " + material.group + " on " + material.id);
      }
    });
    var seenR = Object.create(null);
    (catalog.recipes || []).forEach(function (recipe) {
      if (!recipe.id) {
        errors.push("recipe missing id");
        return;
      }
      if (seenR[recipe.id]) errors.push("duplicate recipe " + recipe.id);
      seenR[recipe.id] = true;
      if (!recipe.name) errors.push("recipe missing name " + recipe.id);
      if (!recipe.output || !materials[recipe.output.id]) {
        errors.push("bad output on " + recipe.id);
      } else if (!(recipe.output.qty > 0) || recipe.output.qty !== (recipe.output.qty | 0)) {
        errors.push("bad output qty on " + recipe.id);
      }
      if (!recipe.inputs || !recipe.inputs.length) errors.push("no inputs on " + recipe.id);
      (recipe.inputs || []).forEach(function (input) {
        if (!materials[input.id]) errors.push("bad input " + (input && input.id) + " on " + recipe.id);
        if (!(input.qty > 0) || input.qty !== (input.qty | 0)) errors.push("bad input qty on " + recipe.id);
      });
      if (recipe.method === "blueprint") {
        if (recipe.refiner !== "inventory") errors.push("blueprint refiner on " + recipe.id);
      } else if (recipe.method !== "refiner") {
        errors.push("bad method on " + recipe.id);
      } else if (!REFINERS[recipe.refiner] || recipe.refiner === "inventory") {
        errors.push("bad refiner on " + recipe.id);
      }
    });
    (catalog.lines || []).forEach(function (line) {
      var nodes = line.layout === "fan"
        ? (line.sources || []).concat(line.target ? [line.target] : [])
        : (line.nodes || []);
      if (!nodes.length) errors.push("empty line " + (line.id || "?"));
      nodes.forEach(function (id) {
        if (!materials[id]) errors.push("line " + (line.id || "?") + " missing " + id);
      });
    });
    return errors;
  }

  return {
    REFINERS: REFINERS,
    byId: byId,
    producing: producing,
    consuming: consuming,
    neighborIds: neighborIds,
    sortRecipes: sortRecipes,
    refinerLabel: refinerLabel,
    findRecipes: findRecipes,
    links: links,
    validate: validate
  };
});
