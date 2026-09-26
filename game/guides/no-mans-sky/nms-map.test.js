#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var api = require("./nms-map.js");
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

var capital = api.decodeGalacticAddress("0x2205D058AC1D");
eq(capital.glyphs, "2205D058AC1D", "capital glyphs");
eq(capital.coords, "041C:004F:0D89:0205", "capital signal-booster coords");
eq(capital.planet, 2, "capital planet");
eq(capital.ssi, 0x205, "capital system");
eq(capital.voxelX, -995, "capital voxel X");
eq(capital.voxelY, -48, "capital voxel Y");
eq(capital.voxelZ, 1418, "capital voxel Z");
assert(capital.galaxy == null, "packed address does not invent a galaxy");

var fromGlyphs = api.decodeGalacticAddress("2205D058AC1D");
eq(fromGlyphs.glyphs, capital.glyphs, "glyph string matches packed address");

var withHigh = api.decodeGalacticAddress("0x092205D058AC1D");
eq(withHigh.glyphs, "2205D058AC1D", "bits above 48 do not change glyphs");
assert(withHigh.galaxy == null, "high bits are not a RealityIndex");

var hub1 = api.decodeGalacticAddress(0x1001CF589C1E);
eq(hub1.glyphs, "1001CF589C1E", "HUB1 glyphs");
eq(hub1.coords, "041D:004E:0D88:0001", "HUB1 coords");

var former = api.analyzeGlyphs("2052F9557C30");
eq(former.voxelX, api.hubMarks()[2].voxelX, "former hub plots from its glyphs");
eq(former.voxelZ, api.hubMarks()[2].voxelZ, "former hub Z from glyphs");

var hubs = api.hubMarks();
eq(hubs.map(function (h) { return h.glyphs; }), ["2205D058AC1D", "1001CF589C1E", "2052F9557C30"], "hub glyph order");
eq(hubs[0].label, "Hub capital", "capital label");
assert(hubs[0].note.indexOf("Uthmi Beta") !== -1, "capital note names Uthmi Beta");
eq(hubs[1].label, "HUB1 core", "HUB1 label");
eq(hubs[2].label, "Former Hub", "former hub stays labeled as former");
assert(hubs.every(function (h) { return h.label.indexOf("Arhu") === -1; }), "Arhu is not a hub mark");

var addressed = api.decodeAddressField({
  PlanetIndex: 2,
  SolarSystemIndex: 0x205,
  VoxelX: -995,
  VoxelY: -48,
  VoxelZ: 1418,
  RealityIndex: 9
});
eq(addressed.glyphs, "2205D058AC1D", "object address rebuilds glyphs");
eq(addressed.galaxy, 9, "object RealityIndex is kept");

var noGalaxy = api.decodeAddressField({
  PlanetIndex: 1,
  SolarSystemIndex: 1,
  VoxelX: hub1.voxelX,
  VoxelY: hub1.voxelY,
  VoxelZ: hub1.voxelZ
});
assert(noGalaxy.galaxy == null, "object without RealityIndex stays unknown");

var quoted = api.quoteGalacticAddresses('{"GalacticAddress":37469948428061,"oZw":37469948428061,"Units":12}');
assert(quoted.indexOf('"37469948428061"') !== -1, "quotes GalacticAddress integers");
assert(quoted.indexOf('"oZw":"37469948428061"') !== -1, "quotes obfuscated address key");
assert(quoted.indexOf('"Units":12') !== -1, "leaves other integers numeric");

var quotedHold = api.quoteGalacticAddresses('{"UniverseAddress":37469948428061,"FreighterUniverseAddress":37469948428061,"Location":37469948428061,"Units":3}');
assert(quotedHold.indexOf('"UniverseAddress":"37469948428061"') !== -1, "quotes UniverseAddress");
assert(quotedHold.indexOf('"FreighterUniverseAddress":"37469948428061"') !== -1, "quotes FreighterUniverseAddress");
assert(quotedHold.indexOf('"Location":"37469948428061"') !== -1, "quotes a ship Location");
assert(quotedHold.indexOf('"Units":3') !== -1, "ordinary integers stay numeric beside addresses");

var top = api.extractBases({
  PlayerStateData: {
    PersistentPlayerBases: [
      { Name: "Uthmi", BaseType: { PersistentBaseTypes: "PlanetBase" }, GalacticAddress: "2205D058AC1D" },
      { Name: "Haul", BaseType: { PersistentBaseTypes: "FreighterBase" }, GalacticAddress: "1001CF589C1E" }
    ]
  }
});
eq(top.planetary.length, 1, "one planetary base");
eq(top.freighters.length, 1, "freighter is listed aside");
eq(top.planetary[0].glyphs, "2205D058AC1D", "top-level save plots the capital glyphs");
assert(top.planetary[0].galaxy == null, "extracted packed base has no invented galaxy");
eq(top.freighters[0].name, "Haul", "freighter name kept");

var wrapped = api.extractBases({
  BaseContext: {
    PlayerStateData: {
      PersistentPlayerBases: [
        { Name: "Camp", BaseType: "Base", GalacticAddress: 0x2205D058AC1D }
      ]
    }
  },
  PlayerStateData: { PersistentPlayerBases: [] }
});
eq(wrapped.planetary.length, 1, "BaseContext wins when both wrappers exist");
eq(wrapped.planetary[0].name, "Camp", "BaseContext base name");

assert(api.extractBases({ Version: 1 }).error === "missing", "missing player state");
assert(api.extractBases({ PlayerStateData: {} }).error === "empty", "empty base list");

var mapping = api.mappingFromJson(JSON.parse(fs.readFileSync(path.join(__dirname, "mapping.json"), "utf8")));
assert(mapping["6f="] === "PlayerStateData", "map PlayerStateData");
assert(mapping["vLc"] === "BaseContext", "map BaseContext");
assert(mapping["F?0"] === "PersistentPlayerBases", "map PersistentPlayerBases");
assert(mapping["oZw"] === "GalacticAddress", "map GalacticAddress");
assert(mapping["NKm"] === "Name", "map Name");
assert(mapping["peI"] === "BaseType", "map BaseType");
assert(mapping["DPp"] === "PersistentBaseTypes", "map PersistentBaseTypes");

var obfuscated = {
  vLc: {
    "6f=": {
      "F?0": [
        { NKm: "Uthmi Beta", peI: { DPp: "PlanetBase" }, oZw: "2205D058AC1D" },
        { NKm: "Haul", peI: { DPp: "FreighterBase" }, oZw: "1001CF589C1E" }
      ]
    }
  }
};
assert(api.needsUnmap(obfuscated), "obfuscated root needs the key map");
assert(!api.needsUnmap({ PlayerStateData: { PersistentPlayerBases: [] } }), "plain JSON is left alone");
var plain = api.extractBases(api.unmapTree(obfuscated, mapping));
eq(plain.planetary.length, 1, "unmapped .hg JSON yields the planetary base");
eq(plain.planetary[0].glyphs, "2205D058AC1D", "unmapped capital glyphs");
eq(plain.freighters.length, 1, "unmapped freighter stays off the planetary list");

var literal = new Uint8Array([0x70, 0x7b, 0x22, 0x61, 0x22, 0x3a, 0x31, 0x7d]);
eq(Buffer.from(api.lz4BlockDecompress(literal, 7)).toString(), '{"a":1}', "LZ4 literal block");

var matched = Buffer.from("fb007b224e616d65223a2243616d70222c0e00f01347616c616374696341646472657373223a22323230354430353841433144227d0000", "hex");
var matchedRaw = Buffer.from('{"Name":"Camp","Name":"Camp","GalacticAddress":"2205D058AC1D"}\0\0');
eq(Buffer.from(api.lz4BlockDecompress(matched, matchedRaw.length)).toString("hex"), matchedRaw.toString("hex"), "LZ4 block with matches");

var hg = Buffer.from("e5a1edfe6c0000007b00000000000000f2107b22506c61796572537461746544617461223a7b2250657273697374656e741d00fa124261736573223a5b7b224e616d65223a225574686d69222c2242617365547970653500041600f01073223a22506c616e657442617365227d2c2247616c61637469634164647265e5a1edfe780000007b00000000000000f42b7373223a22323230354430353841433144227d2c7b224e616d65223a224861756c222c224261736554797065223a7b2250657273697374656e741600f11373223a2246726569676874657242617365227d2c2247616c616374696341646472656400f003313030314346353839433145227d5d7d7d00", "hex");
var opened = api.bytesToSaveText(hg);
assert(opened.fromHg, "multi-block file is treated as .hg");
assert(opened.text.indexOf("\u0000") === -1, "trailing nulls are stripped");
var fromHg = api.extractBases(JSON.parse(api.quoteGalacticAddresses(opened.text)));
eq(fromHg.planetary[0].name, "Uthmi", "decompressed planetary name");
eq(fromHg.planetary[0].glyphs, "2205D058AC1D", "decompressed capital glyphs");
eq(fromHg.freighters[0].glyphs, "1001CF589C1E", "decompressed freighter glyphs");

var jsonBytes = Buffer.from('{"PlayerStateData":{"PersistentPlayerBases":[]}}');
var asJson = api.bytesToSaveText(jsonBytes);
assert(!asJson.fromHg && asJson.format === "json", "a file starting with { skips decompress");

var spaced = Buffer.from('\n{"PlayerStateData":{"PersistentPlayerBases":[]}}');
eq(api.detectSaveFormat(spaced), "json", "whitespace then { is still JSON");
var asSpaced = api.bytesToSaveText(spaced);
assert(asSpaced.text.trim().charAt(0) === "{", "leading whitespace still yields JSON");
assert(asSpaced.format === "json", "pretty JSON is not sent through LZ4");

eq(api.detectSaveFormat(Buffer.from('{"a":1}')), "json", "brace detects JSON");
eq(api.detectSaveFormat(hg), "hg", "LZ4 magic detects a Steam save");
eq(api.detectSaveFormat(Buffer.from("not a save")), "unknown", "other bytes are neither path");

var bad = false;
try { api.decompressHg(Buffer.from("not a save")); } catch (err) { bad = true; }
assert(bad, "non-hg bytes are rejected by the decompressor");

var unknown = false;
try { api.bytesToSaveText(Buffer.from("not a save")); } catch (err) { unknown = err.code === "unknown"; }
assert(unknown, "unknown files are not forced through the Steam path");

var frame = api.frameOf(800, 500);
var view = { zoom: 1, panX: 40, panY: -20 };
var sx = 220;
var sy = 140;
var cx = 400;
var cy = 250;
var wx = (sx - cx - view.panX) / view.zoom;
var wy = (sy - cy - view.panY) / view.zoom;
var zoomed = api.zoomAbout(view, sx, sy, cx, cy, 2.5);
var sx2 = cx + zoomed.panX + wx * zoomed.zoom;
var sy2 = cy + zoomed.panY + wy * zoomed.zoom;
assert(Math.abs(sx2 - sx) < 1e-6 && Math.abs(sy2 - sy) < 1e-6, "wheel zoom keeps the cursor point fixed");
assert(zoomed.zoom === 2.5, "zoom multiplies the current scale");
eq(api.zoomAbout({ zoom: 30, panX: 0, panY: 0 }, 10, 10, cx, cy, 2).zoom, 60, "zoom passes the old cap of 32");
eq(api.zoomAbout({ zoom: 100, panX: 0, panY: 0 }, 10, 10, cx, cy, 2).zoom, 128, "zoom stops at 128");
eq(api.clampZoom(0), 1, "a bad zoom falls back to 1");
eq(api.clampZoom(90), 90, "a system-scale zoom is allowed");

var lowPair = (function () {
  var a = api.clumpOffset(0, 8, 4);
  var b = api.clumpOffset(1, 8, 4);
  return { dist: Math.hypot(a.x - b.x, a.y - b.y), stacked: a.stacked, chord: a.chord };
})();
var highPair = (function () {
  var a = api.clumpOffset(0, 8, 64);
  var b = api.clumpOffset(1, 8, 64);
  return { dist: Math.hypot(a.x - b.x, a.y - b.y), stacked: a.stacked, radius: a.radius };
})();
assert(lowPair.stacked && lowPair.dist < 18, "a low zoom keeps a same-voxel pile stacked");
assert(!highPair.stacked && highPair.dist > 28 && highPair.radius > 28, "spread grows past the old 28px cap");
assert(highPair.dist > lowPair.dist * 8, "neighbors move apart as zoom increases");
var lockA = api.clumpOffset(2, 9, 8);
var lockB = api.clumpOffset(2, 9, 80);
assert(Math.abs(lockA.x / 8 - lockB.x / 80) < 1e-9 && Math.abs(lockA.y / 8 - lockB.y / 80) < 1e-9, "the ring scales linearly with zoom");
var openZoom = api.clumpZoomForGap(36);
assert(Math.abs(api.clumpOffset(0, 6, openZoom).chord - 36) < 1e-9, "opening a clump uses a continuous gap, not a zoom step");
assert(openZoom > 16 && openZoom < 40, "that opening zoom sits inside the range");
var big = api.clumpOffset(0, 24, 48);
var bigNext = api.clumpOffset(1, 24, 48);
assert(Math.hypot(big.x - bigNext.x, big.y - bigNext.y) > 28, "a large system still opens past the old cap");

var fanIndex = 3;
var fanCount = 8;
var fanZoom = 20;
var fanX = -995;
var fanZ = 1418;
var fanPan = api.panToMarker(fanX, fanZ, fanIndex, fanCount, fanZoom, frame, cx, cy);
var fanOff = api.clumpOffset(fanIndex, fanCount, fanZoom);
var fanMx = frame.cx + fanPan.panX + (fanX / 2048) * frame.rx * fanZoom + fanOff.x;
var fanMy = frame.cy + fanPan.panY - (fanZ / 2048) * frame.ry * fanZoom + fanOff.y;
assert(Math.abs(fanMx - cx) < 1e-6 && Math.abs(fanMy - cy) < 1e-6, "focus pan puts the fanned base on the focus");
var fanNext = api.zoomAbout({ zoom: fanZoom, panX: fanPan.panX, panY: fanPan.panY }, fanMx, fanMy, cx, cy, 2.2);
var fanOff2 = api.clumpOffset(fanIndex, fanCount, fanNext.zoom);
var fanMx2 = frame.cx + fanNext.panX + (fanX / 2048) * frame.rx * fanNext.zoom + fanOff2.x;
var fanMy2 = frame.cy + fanNext.panY - (fanZ / 2048) * frame.ry * fanNext.zoom + fanOff2.y;
assert(Math.abs(fanMx2 - fanMx) < 1e-6 && Math.abs(fanMy2 - fanMy) < 1e-6, "zooming toward a fanned base keeps it planted");

var cluster = api.fitView(
  [{ x: -995, z: 1418 }, { x: -990, z: 1420 }],
  frame,
  { w: 800, h: 500 },
  { padVoxels: 70, minZoom: 4, maxZoom: 18 }
);
assert(cluster.zoom >= 4 && cluster.zoom <= 18, "a tight cluster zooms in");
var midX = ((-995 - 70) + (-990 + 70)) / 2;
var midZ = ((1418 - 70) + (1420 + 70)) / 2;
var fitX = cx + cluster.panX + (midX / 2048) * frame.rx * cluster.zoom;
var fitY = cy + cluster.panY - (midZ / 2048) * frame.ry * cluster.zoom;
assert(Math.abs(fitX - cx) < 0.01 && Math.abs(fitY - cy) < 0.01, "fit view centers the cluster");

var fromBase = api.fitView([{ voxelX: -995, voxelZ: 1418 }], frame, { w: 800, h: 500 }, { padVoxels: 70, minZoom: 4, maxZoom: 18 });
assert(isFinite(fromBase.panX) && isFinite(fromBase.panY) && fromBase.zoom >= 4, "a base record can be framed");
var baseX = cx + fromBase.panX + (-995 / 2048) * frame.rx * fromBase.zoom;
var baseY = cy + fromBase.panY - (1418 / 2048) * frame.ry * fromBase.zoom;
assert(Math.abs(baseX - cx) < 0.01 && Math.abs(baseY - cy) < 0.01, "framing a base record centers its voxels");

var disk = api.fitView([{ x: -2048, z: -2048 }, { x: 2048, z: 2048 }], frame, { w: 800, h: 500 }, { padVoxels: 0, maxZoom: 14 });
assert(disk.zoom <= 1.2, "a full-disk fit does not zoom into one corner");

eq(api.glyphsFromSignal("041C:004F:0D89:0205", 2), "2205D058AC1D", "signal booster inverts to the capital glyphs");
eq(api.analyzeGlyphs(api.glyphsFromSignal("041C:004F:0D89:0205", 2)).coords, "041C:004F:0D89:0205", "capital coords round-trip");
eq(api.glyphsFromSignal("0000:007F:0000:0001", 1), "100100801801", "Alpha Polaris glyphs use SSI 0001");
eq(api.quadrantOf(-2047, -2047), "alpha", "negative X and Z is Alpha");
eq(api.quadrantOf(2047, -2047), "beta", "positive X and negative Z is Beta");
eq(api.quadrantOf(-2047, 2047), "gamma", "negative X and positive Z is Gamma");
eq(api.quadrantOf(2047, 2047), "delta", "positive X and Z is Delta");

var refs = api.referenceMarks();
var refCounts = { alpha: 0, beta: 0, gamma: 0, delta: 0 };
var refGlyphs = {};
refs.forEach(function (r) {
  refCounts[r.quadrant]++;
  assert(r.planet === 1, r.id + " uses planet index 1");
  assert(r.glyphs.charAt(0) === "1", r.id + " glyph planet digit is 1");
  eq(api.analyzeGlyphs(r.glyphs).coords, r.coords, r.id + " glyphs match its signal-booster coords");
  eq(api.quadrantOf(r.voxelX, r.voxelZ), r.quadrant, r.id + " plots in its quadrant");
  assert(!refGlyphs[r.glyphs], r.id + " glyphs are unique");
  refGlyphs[r.glyphs] = 1;
});
eq(refCounts, { alpha: 6, beta: 5, gamma: 5, delta: 5 }, "five references in each quadrant, plus Anomalies in Alpha");
assert(refs.length >= 20 && refs.length <= 22, "about twenty quadrant references");
["alpha-polaris", "beta-polaris", "gamma-polaris", "delta-polaris", "agt"].forEach(function (id) {
  assert(refs.some(function (r) { return r.id === id; }), id + " is a reference");
});
eq(refs.filter(function (r) { return r.id === "alpha-polaris"; })[0].ssi, 1, "Alpha Polaris SSI is 0001");
eq(refs.filter(function (r) { return r.id === "agt"; })[0].coords, "043D:0072:0D44:001C", "AGT uses the Yihelli Firstfall address");
var hubGlyphs = {};
api.hubMarks().forEach(function (h) { hubGlyphs[h.glyphs] = h.label; });
refs.forEach(function (r) {
  assert(!hubGlyphs[r.glyphs], r.label + " is not a second copy of a Hub mark");
});
assert(api.hubMarks().length === 3, "Hub capital, HUB1, and Former Hub stay");
eq(api.hubMarks().map(function (h) { return h.id; }), ["capital", "hub1", "former"], "Hub mark ids are unchanged");

var logistics = require("./logistics.js");

assert(api.pointInRect(10, 10, { x0: 0, y0: 0, x1: 20, y1: 20 }), "a point inside a rectangle is a hit");
assert(api.pointInRect(0, 20, { x0: 20, y0: 0, x1: 0, y1: 20 }), "a rectangle is hit even when the drag runs up and left");
assert(!api.pointInRect(21, 10, { x0: 0, y0: 0, x1: 20, y1: 20 }), "a point outside a rectangle is a miss");
assert(api.pointInCircle(3, 4, { cx: 0, cy: 0, r: 5 }), "a point on the circle edge is inside");
assert(!api.pointInCircle(4, 4, { cx: 0, cy: 0, r: 5 }), "a point outside the circle is a miss");

var selFrame = api.frameOf(800, 500);
var selView = { zoom: 4, panX: 120, panY: -80 };
var screenA = api.mapToScreen(-995, 1418, selView, selFrame);
var backA = api.screenToMap(screenA.x, screenA.y, selView, selFrame);
assert(Math.abs(backA.voxelX + 995) < 1e-6 && Math.abs(backA.voxelZ - 1418) < 1e-6, "screen and map coordinates round-trip after zoom and pan");
var screenB = api.mapToScreen(-900, 1418, selView, selFrame);
assert(Math.abs(screenA.x - screenB.x) > 5, "a different voxel is a different screen point");
assert(!api.pointInRect(-995, 1418, { x0: screenA.x - 4, y0: screenA.y - 4, x1: screenA.x + 4, y1: screenA.y + 4 }), "map coordinates are not tested as screen pixels");
var inside = api.markersInside([
  { id: "a", kind: "base", x: screenA.x, y: screenA.y },
  { id: "b", kind: "base", x: screenB.x, y: screenB.y },
  { id: "star", kind: "ref", x: screenA.x, y: screenA.y }
], { type: "rect", x0: screenA.x - 4, y0: screenA.y - 4, x1: screenA.x + 4, y1: screenA.y + 4 });
eq(inside.map(function (hit) { return hit.id; }), ["a"], "box select uses screen pixels and skips reference stars");
var circled = api.markersInside([
  { id: "a", kind: "base", x: screenA.x, y: screenA.y },
  { id: "camp", kind: "settlement", x: screenA.x + 3, y: screenA.y },
  { id: "far", kind: "freighter", x: screenA.x + 30, y: screenA.y }
], { type: "circle", cx: screenA.x, cy: screenA.y, r: 10 });
eq(circled.map(function (hit) { return hit.id; }), ["a", "camp"], "circle select includes a settlement inside and skips one outside");
var zoomedView = api.zoomAbout(selView, screenA.x, screenA.y, selFrame.cx, selFrame.cy, 2);
var planted = api.mapToScreen(-995, 1418, zoomedView, selFrame);
assert(Math.abs(planted.x - screenA.x) < 1e-6 && Math.abs(planted.y - screenA.y) < 1e-6, "the selected screen point stays put when zoom changes");
var moved = api.mapToScreen(-900, 1418, zoomedView, selFrame);
assert(Math.abs(moved.x - screenB.x) > 1, "a neighbor moves on screen when the view zooms");

eq(api.selectionGesture({}, "box"), { op: "replace", shape: "box" }, "a plain drag replaces with a box");
eq(api.selectionGesture({ alt: true }, "box"), { op: "replace", shape: "circle" }, "alt switches the drag to a circle");
eq(api.selectionGesture({}, "circle"), { op: "replace", shape: "circle" }, "circle mode draws a circle without alt");
eq(api.selectionGesture({ ctrl: true }, "box").op, "add", "ctrl adds");
eq(api.selectionGesture({ meta: true }, "circle").op, "add", "cmd adds");
eq(api.selectionGesture({ ctrl: true, shift: true }, "box"), { op: "subtract", shape: "box" }, "ctrl+shift subtracts in the toolbar shape");
eq(api.selectionGesture({ alt: true, ctrl: true }, "box"), { op: "subtract", shape: "box" }, "alt+ctrl subtracts and keeps the box");
eq(api.toggleId(["a", "b"], "b"), ["a"], "toggle removes a selected id");
eq(api.toggleId(["a"], "c"), ["a", "c"], "toggle adds a new id");
eq(api.applySelectionOp(["a"], ["b", "a"], "add"), ["a", "b"], "add keeps the current order and appends");
eq(api.applySelectionOp(["a", "b", "c"], ["b"], "subtract"), ["a", "c"], "subtract drops the covered ids");
eq(api.applySelectionOp(["a", "b"], ["c"], "replace"), ["c"], "replace drops the previous selection");
eq(api.rangeIds(["a", "b", "c", "d"], "c", "a"), ["a", "b", "c"], "shift range follows list order in either direction");
eq(api.rangeIds(["a", "b", "c"], "missing", "b"), ["b"], "a range with no anchor selects the clicked id");

var aggStore = logistics.normalize({
  version: 1,
  source: { fileName: "sample.json", format: "json" },
  locations: [
    {
      id: "l1",
      name: "Uthmi chest",
      category: "base",
      geo: { glyphs: "2205D058AC1D", baseName: "Uthmi", strictBase: true },
      items: [
        { id: "chromatic-metal", name: "Chromatic Metal", qty: 9999 },
        { id: "carbon", name: "Carbon", qty: 4200 },
        { id: "ferrite-dust", name: "Ferrite Dust", qty: 10 },
        { id: "oxygen", name: "Oxygen", qty: 4 }
      ]
    },
    {
      id: "l2",
      name: "Camp chest",
      category: "base",
      geo: { glyphs: "1001CF589C1E", baseName: "Camp", strictBase: true },
      items: [{ id: "chromatic-metal", name: "Chromatic Metal", qty: 5 }]
    }
  ],
  production: [
    { id: "p1", objectId: "U_EXTRACTOR_S", kind: "mineral", count: 4, geo: { glyphs: "2205D058AC1D", baseName: "Uthmi", strictBase: true }, resourceId: "copper", resourceUser: true, hotspotClass: "S", known: true },
    { id: "p2", objectId: "U_GASEXTRACTOR", kind: "gas", count: 2, geo: { glyphs: "1001CF589C1E", baseName: "Camp", strictBase: true }, resourceId: "", known: true },
    { id: "p3", objectId: "SNOWPLANT", kind: "crop", count: 24, geo: { glyphs: "2205D058AC1D", baseName: "Uthmi", strictBase: true }, resourceId: "frost-crystal", known: true },
    { id: "p4", objectId: "SCORCHEDPLANT", kind: "crop", count: 12, geo: { glyphs: "2205D058AC1D", baseName: "Uthmi", strictBase: true }, resourceId: "solanium", known: true }
  ],
  projects: [{
    id: "proj",
    name: "Build",
    demands: [{ id: "d", locationId: "l1", itemId: "chromatic-metal", qty: 20000, doneTransfers: [] }]
  }]
});
var uthmiPlace = { id: "b0", glyphs: "2205D058AC1D", name: "Uthmi", type: "PlanetBase" };
var campPlace = { id: "b1", glyphs: "1001CF589C1E", name: "Camp", type: "PlanetBase" };
var uthmiGlance = api.summarizeBase(uthmiPlace, aggStore, logistics, null, "");
eq(api.miningChipText(uthmiGlance.mining[0]), "Copper ×4 · ~2,500/h", "a named class S mine shows an approximate rate");
eq(api.cropChipText(uthmiGlance.crops[0]), "Frostwort ×24", "crop chips use the plant count");
eq(api.cropChipText(uthmiGlance.crops[1]), "Solar Vine ×12", "a second crop is its own chip");
var caretCrop = logistics.normalize({
  source: { fileName: "sample.json" },
  locations: [],
  production: [{
    id: "caret",
    objectId: "^TOXICPLANT",
    rawObjectId: "^TOXICPLANT",
    kind: "crop",
    count: 6,
    geo: { glyphs: "2205D058AC1D", baseName: "Uthmi", strictBase: true },
    known: false
  }]
});
var caretGlance = api.summarizeBase(uthmiPlace, caretCrop, logistics, null, "");
eq(api.cropChipText(caretGlance.crops[0]), "Fungal Cluster ×6", "a caret plant id is named, not shown raw");
assert(caretGlance.crops[0].label.indexOf("^") === -1, "the harvest label has no caret");
assert(caretGlance.crops[0].title.indexOf("^TOXICPLANT") !== -1, "the harvest tooltip keeps the save id");
assert(api.inventoryChipText(uthmiGlance).indexOf("4 stacks") === 0, "inventory starts with the stack count");
assert(api.inventoryChipText(uthmiGlance).indexOf("Chromatic Metal 9,999") !== -1, "the largest stack is listed");
assert(api.inventoryChipText(uthmiGlance).indexOf("+1 more") !== -1, "items past the first three are counted");
assert(uthmiGlance.unmet, "an open demand badges the base");
var campGlance = api.summarizeBase(campPlace, aggStore, logistics, null, "");
eq(api.miningChipText(campGlance.mining[0]), "Gas ×2 (unset)", "an extractor with no resource stays unset");
eq(api.summarizeBase({ glyphs: "AAAAAAAAAAAAAAAA", name: "Bare" }, aggStore, logistics, null, "").message, "No inventory loaded, import a save", "a base with no logistics data does not show zeros");
eq(api.summarizeBase(uthmiPlace, null, logistics, null, "").message, "No inventory loaded, import a save", "an empty store asks for a save");
var agg = api.aggregatePlaces([uthmiPlace, campPlace], aggStore, logistics, null);
eq(agg.count, 2, "aggregate counts the selected places");
eq(agg.inventory[0].label, "Chromatic Metal", "combined inventory sorts by quantity");
eq(agg.inventory[0].total, 10004, "combined inventory adds the same item");
eq(agg.inventory[0].places.map(function (row) { return row.qty; }), [9999, 5], "the item breaks down by place");
eq(agg.mining.map(function (row) { return api.miningChipText(row); }), ["Copper ×4 · ~2,500/h", "Gas ×2 (unset)"], "mining totals keep rates and unset extractors");
eq(agg.crops.map(function (row) { return row.count; }), [24, 12], "crops add up by plant");
eq(agg.shortfalls.length, 1, "an open shortfall is included");
eq(agg.shortfalls[0].place, "Uthmi", "the shortfall names its place");
assert(agg.shortfalls[0].shortfall > 0, "the shortfall is the amount still missing");
var summaries = { b0: uthmiGlance, b1: campGlance };
var ordered = api.orderBases([campPlace, uthmiPlace], summaries, "mining", "all");
eq(ordered.map(function (row) { return row.name; }), ["Uthmi", "Camp"], "mining output sort puts the rated mine first");
eq(api.orderBases([campPlace, uthmiPlace], summaries, "crops", "farming").map(function (row) { return row.id; }), ["b0"], "the farming filter keeps the crop base, in crop order");
eq(api.rangeIds(api.orderBases([campPlace, uthmiPlace], summaries, "name", "all").map(function (row) { return row.id; }), "b1", "b0"), ["b1", "b0"], "range select follows the current sort");
var alphaPlace = { id: "b2", glyphs: "000000000001", name: "Alpha", type: "PlanetBase" };
var threeSummaries = {
  b0: uthmiGlance,
  b1: campGlance,
  b2: { units: 0, miningCount: 0, miningRate: 0, cropCount: 0, hasQuery: false }
};
var byName = api.orderBases([uthmiPlace, campPlace, alphaPlace], threeSummaries, "name", "all");
eq(byName.map(function (row) { return row.id; }), ["b2", "b1", "b0"], "name sort is alphabetical before pinning");
var pinnedName = api.pinSelectedBases(byName, ["b0", "b2"], true);
eq(pinnedName.bases.map(function (row) { return row.id; }), ["b2", "b0", "b1"], "selected bases come first and keep name order");
eq(pinnedName.splitAfter, 2, "the divider counts selected bases still in the list");
var byMining = api.orderBases([alphaPlace, campPlace, uthmiPlace], threeSummaries, "mining", "all");
var pinnedMining = api.pinSelectedBases(byMining, ["b2", "b1"], true);
eq(pinnedMining.bases.map(function (row) { return row.id; }), ["b1", "b2", "b0"], "mining order stays inside the selected group and the rest");
eq(api.pinSelectedBases(byMining, ["b2"], false).bases.map(function (row) { return row.id; }), ["b0", "b1", "b2"], "an unchecked preference leaves the sort alone");
eq(api.pinSelectedBases(byMining, ["b2"], false).splitAfter, 0, "an unchecked preference draws no divider");
var farmed = api.pinSelectedBases(api.orderBases([alphaPlace, campPlace, uthmiPlace], threeSummaries, "crops", "farming"), ["b1", "b0"], true);
eq(farmed.bases.map(function (row) { return row.id; }), ["b0"], "selected on top still obeys the farming filter");
eq(api.pinSelectedBases(byName, ["freighter", "b1"], true).bases.map(function (row) { return row.id; }), ["b1", "b2", "b0"], "a selected id outside the list does not invent a row");
eq(api.pinSelectedBases(byName, [], true).splitAfter, 0, "nothing selected leaves the list unsplit");
eq(api.pinSelectedBases(byName, ["b2", "b1", "b0"], true).splitAfter, 3, "every visible base selected is one group");
var namesBeforePin = byName.map(function (row) { return row.id; });
api.pinSelectedBases(byName, ["b0"], true);
eq(byName.map(function (row) { return row.id; }), namesBeforePin, "pinning does not rewrite the sorted list");
eq(api.rangeIds(pinnedName.bases.map(function (row) { return row.id; }), "b2", "b1"), ["b2", "b0", "b1"], "range select follows the list after selected bases move up");
eq(api.SELECTED_ON_TOP_KEY, "nms-map-selected-on-top", "the preference uses its own localStorage key");
assert(api.readSelectedOnTop(null) === false, "a missing store leaves selected on top off");
var memory = {};
var store = {
  getItem: function (key) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; },
  setItem: function (key, value) { memory[key] = String(value); }
};
assert(api.readSelectedOnTop(store) === false, "an empty store leaves selected on top off");
api.writeSelectedOnTop(store, true);
eq(memory[api.SELECTED_ON_TOP_KEY], "1", "checking the box stores 1");
assert(api.readSelectedOnTop(store) === true, "a stored 1 turns selected on top on");
api.writeSelectedOnTop(store, false);
eq(memory[api.SELECTED_ON_TOP_KEY], "0", "clearing the box stores 0");
assert(api.readSelectedOnTop(store) === false, "a stored 0 turns selected on top off");
assert(api.readSelectedOnTop({ getItem: function () { throw new Error("blocked"); } }) === false, "a blocked read stays off");
api.writeSelectedOnTop({ setItem: function () { throw new Error("blocked"); } }, true);
eq(logistics.selectionQuery([uthmiPlace, { glyphs: "2205d058ac1d" }, campPlace]), "?places=2205D058AC1D,1001CF589C1E", "the logistics link lists each glyph once");
eq(logistics.parseSelectionQuery("?places=2205D058AC1D,nope,1001CF589C1E"), ["2205D058AC1D", "1001CF589C1E"], "the logistics page reads the same glyph list");
var radius = api.screenRadiusLy(selFrame.rx * 4, selFrame, 4);
eq(radius, 2048 * 400, "a screen radius that spans one disk radius is 2048 voxels in light-years");
eq(api.commandKeyName("MacIntel"), "Cmd", "a Mac shows Cmd in the help table");
eq(api.commandKeyName("iPhone"), "Cmd", "an iPhone shows Cmd");
eq(api.commandKeyName("Win32"), "Ctrl", "Windows shows Ctrl");
eq(api.commandKeyName("Linux x86_64"), "Ctrl", "Linux shows Ctrl");

var disc = require("./discoveries.js");
var portalMask = (1n << 48n) - 1n;
function discDeps() {
  return {
    decodeAddressField: api.decodeAddressField,
    toBigInt: function (raw) {
      if (typeof raw === "bigint") return raw;
      if (typeof raw === "number") return BigInt(Math.trunc(raw));
      var s = String(raw == null ? "" : raw).trim();
      if (/^-?0x[0-9a-f]+$/i.test(s) || /^-?\d+$/.test(s)) return BigInt(s);
      if (/^[0-9a-f]+$/i.test(s) && /[a-f]/i.test(s)) return BigInt("0x" + s);
      throw new Error("bad address");
    },
    portalMask: portalMask,
    lyBetween: function (a, b) {
      var dx = a.voxelX - b.voxelX;
      var dy = a.voxelY - b.voxelY;
      var dz = a.voxelZ - b.voxelZ;
      return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 400);
    }
  };
}

var packedCapital = disc.decodeDiscoveryAddress("0x2205D058AC1D", discDeps());
eq(packedCapital.glyphs, "2205D058AC1D", "a discovery UA keeps the 48-bit glyphs");
assert(packedCapital.galaxy == null, "a 48-bit discovery UA does not invent a galaxy");

var packedGalaxy = disc.decodeDiscoveryAddress(disc.packAddress(2, 0x205, -995, -48, 1418, 0x0A), discDeps());
eq(packedGalaxy.glyphs, "2205D058AC1D", "bits 48–55 do not change discovery glyphs");
eq(packedGalaxy.galaxy, 10, "a non-zero high byte is a galaxy candidate");
eq(packedGalaxy.galaxySource, "ua", "the high byte is marked as coming from the UA");

var realityWins = disc.decodeDiscoveryAddress({
  UA: disc.packAddress(2, 0x205, -995, -48, 1418, 0x0A),
  RealityIndex: 2
}, discDeps());
eq(realityWins.glyphs, "2205D058AC1D", "an address object still decodes the portal code");
eq(realityWins.galaxy, 2, "RealityIndex wins over the packed high byte");
eq(realityWins.galaxySource, "reality", "an explicit reality is labeled as such");

var quotedUa = api.quoteGalacticAddresses('{"UA":37469948428061,"5L6":37469948428061,"Units":12}');
assert(quotedUa.indexOf('"UA":"37469948428061"') !== -1, "quotes discovery UA integers");
assert(quotedUa.indexOf('"5L6":"37469948428061"') !== -1, "quotes the obfuscated UA key");
assert(quotedUa.indexOf('"Units":12') !== -1, "a discovery quote pass still leaves other integers numeric");

var fixtureUa = disc.packAddress(3, 0x11, 100, -2, -40, 0);
var fixture = {
  Version: 4720,
  DiscoveryManagerData: {
    "DiscoveryData-v1": {
      Store: {
        Record: [
          {
            DD: { UA: fixtureUa, DT: "SolarSystem", VP: [] },
            DM: { CN: "Fixture System" },
            OWS: { USN: "Traveller", UID: "0", TS: 1700000100 },
            FL: { U: 1 },
            RID: "fixture-system"
          },
          {
            DD: { UA: disc.packAddress(1, 0x11, 100, -2, -40, 0), DT: "Planet", VP: ["0x1", 1] },
            DM: { CN: "Fixture World" },
            OWS: { USN: "", UID: "4242", TS: 1700000200 },
            FL: { U: 1 },
            RID: "fixture-planet"
          },
          {
            DD: { UA: disc.packAddress(1, 0x11, 100, -2, -40, 0), DT: "Flora", VP: ["0x20"] },
            DM: {},
            OWS: { TS: 1700000300 },
            FL: { U: 0 }
          },
          {
            DD: { UA: disc.packAddress(1, 0x11, 100, -2, -40, 0), DT: "Animal", VP: ["0x21"] },
            DM: { CustomName: "Fixture Beast" },
            OWS: { TS: 1700000400 },
            FL: { U: 0 }
          },
          {
            DD: { UA: disc.packAddress(2, 0x11, 100, -2, -40, 0), DT: "Mineral", VP: ["0x22"] },
            DM: {},
            OWS: {},
            FL: {}
          }
        ]
      }
    }
  }
};
var parsedFixture = api.extractDiscoveries(fixture);
eq(parsedFixture.problems, [], "the synthetic fixture has no parse problems");
eq(parsedFixture.systems.length, 1, "planet, system, flora, fauna, and mineral share one system");
eq(parsedFixture.systems[0].systemName, "Fixture System", "the solar-system custom name is kept");
eq(parsedFixture.systems[0].planetCount, 1, "only the planet record counts as a discovered planet");
eq(parsedFixture.systems[0].flora, 1, "flora increments the system");
eq(parsedFixture.systems[0].fauna, 1, "an Animal record counts as fauna");
eq(parsedFixture.systems[0].minerals, 1, "a mineral record counts even without a planet record");
var fixturePlanet = parsedFixture.systems[0].planetList.filter(function (p) { return p.index === 1; })[0];
eq(fixturePlanet.name, "Fixture World", "the planet custom name is kept");
eq(fixturePlanet.biome, "Toxic", "planet VP low bits are a biome index");
eq(fixturePlanet.uploaded, true, "FL.U above zero means uploaded");
eq(fixturePlanet.timestamp, 1700000200, "the ownership timestamp is kept");
eq(fixturePlanet.owner, "", "an empty username stays empty");
eq(fixturePlanet.ownerId, "4242", "the ownership id is kept when there is no username");
assert(fixturePlanet.named.indexOf("fauna · Fixture Beast") !== -1, "a typed creature name is kept on its planet");
eq(disc.discoveryTotals(parsedFixture.systems).planets, 1, "totals count planets, not every record");

var older = {
  DiscoveryData: {
    Available: { Record: [{ DD: { UA: fixtureUa, DT: "SolarSystem" }, FL: { U: 0 }, OWS: { TS: 10 } }] },
    Enqueued: { Record: [{ DD: { UA: disc.packAddress(4, 0x11, 100, -2, -40, 0), DT: "Planet" }, DM: { CN: "Queued" }, FL: { U: 1 }, OWS: { TS: 11 } }] }
  }
};
var olderParsed = api.extractDiscoveries(older);
eq(olderParsed.systems.length, 1, "Available and Enqueued and the older DiscoveryData key still group");
eq(olderParsed.systems[0].planetCount, 1, "an enqueued planet is still a planet");
eq(olderParsed.systems[0].planetList[0].name, "Queued", "an enqueued custom name is kept");

var table = api.mappingFromJson(JSON.parse(fs.readFileSync(path.join(__dirname, "mapping.json"), "utf8")));
var obfuscated = api.unmapTree({
  fDu: {
    ETO: {
      OsQ: {
        "?fB": [{
          "8P3": { "5L6": "0x2205D058AC1D", "<Dn": "Planet", bEr: ["1", 0] },
          q9a: { q5u: "Obfuscated World" },
          ksu: { "V?:": "Traveller", K7E: "0", "3I1": 1700000000 },
          "=wD": { tiH: 1 }
        }]
      }
    }
  }
}, table);
var obfuscatedParsed = api.extractDiscoveries(obfuscated);
eq(obfuscatedParsed.systems.length, 1, "obfuscated discovery keys unmap before parsing");
eq(obfuscatedParsed.systems[0].planetList[0].name, "Obfuscated World", "the obfuscated custom name unmaps");
eq(obfuscatedParsed.systems[0].planetList[0].glyphs, "2205D058AC1D", "the obfuscated UA decodes to portal glyphs");
eq(obfuscatedParsed.systems[0].planetList[0].biome, "Lush", "biome index 0 is Lush");

var baseDoc = {
  PlayerStateData: { PersistentPlayerBases: [{ Name: "Camp", GalacticAddress: "2205D058AC1D" }] },
  DiscoveryManagerData: { "DiscoveryData-v1": { Store: { Record: [{ DD: { UA: fixtureUa, DT: "Planet" }, RID: "a" }] } } }
};
var extraDoc = {
  DiscoveryManagerData: { "DiscoveryData-v1": { Store: { Record: [
    { DD: { UA: fixtureUa, DT: "Planet" }, RID: "a" },
    { DD: { UA: disc.packAddress(5, 0x22, 200, 1, 20, 0), DT: "Planet" }, RID: "b" }
  ] } } }
};
var merged = api.mergeSaveDocuments([extraDoc, baseDoc]);
eq(merged.PlayerStateData.PersistentPlayerBases.length, 1, "the merge keeps the document that has the bases");
eq(api.extractDiscoveries(merged).systems.length, 2, "the merge unions discovery records and drops a duplicate RID");

var close = disc.clusterScreenMarkers([{ x: 0, y: 0, id: "a" }, { x: 10, y: 0, id: "b" }], 48);
eq(close.length, 1, "markers ten pixels apart share a cluster cell");
assert(close[0].clustered && close[0].items.length === 2, "a shared cell is one cluster of both systems");
var apart = disc.clusterScreenMarkers([{ x: 0, y: 0, id: "a" }, { x: 100, y: 0, id: "b" }], 48);
eq(apart.length, 2, "markers a hundred pixels apart stay separate");
eq(disc.discoveryCellSize(1), 48, "a wide zoom uses the larger cluster cell");
eq(disc.discoveryCellSize(8), 0, "zoom 8 stops clustering");

var synthetic = disc.syntheticDiscoveryDocument();
var syntheticParsed = api.extractDiscoveries(synthetic);
assert(syntheticParsed.records.length >= 400, "the default synthetic save has several hundred discovery records");
eq(syntheticParsed.systems.length, 8, "the default synthetic save has eight systems");
var placed = disc.placeDiscoveryGalaxies(syntheticParsed.systems, [{ galaxy: null }]);
eq(placed.filter(function (sys) { return sys.galaxy === 0; }).length, 7, "systems without a high byte land in Euclid");
eq(placed.filter(function (sys) { return sys.galaxy === 10; }).length, 1, "the last synthetic system keeps galaxy 10");
var euclidSystems = placed.filter(function (sys) { return sys.galaxy === 0; });
var closePairs = 0;
var farPairs = 0;
euclidSystems.forEach(function (a, i) {
  euclidSystems.forEach(function (b, j) {
    if (j <= i) return;
    var d = Math.hypot(a.voxelX - b.voxelX, a.voxelZ - b.voxelZ);
    if (d > 0 && d < 180) closePairs += 1;
    if (d > 800) farPairs += 1;
  });
});
assert(closePairs >= 1, "some synthetic systems sit close enough to cluster");
assert(farPairs >= 1, "some synthetic systems are hundreds of voxels apart");
eq(disc.discoveryMarkerLabel({ systemName: "Amber Reach", glyphs: "0120FEFD8050", planetCount: 4 }), "Amber Reach", "a typed system name is the map label");
eq(disc.discoveryMarkerLabel({ systemName: "", glyphs: "0120FEFD8050", planetCount: 4 }), "4 planets", "without a typed name the label is the planet count");
assert(disc.discoveryMarkerLabel({ systemName: "", glyphs: "0120FEFD8050", planetCount: 0 }).indexOf("0120") === -1, "the portal code is not the map label");
assert(placed.every(function (sys) { return sys.planetList.some(function (p) { return p.biome; }); }), "each synthetic system has a biome read from VP");
assert(!fs.existsSync(path.join(__dirname, "fixture-player.hg")), "no real save file is part of the test");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all passed");
