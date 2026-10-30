/*! Leading-order gravitational-wave chirp of a compact binary.

    Newtonian quadrupole only. Not a post-Newtonian waveform, not a
    numerical-relativity merger, and not a detector response.

    Chirp mass, the combination that sets the leading-order sweep
    (Abbott et al. 2016, Phys. Rev. Lett. 116, 061102, the equation in
    the text after Fig. 1):

      Mc = (m1 m2)^(3/5) / (m1 + m2)^(1/5)

    That paper also prints the frequency derivative at the same order:

      Mc = (c³/G) [ (5/96) π^(−8/3) f^(−11/3) fdot ]^(3/5)

    Inverted,

      fdot = (96/5) π^(8/3) (G Mc / c³)^(5/3) f^(11/3)

    The time to coalescence on this page is the integral of dt = df/fdot
    from the frequency you set up to infinity:

      τ = (5/256) (π f)^(−8/3) (G Mc / c³)^(−5/3)

    The coalescence in that integral is the Newtonian blow-up, not a
    merger. f(t) = f0 (1 − t/τ)^(−3/8).

    Face-on strain amplitude, the Newtonian quadrupole coefficient of
    h+ (and of h×) when the inclination is zero:

      h = (4 / D) (G Mc / c²)^(5/3) (π f / c)^(2/3)

    Equivalent form, with total mass M and reduced mass μ:

      h = 4 (G μ / (c² D)) (π G M f / c³)^(2/3)

    D is the distance you type, used as a luminosity distance in metres.
    No antenna pattern and no inclination. A real detector sees less.

    ISCO marker: test-particle Schwarzschild innermost stable circular
    orbit, r = 6GM/c² = 3 r_s, the same radius the black-hole desk
    calls the ISCO. Kepler’s law there, and a gravitational-wave
    frequency twice the orbital frequency:

      f_GW = c³ / (π 6^(3/2) G M)

    M is the total mass. Comparable masses and spin move the real
    last orbit. Neutron stars touch before this radius. The marker is
    not a merger frequency.

    Masses are the numbers in these formulas. They are not multiplied
    by (1+z). A wave observed at frequency f carries the redshifted
    chirp mass Mc(1+z). The presets say which published frame they type.

    c = 299792458 m/s exactly.
    GM☉ = 1.3271244×10^20 m³ s⁻², IAU 2015 Resolution B3 nominal solar
    mass parameter. A mass in solar masses is that parameter times the
    number. G and M☉ are not separated.
    1 au = 149597870700 m exactly, IAU 2012 Resolution B2.
    1 pc = (648000/π) au, IAU 2015 Resolution B2. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GravWave = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var C = 299792458;
  var GM_SUN = 1.3271244e20;
  var AU_M = 149597870700;
  var PC_M = (648000 / Math.PI) * AU_M;
  var MPC_M = PC_M * 1e6;

  /* Slider domain. Stellar compact binaries. Not a supermassive catalog. */
  var M_MIN = 0.5;
  var M_MAX = 200;
  var D_MIN = 0.1;
  var D_MAX = 10000;
  var F_MIN = 1;
  var F_MAX = 2000;

  /* The trace stops at this frequency, or at four times the ISCO marker,
     whichever is lower, and never past 98% of the Newtonian τ.
     Four times the marker lets the line at the marker sit inside the
     chirp. It is not a claim that the formula is still valid there. */
  var F_TRACE_CAP = 2000;
  var ISCO_TRACE_FACTOR = 4;
  /* A window longer than this shows only its last stretch, where the
     rise is visible. The card still prints the full time to coalescence. */
  var VIEW_MAX_S = 4;

  /* Abbott et al. 2016, Phys. Rev. Lett. 116, 061102 (discovery).
     Source-frame central values in the abstract: 36+5−4 and 29+4−4.
     Luminosity distance 410+160−180 Mpc. The sweep starts at 35 Hz.
     These three numbers are what the button types. The uncertainties
     are not folded in. */
  var GW150914_M1 = 36;
  var GW150914_M2 = 29;
  var GW150914_MPC = 410;
  var GW150914_F = 35;

  /* Abbott et al. 2016, Phys. Rev. Lett. 116, 241102 (properties),
     Table I, “Overall” column, median and 90% credible interval.
     Cited for comparison. Not typed into the button. */
  var GW150914_SOURCE_CHIRP = 28.0;
  var GW150914_SOURCE_CHIRP_HI = 2.0;
  var GW150914_SOURCE_CHIRP_LO = 1.7;
  var GW150914_DET_CHIRP = 30.4;
  var GW150914_DET_CHIRP_HI = 2.1;
  var GW150914_DET_CHIRP_LO = 1.9;
  var GW150914_DET_M1 = 38.9;
  var GW150914_DET_M2 = 31.6;

  /* Discovery paper: peak strain 1.0×10^−21, and about 0.2 s from
     35 Hz to 150 Hz, where the amplitude reaches a maximum. The sweep
     continues to 250 Hz. Comparison only. */
  var GW150914_PEAK_STRAIN = 1.0e-21;
  var GW150914_SWEEP_HI = 150;
  var GW150914_SWEEP_TOP = 250;

  /* Abbott et al. 2017, Phys. Rev. Lett. 119, 161101.
     Low-spin total mass 2.74+0.04−0.01 solar masses. The button splits
     that central total into two equal parts. The paper does not publish
     one component pair. Low-spin components lie in 1.17–1.60.
     Distance 40+8−14 Mpc. The in-band duration is calculated from 24 Hz. */
  var GW170817_TOTAL = 2.74;
  var GW170817_MPC = 40;
  var GW170817_F = 24;
  var GW170817_SOURCE_CHIRP = 1.188;
  var GW170817_SOURCE_CHIRP_HI = 0.004;
  var GW170817_SOURCE_CHIRP_LO = 0.002;
  var GW170817_DET_CHIRP = 1.1977;
  /* The paper’s ∼600 Hz is where it says strong tidal effects set in. */
  var GW170817_TIDAL_HZ = 600;

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "⁺"
  };

  var PRESETS = [
    {
      id: "gw150914",
      label: "GW150914",
      m1: GW150914_M1,
      m2: GW150914_M2,
      distanceMpc: GW150914_MPC,
      fHz: GW150914_F
    },
    {
      id: "gw170817",
      label: "GW170817",
      m1: GW170817_TOTAL / 2,
      m2: GW170817_TOTAL / 2,
      distanceMpc: GW170817_MPC,
      fHz: GW170817_F
    }
  ];

  function log10(x) {
    return Math.log(x) / Math.LN10;
  }

  function clamp(x, lo, hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
  }

  function inRange(x, lo, hi) {
    return typeof x === "number" && isFinite(x) && x >= lo && x <= hi;
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

  function chirpMass(m1, m2) {
    if (!(m1 > 0) || !(m2 > 0)) return NaN;
    return Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
  }

  function reducedMass(m1, m2) {
    if (!(m1 > 0) || !(m2 > 0)) return NaN;
    return (m1 * m2) / (m1 + m2);
  }

  function timeToCoalescence(mcSolar, fHz) {
    if (!(mcSolar > 0) || !(fHz > 0)) return NaN;
    var x = (C * C * C) / (mcSolar * GM_SUN);
    return (5 / 256) * Math.pow(x, 5 / 3) * Math.pow(Math.PI * fHz, -8 / 3);
  }

  function frequencyDerivative(mcSolar, fHz) {
    if (!(mcSolar > 0) || !(fHz > 0)) return NaN;
    var x = (mcSolar * GM_SUN) / (C * C * C);
    return (96 / 5) * Math.pow(Math.PI, 8 / 3) * Math.pow(x, 5 / 3) * Math.pow(fHz, 11 / 3);
  }

  function frequencyAtTime(mcSolar, f0, t) {
    var tau = timeToCoalescence(mcSolar, f0);
    if (!(tau > 0) || !(t >= 0) || !(t < tau)) return NaN;
    return f0 * Math.pow(1 - t / tau, -3 / 8);
  }

  function phaseAtTime(mcSolar, f0, t) {
    var tau = timeToCoalescence(mcSolar, f0);
    if (!(tau > 0) || !(t >= 0)) return NaN;
    var x = 1 - t / tau;
    if (x < 0) x = 0;
    return 2 * Math.PI * f0 * (8 * tau / 5) * (1 - Math.pow(x, 5 / 8));
  }

  function iscoFrequency(totalSolar) {
    if (!(totalSolar > 0)) return NaN;
    return (C * C * C) / (Math.PI * Math.pow(6, 1.5) * totalSolar * GM_SUN);
  }

  function strainAmplitude(mcSolar, fHz, distanceMpc) {
    if (!(mcSolar > 0) || !(fHz > 0) || !(distanceMpc > 0)) return NaN;
    var D = distanceMpc * MPC_M;
    var gm = mcSolar * GM_SUN;
    return (4 / D) * Math.pow(gm / (C * C), 5 / 3) * Math.pow(Math.PI * fHz / C, 2 / 3);
  }

  function strainFromReduced(m1, m2, fHz, distanceMpc) {
    var mu = reducedMass(m1, m2);
    var total = m1 + m2;
    if (!(mu > 0) || !(fHz > 0) || !(distanceMpc > 0)) return NaN;
    var D = distanceMpc * MPC_M;
    return 4 * (mu * GM_SUN) / (C * C * D) * Math.pow(Math.PI * total * GM_SUN * fHz / (C * C * C), 2 / 3);
  }

  function formatMass(m) {
    if (typeof m !== "number" || !isFinite(m)) return "—";
    if (Math.abs(m - Math.round(m)) < 1e-9) return groupInt(String(Math.round(m))) + " M☉";
    if (m >= 10) return m.toFixed(2) + " M☉";
    var s = m.toFixed(3);
    if (s.charAt(s.length - 1) === "0") s = m.toFixed(2);
    return s + " M☉";
  }

  function formatComponent(m) {
    if (typeof m !== "number" || !isFinite(m)) return "—";
    if (Math.abs(m - Math.round(m)) < 1e-6) return String(Math.round(m));
    return String(Number(m.toFixed(4)));
  }

  function formatHz(f) {
    if (typeof f !== "number" || !isFinite(f)) return "—";
    if (f >= 1000) return groupFixed(f, 0) + " Hz";
    if (f >= 1) {
      if (Math.abs(f - Math.round(f)) < 0.005) return groupFixed(Math.round(f), 0) + " Hz";
      return f.toFixed(2) + " Hz";
    }
    if (f >= 1e-3) return (f * 1000).toFixed(3) + " mHz";
    return formatSci(f, 3) + " Hz";
  }

  function formatDuration(s) {
    if (typeof s !== "number" || !isFinite(s) || s < 0) return "—";
    if (s < 1e-3) return formatSci(s, 3) + " s";
    if (s < 1) return s.toFixed(3) + " s";
    if (s < 1000) return s.toFixed(2) + " s";
    if (s < 7200) return (s / 60).toFixed(1) + " min";
    if (s < 172800) return (s / 3600).toFixed(2) + " h";
    return (s / 86400).toFixed(2) + " d";
  }

  function formatMpc(d) {
    if (typeof d !== "number" || !isFinite(d)) return "—";
    if (Math.abs(d - Math.round(d)) < 0.005) return groupFixed(Math.round(d), 0) + " Mpc";
    if (d >= 100) return groupFixed(d, 1) + " Mpc";
    return d.toFixed(2) + " Mpc";
  }

  function formatStrain(h) {
    if (typeof h !== "number" || !isFinite(h)) return "—";
    return formatSci(h, 4);
  }

  function logFromUnit(step, lo, hi) {
    if (typeof step !== "number" || !isFinite(step)) return NaN;
    var t = clamp(step, 0, 1000) / 1000;
    return Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo)));
  }

  function unitFromLog(value, lo, hi) {
    if (typeof value !== "number" || !isFinite(value) || !(value > 0)) return NaN;
    var t = (Math.log(value) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return clamp(t, 0, 1) * 1000;
  }

  function model(spec) {
    if (!spec) return null;
    if (!inRange(spec.m1, M_MIN, M_MAX)) return null;
    if (!inRange(spec.m2, M_MIN, M_MAX)) return null;
    if (!inRange(spec.distanceMpc, D_MIN, D_MAX)) return null;
    if (!inRange(spec.fHz, F_MIN, F_MAX)) return null;
    var total = spec.m1 + spec.m2;
    var mc = chirpMass(spec.m1, spec.m2);
    var tau = timeToCoalescence(mc, spec.fHz);
    var fIsco = iscoFrequency(total);
    if (!isFinite(mc) || !isFinite(tau) || !isFinite(fIsco)) return null;
    var above = spec.fHz >= fIsco;
    var tIsco = above ? null : (tau - timeToCoalescence(mc, fIsco));
    return {
      m1: spec.m1,
      m2: spec.m2,
      distanceMpc: spec.distanceMpc,
      fHz: spec.fHz,
      total: total,
      chirp: mc,
      tau: tau,
      fIsco: fIsco,
      aboveIsco: above,
      tIsco: tIsco,
      strain: strainAmplitude(mc, spec.fHz, spec.distanceMpc),
      strainIsco: above ? null : strainAmplitude(mc, fIsco, spec.distanceMpc)
    };
  }

  function presetModel(id) {
    var p = presetById(id);
    if (!p) return null;
    return model(p);
  }

  function matchedPreset(row) {
    if (!row) return "";
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      if (Math.abs(p.m1 - row.m1) < 1e-9 &&
          Math.abs(p.m2 - row.m2) < 1e-9 &&
          Math.abs(p.distanceMpc - row.distanceMpc) < 1e-9 &&
          Math.abs(p.fHz - row.fHz) < 1e-9) return p.id;
    }
    return "";
  }

  function traceEndFrequency(row) {
    var scaled = row.fIsco * ISCO_TRACE_FACTOR;
    var hi = Math.min(F_TRACE_CAP, Math.max(scaled, row.fHz * 1.25));
    if (!(hi > row.fHz)) return NaN;
    return hi;
  }

  function viewWindow(row) {
    if (!row) return null;
    var fHi = traceEndFrequency(row);
    if (!isFinite(fHi)) return null;
    var t1 = row.tau - timeToCoalescence(row.chirp, fHi);
    if (!(t1 > 0) || !isFinite(t1)) return null;
    var t0 = 0;
    var trimmed = false;
    if (t1 - t0 > VIEW_MAX_S) {
      t0 = t1 - VIEW_MAX_S;
      trimmed = true;
    }
    return {
      t0: t0,
      t1: t1,
      trimmed: trimmed,
      fHi: fHi,
      tIsco: row.tIsco,
      fIsco: row.fIsco
    };
  }

  function point(row, t) {
    if (!row || !(t >= 0)) return null;
    var f = frequencyAtTime(row.chirp, row.fHz, t);
    if (!isFinite(f)) return null;
    var amp = strainAmplitude(row.chirp, f, row.distanceMpc);
    var ph = phaseAtTime(row.chirp, row.fHz, t);
    return { t: t, f: f, amp: amp, h: amp * Math.cos(ph), phase: ph };
  }

  function series(row, n) {
    var win = viewWindow(row);
    if (!win) return null;
    var count = n && n > 8 ? Math.floor(n) : 480;
    var t = new Array(count);
    var f = new Array(count);
    var h = new Array(count);
    var amp = new Array(count);
    var i;
    for (i = 0; i < count; i++) {
      var ti = win.t0 + (win.t1 - win.t0) * (count === 1 ? 0 : i / (count - 1));
      var p = point(row, ti);
      t[i] = ti;
      f[i] = p ? p.f : NaN;
      h[i] = p ? p.h : NaN;
      amp[i] = p ? p.amp : NaN;
    }
    var p0 = point(row, win.t0);
    var p1 = point(row, win.t1);
    var cycles = (p0 && p1) ? (p1.phase - p0.phase) / (2 * Math.PI) : NaN;
    return {
      t0: win.t0,
      t1: win.t1,
      trimmed: win.trimmed,
      tIsco: win.tIsco,
      fIsco: win.fIsco,
      fHi: win.fHi,
      cycles: cycles,
      t: t,
      f: f,
      h: h,
      amp: amp
    };
  }

  function buildTone(row, opts) {
    var win = viewWindow(row);
    if (!win || !opts || !(opts.sampleRate > 0)) return null;
    var pitch = opts.pitch;
    if (!(pitch > 0) || pitch > 64) return null;
    var sr = opts.sampleRate;
    var n = Math.round((win.t1 - win.t0) * sr);
    if (n < 8) n = 8;
    if (n > sr * 12) n = Math.floor(sr * 12);
    var raw = new Float32Array(n);
    var phase = 0;
    var peak = 0;
    var capped = false;
    var limit = sr * 0.45;
    var i;
    for (i = 0; i < n; i++) {
      var t = win.t0 + (win.t1 - win.t0) * (i / n);
      var p = point(row, t);
      if (!p) return null;
      var f = p.f * pitch;
      if (f > limit) {
        f = limit;
        capped = true;
      }
      phase += 2 * Math.PI * f / sr;
      raw[i] = p.amp * Math.cos(phase);
      var a = Math.abs(raw[i]);
      if (a > peak) peak = a;
    }
    if (!(peak > 0)) return null;
    var fade = Math.min(Math.floor(sr * 0.008), Math.floor(n / 8));
    var out = new Float32Array(n);
    for (i = 0; i < n; i++) {
      var g = 0.9 / peak;
      if (i < fade) g *= i / fade;
      if (i > n - 1 - fade) g *= (n - 1 - i) / fade;
      out[i] = raw[i] * g;
    }
    return {
      samples: out,
      sampleRate: sr,
      pitch: pitch,
      capped: capped,
      t0: win.t0,
      t1: win.t1,
      trimmed: win.trimmed,
      duration: n / sr
    };
  }

  function explain(row) {
    if (!row) return "";
    var who = matchedPreset(row);
    var open = who === "gw150914"
      ? "GW150914, the discovery abstract’s source-frame central values, 36 and 29 solar masses, at 410 Mpc, starting at 35 Hz."
      : (who === "gw170817"
        ? "GW170817, an equal split of the published low-spin total mass 2.74 solar masses, so 1.37 and 1.37, at 40 Mpc, starting at 24 Hz. The paper does not publish one component pair."
        : "Custom masses " + formatComponent(row.m1) + " and " + formatComponent(row.m2) + " solar masses, at " + formatMpc(row.distanceMpc) + ", starting at " + formatHz(row.fHz) + ".");
    var isco = row.aboveIsco
      ? " The starting frequency is already above the ISCO marker at " + formatHz(row.fIsco) + ", so this Newtonian inspiral is outside the range where the marker says it should stop."
      : " The Schwarzschild test-particle ISCO for the total mass is " + formatHz(row.fIsco) + ", " + formatDuration(row.tIsco) + " from this start on the same integral. That marker is not a merger time.";
    return open + " The chirp mass is " + formatMass(row.chirp) + ". Time to the Newtonian coalescence from " + formatHz(row.fHz) + " is " + formatDuration(row.tau) + ". The face-on strain at that frequency is " + formatStrain(row.strain) + "." + isco + " Leading-order quadrupole. Not a waveform model.";
  }

  function explainPapers() {
    var src = presetModel("gw150914");
    var det = model({ m1: GW150914_DET_M1, m2: GW150914_DET_M2, distanceMpc: GW150914_MPC, fHz: GW150914_F });
    var sweep = src.tau - timeToCoalescence(src.chirp, GW150914_SWEEP_HI);
    var h150 = strainAmplitude(src.chirp, GW150914_SWEEP_HI, GW150914_MPC);
    var bns = presetModel("gw170817");
    return "The GW150914 button types 36 and 29 solar masses. Their Newtonian chirp mass is " + formatMass(src.chirp) + ". Abbott et al. 2016, the properties paper, Table I, overall column, gives a source-frame chirp mass of 28.0 solar masses, plus 2.0 and minus 1.7. The same paper’s detector-frame component medians are 38.9 and 31.6. Typed into this formula they give " + formatMass(det.chirp) + ". The paper’s detector-frame chirp median is 30.4, plus 2.1 and minus 1.9. Marginal medians are not a joint sample, and this page does not multiply by (1+z). The discovery paper’s rough estimate from the observed frequency and its derivative is about 30 solar masses in the detector frame. From 35 Hz to 150 Hz the Newtonian integral on the button’s masses is " + formatDuration(sweep) + ". The discovery paper says the signal increases from 35 to 150 Hz in about 0.2 s, and the sweep continues to 250 Hz. The face-on strain of the button at 150 Hz is " + formatStrain(h150) + ". The discovery paper’s peak strain is 1.0×10⁻²¹. That peak is the strain in the detectors. It is not this face-on formula. The GW170817 button’s Newtonian chirp mass is " + formatMass(bns.chirp) + ". The paper’s source-frame chirp mass is 1.188, plus 0.004 and minus 0.002. From 24 Hz the Newtonian time to coalescence is " + formatDuration(bns.tau) + ". The paper’s time in band, calculated from 24 Hz, is about 100 s.";
  }

  function explainBands() {
    var million = iscoFrequency(1e6);
    return "Advanced LIGO’s band in Martynov et al. 2016 is about 10 Hz to 10 kHz. The LISA Consortium describes LIGO, Virgo, and KAGRA as optimized for the tens to hundreds of hertz, and LISA for millihertz waves. The LISA Definition Study Report gives LISA’s survey band as 0.1 mHz to 1 Hz. The same ISCO marker at a total mass of one million solar masses is " + formatHz(million) + ". That line is the formula, not a detected event.";
  }

  function explainWhy() {
    return {
      chirp: "The chirp mass is the one combination of the two masses that sets the leading-order sweep. Individual masses matter at higher order, and this page does not carry those terms. A heavier chirp mass reaches coalescence sooner from the same frequency.",
      tau: "Time to coalescence is the integral of the discovery paper’s frequency derivative, from the frequency you set up to the Newtonian blow-up. The blow-up is not a merger. Stop reading the curve at the ISCO marker if you want the rough end of the inspiral.",
      strain: "The strain is the face-on Newtonian amplitude at the distance you set. It grows as frequency to the two-thirds, and it falls as one over distance. An edge-on binary and a detector’s antenna pattern are smaller. Nothing here is a matched-filter template.",
      isco: "The marker is a test particle’s innermost stable circular orbit around a non-spinning hole of the total mass, the same 6GM/c² the black-hole desk draws, read as a gravitational-wave frequency. GW150914 was observed well above that frequency. Spin and comparable masses move the real last orbit. For a neutron-star pair the stars meet before this black-hole orbit."
    };
  }

  return {
    C: C,
    GM_SUN: GM_SUN,
    AU_M: AU_M,
    PC_M: PC_M,
    MPC_M: MPC_M,
    M_MIN: M_MIN,
    M_MAX: M_MAX,
    D_MIN: D_MIN,
    D_MAX: D_MAX,
    F_MIN: F_MIN,
    F_MAX: F_MAX,
    VIEW_MAX_S: VIEW_MAX_S,
    PRESETS: PRESETS,
    GW150914_M1: GW150914_M1,
    GW150914_M2: GW150914_M2,
    GW150914_MPC: GW150914_MPC,
    GW150914_F: GW150914_F,
    GW150914_SOURCE_CHIRP: GW150914_SOURCE_CHIRP,
    GW150914_SOURCE_CHIRP_HI: GW150914_SOURCE_CHIRP_HI,
    GW150914_SOURCE_CHIRP_LO: GW150914_SOURCE_CHIRP_LO,
    GW150914_DET_CHIRP: GW150914_DET_CHIRP,
    GW150914_DET_CHIRP_HI: GW150914_DET_CHIRP_HI,
    GW150914_DET_CHIRP_LO: GW150914_DET_CHIRP_LO,
    GW150914_DET_M1: GW150914_DET_M1,
    GW150914_DET_M2: GW150914_DET_M2,
    GW150914_PEAK_STRAIN: GW150914_PEAK_STRAIN,
    GW150914_SWEEP_HI: GW150914_SWEEP_HI,
    GW150914_SWEEP_TOP: GW150914_SWEEP_TOP,
    GW170817_TOTAL: GW170817_TOTAL,
    GW170817_MPC: GW170817_MPC,
    GW170817_F: GW170817_F,
    GW170817_SOURCE_CHIRP: GW170817_SOURCE_CHIRP,
    GW170817_SOURCE_CHIRP_HI: GW170817_SOURCE_CHIRP_HI,
    GW170817_SOURCE_CHIRP_LO: GW170817_SOURCE_CHIRP_LO,
    GW170817_DET_CHIRP: GW170817_DET_CHIRP,
    GW170817_TIDAL_HZ: GW170817_TIDAL_HZ,
    presetById: presetById,
    chirpMass: chirpMass,
    reducedMass: reducedMass,
    timeToCoalescence: timeToCoalescence,
    frequencyDerivative: frequencyDerivative,
    frequencyAtTime: frequencyAtTime,
    phaseAtTime: phaseAtTime,
    iscoFrequency: iscoFrequency,
    strainAmplitude: strainAmplitude,
    strainFromReduced: strainFromReduced,
    formatMass: formatMass,
    formatComponent: formatComponent,
    formatHz: formatHz,
    formatDuration: formatDuration,
    formatMpc: formatMpc,
    formatStrain: formatStrain,
    massFromUnit: function (step) { return logFromUnit(step, M_MIN, M_MAX); },
    unitFromMass: function (m) { return unitFromLog(m, M_MIN, M_MAX); },
    distanceFromUnit: function (step) { return logFromUnit(step, D_MIN, D_MAX); },
    unitFromDistance: function (d) { return unitFromLog(d, D_MIN, D_MAX); },
    frequencyFromUnit: function (step) { return logFromUnit(step, F_MIN, F_MAX); },
    unitFromFrequency: function (f) { return unitFromLog(f, F_MIN, F_MAX); },
    model: model,
    presetModel: presetModel,
    matchedPreset: matchedPreset,
    viewWindow: viewWindow,
    point: point,
    series: series,
    buildTone: buildTone,
    explain: explain,
    explainPapers: explainPapers,
    explainBands: explainBands,
    explainWhy: explainWhy
  };
});
