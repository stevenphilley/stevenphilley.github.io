/*! mw-galaxy-3d.js — artist-style 3D Milky Way for the astronomy desk.
 *  Units are kiloparsecs. Galactic plane is XZ, Y is toward the north galactic pole.
 *  The Sun sits on +X. beta = 0 points at the Sun and increases with galactic longitude.
 *  Star counts stay in the tens of thousands (THREE.Points). Markers are enlarged.
 *
 *  Scale, not a catalog:
 *  - R0 = 8.2 kpc, z_sun = 0.025 kpc (Bland-Hawthorn & Gerhard 2016).
 *    GRAVITY Collaboration 2019 measures 8.178 kpc. 8.2 kpc is about 27,000 ly;
 *    classroom pages often round the same distance to 26,000 ly.
 *  - Thin disc: scale length 2.6 kpc, scale height 0.30 kpc, drawn to 15.3 kpc
 *    radius so the diameter is about 100,000 ly (NASA).
 *  - Thick disc scale height 0.90 kpc.
 *  - Bar half-length 5 kpc at 30 degrees, inside the 28–33 degree range
 *    (Wegg, Gerhard & Portail 2015).
 *  - Arm ridges: Reid et al. 2019 (BeSSeL) log-spiral kink fits. Brighter
 *    particles lie on the published azimuth range; fainter ones extend that pitch.
 */
(function (root) {
  "use strict";

  var R_SUN = 8.2;
  var Z_SUN = 0.025;
  var R_DISC = 15.3;
  var RD_THIN = 2.6;
  var HZ_THIN = 0.3;
  var RD_THICK = 3.6;
  var HZ_THICK = 0.9;
  var BAR_HALF = 5;
  var BAR_ANG = 30 * Math.PI / 180;

  var ARMS = [
    { id: "scutum", kink: 23, rKink: 4.91, psiLt: 14.1, psiGt: 12.1, pub0: 0, pub1: 104, ext0: -35, ext1: 155, width: 0.23, hz: 0.05, n: 1500, hue: 38 },
    { id: "sgr", kink: 24, rKink: 6.04, psiLt: 17.1, psiGt: 1.0, pub0: 2, pub1: 97, ext0: -40, ext1: 140, width: 0.27, hz: 0.05, n: 1400, hue: -16 },
    { id: "orion", kink: 9, rKink: 8.26, psiLt: 11.4, psiGt: 11.4, pub0: -8, pub1: 34, ext0: -14, ext1: 42, width: 0.31, hz: 0.04, n: 620, hue: 0 },
    { id: "perseus", kink: 40, rKink: 8.87, psiLt: 10.3, psiGt: 8.7, pub0: -23, pub1: 115, ext0: -45, ext1: 165, width: 0.35, hz: 0.06, n: 1500, hue: 18 },
    { id: "norma", kink: 18, rKink: 4.46, psiLt: -1.0, psiGt: 19.5, pub0: 5, pub1: 54, ext0: -8, ext1: 78, width: 0.14, hz: 0.04, n: 780, hue: -34 },
    { id: "outer", kink: 18, rKink: 12.24, psiLt: 3.0, psiGt: 9.4, pub0: -16, pub1: 71, ext0: -36, ext1: 120, width: 0.65, hz: 0.08, n: 980, hue: 8 }
  ];

  var VIEWS = {
    reset: { pos: [26, 18, 24], target: [0, 0, 0] },
    face: { pos: [0.4, 44, 2.4], target: [0, 0, 0] },
    edge: { pos: [0.35, 0.04, 42], target: [0, 0, 0] },
    sun: { pos: [11.4, 0.42, 0.35], target: [0, 0, 0] }
  };

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randn(rng) {
    var u = Math.max(1e-8, rng());
    var v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function deg(d) { return d * Math.PI / 180; }

  function armRadius(arm, betaRad) {
    var bk = deg(arm.kink);
    var psi = deg(betaRad < bk ? arm.psiLt : arm.psiGt);
    var tanP = Math.tan(psi);
    return arm.rKink * Math.exp(-(betaRad - bk) * tanP);
  }

  function sampleExpR(rng, scale, rMax) {
    var peak = scale * Math.exp(-1);
    var guard = 0;
    while (guard++ < 40) {
      var R = rng() * rMax;
      var accept = (R * Math.exp(-R / scale)) / peak;
      if (rng() < accept) return R;
    }
    return scale;
  }

  function expZ(rng, hz) {
    var z = (rng() < 0.5 ? -1 : 1) * hz * -Math.log(Math.max(1e-6, rng()));
    return clamp(z, -4 * hz, 4 * hz);
  }

  function readColor(name, fallback) {
    var THREE = root.THREE;
    var raw = "";
    try { raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
    catch (err) { raw = ""; }
    var c = new THREE.Color();
    try { c.set(raw || fallback); }
    catch (err) { c.set(fallback); }
    return c;
  }

  function shiftHue(color, degrees) {
    var hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    var c = new root.THREE.Color();
    var h = hsl.h + degrees / 360;
    h = h - Math.floor(h);
    c.setHSL(h, clamp(hsl.s * 0.92 + 0.04, 0, 1), clamp(Math.max(hsl.l, 0.42), 0.28, 0.78));
    return c;
  }

  function palette() {
    var THREE = root.THREE;
    var accent = readColor("--accent", "#c8b48a");
    var accent2 = readColor("--accent-2", "#d98b97");
    var ink = readColor("--ink", "#f4efe6");
    var soft = readColor("--ink-soft", "#c8c2b8");
    var base = readColor("--base", "#140828");
    if (ink.r + ink.g + ink.b < 1.2) ink = new THREE.Color("#f4efe6");
    if (soft.r + soft.g + soft.b < 0.85) soft = new THREE.Color("#b7b1a8");
    var clear = base.clone();
    var hsl = { h: 0, s: 0, l: 0 };
    clear.getHSL(hsl);
    if (hsl.l > 0.32) clear.set("#101218");
    else clear.multiplyScalar(0.42);
    return { accent: accent, accent2: accent2, ink: ink, soft: soft, clear: clear };
  }

  function starMaterial(THREE) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: 1 },
        uHot: { value: 0 },
        uDim: { value: 1 }
      },
      vertexShader: [
        "attribute float aSize;",
        "attribute float aAlpha;",
        "attribute vec3 aColor;",
        "uniform float uPixelRatio;",
        "uniform float uHot;",
        "uniform float uDim;",
        "varying vec3 vColor;",
        "varying float vAlpha;",
        "void main() {",
        "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  float dist = max(0.15, -mv.z);",
        "  float boost = mix(1.0, 1.9, uHot);",
        "  float dim = mix(0.45, 1.0, clamp(uDim, 0.0, 1.0));",
        "  gl_PointSize = clamp(aSize * boost * dim * (12.0 / dist), 1.15, 11.0) * uPixelRatio;",
        "  vColor = mix(aColor, vec3(1.0), uHot * 0.38);",
        "  vAlpha = aAlpha * mix(0.35, 1.0, dim) * (1.0 + uHot * 0.65);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "varying vec3 vColor;",
        "varying float vAlpha;",
        "void main() {",
        "  vec2 p = gl_PointCoord - vec2(0.5);",
        "  float d = length(p);",
        "  if (d > 0.5) discard;",
        "  float glow = pow(smoothstep(0.5, 0.0, d), 1.25);",
        "  gl_FragColor = vec4(vColor, glow * vAlpha);",
        "}"
      ].join("\n")
    });
  }

  function bodyMaterial(THREE) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      uniforms: {
        uColor: { value: new THREE.Color("#ffffff") },
        uAlpha: { value: 0.1 },
        uHot: { value: 0 },
        uDim: { value: 1 }
      },
      vertexShader: [
        "varying vec3 vLocal;",
        "void main() {",
        "  vLocal = position;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "varying vec3 vLocal;",
        "uniform vec3 uColor;",
        "uniform float uAlpha;",
        "uniform float uHot;",
        "uniform float uDim;",
        "void main() {",
        "  float r = length(vLocal.xz);",
        "  float disc = smoothstep(1.02, 0.08, r);",
        "  float limb = pow(clamp(r, 0.0, 1.0), 1.6);",
        "  float a = uAlpha * uDim * disc * (0.42 + 0.58 * (1.0 - limb));",
        "  a *= 1.0 + uHot * 0.85;",
        "  if (a < 0.003) discard;",
        "  gl_FragColor = vec4(uColor, a);",
        "}"
      ].join("\n")
    });
  }

  function makeLine(THREE, points, color, opacity) {
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      depthTest: false
    });
    var line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    line.renderOrder = 3;
    return line;
  }

  function circlePoints(cx, cy, cz, radius, segments, yLift) {
    var pts = [];
    var i;
    for (i = 0; i <= segments; i++) {
      var a = (i / segments) * Math.PI * 2;
      pts.push(new root.THREE.Vector3(cx + Math.cos(a) * radius, cy + (yLift || 0), cz + Math.sin(a) * radius));
    }
    return pts;
  }

  function create(opts) {
    var THREE = root.THREE;
    var OrbitControls = root.OrbitControls;
    if (!THREE || !OrbitControls || !opts || !opts.canvas) return null;

    var canvas = opts.canvas;
    var labelRoot = opts.labels;
    var onPick = opts.onPick || function () {};
    var onUserMove = opts.onUserMove || function () {};
    var onReady = opts.onReady || function () {};
    var onContextLost = opts.onContextLost || function () {};
    var names = opts.names || {};

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
      });
    } catch (err) {
      return null;
    }
    if (!renderer.getContext()) return null;
    renderer.toneMapping = THREE.NoToneMapping;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.02, 420);
    var controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.zoomToCursor = true;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.85;
    controls.panSpeed = 0.9;
    controls.zoomSpeed = 1.05;
    controls.minDistance = 0.12;
    controls.maxDistance = 92;
    controls.minPolarAngle = 0.04;
    controls.maxPolarAngle = Math.PI - 0.04;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    var pal = palette();
    renderer.setClearColor(pal.clear, 1);

    var clouds = [];
    var bodies = [];
    var spines = {};
    var markers = [];
    var labelButtons = [];
    var pickSets = [];
    var selected = null;
    var running = false;
    var frameId = 0;
    var readySent = false;
    var width = 1;
    var height = 1;
    var anim = null;
    var reduceMotion = false;
    try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (err) { reduceMotion = false; }

    var vTmp = new THREE.Vector3();
    var vCam = new THREE.Vector3();
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();
    var hitPoint = new THREE.Vector3();

    function addCloud(id, kind, hue, mixAmt, builder) {
      var count = builder.n;
      if (!count) return null;
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(builder.pos), 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(Float32Array.from(builder.size), 1));
      geo.setAttribute("aAlpha", new THREE.BufferAttribute(Float32Array.from(builder.alpha), 1));
      geo.computeBoundingSphere();
      var mat = starMaterial(THREE);
      mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      var pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      pts.renderOrder = kind === "marker" ? 4 : 2;
      pts.userData = {
        id: id,
        kind: kind,
        hue: hue,
        mix: mixAmt,
        jitter: Float32Array.from(builder.jitter)
      };
      scene.add(pts);
      clouds.push(pts);
      return pts;
    }

    function Builder() {
      this.pos = [];
      this.size = [];
      this.alpha = [];
      this.jitter = [];
      this.n = 0;
    }
    Builder.prototype.push = function (x, y, z, size, alpha, jitter) {
      this.pos.push(x, y, z);
      this.size.push(size);
      this.alpha.push(alpha);
      this.jitter.push(jitter);
      this.n++;
    };

    var rng = mulberry32(0x4D57A11);

    var thin = new Builder();
    var i;
    for (i = 0; i < 7600; i++) {
      var R = sampleExpR(rng, RD_THIN, R_DISC);
      var th = rng() * Math.PI * 2;
      var fade = clamp((R_DISC - R) / 2.2, 0, 1);
      thin.push(Math.cos(th) * R, expZ(rng, HZ_THIN), Math.sin(th) * R, 1.55 + rng() * 0.9, (0.22 + rng() * 0.28) * (0.45 + 0.55 * fade), 0.72 + rng() * 0.45);
    }
    addCloud("disc", "disc", 8, 0.28, thin);

    var thick = new Builder();
    for (i = 0; i < 2400; i++) {
      R = sampleExpR(rng, RD_THICK, R_DISC + 1);
      th = rng() * Math.PI * 2;
      thick.push(Math.cos(th) * R, expZ(rng, HZ_THICK), Math.sin(th) * R, 1.7 + rng() * 0.8, 0.08 + rng() * 0.12, 0.65 + rng() * 0.4);
    }
    addCloud("thick", "thick", 20, 0.12, thick);

    var bulgeB = new Builder();
    var bulgePick = [];
    for (i = 0; i < 1600; i++) {
      var rad = Math.pow(rng(), 0.62) * 2.15;
      var u = rng();
      var v = rng();
      var phi = Math.acos(2 * v - 1);
      var ct = Math.cos(phi);
      var st = Math.sin(phi);
      var az = u * Math.PI * 2;
      var bx = rad * st * Math.cos(az) * 1.05;
      var by = rad * ct * 0.72;
      var bz = rad * st * Math.sin(az) * 1.05;
      bulgeB.push(bx, by, bz, 1.7 + rng() * 1.1, 0.28 + rng() * 0.35, 0.75 + rng() * 0.4);
      if (i % 28 === 0) bulgePick.push(bx, by, bz);
    }
    addCloud("bulge", "feature", 6, 0.55, bulgeB);
    pickSets.push({ id: "bulge", pts: bulgePick, thresh: 1.15 });

    var barB = new Builder();
    var barPick = [];
    var barCa = Math.cos(BAR_ANG);
    var barSa = Math.sin(BAR_ANG);
    for (i = 0; i < 1400; i++) {
      var along = randn(rng) * 1.85;
      if (Math.abs(along) > BAR_HALF) along = clamp(along, -BAR_HALF, BAR_HALF);
      var across = randn(rng) * 0.42;
      var vert = randn(rng) * 0.16;
      var wx = along * barCa - across * barSa;
      var wz = along * barSa + across * barCa;
      barB.push(wx, vert, wz, 1.6 + rng() * 0.9, 0.32 + rng() * 0.3, 0.8 + rng() * 0.35);
      if (i % 24 === 0) barPick.push(wx, vert, wz);
    }
    addCloud("bar", "feature", -8, 0.62, barB);
    pickSets.push({ id: "bar", pts: barPick, thresh: 1.05 });

    var haloB = new Builder();
    for (i = 0; i < 2000; i++) {
      var guard = 0;
      var hr = 2;
      while (guard++ < 30) {
        hr = Math.exp(Math.log(1.6) + rng() * Math.log(26 / 1.6));
        if (rng() < Math.sqrt(1.6 / hr)) break;
      }
      u = rng();
      v = rng();
      phi = Math.acos(2 * v - 1);
      az = u * Math.PI * 2;
      var hx = hr * Math.sin(phi) * Math.cos(az);
      var hy = hr * Math.cos(phi);
      var hz = hr * Math.sin(phi) * Math.sin(az);
      haloB.push(hx, hy, hz, 2.1 + rng() * 1.2, 0.045 + rng() * 0.07, 0.55 + rng() * 0.4);
    }
    addCloud("halo", "halo", 24, 0.05, haloB);

    function ridgePoint(arm, beta) {
      var R = armRadius(arm, beta);
      return { x: Math.cos(beta) * R, z: Math.sin(beta) * R, R: R };
    }

    ARMS.forEach(function (arm) {
      var b = new Builder();
      var pick = [];
      var spine = [];
      var steps = 90;
      var s;
      for (s = 0; s <= steps; s++) {
        var beta = deg(arm.ext0 + (arm.ext1 - arm.ext0) * (s / steps));
        var p = ridgePoint(arm, beta);
        if (p.R < 2.2 || p.R > R_DISC + 1.2) continue;
        spine.push(new THREE.Vector3(p.x, 0.03, p.z));
        if (s % 2 === 0) pick.push(p.x, 0.05, p.z);
      }
      var line = makeLine(THREE, spine, pal.accent, 0.95);
      line.visible = false;
      line.userData.id = arm.id;
      scene.add(line);
      spines[arm.id] = line;

      var placed = 0;
      var tries = 0;
      while (placed < arm.n && tries < arm.n * 8) {
        tries++;
        var inPub = rng() < 0.72;
        var b0 = inPub ? arm.pub0 : arm.ext0;
        var b1 = inPub ? arm.pub1 : arm.ext1;
        beta = deg(b0 + rng() * (b1 - b0));
        var dBeta = 0.02;
        var p1 = ridgePoint(arm, beta);
        var p2 = ridgePoint(arm, beta + dBeta);
        if (p1.R < 2.3 || p1.R > R_DISC + 0.8) continue;
        var tx = p2.x - p1.x;
        var tz = p2.z - p1.z;
        var tl = Math.hypot(tx, tz) || 1;
        var nx = -tz / tl;
        var nz = tx / tl;
        var off = randn(rng) * arm.width;
        var y = clamp(randn(rng) * arm.hz, -3 * arm.hz, 3 * arm.hz);
        var pub = beta >= deg(arm.pub0) && beta <= deg(arm.pub1);
        b.push(p1.x + nx * off, y, p1.z + nz * off, (pub ? 2.4 : 1.7) + rng() * 1.1, (pub ? 0.55 : 0.22) + rng() * (pub ? 0.4 : 0.16), 0.78 + rng() * 0.4);
        placed++;
      }
      addCloud(arm.id, "arm", arm.hue, 0.84, b);
      pickSets.push({ id: arm.id, pts: pick, thresh: 1 });
    });

    var sunB = new Builder();
    sunB.push(R_SUN, Z_SUN, 0, 6.4, 1, 1);
    addCloud("sun", "marker", 0, 0.15, sunB);
    var sgraB = new Builder();
    sgraB.push(0, 0, 0, 5.6, 1, 1);
    addCloud("sgra", "marker", 0, 1, sgraB);

    var sky = new Builder();
    for (i = 0; i < 420; i++) {
      var sr = 70 + rng() * 40;
      u = rng();
      v = rng();
      phi = Math.acos(2 * v - 1);
      az = u * Math.PI * 2;
      sky.push(sr * Math.sin(phi) * Math.cos(az), sr * Math.cos(phi), sr * Math.sin(phi) * Math.sin(az), 1.2, 0.18 + rng() * 0.2, 0.7 + rng() * 0.5);
    }
    addCloud("sky", "sky", 0, 0.02, sky);

    function addBody(id, scale, alpha, rotY) {
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 40), bodyMaterial(THREE));
      mesh.scale.set(scale[0], scale[1], scale[2]);
      if (rotY) mesh.rotation.y = rotY;
      mesh.userData = { id: id, kind: id === "disc" ? "discBody" : "feature", alpha: alpha };
      mesh.material.uniforms.uAlpha.value = alpha;
      mesh.renderOrder = 1;
      mesh.frustumCulled = false;
      scene.add(mesh);
      bodies.push(mesh);
      return mesh;
    }
    addBody("disc", [R_DISC, 0.52, R_DISC], 0.085, 0);
    addBody("bulge", [2.05, 1.05, 2.05], 0.13, 0);
    addBody("bar", [BAR_HALF, 0.28, 1.15], 0.11, -BAR_ANG);

    var solar = makeLine(THREE, circlePoints(0, 0.02, 0, R_SUN, 160, 0), pal.soft, 0.28);
    var rim = makeLine(THREE, circlePoints(0, 0.02, 0, R_DISC, 180, 0), pal.soft, 0.16);
    scene.add(solar);
    scene.add(rim);
    markers.push(solar, rim);

    var sunRing = makeLine(THREE, circlePoints(R_SUN, Z_SUN, 0, 0.28, 48, 0), pal.ink, 0.9);
    var sunStem = makeLine(THREE, [
      new THREE.Vector3(R_SUN, 0, 0),
      new THREE.Vector3(R_SUN, Z_SUN, 0)
    ], pal.accent, 0.85);
    var sgraRing = makeLine(THREE, circlePoints(0, 0.02, 0, 0.38, 40, 0), pal.accent, 0.9);
    scene.add(sunRing);
    scene.add(sunStem);
    scene.add(sgraRing);
    sunRing.userData.markerFor = "sun";
    sunStem.userData.markerFor = "sun";
    sgraRing.userData.markerFor = "sgra";

    var barSpine = makeLine(THREE, [
      new THREE.Vector3(-BAR_HALF * barCa, 0.04, -BAR_HALF * barSa),
      new THREE.Vector3(BAR_HALF * barCa, 0.04, BAR_HALF * barSa)
    ], pal.accent, 0.95);
    barSpine.visible = false;
    spines.bar = barSpine;
    scene.add(barSpine);
    var bulgeRing = makeLine(THREE, circlePoints(0, 0.05, 0, 1.7, 64, 0), pal.accent, 0.9);
    bulgeRing.visible = false;
    spines.bulge = bulgeRing;
    scene.add(bulgeRing);
    var haloRing = makeLine(THREE, circlePoints(0, 0, 0, 18, 96, 0), pal.accent, 0.55);
    haloRing.visible = false;
    spines.halo = haloRing;
    scene.add(haloRing);

    var sunPick = [R_SUN, Z_SUN, 0];
    var sk;
    for (sk = 0; sk < 8; sk++) {
      var sa = (sk / 8) * Math.PI * 2;
      sunPick.push(R_SUN + Math.cos(sa) * 0.28, Z_SUN, Math.sin(sa) * 0.28);
    }
    pickSets.push({ id: "sun", pts: sunPick, thresh: 0.9 });
    pickSets.push({ id: "sgra", pts: [0, 0.02, 0], thresh: 0.62 });

    var ANCHORS = {
      orion: [8.15, 0.7, 1.15],
      perseus: [7.2, 0.85, 6.4],
      sgr: [5.4, 0.75, 3.6],
      scutum: [3.6, 0.8, 3.2],
      norma: [2.2, 0.7, 3.4],
      outer: [10.5, 0.9, 6.8],
      bar: [BAR_HALF * 0.72 * barCa, 0.55, BAR_HALF * 0.72 * barSa],
      bulge: [1.5, 1.45, 1.2],
      sgra: [0.15, 0.85, -0.9],
      sun: [R_SUN, 0.62, 0.15],
      halo: [0, 7.5, 12]
    };
    var PRIORITY = {
      halo: 10, bulge: 30, bar: 34, outer: 40, norma: 44, scutum: 48,
      sgr: 52, perseus: 56, orion: 70, sgra: 80, sun: 86
    };

    function ensureLabel(id) {
      if (!labelRoot) return null;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mw-label is-off";
      btn.dataset.feature = id;
      btn.textContent = names[id] || id;
      btn.setAttribute("aria-label", "Show " + (names[id] || id) + " on the map");
      btn.setAttribute("aria-pressed", "false");
      btn.tabIndex = -1;
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        onPick(id);
      });
      labelRoot.appendChild(btn);
      labelButtons.push({ id: id, el: btn, anchor: new THREE.Vector3(ANCHORS[id][0], ANCHORS[id][1], ANCHORS[id][2]) });
      return btn;
    }
    Object.keys(ANCHORS).forEach(ensureLabel);

    function paintTheme() {
      pal = palette();
      renderer.setClearColor(pal.clear, 1);
      clouds.forEach(function (pts) {
        var kind = pts.userData.kind;
        var base;
        if (kind === "marker" && pts.userData.id === "sun") base = pal.ink.clone();
        else if (kind === "marker" && pts.userData.id === "sgra") base = pal.accent.clone();
        else if (kind === "sky") base = pal.soft.clone();
        else if (kind === "halo" || kind === "thick") base = pal.soft.clone().lerp(pal.ink, 0.35);
        else if (kind === "disc") base = pal.ink.clone().lerp(pal.accent, 0.22);
        else base = shiftHue(pal.accent, pts.userData.hue || 0).lerp(pal.ink, 1 - (pts.userData.mix || 0.5));
        var arr = pts.geometry.attributes.aColor.array;
        var jitter = pts.userData.jitter;
        var n = jitter.length;
        var k;
        for (k = 0; k < n; k++) {
          var j = jitter[k];
          arr[k * 3] = clamp(base.r * j, 0, 1);
          arr[k * 3 + 1] = clamp(base.g * j, 0, 1);
          arr[k * 3 + 2] = clamp(base.b * j, 0, 1);
        }
        pts.geometry.attributes.aColor.needsUpdate = true;
      });
      bodies.forEach(function (mesh) {
        var col = mesh.userData.id === "bulge" || mesh.userData.id === "bar" ? pal.accent.clone().lerp(pal.ink, 0.25) : pal.ink.clone().lerp(pal.accent, 0.35);
        mesh.material.uniforms.uColor.value.copy(col);
      });
      solar.material.color.copy(pal.soft);
      rim.material.color.copy(pal.soft);
      sunRing.material.color.copy(pal.ink);
      sunStem.material.color.copy(pal.accent);
      sgraRing.material.color.copy(pal.accent);
      Object.keys(spines).forEach(function (key) {
        spines[key].material.color.copy(pal.accent);
      });
    }
    paintTheme();

    function dimFor(pts) {
      if (!selected) return 1;
      if (pts.userData.id === selected) return 1;
      var kind = pts.userData.kind;
      if (kind === "marker") return 0.92;
      if (kind === "sky") return 1;
      if (kind === "disc" || kind === "thick" || kind === "halo") return 0.7;
      return 0.32;
    }

    function applyHighlight() {
      clouds.forEach(function (pts) {
        var hot = selected && pts.userData.id === selected ? 1 : 0;
        pts.material.uniforms.uHot.value = hot;
        pts.material.uniforms.uDim.value = dimFor(pts);
      });
      bodies.forEach(function (mesh) {
        var hot = selected && mesh.userData.id === selected ? 1 : 0;
        var dim = 1;
        if (selected && !hot) {
          dim = mesh.userData.id === "disc" ? 0.62 : 0.4;
        }
        mesh.material.uniforms.uHot.value = hot;
        mesh.material.uniforms.uDim.value = dim;
      });
      Object.keys(spines).forEach(function (key) {
        spines[key].visible = key === selected;
      });
      var sunOn = !selected || selected === "sun";
      var coreOn = !selected || selected === "sgra";
      sunRing.material.opacity = sunOn ? 0.95 : 0.45;
      sunStem.material.opacity = sunOn ? 0.9 : 0.35;
      sgraRing.material.opacity = coreOn ? 0.95 : 0.4;
      labelButtons.forEach(function (item) {
        var on = item.id === selected;
        item.el.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function highlight(id) {
      selected = id || null;
      applyHighlight();
    }

    function zeroDeltas() {
      if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
      if (controls._panOffset) controls._panOffset.set(0, 0, 0);
      if (typeof controls._scale === "number") controls._scale = 1;
    }

    function goTo(name) {
      var spec = VIEWS[name] || VIEWS.reset;
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
        dur: 820,
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
      clouds.forEach(function (pts) {
        pts.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      });
    }

    function layoutLabels() {
      if (!labelRoot || width < 2) return;
      camera.getWorldDirection(vCam);
      var ranked = labelButtons.map(function (item) {
        vTmp.copy(item.anchor).sub(camera.position);
        var facing = vTmp.dot(vCam) > 0;
        var projected = item.anchor.clone().project(camera);
        var x = (projected.x * 0.5 + 0.5) * width;
        var y = (-projected.y * 0.5 + 0.5) * height;
        var pri = (PRIORITY[item.id] || 20) + (item.id === selected ? 1000 : 0);
        return { item: item, x: x, y: y, facing: facing, pri: pri, z: projected.z };
      });
      ranked.sort(function (a, b) { return b.pri - a.pri; });
      var placed = [];
      var narrow = width < 520;
      ranked.forEach(function (row) {
        var el = row.item.el;
        var onScreen = row.facing && row.z < 1 && row.x > -40 && row.y > -20 && row.x < width + 40 && row.y < height + 20;
        var show = onScreen;
        if (show && narrow && row.item.id !== selected && row.item.id !== "sun" && row.item.id !== "sgra" && row.pri < 70) {
          show = false;
        }
        if (show) {
          var box = { x: row.x - 46, y: row.y - 28, w: 92, h: 22 };
          var blocked = placed.some(function (p) {
            return !(box.x + box.w < p.x || p.x + p.w < box.x || box.y + box.h < p.y || p.y + p.h < box.y);
          });
          if (blocked && row.item.id !== selected) show = false;
          else placed.push(box);
        }
        el.classList.toggle("is-off", !show);
        el.setAttribute("aria-hidden", show ? "false" : "true");
        el.tabIndex = show ? 0 : -1;
        if (show) {
          el.style.left = row.x + "px";
          el.style.top = row.y + "px";
        }
      });
    }

    function pick(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      var camDist = Math.max(0.4, camera.position.distanceTo(controls.target));
      var best = null;
      var bestD = Infinity;
      pickSets.forEach(function (set) {
        var limit = Math.max(0.22, camDist * 0.03) * (set.thresh || 1);
        var pts = set.pts;
        var k;
        for (k = 0; k < pts.length; k += 3) {
          hitPoint.set(pts[k], pts[k + 1], pts[k + 2]);
          var d = raycaster.ray.distanceToPoint(hitPoint);
          if (d < limit && d < bestD) {
            bestD = d;
            best = set.id;
          }
        }
      });
      return best;
    }

    function frame() {
      if (!running) return;
      frameId = requestAnimationFrame(frame);
      stepAnim();
      if (!anim) controls.update();
      layoutLabels();
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
        frame();
      }
    }

    controls.addEventListener("start", function () {
      anim = null;
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
      var id = pick(ev.clientX, ev.clientY);
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
      var id = pick(ev.clientX, ev.clientY);
      canvas.style.cursor = id ? "pointer" : "grab";
    });
    canvas.addEventListener("keydown", function (ev) {
      if (!running) return;
      var key = ev.key;
      if (key === "ArrowLeft") controls.rotateLeft(0.09);
      else if (key === "ArrowRight") controls.rotateLeft(-0.09);
      else if (key === "ArrowUp") controls.rotateUp(0.07);
      else if (key === "ArrowDown") controls.rotateUp(-0.07);
      else if (key === "+" || key === "=") controls.dollyIn(1.15);
      else if (key === "-" || key === "_") controls.dollyOut(1.15);
      else if (key === "0" || key === "Home") {
        if (opts.onReset) opts.onReset();
        else goTo("reset");
      } else return;
      ev.preventDefault();
    });
    canvas.addEventListener("webglcontextlost", function (ev) {
      ev.preventDefault();
      setEnabled(false);
      onContextLost();
    }, false);

    var resizeObserver = null;
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(function () { if (running) resize(); });
      resizeObserver.observe(canvas.parentElement || canvas);
    } else {
      window.addEventListener("resize", function () { if (running) resize(); });
    }

    var themeObserver = null;
    if (typeof MutationObserver === "function") {
      themeObserver = new MutationObserver(function () { paintTheme(); });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    camera.position.set(VIEWS.reset.pos[0], VIEWS.reset.pos[1], VIEWS.reset.pos[2]);
    controls.target.set(0, 0, 0);
    zeroDeltas();
    controls.update();

    return {
      setEnabled: setEnabled,
      resize: resize,
      highlight: highlight,
      goTo: goTo,
      pick: pick,
      controls: controls,
      dom: canvas
    };
  }

  root.MwGalaxy3D = {
    create: create,
    armRadius: armRadius,
    ARMS: ARMS,
    R_SUN: R_SUN,
    Z_SUN: Z_SUN
  };
})(typeof window !== "undefined" ? window : globalThis);
