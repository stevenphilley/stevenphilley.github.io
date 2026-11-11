/*! Planetary ring systems for a classroom desk.

    Ring edges, single radii, and widths are the NSSDCA ring fact
    sheets. A blank inner or outer edge stays null. It is not filled
    in from a width.

    Roche distances use the same coefficients as the Roche desk:
    d = 2.44 * R * (rho_planet / rho_satellite)^(1/3)
    d = 1.26 * R * (rho_planet / rho_satellite)^(1/3)
    R is the volumetric mean radius on the planet fact sheet.
    Equal density is ratio 1. Saturn at Rhea’s 1,240 kg/m³ is the
    pair the Roche desk already prints: 116,698 km and 60,262 km.

    The Mimas 2:1 radius uses Kepler’s third law with Mimas’s
    semimajor axis and Saturn’s GM. The satellite sheet’s printed
    period is cited beside that computation and is not substituted
    into it.

    Not an ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Rings = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var FLUID_K = 2.44;
  var RIGID_K = 1.26;
  var RATIO_MIN = 0.25;
  var RATIO_MAX = 4;
  var DAY_S = 86400;

  /* Saturn GM, Saturn Fact Sheet: 37.931 × 10^6 km^3/s^2. */
  var SATURN_GM = 37.931e6;
  /* Mimas semimajor axis, Saturnian Satellite Fact Sheet: 185.52 × 10^3 km. */
  var MIMAS_A_KM = 185520;
  var MIMAS_SHEET_PERIOD_DAYS = 0.9424218;

  function ring(name, inner, outer, printed) {
    return { name: name, inner: inner, outer: outer, printed: printed };
  }

  var PLANETS = {
    saturn: {
      id: "saturn",
      name: "Saturn",
      R: 58232,
      RLabel: "58,232 km",
      eq: 60268,
      eqLabel: "60,268 km",
      rho: 687,
      rhoLabel: "687 kg/m³",
      gm: SATURN_GM,
      gmLabel: "37.931 × 10^6 km³/s²",
      fill: "#ffe6b0",
      closeTo: MIMAS_A_KM,
      fullTo: 480000,
      rings: [
        ring("D", 66900, 74510, "Inner edge 66,900 km. Outer edge 74,510 km."),
        ring("C", 74658, 91975, "Inner edge 74,658 km. Outer edge 91,975 km."),
        ring("B", 91975, 117507, "Inner edge 91,975 km. Outer edge 117,507 km."),
        ring("Cassini Division", null, null, "The radius cell is blank. The B outer edge is 117,507 km and the A inner edge is 122,340 km."),
        ring("A", 122340, 136780, "Inner edge 122,340 km. Outer edge 136,780 km."),
        ring("F", 139826, null, "139,826 km. Rings narrower than 1,000 km are listed by inner edge. No outer edge is printed."),
        ring("G", 166000, 173000, "Inner edge 166,000 km. Outer edge 173,000 km."),
        ring("E", 180000, 480000, "Inner edge 180,000 km. Outer edge 480,000 km.")
      ],
      moons: [
        { name: "Prometheus", a: 139353, sheet: "139.353 × 10³ km", role: "Inner F-ring shepherd on the NASA Science moon page." },
        { name: "Pandora", a: 141700, sheet: "141.700 × 10³ km", role: "Near the F ring. NASA Science says Pandora tends to disrupt it." },
        { name: "Mimas", a: MIMAS_A_KM, sheet: "185.52 × 10³ km", role: "The 2:1 anchor. The sheet period is 0.9424218 days." }
      ],
      densities: [
        { id: "equal", label: "Equal density", ratio: 1 },
        { id: "rhea", label: "Rhea’s density", ratio: 687 / 1240, rhoS: 1240, rhoSLabel: "1,240 kg/m³" }
      ]
    },
    jupiter: {
      id: "jupiter",
      name: "Jupiter",
      R: 69911,
      RLabel: "69,911 km",
      eq: 71492,
      eqLabel: "71,492 km",
      rho: 1326,
      rhoLabel: "1,326 kg/m³",
      gm: null,
      fill: "#e2c39a",
      closeTo: 129000,
      fullTo: 280000,
      rings: [
        ring("Halo", 89400, 123000, "Radius cell 89,400–123,000 km."),
        ring("Main", 123000, 128940, "Radius cell 123,000–128,940 km."),
        ring("Amalthea", 128940, 181350, "Radius cell 128,940–181,350 km."),
        ring("Thebe", 181350, 221900, "Radius cell 181,350–221,900 km."),
        ring("Thebe extension", 221900, 280000, "Radius cell 221,900–280,000 km.")
      ],
      moons: [
        { name: "Metis", a: 128000, sheet: "128.0 × 10³ km", role: "NASA Science: inside the main ring, and a source of its material." },
        { name: "Adrastea", a: 129000, sheet: "129.0 × 10³ km", role: "NASA Science says inside the main ring. The sheet’s main-ring outer edge is 128,940 km." },
        { name: "Amalthea", a: 181400, sheet: "181.4 × 10³ km", role: "NASA Science: source material for the gossamer ring. Density 3,100 kg/m³." },
        { name: "Thebe", a: 221900, sheet: "221.9 × 10³ km", role: "NASA Science: source material for the gossamer ring. No density on the sheet." }
      ],
      densities: [
        { id: "equal", label: "Equal density", ratio: 1 },
        { id: "amalthea", label: "Amalthea’s density", ratio: 1326 / 3100, rhoS: 3100, rhoSLabel: "3,100 kg/m³" }
      ]
    },
    uranus: {
      id: "uranus",
      name: "Uranus",
      R: 25362,
      RLabel: "25,362 km",
      eq: 25559,
      eqLabel: "25,559 km",
      rho: 1270,
      rhoLabel: "1,270 kg/m³",
      gm: null,
      fill: "#b7e0dc",
      closeTo: null,
      fullTo: 97700,
      rings: [
        ring("6", null, null, "Radius 41,837 km. Width 1.5 km."),
        ring("5", null, null, "Radius 42,234 km. Width ~2 km."),
        ring("4", null, null, "Radius 42,571 km. Width ~2 km."),
        ring("Alpha", null, null, "Radius 44,718 km. Width 4–10 km."),
        ring("Beta", null, null, "Radius 45,661 km. Width 5–11 km."),
        ring("Eta", null, null, "Radius 47,176 km. Width 1.6 km."),
        ring("Gamma", null, null, "Radius 47,627 km. Width 1–4 km."),
        ring("Delta", null, null, "Radius 48,300 km. Width 3–7 km."),
        ring("Lambda", null, null, "Radius 50,024 km. Width ~2 km."),
        ring("Epsilon", null, null, "Radius 51,149 km. Width 20–96 km."),
        ring("R/2003 U 2", null, null, "Radius 67,300 km. Width 3,800 km."),
        ring("R/2003 U 1", null, null, "Radius 97,700 km. Width 17,000 km.")
      ],
      radii: {
        "6": 41837, "5": 42234, "4": 42571, Alpha: 44718, Beta: 45661, Eta: 47176,
        Gamma: 47627, Delta: 48300, Lambda: 50024, Epsilon: 51149,
        "R/2003 U 2": 67300, "R/2003 U 1": 97700
      },
      moons: [
        { name: "Cordelia", a: 49800, sheet: "49.80 × 10³ km", role: "NASA Science: a shepherd of the Epsilon ring, with Ophelia." },
        { name: "Ophelia", a: 53800, sheet: "53.80 × 10³ km", role: "NASA Science: a shepherd of the Epsilon ring, with Cordelia." }
      ],
      densities: [
        { id: "equal", label: "Equal density", ratio: 1 }
      ]
    },
    neptune: {
      id: "neptune",
      name: "Neptune",
      R: 24622,
      RLabel: "24,622 km",
      eq: 24764,
      eqLabel: "24,764 km",
      ringEq: 24766,
      ringEqLabel: "24,766 km",
      rho: 1638,
      rhoLabel: "1,638 kg/m³",
      gm: null,
      fill: "#8eb0e0",
      closeTo: null,
      fullTo: 62933,
      rings: [
        ring("Galle", null, null, "Radius ~41,900 km. Width ~2,000 km."),
        ring("LeVerrier", null, null, "Radius ~53,200 km. Width < 100 km."),
        ring("Lassell", null, null, "Radius ~53,200 km. Width ~4,000 km."),
        ring("Arago", null, null, "Radius ~57,200 km. Width cell blank. Optical-depth cell prints < 100."),
        ring("Unnamed", null, null, "Radius 61,953 km. No width."),
        ring("Adams", null, null, "Radius 62,933 km. Width ~15 km. The arcs are printed at this same radius.")
      ],
      radii: {
        Galle: 41900, LeVerrier: 53200, Lassell: 53200, Arago: 57200, Unnamed: 61953, Adams: 62933
      },
      moons: [
        { name: "Galatea", a: 61953, sheet: "61.953 × 10³ km", role: "NASA Science: just inward of the Adams arcs, and thought to stabilize them." }
      ],
      densities: [
        { id: "equal", label: "Equal density", ratio: 1 }
      ]
    }
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function group(n) {
    var neg = n < 0;
    var s = String(Math.abs(Math.round(n)));
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-" : "") + s;
  }

  function fmtKm(km) {
    if (km == null || !isFinite(km)) return "—";
    return group(km) + " km";
  }

  function limits(R, ratio) {
    var c = Math.pow(ratio, 1 / 3);
    return {
      ratio: ratio,
      cbrt: c,
      fluid: FLUID_K * R * c,
      rigid: RIGID_K * R * c
    };
  }

  function mimas() {
    var pSec = 2 * Math.PI * Math.sqrt(Math.pow(MIMAS_A_KM, 3) / SATURN_GM);
    var pHalf = pSec / 2;
    var a21 = Math.pow(SATURN_GM * pHalf * pHalf / (4 * Math.PI * Math.PI), 1 / 3);
    return {
      aKm: MIMAS_A_KM,
      gm: SATURN_GM,
      periodDays: pSec / DAY_S,
      a21: a21,
      a21Rounded: Math.round(a21),
      reduced: MIMAS_A_KM * Math.pow(0.5, 2 / 3),
      sheetPeriodDays: MIMAS_SHEET_PERIOD_DAYS
    };
  }

  function planetIds() {
    return ["saturn", "jupiter", "uranus", "neptune"];
  }

  function planetById(id) {
    return PLANETS[id] || null;
  }

  function densityById(planet, id) {
    var i;
    for (i = 0; i < planet.densities.length; i++) {
      if (planet.densities[i].id === id) return planet.densities[i];
    }
    return null;
  }

  function drawRadius(planet, item) {
    if (item.outer != null) return item.outer;
    if (item.inner != null) return item.inner;
    if (planet.radii && planet.radii[item.name] != null) return planet.radii[item.name];
    return null;
  }

  function spanReach(planet, span) {
    var edge = span === "close" && planet.closeTo ? planet.closeTo : planet.fullTo;
    return edge * 1.12;
  }

  function edgeWord(km, fluid) {
    if (km == null || !isFinite(km) || !isFinite(fluid)) return "has no single outer edge on the sheet";
    if (km < fluid) return "is inside this fluid distance";
    if (km > fluid) return "is outside this fluid distance";
    return "sits on this fluid distance";
  }

  function scene(state) {
    state = state || {};
    var planet = planetById(state.planet || "saturn");
    if (!planet) return { ok: false, error: "That planet is not on this desk." };
    var mode = state.mode || "equal";
    var ratio;
    var density = null;
    if (mode === "custom") {
      ratio = Number(state.ratio);
      if (!isFinite(ratio)) return { ok: false, error: "The density ratio needs a number." };
      ratio = clamp(ratio, RATIO_MIN, RATIO_MAX);
    } else if (mode === "equal") {
      ratio = 1;
      density = densityById(planet, "equal");
    } else {
      density = densityById(planet, mode);
      if (!density) return { ok: false, error: "That density is not on this planet’s sheet." };
      ratio = density.ratio;
    }
    var lim = limits(planet.R, ratio);
    var equal = limits(planet.R, 1);
    var rhea = planet.id === "saturn" ? limits(planet.R, 687 / 1240) : null;
    var span = (state.span === "full" || !planet.closeTo) ? "full" : "close";
    var reach = spanReach(planet, span);
    var mim = planet.id === "saturn" ? mimas() : null;
    var outerRing = planet.rings[planet.rings.length - 1];
    var outerKm = drawRadius(planet, outerRing);
    var modeLabel = mode === "equal" ? "equal density" : (mode === "custom" ? "slider" : (density ? density.label : mode));

    var why = planet.name + "’s volumetric mean radius is " + planet.RLabel + " and its mean density is " + planet.rhoLabel + ". ";
    why += "The fluid distance is 2.44 × R × (ratio)^(1/3). The rigid distance uses 1.26. ";
    why += "Equal density, ratio 1, puts them at " + fmtKm(equal.fluid) + " and " + fmtKm(equal.rigid) + ". ";
    if (rhea) {
      why += "Rhea’s 1,240 kg/m³, the Roche desk’s pair, puts them at " + fmtKm(rhea.fluid) + " and " + fmtKm(rhea.rigid) + ". ";
    }
    if (mode === "equal") {
      why += "The arcs use equal density. ";
    } else if (mode === "custom") {
      why += "The arcs use ratio " + ratio.toFixed(3) + ", a classroom what-if. The rings stay on the fact sheet. ";
    } else if (density && density.rhoSLabel) {
      why += "The arcs use " + density.label.toLowerCase() + ", " + density.rhoSLabel + ", ratio " + ratio.toFixed(3) + ". That density is the moon’s, not a measured ring-particle density. ";
    }
    why += "The outermost feature on the sheet, " + outerRing.name + ", " + edgeWord(outerKm, lim.fluid) + ". ";
    if (mim) {
      why += "Mimas is at " + fmtKm(mim.aKm) + ". Kepler with Saturn’s GM gives a period of " + mim.periodDays.toFixed(6) + " days. The sheet prints " + mim.sheetPeriodDays + " days. ";
      why += "The 2:1 radius, from the computed period halved and the same GM, is " + fmtKm(mim.a21) + ". ";
      why += "That is " + String(117507 - mim.a21Rounded) + " km inside the B ring’s outer edge at 117,507 km. ";
      why += "The Cassini division row has no radius. ";
    }
    why += "A dash is an edge the sheet does not print. Schematic, not an ephemeris.";

    var aria = "Schematic of " + planet.name + " and its rings, distances from the center. ";
    aria += "Fluid Roche " + fmtKm(lim.fluid) + ". Rigid Roche " + fmtKm(lim.rigid) + ". ";
    if (mim) aria += "Mimas 2:1 at " + fmtKm(mim.a21) + ". ";
    aria += "Not an ephemeris.";

    return {
      ok: true,
      planet: planet,
      mode: mode,
      modeLabel: modeLabel,
      ratio: ratio,
      span: span,
      reach: reach,
      fluid: lim.fluid,
      rigid: lim.rigid,
      equalFluid: equal.fluid,
      equalRigid: equal.rigid,
      rheaFluid: rhea ? rhea.fluid : null,
      rheaRigid: rhea ? rhea.rigid : null,
      mimas: mim,
      why: why,
      aria: aria,
      title: planet.name,
      tier: planet.name + " · " + modeLabel + " · schematic"
    };
  }

  return {
    FLUID_K: FLUID_K,
    RIGID_K: RIGID_K,
    RATIO_MIN: RATIO_MIN,
    RATIO_MAX: RATIO_MAX,
    SATURN_GM: SATURN_GM,
    MIMAS_A_KM: MIMAS_A_KM,
    MIMAS_SHEET_PERIOD_DAYS: MIMAS_SHEET_PERIOD_DAYS,
    PLANETS: PLANETS,
    planetIds: planetIds,
    planetById: planetById,
    limits: limits,
    mimas: mimas,
    fmtKm: fmtKm,
    drawRadius: drawRadius,
    scene: scene
  };
});
