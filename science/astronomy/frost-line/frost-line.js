/*! Frost line (snow line) for a classroom desk.

    The temperature profile is the one Hartmann, Ciesla, Gressel, and
    Alexander 2017 print for Hayashi’s 1981 minimum-mass solar nebula:

        T = 280 K * (r / 1 AU)^(-1/2)

    Podolak 2009, and Sasselov and Lecar 2000, say water ice condenses
    near 170 K in that model and that the radius is 2.7 AU. The
    arithmetic of 280 and 170 is (280/170)^2 = 2.713 AU. This page
    prints both and does not average them.

    The scale multiplies the 280 K. It is a teaching knob, not a
    measured disk. The ice temperature walks 120–180 K because those
    ends are printed: about 120–170 K in Hartmann and coauthors, and
    150–180 K in Podolak, depending on density. The ranges are not
    one measurement.

    Planet marks are NSSDCA J2000 semimajor axes. Densities are the
    bulk-parameter line on each fact sheet. Not a disk model. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FrostLine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Hartmann et al. 2017, equation for Hayashi 1981. Kelvin at 1 AU. */
  var T0 = 280;
  /* The temperature in the printed 2.7 AU sentence. */
  var T_PAPER = 170;
  /* Hartmann et al.: generally about 120–170 K. Podolak: 150–180 K. */
  var T_MIN = 120;
  var T_MAX = 180;
  var SCALE_MIN = 0.5;
  var SCALE_MAX = 2;
  /* Papers print 2.7 AU for the 170 K step. Not the arithmetic below. */
  var PAPER_AU = 2.7;
  var INNER_REACH = 8;
  var FULL_REACH = 35;

  function planet(name, group, au, density, densityLabel) {
    return {
      name: name,
      group: group,
      au: au,
      auText: String(au),
      density: density,
      densityLabel: densityLabel
    };
  }

  /* J2000 semimajor axis (AU) and bulk mean density (kg/m^3) from each fact sheet. */
  var PLANETS = [
    planet("Mercury", "rocky", 0.38709893, 5429, "5429"),
    planet("Venus", "rocky", 0.72333199, 5243, "5243"),
    planet("Earth", "rocky", 1.00000011, 5513, "5513"),
    planet("Mars", "rocky", 1.52366231, 3934, "3934"),
    planet("Jupiter", "giant", 5.20336301, 1326, "1,326"),
    planet("Saturn", "giant", 9.53707032, 687, "687"),
    planet("Uranus", "giant", 19.19126393, 1270, "1,270"),
    planet("Neptune", "giant", 30.06896348, 1638, "1,638")
  ];

  function clamp(x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
  }

  function temperature(rAu, scale) {
    return T0 * scale * Math.pow(rAu, -0.5);
  }

  function snowAu(scale, tIce) {
    return Math.pow((T0 * scale) / tIce, 2);
  }

  function roundAu(au) {
    return Math.round(au * 1000) / 1000;
  }

  function fmtAu(au) {
    return roundAu(au).toFixed(3) + " AU";
  }

  function fmtT(t) {
    var r = Math.round(t * 10) / 10;
    if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r)) + " K";
    return r.toFixed(1) + " K";
  }

  function roundT(t) {
    return Math.round(t);
  }

  function planetByName(name) {
    var i;
    for (i = 0; i < PLANETS.length; i++) {
      if (PLANETS[i].name === name) return PLANETS[i];
    }
    return null;
  }

  function sideOf(au, line) {
    if (au < line) return "inside";
    if (au > line) return "outside";
    return "on";
  }

  function joinNames(list) {
    if (!list.length) return "none of the eight";
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + " and " + list[1];
    return list.slice(0, -1).join(", ") + ", and " + list[list.length - 1];
  }

  function scene(state) {
    state = state || {};
    var scale = state.scale == null ? 1 : Number(state.scale);
    var tIce = state.tIce == null ? T_PAPER : Number(state.tIce);
    if (!isFinite(scale)) return { ok: false, error: "The teaching scale needs a number." };
    if (!isFinite(tIce)) return { ok: false, error: "The ice temperature needs a number." };
    var span = state.span || "inner";
    if (span !== "inner" && span !== "full") return { ok: false, error: "That frame is not on this desk." };
    scale = clamp(scale, SCALE_MIN, SCALE_MAX);
    tIce = clamp(tIce, T_MIN, T_MAX);
    var line = snowAu(scale, tIce);
    var t1 = T0 * scale;
    var reach = span === "full" ? FULL_REACH : INNER_REACH;
    var inside = [];
    var outside = [];
    var rows = [];
    var i;
    for (i = 0; i < PLANETS.length; i++) {
      var p = PLANETS[i];
      var side = sideOf(p.au, line);
      var t = temperature(p.au, scale);
      if (side === "inside") inside.push(p.name);
      else if (side === "outside") outside.push(p.name);
      rows.push({
        name: p.name,
        group: p.group,
        au: p.au,
        auText: p.auText,
        densityLabel: p.densityLabel,
        side: side,
        t: t,
        tRounded: roundT(t),
        tText: fmtT(t)
      });
    }
    var teaching = Math.abs(scale - 1) > 1e-12 || Math.abs(tIce - T_PAPER) > 1e-9;
    var why = "The profile is T = 280 K times (r / 1 AU) to the power −1/2, the Hayashi minimum-mass solar nebula temperature as Hartmann, Ciesla, Gressel, and Alexander 2017 print it. ";
    if (!teaching) {
      why += "The teaching scale is 1, so the normalization is the printed 280 K. It is not a measured disk. ";
    } else {
      why += "The teaching scale is " + scale.toFixed(2) + ", so the temperature at 1 AU is " + fmtT(t1) + ". That scale multiplies the printed 280 K. It is not a measured disk and not a young-Sun luminosity. ";
    }
    why += "Water ice in the 2.7 AU sentence is roughly 170 K. Podolak 2009 says that figure is for a solar-composition gas at a pressure typical of protostellar disks, and that the condensation temperature can be 150 to 180 K depending on density. Hartmann and coauthors print about 120 to 170 K for typical midplane conditions. The two ranges are not averaged. ";
    if (Math.abs(tIce - T_PAPER) > 1e-9) {
      why += "The ice knob is at " + fmtT(tIce) + ", a walk across those printed ranges, not a pressure measurement. ";
    }
    why += "At " + fmtT(tIce) + " this profile computes " + fmtAu(line) + ". ";
    if (!teaching) {
      why += "Podolak, and Sasselov and Lecar 2000, print 2.7 AU for the 170 K step. 2.713 AU and 2.7 AU are not averaged. ";
    }
    why += joinNames(inside) + " sit inside the line on this drawing. " + joinNames(outside) + " sit outside it. ";
    why += "The band from Mars to Jupiter is NASA Science’s “between Mars and Jupiter,” not a measured belt edge. The asteroids desk is that belt. ";
    why += "Classroom schematic, not a disk model.";

    var aria = "Schematic of a young disk. Temperature falls as the inverse square root of distance. ";
    aria += "Water ice at " + fmtT(tIce) + " is drawn at " + fmtAu(line) + ". ";
    if (!teaching) aria += "Papers print 2.7 AU for the 170 K step. ";
    aria += "Planet marks are today’s orbits. Not a disk model.";

    return {
      ok: true,
      scale: scale,
      tIce: tIce,
      t1: t1,
      t1Text: fmtT(t1),
      line: line,
      lineText: fmtAu(line),
      paperAu: PAPER_AU,
      paperText: "2.7 AU",
      teaching: teaching,
      span: span,
      reach: reach,
      offDrawing: line > reach,
      inside: inside,
      outside: outside,
      rows: rows,
      why: why,
      aria: aria,
      title: teaching ? "A teaching disk" : "Hayashi’s profile",
      range: fmtAu(line) + " · papers print 2.7 AU",
      tier: teaching ? "Teaching knobs · not a measured disk" : "Hayashi · 280 K · 170 K · schematic"
    };
  }

  return {
    T0: T0,
    T_PAPER: T_PAPER,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    SCALE_MIN: SCALE_MIN,
    SCALE_MAX: SCALE_MAX,
    PAPER_AU: PAPER_AU,
    INNER_REACH: INNER_REACH,
    FULL_REACH: FULL_REACH,
    PLANETS: PLANETS,
    temperature: temperature,
    snowAu: snowAu,
    roundAu: roundAu,
    roundT: roundT,
    fmtAu: fmtAu,
    fmtT: fmtT,
    planetByName: planetByName,
    sideOf: sideOf,
    scene: scene
  };
});
