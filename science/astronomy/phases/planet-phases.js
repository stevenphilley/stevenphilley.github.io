/*! planet-phases.js — circular-orbit phase desks.
    Semimajor-axis ratios, periods, velocities, eccentricities, and
    inclinations are the NASA Planetary Fact Sheet values stored below.
    Phase angles and lit fractions are computed from those ratios:
    superior max phase = arcsin(1 / ratio), lit = (1 + cos phase) / 2.
    Classroom circles. Not an ephemeris. */
(function (root) {
  "use strict";

  var TAU = Math.PI * 2;
  var EARTH_SIDEREAL = 365.256;
  var EARTH_VELOCITY = 29.78;

  var PLANETS = {
    mercury: {
      name: "Mercury",
      kind: "inferior",
      ratio: 0.387,
      sidereal: 87.969,
      siderealLabel: "87.969 days",
      synodic: 115.88,
      velocity: 47.36,
      eccentricity: "0.2056",
      inclination: "7.004",
      factUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html",
      href: "/science/astronomy/mercury/",
      color: "#d2cdc4",
      night: [54, 50, 46],
      lit: [214, 206, 196],
      start: "evening-crescent"
    },
    venus: {
      name: "Venus",
      kind: "inferior",
      ratio: 0.723,
      sidereal: 224.701,
      siderealLabel: "224.701 days",
      synodic: 583.92,
      velocity: 35.02,
      eccentricity: "0.0068",
      inclination: "3.395",
      factUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html",
      href: "/science/astronomy/venus/",
      color: "#f0d9a0",
      night: [58, 50, 43],
      lit: [243, 224, 168],
      start: "east"
    },
    mars: {
      name: "Mars",
      kind: "superior",
      ratio: 1.524,
      sidereal: 686.98,
      siderealLabel: "686.980 days",
      synodic: 779.94,
      velocity: 24.08,
      eccentricity: "0.0935",
      inclination: "1.848",
      factUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
      href: "/science/astronomy/mars/",
      color: "#e07a4c",
      night: [58, 36, 30],
      lit: [224, 122, 76],
      start: "east"
    },
    jupiter: {
      name: "Jupiter",
      kind: "superior",
      ratio: 5.204,
      sidereal: 4332.589,
      siderealLabel: "4,332.589 days",
      synodic: 398.88,
      velocity: 13.06,
      eccentricity: "0.0487",
      inclination: "1.304",
      factUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html",
      href: "/science/astronomy/jupiter/",
      color: "#e0c39a",
      night: [62, 48, 36],
      lit: [230, 196, 150],
      bands: true,
      limbZoom: true,
      craft: true,
      start: "east",
      moons: [
        { name: "Io", days: 1.769138 },
        { name: "Europa", days: 3.551181 },
        { name: "Ganymede", days: 7.154553 },
        { name: "Callisto", days: 16.689017 }
      ]
    },
    saturn: {
      name: "Saturn",
      kind: "superior",
      ratio: 9.573,
      sidereal: 10755.699,
      siderealLabel: "10,755.699 days",
      synodic: 378.09,
      velocity: 9.67,
      eccentricity: "0.0520",
      inclination: "2.486",
      factUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html",
      href: "/science/astronomy/saturn/",
      color: "#ead7b0",
      night: [58, 50, 40],
      lit: [236, 214, 176],
      rings: true,
      start: "east"
    },
    uranus: {
      name: "Uranus",
      kind: "superior",
      ratio: 19.165,
      sidereal: 30685.4,
      siderealLabel: "30,685.400 days",
      synodic: 369.66,
      velocity: 6.79,
      eccentricity: "0.0469",
      inclination: "0.770",
      factUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html",
      href: "/science/astronomy/uranus/",
      color: "#9fd6e8",
      night: [28, 48, 58],
      lit: [168, 214, 228],
      start: "east"
    },
    neptune: {
      name: "Neptune",
      kind: "superior",
      ratio: 30.178,
      sidereal: 60189.018,
      siderealLabel: "60,189.018 days",
      synodic: 367.49,
      velocity: 5.45,
      eccentricity: "0.0097",
      inclination: "1.770",
      factUrl: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html",
      href: "/science/astronomy/neptune/",
      color: "#6d8ef0",
      night: [22, 30, 62],
      lit: [130, 156, 230],
      start: "east"
    }
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hypot(x, y) { return Math.sqrt(x * x + y * y); }

  function fmtDeg(radOrDeg, alreadyDeg) {
    var d = alreadyDeg ? radOrDeg : radOrDeg * 180 / Math.PI;
    return (Math.round(d * 100) / 100).toFixed(2);
  }
  function fmtPct(k) {
    return (Math.round(k * 10000) / 100).toFixed(2);
  }

  function maxPhaseRad(ratio) {
    if (!(ratio > 1)) return Math.PI;
    return Math.asin(1 / ratio);
  }
  function litFraction(phaseRad) {
    return (1 + Math.cos(phaseRad)) / 2;
  }

  function limits(p) {
    var ratio = p.ratio;
    var maxPhase = maxPhaseRad(ratio);
    var minLit = p.kind === "inferior" ? 0 : litFraction(maxPhase);
    var elong = p.kind === "inferior" ? Math.asin(ratio) : Math.PI / 2;
    return {
      maxPhase: maxPhase,
      maxPhaseDeg: fmtDeg(maxPhase),
      minLit: minLit,
      minLitPct: fmtPct(minLit),
      elongDeg: fmtDeg(elong)
    };
  }

  function phaseAngleRad(theta, ratio) {
    var px = ratio * Math.cos(theta);
    var py = ratio * Math.sin(theta);
    var sx = -px;
    var sy = -py;
    var ex = 1 - px;
    var ey = -py;
    var m = hypot(sx, sy) * hypot(ex, ey);
    if (m === 0) return 0;
    var c = (sx * ex + sy * ey) / m;
    return Math.acos(clamp(c, -1, 1));
  }

  function signedFromSun(theta, ratio) {
    var px = ratio * Math.cos(theta);
    var py = ratio * Math.sin(theta);
    var sl = hypot(px, py) || 1;
    var sx = -px / sl;
    var sy = -py / sl;
    var ex = 1 - px;
    var ey = -py;
    var el = hypot(ex, ey) || 1;
    ex /= el;
    ey /= el;
    return Math.atan2(sx * ey - sy * ex, sx * ex + sy * ey);
  }

  function elongationRad(theta, ratio) {
    var vx = ratio * Math.cos(theta);
    var vy = ratio * Math.sin(theta);
    var lonV = Math.atan2(vy, vx - 1);
    var d = lonV - Math.PI;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  function distance(theta, ratio) {
    var px = ratio * Math.cos(theta);
    var py = ratio * Math.sin(theta);
    return hypot(px - 1, py);
  }

  function wrapDay(t, syn) {
    var x = t % syn;
    if (x < 0) x += syn;
    return x;
  }

  function thetaOf(t, p) {
    var frac = wrapDay(t, p.synodic) / p.synodic;
    var dir = p.kind === "inferior" ? 1 : -1;
    return dir * TAU * frac;
  }

  function presetsFor(p) {
    var syn = p.synodic;
    if (p.kind === "inferior") {
      var ge = Math.acos(p.ratio);
      return {
        inferior: 0,
        west: ge / TAU * syn,
        superior: syn / 2,
        east: (TAU - ge) / TAU * syn
      };
    }
    var q = Math.acos(1 / p.ratio);
    return {
      opposition: 0,
      east: q / TAU * syn,
      conjunction: syn / 2,
      west: (TAU - q) / TAU * syn
    };
  }

  function phaseWord(phaseRad) {
    var deg = phaseRad * 180 / Math.PI;
    var k = litFraction(phaseRad);
    if (deg <= 1) return "Full";
    if (k >= 0.995) return "Near full";
    if (deg >= 80 && deg <= 100) return "Half lit";
    if (k > 0.5) return "Gibbous";
    if (k > 0.02) return "Crescent";
    return "Near new";
  }

  function diskWords(theta, ratio) {
    var d = distance(theta, ratio);
    var dMin = Math.abs(ratio - 1);
    var dMax = ratio + 1;
    var u = (d - dMin) / (dMax - dMin);
    if (u < 0.28) return "Larger · closer";
    if (u > 0.72) return "Smaller · farther";
    return "In between";
  }

  function skyWords(elongRad) {
    var deg = elongRad * 180 / Math.PI;
    var ae = Math.abs(deg);
    if (ae >= 170) return "Opposite the Sun";
    if (ae <= 8) return "In the glare";
    var side = deg > 0 ? "Evening" : "Morning";
    return side + " · " + fmtDeg(ae, true) + "° from the Sun";
  }

  function dayNum(t, syn) {
    var n = Math.round(wrapDay(t, syn));
    if (n >= Math.round(syn)) n = 0;
    return n;
  }
  function dayLabel(t, syn) {
    var n = dayNum(t, syn);
    if (n === 0) return "0 d";
    return "+" + n + " d";
  }

  function nearPreset(t, p, pre) {
    var syn = p.synodic;
    var w = wrapDay(t, syn);
    var tol = Math.max(2.5, syn * (5 / 360));
    var keys = Object.keys(pre);
    var best = "";
    var bestD = 1e9;
    var i;
    for (i = 0; i < keys.length; i++) {
      var target = pre[keys[i]];
      var d = Math.abs(w - target);
      if (keys[i] === "inferior" || keys[i] === "opposition") d = Math.min(d, Math.abs(w - syn));
      if (d < bestD) { bestD = d; best = keys[i]; }
    }
    return bestD <= tol ? best : "";
  }

  function findEveningCrescent(p) {
    var pre = presetsFor(p);
    var lo = pre.east;
    var hi = p.synodic;
    var i;
    for (i = 0; i < 40; i++) {
      var mid = (lo + hi) / 2;
      var ang = phaseAngleRad(thetaOf(mid, p), p.ratio);
      if (ang < 120 * Math.PI / 180) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function startDay(p) {
    var pre = presetsFor(p);
    if (p.start === "evening-crescent" && p.kind === "inferior") return findEveningCrescent(p);
    if (pre[p.start] != null) return pre[p.start];
    return p.kind === "inferior" ? pre.east : pre.east;
  }

  function snapshot(t, p) {
    var th = thetaOf(t, p);
    var ang = phaseAngleRad(th, p.ratio);
    var elong = elongationRad(th, p.ratio);
    var lim = limits(p);
    var pre = presetsFor(p);
    var preset = nearPreset(t, p, pre);
    var nDay = dayNum(t, p.synodic);
    return {
      t: wrapDay(t, p.synodic),
      theta: th,
      phase: ang,
      phaseDeg: fmtDeg(ang),
      lit: litFraction(ang),
      litPct: fmtPct(litFraction(ang)),
      word: phaseWord(ang),
      elong: elong,
      elongDeg: fmtDeg(Math.abs(elong)),
      sky: skyWords(elong),
      disk: diskWords(th, p.ratio),
      preset: preset,
      day: dayLabel(t, p.synodic),
      dayLong: "Day " + (nDay === 0 ? "0" : "+" + nDay) + (p.kind === "inferior" ? " from inferior" : " from opposition"),
      lim: lim,
      evening: elong >= 0
    };
  }

  function inferiorWhy(p, s) {
    var n = p.name;
    if (s.preset === "inferior") {
      return n + " sits between Earth and the Sun. NASA calls that an inferior conjunction: the inner planet passes approximately between us and the Sun. On this coplanar cartoon the night side faces Earth, so the disk goes dark. The fact sheet lists an inclination of " + p.inclination + "°, so a real lineup usually misses the Sun’s face and shows a thin crescent in the glare. The disk here is as large as these circles get. This is not a transit date, and it is not a reason to look at the Sun.";
    }
    if (s.preset === "superior") {
      return n + " is on the far side of the Sun. NASA calls that a superior conjunction: Earth and the planet on opposite sides, nearly in a line. The lit face points toward Earth, so the phase is near full, and the disk is as small as these circles allow. It is still near the Sun in the sky.";
    }
    if (s.preset === "east" || s.preset === "west") {
      var side = s.preset === "east" ? "east" : "west";
      var sky = s.preset === "east" ? "evening" : "morning";
      return "On these circles the line of sight just grazes the inner orbit. That is as far " + side + " of the Sun as this drawing can place " + n + " — a " + sky + " object. The angle at " + n + " is a right angle, so the disk is half lit. The elongation on these circles is " + s.lim.elongDeg + "°, the arcsine of the fact-sheet ratio " + p.ratio + ". The fact sheet does not publish one greatest-elongation degree. Eccentricity " + p.eccentricity + " means a real elongation is not this single tangent.";
    }
    if (s.word === "Crescent") {
      return (s.evening
        ? n + " is east of the Sun, so it follows the Sun down: an evening object. The lit fraction is a crescent, and the disk is on the large side because the planet is relatively close on the inner orbit."
        : n + " is west of the Sun, so it rises before the Sun: a morning object. The phase is still a crescent, and the disk is still on the large side, because the planet is still relatively close.")
        + " NASA’s name for the apparent angle from the Sun is elongation.";
    }
    if (s.word === "Gibbous" || s.word === "Near full") {
      return n + " is on the far side of its orbit, so most of the face turned toward Earth is lit. The disk shrinks as the phase fills in. Superior conjunction is the small, near-full end of that walk, still lost near the Sun.";
    }
    if (s.word === "Half lit") {
      return "About half the disk is lit. On these circles the exact greatest elongation is the tangent, and that is a right angle at " + n + ". The preset buttons sit on the tangent itself.";
    }
    return "Almost none of the lit face points at Earth. " + n + " is near the Earth–Sun line, and in the real sky it is lost in the glare. The disk is large because the planet is close. Do not go looking for it beside the Sun with this page.";
  }

  function superiorWhy(p, s) {
    var n = p.name;
    var lim = s.lim;
    if (s.preset === "opposition") {
      return "Earth is between the Sun and " + n + ". NASA calls that opposition: the planet and Earth on the same side of the Sun, all three in a line. The phase angle on these circles is 0°, so the disk is full, and the distance is as small as these circles get. " + (n === "Mars"
        ? "The lineup itself is the opposition desk. The backward loop around it is the retrograde desk. This page is only the phase."
        : "An outer planet at opposition is the same geometry the opposition desk draws for Mars. " + n + " reaches it once per synodic lap on these circles, every " + p.synodic + " days on the fact sheet.");
    }
    if (s.preset === "conjunction") {
      return "The Sun is between Earth and " + n + ". For a superior planet that is the only conjunction: Earth and the planet on opposite sides of the Sun. Basics of Space Flight says the outer planet then appears near its fully illuminated phase. On these circles the phase angle is back near 0°, the disk is as small as it gets, and " + n + " is lost near the Sun. Fuller is not a crescent. A crescent would need a phase angle past 90°, and Earth cannot get " + n + " there.";
    }
    if (s.preset === "east" || s.preset === "west") {
      var side = s.preset === "east" ? "east" : "west";
      var sky = s.preset === "east" ? "evening" : "morning";
      return "The angle at Earth is a right angle. That is quadrature, " + side + " of the Sun, so in the real sky " + n + " stands in the " + sky + " half. This is also the maximum phase angle on these circles: arcsin(1 / " + p.ratio + ") = " + lim.maxPhaseDeg + "°. The lit fraction is (1 + cos of that angle) / 2 = " + lim.minLitPct + "%. " + (p.ratio < 2
        ? "That is a gibbous disk, short of full by enough to see on the drawing."
        : "That is still " + lim.minLitPct + "% lit. The missing piece is a sliver, not a crescent. Earth never sees the crescent a spacecraft can record from beyond " + n + ".");
    }
    if (s.word === "Full" || s.word === "Near full") {
      return "The phase angle is small, so the disk looks full or nearly full. Superior planets do that twice in a lap: at opposition, when the disk is largest, and again near conjunction, when it is smallest and lost in the glare. The least-lit moment is quadrature, " + lim.minLitPct + "% on these circles.";
    }
    return n + " is gibbous. The phase angle is " + s.phaseDeg + "°, under the maximum of " + lim.maxPhaseDeg + "° that these circles allow at quadrature. Lit fraction " + s.litPct + "%. A crescent would require a phase angle past 90°. The Sun–Earth–" + n + " triangle cannot open that far, because Earth’s orbit is the inner one.";
  }

  function copyFor(p, s) {
    var titles = {
      inferior: ["Inferior conjunction · near new · schematic", "Inferior", "Between Earth and the Sun", "Inferior conjunction"],
      superior: ["Superior conjunction · near full · schematic", "Superior", "On the far side of the Sun", "Superior conjunction"],
      east: p.kind === "inferior"
        ? ["Greatest eastern elongation · evening · schematic", "East elongation", "Farthest east of the Sun on these circles", "Greatest eastern elongation"]
        : ["Eastern quadrature · evening · schematic", "East quadrature", "Right angle at Earth · maximum phase", "Eastern quadrature"],
      west: p.kind === "inferior"
        ? ["Greatest western elongation · morning · schematic", "West elongation", "Farthest west of the Sun on these circles", "Greatest western elongation"]
        : ["Western quadrature · morning · schematic", "West quadrature", "Right angle at Earth · maximum phase", "Western quadrature"],
      opposition: ["Opposition · full · schematic", "Opposition", "Earth between the Sun and " + p.name, "Opposition"]
    };
    var key = s.preset;
    var pack = titles[key];
    var base = {
      tier: (s.evening ? "Evening" : "Morning") + " · " + s.word.toLowerCase() + " · schematic",
      title: s.word,
      range: p.kind === "superior"
        ? ("Minimum on these circles: " + s.lim.minLitPct + "% at " + s.lim.maxPhaseDeg + "°")
        : "Crescent through full on these circles",
      line: s.sky,
      phase: s.word,
      sky: s.sky,
      angle: s.phaseDeg + "° · schematic",
      disk: s.disk,
      day: s.dayLong,
      why: p.kind === "inferior" ? inferiorWhy(p, s) : superiorWhy(p, s),
      slider: s.day + " · " + s.word.toLowerCase() + " · " + s.litPct + "% lit"
    };
    if (pack) {
      base.tier = pack[0];
      base.title = pack[1];
      base.range = pack[2];
      base.line = pack[3];
      if (key === "inferior") {
        base.phase = "Near new";
        base.sky = "In the glare";
        base.disk = "Largest on these circles";
      } else if (key === "superior" || key === "opposition") {
        base.phase = "Full";
        base.sky = key === "opposition" ? "Opposite the Sun" : "In the glare";
        base.disk = key === "opposition" ? "Largest on these circles" : "Smallest on these circles";
      } else if (key === "east" || key === "west") {
        base.phase = p.kind === "inferior" ? "Half lit" : phaseWord(s.phase);
        base.sky = s.sky;
      }
    }
    if (p.kind === "superior" && (key === "east" || key === "west")) {
      base.phase = phaseWord(s.phase);
    }
    return base;
  }

  function craftCopy(p, psiDeg, earthDeg) {
    var lim = limits(p);
    var psi = clamp(psiDeg, -180, 180);
    var phaseDeg = Math.abs(psi);
    var phaseRad = phaseDeg * Math.PI / 180;
    var k = litFraction(phaseRad);
    var word = phaseWord(phaseRad);
    var inWedge = phaseDeg <= parseFloat(lim.maxPhaseDeg) + 0.051;
    var nearEarth = Math.abs(psi - earthDeg) < 1.5 || Math.abs(Math.abs(psi) - Math.abs(earthDeg)) < 1.5 && Math.sign(psi) === Math.sign(earthDeg);
    var why;
    if (Math.abs(phaseDeg - 120) < 1.2) {
      why = "120° is the solar phase angle NASA gives for Cassini’s farewell mosaic of 15 January 2001: the spacecraft looked back and Jupiter was a thinning crescent. Lit fraction on this disk is " + fmtPct(k) + "%. Earth cannot stand at 120°. The fact-sheet ratio " + p.ratio + " caps the Sun–Jupiter–Earth angle at " + lim.maxPhaseDeg + "°.";
    } else if (Math.abs(phaseDeg - 75) < 1.2) {
      why = "75° is the solar phase angle NASA gives for a New Horizons observation on 28 February 2007. That caption says the scan was projected onto a crescent to remove distortion from Jupiter’s rotation. On this disk, 75° is still gibbous — " + fmtPct(k) + "% lit — because a crescent starts past 90°. It is already far outside Earth’s " + lim.maxPhaseDeg + "° wedge.";
    } else if (Math.abs(phaseDeg - 180) < 1.2) {
      why = "The observer is on the far side of Jupiter, looking back toward the Sun. The night side faces the spacecraft, so the disk is near new. Voyager 1’s crescent of 24 March 1979 is a look back from beyond the planet, the same kind of viewpoint, not a claim that this slider is that image’s exact angle.";
    } else if (Math.abs(phaseDeg - 90) < 1.2) {
      why = "A right angle at Jupiter. Half the disk is lit. Earth never reaches a phase angle this large. Quadrature, the most Earth can do, stops at " + lim.maxPhaseDeg + "°.";
    } else if (inWedge) {
      why = "This angle sits inside the wedge Earth can occupy. From Jupiter, Earth never strays more than arcsin(1 / " + p.ratio + ") = " + lim.maxPhaseDeg + "° from the Sun. The view is gibbous to full, " + fmtPct(k) + "% lit. A telescope on Earth is stuck in this wedge.";
    } else {
      why = "Outside Earth’s wedge. A spacecraft can sit here; Earth cannot. The phase angle is " + fmtDeg(phaseDeg, true) + "° and the disk is " + fmtPct(k) + "% lit. NASA’s Juno caption on a crescent mosaic says that crescent is impossible to see from Earth, because Jupiter’s orbit is outside ours.";
    }
    if (nearEarth && inWedge) {
      why = "The observer is parked where Earth is on the synodic slider. The two disks should agree. " + why;
    }
    var title = word;
    if (Math.abs(phaseDeg - 120) < 1.2) title = "Cassini’s 120°";
    else if (Math.abs(phaseDeg - 75) < 1.2) title = "New Horizons 75°";
    else if (Math.abs(phaseDeg - 180) < 1.2) title = "Far side";
    else if (inWedge) title = "Inside Earth’s wedge";
    return {
      tier: (inWedge ? "Earth can stand here" : "Spacecraft only") + " · schematic",
      title: title,
      range: inWedge ? "Within ±" + lim.maxPhaseDeg + "° of the Sun" : "Past the ±" + lim.maxPhaseDeg + "° wedge",
      phase: word,
      lit: fmtPct(k) + "%",
      angle: fmtDeg(phaseDeg, true) + "° from the Sun",
      reach: inWedge ? "Yes · inside the wedge" : "No · Earth cannot",
      why: why,
      psi: psi,
      phaseDeg: phaseDeg,
      word: word,
      litNum: k,
      inWedge: inWedge
    };
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function text(ctx, str, x, y, opt) {
    opt = opt || {};
    ctx.font = (opt.size || 11) + "px IBM Plex Mono, monospace";
    ctx.textAlign = opt.align || "left";
    ctx.textBaseline = opt.base || "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = cssVar("--base-2", "#14161c");
    ctx.strokeText(str, x, y);
    ctx.fillStyle = opt.color || cssVar("--ink-soft", "#9b9a96");
    ctx.fillText(str, x, y);
  }

  function fitCanvas(canvas, cssW, cssH) {
    var dpr = Math.min((root.devicePixelRatio || 1), 2);
    var pw = Math.max(1, Math.round(cssW * dpr));
    var ph = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    canvas.style.height = cssH + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    return ctx;
  }

  function paintDisk(ctx, cx, cy, R, phaseRad, sign, rgb, night, opts) {
    opts = opts || {};
    if (R < 2) return;
    var scale = opts.scale || 2;
    var Rc = R * scale;
    var w = Math.max(2, Math.ceil(Rc * 2 + 4));
    var off = document.createElement("canvas");
    off.width = w;
    off.height = w;
    var ictx = off.getContext("2d");
    var img = ictx.createImageData(w, w);
    var data = img.data;
    var ocx = w / 2;
    var ocy = w / 2;
    var si = Math.sin(phaseRad);
    var co = Math.cos(phaseRad);
    var y, x, idx, dx, dy, r2, rr, z, lit, edge, g, rim;
    for (y = 0; y < w; y++) {
      for (x = 0; x < w; x++) {
        dx = x + 0.5 - ocx;
        dy = y + 0.5 - ocy;
        r2 = dx * dx + dy * dy;
        rr = Math.sqrt(r2);
        if (rr > Rc + 1) continue;
        edge = rr <= Rc ? 1 : clamp(Rc + 1 - rr, 0, 1);
        z = rr < Rc ? Math.sqrt(Math.max(0, Rc * Rc - r2)) : 0;
        lit = (sign * dx) * si + z * co > 0;
        idx = (y * w + x) * 4;
        if (lit) {
          g = 0.78 + 0.22 * (z / Math.max(Rc, 1));
          if (opts.bands) {
            var lat = dy / Rc;
            g *= 0.9 + 0.1 * Math.cos(lat * 26);
            if (Math.abs(lat + 0.18) < 0.045) g *= 0.72;
            if (Math.abs(lat - 0.28) < 0.035) g *= 0.8;
          }
          data[idx] = Math.round(rgb[0] * g);
          data[idx + 1] = Math.round(rgb[1] * g);
          data[idx + 2] = Math.round(rgb[2] * g);
        } else {
          data[idx] = night[0];
          data[idx + 1] = night[1];
          data[idx + 2] = night[2];
        }
        if (rr > Rc - 1.2) {
          rim = clamp((rr - (Rc - 1.2)) / 1.2, 0, 1);
          data[idx] = Math.round(data[idx] * (1 - rim) + 232 * rim);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - rim) + 230 * rim);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - rim) + 225 * rim);
        }
        data[idx + 3] = Math.round(255 * edge);
      }
    }
    ictx.putImageData(img, 0, 0);
    ctx.drawImage(off, cx - w / (2 * scale), cy - w / (2 * scale), w / scale, w / scale);
  }

  function drawRings(ctx, cx, cy, R) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.7, R * 0.42, -0.35, 0, TAU);
    ctx.strokeStyle = "rgba(234, 215, 176, 0.8)";
    ctx.lineWidth = Math.max(2, R * 0.08);
    ctx.stroke();
    ctx.restore();
  }

  function drawMoonRow(ctx, cssW, cssH, phaseRad, sign, t, moons, rgb, night) {
    if (!moons || !moons.length) return;
    var y = cssH - 28;
    var gap = Math.min(78, (cssW - 24) / moons.length);
    var x0 = cssW / 2 - gap * (moons.length - 1) / 2;
    var i;
    for (i = 0; i < moons.length; i++) {
      var m = moons[i];
      var ang = TAU * ((t / m.days) % 1);
      var x = x0 + i * gap;
      paintDisk(ctx, x, y - 8, 7.5, phaseRad, sign, rgb, night, { scale: 2 });
      ctx.fillStyle = cssVar("--muted", "#63666e");
      text(ctx, m.name, x, y + 10, { size: 9, align: "center", color: cssVar("--muted", "#63666e") });
      ctx.strokeStyle = cssVar("--line", "#2c303a");
      ctx.beginPath();
      ctx.arc(x + 16, y - 8, 5, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = cssVar("--accent", "#c8b48a");
      ctx.beginPath();
      ctx.arc(x + 16 + Math.cos(ang) * 5, y - 8 - Math.sin(ang) * 5, 1.6, 0, TAU);
      ctx.fill();
    }
  }

  function sunSign(elongRad, phaseRad) {
    var ed = Math.abs(elongRad) * 180 / Math.PI;
    var pd = phaseRad * 180 / Math.PI;
    if (pd <= 1) return 0;
    if (ed <= 6 && pd >= 170) return 0;
    if (ed >= 170) return 0;
    return elongRad > 0 ? -1 : 1;
  }

  function wireThemes() {
    var KEY = "sp-theme";
    var doc = document.documentElement;
    var buttons = [].slice.call(document.querySelectorAll("[data-set-theme]"));
    function paint() {
      var c = doc.getAttribute("data-theme") || "neon";
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.setTheme === c));
      });
    }
    if (!doc.dataset.phaseThemes) {
      doc.dataset.phaseThemes = "1";
      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          doc.setAttribute("data-theme", b.dataset.setTheme);
          try { localStorage.setItem(KEY, b.dataset.setTheme); } catch (e) {}
          paint();
          if (root.SPPlanetPhases && root.SPPlanetPhases._rerender) root.SPPlanetPhases._rerender();
        });
      });
      document.addEventListener("themechange", function () {
        paint();
        if (root.SPPlanetPhases && root.SPPlanetPhases._rerender) root.SPPlanetPhases._rerender();
      });
    }
    paint();
  }

  function mount(planetId) {
    var p = PLANETS[planetId];
    if (!p || !document.getElementById("orbit")) return null;
    wireThemes();
    var wrap = document.querySelector(".wrap");
    if (wrap) wrap.style.setProperty("--planet", p.color);

    var pre = presetsFor(p);
    var state = { t: startDay(p), playing: false, craft: 120 };
    var hashDay = /(?:^|[?#&])day=([0-9.]+)/.exec(String(location.hash || "") + String(location.search || ""));
    if (hashDay) state.t = clamp(parseFloat(hashDay[1]) || 0, 0, p.synodic);
    var hashCraft = /(?:^|[?#&])craft=(-?[0-9.]+)/.exec(String(location.hash || "") + String(location.search || ""));
    if (hashCraft) state.craft = clamp(parseFloat(hashCraft[1]) || 0, -180, 180);

    var orbitCanvas = document.getElementById("orbit");
    var phaseCanvas = document.getElementById("phase");
    var slider = document.getElementById("lap");
    var playBtn = document.getElementById("btn-play");
    var jumpBtns = [].slice.call(document.querySelectorAll("[data-jump]"));
    var raf = 0;
    var lastT = 0;
    var craftLayout = null;
    var PLAY = p.synodic / 48;

    function renderCraft() {
      var craftCanvas = document.getElementById("craft");
      var craftPhase = document.getElementById("craft-phase");
      if (!craftCanvas || !craftPhase) return;
      var s = snapshot(state.t, p);
      var earthDeg = signedFromSun(s.theta, p.ratio) * 180 / Math.PI;
      var info = craftCopy(p, state.craft, earthDeg);
      var set = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      set("c-tier", info.tier);
      set("c-title", info.title);
      set("c-range", info.range);
      set("c-phase", info.phase);
      set("c-lit", info.lit);
      set("c-angle", info.angle);
      set("c-reach", info.reach);
      set("c-why", info.why);
      var craftSlider = document.getElementById("craft-ang");
      var craftVal = document.getElementById("craft-val");
      if (craftSlider) {
        craftSlider.value = String(info.psi);
        craftSlider.setAttribute("aria-valuenow", String(Math.round(info.psi)));
        craftSlider.setAttribute("aria-valuetext", info.angle + ", " + info.phase);
      }
      if (craftVal) craftVal.textContent = fmtDeg(info.psi, true) + "°";
      [].slice.call(document.querySelectorAll("[data-craft]")).forEach(function (b) {
        var which = b.getAttribute("data-craft");
        var on = false;
        if (which === "earth") on = Math.abs(info.psi - earthDeg) < 1.5;
        else on = Math.abs(info.psi - parseFloat(which)) < 1.2;
        b.setAttribute("aria-pressed", String(on));
      });

      var cssW = craftCanvas.clientWidth || 640;
      var cssH = Math.round(clamp(cssW * 0.78, 280, 520));
      var ctx = fitCanvas(craftCanvas, cssW, cssH);
      var accent = cssVar("--accent", "#c8b48a");
      var ink = cssVar("--ink", "#e8e6e1");
      var line = cssVar("--line", "#2c303a");
      var muted = cssVar("--muted", "#63666e");
      var cx = cssW * 0.5;
      var cy = cssH * 0.52;
      var ring = Math.max(78, Math.min(cssW, cssH) * 0.34);
      var jR = clamp(ring * 0.18, 16, 28);
      craftLayout = { cx: cx, cy: cy, ring: ring };

      var maxDeg = parseFloat(s.lim.maxPhaseDeg);
      ctx.fillStyle = "rgba(200, 180, 138, 0.13)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, ring, Math.PI - maxDeg * Math.PI / 180, Math.PI + maxDeg * Math.PI / 180, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, ring, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ring, Math.PI - maxDeg * Math.PI / 180, Math.PI + maxDeg * Math.PI / 180, false);
      ctx.stroke();

      function pos(psiDeg) {
        var psi = psiDeg * Math.PI / 180;
        return {
          x: cx - Math.cos(psi) * ring,
          y: cy + Math.sin(psi) * ring
        };
      }

      var sun = pos(0);
      sun.x = cx - ring - 36;
      ctx.fillStyle = "#ffe6b0";
      ctx.beginPath();
      ctx.arc(Math.max(16, sun.x), cy, 11, 0, TAU);
      ctx.fill();
      text(ctx, "Sun", Math.max(16, sun.x), cy + 20, { size: 10, align: "center", color: ink });

      if (p.bands) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, jR, 0, TAU);
        ctx.fillStyle = "#3e342c";
        ctx.fill();
        ctx.clip();
        ctx.fillStyle = p.color;
        ctx.fillRect(cx - jR, cy - jR, jR * 2, jR * 2);
        ctx.fillStyle = "rgba(90, 60, 40, 0.35)";
        ctx.fillRect(cx - jR, cy - jR * 0.15, jR * 2, jR * 0.12);
        ctx.fillRect(cx - jR, cy + jR * 0.28, jR * 2, jR * 0.1);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(cx, cy, jR, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(232,230,225,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, jR, 0, TAU);
      ctx.stroke();
      text(ctx, "Jupiter", cx, cy + jR + 14, { size: 11, align: "center", color: ink });

      var epos = pos(earthDeg);
      ctx.fillStyle = "#6ea4b8";
      ctx.beginPath();
      ctx.arc(epos.x, epos.y, 6, 0, TAU);
      ctx.fill();
      text(ctx, "Earth now", epos.x, epos.y - 14, { size: 10, align: "center", color: ink });

      var opos = pos(info.psi);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(opos.x, opos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(opos.x, opos.y, 8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(ctx, "Observer", opos.x, opos.y + 16, { size: 10, align: "center", color: accent });
      text(ctx, "Earth’s wedge · ±" + s.lim.maxPhaseDeg + "°", 12, 16, { size: 11, align: "left", color: accent });
      text(ctx, info.inWedge ? "inside the wedge" : "outside · spacecraft", cssW - 12, 16, { size: 10, align: "right", color: muted });

      craftCanvas.setAttribute("aria-label",
        "Schematic around Jupiter. Sun to the left. Shaded wedge is every direction Earth can occupy, plus or minus " +
        s.lim.maxPhaseDeg + " degrees. Observer at " + info.angle + ". " + info.phase + ". " +
        (info.inWedge ? "Inside Earth’s wedge." : "Outside Earth’s wedge."));

      var pw = craftPhase.clientWidth || cssW;
      var ph = Math.round(clamp(pw * (p.moons ? 0.48 : 0.4), 210, 320));
      var pctx = fitCanvas(craftPhase, pw, ph);
      var sign = info.phaseDeg <= 1 || info.phaseDeg >= 179 ? 1 : (info.psi >= 0 ? 1 : -1);
      var R = clamp(Math.min(pw * 0.16, ph * 0.28), 48, 92);
      var dcx = pw * 0.42;
      var dcy = ph * (p.moons ? 0.4 : 0.46);
      paintDisk(pctx, dcx, dcy, R, phaseRadFromDeg(info.phaseDeg), sign, p.lit, p.night, { bands: p.bands, scale: 2 });
      if (sign !== 0) {
        var sx = clamp(dcx + sign * (R + 28), 18, pw - 18);
        pctx.fillStyle = "#ffe6b0";
        pctx.beginPath();
        pctx.arc(sx, dcy, 6, 0, TAU);
        pctx.fill();
        text(pctx, "Sun", sx, dcy + 16, { size: 10, align: "center", color: ink });
      }
      text(pctx, info.phase + " · " + info.lit, 12, 16, { size: 11, align: "left", color: accent });
      text(pctx, "bright limb toward the Sun", pw - 12, 16, { size: 10, align: "right", color: muted });
      if (p.moons) {
        drawMoonRow(pctx, pw, ph, phaseRadFromDeg(info.phaseDeg), sign, state.t, p.moons, [210, 206, 196], [40, 40, 44]);
        text(pctx, "moon phases match this observer · angles are not an ephemeris", pw / 2, ph - 4, { size: 9, align: "center", color: muted });
      }
      craftPhase.setAttribute("aria-label",
        "Jupiter as seen from the dragged observer. " + info.phase + ". " + info.lit + " lit. Phase angle " + info.angle + ".");
    }

    function phaseRadFromDeg(d) { return d * Math.PI / 180; }

    function drawOrbit(cssW) {
      var cssH = Math.round(clamp(cssW * 0.74, 300, 540));
      var ctx = fitCanvas(orbitCanvas, cssW, cssH);
      var accent = cssVar("--accent", "#c8b48a");
      var ink = cssVar("--ink", "#e8e6e1");
      var soft = cssVar("--ink-soft", "#9b9a96");
      var line = cssVar("--line", "#2c303a");
      var muted = cssVar("--muted", "#63666e");
      var s = snapshot(state.t, p);
      var copy = copyFor(p, s);
      var pad = 36;
      var outer = Math.max(96, Math.min(cssW, cssH) * 0.46 - 10);
      var earthPx = p.kind === "inferior" ? outer : outer / p.ratio;
      var planetPx = p.kind === "inferior" ? outer * p.ratio : outer;
      var cx = cssW * 0.46;
      var cy = cssH * 0.5;
      function screen(ang, r) {
        return { x: cx + Math.cos(ang) * r, y: cy - Math.sin(ang) * r };
      }
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, earthPx, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, planetPx, 0, TAU);
      ctx.stroke();

      function arrowOn(orbitR, ang, color) {
        var pt = screen(ang, orbitR);
        var tangent = ang + Math.PI / 2;
        var bx = Math.cos(tangent);
        var by = -Math.sin(tangent);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(pt.x + bx * 11, pt.y + by * 11);
        ctx.lineTo(pt.x - by * 4.2, pt.y - bx * 4.2);
        ctx.lineTo(pt.x + by * 4.2, pt.y + bx * 4.2);
        ctx.closePath();
        ctx.fill();
      }
      arrowOn(planetPx, s.theta + 1.05, p.color);
      arrowOn(earthPx, 0.9, "rgba(110,164,184,0.9)");

      var e = screen(0, earthPx);
      var v = screen(s.theta, planetPx);
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(v.x, v.y);
      ctx.stroke();
      ctx.strokeStyle = soft;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();

      var sunR = clamp(Math.min(cssW, cssH) * 0.04, 11, 20);
      var glow = ctx.createRadialGradient(cx, cy, sunR * 0.2, cx, cy, sunR * 2.6);
      glow.addColorStop(0, "rgba(255,236,190,0.95)");
      glow.addColorStop(0.45, "rgba(240,195,106,0.28)");
      glow.addColorStop(1, "rgba(240,195,106,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR * 2.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ffe6b0";
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, TAU);
      ctx.fill();

      var earthDisk = clamp(Math.max(earthPx * 0.055, 7), 7, 13);
      ctx.fillStyle = "#6ea4b8";
      ctx.beginPath();
      ctx.arc(e.x, e.y, earthDisk, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(232,230,225,0.65)";
      ctx.lineWidth = 1;
      ctx.stroke();

      var vDisk = clamp(earthDisk * 0.95, 7, 14);
      ctx.save();
      ctx.beginPath();
      ctx.arc(v.x, v.y, vDisk, 0, TAU);
      ctx.fillStyle = "#3a322b";
      ctx.fill();
      ctx.clip();
      var sang = Math.atan2(cy - v.y, cx - v.x);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.arc(v.x, v.y, vDisk + 0.5, sang - Math.PI / 2, sang + Math.PI / 2, false);
      ctx.closePath();
      ctx.fill();
      if (p.bands) {
        ctx.fillStyle = "rgba(80, 55, 36, 0.45)";
        ctx.fillRect(v.x - vDisk, v.y - 1, vDisk * 2, 2);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(v.x, v.y, vDisk, 0, TAU);
      ctx.strokeStyle = "rgba(232,230,225,0.55)";
      ctx.stroke();
      if (p.rings) {
        ctx.beginPath();
        ctx.ellipse(v.x, v.y, vDisk * 1.8, vDisk * 0.45, s.theta * 0.2, 0, TAU);
        ctx.strokeStyle = "rgba(234,215,176,0.75)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      text(ctx, "Earth", clamp(e.x + earthDisk + 8, 36, cssW - 36), clamp(e.y - 14, 16, cssH - 16), { size: 11, color: ink });
      var vLab = screen(s.theta, planetPx + vDisk + 16);
      text(ctx, p.name, clamp(vLab.x, 36, cssW - 36), clamp(vLab.y, 16, cssH - 16), { size: 11, align: "center", color: ink });
      text(ctx, "Sun", cx, cy + sunR + 12, { size: 11, align: "center", color: ink });
      text(ctx, copy.title, cssW - 10, 16, { size: 11, align: "right", color: accent });
      text(ctx, p.kind === "inferior" ? "both still forward" : "arrows forward · marker clockwise", cssW - 10, 32, { size: 10, align: "right", color: muted });

      if (p.kind === "superior" && earthPx < 32) {
        var mag = 64 / earthPx;
        var iw = Math.min(168, cssW * 0.42);
        var ih = Math.min(150, cssH * 0.38);
        var ix = 10;
        var iy = cssH - ih - 10;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(ix, iy, iw, ih);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(ix, iy, iw, ih);
        ctx.clip();
        var icx = ix + 28;
        var icy = iy + ih * 0.55;
        ctx.strokeStyle = line;
        ctx.beginPath();
        ctx.arc(icx, icy, earthPx * mag, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = "#ffe6b0";
        ctx.beginPath();
        ctx.arc(icx, icy, 5, 0, TAU);
        ctx.fill();
        var ie = { x: icx + earthPx * mag, y: icy };
        ctx.fillStyle = "#6ea4b8";
        ctx.beginPath();
        ctx.arc(ie.x, ie.y, 5, 0, TAU);
        ctx.fill();
        var dir = Math.atan2(-(v.y - cy), v.x - cx);
        ctx.strokeStyle = accent;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ie.x, ie.y);
        ctx.lineTo(ie.x + Math.cos(dir) * 36, ie.y - Math.sin(dir) * 36);
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, "inner · ×" + Math.round(mag), ix + 8, iy + 12, { size: 10, color: muted });
        ctx.restore();
      }

      orbitCanvas.setAttribute("aria-label",
        "Top-down schematic. Sun at the center. " + p.name + " and Earth on circular orbits. " +
        copy.title + ". " + copy.line + ". Educational cartoon, not an ephemeris.");
    }

    function drawPhase(cssW) {
      var tall = p.moons ? 0.5 : (p.limbZoom ? 0.46 : 0.4);
      var cssH = Math.round(clamp(cssW * tall, p.moons ? 230 : 200, 340));
      var ctx = fitCanvas(phaseCanvas, cssW, cssH);
      var accent = cssVar("--accent", "#c8b48a");
      var ink = cssVar("--ink", "#e8e6e1");
      var muted = cssVar("--muted", "#63666e");
      var line = cssVar("--line", "#2c303a");
      var s = snapshot(state.t, p);
      var copy = copyFor(p, s);
      var sign = sunSign(s.elong, s.phase);
      var dMin = Math.abs(p.ratio - 1);
      var d = distance(s.theta, p.ratio);
      var cx = cssW * (p.limbZoom ? 0.38 : 0.5);
      var cy = cssH * (p.moons ? 0.38 : 0.46);
      var Rmax = clamp(Math.min(cssW * 0.2, cssH * (p.moons ? 0.28 : 0.34)), 52, 110);
      var R = Math.max(8, Rmax * dMin / d);
      ctx.beginPath();
      ctx.arc(cx, cy, Rmax, 0, TAU);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (p.rings) drawRings(ctx, cx, cy, R);
      paintDisk(ctx, cx, cy, R, s.phase, sign === 0 ? 1 : sign, p.lit, p.night, { bands: p.bands, scale: 2 });
      if (p.rings) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - R * 2, cy, R * 4, R * 2);
        ctx.clip();
        drawRings(ctx, cx, cy, R);
        ctx.restore();
      }
      if (sign !== 0) {
        var sx = clamp(cx + sign * (Rmax + 28), 20, cssW - 20);
        ctx.fillStyle = "#ffe6b0";
        ctx.beginPath();
        ctx.arc(sx, cy, 7, 0, TAU);
        ctx.fill();
        text(ctx, "Sun", sx, cy + 16, { size: 10, align: "center", color: ink });
      } else {
        text(ctx, s.phase * 180 / Math.PI > 90 ? "Sun in the glare" : "Sun behind the sketch", cx, cy + Rmax + 16, { size: 10, align: "center", color: muted });
      }
      text(ctx, copy.phase + " · " + s.litPct + "%", 12, 16, { size: 11, align: "left", color: accent });
      text(ctx, copy.disk, cssW - 12, 16, { size: 10, align: "right", color: muted });
      text(ctx, "west", 12, p.moons ? cssH - 52 : cssH - 14, { size: 10, align: "left", color: muted });
      text(ctx, "east", (p.limbZoom ? cssW * 0.62 : cssW) - 12, p.moons ? cssH - 52 : cssH - 14, { size: 10, align: "right", color: muted });

      if (p.limbZoom) {
        var thick = R * (1 - Math.cos(s.phase));
        var zoom = clamp(thick > 0.15 ? 14 / thick : 8, 3, 8);
        var box = Math.min(cssW * 0.28, cssH * 0.42, 120);
        var bx = cssW - box - 16;
        var by = cssH * 0.28;
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, box, box);
        ctx.strokeStyle = line;
        ctx.stroke();
        ctx.clip();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(bx, by, box, box);
        var darkSign = sign === 0 ? 1 : sign;
        var focusX = cx + darkSign * R * Math.cos(s.phase) * -1;
        if (sign === 0) focusX = cx + R * 0.92;
        else focusX = cx - sign * R * 0.92;
        var focusY = cy;
        ctx.translate(bx + box / 2, by + box / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-focusX, -focusY);
        paintDisk(ctx, cx, cy, R, s.phase, sign === 0 ? 1 : sign, p.lit, p.night, { bands: p.bands, scale: 2 });
        ctx.restore();
        text(ctx, "×" + zoom.toFixed(0) + " dark limb", bx + box / 2, by - 10, { size: 10, align: "center", color: muted });
      }

      if (p.moons) {
        drawMoonRow(ctx, cssW, cssH, s.phase, sign === 0 ? 1 : sign, state.t, p.moons, [210, 206, 196], [40, 40, 44]);
      }

      phaseCanvas.setAttribute("aria-label",
        p.name + " as seen from Earth. " + copy.phase + ". " + s.litPct + " percent lit. " + copy.sky +
        ". Phase angle " + copy.angle + ". Educational cartoon, not a finder chart.");
    }

    function render() {
      state.t = wrapDay(state.t, p.synodic);
      var s = snapshot(state.t, p);
      var copy = copyFor(p, s);
      var set = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      set("r-tier", copy.tier);
      set("r-title", copy.title);
      set("r-range", copy.range);
      set("r-phase", copy.phase);
      set("r-lit", s.litPct + "%");
      set("r-sky", copy.sky);
      set("r-line", copy.line);
      set("r-angle", copy.angle);
      set("r-disk", copy.disk);
      set("r-day", copy.day);
      set("r-why", copy.why);
      set("r-min", p.kind === "superior" ? (s.lim.minLitPct + "% at " + s.lim.maxPhaseDeg + "°") : "0% at inferior · cartoon");
      var lapVal = document.getElementById("lap-val");
      if (lapVal) lapVal.textContent = dayLabel(state.t, p.synodic);
      if (slider) {
        slider.min = "0";
        slider.max = String(p.synodic);
        slider.value = String(state.t);
        slider.setAttribute("aria-valuemin", "0");
        slider.setAttribute("aria-valuemax", String(Math.round(p.synodic)));
        slider.setAttribute("aria-valuenow", String(dayNum(state.t, p.synodic)));
        slider.setAttribute("aria-valuetext", copy.slider);
      }
      var shown = s.preset;
      jumpBtns.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.jump === shown));
      });
      if (playBtn) {
        playBtn.setAttribute("aria-pressed", String(state.playing));
        playBtn.textContent = state.playing ? "Pause" : "Play";
      }
      var cssW = orbitCanvas.clientWidth || 880;
      drawOrbit(cssW);
      drawPhase(phaseCanvas.clientWidth || cssW);
      renderCraft();
    }

    function stopPlay() {
      state.playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastT = 0;
    }
    function frame(now) {
      if (!state.playing) return;
      if (!lastT) lastT = now;
      var dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      state.t = wrapDay(state.t + dt * PLAY, p.synodic);
      render();
      raf = requestAnimationFrame(frame);
    }

    if (slider) {
      slider.addEventListener("input", function () {
        stopPlay();
        state.t = clamp(parseFloat(slider.value) || 0, 0, p.synodic);
        render();
      });
    }
    jumpBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        stopPlay();
        var which = b.dataset.jump;
        if (pre[which] != null) state.t = pre[which];
        render();
      });
    });
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        if (state.playing) {
          stopPlay();
          render();
          return;
        }
        state.playing = true;
        lastT = 0;
        render();
        raf = requestAnimationFrame(frame);
      });
    }

    var craftCanvas = document.getElementById("craft");
    var craftSlider = document.getElementById("craft-ang");
    function setCraft(deg) {
      state.craft = clamp(deg, -180, 180);
      if (state.craft > 180) state.craft -= 360;
      render();
    }
    function psiFromEvent(e) {
      if (!craftLayout) return state.craft;
      var rect = craftCanvas.getBoundingClientRect();
      var x = e.clientX - rect.left - craftLayout.cx;
      var y = e.clientY - rect.top - craftLayout.cy;
      var mx = x;
      var my = -y;
      var psi = Math.atan2(-my, -mx);
      var deg = psi * 180 / Math.PI;
      if (deg > 180) deg -= 360;
      if (deg < -180) deg += 360;
      return deg;
    }
    if (craftCanvas) {
      craftCanvas.addEventListener("pointerdown", function (e) {
        craftCanvas.setPointerCapture(e.pointerId);
        setCraft(psiFromEvent(e));
      });
      craftCanvas.addEventListener("pointermove", function (e) {
        if (e.buttons) setCraft(psiFromEvent(e));
      });
    }
    if (craftSlider) {
      craftSlider.addEventListener("input", function () {
        setCraft(parseFloat(craftSlider.value) || 0);
      });
    }
    [].slice.call(document.querySelectorAll("[data-craft]")).forEach(function (b) {
      b.addEventListener("click", function () {
        var which = b.getAttribute("data-craft");
        if (which === "earth") {
          var s = snapshot(state.t, p);
          setCraft(signedFromSun(s.theta, p.ratio) * 180 / Math.PI);
          return;
        }
        setCraft(parseFloat(which));
      });
    });

    root.addEventListener("resize", render);
    if (root.ResizeObserver) {
      new ResizeObserver(function () { render(); }).observe(orbitCanvas.parentElement || orbitCanvas);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(); });
    api._rerender = render;
    render();
    return { render: render, state: state, planet: p };
  }

  function fillComparison(host) {
    if (!host) return;
    wireThemes();
    var order = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"];
    host.innerHTML = "";
    order.forEach(function (id) {
      var p = PLANETS[id];
      var lim = limits(p);
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = p.href;
      var kind = p.kind === "inferior" ? "Inferior · inside Earth’s orbit" : "Superior · outside Earth’s orbit";
      var seen = p.kind === "inferior"
        ? ("Crescent to full on these circles. Greatest elongation " + lim.elongDeg + "°, the arcsine of " + p.ratio + ". A real conjunction usually misses, inclination " + p.inclination + "°.")
        : ("Gibbous to full. Minimum " + lim.minLitPct + "% lit at phase angle " + lim.maxPhaseDeg + "°, from the ratio " + p.ratio + ".");
      a.innerHTML = '<p class="n"></p><h3></h3><p class="fig"></p><p class="seen"></p>';
      a.querySelector(".n").textContent = kind;
      a.querySelector("h3").textContent = p.name;
      a.querySelector(".fig").textContent = p.ratio + " × Earth’s orbit · synodic " + p.synodic + " d";
      a.querySelector(".seen").textContent = seen;
      li.appendChild(a);
      host.appendChild(li);
    });
  }

  function selfCheck() {
    var errors = [];
    function near(a, b, tol, msg) {
      if (Math.abs(a - b) > tol) errors.push(msg + " (" + a + " vs " + b + ")");
    }
    var ids = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"];
    ids.forEach(function (id) {
      var p = PLANETS[id];
      var pre = presetsFor(p);
      var lim = limits(p);
      if (p.kind === "inferior") {
        near(phaseAngleRad(thetaOf(pre.inferior, p), p.ratio) * 180 / Math.PI, 180, 0.02, id + " inferior phase");
        near(phaseAngleRad(thetaOf(pre.superior, p), p.ratio) * 180 / Math.PI, 0, 0.02, id + " superior phase");
        near(phaseAngleRad(thetaOf(pre.east, p), p.ratio) * 180 / Math.PI, 90, 0.05, id + " east phase");
        near(Math.abs(elongationRad(thetaOf(pre.east, p), p.ratio)) * 180 / Math.PI, parseFloat(lim.elongDeg), 0.02, id + " east elong");
        if (elongationRad(thetaOf(pre.east, p), p.ratio) <= 0) errors.push(id + " east should be evening");
        if (elongationRad(thetaOf(pre.west, p), p.ratio) >= 0) errors.push(id + " west should be morning");
      } else {
        near(phaseAngleRad(thetaOf(pre.opposition, p), p.ratio) * 180 / Math.PI, 0, 0.02, id + " opposition phase");
        near(phaseAngleRad(thetaOf(pre.conjunction, p), p.ratio) * 180 / Math.PI, 0, 0.05, id + " conjunction phase");
        var q = phaseAngleRad(thetaOf(pre.east, p), p.ratio);
        near(q, maxPhaseRad(p.ratio), 1e-9, id + " quadrature is max phase");
        near(litFraction(q) * 100, parseFloat(lim.minLitPct), 0.011, id + " min lit rounding");
        near(Math.abs(elongationRad(thetaOf(pre.east, p), p.ratio)) * 180 / Math.PI, 90, 0.05, id + " east quad elong");
        var earth = Math.abs(signedFromSun(thetaOf(pre.east, p), p.ratio));
        near(earth, q, 1e-9, id + " signed phase matches");
        if (Math.abs(signedFromSun(thetaOf(0.3 * p.synodic, p), p.ratio)) > maxPhaseRad(p.ratio) + 1e-9) {
          errors.push(id + " earth left the wedge");
        }
      }
    });
    var j = limits(PLANETS.jupiter);
    near(parseFloat(j.maxPhaseDeg), 11.08, 0.001, "jupiter max deg label");
    near(parseFloat(j.minLitPct), 99.07, 0.001, "jupiter min lit label");
    var m = limits(PLANETS.mars);
    near(parseFloat(m.maxPhaseDeg), 41.01, 0.001, "mars max deg label");
    near(parseFloat(m.minLitPct), 87.73, 0.001, "mars min lit label");
    var mer = snapshot(findEveningCrescent(PLANETS.mercury), PLANETS.mercury);
    near(parseFloat(mer.phaseDeg), 120, 0.2, "mercury crescent start");
    if (mer.word !== "Crescent") errors.push("mercury start word " + mer.word);
    if (litFraction(120 * Math.PI / 180) > 0.5) errors.push("120 deg should be crescent fraction");
    return errors;
  }

  var api = {
    planets: PLANETS,
    limits: limits,
    litFraction: litFraction,
    maxPhaseRad: maxPhaseRad,
    phaseAngleRad: phaseAngleRad,
    presetsFor: presetsFor,
    thetaOf: thetaOf,
    snapshot: snapshot,
    mount: mount,
    fillComparison: fillComparison,
    wireThemes: wireThemes,
    selfCheck: selfCheck,
    _rerender: null
  };
  root.SPPlanetPhases = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
