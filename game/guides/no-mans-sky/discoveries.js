/*! discoveries.js — No Man's Sky discovery records for the galaxy map.
 *  Reads DiscoveryManagerData → DiscoveryData-v1 → Store/Available/Enqueued
 *  → Record. UA uses the same 48-bit portal code as a base GalacticAddress.
 *  Bits 48–55, when set, are kept as a reality candidate. A separate
 *  RealityIndex on the address is preferred. Nothing is uploaded.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NmsDiscoveries = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var TYPE_MAP = {
    planet: "planet",
    solarsystem: "system",
    system: "system",
    sector: "sector",
    animal: "fauna",
    fauna: "fauna",
    creature: "fauna",
    flora: "flora",
    plant: "flora",
    mineral: "mineral"
  };

  var BIOMES = [
    "Lush", "Toxic", "Scorched", "Radioactive", "Frozen", "Barren", "Dead", "Weird",
    "Red", "Green", "Blue", null, "Swamp", "Lava", "Waterworld", "Gas Giant"
  ];

  var DEFAULT_FILTERS = {
    planets: true,
    systems: true,
    flora: false,
    fauna: false,
    minerals: false
  };

  function normalizeType(dt) {
    var key = String(dt == null ? "" : dt).replace(/[\s_-]/g, "").toLowerCase();
    return TYPE_MAP[key] || "";
  }

  function vpNumber(v) {
    if (typeof v === "bigint") return v;
    if (typeof v === "number" && isFinite(v)) return BigInt(Math.trunc(v));
    if (typeof v !== "string") return null;
    var s = v.trim();
    try {
      if (/^-?0x[0-9a-f]+$/i.test(s)) return BigInt(s);
      if (/^-?\d+$/.test(s)) return BigInt(s);
    } catch (err) {
      return null;
    }
    return null;
  }

  function decodePlanetVp(vp) {
    if (!vp || vp.length < 2) return null;
    var flags = vpNumber(vp[1]);
    if (flags == null || flags < 0n) return null;
    var index = Number(flags & 0xFFFFn);
    var biome = index < BIOMES.length ? BIOMES[index] : null;
    if (index === 11) biome = null;
    return {
      biomeIndex: index,
      biome: biome || "",
      infested: (flags & 0x10000n) !== 0n
    };
  }

  function asUint64(raw, toBigInt) {
    var addr = toBigInt(raw);
    if (addr < 0n) {
      var mod = 1n << 64n;
      addr = ((addr % mod) + mod) % mod;
    }
    return addr;
  }

  function decodeDiscoveryAddress(raw, deps) {
    if (raw && typeof raw === "object") {
      var gx = raw.RealityIndex != null ? raw.RealityIndex : raw.realityIndex;
      var hasVoxels = raw.VoxelX != null || raw.voxelX != null || raw.VoxelZ != null || raw.voxelZ != null;
      var inner = raw.UA != null ? raw.UA : (raw.ua != null ? raw.ua : (raw.GalacticAddress != null ? raw.GalacticAddress : raw.galacticAddress));
      if (!hasVoxels && inner != null) {
        var nested = decodeDiscoveryAddress(inner, deps);
        if (gx != null && isFinite(Number(gx))) {
          nested.galaxy = Number(gx) & 255;
          nested.galaxySource = "reality";
        }
        return nested;
      }
    }
    var info = deps.decodeAddressField(raw);
    info.uaReality = null;
    info.galaxySource = info.galaxy != null ? "reality" : "unknown";
    if (raw == null || typeof raw === "object") return info;
    var addr = asUint64(raw, deps.toBigInt);
    if (addr > deps.portalMask) {
      info.uaReality = Number((addr >> 48n) & 0xFFn);
      if (info.galaxy == null) {
        info.galaxy = info.uaReality;
        info.galaxySource = "ua";
      }
    }
    return info;
  }

  function textOf(v) {
    if (v == null) return "";
    return String(v).trim();
  }

  function customNameOf(row, dm) {
    var sources = [dm, row];
    var keys = ["CN", "CustomName", "Name", "name"];
    var s;
    var i;
    var k;
    for (s = 0; s < sources.length; s++) {
      if (!sources[s] || typeof sources[s] !== "object") continue;
      for (k = 0; k < keys.length; k++) {
        var value = sources[s][keys[k]];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
    }
    return "";
  }

  function flagOf(fl, key) {
    if (!fl || typeof fl !== "object" || !Object.prototype.hasOwnProperty.call(fl, key)) return null;
    var n = Number(fl[key]);
    if (!isFinite(n)) return null;
    return n > 0;
  }

  function looksLikeDiscovery(row) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    var dd = row.DD || row.dd;
    if (dd && typeof dd === "object") return true;
    if (row.DT != null || row.dt != null || row.UA != null || row.ua != null) return true;
    return false;
  }

  function pushRecords(out, node, seen) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(function (row) { pushRecords(out, row, seen); });
      return;
    }
    if (typeof node !== "object") return;
    if (looksLikeDiscovery(node)) {
      if (seen.indexOf(node) !== -1) return;
      seen.push(node);
      out.push(node);
      return;
    }
    if (node.Record != null) pushRecords(out, node.Record, seen);
  }

  function recordsInBucket(bucket, seen) {
    var out = [];
    if (!bucket || typeof bucket !== "object") return out;
    ["Store", "Available", "Enqueued"].forEach(function (name) {
      pushRecords(out, bucket[name], seen);
    });
    if (bucket.Record != null) pushRecords(out, bucket.Record, seen);
    return out;
  }

  function collectRows(data) {
    var rows = [];
    var seen = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) return rows;
    var managers = [];
    function add(node) {
      if (node && typeof node === "object" && !Array.isArray(node)) managers.push(node);
    }
    add(data.DiscoveryManagerData);
    add(data["DiscoveryData-v1"]);
    add(data.DiscoveryData);
    if (data.BaseContext) add(data.BaseContext.DiscoveryManagerData);
    if (data.ExpeditionContext) add(data.ExpeditionContext.DiscoveryManagerData);
    if (data.PlayerStateData) add(data.PlayerStateData.DiscoveryManagerData);
    if (data.CommonStateData) add(data.CommonStateData.DiscoveryManagerData);
    if (data.Store || data.Record || data.Available || data.Enqueued) add(data);
    managers.forEach(function (manager) {
      var buckets = [];
      ["DiscoveryData-v1", "DiscoveryData", "DiscoveryDataV1"].forEach(function (key) {
        if (manager[key]) buckets.push(manager[key]);
      });
      Object.keys(manager).forEach(function (key) {
        var child = manager[key];
        if (!child || typeof child !== "object" || Array.isArray(child)) return;
        if (child.Store || child.Record || child.Available || child.Enqueued) buckets.push(child);
      });
      if (manager.Store || manager.Record || manager.Available || manager.Enqueued) buckets.push(manager);
      buckets.forEach(function (bucket) {
        recordsInBucket(bucket, seen).forEach(function (row) { rows.push(row); });
      });
    });
    return rows;
  }

  function parseRecord(row, deps, problems) {
    var dd = (row.DD && typeof row.DD === "object") ? row.DD : ((row.dd && typeof row.dd === "object") ? row.dd : row);
    var ua = dd.UA != null ? dd.UA : (dd.ua != null ? dd.ua : (row.UA != null ? row.UA : row.ua));
    var dt = dd.DT != null ? dd.DT : (dd.dt != null ? dd.dt : (row.DT != null ? row.DT : row.dt));
    if (ua == null || dt == null || dt === "") {
      problems.push({ name: "Discovery", detail: "A discovery record is missing UA or DT." });
      return null;
    }
    var kind = normalizeType(dt);
    if (!kind) {
      problems.push({ name: String(dt), detail: "Discovery type was not recognized." });
      return null;
    }
    var decoded;
    try {
      decoded = decodeDiscoveryAddress(ua, deps);
    } catch (err) {
      problems.push({ name: String(dt), detail: (err && err.message) || "Could not read UA." });
      return null;
    }
    var dm = (row.DM && typeof row.DM === "object") ? row.DM : ((row.dm && typeof row.dm === "object") ? row.dm : {});
    var ows = (row.OWS && typeof row.OWS === "object") ? row.OWS : ((row.ows && typeof row.ows === "object") ? row.ows : {});
    var fl = (row.FL && typeof row.FL === "object") ? row.FL : ((row.fl && typeof row.fl === "object") ? row.fl : {});
    var vp = Array.isArray(dd.VP) ? dd.VP : (Array.isArray(dd.vp) ? dd.vp : []);
    var biome = kind === "planet" ? decodePlanetVp(vp) : null;
    var ts = Number(ows.TS != null ? ows.TS : ows.ts);
    if (!isFinite(ts) || ts < 0) ts = 0;
    var owner = textOf(ows.USN != null ? ows.USN : ows.usn);
    var ownerId = textOf(ows.UID != null ? ows.UID : ows.uid);
    var rec = {
      kind: kind,
      dt: String(dt),
      ua: typeof ua === "object" ? "" : String(ua),
      galaxy: decoded.galaxy == null || !isFinite(decoded.galaxy) ? null : (Number(decoded.galaxy) & 255),
      galaxySource: decoded.galaxySource || "unknown",
      uaReality: decoded.uaReality == null ? null : decoded.uaReality,
      glyphs: decoded.glyphs,
      coords: decoded.coords,
      planet: decoded.planet,
      ssi: decoded.ssi,
      voxelX: decoded.voxelX,
      voxelY: decoded.voxelY,
      voxelZ: decoded.voxelZ,
      name: customNameOf(row, dm),
      biome: biome && biome.biome ? biome.biome : "",
      infested: !!(biome && biome.infested),
      uploaded: flagOf(fl, "U"),
      created: flagOf(fl, "C"),
      hidden: flagOf(fl, "H") === true,
      timestamp: ts,
      owner: owner,
      ownerId: ownerId,
      platform: textOf(ows.PTK != null ? ows.PTK : ows.ptk),
      rid: textOf(row.RID != null ? row.RID : row.rid),
      vp0: vp.length ? String(vp[0]) : "",
      raw: row
    };
    rec.dedupe = rec.rid
      ? "rid:" + rec.rid
      : [rec.kind, rec.glyphs, rec.galaxy == null ? "" : rec.galaxy, rec.vp0, rec.timestamp, rec.name].join("|");
    return rec;
  }

  function blankPlanet(index, glyphs) {
    return {
      index: index,
      name: "",
      glyphs: glyphs || "",
      biome: "",
      infested: false,
      uploaded: null,
      timestamp: 0,
      owner: "",
      ownerId: "",
      hidden: false,
      hasPlanetRecord: false,
      flora: 0,
      fauna: 0,
      minerals: 0
    };
  }

  function mergeFlag(current, next) {
    if (next === true || current === true) return true;
    if (next === false) return false;
    return current;
  }

  function ensurePlanet(sys, rec) {
    var idx = rec.planet;
    if (!sys.planets[idx]) sys.planets[idx] = blankPlanet(idx, rec.glyphs);
    return sys.planets[idx];
  }

  function noteOwnership(target, rec, prefer) {
    target.uploaded = mergeFlag(target.uploaded, rec.uploaded);
    if (rec.hidden) target.hidden = true;
    if (rec.owner && (prefer || !target.owner)) target.owner = rec.owner;
    if (rec.ownerId && (prefer || !target.ownerId)) target.ownerId = rec.ownerId;
    if (rec.timestamp && (prefer || !target.timestamp)) target.timestamp = rec.timestamp;
  }

  function withPlanetGlyph(glyphs, planet) {
    var g = String(glyphs || "").toUpperCase();
    if (g.length !== 12) return g;
    var p = (Number(planet) & 0xF).toString(16).toUpperCase();
    return p + g.slice(1);
  }

function buildSystem(rows, galaxy) {
  var first = rows[0];
  var sys = {
    id: "",
    galaxy: galaxy,
    galaxySource: "unknown",
    voxelX: first.voxelX,
    voxelY: first.voxelY,
    voxelZ: first.voxelZ,
    ssi: first.ssi,
    glyphs: withPlanetGlyph(first.glyphs, 0),
    coords: first.coords,
    systemName: "",
    hasSystem: false,
    systemUploaded: null,
    systemTimestamp: 0,
    systemOwner: "",
    systemOwnerId: "",
    planets: Object.create(null),
    planetCount: 0,
    flora: 0,
    fauna: 0,
    minerals: 0,
    sectors: 0,
    hidden: 0
  };
  var systemOwn = { uploaded: null, timestamp: 0, owner: "", ownerId: "", hidden: false };
  var sawReality = false;
  var sawUa = false;
  rows.forEach(function (rec) {
    if (rec.galaxySource === "reality") sawReality = true;
    else if (rec.galaxySource === "ua") sawUa = true;
    if (rec.kind === "system") {
      sys.hasSystem = true;
      if (rec.name) sys.systemName = rec.name;
      sys.glyphs = rec.glyphs;
      noteOwnership(systemOwn, rec, true);
    } else if (rec.kind === "sector") {
      sys.sectors += 1;
    } else if (rec.kind === "planet") {
      var planet = ensurePlanet(sys, rec);
      if (!planet.hasPlanetRecord) sys.planetCount += 1;
      planet.hasPlanetRecord = true;
      if (rec.name) planet.name = rec.name;
      if (rec.biome) planet.biome = rec.biome;
      if (rec.infested) planet.infested = true;
      planet.glyphs = rec.glyphs;
      noteOwnership(planet, rec, true);
    } else if (rec.kind === "flora" || rec.kind === "fauna" || rec.kind === "mineral") {
      var slot = ensurePlanet(sys, rec);
      var countKey = rec.kind === "mineral" ? "minerals" : rec.kind;
      slot[countKey] += 1;
      sys[countKey] += 1;
      if (rec.hidden) slot.hidden = true;
      if (rec.name) {
        if (!slot.named) slot.named = [];
        var label = rec.kind + " · " + rec.name;
        if (slot.named.length < 6 && slot.named.indexOf(label) === -1) slot.named.push(label);
      }
    }
    if (rec.hidden) sys.hidden += 1;
  });
  sys.systemUploaded = systemOwn.uploaded;
  sys.systemTimestamp = systemOwn.timestamp;
  sys.systemOwner = systemOwn.owner;
  sys.systemOwnerId = systemOwn.ownerId;
  if (sawReality) sys.galaxySource = "reality";
  else if (sawUa) sys.galaxySource = "ua";
  var indexes = Object.keys(sys.planets).map(function (n) { return Number(n); });
  indexes.sort(function (a, b) { return a - b; });
  sys.planetList = indexes.map(function (n) { return sys.planets[n]; });
  delete sys.planets;
  return sys;
}

  function groupDiscoveries(records, lyBetween) {
    var buckets = Object.create(null);
    var order = [];
    (records || []).forEach(function (rec) {
      var key = rec.voxelX + ":" + rec.voxelY + ":" + rec.voxelZ + ":" + rec.ssi;
      if (!buckets[key]) {
        buckets[key] = [];
        order.push(key);
      }
      buckets[key].push(rec);
    });
    var systems = [];
    order.forEach(function (key) {
      var rows = buckets[key];
      var byGal = Object.create(null);
      var unknown = [];
      var gorder = [];
      rows.forEach(function (rec) {
        if (rec.galaxy == null) {
          unknown.push(rec);
          return;
        }
        var g = String(rec.galaxy);
        if (!byGal[g]) {
          byGal[g] = [];
          gorder.push(g);
        }
        byGal[g].push(rec);
      });
      if (!gorder.length) {
        systems.push(buildSystem(unknown, null));
        return;
      }
      gorder.sort(function (a, b) { return byGal[b].length - byGal[a].length; });
      gorder.forEach(function (g, i) {
        var list = byGal[g].slice();
        if (i === 0) list = list.concat(unknown);
        systems.push(buildSystem(list, Number(g)));
      });
    });
    systems.sort(function (a, b) {
      var ag = a.galaxy == null ? -1 : a.galaxy;
      var bg = b.galaxy == null ? -1 : b.galaxy;
      if (ag !== bg) return ag - bg;
      if (a.voxelX !== b.voxelX) return a.voxelX - b.voxelX;
      if (a.voxelZ !== b.voxelZ) return a.voxelZ - b.voxelZ;
      return a.ssi - b.ssi;
    });
    systems.forEach(function (sys, i) {
      sys.id = "d" + i;
      sys.lyCenter = lyBetween ? lyBetween(sys, { voxelX: 0, voxelY: 0, voxelZ: 0 }) : 0;
      sys.name = sys.systemName || sys.glyphs;
    });
    return systems;
  }

  function extractDiscoveries(data, deps) {
    var problems = [];
    var records = [];
    var seen = Object.create(null);
    if (!deps || !deps.decodeAddressField || !deps.toBigInt) {
      return { records: [], systems: [], problems: [{ name: "Discoveries", detail: "Address decoder is missing." }] };
    }
    collectRows(data).forEach(function (row) {
      var rec = parseRecord(row, deps, problems);
      if (!rec) return;
      if (seen[rec.dedupe]) return;
      seen[rec.dedupe] = true;
      records.push(rec);
    });
    return {
      records: records,
      systems: groupDiscoveries(records, deps.lyBetween),
      problems: problems
    };
  }

  function dominantBaseGalaxy(bases) {
    var counts = Object.create(null);
    (bases || []).forEach(function (b) {
      if (!b || b.galaxy == null || !isFinite(Number(b.galaxy))) return;
      var g = String(Number(b.galaxy) & 255);
      counts[g] = (counts[g] || 0) + 1;
    });
    var ids = Object.keys(counts);
    if (!ids.length) return null;
    ids.sort(function (a, b) { return counts[b] - counts[a]; });
    return Number(ids[0]);
  }

  function placeDiscoveryGalaxies(systems, bases) {
    var fallback = dominantBaseGalaxy(bases);
    var source = fallback == null ? "euclid" : "bases";
    if (fallback == null) fallback = 0;
    (systems || []).forEach(function (sys) {
      if (sys.galaxy == null) {
        sys.galaxy = fallback;
        sys.galaxySource = source;
      }
    });
    return systems;
  }

  function mergeSaveDocuments(docs, deps) {
    var list = (docs || []).filter(function (doc) { return doc && typeof doc === "object" && !Array.isArray(doc); });
    var best = null;
    var bestBases = -1;
    list.forEach(function (doc) {
      var n = 0;
      var player = null;
      if (doc.BaseContext && doc.BaseContext.PlayerStateData) player = doc.BaseContext.PlayerStateData;
      else if (doc.PlayerStateData) player = doc.PlayerStateData;
      if (player && Array.isArray(player.PersistentPlayerBases)) n = player.PersistentPlayerBases.length;
      if (!best || n > bestBases) {
        best = doc;
        bestBases = n;
      }
    });
    var merged = best ? JSON.parse(JSON.stringify(best)) : {};
    var records = [];
    var seen = Object.create(null);
    list.forEach(function (doc) {
      extractDiscoveries(doc, deps).records.forEach(function (rec) {
        if (!rec.raw || seen[rec.dedupe]) return;
        seen[rec.dedupe] = true;
        records.push(rec.raw);
      });
    });
    merged.DiscoveryManagerData = { "DiscoveryData-v1": { Store: { Record: records } } };
    return merged;
  }

  function systemMatchesFilters(sys, filters) {
    var f = filters || DEFAULT_FILTERS;
    if (!sys) return false;
    if (f.systems && sys.hasSystem) return true;
    if (f.planets && sys.planetCount > 0) return true;
    if (f.flora && sys.flora > 0) return true;
    if (f.fauna && sys.fauna > 0) return true;
    if (f.minerals && sys.minerals > 0) return true;
    return false;
  }

  function systemSearchText(sys) {
    var names = (sys.planetList || []).map(function (p) { return p.name || ""; }).join(" ");
    return (sys.systemName + " " + sys.name + " " + sys.glyphs + " " + sys.coords + " " + names).toLowerCase();
  }

  function filterDiscoverySystems(systems, opts) {
    opts = opts || {};
    var q = String(opts.query || "").trim().toLowerCase();
    var galaxy = opts.galaxy;
    var filters = opts.filters || DEFAULT_FILTERS;
    return (systems || []).filter(function (sys) {
      if (galaxy != null && Number(sys.galaxy) !== Number(galaxy)) return false;
      if (!systemMatchesFilters(sys, filters)) return false;
      if (!q) return true;
      return systemSearchText(sys).indexOf(q) !== -1;
    });
  }

  function discoveryTotals(systems) {
    var t = { systems: 0, planets: 0, flora: 0, fauna: 0, minerals: 0, sectors: 0 };
    (systems || []).forEach(function (sys) {
      t.systems += 1;
      t.planets += sys.planetCount || 0;
      t.flora += sys.flora || 0;
      t.fauna += sys.fauna || 0;
      t.minerals += sys.minerals || 0;
      t.sectors += sys.sectors || 0;
    });
    return t;
  }

  function galaxyBreakdown(systems) {
    var counts = Object.create(null);
    (systems || []).forEach(function (sys) {
      var g = sys.galaxy == null ? 0 : sys.galaxy;
      var key = String(g);
      if (!counts[key]) counts[key] = { galaxy: g, systems: 0, planets: 0 };
      counts[key].systems += 1;
      counts[key].planets += sys.planetCount || 0;
    });
    return Object.keys(counts).map(function (key) { return counts[key]; }).sort(function (a, b) {
      return a.galaxy - b.galaxy;
    });
  }

  function discoveryCellSize(zoom) {
    if (!(zoom > 0) || !isFinite(zoom)) return 48;
    if (zoom >= 8) return 0;
    if (zoom >= 3.5) return 28;
    return 48;
  }

  function clusterScreenMarkers(markers, cellPx) {
    var list = markers || [];
    if (!cellPx || cellPx <= 0 || list.length < 2) {
      return list.map(function (m) {
        return { clustered: false, x: m.x, y: m.y, items: [m] };
      });
    }
    var bins = Object.create(null);
    var order = [];
    list.forEach(function (m) {
      var key = Math.floor(m.x / cellPx) + ":" + Math.floor(m.y / cellPx);
      if (!bins[key]) {
        bins[key] = { clustered: true, x: 0, y: 0, items: [] };
        order.push(key);
      }
      bins[key].items.push(m);
      bins[key].x += m.x;
      bins[key].y += m.y;
    });
    return order.map(function (key) {
      var bin = bins[key];
      if (bin.items.length === 1) {
        return { clustered: false, x: bin.items[0].x, y: bin.items[0].y, items: bin.items };
      }
      bin.x /= bin.items.length;
      bin.y /= bin.items.length;
      return bin;
    });
  }

  function formatDiscoveryTime(ts) {
    var n = Number(ts);
    if (!isFinite(n) || n <= 0) return "";
    var ms = n > 1e12 ? n : n * 1000;
    var d = new Date(ms);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  }

  function uploadLabel(flag, ts) {
    var when = formatDiscoveryTime(ts);
    if (flag === true) return "Uploaded" + (when ? " · " + when : "");
    if (flag === false) return "Not uploaded" + (when ? " · recorded " + when : "");
    return when ? "Recorded " + when : "Upload flag not in this record";
  }

  function packAddress(planet, ssi, vx, vy, vz, galaxy) {
    var x = ((vx % 4096) + 4096) % 4096;
    var y = ((vy % 256) + 256) % 256;
    var z = ((vz % 4096) + 4096) % 4096;
    var portal = (BigInt(planet & 0xF) << 44n) |
      (BigInt(ssi & 0xFFF) << 32n) |
      (BigInt(y & 0xFF) << 24n) |
      (BigInt(z & 0xFFF) << 12n) |
      BigInt(x & 0xFFF);
    var body = portal.toString(16).toUpperCase().padStart(12, "0");
    if (galaxy) body = (Number(galaxy) & 0xFF).toString(16).toUpperCase().padStart(2, "0") + body;
    return "0x" + body;
  }

  function discoveryMarkerLabel(sys) {
    if (!sys) return "Discovered system";
    var name = textOf(sys.systemName);
    if (name) return name;
    var n = sys.planetCount || 0;
    if (n === 1) return "1 planet";
    if (n > 1) return n + " planets";
    return "Discovered system";
  }

  function syntheticDiscoveryDocument(opts) {
    opts = opts || {};
    var systems = opts.systems == null ? 8 : opts.systems;
    var planetsEach = opts.planetsEach == null ? 4 : opts.planetsEach;
    var floraEach = opts.floraEach == null ? 12 : opts.floraEach;
    var records = [];
    var enqueued = [];
    var t0 = 1700000000;
    var baseGlyphs = "";
    // Three systems sit a short hop apart so a wide view clusters them.
    // The rest are hundreds of voxels away, one in another galaxy.
    var layouts = [
      { x: 480, z: -800, name: "Amber Reach" },
      { x: 590, z: -750, name: "Amber Watch" },
      { x: 530, z: -680, name: "Amber Drift" },
      { x: -1380, z: 860, name: "Northwater" },
      { x: 1240, z: 980, name: "Red Shore" },
      { x: -820, z: -1460, name: "Glass Expanse" },
      { x: 1620, z: -240, name: "Bright Rim" },
      { x: 300, z: 1100, name: "Far Elkupalos", galaxy: 10 }
    ];
    var s;
    for (s = 0; s < systems; s++) {
      var layout = layouts[s] || { x: 200 + s * 90, z: -200 - s * 40, name: "Synthetic System " + s };
      var galaxy = layout.galaxy != null ? layout.galaxy : (s === systems - 1 && systems > 1 ? 10 : 0);
      var vx = layout.x;
      var vz = layout.z;
      var vy = (s % 5) - 2;
      var ssi = 0x120 + s;
      function pack(planet) { return packAddress(planet, ssi, vx, vy, vz, galaxy); }
      records.push({
        DD: { UA: pack(0), DT: "SolarSystem", VP: [] },
        DM: { CN: layout.name || "" },
        OWS: { USN: "Traveller", UID: "0", TS: t0 + s, PTK: "ST", LID: "" },
        FL: { U: 1, C: 1 },
        RID: "synthetic-system-" + s
      });
      var p;
      for (p = 1; p <= planetsEach; p++) {
        var planetUa = pack(p);
        if (!baseGlyphs && galaxy === 0 && s === 3 && p === 1) baseGlyphs = planetUa.slice(2);
        records.push({
          DD: { UA: planetUa, DT: "Planet", VP: ["0x11", (p + s) % 16] },
          DM: { CN: p === 1 ? "Synthetic Planet " + s : "" },
          OWS: { USN: "Traveller", UID: "0", TS: t0 + s * 20 + p, PTK: "ST", LID: "" },
          FL: { U: p % 2, C: 1 }
        });
        var f;
        for (f = 0; f < floraEach; f++) {
          records.push({
            DD: { UA: planetUa, DT: "Flora", VP: ["0x" + (s * 1000 + p * 40 + f).toString(16)] },
            DM: {},
            OWS: { USN: "Traveller", TS: t0 + f, PTK: "ST" },
            FL: { U: 1 }
          });
        }
        if (p === 1) {
          records.push({
            DD: { UA: planetUa, DT: "Animal", VP: ["0xA"] },
            DM: { CN: "Synthetic Beast " + s },
            OWS: { USN: "Traveller", TS: t0 + 5, PTK: "ST" },
            FL: { U: 0, C: 1 }
          });
          enqueued.push({
            DD: { UA: planetUa, DT: "Mineral", VP: ["0xB"] },
            DM: {},
            OWS: { TS: t0 + 8 },
            FL: {}
          });
        }
      }
    }
    return {
      Version: 4720,
      Platform: "Synthetic",
      PlayerStateData: {
        UniverseAddress: {
          RealityIndex: 0,
          GalacticAddress: { VoxelX: 0, VoxelY: 0, VoxelZ: 0, SolarSystemIndex: 1, PlanetIndex: 1 }
        },
        PersistentPlayerBases: baseGlyphs ? [{
          Name: "Synthetic Camp",
          BaseType: { PersistentBaseTypes: "PlanetBase" },
          GalacticAddress: baseGlyphs
        }] : []
      },
      DiscoveryManagerData: {
        "DiscoveryData-v1": {
          ReserveStore: records.length,
          Store: { Record: records },
          Enqueued: { Record: enqueued }
        }
      }
    };
  }

  return {
    DEFAULT_FILTERS: DEFAULT_FILTERS,
    normalizeType: normalizeType,
    decodePlanetVp: decodePlanetVp,
    decodeDiscoveryAddress: decodeDiscoveryAddress,
    extractDiscoveries: extractDiscoveries,
    groupDiscoveries: groupDiscoveries,
    dominantBaseGalaxy: dominantBaseGalaxy,
    placeDiscoveryGalaxies: placeDiscoveryGalaxies,
    mergeSaveDocuments: mergeSaveDocuments,
    systemMatchesFilters: systemMatchesFilters,
    filterDiscoverySystems: filterDiscoverySystems,
    discoveryTotals: discoveryTotals,
    galaxyBreakdown: galaxyBreakdown,
    discoveryCellSize: discoveryCellSize,
    clusterScreenMarkers: clusterScreenMarkers,
    formatDiscoveryTime: formatDiscoveryTime,
    uploadLabel: uploadLabel,
    discoveryMarkerLabel: discoveryMarkerLabel,
    packAddress: packAddress,
    syntheticDiscoveryDocument: syntheticDiscoveryDocument
  };
});
