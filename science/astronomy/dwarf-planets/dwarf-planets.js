/*! Dwarf planets and the classical Kuiper belt, for a classroom desk.

    The map is a top-down view of the ecliptic. A point on an orbit is
    the usual perifocal place, then the standard rotation by the node,
    the argument of perihelion, and the inclination. z is dropped.
    The symbol sits at perihelion. It is not a date.

    Linear distance plots that ecliptic radius in AU. Log distance
    plots log10 of the same radius, from 1 AU out to Eris’s aphelion.
    The outer edge is that aphelion so the orbit fits. It is not a
    second catalogue.

    Pluto and Neptune use the NSSDCA J2000 blocks already used on the
    resonances desk. Neptune’s 3:2 and 2:1 are that desk’s formula:
    exterior a = a_N × (p/q)^(2/3), with p orbits of Neptune per q of
    the outer body. Ceres, Eris, Haumea, and Makemake use the JPL
    Small-Body Database solutions named on each card. Diameters and
    moon counts that are not on those orbit solutions are the NASA
    Science sentences named beside them.

    The classical band is NASA’s “between about 40 and 50 AU,” drawn
    at 40 and 50. A year, when days are also shown in years, is
    Earth’s 365.256-day sidereal period from the fact sheets.

    Not a JPL Horizons ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DwarfPlanets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var YEAR_DAYS = 365.256;
  var MOON_RADIUS_KM = 1737.4;
  var MOON_DIAMETER_KM = 3474.8;
  var CLASSICAL_INNER = 40;
  var CLASSICAL_OUTER = 50;
  var PLUTO_RADIUS_KM = 1188;
  var CERES_RADIUS_KM = 476;

  var NEPTUNE = {
    id: "neptune",
    name: "Neptune",
    a: 30.06896348,
    aText: "30.06896348",
    e: 0.00858587,
    eText: "0.00858587",
    i: 1.76917,
    iText: "1.76917",
    node: 131.72169,
    nodeText: "131.72169",
    periLon: 44.97135,
    periLonText: "44.97135",
    days: 60189.018,
    daysText: "60,189.018"
  };

  /* JPL strings are the full-precision API values. Fact-sheet strings
     are the printed J2000 lines. */
  var BODIES = [
    {
      id: "ceres",
      name: "Ceres",
      tier: "Dwarf planet · JPL solution 48",
      source: "jpl",
      aText: "2.765552595034094",
      eText: "0.07969229514816586",
      iText: "10.58802780183462",
      nodeText: "80.24862682043221",
      argText: "73.29421453021587",
      qText: "2.545159361382861",
      adText: "2.985945828685327",
      perText: "1679.853119758983",
      orbitId: "48",
      epoch: "2461200.5",
      soln: "2021-04-13 11:04:44",
      sbdb: "1",
      diameterKm: 952,
      diameterText: "952 km",
      diameterApprox: false,
      moonsText: "None"
    },
    {
      id: "pluto",
      name: "Pluto",
      tier: "Dwarf planet · fact sheet J2000",
      source: "factsheet",
      aText: "39.48168677",
      eText: "0.24880766",
      iText: "17.14175",
      nodeText: "110.30347",
      periLonText: "224.06676",
      perText: "90560",
      perPrinted: "90,560",
      diameterKm: 2376,
      diameterText: "2,376 km",
      diameterApprox: false,
      moonsText: "5 — Charon, Styx, Nix, Kerberos, and Hydra"
    },
    {
      id: "haumea",
      name: "Haumea",
      tier: "Dwarf planet · JPL solution 132",
      source: "jpl",
      aText: "43.06029023650952",
      eText: "0.1944430148898797",
      iText: "28.20847393040364",
      nodeText: "121.7860561329425",
      argText: "240.6905472508661",
      qText: "34.68751758088936",
      adText: "51.43306289212968",
      perText: "103208.1173403618",
      orbitId: "132",
      epoch: "2461200.5",
      soln: "2026-06-06 21:06:04",
      sbdb: "136108",
      diameterKm: 1740,
      diameterText: "about 1,740 km",
      diameterApprox: true,
      moonsText: "2 — Namaka and Hi'iaka"
    },
    {
      id: "makemake",
      name: "Makemake",
      tier: "Dwarf planet · JPL solution 130",
      source: "jpl",
      aText: "45.57093317300052",
      eText: "0.1588889953992523",
      iText: "29.02785603743067",
      nodeText: "79.2948338209406",
      argText: "297.0922733397207",
      qText: "38.33021338173601",
      adText: "52.81165296426503",
      perText: "112364.8068762869",
      orbitId: "130",
      epoch: "2461200.5",
      soln: "2026-06-06 21:09:02",
      sbdb: "136472",
      diameterKm: 1430,
      diameterText: "approximately 1,430 km",
      diameterApprox: true,
      moonsText: "1 provisional — S/2015 (136472) 1, nicknamed MK 2"
    },
    {
      id: "eris",
      name: "Eris",
      tier: "Dwarf planet · JPL solution 103",
      source: "jpl",
      aText: "67.93394687853566",
      eText: "0.4382385347971672",
      iText: "43.9258279471791",
      nodeText: "36.00477044417249",
      argText: "150.7949235840312",
      qText: "38.16267353549761",
      adText: "97.70522022157373",
      perText: "204516.6629430732",
      orbitId: "103",
      epoch: "2461200.5",
      soln: "2026-06-06 21:06:42",
      sbdb: "136199",
      diameterKm: 2400,
      diameterText: "about 2,400 km",
      diameterApprox: true,
      moonsText: "1 — Dysnomia"
    }
  ];

  function byId(id) {
    var i;
    for (i = 0; i < BODIES.length; i++) if (BODIES[i].id === id) return BODIES[i];
    return null;
  }

  function num(text) {
    return Number(text);
  }

  function argDeg(body) {
    if (body.argText) return num(body.argText);
    return num(body.periLonText) - num(body.nodeText);
  }

  function argText(body) {
    if (body.argText) return body.argText;
    return argDeg(body).toFixed(5);
  }

  function commas(intPart) {
    return String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function groupNumber(text) {
    var s = String(text);
    var neg = s.charAt(0) === "-";
    if (neg) s = s.slice(1);
    var parts = s.split(".");
    return (neg ? "−" : "") + commas(parts[0]) + (parts.length > 1 ? "." + parts[1] : "");
  }

  function formatYears(days) {
    return (days / YEAR_DAYS).toFixed(4);
  }

  function resonant(p, q) {
    var ratio = p / q;
    return {
      p: p,
      q: q,
      name: p + ":" + q,
      au: NEPTUNE.a * Math.pow(ratio, 2 / 3),
      days: NEPTUNE.days * ratio
    };
  }

  function resonanceText(res) {
    return {
      au: res.au.toFixed(6),
      days: groupNumber(res.days.toFixed(3))
    };
  }

  function classicalOf(a) {
    if (a >= CLASSICAL_INNER && a <= CLASSICAL_OUTER) return "inside";
    return "outside";
  }

  function sizeRatio(body) {
    var value = body.diameterKm / MOON_DIAMETER_KM;
    var digits = body.diameterApprox ? 2 : 3;
    var numText = value.toFixed(digits);
    return {
      value: value,
      text: body.diameterApprox ? "about " + numText : numText
    };
  }

  function trueRadius(a, e, f) {
    return a * (1 - e * e) / (1 + e * Math.cos(f));
  }

  function project(a, e, iDeg, nodeDeg, arg, f) {
    var r = trueRadius(a, e, f);
    var i = iDeg * Math.PI / 180;
    var O = nodeDeg * Math.PI / 180;
    var w = arg * Math.PI / 180;
    var cwf = Math.cos(w + f);
    var swf = Math.sin(w + f);
    var x = r * (Math.cos(O) * cwf - Math.sin(O) * swf * Math.cos(i));
    var y = r * (Math.sin(O) * cwf + Math.cos(O) * swf * Math.cos(i));
    return { x: x, y: y, r: r, ecl: Math.sqrt(x * x + y * y) };
  }

  function projectBody(body, f) {
    return project(num(body.aText), num(body.eText), num(body.iText), num(body.nodeText), argDeg(body), f);
  }

  function perihelion(body) {
    var p = projectBody(body, 0);
    p.q = num(body.aText) * (1 - num(body.eText));
    return p;
  }

  function orbitPoints(body, n) {
    var count = n || 180;
    var pts = [];
    var k;
    for (k = 0; k < count; k++) pts.push(projectBody(body, (k / count) * 2 * Math.PI));
    return pts;
  }

  function outerAu() {
    return num(byId("eris").adText);
  }

  function radialUnit(R, mode, rMax) {
    if (!(R > 0) || !(rMax > 1)) return 0;
    if (mode === "log") {
      if (R <= 1) return 0;
      return Math.log10(R) / Math.log10(rMax);
    }
    return R / rMax;
  }

  function scalePoint(p, mode, rMax) {
    var R = p.ecl;
    var u = radialUnit(R, mode, rMax);
    if (!(R > 0)) return { x: 0, y: 0, u: 0 };
    return { x: (p.x / R) * u, y: (p.y / R) * u, u: u };
  }

  function qText(body) {
    if (body.qText) return body.qText;
    return (num(body.aText) * (1 - num(body.eText))).toFixed(6);
  }

  function adTextOf(body) {
    if (body.adText) return body.adText;
    return (num(body.aText) * (1 + num(body.eText))).toFixed(6);
  }

  function periodClause(body) {
    var days = num(body.perText);
    var years = formatYears(days);
    var printed = body.perPrinted ? body.perPrinted : groupNumber(body.perText);
    return printed + " days, which is " + years + " years of " + YEAR_DAYS + " days";
  }

  function beltClause(body) {
    var where = classicalOf(num(body.aText));
    if (where === "inside") {
      return "The semi-major axis falls inside the about 40 to 50 AU range. That is NASA’s range for the average distance of classical KBOs. This page does not call " + body.name + " a classical KBO on that fact alone.";
    }
    return "The semi-major axis is outside the about 40 to 50 AU range NASA gives for the average distance of classical KBOs.";
  }

  function explain(id) {
    var b = byId(id);
    var r32 = resonant(3, 2);
    var t32 = resonanceText(r32);
    if (id === "pluto") {
      return "Pluto. NSSDCA Pluto Fact Sheet, mean orbital elements (J2000): semi-major axis " + b.aText + " AU, eccentricity " + b.eText + ", inclination " + b.iText + "°, longitude of the ascending node " + b.nodeText + "°, longitude of perihelion " + b.periLonText + "°. The argument of perihelion in the ecliptic rotation is " + b.periLonText + " − " + b.nodeText + " = " + argText(b) + "°. Perihelion a(1−e) is " + qText(b) + " AU. Aphelion a(1+e) is " + adTextOf(b) + " AU. The sidereal orbit period on that sheet is 90,560 days. Divided by Earth’s " + YEAR_DAYS + "-day sidereal period, that is " + formatYears(90560) + " years. The sheet’s Pluto/Earth period ratio prints 247.94. NASA Science calls the orbit 248 years long and the equatorial diameter about 2,377 km. The circle here is 2,376 km, twice the fact-sheet equatorial radius of 1,188 km. The comparison table on the same sheet prints eccentricity 0.2444, inclination 17.16°, and a semimajor-axis ratio 39.236. Those lines are not drawn. The number of natural satellites is 5. NASA Science names Charon, Styx, Nix, Kerberos, and Hydra. An exact 3:2 on Neptune’s fact-sheet axis " + NEPTUNE.aText + " AU is " + t32.au + " AU and " + t32.days + " days. Pluto’s printed axis and the 90,560-day period are close to that pair and are not that pair. The resonances desk uses the same formula. NASA Science says Pluto circles the Sun twice for every three times Neptune goes around, and names the plutinos. " + beltClause(b);
    }
    if (id === "ceres") {
      return "Ceres. JPL Small-Body Database orbit solution " + b.orbitId + ", epoch JD " + b.epoch + ", solution date " + b.soln + ". Semi-major axis " + b.aText + " AU, eccentricity " + b.eText + ", inclination " + b.iText + "°, longitude of the ascending node " + b.nodeText + "°, argument of perihelion " + b.argText + "°. JPL’s perihelion is " + b.qText + " AU and aphelion is " + b.adText + " AU. JPL’s period is " + periodClause(b) + ". NASA Science gives a radius of 476 km, an average distance of 2.8 AU, and 1,682 Earth days, or 4.6 Earth years, and says Ceres does not have any moons. The circle is 952 km, twice that radius. The NSSDCA Asteroid Fact Sheet, epoch JD 2457400.5, prints 965 × 961 × 891 km, 2.768 AU, eccentricity 0.0758, inclination 10.59°, and 4.60 yrs, and says many of the diameter values are only rough estimates. Those lines are not the orbit drawn. NASA Science calls Ceres the only dwarf planet in the inner solar system, in the asteroid belt between Mars and Jupiter. It is the contrast inside Neptune, not a Kuiper belt object. The same JPL semi-major axis, and the Kirkwood gaps around it, are the asteroids desk. " + beltClause(b);
    }
    if (id === "eris") {
      return "Eris. JPL Small-Body Database orbit solution " + b.orbitId + ", epoch JD " + b.epoch + ", solution date " + b.soln + ". Semi-major axis " + b.aText + " AU, eccentricity " + b.eText + ", inclination " + b.iText + "°, longitude of the ascending node " + b.nodeText + "°, argument of perihelion " + b.argText + "°. JPL’s perihelion is " + b.qText + " AU and aphelion is " + b.adText + " AU. JPL’s period is " + periodClause(b) + ". NASA Science says an equatorial diameter of about 2,400 km, an average distance of about 68 AU, and 557 Earth years, and one moon, Dysnomia. The 557 years and the about 68 AU are NASA’s sentences. They are not this JPL solution. The circle uses about 2,400 km. NASA Science says the orbit extends far beyond the Kuiper Belt. " + beltClause(b);
    }
    if (id === "haumea") {
      return "Haumea. JPL Small-Body Database orbit solution " + b.orbitId + ", epoch JD " + b.epoch + ", solution date " + b.soln + ". Semi-major axis " + b.aText + " AU, eccentricity " + b.eText + ", inclination " + b.iText + "°, longitude of the ascending node " + b.nodeText + "°, argument of perihelion " + b.argText + "°. JPL’s perihelion is " + b.qText + " AU and aphelion is " + b.adText + " AU. JPL’s period is " + periodClause(b) + ". NASA Science says an equatorial diameter of about 1,740 km, an average distance of 43 AU, and 285 Earth years. The 285 years and the 43 AU are NASA’s sentences. They are not this JPL solution. The circle is that equatorial diameter. NASA Science says the fast spin makes Haumea look like a football, so the circle is not a shape. No short axis is printed on that page, and none is drawn. Two known moons: Namaka is the inner, and Hi'iaka is the outer. NASA Science says Haumea is the first known Kuiper Belt object to have rings, announced in 2017. No ring radius is printed there, so no ring is drawn. " + beltClause(b);
    }
    if (id === "makemake") {
      return "Makemake. JPL Small-Body Database orbit solution " + b.orbitId + ", epoch JD " + b.epoch + ", solution date " + b.soln + ". Semi-major axis " + b.aText + " AU, eccentricity " + b.eText + ", inclination " + b.iText + "°, longitude of the ascending node " + b.nodeText + "°, argument of perihelion " + b.argText + "°. JPL’s perihelion is " + b.qText + " AU and aphelion is " + b.adText + " AU. JPL’s period is " + periodClause(b) + ". NASA Science says a diameter of approximately 1,430 km, an average distance of 45.8 AU, and 305 Earth years. The 305 years and the 45.8 AU are NASA’s sentences. They are not this JPL solution. The circle uses approximately 1,430 km. One provisional moon, S/2015 (136472) 1, nicknamed MK 2. NASA Science says it was seen approximately 13,000 miles from Makemake and that its radius is estimated to be about 50 miles (80 kilometers). That moon is not drawn. " + beltClause(b);
    }
    return "";
  }

  function stats(id) {
    var b = byId(id);
    var rows = [
      ["Diameter", b.diameterText],
      ["Semi-major axis", b.aText + " AU"],
      ["Eccentricity", b.eText],
      ["Inclination", b.iText + "°"],
      ["Period", periodClause(b)],
      ["Known moons", b.moonsText],
      ["Perihelion", qText(b) + " AU"],
      ["Aphelion", adTextOf(b) + " AU"],
      ["Versus the Moon", sizeRatio(b).text + " of the Moon’s diameter"]
    ];
    if (id === "pluto") {
      var t32 = resonanceText(resonant(3, 2));
      rows.push(["Exact 3:2", t32.au + " AU"]);
    }
    rows.push(["Classical 40–50 AU", classicalOf(num(b.aText)) === "inside" ? "Axis inside the range" : "Axis outside the range"]);
    return rows;
  }

  function scaleNote(mode) {
    var edge = byId("eris").adText;
    if (mode === "log") {
      return "Log ruler. Ecliptic distance from the Sun is log10 of the AU, from 1 AU out to Eris’s aphelion " + edge + " AU. A circle stays a circle. An inclined ellipse keeps its angles and changes its radial spacing.";
    }
    return "Linear ruler. One AU on the page is the same length everywhere. Eris’s aphelion, " + edge + " AU, sets the outer edge. Ceres sits near the Sun on this ruler.";
  }

  function ariaSummary(id, mode) {
    var b = byId(id);
    var t32 = resonanceText(resonant(3, 2));
    var t21 = resonanceText(resonant(2, 1));
    var ruler = mode === "log" ? "Log distance" : "Linear distance";
    return ruler + ". Top-down ecliptic map. Neptune’s orbit, the classical band from about 40 to 50 AU, the 3:2 at " + t32.au + " AU, and the 2:1 at " + t21.au + " AU. " + b.name + " is selected. Its symbol is at perihelion, not today’s place.";
  }

  function limitsNote() {
    var t32 = resonanceText(resonant(3, 2));
    var t21 = resonanceText(resonant(2, 1));
    return "Educational schematic. Not a JPL Horizons ephemeris and not a census of the Kuiper belt. Orbits use the elements named on the card, projected on the ecliptic by node, argument of perihelion, and inclination. The symbol sits at perihelion. It is not today’s place. The log control remaps ecliptic distance from the Sun, from 1 AU to Eris’s aphelion. It does not change the elements. The shaded band is NASA’s “between about 40 and 50 AU,” drawn at 40 and 50. The 3:2 circle is " + t32.au + " AU and the 2:1 circle is " + t21.au + " AU, from Neptune’s fact-sheet axis " + NEPTUNE.aText + " AU. Diameters NASA calls about or approximately stay marked that way. Haumea’s circle is the cited equatorial diameter. Haumea is not a sphere, and no short axis is drawn. Ceres’s circle is twice NASA Science’s radius of 476 km. The asteroid fact sheet’s 965 × 961 × 891 km is a different line. Pluto’s circle is twice the fact-sheet equatorial radius, 1,188 km. The Moon is twice the Moon Fact Sheet volumetric mean radius, 1,737.4 km, which is 3,474.8 km.";
  }

  function neptuneNote() {
    var arg = (NEPTUNE.periLon - NEPTUNE.node).toFixed(5);
    return "Neptune’s ellipse is the J2000 block on the Neptune Fact Sheet: semi-major axis " + NEPTUNE.aText + " AU, eccentricity " + NEPTUNE.eText + ", inclination " + NEPTUNE.iText + "°, node " + NEPTUNE.nodeText + "°, longitude of perihelion " + NEPTUNE.periLonText + "°. The argument of perihelion is " + NEPTUNE.periLonText + " − " + NEPTUNE.nodeText + " = " + arg + "°. The comparison table’s eccentricity 0.0097 and inclination 1.770° are not drawn. The sidereal period 60,189.018 days is the period in the resonance formula. The resonances desk uses this axis and this period.";
  }

  return {
    YEAR_DAYS: YEAR_DAYS,
    MOON_RADIUS_KM: MOON_RADIUS_KM,
    MOON_DIAMETER_KM: MOON_DIAMETER_KM,
    PLUTO_RADIUS_KM: PLUTO_RADIUS_KM,
    CERES_RADIUS_KM: CERES_RADIUS_KM,
    CLASSICAL_INNER: CLASSICAL_INNER,
    CLASSICAL_OUTER: CLASSICAL_OUTER,
    neptune: NEPTUNE,
    bodies: BODIES,
    bodyById: byId,
    argDeg: argDeg,
    argText: argText,
    resonant: resonant,
    resonanceText: resonanceText,
    classicalOf: classicalOf,
    sizeRatio: sizeRatio,
    trueRadius: trueRadius,
    project: project,
    projectBody: projectBody,
    perihelion: perihelion,
    orbitPoints: orbitPoints,
    outerAu: outerAu,
    radialUnit: radialUnit,
    scalePoint: scalePoint,
    qText: qText,
    adTextOf: adTextOf,
    periodClause: periodClause,
    explain: explain,
    stats: stats,
    scaleNote: scaleNote,
    ariaSummary: ariaSummary,
    limitsNote: limitsNote,
    neptuneNote: neptuneNote,
    groupNumber: groupNumber,
    formatYears: formatYears
  };
});
