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
    return String(text).replace(/("(?:GalacticAddress|galacticAddress|oZw)"\s*:\s*)(-?\d+)/g, '$1"$2"');
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
    var drop = document.getElementById("drop");
    if (!canvas) return;

    var hubs = hubMarks();
    var state = {
      planetary: [],
      freighters: [],
      problems: [],
      galaxy: 0,
      selected: null,
      hover: null,
      filter: "",
      fileName: "",
      source: ""
    };
    var hits = [];
    var starCache = null;

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg || "";
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

    function project(vx, vz, w, h) {
      var cx = w / 2;
      var cy = h / 2;
      var rx = Math.min(w, h * 1.35) * 0.42;
      var ry = rx * 0.72;
      if (ry > h * 0.40) {
        ry = h * 0.40;
        rx = ry / 0.72;
      }
      var R = 2048;
      return {
        x: cx + (vx / R) * rx,
        y: cy - (vz / R) * ry,
        cx: cx,
        cy: cy,
        rx: rx,
        ry: ry
      };
    }

    function ensureStars(w, h, c) {
      var key = w + "x" + h + "|" + c.accent + "|" + c.faint + "|" + c.base;
      if (starCache && starCache.key === key) return starCache.canvas;
      var off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      var ctx = off.getContext("2d");
      var frame = project(0, 0, w, h);
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
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(280, Math.round(rect.width || canvas.clientWidth || 640));
      var h = Math.max(260, Math.round(rect.height || 480));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var c = colors();
      ctx.drawImage(ensureStars(w, h, c), 0, 0, w, h);
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
            hits.push({ x: p.x, y: y, r: 11, kind: "hub", id: hub.id });
          });
        });
      }

      var bases = visibleBases();
      var groups = Object.create(null);
      bases.forEach(function (b) {
        var key = b.voxelX + ":" + b.voxelZ;
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
      });
      bases.forEach(function (b) {
        var key = b.voxelX + ":" + b.voxelZ;
        var group = groups[key];
        var idx = group.indexOf(b);
        var p = project(b.voxelX, b.voxelZ, w, h);
        var jx = 0;
        var jy = 0;
        if (group.length > 1) {
          var ang = (idx / group.length) * Math.PI * 2;
          jx = Math.cos(ang) * 8;
          jy = Math.sin(ang) * 8;
        }
        var x = p.x + jx;
        var y = p.y + jy;
        var on = state.selected === b.id || state.hover === b.id;
        ctx.beginPath();
        ctx.fillStyle = c.accent;
        ctx.arc(x, y, on ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = on ? 2 : 1;
        ctx.strokeStyle = on ? c.ink : withAlpha(c.base, 0.85);
        ctx.stroke();
        if (on) paintLabel(ctx, b.name, x + 10, y - 12, c.accent, c.base);
        hits.push({ x: x, y: y, r: 10, kind: "base", id: b.id });
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
          : "Load a save to list bases. Euclid Hub marks are already on the map.") + "</li>";
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
            return "<li><span class=\"nm\">" + esc(b.name) + "</span><span class=\"meta\">" +
              esc(b.type) + " · " + esc(galaxyLabel(b.galaxy)) + " · " + esc(b.glyphs) +
              "</span><span class=\"glyphs\">Not plotted</span></li>";
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
    }

    function summarize() {
      if (!state.fileName) {
        setStatus("Ready — Euclid schematic with Hub marks. Choose exported JSON or a Steam save. Nothing is uploaded.");
        return;
      }
      var here = visibleBases().length;
      var freightHere = state.freighters.filter(function (b) { return galaxyKey(b) === state.galaxy; }).length;
      var via = state.source === "hg" ? "Steam save" : (state.source === "json" ? "exported JSON" : "");
      var msg = state.fileName + (via ? " — " + via : "") + " — " + here + " planetary base" + (here === 1 ? "" : "s") +
        " on this map, " + freightHere + " freighter" + (freightHere === 1 ? "" : "s") + " listed aside.";
      if (state.problems.length) msg += " " + state.problems.length + " entr" + (state.problems.length === 1 ? "y" : "ies") + " could not be read.";
      setStatus(msg);
    }

    function refresh() {
      fillGalaxies();
      renderLists();
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
      state.hover = null;
      var counts = Object.create(null);
      parsed.planetary.forEach(function (b) {
        if (b.galaxy == null) return;
        counts[b.galaxy] = (counts[b.galaxy] || 0) + 1;
      });
      var ids = Object.keys(counts);
      if (!ids.length) state.galaxy = 0;
      else state.galaxy = Number(ids.sort(function (a, b) { return counts[b] - counts[a]; })[0]);
      if (showHubs) showHubs.checked = state.galaxy === 0;
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
    }

    function handleBytes(buf, name) {
      var token = ++loadGen;
      var decoded;
      try {
        decoded = bytesToSaveText(buf);
      } catch (err) {
        if (token !== loadGen) return;
        fail(err && err.code === "hg" ? "hg" : "unknown");
        return;
      }
      var trimmed = String(decoded.text || "").replace(/^\uFEFF/, "").trim();
      var head = trimmed.charAt(0);
      if (head !== "{" && head !== "[") {
        if (token !== loadGen) return;
        fail("binary");
        return;
      }
      var data;
      try {
        data = JSON.parse(quoteGalacticAddresses(trimmed));
      } catch (err) {
        if (token !== loadGen) return;
        fail("json");
        setStatus(decoded.format === "hg"
          ? "The Steam save opened, but its contents were not readable JSON. Nothing was uploaded."
          : "That file starts like JSON, but it could not be parsed. Export it again from NomNom or NMS Save Editor. Nothing was uploaded.");
        return;
      }
      if (token !== loadGen) return;
      if (!needsUnmap(data)) {
        consumeSave(data, name, false, decoded.format);
        return;
      }
      setStatus("Reading the local key map… The save stays in this browser.");
      ensureMapping().then(function (table) {
        if (token !== loadGen) return;
        consumeSave(unmapTree(data, table), name, true, decoded.format);
      }).catch(function () {
        if (token !== loadGen) return;
        fail("map");
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

    canvas.addEventListener("mousemove", function (ev) {
      var h = hitTest(ev);
      state.hover = h && h.kind === "base" ? h.id : null;
      canvas.style.cursor = h ? "pointer" : "crosshair";
      draw();
    });
    canvas.addEventListener("mouseleave", function () {
      state.hover = null;
      draw();
    });
    canvas.addEventListener("click", function (ev) {
      var h = hitTest(ev);
      if (!h) return;
      if (h.kind === "base") {
        state.selected = state.selected === h.id ? null : h.id;
        renderLists();
        draw();
        var btn = baseList && baseList.querySelector('[data-base="' + h.id + '"]');
        if (btn) btn.focus();
      } else if (h.kind === "hub") {
        var hub = hubById(h.id);
        if (hub) setStatus(hub.label + (hub.note ? " · " + hub.note : "") + " — glyphs " + hub.glyphs + " — " + hub.coords + ". Euclid reference, not from your save.");
      } else if (h.kind === "center") {
        setStatus("Galactic center — voxel 0, 0, 0 on this schematic. Not a catalog star.");
      }
    });

    if (baseList) {
      baseList.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("[data-base]") : null;
        if (!btn) return;
        var id = btn.getAttribute("data-base");
        state.selected = state.selected === id ? null : id;
        renderLists();
        draw();
      });
    }

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
        renderLists();
        draw();
        summarize();
      });
    }
    if (filterInput) {
      filterInput.addEventListener("input", function () {
        state.filter = filterInput.value || "";
        renderLists();
        draw();
      });
    }
    if (showCenter) showCenter.addEventListener("change", draw);
    if (showHubs) showHubs.addEventListener("change", draw);

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
      state.hover = null;
      state.filter = "";
      state.fileName = "";
      state.source = "";
      state.galaxy = 0;
      if (filterInput) filterInput.value = "";
      if (fileInput) fileInput.value = "";
      if (showHubs) { showHubs.checked = true; showHubs.disabled = false; }
      if (showCenter) showCenter.checked = true;
      refresh();
      setStatus("Cleared. Euclid Hub marks stay on the map. Nothing was uploaded.");
    });

    window.addEventListener("resize", draw);
    window.addEventListener("load", draw);
    if (typeof MutationObserver === "function") {
      new MutationObserver(function () {
        starCache = null;
        draw();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    refresh();
  }

  return {
    HUBS: HUBS,
    analyzeGlyphs: analyzeGlyphs,
    decodeGalacticAddress: decodeGalacticAddress,
    decodeAddressField: decodeAddressField,
    quoteGalacticAddresses: quoteGalacticAddresses,
    extractBases: extractBases,
    playerStateOf: playerStateOf,
    looksBinary: looksBinary,
    hubMarks: hubMarks,
    lz4BlockDecompress: lz4BlockDecompress,
    decompressHg: decompressHg,
    detectSaveFormat: detectSaveFormat,
    bytesToSaveText: bytesToSaveText,
    stripTrailingNulls: stripTrailingNulls,
    mappingFromJson: mappingFromJson,
    unmapTree: unmapTree,
    needsUnmap: needsUnmap,
    mount: mount
  };
});
