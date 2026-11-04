/*! Binary stars: Kepler’s third law, the barycenter, and radial velocity.

    For a two-body ellipse, with a in AU, P in years, and mass in solar
    masses: M1 + M2 = a^3 / P^2. NASA’s Basics of Space Flight states the
    one-sun case as the square of the period proportional to the cube of
    the semi-major axis. The year, when a day count is converted, is
    365.256 days, Earth’s sidereal orbit period on the fact sheets the
    Kepler desk uses.

    The barycenter splits the relative axis: a1 = a * M2 / (M1 + M2),
    a2 = a * M1 / (M1 + M2). Each star’s circular speed for that axis is
    2π a_star / P. The radial-velocity semi-amplitude is
    K = (2π a_star / P) * |sin i| / sqrt(1 − e^2).
    The curve itself is K_signed * [cos(ν + ω) + e cos ω], with the sign
    of sin i. Positive is recession. Phase 0 is periastron.

    Speeds in km/s use the IAU 2012 astronomical unit, 149,597,870,700 m.
    A solar radius, when an axis is also printed in solar radii, is the
    IAU 2015 nominal solar radius, 6.957e8 m.

    Preset numbers are the printed values named in each preset. The
    geometric axis of a visual binary is a″ / π″. Nothing here is a
    stored orbit integration.

    Not an ephemeris and not a spectroscopic fit. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BinaryStars = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AU_M = 149597870700;
  var R_SUN_M = 6.957e8;
  var DAY_S = 86400;
  var YEAR_DAYS = 365.256;

  var M_MIN = 1e-8;
  var M_MAX = 200;
  var P_MIN = 1e-4;
  var P_MAX = 1e5;
  var A_MIN = 1e-4;
  var A_MAX = 1e5;
  var E_MAX = 0.99;
  var R_MAX = 2000;
  var T_MAX = 100000;

  /* Bond et al. 2017, ApJ 840, 70. Table 4 elements, Table 6 masses,
     Table 7 adopted parallax 0.3789″ and a_A = 2.4761″. */
  var SIRIUS = {
    id: "sirius",
    name1: "Sirius A",
    name2: "Sirius B",
    m1: 2.063,
    m2: 1.018,
    mode: "mass",
    aArcsec: 7.4957,
    parallaxArcsec: 0.3789,
    aPrimaryArcsec: 2.4761,
    periodYears: 50.1284,
    e: 0.59142,
    i: 136.336,
    omega: 149.161,
    citedTotal: 3.081,
    citedTotalErr: "0.034"
  };

  /* Akeson et al. 2021, AJ 162, 14, Table 8. Parallax is in mas. */
  var ACEN = {
    id: "acen",
    name1: "Alpha Centauri A",
    name2: "Alpha Centauri B",
    m1: 1.0788,
    m2: 0.9092,
    mode: "mass",
    aArcsec: 17.4930,
    parallaxMas: 750.81,
    periodYears: 79.762,
    e: 0.51947,
    i: 79.2430,
    omega: 231.519,
    r1: 1.2175,
    r2: 0.8591
  };

  /* Kolbas et al. 2015, MNRAS 451, 4150. Inner pair only.
     Period from Baron et al. 2012, as that paper adopts it.
     Inclination from Richards et al. 1988, as that paper adopts it.
     e and ω fixed at 0. Radii and temperatures are Table 5. */
  var ALGOL = {
    id: "algol",
    name1: "Algol A",
    name2: "Algol B",
    m1: 3.39,
    m2: 0.770,
    mode: "period",
    periodDays: 2.867328,
    e: 0,
    i: 81.4,
    omega: 0,
    r1: 2.87,
    r2: 3.43,
    t1: 12550,
    t2: 4900,
    citedARsun: 13.65,
    citedK1: 44.1,
    citedK2: 194.2
  };

  var EQUAL = {
    id: "equal",
    name1: "Star 1",
    name2: "Star 2",
    m1: 1,
    m2: 1,
    mode: "period",
    periodYears: 1,
    e: 0,
    i: 90,
    omega: 90
  };

  function presetById(id) {
    if (id === "sirius") return SIRIUS;
    if (id === "acen") return ACEN;
    if (id === "algol") return ALGOL;
    if (id === "equal") return EQUAL;
    return null;
  }

  function auPerYearToKms(auPerYear) {
    return auPerYear * AU_M / (YEAR_DAYS * DAY_S) / 1000;
  }

  function rsunToAu(rsun) {
    return rsun * R_SUN_M / AU_M;
  }

  function auToRsun(au) {
    return au * AU_M / R_SUN_M;
  }

  function geometricAu(arcsec, parallaxArcsec) {
    return arcsec / parallaxArcsec;
  }

  function totalMass(aAu, periodYears) {
    return (aAu * aAu * aAu) / (periodYears * periodYears);
  }

  function axisFromMass(mass, periodYears) {
    return Math.cbrt(mass * periodYears * periodYears);
  }

  function periodFromMass(mass, aAu) {
    return Math.sqrt((aAu * aAu * aAu) / mass);
  }

  function wrapPi(angle) {
    var x = angle % (2 * Math.PI);
    if (x > Math.PI) x -= 2 * Math.PI;
    if (x < -Math.PI) x += 2 * Math.PI;
    return x;
  }

  function eccentricFromMean(meanAnomaly, e) {
    var M = wrapPi(meanAnomaly);
    var E = e < 0.8 ? M : Math.PI;
    var n;
    for (n = 0; n < 50; n++) {
      var f = E - e * Math.sin(E) - M;
      var fp = 1 - e * Math.cos(E);
      if (fp === 0) break;
      var d = f / fp;
      E -= d;
      if (Math.abs(d) < 1e-14) break;
    }
    return E;
  }

  function trueAnomaly(E, e) {
    var cosE = Math.cos(E);
    var sinE = Math.sin(E);
    var denom = 1 - e * cosE;
    var cosf = (cosE - e) / denom;
    var sinf = Math.sqrt(Math.max(0, 1 - e * e)) * sinE / denom;
    return Math.atan2(sinf, cosf);
  }

  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }

  function fail(msg) {
    return { ok: false, error: msg };
  }

  function optionalPositive(n, label, max) {
    if (n == null || n === "") return { ok: true, value: null };
    if (!finite(n) || n < 0) return fail(label + " has to be a positive number, or left blank.");
    if (n === 0) return { ok: true, value: null };
    if (n > max) return fail(label + " is past the range of this desk.");
    return { ok: true, value: n };
  }

  function stateFromPreset(id) {
    var p = presetById(id);
    if (!p) return null;
    var periodYears = p.periodYears;
    if (p.periodDays != null) periodYears = p.periodDays / YEAR_DAYS;
    var aAu = null;
    if (p.aArcsec != null) {
      var pi = p.parallaxArcsec != null ? p.parallaxArcsec : p.parallaxMas / 1000;
      aAu = geometricAu(p.aArcsec, pi);
    }
    return {
      preset: p.id,
      mode: p.mode,
      name1: p.name1,
      name2: p.name2,
      m1: p.m1,
      m2: p.m2,
      periodYears: periodYears,
      aAu: aAu,
      e: p.e,
      i: p.i,
      omega: p.omega,
      r1: p.r1 == null ? null : p.r1,
      r2: p.r2 == null ? null : p.r2,
      t1: p.t1 == null ? null : p.t1,
      t2: p.t2 == null ? null : p.t2
    };
  }

  function normalize(raw) {
    if (!raw) return fail("Nothing to compute.");
    var mode = raw.mode;
    if (mode !== "period" && mode !== "axis" && mode !== "mass") {
      return fail("Choose whether the period, the axis, or the pair fixes the orbit.");
    }
    if (!finite(raw.m1) || raw.m1 < M_MIN || raw.m1 > M_MAX) {
      return fail("Star 1’s mass has to sit between " + M_MIN + " and " + M_MAX + " solar masses.");
    }
    if (!finite(raw.m2) || raw.m2 < M_MIN || raw.m2 > M_MAX) {
      return fail("Star 2’s mass has to sit between " + M_MIN + " and " + M_MAX + " solar masses.");
    }
    if (!finite(raw.e) || raw.e < 0 || raw.e > E_MAX) {
      return fail("Eccentricity has to sit between 0 and " + E_MAX + ".");
    }
    if (!finite(raw.i) || raw.i < 0 || raw.i > 180) {
      return fail("Inclination has to sit between 0° and 180°. 90° is edge-on.");
    }
    if (!finite(raw.omega) || raw.omega < 0 || raw.omega > 360) {
      return fail("Argument of periastron has to sit between 0° and 360°.");
    }
    var m1 = raw.m1;
    var m2 = raw.m2;
    var e = raw.e;
    var periodYears = raw.periodYears;
    var aAu = raw.aAu;
    if (mode === "period" || mode === "mass") {
      if (!finite(periodYears) || periodYears < P_MIN || periodYears > P_MAX) {
        return fail("The period has to sit between " + P_MIN + " and " + P_MAX + " years.");
      }
    }
    if (mode === "axis" || mode === "mass") {
      if (!finite(aAu) || aAu < A_MIN || aAu > A_MAX) {
        return fail("The semi-major axis has to sit between " + A_MIN + " and " + A_MAX + " AU.");
      }
    }
    var mBoxes = m1 + m2;
    var mKepler;
    if (mode === "period") {
      mKepler = mBoxes;
      aAu = axisFromMass(mBoxes, periodYears);
    } else if (mode === "axis") {
      mKepler = mBoxes;
      periodYears = periodFromMass(mBoxes, aAu);
    } else {
      mKepler = totalMass(aAu, periodYears);
      if (!(mKepler > 0) || mKepler > M_MAX * 4) {
        return fail("That axis and period give a mass this desk will not plot.");
      }
    }
    var r1 = optionalPositive(raw.r1, "Star 1’s radius", R_MAX);
    if (!r1.ok) return r1;
    var r2 = optionalPositive(raw.r2, "Star 2’s radius", R_MAX);
    if (!r2.ok) return r2;
    var t1 = optionalPositive(raw.t1, "Star 1’s temperature", T_MAX);
    if (!t1.ok) return t1;
    var t2 = optionalPositive(raw.t2, "Star 2’s temperature", T_MAX);
    if (!t2.ok) return t2;
    if ((r1.value == null) !== (r2.value == null)) {
      return fail("Enter both radii, or leave both blank. One radius is not an eclipse.");
    }
    var share1 = mKepler * (m1 / mBoxes);
    var share2 = mKepler * (m2 / mBoxes);
    return {
      ok: true,
      preset: raw.preset || null,
      mode: mode,
      name1: raw.name1 || "Star 1",
      name2: raw.name2 || "Star 2",
      m1: m1,
      m2: m2,
      mBoxes: mBoxes,
      mKepler: mKepler,
      mShare1: share1,
      mShare2: share2,
      aAu: aAu,
      a1: aAu * share2 / mKepler,
      a2: aAu * share1 / mKepler,
      periodYears: periodYears,
      periodDays: periodYears * YEAR_DAYS,
      e: e,
      i: raw.i,
      omega: raw.omega,
      r1: r1.value,
      r2: r2.value,
      t1: t1.value,
      t2: t2.value
    };
  }

  function signedK(aStarAu, periodYears, e, iDeg) {
    var circ = auPerYearToKms(2 * Math.PI * aStarAu / periodYears);
    return circ * Math.sin(iDeg * Math.PI / 180) / Math.sqrt(1 - e * e);
  }

  function endpointSpeed(aStarAu, periodYears, e, which) {
    var circ = auPerYearToKms(2 * Math.PI * aStarAu / periodYears);
    if (which === "peri") return circ * Math.sqrt((1 + e) / (1 - e));
    return circ * Math.sqrt((1 - e) / (1 + e));
  }

  /* Star 1 in the orbit plane, periastron along +x, focus at the barycenter.
     Star 2 is opposite. Sky axes: X along the line of nodes, Y on the sky,
     Z toward the observer. Z carries a minus so that ω = 0 puts periastron
     at the ascending node: the star is receding, and the radial velocity
     K [cos(ν+ω) + e cos ω] is positive. Recession is −dZ/dt. */
  function frame(norm, meanAnomaly) {
    var E = eccentricFromMean(meanAnomaly, norm.e);
    var f = trueAnomaly(E, norm.e);
    var r1 = norm.a1 * (1 - norm.e * norm.e) / (1 + norm.e * Math.cos(f));
    var x1 = r1 * Math.cos(f);
    var y1 = r1 * Math.sin(f);
    var scale = norm.a1 > 0 ? norm.a2 / norm.a1 : 0;
    var x2 = -scale * x1;
    var y2 = -scale * y1;
    var om = norm.omega * Math.PI / 180;
    var incl = norm.i * Math.PI / 180;
    function project(x, y) {
      var xr = x * Math.cos(om) - y * Math.sin(om);
      var yr = x * Math.sin(om) + y * Math.cos(om);
      return {
        X: xr,
        Y: yr * Math.cos(incl),
        Z: -yr * Math.sin(incl)
      };
    }
    var s1 = project(x1, y1);
    var s2 = project(x2, y2);
    var k1 = signedK(norm.a1, norm.periodYears, norm.e, norm.i);
    var k2 = signedK(norm.a2, norm.periodYears, norm.e, norm.i);
    var bracket = Math.cos(f + om) + norm.e * Math.cos(om);
    var sep = Math.sqrt((s1.X - s2.X) * (s1.X - s2.X) + (s1.Y - s2.Y) * (s1.Y - s2.Y));
    return {
      meanAnomaly: meanAnomaly,
      eccentric: E,
      trueAnomaly: f,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      sky1: s1,
      sky2: s2,
      sepAu: sep,
      rv1: k1 * bracket,
      rv2: -k2 * bracket
    };
  }

  function overlapArea(rA, rB, d) {
    if (!(rA > 0) || !(rB > 0)) return 0;
    var dist = Math.abs(d);
    if (dist >= rA + rB) return 0;
    if (dist <= Math.abs(rA - rB)) {
      var smaller = Math.min(rA, rB);
      return Math.PI * smaller * smaller;
    }
    var a2 = rA * rA;
    var b2 = rB * rB;
    var d2 = dist * dist;
    var alpha = Math.acos((d2 + a2 - b2) / (2 * dist * rA));
    var beta = Math.acos((d2 + b2 - a2) / (2 * dist * rB));
    var root = (-dist + rA + rB) * (dist + rA - rB) * (dist - rA + rB) * (dist + rA + rB);
    return a2 * alpha + b2 * beta - 0.5 * Math.sqrt(Math.max(0, root));
  }

  function fluxAt(norm, fr) {
    if (!(norm.r1 > 0) || !(norm.r2 > 0)) return null;
    var R1 = rsunToAu(norm.r1);
    var R2 = rsunToAu(norm.r2);
    var sb1 = 1;
    var sb2 = 1;
    if (norm.t1 > 0 && norm.t2 > 0) {
      sb1 = Math.pow(norm.t1, 4);
      sb2 = Math.pow(norm.t2, 4);
    }
    var L1 = sb1 * Math.PI * R1 * R1;
    var L2 = sb2 * Math.PI * R2 * R2;
    var area = overlapArea(R1, R2, fr.sepAu);
    var blocked = 0;
    if (area > 0) {
      var rearIs1 = fr.sky1.Z < fr.sky2.Z;
      blocked = area * (rearIs1 ? sb1 : sb2);
    }
    var total = L1 + L2;
    if (!(total > 0)) return null;
    return Math.max(0, (total - blocked) / total);
  }

  function track(norm, count) {
    var n = count || 360;
    var phases = new Array(n);
    var rv1 = new Array(n);
    var rv2 = new Array(n);
    var flux = new Array(n);
    var i;
    var minFlux = null;
    var minSep = Infinity;
    for (i = 0; i < n; i++) {
      var phase = i / (n - 1);
      var fr = frame(norm, phase * 2 * Math.PI);
      phases[i] = phase;
      rv1[i] = fr.rv1;
      rv2[i] = fr.rv2;
      var fl = fluxAt(norm, fr);
      flux[i] = fl;
      if (fl != null && (minFlux == null || fl < minFlux)) minFlux = fl;
      if (fr.sepAu < minSep) minSep = fr.sepAu;
    }
    return { phases: phases, rv1: rv1, rv2: rv2, flux: flux, minFlux: minFlux, minSepAu: minSep };
  }

  function commas(intPart) {
    return String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fixed(n, digits) {
    var s = Number(n).toFixed(digits);
    var parts = s.split(".");
    var sign = "";
    var head = parts[0];
    if (head.charAt(0) === "-") {
      sign = "-";
      head = head.slice(1);
    }
    return sign + commas(head) + (parts[1] ? "." + parts[1] : "");
  }

  function formatMass(n) {
    return fixed(n, 6);
  }

  function formatAu(n) {
    return fixed(n, 6) + " AU";
  }

  function formatKms(n) {
    return fixed(n, 3) + " km/s";
  }

  function formatDays(n) {
    return fixed(n, 6) + " days";
  }

  function formatYears(n) {
    return fixed(n, 6) + " years";
  }

  function trimNum(n) {
    return Number(n).toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }

  function limitsNote() {
    return "Two bodies and one ellipse. The total mass is a³/P² when a is in AU, P is in years, and the mass is in solar masses. A year, when a day count is converted, is 365.256 days, Earth’s sidereal orbit period on the NASA fact sheets the Kepler desk uses. The classical form is tied to the Gaussian year; 365.256 days is the unit this site already uses, and the difference is far smaller than the mass uncertainties quoted here. The center of mass splits the axis in the inverse ratio of the masses. Each star’s circular speed for its own axis is 2π a / P. Periastron and apastron speeds scale that by √((1+e)/(1−e)) and √((1−e)/(1+e)). The radial-velocity semi-amplitude is that circular speed times |sin i| / √(1−e²). The curve is offset by K e cos ω; K is half the peak-to-peak. One AU in one of these years is 29.785 km/s, from the IAU astronomical unit of 149,597,870,700 m. The top-down drawing is the orbit plane. Inclination does not squash it. The light curve, when both radii are set, is two uniform disks. Surface brightness goes as T⁴ only when both temperatures are set. No limb darkening, no Roche surface, and no third light. Not an ephemeris and not a spectroscopic orbit fit.";
  }

  function whyFor(norm, text, eclipsing) {
    var kLine = "K₁ is " + text.k1 + " and K₂ is " + text.k2 + ". |sin i| is " + text.sinI + ".";
    var speedLine = "The circular speeds for those axes are " + text.v1 + " and " + text.v2 + ".";
    if (norm.e > 1e-8) {
      speedLine += " At periastron they are " + text.v1peri + " and " + text.v2peri + ". At apastron they are " + text.v1ap + " and " + text.v2ap + ".";
    }
    var split = norm.name1 + "’s axis is " + text.a1 + " and " + norm.name2 + "’s is " + text.a2 + ". ";
    if (Math.abs(norm.m1 - norm.m2) / norm.mBoxes < 1e-6) {
      split += "The axes match because the masses match.";
    } else if (norm.m1 > norm.m2) {
      split += norm.name1 + " is heavier, so it sits closer to the barycenter.";
    } else {
      split += norm.name2 + " is heavier, so it sits closer to the barycenter.";
    }
    if (norm.preset === "sirius") {
      return "Sirius A and Sirius B. Bond et al. 2017, Table 4, print P = 50.1284 ± 0.0043 yr, a = 7.4957 ± 0.0025″, e = 0.59142 ± 0.00037, i = 136.336 ± 0.040°, and ω = 149.161 ± 0.075°. Table 7 adopts a parallax of 0.3789 ± 0.0014″ and an absolute semimajor axis for A of 2.4761 ± 0.0045″. The relative axis in AU is 7.4957 / 0.3789, which is " + text.a + ". Kepler’s a³/P² on that axis and period is " + text.mKepler + " solar masses. Table 6 prints 3.081 ± 0.034. The boxes are the Table 6 masses, 2.063 ± 0.023 and 1.018 ± 0.011, and the drawing splits the Kepler total in that ratio. " + split + " " + speedLine + " " + kLine + " Inclination 136.336° is retrograde; |sin i| equals sin 43.664°. Radii are not loaded, so this preset does not draw an eclipse. The paper’s orbit is two bodies.";
    }
    if (norm.preset === "acen") {
      return "Alpha Centauri A and B. Akeson et al. 2021, Table 8, print P = 79.762 ± 0.019 yr, a = 17.4930 ± 0.0096″, e = 0.51947 ± 0.00015, i = 79.2430 ± 0.0089°, and ω = 231.519 ± 0.027°. The parallax in that table is 750.81 ± 0.38 mas. The axis in AU is 17.4930 / 0.75081, which is " + text.a + ". Kepler’s a³/P² is " + text.mKepler + " solar masses. The same table prints 1.0788 ± 0.0029 and 0.9092 ± 0.0025, which sum to 1.9880. The drawing splits the Kepler total in that ratio. " + split + " " + speedLine + " " + kLine + " Table 8 also prints radii 1.2175 ± 0.0055 R☉ and 0.8591 ± 0.0036 R☉. At this inclination the sky separation stays far outside those radii, so the light curve is flat. Proxima is not in this ellipse.";
    }
    if (norm.preset === "algol") {
      return "Algol A and Algol B, the inner pair. Kolbas et al. 2015 print M_A = 3.39 ± 0.06 M☉ and M_B = 0.770 ± 0.009 M☉. They adopt P = 2.867328 ± 0.00005 days from Baron et al. 2012, set e and ω to 0, and adopt i = 81.4 ± 0.2° from Richards, Mochnacki, and Bolton 1988. Dividing the period by 365.256 puts it in the years this desk uses. a³ = (M_A + M_B) P² then gives " + text.a + ", which is " + text.aRsun + " R☉, beside the paper’s 13.65 ± 0.07 R☉. " + split + " " + speedLine + " " + kLine + " The paper’s velocity semi-amplitudes are K_A = 44.1 ± 0.2 km/s and K_B = 194.2 ± 1.2 km/s. Table 5 radii are 2.87 ± 0.04 R☉ and 3.43 ± 0.01 R☉, and the temperatures are 12,550 ± 120 K and 4,900 ± 300 K. The light curve uses those four numbers. Minimum flux on this uniform-disk model is " + text.minFlux + ". Algol B fills its Roche lobe, so the sphere is a sketch. Algol C, 1.58 ± 0.09 M☉ on the paper’s 680-day outer orbit, is omitted, and so is its light. The dips are deeper than the real combined light.";
    }
    if (norm.preset === "equal") {
      return "A classroom pair, not a catalog system. Two solar masses and a period of 1 year. The axis is (M P²) to the power 1/3, which is " + text.a + ". The orbit is circular and edge-on, so each K equals that star’s orbital speed. " + split + " " + speedLine + " " + kLine + " One AU in one of these years is 29.785 km/s. That conversion fixes every speed on this page. It is not a second measurement of Earth’s orbital speed.";
    }
    var modeLine = "The boxes sum to " + text.mBoxes + " solar masses.";
    if (norm.mode === "mass") {
      modeLine = "a³/P² is " + text.mKepler + " solar masses. The boxes sum to " + text.mBoxes + " and supply only the ratio. The drawing splits the Kepler total in that ratio.";
    } else if (norm.mode === "period") {
      modeLine = "The masses and the period fix the axis. a³ = (M₁+M₂) P² gives " + text.a + ". The total is " + text.mKepler + " solar masses.";
    } else {
      modeLine = "The masses and the axis fix the period, " + text.period + " (" + text.days + "). The total is " + text.mKepler + " solar masses.";
    }
    var light = "Radii are blank, so no eclipse is drawn.";
    if (norm.r1 && norm.r2) {
      light = eclipsing
        ? "Both radii are set. The uniform-disk light curve dips. Minimum flux is " + text.minFlux + "."
        : "Both radii are set. The sky separation stays outside the two disks, so the light curve is flat.";
      if (!(norm.t1 > 0 && norm.t2 > 0)) light += " Temperatures are blank, so the disks share one surface brightness.";
    }
    return norm.name1 + " and " + norm.name2 + ". " + modeLine + " " + split + " " + speedLine + " " + kLine + " " + light;
  }

  function scene(raw) {
    var norm = raw && raw.mShare1 != null && raw.ok !== false ? raw : normalize(raw);
    if (!norm.ok) return norm;
    var k1 = signedK(norm.a1, norm.periodYears, norm.e, norm.i);
    var k2 = signedK(norm.a2, norm.periodYears, norm.e, norm.i);
    var v1 = auPerYearToKms(2 * Math.PI * norm.a1 / norm.periodYears);
    var v2 = auPerYearToKms(2 * Math.PI * norm.a2 / norm.periodYears);
    var samples = track(norm, 721);
    var eclipsing = samples.minFlux != null && samples.minFlux < 0.999999;
    var text = {
      a: formatAu(norm.aAu),
      a1: formatAu(norm.a1),
      a2: formatAu(norm.a2),
      aRsun: fixed(auToRsun(norm.aAu), 3),
      mKepler: formatMass(norm.mKepler),
      mBoxes: formatMass(norm.mBoxes),
      m1: formatMass(norm.mShare1),
      m2: formatMass(norm.mShare2),
      period: formatYears(norm.periodYears),
      days: formatDays(norm.periodDays),
      v1: formatKms(v1),
      v2: formatKms(v2),
      v1peri: formatKms(endpointSpeed(norm.a1, norm.periodYears, norm.e, "peri")),
      v2peri: formatKms(endpointSpeed(norm.a2, norm.periodYears, norm.e, "peri")),
      v1ap: formatKms(endpointSpeed(norm.a1, norm.periodYears, norm.e, "ap")),
      v2ap: formatKms(endpointSpeed(norm.a2, norm.periodYears, norm.e, "ap")),
      k1: formatKms(Math.abs(k1)),
      k2: formatKms(Math.abs(k2)),
      sinI: Math.abs(Math.sin(norm.i * Math.PI / 180)).toFixed(6),
      minFlux: samples.minFlux == null ? "" : samples.minFlux.toFixed(4)
    };
    var tier = "Custom pair";
    var title = norm.name1 + " + " + norm.name2;
    if (norm.preset === "sirius") {
      tier = "Visual binary · Sirius";
      title = "Sirius A and B";
    } else if (norm.preset === "acen") {
      tier = "Visual binary · Alpha Centauri";
      title = "Alpha Centauri A and B";
    } else if (norm.preset === "algol") {
      tier = "Eclipsing binary · Algol";
      title = "Algol A and B";
    } else if (norm.preset === "equal") {
      tier = "Classroom · equal masses";
      title = "Two solar masses";
    }
    var range = "M = " + text.mKepler + " M☉ · a = " + text.a;
    var stats = [
      { k: "Kepler total", v: text.mKepler + " M☉" },
      { k: "Mass boxes", v: trimNum(norm.m1) + " + " + trimNum(norm.m2) + " M☉" },
      { k: "Period", v: text.period + " · " + text.days },
      { k: "Relative axis", v: text.a + " · " + text.aRsun + " R☉" },
      { k: norm.name1 + " axis", v: text.a1 },
      { k: norm.name2 + " axis", v: text.a2 },
      { k: norm.name1 + " speed", v: text.v1 },
      { k: norm.name2 + " speed", v: text.v2 },
      { k: "K₁", v: text.k1 },
      { k: "K₂", v: text.k2 },
      { k: "|sin i|", v: text.sinI }
    ];
    if (norm.e > 1e-8) {
      stats.push({ k: "Periastron", v: text.v1peri + " · " + text.v2peri });
      stats.push({ k: "Apastron", v: text.v1ap + " · " + text.v2ap });
    }
    if (samples.minFlux != null) stats.push({ k: "Min flux", v: text.minFlux });
    return {
      ok: true,
      preset: norm.preset,
      mode: norm.mode,
      norm: norm,
      text: text,
      tier: tier,
      title: title,
      range: range,
      why: whyFor(norm, text, eclipsing),
      stats: stats,
      k1: k1,
      k2: k2,
      v1: v1,
      v2: v2,
      eclipsing: eclipsing,
      minFlux: samples.minFlux,
      minSepAu: samples.minSepAu,
      samples: samples
    };
  }

  return {
    AU_M: AU_M,
    R_SUN_M: R_SUN_M,
    DAY_S: DAY_S,
    YEAR_DAYS: YEAR_DAYS,
    SIRIUS: SIRIUS,
    ACEN: ACEN,
    ALGOL: ALGOL,
    EQUAL: EQUAL,
    presetById: presetById,
    stateFromPreset: stateFromPreset,
    normalize: normalize,
    scene: scene,
    frame: frame,
    track: track,
    fluxAt: fluxAt,
    signedK: signedK,
    totalMass: totalMass,
    axisFromMass: axisFromMass,
    periodFromMass: periodFromMass,
    geometricAu: geometricAu,
    auPerYearToKms: auPerYearToKms,
    auToRsun: auToRsun,
    rsunToAu: rsunToAu,
    eccentricFromMean: eccentricFromMean,
    trueAnomaly: trueAnomaly,
    endpointSpeed: endpointSpeed,
    limitsNote: limitsNote,
    formatKms: formatKms,
    formatAu: formatAu,
    formatMass: formatMass
  };
});
