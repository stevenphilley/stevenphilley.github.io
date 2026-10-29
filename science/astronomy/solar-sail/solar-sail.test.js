/* Solar-sail checks. Pressures come from S/c and 2S/c, not from stored results.
   Run: node science/astronomy/solar-sail/solar-sail.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var S = require("./solar-sail.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(S.C_M_S === 299792458, "exact c");
assert(S.AU_M === 149597870700, "exact IAU au");
assert(S.S_NOMINAL_W_M2 === 1361, "IAU nominal irradiance");
assert(S.GM_SUN_M3_S2 === 1.3271244e20, "IAU nominal GM sun");
assert(S.KOPP_LEAN_TSI_W_M2 === 1360.8, "Kopp & Lean central value");
assert(S.KOPP_LEAN_TSI_UNC_W_M2 === 0.5, "Kopp & Lean uncertainty");
assert(S.DAY_S === 86400, "SI day");
assert(S.YEAR_DAYS === 365.25, "Julian span");
assert(S.irradiance(1) === 1361, "1 AU uses the nominal irradiance");
assert(S.irradiance(1) !== S.KOPP_LEAN_TSI_W_M2, "the 2008 minimum is not substituted");

var face = 2 * 1361 / 299792458;
var absorb = 1361 / 299792458;
assert(near(S.pressureReflector(1), face, 0), "reflector pressure is 2S/c");
assert(near(S.pressureAbsorber(1), absorb, 0), "absorber pressure is S/c");
assert(near(S.pressureReflector(1), 2 * S.pressureAbsorber(1), 0), "reflection doubles the face-on pressure");
assert(S.formatPressure(S.pressureReflector(1)) === "9.080 μN/m²", "about 9.1 μN/m² prints " + S.formatPressure(S.pressureReflector(1)));
assert(S.formatPressure(S.pressureAbsorber(1)) === "4.540 μN/m²", "absorber print " + S.formatPressure(S.pressureAbsorber(1)));
assert(face > 9.0e-6 && face < 9.2e-6, "reflector pressure is about 9.1 micronewtons per square metre");

var ref = S.idealModel("reference", 1);
assert(ref.areaM2 === 1 && ref.massKg === 1, "reference sail");
assert(ref.reflectivity === 1 && ref.tiltDeg === 0 && ref.au === 1, "reference is face-on at 1 AU");
assert(near(ref.forceN, face, 0), "1 m² force equals the pressure");
assert(near(ref.accel, face, 0), "1 kg acceleration equals the pressure");
assert(S.formatAccel(ref.accel) === "9.080 μm/s²", "reference acceleration");
assert(S.formatForce(ref.forceN) === "9.080 μN", "reference force");
assert(S.formatFlux(ref.irradiance) === "1,361.0 W/m²", "flux print");
assert(S.formatAccel(ref.gravity) === "5.930 mm/s²", "solar gravity " + S.formatAccel(ref.gravity));
assert(near(ref.gravity, S.GM_SUN_M3_S2 / (S.AU_M * S.AU_M), 0), "gravity is GM/au²");
assert(near(ref.lightness, ref.accel / ref.gravity, 0), "lightness is the ratio");
assert(S.formatBeta(ref.lightness) === "1.531×10⁻³", "reference lightness " + S.formatBeta(ref.lightness));
assert(near(ref.deltaV, ref.accel * 86400, 0), "one day is a times 86400 s");
assert(S.formatDv(ref.deltaV) === "0.784 m/s", "one-day Δv " + S.formatDv(ref.deltaV));
assert(near(ref.characteristic, ref.accel, 0), "face-on at 1 AU is the characteristic acceleration");
assert(S.formatLoading(S.loading(ref)) === "1.000 kg/m²", "reference loading");

var year = S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 0, timeDays: 365.25 });
assert(near(year.deltaV, ref.accel * 365.25 * 86400, 0), "year holds the same acceleration");
assert(S.formatDv(year.deltaV) === "286.53 m/s", "year Δv " + S.formatDv(year.deltaV));

/* Tilt: perfect reflector magnitude is (2SA/c) cos²θ, along the normal. */
var tilt = 35 * Math.PI / 180;
var tilted = S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 35, timeDays: 1 });
assert(near(tilted.forceN, face * Math.cos(tilt) * Math.cos(tilt), 1e-18), "reflector magnitude");
assert(near(tilted.forceAngleRad, tilt, 1e-12), "reflector force follows the normal");
assert(near(tilted.radialN, face * Math.pow(Math.cos(tilt), 3), 1e-18), "reflector radial");
assert(near(tilted.transverseN, face * Math.cos(tilt) * Math.cos(tilt) * Math.sin(tilt), 1e-18), "reflector transverse");
assert(near(tilted.characteristic, face, 0), "characteristic acceleration ignores tilt");

var absorber = S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 0, tiltDeg: 35, timeDays: 1 });
assert(absorber.transverseN === 0, "an absorber has no transverse force");
assert(near(absorber.radialN, absorb * Math.cos(tilt), 1e-18), "absorber force is the projected area");
assert(near(absorber.characteristic, absorb, 0), "absorber characteristic is S A / c m");

var half = S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 0.5, tiltDeg: 0, timeDays: 1 });
assert(near(half.forceN, 1.5 * absorb, 1e-18), "face-on pressure is (1+ρ) S/c");

/* Inverse square, and a lightness number that does not care about distance. */
assert(near(S.irradiance(2), 1361 / 4, 0), "irradiance is the inverse square");
var jupiter = S.planetById("jupiter");
var far = S.model({ au: jupiter.au, areaM2: 32, massKg: 4.93, reflectivity: 0.4, tiltDeg: -20, timeDays: 10 });
var nearAu = S.model({ au: 1, areaM2: 32, massKg: 4.93, reflectivity: 0.4, tiltDeg: -20, timeDays: 10 });
assert(near(far.lightness, nearAu.lightness, 1e-12), "lightness is independent of distance");
assert(far.transverseN < 0, "negative tilt pushes against the prograde direction");
assert(near(far.irradiance, 1361 / (jupiter.au * jupiter.au), 1e-9), "Jupiter irradiance");
assert(S.formatAu(jupiter.au) === "5.20336301 AU", "Jupiter label");
assert(S.formatAu(1) === "1 AU", "exact 1 AU");
assert(S.formatAu(S.planetById("earth").au) === "1.00000011 AU", "Earth is not exactly 1 AU");
assert(S.matchedPlanet(1) === "one", "1 AU snap");
assert(S.matchedPlanet(S.planetById("earth").au) === "earth", "Earth snap");
assert(S.formatFlux(S.irradiance(S.planetById("earth").au)) === "1,361.0 W/m²", "Earth flux prints inside the tenth");

var ikaros = S.idealModel("ikaros", 1);
assert(ikaros.areaM2 === 196 && ikaros.massKg === 307, "IKAROS is 14×14 m and 307 kg");
assert(near(ikaros.forceN, face * 196, 1e-15), "IKAROS force");
assert(near(ikaros.accel, face * 196 / 307, 1e-18), "IKAROS acceleration");
assert(S.formatAccel(ikaros.accel) === "5.797 μm/s²", "IKAROS print " + S.formatAccel(ikaros.accel));
assert(S.formatForce(ikaros.forceN) === "1.780 mN", "IKAROS force print");
assert(S.formatLoading(S.loading(ikaros)) === "1.566 kg/m²", "IKAROS loading");

var ls = S.idealModel("lightsail2", 1);
assert(ls.areaM2 === 32 && ls.massKg === 4.93, "LightSail 2 area and mass");
assert(near(ls.accel, face * 32 / 4.93, 1e-18), "LightSail acceleration");
assert(S.formatAccel(ls.accel) === "0.0589 mm/s²", "LightSail print " + S.formatAccel(ls.accel));
assert(S.formatForce(ls.forceN) === "290.548 μN", "LightSail force");
assert(S.formatBeta(ls.lightness) === "9.938×10⁻³", "LightSail lightness");

var acs = S.idealModel("acs3", 1);
assert(acs.areaM2 === 80 && acs.massKg === 16, "ACS3 area and mass");
assert(near(acs.accel, face * 80 / 16, 1e-18), "ACS3 acceleration");
assert(S.formatAccel(acs.accel) === "0.0454 mm/s²", "ACS3 print " + S.formatAccel(acs.accel));
assert(S.formatBeta(acs.lightness) === "7.656×10⁻³", "ACS3 lightness " + S.formatBeta(acs.lightness));
assert(S.MISSIONS.length === 4, "four presets");
assert(S.PLANETS.length === 5, "five planet snaps");

assert(S.model({ au: 0.19, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 0, timeDays: 1 }) == null, "inside the floor");
assert(S.model({ au: 41, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 0, timeDays: 1 }) == null, "past the ceiling");
assert(S.model({ au: 1, areaM2: 0, massKg: 1, reflectivity: 1, tiltDeg: 0, timeDays: 1 }) == null, "zero area");
assert(S.model({ au: 1, areaM2: 1, massKg: 0.4, reflectivity: 1, tiltDeg: 0, timeDays: 1 }) == null, "mass floor");
assert(S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 1.01, tiltDeg: 0, timeDays: 1 }) == null, "reflectivity");
assert(S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 90.1, timeDays: 1 }) == null, "tilt");
assert(S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 0, timeDays: -1 }) == null, "negative time");
var edge = S.model({ au: 1, areaM2: 1, massKg: 1, reflectivity: 1, tiltDeg: 90, timeDays: 0 });
assert(edge && edge.forceN === 0 && edge.deltaV === 0, "edge-on and zero time");

assert(near(S.auFromUnit(0), S.AU_MIN, 1e-12), "distance slider floor");
assert(near(S.auFromUnit(1000), S.AU_MAX, 1e-9), "distance slider ceiling");
assert(near(S.auFromUnit(S.unitFromAu(1)), 1, 1e-12), "distance slider round trip");
assert(near(S.areaFromUnit(S.unitFromArea(32)), 32, 1e-9), "area slider round trip");
assert(near(S.massFromUnit(S.unitFromMass(4.93)), 4.93, 1e-9), "mass slider round trip");

assert(S.explain(ref).indexOf("9.080 μN/m²") !== -1, "explain names the pressure");
assert(S.explain(ref).indexOf("not a trajectory") !== -1, "explain names the simplification");
assert(S.explain(tilted).indexOf("spirals outward") !== -1, "forward tilt");
assert(S.explain(far).indexOf("spirals inward") !== -1, "backward tilt");
assert(S.explain(absorber).indexOf("transverse force is zero") !== -1, "absorber tilt");
var why = S.explainWhy();
assert(why.tiny.indexOf("9.080 μN/m²") !== -1 && why.tiny.indexOf("about 9.1") !== -1, "tiny push");
assert(why.tiny.indexOf("1.531 g/m²") !== -1, "critical loading");
assert(why.doubled.indexOf("pushed twice") !== -1, "reflection is the second push");
assert(why.doubled.indexOf("4.540 μN/m²") !== -1 && why.doubled.indexOf("9.080 μN/m²") !== -1, "doubling cites both pressures");
assert(why.tilt.indexOf("spirals outward") !== -1 && why.tilt.indexOf("spirals inward") !== -1, "both spiral directions");
assert(why.tilt.indexOf("no transverse force") !== -1, "tilt section names the absorber");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/solar-sail/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("solar-sail.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("Educational calculator") !== -1, "educational disclaimer");
assert(html.indexOf("Not a trajectory") !== -1, "trajectory disclaimer");
assert(html.indexOf("299,792,458") !== -1, "c on the page");
assert(html.indexOf("149,597,870,700") !== -1, "au on the page");
assert(html.indexOf("1361") !== -1, "nominal irradiance on the page");
assert(html.indexOf("1360.8") !== -1, "Kopp & Lean value is cited");
assert(html.indexOf("1.3271244") !== -1, "GM on the page");
assert(html.indexOf("9.080") !== -1, "reflector pressure on the page");
assert(html.indexOf(S.explain(ref)) !== -1, "reference explanation is on the page");
assert(html.indexOf(why.tiny) !== -1, "tiny-push paragraph");
assert(html.indexOf(why.doubled) !== -1, "reflection paragraph");
assert(html.indexOf(why.tilt) !== -1, "tilt paragraph");
assert(html.indexOf("307") !== -1 && html.indexOf("196") !== -1, "IKAROS numbers");
assert(html.indexOf("4.93") !== -1 && html.indexOf("32") !== -1, "LightSail numbers");
assert(html.indexOf("4.85") !== -1, "FCC mass is named and not the button");
assert(html.indexOf("about 310") !== -1, "JAXA public mass is named");
assert(html.indexOf("0.0454 mm/s²") !== -1 && html.indexOf("0.045 mm/s²") !== -1, "ACS3 computed and cited accelerations");
assert(html.indexOf("0.0077") !== -1, "ACS3 cited lightness");
assert(html.indexOf("0.74") !== -1, "ACS3 reflectance is cited, not used as ρ");
assert(html.indexOf("https://global.jaxa.jp/projects/sas/ikaros/") !== -1, "JAXA IKAROS page");
assert(html.indexOf("https://doi.org/10.3390/aerospace10070579") !== -1, "LightSail paper");
assert(html.indexOf("https://doi.org/10.1029/2010GL045777") !== -1, "Kopp & Lean");
assert(html.indexOf("IAU 2015") !== -1, "IAU resolution named");
assert(html.indexOf("data-mission=\"ikaros\"") !== -1, "IKAROS button");
assert(html.indexOf("data-mission=\"lightsail2\"") !== -1, "LightSail button");
assert(html.indexOf("data-mission=\"acs3\"") !== -1, "ACS3 button");
assert(html.indexOf("data-planet=\"mercury\"") !== -1 && html.indexOf("data-planet=\"jupiter\"") !== -1, "planet snaps");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/solar-sail/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/solar-sail/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/solar-sail/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/solar-sail/") !== -1, "search index");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/solar-sail/") !== -1, "html sitemap");
var rocket = fs.readFileSync(path.join(__dirname, "../rocket/index.html"), "utf8");
assert(rocket.indexOf("/science/astronomy/solar-sail/") !== -1, "rocket cross-link");

console.log("solar-sail.test.js: ok");
console.log("1 AU reflector", S.formatPressure(face), "absorber", S.formatPressure(absorb));
console.log("IKAROS", S.formatAccel(ikaros.accel), "LightSail 2", S.formatAccel(ls.accel), "ACS3", S.formatAccel(acs.accel));
