/*! Equilibrium temperature beside the NASA fact-sheet temperatures.
    Fast rotator: T_eq = [L (1−A) / (16 π σ d²)]^(1/4), emissivity 1.
    Slow rotator uses 2 in place of 4. Classroom energy balance, not a climate model.
    Sheet numbers are not averaged with this arithmetic. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Temperatures = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Defined SI constants. σ = 2π⁵k⁴ / (15 h³ c²). Same computation as the blackbody desk. */
  var H = 6.62607015e-34;
  var C = 299792458;
  var K = 1.380649e-23;

  /* NASA NSSDCA Sun Fact Sheet, luminosity (10^24 J/s). Same digits as the IAU 2015 nominal luminosity. */
  var L_SUN_W = 382.8e24;

  /* NASA NSSDCA fact-sheet notes: 1 AU = 149,597,870.7 km. */
  var AU_M = 149597870700;

  /* NASA NSSDCA Earth Fact Sheet. Used when a sheet prints this irradiance, not as a replacement for L. */
  var S_EARTH_WM2 = 1361.0;

  var AU_MIN = 0.3;
  var AU_MAX = 50;
  var ALBEDO_MIN = 0;
  var ALBEDO_MAX = 1;

  var sigmaCache = 0;

  function sigma() {
    if (sigmaCache) return sigmaCache;
    sigmaCache = (2 * Math.pow(Math.PI, 5) * Math.pow(K, 4)) / (15 * Math.pow(H, 3) * Math.pow(C, 2));
    return sigmaCache;
  }

  /* Sunlight at distance d, watts per square metre. d is in AU. */
  function fluxFromL(au) {
    var d = au * AU_M;
    return L_SUN_W / (4 * Math.PI * d * d);
  }

  /* factor 4: fast rotator, whole surface. factor 2: slow rotator, dayside hemisphere. */
  function equilibriumFromFlux(flux, albedo, factor) {
    var absorbed = flux * (1 - albedo) / factor;
    if (!(absorbed > 0)) return 0;
    return Math.pow(absorbed / sigma(), 0.25);
  }

  function equilibrium(au, albedo, slow) {
    if (!(au > 0)) return NaN;
    return equilibriumFromFlux(fluxFromL(au), albedo, slow ? 2 : 4);
  }

  function equilibriumFromIrradiance(flux, albedo, slow) {
    if (!(flux > 0)) return NaN;
    return equilibriumFromFlux(flux, albedo, slow ? 2 : 4);
  }

  function round1(t) {
    return Number(t.toFixed(1));
  }

  function celsius(k) {
    return k - 273.15;
  }

  function fahrenheit(k) {
    return celsius(k) * 9 / 5 + 32;
  }

  function trimFixed(v, digits) {
    return v.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function signed(v, digits) {
    var body = Math.abs(v).toFixed(digits);
    return (v < 0 ? "−" : "") + body;
  }

  function formatK(t) {
    if (!isFinite(t)) return "";
    return t.toFixed(1);
  }

  function formatC(k) {
    if (!isFinite(k)) return "";
    return signed(celsius(k), 1);
  }

  function formatF(k) {
    if (!isFinite(k)) return "";
    return signed(fahrenheit(k), 1);
  }

  function formatAu(au) {
    if (!(au > 0) || !isFinite(au)) return "";
    if (au >= 10) return trimFixed(au, 5);
    if (au >= 1) return trimFixed(au, 6);
    return trimFixed(au, 8);
  }

  function formatAlbedo(a) {
    if (!isFinite(a)) return "";
    return a.toFixed(3);
  }

  function formatFlux(w) {
    if (!isFinite(w)) return "";
    if (w >= 100) return w.toFixed(1);
    if (w >= 10) return w.toFixed(2);
    if (w >= 1) return w.toFixed(3);
    return w.toFixed(3);
  }

  /*
    Cited from each body's NASA NSSDCA fact sheet, read as the body column
    (not the Earth column and not the ratio column).
    measured: a single printed temperature, or null when the sheet does not print one.
    range: a printed span, when that is what the sheet prints instead of a mean.
    comparisonC: the comparison table of 18 March 2025, mean temperature in °C.
    au is the J2000 semimajor axis, except the Moon, which has no heliocentric axis on its sheet.
  */
  var BODIES = [
    {
      id: "mercury",
      name: "Mercury",
      kind: "planet",
      swatch: "#c4b8a5",
      albedo: 0.068,
      albedoLabel: "0.068",
      au: 0.38709893,
      auLabel: "0.38709893",
      irradiance: 9082.7,
      irradianceLabel: "9082.7",
      blackbody: 439.6,
      blackbodyLabel: "439.6",
      measured: { k: 440, label: "440 K (167 C)", role: "Average temperature" },
      range: "590–725 K, sunward side",
      comparisonC: "167",
      updated: "11 January 2024",
      distanceNote: ""
    },
    {
      id: "venus",
      name: "Venus",
      kind: "planet",
      swatch: "#e6c27a",
      albedo: 0.77,
      albedoLabel: "0.77",
      au: 0.72333199,
      auLabel: "0.72333199",
      irradiance: 2601.3,
      irradianceLabel: "2601.3",
      blackbody: 226.6,
      blackbodyLabel: "226.6",
      measured: { k: 737, label: "737 K (464 C)", role: "Average temperature" },
      range: "",
      comparisonC: "464",
      updated: "11 January 2024",
      distanceNote: ""
    },
    {
      id: "earth",
      name: "Earth",
      kind: "planet",
      swatch: "#6ea4b8",
      albedo: 0.294,
      albedoLabel: "0.294",
      au: 1.00000011,
      auLabel: "1.00000011",
      irradiance: 1361.0,
      irradianceLabel: "1361.0",
      blackbody: 254.0,
      blackbodyLabel: "254.0",
      measured: { k: 288, label: "288 K (15 C)", role: "Average temperature" },
      range: "",
      comparisonC: "15",
      updated: "15 November 2024",
      distanceNote: ""
    },
    {
      id: "moon",
      name: "Moon",
      kind: "moon",
      swatch: "#c5c3bc",
      albedo: 0.11,
      albedoLabel: "0.11",
      au: 1.00000011,
      auLabel: "1.00000011",
      irradiance: 1361.0,
      irradianceLabel: "1361.0",
      blackbody: 270.4,
      blackbodyLabel: "270.4",
      measured: null,
      range: "95 K to 390 K",
      comparisonC: "−20",
      updated: "11 January 2024",
      distanceNote: "The Moon sheet prints solar irradiance 1361.0 W/m², the same figure as Earth, and does not print a heliocentric semimajor axis. This distance is Earth’s J2000 axis. The sheet’s 0.3844 × 10^6 km is the Earth–Moon distance and is not d."
    },
    {
      id: "mars",
      name: "Mars",
      kind: "planet",
      swatch: "#c47a55",
      albedo: 0.250,
      albedoLabel: "0.250",
      au: 1.52366231,
      auLabel: "1.52366231",
      irradiance: 586.2,
      irradianceLabel: "586.2",
      blackbody: 209.8,
      blackbodyLabel: "209.8",
      measured: { k: 214, label: "~214 K (−59 C)", role: "Average temperature" },
      range: "",
      comparisonC: "−65",
      updated: "19 May 2025",
      distanceNote: ""
    },
    {
      id: "jupiter",
      name: "Jupiter",
      kind: "giant",
      swatch: "#d4b48a",
      albedo: 0.343,
      albedoLabel: "0.343",
      au: 5.20336301,
      auLabel: "5.20336301",
      irradiance: 50.26,
      irradianceLabel: "50.26",
      blackbody: 109.9,
      blackbodyLabel: "109.9",
      measured: { k: 165, label: "165 K (−108 C)", role: "Temperature at 1 bar" },
      range: "",
      comparisonC: "−110",
      updated: "2 October 2024",
      distanceNote: ""
    },
    {
      id: "saturn",
      name: "Saturn",
      kind: "giant",
      swatch: "#e2d2a8",
      albedo: 0.342,
      albedoLabel: "0.342",
      au: 9.53707032,
      auLabel: "9.53707032",
      irradiance: 14.82,
      irradianceLabel: "14.82",
      blackbody: 81.0,
      blackbodyLabel: "81.0",
      measured: { k: 134, label: "134 K (−139 C)", role: "Temperature at 1 bar" },
      range: "",
      comparisonC: "−140",
      updated: "18 March 2025",
      distanceNote: "The J2000 axis is 9.53707032 AU. The ratio column is 9.573. The bulk semimajor axis is 1,432.041 × 10^6 km. They are not averaged. This formula uses the J2000 axis."
    },
    {
      id: "uranus",
      name: "Uranus",
      kind: "giant",
      swatch: "#8fd0d2",
      albedo: 0.300,
      albedoLabel: "0.300",
      au: 19.19126393,
      auLabel: "19.19126393",
      irradiance: 3.69,
      irradianceLabel: "3.69",
      blackbody: 58.1,
      blackbodyLabel: "58.1",
      measured: { k: 76, label: "76 K (−197 C)", role: "Temperature at 1 bar" },
      range: "",
      comparisonC: "−195",
      updated: "2 October 2024",
      distanceNote: ""
    },
    {
      id: "neptune",
      name: "Neptune",
      kind: "giant",
      swatch: "#5b7fd1",
      albedo: 0.290,
      albedoLabel: "0.290",
      au: 30.06896348,
      auLabel: "30.06896348",
      irradiance: 1.508,
      irradianceLabel: "1.508",
      blackbody: 46.6,
      blackbodyLabel: "46.6",
      measured: { k: 72, label: "72 K (−201 C)", role: "Temperature at 1 bar" },
      range: "",
      comparisonC: "−200",
      updated: "3 October 2024",
      distanceNote: ""
    },
    {
      id: "pluto",
      name: "Pluto",
      kind: "dwarf",
      swatch: "#c9b7c4",
      albedo: 0.72,
      albedoLabel: "0.72",
      au: 39.48168677,
      auLabel: "39.48168677",
      irradiance: 0.873,
      irradianceLabel: "0.873",
      blackbody: 37.5,
      blackbodyLabel: "37.5",
      measured: null,
      range: "24 to 38 K (−247 to −233 C)",
      comparisonC: "−225",
      updated: "11 January 2024",
      distanceNote: "The J2000 axis is 39.48168677 AU. The ratio column is 39.236. The bulk semimajor axis is 5,869.656 × 10^6 km. They are not averaged. This formula uses the J2000 axis."
    }
  ];

  function bodyById(id) {
    var i;
    for (i = 0; i < BODIES.length; i++) if (BODIES[i].id === id) return BODIES[i];
    return null;
  }

  function clampAu(au) {
    if (!(au > 0)) return AU_MIN;
    if (au < AU_MIN) return AU_MIN;
    if (au > AU_MAX) return AU_MAX;
    return au;
  }

  function clampAlbedo(a) {
    if (!isFinite(a)) return 0;
    if (a < ALBEDO_MIN) return ALBEDO_MIN;
    if (a > ALBEDO_MAX) return ALBEDO_MAX;
    return a;
  }

  function auFromSlider(v) {
    var t = Math.min(1, Math.max(0, v / 10000));
    return AU_MIN * Math.pow(AU_MAX / AU_MIN, t);
  }

  function sliderFromAu(au) {
    var t = Math.log(au / AU_MIN) / Math.log(AU_MAX / AU_MIN);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.round(t * 10000);
  }

  function gap(measuredK, other) {
    if (measuredK === null || measuredK === undefined || !isFinite(other)) return null;
    return round1(measuredK - other);
  }

  function formatGap(g) {
    if (g === null || !isFinite(g)) return "—";
    return signed(g, 1) + " K";
  }

  function sub1(a, b) {
    return signed(a - b, 1).replace(/\.0$/, "");
  }

  function reading(body, teqRounded, fromSheetRounded) {
    var lines = [];
    if (!body) {
      lines.push("No fact-sheet row is selected. The sliders are not a measurement.");
      return lines;
    }
    var same = teqRounded === body.blackbody;
    if (same) {
      lines.push("At the fast divisor, rounded to the sheet’s decimal place, this arithmetic is " + teqRounded.toFixed(1) + " K, the same digits as the black-body temperature " + body.blackbodyLabel + " K. The two are not averaged.");
    } else {
      lines.push("At the fast divisor, this arithmetic rounds to " + teqRounded.toFixed(1) + " K. The sheet’s black-body temperature is " + body.blackbodyLabel + " K. " + teqRounded.toFixed(1) + " does not round to " + body.blackbodyLabel + ". They are not averaged.");
    }
    if (fromSheetRounded !== teqRounded) {
      lines.push("The fast divisor with the sheet’s irradiance, " + body.irradianceLabel + " W/m², rounds to " + fromSheetRounded.toFixed(1) + " K. That figure stays beside the luminosity arithmetic. They are not averaged.");
    } else {
      lines.push("The fast divisor with the sheet’s irradiance, " + body.irradianceLabel + " W/m², also rounds to " + fromSheetRounded.toFixed(1) + " K.");
    }
    if (body.measured) {
      var sheetGap = sub1(body.measured.k, body.blackbody);
      var arithGap = sub1(body.measured.k, teqRounded);
      if (body.id === "earth") {
        lines.push("The average temperature is 288 K (15 C). 288 minus 254.0 is " + sheetGap + ". 288 minus " + teqRounded.toFixed(1) + " is " + arithGap + ". Those two subtractions are not averaged. The gap is greenhouse warming, which this formula leaves out.");
      } else if (body.id === "venus") {
        lines.push("The average temperature is 737 K (464 C). 737 minus " + body.blackbodyLabel + " is " + sheetGap + ". The sheet’s near-surface atmosphere is 96.5% carbon dioxide, at 92 bars. This formula does not use those figures. The gap is the greenhouse excess this model leaves out.");
      } else if (body.id === "mars") {
        lines.push("The average temperature is ~214 K (−59 C). The tilde is the sheet’s. 214 minus " + body.blackbodyLabel + " is " + sheetGap + ". The comparison table prints −65 °C, which is not −59. They are not averaged. The difference is small beside Venus.");
      } else if (body.id === "mercury") {
        lines.push("The average temperature is 440 K (167 C). 440 minus " + body.blackbodyLabel + " is " + sheetGap + ". The sunward side is 590 to 725 K. The comparison notes say that average is a day-and-night mean and is not representative of any given region. Surface pressure is less than about 5 × 10^−15 bar. That " + sheetGap + " K is not read here as a greenhouse excess.");
      } else if (body.kind === "giant") {
        lines.push(body.measured.role + " is " + body.measured.label + ". " + body.measured.k + " minus " + body.blackbodyLabel + " is " + sheetGap + ". NASA Science says the giant planets emit more energy than they receive from the Sun. This kelvin gap is not that energy ratio, and it is not a greenhouse excess.");
      }
    } else if (body.id === "moon") {
      lines.push("The Moon sheet does not print an average temperature. The diurnal range at the equator is 95 K to 390 K. The comparison table prints −20 °C. This page does not subtract −20 from 270.4. There is no single greenhouse gap to print.");
    } else if (body.id === "pluto") {
      lines.push("The sheet prints a surface temperature of 24 to 38 K (−247 to −233 C), not a single average. The comparison table prints −225 °C. This page does not subtract −225 from 37.5, and it does not subtract the range from " + teqRounded.toFixed(1) + ". The formula with Bond albedo 0.72 does not return 37.5.");
    }
    if (body.distanceNote) lines.push(body.distanceNote);
    return lines;
  }

  function scene(opts) {
    opts = opts || {};
    var slow = !!opts.slow;
    var greenhouse = !!opts.greenhouse;
    var body = opts.body ? bodyById(opts.body) : null;
    var au = body ? body.au : clampAu(opts.au);
    var albedo = body ? body.albedo : clampAlbedo(opts.albedo);
    var factor = slow ? 2 : 4;
    var teq = equilibrium(au, albedo, slow);
    var teqFast = equilibrium(au, albedo, false);
    var fromSheet = body ? equilibriumFromIrradiance(body.irradiance, body.albedo, slow) : null;
    var teqFastR = round1(teqFast);
    var fromFast = body ? equilibriumFromIrradiance(body.irradiance, body.albedo, false) : null;
    var fromFastR = fromFast === null ? null : round1(fromFast);
    var flux = fluxFromL(au);
    var name = body ? body.name : "Custom";
    var lines = [];
    lines.push(slow
      ? "Slow rotator. The divisor is 2: the dayside hemisphere emits what the cross-section absorbs."
      : "Fast rotator. The divisor is 4: the whole surface emits what the cross-section absorbs.");
    lines.push("L is the Sun sheet’s 382.8 × 10^24 W. d is " + (body ? body.auLabel : formatAu(au)) + " AU. Bond albedo is " + (body ? body.albedoLabel : formatAlbedo(albedo)) + ". Emissivity is 1.");
    lines.push("This arithmetic is " + formatK(teq) + " K, which is " + formatC(teq) + " °C and " + formatF(teq) + " °F.");
    if (slow) {
      lines.push("The fast-rotator number at these inputs is " + formatK(teqFast) + " K. The sheet’s black-body temperature, where a row is selected, is not recomputed with the 2.");
    }
    if (greenhouse) {
      lines.push("The blanket on the drawing is a picture of infrared turned back. It does not add a term to the formula.");
    }
    reading(body, teqFastR, fromFastR).forEach(function (line) {
      lines.push(line);
    });
    lines.push("Classroom energy-balance model, not a climate model.");
    var why = lines.join(" ");

    var measuredLabel = "—";
    var measuredRole = "Measured";
    if (body && body.measured) {
      measuredLabel = body.measured.label;
      measuredRole = body.measured.role;
    } else if (body && body.range) {
      measuredLabel = body.range;
      measuredRole = body.id === "moon" ? "Diurnal range" : "Surface temperature";
    }

    var gapBb = body && body.measured ? gap(body.measured.k, body.blackbody) : null;
    var gapArith = body && body.measured ? gap(body.measured.k, teqFastR) : null;

    var stats = [
      ["Distance", (body ? body.auLabel : formatAu(au)) + " AU"],
      ["Bond albedo", body ? body.albedoLabel : formatAlbedo(albedo)],
      ["Divisor", String(factor) + (slow ? " · slow" : " · fast")],
      ["This arithmetic", formatK(teq) + " K · " + formatC(teq) + " °C · " + formatF(teq) + " °F"],
      ["Sunlight here", formatFlux(flux) + " W/m²"]
    ];
    if (body) {
      stats.push(["Sheet irradiance, this divisor", body.irradianceLabel + " W/m² → " + formatK(fromSheet) + " K"]);
      stats.push(["Sheet black-body", body.blackbodyLabel + " K"]);
      stats.push([measuredRole, measuredLabel]);
      stats.push(["Measured minus black-body", formatGap(gapBb)]);
      stats.push(["Measured minus this fast arithmetic", formatGap(gapArith)]);
      stats.push(["Comparison table", body.comparisonC + " °C"]);
    }

    var aria = name + ". Equilibrium temperature " + formatK(teq) + " kelvin, " + (slow ? "slow rotator, divisor 2" : "fast rotator, divisor 4") + ". Bond albedo " + (body ? body.albedoLabel : formatAlbedo(albedo)) + ". " + (greenhouse ? "A greenhouse blanket is drawn and is not in the formula. " : "") + "Classroom energy-balance model, not a climate model.";

    return {
      ok: isFinite(teq),
      body: body,
      title: name,
      tier: body ? (body.kind === "giant" ? "Giant planet · 1 bar is not a greenhouse gap" : body.kind === "moon" ? "Moon · no mean temperature on the sheet" : body.kind === "dwarf" ? "Dwarf planet · surface is a range" : "Planet · sunlight only beside the sheet") : "Custom distance and albedo",
      range: formatK(teq) + " K · " + formatC(teq) + " °C · " + formatF(teq) + " °F",
      why: why,
      aria: aria,
      stats: stats,
      au: au,
      albedo: albedo,
      slow: slow,
      greenhouse: greenhouse,
      factor: factor,
      teq: teq,
      teqFast: teqFast,
      fromSheet: fromSheet,
      flux: flux,
      swatch: body ? body.swatch : "#c8b48a"
    };
  }

  return {
    H: H,
    C: C,
    K: K,
    L_SUN_W: L_SUN_W,
    AU_M: AU_M,
    S_EARTH_WM2: S_EARTH_WM2,
    AU_MIN: AU_MIN,
    AU_MAX: AU_MAX,
    sigma: sigma,
    fluxFromL: fluxFromL,
    equilibrium: equilibrium,
    equilibriumFromIrradiance: equilibriumFromIrradiance,
    round1: round1,
    celsius: celsius,
    fahrenheit: fahrenheit,
    formatK: formatK,
    formatC: formatC,
    formatF: formatF,
    formatAu: formatAu,
    formatAlbedo: formatAlbedo,
    formatFlux: formatFlux,
    formatGap: formatGap,
    BODIES: BODIES,
    bodyById: bodyById,
    clampAu: clampAu,
    clampAlbedo: clampAlbedo,
    auFromSlider: auFromSlider,
    sliderFromAu: sliderFromAu,
    gap: gap,
    scene: scene
  };
});
