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

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all passed");
