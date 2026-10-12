/*! Angular size: δ = 2·arctan(d / 2D), and the small-angle d/D.
    Lengths inside this file are kilometers unless a function says meters.
    Moon diameter is twice the Moon Fact Sheet volumetric mean radius.
    Moon perigee, apogee, and semimajor axis are that sheet's orbital table.
    Sun diameter is twice the Sun Fact Sheet volumetric mean radius.
    Perihelion, aphelion, and semimajor axis are the Earth Fact Sheet.
    Everyday presets are approximate examples, not fact-sheet measurements.
    Classroom schematic, not an ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AngularSize = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var FACT = {
    moonVolumetricMeanRadiusKm: 1737.4,
    moonEquatorialRadiusKm: 1738.1,
    moonDiameterKm: 3474.8,
    moonPerigeeKm: 363300,
    moonApogeeKm: 405500,
    moonSmaKm: 384400,
    moonMeanOppositionKm: 378000,
    moonApparentArcsecAtOpposition: 1896,
    moonFootnoteNearKm: 357000,
    moonFootnoteFarKm: 407000,
    sunVolumetricMeanRadiusKm: 695700,
    sunDiameterKm: 1391400,
    earthPerihelionKm: 147095000,
    earthAphelionKm: 152100000,
    earthSmaKm: 149598000,
    sunSheetMinKm: 147100000,
    sunSheetMaxKm: 152100000,
    sunSheetMeanKm: 149600000,
    sunApparentArcsecMax: 1952,
    sunApparentArcsecMin: 1887,
    sunApparentArcsecAt1AU: 1919
  };

  var SHEET = {
    moonPerigee: "0.3633 × 10⁶ km",
    moonApogee: "0.4055 × 10⁶ km",
    moonSma: "0.3844 × 10⁶ km",
    earthPerihelion: "147.095 × 10⁶ km",
    earthAphelion: "152.100 × 10⁶ km",
    earthSma: "149.598 × 10⁶ km"
  };

  /* Slider domain in meters. Fact-sheet and everyday presets sit inside it. */
  var DIAM_MIN_M = 0.001;
  var DIAM_MAX_M = 2e9;
  var DIST_MIN_M = 0.05;
  var DIST_MAX_M = 3e11;
  /* 10,000 steps across 5 cm to 300 million km. One step is about 0.3%. */
var SLIDER_MAX = 10000;

  var UNITS = { mm: 0.001, cm: 0.01, m: 1, km: 1000 };

  function kmToM(km) { return km * 1000; }

  function angularDiameterRad(d, D) {
    return 2 * Math.atan(d / (2 * D));
  }

  function smallAngleRad(d, D) {
    return d / D;
  }

  function trimZeros(s) {
    if (s.indexOf(".") < 0) return s;
    return s.replace(/0+$/, "").replace(/\.$/, "");
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var out = parts[0];
    if (digits > 0) {
      var frac = trimZeros(parts[1] ? "." + parts[1] : "");
      out += frac;
    }
    return (neg ? "−" : "") + out;
  }

function formatKm(km) {
  var digits = Math.abs(km - Math.round(km)) < 1e-6 ? 0 : 1;
  return group(km, digits) + " km";
}

function formatMeters(m) {
  var abs = Math.abs(m);
  if (abs >= 1000) return formatKm(m / 1000);
  if (abs >= 1) return group(m, 2) + " m";
  if (abs >= 0.01) return group(m / 0.01, 2) + " cm";
  return group(m / 0.001, 2) + " mm";
}

  function breakdown(rad) {
    var deg = rad * 180 / Math.PI;
    var arcmin = deg * 60;
    var arcsec = deg * 3600;
    var sign = deg < 0 ? "−" : "";
    var ad = Math.abs(deg);
    var d = Math.floor(ad + 1e-10);
    var mFull = (ad - d) * 60;
    var m = Math.floor(mFull + 1e-10);
    var s = (mFull - m) * 60;
    if (s >= 59.995) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    return {
      rad: rad,
      deg: deg,
      arcmin: arcmin,
      arcsec: arcsec,
      degText: sign + ad.toFixed(4) + "°",
      arcminText: sign + Math.abs(arcmin).toFixed(3) + "′",
      arcsecText: sign + Math.abs(arcsec).toFixed(2) + "″",
      sexText: sign + d + "° " + m + "′ " + s.toFixed(2) + "″",
      radText: (rad < 0 ? "−" : "") + Math.abs(rad).toFixed(8) + " rad"
    };
  }

  function describe(d, D) {
    var ok = d > 0 && D > 0 && isFinite(d) && isFinite(D);
    if (!ok) {
      return { ok: false, inside: false };
    }
    var exactRad = angularDiameterRad(d, D);
    var approxRad = smallAngleRad(d, D);
    var relPct = (approxRad - exactRad) / exactRad * 100;
    return {
      ok: true,
      inside: D <= d / 2,
      exactRad: exactRad,
      approxRad: approxRad,
      exact: breakdown(exactRad),
      approx: breakdown(approxRad),
      relPct: relPct
    };
  }

  function describeKm(dKm, DKm) {
    return describe(dKm, DKm);
  }

  function ratio(d1, D1, d2, D2) {
    return angularDiameterRad(d1, D1) / angularDiameterRad(d2, D2);
  }

  function matchDistance(dCover, dTarget, distTarget) {
    return dCover * distTarget / dTarget;
  }

  function eclipseKind(value) {
    if (!(value > 0) || !isFinite(value)) return "unknown";
    if (value > 1) return "total";
    if (value < 1) return "annular";
    return "boundary";
  }

  function formatRatio(value) {
    return value.toFixed(4);
  }

  function formatPct(value, digits) {
    return value.toFixed(digits) + "%";
  }

  function relSentence(relPct) {
    var a = Math.abs(relPct);
    if (a < 0.00005) return "d/D matches the exact angle at this display.";
    var digits = a < 0.01 ? 4 : 3;
    var body = a.toFixed(digits);
    var dir = relPct > 0 ? "above" : "below";
    return "d/D sits " + body + "% " + dir + " the exact angle.";
  }

  function posToValue(pos, min, max) {
    var t = Math.max(0, Math.min(SLIDER_MAX, pos)) / SLIDER_MAX;
    return Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
  }

  function valueToPos(v, min, max) {
    if (!(v > 0)) return 0;
    var t = (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.round(t * SLIDER_MAX);
  }

  function inputString(meters, unit) {
    var scale = UNITS[unit] || 1;
    var v = meters / scale;
    if (!isFinite(v)) return "";
    if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
    return trimZeros(v.toFixed(6));
  }

  function parseToMeters(str, unit) {
    var t = String(str == null ? "" : str).replace(/,/g, "").replace(/−/g, "-").trim();
    if (!t) return null;
    var n = Number(t);
    if (!isFinite(n) || n <= 0) return null;
    var scale = UNITS[unit];
    if (!scale) return null;
    return n * scale;
  }

  var PRESETS = [
    {
      id: "moon-perigee",
      label: "Moon perigee",
      approximate: false,
      dKm: FACT.moonDiameterKm,
      DKm: FACT.moonPerigeeKm,
      dUnit: "km",
      DUnit: "km",
      title: "Moon at mean perigee",
      tier: "Moon fact sheet · mean perigee",
      note: "Diameter 3,474.8 km, twice the volumetric mean radius 1,737.4 km. Distance 0.3633 × 10⁶ km, the table’s mean perigee."
    },
    {
      id: "moon-apogee",
      label: "Moon apogee",
      approximate: false,
      dKm: FACT.moonDiameterKm,
      DKm: FACT.moonApogeeKm,
      dUnit: "km",
      DUnit: "km",
      title: "Moon at mean apogee",
      tier: "Moon fact sheet · mean apogee",
      note: "Same diameter, 3,474.8 km. Distance 0.4055 × 10⁶ km, the table’s mean apogee."
    },
    {
      id: "moon-mean",
      label: "Moon mean",
      approximate: false,
      dKm: FACT.moonDiameterKm,
      DKm: FACT.moonSmaKm,
      dUnit: "km",
      DUnit: "km",
      title: "Moon at semimajor axis",
      tier: "Moon fact sheet · semimajor axis",
      note: "Same diameter, 3,474.8 km. Distance 0.3844 × 10⁶ km, the semimajor axis."
    },
    {
      id: "sun-perihelion",
      label: "Sun perihelion",
      approximate: false,
      dKm: FACT.sunDiameterKm,
      DKm: FACT.earthPerihelionKm,
      dUnit: "km",
      DUnit: "km",
      title: "Sun at perihelion",
      tier: "Sun and Earth fact sheets · perihelion",
      note: "Diameter 1,391,400 km, twice the Sun’s volumetric mean radius 695,700 km. Distance 147.095 × 10⁶ km, Earth’s perihelion."
    },
    {
      id: "sun-aphelion",
      label: "Sun aphelion",
      approximate: false,
      dKm: FACT.sunDiameterKm,
      DKm: FACT.earthAphelionKm,
      dUnit: "km",
      DUnit: "km",
      title: "Sun at aphelion",
      tier: "Sun and Earth fact sheets · aphelion",
      note: "Same solar diameter, 1,391,400 km. Distance 152.100 × 10⁶ km, Earth’s aphelion."
    },
    {
      id: "sun-mean",
      label: "Sun mean",
      approximate: false,
      dKm: FACT.sunDiameterKm,
      DKm: FACT.earthSmaKm,
      dUnit: "km",
      DUnit: "km",
      title: "Sun at Earth’s semimajor axis",
      tier: "Sun and Earth fact sheets · semimajor axis",
      note: "Same solar diameter, 1,391,400 km. Distance 149.598 × 10⁶ km, Earth’s semimajor axis."
    },
    {
      id: "thumb",
      label: "Thumb, approx.",
      approximate: true,
      dKm: 0.00002,
      DKm: 0.00057,
      dUnit: "cm",
      DUnit: "cm",
      title: "Thumb at arm’s length",
      tier: "Approximate example · not a fact sheet",
      note: "A thumb about 2 cm wide, held about 57 cm away. 57 cm is the convenient length where 1 cm subtends about 1°. Not a measured hand."
    },
    {
      id: "coin",
      label: "Coin, approx.",
      approximate: true,
      dKm: 0.000024,
      DKm: 0.0007,
      dUnit: "cm",
      DUnit: "cm",
      title: "A coin at arm’s length",
      tier: "Approximate example · not a fact sheet",
      note: "A coin about 2.4 cm across, held about 70 cm away. Approximate example. Several times the Moon."
    },
    {
      id: "half-degree",
      label: "0.5° rule",
      approximate: true,
      dKm: 0.000005,
      DKm: 0.00057,
      dUnit: "mm",
      DUnit: "cm",
      title: "The half-degree rule",
      tier: "Approximate example · not a fact sheet",
      note: "A 5 mm mark at about 57 cm. Approximate example of the half-degree rule of thumb: about the Moon, about the Sun."
    }
  ];

  var MOON_DISTANCES = [
    { id: "perigee", label: "Perigee", km: FACT.moonPerigeeKm, sheet: SHEET.moonPerigee },
    { id: "mean", label: "Mean", km: FACT.moonSmaKm, sheet: SHEET.moonSma },
    { id: "apogee", label: "Apogee", km: FACT.moonApogeeKm, sheet: SHEET.moonApogee }
  ];

  var SUN_DISTANCES = [
    { id: "perihelion", label: "Perihelion", km: FACT.earthPerihelionKm, sheet: SHEET.earthPerihelion },
    { id: "mean", label: "Mean", km: FACT.earthSmaKm, sheet: SHEET.earthSma },
    { id: "aphelion", label: "Aphelion", km: FACT.earthAphelionKm, sheet: SHEET.earthAphelion }
  ];

  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  function moonSizeNote() {
    var peri = describeKm(FACT.moonDiameterKm, FACT.moonPerigeeKm);
    var apo = describeKm(FACT.moonDiameterKm, FACT.moonApogeeKm);
    var near = describeKm(FACT.moonDiameterKm, FACT.moonFootnoteNearKm);
    var far = describeKm(FACT.moonDiameterKm, FACT.moonFootnoteFarKm);
    var diameterRatio = peri.exactRad / apo.exactRad;
    var footnoteRatio = near.exactRad / far.exactRad;
    return {
      perigee: peri,
      apogee: apo,
      diameterRatio: diameterRatio,
      diameterPct: (diameterRatio - 1) * 100,
      areaRatio: diameterRatio * diameterRatio,
      areaPct: (diameterRatio * diameterRatio - 1) * 100,
      footnoteRatio: footnoteRatio,
      footnotePct: (footnoteRatio - 1) * 100
    };
  }

  function comparePair(moonKm, sunKm) {
    var moon = describeKm(FACT.moonDiameterKm, moonKm);
    var sun = describeKm(FACT.sunDiameterKm, sunKm);
    var value = moon.exactRad / sun.exactRad;
    return {
      moon: moon,
      sun: sun,
      ratio: value,
      kind: eclipseKind(value),
      matchKm: matchDistance(FACT.moonDiameterKm, FACT.sunDiameterKm, sunKm)
    };
  }

  return {
    FACT: FACT,
    SHEET: SHEET,
    PRESETS: PRESETS,
    MOON_DISTANCES: MOON_DISTANCES,
    SUN_DISTANCES: SUN_DISTANCES,
    UNITS: UNITS,
    DIAM_MIN_M: DIAM_MIN_M,
    DIAM_MAX_M: DIAM_MAX_M,
    DIST_MIN_M: DIST_MIN_M,
    DIST_MAX_M: DIST_MAX_M,
    SLIDER_MAX: SLIDER_MAX,
    kmToM: kmToM,
    angularDiameterRad: angularDiameterRad,
    smallAngleRad: smallAngleRad,
    breakdown: breakdown,
    describe: describe,
    describeKm: describeKm,
    ratio: ratio,
    matchDistance: matchDistance,
    eclipseKind: eclipseKind,
    formatRatio: formatRatio,
    formatPct: formatPct,
    formatKm: formatKm,
    formatMeters: formatMeters,
    relSentence: relSentence,
    group: group,
    posToValue: posToValue,
    valueToPos: valueToPos,
    inputString: inputString,
    parseToMeters: parseToMeters,
    presetById: presetById,
    moonSizeNote: moonSizeNote,
    comparePair: comparePair
  };
});
