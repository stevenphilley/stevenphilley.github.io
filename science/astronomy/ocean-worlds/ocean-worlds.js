/*! Ocean worlds — icy moons with subsurface oceans, for a classroom desk.

    Radii, periods, and eccentricities are the NSSDCA satellite fact
    sheets, except Pluto’s equatorial radius and solar period, which
    are the Pluto Fact Sheet. Ice and ocean figures are the NASA
    sentences named on each card. A blank cell is a number this page
    is not citing.

    The cutaway shares are drawing fractions of the radius. They sum
    to 1 so the labels fit. They are not the published thicknesses.

    Tidal flex on the slider is proportional to eccentricity. The
    heating mark is proportional to e squared, divided by Europa’s
    fact-sheet eccentricity 0.009. Size, orbital rate, and the
    interior’s response stay fixed. It is not a wattage.

    Period ratios use the same six decimals as the resonances desk:
    outer period divided by inner period, toFixed(6).

    Not a mission trajectory and not a habitability verdict. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OceanWorlds = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var EUROPA_E = 0.009;
  var IO_DAYS = 1.769138;
  var EUROPA_DAYS = 3.551181;
  var GANYMEDE_DAYS = 7.154553;
  var ENCELADUS_DAYS = 1.370218;
  var DIONE_DAYS = 2.736915;

  var MOONS = [
    {
      id: "europa",
      name: "Europa",
      tier: "Ocean world · Jupiter",
      parent: "Jupiter",
      radius: "1,560.8 km",
      period: "3.551181 days",
      eccText: "0.009",
      ecc: 0.009,
      ice: "about 15–25 km; about 29 km in the Juno region",
      ocean: "about 60–150 km",
      evidence: "Galileo magnetometer, induced field",
      range: "Jupiter · 3.551181 days · e = 0.009",
      shells: [
        { name: "Rock", kind: "rock", share: 0.64 },
        { name: "Ocean", kind: "ocean", share: 0.18 },
        { name: "Ice shell", kind: "ice", share: 0.18 }
      ],
      why: "Europa. Jovian Satellite Fact Sheet: mean radius 1,560.8 km, orbital period 3.551181 days, eccentricity 0.009, semi-major axis 671.1 × 10³ km. Parent planet Jupiter. NASA’s Europa Clipper FAQ says theory and observation indicate an icy shell around 15 to 25 km (10 to 15 miles) thick, over an ocean approximately 60 to 150 km (40 to 100 miles) deep. A NASA account dated 27 January 2026 says Juno’s microwave radiometer, on the 29 September 2022 flyby, found the shell averages about 18 miles (29 km) thick in the region observed, for the cold, rigid, conductive outer layer of a pure water-ice shell. The same account says a warmer convective layer, if present, would make the total thicker, and modest salt would reduce the estimate by about 3 miles. Those are different published descriptions, not one averaged number. The FAQ traces the ocean case to Galileo: Jupiter’s magnetic field is disturbed around Europa in a way that implies a conductive fluid, and the icy composition makes a salty ocean the likely conductor. This cutaway exaggerates the layers. It is not to scale."
    },
    {
      id: "enceladus",
      name: "Enceladus",
      tier: "Ocean world · Saturn",
      parent: "Saturn",
      radius: "257 × 251 × 248 km",
      period: "1.370218 days",
      eccText: "0.0045",
      ecc: 0.0045,
      ice: "about 30–40 km under the south pole",
      ocean: "about 10 km there; global depth not reprinted",
      evidence: "Cassini plumes, gravity, and libration",
      range: "Saturn · 1.370218 days · e = 0.0045",
      shells: [
        { name: "Rock", kind: "rock", share: 0.55 },
        { name: "Ocean", kind: "ocean", share: 0.2 },
        { name: "Ice shell", kind: "ice", share: 0.25 }
      ],
      why: "Enceladus. Saturnian Satellite Fact Sheet: radii 257 × 251 × 248 km, not one mean radius; orbital period 1.370218 days; eccentricity 0.0045; semi-major axis 238.02 × 10³ km. Parent planet Saturn. The fact sheet says most of these radii are rounded from Thomas, Icarus 208, 2010, and that uncertainties remain. NASA’s gravity account, led by Luciano Iess, gives a sea about 6 miles (10 km) deep under the south polar region, beneath an ice shell about 19 to 25 miles (30 to 40 km) thick. Those figures are for that region. A later NASA account of a libration measured in Cassini images, published in Icarus, says the wobble is too large for an ice shell frozen to the rock, so the ocean is global. This page does not replace the 30 to 40 km and 10 km figures with a newer global thickness. The plumes are Cassini’s: water ice and vapor from the tiger stripes. The drawing is a uniform circle. The fact-sheet body is triaxial, and the south-polar shell is the published gravity range. Not to scale."
    },
    {
      id: "ganymede",
      name: "Ganymede",
      tier: "Ocean world · Jupiter",
      parent: "Jupiter",
      radius: "2,631.2 km",
      period: "7.154553 days",
      eccText: "0.001",
      ecc: 0.001,
      ice: "about 150 km — an estimate",
      ocean: "about 100 km — an estimate",
      evidence: "Hubble auroral oscillation; Galileo field",
      range: "Jupiter · 7.154553 days · e = 0.001",
      shells: [
        { name: "Iron core", kind: "iron", share: 0.16 },
        { name: "Rock mantle", kind: "rock", share: 0.28 },
        { name: "High-pressure ice", kind: "hp", share: 0.24 },
        { name: "Ocean", kind: "ocean", share: 0.14 },
        { name: "Ice shell", kind: "ice", share: 0.18 }
      ],
      why: "Ganymede. Jovian Satellite Fact Sheet: mean radius 2,631.2 km, orbital period 7.154553 days, eccentricity 0.001, semi-major axis 1,070.4 × 10³ km. Parent planet Jupiter. NASA Science estimates the ocean at 60 miles (100 km) thick, under a 95-mile (150 km) crust of mostly ice. Those figures are estimates. Saur et al. 2015 measured auroral ovals that rock by 2.0° ± 1.3°. Their model is 5.8° ± 1.3° with no ocean and 2.2° ± 1.3° with one. NASA’s press account rounds that to 2 degrees instead of 6. The paper requires a conductivity of at least 0.09 S/m for an ocean between 150 and 250 km depth, or, if the ocean is a perfect conductor, a top no deeper than 330 km. That window is wider than the single 150 km and 100 km estimates. NASA Science also says computer models stack ice and oceans in several layers, like a club sandwich, around a rock mantle and an iron core. The high-pressure ice under the ocean on this drawing is that layered picture. The thicknesses are not to scale. Ganymede is the only moon NASA Science credits with its own magnetic field, found by Galileo in 1996."
    },
    {
      id: "callisto",
      name: "Callisto",
      tier: "Disputed · Jupiter",
      parent: "Jupiter",
      radius: "2,410.3 km",
      period: "16.689017 days",
      eccText: "0.007",
      ecc: 0.007,
      ice: "about 250 km to a possible ocean — disputed",
      ocean: "—",
      evidence: "Galileo induced field; ocean may be absent",
      range: "Jupiter · 16.689017 days · e = 0.007",
      shells: [
        { name: "Mixed ice and rock", kind: "mixed", share: 0.7 },
        { name: "Possible ocean", kind: "maybe", share: 0.08 },
        { name: "Ice shell", kind: "ice", share: 0.22 }
      ],
      why: "Callisto. Jovian Satellite Fact Sheet: mean radius 2,410.3 km, orbital period 16.689017 days, eccentricity 0.007, semi-major axis 1,882.7 × 10³ km. Parent planet Jupiter. NASA Science says Galileo data and models indicate a salty ocean that may interact with rock about 155 miles (250 km) beneath the surface, and that the ocean may lie deeper or may not exist at all. This page therefore does not print an ocean depth. JPL’s 1998 account of the magnetometer team is the induced-field case: a variable field, synchronized with Jupiter. A NASA technical report on the same magnetometer work says the conductivity exceeds 0.02 S/m at a depth of no more than 300 km, and that a global ocean only a few kilometers thick could explain the signal. A few kilometers is a lower bound in that model, not a measured depth, so the ocean cell is blank. The dashed band is a possible ocean. It is not 250 km, and it is not to scale."
    },
    {
      id: "titan",
      name: "Titan",
      tier: "Ocean world · Saturn",
      parent: "Saturn",
      radius: "2,575 km",
      period: "15.945421 days",
      eccText: "0.0292",
      ecc: 0.0292,
      ice: "—",
      ocean: "—",
      evidence: "Cassini k₂; published values disagree",
      range: "Saturn · 15.945421 days · e = 0.0292",
      shells: [
        { name: "Rock or high-pressure ice", kind: "unknown", share: 0.58 },
        { name: "Ocean", kind: "ocean", share: 0.18 },
        { name: "Ice shell", kind: "ice", share: 0.24 }
      ],
      atmosphere: true,
      why: "Titan. Saturnian Satellite Fact Sheet: radius 2,575 km, orbital period 15.945421 days, eccentricity 0.0292, semi-major axis 1,221.87 × 10³ km. Parent planet Saturn. JPL’s Cassini account says a stiff-rock Titan would flex by about 3 feet (1 meter), and the measured solid tide is about 30 feet (10 meters). Iess and coauthors read that as a global water ocean under the ice. Iess et al. 2012, Science, give two degree-2 Love numbers, k₂ = 0.589 ± 0.150 and k₂ = 0.637 ± 0.224. That abstract prints e = 0.028. The fact sheet prints 0.0292. This page does not average them. Durante et al. 2019, Icarus, give k₂ = 0.616 ± 0.067. Goossens et al. 2024, Nature Astronomy, give k₂ = 0.375 ± 0.06 and read a lower-density water or ammonia ocean rather than a dense one. The ocean is the shared reading. The depth and the ice-shell thickness are not fixed by these numbers, so those cells are blank. JPL notes the tides do not say whether the ocean floor is rock or ice. The surface lakes are methane and ethane, not this water ocean. The haze outside the circle is the atmosphere, not a shell thickness. Not to scale."
    },
    {
      id: "triton",
      name: "Triton",
      tier: "Candidate · Neptune",
      parent: "Neptune",
      radius: "1,353.4 km",
      period: "5.876854 days, retrograde",
      eccText: "0.000016",
      ecc: 0.000016,
      ice: "—",
      ocean: "—",
      evidence: "Candidate; no thickness cited here",
      range: "Neptune · 5.876854 days retrograde · e = 0.000016",
      shells: [
        { name: "Rockier interior", kind: "rock", share: 0.62 },
        { name: "Possible ocean", kind: "maybe", share: 0.08 },
        { name: "Ice shell", kind: "ice", share: 0.3 }
      ],
      why: "Triton. A candidate, not a confirmed ocean world on this page. Neptunian Satellite Fact Sheet: radius 1,353.4 km, orbital period 5.876854 days and retrograde, eccentricity 0.000016, semi-major axis 354.76 × 10³ km. Parent planet Neptune. NASA’s Trident proposal page calls Triton potentially an ocean world, with liquid water under the icy crust. No ice-shell thickness and no ocean depth are printed here. The fact-sheet eccentricity is 0.000016, so the eccentricity slider barely moves. A NASA concept study says Triton’s inclined orbit makes obliquity tides the heat source that study discusses. This desk does not draw obliquity. The study notes Voyager 2’s flyby in 1989. The dashed band is a question, not a measurement. Not to scale."
    },
    {
      id: "pluto",
      name: "Pluto",
      tier: "Candidate · dwarf planet",
      parent: "—",
      radius: "1,188 km equatorial",
      period: "90,560 days around the Sun",
      eccText: "—",
      ecc: null,
      ice: "—",
      ocean: "—",
      evidence: "Candidate; Sputnik Planitia",
      range: "Not a satellite · 90,560 days around the Sun",
      shells: [
        { name: "Rock", kind: "rock", share: 0.6 },
        { name: "Possible ocean", kind: "maybe", share: 0.1 },
        { name: "Ice shell", kind: "ice", share: 0.3 }
      ],
      why: "Pluto. A candidate. It is not a satellite, so the parent cell is blank. NSSDCA Pluto Fact Sheet: equatorial radius 1,188 km, sidereal orbit period 90,560 days. The solar eccentricity on that sheet is 0.24880766. That number is the orbit around the Sun. It is not a tide on this slider, and it is not printed in the eccentricity column. Charon is the moon that sits opposite Sputnik Planitia. NASA’s account says Nimmo and colleagues, in Nature, read extra mass under Sputnik Planitia as ocean uplift after an impact thinned the ice. The Nature abstract says that without a subsurface ocean a positive gravity anomaly would require a nitrogen layer exceeding 40 km. No ice-shell thickness and no ocean depth are printed here. The circle on the dwarf-planets desk is twice this 1,188 km radius. The dashed band is not a measured shell. Not to scale."
    }
  ];

  var TIDE_PRESETS = [
    { id: "zero", name: "Circular", e: 0 },
    { id: "ganymede", name: "Ganymede", e: 0.001 },
    { id: "io", name: "Io", e: 0.004 },
    { id: "enceladus", name: "Enceladus", e: 0.0045 },
    { id: "callisto", name: "Callisto", e: 0.007 },
    { id: "europa", name: "Europa", e: 0.009 },
    { id: "titan", name: "Titan", e: 0.0292 },
    { id: "triton", name: "Triton", e: 0.000016 }
  ];

  function moonById(id) {
    var i;
    for (i = 0; i < MOONS.length; i++) if (MOONS[i].id === id) return MOONS[i];
    return null;
  }

  function ids() {
    return MOONS.map(function (m) { return m.id; });
  }

  function shareSum(id) {
    var m = moonById(id);
    var s = 0;
    var i;
    for (i = 0; i < m.shells.length; i++) s += m.shells[i].share;
    return s;
  }

  function ratioText(outerDays, innerDays) {
    return (outerDays / innerDays).toFixed(6);
  }

  function heatScale(e) {
    var x = Number(e);
    if (!(x > 0)) return 0;
    return (x / EUROPA_E) * (x / EUROPA_E);
  }

  function flexScale(e) {
    var x = Number(e);
    if (!(x > 0)) return 0;
    return x / EUROPA_E;
  }

  function formatScale(x) {
    var n = Number(x);
    if (!(n > 0)) return "0";
    var s;
    if (n >= 10) s = n.toFixed(2);
    else if (n >= 0.001) s = n.toFixed(4);
    else return n.toExponential(2).replace("e", " × 10^");
    return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function formatHeat(e) {
    return formatScale(heatScale(e));
  }

  function formatFlex(e) {
    return formatScale(flexScale(e));
  }

  function missionsNote() {
    return "Europa Clipper launched on 14 October 2024, on NASA’s FAQ. That page says arrival in 2030, about 50 flybys, and closest approaches as low as 25 km (16 miles). It is not a life-detection mission. JPL Horizons’ spacecraft record lists a Mars gravity assist on 1 March 2025, an Earth gravity assist on 3 December 2026, and arrival on 11 April 2030. Those are that record’s cruise dates. ESA’s Juice page lists launch on 14 April 2023, flybys including a September 2026 Earth pass and a January 2029 Earth pass, and arrival at Jupiter in July 2031. ESA’s science newsletter of 4 November 2026 calls Juice en route. Ganymede orbit in December 2034 is the plan on ESA’s Ganymede-orbit description and on CNES’s update of 10 April 2026. Dragonfly, on NASA Science, is no earlier than July 2028, with arrival in late 2034. NASA’s 23 October 2026 blog says the rotorcraft was in integration and testing and had completed a simulated first flight. It had not launched. A NASA launch-services release gives a targeted window of 5–25 July 2028 on a Falcon Heavy from Launch Complex 39A.";
  }

  function limitsNote() {
    return "Educational schematic. Not a mission trajectory, not a claim that any of these oceans is inhabited, and not a measurement you can navigate by. Layer thicknesses on the drawing are exaggerated so a phone can see them. They are not the published ranges. Where a published figure is an estimate or a dispute, the table says so. A dash is a number this page is not citing. Europa Clipper is not a life-detection mission.";
  }

  function tideNote() {
    return "The slider holds size, orbital rate, and the interior’s response fixed, and changes only eccentricity. The extra stretch is proportional to e. The heating mark is proportional to e², the small-e dependence in Peale, Cassen, and Reynolds 1979, divided by Europa’s fact-sheet eccentricity 0.009. At that eccentricity both marks read 1. At 0 both read 0. This is not a wattage and not a ranking of real heat between moons. Io’s 0.004 is on the slider because Io is in the Laplace resonance. Io is rock and lava, not a water-ocean cutaway here. Triton’s 0.000016 barely moves the marks. Obliquity tides are not drawn.";
  }

  function laplaceSentence() {
    return "Europa’s period divided by Io’s is " + ratioText(EUROPA_DAYS, IO_DAYS) +
      ". Ganymede’s divided by Europa’s is " + ratioText(GANYMEDE_DAYS, EUROPA_DAYS) +
      ". Ganymede’s divided by Io’s is " + ratioText(GANYMEDE_DAYS, IO_DAYS) +
      ". NASA Science’s rounded sentence is one orbit of Ganymede, two of Europa, and four of Io. The resonances desk prints these six decimals from the same fact-sheet periods. Callisto is not in that chain.";
  }

  function enceladusSentence() {
    return "Dione’s period 2.736915 days divided by Enceladus’s 1.370218 days is " +
      ratioText(DIONE_DAYS, ENCELADUS_DAYS) +
      ", near 2:1. Both periods are the Saturnian Satellite Fact Sheet.";
  }

  function ariaCutaway(id) {
    var m = moonById(id);
    if (!m) return "Schematic cutaway.";
    return "Schematic cutaway of " + m.name + ", not to scale. " + m.why;
  }

  function ariaTide(e) {
    var x = Number(e);
    if (!isFinite(x) || x < 0) x = 0;
    return "Qualitative tidal flex at eccentricity " + String(x) +
      ". Relative flex " + formatFlex(x) +
      ". Relative heating " + formatHeat(x) +
      ", with Europa’s 0.009 as 1. Exaggerated drawing, not a wattage.";
  }

  function stats(id) {
    var m = moonById(id);
    return [
      ["Parent", m.parent],
      ["Radius", m.radius],
      ["Orbital period", m.period],
      ["Eccentricity", m.eccText],
      ["Ice shell", m.ice],
      ["Ocean", m.ocean],
      ["Evidence", m.evidence]
    ];
  }

  return {
    EUROPA_E: EUROPA_E,
    IO_DAYS: IO_DAYS,
    EUROPA_DAYS: EUROPA_DAYS,
    GANYMEDE_DAYS: GANYMEDE_DAYS,
    ENCELADUS_DAYS: ENCELADUS_DAYS,
    DIONE_DAYS: DIONE_DAYS,
    MOONS: MOONS,
    TIDE_PRESETS: TIDE_PRESETS,
    moonById: moonById,
    ids: ids,
    shareSum: shareSum,
    ratioText: ratioText,
    heatScale: heatScale,
    flexScale: flexScale,
    formatScale: formatScale,
    formatHeat: formatHeat,
    formatFlex: formatFlex,
    missionsNote: missionsNote,
    limitsNote: limitsNote,
    tideNote: tideNote,
    laplaceSentence: laplaceSentence,
    enceladusSentence: enceladusSentence,
    ariaCutaway: ariaCutaway,
    ariaTide: ariaTide,
    stats: stats
  };
});
