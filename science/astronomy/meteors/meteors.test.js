/* Meteor hourly-rate checks.
   HR = ZHR × sin(h) / r^(6.5 − LM) × (1 − k).
   The IMO major-shower table is ZHR 100 at limiting magnitude 6.5.
   Shower numbers are the 2026 working list. Parents are as cited.
   Run: node science/astronomy/meteors/meteors.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var M = require("./meteors.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(M.LM_REF === 6.5, "IMO reference magnitude");
assert(M.ZHR_MIN === 0 && M.ZHR_MAX === 500, "ZHR ends");
assert(M.ALT_MIN === -90 && M.ALT_MAX === 90, "altitude ends");

/* Hand example. sin(30°) = 1/2, exponent 0, clear sky.
   IMO Table 1 prints 50 for this row. */
var hand = M.hourlyRate({
  zhr: 100,
  altitudeDeg: 30,
  limitingMag: 6.5,
  populationIndex: 2.2,
  cloudFraction: 0
});
assert(hand && near(hand.hourlyRate, 50, 1e-9), "hand example is 50, got " + (hand && hand.hourlyRate));
assert(near(hand.sine, 0.5, 1e-12), "sin 30");
assert(hand.magnitudeFactor === 1, "reference sky drops the r term");
assert(M.fmtRate(hand.hourlyRate) === "50", "rate text");

/* The same row with a 50% obstruction. IMO FAQ: 50% coverage is a
   correction factor of 2, so the expected count is cut in half. */
assert(M.fieldFactor(0.5) === 2, "F at 50%");
assert(M.fieldFactor(0) === 1, "clear field");
assert(M.fieldFactor(1) === null, "fully covered has no finite F");
var half = M.hourlyRate({
  zhr: 100,
  altitudeDeg: 30,
  limitingMag: 6.5,
  populationIndex: 2.2,
  cloudFraction: 0.5
});
assert(half && near(half.hourlyRate, 25, 1e-9), "50% cloud halves the rate, got " + (half && half.hourlyRate));

/* Population index. r = 2 and LM = 5.5 is one magnitude bright of 6.5,
   so the count is divided by 2. Zenith, clear. */
var faint = M.hourlyRate({
  zhr: 100,
  altitudeDeg: 90,
  limitingMag: 5.5,
  populationIndex: 2,
  cloudFraction: 0
});
assert(faint && faint.hourlyRate === 50, "one magnitude and r = 2 halves the zenith rate");
assert(faint.magnitudeFactor === 2, "r^(6.5−5.5)");

/* Below the horizon, and on it, the rate is 0. A negative sine is not a rate. */
var under = M.hourlyRate({
  zhr: 80,
  altitudeDeg: -5,
  limitingMag: 6.5,
  populationIndex: 2.1,
  cloudFraction: 0
});
assert(under && under.hourlyRate === 0 && under.belowHorizon, "below the horizon");
var rim = M.hourlyRate({
  zhr: 80,
  altitudeDeg: 0,
  limitingMag: 6.5,
  populationIndex: 2.1,
  cloudFraction: 0
});
assert(rim && rim.hourlyRate === 0 && !rim.belowHorizon, "on the horizon the sine is 0");

/* IMO Table 1, rounded. The formula is the sine, not the printed integer. */
M.IMO_TABLE.forEach(function (row) {
  var got = M.hourlyRate({
    zhr: 100,
    altitudeDeg: row.h,
    limitingMag: 6.5,
    populationIndex: 2.5,
    cloudFraction: 0
  });
  var sine = 100 * Math.sin(row.h * Math.PI / 180);
  assert(got && near(got.hourlyRate, sine, 1e-12), "sine at " + row.h);
  assert(near(got.hourlyRate, row.n, 0.5), "IMO table " + row.h + " prints " + row.n + ", got " + got.hourlyRate);
});

/* Geminids, a bright-suburban sky, 60°, one fifth of the field covered.
   150 × sin(60°) / 2.6^0.9 × 0.8. */
var gem = M.showerById("gem");
var gemRate = M.hourlyRate({
  zhr: gem.zhr,
  altitudeDeg: 60,
  limitingMag: 5.6,
  populationIndex: gem.r,
  cloudFraction: 0.2
});
var gemExpect = 150 * Math.sin(Math.PI / 3) / Math.pow(2.6, 0.9) * 0.8;
assert(gemRate && near(gemRate.hourlyRate, gemExpect, 1e-12), "Geminid worked product");
assert(gemExpect > 40 && gemExpect < 50, "Geminid example stays in a readable band, got " + gemExpect);

/* Kinetic energy per gram is ½v² in kJ when v is km/s. */
assert(M.kineticKjPerGram(59) === 1740.5, "Perseid energy");
assert(M.kineticKjPerGram(35) === 612.5, "Geminid energy");
assert(M.kineticKjPerGram(71) === 2520.5, "Leonid energy");
assert(M.kineticKjPerGram(41) === 840.5, "Quadrantid energy");
assert(M.fmtGrouped(1740.5, 1) === "1,740.5", "grouped energy");
assert(M.kineticKjPerGram(-1) === null, "negative speed");

/* Working-list presets. Every stored number is cited on the page. */
assert(M.SHOWERS.length === 7, "seven showers");
var ids = ["qua", "lyr", "eta", "per", "ori", "leo", "gem"];
ids.forEach(function (id, i) {
  assert(M.SHOWERS[i].id === id, "order " + id);
});

var qua = M.showerById("qua");
assert(qua.zhr === 80 && qua.r === 2.1 && qua.speed === 41, "Quadrantids");
assert(qua.ra === 230 && qua.dec === 49 && qua.solarLong === 283.15, "Quadrantid radiant");
assert(qua.peakDate === "January 3" && qua.parent === "196256 (2003 EH1)", "Quadrantid date and parent");

var lyr = M.showerById("lyr");
assert(lyr.zhr === 18 && lyr.r === 2.1 && lyr.speed === 49 && lyr.ra === 271 && lyr.dec === 34, "Lyrids");
assert(lyr.solarLong === 32.32 && lyr.parent === "C/1861 G1 (Thatcher)", "Lyrid parent");

var eta = M.showerById("eta");
assert(eta.zhr === 50 && eta.r === 2.4 && eta.speed === 66 && eta.ra === 338 && eta.dec === -1, "Eta Aquariids");
assert(eta.solarLong === 45.5 && eta.parent === "1P/Halley", "Eta parent");

var per = M.showerById("per");
assert(per.zhr === 100 && per.r === 2.2 && per.speed === 59 && per.ra === 48 && per.dec === 58, "Perseids");
assert(per.solarLong === 140 && per.parent === "109P/Swift-Tuttle", "Perseid parent");

var ori = M.showerById("ori");
assert(ori.zhr === 20 && ori.r === 2.5 && ori.speed === 66 && ori.ra === 95 && ori.dec === 16, "Orionids");
assert(ori.solarLong === 208 && ori.parent === "1P/Halley", "Orionid parent");

var leo = M.showerById("leo");
assert(leo.zhr === 15 && leo.r === 2.5 && leo.speed === 71 && leo.ra === 152 && leo.dec === 22, "Leonids");
assert(leo.solarLong === 235.27 && leo.parent === "55P/Tempel-Tuttle", "Leonid parent");

assert(gem.zhr === 150 && gem.r === 2.6 && gem.speed === 35 && gem.ra === 112 && gem.dec === 33, "Geminids");
assert(gem.solarLong === 262.2 && gem.parent === "3200 Phaethon", "Geminid parent");

assert(M.skyById("dark").lm === 6.5, "dark sky");
assert(M.skyById("suburban").lm === 5.6, "suburban sky");
assert(M.skyById("city").lm === 4.5, "city sky");
assert(M.fmtSignedDeg(-1) === "−1°" && M.fmtSignedDeg(49) === "+49°", "declination text");

var curve = M.rateCurve({
  zhr: 100,
  limitingMag: 6.5,
  populationIndex: 2.2,
  cloudFraction: 0
}, 19);
assert(curve && curve.length === 19, "chart samples");
assert(curve[0].hourlyRate === 0 && near(curve[18].hourlyRate, 100, 1e-9), "curve ends");
assert(curve[9].hourlyRate < curve[18].hourlyRate, "rate rises with altitude");

assert(M.hourlyRate(null) === null, "empty");
assert(M.hourlyRate({ zhr: -1, altitudeDeg: 30, limitingMag: 6.5, populationIndex: 2, cloudFraction: 0 }) === null, "negative ZHR");
assert(M.hourlyRate({ zhr: 501, altitudeDeg: 30, limitingMag: 6.5, populationIndex: 2, cloudFraction: 0 }) === null, "ZHR above the field");
assert(M.hourlyRate({ zhr: 10, altitudeDeg: 91, limitingMag: 6.5, populationIndex: 2, cloudFraction: 0 }) === null, "altitude above 90");
assert(M.hourlyRate({ zhr: 10, altitudeDeg: 30, limitingMag: 6.5, populationIndex: 0.5, cloudFraction: 0 }) === null, "r below 1");
assert(M.hourlyRate({ zhr: 10, altitudeDeg: 30, limitingMag: 6.5, populationIndex: 2, cloudFraction: 1.1 }) === null, "cloud above 1");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/meteors/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "desktop and phone menus");
assert(html.indexOf("aria-current=\"page\"") !== -1, "current section");
assert(html.indexOf("meteors.js") !== -1, "math module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf("Educational calculator") !== -1, "disclaimer");
assert(html.indexOf("Not a forecast") !== -1, "forecast disclaimer");
assert(html.indexOf("/science/astronomy/twilight/") !== -1, "twilight link");
assert(html.indexOf("/science/astronomy/magnitude/") !== -1, "magnitude link");
assert(html.indexOf("/science/astronomy/local-sky/") !== -1, "local-sky link");
assert(html.indexOf("/science/light-pollution/") !== -1, "light-pollution link");
assert(html.indexOf("283.15") !== -1, "Quadrantid solar longitude");
assert(html.indexOf("32.32") !== -1, "Lyrid solar longitude");
assert(html.indexOf("45.5") !== -1, "Eta solar longitude");
assert(html.indexOf("140.0") !== -1, "Perseid solar longitude");
assert(html.indexOf("235.27") !== -1, "Leonid solar longitude");
assert(html.indexOf("262.2") !== -1, "Geminid solar longitude");
assert(html.indexOf("3200 Phaethon") !== -1, "Geminid parent");
assert(html.indexOf("2003 EH1") !== -1, "Quadrantid parent");
assert(html.indexOf("C/1861 G1") !== -1, "Lyrid parent");
assert(html.indexOf("109P/Swift-Tuttle") !== -1, "Perseid parent");
assert(html.indexOf("55P/Tempel-Tuttle") !== -1, "Leonid parent");
assert(html.indexOf("1P/Halley") !== -1, "Halley");
assert(html.indexOf("data-shower=\"per\"") !== -1, "Perseid button");
assert(html.indexOf("data-shower=\"gem\"") !== -1, "Geminid button");
assert(html.indexOf("data-sky=\"city\"") !== -1, "city sky button");

console.log("meteors.test.js ok");
console.log("hand", hand.hourlyRate, "gem", gemExpect.toFixed(2), "Perseid kJ/g", M.kineticKjPerGram(59));
