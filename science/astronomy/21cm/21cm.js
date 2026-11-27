/*! 21-cm hydrogen hyperfine line.

    Rest frequency: Hellwig et al. 1970, 1,420,405,751.768 Hz.
    Wavelength, photon energy, and hν/k use that frequency and the exact
    SI values of c, h, k, and e (CODATA 2018).

    Cosmological redshift: f = f_rest / (1+z), the same z as
    z = (λ_obs − λ_rest) / λ_rest.

    Velocity mode uses the radio convention,
    v = c (f_rest − f_obs) / f_rest,
    so f_obs = f_rest (1 − v/c), with v positive for recession.
    The optical convention and the special-relativistic Doppler shift
    are computed beside it and are not substituted.

    Optically thin column:
    N_HI = 1.823e18 cm^-2 × ∫ T_B dv, with dv in km/s and T_B in K.
    A Gaussian integral is √(π / (4 ln 2)) × T_peak × FWHM.

    The Einstein A coefficient on this page is the approximate
    2.85e-15 s^-1. The lifetime is 1/A. The column prefactor is the
    printed 1.823e18 and is not re-derived from that rounded A.
    Not a survey reduction. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Hydrogen21 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Hellwig, Vessot, Levine, Zitzewitz, Allan, and Glaze 1970,
     IEEE Trans. Instrum. Meas. 19, 200. Central value. The paper's
     one-sigma uncertainty is 0.002 Hz. A later digit is not substituted. */
  var F_MHZ = 1420.405751768;

  /* Exact SI defining constants, CODATA 2018. */
  var C_M = 299792458;
  var C_KM = 299792.458;
  var H_PLANCK = 6.62607015e-34;
  var K_B = 1.380649e-23;
  var Q_E = 1.602176634e-19;

  /* Condon and Ransom, Essential Radio Astronomy, eq. 7.146.
     An approximate magnetic-dipole coefficient, not a CODATA constant. */
  var A10 = 2.85e-15;

  /* Julian year, the same 365.25 × 86,400 s the rotation-curve desk uses. */
  var YEAR_S = 365.25 * 86400;

  /* Optically thin limit printed by Chengalur, Kanekar, and Roy 2013
     and by Saha, Roy, and Bhattacharya 2018. Condon and Ransom print
     1.82e18. That rounding is not substituted. */
  var N_FACTOR = 1.823e18;

  /* ∫ Gaussian = T_peak × FWHM × √(π / (4 ln 2)). */
  var GAUSS = Math.sqrt(Math.PI / (4 * Math.LN2));

  var Z_MIN = 0;
  var Z_MAX = 20;
  var V_MIN = -1000;
  var V_MAX = 5000;
  var T_MIN = 1;
  var T_MAX = 150;
  var W_MIN = 1;
  var W_MAX = 80;

  /* FCC FM broadcast allocation shaded on the chart. */
  var FM_LO = 88;
  var FM_HI = 108;

  /* Teaching window for the epoch of reionization. The Planck 2018
     midpoint sits inside it and is not the whole window. */
  var EOR_LO = 6;
  var EOR_HI = 10;

  /* Planck 2018 results VI, Table 2, column TT,TE,EE+lowE+lensing.
     The same column the CMB desk uses for z*. Central value only. */
  var Z_RE = 7.67;

  var Z_DAWN = 17;
  var Z_VIRGO = 0.004;

  /* SIMBAD / McConnachie 2012, the integer the redshift desk already quotes:
     radial velocity −300.0 ± 4.0 km/s. Heliocentric. */
  var V_ANDROMEDA = -300;

  /* Binggeli, Popescu, and Tammann 1993. Mean heliocentric velocity.
     Not equal to c × 0.004. Not substituted for the round redshift. */
  var V_VIRGO_MEAN = 1050;

  /* Bowman et al. 2018 center, MHz. A claimed profile, not this preset. */
  var EDGES_MHZ = 78;

  var T_OPEN = 100;
  var W_OPEN = 10;

  var PRESETS = [
    { id: "milky-way", name: "Milky Way", mode: "z", z: 0, v: 0 },
    { id: "andromeda", name: "Andromeda", mode: "v", z: 0, v: V_ANDROMEDA },
    { id: "virgo", name: "Virgo", mode: "z", z: Z_VIRGO, v: 0 },
    { id: "eor", name: "Reionization", mode: "z", z: Z_RE, v: 0 },
    { id: "dawn", name: "Cosmic Dawn", mode: "z", z: Z_DAWN, v: 0 }
  ];

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function zOk(z) {
    return finite(z) && z >= Z_MIN && z <= Z_MAX;
  }

  function vOk(v) {
    return finite(v) && v >= V_MIN && v <= V_MAX;
  }

  function tOk(t) {
    return finite(t) && t >= T_MIN && t <= T_MAX;
  }

  function wOk(w) {
    return finite(w) && w >= W_MIN && w <= W_MAX;
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var bits = s.split(".");
    bits[0] = bits[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + bits.join(".");
  }

  function formatMHz(mhz) {
    return group(mhz, 3);
  }

  function formatMHz4(mhz) {
    return group(mhz, 4);
  }

  function formatCm(cm) {
    return group(cm, 6);
  }

  function formatUeV(x) {
    return group(x, 5);
  }

  function formatKelvin(x) {
    return group(x, 6);
  }

  function formatZ(z) {
    if (!finite(z) || Math.abs(z) < 5e-13) return "0";
    var s = z.toFixed(4);
    return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function formatV(v) {
    var digits = Math.abs(v - Math.round(v)) < 1e-6 ? 0 : 2;
    return group(v, digits);
  }

  function formatSci(n, digits) {
    var exp = Math.floor(Math.log10(Math.abs(n)));
    var mant = n / Math.pow(10, exp);
    var s = mant.toFixed(digits);
    if (s.charAt(0) === "1" && s.charAt(1) === "0") {
      exp += 1;
      s = (mant / 10).toFixed(digits);
    }
    var sign = exp < 0 ? "−" : "";
    return s + "×10^" + sign + Math.abs(exp);
  }

  function rest() {
    var hz = F_MHZ * 1e6;
    var lambdaM = C_M / hz;
    var energyJ = H_PLANCK * hz;
    return {
      mhz: F_MHZ,
      hz: hz,
      cm: lambdaM * 100,
      m: lambdaM,
      uEv: energyJ / Q_E * 1e6,
      kelvin: energyJ / K_B,
      a10: A10,
      lifeS: 1 / A10,
      lifeYr: (1 / A10) / YEAR_S
    };
  }

  function observeZ(z) {
    var base = rest();
    var mhz = F_MHZ / (1 + z);
    return {
      z: z,
      mhz: mhz,
      cm: base.cm * (1 + z),
      m: base.m * (1 + z)
    };
  }

  function observeV(v) {
    var beta = v / C_KM;
    return {
      v: v,
      beta: beta,
      radio: F_MHZ * (1 - beta),
      optical: F_MHZ / (1 + beta),
      relativistic: F_MHZ * Math.sqrt((1 - beta) / (1 + beta))
    };
  }

  function shiftKHz(v) {
    return Math.abs(F_MHZ - observeV(v).radio) * 1000;
  }

  function kHzPerKms() {
    return F_MHZ / C_KM * 1000;
  }

  function column(tPeak, fwhm) {
    var integral = GAUSS * tPeak * fwhm;
    return {
      tPeak: tPeak,
      fwhm: fwhm,
      gauss: GAUSS,
      integral: integral,
      nHi: N_FACTOR * integral
    };
  }

  function zAtMHz(mhz) {
    return F_MHZ / mhz - 1;
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  function matchedPreset(mode, z, v) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      if (p.mode !== mode) continue;
      if (mode === "z" && Math.abs(p.z - z) < 5e-7) return p;
      if (mode === "v" && Math.abs(p.v - v) < 0.05) return p;
    }
    return null;
  }

  function chartSamples(count) {
    var n = count || 201;
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      var z = n === 1 ? 0 : Z_MAX * (i / (n - 1));
      out.push({ z: z, mhz: F_MHZ / (1 + z) });
    }
    return out;
  }

  function markers() {
    return [
      { id: "milky-way", z: 0, label: "Milky Way" },
      { id: "virgo", z: Z_VIRGO, label: "Virgo" },
      { id: "eor", z: Z_RE, label: "z_re" },
      { id: "dawn", z: Z_DAWN, label: "z = 17" }
    ];
  }

  function opening() {
    return {
      mode: "z",
      z: 0,
      v: 0,
      tPeak: T_OPEN,
      fwhm: W_OPEN
    };
  }

  function tier(state) {
    var hit = matchedPreset(state.mode, state.z, state.v);
    if (hit) return hit.name;
    if (state.mode === "v") return "Velocity";
    return "Redshift";
  }

  function sense(state) {
    if (state.mode === "v") return "Radio convention · " + formatV(state.v) + " km/s";
    return "z = " + formatZ(state.z);
  }

  function titleMHz(state) {
    if (state.mode === "v") return formatMHz(observeV(state.v).radio);
    return formatMHz(observeZ(state.z).mhz);
  }

  function why(state) {
    var base = rest();
    var col = column(state.tPeak, state.fwhm);
    var parts = [];
    if (state.mode === "v") {
      var vel = observeV(state.v);
      parts.push("Radio convention. The observed frequency is the rest frequency times (1 − v/c), " + formatMHz(vel.radio) + " MHz here. Recession is positive.");
      parts.push("The optical convention, f_rest / (1 + v/c), is " + formatMHz4(vel.optical) + " MHz. The special-relativistic Doppler shift is " + formatMHz4(vel.relativistic) + " MHz. Neither is substituted for the radio value.");
      parts.push("One kilometer per second on this convention moves the line by " + group(kHzPerKms(), 3) + " kHz. At 1 km/s the radio frequency is " + formatMHz(observeV(1).radio) + " MHz.");
      if (Math.abs(state.v - V_ANDROMEDA) < 0.05) {
        parts.push("−300 km/s is the heliocentric radial velocity SIMBAD quotes for M31, −300.0 ± 4.0 km/s, from McConnachie 2012. The redshift desk sets z = −0.001. That redshift gives " + formatMHz4(observeZ(-0.001).mhz) + " MHz. It is not this radio frequency, " + formatMHz4(vel.radio) + " MHz.");
        parts.push("This is the Doppler shift of the line as seen from the Sun. It is not the Milky Way–Andromeda approach speed after the Sun’s motion is removed.");
      }
    } else {
      var obs = observeZ(state.z);
      parts.push("Cosmological redshift. The observed frequency is the rest frequency divided by (1+z), " + formatMHz(obs.mhz) + " MHz here. The wavelength is the rest wavelength times (1+z), " + formatCm(obs.cm) + " cm.");
      if (Math.abs(state.z) < 5e-13) {
        parts.push("z = 0 is the rest frame. The unrounded frequency is 1420.405751768 MHz. Rounded to 0.001 MHz it is " + formatMHz(base.mhz) + " MHz. That rounding is not a second measurement.");
        parts.push("The wavelength is " + formatCm(base.cm) + " cm, which is 21.106 cm when rounded to 0.001 cm. The photon energy is " + formatUeV(base.uEv) + " µeV, which rounds to 5.874 µeV. hν/k is " + formatKelvin(base.kelvin) + " K, which rounds to 0.0682 K. The rounded figures are not substituted.");
      }
      if (Math.abs(state.z - Z_VIRGO) < 5e-7) {
        parts.push("z = 0.004 is a round teaching redshift near the Virgo cluster. c × 0.004 is " + formatV(Z_VIRGO * C_KM) + " km/s. Binggeli, Popescu, and Tammann 1993 give a mean heliocentric velocity of 1050 ± 35 km/s, which is z = " + group(V_VIRGO_MEAN / C_KM, 6) + " if that speed is read as c z. 0.004 is not that redshift. They are not substituted.");
      }
      if (Math.abs(state.z - Z_RE) < 5e-7) {
        parts.push("7.67 is the central value of z_re in Planck 2018 results VI, Table 2, column TT,TE,EE+lowE+lensing, the same column the CMB desk uses for z*. The uncertainty there is ±0.73. The chart band from z = 6 to z = 10 is the usual teaching window, not a measurement of the edges. At z = 6 the line is " + formatMHz(observeZ(6).mhz) + " MHz. At z = 10 it is " + formatMHz(observeZ(10).mhz) + " MHz.");
      }
      if (Math.abs(state.z - Z_DAWN) < 5e-7) {
        parts.push("z = 17 is a round Cosmic Dawn mark. It prints " + formatMHz(obs.mhz) + " MHz, about 78.91 MHz. Bowman et al. 2018 reported an absorption profile centered at 78 MHz. On this frequency that center is z = " + formatZ(zAtMHz(EDGES_MHZ)) + ". 17 and " + formatZ(zAtMHz(EDGES_MHZ)) + " are not the same redshift. Hills et al. 2018 and Singh et al. 2022 (SARAS 3) dispute the profile. This page does not claim a detection.");
      }
    }
    parts.push("The Einstein A coefficient used here is 2.85×10^−15 s^−1. The lifetime is 1/A: " + formatSci(base.lifeS, 5) + " s, or " + formatSci(base.lifeYr, 5) + " Julian years of 31,557,600 s. About 1.1×10^7 years is that figure rounded. It is not substituted. Condon and Ransom’s 3.5×10^14 s and 11 million years are the same rounding. They are not substituted.");
    parts.push("An isolated atom almost never emits. The line is seen because a galactic sightline holds an enormous number of atoms, and because collisions keep the hyperfine levels populated. The critical density is far below a typical interstellar density, so the upper level does not empty and then wait out the radiative lifetime.");
    parts.push("The column illustration is optically thin gas, not a named cloud. Peak " + group(state.tPeak, Math.abs(state.tPeak - Math.round(state.tPeak)) < 1e-6 ? 0 : 2) + " K and a Gaussian FWHM of " + group(state.fwhm, Math.abs(state.fwhm - Math.round(state.fwhm)) < 1e-6 ? 0 : 2) + " km/s. The integral is " + group(GAUSS, 6) + " × T_peak × FWHM = " + group(col.integral, 3) + " K km/s. 1.0645 is the rounding of that factor and is not substituted. N_HI = 1.823×10^18 × that integral = " + formatSci(col.nHi, 5) + " cm^−2.");
    parts.push("Not a survey.");
    return parts.join(" ");
  }

  function limitsNote() {
    return "Educational calculator. The rest frequency is Hellwig et al. 1970, 1420.405751768 MHz, uncertainty 0.002 Hz. Wavelength, photon energy, and hν/k are computed from that frequency and the exact SI constants c, h, k, and e. The Einstein A coefficient is the approximate 2.85×10^−15 s^−1. The column density is the optically thin formula and is not a correction for optical depth. Redshift is f_rest/(1+z). The velocity mode uses the radio convention. Andromeda’s −300 km/s is a heliocentric radial velocity, not the Milky Way–M31 approach speed. The EDGES 78 MHz profile is a claimed and disputed result. Not a survey reduction and not a detection claim.";
  }

  return {
    F_MHZ: F_MHZ,
    C_M: C_M,
    C_KM: C_KM,
    H_PLANCK: H_PLANCK,
    K_B: K_B,
    Q_E: Q_E,
    A10: A10,
    YEAR_S: YEAR_S,
    N_FACTOR: N_FACTOR,
    GAUSS: GAUSS,
    Z_MIN: Z_MIN,
    Z_MAX: Z_MAX,
    V_MIN: V_MIN,
    V_MAX: V_MAX,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    W_MIN: W_MIN,
    W_MAX: W_MAX,
    FM_LO: FM_LO,
    FM_HI: FM_HI,
    EOR_LO: EOR_LO,
    EOR_HI: EOR_HI,
    Z_RE: Z_RE,
    Z_DAWN: Z_DAWN,
    Z_VIRGO: Z_VIRGO,
    V_ANDROMEDA: V_ANDROMEDA,
    V_VIRGO_MEAN: V_VIRGO_MEAN,
    EDGES_MHZ: EDGES_MHZ,
    T_OPEN: T_OPEN,
    W_OPEN: W_OPEN,
    PRESETS: PRESETS,
    zOk: zOk,
    vOk: vOk,
    tOk: tOk,
    wOk: wOk,
    formatMHz: formatMHz,
    formatMHz4: formatMHz4,
    formatCm: formatCm,
    formatUeV: formatUeV,
    formatKelvin: formatKelvin,
    formatZ: formatZ,
    formatV: formatV,
    formatSci: formatSci,
    formatIntegral: function (n) { return group(n, 3); },
    formatKHz: function (n) { return group(n, 3); },
    rest: rest,
    observeZ: observeZ,
    observeV: observeV,
    shiftKHz: shiftKHz,
    kHzPerKms: kHzPerKms,
    column: column,
    zAtMHz: zAtMHz,
    presetById: presetById,
    matchedPreset: matchedPreset,
    chartSamples: chartSamples,
    markers: markers,
    opening: opening,
    tier: tier,
    sense: sense,
    titleMHz: titleMHz,
    why: why,
    limitsNote: limitsNote
  };
});
