/*! Cosmic distance ladder: modulus, parallax, a Cepheid PL relation,
    a Type Ia mean peak magnitude, and a low-redshift Hubble toy.
    Coefficients and preset numbers are the cited central values.
    Classroom schematic. Not a catalog and not a cosmological fit. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DistanceLadder = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* IAU 2012: the parsec is (648000/π) AU. The light-year count used on the
     magnitude desk is the four-decimal rounding 3.2616. This desk matches it
     so a typed light-year agrees with that page. */
  var LY_PER_PC = 3.2616;
  var PC_PER_MPC = 1e6;

  /* Defined SI speed of light, km/s. Same c as the redshift desk. */
  var C_KM_S = 299792.458;

  /* Planck Collaboration 2020, A&A 641, A6, abstract: base-ΛCDM
     H0 = (67.4 ± 0.5) km s−1 Mpc−1. */
  var H0_PLANCK = 67.4;
  var H0_PLANCK_ERR = 0.5;

  /* Riess et al. 2022, ApJL 934, L7: baseline H0 = 73.04 ± 1.04. */
  var H0_SHOES = 73.04;
  var H0_SHOES_ERR = 1.04;

  /* Benedict et al. 2007, AJ 133, 1810, Table 12, column B07.
     M = a + b (log10 P − 1). Johnson V. Zero-point at log P = 1.
     Absorption and Lutz–Kelker–Hanson corrected absolute magnitudes. */
  var CEP_A = -4.05;
  var CEP_A_ERR = 0.02;
  var CEP_B = -2.43;
  var CEP_B_ERR = 0.12;

  /* Printed log P ends of that ten-star sample.
     FF Aql: log P = 0.6504 in the text of section 6.1.
     ℓ Car: Table 2, log P = 1.5509. */
  var CEP_LOGP_LO = 0.6504;
  var CEP_LOGP_HI = 1.5509;

  /* Section 6.1: standard deviation of the V residuals is 0.10 mag. */
  var CEP_SCATTER_MAG = 0.10;

  /* Richardson et al. 2014, AJ 147, 118, Table 1.
     Bias-corrected normal Type Ia mean, B band. */
  var SN_MB = -19.25;
  var SN_MB_ERR = 0.20;
  var SN_SIGMA = 0.50;

  /* NASA Sun Fact Sheet absolute visual magnitude. The 10 pc button. */
  var SUN_MV = 4.83;

  /* NASA Hubble caption: Proxima at 1.3 parsecs. Ladder sketch only. */
  var PROXIMA_PC = 1.3;

  /* Scolnic & Vincenzi, arXiv:2311.16830: HST Cepheids limited to ∼40 Mpc.
     Hubble flow ∼100 to 600 Mpc. The tildes are theirs. */
  var CEPHEID_REACH_MPC = 40;
  var HUBBLE_FLOW_LO_MPC = 100;
  var HUBBLE_FLOW_HI_MPC = 600;

  /* Sketch edge for “a few hundred light-years”, drawn at 100 pc.
     100 pc × 3.2616 = 326.16 ly. NASA does not print 100 pc. */
  var PARALLAX_SKETCH_PC = 100;

  /* Richmond & Smith 2012 adopt (m−M) = 29.10 ± 0.15 for M101.
     Their rough average. Not this desk’s candle distance. */
  var M101_MU = 29.10;
  var M101_MU_ERR = 0.15;

  /* Benedict et al. 2007, Table 11, δ Cep row. Includes LKH. */
  var DELTA_CEP_MV = -3.47;
  var DELTA_CEP_MV_ERR = 0.11;
  var DELTA_CEP_MU = 7.19;
  var DELTA_CEP_LKH = -0.01;

  var D_MIN_PC = 0.1;
  var D_MAX_PC = 2e9;
  var P_MIN_DAY = 2;
  var P_MAX_DAY = 60;
  var CZ_MIN = 200;
  var CZ_MAX = 30000;

  var PRESETS = [
    {
      id: "sun-10pc",
      rung: "modulus",
      name: "Sun at 10 pc",
      short: "Sun 10 pc",
      tier: "Definition · absolute magnitude",
      m: SUN_MV,
      M: SUN_MV,
      A: 0,
      dPc: 10
    },
    {
      id: "sirius",
      rung: "parallax",
      name: "Sirius",
      short: "Sirius",
      tier: "Parallax · ESA worked example",
      pArcsec: 0.37921,
      sigmaArcsec: null
    },
    {
      id: "delta-cep-plx",
      rung: "parallax",
      name: "δ Cephei",
      short: "δ Cep π",
      tier: "Parallax · HST Fine Guidance Sensor",
      pMas: 3.66,
      sigmaMas: 0.15
    },
    {
      id: "delta-cep",
      rung: "cepheid",
      name: "δ Cephei",
      short: "δ Cep",
      tier: "Cepheid · Benedict et al. 2007",
      periodDays: 5.36627,
      logPPrinted: 0.7297,
      vMean: 3.960,
      aV: 0.23
    },
    {
      id: "sn2011fe",
      rung: "sn",
      name: "SN 2011fe",
      short: "SN 2011fe",
      tier: "Type Ia · M101",
      bPeak: 10.00,
      bErr: 0.02,
      aB: 0.11,
      aBErr: 0.03
    },
    {
      id: "coma",
      rung: "hubble",
      name: "Coma cluster",
      short: "Coma",
      tier: "Hubble flow · low z, approximate",
      cz: 6853,
      sigmaCz: 1082
    }
  ];

  function ladder() {
    return [
      {
        id: "parallax",
        name: "Parallax",
        loPc: PROXIMA_PC,
        hiPc: PARALLAX_SKETCH_PC,
        sketch: true
      },
      {
        id: "cepheid",
        name: "Cepheid",
        loPc: 1000 / 3.66,
        hiPc: CEPHEID_REACH_MPC * PC_PER_MPC,
        sketch: true
      },
      {
        id: "sn",
        name: "Type Ia",
        loPc: distancePc(0, -M101_MU, 0),
        hiPc: HUBBLE_FLOW_HI_MPC * PC_PER_MPC,
        sketch: true
      },
      {
        id: "hubble",
        name: "Hubble flow",
        loPc: HUBBLE_FLOW_LO_MPC * PC_PER_MPC,
        hiPc: HUBBLE_FLOW_HI_MPC * PC_PER_MPC,
        sketch: true
      }
    ];
  }

  function presets() {
    return PRESETS.map(function (p) {
      var copy = {};
      var k;
      for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) copy[k] = p[k];
      return copy;
    });
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return presets()[i];
    }
    return null;
  }

  function distanceModulus(dPc) {
    if (!(dPc > 0)) return NaN;
    return 5 * Math.log10(dPc / 10);
  }

  /* m − M = 5 log10(d / 10 pc) + A. A is extinction in the same band. */
  function modulusObserved(dPc, A) {
    if (!isFinite(A)) return NaN;
    return distanceModulus(dPc) + A;
  }

  function distancePc(m, M, A) {
    if (!isFinite(m) || !isFinite(M) || !isFinite(A)) return NaN;
    return 10 * Math.pow(10, (m - M - A) / 5);
  }

  function apparentMag(M, dPc, A) {
    if (!isFinite(M) || !isFinite(A)) return NaN;
    return M + modulusObserved(dPc, A);
  }

  function absoluteMag(m, dPc, A) {
    if (!isFinite(m) || !isFinite(A)) return NaN;
    return m - modulusObserved(dPc, A);
  }

  function lyFromPc(dPc) {
    return dPc * LY_PER_PC;
  }

  function pcFromLy(ly) {
    return ly / LY_PER_PC;
  }

  function mpcFromPc(dPc) {
    return dPc / PC_PER_MPC;
  }

  function pcFromMpc(mpc) {
    return mpc * PC_PER_MPC;
  }

  function pcFromParallaxArcsec(pArcsec) {
    if (!(pArcsec > 0)) return NaN;
    return 1 / pArcsec;
  }

  function parallaxArcsecFromPc(dPc) {
    if (!(dPc > 0)) return NaN;
    return 1 / dPc;
  }

  /* d = 1/p. Linear: σ_d / d = σ_p / p.
     The inverted bounds 1/(p±σ) are asymmetric, and the far bound
     is unbounded when σ ≥ p. sigma null means no uncertainty was cited. */
  function parallaxError(pArcsec, sigmaArcsec) {
    if (!(pArcsec > 0)) return null;
    var d = 1 / pArcsec;
    if (sigmaArcsec == null) {
      return {
        dPc: d,
        hasSigma: false,
        fraction: NaN,
        dNearPc: NaN,
        dFarPc: NaN,
        linearSigmaPc: NaN,
        unbounded: false
      };
    }
    if (!(sigmaArcsec >= 0) || !isFinite(sigmaArcsec)) return null;
    var fraction = sigmaArcsec / pArcsec;
    var unbounded = !(pArcsec > sigmaArcsec);
    return {
      dPc: d,
      hasSigma: true,
      fraction: fraction,
      dNearPc: 1 / (pArcsec + sigmaArcsec),
      dFarPc: unbounded ? Infinity : 1 / (pArcsec - sigmaArcsec),
      linearSigmaPc: d * fraction,
      unbounded: unbounded
    };
  }

  function cepheidMV(periodDays) {
    if (!(periodDays > 0)) return NaN;
    return CEP_A + CEP_B * (Math.log10(periodDays) - 1);
  }

  function cepheidInSample(periodDays) {
    if (!(periodDays > 0)) return false;
    var logP = Math.log10(periodDays);
    return logP + 1e-12 >= CEP_LOGP_LO && logP - 1e-12 <= CEP_LOGP_HI;
  }

  /* A magnitude offset δm changes distance by 10^(δm/5).
     The small-offset fractional shift is ln(10)/5 × |δm|. */
  function distanceFactorFromMag(deltaMag) {
    if (!isFinite(deltaMag)) return NaN;
    return Math.pow(10, deltaMag / 5);
  }

  function fractionalDistanceFromMag(deltaMag) {
    if (!isFinite(deltaMag)) return NaN;
    return (Math.LN10 / 5) * Math.abs(deltaMag);
  }

  function hubbleMpc(czKmS, h0) {
    if (!(czKmS > 0) || !(h0 > 0)) return NaN;
    return czKmS / h0;
  }

  function zFromCz(czKmS) {
    if (!isFinite(czKmS)) return NaN;
    return czKmS / C_KM_S;
  }

  function m101Pc() {
    return distancePc(0, -M101_MU, 0);
  }

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻"
  };

  function superscript(exp) {
    return String(exp).split("").map(function (ch) { return SUP[ch] || ch; }).join("");
  }

  function trimFixed(n, digits) {
    var s = Math.abs(n).toFixed(digits);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s || "0";
  }

  function groupInt(s) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function signOf(n) {
    return n < 0 ? "−" : "";
  }

  function sci(abs) {
    var exp = Math.floor(Math.log10(abs));
    var mant = abs / Math.pow(10, exp);
    if (mant >= 9.9995) {
      mant = 1;
      exp += 1;
    }
    return trimFixed(mant, 3) + " × 10" + superscript(exp);
  }

  function formatPlain(n, digits) {
    if (!isFinite(n)) return "—";
    var abs = Math.abs(n);
    if (abs !== 0 && (abs >= 10000 || abs < 0.001)) return signOf(n) + sci(abs);
    var d = digits == null ? (abs >= 100 ? 2 : 4) : digits;
    var body = trimFixed(n, d);
    var parts = body.split(".");
    parts[0] = groupInt(parts[0]);
    return signOf(n) + parts.join(".");
  }

  function formatMag(n) {
    if (!isFinite(n)) return "—";
    if (n > 0) return "+" + trimFixed(n, 3);
    if (n < 0) return "−" + trimFixed(Math.abs(n), 3);
    return "0";
  }

  function formatPc(dPc) {
    if (!(dPc > 0) || !isFinite(dPc)) return "—";
    return formatPlain(dPc) + " pc";
  }

  function formatLy(dPc) {
    if (!(dPc > 0) || !isFinite(dPc)) return "—";
    return formatPlain(lyFromPc(dPc)) + " ly";
  }

  function formatMpc(dPc) {
    if (!(dPc > 0) || !isFinite(dPc)) return "—";
    return formatPlain(mpcFromPc(dPc)) + " Mpc";
  }

  function formatLead(dPc) {
    if (!(dPc > 0) || !isFinite(dPc)) return "—";
    if (dPc >= 1e6) return formatMpc(dPc);
    if (dPc >= 1000) return formatPc(dPc);
    return formatPc(dPc) + " · " + formatLy(dPc);
  }

  function formatInput(n) {
    if (!isFinite(n)) return "";
    var abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e6 || abs < 1e-4)) {
      var exp = Math.floor(Math.log10(abs));
      var mant = abs / Math.pow(10, exp);
      if (mant >= 9.9995) {
        mant = 1;
        exp += 1;
      }
      return (n < 0 ? "-" : "") + trimFixed(mant, 6) + "e" + exp;
    }
    return (n < 0 ? "-" : "") + trimFixed(n, 6);
  }

  function logMap(t, min, max) {
    var u = Math.min(1, Math.max(0, t));
    return min * Math.pow(max / min, u);
  }

  function logUnmap(value, min, max) {
    if (!(value > 0) || !(min > 0) || !(max > min)) return 0;
    var t = Math.log(value / min) / Math.log(max / min);
    if (t < 0) return 0;
    if (t > 1) return 1;
    return t;
  }

  function axisFrac(dPc, loPc, hiPc) {
    if (!(dPc > 0)) return NaN;
    var a = Math.log10(loPc);
    var b = Math.log10(hiPc);
    return (Math.log10(dPc) - a) / (b - a);
  }

  return {
    LY_PER_PC: LY_PER_PC,
    PC_PER_MPC: PC_PER_MPC,
    C_KM_S: C_KM_S,
    H0_PLANCK: H0_PLANCK,
    H0_PLANCK_ERR: H0_PLANCK_ERR,
    H0_SHOES: H0_SHOES,
    H0_SHOES_ERR: H0_SHOES_ERR,
    CEP_A: CEP_A,
    CEP_A_ERR: CEP_A_ERR,
    CEP_B: CEP_B,
    CEP_B_ERR: CEP_B_ERR,
    CEP_LOGP_LO: CEP_LOGP_LO,
    CEP_LOGP_HI: CEP_LOGP_HI,
    CEP_SCATTER_MAG: CEP_SCATTER_MAG,
    SN_MB: SN_MB,
    SN_MB_ERR: SN_MB_ERR,
    SN_SIGMA: SN_SIGMA,
    SUN_MV: SUN_MV,
    PROXIMA_PC: PROXIMA_PC,
    CEPHEID_REACH_MPC: CEPHEID_REACH_MPC,
    HUBBLE_FLOW_LO_MPC: HUBBLE_FLOW_LO_MPC,
    HUBBLE_FLOW_HI_MPC: HUBBLE_FLOW_HI_MPC,
    PARALLAX_SKETCH_PC: PARALLAX_SKETCH_PC,
    M101_MU: M101_MU,
    M101_MU_ERR: M101_MU_ERR,
    DELTA_CEP_MV: DELTA_CEP_MV,
    DELTA_CEP_MV_ERR: DELTA_CEP_MV_ERR,
    DELTA_CEP_MU: DELTA_CEP_MU,
    DELTA_CEP_LKH: DELTA_CEP_LKH,
    D_MIN_PC: D_MIN_PC,
    D_MAX_PC: D_MAX_PC,
    P_MIN_DAY: P_MIN_DAY,
    P_MAX_DAY: P_MAX_DAY,
    CZ_MIN: CZ_MIN,
    CZ_MAX: CZ_MAX,
    ladder: ladder,
    presets: presets,
    presetById: presetById,
    distanceModulus: distanceModulus,
    modulusObserved: modulusObserved,
    distancePc: distancePc,
    apparentMag: apparentMag,
    absoluteMag: absoluteMag,
    lyFromPc: lyFromPc,
    pcFromLy: pcFromLy,
    mpcFromPc: mpcFromPc,
    pcFromMpc: pcFromMpc,
    pcFromParallaxArcsec: pcFromParallaxArcsec,
    parallaxArcsecFromPc: parallaxArcsecFromPc,
    parallaxError: parallaxError,
    cepheidMV: cepheidMV,
    cepheidInSample: cepheidInSample,
    distanceFactorFromMag: distanceFactorFromMag,
    fractionalDistanceFromMag: fractionalDistanceFromMag,
    hubbleMpc: hubbleMpc,
    zFromCz: zFromCz,
    m101Pc: m101Pc,
    formatPlain: formatPlain,
    formatMag: formatMag,
    formatPc: formatPc,
    formatLy: formatLy,
    formatMpc: formatMpc,
    formatLead: formatLead,
    formatInput: formatInput,
    logMap: logMap,
    logUnmap: logUnmap,
    axisFrac: axisFrac
  };
});
