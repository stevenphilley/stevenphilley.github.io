/* Dwarf-planet map checks. Elements are the cited strings. Resonances are computed.
   Run: node science/astronomy/dwarf-planets/dwarf-planets.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var D = require("./dwarf-planets.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(D.YEAR_DAYS === 365.256, "year unit");
assert(D.MOON_DIAMETER_KM === 2 * D.MOON_RADIUS_KM, "Moon diameter is twice the volumetric mean radius");
assert(D.MOON_DIAMETER_KM === 3474.8, "Moon diameter");
assert(D.CLASSICAL_INNER === 40 && D.CLASSICAL_OUTER === 50, "classical range");
assert(D.neptune.a === 30.06896348 && D.neptune.days === 60189.018, "Neptune sheet");

var r32 = D.resonant(3, 2);
var r21 = D.resonant(2, 1);
var t32 = D.resonanceText(r32);
var t21 = D.resonanceText(r21);
assert(t32.au === "39.401489" && t32.days === "90,283.527", "3:2 matches the resonances desk");
assert(t21.au === "47.731504" && t21.days === "120,378.036", "2:1");
assert(t32.au > "39" && Number(t32.au) < D.CLASSICAL_INNER, "3:2 sits just inside 40 AU");
assert(Number(t21.au) > D.CLASSICAL_INNER && Number(t21.au) < D.CLASSICAL_OUTER, "2:1 sits in the classical range");

var ids = ["ceres", "pluto", "haumea", "makemake", "eris"];
ids.forEach(function (id) {
  var b = D.bodyById(id);
  assert(b, id);
  var q = Number(b.aText) * (1 - Number(b.eText));
  var ad = Number(b.aText) * (1 + Number(b.eText));
  if (b.qText) assert(near(q, Number(b.qText), 1e-9), id + " JPL q is a(1−e)");
  if (b.adText) assert(near(ad, Number(b.adText), 1e-9), id + " JPL aphelion is a(1+e)");
  assert(b.eText.indexOf("e") === -1, id + " eccentricity is a plain decimal");
  var why = D.explain(id);
  assert(why.indexOf("undefined") === -1 && why.indexOf("NaN") === -1, id + " explanation is filled");
  assert(why.indexOf(b.aText) !== -1 && why.indexOf(b.eText) !== -1, id + " elements are in the explanation");
  var st = D.stats(id);
  assert(st.length >= 9, id + " stats");
  assert(st[0][1] === b.diameterText, id + " diameter stat");
});

assert(D.bodyById("pluto").aText === "39.48168677", "Pluto axis");
assert(D.bodyById("pluto").eText === "0.24880766", "Pluto eccentricity");
assert(D.qText(D.bodyById("pluto")) === "29.658341", "Pluto perihelion");
assert(D.adTextOf(D.bodyById("pluto")) === "49.305033", "Pluto aphelion");
assert(D.formatYears(90560) === "247.9357", "Pluto year division");
assert(D.argText(D.bodyById("pluto")) === "113.76329", "Pluto argument");
assert((D.neptune.periLon - D.neptune.node).toFixed(5) === "-86.75034", "Neptune argument");
assert(D.classicalOf(39.48168677) === "outside", "Pluto is outside 40 AU");
assert(D.classicalOf(43.06029023650952) === "inside", "Haumea axis is inside 40–50");
assert(D.classicalOf(45.57093317300052) === "inside", "Makemake axis is inside 40–50");
assert(D.classicalOf(67.93394687853566) === "outside", "Eris is outside 50 AU");
assert(D.classicalOf(2.765552595034094) === "outside", "Ceres is outside the belt");

assert(D.sizeRatio(D.bodyById("pluto")).text === "0.684", "Pluto versus the Moon");
assert(D.sizeRatio(D.bodyById("ceres")).text === "0.274", "Ceres versus the Moon");
assert(D.sizeRatio(D.bodyById("eris")).text === "about 0.69", "Eris versus the Moon");
assert(D.sizeRatio(D.bodyById("haumea")).text === "about 0.50", "Haumea versus the Moon");
assert(D.sizeRatio(D.bodyById("makemake")).text === "about 0.41", "Makemake versus the Moon");
assert(D.bodyById("pluto").diameterKm === 2 * D.PLUTO_RADIUS_KM, "Pluto diameter");
assert(D.bodyById("ceres").diameterKm === 2 * D.CERES_RADIUS_KM, "Ceres diameter");

/* i = 0 lays the ellipse flat at longitude node + argument. */
var flat = D.project(10, 0.5, 0, 20, 30, 0);
var rFlat = 10 * (1 - 0.5);
var ang = (20 + 30) * Math.PI / 180;
assert(near(flat.r, rFlat, 1e-12), "perihelion radius");
assert(near(flat.x, rFlat * Math.cos(ang), 1e-9), "flat x");
assert(near(flat.y, rFlat * Math.sin(ang), 1e-9), "flat y");
assert(near(flat.ecl, rFlat, 1e-9), "flat ecliptic radius");

/* i = 90° at the high point drops onto the Sun in a top-down view. */
var pole = D.project(10, 0, 90, 10, 0, Math.PI / 2);
assert(pole.ecl < 1e-9, "inclined pole projects to the center");

var plutoP = D.perihelion(D.bodyById("pluto"));
assert(near(plutoP.r, Number(D.qText(D.bodyById("pluto"))), 1e-6), "Pluto perihelion radius");
assert(plutoP.ecl <= plutoP.r + 1e-9, "projection cannot exceed true radius");

var eris = D.bodyById("eris");
assert(near(D.outerAu(), Number(eris.adText), 0), "outer edge is Eris aphelion");
assert(near(D.radialUnit(10, "log", 100), 0.5, 1e-12), "log10 midpoint");
assert(D.radialUnit(50, "linear", 100) === 0.5, "linear half");
assert(D.radialUnit(1, "log", 100) === 0, "log starts at 1 AU");
var mid = D.scalePoint({ x: 30, y: 40, ecl: 50 }, "linear", 100);
assert(near(mid.x, 0.3, 1e-12) && near(mid.y, 0.4, 1e-12), "linear remap keeps the angle");

var nepPts = D.orbitPoints({
  aText: D.neptune.aText,
  eText: D.neptune.eText,
  iText: D.neptune.iText,
  nodeText: D.neptune.nodeText,
  periLonText: D.neptune.periLonText
}, 36);
assert(nepPts.length === 36, "Neptune samples");
assert(D.explain("pluto").indexOf("39.401489") !== -1, "Pluto explanation quotes the 3:2");
assert(D.explain("pluto").indexOf("resonances") !== -1, "Pluto explanation names the resonances desk");
assert(D.limitsNote().indexOf("Educational schematic") === 0, "disclaimer opens as the other desks do");
assert(D.limitsNote().indexOf("Not a JPL Horizons ephemeris") !== -1, "ephemeris limit");
assert(D.ariaSummary("pluto", "linear").indexOf("39.401489") !== -1, "canvas label");
assert(D.scaleNote("log").indexOf(eris.adText) !== -1, "log note quotes the aphelion");
assert(D.neptuneNote().indexOf("0.00858587") !== -1 && D.neptuneNote().indexOf("0.0097") !== -1, "both Neptune eccentricities");

var htmlPath = path.join(__dirname, "index.html");
if (fs.existsSync(htmlPath)) {
  var html = fs.readFileSync(htmlPath, "utf8");
  assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
  assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
  assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
  assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
  assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
  assert(html.indexOf("/science/astronomy/dwarf-planets/") !== -1, "canonical path");
  assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
  assert(html.indexOf('aria-current="page"') !== -1, "current section");
  assert(html.indexOf("dwarf-planets.js") !== -1, "module");
  assert(html.indexOf("min-height:44px") !== -1, "touch target");
  assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
  assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
  assert(html.indexOf("data-help-close") !== -1, "help close");
  assert(html.indexOf(D.limitsNote()) !== -1, "disclaimer");
  assert(html.indexOf(D.neptuneNote()) !== -1, "Neptune note");
  ids.forEach(function (id) {
    assert(html.indexOf(D.explain(id)) !== -1, id + " explanation is on the page");
  });
  assert(html.indexOf("39.48168677") !== -1 && html.indexOf("0.24880766") !== -1, "Pluto elements");
  assert(html.indexOf("67.93394687853566") !== -1, "Eris axis");
  assert(html.indexOf("43.06029023650952") !== -1, "Haumea axis");
  assert(html.indexOf("45.57093317300052") !== -1, "Makemake axis");
  assert(html.indexOf("2.765552595034094") !== -1, "Ceres axis");
  assert(html.indexOf("Resolution 5A") !== -1, "IAU resolution");
  assert(html.indexOf("has cleared the neighbourhood") !== -1, "third criterion");
  assert(html.indexOf("/science/astronomy/resonances/") !== -1, "links resonances");
  assert(html.indexOf('id="map-canvas"') !== -1 && html.indexOf('id="size-canvas"') !== -1, "canvases");
  assert(html.indexOf('data-body="pluto"') !== -1 && html.indexOf('data-body="eris"') !== -1, "body buttons");
  assert(html.indexOf('data-scale="linear"') !== -1 && html.indexOf('data-scale="log"') !== -1, "scale toggle");
  var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  assert(hub.indexOf("/science/astronomy/dwarf-planets/") !== -1, "hub links the desk");
  var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
  assert(science.indexOf("/science/astronomy/dwarf-planets/") !== -1, "science index links the desk");
  var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
  assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/dwarf-planets/") !== -1, "sitemap");
  var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
  assert(search.indexOf("/science/astronomy/dwarf-planets/") !== -1, "search index");
  JSON.parse(search);
  var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
  assert(siteHtml.indexOf("science/astronomy/dwarf-planets/") !== -1, "html sitemap");
  var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
  var found = false;
  news.forEach(function (day) {
    (day.entries || []).forEach(function (entry) {
      if (entry.href === "/science/astronomy/dwarf-planets/") found = true;
    });
  });
  assert(found, "whats-new lists the desk");
  var comets = fs.readFileSync(path.join(__dirname, "../comets/index.html"), "utf8");
  var resonances = fs.readFileSync(path.join(__dirname, "../resonances/index.html"), "utf8");
  var neptune = fs.readFileSync(path.join(__dirname, "../neptune/index.html"), "utf8");
  assert(comets.indexOf("/science/astronomy/dwarf-planets/") !== -1, "comets links the desk");
  assert(resonances.indexOf("/science/astronomy/dwarf-planets/") !== -1, "resonances links the desk");
  assert(neptune.indexOf("/science/astronomy/dwarf-planets/") !== -1, "neptune links the desk");
}

console.log("dwarf-planets.test.js: ok");
console.log("3:2", t32.au, t32.days);
console.log("2:1", t21.au, t21.days);
