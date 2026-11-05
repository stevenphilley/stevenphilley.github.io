/* Solar-cycle checks. Peaks and lengths are read from the bundled SILSO snapshot.
   Run: node science/astronomy/solar-cycle/solar-cycle.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./solar-cycle.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

var data = JSON.parse(fs.readFileSync(path.join(__dirname, "sunspots.json"), "utf8"));
S.load(data);

assert(data.fetched === "2026-11-05", "fetch date");
assert(data.license === "CC BY-NC 4.0", "license");
assert(data.rows.length === 3334, "month count");
assert(data.cycles.length === 25, "twenty-five cycle edges");
assert(data.rows[0][0] === 1749 && data.rows[0][1] === 1 && data.rows[0][2] === 96.7 && data.rows[0][3] === null, "January 1749");
var last = data.rows[data.rows.length - 1];
assert(last[0] === 2026 && last[1] === 10 && last[2] === 45.7 && last[4] === 0 && last[3] === null, "October 2026 monthly is provisional and unsmoothed");

function boxcar(i) {
  if (i < 6 || i + 6 >= data.rows.length) return null;
  var s = 0.5 * data.rows[i - 6][2] + 0.5 * data.rows[i + 6][2];
  var k;
  for (k = i - 5; k <= i + 5; k++) s += data.rows[k][2];
  return Math.round((s / 12) * 10) / 10;
}
[[1958, 3], [2019, 12], [2024, 10], [2026, 4]].forEach(function (ym) {
  var rec = S.row(ym[0], ym[1]);
  assert(boxcar(rec.index) === rec.smoothed, "published smoother rounds to the file at " + ym.join("-"));
});

var durations = {
  1: [11, 4], 2: [9, 0], 3: [9, 3], 4: [13, 7], 5: [12, 3], 6: [12, 10], 7: [10, 6],
  8: [9, 8], 9: [12, 5], 10: [11, 3], 11: [11, 9], 12: [11, 3], 13: [11, 10], 14: [11, 6],
  15: [10, 1], 16: [10, 1], 17: [10, 5], 18: [10, 2], 19: [10, 6], 20: [11, 5],
  21: [10, 6], 22: [9, 11], 23: [12, 4], 24: [11, 0]
};

var all = S.summaries();
assert(all.length === 25, "one summary per cycle");
all.forEach(function (s) {
  var edge = data.cycles[s.n - 1];
  assert(s.start.year === edge.minYear && s.start.month === edge.minMonth, "minimum month is the table month for cycle " + s.n);
  assert(near(s.start.smoothed, edge.tableMin, 0.11), "minimum is within 0.1 of the table for cycle " + s.n);
  if (!s.open) {
    assert(s.peak.year === edge.maxYear && s.peak.month === edge.maxMonth, "computed peak month matches the table for cycle " + s.n);
    assert(Math.floor(s.lengthMonths / 12) === durations[s.n][0] && s.lengthMonths % 12 === durations[s.n][1], "length matches the SILSO duration for cycle " + s.n);
    assert(s.lengthText.length > 0, "closed cycle has a length label");
  }
});

var c1 = S.summary(1);
assert(c1.start.smoothed === 14 && S.format1(c1.start.smoothed) === "14.0", "cycle 1 minimum");
assert(c1.peak.year === 1761 && c1.peak.month === 6 && c1.peak.smoothed === 144.1, "cycle 1 peak");
assert(c1.lengthText === "11 years 4 months", "cycle 1 length");

var c6 = S.summary(6);
assert(c6.start.year === 1810 && c6.start.month === 7 && c6.start.smoothed === 0, "cycle 6 minimum is July, not the earlier zero");
assert(c6.peak.smoothed === 81.2 && c6.peak.month === 5 && c6.peak.year === 1816, "cycle 6 peak");

var c3 = S.summary(3);
assert(c3.peak.smoothed === 264.3, "cycle 3 series maximum");
assert(c3.why.indexOf("table prints 264.2") !== -1, "cycle 3 names the table difference");

var c7 = S.summary(7);
assert(c7.start.smoothed === 0.2, "cycle 7 series minimum");
assert(c7.why.indexOf("table prints 0.1") !== -1, "cycle 7 names the table difference");

var c16 = S.summary(16);
assert(c16.start.smoothed === 9.4 && c16.lengthText === "10 years 1 month", "cycle 16");
assert(c16.why.indexOf("table prints 9.3") !== -1, "cycle 16 names the table difference");

var c19 = S.summary(19);
assert(c19.peak.smoothed === 285 && c19.peak.year === 1958 && c19.peak.month === 3, "cycle 19 peak");
assert(c19.maxMonthly.monthly === 359.4 && c19.maxMonthly.year === 1957 && c19.maxMonthly.month === 10, "cycle 19 monthly max");
assert(c19.lengthText === "10 years 6 months", "cycle 19 length");

var c24 = S.summary(24);
assert(c24.start.year === 2008 && c24.start.month === 12 && c24.start.smoothed === 2.2, "cycle 24 minimum");
assert(c24.peak.year === 2014 && c24.peak.month === 4 && c24.peak.smoothed === 116.4, "cycle 24 peak");
assert(c24.lengthMonths === 132 && c24.lengthText === "11 years", "cycle 24 length");

var c25 = S.summary(25);
assert(c25.open === true, "cycle 25 is open");
assert(c25.start.year === 2019 && c25.start.month === 12 && c25.start.smoothed === 1.8 && c25.start.smoothedDefinitive === true, "cycle 25 minimum");
assert(c25.peak.year === 2024 && c25.peak.month === 10 && c25.peak.smoothed === 160.9 && c25.peak.smoothedDefinitive === true, "cycle 25 smoothed high");
assert(c25.lengthMonths === null, "cycle 25 has no length");
assert(c25.maxMonthly.year === 2024 && c25.maxMonthly.month === 8 && c25.maxMonthly.monthly === 216, "cycle 25 monthly high");
assert(c25.lastSmoothed.year === 2026 && c25.lastSmoothed.month === 4 && c25.lastSmoothed.smoothed === 88.6 && c25.lastSmoothed.smoothedDefinitive === false, "latest smoothed is provisional");
assert(c25.elapsedMonths === 82, "elapsed span is not sold as a length");
assert(c25.why.indexOf("not a forecast") !== -1, "cycle 25 refuses a forecast");
assert(c25.why.indexOf("leaves the maximum blank") !== -1, "CSV maximum stays blank");
assert(c25.why.indexOf("160.9") !== -1 && c25.why.indexOf("1.8") !== -1, "cycle 25 figures");

var lowest = all.filter(function (s) { return !s.open; }).reduce(function (a, b) {
  return a.peak.smoothed < b.peak.smoothed ? a : b;
});
assert(lowest.n === 6 && lowest.peak.smoothed === 81.2, "lowest closed peak is cycle 6");

assert(S.cycleOf(1749, 6) === null, "before cycle 1");
assert(S.cycleOf(1755, 1) === null, "January 1755 is still before the minimum");
assert(S.cycleOf(1755, 2) === 1, "cycle 1 starts February 1755");
assert(S.cycleOf(1766, 5) === 1 && S.cycleOf(1766, 6) === 2, "the next minimum belongs to the next cycle");
assert(S.cycleOf(2024, 10) === 25 && S.cycleOf(2026, 10) === 25, "recent months are cycle 25");
assert(S.readout(1749, 1).indexOf("Before Cycle 1") !== -1, "early readout");
assert(S.readout(2024, 10).indexOf("160.9") !== -1 && S.readout(2024, 10).indexOf("165.8") !== -1, "October 2024 readout");
assert(S.readout(2026, 10).indexOf("provisional") !== -1 && S.readout(2026, 10).indexOf("No smoothed number") !== -1, "latest month readout");

assert(S.sketchLatitude(0) === 35 && S.sketchLatitude(1) === 8 && S.sketchLatitude(0.5) === 21.5, "sketch endpoints");
assert(S.sketchLatitude(-1) === 35 && S.sketchLatitude(2) === 8, "sketch clamps");
assert(S.sketchText(0).indexOf("not catalog positions") !== -1, "sketch is labeled");
assert(S.limitsNote().indexOf("Not a space-weather forecast") !== -1, "disclaimer");
assert(S.limitsNote().indexOf("fetched 2026-11-05") !== -1, "disclaimer date");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/solar-cycle/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("solar-cycle.js") !== -1, "module");
assert(html.indexOf("sunspots.json") !== -1, "bundled snapshot");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf(S.limitsNote()) !== -1, "disclaimer");
assert(html.indexOf(c25.why) !== -1, "cycle 25 explanation is on the page");
assert(html.indexOf(c19.why) !== -1, "cycle 19 explanation is on the page");
assert(html.indexOf('id="cycle-canvas"') !== -1, "history canvas");
assert(html.indexOf('id="disk-canvas"') !== -1, "schematic disk");
assert(html.indexOf('data-cycle="25"') !== -1 && html.indexOf('data-cycle="19"') !== -1, "cycle buttons");
assert(html.indexOf("Maunder Minimum") !== -1, "Maunder Minimum");
assert(html.indexOf("Hale") !== -1, "Hale cycle");
assert(html.indexOf("Spörer") !== -1 || html.indexOf("Sporer") !== -1, "Spörer");
assert(html.indexOf("not a forecast") !== -1, "no forecast");
assert(html.indexOf("predicted peak") === -1 && html.indexOf("will peak") === -1, "no fabricated prediction");
assert(html.indexOf("Educational") !== -1, "educational disclaimer");
assert(html.indexOf("CC BY-NC 4.0") !== -1, "SILSO license");
assert(html.indexOf("https://www.sidc.be/SILSO/DATA/SN_m_tot_V2.0.csv") !== -1, "monthly source");
assert(html.indexOf("https://www.sidc.be/SILSO/DATA/SN_ms_tot_V2.0.csv") !== -1, "smoothed source");
assert(html.indexOf("https://www.swpc.noaa.gov/phenomena/sunspotssolar-cycle") !== -1, "NOAA source");
assert(html.indexOf("https://science.nasa.gov/sun/sunspots/") !== -1, "NASA sunspots");
assert(html.indexOf("https://science.nasa.gov/sun/solar-storms-and-flares/") !== -1, "NASA storms");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/solar-cycle/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/solar-cycle/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/solar-cycle/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/solar-cycle/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/solar-cycle/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/solar-cycle/") found = true;
  });
});
assert(found, "whats-new lists the desk");

console.log("solar-cycle.test.js: ok");
console.log("Cycle 19", c19.peak.smoothed, S.labelMonth(c19.peak.year, c19.peak.month), c19.lengthText);
console.log("Cycle 25", c25.start.smoothed, c25.peak.smoothed, S.labelMonth(c25.peak.year, c25.peak.month));
