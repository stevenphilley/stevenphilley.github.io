/*! circuit-solver.js — educational modified nodal analysis for the circuit maker.
   Browser: window.SPCircuit. Node: module.exports.
   Models are sketches for the bench, not manufacturer SPICE. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SPCircuit = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VT = 0.026;
  var GMIN = 1e-12;
  var MODELS = {
    Vt: VT,
    diode: { Is: 1e-14, n: 1 },
    led: { Is: 2.5e-19, n: 2 },
    ledMaxA: 0.02,
    npnIsb: 1e-16,
    vSourceR: 0.05,
    switchR: 0.05
  };

  /* Shockley I = Is*(exp(V/(n*Vt))-1), with a linear extension past exp(40)
     so Newton cannot overflow. gmin is jacobian-only. */
  function diodeIV(v, Is, n) {
    var vt = VT * (n || 1);
    var arg = v / vt;
    var i;
    var g;
    if (arg > 40) {
      var v0 = 40 * vt;
      var e = Math.exp(40);
      var i0 = Is * (e - 1);
      var g0 = (Is * e) / vt;
      i = i0 + g0 * (v - v0);
      g = g0;
    } else if (arg < -8) {
      i = -Is;
      g = GMIN;
    } else {
      var e2 = Math.exp(arg);
      i = Is * (e2 - 1);
      g = (Is * e2) / vt;
    }
    if (g < GMIN) g = GMIN;
    return { i: i, g: g };
  }

  var LIB = {
    gnd: { label: "Ground", pins: [{ id: "p", x: 0, y: 0 }], props: {} },
    vdc: { label: "DC source", pins: [{ id: "p", x: 0, y: 0 }, { id: "n", x: 0, y: 3 }], props: { v: 9 } },
    vac: { label: "AC source", pins: [{ id: "p", x: 0, y: 0 }, { id: "n", x: 0, y: 3 }], props: { vpeak: 5, hz: 60 } },
    idc: { label: "Current source", pins: [{ id: "p", x: 0, y: 0 }, { id: "n", x: 0, y: 3 }], props: { a: 0.001 } },
    r: { label: "Resistor", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 4, y: 0 }], props: { ohms: 1000 } },
    pot: { label: "Potentiometer", pins: [{ id: "a", x: 0, y: 0 }, { id: "w", x: 2, y: 1 }, { id: "b", x: 4, y: 0 }], props: { ohms: 10000, wiper: 0.5 } },
    c: { label: "Capacitor", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 0, y: 2 }], props: { farads: 1e-6 } },
    l: { label: "Inductor", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 4, y: 0 }], props: { henries: 0.1 } },
    sw: { label: "Switch", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 3, y: 0 }], props: { closed: true } },
    d: { label: "Diode", pins: [{ id: "a", x: 0, y: 0 }, { id: "k", x: 3, y: 0 }], props: {} },
    led: { label: "LED", pins: [{ id: "a", x: 0, y: 0 }, { id: "k", x: 3, y: 0 }], props: {} },
    npn: { label: "NPN", pins: [{ id: "b", x: 0, y: 1 }, { id: "c", x: 2, y: 0 }, { id: "e", x: 2, y: 2 }], props: { beta: 100 } },
    op: { label: "Op-amp", pins: [{ id: "inp", x: 0, y: 0 }, { id: "inn", x: 0, y: 2 }, { id: "out", x: 4, y: 1 }, { id: "vp", x: 1, y: -1 }, { id: "vn", x: 3, y: -1 }], props: { vp: 12, vn: -12, aol: 100000 } },
    not: { label: "NOT", pins: [{ id: "a", x: 0, y: 1 }, { id: "y", x: 3, y: 1 }, { id: "vcc", x: 1, y: 0 }, { id: "gnd", x: 2, y: 2 }], props: { voh: 5 } },
    and: { label: "AND", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 0, y: 2 }, { id: "y", x: 3, y: 1 }, { id: "vcc", x: 1, y: -1 }, { id: "gnd", x: 2, y: 3 }], props: { voh: 5 } },
    or: { label: "OR", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 0, y: 2 }, { id: "y", x: 3, y: 1 }, { id: "vcc", x: 1, y: -1 }, { id: "gnd", x: 2, y: 3 }], props: { voh: 5 } },
    nand: { label: "NAND", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 0, y: 2 }, { id: "y", x: 3, y: 1 }, { id: "vcc", x: 1, y: -1 }, { id: "gnd", x: 2, y: 3 }], props: { voh: 5 } },
    nor: { label: "NOR", pins: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 0, y: 2 }, { id: "y", x: 3, y: 1 }, { id: "vcc", x: 1, y: -1 }, { id: "gnd", x: 2, y: 3 }], props: { voh: 5 } },
    ic555: {
      label: "555",
      pins: [
        { id: "gnd", x: 0, y: 0 },
        { id: "trig", x: 0, y: 1 },
        { id: "out", x: 0, y: 2 },
        { id: "reset", x: 0, y: 3 },
        { id: "vcc", x: 4, y: 0 },
        { id: "dis", x: 4, y: 1 },
        { id: "thr", x: 4, y: 2 },
        { id: "cont", x: 4, y: 3 }
      ],
      props: {}
    }
  };

  var GATES = { not: 1, and: 1, or: 1, nand: 1, nor: 1 };

  function isGate(type) {
    return !!GATES[type];
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function transformPin(x, y, rot, flip) {
    if (flip) x = -x;
    var n = ((rot || 0) % 4 + 4) % 4;
    for (var i = 0; i < n; i++) {
      var nx = -y;
      var ny = x;
      x = nx;
      y = ny;
    }
    return { x: x, y: y };
  }

  function pinWorld(part, pin) {
    var t = transformPin(pin.x, pin.y, part.rot || 0, !!part.flip);
    return { x: part.x + t.x, y: part.y + t.y };
  }

  function partPins(part) {
    var spec = LIB[part.type];
    if (!spec) return [];
    return spec.pins.map(function (pin) {
      var w = pinWorld(part, pin);
      return { id: pin.id, key: part.id + "." + pin.id, x: w.x, y: w.y };
    });
  }

  function solveLinear(A, b) {
    var n = b.length;
    if (!n) return [];
    var M = new Array(n);
    for (var r = 0; r < n; r++) {
      var row = new Array(n + 1);
      for (var c = 0; c < n; c++) row[c] = A[r][c];
      row[n] = b[r];
      M[r] = row;
    }
    for (var col = 0; col < n; col++) {
      var piv = col;
      var best = Math.abs(M[col][col]);
      for (var rr = col + 1; rr < n; rr++) {
        var av = Math.abs(M[rr][col]);
        if (av > best) {
          best = av;
          piv = rr;
        }
      }
      if (best < 1e-18) return null;
      if (piv !== col) {
        var tmp = M[col];
        M[col] = M[piv];
        M[piv] = tmp;
      }
      var div = M[col][col];
      for (var cc = col; cc <= n; cc++) M[col][cc] /= div;
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === col) continue;
        var f = M[r2][col];
        if (f === 0) continue;
        for (var c2 = col; c2 <= n; c2++) M[r2][c2] -= f * M[col][c2];
      }
    }
    var x = new Array(n);
    for (var i = 0; i < n; i++) {
      x[i] = M[i][n];
      if (!isFinite(x[i])) return null;
    }
    return x;
  }

  function findParent(parent, k) {
    var p = parent[k];
    if (p !== k) parent[k] = findParent(parent, p);
    return parent[k];
  }

  function buildNets(doc) {
    var parent = {};
    var pins = [];
    (doc.parts || []).forEach(function (part) {
      if (!LIB[part.type]) return;
      partPins(part).forEach(function (pin) {
        parent[pin.key] = pin.key;
        pins.push(pin);
      });
    });
    function union(a, b) {
      if (parent[a] == null || parent[b] == null) return;
      var ra = findParent(parent, a);
      var rb = findParent(parent, b);
      if (ra !== rb) parent[rb] = ra;
    }
    (doc.wires || []).forEach(function (w) {
      union(w.a, w.b);
    });
    var groundRoot = null;
    pins.forEach(function (pin) {
      var part = partById(doc, pin.key.split(".")[0]);
      if (part && part.type === "gnd") {
        var r = findParent(parent, pin.key);
        if (groundRoot == null) groundRoot = r;
        else parent[r] = groundRoot;
      }
    });
    if (groundRoot != null) groundRoot = findParent(parent, groundRoot);
    var rootToNode = {};
    var nodes = [];
    function nodeOf(key) {
      if (parent[key] == null) return null;
      var r = findParent(parent, key);
      if (groundRoot != null && r === groundRoot) return "0";
      if (!rootToNode[r]) {
        var id = "n" + nodes.length;
        rootToNode[r] = id;
        nodes.push(id);
      }
      return rootToNode[r];
    }
    var pinNode = {};
    var nodePins = { "0": [] };
    pins.forEach(function (pin) {
      var node = nodeOf(pin.key);
      pinNode[pin.key] = node;
      if (!nodePins[node]) nodePins[node] = [];
      nodePins[node].push(pin.key);
    });
    return { pinNode: pinNode, nodes: nodes, nodePins: nodePins, hasGround: groundRoot != null };
  }

  function partById(doc, id) {
    var parts = doc.parts || [];
    for (var i = 0; i < parts.length; i++) if (parts[i].id === id) return parts[i];
    return null;
  }

  function num(props, key, fallback) {
    var v = props && props[key];
    if (v == null || v === "") return fallback;
    var n = +v;
    return isFinite(n) ? n : fallback;
  }

  function blankSystem(n) {
    var A = new Array(n);
    var z = new Array(n);
    for (var r = 0; r < n; r++) {
      A[r] = new Array(n);
      for (var c = 0; c < n; c++) A[r][c] = 0;
      z[r] = 0;
    }
    return { A: A, z: z };
  }

  function idxOf(map, node) {
    if (node == null) return -1;
    if (node === "0") return -1;
    var i = map[node];
    return i == null ? -1 : i;
  }

  function stampG(sys, map, na, nb, g) {
    if (!isFinite(g) || g === 0) return;
    var ia = idxOf(map, na);
    var ib = idxOf(map, nb);
    if (ia >= 0) sys.A[ia][ia] += g;
    if (ib >= 0) sys.A[ib][ib] += g;
    if (ia >= 0 && ib >= 0) {
      sys.A[ia][ib] -= g;
      sys.A[ib][ia] -= g;
    }
  }

  /* I is current leaving the positive node into the source.
     Reported supply current (out of + into the circuit) is -I. */
  function stampV(sys, map, np, nn, extra, volts) {
    var ip = idxOf(map, np);
    var inn = idxOf(map, nn);
    if (ip >= 0) sys.A[ip][extra] += 1;
    if (inn >= 0) sys.A[inn][extra] -= 1;
    if (ip >= 0) sys.A[extra][ip] += 1;
    if (inn >= 0) sys.A[extra][inn] -= 1;
    sys.z[extra] += volts;
  }

  /* Constant current leaving `from` and entering `to`. */
  function stampI(sys, map, from, to, amps) {
    var ia = idxOf(map, from);
    var ib = idxOf(map, to);
    if (ia >= 0) sys.z[ia] -= amps;
    if (ib >= 0) sys.z[ib] += amps;
  }

  /* Linearized branch: current leaving p toward n is g*(Vp-Vn) + ieq. */
  function stampBranch(sys, map, p, n, g, ieq) {
    stampG(sys, map, p, n, g);
    stampI(sys, map, p, n, ieq);
  }

  function nodeV(vmap, node) {
    if (node == null) return 0;
    if (node === "0") return 0;
    var v = vmap[node];
    return v == null || !isFinite(v) ? 0 : v;
  }

  function pinNode(nets, part, pin) {
    return nets.pinNode[part.id + "." + pin] || null;
  }

  function netSize(nets, node) {
    if (!node || !nets.nodePins[node]) return 0;
    return nets.nodePins[node].length;
  }

  function connected(nets, part, pin) {
    var node = pinNode(nets, part, pin);
    if (!node) return false;
    if (node === "0") return true;
    return netSize(nets, node) > 1;
  }

  function acVolts(part, t) {
    var props = part.props || {};
    var peak = num(props, "vpeak", 5);
    var hz = num(props, "hz", 60);
    return peak * Math.sin(2 * Math.PI * hz * (t || 0));
  }

  function sourceVolts(part, ctx) {
    if (part.type === "vac") {
      if (ctx.mode === "dc") return 0;
      return acVolts(part, ctx.t);
    }
    return num(part.props, "v", 0);
  }

  function gateLevel(part, va, vb, vHigh) {
    var th = 0.5 * vHigh;
    var A = va >= th;
    var B = vb >= th;
    var y = false;
    if (part.type === "not") y = !A;
    else if (part.type === "and") y = A && B;
    else if (part.type === "or") y = A || B;
    else if (part.type === "nand") y = !(A && B);
    else if (part.type === "nor") y = !(A || B);
    return y ? vHigh : 0;
  }

  function updateDigital(doc, nets, state, ctx) {
    var vmap = state.v || {};
    (doc.parts || []).forEach(function (part) {
      if (isGate(part.type)) {
        var vccN = pinNode(nets, part, "vcc");
        var gndN = pinNode(nets, part, "gnd");
        var aN = pinNode(nets, part, "a");
        var bN = pinNode(nets, part, "b");
        var vHigh = num(part.props, "voh", 5);
        if (connected(nets, part, "vcc")) {
          vHigh = nodeV(vmap, vccN) - (connected(nets, part, "gnd") ? nodeV(vmap, gndN) : 0);
          if (vHigh < 0.5) vHigh = num(part.props, "voh", 5);
        }
        var va = nodeV(vmap, aN);
        var vb = part.type === "not" ? 0 : nodeV(vmap, bN);
        if (connected(nets, part, "gnd")) {
          va -= nodeV(vmap, gndN);
          vb -= nodeV(vmap, gndN);
        }
        state.digital[part.id] = gateLevel(part, va, vb, vHigh);
      }
      if (part.type === "ic555") {
        var vcc = connected(nets, part, "vcc") ? nodeV(vmap, pinNode(nets, part, "vcc")) : 5;
        var gnd = connected(nets, part, "gnd") ? nodeV(vmap, pinNode(nets, part, "gnd")) : 0;
        var span = vcc - gnd;
        if (span < 0.5) span = 5;
        var contN = pinNode(nets, part, "cont");
        var upper = (2 / 3) * span;
        if (connected(nets, part, "cont")) upper = nodeV(vmap, contN) - gnd;
        var lower = upper / 2;
        var trig = nodeV(vmap, pinNode(nets, part, "trig")) - gnd;
        var thr = nodeV(vmap, pinNode(nets, part, "thr")) - gnd;
        var resetV = connected(nets, part, "reset") ? nodeV(vmap, pinNode(nets, part, "reset")) - gnd : span;
        var vccAbs = connected(nets, part, "vcc") ? nodeV(vmap, pinNode(nets, part, "vcc")) : span;
        var latch = state.latch[part.id] ? 1 : 0;
        /* Before the first solve every node reads 0 V. A reset pin tied to
           Vcc must not look like a reset pulse in that instant. */
        var unpowered = Math.abs(vccAbs) < 0.2 && Math.abs(resetV) < 0.2;
        if (!unpowered && resetV < 0.7) latch = 0;
        else if (trig < lower) latch = 1;
        else if (thr > upper) latch = 0;
        state.latch[part.id] = latch;
        state.digital[part.id] = latch ? span : 0;
      }
    });
  }

  function opRails(part, nets, vmap) {
    var hi = num(part.props, "vp", 12);
    var lo = num(part.props, "vn", -12);
    if (connected(nets, part, "vp")) hi = nodeV(vmap, pinNode(nets, part, "vp"));
    if (connected(nets, part, "vn")) lo = nodeV(vmap, pinNode(nets, part, "vn"));
    if (hi < lo) {
      var s = hi;
      hi = lo;
      lo = s;
    }
    return { hi: hi, lo: lo };
  }

  function allocate(doc, nets) {
    var map = {};
    nets.nodes.forEach(function (id, i) {
      map[id] = i;
    });
    var extras = [];
    (doc.parts || []).forEach(function (part) {
      if (!LIB[part.type]) return;
      if (part.type === "vdc" || part.type === "vac" || part.type === "op" || isGate(part.type) || part.type === "ic555") {
        extras.push({ id: part.id, kind: part.type });
      }
    });
    extras.forEach(function (ex, i) {
      ex.index = nets.nodes.length + i;
    });
    return { map: map, extras: extras, n: nets.nodes.length + extras.length };
  }

  function extraFor(layout, id) {
    for (var i = 0; i < layout.extras.length; i++) if (layout.extras[i].id === id) return layout.extras[i];
    return null;
  }

  function potSections(part) {
    var ohms = Math.max(1, num(part.props, "ohms", 10000));
    var w = num(part.props, "wiper", 0.5);
    if (w < 0) w = 0;
    if (w > 1) w = 1;
    var raw = Math.max(ohms * w, 0.5);
    var rwb = Math.max(ohms * (1 - w), 0.5);
    return { raw: raw, rwb: rwb };
  }

  function buildSystem(doc, nets, layout, state, ctx) {
    var sys = blankSystem(layout.n);
    var map = layout.map;
    nets.nodes.forEach(function (id) {
      var i = map[id];
      if (i >= 0) sys.A[i][i] += GMIN;
    });
    var vmap = state.v || {};
    (doc.parts || []).forEach(function (part) {
      var type = part.type;
      if (!LIB[type]) return;
      if (type === "r") {
        var ohms = Math.max(0.001, num(part.props, "ohms", 1000));
        stampG(sys, map, pinNode(nets, part, "a"), pinNode(nets, part, "b"), 1 / ohms);
      } else if (type === "pot") {
        var sec = potSections(part);
        stampG(sys, map, pinNode(nets, part, "a"), pinNode(nets, part, "w"), 1 / sec.raw);
        stampG(sys, map, pinNode(nets, part, "w"), pinNode(nets, part, "b"), 1 / sec.rwb);
      } else if (type === "sw") {
        if (part.props && part.props.closed) {
          stampG(sys, map, pinNode(nets, part, "a"), pinNode(nets, part, "b"), 1 / MODELS.switchR);
        }
      } else if (type === "vdc" || type === "vac") {
        var ex = extraFor(layout, part.id);
        /* Series 0.05 Ω so a dead short is a large current, not a singular matrix. */
        var np = pinNode(nets, part, "p");
        var nn = pinNode(nets, part, "n");
        stampV(sys, map, np, nn, ex.index, sourceVolts(part, ctx));
        /* The ideal source is between the pins. Rint is modeled by reducing
           the constraint stiffness is harder; stamp a parallel path? 
           Instead add Rint in series using the voltage unknown as the ideal
           source directly across the pins — shorts of 0 Ω still conflict.
           Add conductance 1/Rint in series by splitting: we stamp the source
           across the pins AND rely on warning |I|. A wire short makes
           Vp-Vn=0 and Vp-Vn=V, which is singular.
           To keep it solvable, stamp source through Rint:
           current leaving p = (Vp - Vn - Vsrc) / Rint
           which is a voltage source with series R, no extra unknown.
           Then we lose the extra column. BUT layout already reserved it.
           Use the extra as the source current and put Rint in the constraint:
           Vp - Vn - I*Rint = Vsrc
           A[extra][extra] -= Rint
        */
        sys.A[ex.index][ex.index] -= MODELS.vSourceR;
      } else if (type === "idc") {
        var a = num(part.props, "a", 0.001);
        stampI(sys, map, pinNode(nets, part, "n"), pinNode(nets, part, "p"), a);
      } else if (type === "d" || type === "led") {
        var model = type === "led" ? MODELS.led : MODELS.diode;
        var na = pinNode(nets, part, "a");
        var nk = pinNode(nets, part, "k");
        var vd = nodeV(vmap, na) - nodeV(vmap, nk);
        var iv = diodeIV(vd, model.Is, model.n);
        var ieq = iv.i - iv.g * vd;
        stampBranch(sys, map, na, nk, iv.g, ieq);
      } else if (type === "c") {
        if (ctx.mode === "tran") {
          var c = Math.max(1e-15, num(part.props, "farads", 1e-6));
          var g = c / Math.max(ctx.dt, 1e-15);
          var vp = state.capV[part.id] || 0;
          var na2 = pinNode(nets, part, "a");
          var nb2 = pinNode(nets, part, "b");
          stampBranch(sys, map, na2, nb2, g, -g * vp);
        }
      } else if (type === "l") {
        var naL = pinNode(nets, part, "a");
        var nbL = pinNode(nets, part, "b");
        if (ctx.mode === "dc") {
          stampG(sys, map, naL, nbL, 1 / 0.001);
        } else {
          var L = Math.max(1e-12, num(part.props, "henries", 0.1));
          var gL = ctx.dt / L;
          var i0 = state.indI[part.id] || 0;
          stampBranch(sys, map, naL, nbL, gL, i0);
        }
      } else if (type === "npn") {
        stampNpn(sys, map, part, nets, vmap);
      } else if (type === "op") {
        stampOp(sys, map, layout, part, nets, vmap, state);
      } else if (isGate(part.type) || type === "ic555") {
        var exg = extraFor(layout, part.id);
        var level = state.digital[part.id] || 0;
        var yPin = type === "ic555" ? "out" : "y";
        var gndNode = pinNode(nets, part, "gnd");
        var yNode = pinNode(nets, part, yPin);
        var gndRef = connected(nets, part, "gnd") ? gndNode : "0";
        stampV(sys, map, yNode, gndRef, exg.index, level);
        sys.A[exg.index][exg.index] -= 100;
        if (type === "ic555" && !state.latch[part.id]) {
          stampG(sys, map, pinNode(nets, part, "dis"), gndRef, 1 / 1);
        }
      }
    });
    return sys;
  }

  function stampNpn(sys, map, part, nets, vmap) {
    var beta = Math.max(1, num(part.props, "beta", 100));
    var bf = beta;
    var br = 1;
    var Isb = MODELS.npnIsb;
    var nb = pinNode(nets, part, "b");
    var nc = pinNode(nets, part, "c");
    var ne = pinNode(nets, part, "e");
    var Vb = nodeV(vmap, nb);
    var Vc = nodeV(vmap, nc);
    var Ve = nodeV(vmap, ne);
    var Vbe = Vb - Ve;
    var Vbc = Vb - Vc;
    var be = diodeIV(Vbe, bf * Isb, 1);
    var bc = diodeIV(Vbc, br * Isb, 1);
    var If = be.i;
    var Ir = bc.i;
    var gIf = be.g;
    var gIr = bc.g;
    var kR = (br + 1) / br;
    var IeqF = If - gIf * Vbe;
    var IeqR = Ir - gIr * Vbc;
    var IeqB = IeqF / bf + IeqR / br;
    var IeqC = IeqF - kR * IeqR;
    /* Ib = (gIf/bf)*(Vb-Ve) + (gIr/br)*(Vb-Vc) + IeqB
       Ic = gIf*(Vb-Ve) - kR*gIr*(Vb-Vc) + IeqC
       current leaving the node is that current. */
    function add(row, col, val) {
      var ir = idxOf(map, row);
      var ic = idxOf(map, col);
      if (ir >= 0 && ic >= 0 && val) sys.A[ir][ic] += val;
    }
    var gb = gIf / bf;
    var gr = gIr / br;
    /* Ib coefficients vs Vb, Vc, Ve */
    add(nb, nb, gb + gr);
    add(nb, nc, -gr);
    add(nb, ne, -gb);
    if (idxOf(map, nb) >= 0) sys.z[idxOf(map, nb)] -= IeqB;
    /* Ic */
    add(nc, nb, gIf - kR * gIr);
    add(nc, nc, kR * gIr);
    add(nc, ne, -gIf);
    if (idxOf(map, nc) >= 0) sys.z[idxOf(map, nc)] -= IeqC;
    /* Ie = -Ib - Ic so leaving-emitter coefficients are the negative sum */
    add(ne, nb, -(gb + gr) - (gIf - kR * gIr));
    add(ne, nc, -(-gr) - kR * gIr);
    add(ne, ne, -(-gb) - (-gIf));
    if (idxOf(map, ne) >= 0) sys.z[idxOf(map, ne)] -= -IeqB - IeqC;
  }

  function stampOp(sys, map, layout, part, nets, vmap, state) {
    var ex = extraFor(layout, part.id);
    var nOut = pinNode(nets, part, "out");
    var nP = pinNode(nets, part, "inp");
    var nN = pinNode(nets, part, "inn");
    var rails = opRails(part, nets, vmap);
    var aol = Math.max(1000, num(part.props, "aol", 100000));
    var vo = nodeV(vmap, nOut);
    var rail = state.rail[part.id] || "";
    if (!rail) {
      if (vo > rails.hi + 1e-4) rail = "hi";
      else if (vo < rails.lo - 1e-4) rail = "lo";
    }
    stampV(sys, map, nOut, "0", ex.index, 0);
    /* Replace the Vp-Vn = 0 rows that stampV wrote with the real constraint.
       stampV set A[extra][out]=1 and z[extra]=0 against ground. Undo ground
       reference and write the amplifier constraint. */
    var ie = ex.index;
    for (var c = 0; c < sys.A.length; c++) sys.A[ie][c] = 0;
    sys.z[ie] = 0;
    var iOut = idxOf(map, nOut);
    var iP = idxOf(map, nP);
    var iN = idxOf(map, nN);
    if (rail === "hi" || rail === "lo") {
      var target = rail === "hi" ? rails.hi : rails.lo;
      if (iOut >= 0) sys.A[ie][iOut] = 1;
      sys.z[ie] = target;
    } else {
      if (iOut >= 0) sys.A[ie][iOut] = 1 / aol;
      if (iP >= 0) sys.A[ie][iP] -= 1;
      if (iN >= 0) sys.A[ie][iN] += 1;
    }
    state._opRailNext = state._opRailNext || {};
    state._opRailNext[part.id] = rail;
  }

  function readVoltages(layout, nets, x) {
    var v = { "0": 0 };
    nets.nodes.forEach(function (id) {
      v[id] = x[layout.map[id]];
    });
    return v;
  }

  function maxDelta(a, b, nodes) {
    var m = 0;
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i];
      var d = Math.abs((a[id] || 0) - (b[id] || 0));
      if (d > m) m = d;
    }
    return m;
  }

  function limitMap(prev, next, nodes, lim) {
    var out = { "0": 0 };
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i];
      var p = prev[id] || 0;
      var n = next[id] || 0;
      var d = n - p;
      if (d > lim) d = lim;
      if (d < -lim) d = -lim;
      out[id] = p + d;
    }
    return out;
  }

  function nonlinear(doc) {
    var parts = doc.parts || [];
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i].type;
      if (t === "d" || t === "led" || t === "npn" || t === "op") return true;
    }
    return false;
  }

  function dcReachable(doc, nets, state) {
    var seen = { "0": true };
    function touch(node) {
      if (node == null || seen[node]) return false;
      seen[node] = true;
      return true;
    }
    function link(a, b) {
      var hit = false;
      if (seen[a]) hit = touch(b) || hit;
      if (seen[b]) hit = touch(a) || hit;
      return hit;
    }
    var guard = 0;
    var grew = true;
    while (grew && guard < 100) {
      guard++;
      grew = false;
      (doc.parts || []).forEach(function (part) {
        var t = part.type;
        if (t === "r") {
          if (link(pinNode(nets, part, "a"), pinNode(nets, part, "b"))) grew = true;
        } else if (t === "vdc" || t === "vac") {
          if (link(pinNode(nets, part, "p"), pinNode(nets, part, "n"))) grew = true;
        } else if (t === "pot") {
          if (link(pinNode(nets, part, "a"), pinNode(nets, part, "w"))) grew = true;
          if (link(pinNode(nets, part, "w"), pinNode(nets, part, "b"))) grew = true;
        } else if (t === "sw" && part.props && part.props.closed) {
          if (link(pinNode(nets, part, "a"), pinNode(nets, part, "b"))) grew = true;
        } else if (t === "l") {
          if (link(pinNode(nets, part, "a"), pinNode(nets, part, "b"))) grew = true;
        } else if (t === "d" || t === "led") {
          if (link(pinNode(nets, part, "a"), pinNode(nets, part, "k"))) grew = true;
        } else if (t === "npn") {
          if (link(pinNode(nets, part, "c"), pinNode(nets, part, "e"))) grew = true;
          if (link(pinNode(nets, part, "b"), pinNode(nets, part, "e"))) grew = true;
        } else if (t === "op" || isGate(t) || t === "ic555") {
          var y = t === "op" ? "out" : t === "ic555" ? "out" : "y";
          if (touch(pinNode(nets, part, y))) grew = true;
          if (t === "ic555" && state && !state.latch[part.id]) {
            if (link(pinNode(nets, part, "dis"), pinNode(nets, part, "gnd"))) grew = true;
          }
        }
      });
    }
    return seen;
  }

  function solveOnce(doc, state, ctx) {
    var nets = buildNets(doc);
    var warnings = [];
    if (!nets.hasGround) {
      warnings.push({ code: "no-ground", text: "Add a ground. Voltages need a 0 V reference." });
      return { ok: false, warnings: warnings, v: { "0": 0 }, pinV: {}, part: {}, nets: nets };
    }
    if (!state.v) state.v = { "0": 0 };
    if (!state.digital) state.digital = {};
    if (!state.latch) state.latch = {};
    if (!state.capV) state.capV = {};
    if (!state.indI) state.indI = {};
    if (!state.rail) state.rail = {};
    var layout = allocate(doc, nets);
    if (!layout.n) {
      return { ok: true, warnings: warnings, v: { "0": 0 }, pinV: {}, part: {}, nets: nets, layout: layout };
    }
    var hasJunction = false;
    (doc.parts || []).forEach(function (p) {
      if (p.type === "d" || p.type === "led" || p.type === "npn") hasJunction = true;
    });
    var nl = nonlinear(doc);
    var converged = false;
    var x = null;
    var singular = false;
    for (var iter = 0; iter < (nl ? 80 : 8); iter++) {
      if (!ctx.freezeDigital) updateDigital(doc, nets, state, ctx);
      state._opRailNext = {};
      var sys = buildSystem(doc, nets, layout, state, ctx);
      x = solveLinear(sys.A, sys.z);
      if (!x) {
        singular = true;
        break;
      }
      var next = readVoltages(layout, nets, x);
      var deltaFull = maxDelta(state.v, next, nets.nodes);
      var stepped = hasJunction && deltaFull > 0.75 && iter < 50 ? limitMap(state.v, next, nets.nodes, 0.35) : next;
      var railChange = false;
      var rails = state._opRailNext || {};
      Object.keys(rails).forEach(function (id) {
        var part = partById(doc, id);
        if (!part) return;
        var vo = next[pinNode(nets, part, "out")] || 0;
        var lim = opRails(part, nets, next);
        var resolved = "";
        if (vo > lim.hi + 1e-3) resolved = "hi";
        else if (vo < lim.lo - 1e-3) resolved = "lo";
        if ((state.rail[id] || "") !== resolved) {
          state.rail[id] = resolved;
          railChange = true;
        }
      });
      state.v = stepped;
      if (stepped === next && deltaFull < 1e-6 && !railChange) {
        converged = true;
        break;
      }
      if (!hasJunction && !railChange && deltaFull < 1e-8) {
        converged = true;
        break;
      }
    }
    if (singular) {
      warnings.push({ code: "singular", text: "The solver could not balance this circuit. Look for a short across a voltage source, or a loop of voltage sources." });
      return { ok: false, warnings: warnings, v: state.v, pinV: {}, part: {}, nets: nets, layout: layout };
    }
    if (nl && !converged) {
      warnings.push({ code: "converge", text: "The operating point did not settle. The last estimate is shown." });
    }
    if (x) state.v = readVoltages(layout, nets, x);
    if (ctx.mode === "dc") {
      var reached = dcReachable(doc, nets, state);
      nets.nodes.forEach(function (id) {
        if (!reached[id] && netSize(nets, id) > 1) {
          warnings.push({ code: "floating", text: "A node has no DC path to ground. Capacitors are open at DC, and an open switch leaves the far side floating." });
        }
      });
    }
    /* de-dupe floating to one warning */
    var seenW = {};
    warnings = warnings.filter(function (w) {
      if (w.code !== "floating") return true;
      if (seenW.floating) return false;
      seenW.floating = true;
      return true;
    });
    var evaluated = evaluate(doc, nets, layout, state, x, ctx);
    evaluated.warnings = warnings.concat(evaluated.warnings);
    evaluated.ok = !singular;
    evaluated.converged = converged || !nl;
    evaluated.nets = nets;
    evaluated.layout = layout;
    return evaluated;
  }

  function evaluate(doc, nets, layout, state, x, ctx) {
    var v = state.v;
    var pinV = {};
    Object.keys(nets.pinNode).forEach(function (key) {
      pinV[key] = nodeV(v, nets.pinNode[key]);
    });
    var partOut = {};
    var warnings = [];
    (doc.parts || []).forEach(function (part) {
      var t = part.type;
      if (!LIB[t]) return;
      var info = { i: 0, v: 0 };
      if (t === "r") {
        var va = nodeV(v, pinNode(nets, part, "a"));
        var vb = nodeV(v, pinNode(nets, part, "b"));
        var ohms = Math.max(0.001, num(part.props, "ohms", 1000));
        info.v = va - vb;
        info.i = info.v / ohms;
      } else if (t === "pot") {
        var sec = potSections(part);
        var paw = nodeV(v, pinNode(nets, part, "a")) - nodeV(v, pinNode(nets, part, "w"));
        var pwb = nodeV(v, pinNode(nets, part, "w")) - nodeV(v, pinNode(nets, part, "b"));
        info.v = nodeV(v, pinNode(nets, part, "a")) - nodeV(v, pinNode(nets, part, "b"));
        info.i = paw / sec.raw;
        info.iw = paw / sec.raw - pwb / sec.rwb;
      } else if (t === "sw") {
        var vs = nodeV(v, pinNode(nets, part, "a")) - nodeV(v, pinNode(nets, part, "b"));
        info.v = vs;
        info.i = part.props && part.props.closed ? vs / MODELS.switchR : 0;
      } else if (t === "vdc" || t === "vac" || t === "op" || isGate(t) || t === "ic555") {
        var ex = extraFor(layout, part.id);
        var leavingPos = x[ex.index];
        info.i = -leavingPos;
        if (t === "vdc" || t === "vac") {
          info.v = nodeV(v, pinNode(nets, part, "p")) - nodeV(v, pinNode(nets, part, "n"));
          if (Math.abs(info.i) > 5) {
            warnings.push({ code: "short", text: "A source is pushing more than 5 A. That is a short, or a near short, across " + (t === "vac" ? "the AC source" : "the DC source") + "." });
          }
        } else if (t === "op") {
          info.v = nodeV(v, pinNode(nets, part, "out"));
        } else if (t === "ic555") {
          info.v = nodeV(v, pinNode(nets, part, "out"));
          info.latch = state.latch[part.id] ? 1 : 0;
        } else {
          info.v = nodeV(v, pinNode(nets, part, "y"));
        }
      } else if (t === "idc") {
        info.i = num(part.props, "a", 0.001);
        info.v = nodeV(v, pinNode(nets, part, "p")) - nodeV(v, pinNode(nets, part, "n"));
      } else if (t === "d" || t === "led") {
        var model = t === "led" ? MODELS.led : MODELS.diode;
        var vd = nodeV(v, pinNode(nets, part, "a")) - nodeV(v, pinNode(nets, part, "k"));
        var iv = diodeIV(vd, model.Is, model.n);
        info.v = vd;
        info.i = iv.i;
        if (t === "led" && info.i > MODELS.ledMaxA) {
          warnings.push({
            code: "led-over",
            text: "LED current is about " + (info.i * 1000).toFixed(1) + " mA. Above 20 mA is a rough over-current hint for a small indicator LED. Series resistance keeps it alive."
          });
        }
      } else if (t === "c") {
        var vc = nodeV(v, pinNode(nets, part, "a")) - nodeV(v, pinNode(nets, part, "b"));
        info.v = vc;
        if (ctx.mode === "tran") {
          var c = Math.max(1e-15, num(part.props, "farads", 1e-6));
          var prev = state.capV[part.id] || 0;
          info.i = (c / Math.max(ctx.dt, 1e-15)) * (vc - prev);
        } else info.i = 0;
        info.storeV = vc;
      } else if (t === "l") {
        var vl = nodeV(v, pinNode(nets, part, "a")) - nodeV(v, pinNode(nets, part, "b"));
        info.v = vl;
        if (ctx.mode === "dc") info.i = vl / 0.001;
        else {
          var L = Math.max(1e-12, num(part.props, "henries", 0.1));
          info.i = (state.indI[part.id] || 0) + (ctx.dt / L) * vl;
        }
        info.storeI = info.i;
      } else if (t === "npn") {
        var beta = Math.max(1, num(part.props, "beta", 100));
        var Vb = nodeV(v, pinNode(nets, part, "b"));
        var Vc = nodeV(v, pinNode(nets, part, "c"));
        var Ve = nodeV(v, pinNode(nets, part, "e"));
        var be = diodeIV(Vb - Ve, beta * MODELS.npnIsb, 1);
        var bc = diodeIV(Vb - Vc, MODELS.npnIsb, 1);
        var If = be.i;
        var Ir = bc.i;
        info.ib = If / beta + Ir;
        info.ic = If - 2 * Ir;
        info.ie = -info.ic - info.ib;
        info.i = info.ic;
        info.v = Vc - Ve;
        info.vbe = Vb - Ve;
      }
      partOut[part.id] = info;
    });
    return { ok: true, warnings: warnings, v: v, pinV: pinV, part: partOut };
  }

  function freshState() {
    return { v: { "0": 0 }, capV: {}, indI: {}, digital: {}, latch: {}, rail: {}, t: 0 };
  }

  function absorbStores(state, result, ctx) {
    if (!result || !result.part) return;
    Object.keys(result.part).forEach(function (id) {
      var info = result.part[id];
      if (info.storeV != null && ctx.mode === "tran") state.capV[id] = info.storeV;
      if (info.storeI != null && ctx.mode === "tran") state.indI[id] = info.storeI;
      if (info.storeI != null && ctx.mode === "dc") state.indI[id] = info.storeI;
    });
  }

  function dcOperatingPoint(doc) {
    var state = freshState();
    var ctx = { mode: "dc", t: 0, dt: 1e-4, freezeDigital: false };
    var result = null;
    for (var k = 0; k < 12; k++) {
      var prevDig = JSON.stringify(state.digital) + JSON.stringify(state.latch);
      result = solveOnce(doc, state, ctx);
      absorbStores(state, result, ctx);
      var nowDig = JSON.stringify(state.digital) + JSON.stringify(state.latch);
      if (prevDig === nowDig && result.converged !== false) break;
    }
    if (result) result.state = state;
    return result;
  }

  function stepTransient(doc, state, dt) {
    var ctx = { mode: "tran", t: state.t || 0, dt: dt, freezeDigital: true };
    updateDigital(doc, buildNets(doc), state, ctx);
    ctx.freezeDigital = true;
    var result = solveOnce(doc, state, ctx);
    absorbStores(state, result, ctx);
    state.t = (state.t || 0) + dt;
    if (result) {
      result.t = state.t;
      result.state = state;
    }
    return result;
  }

  function runTransient(doc, opts) {
    opts = opts || {};
    var dt = opts.dt || 1e-5;
    var tEnd = opts.tEnd || 0.01;
    var stride = opts.stride || 1;
    var state = opts.state || freshState();
    if (opts.fromDc) {
      var dc = dcOperatingPoint(doc);
      state = dc.state || state;
      state.t = 0;
    }
    var steps = Math.max(1, Math.round(tEnd / dt));
    var samples = [];
    var last = null;
    for (var s = 0; s < steps; s++) {
      last = stepTransient(doc, state, dt);
      if (s % stride === 0 || s === steps - 1) {
        samples.push({
          t: state.t,
          pinV: last && last.pinV ? clone(last.pinV) : {},
          part: last && last.part ? clone(last.part) : {}
        });
      }
    }
    return { samples: samples, state: state, last: last };
  }

  function wire(a, b) {
    return { id: "w-" + a + "-" + b, a: a, b: b };
  }

  function examples() {
    return [
      {
        id: "divider",
        name: "Voltage divider",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vdc", x: 2, y: 1, rot: 0, props: { v: 10 } },
            { id: "g1", type: "gnd", x: 2, y: 8, rot: 0, props: {} },
            { id: "r1", type: "r", x: 4, y: 1, rot: 0, props: { ohms: 1000 } },
            { id: "r2", type: "r", x: 8, y: 1, rot: 1, props: { ohms: 2000 } },
            { id: "g2", type: "gnd", x: 8, y: 6, rot: 0, props: {} }
          ],
          wires: [wire("v1.p", "r1.a"), wire("v1.n", "g1.p"), wire("r1.b", "r2.a"), wire("r2.b", "g2.p")]
        }
      },
      {
        id: "rc",
        name: "RC charge",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vdc", x: 1, y: 1, rot: 0, props: { v: 5 } },
            { id: "r1", type: "r", x: 3, y: 1, rot: 0, props: { ohms: 1000 } },
            { id: "c1", type: "c", x: 8, y: 1, rot: 0, props: { farads: 1e-6 } },
            { id: "g1", type: "gnd", x: 1, y: 6, rot: 0, props: {} },
            { id: "g2", type: "gnd", x: 8, y: 4, rot: 0, props: {} }
          ],
          wires: [wire("v1.p", "r1.a"), wire("r1.b", "c1.a"), wire("v1.n", "g1.p"), wire("c1.b", "g2.p")]
        }
      },
      {
        id: "led",
        name: "LED and resistor",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vdc", x: 1, y: 1, rot: 0, props: { v: 5 } },
            { id: "r1", type: "r", x: 3, y: 1, rot: 0, props: { ohms: 330 } },
            { id: "d1", type: "led", x: 8, y: 1, rot: 1, props: {} },
            { id: "g1", type: "gnd", x: 1, y: 6, rot: 0, props: {} },
            { id: "g2", type: "gnd", x: 8, y: 5, rot: 0, props: {} }
          ],
          wires: [wire("v1.p", "r1.a"), wire("r1.b", "d1.a"), wire("v1.n", "g1.p"), wire("d1.k", "g2.p")]
        }
      },
      {
        id: "rectifier",
        name: "Half-wave rectifier",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vac", x: 1, y: 1, rot: 0, props: { vpeak: 5, hz: 60 } },
            { id: "d1", type: "d", x: 3, y: 1, rot: 0, props: {} },
            { id: "r1", type: "r", x: 7, y: 1, rot: 1, props: { ohms: 1000 } },
            { id: "g1", type: "gnd", x: 1, y: 6, rot: 0, props: {} },
            { id: "g2", type: "gnd", x: 7, y: 6, rot: 0, props: {} }
          ],
          wires: [wire("v1.p", "d1.a"), wire("d1.k", "r1.a"), wire("v1.n", "g1.p"), wire("r1.b", "g2.p")]
        }
      },
      {
        id: "rl",
        name: "RL current",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vdc", x: 1, y: 1, rot: 0, props: { v: 10 } },
            { id: "r1", type: "r", x: 3, y: 1, rot: 0, props: { ohms: 100 } },
            { id: "l1", type: "l", x: 8, y: 1, rot: 0, props: { henries: 0.1 } },
            { id: "g1", type: "gnd", x: 1, y: 6, rot: 0, props: {} },
            { id: "g2", type: "gnd", x: 12, y: 3, rot: 0, props: {} }
          ],
          wires: [wire("v1.p", "r1.a"), wire("r1.b", "l1.a"), wire("l1.b", "g2.p"), wire("v1.n", "g1.p")]
        }
      },
      {
        id: "opamp",
        name: "Op-amp ×3",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vdc", x: 1, y: 2, rot: 0, props: { v: 1 } },
            { id: "g0", type: "gnd", x: 1, y: 6, rot: 0, props: {} },
            { id: "u1", type: "op", x: 6, y: 2, rot: 0, props: { vp: 12, vn: -12, aol: 100000 } },
            { id: "rg", type: "r", x: 6, y: 5, rot: 1, props: { ohms: 1000 } },
            { id: "rf", type: "r", x: 8, y: 2, rot: 0, props: { ohms: 2000 } },
            { id: "g1", type: "gnd", x: 6, y: 8, rot: 0, props: {} }
          ],
          wires: [
            wire("v1.p", "u1.inp"),
            wire("v1.n", "g0.p"),
            wire("u1.inn", "rg.a"),
            wire("rg.b", "g1.p"),
            wire("u1.inn", "rf.a"),
            wire("rf.b", "u1.out")
          ]
        }
      },
      {
        id: "astable",
        name: "555 astable",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vdc", x: 1, y: 1, rot: 0, props: { v: 5 } },
            { id: "g1", type: "gnd", x: 1, y: 8, rot: 0, props: {} },
            { id: "u1", type: "ic555", x: 8, y: 2, rot: 0, props: {} },
            { id: "ra", type: "r", x: 3, y: 1, rot: 0, props: { ohms: 10000 } },
            { id: "rb", type: "r", x: 8, y: 0, rot: 0, props: { ohms: 10000 } },
            { id: "c1", type: "c", x: 12, y: 4, rot: 0, props: { farads: 1e-6 } },
            { id: "g2", type: "gnd", x: 12, y: 7, rot: 0, props: {} }
          ],
          wires: [
            wire("v1.p", "ra.a"),
            wire("v1.n", "g1.p"),
            wire("ra.b", "u1.dis"),
            wire("ra.b", "rb.a"),
            wire("rb.b", "u1.thr"),
            wire("u1.thr", "u1.trig"),
            wire("u1.thr", "c1.a"),
            wire("c1.b", "g2.p"),
            wire("u1.vcc", "v1.p"),
            wire("u1.gnd", "g1.p"),
            wire("u1.reset", "v1.p")
          ]
        }
      },
      {
        id: "nand",
        name: "NAND gate",
        doc: {
          v: 1,
          parts: [
            { id: "v1", type: "vdc", x: 1, y: 1, rot: 0, props: { v: 5 } },
            { id: "g1", type: "gnd", x: 1, y: 7, rot: 0, props: {} },
            { id: "u1", type: "nand", x: 6, y: 2, rot: 0, props: { voh: 5 } },
            { id: "rl", type: "r", x: 10, y: 3, rot: 1, props: { ohms: 10000 } },
            { id: "g2", type: "gnd", x: 10, y: 7, rot: 0, props: {} }
          ],
          wires: [
            wire("v1.p", "u1.vcc"),
            wire("v1.p", "u1.a"),
            wire("v1.p", "u1.b"),
            wire("v1.n", "g1.p"),
            wire("u1.gnd", "g1.p"),
            wire("u1.y", "rl.a"),
            wire("rl.b", "g2.p")
          ]
        }
      }
    ];
  }

  function example(id) {
    var all = examples();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return clone(all[i]);
    return null;
  }

  function normalizeDoc(doc) {
    var out = { v: 1, parts: [], wires: [] };
    (doc && doc.parts || []).forEach(function (p) {
      if (!p || !LIB[p.type] || !p.id) return;
      var props = clone(LIB[p.type].props || {});
      if (p.props) {
        Object.keys(p.props).forEach(function (k) {
          props[k] = p.props[k];
        });
      }
      out.parts.push({
        id: String(p.id),
        type: p.type,
        x: +p.x || 0,
        y: +p.y || 0,
        rot: ((+p.rot || 0) % 4 + 4) % 4,
        flip: !!p.flip,
        props: props
      });
    });
    var seen = {};
    out.parts.forEach(function (p) { seen[p.id] = p; });
    (doc && doc.wires || []).forEach(function (w) {
      if (!w || !w.a || !w.b) return;
      var ap = String(w.a).split(".")[0];
      var bp = String(w.b).split(".")[0];
      if (!seen[ap] || !seen[bp]) return;
      out.wires.push({ id: w.id ? String(w.id) : "w" + out.wires.length, a: String(w.a), b: String(w.b) });
    });
    return out;
  }

  function serialize(doc) {
    return JSON.stringify(normalizeDoc(doc), null, 2);
  }

  function deserialize(text) {
    var doc = JSON.parse(text);
    if (!doc || !Array.isArray(doc.parts)) throw new Error("Not a circuit file");
    return normalizeDoc(doc);
  }

  function encodeShare(doc) {
    var json = JSON.stringify(normalizeDoc(doc));
    var b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeShare(token) {
    var b64 = String(token || "").replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    var json = decodeURIComponent(escape(atob(b64)));
    return deserialize(json);
  }

  function emptyDoc() {
    return { v: 1, parts: [], wires: [] };
  }

  return {
    MODELS: MODELS,
    LIB: LIB,
    diodeIV: diodeIV,
    transformPin: transformPin,
    pinWorld: pinWorld,
    partPins: partPins,
    buildNets: buildNets,
    dcOperatingPoint: dcOperatingPoint,
    stepTransient: stepTransient,
    runTransient: runTransient,
    freshState: freshState,
    examples: examples,
    example: example,
    normalizeDoc: normalizeDoc,
    serialize: serialize,
    deserialize: deserialize,
    encodeShare: encodeShare,
    decodeShare: decodeShare,
    emptyDoc: emptyDoc,
    solveLinear: solveLinear,
    potSections: potSections,
    isGate: isGate
  };
});
