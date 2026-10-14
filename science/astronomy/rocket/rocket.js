/*! Ideal rocket equation: Δv = ve · ln(m0/mf) = Isp · g0 · ln(m0/mf).
    g0 is the standard acceleration of gravity, 9.80665 m/s² exactly.
    It is the conventional factor in the definition of specific impulse.
    It is not the Earth Fact Sheet mean surface gravity, 9.820 m/s².
    Lengths of speed are km/s. Isp is seconds.
    The two mission Δv figures are the numbers already printed on the
    Oberth and Hohmann desks. This file does not invent a third mission.
    300 s and 450 s are classroom examples, not engine datasheets.
    Constant exhaust speed. No gravity losses. No drag. Not a mission. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Rocket = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var G0_MPS2 = 9.80665;
  var G0_KMS2 = 9.80665e-3;

  /* Printed on the Oberth desk: Δv to escape a 400 km classroom circle.
     Printed on the Hohmann desk: Earth→Mars total impulsive Δv. */
  var PRINTED = {
    escapeFrom400KmS: 3.178,
    earthMarsKmS: 5.594
  };

  var CLASSROOM_ISP = [
    {
      id: "chem300",
      isp: 300,
      label: "300 s · classroom chemical",
      note: "A classroom example near a storable chemical specific impulse. Not an engine datasheet and not a fact-sheet line."
    },
    {
      id: "lox450",
      isp: 450,
      label: "450 s · classroom LOX/LH2",
      note: "A classroom example near a LOX/LH2 vacuum-class specific impulse. Not an engine datasheet and not a fact-sheet line."
    }
  ];

  var DV_PRESETS = [
    {
      id: "esc400",
      dv: PRINTED.escapeFrom400KmS,
      label: "3.178 km/s · 400 km escape",
      note: "The Δv the Oberth desk prints for escape from a circular orbit 400 km above Earth’s volumetric mean radius. Reused here. Not recomputed."
    },
    {
      id: "emars",
      dv: PRINTED.earthMarsKmS,
      label: "5.594 km/s · Earth–Mars",
      note: "The total impulsive Δv the Hohmann desk prints for Earth to Mars. A mass-ratio comparison for that printed number. Not a Mars propellant load."
    }
  ];

  function veFromIsp(isp) {
    if (!(isp > 0) || !isFinite(isp)) return NaN;
    return isp * G0_KMS2;
  }

  function ispFromVe(veKmS) {
    if (!(veKmS > 0) || !isFinite(veKmS)) return NaN;
    return veKmS / G0_KMS2;
  }

  function massRatio(dv, ve) {
    if (!(ve > 0) || !isFinite(dv) || dv < 0) return NaN;
    return Math.exp(dv / ve);
  }

  function remainingFraction(dv, ve) {
    if (!(ve > 0) || !isFinite(dv) || dv < 0) return NaN;
    return Math.exp(-dv / ve);
  }

  function propellantFraction(dv, ve) {
    var remain = remainingFraction(dv, ve);
    if (!isFinite(remain)) return NaN;
    return 1 - remain;
  }

  function evaluate(dv, isp) {
    if (!isFinite(dv) || dv < 0 || !(isp > 0) || !isFinite(isp)) return null;
    var ve = veFromIsp(isp);
    var exponent = dv / ve;
    var overflow = exponent > 80;
    var ratio = overflow ? Infinity : Math.exp(exponent);
    var remaining = overflow ? 0 : Math.exp(-exponent);
    var propellant = overflow ? 1 : 1 - remaining;
    return {
      dv: dv,
      isp: isp,
      ve: ve,
      veMS: isp * G0_MPS2,
      exponent: exponent,
      ratio: ratio,
      remaining: remaining,
      propellant: propellant,
      overflow: overflow
    };
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + parts.join(".");
  }

  function fmtDv(v) {
    if (!isFinite(v)) return "—";
    return group(v, 3) + " km/s";
  }

  function fmtVe(v) {
    if (!isFinite(v)) return "—";
    return group(v, 3) + " km/s";
  }

  function fmtVeMS(v) {
    if (!isFinite(v)) return "—";
    return group(v, 4) + " m/s";
  }

  function fmtIsp(isp) {
    if (!(isp > 0) || !isFinite(isp)) return "—";
    var rounded = Math.round(isp * 1000) / 1000;
    if (Math.abs(rounded - Math.round(rounded)) < 5e-4) return group(Math.round(rounded), 0) + " s";
    var body = rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    var parts = body.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".") + " s";
  }

  function fmtRatio(r) {
    if (!isFinite(r) || !(r > 0)) return "—";
    if (r >= 1e6) {
      var exp = Math.floor(Math.log10(r));
      var mant = r / Math.pow(10, exp);
      return group(mant, 3) + " × 10^" + exp;
    }
    if (r < 10) return group(r, 3);
    if (r < 100) return group(r, 2);
    if (r < 1000) return group(r, 1);
    return group(r, 0);
  }

  function fmtFrac(f) {
    if (!isFinite(f)) return "—";
    return group(f, 4);
  }

  function fmtPct(f) {
    if (!isFinite(f)) return "—";
    return group(f * 100, 2) + "%";
  }

  function fmtExponent(x) {
    if (!isFinite(x)) return "—";
    return group(x, 4);
  }

  function classroomRows() {
    var rows = [];
    var i, j, d, s, res;
    for (i = 0; i < DV_PRESETS.length; i++) {
      d = DV_PRESETS[i];
      for (j = 0; j < CLASSROOM_ISP.length; j++) {
        s = CLASSROOM_ISP[j];
        res = evaluate(d.dv, s.isp);
        rows.push({
          dvId: d.id,
          ispId: s.id,
          dv: d.dv,
          isp: s.isp,
          dvLabel: d.label,
          ispLabel: s.label,
          result: res
        });
      }
    }
    return rows;
  }

  return {
    G0_MPS2: G0_MPS2,
    G0_KMS2: G0_KMS2,
    PRINTED: PRINTED,
    CLASSROOM_ISP: CLASSROOM_ISP,
    DV_PRESETS: DV_PRESETS,
    veFromIsp: veFromIsp,
    ispFromVe: ispFromVe,
    massRatio: massRatio,
    remainingFraction: remainingFraction,
    propellantFraction: propellantFraction,
    evaluate: evaluate,
    classroomRows: classroomRows,
    group: group,
    fmtDv: fmtDv,
    fmtVe: fmtVe,
    fmtVeMS: fmtVeMS,
    fmtIsp: fmtIsp,
    fmtRatio: fmtRatio,
    fmtFrac: fmtFrac,
    fmtPct: fmtPct,
    fmtExponent: fmtExponent
  };
});
