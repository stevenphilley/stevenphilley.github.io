#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var logistics = require("./logistics.js");
var map = require("./nms-map.js");
var refine = require("./refine.js");

var failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

function eq(a, b, msg) {
  var same = JSON.stringify(a) === JSON.stringify(b);
  assert(same, msg + (same ? "" : "\n    got " + JSON.stringify(a) + "\n    exp " + JSON.stringify(b)));
}

var catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "graph-v2.json"), "utf8"));
var index = logistics.buildIndex(catalog);

var store = logistics.emptyStore();
store.locations = [
  {
    id: "freighter",
    source: "manual",
    kind: "freighter-general",
    category: "freighter",
    name: "Freighter · General",
    items: [{ id: "chromatic-metal", rawId: "STELLAR2", qty: 30, maxStack: 9999 }]
  },
  {
    id: "box3",
    source: "manual",
    kind: "container",
    category: "container",
    name: "Storage Container 3",
    items: [{ id: "chromatic-metal", rawId: "STELLAR2", qty: 50, maxStack: 9999 }]
  },
  {
    id: "box0",
    source: "manual",
    kind: "container",
    category: "container",
    name: "Storage Container 0",
    items: [{ id: "chromatic-metal", rawId: "STELLAR2", qty: 12, maxStack: 9999 }]
  }
];
store = logistics.normalize(store);

var demand = { id: "d1", locationId: "freighter", itemId: "chromatic-metal", qty: 100, doneTransfers: [] };
var report = logistics.shortfallFor(store, demand);
eq(report.atTarget, 30, "shortfall counts stock already at the target");
eq(report.elsewhere, 62, "shortfall counts stock in other holds");
eq(report.available, 92, "available is target plus elsewhere");
eq(report.need, 70, "need is what the target is still short");
eq(report.shortfall, 8, "shortfall is what is missing from every hold");

var moves = logistics.suggestTransfers(store, demand);
eq(moves.map(function (move) { return [move.fromId, move.qty]; }), [["box3", 50], ["box0", 12]], "transfers take the largest other hold first and stop at the gap");
assert(moves.every(function (move) { return move.toId === "freighter" && move.itemId === "chromatic-metal"; }), "transfers name the freighter as the destination");

var moved = logistics.applyTransfer(store, moves[0]);
assert(moved.ok, "a suggested transfer applies");
eq(logistics.qtyOf(logistics.findLocation(moved.store, "box3"), "chromatic-metal"), 0, "the source hold is emptied by the move");
eq(logistics.qtyOf(logistics.findLocation(moved.store, "freighter"), "chromatic-metal"), 80, "the freighter receives the moved stack");
var refused = logistics.applyTransfer(moved.store, { fromId: "box0", toId: "freighter", itemId: "chromatic-metal", qty: 999 });
assert(!refused.ok && refused.error === "short", "a move larger than the source is refused");
eq(logistics.qtyOf(logistics.findLocation(moved.store, "box0"), "chromatic-metal"), 12, "a refused move leaves the source untouched");

var checked = logistics.completeTransfer(logistics.normalize(JSON.parse(JSON.stringify(store))), "d1", {
  fromId: "box3",
  toId: "freighter",
  itemId: "chromatic-metal",
  qty: 10
});
assert(!checked.ok, "ticking a transfer needs the demand on a project");
store.projects = [{ id: "p1", name: "Freighter base build", demands: [demand] }];
checked = logistics.completeTransfer(store, "d1", moves[0]);
assert(checked.ok, "ticking a transfer updates the inventory");
eq(checked.store.projects[0].demands[0].doneTransfers.length, 1, "the checklist keeps the completed transfer");
eq(checked.store.projects[0].demands[0].doneTransfers[0].qty, 50, "the completed transfer records the quantity");

var warp = logistics.expandRecipe(catalog, "warp-cell", 1, {});
assert(!warp.error, "warp cell expands");
eq(warp.raw, {
  oxygen: 30,
  "ferrite-dust": 50,
  "chromatic-metal": 25,
  "condensed-carbon": 20
}, "warp cell raw totals are the craft leaves");
assert(warp.steps.some(function (step) { return step.outId === "warp-cell" && step.kind === "craft" && step.batches === 1; }), "the warp cell step is one craft batch");
assert(!warp.steps.some(function (step) { return step.edgeId && step.edgeId.indexOf("oxygenate") !== -1; }), "expansion loops are not a build path");

var chroma = logistics.expandRecipe(catalog, "chromatic-metal", 3, {});
eq(chroma.steps[0] && chroma.steps[0].edgeId, "chromatic-cadmium", "with no stock the simplest tied recipe is stable");
eq(chroma.raw, { cadmium: 6 }, "three chromatic metal with no stock is six cadmium");

var fromCopper = logistics.expandRecipe(catalog, "chromatic-metal", 3, { copper: 4 });
eq(fromCopper.steps[0].edgeId, "chromatic-copper", "stocked copper is the refine path");
eq(fromCopper.raw, { copper: 2 }, "copper on hand is subtracted from the raw total");
var alreadyHeld = logistics.expandRecipe(catalog, "chromatic-metal", 260, { "chromatic-metal": 240 });
eq(alreadyHeld.raw, { cadmium: 520 }, "stock of the item being built does not shrink a shortfall");
eq(alreadyHeld.steps[0].outQty, 260, "the shortfall is the amount to refine");
assert(!fromCopper.steps.some(function (step) { return step.edgeId === "expand-copper"; }), "chromatic expansion is not used to make metal");

var seeded = logistics.seedRecipe(logistics.emptyStore(), catalog, "warp-cell", 2, "freighter", "Freighter base build");
eq(seeded.project.demands.map(function (row) { return [row.itemId, row.qty]; }), [
  ["antimatter-housing", 2],
  ["antimatter", 2]
], "a recipe seed expands the direct build cost");
eq(seeded.project.name, "Freighter base build", "the project keeps its name");

var pins = logistics.seedPins(logistics.emptyStore(), ["chromatic-metal", "glass", "chromatic-metal"], "freighter", "Moodboard pins");
eq(pins.project.demands.map(function (row) { return row.itemId; }), ["chromatic-metal", "glass"], "pins seed one demand each");

var fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "logistics", "fixture-save.json"), "utf8"));
var player = map.playerStateOf(fixture);
var bases = map.extractBases(fixture);
var extracted = logistics.extractInventories(player, {
  decodeAddress: map.decodeAddressField,
  bases: bases
});

function loc(id) {
  var found = null;
  extracted.locations.forEach(function (row) { if (row.id === id) found = row; });
  return found;
}

var suit = loc("save:exosuit:general");
assert(suit && suit.slotCapacity === 48 && suit.slotApproximate === false, "exosuit general uses Width times Height");
eq(suit.items.map(function (item) { return [item.id, item.qty, item.rawId]; }), [
  ["chromatic-metal", 40, "STELLAR2"],
  ["metal-plating", 5, "CASING"]
], "known save ids map onto the graph and a bad amount is dropped");
assert(suit.items.every(function (item) { return item.qty > 0 && item.stackApproximate === false; }), "imported quantities are the save amounts");
assert(extracted.skipped.some(function (row) { return row.id === "save:exosuit:general:slots" && /WEIRD_PART|non-integer/.test(row.reason); }), "a non-integer Amount is flagged and not guessed");

eq(loc("save:exosuit:cargo").items[0].id, "oxygen", "cargo oxygen is named from the graph id");
eq(loc("save:container:0").name, "Storage Container 0", "Chest1 is storage container 0");
eq(loc("save:container:0").items[0].qty, 200, "container 0 keeps its amount");
eq(loc("save:container:1").items.length, 0, "an empty container stays empty");
assert(!loc("save:container:2"), "a missing chest is not invented");

assert(!extracted.locations.some(function (row) { return row.id === "save:ship:active:general"; }), "the active ship copy is not imported twice");
assert(extracted.skipped.some(function (row) { return row.id === "ship-active-copy"; }), "the duplicate ship hold is flagged");
eq(loc("save:ship:0:general").items[0].qty, 100, "the ownership ship keeps its carbon");
eq(loc("save:ship:0:general").geo.glyphs, "2205D058AC1D", "a ship Location portal code pins the ship");

assert(!extracted.locations.some(function (row) { return row.id === "save:multitool:active"; }), "the active multi-tool copy is not imported twice");
eq(loc("save:multitool:0").name, "Bolt Caster", "multi-tool name comes from the save");
eq(loc("save:multitool:0").items[0].rawId, "LASER", "an unknown technology id stays raw");
eq(logistics.itemLabel(loc("save:multitool:0").items[0], index), "LASER", "an unknown id is shown as itself");

eq(loc("save:freighter:general").geo.glyphs, "1001CF589C1E", "freighter stock uses the freighter address");
eq(loc("save:freighter:general").geo.baseName, "Haul", "freighter stock keeps the freighter name");
eq(loc("save:freighter:general").geo.strictBase, true, "freighter stock is pinned to that freighter");
eq(loc("save:freighter:general").items[0].id, "ferrite-dust", "freighter ferrite dust is named");

eq(loc("save:exocraft:0:general").name, "Nomad", "exocraft keeps its name");
eq(loc("save:exocraft:0:general").items[0].qty, 20, "exocraft amount is the save amount");

var frigate = loc("save:frigate:0");
eq(frigate.items.length, 0, "a frigate does not gain invented cargo");
assert(/no quantities/i.test(frigate.note), "the frigate note says the save has no cargo hold");
assert(extracted.skipped.some(function (row) { return row.id === "frigate-cargo"; }), "frigate cargo is listed as skipped");

eq(loc("save:settlement:0").items.map(function (item) { return [item.id, item.qty]; }), [["metal-plating", 12]], "settlement stock uses the numeric Amount only");
eq(loc("save:settlement:0").geo.glyphs, "2205D058AC1D", "settlement UniverseAddress pins the settlement");
assert(extracted.skipped.some(function (row) { return row.id === "save:settlement:0:slots"; }), "a null settlement amount is flagged");
assert(extracted.skipped.some(function (row) { return row.id === "base-buffer"; }), "base object buffers are flagged instead of guessed");

var uthmi = { glyphs: "2205D058AC1D", planet: 2, name: "Uthmi", type: "PlanetBase" };
var atUthmi = logistics.locationsAtPlace({ locations: extracted.locations }, uthmi, "base").map(function (row) { return row.id; });
assert(atUthmi.indexOf("save:ship:0:general") !== -1, "the parked ship shows on the matching base");
assert(atUthmi.indexOf("save:settlement:0") !== -1, "the settlement shows on the same address");
assert(atUthmi.indexOf("save:freighter:general") === -1, "the freighter does not show on a different address");
assert(atUthmi.indexOf("save:container:0") === -1, "a shared container is not pinned until a base is chosen");

var haul = { glyphs: "1001CF589C1E", planet: 1, name: "Haul", type: "FreighterBase" };
var atHaul = logistics.locationsAtPlace({ locations: extracted.locations }, haul, "base").map(function (row) { return row.id; });
assert(atHaul.indexOf("save:freighter:general") !== -1, "freighter stock attaches to the freighter marker");

var outpost = { glyphs: "2205D058AC1D", planet: 2, name: "Outpost", type: "PlanetBase" };
var pinned = logistics.normalize({
  version: 1,
  locations: [{
    id: "box",
    source: "manual",
    kind: "container",
    category: "container",
    name: "Storage Container 3",
    items: [{ id: "chromatic-metal", qty: 8 }],
    geo: null
  }],
  projects: []
});
logistics.pinLocation(pinned, "box", { glyphs: "2205D058AC1D", planet: 2, name: "Uthmi", type: "PlanetBase", voxelX: -995, voxelZ: 1418 });
assert(logistics.locationsAtPlace(pinned, uthmi, "base").length === 1, "a manual hold can be pinned to a base");
var chest = logistics.normalize({ locations: [{ id: "c0", name: "Storage Container 0", category: "container", items: [], note: "Numbered containers are shared by every base. This one is not pinned to a base until you choose one." }] });
logistics.pinLocation(chest, "c0", uthmi);
assert(chest.locations[0].note.indexOf("Pinned to Uthmi") !== -1, "pinning a container replaces the unpinned note");
assert(logistics.locationsAtPlace(pinned, outpost, "base").length === 0, "a strict pin does not follow a different base name");
var otherPlanet = { glyphs: "1205D058AC1D", planet: 1, name: "Moon", type: "PlanetBase" };
assert(logistics.locationsAtPlace(pinned, otherPlanet, "system").length === 1, "system scope matches the address without the planet digit");

pinned.projects = [{
  id: "p",
  name: "Freighter base build",
  demands: [{ id: "d", locationId: "box", itemId: "chromatic-metal", qty: 20, doneTransfers: [] }]
}];
var mark = logistics.markerState(pinned, uthmi, "Chromatic Metal", index);
eq(mark.matchQty, 8, "an item query counts that item at the place");
eq(mark.hasQueryMatch, true, "the place matches Chromatic Metal");
eq(mark.unmet, true, "a place with an open demand is marked unmet");
eq(logistics.markerState(pinned, uthmi, "glass", index).hasQueryMatch, false, "a missing item does not highlight the place");
eq(logistics.formatBadge(240), "240", "small counts stay exact");
eq(logistics.formatBadge(2500), "2.5k", "larger badges shorten");

var found = logistics.summarizeSearch(logistics.searchStock(pinned, "chromatic", index));
eq(found[0].total, 8, "search totals the matching item");
eq(found[0].places[0].name, "Storage Container 3", "search breaks the total down by location");

var memory = {
  value: null,
  getItem: function () { return this.value; },
  setItem: function (key, val) { this.value = val; }
};
var saved = logistics.saveStore(memory, pinned);
assert(memory.value && memory.value.indexOf("nms") === -1 || memory.value.indexOf("chromatic-metal") !== -1, "the store serializes");
var loaded = logistics.loadStore(memory);
eq(loaded.locations[0].items[0].qty, 8, "local storage reloads the same quantity");
eq(loaded.projects[0].name, "Freighter base build", "local storage reloads the project");
assert(saved.savedAt, "a save stamps the time");

var backup = logistics.importDocument(logistics.exportDocument(loaded));
eq(backup.locations[0].id, "box", "a backup round-trips");
var badBackup = false;
try { logistics.importDocument("{}"); } catch (err) { badBackup = true; }
assert(badBackup, "a foreign JSON file is rejected");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all logistics checks passed");
