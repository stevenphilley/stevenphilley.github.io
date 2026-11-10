/* Asteroid-belt desk checks. Distances come from Kepler’s third law.
   Run: node science/astronomy/asteroids/asteroids.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var A = require("./asteroids.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(A.JUPITER_AU === 5.20336301, "Jupiter AU");
assert(A.JUPITER_DAYS === 4332.589, "Jupiter period");
assert(A.YEAR_DAYS === 365.256, "year unit");
assert(A.CHART_MIN === 2 && A.CHART_MAX === 3.5, "chart window");
assert(A.BIN_AU === 0.025, "bin width");
assert(A.NEAR_REL === 0.01, "flag is one percent");

function expectGap(p, q, auText, daysText) {
  var au = A.JUPITER_AU * Math.pow(q / p, 2 / 3);
  var days = A.JUPITER_DAYS * q / p;
  assert(near(A.resonantAu(p, q), au, 1e-12), p + ":" + q + " axis formula");
  assert(near(A.anchoredDays(au), days, 1e-6), p + ":" + q + " period is the anchor times q/p");
  assert(near(A.orbitsPerJupiter(au), p / q, 1e-9), p + ":" + q + " ratio");
  assert(A.axisText(p, q) === auText, p + ":" + q + " axis text");
  assert(A.formatDays(days) === daysText, p + ":" + q + " period text");
}

expectGap(4, 1, "2.064956 AU", "1,083.147 days");
expectGap(3, 1, "2.501516 AU", "1,444.196 days");
expectGap(5, 2, "2.824820 AU", "1,733.036 days");
expectGap(7, 3, "2.957783 AU", "1,856.824 days");
expectGap(2, 1, "3.277913 AU", "2,166.294 days");
expectGap(3, 2, "3.970909 AU", "2,888.393 days");
assert(A.axisText(1, 1) === "5.20336301 AU", "1:1 keeps the printed axis");
assert(A.formatDays(A.JUPITER_DAYS) === "4,332.589 days", "1:1 period");

var bins = A.bins();
assert(bins.length === 60, "sixty bins from 2.0 to 3.5");
var notches = bins.filter(function (b) { return b.notch; });
assert(notches.length === 5, "five notches");
assert(notches.map(function (b) { return b.notch; }).join(",") === "4-1,3-1,5-2,7-3,2-1", "notch order");
var heights = {};
bins.forEach(function (b) { heights[b.notch ? "gap" : "full"] = true; });
assert(heights.full && heights.gap, "full bars and notches both exist");

var open = A.scene({ preset: "3-1" });
assert(open.ok && open.hit.exact && open.hit.gap.name === "3:1", "opens on the 3:1");
assert(open.why.indexOf("2.501516 AU") !== -1, "3:1 why shows the axis");
assert(open.why.indexOf("not a count") !== -1, "3:1 why says not a count");
assert(A.scene({ preset: "4-1" }).why.indexOf("does not label the 4:1") !== -1, "4:1 is not called a JPL label");
assert(A.scene({ preset: "3-2" }).tier.indexOf("Hilda") === 0, "Hilda tier");
assert(A.scene({ preset: "1-1" }).au === A.JUPITER_AU, "Trojan line is Jupiter");
assert(A.scene({ preset: "nope" }).ok === false, "unknown preset");
assert(A.scene({ au: 0 }).ok === false, "zero axis");
assert(A.scene({ au: -1 }).ok === false, "negative axis");
assert(A.scene({ au: "nope" }).ok === false, "word axis");

var vesta = A.scene({ bodyId: "vesta" });
var ceres = A.scene({ bodyId: "ceres" });
var pallas = A.scene({ bodyId: "pallas" });
var hygiea = A.scene({ bodyId: "hygiea" });
assert(vesta.ok && ceres.ok && pallas.ok && hygiea.ok, "four bodies");
assert(A.bodyById("ceres").a === 2.765552595034094, "Ceres axis");
assert(A.bodyById("vesta").a === 2.361365965127599, "Vesta axis");
assert(A.bodyById("pallas").a === 2.769559010737709, "Pallas axis");
assert(A.bodyById("hygiea").a === 3.150974033963701, "Hygiea axis");
[vesta, ceres, pallas, hygiea].forEach(function (sc) {
  assert(sc.why.indexOf("It is not JPL’s period") !== -1, sc.bodyId + " does not replace the JPL period");
  assert(sc.why.indexOf("not a count") !== -1, sc.bodyId + " schematic");
  assert(sc.hit.near === false, sc.bodyId + " is not inside the 1 percent flag");
});
assert(vesta.stretch.indexOf("4:1") !== -1 && vesta.stretch.indexOf("3:1") !== -1, "Vesta stretch");
assert(ceres.stretch.indexOf("3:1") !== -1 && ceres.stretch.indexOf("5:2") !== -1, "Ceres stretch");
assert(hygiea.stretch.indexOf("7:3") !== -1 && hygiea.stretch.indexOf("2:1") !== -1, "Hygiea stretch");
assert(A.bodyById("ceres").code === "MBA" && A.bodyById("hygiea").code === "MBA", "JPL class");

var near = A.scene({ au: 2.5 });
assert(near.ok && near.hit.near && near.hit.gap.id === "3-1", "2.5 AU flags near the 3:1");
var far = A.scene({ au: 2.2 });
assert(far.ok && far.hit.near === false, "2.2 AU is not within 1 percent");
assert(far.why.indexOf("not a measured width") !== -1, "flag explains itself");
assert(A.windowOf(2.2).indexOf("Main-belt") !== -1, "2.2 is in the main-belt window");
assert(A.windowOf(1.9).indexOf("Inner Main-belt") !== -1, "JPL inner is sunward of 2");
assert(A.windowOf(3.5).indexOf("Outer Main-belt") !== -1, "3.5 is outer main-belt");
assert(A.windowOf(5.2).indexOf("Trojan") !== -1, "5.2 is the Trojan window");
assert(A.limitsNote().indexOf("Educational schematic") === 0, "disclaimer");
assert(A.limitsNote().indexOf("not a count") !== -1, "disclaimer denies counts");
assert(A.massNote().indexOf("less than that of Earth’s Moon") !== -1, "mass sentence");
assert(A.massNote().indexOf("kilograms") !== -1, "no invented kilograms");
assert(A.emptyNote().indexOf("Pioneer 10") !== -1, "crossing");
assert(A.regionNote().indexOf("2.8 AU") !== -1 && A.regionNote().indexOf("3.2 AU") !== -1, "NASA centers");
assert(A.regionNote().indexOf("does not rename") !== -1, "no invented zone catalog");
assert(Math.pow(A.JUPITER_AU, 1.5).toFixed(4) === "11.8693", "one-sun year");
assert((A.JUPITER_DAYS / A.YEAR_DAYS).toFixed(4) === "11.8618", "fact-sheet year");

var htmlPath = path.join(__dirname, "index.html");
var html = fs.readFileSync(htmlPath, "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/asteroids/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("asteroids.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("@media (max-width:899px)") !== -1, "phone nav breakpoint");
assert(html.indexOf("subnav-desk{display:none}") !== -1, "desktop nav hides on a phone");
assert(html.indexOf("subnav-phone{display:block") !== -1, "phone nav shows on a phone");
assert(html.indexOf(A.limitsNote()) !== -1, "disclaimer on the page");
assert(html.indexOf(A.gapWhy("3-1")) !== -1, "3:1 explanation is on the page");
assert(html.indexOf(A.massNote()) !== -1, "mass note");
assert(html.indexOf(A.emptyNote()) !== -1, "empty note");
assert(html.indexOf(A.regionNote()) !== -1, "region note");
assert(html.indexOf("11.8693") !== -1 && html.indexOf("11.8618") !== -1, "the two years");
A.gapIds().forEach(function (id) {
  var g = A.gapById(id);
  assert(html.indexOf(g.auText) !== -1, id + " axis on the page");
  assert(html.indexOf(A.observedSentence(id)) !== -1, id + " citation on the page");
});
A.bodyIds().forEach(function (id) {
  var b = A.bodyById(id);
  assert(html.indexOf(b.aText) !== -1, id + " axis on the page");
  assert(html.indexOf(A.sizeSentence(id)) !== -1, id + " size on the page");
  assert(html.indexOf('data-body="' + id + '"') !== -1, id + " button");
});
assert(html.indexOf('id="belt-canvas"') !== -1, "canvas");
assert(html.indexOf('id="axis"') !== -1, "slider");
assert(html.indexOf("not a count") !== -1, "schematic label");
assert(html.indexOf("/science/astronomy/resonances/") !== -1, "links resonances");
assert(html.indexOf("/science/astronomy/dwarf-planets/") !== -1, "links dwarf planets");
assert(html.indexOf("/science/astronomy/jupiter/") !== -1, "links Jupiter");
assert(html.indexOf("/science/astronomy/impacts/") !== -1, "links impacts");
assert(html.indexOf("/science/astronomy/kepler/") !== -1, "links Kepler");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/asteroids/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/asteroids/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/asteroids/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/asteroids/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/asteroids/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/asteroids/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["resonances", "dwarf-planets", "impacts", "jupiter"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/asteroids/") !== -1, name + " links the desk");
});

console.log("asteroids.test.js: ok");
console.log("4:1", A.axisText(4, 1), A.formatDays(A.JUPITER_DAYS / 4));
console.log("3:1", A.axisText(3, 1));
