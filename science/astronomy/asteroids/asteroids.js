/*! Main asteroid belt and Kirkwood gaps for a classroom desk.

    A p:q ratio means the asteroid completes p orbits while Jupiter
    completes q. JPL states the 3:1 that way: the asteroid completes
    3 orbits for every 1 orbit of Jupiter
    (https://ssd.jpl.nasa.gov/diagrams/mb_hist.html).

    The anchor is the NSSDCA Jupiter Fact Sheet, Jupiter Mean Orbital
    Elements (J2000): semimajor axis 5.20336301 AU, and the sidereal
    orbit period 4,332.589 days. The fact-sheet notes list JPL
    Ephemeris DE430/DE431 among the sources of the values on those
    sheets. This is the same pair the resonances desk uses.

    Kepler’s third law for one central mass, anchored to that pair:
    a = a_Jupiter * (q/p)^(2/3)
    P = P_Jupiter * (a / a_Jupiter)^(3/2)
    At a listed ratio, P is P_Jupiter * q/p.

    The histogram is a schematic. Bar height is not a count. JPL’s
    June 2007 histogram of 156,929 numbered asteroids is not replotted.

    Named orbits are JPL Small-Body Database solutions. Their printed
    periods are not replaced by the anchored period.

    Not an ephemeris and not a census. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Asteroids = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var JUPITER_AU = 5.20336301;
  var JUPITER_AU_TEXT = "5.20336301";
  var JUPITER_DAYS = 4332.589;
  var YEAR_DAYS = 365.256;
  var CHART_MIN = 2;
  var CHART_MAX = 3.5;
  var BIN_AU = 0.025;
  var SLIDER_MIN = 1.8;
  var SLIDER_MAX = 5.5;
  var NEAR_REL = 0.01;
  var EXACT_REL = 1e-8;

  /* kind gap: a depletion JPL labels, or the 4:1 this page also computes.
     primary: labeled on JPL’s June 2007 histogram. */
  var GAPS = [
    { id: "4-1", name: "4:1", p: 4, q: 1, kind: "gap", primary: false },
    { id: "3-1", name: "3:1", p: 3, q: 1, kind: "gap", primary: true },
    { id: "5-2", name: "5:2", p: 5, q: 2, kind: "gap", primary: true },
    { id: "7-3", name: "7:3", p: 7, q: 3, kind: "gap", primary: true },
    { id: "2-1", name: "2:1", p: 2, q: 1, kind: "gap", primary: true },
    { id: "3-2", name: "3:2", p: 3, q: 2, kind: "hilda", primary: false },
    { id: "1-1", name: "1:1", p: 1, q: 1, kind: "trojan", primary: false }
  ];

  var BODIES = [
    {
      id: "vesta",
      name: "Vesta",
      full: "4 Vesta",
      a: 2.361365965127599,
      aText: "2.361365965127599",
      eText: "0.09020374382834395",
      iText: "7.143925545058711",
      perText: "1325.389042911101",
      orbitId: "36",
      epoch: "2461200.5",
      soln: "2021-04-13 11:15:57",
      code: "MBA",
      klass: "Main-belt Asteroid"
    },
    {
      id: "ceres",
      name: "Ceres",
      full: "1 Ceres",
      a: 2.765552595034094,
      aText: "2.765552595034094",
      eText: "0.07969229514816586",
      iText: "10.58802780183462",
      perText: "1679.853119758983",
      orbitId: "48",
      epoch: "2461200.5",
      soln: "2021-04-13 11:04:44",
      code: "MBA",
      klass: "Main-belt Asteroid"
    },
    {
      id: "pallas",
      name: "Pallas",
      full: "2 Pallas",
      a: 2.769559010737709,
      aText: "2.769559010737709",
      eText: "0.2307000995648547",
      iText: "34.93279321851542",
      perText: "1683.504809564834",
      orbitId: "74",
      epoch: "2461200.5",
      soln: "2026-06-05 03:03:25",
      code: "MBA",
      klass: "Main-belt Asteroid"
    },
    {
      id: "hygiea",
      name: "Hygiea",
      full: "10 Hygiea",
      a: 3.150974033963701,
      aText: "3.150974033963701",
      eText: "0.1067092741240963",
      iText: "3.829529946447122",
      perText: "2042.987283349627",
      orbitId: "129",
      epoch: "2461200.5",
      soln: "2026-06-16 11:32:04",
      code: "MBA",
      klass: "Main-belt Asteroid"
    }
  ];

  function byId(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function commas(intPart) {
    return String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatDays(d) {
    var n = Number(d).toFixed(3);
    var parts = n.split(".");
    return commas(parts[0]) + "." + parts[1] + " days";
  }

  function formatPrintedDays(text) {
    var parts = String(text).split(".");
    return commas(parts[0]) + (parts.length > 1 ? "." + parts[1] : "") + " days";
  }

  function formatYears(days) {
    return (Number(days) / YEAR_DAYS).toFixed(4) + " years";
  }

  function formatRatio(r) {
    return Number(r).toFixed(6);
  }

  function resonantAu(p, q) {
    return JUPITER_AU * Math.pow(q / p, 2 / 3);
  }

  function anchoredDays(au) {
    return JUPITER_DAYS * Math.pow(au / JUPITER_AU, 3 / 2);
  }

  function orbitsPerJupiter(au) {
    return Math.pow(JUPITER_AU / au, 3 / 2);
  }

  function axisText(p, q) {
    if (p === 1 && q === 1) return JUPITER_AU_TEXT + " AU";
    return resonantAu(p, q).toFixed(6) + " AU";
  }

  function gapRecord(g) {
    return {
      id: g.id,
      name: g.name,
      p: g.p,
      q: g.q,
      kind: g.kind,
      primary: g.primary,
      au: g.p === 1 && g.q === 1 ? JUPITER_AU : resonantAu(g.p, g.q),
      auText: axisText(g.p, g.q),
      days: g.p === 1 && g.q === 1 ? JUPITER_DAYS : JUPITER_DAYS * g.q / g.p,
      daysText: formatDays(g.p === 1 && g.q === 1 ? JUPITER_DAYS : JUPITER_DAYS * g.q / g.p)
    };
  }

  function gaps() {
    return GAPS.map(gapRecord);
  }

  function gapById(id) {
    var g = byId(GAPS, id);
    return g ? gapRecord(g) : null;
  }

  function bodyById(id) {
    return byId(BODIES, id);
  }

  function bodyIds() {
    return BODIES.map(function (b) { return b.id; });
  }

  function gapIds() {
    return GAPS.map(function (g) { return g.id; });
  }

  function bins() {
    var list = gaps().filter(function (g) { return g.kind === "gap"; });
    var n = Math.round((CHART_MAX - CHART_MIN) / BIN_AU);
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      var a0 = CHART_MIN + i * BIN_AU;
      var a1 = a0 + BIN_AU;
      var notch = null;
      var k;
      for (k = 0; k < list.length; k++) {
        if (list[k].au >= a0 && list[k].au < a1) notch = list[k].id;
      }
      out.push({ a0: a0, a1: a1, notch: notch });
    }
    return out;
  }

  function nearest(au) {
    var ratio = orbitsPerJupiter(au);
    var best = null;
    var i;
    var list = gaps();
    for (i = 0; i < list.length; i++) {
      var target = list[i].p / list[i].q;
      var rel = Math.abs(ratio - target) / target;
      if (!best || rel < best.rel) {
        best = { gap: list[i], rel: rel, ratio: ratio, target: target };
      }
    }
    best.exact = best.rel <= EXACT_REL;
    best.near = best.rel <= NEAR_REL;
    return best;
  }

  function chartGaps() {
    return gaps().filter(function (g) { return g.kind === "gap"; });
  }

  function stretch(au) {
    var list = chartGaps();
    var i;
    for (i = 0; i < list.length; i++) {
      if (Math.abs(au - list[i].au) / list[i].au <= EXACT_REL) {
        return "On the computed " + list[i].name + ".";
      }
    }
    if (au < list[0].au) return "Sunward of the 4:1 on this chart.";
    for (i = 0; i < list.length - 1; i++) {
      if (au > list[i].au && au < list[i + 1].au) {
        return "Between the " + list[i].name + " and the " + list[i + 1].name + " on this chart.";
      }
    }
    return "Outward of the 2:1 on this chart.";
  }

  function windowOf(au) {
    if (au < 2) {
      return "Sunward of JPL’s Main-belt window. JPL’s Inner Main-belt class is a below 2.0 au and q above 1.666 au. This slider does not set perihelion, so it does not assign that class.";
    }
    if (au === 2) {
      return "2.0 au is the printed edge. JPL’s Main-belt class is a above 2.0 au and below 3.2 au, so this value is not inside it.";
    }
    if (au < 3.2) {
      return "Inside the semi-major-axis half of JPL’s Main-belt class, a above 2.0 au and below 3.2 au. The class also requires q above 1.666 au, which this slider does not set.";
    }
    if (au === 3.2) {
      return "3.2 au is the printed edge between JPL’s Main-belt class and the Outer Main-belt class. Neither inequality includes the edge.";
    }
    if (au < 4.6) {
      return "Inside JPL’s Outer Main-belt window, a above 3.2 au and below 4.6 au.";
    }
    if (au === 4.6) {
      return "4.6 au is the printed edge between JPL’s Outer Main-belt class and the Jupiter Trojan class. Neither inequality includes the edge.";
    }
    if (au < 5.5) {
      return "Inside the semi-major-axis half of JPL’s Jupiter Trojan class, a above 4.6 au and below 5.5 au. The class also requires e below 0.3, which this slider does not set.";
    }
    if (au === 5.5) {
      return "5.5 au is the outer edge of JPL’s Jupiter Trojan window. The class is a below 5.5 au, so this value is not inside it.";
    }
    return "Outward of JPL’s Jupiter Trojan window, which stops below 5.5 au.";
  }

  function onChart(au) {
    return au >= CHART_MIN && au <= CHART_MAX;
  }

  function flagSentence(hit) {
    if (hit.exact) {
      return "On the " + hit.gap.name + ". The period ratio is " + hit.gap.p + "/" + hit.gap.q + ".";
    }
    if (hit.near) {
      return "Near the " + hit.gap.name + ". Near, on this card, means the period ratio is within 1 percent of " + hit.gap.p + "/" + hit.gap.q + ". That 1 percent is a flag. It is not a measured width of a gap.";
    }
    return "Not within 1 percent of a listed ratio. The nearest listed ratio is the " + hit.gap.name + ". The 1 percent is a flag. It is not a measured width of a gap.";
  }

  function anchorSentence() {
    return "Jupiter’s fact sheet, mean orbital elements (J2000), prints a semimajor axis of " + JUPITER_AU_TEXT + " AU and a sidereal orbit period of 4,332.589 days.";
  }

  function powerPhrase(p, q) {
    return JUPITER_AU_TEXT + " times (" + q + "/" + p + ") to the power 2/3";
  }

  function observedSentence(g) {
    if (g.kind === "hilda") {
      return "Hilda group, not a gap. JPL’s elements diagram labels the group. The axis is outside the 2.0 to 3.5 AU chart.";
    }
    if (g.kind === "trojan") {
      return "The 1:1 line is Jupiter’s fact-sheet axis. JPL’s Trojan class is the window a above 4.6 au and below 5.5 au, and e below 0.3, not this single line. Outside the 2.0 to 3.5 AU chart.";
    }
    if (!g.primary) {
      return "Computed on this page. JPL’s June 2007 histogram labels the primary gaps as 3:1, 5:2, 7:3, and 2:1. It does not label the 4:1.";
    }
    return "Kirkwood gap labeled on JPL’s June 2007 histogram of 156,929 numbered asteroids.";
  }

  function gapWhy(g) {
    var ratioName = g.p + ":" + g.q;
    var lead;
    if (g.kind === "hilda") {
      lead = "The 3:2, the Hilda group. Not a gap. ";
    } else if (g.kind === "trojan") {
      lead = "The 1:1, a Trojan orbit in the sense of the period ratio. ";
    } else if (g.primary) {
      lead = "The " + ratioName + " Kirkwood gap. ";
    } else {
      lead = "The 4:1 with Jupiter. ";
    }
    var periodBit = "The period is 4,332.589 days times " + g.q + "/" + g.p + ", which computes " + g.daysText + " (" + formatYears(g.days) + " of " + YEAR_DAYS + " days).";
    var axisBit = "The semi-major axis is " + powerPhrase(g.p, g.q) + ", which computes " + g.auText + ".";
    var law = " That is Kepler’s third law with this fact sheet as the anchor: a / a_Jupiter = (P / P_Jupiter) to the power 2/3.";
    var tail;
    if (g.kind === "hilda") {
      tail = " JPL’s elements diagram of June 2007 labels the Hilda group, between the main belt and the Trojans. Ip’s 1976 abstract, on the NASA Technical Reports Server, says the 3:2 resonant coupling to Jupiter of some of these asteroids is stable. The resonances desk uses this same axis. The chart from 2.0 to 3.5 AU does not reach it. Bar height on that chart is not a count.";
    } else if (g.kind === "trojan") {
      tail = " NASA Science says Trojan asteroids share an orbit with a larger planet and gather around the L4 and L5 Lagrangian points, where the pull of the Sun and the planet balances the tendency to fly out of orbit. JPL’s Jupiter Trojan class is a above 4.6 au and below 5.5 au, and e below 0.3. The Lagrange desk is the five points. This line is the fact-sheet axis, not the width of the class, and it is outside the 2.0 to 3.5 AU chart. Bar height on that chart is not a count.";
    } else if (!g.primary) {
      tail = " JPL’s June 2007 histogram labels the primary gaps as 3:1, 5:2, 7:3, and 2:1, and says a resonance changes the orbital elements enough to open a gap in semi-major axis. That page does not label the 4:1. This page still computes it, because it is the same kind of ratio. The histogram here is a schematic. Bar height is not a count, and the notch is one bin, " + BIN_AU + " AU, so the line can be seen. That width is not a measured gap.";
    } else {
      tail = " JPL’s June 2007 histogram of 156,929 numbered asteroids labels a gap at this resonance. This page marks the computed axis. It does not replot those orbits. The histogram here is a schematic. Bar height is not a count, and the notch is one bin, " + BIN_AU + " AU, so the line can be seen. That width is not a measured gap.";
    }
    return lead + anchorSentence() + " A " + ratioName + " ratio means the inner body completes " + g.p + " orbits while Jupiter completes " + g.q + ". " + axisBit + " " + periodBit + law + tail;
  }

  function sizeSentence(id) {
    if (id === "ceres") {
      return "NASA Science gives a radius of 476 km. Twice that is 952 km, the circle on the dwarf-planets desk. JPL’s diameter on this same record is 939.4 km, sigma 0.2 km, citing Nature, volume 537, pages 515–517 (22 September 2016). The NSSDCA Asteroid Fact Sheet prints 965 × 961 × 891 km. Those lines are not averaged.";
    }
    if (id === "vesta") {
      return "JPL’s diameter is 522.77 km, sigma 0.1 km, citing Park and coauthors 2025. NASA Science says Vesta is about 329 miles (530 kilometers) across and calls it the largest asteroid on that page. Ceres is the dwarf planet. Those size lines are not averaged.";
    }
    if (id === "pallas") {
      return "JPL’s diameter is 513 km, sigma 6 km, and the extent is 568 × 532 × 448 km, sigma 12 km. Both cite Marsset and coauthors, Nature Astronomy 4, 569–576 (2020).";
    }
    return "JPL’s diameter is 407.12 km, sigma 6.8 km, citing IRAS-A-FPA-3-RDR-IMPS-V6.0.";
  }

  function bodyWhy(b) {
    var hit = nearest(b.a);
    var anchored = anchoredDays(b.a);
    return b.name + ". JPL Small-Body Database orbit solution " + b.orbitId + ", epoch JD " + b.epoch + ", solution date " + b.soln + ". Semi-major axis " + b.aText + " AU, eccentricity " + b.eText + ", inclination " + b.iText + "°. JPL’s sidereal period is " + formatPrintedDays(b.perText) + ", which is " + formatYears(Number(b.perText)) + " of " + YEAR_DAYS + " days. Orbit class " + b.klass + " (" + b.code + "). " + sizeSentence(b.id) + " The period on this card is 4,332.589 days times (" + b.aText + " / " + JUPITER_AU_TEXT + ") to the power 3/2, which computes " + formatDays(anchored) + ". It is not JPL’s period. " + flagSentence(hit) + " " + stretch(b.a) + " The chart is a schematic. Bar height is not a count.";
  }

  function freeWhy(au) {
    var hit = nearest(au);
    var days = anchoredDays(au);
    var where = onChart(au)
      ? "The mark falls on the 2.0 to 3.5 AU chart."
      : "The mark is outside the 2.0 to 3.5 AU chart.";
    return "Semi-major axis " + formatRatio(au) + " AU. " + anchorSentence() + " The period is 4,332.589 days times (" + formatRatio(au) + " / " + JUPITER_AU_TEXT + ") to the power 3/2, which computes " + formatDays(days) + " (" + formatYears(days) + " of " + YEAR_DAYS + " days). Orbits per Jupiter orbit are (" + JUPITER_AU_TEXT + " / " + formatRatio(au) + ") to the power 3/2, which computes " + formatRatio(orbitsPerJupiter(au)) + ". " + flagSentence(hit) + " " + stretch(au) + " " + windowOf(au) + " " + where + " The chart is a schematic. Bar height is not a count.";
  }

  function formatPick(au) {
    var s = Number(au).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    var dot = s.indexOf(".");
    if (dot < 0) return s + ".000";
    while (s.length - dot - 1 < 3) s += "0";
    return s;
  }

  function auTextOf(au, body, gap) {
    if (body) return body.aText + " AU";
    if (gap) return gap.auText;
    return formatPick(au) + " AU";
  }

  function statsFor(au, body, gap, hit) {
    var days = gap ? gap.days : anchoredDays(au);
    var rows = [];
    rows.push({ k: "Anchor", v: "Jupiter · 4,332.589 days · " + JUPITER_AU_TEXT + " AU" });
    if (gap) {
      rows.push({ k: "Formula", v: "a = " + powerPhrase(gap.p, gap.q) });
      rows.push({ k: "Axis", v: gap.auText });
      rows.push({ k: "Period", v: gap.daysText + " · " + formatYears(gap.days) });
      rows.push({ k: "Orbits per Jupiter", v: String(gap.p) + " / " + String(gap.q) });
    } else {
      rows.push({ k: "Axis", v: auTextOf(au, body, null) });
      rows.push({ k: "Anchored period", v: formatDays(days) + " · " + formatYears(days) });
      rows.push({ k: "Orbits per Jupiter", v: formatRatio(hit.ratio) });
    }
    if (body) {
      rows.push({ k: "JPL period", v: formatPrintedDays(body.perText) });
      rows.push({ k: "JPL class", v: body.klass });
    }
    rows.push({ k: "Flag", v: hit.exact ? "On the " + hit.gap.name : (hit.near ? "Near the " + hit.gap.name : "Nearest " + hit.gap.name) });
    rows.push({ k: "Chart", v: onChart(body ? body.a : au) ? "On the schematic" : "Outside 2.0–3.5 AU" });
    return rows;
  }

  function scene(state) {
    var preset = state && state.preset;
    var body = state && state.bodyId ? bodyById(state.bodyId) : null;
    var gap = preset ? gapById(preset) : null;
    if (state && state.bodyId && !body) return { ok: false, error: "That body is not on this desk." };
    if (preset && !gap) return { ok: false, error: "That ratio is not on this desk." };
    var au = body ? body.a : (gap ? gap.au : Number(state && state.au));
    if (!isFinite(au) || au <= 0) return { ok: false, error: "Semi-major axis has to be a number greater than zero." };
    if (au > 40) return { ok: false, error: "This desk stops at 40 AU. Jupiter’s Trojans are near 5.2 AU." };
    var hit = nearest(au);
    var why = gap ? gapWhy(gap) : (body ? bodyWhy(body) : freeWhy(au));
    var title = gap ? gap.name + " with Jupiter" : (body ? body.full : auTextOf(au, null, null));
    var tier;
    if (gap && gap.kind === "hilda") tier = "Hilda group · 3:2";
    else if (gap && gap.kind === "trojan") tier = "Jupiter Trojan · 1:1";
    else if (gap && gap.primary) tier = "Kirkwood gap · " + gap.name;
    else if (gap) tier = "Mean-motion resonance · 4:1";
    else if (body) tier = body.full + " · " + body.code;
    else if (hit.exact) tier = "On the " + hit.gap.name;
    else if (hit.near) tier = "Near the " + hit.gap.name;
    else tier = "Main belt · free axis";
    var range = gap
      ? "P / P_Jupiter = " + gap.q + "/" + gap.p
      : "Orbits per Jupiter orbit " + formatRatio(hit.ratio);
    return {
      ok: true,
      au: au,
      preset: gap ? gap.id : null,
      bodyId: body ? body.id : null,
      title: title,
      tier: tier,
      range: range,
      why: why,
      stats: statsFor(au, body, gap, hit),
      hit: hit,
      onChart: onChart(au),
      stretch: stretch(au),
      pickText: body ? body.aText : (gap ? gap.auText.replace(/ AU$/, "") : formatPick(au)),
      aria: aria(au, gap, body, hit)
    };
  }

  function aria(au, gap, body, hit) {
    var name = gap ? gap.name + " with Jupiter" : (body ? body.full : "semi-major axis " + formatRatio(au) + " AU");
    var days = gap ? gap.daysText : formatDays(anchoredDays(au));
    var where = onChart(au) ? "On the schematic from 2.0 to 3.5 AU." : "Outside the 2.0 to 3.5 AU schematic.";
    return "Schematic, not a count of asteroids. " + name + ". Anchored period " + days + ". " + flagSentence(hit) + " " + where;
  }

  function limitsNote() {
    return "Educational schematic. Not a census of the belt and not an ephemeris. The bars are the same height except for a notch one bin wide, " + BIN_AU + " AU, at each computed Kirkwood axis, so the line can be seen. That width is not a measured gap. Bar height is not a count of asteroids. JPL’s June 2007 histogram of 156,929 numbered asteroids is the distribution this drawing does not replot. Jupiter’s anchor is the fact sheet’s J2000 mean semimajor axis, " + JUPITER_AU_TEXT + " AU, and the sidereal period 4,332.589 days. A resonance axis is that axis times (q/p) to the power 2/3. The period on the card is that period times (a / " + JUPITER_AU_TEXT + ") to the power 3/2. Named orbits are JPL Small-Body Database solutions and are not replaced by this period. The 1 percent flag is not a measured gap width.";
  }

  function massNote() {
    return "NASA Science says the total mass of all the asteroids combined is less than that of Earth’s Moon. The same page estimates the belt holds between 1.1 and 1.9 million asteroids larger than 1 kilometer, and millions of smaller ones. No mass in kilograms is printed here.";
  }

  function emptyNote() {
    return "NASA’s Basics of Space Flight says various spacecraft have crossed the main asteroid belt: Pioneer 10 and Pioneer 11, Voyagers 1 and 2, Ulysses, Galileo (crossed twice), Cassini, New Horizons, and Juno. The same chapter calls the Kirkwood gaps relatively empty areas between the main concentrations. The belt those spacecraft crossed is not a wall of rock.";
  }

  function regionNote() {
    return "NASA’s Basics of Space Flight describes two compositional belts, from Sloan Digital Sky Survey data: an inner belt centered at 2.8 AU, silicate-rich, and an outer belt centered at 3.2 AU, carbon-rich. Those are centers, not edges. JPL’s orbit classes are different. Inner Main-belt is a below 2.0 au and q above 1.666 au. Main-belt is a above 2.0 au and below 3.2 au, and q above 1.666 au. Outer Main-belt is a above 3.2 au and below 4.6 au. Jupiter Trojan is a above 4.6 au and below 5.5 au, and e below 0.3. JPL’s word “inner” is sunward of 2.0 AU. It is not the stretch between the 4:1 and the 3:1. This page does not rename the chart stretches as a catalog.";
  }

  return {
    JUPITER_AU: JUPITER_AU,
    JUPITER_AU_TEXT: JUPITER_AU_TEXT,
    JUPITER_DAYS: JUPITER_DAYS,
    YEAR_DAYS: YEAR_DAYS,
    CHART_MIN: CHART_MIN,
    CHART_MAX: CHART_MAX,
    BIN_AU: BIN_AU,
    SLIDER_MIN: SLIDER_MIN,
    SLIDER_MAX: SLIDER_MAX,
    NEAR_REL: NEAR_REL,
    resonantAu: resonantAu,
    anchoredDays: anchoredDays,
    orbitsPerJupiter: orbitsPerJupiter,
    formatDays: formatDays,
    formatYears: formatYears,
    formatRatio: formatRatio,
    axisText: axisText,
    gaps: gaps,
    gapById: gapById,
    gapIds: gapIds,
    bodyById: bodyById,
    bodyIds: bodyIds,
    bins: bins,
    nearest: nearest,
    stretch: stretch,
    windowOf: windowOf,
    scene: scene,
    gapWhy: function (id) { var g = gapById(id); return g ? gapWhy(g) : ""; },
    bodyWhy: function (id) { var b = bodyById(id); return b ? bodyWhy(b) : ""; },
    sizeSentence: sizeSentence,
    observedSentence: function (id) { var g = gapById(id); return g ? observedSentence(g) : ""; },
    limitsNote: limitsNote,
    massNote: massNote,
    emptyNote: emptyNote,
    regionNote: regionNote,
    formatPrintedDays: formatPrintedDays
  };
});
