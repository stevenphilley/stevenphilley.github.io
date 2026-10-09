#!/usr/bin/env node
"use strict";

var S = require("./circuit-solver.js");

var failed = 0;
var passed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error("FAIL:", msg);
  } else {
    passed++;
    console.log("ok  ", msg);
  }
}

function near(actual, expected, tol, msg) {
  var ok = Math.abs(actual - expected) <= tol;
  assert(ok, msg + " (got " + actual + ", expected " + expected + " ± " + tol + ")");
}

function part(id, type, props, x, y, rot) {
  return { id: id, type: type, x: x || 0, y: y || 0, rot: rot || 0, props: props || {} };
}

function w(a, b) {
  return { id: a + "__" + b, a: a, b: b };
}

function circuit(parts, wires) {
  return S.normalizeDoc({ v: 1, parts: parts, wires: wires });
}

function pin(result, key) {
  return result.pinV[key];
}

/* ---------- hand Newton for a series Shockley diode, independent of diodeIV ---------- */
function handDiodeDrop(vsrc, rLoad, Is, n, rint) {
  /* Bisection of I_R = (Vsrc−Vd)/(R+Rint) against I = Is*(exp(Vd/(n·Vt))−1).
     Independent of diodeIV. The exp is only guarded so a guess past ~1.5 V
     cannot overflow; the root for these benches sits below that guard. */
  var vt = 0.026 * n;
  var lo = 0;
  var hi = vsrc;
  var vd = 0;
  for (var k = 0; k < 80; k++) {
    vd = 0.5 * (lo + hi);
    var iR = (vsrc - vd) / (rLoad + rint);
    var arg = vd / vt;
    var id = arg > 80 ? 1e12 : Is * (Math.exp(arg) - 1);
    if (iR > id) lo = vd;
    else hi = vd;
  }
  vd = 0.5 * (lo + hi);
  return { vd: vd, i: (vsrc - vd) / (rLoad + rint) };
}

/* Textbook divider, then the same divider behind the solver's 0.05 Ω source resistance. */
(function divider() {
  var doc = circuit(
    [
      part("v1", "vdc", { v: 10 }),
      part("g1", "gnd"),
      part("r1", "r", { ohms: 1000 }),
      part("r2", "r", { ohms: 2000 })
    ],
    [w("v1.p", "r1.a"), w("r1.b", "r2.a"), w("r2.b", "g1.p"), w("v1.n", "g1.p")]
  );
  var r = S.dcOperatingPoint(doc);
  assert(r.ok, "divider solves");
  var ideal = 10 * 2000 / 3000;
  var withRint = 10 * 2000 / (3000 + S.MODELS.vSourceR);
  near(pin(r, "r2.a"), ideal, 0.002, "divider Vout near 10 × 2000/3000");
  near(pin(r, "r2.a"), withRint, 1e-6, "divider Vout matches source-resistance hand formula");
  var iHand = 10 / (3000 + S.MODELS.vSourceR);
  near(r.part.r1.i, iHand, 1e-9, "series current I = V / (R1+R2+Rint)");
  near(r.part.r1.i, r.part.r2.i, 1e-9, "KCL: R1 current equals R2 current");
  assert(!r.warnings.some(function (x) { return x.code === "floating" || x.code === "short"; }), "divider has no short or floating warning");
})();

(function parallel() {
  var doc = circuit(
    [
      part("v1", "vdc", { v: 10 }),
      part("g1", "gnd"),
      part("r1", "r", { ohms: 100 }),
      part("r2", "r", { ohms: 100 })
    ],
    [w("v1.p", "r1.a"), w("v1.p", "r2.a"), w("r1.b", "g1.p"), w("r2.b", "g1.p"), w("v1.n", "g1.p")]
  );
  var r = S.dcOperatingPoint(doc);
  /* Each branch sees V × R / (R + Rint/2) approximately; exact: source feeds two 100 Ω.
     Ibranch = Vp/100, Vp = 10 - Iint*Rint, Iint = 2*Vp/100. */
  var vp = 10 / (1 + (2 / 100) * S.MODELS.vSourceR);
  near(pin(r, "r1.a"), vp, 1e-6, "parallel node voltage");
  near(r.part.r1.i, vp / 100, 1e-9, "branch current V/R");
  near(r.part.v1.i, 2 * (vp / 100), 1e-8, "source current is the sum of the branches");
})();

(function currentSource() {
  var doc = circuit(
    [
      part("i1", "idc", { a: 0.001 }),
      part("r1", "r", { ohms: 1000 }),
      part("g1", "gnd")
    ],
    [w("i1.p", "r1.a"), w("i1.n", "g1.p"), w("r1.b", "g1.p")]
  );
  var r = S.dcOperatingPoint(doc);
  near(pin(r, "r1.a"), 1, 1e-6, "1 mA through 1 kΩ is 1 V");
  near(r.part.r1.i, 0.001, 1e-9, "resistor current is 1 mA");
})();

(function potDivider() {
  var doc = circuit(
    [
      part("v1", "vdc", { v: 10 }),
      part("g1", "gnd"),
      part("p1", "pot", { ohms: 10000, wiper: 0.25 })
    ],
    [w("v1.p", "p1.a"), w("p1.b", "g1.p"), w("v1.n", "g1.p")]
  );
  var r = S.dcOperatingPoint(doc);
  /* wiper 0.25: Raw = 2500 from a to w, Rwb = 7500 from w to b.
     Vw = Vin * Rwb / (Raw+Rwb+Rint) with Vin dropped by Rint. */
  var raw = 2500;
  var rwb = 7500;
  var vp = 10 * (raw + rwb) / (raw + rwb + S.MODELS.vSourceR);
  var vw = vp * rwb / (raw + rwb);
  near(pin(r, "p1.w"), vw, 1e-6, "pot wiper is the 2500/7500 divider");
  near(pin(r, "p1.w"), 7.5, 0.002, "pot wiper near 7.5 V");
})();

(function diodeHand() {
  var Is = S.MODELS.diode.Is;
  var hand = handDiodeDrop(5, 1000, Is, 1, S.MODELS.vSourceR);
  var doc = circuit(
    [
      part("v1", "vdc", { v: 5 }),
      part("r1", "r", { ohms: 1000 }),
      part("d1", "d"),
      part("g1", "gnd")
    ],
    [w("v1.p", "r1.a"), w("r1.b", "d1.a"), w("d1.k", "g1.p"), w("v1.n", "g1.p")]
  );
  var r = S.dcOperatingPoint(doc);
  near(r.part.d1.v, hand.vd, 1e-4, "silicon diode drop matches independent Newton");
  near(r.part.d1.i, hand.i, 1e-7, "silicon diode current matches independent Newton");
  assert(r.part.d1.v > 0.55 && r.part.d1.v < 0.8, "silicon drop sits near the 0.7 V knee");
})();

(function ledIV() {
  var Is = S.MODELS.led.Is;
  var n = S.MODELS.led.n;
  var hand = handDiodeDrop(5, 330, Is, n, S.MODELS.vSourceR);
  var doc = S.example("led").doc;
  var r = S.dcOperatingPoint(doc);
  near(r.part.d1.v, hand.vd, 2e-4, "LED forward drop matches Shockley hand Newton");
  near(r.part.d1.i, hand.i, 2e-6, "LED current matches Shockley hand Newton");
  var vt = 0.026 * n;
  var vf20 = vt * Math.log(0.02 / Is + 1);
  near(vf20, 2.0, 0.08, "LED model is about 2 V at 20 mA");
  assert(!r.warnings.some(function (x) { return x.code === "led-over"; }), "330 Ω from 5 V does not over-current the LED");
})();

(function ledOver() {
  var doc = circuit(
    [
      part("v1", "vdc", { v: 9 }),
      part("r1", "r", { ohms: 100 }),
      part("d1", "led"),
      part("g1", "gnd")
    ],
    [w("v1.p", "r1.a"), w("r1.b", "d1.a"), w("d1.k", "g1.p"), w("v1.n", "g1.p")]
  );
  var r = S.dcOperatingPoint(doc);
  assert(r.part.d1.i > 0.02, "9 V and 100 Ω pushes the LED past 20 mA");
  assert(r.warnings.some(function (x) { return x.code === "led-over"; }), "over-current warning is raised");
})();

(function shortAndFloat() {
  var doc = circuit(
    [part("v1", "vdc", { v: 5 }), part("g1", "gnd")],
    [w("v1.p", "v1.n"), w("v1.n", "g1.p")]
  );
  var r = S.dcOperatingPoint(doc);
  assert(r.warnings.some(function (x) { return x.code === "short"; }), "wire across a 5 V source warns short");
  /* Two resistors tied together, and not to the grounded source, are a floating island. */
  var flo = circuit(
    [part("v1", "vdc", { v: 5 }), part("g1", "gnd"), part("r1", "r", { ohms: 1000 }), part("r2", "r", { ohms: 2200 })],
    [w("v1.n", "g1.p"), w("r1.a", "r2.a"), w("r1.b", "r2.b")]
  );
  var fr = S.dcOperatingPoint(flo);
  assert(fr.warnings.some(function (x) { return x.code === "floating"; }), "a resistor island with no path to ground warns floating");
  var none = circuit([part("r1", "r", { ohms: 100 })], []);
  var nr = S.dcOperatingPoint(none);
  assert(nr.warnings.some(function (x) { return x.code === "no-ground"; }), "missing ground is reported");
})();

(function opampGain() {
  var doc = S.example("opamp").doc;
  var r = S.dcOperatingPoint(doc);
  var aol = 100000;
  var rf = 2000;
  var rg = 1000;
  /* Vout = Aol*(Vin - Vout*Rg/(Rg+Rf)) */
  var div = rg / (rg + rf);
  var vout = aol * 1 / (1 + aol * div);
  near(pin(r, "u1.out"), vout, 1e-3, "non-inverting op-amp matches finite-Aol hand formula");
  near(pin(r, "u1.out"), 3, 0.002, "gain is 1 + Rf/Rg = 3");
  near(pin(r, "u1.inn"), 1, 0.002, "inverting input sits near the 1 V virtual copy");
})();

(function opampInvert() {
  var doc = circuit(
    [
      part("v1", "vdc", { v: 1 }),
      part("g1", "gnd"),
      part("u1", "op", { vp: 12, vn: -12, aol: 100000 }),
      part("rin", "r", { ohms: 1000 }),
      part("rf", "r", { ohms: 2000 })
    ],
    [
      w("v1.n", "g1.p"),
      w("u1.inp", "g1.p"),
      w("v1.p", "rin.a"),
      w("rin.b", "u1.inn"),
      w("u1.inn", "rf.a"),
      w("rf.b", "u1.out")
    ]
  );
  var r = S.dcOperatingPoint(doc);
  var aol = 100000;
  /* Vin/Rin + Vout/Rf = Vn*(1/Rin+1/Rf), Vout = Aol*(0 - Vn) */
  var gsum = 1 / 1000 + 1 / 2000;
  /* Vn = -Vout/Aol
     (1 - Vn)/1000 + (Vout - Vn)/2000 = 0  if we ignore input current balance into inn
     1/1000 + Vout/2000 - Vn*gsum = 0
     Vout/2000 + 1/1000 = Vn * gsum = -Vout/Aol * gsum
     Vout/2000 + Vout*gsum/Aol = -1/1000
     Vout * (1/2000 + gsum/Aol) = -0.001
  */
  var vout = -0.001 / (1 / 2000 + gsum / aol);
  near(pin(r, "u1.out"), vout, 1e-3, "inverting op-amp matches hand formula");
  near(pin(r, "u1.out"), -2, 0.002, "inverting gain is -Rf/Rin = -2");
})();

(function npnActive() {
  var beta = 100;
  var rb = 180000;
  var rc = 1000;
  var vcc = 9;
  var Isb = S.MODELS.npnIsb;
  var vt = 0.026;
  var rint = S.MODELS.vSourceR;
  /* Ib = Isb*(exp(Vbe/Vt)-1)
     Ib = (Vcc - Ib*Rint - Vbe) / Rb
     Ic = beta * Ib   (Ir ≈ 0 while Vbc < 0)
     Vce = Vcc - Ic*Rc - (Ib+Ic)*Rint
  */
  var vbe = 0.7;
  for (var k = 0; k < 30; k++) {
    var ib = Isb * (Math.exp(vbe / vt) - 1);
    var ib2 = (vcc - vbe) / (rb + rint * (1 + beta));
    /* Include collector current returning through the same source:
       Vsource terminal drop is (Ib+Ic)*Rint = Ib*(1+beta)*Rint
       Ib = (Vcc - Vbe - Ic*Rint) / Rb, Ic=beta*Ib
       Ib = (Vcc - Vbe) / (Rb + beta*Rint) approximately, plus Ib*Rint in Rb loop.
       The base resistor sees Vb = Vbe (emitter grounded).
       Source positive is Vcc node: Vpos = Vcc - (Ib+Ic)*Rint
       Ib = (Vpos - Vbe) / Rb
       Ib = (Vcc - Ib*(1+beta)*Rint - Vbe) / Rb
       Ib*Rb + Ib*(1+beta)*Rint = Vcc - Vbe
       Ib = (Vcc - Vbe) / (Rb + (1+beta)*Rint)
    */
    ib = ib2;
    var f = Isb * (Math.exp(vbe / vt) - 1) - ib;
    var df = (Isb / vt) * Math.exp(vbe / vt) + 1 / (rb + (1 + beta) * rint);
    /* ib depends on vbe: dib/dvbe = -1 / (Rb+(1+beta)Rint)
       f = Isb*(exp-1) - (Vcc-vbe)/Rtot
       df = g - (-1/Rtot) = g + 1/Rtot
       Wait f = idi - ib and ib = (Vcc-vbe)/Rtot so df/dvbe = g - (-1/Rtot) = g+1/Rtot
       Newton: vbe -= f/df. I set df that way. Good.
    */
    vbe -= f / df;
  }
  var ib = (vcc - vbe) / (rb + (1 + beta) * rint);
  var ic = beta * ib;
  var doc = circuit(
    [
      part("v1", "vdc", { v: vcc }),
      part("g1", "gnd"),
      part("rb", "r", { ohms: rb }),
      part("rc", "r", { ohms: rc }),
      part("q1", "npn", { beta: beta })
    ],
    [
      w("v1.n", "g1.p"),
      w("v1.p", "rb.a"),
      w("rb.b", "q1.b"),
      w("v1.p", "rc.a"),
      w("rc.b", "q1.c"),
      w("q1.e", "g1.p")
    ]
  );
  var r = S.dcOperatingPoint(doc);
  near(r.part.q1.vbe, vbe, 0.002, "NPN Vbe matches independent diode Newton");
  near(r.part.q1.ib, ib, ib * 0.02, "NPN Ib matches (Vcc−Vbe)/Rb");
  near(r.part.q1.ic, ic, ic * 0.02, "NPN Ic matches β·Ib in the active region");
  assert(r.part.q1.v > 0.5, "Vce stays above saturation");
})();

(function nandLow() {
  var doc = S.example("nand").doc;
  var r = S.dcOperatingPoint(doc);
  near(pin(r, "u1.y"), 0, 0.05, "NAND with both inputs high is low");
  var doc2 = circuit(
    [
      part("v1", "vdc", { v: 5 }),
      part("g1", "gnd"),
      part("u1", "nand", { voh: 5 }),
      part("rl", "r", { ohms: 10000 })
    ],
    [
      w("v1.p", "u1.vcc"),
      w("v1.n", "g1.p"),
      w("u1.gnd", "g1.p"),
      w("u1.a", "g1.p"),
      w("u1.b", "g1.p"),
      w("u1.y", "rl.a"),
      w("rl.b", "g1.p")
    ]
  );
  var r2 = S.dcOperatingPoint(doc2);
  /* High level through 100 Ω series into 10 kΩ to ground: 5 * 10000/10100 */
  near(pin(r2, "u1.y"), 5 * 10000 / 10100, 0.02, "NAND with both inputs low is high");
})();

(function rcTransient() {
  var R = 1000;
  var C = 1e-6;
  var Vs = 5;
  var dt = 2e-6;
  var t = 0.001;
  var doc = circuit(
    [
      part("v1", "vdc", { v: Vs }),
      part("r1", "r", { ohms: R }),
      part("c1", "c", { farads: C }),
      part("g1", "gnd")
    ],
    [w("v1.p", "r1.a"), w("r1.b", "c1.a"), w("c1.b", "g1.p"), w("v1.n", "g1.p")]
  );
  var run = S.runTransient(doc, { dt: dt, tEnd: t, stride: 100 });
  var last = run.samples[run.samples.length - 1];
  var analytic = Vs * (1 - Math.exp(-t / (R * C)));
  near(last.part.c1.v, analytic, 0.02, "RC at one τ is Vs·(1−e^−1)");
  near(last.part.c1.v, Vs * (1 - Math.exp(-1)), 0.02, "RC 63% point");
})();

(function rlTransient() {
  var R = 100;
  var L = 0.1;
  var Vs = 10;
  var dt = 2e-6;
  var t = 0.001;
  var doc = S.example("rl").doc;
  doc.parts.forEach(function (p) {
    if (p.id === "v1") p.props.v = Vs;
    if (p.id === "r1") p.props.ohms = R;
    if (p.id === "l1") p.props.henries = L;
  });
  var run = S.runTransient(doc, { dt: dt, tEnd: t, stride: 100 });
  var last = run.samples[run.samples.length - 1];
  var analytic = (Vs / R) * (1 - Math.exp((-t * R) / L));
  near(last.part.l1.i, analytic, 0.002, "RL current at one τ is (V/R)·(1−e^−1)");
})();

(function acQuarter() {
  var doc = circuit(
    [
      part("v1", "vac", { vpeak: 5, hz: 50 }),
      part("r1", "r", { ohms: 1000 }),
      part("g1", "gnd")
    ],
    [w("v1.p", "r1.a"), w("r1.b", "g1.p"), w("v1.n", "g1.p")]
  );
  var run = S.runTransient(doc, { dt: 1e-4, tEnd: 0.005, stride: 10 });
  var last = run.samples[run.samples.length - 1];
  near(last.pinV["v1.p"], 5, 0.02, "50 Hz sine is at its peak after 5 ms");
  var dc = S.dcOperatingPoint(doc);
  near(pin(dc, "v1.p"), 0, 1e-6, "AC source DC operating point is 0 V");
})();

(function astablePeriod() {
  var R1 = 10000;
  var R2 = 10000;
  var C = 1e-6;
  var doc = S.example("astable").doc;
  var dt = 50e-6;
  var run = S.runTransient(doc, { dt: dt, tEnd: 0.09, stride: 1 });
  var edges = [];
  var prev = 0;
  run.samples.forEach(function (s) {
    var y = s.part.u1 ? s.part.u1.v : 0;
    if (prev < 2.5 && y >= 2.5) edges.push(s.t);
    prev = y;
  });
  assert(edges.length >= 3, "555 astable produces several rising edges (got " + edges.length + ")");
  if (edges.length >= 4) {
    /* The first upward crossing is the output turning on from 0 V, not a period. */
    var periods = [];
    for (var i = 2; i < edges.length; i++) periods.push(edges[i] - edges[i - 1]);
    var mean = periods.reduce(function (a, b) { return a + b; }, 0) / periods.length;
    var hand = Math.log(2) * (R1 + 2 * R2) * C;
    near(mean, hand, hand * 0.04, "555 period matches ln(2)·(R1+2·R2)·C");
  }
})();

(function shareRoundtrip() {
  var doc = S.example("divider").doc;
  var back = S.decodeShare(S.encodeShare(doc));
  assert(back.parts.length === doc.parts.length, "share link keeps the parts");
  assert(back.wires.length === doc.wires.length, "share link keeps the wires");
  var text = S.serialize(doc);
  var loaded = S.deserialize(text);
  var r1 = S.dcOperatingPoint(doc);
  var r2 = S.dcOperatingPoint(loaded);
  near(r1.pinV["r2.a"], r2.pinV["r2.a"], 1e-9, "saved JSON solves to the same divider");
  var legacy = S.deserialize('{"v":1,"parts":[{"id":"r1","type":"r","x":1,"y":2,"props":{"ohms":470}}],"wires":[]}');
  assert(legacy.parts[0].props.ohms === 470, "older JSON without rot still loads");
  assert(legacy.parts[0].rot === 0, "missing rotation defaults to 0");
})();

(function exampleDivider() {
  var doc = S.example("divider").doc;
  var r = S.dcOperatingPoint(doc);
  near(pin(r, "r1.b"), 10 * 2000 / 3000, 0.002, "library divider example is 6.667 V");
})();

console.log(passed + " passed, " + failed + " failed");
if (failed) process.exit(1);
