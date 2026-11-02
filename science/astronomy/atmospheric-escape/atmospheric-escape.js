/*! Which gases can a world keep? Thermal (Jeans) escape.
    v_esc = sqrt(2 GM / r)
    Most probable speed v_mp = sqrt(2 k T / m)
    Mean speed v_mean = sqrt(8 k T / (pi m))
    Jeans parameter lambda = v_esc^2 / v_mp^2 = G M m / (k T r)
    The six-times rule uses the mean speed. It is an approximation.
    Classroom schematic. Not a climate model and not an escape-rate model. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AtmosphericEscape = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* k is exact in the 2019 SI. u and G are the 2022 CODATA values NIST displays.
     The escape desk uses this same G for a custom mass. */
  var K = 1.380649e-23;
  var U = 1.66053906892e-27;
  var G = 6.67430e-11;

  /* Retained, over geologic time, if escape speed exceeds about six times
     the mean thermal speed. Catling and Zahnle, Scientific American, 2009. */
  var SIX = 6;

  var T_MIN = 30;
  var T_MAX = 3000;
  var M_MIN = 0.001;
  var M_MAX = 2000;
  var R_MIN = 200;
  var R_MAX = 100000;

  /* Abridged standard atomic weights, Prohaska et al. 2022, IUPAC.
     A molecule is the sum. Not a measured isotopic composition. */
  var GASES = [
    { id: "h", name: "Atomic hydrogen", symbol: "H", html: "H", mu: 1.008 },
    { id: "h2", name: "Molecular hydrogen", symbol: "H2", html: "H<sub>2</sub>", mu: 2.016 },
    { id: "he", name: "Helium", symbol: "He", html: "He", mu: 4.0026 },
    { id: "h2o", name: "Water", symbol: "H2O", html: "H<sub>2</sub>O", mu: 18.015 },
    { id: "n2", name: "Molecular nitrogen", symbol: "N2", html: "N<sub>2</sub>", mu: 28.014 },
    { id: "o2", name: "Molecular oxygen", symbol: "O2", html: "O<sub>2</sub>", mu: 31.998 },
    { id: "co2", name: "Carbon dioxide", symbol: "CO2", html: "CO<sub>2</sub>", mu: 44.009 },
    { id: "ch4", name: "Methane", symbol: "CH4", html: "CH<sub>4</sub>", mu: 16.043 },
    { id: "nh3", name: "Ammonia", symbol: "NH3", html: "NH<sub>3</sub>", mu: 17.031 },
    { id: "ar", name: "Argon", symbol: "Ar", html: "Ar", mu: 39.95 }
  ];

  /* GM is the fact-sheet value in km^3/s^2, except Titan, whose sheet prints
     a mass and one radius. Titan’s GM is CODATA G times that mass.
     jeansBaseKm is the radius the cited exobase altitude is added to.
     Gas giants use the equatorial 1-bar radius, because that is the radius
     the sheet’s escape speed belongs to. Others use the volumetric mean
     radius, or Titan’s single printed radius. */
  var WORLDS = [
    {
      id: "mercury", name: "Mercury",
      gm: 0.022032e6, radiusKm: 2439.7, jeansBaseKm: 2439.7,
      radiusLabel: "2,439.7 km volumetric",
      exoAltKm: 0,
      T: 440,
      sheetEsc: "4.3",
      tNote: "The Mercury Fact Sheet’s average temperature of the surface-bounded exosphere is 440 K. The sunward side is given as 590–725 K. There is no thick-atmosphere exobase. Catling and Zahnle plot an average surface temperature for Mercury.",
      zNote: "Surface-bounded exosphere. The radius in the formulas is the volumetric mean radius. No exobase altitude is added."
    },
    {
      id: "venus", name: "Venus",
      gm: 0.32486e6, radiusKm: 6051.8, jeansBaseKm: 6051.8,
      radiusLabel: "6,051.8 km volumetric",
      exoAltKm: 300, exoAltEstimate: true,
      T: 300,
      sheetEsc: "10.36",
      tNote: "García Muñoz, Koskinen, and Lavvas, Table 1: dayside exospheric temperature about 300 K, nightside about 100 K. This button uses the dayside 300 K.",
      zNote: "Table 1 lists an exobase altitude of about 220–350 km. This desk uses 300 km, a round altitude inside that range, not a separate measurement."
    },
    {
      id: "earth", name: "Earth",
      gm: 0.39860e6, radiusKm: 6371.000, jeansBaseKm: 6371.000,
      radiusLabel: "6,371.000 km volumetric",
      exoAltKm: 500,
      T: 1000,
      sheetEsc: "11.186",
      tNote: "Catling and Zahnle: Earth’s exobase is typically around 1000 K, and it moves with the solar cycle. García Muñoz, Koskinen, and Lavvas: about 500 K at low solar activity and about 1000 K at high solar activity. This button uses 1000 K, the classic hydrogen example.",
      zNote: "Table 1 lists an exobase altitude of about 500 km. Catling and Zahnle put the exobase around 500–600 km. This desk uses 500 km."
    },
    {
      id: "moon", name: "Moon",
      gm: 0.00490e6, radiusKm: 1737.4, jeansBaseKm: 1737.4,
      radiusLabel: "1,737.4 km volumetric",
      exoAltKm: 0,
      T: 270.4, tEstimate: true,
      sheetEsc: "2.38",
      tNote: "The Moon Fact Sheet prints a black-body temperature of 270.4 K and a diurnal equatorial range of 95 K to 390 K. It does not print one average surface temperature. This desk uses 270.4 K as a classroom stand-in for that surface-bounded exosphere. Catling and Zahnle plot an average surface temperature for the Moon. 270.4 K is the fact sheet’s black-body figure, not a number read off their graph.",
      zNote: "Surface-bounded exosphere. The radius in the formulas is the volumetric mean radius. The fact sheet’s atmosphere is about 25,000 kg."
    },
    {
      id: "mars", name: "Mars",
      gm: 0.042828e6, radiusKm: 3389.5, jeansBaseKm: 3389.5,
      radiusLabel: "3,389.5 km volumetric",
      exoAltKm: 200, exoAltEstimate: true,
      T: 200,
      sheetEsc: "5.03",
      tNote: "García Muñoz, Koskinen, and Lavvas: exospheric temperature about 200 K at low solar activity and about 350 K at high solar activity. This button uses 200 K.",
      zNote: "Table 1 lists an exobase altitude of about 180–210 km, and the text puts the exobase near 200 km. This desk uses 200 km."
    },
    {
      id: "titan", name: "Titan",
      gmFromMass: true, mass1e24: 0.13455, radiusKm: 2575, jeansBaseKm: 2575,
      radiusLabel: "2,575 km, one printed radius",
      exoAltKm: 1500,
      T: 150,
      sheetEsc: "",
      tNote: "García Muñoz, Koskinen, and Lavvas: an average upper-atmosphere temperature of 150 K, consistent with Cassini. Table 1 lists about 150 K. This button uses 150 K.",
      zNote: "Table 1 lists an exobase altitude of about 1500 km. Catling and Kasting put Titan’s exobase around 1400–1500 km. This desk uses 1500 km."
    },
    {
      id: "jupiter", name: "Jupiter",
      gm: 126.687e6, radiusKm: 69911, jeansBaseKm: 71492, eqRadiusKm: 71492,
      radiusLabel: "69,911 km volumetric · 71,492 km equatorial 1 bar",
      exoAltKm: 1600, oblate: true,
      T: 900,
      sheetEsc: "59.5",
      tNote: "García Muñoz, Koskinen, and Lavvas, Table 1: 900–1000 K. The Galileo probe measured a maximum of about 900 K in the upper atmosphere (Seiff et al. 1998). This button uses 900 K, the low end of the table.",
      zNote: "Table 1 lists an exobase altitude of about 1600 km. It is added to the equatorial 1-bar radius, 71,492 km, because that is the radius the fact sheet’s escape speed belongs to."
    },
    {
      id: "saturn", name: "Saturn",
      gm: 37.931e6, radiusKm: 58232, jeansBaseKm: 60268, eqRadiusKm: 60268,
      radiusLabel: "58,232 km volumetric · 60,268 km equatorial 1 bar",
      exoAltKm: 2850, oblate: true,
      T: 500, tEstimate: true,
      sheetEsc: "35.5",
      tNote: "García Muñoz, Koskinen, and Lavvas, Table 1: 400–600 K. This button uses 500 K, the middle of that range. It is a classroom choice inside the cited range, not a new measurement.",
      zNote: "Table 1 lists an exobase altitude of about 2850 km, added to the equatorial 1-bar radius, 60,268 km."
    },
    {
      id: "uranus", name: "Uranus",
      gm: 5.7940e6, radiusKm: 25362, jeansBaseKm: 25559, eqRadiusKm: 25559,
      radiusLabel: "25,362 km volumetric · 25,559 km equatorial 1 bar",
      exoAltKm: 4700, oblate: true,
      T: 850,
      sheetEsc: "21.3",
      tNote: "García Muñoz, Koskinen, and Lavvas, Table 1: 850 K. This button uses 850 K.",
      zNote: "Table 1 lists an exobase altitude of about 4700 km, added to the equatorial 1-bar radius, 25,559 km."
    },
    {
      id: "neptune", name: "Neptune",
      gm: 6.8351e6, radiusKm: 24622, jeansBaseKm: 24764, eqRadiusKm: 24764,
      radiusLabel: "24,622 km volumetric · 24,764 km equatorial 1 bar",
      exoAltKm: 2200, oblate: true,
      T: 600,
      sheetEsc: "23.5",
      tNote: "García Muñoz, Koskinen, and Lavvas, Table 1: 600 K. This button uses 600 K.",
      zNote: "Table 1 lists an exobase altitude of about 2200 km, added to the equatorial 1-bar radius, 24,764 km."
    },
    {
      id: "pluto", name: "Pluto",
      gm: 0.000870e6, radiusKm: 1188, jeansBaseKm: 1188,
      radiusLabel: "1,188 km volumetric",
      exoAltKm: 1710,
      T: 65,
      sheetEsc: "1.21",
      tNote: "Young et al. 2018, from the New Horizons Alice solar occultation: upper-atmosphere temperatures near 65–68 K, and an exobase near 1710 km altitude (radius about 2900 km). This button uses 65 K, the low end of that range.",
      zNote: "Young et al. 2018: exobase altitude about 1710 km. Added to the fact sheet’s volumetric mean radius, 1,188 km. 1,188 + 1,710 = 2,898 km, beside their radius of about 2,900 km."
    }
  ];

  function massKg(mu) {
    return mu * U;
  }

  function vMostProbable(T, mu) {
    return Math.sqrt((2 * K * T) / massKg(mu));
  }

  function vMean(T, mu) {
    return Math.sqrt((8 * K * T) / (Math.PI * massKg(mu)));
  }

  function vRms(T, mu) {
    return Math.sqrt((3 * K * T) / massKg(mu));
  }

  function gmFromMass(mass1e24) {
    return (G * mass1e24 * 1e24) / 1e9;
  }

  function resolve(body) {
    if (!body) return null;
    var gm = body.gmFromMass ? gmFromMass(body.mass1e24) : body.gm;
    var exo = body.exoAltKm || 0;
    var base = body.jeansBaseKm;
    return {
      id: body.id,
      name: body.name,
      gm: gm,
      radiusKm: body.radiusKm,
      jeansBaseKm: base,
      jeansRadiusKm: base + exo,
      exoAltKm: exo,
      exoAltEstimate: !!body.exoAltEstimate,
      oblate: !!body.oblate,
      T: body.T,
      tEstimate: !!body.tEstimate,
      tNote: body.tNote || "",
      zNote: body.zNote || "",
      radiusLabel: body.radiusLabel || "",
      sheetEsc: body.sheetEsc || "",
      custom: !!body.custom,
      mass1e24: body.mass1e24
    };
  }

  function customBody(mass1e24, radiusKm) {
    if (!(mass1e24 > 0) || !(radiusKm > 0) || !isFinite(mass1e24) || !isFinite(radiusKm)) return null;
    return resolve({
      id: "custom",
      name: "Custom",
      gmFromMass: true,
      mass1e24: mass1e24,
      radiusKm: radiusKm,
      jeansBaseKm: radiusKm,
      exoAltKm: 0,
      custom: true,
      radiusLabel: "typed radius",
      tNote: "Custom temperature. There is no cited exobase for a typed world.",
      zNote: "The radius you type is r in both speeds and in lambda. No exobase altitude is added. GM is the 2022 CODATA G times the mass you type."
    });
  }

  function escapeKms(gmKm3, radiusKm) {
    return Math.sqrt((2 * gmKm3) / radiusKm);
  }

  function lambdaFromSpeeds(vEsc, vMp) {
    return (vEsc * vEsc) / (vMp * vMp);
  }

  function lambdaFromGm(gmKm3, mu, T, radiusKm) {
    var gmSi = gmKm3 * 1e9;
    var rM = radiusKm * 1000;
    return (gmSi * massKg(mu)) / (K * T * rM);
  }

  function lambdaAtSix() {
    var factor = SIX * Math.sqrt(4 / Math.PI);
    return factor * factor;
  }

  function heldByRule(vEscKms, vMeanKms) {
    return vEscKms / vMeanKms >= SIX;
  }

  function gasById(id) {
    var i;
    for (i = 0; i < GASES.length; i++) if (GASES[i].id === id) return GASES[i];
    return null;
  }

  function worldById(id) {
    var i;
    for (i = 0; i < WORLDS.length; i++) if (WORLDS[i].id === id) return resolve(WORLDS[i]);
    return null;
  }

  function worlds() {
    return WORLDS.map(resolve);
  }

  function gases() {
    return GASES.map(function (g) {
      return { id: g.id, name: g.name, symbol: g.symbol, html: g.html, mu: g.mu };
    });
  }

  function evaluate(body, T) {
    var b = body && body.gm ? body : resolve(body);
    if (!b || !(T > 0) || !isFinite(T)) return null;
    var vSurf = escapeKms(b.gm, b.radiusKm);
    var vJeans = escapeKms(b.gm, b.jeansRadiusKm);
    var rows = GASES.map(function (g) {
      var mp = vMostProbable(T, g.mu) / 1000;
      var mean = vMean(T, g.mu) / 1000;
      var rms = vRms(T, g.mu) / 1000;
      var ratio = vJeans / mean;
      var lam = lambdaFromSpeeds(vJeans, mp);
      return {
        id: g.id,
        name: g.name,
        symbol: g.symbol,
        html: g.html,
        mu: g.mu,
        vMp: mp,
        vMean: mean,
        vRms: rms,
        ratio: ratio,
        lambda: lam,
        held: heldByRule(vJeans, mean),
        line: SIX * mean
      };
    });
    var heldCount = 0;
    var i;
    for (i = 0; i < rows.length; i++) if (rows[i].held) heldCount++;
    return {
      body: b,
      T: T,
      vSurf: vSurf,
      vJeans: vJeans,
      rJeans: b.jeansRadiusKm,
      rows: rows,
      heldCount: heldCount
    };
  }

  function rowById(result, id) {
    if (!result) return null;
    var i;
    for (i = 0; i < result.rows.length; i++) if (result.rows[i].id === id) return result.rows[i];
    return null;
  }

  function retentionSpeed(T, mu) {
    return SIX * (vMean(T, mu) / 1000);
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + parts.join(".");
  }

  function formatKms(v) {
    if (!isFinite(v)) return "—";
    var digits = Math.abs(v) >= 100 ? 2 : 3;
    return group(v, digits) + " km/s";
  }

  function formatRatio(v) {
    if (!isFinite(v)) return "—";
    if (v >= 100) return group(v, 0);
    if (v >= 10) return group(v, 1);
    return group(v, 2);
  }

  function formatLambda(v) {
    if (!isFinite(v)) return "—";
    if (v >= 10000) return v.toExponential(2).replace("e+", " × 10^");
    if (v >= 100) return group(v, 0);
    if (v >= 10) return group(v, 1);
    return group(v, 2);
  }

  function formatTemp(v) {
    if (!isFinite(v)) return "—";
    if (Math.abs(v - Math.round(v)) < 0.05) return group(Math.round(v), 0);
    return group(v, 1);
  }

  function formatKm(v) {
    if (!isFinite(v)) return "—";
    if (Math.abs(v - Math.round(v)) < 0.05) return group(Math.round(v), 0) + " km";
    var digits = v >= 1000 ? 0 : (Math.abs(v * 10 - Math.round(v * 10)) < 0.05 ? 1 : 3);
    if (Math.abs(v - Math.round(v * 1000) / 1000) < 1e-6 && Math.round(v * 1000) % 1000 !== 0) {
      var s = v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
      var p = s.split(".");
      return group(Number(p[0]), 0) + (p[1] ? "." + p[1] : "") + " km";
    }
    return group(v, digits) + " km";
  }

  function logMap(t, a, b) {
    var u = Math.max(0, Math.min(1, t));
    return Math.exp(Math.log(a) + u * (Math.log(b) - Math.log(a)));
  }

  function logUnmap(v, a, b) {
    if (!(v > 0)) return 0;
    return (Math.log(v) - Math.log(a)) / (Math.log(b) - Math.log(a));
  }

  function inRange(v, a, b) {
    return isFinite(v) && v >= a && v <= b;
  }

  return {
    K: K,
    U: U,
    G: G,
    SIX: SIX,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    M_MIN: M_MIN,
    M_MAX: M_MAX,
    R_MIN: R_MIN,
    R_MAX: R_MAX,
    massKg: massKg,
    vMostProbable: vMostProbable,
    vMean: vMean,
    vRms: vRms,
    gmFromMass: gmFromMass,
    escapeKms: escapeKms,
    lambdaFromSpeeds: lambdaFromSpeeds,
    lambdaFromGm: lambdaFromGm,
    lambdaAtSix: lambdaAtSix,
    heldByRule: heldByRule,
    gases: gases,
    gasById: gasById,
    worlds: worlds,
    worldById: worldById,
    customBody: customBody,
    evaluate: evaluate,
    rowById: rowById,
    retentionSpeed: retentionSpeed,
    formatKms: formatKms,
    formatRatio: formatRatio,
    formatLambda: formatLambda,
    formatTemp: formatTemp,
    formatKm: formatKm,
    logMap: logMap,
    logUnmap: logUnmap,
    inRange: inRange
  };
});
