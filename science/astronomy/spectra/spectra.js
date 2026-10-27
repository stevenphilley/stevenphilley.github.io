/*! Hydrogen spectral lines from the Rydberg formula.
    Classroom arithmetic. Not a line list and not a measured spectrum.
    Every constant below is named in the comment and cited on the page.

    R_∞ is the 2022 CODATA Rydberg constant, 10973731.568157 m⁻¹.
    m_p/m_e is the 2022 CODATA proton-electron mass ratio,
    1836.152673426. The hydrogen Rydberg constant on this page is
    R_H = R_∞ × (m_p/m_e) / (m_p/m_e + 1), which is 10967758.340 m⁻¹,
    rounded to six significant figures: 1.09678×10^7 m⁻¹.

    h, c, and e are the exact SI defining constants printed on the
    same CODATA wallet. Photon energy is hc/λ in electronvolts.

    NIST anchors are unresolved centers, not one fine-structure
    component. Vacuum wavelength is 10^7 / σ(cm⁻¹), the rule in the
    NIST ASD line help. Air wavelengths above 2000 Å are the NIST
    compendium’s customary unresolved values, the same figures the
    redshift desk uses. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Spectra = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* 2022 CODATA, NIST SP 959 wallet (May 2024). R_∞ in m⁻¹.
     The wallet prints 10 973 731.568 157. */
  var R_INF = 10973731.568157;

  /* 2022 CODATA proton-electron mass ratio, same wallet. */
  var MP_OVER_ME = 1836.152673426;

  /* Six-significant-figure rounding of R_∞ × (m_p/m_e) / (m_p/m_e + 1).
     The unrounded product is 10967758.340 m⁻¹. */
  var R_H = 1.09678e7;

  /* Exact SI defining constants, marked with * on the 2022 CODATA wallet. */
  var C_M_S = 299792458;
  var H_J_S = 6.62607015e-34;
  var E_C = 1.602176634e-19;

  /* hc in eV·nm. 1 nm = 10⁻⁹ m, and 1 eV = e joules. */
  var HC_EV_NM = (H_J_S * C_M_S / E_C) * 1e9;

  /* NASA Imagine the Universe classroom optical window, the same cut
     as the redshift, blackbody, and EM-spectrum desks. Boundaries
     are a convention. UV is short of 400 nm. IR is long of 700 nm. */
  var VIS_MIN_NM = 400;
  var VIS_MAX_NM = 700;

  /* Wide strip and the visible zoom, nanometres. */
  var WIDE_MIN_NM = 90;
  var WIDE_MAX_NM = 2000;
  var ZOOM_MIN_NM = 370;
  var ZOOM_MAX_NM = 750;

  var N1_MIN = 1;
  var N1_MAX = 8;
  var N2_MAX = 20;
  var Z_MIN = 0;
  var Z_MAX = 5;

  /* How many members of a series to draw, counting up from n₁+1. */
  var SERIES_SPAN = 12;

  /* NIST ASD unresolved centers, and the NIST compendium customary
     wavelengths. Levels are cm⁻¹. Wavelengths below 200 nm are vacuum.
     Between 200 nm and 2000 nm the tabulated wavelength is air.
     σ = E_k − E_i. λ_vac (nm) = 10^7 / σ. */
  var ANCHORS = [
    {
      id: "lya",
      n1: 1,
      n2: 2,
      name: "Lyα",
      eLower: 0,
      eUpper: 82259.158,
      observedNm: 121.56701,
      ritzNm: 121.56701,
      medium: "vacuum",
      compendiumA: 1215.67,
      compendiumMedium: "vacuum"
    },
    {
      id: "hb",
      n1: 2,
      n2: 4,
      name: "Hβ",
      eLower: 82259.158,
      eUpper: 102823.904,
      observedNm: 486.135,
      ritzNm: 486.1333,
      medium: "air",
      compendiumA: 4861.32,
      compendiumMedium: "air"
    },
    {
      id: "ha",
      n1: 2,
      n2: 3,
      name: "Hα",
      eLower: 82259.158,
      eUpper: 97492.304,
      observedNm: 656.279,
      ritzNm: 656.2819,
      medium: "air",
      compendiumA: 6562.8,
      compendiumMedium: "air"
    }
  ];

  var GREEK = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ"];

  var LINE_PRESETS = [
    { id: "lya", name: "Lyα", n1: 1, n2: 2 },
    { id: "ha", name: "Hα", n1: 2, n2: 3 },
    { id: "hb", name: "Hβ", n1: 2, n2: 4 },
    { id: "hg", name: "Hγ", n1: 2, n2: 5 },
    { id: "paa", name: "Paα", n1: 3, n2: 4 },
    { id: "bra", name: "Brα", n1: 4, n2: 5 }
  ];

  function reducedMassRydberg() {
    return R_INF * MP_OVER_ME / (MP_OVER_ME + 1);
  }

  function roundSig(x, sig) {
    var exp = Math.floor(Math.log10(Math.abs(x)));
    var scale = Math.pow(10, sig - 1 - exp);
    return Math.round(x * scale) / scale;
  }

  function isInt(n) {
    return typeof n === "number" && isFinite(n) && Math.round(n) === n;
  }

  function seriesName(n1) {
    if (n1 === 1) return "Lyman";
    if (n1 === 2) return "Balmer";
    if (n1 === 3) return "Paschen";
    if (n1 === 4) return "Brackett";
    if (n1 === 5) return "Pfund";
    return "n₁ = " + n1;
  }

  function seriesPrefix(n1) {
    if (n1 === 1) return "Ly";
    if (n1 === 2) return "H";
    if (n1 === 3) return "Pa";
    if (n1 === 4) return "Br";
    if (n1 === 5) return "Pf";
    return "";
  }

  function lineName(n1, n2) {
    var step = n2 - n1;
    var mark = GREEK[step - 1];
    var prefix = seriesPrefix(n1);
    if (prefix && mark) return prefix + mark;
    return "n=" + n2 + "→" + n1;
  }

  function vacuumM(n1, n2) {
    return 1 / (R_H * (1 / (n1 * n1) - 1 / (n2 * n2)));
  }

  function vacuumNm(n1, n2) {
    return vacuumM(n1, n2) * 1e9;
  }

  function limitNm(n1) {
    return (n1 * n1 / R_H) * 1e9;
  }

  function frequencyHz(nm) {
    return C_M_S / (nm * 1e-9);
  }

  function energyEv(nm) {
    return HC_EV_NM / nm;
  }

  function ionizationEv() {
    return HC_EV_NM * R_H * 1e-9;
  }

  function levelEv(n) {
    return -ionizationEv() / (n * n);
  }

  function bandOf(nm) {
    if (!(nm > 0) || !isFinite(nm)) return null;
    if (nm < VIS_MIN_NM) return "ultraviolet";
    if (nm > VIS_MAX_NM) return "infrared";
    return "visible";
  }

  function bandLabel(band) {
    if (band === "ultraviolet") return "UV";
    if (band === "visible") return "Visible";
    if (band === "infrared") return "IR";
    return "—";
  }

  function observedNm(restNm, z) {
    return restNm * (1 + z);
  }

  function nistVacuumNm(anchor) {
    return 1e7 / (anchor.eUpper - anchor.eLower);
  }

  function compendiumNm(anchor) {
    return anchor.compendiumA / 10;
  }

  function anchorByLevels(n1, n2) {
    var i;
    for (i = 0; i < ANCHORS.length; i++) {
      if (ANCHORS[i].n1 === n1 && ANCHORS[i].n2 === n2) return ANCHORS[i];
    }
    return null;
  }

  function anchorView(anchor) {
    if (!anchor) return null;
    var vac = nistVacuumNm(anchor);
    return {
      id: anchor.id,
      n1: anchor.n1,
      n2: anchor.n2,
      name: anchor.name,
      eLower: anchor.eLower,
      eUpper: anchor.eUpper,
      sigmaCm: anchor.eUpper - anchor.eLower,
      vacNm: vac,
      observedNm: anchor.observedNm,
      ritzNm: anchor.ritzNm,
      medium: anchor.medium,
      compendiumNm: compendiumNm(anchor),
      compendiumMedium: anchor.compendiumMedium,
      airNm: anchor.compendiumMedium === "air" ? compendiumNm(anchor) : null
    };
  }

  function levelsOk(n1, n2) {
    return isInt(n1) && isInt(n2) && n1 >= N1_MIN && n1 <= N1_MAX && n2 > n1 && n2 <= N2_MAX;
  }

  function zOk(z) {
    return typeof z === "number" && isFinite(z) && z >= Z_MIN && z <= Z_MAX;
  }

  function transition(n1, n2, z) {
    if (!levelsOk(n1, n2) || !zOk(z)) return null;
    var rest = vacuumNm(n1, n2);
    var obs = observedNm(rest, z);
    var anchor = anchorView(anchorByLevels(n1, n2));
    return {
      n1: n1,
      n2: n2,
      z: z,
      name: lineName(n1, n2),
      series: seriesName(n1),
      restNm: rest,
      obsNm: obs,
      freqHz: frequencyHz(rest),
      energyEv: energyEv(rest),
      obsFreqHz: frequencyHz(obs),
      obsEnergyEv: energyEv(obs),
      restBand: bandOf(rest),
      band: bandOf(obs),
      limitNm: limitNm(n1),
      anchor: anchor,
      deltaVacNm: anchor ? rest - anchor.vacNm : null
    };
  }

  function seriesMembers(n1, z) {
    if (!isInt(n1) || n1 < N1_MIN || n1 > N1_MAX || !zOk(z)) return [];
    var out = [];
    var n2;
    var cap = Math.min(N2_MAX, n1 + SERIES_SPAN);
    for (n2 = n1 + 1; n2 <= cap; n2++) out.push(transition(n1, n2, z));
    return out;
  }

  function linePresets() {
    return LINE_PRESETS.map(function (p) {
      return { id: p.id, name: p.name, n1: p.n1, n2: p.n2 };
    });
  }

  function presetById(id) {
    var i;
    for (i = 0; i < LINE_PRESETS.length; i++) {
      if (LINE_PRESETS[i].id === id) return linePresets()[i];
    }
    return null;
  }

  /* z that puts a rest wavelength on a target observed wavelength. */
  function zFor(restNm, targetNm) {
    if (!(restNm > 0) || !(targetNm > 0)) return null;
    return targetNm / restNm - 1;
  }

  function zPresets() {
    var lya = vacuumNm(1, 2);
    var ha = vacuumNm(2, 3);
    return [
      { id: "rest", name: "z = 0", z: 0 },
      { id: "enter", name: "Lyα at 400 nm", z: zFor(lya, VIS_MIN_NM) },
      { id: "beside", name: "Lyα at Hα", z: zFor(lya, ha) }
    ];
  }

  function zPresetById(id) {
    var list = zPresets();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  var SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

  function superscript(exp) {
    var s = String(exp);
    var out = "";
    var i;
    var ch;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      if (ch === "-") out += "⁻";
      else if (ch === "+") continue;
      else out += SUP.charAt(Number(ch));
    }
    return out;
  }

  function formatNm(nm) {
    if (!isFinite(nm)) return "—";
    var digits = nm >= 1000 ? 2 : 3;
    return nm.toFixed(digits) + " nm";
  }

  function formatEv(eV) {
    if (!isFinite(eV)) return "—";
    var sign = eV < 0 ? "−" : "";
    var a = Math.abs(eV);
    var digits = a >= 10 ? 3 : 4;
    return sign + a.toFixed(digits) + " eV";
  }

  function formatHz(hz) {
    if (!isFinite(hz) || hz <= 0) return "—";
    var exp = Math.floor(Math.log10(hz));
    var man = hz / Math.pow(10, exp);
    return man.toFixed(4) + "×10" + superscript(exp) + " Hz";
  }

  function formatZ(z) {
    if (!isFinite(z)) return "—";
    var s = z.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
    if (s.indexOf(".") === -1) return s + ".00";
    if (s.split(".")[1].length < 2) return s + "0";
    return s;
  }

  /* A hue sketch so a line can be found on the strip. Not a CIE match.
     Inside 380–700 nm the ramp is the usual classroom piecewise RGB.
     Outside that window the sketch is a flat violet (UV) or deep red (IR). */
  function sketchRgb(nm) {
    var r = 0;
    var g = 0;
    var b = 0;
    var f = 1;
    if (nm < 380) {
      r = 0.42;
      g = 0.18;
      b = 0.85;
    } else if (nm > 700) {
      r = 0.55;
      g = 0.06;
      b = 0.05;
    } else {
      if (nm < 440) {
        r = (440 - nm) / (440 - 380);
        b = 1;
      } else if (nm < 490) {
        g = (nm - 440) / (490 - 440);
        b = 1;
      } else if (nm < 510) {
        g = 1;
        b = (510 - nm) / (510 - 490);
      } else if (nm < 580) {
        r = (nm - 510) / (580 - 510);
        g = 1;
      } else if (nm < 645) {
        r = 1;
        g = (645 - nm) / (645 - 580);
      } else {
        r = 1;
      }
      if (nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40;
      else if (nm > 645) f = 0.35 + 0.65 * (700 - nm) / 55;
    }
    function ch(v) {
      return Math.max(0, Math.min(255, Math.round(v * f * 255)));
    }
    return "rgb(" + ch(r) + "," + ch(g) + "," + ch(b) + ")";
  }

  return {
    R_INF: R_INF,
    MP_OVER_ME: MP_OVER_ME,
    R_H: R_H,
    C_M_S: C_M_S,
    H_J_S: H_J_S,
    E_C: E_C,
    HC_EV_NM: HC_EV_NM,
    VIS_MIN_NM: VIS_MIN_NM,
    VIS_MAX_NM: VIS_MAX_NM,
    WIDE_MIN_NM: WIDE_MIN_NM,
    WIDE_MAX_NM: WIDE_MAX_NM,
    ZOOM_MIN_NM: ZOOM_MIN_NM,
    ZOOM_MAX_NM: ZOOM_MAX_NM,
    N1_MIN: N1_MIN,
    N1_MAX: N1_MAX,
    N2_MAX: N2_MAX,
    Z_MIN: Z_MIN,
    Z_MAX: Z_MAX,
    ANCHORS: ANCHORS,
    reducedMassRydberg: reducedMassRydberg,
    roundSig: roundSig,
    seriesName: seriesName,
    lineName: lineName,
    vacuumNm: vacuumNm,
    limitNm: limitNm,
    frequencyHz: frequencyHz,
    energyEv: energyEv,
    ionizationEv: ionizationEv,
    levelEv: levelEv,
    bandOf: bandOf,
    bandLabel: bandLabel,
    observedNm: observedNm,
    nistVacuumNm: nistVacuumNm,
    anchorByLevels: anchorByLevels,
    anchorView: anchorView,
    transition: transition,
    seriesMembers: seriesMembers,
    linePresets: linePresets,
    presetById: presetById,
    zFor: zFor,
    zPresets: zPresets,
    zPresetById: zPresetById,
    formatNm: formatNm,
    formatEv: formatEv,
    formatHz: formatHz,
    formatZ: formatZ,
    sketchRgb: sketchRgb
  };
});
