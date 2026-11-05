/*! Comets: a Keplerian ellipse, vis-viva, and a schematic pair of tails.

    The Sun is one focus. Perihelion distance q and eccentricity e fix the
    semi-major axis, a = q / (1 − e). The same a and e are accepted the
    other way, and q is filled in as a(1 − e). Mean anomaly advances
    uniformly. Eccentric anomaly solves Kepler’s equation,
    E − e sin E = M. The place on the ellipse is
    x = a (cos E − e), y = a √(1 − e²) sin E, with the Sun at the origin
    and perihelion on the positive x-axis.

    Heliocentric distance is a(1 − e cos E). Speed is vis-viva,
    v = √[μ (2/r − 1/a)]. μ is the Sun Fact Sheet GM,
    132,712 × 10^6 km³/s². One astronomical unit is the IAU 2012 length,
    149,597,870,700 m. A year, when a period in days is also shown, is
    365.256 days, Earth’s sidereal orbit period on the fact sheets the
    Kepler desk uses.

    The ion tail is drawn straight away from the Sun. The dust tail is a
    curve of earlier positions, each pushed outward from the Sun, so it
    lags along the orbit. Length shrinks as heliocentric distance grows.
    Both lengths are a classroom scale, not a measured tail.

    Water ice is marked against 3 AU. Cochran, McKay, and Moulane 2025
    write that H₂O stays frozen farther from the Sun than 3.0 AU. The
    mark is that sentence. It is not a production rate.

    Preset q, e, a, inclination, and the printed period are the JPL
    Small-Body Database osculating elements named on each preset. The
    drawing is the orbit plane. Inclination is not applied.

    Point-mass, two-body. Not a JPL Horizons ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Comets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AU_M = 149597870700;
  var AU_KM = AU_M / 1000;
  var SUN_GM = 132712 * 1e6;
  var SUN_RADIUS_KM = 695700;
  var YEAR_DAYS = 365.256;
  var DAY_S = 86400;
  var WATER_AU = 3;
  var E_MAX = 0.999;
  var Q_MIN = 0.01;
  var Q_MAX = 40;
  var A_MIN = 0.2;
  var A_MAX = 500;

  /* JPL SBDB, full precision, fetched from
     https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=…&full-prec=true
     Orbit class names are the strings that API returns. */
  var HALLEY = {
    id: "halley",
    label: "1P/Halley",
    schematic: false,
    q: 0.5748638313743413,
    e: 0.9679359956953211,
    a: 17.92863504856923,
    i: 162.1905300439129,
    periodDays: 27728.04608790421,
    aphelion: 35.28240626576412,
    orbitId: "75",
    epochJd: "2439875.5",
    solnDate: "2025-11-21",
    orbitClass: "Halley-type Comet*",
    orbitCode: "HTC",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=1P"
  };

  var ENCKE = {
    id: "encke",
    label: "2P/Encke",
    schematic: false,
    q: 0.3394588840071771,
    e: 0.846979230409067,
    a: 2.218384373014493,
    i: 11.33886832759377,
    periodDays: 1206.850911513666,
    aphelion: 4.097309862021808,
    orbitId: "K273/27",
    epochJd: "2460552.5",
    solnDate: "2026-11-04",
    orbitClass: "Encke-type Comet",
    orbitCode: "ETc",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2P"
  };

  var P67 = {
    id: "67p",
    label: "67P/Churyumov–Gerasimenko",
    schematic: false,
    q: 1.243265640702404,
    e: 0.6409081308996354,
    a: 3.462249490129549,
    i: 7.040294937543767,
    periodDays: 2353.076067903661,
    aphelion: 5.681233339556694,
    orbitId: "K284/1",
    epochJd: "2457305.5",
    solnDate: "2026-09-04",
    orbitClass: "Jupiter-family Comet",
    orbitCode: "JFc",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=67P"
  };

  var HALE_BOPP = {
    id: "hale-bopp",
    label: "C/1995 O1 (Hale–Bopp)",
    schematic: false,
    q: 0.890537663547794,
    e: 0.9949810027633206,
    a: 177.4333839117583,
    i: 89.28759424740302,
    periodDays: 863279.5034870314,
    aphelion: 353.9762301599687,
    orbitId: "226",
    epochJd: "2459837.5",
    solnDate: "2022-08-01",
    orbitClass: "Comet",
    orbitCode: "COM",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=1995%20O1"
  };

  /* Not a catalog orbit. q = 1 AU and e = 0.6, so the ellipse crosses 3 AU. */
  var CLASSROOM = {
    id: "classroom",
    label: "Classroom ellipse",
    schematic: true,
    q: 1,
    e: 0.6,
    a: 2.5,
    i: null,
    periodDays: null,
    aphelion: 4,
    orbitId: null,
    epochJd: null,
    solnDate: null,
    orbitClass: null,
    orbitCode: null,
    sbdb: null
  };

  var PRESETS = [HALLEY, ENCKE, P67, HALE_BOPP, CLASSROOM];

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function fail(msg) {
    return { ok: false, error: msg };
  }

  function wrapPi(angle) {
    var x = angle % (2 * Math.PI);
    if (x > Math.PI) x -= 2 * Math.PI;
    if (x < -Math.PI) x += 2 * Math.PI;
    return x;
  }

  function eccentricFromMean(meanAnomaly, e) {
    var M = wrapPi(meanAnomaly);
    var E = M;
    if (e > 0.8) E = M + (e * Math.sin(M)) / (1 - e * Math.cos(M));
    var n;
    for (n = 0; n < 60; n++) {
      var s = Math.sin(E);
      var c = Math.cos(E);
      var f = E - e * s - M;
      var fp = 1 - e * c;
      if (fp === 0) break;
      var d = f / fp;
      E -= d;
      if (Math.abs(d) < 1e-14) break;
    }
    return E;
  }

  function trueAnomaly(E, e) {
    var cosE = Math.cos(E);
    var sinE = Math.sin(E);
    var denom = 1 - e * cosE;
    var cosf = (cosE - e) / denom;
    var sinf = Math.sqrt(Math.max(0, 1 - e * e)) * sinE / denom;
    return Math.atan2(sinf, cosf);
  }

  function position(a, e, E) {
    var b = a * Math.sqrt(Math.max(0, 1 - e * e));
    return {
      x: a * (Math.cos(E) - e),
      y: b * Math.sin(E)
    };
  }

  function radius(a, e, E) {
    return a * (1 - e * Math.cos(E));
  }

  function speed(aAu, rAu) {
    if (!(aAu > 0) || !(rAu > 0)) return NaN;
    var a = aAu * AU_KM;
    var r = rAu * AU_KM;
    var arg = 2 / r - 1 / a;
    if (!(arg > 0)) return NaN;
    return Math.sqrt(SUN_GM * arg);
  }

  function periodSeconds(aAu) {
    if (!(aAu > 0)) return NaN;
    var a = aAu * AU_KM;
    return 2 * Math.PI * Math.sqrt((a * a * a) / SUN_GM);
  }

  function periodYears(aAu) {
    return periodSeconds(aAu) / (YEAR_DAYS * DAY_S);
  }

  function tailFraction(rAu, qAu) {
    if (!(rAu > 0) || !(qAu > 0)) return 0;
    var f = (qAu / rAu) * (qAu / rAu);
    if (f > 1) f = 1;
    if (f < 0) f = 0;
    return f;
  }

  function ionEnd(x, y, length) {
    var r = Math.hypot(x, y);
    if (!(r > 0) || !(length > 0)) return { x: x, y: y };
    return { x: x + length * x / r, y: y + length * y / r };
  }

  /* dE > 0 steps backward along the orbit. outward > 0 stretches the
     radius, a schematic stand-in for radiation pressure on dust. */
  function dustPoint(a, e, E, dE, outward) {
    var back = position(a, e, E - dE);
    var rOrbit = Math.hypot(back.x, back.y);
    var k = 1 + (outward > 0 ? outward : 0);
    return {
      x: back.x * k,
      y: back.y * k,
      rOrbit: rOrbit,
      rDust: rOrbit * k
    };
  }

  function waterState(rAu) {
    if (!(rAu > 0)) return "unknown";
    if (rAu < WATER_AU) return "inside";
    if (rAu > WATER_AU) return "outside";
    return "at";
  }

  function waterText(state) {
    if (state === "inside") return "Within 3 AU — water ice commonly sublimating";
    if (state === "outside") return "Beyond 3 AU — water ice generally still frozen";
    if (state === "at") return "At 3 AU — the cited water-ice line";
    return "—";
  }

  function group(n, digits) {
    if (!finite(n)) return "—";
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + parts.join(".");
  }

  function fmtAu(n) {
    if (!finite(n)) return "—";
    return group(n, 6) + " AU";
  }

  function fmtSpeed(v) {
    if (!finite(v)) return "—";
    return group(v, 3) + " km/s";
  }

  function fmtYears(y) {
    if (!finite(y)) return "—";
    return group(y, 3) + " years";
  }

  function fmtDays(d) {
    if (!finite(d)) return "—";
    return group(d, 3) + " days";
  }

  function fmtDeg(d) {
    if (!finite(d)) return "—";
    return group(d, 3) + "°";
  }

  function fmtE(e) {
    if (!finite(e)) return "—";
    return group(e, 6);
  }

  function sunRadiusAu() {
    return SUN_RADIUS_KM / AU_KM;
  }

  function normalize(o) {
    o = o || {};
    var mode = o.mode === "a" ? "a" : "q";
    var e = o.e;
    if (!finite(e)) return fail("Eccentricity has to be a number.");
    if (e < 0 || e >= 1) return fail("Eccentricity has to be from 0 up to, but not including, 1. This desk draws a bound ellipse.");
    if (e > E_MAX) return fail("Eccentricity stops at 0.999 on this desk, short of a parabola.");
    var q;
    var a;
    if (mode === "a") {
      a = o.a;
      if (!finite(a)) return fail("Semi-major axis has to be a number of AU.");
      if (a < A_MIN || a > A_MAX) return fail("Semi-major axis has to be from " + A_MIN + " to " + A_MAX + " AU.");
      q = a * (1 - e);
    } else {
      q = o.q;
      if (!finite(q)) return fail("Perihelion distance has to be a number of AU.");
      if (q < Q_MIN || q > Q_MAX) return fail("Perihelion distance has to be from " + Q_MIN + " to " + Q_MAX + " AU.");
      a = q / (1 - e);
      if (a > A_MAX) return fail("That perihelion and eccentricity make a semi-major axis past " + A_MAX + " AU.");
    }
    if (!(q > 0) || q > a * (1 + 1e-12)) return fail("Perihelion has to sit inside the semi-major axis.");
    var meanDeg = finite(o.meanDeg) ? o.meanDeg : 0;
    meanDeg = ((meanDeg % 360) + 360) % 360;
    return {
      ok: true,
      mode: mode,
      q: q,
      e: e,
      a: a,
      ra: a * (1 + e),
      meanDeg: meanDeg,
      meanRad: meanDeg * Math.PI / 180,
      preset: o.preset || null,
      name: o.name || "Comet"
    };
  }

  function stateFromPreset(id) {
    var p = presetById(id);
    if (!p) return null;
    return {
      preset: p.id,
      mode: "q",
      name: p.label,
      q: p.q,
      e: p.e,
      a: p.a,
      meanDeg: 0
    };
  }

  function classSentence(p) {
    if (!p || p.schematic) return "The classroom ellipse is not a catalog comet.";
    if (p.orbitCode === "HTC") {
      return "JPL’s orbit class for this solution is Halley-type Comet*, code HTC. The SBDB filter document defines that classical class as 20 years < P < 200 years.";
    }
    if (p.orbitCode === "JFc") {
      return "JPL’s orbit class for this solution is Jupiter-family Comet, code JFc. The SBDB filter document defines that class, following Levison and Duncan, as 2 < Tj < 3.";
    }
    if (p.orbitCode === "ETc") {
      return "JPL’s orbit class for this solution is Encke-type Comet, code ETc. The SBDB filter document defines that class, following Levison and Duncan, as Tj > 3 and a semi-major axis inside Jupiter’s.";
    }
    if (p.orbitCode === "COM") {
      return "JPL’s orbit class for this solution is Comet, code COM, the class for a comet orbit that did not match a more specific class. The printed period is longer than 200 years, so on NASA’s line this is a long-period comet.";
    }
    return "";
  }

function whyText(norm, preset) {
  var lines = [];
  if (!preset) {
    lines.push("Custom ellipse. The numbers in the boxes are not a stored JPL orbit.");
  } else if (preset.schematic) {
    lines.push("Classroom ellipse. Perihelion is 1 AU and eccentricity is 0.6, so the semi-major axis is 2.5 AU and aphelion is 4 AU. It crosses the 3 AU water-ice line. It is not a catalog comet and not a JPL orbit.");
  } else {
    lines.push(preset.label + ". JPL Small-Body Database orbit solution " + preset.orbitId + ", epoch JD " + preset.epochJd + " TDB, solution date " + preset.solnDate + ".");
    lines.push("Perihelion distance q = " + preset.q + " AU and eccentricity e = " + preset.e + ". The axis a = q/(1−e) is " + preset.a + " AU, the semi-major axis JPL prints for this solution.");
    lines.push("JPL’s aphelion is " + preset.aphelion + " AU. JPL’s sidereal period is " + preset.periodDays + " days.");
    lines.push("Inclination " + preset.i + "° is printed on the card and is not drawn. The canvas is the orbit plane.");
    lines.push(classSentence(preset));
  }
  if (!preset || preset.schematic) {
    lines.push("The two-body period from the Sun Fact Sheet GM is " + fmtYears(periodYears(norm.a)) + ", which is " + fmtDays(periodSeconds(norm.a) / DAY_S) + ".");
  } else {
    lines.push("The two-body period from the Sun Fact Sheet GM is " + fmtYears(norm.years) + ", which is " + fmtDays(periodSeconds(norm.a) / DAY_S) + ". It is not copied from JPL’s printed period. The fact-sheet GM is a rounded value, so the two day counts differ in the third decimal.");
  }
  return lines.join(" ");
}

  function scene(o) {
    var norm = normalize(o);
    if (!norm.ok) return norm;
    var E = eccentricFromMean(norm.meanRad, norm.e);
    var pos = position(norm.a, norm.e, E);
    var r = radius(norm.a, norm.e, E);
    var v = speed(norm.a, r);
    var water = waterState(r);
    var preset = presetById(norm.preset);
    var years = periodYears(norm.a);
    var days = periodSeconds(norm.a) / DAY_S;
    var frac = tailFraction(r, norm.q);
    var ion = ionEnd(pos.x, pos.y, frac);
    var dust = dustPoint(norm.a, norm.e, E, 0.15, 0.08 * frac);
    var insideSun = norm.q < sunRadiusAu();
    var frame = {
      r: r,
      v: v,
      water: water,
      years: years
    };
    var text = {
      r: fmtAu(r),
      v: fmtSpeed(v),
      period: fmtYears(years),
      periodDays: fmtDays(days),
      q: fmtAu(norm.q),
      a: fmtAu(norm.a),
      ra: fmtAu(norm.ra),
      e: fmtE(norm.e),
      water: waterText(water),
      i: preset && preset.i != null ? fmtDeg(preset.i) : "not set",
      jplPeriod: preset && preset.periodDays != null ? fmtDays(preset.periodDays) : "—"
    };
    return {
      ok: true,
      norm: norm,
      preset: preset,
      E: E,
      trueAnomaly: trueAnomaly(E, norm.e),
      pos: pos,
      r: r,
      v: v,
      water: water,
      years: years,
      days: days,
      tailFraction: frac,
      ion: ion,
      dust: dust,
      insideSun: insideSun,
      text: text,
      why: whyText(Object.assign({ r: r, v: v, water: water, years: years }, norm), preset),
      stats: [
        ["Heliocentric distance", text.r],
        ["Orbital speed", text.v],
        ["Period", text.period + " · " + text.periodDays],
        ["JPL sidereal period", text.jplPeriod],
        ["Water ice", text.water],
        ["Perihelion q", text.q],
        ["Semi-major axis a", text.a],
        ["Aphelion", text.ra],
        ["Eccentricity", text.e],
        ["Inclination, not drawn", text.i]
      ]
    };
  }

  function limitsNote() {
    return "One comet and the Sun. The path is a bound Keplerian ellipse, a = q / (1 − e). Time runs in mean anomaly, and the place comes from Kepler’s equation. Speed is vis-viva with the Sun Fact Sheet GM, 132,712 × 10⁶ km³/s². One AU is the IAU 2012 length, 149,597,870,700 m. The ion tail is drawn straight away from the Sun. The dust tail lags along the orbit and is pushed outward. Tail length grows as heliocentric distance shrinks, on a classroom scale, not in measured kilometers. The 3 AU mark is the distance past which Cochran, McKay, and Moulane 2025 say water ice stays frozen. Inclination is printed and not applied, so a retrograde comet is not flipped. Other planets are left out. Not a JPL Horizons ephemeris and not a tail model.";
  }

  return {
    AU_M: AU_M,
    AU_KM: AU_KM,
    SUN_GM: SUN_GM,
    SUN_RADIUS_KM: SUN_RADIUS_KM,
    YEAR_DAYS: YEAR_DAYS,
    WATER_AU: WATER_AU,
    E_MAX: E_MAX,
    PRESETS: PRESETS,
    presetById: presetById,
    stateFromPreset: stateFromPreset,
    eccentricFromMean: eccentricFromMean,
    trueAnomaly: trueAnomaly,
    position: position,
    radius: radius,
    speed: speed,
    periodSeconds: periodSeconds,
    periodYears: periodYears,
    tailFraction: tailFraction,
    ionEnd: ionEnd,
    dustPoint: dustPoint,
    waterState: waterState,
    waterText: waterText,
    normalize: normalize,
    scene: scene,
    sunRadiusAu: sunRadiusAu,
    limitsNote: limitsNote,
    fmtAu: fmtAu,
    fmtSpeed: fmtSpeed,
    fmtYears: fmtYears,
    fmtDays: fmtDays
  };
});
