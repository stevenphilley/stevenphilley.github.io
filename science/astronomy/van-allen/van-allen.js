/*! Van Allen belts: a classroom schematic of trapped particles.

    The altitude spans are quoted, not fitted to a flux model.

    NASA's 22 December 2021 Webb launch note says the inner belt ranges
    from about 400 to 6,000 miles (about 650 to 9,660 kilometers) above
    Earth's surface, and the outer belt stretches from 8,400 to 36,000
    miles (about 13,500 to 60,000 kilometers). The sliders only walk
    those two kilometer spans.

    NASA Science's Basics of Space Flight says the inner region is
    centered about 3,000 km above Earth's surface and the outer belt is
    centered about 15,000 to 20,000 km up. Those are presets inside the
    spans. They are not averaged with the ends.

    The equatorial mark is the Earth Fact Sheet radius, 6,378 km, plus
    the altitude, divided by 6,378 km. NASA's Scientific Visualization
    Studio says an L-shell identifies a dipole field line and that the
    number is the furthest distance from Earth in Earth radii. This file
    uses that sentence as the name of the mark. It is not an L catalog.

    The station mark is NASA Science's roughly 250 miles (400 km) on the
    auroras page. The Van Allen belts page says approximately 250 miles.
    The satellites desk uses a different cited altitude, about 420 km.

    Not a forecast, not a dose, and not a mission design. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VanAllen = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var INNER_NEAR_KM = 650;
  var INNER_FAR_KM = 9660;
  var OUTER_NEAR_KM = 13500;
  var OUTER_FAR_KM = 60000;
  var INNER_CENTER_KM = 3000;
  var OUTER_CENTER_LO_KM = 15000;
  var OUTER_CENTER_HI_KM = 20000;
  var INNER_NEAR_MI = 400;
  var INNER_FAR_MI = 6000;
  var OUTER_NEAR_MI = 8400;
  var OUTER_FAR_MI = 36000;
  var RE_KM = 6378;
  var ISS_KM = 400;
  var ISS_MILES = 250;
  var DIPOLE_DEG = 9.41;
  var SLIDER_STEPS = 1000;
  var COLUMN_BREAK_KM = 10000;
  var COLUMN_TOP_KM = 65000;
  var COLUMN_LOWER = 0.5;

  function clamp01(x) {
    if (x == null || !isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }

  function sameKm(a, b) {
    return a != null && b != null && isFinite(a) && isFinite(b) && Math.abs(a - b) < 0.05;
  }

  function formatKm(n) {
    if (n == null || !isFinite(n)) return "";
    var s = String(Math.round(n));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatRe(n) {
    if (n == null || !isFinite(n)) return "";
    return (Math.round(n * 1000) / 1000).toFixed(3);
  }

  function geocentricRe(km) {
    if (km == null || !isFinite(km)) return null;
    return (RE_KM + km) / RE_KM;
  }

  function kmOnSpan(near, far, slider) {
    var t = clamp01(slider / SLIDER_STEPS);
    return near + (far - near) * t;
  }

  function sliderForKm(near, far, km) {
    if (km == null || !isFinite(km) || far === near) return 0;
    return Math.round(clamp01((km - near) / (far - near)) * SLIDER_STEPS);
  }

  function innerKm(slider) {
    return kmOnSpan(INNER_NEAR_KM, INNER_FAR_KM, slider);
  }

  function outerKm(slider) {
    return kmOnSpan(OUTER_NEAR_KM, OUTER_FAR_KM, slider);
  }

  function torus(km0, km1) {
    var a = geocentricRe(km0);
    var b = geocentricRe(km1);
    return {
      innerRe: Math.min(a, b),
      outerRe: Math.max(a, b),
      centerRe: (a + b) / 2,
      tubeRe: Math.abs(b - a) / 2
    };
  }

  function dipolePoint(L, theta) {
    if (L == null || !isFinite(L) || L < 1 || theta == null || !isFinite(theta)) return null;
    var r = L * Math.sin(theta) * Math.sin(theta);
    return {
      r: r,
      xm: r * Math.sin(theta),
      zm: r * Math.cos(theta)
    };
  }

  function footTheta(L) {
    if (L == null || !isFinite(L) || L < 1) return null;
    return Math.asin(Math.min(1, 1 / Math.sqrt(L)));
  }

  function magToGeo(xm, zm) {
    if (xm == null || zm == null || !isFinite(xm) || !isFinite(zm)) return null;
    var tilt = DIPOLE_DEG * Math.PI / 180;
    return {
      x: xm * Math.cos(tilt) + zm * Math.sin(tilt),
      z: -xm * Math.sin(tilt) + zm * Math.cos(tilt)
    };
  }

  function columnFrac(km) {
    if (km == null || !isFinite(km) || km <= 0) return 0;
    if (km <= COLUMN_BREAK_KM) return COLUMN_LOWER * (km / COLUMN_BREAK_KM);
    var t = (km - COLUMN_BREAK_KM) / (COLUMN_TOP_KM - COLUMN_BREAK_KM);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return COLUMN_LOWER + (1 - COLUMN_LOWER) * t;
  }

  function reSentence(km) {
    return "The equatorial mark for that altitude is " + formatRe(geocentricRe(km)) + " Earth radii from the center: the fact sheet’s 6,378 km plus the altitude, divided by 6,378 km. NASA’s visualization note says an L-shell identifies a dipole field line, and that the number is the furthest distance from Earth in Earth radii. This page uses that sentence as the name of the mark. It is not an L catalog.";
  }

  function innerWhere(km) {
    if (sameKm(km, INNER_NEAR_KM)) return "the near end of the cited span";
    if (sameKm(km, INNER_FAR_KM)) return "the far end of the cited span";
    if (sameKm(km, INNER_CENTER_KM)) return "the cited center";
    return "between the cited ends";
  }

  function outerWhere(km) {
    if (sameKm(km, OUTER_NEAR_KM)) return "the near end of the cited span";
    if (sameKm(km, OUTER_FAR_KM)) return "the far end of the cited span";
    if (sameKm(km, OUTER_CENTER_LO_KM)) return "the near end of the cited center range";
    if (sameKm(km, OUTER_CENTER_HI_KM)) return "the far end of the cited center range";
    return "between the cited ends";
  }

  function milesClause(km, kind) {
    if (kind === "inner" && sameKm(km, INNER_NEAR_KM)) {
      return " The same sentence puts that near end at about 400 miles.";
    }
    if (kind === "inner" && sameKm(km, INNER_FAR_KM)) {
      return " The same sentence puts that far end at about 6,000 miles.";
    }
    if (kind === "outer" && sameKm(km, OUTER_NEAR_KM)) {
      return " The same sentence puts that near end at 8,400 miles.";
    }
    if (kind === "outer" && sameKm(km, OUTER_FAR_KM)) {
      return " The same sentence puts that far end at 36,000 miles.";
    }
    return " The miles in that NASA sentence belong to the two ends. This mark does not convert them.";
  }

  function readoutInner(km) {
    return "Inner marker at " + formatKm(km) + " km, " + innerWhere(km) + ". NASA’s Webb launch note says the inner belt ranges from about 400 to 6,000 miles (about 650 to 9,660 kilometers) above Earth’s surface. The slider only walks that kilometer span." + milesClause(km, "inner") + " " + reSentence(km) + " Not a flux model.";
  }

  function readoutOuter(km) {
    return "Outer marker at " + formatKm(km) + " km, " + outerWhere(km) + ". NASA’s Webb launch note says the outer belt stretches from 8,400 to 36,000 miles (about 13,500 to 60,000 kilometers) above Earth’s surface. The slider only walks that kilometer span." + milesClause(km, "outer") + " " + reSentence(km) + " Not a flux model.";
  }

  function innerSliderText(km) {
    if (sameKm(km, INNER_CENTER_KM)) return "Inner marker at about 3,000 km, the cited center. Not a flux model.";
    if (sameKm(km, INNER_NEAR_KM)) return "Inner marker at about 650 km, the near end. About 400 miles in the same sentence.";
    if (sameKm(km, INNER_FAR_KM)) return "Inner marker at about 9,660 km, the far end. About 6,000 miles in the same sentence.";
    return "Inner marker at " + formatKm(km) + " km, between the cited ends. Not a measured flux.";
  }

  function outerSliderText(km) {
    if (sameKm(km, OUTER_CENTER_LO_KM)) return "Outer marker at about 15,000 km, the near end of the cited center range.";
    if (sameKm(km, OUTER_CENTER_HI_KM)) return "Outer marker at about 20,000 km, the far end of the cited center range.";
    if (sameKm(km, OUTER_NEAR_KM)) return "Outer marker at about 13,500 km, the near end. 8,400 miles in the same sentence.";
    if (sameKm(km, OUTER_FAR_KM)) return "Outer marker at about 60,000 km, the far end. 36,000 miles in the same sentence.";
    return "Outer marker at " + formatKm(km) + " km, between the cited ends. Not a measured flux.";
  }

  function innerPreset(km) {
    if (sameKm(km, INNER_NEAR_KM)) return "near";
    if (sameKm(km, INNER_CENTER_KM)) return "center";
    if (sameKm(km, INNER_FAR_KM)) return "far";
    return "";
  }

  function outerPreset(km) {
    if (sameKm(km, OUTER_NEAR_KM)) return "near";
    if (sameKm(km, OUTER_CENTER_LO_KM)) return "center-lo";
    if (sameKm(km, OUTER_CENTER_HI_KM)) return "center-hi";
    if (sameKm(km, OUTER_FAR_KM)) return "far";
    return "";
  }

  function stationSentence() {
    return "The station mark is NASA Science’s roughly 250 miles (400 km) on the auroras page. The Van Allen belts page says the station’s low-Earth orbit is approximately 250 miles. Those two sentences sit below the Webb note’s inner edge, about 400 miles (about 650 km). The comparison is those sentences side by side. The satellites desk uses a different cited altitude, about 420 km, and this page does not use it. Not a dose.";
  }

  function slotSentence() {
    return "The unmarked gap in the drawing runs from the inner span’s far end, about 9,660 km, to the outer span’s near end, about 13,500 km. That is the two quoted ranges placed next to each other. NASA’s caption says the slot region is the gap between Earth’s two radiation belts. The same caption says the slot region is thought to have less radiation than other parts of near-Earth space, but it is highly variable. The drawn gap is not a measured width of that slot.";
  }

  function saaSentence() {
    return "NASA’s ICON article says an unusually weak spot in the field over South America and the southern Atlantic Ocean, called the South Atlantic Anomaly, allows particles to dip closer to the surface than normal. The same article says the forces in the core and the tilt of the magnetic axis together produce the anomaly, allowing charged particles trapped in Earth’s magnetic field to dip closer to the surface. Basics of Space Flight says the inner belt has a portion called the South Atlantic Anomaly which extends down into low-Earth-orbital altitudes. No dip distance is printed in those sentences, and none is drawn here. Not a hazard map.";
  }

  function detail(mode, inner, outer) {
    var ik = inner;
    var ok = outer;
    var stats = [
      ["Inner range", "about 650–9,660 km"],
      ["Outer range", "about 13,500–60,000 km"],
      ["Inner marker", formatKm(ik) + " km · " + formatRe(geocentricRe(ik)) + " Earth radii"],
      ["Outer marker", formatKm(ok) + " km · " + formatRe(geocentricRe(ok)) + " Earth radii"],
      ["Station", "about 400 km · roughly 250 miles"],
      ["Dipole drawn", "9.41° · WMM2020, NOAA NCEI"]
    ];
    if (mode === "saa") {
      return {
        tier: "South Atlantic Anomaly · a note",
        title: "Closer, and no dip is drawn",
        range: "Classroom note · not a map",
        why: saaSentence() + " The ICON article also says the International Space Station passes through the anomaly, that the station is well protected, and that astronauts are safe from harm while inside. That is the article’s sentence. This page does not map a pass and does not compute a dose. The lobes stay on the quoted altitude spans.",
        stats: stats
      };
    }
    if (mode === "inner") {
      return {
        tier: sameKm(ik, INNER_CENTER_KM) ? "Basics of Space Flight · inner center" : "Inner span · classroom slider",
        title: sameKm(ik, INNER_CENTER_KM) ? "About 3,000 km" : "The inner marker",
        range: formatKm(ik) + " km · " + innerWhere(ik),
        why: readoutInner(ik) + " Basics of Space Flight says the inner region, consisting largely of protons with an energy greater than 30 million eV, is centered about 3,000 km above Earth’s surface. The lobe stays the full Webb span. The marker is the only thing the slider moves.",
        stats: stats
      };
    }
    if (mode === "outer") {
      return {
        tier: (sameKm(ok, OUTER_CENTER_LO_KM) || sameKm(ok, OUTER_CENTER_HI_KM)) ? "Basics of Space Flight · outer centers" : "Outer span · classroom slider",
        title: "The outer marker",
        range: formatKm(ok) + " km · " + outerWhere(ok),
        why: readoutOuter(ok) + " Basics of Space Flight says the outer belt is centered about 15,000 to 20,000 km up, and that it contains electrons with energies in the hundreds of millions of eV. The lobe stays the full Webb span. The marker is the only thing the slider moves.",
        stats: stats
      };
    }
    return {
      tier: "Two cited spans · a torus sketch",
      title: "Trapped, not forecast",
      range: "Inner about 650–9,660 km · outer about 13,500–60,000 km",
      why: "The drawing is a noon–midnight cut. Each belt is a circle on either side of Earth, a torus seen edge-on. The inner circle’s equatorial reach is NASA’s about 650 to 9,660 km. The outer circle’s reach is about 13,500 to 60,000 km. The height of each circle off the equator equals that radial reach, so the lobe can be drawn. It is not a measured cross-section. " + slotSentence() + " " + stationSentence() + " Field lines are a dipole sketch at the equatorial distances of those edges, tilted 9.41°, NOAA NCEI’s WMM2020 inclination, the same angle as the aurora desk. The direction of that tilt in this cut is a sketch. The fact sheet’s dipole offset of 0.076 Re is not drawn. Nothing here is a forecast.",
      stats: stats
    };
  }

  function limitsNote() {
    return "Educational schematic. Not a radiation forecast, not a dose calculator, not a mission design tool, and not a live belt model. NASA’s Webb launch note says the inner belt ranges from about 400 to 6,000 miles (about 650 to 9,660 kilometers) above Earth’s surface, and the outer belt stretches from 8,400 to 36,000 miles (about 13,500 to 60,000 kilometers). The sliders only walk those two kilometer spans. A mark between the ends is the slider. It is not a measured flux. Basics of Space Flight centers the inner region about 3,000 km up and the outer belt about 15,000 to 20,000 km up. Those centers are presets. They are not averaged with the range ends. The slot drawn here is the gap between the two quoted ranges. The caption calls that slot highly variable. NASA’s Van Allen Probes write-up says the three regions can look different depending on electron energy, and that during geomagnetic storms the slot can fill with lower-energy electrons. This drawing does not change with energy and does not fill the slot. The station mark is about 400 km, roughly 250 miles. The column breaks at 10,000 km so the station and the inner belt can be read, and it stops at 65,000 km so the outer end is not the rim. Neither number is a belt boundary. The South Atlantic Anomaly is a cited note. No dip distance is drawn.";
  }

  return {
    INNER_NEAR_KM: INNER_NEAR_KM,
    INNER_FAR_KM: INNER_FAR_KM,
    OUTER_NEAR_KM: OUTER_NEAR_KM,
    OUTER_FAR_KM: OUTER_FAR_KM,
    INNER_CENTER_KM: INNER_CENTER_KM,
    OUTER_CENTER_LO_KM: OUTER_CENTER_LO_KM,
    OUTER_CENTER_HI_KM: OUTER_CENTER_HI_KM,
    INNER_NEAR_MI: INNER_NEAR_MI,
    INNER_FAR_MI: INNER_FAR_MI,
    OUTER_NEAR_MI: OUTER_NEAR_MI,
    OUTER_FAR_MI: OUTER_FAR_MI,
    RE_KM: RE_KM,
    ISS_KM: ISS_KM,
    ISS_MILES: ISS_MILES,
    DIPOLE_DEG: DIPOLE_DEG,
    SLIDER_STEPS: SLIDER_STEPS,
    COLUMN_BREAK_KM: COLUMN_BREAK_KM,
    COLUMN_TOP_KM: COLUMN_TOP_KM,
    COLUMN_LOWER: COLUMN_LOWER,
    clamp01: clamp01,
    sameKm: sameKm,
    formatKm: formatKm,
    formatRe: formatRe,
    geocentricRe: geocentricRe,
    kmOnSpan: kmOnSpan,
    sliderForKm: sliderForKm,
    innerKm: innerKm,
    outerKm: outerKm,
    torus: torus,
    dipolePoint: dipolePoint,
    footTheta: footTheta,
    magToGeo: magToGeo,
    columnFrac: columnFrac,
    readoutInner: readoutInner,
    readoutOuter: readoutOuter,
    innerSliderText: innerSliderText,
    outerSliderText: outerSliderText,
    innerPreset: innerPreset,
    outerPreset: outerPreset,
    stationSentence: stationSentence,
    slotSentence: slotSentence,
    saaSentence: saaSentence,
    detail: detail,
    limitsNote: limitsNote
  };
});
