/* Ocean-worlds desk checks. Cited strings, e-squared shape, blank cells.
   Run: node science/astronomy/ocean-worlds/ocean-worlds.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var OW = require("./ocean-worlds.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(OW.EUROPA_E === 0.009, "Europa eccentricity");
assert(OW.ratioText(OW.EUROPA_DAYS, OW.IO_DAYS) === "2.007295", "Europa/Io");
assert(OW.ratioText(OW.GANYMEDE_DAYS, OW.EUROPA_DAYS) === "2.014697", "Ganymede/Europa");
assert(OW.ratioText(OW.GANYMEDE_DAYS, OW.IO_DAYS) === "4.044090", "Ganymede/Io");
assert(OW.ratioText(OW.DIONE_DAYS, OW.ENCELADUS_DAYS) === "1.997430", "Dione/Enceladus");
assert(OW.laplaceSentence().indexOf("2.007295") !== -1, "Laplace sentence");
assert(OW.enceladusSentence().indexOf("1.997430") !== -1, "Enceladus sentence");

assert(OW.heatScale(0) === 0 && OW.flexScale(0) === 0, "circular orbit");
assert(OW.heatScale(0.009) === 1 && OW.flexScale(0.009) === 1, "Europa is the unit");
assert(near(OW.heatScale(0.0045), 0.25, 1e-12), "half the eccentricity is a quarter of the heat");
assert(OW.heatScale(0.018) / OW.heatScale(0.009) === 4, "doubling e quadruples the heat mark");
assert(OW.formatHeat(0) === "0" && OW.formatFlex(0) === "0", "zero labels");
assert(OW.formatHeat(0.009) === "1" && OW.formatFlex(0.009) === "1", "unit labels");
assert(OW.formatHeat(0.0045) === "0.25", "Enceladus heat label");
assert(OW.formatHeat(0.0292) === "10.53", "Titan heat label");
assert(OW.formatHeat(0.000016) === "3.16 × 10^-6", "Triton heat label");
assert(OW.formatFlex(0.001) === "0.1111", "Ganymede flex label");

var ids = ["europa", "enceladus", "ganymede", "callisto", "titan", "triton", "pluto"];
assert(OW.ids().join(",") === ids.join(","), "order");
ids.forEach(function (id) {
  var m = OW.moonById(id);
  assert(m, id);
  assert(near(OW.shareSum(id), 1, 1e-12), id + " drawing shares sum to 1");
  assert(m.why.toLowerCase().indexOf("not to scale") !== -1, id + " says not to scale");
  assert(m.why.indexOf("undefined") === -1 && m.why.indexOf("NaN") === -1, id + " explanation is filled");
  var st = OW.stats(id);
  assert(st.length === 7, id + " stats");
  assert(st[1][1] === m.radius && st[4][1] === m.ice && st[5][1] === m.ocean, id + " cells");
});

assert(OW.moonById("callisto").ocean === "—", "Callisto ocean depth omitted");
assert(OW.moonById("titan").ice === "—" && OW.moonById("titan").ocean === "—", "Titan thicknesses omitted");
assert(OW.moonById("triton").ice === "—" && OW.moonById("triton").ocean === "—", "Triton thicknesses omitted");
assert(OW.moonById("pluto").ice === "—" && OW.moonById("pluto").ocean === "—" && OW.moonById("pluto").parent === "—", "Pluto thicknesses and parent omitted");
assert(OW.moonById("pluto").ecc === null, "Pluto solar eccentricity is not a tide");
assert(OW.limitsNote().indexOf("Educational schematic") === 0, "disclaimer");
assert(OW.missionsNote().indexOf("14 October 2024") !== -1, "Clipper launch");
assert(OW.missionsNote().indexOf("not a life-detection mission") !== -1, "Clipper is not a life detection");
assert(OW.ariaCutaway("europa").indexOf("1,560.8 km") !== -1, "cutaway label");
assert(OW.ariaTide(0).indexOf("Relative heating 0") !== -1, "tide label at zero");

var htmlPath = path.join(__dirname, "index.html");
var html = fs.readFileSync(htmlPath, "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/ocean-worlds/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("ocean-worlds.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(OW.limitsNote()) !== -1, "disclaimer on the page");
assert(html.indexOf(OW.tideNote()) !== -1, "tide note");
assert(html.indexOf(OW.laplaceSentence()) !== -1, "Laplace sentence on the page");
assert(html.indexOf(OW.enceladusSentence()) !== -1, "Enceladus ratio on the page");
assert(html.indexOf(OW.missionsNote()) !== -1, "missions note");
ids.forEach(function (id) {
  assert(html.indexOf(OW.moonById(id).why) !== -1, id + " explanation is on the page");
  assert(html.indexOf('data-moon="' + id + '"') !== -1, id + " button");
});
assert(html.indexOf("1,560.8 km") !== -1 && html.indexOf("3.551181 days") !== -1, "Europa sheet");
assert(html.indexOf("257 × 251 × 248 km") !== -1, "Enceladus radii");
assert(html.indexOf("2,631.2 km") !== -1, "Ganymede radius");
assert(html.indexOf("k₂ = 0.589 ± 0.150") !== -1, "Iess k2");
assert(html.indexOf("k₂ = 0.375 ± 0.06") !== -1, "Goossens k2");
assert(html.indexOf('id="cut-canvas"') !== -1 && html.indexOf('id="tide-canvas"') !== -1, "canvases");
assert(html.indexOf("/science/astronomy/resonances/") !== -1, "links resonances");
assert(html.indexOf("/science/astronomy/tides/") !== -1, "links tides");
assert(html.indexOf("/science/astronomy/habitable-zone/") !== -1, "links habitable zone");
assert(html.indexOf("/science/astronomy/jupiter/") !== -1, "links jupiter");
assert(html.indexOf("/science/astronomy/saturn/") !== -1, "links saturn");
assert(html.indexOf("/science/astronomy/dwarf-planets/") !== -1, "links dwarf planets");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/ocean-worlds/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/ocean-worlds/") !== -1, "science index links the desk");
["jupiter", "saturn", "tides", "resonances", "dwarf-planets", "habitable-zone"].forEach(function (desk) {
  var page = fs.readFileSync(path.join(__dirname, "../" + desk + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/ocean-worlds/") !== -1, desk + " links back");
});
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/ocean-worlds/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/ocean-worlds/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/ocean-worlds/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/ocean-worlds/") found = true;
  });
});
assert(found, "whats-new lists the desk");

console.log("ocean-worlds.test.js: ok");
