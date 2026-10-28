/*! How stars shine: mass defect, binding energy, and the solar budget.
    Classroom arithmetic. Not a stellar model and not a reaction network.

    Atomic masses and the AME binding-energy column are the 2020 Atomic
    Mass Evaluation, Wang et al., Chinese Physics C 45, 030003 (2021),
    the mass_1.mas20.txt table. Mass excesses are quoted there in keV.
    This page multiplies the printed atomic masses, in u, by the 2022
    CODATA energy equivalent of the atomic mass constant.

    1 u = 931.49410372 MeV (standard uncertainty 0.00000029 MeV).
    1 u = 1.66053906892×10^−27 kg (standard uncertainty 0.00000000052×10^−27 kg).
    c = 299792458 m/s and e = 1.602176634×10^−19 C are exact.

    The nominal solar luminosity is IAU 2015 Resolution B3:
    3.828×10^26 W, exact as a conversion constant, not a measurement. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Fusion = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* 2022 CODATA. The MeV and kilogram equivalents carry the uncertainties
     printed on the NIST pages. The central values are what this page uses. */
  var U_C2_MEV = 931.49410372;
  var U_KG = 1.66053906892e-27;

  /* Exact SI defining constants. */
  var C_M_S = 299792458;
  var E_C = 1.602176634e-19;

  /* IAU 2015 Resolution B3 nominal solar luminosity, watts. Exact as defined. */
  var L_SUN_W = 3.828e26;

  /* Luminosity slider, in nominal solar luminosities. */
  var L_MIN = 0.01;
  var L_MAX = 100;

  /* AME2020 central values. uText is the atomic mass as printed, with the
     space in the micro-u column removed and the decimal moved six places.
     excessKeV is the mass excess. ameBeKeV is the table's binding energy
     per nucleon, in keV. The chart does not copy that column. It recomputes
     binding from the atomic masses. */
  var NUCLIDES = [
    { id: "n", Z: 0, A: 1, symbol: "n", name: "neutron", u: 1.00866491590, uText: "1.00866491590", excessText: "8071.31806", excessKeV: 8071.31806, ameBeKeV: 0 },
    { id: "h1", Z: 1, A: 1, symbol: "¹H", name: "hydrogen-1", u: 1.007825031898, uText: "1.007825031898", excessText: "7288.971064", excessKeV: 7288.971064, ameBeKeV: 0 },
    { id: "h2", Z: 1, A: 2, symbol: "²H", name: "deuterium", u: 2.014101777844, uText: "2.014101777844", excessText: "13135.722895", excessKeV: 13135.722895, ameBeKeV: 1112.2831 },
    { id: "h3", Z: 1, A: 3, symbol: "³H", name: "tritium", u: 3.01604928132, uText: "3.01604928132", excessText: "14949.81090", excessKeV: 14949.81090, ameBeKeV: 2827.2654 },
    { id: "he3", Z: 2, A: 3, symbol: "³He", name: "helium-3", u: 3.01602932197, uText: "3.01602932197", excessText: "14931.21888", excessKeV: 14931.21888, ameBeKeV: 2572.68044 },
    { id: "he4", Z: 2, A: 4, symbol: "⁴He", name: "helium-4", u: 4.00260325413, uText: "4.00260325413", excessText: "2424.91587", excessKeV: 2424.91587, ameBeKeV: 7073.9156 },
    { id: "li6", Z: 3, A: 6, symbol: "⁶Li", name: "lithium-6", u: 6.01512288742, uText: "6.01512288742", excessText: "14086.88044", excessKeV: 14086.88044, ameBeKeV: 5332.3312 },
    { id: "li7", Z: 3, A: 7, symbol: "⁷Li", name: "lithium-7", u: 7.01600343426, uText: "7.01600343426", excessText: "14907.10463", excessKeV: 14907.10463, ameBeKeV: 5606.4401 },
    { id: "be8", Z: 4, A: 8, symbol: "⁸Be", name: "beryllium-8", u: 8.005305102, uText: "8.005305102", excessText: "4941.672", excessKeV: 4941.672, ameBeKeV: 7062.4356 },
    { id: "be9", Z: 4, A: 9, symbol: "⁹Be", name: "beryllium-9", u: 9.012183062, uText: "9.012183062", excessText: "11348.451", excessKeV: 11348.451, ameBeKeV: 6462.6693 },
    { id: "b10", Z: 5, A: 10, symbol: "¹⁰B", name: "boron-10", u: 10.012936862, uText: "10.012936862", excessText: "12050.611", excessKeV: 12050.611, ameBeKeV: 6475.0835 },
    { id: "c12", Z: 6, A: 12, symbol: "¹²C", name: "carbon-12", u: 12, uText: "12", excessText: "0.0", excessKeV: 0, ameBeKeV: 7680.1446 },
    { id: "n14", Z: 7, A: 14, symbol: "¹⁴N", name: "nitrogen-14", u: 14.00307400425, uText: "14.00307400425", excessText: "2863.41683", excessKeV: 2863.41683, ameBeKeV: 7475.6148 },
    { id: "o16", Z: 8, A: 16, symbol: "¹⁶O", name: "oxygen-16", u: 15.99491461926, uText: "15.99491461926", excessText: "−4737.00217", excessKeV: -4737.00217, ameBeKeV: 7976.2072 },
    { id: "ne20", Z: 10, A: 20, symbol: "²⁰Ne", name: "neon-20", u: 19.99244017525, uText: "19.99244017525", excessText: "−7041.93217", excessKeV: -7041.93217, ameBeKeV: 8032.2412 },
    { id: "mg24", Z: 12, A: 24, symbol: "²⁴Mg", name: "magnesium-24", u: 23.985041689, uText: "23.985041689", excessText: "−13933.578", excessKeV: -13933.578, ameBeKeV: 8260.7103 },
    { id: "si28", Z: 14, A: 28, symbol: "²⁸Si", name: "silicon-28", u: 27.97692653442, uText: "27.97692653442", excessText: "−21492.79711", excessKeV: -21492.79711, ameBeKeV: 8447.7445 },
    { id: "s32", Z: 16, A: 32, symbol: "³²S", name: "sulfur-32", u: 31.97207117354, uText: "31.97207117354", excessText: "−26015.53714", excessKeV: -26015.53714, ameBeKeV: 8493.1301 },
    { id: "ca40", Z: 20, A: 40, symbol: "⁴⁰Ca", name: "calcium-40", u: 39.962590850, uText: "39.962590850", excessText: "−34846.402", excessKeV: -34846.402, ameBeKeV: 8551.3046 },
    { id: "ti48", Z: 22, A: 48, symbol: "⁴⁸Ti", name: "titanium-48", u: 47.947940677, uText: "47.947940677", excessText: "−48492.952", excessKeV: -48492.952, ameBeKeV: 8723.0122 },
    { id: "cr52", Z: 24, A: 52, symbol: "⁵²Cr", name: "chromium-52", u: 51.940504714, uText: "51.940504714", excessText: "−55419.508", excessKeV: -55419.508, ameBeKeV: 8775.9946 },
    { id: "fe56", Z: 26, A: 56, symbol: "⁵⁶Fe", name: "iron-56", u: 55.934935537, uText: "55.934935537", excessText: "−60607.163", excessKeV: -60607.163, ameBeKeV: 8790.3563 },
    { id: "fe58", Z: 26, A: 58, symbol: "⁵⁸Fe", name: "iron-58", u: 57.933273575, uText: "57.933273575", excessText: "−62155.271", excessKeV: -62155.271, ameBeKeV: 8792.2534 },
    { id: "ni58", Z: 28, A: 58, symbol: "⁵⁸Ni", name: "nickel-58", u: 57.935341650, uText: "57.935341650", excessText: "−60228.871", excessKeV: -60228.871, ameBeKeV: 8732.0621 },
    { id: "ni62", Z: 28, A: 62, symbol: "⁶²Ni", name: "nickel-62", u: 61.928344753, uText: "61.928344753", excessText: "−66746.440", excessKeV: -66746.440, ameBeKeV: 8794.5555 },
    { id: "kr84", Z: 36, A: 84, symbol: "⁸⁴Kr", name: "krypton-84", u: 83.91149772708, uText: "83.91149772708", excessText: "−82439.34527", excessKeV: -82439.34527, ameBeKeV: 8717.4473 },
    { id: "sn120", Z: 50, A: 120, symbol: "¹²⁰Sn", name: "tin-120", u: 119.902202557, uText: "119.902202557", excessText: "−91097.741", excessKeV: -91097.741, ameBeKeV: 8504.4880 },
    { id: "pb208", Z: 82, A: 208, symbol: "²⁰⁸Pb", name: "lead-208", u: 207.976652005, uText: "207.976652005", excessText: "−21748.519", excessKeV: -21748.519, ameBeKeV: 7867.4530 },
    { id: "u238", Z: 92, A: 238, symbol: "²³⁸U", name: "uranium-238", u: 238.050786936, uText: "238.050786936", excessText: "47307.732", excessKeV: 47307.732, ameBeKeV: 7570.1262 }
  ];

  var BY_ID = {};
  var i;
  for (i = 0; i < NUCLIDES.length; i++) BY_ID[NUCLIDES[i].id] = NUCLIDES[i];

  /* Curve points, light to heavy. The free neutron is a reactant mass, not a point. */
  var CURVE_IDS = [
    "h2", "h3", "he3", "he4", "li6", "li7", "be8", "be9", "b10", "c12", "n14", "o16",
    "ne20", "mg24", "si28", "s32", "ca40", "ti48", "cr52", "fe56", "fe58", "ni58", "ni62",
    "kr84", "sn120", "pb208", "u238"
  ];

  var REACTIONS = [
    {
      id: "pp",
      short: "pp net",
      equation: "4 ¹H → ⁴He",
      reactants: [{ id: "h1", n: 4 }],
      products: [{ id: "he4", n: 1 }],
      kind: "hydrogen"
    },
    {
      id: "cno",
      short: "CNO net",
      equation: "4 ¹H → ⁴He",
      reactants: [{ id: "h1", n: 4 }],
      products: [{ id: "he4", n: 1 }],
      kind: "hydrogen"
    },
    {
      id: "dt",
      short: "D+T",
      equation: "²H + ³H → ⁴He + n",
      reactants: [{ id: "h2", n: 1 }, { id: "h3", n: 1 }],
      products: [{ id: "he4", n: 1 }, { id: "n", n: 1 }],
      kind: "lab"
    },
    {
      id: "ddn",
      short: "D+D → ³He",
      equation: "²H + ²H → ³He + n",
      reactants: [{ id: "h2", n: 2 }],
      products: [{ id: "he3", n: 1 }, { id: "n", n: 1 }],
      kind: "lab"
    },
    {
      id: "ddp",
      short: "D+D → ³H",
      equation: "²H + ²H → ³H + ¹H",
      reactants: [{ id: "h2", n: 2 }],
      products: [{ id: "h3", n: 1 }, { id: "h1", n: 1 }],
      kind: "lab"
    },
    {
      id: "3a",
      short: "Triple-α",
      equation: "3 ⁴He → ¹²C",
      reactants: [{ id: "he4", n: 3 }],
      products: [{ id: "c12", n: 1 }],
      kind: "helium"
    }
  ];

  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "+": "⁺" };

  function nuclideById(id) {
    return BY_ID[id] || null;
  }

  function nuclides() {
    return NUCLIDES.slice();
  }

  function reactions() {
    return REACTIONS.slice();
  }

  function reactionById(id) {
    var k;
    for (k = 0; k < REACTIONS.length; k++) {
      if (REACTIONS[k].id === id) return REACTIONS[k];
    }
    return null;
  }

  function sideMassU(parts) {
    var sum = 0;
    var k;
    for (k = 0; k < parts.length; k++) {
      var nuc = BY_ID[parts[k].id];
      if (!nuc) return NaN;
      sum += parts[k].n * nuc.u;
    }
    return sum;
  }

  function qValue(id) {
    var rx = reactionById(id);
    if (!rx) return null;
    var inU = sideMassU(rx.reactants);
    var outU = sideMassU(rx.products);
    var dmU = inU - outU;
    var mev = dmU * U_C2_MEV;
    var joules = dmU * U_KG * C_M_S * C_M_S;
    var fraction = inU > 0 ? dmU / inU : NaN;
    return {
      id: rx.id,
      dmU: dmU,
      inU: inU,
      outU: outU,
      mev: mev,
      joules: joules,
      fraction: fraction
    };
  }

  /* Binding from atomic masses:
     BE = [Z m(¹H) + (A−Z) m(n) − m(A,Z)] c².
     The Z electrons in the hydrogen atoms cancel the Z electrons in the atom.
     ¹²C is defined as exactly 12 u, so its mass excess is 0 by the definition of u. */
  function binding(id) {
    var nuc = BY_ID[id];
    if (!nuc || nuc.id === "n") return null;
    var pieces = nuc.Z * BY_ID.h1.u + (nuc.A - nuc.Z) * BY_ID.n.u;
    var dmU = pieces - nuc.u;
    var mev = dmU * U_C2_MEV;
    return {
      id: nuc.id,
      mev: mev,
      perAMeV: mev / nuc.A,
      amePerAMeV: nuc.ameBeKeV / 1000
    };
  }

  function curve() {
    var rows = [];
    var k;
    for (k = 0; k < CURVE_IDS.length; k++) {
      var nuc = BY_ID[CURVE_IDS[k]];
      var b = binding(nuc.id);
      rows.push({
        id: nuc.id,
        symbol: nuc.symbol,
        name: nuc.name,
        Z: nuc.Z,
        A: nuc.A,
        uText: nuc.uText,
        excessText: nuc.excessText,
        perAMeV: b.perAMeV,
        mev: b.mev,
        amePerAMeV: b.amePerAMeV
      });
    }
    return rows;
  }

  function peak() {
    var rows = curve();
    var best = rows[0];
    var k;
    for (k = 1; k < rows.length; k++) {
      if (rows[k].perAMeV > best.perAMeV) best = rows[k];
    }
    return best;
  }

  /* Two alphas to ⁸Be, from the same masses. Negative means ⁸Be is heavier. */
  function beryllium8Q() {
    var dmU = 2 * BY_ID.he4.u - BY_ID.be8.u;
    return { dmU: dmU, mev: dmU * U_C2_MEV };
  }

  function solar(lRelative) {
    if (typeof lRelative !== "number" || !isFinite(lRelative)) return null;
    if (lRelative < L_MIN || lRelative > L_MAX) return null;
    var q = qValue("pp");
    var watts = lRelative * L_SUN_W;
    var massKgS = watts / (C_M_S * C_M_S);
    var reactionsPerS = watts / q.joules;
    var hydrogenKgS = reactionsPerS * 4 * BY_ID.h1.u * U_KG;
    var heliumKgS = reactionsPerS * BY_ID.he4.u * U_KG;
    return {
      lRelative: lRelative,
      watts: watts,
      massKgS: massKgS,
      reactionsPerS: reactionsPerS,
      hydrogenKgS: hydrogenKgS,
      heliumKgS: heliumKgS,
      fraction: q.fraction,
      qMeV: q.mev
    };
  }

  function log10(x) {
    return Math.log(x) / Math.LN10;
  }

  function luminosityFromSlider(step) {
    if (typeof step !== "number" || !isFinite(step)) return NaN;
    if (step < 0) step = 0;
    if (step > 1000) step = 1000;
    var logL = log10(L_MIN) + (step / 1000) * (log10(L_MAX) - log10(L_MIN));
    return Math.pow(10, logL);
  }

  function sliderFromLuminosity(lRelative) {
    if (typeof lRelative !== "number" || !isFinite(lRelative) || lRelative <= 0) return NaN;
    var t = (log10(lRelative) - log10(L_MIN)) / (log10(L_MAX) - log10(L_MIN));
    return t * 1000;
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

  function formatMeV(x) {
    if (typeof x !== "number" || !isFinite(x)) return "—";
    var sign = x < 0 ? "−" : "";
    return sign + Math.abs(x).toFixed(4) + " MeV";
  }

  function formatJ(x) {
    return formatSci(x, 5) + " J";
  }

  function formatU(x) {
    if (typeof x !== "number" || !isFinite(x)) return "—";
    var sign = x < 0 ? "−" : "";
    return sign + Math.abs(x).toFixed(8) + " u";
  }

  function formatPercent(fraction) {
    if (typeof fraction !== "number" || !isFinite(fraction)) return "—";
    return (fraction * 100).toFixed(3) + "%";
  }

  function formatRate(x) {
    return formatSci(x, 4) + " kg/s";
  }

  function formatCount(x) {
    return formatSci(x, 4) + " /s";
  }

  function formatL(lRelative) {
    if (typeof lRelative !== "number" || !isFinite(lRelative)) return "—";
    if (Math.abs(lRelative - 1) < 1e-12) return "1";
    if (lRelative >= 0.01 && lRelative < 100) {
      var rounded = Number(lRelative.toPrecision(4));
      return String(rounded);
    }
    return formatSci(lRelative, 4);
  }

  function explain(id) {
    var q = qValue(id);
    if (!q) return "";
    var mev = formatMeV(q.mev);
    var dm = formatU(q.dmU);
    var frac = formatPercent(q.fraction);
    if (id === "pp") {
      return "Four hydrogen atoms to one helium atom. Δm is " + dm + ". Times 931.49410372 MeV per u, that is " + mev + ". Rounded to one digit after the decimal, 26.7 MeV. The four hydrogen atoms include four electrons and the helium atom includes two. Those two extra electron masses are the partners that annihilate the two positrons created when two protons become neutrons. Neutrinos leave with part of this energy and do not heat the star. This row is the full mass defect.";
    }
    if (id === "cno") {
      return "The CNO catalysts are returned, so they are not in the masses. The net is the same " + mev + " as the pp chain. Adelberger et al. 2011: in the standard solar model the pp chain produces 99% of the Sun’s energy, and the CN cycle about 1%. Heavier main-sequence stars run mainly on CNO. At solar-core temperature that energy generation scales about as T^18, and the pp chain about as T^4. NASA’s Sun facts put the core near 15 million °C. This page does not invent the temperature where the two rates cross.";
    }
    if (id === "dt") {
      return "Deuterium plus tritium. Δm is " + dm + ", and the energy is " + mev + ". Rounded to one digit after the decimal, 17.6 MeV. The neutron has no electrons. Both sides still have two protons’ worth of electrons, so the atomic masses are the right masses for this Q.";
    }
    if (id === "ddn") {
      return "One branch of deuterium plus deuterium: helium-3 and a neutron. Δm is " + dm + ", and the energy is " + mev + ". The other branch, on the next button, makes tritium and a proton. This page does not assign a branching ratio.";
    }
    if (id === "ddp") {
      return "The other deuterium branch: tritium and a proton. Δm is " + dm + ", and the energy is " + mev + ". Both branches are exothermic. The split between them is not computed here.";
    }
    if (id === "3a") {
      var step = beryllium8Q();
      return "Three helium-4 nuclei to carbon-12. The net Δm is " + dm + ", and the energy is " + mev + ". The first step is not a profit. Two ⁴He to ⁸Be is " + formatMeV(step.mev) + " on these masses, so ⁸Be sits above two alpha particles. The third alpha has to be captured before that pair comes apart. This row is the net only.";
    }
    return "";
  }

  function curveNote(id) {
    var b = binding(id);
    var nuc = nuclideById(id);
    var top = peak();
    if (!b || !nuc) return "";
    var gap = top.perAMeV - b.perAMeV;
    var where;
    if (nuc.id === top.id) {
      where = "This is the highest point on the chart.";
    } else if (nuc.A < top.A) {
      where = "It is " + formatMeV(gap) + " per nucleon below " + top.symbol + ", and lighter. Fusion that climbs toward the peak releases energy.";
    } else {
      where = "It is " + formatMeV(gap) + " per nucleon below " + top.symbol + ", and heavier. Fusion further up in mass number would not pay. Fission back toward the peak would.";
    }
    return nuc.symbol + " holds " + formatMeV(b.perAMeV) + " per nucleon. " + where;
  }

  function solarNote(lRelative) {
    var row = solar(lRelative);
    if (!row) return "";
    var frac = formatPercent(row.fraction);
    return "Nominal luminosity " + formatL(row.lRelative) + " L☉ is " + formatSci(row.watts, 4) + " W. Divided by c², the mass equivalent is " + formatRate(row.massKgS) + ". If every joule of the pp-net " + formatMeV(row.qMeV) + " leaves as that light, the hydrogen consumed is " + formatRate(row.hydrogenKgS) + " and the helium made is " + formatRate(row.heliumKgS) + ". The mass fraction is " + frac + ", which is 0.7% to one digit after the decimal. Neutrinos carry away part of the Q, so a real star fuses a little more hydrogen than this. No neutrino fraction is subtracted here, because this page does not cite one.";
  }

  function participants(id) {
    var rx = reactionById(id);
    if (!rx) return [];
    var rows = [];
    function push(parts, role) {
      var k;
      for (k = 0; k < parts.length; k++) {
        var nuc = BY_ID[parts[k].id];
        rows.push({
          role: role,
          n: parts[k].n,
          id: nuc.id,
          symbol: nuc.symbol,
          name: nuc.name,
          uText: nuc.uText,
          excessText: nuc.excessText,
          excessKeV: nuc.excessKeV
        });
      }
    }
    push(rx.reactants, "in");
    push(rx.products, "out");
    return rows;
  }

  return {
    U_C2_MEV: U_C2_MEV,
    U_KG: U_KG,
    C_M_S: C_M_S,
    E_C: E_C,
    L_SUN_W: L_SUN_W,
    L_MIN: L_MIN,
    L_MAX: L_MAX,
    nuclides: nuclides,
    nuclideById: nuclideById,
    reactions: reactions,
    reactionById: reactionById,
    qValue: qValue,
    binding: binding,
    curve: curve,
    peak: peak,
    beryllium8Q: beryllium8Q,
    solar: solar,
    luminosityFromSlider: luminosityFromSlider,
    sliderFromLuminosity: sliderFromLuminosity,
    participants: participants,
    formatSci: formatSci,
    formatMeV: formatMeV,
    formatJ: formatJ,
    formatU: formatU,
    formatPercent: formatPercent,
    formatRate: formatRate,
    formatCount: formatCount,
    formatL: formatL,
    explain: explain,
    curveNote: curveNote,
    solarNote: solarNote
  };
});
