/*! app.js — logistics planner page. All storage is local. */
(function () {
  "use strict";

  var store = NmsLogistics.loadStore(localStorage);
  var catalog = null;
  var index = null;
  var sortKey = "item";
  var sortDir = "asc";
  var editing = null;

  var statusEl = document.getElementById("status");
  var rowsEl = document.getElementById("rows");
  var summaryEl = document.getElementById("summary");
  var skippedEl = document.getElementById("skipped");
  var checklistEl = document.getElementById("checklist");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
  }

  function persist() {
    try { store = NmsLogistics.saveStore(localStorage, store); }
    catch (err) { setStatus("Could not write this browser’s storage."); }
  }

  function labelOf(item) {
    return NmsLogistics.itemLabel(item, index);
  }

  function nodeName(id) {
    var node = index && index.byId[id];
    return node && node.name ? node.name : id;
  }

  function readPins() {
    function read(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
      } catch (err) {
        return null;
      }
    }
    return read(NmsRefine.PIN_KEY) || read(NmsRefine.PIN_KEY_LEGACY) || [];
  }

  function fillSelect(select, options, placeholder) {
    if (!select) return;
    var current = select.value;
    var html = placeholder ? '<option value="">' + esc(placeholder) + "</option>" : "";
    options.forEach(function (opt) {
      html += '<option value="' + esc(opt.value) + '">' + esc(opt.label) + "</option>";
    });
    select.innerHTML = html;
    if (current && Array.prototype.some.call(select.options, function (opt) { return opt.value === current; })) {
      select.value = current;
    }
  }

  function locationOptions() {
    return store.locations.map(function (loc) {
      return { value: loc.id, label: loc.name };
    });
  }

  function itemOptions() {
    var nodes = (catalog && catalog.nodes) || [];
    return nodes.map(function (node) {
      return { value: node.id, label: node.name };
    }).sort(function (a, b) {
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });
  }

  function baseOptions() {
    return NmsLogistics.knownBases(store).map(function (base) {
      return { value: base.id, label: base.name + (base.glyphs ? " · " + base.glyphs : "") };
    });
  }

  function categoryOptions() {
    return Object.keys(NmsLogistics.CATEGORIES).map(function (key) {
      return { value: key, label: NmsLogistics.CATEGORIES[key] };
    });
  }

  function fillControls() {
    var locs = locationOptions();
    fillSelect(document.getElementById("loc-filter"), locs, "All holds");
    fillSelect(document.getElementById("item-loc"), locs, "Choose a hold");
    fillSelect(document.getElementById("move-from"), locs, "From");
    fillSelect(document.getElementById("move-to"), locs, "To");
    fillSelect(document.getElementById("pin-loc"), locs, "Choose a hold");
    fillSelect(document.getElementById("demand-loc"), locs, "Target hold");
    fillSelect(document.getElementById("recipe-loc"), locs, "Deliver to");
    fillSelect(document.getElementById("pin-target"), locs, "Deliver to");
    fillSelect(document.getElementById("loc-pin"), baseOptions(), "Not on the map");
    fillSelect(document.getElementById("pin-base"), baseOptions(), "Choose");
    var place = document.getElementById("place-filter");
    if (place) {
      var current = place.value;
      var html = '<option value="">All places</option><option value="unpinned">Not on the map</option>';
      baseOptions().forEach(function (opt) {
        html += '<option value="' + esc(opt.value) + '">' + esc(opt.label) + "</option>";
      });
      place.innerHTML = html;
      if (Array.prototype.some.call(place.options, function (opt) { return opt.value === current; })) place.value = current;
    }
    var cat = document.getElementById("cat-filter");
    if (cat && cat.options.length <= 1) fillSelect(cat, categoryOptions(), "All categories");
    var locCat = document.getElementById("loc-cat");
    if (locCat && !locCat.options.length) fillSelect(locCat, categoryOptions(), "");
    if (catalog) {
      var items = itemOptions();
      ["item-id", "demand-item", "recipe-item"].forEach(function (id) {
        var select = document.getElementById(id);
        if (select && select.options.length <= 1) fillSelect(select, items, "Choose");
      });
    }
    var projects = store.projects.map(function (project) {
      return { value: project.id, label: project.name };
    });
    fillSelect(document.getElementById("demand-project"), projects, "Project");
    var from = document.getElementById("move-from");
    var moveItem = document.getElementById("move-item");
    if (from && moveItem) {
      var loc = NmsLogistics.findLocation(store, from.value);
      var opts = [];
      if (loc) {
        var seen = Object.create(null);
        loc.items.forEach(function (item) {
          if (seen[item.id]) return;
          seen[item.id] = true;
          opts.push({ value: item.id, label: labelOf(item) });
        });
      }
      fillSelect(moveItem, opts, "Item");
    }
  }

  function filteredRows() {
    var q = document.getElementById("q");
    var locFilter = document.getElementById("loc-filter");
    var catFilter = document.getElementById("cat-filter");
    var placeFilter = document.getElementById("place-filter");
    var rows = NmsLogistics.searchStock(store, q ? q.value : "", index);
    if (locFilter && locFilter.value) {
      rows = rows.filter(function (row) { return row.location.id === locFilter.value; });
    }
    if (catFilter && catFilter.value) {
      rows = rows.filter(function (row) { return row.location.category === catFilter.value; });
    }
    if (placeFilter && placeFilter.value === "unpinned") {
      rows = rows.filter(function (row) { return !row.location.geo; });
    } else if (placeFilter && placeFilter.value) {
      var base = null;
      NmsLogistics.knownBases(store).forEach(function (candidate) {
        if (candidate.id === placeFilter.value) base = candidate;
      });
      if (base) {
        rows = rows.filter(function (row) {
          return NmsLogistics.addressMatches(row.location.geo, {
            glyphs: base.glyphs,
            planet: base.planet,
            name: base.name,
            type: base.type
          }, "base");
        });
      }
    }
    return NmsLogistics.sortRows(rows, sortKey, sortDir);
  }

  function mapHref(loc) {
    if (!loc.geo || !loc.geo.glyphs) return "";
    return "/game/guides/no-mans-sky/" + NmsLogistics.placeQuery({
      glyphs: loc.geo.glyphs,
      planet: loc.geo.planet,
      galaxy: loc.geo.galaxy,
      name: loc.geo.baseName || loc.name
    });
  }

  function renderMetrics() {
    var stacks = 0;
    var short = 0;
    store.locations.forEach(function (loc) { stacks += (loc.items || []).length; });
    store.projects.forEach(function (project) {
      project.demands.forEach(function (demand) {
        if (NmsLogistics.shortfallFor(store, demand).shortfall > 0) short += 1;
      });
    });
    var holds = document.getElementById("m-holds");
    var stackEl = document.getElementById("m-stacks");
    var projects = document.getElementById("m-projects");
    var shortEl = document.getElementById("m-short");
    if (holds) holds.textContent = String(store.locations.length);
    if (stackEl) stackEl.textContent = String(stacks);
    if (projects) projects.textContent = String(store.projects.length);
    if (shortEl) shortEl.textContent = String(short);
  }

  function renderSummary(rows) {
    if (!summaryEl) return;
    var q = document.getElementById("q");
    if (!q || !String(q.value || "").trim()) {
      summaryEl.innerHTML = "";
      return;
    }
    var groups = NmsLogistics.summarizeSearch(rows);
    if (!groups.length) {
      summaryEl.innerHTML = "<p>No hold matches that search.</p>";
      return;
    }
    summaryEl.innerHTML = groups.map(function (group) {
      var places = group.places.map(function (place) {
        return "<li>" + esc(place.name) + " · " + esc(place.qty) + "</li>";
      }).join("");
      return "<article><h3>" + esc(group.label) + "</h3><p>" + esc(group.total) + " in total</p><ul>" + places + "</ul></article>";
    }).join("");
  }

  function renderTable() {
    if (!rowsEl) return;
    var rows = filteredRows();
    renderSummary(rows);
    document.querySelectorAll("[data-sort]").forEach(function (btn) {
      var on = btn.getAttribute("data-sort") === sortKey;
      var th = btn.parentNode;
      if (th && th.tagName === "TH") th.setAttribute("aria-sort", on ? (sortDir === "asc" ? "ascending" : "descending") : "none");
    });
    if (!rows.length) {
      rowsEl.innerHTML = '<tr><td colspan="6">No stacks in this view.</td></tr>';
      return;
    }
    rowsEl.innerHTML = rows.map(function (row) {
      var stack = row.item.maxStack ? (row.item.stackApproximate ? "~" : "") + row.item.maxStack : "—";
      var cap = row.location.slotCapacity ? (row.location.slotApproximate ? "~" : "") + row.location.slotCapacity + " slots" : "";
      var href = mapHref(row.location);
      var indexInLoc = row.location.items.indexOf(row.item);
      return "<tr><td>" + esc(row.label) + (row.item.rawId && row.item.rawId !== row.item.id ? " <span class=\"note\">" + esc(row.item.rawId) + "</span>" : "") + "</td><td>" +
        esc(row.item.qty) + "</td><td>" + esc(row.location.name) + (cap ? " · " + esc(cap) : "") +
        (href ? ' · <a href="' + esc(href) + '">Show on map</a>' : "") + "</td><td>" +
        esc(NmsLogistics.CATEGORIES[row.location.category] || row.location.category) + "</td><td>" + esc(stack) +
        '</td><td><div class="row-actions"><button type="button" data-edit="' + esc(row.location.id) + '" data-index="' + indexInLoc +
        '">Edit</button><button type="button" data-remove="' + esc(row.location.id) + '" data-index="' + indexInLoc + '">Remove</button></div></td></tr>';
    }).join("");
  }

  function renderSkipped() {
    if (!skippedEl) return;
    if (!store.skipped.length) {
      skippedEl.innerHTML = "<li>Nothing was skipped on the last import.</li>";
      return;
    }
    skippedEl.innerHTML = store.skipped.map(function (row) {
      return "<li><strong>" + esc(row.label) + ".</strong> " + esc(row.reason) + "</li>";
    }).join("");
  }

  function renderPlan() {
    if (!checklistEl) return;
    if (!store.projects.length) {
      checklistEl.innerHTML = '<p class="note">No projects yet.</p>';
      return;
    }
    checklistEl.innerHTML = store.projects.map(function (project) {
      var body = project.demands.map(function (demand) {
        var report = NmsLogistics.shortfallFor(store, demand);
        var target = NmsLogistics.findLocation(store, demand.locationId);
        var moves = NmsLogistics.suggestTransfers(store, demand);
        var path = "";
        if (report.shortfall > 0 && catalog) {
          var expanded = NmsLogistics.expandRecipe(catalog, demand.itemId, report.shortfall, NmsLogistics.stockMap(store));
          var steps = (expanded.steps || []).map(function (step) {
            var inputs = step.inputs.map(function (input) { return input.qty + " " + nodeName(input.id); }).join(" + ");
            var where = step.kind === "craft" ? "Inventory" : (step.slots ? step.slots + " slot" : "Refine");
            return "<li>" + esc(step.name) + " · " + esc(where) + " · " + esc(inputs) + " → " + esc(step.outQty) + " " + esc(nodeName(step.outId)) + "</li>";
          }).join("");
          var rawKeys = Object.keys(expanded.raw || {});
          var raw = rawKeys.length ? rawKeys.map(function (id) { return expanded.raw[id] + " " + nodeName(id); }).join(", ") : "nothing further";
          path = '<p>Still short ' + esc(report.shortfall) + '. Raw materials: ' + esc(raw) + '.</p>' + (steps ? '<ul class="path">' + steps + "</ul>" : "");
        }
        var pending = moves.map(function (move) {
          return '<label><input type="checkbox" data-transfer="' + esc(demand.id) + '" data-from="' + esc(move.fromId) + '" data-to="' + esc(move.toId) + '" data-item="' + esc(move.itemId) + '" data-qty="' + esc(move.qty) + '"> Move ' + esc(move.qty) + " " + esc(nodeName(move.itemId)) + " from " + esc(move.fromName) + "</label>";
        }).join("");
        var done = (demand.doneTransfers || []).map(function (move) {
          var from = NmsLogistics.findLocation(store, move.fromId);
          return '<p class="done">Moved ' + esc(move.qty) + " from " + esc(from ? from.name : move.fromId) + "</p>";
        }).join("");
        var growers = "";
        if (report.shortfall > 0) {
          var makers = NmsLogistics.producersOf(store, demand.itemId);
          if (makers.length) {
            growers = '<ul class="path">' + makers.map(function (row) {
              var described = NmsLogistics.describeSite(row.site, index);
              var where = (row.site.geo && row.site.geo.baseName) || "A base";
              if (row.perHour) {
                var cover = NmsLogistics.coverHours(report.shortfall, row.perHour);
                var cycle = row.perCycle ? " · ~" + row.perCycle + " per harvest" : "";
                return "<li>" + esc(where) + " · " + esc(described.name) + " × " + esc(row.site.count) +
                  " · ~" + esc(Math.round(row.perHour)) + "/hr" + cycle +
                  (cover != null ? " · about " + esc(NmsLogistics.formatCover(cover)) + " to cover the shortfall" : "") +
                  (row.approximate ? " · approximate" : "") + "</li>";
              }
              var missing = (row.site.kind === "mineral" || row.site.kind === "gas")
                ? "Set a hotspot class to estimate the time."
                : "No documented rate for this part.";
              return "<li>" + esc(where) + " · " + esc(described.name) + " × " + esc(row.site.count) + " · " + esc(missing) + "</li>";
            }).join("") + "</ul>";
          }
        }
        return '<div class="check"><h3>' + esc(nodeName(demand.itemId)) + " · " + esc(demand.qty) + " → " + esc(target ? target.name : "missing hold") +
          "</h3><p>At target " + esc(report.atTarget) + " · elsewhere " + esc(report.elsewhere) + " · short " + esc(report.shortfall) + ".</p>" +
          pending + done + growers + path +
          '<p><button type="button" data-drop-demand="' + esc(project.id) + '" data-demand="' + esc(demand.id) + '">Remove demand</button></p></div>';
      }).join("");
      return '<section class="check"><h2>' + esc(project.name) + (project.recipeFor ? " · " + esc(nodeName(project.recipeFor)) : "") +
        '</h2><p><button type="button" data-drop-project="' + esc(project.id) + '">Remove project</button></p>' +
        (body || '<p class="note">No demands in this project.</p>') + "</section>";
    }).join("");
  }

  function choiceOptions(current) {
    var html = '<option value="">Not in the save</option>';
    NmsLogistics.RESOURCE_CHOICES.forEach(function (pair) {
      html += '<option value="' + esc(pair[0]) + '"' + (pair[0] === current ? " selected" : "") + ">" + esc(pair[1]) + "</option>";
    });
    if (current && !NmsLogistics.RESOURCE_CHOICES.some(function (pair) { return pair[0] === current; })) {
      html += '<option value="' + esc(current) + '" selected>' + esc(current) + "</option>";
    }
    return html;
  }

  function renderProduction() {
    var mount = document.getElementById("production");
    if (!mount) return;
    var sites = store.production || [];
    if (!sites.length) {
      mount.innerHTML = "<p>No extractors or crops yet. Import a save that includes base objects, or the sample.</p>";
      return;
    }
    var groups = {};
    var order = [];
    sites.forEach(function (site) {
      var key = (site.geo && (site.geo.baseName || site.geo.glyphs)) || "Not on the map";
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(site);
    });
    mount.innerHTML = order.map(function (key) {
      var body = groups[key].map(function (site) {
        var row = NmsLogistics.describeSite(site, index);
        var bits = "<h3>" + esc(row.name) + "</h3><p>" + esc(site.count) + " · " + esc(site.objectId) + (site.known ? "" : " · raw id") + "</p>";
        if (site.kind === "mineral" || site.kind === "gas" || site.kind === "amu" || !site.known) {
          bits += '<p><label class="field">Resource<select data-prod="resourceId" data-id="' + esc(site.id) + '">' + choiceOptions(site.resourceId) + "</select></label> " +
            (site.resourceUser ? "user-entered" : "not in the save") + "</p>";
        } else if (row.productName) {
          bits += "<p>" + esc(row.productName) + "</p>";
        }
        if (site.kind === "mineral" || site.kind === "gas") {
          bits += '<p><label class="field">Hotspot<select data-prod="hotspotClass" data-id="' + esc(site.id) + '">' +
            '<option value="">Class not in the save</option>' +
            ["C", "B", "A", "S"].map(function (klass) {
              return '<option value="' + klass + '"' + (site.hotspotClass === klass ? " selected" : "") + ">Class " + klass + "</option>";
            }).join("") + "</select></label></p>";
        }
        if (site.kind === "crop") {
          if (!site.known) {
            bits += '<p><label class="field">Label<input data-prod="label" data-id="' + esc(site.id) + '" type="text" value="' + esc(site.label) + '" placeholder="Crop name"></label></p>';
          }
          bits += '<p><label class="field">Container<select data-prod="container" data-id="' + esc(site.id) + '">' +
            [["", "Container not in the save"], ["tray", "Hydroponic Tray"], ["large-tray", "Large Hydroponic Tray"], ["biodome", "Bio-Dome"], ["standing", "Standing Planter"], ["outdoor", "Outdoor"]].map(function (pair) {
              return '<option value="' + esc(pair[0]) + '"' + ((site.container || "") === pair[0] ? " selected" : "") + ">" + esc(pair[1]) + "</option>";
            }).join("") + "</select></label></p>";
        }
        if (row.rate) {
          bits += "<p>~" + esc(Math.round(row.rate.perHour)) + "/hr" +
            (row.rate.perCycle ? " · ~" + esc(row.rate.perCycle) + " per harvest" : "") +
            " · approximate. " + esc(row.rate.note) + "</p>";
        } else if (site.kind === "mineral" || site.kind === "gas") {
          bits += "<p>No rate until a hotspot class is set.</p>";
        }
        if (row.storage) bits += "<p>Storage " + (row.storage.approximate ? "~" : "") + esc(row.storage.capacity) + ". " + esc(row.storage.note) + "</p>";
        return "<article>" + bits + "</article>";
      }).join("");
      return "<article><h3>" + esc(key) + "</h3>" + body + "</article>";
    }).join("");
  }

  function render() {
    fillControls();
    renderMetrics();
    renderTable();
    renderProduction();
    renderSkipped();
    renderPlan();
  }

  function showTab(name) {
    var inventory = name !== "plan";
    var invBtn = document.getElementById("tab-inventory");
    var planBtn = document.getElementById("tab-plan");
    var invPanel = document.getElementById("panel-inventory");
    var planPanel = document.getElementById("panel-plan");
    if (invBtn) invBtn.setAttribute("aria-selected", inventory ? "true" : "false");
    if (planBtn) planBtn.setAttribute("aria-selected", inventory ? "false" : "true");
    if (invPanel) invPanel.hidden = !inventory;
    if (planPanel) planPanel.hidden = inventory;
    if (!inventory) renderPlan();
  }

  function importOpened(opened, name) {
    var bases = NmsMap.extractBases(opened.data);
    var baseOpt = bases.error ? { planetary: [], freighters: [], problems: [] } : bases;
    store = NmsLogistics.importSave(store, NmsMap.playerStateOf(opened.data), {
      decodeAddress: NmsMap.decodeAddressField,
      bases: baseOpt,
      fileName: name || "",
      format: opened.format || ""
    });
    persist();
    render();
    var flagged = store.skipped.length;
    setStatus("Imported " + store.locations.filter(function (loc) { return loc.source === "save"; }).length +
      " save holds" + (flagged ? ". " + flagged + " sections were flagged and no quantities were guessed." : ".") +
      " Nothing was uploaded.");
  }

  function readFile(file, backup) {
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { setStatus("Could not read that file. Nothing was uploaded."); };
    if (backup) {
      reader.onload = function () {
        try {
          store = NmsLogistics.importDocument(String(reader.result || ""));
          persist();
          render();
          setStatus("Restored the planner backup in this browser. Nothing was uploaded.");
        } catch (err) {
          setStatus("That file is not a logistics backup. Nothing was replaced.");
        }
      };
      reader.readAsText(file);
      return;
    }
    reader.onload = function () {
      NmsMap.readSaveDocument(new Uint8Array(reader.result)).then(function (opened) {
        importOpened(opened, file.name);
      }).catch(function () {
        setStatus("That file is neither exported JSON nor a Steam save. Nothing was uploaded.");
      });
    };
    reader.readAsArrayBuffer(file);
  }

  document.getElementById("tab-inventory").addEventListener("click", function () { showTab("inventory"); });
  document.getElementById("tab-plan").addEventListener("click", function () { showTab("plan"); });

  ["q", "loc-filter", "cat-filter", "place-filter"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderTable);
    el.addEventListener("change", renderTable);
  });

  document.querySelector("thead").addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("[data-sort]") : null;
    if (!btn) return;
    var key = btn.getAttribute("data-sort");
    if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
    else { sortKey = key; sortDir = key === "qty" || key === "stack" ? "desc" : "asc"; }
    renderTable();
  });

  rowsEl.addEventListener("click", function (ev) {
    var edit = ev.target.closest ? ev.target.closest("[data-edit]") : null;
    var remove = ev.target.closest ? ev.target.closest("[data-remove]") : null;
    if (edit) {
      var loc = NmsLogistics.findLocation(store, edit.getAttribute("data-edit"));
      var item = loc && loc.items[Number(edit.getAttribute("data-index"))];
      if (!loc || !item) return;
      editing = { locationId: loc.id, index: Number(edit.getAttribute("data-index")) };
      document.getElementById("item-loc").value = loc.id;
      document.getElementById("item-edit").value = "1";
      document.getElementById("item-qty").value = String(item.qty);
      document.getElementById("item-name").value = item.name || "";
      document.getElementById("item-raw").value = item.rawId && item.rawId !== item.id ? item.rawId : "";
      var catalogSelect = document.getElementById("item-id");
      if (catalogSelect && index && index.byId[item.id]) catalogSelect.value = item.id;
      else if (catalogSelect) catalogSelect.value = "";
      document.getElementById("item-max").value = item.maxStack ? String(item.maxStack) : "";
      document.getElementById("item-approx").checked = !!item.stackApproximate;
      document.getElementById("item-submit").textContent = "Save item";
      setStatus("Editing " + labelOf(item) + " in " + loc.name + ".");
    }
    if (remove) {
      var hold = NmsLogistics.findLocation(store, remove.getAttribute("data-remove"));
      var at = Number(remove.getAttribute("data-index"));
      if (!hold || !hold.items[at]) return;
      hold.items.splice(at, 1);
      persist();
      render();
      setStatus("Removed that stack. Nothing was uploaded.");
    }
  });

  document.getElementById("form-location").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = document.getElementById("loc-name").value.trim();
    if (!name) return;
    var cap = NmsLogistics.posInt(Number(document.getElementById("loc-cap").value));
    var loc = {
      id: NmsLogistics.uid("manual"),
      source: "manual",
      kind: document.getElementById("loc-cat").value || "custom",
      category: document.getElementById("loc-cat").value || "custom",
      name: name,
      slotCapacity: cap,
      slotApproximate: !!document.getElementById("loc-approx").checked && !!cap,
      items: [],
      geo: null,
      note: ""
    };
    store.locations.push(loc);
    var pin = document.getElementById("loc-pin").value;
    if (pin) {
      var base = null;
      NmsLogistics.knownBases(store).forEach(function (candidate) { if (candidate.id === pin) base = candidate; });
      if (base) NmsLogistics.pinLocation(store, loc.id, base);
    }
    persist();
    document.getElementById("form-location").reset();
    render();
    setStatus("Added " + name + ". Nothing was uploaded.");
  });

  document.getElementById("form-item").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var loc = NmsLogistics.findLocation(store, document.getElementById("item-loc").value);
    var qty = NmsLogistics.posInt(Number(document.getElementById("item-qty").value));
    var raw = document.getElementById("item-raw").value.trim();
    var chosen = document.getElementById("item-id").value;
    var resolved = raw ? NmsLogistics.resolveSaveId(raw, index) : null;
    var id = chosen || (resolved && resolved.id) || "";
    if (!loc || !qty || !id) {
      setStatus("Choose a hold, an item, and a quantity.");
      return;
    }
    var maxStack = NmsLogistics.posInt(Number(document.getElementById("item-max").value));
    var name = document.getElementById("item-name").value.trim();
    if (editing && document.getElementById("item-edit").value) {
      var current = loc.items[editing.index];
      if (current && loc.id === editing.locationId) {
        current.id = id;
        current.rawId = raw || (resolved && resolved.rawId) || id;
        current.name = name;
        current.qty = qty;
        current.maxStack = maxStack;
        current.stackApproximate = !!document.getElementById("item-approx").checked && !!maxStack;
        editing = null;
        document.getElementById("item-edit").value = "";
        document.getElementById("item-submit").textContent = "Add item";
        persist();
        render();
        setStatus("Updated that stack. Nothing was uploaded.");
        return;
      }
    }
    loc.items.push({
      id: id,
      rawId: raw || id,
      name: name,
      qty: qty,
      maxStack: maxStack,
      stackApproximate: !!document.getElementById("item-approx").checked && !!maxStack,
      type: ""
    });
    persist();
    render();
    setStatus("Added " + qty + " to " + loc.name + ". Nothing was uploaded.");
  });

  document.getElementById("move-from").addEventListener("change", fillControls);

  document.getElementById("form-move").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var result = NmsLogistics.applyTransfer(store, {
      fromId: document.getElementById("move-from").value,
      toId: document.getElementById("move-to").value,
      itemId: document.getElementById("move-item").value,
      qty: Number(document.getElementById("move-qty").value)
    });
    if (!result.ok) {
      setStatus(result.error === "short" ? "That hold does not have enough." : "Choose two different holds, an item, and a quantity.");
      return;
    }
    store = result.store;
    persist();
    render();
    setStatus("Moved. Nothing was uploaded.");
  });

  document.getElementById("form-pin").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var base = null;
    NmsLogistics.knownBases(store).forEach(function (candidate) {
      if (candidate.id === document.getElementById("pin-base").value) base = candidate;
    });
    var pinned = NmsLogistics.pinLocation(store, document.getElementById("pin-loc").value, base);
    if (!pinned) {
      setStatus("Choose a hold and a base from the last save.");
      return;
    }
    persist();
    render();
    setStatus(pinned.name + " is pinned to " + (base.name || "that place") + ". Nothing was uploaded.");
  });

  document.getElementById("form-project").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = document.getElementById("project-name").value.trim();
    if (!name) return;
    store.projects.push({ id: NmsLogistics.uid("prj"), name: name, recipeFor: "", demands: [] });
    persist();
    document.getElementById("form-project").reset();
    render();
    showTab("plan");
    setStatus("Added " + name + ".");
  });

  document.getElementById("form-demand").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var project = null;
    store.projects.forEach(function (row) {
      if (row.id === document.getElementById("demand-project").value) project = row;
    });
    var qty = NmsLogistics.posInt(Number(document.getElementById("demand-qty").value));
    var itemId = document.getElementById("demand-item").value;
    var locationId = document.getElementById("demand-loc").value;
    if (!project || !qty || !itemId || !locationId) {
      setStatus("Choose a project, a hold, an item, and a quantity.");
      return;
    }
    project.demands.push({ id: NmsLogistics.uid("dmd"), locationId: locationId, itemId: itemId, qty: qty, note: "", doneTransfers: [] });
    persist();
    render();
    setStatus("Demand added.");
  });

  document.getElementById("form-recipe").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!catalog) { setStatus("The recipe graph has not loaded."); return; }
    var itemId = document.getElementById("recipe-item").value;
    var locationId = document.getElementById("recipe-loc").value;
    var qty = Number(document.getElementById("recipe-qty").value);
    var name = document.getElementById("recipe-project").value.trim() || nodeName(itemId);
    var seeded = NmsLogistics.seedRecipe(store, catalog, itemId, qty, locationId, name);
    if (!seeded.project) { setStatus("Choose an item, a quantity, and a hold."); return; }
    store = seeded.store;
    persist();
    render();
    showTab("plan");
    setStatus(seeded.edge ? "Added the direct build cost for " + nodeName(itemId) + "." : "That item has no recipe in this graph, so the demand is the item itself.");
  });

  document.getElementById("form-pins").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var locationId = document.getElementById("pin-target").value;
    var pins = readPins().map(function (id) { return NmsRefine.canonId(id); }).filter(function (id) {
      return index && index.byId[id];
    });
    if (!locationId || !pins.length) {
      setStatus(pins.length ? "Choose a hold for the pins." : "No moodboard pins in this browser.");
      return;
    }
    var seeded = NmsLogistics.seedPins(store, pins, locationId, "Moodboard pins");
    store = seeded.store;
    persist();
    render();
    showTab("plan");
    setStatus("Pins are demands in Moodboard pins.");
  });

  var productionEl = document.getElementById("production");
  if (productionEl) productionEl.addEventListener("change", function (ev) {
    var el = ev.target;
    if (!el || !el.getAttribute || !el.getAttribute("data-prod")) return;
    var patch = {};
    patch[el.getAttribute("data-prod")] = el.value;
    store = NmsLogistics.setProduction(store, el.getAttribute("data-id"), patch);
    persist();
    render();
    setStatus("Production updated in this browser. Nothing was uploaded.");
  });

  checklistEl.addEventListener("change", function (ev) {
    var box = ev.target;
    if (!box || !box.getAttribute || !box.getAttribute("data-transfer")) return;
    var result = NmsLogistics.completeTransfer(store, box.getAttribute("data-transfer"), {
      fromId: box.getAttribute("data-from"),
      toId: box.getAttribute("data-to"),
      itemId: box.getAttribute("data-item"),
      qty: Number(box.getAttribute("data-qty"))
    });
    if (!result.ok) {
      box.checked = false;
      setStatus("That transfer could not be applied.");
      return;
    }
    store = result.store;
    persist();
    render();
    showTab("plan");
    setStatus("Transfer ticked off. The inventory moved. Nothing was uploaded.");
  });

  checklistEl.addEventListener("click", function (ev) {
    var dropDemand = ev.target.closest ? ev.target.closest("[data-drop-demand]") : null;
    var dropProject = ev.target.closest ? ev.target.closest("[data-drop-project]") : null;
    if (dropDemand) {
      store.projects.forEach(function (project) {
        if (project.id !== dropDemand.getAttribute("data-drop-demand")) return;
        project.demands = project.demands.filter(function (demand) {
          return demand.id !== dropDemand.getAttribute("data-demand");
        });
      });
      persist();
      render();
      showTab("plan");
    }
    if (dropProject) {
      store.projects = store.projects.filter(function (project) {
        return project.id !== dropProject.getAttribute("data-drop-project");
      });
      persist();
      render();
      showTab("plan");
    }
  });

  document.getElementById("file-save").addEventListener("change", function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (file) readFile(file, false);
    ev.target.value = "";
  });
  document.getElementById("file-backup").addEventListener("change", function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (file) readFile(file, true);
    ev.target.value = "";
  });
  document.getElementById("btn-export").addEventListener("click", function () {
    var blob = new Blob([NmsLogistics.exportDocument(store)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "nms-logistics.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Downloaded a backup. It never left this browser except as a file you saved.");
  });
  document.getElementById("btn-sample").addEventListener("click", function () {
    fetch("fixture-save.json", { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("sample");
      return res.arrayBuffer();
    }).then(function (buf) {
      return NmsMap.readSaveDocument(new Uint8Array(buf));
    }).then(function (opened) {
      importOpened(opened, "fixture-save.json");
      setStatus("Loaded the synthetic sample. It is not a real save. Nothing was uploaded.");
    }).catch(function () {
      setStatus("The sample file did not load.");
    });
  });

  function applyQuery() {
    var params = new URLSearchParams(window.location.search);
    var item = params.get("item");
    var recipe = params.get("recipe");
    if (item && document.getElementById("q")) document.getElementById("q").value = item.replace(/-/g, " ");
    if (recipe) {
      showTab("plan");
      var recipeItem = document.getElementById("recipe-item");
      var recipeProject = document.getElementById("recipe-project");
      if (recipeItem) recipeItem.value = NmsRefine.canonId(recipe);
      if (recipeProject) recipeProject.value = nodeName(NmsRefine.canonId(recipe));
      if (params.get("qty") && document.getElementById("recipe-qty")) document.getElementById("recipe-qty").value = params.get("qty");
    }
    if (window.location.hash === "#plan") showTab("plan");
    var place = NmsLogistics.parsePlaceQuery(window.location.search);
    if (place.glyphs || place.base) {
      var match = null;
      NmsLogistics.knownBases(store).forEach(function (base) {
        if (match) return;
        if (place.glyphs && String(base.glyphs || "").toUpperCase() !== place.glyphs) return;
        if (place.base && base.name !== place.base) return;
        match = base;
      });
      var placeFilter = document.getElementById("place-filter");
      if (match && placeFilter) placeFilter.value = match.id;
    }
  }

  fetch("../data/graph-v2.json", { credentials: "same-origin" }).then(function (res) {
    if (!res.ok) throw new Error("graph");
    return res.json();
  }).then(function (data) {
    var problems = NmsRefine.validate(data);
    if (problems.length) throw new Error(problems[0]);
    catalog = data;
    index = NmsLogistics.buildIndex(catalog);
    render();
    applyQuery();
    render();
    if (!statusEl.textContent) setStatus("Ready. Nothing is uploaded.");
  }).catch(function () {
    render();
    setStatus("The material graph did not load. Raw ids still work. Nothing was uploaded.");
  });

  render();
})();
