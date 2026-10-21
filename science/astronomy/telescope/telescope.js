/*! Telescope optics: focal ratio, magnification, exit pupil, true field,
    light grasp, Rayleigh's 1.22 λ/D, and Dawes's empirical limit.
    Classroom arithmetic. Not a buying guide and not a performance prediction.
    Sources for every constant are cited on the page. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Telescope = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* International inch. NIST SP 811, Appendix B.9: exactly 25.4 mm. */
  var INCH_MM = 25.4;

  /* Comparison pupil. Sky & Telescope's pupil primer states the traditional
     maximum, "7 millimeters," and warns that real pupils differ.
     Chuck Hawks, on Sky & Telescope, uses "about 7mm" the same way.
     This desk assumes 7 mm and says so. It is not a measurement of the reader. */
  var PUPIL_MM = 7;

  /* Conventional Rayleigh factor. The drawn Airy ring uses the first zero
     of J1; 1.22 is the rounding of that zero divided by π. */
  var RAYLEIGH_FACTOR = 1.22;

  /* Dawes, printed two ways.
     Tele Vue's formula table: 4.56 arcseconds / aperture in inches.
     4.56 × 25.4 = 115.824, which the millimetre form rounds to 116.
     The desk reports both. */
  var DAWES_PER_INCH = 4.56;
  var DAWES_PER_MM = 116;

  /* Bowen 1947, PASP 59: m = 6.5 + 2.5 log D + 2.5 log M,
     D in inches, for exit pupils from about 0.3 inch down to about 0.03 inch.
     The 6.5 is his constant. It is not the typed naked-eye limit. */
  var BOWEN_ZERO = 6.5;
  var BOWEN_EXIT_MAX_IN = 0.3;
  var BOWEN_EXIT_MIN_IN = 0.03;

  /* Rules of thumb, labeled as such on the page.
     Sky & Telescope's telescope calculator: 50× per inch, or twice the
     aperture in millimetres. Hawks, on Sky & Telescope: 50× per inch in
     excellent seeing, and about 30× per inch as his average-seeing maximum.
     50/25.4 = 1.9685, which that calculator prints as 2. */
  var RULE_PER_INCH = 50;
  var RULE_AVG_PER_INCH = 30;
  var RULE_PER_MM = 2;

  /* CIE 1931 photopic V(λ) peaks at 555 nm. CIE 1951 scotopic V'(λ) peaks
     at 507 nm. The desk's default is 550 nm, a round visual wavelength
     5 nm short of the photopic peak. 550 is not itself a measured constant. */
  var PHOTOPIC_PEAK_NM = 555;
  var SCOTOPIC_PEAK_NM = 507;
  var DEFAULT_LAMBDA_NM = 550;

  /* NASA Imagine the Universe: under ideal conditions, about 6.0 to 6.5.
     Sky & Telescope, Bortle class 9: limiting magnitude 4.0 or less.
     Defaults and sky buttons use those published edges. */
  var NELM_IDEAL_FAINT = 6.5;
  var NELM_IDEAL_BRIGHT = 6.0;
  var NELM_INNER_CITY = 4.0;

  /* Washington Double Star Catalog, VizieR B/wds, WDS 19307+2758,
     component STFA 43 AB: later separation 34.70 arcsec.
     Magnitudes on that row: 3.190 and 4.68. The drawing is two equal
     points at the separation. It does not paint those magnitudes. */
  var ALBIREO_SEP_ARCSEC = 34.70;
  var ALBIREO_MAG_1 = 3.190;
  var ALBIREO_MAG_2 = 4.68;

  /* Hubble. STScI primer: aperture 2.4 m, focal ratio f/24.
     Focal length used here is 24 × 2.4 m = 57.6 m.
     NASA "Hubble by the Numbers" prints 189 feet (56.7 m) for the focal
     length, and "40,000 times" the human eye. Those are their figures.
     Wavelength preset is 500 nm, the primer's 5000 Å FWHM line. */
  var HUBBLE_D_MM = 2400;
  var HUBBLE_F_MM = 57600;
  var HUBBLE_LAMBDA_NM = 500;
  var HUBBLE_NASA_LIGHT_TIMES = 40000;

  /* JWST. NASA fact sheet: diameter about 6.5 m, focal length 131.4 m,
     clear aperture 25 m², coverage 0.6–28.5 μm.
     The wavelength preset is 600 nm, the short edge of that coverage.
     STScI calls the design f/20 and the unobscured area 25.4 m².
     Those sentences stay on the page. This preset does not average them. */
  var JWST_D_MM = 6500;
  var JWST_F_MM = 131400;
  var JWST_LAMBDA_NM = 600;
  var JWST_CLEAR_M2 = 25;

  var ARCSEC_PER_RAD = (180 / Math.PI) * 3600;

  /* a_k in the large-argument expansion of J1. Computed from the product
     in Abramowitz and Stegun 9.2.5, not a pasted coefficient table.
     a_k = Π_{i=1..k} (4 − (2i−1)²) / (k! 8^k), a_0 = 1. */
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
    /* J1(x) ~ √(2/πx) [P cos χ − Q sin χ], χ = x − 3π/4.
       Six terms. Used only for the faint rings of a large aperture. */
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
    for (i = 0; i < 80; i++) {
      mid = (lo + hi) * 0.5;
      if (besselJ1(mid) > 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) * 0.5;
  }

  var J1_ZERO = firstJ1Zero();
  var RAYLEIGH_EXACT = J1_ZERO / Math.PI;

  function mmPerUnit(unit) {
    return unit === "in" ? INCH_MM : 1;
  }

  function toMm(value, unit) {
    return value * mmPerUnit(unit);
  }

  function fromMm(mm, unit) {
    return mm / mmPerUnit(unit);
  }

  function focalRatio(focalMm, apertureMm) {
    return focalMm / apertureMm;
  }

  function magnification(focalMm, eyeMm, barlow) {
    return (focalMm * barlow) / eyeMm;
  }

  function exitPupilMm(apertureMm, mag) {
    return apertureMm / mag;
  }

  /* Hawks / Sky & Telescope: apparent field ÷ magnification.
     Tele Vue calls the same division a rough approximation. */
  function trueFieldDeg(afovDeg, mag) {
    return afovDeg / mag;
  }

  function geometricGrasp(apertureMm, pupilMm) {
    var r = apertureMm / pupilMm;
    return r * r;
  }

  function graspFromArea(areaM2, pupilMm) {
    var radiusM = pupilMm / 2000;
    var pupilArea = Math.PI * radiusM * radiusM;
    return areaM2 / pupilArea;
  }

  function rayleighArcsec(lambdaNm, apertureMm) {
    var lambdaM = lambdaNm * 1e-9;
    var apertureM = apertureMm / 1000;
    return RAYLEIGH_FACTOR * lambdaM / apertureM * ARCSEC_PER_RAD;
  }

  function dawesMmArcsec(apertureMm) {
    return DAWES_PER_MM / apertureMm;
  }

  function dawesInchArcsec(apertureMm) {
    return DAWES_PER_INCH / (apertureMm / INCH_MM);
  }

  /* Wavelength where 1.22 λ/D equals 116/D_mm. D cancels. */
  function dawesRayleighCrossoverNm() {
    var lambdaM = DAWES_PER_MM / 1000 / (RAYLEIGH_FACTOR * ARCSEC_PER_RAD);
    return lambdaM * 1e9;
  }

  function ruleMinMag(apertureMm, pupilMm) {
    return apertureMm / pupilMm;
  }

  function ruleMaxPerInch(apertureMm) {
    return RULE_PER_INCH * (apertureMm / INCH_MM);
  }

  function ruleAvgPerInch(apertureMm) {
    return RULE_AVG_PER_INCH * (apertureMm / INCH_MM);
  }

  function ruleMaxPerMm(apertureMm) {
    return RULE_PER_MM * apertureMm;
  }

  function powerPerInch(mag, apertureMm) {
    return mag / (apertureMm / INCH_MM);
  }

  /* Point-source flux ratio turned into magnitudes.
     Δm = 2.5 log10(area ratio) = 5 log10(D / pupil).
     If the exit pupil is larger than the comparison pupil, the eye
     accepts only M × pupil of aperture. */
  function acceptedApertureMm(apertureMm, exitMm, pupilMm) {
    if (exitMm > pupilMm) return (apertureMm * pupilMm) / exitMm;
    return apertureMm;
  }

  function areaLimitMag(nelm, apertureMm, exitMm, pupilMm) {
    var used = acceptedApertureMm(apertureMm, exitMm, pupilMm);
    return nelm + 5 * Math.log(used / pupilMm) / Math.LN10;
  }

  function bowenLimitMag(apertureMm, mag) {
    var dIn = apertureMm / INCH_MM;
    return BOWEN_ZERO + 2.5 * Math.log(dIn) / Math.LN10 + 2.5 * Math.log(mag) / Math.LN10;
  }

  function bowenInRange(exitMm) {
    var eIn = exitMm / INCH_MM;
    return eIn >= BOWEN_EXIT_MIN_IN && eIn <= BOWEN_EXIT_MAX_IN;
  }

  function airyIntensity(thetaRad, lambdaNm, apertureMm) {
    var lambdaM = lambdaNm * 1e-9;
    var apertureM = apertureMm / 1000;
    if (!(apertureM > 0) || !(lambdaM > 0)) return 0;
    var k = Math.PI * apertureM * thetaRad / lambdaM;
    if (Math.abs(k) < 1e-8) return 1;
    var v = 2 * besselJ1(k) / k;
    return v * v;
  }

  /* Two equal point sources, centers separated by sepArcsec. */
  function pairIntensity(thetaRad, sepArcsec, lambdaNm, apertureMm) {
    var half = (sepArcsec / ARCSEC_PER_RAD) * 0.5;
    return airyIntensity(thetaRad - half, lambdaNm, apertureMm) +
      airyIntensity(thetaRad + half, lambdaNm, apertureMm);
  }

  function finitePositive(n) {
    return typeof n === "number" && isFinite(n) && n > 0;
  }

  function solve(spec) {
    var apertureMm = spec.apertureMm;
    var focalMm = spec.focalMm;
    var lambdaNm = spec.lambdaNm;
    var nelm = spec.nelm;
    var sepArcsec = spec.sepArcsec;
    var eyepiece = spec.eyepiece !== false;
    var eyeMm = spec.eyeMm;
    var afov = spec.afov;
    var barlow = spec.barlow;
    var pupilMm = spec.pupilMm > 0 ? spec.pupilMm : PUPIL_MM;
    if (!finitePositive(apertureMm) || !finitePositive(focalMm) || !finitePositive(lambdaNm)) {
      return { ok: false };
    }
    if (!isFinite(nelm) || !finitePositive(sepArcsec)) return { ok: false };
    if (eyepiece) {
      if (!finitePositive(eyeMm) || !finitePositive(afov) || !finitePositive(barlow)) {
        return { ok: false };
      }
    }
    var ratio = focalRatio(focalMm, apertureMm);
    var out = {
      ok: true,
      eyepiece: eyepiece,
      apertureMm: apertureMm,
      focalMm: focalMm,
      lambdaNm: lambdaNm,
      nelm: nelm,
      sepArcsec: sepArcsec,
      pupilMm: pupilMm,
      focalRatio: ratio,
      geometricGrasp: geometricGrasp(apertureMm, pupilMm),
      rayleighArcsec: rayleighArcsec(lambdaNm, apertureMm),
      dawesMmArcsec: dawesMmArcsec(apertureMm),
      dawesInchArcsec: dawesInchArcsec(apertureMm),
      ruleMin: ruleMinMag(apertureMm, pupilMm),
      ruleMaxInch: ruleMaxPerInch(apertureMm),
      ruleAvgInch: ruleAvgPerInch(apertureMm),
      ruleMaxMm: ruleMaxPerMm(apertureMm),
      crossoverNm: dawesRayleighCrossoverNm(),
      clearGrasp: spec.clearAreaM2 > 0 ? graspFromArea(spec.clearAreaM2, pupilMm) : null
    };
    if (!eyepiece) {
      out.magnification = null;
      out.exitPupilMm = null;
      out.effectiveFocalRatio = null;
      out.trueFieldDeg = null;
      out.powerPerInch = null;
      out.acceptedApertureMm = null;
      out.acceptedGrasp = null;
      out.graspClipped = false;
      out.areaLimit = null;
      out.bowenLimit = null;
      out.bowenInRange = false;
      return out;
    }
    var mag = magnification(focalMm, eyeMm, barlow);
    var exitMm = exitPupilMm(apertureMm, mag);
    var accepted = acceptedApertureMm(apertureMm, exitMm, pupilMm);
    out.eyeMm = eyeMm;
    out.afov = afov;
    out.barlow = barlow;
    out.magnification = mag;
    out.exitPupilMm = exitMm;
    out.effectiveFocalRatio = ratio * barlow;
    out.trueFieldDeg = trueFieldDeg(afov, mag);
    out.powerPerInch = powerPerInch(mag, apertureMm);
    out.acceptedApertureMm = accepted;
    out.acceptedGrasp = geometricGrasp(accepted, pupilMm);
    out.graspClipped = exitMm > pupilMm;
    out.areaLimit = areaLimitMag(nelm, apertureMm, exitMm, pupilMm);
    out.bowenLimit = bowenLimitMag(apertureMm, mag);
    out.bowenInRange = bowenInRange(exitMm);
    return out;
  }

  function presets() {
    return [
      {
        id: "bino-7x50",
        kind: "classroom",
        name: "7×50 binocular",
        tier: "Classroom · not a catalog model",
        eyepiece: true,
        apertureMm: 50,
        focalMm: 175,
        eyeMm: 25,
        afov: 50,
        barlow: 1,
        lambdaNm: DEFAULT_LAMBDA_NM,
        note: "Round numbers chosen so the magnification is 7 and the aperture is 50 mm: focal length 175 mm, eyepiece 25 mm. The 50° apparent field is the round Plössl example in the Sky & Telescope formulas article, typed in here, not a measurement of a binocular."
      },
      {
        id: "refractor-80",
        kind: "classroom",
        name: "80 mm refractor",
        tier: "Classroom · not a catalog model",
        eyepiece: true,
        apertureMm: 80,
        focalMm: 560,
        eyeMm: 20,
        afov: 50,
        barlow: 1,
        lambdaNm: DEFAULT_LAMBDA_NM,
        note: "Round numbers: aperture 80 mm, focal length 560 mm, so the objective is f/7 by the definition, and a 20 mm eyepiece. Not a manufacturer’s tube."
      },
      {
        id: "dob-200",
        kind: "classroom",
        name: "200 mm f/6",
        tier: "Classroom · not a catalog model",
        eyepiece: true,
        apertureMm: 200,
        focalMm: 1200,
        eyeMm: 25,
        afov: 50,
        barlow: 1,
        lambdaNm: DEFAULT_LAMBDA_NM,
        note: "Round numbers for the size class often mounted as a Dobsonian: aperture 200 mm, focal length 1200 mm, so the mirror is f/6, and a 25 mm eyepiece. Not a measured tube. No secondary obstruction is applied."
      },
      {
        id: "hubble",
        kind: "cited",
        name: "Hubble",
        tier: "Cited · no eyepiece",
        eyepiece: false,
        apertureMm: HUBBLE_D_MM,
        focalMm: HUBBLE_F_MM,
        lambdaNm: HUBBLE_LAMBDA_NM,
        note: "Aperture 2.4 m and focal ratio f/24 from the STScI primer, so the focal length entered here is 57.6 m. NASA’s numbers page prints the focal length as 189 feet (56.7 m) and says the mirror collects 40,000 times as much light as the human eye. Wavelength is set to 500 nm, the primer’s 5000 Å line. Hubble is not an eyepiece telescope."
      },
      {
        id: "jwst",
        kind: "cited",
        name: "JWST",
        tier: "Cited · no eyepiece",
        eyepiece: false,
        apertureMm: JWST_D_MM,
        focalMm: JWST_F_MM,
        lambdaNm: JWST_LAMBDA_NM,
        clearAreaM2: JWST_CLEAR_M2,
        note: "NASA’s fact sheet: primary about 6.5 m, focal length 131.4 m, clear aperture 25 m², coverage 0.6–28.5 μm. Wavelength is set to 600 nm, the short edge of that window. STScI describes the design as f/20 and the unobscured area as 25.4 m². The mirror is 18 hexagonal segments, not a filled disk. JWST is not an eyepiece telescope."
      }
    ];
  }

  function presetById(id) {
    var list = presets();
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function trimNum(s, digits) {
    var t = Number(s).toFixed(digits);
    return t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function formatFocalRatio(f) {
    if (!isFinite(f)) return "—";
    if (Math.abs(f - Math.round(f)) < 0.005) return "f/" + String(Math.round(f));
    return "f/" + f.toFixed(2);
  }

  function formatMag(m) {
    if (m == null || !isFinite(m)) return "—";
    if (Math.abs(m - Math.round(m)) < 0.005) return String(Math.round(m)) + "×";
    return m.toFixed(2) + "×";
  }

  function formatMm(mm) {
    if (mm == null || !isFinite(mm)) return "—";
    var ax = Math.abs(mm);
    if (ax >= 1000) return trimNum(mm.toFixed(0), 0) + " mm";
    if (ax >= 100) return trimNum(mm.toFixed(1), 1) + " mm";
    return mm.toFixed(2) + " mm";
  }

  function formatArcsec(a) {
    if (a == null || !isFinite(a)) return "—";
    var ax = Math.abs(a);
    var d = ax >= 10 ? 2 : 3;
    return a.toFixed(d) + "″";
  }

  function formatDeg(d) {
    if (d == null || !isFinite(d)) return "—";
    var ax = Math.abs(d);
    if (ax >= 10) return d.toFixed(2) + "°";
    return d.toFixed(3) + "°";
  }

  function formatArcmin(d) {
    if (d == null || !isFinite(d)) return "—";
    return (d * 60).toFixed(1) + "′";
  }

  function groupInt(n) {
    var sign = n < 0 ? "-" : "";
    var s = String(Math.abs(Math.round(n)));
    return sign + s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatGrasp(g) {
    if (g == null || !isFinite(g)) return "—";
    if (g >= 100) return groupInt(g) + "×";
    return g.toFixed(1) + "×";
  }

  function formatLim(m) {
    if (m == null || !isFinite(m)) return "—";
    return m.toFixed(2);
  }

  function formatNm(nm) {
    if (!isFinite(nm)) return "—";
    if (Math.abs(nm - Math.round(nm)) < 0.05) return String(Math.round(nm)) + " nm";
    return nm.toFixed(1) + " nm";
  }

  function formatPower(p) {
    if (p == null || !isFinite(p)) return "—";
    return p.toFixed(1) + "× per inch";
  }

  function inputString(mm, unit) {
    var v = fromMm(mm, unit);
    if (unit === "in") {
      var ax = Math.abs(v);
      if (ax >= 100) return trimNum(v.toFixed(2), 2);
      return trimNum(v.toFixed(4), 4);
    }
    if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
    return trimNum(v.toFixed(3), 3);
  }

  return {
    INCH_MM: INCH_MM,
    PUPIL_MM: PUPIL_MM,
    RAYLEIGH_FACTOR: RAYLEIGH_FACTOR,
    DAWES_PER_INCH: DAWES_PER_INCH,
    DAWES_PER_MM: DAWES_PER_MM,
    BOWEN_ZERO: BOWEN_ZERO,
    BOWEN_EXIT_MAX_IN: BOWEN_EXIT_MAX_IN,
    BOWEN_EXIT_MIN_IN: BOWEN_EXIT_MIN_IN,
    RULE_PER_INCH: RULE_PER_INCH,
    RULE_AVG_PER_INCH: RULE_AVG_PER_INCH,
    RULE_PER_MM: RULE_PER_MM,
    PHOTOPIC_PEAK_NM: PHOTOPIC_PEAK_NM,
    SCOTOPIC_PEAK_NM: SCOTOPIC_PEAK_NM,
    DEFAULT_LAMBDA_NM: DEFAULT_LAMBDA_NM,
    NELM_IDEAL_FAINT: NELM_IDEAL_FAINT,
    NELM_IDEAL_BRIGHT: NELM_IDEAL_BRIGHT,
    NELM_INNER_CITY: NELM_INNER_CITY,
    ALBIREO_SEP_ARCSEC: ALBIREO_SEP_ARCSEC,
    ALBIREO_MAG_1: ALBIREO_MAG_1,
    ALBIREO_MAG_2: ALBIREO_MAG_2,
    HUBBLE_D_MM: HUBBLE_D_MM,
    HUBBLE_F_MM: HUBBLE_F_MM,
    HUBBLE_LAMBDA_NM: HUBBLE_LAMBDA_NM,
    HUBBLE_NASA_LIGHT_TIMES: HUBBLE_NASA_LIGHT_TIMES,
    JWST_D_MM: JWST_D_MM,
    JWST_F_MM: JWST_F_MM,
    JWST_LAMBDA_NM: JWST_LAMBDA_NM,
    JWST_CLEAR_M2: JWST_CLEAR_M2,
    ARCSEC_PER_RAD: ARCSEC_PER_RAD,
    J1_ZERO: J1_ZERO,
    RAYLEIGH_EXACT: RAYLEIGH_EXACT,
    besselJ1: besselJ1,
    toMm: toMm,
    fromMm: fromMm,
    focalRatio: focalRatio,
    magnification: magnification,
    exitPupilMm: exitPupilMm,
    trueFieldDeg: trueFieldDeg,
    geometricGrasp: geometricGrasp,
    graspFromArea: graspFromArea,
    rayleighArcsec: rayleighArcsec,
    dawesMmArcsec: dawesMmArcsec,
    dawesInchArcsec: dawesInchArcsec,
    dawesRayleighCrossoverNm: dawesRayleighCrossoverNm,
    ruleMinMag: ruleMinMag,
    ruleMaxPerInch: ruleMaxPerInch,
    ruleAvgPerInch: ruleAvgPerInch,
    ruleMaxPerMm: ruleMaxPerMm,
    powerPerInch: powerPerInch,
    acceptedApertureMm: acceptedApertureMm,
    areaLimitMag: areaLimitMag,
    bowenLimitMag: bowenLimitMag,
    bowenInRange: bowenInRange,
    airyIntensity: airyIntensity,
    pairIntensity: pairIntensity,
    solve: solve,
    presets: presets,
    presetById: presetById,
    formatFocalRatio: formatFocalRatio,
    formatMag: formatMag,
    formatMm: formatMm,
    formatArcsec: formatArcsec,
    formatDeg: formatDeg,
    formatArcmin: formatArcmin,
    formatGrasp: formatGrasp,
    formatLim: formatLim,
    formatNm: formatNm,
    formatPower: formatPower,
    inputString: inputString
  };
});
