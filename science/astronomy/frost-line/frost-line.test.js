/* Frost-line desk checks. Hayashi’s profile as later papers print it.
   Run: node science/astronomy/frost-line/frost-line.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var F = require("./frost-line.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(F.T0 === 280, "280 K normalization");
assert(F.T_PAPER === 170, "170 K paper temperature");
assert(F.PAPER_AU === 2.7, "papers print 2.7 AU");
assert(F.T_MIN === 120 && F.T_MAX === 180, "cited temperature ends");
assert(F.SCALE_MIN === 0.5 && F.SCALE_MAX === 2, "teaching scale ends");

var line = F.snowAu(1, 170);
assert(near(line, Math.pow(280 / 170, 2), 1e-12), "line is (280/170)^2");
assert(F.fmtAu(line) === "2.713 AU", "arithmetic rounds to 2.713 AU");
assert(F.fmtAu(line) !== "2.700 AU", "2.713 is not rewritten as 2.7");
assert(F.temperature(1, 1) === 280, "280 K at 1 AU");
assert(F.roundT(F.temperature(1.00000011, 1)) === 280, "Earth’s axis is 280 K to the nearest kelvin");

var expectT = {
  Mercury: 450,
  Venus: 329,
  Earth: 280,
  Mars: 227,
  Jupiter: 123,
  Saturn: 91,
  Uranus: 64,
  Neptune: 51
};
Object.keys(expectT).forEach(function (name) {
  var p = F.planetByName(name);
  assert(p, name);
  assert(F.roundT(F.temperature(p.au, 1)) === expectT[name], name + " temperature");
});

assert(F.planetByName("Jupiter").au === 5.20336301, "Jupiter J2000 matches the asteroids desk");
assert(F.planetByName("Neptune").au === 30.06896348, "Neptune J2000 matches the dwarf-planets desk");
assert(F.planetByName("Earth").density === 5513, "Earth sheet density, not the comparison-table 5514");
assert(F.planetByName("Jupiter").densityLabel === "1,326", "Jupiter density label");
assert(F.planetByName("Mars").au === 1.52366231 && F.planetByName("Mars").density === 3934, "Mars sheet");
assert(F.planetByName("Saturn").au === 9.53707032 && F.planetByName("Saturn").density === 687, "Saturn sheet");

var open = F.scene();
assert(open.ok && open.scale === 1 && open.tIce === 170 && open.span === "inner", "opens on Hayashi, inner frame");
assert(open.teaching === false, "default is not a moved knob");
assert(open.lineText === "2.713 AU", "card line");
assert(open.why.indexOf("2.713 AU") !== -1 && open.why.indexOf("2.7 AU") !== -1, "both figures");
assert(open.why.indexOf("not averaged") !== -1, "does not average 2.713 and 2.7");
assert(open.why.indexOf("not a measured disk") === -1 || open.why.indexOf("280 K") !== -1, "names the normalization");
assert(open.why.indexOf("150 to 180 K") !== -1, "Podolak pressure range");
assert(open.why.indexOf("120 to 170 K") !== -1, "Hartmann range");
assert(open.why.indexOf("not averaged") !== -1, "ranges stay separate");
assert(open.why.indexOf("between Mars and Jupiter") !== -1, "belt sentence");
assert(open.why.indexOf("not a disk model") !== -1, "disclaimer");
assert(open.inside.join(",") === "Mercury,Venus,Earth,Mars", "rocky worlds inside at 170 K");
assert(open.outside.join(",") === "Jupiter,Saturn,Uranus,Neptune", "giants outside at 170 K");
assert(open.rows[4].tRounded === 123 && open.rows[4].side === "outside", "Jupiter 123 K, outside");

var cold = F.scene({ tIce: 120 });
assert(cold.ok && cold.lineText === "5.444 AU", "120 K line");
assert(cold.teaching === true, "120 K is a teaching walk");
assert(cold.why.indexOf("not a pressure measurement") !== -1, "120 K is not a pressure");
var jup = cold.rows.filter(function (r) { return r.name === "Jupiter"; })[0];
assert(jup.side === "inside", "at 120 K Jupiter is inside the line");

var hot = F.scene({ scale: 2 });
assert(hot.lineText === "10.851 AU" && hot.t1Text === "560 K", "scale 2");
assert(hot.why.indexOf("not a measured disk") !== -1, "scale is labeled a teaching knob");
assert(hot.why.indexOf("not a young-Sun luminosity") !== -1, "not a luminosity");

var clamped = F.scene({ scale: 9, tIce: 10, span: "full" });
assert(clamped.ok && clamped.scale === 2 && clamped.tIce === 120 && clamped.span === "full", "knobs clamp");
assert(clamped.reach === 35, "full frame");
assert(F.scene({ scale: "nope" }).ok === false, "bad scale");
assert(F.scene({ tIce: "cold" }).ok === false, "bad temperature");
assert(F.scene({ span: "photo" }).ok === false, "bad frame");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "2.713 AU",
  "2.7 AU",
  "280 K",
  "170 K",
  "120",
  "180 K",
  "0.38709893",
  "0.72333199",
  "1.00000011",
  "1.52366231",
  "5.20336301",
  "9.53707032",
  "19.19126393",
  "30.06896348",
  "5429",
  "5243",
  "5513",
  "3934",
  "1,326",
  "687",
  "1,270",
  "1,638",
  "5,514",
  "9.573",
  "30.178",
  "not a disk model",
  "Teaching scale",
  "subnav-desk",
  "subnav-phone",
  "id=\"frost-canvas\"",
  "id=\"scale\"",
  "id=\"tice\"",
  "/science/astronomy/asteroids/",
  "/science/astronomy/habitable-zone/",
  "/science/astronomy/dwarf-planets/",
  "/science/astronomy/ocean-worlds/",
  "/science/astronomy/blackbody/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
  "https://doi.org/10.1007/s11214-017-0406-0",
  "https://doi.org/10.1017/S1743921310001432",
  "https://doi.org/10.1086/308209",
  "https://science.nasa.gov/missions/hubble/why-is-earth-so-dry/",
  "https://astrobiology.nasa.gov/news/rethinking-the-snow-line/"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf('aria-current="page">Frost line') !== -1, "this page is current in the menu");
assert(html.indexOf("carbon monoxide") !== -1 || html.indexOf("CO,") !== -1, "other ices are named as omitted");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/frost-line/") !== -1, "hub links the desk");
assert(hub.indexOf(">Frost line</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Frost line</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/frost-line/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/frost-line/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/frost-line/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/frost-line/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/frost-line/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["asteroids", "habitable-zone", "dwarf-planets", "ocean-worlds", "blackbody"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/frost-line/") !== -1, name + " links back");
});

console.log("frost-line.test.js: ok");
console.log("Hayashi", F.fmtAu(F.snowAu(1, 170)), "papers", F.PAPER_AU);
