/*! Two-body barycenter.
    r1 = a * m2 / (m1 + m2) is the distance from body 1's center
    to the center of mass. r2 = a * m1 / (m1 + m2) is the distance
    from body 2. They add to a.

    Planet and moon inputs are the NASA NSSDCA fact-sheet lines
    named on each preset. The Alpha Centauri preset uses the
    Akeson et al. 2021 masses, angular axis, parallax, and radii
    already on the binary-stars desk, and the IAU lengths that
    desk uses. The solar-system wobble places planets with the
    solar map's approximate elements and weights them by the
    fact-sheet masses. It is not a second ephemeris.

    Not an ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Barycenter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* IAU 2012 Resolution B2. The same meter the binary-stars desk uses. */
  var AU_M = 149597870700;
  var AU_KM = AU_M / 1000;
  /* IAU 2015 nominal solar radius, 6.957e8 m. Binary-star radii only. */
  var R_SUN_NOMINAL_M = 6.957e8;

  /* Sun Fact Sheet mass, 1,988,400 × 10^24 kg. One solar mass when a
     paper's solar masses are shown in kilograms. The ratio does not
     depend on that conversion. */
  var SUN_MASS_KG = 1988400 * 1e24;
  /* Earth Fact Sheet mass. The Earth-mass unit. The Moon sheet's Earth
     column, 5.9724 × 10^24 kg, is not this unit. */
  var EARTH_MASS_KG = 5.9722 * 1e24;

  var MASS_MIN = 1e20;
  var MASS_MAX = 1e33;
  var A_MIN_KM = 1000;
  var A_MAX_KM = 1e13;
  var R_MIN_KM = 1;
  var R_MAX_KM = 2e9;
  var SLIDER_STEPS = 1000;
  /* The solar map's yearOf uses a 365.25-day year. The sample ends at
     year 2050 so it stays on JPL Table 1 (1800–2050). */
  var WOBBLE_JD0 = 2451545;
  var WOBBLE_YEAR_DAYS = 365.25;
  var WOBBLE_YEARS = 50;
  var WOBBLE_STEP_DAYS = 20;

  /* Eight planets for the schematic solar-system barycenter.
     Earth on the solar map is the Earth–Moon barycenter, so that
     point carries the Earth sheet's mass plus the Moon sheet's mass.
     Pluto is not in the sum. */
  var WOBBLE = [
    { id: "mercury", name: "Mercury", massCoeff: 0.33010, massExp: 24 },
    { id: "venus", name: "Venus", massCoeff: 4.8673, massExp: 24 },
    { id: "earth", name: "Earth–Moon barycenter", massCoeff: 5.9722, massExp: 24, moonCoeff: 0.07346, moonExp: 24 },
    { id: "mars", name: "Mars", massCoeff: 0.64169, massExp: 24 },
    { id: "jupiter", name: "Jupiter", massCoeff: 1898.13, massExp: 24 },
    { id: "saturn", name: "Saturn", massCoeff: 568.32, massExp: 24 },
    { id: "uranus", name: "Uranus", massCoeff: 86.811, massExp: 24 },
    { id: "neptune", name: "Neptune", massCoeff: 102.409, massExp: 24 }
  ];

  function kg(coeff, exp) {
    return coeff * Math.pow(10, exp);
  }

  WOBBLE.forEach(function (p) {
    p.massKg = kg(p.massCoeff, p.massExp);
    if (p.moonCoeff) p.massKg += kg(p.moonCoeff, p.moonExp);
  });

  function commas(head) {
    return head.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fixed(n, digits) {
    var s = Number(n).toFixed(digits);
    var parts = s.split(".");
    var sign = "";
    var head = parts[0];
    if (head.charAt(0) === "-") {
      sign = "−";
      head = head.slice(1);
    }
    return sign + commas(head) + (parts[1] ? "." + parts[1] : "");
  }

  function formatKm(km) {
    if (!isFinite(km)) return "";
    var digits = Math.abs(km) >= 1e6 ? 0 : 1;
    return fixed(km, digits) + " km";
  }

  function formatAuFromKm(km) {
    if (!isFinite(km)) return "";
    return fixed(km / AU_KM, 6) + " AU";
  }

  function formatRatio(q) {
    if (!isFinite(q)) return "";
    if (q >= 100) return q.toFixed(1);
    if (q >= 10) return q.toFixed(2);
    if (q >= 0.01) return q.toFixed(3);
    return q.toFixed(6);
  }

  function formatSci(massKg, digits) {
    if (!(massKg > 0) || !isFinite(massKg)) return "";
    var exp = Math.floor(Math.log10(massKg) + 1e-12);
    var coeff = massKg / Math.pow(10, exp);
    var text = coeff.toFixed(digits).replace(/\.?0+$/, "");
    return { exp: exp, text: text };
  }

  function formatMassKg(massKg) {
    var sci = formatSci(massKg, 4);
    if (!sci) return "";
    return sci.text + " × 10^" + sci.exp + " kg";
  }

  function formatSiMass(massKg) {
    var sci = formatSci(massKg, 4);
    if (!sci) return "";
    return sci.text + "e" + sci.exp;
  }

  /* Earth masses divide by the Earth sheet. Solar masses divide by the
     Sun sheet. The Sun sheet prints the ratio 332,900. The division
     1,988,400 / 5.9722 is not substituted for that line. */
  function formatScaled(massKg, unitKg) {
    if (!(massKg > 0) || !(unitKg > 0)) return "";
    var q = massKg / unitKg;
    if (!isFinite(q)) return "";
    if (q >= 100) return q.toFixed(2);
    if (q >= 0.001) return q.toFixed(6);
    var sci = formatSci(q, 4);
    return sci.text + "e" + sci.exp;
  }

  function formatEarthMass(massKg) {
    return formatScaled(massKg, EARTH_MASS_KG);
  }

  function formatSolarMass(massKg) {
    return formatScaled(massKg, SUN_MASS_KG);
  }

  function formatLengthInput(km, unit) {
    if (!(km > 0) || !isFinite(km)) return "";
    if (unit === "au") return (km / AU_KM).toFixed(6);
    if (Math.abs(km - Math.round(km)) < 1e-2 && km < 1e15) return String(Math.round(km));
    if (km < 1e7) {
      var tenth = Math.round(km * 10) / 10;
      if (Math.abs(km - tenth) < 1e-3) return String(tenth);
    }
    return km.toExponential(6).replace(/\+/g, "");
  }

  /*
    aKm is the separation used as a in r1 = a m2 / (m1 + m2).
    For a fact-sheet semimajor axis, r1 is the semimajor axis of
    body 1 about the barycenter, and it is the distance only when
    the relative orbit is a circle.
  */
  var PAIRS = [
    {
      id: "earth-moon",
      title: "Earth–Moon",
      name1: "Earth",
      name2: "Moon",
      m1: 5.9722e24,
      m2: 0.07346e24,
      m1Label: "5.9722 × 10^24 kg",
      m2Label: "0.07346 × 10^24 kg",
      aKm: 384400,
      aLabel: "0.3844 × 10^6 km",
      r1Km: 6371,
      r2Km: 1737.4,
      r1Label: "6,371.000 km",
      r2Label: "1,737.4 km",
      r1Role: "Earth volumetric mean radius",
      r2Role: "Moon volumetric mean radius",
      fill1: "#6ea4b8",
      fill2: "#c5c1b6",
      periodLabel: "27.3217 days",
      tier: "Earth sheet and Moon sheet",
      sourceNote: "The Earth sheet’s mass is 5.9722 × 10^24 kg, updated 15 November 2024. The Moon sheet’s Earth column prints 5.9724 × 10^24 kg. This page uses the Earth sheet. They are not averaged. The Moon sheet’s mass is 0.07346 × 10^24 kg. The separation is the Moon sheet’s semimajor axis, 0.3844 × 10^6 km, the orbit about the Earth. The Moon sheet’s eccentricity is 0.0549, so this a is the semimajor axis of the relative orbit, not the distance today. Earth’s volumetric mean radius is 6,371.000 km. The Moon’s is 1,737.4 km."
    },
    {
      id: "sun-jupiter",
      title: "Sun–Jupiter",
      name1: "Sun",
      name2: "Jupiter",
      m1: 1988400 * 1e24,
      m2: 1898.13 * 1e24,
      m1Label: "1,988,400 × 10^24 kg",
      m2Label: "1,898.13 × 10^24 kg",
      aKm: 778479000,
      aLabel: "778.479 × 10^6 km",
      r1Km: 695700,
      r2Km: 69911,
      r1Label: "695,700 km",
      r2Label: "69,911 km",
      r1Role: "Sun volumetric mean radius",
      r2Role: "Jupiter volumetric mean radius",
      fill1: "#ffe6b0",
      fill2: "#d4a574",
      periodLabel: "4,332.589 days",
      tier: "Sun sheet and Jupiter sheet",
      sun: true,
      sourceNote: "The Sun sheet’s mass is 1,988,400 × 10^24 kg. The volumetric mean radius is 695,700 km. The same sheet prints a photosphere thickness of ~500 km. Jupiter’s mass is 1,898.13 × 10^24 kg. The semimajor axis is 778.479 × 10^6 km. The sidereal orbit period is 4,332.589 days. The orbit eccentricity is 0.0487, so a is not the distance today. Jupiter’s volumetric mean radius is 69,911 km. The equatorial radius at 1 bar is 71,492 km. The disk uses the volumetric mean radius. They are not averaged."
    },
    {
      id: "sun-earth",
      title: "Sun–Earth",
      name1: "Sun",
      name2: "Earth",
      m1: 1988400 * 1e24,
      m2: 5.9722e24,
      m1Label: "1,988,400 × 10^24 kg",
      m2Label: "5.9722 × 10^24 kg",
      aKm: 149598000,
      aLabel: "149.598 × 10^6 km",
      r1Km: 695700,
      r2Km: 6371,
      r1Label: "695,700 km",
      r2Label: "6,371.000 km",
      r1Role: "Sun volumetric mean radius",
      r2Role: "Earth volumetric mean radius",
      fill1: "#ffe6b0",
      fill2: "#6ea4b8",
      periodLabel: "365.256 days",
      tier: "Sun sheet and Earth sheet",
      sun: true,
      sourceNote: "The Sun sheet’s mass is 1,988,400 × 10^24 kg and the volumetric mean radius is 695,700 km. The photosphere thickness on that sheet is ~500 km. Earth’s mass is the Earth sheet’s 5.9722 × 10^24 kg. The semimajor axis is 149.598 × 10^6 km. The Earth sheet’s J2000 semimajor axis is 1.00000011 AU. That AU line is not substituted for 149.598 × 10^6 km. The sidereal orbit period is 365.256 days. The eccentricity is 0.0167, so a is not the distance today. Earth’s volumetric mean radius is 6,371.000 km."
    },
    {
      id: "pluto-charon",
      title: "Pluto–Charon",
      name1: "Pluto",
      name2: "Charon",
      m1: 0.01303 * 1e24,
      m2: 1.586 * 1e21,
      m1Label: "0.01303 × 10^24 kg",
      m2Label: "1.586 × 10^21 kg",
      aKm: 19596,
      aLabel: "19,596 km",
      r1Km: 1188,
      r2Km: 606,
      r1Label: "1,188 km",
      r2Label: "606 km",
      r1Role: "Pluto volumetric mean radius",
      r2Role: "Charon equatorial radius",
      fill1: "#c9b8a8",
      fill2: "#d5d0c6",
      periodLabel: "6.3872 days",
      tier: "Pluto sheet, Charon block",
      sourceNote: "The Pluto sheet’s mass is 0.01303 × 10^24 kg. The volumetric mean radius and the equatorial radius are both 1,188 km. The Charon block prints a mean distance from Pluto of 19,596 km, a mass of 1.586 × 10^21 kg, an equatorial radius of 606 km, an orbital eccentricity of 0.0, and a sidereal orbit period of 6.3872 days. The sheet does not print a volumetric mean radius for Charon, so the disk uses the equatorial radius. The sentence “Orbital values are barycentric” sits under the table of Styx, Nix, Kerberos, and Hydra. It is not applied to Charon’s 19,596 km. That line is the mean distance from Pluto, and this page uses it as the separation a."
    },
    {
      id: "alpha-centauri",
      title: "Alpha Centauri",
      name1: "Alpha Centauri A",
      name2: "Alpha Centauri B",
      /* Kilograms use the Sun sheet’s mass as one solar mass. Both
         masses are scaled by the same factor, so r1 does not change.
         The paper’s own solar mass is not a second constant. */
      m1: 1.0788 * SUN_MASS_KG,
      m2: 0.9092 * SUN_MASS_KG,
      massUnit: "sun",
      m1Label: "1.0788 M☉",
      m2Label: "0.9092 M☉",
      aKm: (17.4930 / 0.75081) * AU_KM,
      aLabel: "17.4930″ / 0.75081″",
      r1Km: 1.2175 * R_SUN_NOMINAL_M / 1000,
      r2Km: 0.8591 * R_SUN_NOMINAL_M / 1000,
      r1Label: "1.2175 R☉",
      r2Label: "0.8591 R☉",
      r1Role: "Alpha Centauri A radius",
      r2Role: "Alpha Centauri B radius",
      fill1: "#fff1c9",
      fill2: "#e7c48a",
      periodLabel: "79.762 yr",
      tier: "Akeson et al. 2021, Table 8",
      binary: true,
      sourceNote: "Akeson et al. 2021, Table 8, print masses 1.0788 ± 0.0029 and 0.9092 ± 0.0025 solar masses, a = 17.4930 ± 0.0096″, and a parallax of 750.81 ± 0.38 mas. The relative axis in AU is 17.4930 / 0.75081. Table 8 also prints radii 1.2175 ± 0.0055 R☉ and 0.8591 ± 0.0036 R☉. A solar radius here is the IAU 2015 nominal solar radius, 6.957 × 10^8 m, the length the binary-stars desk uses. The astronomical unit is 149,597,870,700 m. A kilogram reading multiplies by the Sun sheet’s 1,988,400 × 10^24 kg. Both masses take the same factor, so the ratio does not change. The period 79.762 yr is cited and is not an input to r1. The eccentricity is 0.51947, so a is the semimajor axis, not the separation today. Proxima is not in this pair. These masses are not on an NSSDCA fact sheet."
    }
  ];

  function pairById(id) {
    var i;
    for (i = 0; i < PAIRS.length; i++) {
      if (PAIRS[i].id === id) return PAIRS[i];
    }
    return null;
  }

  function clampMass(mass) {
    if (!(mass > 0) || !isFinite(mass)) return MASS_MIN;
    if (mass < MASS_MIN) return MASS_MIN;
    if (mass > MASS_MAX) return MASS_MAX;
    return mass;
  }

  function clampSep(km) {
    if (!(km > 0) || !isFinite(km)) return A_MIN_KM;
    if (km < A_MIN_KM) return A_MIN_KM;
    if (km > A_MAX_KM) return A_MAX_KM;
    return km;
  }

  function clampRadius(km) {
    if (!(km > 0) || !isFinite(km)) return R_MIN_KM;
    if (km < R_MIN_KM) return R_MIN_KM;
    if (km > R_MAX_KM) return R_MAX_KM;
    return km;
  }

  function fromPrimary(a, m1, m2) {
    if (!(a > 0) || !(m1 > 0) || !(m2 > 0)) return NaN;
    if (!isFinite(a) || !isFinite(m1) || !isFinite(m2)) return NaN;
    return a * m2 / (m1 + m2);
  }

  function fromSecondary(a, m1, m2) {
    if (!(a > 0) || !(m1 > 0) || !(m2 > 0)) return NaN;
    if (!isFinite(a) || !isFinite(m1) || !isFinite(m2)) return NaN;
    return a * m1 / (m1 + m2);
  }

  function placeAgainst(distance, radius) {
    if (!(radius > 0) || !isFinite(radius) || !isFinite(distance)) {
      return { known: false, side: "unknown", ratio: NaN };
    }
    var ratio = distance / radius;
    if (distance < radius) return { known: true, side: "inside", ratio: ratio };
    if (distance > radius) return { known: true, side: "outside", ratio: ratio };
    return { known: true, side: "on", ratio: ratio };
  }

  function sideSentence(distanceText, radiusLabel, role, place) {
    var ratioText = formatRatio(place.ratio);
    var verb = "falls on";
    if (place.side === "inside") verb = "is inside";
    if (place.side === "outside") verb = "is outside";
    return "The " + role + " is " + radiusLabel + ". " + distanceText + " " + verb + " it. The ratio is " + ratioText + ". ";
  }

  function sunSentence(r1, place) {
    var gap = Math.abs(r1 - 695700);
    var gapText = formatKm(gap);
    if (place.side === "outside") {
      var two = place.ratio.toFixed(2);
      return "At two decimals the ratio is " + two + ". The Sun sheet prints a photosphere thickness of ~500 km. The gap from the volumetric mean radius out to this barycenter is " + gapText + ". That gap is larger than the printed thickness, so the point sits outside the photosphere on this arithmetic. The thickness is not subtracted. ";
    }
    if (place.side === "inside") {
      return "The Sun sheet prints a photosphere thickness of ~500 km. This barycenter is inside the volumetric mean radius by " + gapText + ", which is larger than that thickness, so the point sits inside the photosphere. The thickness is not added. ";
    }
    return "";
  }

  function disclaimer() {
    return "Classroom two-body picture, not an ephemeris.";
  }

  function whyPair(pair, r1, r2, p1, p2) {
    var open = "r1 = a · m2 / (m1 + m2). " + pair.name1 + " is body 1 and " + pair.name2 + " is body 2. ";
    var masses = "The masses are " + pair.m1Label + " and " + pair.m2Label + ". The separation a is " + pair.aLabel + ". ";
    var dist = "This arithmetic puts the barycenter " + formatKm(r1) + " from " + pair.name1 + "’s center and " + formatKm(r2) + " from " + pair.name2 + "’s center. The unrounded distances add to a. ";
    var where = sideSentence(formatKm(r1), pair.r1Label, pair.r1Role, p1);
    where += sideSentence(formatKm(r2), pair.r2Label, pair.r2Role, p2);
    var photo = pair.sun ? sunSentence(r1, p1) : "";
    return open + masses + pair.sourceNote + " " + dist + where + photo + disclaimer();
  }

  function whyCustom(m1, m2, aKm, r1Km, r2Km, r1, r2, p1, p2) {
    var open = "r1 = a · m2 / (m1 + m2). The boxes are not a fact sheet. ";
    var dist = "At " + formatMassKg(m1) + ", " + formatMassKg(m2) + ", and " + formatKm(aKm) + ", the barycenter is " + formatKm(r1) + " from body 1 and " + formatKm(r2) + " from body 2. The unrounded distances add to a. ";
    var where = "Body 1’s radius in the box is " + formatKm(r1Km) + ". " + sideSentence(formatKm(r1), formatKm(r1Km), "radius", p1);
    where += "Body 2’s radius in the box is " + formatKm(r2Km) + ". " + sideSentence(formatKm(r2), formatKm(r2Km), "radius", p2);
    return open + dist + where + disclaimer();
  }

  function sceneFrom(pair, m1, m2, aKm, radius1, radius2) {
    var r1 = fromPrimary(aKm, m1, m2);
    var r2 = fromSecondary(aKm, m1, m2);
    if (!isFinite(r1) || !isFinite(r2)) return { ok: false, why: "" };
    var p1 = placeAgainst(r1, radius1);
    var p2 = placeAgainst(r2, radius2);
    var custom = !pair;
    var title = pair ? pair.title : "Custom";
    var name1 = pair ? pair.name1 : "Body 1";
    var name2 = pair ? pair.name2 : "Body 2";
    var r1Text = formatKm(r1);
    var r2Text = formatKm(r2);
    var ratioText = formatRatio(p1.ratio);
    var where = p1.side === "inside" ? "Inside " + name1 : (p1.side === "outside" ? "Outside " + name1 : "On " + name1 + "’s radius");
    var why = pair
      ? whyPair(pair, r1, r2, p1, p2)
      : whyCustom(m1, m2, aKm, radius1, radius2, r1, r2, p1, p2);
    return {
      ok: true,
      custom: custom,
      pair: pair,
      title: title,
      tier: pair ? pair.tier : "Sliders · not a fact sheet",
      name1: name1,
      name2: name2,
      m1: m1,
      m2: m2,
      aKm: aKm,
      radius1: radius1,
      radius2: radius2,
      r1: r1,
      r2: r2,
      r1Text: r1Text,
      r2Text: r2Text,
      r1Au: formatAuFromKm(r1),
      r2Au: formatAuFromKm(r2),
      aText: pair ? pair.aLabel : formatKm(aKm),
      m1Label: pair ? pair.m1Label : formatMassKg(m1),
      m2Label: pair ? pair.m2Label : formatMassKg(m2),
      r1Label: pair ? pair.r1Label : formatKm(radius1),
      r2Label: pair ? pair.r2Label : formatKm(radius2),
      ratioText: ratioText,
      side1: p1.side,
      side2: p2.side,
      where: where,
      range: r1Text + " from " + name1 + " · " + where,
      periodLabel: pair ? pair.periodLabel : "—",
      fill1: pair ? pair.fill1 : "#c8b48a",
      fill2: pair ? pair.fill2 : "#9bb0c4",
      why: why,
      aria: title + ". The barycenter is " + r1Text + " from " + name1 + ", " + where.toLowerCase() + ", ratio " + ratioText + ". " + r2Text + " from " + name2 + ". Not an ephemeris.",
      stats: [
        ["Body 1", name1],
        ["Body 2", name2],
        ["Mass 1", pair ? pair.m1Label : formatMassKg(m1)],
        ["Mass 2", pair ? pair.m2Label : formatMassKg(m2)],
        ["Separation a", pair ? pair.aLabel : formatKm(aKm)],
        ["From body 1", r1Text],
        ["From body 2", r2Text],
        ["Body 1 radius", pair ? pair.r1Label : formatKm(radius1)],
        ["r1 / radius", ratioText],
        ["Where", where],
        ["Cited period", pair ? pair.periodLabel : "—"]
      ]
    };
  }

  function scene(opts) {
    opts = opts || {};
    if (opts.pair) {
      var pair = pairById(opts.pair);
      if (!pair) return { ok: false, why: "" };
      return sceneFrom(pair, pair.m1, pair.m2, pair.aKm, pair.r1Km, pair.r2Km);
    }
    if (!(opts.m1 > 0) || !(opts.m2 > 0) || !(opts.aKm > 0)) return { ok: false, why: "" };
    return sceneFrom(null, clampMass(opts.m1), clampMass(opts.m2), clampSep(opts.aKm), clampRadius(opts.radius1), clampRadius(opts.radius2));
  }

  /* Phase runs from 0 to 1. Body 1 and body 2 stay opposite each other.
     The barycenter is the origin. Phase 0 puts body 1 on the −x side. */
  function layout(phase, r1, r2) {
    var turns = phase - Math.floor(phase);
    var th = turns * Math.PI * 2;
    var c = Math.cos(th);
    var s = Math.sin(th);
    return {
      x1: -r1 * c,
      y1: -r1 * s,
      x2: r2 * c,
      y2: r2 * s
    };
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

  /* Heliocentric places, AU, from the solar map. The Sun is the origin
     of those places. The barycenter's offset from the Sun is
     Σ m r / Σ m, with the Sun's mass in the sum and the Sun's place
     at the origin. The Sun's offset from the barycenter is the opposite. */
  function sunFromBodies(bodies, sunMassKg) {
    var mx = 0;
    var my = 0;
    var mz = 0;
    var mass = sunMassKg;
    var i;
    for (i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (!(b.massKg > 0) || !isFinite(b.x) || !isFinite(b.y) || !isFinite(b.z)) return { ok: false };
      mx += b.massKg * b.x;
      my += b.massKg * b.y;
      mz += b.massKg * b.z;
      mass += b.massKg;
    }
    if (!(mass > 0)) return { ok: false };
    var bx = mx / mass;
    var by = my / mass;
    var bz = mz / mass;
    var x = -bx;
    var y = -by;
    var z = -bz;
    var rAu = Math.sqrt(x * x + y * y + z * z);
    return {
      ok: true,
      xAu: x,
      yAu: y,
      zAu: z,
      rAu: rAu,
      planeAu: Math.sqrt(x * x + y * y),
      xKm: x * AU_KM,
      yKm: y * AU_KM,
      zKm: z * AU_KM,
      rKm: rAu * AU_KM,
      planeKm: Math.sqrt(x * x + y * y) * AU_KM
    };
  }

  function wobbleBodiesAt(jd, helio) {
    var out = [];
    var i;
    for (i = 0; i < WOBBLE.length; i++) {
      var p = WOBBLE[i];
      var h = helio(p.id, jd);
      if (!h || !isFinite(h.x) || !isFinite(h.y) || !isFinite(h.z)) return null;
      out.push({ id: p.id, name: p.name, massKg: p.massKg, x: h.x, y: h.y, z: h.z });
    }
    return out;
  }

  function sunOffsetAt(jd, helio) {
    var bodies = wobbleBodiesAt(jd, helio);
    if (!bodies) return { ok: false };
    var off = sunFromBodies(bodies, SUN_MASS_KG);
    if (!off.ok) return off;
    var place = placeAgainst(off.rKm, 695700);
    off.jd = jd;
    off.side = place.side;
    off.ratio = place.ratio;
    off.ratioText = formatRatio(place.ratio);
    off.rText = formatKm(off.rKm);
    off.planeText = formatKm(off.planeKm);
    off.zText = formatKm(off.zKm);
    off.where = place.side === "inside"
      ? "Inside the Sun’s volumetric radius"
      : (place.side === "outside" ? "Outside the Sun’s volumetric radius" : "On the Sun’s volumetric radius");
    return off;
  }

  /* jd0 inclusive, jd1 exclusive, step in days. */
  function sunTrail(jd0, jd1, stepDays, helio) {
    var rows = [];
    if (!(stepDays > 0) || !(jd1 > jd0)) return rows;
    var jd;
    for (jd = jd0; jd < jd1; jd += stepDays) {
      var off = sunOffsetAt(jd, helio);
      if (!off.ok) continue;
      rows.push(off);
    }
    return rows;
  }

  return {
    AU_M: AU_M,
    AU_KM: AU_KM,
    R_SUN_NOMINAL_M: R_SUN_NOMINAL_M,
    SUN_MASS_KG: SUN_MASS_KG,
    EARTH_MASS_KG: EARTH_MASS_KG,
    SUN_RADIUS_KM: 695700,
    MASS_MIN: MASS_MIN,
    MASS_MAX: MASS_MAX,
    A_MIN_KM: A_MIN_KM,
    A_MAX_KM: A_MAX_KM,
    R_MIN_KM: R_MIN_KM,
    R_MAX_KM: R_MAX_KM,
    SLIDER_STEPS: SLIDER_STEPS,
    WOBBLE_JD0: WOBBLE_JD0,
    WOBBLE_YEAR_DAYS: WOBBLE_YEAR_DAYS,
    WOBBLE_YEARS: WOBBLE_YEARS,
    WOBBLE_STEP_DAYS: WOBBLE_STEP_DAYS,
    wobbleJd1: function () { return WOBBLE_JD0 + WOBBLE_YEARS * WOBBLE_YEAR_DAYS; },
    PAIRS: PAIRS,
    WOBBLE: WOBBLE,
    pairById: pairById,
    clampMass: clampMass,
    clampSep: clampSep,
    clampRadius: clampRadius,
    fromPrimary: fromPrimary,
    fromSecondary: fromSecondary,
    placeAgainst: placeAgainst,
    formatKm: formatKm,
    formatAuFromKm: formatAuFromKm,
    formatRatio: formatRatio,
    formatMassKg: formatMassKg,
    formatSiMass: formatSiMass,
    formatEarthMass: formatEarthMass,
    formatSolarMass: formatSolarMass,
    formatLengthInput: formatLengthInput,
    scene: scene,
    layout: layout,
    sliderPos: sliderPos,
    valueFromSlider: valueFromSlider,
    sunFromBodies: sunFromBodies,
    sunOffsetAt: sunOffsetAt,
    sunTrail: sunTrail
  };
});
