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
 *  renamed with the bundled MBINCompiler mapping.json. Nothing is uploaded.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { api.mount(); });
    } else {
      api.mount();
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

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
    return String(text).replace(/("(?:GalacticAddress|galacticAddress|oZw|UniverseAddress|FreighterUniverseAddress|Location|yhJ|RB7|YTa)"\s*:\s*)(-?\d+)/g, '$1"$2"');
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
      selectedRef: null,
      hover: null,
      hoverRef: null,
      filter: "",
      fileName: "",
      source: "",
      selectedFreight: null
    };
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

    function renderPlacePanel(place, heading) {
      if (!placePanel || !placeBody) return;
      openPlace = place;
      if (!place) {
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
      var locs = api.locationsAtPlace(store, place, placeMode);
      var demands = api.demandsAtPlace(store, place, placeMode);
      var href = "/game/guides/no-mans-sky/logistics/" + api.placeQuery({
        glyphs: place.glyphs,
        planet: place.planet,
        galaxy: place.galaxy,
        name: place.name
      });
      var units = 0;
      var lines = 0;
      locs.forEach(function (loc) {
        (loc.items || []).forEach(function (item) { units += item.qty; lines += 1; });
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
      html += '<p class="place-meta">' + locs.length + " location" + (locs.length === 1 ? "" : "s") + " · " + lines + " stacks · " + units + " units</p>";
      if (!locs.length) {
        html += '<p class="empty">No inventory is pinned to this ' + (placeMode === "system" ? "system" : "place") + '. Carried holds, such as the exosuit, stay off the map until you pin them. Nothing was uploaded.</p>';
      } else {
        html += locs.map(function (loc) {
          var rows = (loc.items || []).map(function (item) {
            var label = api.itemLabel(item, catalogIndex);
            var stack = item.maxStack ? (item.stackApproximate ? " ~" : " ") + "max " + item.maxStack : "";
            return "<li><span>" + esc(label) + "</span><span>" + esc(item.qty) + esc(stack) + "</span></li>";
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
          var label = (catalogIndex && catalogIndex.byId[row.demand.itemId] && catalogIndex.byId[row.demand.itemId].name) || row.demand.itemId;
          var report = row.report;
          html += "<li><strong>" + esc(row.project.name) + "</strong> · " + esc(label) + " · need " + esc(row.demand.qty) +
            " · here " + esc(report.atTarget) + " · elsewhere " + esc(report.elsewhere) +
            " · short " + esc(report.shortfall) + "</li>";
        });
        html += "</ul>";
      } else {
        html += '<p class="place-meta">No open demands for this ' + (placeMode === "system" ? "system" : "place") + ".</p>";
      }
      placeBody.innerHTML = html;
      var scopeBtn = document.getElementById("place-scope");
      if (scopeBtn) scopeBtn.addEventListener("click", function () {
        placeMode = placeMode === "system" ? "base" : "system";
        renderPlacePanel(openPlace, placeTitle ? placeTitle.textContent : "");
      });
      var closeBtn = document.getElementById("place-close");
      if (closeBtn) closeBtn.addEventListener("click", function () {
        state.selected = null;
        state.selectedFreight = null;
        state.selectedRef = null;
        renderPlacePanel(null);
        renderLists();
        draw();
      });
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

    function paintLabel(ctx, text, x, y, color, base) {
      ctx.font = "11px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      var w = ctx.measureText(text).width;
      ctx.fillStyle = withAlpha(base, 0.88);
      ctx.fillRect(x - 3, y - 8, w + 8, 16);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    }

    function paintName(ctx, text, x, y, off, color, base) {
      var name = String(text || "");
      if (name.length > 28) name = name.slice(0, 27) + "…";
      ctx.font = "11px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.textBaseline = "middle";
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
            if (state.selected === item.b.id) return 2;
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
          var on = state.selected === b.id || state.hover === b.id;
          var query = itemFilter ? String(itemFilter.value || "").trim() : "";
          var shade = !!(showStock && showStock.checked);
          var mark = (shade || query) ? stockMark(b) : null;
          ctx.save();
          if (query && mark && mark.hasQueryMatch === false) ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.fillStyle = c.accent;
          ctx.arc(x, y, on ? 6 : 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = on ? 2 : 1;
          ctx.strokeStyle = on ? c.ink : withAlpha(c.base, 0.85);
          ctx.stroke();
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
          }
        }
      });
      nameJobs.concat(pickedJobs).forEach(function (job) {
        paintName(ctx, job.text, job.x, job.y, job.off, c.accent, c.base);
      });
      refLabels.forEach(function (job) {
        paintLabel(ctx, job.text, job.x, job.y, c.ink, c.base);
      });
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
      var gcount = Object.keys(gset).length;
      if (mGal) mGal.textContent = state.fileName ? String(gcount || 1) : "1";
      var selected = null;
      state.planetary.forEach(function (b) { if (b.id === state.selected) selected = b; });
      if (mCenter) {
        mCenter.textContent = selected ? formatLy(selected.lyCenter).replace(" ly", "") : "—";
      }
      if (!baseList) return;
      if (!bases.length) {
        baseList.innerHTML = '<li class="empty">' + (state.fileName
          ? "No planetary bases in this galaxy" + (state.filter ? " match the filter." : ".")
          : "Load a save to list bases. Euclid Hub marks and quadrant references are already on the map.") + "</li>";
      } else {
        baseList.innerHTML = bases.map(function (b) {
          var on = state.selected === b.id ? "true" : "false";
          return '<li><button type="button" data-base="' + esc(b.id) + '" aria-pressed="' + on + '">' +
            '<span class="nm">' + esc(b.name) + "</span>" +
            '<span class="meta">' + esc(b.type) + " · " + esc(galaxyLabel(b.galaxy)) + " · " + esc(b.coords) +
            " · " + esc(formatLy(b.lyCenter)) + " from center" + esc(nearestHubLy(b)) + "</span>" +
            '<span class="glyphs">' + esc(b.glyphs) + "</span></button></li>";
        }).join("");
      }
      if (freightList) {
        var fr = state.freighters.filter(function (b) {
          return galaxyKey(b) === state.galaxy;
        });
        freightList.innerHTML = fr.length
          ? fr.map(function (b) {
            var on = state.selectedFreight === b.id ? "true" : "false";
            return '<li><button type="button" data-freight="' + esc(b.id) + '" aria-pressed="' + on + '">' +
              '<span class="nm">' + esc(b.name) + "</span><span class=\"meta\">" +
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
      var counts = Object.create(null);
      state.planetary.concat(state.freighters).forEach(function (b) {
        var key = galaxyKey(b);
        counts[key] = (counts[key] || 0) + 1;
      });
      if (!Object.keys(counts).length) counts[0] = 0;
      var known = anyKnownGalaxy();
      var ids = Object.keys(counts).map(function (k) { return Number(k); }).sort(function (a, b) { return a - b; });
      if (state.fileName && counts[state.galaxy] == null) {
        state.galaxy = ids.slice().sort(function (a, b) { return counts[b] - counts[a]; })[0];
      }
      galaxySel.innerHTML = ids.map(function (id) {
        var name = (!known && id === 0)
          ? (state.fileName ? "Euclid frame" : "Euclid")
          : (id === -1 ? "Galaxy unknown" : galaxyLabel(id));
        var label = name + (counts[id] ? " · " + counts[id] : "");
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
      if (state.problems.length) msg += " " + state.problems.length + " entr" + (state.problems.length === 1 ? "y" : "ies") + " could not be read.";
      setStatus(msg);
    }

    function refresh() {
      fillGalaxies();
      renderLists();
      renderRefList();
      draw();
      summarize();
    }

    function applyParsed(parsed, name, source) {
      state.fileName = name || (source === "hg" ? "save.hg" : "save.json");
      state.source = source || "";
      state.planetary = parsed.planetary;
      state.freighters = parsed.freighters;
      state.problems = parsed.problems;
      state.selected = null;
      state.selectedRef = null;
      state.hover = null;
      state.hoverRef = null;
      aim = null;
      var counts = Object.create(null);
      parsed.planetary.forEach(function (b) {
        if (b.galaxy == null) return;
        counts[b.galaxy] = (counts[b.galaxy] || 0) + 1;
      });
      var ids = Object.keys(counts);
      if (!ids.length) state.galaxy = 0;
      else state.galaxy = Number(ids.sort(function (a, b) { return counts[b] - counts[a]; })[0]);
      if (showHubs) showHubs.checked = state.galaxy === 0;
      if (showRefs) showRefs.checked = state.galaxy === 0;
      resetView();
      refresh();
      if (!parsed.planetary.length && parsed.freighters.length) {
        setStatus("Only freighter bases were found. They stay off the map and are listed separately. Nothing was uploaded.");
      }
    }

    function fail(code) {
      state.planetary = [];
      state.freighters = [];
      state.problems = [];
      state.selected = null;
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
      if (parsed.error) {
        fail(parsed.error);
        if (parsed.error === "missing" && unmapped) {
          setStatus("The local key map was applied, but no PlayerStateData was found under BaseContext or at the top level. Nothing was uploaded.");
        }
        return;
      }
      applyParsed(parsed, name, source);
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
      var held = next.locations.length;
      var flagged = next.skipped.length;
      setStatus((statusEl && statusEl.textContent ? statusEl.textContent + " " : "") +
        "Inventory: " + held + " hold" + (held === 1 ? "" : "s") +
        (flagged ? ", " + flagged + " section" + (flagged === 1 ? "" : "s") + " flagged." : ".") +
        " Shared with the logistics planner in this browser. Nothing was uploaded.");
      if (openPlace) renderPlacePanel(openPlace, placeTitle ? placeTitle.textContent : "");
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
      if (file.size > 48 * 1024 * 1024) {
        fail("big");
        return;
      }
      var reader = new FileReader();
      reader.onload = function () { handleBytes(new Uint8Array(reader.result), file.name); };
      reader.onerror = function () { setStatus("Could not read that file. Nothing was uploaded."); };
      reader.readAsArrayBuffer(file);
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
      var nextAim = h ? { x: h.ax != null ? h.ax : h.x, y: h.ay != null ? h.ay : h.y, kind: h.kind, id: h.id || null } : null;
      canvas.style.cursor = h ? "pointer" : "grab";
      var sameHover = next === state.hover && nextRef === state.hoverRef;
      var sameAim = (!nextAim && !aim) || (nextAim && aim && nextAim.kind === aim.kind && nextAim.id === aim.id && nextAim.x === aim.x && nextAim.y === aim.y);
      if (sameHover && sameAim) return;
      state.hover = next;
      state.hoverRef = nextRef;
      aim = nextAim;
      draw();
    });
    var mapWrap = canvas.closest ? canvas.closest(".map-wrap") : canvas.parentElement;
    if (mapWrap) {
      mapWrap.addEventListener("mouseleave", function () {
        if (drag) return;
        if (!state.hover && !state.hoverRef && !aim) return;
        state.hover = null;
        state.hoverRef = null;
        aim = null;
        draw();
      });
    }
    canvas.addEventListener("click", function (ev) {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      var h = hitTest(ev);
      if (!h) return;
      if (h.kind === "base") {
        state.selected = state.selected === h.id ? null : h.id;
        state.selectedFreight = null;
        if (state.selected) state.selectedRef = null;
        placeMode = "base";
        renderLists();
        renderRefList();
        draw();
        renderPlacePanel(state.selected ? placeOf(baseById(state.selected)) : null, state.selected ? (baseById(state.selected) || {}).name : "");
        var btn = baseList && baseList.querySelector('[data-base="' + h.id + '"]');
        if (btn) btn.focus();
        if (placePanel && !placePanel.hidden && placeTitle) placeTitle.focus();
      } else if (h.kind === "ref") {
        var ref = refById(h.id);
        state.selectedRef = state.selectedRef === h.id ? null : h.id;
        if (state.selectedRef) state.selected = null;
        state.selectedFreight = null;
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
          placeMode = "system";
          state.selectedFreight = null;
          setStatus(hub.label + (hub.note ? " · " + hub.note : "") + " — glyphs " + hub.glyphs + " — " + hub.coords + ". Euclid reference, not from your save.");
          renderPlacePanel({ glyphs: hub.glyphs, planet: null, galaxy: 0, name: hub.label, type: "Hub", coords: hub.coords }, hub.label);
        }
      } else if (h.kind === "center") {
        setStatus("Galactic center — voxel 0, 0, 0 on this schematic. Not a catalog star.");
      }
    });
    canvas.addEventListener("dblclick", function (ev) {
      var h = hitTest(ev);
      if (!h || h.kind !== "base") return;
      ev.preventDefault();
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
    canvas.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(ev.pointerId); } catch (err) { /* synthetic pointers */ }
      }
      pointers[ev.pointerId] = localPoint(ev);
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        var a = pointers[ids[0]];
        var b = pointers[ids[1]];
        drag = {
          pinch: true,
          moved: true,
          dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          zoom: view.zoom,
          panX: view.panX,
          panY: view.panY,
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2
        };
      } else {
        var p = pointers[ids[0]];
        drag = { pinch: false, moved: false, x: p.x, y: p.y, panX: view.panX, panY: view.panY };
      }
    });
    canvas.addEventListener("pointermove", function (ev) {
      if (!pointers[ev.pointerId]) return;
      pointers[ev.pointerId] = localPoint(ev);
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        var a = pointers[ids[0]];
        var b = pointers[ids[1]];
        if (!drag || !drag.pinch) {
          drag = {
            pinch: true,
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
        if (drag && drag.moved) {
          suppressClick = true;
          aim = null;
          state.hover = null;
        }
        drag = null;
        canvas.classList.remove("panning");
        canvas.style.cursor = "grab";
        return;
      }
      var p = pointers[ids[0]];
      drag = { pinch: false, moved: true, x: p.x, y: p.y, panX: view.panX, panY: view.panY };
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
        var btn = ev.target.closest ? ev.target.closest("[data-base]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-base");
        focusCluster(id);
        state.selectedFreight = null;
        placeMode = "base";
        renderLists();
        draw();
        renderPlacePanel(placeOf(baseById(id)), (baseById(id) || {}).name || "");
      });
    }

    if (freightList) {
      freightList.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-freight]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-freight");
        var ship = freightById(id);
        state.selected = null;
        state.selectedRef = null;
        state.selectedFreight = state.selectedFreight === id ? null : id;
        placeMode = "base";
        renderLists();
        draw();
        renderPlacePanel(state.selectedFreight && ship ? placeOf(ship) : null, ship ? ship.name : "");
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

    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var f = fileInput.files && fileInput.files[0];
        if (f) readFile(f);
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
        var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
        if (f) readFile(f);
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
        state.selectedRef = null;
        state.hover = null;
        state.hoverRef = null;
        aim = null;
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
      state.selected = null;
      state.hover = null;
      state.hoverRef = null;
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
      state.selected = null;
      state.selectedRef = null;
      state.hover = null;
      state.hoverRef = null;
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
      if (itemFilter) itemFilter.value = "";
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
    if (itemFilter) itemFilter.addEventListener("input", function () {
      draw();
      if (openPlace) renderPlacePanel(openPlace, placeTitle ? placeTitle.textContent : "");
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
    refresh();
    if (state.source === "browser") {
      setStatus("Restored bases and inventory from this browser. Nothing was uploaded.");
    }
    function openFromQuery() {
      var api = logisticsApi();
      if (!api) return;
      var q = api.parsePlaceQuery(window.location.search);
      if (!q.glyphs && !q.base) return;
      var match = null;
      state.planetary.concat(state.freighters).forEach(function (b) {
        if (match) return;
        if (q.glyphs && String(b.glyphs || "").toUpperCase() !== q.glyphs) return;
        if (q.base && b.name !== q.base) return;
        match = b;
      });
      if (!match) return;
      var freight = state.freighters.some(function (b) { return b.id === match.id; });
      if (match.galaxy != null) {
        state.galaxy = match.galaxy;
        if (galaxySel) galaxySel.value = String(state.galaxy);
        if (showHubs) showHubs.disabled = state.galaxy !== 0;
      }
      placeMode = "base";
      if (freight) {
        state.selected = null;
        state.selectedFreight = match.id;
        renderLists();
        draw();
      } else {
        state.selectedFreight = null;
        focusCluster(match.id);
        renderLists();
        draw();
      }
      renderPlacePanel(placeOf(match), match.name);
    }
    openFromQuery();
    window.addEventListener("load", openFromQuery);
    if (logisticsApi()) {
      fetch("data/graph-v2.json", { credentials: "same-origin" }).then(function (res) {
        if (!res.ok) throw new Error("graph");
        return res.json();
      }).then(function (catalog) {
        catalogIndex = logisticsApi().buildIndex(catalog);
        draw();
        if (openPlace) renderPlacePanel(openPlace, placeTitle ? placeTitle.textContent : "");
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
    mount: mount
  };
});
