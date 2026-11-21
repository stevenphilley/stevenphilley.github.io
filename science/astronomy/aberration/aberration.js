/*! Aberration of starlight.
    Annual aberration and the special-relativistic angle.
    Educational schematic. Not an astrometric reduction.

    c = 299,792.458 km/s exactly (299,792,458 m/s).
    The Earth Fact Sheet prints a mean orbital velocity of 29.78 km/s.
    The first-order shift at a right angle to that velocity is (v/c)
    in radians, converted to arcseconds on the page.
    The IAU (1976) constant of aberration for epoch 2000, printed in
    USNO Circular 163, is κ = 20.49552″. It is not replaced by the
    fact-sheet quotient, and the quotient is not replaced by κ.

    Classical tan: tan θ′ = sin θ / (β + cos θ).
    Relativistic:  cos θ′ = (cos θ + β) / (1 + β cos θ),
    which is the same angle as tan θ′ = sin θ / (γ (β + cos θ)).
    θ is the angle between the velocity and the star’s geometric
    direction. θ′ is the apparent angle from the same velocity.
    The shift toward the velocity is θ − θ′.

    The sky figure uses κ, not the speed slider. On the sky,
    x is parallel to the ecliptic (increasing longitude) and y is
    toward the north ecliptic pole, both in arcseconds.
    Aberration: x = −κ cos φ, y = −κ sin β_ecl sin φ.
    Parallax:   x =  π sin φ, y = −π sin β_ecl cos φ.
    φ is the Sun’s ecliptic longitude minus the star’s. The two
    paths are a quarter-year apart: the aberration point at φ is
    the parallax point at φ − 90°, scaled by κ/π. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Aberration = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var C_KM_S = 299792.458;
  var ARCSEC_PER_RAD = (180 / Math.PI) * 3600;
  var KAPPA_AS = 20.49552;
  var V_EARTH_MEAN = 29.78;
  var R_EQ_KM = 6378.137;
  var SIDEREAL_H = 23.9345;
  var V_VOYAGER = 17.0;
  var SUN_GM = 132712 * 1e6;
  var EARTH_A_KM = 149.598 * 1e6;
  var EARTH_RP_KM = 147.095 * 1e6;
  var EARTH_RA_KM = 152.100 * 1e6;
  var SHEET_VP = 30.29;
  var SHEET_VA = 29.29;
  var GAMMA_DRA_MAS = 21.14;
  var GAMMA_DRA_ERR_MAS = 0.10;
  var REL_BETA = 0.9;
  var V_MIN = 0.1;
  var V_MAX = REL_BETA * C_KM_S;
  var THETA_MIN = 0;
  var THETA_MAX = 180;
  var LAT_MIN = -90;
  var LAT_MAX = 90;
  var DIST_MIN = 0.01;
  var DIST_MAX = 100000;
  var YEAR_DAYS = 365;

  var SUP = {
    "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
  };

  var LIMITS = "Educational schematic. Not an astrometric reduction tool. The sky figure is a circular orbit and the IAU constant of aberration. It ignores nutation, gravitational light deflection, planetary aberration, the few thousand kilometres between a telescope and Earth’s center, and the eccentricity of Earth’s orbit. The speed slider is a classroom angle, not a catalog place.";

  function sup(exp) {
    return String(exp).split("").map(function (ch) { return SUP[ch] || ch; }).join("");
  }

  function sci(x, n) {
    if (!isFinite(x)) return "";
    if (x === 0) return "0";
    var sign = x < 0 ? "−" : "";
    var ax = Math.abs(x);
    var exp = Math.floor(Math.log10(ax));
    var man = ax / Math.pow(10, exp);
    var m = man.toFixed(n - 1);
    if (Number(m) >= 10) {
      m = (Number(m) / 10).toFixed(n - 1);
      exp += 1;
    }
    if (exp === 0) return sign + m;
    return sign + m + " × 10" + sup(exp);
  }

  function same(a, b) {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function group(n, digits) {
    var neg = n < 0;
    var s = Math.abs(n).toFixed(digits);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "−" : "") + parts.join(".");
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function inRange(v, lo, hi) {
    return typeof v === "number" && isFinite(v) && v >= lo && v <= hi;
  }

  function parseNum(raw) {
    var t = String(raw == null ? "" : raw).trim().replace(/,/g, "").replace(/\u2212/g, "-").replace(/\s/g, "");
    if (!t || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(t)) return NaN;
    return Number(t);
  }

  function logMap(u, lo, hi) {
    var t = clamp(u, 0, 1);
    if (t === 0) return lo;
    if (t === 1) return hi;
    return Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo)));
  }

  function logUnmap(v, lo, hi) {
    if (!(v > 0)) return 0;
    var t = (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return clamp(t, 0, 1);
  }

  function visViva(mu, rKm, aKm) {
    return Math.sqrt(mu * (2 / rKm - 1 / aKm));
  }

  function equatorialSpeed() {
    return 2 * Math.PI * R_EQ_KM / (SIDEREAL_H * 3600);
  }

  function earthPeriSpeed() {
    return visViva(SUN_GM, EARTH_RP_KM, EARTH_A_KM);
  }

  function earthApoSpeed() {
    return visViva(SUN_GM, EARTH_RA_KM, EARTH_A_KM);
  }

  function gammaDraParallaxArcsec() {
    return GAMMA_DRA_MAS / 1000;
  }

  function gammaDraDistancePc() {
    return 1000 / GAMMA_DRA_MAS;
  }

  function parallaxArcsec(distancePc) {
    if (!(distancePc > 0)) return NaN;
    return 1 / distancePc;
  }

  function formatSpeed(v) {
    if (!isFinite(v)) return "";
    if (same(v, V_EARTH_MEAN)) return "29.78 km/s";
    if (same(v, V_VOYAGER)) return "17.0 km/s";
    if (same(v, SHEET_VP)) return "30.29 km/s";
    if (same(v, SHEET_VA)) return "29.29 km/s";
    if (v >= 1000) return group(v, 3) + " km/s";
    if (v < 1) return group(v, 6) + " km/s";
    return group(v, 3) + " km/s";
  }

  function formatAngle(arcsec) {
    if (!isFinite(arcsec)) return "";
    if (arcsec === 0) return "0″";
    var sign = arcsec < 0 ? "−" : "";
    var a = Math.abs(arcsec);
    if (a >= 3600) return sign + group(a / 3600, 5) + "°";
    return sign + group(a, 5) + "″";
  }

  function formatTiny(arcsec) {
    if (!isFinite(arcsec)) return "";
    if (arcsec === 0) return "0″";
    var a = Math.abs(arcsec);
    if (a < 1e-4) return (arcsec < 0 ? "−" : "") + sci(a, 4) + "″";
    return formatAngle(arcsec);
  }

  function formatBeta(beta) {
    if (!isFinite(beta)) return "";
    if (beta === 0) return "0";
    if (beta >= 0.001) return group(beta, 6);
    return sci(beta, 6);
  }

  function formatDeg(deg) {
    if (!isFinite(deg)) return "";
    var sign = deg < 0 ? "−" : "";
    return sign + group(Math.abs(deg), Math.abs(deg) >= 100 ? 1 : (Math.abs(deg) % 1 === 0 ? 0 : 2)) + "°";
  }

  function formatPlainDeg(deg) {
    if (!isFinite(deg)) return "";
    var sign = deg < 0 ? "−" : "";
    var a = Math.abs(deg);
    var digits = a >= 10 && Math.abs(a - Math.round(a)) < 1e-9 ? 0 : 2;
    if (Math.abs(a - Math.round(a)) < 1e-9) digits = 0;
    return sign + group(a, digits) + "°";
  }

  function toRad(deg) {
    return deg * Math.PI / 180;
  }

  function classicalArcsec(vKmS, thetaDeg) {
    if (!(vKmS >= 0) || !isFinite(thetaDeg)) return NaN;
    return (vKmS / C_KM_S) * Math.sin(toRad(thetaDeg)) * ARCSEC_PER_RAD;
  }

  function galileanArcsec(vKmS, thetaDeg) {
    var beta = vKmS / C_KM_S;
    if (!(beta >= 0) || beta >= 1 || !isFinite(thetaDeg)) return NaN;
    var th = toRad(thetaDeg);
    var tp = Math.atan2(Math.sin(th), beta + Math.cos(th));
    if (tp < 0) tp += 2 * Math.PI;
    return (th - tp) * ARCSEC_PER_RAD;
  }

  function relativisticThetaRad(thetaDeg, beta) {
    var th = toRad(thetaDeg);
    var c = Math.cos(th);
    var cosTp = (c + beta) / (1 + beta * c);
    if (cosTp > 1) cosTp = 1;
    if (cosTp < -1) cosTp = -1;
    return Math.acos(cosTp);
  }

  function relativisticArcsec(vKmS, thetaDeg) {
    var beta = vKmS / C_KM_S;
    if (!(beta >= 0) || beta >= 1 || !isFinite(thetaDeg)) return NaN;
    var th = toRad(thetaDeg);
    return (th - relativisticThetaRad(thetaDeg, beta)) * ARCSEC_PER_RAD;
  }

  function relativisticTanArcsec(vKmS, thetaDeg) {
    var beta = vKmS / C_KM_S;
    if (!(beta >= 0) || beta >= 1 || !isFinite(thetaDeg)) return NaN;
    var th = toRad(thetaDeg);
    var gamma = 1 / Math.sqrt(1 - beta * beta);
    var tp = Math.atan2(Math.sin(th), gamma * (beta + Math.cos(th)));
    if (tp < 0) tp += 2 * Math.PI;
    return (th - tp) * ARCSEC_PER_RAD;
  }

  function sinLat(betaEclDeg) {
    return Math.sin(toRad(betaEclDeg));
  }

  /* amp is κ or π, in arcseconds. kind is "aberration" or "parallax". */
  function displacement(amp, betaEclDeg, phiDeg, kind) {
    var phi = toRad(phiDeg);
    var s = sinLat(betaEclDeg);
    if (kind === "parallax") {
      return {
        x: amp * Math.sin(phi),
        y: -amp * s * Math.cos(phi)
      };
    }
    return {
      x: -amp * Math.cos(phi),
      y: -amp * s * Math.sin(phi)
    };
  }

  function axes(amp, betaEclDeg) {
    var minor = Math.abs(amp * sinLat(betaEclDeg));
    return { semiMajor: Math.abs(amp), semiMinor: minor };
  }

  function pathShape(betaEclDeg) {
    var s = Math.abs(sinLat(betaEclDeg));
    if (s > 1 - 1e-9) return "circle";
    if (s < 1e-9) return "line";
    return "ellipse";
  }

  function phiDeg(day) {
    var d = ((day % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS;
    return d / YEAR_DAYS * 360;
  }

  function presetSpeed(id) {
    if (id === "mean") return V_EARTH_MEAN;
    if (id === "peri") return earthPeriSpeed();
    if (id === "apo") return earthApoSpeed();
    if (id === "equator") return equatorialSpeed();
    if (id === "voyager") return V_VOYAGER;
    if (id === "rel") return V_MAX;
    return NaN;
  }

  function matchPreset(v) {
    var ids = ["mean", "peri", "apo", "equator", "voyager", "rel"];
    var i;
    for (i = 0; i < ids.length; i++) {
      if (same(v, presetSpeed(ids[i]))) return ids[i];
    }
    return "";
  }

  function presetLabel(id) {
    if (id === "mean") return "Earth mean";
    if (id === "peri") return "Perihelion";
    if (id === "apo") return "Aphelion";
    if (id === "equator") return "Equator";
    if (id === "voyager") return "Voyager 1";
    if (id === "rel") return "0.9c";
    return "";
  }

  function samples(betaEclDeg, count) {
    var n = count || 181;
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      var phi = i / (n - 1) * 360;
      out.push({
        phi: phi,
        aberration: displacement(KAPPA_AS, betaEclDeg, phi, "aberration"),
        parallaxUnit: displacement(1, betaEclDeg, phi, "parallax")
      });
    }
    return out;
  }

  function divergeSamples(thetaDeg, count) {
    var n = count || 81;
    var out = [];
    var i;
    var lo = Math.log(1e-4);
    var hi = Math.log(REL_BETA);
    for (i = 0; i < n; i++) {
      var beta = Math.exp(lo + (hi - lo) * (i / (n - 1)));
      var v = beta * C_KM_S;
      out.push({
        beta: beta,
        classical: classicalArcsec(v, thetaDeg),
        galilean: galileanArcsec(v, thetaDeg),
        relativistic: relativisticArcsec(v, thetaDeg)
      });
    }
    return out;
  }

  function scene(o) {
    o = o || {};
    var preset = o.preset != null ? String(o.preset) : "mean";
    var v = o.v;
    if (o.preset && o.v == null) v = presetSpeed(preset);
    if (v == null) v = V_EARTH_MEAN;
    var theta = o.theta == null ? 90 : o.theta;
    var betaEcl = o.betaEcl == null ? 90 : o.betaEcl;
    var distance = o.distancePc == null ? gammaDraDistancePc() : o.distancePc;
    var day = o.day == null ? 0 : o.day;
    if (preset && o.preset && o.v == null && !isFinite(presetSpeed(preset))) {
      return { ok: false, error: "That preset is not on this page.", limits: LIMITS };
    }
    if (!inRange(v, V_MIN, V_MAX)) {
      return { ok: false, error: "Speed from 0.1 km/s to 0.9c (" + formatSpeed(V_MAX) + ").", limits: LIMITS };
    }
    if (!inRange(theta, THETA_MIN, THETA_MAX)) {
      return { ok: false, error: "θ from 0° to 180°.", limits: LIMITS };
    }
    if (!inRange(betaEcl, LAT_MIN, LAT_MAX)) {
      return { ok: false, error: "Ecliptic latitude from −90° to 90°.", limits: LIMITS };
    }
    if (!inRange(distance, DIST_MIN, DIST_MAX)) {
      return { ok: false, error: "Distance from 0.01 pc to 100,000 pc.", limits: LIMITS };
    }
    if (!isFinite(day)) {
      return { ok: false, error: "The day is not a number.", limits: LIMITS };
    }
    day = ((day % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS;
    var id = o.preset && o.v == null ? preset : matchPreset(v);
    var beta = v / C_KM_S;
    var classical = classicalArcsec(v, theta);
    var galilean = galileanArcsec(v, theta);
    var relativistic = relativisticArcsec(v, theta);
    var pi = parallaxArcsec(distance);
    var phi = phiDeg(day);
    var ab = displacement(KAPPA_AS, betaEcl, phi, "aberration");
    var par = displacement(pi, betaEcl, phi, "parallax");
    var ax = axes(KAPPA_AS, betaEcl);
    var shape = pathShape(betaEcl);
    var onDra = same(distance, gammaDraDistancePc());
    var parallaxText = formatAngle(pi);
    var meanClass = classicalArcsec(V_EARTH_MEAN, 90);
    var eq = equatorialSpeed();
    var diurnal = classicalArcsec(eq, 90);
    var ratio = KAPPA_AS / gammaDraParallaxArcsec();
    var shapeWords = shape === "circle" ? "a circle of radius κ" : (shape === "line" ? "a line of half-length κ" : "an ellipse");
    var phase = "Day " + group(day, 1) + " of a 365-day classroom year. φ = " + formatPlainDeg(phi) + ". Aberration sits on the velocity. Parallax sits toward the Sun. Those two directions are a quarter-year apart.";
    var diverge = relativistic - classical;
    var text = {
      speed: formatSpeed(v),
      beta: formatBeta(beta),
      theta: formatPlainDeg(theta),
      classical: formatAngle(classical),
      galilean: formatAngle(galilean),
      relativistic: formatAngle(relativistic),
      delta: formatTiny(diverge),
      kappa: formatAngle(KAPPA_AS),
      meanClassical: formatAngle(meanClass),
      peri: formatSpeed(earthPeriSpeed()),
      apo: formatSpeed(earthApoSpeed()),
      equator: formatSpeed(eq),
      diurnal: formatAngle(diurnal),
      voyager: formatSpeed(V_VOYAGER),
      relSpeed: formatSpeed(V_MAX),
      parallax: parallaxText,
      parallaxExact: parallaxText,
      distance: group(distance, onDra ? 4 : (distance >= 100 ? 1 : 4)) + " pc",
      ratio: group(ratio, 3),
      semiMajor: formatAngle(ax.semiMajor),
      semiMinor: formatAngle(ax.semiMinor),
      shape: shapeWords,
      phase: phase,
      lat: formatPlainDeg(betaEcl),
      preset: presetLabel(id)
    };
    text.why = why(id, v, theta, classical, galilean, relativistic, diverge);
    text.sky = skyNote(shape, ax, pi, onDra, distance);
    text.aria = aria(text, shape, day);
    return {
      ok: true,
      v: v,
      theta: theta,
      beta: beta,
      betaEcl: betaEcl,
      distancePc: distance,
      day: day,
      phi: phi,
      preset: id,
      classical: classical,
      galilean: galilean,
      relativistic: relativistic,
      parallax: pi,
      aberrationPoint: ab,
      parallaxPoint: par,
      axes: ax,
      shape: shape,
      limits: LIMITS,
      text: text
    };
  }

  function why(id, v, theta, classical, galilean, relativistic, diverge) {
    var head;
    if (id === "mean") {
      head = "Earth’s mean orbital velocity on the fact sheet is 29.78 km/s. c is 299,792.458 km/s.";
    } else if (id === "peri") {
      head = "Perihelion uses the vis-viva speed at the fact sheet’s 147.095 × 10⁶ km, " + formatSpeed(earthPeriSpeed()) + ". The sheet lists a maximum orbital velocity of 30.29 km/s. " + formatSpeed(earthPeriSpeed()) + " rounds to 30.29. The sheet’s 30.29 is not substituted.";
    } else if (id === "apo") {
      head = "Aphelion uses the vis-viva speed at the fact sheet’s 152.100 × 10⁶ km, " + formatSpeed(earthApoSpeed()) + ". The sheet lists a minimum orbital velocity of 29.29 km/s. " + formatSpeed(earthApoSpeed()) + " rounds to 29.29. The sheet’s 29.29 is not substituted.";
    } else if (id === "equator") {
      head = "The equator button is diurnal aberration. The fact sheet’s equatorial radius is 6,378.137 km and the sidereal rotation period is 23.9345 hours. The circumference over that period is " + formatSpeed(equatorialSpeed()) + ".";
    } else if (id === "voyager") {
      head = "Voyager 1 is the NASA Science figure for 21 August 2024: 17.0 km/s relative to the Sun, the same sentence as 38,026.79 mph. It is a heliocentric speed on that date, not a new measurement.";
    } else if (id === "rel") {
      head = "0.9c is 0.9 times 299,792.458 km/s, which is " + formatSpeed(V_MAX) + ". The first-order product (v/c) sin θ is no longer a small angle.";
    } else {
      head = "The speed is " + formatSpeed(v) + ", typed or slid. It is not a named preset.";
    }
    var tail = " At θ = " + formatPlainDeg(theta) + ", first-order (v/c) sin θ is " + formatAngle(classical) + ". The classical tan formula gives " + formatAngle(galilean) + ". The relativistic formula gives " + formatAngle(relativistic) + ". Relativistic minus first-order is " + formatTiny(diverge) + ".";
    if (Math.abs(relativistic - classical) < 0.0001) {
      tail += " At this speed the three angles agree through the arcsecond digits this page prints. They are not averaged.";
    } else {
      tail += " At this β the three angles do not agree. The chart is that split. They are not averaged.";
    }
    if (!same(theta, 90)) {
      tail += " The constant of aberration is the θ = 90° amplitude. This θ is not 90°.";
    }
    return head + tail;
  }

  function skyNote(shape, ax, pi, onDra, distance) {
    var who = onDra
      ? "γ Draconis, Hipparcos parallax 21.14 mas (" + group(gammaDraParallaxArcsec(), 5) + "″, " + group(gammaDraDistancePc(), 4) + " pc),"
      : "the distance on the slider (" + group(distance, distance >= 100 ? 1 : 4) + " pc, annual parallax " + formatAngle(pi) + "),";
    var geom = shape === "circle"
      ? "At the ecliptic pole the aberration path is a circle of radius " + formatAngle(ax.semiMajor) + "."
      : (shape === "line"
        ? "On the ecliptic the aberration path is a line of half-length " + formatAngle(ax.semiMajor) + "."
        : "The aberration ellipse has semi-axis " + formatAngle(ax.semiMajor) + " parallel to the ecliptic and semi-minor axis " + formatAngle(ax.semiMinor) + ", which is κ |sin β|.");
    return geom + " The parallax ellipse of " + who + " is drawn at the same scale. κ divided by 0.02114″ is " + group(KAPPA_AS / gammaDraParallaxArcsec(), 3) + ". Zoom in to see the parallax ellipse. The parallax arrow points toward the Sun. The aberration arrow points along Earth’s velocity.";
  }

  function aria(text, shape, day) {
    return "Annual aberration path, " + text.shape + ". Semi-axis " + text.semiMajor + ", semi-minor " + text.semiMinor + ". Parallax " + text.parallaxExact + " at the same scale. Classroom day " + group(day, 1) + ". First-order shift " + text.classical + ". Relativistic shift " + text.relativistic + ".";
  }

  return {
    C_KM_S: C_KM_S,
    ARCSEC_PER_RAD: ARCSEC_PER_RAD,
    KAPPA_AS: KAPPA_AS,
    V_EARTH_MEAN: V_EARTH_MEAN,
    R_EQ_KM: R_EQ_KM,
    SIDEREAL_H: SIDEREAL_H,
    V_VOYAGER: V_VOYAGER,
    SUN_GM: SUN_GM,
    EARTH_A_KM: EARTH_A_KM,
    EARTH_RP_KM: EARTH_RP_KM,
    EARTH_RA_KM: EARTH_RA_KM,
    SHEET_VP: SHEET_VP,
    SHEET_VA: SHEET_VA,
    GAMMA_DRA_MAS: GAMMA_DRA_MAS,
    GAMMA_DRA_ERR_MAS: GAMMA_DRA_ERR_MAS,
    REL_BETA: REL_BETA,
    V_MIN: V_MIN,
    V_MAX: V_MAX,
    YEAR_DAYS: YEAR_DAYS,
    LIMITS: LIMITS,
    equatorialSpeed: equatorialSpeed,
    earthPeriSpeed: earthPeriSpeed,
    earthApoSpeed: earthApoSpeed,
    visViva: visViva,
    gammaDraParallaxArcsec: gammaDraParallaxArcsec,
    gammaDraDistancePc: gammaDraDistancePc,
    parallaxArcsec: parallaxArcsec,
    classicalArcsec: classicalArcsec,
    galileanArcsec: galileanArcsec,
    relativisticArcsec: relativisticArcsec,
    relativisticTanArcsec: relativisticTanArcsec,
    relativisticThetaRad: relativisticThetaRad,
    displacement: displacement,
    axes: axes,
    pathShape: pathShape,
    phiDeg: phiDeg,
    samples: samples,
    divergeSamples: divergeSamples,
    presetSpeed: presetSpeed,
    formatSpeed: formatSpeed,
    formatAngle: formatAngle,
    formatTiny: formatTiny,
    formatBeta: formatBeta,
    parseNum: parseNum,
    logMap: logMap,
    logUnmap: logUnmap,
    scene: scene,
    sci: sci
  };
});
