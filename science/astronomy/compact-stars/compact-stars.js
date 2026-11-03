/*! White dwarfs and neutron stars for a classroom desk.

    White-dwarf radii use Nauenberg 1972, ApJ 175, 417, equations (54)–(56),
    with the magnetic energy set to zero. The printed coefficients are
    0.0225 and 5.82:

      R/R☉ = (0.0225 / μ_e) * sqrt(1 − (M/M_Ch)^(4/3)) / (M/M_Ch)^(1/3)
      M_Ch/M☉ = 5.82 / μ_e²

    μ_e is the mean molecular weight per electron. Helium-4, carbon-12,
    and oxygen-16 have A/Z = 2. Iron-56 has A/Z = 56/26. This is a
    zero-temperature variational approximation. It is not a cooling track,
    and it leaves out Coulomb corrections and general relativity.

    A neutron-star radius is not taken from one equation of state.
    Miller et al. 2021, ApJL 918, L28, Table 4: the ±1σ radius range at
    1.4 M☉, spanning all three of their EOS frameworks, is 11.79–13.11 km.
    That span is an envelope at 1.4 M☉. It is not a mass–radius curve.

    Named radii and masses are the papers’ medians. Calculations at those
    medians are this file’s. The published credible intervals are stored
    and not treated as a second equation of state.

    c = 299792458 m/s exactly.
    GM of one nominal solar mass is the IAU 2015 Resolution B3 value,
    1.3271244e20 m³ s⁻².
    The nominal solar radius is 6.957e8 m.
    G = 6.67430e-11 m³ kg⁻¹ s⁻² is the NIST 2022 CODATA central value,
    used only to turn GM into a mass for density.
    Earth volumetric mean radius 6371 km is the NASA Earth Fact Sheet value
    used elsewhere on this site, for an Earth-radius comparison only.
    One US teaspoon is 1/6 of a US fluid ounce. One US gallon is 231 cubic
    inches exactly and 128 fluid ounces, and one inch is 0.0254 m exactly.
    The teaspoon volume is that product. The teaspoon mass is density times
    that volume. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CompactStars = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var C_M_S = 299792458;
  var G = 6.67430e-11;
  var GM_SUN = 1.3271244e20;
  var R_SUN_M = 6.957e8;
  var R_EARTH_M = 6371e3;
  var G0 = 9.80665;

  /* Nauenberg 1972, equations (54) and (56), magnetic term removed. */
  var NAUENBERG_R = 0.0225;
  var NAUENBERG_M = 5.82;

  var MU_HECO = 2;
  var MU_FE = 56 / 26;

  /* Miller et al. 2021 Table 4 note. Kilometres. Span at 1.4 M☉. */
  var NS_R_LO_KM = 11.79;
  var NS_R_HI_KM = 13.11;
  var NS_SPAN_MASS = 1.4;

  /* Exact US teaspoon: (231/768) cubic inches. */
  var TSP_M3 = (231 / 768) * 0.0254 * 0.0254 * 0.0254;

  var WD_MASS_MIN = 0.2;
  var NS_MASS_MIN = 1;
  var NS_MASS_MAX = 2.2;

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "-": "⁻", "+": "⁺"
  };

  var PRESETS = [
    {
      id: "sirius-b",
      kind: "wd",
      mu: MU_HECO,
      label: "Sirius B",
      mass: 1.018,
      massMinus: 0.011,
      massPlus: 0.011,
      observedRadiusSolar: 0.008098,
      observedRadiusMinus: 0.000046,
      observedRadiusPlus: 0.000046,
      publishedLogG: "8.629"
    },
    {
      id: "procyon-b",
      kind: "wd",
      mu: MU_HECO,
      label: "Procyon B",
      mass: 0.592,
      massMinus: 0.006,
      massPlus: 0.006,
      observedRadiusSolar: 0.01232,
      observedRadiusMinus: 0.00032,
      observedRadiusPlus: 0.00032,
      publishedLogG: "8.028"
    },
    {
      id: "span-14",
      kind: "ns",
      mu: null,
      label: "1.4 M☉ span",
      mass: NS_SPAN_MASS,
      band: true
    },
    {
      id: "j0030",
      kind: "ns",
      mu: null,
      label: "PSR J0030+0451",
      mass: 1.34,
      massMinus: 0.16,
      massPlus: 0.15,
      radiusKm: 12.71,
      radiusMinus: 1.19,
      radiusPlus: 1.14,
      publishedCompactness: "0.156"
    },
    {
      id: "j0740",
      kind: "ns",
      mu: null,
      label: "PSR J0740+6620",
      mass: 2.08,
      massMinus: 0.07,
      massPlus: 0.07,
      radiusKm: 12.39,
      radiusMinus: 0.98,
      radiusPlus: 1.30
    }
  ];

  function chandrasekharMass(mu) {
    if (!(mu > 0)) return NaN;
    return NAUENBERG_M / (mu * mu);
  }

  function whiteDwarfRadiusSolar(mass, mu) {
    var mch = chandrasekharMass(mu);
    if (!(mass > 0) || !(mch > 0) || !(mass < mch)) return NaN;
    var x = mass / mch;
    var x13 = Math.pow(x, 1 / 3);
    var inside = 1 - x * x13;
    if (inside < 0) return NaN;
    return (NAUENBERG_R / mu) * Math.sqrt(inside) / x13;
  }

  function schwarzschildRadiusM(mass) {
    if (!(mass > 0)) return NaN;
    return 2 * mass * GM_SUN / (C_M_S * C_M_S);
  }

  function derive(mass, radiusM) {
    if (!(mass > 0) || !(radiusM > 0)) return null;
    var gm = mass * GM_SUN;
    var massKg = gm / G;
    var volume = (4 / 3) * Math.PI * radiusM * radiusM * radiusM;
    var density = massKg / volume;
    var gravity = gm / (radiusM * radiusM);
    var compactness = gm / (radiusM * C_M_S * C_M_S);
    var rs = schwarzschildRadiusM(mass);
    return {
      mass: mass,
      radiusM: radiusM,
      massKg: massKg,
      density: density,
      gravity: gravity,
      compactness: compactness,
      vescOverC: Math.sqrt(2 * compactness),
      rsM: rs,
      radiusOverRs: radiusM / rs,
      teaspoonKg: density * TSP_M3,
      logG: Math.log(gravity * 100) / Math.LN10
    };
  }

  function presetById(id) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  function wdMassMax(mu) {
    return chandrasekharMass(mu) - 0.001;
  }

  function massAllowed(kind, mass, mu) {
    if (!(mass > 0) || !isFinite(mass)) return false;
    if (kind === "ns") return mass >= NS_MASS_MIN && mass <= NS_MASS_MAX;
    if (!(mu > 0)) return false;
    return mass >= WD_MASS_MIN && mass < chandrasekharMass(mu);
  }

  function formatMass(m) {
    if (!isFinite(m)) return "—";
    return m.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }

  function groupInt(s) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function sup(exp) {
    var s = String(exp);
    var out = "";
    var k;
    for (k = 0; k < s.length; k++) out += SUP[s.charAt(k)] || s.charAt(k);
    return out;
  }

  function formatSci(x, sig) {
    if (!isFinite(x) || x === 0) return "0";
    var sign = x < 0 ? "−" : "";
    var ax = Math.abs(x);
    var exp = Math.floor(Math.log(ax) / Math.LN10);
    var mant = ax / Math.pow(10, exp);
    var mantNum = Number(mant.toPrecision(sig));
    if (mantNum >= 10) {
      mantNum = mantNum / 10;
      exp += 1;
    }
    var mantStr = mantNum.toPrecision(sig);
    if (exp === 0) return sign + mantStr;
    return sign + mantStr + "×10" + sup(exp);
  }

  function formatKm(metres) {
    var km = metres / 1000;
    if (!isFinite(km)) return "—";
    if (km >= 100) return groupInt(km.toFixed(0)) + " km";
    return km.toFixed(2) + " km";
  }

  function formatRs(metres) {
    var km = metres / 1000;
    if (!isFinite(km)) return "—";
    if (km >= 100) return groupInt(km.toFixed(0)) + " km";
    return km.toFixed(3) + " km";
  }

  function formatRsun(r) {
    if (!isFinite(r)) return "—";
    return r.toPrecision(4);
  }

  function formatRatio(r) {
    if (!isFinite(r)) return "—";
    if (r >= 100) return groupInt(r.toFixed(0));
    return r.toFixed(2);
  }

  function formatEarth(radiusM) {
    return (radiusM / R_EARTH_M).toFixed(3);
  }

  function formatDensity(kgM3) {
    return formatSci(kgM3 / 1000, 4) + " g cm⁻³";
  }

  function formatGravity(g) {
    return formatSci(g, 4) + " m s⁻²";
  }

  function formatGees(g) {
    return formatSci(g / G0, 4) + " g";
  }

  function formatTeaspoon(kg) {
    var tonnes = kg / 1000;
    if (kg < 1e6) return groupInt(kg.toFixed(0)) + " kg (" + tonnes.toFixed(2) + " t)";
    return formatSci(kg, 4) + " kg (" + formatSci(tonnes, 4) + " t)";
  }

  function formatCompact(c) {
    if (!(c > 0)) return "—";
    if (c < 0.001) return formatSci(c, 3);
    return c.toFixed(3);
  }

  function sampleWhiteDwarf(mu, count) {
    var mch = chandrasekharMass(mu);
    var n = count || 80;
    var out = [];
    var i;
    var lo = WD_MASS_MIN;
    var hi = Math.min(wdMassMax(mu), mch * 0.995);
    for (i = 0; i < n; i++) {
      var m = lo + (hi - lo) * i / (n - 1);
      var r = whiteDwarfRadiusSolar(m, mu);
      if (isFinite(r) && r > 0) out.push({ mass: m, radiusM: r * R_SUN_M });
    }
    return out;
  }

  function pointText(d, kind) {
    var radius = kind === "ns"
      ? formatKm(d.radiusM)
      : formatRsun(d.radiusM / R_SUN_M) + " R☉ · " + formatKm(d.radiusM) + " · " + formatEarth(d.radiusM) + " R⊕";
    return {
      radius: radius,
      density: formatDensity(d.density),
      gravity: formatGravity(d.gravity) + " · " + formatGees(d.gravity),
      escape: formatCompact(d.vescOverC) + " c",
      compact: formatCompact(d.compactness),
      rs: formatRs(d.rsM),
      ratio: formatRatio(d.radiusOverRs),
      teaspoon: formatTeaspoon(d.teaspoonKg),
      logG: d.logG.toFixed(3)
    };
  }

  function scene(opts) {
    var o = opts || {};
    var preset = o.preset ? presetById(o.preset) : null;
    var kind = preset ? preset.kind : (o.kind === "ns" ? "ns" : "wd");
    var mu = kind === "wd" ? (preset ? preset.mu : (o.mu === MU_FE ? MU_FE : MU_HECO)) : null;
    var mass = preset ? preset.mass : o.mass;
    if (!massAllowed(kind, mass, mu)) return null;

    var band = kind === "ns" && (!preset || preset.band);
    var loM;
    var hiM;
    if (kind === "wd") {
      var rSun = whiteDwarfRadiusSolar(mass, mu);
      if (!isFinite(rSun)) return null;
      loM = hiM = rSun * R_SUN_M;
    } else if (band) {
      loM = NS_R_LO_KM * 1000;
      hiM = NS_R_HI_KM * 1000;
    } else {
      loM = hiM = preset.radiusKm * 1000;
    }

    var lo = derive(mass, loM);
    var hi = derive(mass, hiM);
    if (!lo || !hi) return null;
    var single = loM === hiM;
    var text = single ? pointText(lo, kind) : null;
    var observed = null;
    if (preset && preset.observedRadiusSolar) {
      var obs = derive(mass, preset.observedRadiusSolar * R_SUN_M);
      observed = {
        radiusSolar: preset.observedRadiusSolar,
        radiusText: formatRsun(preset.observedRadiusSolar) + " R☉ · " + formatKm(preset.observedRadiusSolar * R_SUN_M),
        logG: obs.logG.toFixed(3),
        publishedLogG: preset.publishedLogG
      };
    }

    var rangeText = null;
    if (!single) {
      var densLo = lo.density < hi.density ? lo : hi;
      var densHi = lo.density < hi.density ? hi : lo;
      rangeText = {
        radius: formatKm(lo.radiusM) + "–" + formatKm(hi.radiusM).replace(" km", "") + " km",
        density: formatDensity(densLo.density).replace(" g cm⁻³", "") + "–" + formatDensity(densHi.density),
        gravity: formatGravity(densLo.gravity).replace(" m s⁻²", "") + "–" + formatGravity(densHi.gravity),
        escape: formatCompact(Math.min(lo.vescOverC, hi.vescOverC)) + "–" + formatCompact(Math.max(lo.vescOverC, hi.vescOverC)) + " c",
        compact: formatCompact(Math.min(lo.compactness, hi.compactness)) + "–" + formatCompact(Math.max(lo.compactness, hi.compactness)),
        rs: formatRs(lo.rsM),
        ratio: formatRatio(Math.min(lo.radiusOverRs, hi.radiusOverRs)) + "–" + formatRatio(Math.max(lo.radiusOverRs, hi.radiusOverRs)),
        teaspoon: formatTeaspoon(densLo.teaspoonKg) + " – " + formatTeaspoon(densHi.teaspoonKg)
      };
    }

    return {
      kind: kind,
      preset: preset,
      mu: mu,
      mass: mass,
      mch: kind === "wd" ? chandrasekharMass(mu) : null,
      single: single,
      lo: lo,
      hi: hi,
      text: text,
      rangeText: rangeText,
      observed: observed
    };
  }

  function explain(sc) {
    if (!sc) return "";
    var mass = formatMass(sc.mass);
    if (sc.kind === "wd") {
      var comp = sc.mu === MU_HECO ? "μ_e = 2, the value for helium, carbon, and oxygen" : "μ_e = 56/26, fully ionized iron-56";
      var core = "Nauenberg’s 1972 zero-temperature relation, " + comp + ", gives a radius of " + sc.text.radius + ". The Chandrasekhar mass on this formula is " + formatMass(sc.mch) + " M☉. Mean density is " + sc.text.density + ". One US teaspoon of that density is " + sc.text.teaspoon + ". Surface gravity is " + sc.text.gravity + ". Escape speed is " + sc.text.escape + ". Compactness GM/(Rc²) is " + sc.text.compact + ". A black hole of this mass has compactness 0.5 and a Schwarzschild radius of " + sc.text.rs + ", so this radius is " + sc.text.ratio + " times that horizon. The horizon itself is the black-hole desk.";
      if (sc.preset && sc.preset.id === "sirius-b") {
        return "Sirius B. Bond et al. 2017 dynamical mass " + mass + " ± 0.011 M☉. " + core + " The same paper’s STIS radius is " + sc.observed.radiusText + ", internal uncertainty ±0.000046 R☉. This page’s log g from that published mass and radius is " + sc.observed.logG + ". Bond et al. print " + sc.observed.publishedLogG + ". The model radius is not that STIS radius. The curve is colder and simpler than the star.";
      }
      if (sc.preset && sc.preset.id === "procyon-b") {
        return "Procyon B. Bond et al. 2015 dynamical mass " + mass + " ± 0.006 M☉. " + core + " Bond et al. adjust the Provencal et al. 2002 radius to their parallax and print " + sc.observed.radiusText + ", uncertainty ±0.00032 R☉. This page’s log g from that published mass and radius is " + sc.observed.logG + ". Bond et al. print " + sc.observed.publishedLogG + " ± 0.023. The model radius is not that radius.";
      }
      return "White dwarf, " + mass + " M☉. " + core;
    }
    if (sc.preset && sc.preset.id === "j0030") {
      return "PSR J0030+0451. Riley et al. 2019 median mass " + mass + " M☉, with a 68% interval −0.16 to +0.15, and median equatorial radius 12.71 km, −1.19 to +1.14. The card uses the two medians. Compactness computed here is " + sc.text.compact + ". Riley et al. print " + sc.preset.publishedCompactness + ". Escape speed is " + sc.text.escape + ". Mean density is " + sc.text.density + ". One US teaspoon of that density is " + sc.text.teaspoon + ". A black hole of this mass has Schwarzschild radius " + sc.text.rs + ". This radius is " + sc.text.ratio + " times that horizon. The spin of a pulsar is a different desk.";
    }
    if (sc.preset && sc.preset.id === "j0740") {
      return "PSR J0740+6620. Fonseca et al. 2021 model-averaged mass " + mass + " ± 0.07 M☉. Riley et al. 2021 equatorial radius 12.39 km, −0.98 to +1.30, conditioned on that radio mass. The card uses 2.08 M☉ and 12.39 km. Compactness computed here is " + sc.text.compact + ". Escape speed is " + sc.text.escape + ". Mean density is " + sc.text.density + ". One US teaspoon of that density is " + sc.text.teaspoon + ". A black hole of this mass has Schwarzschild radius " + sc.text.rs + ". This radius is " + sc.text.ratio + " times that horizon.";
    }
    var where = Math.abs(sc.mass - NS_SPAN_MASS) < 1e-6
      ? "This is the 1.4 M☉ the span was quoted at."
      : "The span was quoted at 1.4 M☉. At " + mass + " M☉ it is an envelope, not a prediction that radius ignores mass.";
    return "Neutron-star mass " + mass + " M☉. The radius is not a solved equation of state. It is held at the Miller et al. 2021 span for a 1.4 M☉ star, " + sc.rangeText.radius + ", across three EOS frameworks. At this mass the smaller radius is denser. Mean density runs " + sc.rangeText.density + ". One US teaspoon runs " + sc.rangeText.teaspoon + ". Escape speed runs " + sc.rangeText.escape + ". Compactness runs " + sc.rangeText.compact + ", against 0.5 for a black hole of this mass. Schwarzschild radius " + sc.rangeText.rs + ". " + where;
  }

  function spoonLine(sc) {
    if (!sc) return "";
    var vol = "One US teaspoon is 4.92892159375 cm³, from a gallon of 231 cubic inches, 128 fluid ounces to the gallon, and six teaspoons to the fluid ounce, with the inch at 0.0254 m. ";
    if (sc.single) {
      return vol + "At the density on this card, that volume has a mass of " + sc.text.teaspoon + ".";
    }
    return vol + "At the two edges of the radius span, that volume has a mass of " + sc.rangeText.teaspoon + ".";
  }

  function limitsNote() {
    return "Zero-temperature white dwarfs, and a neutron-star radius that is a measured span rather than an equation of state. Nauenberg’s 1972 relation is equations (54)–(56) with the magnetic energy set to zero. It is not a cooling model. Coulomb corrections and general relativity are left out, and both move the maximum mass. Escape speed is the Newtonian square root of 2GM/R, reported as a fraction of c. It is not a general-relativistic result. The neutron-star band is Miller et al. 2021’s ±1σ span at 1.4 solar masses, 11.79–13.11 km, across three frameworks. It is not a curve of radius against mass. Named medians are the papers’. The teaspoon mass is the density on the card times one US teaspoon. Not a stellar model, not a dense-matter inference, and not a pulsar timer.";
  }

  return {
    C_M_S: C_M_S,
    G: G,
    GM_SUN: GM_SUN,
    R_SUN_M: R_SUN_M,
    R_EARTH_M: R_EARTH_M,
    G0: G0,
    NAUENBERG_R: NAUENBERG_R,
    NAUENBERG_M: NAUENBERG_M,
    MU_HECO: MU_HECO,
    MU_FE: MU_FE,
    NS_R_LO_KM: NS_R_LO_KM,
    NS_R_HI_KM: NS_R_HI_KM,
    NS_SPAN_MASS: NS_SPAN_MASS,
    TSP_M3: TSP_M3,
    WD_MASS_MIN: WD_MASS_MIN,
    NS_MASS_MIN: NS_MASS_MIN,
    NS_MASS_MAX: NS_MASS_MAX,
    PRESETS: PRESETS,
    chandrasekharMass: chandrasekharMass,
    whiteDwarfRadiusSolar: whiteDwarfRadiusSolar,
    schwarzschildRadiusM: schwarzschildRadiusM,
    derive: derive,
    presetById: presetById,
    wdMassMax: wdMassMax,
    massAllowed: massAllowed,
    sampleWhiteDwarf: sampleWhiteDwarf,
    scene: scene,
    explain: explain,
    spoonLine: spoonLine,
    limitsNote: limitsNote,
    formatMass: formatMass,
    formatKm: formatKm,
    formatSci: formatSci
  };
});
