/*! Point-mass gravitational lensing for a classroom desk.

    Deflection of a light ray: alpha = 4GM / (c^2 b).
    Einstein radius, small-angle and flat space:
      theta_E = sqrt( 4GM/c^2 * D_LS / (D_L D_S) ),
      with D_LS = D_S - D_L.
    Two images of a point source:
      theta_pm = (beta ± sqrt(beta^2 + 4 theta_E^2)) / 2.
    Total magnification: A = (u^2 + 2) / (u sqrt(u^2 + 4)), u = beta / theta_E.
    A straight microlensing track: u(t) = sqrt(u0^2 + ((t-t0)/t_E)^2).

    c = 299792458 m/s exactly.
    GM of one nominal solar mass is the IAU 2015 Resolution B3 value,
    1.3271244e20 m^3 s^-2. The nominal solar radius is 6.957e8 m, the
    same length as the Sun Fact Sheet volumetric mean radius, 695,700 km.
    Jupiter’s limb uses the Jupiter Fact Sheet GM and volumetric radius.
    The parsec is (648000/pi) astronomical units. The AU is exactly
    149597870700 m.

    The 1.75 arcsec figure is the limb value the 1919 paper attributes to
    Einstein. This file recomputes the formula. It does not paste 1.75.

    Flat Euclidean distances. Not a cosmological angular-diameter distance.
    Not a galaxy or cluster model. Not a photometric fit. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Lensing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var C_M_S = 299792458;
  var GM_SUN = 1.3271244e20;
  var R_SUN_M = 6.957e8;
  var AU_M = 149597870700;
  var PC_M = (648000 / Math.PI) * AU_M;
  var ARCSEC_PER_RAD = 648000 / Math.PI;

  /* Jupiter Fact Sheet. GM is 126.687 × 10^6 km^3 s^-2.
     1 km^3 = 10^9 m^3, so the SI value is 1.26687 × 10^17. */
  var GM_JUPITER = 126.687e6 * 1e9;
  var R_JUPITER_M = 69911e3;

  /* Slider domains. These are the allowed calculator range, not a catalog. */
  var MASS_MIN = 1e-4;
  var MASS_MAX = 1e15;
  var B_MIN_M = 1e7;
  var B_MAX_M = 1e12;
  var DIST_MIN_PC = 1;
  var DIST_MAX_PC = 1e9;
  var U_MIN = -3;
  var U_MAX = 3;
  var U0_MIN = 0.01;
  var U0_MAX = 2;
  var TE_MIN_DAYS = 0.5;
  var TE_MAX_DAYS = 500;

  /* Round opening distances for the Einstein-radius calculator.
     Not a measured lens. One nominal solar mass, 4 kpc, and 8 kpc. */
  var OPEN_MASS = 1;
  var OPEN_DL_PC = 4000;
  var OPEN_DS_PC = 8000;
  var OPEN_U = 0.5;

  /* OGLE Early Warning System single-lens fit for OGLE-2005-BLG-390.
     The printed Amax is theirs. This page recomputes A from u_min. */
  var OGLE_U0 = 0.332;
  var OGLE_TE_DAYS = 11.735;
  var OGLE_AMAX_PRINTED = 3.136;
  var OGLE_AMAX_ERR = 0.044;

  /* Beaulieu et al. 2006 binary-lens parameters. Not the curve on this page. */
  var NATURE_U0 = 0.359;
  var NATURE_U0_ERR = 0.005;
  var NATURE_TE_DAYS = 11.03;
  var NATURE_TE_ERR = 0.11;

  /* Figures quoted from the papers, not produced by the formula. */
  var PAPER_EINSTEIN_LIMB = "1.75″";
  var PAPER_NEWTON_LIMB = "0.87″";
  var SOBRAL_LIMB = "1.98″";
  var SOBRAL_ERR = "0.12″";
  var PRINCIPE_LIMB = "1.61″";
  var PRINCIPE_ERR = "0.31″";
  var YEE_SEPARATION = "1.8″";
  var NASA_PAIR = "1.6″";
  var J1004_SEPARATION = "14.62″";
  var CROSS_Z_LENS = "0.0394";
  var CROSS_Z_SOURCE = "1.695";
  var J1004_Z_LENS = "0.68";
  var J1004_Z_SOURCE = "1.734";

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "⁺"
  };

  var PRESETS = [
    {
      id: "sun",
      label: "Sun, limb",
      massSolar: 1,
      bMeters: R_SUN_M
    },
    {
      id: "jupiter",
      label: "Jupiter, limb",
      massSolar: GM_JUPITER / GM_SUN,
      bMeters: R_JUPITER_M
    }
  ];

  function log10(x) {
    return Math.log(x) / Math.LN10;
  }

  function sup(exp) {
    var s = String(exp);
    var out = "";
    var k;
    for (k = 0; k < s.length; k++) out += SUP[s.charAt(k)] || s.charAt(k);
    return out;
  }

  function groupInt(s) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatSig(x, sig) {
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
    var rounded = mantNum * Math.pow(10, exp);
    if (exp >= -3 && exp < 6) {
      var decimals = exp >= 0 ? Math.max(0, sig - 1 - exp) : (sig - 1 - exp);
      var fixed = rounded.toFixed(decimals);
      var parts = fixed.split(".");
      var body = groupInt(parts[0]);
      return sign + body + (parts.length > 1 ? "." + parts[1] : "");
    }
    var mantStr = String(mantNum);
    return sign + mantStr + "×10" + sup(exp);
  }

  function gmOf(massSolar) {
    return massSolar * GM_SUN;
  }

  function arcsecFromRad(rad) {
    return rad * ARCSEC_PER_RAD;
  }

  function anglesFromArcsec(arcsec) {
    return {
      arcsecText: formatSig(arcsec, 4) + "″",
      masText: formatSig(arcsec * 1000, 4) + " mas",
      uasText: formatSig(arcsec * 1e6, 4) + " μas",
      primary: primaryAngle(arcsec)
    };
  }

  function primaryAngle(arcsec) {
    var a = Math.abs(arcsec);
    if (!(a >= 0)) return "—";
    if (a >= 1) return formatSig(arcsec, 4) + "″";
    if (a * 1000 >= 1) return formatSig(arcsec * 1000, 4) + " mas";
    return formatSig(arcsec * 1e6, 4) + " μas";
  }

  function inRange(x, lo, hi) {
    return typeof x === "number" && isFinite(x) && x >= lo && x <= hi;
  }

  function deflection(massSolar, bMeters) {
    if (!inRange(massSolar, MASS_MIN, MASS_MAX)) return null;
    if (!inRange(bMeters, B_MIN_M, B_MAX_M)) return null;
    var gm = gmOf(massSolar);
    var rad = (4 * gm) / (C_M_S * C_M_S * bMeters);
    var arcsec = arcsecFromRad(rad);
    var ang = anglesFromArcsec(arcsec);
    var half = anglesFromArcsec(arcsec / 2);
    return {
      massSolar: massSolar,
      bMeters: bMeters,
      gm: gm,
      radians: rad,
      arcsec: arcsec,
      halfArcsec: arcsec / 2,
      arcsecText: ang.arcsecText,
      masText: ang.masText,
      uasText: ang.uasText,
      primary: ang.primary,
      halfText: half.arcsecText,
      solarRadii: bMeters / R_SUN_M,
      au: bMeters / AU_M
    };
  }

  function einstein(massSolar, dLPc, dSPc) {
    if (!inRange(massSolar, MASS_MIN, MASS_MAX)) return null;
    if (!inRange(dLPc, DIST_MIN_PC, DIST_MAX_PC)) return null;
    if (!inRange(dSPc, DIST_MIN_PC, DIST_MAX_PC)) return null;
    if (!(dSPc > dLPc)) return null;
    var gm = gmOf(massSolar);
    var dL = dLPc * PC_M;
    var dS = dSPc * PC_M;
    var dLS = dS - dL;
    var rad = Math.sqrt(((4 * gm) / (C_M_S * C_M_S)) * dLS / (dL * dS));
    var arcsec = arcsecFromRad(rad);
    var ang = anglesFromArcsec(arcsec);
    return {
      massSolar: massSolar,
      dLPc: dLPc,
      dSPc: dSPc,
      dLSPc: dSPc - dLPc,
      radians: rad,
      arcsec: arcsec,
      arcsecText: ang.arcsecText,
      masText: ang.masText,
      uasText: ang.uasText,
      primary: ang.primary
    };
  }

  function imagePositions(beta, thetaE) {
    if (typeof beta !== "number" || !isFinite(beta)) return null;
    if (!(thetaE > 0) || !isFinite(thetaE)) return null;
    var disc = Math.sqrt(beta * beta + 4 * thetaE * thetaE);
    return {
      plus: (beta + disc) / 2,
      minus: (beta - disc) / 2
    };
  }

  function magnification(u) {
    if (typeof u !== "number" || !isFinite(u)) return null;
    var au = Math.abs(u);
    if (au === 0) return Infinity;
    var u2 = au * au;
    return (u2 + 2) / (au * Math.sqrt(u2 + 4));
  }

  function imageMags(u) {
    var A = magnification(u);
    if (A == null) return null;
    if (!isFinite(A)) {
      return { total: Infinity, plus: Infinity, minus: Infinity, signedMinus: -Infinity };
    }
    var plus = (A + 1) / 2;
    var minusAbs = (A - 1) / 2;
    return { total: A, plus: plus, minus: minusAbs, signedMinus: -minusAbs };
  }

  function uOfTime(u0, tDays, tEDays) {
    if (!(u0 > 0) || !(tEDays > 0)) return null;
    if (typeof tDays !== "number" || !isFinite(tDays)) return null;
    var x = tDays / tEDays;
    return Math.sqrt(u0 * u0 + x * x);
  }

  function lightCurve(u0, tEDays, n) {
    if (!inRange(u0, U0_MIN, U0_MAX)) return null;
    if (!inRange(tEDays, TE_MIN_DAYS, TE_MAX_DAYS)) return null;
    var count = n || 201;
    if (count < 2) count = 2;
    var pts = [];
    var i;
    for (i = 0; i < count; i++) {
      var f = i / (count - 1);
      var t = (-3 + 6 * f) * tEDays;
      var u = uOfTime(u0, t, tEDays);
      pts.push({ tDays: t, u: u, A: magnification(u) });
    }
    return pts;
  }

  function scene(massSolar, dLPc, dSPc, u) {
    if (typeof u !== "number" || !isFinite(u)) return null;
    if (u < U_MIN || u > U_MAX) return null;
    var e = einstein(massSolar, dLPc, dSPc);
    if (!e) return null;
    var beta = u * e.radians;
    var img = imagePositions(beta, e.radians);
    var mag = imageMags(u);
    var betaAng = anglesFromArcsec(arcsecFromRad(beta));
    var plusAng = anglesFromArcsec(arcsecFromRad(img.plus));
    var minusAng = anglesFromArcsec(arcsecFromRad(img.minus));
    return {
      einstein: e,
      u: u,
      betaRad: beta,
      beta: betaAng,
      plus: plusAng,
      minus: minusAng,
      plusRad: img.plus,
      minusRad: img.minus,
      mag: mag,
      aligned: u === 0
    };
  }

  function formatMag(A) {
    if (A == null) return "—";
    if (!isFinite(A)) return "unbounded";
    return formatSig(A, 4);
  }

  function formatU(u) {
    if (typeof u !== "number" || !isFinite(u)) return "—";
    var sign = u < 0 ? "−" : "";
    var ax = Math.abs(u);
    if (ax >= 0.0001 && ax < 1000) {
      return sign + ax.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    }
    return (u < 0 ? "−" : "") + formatSig(ax, 4).replace(/^−/, "");
  }

  function angleUnit(arcsec) {
    var a = Math.abs(arcsec);
    if (a >= 1) return "arcsec";
    if (a * 1000 >= 1) return "mas";
    return "uas";
  }

  function formatInUnit(arcsec, unit) {
    if (unit === "arcsec") return formatSig(arcsec, 4) + "″";
    if (unit === "mas") return formatSig(arcsec * 1000, 4) + " mas";
    return formatSig(arcsec * 1e6, 4) + " μas";
  }

  function formatKm(meters) {
    if (typeof meters !== "number" || !isFinite(meters)) return "—";
    var km = meters / 1000;
    if (km >= 100) return groupInt(km.toFixed(0)) + " km";
    if (km >= 1) return groupInt(km.toFixed(1)) + " km";
    return km.toFixed(3) + " km";
  }

  function formatSolarRadii(n) {
    if (typeof n !== "number" || !isFinite(n)) return "—";
    if (n >= 100) return formatSig(n, 4) + " R☉";
    if (n >= 10) return n.toFixed(2) + " R☉";
    if (n >= 0.01) return n.toFixed(3) + " R☉";
    return formatSig(n, 4) + " R☉";
  }

  function formatAu(n) {
    if (typeof n !== "number" || !isFinite(n)) return "—";
    if (n >= 0.01) return n.toFixed(4) + " AU";
    return formatSig(n, 4) + " AU";
  }

  function formatKpc(pc) {
    var kpc = pc / 1000;
    if (kpc >= 100) return formatSig(kpc, 4) + " kpc";
    if (kpc >= 1) return (Math.round(kpc * 1000) / 1000).toString().replace(/\.0$/, "") + " kpc";
    return formatSig(kpc, 4) + " kpc";
  }

  function formatMass(m) {
    if (typeof m !== "number" || !isFinite(m)) return "—";
    if (m >= 0.01 && m < 1000) {
      var s = m.toPrecision(4);
      return String(Number(s)) + " M☉";
    }
    return formatSig(m, 4) + " M☉";
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function fromUnit(t, lo, hi) {
    var logLo = log10(lo);
    var logHi = log10(hi);
    return Math.pow(10, logLo + (t / 1000) * (logHi - logLo));
  }

  function toUnit(x, lo, hi) {
    var logLo = log10(lo);
    var logHi = log10(hi);
    var t = (log10(x) - logLo) / (logHi - logLo) * 1000;
    if (t < 0) t = 0;
    if (t > 1000) t = 1000;
    return t;
  }

  function explainSun(row) {
    return "One nominal solar mass. Impact parameter equal to the nominal solar radius, 695,700 km. α = 4GM/(c² b) = " + row.primary + " (" + row.arcsecText + ", " + row.masText + ", " + row.uasText + "). The 1919 paper quotes Einstein’s limb value as " + PAPER_EINSTEIN_LIMB + " and the Newtonian half as " + PAPER_NEWTON_LIMB + ". This page’s half is " + row.halfText + ". Sobral’s 4-inch result in that paper is " + SOBRAL_LIMB + " with a probable error of about " + SOBRAL_ERR + ". Longair’s 2015 reading of the Príncipe reductions is " + PRINCIPE_LIMB + " ± " + PRINCIPE_ERR + ".";
  }

  function explainJupiter(row) {
    return "Jupiter’s fact-sheet GM, 126.687 × 10^6 km³/s², and volumetric mean radius, 69,911 km. The same formula gives " + row.primary + " (" + row.arcsecText + ", " + row.masText + ", " + row.uasText + "). That is the limb deflection of a point mass with Jupiter’s GM. It is not a quoted measurement of a ray that grazed Jupiter.";
  }

  function explainEinstein(row) {
    return "θ_E = sqrt(4GM/c² × D_LS/(D_L D_S)), with D_LS = D_S − D_L. Mass " + formatMass(row.massSolar) + ", lens " + formatKpc(row.dLPc) + ", source " + formatKpc(row.dSPc) + ". The angle is " + row.primary + " (" + row.arcsecText + ", " + row.masText + ", " + row.uasText + "). Flat space. Small angle. Not an angular-diameter distance.";
  }

  function explainScene(sc) {
    var unit = angleUnit(sc.einstein.arcsec);
    var plus = formatInUnit(arcsecFromRad(sc.plusRad), unit);
    var minus = formatInUnit(arcsecFromRad(sc.minusRad), unit);
    if (sc.aligned) {
      return "The source sits on the line of sight. The two solutions fall on the Einstein ring, at +" + sc.einstein.primary + " and −" + sc.einstein.primary + ". A point source on the axis is the whole ring, not two dots. The point-source magnification is unbounded.";
    }
    var major = formatMag(sc.mag.plus);
    var minor = formatMag(sc.mag.minus);
    var majorPos = sc.u >= 0 ? plus : minus;
    var minorPos = sc.u >= 0 ? minus : plus;
    return "Source offset u = " + formatU(sc.u) + ", so β = " + formatInUnit(arcsecFromRad(sc.betaRad), unit) + ". θ+ = " + plus + " and θ− = " + minus + ". Total magnification A = " + formatMag(sc.mag.total) + ". The image on the source’s side, at " + majorPos + ", is magnified by " + major + ". The opposite image, at " + minorPos + ", is " + minor + " and has opposite parity. A = |μ+| + |μ−|, and |μ+| − |μ−| = 1.";
  }

  function explainOgle() {
    var A = magnification(OGLE_U0);
    return "OGLE-2005-BLG-390, the survey’s single-lens fit: u_min = 0.332, t_E = 11.735 days. The survey prints Amax = 3.136 ± 0.044. This formula at u = 0.332 gives A = " + formatMag(A) + ". Beaulieu et al. 2006 later fit a planet. Their binary-lens closest approach is u0 = 0.359 ± 0.005 and t_E = 11.03 ± 0.11 days. That deviation is not on this curve.";
  }

  function explainLimits() {
    return "Point mass. Weak field. Small angle. D_LS on this page is D_S minus D_L, in a flat line. A galaxy or a cluster is not that mass, and a cosmological lens uses angular-diameter distances, which are not this subtraction. The Einstein Cross and SDSS J1004+4112 are cited below as published separations. Their redshifts are not loaded into the calculator. The light curve is the Paczyński point-source track. No parallax, no finite source, no planet. Not a fit to the photometry.";
  }

  return {
    C_M_S: C_M_S,
    GM_SUN: GM_SUN,
    R_SUN_M: R_SUN_M,
    AU_M: AU_M,
    PC_M: PC_M,
    ARCSEC_PER_RAD: ARCSEC_PER_RAD,
    GM_JUPITER: GM_JUPITER,
    R_JUPITER_M: R_JUPITER_M,
    MASS_MIN: MASS_MIN,
    MASS_MAX: MASS_MAX,
    B_MIN_M: B_MIN_M,
    B_MAX_M: B_MAX_M,
    DIST_MIN_PC: DIST_MIN_PC,
    DIST_MAX_PC: DIST_MAX_PC,
    U_MIN: U_MIN,
    U_MAX: U_MAX,
    U0_MIN: U0_MIN,
    U0_MAX: U0_MAX,
    TE_MIN_DAYS: TE_MIN_DAYS,
    TE_MAX_DAYS: TE_MAX_DAYS,
    OPEN_MASS: OPEN_MASS,
    OPEN_DL_PC: OPEN_DL_PC,
    OPEN_DS_PC: OPEN_DS_PC,
    OPEN_U: OPEN_U,
    OGLE_U0: OGLE_U0,
    OGLE_TE_DAYS: OGLE_TE_DAYS,
    OGLE_AMAX_PRINTED: OGLE_AMAX_PRINTED,
    OGLE_AMAX_ERR: OGLE_AMAX_ERR,
    NATURE_U0: NATURE_U0,
    NATURE_U0_ERR: NATURE_U0_ERR,
    NATURE_TE_DAYS: NATURE_TE_DAYS,
    NATURE_TE_ERR: NATURE_TE_ERR,
    PAPER_EINSTEIN_LIMB: PAPER_EINSTEIN_LIMB,
    PAPER_NEWTON_LIMB: PAPER_NEWTON_LIMB,
    SOBRAL_LIMB: SOBRAL_LIMB,
    SOBRAL_ERR: SOBRAL_ERR,
    PRINCIPE_LIMB: PRINCIPE_LIMB,
    PRINCIPE_ERR: PRINCIPE_ERR,
    YEE_SEPARATION: YEE_SEPARATION,
    NASA_PAIR: NASA_PAIR,
    J1004_SEPARATION: J1004_SEPARATION,
    CROSS_Z_LENS: CROSS_Z_LENS,
    CROSS_Z_SOURCE: CROSS_Z_SOURCE,
    J1004_Z_LENS: J1004_Z_LENS,
    J1004_Z_SOURCE: J1004_Z_SOURCE,
    PRESETS: PRESETS,
    formatSig: formatSig,
    primaryAngle: primaryAngle,
    anglesFromArcsec: anglesFromArcsec,
    gmOf: gmOf,
    deflection: deflection,
    einstein: einstein,
    imagePositions: imagePositions,
    magnification: magnification,
    imageMags: imageMags,
    uOfTime: uOfTime,
    lightCurve: lightCurve,
    scene: scene,
    formatMag: formatMag,
    formatU: formatU,
    formatInUnit: formatInUnit,
    angleUnit: angleUnit,
    formatKm: formatKm,
    formatSolarRadii: formatSolarRadii,
    formatAu: formatAu,
    formatKpc: formatKpc,
    formatMass: formatMass,
    presetById: presetById,
    fromUnit: fromUnit,
    toUnit: toUnit,
    explainSun: explainSun,
    explainJupiter: explainJupiter,
    explainEinstein: explainEinstein,
    explainScene: explainScene,
    explainOgle: explainOgle,
    explainLimits: explainLimits
  };
});
