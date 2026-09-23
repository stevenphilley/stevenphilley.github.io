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

var catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "refine", "minerals.json"), "utf8"));
var errors = api.validate(catalog);
assert(errors.length === 0, "minerals.json validates" + (errors.length ? "\n    " + errors.join("\n    ") : ""));

function has(outId, outQty, inputs, label) {
  var found = api.findEdges(catalog, outId, outQty, inputs);
  assert(found.length === 1, label + (found.length === 1 ? "" : " found " + found.length));
  return found[0];
}

var dust = has("pure_ferrite", 1, [{ id: "ferrite_dust", qty: 1 }], "Extract Metallic Elements");
assert(dust.name === "Extract Metallic Elements" && dust.slots === 1 && api.slotLabel(dust) === "1 Portable", "first edge is portable");

var mag = has("magnetised_ferrite", 1, [{ id: "pure_ferrite", qty: 2 }], "Magnetise Metal");
assert(mag.slots === 1, "magnetise is one slot");
has("pure_ferrite", 2, [{ id: "magnetised_ferrite", qty: 1 }], "Demagnetise Metal");
has("ferrite_dust", 2, [{ id: "rusted_metal", qty: 1 }], "Recycle Waste Materials");
has("rusted_metal", 1, [{ id: "oxygen", qty: 1 }, { id: "ferrite_dust", qty: 1 }], "oxidise dust");
has("rusted_metal", 2, [{ id: "oxygen", qty: 1 }, { id: "pure_ferrite", qty: 1 }], "oxidise pure ferrite");
var carbonise = has("magnetised_ferrite", 2, [{ id: "pure_ferrite", qty: 1 }, { id: "carbon", qty: 1 }], "carbonise pure ferrite");
assert(api.slotLabel(carbonise) === "2 Medium+", "two-input badge is Medium+");
has("magnetised_ferrite", 3, [{ id: "pure_ferrite", qty: 1 }, { id: "condensed_carbon", qty: 1 }], "carbonise with condensed carbon");
has("ferrite_dust", 1, [{ id: "paraffinium", qty: 1 }], "paraffinium to ferrite dust");

has("condensed_carbon", 1, [{ id: "carbon", qty: 2 }], "Condense Carbon");
has("carbon", 2, [{ id: "condensed_carbon", qty: 1 }], "Release Carbon");
var o2c = has("condensed_carbon", 6, [{ id: "condensed_carbon", qty: 1 }, { id: "oxygen", qty: 2 }], "oxygen expands condensed carbon");
assert(o2c.expansion === true, "condensed carbon oxygen row is an expansion");
var o2co = has("ionised_cobalt", 6, [{ id: "ionised_cobalt", qty: 1 }, { id: "oxygen", qty: 2 }], "oxygen expands ionised cobalt");
assert(o2co.expansion === true, "ionised cobalt oxygen row is an expansion");
var o2n = has("sodium_nitrate", 2, [{ id: "sodium_nitrate", qty: 1 }, { id: "oxygen", qty: 1 }], "oxygen expands sodium nitrate");
assert(o2n.expansion === true, "sodium nitrate oxygen row is an expansion");

has("sodium_nitrate", 1, [{ id: "sodium", qty: 2 }], "Process Sodium");
has("sodium", 2, [{ id: "sodium_nitrate", qty: 1 }], "Free Sodium");
has("ionised_cobalt", 1, [{ id: "cobalt", qty: 2 }], "Ionise Mineral");
has("cobalt", 2, [{ id: "ionised_cobalt", qty: 1 }], "Deionise Mineral");

has("chromatic_metal", 1, [{ id: "copper", qty: 2 }], "2 copper → 1 chromatic metal");
has("chromatic_metal", 1, [{ id: "cadmium", qty: 2 }], "2 cadmium → 1 chromatic metal");
has("chromatic_metal", 3, [{ id: "emeril", qty: 2 }], "2 emeril → 3 chromatic metal");
has("chromatic_metal", 4, [{ id: "indium", qty: 2 }], "2 indium → 4 chromatic metal");
var loop = has("indium", 2, [{ id: "indium", qty: 1 }, { id: "chromatic_metal", qty: 1 }], "Chromatic Expansion");
assert(loop.name === "Chromatic Expansion" && loop.slots === 2, "expansion is a two-slot ratio, not a walkthrough");

var names = catalog.edges.map(function (edge) { return edge.name; });
assert(names[0] === "Extract Metallic Elements", "list opens on Extract Metallic Elements");
assert(names[names.length - 1] === "Chromatic Expansion", "list closes on Chromatic Expansion");
assert(names.indexOf("Mineral Alchemy") === -1, "silver mineral alchemy is omitted");
assert(!catalog.nodes.some(function (node) { return node.id === "silver" || node.id === "salt" || node.id === "di_hydrogen"; }), "v1 nodes stay inside the mineral set");

var made = api.producing(catalog, "pure_ferrite").map(function (edge) { return edge.id; });
assert(made.indexOf("extract_metallic_elements") !== -1 && made.indexOf("demagnetise_metal") !== -1, "pure ferrite is made from dust and magnetised ferrite");
var used = api.consuming(catalog, "pure_ferrite").map(function (edge) { return edge.id; });
assert(used.indexOf("magnetise_metal") !== -1, "pure ferrite converts to magnetised ferrite");

var portable = catalog.edges.filter(function (edge) { return api.passesTier(edge, "1"); });
var medium = catalog.edges.filter(function (edge) { return api.passesTier(edge, "2"); });
assert(portable.length && medium.length && portable.length + medium.length === catalog.edges.length, "tier filter covers every edge");
assert(portable.every(function (edge) { return edge.slots === 1; }), "portable filter is slot 1");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all mineral checks passed");
