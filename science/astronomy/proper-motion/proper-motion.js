/*! Proper motion and space velocity.
    Tangential speed is one astronomical unit per Julian year,
    times the proper motion in arcseconds per year, times the
    distance in parsecs.

    The astronomical unit is the IAU 2012 value, 149,597,870.7 km.
    The Julian year is 365.25 × 86,400 s.
    Their quotient is 4.74047046 km/s. Five-decimal rounding is
    4.74047. The calculator uses the quotient.

    A parsec is 648000/π astronomical units.
    A light-year is c times one Julian year. c is 299,792.458 km/s.

    Total proper motion is the root sum square of μ_α* and μ_δ.
    μ_α* is already multiplied by cos δ. It is not multiplied again.

    The straight-line closest approach holds the Sun fixed and
    moves the star at constant speed:
      t = − d v_r / (v_t² + v_r²)
      r_min = d v_t / sqrt(v_t² + v_r²)
    Time uses the length of a parsec divided by a Julian year.
    A negative radial velocity is approaching. Formal errors
    are not folded in. Educational schematic, not an orbit. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ProperMotion = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AU_KM = 149597870.7;
  var JULIAN_YEAR_S = 365.25 * 86400;
  var C_KM_S = 299792.458;
  var AU_PER_PC = 648000 / Math.PI;
  var PC_KM = AU_PER_PC * AU_KM;
  var LY_KM = C_KM_S * JULIAN_YEAR_S;
  var FACTOR = AU_KM / JULIAN_YEAR_S;
  var YEARS_PER_PC_AT_1KMS = PC_KM / JULIAN_YEAR_S;
  var LY_PER_PC = PC_KM / LY_KM;
  var PC_PER_LY = LY_KM / PC_KM;
  var MOON_AS = 1800;
  var DEGREE_AS = 3600;
  var MU_MIN = 0.0001;
  var MU_MAX = 20;
  var PC_MIN = 0.2;
  var PC_MAX = 5000;
  var RV_MIN = -400;
  var RV_MAX = 400;
  var YEAR_CHOICES = [100, 1000, 10000];

  var LIMITS = "Educational schematic. Not a catalog reduction and not an orbit. Proper motion, parallax, and radial velocity are combined as a straight line at constant speed relative to the Sun. Galactic acceleration, perspective acceleration, and the Sun’s motion are left out. The closest-approach time is that linear approximation. Formal errors are not folded in.";

  /* Printed central values. Gaia figures are the archive row rounded
     to 0.0001 mas, 0.001 mas/yr, and 0.001 km/s. Hipparcos and
     Gontcharov figures are the catalog prints. The calculator uses
     these prints. The unrounded archive doubles are not substituted. */
  var PRESETS = [
    {
      id: "barnard",
      name: "Barnard's Star",
      pmra: -801.551,
      pmdec: 10362.394,
      plx: 546.9759,
      rv: -110.468,
      catalog: "Gaia DR3",
      sourceId: "4472832130942575872"
    },
    {
      id: "kapteyn",
      name: "Kapteyn's Star",
      pmra: 6491.223,
      pmdec: -5708.614,
      plx: 254.1986,
      rv: 245.053,
      catalog: "Gaia DR3",
      sourceId: "4810594479418041856"
    },
    {
      id: "proxima",
      name: "Proxima Centauri",
      pmra: -3781.741,
      pmdec: 769.465,
      plx: 768.0665,
      rv: -21.943,
      catalog: "Gaia DR3",
      sourceId: "5853498713190525696"
    },
    {
      id: "cygni",
      name: "61 Cygni A",
      pmra: 4164.209,
      pmdec: 3249.614,
      plx: 285.9949,
      rv: -65.975,
      catalog: "Gaia DR3",
      sourceId: "1872046609345556480"
    },
    {
      id: "arcturus",
      name: "Arcturus",
      pmra: -1093.39,
      pmdec: -2000.06,
      plx: 88.83,
      rv: -5.2,
      catalog: "Hipparcos",
      sourceId: "HIP 69673"
    },
    {
      id: "deneb",
      name: "Deneb",
      pmra: 2.01,
      pmdec: 1.85,
      plx: 2.31,
      rv: -4.9,
      catalog: "Hipparcos",
      sourceId: "HIP 102098"
    }
  ];

  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  function parseNum(s) {
    if (typeof s === "number") return s;
    if (typeof s !== "string") return NaN;
    var t = s.trim().replace(/−/g, "-").replace(/,/g, "");
    if (!t || t === "-" || t === "." || t === "-.") return NaN;
    return Number(t);
  }

  function trimZeros(s) {
    if (s.indexOf(".") < 0) return s;
    return s.replace(/0+$/, "").replace(/\.$/, "");
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var out = parts[0];
    if (digits > 0) out += "." + parts[1];
    return (neg ? "−" : "") + out;
  }

  function totalMuMas(pmra, pmdec) {
    return Math.hypot(pmra, pmdec);
  }

  function positionAngleDeg(pmra, pmdec) {
    var deg = Math.atan2(pmra, pmdec) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  }

  function distancePcFromParallax(plxMas) {
    return 1000 / plxMas;
  }

  function tangential(muAsYr, distancePc) {
    return FACTOR * muAsYr * distancePc;
  }

  function muFromInputs(value, unit) {
    var n = typeof value === "number" ? value : parseNum(value);
    if (unit === "mas") return n / 1000;
    return n;
  }

  function distancePcFromInputs(value, mode) {
    var n = typeof value === "number" ? value : parseNum(value);
    if (mode === "ly") return n * PC_PER_LY;
    if (mode === "plx") return 1000 / n;
    return n;
  }

  function formatMuAs(mu) {
    return group(mu, 6) + "″/yr";
  }

  function formatMuMas(muAs) {
    return group(muAs * 1000, 3) + " mas/yr";
  }

  function formatPc(pc) {
    return group(pc, pc >= 100 ? 4 : 6) + " pc";
  }

  function formatLy(ly) {
    return group(ly, ly >= 100 ? 1 : 3) + " ly";
  }

  function formatParallax(mas) {
    var digits = mas >= 100 ? 4 : (mas >= 1 ? 2 : 4);
    return group(mas, digits) + " mas";
  }

  function formatSpeed(v) {
    return group(v, 3) + " km/s";
  }

  function formatAngle(deg) {
    return group(deg, 2) + "°";
  }

  function formatYears(y) {
    if (!isFinite(y)) return "—";
    var abs = Math.abs(y);
    var digits;
    if (abs >= 10000) digits = 0;
    else if (abs >= 100) digits = Math.abs(y - Math.round(y)) < 0.05 ? 0 : 1;
    else digits = 2;
    return group(y, digits) + " yr";
  }

  function formatArcsec(as) {
    var abs = Math.abs(as);
    var digits = abs >= 100 ? 1 : (abs >= 1 ? 2 : 4);
    return group(as, digits) + "″";
  }

  function formatFactor() {
    return group(FACTOR, 8);
  }

  function logMap(t, min, max) {
    return min * Math.pow(max / min, t);
  }

  function logUnmap(value, min, max) {
    if (!(value > 0) || value < min) return 0;
    if (value > max) return 1;
    return Math.log(value / min) / Math.log(max / min);
  }

  function offset(muAsYr, paDeg, years) {
    var rad = paDeg * Math.PI / 180;
    var arc = muAsYr * years;
    return {
      years: years,
      arcsec: arc,
      east: arc * Math.sin(rad),
      north: arc * Math.cos(rad)
    };
  }

  function track(muAsYr, paDeg, years, steps) {
    var n = steps || 24;
    var pts = [];
    var i;
    for (i = 0; i <= n; i++) pts.push(offset(muAsYr, paDeg, years * i / n));
    return pts;
  }

  function anglePhrase(deg, rv) {
    if (rv < 0) return "Approaching. The angle is past 90°, so more of the motion is toward the Sun than across the sky.";
    if (rv > 0) return "Receding. The angle is under 90°, so more of the motion is away from the Sun than across the sky.";
    return "No radial velocity. The motion is across the line of sight.";
  }

  function scene(opts) {
    opts = opts || {};
    var preset = opts.preset ? presetById(opts.preset) : null;
    if (opts.preset && !preset) return { ok: false, error: "Unknown preset." };

    var muAs = opts.muAsYr != null ? Number(opts.muAsYr) : (preset ? totalMuMas(preset.pmra, preset.pmdec) / 1000 : NaN);
    var dPc = opts.distancePc != null ? Number(opts.distancePc) : (preset ? distancePcFromParallax(preset.plx) : NaN);
    var rv = opts.rv != null ? Number(opts.rv) : (preset ? preset.rv : NaN);
    var pa = opts.paDeg != null ? Number(opts.paDeg) : (preset ? positionAngleDeg(preset.pmra, preset.pmdec) : 0);
    var years = opts.years != null ? Number(opts.years) : 100;
    var along = opts.along != null ? Number(opts.along) : 1;

    if (!isFinite(muAs) || muAs < 0) return { ok: false, error: "Proper motion has to be zero or positive." };
    if (!isFinite(dPc) || dPc <= 0) return { ok: false, error: "Distance has to be positive. A parallax of zero is not a distance." };
    if (!isFinite(rv)) return { ok: false, error: "Radial velocity has to be a number. Negative is approaching." };
    if (!isFinite(pa)) return { ok: false, error: "Position angle has to be a number." };
    if (!isFinite(years) || years <= 0) return { ok: false, error: "The time span has to be positive." };
    if (!isFinite(along)) along = 1;
    if (along < 0) along = 0;
    if (along > 1) along = 1;

    var vt = tangential(muAs, dPc);
    var v = Math.hypot(vt, rv);
    var angle = v === 0 ? null : Math.atan2(vt, rv) * 180 / Math.PI;
    var ly = dPc * LY_PER_PC;
    var plx = 1000 / dPc;
    var moonYears = muAs > 0 ? MOON_AS / muAs : null;
    var degYears = muAs > 0 ? DEGREE_AS / muAs : null;
    var tYr = v > 0 ? -(dPc * rv) / (v * v) * YEARS_PER_PC_AT_1KMS : null;
    var rMin = v > 0 ? dPc * vt / v : null;
    var when = rv < 0 ? "future" : (rv > 0 ? "past" : "now");
    var end = offset(muAs, pa, years);
    var nowPt = offset(muAs, pa, years * along);
    var name = preset ? preset.name : "Custom";

    var closestNote;
    if (v === 0) closestNote = "Both components are zero, so there is no path and no closest approach.";
    else if (when === "future") closestNote = "Approaching, so the straight-line minimum is in the future. " + formatYears(tYr) + " from now the distance is " + formatPc(rMin) + ".";
    else if (when === "past") closestNote = "Receding, so the straight-line minimum was in the past. " + formatYears(Math.abs(tYr)) + " ago the distance was " + formatPc(rMin) + ".";
    else closestNote = "No radial velocity, so the star is closest now. The minimum distance is the current distance.";

    var aria = name + ". Proper motion " + formatMuAs(muAs) + ". Distance " + formatPc(dPc) + ". Tangential speed " + formatSpeed(vt) + ". Space velocity " + formatSpeed(v) + ". Over " + formatYears(years) + " the star moves " + formatArcsec(end.arcsec) + ". Not an orbit.";

    return {
      ok: true,
      preset: preset ? preset.id : null,
      name: name,
      muAsYr: muAs,
      distancePc: dPc,
      ly: ly,
      parallaxMas: plx,
      rv: rv,
      paDeg: ((pa % 360) + 360) % 360,
      years: years,
      along: along,
      vt: vt,
      v: v,
      angleDeg: angle,
      when: when,
      tYr: tYr,
      rMinPc: rMin,
      moonYears: moonYears,
      degreeYears: degYears,
      end: end,
      now: nowPt,
      text: {
        mu: formatMuAs(muAs),
        muMas: formatMuMas(muAs),
        distance: formatPc(dPc),
        ly: formatLy(ly),
        parallax: formatParallax(plx),
        vt: formatSpeed(vt),
        vr: formatSpeed(rv),
        v: formatSpeed(v),
        angle: angle == null ? "—" : formatAngle(angle),
        angleNote: angle == null ? "No motion, so there is no angle." : anglePhrase(angle, rv),
        moon: moonYears == null ? "—" : formatYears(moonYears),
        degree: degYears == null ? "—" : formatYears(degYears),
        span: formatArcsec(end.arcsec),
        spanYears: formatYears(years),
        pa: formatAngle(((pa % 360) + 360) % 360),
        closestTime: tYr == null ? "—" : formatYears(tYr),
        closestDist: rMin == null ? "—" : formatPc(rMin),
        closestLy: rMin == null ? "—" : formatLy(rMin * LY_PER_PC),
        closestNote: closestNote,
        factor: formatFactor(),
        yearsPerPc: group(YEARS_PER_PC_AT_1KMS, 2),
        aria: aria
      }
    };
  }

  return {
    AU_KM: AU_KM,
    JULIAN_YEAR_S: JULIAN_YEAR_S,
    C_KM_S: C_KM_S,
    AU_PER_PC: AU_PER_PC,
    FACTOR: FACTOR,
    YEARS_PER_PC_AT_1KMS: YEARS_PER_PC_AT_1KMS,
    LY_PER_PC: LY_PER_PC,
    PC_PER_LY: PC_PER_LY,
    MOON_AS: MOON_AS,
    DEGREE_AS: DEGREE_AS,
    MU_MIN: MU_MIN,
    MU_MAX: MU_MAX,
    PC_MIN: PC_MIN,
    PC_MAX: PC_MAX,
    RV_MIN: RV_MIN,
    RV_MAX: RV_MAX,
    YEAR_CHOICES: YEAR_CHOICES,
    LIMITS: LIMITS,
    PRESETS: PRESETS,
    presetById: presetById,
    parseNum: parseNum,
    totalMuMas: totalMuMas,
    positionAngleDeg: positionAngleDeg,
    distancePcFromParallax: distancePcFromParallax,
    tangential: tangential,
    muFromInputs: muFromInputs,
    distancePcFromInputs: distancePcFromInputs,
    formatMuAs: formatMuAs,
    formatMuMas: formatMuMas,
    formatPc: formatPc,
    formatLy: formatLy,
    formatParallax: formatParallax,
    formatSpeed: formatSpeed,
    formatAngle: formatAngle,
    formatYears: formatYears,
    formatArcsec: formatArcsec,
    formatFactor: formatFactor,
    logMap: logMap,
    logUnmap: logUnmap,
    offset: offset,
    track: track,
    scene: scene
  };
});
