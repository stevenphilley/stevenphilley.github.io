/*! Planet days: why a solar day is not one sidereal spin.

    Per-planet NSSDCA fact sheets print a sidereal rotation period
    (hours), a length of day (hours), and a sidereal orbit period
    (days). A negative rotation is retrograde. Jupiter, Saturn,
    Uranus, and Neptune mark the rotation with the reference system
    printed on that sheet.

    This page’s arithmetic, in hours, with the orbit converted by
    × 24 (the Earth sheet’s length of day is 24.0000 hours):

        1/T_solar = 1/T_sidereal − 1/T_orbit

    The minus sign already on a retrograde period flips the first
    term. The positive length is what the sheets call “length of day.”
    That arithmetic is printed beside the sheet’s length of day.
    The two are not averaged.

    The comparison table’s orbital period is the tropical year, per
    its notes. It is not the period in the formula.

    Classroom schematic, not an ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlanetDays = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Earth Fact Sheet length of day. Days become hours by this 24, not by 23.9345. */
  var HOURS_PER_DAY = 24;
  /* Below this true orbit angle, the sketch draws one solar day as DRAW_DEG. */
  var DRAW_DEG = 32;
  var STAR0 = Math.PI;
  var TAU = Math.PI * 2;

  function planet(row) {
    row.siderealHours = parseSheet(row.siderealLabel);
    row.dayHours = parseSheet(row.dayLabel);
    row.orbitDays = parseSheet(row.orbitLabel);
    row.retrograde = row.siderealHours < 0;
    return row;
  }

  /* Labels are the characters on the sheet. Numbers drop the comma. */
  var PLANETS = [
    planet({
      id: "mercury",
      name: "Mercury",
      siderealLabel: "1407.6",
      dayLabel: "4222.6",
      orbitLabel: "87.969",
      tropicalLabel: "87.968",
      cmpRotation: "1407.6",
      cmpDay: "4222.6",
      cmpOrbit: "88.0",
      obliquity: "0.034",
      system: "",
      updated: "11 January 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html",
      swatch: "#c4b8a8"
    }),
    planet({
      id: "venus",
      name: "Venus",
      siderealLabel: "-5832.6",
      dayLabel: "2802.0",
      orbitLabel: "224.701",
      tropicalLabel: "224.695",
      cmpRotation: "-5832.5",
      cmpDay: "2802.0",
      cmpOrbit: "224.7",
      obliquity: "177.36",
      system: "",
      updated: "11 January 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html",
      swatch: "#d2c4a0"
    }),
    planet({
      id: "earth",
      name: "Earth",
      siderealLabel: "23.9345",
      dayLabel: "24.0000",
      orbitLabel: "365.256",
      tropicalLabel: "365.242",
      cmpRotation: "23.9",
      cmpDay: "24.0",
      cmpOrbit: "365.2",
      obliquity: "23.44",
      system: "",
      updated: "15 November 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
      swatch: "#6ea4b8"
    }),
    planet({
      id: "mars",
      name: "Mars",
      siderealLabel: "24.6229",
      dayLabel: "24.6597",
      orbitLabel: "686.980",
      tropicalLabel: "686.972",
      cmpRotation: "24.6",
      cmpDay: "24.7",
      cmpOrbit: "687.0",
      obliquity: "25.19",
      system: "",
      updated: "19 May 2025",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
      swatch: "#c48a72"
    }),
    planet({
      id: "jupiter",
      name: "Jupiter",
      siderealLabel: "9.9250",
      dayLabel: "9.9259",
      orbitLabel: "4,332.589",
      tropicalLabel: "4,330.595",
      cmpRotation: "9.9",
      cmpDay: "9.9",
      cmpOrbit: "4331",
      obliquity: "3.13",
      system: "System III (1965.0) coordinates",
      updated: "2 October 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
      swatch: "#d2c2a4"
    }),
    planet({
      id: "saturn",
      name: "Saturn",
      siderealLabel: "10.656",
      dayLabel: "10.656",
      orbitLabel: "10,755.699",
      tropicalLabel: "10,746.940",
      cmpRotation: "10.7",
      cmpDay: "10.7",
      cmpOrbit: "10,747",
      obliquity: "26.73",
      system: "Saturnian System III coordinates",
      updated: "18 March 2025",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html",
      swatch: "#e0d2a8"
    }),
    planet({
      id: "uranus",
      name: "Uranus",
      siderealLabel: "-17.24",
      dayLabel: "17.24",
      orbitLabel: "30,685.400",
      tropicalLabel: "30,588.740",
      cmpRotation: "-17.2",
      cmpDay: "17.2",
      cmpOrbit: "30,589",
      obliquity: "97.77",
      system: "Magnetic coordinates (as determined by the Voyager 2 Radio Science experiment)",
      updated: "2 October 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html",
      swatch: "#9bb8c4"
    }),
    planet({
      id: "neptune",
      name: "Neptune",
      siderealLabel: "16.11",
      dayLabel: "16.11",
      orbitLabel: "60,189.018",
      tropicalLabel: "59,799.900",
      cmpRotation: "16.1",
      cmpDay: "16.1",
      cmpOrbit: "59,800",
      obliquity: "28.32",
      system: "Magnetic coordinates (as determined by the Voyager 2 Radio Science experiment)",
      updated: "3 October 2024",
      sheet: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html",
      swatch: "#7a92b0"
    })
  ];

  function parseSheet(label) {
    var n = Number(String(label).replace(/,/g, ""));
    return n;
  }

  function decimalsOf(label) {
    var s = String(label).replace(/,/g, "");
    var i = s.indexOf(".");
    if (i < 0) return 0;
    return s.length - i - 1;
  }

  function roundTo(x, places) {
    var f = Math.pow(10, places);
    var n = Math.round(Math.abs(x) * f) / f;
    return x < 0 ? -n : n;
  }

  function formatPlaces(x, places) {
    return roundTo(x, places).toFixed(places);
  }

  /* Signed solar period in hours. Length of day is the absolute value. */
  function solarFrom(siderealHours, orbitDays) {
    if (!isFinite(siderealHours) || siderealHours === 0) return null;
    if (!isFinite(orbitDays) || orbitDays === 0) return null;
    var orbitHours = orbitDays * HOURS_PER_DAY;
    var inv = (1 / siderealHours) - (1 / orbitHours);
    if (!isFinite(inv) || inv === 0) return null;
    var signed = 1 / inv;
    return {
      signedHours: signed,
      hours: Math.abs(signed),
      orbitHours: orbitHours,
      retrograde: siderealHours < 0
    };
  }

  function arithmeticLabel(hours, dayLabel) {
    return formatPlaces(hours, decimalsOf(dayLabel) + 2);
  }

  function roundsToSheet(hours, dayLabel) {
    return formatPlaces(hours, decimalsOf(dayLabel)) === String(dayLabel);
  }

  function planetById(id) {
    var i;
    for (i = 0; i < PLANETS.length; i++) {
      if (PLANETS[i].id === id) return PLANETS[i];
    }
    return null;
  }

  function wrapPi(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  function spanHours(p, sol) {
    return Math.max(sol.hours, Math.abs(p.siderealHours));
  }

  function displaySweep(sol) {
    var trueSweep = (TAU / sol.orbitHours) * sol.hours;
    var floor = DRAW_DEG * Math.PI / 180;
    if (trueSweep >= floor) return trueSweep;
    return floor;
  }

  function keyframes(p, sol) {
    var sweep = displaySweep(sol);
    var sid = Math.abs(p.siderealHours);
    var solar = sol.hours;
    if (!p.retrograde) {
      return [
        { t: 0, marker: STAR0, phi: 0 },
        { t: sid, marker: STAR0 + TAU, phi: sweep * (sid / solar) },
        { t: solar, marker: STAR0 + TAU + sweep, phi: sweep }
      ];
    }
    return [
      { t: 0, marker: STAR0, phi: 0 },
      { t: solar, marker: STAR0 - TAU + sweep, phi: sweep },
      { t: sid, marker: STAR0 - TAU, phi: sweep * (sid / solar) }
    ];
  }

  function sample(frames, t) {
    var tt = t;
    if (tt <= frames[0].t) return { marker: frames[0].marker, phi: frames[0].phi };
    var i;
    for (i = 0; i < frames.length - 1; i++) {
      if (tt <= frames[i + 1].t + 1e-9) {
        var span = frames[i + 1].t - frames[i].t;
        var u = span === 0 ? 0 : (tt - frames[i].t) / span;
        return {
          marker: frames[i].marker + u * (frames[i + 1].marker - frames[i].marker),
          phi: frames[i].phi + u * (frames[i + 1].phi - frames[i].phi)
        };
      }
    }
    var last = frames[frames.length - 1];
    return { marker: last.marker, phi: last.phi };
  }

  function poseAt(p, hours) {
    var sol = solarFrom(p.siderealHours, p.orbitDays);
    if (!sol) return { ok: false };
    var span = spanHours(p, sol);
    var t = Number(hours);
    if (!isFinite(t)) return { ok: false };
    if (t < 0) t = 0;
    if (t > span) t = span;
    var frames = keyframes(p, sol);
    var drawn = sample(frames, t);
    var truePhi = (TAU / sol.orbitHours) * t;
    var trueSweep = (TAU / sol.orbitHours) * sol.hours;
    var omega = TAU / p.siderealHours;
    var trueMarker = STAR0 + omega * t;
    var trueSun = STAR0 + truePhi;
    var ccw = ccwDelta(trueMarker, trueSun);
    var still = p.retrograde ? (ccw === 0 ? 0 : TAU - ccw) : ccw;
    return {
      ok: true,
      t: t,
      span: span,
      phi: drawn.phi,
      marker: drawn.marker,
      sunward: drawn.phi + STAR0,
      star: STAR0,
      enlarged: trueSweep < (DRAW_DEG * Math.PI / 180) - 1e-9,
      trueOrbitTurns: truePhi / TAU,
      trueOrbitDeg: truePhi * 180 / Math.PI,
      trueSpinTurns: (omega * t) / TAU,
      stillDeg: still * 180 / Math.PI,
      facesSun: Math.abs(wrapPi(drawn.marker - (drawn.phi + STAR0))) < 1e-6,
      facesStar: Math.abs(wrapPi(drawn.marker - STAR0)) < 1e-6
    };
  }

  function formulaLine(p) {
  var sid = p.retrograde ? "(−" + p.siderealLabel.replace("-", "") + ")" : p.siderealLabel;
  return "1/T_solar = 1/" + sid + " − 1/(" + p.orbitLabel + " × 24)";
}

/* CCW angle from `from` to `to`, in [0, TAU). A full turn counts as 0. */
function ccwDelta(from, to) {
  var d = (to - from) % TAU;
  if (d < 0) d += TAU;
  if (d > TAU - 1e-8) d = 0;
  return d;
}

  function scene(opts) {
    opts = opts || {};
    var id = opts.planet || opts.id || "earth";
    var p = planetById(id);
    if (!p) return { ok: false };
    var sol = solarFrom(p.siderealHours, p.orbitDays);
    if (!sol) return { ok: false };
    var arith = arithmeticLabel(sol.hours, p.dayLabel);
    var rounds = roundsToSheet(sol.hours, p.dayLabel);
    var sheetRounded = formatPlaces(sol.hours, decimalsOf(p.dayLabel));
    var hours = opts.hours;
    if (!isFinite(Number(hours))) hours = 0;
    var pose = poseAt(p, hours);
    var sidAbs = Math.abs(p.siderealHours);
    var orbitTurns = sol.hours / sol.orbitHours;
    var perSpin = p.orbitDays / (sidAbs / HOURS_PER_DAY);
    var twoOrbits = formatPlaces(2 * p.orbitDays * HOURS_PER_DAY, 3);

    var why = "The formula is " + formulaLine(p) + ". ";
    if (p.retrograde) {
      why += "The fact sheet prints a minus sign on the sidereal rotation, so the first term flips sign. The comparison notes call a negative rotation retrograde, backwards relative to the Earth. ";
    } else {
      why += "Spin and orbit run the same way, so the planet has to turn a little past one sidereal rotation before the marker faces the Sun again. ";
    }
    why += "This page’s arithmetic is " + arith + " hours. The sheet prints a length of day of " + p.dayLabel + " hours. ";
    if (rounds) {
      why += arith + " rounded to the sheet’s decimal places is " + p.dayLabel + ". The difference is in digits the sheet does not print. The two are not averaged. ";
    } else {
      why += arith + " rounded to the sheet’s decimal places is " + sheetRounded + ", not " + p.dayLabel + ". The two are not averaged. ";
    }
    if (p.id === "mercury") {
      why += "One arithmetic solar day is " + formatPlaces(orbitTurns, 4) + " sidereal orbits, about two Mercury years. Two printed sidereal orbits are " + twoOrbits + " hours. The printed periods are " + formatPlaces(perSpin, 4) + " orbits per sidereal rotation, near 3/2, not exactly 3/2. ";
    }
    if (p.retrograde) {
      why += "The length of day, " + arith + " hours, is shorter than the absolute sidereal period, " + p.siderealLabel.replace("-", "") + " hours, because the orbit and the backward spin both move the Sun off the marker. ";
    }
    if (p.system) {
      why += "The sheet marks the sidereal rotation with an asterisk: " + p.system + ". The length of day line does not repeat the asterisk. ";
    }
    if (p.id === "venus") {
      why += "The comparison table prints the rotation as -5832.5 hours. The Venus sheet prints -5832.6 hours. Rounded to one decimal, -5832.6 would stay -5832.6, so this is a different printing. The formula uses the sheet. They are not averaged. ";
    }
    why += "Days become hours by multiplying by 24, because the Earth sheet’s length of day is 24.0000 hours. The sidereal 23.9345 is not that conversion. ";
    if (pose.enlarged) {
      why += "One solar day is a small step on the orbit, so the sketch draws that step larger. The degree readout is not enlarged. ";
    } else {
      why += "The orbit step on the sketch is the true angle. It is not enlarged. ";
    }
    why += "Classroom schematic, not an ephemeris.";

    var tier = p.retrograde ? "Retrograde spin · schematic" : "Prograde spin · schematic";
    if (p.system) tier = "Reference spin · schematic";
    var range = arith + " h · sheet prints " + p.dayLabel + " h";
    var aria = p.name + " schematic, viewed from the ecliptic north. ";
    aria += p.retrograde ? "The marker turns clockwise. " : "The marker turns counterclockwise, with the orbit. ";
    aria += "Arithmetic solar day " + arith + " hours. The sheet prints " + p.dayLabel + " hours. Not an ephemeris.";

    return {
      ok: true,
      planet: p,
      sol: sol,
      arith: arith,
      rounds: rounds,
      sheetRounded: sheetRounded,
      orbitTurns: orbitTurns,
      perSpin: perSpin,
      twoOrbits: twoOrbits,
      formula: formulaLine(p),
      why: why,
      tier: tier,
      range: range,
      title: p.name,
      aria: aria,
      pose: pose,
      span: pose.span,
      sidHours: sidAbs,
      solarHours: sol.hours,
      presets: {
        noon: 0,
        sidereal: sidAbs,
        next: sol.hours
      }
    };
  }

  return {
    HOURS_PER_DAY: HOURS_PER_DAY,
    DRAW_DEG: DRAW_DEG,
    STAR0: STAR0,
    PLANETS: PLANETS,
    parseSheet: parseSheet,
    decimalsOf: decimalsOf,
    solarFrom: solarFrom,
    arithmeticLabel: arithmeticLabel,
    roundsToSheet: roundsToSheet,
    formatPlaces: formatPlaces,
    planetById: planetById,
    poseAt: poseAt,
    scene: scene,
    formulaLine: formulaLine
  };
});
