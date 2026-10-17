/*! Redshift desk: spectroscopic z, the two Doppler readings, and a nearby Hubble toy.
    Wavelengths are the NIST figures named in the sources. c is the defined SI value.
    H0 values are the central numbers from Planck 2018 and Riess et al. 2022.
    Classroom schematic. Not a catalog spectrum and not a cosmological distance. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Redshift = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Defined SI speed of light. NIST CODATA: exactly 299792458 m/s. */
  var C_M_S = 299792458;
  var C_KM_S = C_M_S / 1000;

  /* NASA Imagine the Universe classroom optical window, same cut as the
     blackbody and EM-spectrum desks. Boundaries are a convention. */
  var VIS_MIN_NM = 400;
  var VIS_MAX_NM = 700;

  /* Observed-wavelength window drawn on the chart, nanometres, log axis. */
  var AXIS_MIN_NM = 80;
  var AXIS_MAX_NM = 10000;

  var Z_MIN = -0.01;
  var Z_MAX = 11;
  var Z_PIVOT = 0.05;

  var D_MIN_MPC = 0;
  var D_MAX_MPC = 100;

  /* Planck Collaboration 2020, A&A 641, A6, abstract: base-ΛCDM
     H0 = (67.4 ± 0.5) km s−1 Mpc−1. */
  var H0_PLANCK = 67.4;
  var H0_PLANCK_ERR = 0.5;

  /* Riess et al. 2022, ApJL 934, L7: baseline H0 = 73.04 ± 1.04 km s−1 Mpc−1. */
  var H0_SHOES = 73.04;
  var H0_SHOES_ERR = 1.04;

  /* NIST compendium, main series of hydrogen. Below 2000 Å the value is
     vacuum; above 2000 Å it is air. Customary unresolved wavelengths:
     Lyα 1215.67 Å, Hβ 4861.32 Å, Hα 6562.80 Å.
     Ca II resonance lines, NIST persistent-line table, air:
     3933.6614 Å (K) and 3968.4673 Å (H). Fraunhofer’s letters are
     Linsky & Avrett 1970. */
  var LINES = [
    { id: "lya", name: "Lyα", ion: "H I", restNm: 121.567, medium: "vacuum", letter: "" },
    { id: "cak", name: "Ca II K", ion: "Ca II", restNm: 393.36614, medium: "air", letter: "K" },
    { id: "cah", name: "Ca II H", ion: "Ca II", restNm: 396.84673, medium: "air", letter: "H" },
    { id: "hb", name: "Hβ", ion: "H I", restNm: 486.132, medium: "air", letter: "" },
    { id: "ha", name: "Hα", ion: "H I", restNm: 656.280, medium: "air", letter: "" }
  ];

  var PRESETS = [
    {
      id: "rest",
      name: "Rest",
      z: 0,
      object: false
    },
    {
      id: "m31",
      name: "Andromeda",
      z: -0.001,
      object: true
    },
    {
      id: "n4258",
      name: "NGC 4258",
      z: 0.00158,
      object: true
    },
    {
      id: "3c273",
      name: "3C 273",
      z: 0.15756751,
      object: true
    },
    {
      id: "gnz11",
      name: "GN-z11",
      z: 10.6034,
      object: true
    }
  ];

  var H0_CHOICES = [
    { id: "planck", name: "Planck 2018", h0: H0_PLANCK, err: H0_PLANCK_ERR },
    { id: "shoes", name: "SH0ES 2022", h0: H0_SHOES, err: H0_SHOES_ERR }
  ];

  function lines() {
    return LINES.map(function (line) {
      return {
        id: line.id,
        name: line.name,
        ion: line.ion,
        restNm: line.restNm,
        medium: line.medium,
        letter: line.letter
      };
    });
  }

  function lineById(id) {
    var i;
    for (i = 0; i < LINES.length; i++) {
      if (LINES[i].id === id) return lines()[i];
    }
    return null;
  }

  function presets() {
    return PRESETS.map(function (p) {
      return { id: p.id, name: p.name, z: p.z, object: p.object };
    });
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return presets()[i];
    }
    return null;
  }

  function h0Choices() {
    return H0_CHOICES.map(function (h) {
      return { id: h.id, name: h.name, h0: h.h0, err: h.err };
    });
  }

  function zOk(z) {
    return typeof z === "number" && isFinite(z) && z > -1 && z >= Z_MIN && z <= Z_MAX;
  }

  function dOk(d) {
    return typeof d === "number" && isFinite(d) && d >= D_MIN_MPC && d <= D_MAX_MPC;
  }

  /* λ_obs = λ_rest (1 + z). Hogg 1999, eq. 8, rearranged. */
  function observedNm(restNm, z) {
    return restNm * (1 + z);
  }

  /* Special-relativistic radial Doppler, Hogg 1999 eq. 9:
     1 + z = sqrt((1+β)/(1−β)), β = v/c, positive β receding.
     Solved: β = ((1+z)² − 1) / ((1+z)² + 1). */
  function relativisticBeta(z) {
    if (!(typeof z === "number" && isFinite(z) && z > -1)) return NaN;
    var zp = 1 + z;
    var zp2 = zp * zp;
    return (zp2 - 1) / (zp2 + 1);
  }

  function zFromBeta(beta) {
    if (!(typeof beta === "number" && isFinite(beta) && beta > -1 && beta < 1)) return NaN;
    return Math.sqrt((1 + beta) / (1 - beta)) - 1;
  }

  /* Non-relativistic product. Surveys print this as a velocity even when
     it is not a speed. Hogg 1999, eq. 11. */
  function czKmS(z) {
    return C_KM_S * z;
  }

  function relativisticKmS(z) {
    return relativisticBeta(z) * C_KM_S;
  }

  /* ( |c·z| − |v_rel| ) / |v_rel|. Positive: c·z has the larger magnitude. */
  function speedGap(z) {
    var vRel = relativisticKmS(z);
    var vCz = czKmS(z);
    if (!isFinite(vRel) || vRel === 0) return 0;
    return (Math.abs(vCz) - Math.abs(vRel)) / Math.abs(vRel);
  }

  /* Cosmological redshift: 1 + z = a(t_now) / a(t_then). Hogg 1999, eq. 12.
     Returns a_then / a_now. Not a Doppler velocity. */
  function scaleThenOverNow(z) {
    if (!(typeof z === "number" && isFinite(z) && z > -1)) return NaN;
    return 1 / (1 + z);
  }

  function bandOf(nm) {
    if (nm >= VIS_MIN_NM && nm <= VIS_MAX_NM) return "visible";
    if (nm < VIS_MIN_NM) return "ultraviolet";
    return "infrared";
  }

  function onAxis(nm) {
    return nm >= AXIS_MIN_NM && nm <= AXIS_MAX_NM;
  }

  function lineState(z) {
    return LINES.map(function (line) {
      var obs = observedNm(line.restNm, z);
      return {
        id: line.id,
        name: line.name,
        restNm: line.restNm,
        obsNm: obs,
        medium: line.medium,
        band: bandOf(obs),
        onAxis: onAxis(obs)
      };
    });
  }

  /* asinh slider so Andromeda and GN-z11 are both reachable. u in [0, 1]. */
  function zFromUnit(u) {
    var t = Math.min(1, Math.max(0, u));
    var a = Math.asinh(Z_MIN / Z_PIVOT);
    var b = Math.asinh(Z_MAX / Z_PIVOT);
    return Z_PIVOT * Math.sinh(a + t * (b - a));
  }

  function unitFromZ(z) {
    var a = Math.asinh(Z_MIN / Z_PIVOT);
    var b = Math.asinh(Z_MAX / Z_PIVOT);
    var s = Math.asinh(z / Z_PIVOT);
    return (s - a) / (b - a);
  }

  /* Nearby Hubble law: v = H0 · d, and z ≈ v/c. Hogg 1999, eq. 11.
     d in Mpc, H0 in km s−1 Mpc−1, v in km/s. */
  function hubbleVelocity(h0, dMpc) {
    return h0 * dMpc;
  }

  function hubbleZ(h0, dMpc) {
    return hubbleVelocity(h0, dMpc) / C_KM_S;
  }

  function formatZ(z) {
    if (!isFinite(z)) return "—";
    if (z === 0) return "0";
    var neg = z < 0;
    var a = Math.abs(z);
    var digits = a >= 10 ? 4 : a >= 0.1 ? 8 : 6;
    var text = trimZeros(a.toFixed(digits));
    return (neg ? "-" : "") + text;
  }

  function trimZeros(s) {
    if (s.indexOf(".") < 0) return s;
    return s.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatSigned(n, digits) {
    if (!isFinite(n)) return "—";
    var neg = n < 0;
    var text = Math.abs(n).toFixed(digits);
    text = group(text);
    return (neg ? "-" : "") + text;
  }

  function group(numStr) {
    var parts = String(numStr).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function formatSpeed(v) {
    if (!isFinite(v)) return "—";
    var neg = v < 0;
    var digits = Math.abs(v) >= 1e6 ? 0 : 2;
    var text = group(trimZeros(Math.abs(v).toFixed(digits)));
    return (neg ? "-" : "") + text + " km/s";
  }

  function formatBeta(beta) {
    if (!isFinite(beta)) return "—";
    var neg = beta < 0;
    var text = trimZeros(Math.abs(beta).toFixed(6));
    return (neg ? "-" : "") + text;
  }

  function formatGap(frac) {
    if (!isFinite(frac)) return "—";
    var pct = Math.abs(frac) * 100;
    var digits = pct >= 10 ? 1 : 2;
    return pct.toFixed(digits) + "%";
  }

  function formatScale(r) {
    if (!isFinite(r)) return "—";
    if (r === 1) return "1";
    return trimZeros(r.toFixed(6));
  }

  function formatNm(nm) {
    if (!isFinite(nm)) return "—";
    if (Math.abs(nm) >= 1000) return trimZeros(nm.toFixed(1)) + " nm";
    var text = trimZeros(nm.toFixed(5));
    var bits = text.split(".");
    var frac = bits[1] || "";
    while (frac.length < 3) frac += "0";
    return bits[0] + "." + frac + " nm";
  }

  return {
    C_M_S: C_M_S,
    C_KM_S: C_KM_S,
    VIS_MIN_NM: VIS_MIN_NM,
    VIS_MAX_NM: VIS_MAX_NM,
    AXIS_MIN_NM: AXIS_MIN_NM,
    AXIS_MAX_NM: AXIS_MAX_NM,
    Z_MIN: Z_MIN,
    Z_MAX: Z_MAX,
    Z_PIVOT: Z_PIVOT,
    D_MIN_MPC: D_MIN_MPC,
    D_MAX_MPC: D_MAX_MPC,
    H0_PLANCK: H0_PLANCK,
    H0_PLANCK_ERR: H0_PLANCK_ERR,
    H0_SHOES: H0_SHOES,
    H0_SHOES_ERR: H0_SHOES_ERR,
    lines: lines,
    lineById: lineById,
    presets: presets,
    presetById: presetById,
    h0Choices: h0Choices,
    zOk: zOk,
    dOk: dOk,
    observedNm: observedNm,
    relativisticBeta: relativisticBeta,
    zFromBeta: zFromBeta,
    czKmS: czKmS,
    relativisticKmS: relativisticKmS,
    speedGap: speedGap,
    scaleThenOverNow: scaleThenOverNow,
    bandOf: bandOf,
    onAxis: onAxis,
    lineState: lineState,
    zFromUnit: zFromUnit,
    unitFromZ: unitFromZ,
    hubbleVelocity: hubbleVelocity,
    hubbleZ: hubbleZ,
    formatZ: formatZ,
    formatSpeed: formatSpeed,
    formatBeta: formatBeta,
    formatGap: formatGap,
    formatScale: formatScale,
    formatNm: formatNm
  };
});
