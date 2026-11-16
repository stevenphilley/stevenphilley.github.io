/*! Atmospheric scale height for a classroom desk.
    H = kT / (m g) = R T / (M g)
    P(z) / P0 = exp(−z / H)
    Sheet numbers are the NASA NSSDCA fact sheets. They are not averaged
    with this arithmetic. An isothermal model, not a climate model. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ScaleHeight = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* k is exact in the 2019 SI. u and G are the 2022 CODATA values the
     atmospheric-escape desk uses. R is N_A k, the molar gas constant. */
  var K = 1.380649e-23;
  var U = 1.66053906892e-27;
  var G = 6.67430e-11;
  var R_MOLAR = 8.314462618;

  var T_MIN = 40;
  var T_MAX = 900;
  var MU_MIN = 1;
  var MU_MAX = 50;
  var G_MIN = 0.5;
  var G_MAX = 30;

  /* Titan mass and radius are the Saturnian Satellite Fact Sheet.
     The sheet prints a mass, not a GM and not a surface gravity.
     1,345.5 × 10^20 kg = 0.13455 × 10^24 kg, the same mass the
     atmospheric-escape desk multiplies by this G. */
  var TITAN_MASS_1E24 = 0.13455;
  var TITAN_RADIUS_KM = 2575;

  /*
    Cited from each body’s NASA NSSDCA fact sheet.
    T is the average temperature, or the temperature at 1 bar.
    mu is the mean molecular weight in daltons. A range stays a range.
    g is the mean surface gravity, or the mean gravity at 1 bar.
    sheetH is the printed scale height. A range stays a range.
    A null means the sheet does not print that line.
  */
  var WORLDS = [
    {
      id: "venus",
      name: "Venus",
      swatch: "#e6c27a",
      T: 737,
      tLabel: "737 K",
      tRole: "Average temperature",
      mu: 43.45,
      muLabel: "43.45",
      g: 8.87,
      gLabel: "8.87",
      gRole: "Surface gravity (mean)",
      sheetH: 15.9,
      sheetHLabel: "15.9",
      level: "surface",
      updated: "11 January 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html"
    },
    {
      id: "earth",
      name: "Earth",
      swatch: "#6ea4b8",
      T: 288,
      tLabel: "288 K",
      tRole: "Average temperature",
      mu: 28.97,
      muLabel: "28.97",
      g: 9.820,
      gLabel: "9.820",
      gRole: "Surface gravity (mean)",
      sheetH: 8.5,
      sheetHLabel: "8.5",
      level: "surface",
      updated: "15 November 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html"
    },
    {
      id: "mars",
      name: "Mars",
      swatch: "#c46b4a",
      T: 214,
      tLabel: "~214 K",
      tRole: "Average temperature",
      tilde: true,
      mu: 43.49,
      muLabel: "43.49",
      g: 3.73,
      gLabel: "3.73",
      gRole: "Surface gravity (mean)",
      sheetH: 11.0,
      sheetHLabel: "11.0",
      level: "surface",
      updated: "19 May 2025",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    {
      id: "jupiter",
      name: "Jupiter",
      swatch: "#d4a574",
      T: 165,
      tLabel: "165 K",
      tRole: "Temperature at 1 bar",
      mu: 2.22,
      muLabel: "2.22",
      g: 25.92,
      gLabel: "25.92",
      gRole: "Gravity (mean, 1 bar)",
      sheetH: 27,
      sheetHLabel: "27",
      level: "1-bar",
      updated: "2 October 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html"
    },
    {
      id: "saturn",
      name: "Saturn",
      swatch: "#e6d3a3",
      T: 134,
      tLabel: "134 K",
      tRole: "Temperature at 1 bar",
      mu: 2.07,
      muLabel: "2.07",
      g: 11.19,
      gLabel: "11.19",
      gRole: "Gravity (mean, 1 bar)",
      sheetH: 59.5,
      sheetHLabel: "59.5",
      level: "1-bar",
      updated: "18 March 2025",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html"
    },
    {
      id: "titan",
      name: "Titan",
      swatch: "#c9b27a",
      T: null,
      tLabel: "",
      tRole: "",
      mu: null,
      muLabel: "",
      g: null,
      gLabel: "",
      gRole: "GM/r² from the printed mass and radius",
      sheetH: null,
      sheetHLabel: "",
      level: "computed-g",
      mass1e24: TITAN_MASS_1E24,
      radiusKm: TITAN_RADIUS_KM,
      updated: "22 July 2025",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html"
    },
    {
      id: "uranus",
      name: "Uranus",
      swatch: "#7eb8c9",
      T: 76,
      tLabel: "76 K",
      tRole: "Temperature at 1 bar",
      mu: 2.64,
      muLabel: "2.64",
      g: 9.01,
      gLabel: "9.01",
      gRole: "Gravity (mean, 1 bar)",
      sheetH: 27.7,
      sheetHLabel: "27.7",
      level: "1-bar",
      updated: "2 October 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html"
    },
    {
      id: "neptune",
      name: "Neptune",
      swatch: "#4c6cb3",
      T: 72,
      tLabel: "72 K",
      tRole: "Temperature at 1 bar",
      mu: null,
      muLo: 2.53,
      muHi: 2.69,
      muLabel: "2.53–2.69",
      g: 11.27,
      gLabel: "11.27",
      gRole: "Gravity (mean, 1 bar)",
      sheetH: null,
      sheetHLo: 19.1,
      sheetHHi: 20.3,
      sheetHLabel: "19.1–20.3",
      level: "1-bar",
      updated: "3 October 2024",
      href: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html"
    }
  ];

  function bodyById(id) {
    var i;
    for (i = 0; i < WORLDS.length; i++) {
      if (WORLDS[i].id === id) return WORLDS[i];
    }
    return null;
  }

  function clampT(t) {
    if (!(t > 0) || !isFinite(t)) return T_MIN;
    if (t < T_MIN) return T_MIN;
    if (t > T_MAX) return T_MAX;
    return t;
  }

  function clampMu(mu) {
    if (!(mu > 0) || !isFinite(mu)) return MU_MIN;
    if (mu < MU_MIN) return MU_MIN;
    if (mu > MU_MAX) return MU_MAX;
    return mu;
  }

  function clampG(g) {
    if (!(g > 0) || !isFinite(g)) return G_MIN;
    if (g < G_MIN) return G_MIN;
    if (g > G_MAX) return G_MAX;
    return g;
  }

  function titanGravity() {
    var r = TITAN_RADIUS_KM * 1000;
    return G * (TITAN_MASS_1E24 * 1e24) / (r * r);
  }

  /* Kilometres. m = mu × u, with mu the mean molecular weight in daltons. */
  function scaleHeightKm(T, mu, g) {
    if (!(T > 0) || !(mu > 0) || !(g > 0)) return NaN;
    if (!isFinite(T) || !isFinite(mu) || !isFinite(g)) return NaN;
    return (K * T) / (mu * U * g) / 1000;
  }

  /* The sheet calls a dalton equivalent to grams per mole.
     M = mu × 10^−3 kg/mol. Same H at the thousandth this page prints. */
  function scaleHeightKmR(T, mu, g) {
    if (!(T > 0) || !(mu > 0) || !(g > 0)) return NaN;
    if (!isFinite(T) || !isFinite(mu) || !isFinite(g)) return NaN;
    return (R_MOLAR * T) / ((mu / 1000) * g) / 1000;
  }

  function pressureRatio(zKm, hKm) {
    if (!(hKm > 0) || !isFinite(zKm)) return NaN;
    return Math.exp(-zKm / hKm);
  }

  function formatH(h) {
    if (!isFinite(h)) return "";
    return h.toFixed(3);
  }

  function formatG(g) {
    if (!isFinite(g)) return "";
    return g.toFixed(3);
  }

  function formatP(p) {
    if (!isFinite(p)) return "";
    return p.toFixed(4);
  }

  function formatT(t) {
    if (!isFinite(t)) return "";
    return String(Math.round(t));
  }

  function formatMu(mu) {
    if (!isFinite(mu)) return "";
    return mu.toFixed(2);
  }

  function oneOverE() {
    return Math.exp(-1);
  }

  function folds(h) {
    return [1, 2, 3].map(function (n) {
      return { n: n, zKm: n * h, p: Math.exp(-n) };
    });
  }

  function curve(id, name, h, swatch, dashed, muLabel) {
    return {
      id: id,
      name: name,
      H: h,
      hText: formatH(h),
      swatch: swatch,
      dashed: !!dashed,
      muLabel: muLabel || ""
    };
  }

  function disclaimer() {
    return "Classroom isothermal model, not a climate model.";
  }

  function gapSentence(hText, sheetLabel) {
    var h = Number(hText);
    var sheet = Number(sheetLabel);
    var tenths = sheetLabel.indexOf(".") === -1 ? 0 : sheetLabel.length - sheetLabel.indexOf(".") - 1;
    var rounded = h.toFixed(tenths);
    if (rounded === sheetLabel) {
      return hText + " rounds to the sheet’s " + sheetLabel + " at the digits the sheet prints. The extra digits stay. They are not averaged.";
    }
    return hText + " does not round to " + sheetLabel + ". They are not averaged.";
  }

  function levelSentence(body) {
    if (body.level === "1-bar") {
      return "Gravity and the temperature used here are the sheet’s 1-bar values. The fact-sheet notes put a gas giant’s gravity at the 1-bar level, and the comparison-table note puts a gas giant’s mean temperature at the one bar level. There is no solid surface on the sheet. ";
    }
    return "";
  }

  function isothermalSentence() {
    return "The fact-sheet notes define scale height as the height interval in which the pressure changes by a factor of e. That interval equals kT/(mg) when the temperature is the same at every height. The sheet does not say which temperature produced the printed scale height. ";
  }

  function singleWhy(body, hText) {
    var temp = body.tilde
      ? "The " + body.name + " sheet prints an average temperature of " + body.tLabel + ". The tilde stays. This arithmetic uses " + body.T + " K"
      : "H = kT/(m g) at the " + body.name + " sheet’s " + body.tRole.toLowerCase() + " " + body.tLabel;
    return "Isothermal. " + temp + ", mean molecular weight " + body.muLabel + ", and " + body.gRole.toLowerCase() + " " + body.gLabel + " m/s². This arithmetic is " + hText + " km. The sheet’s scale height is " + body.sheetHLabel + " km. " + gapSentence(hText, body.sheetHLabel) + " " + levelSentence(body) + isothermalSentence() + "At one scale height the pressure is 1/e of the reference pressure, " + formatP(oneOverE()) + ". " + (body.id === "earth" ? "The same sheet prints the defined standard acceleration, CODATA 2018, 9.80665 m/s² exact. This page does not substitute it for 9.820. " : "") + disclaimer();
  }

  function neptuneWhy(lo, hi) {
    return "Isothermal, at the 1-bar level. The Neptune sheet prints temperature at 1 bar 72 K and gravity (mean, 1 bar) 11.27 m/s². Mean molecular weight is the range 2.53–2.69. Scale height is the range 19.1–20.3 km. At 2.53 this arithmetic is " + lo + " km. At 2.69 it is " + hi + " km. The ends are not averaged. Neither arithmetic is a listed end of 19.1–20.3. " + isothermalSentence() + "At either scale height the pressure ratio is 1/e, " + formatP(oneOverE()) + ". " + disclaimer();
  }

  function titanWhy(T, mu, hText) {
    var earth = bodyById("earth");
    var g = titanGravity();
    var factor = earth.g / g;
    var same = T === earth.T && mu === earth.mu;
    var air = same
      ? "The sliders are still Earth’s " + earth.tLabel + " and " + earth.muLabel + ". At those numbers this gravity gives " + hText + " km, which is " + factor.toFixed(3) + " times Earth’s " + formatH(scaleHeightKm(earth.T, earth.mu, earth.g)) + " km, because scale height is inversely proportional to g. "
      : "These sliders are " + formatT(T) + " K and molecular weight " + formatMu(mu) + ". They are not a Titan temperature or molecular weight. The same temperature and molecular weight at Earth’s " + earth.gLabel + " m/s² would give a scale height smaller by " + factor.toFixed(3) + ". ";
    return "Isothermal. The Saturnian Satellite Fact Sheet prints Titan’s mass as 1,345.5 × 10^20 kg and the radius as 2,575 km. It does not print a surface gravity, a temperature, a mean molecular weight, or a scale height. Those cells stay dashes. They are not averaged. This gravity is GM/r² = " + formatG(g) + " m/s², using the 2022 CODATA G. It is not a gravity line on the sheet. " + air + "Low g is why a column of the same air puffs up. The curve is not a claim that the sheet printed Titan’s scale height. " + disclaimer();
  }

  function customWhy(T, mu, g, hText) {
    return "Sliders. Isothermal. H = kT/(m g) = R T/(M g) at " + formatT(T) + " K, mean molecular weight " + formatMu(mu) + ", and " + formatG(g) + " m/s². This arithmetic is " + hText + " km. It is not a fact-sheet scale height. They are not averaged. One scale height drops the pressure by a factor of e, to " + formatP(oneOverE()) + " of the reference pressure. " + disclaimer();
  }

  function statsFor(T, muText, gText, gRole, hText, sheetText) {
    return [
      ["Temperature", T],
      ["Mean molecular weight", muText],
      [gRole, gText],
      ["This arithmetic", hText],
      ["Sheet scale height", sheetText],
      ["Pressure at one H", "1/e = " + formatP(oneOverE())]
    ];
  }

  function scene(opts) {
    opts = opts || {};
    var body = opts.body ? bodyById(opts.body) : null;
    if (opts.body && !body) return { ok: false, why: "" };

    if (body && body.id === "neptune" && opts.mu == null && opts.T == null && opts.g == null) {
      var lo = scaleHeightKm(body.T, body.muLo, body.g);
      var hi = scaleHeightKm(body.T, body.muHi, body.g);
      var loText = formatH(lo);
      var hiText = formatH(hi);
      return {
        ok: true,
        body: body,
        custom: false,
        title: body.name,
        tier: "Ice giant · isothermal at the 1-bar temperature",
        range: loText + " km at 2.53 · " + hiText + " km at 2.69",
        T: body.T,
        mu: null,
        g: body.g,
        curves: [
          curve(body.id, body.name, lo, body.swatch, false, "2.53"),
          curve(body.id, body.name, hi, body.swatch, true, "2.69")
        ],
        hText: loText + " at 2.53; " + hiText + " at 2.69",
        sheetHText: body.sheetHLabel,
        why: neptuneWhy(loText, hiText),
        aria: "Pressure against altitude for Neptune. Two isothermal curves, at molecular weight 2.53 and 2.69. Scale heights " + loText + " km and " + hiText + " km. The sheet prints 19.1 to 20.3 km. Not a climate model.",
        stats: statsFor(body.tLabel, body.muLabel, body.gLabel + " m/s²", body.gRole, loText + " km at 2.53; " + hiText + " km at 2.69", body.sheetHLabel + " km"),
        folds: folds(lo).concat(folds(hi)),
        swatch: body.swatch
      };
    }

    if (body && body.id === "titan") {
      var tT = opts.T;
      var tMu = opts.mu;
      if (!(tT > 0) || !(tMu > 0)) return { ok: false, why: "" };
      var tg = titanGravity();
      var tH = scaleHeightKm(tT, tMu, tg);
      var tText = formatH(tH);
      return {
        ok: true,
        body: body,
        custom: false,
        title: body.name,
        tier: "Moon · gravity from the sheet’s mass and radius",
        range: tText + " km at the sliders",
        T: tT,
        mu: tMu,
        g: tg,
        curves: [curve(body.id, body.name, tH, body.swatch, false, "")],
        hText: tText,
        sheetHText: "—",
        why: titanWhy(tT, tMu, tText),
        aria: "Pressure against altitude at Titan’s computed gravity " + formatG(tg) + " metres per second squared. Scale height " + tText + " km at " + formatT(tT) + " kelvin and molecular weight " + formatMu(tMu) + ". The sheet does not print a scale height. Not a climate model.",
        stats: statsFor(formatT(tT) + " K · not on the sheet", formatMu(tMu) + " · not on the sheet", formatG(tg) + " m/s² · GM/r²", "Gravity", tText + " km at these sliders", "—"),
        folds: folds(tH),
        swatch: body.swatch
      };
    }

    if (body && body.T != null && body.mu != null && body.g != null && opts.T == null && opts.mu == null && opts.g == null) {
      var h = scaleHeightKm(body.T, body.mu, body.g);
      var hText = formatH(h);
      var tier = body.level === "1-bar"
        ? "Giant · isothermal at the 1-bar temperature"
        : "Planet · isothermal at the sheet’s average temperature";
      return {
        ok: true,
        body: body,
        custom: false,
        title: body.name,
        tier: tier,
        range: hText + " km",
        T: body.T,
        mu: body.mu,
        g: body.g,
        curves: [curve(body.id, body.name, h, body.swatch, false, body.muLabel)],
        hText: hText,
        sheetHText: body.sheetHLabel,
        why: singleWhy(body, hText),
        aria: "Pressure against altitude for " + body.name + ". Isothermal scale height " + hText + " km. The sheet prints " + body.sheetHLabel + " km. E-folding heights marked. Not a climate model.",
        stats: statsFor(body.tLabel, body.muLabel, body.gLabel + " m/s²", body.gRole, hText + " km", body.sheetHLabel + " km"),
        folds: folds(h),
        swatch: body.swatch
      };
    }

    var T = clampT(opts.T);
    var mu = clampMu(opts.mu);
    var g = clampG(opts.g);
    if (!(opts.T > 0) || !(opts.mu > 0) || !(opts.g > 0)) return { ok: false, why: "" };
    var cH = scaleHeightKm(T, mu, g);
    var cText = formatH(cH);
    return {
      ok: true,
      body: null,
      custom: true,
      title: "Custom",
      tier: "Sliders · not a fact sheet",
      range: cText + " km",
      T: T,
      mu: mu,
      g: g,
      curves: [curve("custom", "Custom", cH, "#c8b48a", false, formatMu(mu))],
      hText: cText,
      sheetHText: "—",
      why: customWhy(T, mu, g, cText),
      aria: "Pressure against altitude for a custom isothermal atmosphere. Scale height " + cText + " km. Not a fact-sheet value. Not a climate model.",
      stats: statsFor(formatT(T) + " K", formatMu(mu), formatG(g) + " m/s²", "Gravity", cText + " km", "—"),
      folds: folds(cH),
      swatch: "#c8b48a"
    };
  }

  return {
    K: K,
    U: U,
    G: G,
    R_MOLAR: R_MOLAR,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    MU_MIN: MU_MIN,
    MU_MAX: MU_MAX,
    G_MIN: G_MIN,
    G_MAX: G_MAX,
    TITAN_MASS_1E24: TITAN_MASS_1E24,
    TITAN_RADIUS_KM: TITAN_RADIUS_KM,
    WORLDS: WORLDS,
    bodyById: bodyById,
    clampT: clampT,
    clampMu: clampMu,
    clampG: clampG,
    titanGravity: titanGravity,
    scaleHeightKm: scaleHeightKm,
    scaleHeightKmR: scaleHeightKmR,
    pressureRatio: pressureRatio,
    formatH: formatH,
    formatG: formatG,
    formatP: formatP,
    formatT: formatT,
    formatMu: formatMu,
    oneOverE: oneOverE,
    scene: scene
  };
});
