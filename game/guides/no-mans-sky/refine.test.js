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

var dust = has("pure-ferrite", 1, [{ id: "ferrite-dust", qty: 1 }], "Extract Metallic Elements");
assert(dust.name === "Extract Metallic Elements" && dust.slots === 1 && api.slotLabel(dust) === "1 Portable", "first edge is portable");

var mag = has("magnetised-ferrite", 1, [{ id: "pure-ferrite", qty: 2 }], "Magnetise Metal");
assert(mag.slots === 1, "magnetise is one slot");
has("pure-ferrite", 2, [{ id: "magnetised-ferrite", qty: 1 }], "Demagnetise Metal");
has("ferrite-dust", 2, [{ id: "rusted-metal", qty: 1 }], "Recycle Waste Materials");
has("rusted-metal", 1, [{ id: "oxygen", qty: 1 }, { id: "ferrite-dust", qty: 1 }], "oxidise dust");
has("rusted-metal", 2, [{ id: "oxygen", qty: 1 }, { id: "pure-ferrite", qty: 1 }], "oxidise pure ferrite");
var carbonise = has("magnetised-ferrite", 2, [{ id: "pure-ferrite", qty: 1 }, { id: "carbon", qty: 1 }], "carbonise pure ferrite");
assert(api.slotLabel(carbonise) === "2 Medium+", "two-input badge is Medium+");
has("magnetised-ferrite", 3, [{ id: "pure-ferrite", qty: 1 }, { id: "condensed-carbon", qty: 1 }], "carbonise with condensed carbon");
has("ferrite-dust", 1, [{ id: "paraffinium", qty: 1 }], "paraffinium to ferrite dust");

has("condensed-carbon", 1, [{ id: "carbon", qty: 2 }], "Condense Carbon");
has("carbon", 2, [{ id: "condensed-carbon", qty: 1 }], "Release Carbon");
var o2c = has("condensed-carbon", 6, [{ id: "condensed-carbon", qty: 1 }, { id: "oxygen", qty: 2 }], "oxygen expands condensed carbon");
assert(o2c.expansion === true, "condensed carbon oxygen row is an expansion");
var o2co = has("ionised-cobalt", 6, [{ id: "ionised-cobalt", qty: 1 }, { id: "oxygen", qty: 2 }], "oxygen expands ionised cobalt");
assert(o2co.expansion === true, "ionised cobalt oxygen row is an expansion");
var o2n = has("sodium-nitrate", 2, [{ id: "sodium-nitrate", qty: 1 }, { id: "oxygen", qty: 1 }], "oxygen expands sodium nitrate");
assert(o2n.expansion === true, "sodium nitrate oxygen row is an expansion");

has("sodium-nitrate", 1, [{ id: "sodium", qty: 2 }], "Process Sodium");
has("sodium", 2, [{ id: "sodium-nitrate", qty: 1 }], "Free Sodium");
has("ionised-cobalt", 1, [{ id: "cobalt", qty: 2 }], "Ionise Mineral");
has("cobalt", 2, [{ id: "ionised-cobalt", qty: 1 }], "Deionise Mineral");

has("chromatic-metal", 1, [{ id: "copper", qty: 2 }], "2 copper → 1 chromatic metal");
has("chromatic-metal", 1, [{ id: "cadmium", qty: 2 }], "2 cadmium → 1 chromatic metal");
has("chromatic-metal", 3, [{ id: "emeril", qty: 2 }], "2 emeril → 3 chromatic metal");
has("chromatic-metal", 4, [{ id: "indium", qty: 2 }], "2 indium → 4 chromatic metal");
var loop = has("indium", 2, [{ id: "indium", qty: 1 }, { id: "chromatic-metal", qty: 1 }], "Chromatic Expansion");
assert(loop.name === "Chromatic Expansion" && loop.slots === 2, "expansion is a two-slot ratio, not a walkthrough");

var names = catalog.edges.map(function (edge) { return edge.name; });
assert(names[0] === "Extract Metallic Elements", "list opens on Extract Metallic Elements");
assert(names.indexOf("Chromatic Expansion") !== -1, "chromatic expansion stays in the set");
assert(catalog.nodes.some(function (node) { return node.id === "gold" && node.kind === "resource" && node.value === 353; }), "gold is a gathered input");
assert(catalog.nodes.some(function (node) { return node.id === "silver" && node.kind === "resource"; }), "silver is a gathered input");
assert(!catalog.nodes.some(function (node) { return node.id === "platinum"; }), "platinum stays out");
assert(!catalog.edges.some(function (edge) {
  return edge.kind === "refine" && (edge.inputs || []).some(function (input) { return input.id === "gold" || input.id === "silver"; });
}), "gold and silver have no refiner rows");

var made = api.producing(catalog, "pure-ferrite").map(function (edge) { return edge.id; });
assert(made.indexOf("extract-metallic-elements") !== -1 && made.indexOf("demagnetise-metal") !== -1, "pure ferrite is made from dust and magnetised ferrite");
var used = api.consuming(catalog, "pure-ferrite").map(function (edge) { return edge.id; });
assert(used.indexOf("magnetise-metal") !== -1, "pure ferrite converts to magnetised ferrite");

var portable = catalog.edges.filter(function (edge) { return api.passesTier(edge, "1"); });
var medium = catalog.edges.filter(function (edge) { return api.passesTier(edge, "2"); });
var large = catalog.edges.filter(function (edge) { return api.passesTier(edge, "3"); });
var crafted = catalog.edges.filter(function (edge) { return api.passesTier(edge, "inventory"); });
assert(portable.length && medium.length && large.length && crafted.length && portable.length + medium.length + large.length + crafted.length === catalog.edges.length, "tier filter covers every edge");
assert(portable.every(function (edge) { return edge.slots === 1 && edge.kind === "refine"; }), "portable filter is slot 1 refine");
assert(large.length === 3 && large.every(function (edge) { return edge.slots === 3 && api.slotLabel(edge) === "3 Large"; }), "three large-refiner rows");
assert(crafted.every(function (edge) { return edge.kind === "craft" && edge.station === "inventory" && api.slotLabel(edge) === "Inventory"; }), "inventory filter is the station badge");

has("chlorine", 1, [{ id: "salt", qty: 2 }], "Concentrate Salt");
has("salt", 2, [{ id: "chlorine", qty: 1 }], "Salt Production");
var saltOx = has("chlorine", 5, [{ id: "salt", qty: 2 }, { id: "oxygen", qty: 2 }], "Efficient Salt Evaporation");
assert(saltOx.expansion === true && saltOx.slots === 2, "salt oxygen row is an expansion");
var clOx = has("chlorine", 6, [{ id: "chlorine", qty: 1 }, { id: "oxygen", qty: 2 }], "Chlorine Expansion");
assert(clOx.expansion === true, "chlorine oxygen row is an expansion");
has("salt", 1, [{ id: "di-hydrogen", qty: 1 }, { id: "oxygen", qty: 1 }], "di-hydrogen and oxygen make salt");

has("di-hydrogen-jelly", 1, [{ id: "di-hydrogen", qty: 30 }], "refiner condenses thirty di-hydrogen");
has("di-hydrogen", 40, [{ id: "di-hydrogen-jelly", qty: 1 }], "jelly cycles back to forty di-hydrogen");
has("di-hydrogen", 1, [{ id: "tritium", qty: 5 }], "Tritium Cycling");

has("nitrogen", 1, [{ id: "radon", qty: 3 }], "three radon transfer to nitrogen");
has("sulphurine", 1, [{ id: "nitrogen", qty: 1 }, { id: "oxygen", qty: 1 }], "oxygen transfers nitrogen to sulphurine");
has("radon", 1, [{ id: "sulphurine", qty: 1 }, { id: "oxygen", qty: 1 }], "oxygen transfers sulphurine to radon");
has("radon", 1, [{ id: "sulphurine", qty: 3 }], "three sulphurine transfer to radon");
has("paraffinium", 1, [{ id: "star-bulb", qty: 2 }, { id: "salt", qty: 1 }], "star bulb titrates to paraffinium");
var microbes = has("faecium", 3, [{ id: "faecium", qty: 1 }, { id: "oxygen", qty: 1 }], "Oxygenate Microbes");
assert(microbes.expansion === true && microbes.slots === 2, "faecium oxygen row is an expansion");
var frostGrow = has("frost-crystal", 2, [{ id: "frost-crystal", qty: 1 }, { id: "dioxite", qty: 1 }], "Organic Expansion");
assert(frostGrow.name === "Organic Expansion" && frostGrow.slots === 2, "frost crystal expands with dioxite");

var plating = has("metal-plating", 1, [{ id: "ferrite-dust", qty: 50 }], "Metal Plating");
assert(plating.kind === "craft" && plating.station === "inventory" && api.slotLabel(plating) === "Inventory", "metal plating is an inventory badge");
has("hermetic-seal", 1, [{ id: "condensed-carbon", qty: 30 }], "Hermetic Seal");
has("carbon-nanotubes", 1, [{ id: "carbon", qty: 50 }], "Carbon Nanotubes");
has("microprocessor", 1, [{ id: "chromatic-metal", qty: 40 }, { id: "carbon-nanotubes", qty: 1 }], "Microprocessor");
has("antimatter-housing", 1, [{ id: "oxygen", qty: 30 }, { id: "ferrite-dust", qty: 50 }], "Antimatter Housing");
has("antimatter", 1, [{ id: "chromatic-metal", qty: 25 }, { id: "condensed-carbon", qty: 20 }], "Antimatter");
has("ion-battery", 1, [{ id: "ferrite-dust", qty: 5 }, { id: "cobalt", qty: 10 }], "Ion Battery");
has("life-support-gel", 1, [{ id: "di-hydrogen-jelly", qty: 1 }, { id: "carbon", qty: 20 }], "Life Support Gel");
has("warp-cell", 1, [{ id: "antimatter-housing", qty: 1 }, { id: "antimatter", qty: 1 }], "Warp Cell");
var jellyCraft = has("di-hydrogen-jelly", 1, [{ id: "di-hydrogen", qty: 40 }], "blueprint jelly is forty");
assert(jellyCraft.kind === "craft", "forty di-hydrogen is the blueprint, not the refiner");

var glasses = api.findEdges(catalog, "glass", 1, [{ id: "frost-crystal", qty: 40 }]);
assert(glasses.length === 2, "frost crystal makes glass two ways, found " + glasses.length);
assert(glasses.some(function (edge) { return edge.kind === "craft" && edge.name === "Glass" && api.slotLabel(edge) === "Inventory"; }), "glass blueprint is inventory");
assert(glasses.some(function (edge) { return edge.kind === "refine" && edge.name === "Polish Crystals" && edge.slots === 1; }), "polish crystals is portable");
has("glass", 1, [{ id: "silicate-powder", qty: 40 }], "Silicate Forging");
has("lubricant", 1, [{ id: "faecium", qty: 50 }, { id: "gamma-root", qty: 400 }], "Lubricant");
has("circuit-board", 1, [{ id: "heat-capacitor", qty: 1 }, { id: "poly-fibre", qty: 1 }], "Circuit Board");
has("living-glass", 1, [{ id: "lubricant", qty: 1 }, { id: "glass", qty: 5 }], "Living Glass");
var bonded = has("chlorine", 2, [{ id: "kelp-sac", qty: 1 }, { id: "oxygen", qty: 1 }], "Bonded Chlorine Extraction");
assert(bonded.kind === "refine" && bonded.slots === 2, "bonded chlorine is a two-slot refine");
var saltSub = has("nitrogen-salt", 1, [{ id: "nitrogen", qty: 100 }, { id: "condensed-carbon", qty: 10 }, { id: "chlorine", qty: 5 }], "High-Speed Sublimation");
assert(saltSub.kind === "refine" && saltSub.slots === 3 && api.slotLabel(saltSub) === "3 Large", "nitrogen salt is high-speed sublimation");
has("enriched-carbon", 1, [{ id: "radon", qty: 100 }, { id: "condensed-carbon", qty: 10 }, { id: "chlorine", qty: 5 }], "enriched carbon sublimation");
has("thermic-condensate", 1, [{ id: "sulphurine", qty: 100 }, { id: "condensed-carbon", qty: 10 }, { id: "chlorine", qty: 5 }], "thermic condensate sublimation");
has("unstable-plasma", 1, [{ id: "oxygen", qty: 50 }, { id: "metal-plating", qty: 1 }], "Unstable Plasma");

assert(catalog.nodes.every(function (node) { return node.category && node.kind && node.id.indexOf("_") === -1; }), "every node has a hyphen id, a category, and a kind");
var dustNode = catalog.nodes.filter(function (node) { return node.id === "ferrite-dust"; })[0];
assert(dustNode && (dustNode.aliases || []).indexOf("ferrite_dust") !== -1, "ferrite dust keeps the underscore alias");
assert(catalog.nodes.filter(function (node) { return node.kind === "component"; }).length === 54, "crafted components include the profit tree");
var faecium = catalog.nodes.filter(function (node) { return node.id === "faecium"; })[0];
assert(faecium && (faecium.aliases || []).indexOf("coprite") !== -1, "faecium answers to coprite");
assert(!catalog.nodes.some(function (node) { return node.id === "wiring_loom" || node.id === "starship_launch_fuel" || node.id === "portable_refiner"; }), "loom, launch fuel, and the portable refiner stay out");
assert(!catalog.edges.some(function (edge) { return /loom|launch fuel/i.test((edge.name || "") + " " + (edge.id || "")); }), "no loom or launch-fuel edge");
assert(!catalog.edges.some(function (edge) {
  return edge.out && edge.out.id === "carbon" && (edge.inputs || []).some(function (input) { return input.id === "frost-crystal"; });
}), "frost crystal does not burn to carbon");

var share = api.parseShare("?item=pure_ferrite&pins=salt,warp_cell");
assert(share.item === "pure-ferrite" && share.pins.join(",") === "salt,warp-cell", "underscore ids map onto hyphen ids");
assert(api.formatShare("pure_ferrite", ["salt", "warp_cell"]) === "?item=pure-ferrite&pins=salt,warp-cell", "share query writes hyphen ids");
assert(api.formatShare("pure-ferrite", []) === "?item=pure-ferrite", "empty pins drop off the query");
var pinned = api.togglePin(["salt"], "warp-cell");
assert(pinned.join(",") === "salt,warp-cell", "pin appends");
assert(api.togglePin(pinned, "salt").join(",") === "warp-cell", "pin removes");
assert(api.parseShare("?item=gold").pins === null, "a missing pins param leaves local pins alone");

has("stasis-device", 1, [
  { id: "quantum-processor", qty: 1 },
  { id: "cryogenic-chamber", qty: 1 },
  { id: "iridesite", qty: 1 }
], "Stasis Device");
has("quantum-processor", 1, [
  { id: "circuit-board", qty: 1 },
  { id: "superconductor", qty: 1 }
], "Quantum Processor");
has("cryogenic-chamber", 1, [
  { id: "living-glass", qty: 1 },
  { id: "cryo-pump", qty: 1 }
], "Cryogenic Chamber");
var stasisNode = catalog.nodes.filter(function (node) { return node.id === "stasis-device"; })[0];
assert(stasisNode && stasisNode.name === "Stasis Device" && stasisNode.value === 15600000, "Stasis Device base value is 15600000");
assert((stasisNode.aliases || []).indexOf("ULTRAPROD2") !== -1, "Stasis Device keeps the save id");

// Inventory blueprint from the Feb 2026 crafting table, then the one-way ladders:
// 300 condensed carbon → 600 carbon (2 each), 150 ionised cobalt → 300 cobalt (2 each).
var stasisBill = api.expandBill(catalog, "stasis-device", 1);
var stasisRaw = {
  "cactus-flesh": 100,
  carbon: 600,
  cobalt: 300,
  dioxite: 50,
  faecium: 50,
  "frost-crystal": 300,
  "gamma-root": 400,
  nitrogen: 500,
  paraffinium: 50,
  phosphorus: 50,
  radon: 500,
  solanium: 200,
  "star-bulb": 200,
  sulphurine: 500
};
assert(stasisBill.cycles.length === 0, "stasis bill has no cycle");
Object.keys(stasisRaw).forEach(function (id) {
  assert(stasisBill.raw[id] === stasisRaw[id], "stasis raw " + id + " is " + stasisRaw[id] + " got " + stasisBill.raw[id]);
});
Object.keys(stasisBill.raw).forEach(function (id) {
  assert(stasisRaw[id] === stasisBill.raw[id], "stasis raw has no extra " + id);
});
assert(!stasisBill.raw["condensed-carbon"] && !stasisBill.raw["ionised-cobalt"] && !stasisBill.raw["quantum-processor"], "stasis intermediates are expanded");

var stasisHits = api.searchItems(catalog, "stasis");
assert(stasisHits.length === 1 && stasisHits[0].id === "stasis-device", "searching stasis finds Stasis Device");
assert(api.searchItems(catalog, "ULTRAPROD2").some(function (node) { return node.id === "stasis-device"; }), "searching the save id finds Stasis Device");
var picker = api.craftableItems(catalog);
["stasis-device", "fusion-ignitor", "quantum-processor", "cryogenic-chamber", "explosive-drones"].forEach(function (id) {
  assert(picker.some(function (node) { return node.id === id; }), id + " is in the planner picker");
});
assert(!picker.some(function (node) { return node.id === "cactus-flesh"; }), "a gathered plant is not in the craft picker");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all mineral checks passed");
