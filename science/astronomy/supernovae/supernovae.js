/*! Supernova decay power for a classroom desk.
    56Ni → 56Co → 56Fe. Not a light-curve fit and not radiative transfer.

    Half-lives, mean lives, and deposited energies are Nadyozhin 1994,
    ApJS 92, 527, taken from the full decay scheme of Huo et al. 1987
    as he prints them. This file does not re-reduce the nuclear data.

      56Ni half-life 6.10 d, mean life τ_Ni = 8.80 d
      56Co half-life 77.12 d, mean life τ_Co = 111.3 d
      Deposited energy per 56Ni decay: Q_Ni = 1.75 MeV (gamma rays)
      Deposited energy per 56Co decay: Q_Co = 3.73 MeV
        = 3.61 MeV in gamma rays + 0.12 MeV positron kinetic energy
      Neutrinos, 0.41 MeV and 0.84 MeV, are excluded. They escape.

    He also prints the mean lives as T_1/2 / ln 2. 6.10 / ln 2 rounds to
    8.80. 77.12 / ln 2 is 111.26, which he rounds to 111.3. The energy
    formula in his equation (19) uses 8.80 and 111.3, so this file does too.

    Number of nuclei in a solar mass of 56Ni: M☉ / (56 u). The 56 is the
    integer mass number in his equation (13). The atomic-mass defect is
    not applied.

    Bateman solution with N_Co(0) = 0, mean life τ = 1/λ:

      N_Ni = N0 exp(−t/τ_Ni)
      N_Co = N0 [τ_Co / (τ_Co − τ_Ni)] [exp(−t/τ_Co) − exp(−t/τ_Ni)]
      L_Ni = N_Ni Q_Ni / τ_Ni
      L_Co = N_Co Q_Co / τ_Co

    Full gamma-ray trapping: every gamma ray, including annihilation, and
    the positron kinetic energy, are counted as heat. Diffusion is not
    in these equations. The curve falls from t = 0.

    u and the elementary charge are the 2022 CODATA values used on the
    fusion desk. e is exact. One day is 86400 s. A solar mass is the
    IAU 2015 nominal GM☉ divided by the 2022 CODATA G, the same quotient
    the star-formation desk prints. The nominal solar luminosity is the
    IAU 2015 value, used only to quote L/L☉. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Supernovae = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var U_KG = 1.66053906892e-27;
  var E_C = 1.602176634e-19;
  var G = 6.67430e-11;
  var GM_SUN = 1.3271244e20;
  var M_SUN_KG = GM_SUN / G;
  var L_SUN_W = 3.828e26;
  var DAY_S = 86400;
  var ERG_PER_JOULE = 1e7;
  var A_NI = 56;

  /* Nadyozhin's printed mean lives, days. Not a fresh T_1/2 / ln 2. */
  var TAU_NI_D = 8.80;
  var TAU_CO_D = 111.3;
  var HALF_NI_D = 6.10;
  var HALF_CO_D = 77.12;

  /* Deposited energies, MeV per decay. Neutrinos are not in these. */
  var Q_NI_MEV = 1.75;
  var Q_CO_GAMMA_MEV = 3.61;
  var Q_CO_POSITRON_MEV = 0.12;
  var Q_CO_MEV = 3.73;
  var Q_NI_NU_MEV = 0.41;
  var Q_CO_NU_MEV = 0.84;

  /* His equation (19), erg s^−1 per solar mass, for the comparison only. */
  var NAD_A = 6.45e43;
  var NAD_B = 1.45e43;
  var NAD_CO_PEAK_D = 24.25;

  var MASS_MIN = 0.01;
  var MASS_MAX = 1;
  var DAY_MIN = 0;
  var DAY_MAX = 400;

  /* Timmes, Brown, and Truran 2003: a fiducial ≈ 0.6 M☉. The ≈ is theirs. */
  var FIDUCIAL_NI = 0.6;
  /* Suntzeff and Bouchet 1990: the 0.071 M☉ their models deposit in full. */
  var SN1987A_NI = 0.071;

  var MEV_J = 1e6 * E_C;
  var TAU_NI_S = TAU_NI_D * DAY_S;
  var TAU_CO_S = TAU_CO_D * DAY_S;
  var Q_NI_J = Q_NI_MEV * MEV_J;
  var Q_CO_J = Q_CO_MEV * MEV_J;
  var N_PER_MSUN = M_SUN_KG / (A_NI * U_KG);

  /* Combined coefficients, erg s^−1 per solar mass, from the same solution.
     L/M = A exp(−t/τ_Ni) + B exp(−t/τ_Co). */
  var B_PER_MSUN = (N_PER_MSUN * Q_CO_J / (TAU_CO_S - TAU_NI_S)) * ERG_PER_JOULE;
  var A_PER_MSUN = (N_PER_MSUN * Q_NI_J / TAU_NI_S) * ERG_PER_JOULE - B_PER_MSUN;

  var SUP = {
    "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
  };

  function sup(exp) {
    return String(exp).split("").map(function (c) { return SUP[c] || c; }).join("");
  }

  function sci(x, n) {
    if (!isFinite(x)) return "";
    if (x === 0) return "0";
    var sign = x < 0 ? "−" : "";
    var ax = Math.abs(x);
    var exp = Math.floor(Math.log10(ax));
    var man = ax / Math.pow(10, exp);
    var m = man.toFixed(n - 1);
    if (Number(m) >= 10) {
      m = (Number(m) / 10).toFixed(n - 1);
      exp += 1;
    }
    if (exp === 0) return sign + m;
    return sign + m + " × 10" + sup(exp);
  }

  function same(a, b) {
    return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b));
  }

  function formatMass(m) {
    if (same(m, FIDUCIAL_NI)) return "0.6";
    if (same(m, SN1987A_NI)) return "0.071";
    var n = Number(m.toPrecision(4));
    var t = n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    return t;
  }

  function formatDay(d) {
    var r = Math.round(d * 100) / 100;
    if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
    return r.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatRatio(ratio) {
    if (ratio == null || !isFinite(ratio)) return "undefined";
    if (ratio >= 0.001 && ratio < 1000) return ratio.toPrecision(4);
    return sci(ratio, 4);
  }

  function formatPercent(frac) {
    if (frac === 0) return "0%";
    if (!isFinite(frac)) return "";
    if (frac >= 0.00005) return (frac * 100).toFixed(2) + "%";
    return sci(frac * 100, 3) + "%";
  }

  function cobaltPeakDay() {
    return (TAU_NI_D * TAU_CO_D / (TAU_CO_D - TAU_NI_D)) * Math.log(TAU_CO_D / TAU_NI_D);
  }

  function validMass(m) {
    return typeof m === "number" && isFinite(m) && m >= MASS_MIN && m <= MASS_MAX;
  }

  function validDay(d) {
    return typeof d === "number" && isFinite(d) && d >= DAY_MIN && d <= DAY_MAX;
  }

  function parseMass(text) {
    if (typeof text !== "string") return NaN;
    var t = text.trim().replace(/,/g, "");
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    return Number(t);
  }

  function parseDay(text) {
    if (typeof text !== "string") return NaN;
    var t = text.trim().replace(/,/g, "");
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    return Number(t);
  }

  /* Watts. massSolar is solar masses of 56Ni. day is days since explosion. */
  function luminosity(massSolar, day) {
    if (!validMass(massSolar) || !validDay(day)) return null;
    var n0 = N_PER_MSUN * massSolar;
    var eNi = Math.exp(-day / TAU_NI_D);
    var eCo = Math.exp(-day / TAU_CO_D);
    var nNi = n0 * eNi;
    var nCo = day === 0 ? 0 : n0 * (TAU_CO_S / (TAU_CO_S - TAU_NI_S)) * (eCo - eNi);
    if (nCo < 0 && nCo > -1e-9 * n0) nCo = 0;
    var lNi = nNi * Q_NI_J / TAU_NI_S;
    var lCo = nCo * Q_CO_J / TAU_CO_S;
    var tot = lNi + lCo;
    return {
      mass: massSolar,
      day: day,
      nNi: nNi,
      nCo: nCo,
      niW: lNi,
      coW: lCo,
      totW: tot,
      niErg: lNi * ERG_PER_JOULE,
      coErg: lCo * ERG_PER_JOULE,
      totErg: tot * ERG_PER_JOULE,
      ratio: lCo === 0 ? null : lNi / lCo,
      fracNi: tot === 0 ? null : lNi / tot,
      fracCo: tot === 0 ? null : lCo / tot,
      lsun: tot / L_SUN_W
    };
  }

  /* Combined form, erg/s. Used to check the split against one expression. */
  function combinedErg(massSolar, day) {
    return massSolar * (A_PER_MSUN * Math.exp(-day / TAU_NI_D) + B_PER_MSUN * Math.exp(-day / TAU_CO_D));
  }

  function samples(massSolar, count) {
    var n = count || 401;
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      var day = DAY_MAX * (n === 1 ? 0 : i / (n - 1));
      var L = luminosity(massSolar, day);
      out.push({ day: day, niErg: L.niErg, coErg: L.coErg, totErg: L.totErg });
    }
    return out;
  }

  function massError(m) {
    if (!isFinite(m)) return "Nickel mass from 0.01 to 1 solar mass. A typed word is not a mass.";
    if (m < MASS_MIN || m > MASS_MAX) return "Nickel mass from 0.01 to 1 solar mass. Outside that window the slider stops. It is not a physical limit.";
    return "";
  }

  function dayError(d) {
    if (!isFinite(d)) return "Day from 0 to 400. A typed word is not a day.";
    if (d < DAY_MIN || d > DAY_MAX) return "Day from 0 to 400. The chart stops at 400.";
    return "";
  }

  var LIMITS = "Educational calculator. Not a radiative-transfer model, not a light-curve fit, and not a catalog. The power is the two-step Bateman solution for 56Ni → 56Co → 56Fe. Half-lives 6.10 d and 77.12 d, mean lives 8.80 d and 111.3 d, and deposited energies 1.75 MeV and 3.73 MeV are Nadyozhin 1994. Full gamma-ray trapping: gamma rays and positron kinetic energy are deposited, and neutrinos are not. Diffusion is not computed. The curve falls from day 0. The observed peak is shaped by diffusion. Arnett’s rule is named on the chart and is not given a day here.";

  function scene(o) {
    o = o || {};
    var mass = o.mass == null ? FIDUCIAL_NI : o.mass;
    var day = o.day == null ? NAD_CO_PEAK_D : o.day;
    var preset = o.preset || "";
    if (preset === "ia") mass = FIDUCIAL_NI;
    if (preset === "sn1987a") mass = SN1987A_NI;
    var err = massError(mass) || dayError(day);
    if (err) {
      return { ok: false, error: err, mass: mass, day: day, preset: preset, limits: LIMITS };
    }
    var L = luminosity(mass, day);
    var massText = formatMass(mass);
    var dayText = formatDay(day);
    var totalText = sci(L.totErg, 6) + " erg/s";
    var niText = sci(L.niErg, 6) + " erg/s";
    var coText = sci(L.coErg, 6) + " erg/s";
    var ratioText = L.ratio == null ? "undefined" : formatRatio(L.ratio);
    var fracText = "Ni " + formatPercent(L.fracNi) + " · Co " + formatPercent(L.fracCo);
    var lsunText = sci(L.lsun, 6) + " L☉";
    var peak = cobaltPeakDay();
    var why;
    var note;
    if (preset === "sn1987a" || (same(mass, SN1987A_NI) && preset !== "ia")) {
      why = "SN 1987A is 0.071 solar masses of 56Ni. Suntzeff and Bouchet 1990 use that mass for a model that deposits the decay energy in full. They give the range 0.055–0.090 from the distance modulus and the reddening. The day-125.7 conversion they quote is 0.071 from Woosley 1988. This page has not re-read Woosley 1988. Arnett and Fu 1989 fit 0.073 ± 0.015. The button is 0.071. The two fits are not averaged.";
    } else if (same(mass, FIDUCIAL_NI)) {
      why = "The fiducial is 0.6 solar masses of 56Ni. Timmes, Brown, and Truran 2003 say the average peak B and V magnitudes of nearby Type Ia supernovae strongly imply that a fiducial event produces ≈ 0.6 M☉. The ≈ is theirs. They cite Saha et al. 1999 and Gibson et al. 2000. This page has not re-read those two. This is not the nickel mass of one named supernova.";
    } else {
      why = "The mass on the slider is " + massText + " solar masses of 56Ni. It is not a named supernova. The two buttons are the only cited masses.";
    }
    note = "Day " + dayText + ". Nadyozhin’s cobalt-number maximum, from his 8.80 d and 111.3 d, recomputes to " + peak.toFixed(4) + " days, which rounds to the 24.25 days he prints. That day is when the cobalt count is highest. It is not the optical peak. Full trapping. Neutrinos stay out: 0.41 MeV per nickel decay and 0.84 MeV per cobalt decay. Deposited energy is 1.75 MeV and 3.73 MeV. By day 800 of SN 1987A, Suntzeff and Bouchet say more than half the bolometric flux was escaping as high-energy photons. This curve does not remove that leak.";
    var aria = "Log decay power from day 0 to day 400. Nickel mass " + massText + " solar masses. At day " + dayText + " the total is " + totalText + ", nickel " + niText + ", cobalt " + coText + ". Nickel over cobalt is " + ratioText + ". " + fracText + ". Full gamma-ray trapping. Arnett’s rule: the real peak is set by diffusion, and this curve does not compute it.";
    return {
      ok: true,
      error: "",
      mass: mass,
      day: day,
      preset: same(mass, FIDUCIAL_NI) ? "ia" : (same(mass, SN1987A_NI) ? "sn1987a" : ""),
      L: L,
      limits: LIMITS,
      text: {
        mass: massText,
        day: dayText,
        total: totalText,
        ni: niText,
        co: coText,
        ratio: ratioText,
        frac: fracText,
        lsun: lsunText,
        why: why,
        note: note,
        aria: aria
      }
    };
  }

  return {
    U_KG: U_KG,
    E_C: E_C,
    G: G,
    GM_SUN: GM_SUN,
    M_SUN_KG: M_SUN_KG,
    L_SUN_W: L_SUN_W,
    DAY_S: DAY_S,
    A_NI: A_NI,
    TAU_NI_D: TAU_NI_D,
    TAU_CO_D: TAU_CO_D,
    HALF_NI_D: HALF_NI_D,
    HALF_CO_D: HALF_CO_D,
    Q_NI_MEV: Q_NI_MEV,
    Q_CO_GAMMA_MEV: Q_CO_GAMMA_MEV,
    Q_CO_POSITRON_MEV: Q_CO_POSITRON_MEV,
    Q_CO_MEV: Q_CO_MEV,
    Q_NI_NU_MEV: Q_NI_NU_MEV,
    Q_CO_NU_MEV: Q_CO_NU_MEV,
    NAD_A: NAD_A,
    NAD_B: NAD_B,
    NAD_CO_PEAK_D: NAD_CO_PEAK_D,
    N_PER_MSUN: N_PER_MSUN,
    A_PER_MSUN: A_PER_MSUN,
    B_PER_MSUN: B_PER_MSUN,
    MASS_MIN: MASS_MIN,
    MASS_MAX: MASS_MAX,
    DAY_MIN: DAY_MIN,
    DAY_MAX: DAY_MAX,
    FIDUCIAL_NI: FIDUCIAL_NI,
    SN1987A_NI: SN1987A_NI,
    LIMITS: LIMITS,
    sci: sci,
    formatMass: formatMass,
    formatDay: formatDay,
    cobaltPeakDay: cobaltPeakDay,
    validMass: validMass,
    validDay: validDay,
    parseMass: parseMass,
    parseDay: parseDay,
    luminosity: luminosity,
    combinedErg: combinedErg,
    samples: samples,
    scene: scene
  };
});
