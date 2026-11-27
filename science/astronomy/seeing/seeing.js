/*! Astronomical seeing and a classroom adaptive-optics scale.

    Fried parameter at the reference wavelength and at the zenith,
    then scaled. r0 ∝ λ^(6/5) and r0 ∝ (sec z)^(−3/5), from
    r0^(−5/3) ∝ k^2 sec(z) ∫ Cn² dh with k = 2π/λ.
    Fried, JOSA 56, 1372 (1966). Tokovinin, Atmosphere 14, 1694 (2023).

    Long-exposure seeing FWHM = SEEING_FACTOR × λ / r0.
    Tokovinin’s equation (6) prints 0.981 for an infinite outer scale.
    This desk uses 0.98, the usual rounding, and does not substitute 0.981.
    Because r0 ∝ λ^(6/5), that width scales as λ^(−1/5).

    Diffraction is Rayleigh’s 1.22 λ/D, the same conventional factor
    as the telescope desk. The first zero of J1 divided by π is the
    unrounded companion. It is computed and not substituted.

    Coherence time τ0 = 0.314 r0 / v.
    Isoplanatic angle at zenith θ0 = 0.314 r0 / h̄.
    Off zenith, θ0 = 0.314 cos(z) r0 / h̄, with r0 already carrying
    the (sec z)^(−3/5) factor. Quirrenbach’s comparison of the two
    definitions, and Claire Max’s lecture notes, both print the cos z.

    A wavefront is called seeing-limited when D > r0 (more than one
    coherence cell across the aperture) and diffraction-limited, in
    that classroom sense, when D ≤ r0. The delivered long-exposure
    angle on this page is the larger of the seeing FWHM and the
    Rayleigh angle. Those two angles meet at D = (1.22/0.98) r0,
    a little past D = r0, because the coefficients differ.

    Site r0 buttons are illustrative. They are not observatory medians.
    Not a forecast and not an adaptive-optics design. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Seeing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Reference wavelength for the typed Fried parameter. Tokovinin:
     when seeing is quoted as r0 or as a FWHM, the wavelength has to
     be stated, and 500 nm is the usual statement. */
  var REF_NM = 500;

  /* Tokovinin 2023, eq. (6), is 0.981. This constant is 0.98. */
  var SEEING_FACTOR = 0.98;

  /* Conventional Rayleigh factor, shared with the telescope desk.
     The drawn Airy core uses the Bessel function, not this rounding. */
  var RAYLEIGH_FACTOR = 1.22;

  /* Single-layer coherence time and isoplanatic angle.
     τ0 ≈ 0.314 r0 / v, θ0 ≈ 0.314 r0 / h̄ at zenith. */
  var TIME_FACTOR = 0.314;
  var ISO_FACTOR = 0.314;

  var ARCSEC_PER_RAD = (180 / Math.PI) * 3600;

  var R0_CM_MIN = 1;
  var R0_CM_MAX = 40;
  var Z_DEG_MIN = 0;
  var Z_DEG_MAX = 70;
  var LAMBDA_NM_MIN = 400;
  var LAMBDA_NM_MAX = 2500;
  var D_CM_MIN = 1;
  var D_CM_MAX = 5000;
  var WIND_MIN = 1;
  var WIND_MAX = 40;
  var HEIGHT_M_MIN = 200;
  var HEIGHT_M_MAX = 20000;

  /* Nominal band centers for the buttons.
     V is 550 nm, the telescope desk’s round visual wavelength,
     five nanometres from the CIE photopic peak and not Bessell’s
     545 nm effective wavelength.
     R 640 nm and I 800 nm sit next to Bessell’s Johnson–Cousins
     effective wavelengths (about 638–641 nm and about 797–798 nm).
     J, H, and K are the classic 1.25, 1.65, and 2.2 µm windows.
     Bessell’s A0 effective wavelengths are about 1.22, 1.63, and
     2.19 µm. These buttons are not a filter curve. */
  var BANDS = [
    { id: "ref", label: "500 nm", nm: 500, note: "reference" },
    { id: "V", label: "V 550 nm", nm: 550, note: "visual" },
    { id: "R", label: "R 640 nm", nm: 640, note: "nominal" },
    { id: "I", label: "I 800 nm", nm: 800, note: "nominal" },
    { id: "J", label: "J 1.25 µm", nm: 1250, note: "window" },
    { id: "H", label: "H 1.65 µm", nm: 1650, note: "window" },
    { id: "K", label: "K 2.2 µm", nm: 2200, note: "window" }
  ];

  /* Illustrative r0 at 500 nm and the zenith. Not a site measurement.
     10 cm is the round “good site” figure in Dhillon’s teaching note.
     5 cm and 15 cm are round neighbours: a couple of arcseconds, and
     a width near published excellent-site medians. The medians are
     cited on the page and are not loaded into these buttons. */
  var SITES = [
    { id: "suburban", label: "Suburban", r0Cm: 5 },
    { id: "mountain", label: "Good mountain", r0Cm: 10 },
    { id: "excellent", label: "Excellent site", r0Cm: 15 }
  ];

  /* Apertures. 7×50 uses the 50 mm objective. The 7× does not enter
     r0, seeing, or diffraction. 20 cm is the 8-inch-class button,
     the same round 200 mm as the telescope desk. Eight inches is
     20.32 cm and is not substituted. 8 m and 39 m are class sizes. */
  var TELESCOPES = [
    { id: "bino", label: "7×50", dCm: 5 },
    { id: "amateur", label: "8-inch · 20 cm", dCm: 20 },
    { id: "one", label: "1 m", dCm: 100 },
    { id: "eight", label: "8 m", dCm: 800 },
    { id: "elt", label: "39 m ELT", dCm: 3900 }
  ];

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function inRange(n, lo, hi) {
    return finite(n) && n >= lo && n <= hi;
  }

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  /* Plane-parallel airmass, sec(z). The airmass desk is the curved
     atmosphere. This page stops at 70°, where sec(z) is still a
     usable shortcut and has not run away at the horizon. */
  function airmassPlane(zenithDeg) {
    var c = Math.cos(degToRad(zenithDeg));
    if (c < 1e-6) return Infinity;
    return 1 / c;
  }

  function zenithFromAirmass(x) {
    if (!finite(x) || x < 1) return NaN;
    var c = 1 / x;
    if (c > 1) c = 1;
    if (c < -1) return NaN;
    return Math.acos(c) * 180 / Math.PI;
  }

  function r0Meters(r0RefCm, lambdaNm, zenithDeg) {
    var x = airmassPlane(zenithDeg);
    return (r0RefCm / 100) *
      Math.pow(lambdaNm / REF_NM, 6 / 5) *
      Math.pow(x, -3 / 5);
  }

  function radToArcsec(rad) {
    return rad * ARCSEC_PER_RAD;
  }

  function seeingArcsec(r0m, lambdaNm) {
    return radToArcsec(SEEING_FACTOR * (lambdaNm * 1e-9) / r0m);
  }

  function rayleighArcsec(dCm, lambdaNm) {
    return radToArcsec(RAYLEIGH_FACTOR * (lambdaNm * 1e-9) / (dCm / 100));
  }

  function coherenceSeconds(r0m, windMs) {
    return TIME_FACTOR * r0m / windMs;
  }

  /* r0m is the Fried parameter at this wavelength and zenith angle.
     The extra cos(z) is the geometric factor in θ0’s definition. */
  function isoplanaticArcsec(r0m, heightM, zenithDeg) {
    var rad = ISO_FACTOR * Math.cos(degToRad(zenithDeg)) * r0m / heightM;
    return radToArcsec(rad);
  }

  /* a_k in the large-argument expansion of J1, from the product in
     Abramowitz and Stegun 9.2.5. Same construction as the telescope desk. */
  function j1AsympCoeff(k) {
    if (k === 0) return 1;
    var num = 1;
    var den = 1;
    var i;
    for (i = 1; i <= k; i++) {
      num *= 4 - (2 * i - 1) * (2 * i - 1);
      den *= i * 8;
    }
    return num / den;
  }

  function besselJ1(x) {
    var ax = Math.abs(x);
    if (ax < 1e-8) return x * 0.5;
    var sum, term, k, p, q, chi, s;
    if (ax <= 15) {
      term = ax * 0.5;
      sum = term;
      for (k = 1; k < 80; k++) {
        term *= -(ax * ax) / (4 * k * (k + 1));
        sum += term;
        if (Math.abs(term) < 1e-16 * (Math.abs(sum) + 1)) break;
      }
      return x < 0 ? -sum : sum;
    }
    p = 0;
    q = 0;
    for (k = 0; k < 6; k++) {
      p += Math.pow(-1, k) * j1AsympCoeff(2 * k) / Math.pow(ax, 2 * k);
      q += Math.pow(-1, k) * j1AsympCoeff(2 * k + 1) / Math.pow(ax, 2 * k + 1);
    }
    chi = ax - 0.75 * Math.PI;
    s = Math.sqrt(2 / (Math.PI * ax)) * (p * Math.cos(chi) - q * Math.sin(chi));
    return x < 0 ? -s : s;
  }

  function firstJ1Zero() {
    var lo = 3.8;
    var hi = 3.85;
    var i, mid;
    for (i = 0; i < 60; i++) {
      mid = (lo + hi) * 0.5;
      if (besselJ1(mid) > 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) * 0.5;
  }

  var J1_ZERO = firstJ1Zero();
  var RAYLEIGH_EXACT = J1_ZERO / Math.PI;

  /* θ in radians. I(0) = 1. The first dark ring is the first zero of J1. */
  function airyIntensity(thetaRad, lambdaNm, dCm) {
    var lam = lambdaNm * 1e-9;
    var d = dCm / 100;
    var x = Math.PI * d * Math.abs(thetaRad) / lam;
    if (x < 1e-8) return 1;
    var j = besselJ1(x);
    var a = 2 * j / x;
    return a * a;
  }

  /* Circular Gaussian whose full width at half maximum is fwhmArcsec. */
  function gaussianIntensity(thetaRad, fwhmArcsec) {
    if (!(fwhmArcsec > 0)) return 0;
    var fwhmRad = fwhmArcsec / ARCSEC_PER_RAD;
    var u = thetaRad / fwhmRad;
    return Math.exp(-4 * Math.LN2 * u * u);
  }

  function halfFieldArcsec(seeing, rayleigh) {
    var m = Math.max(seeing, rayleigh);
    if (!(m > 0)) m = 1;
    return 1.8 * m;
  }

  function solve(input) {
    if (!input) return null;
    var r0Cm = input.r0Cm;
    var zenithDeg = input.zenithDeg;
    var lambdaNm = input.lambdaNm;
    var dCm = input.dCm;
    var windMs = input.windMs;
    var heightM = input.heightM;
    if (!inRange(r0Cm, R0_CM_MIN, R0_CM_MAX)) return null;
    if (!inRange(zenithDeg, Z_DEG_MIN, Z_DEG_MAX)) return null;
    if (!inRange(lambdaNm, LAMBDA_NM_MIN, LAMBDA_NM_MAX)) return null;
    if (!inRange(dCm, D_CM_MIN, D_CM_MAX)) return null;
    if (!inRange(windMs, WIND_MIN, WIND_MAX)) return null;
    if (!inRange(heightM, HEIGHT_M_MIN, HEIGHT_M_MAX)) return null;

    var r0m = r0Meters(r0Cm, lambdaNm, zenithDeg);
    var seeing = seeingArcsec(r0m, lambdaNm);
    var rayleigh = rayleighArcsec(dCm, lambdaNm);
    var dM = dCm / 100;
    var seeingLimited = dM > r0m;
    var larger = Math.max(seeing, rayleigh);
    var dominant = "seeing";
    if (Math.abs(seeing - rayleigh) <= 1e-9 * larger) dominant = "tied";
    else if (rayleigh > seeing) dominant = "diffraction";

    return {
      ok: true,
      r0Cm: r0Cm,
      zenithDeg: zenithDeg,
      lambdaNm: lambdaNm,
      dCm: dCm,
      windMs: windMs,
      heightM: heightM,
      airmass: airmassPlane(zenithDeg),
      r0m: r0m,
      r0HereCm: r0m * 100,
      seeingArcsec: seeing,
      rayleighArcsec: rayleigh,
      seeingLimited: seeingLimited,
      dominant: dominant,
      effectiveArcsec: larger,
      tauSec: coherenceSeconds(r0m, windMs),
      theta0Arcsec: isoplanaticArcsec(r0m, heightM, zenithDeg),
      dOverR0: dM / r0m,
      /* Aperture where the two angles are equal, in cm. */
      angleCrossCm: (RAYLEIGH_FACTOR / SEEING_FACTOR) * r0m * 100,
      halfFieldArcsec: halfFieldArcsec(seeing, rayleigh)
    };
  }

  function opening() {
    return {
      r0Cm: 10,
      zenithDeg: 0,
      lambdaNm: 550,
      dCm: 20,
      windMs: 10,
      heightM: 5000
    };
  }

  function formatArcsec(arcsec) {
    if (!finite(arcsec)) return "—";
    var sign = arcsec < 0 ? "−" : "";
    var a = Math.abs(arcsec);
    var digits = a >= 0.1 ? 3 : (a >= 0.01 ? 4 : 5);
    return sign + a.toFixed(digits) + "″";
  }

  function formatCm(cm) {
    if (!finite(cm)) return "—";
    if (cm >= 100) {
      var m = cm / 100;
      return (m >= 10 ? m.toFixed(1) : m.toFixed(2)) + " m";
    }
    return cm.toFixed(2) + " cm";
  }

  function formatTime(sec) {
    if (!finite(sec)) return "—";
    var ms = sec * 1000;
    if (ms < 1000) return ms.toFixed(2) + " ms";
    return (sec).toFixed(2) + " s";
  }

  function formatAirmass(x) {
    if (!finite(x)) return "—";
    return x.toFixed(3);
  }

  function formatDeg(deg) {
    if (!finite(deg)) return "—";
    return deg.toFixed(1) + "°";
  }

  function formatRatio(x) {
    if (!finite(x)) return "—";
    return x.toFixed(2);
  }

  function bandById(id) {
    var i;
    for (i = 0; i < BANDS.length; i++) if (BANDS[i].id === id) return BANDS[i];
    return null;
  }

  function siteById(id) {
    var i;
    for (i = 0; i < SITES.length; i++) if (SITES[i].id === id) return SITES[i];
    return null;
  }

  function telescopeById(id) {
    var i;
    for (i = 0; i < TELESCOPES.length; i++) if (TELESCOPES[i].id === id) return TELESCOPES[i];
    return null;
  }

  function matchedBand(lambdaNm) {
    var i;
    for (i = 0; i < BANDS.length; i++) {
      if (Math.abs(BANDS[i].nm - lambdaNm) < 0.51) return BANDS[i];
    }
    return null;
  }

  function matchedSite(r0Cm) {
    var i;
    for (i = 0; i < SITES.length; i++) {
      if (Math.abs(SITES[i].r0Cm - r0Cm) < 0.051) return SITES[i];
    }
    return null;
  }

  function matchedTelescope(dCm) {
    var i;
    for (i = 0; i < TELESCOPES.length; i++) {
      if (Math.abs(TELESCOPES[i].dCm - dCm) < 0.051) return TELESCOPES[i];
    }
    return null;
  }

  function regimePhrase(row) {
    if (row.seeingLimited) {
      return "Seeing-limited wavefront. D is wider than r0, so more than one coherence cell fits across the aperture.";
    }
    return "Diffraction-limited wavefront, in the classroom sense. D is within one coherence cell (D ≤ r0).";
  }

  function dominantPhrase(row) {
    if (row.dominant === "tied") {
      return "The seeing FWHM and the Rayleigh angle are equal at this setting.";
    }
    if (row.dominant === "seeing") {
      return "The larger angle is the seeing FWHM, " + formatArcsec(row.seeingArcsec) + ".";
    }
    return "The larger angle is Rayleigh’s criterion, " + formatArcsec(row.rayleighArcsec) + ".";
  }

  function why(row) {
    if (!row || !row.ok) return "";
    var bits = [];
    bits.push("r0 at 500 nm and the zenith is " + formatCm(row.r0Cm) + ".");
    bits.push("At " + formatDeg(row.zenithDeg) + " the plane-parallel airmass is " + formatAirmass(row.airmass) + ".");
    bits.push("Scaled by λ^(6/5) and (sec z)^(−3/5), r0 at " + row.lambdaNm.toFixed(0) + " nm is " + formatCm(row.r0HereCm) + ".");
    bits.push("Seeing FWHM is 0.98 λ/r0, which is " + formatArcsec(row.seeingArcsec) + ".");
    bits.push("Rayleigh’s 1.22 λ/D for " + formatCm(row.dCm) + " is " + formatArcsec(row.rayleighArcsec) + ".");
    bits.push(regimePhrase(row));
    bits.push(dominantPhrase(row));
    bits.push("The delivered angle on this page is the larger of the two, " + formatArcsec(row.effectiveArcsec) + ".");
    if (row.seeingLimited && row.dominant === "diffraction") {
      bits.push("D is already past r0, and the Rayleigh angle is still the larger number. The angles meet at D = " + formatCm(row.angleCrossCm) + ", which is 1.22/0.98 times r0.");
    }
    bits.push("Coherence time τ0 = 0.314 r0/v is " + formatTime(row.tauSec) + " at " + row.windMs.toFixed(1) + " m/s.");
    bits.push("Isoplanatic angle θ0 = 0.314 cos(z) r0/h̄ is " + formatArcsec(row.theta0Arcsec) + " at " + (row.heightM / 1000).toFixed(2) + " km.");
    bits.push("Illustrative inputs, not a measurement of a night.");
    return bits.join(" ");
  }

  function limitsNote() {
    return "Educational calculator. A classroom schematic, not a forecast, not a site survey, and not an adaptive-optics design. The Fried parameter is typed at 500 nm and the zenith, then scaled as λ^(6/5) and (sec z)^(−3/5). Seeing is 0.98 λ/r0. Tokovinin’s formal factor is 0.981 and is not substituted. Rayleigh’s criterion is 1.22 λ/D. The star drawing is an Airy core beside a Gaussian of that seeing FWHM, on one angular scale. It is not a turbulence simulation. Site buttons are illustrative r0 values. Published medians are named beside them and are not loaded. Zenith angle stops at 70°. The plane-parallel sec(z) is the shortcut, not the Kasten and Young air mass.";
  }

  return {
    REF_NM: REF_NM,
    SEEING_FACTOR: SEEING_FACTOR,
    RAYLEIGH_FACTOR: RAYLEIGH_FACTOR,
    TIME_FACTOR: TIME_FACTOR,
    ISO_FACTOR: ISO_FACTOR,
    ARCSEC_PER_RAD: ARCSEC_PER_RAD,
    R0_CM_MIN: R0_CM_MIN,
    R0_CM_MAX: R0_CM_MAX,
    Z_DEG_MIN: Z_DEG_MIN,
    Z_DEG_MAX: Z_DEG_MAX,
    LAMBDA_NM_MIN: LAMBDA_NM_MIN,
    LAMBDA_NM_MAX: LAMBDA_NM_MAX,
    D_CM_MIN: D_CM_MIN,
    D_CM_MAX: D_CM_MAX,
    WIND_MIN: WIND_MIN,
    WIND_MAX: WIND_MAX,
    HEIGHT_M_MIN: HEIGHT_M_MIN,
    HEIGHT_M_MAX: HEIGHT_M_MAX,
    BANDS: BANDS,
    SITES: SITES,
    TELESCOPES: TELESCOPES,
    J1_ZERO: J1_ZERO,
    RAYLEIGH_EXACT: RAYLEIGH_EXACT,
    airmassPlane: airmassPlane,
    zenithFromAirmass: zenithFromAirmass,
    r0Meters: r0Meters,
    seeingArcsec: seeingArcsec,
    rayleighArcsec: rayleighArcsec,
    coherenceSeconds: coherenceSeconds,
    isoplanaticArcsec: isoplanaticArcsec,
    besselJ1: besselJ1,
    airyIntensity: airyIntensity,
    gaussianIntensity: gaussianIntensity,
    halfFieldArcsec: halfFieldArcsec,
    solve: solve,
    opening: opening,
    formatArcsec: formatArcsec,
    formatCm: formatCm,
    formatTime: formatTime,
    formatAirmass: formatAirmass,
    formatDeg: formatDeg,
    formatRatio: formatRatio,
    bandById: bandById,
    siteById: siteById,
    telescopeById: telescopeById,
    matchedBand: matchedBand,
    matchedSite: matchedSite,
    matchedTelescope: matchedTelescope,
    why: why,
    limitsNote: limitsNote
  };
});
