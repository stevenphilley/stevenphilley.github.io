/*! logistics.js — inventory and production plan for the No Man's Sky guide.
 *  The planner store lives in localStorage under nms-logistics.
 *  Save files are read in the browser. Nothing is uploaded.
 *  Item quantities are taken only from numeric Amount fields.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NmsLogistics = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STORE_KEY = "nms-logistics";

  // Reality-table ids that have stayed stable in the game files. Anything
  // not in this list, and not in the material graph, stays as the raw id.
  var SAVE_IDS = {
    FUEL1: "carbon",
    FUEL2: "condensed-carbon",
    OXYGEN: "oxygen",
    LAUNCHSUB: "di-hydrogen",
    ROCKETSUB: "tritium",
    CATALYST1: "sodium",
    CATALYST2: "sodium-nitrate",
    CAVE1: "cobalt",
    CAVE2: "ionised-cobalt",
    YELLOW2: "copper",
    RED2: "cadmium",
    GREEN2: "emeril",
    BLUE2: "indium",
    STELLAR2: "chromatic-metal",
    LAND1: "ferrite-dust",
    LAND2: "pure-ferrite",
    LAND3: "magnetised-ferrite",
    SAND1: "silicate-powder",
    WATER1: "salt",
    WATER2: "chlorine",
    GAS1: "sulphurine",
    GAS2: "radon",
    GAS3: "nitrogen",
    EX_YELLOW: "uranium",
    EX_RED: "phosphorus",
    EX_GREEN: "ammonia",
    EX_BLUE: "dioxite",
    CREATURE1: "mordite",
    PLANT_POOP: "faecium",
    JUNK: "rusted-metal",
    CASING: "metal-plating",
    CARBON_SEAL: "hermetic-seal",
    NANOTUBES: "carbon-nanotubes",
    MICROCHIP: "microprocessor",
    ANTIMATTER: "antimatter",
    HYPERFUEL1: "warp-cell",
    POWERCELL: "ion-battery",
    PRODFUEL2: "life-support-gel",
    JELLY: "di-hydrogen-jelly",
    GLASS: "glass"
  };

  var CATEGORIES = {
    exosuit: "Exosuit",
    ship: "Starship",
    freighter: "Freighter",
    frigate: "Frigate",
    container: "Storage container",
    base: "Base",
    multitool: "Multi-tool",
    exocraft: "Exocraft",
    settlement: "Settlement",
    custom: "Custom",
    other: "Other"
  };

  function emptyStore() {
    return {
      version: 1,
      savedAt: null,
      source: null,
      bases: { planetary: [], freighters: [], problems: [] },
      locations: [],
      projects: [],
      production: [],
      skipped: []
    };
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function norm(value) {
    return String(value == null ? "" : value).trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, " ");
  }

  function loose(value) {
    return norm(value).replace(/-/g, " ");
  }

  function posInt(value) {
    var n = typeof value === "number" ? value : Number(value);
    if (!isFinite(n) || Math.trunc(n) !== n || n <= 0 || n > 1000000000) return null;
    return n;
  }

  function nonNegInt(value) {
    var n = typeof value === "number" ? value : Number(value);
    if (!isFinite(n) || Math.trunc(n) !== n || n < 0 || n > 1000000000) return null;
    return n;
  }

  function text(value) {
    if (value == null) return "";
    return String(value).replace(/\0/g, "").trim();
  }

  function inventoryType(type) {
    if (type == null) return "";
    if (typeof type === "string") return type.trim();
    if (typeof type === "object") {
      var inner = type.InventoryType != null ? type.InventoryType : type.inventoryType;
      if (typeof inner === "string") return inner.trim();
    }
    return "";
  }

  function gridInt(value) {
    var n = typeof value === "number" ? value : Number(value);
    if (!isFinite(n) || Math.trunc(n) !== n || n <= 0 || n > 100) return null;
    return n;
  }

  function buildIndex(catalog) {
    var byId = Object.create(null);
    var byKey = Object.create(null);
    function add(key, id) {
      var k = norm(key);
      if (!k || !id) return;
      if (!byKey[k]) byKey[k] = [];
      if (byKey[k].indexOf(id) === -1) byKey[k].push(id);
    }
    ((catalog && catalog.nodes) || []).forEach(function (node) {
      if (!node || !node.id) return;
      byId[node.id] = node;
      add(node.id, node.id);
      add(node.name, node.id);
      add(node.short, node.id);
      (node.aliases || []).forEach(function (alias) { add(alias, node.id); });
    });
    Object.keys(SAVE_IDS).forEach(function (raw) { add(raw, SAVE_IDS[raw]); });
    return { byId: byId, byKey: byKey };
  }

  function resolveSaveId(raw, index) {
    var id = text(raw);
    if (!id) return null;
    if (SAVE_IDS[id] && (!index || !index.byId || index.byId[SAVE_IDS[id]] || !index.byId)) {
      return { id: SAVE_IDS[id], rawId: id, known: true };
    }
    var hyphen = id.toLowerCase().replace(/_/g, "-");
    if (index && index.byId && index.byId[hyphen]) return { id: hyphen, rawId: id, known: true };
    var key = norm(id);
    if (index && index.byKey && index.byKey[key] && index.byKey[key].length === 1) {
      return { id: index.byKey[key][0], rawId: id, known: true };
    }
    return { id: id, rawId: id, known: false };
  }

  function itemLabel(item, index) {
    if (!item) return "";
    if (item.name) return item.name;
    var node = index && index.byId && index.byId[item.id];
    if (node && node.name) return node.name;
    return item.rawId || item.id || "";
  }

  function readContainer(node) {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      return { ok: false, reason: "not a container" };
    }
    var slots = node.Slots != null ? node.Slots : node.slots;
    if (!Array.isArray(slots)) return { ok: false, reason: "no Slots list" };
    var width = gridInt(node.Width != null ? node.Width : node.width);
    var height = gridInt(node.Height != null ? node.Height : node.height);
    var items = [];
    var bad = [];
    slots.forEach(function (slot, i) {
      if (!slot || typeof slot !== "object") {
        bad.push({ index: i, reason: "slot was not an object" });
        return;
      }
      var raw = slot.Id != null ? slot.Id : slot.id;
      if (raw != null && typeof raw !== "string" && typeof raw !== "number") {
        bad.push({ index: i, reason: "item id was not text" });
        return;
      }
      var id = text(raw);
      if (!id) return;
      var amount = slot.Amount != null ? slot.Amount : slot.amount;
      if (typeof amount !== "number" || !isFinite(amount) || Math.trunc(amount) !== amount) {
        bad.push({ index: i, id: id, reason: "Amount was not an integer" });
        return;
      }
      if (amount <= 0) return;
      if (amount > 1000000000) {
        bad.push({ index: i, id: id, reason: "Amount was unusable" });
        return;
      }
      var maxRaw = slot.MaxAmount != null ? slot.MaxAmount : slot.maxAmount;
      var maxStack = null;
      if (typeof maxRaw === "number" && isFinite(maxRaw) && Math.trunc(maxRaw) === maxRaw && maxRaw > 0) {
        maxStack = maxRaw;
      }
      var indexPos = slot.Index || slot.index || {};
      var resolved = resolveSaveId(id, null);
      items.push({
        id: resolved.id,
        rawId: id,
        name: "",
        qty: amount,
        maxStack: maxStack,
        stackApproximate: false,
        type: inventoryType(slot.Type != null ? slot.Type : slot.type),
        x: typeof indexPos.X === "number" ? indexPos.X : null,
        y: typeof indexPos.Y === "number" ? indexPos.Y : null
      });
    });
    return {
      ok: true,
      width: width,
      height: height,
      slotCapacity: width && height ? width * height : null,
      slotApproximate: false,
      items: items,
      bad: bad,
      name: text(node.Name != null ? node.Name : node.name)
    };
  }

  function signature(container) {
    var read = readContainer(container);
    if (!read.ok) return "";
    return read.items.map(function (item) {
      return item.rawId + ":" + item.qty + "@" + (item.x == null ? "" : item.x) + "," + (item.y == null ? "" : item.y);
    }).sort().join("|");
  }

  function makeLocation(spec, read) {
    var loc = {
      id: spec.id,
      source: "save",
      kind: spec.kind,
      category: spec.category,
      name: spec.name,
      width: null,
      height: null,
      slotCapacity: null,
      slotApproximate: false,
      items: [],
      geo: spec.geo || null,
      note: spec.note || "",
      skipped: false
    };
    if (read && read.ok) {
      loc.width = read.width;
      loc.height = read.height;
      loc.slotCapacity = read.slotCapacity;
      loc.slotApproximate = false;
      loc.items = read.items;
      if (read.bad && read.bad.length) {
        loc.note = (loc.note ? loc.note + " " : "") + read.bad.length + " slot" + (read.bad.length === 1 ? "" : "s") + " skipped because Amount was not an integer.";
      }
    }
    return loc;
  }

  function geoFromAddress(field, decode, extra) {
    if (field == null || field === "" || typeof decode !== "function") return null;
    var info;
    try { info = decode(field); } catch (err) { return null; }
    if (!info || !/^[0-9A-F]{12}$/i.test(info.glyphs || "")) return null;
    extra = extra || {};
    return {
      glyphs: String(info.glyphs).toUpperCase(),
      planet: info.planet == null ? null : info.planet,
      galaxy: info.galaxy == null ? (extra.galaxy == null ? null : extra.galaxy) : info.galaxy,
      ssi: info.ssi == null ? null : info.ssi,
      voxelX: info.voxelX,
      voxelY: info.voxelY,
      voxelZ: info.voxelZ,
      coords: info.coords || "",
      baseName: extra.baseName || "",
      baseType: extra.baseType || "",
      scope: extra.scope || "base",
      strictBase: !!extra.strictBase
    };
  }

  function freighterGeo(player, bases, decode) {
    var listed = ((bases && bases.freighters) || [])[0] || null;
    var named = text(player && player.PlayerFreighterName);
    var fromField = geoFromAddress(player && player.FreighterUniverseAddress, decode, {
      baseType: "FreighterBase",
      scope: "base",
      strictBase: true,
      baseName: named || (listed ? listed.name : "")
    });
    if (fromField) {
      if (listed && fromField.glyphs === String(listed.glyphs || "").toUpperCase()) {
        if (!fromField.baseName) fromField.baseName = listed.name || "";
        if (fromField.galaxy == null) fromField.galaxy = listed.galaxy == null ? null : listed.galaxy;
      }
      return fromField;
    }
    if (listed && listed.glyphs) {
      return {
        glyphs: String(listed.glyphs).toUpperCase(),
        planet: listed.planet == null ? null : listed.planet,
        galaxy: listed.galaxy == null ? null : listed.galaxy,
        ssi: listed.ssi == null ? null : listed.ssi,
        voxelX: listed.voxelX,
        voxelY: listed.voxelY,
        voxelZ: listed.voxelZ,
        coords: listed.coords || "",
        baseName: named || listed.name || "Freighter",
        baseType: listed.type || "FreighterBase",
        scope: "base",
        strictBase: true
      };
    }
    return null;
  }

  function pushHold(out, spec, node) {
    var read = readContainer(node);
    if (!read.ok) {
      if (node != null) {
        out.skipped.push({
          id: spec.id,
          label: spec.name,
          reason: spec.name + " was present but had no Slots list, so no quantities were read."
        });
      }
      return;
    }
    out.locations.push(makeLocation(spec, read));
    if (read.bad && read.bad.length) {
      out.skipped.push({
        id: spec.id + ":slots",
        label: spec.name,
        reason: read.bad.length + " slot" + (read.bad.length === 1 ? "" : "s") + " in " + spec.name + " had a non-integer Amount and " + (read.bad.length === 1 ? "was" : "were") + " skipped."
      });
    }
  }

  function extractInventories(player, options) {
    options = options || {};
    var decode = options.decodeAddress;
    var bases = options.bases || { planetary: [], freighters: [] };
    var out = { locations: [], skipped: [] };
    if (!player || typeof player !== "object" || Array.isArray(player)) {
      out.skipped.push({
        id: "player",
        label: "Player state",
        reason: "No PlayerStateData was found, so no inventories were imported."
      });
      return out;
    }

    pushHold(out, { id: "save:exosuit:general", kind: "exosuit-general", category: "exosuit", name: "Exosuit · General", geo: null }, player.Inventory);
    pushHold(out, { id: "save:exosuit:cargo", kind: "exosuit-cargo", category: "exosuit", name: "Exosuit · Cargo", geo: null }, player.Inventory_Cargo);
    pushHold(out, { id: "save:exosuit:tech", kind: "exosuit-tech", category: "exosuit", name: "Exosuit · Technology", geo: null }, player.Inventory_TechOnly);

    var ships = Array.isArray(player.ShipOwnership) ? player.ShipOwnership : [];
    var shipSigs = [];
    ships.forEach(function (ship, i) {
      if (!ship || typeof ship !== "object") {
        out.skipped.push({ id: "save:ship:" + i, label: "Starship " + (i + 1), reason: "Ship entry " + (i + 1) + " was not an object." });
        return;
      }
      var name = text(ship.Name) || ("Starship " + (i + 1));
      var geo = geoFromAddress(ship.Location, decode, { baseName: "", baseType: "Starship", scope: "base", strictBase: false });
      shipSigs.push(signature(ship.Inventory));
      pushHold(out, { id: "save:ship:" + i + ":general", kind: "ship-general", category: "ship", name: name + " · General", geo: geo }, ship.Inventory);
      pushHold(out, { id: "save:ship:" + i + ":cargo", kind: "ship-cargo", category: "ship", name: name + " · Cargo", geo: geo }, ship.Inventory_Cargo);
      pushHold(out, { id: "save:ship:" + i + ":tech", kind: "ship-tech", category: "ship", name: name + " · Technology", geo: geo }, ship.Inventory_TechOnly);
      if (ship.Location != null && !geo) {
        out.skipped.push({
          id: "save:ship:" + i + ":where",
          label: name,
          reason: name + " has a Location value that is not a portal address, so the ship was not pinned to a system."
        });
      }
    });
    if (ships.length) {
      var activeSig = signature(player.ShipInventory);
      if (activeSig && shipSigs.indexOf(activeSig) !== -1) {
        out.skipped.push({
          id: "ship-active-copy",
          label: "Active starship",
          reason: "PlayerStateData.ShipInventory matches a ShipOwnership hold, so it was not imported a second time."
        });
      } else if (activeSig) {
        pushHold(out, {
          id: "save:ship:active:general",
          kind: "ship-general",
          category: "ship",
          name: "Active starship · General",
          geo: null,
          note: "This hold did not match a ShipOwnership entry."
        }, player.ShipInventory);
      }
    } else if (player.ShipInventory) {
      pushHold(out, { id: "save:ship:active:general", kind: "ship-general", category: "ship", name: "Active starship · General", geo: null }, player.ShipInventory);
    }

    var freight = freighterGeo(player, bases, decode);
    pushHold(out, { id: "save:freighter:general", kind: "freighter-general", category: "freighter", name: "Freighter · General", geo: freight }, player.FreighterInventory);
    pushHold(out, { id: "save:freighter:cargo", kind: "freighter-cargo", category: "freighter", name: "Freighter · Cargo", geo: freight }, player.FreighterInventory_Cargo);
    pushHold(out, { id: "save:freighter:tech", kind: "freighter-tech", category: "freighter", name: "Freighter · Technology", geo: freight }, player.FreighterInventory_TechOnly);
    if ((player.FreighterInventory || player.FreighterInventory_Cargo || player.FreighterInventory_TechOnly) && !freight) {
      out.skipped.push({
        id: "freighter-where",
        label: "Freighter position",
        reason: "The freighter hold was read, but neither FreighterUniverseAddress nor a freighter base address was usable, so it was not pinned to the map."
      });
    }

    for (var c = 1; c <= 10; c++) {
      var key = "Chest" + c + "Inventory";
      if (!Object.prototype.hasOwnProperty.call(player, key)) continue;
      pushHold(out, {
        id: "save:container:" + (c - 1),
        kind: "container",
        category: "container",
        name: "Storage Container " + (c - 1),
        geo: null,
        note: "Numbered containers are shared by every base. This one is not pinned to a base until you choose one."
      }, player[key]);
    }

    var tools = Array.isArray(player.Multitools) ? player.Multitools : [];
    var toolSigs = [];
    tools.forEach(function (tool, i) {
      if (!tool || typeof tool !== "object") {
        out.skipped.push({ id: "save:multitool:" + i, label: "Multi-tool " + (i + 1), reason: "Multi-tool " + (i + 1) + " was not an object." });
        return;
      }
      var box = tool.Store || tool.Inventory || (Array.isArray(tool.Slots) ? tool : null);
      var name = text(tool.Name) || text(tool.CustomName) || (box && text(box.Name)) || ("Multi-tool " + (i + 1));
      toolSigs.push(signature(box));
      pushHold(out, { id: "save:multitool:" + i, kind: "multitool", category: "multitool", name: name, geo: null }, box);
    });
    if (tools.length) {
      var weaponSig = signature(player.WeaponInventory);
      if (weaponSig && toolSigs.indexOf(weaponSig) !== -1) {
        out.skipped.push({
          id: "weapon-active-copy",
          label: "Active multi-tool",
          reason: "WeaponInventory matches a stored multi-tool, so it was not imported a second time."
        });
      } else if (weaponSig) {
        pushHold(out, { id: "save:multitool:active", kind: "multitool", category: "multitool", name: "Active multi-tool", geo: null, note: "This hold did not match a Multitools entry." }, player.WeaponInventory);
      }
    } else if (player.WeaponInventory) {
      pushHold(out, { id: "save:multitool:active", kind: "multitool", category: "multitool", name: "Active multi-tool", geo: null }, player.WeaponInventory);
    }

    var vehicles = Array.isArray(player.VehicleOwnership) ? player.VehicleOwnership : [];
    vehicles.forEach(function (vehicle, i) {
      if (!vehicle || typeof vehicle !== "object") return;
      var name = text(vehicle.Name) || ("Exocraft " + (i + 1));
      var geo = geoFromAddress(vehicle.Location, decode, { baseType: "Exocraft", scope: "base", strictBase: false });
      pushHold(out, { id: "save:exocraft:" + i + ":general", kind: "exocraft", category: "exocraft", name: name, geo: geo }, vehicle.Inventory);
      pushHold(out, { id: "save:exocraft:" + i + ":tech", kind: "exocraft-tech", category: "exocraft", name: name + " · Technology", geo: geo }, vehicle.Inventory_TechOnly);
      if (Array.isArray(vehicle.VehicleCargo)) {
        vehicle.VehicleCargo.forEach(function (pod, p) {
          pushHold(out, { id: "save:exocraft:" + i + ":pod:" + p, kind: "exocraft-cargo", category: "exocraft", name: name + " · Cargo " + (p + 1), geo: geo }, pod);
        });
      }
    });

    var frigates = Array.isArray(player.FleetFrigates) ? player.FleetFrigates : null;
    if (frigates) {
      frigates.forEach(function (frigate, i) {
        if (!frigate || typeof frigate !== "object") return;
        var name = text(frigate.CustomName) || ("Frigate " + (i + 1));
        var cls = text(frigate.FrigateClass);
        if (cls && typeof frigate.FrigateClass === "object") cls = text(frigate.FrigateClass.FrigateClass);
        out.locations.push(makeLocation({
          id: "save:frigate:" + i,
          kind: "frigate",
          category: "frigate",
          name: name + (cls ? " · " + cls : ""),
          geo: null,
          note: "The save lists this frigate. It does not store a cargo hold, so no quantities were added."
        }, { ok: true, width: null, height: null, slotCapacity: null, items: [], bad: [] }));
      });
      out.skipped.push({
        id: "frigate-cargo",
        label: "Frigate cargo",
        reason: "FleetFrigates stores class, traits, and a home-system seed. It has no item slots. Home-system seeds were not treated as portal addresses. No frigate quantities were invented."
      });
    }

    var settlements = Array.isArray(player.SettlementStatesV2) ? player.SettlementStatesV2 : null;
    if (settlements) {
      settlements.forEach(function (settlement, i) {
        if (!settlement || typeof settlement !== "object") return;
        var name = text(settlement.Name) || ("Settlement " + (i + 1));
        var geo = geoFromAddress(settlement.UniverseAddress, decode, {
          baseName: name,
          baseType: "Settlement",
          scope: "base",
          strictBase: false
        });
        var items = [];
        var bad = 0;
        var slots = Array.isArray(settlement.ProductionState) ? settlement.ProductionState : null;
        if (!slots) {
          out.skipped.push({
            id: "save:settlement:" + i,
            label: name,
            reason: name + " had no ProductionState list, so no settlement stock was read."
          });
        } else {
          slots.forEach(function (slot) {
            if (!slot || typeof slot !== "object") { bad++; return; }
            var raw = text(slot.ElementId);
            if (!raw) return;
            if (typeof slot.Amount !== "number" || !isFinite(slot.Amount) || Math.trunc(slot.Amount) !== slot.Amount) {
              bad++;
              return;
            }
            if (slot.Amount <= 0) return;
            var resolved = resolveSaveId(raw, null);
            items.push({
              id: resolved.id,
              rawId: raw,
              name: "",
              qty: slot.Amount,
              maxStack: null,
              stackApproximate: false,
              type: "Product"
            });
          });
        }
        if (slots) {
          out.locations.push(makeLocation({
            id: "save:settlement:" + i,
            kind: "settlement",
            category: "settlement",
            name: name,
            geo: geo,
            note: bad ? bad + " production slot" + (bad === 1 ? "" : "s") + " skipped because Amount was not an integer." : ""
          }, { ok: true, width: null, height: null, slotCapacity: slots.length, slotApproximate: true, items: items, bad: [] }));
          var settlementLoc = out.locations[out.locations.length - 1];
          settlementLoc.slotApproximate = true;
          settlementLoc.note = (settlementLoc.note ? settlementLoc.note + " " : "") + "Slot count is the production-slot list, which is approximate as a capacity.";
        }
        if (!geo) {
          out.skipped.push({
            id: "save:settlement:" + i + ":where",
            label: name,
            reason: name + " had no usable UniverseAddress, so it was not pinned to the map."
          });
        }
        if (bad) {
          out.skipped.push({
            id: "save:settlement:" + i + ":slots",
            label: name,
            reason: bad + " settlement production slot" + (bad === 1 ? "" : "s") + " had a non-integer Amount and " + (bad === 1 ? "was" : "were") + " skipped."
          });
        }
      });
    }

    var foundBaseSlots = false;
    (Array.isArray(player.PersistentPlayerBases) ? player.PersistentPlayerBases : []).forEach(function (base, i) {
      if (!base || typeof base !== "object") return;
      var baseName = text(base.Name) || ("Base " + (i + 1));
      var addr = base.GalacticAddress != null ? base.GalacticAddress : base.galacticAddress;
      var geo = geoFromAddress(addr, decode, { baseName: baseName, baseType: text(base.BaseType && base.BaseType.PersistentBaseTypes) || "", scope: "base", strictBase: true });
      ["MaintenanceContainer", "Inventory", "Store"].forEach(function (field) {
        if (!base[field]) return;
        var read = readContainer(base[field]);
        if (!read.ok) return;
        foundBaseSlots = true;
        out.locations.push(makeLocation({
          id: "save:base:" + i + ":" + field,
          kind: "base",
          category: "base",
          name: baseName + " · " + field,
          geo: geo
        }, read));
      });
    });
    if (!foundBaseSlots) {
      out.skipped.push({
        id: "base-buffer",
        label: "Base salvage and placed refiners",
        reason: "Placed refiners and base salvage live in the base object buffer. That buffer is not a slot list in the exported JSON, so those contents were not imported. Numbered storage containers are the shared Chest inventories."
      });
    }

    ["CookingIngredientsInventory", "ChestMagicInventory", "ChestMagic2Inventory", "CorvetteStorageInventory", "GraveInventory", "FishBaitBoxInventory", "FishPlatformInventory", "RocketLockerInventory", "FoodUnitInventory"].forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(player, field)) return;
      var read = readContainer(player[field]);
      if (!read.ok) {
        out.skipped.push({ id: "other:" + field, label: field, reason: field + " was present but was not a readable slot list." });
        return;
      }
      out.locations.push(makeLocation({ id: "save:other:" + field, kind: "other", category: "other", name: field, geo: null }, read));
    });

    return out;
  }

  // Placed parts use the product IDs from the No Man's Sky item list
  // (nomanssky.fandom.com/wiki/Item_Id_List, mirrored on nomansskyresources.com):
  //   U_EXTRACTOR_S Mineral Extractor, U_GASEXTRACTOR Gas Extractor,
  //   BUILDHARVESTER Autonomous Mining Unit, U_SILO_S Supply Depot,
  //   U_PIPELINE Supply Pipe, PLANTER / PLANTERMEGA hydroponic trays,
  //   BIOROOM Bio-Dome, CARBONPLANTER Standing Planter,
  //   SNOWPLANT, SCORCHEDPLANT, RADIOPLANT, TOXICPLANT, BARRENPLANT,
  //   LUSHPLANT, CREATUREPLANT, POOPPLANT, NIPPLANT, GRAVPLANT,
  //   SACVENOMPLANT, PEARLPLANT.
  // Kelp Sac (PLANT_WATER) and Pugneum (ROBOT1) are substances, not planted
  // part IDs, so they are not counted unless a raw part is labeled by hand.
  //
  // GcPersistentBaseEntry (MBINCompiler) stores ObjectID, Timestamp, UserData,
  // Position, Up, At, and Message. UserData is a seed, not a substance id.
  // The save does not record which hotspot resource an extractor pulls, the
  // hotspot class, the live output, or which tray a plant sits in.
  //
  // Rates, cited and never applied unless the save or the user supplies the
  // missing input:
  //   Hotspot wiki (nomanssky.miraheze.org/wiki/Hotspot): at the center, a
  //   mineral or gas extractor can at best do C 250, B 375, A 500, S 625
  //   items per hour. Distance and per-network diminishing returns are not
  //   in the object list, so a class only yields an approximate ceiling.
  //   Mineral Extractor wiki: each extractor stores 250. The observed
  //   outputs there (C about 225–250, B about 350–370, A 500, S about 610)
  //   are why the ceiling stays approximate.
  //   Supply Depot wiki: each depot adds 1000 storage. That is capacity,
  //   not the amount currently inside.
  //   Autonomous Mining Unit wiki: a fully charged unit harvests a maximum
  //   of about 250 over roughly 60 minutes. Fuel and the deposit are not
  //   in the save, so that rate is used only after the resource is named,
  //   and it is marked approximate.
  //   Farming wiki (nomanssky.miraheze.org/wiki/Farming, Orbital): grow time
  //   and base yield. Yields above 1 vary by game mode, so they are approximate.
  var HOTSPOT_MAX = { C: 250, B: 375, A: 500, S: 625 };
  var EXTRACTOR_STORAGE = 250;
  var DEPOT_STORAGE = 1000;
  var AMU_MAX_PER_HOUR = 250;
  var MINING_PARTS = {
    U_EXTRACTOR_S: { kind: "mineral", name: "Mineral Extractor" },
    U_GASEXTRACTOR: { kind: "gas", name: "Gas Extractor" },
    BUILDHARVESTER: { kind: "amu", name: "Autonomous Mining Unit" },
    U_SILO_S: { kind: "depot", name: "Supply Depot" },
    U_PIPELINE: { kind: "pipe", name: "Supply Pipe" }
  };
  var CONTAINER_PARTS = {
    PLANTER: { kind: "tray", name: "Hydroponic Tray" },
    PLANTERMEGA: { kind: "large-tray", name: "Large Hydroponic Tray" },
    BIOROOM: { kind: "biodome", name: "Bio-Dome" },
    CARBONPLANTER: { kind: "standing", name: "Standing Planter" }
  };
  var CROP_PARTS = {
    SNOWPLANT: { name: "Frostwort", product: "frost-crystal", productName: "Frost Crystal", growHours: 1, yield: 50 },
    SCORCHEDPLANT: { name: "Solar Vine", product: "solanium", productName: "Solanium", growHours: 16, yield: 50 },
    RADIOPLANT: { name: "Gamma Weed", product: "gamma-root", productName: "Gamma Root", growHours: 4, yield: 50 },
    TOXICPLANT: { name: "Fungal Cluster", product: "fungal-mould", productName: "Fungal Mould", growHours: 4, yield: 50 },
    BARRENPLANT: { name: "Echinocactus", product: "cactus-flesh", productName: "Cactus Flesh", growHours: 16, yield: 100 },
    LUSHPLANT: { name: "Star Bramble", product: "star-bulb", productName: "Star Bulb", growHours: 4, yield: 25 },
    CREATUREPLANT: { name: "Mordite Root", product: "mordite", productName: "Mordite", growHours: 8, yield: 25 },
    POOPPLANT: { name: "Gutrot Flower", product: "faecium", productName: "Faecium", growHours: 4, yield: 25 },
    NIPPLANT: { name: "NipNip", product: "nipnip-buds", productName: "NipNip Buds", growHours: 4, yield: 1 },
    GRAVPLANT: { name: "Gravitino Host", product: "gravitino-ball", productName: "Gravitino Ball", growHours: 2, yield: 1 },
    SACVENOMPLANT: { name: "Venom Urchin", product: "sac-venom", productName: "Sac Venom", growHours: 3.33, yield: 1 },
    PEARLPLANT: { name: "Albumen Pearl Orb", product: "albumen-pearl", productName: "Albumen Pearl", growHours: 1.33, yield: 1 }
  };
  var RESOURCE_CHOICES = [
    ["copper", "Copper"], ["activated-copper", "Activated Copper"],
    ["cadmium", "Cadmium"], ["activated-cadmium", "Activated Cadmium"],
    ["emeril", "Emeril"], ["activated-emeril", "Activated Emeril"],
    ["indium", "Indium"], ["activated-indium", "Activated Indium"],
    ["ammonia", "Ammonia"], ["basalt", "Basalt"], ["cobalt", "Cobalt"],
    ["dioxite", "Dioxite"], ["gold", "Gold"], ["magnetised-ferrite", "Magnetised Ferrite"],
    ["paraffinium", "Paraffinium"], ["phosphorus", "Phosphorus"], ["pyrite", "Pyrite"],
    ["rusted-metal", "Rusted Metal"], ["salt", "Salt"], ["silver", "Silver"],
    ["sodium", "Sodium"], ["uranium", "Uranium"],
    ["oxygen", "Oxygen"], ["nitrogen", "Nitrogen"], ["radon", "Radon"], ["sulphurine", "Sulphurine"],
    ["frost-crystal", "Frost Crystal"], ["solanium", "Solanium"], ["gamma-root", "Gamma Root"],
    ["fungal-mould", "Fungal Mould"], ["cactus-flesh", "Cactus Flesh"], ["star-bulb", "Star Bulb"],
    ["mordite", "Mordite"], ["faecium", "Faecium"], ["kelp-sac", "Kelp Sac"], ["pugneum", "Pugneum"]
  ];

  function objectIdOf(entry) {
    if (!entry || typeof entry !== "object") return "";
    var raw = entry.ObjectID != null ? entry.ObjectID : entry.objectId;
    if (raw && typeof raw === "object") raw = raw.Value || raw.value || "";
    return text(raw).toUpperCase();
  }

  function productionId(glyphs, baseName, objectId, index) {
    var where = glyphs ? glyphs + ":" + norm(baseName || "") : "nogeo:" + index;
    return "prod:" + where + ":" + objectId;
  }

  function extractProduction(player, options) {
    options = options || {};
    var decode = options.decodeAddress;
    var sites = [];
    var skipped = [];
    var bases = Array.isArray(player && player.PersistentPlayerBases) ? player.PersistentPlayerBases : [];
    var missingObjects = 0;
    bases.forEach(function (base, index) {
      if (!base || typeof base !== "object") return;
      var list = base.Objects || base.objects;
      if (!Array.isArray(list)) {
        missingObjects += 1;
        return;
      }
      var baseName = text(base.Name) || ("Base " + (index + 1));
      var addr = base.GalacticAddress != null ? base.GalacticAddress : base.galacticAddress;
      var geo = geoFromAddress(addr, decode, {
        baseName: baseName,
        baseType: text(base.BaseType && base.BaseType.PersistentBaseTypes) || "",
        scope: "base",
        strictBase: true
      });
      var counts = Object.create(null);
      list.forEach(function (entry) {
        var id = objectIdOf(entry);
        if (!id || id.indexOf("BASE_") === 0) return;
        var part = MINING_PARTS[id] || CONTAINER_PARTS[id] || CROP_PARTS[id];
        var unknownCrop = !part && /PLANT$/.test(id) && id !== "WATERPLANT";
        if (!part && !unknownCrop) return;
        counts[id] = (counts[id] || 0) + 1;
      });
      Object.keys(counts).forEach(function (id) {
        var mining = MINING_PARTS[id];
        var container = CONTAINER_PARTS[id];
        var crop = CROP_PARTS[id];
        var kind = mining ? mining.kind : (container ? container.kind : "crop");
        sites.push({
          id: productionId(geo && geo.glyphs, baseName, id, index),
          source: "save",
          objectId: id,
          kind: kind,
          count: counts[id],
          geo: geo,
          resourceId: crop ? crop.product : "",
          resourceUser: false,
          hotspotClass: "",
          container: "",
          containerUser: false,
          label: "",
          labelUser: false,
          known: !!crop || !!mining || !!container
        });
      });
    });
    if (missingObjects && bases.length) {
      skipped.push({
        id: "base-objects",
        label: "Extractors and crops",
        reason: missingObjects === bases.length
          ? "No base included an Objects list. Placed extractors and crops are counted from that list when a save export has it. Nothing was invented."
          : missingObjects + " base" + (missingObjects === 1 ? "" : "s") + " had no Objects list, so extractors and crops there were not read."
      });
    }
    return { sites: sites, skipped: skipped };
  }

  function keepProductionEdits(previous, next) {
    var prior = Object.create(null);
    (previous || []).forEach(function (site) { if (site && site.id) prior[site.id] = site; });
    return next.map(function (site) {
      var old = prior[site.id];
      if (!old) return site;
      if (old.resourceUser && text(old.resourceId)) {
        site.resourceId = text(old.resourceId);
        site.resourceUser = true;
      }
      if (HOTSPOT_MAX[old.hotspotClass]) site.hotspotClass = old.hotspotClass;
      if (old.labelUser) {
        site.label = text(old.label);
        site.labelUser = true;
      }
      if (old.containerUser && text(old.container)) {
        site.container = text(old.container);
        site.containerUser = true;
      }
      return site;
    });
  }

  function cropSpec(objectId) {
    return CROP_PARTS[text(objectId).toUpperCase()] || null;
  }

  function siteProductId(site) {
    if (!site) return "";
    if (text(site.resourceId)) return text(site.resourceId);
    var crop = cropSpec(site.objectId);
    return crop ? crop.product : "";
  }

  function rateOf(site) {
    if (!site || !(site.count > 0)) return null;
    var count = site.count;
    if (site.kind === "mineral" || site.kind === "gas") {
      var ceiling = HOTSPOT_MAX[site.hotspotClass];
      if (!ceiling) return null;
      return {
        perHour: ceiling * count,
        perCycle: null,
        growHours: null,
        approximate: true,
        note: "Approximate ceiling of " + ceiling + "/hr per extractor at a class " + site.hotspotClass + " hotspot center. The save has no density and no pipe network, so the real rate can be lower."
      };
    }
    if (site.kind === "amu") {
      if (!text(site.resourceId)) return null;
      return {
        perHour: AMU_MAX_PER_HOUR * count,
        perCycle: null,
        growHours: null,
        approximate: true,
        note: "Approximate maximum for a fully charged Autonomous Mining Unit, about 250 in an hour. The save does not say if it is fueled or running."
      };
    }
    var crop = cropSpec(site.objectId);
    if (site.kind === "crop" && crop && crop.yield > 0 && crop.growHours > 0) {
      return {
        perHour: (crop.yield / crop.growHours) * count,
        perCycle: crop.yield * count,
        growHours: crop.growHours,
        approximate: crop.yield > 1,
        note: crop.name + " takes " + crop.growHours + " h and yields " + (crop.yield > 1 ? "about " : "") + crop.yield + " per plant. Yields above 1 vary by game mode."
      };
    }
    return null;
  }

  function storageOf(site) {
    if (!site || !(site.count > 0)) return null;
    if (site.kind === "mineral" || site.kind === "gas") {
      return { capacity: EXTRACTOR_STORAGE * site.count, approximate: false, note: "Extractor capacity. Not the amount sitting in it." };
    }
    if (site.kind === "depot") {
      return { capacity: DEPOT_STORAGE * site.count, approximate: false, note: "Supply Depot capacity. Not the amount sitting in it." };
    }
    if (site.kind === "amu") {
      return { capacity: AMU_MAX_PER_HOUR * site.count, approximate: true, note: "Documented full harvest of about 250. Not a live reading." };
    }
    return null;
  }

  function normalizeSite(site) {
    if (!site || typeof site !== "object") return null;
    var objectId = text(site.objectId).toUpperCase();
    var id = text(site.id);
    var count = posInt(site.count);
    var kind = text(site.kind);
    if (!id || !objectId || !count || !kind) return null;
    var klass = text(site.hotspotClass).toUpperCase();
    if (!HOTSPOT_MAX[klass]) klass = "";
    var containers = { tray: 1, "large-tray": 1, biodome: 1, standing: 1, outdoor: 1 };
    var container = text(site.container);
    if (!containers[container]) container = "";
    return {
      id: id,
      source: site.source === "manual" ? "manual" : "save",
      objectId: objectId,
      kind: kind,
      count: count,
      geo: site.geo && site.geo.glyphs ? site.geo : null,
      resourceId: text(site.resourceId),
      resourceUser: !!site.resourceUser,
      hotspotClass: klass,
      container: container,
      containerUser: !!site.containerUser,
      label: text(site.label),
      labelUser: !!site.labelUser,
      known: site.known !== false
    };
  }

  function findSite(store, id) {
    var found = null;
    ((store && store.production) || []).forEach(function (site) { if (site.id === id) found = site; });
    return found;
  }

  function setProduction(store, id, patch) {
    store = normalize(store);
    var site = findSite(store, id);
    if (!site || !patch) return store;
    if (Object.prototype.hasOwnProperty.call(patch, "resourceId")) {
      site.resourceId = text(patch.resourceId);
      site.resourceUser = true;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "hotspotClass")) {
      var klass = text(patch.hotspotClass).toUpperCase();
      site.hotspotClass = HOTSPOT_MAX[klass] ? klass : "";
    }
    if (Object.prototype.hasOwnProperty.call(patch, "label")) {
      site.label = text(patch.label);
      site.labelUser = true;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "container")) {
      var containers = { "": 1, tray: 1, "large-tray": 1, biodome: 1, standing: 1, outdoor: 1 };
      var container = text(patch.container);
      if (containers[container] || container === "") {
        site.container = container;
        site.containerUser = true;
      }
    }
    return store;
  }

  function sitesAtPlace(store, place, mode) {
    return ((store && store.production) || []).filter(function (site) {
      if (!site || !site.geo) return false;
      if (mode === "planet") {
        var geo = {
          glyphs: site.geo.glyphs,
          baseName: site.geo.baseName,
          baseType: site.geo.baseType,
          strictBase: false
        };
        return addressMatches(geo, place, "base");
      }
      return addressMatches(site.geo, place, mode || "base");
    });
  }

  function siteMatchesQuery(site, query, index) {
    var q = loose(query || "");
    if (!q || !site) return false;
    var crop = cropSpec(site.objectId);
    var mining = MINING_PARTS[site.objectId];
    var product = siteProductId(site);
    var node = index && index.byId ? index.byId[product] : null;
    var hay = loose([
      site.objectId, site.label, site.kind, product,
      crop && crop.name, crop && crop.productName,
      mining && mining.name,
      node && node.name
    ].filter(Boolean).join(" "));
    return hay.indexOf(q) !== -1;
  }

  function producersOf(store, itemId) {
    var id = text(itemId);
    var rows = [];
    ((store && store.production) || []).forEach(function (site) {
      if (!site || site.kind === "depot" || site.kind === "pipe" || site.kind === "tray" || site.kind === "large-tray" || site.kind === "biodome" || site.kind === "standing") return;
      if (siteProductId(site) !== id) return;
      var rate = rateOf(site);
      rows.push({
        site: site,
        perHour: rate ? rate.perHour : null,
        perCycle: rate ? rate.perCycle : null,
        growHours: rate ? rate.growHours : null,
        approximate: rate ? rate.approximate : false,
        note: rate ? rate.note : ""
      });
    });
    return rows;
  }

  function describeSite(site, index) {
    var crop = cropSpec(site && site.objectId);
    var mining = MINING_PARTS[site && site.objectId];
    var box = CONTAINER_PARTS[site && site.objectId];
    var product = siteProductId(site);
    var node = index && index.byId ? index.byId[product] : null;
    return {
      site: site,
      name: (site && site.label) || (crop && crop.name) || (mining && mining.name) || (box && box.name) || (site && site.objectId) || "",
      product: product,
      productName: (node && node.name) || (crop && crop.productName) || product,
      rate: rateOf(site),
      storage: storageOf(site),
      crop: crop,
      mining: mining,
      box: box
    };
  }

  function coverHours(shortfall, perHour) {
    var need = Number(shortfall);
    var rate = Number(perHour);
    if (!(need > 0) || !(rate > 0) || !isFinite(need) || !isFinite(rate)) return null;
    return need / rate;
  }

  function formatCover(hours) {
    if (hours == null || !isFinite(hours)) return "";
    if (hours < 1) return Math.max(1, Math.round(hours * 60)) + " min";
    var rounded = Math.round(hours * 10) / 10;
    return rounded + " h";
  }

  function importSave(store, player, options) {
    store = normalize(store || emptyStore());
    options = options || {};
    var extracted = extractInventories(player, options);
    var produced = extractProduction(player, options);
    var kept = store.locations.filter(function (loc) { return loc.source !== "save"; });
    var manualSites = (store.production || []).filter(function (site) { return site.source === "manual"; });
    store.locations = extracted.locations.concat(kept);
    store.production = keepProductionEdits(store.production, produced.sites).concat(manualSites);
    store.skipped = extracted.skipped.concat(produced.skipped);
    if (options.bases) {
      store.bases = {
        planetary: options.bases.planetary || [],
        freighters: options.bases.freighters || [],
        problems: options.bases.problems || []
      };
    }
    store.source = {
      fileName: options.fileName || "",
      format: options.format || "",
      importedAt: new Date().toISOString()
    };
    return store;
  }

  function normalizeItem(item) {
    if (!item || typeof item !== "object") return null;
    var qty = nonNegInt(item.qty);
    if (qty == null || qty === 0) return null;
    var id = text(item.id);
    if (!id) return null;
    var maxStack = posInt(item.maxStack);
    return {
      id: id,
      rawId: text(item.rawId) || id,
      name: text(item.name),
      qty: qty,
      maxStack: maxStack,
      stackApproximate: !!item.stackApproximate,
      type: text(item.type),
      x: typeof item.x === "number" ? item.x : null,
      y: typeof item.y === "number" ? item.y : null
    };
  }

  function normalizeGeo(geo) {
    if (!geo || typeof geo !== "object") return null;
    var glyphs = text(geo.glyphs).toUpperCase();
    if (glyphs && !/^[0-9A-F]{12}$/.test(glyphs)) glyphs = "";
    if (!glyphs && !text(geo.baseName)) return null;
    return {
      glyphs: glyphs,
      planet: geo.planet == null || geo.planet === "" ? null : Number(geo.planet),
      galaxy: geo.galaxy == null || geo.galaxy === "" ? null : Number(geo.galaxy),
      ssi: geo.ssi == null || geo.ssi === "" ? null : Number(geo.ssi),
      voxelX: typeof geo.voxelX === "number" ? geo.voxelX : null,
      voxelY: typeof geo.voxelY === "number" ? geo.voxelY : null,
      voxelZ: typeof geo.voxelZ === "number" ? geo.voxelZ : null,
      coords: text(geo.coords),
      baseName: text(geo.baseName),
      baseType: text(geo.baseType),
      scope: geo.scope === "system" ? "system" : "base",
      strictBase: !!geo.strictBase
    };
  }

  function normalizeLocation(loc) {
    if (!loc || typeof loc !== "object") return null;
    var id = text(loc.id);
    if (!id) return null;
    var items = [];
    (Array.isArray(loc.items) ? loc.items : []).forEach(function (item) {
      var next = normalizeItem(item);
      if (next) items.push(next);
    });
    return {
      id: id,
      source: loc.source === "save" ? "save" : "manual",
      kind: text(loc.kind) || "custom",
      category: CATEGORIES[loc.category] ? loc.category : "custom",
      name: text(loc.name) || "Location",
      width: gridInt(loc.width),
      height: gridInt(loc.height),
      slotCapacity: posInt(loc.slotCapacity),
      slotApproximate: !!loc.slotApproximate,
      items: items,
      geo: normalizeGeo(loc.geo),
      note: text(loc.note),
      skipped: !!loc.skipped
    };
  }

  function normalize(store) {
    var base = emptyStore();
    if (!store || typeof store !== "object") return base;
    base.savedAt = store.savedAt || null;
    base.source = store.source && typeof store.source === "object" ? {
      fileName: text(store.source.fileName),
      format: text(store.source.format),
      importedAt: store.source.importedAt || null
    } : null;
    var bases = store.bases || {};
    base.bases = {
      planetary: Array.isArray(bases.planetary) ? bases.planetary : [],
      freighters: Array.isArray(bases.freighters) ? bases.freighters : [],
      problems: Array.isArray(bases.problems) ? bases.problems : []
    };
    (Array.isArray(store.locations) ? store.locations : []).forEach(function (loc) {
      var next = normalizeLocation(loc);
      if (next) base.locations.push(next);
    });
    (Array.isArray(store.projects) ? store.projects : []).forEach(function (project) {
      if (!project || typeof project !== "object") return;
      var id = text(project.id);
      if (!id) return;
      var demands = [];
      (Array.isArray(project.demands) ? project.demands : []).forEach(function (demand) {
        if (!demand || typeof demand !== "object") return;
        var qty = posInt(demand.qty);
        var itemId = text(demand.itemId);
        var locationId = text(demand.locationId);
        var demandId = text(demand.id);
        if (!qty || !itemId || !locationId || !demandId) return;
        var done = [];
        (Array.isArray(demand.doneTransfers) ? demand.doneTransfers : []).forEach(function (move) {
          if (!move || typeof move !== "object") return;
          var moveQty = posInt(move.qty);
          if (!moveQty || !text(move.fromId) || !text(move.itemId)) return;
          done.push({
            id: text(move.id) || uid("mov"),
            fromId: text(move.fromId),
            toId: text(move.toId) || locationId,
            itemId: text(move.itemId),
            qty: moveQty
          });
        });
        demands.push({
          id: demandId,
          locationId: locationId,
          itemId: itemId,
          qty: qty,
          note: text(demand.note),
          doneTransfers: done
        });
      });
      base.projects.push({
        id: id,
        name: text(project.name) || "Project",
        recipeFor: text(project.recipeFor),
        demands: demands
      });
    });
    (Array.isArray(store.skipped) ? store.skipped : []).forEach(function (row) {
      if (!row || !row.reason) return;
      base.skipped.push({ id: text(row.id) || uid("skip"), label: text(row.label) || "Skipped", reason: text(row.reason) });
    });
    (Array.isArray(store.production) ? store.production : []).forEach(function (site) {
      var next = normalizeSite(site);
      if (next) base.production.push(next);
    });
    return base;
  }

  function loadStore(storage) {
    if (!storage || typeof storage.getItem !== "function") return emptyStore();
    try {
      var raw = storage.getItem(STORE_KEY);
      if (!raw) return emptyStore();
      return normalize(JSON.parse(raw));
    } catch (err) {
      return emptyStore();
    }
  }

  function saveStore(storage, store) {
    var next = normalize(store);
    next.savedAt = new Date().toISOString();
    storage.setItem(STORE_KEY, JSON.stringify(next));
    return next;
  }

  function exportDocument(store) {
    return JSON.stringify(normalize(store), null, 2);
  }

  function importDocument(textValue) {
    var data = JSON.parse(textValue);
    if (!data || data.version !== 1 || !Array.isArray(data.locations)) {
      throw new Error("This is not a logistics planner backup.");
    }
    return normalize(data);
  }

  function findLocation(store, id) {
    var found = null;
    (store.locations || []).forEach(function (loc) { if (loc.id === id) found = loc; });
    return found;
  }

  function qtyOf(loc, itemId) {
    var n = 0;
    if (!loc) return 0;
    (loc.items || []).forEach(function (item) {
      if (item.id === itemId) n += item.qty;
    });
    return n;
  }

  function shortfallFor(store, demand) {
    var atTarget = 0;
    var elsewhere = 0;
    var places = [];
    (store.locations || []).forEach(function (loc) {
      var qty = qtyOf(loc, demand.itemId);
      if (loc.id === demand.locationId) atTarget += qty;
      else if (qty > 0) {
        elsewhere += qty;
        places.push({ locationId: loc.id, name: loc.name, qty: qty });
      }
    });
    var need = Math.max(0, demand.qty - atTarget);
    var shortfall = Math.max(0, demand.qty - atTarget - elsewhere);
    return {
      atTarget: atTarget,
      elsewhere: elsewhere,
      available: atTarget + elsewhere,
      need: need,
      shortfall: shortfall,
      places: places
    };
  }

  function suggestTransfers(store, demand) {
    var report = shortfallFor(store, demand);
    var left = report.need;
    var places = report.places.slice().sort(function (a, b) {
      if (b.qty !== a.qty) return b.qty - a.qty;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    var moves = [];
    places.forEach(function (place) {
      if (left <= 0) return;
      var take = Math.min(place.qty, left);
      if (take <= 0) return;
      moves.push({
        fromId: place.locationId,
        toId: demand.locationId,
        itemId: demand.itemId,
        qty: take,
        fromName: place.name
      });
      left -= take;
    });
    return moves;
  }

  function removeQty(loc, itemId, qty) {
    var left = qty;
    var next = [];
    (loc.items || []).forEach(function (item) {
      if (left > 0 && item.id === itemId) {
        var take = Math.min(item.qty, left);
        item = Object.assign({}, item, { qty: item.qty - take });
        left -= take;
      }
      if (item.qty > 0) next.push(item);
    });
    loc.items = next;
    return left === 0;
  }

  function addQty(loc, template, qty) {
    var left = qty;
    (loc.items || []).forEach(function (item) {
      if (left <= 0 || item.id !== template.id) return;
      if (item.maxStack > 0) {
        var room = item.maxStack - item.qty;
        if (room <= 0) return;
        var put = Math.min(room, left);
        item.qty += put;
        left -= put;
      } else {
        item.qty += left;
        left = 0;
      }
    });
    if (left > 0) {
      loc.items.push({
        id: template.id,
        rawId: template.rawId || template.id,
        name: template.name || "",
        qty: left,
        maxStack: template.maxStack > 0 ? template.maxStack : null,
        stackApproximate: !!template.stackApproximate,
        type: template.type || ""
      });
    }
  }

  function applyTransfer(store, move) {
    store = normalize(store);
    var qty = posInt(move && move.qty);
    var from = findLocation(store, move && move.fromId);
    var to = findLocation(store, move && move.toId);
    var itemId = text(move && move.itemId);
    if (!qty || !from || !to || !itemId) return { ok: false, error: "missing" };
    if (from.id === to.id) return { ok: false, error: "same" };
    if (qtyOf(from, itemId) < qty) return { ok: false, error: "short" };
    var template = null;
    from.items.forEach(function (item) { if (!template && item.id === itemId) template = item; });
    removeQty(from, itemId, qty);
    addQty(to, template, qty);
    return { ok: true, store: store };
  }

  function isLoopEdge(edge) {
    if (!edge) return true;
    if (edge.expansion) return true;
    var out = edge.out;
    if (!out) return true;
    return (edge.inputs || []).some(function (input) { return input.id === out.id; });
  }

  function producing(catalog, id) {
    return ((catalog && catalog.edges) || []).filter(function (edge) {
      return edge && edge.out && edge.out.id === id && !isLoopEdge(edge);
    });
  }

  function recipeRank(edge, stock) {
    var inputs = edge.inputs || [];
    var total = 0;
    var covered = 0;
    inputs.forEach(function (input) {
      total += input.qty;
      covered += Math.min(stock[input.id] || 0, input.qty);
    });
    return {
      cover: total ? covered / total : 0,
      craft: edge.kind === "craft" ? 0 : 1,
      slots: edge.slots || 9,
      id: edge.id || ""
    };
  }

  function orderedRecipes(catalog, id, stock) {
    return producing(catalog, id).slice().sort(function (a, b) {
      var ar = recipeRank(a, stock || {});
      var br = recipeRank(b, stock || {});
      if (ar.cover !== br.cover) return br.cover - ar.cover;
      if (ar.craft !== br.craft) return ar.craft - br.craft;
      if (ar.slots !== br.slots) return ar.slots - br.slots;
      if (ar.id < br.id) return -1;
      if (ar.id > br.id) return 1;
      return 0;
    });
  }

  function inputsHaveStock(edge, stock) {
    return (edge.inputs || []).some(function (input) { return (stock[input.id] || 0) > 0; });
  }

  function usesVisiting(edge, visiting) {
    return (edge.inputs || []).some(function (input) { return visiting[input.id]; });
  }

  function expandRecipe(catalog, itemId, qty, stock) {
    var asked = posInt(qty);
    if (!asked) return { error: "qty", steps: [], raw: {} };
    var pool = Object.create(null);
    if (stock) {
      Object.keys(stock).forEach(function (key) {
        var n = nonNegInt(stock[key]);
        if (n) pool[key] = n;
      });
    }
    var steps = [];
    var raw = Object.create(null);
    var visiting = Object.create(null);

    function need(id, qtyNeeded, isRoot) {
      if (!(qtyNeeded > 0)) return;
      // The root quantity is already a shortfall. Stock of that same item
      // is a transfer, not a reason to craft less. Inputs still use the pool.
      var have = isRoot ? 0 : (pool[id] || 0);
      var use = Math.min(have, qtyNeeded);
      if (use > 0) pool[id] = have - use;
      var left = qtyNeeded - use;
      if (left <= 0) return;
      if (visiting[id]) {
        raw[id] = (raw[id] || 0) + left;
        return;
      }
      var edges = orderedRecipes(catalog, id, pool);
      var edge = null;
      for (var i = 0; i < edges.length; i++) {
        if (usesVisiting(edges[i], visiting)) continue;
        if (!isRoot && edges[i].kind !== "craft" && !inputsHaveStock(edges[i], pool)) continue;
        edge = edges[i];
        break;
      }
      if (!edge || !edge.out || !(edge.out.qty > 0)) {
        raw[id] = (raw[id] || 0) + left;
        return;
      }
      var batches = Math.ceil(left / edge.out.qty);
      visiting[id] = true;
      (edge.inputs || []).forEach(function (input) {
        need(input.id, input.qty * batches, false);
      });
      visiting[id] = false;
      steps.push({
        edgeId: edge.id,
        name: edge.name || edge.id,
        kind: edge.kind,
        slots: edge.slots == null ? null : edge.slots,
        station: edge.station || "",
        batches: batches,
        outId: id,
        outQty: edge.out.qty * batches,
        asked: left,
        inputs: (edge.inputs || []).map(function (input) {
          return { id: input.id, qty: input.qty * batches };
        })
      });
    }

    need(itemId, asked, true);
    return { steps: steps, raw: raw, error: null };
  }

  function chooseRecipe(catalog, itemId, stock) {
    var list = orderedRecipes(catalog, itemId, stock || {});
    return list.length ? list[0] : null;
  }

  function seedRecipe(store, catalog, itemId, qty, locationId, projectName) {
    store = normalize(store);
    var asked = posInt(qty);
    var edge = chooseRecipe(catalog, itemId, null);
    var project = {
      id: uid("prj"),
      name: projectName || itemId,
      recipeFor: itemId,
      demands: []
    };
    if (!asked || !locationId) return { store: store, project: null, error: "missing" };
    if (!edge) {
      project.demands.push({ id: uid("dmd"), locationId: locationId, itemId: itemId, qty: asked, note: "No recipe in this graph.", doneTransfers: [] });
    } else {
      var batches = Math.ceil(asked / edge.out.qty);
      (edge.inputs || []).forEach(function (input) {
        project.demands.push({
          id: uid("dmd"),
          locationId: locationId,
          itemId: input.id,
          qty: input.qty * batches,
          note: edge.name || "",
          doneTransfers: []
        });
      });
    }
    store.projects.push(project);
    return { store: store, project: project, edge: edge, error: null };
  }

  function seedPins(store, pinIds, locationId, projectName) {
    store = normalize(store);
    var name = projectName || "Moodboard pins";
    var project = null;
    store.projects.forEach(function (row) { if (row.name === name) project = row; });
    if (!project) {
      project = { id: uid("prj"), name: name, recipeFor: "", demands: [] };
      store.projects.push(project);
    }
    (pinIds || []).forEach(function (id) {
      id = text(id);
      if (!id || !locationId) return;
      var exists = project.demands.some(function (demand) {
        return demand.itemId === id && demand.locationId === locationId;
      });
      if (exists) return;
      project.demands.push({ id: uid("dmd"), locationId: locationId, itemId: id, qty: 1, note: "Pinned on the moodboard.", doneTransfers: [] });
    });
    return { store: store, project: project };
  }

  function completeTransfer(store, demandId, move) {
    store = normalize(store);
    var exists = false;
    store.projects.forEach(function (project) {
      project.demands.forEach(function (demand) {
        if (demand.id === demandId) exists = true;
      });
    });
    if (!exists) return { ok: false, error: "demand", store: store };
    var applied = applyTransfer(store, move);
    if (!applied.ok) return applied;
    applied.store.projects.forEach(function (project) {
      project.demands.forEach(function (demand) {
        if (demand.id !== demandId) return;
        demand.doneTransfers.push({
          id: uid("mov"),
          fromId: move.fromId,
          toId: move.toId,
          itemId: move.itemId,
          qty: posInt(move.qty)
        });
      });
    });
    return { ok: true, store: applied.store };
  }

  function addressMatches(geo, place, mode) {
    if (!geo || !place) return false;
    var gg = String(geo.glyphs || "").toUpperCase();
    var pg = String(place.glyphs || "").toUpperCase();
    if (gg.length === 12 && pg.length === 12) {
      if (mode === "system") return gg.slice(1) === pg.slice(1);
      if (gg !== pg) return false;
      if (geo.strictBase && geo.baseName && place.name && norm(geo.baseName) !== norm(place.name)) return false;
      return true;
    }
    if (place.name && geo.baseName && norm(place.name) === norm(geo.baseName)) {
      var blob = (place.type || "") + " " + (geo.baseType || "");
      if (/freighter/i.test(blob)) return true;
    }
    return false;
  }

  function locationsAtPlace(store, place, mode) {
    return (store.locations || []).filter(function (loc) {
      return addressMatches(loc.geo, place, mode || "base");
    });
  }

  function demandsAtPlace(store, place, mode) {
    var ids = Object.create(null);
    locationsAtPlace(store, place, mode).forEach(function (loc) { ids[loc.id] = true; });
    var rows = [];
    (store.projects || []).forEach(function (project) {
      (project.demands || []).forEach(function (demand) {
        if (!ids[demand.locationId]) return;
        var report = shortfallFor(store, demand);
        rows.push({ project: project, demand: demand, report: report });
      });
    });
    return rows;
  }

  function markerState(store, place, query, index) {
    var locs = locationsAtPlace(store, place, "base");
    var lines = 0;
    var units = 0;
    var matchQty = 0;
    var q = loose(query || "");
    locs.forEach(function (loc) {
      (loc.items || []).forEach(function (item) {
        lines += 1;
        units += item.qty;
        if (!q) return;
        var hay = loose(itemLabel(item, index)) + " " + loose(item.id) + " " + loose(item.rawId);
        if (hay.indexOf(q) !== -1) matchQty += item.qty;
      });
    });
    var open = demandsAtPlace(store, place, "base").some(function (row) { return row.report.need > 0; });
    var sites = sitesAtPlace(store, place, "base");
    var mining = false;
    var farming = false;
    var produces = false;
    var produceCount = 0;
    sites.forEach(function (site) {
      if (site.kind === "mineral" || site.kind === "gas" || site.kind === "amu") mining = true;
      if (site.kind === "crop") farming = true;
      if (q && siteMatchesQuery(site, q, index)) {
        produces = true;
        produceCount += site.count;
      }
    });
    return {
      locations: locs.length,
      lines: lines,
      units: units,
      matchQty: q ? matchQty : null,
      hasQueryMatch: q ? (matchQty > 0 || produces) : null,
      produces: q ? produces : null,
      produceCount: q ? produceCount : 0,
      mining: mining,
      farming: farming,
      unmet: open
    };
  }

  function formatBadge(n) {
    if (n == null || !isFinite(n)) return "";
    var v = Math.round(n);
    if (v < 1000) return String(v);
    if (v < 10000) {
      var tenths = Math.round(v / 100) / 10;
      return tenths + "k";
    }
    return Math.round(v / 1000) + "k";
  }

  function searchStock(store, query, index) {
    var q = loose(query || "");
    var rows = [];
    (store.locations || []).forEach(function (loc) {
      (loc.items || []).forEach(function (item) {
        var label = itemLabel(item, index);
        if (q) {
          var hay = loose(label) + " " + loose(item.id) + " " + loose(item.rawId) + " " + loose(loc.name);
          if (hay.indexOf(q) === -1) return;
        }
        rows.push({ location: loc, item: item, label: label });
      });
    });
    return rows;
  }

  function summarizeSearch(rows) {
    var map = Object.create(null);
    var order = [];
    rows.forEach(function (row) {
      var key = row.item.id;
      if (!map[key]) {
        map[key] = { id: key, label: row.label, total: 0, places: [] };
        order.push(key);
      }
      map[key].total += row.item.qty;
      var place = null;
      map[key].places.forEach(function (entry) { if (entry.locationId === row.location.id) place = entry; });
      if (!place) map[key].places.push({ locationId: row.location.id, name: row.location.name, qty: row.item.qty, category: row.location.category });
      else place.qty += row.item.qty;
    });
    return order.map(function (key) { return map[key]; });
  }

  function sortRows(rows, key, dir) {
    var mul = dir === "desc" ? -1 : 1;
    return rows.slice().sort(function (a, b) {
      var av;
      var bv;
      if (key === "qty") { av = a.item.qty; bv = b.item.qty; }
      else if (key === "location") { av = a.location.name.toLowerCase(); bv = b.location.name.toLowerCase(); }
      else if (key === "category") { av = a.location.category; bv = b.location.category; }
      else if (key === "stack") { av = a.item.maxStack || 0; bv = b.item.maxStack || 0; }
      else { av = a.label.toLowerCase(); bv = b.label.toLowerCase(); }
      if (av < bv) return -1 * mul;
      if (av > bv) return 1 * mul;
      return 0;
    });
  }

  function stockMap(store) {
    var map = Object.create(null);
    (store.locations || []).forEach(function (loc) {
      (loc.items || []).forEach(function (item) {
        map[item.id] = (map[item.id] || 0) + item.qty;
      });
    });
    return map;
  }

  function parsePlaceQuery(search) {
    var params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
    var glyphs = text(params.get("place")).toUpperCase();
    if (!/^[0-9A-F]{12}$/.test(glyphs)) glyphs = "";
    var planet = params.get("planet");
    var galaxy = params.get("galaxy");
    return {
      glyphs: glyphs,
      planet: planet == null || planet === "" || !isFinite(Number(planet)) ? null : Number(planet),
      galaxy: galaxy == null || galaxy === "" || !isFinite(Number(galaxy)) ? null : Number(galaxy),
      base: params.get("base") || ""
    };
  }

  function placeQuery(place) {
    var params = new URLSearchParams();
    if (place && place.glyphs) params.set("place", place.glyphs);
    if (place && place.planet != null && place.planet !== "") params.set("planet", String(place.planet));
    if (place && place.galaxy != null && place.galaxy !== "") params.set("galaxy", String(place.galaxy));
    if (place && place.name) params.set("base", place.name);
    var q = params.toString();
    return q ? "?" + q : "";
  }

  function selectionGlyphs(places) {
    var out = [];
    (places || []).forEach(function (place) {
      var glyphs = text(place && place.glyphs).toUpperCase();
      if (/^[0-9A-F]{12}$/.test(glyphs) && out.indexOf(glyphs) === -1) out.push(glyphs);
    });
    return out;
  }

  function selectionQuery(places) {
    var glyphs = selectionGlyphs(places);
    if (!glyphs.length) return "";
    return "?places=" + glyphs.join(",");
  }

  function parseSelectionQuery(search) {
    var params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
    var raw = params.get("places") || "";
    var out = [];
    raw.split(",").forEach(function (part) {
      var glyphs = text(part).toUpperCase();
      if (/^[0-9A-F]{12}$/.test(glyphs) && out.indexOf(glyphs) === -1) out.push(glyphs);
    });
    return out;
  }

  function geoInSelection(geo, glyphs) {
    if (!glyphs || !glyphs.length) return true;
    if (!geo || !geo.glyphs) return false;
    return glyphs.indexOf(String(geo.glyphs).toUpperCase()) !== -1;
  }

  function pinLocation(store, locationId, base) {
    var loc = findLocation(store, locationId);
    if (!loc || !base) return null;
    loc.geo = normalizeGeo({
      glyphs: base.glyphs,
      planet: base.planet,
      galaxy: base.galaxy,
      ssi: base.ssi,
      voxelX: base.voxelX,
      voxelY: base.voxelY,
      voxelZ: base.voxelZ,
      coords: base.coords,
      baseName: base.name,
      baseType: base.type || "",
      scope: "base",
      strictBase: true
    });
    if (/not pinned to a base/i.test(loc.note || "")) {
      loc.note = "Numbered containers are shared by every base. Pinned to " + (base.name || "this place") + ".";
    }
    return loc;
  }

  function clearImported(store) {
    store = normalize(store);
    store.locations = store.locations.filter(function (loc) { return loc.source !== "save"; });
    store.production = (store.production || []).filter(function (site) { return site.source !== "save"; });
    store.bases = { planetary: [], freighters: [], problems: [] };
    store.skipped = [];
    store.source = null;
    return store;
  }

  function knownBases(store) {
    var list = [];
    ((store.bases && store.bases.planetary) || []).forEach(function (base) { list.push(base); });
    ((store.bases && store.bases.freighters) || []).forEach(function (base) { list.push(base); });
    return list;
  }

  return {
    STORE_KEY: STORE_KEY,
    SAVE_IDS: SAVE_IDS,
    CATEGORIES: CATEGORIES,
    emptyStore: emptyStore,
    uid: uid,
    buildIndex: buildIndex,
    resolveSaveId: resolveSaveId,
    itemLabel: itemLabel,
    readContainer: readContainer,
    extractInventories: extractInventories,
    importSave: importSave,
    normalize: normalize,
    loadStore: loadStore,
    saveStore: saveStore,
    exportDocument: exportDocument,
    importDocument: importDocument,
    findLocation: findLocation,
    qtyOf: qtyOf,
    shortfallFor: shortfallFor,
    suggestTransfers: suggestTransfers,
    applyTransfer: applyTransfer,
    completeTransfer: completeTransfer,
    expandRecipe: expandRecipe,
    chooseRecipe: chooseRecipe,
    seedRecipe: seedRecipe,
    seedPins: seedPins,
    addressMatches: addressMatches,
    locationsAtPlace: locationsAtPlace,
    demandsAtPlace: demandsAtPlace,
    markerState: markerState,
    formatBadge: formatBadge,
    HOTSPOT_MAX: HOTSPOT_MAX,
    CROP_PARTS: CROP_PARTS,
    MINING_PARTS: MINING_PARTS,
    RESOURCE_CHOICES: RESOURCE_CHOICES,
    extractProduction: extractProduction,
    rateOf: rateOf,
    storageOf: storageOf,
    setProduction: setProduction,
    sitesAtPlace: sitesAtPlace,
    siteProductId: siteProductId,
    siteMatchesQuery: siteMatchesQuery,
    producersOf: producersOf,
    coverHours: coverHours,
    formatCover: formatCover,
    cropSpec: cropSpec,
    describeSite: describeSite,
    searchStock: searchStock,
    summarizeSearch: summarizeSearch,
    sortRows: sortRows,
    stockMap: stockMap,
    parsePlaceQuery: parsePlaceQuery,
    placeQuery: placeQuery,
    selectionGlyphs: selectionGlyphs,
    selectionQuery: selectionQuery,
    parseSelectionQuery: parseSelectionQuery,
    geoInSelection: geoInSelection,
    pinLocation: pinLocation,
    clearImported: clearImported,
    knownBases: knownBases,
    posInt: posInt
  };
});
