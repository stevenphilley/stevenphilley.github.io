/*! Magnetopause standoff from a Chapman–Ferraro pressure balance.
    R_mp / R = (k B_eq² / (2 μ0 ρ v²))^(1/6), with k = 2.
    B_eq is the fact sheet’s dipole field strength, in the sheet’s model radius.
    ρ is proton mass times a 1 AU density scaled by 1/r².
    Sheet numbers are not averaged with this arithmetic.
    Simplified pressure-balance model, not mission-grade. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Magnetospheres = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Conventional μ0, exact as 4π × 10^−7 N A^−2 before the 2019 SI revision.
     CODATA’s present value differs past the digits this page prints. */
  var MU0 = 4 * Math.PI * 1e-7;

  /* NIST CODATA 2022, proton mass, kg. Electron mass is not added. */
  var PROTON_MASS_KG = 1.67262192595e-27;

  /* 1 gauss = 10^−4 tesla, the conversion this page uses. */
  var GAUSS_TO_TESLA = 1e-4;

  /* k multiplies B². A dipole compressed by the solar wind, this page’s assumption. */
  var K_FACTOR = 2;

  /* NOAA SWPC glossary: densities near 5 cm^−3 at 1 AU. The slider’s 5 is that sentence. */
  var N_GLOSSARY = 5;

  /* NOAA SWPC solar-wind page and Marshall: about 400 km/s. Glossary: near 375 km/s. */
  var V_ABOUT_400 = 400;
  var V_GLOSSARY = 375;

  var V_MIN = 300;
  var V_MAX = 800;
  var N_MIN = 0.5;
  var N_MAX = 20;

  /*
    Dipole block from each NASA NSSDCA fact sheet, body column.
    dipoleGauss is “Dipole field strength” in gauss, the field at one model radius.
    The surface range is a different line and is not substituted.
    au is the J2000 semimajor axis. The ratio column is not used.
  */
  var PLANETS = [
    {
      id: "mercury",
      name: "Mercury",
      swatch: "#c4b8a5",
      au: 0.38709893,
      auLabel: "0.38709893",
      dipoleGauss: 0.002,
      dipoleLabel: "0.002 Gauss-Rh³",
      surfaceLabel: "0.0025–0.007 Gauss",
      tiltLabel: "0.0°",
      tiltLongitude: "—",
      offsetLabel: "0.17 Rh",
      modelName: "MESSENGER Model 2010",
      modelSymbol: "Rh",
      modelRadiusLabel: "2,440 km",
      equatorialLabel: "2440.5 km",
      updated: "11 January 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html"
    },
    {
      id: "earth",
      name: "Earth",
      swatch: "#6ea4b8",
      au: 1.00000011,
      auLabel: "1.00000011",
      dipoleGauss: 0.306,
      dipoleLabel: "0.306 Gauss-Re³",
      surfaceLabel: "0.24–0.66 Gauss",
      tiltLabel: "—",
      tiltLongitude: "—",
      offsetLabel: "0.076 Re",
      modelName: "GSFC-1283",
      modelSymbol: "Re",
      modelRadiusLabel: "6,378 km",
      equatorialLabel: "6378.137 km",
      updated: "15 November 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html"
    },
    {
      id: "jupiter",
      name: "Jupiter",
      swatch: "#d4a574",
      au: 5.20336301,
      auLabel: "5.20336301",
      dipoleGauss: 4.30,
      dipoleLabel: "4.30 Gauss-Rj³",
      surfaceLabel: "4.0–13.0 Gauss",
      tiltLabel: "9.4°",
      tiltLongitude: "200.1°",
      offsetLabel: "0.119 Rj",
      modelName: "GSFC-O6",
      modelSymbol: "Rj",
      modelRadiusLabel: "71,398 km",
      equatorialLabel: "71,492 km",
      updated: "2 October 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html"
    },
    {
      id: "saturn",
      name: "Saturn",
      swatch: "#e6d3a3",
      au: 9.53707032,
      auLabel: "9.53707032",
      dipoleGauss: 0.215,
      dipoleLabel: "0.215 Gauss-Rs³",
      surfaceLabel: "0.18–0.84 Gauss",
      tiltLabel: "0.0",
      tiltLongitude: "—",
      offsetLabel: "0.038 Rs",
      modelName: "GSFC-Z3",
      modelSymbol: "Rs",
      modelRadiusLabel: "60,330 km",
      equatorialLabel: "60,268 km",
      updated: "18 March 2025",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html"
    },
    {
      id: "uranus",
      name: "Uranus",
      swatch: "#8fd0c8",
      au: 19.19126393,
      auLabel: "19.19126393",
      dipoleGauss: 0.228,
      dipoleLabel: "0.228 Gauss-Ru³",
      surfaceLabel: "~0.1–1.0 Gauss",
      tiltLabel: "58.6°",
      tiltLongitude: "53.6°",
      offsetLabel: "0.352 Ru",
      modelName: "GSFC-O3",
      modelSymbol: "Ru",
      modelRadiusLabel: "25,600 km",
      equatorialLabel: "25,559 km",
      updated: "2 October 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html"
    },
    {
      id: "neptune",
      name: "Neptune",
      swatch: "#6a8fd4",
      au: 30.06896348,
      auLabel: "30.06896348",
      dipoleGauss: 0.142,
      dipoleLabel: "0.142 Gauss-Rn³",
      surfaceLabel: "~0.1–0.9 Gauss",
      tiltLabel: "46.9°",
      tiltLongitude: "288°",
      offsetLabel: "0.485 Rn",
      modelName: "GSFC-O8",
      modelSymbol: "Rn",
      modelRadiusLabel: "24,765 km",
      equatorialLabel: "24,764 km",
      updated: "3 October 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html"
    }
  ];

  function bodyById(id) {
    var i;
    for (i = 0; i < PLANETS.length; i++) {
      if (PLANETS[i].id === id) return PLANETS[i];
    }
    return null;
  }

  function clampV(v) {
    if (!isFinite(v)) return V_ABOUT_400;
    if (v < V_MIN) return V_MIN;
    if (v > V_MAX) return V_MAX;
    return v;
  }

  function clampN(n) {
    if (!isFinite(n)) return N_GLOSSARY;
    if (n < N_MIN) return N_MIN;
    if (n > N_MAX) return N_MAX;
    return n;
  }

  /* Protons per cubic centimetre at the planet. Density falls as 1/r². Speed does not. */
  function localDensity(au, n1) {
    if (!(au > 0) || !(n1 > 0)) return NaN;
    return n1 / (au * au);
  }

  function dynamicPressurePa(nPerCm3, vKmS) {
    if (!(nPerCm3 > 0) || !(vKmS > 0)) return NaN;
    var nM3 = nPerCm3 * 1e6;
    var v = vKmS * 1000;
    return nM3 * PROTON_MASS_KG * v * v;
  }

  /* R_mp / R_model. B is the sheet’s dipole field strength in gauss. */
  function standoffRatio(dipoleGauss, au, n1, vKmS) {
    if (!(dipoleGauss > 0) || !(au > 0)) return NaN;
    var nLocal = localDensity(au, n1);
    var p = dynamicPressurePa(nLocal, vKmS);
    if (!(p > 0)) return NaN;
    var b = dipoleGauss * GAUSS_TO_TESLA;
    var num = K_FACTOR * b * b;
    var den = 2 * MU0 * p;
    if (!(num > 0) || !(den > 0)) return NaN;
    return Math.pow(num / den, 1 / 6);
  }

  function formatRatio(r) {
    if (!isFinite(r)) return "";
    return r.toFixed(3);
  }

  function formatN(n) {
    if (!isFinite(n)) return "";
    return n.toFixed(6);
  }

  function formatN1(n) {
    if (!isFinite(n)) return "";
    var rounded = Math.round(n * 100) / 100;
    if (Math.abs(n - rounded) < 1e-9) {
      return (Math.round(n * 100) / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }
    return n.toFixed(2);
  }

  function formatNPa(pa) {
    if (!isFinite(pa)) return "";
    return (pa * 1e9).toFixed(4);
  }

  function formatV(v) {
    if (!isFinite(v)) return "";
    if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
    return v.toFixed(1);
  }

  function speedSentence(v) {
    if (Math.abs(v - V_ABOUT_400) < 1e-6) {
      return "The speed is 400 km/s. NOAA’s solar-wind page says the most common slow wind in the equatorial plane is about 400 km/s. Marshall says about 400 km/s. The glossary’s near 375 km/s is a different sentence and is not this setting.";
    }
    if (Math.abs(v - V_GLOSSARY) < 1e-6) {
      return "The speed is 375 km/s, the glossary’s near 375. NOAA’s about 400 and Marshall’s about 400 are different sentences and are not this setting.";
    }
    return "The speed is " + formatV(v) + " km/s. It is not the glossary’s near 375 and not the about-400 sentences.";
  }

  function densitySentence(n1) {
    if (Math.abs(n1 - N_GLOSSARY) < 1e-9) {
      return "The density slider is 5 protons per cm³ at 1 AU, the glossary’s near 5. NASA’s SPARTAN page says about 3 to 10 particles per cm³ and approximately 400 km/s. 5 is not a middle of 3 to 10. They are not averaged.";
    }
    return "The density slider is " + formatN1(n1) + " protons per cm³ at 1 AU. It has left the glossary’s near 5.";
  }

  function compareSentence(planet, ratioText, pressureText) {
    if (planet.id === "mercury") {
      return "This arithmetic is " + ratioText + " Rh. Winslow et al. 2013 print an average subsolar standoff of 1.45 RM under a mean ram pressure of 14.3 nPa. RM is that paper’s Mercury radius. This page’s dynamic pressure is " + pressureText + " nPa. " + ratioText + " and 1.45 are not averaged.";
    }
    if (planet.id === "earth") {
      return "This arithmetic is " + ratioText + " Re, in the sheet’s model radius of 6,378 km. NOAA NCEI says the magnetosphere is compressed on the sunward side to about 10 Earth radii. NASA Science says the dayside extends about six to 10 Earth radii. " + ratioText + " is inside that span. It does not round to 10. The arithmetic, the about 10, and the six to 10 are not averaged. The surface range 0.24 to 0.66 gauss is not the 0.306 gauss dipole strength used here. The sheet does not print a dipole tilt. The aurora desk keeps NOAA’s 9.41°, the opening answer’s approximately 11°, and the glossary’s about 11.5°, and does not average them.";
    }
    if (planet.id === "jupiter") {
      return "This arithmetic is " + ratioText + " Rj. The sheet’s Rj is 71,398 km. The equatorial radius at 1 bar on the same sheet is 71,492 km. Bagenal 2024 prints a dipolar stand-off of about 42 RJ and typical sunward distances of 63 to 92 RJ, and also says 60 to 100 jovian radii. That paper’s RJ is 71,492 km. 71,398 and 71,492 are not averaged. " + ratioText + " does not round to 42, and it is not 63 or 92. The paper says plasma pressure inflates the magnetosphere from about 42 RJ to over 90 RJ. This page does not add that plasma pressure.";
    }
    if (planet.id === "saturn") {
      return "This arithmetic is " + ratioText + " Rs. A Cassini magnetometer report says the system preferentially spent most of the time in one of two states, with subsolar magnetopause distances near about 22 and about 27 Saturn radii, from Achilleos et al. 2008. " + ratioText + " is neither. They are not averaged. The sheet says the field has significant quadrapole and octupole moments, making approximation of the central field as an offset dipole difficult. The sheet’s spelling is kept.";
    }
    if (planet.id === "uranus") {
      return "This arithmetic is " + ratioText + " Ru. Paty et al. 2020 say the subsolar magnetopause at Uranus was found to be 18 RU. " + ratioText + " does not round to 18. They are not averaged. The sheet’s tilt is 58.6° and the offset is 0.352 Ru.";
    }
    if (planet.id === "neptune") {
      return "This arithmetic is " + ratioText + " Rn. Paty et al. 2020 say the subsolar magnetopause at Neptune was found to be 23 to 26 RN. " + ratioText + " is outside that span. They are not averaged. The sheet’s tilt is 46.9° and the offset is 0.485 Rn.";
    }
    return "";
  }

  function scene(opts) {
    var o = opts || {};
    var planet = bodyById(o.planet || "earth");
    if (!planet) return { ok: false };
    var v = clampV(o.v == null ? V_ABOUT_400 : o.v);
    var n1 = clampN(o.n1 == null ? N_GLOSSARY : o.n1);
    var nLocal = localDensity(planet.au, n1);
    var pressure = dynamicPressurePa(nLocal, v);
    var ratio = standoffRatio(planet.dipoleGauss, planet.au, n1, v);
    if (!isFinite(ratio)) return { ok: false };
    var ratioText = formatRatio(ratio);
    var pressureText = formatNPa(pressure);
    var unit = planet.modelSymbol;
    var why = "The formula is (k B² / (2 μ0 ρ v²))^(1/6) with k = 2. B is the sheet’s dipole field strength, " + planet.dipoleLabel + ", and 1 gauss = 10^−4 tesla. " + speedSentence(v) + " " + densitySentence(n1) + " The J2000 semimajor axis is " + planet.auLabel + " AU, so the density at the planet is " + formatN(nLocal) + " protons per cm³. Speed is not scaled with distance. " + compareSentence(planet, ratioText, pressureText) + " k = 2 multiplies B². It is this page’s assumption for a dipole compressed by the solar wind. It is not a measured factor. Simplified pressure-balance model, not mission-grade.";
    var stats = [
      ["Dipole field", planet.dipoleLabel],
      ["1 AU density", formatN1(n1) + " cm⁻³"],
      ["Density here", formatN(nLocal) + " cm⁻³"],
      ["Speed", formatV(v) + " km/s"],
      ["Dynamic pressure", pressureText + " nPa"],
      ["This arithmetic", ratioText + " " + unit]
    ];
    return {
      ok: true,
      planet: planet,
      v: v,
      n1: n1,
      nLocal: nLocal,
      pressurePa: pressure,
      ratio: ratio,
      ratioText: ratioText,
      pressureText: pressureText,
      tier: planet.modelName + " · pressure balance",
      title: planet.name,
      range: ratioText + " " + unit,
      why: why,
      aria: "Schematic of " + planet.name + ". Magnetopause nose at " + ratioText + " " + unit + " from a pressure balance with k = 2. The bow shock curve is a sketch. Not mission-grade.",
      stats: stats,
      swatch: planet.swatch
    };
  }

  return {
    MU0: MU0,
    PROTON_MASS_KG: PROTON_MASS_KG,
    GAUSS_TO_TESLA: GAUSS_TO_TESLA,
    K_FACTOR: K_FACTOR,
    N_GLOSSARY: N_GLOSSARY,
    V_ABOUT_400: V_ABOUT_400,
    V_GLOSSARY: V_GLOSSARY,
    V_MIN: V_MIN,
    V_MAX: V_MAX,
    N_MIN: N_MIN,
    N_MAX: N_MAX,
    PLANETS: PLANETS,
    bodyById: bodyById,
    clampV: clampV,
    clampN: clampN,
    localDensity: localDensity,
    dynamicPressurePa: dynamicPressurePa,
    standoffRatio: standoffRatio,
    formatRatio: formatRatio,
    formatN: formatN,
    formatN1: formatN1,
    formatNPa: formatNPa,
    formatV: formatV,
    scene: scene
  };
});
