#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var api = require("./refine.js");

var failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

var catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "refine.json"), "utf8"));
var errors = api.validate(catalog);
assert(errors.length === 0, "catalog validates" + (errors.length ? "\n    " + errors.join("\n    ") : ""));

function has(outputId, outputQty, inputs, label) {
  var found = api.findRecipes(catalog, outputId, outputQty, inputs);
  assert(found.length === 1, label + (found.length === 1 ? "" : " found " + found.length));
}

has("pure-ferrite", 1, [{ id: "ferrite-dust", qty: 1 }], "1 ferrite dust → 1 pure ferrite");
has("magnetised-ferrite", 1, [{ id: "pure-ferrite", qty: 2 }], "2 pure ferrite → 1 magnetised ferrite");
has("pure-ferrite", 2, [{ id: "magnetised-ferrite", qty: 1 }], "1 magnetised ferrite → 2 pure ferrite");
has("ferrite-dust", 2, [{ id: "rusted-metal", qty: 1 }], "1 rusted metal → 2 ferrite dust");
has("rusted-metal", 1, [{ id: "oxygen", qty: 1 }, { id: "ferrite-dust", qty: 1 }], "ferrite dust + oxygen → 1 rusted metal");
has("rusted-metal", 2, [{ id: "oxygen", qty: 1 }, { id: "pure-ferrite", qty: 1 }], "pure ferrite + oxygen → 2 rusted metal");
has("magnetised-ferrite", 2, [{ id: "pure-ferrite", qty: 1 }, { id: "carbon", qty: 1 }], "pure ferrite + carbon → 2 magnetised ferrite");
has("magnetised-ferrite", 3, [{ id: "pure-ferrite", qty: 1 }, { id: "condensed-carbon", qty: 1 }], "pure ferrite + condensed carbon → 3 magnetised ferrite");
has("condensed-carbon", 1, [{ id: "carbon", qty: 2 }], "2 carbon → 1 condensed carbon");
has("carbon", 2, [{ id: "condensed-carbon", qty: 1 }], "1 condensed carbon → 2 carbon");
has("condensed-carbon", 6, [{ id: "condensed-carbon", qty: 1 }, { id: "oxygen", qty: 2 }], "condensed carbon + 2 oxygen → 6");
has("carbon", 1, [{ id: "oxygen", qty: 1 }], "1 oxygen → 1 carbon");
has("ionised-cobalt", 1, [{ id: "cobalt", qty: 2 }], "2 cobalt → 1 ionised cobalt");
has("cobalt", 2, [{ id: "ionised-cobalt", qty: 1 }], "1 ionised cobalt → 2 cobalt");
has("ionised-cobalt", 6, [{ id: "ionised-cobalt", qty: 1 }, { id: "oxygen", qty: 2 }], "ionised cobalt + 2 oxygen → 6");
has("sodium-nitrate", 1, [{ id: "sodium", qty: 2 }], "2 sodium → 1 sodium nitrate");
has("sodium", 2, [{ id: "sodium-nitrate", qty: 1 }], "1 sodium nitrate → 2 sodium");
has("sodium-nitrate", 2, [{ id: "sodium-nitrate", qty: 1 }, { id: "oxygen", qty: 1 }], "sodium nitrate + oxygen → 2");
has("chlorine", 1, [{ id: "salt", qty: 2 }], "2 salt → 1 chlorine");
has("salt", 2, [{ id: "chlorine", qty: 1 }], "1 chlorine → 2 salt");
has("chlorine", 6, [{ id: "chlorine", qty: 1 }, { id: "oxygen", qty: 2 }], "chlorine + 2 oxygen → 6");
has("chromatic-metal", 1, [{ id: "copper", qty: 2 }], "2 copper → 1 chromatic metal");
has("chromatic-metal", 1, [{ id: "cadmium", qty: 2 }], "2 cadmium → 1 chromatic metal");
has("chromatic-metal", 3, [{ id: "emeril", qty: 2 }], "2 emeril → 3 chromatic metal");
has("chromatic-metal", 4, [{ id: "indium", qty: 2 }], "2 indium → 4 chromatic metal");
has("copper", 2, [{ id: "copper", qty: 1 }, { id: "chromatic-metal", qty: 1 }], "copper + chromatic metal → 2 copper");
has("di-hydrogen-jelly", 1, [{ id: "di-hydrogen", qty: 30 }], "30 di-hydrogen → 1 jelly in the refiner");
has("di-hydrogen", 40, [{ id: "di-hydrogen-jelly", qty: 1 }], "1 jelly → 40 di-hydrogen");
has("di-hydrogen-jelly", 1, [{ id: "di-hydrogen", qty: 40 }], "blueprint spends 40 di-hydrogen");
has("ferrite-dust", 1, [{ id: "paraffinium", qty: 1 }], "1 paraffinium → 1 ferrite dust");

var pureFrom = api.producing(catalog, "pure-ferrite").map(function (recipe) { return recipe.id; }).sort();
assert(pureFrom.indexOf("extract-metallic-elements") !== -1, "pure ferrite is made from ferrite dust");
assert(pureFrom.indexOf("demagnetise-metal") !== -1, "pure ferrite is made from magnetised ferrite");

var pureTo = api.consuming(catalog, "pure-ferrite").map(function (recipe) { return recipe.id; });
assert(pureTo.indexOf("magnetise-metal") !== -1, "pure ferrite magnetises");
assert(pureTo.indexOf("carbonise-pure-carbon") !== -1, "pure ferrite carbonises with carbon");
assert(pureTo.indexOf("oxidise-pure-ferrite") !== -1, "pure ferrite oxidises to rusted metal");

var neighbors = api.neighborIds(catalog, "pure-ferrite");
["ferrite-dust", "magnetised-ferrite", "carbon", "condensed-carbon", "oxygen", "rusted-metal", "chromatic-metal", "copper"].forEach(function (id) {
  assert(neighbors.indexOf(id) !== -1, "pure ferrite touches " + id);
});

var ferrite = api.links(catalog, "ferrite-dust", "pure-ferrite");
assert(ferrite.aToB && !ferrite.bToA, "dust refines to pure ferrite and not back");
var mag = api.links(catalog, "pure-ferrite", "magnetised-ferrite");
assert(mag.aToB && mag.bToA, "pure ferrite and magnetised ferrite convert both ways");

var blueprint = catalog.recipes.filter(function (recipe) { return recipe.id === "craft-di-hydrogen-jelly"; })[0];
assert(blueprint.method === "blueprint" && api.refinerLabel(blueprint) === "Inventory blueprint", "jelly craft is labeled as a blueprint");

assert(catalog.materials.length >= 18, "basic mineral set is present (" + catalog.materials.length + ")");
assert(catalog.meta && catalog.meta.extend, "extend note tells a later pass where to add edges");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all refine checks passed");
