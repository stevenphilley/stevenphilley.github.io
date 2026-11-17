/*! Mean density and a side readout of surface gravity.
    ρ = M / (4/3 π R³)
    g = G M / R²
    Mass and radius are the NASA NSSDCA fact-sheet lines.
    The sheet’s mean density stays beside the arithmetic.
    They are not averaged. Not an interior model. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Density = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* 2022 CODATA, the same G the escape desk uses for a custom mass
     and the scale-height desk uses for Titan’s GM/r².
     Presets multiply this G by the printed mass. They do not
     substitute the sheet’s GM. */
  var G = 6.67430e-11;

  /* Earth sheet, 15 November 2024. The Earth-unit sliders divide by
     these two lines. The comparison table’s 5.97 × 10^24 kg is not
     the unit. */
  var EARTH_MASS_KG = 5.9722e24;
  var EARTH_RADIUS_M = 6371.000 * 1000;

  /* StarChild densities page: water is 1 gram per cubic centimeter.
     1 g/cm³ = 1000 kg/m³. A reference line, not a fact-sheet density. */
  var WATER_KG_M3 = 1000;
  /* Reference marks on the chart. Not fact-sheet densities. */
  var ROCK_G_CM3 = 3;
  var IRON_G_CM3 = 7.9;

  /* Wide enough that every preset sits inside, and a custom body
     can go past Pluto and past Jupiter. */
  var MASS_MIN = 1e21;
  var MASS_MAX = 5e27;
  var RADIUS_MIN = 5e5;
  var RADIUS_MAX = 1.2e8;
  var SLIDER_STEPS = 1000;

  function kg(coeff, exp) {
    return coeff * Math.pow(10, exp);
  }

  /*
    Cited from each body’s own NASA NSSDCA fact sheet.
    massCoeff is the printed coefficient. massExp is the printed power of ten.
    radiusKm is the volumetric mean radius, except the satellite sheets,
    which print one radius. sheetRho is the printed mean density in kg/m³.
    sheetG is the printed gravity in m/s². Null means that sheet does not
    print a gravity. eqKm is the equatorial radius when the sheet prints one.
  */
  var BODIES = [
    {
      id: "mercury",
      name: "Mercury",
      swatch: "#b5b1a8",
      massCoeff: 0.33010,
      massExp: 24,
      massLabel: "0.33010 × 10^24 kg",
      radiusKm: 2439.7,
      radiusLabel: "2,439.7 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 2440.5,
      eqLabel: "2,440.5 km",
      sheetRho: 5429,
      sheetRhoLabel: "5429",
      sheetG: 3.70,
      sheetGLabel: "3.70",
      gRole: "Surface gravity (mean)",
      level: "surface",
      tier: "Planet · mass and volumetric mean radius",
      updated: "11 January 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html"
    },
    {
      id: "venus",
      name: "Venus",
      swatch: "#e6c27a",
      massCoeff: 4.8673,
      massExp: 24,
      massLabel: "4.8673 × 10^24 kg",
      radiusKm: 6051.8,
      radiusLabel: "6,051.8 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 6051.8,
      eqLabel: "6,051.8 km",
      sheetRho: 5243,
      sheetRhoLabel: "5243",
      sheetG: 8.87,
      sheetGLabel: "8.87",
      gRole: "Surface gravity (mean)",
      level: "surface",
      tier: "Planet · mass and volumetric mean radius",
      updated: "11 January 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html"
    },
    {
      id: "earth",
      name: "Earth",
      swatch: "#6ea4b8",
      massCoeff: 5.9722,
      massExp: 24,
      massLabel: "5.9722 × 10^24 kg",
      radiusKm: 6371.000,
      radiusLabel: "6,371.000 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 6378.137,
      eqLabel: "6,378.137 km",
      sheetRho: 5513,
      sheetRhoLabel: "5513",
      sheetG: 9.820,
      sheetGLabel: "9.820",
      gRole: "Surface gravity (mean)",
      level: "surface",
      tier: "Planet · mass and volumetric mean radius",
      updated: "15 November 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html"
    },
    {
      id: "moon",
      name: "Moon",
      swatch: "#c5c1b6",
      massCoeff: 0.07346,
      massExp: 24,
      massLabel: "0.07346 × 10^24 kg",
      radiusKm: 1737.4,
      radiusLabel: "1,737.4 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 1738.1,
      eqLabel: "1,738.1 km",
      sheetRho: 3344,
      sheetRhoLabel: "3344",
      sheetG: 1.62,
      sheetGLabel: "1.62",
      gRole: "Surface gravity",
      level: "surface",
      tier: "Moon · mass and volumetric mean radius",
      updated: "11 January 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html"
    },
    {
      id: "mars",
      name: "Mars",
      swatch: "#c46b4a",
      massCoeff: 0.64169,
      massExp: 24,
      massLabel: "0.64169 × 10^24 kg",
      radiusKm: 3389.5,
      radiusLabel: "3,389.5 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 3396.2,
      eqLabel: "3,396.2 km",
      sheetRho: 3934,
      sheetRhoLabel: "3934",
      sheetG: 3.73,
      sheetGLabel: "3.73",
      gRole: "Surface gravity (mean)",
      level: "surface",
      tier: "Planet · mass and volumetric mean radius",
      updated: "19 May 2025",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    {
      id: "jupiter",
      name: "Jupiter",
      swatch: "#d4a574",
      massCoeff: 1898.13,
      massExp: 24,
      massLabel: "1,898.13 × 10^24 kg",
      radiusKm: 69911,
      radiusLabel: "69,911 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 71492,
      eqLabel: "71,492 km",
      sheetRho: 1326,
      sheetRhoLabel: "1,326",
      sheetG: 25.92,
      sheetGLabel: "25.92",
      gRole: "Gravity (mean, 1 bar)",
      level: "1-bar",
      tier: "Giant · mass and volumetric mean radius",
      updated: "2 October 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html"
    },
    {
      id: "saturn",
      name: "Saturn",
      swatch: "#e6d3a3",
      massCoeff: 568.32,
      massExp: 24,
      massLabel: "568.32 × 10^24 kg",
      radiusKm: 58232,
      radiusLabel: "58,232 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 60268,
      eqLabel: "60,268 km",
      sheetRho: 687,
      sheetRhoLabel: "687",
      sheetG: 11.19,
      sheetGLabel: "11.19",
      gRole: "Gravity (mean, 1 bar)",
      level: "1-bar",
      tier: "Giant · mass and volumetric mean radius",
      updated: "18 March 2025",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html"
    },
    {
      id: "uranus",
      name: "Uranus",
      swatch: "#7eb8c9",
      massCoeff: 86.811,
      massExp: 24,
      massLabel: "86.811 × 10^24 kg",
      radiusKm: 25362,
      radiusLabel: "25,362 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 25559,
      eqLabel: "25,559 km",
      sheetRho: 1270,
      sheetRhoLabel: "1,270",
      sheetG: 9.01,
      sheetGLabel: "9.01",
      gRole: "Gravity (mean, 1 bar)",
      level: "1-bar",
      tier: "Giant · mass and volumetric mean radius",
      updated: "2 October 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html"
    },
    {
      id: "neptune",
      name: "Neptune",
      swatch: "#4c6cb3",
      massCoeff: 102.409,
      massExp: 24,
      massLabel: "102.409 × 10^24 kg",
      radiusKm: 24622,
      radiusLabel: "24,622 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 24764,
      eqLabel: "24,764 km",
      sheetRho: 1638,
      sheetRhoLabel: "1,638",
      sheetG: 11.27,
      sheetGLabel: "11.27",
      gRole: "Gravity (mean, 1 bar)",
      level: "1-bar",
      tier: "Giant · mass and volumetric mean radius",
      updated: "3 October 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html"
    },
    {
      id: "pluto",
      name: "Pluto",
      swatch: "#b7a2c9",
      massCoeff: 0.01303,
      massExp: 24,
      massLabel: "0.01303 × 10^24 kg",
      radiusKm: 1188,
      radiusLabel: "1,188 km",
      radiusRole: "Volumetric mean radius",
      radiusKind: "volumetric",
      eqKm: 1188,
      eqLabel: "1,188 km",
      sheetRho: 1854,
      sheetRhoLabel: "1854",
      sheetG: 0.62,
      sheetGLabel: "0.62",
      gRole: "Surface gravity (mean)",
      level: "surface",
      tier: "Dwarf planet · mass and volumetric mean radius",
      updated: "11 January 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html"
    },
    {
      id: "io",
      name: "Io",
      swatch: "#e0b15a",
      massCoeff: 893.2,
      massExp: 20,
      massLabel: "893.2 × 10^20 kg",
      radiusKm: 1821.5,
      radiusLabel: "1821.5 km",
      radiusRole: "Radius",
      radiusKind: "printed",
      eqKm: null,
      eqLabel: "",
      sheetRho: 3530,
      sheetRhoLabel: "3530",
      sheetG: null,
      sheetGLabel: "",
      gRole: "",
      level: "satellite",
      tier: "Moon · mass and the printed radius",
      updated: "6 December 2023",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html"
    },
    {
      id: "europa",
      name: "Europa",
      swatch: "#d9d3c5",
      massCoeff: 480.0,
      massExp: 20,
      massLabel: "480.0 × 10^20 kg",
      radiusKm: 1560.8,
      radiusLabel: "1560.8 km",
      radiusRole: "Radius",
      radiusKind: "printed",
      eqKm: null,
      eqLabel: "",
      sheetRho: 3010,
      sheetRhoLabel: "3010",
      sheetG: null,
      sheetGLabel: "",
      gRole: "",
      level: "satellite",
      tier: "Moon · mass and the printed radius",
      updated: "6 December 2023",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html"
    },
    {
      id: "ganymede",
      name: "Ganymede",
      swatch: "#8a9bb0",
      massCoeff: 1481.9,
      massExp: 20,
      massLabel: "1,481.9 × 10^20 kg",
      radiusKm: 2631.2,
      radiusLabel: "2631.2 km",
      radiusRole: "Radius",
      radiusKind: "printed",
      eqKm: null,
      eqLabel: "",
      sheetRho: 1940,
      sheetRhoLabel: "1940",
      sheetG: null,
      sheetGLabel: "",
      gRole: "",
      level: "satellite",
      tier: "Moon · mass and the printed radius",
      updated: "6 December 2023",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html"
    },
    {
      id: "callisto",
      name: "Callisto",
      swatch: "#7d6a58",
      massCoeff: 1075.9,
      massExp: 20,
      massLabel: "1,075.9 × 10^20 kg",
      radiusKm: 2410.3,
      radiusLabel: "2410.3 km",
      radiusRole: "Radius",
      radiusKind: "printed",
      eqKm: null,
      eqLabel: "",
      sheetRho: 1830,
      sheetRhoLabel: "1830",
      sheetG: null,
      sheetGLabel: "",
      gRole: "",
      level: "satellite",
      tier: "Moon · mass and the printed radius",
      updated: "6 December 2023",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html"
    },
    {
      id: "titan",
      name: "Titan",
      swatch: "#c9b27a",
      massCoeff: 1345.5,
      massExp: 20,
      massLabel: "1,345.5 × 10^20 kg",
      radiusKm: 2575,
      radiusLabel: "2,575 km",
      radiusRole: "Radius",
      radiusKind: "printed",
      eqKm: null,
      eqLabel: "",
      sheetRho: 1880,
      sheetRhoLabel: "1880",
      sheetG: null,
      sheetGLabel: "",
      gRole: "",
      level: "satellite",
      tier: "Moon · mass and the printed radius",
      updated: "22 July 2025",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html"
    }
  ];

  BODIES.forEach(function (b) {
    b.massKg = kg(b.massCoeff, b.massExp);
    b.radiusM = b.radiusKm * 1000;
  });

  function bodyById(id) {
    var i;
    for (i = 0; i < BODIES.length; i++) {
      if (BODIES[i].id === id) return BODIES[i];
    }
    return null;
  }

  function clampMass(kgValue) {
    if (!(kgValue > 0) || !isFinite(kgValue)) return MASS_MIN;
    if (kgValue < MASS_MIN) return MASS_MIN;
    if (kgValue > MASS_MAX) return MASS_MAX;
    return kgValue;
  }

  function clampRadius(m) {
    if (!(m > 0) || !isFinite(m)) return RADIUS_MIN;
    if (m < RADIUS_MIN) return RADIUS_MIN;
    if (m > RADIUS_MAX) return RADIUS_MAX;
    return m;
  }

  function meanDensity(massKg, radiusM) {
    if (!(massKg > 0) || !(radiusM > 0)) return NaN;
    if (!isFinite(massKg) || !isFinite(radiusM)) return NaN;
    return massKg / ((4 / 3) * Math.PI * radiusM * radiusM * radiusM);
  }

  function surfaceGravity(massKg, radiusM) {
    if (!(massKg > 0) || !(radiusM > 0)) return NaN;
    if (!isFinite(massKg) || !isFinite(radiusM)) return NaN;
    return (G * massKg) / (radiusM * radiusM);
  }

  function formatRho(rho) {
    if (!isFinite(rho)) return "";
    return rho.toFixed(1);
  }

  /* Grams per cubic centimetre from the same tenth, so 5426.8 kg/m³
     is 5.4268 g/cm³ and not a second rounding. */
  function formatGcm(rho) {
    if (!isFinite(rho)) return "";
    return (Number(rho.toFixed(1)) / 1000).toFixed(4);
  }

  function formatG(g) {
    if (!isFinite(g)) return "";
    return g.toFixed(3);
  }

  function formatEarthMass(massKg) {
    var em = massKg / EARTH_MASS_KG;
    if (!isFinite(em)) return "";
    return em >= 100 ? em.toFixed(4) : em.toFixed(6);
  }

  function formatEarthRadius(radiusM) {
    var er = radiusM / EARTH_RADIUS_M;
    if (!isFinite(er)) return "";
    return er.toFixed(6);
  }

  function formatKg(massKg) {
    if (!(massKg > 0) || !isFinite(massKg)) return "";
    var exp = Math.floor(Math.log10(massKg));
    var coeff = massKg / Math.pow(10, exp);
    var text = coeff.toFixed(4).replace(/\.?0+$/, "");
    return text + " × 10^" + exp + " kg";
  }

  function formatKm(radiusM) {
    if (!(radiusM > 0) || !isFinite(radiusM)) return "";
    var km = radiusM / 1000;
    var text = km >= 100 ? km.toFixed(1) : km.toFixed(3);
    return text + " km";
  }

  /* Preset masses use the printed coefficient, so the field does not
     show binary noise such as 7.3459999999999995e+22 for the Moon. */
  function formatSiMass(massKg, body) {
    if (body) return String(body.massCoeff) + "e" + body.massExp;
    if (!(massKg > 0) || !isFinite(massKg)) return "";
    return massKg.toExponential(6).replace(/\+/g, "");
  }

  function formatSiRadius(radiusM) {
    if (!(radiusM > 0) || !isFinite(radiusM)) return "";
    var rounded = Math.round(radiusM);
    if (Math.abs(radiusM - rounded) < 1e-4 && rounded < 1e15) return String(rounded);
    return radiusM.toExponential(6).replace(/\+/g, "");
  }

  function gapRho(rho, body) {
    var tenth = formatRho(rho);
    var nearest = rho.toFixed(0);
    var sheet = String(body.sheetRho);
    if (nearest === sheet) {
      return tenth + " rounds to the sheet’s " + body.sheetRhoLabel + " at the integer the sheet prints. The tenth stays. They are not averaged.";
    }
    return tenth + " does not round to " + body.sheetRhoLabel + ". The nearest integer is " + nearest + ". They are not averaged.";
  }

  function gapG(g, sheetLabel) {
    var digits = sheetLabel.indexOf(".") === -1 ? 0 : sheetLabel.length - sheetLabel.indexOf(".") - 1;
    var rounded = g.toFixed(digits);
    var shown = formatG(g);
    if (rounded === sheetLabel) {
      if (shown === sheetLabel) {
        return shown + " matches the sheet’s " + sheetLabel + " at the digits the sheet prints. They are not averaged.";
      }
      return shown + " rounds to the sheet’s " + sheetLabel + " at the digits the sheet prints. The extra digits stay. They are not averaged.";
    }
    return shown + " does not round to " + sheetLabel + ". They are not averaged.";
  }

  function radiusSentence(body) {
    if (body.radiusKind === "printed") {
      return "The sheet prints one radius. It does not print a separate volumetric mean radius. That printed radius is the R in the formula. ";
    }
    if (body.eqLabel === body.radiusLabel) {
      return "The sheet’s equatorial radius and volumetric mean radius are both " + body.radiusLabel + ". The formula uses that radius. ";
    }
    var where = body.level === "1-bar" ? " at 1 bar" : "";
    return "The sheet’s equatorial radius" + where + " is " + body.eqLabel + ". The volumetric mean radius is " + body.radiusLabel + ". The formula uses the volumetric mean radius. They are not averaged. ";
  }

  function bandSentence(gcm) {
    var water = gcm < 1
      ? "It sits below the water line at 1 g/cm³."
      : "It sits above the water line at 1 g/cm³.";
    var rock;
    if (gcm < 3) rock = " It sits below the rock mark at 3 g/cm³.";
    else if (gcm === 3) rock = " It sits on the rock mark at 3 g/cm³.";
    else rock = " It sits above the rock mark at 3 g/cm³.";
    var iron = gcm < 7.9
      ? " It sits below the iron mark at 7.9 g/cm³."
      : " It sits at or above the iron mark at 7.9 g/cm³.";
    return water + rock + iron + " The rock mark and the iron mark are reference marks on this chart. They are not fact-sheet densities. ";
  }

  function disclaimer() {
    return "Classroom bulk-density picture, not an interior model.";
  }

  function extraSentence(body) {
    if (body.id === "earth") {
      return "The comparison table, updated 13 November 2026, prints 5,514 kg/m³. The Moon sheet’s Earth column prints 5514 kg/m³ and mass 5.9724 × 10^24 kg. This page uses the Earth sheet’s 5513 kg/m³ and 5.9722 × 10^24 kg. They are not averaged. The Earth sheet prints a core radius of 3485 km. It does not print a core mass or a core density. This page does not invent them. ";
    }
    if (body.id === "moon") {
      return "The comparison table, updated 13 November 2026, prints 3,340 kg/m³. This page uses the Moon sheet’s 3344. They are not averaged. ";
    }
    if (body.id === "pluto") {
      return "The comparison table, updated 13 November 2026, prints 1,850 kg/m³. This page uses the Pluto sheet’s 1854. They are not averaged. ";
    }
    if (body.id === "mercury") {
      return "NASA Science says Mercury is the second densest planet, after Earth, and that it has a large metallic core with a radius of about 2,074 kilometers, about 85% of the planet’s radius. That radius is not the R in this formula. The two radii are not averaged. ";
    }
    if (body.id === "saturn") {
      return "NASA Science says Saturn is the only planet in our solar system with an average density that is less than water. The sheet’s 687 kg/m³ is less than 1,000 kg/m³. This arithmetic is also below that line. ";
    }
    if (body.level === "1-bar") {
      return "The fact-sheet notes put a gas giant’s gravity at the 1-bar level. There is no solid surface on the sheet. ";
    }
    if (body.id === "titan") {
      return "The scale-height desk computes this same GM/r² and prints 1.354 m/s². The satellite sheet still does not print a surface gravity. ";
    }
    return "";
  }

  function whyBody(body, rho, g) {
    var rhoT = formatRho(rho);
    var gcmT = formatGcm(rho);
    var gT = formatG(g);
    var open = "ρ = M / (4/3 π R³) at the " + body.name + " sheet’s mass " + body.massLabel + " and " + body.radiusRole.toLowerCase() + " " + body.radiusLabel + ". ";
    var arith = "This arithmetic is " + rhoT + " kg/m³, which is " + gcmT + " g/cm³. The sheet’s mean density is " + body.sheetRhoLabel + " kg/m³. " + gapRho(rho, body) + " ";
    var grav;
    if (body.sheetGLabel) {
      grav = "g = G M / R² with the 2022 CODATA G is " + gT + " m/s². The sheet’s " + body.gRole.toLowerCase() + " is " + body.sheetGLabel + " m/s². " + gapG(g, body.sheetGLabel) + " The sheet also prints a GM. This page multiplies the printed mass by G and does not substitute that GM. ";
    } else {
      grav = "The sheet does not print a surface gravity. g = G M / R² with the 2022 CODATA G is " + gT + " m/s². It is not a gravity line on the sheet. ";
    }
    return "Bulk density. " + open + arith + radiusSentence(body) + grav + extraSentence(body) + bandSentence(Number(gcmT)) + disclaimer();
  }

  function whyCustom(massKg, radiusM, rho, g) {
    var rhoT = formatRho(rho);
    var gcmT = formatGcm(rho);
    var gT = formatG(g);
    return "Sliders. ρ = M / (4/3 π R³) at " + formatKg(massKg) + " and " + formatKm(radiusM) + ". This arithmetic is " + rhoT + " kg/m³, which is " + gcmT + " g/cm³. It is not a fact-sheet density. g = G M / R² is " + gT + " m/s². It is not a fact-sheet gravity. They are not averaged. " + bandSentence(Number(gcmT)) + disclaimer();
  }

  function statsFor(massText, radiusText, rhoT, gcmT, sheetRhoText, gT, sheetGText) {
    return [
      ["Mass", massText],
      ["Radius", radiusText],
      ["This arithmetic", rhoT + " kg/m³"],
      ["Grams per cubic centimetre", gcmT + " g/cm³"],
      ["Sheet mean density", sheetRhoText],
      ["Versus water", gcmT + " × 1 g/cm³"],
      ["This gravity", gT + " m/s²"],
      ["Sheet gravity", sheetGText]
    ];
  }

  function sceneFrom(body, massKg, radiusM) {
    var rho = meanDensity(massKg, radiusM);
    var g = surfaceGravity(massKg, radiusM);
    if (!isFinite(rho) || !isFinite(g)) return { ok: false, why: "" };
    var rhoT = formatRho(rho);
    var gcmT = formatGcm(rho);
    var gT = formatG(g);
    if (body) {
      var sheetGText = body.sheetGLabel ? body.sheetGLabel + " m/s²" : "—";
      return {
        ok: true,
        body: body,
        custom: false,
        title: body.name,
        tier: body.tier,
        range: gcmT + " g/cm³ · " + rhoT + " kg/m³",
        massKg: massKg,
        radiusM: radiusM,
        rho: rho,
        g: g,
        rhoText: rhoT,
        gcmText: gcmT,
        gText: gT,
        sheetRhoText: body.sheetRhoLabel,
        why: whyBody(body, rho, g),
        aria: "Mean density of " + body.name + ". " + rhoT + " kilograms per cubic metre, " + gcmT + " grams per cubic centimetre. The sheet prints " + body.sheetRhoLabel + ". Surface gravity " + gT + " metres per second squared. Not an interior model.",
        stats: statsFor(body.massLabel, body.radiusLabel, rhoT, gcmT, body.sheetRhoLabel + " kg/m³", gT, sheetGText),
        swatch: body.swatch
      };
    }
    return {
      ok: true,
      body: null,
      custom: true,
      title: "Custom",
      tier: "Sliders · not a fact sheet",
      range: gcmT + " g/cm³ · " + rhoT + " kg/m³",
      massKg: massKg,
      radiusM: radiusM,
      rho: rho,
      g: g,
      rhoText: rhoT,
      gcmText: gcmT,
      gText: gT,
      sheetRhoText: "—",
      why: whyCustom(massKg, radiusM, rho, g),
      aria: "Custom mean density. " + rhoT + " kilograms per cubic metre, " + gcmT + " grams per cubic centimetre. Not a fact-sheet density. Surface gravity " + gT + " metres per second squared. Not an interior model.",
      stats: statsFor(formatKg(massKg), formatKm(radiusM), rhoT, gcmT, "—", gT, "—"),
      swatch: "#c8b48a"
    };
  }

  function scene(opts) {
    opts = opts || {};
    if (opts.body) {
      var body = bodyById(opts.body);
      if (!body) return { ok: false, why: "" };
      return sceneFrom(body, body.massKg, body.radiusM);
    }
    if (!(opts.massKg > 0) || !(opts.radiusM > 0)) return { ok: false, why: "" };
    return sceneFrom(null, clampMass(opts.massKg), clampRadius(opts.radiusM));
  }

  function chartRows() {
    return BODIES.map(function (b) {
      var sc = scene({ body: b.id });
      return {
        id: b.id,
        name: b.name,
        swatch: b.swatch,
        rho: sc.rho,
        gcm: sc.rho / 1000,
        gcmText: sc.gcmText,
        rhoText: sc.rhoText
      };
    });
  }

  function sliderPos(value, min, max) {
    if (!(value > 0) || !(min > 0) || !(max > min)) return 0;
    var t = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.round(t * SLIDER_STEPS);
  }

  function valueFromSlider(pos, min, max) {
    var t = pos / SLIDER_STEPS;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
  }

  return {
    G: G,
    EARTH_MASS_KG: EARTH_MASS_KG,
    EARTH_RADIUS_M: EARTH_RADIUS_M,
    WATER_KG_M3: WATER_KG_M3,
    ROCK_G_CM3: ROCK_G_CM3,
    IRON_G_CM3: IRON_G_CM3,
    MASS_MIN: MASS_MIN,
    MASS_MAX: MASS_MAX,
    RADIUS_MIN: RADIUS_MIN,
    RADIUS_MAX: RADIUS_MAX,
    SLIDER_STEPS: SLIDER_STEPS,
    BODIES: BODIES,
    bodyById: bodyById,
    clampMass: clampMass,
    clampRadius: clampRadius,
    meanDensity: meanDensity,
    surfaceGravity: surfaceGravity,
    formatRho: formatRho,
    formatGcm: formatGcm,
    formatG: formatG,
    formatEarthMass: formatEarthMass,
    formatEarthRadius: formatEarthRadius,
    formatKg: formatKg,
    formatKm: formatKm,
    formatSiMass: formatSiMass,
    formatSiRadius: formatSiRadius,
    scene: scene,
    chartRows: chartRows,
    sliderPos: sliderPos,
    valueFromSlider: valueFromSlider
  };
});
