/*! Magnetic-dipole spin-down for a radio pulsar. Classroom model.

    Period P is in seconds. Period derivative Ṗ is dimensionless (s/s).
    Braking index n = 3, the dipole. Characteristic age assumes the star
    was born spinning much faster than it spins now:
      τ = P / ((n − 1) Ṗ) = P / (2 Ṗ)

    Surface dipole field, the ATNF BSURF convention:
      B = 3.2×10^19 √(P Ṗ) gauss
    with the canonical moment of inertia I = 10^45 g cm² = 10^38 kg m²
    and a radius of 10 km. The 3.2 has two figures. It is half of the
    polar field in Harding’s equation (5), B_p = 6.4×10^19 √(P Ṗ) G,
    because a dipole’s polar field is twice the equatorial field.

    Spin-down luminosity, the rotational energy-loss rate:
      Ė = 4 π² I Ṗ / P³
    I in kg m² gives watts. 1 W = 10^7 erg/s. The ATNF EDOT column is
    that power in erg/s, rounded.

    Light-cylinder radius, where a co-rotating field would move at c:
      R_lc = c P / (2 π)
    c = 299792458 m/s exactly.

    Preset P and Ṗ are P0 and P1 printed by the ATNF Pulsar Catalogue
    version 2.9.0 (Manchester, Hobbs, Teoh, and Hobbs 2005). The
    catalogue stores F0 and F1 and prints P0 = 1/F0 and P1 = −F1/F0².
    Each value is at the catalogue epoch, not a live ephemeris.

    The dashed line on the diagram is a sketch of constant polar-cap
    potential, not a fitted death line. Harding (astro-ph/0209160)
    equation (1):
      Φ = 6.6×10^12 V × (B_p / 10^12 G) × P^−2 × (R / 10 km)^3
    Xia Zhou, IAU Symposium 337 (2018), sets ΔV = 10^12 V to hold the
    potential fixed. Chen and Ruderman 1993 call the real boundary a
    death valley, not one line. No other pulsars are plotted. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Pulsars = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var C_M_S = 299792458;
  var I_G_CM2 = 1e45;
  var I_KG_M2 = 1e38;
  var R_KM = 10;
  var BRAKING_INDEX = 3;
  /* ATNF BSURF. Two significant figures, conventional. */
  var B_DIPOLE = 3.2e19;
  /* Harding eq. (5): polar field, I = 10^45 g cm², R = 10 km. */
  var B_POLAR = 6.4e19;
  /* Harding eq. (1): volts, for B_p in units of 10^12 G, P in seconds, R = 10 km. */
  var PHI_COEFF_V = 6.6e12;
  /* Zhou 2018, the round potential held fixed in that illustration. */
  var PHI_SKETCH_V = 1e12;
  /* Julian year. Characteristic ages in the catalogue are this span. */
  var YEAR_S = 365.25 * 86400;
  var CRAB_SN_YEAR = 1054;
  var PAGE_YEAR = 2026;
  var CRAB_TRUE_AGE_YR = PAGE_YEAR - CRAB_SN_YEAR;

  var P_MIN_S = 0.001;
  var P_MAX_S = 20;
  var PDOT_MIN = 1e-22;
  var PDOT_MAX = 1e-9;

  /* P0 and P1 as printed by ATNF v2.9.0, selected ephemeris, long with errors.
     Queried 2026-10-31 for B0531+21, B0833-45, J0437-4715, and B1919+21. */
  var PRESETS = [
    {
      id: "crab",
      label: "Crab",
      name: "B0531+21",
      jname: "J0534+2200",
      pSeconds: 0.0333924123,
      pLabel: "0.0333924123",
      pMsLabel: "33.3924123",
      pDot: 4.20972e-13,
      pDotLabel: "4.20972×10⁻¹³",
      pDotPlain: "4.20972e-13",
      epoch: "48442.5",
      unit: "ms",
      timing: "Lyne et al. 2015",
      note: "Young. In the Crab Nebula."
    },
    {
      id: "vela",
      label: "Vela",
      name: "B0833−45",
      jname: "J0835−4510",
      pSeconds: 0.089328385024,
      pLabel: "0.089328385024",
      pMsLabel: "89.328385024",
      pDot: 1.25008e-13,
      pDotLabel: "1.25008×10⁻¹³",
      pDotPlain: "1.25008e-13",
      epoch: "51559.319",
      unit: "ms",
      timing: "Dodson et al. 2002",
      note: "Young. The epoch is the January 2000 glitch."
    },
    {
      id: "j0437",
      label: "J0437−4715",
      name: "J0437−4715",
      jname: "J0437−4715",
      pSeconds: 0.005757451941593412,
      pLabel: "0.005757451941593412",
      pMsLabel: "5.757451941593412",
      pDot: 5.72922e-20,
      pDotLabel: "5.729220×10⁻²⁰",
      pDotPlain: "5.729220e-20",
      epoch: "55486",
      unit: "ms",
      timing: "Reardon et al. 2024",
      note: "Millisecond. Recycled."
    },
    {
      id: "b1919",
      label: "B1919+21",
      name: "B1919+21",
      jname: "J1921+2153",
      pSeconds: 1.3373021601895,
      pLabel: "1.3373021601895",
      pMsLabel: "1337.3021601895",
      pDot: 1.348207e-15,
      pDotLabel: "1.348207×10⁻¹⁵",
      pDotPlain: "1.348207e-15",
      epoch: "48999.0",
      unit: "s",
      timing: "Hobbs et al. 2004",
      note: "Ordinary. The first pulsar."
    }
  ];

  var AGE_LINES = [
    { years: 1e3, label: "1 kyr" },
    { years: 1e6, label: "1 Myr" },
    { years: 1e9, label: "1 Gyr" }
  ];

  var FIELD_LINES = [
    { gauss: 1e8, label: "10⁸ G" },
    { gauss: 1e12, label: "10¹² G" },
    { gauss: 1e14, label: "10¹⁴ G" }
  ];

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "⁺"
  };

  function log10(x) {
    return Math.log(x) / Math.LN10;
  }

  function formatSup(exp) {
    var s = String(exp);
    var out = "";
    var k;
    for (k = 0; k < s.length; k++) out += SUP[s.charAt(k)] || s.charAt(k);
    return out;
  }

  function formatSci(x, sig) {
    if (typeof x !== "number" || !isFinite(x)) return "—";
    var sign = x < 0 ? "−" : "";
    var ax = Math.abs(x);
    if (ax === 0) return "0";
    var exp = Math.floor(log10(ax));
    var mant = ax / Math.pow(10, exp);
    var mantNum = Number(mant.toPrecision(sig));
    if (mantNum >= 10) {
      mantNum = mantNum / 10;
      exp += 1;
    }
    var mantStr = String(Number(mantNum.toPrecision(sig)));
    return sign + mantStr + "×10" + formatSup(exp);
  }

  function groupInt(s) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function groupFixed(x, digits) {
    var neg = x < 0;
    var s = Math.abs(x).toFixed(digits);
    var parts = s.split(".");
    return (neg ? "−" : "") + groupInt(parts[0]) + (parts.length > 1 ? "." + parts[1] : "");
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function relClose(a, b, tol) {
    var scale = Math.max(Math.abs(a), Math.abs(b), 1e-30);
    return Math.abs(a - b) / scale <= tol;
  }

  function characteristicAgeSeconds(pSeconds, pDot) {
    return pSeconds / ((BRAKING_INDEX - 1) * pDot);
  }

  function surfaceFieldGauss(pSeconds, pDot) {
    return B_DIPOLE * Math.sqrt(pSeconds * pDot);
  }

  function polarFieldGauss(pSeconds, pDot) {
    return B_POLAR * Math.sqrt(pSeconds * pDot);
  }

  function edotWatts(pSeconds, pDot) {
    return 4 * Math.PI * Math.PI * I_KG_M2 * pDot / Math.pow(pSeconds, 3);
  }

  function edotErgPerS(pSeconds, pDot) {
    return edotWatts(pSeconds, pDot) * 1e7;
  }

  function lightCylinderMetres(pSeconds) {
    return C_M_S * pSeconds / (2 * Math.PI);
  }

  /* Φ = 6.6e12 V * (B_p / 1e12 G) / P^2, R = 10 km.
     Set Φ = 1e12 V and B_p = 6.4e19 √(P Ṗ). Solve for Ṗ. */
  function deathPdot(pSeconds) {
    var bPolar = PHI_SKETCH_V * pSeconds * pSeconds * 1e12 / PHI_COEFF_V;
    return (bPolar * bPolar) / (pSeconds * B_POLAR * B_POLAR);
  }

  function agePdot(pSeconds, years) {
    return pSeconds / (2 * years * YEAR_S);
  }

  function fieldPdot(pSeconds, gauss) {
    var root = gauss / B_DIPOLE;
    return (root * root) / pSeconds;
  }

  function inRange(pSeconds, pDot) {
    return typeof pSeconds === "number" && typeof pDot === "number" &&
      isFinite(pSeconds) && isFinite(pDot) &&
      pSeconds >= P_MIN_S && pSeconds <= P_MAX_S &&
      pDot >= PDOT_MIN && pDot <= PDOT_MAX;
  }

  function model(input) {
    if (!input) return null;
    var p = input.pSeconds;
    var pd = input.pDot;
    if (!inRange(p, pd)) return null;
    var age = characteristicAgeSeconds(p, pd);
    var preset = matchedPreset(p, pd);
    return {
      pSeconds: p,
      pDot: pd,
      ageSeconds: age,
      ageYears: age / YEAR_S,
      bGauss: surfaceFieldGauss(p, pd),
      bPolarGauss: polarFieldGauss(p, pd),
      edotWatts: edotWatts(p, pd),
      edotErg: edotErgPerS(p, pd),
      rlcM: lightCylinderMetres(p),
      spinHz: 1 / p,
      preset: preset
    };
  }

  function presetModel(id) {
    var preset = presetById(id);
    if (!preset) return null;
    var row = model({ pSeconds: preset.pSeconds, pDot: preset.pDot });
    if (!row) return null;
    row.preset = preset;
    return row;
  }

  function matchedPreset(pSeconds, pDot) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (relClose(PRESETS[i].pSeconds, pSeconds, 1e-9) && relClose(PRESETS[i].pDot, pDot, 1e-9)) {
        return PRESETS[i];
      }
    }
    return null;
  }

  function formatAge(seconds) {
    if (!(seconds > 0) || !isFinite(seconds)) return "—";
    var years = seconds / YEAR_S;
    if (years < 1e4) return groupFixed(years, 0) + " yr";
    if (years < 1e6) return groupFixed(years / 1e3, 2) + " kyr";
    if (years < 1e9) return groupFixed(years / 1e6, 2) + " Myr";
    return groupFixed(years / 1e9, 3) + " Gyr";
  }

  function ageParts(seconds) {
    var label = formatAge(seconds);
    var cut = label.lastIndexOf(" ");
    return { value: label.slice(0, cut), unit: label.slice(cut + 1) };
  }

  function formatB(gauss) {
    return formatSci(gauss, 4) + " G";
  }

  function formatEdot(watts) {
    return formatSci(watts, 4) + " W";
  }

  function formatErg(erg) {
    return formatSci(erg, 4) + " erg/s";
  }

  function formatKm(metres) {
    var km = metres / 1000;
    if (km >= 10000) return groupFixed(km, 0) + " km";
    if (km >= 1000) return groupFixed(km, 1) + " km";
    if (km >= 10) return groupFixed(km, 2) + " km";
    return groupFixed(km, 3) + " km";
  }

  function formatHz(pSeconds) {
    var f = 1 / pSeconds;
    if (f >= 100) return groupFixed(f, 2) + " Hz";
    if (f >= 10) return groupFixed(f, 3) + " Hz";
    return groupFixed(f, 4) + " Hz";
  }

  function formatPdot(pDot) {
    var preset = null;
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (relClose(PRESETS[i].pDot, pDot, 1e-12)) preset = PRESETS[i];
    }
    if (preset) return preset.pDotLabel;
    return formatSci(pDot, 4);
  }

  function formatPeriodPair(row) {
    var preset = row.preset;
    if (preset) return preset.pMsLabel + " ms (" + preset.pLabel + " s)";
    var ms = row.pSeconds * 1000;
    var msText = ms >= 100 ? groupFixed(ms, 3) : groupFixed(ms, 4);
    var sText = row.pSeconds >= 1 ? groupFixed(row.pSeconds, 4) : row.pSeconds.toPrecision(5);
    return msText + " ms (" + sText + " s)";
  }

  function formatPdotInput(pDot) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (relClose(PRESETS[i].pDot, pDot, 1e-12)) return PRESETS[i].pDotPlain;
    }
    return pDot.toExponential(4).replace("+", "");
  }

  function formatPeriodInput(pSeconds, unit) {
    if (unit === "ms") {
      var ms = pSeconds * 1000;
      var preset = null;
      var i;
      for (i = 0; i < PRESETS.length; i++) {
        if (relClose(PRESETS[i].pSeconds, pSeconds, 1e-12)) preset = PRESETS[i];
      }
      if (preset) return preset.pMsLabel;
      if (ms >= 100) return String(Number(ms.toPrecision(6)));
      return String(Number(ms.toPrecision(6)));
    }
    var j;
    for (j = 0; j < PRESETS.length; j++) {
      if (relClose(PRESETS[j].pSeconds, pSeconds, 1e-12)) return PRESETS[j].pLabel;
    }
    return String(Number(pSeconds.toPrecision(6)));
  }

  function pSecondsFromUnit(value, unit) {
    if (unit === "ms") return value / 1000;
    return value;
  }

  function unitFromLog(value, lo, hi) {
    if (!(value > 0)) return 0;
    var t = (Math.log(value) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    if (t < 0) return 0;
    if (t > 1) return 1000;
    return t * 1000;
  }

  function logFromUnit(unit, lo, hi) {
    var t = unit / 1000;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo)));
  }

  function xFrac(pSeconds) {
    return (Math.log(pSeconds) - Math.log(P_MIN_S)) / (Math.log(P_MAX_S) - Math.log(P_MIN_S));
  }

  function yFrac(pDot) {
    var u = (Math.log(pDot) - Math.log(PDOT_MIN)) / (Math.log(PDOT_MAX) - Math.log(PDOT_MIN));
    return 1 - u;
  }

  function clipPower(k, slope) {
    if (!(k > 0) || !isFinite(k) || !isFinite(slope) || slope === 0) return null;
    var pts = [];
    function consider(p, pd) {
      if (!(p > 0) || !(pd > 0) || !isFinite(p) || !isFinite(pd)) return;
      var slack = 1e-8;
      if (p < P_MIN_S * (1 - slack) || p > P_MAX_S * (1 + slack)) return;
      if (pd < PDOT_MIN * (1 - slack) || pd > PDOT_MAX * (1 + slack)) return;
      if (p < P_MIN_S) p = P_MIN_S;
      if (p > P_MAX_S) p = P_MAX_S;
      if (pd < PDOT_MIN) pd = PDOT_MIN;
      if (pd > PDOT_MAX) pd = PDOT_MAX;
      var i;
      for (i = 0; i < pts.length; i++) {
        if (relClose(pts[i].p, p, 1e-6) && relClose(pts[i].pd, pd, 1e-6)) return;
      }
      pts.push({ p: p, pd: pd });
    }
    consider(P_MIN_S, k * Math.pow(P_MIN_S, slope));
    consider(P_MAX_S, k * Math.pow(P_MAX_S, slope));
    consider(Math.pow(PDOT_MAX / k, 1 / slope), PDOT_MAX);
    consider(Math.pow(PDOT_MIN / k, 1 / slope), PDOT_MIN);
    if (pts.length < 2) return null;
    pts.sort(function (a, b) { return a.p - b.p; });
    return {
      p0: pts[0].p,
      pd0: pts[0].pd,
      p1: pts[pts.length - 1].p,
      pd1: pts[pts.length - 1].pd
    };
  }

  function diagramLines() {
    var out = [];
    var i;
    var seg;
    for (i = 0; i < AGE_LINES.length; i++) {
      seg = clipPower(1 / (2 * AGE_LINES[i].years * YEAR_S), 1);
      if (seg) out.push({ kind: "age", label: AGE_LINES[i].label, p0: seg.p0, pd0: seg.pd0, p1: seg.p1, pd1: seg.pd1 });
    }
    for (i = 0; i < FIELD_LINES.length; i++) {
      var g = FIELD_LINES[i].gauss / B_DIPOLE;
      seg = clipPower(g * g, -1);
      if (seg) out.push({ kind: "field", label: FIELD_LINES[i].label, p0: seg.p0, pd0: seg.pd0, p1: seg.p1, pd1: seg.pd1 });
    }
    var bPolar = PHI_SKETCH_V * 1e12 / PHI_COEFF_V;
    var deathK = (bPolar * bPolar) / (B_POLAR * B_POLAR);
    seg = clipPower(deathK, 3);
    if (seg) out.push({ kind: "death", label: "10¹² V sketch", p0: seg.p0, pd0: seg.pd0, p1: seg.p1, pd1: seg.pd1 });
    return out;
  }

  function explain(row) {
    if (!row) return "";
    var crab = presetModel("crab");
    var who = row.preset
      ? row.preset.name + " (" + row.preset.jname + ") at catalogue epoch MJD " + row.preset.epoch + ", the P0 and P1 printed by ATNF v2.9.0 from " + row.preset.timing + "."
      : "A period and a derivative you set. Not a catalogue entry.";
    var ageLine = row.preset && row.preset.id === "crab"
      ? "The supernova of 1054 is " + String(CRAB_TRUE_AGE_YR) + " years before 2026, a count of calendar years, not a day inside 1054. The characteristic age is longer. The formula assumes the star was born spinning much faster than it spins now, and that the braking index stays at 3. Lyne et al. 2015 is 45 years of the Crab’s rotation. This number is not that history."
      : "That age is not a birthday. The same formula on the Crab’s catalogue period gives " + formatAge(crab.ageSeconds) + ". The supernova of 1054 is " + String(CRAB_TRUE_AGE_YR) + " years before 2026.";
    return "Period " + formatPeriodPair(row) + ". Period derivative " + formatPdot(row.pDot) + ", dimensionless. " + who + " Characteristic age is P / (2 Ṗ), which is " + formatAge(row.ageSeconds) + ". " + ageLine + " Surface dipole field is 3.2×10¹⁹ times the square root of P Ṗ, which is " + formatB(row.bGauss) + ". The 3.2 has two figures, so the field is about that order. Moment of inertia is 10⁴⁵ g cm² and the radius in the convention is 10 km. Spin-down luminosity is 4π² I Ṗ / P³, which is " + formatEdot(row.edotWatts) + " (" + formatErg(row.edotErg) + "). Light-cylinder radius is c P / (2π), which is " + formatKm(row.rlcM) + ". Spin frequency, 1/P, is " + formatHz(row.pSeconds) + ". Idealized dipole. Not a timing model.";
  }

  function explainWhy() {
    var crab = presetModel("crab");
    var vela = presetModel("vela");
    var ms = presetModel("j0437");
    var slow = presetModel("b1919");
    return {
      spin: "A pulsar is a neutron star, seen when the beam swings past Earth. The catalogue period is the time for one turn. The period derivative is how much that time grows each second. It is tiny, and it is dimensionless. The Crab’s catalogue period is " + crab.preset.pMsLabel + " ms and its derivative is " + crab.preset.pDotLabel + ". J0437−4715 turns in " + ms.preset.pMsLabel + " ms. B1919+21 takes " + slow.preset.pLabel + " s.",
      age: "Characteristic age is the period divided by twice the derivative. Braking index 3 is the dipole. The Crab’s catalogue numbers give " + formatAge(crab.ageSeconds) + ". The guest star of 1054, the supernova tied to the Crab Nebula, is " + String(CRAB_TRUE_AGE_YR) + " years before 2026. The characteristic age is longer because the star was not born at a standstill, and because the braking index does not have to stay at 3. Vela’s catalogue age is " + formatAge(vela.ageSeconds) + ". B1919+21’s is " + formatAge(slow.ageSeconds) + ". J0437−4715’s is " + formatAge(ms.ageSeconds) + ", a recycling age, not the age of the star.",
      field: "The surface dipole field on this page is 3.2×10¹⁹ √(P Ṗ) gauss. That is the ATNF BSURF convention, with I = 10⁴⁵ g cm² and R = 10 km. The Crab computes " + formatB(crab.bGauss) + ", order 10¹² G. J0437−4715 computes " + formatB(ms.bGauss) + ". The polar field in Harding’s equation (5) is twice this, 6.4×10¹⁹ √(P Ṗ), because a dipole is stronger at the pole. Spin-down luminosity is 4π² I Ṗ / P³. The Crab’s is " + formatEdot(crab.edotWatts) + ", which is " + formatErg(crab.edotErg) + ". The ATNF EDOT column prints that power in erg/s, rounded. The light cylinder is c P / (2π). Inside it, a co-rotating field would still be slower than light. The Crab’s is " + formatKm(crab.rlcM) + "."
    };
  }

  return {
    C_M_S: C_M_S,
    I_G_CM2: I_G_CM2,
    I_KG_M2: I_KG_M2,
    R_KM: R_KM,
    BRAKING_INDEX: BRAKING_INDEX,
    B_DIPOLE: B_DIPOLE,
    B_POLAR: B_POLAR,
    PHI_COEFF_V: PHI_COEFF_V,
    PHI_SKETCH_V: PHI_SKETCH_V,
    YEAR_S: YEAR_S,
    CRAB_SN_YEAR: CRAB_SN_YEAR,
    PAGE_YEAR: PAGE_YEAR,
    CRAB_TRUE_AGE_YR: CRAB_TRUE_AGE_YR,
    P_MIN_S: P_MIN_S,
    P_MAX_S: P_MAX_S,
    PDOT_MIN: PDOT_MIN,
    PDOT_MAX: PDOT_MAX,
    PRESETS: PRESETS,
    AGE_LINES: AGE_LINES,
    FIELD_LINES: FIELD_LINES,
    presetById: presetById,
    model: model,
    presetModel: presetModel,
    matchedPreset: matchedPreset,
    characteristicAgeSeconds: characteristicAgeSeconds,
    surfaceFieldGauss: surfaceFieldGauss,
    polarFieldGauss: polarFieldGauss,
    edotWatts: edotWatts,
    edotErgPerS: edotErgPerS,
    lightCylinderMetres: lightCylinderMetres,
    deathPdot: deathPdot,
    agePdot: agePdot,
    fieldPdot: fieldPdot,
    formatAge: formatAge,
    ageParts: ageParts,
    formatB: formatB,
    formatEdot: formatEdot,
    formatErg: formatErg,
    formatKm: formatKm,
    formatHz: formatHz,
    formatPdot: formatPdot,
    formatPdotInput: formatPdotInput,
    formatPeriodPair: formatPeriodPair,
    formatPeriodInput: formatPeriodInput,
    pSecondsFromUnit: pSecondsFromUnit,
    unitFromLog: unitFromLog,
    logFromUnit: logFromUnit,
    xFrac: xFrac,
    yFrac: yFrac,
    diagramLines: diagramLines,
    explain: explain,
    explainWhy: explainWhy
  };
});
