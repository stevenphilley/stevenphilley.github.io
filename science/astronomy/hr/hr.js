/*! Hertzsprung–Russell desk: Teff versus luminosity, with Stefan–Boltzmann
    iso-radius lines. σ is computed from the defined SI constants, the same
    way as the blackbody desk. The solar zero is IAU 2015 Resolution B3.
    Bolometric magnitude uses IAU 2015 Resolution B2, M_bol,☉ = 4.74.
    Presets are cited central values. Region polygons are a classroom
    cartoon, not a catalog boundary. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var H = 6.62607015e-34;
  var C = 299792458;
  var K = 1.380649e-23;

  /* IAU 2015 Resolution B3 nominal solar conversion constants. Exact. */
  var R_SUN_M = 6.957e8;
  var T_SUN_K = 5772;
  var L_SUN_NOMINAL_W = 3.828e26;

  /* IAU 2015 Resolution B2 nominal solar bolometric magnitude. */
  var M_BOL_SUN = 4.74;

  /* NASA fact sheet absolute visual magnitude, and the magnitude desk's
     Sirius inputs: Ducati V and the ESA parallax. Visual, not bolometric. */
  var SUN_MV = 4.83;
  var SIRIUS_V = -1.46;
  var SIRIUS_PARALLAX_ARCSEC = 0.37921;

  var T_MIN = 2500;
  var T_MAX = 40000;
  var L_MIN = 1e-4;
  var L_MAX = 1e6;

  /* Round radii for the toggleable blackbody lines, in solar radii. */
  var RADIUS_LINES = [0.01, 0.1, 1, 10, 100, 1000];

  /* Main-sequence cartoon: a band in log10 T, log10 L.
     Giants and white dwarfs are boxes in the same plane.
     The vertices are a teaching sketch drawn so the cited presets
     fall in the family the caption names. They are not a fit. */
  var MS_T0 = 3.4;
  var MS_L0 = -3.3;
  var MS_T1 = 4.15;
  var MS_L1 = 2.6;
  var MS_HALF = 0.85;

  var sigmaCache = 0;

  function sigma() {
    if (sigmaCache) return sigmaCache;
    var pi = Math.PI;
    sigmaCache = (2 * Math.pow(pi, 5) * Math.pow(K, 4)) / (15 * Math.pow(H, 3) * C * C);
    return sigmaCache;
  }

  function luminosityWatts(T, rSolar) {
    var r = rSolar * R_SUN_M;
    return 4 * Math.PI * r * r * sigma() * Math.pow(T, 4);
  }

  /* L / L☉ where the denominator is the same formula at the nominal Sun,
     so 5772 K and 1 R☉ is exactly 1. Equivalent to (R/R☉)² (T/T☉)⁴. */
  function luminosityRatio(T, rSolar) {
    return rSolar * rSolar * Math.pow(T / T_SUN_K, 4);
  }

  function nominalLuminosityRatio(T, rSolar) {
    return luminosityWatts(T, rSolar) / L_SUN_NOMINAL_W;
  }

  function radiusFromLuminosity(T, lRatio) {
    if (!(T > 0) || !(lRatio > 0)) return NaN;
    return Math.sqrt(lRatio) * Math.pow(T_SUN_K / T, 2);
  }

  function bolometricMagnitude(lRatio) {
    if (!(lRatio > 0)) return NaN;
    return M_BOL_SUN - 2.5 * Math.log10(lRatio);
  }

  function visualFromApparent(appMag, pArcsec) {
    var dPc = 1 / pArcsec;
    return appMag - 5 * Math.log10(dPc / 10);
  }

  function siriusVisualAbsolute() {
    return visualFromApparent(SIRIUS_V, SIRIUS_PARALLAX_ARCSEC);
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

  /* 0 at the left (hot), 1 at the right (cool). */
  function xFrac(T) {
    var u = (Math.log(T) - Math.log(T_MIN)) / (Math.log(T_MAX) - Math.log(T_MIN));
    return 1 - u;
  }

  function tFromXFrac(f) {
    var u = 1 - f;
    return Math.exp(Math.log(T_MIN) + u * (Math.log(T_MAX) - Math.log(T_MIN)));
  }

  /* 0 at the top (bright), 1 at the bottom (faint). */
  function yFrac(L) {
    var u = (Math.log(L) - Math.log(L_MIN)) / (Math.log(L_MAX) - Math.log(L_MIN));
    return 1 - u;
  }

  function lFromYFrac(f) {
    var u = 1 - f;
    return Math.exp(Math.log(L_MIN) + u * (Math.log(L_MAX) - Math.log(L_MIN)));
  }

  function pointInPoly(x, y, poly) {
    var inside = false;
    var i;
    var j = poly.length - 1;
    for (i = 0; i < poly.length; j = i++) {
      var xi = poly[i][0];
      var yi = poly[i][1];
      var xj = poly[j][0];
      var yj = poly[j][1];
      var intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function bandPolygon(t0, l0, t1, l1, half) {
    return [
      [t0, l0 - half],
      [t1, l1 - half],
      [t1, l1 + half],
      [t0, l0 + half]
    ];
  }

  function boxPolygon(t0, l0, t1, l1) {
    return [
      [t0, l0],
      [t1, l0],
      [t1, l1],
      [t0, l1]
    ];
  }

  function regions() {
    return [
      {
        id: "ms",
        name: "Main sequence",
        short: "Main sequence",
        label: [3.55, -1.6],
        why: "On the cartoon main sequence, hotter stars are brighter. Temperature is only part of it: radius changes along the sequence too. The band is a sketch through the cited dwarfs, not a fit.",
        poly: bandPolygon(MS_T0, MS_L0, MS_T1, MS_L1, MS_HALF)
      },
      {
        id: "giants",
        name: "Giants / supergiants",
        short: "Giants",
        label: [3.7, 4.2],
        why: "Giants and supergiants sit above the main sequence. A large radius makes a lot of light, so a cool photosphere can still be luminous. The box is a cartoon, not a luminosity class.",
        poly: boxPolygon(3.48, 3.6, 4.2, 5.9)
      },
      {
        id: "wd",
        name: "White dwarfs",
        short: "White dwarfs",
        label: [4.28, -2.05],
        why: "White dwarfs are hot and faint. The temperature is high and the radius is tiny, so the area cannot make up for it. This box is a cartoon around that corner, not a cooling track.",
        poly: boxPolygon(4.2, -2.3, 4.6, -0.8)
      }
    ];
  }

  function regionAt(T, L) {
    if (!(T > 0) || !(L > 0)) return null;
    var x = Math.log(T) / Math.LN10;
    var y = Math.log(L) / Math.LN10;
    var list = regions();
    var i;
    for (i = 0; i < list.length; i++) {
      if (pointInPoly(x, y, list[i].poly)) return list[i];
    }
    return null;
  }

  function lError(p) {
    if (!p) return null;
    if (p.logL != null && (p.dLogPlus != null || p.dLog != null)) {
      var up = p.dLogPlus != null ? p.dLogPlus : p.dLog;
      var down = p.dLogMinus != null ? p.dLogMinus : p.dLog;
      return {
        lo: Math.pow(10, p.logL - down),
        hi: Math.pow(10, p.logL + up)
      };
    }
    if (p.dL != null) {
      return { lo: p.L - p.dL, hi: p.L + p.dL };
    }
    return null;
  }

  function presets() {
    return [
      {
        id: "sun",
        name: "Sun",
        T: 5772,
        L: 1,
        R: 1,
        uncertain: false,
        tier: "Nominal solar · IAU 2015 B3",
        why: "The nominal Sun is the zero of this diagram: 1 L☉ at 5772 K, on the 1 R☉ line. Hotter main-sequence stars on this page sit up and to the left.",
        note: "IAU 2015 Resolution B3 defines the nominal solar effective temperature as exactly 5772 K, the nominal solar radius as exactly 6.957 × 10⁸ m, and the nominal solar luminosity as exactly 3.828 × 10²⁶ W. The marker is the formula ratio at those temperature and radius inputs, so it reads 1 and sits on the 1 R☉ line. The bolometric magnitude uses Resolution B2, M_bol,☉ = 4.74. The visual absolute magnitude +4.83 is the NASA Sun Fact Sheet figure already used on the magnitude desk. Visual and bolometric are different numbers."
      },
      {
        id: "proxima",
        name: "Proxima",
        T: 2980,
        dT: 80,
        L: 0.00151,
        dL: 0.00008,
        R: 0.146,
        dR: 0.007,
        uncertain: true,
        tier: "Red dwarf · main sequence",
        why: "Cool and faint, and still on the main sequence. Proxima is dim because it is small and cool, not because it is a white dwarf.",
        note: "Ribas et al. 2017 give Proxima Centauri T_eff = 2980 ± 80 K, R = 0.146 ± 0.007 R☉, and bolometric luminosity 0.00151 ± 0.00008 L☉. The marker uses the central temperature and the published luminosity. The radius line is the blackbody locus of the central radius. The same temperature and radius are the Proxima preset on the blackbody desk."
      },
      {
        id: "vega",
        name: "Vega",
        T: 9560,
        dT: 30,
        L: 44,
        dL: 2,
        R: 2.75,
        dR: 0.01,
        uncertain: true,
        tier: "Hot dwarf · not a sphere",
        why: "Hotter than the Sun, and more luminous, still with the main-sequence dwarfs. One radius was never the whole star.",
        note: "Hill, Gulliver, and Adelman 2010 give Vega a mean effective temperature 9560 ± 30 K, an equatorial radius 2.75 ± 0.01 R☉, a polar radius 2.40 ± 0.02 R☉, and a luminosity 44 ± 2 L☉. The star is oblate and seen nearly pole-on. The marker uses the mean temperature and the published luminosity. The radius line uses the equatorial radius, so it is not that luminosity. The blackbody desk makes the same point."
      },
      {
        id: "sirius-a",
        name: "Sirius A",
        T: 9845,
        dT: 64,
        L: 24.74,
        dL: 0.7,
        R: 1.7144,
        dR: 0.009,
        uncertain: true,
        tier: "A star · main sequence",
        why: "Hotter and more luminous than the Sun, and still a main-sequence star. How bright it looks from Earth is the magnitude desk. This point is luminosity.",
        note: "Bond et al. 2017 adopt the Davis et al. 2011 parameters for Sirius A, adjusted to their parallax: T_eff = 9845 ± 64 K, R = 1.7144 ± 0.0090 R☉, and L = 24.74 ± 0.70 L☉. They give the classical type as A1 V. The marker uses those central temperature and luminosity. The visual absolute magnitude in the readout is the magnitude desk’s arithmetic: Ducati V = −1.46 and the ESA parallax 0.37921″. It is not the bolometric magnitude."
      },
      {
        id: "sirius-b",
        name: "Sirius B",
        T: 25369,
        dT: 46,
        L: 0.02448,
        dL: 0.00033,
        R: 0.008098,
        dR: 0.000046,
        uncertain: true,
        tier: "White dwarf · DA2",
        why: "Hotter than Sirius A, and far fainter than the Sun. The radius is under a hundredth of the Sun’s, so the star is hot and tiny.",
        note: "Bond et al. 2017 report Sirius B at T_eff = 25,369 ± 46 K, R = 0.008098 ± 0.000046 R☉, and L = 0.02448 ± 0.00033 L☉, from their STIS fits, and type it DA2. They say those uncertainties are internal errors and do not include modestly larger systematic uncertainties. The marker uses the central temperature and luminosity. A white dwarf, not a faint main-sequence star."
      },
      {
        id: "betelgeuse",
        name: "Betelgeuse",
        T: 3500,
        dT: 200,
        logL: 5.1,
        dLog: 0.22,
        L: Math.pow(10, 5.1),
        R: 887,
        dR: 203,
        uncertain: true,
        tier: "Red supergiant · very uncertain",
        why: "Cooler than the Sun, and enormously more luminous. The radius, not the temperature, carries the light. This is the giant side of the cartoon.",
        note: "Dolan et al. 2016 adopt T_eff = 3500 ± 200 K, R = 887 ± 203 R☉, and log(L/L☉) = 5.10 ± 0.22 for Betelgeuse. The radius error is dominated by the distance, 197 ± 45 pc (Harper et al. 2008). The marker uses the central temperature and 10^5.10. The same temperature and radius are the Betelgeuse preset on the blackbody desk. The luminosity there is the blackbody product; the marker here is the published log luminosity."
      },
      {
        id: "rigel",
        name: "Rigel",
        T: 12100,
        dT: 150,
        logL: 5.08,
        dLogPlus: 0.07,
        dLogMinus: 0.1,
        L: Math.pow(10, 5.08),
        R: 78.9,
        dR: 7.4,
        uncertain: true,
        tier: "Hot supergiant · radius uncertain",
        why: "Hot and huge, so the luminosity sits with the supergiants, not with the main-sequence dwarfs at the same temperature.",
        note: "Moravveji et al. 2012 list Rigel at T_eff = 12,100 ± 150 K, R = 78.9 ± 7.4 R☉, and log(L/L☉) = 5.08, uncertain by +0.07 and −0.10. The radius uncertainty is mostly the distance. The marker uses the central temperature and 10^5.08. The same temperature and radius are the Rigel preset on the blackbody desk."
      }
    ];
  }

  function presetById(id) {
    var list = presets();
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function whyFor(T, L, preset) {
    if (preset && preset.why) return preset.why;
    var region = regionAt(T, L);
    if (region) return region.why;
    return "Between the cartoons. Hotter main-sequence stars are brighter. Giants are large and luminous even when cool. White dwarfs are hot and tiny. The shaded regions are a classroom sketch, not a boundary.";
  }

  function trimFixed(v, digits) {
    return v.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatTemp(t) {
    if (!isFinite(t)) return "";
    return String(Math.round(t));
  }

  function formatRadius(r) {
    if (!isFinite(r) || !(r > 0)) return "";
    var a = Math.abs(r);
    var digits = a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 4 : a >= 0.01 ? 4 : 6;
    return trimFixed(r, digits);
  }

  function formatL(l) {
    if (!(l > 0) || !isFinite(l)) return "";
    if (l >= 10000 || l < 0.001) {
      var exp = Math.floor(Math.log10(l));
      var mant = l / Math.pow(10, exp);
      return trimFixed(mant, 3) + "e" + exp;
    }
    var digits = l >= 100 ? 1 : l >= 10 ? 2 : l >= 1 ? 3 : 5;
    return trimFixed(l, digits);
  }

  function formatLLabel(p, l) {
    if (p && p.logL != null) return "10^" + p.logL.toFixed(2);
    return formatL(l);
  }

  function formatMag(n) {
    if (!isFinite(n)) return "";
    var digits = 2;
    if (n > 0) return "+" + trimFixed(n, digits);
    if (n < 0) return "−" + trimFixed(Math.abs(n), digits);
    return "0";
  }

  return {
    H: H,
    C: C,
    K: K,
    R_SUN_M: R_SUN_M,
    T_SUN_K: T_SUN_K,
    L_SUN_NOMINAL_W: L_SUN_NOMINAL_W,
    M_BOL_SUN: M_BOL_SUN,
    SUN_MV: SUN_MV,
    SIRIUS_V: SIRIUS_V,
    SIRIUS_PARALLAX_ARCSEC: SIRIUS_PARALLAX_ARCSEC,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    L_MIN: L_MIN,
    L_MAX: L_MAX,
    RADIUS_LINES: RADIUS_LINES,
    sigma: sigma,
    luminosityWatts: luminosityWatts,
    luminosityRatio: luminosityRatio,
    nominalLuminosityRatio: nominalLuminosityRatio,
    radiusFromLuminosity: radiusFromLuminosity,
    bolometricMagnitude: bolometricMagnitude,
    visualFromApparent: visualFromApparent,
    siriusVisualAbsolute: siriusVisualAbsolute,
    logMap: logMap,
    logUnmap: logUnmap,
    xFrac: xFrac,
    tFromXFrac: tFromXFrac,
    yFrac: yFrac,
    lFromYFrac: lFromYFrac,
    pointInPoly: pointInPoly,
    regions: regions,
    regionAt: regionAt,
    lError: lError,
    presets: presets,
    presetById: presetById,
    whyFor: whyFor,
    formatTemp: formatTemp,
    formatRadius: formatRadius,
    formatL: formatL,
    formatLLabel: formatLLabel,
    formatMag: formatMag
  };
});
