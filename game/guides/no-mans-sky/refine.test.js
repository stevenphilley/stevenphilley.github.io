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

var catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "graph-v2.json"), "utf8"));
var errors = api.validate(catalog);
assert(errors.length === 0, "graph-v2.json validates" + (errors.length ? "\n    " + errors.join("\n    ") : ""));

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
assert(names.indexOf("Chromatic Expansion") !== -1, "chromatic expansion stays in the set");
assert(!catalog.nodes.some(function (node) { return node.id === "silver" || node.id === "gold" || node.id === "platinum"; }), "asteroid metals stay out");

var made = api.producing(catalog, "pure_ferrite").map(function (edge) { return edge.id; });
assert(made.indexOf("extract_metallic_elements") !== -1 && made.indexOf("demagnetise_metal") !== -1, "pure ferrite is made from dust and magnetised ferrite");
var used = api.consuming(catalog, "pure_ferrite").map(function (edge) { return edge.id; });
assert(used.indexOf("magnetise_metal") !== -1, "pure ferrite converts to magnetised ferrite");

var portable = catalog.edges.filter(function (edge) { return api.passesTier(edge, "1"); });
var medium = catalog.edges.filter(function (edge) { return api.passesTier(edge, "2"); });
var crafted = catalog.edges.filter(function (edge) { return api.passesTier(edge, "inventory"); });
assert(portable.length && medium.length && crafted.length && portable.length + medium.length + crafted.length === catalog.edges.length, "tier filter covers every edge");
assert(portable.every(function (edge) { return edge.slots === 1 && edge.kind === "refine"; }), "portable filter is slot 1 refine");
assert(crafted.every(function (edge) { return edge.kind === "craft" && api.slotLabel(edge) === "Inventory"; }), "inventory filter is the blueprint badge");

has("chlorine", 1, [{ id: "salt", qty: 2 }], "Concentrate Salt");
has("salt", 2, [{ id: "chlorine", qty: 1 }], "Salt Production");
var saltOx = has("chlorine", 5, [{ id: "salt", qty: 2 }, { id: "oxygen", qty: 2 }], "Efficient Salt Evaporation");
assert(saltOx.expansion === true && saltOx.slots === 2, "salt oxygen row is an expansion");
var clOx = has("chlorine", 6, [{ id: "chlorine", qty: 1 }, { id: "oxygen", qty: 2 }], "Chlorine Expansion");
assert(clOx.expansion === true, "chlorine oxygen row is an expansion");
has("salt", 1, [{ id: "di_hydrogen", qty: 1 }, { id: "oxygen", qty: 1 }], "di-hydrogen and oxygen make salt");

has("di_hydrogen_jelly", 1, [{ id: "di_hydrogen", qty: 30 }], "refiner condenses thirty di-hydrogen");
has("di_hydrogen", 40, [{ id: "di_hydrogen_jelly", qty: 1 }], "jelly cycles back to forty di-hydrogen");
has("di_hydrogen", 1, [{ id: "tritium", qty: 5 }], "Tritium Cycling");

has("nitrogen", 1, [{ id: "radon", qty: 3 }], "three radon transfer to nitrogen");
has("sulphurine", 1, [{ id: "nitrogen", qty: 1 }, { id: "oxygen", qty: 1 }], "oxygen transfers nitrogen to sulphurine");
has("radon", 1, [{ id: "sulphurine", qty: 1 }, { id: "oxygen", qty: 1 }], "oxygen transfers sulphurine to radon");
has("radon", 1, [{ id: "sulphurine", qty: 3 }], "three sulphurine transfer to radon");
has("carbon", 2, [{ id: "cactus_flesh", qty: 1 }], "cactus burns to carbon");
has("carbon", 2, [{ id: "star_bulb", qty: 1 }], "star bulb burns to carbon");
has("star_bulb", 2, [{ id: "star_bulb", qty: 1 }, { id: "paraffinium", qty: 1 }], "paraffinium expands star bulb");
has("paraffinium", 1, [{ id: "star_bulb", qty: 2 }, { id: "salt", qty: 1 }], "star bulb titrates to paraffinium");

var plating = has("metal_plating", 1, [{ id: "ferrite_dust", qty: 50 }], "Metal Plating");
assert(plating.kind === "craft" && api.slotLabel(plating) === "Inventory", "metal plating is an inventory badge");
has("hermetic_seal", 1, [{ id: "condensed_carbon", qty: 30 }], "Hermetic Seal");
has("carbon_nanotubes", 1, [{ id: "carbon", qty: 50 }], "Carbon Nanotubes");
has("microprocessor", 1, [{ id: "chromatic_metal", qty: 40 }, { id: "carbon_nanotubes", qty: 1 }], "Microprocessor");
has("antimatter_housing", 1, [{ id: "oxygen", qty: 30 }, { id: "ferrite_dust", qty: 50 }], "Antimatter Housing");
has("antimatter", 1, [{ id: "chromatic_metal", qty: 25 }, { id: "condensed_carbon", qty: 20 }], "Antimatter");
has("ion_battery", 1, [{ id: "ferrite_dust", qty: 5 }, { id: "cobalt", qty: 10 }], "Ion Battery");
has("life_support_gel", 1, [{ id: "di_hydrogen_jelly", qty: 1 }, { id: "carbon", qty: 20 }], "Life Support Gel");
has("warp_cell", 1, [{ id: "antimatter_housing", qty: 1 }, { id: "antimatter", qty: 1 }], "Warp Cell");
var jellyCraft = has("di_hydrogen_jelly", 1, [{ id: "di_hydrogen", qty: 40 }], "blueprint jelly is forty");
assert(jellyCraft.kind === "craft", "forty di-hydrogen is the blueprint, not the refiner");

var glasses = api.findEdges(catalog, "glass", 1, [{ id: "frost_crystal", qty: 40 }]);
assert(glasses.length === 2, "frost crystal makes glass two ways, found " + glasses.length);
assert(glasses.some(function (edge) { return edge.kind === "craft" && edge.name === "Glass" && api.slotLabel(edge) === "Inventory"; }), "glass blueprint is inventory");
assert(glasses.some(function (edge) { return edge.kind === "refine" && edge.name === "Polish Crystals" && edge.slots === 1; }), "polish crystals is portable");
has("glass", 1, [{ id: "silicate_powder", qty: 40 }], "Silicate Forging");
has("lubricant", 1, [{ id: "faecium", qty: 50 }, { id: "gamma_root", qty: 400 }], "Lubricant");
has("circuit_board", 1, [{ id: "heat_capacitor", qty: 1 }, { id: "poly_fibre", qty: 1 }], "Circuit Board");
has("living_glass", 1, [{ id: "lubricant", qty: 1 }, { id: "glass", qty: 5 }], "Living Glass");
var bonded = has("chlorine", 2, [{ id: "kelp_sac", qty: 1 }, { id: "oxygen", qty: 1 }], "Bonded Chlorine Extraction");
assert(bonded.kind === "refine" && bonded.slots === 2, "bonded chlorine is a two-slot refine");
has("nitrogen_salt", 1, [{ id: "nitrogen", qty: 250 }, { id: "condensed_carbon", qty: 50 }], "Nitrogen Salt");
has("unstable_plasma", 1, [{ id: "oxygen", qty: 50 }, { id: "metal_plating", qty: 1 }], "Unstable Plasma");

assert(catalog.nodes.every(function (node) { return node.category && node.kind; }), "every node has a category and a kind");
assert(catalog.nodes.filter(function (node) { return node.kind === "component"; }).length === 20, "twenty crafted components");
var faecium = catalog.nodes.filter(function (node) { return node.id === "faecium"; })[0];
assert(faecium && (faecium.aliases || []).indexOf("coprite") !== -1, "faecium answers to coprite");
assert(!catalog.nodes.some(function (node) { return node.id === "wiring_loom" || node.id === "starship_launch_fuel" || node.id === "portable_refiner"; }), "loom, launch fuel, and the portable refiner stay out");
assert(!catalog.edges.some(function (edge) { return /loom|launch fuel/i.test((edge.name || "") + " " + (edge.id || "")); }), "no loom or launch-fuel edge");
assert(!catalog.edges.some(function (edge) {
  return edge.out && edge.out.id === "carbon" && (edge.inputs || []).some(function (input) { return input.id === "frost_crystal"; });
}), "frost crystal does not burn to carbon");

var share = api.parseShare("?item=pure_ferrite&pins=salt,warp_cell");
assert(share.item === "pure_ferrite" && share.pins.join(",") === "salt,warp_cell", "share query reads item and pins");
assert(api.formatShare("pure_ferrite", ["salt", "warp_cell"]) === "?item=pure_ferrite&pins=salt,warp_cell", "share query writes item and pins");
assert(api.formatShare("pure_ferrite", []) === "?item=pure_ferrite", "empty pins drop off the query");
var pinned = api.togglePin(["salt"], "warp_cell");
assert(pinned.join(",") === "salt,warp_cell", "pin appends");
assert(api.togglePin(pinned, "salt").join(",") === "warp_cell", "pin removes");
assert(api.parseShare("?item=gold").pins === null, "a missing pins param leaves local pins alone");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all mineral checks passed");
