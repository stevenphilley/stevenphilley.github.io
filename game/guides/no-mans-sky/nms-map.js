/*! nms-map.js — local No Man's Sky base galaxy map.
 *  Packed GalacticAddress is a 48-bit portal code (mask 0xFFFFFFFFFFFF):
 *  planetIndex=(p>>44)&0xF, ssi=(p>>32)&0xFFF, voxelY=sign8((p>>24)&0xFF),
 *  voxelZ=sign12((p>>12)&0xFFF), voxelX=sign12(p&0xFFF).
 *  Those fields are the twelve portal glyphs P-SSS-YY-ZZZ-XXX.
 *  RealityIndex is not read from the packed bits. A separate RealityIndex
 *  on an address object is the only galaxy value this map trusts.
 *  Signal-booster XXXX:YYYY:ZZZZ:SSSS adds the usual portal-frame offsets
 *  (X/Z + 0x7FF, Y + 0x7F).
 *  A .hg save is a run of LZ4 blocks (magic 0xFEEDA1E5). A file that starts
 *  with { is JSON and is not decompressed. Obfuscated 3-character keys are
 *  renamed with the bundled MBINCompiler mapping.json. Discovery records
 *  live under DiscoveryManagerData and use the same portal code.
 *  Nothing is uploaded.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NmsMap = api;
  if (typeof document !== "undefined") {
    var boot = function () {
      api.mount();
      api.bindHelpDialogs();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DiscoveryLib = null;
  if (typeof require === "function") {
    try { DiscoveryLib = require("./discoveries.js"); } catch (err) { DiscoveryLib = null; }
  }
  if (!DiscoveryLib && typeof NmsDiscoveries !== "undefined") DiscoveryLib = NmsDiscoveries;

  var GALAXY_NAMES = {
    0: "Euclid",
    1: "Hilbert Dimension",
    2: "Calypso",
    3: "Hesperius Dimension",
    4: "Hyades",
    5: "Ickjamatew",
    6: "Budullangr",
    7: "Kikolgallr",
    8: "Eltiensleen",
    9: "Eissentam",
    10: "Elkupalos"
  };

  // Euclid Hub marks. Glyphs drive the plot. The pre-2025 capital's
  // published system index is 001B; its glyph SSI is 052. Same region-plane
  // position either way — the map uses glyph X/Z. Arhu is not a primary mark;
  // HUB1 core is the Sea of Xionahui sample in that region.
  var HUBS = [
    {
      id: "capital",
      label: "Hub capital",
      note: "Uthmi Beta · HUB16-205 Bixiann",
      glyphs: "2205D058AC1D",
      coords: "041C:004F:0D89:0205",
      galaxy: 0
    },
    {
      id: "hub1",
      label: "HUB1 core",
      note: "Sea of Xionahui",
      glyphs: "1001CF589C1E",
      coords: "041D:004E:0D88:0001",
      galaxy: 0
    },
    {
      id: "former",
      label: "Former Hub",
      note: "Pre-2025 capital",
      glyphs: "2052F9557C30",
      coords: "042F:0078:0D56:001B",
      galaxy: 0
    }
  ];

  // Euclid quadrant references. Signal-booster XXXX:YYYY:ZZZZ:SSSS, planet
  // index 1. Glyphs are derived with glyphsFromSignal, the inverse of the
  // offsets in analyzeGlyphs. Wiki ":PC" Polaris rows use SSI 0001.
  // Sources: No Man's Sky Wiki (fandom) NMS Hub, Civilized space, and the
  // Polaris / civilization pages; Galactic Hub capital context on Miraheze.
  // Community landmarks move. These are not a star catalog.
  // Empire of Anomalies is filed under Beta on the NMS Hub directory, but its
  // capital address and civilization page are Alpha, so it is plotted there.
  // The Hub capital, HUB1, and Former Hub stay on the Hub layer.
  var REFERENCES = [
    {
      id: "alpha-polaris",
      label: "Alpha Polaris",
      quadrant: "alpha",
      note: "Fade pole · Vedulay Cloud",
      coords: "0000:007F:0000:0001",
      galaxy: 0
    },
    {
      id: "amino",
      label: "Amino Hub",
      quadrant: "alpha",
      note: "Ocopad Conflux · Amino Prime",
      coords: "064A:0082:01B9:0022",
      galaxy: 0
    },
    {
      id: "qitanian",
      label: "Qitanian Empire",
      quadrant: "alpha",
      note: "Oefergia Boundary · Qitand-Tus",
      coords: "07FA:0081:07F9:0036",
      galaxy: 0
    },
    {
      id: "rss",
      label: "Royal Space Society",
      quadrant: "alpha",
      note: "Uekenbe Shallows · Urticalia",
      coords: "0523:0076:06BF:0141",
      galaxy: 0
    },
    {
      id: "nmh",
      label: "No Man's High",
      quadrant: "alpha",
      note: "Lahanhar Conflux · Notric-Lis XIII",
      coords: "014C:0077:06DA:01F2",
      galaxy: 0
    },
    {
      id: "eoa",
      label: "Empire of Anomalies",
      quadrant: "alpha",
      note: "Domoni Boundary · Uroish-Dubb V. Directory lists Beta; this address is Alpha.",
      coords: "0478:0078:0225:00AC",
      galaxy: 0
    },
    {
      id: "beta-polaris",
      label: "Beta Polaris",
      quadrant: "beta",
      note: "Fade pole · Ongyimid Shallows",
      coords: "0FFE:007F:0000:0001",
      galaxy: 0
    },
    {
      id: "conjunction",
      label: "Grand Conjunction",
      quadrant: "beta",
      note: "Gwriginhi Conflux · Mestr-Gebo at'Folr",
      coords: "0CF1:0082:031B:006F",
      galaxy: 0
    },
    {
      id: "astrocasters",
      label: "Astrocasters",
      quadrant: "beta",
      note: "Elvindr · Binaza",
      coords: "0FB1:00F1:0001:0026",
      galaxy: 0
    },
    {
      id: "pnms",
      label: "Pirates of No Mans Sky",
      quadrant: "beta",
      note: "Olatzman Spur · Sentinal Home Planet",
      coords: "089A:0081:0105:0091",
      galaxy: 0
    },
    {
      id: "eld",
      label: "Empire of Eld",
      quadrant: "beta",
      note: "Tufinglu Adjunct · Eld Galactic Prime",
      coords: "0FFC:00FE:04D6:0053",
      galaxy: 0
    },
    {
      id: "gamma-polaris",
      label: "Gamma Polaris",
      quadrant: "gamma",
      note: "Fade pole · Sea of Siwain",
      coords: "0000:007F:0FFE:0001",
      galaxy: 0
    },
    {
      id: "agt",
      label: "AGT",
      quadrant: "gamma",
      note: "Yihelli Quadrant · Firstfall. Embassy SSI 005F is the same region.",
      coords: "043D:0072:0D44:001C",
      galaxy: 0
    },
    {
      id: "heian",
      label: "Heian Empire",
      quadrant: "gamma",
      note: "Bibiol Instability · Kyomei",
      coords: "0442:007A:0DD7:01E7",
      galaxy: 0
    },
    {
      id: "egr",
      label: "Euclidean Republic",
      quadrant: "gamma",
      note: "Jaelott Band · Kutmoria ER-1",
      coords: "06AB:0085:0914:01B2",
      galaxy: 0
    },
    {
      id: "puf",
      label: "Pioneers of Universal Frontiers",
      quadrant: "gamma",
      note: "Midaribe Anomaly · 3rdFTS-PUF",
      coords: "0262:007D:0B4E:0022",
      galaxy: 0
    },
    {
      id: "delta-polaris",
      label: "Delta Polaris",
      quadrant: "delta",
      note: "Fade pole · Sea of Onhakitc",
      coords: "0FFE:007F:0FFE:0001",
      galaxy: 0
    },
    {
      id: "pirate-hub",
      label: "Pirate Hub",
      quadrant: "delta",
      note: "Lughunh · NMS Hub directory. The civ page leaves coordinates blank.",
      coords: "0E76:0084:0A72:0055",
      galaxy: 0
    },
    {
      id: "rsf",
      label: "Royal Space Federation",
      quadrant: "delta",
      note: "Ilmatch Conflux · Primus Capitis",
      coords: "080B:0080:0804:01D5",
      galaxy: 0
    },
    {
      id: "bso",
      label: "Black Star Order",
      quadrant: "delta",
      note: "Tejeti Cloud · Rerkungan",
      coords: "0B15:007C:0AD7:002D",
      galaxy: 0
    },
    {
      id: "pandora",
      label: "Pandora's Consortium",
      quadrant: "delta",
      note: "Mistiacia Shallows · (PC) Pandora",
      coords: "0994:0078:0976:019D",
      galaxy: 0
    }
  ];

  var QUADRANT_LABELS = { alpha: "Alpha", beta: "Beta", gamma: "Gamma", delta: "Delta" };

  var HG_MAGIC = 0xFEEDA1E5;
  var HG_CHUNK_MAX = 0x80000;
  var SAVE_BYTE_MAX = 48 * 1024 * 1024;
  var PORTAL_MASK = 0xFFFFFFFFFFFFn;

  function hexPad(n, w) {
    return (n >>> 0).toString(16).toUpperCase().padStart(w, "0");
  }

  function sign12(n) {
    n &= 0xFFF;
    return (n & 0x800) ? n - 0x1000 : n;
  }

  function sign8(n) {
    n &= 0xFF;
    return (n & 0x80) ? n - 0x100 : n;
  }

  function glyphsFromSignal(coords, planet) {
    var parts = String(coords || "").toUpperCase().trim().split(":");
    if (parts.length !== 4) throw new Error("Signal-booster coordinates must be XXXX:YYYY:ZZZZ:SSSS.");
    var sbX = parseInt(parts[0], 16);
    var sbY = parseInt(parts[1], 16);
    var sbZ = parseInt(parts[2], 16);
    var ssi = parseInt(parts[3], 16);
    if (![sbX, sbY, sbZ, ssi].every(function (n) { return isFinite(n); })) {
      throw new Error("Signal-booster coordinates are not hex.");
    }
    if (!/^[0-9A-F]{4}$/.test(parts[0]) || !/^[0-9A-F]{4}$/.test(parts[1]) ||
        !/^[0-9A-F]{4}$/.test(parts[2]) || !/^[0-9A-F]{4}$/.test(parts[3])) {
      throw new Error("Signal-booster coordinates are not hex.");
    }
    var p = planet == null ? 1 : (Number(planet) & 0xF);
    var x = (sbX - 0x7FF) & 0xFFF;
    var y = (sbY - 0x7F) & 0xFF;
    var z = (sbZ - 0x7FF) & 0xFFF;
    return hexPad(p, 1) + hexPad(ssi & 0xFFF, 3) + hexPad(y, 2) + hexPad(z, 3) + hexPad(x, 3);
  }

  function quadrantOf(voxelX, voxelZ) {
    if (voxelX < 0 && voxelZ < 0) return "alpha";
    if (voxelX >= 0 && voxelZ < 0) return "beta";
    if (voxelX < 0 && voxelZ >= 0) return "gamma";
    return "delta";
  }

  function analyzeGlyphs(glyphs) {
    var g = String(glyphs || "").toUpperCase().replace(/[^0-9A-F]/g, "");
    if (g.length !== 12) throw new Error("Portal glyphs must be 12 hex digits.");
    var planet = parseInt(g.slice(0, 1), 16);
    var ssi = parseInt(g.slice(1, 4), 16);
    var y = parseInt(g.slice(4, 6), 16);
    var z = parseInt(g.slice(6, 9), 16);
    var x = parseInt(g.slice(9, 12), 16);
    var sbX = (x + 0x7FF) & 0xFFF;
    var sbY = (y + 0x7F) & 0xFF;
    var sbZ = (z + 0x7FF) & 0xFFF;
    return {
      glyphs: g,
      planet: planet,
      ssi: ssi,
      voxelX: sign12(x),
      voxelY: sign8(y),
      voxelZ: sign12(z),
      coords: hexPad(sbX, 4) + ":" + hexPad(sbY, 4) + ":" + hexPad(sbZ, 4) + ":" + hexPad(ssi, 4)
    };
  }

  function toBigInt(raw) {
    if (typeof raw === "bigint") return raw;
    if (typeof raw === "number") {
      if (!isFinite(raw) || Math.trunc(raw) !== raw) throw new Error("GalacticAddress is not an integer.");
      if (Math.abs(raw) > Number.MAX_SAFE_INTEGER) {
        throw new Error("GalacticAddress is too large for a JSON number. Keep it as a string.");
      }
      return BigInt(raw);
    }
    var s = String(raw == null ? "" : raw).trim();
    if (/^-?0x[0-9a-f]+$/i.test(s)) return BigInt(s);
    if (/^-?\d+$/.test(s)) return BigInt(s);
    if (/^[0-9a-f]+$/i.test(s) && /[a-f]/i.test(s)) return BigInt("0x" + s);
    throw new Error("Unrecognized GalacticAddress.");
  }

  function decodeGalacticAddress(raw) {
    var addr = toBigInt(raw);
    if (addr < 0n) {
      var mod = 1n << 64n;
      addr = ((addr % mod) + mod) % mod;
    }
    var portal = addr & PORTAL_MASK;
    var planet = Number((portal >> 44n) & 0xFn);
    var ssi = Number((portal >> 32n) & 0xFFFn);
    var yRaw = Number((portal >> 24n) & 0xFFn);
    var zRaw = Number((portal >> 12n) & 0xFFFn);
    var xRaw = Number(portal & 0xFFFn);
    var glyphs = hexPad(planet, 1) + hexPad(ssi, 3) + hexPad(yRaw, 2) + hexPad(zRaw, 3) + hexPad(xRaw, 3);
    var info = analyzeGlyphs(glyphs);
    info.galaxy = null;
    return info;
  }

  function decodeAddressField(field) {
    if (field && typeof field === "object") {
      var vx = field.VoxelX != null ? field.VoxelX : field.voxelX;
      var vy = field.VoxelY != null ? field.VoxelY : field.voxelY;
      var vz = field.VoxelZ != null ? field.VoxelZ : field.voxelZ;
      var ssi = field.SolarSystemIndex != null ? field.SolarSystemIndex : field.solarSystemIndex;
      var planet = field.PlanetIndex != null ? field.PlanetIndex : field.planetIndex;
      if (vx == null || vy == null || vz == null || ssi == null) {
        throw new Error("GalacticAddress object is missing voxel fields.");
      }
      var x = ((Number(vx) % 4096) + 4096) % 4096;
      var y = ((Number(vy) % 256) + 256) % 256;
      var z = ((Number(vz) % 4096) + 4096) % 4096;
      var glyphs = hexPad(Number(planet || 0) & 0xF, 1) +
        hexPad(Number(ssi) & 0xFFF, 3) +
        hexPad(y, 2) +
        hexPad(z, 3) +
        hexPad(x, 3);
      var info = analyzeGlyphs(glyphs);
      var g = field.RealityIndex != null ? field.RealityIndex : field.realityIndex;
      info.galaxy = g == null ? null : Number(g) & 0xFF;
      return info;
    }
    return decodeGalacticAddress(field);
  }

  function quoteGalacticAddresses(text) {
    return String(text).replace(/("(?:GalacticAddress|galacticAddress|oZw|UniverseAddress|FreighterUniverseAddress|Location|yhJ|RB7|YTa|UA|5L6)"\s*:\s*)(-?\d+)/g, '$1"$2"');
  }

  function stripTrailingNulls(bytes) {
    var end = bytes.length;
    while (end > 0 && bytes[end - 1] === 0) end--;
    return bytes.subarray(0, end);
  }

  function lz4BlockDecompress(src, expected) {
    if (!Number.isInteger(expected) || expected < 0 || expected > HG_CHUNK_MAX) {
      throw new Error("LZ4 block size is not usable.");
    }
    var dst = new Uint8Array(expected);
    if (expected === 0) {
      if (src.length !== 0) throw new Error("LZ4 block did not match its size.");
      return dst;
    }
    var s = 0;
    var d = 0;
    while (s < src.length) {
      var token = src[s++];
      var lit = token >> 4;
      if (lit === 15) {
        var extra;
        do {
          if (s >= src.length) throw new Error("LZ4 literal length ran past the block.");
          extra = src[s++];
          lit += extra;
          if (lit > expected) throw new Error("LZ4 literal length is too long.");
        } while (extra === 255);
      }
      if (lit > expected - d || s + lit > src.length) throw new Error("LZ4 literals ran past the block.");
      if (lit) dst.set(src.subarray(s, s + lit), d);
      s += lit;
      d += lit;
      if (d === expected) {
        if (s !== src.length) throw new Error("LZ4 block had trailing bytes.");
        return dst;
      }
      if (s + 2 > src.length) throw new Error("LZ4 match offset ran past the block.");
      var offset = src[s] | (src[s + 1] << 8);
      s += 2;
      if (offset === 0 || offset > d) throw new Error("LZ4 match offset is out of range.");
      var match = (token & 0x0F) + 4;
      if ((token & 0x0F) === 15) {
        var more;
        do {
          if (s >= src.length) throw new Error("LZ4 match length ran past the block.");
          more = src[s++];
          match += more;
          if (match > expected) throw new Error("LZ4 match length is too long.");
        } while (more === 255);
      }
      if (d + match > expected) throw new Error("LZ4 match ran past the block.");
      var from = d - offset;
      for (var i = 0; i < match; i++) dst[d++] = dst[from++];
    }
    if (d !== expected) throw new Error("LZ4 block ended early.");
    return dst;
  }

  function decompressHg(bytes) {
    if (!bytes || !bytes.length) throw new Error("Empty save.");
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var offset = 0;
    var parts = [];
    var total = 0;
    while (offset < bytes.length) {
      if (offset + 16 > bytes.length) throw new Error("Truncated .hg block header.");
      var magic = view.getUint32(offset, true);
      if (magic !== HG_MAGIC) throw new Error("Not an LZ4 .hg save.");
      var compressedSize = view.getUint32(offset + 4, true);
      var uncompressedSize = view.getUint32(offset + 8, true);
      if (uncompressedSize > HG_CHUNK_MAX) throw new Error(".hg block is larger than 512 KB.");
      var payload = offset + 16;
      var payloadEnd = payload + compressedSize;
      if (compressedSize > bytes.length || payloadEnd > bytes.length) throw new Error("Truncated .hg block.");
      var chunk = lz4BlockDecompress(bytes.subarray(payload, payloadEnd), uncompressedSize);
      total += chunk.length;
      if (total > SAVE_BYTE_MAX) throw new Error(".hg save is too large.");
      parts.push(chunk);
      offset = payloadEnd;
    }
    var out = new Uint8Array(total);
    var at = 0;
    for (var i = 0; i < parts.length; i++) {
      out.set(parts[i], at);
      at += parts[i].length;
    }
    return out;
  }

  function detectSaveFormat(bytes) {
    if (!bytes || !bytes.length) return "unknown";
    var i = 0;
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) i = 3;
    var j = i;
    while (j < bytes.length && (bytes[j] === 9 || bytes[j] === 10 || bytes[j] === 13 || bytes[j] === 32)) j++;
    if (j < bytes.length && bytes[j] === 0x7B) return "json";
    if (bytes.length >= 4) {
      var magic = ((bytes[0]) | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >>> 0;
      if (magic === HG_MAGIC) return "hg";
    }
    return "unknown";
  }

  function bytesToSaveText(bytes) {
    var format = detectSaveFormat(bytes);
    if (format === "json") {
      var buf = bytes;
      if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) buf = buf.subarray(3);
      return {
        text: new TextDecoder("utf-8", { fatal: false }).decode(stripTrailingNulls(buf)),
        format: "json",
        fromHg: false
      };
    }
    if (format === "hg") {
      try {
        var raw = decompressHg(bytes);
        return {
          text: new TextDecoder("utf-8", { fatal: false }).decode(stripTrailingNulls(raw)),
          format: "hg",
          fromHg: true
        };
      } catch (hgErr) {
        var broken = new Error("hg");
        broken.code = "hg";
        throw broken;
      }
    }
    var unknown = new Error("unknown");
    unknown.code = "unknown";
    throw unknown;
  }

  function mappingFromJson(data) {
    var list = data && data.Mapping;
    if (!Array.isArray(list)) throw new Error("Key map is not a MBINCompiler mapping.");
    var table = Object.create(null);
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      if (!entry || entry.Key == null || entry.Value == null) continue;
      var key = String(entry.Key);
      if (table[key] == null) table[key] = String(entry.Value);
    }
    return table;
  }

  function unmapTree(node, table) {
    if (Array.isArray(node)) {
      var arr = new Array(node.length);
      for (var i = 0; i < node.length; i++) arr[i] = unmapTree(node[i], table);
      return arr;
    }
    if (!node || typeof node !== "object") return node;
    var out = {};
    var keys = Object.keys(node);
    for (var k = 0; k < keys.length; k++) {
      var name = keys[k];
      var mapped = table[name] != null ? table[name] : name;
      out[mapped] = unmapTree(node[name], table);
    }
    return out;
  }

  function needsUnmap(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    var keys = Object.keys(data);
    var sentinels = { "F2P": 1, "6f=": 1, "8>q": 1, "vLc": 1, "oZw": 1, "F?0": 1 };
    for (var i = 0; i < keys.length; i++) if (sentinels[keys[i]]) return true;
    if (keys.indexOf("Version") !== -1 || keys.indexOf("PlayerStateData") !== -1 || keys.indexOf("BaseContext") !== -1) return false;
    var shortKeys = 0;
    for (var j = 0; j < keys.length; j++) if (keys[j].length === 3) shortKeys++;
    return keys.length > 0 && shortKeys * 2 >= keys.length;
  }

  var mappingTable = null;
  var mappingPromise = null;

  function ensureMapping() {
    if (mappingTable) return Promise.resolve(mappingTable);
    if (mappingPromise) return mappingPromise;
    var url = "mapping.json";
    if (typeof document !== "undefined") {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute("src") || "";
        if (/nms-map\.js(?:\?|$)/.test(src)) {
          url = src.replace(/nms-map\.js(\?.*)?$/, "mapping.json");
          break;
        }
      }
    }
    mappingPromise = fetch(url).then(function (res) {
      if (!res.ok) throw new Error("key map");
      return res.json();
    }).then(function (json) {
      mappingTable = mappingFromJson(json);
      return mappingTable;
    });
    return mappingPromise;
  }

  function readSaveDocument(buf) {
    var decoded;
    try {
      decoded = bytesToSaveText(buf);
    } catch (err) {
      var broken = new Error(err && err.code === "hg" ? "hg" : "unknown");
      broken.code = err && err.code === "hg" ? "hg" : "unknown";
      return Promise.reject(broken);
    }
    var trimmed = String(decoded.text || "").replace(/^\uFEFF/, "").trim();
    var head = trimmed.charAt(0);
    if (head !== "{" && head !== "[") {
      var binary = new Error("binary");
      binary.code = "binary";
      return Promise.reject(binary);
    }
    var data;
    try {
      data = JSON.parse(quoteGalacticAddresses(trimmed));
    } catch (err) {
      var bad = new Error("json");
      bad.code = "json";
      bad.format = decoded.format;
      return Promise.reject(bad);
    }
    if (!needsUnmap(data)) {
      return Promise.resolve({ data: data, format: decoded.format, fromHg: !!decoded.fromHg, unmapped: false });
    }
    return ensureMapping().then(function (table) {
      return { data: unmapTree(data, table), format: decoded.format, fromHg: !!decoded.fromHg, unmapped: true };
    }).catch(function () {
      var missing = new Error("map");
      missing.code = "map";
      throw missing;
    });
  }

  function looksBinary(bytes) {
    var n = Math.min(bytes.length, 4096);
    if (!n) return false;
    var weird = 0;
    var nul = 0;
    for (var i = 0; i < n; i++) {
      var c = bytes[i];
      if (c === 0) nul++;
      if (c < 9 || (c > 13 && c < 32)) weird++;
    }
    if (nul > 0) return true;
    return weird / n > 0.02;
  }

  function typeName(bt) {
    if (bt == null) return "Unknown";
    if (typeof bt === "string") return bt.trim() || "Unknown";
    if (typeof bt === "number") return String(bt);
    if (typeof bt === "object") {
      var inner = bt.PersistentBaseTypes != null ? bt.PersistentBaseTypes : bt.persistentBaseTypes;
      if (typeof inner === "string") return inner.trim() || "Unknown";
      if (inner && typeof inner === "object") {
        var nested = inner.PersistentBaseTypes || inner.persistentBaseTypes;
        if (typeof nested === "string") return nested.trim() || "Unknown";
      }
    }
    return "Unknown";
  }

  function isFreighter(name) {
    return /freighter/i.test(name || "");
  }

  function galaxyLabel(n) {
    if (n == null || !isFinite(n)) return "Galaxy unknown";
    var name = GALAXY_NAMES[n];
    return name ? name : "Galaxy " + n;
  }

  function lyBetween(a, b) {
    var dx = a.voxelX - b.voxelX;
    var dy = a.voxelY - b.voxelY;
    var dz = a.voxelZ - b.voxelZ;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) * 400;
  }

  function formatLy(n) {
    if (!isFinite(n)) return "—";
    var rounded = Math.round(n);
    return rounded.toLocaleString("en-US") + " ly";
  }

  function playerStateOf(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    var ctx = data.BaseContext;
    if (ctx && typeof ctx === "object" && !Array.isArray(ctx) &&
        ctx.PlayerStateData && typeof ctx.PlayerStateData === "object" && !Array.isArray(ctx.PlayerStateData)) {
      return ctx.PlayerStateData;
    }
    if (data.PlayerStateData && typeof data.PlayerStateData === "object" && !Array.isArray(data.PlayerStateData)) {
      return data.PlayerStateData;
    }
    return null;
  }

  function extractBases(data) {
    var player = playerStateOf(data);
    if (!player) return { error: "missing" };
    var list = player.PersistentPlayerBases;
    if (!Array.isArray(list) || list.length === 0) return { error: "empty" };
    var planetary = [];
    var freighters = [];
    var problems = [];
    list.forEach(function (row, i) {
      if (!row || typeof row !== "object") {
        problems.push({ name: "Base " + (i + 1), detail: "Entry was not an object." });
        return;
      }
      var name = row.Name != null ? String(row.Name).trim() : (row.name != null ? String(row.name).trim() : "");
      if (!name) name = "(unnamed)";
      var kind = typeName(row.BaseType != null ? row.BaseType : row.baseType);
      var addr = row.GalacticAddress != null ? row.GalacticAddress : row.galacticAddress;
      if (addr == null) {
        problems.push({ name: name, detail: "Missing GalacticAddress.", type: kind });
        return;
      }
      var decoded;
      try {
        decoded = decodeAddressField(addr);
      } catch (err) {
        problems.push({ name: name, detail: err.message || "Could not read GalacticAddress.", type: kind });
        return;
      }
      var item = {
        id: (isFreighter(kind) ? "f" : "b") + i,
        name: name,
        type: kind,
        galaxy: decoded.galaxy,
        glyphs: decoded.glyphs,
        coords: decoded.coords,
        planet: decoded.planet,
        ssi: decoded.ssi,
        voxelX: decoded.voxelX,
        voxelY: decoded.voxelY,
        voxelZ: decoded.voxelZ
      };
      item.lyCenter = lyBetween(item, { voxelX: 0, voxelY: 0, voxelZ: 0 });
      if (isFreighter(kind)) freighters.push(item);
      else planetary.push(item);
    });
    return { planetary: planetary, freighters: freighters, problems: problems };
  }

  function discoveryDeps() {
    return {
      decodeAddressField: decodeAddressField,
      toBigInt: toBigInt,
      portalMask: PORTAL_MASK,
      lyBetween: lyBetween
    };
  }

  function extractDiscoveries(data) {
    if (!DiscoveryLib) {
      return { records: [], systems: [], problems: [{ name: "Discoveries", detail: "Discovery parser did not load." }] };
    }
    return DiscoveryLib.extractDiscoveries(data, discoveryDeps());
  }

  function mergeSaveDocuments(docs) {
    if (!DiscoveryLib) return (docs && docs[0]) || {};
    return DiscoveryLib.mergeSaveDocuments(docs, discoveryDeps());
  }

  function hubMarks() {
    return HUBS.map(function (h) {
      var info = analyzeGlyphs(h.glyphs);
      return {
        id: h.id,
        label: h.label,
        glyphs: h.glyphs,
        coords: h.coords,
        note: h.note || "",
        galaxy: h.galaxy,
        voxelX: info.voxelX,
        voxelY: info.voxelY,
        voxelZ: info.voxelZ
      };
    });
  }

  function referenceMarks() {
    var seen = Object.create(null);
    return REFERENCES.map(function (r) {
      var glyphs = glyphsFromSignal(r.coords, 1);
      var info = analyzeGlyphs(glyphs);
      if (info.coords !== String(r.coords).toUpperCase()) {
        throw new Error("Reference " + r.id + " did not round-trip.");
      }
      if (info.planet !== 1) throw new Error("Reference " + r.id + " is not planet index 1.");
      if (quadrantOf(info.voxelX, info.voxelZ) !== r.quadrant) {
        throw new Error("Reference " + r.id + " is not in " + r.quadrant + ".");
      }
      if (seen[glyphs]) throw new Error("Duplicate reference glyphs " + glyphs);
      seen[glyphs] = 1;
      return {
        id: r.id,
        label: r.label,
        quadrant: r.quadrant,
        glyphs: glyphs,
        coords: info.coords,
        note: r.note || "",
        galaxy: r.galaxy,
        planet: info.planet,
        ssi: info.ssi,
        voxelX: info.voxelX,
        voxelY: info.voxelY,
        voxelZ: info.voxelZ
      };
    });
  }

  var MIN_ZOOM = 0.8;
  var MAX_ZOOM = 128;
  // Neighbor spacing (px) of a same-voxel ring when zoom === CLUMP_REF_ZOOM.
  // Radius scales linearly with zoom, so the ring is fixed in the view transform
  // and zoomAbout keeps a marker planted while the pile opens.
  var CLUMP_GAP = 30;
  var CLUMP_REF_ZOOM = 16;
  var CLUMP_STACK_GAP = 18;
  var LABEL_CHORD = 56;
  var LABEL_ZOOM = 12;

  function clampZoom(z) {
    if (!isFinite(z) || z <= 0) return 1;
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
  }

  function clumpZoomForGap(gapPx) {
    var gap = gapPx > 0 && isFinite(gapPx) ? gapPx : CLUMP_GAP;
    return clampZoom(gap * CLUMP_REF_ZOOM / CLUMP_GAP);
  }

  function clumpOffset(index, count, zoom) {
    var n = count | 0;
    var i = index | 0;
    if (n < 2 || i < 0 || i >= n) {
      return { x: 0, y: 0, radius: 0, chord: 0, stacked: false };
    }
    var z = zoom > 0 && isFinite(zoom) ? zoom : 1;
    var chord = CLUMP_GAP * (z / CLUMP_REF_ZOOM);
    var per = n > 12 ? 10 : n;
    var ring = Math.floor(i / per);
    var slot = i - ring * per;
    var inRing = Math.min(per, n - ring * per);
    var ang = (slot / inRing) * Math.PI * 2 - Math.PI / 2;
    var baseRing = chord / (2 * Math.sin(Math.PI / per));
    var radius = baseRing + ring * chord * 1.2;
    return {
      x: Math.cos(ang) * radius,
      y: Math.sin(ang) * radius,
      radius: radius,
      chord: chord,
      stacked: chord < CLUMP_STACK_GAP
    };
  }

  function panToMarker(voxelX, voxelZ, index, count, zoom, frame, sx, sy) {
    var off = clumpOffset(index, count, zoom);
    var R = 2048;
    return {
      panX: sx - frame.cx - (voxelX / R) * frame.rx * zoom - off.x,
      panY: sy - frame.cy + (voxelZ / R) * frame.ry * zoom - off.y
    };
  }

  function frameOf(w, h) {
    var rx = Math.min(w, h * 1.35) * 0.42;
    var ry = rx * 0.72;
    if (ry > h * 0.40) {
      ry = h * 0.40;
      rx = ry / 0.72;
    }
    return { cx: w / 2, cy: h / 2, rx: rx, ry: ry };
  }

  function zoomAbout(view, sx, sy, cx, cy, factor) {
    var zoom = view.zoom > 0 ? view.zoom : 1;
    var next = clampZoom(zoom * factor);
    var wx = (sx - cx - view.panX) / zoom;
    var wy = (sy - cy - view.panY) / zoom;
    return {
      zoom: next,
      panX: sx - cx - wx * next,
      panY: sy - cy - wy * next
    };
  }

  function fitView(points, frame, size, opts) {
    opts = opts || {};
    var pad = opts.padVoxels == null ? 160 : opts.padVoxels;
    var minZoom = opts.minZoom == null ? MIN_ZOOM : opts.minZoom;
    var maxZoom = opts.maxZoom == null ? MAX_ZOOM : opts.maxZoom;
    var list = [];
    (points || []).forEach(function (p) {
      if (!p) return;
      var x = p.x != null ? p.x : p.voxelX;
      var z = p.z != null ? p.z : p.voxelZ;
      if (!isFinite(x) || !isFinite(z)) return;
      list.push({ x: x, z: z });
    });
    if (!list.length) list.push({ x: 0, z: 0 });
    var minX = Infinity;
    var maxX = -Infinity;
    var minZ = Infinity;
    var maxZ = -Infinity;
    list.forEach(function (p) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });
    minX -= pad;
    maxX += pad;
    minZ -= pad;
    maxZ += pad;
    var spanX = Math.max(8, ((maxX - minX) / 2048) * frame.rx);
    var spanY = Math.max(8, ((maxZ - minZ) / 2048) * frame.ry);
    var zoom = clampZoom(Math.min((size.w * 0.72) / spanX, (size.h * 0.66) / spanY));
    zoom = clampZoom(Math.max(minZoom, Math.min(maxZoom, zoom)));
    var midX = (minX + maxX) / 2;
    var midZ = (minZ + maxZ) / 2;
    return {
      zoom: zoom,
      panX: -(midX / 2048) * frame.rx * zoom,
      panY: (midZ / 2048) * frame.ry * zoom
    };
  }

  // Screen-space selection. Marker hits are canvas pixels after pan and zoom.
  // Map voxels are a different space: the disk is elliptical, so a screen
  // circle is not a circle in voxels.
  var SELECTABLE_KINDS = { base: true, system: true, freighter: true, settlement: true, discovery: true };

  function pointInRect(x, y, rect) {
    if (!rect || !isFinite(x) || !isFinite(y)) return false;
    var x0 = Number(rect.x0);
    var y0 = Number(rect.y0);
    var x1 = Number(rect.x1);
    var y1 = Number(rect.y1);
    if (![x0, y0, x1, y1].every(isFinite)) return false;
    var left = Math.min(x0, x1);
    var right = Math.max(x0, x1);
    var top = Math.min(y0, y1);
    var bottom = Math.max(y0, y1);
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  function pointInCircle(x, y, circle) {
    if (!circle || !isFinite(x) || !isFinite(y)) return false;
    var cx = Number(circle.cx);
    var cy = Number(circle.cy);
    var r = Number(circle.r);
    if (![cx, cy, r].every(isFinite) || r < 0) return false;
    var dx = x - cx;
    var dy = y - cy;
    return dx * dx + dy * dy <= r * r + 1e-9;
  }

  function mapToScreen(voxelX, voxelZ, view, frame) {
    var zoom = view && view.zoom > 0 && isFinite(view.zoom) ? view.zoom : 1;
    var panX = view && isFinite(view.panX) ? view.panX : 0;
    var panY = view && isFinite(view.panY) ? view.panY : 0;
    var R = 2048;
    return {
      x: frame.cx + panX + (voxelX / R) * frame.rx * zoom,
      y: frame.cy + panY - (voxelZ / R) * frame.ry * zoom
    };
  }

  function screenToMap(x, y, view, frame) {
    var zoom = view && view.zoom > 0 && isFinite(view.zoom) ? view.zoom : 1;
    var panX = view && isFinite(view.panX) ? view.panX : 0;
    var panY = view && isFinite(view.panY) ? view.panY : 0;
    var R = 2048;
    return {
      voxelX: ((x - frame.cx - panX) / (frame.rx * zoom)) * R,
      voxelZ: -((y - frame.cy - panY) / (frame.ry * zoom)) * R
    };
  }

  function screenRadiusLy(radiusPx, frame, zoom) {
    var z = zoom > 0 && isFinite(zoom) ? zoom : 0;
    var rx = frame && frame.rx > 0 ? frame.rx : 0;
    if (!(radiusPx >= 0) || !isFinite(radiusPx) || !z || !rx) return null;
    return (radiusPx / (rx * z)) * 2048 * 400;
  }

  function markersInside(markers, shape) {
    var hits = [];
    (markers || []).forEach(function (marker) {
      if (!marker || !isFinite(marker.x) || !isFinite(marker.y)) return;
      if (marker.kind && !SELECTABLE_KINDS[marker.kind]) return;
      var ok = false;
      if (shape && shape.type === "circle") ok = pointInCircle(marker.x, marker.y, shape);
      else if (shape) ok = pointInRect(marker.x, marker.y, shape);
      if (ok) hits.push(marker);
    });
    return hits;
  }

  function selectionGesture(keys, toolbarMode) {
    keys = keys || {};
    var ctrl = !!(keys.ctrl || keys.meta);
    var alt = !!keys.alt;
    var shift = !!keys.shift;
    var op = "replace";
    if ((ctrl && shift) || (alt && ctrl)) op = "subtract";
    else if (ctrl) op = "add";
    var shape = (toolbarMode === "circle" || (alt && !ctrl)) ? "circle" : "box";
    return { op: op, shape: shape };
  }

  function toggleId(ids, id) {
    var next = (ids || []).slice();
    var at = next.indexOf(id);
    if (at === -1) next.push(id);
    else next.splice(at, 1);
    return next;
  }

  function applySelectionOp(current, hitIds, op) {
    var hits = [];
    var seenHit = Object.create(null);
    (hitIds || []).forEach(function (id) {
      if (id == null || seenHit[id]) return;
      seenHit[id] = true;
      hits.push(id);
    });
    if (op === "add") {
      var next = (current || []).slice();
      var have = Object.create(null);
      next.forEach(function (id) { have[id] = true; });
      hits.forEach(function (id) {
        if (!have[id]) {
          have[id] = true;
          next.push(id);
        }
      });
      return next;
    }
    if (op === "subtract") return (current || []).filter(function (id) { return !seenHit[id]; });
    return hits;
  }

  function rangeIds(orderedIds, anchorId, targetId) {
    var order = orderedIds || [];
    if (targetId == null) return [];
    var b = order.indexOf(targetId);
    if (b < 0) return [targetId];
    var a = order.indexOf(anchorId);
    if (a < 0) return [targetId];
    var lo = Math.min(a, b);
    var hi = Math.max(a, b);
    return order.slice(lo, hi + 1);
  }

  function formatQty(n) {
    var v = Math.round(Number(n) || 0);
    try { return v.toLocaleString("en-US"); }
    catch (err) { return String(v); }
  }

  function resourceName(id, api, index) {
    if (!id) return "";
    var node = index && index.byId && index.byId[id];
    if (node && node.name) return node.name;
    var choices = (api && api.RESOURCE_CHOICES) || [];
    for (var i = 0; i < choices.length; i++) {
      if (choices[i][0] === id) return choices[i][1];
    }
    if (api && api.itemLabel) return api.itemLabel({ id: id, rawId: id }, index);
    return id;
  }

  var MINING_KIND_LABEL = { mineral: "Mineral", gas: "Gas", amu: "AMU" };

  function miningRowsFor(sites, api, index) {
    var groups = Object.create(null);
    var order = [];
    (sites || []).forEach(function (site) {
      if (!site || (site.kind !== "mineral" && site.kind !== "gas" && site.kind !== "amu")) return;
      var described = api && api.describeSite ? api.describeSite(site, index) : { rate: null };
      var resourceId = api && api.siteProductId ? api.siteProductId(site) : (site.resourceId || "");
      var unset = !resourceId;
      var key = unset ? ("unset:" + site.kind) : ("res:" + resourceId);
      if (!groups[key]) {
        groups[key] = {
          key: key,
          label: unset ? (MINING_KIND_LABEL[site.kind] || site.kind) : resourceName(resourceId, api, index),
          count: 0,
          rate: 0,
          approximate: false,
          unset: unset,
          kind: site.kind,
          places: []
        };
        order.push(key);
      }
      var row = groups[key];
      row.count += site.count || 0;
      if (!unset && described.rate && described.rate.perHour > 0) {
        row.rate += described.rate.perHour;
        row.approximate = !!described.rate.approximate;
      }
    });
    return order.map(function (key) { return groups[key]; });
  }

  function miningChipText(row) {
    if (!row) return "";
    var text = row.label + " ×" + formatQty(row.count);
    if (row.unset) return text + " (unset)";
    if (row.rate > 0) return text + " · ~" + formatQty(row.rate) + "/h";
    return text;
  }

  function cropRowsFor(sites, api, index) {
    var groups = Object.create(null);
    var order = [];
    (sites || []).forEach(function (site) {
      if (!site || site.kind !== "crop") return;
      var described = api && api.describeSite ? api.describeSite(site, index) : { name: "", title: "" };
      var label = described.name || "Crop";
      if (!groups[label]) {
        groups[label] = { label: label, title: described.title || "", count: 0, places: [] };
        order.push(label);
      }
      groups[label].count += site.count || 0;
    });
    return order.map(function (key) { return groups[key]; });
  }

  function cropChipText(row) {
    if (!row) return "";
    return row.label + " ×" + formatQty(row.count);
  }

  function storeHasLogistics(store) {
    if (!store) return false;
    if (store.source && (store.source.fileName || store.source.importedAt)) return true;
    if (store.locations && store.locations.length) return true;
    if (store.production && store.production.length) return true;
    return false;
  }

  function summarizeBase(place, store, api, index, query) {
    var empty = {
      loaded: false,
      message: "No inventory loaded, import a save",
      stacks: 0,
      units: 0,
      topItems: [],
      moreItems: 0,
      mining: [],
      crops: [],
      miningCount: 0,
      miningRate: 0,
      cropCount: 0,
      unmet: false,
      hasQuery: false
    };
    if (!place || !api || !storeHasLogistics(store)) return empty;
    var locs = api.locationsAtPlace(store, place, "base") || [];
    var sites = api.sitesAtPlace(store, place, "base") || [];
    var mining = miningRowsFor(sites, api, index);
    var crops = cropRowsFor(sites, api, index);
    var byItem = Object.create(null);
    var itemOrder = [];
    var stacks = 0;
    var units = 0;
    locs.forEach(function (loc) {
      (loc.items || []).forEach(function (item) {
        stacks += 1;
        units += item.qty || 0;
        var key = item.id;
        if (!byItem[key]) {
          var meta = api.itemMeta ? api.itemMeta(item, index) : { label: api.itemLabel(item, index), title: "", category: "" };
          byItem[key] = { id: key, label: meta.label, title: meta.title || "", category: meta.category || "", qty: 0 };
          itemOrder.push(key);
        }
        byItem[key].qty += item.qty || 0;
      });
    });
    var ranked = itemOrder.map(function (key) { return byItem[key]; });
    ranked.sort(function (a, b) {
      if (b.qty !== a.qty) return b.qty - a.qty;
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });
    var miningCount = 0;
    var miningRate = 0;
    mining.forEach(function (row) {
      miningCount += row.count;
      miningRate += row.rate || 0;
    });
    var cropCount = 0;
    crops.forEach(function (row) { cropCount += row.count; });
    var demands = api.demandsAtPlace(store, place, "base") || [];
    var unmet = demands.some(function (row) { return row.report && row.report.need > 0; });
    var q = query && String(query).trim();
    var hasQuery = false;
    if (q && api.markerState) {
      var mark = api.markerState(store, place, q, index);
      hasQuery = !!(mark && mark.hasQueryMatch);
    }
    if (!(stacks > 0 || miningCount > 0 || cropCount > 0)) {
      empty.loaded = true;
      empty.hasQuery = hasQuery;
      empty.unmet = unmet;
      return empty;
    }
    return {
      loaded: true,
      message: "",
      stacks: stacks,
      units: units,
      topItems: ranked.slice(0, 3),
      moreItems: Math.max(0, ranked.length - 3),
      mining: mining,
      crops: crops,
      miningCount: miningCount,
      miningRate: miningRate,
      cropCount: cropCount,
      unmet: unmet,
      hasQuery: hasQuery
    };
  }

  function inventoryChipText(summary) {
    if (!summary || !summary.stacks) return "";
    var parts = [formatQty(summary.stacks) + (summary.stacks === 1 ? " stack" : " stacks")];
    (summary.topItems || []).forEach(function (item) {
      parts.push((item.label || item.id) + " " + formatQty(item.qty));
    });
    if (summary.moreItems > 0) parts.push("+" + summary.moreItems + " more");
    return parts.join(" · ");
  }

  function aggregatePlaces(places, store, api, index) {
    var itemMap = Object.create(null);
    var itemOrder = [];
    var mineMap = Object.create(null);
    var mineOrder = [];
    var cropMap = Object.create(null);
    var cropOrder = [];
    var shortfalls = [];
    var count = 0;
    (places || []).forEach(function (place) {
      if (!place) return;
      count += 1;
      var name = place.name || place.glyphs || "Place";
      if (!api || !store) return;
      (api.locationsAtPlace(store, place, "base") || []).forEach(function (loc) {
        (loc.items || []).forEach(function (item) {
          var key = item.id;
          if (!itemMap[key]) {
            var meta = api.itemMeta ? api.itemMeta(item, index) : { label: api.itemLabel(item, index), title: "", category: "" };
            itemMap[key] = { id: key, label: meta.label, title: meta.title || "", category: meta.category || "", total: 0, places: [] };
            itemOrder.push(key);
          }
          itemMap[key].total += item.qty || 0;
          var slot = null;
          itemMap[key].places.forEach(function (entry) { if (entry.name === name) slot = entry; });
          if (!slot) itemMap[key].places.push({ name: name, qty: item.qty || 0 });
          else slot.qty += item.qty || 0;
        });
      });
      miningRowsFor(api.sitesAtPlace(store, place, "base") || [], api, index).forEach(function (row) {
        if (!mineMap[row.key]) {
          mineMap[row.key] = {
            key: row.key,
            label: row.label,
            count: 0,
            rate: 0,
            approximate: false,
            unset: row.unset,
            kind: row.kind,
            places: []
          };
          mineOrder.push(row.key);
        }
        var dest = mineMap[row.key];
        dest.count += row.count;
        dest.rate += row.rate || 0;
        if (row.rate > 0) dest.approximate = true;
        dest.places.push({ name: name, count: row.count, rate: row.rate || 0 });
      });
      cropRowsFor(api.sitesAtPlace(store, place, "base") || [], api, index).forEach(function (row) {
        if (!cropMap[row.label]) {
          cropMap[row.label] = { label: row.label, title: row.title || "", count: 0, places: [] };
          cropOrder.push(row.label);
        }
        cropMap[row.label].count += row.count;
        cropMap[row.label].places.push({ name: name, count: row.count });
      });
      (api.demandsAtPlace(store, place, "base") || []).forEach(function (row) {
        if (!row.report || !(row.report.shortfall > 0)) return;
        var itemId = row.demand && row.demand.itemId;
        var label = api.itemLabel({ id: itemId, rawId: itemId }, index);
        shortfalls.push({
          place: name,
          project: row.project && row.project.name || "",
          item: label,
          itemId: itemId,
          need: row.demand.qty,
          atTarget: row.report.atTarget,
          elsewhere: row.report.elsewhere,
          shortfall: row.report.shortfall
        });
      });
    });
    var inventory = itemOrder.map(function (key) { return itemMap[key]; });
    inventory.sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });
    return {
      count: count,
      inventory: inventory,
      mining: mineOrder.map(function (key) { return mineMap[key]; }),
      crops: cropOrder.map(function (key) { return cropMap[key]; }),
      shortfalls: shortfalls
    };
  }

  function orderBases(bases, summaries, sort, filter) {
    var list = (bases || []).filter(function (base) {
      var summary = summaries && summaries[base.id];
      if (filter === "mining") return !!(summary && summary.miningCount > 0);
      if (filter === "farming") return !!(summary && summary.cropCount > 0);
      if (filter === "item") return !!(summary && summary.hasQuery);
      return true;
    });
    return list.slice().sort(function (a, b) {
      var sa = (summaries && summaries[a.id]) || {};
      var sb = (summaries && summaries[b.id]) || {};
      if (sort === "inventory" && (sb.units || 0) !== (sa.units || 0)) return (sb.units || 0) - (sa.units || 0);
      if (sort === "mining") {
        if ((sb.miningRate || 0) !== (sa.miningRate || 0)) return (sb.miningRate || 0) - (sa.miningRate || 0);
        if ((sb.miningCount || 0) !== (sa.miningCount || 0)) return (sb.miningCount || 0) - (sa.miningCount || 0);
      }
      if (sort === "crops" && (sb.cropCount || 0) !== (sa.cropCount || 0)) return (sb.cropCount || 0) - (sa.cropCount || 0);
      var an = String(a.name || "").toLowerCase();
      var bn = String(b.name || "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  var SELECTED_ON_TOP_KEY = "nms-map-selected-on-top";

  function readSelectedOnTop(storage) {
    if (!storage || typeof storage.getItem !== "function") return false;
    try { return storage.getItem(SELECTED_ON_TOP_KEY) === "1"; }
    catch (err) { return false; }
  }

  function writeSelectedOnTop(storage, on) {
    if (!storage || typeof storage.setItem !== "function") return;
    try { storage.setItem(SELECTED_ON_TOP_KEY, on ? "1" : "0"); }
    catch (err) { /* private mode can refuse the write */ }
  }

  function pinSelectedBases(ordered, selectedIds, enabled) {
    var list = (ordered || []).slice();
    if (!enabled) return { bases: list, splitAfter: 0 };
    var seen = Object.create(null);
    (selectedIds || []).forEach(function (id) {
      if (id != null && id !== "") seen[id] = true;
    });
    var top = [];
    var rest = [];
    list.forEach(function (base) {
      if (base && seen[base.id]) top.push(base);
      else rest.push(base);
    });
    return { bases: top.concat(rest), splitAfter: top.length };
  }

  function commandKeyName(platform) {
    return /Mac|iPhone|iPad|iPod/.test(String(platform || "")) ? "Cmd" : "Ctrl";
  }

  function isTextField(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return !!el.isContentEditable;
  }

  function helpFocusables(dialog) {
    return Array.prototype.filter.call(
      dialog.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"),
      function (el) { return el.tabIndex !== -1; }
    );
  }

  function bindHelpDialogs() {
    if (typeof document === "undefined") return;
    var mod = commandKeyName((navigator && (navigator.platform || navigator.userAgent)) || "");
    var dialogs = document.querySelectorAll(".help-dialog[role='dialog']");
    var bound = [];
    Array.prototype.forEach.call(dialogs, function (dialog) {
      dialog.querySelectorAll("[data-mod]").forEach(function (el) { el.textContent = mod; });
      if (dialog.getAttribute("tabindex") == null) dialog.setAttribute("tabindex", "-1");
      var opener = dialog.id ? document.querySelector('[aria-controls="' + dialog.id + '"]') : null;
      var previously = null;
      var scrollLock = "";
      function open() {
        if (!dialog.hidden) return;
        previously = document.activeElement;
        dialog.hidden = false;
        if (opener) opener.setAttribute("aria-expanded", "true");
        scrollLock = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialog.focus();
      }
      function close() {
        if (dialog.hidden) return;
        dialog.hidden = true;
        if (opener) opener.setAttribute("aria-expanded", "false");
        document.body.style.overflow = scrollLock;
        var back = previously;
        previously = null;
        if (back && typeof back.focus === "function") back.focus();
      }
      if (opener) opener.addEventListener("click", function () { open(); });
      dialog.addEventListener("click", function (ev) {
        if (ev.target === dialog) close();
      });
      var closer = dialog.querySelector("[data-help-close]");
      if (closer) closer.addEventListener("click", function () { close(); });
      bound.push({ dialog: dialog, open: open, close: close });
    });
    if (!bound.length) return;
    document.addEventListener("keydown", function (ev) {
      var current = null;
      bound.forEach(function (row) { if (!row.dialog.hidden) current = row; });
      if (current) {
        if (ev.key === "Escape") {
          ev.preventDefault();
          ev.stopPropagation();
          current.close();
          return;
        }
        if (ev.key !== "Tab") return;
        var list = helpFocusables(current.dialog);
        if (!list.length) {
          ev.preventDefault();
          return;
        }
        var first = list[0];
        var last = list[list.length - 1];
        var active = document.activeElement;
        if (ev.shiftKey) {
          if (active === first || active === current.dialog || !current.dialog.contains(active)) {
            ev.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          ev.preventDefault();
          first.focus();
        }
        return;
      }
      var hotkey = ev.key === "?" || (ev.key === "/" && ev.shiftKey);
      if (!hotkey || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (isTextField(ev.target) || isTextField(document.activeElement)) return;
      var map = document.getElementById("map");
      if (!map || document.activeElement !== map) return;
      var row = null;
      bound.forEach(function (item) {
        if (item.dialog.getAttribute("data-help-hotkey") === "map") row = item;
      });
      if (!row) return;
      ev.preventDefault();
      row.open();
    }, true);
  }

  function mount() {
    var canvas = document.getElementById("map");
    var fileInput = document.getElementById("file");
    var statusEl = document.getElementById("status");
    var galaxySel = document.getElementById("galaxy");
    var filterInput = document.getElementById("filter");
    var baseList = document.getElementById("base-list");
    var freightList = document.getElementById("freighter-list");
    var problemList = document.getElementById("problem-list");
    var problemWrap = document.getElementById("problem-wrap");
    var mBases = document.getElementById("m-bases");
    var mSkip = document.getElementById("m-skip");
    var mGal = document.getElementById("m-gal");
    var mCenter = document.getElementById("m-center");
    var showCenter = document.getElementById("show-center");
    var showHubs = document.getElementById("show-hubs");
    var showRefs = document.getElementById("show-refs");
    var showStock = document.getElementById("show-stock");
    var showProduction = document.getElementById("show-production");
    var showDiscoveries = document.getElementById("show-discoveries");
    var discPlanets = document.getElementById("disc-planets");
    var discSystems = document.getElementById("disc-systems");
    var discFlora = document.getElementById("disc-flora");
    var discFauna = document.getElementById("disc-fauna");
    var discMinerals = document.getElementById("disc-minerals");
    var discoveryList = document.getElementById("discovery-list");
    var discoveryWrap = document.getElementById("discovery-wrap");
    var discMetrics = document.getElementById("disc-metrics");
    var mDsys = document.getElementById("m-dsys");
    var mDplanets = document.getElementById("m-dplanets");
    var mDflora = document.getElementById("m-dflora");
    var mDfauna = document.getElementById("m-dfauna");
    var mDminerals = document.getElementById("m-dminerals");
    var itemFilter = document.getElementById("item-filter");
    var placePanel = document.getElementById("place-panel");
    var placeBody = document.getElementById("place-body");
    var placeTitle = document.getElementById("place-h");
    var drop = document.getElementById("drop");
    if (!canvas) return;

    var hubs = hubMarks();
    var refs = referenceMarks();
    var state = {
      planetary: [],
      freighters: [],
      problems: [],
      galaxy: 0,
      selected: null,
      selection: [],
      anchorId: null,
      listSort: "name",
      listFilter: "all",
      selectedOnTop: readSelectedOnTop(typeof window !== "undefined" ? window.localStorage : null),
      expanded: {},
      selectedRef: null,
      hover: null,
      hoverRef: null,
      filter: "",
      fileName: "",
      source: "",
      selectedFreight: null,
      discoveries: [],
      discoveryProblems: [],
      hoverDiscovery: null
    };
    var listOrder = [];
    var discoveryOrder = [];
    var openDiscoveryId = null;
    var DISCOVERY_KEY = "nms-map-discoveries";
    var freightOrder = [];
    var selectMode = false;
    var selectShape = "box";
    var marquee = null;
    var logisticsStore = null;
    var catalogIndex = null;
    var placeMode = "base";
    var openPlace = null;
    var hits = [];
    var starCache = null;
    var view = { zoom: 1, panX: 0, panY: 0 };
    var lastSize = { w: 640, h: 480 };
    var aim = null;

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg || "";
    }

    function logisticsApi() {
      return typeof NmsLogistics !== "undefined" ? NmsLogistics : null;
    }

    function readLogistics() {
      var api = logisticsApi();
      if (!api) return null;
      try { logisticsStore = api.loadStore(window.localStorage); }
      catch (err) { logisticsStore = null; }
      return logisticsStore;
    }

    function writeLogistics(next) {
      var api = logisticsApi();
      if (!api) return null;
      try { logisticsStore = api.saveStore(window.localStorage, next); }
      catch (err) { logisticsStore = next; }
      return logisticsStore;
    }

    function placeOf(marker) {
      if (!marker) return null;
      return {
        glyphs: marker.glyphs,
        planet: marker.planet,
        galaxy: marker.galaxy,
        name: marker.name || marker.label || "",
        type: marker.type || marker.kind || "",
        coords: marker.coords || "",
        ssi: marker.ssi
      };
    }

    function stockMark(marker) {
      var api = logisticsApi();
      if (!api || !logisticsStore || !marker) return null;
      return api.markerState(logisticsStore, placeOf(marker), itemFilter ? itemFilter.value : "", catalogIndex);
    }

    function formatStockBadge(n) {
      var api = logisticsApi();
      return api ? api.formatBadge(n) : String(n || "");
    }

    function isSelected(id) {
      return state.selection.indexOf(id) !== -1;
    }

    function baseById(id) {
      var found = null;
      state.planetary.forEach(function (b) { if (b.id === id) found = b; });
      return found;
    }

    function freightById(id) {
      var found = null;
      state.freighters.forEach(function (b) { if (b.id === id) found = b; });
      return found;
    }

    function resourceOptions(current) {
      var api = logisticsApi();
      var html = '<option value="">Not in the save</option>';
      if (!api) return html;
      api.RESOURCE_CHOICES.forEach(function (pair) {
        html += '<option value="' + esc(pair[0]) + '"' + (pair[0] === current ? " selected" : "") + ">" + esc(pair[1]) + "</option>";
      });
      if (current && !api.RESOURCE_CHOICES.some(function (pair) { return pair[0] === current; })) {
        html += '<option value="' + esc(current) + '" selected>' + esc(api.itemLabel({ id: current, rawId: current }, catalogIndex)) + "</option>";
      }
      return html;
    }

    function classOptions(current) {
      var html = '<option value="">Class not in the save</option>';
      ["C", "B", "A", "S"].forEach(function (klass) {
        html += '<option value="' + klass + '"' + (klass === current ? " selected" : "") + ">Class " + klass + "</option>";
      });
      return html;
    }

    function containerOptions(current) {
      var choices = [
        ["", "Container not in the save"],
        ["tray", "Hydroponic Tray"],
        ["large-tray", "Large Hydroponic Tray"],
        ["biodome", "Bio-Dome"],
        ["standing", "Standing Planter"],
        ["outdoor", "Outdoor"]
      ];
      return choices.map(function (pair) {
        return '<option value="' + esc(pair[0]) + '"' + (pair[0] === (current || "") ? " selected" : "") + ">" + esc(pair[1]) + "</option>";
      }).join("");
    }

    function productionHtml(api, store, place, catalogIdx, mode) {
      mode = mode === "system" ? "system" : "base";
      var sites = api.sitesAtPlace(store, place, mode);
      var planet = mode === "base" ? api.sitesAtPlace(store, place, "planet") : sites;
      function tally(list, kind) {
        var n = 0;
        list.forEach(function (site) { if (site.kind === kind) n += site.count; });
        return n;
      }
      var html = '<h3 class="place-sub">Mining</h3>';
      var mining = sites.filter(function (site) {
        return site.kind === "mineral" || site.kind === "gas" || site.kind === "amu" || site.kind === "depot" || site.kind === "pipe";
      });
      if (!mining.length) {
        html += '<p class="empty">No extractors, depots, or pipes were in this place’s object list.</p>';
      }
      mining.forEach(function (site) {
        var row = api.describeSite(site, catalogIdx);
        var where = site.geo && site.geo.baseName ? site.geo.baseName + " · " : "";
        html += '<div class="place-prod"><strong>' + esc(where + row.name) + "</strong> · " + esc(site.count);
        if (site.kind === "mineral" || site.kind === "gas" || site.kind === "amu") {
          html += '<div><label>Resource <select data-prod="resourceId" data-id="' + esc(site.id) + '">' + resourceOptions(site.resourceId) + "</select></label>";
          if (site.resourceUser) html += " · user-entered";
          else html += " · not in the save";
          html += "</div>";
        }
        if (site.kind === "mineral" || site.kind === "gas") {
          html += '<div><label>Hotspot <select data-prod="hotspotClass" data-id="' + esc(site.id) + '">' + classOptions(site.hotspotClass) + "</select></label></div>";
        }
        if (row.rate) html += "<div>~" + esc(Math.round(row.rate.perHour)) + "/hr · approximate. " + esc(row.rate.note) + "</div>";
        else if (site.kind === "mineral" || site.kind === "gas") html += "<div>No rate until a hotspot class is set. The save does not include one.</div>";
        else if (site.kind === "amu") html += "<div>No rate until the resource is named. A fueled unit’s maximum is about 250 an hour.</div>";
        if (row.storage) html += "<div>Storage " + (row.storage.approximate ? "~" : "") + esc(row.storage.capacity) + ". " + esc(row.storage.note) + "</div>";
        html += "</div>";
      });
      html += '<h3 class="place-sub">Crops</h3>';
      var crops = sites.filter(function (site) { return site.kind === "crop"; });
      var boxes = sites.filter(function (site) {
        return site.kind === "tray" || site.kind === "large-tray" || site.kind === "biodome" || site.kind === "standing";
      });
      if (!crops.length && !boxes.length) {
        html += '<p class="empty">No planted crops or planters were in this place’s object list.</p>';
      }
      if (boxes.length) {
        html += '<p class="place-meta">' + boxes.map(function (site) {
          var row = api.describeSite(site, catalogIdx);
          return esc(row.name) + " · " + esc(site.count);
        }).join(" · ") + ". The save does not say which crop is in which container.</p>";
      }
      crops.forEach(function (site) {
        var row = api.describeSite(site, catalogIdx);
        var where = site.geo && site.geo.baseName ? site.geo.baseName + " · " : "";
        html += '<div class="place-prod" title="' + esc(row.title || "") + '"><strong>' + esc(where + row.name) + "</strong> · " + esc(site.count);
        if (!site.known) {
          html += '<div><label>Label <input type="text" data-prod="label" data-id="' + esc(site.id) + '" value="' + esc(site.label) + '" placeholder="Crop name"></label></div>';
          html += '<div><label>Harvest <select data-prod="resourceId" data-id="' + esc(site.id) + '">' + resourceOptions(site.resourceId) + "</select></label>";
          html += site.resourceUser ? " · user-entered" : " · not in the save";
          html += "</div>";
        } else {
          html += "<div>" + esc(row.productName || row.product);
          if (row.crop) html += " · " + esc(row.crop.growHours) + " h · " + (row.crop.yield > 1 ? "about " : "") + esc(row.crop.yield) + " each";
          html += "</div>";
        }
        html += '<div><label>Container <select data-prod="container" data-id="' + esc(site.id) + '">' + containerOptions(site.container) + "</select></label>";
        if (site.containerUser) html += " · user-entered";
        html += "</div>";
        if (row.rate && row.rate.perCycle) {
          html += "<div>~" + esc(row.rate.perCycle) + " per harvest" + (row.rate.approximate ? " · approximate" : "") + " · ~" + esc(Math.round(row.rate.perHour)) + "/hr</div>";
        }
        html += "</div>";
      });
      if (planet.length > sites.length) {
        html += '<p class="place-meta">Planet total · ' + tally(planet, "mineral") + " mineral extractors · " +
          tally(planet, "gas") + " gas extractors · " + tally(planet, "crop") + " crops, across every base at this address.</p>";
      } else if (mode === "system") {
        html += '<p class="place-meta">System total · ' + tally(sites, "mineral") + " mineral extractors · " +
          tally(sites, "gas") + " gas extractors · " + tally(sites, "crop") + " crops.</p>";
      }
      return html;
    }

    function placeSectionsHtml(api, store, place, mode) {
      var locs = api.locationsAtPlace(store, place, mode);
      var demands = api.demandsAtPlace(store, place, mode);
      var units = 0;
      var lines = 0;
      locs.forEach(function (loc) {
        (loc.items || []).forEach(function (item) { units += item.qty; lines += 1; });
      });
      var html = '<p class="place-meta">' + locs.length + " location" + (locs.length === 1 ? "" : "s") + " · " + lines + " stacks · " + units + " units</p>";
      if (!locs.length) {
        html += '<p class="empty">No inventory is pinned to this ' + (mode === "system" ? "system" : "place") + '. Carried holds, such as the exosuit, stay off the map until you pin them. Nothing was uploaded.</p>';
      } else {
        html += locs.map(function (loc) {
          var rows = (loc.items || []).map(function (item) {
            var meta = api.itemMeta ? api.itemMeta(item, catalogIndex) : { label: api.itemLabel(item, catalogIndex), title: "", category: "", known: true, raw: item.rawId || "" };
            var stack = item.maxStack ? (item.stackApproximate ? " ~" : " ") + "max " + item.maxStack : "";
            var extra = meta.category ? " <span class=\"place-meta\">" + esc(meta.category) + "</span>" : "";
            return "<li title=\"" + esc(meta.title || "") + "\"><span>" + esc(meta.label) + extra + "</span><span>" + esc(item.qty) + esc(stack) + "</span></li>";
          }).join("");
          var cap = loc.slotCapacity ? (loc.slotApproximate ? "~" : "") + loc.slotCapacity + " slots" : "capacity not in the save";
          return '<section class="place-loc"><h3>' + esc(loc.name) + '</h3><p class="place-meta">' + esc(api.CATEGORIES[loc.category] || loc.category) + " · " + esc(cap) + "</p>" +
            (loc.note ? '<p class="place-meta">' + esc(loc.note) + "</p>" : "") +
            (rows ? "<ul>" + rows + "</ul>" : '<p class="empty">Empty.</p>') + "</section>";
        }).join("");
      }
      if (demands.length) {
        html += '<h3 class="place-sub">Open demands</h3><ul class="place-demands">';
        demands.forEach(function (row) {
          var label = api.itemLabel({ id: row.demand.itemId, rawId: row.demand.itemId }, catalogIndex);
          var report = row.report;
          html += "<li><strong>" + esc(row.project.name) + "</strong> · " + esc(label) + " · need " + esc(row.demand.qty) +
            " · here " + esc(report.atTarget) + " · elsewhere " + esc(report.elsewhere) +
            " · short " + esc(report.shortfall) + "</li>";
        });
        html += "</ul>";
      } else {
        html += '<p class="place-meta">No open demands for this ' + (mode === "system" ? "system" : "place") + ".</p>";
      }
      html += productionHtml(api, store, place, catalogIndex, mode);
      return html;
    }

    function bindProduction(root) {
      if (!root) return;
      var api = logisticsApi();
      if (!api) return;
      root.querySelectorAll("[data-prod]").forEach(function (el) {
        el.addEventListener("change", function () {
          var patch = {};
          patch[el.getAttribute("data-prod")] = el.value;
          writeLogistics(api.setProduction(readLogistics() || api.emptyStore(), el.getAttribute("data-id"), patch));
          renderSelection();
          renderLists();
          draw();
        });
      });
    }

    function announceSelection() {
      var live = document.getElementById("select-live");
      if (!live) return;
      if (!state.selection.length) live.textContent = "Selection cleared.";
      else if (state.selection.length === 1) {
        var one = baseById(state.selection[0]) || freightById(state.selection[0]) || discoveryById(state.selection[0]);
        live.textContent = "Selected " + (one ? (one.name || one.glyphs || "one place") : "one place") + ".";
      } else live.textContent = state.selection.length + " places selected.";
    }

    function commitSelection(ids, anchor) {
      var next = [];
      var seen = Object.create(null);
      (ids || []).forEach(function (id) {
        if (!id || seen[id]) return;
        if (!baseById(id) && !freightById(id) && !discoveryById(id)) return;
        seen[id] = true;
        next.push(id);
      });
      state.selection = next;
      if (arguments.length > 1) state.anchorId = anchor;
      var only = next.length === 1 ? next[0] : null;
      state.selected = only && baseById(only) ? only : null;
      state.selectedFreight = only && freightById(only) ? only : null;
      if (next.length) state.selectedRef = null;
      announceSelection();
      renderLists();
      renderRefList();
      draw();
      renderSelection();
    }

    function selectedPlaces() {
      var places = [];
      state.selection.forEach(function (id) {
        var row = baseById(id) || freightById(id);
        if (row) places.push(placeOf(row));
      });
      return places;
    }

    function renderAggregate() {
      if (!placePanel || !placeBody) return;
      var parts = splitSelection(state.selection);
      var places = parts.bases.map(placeOf);
      openPlace = null;
      openDiscoveryId = null;
      if (places.length + parts.discs.length < 2) {
        placePanel.hidden = true;
        placeBody.innerHTML = "";
        return;
      }
      placePanel.hidden = false;
      if (placeTitle) placeTitle.textContent = (places.length + parts.discs.length) + " places";
      var api = logisticsApi();
      if (!api) {
        placeBody.innerHTML = '<p class="empty">The logistics planner did not load.</p>';
        return;
      }
      readLogistics();
      var store = logisticsStore || api.emptyStore();
      var agg = aggregatePlaces(places, store, api, catalogIndex);
      var href = "/game/guides/no-mans-sky/logistics/" + api.selectionQuery(places);
      var html = '<p class="place-meta">' + (places.length + parts.discs.length) + " places selected.</p>";
      html += '<p class="place-actions"><a href="' + esc(href) + '">Open these places in the logistics planner</a>';
      html += ' <button type="button" id="place-close">Clear selection</button></p>';
      html += "<h3 class=\"place-sub\">Inventory</h3>";
      if (!agg.inventory.length) {
        html += '<p class="empty">No inventory is pinned to these places.</p>';
      } else {
        html += agg.inventory.map(function (item) {
          var breakdown = (item.places || []).map(function (entry) {
            return "<li><span>" + esc(entry.name) + "</span><span>" + esc(formatQty(entry.qty)) + "</span></li>";
          }).join("");
          var cat = item.category ? " <span class=\"place-meta\">" + esc(item.category) + "</span>" : "";
          return "<details class=\"place-loc\" title=\"" + esc(item.title || "") + "\"><summary><span>" + esc(item.label) + cat + "</span><span>" + esc(formatQty(item.total)) + "</span></summary><ul>" + breakdown + "</ul></details>";
        }).join("");
      }
      html += "<h3 class=\"place-sub\">Mining</h3>";
      if (!agg.mining.length) html += '<p class="empty">No extractors at these places.</p>';
      else {
        html += agg.mining.map(function (row) {
          var breakdown = (row.places || []).map(function (entry) {
            var rate = entry.rate > 0 ? " · ~" + formatQty(entry.rate) + "/h" : "";
            return "<li><span>" + esc(entry.name) + "</span><span>×" + esc(formatQty(entry.count)) + esc(rate) + "</span></li>";
          }).join("");
          return "<details class=\"place-loc\"><summary><span>" + esc(miningChipText(row)) + "</span></summary><ul>" + breakdown + "</ul></details>";
        }).join("");
      }
      html += "<h3 class=\"place-sub\">Crops</h3>";
      if (!agg.crops.length) html += '<p class="empty">No crops at these places.</p>';
      else {
        html += agg.crops.map(function (row) {
          var breakdown = (row.places || []).map(function (entry) {
            return "<li><span>" + esc(entry.name) + "</span><span>×" + esc(formatQty(entry.count)) + "</span></li>";
          }).join("");
          return "<details class=\"place-loc\" title=\"" + esc(row.title || "") + "\"><summary><span>" + esc(cropChipText(row)) + "</span></summary><ul>" + breakdown + "</ul></details>";
        }).join("");
      }
      html += "<h3 class=\"place-sub\">Open shortfalls</h3>";
      if (!agg.shortfalls.length) html += '<p class="place-meta">No open shortfalls at these places.</p>';
      else {
        html += '<ul class="place-demands">';
        agg.shortfalls.forEach(function (row) {
          html += "<li><strong>" + esc(row.project) + "</strong> · " + esc(row.place) + " · " + esc(row.item) +
            " · need " + esc(row.need) + " · here " + esc(row.atTarget) + " · elsewhere " + esc(row.elsewhere) +
            " · short " + esc(row.shortfall) + "</li>";
        });
        html += "</ul>";
      }
      html += discoveryBlockHtml(parts.discs);
      placeBody.innerHTML = html;
      var closeBtn = document.getElementById("place-close");
      if (closeBtn) closeBtn.addEventListener("click", function () { commitSelection([]); });
    }

    function renderPlacePanel(place, heading) {
      if (!placePanel || !placeBody) return;
      openPlace = place;
      if (place) openDiscoveryId = null;
      if (!place) {
        openDiscoveryId = null;
        placePanel.hidden = true;
        placeBody.innerHTML = "";
        return;
      }
      placePanel.hidden = false;
      if (placeTitle) placeTitle.textContent = heading || place.name || "This place";
      var api = logisticsApi();
      if (!api) {
        placeBody.innerHTML = '<p class="empty">The logistics planner did not load.</p>';
        return;
      }
      readLogistics();
      var store = logisticsStore || api.emptyStore();
      var href = "/game/guides/no-mans-sky/logistics/" + api.placeQuery({
        glyphs: place.glyphs,
        planet: place.planet,
        galaxy: place.galaxy,
        name: place.name
      });
      var html = '<p class="place-meta">' + esc(place.glyphs || "No portal address") +
        (place.coords ? " · " + esc(place.coords) : "") +
        (place.planet != null ? " · planet " + esc(place.planet) : "") +
        " · " + (placeMode === "system" ? "whole system" : "this place") + "</p>";
      html += '<p class="place-actions"><a href="' + esc(href) + '">Open in the logistics planner</a>';
      if (place.glyphs) {
        html += ' <button type="button" id="place-scope">' + (placeMode === "system" ? "Show this place only" : "Show this system") + "</button>";
      }
      html += ' <button type="button" id="place-close">Close</button></p>';
      html += placeSectionsHtml(api, store, place, placeMode);
      placeBody.innerHTML = html;
      var scopeBtn = document.getElementById("place-scope");
      if (scopeBtn) scopeBtn.addEventListener("click", function () {
        placeMode = placeMode === "system" ? "base" : "system";
        renderPlacePanel(openPlace, placeTitle ? placeTitle.textContent : "");
      });
      bindProduction(placeBody);
      var closeBtn = document.getElementById("place-close");
      if (closeBtn) closeBtn.addEventListener("click", function () {
        state.selectedRef = null;
        commitSelection([]);
      });
    }

    function ownerSuffix(owner, ownerId) {
      var name = owner ? String(owner) : "";
      var id = ownerId && String(ownerId) !== "0" ? String(ownerId) : "";
      var who = name && id ? name + " · " + id : (name || id);
      return who ? " · " + esc(who) : "";
    }

    function discoveryById(id) {
      var found = null;
      state.discoveries.forEach(function (sys) { if (sys.id === id) found = sys; });
      return found;
    }

    function discFilters() {
      return {
        planets: !discPlanets || discPlanets.checked,
        systems: !discSystems || discSystems.checked,
        flora: !!(discFlora && discFlora.checked),
        fauna: !!(discFauna && discFauna.checked),
        minerals: !!(discMinerals && discMinerals.checked)
      };
    }

    function filteredDiscoveries() {
      if (!DiscoveryLib) return [];
      return DiscoveryLib.filterDiscoverySystems(state.discoveries, {
        galaxy: state.galaxy,
        query: state.filter,
        filters: discFilters()
      });
    }

    function visibleDiscoveries() {
      if (showDiscoveries && !showDiscoveries.checked) return [];
      return filteredDiscoveries();
    }

    function splitSelection(ids) {
      var bases = [];
      var discs = [];
      (ids || []).forEach(function (id) {
        var disc = discoveryById(id);
        if (disc) discs.push(disc);
        else {
          var row = baseById(id) || freightById(id);
          if (row) bases.push(row);
        }
      });
      return { bases: bases, discs: discs };
    }

    function saveDiscoveryCache() {
      try {
        if (!state.discoveries.length) {
          localStorage.removeItem(DISCOVERY_KEY);
          return;
        }
        localStorage.setItem(DISCOVERY_KEY, JSON.stringify({
          v: 1,
          fileName: state.fileName || "",
          systems: state.discoveries
        }));
      } catch (err) { /* private mode */ }
    }

    function loadDiscoveryCache() {
      try {
        var raw = localStorage.getItem(DISCOVERY_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (!data || data.v !== 1 || !Array.isArray(data.systems)) return;
        state.discoveries = data.systems;
        if (!state.fileName && data.fileName) {
          state.fileName = data.fileName;
          state.source = state.source || "browser";
        }
      } catch (err) { /* ignore a bad cache */ }
    }

    function discoveryLink(systems) {
      var list = systems || [];
      if (!list.length) return "";
      var params = new URLSearchParams();
      if (list.length === 1) params.set("place", list[0].glyphs);
      else params.set("places", list.map(function (sys) { return sys.glyphs; }).join(","));
      params.set("layer", "discovery");
      if (list[0].galaxy != null) params.set("galaxy", String(list[0].galaxy));
      return "?" + params.toString();
    }

    function discoveryBlockHtml(systems) {
      if (!DiscoveryLib || !systems || !systems.length) return "";
      var totals = DiscoveryLib.discoveryTotals(systems);
      var html = "<h3 class=\"place-sub\">Discoveries</h3>";
      html += '<p class="place-meta">' + totals.systems + " system" + (totals.systems === 1 ? "" : "s") +
        " · " + totals.planets + " planet" + (totals.planets === 1 ? "" : "s") +
        " · " + totals.flora + " flora · " + totals.fauna + " fauna · " + totals.minerals + " mineral" +
        (totals.minerals === 1 ? "" : "s") + "</p>";
      html += '<ul class="place-demands">';
      systems.forEach(function (sys) {
        var title = sys.systemName || "System";
        html += "<li><span>" + esc(title) + " · " + esc(sys.glyphs) + "</span><span>" +
          esc(sys.planetCount) + " planets</span></li>";
      });
      html += "</ul>";
      return html;
    }

    function renderDiscoveryPanel(sys) {
      if (!placePanel || !placeBody || !sys) return;
      openPlace = null;
      openDiscoveryId = sys.id;
      placePanel.hidden = false;
      var title = sys.systemName || "Discovered system";
      if (placeTitle) placeTitle.textContent = title;
      var html = '<p class="place-meta">' + esc(sys.glyphs) + " · " + esc(sys.coords) +
        " · " + esc(galaxyLabel(sys.galaxy)) + " · " + esc(formatLy(sys.lyCenter)) + " from center</p>";
      html += '<p class="place-actions"><a href="' + esc(discoveryLink([sys])) + '">Show on map</a>';
      html += ' <button type="button" id="place-close">Close</button></p>';
      if (sys.systemName) html += '<p class="place-meta">Custom name · ' + esc(sys.systemName) + "</p>";
      html += '<p class="place-meta">System record · ' + (sys.hasSystem ? DiscoveryLib.uploadLabel(sys.systemUploaded, sys.systemTimestamp) : "No solar-system record") +
        ownerSuffix(sys.systemOwner, sys.systemOwnerId) + "</p>";
      var totals = DiscoveryLib.discoveryTotals([sys]);
      html += '<p class="place-meta">' + totals.planets + " planet" + (totals.planets === 1 ? "" : "s") +
        " · " + totals.flora + " flora · " + totals.fauna + " fauna · " + totals.minerals + " mineral" +
        (totals.minerals === 1 ? "" : "s") +
        (totals.sectors ? " · " + totals.sectors + " sector" + (totals.sectors === 1 ? "" : "s") : "") + "</p>";
      html += "<h3 class=\"place-sub\">Planets</h3>";
      if (!sys.planetList || !sys.planetList.length) {
        html += '<p class="empty">No planet, flora, fauna, or mineral records share this system address.</p>';
      } else {
        html += '<ul class="place-demands">';
        sys.planetList.forEach(function (planet) {
          var name = planet.name || ("Planet " + planet.index);
          var bits = "index " + planet.index;
          if (!planet.hasPlanetRecord) bits += " · no planet record";
          if (planet.biome) bits += " · " + planet.biome + (planet.infested ? ", infested" : "");
          bits += " · " + planet.flora + " flora · " + planet.fauna + " fauna · " + planet.minerals + " minerals";
          if (planet.named && planet.named.length) bits += " · " + planet.named.join(", ");
          if (planet.hidden) bits += " · hidden";
          html += "<li><span><strong>" + esc(name) + "</strong><br><span class=\"place-meta\">" + esc(planet.glyphs) +
            " · " + esc(bits) + "<br>" + esc(DiscoveryLib.uploadLabel(planet.uploaded, planet.timestamp)) +
            ownerSuffix(planet.owner, planet.ownerId) + "</span></span></li>";
        });
        html += "</ul>";
      }
      html += '<p class="place-meta">Procedural names are not stored in the save. A name here is one you typed in game.</p>';
      placeBody.innerHTML = html;
      var closeBtn = document.getElementById("place-close");
      if (closeBtn) closeBtn.addEventListener("click", function () { commitSelection([]); });
      revealDetail(sys.id);
    }

    function revealDetail(key) {
      if (!placePanel || placePanel.hidden) return;
      if (key != null && revealDetail.last === key) return;
      revealDetail.last = key == null ? null : key;
      if (placeTitle) {
        try { placeTitle.focus({ preventScroll: true }); }
        catch (err) { placeTitle.focus(); }
      }
      placePanel.scrollIntoView({ block: "start", inline: "nearest" });
    }

    function renderDiscoveryAggregate(systems) {
      if (!placePanel || !placeBody) return;
      openPlace = null;
      openDiscoveryId = null;
      placePanel.hidden = false;
      if (placeTitle) placeTitle.textContent = systems.length + " systems";
      var totals = DiscoveryLib.discoveryTotals(systems);
      var html = '<p class="place-meta">' + totals.systems + " systems · " + totals.planets + " planets · " +
        totals.flora + " flora · " + totals.fauna + " fauna · " + totals.minerals + " minerals</p>";
      html += '<p class="place-actions"><a href="' + esc(discoveryLink(systems)) + '">Show on map</a>';
      html += ' <button type="button" id="place-close">Clear selection</button></p>';
      html += '<ul class="place-demands">';
      systems.forEach(function (sys) {
        html += "<li><span>" + esc(sys.systemName || sys.glyphs) + " · " + esc(sys.glyphs) + "</span><span>" +
          esc(sys.planetCount) + " planets · " + esc(sys.flora) + " flora</span></li>";
      });
      html += "</ul>";
      placeBody.innerHTML = html;
      var closeBtn = document.getElementById("place-close");
      if (closeBtn) closeBtn.addEventListener("click", function () { commitSelection([]); });
      revealDetail("agg:" + systems.map(function (sys) { return sys.id; }).join(","));
    }

    function renderSelection() {
      var parts = splitSelection(state.selection);
      if (!state.selection.length) {
        openDiscoveryId = null;
        revealDetail.last = null;
        renderPlacePanel(null);
        return;
      }
      if (!parts.bases.length && parts.discs.length === 1) {
        renderDiscoveryPanel(parts.discs[0]);
        return;
      }
      if (!parts.bases.length && parts.discs.length > 1) {
        renderDiscoveryAggregate(parts.discs);
        return;
      }
      if (parts.bases.length === 1 && !parts.discs.length) {
        openDiscoveryId = null;
        var one = parts.bases[0];
        placeMode = "base";
        renderPlacePanel(placeOf(one), one.name || "");
        revealDetail("base:" + one.id);
        return;
      }
      renderAggregate();
      revealDetail("mix:" + state.selection.join(","));
    }

    function colors() {
      var cs = getComputedStyle(document.documentElement);
      function pick(name, fb) {
        var v = (cs.getPropertyValue(name) || "").trim();
        return v || fb;
      }
      return {
        base: pick("--base-2", "#0C021A"),
        ink: pick("--ink", "#F8ECFF"),
        soft: pick("--ink-soft", "#B89BC8"),
        faint: pick("--ink-faint", "#6E5088"),
        accent: pick("--accent", "#FF2DC8"),
        accent2: pick("--accent-2", "#00F0FF")
      };
    }

    function withAlpha(hex, a) {
      var h = String(hex || "").trim();
      var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h);
      if (!m) return hex;
      var raw = m[1];
      if (raw.length === 3) raw = raw.split("").map(function (c) { return c + c; }).join("");
      var r = parseInt(raw.slice(0, 2), 16);
      var g = parseInt(raw.slice(2, 4), 16);
      var b = parseInt(raw.slice(4, 6), 16);
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    function mulberry32(seed) {
      var a = seed >>> 0;
      return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function canvasSize() {
      var rect = canvas.getBoundingClientRect();
      return {
        w: Math.max(280, Math.round(rect.width || canvas.clientWidth || 640)),
        h: Math.max(260, Math.round(rect.height || 480))
      };
    }

    function project(vx, vz, w, h) {
      var frame = frameOf(w, h);
      var R = 2048;
      return {
        x: frame.cx + view.panX + (vx / R) * frame.rx * view.zoom,
        y: frame.cy + view.panY - (vz / R) * frame.ry * view.zoom,
        cx: frame.cx,
        cy: frame.cy,
        rx: frame.rx,
        ry: frame.ry
      };
    }

    function clampPan() {
      var frame = frameOf(lastSize.w, lastSize.h);
      var maxX = frame.rx * view.zoom + lastSize.w * 0.35;
      var maxY = frame.ry * view.zoom + lastSize.h * 0.35;
      view.panX = Math.max(-maxX, Math.min(maxX, view.panX));
      view.panY = Math.max(-maxY, Math.min(maxY, view.panY));
    }

    function zoomBy(factor, sx, sy) {
      var size = lastSize.w ? lastSize : canvasSize();
      var next = zoomAbout(view, sx, sy, size.w / 2, size.h / 2, factor);
      view.zoom = next.zoom;
      view.panX = next.panX;
      view.panY = next.panY;
      clampPan();
      syncAim();
    }

    function applyFit(points, opts) {
      var size = canvasSize();
      lastSize = size;
      var next = fitView(points, frameOf(size.w, size.h), size, opts);
      view.zoom = next.zoom;
      view.panX = next.panX;
      view.panY = next.panY;
      clampPan();
    }

    function resetView() {
      aim = null;
      var pts = [];
      visibleBases().forEach(function (b) { pts.push({ x: b.voxelX, z: b.voxelZ }); });
      visibleDiscoveries().forEach(function (sys) { pts.push({ x: sys.voxelX, z: sys.voxelZ }); });
      if (!pts.length) {
        view.zoom = 1;
        view.panX = 0;
        view.panY = 0;
        return;
      }
      if (state.galaxy === 0 && (!showHubs || showHubs.checked)) {
        hubs.forEach(function (h) { pts.push({ x: h.voxelX, z: h.voxelZ }); });
      }
      applyFit(pts, { padVoxels: 160, minZoom: 0.8, maxZoom: 14 });
    }

    function focusCluster(id) {
      var b = null;
      state.planetary.forEach(function (item) { if (item.id === id) b = item; });
      if (!b) return;
      state.selected = id;
      aim = null;
      var bases = visibleBases();
      var group = [];
      var mates = [];
      bases.forEach(function (other) {
        if (other.voxelX === b.voxelX && other.voxelZ === b.voxelZ) group.push(other);
        var dx = other.voxelX - b.voxelX;
        var dz = other.voxelZ - b.voxelZ;
        if (dx * dx + dz * dz <= 80 * 80) mates.push(other);
      });
      if (!group.length) group = [b];
      var idx = group.indexOf(b);
      if (idx < 0) idx = 0;
      var size = canvasSize();
      lastSize = size;
      var spreadOut = mates.some(function (m) {
        return m.voxelX !== b.voxelX || m.voxelZ !== b.voxelZ;
      });
      if (spreadOut) {
        applyFit(mates, { padVoxels: 70, minZoom: 4, maxZoom: 18 });
      } else if (group.length > 1) {
        view.zoom = clumpZoomForGap(80);
      } else {
        applyFit([b], { padVoxels: 70, minZoom: 4, maxZoom: 18 });
      }
      if (group.length > 1 && clumpOffset(idx, group.length, view.zoom).chord < LABEL_CHORD) {
        view.zoom = clumpZoomForGap(80);
      }
      var framed = frameOf(lastSize.w, lastSize.h);
      var pan = panToMarker(b.voxelX, b.voxelZ, idx, group.length, view.zoom, framed, lastSize.w / 2, lastSize.h / 2);
      view.panX = pan.panX;
      view.panY = pan.panY;
      clampPan();
    }

    function focusDiscovery(id) {
      var sys = discoveryById(id);
      if (!sys) return;
      var size = canvasSize();
      lastSize = size;
      applyFit([{ x: sys.voxelX, z: sys.voxelZ }], { padVoxels: 40, minZoom: 8, maxZoom: 22 });
      var framed = frameOf(lastSize.w, lastSize.h);
      var pan = panToMarker(sys.voxelX, sys.voxelZ, 0, 1, view.zoom, framed, lastSize.w / 2, lastSize.h / 2);
      view.panX = pan.panX;
      view.panY = pan.panY;
      clampPan();
    }

    function ensureStars(w, h, c) {
      var key = w + "x" + h + "|" + c.accent + "|" + c.faint + "|" + c.base;
      if (starCache && starCache.key === key) return starCache.canvas;
      var off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      var ctx = off.getContext("2d");
      var frame = frameOf(w, h);
      ctx.fillStyle = c.base;
      ctx.fillRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(frame.cx, frame.cy, frame.ry * 0.08, frame.cx, frame.cy, Math.max(frame.rx, frame.ry));
      glow.addColorStop(0, withAlpha(c.accent, 0.16));
      glow.addColorStop(0.45, withAlpha(c.accent2, 0.05));
      glow.addColorStop(1, withAlpha(c.base, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(frame.cx, frame.cy, frame.rx, frame.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(frame.cx, frame.cy, frame.rx, frame.ry, 0, 0, Math.PI * 2);
      ctx.clip();
      var rng = mulberry32(0x4E4D5301);
      var i;
      for (i = 0; i < 1400; i++) {
        var ang = rng() * Math.PI * 2;
        var rad = Math.pow(rng(), 0.55);
        var arm = 0.42 + 0.58 * Math.pow(Math.abs(Math.sin(ang * 2 + rad * 5.5)), 0.65);
        if (rng() > arm) continue;
        var x = frame.cx + Math.cos(ang) * frame.rx * rad;
        var y = frame.cy + Math.sin(ang) * frame.ry * rad;
        var bright = rng();
        ctx.fillStyle = bright > 0.92 ? withAlpha(c.ink, 0.85) : withAlpha(c.soft, 0.25 + (1 - rad) * 0.45);
        ctx.beginPath();
        ctx.arc(x, y, bright > 0.96 ? 1.7 : 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = withAlpha(c.faint, 0.85);
      ctx.lineWidth = 1;
      for (i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.ellipse(frame.cx, frame.cy, frame.rx * (i / 5), frame.ry * (i / 5), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = withAlpha(c.faint, 0.45);
      ctx.beginPath();
      ctx.moveTo(frame.cx - frame.rx, frame.cy);
      ctx.lineTo(frame.cx + frame.rx, frame.cy);
      ctx.moveTo(frame.cx, frame.cy - frame.ry);
      ctx.lineTo(frame.cx, frame.cy + frame.ry);
      ctx.stroke();
      starCache = { key: key, canvas: off };
      return off;
    }

    function paintStar(ctx, x, y, r, fill, stroke) {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      var i;
      for (i = 0; i < 8; i++) {
        var rad = i % 2 === 0 ? r : r * 0.38;
        var ang = -Math.PI / 2 + (i * Math.PI / 4);
        var px = Math.cos(ang) * rad;
        var py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.restore();
    }

    var labelSlots = [];

    function labelFont(ctx) {
      ctx.font = "11px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.textBaseline = "middle";
    }

    function labelRect(ctx, text, x, y, align) {
      labelFont(ctx);
      var tw = ctx.measureText(String(text || "")).width;
      var left = align === "right" ? x - tw : (align === "center" ? x - tw / 2 : x);
      return { l: left - 4, t: y - 10, r: left + tw + 6, b: y + 10, w: tw };
    }

    function labelBlocked(rect) {
      for (var i = 0; i < labelSlots.length; i++) {
        var slot = labelSlots[i];
        if (rect.l < slot.r && rect.r > slot.l && rect.t < slot.b && rect.b > slot.t) return true;
      }
      return false;
    }

    function paintLabel(ctx, text, x, y, color, base) {
      var rect = labelRect(ctx, text, x, y, "left");
      labelSlots.push(rect);
      ctx.textAlign = "left";
      ctx.fillStyle = withAlpha(base, 0.88);
      ctx.fillRect(x - 3, y - 8, rect.w + 8, 16);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    }

    function paintLabelClear(ctx, text, x, y, color, base) {
      var spots = [
        { x: x, y: y },
        { x: x, y: y - 18 },
        { x: x, y: y + 18 },
        { x: x - 12, y: y - 16 }
      ];
      var i;
      for (i = 0; i < spots.length; i++) {
        var rect = labelRect(ctx, text, spots[i].x, spots[i].y, "left");
        if (labelBlocked(rect)) continue;
        labelSlots.push(rect);
        ctx.textAlign = "left";
        ctx.fillStyle = withAlpha(base, 0.88);
        ctx.fillRect(spots[i].x - 3, spots[i].y - 8, rect.w + 8, 16);
        ctx.fillStyle = color;
        ctx.fillText(text, spots[i].x, spots[i].y);
        return true;
      }
      return false;
    }

    function paintName(ctx, text, x, y, off, color, base) {
      var name = String(text || "");
      if (name.length > 28) name = name.slice(0, 27) + "…";
      labelFont(ctx);
      var tw = ctx.measureText(name).width;
      var r = off && off.radius > 1 ? off.radius : 0;
      var ux = r ? off.x / r : 1;
      var uy = r ? off.y / r : -1;
      var lx = x + ux * 14;
      var ly = y + uy * 14;
      if (ux < -0.15) ctx.textAlign = "right";
      else if (Math.abs(ux) <= 0.15) {
        ctx.textAlign = "center";
        lx = x;
        ly = y + (uy < 0 ? -16 : 16);
      } else ctx.textAlign = "left";
      var left = ctx.textAlign === "right" ? lx - tw : (ctx.textAlign === "center" ? lx - tw / 2 : lx);
      ctx.fillStyle = withAlpha(base, 0.88);
      ctx.fillRect(left - 3, ly - 8, tw + 8, 16);
      ctx.fillStyle = color;
      ctx.fillText(name, lx, ly);
      var align = ctx.textAlign;
      labelSlots.push(labelRect(ctx, name, lx, ly, align));
      ctx.textAlign = "left";
    }

    function paintBadge(ctx, count, x, y, fill, ink) {
      var text = String(count);
      ctx.save();
      ctx.font = "10px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var rad = text.length > 2 ? 11 : 9;
      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.arc(x + 10, y - 10, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = ink;
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.fillText(text, x + 10, y - 10);
      ctx.restore();
    }

    function markerInView(x, y, w, h) {
      return x >= -8 && y >= -8 && x <= w + 8 && y <= h + 8;
    }

    function knownGalaxy(b) {
      return b.galaxy != null && isFinite(b.galaxy);
    }

    function anyKnownGalaxy() {
      var all = state.planetary.concat(state.freighters);
      for (var i = 0; i < all.length; i++) if (knownGalaxy(all[i])) return true;
      return false;
    }

    function galaxyKey(b) {
      if (knownGalaxy(b)) return b.galaxy;
      return anyKnownGalaxy() ? -1 : 0;
    }

    function visibleBases() {
      var q = state.filter.trim().toLowerCase();
      return state.planetary.filter(function (b) {
        if (galaxyKey(b) !== state.galaxy) return false;
        if (!q) return true;
        return (b.name + " " + b.type + " " + b.glyphs + " " + b.coords).toLowerCase().indexOf(q) !== -1;
      });
    }

    function discoveryRingRadius(zoom, clustered) {
      if (clustered) return zoom < 2 ? 14 : 16;
      if (zoom < 1.6) return 9;
      if (zoom < 4) return 11;
      return 12;
    }

    function paintDiscoveryRing(ctx, x, y, radius, c, on) {
      ctx.beginPath();
      ctx.lineWidth = on ? 2.75 : 2.25;
      ctx.strokeStyle = on ? c.accent : c.ink;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      if (!on) return;
      var s = radius + 5;
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = c.accent;
      ctx.moveTo(x - s, y - s + 4);
      ctx.lineTo(x - s, y - s);
      ctx.lineTo(x - s + 4, y - s);
      ctx.moveTo(x + s, y - s + 4);
      ctx.lineTo(x + s, y - s);
      ctx.lineTo(x + s - 4, y - s);
      ctx.moveTo(x - s, y + s - 4);
      ctx.lineTo(x - s, y + s);
      ctx.lineTo(x - s + 4, y + s);
      ctx.moveTo(x + s, y + s - 4);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x + s - 4, y + s);
      ctx.stroke();
    }

    function paintDiscoveries(ctx, c, w, h) {
      if (!DiscoveryLib) return;
      var systems = visibleDiscoveries();
      var cell = DiscoveryLib.discoveryCellSize(view.zoom);
      var projected = [];
      systems.forEach(function (sys) {
        var p = project(sys.voxelX, sys.voxelZ, w, h);
        if (p.x < -96 || p.y < -96 || p.x > w + 96 || p.y > h + 96) return;
        projected.push({ sys: sys, x: p.x, y: p.y, id: sys.id });
      });
      var nodes = DiscoveryLib.clusterScreenMarkers(projected, cell);
      var labels = [];
      var hitStart = hits.length;
      nodes.forEach(function (node) {
        if (node.clustered) {
          node.items.forEach(function (marker) {
            hits.push({ x: marker.x, y: marker.y, r: 10, kind: "discovery", id: marker.id });
          });
          var cid = "cluster:" + node.items.map(function (marker) { return marker.id; }).join(",");
          var hot = state.hoverDiscovery === cid || node.items.some(function (marker) { return isSelected(marker.id); });
          var radius = discoveryRingRadius(view.zoom, true);
          paintDiscoveryRing(ctx, node.x, node.y, radius, c, hot);
          paintBadge(ctx, node.items.length, node.x, node.y, c.ink, c.base);
          hits.push({
            x: node.x,
            y: node.y,
            r: radius + 8,
            kind: "discovery-cluster",
            id: cid,
            members: node.items.map(function (marker) { return marker.sys; })
          });
          if (hot) labels.push({ text: node.items.length + " systems", x: node.x + radius + 8, y: node.y - radius, color: c.ink, priority: true });
          return;
        }
        var marker = node.items[0];
        var sys = marker.sys;
        var on = isSelected(sys.id) || state.hoverDiscovery === sys.id;
        var radius = discoveryRingRadius(view.zoom, false);
        paintDiscoveryRing(ctx, marker.x, marker.y, radius, c, on);
        hits.push({ x: marker.x, y: marker.y, r: radius + 6, kind: "discovery", id: marker.id });
        if (sys.planetCount > 1 && view.zoom >= 6 && markerInView(marker.x, marker.y, w, h)) {
          paintBadge(ctx, sys.planetCount, marker.x + radius - 8, marker.y - radius + 4, c.ink, c.base);
        }
        if (on || view.zoom >= 8) {
          labels.push({
            text: DiscoveryLib.discoveryMarkerLabel(sys),
            x: marker.x + radius + 6,
            y: marker.y,
            color: on ? c.accent : c.ink,
            priority: on
          });
        }
      });
      labels.sort(function (a, b) { return (b.priority ? 1 : 0) - (a.priority ? 1 : 0); });
      labels.forEach(function (job) {
        paintLabelClear(ctx, job.text, job.x, job.y, job.color, c.base);
      });
      if (hitStart < hits.length) {
        var head = hits.splice(hitStart);
        var tail = hits.splice(0, hits.length);
        var hi;
        for (hi = 0; hi < head.length; hi++) hits.push(head[hi]);
        for (hi = 0; hi < tail.length; hi++) hits.push(tail[hi]);
      }
    }

    function draw() {
      var size = canvasSize();
      var w = size.w;
      var h = size.h;
      lastSize = size;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var c = colors();
      var frame = frameOf(w, h);
      ctx.fillStyle = c.base;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(frame.cx + view.panX, frame.cy + view.panY);
      ctx.scale(view.zoom, view.zoom);
      ctx.translate(-frame.cx, -frame.cy);
      ctx.drawImage(ensureStars(w, h, c), 0, 0, w, h);
      ctx.restore();
      hits = [];
      labelSlots = [];

      if (!showCenter || showCenter.checked) {
        var core = project(0, 0, w, h);
        ctx.strokeStyle = c.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(core.x - 6, core.y);
        ctx.lineTo(core.x + 6, core.y);
        ctx.moveTo(core.x, core.y - 6);
        ctx.lineTo(core.x, core.y + 6);
        ctx.stroke();
        paintLabel(ctx, "Galactic center", core.x + 10, core.y - 14, c.ink, c.base);
        hits.push({ x: core.x, y: core.y, r: 8, kind: "center" });
      }

      var showHub = state.galaxy === 0 && (!showHubs || showHubs.checked);
      if (showHub) {
        var clusters = [];
        hubs.forEach(function (hub) {
          var group = null;
          for (var ci = 0; ci < clusters.length; ci++) {
            var anchor = clusters[ci][0];
            var cdx = hub.voxelX - anchor.voxelX;
            var cdz = hub.voxelZ - anchor.voxelZ;
            if (cdx * cdx + cdz * cdz <= 80 * 80) { group = clusters[ci]; break; }
          }
          if (!group) clusters.push([hub]);
          else group.push(hub);
        });
        clusters.forEach(function (group) {
          var n = group.length;
          group.forEach(function (hub, idx) {
            var p = project(hub.voxelX, hub.voxelZ, w, h);
            var y = p.y + (idx - (n - 1) / 2) * 26;
            ctx.save();
            ctx.translate(p.x, y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = c.accent2;
            ctx.fillRect(-5, -5, 10, 10);
            ctx.restore();
            ctx.strokeStyle = withAlpha(c.base, 0.9);
            ctx.strokeRect(p.x - 6, y - 6, 12, 12);
            paintLabel(ctx, hub.label, p.x + 14, y, c.accent2, c.base);
            hits.push({ x: p.x, y: y, ax: p.x, ay: p.y, r: 11, kind: "hub", id: hub.id });
          });
        });
      }

      var refLabels = [];
      var showRef = state.galaxy === 0 && (!showRefs || showRefs.checked);
      if (showRef) {
        refs.forEach(function (ref) {
          var p = project(ref.voxelX, ref.voxelZ, w, h);
          var on = state.selectedRef === ref.id || state.hoverRef === ref.id;
          paintStar(ctx, p.x, p.y, on ? 8 : 5.5, c.ink, withAlpha(c.base, 0.92));
          hits.push({ x: p.x, y: p.y, r: 12, kind: "ref", id: ref.id });
          if (on) refLabels.push({ text: ref.label, x: p.x + 12, y: p.y - 12 });
        });
      }

      var bases = visibleBases();
      var groups = Object.create(null);
      var groupKeys = [];
      bases.forEach(function (b) {
        var key = b.voxelX + ":" + b.voxelZ;
        if (!groups[key]) {
          groups[key] = [];
          groupKeys.push(key);
        }
        groups[key].push(b);
      });
      var nameJobs = [];
      var pickedJobs = [];
      groupKeys.forEach(function (key) {
        var group = groups[key];
        var sample = clumpOffset(0, group.length, view.zoom);
        var stacked = group.length > 1 && sample.stacked;
        var showNames = group.length > 1 && !stacked && sample.chord >= LABEL_CHORD;
        var anchor = project(group[0].voxelX, group[0].voxelZ, w, h);
        var painted = group.map(function (b, i) { return { b: b, i: i }; });
        painted.sort(function (a, b) {
          function rank(item) {
            if (isSelected(item.b.id)) return 2;
            if (state.hover === item.b.id) return 1;
            return 0;
          }
          return rank(a) - rank(b);
        });
        painted.forEach(function (item) {
          var b = item.b;
          var off = clumpOffset(item.i, group.length, view.zoom);
          var x = anchor.x + off.x;
          var y = anchor.y + off.y;
          var on = isSelected(b.id) || state.hover === b.id;
          var picked = isSelected(b.id);
          var query = itemFilter ? String(itemFilter.value || "").trim() : "";
          var shade = !!(showStock && showStock.checked);
          var showProd = !!(showProduction && showProduction.checked);
          var mark = (shade || query || showProd) ? stockMark(b) : null;
          ctx.save();
          if (query && mark && mark.hasQueryMatch === false) ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.fillStyle = c.accent;
          ctx.arc(x, y, on ? 6 : 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = on ? 2 : 1;
          ctx.strokeStyle = on ? c.ink : withAlpha(c.base, 0.85);
          ctx.stroke();
          if (picked) {
            var s = 10;
            ctx.beginPath();
            ctx.lineWidth = 1.75;
            ctx.strokeStyle = c.ink;
            ctx.moveTo(x - s, y - s + 4);
            ctx.lineTo(x - s, y - s);
            ctx.lineTo(x - s + 4, y - s);
            ctx.moveTo(x + s, y - s + 4);
            ctx.lineTo(x + s, y - s);
            ctx.lineTo(x + s - 4, y - s);
            ctx.moveTo(x - s, y + s - 4);
            ctx.lineTo(x - s, y + s);
            ctx.lineTo(x - s + 4, y + s);
            ctx.moveTo(x + s, y + s - 4);
            ctx.lineTo(x + s, y + s);
            ctx.lineTo(x + s - 4, y + s);
            ctx.moveTo(x + 3, y - 12);
            ctx.lineTo(x + 6, y - 8);
            ctx.lineTo(x + 13, y - 16);
            ctx.stroke();
          }
          if (query && mark && mark.hasQueryMatch) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = c.ink;
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (shade && mark && mark.unmet) {
            ctx.beginPath();
            ctx.setLineDash([3, 2]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = c.accent2;
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();
          if (shade && mark && !stacked && markerInView(x, y, w, h)) {
            var badge = query ? formatStockBadge(mark.matchQty || 0) : formatStockBadge(mark.lines);
            if (badge && badge !== "0") paintBadge(ctx, badge, x - 18, y, mark.unmet ? c.accent2 : c.accent, c.base);
          }
          if (query && mark && mark.produces && !(mark.matchQty > 0) && !stacked && markerInView(x, y, w, h)) {
            var grown = formatStockBadge(mark.produceCount || 0);
            if (grown && grown !== "0") paintBadge(ctx, grown, x - 18, y, c.accent2, c.base);
          }
          if (showProd && mark && !query && (mark.mining || mark.farming) && !stacked && markerInView(x, y, w, h)) {
            paintBadge(ctx, (mark.mining ? "M" : "") + (mark.farming ? "F" : ""), x + 8, y, c.accent2, c.base);
          }
          hits.push({ x: x, y: y, r: stacked ? 18 : 14, kind: "base", id: b.id });
          if (markerInView(x, y, w, h) && (on || showNames || (group.length === 1 && view.zoom >= LABEL_ZOOM))) {
            (on ? pickedJobs : nameJobs).push({ text: b.name, x: x, y: y, off: off });
          }
        });
        if (stacked && markerInView(anchor.x, anchor.y, w, h)) {
          paintBadge(ctx, group.length, anchor.x, anchor.y, c.accent, c.base);
          if (showStock && showStock.checked && typeof NmsLogistics !== "undefined") {
            var pileLines = 0;
            var pileMatch = 0;
            var pileUnmet = false;
            var pileQuery = itemFilter ? String(itemFilter.value || "").trim() : "";
            group.forEach(function (member) {
              var pile = stockMark(member);
              if (!pile) return;
              pileLines += pile.lines;
              pileMatch += pile.matchQty || 0;
              if (pile.unmet) pileUnmet = true;
            });
            var pileBadge = pileQuery ? formatStockBadge(pileMatch) : formatStockBadge(pileLines);
            if (pileBadge && pileBadge !== "0") paintBadge(ctx, pileBadge, anchor.x - 22, anchor.y + 8, pileUnmet ? c.accent2 : c.accent, c.base);
            if (showProduction && showProduction.checked && !pileQuery) {
              var pileMine = false;
              var pileFarm = false;
              group.forEach(function (member) {
                var pile = stockMark(member);
                if (!pile) return;
                if (pile.mining) pileMine = true;
                if (pile.farming) pileFarm = true;
              });
              var pileTag = (pileMine ? "M" : "") + (pileFarm ? "F" : "");
              if (pileTag) paintBadge(ctx, pileTag, anchor.x + 16, anchor.y + 8, c.accent2, c.base);
            }
          }
        }
      });
      nameJobs.concat(pickedJobs).forEach(function (job) {
        paintName(ctx, job.text, job.x, job.y, job.off, c.accent, c.base);
      });
      paintDiscoveries(ctx, c, w, h);
      refLabels.forEach(function (job) {
        paintLabel(ctx, job.text, job.x, job.y, c.ink, c.base);
      });
      if (marquee) {
        var mx0 = marquee.x0;
        var my0 = marquee.y0;
        var mx1 = marquee.x1;
        var my1 = marquee.y1;
        ctx.save();
        ctx.strokeStyle = c.ink;
        ctx.fillStyle = withAlpha(c.accent, 0.16);
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        if (marquee.shape === "circle") {
          var radius = Math.hypot(mx1 - mx0, my1 - my0);
          ctx.beginPath();
          ctx.arc(mx0, my0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          var ly = screenRadiusLy(radius, frame, view.zoom);
          if (ly != null && radius > 8) paintLabel(ctx, "~" + formatLy(ly) + " radius", mx1 + 10, my1, c.ink, c.base);
        } else {
          var rx0 = Math.min(mx0, mx1);
          var ry0 = Math.min(my0, my1);
          ctx.fillRect(rx0, ry0, Math.abs(mx1 - mx0), Math.abs(my1 - my0));
          ctx.strokeRect(rx0, ry0, Math.abs(mx1 - mx0), Math.abs(my1 - my0));
        }
        ctx.restore();
      }
    }

    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function hubById(id) {
      for (var i = 0; i < hubs.length; i++) if (hubs[i].id === id) return hubs[i];
      return null;
    }

    function refById(id) {
      for (var i = 0; i < refs.length; i++) if (refs[i].id === id) return refs[i];
      return null;
    }

    function quadrantName(q) {
      return QUADRANT_LABELS[q] || q;
    }

    function nearestHubLy(b) {
      if (b.galaxy != null && b.galaxy !== 0) return "";
      var best = null;
      var bestD = Infinity;
      hubs.forEach(function (h) {
        var d = lyBetween(b, h);
        if (d < bestD) { bestD = d; best = h; }
      });
      if (!best) return "";
      return " · ~" + formatLy(bestD) + " from " + best.label;
    }

    function glanceHtml(summary) {
      if (!summary || summary.message) {
        return '<span class="base-empty">' + esc((summary && summary.message) || "No inventory loaded, import a save") + "</span>";
      }
      var html = '<span class="base-chips">';
      (summary.mining || []).forEach(function (row) {
        html += '<span class="chip"><span class="chip-k">Mining</span> ' + esc(miningChipText(row)) + "</span>";
      });
      (summary.crops || []).forEach(function (row) {
        html += '<span class="chip" title="' + esc(row.title || "") + '"><span class="chip-k">Harvest</span> ' + esc(cropChipText(row)) + "</span>";
      });
      var inv = inventoryChipText(summary);
      if (inv) html += '<span class="chip"><span class="chip-k">Inventory</span> ' + esc(inv) + "</span>";
      else html += '<span class="chip"><span class="chip-k">Inventory</span> No stacks pinned here</span>';
      if (summary.unmet) html += '<span class="chip chip-need">Open demand</span>';
      html += "</span>";
      return html;
    }

    function summariesFor(rows) {
      var map = Object.create(null);
      var api = logisticsApi();
      var store = null;
      if (api) {
        readLogistics();
        store = logisticsStore || api.emptyStore();
      }
      var query = itemFilter ? itemFilter.value : "";
      (rows || []).forEach(function (row) {
        map[row.id] = api
          ? summarizeBase(placeOf(row), store, api, catalogIndex, query)
          : { message: "No inventory loaded, import a save", units: 0, miningCount: 0, miningRate: 0, cropCount: 0, hasQuery: false };
      });
      return map;
    }

    function renderLists() {
      var bases = visibleBases();
      if (mBases) mBases.textContent = String(bases.length);
      if (mSkip) {
        var skipHere = state.freighters.filter(function (b) { return galaxyKey(b) === state.galaxy; }).length;
        mSkip.textContent = String(skipHere);
      }
      var gset = {};
      state.planetary.forEach(function (b) { if (b.galaxy != null) gset[b.galaxy] = 1; });
      state.freighters.forEach(function (b) { if (b.galaxy != null) gset[b.galaxy] = 1; });
      state.discoveries.forEach(function (sys) { if (sys.galaxy != null) gset[sys.galaxy] = 1; });
      var gcount = Object.keys(gset).length;
      if (mGal) mGal.textContent = state.fileName ? String(gcount || 1) : "1";
      var selected = null;
      state.planetary.forEach(function (b) { if (b.id === state.selected) selected = b; });
      if (mCenter) {
        mCenter.textContent = selected ? formatLy(selected.lyCenter).replace(" ly", "") : "—";
      }
      var discShown = filteredDiscoveries();
      var discTotals = DiscoveryLib ? DiscoveryLib.discoveryTotals(discShown) : null;
      if (discMetrics) discMetrics.hidden = !state.discoveries.length;
      if (discTotals) {
        if (mDsys) mDsys.textContent = String(discTotals.systems);
        if (mDplanets) mDplanets.textContent = String(discTotals.planets);
        if (mDflora) mDflora.textContent = String(discTotals.flora);
        if (mDfauna) mDfauna.textContent = String(discTotals.fauna);
        if (mDminerals) mDminerals.textContent = String(discTotals.minerals);
      }
      if (discoveryWrap && discoveryList) {
        discoveryWrap.hidden = !state.discoveries.length;
        var orderedDisc = discShown.slice().sort(function (a, b) {
          if (b.planetCount !== a.planetCount) return b.planetCount - a.planetCount;
          return String(a.glyphs).localeCompare(String(b.glyphs));
        });
        discoveryOrder = orderedDisc.map(function (sys) { return sys.id; });
        var cap = 120;
        var shownDisc = orderedDisc.slice(0, cap);
        if (!state.discoveries.length) {
          discoveryList.innerHTML = "";
        } else if (!orderedDisc.length) {
          discoveryList.innerHTML = '<li class="empty">No discovered systems in this galaxy match the filters.</li>';
        } else {
          discoveryList.innerHTML = shownDisc.map(function (sys) {
            var on = isSelected(sys.id);
            var title = sys.systemName || sys.glyphs;
            return '<li><button type="button" data-discovery="' + esc(sys.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
              '<span class="nm">' + (on ? '<span class="sel-flag">Selected</span>' : "") + esc(title) + "</span>" +
              '<span class="meta">' + esc(sys.planetCount) + " planet" + (sys.planetCount === 1 ? "" : "s") +
              " · " + esc(sys.flora) + " flora · " + esc(sys.fauna) + " fauna · " + esc(sys.minerals) + " minerals · " +
              esc(galaxyLabel(sys.galaxy)) + "</span>" +
              '<span class="glyphs">' + esc(sys.glyphs) + " · " + esc(sys.coords) + "</span></button></li>";
          }).join("") + (orderedDisc.length > cap
            ? '<li class="empty">Showing ' + cap + " of " + orderedDisc.length + " systems. Filter by glyphs or a planet name to narrow the list. The map still draws every system.</li>"
            : "");
        }
      }
      if (!baseList) return;
      var summaries = summariesFor(bases);
      var pinned = pinSelectedBases(
        orderBases(bases, summaries, state.listSort, state.listFilter),
        state.selection,
        state.selectedOnTop
      );
      var ordered = pinned.bases;
      var showSplit = state.selectedOnTop && pinned.splitAfter > 0 && pinned.splitAfter < ordered.length;
      listOrder = ordered.map(function (b) { return b.id; });
      if (!bases.length) {
        baseList.innerHTML = '<li class="empty">' + (state.fileName
          ? "No planetary bases in this galaxy" + (state.filter ? " match the filter." : ".")
          : "Load a save to list bases. Euclid Hub marks and quadrant references are already on the map.") + "</li>";
      } else if (!ordered.length) {
        baseList.innerHTML = '<li class="empty">' + (state.listFilter === "item"
          ? "No bases match the item search. Type an item above, such as Chromatic Metal."
          : "No planetary bases match this list.") + "</li>";
      } else {
        var api = logisticsApi();
        var store = api ? (logisticsStore || api.emptyStore()) : null;
        baseList.innerHTML = ordered.map(function (b, i) {
          var on = isSelected(b.id);
          var open = !!state.expanded[b.id];
          var detailId = "base-detail-" + b.id;
          var detail = "";
          if (open && api && store) detail = placeSectionsHtml(api, store, placeOf(b), "base");
          var split = (showSplit && i === pinned.splitAfter)
            ? '<li class="list-split">' + pinned.splitAfter + " selected</li>"
            : "";
          return split + '<li class="base-row">' +
            '<div class="base-head"><button type="button" data-base="' + esc(b.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
            '<span class="nm">' + (on ? '<span class="sel-flag">Selected</span>' : "") + esc(b.name) + "</span>" +
            '<span class="meta">' + esc(b.type) + " · " + esc(galaxyLabel(b.galaxy)) + " · " + esc(b.coords) +
            " · " + esc(formatLy(b.lyCenter)) + " from center" + esc(nearestHubLy(b)) + "</span>" +
            '<span class="glyphs">' + esc(b.glyphs) + "</span>" +
            glanceHtml(summaries[b.id]) +
            "</button>" +
            '<button type="button" class="base-expand" data-expand="' + esc(b.id) + '" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="' + esc(detailId) + '">' +
            (open ? "Hide" : "Details") + "</button></div>" +
            '<div id="' + esc(detailId) + '" class="base-detail"' + (open ? "" : " hidden") + ">" + detail + "</div></li>";
        }).join("");
        bindProduction(baseList);
      }
      if (freightList) {
        var fr = state.freighters.filter(function (b) {
          return galaxyKey(b) === state.galaxy;
        });
        freightOrder = fr.map(function (b) { return b.id; });
        freightList.innerHTML = fr.length
          ? fr.map(function (b) {
            var on = isSelected(b.id);
            return '<li><button type="button" data-freight="' + esc(b.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
              '<span class="nm">' + (on ? '<span class="sel-flag">Selected</span>' : "") + esc(b.name) + "</span><span class=\"meta\">" +
              esc(b.type) + " · " + esc(galaxyLabel(b.galaxy)) + " · " + esc(b.glyphs) +
              '</span><span class="glyphs">Not plotted · inventory</span></button></li>';
          }).join("")
          : '<li class="empty">No freighter bases in this galaxy.</li>';
      }
      if (problemWrap && problemList) {
        if (!state.problems.length) {
          problemWrap.hidden = true;
          problemList.innerHTML = "";
        } else {
          problemWrap.hidden = false;
          problemList.innerHTML = state.problems.map(function (p) {
            return "<li><span class=\"nm\">" + esc(p.name) + "</span><span class=\"meta\">" + esc(p.detail) + "</span></li>";
          }).join("");
        }
      }
    }

    function fillGalaxies() {
      if (!galaxySel) return;
      var baseCounts = Object.create(null);
      var discCounts = Object.create(null);
      state.planetary.concat(state.freighters).forEach(function (b) {
        var key = galaxyKey(b);
        baseCounts[key] = (baseCounts[key] || 0) + 1;
      });
      state.discoveries.forEach(function (sys) {
        var key = sys.galaxy == null ? 0 : sys.galaxy;
        discCounts[key] = (discCounts[key] || 0) + 1;
      });
      if (!Object.keys(baseCounts).length && !Object.keys(discCounts).length) baseCounts[0] = 0;
      var known = anyKnownGalaxy() || state.discoveries.some(function (sys) { return sys.galaxySource === "reality" || sys.galaxySource === "ua"; });
      var idMap = Object.create(null);
      Object.keys(baseCounts).forEach(function (k) { idMap[k] = true; });
      Object.keys(discCounts).forEach(function (k) { idMap[k] = true; });
      var ids = Object.keys(idMap).map(function (k) { return Number(k); }).sort(function (a, b) { return a - b; });
      if (state.fileName && !idMap[state.galaxy]) {
        state.galaxy = ids.slice().sort(function (a, b) {
          return ((baseCounts[b] || 0) + (discCounts[b] || 0)) - ((baseCounts[a] || 0) + (discCounts[a] || 0));
        })[0];
      }
      galaxySel.innerHTML = ids.map(function (id) {
        var name = (!known && id === 0)
          ? (state.fileName ? "Euclid frame" : "Euclid")
          : (id === -1 ? "Galaxy unknown" : galaxyLabel(id));
        var bits = [];
        if (baseCounts[id]) bits.push(baseCounts[id] + (baseCounts[id] === 1 ? " base" : " bases"));
        if (discCounts[id]) bits.push(discCounts[id] + (discCounts[id] === 1 ? " system" : " systems"));
        var label = name + (bits.length ? " · " + bits.join(" · ") : "");
        return '<option value="' + id + '">' + esc(label) + "</option>";
      }).join("");
      galaxySel.value = String(state.galaxy);
      if (showHubs) {
        showHubs.disabled = state.galaxy !== 0;
        if (state.galaxy !== 0) showHubs.checked = false;
      }
      if (showRefs) {
        showRefs.disabled = state.galaxy !== 0;
        if (state.galaxy !== 0) showRefs.checked = false;
      }
    }

    function summarize() {
      if (!state.fileName) {
        setStatus("Ready — Euclid schematic with Hub marks and quadrant references. Choose exported JSON or a Steam save. Nothing is uploaded.");
        return;
      }
      var here = visibleBases().length;
      var freightHere = state.freighters.filter(function (b) { return galaxyKey(b) === state.galaxy; }).length;
      var via = state.source === "hg" ? "Steam save" : (state.source === "json" ? "exported JSON" : (state.source === "browser" ? "this browser" : ""));
      var msg = state.fileName + (via ? " — " + via : "") + " — " + here + " planetary base" + (here === 1 ? "" : "s") +
        " on this map, " + freightHere + " freighter" + (freightHere === 1 ? "" : "s") + " listed aside.";
      if (DiscoveryLib && state.discoveries.length) {
        var shown = filteredDiscoveries();
        var totals = DiscoveryLib.discoveryTotals(shown);
        msg += " Discoveries here: " + totals.systems + " system" + (totals.systems === 1 ? "" : "s") +
          ", " + totals.planets + " planet" + (totals.planets === 1 ? "" : "s") +
          ", " + totals.flora + " flora, " + totals.fauna + " fauna, " + totals.minerals + " minerals.";
        var elsewhere = DiscoveryLib.galaxyBreakdown(state.discoveries).filter(function (row) {
          return row.galaxy !== state.galaxy;
        });
        if (elsewhere.length) {
          msg += " Other galaxies: " + elsewhere.map(function (row) {
            return galaxyLabel(row.galaxy) + " (" + row.systems + " system" + (row.systems === 1 ? "" : "s") +
              ", " + row.planets + " planet" + (row.planets === 1 ? "" : "s") + ")";
          }).join(", ") + ".";
        }
      }
      if (state.problems.length) msg += " " + state.problems.length + " entr" + (state.problems.length === 1 ? "y" : "ies") + " could not be read.";
      msg += " Nothing was uploaded.";
      setStatus(msg);
    }

    function refresh() {
      fillGalaxies();
      renderLists();
      renderRefList();
      draw();
      summarize();
    }

    function applyParsed(parsed, discovered, name, source) {
      state.fileName = name || (source === "hg" ? "save.hg" : "save.json");
      state.source = source || "";
      state.planetary = parsed.planetary || [];
      state.freighters = parsed.freighters || [];
      state.problems = (parsed.problems || []).slice();
      state.discoveries = (discovered && discovered.systems) || [];
      state.discoveryProblems = (discovered && discovered.problems) || [];
      if (DiscoveryLib) DiscoveryLib.placeDiscoveryGalaxies(state.discoveries, state.planetary.concat(state.freighters));
      state.discoveryProblems.slice(0, 8).forEach(function (p) {
        state.problems.push({ name: p.name || "Discovery", detail: p.detail });
      });
      if (state.discoveryProblems.length > 8) {
        state.problems.push({
          name: "Discoveries",
          detail: (state.discoveryProblems.length - 8) + " more discovery records could not be read."
        });
      }
      state.selected = null;
      state.selection = [];
      state.anchorId = null;
      state.selectedFreight = null;
      state.expanded = {};
      state.selectedRef = null;
      state.hover = null;
      state.hoverRef = null;
      state.hoverDiscovery = null;
      aim = null;
      openDiscoveryId = null;
      renderPlacePanel(null);
      var baseGalaxy = DiscoveryLib ? DiscoveryLib.dominantBaseGalaxy(state.planetary.concat(state.freighters)) : null;
      if (baseGalaxy != null) state.galaxy = baseGalaxy;
      else if (state.discoveries.length && DiscoveryLib) {
        var ranked = DiscoveryLib.galaxyBreakdown(state.discoveries).slice().sort(function (a, b) {
          return b.systems - a.systems;
        });
        state.galaxy = ranked.length ? ranked[0].galaxy : 0;
      } else state.galaxy = 0;
      if (showHubs) showHubs.checked = state.galaxy === 0;
      if (showRefs) showRefs.checked = state.galaxy === 0;
      resetView();
      saveDiscoveryCache();
      refresh();
      if (!parsed.planetary.length && parsed.freighters.length && !state.discoveries.length) {
        setStatus("Only freighter bases were found. They stay off the map and are listed separately. Nothing was uploaded.");
      }
    }

    function fail(code) {
      state.planetary = [];
      state.freighters = [];
      state.problems = [];
      state.discoveries = [];
      state.discoveryProblems = [];
      saveDiscoveryCache();
      state.selected = null;
      state.selection = [];
      state.anchorId = null;
      state.selectedFreight = null;
      state.selectedRef = null;
      state.hover = null;
      state.hoverRef = null;
      aim = null;
      state.fileName = "";
      state.source = "";
      state.galaxy = 0;
      refresh();
      if (code === "unknown" || code === "binary") {
        setStatus("This file is neither exported JSON nor a Steam .hg save. JSON starts with {. A Steam save (save.hg, save2.hg, …) starts with the game’s LZ4 header. Nothing was uploaded.");
      } else if (code === "hg") {
        setStatus("That file has a Steam .hg header, but it could not be decompressed. Choose save.hg or save2.hg from the Hello Games folder, not a zip or accountdata.hg. Nothing was uploaded.");
      } else if (code === "missing") {
        setStatus("No PlayerStateData in this file. Bases live under BaseContext.PlayerStateData, or under PlayerStateData at the top level. Nothing was uploaded.");
      } else if (code === "empty") {
        setStatus("PlayerStateData is present, but PersistentPlayerBases is missing or empty. Nothing to plot.");
      } else if (code === "big") {
        setStatus("That file is over 48 MB. Try a smaller save. Nothing was uploaded.");
      } else if (code === "map") {
        setStatus("Could not load the local key map, so this obfuscated save could not be read. Nothing was uploaded.");
      }
    }

    var loadGen = 0;

    function consumeSave(data, name, unmapped, source) {
      var parsed = extractBases(data);
      var discovered = { records: [], systems: [], problems: [] };
      try {
        discovered = extractDiscoveries(data);
      } catch (err) {
        discovered = { records: [], systems: [], problems: [{ name: "Discoveries", detail: "Discovery records could not be read." }] };
      }
      if (parsed.error && !(discovered.systems && discovered.systems.length)) {
        fail(parsed.error);
        if (parsed.error === "missing" && unmapped) {
          setStatus("The local key map was applied, but no PlayerStateData was found under BaseContext or at the top level. Nothing was uploaded.");
        }
        return;
      }
      if (parsed.error) parsed = { planetary: [], freighters: [], problems: [] };
      applyParsed(parsed, discovered, name, source);
      var api = logisticsApi();
      if (!api) return;
      var next = api.importSave(readLogistics() || api.emptyStore(), playerStateOf(data), {
        decodeAddress: decodeAddressField,
        bases: parsed,
        fileName: state.fileName,
        format: source || ""
      });
      writeLogistics(next);
      if (showStock && next.locations.length) showStock.checked = true;
      if (showProduction && next.production && next.production.length) showProduction.checked = true;
      var held = next.locations.length;
      var flagged = next.skipped.length;
      setStatus((statusEl && statusEl.textContent ? statusEl.textContent + " " : "") +
        "Inventory: " + held + " hold" + (held === 1 ? "" : "s") +
        (flagged ? ", " + flagged + " section" + (flagged === 1 ? "" : "s") + " flagged." : ".") +
        " Shared with the logistics planner in this browser. Nothing was uploaded.");
      renderLists();
      draw();
      renderSelection();
    }

    function readFiles(fileList) {
      var files = Array.prototype.slice.call(fileList || []).filter(Boolean);
      if (!files.length) return;
      var tooBig = files.some(function (file) { return file.size > 48 * 1024 * 1024; });
      if (tooBig) {
        fail("big");
        return;
      }
      var token = ++loadGen;
      Promise.all(files.map(function (file) {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () { resolve({ name: file.name, buf: new Uint8Array(reader.result) }); };
          reader.onerror = function () { resolve({ name: file.name, error: { code: "unknown" } }); };
          reader.readAsArrayBuffer(file);
        });
      })).then(function (loaded) {
        if (token !== loadGen) return null;
        return Promise.all(loaded.map(function (item) {
          if (!item || item.error || !item.buf) return Promise.resolve({ name: item && item.name, error: { code: "unknown" } });
          return readSaveDocument(item.buf).then(function (opened) {
            return { name: item.name, opened: opened };
          }).catch(function (err) {
            return { name: item.name, error: err || { code: "unknown" } };
          });
        }));
      }).then(function (opened) {
        if (!opened || token !== loadGen) return;
        var good = opened.filter(function (item) { return item && item.opened; });
        var bad = opened.filter(function (item) { return !item || !item.opened; });
        if (!good.length) {
          var err = (bad[0] && bad[0].error) || {};
          var code = err.code;
          if (code === "json") {
            fail("json");
            setStatus(err.format === "hg"
              ? "The Steam save opened, but its contents were not readable JSON. Nothing was uploaded."
              : "That file starts like JSON, but it could not be parsed. Export it again from NomNom or NMS Save Editor. Nothing was uploaded.");
            return;
          }
          fail(code === "hg" || code === "binary" || code === "map" || code === "unknown" ? code : "unknown");
          return;
        }
        var docs = good.map(function (item) { return item.opened.data; });
        var data = docs.length === 1 ? docs[0] : mergeSaveDocuments(docs);
        var label = good.map(function (item) { return item.name; }).join(" + ");
        var unmapped = good.some(function (item) { return item.opened.unmapped; });
        var source = good.some(function (item) { return item.opened.format === "hg"; }) ? "hg" : "json";
        consumeSave(data, label, unmapped, source);
        if (bad.length) {
          setStatus((statusEl && statusEl.textContent ? statusEl.textContent + " " : "") +
            bad.map(function (item) { return item.name || "A file"; }).join(", ") + " could not be read.");
        }
      }).catch(function () {
        if (token !== loadGen) return;
        fail("unknown");
      });
    }

    function handleBytes(buf, name) {
      var token = ++loadGen;
      readSaveDocument(buf).then(function (opened) {
        if (token !== loadGen) return;
        consumeSave(opened.data, name, opened.unmapped, opened.format);
      }).catch(function (err) {
        if (token !== loadGen) return;
        var code = err && err.code;
        if (code === "json") {
          fail("json");
          setStatus(err.format === "hg"
            ? "The Steam save opened, but its contents were not readable JSON. Nothing was uploaded."
            : "That file starts like JSON, but it could not be parsed. Export it again from NomNom or NMS Save Editor. Nothing was uploaded.");
          return;
        }
        fail(code === "hg" || code === "binary" || code === "map" || code === "unknown" ? code : "unknown");
      });
    }

    function readFile(file) {
      if (!file) return;
      readFiles([file]);
    }

    function markerSpot(id, size) {
      var bases = visibleBases();
      var b = null;
      var i;
      for (i = 0; i < bases.length; i++) if (bases[i].id === id) { b = bases[i]; break; }
      if (!b) return null;
      var group = [];
      for (i = 0; i < bases.length; i++) {
        if (bases[i].voxelX === b.voxelX && bases[i].voxelZ === b.voxelZ) group.push(bases[i]);
      }
      var idx = group.indexOf(b);
      var off = clumpOffset(idx < 0 ? 0 : idx, group.length, view.zoom);
      var p = project(b.voxelX, b.voxelZ, size.w, size.h);
      return { x: p.x + off.x, y: p.y + off.y };
    }

    function zoomAnchor() {
      if (aim) return { x: aim.x, y: aim.y };
      var size = lastSize.w ? lastSize : canvasSize();
      if (state.selected) {
        var spot = markerSpot(state.selected, size);
        if (spot) return spot;
      }
      return { x: size.w / 2, y: size.h / 2 };
    }

    function syncAim() {
      if (!aim || aim.kind !== "base" || !state.hover) return;
      var spot = markerSpot(state.hover, lastSize.w ? lastSize : canvasSize());
      if (spot) aim = { x: spot.x, y: spot.y, kind: "base", id: state.hover };
    }

    function hitTest(ev) {
      var rect = canvas.getBoundingClientRect();
      var x = ev.clientX - rect.left;
      var y = ev.clientY - rect.top;
      for (var i = hits.length - 1; i >= 0; i--) {
        var h = hits[i];
        var dx = x - h.x;
        var dy = y - h.y;
        if (dx * dx + dy * dy <= h.r * h.r) return h;
      }
      return null;
    }

    var pointers = {};
    var drag = null;
    var suppressClick = false;

    function localPoint(ev) {
      var rect = canvas.getBoundingClientRect();
      return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    }

    canvas.addEventListener("mousemove", function (ev) {
      if (drag) return;
      var h = hitTest(ev);
      var next = h && h.kind === "base" ? h.id : null;
      var nextRef = h && h.kind === "ref" ? h.id : null;
      var nextDisc = h && (h.kind === "discovery" || h.kind === "discovery-cluster") ? h.id : null;
      var nextAim = h ? { x: h.ax != null ? h.ax : h.x, y: h.ay != null ? h.ay : h.y, kind: h.kind, id: h.id || null } : null;
      canvas.style.cursor = h ? "pointer" : (selectMode ? "crosshair" : "grab");
      var sameHover = next === state.hover && nextRef === state.hoverRef && nextDisc === state.hoverDiscovery;
      var sameAim = (!nextAim && !aim) || (nextAim && aim && nextAim.kind === aim.kind && nextAim.id === aim.id && nextAim.x === aim.x && nextAim.y === aim.y);
      if (sameHover && sameAim) return;
      state.hover = next;
      state.hoverRef = nextRef;
      state.hoverDiscovery = nextDisc;
      aim = nextAim;
      draw();
    });
    var mapWrap = canvas.closest ? canvas.closest(".map-wrap") : canvas.parentElement;
    if (mapWrap) {
      mapWrap.addEventListener("mouseleave", function () {
        if (drag) return;
        if (!state.hover && !state.hoverRef && !state.hoverDiscovery && !aim) return;
        state.hover = null;
        state.hoverRef = null;
        state.hoverDiscovery = null;
        aim = null;
        draw();
      });
    }
    function gestureFromEvent(ev) {
      return selectionGesture({
        alt: !!ev.altKey,
        ctrl: !!ev.ctrlKey,
        meta: !!ev.metaKey,
        shift: !!ev.shiftKey
      }, selectShape);
    }

    function marqueeActive(ev) {
      if (ev.pointerType === "mouse" && ev.button === 1) return true;
      if (ev.pointerType === "mouse" && ev.button !== 0) return false;
      return !!selectMode;
    }

    function applyMarquee(shapeDrag, op) {
      var shape;
      if (!shapeDrag) return;
      if (shapeDrag.shape === "circle") {
        shape = {
          type: "circle",
          cx: shapeDrag.x0,
          cy: shapeDrag.y0,
          r: Math.hypot(shapeDrag.x1 - shapeDrag.x0, shapeDrag.y1 - shapeDrag.y0)
        };
      } else {
        shape = { type: "rect", x0: shapeDrag.x0, y0: shapeDrag.y0, x1: shapeDrag.x1, y1: shapeDrag.y1 };
      }
      var ids = markersInside(hits, shape).map(function (hit) { return hit.id; });
      commitSelection(applySelectionOp(state.selection, ids, op || "replace"));
    }

    function chooseMarker(id, ev, ordered) {
      if (ev.shiftKey && !(ev.ctrlKey || ev.metaKey)) commitSelection(rangeIds(ordered, state.anchorId, id));
      else if (ev.ctrlKey || ev.metaKey) commitSelection(toggleId(state.selection, id), id);
      else commitSelection([id], id);
    }

    function forgetPlaces() {
      state.selection = [];
      state.selected = null;
      state.selectedFreight = null;
      state.anchorId = null;
    }

    canvas.addEventListener("click", function (ev) {
      if (ev.button !== 0) return;
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      var h = hitTest(ev);
      if (!h) {
        state.selectedRef = null;
        commitSelection([]);
        renderRefList();
        return;
      }
      if (h.kind === "discovery-cluster") {
        var members = h.members || [];
        if (members.length === 1) {
          chooseMarker(members[0].id, ev, discoveryOrder);
          return;
        }
        var pts = members.map(function (sys) { return { x: sys.voxelX, z: sys.voxelZ }; });
        applyFit(pts, { padVoxels: 24, minZoom: 8, maxZoom: 24 });
        draw();
        setStatus(members.length + " discovered systems. Zoomed in so each system can be selected. Nothing was uploaded.");
        return;
      }
      if (h.kind === "discovery") {
        chooseMarker(h.id, ev, discoveryOrder);
        return;
      }
      if (h.kind === "base" || h.kind === "freighter" || h.kind === "settlement" || h.kind === "system") {
        chooseMarker(h.id, ev, h.kind === "freighter" ? freightOrder : listOrder);
        return;
      }
      if (h.kind === "ref") {
        var ref = refById(h.id);
        var was = state.selectedRef === h.id;
        forgetPlaces();
        state.selectedRef = was ? null : h.id;
        renderLists();
        renderRefList();
        draw();
        if (ref && state.selectedRef) {
          placeMode = "system";
          setStatus(ref.label + " — " + quadrantName(ref.quadrant) + " — " + (ref.note ? ref.note + " — " : "") + "glyphs " + ref.glyphs + " — " + ref.coords + ". Community landmark, not from your save.");
          renderPlacePanel({ glyphs: ref.glyphs, planet: ref.planet, galaxy: 0, name: ref.label, type: "Reference", coords: ref.coords }, ref.label);
        } else renderPlacePanel(null);
      } else if (h.kind === "hub") {
        var hub = hubById(h.id);
        if (hub) {
          forgetPlaces();
          placeMode = "system";
          renderLists();
          draw();
          setStatus(hub.label + (hub.note ? " · " + hub.note : "") + " — glyphs " + hub.glyphs + " — " + hub.coords + ". Euclid reference, not from your save.");
          renderPlacePanel({ glyphs: hub.glyphs, planet: null, galaxy: 0, name: hub.label, type: "Hub", coords: hub.coords }, hub.label);
        }
      } else if (h.kind === "center") {
        setStatus("Galactic center — voxel 0, 0, 0 on this schematic. Not a catalog star.");
      }
    });
    canvas.addEventListener("dblclick", function (ev) {
      var h = hitTest(ev);
      if (!h || (h.kind !== "base" && h.kind !== "discovery")) return;
      ev.preventDefault();
      if (h.kind === "discovery") {
        focusDiscovery(h.id);
        renderLists();
        draw();
        var dbtn = discoveryList && discoveryList.querySelector('[data-discovery="' + h.id + '"]');
        if (dbtn) dbtn.scrollIntoView({ block: "nearest" });
        return;
      }
      focusCluster(h.id);
      renderLists();
      draw();
      var btn = baseList && baseList.querySelector('[data-base="' + h.id + '"]');
      if (btn) btn.scrollIntoView({ block: "nearest" });
    });
    canvas.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      var p = localPoint(ev);
      var factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
      if (ev.deltaMode === 1) factor = ev.deltaY < 0 ? 1.2 : 1 / 1.2;
      var next = zoomAbout(view, p.x, p.y, lastSize.w / 2, lastSize.h / 2, factor);
      view.zoom = next.zoom;
      view.panX = next.panX;
      view.panY = next.panY;
      clampPan();
      syncAim();
      draw();
    }, { passive: false });
    function blockMiddle(ev) {
      if (ev.button === 1) ev.preventDefault();
    }
    canvas.addEventListener("mousedown", blockMiddle, true);
    if (mapWrap) mapWrap.addEventListener("mousedown", blockMiddle, true);
    canvas.addEventListener("auxclick", function (ev) {
      if (ev.button === 1) ev.preventDefault();
    });
    canvas.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType === "mouse" && ev.button !== 0 && ev.button !== 1) return;
      if (ev.button === 1) ev.preventDefault();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(ev.pointerId); } catch (err) { /* synthetic pointers */ }
      }
      pointers[ev.pointerId] = localPoint(ev);
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        marquee = null;
        var a = pointers[ids[0]];
        var b = pointers[ids[1]];
        drag = {
          pinch: true,
          marquee: false,
          moved: true,
          dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          zoom: view.zoom,
          panX: view.panX,
          panY: view.panY,
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2
        };
      } else if (marqueeActive(ev)) {
        var start = pointers[ids[0]];
        var gesture = gestureFromEvent(ev);
        drag = { marquee: true, pinch: false, moved: false, x: start.x, y: start.y, shape: gesture.shape, op: gesture.op };
        marquee = { shape: gesture.shape, x0: start.x, y0: start.y, x1: start.x, y1: start.y };
      } else {
        marquee = null;
        var p = pointers[ids[0]];
        drag = { pinch: false, marquee: false, moved: false, x: p.x, y: p.y, panX: view.panX, panY: view.panY };
      }
    });
    canvas.addEventListener("pointermove", function (ev) {
      if (!pointers[ev.pointerId]) return;
      pointers[ev.pointerId] = localPoint(ev);
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        marquee = null;
        var a = pointers[ids[0]];
        var b = pointers[ids[1]];
        if (!drag || !drag.pinch) {
          drag = {
            pinch: true,
            marquee: false,
            moved: true,
            dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
            zoom: view.zoom,
            panX: view.panX,
            panY: view.panY,
            midX: (a.x + b.x) / 2,
            midY: (a.y + b.y) / 2
          };
        }
        var dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        var midX = (a.x + b.x) / 2;
        var midY = (a.y + b.y) / 2;
        var next = zoomAbout(
          { zoom: drag.zoom, panX: drag.panX, panY: drag.panY },
          drag.midX, drag.midY, lastSize.w / 2, lastSize.h / 2, dist / drag.dist
        );
        view.zoom = next.zoom;
        view.panX = next.panX + (midX - drag.midX);
        view.panY = next.panY + (midY - drag.midY);
        clampPan();
        drag.moved = true;
        draw();
        return;
      }
      if (!drag || drag.pinch) return;
      var p = pointers[ids[0]];
      var dx = p.x - drag.x;
      var dy = p.y - drag.y;
      if (dx * dx + dy * dy > 16) drag.moved = true;
      if (drag.marquee) {
        var gesture = gestureFromEvent(ev);
        drag.shape = gesture.shape;
        drag.op = gesture.op;
        marquee = { shape: drag.shape, x0: drag.x, y0: drag.y, x1: p.x, y1: p.y };
        if (drag.moved) draw();
        return;
      }
      if (!drag.moved) return;
      view.panX = drag.panX + dx;
      view.panY = drag.panY + dy;
      clampPan();
      canvas.classList.add("panning");
      canvas.style.cursor = "grabbing";
      draw();
    });
    function endPointer(ev) {
      delete pointers[ev.pointerId];
      var ids = Object.keys(pointers);
      if (!ids.length) {
        var finished = drag && drag.marquee && drag.moved ? marquee : null;
        var op = finished ? gestureFromEvent(ev).op : "replace";
        if (drag && drag.moved && !finished) {
          suppressClick = true;
          aim = null;
          state.hover = null;
        }
        drag = null;
        marquee = null;
        canvas.classList.remove("panning");
        canvas.style.cursor = selectMode ? "crosshair" : "grab";
        if (finished) {
          suppressClick = true;
          applyMarquee(finished, op);
        } else draw();
        return;
      }
      marquee = null;
      var p = pointers[ids[0]];
      drag = { pinch: false, marquee: false, moved: true, x: p.x, y: p.y, panX: view.panX, panY: view.panY };
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("keydown", function (ev) {
      var key = ev.key;
      if (key === "+" || key === "=") { var zin = zoomAnchor(); zoomBy(1.25, zin.x, zin.y); }
      else if (key === "-" || key === "_") { var zout = zoomAnchor(); zoomBy(1 / 1.25, zout.x, zout.y); }
      else if (key === "0" || key === "Home") resetView();
      else if (key === "ArrowLeft") view.panX += 40;
      else if (key === "ArrowRight") view.panX -= 40;
      else if (key === "ArrowUp") view.panY += 40;
      else if (key === "ArrowDown") view.panY -= 40;
      else return;
      ev.preventDefault();
      clampPan();
      draw();
    });

    if (baseList) {
      baseList.addEventListener("click", function (ev) {
        var expand = ev.target.closest ? ev.target.closest("[data-expand]") : null;
        if (expand) {
          var xid = expand.getAttribute("data-expand");
          state.expanded[xid] = !state.expanded[xid];
          renderLists();
          var again = baseList.querySelector('[data-expand="' + xid + '"]');
          if (again) again.focus();
          return;
        }
        var btn = ev.target.closest ? ev.target.closest("[data-base]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-base");
        if (ev.shiftKey && !(ev.ctrlKey || ev.metaKey)) {
          commitSelection(rangeIds(listOrder, state.anchorId, id));
          return;
        }
        if (ev.ctrlKey || ev.metaKey) {
          commitSelection(toggleId(state.selection, id), id);
          return;
        }
        focusCluster(id);
        commitSelection([id], id);
      });
      baseList.addEventListener("keydown", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-base]") : null;
        if (!btn || (ev.key !== "Enter" && ev.key !== " ")) return;
        if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey) return;
        ev.preventDefault();
        var id = btn.getAttribute("data-base");
        if (ev.shiftKey && !(ev.ctrlKey || ev.metaKey)) commitSelection(rangeIds(listOrder, state.anchorId, id));
        else commitSelection(toggleId(state.selection, id), id);
      });
    }

    if (freightList) {
      freightList.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-freight]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-freight");
        if (ev.shiftKey && !(ev.ctrlKey || ev.metaKey)) {
          commitSelection(rangeIds(freightOrder, state.anchorId, id));
          return;
        }
        if (ev.ctrlKey || ev.metaKey) {
          commitSelection(toggleId(state.selection, id), id);
          return;
        }
        state.selectedRef = null;
        commitSelection([id], id);
      });
      freightList.addEventListener("keydown", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-freight]") : null;
        if (!btn || (ev.key !== "Enter" && ev.key !== " ")) return;
        if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey) return;
        ev.preventDefault();
        var id = btn.getAttribute("data-freight");
        if (ev.shiftKey && !(ev.ctrlKey || ev.metaKey)) commitSelection(rangeIds(freightOrder, state.anchorId, id));
        else commitSelection(toggleId(state.selection, id), id);
      });
    }

    function bindZoom(id, fn) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        fn();
        draw();
      });
    }
    bindZoom("zoom-in", function () {
      var p = zoomAnchor();
      zoomBy(1.25, p.x, p.y);
    });
    bindZoom("zoom-out", function () {
      var p = zoomAnchor();
      zoomBy(1 / 1.25, p.x, p.y);
    });
    bindZoom("zoom-reset", function () { resetView(); });

    function paintSelectTools() {
      var modeBtn = document.getElementById("select-mode");
      var boxBtn = document.getElementById("select-box");
      var circleBtn = document.getElementById("select-circle");
      if (modeBtn) {
        modeBtn.setAttribute("aria-pressed", selectMode ? "true" : "false");
        modeBtn.textContent = selectMode ? "Selecting" : "Select";
      }
      if (boxBtn) boxBtn.setAttribute("aria-pressed", selectShape === "box" ? "true" : "false");
      if (circleBtn) circleBtn.setAttribute("aria-pressed", selectShape === "circle" ? "true" : "false");
      canvas.classList.toggle("selecting", !!selectMode);
      if (!drag) canvas.style.cursor = selectMode ? "crosshair" : "grab";
    }
    function bindPress(id, fn) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        fn();
        paintSelectTools();
      });
    }
    bindPress("select-mode", function () { selectMode = !selectMode; });
    bindPress("select-box", function () { selectShape = "box"; });
    bindPress("select-circle", function () { selectShape = "circle"; });
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      var helpOpen = document.querySelector(".help-dialog[role='dialog']:not([hidden])");
      if (helpOpen) return;
      var tag = ev.target && ev.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!state.selection.length && !state.selectedRef) return;
      state.selectedRef = null;
      commitSelection([]);
    });
    var listSort = document.getElementById("list-sort");
    var listFilter = document.getElementById("list-filter");
    var selectedOnTopInput = document.getElementById("selected-on-top");
    if (listSort) listSort.addEventListener("change", function () {
      state.listSort = listSort.value || "name";
      renderLists();
    });
    if (listFilter) listFilter.addEventListener("change", function () {
      state.listFilter = listFilter.value || "all";
      renderLists();
    });
    if (selectedOnTopInput) {
      selectedOnTopInput.checked = !!state.selectedOnTop;
      selectedOnTopInput.addEventListener("change", function () {
        state.selectedOnTop = !!selectedOnTopInput.checked;
        writeSelectedOnTop(window.localStorage, state.selectedOnTop);
        renderLists();
      });
    }
    paintSelectTools();

    if (fileInput) {
      fileInput.addEventListener("change", function () {
        if (fileInput.files && fileInput.files.length) readFiles(fileInput.files);
      });
    }

    if (drop) {
      ["dragenter", "dragover"].forEach(function (type) {
        drop.addEventListener(type, function (ev) {
          ev.preventDefault();
          drop.classList.add("hot");
        });
      });
      ["dragleave", "drop"].forEach(function (type) {
        drop.addEventListener(type, function (ev) {
          ev.preventDefault();
          drop.classList.remove("hot");
        });
      });
      drop.addEventListener("drop", function (ev) {
        var files = ev.dataTransfer && ev.dataTransfer.files;
        if (files && files.length) readFiles(files);
      });
    }

    if (galaxySel) {
      galaxySel.addEventListener("change", function () {
        state.galaxy = Number(galaxySel.value);
        if (showHubs) {
          if (state.galaxy !== 0) showHubs.checked = false;
          showHubs.disabled = state.galaxy !== 0;
        }
        state.selected = null;
        state.selection = [];
        state.anchorId = null;
        state.selectedFreight = null;
        state.selectedRef = null;
        state.hover = null;
        state.hoverRef = null;
        state.hoverDiscovery = null;
        aim = null;
        renderPlacePanel(null);
        renderLists();
        renderRefList();
        draw();
        summarize();
      });
    }
    if (filterInput) {
      filterInput.addEventListener("input", function () {
        state.filter = filterInput.value || "";
        state.hover = null;
        state.hoverRef = null;
        state.hoverDiscovery = null;
        aim = null;
        renderLists();
        draw();
      });
    }
    if (showCenter) showCenter.addEventListener("change", draw);
    if (showHubs) showHubs.addEventListener("change", draw);
    if (showRefs) showRefs.addEventListener("change", function () {
      if (showRefs.checked) return draw();
      state.selectedRef = null;
      state.hoverRef = null;
      if (aim && aim.kind === "ref") aim = null;
      renderRefList();
      draw();
    });

    function focusRef(id) {
      var ref = refById(id);
      if (!ref) return;
      if (state.galaxy !== 0) {
        state.galaxy = 0;
        if (galaxySel) galaxySel.value = "0";
        if (showHubs) showHubs.disabled = false;
        if (showRefs) { showRefs.disabled = false; showRefs.checked = true; }
      }
      state.selectedRef = id;
      state.selection = [];
      state.anchorId = null;
      state.selected = null;
      state.selectedFreight = null;
      state.hover = null;
      state.hoverRef = null;
      renderPlacePanel(null);
      var size = canvasSize();
      lastSize = size;
      var framed = frameOf(size.w, size.h);
      var pan = panToMarker(ref.voxelX, ref.voxelZ, 0, 1, view.zoom, framed, size.w / 2, size.h / 2);
      view.panX = pan.panX;
      view.panY = pan.panY;
      clampPan();
      aim = { x: size.w / 2, y: size.h / 2, kind: "ref", id: id };
      setStatus(ref.label + " — " + quadrantName(ref.quadrant) + " — " + (ref.note ? ref.note + " — " : "") + "glyphs " + ref.glyphs + " — " + ref.coords + ". Community landmark, not from your save.");
    }

    function renderRefList() {
      var refList = document.getElementById("ref-list");
      if (!refList) return;
      var order = ["alpha", "beta", "gamma", "delta"];
      var html = [];
      order.forEach(function (q) {
        refs.forEach(function (r) {
          if (r.quadrant !== q) return;
          var on = state.selectedRef === r.id ? "true" : "false";
          html.push('<li><button type="button" data-ref="' + esc(r.id) + '" aria-pressed="' + on + '">' +
            '<span class="q">' + esc(quadrantName(r.quadrant)) + "</span> " +
            "<strong>" + esc(r.label) + "</strong>" +
            (r.note ? " — " + esc(r.note) : "") +
            " — glyphs " + esc(r.glyphs) + " — coords " + esc(r.coords) + "</button></li>");
        });
      });
      refList.innerHTML = html.join("");
    }

    var refList = document.getElementById("ref-list");
    if (refList) {
      refList.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-ref]") : null;
        if (!btn) return;
        focusRef(btn.getAttribute("data-ref"));
        renderLists();
        renderRefList();
        draw();
      });
    }

    var hubList = document.getElementById("hub-list");
    if (hubList) {
      hubList.innerHTML = hubs.map(function (h) {
        return "<li><strong>" + esc(h.label) + "</strong>" +
          (h.note ? " — " + esc(h.note) : "") +
          " — glyphs " + esc(h.glyphs) + " — coords " + esc(h.coords) + "</li>";
      }).join("");
    }

    document.getElementById("btn-clear").addEventListener("click", function () {
      loadGen++;
      state.planetary = [];
      state.freighters = [];
      state.problems = [];
      state.discoveries = [];
      state.discoveryProblems = [];
      state.selected = null;
      state.selection = [];
      state.anchorId = null;
      state.selectedRef = null;
      state.hover = null;
      state.hoverRef = null;
      state.hoverDiscovery = null;
      aim = null;
      state.filter = "";
      state.fileName = "";
      state.source = "";
      state.galaxy = 0;
      if (filterInput) filterInput.value = "";
      if (fileInput) fileInput.value = "";
      if (showHubs) { showHubs.checked = true; showHubs.disabled = false; }
      if (showRefs) { showRefs.checked = true; showRefs.disabled = false; }
      if (showCenter) showCenter.checked = true;
      if (showStock) showStock.checked = false;
      if (showProduction) showProduction.checked = false;
      if (showDiscoveries) showDiscoveries.checked = true;
      if (discPlanets) discPlanets.checked = true;
      if (discSystems) discSystems.checked = true;
      if (discFlora) discFlora.checked = false;
      if (discFauna) discFauna.checked = false;
      if (discMinerals) discMinerals.checked = false;
      if (itemFilter) itemFilter.value = "";
      saveDiscoveryCache();
      view.zoom = 1;
      view.panX = 0;
      view.panY = 0;
      state.selectedFreight = null;
      placeMode = "base";
      var api = logisticsApi();
      if (api) writeLogistics(api.clearImported(readLogistics() || api.emptyStore()));
      renderPlacePanel(null);
      refresh();
      setStatus("Cleared the map and the imported inventories. Manual locations and projects stay in this browser. Nothing was uploaded.");
    });

    if (showStock) showStock.addEventListener("change", draw);
    if (showProduction) showProduction.addEventListener("change", draw);
    [showDiscoveries, discPlanets, discSystems, discFlora, discFauna, discMinerals].forEach(function (box) {
      if (!box) return;
      box.addEventListener("change", function () {
        renderLists();
        draw();
        summarize();
      });
    });
    if (discoveryList) {
      discoveryList.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-discovery]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-discovery");
        if (ev.shiftKey && !(ev.ctrlKey || ev.metaKey)) {
          commitSelection(rangeIds(discoveryOrder, state.anchorId, id));
          return;
        }
        if (ev.ctrlKey || ev.metaKey) {
          commitSelection(toggleId(state.selection, id), id);
          return;
        }
        focusDiscovery(id);
        commitSelection([id], id);
      });
    }
    if (itemFilter) itemFilter.addEventListener("input", function () {
      renderLists();
      draw();
      renderSelection();
    });

    window.addEventListener("resize", draw);
    window.addEventListener("load", draw);
    if (typeof MutationObserver === "function") {
      new MutationObserver(function () {
        starCache = null;
        draw();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    renderRefList();
    var restored = readLogistics();
    if (restored && ((restored.bases.planetary && restored.bases.planetary.length) || (restored.bases.freighters && restored.bases.freighters.length))) {
      state.planetary = restored.bases.planetary || [];
      state.freighters = restored.bases.freighters || [];
      state.problems = restored.bases.problems || [];
      state.fileName = (restored.source && restored.source.fileName) || "this browser";
      state.source = "browser";
      if (showStock) showStock.checked = true;
    }
    if (showProduction && restored && restored.production && restored.production.length) showProduction.checked = true;
    loadDiscoveryCache();
    refresh();
    if (state.source === "browser") {
      setStatus("Restored bases and inventory from this browser. Nothing was uploaded.");
    }
    function findDiscovery(q) {
      if (!q || !q.glyphs) return null;
      var g = String(q.glyphs).toUpperCase();
      var exact = null;
      var loose = null;
      state.discoveries.forEach(function (sys) {
        if (q.galaxy != null && Number(sys.galaxy) !== Number(q.galaxy)) return;
        var glyphs = String(sys.glyphs || "").toUpperCase();
        if (glyphs === g) exact = sys;
        else if (g.length === 12 && glyphs.slice(1) === g.slice(1)) {
          if (q.planet == null || (sys.planetList || []).some(function (planet) { return planet.index === q.planet; })) {
            loose = loose || sys;
          }
        }
      });
      return exact || loose;
    }

    function showDiscovery(sys, ids) {
      if (!sys) return;
      state.galaxy = sys.galaxy == null ? 0 : sys.galaxy;
      if (galaxySel) galaxySel.value = String(state.galaxy);
      if (showHubs) showHubs.disabled = state.galaxy !== 0;
      if (showDiscoveries) showDiscoveries.checked = true;
      focusDiscovery(sys.id);
      commitSelection(ids || [sys.id], sys.id);
    }

    function openFromQuery() {
      var params = new URLSearchParams(window.location.search);
      var layer = params.get("layer") || "";
      var api = logisticsApi();
      var q = api ? api.parsePlaceQuery(window.location.search) : {
        glyphs: String(params.get("place") || "").toUpperCase(),
        planet: null,
        galaxy: params.get("galaxy"),
        base: params.get("base") || ""
      };
      if (q.galaxy != null && q.galaxy !== "" && isFinite(Number(q.galaxy))) q.galaxy = Number(q.galaxy);
      else q.galaxy = null;
      if (layer === "discovery" && params.get("places")) {
        var ids = [];
        String(params.get("places")).split(",").forEach(function (part) {
          var hit = findDiscovery({ glyphs: part.trim().toUpperCase(), planet: null, galaxy: q.galaxy });
          if (hit && ids.indexOf(hit.id) === -1) ids.push(hit.id);
        });
        if (ids.length) showDiscovery(discoveryById(ids[0]), ids);
        return;
      }
      var match = null;
      if (q.glyphs || q.base) {
        state.planetary.concat(state.freighters).forEach(function (b) {
          if (match) return;
          if (q.glyphs && String(b.glyphs || "").toUpperCase() !== q.glyphs) return;
          if (q.base && b.name !== q.base) return;
          match = b;
        });
      }
      var disc = findDiscovery(q);
      if (disc && (layer === "discovery" || !match)) {
        showDiscovery(disc);
        return;
      }
      if (!match) return;
      var freight = state.freighters.some(function (b) { return b.id === match.id; });
      if (match.galaxy != null) {
        state.galaxy = match.galaxy;
        if (galaxySel) galaxySel.value = String(state.galaxy);
        if (showHubs) showHubs.disabled = state.galaxy !== 0;
      }
      placeMode = "base";
      if (!freight) focusCluster(match.id);
      commitSelection([match.id], match.id);
    }
    openFromQuery();
    window.addEventListener("load", openFromQuery);
    if (logisticsApi()) {
      fetch("data/nms-item-names.json", { credentials: "same-origin" }).then(function (res) {
        if (!res.ok) throw new Error("names");
        return res.json();
      }).then(function (data) {
        logisticsApi().setItemNames(data);
        renderLists();
        draw();
        renderSelection();
      }).catch(function () { /* unknown ids stay humanized */ });
      Promise.all([
        fetch("data/graph-v2.json", { credentials: "same-origin" }).then(function (res) {
          if (!res.ok) throw new Error("graph");
          return res.json();
        }),
        fetch("data/technology.json", { credentials: "same-origin" }).then(function (res) {
          if (!res.ok) throw new Error("technology");
          return res.json();
        }).catch(function () { return null; })
      ]).then(function (pair) {
        var catalog = pair[0];
        if (pair[1] && typeof NmsCraft !== "undefined" && NmsCraft.mergeCatalog) catalog = NmsCraft.mergeCatalog(catalog, pair[1]);
        catalogIndex = logisticsApi().buildIndex(catalog);
        renderLists();
        draw();
        renderSelection();
      }).catch(function () { /* names fall back to ids */ });
    }
  }

  return {
    HUBS: HUBS,
    REFERENCES: REFERENCES,
    analyzeGlyphs: analyzeGlyphs,
    glyphsFromSignal: glyphsFromSignal,
    quadrantOf: quadrantOf,
    decodeGalacticAddress: decodeGalacticAddress,
    decodeAddressField: decodeAddressField,
    quoteGalacticAddresses: quoteGalacticAddresses,
    extractBases: extractBases,
    extractDiscoveries: extractDiscoveries,
    mergeSaveDocuments: mergeSaveDocuments,
    playerStateOf: playerStateOf,
    looksBinary: looksBinary,
    hubMarks: hubMarks,
    referenceMarks: referenceMarks,
    lz4BlockDecompress: lz4BlockDecompress,
    decompressHg: decompressHg,
    detectSaveFormat: detectSaveFormat,
    bytesToSaveText: bytesToSaveText,
    readSaveDocument: readSaveDocument,
    stripTrailingNulls: stripTrailingNulls,
    mappingFromJson: mappingFromJson,
    unmapTree: unmapTree,
    needsUnmap: needsUnmap,
    clampZoom: clampZoom,
    zoomAbout: zoomAbout,
    fitView: fitView,
    frameOf: frameOf,
    clumpOffset: clumpOffset,
    clumpZoomForGap: clumpZoomForGap,
    panToMarker: panToMarker,
    pointInRect: pointInRect,
    pointInCircle: pointInCircle,
    mapToScreen: mapToScreen,
    screenToMap: screenToMap,
    screenRadiusLy: screenRadiusLy,
    markersInside: markersInside,
    selectionGesture: selectionGesture,
    toggleId: toggleId,
    applySelectionOp: applySelectionOp,
    rangeIds: rangeIds,
    miningChipText: miningChipText,
    cropChipText: cropChipText,
    summarizeBase: summarizeBase,
    inventoryChipText: inventoryChipText,
    aggregatePlaces: aggregatePlaces,
    orderBases: orderBases,
    SELECTED_ON_TOP_KEY: SELECTED_ON_TOP_KEY,
    readSelectedOnTop: readSelectedOnTop,
    writeSelectedOnTop: writeSelectedOnTop,
    pinSelectedBases: pinSelectedBases,
    formatQty: formatQty,
    commandKeyName: commandKeyName,
    bindHelpDialogs: bindHelpDialogs,
    mount: mount
  };
});
