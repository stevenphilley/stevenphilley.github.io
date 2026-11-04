/*! Mean-motion resonances for a classroom desk.

    A p:q ratio means the inner body completes p orbits while the outer
    body completes q. JPL states the 3:1 Kirkwood gap that way: the
    asteroid completes 3 orbits for every 1 orbit of Jupiter
    (https://ssd.jpl.nasa.gov/diagrams/mb_hist.html).

    Kepler’s third law for one central mass: a2/a1 = (P2/P1)^(2/3).
    The resonant period is the anchor’s period times the period ratio.
    The resonant semi-major axis is the anchor’s axis times that ratio
    to the power 2/3. Nothing here is a stored ephemeris result.

    Planet anchors are the NSSDCA fact-sheet lines already used on the
    Kepler desk: Semimajor axis (AU), and the sidereal orbit period in
    days. Pluto’s lines are the Pluto Fact Sheet: Semimajor axis (AU)
    39.48168677 and sidereal orbit period 90,560 days. A year, when a
    day count is turned into years, is Earth’s 365.256-day sidereal
    orbit period as printed on those sheets.

    Galilean periods and semi-major axes are the Jovian Satellite Fact
    Sheet. The semi-major axis column is in units of 10^3 km.
    TRAPPIST-1 periods are the central values in Agol et al. 2021,
    Table 2. No semi-major axis is loaded for those planets.

    Not an ephemeris and not a three-body integration. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Resonances = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var YEAR_DAYS = 365.256;
  var RATIO_MAX = 16;

  var PLANETS = [
    { id: "mercury", name: "Mercury", au: 0.38709893, auPrinted: "0.38709893", days: 87.969 },
    { id: "venus", name: "Venus", au: 0.72333199, auPrinted: "0.72333199", days: 224.701 },
    { id: "earth", name: "Earth", au: 1.00000011, auPrinted: "1.00000011", days: 365.256 },
    { id: "mars", name: "Mars", au: 1.52366231, auPrinted: "1.52366231", days: 686.980 },
    { id: "jupiter", name: "Jupiter", au: 5.20336301, auPrinted: "5.20336301", days: 4332.589 },
    { id: "saturn", name: "Saturn", au: 9.53707032, auPrinted: "9.53707032", days: 10755.699 },
    { id: "uranus", name: "Uranus", au: 19.19126393, auPrinted: "19.19126393", days: 30685.400 },
    { id: "neptune", name: "Neptune", au: 30.06896348, auPrinted: "30.06896348", days: 60189.018 },
    { id: "pluto", name: "Pluto", au: 39.48168677, auPrinted: "39.48168677", days: 90560, daysPrinted: "90,560" }
  ];

  /* Semi-major axis column is 10^3 km, as printed. Periods are the printed day counts. */
  var MOONS = [
    { id: "io", name: "Io", axis: 421.8, days: 1.769138, daysPrinted: "1.769138" },
    { id: "europa", name: "Europa", axis: 671.1, days: 3.551181, daysPrinted: "3.551181" },
    { id: "ganymede", name: "Ganymede", axis: 1070.4, days: 7.154553, daysPrinted: "7.154553" }
  ];

  /* Agol et al. 2021, Table 2, central period and the printed 1σ. */
  var TRAPPIST = [
    { id: "b", name: "b", days: 1.510826, daysPrinted: "1.510826", sigma: "0.000006" },
    { id: "c", name: "c", days: 2.421937, daysPrinted: "2.421937", sigma: "0.000018" },
    { id: "d", name: "d", days: 4.049219, daysPrinted: "4.049219", sigma: "0.000026" },
    { id: "e", name: "e", days: 6.101013, daysPrinted: "6.101013", sigma: "0.000035" },
    { id: "f", name: "f", days: 9.207540, daysPrinted: "9.207540", sigma: "0.000032" },
    { id: "g", name: "g", days: 12.352446, daysPrinted: "12.352446", sigma: "0.000054" },
    { id: "h", name: "h", days: 18.772866, daysPrinted: "18.772866", sigma: "0.000214" }
  ];

  var BELT = [
    { id: "3-1", name: "3:1", p: 3, q: 1, kind: "gap" },
    { id: "5-2", name: "5:2", p: 5, q: 2, kind: "gap" },
    { id: "7-3", name: "7:3", p: 7, q: 3, kind: "gap" },
    { id: "2-1", name: "2:1", p: 2, q: 1, kind: "gap" },
    { id: "3-2", name: "3:2", p: 3, q: 2, kind: "hilda" }
  ];

  var PRESETS = [
    { id: "kirkwood-3-1", mode: "solar", planetId: "jupiter", p: 3, q: 1, side: "interior", label: "3:1 Kirkwood" },
    { id: "kirkwood-5-2", mode: "solar", planetId: "jupiter", p: 5, q: 2, side: "interior", label: "5:2 Kirkwood" },
    { id: "kirkwood-7-3", mode: "solar", planetId: "jupiter", p: 7, q: 3, side: "interior", label: "7:3 Kirkwood" },
    { id: "kirkwood-2-1", mode: "solar", planetId: "jupiter", p: 2, q: 1, side: "interior", label: "2:1 Kirkwood" },
    { id: "hilda", mode: "solar", planetId: "jupiter", p: 3, q: 2, side: "interior", label: "3:2 Hilda" },
    { id: "neptune-pluto", mode: "solar", planetId: "neptune", p: 3, q: 2, side: "exterior", compareId: "pluto", label: "Neptune–Pluto" },
    { id: "laplace-io", mode: "moons", innerId: "io", outerId: "europa", showTriple: true, label: "Io–Europa" },
    { id: "laplace-eu", mode: "moons", innerId: "europa", outerId: "ganymede", showTriple: true, label: "Europa–Ganymede" },
    { id: "trappist-bc", mode: "trappist", innerId: "b", outerId: "c", label: "TRAPPIST-1 b–c" },
    { id: "trappist-cd", mode: "trappist", innerId: "c", outerId: "d", label: "TRAPPIST-1 c–d" },
    { id: "trappist-de", mode: "trappist", innerId: "d", outerId: "e", label: "TRAPPIST-1 d–e" },
    { id: "trappist-ef", mode: "trappist", innerId: "e", outerId: "f", label: "TRAPPIST-1 e–f" },
    { id: "trappist-fg", mode: "trappist", innerId: "f", outerId: "g", label: "TRAPPIST-1 f–g" },
    { id: "trappist-gh", mode: "trappist", innerId: "g", outerId: "h", label: "TRAPPIST-1 g–h" }
  ];

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "⁺"
  };

  function byId(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function planetById(id) { return byId(PLANETS, id); }
  function moonById(id) { return byId(MOONS, id); }
  function trappistById(id) { return byId(TRAPPIST, id); }
  function presetById(id) { return byId(PRESETS, id); }

  function gcd(a, b) {
    var x = Math.abs(a);
    var y = Math.abs(b);
    while (y) {
      var t = x % y;
      x = y;
      y = t;
    }
    return x || 1;
  }

  function commas(intPart) {
    return String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatDays(d) {
    var n = Number(d).toFixed(3);
    var parts = n.split(".");
    return commas(parts[0]) + "." + parts[1] + " days";
  }

  function formatCitedDays(body) {
    if (body && body.daysPrinted) return body.daysPrinted + " days";
    return formatDays(body.days);
  }

  function formatAu(a) {
    return Number(a).toFixed(6) + " AU";
  }

  function formatCitedAu(body) {
    if (body && body.auPrinted) return body.auPrinted + " AU";
    return formatAu(body.au);
  }

  function formatRatio(r) {
    return Number(r).toFixed(6);
  }

  function formatYears(days) {
    return (days / YEAR_DAYS).toFixed(4) + " years";
  }

  function formatAxis(axis) {
    var s = String(axis);
    var parts = s.split(".");
    return commas(parts[0]) + (parts.length > 1 ? "." + parts[1] : "");
  }

  function toSup(exp) {
    var s = String(exp);
    var out = "";
    var i;
    for (i = 0; i < s.length; i++) out += SUP[s[i]] || s[i];
    return out;
  }

  function formatSci(x) {
    if (x === 0) return "0";
    var sign = x < 0 ? "−" : "";
    var ax = Math.abs(x);
    var exp = Math.floor(Math.log10(ax));
    var mant = ax / Math.pow(10, exp);
    if (mant >= 9.995) {
      mant = mant / 10;
      exp += 1;
    }
    return sign + mant.toFixed(2) + "×10" + toSup(exp);
  }

  function isWhole(n) {
    return typeof n === "number" && isFinite(n) && Math.floor(n) === n;
  }

  function parseRatio(p, q) {
    if (!isWhole(p) || !isWhole(q)) {
      return { ok: false, error: "p and q are whole numbers." };
    }
    if (p < 1 || q < 1 || p > RATIO_MAX || q > RATIO_MAX) {
      return { ok: false, error: "Use whole numbers from 1 through " + RATIO_MAX + "." };
    }
    if (p <= q) {
      return { ok: false, error: "p is the inner orbit count. It has to be greater than q, the outer orbit count." };
    }
    var g = gcd(p, q);
    return { ok: true, p: p, q: q, gp: p / g, gq: q / g, g: g };
  }

  function conjunctionLongitudes(p, q) {
    var parsed = parseRatio(p, q);
    if (!parsed.ok) return [];
    var pp = parsed.gp;
    var qq = parsed.gq;
    var n = pp - qq;
    var out = [];
    var seen = {};
    var k;
    for (k = 0; k < n; k++) {
      var ang = (2 * Math.PI * ((k * qq) % n)) / n;
      var key = ang.toFixed(10);
      if (seen[key]) continue;
      seen[key] = true;
      out.push(ang);
    }
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  function resonantOrbit(anchor, p, q, side) {
    var parsed = parseRatio(p, q);
    if (!parsed.ok || !anchor || !(anchor.days > 0) || !(anchor.au > 0)) return null;
    if (side !== "interior" && side !== "exterior") return null;
    var periodRatio = side === "interior" ? q / p : p / q;
    var distanceRatio = Math.pow(periodRatio, 2 / 3);
    return {
      periodDays: anchor.days * periodRatio,
      au: anchor.au * distanceRatio,
      periodRatio: periodRatio,
      distanceRatio: distanceRatio,
      p: p,
      q: q,
      side: side,
      rays: conjunctionLongitudes(p, q)
    };
  }

  function nearestIntegers(ratio, maxOuter) {
    if (!(ratio > 1) || !isFinite(ratio)) return null;
    var cap = maxOuter || 8;
    var best = null;
    var q;
    for (q = 1; q <= cap; q++) {
      var p = Math.round(ratio * q);
      if (p <= q || p > 24) continue;
      var g = gcd(p, q);
      var rp = p / g;
      var rq = q / g;
      var rel = Math.abs(rp / rq - ratio) / ratio;
      if (!best || rel < best.rel - 1e-15 || (Math.abs(rel - best.rel) <= 1e-15 && rp + rq < best.p + best.q)) {
        best = { p: rp, q: rq, rel: rel, ratio: rp / rq };
      }
    }
    return best;
  }

  function laplaceResidual(daysIo, daysEu, daysGa) {
    return 1 - 3 * (daysIo / daysEu) + 2 * (daysIo / daysGa);
  }

  function belt() {
    var jupiter = planetById("jupiter");
    var mars = planetById("mars");
    var marks = [];
    var i;
    for (i = 0; i < BELT.length; i++) {
      var row = BELT[i];
      var orbit = resonantOrbit(jupiter, row.p, row.q, "interior");
      marks.push({
        id: row.id,
        name: row.name,
        p: row.p,
        q: row.q,
        kind: row.kind,
        au: orbit.au,
        days: orbit.periodDays
      });
    }
    return { mars: mars, jupiter: jupiter, marks: marks };
  }

  function beltIdFor(planetId, p, q, side) {
    if (planetId !== "jupiter" || side !== "interior") return null;
    var parsed = parseRatio(p, q);
    if (!parsed.ok) return null;
    var i;
    for (i = 0; i < BELT.length; i++) {
      if (BELT[i].p === parsed.gp && BELT[i].q === parsed.gq) return BELT[i].id;
    }
    return null;
  }

  function stateFromPreset(id) {
    var preset = presetById(id);
    if (!preset) return null;
    return {
      preset: preset.id,
      mode: preset.mode,
      planetId: preset.planetId || null,
      p: preset.p || null,
      q: preset.q || null,
      side: preset.side || null,
      compareId: preset.compareId || null,
      innerId: preset.innerId || null,
      outerId: preset.outerId || null,
      showTriple: !!preset.showTriple
    };
  }

  function fraction(p, q) {
    return p + ":" + q;
  }

  function countPhrase(n) {
    if (n === 1) return "1 longitude";
    return n + " longitudes";
  }

  function solarScene(state) {
    var parsed = parseRatio(state.p, state.q);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    var anchor = planetById(state.planetId);
    if (!anchor) return { ok: false, error: "Pick a body from the list." };
    if (state.side !== "interior" && state.side !== "exterior") {
      return { ok: false, error: "The resonant body is either interior or exterior." };
    }
    var orbit = resonantOrbit(anchor, parsed.p, parsed.q, state.side);
    var reduced = parsed.g !== 1;
    var name = fraction(parsed.gp, parsed.gq);
    var entered = fraction(parsed.p, parsed.q);
    var innerDays = state.side === "interior" ? orbit.periodDays : anchor.days;
    var outerDays = state.side === "interior" ? anchor.days : orbit.periodDays;
    var innerAu = state.side === "interior" ? orbit.au : anchor.au;
    var outerAu = state.side === "interior" ? anchor.au : orbit.au;
    var innerName = state.side === "interior" ? "Resonant body" : anchor.name;
    var outerName = state.side === "interior" ? anchor.name : "Resonant body";
    var id = beltIdFor(anchor.id, parsed.p, parsed.q, state.side);
    var compare = null;
    if (state.compareId && state.side === "exterior") compare = planetById(state.compareId);

    var title = name + " with " + anchor.name;
    var tier = state.side === "interior" ? "Interior · " + entered : "Exterior · " + entered;
    if (id === "3-2") tier = "Hilda group · 3:2";
    else if (id && id !== "3-2") tier = "Kirkwood gap · " + name;
    if (state.preset === "neptune-pluto") tier = "Neptune–Pluto · 3:2";

    var innerPeriodText = state.side === "interior" ? formatDays(innerDays) : formatCitedDays(anchor);
    var outerPeriodText = state.side === "interior" ? formatCitedDays(anchor) : formatDays(outerDays);
    var innerAuText = state.side === "interior" ? formatAu(innerAu) : formatCitedAu(anchor);
    var outerAuText = state.side === "interior" ? formatCitedAu(anchor) : formatAu(outerAu);
    var stats = [
      { k: "Anchor", v: anchor.name + " · " + formatCitedDays(anchor) + " · " + formatCitedAu(anchor) },
      { k: "Period ratio", v: "P_inner / P_outer = " + parsed.gq + "/" + parsed.gp },
      { k: "Inner period", v: innerPeriodText + " · " + formatYears(innerDays) },
      { k: "Outer period", v: outerPeriodText + " · " + formatYears(outerDays) },
      { k: "Inner axis", v: innerAuText },
      { k: "Outer axis", v: outerAuText },
      { k: "Distance ratio", v: "a_inner / a_outer = " + formatRatio(Math.pow(parsed.gq / parsed.gp, 2 / 3)) },
      { k: "Conjunctions", v: countPhrase(orbit.rays.length) + ", exact " + name }
    ];

    var why = anchor.name + "’s fact sheet prints a semimajor axis of " + formatCitedAu(anchor) +
      " and a sidereal orbit period of " + formatCitedDays(anchor) + ". A " + entered +
      " ratio means the inner body completes " + parsed.p + " orbits while the outer body completes " + parsed.q + ".";
    if (reduced) {
      why += " " + entered + " is " + name + " in lowest terms. The conjunction count uses the lowest terms.";
    }
    if (state.side === "interior") {
      why += " The resonant body is interior, so its period is the anchor period times " + parsed.q + "/" + parsed.p +
        ", which computes " + formatDays(orbit.periodDays) + " (" + formatYears(orbit.periodDays) +
        " of " + YEAR_DAYS + " days). Its semi-major axis is the anchor axis times (" + parsed.q + "/" + parsed.p +
        ") to the power 2/3, which computes " + formatAu(orbit.au) + ".";
    } else {
      why += " The resonant body is exterior, so its period is the anchor period times " + parsed.p + "/" + parsed.q +
        ", which computes " + formatDays(orbit.periodDays) + " (" + formatYears(orbit.periodDays) +
        " of " + YEAR_DAYS + " days). Its semi-major axis is the anchor axis times (" + parsed.p + "/" + parsed.q +
        ") to the power 2/3, which computes " + formatAu(orbit.au) + ".";
    }
    why += " That is Kepler’s third law for one central mass: a₂/a₁ = (P₂/P₁) to the power 2/3. An exact " +
      name + " meets at " + countPhrase(orbit.rays.length) +
      ". The drawing keeps the ratio exact, so every conjunction returns to those places.";

    if (id && id !== "3-2") {
      why += " JPL’s June 2007 histogram of 156,929 numbered asteroids labels a gap at this resonance. This page marks the computed axis. It does not replot those orbits.";
    }
    if (id === "3-2") {
      why += " The Hilda group is the population that stays near Jupiter’s 3:2. Ip’s 1976 dynamical study, as abstracted by NASA’s Technical Reports Server, finds the 3:2 resonant coupling of some of these bodies to be stable. JPL’s June 2007 elements diagram labels a Hilda group between the main belt and Jupiter. The axis above is the computed 3:2, not a catalog mean.";
    }
    if (compare) {
      var printedRatio = compare.days / anchor.days;
      var printedDistance = compare.au / anchor.au;
      var keplerDistance = Math.pow(printedRatio, 2 / 3);
      stats.push({ k: compare.name + " printed", v: formatCitedDays(compare) + " · " + formatCitedAu(compare) });
      stats.push({ k: "Printed period ratio", v: formatRatio(printedRatio) + " beside " + formatRatio(parsed.p / parsed.q) });
      stats.push({ k: "Printed distance ratio", v: formatRatio(printedDistance) + " · (P ratio)^(2/3) " + formatRatio(keplerDistance) });
      why += " " + compare.name + "’s fact sheet prints " + formatCitedDays(compare) + " and " + formatCitedAu(compare) +
        ". The printed period ratio is " + formatRatio(printedRatio) + ", beside " + name + " = " + formatRatio(parsed.p / parsed.q) +
        ". The printed distance ratio is " + formatRatio(printedDistance) + ". (P_" + compare.name + "/P_" + anchor.name +
        ") to the power 2/3 computes " + formatRatio(keplerDistance) +
        ". Kepler maps the printed periods onto the printed distance. The name " + name +
        " is the nearby integer ratio. The drawing uses the exact " + name + ".";
    }

    return {
      ok: true,
      preset: state.preset || null,
      mode: "solar",
      title: title,
      tier: tier,
      range: "P_res / P_anchor = " + formatRatio(orbit.periodRatio),
      stats: stats,
      why: why,
      beltId: id,
      markAu: orbit.au,
      text: {
        period: formatDays(orbit.periodDays),
        au: formatAu(orbit.au),
        years: formatYears(orbit.periodDays),
        ratio: formatRatio(orbit.periodRatio)
      },
      periodDays: orbit.periodDays,
      au: orbit.au,
      motion: {
        center: "Sun",
        refDays: Math.min(innerDays, outerDays),
        bodies: [
          { name: innerName, days: innerDays, radius: innerAu, role: "inner" },
          { name: outerName, days: outerDays, radius: outerAu, role: "outer" }
        ],
        rays: orbit.rays,
        rayLabel: "Exact " + name
      }
    };
  }

  function pairScene(inner, outer, kind) {
    var ratio = outer.days / inner.days;
    var near = nearestIntegers(ratio, 8);
    var rays = near ? conjunctionLongitudes(near.p, near.q) : [];
    return { ratio: ratio, near: near, rays: rays, kind: kind };
  }

  function moonScene(state) {
    var inner = moonById(state.innerId);
    var outer = moonById(state.outerId);
    if (!inner || !outer) return { ok: false, error: "That moon pair is not on the fact sheet used here." };
    if (!(outer.days > inner.days)) return { ok: false, error: "The outer moon needs the longer period." };
    var pair = pairScene(inner, outer, "moons");
    var cited = outer.axis / inner.axis;
    var kepler = Math.pow(pair.ratio, 2 / 3);
    var io = moonById("io");
    var eu = moonById("europa");
    var ga = moonById("ganymede");
    var residual = laplaceResidual(io.days, eu.days, ga.days);
    var nearName = pair.near ? fraction(pair.near.p, pair.near.q) : "";
    var stats = [
      { k: "Io", v: formatCitedDays(io) + " · " + formatAxis(io.axis) + " × 10³ km" },
      { k: "Europa", v: formatCitedDays(eu) + " · " + formatAxis(eu.axis) + " × 10³ km" },
      { k: "Ganymede", v: formatCitedDays(ga) + " · " + formatAxis(ga.axis) + " × 10³ km" },
      { k: "This pair", v: inner.name + " and " + outer.name },
      { k: "Period ratio", v: formatRatio(pair.ratio) + (nearName ? " · nearest " + nearName + " = " + formatRatio(pair.near.ratio) : "") },
      { k: "Axis ratio", v: formatRatio(cited) + " printed · " + formatRatio(kepler) + " from the periods" },
      { k: "Laplace", v: formatSci(residual) }
    ];
    var why = "NASA Science says that every time Ganymede orbits Jupiter once, Europa orbits twice and Io orbits four times. The Jovian Satellite Fact Sheet prints Io " +
      formatCitedDays(io) + ", Europa " + formatCitedDays(eu) + ", and Ganymede " + formatCitedDays(ga) +
      ". Europa/Io computes " + formatRatio(eu.days / io.days) + ". Ganymede/Io computes " + formatRatio(ga.days / io.days) +
      ". Ganymede/Europa computes " + formatRatio(ga.days / eu.days) +
      ". Those sit near 2, 4, and 2. They are not equal to those integers. The Laplace combination (n_Io − 3 n_Europa + 2 n_Ganymede) / n_Io equals 1 − 3 (P_Io/P_Europa) + 2 (P_Io/P_Ganymede). On these three periods it computes " +
      formatSci(residual) + ". Semi-major axes on the sheet, in units of 10³ km, are Io " + formatAxis(io.axis) +
      ", Europa " + formatAxis(eu.axis) + ", and Ganymede " + formatAxis(ga.axis) + ". " +
      outer.name + "/" + inner.name + " as a distance is " + formatRatio(cited) + ". (P_" + outer.name + "/P_" + inner.name +
      ") to the power 2/3 computes " + formatRatio(kepler) +
      ". The drawing shows " + inner.name + " and " + outer.name + " at the printed periods. Dashed rays mark where an exact " +
      nearName + " would keep meeting. Not a tidal integration.";
    return {
      ok: true,
      preset: state.preset || null,
      mode: "moons",
      title: inner.name + " and " + outer.name,
      tier: "Laplace · Galilean moons",
      range: "Printed period ratio " + formatRatio(pair.ratio),
      stats: stats,
      why: why,
      beltId: null,
      text: {
        ratio: formatRatio(pair.ratio),
        nearest: nearName,
        laplace: formatSci(residual),
        axis: formatRatio(cited),
        kepler: formatRatio(kepler)
      },
      motion: {
        center: "Jupiter",
        refDays: inner.days,
        bodies: [
          { name: inner.name, days: inner.days, radius: inner.axis, role: "inner" },
          { name: outer.name, days: outer.days, radius: outer.axis, role: "outer" }
        ],
        rays: pair.rays,
        rayLabel: "Exact " + nearName
      }
    };
  }

  function trappistScene(state) {
    var inner = trappistById(state.innerId);
    var outer = trappistById(state.outerId);
    if (!inner || !outer) return { ok: false, error: "That TRAPPIST-1 pair is not in the table used here." };
    if (!(outer.days > inner.days)) return { ok: false, error: "The outer planet needs the longer period." };
    var pair = pairScene(inner, outer, "trappist");
    var nearName = pair.near ? fraction(pair.near.p, pair.near.q) : "";
    var diff = pair.near ? pair.ratio - pair.near.ratio : NaN;
    var sign = diff >= 0 ? "+" : "−";
    var stats = [
      { k: "Inner", v: "TRAPPIST-1 " + inner.name + " · " + formatCitedDays(inner) },
      { k: "Outer", v: "TRAPPIST-1 " + outer.name + " · " + formatCitedDays(outer) },
      { k: "Period ratio", v: formatRatio(pair.ratio) },
      { k: "Nearest integers", v: nearName + " = " + formatRatio(pair.near.ratio) + " · difference " + sign + formatRatio(Math.abs(diff)) },
      { k: "Distance", v: "No semi-major axis is loaded. The drawing uses P to the power 2/3." }
    ];
    var why = "Agol et al. 2021, Table 2, print TRAPPIST-1 " + inner.name + " at " + formatCitedDays(inner) +
      " and " + outer.name + " at " + formatCitedDays(outer) + ", each a central value. The uncertainties on that table are ±" +
      inner.sigma + " and ±" + outer.sigma + " days. " + outer.name + "/" + inner.name + " computes " + formatRatio(pair.ratio) +
      ". The nearest integers with the outer count at most 8 are " + nearName + ", which is " + formatRatio(pair.near.ratio) +
      ". The difference is " + sign + formatRatio(Math.abs(diff)) +
      ". Agol and coauthors describe adjacent pairs as lying near mean-motion resonances, and they credit Luger et al. 2017 with the chain of generalized three-body Laplace relations. This page does not load a semi-major axis for these planets. Orbit size in the drawing follows the printed periods to the power 2/3. Dashed rays are the exact " +
      nearName + ". The bodies move at the printed periods. Not a transit-timing fit.";
    return {
      ok: true,
      preset: state.preset || null,
      mode: "trappist",
      title: "TRAPPIST-1 " + inner.name + "–" + outer.name,
      tier: "Near " + nearName,
      range: "Printed period ratio " + formatRatio(pair.ratio),
      stats: stats,
      why: why,
      beltId: null,
      text: {
        ratio: formatRatio(pair.ratio),
        nearest: nearName,
        difference: sign + formatRatio(Math.abs(diff))
      },
      motion: {
        center: "TRAPPIST-1",
        refDays: inner.days,
        bodies: [
          { name: inner.name, days: inner.days, radius: Math.pow(inner.days, 2 / 3), role: "inner" },
          { name: outer.name, days: outer.days, radius: Math.pow(outer.days, 2 / 3), role: "outer" }
        ],
        rays: pair.rays,
        rayLabel: "Exact " + nearName
      }
    };
  }

  function scene(state) {
    if (!state) return { ok: false, error: "Nothing to compute." };
    if (state.preset && !state.mode) state = stateFromPreset(state.preset);
    if (!state) return { ok: false, error: "That preset is not on this desk." };
    if (state.mode === "moons") return moonScene(state);
    if (state.mode === "trappist") return trappistScene(state);
    return solarScene(state);
  }

  function limitsNote() {
    return "Circular, coplanar, and Keplerian. A p:q ratio means the inner body completes p orbits while the outer body completes q. The resonant period is the anchor period times that ratio. The resonant semi-major axis is the anchor axis times the period ratio to the power 2/3, which is Kepler’s third law for one central mass. Fact-sheet periods are not replaced by that integer ratio. Where both periods are printed, the card shows the printed ratio beside p/q. The drawing of an exact ratio keeps conjunctions on fixed rays. A drawing that uses printed periods lets the meeting point walk. JPL’s June 2007 histogram shows the Kirkwood gaps. This page marks the computed axes and does not replot those 156,929 orbits. Not an ephemeris, not a proper-element catalog, and not a three-body integration.";
  }

  return {
    YEAR_DAYS: YEAR_DAYS,
    RATIO_MAX: RATIO_MAX,
    planets: function () { return PLANETS; },
    planetById: planetById,
    moons: function () { return MOONS; },
    moonById: moonById,
    trappist: function () { return TRAPPIST; },
    trappistById: trappistById,
    presets: function () { return PRESETS; },
    presetById: presetById,
    stateFromPreset: stateFromPreset,
    gcd: gcd,
    parseRatio: parseRatio,
    conjunctionLongitudes: conjunctionLongitudes,
    resonantOrbit: resonantOrbit,
    nearestIntegers: nearestIntegers,
    laplaceResidual: laplaceResidual,
    belt: belt,
    beltIdFor: beltIdFor,
    scene: scene,
    limitsNote: limitsNote,
    formatDays: formatDays,
    formatAu: formatAu,
    formatRatio: formatRatio,
    formatYears: formatYears,
    formatSci: formatSci
  };
});
