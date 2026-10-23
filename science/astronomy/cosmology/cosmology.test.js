/* Cosmology-desk checks. The integrator is Hogg 1999 with radiation omitted.
   Closed forms: Einstein–de Sitter, flat ΛCDM age, Milne transverse distance.
   Planck and curved cases are locked to astropy.cosmology (Tcmb0 = 0) run
   in this VM. The published Planck age, 13.797 Gyr, includes radiation and
   is a separate comparison, not the integral.
   Run: node science/astronomy/cosmology/cosmology.test.js */
"use strict";

var C = require("./cosmology.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(C.C_KM_S === 299792.458, "defined c");
assert(C.LY_PER_PC === 3.2616, "light-year rounding matches the magnitude desk");
assert(C.H0_PLANCK === 67.36 && C.H0_PLANCK_ERR === 0.54, "Planck Table 2 H0");
assert(C.OMEGA_M_PLANCK === 0.3153 && C.OMEGA_M_PLANCK_ERR === 0.0073, "Planck Ωm");
assert(C.OMEGA_L_PLANCK === 0.6847 && C.OMEGA_L_PLANCK_ERR === 0.0073, "Planck ΩΛ");
assert(C.AGE_PLANCK_GYR === 13.797 && C.AGE_PLANCK_ERR === 0.023, "published age");
assert(C.Z_STAR === 1089.92 && C.Z_STAR_ERR === 0.25, "Planck z*");
assert(C.H0_SHOES === 73.04 && C.H0_SHOES_ERR === 1.04, "SH0ES 2022");
assert(C.Z_3C273 === 0.15756751, "3C 273");
assert(C.Z_GNZ11 === 10.6034 && C.Z_GNZ11_ERR === 0.0013, "GN-z11");
assert(C.COMA_CZ === 6853 && C.COMA_SIGMA_CZ === 1082, "Coma cz");
assert(C.omegaK(C.planckParams()) === 0, "Planck central values are flat");
assert(C.OMEGA_M_PLANCK + C.OMEGA_L_PLANCK === 1, "quoted digits sum to 1");

/* Slider: z = 0 and z = 20 are the ends. Midpoint is below the linear mid. */
assert(C.zFromUnit(0) === 0, "slider start");
assert(C.zFromUnit(1) === 20, "slider end");
assert(C.zFromUnit(0.5) < 10, "log-friendly: more room at low z");
assert(C.unitFromZ(0) === 0 && near(C.unitFromZ(20), 1, 1e-12), "unit round trip");
assert(C.zOk(0) && C.zOk(1089.92) && C.zOk(2000) && !C.zOk(-0.001) && !C.zOk(2001), "z range");

/* Einstein–de Sitter. */
var eds = C.params(70, 1, 0);
var eds1 = C.measures(1, eds);
assert(eds1 && near(eds1.comovingMpc, C.edsComovingMpc(1, 70), 1e-9), "EdS distance");
assert(near(eds1.ageTodayGyr, C.edsAgeGyr(70), 1e-12), "EdS age");
assert(near(eds1.ageAtZGyr, C.edsAgeGyr(70) / Math.pow(2, 1.5), 1e-9), "EdS age at z=1");
assert(near(eds1.lookbackGyr, eds1.ageTodayGyr - eds1.ageAtZGyr, 1e-12), "lookback is the difference");
assert(eds1.flat && eds1.transverseMpc === eds1.comovingMpc, "EdS is flat");

/* Flat ΛCDM age, closed form, Planck central values. */
var planck = C.planckParams();
var ageClosed = C.flatLambdaAgeGyr(planck.H0, planck.omegaM);
var now = C.measures(0, planck);
assert(now && near(now.ageTodayGyr, ageClosed, 1e-9), "Planck age matches the flat closed form");
assert(now.comovingMpc === 0 && now.lookbackGyr === 0 && now.kpcPerArcsec === 0, "z = 0 is the observer");
/* Published 13.797 ± 0.023 includes radiation. The no-radiation integral
   has to land inside that uncertainty, near 13.8 Gyr. */
assert(Math.abs(now.ageTodayGyr - C.AGE_PLANCK_GYR) < C.AGE_PLANCK_ERR, "inside the published age uncertainty");
assert(now.ageTodayGyr > 13.7 && now.ageTodayGyr < 13.9, "near 13.8 Gyr");

/* Astropy FlatLambdaCDM(H0=67.36, Om0=0.3153, Tcmb0=0), this VM.
   Digits are astropy’s. Tolerances are far tighter than the display. */
var astropy = {
  age: 13.800724695099,
  z1: { lb: 7.95410683, at: 5.84661787, Dc: 3402.692537, Dl: 6805.385075, Da: 1701.346269 },
  z3: { Dc: 6508.079651, Da: 1627.019913 },
  gnz: { z: 10.6034, Dc: 9761.983655, Da: 841.303726, lb: 13.36479867 },
  cmb: { Dc: 13935.231354, Da: 12.773834, lb: 13.80024639, at: 0.00047830 }
};
assert(near(now.ageTodayGyr, astropy.age, 1e-9), "age vs astropy");

function checkZ(z, ref, label) {
  var m = C.measures(z, planck);
  assert(m, label + " measures");
  assert(near(m.lookbackGyr, ref.lb, 1e-6), label + " lookback");
  if (ref.at != null) assert(near(m.ageAtZGyr, ref.at, 1e-6), label + " age at z");
  assert(near(m.comovingMpc, ref.Dc, 1e-4), label + " Dc");
  if (ref.Dl != null) assert(near(m.luminosityMpc, ref.Dl, 1e-3), label + " Dl");
  assert(near(m.angularMpc, ref.Da, 1e-4), label + " Da");
  assert(near(m.luminosityMpc, (1 + z) * (1 + z) * m.angularMpc, 1e-6), label + " Etherington");
  assert(m.transverseMpc === m.comovingMpc, label + " flat transverse");
}

checkZ(1, astropy.z1, "z=1");
checkZ(3, { lb: 11.65844950, at: 2.14227519, Dc: astropy.z3.Dc, Dl: 26032.318603, Da: astropy.z3.Da }, "z=3");
checkZ(astropy.gnz.z, astropy.gnz, "GN-z11");
checkZ(C.Z_STAR, astropy.cmb, "CMB z*");

/* kpc per arcsec is D_A in Mpc times 1000 times one arcsec in radians. */
var z1 = C.measures(1, planck);
assert(near(z1.kpcPerArcsec, z1.angularMpc * 1000 * C.ARCSEC_RAD, 0), "arcsec scale");
assert(near(z1.kpcPerArcsec, 8.24835947, 1e-5), "z=1 scale vs astropy kpc/arcsec");

/* The angular-diameter distance peaks near z of about 1.6, then declines.
   z=3 is already below the peak. z=1 is still below it. */
var peak = C.angularPeak(planck, 8);
assert(peak && !peak.atEdge, "peak is inside the window");
assert(peak.z > 1.5 && peak.z < 1.7, "peak near 1.6");
assert(C.measures(3, planck).angularMpc < peak.angularMpc, "D_A has turned over by z=3");
assert(C.measures(1, planck).angularMpc < peak.angularMpc, "D_A is still rising at z=1");

/* Coma is cz/c. The comoving distance and cz/H0 are close, and the
   cluster dispersion is the larger number. */
var coma = C.objectById("coma");
assert(near(coma.z, C.COMA_CZ / C.C_KM_S, 0), "Coma z is cz/c");
var comaM = C.measures(coma.z, planck);
assert(Math.abs(comaM.comovingMpc - comaM.czOverH0Mpc) / comaM.czOverH0Mpc < 0.01, "Coma is still the nearby toy");
var dispersionMpc = C.COMA_SIGMA_CZ / C.H0_PLANCK;
assert(dispersionMpc > Math.abs(comaM.comovingMpc - comaM.czOverH0Mpc), "dispersion exceeds the cz/H0 gap");

/* SH0ES changes H0 only. Distances scale as 1/H0. Age scales as 1/H0. */
var shoes = C.shoesParams();
var shoesNow = C.measures(0, shoes);
var shoes1 = C.measures(1, shoes);
assert(shoes.omegaM === C.OMEGA_M_PLANCK && shoes.omegaL === C.OMEGA_L_PLANCK, "SH0ES keeps Planck densities");
assert(near(shoesNow.ageTodayGyr, now.ageTodayGyr * C.H0_PLANCK / C.H0_SHOES, 1e-9), "age scales as 1/H0");
assert(near(shoes1.comovingMpc, z1.comovingMpc * C.H0_PLANCK / C.H0_SHOES, 1e-6), "distance scales as 1/H0");
assert(near(shoesNow.ageTodayGyr, 12.727502949916, 1e-9), "SH0ES age vs astropy");

/* Curved. Astropy LambdaCDM, Tcmb0=0.
   H0=70, Ωm=0.3, ΩΛ=0.6, z=1.
   Open: ΩΛ=0, so Ωk=0.7. */
var curved = C.measures(1, C.params(70, 0.3, 0.6));
assert(curved && !curved.flat && curved.omegaK > 0, "open-ish curvature");
assert(near(curved.comovingMpc, 3209.7837001394278, 1e-6), "curved line-of-sight");
assert(near(curved.transverseMpc, 3239.917254763265, 1e-6), "curved transverse");
assert(curved.transverseMpc > curved.comovingMpc, "positive Ωk stretches the transverse distance");
assert(near(curved.ageTodayGyr, 13.061695421638367, 1e-9), "curved age");
assert(near(curved.luminosityMpc, (1 + 1) * curved.transverseMpc, 1e-8), "Dl = (1+z) DM");

var open = C.measures(1, C.params(70, 0.3, 0));
assert(near(open.comovingMpc, 2795.1560207514162, 1e-6), "open Dc");
assert(near(open.transverseMpc, 2936.1472205029695, 1e-6), "open DM");

/* Milne, Ωk = 1, checked on the transverse formula directly.
   Ωm = 0 is outside the slider because the age integral would need a
   different guard. */
assert(near(C.milneTransverseMpc(1, 70), C.hubbleDistanceMpc(70) * Math.sinh(Math.log(2)), 1e-9), "Milne");

/* A closed model can pass the antipode. Distances then go negative
   and the page must not present them as a ruler. */
var closed = C.measures(10, C.params(70, 0.2, 1.4));
assert(closed && closed.pastAntipode && closed.transverseMpc < 0, "antipode flag");

/* Parameters that do not expand out to this z return null. */
assert(C.measures(1, C.params(70, 0.05, 1.5)) === null, "no real E(z)");
assert(C.measures(-1, planck) === null, "negative z rejected");
assert(C.measures(1, C.params(10, 0.3, 0.7)) === null, "H0 below the slider");

/* Gly uses the desk’s light-year rounding, not a second definition. */
assert(near(C.glyFromMpc(1000), C.LY_PER_PC, 0), "1000 Mpc in Gly");

/* Presets point at the cited redshifts. */
assert(C.objectById("3c273").z === C.Z_3C273, "3C 273 preset");
assert(C.objectById("gnz11").z === C.Z_GNZ11, "GN-z11 preset");
assert(C.objectById("cmb").z === C.Z_STAR, "CMB preset");
assert(C.cosmologyById("planck").H0 === C.H0_PLANCK, "Planck button");
assert(C.cosmologyById("shoes").H0 === C.H0_SHOES, "SH0ES button");

var rows = C.curve(planck, 20, 41);
assert(rows && rows.length === 41 && rows[0].z === 0 && rows[40].z === 20, "chart samples");
assert(rows[40].luminosityMpc > rows[40].comovingMpc, "luminosity distance is the long one");
assert(rows[40].angularMpc < rows[20].angularMpc, "angular-diameter distance is lower at z=20 than at z=10");

console.log("ok", now.ageTodayGyr.toFixed(6), "Gyr peak z", peak.z.toFixed(4));
