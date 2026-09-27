/*! nms-galaxy-3d.js — true 3D Euclid disk for the base map.
 *  Portal voxels are world units: X, Z on the disk, Y up. The core is the origin.
 *  Markers are THREE.Points. Nothing is uploaded.
 */
(function (root) {
  "use strict";

  var SHAPES = ["circle", "ring", "diamond", "star", "square", "station", "cross", "brackets", "halo"];

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

  function makeShapeTexture(THREE, kind) {
    var s = 64;
    var canvas = document.createElement("canvas");
    canvas.width = s;
    canvas.height = s;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    var cx = s / 2;
    var cy = s / 2;
    if (kind === "circle") {
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "ring") {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === "diamond") {
      ctx.beginPath();
      ctx.moveTo(cx, 8);
      ctx.lineTo(s - 12, cy);
      ctx.lineTo(cx, s - 8);
      ctx.lineTo(12, cy);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "star") {
      ctx.beginPath();
      var i;
      for (i = 0; i < 8; i++) {
        var rad = i % 2 === 0 ? 26 : 10;
        var ang = -Math.PI / 2 + i * Math.PI / 4;
        var px = cx + Math.cos(ang) * rad;
        var py = cy + Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (kind === "square") {
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, 32, 32);
    } else if (kind === "station") {
      ctx.fillRect(6, 22, 52, 20);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 32);
      ctx.lineTo(0, 26);
      ctx.moveTo(6, 32);
      ctx.lineTo(0, 38);
      ctx.moveTo(58, 32);
      ctx.lineTo(64, 26);
      ctx.moveTo(58, 32);
      ctx.lineTo(64, 38);
      ctx.stroke();
    } else if (kind === "cross") {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 32);
      ctx.lineTo(58, 32);
      ctx.moveTo(32, 6);
      ctx.lineTo(32, 58);
      ctx.stroke();
    } else if (kind === "brackets") {
      ctx.lineWidth = 3;
      var m = 8;
      var a = 16;
      ctx.beginPath();
      ctx.moveTo(m, m + a);
      ctx.lineTo(m, m);
      ctx.lineTo(m + a, m);
      ctx.moveTo(s - m, m + a);
      ctx.lineTo(s - m, m);
      ctx.lineTo(s - m - a, m);
      ctx.moveTo(m, s - m - a);
      ctx.lineTo(m, s - m);
      ctx.lineTo(m + a, s - m);
      ctx.moveTo(s - m, s - m - a);
      ctx.lineTo(s - m, s - m);
      ctx.lineTo(s - m - a, s - m);
      ctx.moveTo(34, 20);
      ctx.lineTo(42, 30);
      ctx.lineTo(56, 12);
      ctx.stroke();
    } else if (kind === "halo") {
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  function pointMaterial(THREE, texture) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      uniforms: {
        uMap: { value: texture },
        uPixelRatio: { value: 1 }
      },
      vertexShader: [
        "attribute float aSize;",
        "attribute float aAlpha;",
        "attribute vec3 aColor;",
        "uniform float uPixelRatio;",
        "varying vec3 vColor;",
        "varying float vAlpha;",
        "void main() {",
        "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  float dist = max(0.001, -mv.z);",
        "  gl_PointSize = clamp(aSize * (800.0 / dist), aSize * 0.5, aSize * 2.4) * uPixelRatio;",
        "  vColor = aColor;",
        "  float depthFade = clamp(1600.0 / dist, 0.55, 1.0);",
        "  vAlpha = aAlpha * depthFade;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D uMap;",
        "varying vec3 vColor;",
        "varying float vAlpha;",
        "void main() {",
        "  vec4 tex = texture2D(uMap, gl_PointCoord);",
        "  if (tex.a < 0.05) discard;",
        "  gl_FragColor = vec4(vColor, tex.a * vAlpha);",
        "}"
      ].join("\n")
    });
  }

  function create(opts) {
    var THREE = root.THREE;
    var OrbitControls = root.OrbitControls;
    if (!THREE || !OrbitControls || !opts || !opts.canvas) return null;

    var canvas = opts.canvas;
    var labelRoot = opts.labels;
    var marqueeEl = opts.marquee;
    var onChange = opts.onChange || function () {};

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
    } catch (err) {
      return null;
    }
    if (!renderer.getContext()) return null;
    renderer.toneMapping = THREE.NoToneMapping;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.4, 48000);
    camera.position.set(3400, 980, 3100);
    var controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.zoomToCursor = true;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.85;
    controls.panSpeed = 0.9;
    controls.zoomSpeed = 1.05;
    controls.minDistance = 18;
    controls.maxDistance = 14000;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI - 0.12;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controls.update();

    var width = 1;
    var height = 1;
    var markers = [];
    var running = false;
    var frameId = 0;
    var focusAnim = null;
    var theme = {
      base: "#0C021A",
      ink: "#F8ECFF",
      soft: "#B89BC8",
      faint: "#6E5088",
      accent: "#FF2DC8",
      accent2: "#00F0FF"
    };

    var textures = {};
    SHAPES.forEach(function (kind) { textures[kind] = makeShapeTexture(THREE, kind); });

    var layers = {};
    var measureCanvas = document.createElement("canvas");
    var measureCtx = measureCanvas.getContext("2d");
    var labelPool = [];

    var discMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uCore: { value: new THREE.Color(theme.accent) },
        uMid: { value: new THREE.Color(theme.accent2) },
        uSoft: { value: new THREE.Color(theme.soft) }
      },
      vertexShader: [
        "varying vec2 vPos;",
        "void main() {",
        "  vPos = position.xy / 2100.0;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "varying vec2 vPos;",
        "uniform vec3 uCore;",
        "uniform vec3 uMid;",
        "uniform vec3 uSoft;",
        "void main() {",
        "  float r = length(vPos);",
        "  if (r > 1.0) discard;",
        "  float core = exp(-r * r * 28.0);",
        "  float disk = smoothstep(1.0, 0.02, r);",
        "  float ang = atan(vPos.y, vPos.x);",
        "  float arms = pow(abs(sin(ang * 2.0 + r * 5.5)), 1.8);",
        "  float dust = disk * (0.05 + 0.09 * arms) * (1.0 - smoothstep(0.15, 1.0, r));",
        "  float alpha = core * 0.62 + dust;",
        "  vec3 col = mix(uMid, uCore, clamp(core * 1.4, 0.0, 1.0));",
        "  col = mix(uSoft, col, 0.72);",
        "  gl_FragColor = vec4(col, alpha);",
        "}"
      ].join("\n")
    });
    var disc = new THREE.Mesh(new THREE.CircleGeometry(2100, 128), discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.renderOrder = 0;
    scene.add(disc);

    var ringGroup = new THREE.Group();
    scene.add(ringGroup);
    var axisGroup = new THREE.Group();
    scene.add(axisGroup);

    function addRing(radius, opacity) {
      var pts = [];
      var n = 160;
      var i;
      for (i = 0; i <= n; i++) {
        var a = (i / n) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(theme.faint),
        transparent: true,
        opacity: opacity
      });
      var line = new THREE.Line(geo, mat);
      line.renderOrder = 1;
      ringGroup.add(line);
    }
    addRing(420, 0.28);
    addRing(840, 0.22);
    addRing(1260, 0.18);
    addRing(1680, 0.16);
    addRing(2048, 0.28);

    function addLine(x0, y0, z0, x1, y1, z1, color, opacity) {
      var geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x0, y0, z0),
        new THREE.Vector3(x1, y1, z1)
      ]);
      var mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: opacity
      });
      var line = new THREE.Line(geo, mat);
      line.renderOrder = 1;
      axisGroup.add(line);
    }
    addLine(-2048, 0, 0, 2048, 0, 0, theme.faint, 0.35);
    addLine(0, 0, -2048, 0, 0, 2048, theme.faint, 0.35);
    addLine(0, -140, 0, 0, 140, 0, theme.ink, 0.28);

    var starPositions = new Float32Array(1600 * 3);
    var rng = mulberry32(0x4E4D5303);
    var s;
    for (s = 0; s < 1600; s++) {
      var u = rng();
      var v = rng();
      var theta = u * Math.PI * 2;
      var phi = Math.acos(2 * v - 1);
      var rad = 7600 + rng() * 1800;
      starPositions[s * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[s * 3 + 1] = rad * Math.cos(phi) * 0.72;
      starPositions[s * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    var starMat = new THREE.PointsMaterial({
      color: new THREE.Color(theme.soft),
      size: 1.35,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    var starField = new THREE.Points(starGeo, starMat);
    starField.renderOrder = 0;
    scene.add(starField);

    function colorOf(input, fallback) {
      var c = new THREE.Color();
      var raw = input || fallback;
      try {
        if (typeof raw === "string" && raw.indexOf("rgb") === 0) c.setStyle(raw);
        else c.set(raw);
      } catch (err) {
        c.set(fallback);
      }
      return c;
    }

    function applyTheme(next) {
      if (!next) return;
      theme = {
        base: next.base || theme.base,
        ink: next.ink || theme.ink,
        soft: next.soft || theme.soft,
        faint: next.faint || theme.faint,
        accent: next.accent || theme.accent,
        accent2: next.accent2 || theme.accent2
      };
      renderer.setClearColor(colorOf(theme.base, "#0C021A"), 1);
      discMat.uniforms.uCore.value.copy(colorOf(theme.accent, "#FF2DC8"));
      discMat.uniforms.uMid.value.copy(colorOf(theme.accent2, "#00F0FF"));
      discMat.uniforms.uSoft.value.copy(colorOf(theme.soft, "#B89BC8"));
      starMat.color.copy(colorOf(theme.soft, "#B89BC8"));
      ringGroup.children.forEach(function (line) {
        line.material.color.copy(colorOf(theme.faint, "#6E5088"));
      });
      if (axisGroup.children[0]) axisGroup.children[0].material.color.copy(colorOf(theme.faint, "#6E5088"));
      if (axisGroup.children[1]) axisGroup.children[1].material.color.copy(colorOf(theme.faint, "#6E5088"));
      if (axisGroup.children[2]) axisGroup.children[2].material.color.copy(colorOf(theme.ink, "#F8ECFF"));
    }

    function ensureLayer(shape, count) {
      var layer = layers[shape];
      if (layer && layer.capacity >= count && layer.capacity <= Math.max(8, count * 2)) return layer;
      if (layer) {
        scene.remove(layer.points);
        layer.points.geometry.dispose();
        layer.points.material.dispose();
      }
      var capacity = Math.max(8, count);
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(capacity * 3), 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(capacity * 3), 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(capacity), 1));
      geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(capacity), 1));
      var mat = pointMaterial(THREE, textures[shape] || textures.circle);
      mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      var points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      points.renderOrder = shape === "brackets" || shape === "halo" ? 4 : 3;
      scene.add(points);
      layer = { points: points, capacity: capacity, count: 0 };
      layers[shape] = layer;
      return layer;
    }

    function writeGroup(shape, list) {
      var layer = ensureLayer(shape, list.length);
      var pos = layer.points.geometry.getAttribute("position");
      var col = layer.points.geometry.getAttribute("aColor");
      var size = layer.points.geometry.getAttribute("aSize");
      var alpha = layer.points.geometry.getAttribute("aAlpha");
      var i;
      for (i = 0; i < list.length; i++) {
        var m = list[i];
        pos.setXYZ(i, m.x || 0, m.y || 0, m.z || 0);
        var c = colorOf(m.color, "#ffffff");
        col.setXYZ(i, c.r, c.g, c.b);
        size.setX(i, m.size > 0 ? m.size : 8);
        alpha.setX(i, m.alpha == null ? 1 : m.alpha);
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      size.needsUpdate = true;
      alpha.needsUpdate = true;
      layer.points.geometry.setDrawRange(0, list.length);
      layer.points.visible = list.length > 0;
      layer.count = list.length;
      layer.points.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    }

    var projVec = new THREE.Vector3();
    function project(x, y, z) {
      projVec.set(x, y, z);
      projVec.applyMatrix4(camera.matrixWorldInverse);
      if (projVec.z > -0.2) return { x: 0, y: 0, behind: true };
      projVec.set(x, y, z).project(camera);
      return {
        x: (projVec.x * 0.5 + 0.5) * width,
        y: (-projVec.y * 0.5 + 0.5) * height,
        behind: false
      };
    }

    function measure(text) {
      measureCtx.font = "11px 'IBM Plex Mono', ui-monospace, monospace";
      return measureCtx.measureText(String(text || "")).width;
    }

    function layoutLabels() {
      if (!labelRoot) return;
      var jobs = [];
      markers.forEach(function (m) {
        if (!m.label && !m.badge) return;
        var p = project(m.x, m.y, m.z);
        if (!p || p.behind) return;
        if (p.x < -40 || p.y < -40 || p.x > width + 40 || p.y > height + 40) return;
        if (m.label) {
          jobs.push({
            text: m.label,
            x: p.x + (m.labelDx == null ? 12 : m.labelDx),
            y: p.y + (m.labelDy || 0),
            color: m.labelColor || theme.ink,
            priority: m.priority ? 2 : 0,
            badge: false
          });
        }
        if (m.badge) {
          jobs.push({
            text: m.badge,
            x: p.x + (m.badgeDx == null ? 10 : m.badgeDx),
            y: p.y + (m.badgeDy == null ? -16 : m.badgeDy),
            color: m.badgeColor || theme.base,
            fill: m.badgeFill || theme.accent,
            priority: 3,
            badge: true
          });
        }
      });
      jobs.sort(function (a, b) { return b.priority - a.priority; });
      var placed = [];
      var shown = [];
      jobs.forEach(function (job) {
        var spots = job.badge
          ? [{ x: job.x, y: job.y }]
          : [
            { x: job.x, y: job.y },
            { x: job.x, y: job.y - 18 },
            { x: job.x, y: job.y + 18 },
            { x: job.x - 10, y: job.y - 16 }
          ];
        var tw = measure(job.text);
        var i;
        for (i = 0; i < spots.length; i++) {
          var left = spots[i].x - (job.badge ? tw / 2 + 6 : 0);
          var rect = { l: left - 2, t: spots[i].y - 10, r: left + tw + 10, b: spots[i].y + 10 };
          var blocked = false;
          var s;
          for (s = 0; s < placed.length; s++) {
            var slot = placed[s];
            if (rect.l < slot.r && rect.r > slot.l && rect.t < slot.b && rect.b > slot.t) {
              blocked = true;
              break;
            }
          }
          if (blocked && !job.priority) continue;
          if (blocked && job.badge) continue;
          if (blocked) continue;
          placed.push(rect);
          shown.push({
            text: job.text,
            x: spots[i].x,
            y: spots[i].y,
            color: job.color,
            fill: job.fill || "",
            badge: job.badge
          });
          break;
        }
      });
      var n = shown.length;
      var p;
      while (labelPool.length < n) {
        var el = document.createElement("span");
        labelRoot.appendChild(el);
        labelPool.push(el);
      }
      for (p = 0; p < labelPool.length; p++) {
        var node = labelPool[p];
        if (p >= n) {
          node.hidden = true;
          continue;
        }
        var row = shown[p];
        node.hidden = false;
        node.textContent = row.text;
        node.style.color = row.color;
        node.className = row.badge ? "map-label map-badge" : "map-label";
        if (row.badge) {
          node.style.background = row.fill;
          node.style.transform = "translate(" + (row.x - measure(row.text) / 2 - 6) + "px," + (row.y - 8) + "px)";
        } else {
          node.style.background = "";
          node.style.transform = "translate(" + row.x + "px," + (row.y - 8) + "px)";
        }
      }
    }

    function setMarkers(list) {
      markers = list || [];
      var groups = {};
      markers.forEach(function (m) {
        var shape = m.shape || "circle";
        if (!groups[shape]) groups[shape] = [];
        groups[shape].push(m);
      });
      SHAPES.forEach(function (shape) {
        writeGroup(shape, groups[shape] || []);
      });
      layoutLabels();
    }

    function projectHits() {
      var out = [];
      markers.forEach(function (m) {
        if (!m.kind) return;
        var p = project(m.x, m.y, m.z);
        if (!p || p.behind) return;
        out.push({
          x: p.x,
          y: p.y,
          r: m.hitR > 0 ? m.hitR : 12,
          kind: m.kind,
          id: m.id,
          members: m.members || null
        });
      });
      return out;
    }

    function worldPerPixel(distance) {
      var dist = distance > 0 ? distance : camera.position.distanceTo(controls.target);
      var v = camera.fov * Math.PI / 180;
      var visible = 2 * Math.tan(v / 2) * dist;
      return visible / Math.max(1, height);
    }

    function screenBasis() {
      var right = new THREE.Vector3();
      var up = new THREE.Vector3();
      var forward = new THREE.Vector3();
      camera.updateMatrixWorld();
      camera.matrixWorld.extractBasis(right, up, forward);
      return {
        right: { x: right.x, y: right.y, z: right.z },
        up: { x: up.x, y: up.y, z: up.z }
      };
    }

    function distanceTo(x, y, z) {
      return camera.position.distanceTo(new THREE.Vector3(x || 0, y || 0, z || 0));
    }

    function cancelFocus() {
      focusAnim = null;
      controls.enableDamping = true;
    }

    function stepFocus() {
      if (!focusAnim) return false;
      var t = (performance.now() - focusAnim.t0) / focusAnim.dur;
      if (t >= 1) t = 1;
      var k = 1 - Math.pow(1 - t, 3);
      controls.target.lerpVectors(focusAnim.fromT, focusAnim.toT, k);
      camera.position.lerpVectors(focusAnim.fromP, focusAnim.toP, k);
      controls.enableDamping = false;
      var changed = controls.update();
      if (t >= 1) {
        focusAnim = null;
        controls.enableDamping = true;
      }
      return changed;
    }

    function orbitDistance() {
      return camera.position.distanceTo(controls.target);
    }

    function focus(x, y, z, dist, opts) {
      opts = opts || {};
      var endTarget = new THREE.Vector3(x || 0, y || 0, z || 0);
      var offset = camera.position.clone().sub(controls.target);
      if (offset.lengthSq() < 1) offset.set(0.72, 0.42, 0.78);
      var current = offset.length();
      var next = dist > 0 ? dist : Math.max(80, current * 0.45);
      if (opts.keepCloser && current < next) next = current;
      next = Math.max(controls.minDistance, Math.min(controls.maxDistance, next));
      offset.setLength(next);
      var dur = opts.duration > 0 && isFinite(opts.duration) ? opts.duration : 680;
      if (opts.instant || dur <= 0) {
        cancelFocus();
        controls.target.copy(endTarget);
        camera.position.copy(endTarget).add(offset);
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = true;
        layoutLabels();
        return;
      }
      focusAnim = {
        t0: performance.now(),
        dur: dur,
        fromT: controls.target.clone(),
        fromP: camera.position.clone(),
        toT: endTarget,
        toP: endTarget.clone().add(offset)
      };
    }

    function fit(points) {
      var box = new THREE.Box3();
      var list = points || [];
      var i;
      for (i = 0; i < list.length; i++) {
        var p = list[i];
        if (!p) continue;
        var x = p.x != null ? p.x : p.voxelX;
        var y = p.y != null ? p.y : (p.voxelY || 0);
        var z = p.z != null ? p.z : p.voxelZ;
        if (![x, y, z].every(isFinite)) continue;
        box.expandByPoint(new THREE.Vector3(x, y, z));
      }
      if (box.isEmpty()) {
        box.set(new THREE.Vector3(-2048, -40, -2048), new THREE.Vector3(2048, 40, 2048));
      }
      var sphere = box.getBoundingSphere(new THREE.Sphere());
      var center = sphere.center;
      var radius = Math.max(sphere.radius, 90);
      var half = camera.fov * Math.PI / 360;
      var dist = (radius / Math.sin(half)) * 0.92;
      dist = Math.max(controls.minDistance + 10, Math.min(controls.maxDistance, dist));
      var dir = new THREE.Vector3(0.92, 0.28, 0.62).normalize();
      cancelFocus();
      controls.target.copy(center);
      camera.position.copy(center).add(dir.multiplyScalar(dist));
      camera.near = Math.max(0.2, dist / 800);
      camera.far = Math.max(20000, dist * 8);
      camera.updateProjectionMatrix();
      controls.enableDamping = false;
      controls.update();
      controls.enableDamping = true;
      layoutLabels();
    }

    function zoomAt(factor, sx, sy) {
      if (!(factor > 0)) return;
      var rect = canvas.getBoundingClientRect();
      var clientX = rect.left + (sx == null ? rect.width / 2 : sx);
      var clientY = rect.top + (sy == null ? rect.height / 2 : sy);
      var delta = factor > 1 ? -140 : 140;
      var steps = Math.max(1, Math.round(Math.abs(Math.log(factor) / Math.log(1.12))));
      var i;
      for (i = 0; i < steps; i++) {
        canvas.dispatchEvent(new WheelEvent("wheel", {
          deltaY: delta,
          clientX: clientX,
          clientY: clientY,
          bubbles: true,
          cancelable: true
        }));
      }
    }

    function setMarquee(shape) {
      if (!marqueeEl) return;
      if (!shape) {
        marqueeEl.hidden = true;
        return;
      }
      marqueeEl.hidden = false;
      marqueeEl.classList.toggle("is-circle", shape.type === "circle");
      if (shape.type === "circle") {
        var d = Math.max(0, shape.r) * 2;
        marqueeEl.style.left = (shape.cx - shape.r) + "px";
        marqueeEl.style.top = (shape.cy - shape.r) + "px";
        marqueeEl.style.width = d + "px";
        marqueeEl.style.height = d + "px";
      } else {
        var left = Math.min(shape.x0, shape.x1);
        var top = Math.min(shape.y0, shape.y1);
        marqueeEl.style.left = left + "px";
        marqueeEl.style.top = top + "px";
        marqueeEl.style.width = Math.abs(shape.x1 - shape.x0) + "px";
        marqueeEl.style.height = Math.abs(shape.y1 - shape.y0) + "px";
      }
      marqueeEl.textContent = shape.label || "";
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1));
      height = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1));
      var pr = Math.min((root.devicePixelRatio || 1), 2);
      renderer.setPixelRatio(pr);
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      Object.keys(layers).forEach(function (shape) {
        layers[shape].points.material.uniforms.uPixelRatio.value = pr;
      });
      layoutLabels();
    }

    function renderFrame() {
      if (!running) return;
      frameId = root.requestAnimationFrame(renderFrame);
      stepFocus();
      controls.update();
      renderer.render(scene, camera);
    }

    function setEnabled(on) {
      controls.enabled = !!on;
      if (on && !running) {
        running = true;
        resize();
        renderFrame();
      } else if (!on && running) {
        running = false;
        if (frameId) root.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    controls.addEventListener("start", function () { cancelFocus(); });
    controls.addEventListener("change", function () {
      layoutLabels();
      onChange();
    });

    applyTheme(theme);
    resize();

    return {
      canvas: canvas,
      controls: controls,
      setEnabled: setEnabled,
      resize: resize,
      setTheme: applyTheme,
      setMarkers: setMarkers,
      projectHits: projectHits,
      project: project,
      worldPerPixel: worldPerPixel,
      screenBasis: screenBasis,
      distanceTo: distanceTo,
      focus: focus,
      cancelMove: cancelFocus,
      orbitDistance: orbitDistance,
      fit: fit,
      zoomAt: zoomAt,
      setMarquee: setMarquee,
      fov: function () { return camera.fov; }
    };
  }

  root.NmsGalaxy3D = { create: create };
})(typeof globalThis !== "undefined" ? globalThis : this);
