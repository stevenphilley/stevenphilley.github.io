/* Barycenter desk checks. Distances are computed from the cited inputs.
   Run: node science/astronomy/barycenter/barycenter.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var B = require("./barycenter.js");
require("../solar-system-3d.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(B.AU_M === 149597870700, "IAU AU");
assert(B.R_SUN_NOMINAL_M === 6.957e8, "nominal solar radius");
assert(B.SUN_MASS_KG === 1988400 * 1e24, "sun sheet mass");
assert(B.EARTH_MASS_KG === 5.9722e24, "earth sheet mass");
assert(B.SUN_RADIUS_KM === 695700, "sun volumetric radius");
assert(B.PAIRS.length === 5, "five pairs");
assert(B.WOBBLE.length === 8, "eight planets in the wobble");
assert(near(1988400 / 5.9722, 332942.63, 0.005), "sheet division is not 332,900");

function independent(a, m1, m2) {
  return {
    r1: a * m2 / (m1 + m2),
    r2: a * m1 / (m1 + m2)
  };
}

var expect = {
  "earth-moon": {
    r1: "4,670.8 km",
    r2: "379,729.2 km",
    ratio: "0.733",
    side: "inside",
    where: "Inside Earth"
  },
  "sun-jupiter": {
    r1: "742,428.6 km",
    r2: "777,736,571 km",
    ratio: "1.067",
    two: "1.07",
    side: "outside",
    where: "Outside Sun"
  },
  "sun-earth": {
    r1: "449.3 km",
    r2: "149,597,551 km",
    ratio: "0.000646",
    side: "inside",
    where: "Inside Sun"
  },
  "pluto-charon": {
    r1: "2,126.4 km",
    r2: "17,469.6 km",
    ratio: "1.790",
    side: "outside",
    where: "Outside Pluto"
  },
  "alpha-centauri": {
    r1: "1,594,052,816 km",
    r2: "1,891,403,627 km",
    ratio: "1882.0",
    side: "outside",
    where: "Outside Alpha Centauri A",
    au: "10.655585 AU",
    au2: "12.643252 AU"
  }
};

Object.keys(expect).forEach(function (id) {
  var pair = B.pairById(id);
  var e = expect[id];
  var ind = independent(pair.aKm, pair.m1, pair.m2);
  var sc = B.scene({ pair: id });
  assert(sc.ok, id);
  assert(near(sc.r1, ind.r1, Math.abs(ind.r1) * 1e-12 + 1e-6), id + " r1 formula");
  assert(near(sc.r2, ind.r2, Math.abs(ind.r2) * 1e-12 + 1e-6), id + " r2 formula");
  assert(near(sc.r1 + sc.r2, pair.aKm, pair.aKm * 1e-12 + 1e-4), id + " distances add to a");
  assert(sc.r1Text === e.r1, id + " r1 text " + sc.r1Text);
  assert(sc.r2Text === e.r2, id + " r2 text " + sc.r2Text);
  assert(sc.ratioText === e.ratio, id + " ratio " + sc.ratioText);
  assert(sc.side1 === e.side, id + " side " + sc.side1);
  assert(sc.where === e.where, id + " where " + sc.where);
  assert(sc.why.indexOf(e.r1) !== -1, id + " why prints r1");
  assert(sc.why.indexOf(e.ratio) !== -1, id + " why prints the ratio");
  assert(sc.why.indexOf("not an ephemeris") !== -1, id + " disclaimer");
  assert(sc.why.indexOf("add to a") !== -1, id + " sum sentence");
  if (e.two) assert(sc.why.indexOf(e.two) !== -1, id + " two decimals");
  if (e.au) {
    assert(sc.r1Au === e.au, id + " au " + sc.r1Au);
    assert(sc.r2Au === e.au2, id + " au2 " + sc.r2Au);
  }
});

var moon = B.scene({ pair: "earth-moon" });
assert(moon.r1 < 6371 && moon.r1 > 4000, "earth-moon inside the volumetric radius");
assert(moon.why.indexOf("5.9724") !== -1, "moon-sheet earth column is named");
assert(moon.why.indexOf("not averaged") !== -1, "earth masses are not averaged");
assert(moon.why.indexOf("0.0549") !== -1, "moon eccentricity stays");

var jup = B.scene({ pair: "sun-jupiter" });
assert(jup.r1 > 695700, "sun-jupiter outside the sun");
assert(near(jup.r1 / 695700, 1.067, 0.0005), "about 1.067 radii");
assert(jup.why.indexOf("46,728.6 km") !== -1, "photosphere gap");
assert(jup.why.indexOf("~500 km") !== -1, "photosphere thickness stays approximate");
assert(jup.why.indexOf("not subtracted") !== -1, "thickness is not subtracted");
assert(jup.why.indexOf("71,492") !== -1, "equatorial radius is not the disk");

var sunEarth = B.scene({ pair: "sun-earth" });
assert(sunEarth.r1 < 695700, "sun-earth inside the sun");
assert(sunEarth.why.indexOf("1.00000011") !== -1, "J2000 AU is not the separation");
assert(Math.round(sunEarth.r1) === 449, "nearest kilometer is the Lagrange line");
assert(Math.round(moon.r1) === 4671, "earth-moon nearest kilometer");
assert(Math.round(jup.r1) === 742429, "sun-jupiter nearest kilometer");

var pluto = B.scene({ pair: "pluto-charon" });
assert(pluto.r1 > 1188, "outside pluto");
assert(pluto.why.indexOf("0.0") !== -1, "charon eccentricity");
assert(pluto.why.indexOf("barycentric") !== -1, "the other-moons note is not applied silently");

var cen = B.scene({ pair: "alpha-centauri" });
assert(near(cen.aKm / B.AU_KM, 17.4930 / 0.75081, 1e-9), "axis is arcseconds over parallax");
assert(B.formatAuFromKm(cen.aKm) === "23.298837 AU", "same axis as the binary desk");
assert(cen.r1 > cen.radius1 && cen.r2 > cen.radius2, "outside both stars");
assert(cen.why.indexOf("not on an NSSDCA") !== -1, "binary preset is not a fact sheet");
assert(near(cen.m1 / cen.m2, 1.0788 / 0.9092, 1e-12), "mass ratio is the paper");

var lay = B.layout(0, moon.r1, moon.r2);
assert(near(Math.hypot(lay.x1, lay.y1), moon.r1, 1e-6), "body 1 radius of orbit");
assert(near(Math.hypot(lay.x2, lay.y2), moon.r2, 1e-6), "body 2 radius of orbit");
assert(near(lay.x1 * moon.r2 + lay.x2 * moon.r1, 0, 1e-4), "opposite at phase 0");
var lay2 = B.layout(0.25, 3, 5);
assert(near(lay2.x1, 0, 1e-9) && near(lay2.y1, -3, 1e-9), "quarter turn");
assert(near(lay2.x1 / 3 + lay2.x2 / 5, 0, 1e-9), "still opposite");

assert(!B.scene({ m1: 0, m2: 1, aKm: 10, radius1: 1, radius2: 1 }).ok, "zero mass");
var custom = B.scene({ m1: 2e24, m2: 2e24, aKm: 10000, radius1: 1000, radius2: 1000 });
assert(custom.ok && custom.custom && near(custom.r1, 5000, 1e-6), "equal masses split the separation");
assert(custom.side1 === "outside", "custom barycenter is outside a smaller body");
assert(custom.why.indexOf("not a fact sheet") !== -1, "custom disclaimer");

var helio = global.SolarSystem3D.helio;
var off = B.sunOffsetAt(B.WOBBLE_JD0, helio);
assert(off.ok, "j2000 offset");
var bodies = B.WOBBLE.map(function (p) {
  var h = helio(p.id, B.WOBBLE_JD0);
  return { massKg: p.massKg, x: h.x, y: h.y, z: h.z };
});
var check = B.sunFromBodies(bodies, B.SUN_MASS_KG);
assert(near(off.rKm, check.rKm, 1e-6), "offset uses the mass-weighted sum");
assert(off.rText === "1,146,642 km", "j2000 distance " + off.rText);
assert(off.side === "outside" && off.ratioText === "1.648", "j2000 outside " + off.ratioText);
assert(off.rKm !== jup.r1, "eight-planet offset is not the two-body jupiter line");

var trail = B.sunTrail(B.WOBBLE_JD0, B.wobbleJd1(), B.WOBBLE_STEP_DAYS, helio);
assert(trail.length === 914, "50-year sample " + trail.length);
var minKm = trail[0].rKm;
var maxKm = trail[0].rKm;
var inside = 0;
trail.forEach(function (row) {
  if (row.rKm < minKm) minKm = row.rKm;
  if (row.rKm > maxKm) maxKm = row.rKm;
  if (row.side === "inside") inside += 1;
});
assert(B.formatKm(minKm) === "93,388.7 km", "sample minimum " + B.formatKm(minKm));
assert(B.formatKm(maxKm) === "1,377,647 km", "sample maximum " + B.formatKm(maxKm));
assert(minKm < B.SUN_RADIUS_KM && maxKm > B.SUN_RADIUS_KM, "the sample crosses the surface");
assert(inside === 345 && trail.length - inside === 569, "sample inside and outside counts");
assert(B.wobbleJd1() === B.WOBBLE_JD0 + 50 * 365.25, "window uses the map year");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
[
  "not an ephemeris",
  "4,670.8 km",
  "379,729.2 km",
  "742,428.6 km",
  "777,736,571 km",
  "449.3 km",
  "149,597,551 km",
  "2,126.4 km",
  "17,469.6 km",
  "1,594,052,816 km",
  "1,891,403,627 km",
  "0.733",
  "1.067",
  "1.07",
  "0.000646",
  "1.790",
  "1882.0",
  "23.298837 AU",
  "10.655585 AU",
  "12.643252 AU",
  "4,671 km",
  "742,429 km",
  "332,900",
  "332,942.63",
  "not averaged",
  "subnav-desk",
  "subnav-phone",
  "id=\"pair-canvas\"",
  "id=\"wobble-canvas\"",
  "id=\"btn-play\"",
  "id=\"m1\"",
  "id=\"m1-num\"",
  "Approximate schematic",
  "not a JPL Horizons barycenter",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html",
  "https://ssd.jpl.nasa.gov/planets/approx_pos.html",
  "/science/astronomy/binary-stars/",
  "/science/astronomy/transit/",
  "/science/astronomy/kepler/",
  "/science/astronomy/lagrange/",
  "{% include nav.html %}",
  "{% include head-layout.html %}",
  "{% include footer.html %}"
].forEach(function (bit) {
  assert(html.indexOf(bit) !== -1, "html missing " + bit);
});
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf('aria-current="page">Barycenter') !== -1, "this page is current");
assert(html.indexOf('type="number"') !== -1, "number fields");
B.PAIRS.forEach(function (pair) {
  var sc = B.scene({ pair: pair.id });
  assert(html.indexOf(sc.r1Text) !== -1, "table r1 " + pair.id);
  assert(html.indexOf(sc.r2Text) !== -1, "table r2 " + pair.id);
  assert(html.indexOf(pair.m1Label) !== -1, "table mass " + pair.id);
});

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/barycenter/") !== -1, "hub links the desk");
assert(hub.indexOf(">Barycenter</a>") !== -1, "hub menu");
assert(hub.indexOf("<h3>Barycenter</h3>") !== -1, "hub card");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/barycenter/") !== -1, "science index links the desk");
assert(science.indexOf("<h2>Barycenter</h2>") !== -1, "science card");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/barycenter/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/barycenter/") !== -1, "search index");
JSON.parse(search);
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/barycenter/") !== -1, "html sitemap");
var news = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../whats-new/entries.json"), "utf8"));
var found = false;
news.forEach(function (day) {
  (day.entries || []).forEach(function (entry) {
    if (entry.href === "/science/astronomy/barycenter/") found = true;
  });
});
assert(found, "whats-new lists the desk");

["binary-stars", "kepler", "transit"].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, "../" + name + "/index.html"), "utf8");
  assert(page.indexOf("/science/astronomy/barycenter/") !== -1, name + " links back");
});

console.log("barycenter.test.js: ok");
console.log("Earth–Moon", moon.r1Text, moon.ratioText, moon.side1);
console.log("Sun–Jupiter", jup.r1Text, jup.ratioText, "Sun–Earth", sunEarth.r1Text);
console.log("Pluto–Charon", pluto.r1Text, pluto.ratioText, "Alpha Cen", cen.r1Au);
console.log("J2000 Sun offset", off.rText, off.ratioText, "sample", B.formatKm(minKm), "to", B.formatKm(maxKm));
