/*! Blackbody radiation: Planck's law, Wien's peak, Stefan–Boltzmann luminosity.
    Constants are the defined SI values. σ and b are computed from them.
    The color chip integrates that curve against the CIE 1931 2° observer,
    sampled every 5 nm from the CIE 2019 1 nm table, then draws sRGB.
    Classroom schematic. Not a stellar-atmosphere model. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Blackbody = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Defined SI constants (CODATA; exact since the 2019 redefinition). */
  var H = 6.62607015e-34;
  var C = 299792458;
  var K = 1.380649e-23;

  /* IAU 2015 Resolution B3 nominal solar conversion constants. Exact. */
  var R_SUN_M = 6.957e8;
  var T_SUN_K = 5772;
  var L_SUN_NOMINAL_W = 3.828e26;

  /* NASA Imagine the Universe classroom optical window, same chart as the
     EM-spectrum desk. The color integral uses the wider CIE table. */
  var VIS_MIN_NM = 400;
  var VIS_MAX_NM = 700;

  var T_MIN = 2000;
  var T_MAX = 40000;
  var R_MIN = 0.05;
  var R_MAX = 1500;

  /* CIE 2019, colour-matching functions of the CIE 1931 2° standard
     colorimetric observer (CIE 018:2019 Table 6; DOI 10.25039/CIE.DS.xvudnb9b).
     Every 5 nm from that 1 nm table, 360–830 nm. [nm, x̄, ȳ, z̄]. */
  var CMF = [
    [360, 0.000129900000, 0.0000039170000, 0.000606100000],
    [365, 0.000232100000, 0.0000069650000, 0.001086000000],
    [370, 0.000414900000, 0.0000123900000, 0.001946000000],
    [375, 0.000741600000, 0.0000220200000, 0.003486000000],
    [380, 0.001368000000, 0.0000390000000, 0.006450001000],
    [385, 0.002236000000, 0.0000640000000, 0.010549990000],
    [390, 0.004243000000, 0.0001200000000, 0.020050010000],
    [395, 0.007650000000, 0.0002170000000, 0.036210000000],
    [400, 0.014310000000, 0.0003960000000, 0.067850010000],
    [405, 0.023190000000, 0.0006400000000, 0.110200000000],
    [410, 0.043510000000, 0.0012100000000, 0.207400000000],
    [415, 0.077630000000, 0.0021800000000, 0.371300000000],
    [420, 0.134380000000, 0.0040000000000, 0.645600000000],
    [425, 0.214770000000, 0.0073000000000, 1.039050100000],
    [430, 0.283900000000, 0.0116000000000, 1.385600000000],
    [435, 0.328500000000, 0.0168400000000, 1.622960000000],
    [440, 0.348280000000, 0.0230000000000, 1.747060000000],
    [445, 0.348060000000, 0.0298000000000, 1.782600000000],
    [450, 0.336200000000, 0.0380000000000, 1.772110000000],
    [455, 0.318700000000, 0.0480000000000, 1.744100000000],
    [460, 0.290800000000, 0.0600000000000, 1.669200000000],
    [465, 0.251100000000, 0.0739000000000, 1.528100000000],
    [470, 0.195360000000, 0.0909800000000, 1.287640000000],
    [475, 0.142100000000, 0.1126000000000, 1.041900000000],
    [480, 0.095640000000, 0.1390200000000, 0.812950100000],
    [485, 0.057950010000, 0.1693000000000, 0.616200000000],
    [490, 0.032010000000, 0.2080200000000, 0.465180000000],
    [495, 0.014700000000, 0.2586000000000, 0.353300000000],
    [500, 0.004900000000, 0.3230000000000, 0.272000000000],
    [505, 0.002400000000, 0.4073000000000, 0.212300000000],
    [510, 0.009300000000, 0.5030000000000, 0.158200000000],
    [515, 0.029100000000, 0.6082000000000, 0.111700000000],
    [520, 0.063270000000, 0.7100000000000, 0.078249990000],
    [525, 0.109600000000, 0.7932000000000, 0.057250010000],
    [530, 0.165500000000, 0.8620000000000, 0.042160000000],
    [535, 0.225749900000, 0.9148501000000, 0.029840000000],
    [540, 0.290400000000, 0.9540000000000, 0.020300000000],
    [545, 0.359700000000, 0.9803000000000, 0.013400000000],
    [550, 0.433449900000, 0.9949501000000, 0.008749999000],
    [555, 0.512050100000, 1.0000000000000, 0.005749999000],
    [560, 0.594500000000, 0.9950000000000, 0.003900000000],
    [565, 0.678400000000, 0.9786000000000, 0.002749999000],
    [570, 0.762100000000, 0.9520000000000, 0.002100000000],
    [575, 0.842500000000, 0.9154000000000, 0.001800000000],
    [580, 0.916300000000, 0.8700000000000, 0.001650001000],
    [585, 0.978600000000, 0.8163000000000, 0.001400000000],
    [590, 1.026300000000, 0.7570000000000, 0.001100000000],
    [595, 1.056700000000, 0.6949000000000, 0.001000000000],
    [600, 1.062200000000, 0.6310000000000, 0.000800000000],
    [605, 1.045600000000, 0.5668000000000, 0.000600000000],
    [610, 1.002600000000, 0.5030000000000, 0.000340000000],
    [615, 0.938400000000, 0.4412000000000, 0.000240000000],
    [620, 0.854449900000, 0.3810000000000, 0.000190000000],
    [625, 0.751400000000, 0.3210000000000, 0.000100000000],
    [630, 0.642400000000, 0.2650000000000, 0.000049999990],
    [635, 0.541900000000, 0.2170000000000, 0.000030000000],
    [640, 0.447900000000, 0.1750000000000, 0.000020000000],
    [645, 0.360800000000, 0.1382000000000, 0.000010000000],
    [650, 0.283500000000, 0.1070000000000, 0.000000000000],
    [655, 0.218700000000, 0.0816000000000, 0.000000000000],
    [660, 0.164900000000, 0.0610000000000, 0.000000000000],
    [665, 0.121200000000, 0.0445800000000, 0.000000000000],
    [670, 0.087400000000, 0.0320000000000, 0.000000000000],
    [675, 0.063600000000, 0.0232000000000, 0.000000000000],
    [680, 0.046770000000, 0.0170000000000, 0.000000000000],
    [685, 0.032900000000, 0.0119200000000, 0.000000000000],
    [690, 0.022700000000, 0.0082100000000, 0.000000000000],
    [695, 0.015840000000, 0.0057230000000, 0.000000000000],
    [700, 0.011359160000, 0.0041020000000, 0.000000000000],
    [705, 0.008110916000, 0.0029290000000, 0.000000000000],
    [710, 0.005790346000, 0.0020910000000, 0.000000000000],
    [715, 0.004109457000, 0.0014840000000, 0.000000000000],
    [720, 0.002899327000, 0.0010470000000, 0.000000000000],
    [725, 0.002049190000, 0.0007400000000, 0.000000000000],
    [730, 0.001439971000, 0.0005200000000, 0.000000000000],
    [735, 0.000999949300, 0.0003611000000, 0.000000000000],
    [740, 0.000690078600, 0.0002492000000, 0.000000000000],
    [745, 0.000476021300, 0.0001719000000, 0.000000000000],
    [750, 0.000332301100, 0.0001200000000, 0.000000000000],
    [755, 0.000234826100, 0.0000848000000, 0.000000000000],
    [760, 0.000166150500, 0.0000600000000, 0.000000000000],
    [765, 0.000117413000, 0.0000424000000, 0.000000000000],
    [770, 0.000083075270, 0.0000300000000, 0.000000000000],
    [775, 0.000058706520, 0.0000212000000, 0.000000000000],
    [780, 0.000041509940, 0.0000149900000, 0.000000000000],
    [785, 0.000029353260, 0.0000106000000, 0.000000000000],
    [790, 0.000020673830, 0.0000074657000, 0.000000000000],
    [795, 0.000014559770, 0.0000052578000, 0.000000000000],
    [800, 0.000010253980, 0.0000037029000, 0.000000000000],
    [805, 0.000007221456, 0.0000026078000, 0.000000000000],
    [810, 0.000005085868, 0.0000018366000, 0.000000000000],
    [815, 0.000003581652, 0.0000012934000, 0.000000000000],
    [820, 0.000002522525, 0.0000009109300, 0.000000000000],
    [825, 0.000001776509, 0.0000006415300, 0.000000000000],
    [830, 0.000001251141, 0.0000004518100, 0.000000000000]
  ];

  var wienXCache = 0;
  var sigmaCache = 0;
  var matrixCache = null;

  function wienX() {
    if (wienXCache) return wienXCache;
    /* (5 − x) e^x = 5, the wavelength form of Wien's condition.
       Start at 5, where the left side is zero, and Newton-solve. */
    var x = 5;
    var i;
    for (i = 0; i < 12; i++) {
      var ex = Math.exp(x);
      var f = (5 - x) * ex - 5;
      var fp = (4 - x) * ex;
      var dx = f / fp;
      x -= dx;
      if (Math.abs(dx) < 1e-15) break;
    }
    wienXCache = x;
    return x;
  }

  function sigma() {
    if (sigmaCache) return sigmaCache;
    var pi = Math.PI;
    sigmaCache = (2 * Math.pow(pi, 5) * Math.pow(K, 4)) / (15 * Math.pow(H, 3) * C * C);
    return sigmaCache;
  }

  function wienB() {
    return (H * C) / (K * wienX());
  }

  function wienLambdaM(T) {
    return wienB() / T;
  }

  function wienNm(T) {
    return wienLambdaM(T) * 1e9;
  }

  function planck(lambdaM, T) {
    if (!(lambdaM > 0) || !(T > 0)) return NaN;
    var x = (H * C) / (lambdaM * K * T);
    if (x > 700) return 0;
    return (2 * H * C * C) / (Math.pow(lambdaM, 5) * Math.expm1(x));
  }

  function flux(T) {
    return sigma() * Math.pow(T, 4);
  }

  function luminosity(T, rSolar) {
    var r = rSolar * R_SUN_M;
    return 4 * Math.PI * r * r * flux(T);
  }

  function solarFormulaLuminosity() {
    return luminosity(T_SUN_K, 1);
  }

  function luminosityRatio(T, rSolar) {
    return luminosity(T, rSolar) / solarFormulaLuminosity();
  }

  function nominalLuminosityRatio(T, rSolar) {
    return luminosity(T, rSolar) / L_SUN_NOMINAL_W;
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

  function det3(m) {
    return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  }

  function invert3(m) {
    var a = m[0], b = m[1], c = m[2];
    var d = m[3], e = m[4], f = m[5];
    var g = m[6], h = m[7], i = m[8];
    var A = e * i - f * h;
    var B = f * g - d * i;
    var C = d * h - e * g;
    var D = c * h - b * i;
    var E = a * i - c * g;
    var F = b * g - a * h;
    var G = b * f - c * e;
    var H = c * d - a * f;
    var I = a * e - b * d;
    var det = a * A + b * B + c * C;
    return [A / det, D / det, G / det, B / det, E / det, H / det, C / det, F / det, I / det];
  }

  function xyzFromxy(x, y) {
    return [x / y, 1, (1 - x - y) / y];
  }

  /* IEC 61966-2-1 sRGB primaries and D65 white, Y = 1. */
  function xyzToLinearMatrix() {
    if (matrixCache) return matrixCache;
    var R = xyzFromxy(0.64, 0.33);
    var G = xyzFromxy(0.3, 0.6);
    var B = xyzFromxy(0.15, 0.06);
    var W = xyzFromxy(0.3127, 0.329);
    var M = [R[0], G[0], B[0], R[1], G[1], B[1], R[2], G[2], B[2]];
    var Minv = invert3(M);
    var Sr = Minv[0] * W[0] + Minv[1] * W[1] + Minv[2] * W[2];
    var Sg = Minv[3] * W[0] + Minv[4] * W[1] + Minv[5] * W[2];
    var Sb = Minv[6] * W[0] + Minv[7] * W[1] + Minv[8] * W[2];
    var rgbToXyz = [
      Sr * R[0], Sg * G[0], Sb * B[0],
      Sr * R[1], Sg * G[1], Sb * B[1],
      Sr * R[2], Sg * G[2], Sb * B[2]
    ];
    matrixCache = invert3(rgbToXyz);
    return matrixCache;
  }

  function gamma(u) {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    if (u <= 0.0031308) return 12.92 * u;
    return 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
  }

  function integrateXyz(T) {
    var X = 0;
    var Y = 0;
    var Z = 0;
    var i;
    for (i = 0; i < CMF.length - 1; i++) {
      var a = CMF[i];
      var b = CMF[i + 1];
      var l1 = a[0] * 1e-9;
      var l2 = b[0] * 1e-9;
      var B1 = planck(l1, T);
      var B2 = planck(l2, T);
      var d = l2 - l1;
      X += 0.5 * (B1 * a[1] + B2 * b[1]) * d;
      Y += 0.5 * (B1 * a[2] + B2 * b[2]) * d;
      Z += 0.5 * (B1 * a[3] + B2 * b[3]) * d;
    }
    return { X: X, Y: Y, Z: Z };
  }

  function color(T) {
    var xyz = integrateXyz(T);
    var m = xyzToLinearMatrix();
    var rl = m[0] * xyz.X + m[1] * xyz.Y + m[2] * xyz.Z;
    var gl = m[3] * xyz.X + m[4] * xyz.Y + m[5] * xyz.Z;
    var bl = m[6] * xyz.X + m[7] * xyz.Y + m[8] * xyz.Z;
    var clipped = rl < 0 || gl < 0 || bl < 0;
    if (rl < 0) rl = 0;
    if (gl < 0) gl = 0;
    if (bl < 0) bl = 0;
    var peak = Math.max(rl, gl, bl);
    if (peak > 0) {
      rl /= peak;
      gl /= peak;
      bl /= peak;
    }
    var r = gamma(rl);
    var g = gamma(gl);
    var b = gamma(bl);
    var R = Math.round(r * 255);
    var G = Math.round(g * 255);
    var B = Math.round(b * 255);
    function hex2(n) {
      var s = n.toString(16);
      return s.length === 1 ? "0" + s : s;
    }
    return {
      r: R,
      g: G,
      b: B,
      hex: "#" + hex2(R) + hex2(G) + hex2(B),
      clipped: clipped,
      linear: [rl, gl, bl]
    };
  }

  function peakBand(nm) {
    if (nm < VIS_MIN_NM) return "ultraviolet";
    if (nm <= VIS_MAX_NM) return "visible";
    return "infrared";
  }

  function why(T) {
    var nm = wienNm(T);
    var band = peakBand(nm);
    var lead = "Wien’s peak is " + formatNm(nm) + ", in the " + band + ". ";
    var body;
    if (band === "ultraviolet") {
      body = "Most of the energy is shortward of the eye. In the visible slice the curve is already falling toward the red, so that mix has more blue than red and reads blue-white.";
    } else if (band === "visible") {
      body = "The peak sits in the rainbow, and the curve is still broad. The eye mixes the whole band. A green peak is not a green star. The nominal solar temperature, 5772 K, peaks near 502 nm.";
    } else {
      body = "Most of the energy is infrared. The visible slice is the short-wavelength side, where the curve rises steeply toward the red, so blue is scarce and the mix is orange-red.";
    }
    return lead + body + " A real stellar spectrum only approximately follows this curve.";
  }

  function formatNm(nm) {
    if (!isFinite(nm)) return "—";
    if (nm >= 100) return nm.toFixed(1) + " nm";
    if (nm >= 10) return nm.toFixed(2) + " nm";
    return nm.toFixed(3) + " nm";
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

  function superscript(n) {
    var map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(n).split("").map(function (ch) { return map[ch] || ch; }).join("");
  }

  function formatRatio(r) {
    if (!isFinite(r)) return "—";
    var a = Math.abs(r);
    if (a === 0) return "0";
    if (a >= 1e4 || a < 1e-3) return formatSci(r, 4);
    if (a >= 100) return trimFixed(r, 1);
    if (a >= 10) return trimFixed(r, 2);
    if (a >= 1) return trimFixed(r, 3);
    return trimFixed(r, 5);
  }

  function trimFixed(v, digits) {
    return v.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatTemp(t) {
    if (!isFinite(t)) return "";
    return String(Math.round(t));
  }

  function formatRadius(r) {
    if (!isFinite(r)) return "";
    var a = Math.abs(r);
    var digits = a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4;
    return trimFixed(r, digits);
  }

  function presets() {
    return [
      {
        id: "sun",
        name: "Sun",
        T: 5772,
        R: 1,
        uncertain: false,
        tier: "Nominal solar · IAU 2015 B3",
        note: "IAU 2015 Resolution B3 defines the nominal solar effective temperature as exactly 5772 K and the nominal solar radius as exactly 6.957 × 10⁸ m. Those are conversion constants, chosen near the 2015 estimates, not a measurement of the Sun. Radius here is 1 nominal solar radius."
      },
      {
        id: "proxima",
        name: "Proxima",
        T: 2980,
        R: 0.146,
        uncertain: true,
        tier: "Red dwarf · uncertain",
        note: "Ribas et al. 2017 give Proxima Centauri T_eff = 2980 ± 80 K and R = 0.146 ± 0.007 R☉, and a bolometric luminosity 0.00151 ± 0.00008 L☉. The sliders use the central values. The uncertainties are real."
      },
      {
        id: "vega",
        name: "Vega",
        T: 9560,
        R: 2.75,
        uncertain: true,
        tier: "Hot star · not a sphere",
        note: "Hill, Gulliver, and Adelman 2010 give Vega a mean effective temperature 9560 ± 30 K and an equatorial radius 2.75 ± 0.01 R☉. The star is oblate and seen nearly pole-on: polar radius 2.40 ± 0.02 R☉, polar temperature 10,000 ± 30 K, and a pole-to-equator drop of 1410 K. Their luminosity is 44 ± 2 L☉. This desk puts the mean temperature on the equatorial radius, so the blackbody product is not that luminosity."
      },
      {
        id: "rigel",
        name: "Rigel",
        T: 12100,
        R: 78.9,
        uncertain: true,
        tier: "Hot supergiant · radius uncertain",
        note: "Moravveji et al. 2012 list Rigel at T_eff = 12,100 ± 150 K, attributed to Przybilla and colleagues, and R = 78.9 ± 7.4 R☉ from a CHARA angular diameter (Aufdenberg et al. 2008) and the Hipparcos distance. The radius uncertainty is mostly the distance. Their table also lists log(L/L☉) = 5.08, uncertain by +0.07 and −0.10. The luminosity readout is the blackbody product of the temperature and radius on the sliders."
      },
      {
        id: "betelgeuse",
        name: "Betelgeuse",
        T: 3500,
        R: 887,
        uncertain: true,
        tier: "Red supergiant · very uncertain",
        note: "Dolan et al. 2016 adopt T_eff = 3500 ± 200 K and R = 887 ± 203 R☉ for Betelgeuse, and log(L/L☉) = 5.10 ± 0.22. The radius error is dominated by the distance, 197 ± 45 pc (Harper et al. 2008). The sliders use the central values. The luminosity readout is the blackbody product of those central values, inside that wide range, not a tighter measurement."
      }
    ];
  }

  function presetById(id) {
    var list = presets();
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  return {
    H: H,
    C: C,
    K: K,
    R_SUN_M: R_SUN_M,
    T_SUN_K: T_SUN_K,
    L_SUN_NOMINAL_W: L_SUN_NOMINAL_W,
    VIS_MIN_NM: VIS_MIN_NM,
    VIS_MAX_NM: VIS_MAX_NM,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    R_MIN: R_MIN,
    R_MAX: R_MAX,
    CMF: CMF,
    wienX: wienX,
    sigma: sigma,
    wienB: wienB,
    wienLambdaM: wienLambdaM,
    wienNm: wienNm,
    planck: planck,
    flux: flux,
    luminosity: luminosity,
    solarFormulaLuminosity: solarFormulaLuminosity,
    luminosityRatio: luminosityRatio,
    nominalLuminosityRatio: nominalLuminosityRatio,
    logMap: logMap,
    logUnmap: logUnmap,
    xyzToLinearMatrix: xyzToLinearMatrix,
    integrateXyz: integrateXyz,
    color: color,
    peakBand: peakBand,
    why: why,
    formatNm: formatNm,
    formatSci: formatSci,
    formatRatio: formatRatio,
    formatTemp: formatTemp,
    formatRadius: formatRadius,
    presets: presets,
    presetById: presetById,
    det3: det3
  };
});
