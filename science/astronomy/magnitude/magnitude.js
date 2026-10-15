/*! Stellar magnitudes: flux ratio, distance modulus, and a backwards scale.
    Δm → flux ratio 10^(0.4·Δm) = 100^(Δm/5).
    m − M = 5·log10(d / 10 pc). At 10 pc, m = M.
    1 pc ≈ 3.2616 ly is the four-decimal rounding of the IAU parsec
    divided by a Julian-year light-year. The slider uses that rounding
    so a typed light-year matches the sentence on the page.
    Extinction is ignored. Visual / V band. Classroom schematic, not a catalog. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Magnitude = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* IAU 2012 Resolution B2: the astronomical unit is exactly this many metres.
     The parsec is (648000/π) AU. A Julian year is 365.25 days of 86400 s.
     c is the defined SI speed. Their quotient is the unrounded light-year count. */
  var AU_M = 149597870700;
  var AU_PER_PC = 648000 / Math.PI;
  var C_M_S = 299792458;
  var JULIAN_YEAR_S = 365.25 * 86400;
  var PC_M = AU_PER_PC * AU_M;
  var LY_M = C_M_S * JULIAN_YEAR_S;
  var LY_PER_PC_EXACT = PC_M / LY_M;
  var LY_PER_PC = 3.2616;

  var FACT = {
    sunV: -26.74,
    sunM: 4.83,
    moonV: -12.74,
    venusMax: -4.8,
    siriusV: -1.46,
    vegaV: 0.03,
    polarisV: 2.02,
    idealNelmBright: 6.0,
    idealNelmFaint: 6.5,
    cityNelm: 4.0,
    siriusParallaxArcsec: 0.37921
  };

  var DIST_MIN_PC = 1e-6;
  var DIST_MAX_PC = 1000;
  var DIST_TYPE_MIN_PC = 1e-8;
  var DIST_TYPE_MAX_PC = 1e6;
  var SLIDER_MAX = 1000;
  var DM_MIN = -15;
  var DM_MAX = 15;
  var DM_TYPE_MIN = -30;
  var DM_TYPE_MAX = 30;
  var M_MIN = -10;
  var M_MAX = 20;
  var M_TYPE_MIN = -30;
  var M_TYPE_MAX = 30;

  var SCALE = [
    {
      id: "sun",
      kind: "point",
      m: FACT.sunV,
      name: "Sun",
      short: "−26.74",
      approx: false,
      tier: "Apparent · V(1,0)",
      note: "NASA’s Sun Fact Sheet lists visual magnitude V(1,0) as −26.74 in the Sun column. That is the Sun as seen from Earth. The Earth column on the same row is −3.86. That figure is not the Sun in our sky, and it is not on this line."
    },
    {
      id: "moon",
      kind: "point",
      m: FACT.moonV,
      name: "Full Moon",
      short: "−12.74",
      approx: true,
      tier: "Apparent · mean opposition",
      note: "NASA’s Moon Fact Sheet lists apparent visual magnitude −12.74 with the mean values at opposition, distance 378,000 km. Opposition is the full-Moon geometry. A given full Moon moves with distance, so this tick is the sheet’s mean, marked approximate, not every night."
    },
    {
      id: "venus",
      kind: "point",
      m: FACT.venusMax,
      name: "Venus",
      short: "−4.8",
      approx: true,
      tier: "Apparent · maximum",
      note: "NASA’s Venus Fact Sheet lists maximum visual magnitude −4.8. That is Venus at its brightest, printed to one decimal, so the tick is approximate. NASA’s Night Sky Network says Venus can shine brighter than −4, which sits with a maximum of −4.8."
    },
    {
      id: "sirius",
      kind: "point",
      m: FACT.siriusV,
      name: "Sirius",
      short: "−1.46",
      approx: false,
      tier: "Johnson V",
      note: "SIMBAD lists V = −1.46 for * alf CMa, from Ducati’s 2002 catalogue of Johnson photometry (VizieR II/237). NASA’s Night Sky Network prints the same −1.46 for Sirius."
    },
    {
      id: "vega",
      kind: "point",
      m: FACT.vegaV,
      name: "Vega",
      short: "+0.03",
      approx: false,
      tier: "Johnson V",
      note: "SIMBAD lists V = 0.03 for * alf Lyr, from the same Ducati catalogue. An archived NASA Imagine the Universe answer says Vega defines magnitude 0.0. That is the historical zero. The measured Johnson V on this tick is 0.03."
    },
    {
      id: "polaris",
      kind: "point",
      m: FACT.polarisV,
      name: "Polaris",
      short: "+2.02",
      approx: true,
      tier: "Johnson V · variable",
      note: "SIMBAD lists V = 2.02 for * alf UMi, from Ducati 2002, and types the star cC*, a classical Cepheid. The tick is a catalog value, marked approximate, not the brightness on a given night."
    },
    {
      id: "city",
      kind: "point",
      m: FACT.cityNelm,
      name: "Inner city",
      short: "4.0",
      approx: true,
      tier: "Naked-eye limit · approximate",
      note: "Sky & Telescope’s account of the Bortle scale says a class 9 inner-city sky has a limiting magnitude of 4.0 or less. Stars fainter than that, a larger number, drop out. Approximate: eyes and the night both move it. The light-pollution desk is what brightens that sky."
    },
    {
      id: "ideal",
      kind: "range",
      m0: FACT.idealNelmBright,
      m1: FACT.idealNelmFaint,
      name: "Ideal dark sky",
      short: "6.0–6.5",
      approx: true,
      tier: "Naked-eye limit · approximate",
      note: "NASA’s Imagine the Universe says that under ideal conditions the average person should see stars as faint as magnitude 6.0 to 6.5. NASA’s Night Sky Network says most visible stars run from 1st to 6th magnitude, and that a smaller number is brighter. Approximate. Not a forecast for one site."
    }
  ];

  function fluxRatio(deltaM) {
    return Math.pow(10, 0.4 * deltaM);
  }

  function fluxRatioHundred(deltaM) {
    return Math.pow(100, deltaM / 5);
  }

  function deltaFromRatio(ratio) {
    return 2.5 * Math.log10(ratio);
  }

  function distanceModulus(dPc) {
    return 5 * Math.log10(dPc / 10);
  }

  function apparent(absMag, dPc) {
    return absMag + distanceModulus(dPc);
  }

  function absoluteFromApparent(appMag, dPc) {
    return appMag - distanceModulus(dPc);
  }

  function parallaxArcsec(dPc) {
    return 1 / dPc;
  }

  function pcFromParallax(pArcsec) {
    return 1 / pArcsec;
  }

  function lyFromPc(dPc) {
    return dPc * LY_PER_PC;
  }

  function pcFromLy(ly) {
    return ly / LY_PER_PC;
  }

  function auFromPc(dPc) {
    return dPc * AU_PER_PC;
  }

  function pcFromAu(au) {
    return au / AU_PER_PC;
  }

  function distanceForApparent(absMag, appMag) {
    return 10 * Math.pow(10, (appMag - absMag) / 5);
  }

  function sunAt10Pc() {
    return apparent(FACT.sunM, 10);
  }

  function sunAtAu() {
    return apparent(FACT.sunM, pcFromAu(1));
  }

  /* city-and-dark: at or brighter than the inner-city boundary, so both skies.
     dark-only: fainter than that boundary, still at or brighter than mag 6.0.
     faint-end: only the faint side of NASA’s 6.0–6.5 ideal range.
     beyond: fainter than 6.5. */
  function visibility(appMag) {
    if (appMag <= FACT.cityNelm) return "city-and-dark";
    if (appMag <= FACT.idealNelmBright) return "dark-only";
    if (appMag <= FACT.idealNelmFaint) return "faint-end";
    return "beyond";
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
    var sign = n < 0 ? "−" : "";
    if (abs !== 0 && (abs >= 10000 || abs < 0.001)) return sign + sci(abs);
    var d = digits == null ? (abs >= 100 ? 1 : 4) : digits;
    var body = trimFixed(n, d);
    var parts = body.split(".");
    parts[0] = groupInt(parts[0]);
    return sign + parts.join(".");
  }

  function formatMag(n) {
    if (!isFinite(n)) return "—";
    var sign = n < 0 ? "−" : "";
    return sign + trimFixed(n, 3);
  }

  function formatAbs(n) {
    if (!isFinite(n)) return "—";
    if (n > 0) return "+" + trimFixed(n, 3);
    if (n < 0) return "−" + trimFixed(n, 3);
    return "0";
  }

  function formatRatio(r) {
    if (!(r > 0) || !isFinite(r)) return "—";
    if (r >= 10000 || r < 0.001) return sci(r);
    var digits = r >= 100 ? 2 : 3;
    var body = trimFixed(r, digits);
    var parts = body.split(".");
    parts[0] = groupInt(parts[0]);
    return parts.join(".");
  }

  function formatPc(dPc) {
    return formatPlain(dPc) + " pc";
  }

  function formatLy(dPc) {
    return formatPlain(lyFromPc(dPc)) + " ly";
  }

  function formatAu(dPc) {
    var au = auFromPc(dPc);
    if (Math.abs(au - 1) < 1e-6) return "1 AU";
    return formatPlain(au) + " AU";
  }

  function formatParallax(dPc) {
    var p = parallaxArcsec(dPc);
    if (!isFinite(p) || p <= 0) return "—";
    var arc = formatPlain(p, p >= 100 ? 1 : 5) + "″";
    if (p < 1) {
      var mas = p * 1000;
      arc += " · " + formatPlain(mas, 2) + " mas";
    }
    return arc;
  }

  function parallaxIsStellar(dPc) {
    return dPc >= 0.1;
  }

  function formatDistancePair(dPc) {
    return formatPc(dPc) + " · " + formatLy(dPc);
  }

  function numberInUnit(dPc, unit) {
    if (unit === "ly") return lyFromPc(dPc);
    if (unit === "au") return auFromPc(dPc);
    return dPc;
  }

  function pcFromUnit(n, unit) {
    if (unit === "ly") return pcFromLy(n);
    if (unit === "au") return pcFromAu(n);
    return n;
  }

  function inputString(n) {
    if (!isFinite(n)) return "";
    var abs = Math.abs(n);
    if (abs !== 0 && (abs >= 10000 || abs < 0.001)) {
      var exp = Math.floor(Math.log10(abs));
      var mant = abs / Math.pow(10, exp);
      if (mant >= 9.9995) {
        mant = 1;
        exp += 1;
      }
      var sign = n < 0 ? "-" : "";
      return sign + trimFixed(mant, 6) + "e" + exp;
    }
    return trimFixed(n, 6);
  }

  function parseNumber(s) {
    if (typeof s !== "string") s = String(s == null ? "" : s);
    var t = s.trim().replace(/\u2212/g, "-").replace(/,/g, "").replace(/\s+/g, "");
    if (!t || !/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(t)) return null;
    var n = Number(t);
    return isFinite(n) ? n : null;
  }

  function distToPos(dPc) {
    var logMin = Math.log10(DIST_MIN_PC);
    var logMax = Math.log10(DIST_MAX_PC);
    var t = (Math.log10(dPc) - logMin) / (logMax - logMin);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return t * SLIDER_MAX;
  }

  function posToDist(pos) {
    var t = pos / SLIDER_MAX;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    var logMin = Math.log10(DIST_MIN_PC);
    var logMax = Math.log10(DIST_MAX_PC);
    return Math.pow(10, logMin + t * (logMax - logMin));
  }

  function findScale(id) {
    for (var i = 0; i < SCALE.length; i++) {
      if (SCALE[i].id === id) return SCALE[i];
    }
    return SCALE[0];
  }

  function siriusDistancePc() {
    return pcFromParallax(FACT.siriusParallaxArcsec);
  }

  function siriusAbsolute() {
    return absoluteFromApparent(FACT.siriusV, siriusDistancePc());
  }

  return {
    FACT: FACT,
    SCALE: SCALE,
    LY_PER_PC: LY_PER_PC,
    LY_PER_PC_EXACT: LY_PER_PC_EXACT,
    AU_PER_PC: AU_PER_PC,
    DIST_MIN_PC: DIST_MIN_PC,
    DIST_MAX_PC: DIST_MAX_PC,
    DIST_TYPE_MIN_PC: DIST_TYPE_MIN_PC,
    DIST_TYPE_MAX_PC: DIST_TYPE_MAX_PC,
    SLIDER_MAX: SLIDER_MAX,
    DM_MIN: DM_MIN,
    DM_MAX: DM_MAX,
    DM_TYPE_MIN: DM_TYPE_MIN,
    DM_TYPE_MAX: DM_TYPE_MAX,
    M_MIN: M_MIN,
    M_MAX: M_MAX,
    M_TYPE_MIN: M_TYPE_MIN,
    M_TYPE_MAX: M_TYPE_MAX,
    fluxRatio: fluxRatio,
    fluxRatioHundred: fluxRatioHundred,
    deltaFromRatio: deltaFromRatio,
    distanceModulus: distanceModulus,
    apparent: apparent,
    absoluteFromApparent: absoluteFromApparent,
    parallaxArcsec: parallaxArcsec,
    pcFromParallax: pcFromParallax,
    lyFromPc: lyFromPc,
    pcFromLy: pcFromLy,
    auFromPc: auFromPc,
    pcFromAu: pcFromAu,
    distanceForApparent: distanceForApparent,
    sunAt10Pc: sunAt10Pc,
    sunAtAu: sunAtAu,
    visibility: visibility,
    formatMag: formatMag,
    formatAbs: formatAbs,
    formatRatio: formatRatio,
    formatPc: formatPc,
    formatLy: formatLy,
    formatAu: formatAu,
    formatParallax: formatParallax,
    formatPlain: formatPlain,
    formatDistancePair: formatDistancePair,
    parallaxIsStellar: parallaxIsStellar,
    numberInUnit: numberInUnit,
    pcFromUnit: pcFromUnit,
    inputString: inputString,
    parseNumber: parseNumber,
    distToPos: distToPos,
    posToDist: posToDist,
    findScale: findScale,
    siriusDistancePc: siriusDistancePc,
    siriusAbsolute: siriusAbsolute
  };
});
