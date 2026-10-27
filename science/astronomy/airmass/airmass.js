/*! Airmass, atmospheric extinction, and astronomical refraction.
    Classroom arithmetic. Not a forecast and not an ephemeris.
    Every constant below is named in the comment and cited on the page.

    Airmass: Kasten and Young, Applied Optics 28, 4735 (1989).
    The slider uses their approximation. Table II is the ISO Standard
    Atmosphere integral printed in that paper.

    Extinction slopes: Krisciunas and colleagues, PASP 99, 887 (1987)
    and PASP 102, 1052 (1990). Dimming in magnitudes is k times airmass,
    the slope those papers measure.

    Refraction: Bennett, Journal of Navigation 35, 255 (1982), from
    apparent altitude, and Sæmundsson, Sky & Telescope 72, 70 (1986),
    from true altitude. Meeus, Astronomical Algorithms, multiplies both
    by (P/1010)×(283/(273+T)) at a standard 1010 hPa and 10°C.

    Sunrise’s about 34′ and the Sun’s about 16′ are the NOAA allowance
    the twilight desk already uses. Catalog magnitudes are the same
    values as the magnitude desk, extinction left out. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Airmass = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Kasten & Young 1989, eq. for relative optical air mass at apparent
     elevation γ in degrees:
     m = [sin γ + 0.50572 (γ + 6.07995)^(−1.6364)]^(−1)
     sin γ is the trigonometric sine. The polynomial is in degrees. */
  var KY_A = 0.50572;
  var KY_B = 6.07995;
  var KY_C = 1.6364;

  /* Table II, relative air mass m(γ) and the paper’s relative error r(γ)
     of the approximation, in percent. Five rows the slider can land on. */
  var TABLE = [
    { alt: 0, m: 38.0868, rPercent: 0.432 },
    { alt: 10, m: 5.5841, rPercent: -0.035 },
    { alt: 30, m: 1.9939, rPercent: -0.020 },
    { alt: 60, m: 1.1543, rPercent: 0.027 },
    { alt: 90, m: 1.0000, rPercent: 0.029 }
  ];

  /* Bennett 1982. R in arcminutes, apparent altitude h in degrees.
     R = cot( h + 7.31 / (h + 4.4) ).
     Sæmundsson 1986, from true altitude h:
     R = 1.02 cot( h + 10.3 / (h + 5.11) ).
     Meeus’s factor is 1 at 1010 hPa and 10°C: 283 = 273 + 10. */
  var BENNETT_NUM = 7.31;
  var BENNETT_DEN = 4.4;
  var SAEM_SCALE = 1.02;
  var SAEM_NUM = 10.3;
  var SAEM_DEN = 5.11;
  var P_STD = 1010;
  var T_STD = 10;
  var T_ZERO = 273;
  var T_NUM = 283;

  /* NOAA’s sunrise note, the same allowance as the twilight desk:
     about 34′ of refraction and about 16′ of solar semi-diameter,
     together the −0.833° geometric altitude. */
  var HORIZON_REFRACTION_ARCMIN = 34;
  var SOLAR_SEMIDIAMETER_ARCMIN = 16;
  var SUNRISE_ALT_DEG = -0.833;

  /* Catalog V, extinction left out. Same figures as the magnitude desk. */
  var OBJECTS = [
    {
      id: "sun",
      name: "Sun",
      v: -26.74,
      approx: false,
      tier: "V(1,0)",
      note: "NASA’s Sun Fact Sheet, visual magnitude V(1,0) −26.74. The magnitude desk uses this with extinction left out."
    },
    {
      id: "moon",
      name: "Full Moon",
      v: -12.74,
      approx: true,
      tier: "Mean opposition",
      note: "NASA’s Moon Fact Sheet, apparent visual magnitude −12.74 at mean opposition. A given full Moon moves with distance."
    },
    {
      id: "venus",
      name: "Venus",
      v: -4.8,
      approx: true,
      tier: "Maximum",
      note: "NASA’s Venus Fact Sheet, maximum visual magnitude −4.8, one decimal."
    },
    {
      id: "sirius",
      name: "Sirius",
      v: -1.46,
      approx: false,
      tier: "Johnson V",
      note: "Ducati 2002, as listed by SIMBAD for * alf CMa: V = −1.46."
    },
    {
      id: "vega",
      name: "Vega",
      v: 0.03,
      approx: false,
      tier: "Johnson V",
      note: "Ducati 2002, as listed by SIMBAD for * alf Lyr: V = 0.03. The historical zero is 0.00."
    },
    {
      id: "polaris",
      name: "Polaris",
      v: 2.02,
      approx: true,
      tier: "Johnson V · variable",
      note: "Ducati 2002, as listed by SIMBAD for * alf UMi: V = 2.02. SIMBAD types it a classical Cepheid."
    }
  ];

  /* Krisciunas et al. 1987 medians at the Mauna Kea summit (their 4200 m).
     Krisciunas 1990: 2800 m median V, and the B means used in the
     scale-height set. Sea level is Keaau, Hawaii, 75 m, Table 2.
     B at sea level and the 2800 m B mean are for a star of B−V = 0. */
  var SITES = [
    {
      id: "summit",
      name: "Mauna Kea summit",
      short: "Summit · 4200 m",
      elevationM: 4200,
      note: "Krisciunas et al. 1987 medians at the summit. A good high site. The 1990 paper’s summit means are a different summary and are not these buttons.",
      bands: [
        { id: "B", k: 0.19, stat: "median" },
        { id: "V", k: 0.11, stat: "median" },
        { id: "J", k: 0.10, stat: "median" },
        { id: "H", k: 0.05, stat: "median" },
        { id: "K", k: 0.07, stat: "median" }
      ]
    },
    {
      id: "mid",
      name: "Mauna Kea 2800 m",
      short: "2800 m",
      elevationM: 2800,
      note: "Krisciunas 1990. V is the median, 0.172. B is the mean used with the scale-height set, 0.322 ± 0.019, not a median.",
      bands: [
        { id: "B", k: 0.322, stat: "mean", err: 0.019 },
        { id: "V", k: 0.172, stat: "median" }
      ]
    },
    {
      id: "sea-haze",
      name: "Sea level, hazy night",
      short: "75 m · hazy",
      elevationM: 75,
      note: "Krisciunas 1990, Table 2, Keaau, 19 December 1989. Noticeable haze at sunset. B is for B−V = 0.",
      bands: [
        { id: "B", k: 0.498, stat: "night", err: 0.055 },
        { id: "V", k: 0.341, stat: "night", err: 0.020 }
      ]
    },
    {
      id: "sea-clear",
      name: "Sea level, clearer night",
      short: "75 m · clearer",
      elevationM: 75,
      note: "Krisciunas 1990, Table 2, 20 December 1989. No volcanic haze. Strong scintillation even at the zenith. B is for B−V = 0.",
      bands: [
        { id: "B", k: 0.334, stat: "night", err: 0.033 },
        { id: "V", k: 0.187, stat: "night", err: 0.046 }
      ]
    }
  ];

  /* Naked-eye anchors. Same citations as the magnitude and telescope desks.
     The slider ends are the control, not a third measurement. */
  var LIMITS = [
    { id: "ideal-faint", value: 6.5, label: "6.5 · ideal", note: "Faint edge of the ideal range in NASA’s Imagine the Universe note." },
    { id: "ideal", value: 6.0, label: "6.0 · ideal", note: "Bright edge of that ideal range." },
    { id: "city", value: 4.0, label: "4.0 · inner city", note: "Sky & Telescope, Bortle class 9: limiting magnitude 4.0 or less." }
  ];

  var PRESETS = [
    { id: "zenith", altitudeDeg: 90, label: "Zenith" },
    { id: "thirty", altitudeDeg: 30, label: "30°" },
    { id: "ten", altitudeDeg: 10, label: "10°" },
    { id: "horizon", altitudeDeg: 0, label: "Horizon" },
    { id: "setting-sun", altitudeDeg: 16 / 60, objectId: "sun", label: "Setting Sun" }
  ];

  var ALT_MIN = 0;
  var ALT_MAX = 90;
  var LIMIT_MIN = -2;
  var LIMIT_MAX = 15;
  var P_MIN = 900;
  var P_MAX = 1100;
  var T_MIN = -20;
  var T_MAX = 40;

  function objectById(id) {
    var i;
    for (i = 0; i < OBJECTS.length; i++) if (OBJECTS[i].id === id) return OBJECTS[i];
    return null;
  }

  function siteById(id) {
    var i;
    for (i = 0; i < SITES.length; i++) if (SITES[i].id === id) return SITES[i];
    return null;
  }

  function bandOn(site, bandId) {
    if (!site) return null;
    var i;
    for (i = 0; i < site.bands.length; i++) if (site.bands[i].id === bandId) return site.bands[i];
    return null;
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function limitById(id) {
    var i;
    for (i = 0; i < LIMITS.length; i++) if (LIMITS[i].id === id) return LIMITS[i];
    return null;
  }

  /* Relative optical air mass. Apparent elevation in degrees. */
  function kastenYoung(altDeg) {
    var rad = altDeg * Math.PI / 180;
    var denom = Math.sin(rad) + KY_A * Math.pow(altDeg + KY_B, -KY_C);
    return 1 / denom;
  }

  /* Plane-parallel slab: sec(z) = 1/sin(altitude). No finite value at 0°. */
  function planeParallel(altDeg) {
    if (!(altDeg > 0)) return Infinity;
    return 1 / Math.sin(altDeg * Math.PI / 180);
  }

  function pressureFactor(pressureHpa, tempC) {
    return (pressureHpa / P_STD) * (T_NUM / (T_ZERO + tempC));
  }

  function bennettArcmin(altDeg, pressureHpa, tempC) {
    var p = pressureHpa == null ? P_STD : pressureHpa;
    var t = tempC == null ? T_STD : tempC;
    var arg = altDeg + BENNETT_NUM / (altDeg + BENNETT_DEN);
    var r0 = 1 / Math.tan(arg * Math.PI / 180);
    return r0 * pressureFactor(p, t);
  }

  function saemundssonArcmin(trueAltDeg, pressureHpa, tempC) {
    var p = pressureHpa == null ? P_STD : pressureHpa;
    var t = tempC == null ? T_STD : tempC;
    var arg = trueAltDeg + SAEM_NUM / (trueAltDeg + SAEM_DEN);
    var r0 = SAEM_SCALE / Math.tan(arg * Math.PI / 180);
    return r0 * pressureFactor(p, t);
  }

  /* Apparent vertical solar diameter when the lower limb is at hL degrees
     apparent. The true angular diameter is twice the about-16′ semi-diameter.
     Horizontal size stays that true diameter: refraction is a vertical lift.
     Bennett supplies R at each apparent limb. */
  function sunVerticalArcmin(lowerLimbDeg, pressureHpa, tempC) {
    var sepDeg = (2 * SOLAR_SEMIDIAMETER_ARCMIN) / 60;
    var D = sepDeg;
    var i, hU, gap, rL, rU;
    if (!(lowerLimbDeg > -4)) return NaN;
    for (i = 0; i < 50; i++) {
      hU = lowerLimbDeg + D;
      rL = bennettArcmin(lowerLimbDeg, pressureHpa, tempC);
      rU = bennettArcmin(hU, pressureHpa, tempC);
      if (!isFinite(rL) || !isFinite(rU)) return NaN;
      gap = (hU - rU / 60) - (lowerLimbDeg - rL / 60);
      D += sepDeg - gap;
      if (Math.abs(sepDeg - gap) < 1e-12) break;
    }
    return D * 60;
  }

  function tableAt(altDeg) {
    var i;
    for (i = 0; i < TABLE.length; i++) {
      if (Math.abs(TABLE[i].alt - altDeg) < 1e-6) return TABLE[i];
    }
    return null;
  }

  function inRange(x, lo, hi) {
    return typeof x === "number" && isFinite(x) && x >= lo && x <= hi;
  }

  function compute(input) {
    if (!input) return null;
    var alt = input.altitudeDeg;
    var obj = objectById(input.objectId);
    var site = siteById(input.siteId);
    var band = bandOn(site, input.bandId);
    if (!inRange(alt, ALT_MIN, ALT_MAX)) return null;
    if (!inRange(input.limit, LIMIT_MIN, LIMIT_MAX)) return null;
    if (!inRange(input.pressureHpa, P_MIN, P_MAX)) return null;
    if (!inRange(input.tempC, T_MIN, T_MAX)) return null;
    if (!obj || !site || !band) return null;

    var x = kastenYoung(alt);
    var sec = planeParallel(alt);
    var delta = band.k * x;
    var visual = band.id === "V";
    var mExt = visual ? obj.v + delta : null;
    var refr = bennettArcmin(alt, input.pressureHpa, input.tempC);
    var trueAlt = alt - refr / 60;
    var saem = saemundssonArcmin(trueAlt, input.pressureHpa, input.tempC);
    var lower = alt - SOLAR_SEMIDIAMETER_ARCMIN / 60;
    var vertical = obj.id === "sun" ? sunVerticalArcmin(lower, input.pressureHpa, input.tempC) : null;
    var row = tableAt(alt);

    return {
      ok: true,
      altitudeDeg: alt,
      object: obj,
      site: site,
      band: band,
      airmass: x,
      planeParallel: sec,
      deltaMag: delta,
      visual: visual,
      catalogV: obj.v,
      extinctedV: mExt,
      fluxFactor: Math.pow(10, 0.4 * (visual ? delta : band.k * x)),
      limit: input.limit,
      visible: visual ? mExt <= input.limit : null,
      refractionArcmin: refr,
      trueAltitudeDeg: trueAlt,
      saemundssonArcmin: saem,
      refractionGapArcmin: refr - saem,
      factor: pressureFactor(input.pressureHpa, input.tempC),
      pressureHpa: input.pressureHpa,
      tempC: input.tempC,
      horizonRefractionArcmin: bennettArcmin(0, input.pressureHpa, input.tempC),
      sun: obj.id === "sun" ? {
        horizontalArcmin: 2 * SOLAR_SEMIDIAMETER_ARCMIN,
        verticalArcmin: vertical,
        lowerLimbDeg: lower,
        semiArcmin: SOLAR_SEMIDIAMETER_ARCMIN
      } : null,
      table: row
    };
  }

  function trimNum(n, digits) {
    var s = n.toFixed(digits);
    if (s.indexOf(".") === -1) return s;
    return s.replace(/\.?0+$/, "");
  }

function formatAirmass(x) {
    if (!isFinite(x)) return "unbounded";
    if (x >= 100) return x.toFixed(0);
    if (x >= 10) return x.toFixed(2);
    return x.toFixed(4);
  }

  function formatMag(m) {
    if (m == null || !isFinite(m)) return "—";
    var s = m.toFixed(2);
    if (m > 0) s = "+" + s;
    return s.replace("-", "−");
  }

  function formatArcmin(r) {
    if (!isFinite(r)) return "—";
    var digits = Math.abs(r) >= 10 ? 1 : (Math.abs(r) >= 1 ? 2 : 3);
    var s = r.toFixed(digits);
    return s.replace("-", "−") + "′";
  }

  function formatAltitude(deg) {
    if (Math.abs(deg - 16 / 60) < 1e-9) return "16′";
    if (Math.abs(deg - Math.round(deg)) < 1e-9) return String(Math.round(deg)) + "°";
    return trimNum(deg, 4) + "°";
  }

  function formatDeg(deg) {
    var s = deg.toFixed(3).replace("-", "−");
    return s + "°";
  }

  function formatFactor(f) {
    if (!isFinite(f)) return "—";
    if (f >= 100) return f.toFixed(0) + "×";
    if (f >= 10) return f.toFixed(1) + "×";
    return f.toFixed(3) + "×";
  }

  function formatK(band) {
    var s = String(band.k);
    if (band.err != null) s += " ± " + band.err;
    return s;
  }

  return {
    KY_A: KY_A,
    KY_B: KY_B,
    KY_C: KY_C,
    TABLE: TABLE,
    BENNETT_NUM: BENNETT_NUM,
    BENNETT_DEN: BENNETT_DEN,
    SAEM_SCALE: SAEM_SCALE,
    SAEM_NUM: SAEM_NUM,
    SAEM_DEN: SAEM_DEN,
    P_STD: P_STD,
    T_STD: T_STD,
    T_ZERO: T_ZERO,
    T_NUM: T_NUM,
    HORIZON_REFRACTION_ARCMIN: HORIZON_REFRACTION_ARCMIN,
    SOLAR_SEMIDIAMETER_ARCMIN: SOLAR_SEMIDIAMETER_ARCMIN,
    SUNRISE_ALT_DEG: SUNRISE_ALT_DEG,
    OBJECTS: OBJECTS,
    SITES: SITES,
    LIMITS: LIMITS,
    PRESETS: PRESETS,
    ALT_MIN: ALT_MIN,
    ALT_MAX: ALT_MAX,
    LIMIT_MIN: LIMIT_MIN,
    LIMIT_MAX: LIMIT_MAX,
    P_MIN: P_MIN,
    P_MAX: P_MAX,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    objectById: objectById,
    siteById: siteById,
    bandOn: bandOn,
    presetById: presetById,
    limitById: limitById,
    kastenYoung: kastenYoung,
    planeParallel: planeParallel,
    pressureFactor: pressureFactor,
    bennettArcmin: bennettArcmin,
    saemundssonArcmin: saemundssonArcmin,
    sunVerticalArcmin: sunVerticalArcmin,
    tableAt: tableAt,
    compute: compute,
    formatAirmass: formatAirmass,
    formatMag: formatMag,
    formatArcmin: formatArcmin,
    formatAltitude: formatAltitude,
    formatDeg: formatDeg,
    formatFactor: formatFactor,
    formatK: formatK
  };
});
