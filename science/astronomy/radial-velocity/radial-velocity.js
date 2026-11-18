/*! Stellar radial-velocity semi-amplitude.

    K = (2πG/P)^(1/3) · m_p sin i / (M* + m_p)^(2/3) / sqrt(1 − e²)

    G is the NIST 2022 CODATA central value, 6.67430 × 10^−11.
    A solar mass, an Earth mass, and a Jupiter mass are the NASA
    NSSDCA fact-sheet masses. The sheet’s GM is not substituted.
    A day in P is 86,400 seconds. An AU, when a is reported, is
    the IAU 2012 exact length.

    For e > 0 the curve solves Kepler’s equation, M = E − e sin E,
    then v = K [cos(ν + ω) + e cos ω]. Positive v is recession
    (redshift). Phase 0 is periastron.

    Not a measured orbit and not a detection. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.RadialVelocity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* NIST 2022 CODATA. Standard uncertainty 0.00015 × 10^−11.
     The same central value the density desk multiplies by a printed mass. */
  var G = 6.67430e-11;

  /* Sun Fact Sheet, 1,988,400 × 10^24 kg. The printed Sun/Earth ratio
     332,900 is not this unit. */
  var SUN_MASS_KG = 1988400 * 1e24;
  /* Earth Fact Sheet, 5.9722 × 10^24 kg. */
  var EARTH_MASS_KG = 5.9722 * 1e24;
  /* Jupiter Fact Sheet, 1,898.13 × 10^24 kg. */
  var JUPITER_MASS_KG = 1898.13 * 1e24;

  /* IAU 2012 Resolution B2. Reporting a in AU only. */
  var AU_M = 149597870700;
  var DAY_S = 86400;

  /* ESO HARPS overview: about 1 m/s RMS for a stated class of star.
     ESO ESPRESSO overview: a requirement below 10 cm/s in one mode.
     Comparison figures, not detection thresholds. */
  var HARPS_ABOUT_MS = 1;
  var ESPRESSO_REQUIREMENT_MS = 0.1;

  var M_STAR_MIN = 0.05;
  var M_STAR_MAX = 5;
  var MP_EARTH_MIN = 0.01;
  var MP_EARTH_MAX = 10000;
  var P_MIN = 0.2;
  var P_MAX = 30000;
  var E_MAX = 0.9;
  var I_MAX = 90;
  var SLIDER_STEPS = 1000;

  function planetMassKg(mp, unit) {
    return mp * (unit === "jupiter" ? JUPITER_MASS_KG : EARTH_MASS_KG);
  }

  function massRange(unit) {
    var scale = unit === "jupiter" ? EARTH_MASS_KG / JUPITER_MASS_KG : 1;
    return { min: MP_EARTH_MIN * scale, max: MP_EARTH_MAX * scale };
  }

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function wrapPi(angle) {
    var x = angle % (2 * Math.PI);
    if (x > Math.PI) x -= 2 * Math.PI;
    if (x < -Math.PI) x += 2 * Math.PI;
    return x;
  }

  /* Newton on M = E − e sin E. e is capped by the desk at 0.9. */
  function eccentricFromMean(meanAnomaly, e) {
    if (!(e > 0)) return meanAnomaly;
    var M = wrapPi(meanAnomaly);
    var E = e < 0.8 ? M : Math.PI;
    var n;
    for (n = 0; n < 60; n++) {
      var f = E - e * Math.sin(E) - M;
      var fp = 1 - e * Math.cos(E);
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
    if (denom === 0) return Math.atan2(0, cosE - e);
    var cosf = (cosE - e) / denom;
    var sinf = Math.sqrt(Math.max(0, 1 - e * e)) * sinE / denom;
    return Math.atan2(sinf, cosf);
  }

  /* K in m/s. Masses in kilograms. periodS in seconds. inclRad from the sky. */
  function semiAmplitude(periodS, mpKg, mStarKg, inclRad, e) {
    if (!(periodS > 0) || !(mpKg > 0) || !(mStarKg > 0)) return NaN;
    if (!(e >= 0) || e >= 1) return NaN;
    var total = mStarKg + mpKg;
    var root = Math.sqrt(1 - e * e);
    if (!(root > 0)) return NaN;
    return Math.pow((2 * Math.PI * G) / periodS, 1 / 3) * mpKg * Math.sin(inclRad) / Math.pow(total, 2 / 3) / root;
  }

  /* Relative semimajor axis, meters, from P and the two masses. */
  function axisMeters(periodS, mStarKg, mpKg) {
    var total = mStarKg + mpKg;
    return Math.cbrt((G * total * periodS * periodS) / (4 * Math.PI * Math.PI));
  }

  /* v = K [cos(ν + ω) + e cos ω]. ω and the anomalies are radians. */
  function radialVelocity(k, e, omegaRad, meanAnomaly) {
    var E = eccentricFromMean(meanAnomaly, e);
    var nu = trueAnomaly(E, e);
    return k * (Math.cos(nu + omegaRad) + e * Math.cos(omegaRad));
  }

  /* Star about the barycenter, focus at the origin, planet periastron on +x.
     The star sits on the opposite side. E is the eccentric anomaly. */
  function starOffset(aStarM, e, E) {
    var b = aStarM * Math.sqrt(Math.max(0, 1 - e * e));
    return {
      x: -aStarM * (Math.cos(E) - e),
      y: -b * Math.sin(E)
    };
  }

  function series(k, e, omegaDeg, orbits, count) {
    var out = [];
    var n = count > 2 ? count : 2;
    var laps = orbits === 1 ? 1 : 2;
    var om = omegaDeg * Math.PI / 180;
    var i;
    for (i = 0; i <= n; i++) {
      var phase = laps * i / n;
      var M = phase * 2 * Math.PI;
      out.push({ phase: phase, v: radialVelocity(k, e, om, M) });
    }
    return out;
  }

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

  function trimZeros(s) {
    return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function formatMs(ms) {
    if (!isFinite(ms)) return "";
    var digits = Math.abs(ms) >= 10 ? 2 : 4;
    return trimZeros(fixed(ms, digits)) + " m/s";
  }

  function formatCm(ms) {
    if (!isFinite(ms)) return "";
    return fixed(ms * 100, 2) + " cm/s";
  }

  function formatAu(au) {
    if (!isFinite(au)) return "";
    return fixed(au, 6) + " AU";
  }

  function formatKm(km) {
    if (!isFinite(km)) return "";
    var digits = Math.abs(km) >= 100 ? 1 : 3;
    return fixed(km, digits) + " km";
  }

  function formatMass(m) {
    if (!isFinite(m)) return "";
    var a = Math.abs(m);
    var digits = 4;
    if (a >= 100) digits = 1;
    else if (a >= 10) digits = 2;
    else if (a >= 1) digits = 3;
    var scaled = Math.round((a + 1e-12) * Math.pow(10, digits)) / Math.pow(10, digits);
    var s = scaled.toFixed(digits);
    return trimZeros(s);
  }

  function formatDeg(d) {
    if (!isFinite(d)) return "";
    var a = Math.abs(d);
    if (a >= 10) return fixed(d, 2);
    return fixed(d, 4);
  }

  function logMap(t, min, max) {
    var u = t < 0 ? 0 : (t > 1 ? 1 : t);
    return min * Math.pow(max / min, u);
  }

  function logUnmap(v, min, max) {
    if (!(v > 0) || !(min > 0) || !(max > min)) return 0;
    var t = Math.log(v / min) / Math.log(max / min);
    if (t < 0) return 0;
    if (t > 1) return 1;
    return t;
  }

  function instrumentNote(kMs) {
    var ratio = formatMs(kMs / HARPS_ABOUT_MS).replace(" m/s", "");
    var size = formatMs(kMs);
    var harps = kMs >= HARPS_ABOUT_MS
      ? "This K, " + size + ", is " + ratio + " times the about 1 m/s figure on that page."
      : "This K, " + size + " (" + formatCm(kMs) + "), is under the about 1 m/s figure on that page. The ratio to that figure is " + ratio + ".";
    var espresso = kMs > ESPRESSO_REQUIREMENT_MS
      ? "This K is above 10 cm/s."
      : (kMs < ESPRESSO_REQUIREMENT_MS ? "This K is under 10 cm/s." : "This K is 10 cm/s.");
    return "ESO’s HARPS overview says the instrument is built for a long-term radial-velocity accuracy on the order of 1 m/s, and that a global accuracy of about 1 m/s RMS is achieved for spectral types later than G and v sin i under 2 km/s. " + harps + " ESO’s ESPRESSO overview lists a radial-velocity precision requirement below 10 cm/s for the 1-UT high-resolution mode. " + espresso + " Those sentences are the instrument pages. They are not a noise model for this star, and they are not a detection threshold.";
  }

  var PRESETS = [
    {
      id: "sun-jupiter",
      name: "Sun–Jupiter",
      tier: "Sun sheet and Jupiter sheet · edge-on",
      mStar: 1,
      mp: 1,
      unit: "jupiter",
      periodDays: 4332.589,
      periodLabel: "4,332.589 days",
      e: 0.0487,
      eLabel: "0.0487",
      inclDeg: 90,
      omegaDeg: 90,
      citedK: null,
      note: "The Sun sheet’s mass is 1,988,400 × 10^24 kg. The Jupiter sheet’s mass is 1,898.13 × 10^24 kg. The sidereal orbit period is 4,332.589 days. The orbit eccentricity is 0.0487. The sheet’s orbit inclination, 1.304°, is to the ecliptic. This preset uses 90°, an external edge-on line of sight. 1.304° is not substituted. The sheet does not print an external observer’s argument of periastron. The slider starts at 90°. The sheet’s GM, 126.687 × 10^6 km³/s² for Jupiter and 132,712 × 10^6 km³/s² for the Sun, is not substituted. G times the printed mass is a different product."
    },
    {
      id: "sun-earth",
      name: "Sun–Earth",
      tier: "Sun sheet and Earth sheet · edge-on",
      mStar: 1,
      mp: 1,
      unit: "earth",
      periodDays: 365.256,
      periodLabel: "365.256 days",
      e: 0.0167,
      eLabel: "0.0167",
      inclDeg: 90,
      omegaDeg: 90,
      citedK: null,
      note: "The Sun sheet’s mass is 1,988,400 × 10^24 kg. The Earth sheet’s mass is 5.9722 × 10^24 kg. The sidereal orbit period is 365.256 days. The orbit eccentricity is 0.0167. The Earth sheet’s orbit inclination is 0.000° to its own ecliptic. This preset uses 90°, an external edge-on line of sight. 0.000° is not substituted. The sheet does not print an external observer’s argument of periastron. The slider starts at 90°. The sheet’s GM is not substituted."
    },
    {
      id: "51-peg-b",
      name: "51 Pegasi b",
      tier: "51 Peg b · NASA Exoplanet Archive",
      mStar: 1.07,
      mp: 0.61,
      unit: "jupiter",
      periodDays: 4.2307966,
      periodLabel: "4.2307966 days",
      e: 0.0063,
      eLabel: "0.0063",
      inclDeg: 49.8,
      omegaDeg: 0,
      citedK: 55.77,
      citedKLabel: "55.77 ± 0.15 m/s",
      note: "NASA Exoplanet Archive PSCompPars, the default composite row for 51 Peg b, cited there to Cont et al. 2026. Central values: M* = 1.07 ± 0.05 M☉, Mp = 0.61 (+0.06, −0.05) MJup, P = 4.2307966 ± 0.0000027 days, e = 0.0063, i = 49.8 (+5.8, −5.7)°, stellar K = 55.77 ± 0.15 m/s. The row’s longitude of periastron is 0.0°. pl_bmassprov is Mass. Discovery method Radial Velocity, 1995. A Jupiter mass on this desk is the Jupiter sheet. A solar mass is the Sun sheet. The paper’s own solar mass and Jupiter mass are not substituted."
    },
    {
      id: "proxima-b",
      name: "Proxima Centauri b",
      tier: "Proxima Cen b · minimum mass",
      mStar: 0.1221,
      mp: 1.055,
      unit: "earth",
      periodDays: 11.18465,
      periodLabel: "11.18465 days",
      e: 0,
      eLabel: "0.0",
      inclDeg: 90,
      omegaDeg: 3.3,
      citedK: 1.226,
      citedKLabel: "1.226 ± 0.062 m/s",
      minimumMass: true,
      note: "NASA Exoplanet Archive PSCompPars, the default composite row for Proxima Cen b, cited there to Suárez Mascareño et al. 2025. Central values: M* = 0.1221 ± 0.0022 M☉, pl_bmasse = 1.055 ± 0.055 M⊕, P = 11.18465 ± 0.00053 days, e = 0.0, stellar K = 1.226 ± 0.062 m/s. pl_bmassprov is Msini. pl_orbincl is null. This preset sets i = 90° so sin i = 1 and the typed mass is that minimum mass. 90° is not a measured inclination. The true mass is larger if the orbit is not edge-on. The row’s longitude of periastron is 3.3 ± 1.8°. With e = 0 that angle does not change the shape. It slides the phase. Discovery method Radial Velocity, 2016."
    },
    {
      id: "gj-436-b",
      name: "GJ 436 b",
      tier: "GJ 436 b · NASA Exoplanet Archive",
      mStar: 0.47,
      mp: 22.1,
      unit: "earth",
      periodDays: 2.64388312,
      periodLabel: "2.64388312 days",
      e: 0.13827,
      eLabel: "0.13827",
      inclDeg: 86.44,
      omegaDeg: 351,
      citedK: 17.09,
      citedKLabel: "17.09 ± 0.22 m/s",
      note: "NASA Exoplanet Archive PSCompPars, the default composite row for GJ 436 b, cited there to Maciejewski et al. 2014. Central values: M* = 0.47 ± 0.07 M☉, Mp = 22.1 ± 2.3 M⊕, P = 2.64388312 ± 0.00000057 days, e = 0.13827 ± 0.00018, i = 86.44 (+0.17, −0.16)°, stellar K = 17.09 ± 0.22 m/s. The row’s longitude of periastron is 351.0 ± 0.03°. This desk uses that angle as ω. The same row’s Jupiter-mass column is 0.07 ± 0.007 MJup. This preset uses 22.1 M⊕. pl_bmassprov is Mass. Discovery method Radial Velocity, 2004."
    }
  ];

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function unitName(unit) {
    return unit === "jupiter" ? "MJup" : "M⊕";
  }

  function disclaimer() {
    return "Classroom Doppler model, not a measured orbit and not a detection.";
  }

  function solve(spec) {
    spec = spec || {};
    var unit = spec.unit === "jupiter" ? "jupiter" : "earth";
    var mStar = spec.mStar;
    var mp = spec.mp;
    var periodDays = spec.periodDays;
    var e = spec.e;
    var inclDeg = spec.inclDeg;
    var omegaDeg = spec.omegaDeg;
    if (!finite(mStar) || !finite(mp) || !finite(periodDays) || !finite(e) || !finite(inclDeg) || !finite(omegaDeg)) {
      return { ok: false };
    }
    if (!(mStar > 0) || !(mp > 0) || !(periodDays > 0) || e < 0 || e > E_MAX) return { ok: false };
    if (inclDeg < 0 || inclDeg > I_MAX) return { ok: false };
    var mStarKg = mStar * SUN_MASS_KG;
    var mpKg = planetMassKg(mp, unit);
    var periodS = periodDays * DAY_S;
    var inclRad = inclDeg * Math.PI / 180;
    var k = semiAmplitude(periodS, mpKg, mStarKg, inclRad, e);
    if (!isFinite(k)) return { ok: false };
    var a = axisMeters(periodS, mStarKg, mpKg);
    var aStar = a * mpKg / (mStarKg + mpKg);
    var mSinI = mp * Math.sin(inclRad);
    var k0 = semiAmplitude(periodS, mpKg, mStarKg, inclRad, 0);
    return {
      ok: true,
      unit: unit,
      mStar: mStar,
      mp: mp,
      mStarKg: mStarKg,
      mpKg: mpKg,
      periodDays: periodDays,
      periodS: periodS,
      e: e,
      inclDeg: inclDeg,
      omegaDeg: omegaDeg,
      kMs: k,
      kCircular: k0,
      mSinI: mSinI,
      axisM: a,
      axisAU: a / AU_M,
      aStarM: aStar,
      aStarKm: aStar / 1000,
      kText: formatMs(k),
      kCircularText: formatMs(k0),
      cmText: formatCm(k),
      mSinIText: formatMass(mSinI) + " " + unitName(unit),
      axisText: formatAu(a / AU_M),
      aStarText: formatKm(aStar / 1000),
      periodText: periodDays >= 1000 ? fixed(periodDays, 3) + " days" : String(periodDays) + " days"
    };
  }

  function citedDecimals(target) {
    var s = String(target);
    var dot = s.indexOf(".");
    return dot < 0 ? 0 : s.length - dot - 1;
  }

  function citedSentence(row, solved) {
    if (row.citedK == null) return "";
    var digits = citedDecimals(row.citedK);
    var names = ["zero", "one", "two", "three", "four", "five", "six"];
    var place = (names[digits] || String(digits)) + (digits === 1 ? " decimal" : " decimals");
    var rounded = trimZeros(fixed(solved.kMs, digits)) + " m/s";
    var listed = formatMs(row.citedK);
    var tail = rounded === listed
      ? solved.kText + " rounds to " + listed + " at " + place + ", the listed central value. They are not averaged."
      : solved.kText + " does not round to the listed central value " + listed + ". They are not averaged.";
    return "The archive lists a stellar K of " + row.citedKLabel + ". This arithmetic is " + solved.kText + ". " + tail + " ";
  }

  function whyPreset(row, solved) {
    var open = "K = (2πG/P)^(1/3) · m_p sin i / (M* + m_p)^(2/3) / √(1−e²). G is the 2022 CODATA central value, 6.67430 × 10^−11 m³ kg^−1 s^−2. ";
    var nums = "At these central values the arithmetic is " + solved.kText + ". ";
    if (Math.abs(solved.kMs) < 1) nums += "That is " + solved.cmText + ". ";
    nums += "The formula’s m sin i is " + solved.mSinIText + ". ";
    nums += "The relative semimajor axis from this period and these masses is " + solved.axisText + ". The star’s barycentric semimajor axis is " + solved.aStarText + ". ";
    if (solved.kText === solved.kCircularText) {
      nums += "The unrounded value is " + fixed(solved.kMs, 6) + " m/s. With e set to 0 it is " + fixed(solved.kCircular, 6) + " m/s. Both print as " + solved.kText + ". They are not averaged. ";
    } else {
      nums += "With e set to 0 the same masses, period, and inclination give " + solved.kCircularText + ". ";
    }
    if (row.id === "sun-jupiter") {
      nums += "A familiar round figure is about 12.5 m/s. " + solved.kText + " does not round to 12.5. They are not averaged. The barycenter desk’s Sun–Jupiter length, from the sheet separation 778.479 × 10^6 km, is 742,428.6 km. This length, from the period, prints " + solved.aStarText + ". They are not averaged. ";
    }
    if (row.id === "sun-earth") {
      nums += "A familiar round figure is about 0.09 m/s. " + solved.kText + " rounds to 0.09 at two decimals. The unrounded star axis is " + fixed(solved.aStarKm, 3) + " km, which prints as " + solved.aStarText + ". The barycenter desk’s Sun–Earth length, from 149.598 × 10^6 km, also prints 449.3 km. That desk uses the sheet separation. This desk uses the period. They are not averaged. ";
    }
    if (row.minimumMass) {
      nums += "The typed mass is a minimum mass. ";
    }
    return open + row.note + " " + nums + citedSentence(row, solved) + disclaimer();
  }

  function whyCustom(solved) {
    var open = "K = (2πG/P)^(1/3) · m_p sin i / (M* + m_p)^(2/3) / √(1−e²). The boxes are not a fact sheet and not an archive row. ";
    var g = "G is the 2022 CODATA central value, 6.67430 × 10^−11 m³ kg^−1 s^−2. A solar mass is the Sun sheet’s 1,988,400 × 10^24 kg. An Earth mass is the Earth sheet’s 5.9722 × 10^24 kg. A Jupiter mass is the Jupiter sheet’s 1,898.13 × 10^24 kg. The sheet’s GM is not substituted. ";
    var nums = "At M* = " + formatMass(solved.mStar) + " M☉, m_p = " + formatMass(solved.mp) + " " + unitName(solved.unit) + ", P = " + solved.periodText + ", e = " + String(solved.e) + ", and i = " + String(solved.inclDeg) + "°, the arithmetic is " + solved.kText + ". ";
    nums += "The formula’s m sin i is " + solved.mSinIText + ". The relative semimajor axis is " + solved.axisText + ". The star’s barycentric semimajor axis is " + solved.aStarText + ". ";
    return open + g + nums + disclaimer();
  }

  function model(spec) {
    var row = spec && spec.preset ? presetById(spec.preset) : null;
    var input = row ? {
      mStar: row.mStar,
      mp: row.mp,
      unit: row.unit,
      periodDays: row.periodDays,
      e: row.e,
      inclDeg: row.inclDeg,
      omegaDeg: row.omegaDeg
    } : spec;
    var solved = solve(input);
    if (!solved.ok) return solved;
    var why = row ? whyPreset(row, solved) : whyCustom(solved);
    solved.preset = row ? row.id : null;
    solved.name = row ? row.name : "Custom";
    solved.tier = row ? row.tier : "Sliders · not a catalog row";
    solved.why = why;
    solved.detect = instrumentNote(solved.kMs);
    solved.range = solved.kText + " · m sin i " + solved.mSinIText;
    solved.aria = solved.name + ". Radial-velocity semi-amplitude " + solved.kText + ". m sin i is " + solved.mSinIText + ". Not a detection.";
    solved.stats = [
      ["K", solved.kText],
      ["m sin i", solved.mSinIText],
      ["Star mass", formatMass(solved.mStar) + " M☉"],
      ["Planet mass", formatMass(solved.mp) + " " + unitName(solved.unit)],
      ["Period", row ? row.periodLabel : solved.periodText],
      ["Eccentricity", row ? row.eLabel : String(solved.e)],
      ["Inclination", String(solved.inclDeg) + "°"],
      ["ω", String(solved.omegaDeg) + "°"],
      ["Relative a", solved.axisText],
      ["Star a", solved.aStarText]
    ];
    if (row && row.citedKLabel) solved.stats.push(["Archive K", row.citedKLabel]);
    return solved;
  }

  return {
    G: G,
    SUN_MASS_KG: SUN_MASS_KG,
    EARTH_MASS_KG: EARTH_MASS_KG,
    JUPITER_MASS_KG: JUPITER_MASS_KG,
    AU_M: AU_M,
    DAY_S: DAY_S,
    HARPS_ABOUT_MS: HARPS_ABOUT_MS,
    ESPRESSO_REQUIREMENT_MS: ESPRESSO_REQUIREMENT_MS,
    M_STAR_MIN: M_STAR_MIN,
    M_STAR_MAX: M_STAR_MAX,
    MP_EARTH_MIN: MP_EARTH_MIN,
    MP_EARTH_MAX: MP_EARTH_MAX,
    P_MIN: P_MIN,
    P_MAX: P_MAX,
    E_MAX: E_MAX,
    I_MAX: I_MAX,
    SLIDER_STEPS: SLIDER_STEPS,
    planetMassKg: planetMassKg,
    massRange: massRange,
    clamp: clamp,
    eccentricFromMean: eccentricFromMean,
    trueAnomaly: trueAnomaly,
    semiAmplitude: semiAmplitude,
    axisMeters: axisMeters,
    radialVelocity: radialVelocity,
    starOffset: starOffset,
    series: series,
    formatMs: formatMs,
    formatCm: formatCm,
    formatAu: formatAu,
    formatKm: formatKm,
    formatMass: formatMass,
    formatDeg: formatDeg,
    logMap: logMap,
    logUnmap: logUnmap,
    instrumentNote: instrumentNote,
    PRESETS: PRESETS,
    presetById: presetById,
    solve: solve,
    model: model
  };
});
