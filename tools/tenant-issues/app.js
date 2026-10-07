/*! Tenant issues — local maintenance log. Nothing is uploaded. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (root) root.SPTenant = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    var boot = function () { api.mount(); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STORAGE_KEY = "sp-tenant-issues-v1";
  var BEGIN = "----- BEGIN TENANT-ISSUES-JSON -----";
  var END = "----- END TENANT-ISSUES-JSON -----";
  var STATUSES = [
    "New",
    "Reported",
    "Acknowledged",
    "Scheduled",
    "In progress",
    "Resolved",
    "Closed",
    "Disputed/Unresolved"
  ];
  var PRIORITIES = ["Urgent", "High", "Medium", "Low"];
  var METHODS = ["Portal", "Email", "Phone", "In person"];
  var CLOSED = { Resolved: 1, Closed: 1 };
  var FIELDS = [
    ["f-title", "title"],
    ["f-location", "location"],
    ["f-description", "description"],
    ["f-category", "category"],
    ["f-priority", "priority"],
    ["f-work", "workOrders"],
    ["f-noticed", "noticed"],
    ["f-reported", "reported"],
    ["f-how", "reportedHow"],
    ["f-contacted", "contacted"],
    ["f-follow", "followUp"],
    ["f-resolved", "resolved"]
  ];

  var state = null;
  var editingId = null;
  var saveTimer = 0;

  function uid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function str(v) {
    if (v == null) return "";
    return String(v);
  }

  function dateStr(v) {
    var s = str(v).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
  }

  function todayISO(now) {
    var d = now ? new Date(now) : new Date();
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  }

  function daysBetween(start, end) {
    if (!start || !end) return null;
    var a = start.split("-");
    var b = end.split("-");
    if (a.length < 3 || b.length < 3) return null;
    var ms = Date.UTC(+b[0], +b[1] - 1, +b[2]) - Date.UTC(+a[0], +a[1] - 1, +a[2]);
    return Math.round(ms / 86400000);
  }

  function isClosed(issue) {
    return CLOSED[issue.status] === 1;
  }

  function isOverdue(issue, today) {
    today = today || todayISO();
    if (!issue || !issue.followUp || isClosed(issue)) return false;
    return issue.followUp < today;
  }

  function isDueToday(issue, today) {
    today = today || todayISO();
    if (!issue || !issue.followUp || isClosed(issue)) return false;
    return issue.followUp === today;
  }

  function daysOpen(issue, today) {
    today = today || todayISO();
    var start = issue.noticed || issue.reported || "";
    if (!start) return null;
    var end = isClosed(issue) && issue.resolved ? issue.resolved : today;
    var n = daysBetween(start, end);
    if (n == null) return null;
    return n < 0 ? 0 : n;
  }

  function daysLabel(n) {
    if (n == null) return "";
    if (n === 0) return "Opened today";
    if (n === 1) return "1 day open";
    return n + " days open";
  }

  function emptyLog() {
    return { id: uid(), date: todayISO(), note: "", status: "" };
  }

  function normalizeLog(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    return {
      id: str(raw.id) || uid(),
      date: dateStr(raw.date),
      note: str(raw.note),
      status: str(raw.status)
    };
  }

  function normalizeIssue(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    var log = [];
    if (Array.isArray(raw.log)) {
      for (var i = 0; i < raw.log.length; i++) log.push(normalizeLog(raw.log[i]));
    }
    return {
      id: str(raw.id) || uid(),
      title: str(raw.title),
      location: str(raw.location),
      description: str(raw.description),
      category: str(raw.category),
      priority: str(raw.priority) || "Medium",
      status: str(raw.status) || "New",
      workOrders: str(raw.workOrders),
      noticed: dateStr(raw.noticed),
      reported: dateStr(raw.reported),
      reportedHow: str(raw.reportedHow),
      contacted: str(raw.contacted),
      followUp: dateStr(raw.followUp),
      resolved: dateStr(raw.resolved),
      log: log
    };
  }

  function emptyIssue() {
    return normalizeIssue({
      id: uid(),
      priority: "Medium",
      status: "New",
      log: []
    });
  }

  function emptyState() {
    return { v: 1, listName: "Apartment issues", unit: "", issues: [] };
  }

  function normalize(data) {
    if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.issues)) {
      throw new Error("This file does not contain an issue list.");
    }
    var issues = [];
    for (var i = 0; i < data.issues.length; i++) issues.push(normalizeIssue(data.issues[i]));
    return {
      v: 1,
      listName: data.listName == null ? "Apartment issues" : str(data.listName),
      unit: str(data.unit),
      issues: issues
    };
  }

  function dash(v) {
    return v ? String(v) : "—";
  }

  function renderReport(data, today) {
    var clean = normalize(data);
    today = today || todayISO();
    var open = 0;
    var overdue = 0;
    var i;
    for (i = 0; i < clean.issues.length; i++) {
      if (!isClosed(clean.issues[i])) open++;
      if (isOverdue(clean.issues[i], today)) overdue++;
    }
    var lines = [];
    lines.push("TENANT ISSUES");
    lines.push("https://stevenphilley.com/tools/tenant-issues/");
    lines.push("Organizing record. Not legal advice. Nothing in this file was uploaded.");
    lines.push("");
    lines.push("List: " + (clean.listName || "—"));
    lines.push("Unit or address: " + dash(clean.unit));
    lines.push("Date: " + today);
    lines.push("Issues: " + clean.issues.length);
    lines.push("Open: " + open);
    lines.push("Overdue follow-ups: " + overdue);
    lines.push("");
    lines.push("The block between the BEGIN and END markers is what Load reads.");
    lines.push("Edit issues on the page, then save again, if you want the file to match.");
    if (!clean.issues.length) {
      lines.push("");
      lines.push("No issues in this list.");
    }
    for (i = 0; i < clean.issues.length; i++) {
      var issue = clean.issues[i];
      var n = daysOpen(issue, today);
      lines.push("");
      lines.push("------------------------------------------------------------");
      lines.push((i + 1) + ". " + (issue.title || "Untitled"));
      lines.push("Location: " + dash(issue.location));
      lines.push("Category: " + dash(issue.category));
      lines.push("Priority: " + dash(issue.priority));
      lines.push("Status: " + dash(issue.status));
      lines.push("Work orders: " + dash(issue.workOrders));
      lines.push("First noticed: " + dash(issue.noticed));
      lines.push("Date reported: " + dash(issue.reported));
      lines.push("How reported: " + dash(issue.reportedHow));
      lines.push("Contacted: " + dash(issue.contacted));
      lines.push("Follow-up due: " + dash(issue.followUp));
      lines.push("Resolved: " + dash(issue.resolved));
      lines.push("Days open: " + (n == null ? "—" : String(n)));
      if (isOverdue(issue, today)) lines.push("OVERDUE follow-up");
      else if (isDueToday(issue, today)) lines.push("Follow-up due today");
      lines.push("");
      lines.push("Description:");
      lines.push(issue.description || "—");
      lines.push("");
      lines.push("Activity:");
      if (!issue.log.length) {
        lines.push("—");
      } else {
        for (var j = 0; j < issue.log.length; j++) {
          var entry = issue.log[j];
          var bit = "- " + dash(entry.date) + " — " + (entry.note || "—");
          if (entry.status) bit += " [" + entry.status + "]";
          lines.push(bit);
        }
      }
    }
    lines.push("------------------------------------------------------------");
    lines.push("");
    return lines.join("\n");
  }

  function serialize(data, today) {
    var clean = normalize(data);
    var json = JSON.stringify(clean, null, 2);
    return renderReport(clean, today) + "\n" + BEGIN + "\n" + json + "\n" + END + "\n";
  }

  function parse(text) {
    if (typeof text !== "string") throw new Error("Not a text file.");
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var lines = text.split(/\r\n|\n|\r/);
    var begin = -1;
    var end = -1;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === BEGIN) begin = i;
      if (line === END) end = i;
    }
    if (begin < 0 || end < begin) {
      throw new Error("No tenant-issues data block in this file.");
    }
    var json = lines.slice(begin + 1, end).join("\n").trim();
    var data;
    try {
      data = JSON.parse(json);
    } catch (e) {
      throw new Error("The data block in this file is not valid JSON.");
    }
    return normalize(data);
  }

  function cloneState(data) {
    return JSON.parse(JSON.stringify(normalize(data)));
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(msg) {
    var node = el("status");
    if (node) node.textContent = msg || "";
  }

  function currentIssue() {
    if (!state || !editingId) return null;
    for (var i = 0; i < state.issues.length; i++) {
      if (state.issues[i].id === editingId) return state.issues[i];
    }
    return null;
  }

  function writeStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      setStatus("Could not autosave in this browser. Use Save .txt to keep a copy.");
    }
  }

  function persist() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(writeStorage, 80);
  }

  function loadStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      return normalize(JSON.parse(raw));
    } catch (e) {
      setStatus("Could not read the list saved in this browser. Load a .txt if you have one.");
      return emptyState();
    }
  }

  function fillSelect(select, options, placeholder) {
    select.innerHTML = "";
    if (placeholder != null) {
      var blank = document.createElement("option");
      blank.value = "";
      blank.textContent = placeholder;
      select.appendChild(blank);
    }
    for (var i = 0; i < options.length; i++) {
      var opt = document.createElement("option");
      opt.value = options[i];
      opt.textContent = options[i];
      select.appendChild(opt);
    }
  }

  function ensureOption(select, value) {
    if (!value) {
      select.value = "";
      return;
    }
    var found = false;
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === value) found = true;
    }
    if (!found) {
      var opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    }
    select.value = value;
  }

  function statusOptions(select, includeBlank) {
    fillSelect(select, STATUSES, includeBlank ? "No status change" : null);
  }

  function filename(today) {
    return "tenant-issues-" + (today || todayISO()) + ".txt";
  }

  function downloadText(text, name) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function matches(issue, query, status) {
    if (status && issue.status !== status) return false;
    if (!query) return true;
    var parts = [
      issue.title, issue.location, issue.description, issue.category,
      issue.priority, issue.status, issue.workOrders, issue.reportedHow,
      issue.contacted, issue.noticed, issue.reported, issue.followUp, issue.resolved
    ];
    for (var i = 0; i < issue.log.length; i++) {
      parts.push(issue.log[i].date, issue.log[i].note, issue.log[i].status);
    }
    return parts.join("\n").toLowerCase().indexOf(query) !== -1;
  }

  function activityKey(issue) {
    var best = "";
    var dates = [issue.noticed, issue.reported, issue.followUp, issue.resolved];
    for (var i = 0; i < issue.log.length; i++) dates.push(issue.log[i].date);
    for (var j = 0; j < dates.length; j++) {
      if (dates[j] && dates[j] > best) best = dates[j];
    }
    return best;
  }

  function cmpDateDesc(a, b, keyFn) {
    var da = keyFn(a);
    var db = keyFn(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    if (da === db) return 0;
    return da < db ? 1 : -1;
  }

  function viewIssues() {
    var query = (el("q").value || "").trim().toLowerCase();
    var status = el("filter").value || "";
    var mode = el("sort").value || "noticed-desc";
    var list = [];
    for (var i = 0; i < state.issues.length; i++) {
      if (matches(state.issues[i], query, status)) list.push(state.issues[i]);
    }
    list.sort(function (a, b) {
      if (editingId) {
        if (a.id === editingId) return -1;
        if (b.id === editingId) return 1;
      }
      if (mode === "priority") {
        var ra = PRIORITIES.indexOf(a.priority);
        var rb = PRIORITIES.indexOf(b.priority);
        if (ra < 0) ra = 9;
        if (rb < 0) rb = 9;
        if (ra !== rb) return ra - rb;
        return cmpDateDesc(a, b, function (issue) { return issue.noticed || issue.reported || ""; });
      }
      if (mode === "followup") {
        if (!a.followUp && !b.followUp) return 0;
        if (!a.followUp) return 1;
        if (!b.followUp) return -1;
        if (a.followUp === b.followUp) return 0;
        return a.followUp < b.followUp ? -1 : 1;
      }
      if (mode === "noticed-asc") {
        var da = a.noticed || a.reported || "";
        var db = b.noticed || b.reported || "";
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        if (da === db) return 0;
        return da < db ? -1 : 1;
      }
      if (mode === "activity") return cmpDateDesc(a, b, activityKey);
      return cmpDateDesc(a, b, function (issue) { return issue.noticed || issue.reported || ""; });
    });
    return list;
  }

  function renderCounts() {
    var host = el("counts");
    var current = el("filter").value || "";
    host.innerHTML = "";
    var counts = { "": state.issues.length };
    var s;
    for (s = 0; s < STATUSES.length; s++) counts[STATUSES[s]] = 0;
    var open = 0;
    var overdue = 0;
    var today = todayISO();
    for (var i = 0; i < state.issues.length; i++) {
      var issue = state.issues[i];
      if (counts[issue.status] == null) counts[issue.status] = 0;
      counts[issue.status]++;
      if (!isClosed(issue)) open++;
      if (isOverdue(issue, today)) overdue++;
    }
    function addBtn(value, label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "count-btn";
      btn.setAttribute("aria-pressed", String(current === value));
      btn.dataset.filter = value;
      var name = document.createElement("span");
      name.textContent = label;
      var num = document.createElement("span");
      num.className = "count-num";
      num.textContent = String(counts[value] || 0);
      btn.appendChild(name);
      btn.appendChild(num);
      btn.addEventListener("click", function () {
        el("filter").value = value;
        render();
      });
      host.appendChild(btn);
    }
    addBtn("", "All");
    for (s = 0; s < STATUSES.length; s++) addBtn(STATUSES[s], STATUSES[s]);
    var extra = document.createElement("p");
    extra.className = "count-note";
    extra.textContent = open + " open · " + overdue + " overdue follow-up" + (overdue === 1 ? "" : "s");
    host.appendChild(extra);
  }

  function renderList() {
    var host = el("issue-list");
    var shown = viewIssues();
    var today = todayISO();
    host.innerHTML = "";
    var meta = el("showing");
    var query = (el("q").value || "").trim();
    var status = el("filter").value || "";
    if (query || status) {
      meta.textContent = "Showing " + shown.length + " of " + state.issues.length;
    } else {
      meta.textContent = state.issues.length ? (state.issues.length + " in this list") : "";
    }
    if (!shown.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = state.issues.length
        ? "No issues match this filter."
        : "No issues yet. Add one, or load a .txt you saved earlier.";
      host.appendChild(empty);
      return;
    }
    for (var i = 0; i < shown.length; i++) {
      host.appendChild(issueCard(shown[i], today));
    }
  }

  function issueCard(issue, today) {
    var art = document.createElement("article");
    art.className = "issue";
    art.dataset.id = issue.id;
    if (issue.id === editingId) art.classList.add("is-editing");
    if (isOverdue(issue, today)) art.classList.add("is-overdue");
    else if (isDueToday(issue, today)) art.classList.add("is-due");

    var main = document.createElement("div");
    var title = document.createElement("h3");
    var open = document.createElement("button");
    open.type = "button";
    open.className = "issue-title";
    open.textContent = issue.title || "Untitled";
    open.addEventListener("click", function () { openEditor(issue.id); });
    title.appendChild(open);

    var meta = document.createElement("p");
    meta.className = "issue-meta";
    var bits = [];
    if (issue.location) bits.push(issue.location);
    if (issue.category) bits.push(issue.category);
    if (issue.priority) bits.push(issue.priority);
    meta.textContent = bits.join(" · ") || "No location yet";

    var flags = document.createElement("p");
    flags.className = "issue-flags";
    var st = document.createElement("span");
    st.className = "pill";
    st.textContent = issue.status || "New";
    flags.appendChild(st);
    var days = daysLabel(daysOpen(issue, today));
    if (days) {
      var d = document.createElement("span");
      d.className = "days";
      d.textContent = days;
      flags.appendChild(d);
    }
    if (issue.workOrders) {
      var wo = document.createElement("span");
      wo.className = "wo";
      wo.textContent = issue.workOrders;
      flags.appendChild(wo);
    }

    main.appendChild(title);
    main.appendChild(meta);
    main.appendChild(flags);

    if (isOverdue(issue, today)) {
      var late = document.createElement("p");
      late.className = "flag-late";
      late.textContent = "Follow-up overdue · due " + issue.followUp;
      main.appendChild(late);
    } else if (isDueToday(issue, today)) {
      var due = document.createElement("p");
      due.className = "flag-due";
      due.textContent = "Follow-up due today";
      main.appendChild(due);
    }

    var actions = document.createElement("div");
    actions.className = "issue-actions";
    var edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", function () { openEditor(issue.id); });
    var del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", function () { deleteIssue(issue.id); });
    actions.appendChild(edit);
    actions.appendChild(del);

    art.appendChild(main);
    art.appendChild(actions);
    return art;
  }

  function render() {
    renderCounts();
    renderList();
  }

  function commitFields() {
    var issue = currentIssue();
    if (!issue) return;
    for (var i = 0; i < FIELDS.length; i++) {
      var node = el(FIELDS[i][0]);
      if (node) issue[FIELDS[i][1]] = node.value;
    }
    persist();
    render();
  }

  function onStatusChange() {
    var issue = currentIssue();
    if (!issue) return;
    var next = el("f-status").value;
    if (issue.status !== next) {
      issue.status = next;
      issue.log.push({
        id: uid(),
        date: todayISO(),
        note: "Status set to " + next + ".",
        status: next
      });
      renderLog(issue);
    }
    persist();
    render();
  }

  function fillEditor(issue) {
    for (var i = 0; i < FIELDS.length; i++) {
      var node = el(FIELDS[i][0]);
      if (!node) continue;
      if (node.tagName === "SELECT") ensureOption(node, issue[FIELDS[i][1]] || "");
      else node.value = issue[FIELDS[i][1]] || "";
    }
    ensureOption(el("f-status"), issue.status || "New");
    renderLog(issue);
  }

  function renderLog(issue) {
    var list = el("log-list");
    list.innerHTML = "";
    if (!issue.log.length) {
      var empty = document.createElement("li");
      empty.className = "log-empty";
      empty.textContent = "No notes yet.";
      list.appendChild(empty);
      return;
    }
    for (var i = 0; i < issue.log.length; i++) {
      list.appendChild(logRow(issue, issue.log[i]));
    }
  }

  function logRow(issue, entry) {
    var li = document.createElement("li");
    li.className = "log-row";
    var date = document.createElement("input");
    date.type = "date";
    date.value = entry.date || "";
    date.setAttribute("aria-label", "Note date");
    date.addEventListener("input", function () {
      entry.date = date.value;
      persist();
    });
    var note = document.createElement("textarea");
    note.rows = 2;
    note.value = entry.note || "";
    note.setAttribute("aria-label", "Note");
    note.addEventListener("input", function () {
      entry.note = note.value;
      persist();
    });
    var status = document.createElement("select");
    status.setAttribute("aria-label", "Status recorded on this note");
    statusOptions(status, true);
    ensureOption(status, entry.status || "");
    status.addEventListener("change", function () {
      entry.status = status.value;
      persist();
    });
    var del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete note";
    del.addEventListener("click", function () {
      issue.log = issue.log.filter(function (item) { return item.id !== entry.id; });
      renderLog(issue);
      persist();
      render();
    });
    li.appendChild(date);
    li.appendChild(note);
    li.appendChild(status);
    li.appendChild(del);
    return li;
  }

  function openEditor(id) {
    var issue = null;
    for (var i = 0; i < state.issues.length; i++) {
      if (state.issues[i].id === id) issue = state.issues[i];
    }
    if (!issue) return;
    editingId = id;
    el("editor").hidden = false;
    fillEditor(issue);
    render();
    var title = el("f-title");
    if (title) title.focus();
    el("editor").scrollIntoView({ block: "nearest" });
  }

  function isBlank(issue) {
    if (!issue) return false;
    if (issue.title || issue.location || issue.description || issue.category || issue.workOrders || issue.contacted || issue.reportedHow) return false;
    if (issue.noticed || issue.reported || issue.followUp || issue.resolved) return false;
    if (issue.log.length) return false;
    if (issue.status !== "New" || issue.priority !== "Medium") return false;
    return true;
  }

  function closeEditor() {
    var issue = currentIssue();
    if (issue && isBlank(issue)) {
      state.issues = state.issues.filter(function (item) { return item.id !== issue.id; });
      writeStorage();
    }
    editingId = null;
    var editor = el("editor");
    if (editor) editor.hidden = true;
    render();
  }

  function addIssue() {
    var issue = emptyIssue();
    state.issues.unshift(issue);
    persist();
    openEditor(issue.id);
    setStatus("New issue. It is already stored in this browser.");
  }

  function deleteIssue(id) {
    var issue = null;
    for (var i = 0; i < state.issues.length; i++) {
      if (state.issues[i].id === id) issue = state.issues[i];
    }
    if (!issue) return;
    var label = issue.title || "Untitled";
    if (!window.confirm("Delete \"" + label + "\"? This removes it from the list in this browser. A .txt you already saved is not changed.")) return;
    state.issues = state.issues.filter(function (item) { return item.id !== id; });
    if (editingId === id) {
      editingId = null;
      el("editor").hidden = true;
    }
    writeStorage();
    render();
    setStatus("Deleted \"" + label + "\".");
  }

  function addLog() {
    var issue = currentIssue();
    if (!issue) return;
    var date = el("log-date").value || todayISO();
    var note = el("log-note").value || "";
    var status = el("log-status").value || "";
    if (!note.trim() && !status) {
      setStatus("Write a note, or pick a status, before adding it.");
      return;
    }
    issue.log.push({ id: uid(), date: dateStr(date) || todayISO(), note: note, status: status });
    if (status) {
      issue.status = status;
      ensureOption(el("f-status"), status);
    }
    el("log-note").value = "";
    el("log-status").value = "";
    el("log-date").value = todayISO();
    renderLog(issue);
    persist();
    render();
    setStatus(status ? "Note added. Status is now " + status + "." : "Note added.");
  }

  function saveFile() {
    var text = serialize(state);
    var name = filename();
    downloadText(text, name);
    setStatus("Saved " + name + ".");
  }

  function onFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var next;
      try {
        next = parse(String(reader.result || ""));
      } catch (err) {
        setStatus(err.message || "Could not read that file.");
        return;
      }
      if (state.issues.length && !window.confirm("Replace the current list with this file?")) {
        setStatus("Load cancelled. The current list is unchanged.");
        return;
      }
      state = next;
      editingId = null;
      el("editor").hidden = true;
      el("list-name").value = state.listName;
      el("unit").value = state.unit;
      writeStorage();
      render();
      var n = state.issues.length;
      setStatus("Loaded " + file.name + " — " + n + " issue" + (n === 1 ? "" : "s") + ".");
    };
    reader.onerror = function () {
      setStatus("Could not read that file.");
    };
    reader.readAsText(file, "UTF-8");
  }

  function copySummary() {
    var text = renderReport(state);
    var done = function () { setStatus("Summary copied."); };
    var fallback = function () {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove();
      setStatus(ok ? "Summary copied." : "Could not copy. Use Print or Save .txt.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  function showSummary(force) {
    var pre = el("summary");
    var btn = el("btn-summary");
    pre.textContent = renderReport(state);
    var open = force ? true : pre.hidden;
    pre.hidden = !open;
    if (btn) btn.setAttribute("aria-expanded", String(open));
    return open;
  }

  function newList() {
    if (!window.confirm("Start a new list? This clears the issues stored in this browser. Download a .txt first if you want to keep a copy.")) return;
    state = emptyState();
    editingId = null;
    el("editor").hidden = true;
    el("list-name").value = state.listName;
    el("unit").value = state.unit;
    el("q").value = "";
    el("filter").value = "";
    writeStorage();
    render();
    if (!el("summary").hidden) showSummary(true);
    setStatus("New list. A .txt you already downloaded is unchanged.");
  }

  function bindHelp() {
    var helpBtn = el("tenant-help");
    var helpDialog = el("tenant-help-dialog");
    if (!helpBtn || !helpDialog) return;
    var previously = null;
    var scrollLock = "";

    function focusables() {
      return [].slice.call(helpDialog.querySelectorAll("button, a[href]")).filter(function (node) {
        return !node.disabled && node.offsetParent !== null;
      });
    }
    function openHelp() {
      if (!helpDialog.hidden) return;
      previously = document.activeElement;
      helpDialog.hidden = false;
      helpBtn.setAttribute("aria-expanded", "true");
      scrollLock = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      var closer = helpDialog.querySelector("[data-help-close]");
      if (closer) closer.focus();
    }
    function closeHelp() {
      if (helpDialog.hidden) return;
      helpDialog.hidden = true;
      helpBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = scrollLock;
      var back = previously;
      previously = null;
      if (back && typeof back.focus === "function") back.focus();
      else helpBtn.focus();
    }
    helpBtn.addEventListener("click", function () {
      if (helpDialog.hidden) openHelp();
      else closeHelp();
    });
    helpDialog.addEventListener("click", function (ev) {
      if (ev.target === helpDialog) closeHelp();
    });
    [].slice.call(helpDialog.querySelectorAll("[data-help-close]")).forEach(function (btn) {
      btn.addEventListener("click", closeHelp);
    });
    document.addEventListener("keydown", function (ev) {
      if (helpDialog.hidden) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeHelp();
        return;
      }
      if (ev.key !== "Tab") return;
      var nodes = focusables();
      if (!nodes.length) {
        ev.preventDefault();
        return;
      }
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      var active = document.activeElement;
      if (ev.shiftKey && (active === first || !helpDialog.contains(active))) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && active === last) {
        ev.preventDefault();
        first.focus();
      }
    });
  }

  function mount() {
    if (!el("btn-add") || !el("issue-list")) return;
    state = loadStorage();
    fillSelect(el("f-priority"), PRIORITIES, null);
    statusOptions(el("f-status"), false);
    fillSelect(el("f-how"), METHODS, "—");
    statusOptions(el("log-status"), true);
    el("list-name").value = state.listName;
    el("unit").value = state.unit;
    el("log-date").value = todayISO();

    el("list-name").addEventListener("input", function () {
      state.listName = el("list-name").value;
      persist();
    });
    el("unit").addEventListener("input", function () {
      state.unit = el("unit").value;
      persist();
    });
    for (var i = 0; i < FIELDS.length; i++) {
      (function (id) {
        var node = el(id);
        node.addEventListener("input", commitFields);
        node.addEventListener("change", commitFields);
      })(FIELDS[i][0]);
    }
    el("f-status").addEventListener("change", onStatusChange);
    el("btn-add").addEventListener("click", addIssue);
    el("btn-save").addEventListener("click", saveFile);
    el("btn-copy").addEventListener("click", copySummary);
    el("btn-print").addEventListener("click", function () {
      showSummary(true);
      window.print();
    });
    el("btn-summary").addEventListener("click", function () { showSummary(false); });
    el("btn-new").addEventListener("click", newList);
    el("btn-log-add").addEventListener("click", addLog);
    el("btn-close").addEventListener("click", closeEditor);
    el("btn-delete").addEventListener("click", function () {
      if (editingId) deleteIssue(editingId);
    });
    el("file").addEventListener("change", function () {
      var file = el("file").files && el("file").files[0];
      el("file").value = "";
      if (file) onFile(file);
    });
    el("q").addEventListener("input", render);
    el("filter").addEventListener("change", render);
    el("sort").addEventListener("change", render);
    window.addEventListener("beforeprint", function () {
      el("summary").textContent = renderReport(state);
    });
    bindHelp();
    render();
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    BEGIN: BEGIN,
    END: END,
    STATUSES: STATUSES,
    PRIORITIES: PRIORITIES,
    METHODS: METHODS,
    emptyState: emptyState,
    emptyIssue: emptyIssue,
    normalize: normalize,
    serialize: serialize,
    parse: parse,
    renderReport: renderReport,
    daysOpen: daysOpen,
    isOverdue: isOverdue,
    isDueToday: isDueToday,
    todayISO: todayISO,
    cloneState: cloneState,
    getState: function () { return state ? cloneState(state) : null; },
    mount: mount
  };
});
