/* Deep-space link budget.
   G = η (π D / λ)², FSPL = (4π d / λ)², Pr = Pt Gt Gr (λ / 4π d)²,
   N0 = k T, R = (C/N0) / (Eb/N0), Shannon = (C/N0) / ln(2).
   Run: node science/astronomy/link-budget/link-budget.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var L = require("./link-budget.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(L.C === 299792458, "c");
assert(L.K_B === 1.380649e-23, "k");
assert(L.AU_M === 149597870700, "au");
assert(near(L.LIGHT_DAY_M, L.C * 86400, 0), "one light-day is c × 86400 s");
assert(near(L.shannonDb(), 10 * Math.log10(Math.LN2), 0), "Shannon dB");
assert(L.formatDb(L.shannonDb()) === "−1.59", "Shannon prints −1.59 dB " + L.formatDb(L.shannonDb()));
assert(L.formatDb(10 * Math.log10(L.K_B)) === "−228.60" || L.formatDb(L.solve(L.opening()).kDbw) === "−228.60", "k in dBW");

/* The hunch: 70 m at 8.4 GHz, η = 0.6, is roughly 74 dBi. */
var hunchGain = L.gainDb(0.6, 70, L.HUNCH_HZ);
assert(near(hunchGain, 73.57564242068334, 1e-9), "hunch gain " + hunchGain);
assert(L.formatDb(hunchGain) === "73.58", "hunch gain prints 73.58 dBi " + L.formatDb(hunchGain));
assert(hunchGain > 73 && hunchGain < 74, "roughly 74 dBi");

/* The hunch: path loss at 1 AU at 8.4 GHz is roughly 274 dB. */
var hunchLoss = L.fsplDb(L.AU_M, L.HUNCH_HZ);
assert(near(hunchLoss, 274.4318771840346, 1e-9), "hunch loss " + hunchLoss);
assert(L.formatDb(hunchLoss) === "274.43", "hunch loss prints 274.43 dB " + L.formatDb(hunchLoss));

/* Handbook frequency, the X button, same checks. */
var xGain55 = L.gainDb(0.55, 70, 8420e6);
assert(L.formatDb(xGain55) === "73.22", "70 m η 0.55 at 8420 MHz prints 73.22 dBi " + L.formatDb(xGain55));
var xLoss = L.fsplDb(L.AU_M, 8420e6);
assert(L.formatDb(xLoss) === "274.45", "1 AU at 8420 MHz prints 274.45 dB " + L.formatDb(xLoss));

/* Inverting 74.55 dBi does not land on 0.55. The page must not adopt it. */
var eta74 = L.etaForGain(74.55, 70, 8420e6);
assert(near(eta74, 0.7473454545656704, 1e-9), "implied η " + eta74);
assert(L.formatEta(eta74) === "0.747", "implied η prints 0.747 " + L.formatEta(eta74));
assert(L.ETA_DEFAULT === 0.55, "default η stays 0.55");

/* Voyager opening: 22 W, 3.66 m, 70 m, X, η 0.55, one light-day, 16.69 K, 0 dB. */
var open = L.opening();
assert(open.ptW === 22 && open.dscM === 3.66 && open.dgM === 70, "opening radio");
assert(open.band === "X" && open.eta === 0.55 && open.ebn0Db === 0, "opening band and threshold");
assert(open.tK === 16.69 && open.distM === L.LIGHT_DAY_M, "opening temperature and distance");
var row = L.solve(open);
assert(row && row.ok, "opening solves");
assert(L.formatLength(row.lambdaM) === "3.560 cm", "X wavelength " + L.formatLength(row.lambdaM));
assert(L.formatDb(row.gtDb) === "47.59", "Voyager dish " + L.formatDb(row.gtDb));
assert(L.formatDb(row.grDb) === "73.22", "70 m dish " + L.formatDb(row.grDb));
assert(L.formatDb(row.fsplDb) === "319.22", "Voyager path loss " + L.formatDb(row.fsplDb));
assert(L.formatDbm(row.prDbm) === "−154.99 dBm", "Pr " + L.formatDbm(row.prDbm));
assert(L.formatWatt(row.prW) === "3.168×10^−19 W", "Pr watts " + L.formatWatt(row.prW));
assert(L.formatDb(row.n0Dbw) === "−216.37", "N0 " + L.formatDb(row.n0Dbw));
assert(L.formatDb(row.cn0Db) === "31.38", "C/N0 " + L.formatDb(row.cn0Db));
assert(L.formatRate(row.rate) === "1,375 bit/s", "rate " + L.formatRate(row.rate));
assert(L.formatRate(row.shannon) === "1,984 bit/s", "Shannon " + L.formatRate(row.shannon));
assert(row.aboveShannon === false, "0 dB is above the Shannon floor");
assert(L.formatDelay(row.lightS) === "24 h 0 min", "light-day delay " + L.formatDelay(row.lightS));
assert(near(row.lightS, 86400, 1e-6), "light time is one day");
assert(L.formatAu(row.au) === "173.145 AU", "light-day in AU " + L.formatAu(row.au));
assert(L.tier(open) === "Voyager 1 · one light-day", "tier " + L.tier(open));

/* Rate identity: R = (Pr / N0) / 10^(Eb/N0 / 10), and Shannon = (Pr / N0) / ln(2). */
assert(near(row.rate, row.cn0 / Math.pow(10, row.ebn0Db / 10), 1e-6), "rate identity");
assert(near(row.shannon, row.cn0 / Math.LN2, 1e-6), "Shannon identity");
assert(near(row.prW, row.ptW * Math.pow(10, (row.gtDb + row.grDb - row.fsplDb) / 10), row.prW * 1e-9), "dB form of Pr");

/* A threshold under the floor is flagged, and the rate exceeds Shannon. */
var low = L.solve({
  ptW: 22, dscM: 3.66, dgM: 70, band: "X", eta: 0.55,
  distM: L.LIGHT_DAY_M, tK: 16.69, ebn0Db: -3
});
assert(low.aboveShannon === true, "−3 dB is under the floor");
assert(low.rate > low.shannon, "formula rate exceeds Shannon");

/* Shannon button: the rate matches the ceiling. */
var floor = L.solve({
  ptW: 22, dscM: 3.66, dgM: 70, band: "X", eta: 0.55,
  distM: L.LIGHT_DAY_M, tK: 16.69, ebn0Db: L.shannonDb()
});
assert(near(floor.rate, floor.shannon, 1e-6), "Shannon threshold meets the ceiling");

/* Distance presets are the fact-sheet metres, and they solve. */
assert(L.MOON_M === 384400e3, "Moon mean");
assert(near(L.MARS_MIN_M, 54.6e9, 0), "Mars minimum");
assert(near(L.MARS_MAX_M, 401.4e9, 0), "Mars maximum");
assert(near(L.JUPITER_MIN_M, 588.5e9, 0), "Jupiter minimum");
assert(near(L.PLUTO_MIN_M, 4284.7e9, 0), "Pluto minimum");
var moon = L.atDistance(open, L.MOON_M);
assert(L.formatKm(moon.km) === "384,400 km", "Moon km " + L.formatKm(moon.km));
assert(L.formatDelay(moon.lightS) === "1.282 s", "Moon one way " + L.formatDelay(moon.lightS));
assert(L.formatRate(moon.rate).indexOf("bit/s") > 0, "Moon rate prints");
var mars = L.atDistance(open, L.MARS_MIN_M);
assert(L.formatDelay(mars.lightS) === "3 min 2.1 s", "Mars closest light time " + L.formatDelay(mars.lightS));

/* Markers span Moon through Voyager, on the current radio. */
var marks = L.markers(open);
assert(marks.length === 6, "six markers");
assert(marks[0].id === "moon" && marks[5].id === "voyager", "marker order");
assert(marks[0].rate > marks[1].rate && marks[1].rate > marks[5].rate, "rate falls with distance");
var samples = L.chartSamples(open, 40);
assert(samples && samples.length === 41, "chart samples");
assert(samples[0].distM === L.D_MIN && samples[samples.length - 1].distM === L.D_MAX, "chart span");
assert(samples[0].rate > samples[samples.length - 1].rate, "curve falls");
assert(L.D_MAX > L.LIGHT_DAY_M, "axis continues past Voyager");

/* Ka is 32050 MHz. A 34 m dish is the handbook’s antenna, and 79.0 is not the formula. */
var ka = L.solve({
  ptW: 22, dscM: 3.66, dgM: 34, band: "Ka", eta: 0.55,
  distM: L.AU_M, tK: 16.69, ebn0Db: 0
});
assert(ka.hz === 32050e6, "Ka carrier");
assert(L.formatLength(ka.lambdaM) === "9.354 mm", "Ka wavelength " + L.formatLength(ka.lambdaM));
assert(L.formatDb(ka.grDb) !== "79.00", "34 m Ka gain is not the handbook 79.0");
assert(L.formatDb(L.gainDb(0.55, 34, 32050e6)) === "78.56", "34 m Ka at η 0.55 " + L.formatDb(L.gainDb(0.55, 34, 32050e6)));

/* S-band wavelength and the quoted 63.59 dBi left unsubstituted. */
var s = L.solve({
  ptW: 22, dscM: 3.66, dgM: 70, band: "S", eta: 0.55,
  distM: L.AU_M, tK: 16.69, ebn0Db: 0
});
assert(L.formatLength(s.lambdaM) === "13.063 cm", "S wavelength " + L.formatLength(s.lambdaM));
assert(L.formatDb(s.grDb) !== "63.59", "S-band gain is computed, not the handbook figure");

/* Reject empty and out-of-range inputs. */
assert(L.solve(null) === null, "null state");
assert(L.solve({ ptW: 0, dscM: 3.66, dgM: 70, band: "X", eta: 0.55, distM: L.AU_M, tK: 16.69, ebn0Db: 0 }) === null, "zero power");
assert(L.solve({ ptW: 22, dscM: 3.66, dgM: 70, band: "X", eta: 0.55, distM: L.MOON_M / 2, tK: 16.69, ebn0Db: 0 }) === null, "inside the Moon");
assert(L.solve({ ptW: 22, dscM: 3.66, dgM: 70, band: "Q", eta: 0.55, distM: L.AU_M, tK: 16.69, ebn0Db: 0 }) === null, "unknown band");

/* Preset identity. Pluto loads New Horizons. Voyager loads Voyager. */
assert(L.distanceById("pluto").craft === "nh", "Pluto preset names New Horizons");
assert(L.distanceById("voyager").craft === "voyager", "Voyager preset names Voyager");
assert(L.distanceById("moon").craft === null, "Moon does not invent a spacecraft");
assert(L.craftById("voyager").ptW === 22 && L.craftById("voyager").dM === 3.66, "Voyager craft");
assert(L.craftById("nh").ptW === 12 && L.craftById("nh").dM === 2.1, "New Horizons craft");
assert(L.matchedCraft(open).id === "voyager", "opening matches Voyager");
assert(L.matchedDistance(open.distM).id === "voyager", "opening matches the light-day");
assert(L.matchedDish(70).id === "dsn70" && L.matchedDish(34).id === "bwg34", "dishes");

var nh = L.solve({
  ptW: 12, dscM: 2.1, dgM: 70, band: "X", eta: 0.55,
  distM: L.PLUTO_MIN_M, tK: 16.69, ebn0Db: 0
});
assert(L.tier({ ptW: 12, dscM: 2.1, band: "X", distM: L.PLUTO_MIN_M }) === "New Horizons · Pluto closest", "NH tier");
assert(L.formatDb(nh.gtDb) === "42.76", "New Horizons dish at η 0.55 " + L.formatDb(nh.gtDb));
assert(L.formatRate(nh.rate) === "9,022 bit/s", "New Horizons at Pluto closest " + L.formatRate(nh.rate));
assert(nh.rate > row.rate, "closest Pluto is nearer than a light-day, so 12 W still outruns Voyager there");

/* The page prints the same figures it computes, and it carries front matter. */
var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("---\n---") === 0, "empty Jekyll front matter");
assert(html.indexOf("73.22") > 0, "page prints 73.22 dBi");
assert(html.indexOf("73.58") > 0, "page prints the 8.4 GHz check");
assert(html.indexOf("274.43") > 0, "page prints 274.43 dB");
assert(html.indexOf("1,375 bit/s") > 0, "page prints the Voyager rate");
assert(html.indexOf("1,984 bit/s") > 0, "page prints the Shannon rate");
assert(html.indexOf("16.69") > 0, "page prints 16.69 K");
assert(html.indexOf("subnav-desk") > 0 && html.indexOf("subnav-phone") > 0, "split navigation");
assert(html.indexOf('href="/science/astronomy/link-budget/"') > 0, "canonical path is in the nav");
assert(html.indexOf("810-005") > 0, "handbook cited");
assert(html.indexOf("example") > 0 || html.indexOf("Example") > 0, "example threshold is labeled");

console.log("ok");
console.log("opening", L.formatRate(row.rate), L.formatRate(row.shannon), L.formatDb(row.cn0Db), L.formatDbm(row.prDbm));
