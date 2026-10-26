/*! Asteroid and comet impact literacy.
    Kinetic energy, Collins et al. (2005) pi-scaling crater diameters,
    and their Earth-average recurrence fit. Not an airburst model and
    not a hazard assessment.

    Collins, G. S., Melosh, H. J., and Marcus, R. A. (2005) Earth Impact
    Effects Program. Meteoritics & Planetary Science 40, 817–840.
    Equation numbers below are that paper's starred equations.

    Classroom calculator. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Impacts = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Surface gravity in the crater scaling. Collins et al. write g_E and
     do not print a value. 9.81 m/s² is the conventional figure. The Earth
     Fact Sheet mean is 9.820 m/s². The −0.22 power makes that gap negligible. */
  var G_E = 9.81;

  /* 1 megaton of TNT. Collins et al. print 4.18 × 10^15 J. This desk uses
     4.184 × 10^15 J. Brown et al. (2013) use 4.185 × 10^12 J per kiloton,
     which is 4.185 × 10^15 J per megaton. The three differ by about 0.1%. */
  var MT_J = 4.184e15;
  var MT_J_PAPER = 4.18e15;

  /* Eq. 21 leading constant. Rock 1.161; water 1.365 (Schmidt and Housen
     1987, as cited). The paper says these constants are a best estimate
     inside a range of 0.8 to 1.5, not known to three decimals. */
  var C_ROCK = 1.161;
  var C_WATER = 1.365;
  var C_LOW = 0.8;
  var C_HIGH = 1.5;

  /* Simple-to-complex transition. D_c = 3.2 km. Complex scaling (eq. 27)
     is used when the transient diameter is greater than 2.56 km. Both
     thresholds are Collins et al. Eq. 22 is D_fr ≈ 1.25 D_tc for simple
     craters. Eq. 27 is D_fr = 1.17 D_tc^1.13 / D_c^0.13, diameters in km. */
  var D_C_KM = 3.2;
  var D_TC_COMPLEX_KM = 2.56;
  var SIMPLE_FACTOR = 1.25;
  var COMPLEX_FACTOR = 1.17;
  var COMPLEX_EXP = 1.13;

  /* Their atmospheric-entry procedure is applied only below 1 km.
     Above that, they say entry has no significant influence. The
     gravity-regime crater scaling is for craters larger than a couple
     of hundred meters. */
  var ENTRY_LIMIT_M = 1000;
  var GRAVITY_REGIME_M = 200;

  /* Slider ends. Diameter is about 1 m to 15 km, on a log slider.
     Speed runs from the program's 11.2 km/s minimum template to the
     72 km/s solar-bound maximum in the paper. Angle is measured from
     the horizontal, as in the paper. */
  var D_MIN = 1;
  var D_MAX = 15000;
  var SLIDER_STEPS = 1000;
  var V_MIN = 11.2;
  var V_MAX = 72;
  var V_ESCAPE_FACTSHEET = 11.186;
  var ANGLE_MIN = 5;
  var ANGLE_MAX = 90;
  var ANGLE_DEFAULT = 45;
  var V_TYPICAL = 17;

  /* Earth Fact Sheet volumetric mean radius, 6,371.000 km.
     Used only as a familiar length on the drawing. */
  var EARTH_DIAMETER_M = 2 * 6371000;

  /* Density templates are the Earth Impact Effects Program's list.
     The 2005 paper gives ranges: rock about 2000–3000 kg/m³ (Hilton
     2002), iron about 8000, comets about 500–1500 (Chapman and Brandt
     2004). The strength-density relation was established over
     1000–8000 kg/m³. */
  var DENSITIES = [
    { id: "ice", name: "Ice · comet", density: 1000, strength: "weak" },
    { id: "porous", name: "Porous rock", density: 1500, strength: "weak" },
    { id: "dense", name: "Dense rock", density: 3000, strength: "intermediate" },
    { id: "iron", name: "Iron", density: 8000, strength: "strong" }
  ];

  /* Target densities are assigned in the paper: sedimentary 2500,
     crystalline 2750, water 1000. A marine target in the program also
     has a rock seafloor at 2700 under a water depth. This desk has no
     water-depth input, so "water" is only the water-layer scaling. */
  var TARGETS = [
    { id: "sedimentary", name: "Sedimentary rock", density: 2500, water: false },
    { id: "crystalline", name: "Crystalline rock", density: 2750, water: false },
    { id: "water", name: "Water", density: 1000, water: true }
  ];

  /* Familiar lengths from the program's diameter templates, plus two
     cited lengths used as scale bars. The program's Chelyabinsk
     template is 20 m. JPL's estimates for the 2013 asteroid are not 20 m. */
  var SCALES = [
    { id: "bus", name: "Double-decker bus", meters: 5, kind: "template" },
    { id: "chelyabinsk-template", name: "Chelyabinsk template", meters: 20, kind: "template" },
    { id: "nelson", name: "Nelson's Column", meters: 52, kind: "template" },
    { id: "queens", name: "Queen's Tower", meters: 87, kind: "template" },
    { id: "wembley", name: "Wembley Stadium", meters: 320, kind: "template" },
    { id: "nevis", name: "Ben Nevis", meters: 1300, kind: "template" },
    { id: "jersey", name: "Jersey", meters: 10000, kind: "template" },
    { id: "wight", name: "Isle of Wight", meters: 20000, kind: "template" },
    { id: "barringer-rim", name: "Barringer rim", meters: 1186, kind: "crater" },
    { id: "chicxulub-structure", name: "Chicxulub structure", meters: 200000, kind: "crater" },
    { id: "earth", name: "Earth diameter", meters: EARTH_DIAMETER_M, kind: "planet" }
  ];

  /* Cited anchors for the energy line. Each number is a published
     figure, not a result of this scaling. */
  var ENERGY_REFS = [
    {
      id: "chelyabinsk-jpl",
      name: "Chelyabinsk, JPL additional details",
      mt: 0.44,
      note: "440 kilotons"
    },
    {
      id: "chelyabinsk-update",
      name: "Chelyabinsk, JPL same-day update",
      mt: 0.5,
      note: "nearly 500 kilotons"
    },
    {
      id: "chelyabinsk-brown",
      name: "Chelyabinsk, Brown et al. 2013",
      mt: 0.5,
      mtLow: 0.4,
      mtHigh: 0.6,
      note: "500 ± 100 kilotons"
    },
    {
      id: "tunguska",
      name: "Tunguska workshop",
      mt: 15,
      mtLow: 10,
      mtHigh: 20,
      note: "10–20 megatons"
    },
    {
      id: "barringer-2016",
      name: "Barringer, Collins et al. 2016 via Kring",
      mt: 8.6,
      note: "8.6 megatons at the surface"
    },
    {
      id: "chicxulub",
      name: "Chicxulub, Morgan et al. 2022",
      joules: 1e23,
      note: "about 10^23 joules"
    }
  ];

  /* Presets set the sliders. The page states which inputs are a published
     estimate and which are program defaults. Do not treat a button as a
     unique reconstruction. */
  var PRESETS = [
    {
      id: "chelyabinsk",
      name: "Chelyabinsk",
      year: "2013",
      diameterM: 18,
      densityId: "dense",
      velocityKms: 18.6,
      angleDeg: 45,
      targetId: "sedimentary"
    },
    {
      id: "tunguska",
      name: "Tunguska",
      year: "1908",
      diameterM: 50,
      densityId: "dense",
      velocityKms: 17,
      angleDeg: 45,
      targetId: "sedimentary"
    },
    {
      id: "barringer",
      name: "Barringer",
      year: "Meteor Crater",
      diameterM: 42,
      densityId: "iron",
      velocityKms: 15,
      angleDeg: 45,
      targetId: "sedimentary"
    },
    {
      id: "chicxulub",
      name: "Chicxulub",
      year: "K–Pg",
      diameterM: 14000,
      densityId: "dense",
      velocityKms: 17,
      angleDeg: 45,
      targetId: "sedimentary"
    }
  ];

  function densityById(id) {
    var i;
    for (i = 0; i < DENSITIES.length; i++) if (DENSITIES[i].id === id) return DENSITIES[i];
    return null;
  }
  function targetById(id) {
    var i;
    for (i = 0; i < TARGETS.length; i++) if (TARGETS[i].id === id) return TARGETS[i];
    return null;
  }
  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }
  function finitePositive(n) {
    return typeof n === "number" && isFinite(n) && n > 0;
  }

  function massKg(diameterM, density) {
    if (!finitePositive(diameterM) || !finitePositive(density)) return null;
    return (Math.PI / 6) * density * diameterM * diameterM * diameterM;
  }

  function kineticEnergyJ(mass, velocityMps) {
    if (!finitePositive(mass) || !finitePositive(velocityMps)) return null;
    return 0.5 * mass * velocityMps * velocityMps;
  }

  function megatons(joules) {
    if (!finitePositive(joules)) return null;
    return joules / MT_J;
  }

  /* Eq. 3. TRE ≈ 109 E^0.78 years, E in megatons. A fit to the NEO
     Science Definition Team (2003) size distribution, whole Earth. */
  function recurrenceYears(mt) {
    if (!finitePositive(mt)) return null;
    return 109 * Math.pow(mt, 0.78);
  }

  function leadingConstant(target) {
    return target && target.water ? C_WATER : C_ROCK;
  }

  /* Eq. 21. D_tc in meters. L in m, v in m/s, densities in kg/m³,
     θ from the horizontal. Proportional to sin^(1/3) θ. */
  function transientDiameterM(input) {
    var target = targetById(input && input.targetId);
    var L = input && input.diameterM;
    var rho = input && input.density;
    var vKms = input && input.velocityKms;
    var angle = input && input.angleDeg;
    if (!target || !finitePositive(L) || !finitePositive(rho) || !finitePositive(vKms)) return null;
    if (!(angle >= ANGLE_MIN && angle <= ANGLE_MAX)) return null;
    var v = vKms * 1000;
    var theta = angle * Math.PI / 180;
    var s = Math.sin(theta);
    if (!(s > 0)) return null;
    var C = leadingConstant(target);
    return C
      * Math.pow(rho / target.density, 1 / 3)
      * Math.pow(L, 0.78)
      * Math.pow(v, 0.44)
      * Math.pow(G_E, -0.22)
      * Math.pow(s, 1 / 3);
  }

  function finalFromTransient(transientM, water) {
    if (!finitePositive(transientM)) return null;
    if (water) {
      return {
        kind: "water",
        transientM: transientM,
        finalM: null
      };
    }
    var dtcKm = transientM / 1000;
    if (dtcKm > D_TC_COMPLEX_KM) {
      var dfrKm = COMPLEX_FACTOR * Math.pow(dtcKm, COMPLEX_EXP) / Math.pow(D_C_KM, 0.13);
      return {
        kind: "complex",
        transientM: transientM,
        finalM: dfrKm * 1000
      };
    }
    return {
      kind: "simple",
      transientM: transientM,
      finalM: SIMPLE_FACTOR * transientM
    };
  }

  /* The paper's 0.8–1.5 range on the leading constant, mapped through
     the same exponents. Not a full uncertainty. */
  function constantBand(nominalM, cNominal, complex) {
    if (!finitePositive(nominalM) || !finitePositive(cNominal)) return null;
    function at(c) {
      var ratio = c / cNominal;
      if (complex) return nominalM * Math.pow(ratio, COMPLEX_EXP);
      return nominalM * ratio;
    }
    return { lowM: at(C_LOW), highM: at(C_HIGH) };
  }

  /* Qualitative only. No airburst altitude. */
  function entryClass(diameterM, density) {
    var row = null;
    var i;
    for (i = 0; i < DENSITIES.length; i++) {
      if (DENSITIES[i].density === density) row = DENSITIES[i];
    }
    var strength = row ? row.strength : (density >= 8000 ? "strong" : (density <= 1500 ? "weak" : "intermediate"));
    if (!(diameterM > 0)) return null;
    return {
      regime: diameterM >= ENTRY_LIMIT_M ? "entry-neglected" : "may-disrupt",
      strength: strength,
      entryLimitM: ENTRY_LIMIT_M
    };
  }

  function nearestScale(diameterM) {
    if (!finitePositive(diameterM)) return null;
    var best = null;
    var bestScore = Infinity;
    var i;
    for (i = 0; i < SCALES.length; i++) {
      var score = Math.abs(Math.log(diameterM / SCALES[i].meters));
      if (score < bestScore) {
        bestScore = score;
        best = SCALES[i];
      }
    }
    return best;
  }

  function closestEnergyRef(mt, joules) {
    if (!finitePositive(mt)) return null;
    var best = null;
    var bestScore = Infinity;
    var i;
    for (i = 0; i < ENERGY_REFS.length; i++) {
      var ref = ENERGY_REFS[i];
      var refMt = ref.mt;
      if (ref.joules) refMt = ref.joules / MT_J;
      if (!finitePositive(refMt)) continue;
      var score = Math.abs(Math.log(mt / refMt));
      if (score < bestScore) {
        bestScore = score;
        best = { ref: ref, ratio: mt / refMt, refMt: refMt };
      }
    }
    return best;
  }

  function rangesContaining(mt) {
    var hits = [];
    var i;
    if (!finitePositive(mt)) return hits;
    for (i = 0; i < ENERGY_REFS.length; i++) {
      var ref = ENERGY_REFS[i];
      if (finitePositive(ref.mtLow) && finitePositive(ref.mtHigh) && mt >= ref.mtLow && mt <= ref.mtHigh) {
        hits.push(ref);
      }
    }
    return hits;
  }

  function compute(input) {
    var target = targetById(input && input.targetId);
    var L = input && input.diameterM;
    var rho = input && input.density;
    var vKms = input && input.velocityKms;
    var angle = input && input.angleDeg;
    if (!target || !finitePositive(L) || !finitePositive(rho) || !finitePositive(vKms)) return null;
    if (!(angle >= ANGLE_MIN && angle <= ANGLE_MAX)) return null;
    if (L < D_MIN || L > D_MAX || vKms < V_ESCAPE_FACTSHEET || vKms > V_MAX) return null;
    var mass = massKg(L, rho);
    var joules = kineticEnergyJ(mass, vKms * 1000);
    var mt = megatons(joules);
    var mtPaper = joules / MT_J_PAPER;
    var dtc = transientDiameterM(input);
    var crater = finalFromTransient(dtc, target.water);
    if (!crater) return null;
    var C = leadingConstant(target);
    var shown = crater.finalM == null ? crater.transientM : crater.finalM;
    var complex = crater.kind === "complex";
    var band = constantBand(shown, C, complex);
    var transientBand = constantBand(crater.transientM, C, false);
    return {
      massKg: mass,
      joules: joules,
      megatons: mt,
      megatonsPaper: mtPaper,
      recurrenceYears: recurrenceYears(mt),
      crater: crater,
      constantBand: band,
      transientBand: transientBand,
      entry: entryClass(L, rho),
      gravityRegime: shown >= GRAVITY_REGIME_M,
      scale: nearestScale(shown),
      energyRef: closestEnergyRef(mt, joules),
      energyRanges: rangesContaining(mt),
      target: target,
      leadingConstant: C
    };
  }

  function diameterFromSlider(step) {
    var t = Math.max(0, Math.min(SLIDER_STEPS, step)) / SLIDER_STEPS;
    return Math.exp(Math.log(D_MIN) + t * Math.log(D_MAX / D_MIN));
  }

  function sliderFromDiameter(diameterM) {
    if (!finitePositive(diameterM)) return 0;
    var t = Math.log(diameterM / D_MIN) / Math.log(D_MAX / D_MIN);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.round(t * SLIDER_STEPS);
  }

  function fmtTrim(n, digits) {
    var s = n.toFixed(digits);
    return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function groupInt(n) {
    var neg = n < 0;
    var s = String(Math.round(Math.abs(n)));
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + s;
  }

  function sci(n, digits) {
    if (!isFinite(n) || n === 0) return "0";
    var neg = n < 0;
    var exp = Math.floor(Math.log(Math.abs(n)) / Math.LN10);
    var mant = Math.abs(n) / Math.pow(10, exp);
    var ms = fmtTrim(mant, digits);
    if (ms === "10") {
      ms = "1";
      exp += 1;
    }
    return (neg ? "−" : "") + ms + "×10^" + exp;
  }

  function fmtMeters(m) {
    if (m == null || typeof m !== "number" || !isFinite(m)) return "—";
    var sign = m < 0 ? "−" : "";
    var a = Math.abs(m);
    if (a >= 1000) {
      var km = a / 1000;
      if (km >= 100) return sign + groupInt(km) + " km";
      if (km >= 10) return sign + fmtTrim(km, 1) + " km";
      return sign + fmtTrim(km, 2) + " km";
    }
    if (a >= 100) return sign + groupInt(a) + " m";
    if (a >= 10) return sign + fmtTrim(a, 1) + " m";
    return sign + fmtTrim(a, 2) + " m";
  }

  function fmtMass(kg) {
    if (!finitePositive(kg)) return "—";
    if (kg >= 1e6 || kg < 1) return sci(kg, 3) + " kg";
    return groupInt(kg) + " kg";
  }

  function fmtJoules(j) {
    if (!finitePositive(j)) return "—";
    if (j >= 1e7) return sci(j, 3) + " J";
    return groupInt(j) + " J";
  }

  function fmtMegatons(mt) {
    if (!finitePositive(mt)) return "—";
    if (mt >= 10000) return sci(mt, 3) + " Mt";
    if (mt >= 100) return groupInt(mt) + " Mt";
    if (mt >= 10) return fmtTrim(mt, 1) + " Mt";
    if (mt >= 1) return fmtTrim(mt, 2) + " Mt";
    var kt = mt * 1000;
    if (kt >= 1) return fmtTrim(kt, kt >= 100 ? 0 : 1) + " kt";
    return sci(mt, 2) + " Mt";
  }

  function fmtYears(years) {
    if (!finitePositive(years)) return "—";
    if (years >= 1e9) return sci(years, 2) + " years";
    if (years >= 1e6) return fmtTrim(years / 1e6, 2) + " million years";
    if (years >= 10000) return groupInt(years) + " years";
    if (years >= 100) return groupInt(years) + " years";
    if (years >= 10) return fmtTrim(years, 0) + " years";
    return fmtTrim(years, 1) + " years";
  }

  return {
    G_E: G_E,
    MT_J: MT_J,
    MT_J_PAPER: MT_J_PAPER,
    C_ROCK: C_ROCK,
    C_WATER: C_WATER,
    C_LOW: C_LOW,
    C_HIGH: C_HIGH,
    D_C_KM: D_C_KM,
    D_TC_COMPLEX_KM: D_TC_COMPLEX_KM,
    SIMPLE_FACTOR: SIMPLE_FACTOR,
    COMPLEX_FACTOR: COMPLEX_FACTOR,
    COMPLEX_EXP: COMPLEX_EXP,
    ENTRY_LIMIT_M: ENTRY_LIMIT_M,
    GRAVITY_REGIME_M: GRAVITY_REGIME_M,
    D_MIN: D_MIN,
    D_MAX: D_MAX,
    SLIDER_STEPS: SLIDER_STEPS,
    V_MIN: V_MIN,
    V_MAX: V_MAX,
    V_ESCAPE_FACTSHEET: V_ESCAPE_FACTSHEET,
    V_TYPICAL: V_TYPICAL,
    ANGLE_MIN: ANGLE_MIN,
    ANGLE_MAX: ANGLE_MAX,
    ANGLE_DEFAULT: ANGLE_DEFAULT,
    EARTH_DIAMETER_M: EARTH_DIAMETER_M,
    DENSITIES: DENSITIES,
    TARGETS: TARGETS,
    SCALES: SCALES,
    ENERGY_REFS: ENERGY_REFS,
    PRESETS: PRESETS,
    densityById: densityById,
    targetById: targetById,
    presetById: presetById,
    massKg: massKg,
    kineticEnergyJ: kineticEnergyJ,
    megatons: megatons,
    recurrenceYears: recurrenceYears,
    transientDiameterM: transientDiameterM,
    finalFromTransient: finalFromTransient,
    constantBand: constantBand,
    entryClass: entryClass,
    nearestScale: nearestScale,
    compute: compute,
    diameterFromSlider: diameterFromSlider,
    sliderFromDiameter: sliderFromDiameter,
    fmtMeters: fmtMeters,
    fmtMass: fmtMass,
    fmtJoules: fmtJoules,
    fmtMegatons: fmtMegatons,
    fmtYears: fmtYears,
    fmtTrim: fmtTrim,
    sci: sci
  };
});
