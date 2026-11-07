/*! Solar wind and coronal mass ejections: a classroom schematic.

    The speeds are quoted ranges. The time is one division.

    NOAA SWPC says CMEs travel from slower than 250 km/s to as fast as
    near 3000 km/s. The slider starts at 250, the boundary that sentence
    names, and ends at 3000. It does not go below 250, because that page
    does not print a slower floor.

    NASA's Scientific Visualization Studio says the slow wind averages
    about 300-500 km/s and the fast wind about 500-800 km/s. NOAA says
    coronal holes run from 500 to 800 km/s, and that the usual slow wind
    in the equatorial plane is about 400 km/s. Marshall says about 400
    km/s, low 300 km/s over streamers, and high 800 km/s over coronal
    holes. Those marks are presets. A mark between them is the slider.

    The distance is the NSSDCA Earth Fact Sheet semimajor axis,
    149.598 x 10^6 km. Time is that distance divided by the selected
    speed. It is not NOAA's 15-18 hours and not NASA's as little as
    15 hours. Those are different sentences.

    The Earth-directed and glancing cartoons do not change the division.
    The spiral is not an angle. Not a forecast. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Cme = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AU_MILLION_KM = 149.598;
  var AU_KM = 149598000;
  var CME_BOUND_KMS = 250;
  var CME_FAST_KMS = 3000;
  var STREAMER_KMS = 300;
  var SLOW_KMS = 400;
  var BAND_EDGE_KMS = 500;
  var FAST_KMS = 800;
  var SVS_SLOW_LO = 300;
  var SVS_SLOW_HI = 500;
  var SVS_FAST_LO = 500;
  var SVS_FAST_HI = 800;
  var NOAA_HOLE_LO = 500;
  var NOAA_HOLE_HI = 800;
  var ROTATION_DAYS = 27;
  var CLASSROOM_CROSS_MS = 8000;
  var OPENING_KMS = 400;

  var ARRIVAL = "NOAA says the fastest Earth-directed CMEs can reach our planet in as little as 15–18 hours, and slower CMEs can take several days. NASA Science says as little as 15 hours, and several days for the slowest. Those sentences are not this division.";

  function clampSpeed(speed) {
    if (speed == null || !isFinite(speed)) return OPENING_KMS;
    var n = Math.round(speed);
    if (n < CME_BOUND_KMS) return CME_BOUND_KMS;
    if (n > CME_FAST_KMS) return CME_FAST_KMS;
    return n;
  }

  function formatFixed2(n) {
    if (n == null || !isFinite(n)) return "";
    var sign = n < 0 ? "-" : "";
    var cents = Math.round(Math.abs(n) * 100);
    var whole = Math.floor(cents / 100);
    var frac = cents % 100;
    return sign + whole + "." + (frac < 10 ? "0" + frac : String(frac));
  }

  function formatKmS(n) {
    var s = String(n);
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function travel(speed) {
    var v = clampSpeed(speed);
    var seconds = AU_KM / v;
    var hours = seconds / 3600;
    var days = seconds / 86400;
    return {
      speed: v,
      seconds: seconds,
      hours: hours,
      days: days,
      hoursText: formatFixed2(hours),
      daysText: formatFixed2(days)
    };
  }

  function bandId(v) {
    if (v === CME_BOUND_KMS) return "bound";
    if (v < STREAMER_KMS) return "below-streamer";
    if (v === STREAMER_KMS) return "streamer";
    if (v < SLOW_KMS) return "slow-band";
    if (v === SLOW_KMS) return "about-400";
    if (v < BAND_EDGE_KMS) return "slow-upper";
    if (v === BAND_EDGE_KMS) return "edge";
    if (v < FAST_KMS) return "fast-band";
    if (v === FAST_KMS) return "fast-end";
    if (v < CME_FAST_KMS) return "above-wind";
    return "cme-fast";
  }

  function presetId(speed) {
    var v = clampSpeed(speed);
    if (v === CME_BOUND_KMS) return "bound";
    if (v === STREAMER_KMS) return "streamer";
    if (v === SLOW_KMS) return "slow";
    if (v === BAND_EDGE_KMS) return "edge";
    if (v === FAST_KMS) return "fast";
    if (v === CME_FAST_KMS) return "cme-fast";
    return "";
  }

  function bandSentence(v) {
    if (v === CME_BOUND_KMS) {
      return "This mark is the boundary in NOAA’s sentence: CMEs range from slower than 250 km/s to as fast as near 3,000 km/s. The slider does not go below 250, because that page does not print a slower floor.";
    }
    if (v < STREAMER_KMS) {
      return "Between NOAA’s slower-than-250 km/s boundary and Marshall’s low speed over streamers, 300 km/s. Still inside NOAA’s CME range. Not a measured ejection.";
    }
    if (v === STREAMER_KMS) {
      return "Marshall’s low speed over streamers is 300 km/s. NASA’s Scientific Visualization Studio puts the slow wind at about 300–500 km/s, and 300 km/s is the near end of that band. NOAA’s about 400 km/s is a different sentence.";
    }
    if (v < SLOW_KMS) {
      return "Inside NASA SVS’s slow band, about 300–500 km/s, and below NOAA’s about 400 km/s. Not a measured wind.";
    }
    if (v === SLOW_KMS) {
      return "NOAA says the most common slow wind in the equatorial plane is about 400 km/s. Marshall says the wind streams off the Sun at about 400 km/s, about 1 million miles per hour. NASA SVS’s slow band, about 300–500 km/s, contains this mark. The miles per hour belong to Marshall’s sentence. This page does not convert them.";
    }
    if (v < BAND_EDGE_KMS) {
      return "Inside NASA SVS’s slow band, about 300–500 km/s, above the about-400 km/s mark and below the 500 km/s edge. Not a measured wind.";
    }
    if (v === BAND_EDGE_KMS) {
      return "500 km/s is the far end of NASA SVS’s slow band, about 300–500 km/s, and the near end of the fast band, about 500–800 km/s. NOAA’s coronal-hole wind starts at the same 500 km/s and runs to 800 km/s.";
    }
    if (v < FAST_KMS) {
      return "Inside the fast wind: NOAA’s coronal holes, 500 to 800 km/s, and NASA SVS’s fast band, about 500–800 km/s. Not a measured wind.";
    }
    if (v === FAST_KMS) {
      return "800 km/s is the far end of NOAA’s coronal-hole range and of NASA SVS’s fast band, about 500–800 km/s. Marshall’s high speed over coronal holes is 800 km/s.";
    }
    if (v < CME_FAST_KMS) {
      return "Above the cited fast-wind bands and inside NOAA’s CME range, which runs to near 3,000 km/s. Not a measured ejection.";
    }
    return "NOAA’s fast end is as fast as near 3,000 km/s. NASA Science says the fastest CMEs travel at millions of miles per hour. This page does not convert 3,000 km/s into miles per hour.";
  }

  function band(speed) {
    var v = clampSpeed(speed);
    var id = bandId(v);
    var titles = {
      bound: ["NOAA · CME range", "Slower than 250 km/s", "The boundary the sentence names"],
      "below-streamer": ["Between two cited marks", formatKmS(v) + " km/s", "Not a measured ejection"],
      streamer: ["Marshall · streamers", "300 km/s", "Low over streamers · SVS slow near end"],
      "slow-band": ["NASA SVS · slow wind", formatKmS(v) + " km/s", "Inside about 300–500 km/s"],
      "about-400": ["NOAA · slow wind", "About 400 km/s", "Equatorial plane · Marshall’s about 400"],
      "slow-upper": ["NASA SVS · slow wind", formatKmS(v) + " km/s", "Above about 400 · below 500"],
      edge: ["Shared band edge", "500 km/s", "Slow far end · fast and coronal-hole near end"],
      "fast-band": ["NOAA · coronal holes", formatKmS(v) + " km/s", "Inside 500 to 800 km/s"],
      "fast-end": ["Fast wind · far end", "800 km/s", "Coronal holes · Marshall’s high speed"],
      "above-wind": ["NOAA · CME range", formatKmS(v) + " km/s", "Above the cited fast-wind bands"],
      "cme-fast": ["NOAA · CME range", "Near 3,000 km/s", "The fast end of the quoted range"]
    };
    var row = titles[id];
    return { id: id, tier: row[0], title: row[1], range: row[2], sentence: bandSentence(v) };
  }

  function shorterThanFifteen(t) {
    var shown = Math.round(t.hours * 100) / 100;
    if (shown < 15) {
      return " At this speed the division rounds to less than 15.00 hours. NOAA’s 15–18 hours and NASA’s 15 hours stay a different kind of time. This page does not adjust the division to match them.";
    }
    return "";
  }

  function aimClause(aim) {
    if (aim === "glance") {
      return " The cartoon draws the blob off the Sun–Earth line. The offset is not an angle, and the toggle does not change this time.";
    }
    return " The cartoon puts the blob on the Sun–Earth line. The toggle does not change this time.";
  }

  function readout(speed, aim) {
    var t = travel(speed);
    return "Selected speed " + formatKmS(t.speed) + " km/s. " + bandSentence(t.speed) + " Straight-line time: " + t.hoursText + " hours, which is " + t.daysText + " days. That is the fact sheet’s 149.598 × 10^6 km divided by the selected speed. " + ARRIVAL + shorterThanFifteen(t) + aimClause(aim);
  }

  function sliderText(speed) {
    var v = clampSpeed(speed);
    var t = travel(v);
    var where = presetId(v) ? "a cited mark" : "between cited marks";
    return formatKmS(v) + " km/s, " + where + ". Straight-line time " + t.hoursText + " hours (" + t.daysText + " days). Not an arrival.";
  }

  function aimCaption(aim) {
    if (aim === "glance") {
      return "Glancing cartoon. The blob is drawn off the Sun–Earth line. NASA Science says CMEs can detonate in different directions. NOAA lists direction among the parameters forecasters infer from coronagraph imagery. This offset is so the two cartoons can be told apart. It is not an angle, not a cone, and not a miss. The travel-time division stays the same.";
    }
    return "Earth-directed cartoon. The blob sits on the Sun–Earth line. NASA Science says CMEs can detonate in different directions, and that one directed at Earth can arrive in as little as 15 hours. NOAA lists direction among the parameters forecasters infer from coronagraph imagery. This toggle only moves the cartoon. It does not change the travel-time division, and it is not a hit.";
  }

  function detail(speed, aim) {
    var v = clampSpeed(speed);
    var t = travel(v);
    var b = band(v);
    var glance = aim === "glance";
    var why = "The drawing is a Sun–Earth line. " + b.sentence + " The straight-line time is " + t.hoursText + " hours, or " + t.daysText + " days: the fact sheet’s 149.598 × 10^6 km divided by " + formatKmS(v) + " km/s. " + ARRIVAL + shorterThanFifteen(t) + " " + aimCaption(aim) + " The blob crosses the frame in 8 seconds. That timer is not this time. Nothing here is a forecast.";
    return {
      tier: b.tier,
      title: b.title,
      range: b.range,
      stats: [
        ["Selected speed", formatKmS(v) + " km/s"],
        ["Straight-line time", t.hoursText + " hours"],
        ["Same time in days", t.daysText + " days"],
        ["Distance used", "149.598 × 10^6 km"],
        ["Cartoon", glance ? "Off the line · not an angle" : "On the Sun–Earth line"]
      ],
      why: why
    };
  }

  function spiralNote() {
    return "NASA Science says the solar wind drags the Sun’s magnetic field into a spiral because the Sun rotates, and names that spiral for Eugene Parker. NOAA says the Sun rotates every 27 days and the wind becomes a complex spiral of high and low speeds, like the skirt of a twirling ballerina. The curves are a sketch of those two sentences. They do not use the 27 days, they do not change with the speed slider, and they are not an angle at Earth.";
  }

  function limitsNote() {
    return "Educational schematic. Not a space-weather forecast, not a Kp or G-scale predictor, not a live CME catalog, and not a mission design tool. The slider walks NOAA’s CME range from slower than 250 km/s to near 3,000 km/s. Marks at 300, 400, 500, and 800 km/s are the solar-wind sentences named on the card. A mark between them is the slider. It is not a measured wind and not a measured ejection. The time is the Earth Fact Sheet semimajor axis, 149.598 × 10^6 km, divided by the selected speed. It is a straight line. It is not NOAA’s 15–18 hours and not NASA’s as little as 15 hours. The Earth-directed and glancing buttons move the cartoon. They do not change the path length. The spiral is a sketch of NASA’s Parker sentence and NOAA’s 27-day ballerina skirt. No angle is computed. The blob crosses the drawing on a fixed classroom timer of 8 seconds. That timer is not the readout.";
  }

  return {
    AU_MILLION_KM: AU_MILLION_KM,
    AU_KM: AU_KM,
    CME_BOUND_KMS: CME_BOUND_KMS,
    CME_FAST_KMS: CME_FAST_KMS,
    STREAMER_KMS: STREAMER_KMS,
    SLOW_KMS: SLOW_KMS,
    BAND_EDGE_KMS: BAND_EDGE_KMS,
    FAST_KMS: FAST_KMS,
    SVS_SLOW_LO: SVS_SLOW_LO,
    SVS_SLOW_HI: SVS_SLOW_HI,
    SVS_FAST_LO: SVS_FAST_LO,
    SVS_FAST_HI: SVS_FAST_HI,
    NOAA_HOLE_LO: NOAA_HOLE_LO,
    NOAA_HOLE_HI: NOAA_HOLE_HI,
    ROTATION_DAYS: ROTATION_DAYS,
    CLASSROOM_CROSS_MS: CLASSROOM_CROSS_MS,
    OPENING_KMS: OPENING_KMS,
    clampSpeed: clampSpeed,
    travel: travel,
    band: band,
    presetId: presetId,
    readout: readout,
    sliderText: sliderText,
    aimCaption: aimCaption,
    detail: detail,
    spiralNote: spiralNote,
    limitsNote: limitsNote
  };
});
