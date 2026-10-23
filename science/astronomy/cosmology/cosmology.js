/*! Cosmological ages and distances from a numerical integral of the
    Friedmann equation. Radiation is omitted, as in Hogg 1999 eq. 14.
    Parameter presets are published central values. Classroom calculator.
    Not a fit and not a catalog distance. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Cosmology = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Defined SI speed of light. Same c as the redshift and distance-ladder desks.
     NIST CODATA: 299792458 m/s exactly. */
  var C_KM_S = 299792.458;

  /* IAU 2012 Resolution B2. The astronomical unit is exact.
     The parsec is (648000/π) AU. The light-year count on the magnitude
     and distance-ladder desks is the four-decimal rounding 3.2616.
     Gly on this page uses that same rounding. Gyr uses the parsec and
     the Julian year (365.25 days of 86400 s), not the 3.2616 rounding. */
  var AU_M = 149597870700;
  var PC_M = (648000 / Math.PI) * AU_M;
  var MPC_KM = PC_M * 1e6 / 1000;
  var JULIAN_YEAR_S = 365.25 * 86400;
  var GYR_S = 1e9 * JULIAN_YEAR_S;
  var LY_PER_PC = 3.2616;

  /* 1 arcsec in radians. kpc per arcsec = D_A(Mpc) × 1000 × this. */
  var ARCSEC_RAD = Math.PI / (180 * 3600);

  /* Planck Collaboration 2020, A&A 641, A6, Table 2.
     Column TT,TE,EE+lowE+lensing, 68% limits. Central values only.
     The abstract rounds H0 to 67.4 ± 0.5 and Ωm to 0.315 ± 0.007.
     This desk uses the table. The redshift and distance-ladder desks
     use the abstract’s 67.4. */
  var H0_PLANCK = 67.36;
  var H0_PLANCK_ERR = 0.54;
  var OMEGA_M_PLANCK = 0.3153;
  var OMEGA_M_PLANCK_ERR = 0.0073;
  var OMEGA_L_PLANCK = 0.6847;
  var OMEGA_L_PLANCK_ERR = 0.0073;
  /* Published age in that column, radiation included. Not this integral. */
  var AGE_PLANCK_GYR = 13.797;
  var AGE_PLANCK_ERR = 0.023;
  /* Same column: redshift of last scattering. */
  var Z_STAR = 1089.92;
  var Z_STAR_ERR = 0.25;

  /* Riess et al. 2022, ApJL 934, L7. Baseline SH0ES H0.
     That paper does not publish Ωm or ΩΛ for this button. */
  var H0_SHOES = 73.04;
  var H0_SHOES_ERR = 1.04;

  /* Colless and Dunn 1996, ApJ 458, 435. Main Coma cluster, NGC 4874.
     z on this desk is the non-relativistic cz/c, the same reading as
     the redshift desk. The paper prints cz, not a cosmological z. */
  var COMA_CZ = 6853;
  var COMA_SIGMA_CZ = 1082;

  /* SIMBAD adopted redshift for 3C 273, referenced to Koss et al. 2022.
     Same figure as the redshift desk. */
  var Z_3C273 = 0.15756751;

  /* Bunker et al. 2023. GN-z11 systemic redshift. Same figure as the
     redshift desk. The Lyman-alpha offset is not added. */
  var Z_GNZ11 = 10.6034;
  var Z_GNZ11_ERR = 0.0013;

  var Z_MIN = 0;
  var Z_SLIDER_MAX = 20;
  var Z_FIELD_MAX = 2000;
  var Z_PIVOT = 1;
  var H0_MIN = 20;
  var H0_MAX = 120;
  var OM_MIN = 0.01;
  var OM_MAX = 1.5;
  var OL_MIN = -0.5;
  var OL_MAX = 1.5;

  /* |Ωk| below this uses the flat transverse-distance formula.
     The Planck central values sum to 1 at the quoted digits. */
  var FLAT_EPS = 1e-8;

  var COSMOLOGIES = [
    {
      id: "planck",
      name: "Planck 2018",
      short: "Planck 2018",
      H0: H0_PLANCK,
      omegaM: OMEGA_M_PLANCK,
      omegaL: OMEGA_L_PLANCK,
      flat: true
    },
    {
      id: "shoes",
      name: "SH0ES H0",
      short: "SH0ES 73.04",
      H0: H0_SHOES,
      omegaM: OMEGA_M_PLANCK,
      omegaL: OMEGA_L_PLANCK,
      flat: true
    }
  ];

  var OBJECTS = [
    {
      id: "coma",
      name: "Coma cluster",
      short: "Coma",
      tier: "Nearby cluster · cz/c",
      z: COMA_CZ / C_KM_S
    },
    {
      id: "3c273",
      name: "3C 273",
      short: "3C 273",
      tier: "Quasar",
      z: Z_3C273
    },
    {
      id: "gnz11",
      name: "GN-z11",
      short: "GN-z11",
      tier: "High redshift · JWST",
      z: Z_GNZ11
    },
    {
      id: "cmb",
      name: "CMB last scattering",
      short: "CMB",
      tier: "Last scattering · Planck z*",
      z: Z_STAR
    }
  ];

  function cosmologies() {
    return COSMOLOGIES.map(copy);
  }

  function cosmologyById(id) {
    var i;
    for (i = 0; i < COSMOLOGIES.length; i++) {
      if (COSMOLOGIES[i].id === id) return copy(COSMOLOGIES[i]);
    }
    return null;
  }

  function objects() {
    return OBJECTS.map(copy);
  }

  function objectById(id) {
    var i;
    for (i = 0; i < OBJECTS.length; i++) {
      if (OBJECTS[i].id === id) return copy(OBJECTS[i]);
    }
    return null;
  }

  function copy(src) {
    var out = {};
    var k;
    for (k in src) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
    return out;
  }

  function params(H0, omegaM, omegaL) {
    return { H0: H0, omegaM: omegaM, omegaL: omegaL };
  }

  function planckParams() {
    return params(H0_PLANCK, OMEGA_M_PLANCK, OMEGA_L_PLANCK);
  }

  function shoesParams() {
    return params(H0_SHOES, OMEGA_M_PLANCK, OMEGA_L_PLANCK);
  }

  function omegaK(p) {
    return 1 - p.omegaM - p.omegaL;
  }

  function paramsOk(p) {
    return !!p &&
      isFinite(p.H0) && p.H0 >= H0_MIN && p.H0 <= H0_MAX &&
      isFinite(p.omegaM) && p.omegaM >= OM_MIN && p.omegaM <= OM_MAX &&
      isFinite(p.omegaL) && p.omegaL >= OL_MIN && p.omegaL <= OL_MAX;
  }

  function zOk(z) {
    return isFinite(z) && z >= Z_MIN && z <= Z_FIELD_MAX;
  }

  /* Slider u in [0, 1] ↔ z in [0, 20]. asinh packs more steps at small z. */
  function zFromUnit(u) {
    var t = Math.min(1, Math.max(0, u));
    if (t === 0) return 0;
    if (t === 1) return Z_SLIDER_MAX;
    return Z_PIVOT * Math.sinh(t * Math.asinh(Z_SLIDER_MAX / Z_PIVOT));
  }

  function unitFromZ(z) {
    if (!(z > 0)) return 0;
    var capped = Math.min(z, Z_SLIDER_MAX);
    return Math.asinh(capped / Z_PIVOT) / Math.asinh(Z_SLIDER_MAX / Z_PIVOT);
  }

  function hubbleTimeGyr(H0) {
    return (MPC_KM / H0) / GYR_S;
  }

  function hubbleDistanceMpc(H0) {
    return C_KM_S / H0;
  }

  function glyFromMpc(mpc) {
    return mpc * LY_PER_PC / 1000;
  }

  function kpcPerArcsec(angularMpc) {
    return angularMpc * 1000 * ARCSEC_RAD;
  }

  /* ∫ dz/E , substituted as x = ln(1+z).
     integrand = 1 / sqrt(Ωm e^x + Ωk + ΩΛ e^{−2x}). */
  function chiIntegrand(x, p) {
    var ex = Math.exp(x);
    var inside = p.omegaM * ex + omegaK(p) + p.omegaL / (ex * ex);
    if (!(inside > 0)) return NaN;
    return 1 / Math.sqrt(inside);
  }

  /* Age in units of 1/H0. s = 1/sqrt(1+z) runs from 0 at the Big Bang
     to 1 today. The integrand is smooth at s = 0 when Ωm > 0. */
  function ageIntegrand(s, p) {
    if (s === 0) return 0;
    var s2 = s * s;
    var inside = p.omegaM + omegaK(p) * s2 + p.omegaL * s2 * s2 * s2;
    if (!(inside > 0)) return NaN;
    return (2 * s2) / Math.sqrt(inside);
  }

  function romberg(f, a, b, level) {
    if (!(b > a)) return 0;
    var k, j, i, n, h, sum, y, factor;
    n = 1;
    h = b - a;
    var R0 = 0.5 * h * (f(a) + f(b));
    if (!isFinite(R0)) return NaN;
    var prev = [R0];
    var curr;
    for (k = 1; k <= level; k++) {
      h *= 0.5;
      sum = 0;
      for (i = 1; i <= n; i++) {
        y = f(a + (2 * i - 1) * h);
        if (!isFinite(y)) return NaN;
        sum += y;
      }
      curr = new Array(k + 1);
      curr[0] = 0.5 * prev[0] + sum * h;
      factor = 1;
      for (j = 1; j <= k; j++) {
        factor *= 4;
        curr[j] = (factor * curr[j - 1] - prev[j - 1]) / (factor - 1);
      }
      prev = curr;
      n *= 2;
    }
    return prev[prev.length - 1];
  }

  function chiOfZ(z, p) {
    if (z === 0) return 0;
    return romberg(function (x) { return chiIntegrand(x, p); }, 0, Math.log(1 + z), 10);
  }

  function ageHubble(z, p) {
    var sMax = 1 / Math.sqrt(1 + z);
    return romberg(function (s) { return ageIntegrand(s, p); }, 0, sMax, 10);
  }

  function transverseOverDH(chi, ok) {
    if (Math.abs(ok) < FLAT_EPS) return chi;
    var s = Math.sqrt(Math.abs(ok));
    var x = s * chi;
    if (ok > 0) return Math.sinh(x) / s;
    return Math.sin(x) / s;
  }

  function measures(z, p) {
    if (!zOk(z) || !paramsOk(p)) return null;
    var dh = hubbleDistanceMpc(p.H0);
    var th = hubbleTimeGyr(p.H0);
    var ok = omegaK(p);
    var chi = chiOfZ(z, p);
    var age0 = ageHubble(0, p);
    var ageZ = z === 0 ? age0 : ageHubble(z, p);
    if (!isFinite(chi) || !isFinite(age0) || !isFinite(ageZ)) return null;
    var dmOverDH = transverseOverDH(chi, ok);
    if (!isFinite(dmOverDH)) return null;
    var pastAntipode = dmOverDH < 0;
    var dc = dh * chi;
    var dm = dh * dmOverDH;
    var dl = (1 + z) * dm;
    var da = dm / (1 + z);
    /* z = 0 is the observer. Every distance on the card is zero there. */
    if (z === 0) {
      dc = 0;
      dm = 0;
      dl = 0;
      da = 0;
    }
    var lookback = age0 - ageZ;
    if (lookback < 0 && lookback > -1e-9) lookback = 0;
    return {
      z: z,
      H0: p.H0,
      omegaM: p.omegaM,
      omegaL: p.omegaL,
      omegaK: ok,
      flat: Math.abs(ok) < FLAT_EPS,
      pastAntipode: pastAntipode,
      hubbleTimeGyr: th,
      hubbleDistanceMpc: dh,
      ageTodayGyr: th * age0,
      ageAtZGyr: th * ageZ,
      lookbackGyr: th * lookback,
      comovingMpc: dc,
      transverseMpc: dm,
      luminosityMpc: dl,
      angularMpc: da,
      comovingGly: glyFromMpc(dc),
      transverseGly: glyFromMpc(dm),
      luminosityGly: glyFromMpc(dl),
      angularGly: glyFromMpc(da),
      kpcPerArcsec: kpcPerArcsec(da),
      czOverH0Mpc: z * dh,
      chi: chi
    };
  }

  function curve(p, zMax, n) {
    if (!paramsOk(p)) return null;
    var count = n || 81;
    var hi = zMax > 0 ? zMax : Z_SLIDER_MAX;
    var rows = [];
    var i;
    for (i = 0; i < count; i++) {
      var z = (hi * i) / (count - 1);
      var row = measures(z, p);
      if (!row) return null;
      rows.push({
        z: z,
        comovingMpc: row.comovingMpc,
        luminosityMpc: row.luminosityMpc,
        angularMpc: row.angularMpc
      });
    }
    return rows;
  }

  /* Peak of D_A on (0, zHi]. A standard flat ΛCDM peaks inside that window. */
  function angularPeak(p, zHi) {
    if (!paramsOk(p)) return null;
    var hi = zHi && zHi > 0.5 ? zHi : 8;
    var bestZ = 0;
    var bestDa = -1;
    var steps = 240;
    var i;
    for (i = 1; i <= steps; i++) {
      var z = (hi * i) / steps;
      var row = measures(z, p);
      if (!row || row.pastAntipode) continue;
      if (row.angularMpc > bestDa) {
        bestDa = row.angularMpc;
        bestZ = z;
      }
    }
    if (!(bestZ > 0)) return null;
    var lo = Math.max(0.01, bestZ - hi / steps);
    var top = Math.min(hi, bestZ + hi / steps);
    var gr = (Math.sqrt(5) - 1) / 2;
    var a = lo;
    var b = top;
    var c = b - gr * (b - a);
    var d = a + gr * (b - a);
    function da(z) {
      var row = measures(z, p);
      return row && !row.pastAntipode ? row.angularMpc : -Infinity;
    }
    var i2;
    for (i2 = 0; i2 < 40; i2++) {
      if (da(c) > da(d)) b = d;
      else a = c;
      c = b - gr * (b - a);
      d = a + gr * (b - a);
    }
    var zPeak = 0.5 * (a + b);
    var at = measures(zPeak, p);
    if (!at) return null;
    return {
      z: zPeak,
      angularMpc: at.angularMpc,
      kpcPerArcsec: at.kpcPerArcsec,
      atEdge: zPeak < 0.05 || zPeak > hi - 0.05
    };
  }

  /* Flat ΛCDM, no radiation. t0 = (2/3) t_H arcsinh(sqrt(ΩΛ/Ωm)) / sqrt(ΩΛ).
     ΩΛ = 1 − Ωm. Used to check the integrator. */
  function flatLambdaAgeGyr(H0, omegaM) {
    var ol = 1 - omegaM;
    if (!(omegaM > 0) || !(ol > 0)) return NaN;
    return hubbleTimeGyr(H0) * (2 / 3) * Math.asinh(Math.sqrt(ol / omegaM)) / Math.sqrt(ol);
  }

  /* Einstein–de Sitter. D_C = (c/H0) · 2 (1 − 1/sqrt(1+z)). Age = (2/3)/H0. */
  function edsComovingMpc(z, H0) {
    return hubbleDistanceMpc(H0) * 2 * (1 - 1 / Math.sqrt(1 + z));
  }

  function edsAgeGyr(H0) {
    return hubbleTimeGyr(H0) * (2 / 3);
  }

  /* Empty open universe, Milne: Ωm = 0 is outside the slider, but the
     transverse formula is tested with a direct call. D_C = D_H ln(1+z),
     D_M = D_H sinh(ln(1+z)). */
  function milneComovingMpc(z, H0) {
    return hubbleDistanceMpc(H0) * Math.log(1 + z);
  }

  function milneTransverseMpc(z, H0) {
    var chi = Math.log(1 + z);
    return hubbleDistanceMpc(H0) * Math.sinh(chi);
  }

  return {
    C_KM_S: C_KM_S,
    LY_PER_PC: LY_PER_PC,
    AU_M: AU_M,
    ARCSEC_RAD: ARCSEC_RAD,
    H0_PLANCK: H0_PLANCK,
    H0_PLANCK_ERR: H0_PLANCK_ERR,
    OMEGA_M_PLANCK: OMEGA_M_PLANCK,
    OMEGA_M_PLANCK_ERR: OMEGA_M_PLANCK_ERR,
    OMEGA_L_PLANCK: OMEGA_L_PLANCK,
    OMEGA_L_PLANCK_ERR: OMEGA_L_PLANCK_ERR,
    AGE_PLANCK_GYR: AGE_PLANCK_GYR,
    AGE_PLANCK_ERR: AGE_PLANCK_ERR,
    Z_STAR: Z_STAR,
    Z_STAR_ERR: Z_STAR_ERR,
    H0_SHOES: H0_SHOES,
    H0_SHOES_ERR: H0_SHOES_ERR,
    COMA_CZ: COMA_CZ,
    COMA_SIGMA_CZ: COMA_SIGMA_CZ,
    Z_3C273: Z_3C273,
    Z_GNZ11: Z_GNZ11,
    Z_GNZ11_ERR: Z_GNZ11_ERR,
    Z_MIN: Z_MIN,
    Z_SLIDER_MAX: Z_SLIDER_MAX,
    Z_FIELD_MAX: Z_FIELD_MAX,
    Z_PIVOT: Z_PIVOT,
    H0_MIN: H0_MIN,
    H0_MAX: H0_MAX,
    OM_MIN: OM_MIN,
    OM_MAX: OM_MAX,
    OL_MIN: OL_MIN,
    OL_MAX: OL_MAX,
    cosmologies: cosmologies,
    cosmologyById: cosmologyById,
    objects: objects,
    objectById: objectById,
    params: params,
    planckParams: planckParams,
    shoesParams: shoesParams,
    omegaK: omegaK,
    paramsOk: paramsOk,
    zOk: zOk,
    zFromUnit: zFromUnit,
    unitFromZ: unitFromZ,
    hubbleTimeGyr: hubbleTimeGyr,
    hubbleDistanceMpc: hubbleDistanceMpc,
    glyFromMpc: glyFromMpc,
    kpcPerArcsec: kpcPerArcsec,
    measures: measures,
    curve: curve,
    angularPeak: angularPeak,
    flatLambdaAgeGyr: flatLambdaAgeGyr,
    edsComovingMpc: edsComovingMpc,
    edsAgeGyr: edsAgeGyr,
    milneComovingMpc: milneComovingMpc,
    milneTransverseMpc: milneTransverseMpc
  };
});
