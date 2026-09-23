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
assert(!asJson.fromHg, "a file starting with { skips decompress");

var spaced = Buffer.from('\n{"PlayerStateData":{"PersistentPlayerBases":[]}}');
var asSpaced = api.bytesToSaveText(spaced);
assert(asSpaced.text.trim().charAt(0) === "{", "leading whitespace still yields JSON");

var bad = false;
try { api.decompressHg(Buffer.from("not a save")); } catch (err) { bad = true; }
assert(bad, "non-hg bytes are rejected");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all passed");
