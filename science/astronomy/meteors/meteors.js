/*! Observed meteor hourly rate from the IMO zenithal correction.
    HR = ZHR × sin(h) / r^(6.5 − LM) × (1 − k), with h the radiant
    altitude in degrees and k the obstructed fraction of the field.
    h ≤ 0 gives 0. Shower numbers are the IMO 2026 working list.
    Parents the calendar text does not name are the JPL stream table.
    Classroom calculator. Not a forecast and not an observing report. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Meteors = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* IMO ZHR reference: perfectly clear skies, limiting magnitude +6.5,
     radiant overhead. 2026 Meteor Shower Calendar, abbreviations. */
  var LM_REF = 6.5;

  /* Slider and typed-field ends. Storms above the working-list ZHRs
     still fit. Limiting magnitude covers Bortle class 9 through class 1.
     Population index covers the working list and a margin around it. */
  var ZHR_MIN = 0;
  var ZHR_MAX = 500;
  var ALT_MIN = -90;
  var ALT_MAX = 90;
  var LM_MIN = 0;
  var LM_MAX = 8;
  var R_MIN = 1;
  var R_MAX = 5;
  var CLOUD_MIN = 0;
  var CLOUD_MAX = 1;

  /* IMO major-shower page, Table 1. ZHR = 100, limiting magnitude 6.5.
     n is their printed integer. The sine column is this page’s formula. */
  var IMO_TABLE = [
    { h: 90, n: 100 },
    { h: 70, n: 94 },
    { h: 50, n: 77 },
    { h: 40, n: 64 },
    { h: 30, n: 50 },
    { h: 20, n: 34 },
    { h: 10, n: 17 }
  ];

  /* Sky buttons. 6.5 is the IMO reference, which is also the top of
     Bortle class 4 (6.1–6.5). Suburban uses the bright end of Bortle
     class 5 (around 5.6–6.0). City uses Bortle class 8, 4.5 at best.
     John E. Bortle, Sky & Telescope, February 2001. Approximate. */
  var SKIES = [
    {
      id: "dark",
      label: "Dark · 6.5",
      lm: 6.5,
      name: "Dark",
      note: "IMO’s reference limiting magnitude is +6.5. Bortle class 4 lists a maximum naked-eye limit of 6.1 to 6.5. Class 3, a rural sky, lists 6.6 to 7.0. Approximate, and it depends on the observer."
    },
    {
      id: "suburban",
      label: "Suburban · 5.6",
      lm: 5.6,
      name: "Suburban",
      note: "Bortle class 5, a suburban sky, puts the naked-eye limit around 5.6 to 6.0. This button uses 5.6, the bright end of that range. Approximate."
    },
    {
      id: "city",
      label: "City · 4.5",
      lm: 4.5,
      name: "City",
      note: "Bortle class 8, a city sky: the naked eye can pick out stars down to magnitude 4.5 at best. Class 9, inner-city, is 4.0 or less. Approximate."
    }
  ];

  /* IMO 2026 Meteor Shower Calendar, Table 5 (working list, June 2025;
     maximum dates accurate only for 2026). Activity, peak date, solar
     longitude (J2000.0), radiant α/δ, V∞, r, and ZHR are that table.
     Peak times and the three named parents are the shower sections.
     The other parents are JPL SSD meteor streams, from the IAU MDC. */
  var SHOWERS = [
    {
      id: "qua",
      name: "Quadrantids",
      code: "010 QUA",
      active: "Dec 28–Jan 12",
      peakDate: "January 3",
      peakTime: "2026: close to 21h UT",
      solarLong: 283.15,
      ra: 230,
      dec: 49,
      speed: 41,
      r: 2.1,
      zhr: 80,
      zhrNote: "Table 5 ZHR 80.",
      parent: "196256 (2003 EH1)",
      parentWhere: "JPL"
    },
    {
      id: "lyr",
      name: "Lyrids",
      code: "006 LYR",
      active: "Apr 14–Apr 30",
      peakDate: "April 22",
      peakTime: "2026: 19h 40m UT",
      solarLong: 32.32,
      ra: 271,
      dec: 34,
      speed: 49,
      r: 2.1,
      zhr: 18,
      zhrNote: "Table 5 ZHR 18. The section says it can be variable, up to 90.",
      parent: "C/1861 G1 (Thatcher)",
      parentWhere: "IMO"
    },
    {
      id: "eta",
      name: "Eta Aquariids",
      code: "031 ETA",
      active: "Apr 19–May 28",
      peakDate: "May 6",
      peakTime: "",
      solarLong: 45.5,
      ra: 338,
      dec: -1,
      speed: 66,
      r: 2.4,
      zhr: 50,
      zhrNote: "Table 5 ZHR 50.",
      parent: "1P/Halley",
      parentWhere: "JPL"
    },
    {
      id: "per",
      name: "Perseids",
      code: "007 PER",
      active: "Jul 17–Aug 24",
      peakDate: "August 13",
      peakTime: "2026: 02h to 04h UT",
      solarLong: 140.0,
      ra: 48,
      dec: 58,
      speed: 59,
      r: 2.2,
      zhr: 100,
      zhrNote: "Table 5 ZHR 100.",
      parent: "109P/Swift-Tuttle",
      parentWhere: "IMO"
    },
    {
      id: "ori",
      name: "Orionids",
      code: "008 ORI",
      active: "Oct 2–Nov 7",
      peakDate: "October 21",
      peakTime: "",
      solarLong: 208,
      ra: 95,
      dec: 16,
      speed: 66,
      r: 2.5,
      zhr: 20,
      zhrNote: "Table 5 ZHR 20. The section header prints 20+.",
      parent: "1P/Halley",
      parentWhere: "JPL"
    },
    {
      id: "leo",
      name: "Leonids",
      code: "013 LEO",
      active: "Nov 6–Nov 30",
      peakDate: "November 17",
      peakTime: "2026: 23h 45m UT",
      solarLong: 235.27,
      ra: 152,
      dec: 22,
      speed: 71,
      r: 2.5,
      zhr: 15,
      zhrNote: "Table 5 and the section: ZHR about 15.",
      parent: "55P/Tempel-Tuttle",
      parentWhere: "IMO"
    },
    {
      id: "gem",
      name: "Geminids",
      code: "004 GEM",
      active: "Dec 4–Dec 20",
      peakDate: "December 14",
      peakTime: "2026: 14h UT",
      solarLong: 262.2,
      ra: 112,
      dec: 33,
      speed: 35,
      r: 2.6,
      zhr: 150,
      zhrNote: "Table 5 ZHR 150.",
      parent: "3200 Phaethon",
      parentWhere: "JPL"
    }
  ];

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function inRange(n, lo, hi) {
    return finite(n) && n >= lo && n <= hi;
  }

  function showerById(id) {
    for (var i = 0; i < SHOWERS.length; i++) {
      if (SHOWERS[i].id === id) return SHOWERS[i];
    }
    return null;
  }

  function skyById(id) {
    for (var i = 0; i < SKIES.length; i++) {
      if (SKIES[i].id === id) return SKIES[i];
    }
    return null;
  }

  /* Kinetic energy of one gram at speed v, in km/s.
     ½ (v × 10³ m/s)² × 10⁻³ kg = ½ v² kilojoules. */
  function kineticKjPerGram(speedKmS) {
    if (!finite(speedKmS) || speedKmS < 0) return null;
    return 0.5 * speedKmS * speedKmS;
  }

  /* IMO field factor. A stated coverage of 50% is a correction of 2.0
     (IMO visual FAQ), so F = 1/(1−k) while k < 1. At k = 1 the expected
     count is 0 and F is not used. */
  function fieldFactor(cloudFraction) {
    if (!inRange(cloudFraction, CLOUD_MIN, CLOUD_MAX)) return null;
    if (cloudFraction === 1) return null;
    return 1 / (1 - cloudFraction);
  }

  function hourlyRate(input) {
    if (!input) return null;
    var zhr = input.zhr;
    var h = input.altitudeDeg;
    var lm = input.limitingMag;
    var r = input.populationIndex;
    var k = input.cloudFraction;
    if (!inRange(zhr, ZHR_MIN, ZHR_MAX)) return null;
    if (!inRange(h, ALT_MIN, ALT_MAX)) return null;
    if (!inRange(lm, LM_MIN, LM_MAX)) return null;
    if (!inRange(r, R_MIN, R_MAX)) return null;
    if (!inRange(k, CLOUD_MIN, CLOUD_MAX)) return null;

    var clear = 1 - k;
    if (h <= 0 || clear === 0 || zhr === 0) {
      return {
        hourlyRate: 0,
        sine: h <= 0 ? 0 : Math.sin(h * Math.PI / 180),
        magnitudeFactor: Math.pow(r, LM_REF - lm),
        clearFraction: clear,
        belowHorizon: h < 0
      };
    }

    var sine = Math.sin(h * Math.PI / 180);
    var mag = Math.pow(r, LM_REF - lm);
    if (!isFinite(sine) || !isFinite(mag) || mag === 0) return null;
    var hr = zhr * sine / mag * clear;
    if (!isFinite(hr) || hr < 0) return null;
    return {
      hourlyRate: hr,
      sine: sine,
      magnitudeFactor: mag,
      clearFraction: clear,
      belowHorizon: false
    };
  }

  /* Rate versus radiant altitude for the chart. Altitude runs 0 to 90. */
  function rateCurve(input, steps) {
    var n = steps == null ? 19 : steps;
    if (!input || n < 2) return null;
    var rows = [];
    var i;
    for (i = 0; i < n; i++) {
      var h = (ALT_MAX * i) / (n - 1);
      var row = hourlyRate({
        zhr: input.zhr,
        altitudeDeg: h,
        limitingMag: input.limitingMag,
        populationIndex: input.populationIndex,
        cloudFraction: input.cloudFraction
      });
      if (!row) return null;
      rows.push({ altitudeDeg: h, hourlyRate: row.hourlyRate });
    }
    return rows;
  }

  function fmtTrim(n, digits) {
    var s = n.toFixed(digits);
    return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function fmtRate(n) {
    if (!finite(n)) return "—";
    if (n >= 100) return fmtTrim(n, 1);
    if (n >= 10) return fmtTrim(n, 1);
    return fmtTrim(n, 2);
  }

  function fmtGrouped(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var out = parts[0];
    if (digits > 0) out += "." + parts[1];
    out = out.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    return neg ? "−" + out : out;
  }

  function fmtSignedDeg(n) {
    if (!finite(n)) return "—";
    var body = fmtTrim(Math.abs(n), 2) + "°";
    if (n > 0) return "+" + body;
    if (n < 0) return "−" + body;
    return body;
  }

  return {
    LM_REF: LM_REF,
    ZHR_MIN: ZHR_MIN,
    ZHR_MAX: ZHR_MAX,
    ALT_MIN: ALT_MIN,
    ALT_MAX: ALT_MAX,
    LM_MIN: LM_MIN,
    LM_MAX: LM_MAX,
    R_MIN: R_MIN,
    R_MAX: R_MAX,
    CLOUD_MIN: CLOUD_MIN,
    CLOUD_MAX: CLOUD_MAX,
    IMO_TABLE: IMO_TABLE,
    SKIES: SKIES,
    SHOWERS: SHOWERS,
    showerById: showerById,
    skyById: skyById,
    kineticKjPerGram: kineticKjPerGram,
    fieldFactor: fieldFactor,
    hourlyRate: hourlyRate,
    rateCurve: rateCurve,
    fmtRate: fmtRate,
    fmtGrouped: fmtGrouped,
    fmtSignedDeg: fmtSignedDeg
  };
});
