/* Stellar-lifetime checks: Eker et al. 2018 Table 4, the 10 Gyr M/L scaling,
   NASA's rough end-state split, Planck's age, and cited preset anchors.
   Run: node science/astronomy/stellar-lifetime/lifetime.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var LT = require("./lifetime.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(LT.TAU_SUN_GYR === 10, "10 Gyr zero");
assert(LT.AGE_UNIVERSE_GYR === 13.797 && LT.AGE_UNIVERSE_ERR === 0.023, "Planck lensing age");
assert(LT.AGE_UNIVERSE_BAO_GYR === 13.787 && LT.AGE_UNIVERSE_BAO_ERR === 0.020, "Planck BAO age");
assert(LT.WD_LIMIT === 8 && LT.NS_LIMIT === 20, "NASA edges");
assert(LT.MLR_LO === 0.179 && LT.MLR_HI === 31, "fit window");
assert(LT.M_MIN === 0.1 && LT.M_MAX === 60, "slider window");

var pieces = LT.pieces();
assert(pieces.length === 6, "six pieces");
assert(pieces[0].a === 2.028 && pieces[0].b === -0.976 && pieces[0].hi === 0.45, "ultra");
assert(pieces[1].a === 4.572 && pieces[1].b === -0.102 && pieces[1].n === 35, "very low");
assert(pieces[2].a === 5.743 && pieces[2].b === -0.007 && pieces[2].lo === 0.72, "low");
assert(pieces[3].a === 4.329 && pieces[3].b === 0.010 && pieces[3].hi === 2.4, "intermediate");
assert(pieces[4].a === 3.967 && pieces[4].b === 0.093 && pieces[4].lo === 2.4, "high");
assert(pieces[5].a === 2.865 && pieces[5].b === 1.105 && pieces[5].hi === 31 && pieces[5].n === 44, "very high");

assert(LT.pieceFor(0.179) == null, "0.179 is outside, lower edge exclusive");
assert(LT.pieceFor(0.1790001).id === "ultra", "just above 0.179");
assert(LT.pieceFor(0.45).id === "ultra", "0.45 stays on the ultra piece");
assert(LT.pieceFor(0.4500001).id === "very-low", "just above 0.45");
assert(LT.pieceFor(1).id === "low", "the Sun's mass is the low-mass piece");
assert(LT.pieceFor(1.05).id === "low", "1.05 inclusive on low");
assert(LT.pieceFor(2.4).id === "intermediate", "2.4 inclusive on intermediate");
assert(LT.pieceFor(2.4000001).id === "high", "just above 2.4");
assert(LT.pieceFor(7).id === "high", "7 inclusive on high");
assert(LT.pieceFor(7.0000001).id === "very-high", "just above 7");
assert(LT.pieceFor(31).id === "very-high", "31 inclusive");
assert(LT.pieceFor(31.0001) == null, "no extrapolation above 31");
assert(LT.pieceFor(0.12) == null, "Proxima's mass is below the fit");
assert(LT.pieceFor(60) == null, "60 is outside the fit");
assert(LT.scalingLuminosity(0.1) !== LT.scalingLuminosity(0.1), "NaN below the fit");
assert(LT.scalingLuminosity(40) !== LT.scalingLuminosity(40), "NaN above the fit");

assert(near(LT.scalingLogL(1), -0.007, 1e-12), "Sun log L is the intercept");
assert(near(LT.scalingLuminosity(1), Math.pow(10, -0.007), 1e-12), "Sun scaling L");
assert(LT.scalingLuminosity(1) !== 1, "the fit is not forced through 1 L☉");
assert(near(LT.lifetimeGyr(1, 1), 10, 0), "nominal Sun is exactly 10 Gyr");
assert(near(LT.scalingLifetime(1), 10 / Math.pow(10, -0.007), 1e-9), "fit lifetime at 1 M☉");

var at45 = LT.scalingLuminosity(0.45);
var above45 = LT.scalingLuminosity(0.4500001);
assert(Math.abs(at45 - above45) / at45 > 0.001, "pieces are not forced to meet at 0.45");

assert(LT.endState(0.12).id === "wd", "Proxima bin");
assert(LT.endState(7.999).id === "wd", "just under 8");
assert(LT.endState(8).id === "ns", "8 is the neutron-star side");
assert(LT.endState(20).id === "ns", "20 stays a neutron star");
assert(LT.endState(20.001).id === "bh", "just over 20");
assert(LT.endState(23).id === "bh", "Rigel's mass is the black-hole bin");
assert(LT.endState(2.063).id === "wd", "Sirius A bin");

assert(LT.yFrac(LT.T_MAX) < LT.yFrac(10), "longer life is above 10 Gyr");
assert(LT.yFrac(10) < LT.yFrac(LT.T_MIN), "10 Gyr is above a short life");
assert(LT.xFrac(0.1) < LT.xFrac(1) && LT.xFrac(1) < LT.xFrac(60), "mass increases to the right");
assert(near(LT.mFromXFrac(LT.xFrac(2.063)), 2.063, 1e-9), "mass round trip");
assert(near(LT.tFromYFrac(LT.yFrac(13.797)), 13.797, 1e-9), "age round trip");

var ids = ["sun", "proxima", "sirius-a", "vega", "rigel"];
var list = LT.presets();
assert(list.length === 5, "five presets");
ids.forEach(function (id, i) {
  assert(list[i].id === id, "order " + id);
  assert(list[i].M >= LT.M_MIN && list[i].M <= LT.M_MAX, id + " on the slider");
  assert(list[i].note && list[i].why, id + " has copy");
  assert(list[i].L > 0, id + " luminosity");
});

var sun = LT.presetById("sun");
assert(sun.M === 1 && sun.L === 1 && sun.mainSequence === true, "Sun preset");
assert(near(LT.publishedLifetime(sun), 10, 0), "Sun published-L lifetime");

var prox = LT.presetById("proxima");
assert(prox.M === 0.120 && prox.dMPlus === 0.003 && prox.L === 0.00151 && prox.dL !== 0 || prox.L === 0.00151, "Proxima numbers");
assert(LT.inFit(prox.M) === false, "Proxima outside the fit");
assert(near(LT.publishedLifetime(prox), 10 * 0.120 / 0.00151, 1e-9), "Proxima M/L");
assert(LT.publishedLifetime(prox) > LT.AGE_UNIVERSE_GYR, "Proxima scaling outlives the Planck age");

var sa = LT.presetById("sirius-a");
assert(sa.M === 2.063 && sa.dMPlus === 0.023 && sa.L === 24.74, "Sirius A");
assert(LT.inFit(sa.M) && LT.pieceFor(sa.M).id === "intermediate", "Sirius piece");
assert(near(LT.publishedLifetime(sa), 10 * 2.063 / 24.74, 1e-12), "Sirius M/L");
assert(Math.abs(LT.scalingLuminosity(sa.M) - sa.L) / sa.L > 0.01, "fit is not the measured luminosity");

var vega = LT.presetById("vega");
assert(vega.M === 2.15 && vega.dMPlus === 0.10 && vega.dMMinus === 0.15 && vega.L === 44, "Vega");
assert(LT.scalingLuminosity(vega.M) < vega.L, "Vega is brighter than the mean line");

var rig = LT.presetById("rigel");
assert(rig.M === 23 && rig.logL === 5.08 && rig.mainSequence === false, "Rigel");
assert(near(rig.L, Math.pow(10, 5.08), 0), "Rigel luminosity is 10^5.08");
assert(LT.pieceFor(rig.M).id === "very-high", "Rigel mass is in the fit's last piece");
assert(LT.scalingLuminosity(rig.M) !== rig.L, "main-sequence fit is not the supergiant luminosity");

var segs = LT.curveSegments(8);
assert(segs.length === 6, "six curve segments");
segs.forEach(function (seg) {
  assert(seg.points.length === 9, seg.id + " samples");
  seg.points.forEach(function (pt) {
    assert(pt.m > LT.MLR_LO && pt.m <= LT.MLR_HI, seg.id + " stays inside the fit");
    assert(pt.t > LT.T_MIN && pt.t < LT.T_MAX, seg.id + " lifetime is on the plot");
    assert(near(pt.t, LT.TAU_SUN_GYR * pt.m / pt.L, 1e-9), seg.id + " t = 10 M/L");
  });
});
assert(segs[0].points[segs[0].points.length - 1].m === 0.45, "ultra ends at 0.45");
assert(segs[5].points[segs[5].points.length - 1].m === 31, "last piece ends at 31");

assert(LT.formatLife(10) === "10 Gyr", "format the solar zero");
assert(LT.formatLife(LT.publishedLifetime(prox)).indexOf("Gyr") > 0, "Proxima in Gyr");
assert(LT.formatLum(LT.scalingLuminosity(1)) === "0.984", "three figures on the solar fit");
assert(LT.formatMass(2.063) === "2.06" || LT.formatMass(2.063) === "2.063", "mass format stays near the cited digits");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("/science/astronomy/stellar-lifetime/") !== -1, "canonical path");
assert(html.indexOf("/science/astronomy/hr/") !== -1, "hr link");
assert(html.indexOf("/science/astronomy/blackbody/") !== -1, "blackbody link");
assert(html.indexOf("/science/astronomy/stars/") !== -1, "stars link");
assert(html.indexOf("/science/astronomy/habitable-zone/") !== -1, "habitable-zone link");
assert(html.indexOf("approximate") !== -1, "approximate label");
assert(html.indexOf("Not a stellar-evolution model") !== -1, "disclaimer");
assert(html.indexOf("Eker et al. 2018") !== -1, "Eker citation");
assert(html.indexOf("13.797") !== -1, "Planck age digits");
assert(html.indexOf("data-preset=\"proxima\"") !== -1, "Proxima button");
assert(html.indexOf("data-preset=\"rigel\"") !== -1, "Rigel button");
assert(html.indexOf("aria-current=\"page\"") !== -1, "current nav item");

console.log("sun fit L", LT.scalingLuminosity(1));
console.log("proxima t", LT.publishedLifetime(prox));
console.log("sirius fit L", LT.scalingLuminosity(sa.M), "t", LT.publishedLifetime(sa));
console.log("vega fit L", LT.scalingLuminosity(vega.M), "t", LT.publishedLifetime(vega));
console.log("rigel fit L", LT.scalingLuminosity(rig.M), "t pub", LT.publishedLifetime(rig), "t fit", LT.scalingLifetime(rig.M));
console.log("lifetime.test.js ok");
