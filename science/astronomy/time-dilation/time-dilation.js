/*! Relativistic time dilation for a classroom Earth orbit.
    Speed slows a clock. A higher, weaker potential speeds one up.

    c = 299792458 m/s exactly (SI, NIST).
    GM = 3.986004418×10^14 m³/s², the geocentric gravitational constant
    IERS Conventions (2010) Table 1.1 lists as TCG-compatible, and the
    value Ashby 2003 prints. Earth’s equatorial radius on this page is
    6378137 m, Ashby’s a₁ and the NASA Earth Fact Sheet. IERS Table 1.1
    prints 6378136.6 m and this page does not substitute it.

    A day in the microsecond rates is 86400 SI seconds.
    The geostationary radius uses the Earth Fact Sheet sidereal rotation,
    23.9345 h, with this page’s GM.

    Weak-field model. Not a navigation solution and not an ephemeris. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TimeDilation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Exact SI speed of light. NIST CODATA, defined. */
  var C_M_S = 299792458;

  /* IERS Conventions (2010) Table 1.1, TCG-compatible GM⊕.
     Ashby 2003, Living Reviews in Relativity, eq. (13): the same digits. */
  var GM_M3_S2 = 3.986004418e14;

  /* Equatorial radius. Ashby’s a₁ = 6.3781370×10^6 m.
     NASA Earth Fact Sheet: 6,378.137 km. */
  var EARTH_RADIUS_M = 6378137;

  /* NASA Earth Fact Sheet sidereal rotation, hours. Used only to place
     the geostationary circle. The microsecond “day” is 86400 s. */
  var SIDEREAL_HOURS = 23.9345;
  var SOLAR_DAY_S = 86400;

  /* IS-GPS-200N nominal semi-major axis when ΔA = 0.
     gps.gov’s “about 20,200 km” is the altitude, not this radius. */
  var GPS_RADIUS_M = 26559710;

  /* NASA 2023 ISS lithograph: average altitude about 420 km. */
  var ISS_ALTITUDE_KM = 420;

  /* Moon Fact Sheet semimajor axis, 0.3844 × 10^6 km, center to center. */
  var MOON_RADIUS_M = 0.3844 * 1e9;

  var ALT_MIN_KM = 0;
  var ALT_MAX_KM = 410000;
  var BETA_MAX = 0.99;

  /* Ashby 2003 figures this page quotes and does not treat as its own output.
     Eq. (35): 3 GM/(2 a c²) + Φ₀/c² = +2.5046×10⁻¹⁰ − 6.9693×10⁻¹⁰
     = −4.4647×10⁻¹⁰. The negative sign is the factory offset; the orbiting
     clock runs fast. Later he prints WGS-84 (837) a₀ = 2.656175×10^7 m
     and says the circular-orbit effects cancel at a ≈ 9545 km.
     IAU L_G = 6.969290134×10⁻¹⁰ is the defining geoid rate he cites,
     d(TT)/d(TCG) = 1 − L_G. His Φ₀/c² is −L_G. */
  var ASHBY_A_M = 2.656175e7;
  var ASHBY_PRINTED_DOPPLER = 2.5046e-10;
  var ASHBY_PRINTED_GEOID = -6.9693e-10;
  var ASHBY_PRINTED_SUM = -4.4647e-10;
  var ASHBY_CANCEL_RADIUS_M = 9545e3;
  var IAU_LG = 6.969290134e-10;

  /* NIST, “Putting Einstein to the Test”: 7, 45, and 38 microseconds per day.
     Integers on that page, not this calculator’s output. */
  var NIST_SLOW_US = 7;
  var NIST_FAST_US = 45;
  var NIST_NET_US = 38;

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "⁺"
  };

  var PRESETS = [
    { id: "iss", label: "ISS", kind: "altitude", altitudeKm: ISS_ALTITUDE_KM },
    { id: "gps", label: "GPS", kind: "radius", radiusM: GPS_RADIUS_M },
    { id: "geo", label: "Geostationary", kind: "geostationary" },
    { id: "moon", label: "Moon", kind: "radius", radiusM: MOON_RADIUS_M }
  ];

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
    var mantStr = mantNum.toPrecision(sig);
    return sign + mantStr + "×10" + formatSup(exp);
  }

  function groupInt(s) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatKmFromM(m) {
    if (typeof m !== "number" || !isFinite(m)) return "—";
    var km = m / 1000;
    var body;
    if (Math.abs(km - Math.round(km)) < 1e-6) body = String(Math.round(km));
    else body = km.toFixed(2);
    var neg = body.charAt(0) === "-" ? "−" : "";
    if (neg) body = body.slice(1);
    return neg + groupInt(body) + " km";
  }

  function formatSpeed(mps) {
    if (typeof mps !== "number" || !isFinite(mps)) return "—";
    var k = mps / 1000;
    if (k >= 100) return groupInt(k.toFixed(1)) + " km/s";
    return k.toFixed(3) + " km/s";
  }

  function formatUs(us) {
    if (typeof us !== "number" || !isFinite(us)) return "—";
    var sign = us < 0 ? "−" : (us > 0 ? "+" : "");
    var a = Math.abs(us);
    if (a === 0) return "0.00 μs/day";
    if (a >= 10000 || a < 0.005) return formatSci(us, 4) + " μs/day";
    var digits = a >= 100 ? a.toFixed(1) : a.toFixed(2);
    return sign + digits + " μs/day";
  }

  function formatGamma(g) {
    if (typeof g !== "number" || !isFinite(g) || g < 1) return "—";
    var d = g - 1;
    if (d < 1e-4) return "1 + " + formatSci(d, 4);
    if (g < 10) return g.toFixed(4);
    return g.toFixed(3);
  }

  function formatYears(y) {
    if (typeof y !== "number" || !isFinite(y)) return "—";
    if (y >= 100) return formatSci(y, 4) + " years";
    return y.toFixed(4) + " years";
  }

  function formatBeta(beta) {
    if (typeof beta !== "number" || !isFinite(beta)) return "—";
    if (beta === 0) return "0";
    var digits = beta >= 0.1 ? 2 : 3;
    return beta.toFixed(digits) + "c";
  }

  function formatPeriod(seconds) {
    if (typeof seconds !== "number" || !isFinite(seconds) || !(seconds > 0)) return "—";
    if (seconds < 3 * 3600) return (seconds / 60).toFixed(2) + " min";
    if (seconds < 2 * 86400) {
      var hh = Math.floor(seconds / 3600 + 1e-9);
      var min = (seconds - hh * 3600) / 60;
      return hh + " h " + min.toFixed(2) + " min";
    }
    return (seconds / 86400).toFixed(3) + " d";
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }

  function circularSpeed(radiusM) {
    if (!(radiusM > 0)) return NaN;
    return Math.sqrt(GM_M3_S2 / radiusM);
  }

  function geoRadiusM() {
    var t = SIDEREAL_HOURS * 3600;
    return Math.cbrt(GM_M3_S2 * t * t / (4 * Math.PI * Math.PI));
  }

  function lorentzGamma(speedMps) {
    if (typeof speedMps !== "number" || !isFinite(speedMps) || speedMps < 0) return NaN;
    var b2 = (speedMps * speedMps) / (C_M_S * C_M_S);
    if (b2 >= 1) return Infinity;
    return 1 / Math.sqrt(1 - b2);
  }

  /* Exact special-relativistic rate of a moving clock against a clock at rest.
     Negative: the moving clock accumulates less proper time. */
  function lorentzFraction(speedMps) {
    var g = lorentzGamma(speedMps);
    if (!isFinite(g)) return NaN;
    return 1 / g - 1;
  }

  /* Ashby’s second-order Doppler term, −v²/(2c²). */
  function dopplerFraction(speedMps) {
    if (typeof speedMps !== "number" || !isFinite(speedMps) || speedMps < 0) return NaN;
    var b2 = (speedMps * speedMps) / (C_M_S * C_M_S);
    if (b2 >= 1) return NaN;
    return -b2 / 2;
  }

  /* Weak-field monopole. Positive when r is outside the equatorial radius:
     GM (1/R − 1/r) / c². */
  function gravitationalFraction(radiusM) {
    if (!(radiusM > 0)) return NaN;
    var gmOverC2 = GM_M3_S2 / (C_M_S * C_M_S);
    return gmOverC2 * (1 / EARTH_RADIUS_M - 1 / radiusM);
  }

  function microsecondsPerDay(fraction) {
    if (typeof fraction !== "number" || !isFinite(fraction)) return NaN;
    return fraction * SOLAR_DAY_S * 1e6;
  }

  /* Circular monopole balance: GM(1/R − 1/r)/c² = v²/(2c²) with v² = GM/r
     gives r = 3R/2. Ashby’s ≈ 9545 km uses the geoid, not this radius. */
  function balanceRadiusM() {
    return 1.5 * EARTH_RADIUS_M;
  }

  function altFromUnit(step) {
    if (typeof step !== "number" || !isFinite(step)) return NaN;
    if (step < 0) step = 0;
    if (step > 1000) step = 1000;
    var t = step / 1000;
    return Math.exp(t * Math.log(ALT_MAX_KM + 1)) - 1;
  }

  function unitFromAlt(km) {
    if (typeof km !== "number" || !isFinite(km) || km < 0) return NaN;
    var t = Math.log(km + 1) / Math.log(ALT_MAX_KM + 1);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return t * 1000;
  }

  function betaFromSlider(step) {
    if (typeof step !== "number" || !isFinite(step)) return NaN;
    if (step < 0) step = 0;
    if (step > 990) step = 990;
    return step / 1000;
  }

  function sliderFromBeta(beta) {
    if (typeof beta !== "number" || !isFinite(beta)) return NaN;
    return beta * 1000;
  }

  function finish(altitudeKm, speedMps, circular) {
    var radiusM = EARTH_RADIUS_M + altitudeKm * 1000;
    var gamma = lorentzGamma(speedMps);
    var lorentz = lorentzFraction(speedMps);
    var doppler = dopplerFraction(speedMps);
    var grav = gravitationalFraction(radiusM);
    if (!isFinite(gamma) || !isFinite(lorentz) || !isFinite(grav)) return null;
    var periodS = null;
    if (circular) periodS = 2 * Math.PI * Math.sqrt((radiusM * radiusM * radiusM) / GM_M3_S2);
    return {
      altitudeKm: altitudeKm,
      altitudeM: altitudeKm * 1000,
      radiusM: radiusM,
      speedMps: speedMps,
      circular: circular,
      gamma: gamma,
      beta: speedMps / C_M_S,
      lorentzFraction: lorentz,
      dopplerFraction: doppler,
      gravityFraction: grav,
      netFraction: grav + lorentz,
      velocityUs: microsecondsPerDay(lorentz),
      dopplerUs: microsecondsPerDay(doppler),
      gravityUs: microsecondsPerDay(grav),
      netUs: microsecondsPerDay(grav + lorentz),
      periodS: periodS
    };
  }

  function model(spec) {
    if (!spec || typeof spec.altitudeKm !== "number" || !isFinite(spec.altitudeKm)) return null;
    if (spec.altitudeKm < ALT_MIN_KM || spec.altitudeKm > ALT_MAX_KM) return null;
    var radiusM = EARTH_RADIUS_M + spec.altitudeKm * 1000;
    var circular = spec.circular === true;
    var speed = circular ? circularSpeed(radiusM) : spec.speedMps;
    if (typeof speed !== "number" || !isFinite(speed) || speed < 0 || speed >= C_M_S) return null;
    return finish(spec.altitudeKm, speed, circular);
  }

  function presetModel(id) {
    var p = presetById(id);
    if (!p) return null;
    var altitudeKm;
    if (p.kind === "altitude") altitudeKm = p.altitudeKm;
    else if (p.kind === "radius") altitudeKm = (p.radiusM - EARTH_RADIUS_M) / 1000;
    else if (p.kind === "geostationary") altitudeKm = (geoRadiusM() - EARTH_RADIUS_M) / 1000;
    else return null;
    var row = model({ altitudeKm: altitudeKm, circular: true });
    if (!row) return null;
    row.id = p.id;
    row.label = p.label;
    return row;
  }

  function rows() {
    var out = [];
    var i;
    for (i = 0; i < PRESETS.length; i++) out.push(presetModel(PRESETS[i].id));
    return out;
  }

  function twin(beta) {
    if (typeof beta !== "number" || !isFinite(beta) || beta < 0 || beta > BETA_MAX) return null;
    var gamma = 1 / Math.sqrt(1 - beta * beta);
    return {
      beta: beta,
      gamma: gamma,
      homeYears: gamma,
      speedMps: beta * C_M_S
    };
  }

  /* Ashby’s printed sum, turned into microseconds of a fast clock over 86400 s.
     The sum he prints is negative; the fast rate is the negation. */
  function ashbyQuotedFastUs() {
    return microsecondsPerDay(-ASHBY_PRINTED_SUM);
  }

  /* 3 GM / (2 a c²) at the semi-major axis he prints. */
  function ashbyRecomputedTerm() {
    return (3 * GM_M3_S2) / (2 * ASHBY_A_M * C_M_S * C_M_S);
  }

  function monopoleSurface() {
    return -GM_M3_S2 / (EARTH_RADIUS_M * C_M_S * C_M_S);
  }

  function direction(us) {
    if (us > 0) return "fast";
    if (us < 0) return "slow";
    return "even";
  }

  function explainOrbit(row) {
    if (!row) return "";
    var speedLine = row.circular
      ? "The speed is the circular-orbit speed, √(GM / r)."
      : "The speed is the one you set, not √(GM / r). This is not a free circular orbit. Zero is a clock held at that altitude.";
    var agree = formatUs(row.velocityUs) === formatUs(row.dopplerUs)
      ? " At this speed the exact factor and the second-order Doppler term −v²/(2c²) print the same microseconds."
      : " The second-order term −v²/(2c²) would read " + formatUs(row.dopplerUs) + ". The card uses the exact Lorentz rate. Adding it to the weak-field gravity term is only a sketch once v is an appreciable fraction of c.";
    var period = row.periodS ? " The circular period is " + formatPeriod(row.periodS) + "." : "";
    return "Radius " + formatKmFromM(row.radiusM) + ", altitude " + formatKmFromM(row.altitudeM) + ", speed " + formatSpeed(row.speedMps) + ". " + speedLine + " The Lorentz factor is " + formatGamma(row.gamma) + ". Special relativity, √(1 − v²/c²) − 1, puts the moving clock " + formatUs(row.velocityUs) + " (" + direction(row.velocityUs) + ") against a clock at rest in the Earth-centered frame. The weak-field potential difference, GM (1/R − 1/r) / c², puts a clock at this radius " + formatUs(row.gravityUs) + " (" + direction(row.gravityUs) + ") against a clock at rest on the equatorial radius. The net drift is " + formatUs(row.netUs) + " (" + direction(row.netUs) + "). A day in these rates is 86,400 seconds." + agree + period;
  }

  function explainTwin(beta) {
    var row = twin(beta);
    if (!row) return "";
    if (row.beta === 0) {
      return "A clock at rest has Lorentz factor 1. One year aboard is 1.0000 years at home. There is no relative motion, so the two clocks agree. The turnaround of the twin paradox is not on this slider.";
    }
    return "A clock moving at " + formatBeta(row.beta) + " (" + formatSpeed(row.speedMps) + ") has Lorentz factor " + formatGamma(row.gamma) + ". One year of proper time aboard corresponds to " + formatYears(row.homeYears) + " on a clock left at rest. This is the constant-speed factor γ = 1/√(1 − v²/c²). The twin paradox also turns the ship around. This slider does not draw that turnaround, and it does not add gravity.";
  }

  function explainLimits() {
    var moon = presetModel("moon");
    var geo = presetModel("geo");
    return "The Moon button is a test-particle circle at the Moon Fact Sheet semimajor axis, 384,400 km. Its circular speed on this GM is " + formatSpeed(moon.speedMps) + " and its period is " + formatPeriod(moon.periodS) + ". The sheet’s mean orbital velocity is 1.022 km/s and its revolution period is 27.3217 days. Earth’s GM alone does not reproduce that month, so those sheet lines are not used. Geostationary on this page is " + formatKmFromM(geo.altitudeM) + ", the radius whose period equals the Earth Fact Sheet sidereal rotation, 23.9345 hours, with this page’s GM. The satellites desk prints 35,786.05 km because it uses that sheet’s rounded GM, 0.39860 × 10^6 km³/s², and the same 23.9345 hours.";
  }

  function explainAshby() {
    var gps = presetModel("gps");
    var atAshby = finish((ASHBY_A_M - EARTH_RADIUS_M) / 1000, circularSpeed(ASHBY_A_M), true);
    var balance = balanceRadiusM();
    return "NIST’s public clock page says GPS satellites fall behind earthbound clocks by 7 microseconds per day because of speed, gain 45 microseconds per day because gravity is weaker, and run 38 microseconds per day fast when the two are combined. Ashby 2003, equation (35), prints 3 GM_E/(2 a c²) + Φ₀/c² = +2.5046×10⁻¹⁰ − 6.9693×10⁻¹⁰ = −4.4647×10⁻¹⁰. He reads the negative sign as the orbiting clock running fast. Over 86,400 seconds that printed offset is " + formatUs(ashbyQuotedFastUs()) + ". He prints GM_E = 3.986004418×10¹⁴ m³/s² and a₁ = 6.3781370×10⁶ m, and later a nominal semi-major axis a₀ = 2.656175×10⁷ m. With this page’s GM and c, 3 GM/(2 a₀ c²) is " + formatSci(ashbyRecomputedTerm(), 5) + ", the digits he prints. In his figure the effects cancel at a ≈ 9,545 km. On this monopole the circular balance, r = 3R/2, is " + formatKmFromM(balance) + ". This page’s GPS preset is the IS-GPS-200N radius 26,559,710 m. It computes " + formatUs(gps.velocityUs) + " from speed, " + formatUs(gps.gravityUs) + " from the potential difference, and " + formatUs(gps.netUs) + " net. At Ashby’s a₀ the same formulas give " + formatUs(atAshby.velocityUs) + ", " + formatUs(atAshby.gravityUs) + ", and " + formatUs(atAshby.netUs) + ". His 38.58 μs/day is larger than this net because his reference is the geoid. The IAU value he cites is L_G = 6.969290134×10⁻¹⁰, so Φ₀/c² = −6.969290134×10⁻¹⁰. This page’s −GM/(R c²) is " + formatSci(monopoleSurface(), 6) + ". Rotation and the quadrupole are in his ground clock and not in this one.";
  }

  return {
    C_M_S: C_M_S,
    GM_M3_S2: GM_M3_S2,
    EARTH_RADIUS_M: EARTH_RADIUS_M,
    SIDEREAL_HOURS: SIDEREAL_HOURS,
    SOLAR_DAY_S: SOLAR_DAY_S,
    GPS_RADIUS_M: GPS_RADIUS_M,
    ISS_ALTITUDE_KM: ISS_ALTITUDE_KM,
    MOON_RADIUS_M: MOON_RADIUS_M,
    ALT_MIN_KM: ALT_MIN_KM,
    ALT_MAX_KM: ALT_MAX_KM,
    BETA_MAX: BETA_MAX,
    ASHBY_A_M: ASHBY_A_M,
    ASHBY_PRINTED_DOPPLER: ASHBY_PRINTED_DOPPLER,
    ASHBY_PRINTED_GEOID: ASHBY_PRINTED_GEOID,
    ASHBY_PRINTED_SUM: ASHBY_PRINTED_SUM,
    ASHBY_CANCEL_RADIUS_M: ASHBY_CANCEL_RADIUS_M,
    IAU_LG: IAU_LG,
    NIST_SLOW_US: NIST_SLOW_US,
    NIST_FAST_US: NIST_FAST_US,
    NIST_NET_US: NIST_NET_US,
    PRESETS: PRESETS,
    presetById: presetById,
    circularSpeed: circularSpeed,
    geoRadiusM: geoRadiusM,
    lorentzGamma: lorentzGamma,
    lorentzFraction: lorentzFraction,
    dopplerFraction: dopplerFraction,
    gravitationalFraction: gravitationalFraction,
    microsecondsPerDay: microsecondsPerDay,
    balanceRadiusM: balanceRadiusM,
    altFromUnit: altFromUnit,
    unitFromAlt: unitFromAlt,
    betaFromSlider: betaFromSlider,
    sliderFromBeta: sliderFromBeta,
    model: model,
    presetModel: presetModel,
    rows: rows,
    twin: twin,
    ashbyQuotedFastUs: ashbyQuotedFastUs,
    ashbyRecomputedTerm: ashbyRecomputedTerm,
    monopoleSurface: monopoleSurface,
    formatSci: formatSci,
    formatKmFromM: formatKmFromM,
    formatSpeed: formatSpeed,
    formatUs: formatUs,
    formatGamma: formatGamma,
    formatYears: formatYears,
    formatBeta: formatBeta,
    formatPeriod: formatPeriod,
    explainOrbit: explainOrbit,
    explainTwin: explainTwin,
    explainLimits: explainLimits,
    explainAshby: explainAshby
  };
});
