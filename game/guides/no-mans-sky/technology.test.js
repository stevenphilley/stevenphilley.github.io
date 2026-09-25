#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var craft = require("./craft.js");
var logistics = require("./logistics.js");

var failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

var tech = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "technology.json"), "utf8"));
var graph = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "graph-v2.json"), "utf8"));
var errors = craft.validate(tech, graph);
assert(errors.length === 0, "technology.json validates" + (errors.length ? "\n    " + errors.join("\n    ") : ""));

var index = craft.byId(tech.items);

function recipe(gameId) {
  var found = null;
  tech.items.forEach(function (item) {
    if (item.gameId === gameId) found = item;
  });
  assert(!!found, "has " + gameId);
  return found;
}

var jetpack = recipe("JET1");
assert(jetpack.recipe.inputs.length === 1 && jetpack.recipe.inputs[0].id === "ferrite-dust" && jetpack.recipe.inputs[0].qty === 100, "jetpack is 100 ferrite dust");

var stim = recipe("UT_JET");
assert(stim.kind === "upgrade" && stim.recipe.inputs[0].qty === 100 && stim.recipe.inputs[1].qty === 100, "neural stimulator install is 100 + 100");
assert(stim.blueprint.fragmentCost === 90 && stim.blueprint.soldAtAnomaly === true, "neural stimulator fragment cost is the table's 90");

var cadmium = recipe("HDRIVEBOOST1");
assert(cadmium.recipe.inputs[0].id === "chromatic-metal" && cadmium.recipe.inputs[0].qty === 250, "cadmium drive chromatic metal");
assert(cadmium.recipe.inputs[1].id === "wiring-loom" && cadmium.recipe.inputs[1].qty === 3, "cadmium drive wiring loom");

var loom = recipe("TECH_COMP");
assert(loom.recipe === null && loom.kind === "gathered", "wiring loom has no craft recipe");

var proc = recipe("T_JET");
assert(proc.procedural === true && proc.recipe === null, "procedural jetpack module is not craftable");

var hyper = recipe("HYPERDRIVE");
var bill = craft.expand(tech, graph, hyper.id, 1);
assert(bill.cycles.length === 0, "hyperdrive tree has no cycle");
assert(bill.raw.copper === 650, "hyperdrive raw copper is 650 (125 + 5*40 chromatic, 2 copper each)");
assert(bill.raw.carbon === 250, "hyperdrive raw carbon is 250");
assert(!bill.raw["chromatic-metal"] && !bill.raw.microprocessor, "hyperdrive intermediates are expanded");

var jetBill = craft.expand(tech, graph, jetpack.id, 2);
assert(jetBill.raw["ferrite-dust"] === 200, "two jetpacks ask for 200 ferrite dust");

var used = craft.usedIn(tech, "wiring-loom").map(function (item) { return item.gameId; });
assert(used.indexOf("HDRIVEBOOST1") !== -1, "wiring loom is used in cadmium drive");

tech.items.forEach(function (item) {
  if (item.kind !== "procedural") return;
  if (item.recipe) assert(false, "procedural recipe " + item.id);
});
assert(tech.items.some(function (item) { return item.kind === "procedural"; }), "procedural modules are listed");
assert(tech.items.some(function (item) { return item.slot === "living-ship" && item.recipe; }), "living ship tech has install recipes");
assert(tech.items.some(function (item) { return item.gameCategory === "Mech" && item.recipe; }), "minotaur tech is included");
assert(tech.items.some(function (item) { return item.gameCategory === "Submarine" && item.recipe; }), "nautilon tech is included");

var merged = craft.mergeCatalog(graph, tech);
assert(merged.nodes.length > graph.nodes.length, "merge adds technology nodes");
assert(merged.edges.some(function (edge) { return edge.id === "tech-" + jetpack.id; }), "jetpack install becomes a craft edge");
assert(merged.edges.filter(function (edge) { return edge.out && edge.out.id === "metal-plating" && edge.kind === "craft"; }).length === 1, "metal plating craft edge is not duplicated");

var seeded = logistics.seedRawBill(logistics.emptyStore(), bill.raw, "manual:unassigned", "Hyperdrive", hyper.id);
assert(seeded.project && seeded.project.demands.length === 2, "raw bill seeds two demands");
var copper = seeded.project.demands.filter(function (row) { return row.itemId === "copper"; })[0];
assert(copper && copper.qty === 650, "seeded copper quantity");
assert(seeded.project.demands.every(function (row) { return row.note === "Raw bill"; }), "raw bill demands are marked so the plan does not refine them further");

var held = logistics.ensureUnassigned(logistics.emptyStore());
assert(held.locationId === "manual:unassigned" && held.store.locations.length === 1, "unassigned hold is created once");
var again = logistics.ensureUnassigned(held.store);
assert(again.store.locations.length === 1, "unassigned hold is not duplicated");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all technology checks passed");
