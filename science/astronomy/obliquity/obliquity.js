/*! Obliquity: the tilt of a planet's spin axis from its orbit normal.

    Each NSSDCA planet sheet, and the Pluto sheet, prints "Obliquity to
    orbit (deg)". Some also print "Inclination of equator (deg)". The
    comparison table, updated 18 March 2025, prints a coarser obliquity.
    Those figures stay side by side. They are not averaged.

    On this drawing the angle is measured from the orbit normal toward
    the Sun, 0° to 180°. Up to 90°, the solstice subsolar latitude is
    that angle: tropics at ±obliquity, polar circles at ±(90 − obliquity).
    Above 90° the seasonal swing drawn here is 180 minus the obliquity.
    That subtraction matches the Venus and Uranus equator-inclination
    lines. It does not match Pluto's.

    Classroom schematic, not an ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Obliquity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Thousandths of a degree. 23.44° is 23440. Stored as integers. */
  var RIGHT = 90000;
  var STRAIGHT = 180000;
  var EARTH = 23440;

  function body(row) {
    row.obliquityMilli = row.obliquityMilli;
    return row;
  }

  var BODIES = [
    body({
      id: "mercury", name: "Mercury", kind: "planet",
      obliquityMilli: 34, equatorMilli: 34, comparison: "0.034",
      swatch: "#c4b8a5"
    }),
    body({
      id: "venus", name: "Venus", kind: "planet",
      obliquityMilli: 177360, equatorMilli: 2640, comparison: "177.4",
      swatch: "#e6c27a"
    }),
    body({
      id: "earth", name: "Earth", kind: "planet",
      obliquityMilli: 23440, equatorMilli: 23440, comparison: "23.4",
      swatch: "#6ea4b8"
    }),
    body({
      id: "mars", name: "Mars", kind: "planet",
      obliquityMilli: 25190, equatorMilli: 25190, comparison: "25.2",
      swatch: "#c47a55"
    }),
    body({
      id: "jupiter", name: "Jupiter", kind: "planet",
      obliquityMilli: 3130, equatorMilli: 3130, comparison: "3.1",
      swatch: "#d4b48a"
    }),
    body({
      id: "saturn", name: "Saturn", kind: "planet",
      obliquityMilli: 26730, equatorMilli: null, comparison: "26.7",
      swatch: "#e2d2a8"
    }),
    body({
      id: "uranus", name: "Uranus", kind: "planet",
      obliquityMilli: 97770, equatorMilli: 82230, comparison: "97.8",
      swatch: "#8fd0d2"
    }),
    body({
      id: "neptune", name: "Neptune", kind: "planet",
      obliquityMilli: 28320, equatorMilli: 28320, comparison: "28.3",
      swatch: "#5b7fd1"
    }),
    body({
      id: "pluto", name: "Pluto", kind: "dwarf",
      obliquityMilli: 119510, equatorMilli: 57470, comparison: "119.5",
      swatch: "#c9b7c4"
    })
  ];

  function formatMilli(m) {
    var sign = m < 0 ? "-" : "";
    var n = Math.abs(Math.round(m));
    var whole = Math.floor(n / 1000);
    var frac = n % 1000;
    if (frac === 0) return sign + String(whole);
    var tail = String(frac).padStart(3, "0").replace(/0+$/, "");
    return sign + whole + "." + tail;
  }

  function bodyById(id) {
    var i;
    for (i = 0; i < BODIES.length; i++) {
      if (BODIES[i].id === id) return BODIES[i];
    }
    return null;
  }

  function clampMilli(m) {
    if (m < 0) return 0;
    if (m > STRAIGHT) return STRAIGHT;
    return Math.round(m);
  }

  /* Angle between an up-pointing vector and the pointer. dyUp is +up. */
  function angleFromPointer(dx, dyUp) {
    var h = Math.hypot(dx, dyUp);
    if (!(h > 1e-6)) return null;
    var cos = dyUp / h;
    if (cos > 1) cos = 1;
    if (cos < -1) cos = -1;
    return clampMilli(Math.acos(cos) * 180 / Math.PI * 1000);
  }

  function geometry(milli) {
    var m = clampMilli(milli);
    var over = m > RIGHT;
    var seasonal = over ? STRAIGHT - m : m;
    var polar = RIGHT - seasonal;
    return {
      milli: m,
      over: over,
      obliquityLabel: formatMilli(m),
      seasonalMilli: seasonal,
      seasonalLabel: formatMilli(seasonal),
      tropicsLabel: formatMilli(seasonal),
      polarMilli: polar,
      polarLabel: formatMilli(polar),
      supplementLabel: formatMilli(STRAIGHT - m)
    };
  }

  function circleSentence(g) {
    if (g.seasonalMilli === 0) {
      return "The equator lies in the orbital plane. The Sun stays over the equator, so the tropics and the equator are the same line. The polar circles fall on the poles. There is no band of midnight sun or polar night.";
    }
    if (g.seasonalMilli === RIGHT) {
      return "The Sun can stand over either pole. Tropics at ±90°. Polar circles at 0°, the equator, so every latitude has a season of midnight sun and a season of polar night.";
    }
    var sentence = "Tropics at ±" + g.tropicsLabel + "°, the latitude of this seasonal angle. Polar circles at ±" + g.polarLabel + "°, which is 90 minus that angle. Latitudes poleward of the polar circles have a season of midnight sun and a season of polar night.";
    if (g.seasonalMilli === 45000) {
      sentence += " The tropic latitude and the polar-circle latitude meet.";
    } else if (g.seasonalMilli > 45000) {
      sentence += " The tropic latitude is higher than the polar-circle latitude, so those bands overlap.";
    }
    return sentence;
  }

  function strengthSentence(g) {
    var compare;
    if (g.seasonalMilli === EARTH) compare = "This is that Earth figure.";
    else if (g.seasonalMilli < EARTH) compare = "This swing is smaller than Earth’s.";
    else compare = "This swing is larger than Earth’s.";
    return "The solstice subsolar latitude is " + g.seasonalLabel + "°. Earth’s sheet prints 23.44°. " + compare + " A larger swing means a higher summer Sun and a longer summer day on the hemisphere that leans in.";
  }

  function sheetSentence(b, g) {
    var name = b.name;
    var obl = formatMilli(b.obliquityMilli);
    if (b.equatorMilli === null) {
      return "The " + name + " sheet prints obliquity " + obl + "° and does not print an inclination of the equator. This page does not invent one. The circles follow the obliquity.";
    }
    var eq = formatMilli(b.equatorMilli);
    if (b.equatorMilli === g.seasonalMilli) {
      return "The " + name + " sheet prints obliquity " + obl + "° and an inclination of the equator of " + eq + "°. The seasonal swing on this drawing matches that inclination. The two printed lines stay side by side. They are not averaged.";
    }
    return "The " + name + " sheet prints obliquity " + obl + "° and an inclination of the equator of " + eq + "°. 180 − " + obl + " = " + g.supplementLabel + "°, which is not " + eq + "°. The parameter notes define those lines on different planes. This page does not average them. The circles on this drawing follow the obliquity subtraction, not the " + eq + "° line.";
  }

  function extraSentence(b) {
    if (!b) return "";
    if (b.id === "earth") return "The change of Earth’s angle over time is quoted in the note below. This slider does not move it.";
    if (b.id === "mars") return "The caption quoted below describes a larger chaotic range for Mars. This slider stays on the sheet’s present angle until you drag it.";
    if (b.id === "uranus") return "The comparison notes say Uranus rotates almost on its side relative to the orbit.";
    if (b.id === "venus") return "The comparison notes say Venus rotates retrograde, so the tilt is almost 180°.";
    if (b.id === "pluto") return "Pluto is the dwarf-planet column. The comparison notes say Pluto is pointing slightly down.";
    return "";
  }

  function scene(opts) {
    opts = opts || {};
    var picked = opts.planet ? bodyById(opts.planet) : null;
    if (opts.planet && !picked) return { ok: false };
    var milli = picked ? picked.obliquityMilli : clampMilli(opts.milli == null ? EARTH : opts.milli);
    var g = geometry(milli);
    var custom = !picked;
    var match = null;
    if (custom) {
      var i;
      for (i = 0; i < BODIES.length; i++) {
        if (BODIES[i].obliquityMilli === g.milli) match = BODIES[i];
      }
    }
    var title = picked ? picked.name : (match ? "Custom · " + match.name + "’s angle" : "Custom");
    var tier;
    if (picked && picked.kind === "dwarf") tier = "Dwarf planet · solstice view";
    else if (picked && g.over) tier = "Retrograde convention · solstice view";
    else if (picked) tier = "Planet · solstice view";
    else if (g.over) tier = "Custom · above 90°";
    else tier = "Custom angle · solstice view";
    var parts = [];
    parts.push("The axis in this drawing is " + g.obliquityLabel + "° from the orbit normal, tipped toward the Sun. That is a solstice view, not a date.");
    if (g.over) {
      parts.push("An angle above 90° follows the fact-sheet convention. Right-hand north points past the orbit normal. The comparison notes call that a north pole pointing downward. The seasonal swing on this drawing is 180 − " + g.obliquityLabel + " = " + g.seasonalLabel + "°.");
    }
    parts.push(circleSentence(g));
    parts.push(strengthSentence(g));
    if (picked) parts.push(sheetSentence(picked, g));
    else {
      parts.push("Custom angle. Not a fact-sheet line. For Venus and Uranus, 180 minus the obliquity matches the printed inclination of the equator. For Pluto it does not. This custom reading is only the subtraction.");
      if (match) parts.push("This angle matches the " + match.name + " sheet’s obliquity. The button selects that sheet’s notes.");
    }
    var extra = extraSentence(picked);
    if (extra) parts.push(extra);
    parts.push("Classroom schematic, not an ephemeris.");
    var why = parts.join(" ");
    var equatorStat = "—";
    if (picked && picked.equatorMilli === null) equatorStat = "not printed";
    else if (picked) equatorStat = formatMilli(picked.equatorMilli) + "°";
    else equatorStat = "custom";
    var stats = [
      ["Obliquity", g.obliquityLabel + "°"],
      ["Solstice subsolar", g.seasonalLabel + "°"],
      ["Tropics", "±" + g.tropicsLabel + "°"],
      ["Polar circles", "±" + g.polarLabel + "°"],
      ["Equator inclination", equatorStat],
      ["Comparison table", picked ? picked.comparison + "°" : "—"]
    ];
    var aria = "Schematic solstice view. Spin axis " + g.obliquityLabel + " degrees from the orbit normal. Tropics at plus or minus " + g.tropicsLabel + " degrees. Polar circles at plus or minus " + g.polarLabel + " degrees. Not an ephemeris.";
    return {
      ok: true,
      planet: picked,
      custom: custom,
      match: match,
      title: title,
      tier: tier,
      range: g.obliquityLabel + "° from the orbit normal",
      why: why,
      aria: aria,
      stats: stats,
      geometry: g,
      swatch: picked ? picked.swatch : "#c8b48a"
    };
  }

  return {
    BODIES: BODIES,
    EARTH_MILLI: EARTH,
    RIGHT_MILLI: RIGHT,
    STRAIGHT_MILLI: STRAIGHT,
    formatMilli: formatMilli,
    bodyById: bodyById,
    clampMilli: clampMilli,
    angleFromPointer: angleFromPointer,
    geometry: geometry,
    scene: scene
  };
});
