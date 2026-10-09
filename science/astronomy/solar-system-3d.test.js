/* Orbital-element checks for the 3D solar map. Run: node science/astronomy/solar-system-3d.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var file = path.join(__dirname, "solar-system-3d.js");
var code = fs.readFileSync(file, "utf8");
var context = { console: console, Math: Math };
vm.createContext(context);
vm.runInContext(code, context);
var api = context.SolarSystem3D;
if (!api || typeof api.helio !== "function") {
  console.error("SolarSystem3D.helio missing");
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

var J2000 = 2451545.0;
var ids = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

var earth = api.helio("earth", J2000);
assert(earth && isFinite(earth.r) && isFinite(earth.lon) && isFinite(earth.lat), "earth finite");
assert(earth.r > 0.98 && earth.r < 0.99, "earth near perihelion at J2000, r=" + earth.r);
assert(earth.lon > 95 && earth.lon < 112, "earth ecliptic longitude near perihelion, lon=" + earth.lon);
assert(Math.abs(earth.lat) < 0.05, "earth latitude near 0 at J2000, lat=" + earth.lat);

var mercury = api.helio("mercury", J2000);
assert(Math.abs(mercury.lat) <= 7.2, "mercury latitude within inclination, lat=" + mercury.lat);
assert(mercury.r > 0.3 && mercury.r < 0.47, "mercury distance, r=" + mercury.r);

var neptune = api.helio("neptune", J2000);
assert(neptune.r > 29.5 && neptune.r < 30.6, "neptune distance, r=" + neptune.r);
assert(Math.abs(neptune.lat) <= 1.9, "neptune latitude within inclination, lat=" + neptune.lat);

var pluto = api.helio("pluto", J2000);
assert(pluto.r > 29 && pluto.r < 50, "pluto distance, r=" + pluto.r);
assert(Math.abs(pluto.lat) <= 17.3, "pluto latitude within inclination, lat=" + pluto.lat);

var jd2100 = J2000 + 100 * 365.25;
ids.forEach(function (id) {
  [J2000, J2000 + 26.78 * 365.25, jd2100, J2000 - 100 * 365.25].forEach(function (jd) {
    var p = api.helio(id, jd);
    assert(p && isFinite(p.x) && isFinite(p.y) && isFinite(p.z) && p.r > 0.05, id + " at " + jd + " r=" + (p && p.r));
  });
});

var moon = api.helio("moon", J2000);
var earth2 = api.helio("earth", J2000);
var dx = moon.x - earth2.x;
var dy = moon.y - earth2.y;
var dz = moon.z - earth2.z;
var sep = Math.sqrt(dx * dx + dy * dy + dz * dz);
assert(Math.abs(sep - 384400 / 149597870.7) < 1e-6, "moon separation AU " + sep);

var el2100 = api.elements("jupiter", jd2100);
var el2000 = api.elements("jupiter", J2000);
assert(el2100 && el2000 && el2100.a !== el2000.a, "table switch changes Jupiter a");
assert(el2100.extra === null || el2100.extra, "elements return");

console.log("solar-system-3d.test.js ok", {
  earthR: earth.r.toFixed(4),
  earthLon: earth.lon.toFixed(2),
  mercuryLat: mercury.lat.toFixed(2),
  neptuneR: neptune.r.toFixed(3),
  plutoR: pluto.r.toFixed(3)
});
