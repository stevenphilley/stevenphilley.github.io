/*! Deep-space radio link budget.

    A classroom downlink. One carrier, two dishes, free space.
    Gain of a round aperture is G = η (π D / λ)².
    Free-space path loss is (4π d / λ)².
    Received power is Pr = Pt · Gt · Gr · (λ / 4π d)².
    Noise density is N0 = k T.
    C/N0 is Pr / N0.
    The rate at a chosen Eb/N0 is (C/N0) / (Eb/N0), with Eb/N0 linear.
    The unlimited-bandwidth Shannon rate is (C/N0) / ln(2).
    That ceiling is Eb/N0 = ln(2), which is −1.59 dB to 0.01 dB.
    One-way light time is d / c.

    c = 299,792,458 m/s exactly. k = 1.380649×10^−23 J/K exactly.
    1 AU = 149,597,870,700 m exactly, the same au as the light-time desk.

    The 70 m X-band vacuum gain in DSN 810-005 module 101 Rev. H is
    74.55 dBi at 8420 MHz for DSS-14, X-only. This page does not
    substitute that gain. It computes G from η. η opens at 0.55, a
    classroom default, not a measured efficiency.

    Not a link design. Atmospheric loss, pointing loss, and coding
    are named and not applied. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LinkBudget = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* SI defining constants. The metre fixes c. The kelvin fixes k. */
  var C = 299792458;
  var K_B = 1.380649e-23;
  /* IAU 2012 Resolution B2. The same length the light-time desk divides by c. */
  var AU_M = 149597870700;
  var LN2 = Math.LN2;

  /* DSN 810-005, module 101, Rev. H (11 March 2025), Table 2.
     S-band receive reference 2295 MHz. X-band receive reference 8420 MHz.
     Deep-space X-band downlink allocation on that page is 8400–8450 MHz.
     Module 104, Rev. O, Table 1: nominal deep-space Ka-band downlink 32050 MHz.
     The 70 m subnet module does not list a Ka-band receive gain. */
  var BANDS = [
    { id: "S", name: "S", hz: 2295e6, mhz: 2295, label: "S · 2295 MHz" },
    { id: "X", name: "X", hz: 8420e6, mhz: 8420, label: "X · 8420 MHz" },
    { id: "Ka", name: "Ka", hz: 32050e6, mhz: 32050, label: "Ka · 32050 MHz" }
  ];

  /* The round-frequency check in the prompt. Not a handbook carrier.
     Used only for the published sanity line, not as a band button. */
  var HUNCH_HZ = 8.4e9;

  /* Moon Fact Sheet semimajor axis, 0.3844 × 10^6 km, the same mean the
     light-time desk holds fixed. Mars, Jupiter, and Pluto minima and the
     Mars maximum are the NSSDCA fact-sheet Earth distances, in 10^6 km.
     Voyager’s mark is one light-day, c × 86,400 s. NASA Science dates that
     distance to 18 November 2026, 2:16:07 a.m. PST. The page does not
     advance the spacecraft past that instant. */
  var MOON_M = 384400e3;
  var MARS_MIN_M = 54.6 * 1e9;
  var MARS_MAX_M = 401.4 * 1e9;
  var JUPITER_MIN_M = 588.5 * 1e9;
  var PLUTO_MIN_M = 4284.7 * 1e9;
  var LIGHT_DAY_M = C * 86400;

  var D_MIN = MOON_M;
  var D_MAX = 2 * LIGHT_DAY_M;

  /* PDS Voyager 1 radio catalog: X-band high power 22 W, reflector 3.66 m.
     The 1980 JPL backgrounder prints 21.3 W. 21.3 is not substituted.
     NASA Science prints 3.7 m. 3.7 is the rounding of 3.66 and is not substituted.
     DeBoy et al. 2004: two 12 W X-band TWTAs and a 2.1 m reflector.
     Fountain et al. (arXiv:0709.4288) print the same 2.1 m. */
  var VOYAGER_W = 22;
  var VOYAGER_D_M = 3.66;
  var NH_W = 12;
  var NH_D_M = 2.1;

  /* Module 101 Table 2, X-only, feedhorn aperture, no atmosphere.
     DSS-14 at 8420 MHz. DSS-43 is 74.63. DSS-63 is 74.66.
     The page quotes DSS-14 and does not average the three. */
  var DSS14_X_DBI = 74.55;
  /* Module 101 Table 2, S-band 2295 MHz, all 70 m stations. */
  var DSS70_S_DBI = 63.59;
  /* Module 104 Rev. O Table 9, 34 m BWG, 32050 MHz, X/Ka operation. */
  var BWG34_KA_DBI = 79.0;
  /* Module 101 Table 4. DSS-14, X-band, XTR, X-only, zenith, CD = 25%.
     Top = TAMW + Tsky = 11.65 + 5.04 = 16.69 K. */
  var T_DSS14_X = 16.69;

  var ETA_DEFAULT = 0.55;
  var EBN0_DEFAULT = 0;

  var PT_MIN = 0.1;
  var PT_MAX = 1000;
  var DSC_MIN = 0.2;
  var DSC_MAX = 20;
  var DG_MIN = 5;
  var DG_MAX = 100;
  var ETA_MIN = 0.05;
  var ETA_MAX = 0.85;
  var T_MIN = 2;
  var T_MAX = 300;
  var EBN0_MIN = -10;
  var EBN0_MAX = 20;

  var DISTANCES = [
    { id: "moon", name: "Moon", short: "Moon", meters: MOON_M, craft: null },
    { id: "mars-near", name: "Mars closest", short: "Mars min", meters: MARS_MIN_M, craft: null },
    { id: "mars-far", name: "Mars farthest", short: "Mars max", meters: MARS_MAX_M, craft: null },
    { id: "jupiter", name: "Jupiter closest", short: "Jupiter", meters: JUPITER_MIN_M, craft: null },
    { id: "pluto", name: "Pluto · New Horizons", short: "Pluto", meters: PLUTO_MIN_M, craft: "nh" },
    { id: "voyager", name: "Voyager 1 · light-day", short: "Voyager", meters: LIGHT_DAY_M, craft: "voyager" }
  ];

  var CRAFT = [
    { id: "voyager", name: "Voyager 1", ptW: VOYAGER_W, dM: VOYAGER_D_M, band: "X" },
    { id: "nh", name: "New Horizons", ptW: NH_W, dM: NH_D_M, band: "X" }
  ];

  var DISHES = [
    { id: "dsn70", name: "70 m", dM: 70 },
    { id: "bwg34", name: "34 m", dM: 34 }
  ];

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function bandById(id) {
    var i;
    for (i = 0; i < BANDS.length; i++) if (BANDS[i].id === id) return BANDS[i];
    return null;
  }

  function distanceById(id) {
    var i;
    for (i = 0; i < DISTANCES.length; i++) if (DISTANCES[i].id === id) return DISTANCES[i];
    return null;
  }

  function craftById(id) {
    var i;
    for (i = 0; i < CRAFT.length; i++) if (CRAFT[i].id === id) return CRAFT[i];
    return null;
  }

  function dishById(id) {
    var i;
    for (i = 0; i < DISHES.length; i++) if (DISHES[i].id === id) return DISHES[i];
    return null;
  }

  function ptOk(w) { return finite(w) && w >= PT_MIN && w <= PT_MAX; }
  function dscOk(m) { return finite(m) && m >= DSC_MIN && m <= DSC_MAX; }
  function dgOk(m) { return finite(m) && m >= DG_MIN && m <= DG_MAX; }
  function etaOk(e) { return finite(e) && e >= ETA_MIN && e <= ETA_MAX; }
  function tOk(t) { return finite(t) && t >= T_MIN && t <= T_MAX; }
  function ebn0Ok(db) { return finite(db) && db >= EBN0_MIN && db <= EBN0_MAX; }
  function distOk(m) { return finite(m) && m >= D_MIN && m <= D_MAX; }

  function opening() {
    return {
      ptW: VOYAGER_W,
      dscM: VOYAGER_D_M,
      dgM: 70,
      band: "X",
      eta: ETA_DEFAULT,
      distM: LIGHT_DAY_M,
      tK: T_DSS14_X,
      ebn0Db: EBN0_DEFAULT
    };
  }

  function lambdaM(hz) {
    return C / hz;
  }

  /* Linear power gain. dBi is 10 log10 of this. */
  function gainLin(eta, dM, hz) {
    var lam = lambdaM(hz);
    return eta * Math.pow(Math.PI * dM / lam, 2);
  }

  function gainDb(eta, dM, hz) {
    return 10 * Math.log10(gainLin(eta, dM, hz));
  }

  function fsplDb(distM, hz) {
    var lam = lambdaM(hz);
    return 20 * Math.log10(4 * Math.PI * distM / lam);
  }

  /* η that would make the formula print a quoted gain. Computed, not adopted. */
  function etaForGain(dBi, dM, hz) {
    var lin = Math.pow(10, dBi / 10);
    return lin / gainLin(1, dM, hz);
  }

  function shannonDb() {
    return 10 * Math.log10(LN2);
  }

  function solve(state) {
    if (!state) return null;
    var band = bandById(state.band);
    if (!band) return null;
    if (!ptOk(state.ptW) || !dscOk(state.dscM) || !dgOk(state.dgM)) return null;
    if (!etaOk(state.eta) || !tOk(state.tK) || !ebn0Ok(state.ebn0Db)) return null;
    if (!distOk(state.distM)) return null;

    var hz = band.hz;
    var lam = lambdaM(hz);
    var gt = gainLin(state.eta, state.dscM, hz);
    var gr = gainLin(state.eta, state.dgM, hz);
    var spread = Math.pow(lam / (4 * Math.PI * state.distM), 2);
    var pr = state.ptW * gt * gr * spread;
    var n0 = K_B * state.tK;
    var cn0 = pr / n0;
    var ebn0Lin = Math.pow(10, state.ebn0Db / 10);
    var rate = cn0 / ebn0Lin;
    var shannon = cn0 / LN2;
    var light = state.distM / C;

    return {
      ok: true,
      band: band,
      hz: hz,
      lambdaM: lam,
      eta: state.eta,
      ptW: state.ptW,
      dscM: state.dscM,
      dgM: state.dgM,
      distM: state.distM,
      au: state.distM / AU_M,
      km: state.distM / 1000,
      tK: state.tK,
      ebn0Db: state.ebn0Db,
      ebn0Lin: ebn0Lin,
      gtDb: 10 * Math.log10(gt),
      grDb: 10 * Math.log10(gr),
      fsplDb: fsplDb(state.distM, hz),
      prW: pr,
      prDbm: 10 * Math.log10(pr) + 30,
      n0: n0,
      n0Dbw: 10 * Math.log10(n0),
      kDbw: 10 * Math.log10(K_B),
      cn0: cn0,
      cn0Db: 10 * Math.log10(cn0),
      rate: rate,
      shannon: shannon,
      aboveShannon: rate > shannon * (1 + 1e-12),
      lightS: light
    };
  }

  function atDistance(state, meters) {
    return solve({
      ptW: state.ptW,
      dscM: state.dscM,
      dgM: state.dgM,
      band: state.band,
      eta: state.eta,
      distM: meters,
      tK: state.tK,
      ebn0Db: state.ebn0Db
    });
  }

  function chartSamples(state, n) {
    var count = n || 80;
    var rows = [];
    var i;
    for (i = 0; i <= count; i++) {
      var u = i / count;
      var d = i === 0 ? D_MIN : (i === count ? D_MAX : D_MIN * Math.pow(D_MAX / D_MIN, u));
      var row = atDistance(state, d);
      if (!row) return null;
      rows.push({ distM: d, rate: row.rate, shannon: row.shannon });
    }
    return rows;
  }

  function markers(state) {
    var out = [];
    var i;
    for (i = 0; i < DISTANCES.length; i++) {
      var p = DISTANCES[i];
      var row = atDistance(state, p.meters);
      if (!row) return null;
      out.push({
        id: p.id,
        name: p.name,
        short: p.short,
        distM: p.meters,
        rate: row.rate,
        shannon: row.shannon
      });
    }
    return out;
  }

  function nearRel(a, b) {
    var scale = Math.max(Math.abs(a), Math.abs(b), 1);
    return Math.abs(a - b) <= 1e-6 * scale;
  }

  function matchedDistance(meters) {
    var i;
    for (i = 0; i < DISTANCES.length; i++) {
      if (nearRel(meters, DISTANCES[i].meters)) return DISTANCES[i];
    }
    return null;
  }

  function matchedCraft(state) {
    var i;
    for (i = 0; i < CRAFT.length; i++) {
      var c = CRAFT[i];
      if (nearRel(state.ptW, c.ptW) && nearRel(state.dscM, c.dM) && state.band === c.band) return c;
    }
    return null;
  }

  function matchedDish(dM) {
    var i;
    for (i = 0; i < DISHES.length; i++) {
      if (nearRel(dM, DISHES[i].dM)) return DISHES[i];
    }
    return null;
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var bits = s.split(".");
    bits[0] = bits[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + bits.join(".");
  }

  function formatDb(n) {
    return group(n, 2);
  }

  function formatEta(eta) {
    var s = eta.toFixed(3);
    if (s.charAt(s.length - 1) === "0") return eta.toFixed(2);
    return s;
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

  function formatLength(m) {
    var cm = m * 100;
    if (cm >= 1) return group(cm, 3) + " cm";
    return group(cm * 10, 3) + " mm";
  }

  function formatKm(km) {
    var rounded = Math.round(km);
    if (Math.abs(km - rounded) <= 1e-4 * Math.max(1, Math.abs(km))) return group(rounded, 0) + " km";
    return group(km, 3) + " km";
  }

  function formatAu(au) {
    if (au >= 10) return group(au, 3) + " AU";
    if (au >= 1) return group(au, 4) + " AU";
    return group(au, 6) + " AU";
  }

  function formatDbm(dbm) {
    return group(dbm, 2) + " dBm";
  }

  function formatWatt(w) {
    if (w >= 0.001) return group(w, 3) + " W";
    return formatSci(w, 3) + " W";
  }

  function formatRate(bitPerS) {
    var a = Math.abs(bitPerS);
    if (a >= 1e12) return formatSci(bitPerS, 3) + " bit/s";
    if (a >= 1e6) return group(bitPerS / 1e6, 3) + " Mbit/s";
    if (a >= 1e4) return group(bitPerS / 1e3, 3) + " kbit/s";
    return group(bitPerS, 0) + " bit/s";
  }

  function formatDelay(sec) {
    if (sec < 90) {
      var t = sec.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
      return t + " s";
    }
    if (sec < 3600) {
      var m = Math.floor(sec / 60);
      var s = sec - m * 60;
      var ss = s.toFixed(1).replace(/\.0$/, "");
      return m + " min " + ss + " s";
    }
    var h = Math.floor(sec / 3600);
    var rem = sec - h * 3600;
    var min = Math.floor(rem / 60 + 1e-9);
    var secR = rem - min * 60;
    if (secR < 0.05) return h + " h " + min + " min";
    return h + " h " + min + " min " + Math.round(secR) + " s";
  }

  function formatKelvin(t) {
    var s = t.toFixed(2);
    if (s.charAt(s.length - 1) === "0") s = t.toFixed(1);
    if (s.charAt(s.length - 1) === "0") s = t.toFixed(0);
    return s + " K";
  }

  function tier(state) {
    var dist = matchedDistance(state.distM);
    var craft = matchedCraft(state);
    if (dist && dist.id === "voyager" && craft && craft.id === "voyager") return "Voyager 1 · one light-day";
    if (dist && dist.id === "pluto" && craft && craft.id === "nh") return "New Horizons · Pluto closest";
    if (dist && craft) return craft.name + " · " + dist.name;
    if (dist) return dist.name;
    if (craft) return craft.name;
    return "Custom link";
  }

  function why(row) {
    var bits = [];
    bits.push("Wavelength is c/f, " + formatLength(row.lambdaM) + ".");
    bits.push("Each gain is η(πD/λ)². The spacecraft dish is " + formatDb(row.gtDb) + " dBi. The ground dish is " + formatDb(row.grDb) + " dBi. η is " + formatEta(row.eta) + ".");
    bits.push("Free-space path loss is (4πd/λ)², " + formatDb(row.fsplDb) + " dB.");
    bits.push("Received power is Pt·Gt·Gr·(λ/4πd)², " + formatDbm(row.prDbm) + ", " + formatWatt(row.prW) + ".");
    bits.push("Noise density kT is " + formatSci(row.n0, 3) + " W/Hz, " + formatDb(row.n0Dbw) + " dBW/Hz.");
    bits.push("C/N0 is " + formatDb(row.cn0Db) + " dB-Hz.");
    bits.push("At Eb/N0 = " + formatDb(row.ebn0Db) + " dB the rate is (C/N0) divided by that ratio, " + formatRate(row.rate) + ".");
    bits.push("The Shannon ceiling, unlimited bandwidth, is (C/N0)/ln(2), " + formatRate(row.shannon) + ". ln(2) is " + formatDb(shannonDb()) + " dB when rounded to 0.01 dB. The rate uses the unrounded ln(2).");
    if (row.aboveShannon) {
      bits.push("The chosen threshold is below that floor, so " + formatRate(row.rate) + " is not achievable. " + formatRate(row.shannon) + " is the ceiling.");
    } else {
      bits.push("The chosen threshold is above that floor, so the rate sits below the ceiling.");
    }
    bits.push("One-way light time is " + formatDelay(row.lightS) + ".");
    if (row.band.id === "X" && nearRel(row.dgM, 70)) {
      bits.push("Module 101 quotes DSS-14’s X-only vacuum gain as 74.55 dBi at 8420 MHz. Inverting this formula at 70 m gives η = " + formatEta(etaForGain(DSS14_X_DBI, 70, 8420e6)) + ". Neither 74.55 nor that efficiency is substituted.");
    } else if (row.band.id === "S" && nearRel(row.dgM, 70)) {
      bits.push("Module 101 quotes 63.59 dBi at 2295 MHz for every 70 m station, vacuum, at the peak-gain elevation. That gain is not substituted.");
    } else if (row.band.id === "Ka" && nearRel(row.dgM, 34)) {
      bits.push("Module 104 quotes 79.0 dBi at 32050 MHz for the 34 m BWG antennas. That gain is not substituted. The 70 m module does not list a Ka-band receive gain.");
    } else if (row.band.id === "Ka") {
      bits.push("The 70 m module does not list a Ka-band receive gain. Module 104’s 79.0 dBi is a 34 m figure at 32050 MHz, and it is not substituted here.");
    }
    if (matchedCraft({ ptW: row.ptW, dscM: row.dscM, band: row.band.id }) && row.band.id === "X") {
      if (nearRel(row.ptW, VOYAGER_W) && nearRel(row.dscM, VOYAGER_D_M)) {
        bits.push("22 W and 3.66 m are the PDS Voyager 1 catalog’s high-power X-band and reflector. That catalog prints 47 dB at X-band. 47 is not substituted. The carrier here is 8420 MHz, the handbook’s 70 m reference, not Voyager’s 8415 MHz nominal.");
      } else if (nearRel(row.ptW, NH_W) && nearRel(row.dscM, NH_D_M)) {
        bits.push("12 W and 2.1 m are DeBoy et al. 2004. The same paper requires at least 42 dBic inside 0.3°. 42 dBic is not substituted. The carrier here is 8420 MHz. A New Horizons channel frequency is not loaded.");
      }
    }
    return bits.join(" ");
  }

  function limitsNote() {
    return "Educational calculator. A straight-line vacuum link. Gain is η(πD/λ)². Path loss is (4πd/λ)². The rate at a chosen Eb/N0 is (C/N0) divided by that ratio. The Shannon curve is (C/N0)/ln(2). η opens at 0.55, a classroom default, not a measured aperture efficiency. The 0 dB threshold is an example, not a code requirement. System temperature opens at 16.69 K, the DSS-14 X-band X-only zenith figure for 25% cumulative-distribution weather in module 101 Table 4, and it is not retuned when the band changes. Atmospheric loss, rain, pointing loss, polarization mismatch, circuit loss, and coding gain are not applied. The 70 m Ka gain is the same formula. Module 101 does not list a 70 m Ka-band receive gain. Voyager’s distance is one light-day, the NASA mark of 18 November 2026, not a later range. Pluto’s distance is the fact-sheet minimum, not the 14 July 2015 flyby range.";
  }

  return {
    C: C,
    K_B: K_B,
    AU_M: AU_M,
    LN2: LN2,
    HUNCH_HZ: HUNCH_HZ,
    BANDS: BANDS,
    DISTANCES: DISTANCES,
    CRAFT: CRAFT,
    DISHES: DISHES,
    D_MIN: D_MIN,
    D_MAX: D_MAX,
    MOON_M: MOON_M,
    MARS_MIN_M: MARS_MIN_M,
    MARS_MAX_M: MARS_MAX_M,
    JUPITER_MIN_M: JUPITER_MIN_M,
    PLUTO_MIN_M: PLUTO_MIN_M,
    LIGHT_DAY_M: LIGHT_DAY_M,
    VOYAGER_W: VOYAGER_W,
    VOYAGER_D_M: VOYAGER_D_M,
    NH_W: NH_W,
    NH_D_M: NH_D_M,
    DSS14_X_DBI: DSS14_X_DBI,
    DSS70_S_DBI: DSS70_S_DBI,
    BWG34_KA_DBI: BWG34_KA_DBI,
    T_DSS14_X: T_DSS14_X,
    ETA_DEFAULT: ETA_DEFAULT,
    EBN0_DEFAULT: EBN0_DEFAULT,
    PT_MIN: PT_MIN,
    PT_MAX: PT_MAX,
    DSC_MIN: DSC_MIN,
    DSC_MAX: DSC_MAX,
    DG_MIN: DG_MIN,
    DG_MAX: DG_MAX,
    ETA_MIN: ETA_MIN,
    ETA_MAX: ETA_MAX,
    T_MIN: T_MIN,
    T_MAX: T_MAX,
    EBN0_MIN: EBN0_MIN,
    EBN0_MAX: EBN0_MAX,
    bandById: bandById,
    distanceById: distanceById,
    craftById: craftById,
    dishById: dishById,
    ptOk: ptOk,
    dscOk: dscOk,
    dgOk: dgOk,
    etaOk: etaOk,
    tOk: tOk,
    ebn0Ok: ebn0Ok,
    distOk: distOk,
    opening: opening,
    lambdaM: lambdaM,
    gainLin: gainLin,
    gainDb: gainDb,
    fsplDb: fsplDb,
    etaForGain: etaForGain,
    shannonDb: shannonDb,
    solve: solve,
    atDistance: atDistance,
    chartSamples: chartSamples,
    markers: markers,
    matchedDistance: matchedDistance,
    matchedCraft: matchedCraft,
    matchedDish: matchedDish,
    formatDb: formatDb,
    formatEta: formatEta,
    formatSci: formatSci,
    formatLength: formatLength,
    formatKm: formatKm,
    formatAu: formatAu,
    formatDbm: formatDbm,
    formatWatt: formatWatt,
    formatRate: formatRate,
    formatDelay: formatDelay,
    formatKelvin: formatKelvin,
    tier: tier,
    why: why,
    limitsNote: limitsNote
  };
});
