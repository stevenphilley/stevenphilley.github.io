/* Planet-days desk checks. Fact-sheet periods and the solar-day formula.
   Run: node science/astronomy/planet-days/planet-days.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var D = require("./planet-days.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(D.HOURS_PER_DAY === 24, "days become hours by 24");
assert(D.PLANETS.length === 8, "eight planets");

var expect = {
  mercury: { sid: 1407.6, day: 4222.6, orb: 87.969, arith: "4223.376", rounds: false, retro: false, enlarged: false },
  venus: { sid: -5832.6, day: 2802.0, orb: 224.701, arith: "2802.049", rounds: true, retro: true, enlarged: false },
  earth: { sid: 23.9345, day: 24.0000, orb: 365.256, arith: "24.000028", rounds: true, retro: false, enlarged: true },
  mars: { sid: 24.6229, day: 24.6597, orb: 686.980, arith: "24.659727", rounds: true, retro: false, enlarged: true },
  jupiter: { sid: 9.9250, day: 9.9259, orb: 4332.589, arith: "9.925947", rounds: true, retro: false, enlarged: true },
  saturn: { sid: 10.656, day: 10.656, orb: 10755.699, arith: "10.65644", rounds: true, retro: false, enlarged: true },
  uranus: { sid: -17.24, day: 17.24, orb: 30685.400, arith: "17.2396", rounds: true, retro: true, enlarged: true },
  neptune: { sid: 16.11, day: 16.11, orb: 60189.018, arith: "16.1102", rounds: true, retro: false, enlarged: true }
};

Object.keys(expect).forEach(function (id) {
  var p = D.planetById(id);
  var e = expect[id];
  assert(p, id);
  assert(p.siderealHours === e.sid, id + " sidereal");
  assert(p.dayHours === e.day, id + " length of day");
  assert(p.orbitDays === e.orb, id + " sidereal orbit");
  assert(p.retrograde === e.retro, id + " retrograde flag");
  var sol = D.solarFrom(p.siderealHours, p.orbitDays);
  assert(sol, id + " solar");
  assert(D.arithmeticLabel(sol.hours, p.dayLabel) === e.arith, id + " arithmetic " + D.arithmeticLabel(sol.hours, p.dayLabel));
  assert(D.roundsToSheet(sol.hours, p.dayLabel) === e.rounds, id + " rounding flag");
  if (e.retro) assert(sol.signedHours < 0 && sol.hours > 0, id + " signed solar is negative, length is positive");
  else assert(sol.signedHours > 0, id + " prograde solar is positive");
  var noon = D.poseAt(p, 0);
  var next = D.poseAt(p, sol.hours);
  var sid = D.poseAt(p, Math.abs(p.siderealHours));
  assert(noon.ok && noon.facesSun && noon.facesStar, id + " opens at noon, marker on the star");
  assert(next.facesSun, id + " next noon faces the Sun");
  assert(sid.facesStar, id + " sidereal turn faces the star");
  assert(noon.enlarged === e.enlarged, id + " enlargement");
  if (!e.retro) assert(Math.abs(p.siderealHours) < sol.hours, id + " prograde solar day is longer");
  else assert(sol.hours < Math.abs(p.siderealHours), id + " retrograde solar day is shorter");
});

var mercury = D.scene({ planet: "mercury" });
assert(near(mercury.orbitTurns, 2.0004, 0.0001), "Mercury solar day is about two orbits");
assert(mercury.orbitTurns !== 2, "not exactly two");
assert(near(mercury.perSpin, 1.4999, 0.0001), "near 3/2, not exactly");
assert(mercury.perSpin !== 1.5, "not exactly 3/2");
assert(mercury.twoOrbits === "4222.512", "two printed orbits");
assert(mercury.why.indexOf("4223.376") !== -1 && mercury.why.indexOf("4222.6") !== -1, "both Mercury days");
assert(mercury.why.indexOf("not averaged") !== -1, "Mercury figures are not averaged");
assert(mercury.why.indexOf("about two Mercury years") !== -1, "about two years");
assert(mercury.why.indexOf("not exactly 3/2") !== -1, "not exactly 3/2");
assert(mercury.formula.indexOf("1/1407.6") !== -1, "Mercury formula");

var earth = D.scene({ planet: "earth" });
assert(earth.arith === "24.000028", "Earth arithmetic");
assert(earth.why.indexOf("24.0000") !== -1 && earth.why.indexOf("not averaged") !== -1, "Earth pair stays separate");
assert(earth.why.indexOf("not an ephemeris") !== -1, "disclaimer");
assert(earth.formula === "1/T_solar = 1/23.9345 − 1/(365.256 × 24)", "Earth formula");
var tropical = D.solarFrom(23.9345, 365.242);
assert(tropical.hours !== D.solarFrom(23.9345, 365.256).hours, "tropical year is not the formula’s orbit");

var venus = D.scene({ planet: "venus" });
assert(venus.formula.indexOf("1/(−5832.6)") !== -1, "Venus sign flip");
assert(venus.why.indexOf("-5832.5") !== -1 && venus.why.indexOf("-5832.6") !== -1, "both Venus rotations");
assert(venus.why.indexOf("not averaged") !== -1, "Venus printings are not averaged");
assert(venus.planet.obliquity === "177.36", "Venus obliquity");

var uranus = D.scene({ planet: "uranus" });
assert(uranus.formula.indexOf("1/(−17.24)") !== -1, "Uranus sign flip");
assert(uranus.planet.system.indexOf("Voyager 2 Radio Science") !== -1, "Uranus magnetic coordinates");
assert(uranus.planet.obliquity === "97.77", "Uranus obliquity");
assert(uranus.why.indexOf("does not repeat the asterisk") !== -1, "length of day is not starred");

var jupiter = D.planetById("jupiter");
assert(jupiter.system === "System III (1965.0) coordinates", "Jupiter System III");
assert(jupiter.orbitLabel === "4,332.589", "Jupiter comma");
var saturn = D.planetById("saturn");
assert(saturn.system === "Saturnian System III coordinates", "Saturn System III");
assert(D.planetById("neptune").system.indexOf("Voyager 2") !== -1, "Neptune magnetic coordinates");
assert(D.planetById("venus").cmpRotation === "-5832.5", "comparison Venus rotation");
assert(D.planetById("earth").cmpOrbit === "365.2", "comparison Earth orbital period");
assert(D.planetById("earth").tropicalLabel === "365.242", "Earth tropical on the sheet");

assert(D.scene({ planet: "pluto" }).ok === false, "no ninth planet");
assert(D.poseAt(D.planetById("earth"), "nope").ok === false, "bad time");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "1407.6",
  "4222.6",
  "4223.376",
  "-5832.6",
  "-5832.5",
  "2802.0",
  "2802.049",
  "23.9345",
  "24.0000",
  "24.000028",
  "24.6229",
  "24.6597",
  "9.9250",
  "9.9259",
  "9.925947",
  "System III (1965.0) coordinates",
  "10.656",
  "10,755.699",
  "Saturnian System III coordinates",
  "-17.24",
  "17.24",
  "17.2396",
  "97.77",
  "30,685.400",
  "Voyager 2 Radio Science experiment",
  "16.11",
  "60,189.018",
  "59,799.900",
  "365.256",
  "365.242",
  "365.2",
  "87.969",
  "subnav-desk",
  "subnav-phone",
  "id=\"day-canvas\"",
  "id=\"hour\"",
  "not an ephemeris",
  "not averaged",
  "1/T_solar",
  "/science/astronomy/sidereal/",
  "/science/astronomy/synodic/",
  "/science/astronomy/mercury/",
  "/science/astronomy/venus/",
  "/science/astronomy/uranus/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
  "{% include nav.html %}"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf('aria-current="page">Planet days') !== -1, "this page is current in the menu");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/planet-days/") !== -1, "hub links the desk");
assert(hub.indexOf(">Planet days</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Planet days</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/planet-days/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/planet-days/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/planet-days/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/planet-days/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/planet-days/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["sidereal", "synodic", "mercury", "venus", "uranus"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/planet-days/") !== -1, name + " links back");
});

console.log("planet-days.test.js: ok");
console.log("Earth", earth.arith, "Mercury", mercury.arith, "Venus", venus.arith);
