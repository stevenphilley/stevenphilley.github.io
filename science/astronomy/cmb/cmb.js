/*! Cosmic microwave background: a blackbody at Fixsen's T0, stretched by
    redshift, plus the kinematic dipole. h, c, and k are the exact SI
    values CODATA 2018 lists. Every other number on the page is computed
    from those constants, from T0, from Planck 2018 z*, or from the
    Planck 2018 dipole amplitude. Classroom calculator. Not a map. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Cmb = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* CODATA 2018, exact since the 2019 SI revision.
     Tiesinga, Mohr, Newell, and Taylor, Rev. Mod. Phys. 93, 025010 (2021). */
  var H = 6.62607015e-34;
  var C = 299792458;
  var K = 1.380649e-23;

  /* Fixsen 2009, ApJ 707, 916. Central value of the combined determination.
     The quoted uncertainty is ±0.00057 K. This desk uses the center. */
  var T0 = 2.72548;
  var T0_ERR = 0.00057;

  /* Planck Collaboration 2020, A&A 641, A6, Table 2,
     column TT,TE,EE+lowE+lensing. Redshift of last scattering. */
  var Z_STAR = 1089.92;
  var Z_STAR_ERR = 0.25;

  /* Planck Collaboration 2020, A&A 641, A1, Table 2.
     Planck 2018 row, which adopts the HFI 2018 amplitude. */
  var DIPOLE_UK = 3362.08;
  var DIPOLE_UK_ERR = 0.99;

  /* NASA Imagine classroom bands, the same edges as the EM-spectrum desk.
     Conventions, not walls. Wavelength column and frequency column are
     each applied to their own peak. */
  var LAM_GAMMA = 0.01e-9;
  var LAM_XRAY = 10e-9;
  var LAM_UV = 400e-9;
  var LAM_VIS = 700e-9;
  var LAM_IR = 1e-3;
  var LAM_MICRO = 0.1;
  var F_RADIO = 3e9;
  var F_MICRO = 300e9;
  var F_IR = 400e12;
  var F_VIS = 750e12;
  var F_UV = 30e15;
  var F_XRAY = 30e18;

  var T_MIN = 0.5;
  var T_MAX = 10000;
  var Z_MIN = 0;
  var V_MIN_KMS = 0;
  var V_MAX_KMS = 1000;

  var zetaCache = 0;
  var xLambdaCache = 0;
  var xFreqCache = 0;

  function displacementRoot(order) {
    /* (order − x) e^x = order. Order 5 is B_λ. Order 3 is B_ν. */
    var x = order;
    var i;
    for (i = 0; i < 30; i++) {
      var ex = Math.exp(x);
      var f = (order - x) * ex - order;
      var fp = (order - 1 - x) * ex;
      var dx = f / fp;
      x -= dx;
      if (Math.abs(dx) < 1e-15) break;
    }
    return x;
  }

  function wienXLambda() {
    if (!xLambdaCache) xLambdaCache = displacementRoot(5);
    return xLambdaCache;
  }

  function wienXFreq() {
    if (!xFreqCache) xFreqCache = displacementRoot(3);
    return xFreqCache;
  }

  function zeta3() {
    if (zetaCache) return zetaCache;
    var N = 100000;
    var s = 0;
    var n;
    for (n = 1; n <= N; n++) s += 1 / (n * n * n);
    /* Euler–Maclaurin tail: ∫_N^∞ x^−3 dx + (1/2) N^−3. */
    s += 1 / (2 * N * N) + 1 / (2 * N * N * N);
    zetaCache = s;
    return s;
  }

  function wienB() {
    return (H * C) / (K * wienXLambda());
  }

  function freqPerKelvin() {
    return wienXFreq() * K / H;
  }

  function sigma() {
    var pi = Math.PI;
    return (2 * Math.pow(pi, 5) * Math.pow(K, 4)) / (15 * Math.pow(H, 3) * C * C);
  }

  function radiationA() {
    return 4 * sigma() / C;
  }

  function wienLambdaM(T) {
    if (!(T > 0)) return NaN;
    return wienB() / T;
  }

  function wienFreqHz(T) {
    if (!(T > 0)) return NaN;
    return freqPerKelvin() * T;
  }

  function planckNu(nu, T) {
    if (!(nu > 0) || !(T > 0)) return NaN;
    var x = (H * nu) / (K * T);
    if (x > 700) return 0;
    return (2 * H * nu * nu * nu) / (C * C * Math.expm1(x));
  }

  function photonDensityM3(T) {
    if (!(T > 0)) return NaN;
    var kt_hc = (K * T) / (H * C);
    return 16 * Math.PI * zeta3() * kt_hc * kt_hc * kt_hc;
  }

  function energyDensity(T) {
    if (!(T > 0)) return NaN;
    return radiationA() * T * T * T * T;
  }

  function temperatureAtZ(z) {
    if (!(z >= 0) || !isFinite(z)) return NaN;
    return T0 * (1 + z);
  }

  function redshiftAtT(T) {
    if (!(T > 0) || !isFinite(T)) return NaN;
    return T / T0 - 1;
  }

  function dipoleDeltaT(vMeters) {
    if (!isFinite(vMeters)) return NaN;
    return T0 * vMeters / C;
  }

  function dipoleSpeed(deltaT) {
    if (!isFinite(deltaT)) return NaN;
    return C * deltaT / T0;
  }

  function planckDipoleKelvin() {
    return DIPOLE_UK * 1e-6;
  }

  function planckDipoleSpeed() {
    return dipoleSpeed(planckDipoleKelvin());
  }

  function zMax() {
    return T_MAX / T0 - 1;
  }

  function bandForLambda(m) {
    if (!(m > 0)) return "";
    if (m < LAM_GAMMA) return "gamma";
    if (m < LAM_XRAY) return "X-ray";
    if (m < LAM_UV) return "ultraviolet";
    if (m < LAM_VIS) return "visible";
    if (m < LAM_IR) return "infrared";
    if (m < LAM_MICRO) return "microwave";
    return "radio";
  }

  function bandForFreq(hz) {
    if (!(hz > 0)) return "";
    if (hz < F_RADIO) return "radio";
    if (hz < F_MICRO) return "microwave";
    if (hz < F_IR) return "infrared";
    if (hz < F_VIS) return "visible";
    if (hz < F_UV) return "ultraviolet";
    if (hz < F_XRAY) return "X-ray";
    return "gamma";
  }

  function presets() {
    return [
      { id: "today", z: 0, name: "Today", short: "Today" },
      { id: "z1", z: 1, name: "z = 1", short: "z = 1" },
      { id: "z6", z: 6, name: "z = 6", short: "z = 6" },
      { id: "last", z: Z_STAR, name: "Last scattering", short: "Last scattering" }
    ];
  }

  function presetById(id) {
    var list = presets();
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function logMap(u, lo, hi) {
    var t = Math.min(1, Math.max(0, u));
    return Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo)));
  }

  function logUnmap(v, lo, hi) {
    if (!(v > 0)) return 0;
    var t = (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return Math.min(1, Math.max(0, t));
  }

  function zFromUnit(u) {
    var t = Math.min(1, Math.max(0, u));
    return Math.expm1(t * Math.log1p(zMax()));
  }

  function zToUnit(z) {
    if (!(z > 0)) return 0;
    var t = Math.log1p(z) / Math.log1p(zMax());
    return Math.min(1, Math.max(0, t));
  }

  function tOk(T) {
    return T >= T_MIN && T <= T_MAX;
  }

  function zOk(z) {
    return z >= Z_MIN && z <= zMax() + 1e-9;
  }

  function vOkKms(v) {
    return v >= V_MIN_KMS && v <= V_MAX_KMS;
  }

  function trimFixed(v, digits) {
    return v.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function superscript(n) {
    var map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(n).split("").map(function (ch) { return map[ch] || ch; }).join("");
  }

  function formatSci(v, digits) {
    if (!isFinite(v)) return "—";
    var d = digits == null ? 4 : digits;
    var sign = v < 0 ? "−" : "";
    var a = Math.abs(v);
    if (a === 0) return "0";
    var exp = Math.floor(Math.log10(a));
    var man = a / Math.pow(10, exp);
    var m = man.toFixed(d);
    if (m.indexOf(".") >= 0) m = m.replace(/0+$/, "").replace(/\.$/, "");
    if (Number(m) >= 10) {
      m = (Number(m) / 10).toFixed(d).replace(/0+$/, "").replace(/\.$/, "");
      exp += 1;
    }
    return sign + m + " × 10" + superscript(exp);
  }

  function formatTemp(T) {
    if (!isFinite(T)) return "—";
    if (Math.abs(T) >= 100) return trimFixed(T, 2) + " K";
    return trimFixed(T, 5) + " K";
  }

  function formatZ(z) {
    if (!isFinite(z)) return "—";
    if (Math.abs(z - Z_STAR) < 1e-9) return "1089.92";
    if (Math.abs(z) >= 100) return trimFixed(z, 2);
    if (Math.abs(z) >= 10) return trimFixed(z, 3);
    return trimFixed(z, 4);
  }

  function formatLength(m) {
    if (!(m > 0) || !isFinite(m)) return "—";
    if (m >= 0.1) return trimFixed(m, 4) + " m";
    if (m >= 1e-3) return trimFixed(m * 1e3, 4) + " mm";
    if (m >= 1e-6) return trimFixed(m * 1e6, 3) + " µm";
    var nm = m * 1e9;
    return (nm >= 100 ? trimFixed(nm, 1) : trimFixed(nm, 2)) + " nm";
  }

  function formatFreq(hz) {
    if (!(hz > 0) || !isFinite(hz)) return "—";
    if (hz >= 1e12) return trimFixed(hz / 1e12, 3) + " THz";
    if (hz >= 1e9) return trimFixed(hz / 1e9, 3) + " GHz";
    if (hz >= 1e6) return trimFixed(hz / 1e6, 3) + " MHz";
    return trimFixed(hz, 3) + " Hz";
  }

  function formatPerCm3(nM3) {
    if (!(nM3 >= 0) || !isFinite(nM3)) return "—";
    var n = nM3 / 1e6;
    if (n >= 1e5 || (n > 0 && n < 0.01)) return formatSci(n, 4);
    if (n >= 100) return trimFixed(n, 1);
    if (n >= 10) return trimFixed(n, 2);
    if (n >= 1) return trimFixed(n, 3);
    return formatSci(n, 4);
  }

  function formatSpeedKms(mps) {
    if (!isFinite(mps)) return "—";
    var km = mps / 1000;
    if (Math.abs(km) >= 100) return trimFixed(km, 2) + " km/s";
    if (Math.abs(km) >= 10) return trimFixed(km, 3) + " km/s";
    return trimFixed(km, 4) + " km/s";
  }

  function formatMicroK(kelvin) {
    if (!isFinite(kelvin)) return "—";
    var u = kelvin * 1e6;
    var digits = Math.abs(u) >= 100 ? 2 : Math.abs(u) >= 1 ? 3 : 4;
    return trimFixed(u, digits) + " µK";
  }

  function evaluate(T) {
    var lam = wienLambdaM(T);
    var nu = wienFreqHz(T);
    return {
      T: T,
      z: redshiftAtT(T),
      lambdaM: lam,
      lambdaFreqHz: C / lam,
      freqHz: nu,
      lambdaBand: bandForLambda(lam),
      freqBand: bandForFreq(nu),
      photonM3: photonDensityM3(T),
      energy: energyDensity(T)
    };
  }

  return {
    H: H,
    C: C,
    K: K,
    T0: T0,
    T0_ERR: T0_ERR,
    Z_STAR: Z_STAR,
    Z_STAR_ERR: Z_STAR_ERR,
    DIPOLE_UK: DIPOLE_UK,
    DIPOLE_UK_ERR: DIPOLE_UK_ERR,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    Z_MIN: Z_MIN,
    V_MIN_KMS: V_MIN_KMS,
    V_MAX_KMS: V_MAX_KMS,
    zeta3: zeta3,
    wienXLambda: wienXLambda,
    wienXFreq: wienXFreq,
    wienB: wienB,
    freqPerKelvin: freqPerKelvin,
    sigma: sigma,
    radiationA: radiationA,
    wienLambdaM: wienLambdaM,
    wienFreqHz: wienFreqHz,
    planckNu: planckNu,
    photonDensityM3: photonDensityM3,
    energyDensity: energyDensity,
    temperatureAtZ: temperatureAtZ,
    redshiftAtT: redshiftAtT,
    dipoleDeltaT: dipoleDeltaT,
    dipoleSpeed: dipoleSpeed,
    planckDipoleKelvin: planckDipoleKelvin,
    planckDipoleSpeed: planckDipoleSpeed,
    zMax: zMax,
    bandForLambda: bandForLambda,
    bandForFreq: bandForFreq,
    presets: presets,
    presetById: presetById,
    logMap: logMap,
    logUnmap: logUnmap,
    zFromUnit: zFromUnit,
    zToUnit: zToUnit,
    tOk: tOk,
    zOk: zOk,
    vOkKms: vOkKms,
    formatSci: formatSci,
    formatTemp: formatTemp,
    formatZ: formatZ,
    formatLength: formatLength,
    formatFreq: formatFreq,
    formatPerCm3: formatPerCm3,
    formatSpeedKms: formatSpeedKms,
    formatMicroK: formatMicroK,
    evaluate: evaluate
  };
});
