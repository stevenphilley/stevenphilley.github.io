/*! Interstellar objects: ellipse, parabola, hyperbola, and v∞.

    The Sun is one focus. Perihelion distance q and eccentricity e fix the
    conic. The signed semi-major axis is a = q / (1 − e). That is positive
    for an ellipse (e < 1) and negative for a hyperbola (e > 1). At e = 1
    the axis is not finite: the path is a parabola.

    Vis-viva is v² = GM (2/r − 1/a). At perihelion, r = q, this is
    v_p² = GM (1 + e) / q for every conic, because 2/q − 1/a = (1 + e) / q
    once a = q / (1 − e).

    Speed left at infinite distance is the hyperbolic excess speed.
    v∞² = lim (v²) = −GM / a. With a = −q / (e − 1) for e > 1,
    v∞² = GM (e − 1) / q. At e = 1 that excess is 0. For e < 1, a is
    positive, the specific energy is negative, and there is no v∞.

    GM is the Sun Fact Sheet value, 132,712 × 10^6 km³/s². One AU is the
    IAU 2012 length, 149,597,870,700 m.

    Catalog e, q, a, and inclination are JPL Small-Body Database osculating
    elements. The drawing is the orbit plane. Inclination is not applied.
    The three interstellar v∞ values are computed here. They are not a
    field the Small-Body Database prints.

    Point-mass, two-body. Not a JPL Horizons ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Interstellar = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AU_M = 149597870700;
  var AU_KM = AU_M / 1000;
  var SUN_GM = 132712 * 1e6;
  var SUN_RADIUS_KM = 695700;
  var E_MIN = 0;
  var E_MAX = 6.5;
  var Q_MIN = 0.05;
  var Q_MAX = 8;
  var EARTH_MEAN_KMS = 29.78;

  /* JPL SBDB, full precision, fetched 2026-11-11 from
     https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=…&full-prec=true
     Orbit class names are the strings that API returns. */
  var OUMUAMUA = {
    id: "1I",
    name: "1I/‘Oumuamua",
    designation: "A/2017 U1",
    schematic: false,
    e: 1.201133796102373,
    q: 0.2559115812959116,
    a: -1.27234500742808,
    i: 122.7417062847286,
    orbitId: "16",
    epochJd: "2458080.5",
    solnDate: "2018-06-26",
    orbitClass: "Hyperbolic Asteroid",
    orbitCode: "HYA",
    fullname: "'Oumuamua (A/2017 U1)",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=1I",
    api: "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=1I&full-prec=true"
  };

  var BORISOV = {
    id: "2I",
    name: "2I/Borisov",
    designation: "C/2019 Q4 (Borisov)",
    schematic: false,
    e: 3.356475782676596,
    q: 2.006520878500843,
    a: -0.8514922551937886,
    i: 44.05264247909138,
    orbitId: "54",
    epochJd: "2458853.5",
    solnDate: "2024-06-24",
    orbitClass: "Hyperbolic Comet",
    orbitCode: "HYP",
    fullname: "C/2019 Q4 (Borisov)",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2I",
    api: "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=2I&full-prec=true"
  };

  var ATLAS = {
    id: "3I",
    name: "3I/ATLAS",
    designation: "C/2025 N1 (ATLAS)",
    schematic: false,
    e: 6.123467394525528,
    q: 1.351998619400212,
    a: -0.2638835217034532,
    i: 175.2403121571192,
    orbitId: "55",
    epochJd: "2461340.5",
    solnDate: "2026-10-21",
    orbitClass: "Hyperbolic Comet",
    orbitCode: "HYP",
    fullname: "C/2025 N1 (ATLAS)",
    comment: "Temporary solution to support JWST Program 13145",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3I",
    api: "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=3I&full-prec=true"
  };

  /* Same JPL solution the comets desk loads. A bound comparison, not an
     interstellar object. */
  var HALLEY = {
    id: "halley",
    name: "1P/Halley",
    designation: "1P/Halley",
    schematic: false,
    boundCompare: true,
    e: 0.9679359956953211,
    q: 0.5748638313743413,
    a: 17.92863504856923,
    i: 162.1905300439129,
    orbitId: "75",
    epochJd: "2439875.5",
    solnDate: "2025-11-21",
    orbitClass: "Halley-type Comet*",
    orbitCode: "HTC",
    fullname: "1P/Halley",
    sbdb: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=1P",
    api: "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=1P&full-prec=true"
  };

  var CATALOG = [OUMUAMUA, BORISOV, ATLAS, HALLEY];

  function catalogById(id) {
    var i;
    for (i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].id === id) return CATALOG[i];
    }
    return null;
  }

  function signedA(e, q) {
    if (e === 1) return null;
    return q / (1 - e);
  }

  function kindOf(e) {
    if (e < 1) return "ellipse";
    if (e === 1) return "parabola";
    return "hyperbola";
  }

  function boundOf(e) {
    return e < 1;
  }

  function vPeri(e, qAu) {
    return Math.sqrt(SUN_GM * (1 + e) / (qAu * AU_KM));
  }

  function vInf(e, qAu) {
    if (e < 1) return null;
    if (e === 1) return 0;
    return Math.sqrt(SUN_GM * (e - 1) / (qAu * AU_KM));
  }

  function vInfFromA(aAu) {
    if (!(aAu < 0)) return null;
    return Math.sqrt(-SUN_GM / (aAu * AU_KM));
  }

  function fmtE(e) {
    return e.toFixed(6);
  }

  function fmtQ(q) {
    return q.toFixed(6);
  }

  function fmtSpeed(v) {
    return v.toFixed(3);
  }

  function fmtDeg(v) {
    return v.toFixed(3);
  }

  function validate(e, q) {
    if (!(typeof e === "number") || !isFinite(e)) return "Enter an eccentricity from 0 to 6.5.";
    if (e < E_MIN || e > E_MAX) return "Enter an eccentricity from 0 to 6.5.";
    if (!(typeof q === "number") || !isFinite(q)) return "Enter a perihelion distance in AU.";
    if (q < Q_MIN || q > Q_MAX) return "Enter a perihelion from 0.05 to 8 AU.";
    if (q * AU_KM <= SUN_RADIUS_KM) return "That perihelion is inside the Sun.";
    return "";
  }

  function curve(e, q) {
    var pts = [];
    var i;
    var n;
    var th;
    var r;
    var maxR = 8 * q;
    if (e < 1) {
      var a = q / (1 - e);
      n = 360;
      for (i = 0; i <= n; i++) {
        var E = (i / n) * Math.PI * 2;
        pts.push({
          x: a * (Math.cos(E) - e),
          y: a * Math.sqrt(1 - e * e) * Math.sin(E)
        });
      }
      return { points: pts, closed: true };
    }
    if (e === 1) {
      var c = 2 * q / maxR - 1;
      var thMax = Math.acos(Math.max(-1, Math.min(1, c)));
      n = 240;
      for (i = 0; i <= n; i++) {
        th = -thMax + (2 * thMax) * (i / n);
        r = 2 * q / (1 + Math.cos(th));
        pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
      }
      return { points: pts, closed: false };
    }
    var ah = q / (e - 1);
    var thInf = Math.acos(-1 / e);
    var cosLim = (ah * (e * e - 1) / maxR - 1) / e;
    if (cosLim < -1 / e) cosLim = -1 / e + 1e-9;
    if (cosLim > 1) cosLim = 1;
    var thOpen = Math.acos(cosLim);
    if (thOpen > thInf - 1e-4) thOpen = thInf - 1e-4;
    n = 240;
    for (i = 0; i <= n; i++) {
      th = -thOpen + (2 * thOpen) * (i / n);
      var denom = 1 + e * Math.cos(th);
      if (denom <= 1e-8) continue;
      r = ah * (e * e - 1) / denom;
      pts.push({ x: r * Math.cos(th), y: r * Math.sin(th), th: th });
    }
    return { points: pts, closed: false, thInf: thInf, aPositive: ah };
  }

  function frame(e, q) {
    if (e < 1) {
      var a = q / (1 - e);
      var ra = a * (1 + e);
      var b = a * Math.sqrt(Math.max(0, 1 - e * e));
      if (ra <= 5.5 * q) {
        var pad = Math.max(0.28 * q, 0.08 * Math.max(ra, b));
        return {
          x0: -ra - pad,
          x1: q + pad,
          y0: -(b + pad),
          y1: b + pad,
          clipped: false
        };
      }
    }
    return {
      x0: -4.2 * q,
      x1: 1.7 * q,
      y0: -3.1 * q,
      y1: 3.1 * q,
      clipped: true
    };
  }

  function shapeSentence(e) {
    if (e < 1) return "Bound ellipse. The path closes. Specific energy is negative, so there is no hyperbolic excess speed.";
    if (e === 1) return "Parabola. This is the escape orbit. v∞ is 0: it can reach infinite distance, with no speed left.";
    return "Hyperbola. e > 1, so the path does not close. The object leaves, and the speed that remains at infinity is v∞.";
  }

  function catalogSentence(body) {
    var vp = fmtSpeed(vPeri(body.e, body.q));
    var excess = vInf(body.e, body.q);
    var tail = " Perihelion speed from vis-viva is " + vp + " km/s.";
    if (excess === null) {
      tail += " The orbit is bound, so v∞ is not defined.";
    } else {
      tail += " v∞ computed from GM (e−1)/q is " + fmtSpeed(excess) + " km/s.";
    }
    var extra = body.comment ? " JPL’s comment on this solution: " + body.comment + "." : "";
    return body.fullname + ". JPL Small-Body Database orbit solution " + body.orbitId +
      ", epoch JD " + body.epochJd + " TDB, solution date " + body.solnDate +
      ". e = " + String(body.e) + ", q = " + String(body.q) + " AU, a = " + String(body.a) +
      " AU. a = q/(1−e) matches that semi-major axis. Inclination " + String(body.i) +
      "° is printed and not drawn. Orbit class " + body.orbitClass + ", code " + body.orbitCode +
      "." + extra + tail + " GM is the Sun Fact Sheet value, 132,712 × 10^6 km³/s². The speeds are computed on this page. They are not a Small-Body Database field.";
  }

  function classroomSentence(e, q) {
    var a = signedA(e, q);
    var axis = a === null ? "The semi-major axis is not finite." : "Signed semi-major axis a = q/(1−e) = " + a.toFixed(6) + " AU.";
    return "Classroom conic. Not a catalog orbit. Eccentricity " + fmtE(e) + ", perihelion " + fmtQ(q) + " AU. " + axis + " " + shapeSentence(e);
  }

  function scene(state) {
    var e = state && state.e;
    var q = state && state.q;
    var err = validate(e, q);
    if (err) return { ok: false, error: err };
    var preset = state.preset ? catalogById(state.preset) : null;
    if (preset && (preset.e !== e || preset.q !== q)) preset = null;
    var excess = vInf(e, q);
    var peri = vPeri(e, q);
    var a = preset ? preset.a : signedA(e, q);
    var drawn = curve(e, q);
    var box = frame(e, q);
    var why = preset ? catalogSentence(preset) : classroomSentence(e, q);
    return {
      ok: true,
      e: e,
      q: q,
      a: a,
      kind: kindOf(e),
      bound: boundOf(e),
      vInf: excess,
      vPeri: peri,
      preset: preset,
      why: why,
      shape: shapeSentence(e),
      curve: drawn,
      frame: box,
      text: {
        e: fmtE(e),
        q: fmtQ(q) + " AU",
        kind: kindOf(e),
        vPeri: fmtSpeed(peri) + " km/s",
        vInf: excess === null ? "none — bound" : fmtSpeed(excess) + " km/s"
      }
    };
  }

  function stateFromPreset(id) {
    var body = catalogById(id);
    if (!body) return { e: 1.2, q: 1, preset: null };
    return { e: body.e, q: body.q, preset: body.id };
  }

  function limitsNote() {
    return "Educational schematic. One body and the Sun, drawn in the orbit plane. Eccentricity runs from a circle (e = 0) through a parabola (e = 1) to a hyperbola (e > 1). Perihelion stays on the right. For e < 1 the path closes and there is no v∞. At e = 1, v∞ is 0. For e > 1, v∞² = GM (e−1)/q, with the Sun Fact Sheet GM, 132,712 × 10⁶ km³/s², and q the perihelion distance. Catalog buttons load JPL Small-Body Database osculating elements. The three interstellar excess speeds are computed from those elements. They are not a JPL field. Inclination is printed and not drawn. The dashed ring is 1 AU. The Sun is a dot, not to scale. Other planets are left out. Not a JPL Horizons ephemeris and not a trajectory to fly.";
  }

  return {
    AU_M: AU_M,
    AU_KM: AU_KM,
    SUN_GM: SUN_GM,
    SUN_RADIUS_KM: SUN_RADIUS_KM,
    E_MIN: E_MIN,
    E_MAX: E_MAX,
    Q_MIN: Q_MIN,
    Q_MAX: Q_MAX,
    EARTH_MEAN_KMS: EARTH_MEAN_KMS,
    OUMUAMUA: OUMUAMUA,
    BORISOV: BORISOV,
    ATLAS: ATLAS,
    HALLEY: HALLEY,
    catalogById: catalogById,
    signedA: signedA,
    kindOf: kindOf,
    boundOf: boundOf,
    vPeri: vPeri,
    vInf: vInf,
    vInfFromA: vInfFromA,
    fmtE: fmtE,
    fmtQ: fmtQ,
    fmtSpeed: fmtSpeed,
    fmtDeg: fmtDeg,
    validate: validate,
    curve: curve,
    frame: frame,
    shapeSentence: shapeSentence,
    catalogSentence: catalogSentence,
    scene: scene,
    stateFromPreset: stateFromPreset,
    limitsNote: limitsNote
  };
});
