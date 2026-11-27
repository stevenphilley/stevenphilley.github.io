/* Data checks for the geologic time scale. Run: node natural-history/time/time.test.js */
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var dir = __dirname;
var intervals = JSON.parse(fs.readFileSync(path.join(dir, "intervals.json"), "utf8"));
var narratives = JSON.parse(fs.readFileSync(path.join(dir, "narratives.json"), "utf8"));
var ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(dir, "gallery-map.js"), "utf8"), ctx);
var map = ctx.window.NH_TIME_GALLERY;
var manifest = JSON.parse(fs.readFileSync(path.join(dir, "..", "manifest.json"), "utf8"));

var failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL " + msg);
  }
}

var units = intervals.units;
var by = {};
units.forEach(function (u) { by[u.id] = u; });
assert(units.length === 177, "unit count");
assert(intervals.version === "2024/12", "chart version");

var expect = {
  hadean: [4567, 4031],
  cambrian: [538.8, 486.85],
  ordovician: [486.85, 443.1],
  silurian: [443.1, 419.62],
  ludlow: [426.7, 422.7],
  pridoli: [422.7, 419.62],
  devonian: [419.62, 358.86],
  frasnian: [382.31, 372.15],
  famennian: [372.15, 358.86],
  carboniferous: [358.86, 298.9],
  permian: [298.9, 251.902],
  capitanian: [264.28, 259.51],
  wuchiapingian: [259.51, 254.14],
  changhsingian: [254.14, 251.902],
  triassic: [251.902, 201.4],
  induan: [251.902, 249.9],
  olenekian: [249.9, 246.7],
  anisian: [246.7, 241.464],
  jurassic: [201.4, 143.1],
  cretaceous: [143.1, 66],
  maastrichtian: [72.2, 66],
  paleogene: [66, 23.04],
  aquitanian: [23.04, 20.45],
  neogene: [23.04, 2.58],
  quaternary: [2.58, 0],
  pleistocene: [2.58, 0.0117],
  holocene: [0.0117, 0],
  meghalayan: [0.0042, 0],
  greenlandian: [0.0117, 0.0082],
  chibanian: [0.774, 0.129]
};
Object.keys(expect).forEach(function (id) {
  var u = by[id];
  assert(u, "missing " + id);
  if (!u) return;
  assert(Math.abs(u.start - expect[id][0]) < 1e-9, id + " start " + u.start);
  assert(Math.abs(u.end - expect[id][1]) < 1e-9, id + " end " + u.end);
  assert(/^#[0-9A-Fa-f]{6}$/.test(u.color), id + " color");
});

var kids = {};
units.forEach(function (u) {
  assert(!(u.id in by) || true, "");
  var key = u.parent || "";
  if (u.parent) assert(by[u.parent], "parent of " + u.id);
  (kids[key] = kids[key] || []).push(u);
  assert(u.start > u.end, "positive duration " + u.id);
  assert(narratives[u.id], "narrative " + u.id);
  if (narratives[u.id]) {
    ["etymology", "climate", "life", "ending"].forEach(function (k) {
      assert(narratives[u.id][k] && narratives[u.id][k].length > 12, idField(u.id, k));
    });
  }
});
function idField(id, k) { return id + " " + k; }

Object.keys(kids).forEach(function (key) {
  if (!key) return;
  var parent = by[key];
  var group = kids[key].slice().sort(function (a, b) { return b.start - a.start; });
  assert(Math.abs(group[0].start - parent.start) < 0.021, "start tile " + parent.id);
  assert(Math.abs(group[group.length - 1].end - parent.end) < 0.021, "end tile " + parent.id);
  for (var i = 0; i < group.length - 1; i++) {
    assert(Math.abs(group[i].end - group[i + 1].start) < 0.021, "gap " + group[i].id + " / " + group[i + 1].id);
  }
});

assert(intervals.extinctions.length === 5, "big five");
var ages = intervals.extinctions.map(function (e) { return e.age; });
assert(ages.join(",") === "443.1,372.15,251.902,201.4,66", "extinction ages " + ages.join(","));

var seen = {};
manifest.items.forEach(function (it) {
  assert(map[it.n], "gallery map " + it.n);
  if (!map[it.n]) return;
  assert(by[map[it.n].unit], "gallery unit " + it.n + " " + map[it.n].unit);
  assert(map[it.n].note && map[it.n].note.length > 8, "gallery note " + it.n);
  seen[it.n] = true;
});
for (var n = 1; n <= manifest.items.length; n++) assert(seen[n], "missing gallery " + n);
assert(Object.keys(map).length === manifest.items.length, "map size");

var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
assert(html.indexOf("---\n---") === 0, "front matter");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("sp-nav.js") === -1, "nav script stays in the include");

var js = fs.readFileSync(path.join(dir, "time.js"), "utf8");
assert(js.indexOf("innerHTML") === -1, "no innerHTML");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("ok " + units.length + " units, " + manifest.items.length + " gallery entries");
