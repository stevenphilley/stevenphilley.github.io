/*! solar-system-3d.js — WebGL orrery for the astronomy solar map.
 *  Heliocentric ecliptic coordinates from NASA JPL approximate Keplerian
 *  elements (ssd.jpl.nasa.gov/planets/approx_pos.html), Table 1 for
 *  1800–2050 and Table 2 (with the Table 2b terms) outside that window.
 *  Earth uses the Earth–Moon barycenter elements on that page.
 *  Pluto is not on the current eight-planet table. Its row is the same
 *  fit style, and the L and L-dot match the flat map. Semimajor axis
 *  39.482 AU matches the NSSDCA Pluto fact sheet.
 *  Y is up (north ecliptic). Planet sizes are exaggerated in every mode.
 *  Moon paths are circular schematics around the parent, separations stretched.
 */
(function (root) {
  "use strict";

  var J2000 = 2451545.0;
  var AU_KM = 149597870.7;

  /* a, adot, e, edot, I, Idot, L, Ldot, varpi, varpidot, Omega, Omegadot */
  function row(a, da, e, de, I, dI, L, dL, w, dw, O, dO) {
    return { a: a, da: da, e: e, de: de, I: I, dI: dI, L: L, dL: dL, w: w, dw: dw, O: O, dO: dO };
  }

  var T1 = {
    mercury: row(0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081),
    venus: row(0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418),
    earth: row(1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0.0, 0.0),
    mars: row(1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343),
    jupiter: row(5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106),
    saturn: row(9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794),
    uranus: row(19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589),
    neptune: row(30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664)
  };

  var T2 = {
    mercury: row(0.38709843, 0.0, 0.20563661, 0.00002123, 7.00559432, -0.00590158, 252.25166724, 149472.67486623, 77.45771895, 0.15940013, 48.33961819, -0.12214182),
    venus: row(0.72332102, -0.00000026, 0.00676399, -0.00005107, 3.39777545, 0.00043494, 181.97970850, 58517.81560260, 131.76755713, 0.05679648, 76.67261496, -0.27274174),
    earth: row(1.00000018, -0.00000003, 0.01673163, -0.00003661, -0.00054346, -0.01337178, 100.46691572, 35999.37306329, 102.93005885, 0.31795260, -5.11260389, -0.24123856),
    mars: row(1.52371243, 0.00000097, 0.09336511, 0.00009149, 1.85181869, -0.00724757, -4.56813164, 19140.29934243, -23.91744784, 0.45223625, 49.71320984, -0.26852431),
    jupiter: row(5.20248019, -0.00002864, 0.04853590, 0.00018026, 1.29861416, -0.00322699, 34.33479152, 3034.90371757, 14.27495244, 0.18199196, 100.29282654, 0.13024619),
    saturn: row(9.54149883, -0.00003065, 0.05550825, -0.00032044, 2.49424102, 0.00451969, 50.07571329, 1222.11494724, 92.86136063, 0.54179478, 113.63998702, -0.25015002),
    uranus: row(19.18797948, -0.00020455, 0.04685740, -0.00001550, 0.77298127, -0.00180155, 314.20276625, 428.49512595, 172.43404441, 0.09266985, 73.96250215, 0.05739699),
    neptune: row(30.06952752, 0.00006447, 0.00895439, 0.00000818, 1.77005520, 0.00022400, 304.22289287, 218.46515314, 46.68158724, 0.01009938, 131.78635853, -0.00606302)
  };

  var EXTRA = {
    jupiter: { b: -0.00012452, c: 0.06064060, s: -0.35635438, f: 38.35125000 },
    saturn: { b: 0.00025899, c: -0.13434469, s: 0.87320147, f: 38.35125000 },
    uranus: { b: 0.00058331, c: -0.97731848, s: 0.17689245, f: 7.67025000 },
    neptune: { b: -0.00041348, c: 0.68346318, s: -0.10162547, f: 7.67025000 }
  };

  /* Historical JPL-style row. L and L-dot are the flat map's mean longitude. */
  var PLUTO = row(39.48211675, -0.00031596, 0.24882730, 0.00005170, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482);

  /* radiusKm: volumetric / mean radius for a size cue. disp: compressed-view radius. */
  var LOOK = {
    sun: { color: "#ffcc66", radiusKm: 695700, disp: 0.46, glow: true },
    mercury: { color: "#b8b0a4", radiusKm: 2439.7, disp: 0.11 },
    venus: { color: "#e8c989", radiusKm: 6051.8, disp: 0.15 },
    earth: { color: "#6ec8ff", radiusKm: 6371.0, disp: 0.16 },
    mars: { color: "#e07a4c", radiusKm: 3389.5, disp: 0.13 },
    jupiter: { color: "#d4a574", radiusKm: 69911, disp: 0.34 },
    saturn: { color: "#e6d4a8", radiusKm: 58232, disp: 0.30, rings: true },
    uranus: { color: "#9fd6e8", radiusKm: 25362, disp: 0.21 },
    neptune: { color: "#4f7cff", radiusKm: 24622, disp: 0.20 },
    pluto: { color: "#c9b8a8", radiusKm: 1188.3, disp: 0.09, dwarf: true }
  };

  /* Major moons. aKm and periodDays from NASA planetary fact sheets.
     iDeg is the inclination used for this schematic (Moon: to the ecliptic;
     others: to the planet's equator, drawn around the parent's node).
     Paths are circular. Separations are stretched in the view. */
  var MOONS = [
    { id: "moon", name: "Moon", parent: "earth", parentName: "Earth", aKm: 384400, periodDays: 27.3217, e: 0.0549, iDeg: 5.145, Omega: 125.08, L0: 218.316, color: "#d5d2cc", radiusKm: 1737.4, type: "Moon of Earth" },
    { id: "io", name: "Io", parent: "jupiter", parentName: "Jupiter", aKm: 421700, periodDays: 1.769138, e: 0.0041, iDeg: 0.036, L0: 20, color: "#e6d27a", radiusKm: 1821.6, type: "Moon of Jupiter" },
    { id: "europa", name: "Europa", parent: "jupiter", parentName: "Jupiter", aKm: 670900, periodDays: 3.551181, e: 0.0094, iDeg: 0.466, L0: 110, color: "#d8c7a4", radiusKm: 1560.8, type: "Moon of Jupiter" },
    { id: "ganymede", name: "Ganymede", parent: "jupiter", parentName: "Jupiter", aKm: 1070400, periodDays: 7.154553, e: 0.0013, iDeg: 0.177, L0: 200, color: "#b9b1a4", radiusKm: 2631.2, type: "Moon of Jupiter" },
    { id: "callisto", name: "Callisto", parent: "jupiter", parentName: "Jupiter", aKm: 1882700, periodDays: 16.689018, e: 0.0074, iDeg: 0.192, L0: 300, color: "#8e877e", radiusKm: 2410.3, type: "Moon of Jupiter" },
    { id: "titan", name: "Titan", parent: "saturn", parentName: "Saturn", aKm: 1221870, periodDays: 15.945, e: 0.0288, iDeg: 0.349, L0: 45, color: "#e0b15a", radiusKm: 2574.7, type: "Moon of Saturn" },
    { id: "triton", name: "Triton", parent: "neptune", parentName: "Neptune", aKm: 354759, periodDays: 5.876854, e: 0.000016, iDeg: 156.865, L0: 250, color: "#c8d4e0", radiusKm: 1353.4, type: "Moon of Neptune" }
  ];

  var MOON_FACTS = {
    moon: [
      "Mean distance 384,400 km. Inclination to the ecliptic about 5.145°. Eccentricity 0.0549.",
      "Drawn on a circular path around the Earth–Moon barycenter. The separation on the map is stretched."
    ],
    io: [
      "Innermost large Galilean moon. Orbital period about 1.769 days. Fact-sheet semimajor axis 421,700 km.",
      "The path here is a circle around Jupiter, not a satellite ephemeris. The gap from Jupiter is stretched."
    ],
    europa: [
      "Ice crust over a deep ocean, on the usual reading of the Galileo results. Period about 3.551 days.",
      "Circular schematic. Separation from Jupiter is stretched so the moon is visible."
    ],
    ganymede: [
      "Largest moon in the solar system. Period about 7.155 days. Semimajor axis about 1,070,400 km.",
      "Circular schematic around Jupiter. Not a Horizons state."
    ],
    callisto: [
      "Outermost Galilean moon. Period about 16.69 days. Semimajor axis about 1,882,700 km.",
      "Circular schematic. The drawn gap is larger than the real one."
    ],
    titan: [
      "Largest moon of Saturn. Thick nitrogen atmosphere. Period about 15.95 days. Semimajor axis 1,221,870 km.",
      "Circular schematic. Separation from Saturn is stretched."
    ],
    triton: [
      "Neptune’s largest moon, on a retrograde path. Period about 5.877 days. Inclination about 156.9° to Neptune’s equator.",
      "Drawn retrograde around Neptune. A schematic, not a satellite ephemeris."
    ]
  };

  function norm360(d) {
    d = d % 360;
    if (d < 0) d += 360;
    return d;
  }

  function norm180(d) {
    d = norm360(d);
    if (d > 180) d -= 360;
    return d;
  }

  function yearOf(jd) {
    return 2000 + (jd - J2000) / 365.25;
  }

  function moonById(id) {
    var i;
    for (i = 0; i < MOONS.length; i++) if (MOONS[i].id === id) return MOONS[i];
    return null;
  }

  function elements(id, jd) {
    if (id === "sun") return null;
    var T = (jd - J2000) / 36525;
    var src;
    var extra = null;
    if (id === "pluto") {
      src = PLUTO;
    } else {
      var y = yearOf(jd);
      var useLong = y < 1800 || y > 2050;
      src = (useLong ? T2 : T1)[id];
      if (useLong) extra = EXTRA[id] || null;
    }
    if (!src) return null;
    var e = src.e + src.de * T;
    if (e < 0) e = 0;
    if (e > 0.95) e = 0.95;
    return {
      a: src.a + src.da * T,
      e: e,
      I: src.I + src.dI * T,
      L: src.L + src.dL * T,
      varpi: src.w + src.dw * T,
      Omega: src.O + src.dO * T,
      extra: extra
    };
  }

  function solveE(M, e) {
    var E = M + e * Math.sin(M);
    var n;
    for (n = 0; n < 15; n++) {
      var dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
      E += dE;
      if (Math.abs(dE) < 1e-12) break;
    }
    return E;
  }

  function rotateOrbit(xp, yp, el) {
    var w = (el.varpi - el.Omega) * Math.PI / 180;
    var Om = el.Omega * Math.PI / 180;
    var I = el.I * Math.PI / 180;
    var cw = Math.cos(w), sw = Math.sin(w);
    var cO = Math.cos(Om), sO = Math.sin(Om);
    var cI = Math.cos(I), sI = Math.sin(I);
    return {
      x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
      y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
      z: (sw * sI) * xp + (cw * sI) * yp
    };
  }

  function pack(x, y, z, extra) {
    var r = Math.sqrt(x * x + y * y + z * z);
    var lon = Math.atan2(y, x) * 180 / Math.PI;
    if (lon < 0) lon += 360;
    var lat = r > 0 ? Math.asin(Math.max(-1, Math.min(1, z / r))) * 180 / Math.PI : 0;
    var out = { x: x, y: y, z: z, r: r, lon: lon, lat: lat };
    if (extra) {
      var k;
      for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) out[k] = extra[k];
    }
    return out;
  }

  function positionFromElements(el) {
    var Mdeg = el.L - el.varpi;
    if (el.extra) {
      var ex = el.extra;
      var T = 0;
      /* extra terms are applied by the caller via el.extraT */
      T = el.extraT || 0;
      var fT = ex.f * T * Math.PI / 180;
      Mdeg += ex.b * T * T + ex.c * Math.cos(fT) + ex.s * Math.sin(fT);
    }
    var e = el.e;
    var E = solveE(norm180(Mdeg) * Math.PI / 180, e);
    var xp = el.a * (Math.cos(E) - e);
    var yp = el.a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
    var p = rotateOrbit(xp, yp, el);
    return pack(p.x, p.y, p.z, { a: el.a, e: el.e, I: el.I, meanL: norm360(el.L) });
  }

  function orbitPoint(el, E) {
    var e = el.e;
    var xp = el.a * (Math.cos(E) - e);
    var yp = el.a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
    return rotateOrbit(xp, yp, el);
  }

  function moonOffset(moon, parentEl, jd) {
    var days = jd - J2000;
    var nu = norm360(moon.L0 + (360 / moon.periodDays) * days) * Math.PI / 180;
    var r = moon.aKm / AU_KM;
    var i = moon.iDeg * Math.PI / 180;
    var Om = ((moon.Omega != null ? moon.Omega : parentEl.Omega) || 0) * Math.PI / 180;
    var cO = Math.cos(Om), sO = Math.sin(Om);
    var cI = Math.cos(i), sI = Math.sin(i);
    var cv = Math.cos(nu), sv = Math.sin(nu);
    return {
      x: r * (cv * cO - sv * sO * cI),
      y: r * (cv * sO + sv * cO * cI),
      z: r * sv * sI,
      r: r
    };
  }

  function helio(id, jd) {
    if (!id || id === "sun") return pack(0, 0, 0, { a: 0, e: 0, I: 0, meanL: 0 });
    var moon = moonById(id);
    if (moon) {
      var parent = helio(moon.parent, jd);
      var pel = elements(moon.parent, jd);
      if (pel) pel.extraT = (jd - J2000) / 36525;
      var off = moonOffset(moon, pel || { Omega: 0 }, jd);
      return pack(parent.x + off.x, parent.y + off.y, parent.z + off.z, {
        a: moon.aKm / AU_KM,
        e: moon.e,
        I: moon.iDeg,
        meanL: norm360(moon.L0 + (360 / moon.periodDays) * (jd - J2000)),
        moon: true,
        parentR: parent.r,
        fromParent: off.r
      });
    }
    var el = elements(id, jd);
    if (!el) return null;
    el.extraT = (jd - J2000) / 36525;
    return positionFromElements(el);
  }

  function moonRecord(id) {
    var m = moonById(id);
    if (!m) return null;
    var au = m.aKm / AU_KM;
    return {
      id: m.id,
      name: m.name,
      type: m.type,
      au: au,
      period: m.periodDays.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + " days",
      diameter: Math.round(m.radiusKm * 2).toLocaleString("en-US") + " km",
      facts: MOON_FACTS[m.id] || [],
      moon: true,
      parent: m.parent,
      parentName: m.parentName,
      color: m.color
    };
  }

  function compressR(r) {
    var rc = Math.max(r, 0.18);
    var minAU = 0.28;
    var maxAU = 50;
    var u = (Math.log(rc) - Math.log(minAU)) / (Math.log(maxAU) - Math.log(minAU));
    if (u < 0) u = 0;
    if (u > 1.2) u = 1.2;
    return 1.25 + u * 16.2;
  }

  function toWorld(x, y, z, scale) {
    if (scale === "true") return { x: x, y: z, z: y };
    var r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-8) return { x: 0, y: 0, z: 0 };
    var s = compressR(r) / r;
    return { x: x * s, y: z * s, z: y * s };
  }

  function visualRadius(id, scale, moon) {
    if (moon) {
      var km = moon.radiusKm;
      if (scale === "true") return Math.max(0.02, (km / AU_KM) * 80);
      return Math.max(0.045, km / 695700 * 0.22);
    }
    var look = LOOK[id];
    if (!look) return 0.1;
    if (scale !== "true") return look.disp;
    var au = look.radiusKm / AU_KM;
    var r = Math.max(0.04, au * 80);
    if (id === "sun") r = Math.min(r, 0.15);
    return r;
  }

  function cssColor(name, fallback) {
    var raw = "";
    try { raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
    catch (err) { raw = ""; }
    return raw || fallback;
  }

  function create(opts) {
    var THREE = root.THREE;
    var OrbitControls = root.OrbitControls;
    if (!THREE || !OrbitControls || !opts || !opts.canvas) return null;

    var canvas = opts.canvas;
    var labelRoot = opts.labels || null;
    var getEpoch = opts.getEpoch || function () { return new Date(); };
    var onPick = opts.onPick || function () {};
    var onUserMove = opts.onUserMove || function () {};
    var onReady = opts.onReady || function () {};
    var onContextLost = opts.onContextLost || function () {};

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true
      });
    } catch (err) {
      return null;
    }
    if (!renderer.getContext()) return null;
    renderer.toneMapping = THREE.NoToneMapping;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var reduceMotion = !!opts.reduceMotion;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) reduceMotion = true;
    } catch (err) { /* keep the flag */ }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.02, 500);
    var controls = new OrbitControls(camera, canvas);
    controls.enableDamping = !reduceMotion;
    controls.dampingFactor = 0.08;
    controls.zoomToCursor = true;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.85;
    controls.panSpeed = 0.85;
    controls.zoomSpeed = 1.05;
    controls.minPolarAngle = 0.02;
    controls.maxPolarAngle = Math.PI - 0.02;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var sunLight = new THREE.PointLight(0xfff4dd, 2.4, 0, 0);
    scene.add(sunLight);

    var state = {
      pluto: true,
      moons: false,
      orbits: true,
      labels: true,
      grid: true,
      scale: "compressed",
      follow: null
    };

    var bodies = {};
    var labels = {};
    var gridGroup = new THREE.Group();
    scene.add(gridGroup);
    var selected = "sun";
    var running = false;
    var frameId = 0;
    var readySent = false;
    var width = 1;
    var height = 1;
    var anim = null;
    var followHold = null;
    var accentHex = "#c8b48a";

    function julian(d) {
      return d.getTime() / 86400000 + 2440587.5;
    }

    function epochJD() {
      var d = getEpoch();
      if (!d || isNaN(d.getTime())) d = new Date();
      return julian(d);
    }

    function moonBoost() {
      return state.scale === "true" ? 40 : 90;
    }

    function worldOf(id, jd) {
      var h = helio(id, jd);
      if (!h) return null;
      if (!moonById(id)) return { h: h, w: toWorld(h.x, h.y, h.z, state.scale) };
      var parent = helio(moonById(id).parent, jd);
      var pw = toWorld(parent.x, parent.y, parent.z, state.scale);
      var boost = moonBoost();
      var ox = h.x - parent.x;
      var oy = h.y - parent.y;
      var oz = h.z - parent.z;
      return {
        h: h,
        w: { x: pw.x + ox * boost, y: pw.y + oz * boost, z: pw.z + oy * boost }
      };
    }

    function makeBody(id, moon) {
      var color = moon ? moon.color : LOOK[id].color;
      var geo = new THREE.SphereGeometry(1, id === "sun" ? 28 : 18, id === "sun" ? 20 : 14);
      var mat;
      if (id === "sun") {
        mat = new THREE.MeshBasicMaterial({ color: color });
      } else {
        mat = new THREE.MeshLambertMaterial({ color: color });
      }
      var mesh = new THREE.Mesh(geo, mat);
      mesh.userData.id = id;
      scene.add(mesh);
      var sel = new THREE.Mesh(
        new THREE.SphereGeometry(1.42, 16, 12),
        new THREE.MeshBasicMaterial({ color: accentHex, wireframe: true, transparent: true, opacity: 0.85 })
      );
      sel.visible = false;
      sel.userData.pickIgnore = true;
      scene.add(sel);
      var glow = null;
      if (id === "sun") {
        glow = new THREE.Mesh(
          new THREE.SphereGeometry(1.7, 20, 16),
          new THREE.MeshBasicMaterial({ color: "#ffaa33", transparent: true, opacity: 0.28, depthWrite: false })
        );
        glow.userData.pickIgnore = true;
        scene.add(glow);
      }
      var ring = null;
      if (!moon && LOOK[id] && LOOK[id].rings) {
        ring = new THREE.Mesh(
          new THREE.RingGeometry(1.45, 2.35, 48),
          new THREE.MeshBasicMaterial({ color: "#e6d4a8", side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = 26.73 * Math.PI / 180;
        ring.userData.pickIgnore = true;
        scene.add(ring);
      }
      var N = 160;
      var ogeo = new THREE.BufferGeometry();
      ogeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      var omat = new THREE.LineBasicMaterial({
        color: moon ? color : (id === "pluto" ? "#c8b48a" : "#3a4150"),
        transparent: true,
        opacity: id === "pluto" || moon ? 0.45 : 0.85
      });
      var loop = new THREE.LineLoop(ogeo, omat);
      scene.add(loop);
      var lab = null;
      if (labelRoot) {
        lab = document.createElement("button");
        lab.type = "button";
        lab.className = "ss-label";
        lab.textContent = moon ? moon.name : (id === "sun" ? "Sun" : id.charAt(0).toUpperCase() + id.slice(1));
        lab.addEventListener("click", function () { onPick(id); });
        labelRoot.appendChild(lab);
      }
      bodies[id] = { id: id, moon: moon || null, mesh: mesh, sel: sel, glow: glow, ring: ring, loop: loop, n: N, lab: lab };
      if (lab) labels[id] = lab;
    }

    makeBody("sun", null);
    ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"].forEach(function (id) {
      makeBody(id, null);
    });
    MOONS.forEach(function (m) { makeBody(m.id, m); });

    var starGeo = new THREE.BufferGeometry();
    var starPos = new Float32Array(420 * 3);
    var srand = 42;
    var si;
    for (si = 0; si < 420; si++) {
      srand = (srand * 1103515245 + 12345) & 0x7fffffff;
      var u = (srand % 10000) / 10000;
      srand = (srand * 1103515245 + 12345) & 0x7fffffff;
      var v = (srand % 10000) / 10000;
      srand = (srand * 1103515245 + 12345) & 0x7fffffff;
      var th = u * Math.PI * 2;
      var ph = Math.acos(2 * v - 1);
      var rr = 80 + (srand % 1000) / 1000 * 40;
      starPos[si * 3] = rr * Math.sin(ph) * Math.cos(th);
      starPos[si * 3 + 1] = rr * Math.cos(ph);
      starPos[si * 3 + 2] = rr * Math.sin(ph) * Math.sin(th);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.45 }));
    scene.add(stars);

    function applyLimits() {
      if (state.scale === "true") {
        controls.minDistance = 0.08;
        controls.maxDistance = 240;
        camera.near = 0.01;
        camera.far = 800;
      } else {
        controls.minDistance = 0.35;
        controls.maxDistance = 80;
        camera.near = 0.02;
        camera.far = 400;
      }
      camera.updateProjectionMatrix();
      stars.material.size = state.scale === "true" ? 0.15 : 0.055;
    }

    function paintTheme() {
      var base = cssColor("--base-2", "#14161c");
      var line = cssColor("--line", "#2c303a");
      accentHex = cssColor("--accent", "#c8b48a");
      var clear = 0x14161c;
      try { clear = new THREE.Color(base); } catch (err) { clear = 0x14161c; }
      renderer.setClearColor(clear, 1);
      Object.keys(bodies).forEach(function (id) {
        var b = bodies[id];
        try {
          if (b.sel) b.sel.material.color.set(accentHex);
          if (!b.moon && id !== "pluto") b.loop.material.color.set(line);
        } catch (err) { /* theme token was not a plain color */ }
      });
    }

    function rebuildGrid() {
      while (gridGroup.children.length) {
        var ch = gridGroup.children.pop();
        if (ch.geometry) ch.geometry.dispose();
      }
      if (gridGroup.userData.mat) {
        gridGroup.userData.mat.dispose();
        gridGroup.userData.mat = null;
      }
      var line = cssColor("--line", "#2c303a");
      var mat = new THREE.LineBasicMaterial({ color: line, transparent: true, opacity: 0.55 });
      gridGroup.userData.mat = mat;
      var rings = state.scale === "true" ? [0.5, 1, 2, 5, 10, 20, 30, 40] : [0.4, 0.7, 1, 1.5, 5, 10, 20, 30];
      var ri;
      for (ri = 0; ri < rings.length; ri++) {
        var rad = state.scale === "true" ? rings[ri] : compressR(rings[ri]);
        var pts = [];
        var k;
        for (k = 0; k < 96; k++) {
          var a = (k / 96) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad));
        }
        var g = new THREE.BufferGeometry().setFromPoints(pts);
        gridGroup.add(new THREE.LineLoop(g, mat));
      }
      var sp;
      for (sp = 0; sp < 12; sp++) {
        var ang = (sp / 12) * Math.PI * 2;
        var outer = state.scale === "true" ? 42 : compressR(40);
        var g2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(ang) * outer, 0, Math.sin(ang) * outer)
        ]);
        gridGroup.add(new THREE.Line(g2, mat));
      }
      gridGroup.visible = !!state.grid;
    }

    function writePlanetOrbit(b, el) {
      var arr = b.loop.geometry.attributes.position.array;
      var n = b.n;
      var i;
      for (i = 0; i < n; i++) {
        var E = (i / n) * Math.PI * 2;
        var p = orbitPoint(el, E);
        var w = toWorld(p.x, p.y, p.z, state.scale);
        arr[i * 3] = w.x;
        arr[i * 3 + 1] = w.y;
        arr[i * 3 + 2] = w.z;
      }
      b.loop.geometry.attributes.position.needsUpdate = true;
      b.loop.geometry.computeBoundingSphere();
    }

    function writeMoonOrbit(b, jd) {
      var moon = b.moon;
      var parent = helio(moon.parent, jd);
      var pw = toWorld(parent.x, parent.y, parent.z, state.scale);
      var pel = elements(moon.parent, jd) || { Omega: 0 };
      var arr = b.loop.geometry.attributes.position.array;
      var n = b.n;
      var boost = moonBoost();
      var i;
      for (i = 0; i < n; i++) {
        var nu = (i / n) * Math.PI * 2;
        var fake = {
          L0: nu * 180 / Math.PI,
          periodDays: 1e9,
          aKm: moon.aKm,
          iDeg: moon.iDeg,
          Omega: moon.Omega
        };
        /* nu is baked into L0 and days term ~ 0 because periodDays is huge and we pass jd = J2000 */
        var off = moonOffset(fake, pel, J2000);
        arr[i * 3] = pw.x + off.x * boost;
        arr[i * 3 + 1] = pw.y + off.z * boost;
        arr[i * 3 + 2] = pw.z + off.y * boost;
      }
      b.loop.geometry.attributes.position.needsUpdate = true;
      b.loop.geometry.computeBoundingSphere();
    }

    function visibleBody(id) {
      if (id === "pluto" && !state.pluto) return false;
      if (moonById(id) && !state.moons) return false;
      return true;
    }

    function layoutOne(id, jd) {
      var b = bodies[id];
      if (!b) return null;
      var show = visibleBody(id);
      b.mesh.visible = show;
      b.loop.visible = show && state.orbits && id !== "sun";
      if (b.glow) b.glow.visible = show;
      if (b.ring) b.ring.visible = show;
      if (!show) {
        b.sel.visible = false;
        if (b.lab) b.lab.classList.add("is-off");
        return null;
      }
      var pos = id === "sun" ? { h: helio("sun", jd), w: { x: 0, y: 0, z: 0 } } : worldOf(id, jd);
      if (!pos) return null;
      var vr = visualRadius(id, state.scale, b.moon);
      b.mesh.position.set(pos.w.x, pos.w.y, pos.w.z);
      b.mesh.scale.setScalar(vr);
      b.sel.position.copy(b.mesh.position);
      b.sel.scale.setScalar(vr);
      b.sel.visible = selected === id;
      if (b.glow) {
        b.glow.position.copy(b.mesh.position);
        b.glow.scale.setScalar(vr);
      }
      if (b.ring) {
        b.ring.position.copy(b.mesh.position);
        b.ring.scale.setScalar(vr);
      }
      if (id !== "sun" && state.orbits) {
        if (b.moon) writeMoonOrbit(b, jd);
        else {
          var el = elements(id, jd);
          if (el) writePlanetOrbit(b, el);
        }
      }
      return pos.w;
    }

    function layoutLabels(jd) {
      if (!labelRoot) return;
      var showLabels = !!state.labels;
      labelRoot.style.visibility = showLabels ? "visible" : "hidden";
      if (!showLabels || width < 2) return;
      camera.updateMatrixWorld();
      var placed = [];
      var ids = Object.keys(bodies);
      ids.forEach(function (id) {
        var b = bodies[id];
        var el = b.lab;
        if (!el) return;
        if (!visibleBody(id)) {
          el.classList.add("is-off");
          el.setAttribute("aria-hidden", "true");
          el.tabIndex = -1;
          return;
        }
        var v = b.mesh.position.clone().project(camera);
        var on = v.z < 1 && v.x > -1.2 && v.x < 1.2 && v.y > -1.2 && v.y < 1.2;
        var x = (v.x * 0.5 + 0.5) * width;
        var y = (-v.y * 0.5 + 0.5) * height;
        if (on) {
          var box = { x: x - 36, y: y - 22, w: 72, h: 16 };
          var blocked = placed.some(function (p) {
            return !(box.x + box.w < p.x || p.x + p.w < box.x || box.y + box.h < p.y || p.y + p.h < box.y);
          });
          if (blocked && id !== selected) on = false;
          else placed.push(box);
        }
        el.classList.toggle("is-off", !on);
        el.setAttribute("aria-hidden", on ? "false" : "true");
        el.tabIndex = on ? 0 : -1;
        el.setAttribute("aria-pressed", selected === id ? "true" : "false");
        if (on) {
          el.style.left = x + "px";
          el.style.top = y + "px";
        }
      });
    }

    function syncScene() {
      var jd = epochJD();
      Object.keys(bodies).forEach(function (id) { layoutOne(id, jd); });
      gridGroup.visible = !!state.grid;
      if (state.follow && bodies[state.follow] && visibleBody(state.follow)) {
        var p = bodies[state.follow].mesh.position;
        if (!followHold) {
          var dist = state.scale === "true"
            ? Math.max(0.45, Math.min(6, (helio(state.follow, jd).r || 1) * 0.18 + 0.35))
            : 3.1;
          controls.target.set(p.x, p.y, p.z);
          camera.position.set(p.x + dist * 0.55, p.y + dist * 0.42, p.z + dist * 0.72);
          followHold = p.clone();
        } else {
          var delta = p.clone().sub(followHold);
          camera.position.add(delta);
          controls.target.copy(p);
          followHold.copy(p);
        }
        controls.enableDamping = false;
      } else if (!reduceMotion) {
        controls.enableDamping = true;
      }
      layoutLabels(jd);
    }

    function zeroDeltas() {
      if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
      if (controls._panOffset) controls._panOffset.set(0, 0, 0);
      if (typeof controls._scale === "number") controls._scale = 1;
    }

    function presetVectors(name) {
      var far = state.scale === "true";
      if (name === "top") {
        return far
          ? { pos: [0.4, 78, 0.4], target: [0, 0, 0] }
          : { pos: [0.15, 34, 0.15], target: [0, 0, 0] };
      }
      if (name === "edge") {
        return far
          ? { pos: [78, 0.35, 0.2], target: [0, 0, 0] }
          : { pos: [36, 0.12, 0.15], target: [0, 0, 0] };
      }
      return far
        ? { pos: [38, 24, 34], target: [0, 0, 0] }
        : { pos: [16, 11, 14], target: [0, 0, 0] };
    }

    function goTo(name) {
      if (name === "follow") return;
      state.follow = null;
      followHold = null;
      var spec = presetVectors(name);
      var toP = new THREE.Vector3(spec.pos[0], spec.pos[1], spec.pos[2]);
      var toT = new THREE.Vector3(spec.target[0], spec.target[1], spec.target[2]);
      if (reduceMotion) {
        anim = null;
        camera.position.copy(toP);
        controls.target.copy(toT);
        zeroDeltas();
        controls.update();
        return;
      }
      anim = {
        t0: performance.now(),
        dur: 700,
        fromP: camera.position.clone(),
        fromT: controls.target.clone(),
        toP: toP,
        toT: toT
      };
    }

    function stepAnim() {
      if (!anim) return;
      var u = (performance.now() - anim.t0) / anim.dur;
      if (u >= 1) u = 1;
      var e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      camera.position.lerpVectors(anim.fromP, anim.toP, e);
      controls.target.lerpVectors(anim.fromT, anim.toT, e);
      zeroDeltas();
      controls.update();
      if (u >= 1) anim = null;
    }

    function resize() {
      var parent = canvas.parentElement || canvas;
      var w = parent.clientWidth || canvas.clientWidth;
      var h = parent.clientHeight || canvas.clientHeight;
      if (w < 2 || h < 2) return;
      width = w;
      height = h;
      var pr = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function rayPick(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      var ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      var ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      var meshes = [];
      Object.keys(bodies).forEach(function (id) {
        if (visibleBody(id)) meshes.push(bodies[id].mesh);
      });
      var hits = ray.intersectObjects(meshes, false);
      if (!hits.length) return null;
      return hits[0].object.userData.id || null;
    }

    function frame() {
      if (!running) return;
      frameId = requestAnimationFrame(frame);
      stepAnim();
      syncScene();
      if (!anim) controls.update();
      renderer.render(scene, camera);
      if (!readySent) {
        readySent = true;
        onReady();
      }
    }

    function setEnabled(on) {
      running = !!on;
      controls.enabled = running;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      if (running) {
        resize();
        paintTheme();
        frame();
      }
    }

    function setState(next) {
      if (!next) return;
      var scaleWas = state.scale;
      ["pluto", "moons", "orbits", "labels", "grid", "scale", "follow"].forEach(function (k) {
        if (next[k] !== undefined) state[k] = next[k];
      });
      if (state.follow && !visibleBody(state.follow)) state.follow = null;
      if (!state.follow) followHold = null;
      if (state.scale !== scaleWas) {
        followHold = null;
        applyLimits();
        rebuildGrid();
        if (!state.follow) goTo("reset");
      }
      gridGroup.visible = !!state.grid;
    }

    function select(id) {
      selected = id || "sun";
      if (state.follow) {
        followHold = null;
        if (selected !== "sun") state.follow = selected;
      }
    }

    controls.addEventListener("start", function () {
      anim = null;
      state.follow = null;
      followHold = null;
      onUserMove();
    });

    var pointers = {};
    var activePointers = 0;
    canvas.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
    canvas.addEventListener("pointerdown", function (ev) {
      pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY, b: ev.button };
      activePointers++;
      canvas.classList.add("is-dragging");
    });
    function endPointer(ev) {
      var start = pointers[ev.pointerId];
      if (start) {
        delete pointers[ev.pointerId];
        activePointers = Math.max(0, activePointers - 1);
      }
      if (!activePointers) canvas.classList.remove("is-dragging");
      if (!start || start.b !== 0 || activePointers) return;
      var dx = ev.clientX - start.x;
      var dy = ev.clientY - start.y;
      if (dx * dx + dy * dy > 64) return;
      var id = rayPick(ev.clientX, ev.clientY);
      if (id) onPick(id);
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", function (ev) {
      if (pointers[ev.pointerId]) {
        delete pointers[ev.pointerId];
        activePointers = Math.max(0, activePointers - 1);
      }
      if (!activePointers) canvas.classList.remove("is-dragging");
    });
    canvas.addEventListener("pointermove", function (ev) {
      if (activePointers) return;
      var id = rayPick(ev.clientX, ev.clientY);
      canvas.style.cursor = id ? "pointer" : "grab";
    });
    canvas.addEventListener("keydown", function (ev) {
      if (!running) return;
      var key = ev.key;
      if (key === "ArrowLeft") controls.rotateLeft(0.08);
      else if (key === "ArrowRight") controls.rotateLeft(-0.08);
      else if (key === "ArrowUp") controls.rotateUp(0.06);
      else if (key === "ArrowDown") controls.rotateUp(-0.06);
      else if (key === "+" || key === "=") controls.dollyIn(1.12);
      else if (key === "-" || key === "_") controls.dollyOut(1.12);
      else if (key === "0" || key === "Home") {
        if (opts.onReset) opts.onReset();
        else goTo("reset");
      } else return;
      ev.preventDefault();
      state.follow = null;
      followHold = null;
      onUserMove();
    });
    canvas.addEventListener("webglcontextlost", function (ev) {
      ev.preventDefault();
      setEnabled(false);
      onContextLost();
    }, false);

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(function () { if (running) resize(); });
      ro.observe(canvas.parentElement || canvas);
    } else {
      window.addEventListener("resize", function () { if (running) resize(); });
    }
    if (typeof MutationObserver === "function") {
      new MutationObserver(function () { paintTheme(); rebuildGrid(); }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
      });
    }

    applyLimits();
    paintTheme();
    rebuildGrid();
    var opening = presetVectors("reset");
    camera.position.set(opening.pos[0], opening.pos[1], opening.pos[2]);
    controls.target.set(0, 0, 0);
    zeroDeltas();
    controls.update();
    syncScene();

    return {
      setEnabled: setEnabled,
      resize: resize,
      setState: setState,
      select: select,
      goTo: goTo,
      moon: moonRecord
    };
  }

  root.SolarSystem3D = {
    create: create,
    helio: helio,
    elements: elements,
    moon: moonRecord,
    moons: MOONS
  };
})(typeof window !== "undefined" ? window : globalThis);
