/* Gravitational-wave chirp checks. Results come from the formulas, not from stored outputs.
   Run: node science/astronomy/gravitational-waves/gravitational-waves.test.js */
"use strict";

var fs = require("fs");
var path = require("path");
var G = require("./gravitational-waves.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

assert(G.C === 299792458, "exact c");
assert(G.GM_SUN === 1.3271244e20, "IAU nominal GM sun");
assert(G.AU_M === 149597870700, "exact IAU au");
assert(near(G.PC_M, (648000 / Math.PI) * G.AU_M, 0), "parsec is (648000/pi) au");
assert(G.GW150914_M1 === 36 && G.GW150914_M2 === 29, "discovery abstract masses");
assert(G.GW150914_MPC === 410 && G.GW150914_F === 35, "discovery distance and start frequency");
assert(G.GW150914_SOURCE_CHIRP === 28.0, "properties source-frame chirp median");
assert(G.GW150914_DET_CHIRP === 30.4, "properties detector-frame chirp median");
assert(G.GW150914_DET_M1 === 38.9 && G.GW150914_DET_M2 === 31.6, "detector-frame component medians");
assert(G.GW150914_PEAK_STRAIN === 1.0e-21, "discovery peak strain");
assert(G.GW170817_TOTAL === 2.74 && G.GW170817_MPC === 40 && G.GW170817_F === 24, "GW170817 published anchors");
assert(G.GW170817_SOURCE_CHIRP === 1.188, "GW170817 source chirp");
assert(G.GW170817_DET_CHIRP === 1.1977, "GW170817 detector chirp");
assert(G.GW170817_TIDAL_HZ === 600, "cited tidal frequency");

/* Chirp mass of the discovery abstract's 36 and 29 is the Newtonian combination. */
var mc = G.chirpMass(36, 29);
assert(mc > 28 && mc < 30, "GW150914 chirp mass is between 28 and 30, got " + mc);
assert(G.formatMass(mc) === "28.10 M☉", "prints " + G.formatMass(mc));
assert(near(mc, Math.pow(36 * 29, 0.6) / Math.pow(65, 0.2), 0), "chirp definition");

var detMc = G.chirpMass(G.GW150914_DET_M1, G.GW150914_DET_M2);
assert(detMc > 30 && detMc < 31, "detector-frame medians land near 30.4, got " + detMc);
assert(G.formatMass(detMc) === "30.49 M☉", "detector-frame print " + G.formatMass(detMc));

var bnsMc = G.chirpMass(1.37, 1.37);
assert(bnsMc > 1.18 && bnsMc < 1.2, "equal split is near the published 1.188, got " + bnsMc);
assert(G.formatMass(bnsMc) === "1.193 M☉", "BNS print " + G.formatMass(bnsMc));
assert(near(bnsMc, 2.74 * Math.pow(0.25, 0.6), 1e-12), "equal-mass chirp is M/4^(3/5)");

/* Time to coalescence is the integral of the cited f-dot. */
var tau = G.timeToCoalescence(mc, 35);
assert(G.formatDuration(tau) === "0.190 s", "35 Hz coalescence " + G.formatDuration(tau));
var sweep = tau - G.timeToCoalescence(mc, 150);
assert(G.formatDuration(sweep) === "0.186 s", "35 to 150 Hz is near the paper's about 0.2 s, got " + G.formatDuration(sweep));
assert(sweep > 0.15 && sweep < 0.25, "sweep stays near 0.2 s");

var fdot = G.frequencyDerivative(mc, 35);
var df = 1e-4;
var numerical = (G.timeToCoalescence(mc, 35) - G.timeToCoalescence(mc, 35 + df)) / df;
assert(near(numerical, 1 / fdot, 1e-6), "tau derivative matches f-dot");

var fLater = G.frequencyAtTime(mc, 35, tau * 0.5);
assert(fLater > 35, "frequency rises");
var back = G.frequencyDerivative(mc, fLater);
var step = 1e-6;
var fromPhase = (G.phaseAtTime(mc, 35, tau * 0.5 + step) - G.phaseAtTime(mc, 35, tau * 0.5)) / step;
assert(near(fromPhase / (2 * Math.PI), fLater, 1e-3), "phase derivative is the frequency");
assert(isFinite(back), "f-dot stays finite");

/* ISCO: Kepler at r = 6GM/c², gravitational-wave frequency twice orbital. */
var total = 65;
var gm = total * G.GM_SUN;
var r = 6 * gm / (G.C * G.C);
var omega = Math.sqrt(gm / (r * r * r));
assert(near(G.iscoFrequency(total), omega / Math.PI, 1e-6), "ISCO frequency is Kepler");
assert(G.formatHz(G.iscoFrequency(65)) === "67.65 Hz", "65 solar masses " + G.formatHz(G.iscoFrequency(65)));
assert(G.iscoFrequency(65) < 250, "the marker sits below the observed 250 Hz sweep");
assert(G.formatHz(G.iscoFrequency(1e6)) === "4.397 mHz", "million solar masses " + G.formatHz(G.iscoFrequency(1e6)));
assert(G.iscoFrequency(1e6) > 1e-4 && G.iscoFrequency(1e6) < 1, "million-solar-mass marker is in the millihertz");

/* Face-on strain matches the reduced-mass form, and scales as 1/D and f^(2/3). */
var h = G.strainAmplitude(mc, 35, 410);
var hMu = G.strainFromReduced(36, 29, 35, 410);
assert(near(h, hMu, Math.abs(h) * 1e-12), "chirp-mass and reduced-mass strains agree");
assert(near(G.strainAmplitude(mc, 35, 820), h / 2, Math.abs(h) * 1e-12), "strain falls as 1/D");
assert(near(G.strainAmplitude(mc, 70, 410) / h, Math.pow(2, 2 / 3), 1e-12), "strain grows as f^(2/3)");
assert(h > 1e-22 && h < 1e-20, "GW150914 strain is order 10^-21, got " + h);
assert(G.formatStrain(h) === "8.054×10⁻²²", "strain print " + G.formatStrain(h));
var h150 = G.strainAmplitude(mc, 150, 410);
assert(G.formatStrain(h150) === "2.125×10⁻²¹", "150 Hz strain " + G.formatStrain(h150));
assert(h150 > G.GW150914_PEAK_STRAIN, "face-on formula is not the detector peak");

var gw = G.presetModel("gw150914");
assert(gw && gw.chirp === mc, "preset uses 36 and 29");
assert(G.formatDuration(gw.tIsco) === "0.157 s", "time to the marker " + G.formatDuration(gw.tIsco));
assert(gw.fHz < gw.fIsco, "the button starts below the marker");
assert(G.explain(gw).indexOf("28.10 M☉") !== -1, "explain names the chirp");
assert(G.explain(gw).indexOf("Not a waveform model") !== -1, "explain names the limit");
assert(G.explain(gw).indexOf("0.190 s") !== -1, "explain names the time");

var bns = G.presetModel("gw170817");
assert(bns.m1 === 1.37 && bns.m2 === 1.37, "equal split of 2.74");
assert(G.formatDuration(bns.tau) === "100.65 s", "24 Hz coalescence " + G.formatDuration(bns.tau));
assert(bns.tau > 90 && bns.tau < 110, "near the paper's about 100 s");
assert(G.formatHz(bns.fIsco) === "1,605 Hz", "BNS marker " + G.formatHz(bns.fIsco));
assert(bns.fIsco > G.GW170817_TIDAL_HZ, "the black-hole marker sits above the paper's tidal frequency");
assert(G.formatStrain(bns.strain) === "3.316×10⁻²³", "BNS strain " + G.formatStrain(bns.strain));

var papers = G.explainPapers();
assert(papers.indexOf("28.10 M☉") !== -1 && papers.indexOf("30.49 M☉") !== -1, "papers compare both frames");
assert(papers.indexOf("1.0×10⁻²¹") !== -1, "papers quote the peak strain");
assert(papers.indexOf("0.186 s") !== -1 && papers.indexOf("about 0.2 s") !== -1, "papers compare the sweep");
assert(papers.indexOf("1.193 M☉") !== -1 && papers.indexOf("1.188") !== -1, "papers compare the neutron-star chirp");
assert(papers.indexOf("100.65 s") !== -1 && papers.indexOf("about 100 s") !== -1, "papers compare the minute");
assert(papers.indexOf("(1+z)") !== -1, "papers name the redshift");

var bands = G.explainBands();
assert(bands.indexOf("10 Hz to 10 kHz") !== -1, "LIGO band");
assert(bands.indexOf("0.1 mHz to 1 Hz") !== -1, "LISA band");
assert(bands.indexOf("4.397 mHz") !== -1, "computed million-solar-mass marker");
assert(bands.indexOf("not a detected event") !== -1, "the million-solar-mass line is labeled");

var why = G.explainWhy();
assert(why.chirp.indexOf("leading-order") !== -1, "chirp paragraph");
assert(why.tau.indexOf("not a merger") !== -1, "tau paragraph");
assert(why.strain.indexOf("face-on") !== -1, "strain paragraph");
assert(why.isco.indexOf("6GM/c²") !== -1, "isco paragraph");

var trace = G.series(gw, 200);
assert(trace && trace.trimmed === false, "the black-hole chirp fits in the window");
assert(trace.f[0] === 35, "trace starts at 35 Hz");
assert(trace.f[trace.f.length - 1] > 200, "trace climbs past the marker, got " + trace.f[trace.f.length - 1]);
assert(trace.amp[trace.amp.length - 1] > trace.amp[0], "amplitude rises");
assert(trace.tIsco > trace.t0 && trace.tIsco < trace.t1, "the marker sits inside the black-hole trace");

var long = G.series(bns, 200);
assert(long.trimmed === true, "the neutron-star chirp is trimmed to its last stretch");
assert(long.t1 - long.t0 <= G.VIEW_MAX_S + 1e-9, "trim respects the window");
assert(long.f[long.f.length - 1] > long.f[0], "trimmed frequency still rises");
assert(long.tIsco > long.t0 && long.tIsco < long.t1, "the neutron-star marker is inside the last stretch");

var tone = G.buildTone(gw, { sampleRate: 8000, pitch: 1 });
assert(tone && tone.samples.length > 100, "tone has samples");
assert(tone.capped === false, "1× of this chirp fits the audio rate");
function crossings(samples, a, b) {
  var n = 0;
  var i;
  for (i = a + 1; i < b; i++) if ((samples[i - 1] <= 0 && samples[i] > 0) || (samples[i - 1] >= 0 && samples[i] < 0)) n += 1;
  return n;
}
var mid = Math.floor(tone.samples.length / 2);
assert(crossings(tone.samples, mid, tone.samples.length) > crossings(tone.samples, 0, mid), "the sonification chirps upward");
var loud = 0;
var i;
for (i = 0; i < tone.samples.length; i++) loud = Math.max(loud, Math.abs(tone.samples[i]));
assert(loud <= 0.91, "normalized below clipping");
assert(G.buildTone(gw, { sampleRate: 8000, pitch: 0 }) === null, "pitch must be positive");

assert(G.model({ m1: 0.4, m2: 29, distanceMpc: 410, fHz: 35 }) === null, "mass floor");
assert(G.model({ m1: 36, m2: 29, distanceMpc: 0, fHz: 35 }) === null, "distance floor");
assert(G.model({ m1: 36, m2: 29, distanceMpc: 410, fHz: 3000 }) === null, "frequency ceiling");
assert(G.model(null) === null, "empty");
var high = G.model({ m1: 36, m2: 29, distanceMpc: 410, fHz: 200 });
assert(high && high.aboveIsco === true && high.tIsco === null, "above the marker");
assert(G.explain(high).indexOf("already above") !== -1, "explain says so");
assert(near(G.massFromUnit(G.unitFromMass(36)), 36, 1e-9), "mass slider round trip");
assert(near(G.distanceFromUnit(G.unitFromDistance(410)), 410, 1e-6), "distance slider round trip");
assert(near(G.frequencyFromUnit(G.unitFromFrequency(35)), 35, 1e-9), "frequency slider round trip");
assert(G.matchedPreset(gw) === "gw150914", "preset match");
assert(G.matchedPreset(bns) === "gw170817", "bns preset match");
assert(G.matchedPreset(high) === "", "custom is not a preset");

var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert(html.indexOf("{% include nav.html %}") !== -1, "nav include");
assert(html.indexOf("{% include head-layout.html %}") !== -1, "head layout");
assert(html.indexOf("{% include footer.html %}") !== -1, "footer");
assert(html.indexOf("googletagmanager") === -1, "ga lives in the nav include");
assert(html.indexOf("G-2QSEBDSWKL") === -1, "measurement id stays in the nav include");
assert(html.indexOf("/science/astronomy/gravitational-waves/") !== -1, "canonical path");
assert(html.indexOf("subnav-desk") !== -1 && html.indexOf("subnav-phone") !== -1, "two menus");
assert(html.indexOf('aria-current="page"') !== -1, "current section");
assert(html.indexOf("gravitational-waves.js") !== -1, "module");
assert(html.indexOf("min-height:44px") !== -1, "touch target");
assert(html.indexOf('class="help-q"') !== -1 && html.indexOf("help-dialog") !== -1 && html.indexOf("has-help") !== -1, "help control");
assert(html.indexOf('aria-haspopup="dialog"') !== -1, "help popup");
assert(html.indexOf("data-help-close") !== -1, "help close");
assert(html.indexOf("Educational calculator") !== -1, "educational disclaimer");
assert(html.indexOf("Not a waveform model") !== -1, "waveform disclaimer");
assert(html.indexOf("Sonification") !== -1, "audio is labeled a sonification");
assert(html.indexOf("299,792,458") !== -1, "c on the page");
assert(html.indexOf("1.3271244") !== -1, "GM on the page");
assert(html.indexOf("648000") !== -1 || html.indexOf("648,000") !== -1, "parsec factor on the page");
assert(html.indexOf(G.explain(gw)) !== -1, "default explanation is on the page");
assert(html.indexOf(papers) !== -1, "paper comparison is on the page");
assert(html.indexOf(bands) !== -1, "bands paragraph is on the page");
assert(html.indexOf(why.chirp) !== -1 && html.indexOf(why.strain) !== -1 && html.indexOf(why.isco) !== -1, "explainer paragraphs");
assert(html.indexOf("data-event=\"gw150914\"") !== -1, "GW150914 button");
assert(html.indexOf("data-event=\"gw170817\"") !== -1, "GW170817 button");
assert(html.indexOf("36") !== -1 && html.indexOf("29") !== -1 && html.indexOf("410") !== -1, "discovery numbers");
assert(html.indexOf("1.188") !== -1 && html.indexOf("2.74") !== -1 && html.indexOf("24") !== -1, "neutron-star numbers");
assert(html.indexOf("https://doi.org/10.1103/PhysRevLett.116.061102") !== -1, "discovery paper");
assert(html.indexOf("https://doi.org/10.1103/PhysRevLett.116.241102") !== -1, "properties paper");
assert(html.indexOf("https://doi.org/10.1103/PhysRevLett.119.161101") !== -1, "neutron-star paper");
assert(html.indexOf("https://doi.org/10.1103/PhysRevD.93.112004") !== -1, "LIGO sensitivity paper");
assert(html.indexOf("https://arxiv.org/abs/2402.07571") !== -1, "LISA definition study");
assert(html.indexOf("lisamission.org") !== -1, "LISA consortium note");

var hub = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(hub.indexOf("/science/astronomy/gravitational-waves/") !== -1, "hub links the desk");
var science = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
assert(science.indexOf("/science/astronomy/gravitational-waves/") !== -1, "science index links the desk");
var sitemap = fs.readFileSync(path.join(__dirname, "../../../sitemap.xml"), "utf8");
assert(sitemap.indexOf("https://stevenphilley.com/science/astronomy/gravitational-waves/") !== -1, "sitemap");
var search = fs.readFileSync(path.join(__dirname, "../../../search/index.json"), "utf8");
assert(search.indexOf("/science/astronomy/gravitational-waves/") !== -1, "search index");
var siteHtml = fs.readFileSync(path.join(__dirname, "../../../sitemap.html"), "utf8");
assert(siteHtml.indexOf("science/astronomy/gravitational-waves/") !== -1, "html sitemap");
var holes = fs.readFileSync(path.join(__dirname, "../black-holes/index.html"), "utf8");
assert(holes.indexOf("/science/astronomy/gravitational-waves/") !== -1, "black-hole cross-link");

console.log("gravitational-waves.test.js: ok");
console.log("GW150914", G.formatMass(mc), G.formatDuration(tau), "ISCO", G.formatHz(gw.fIsco));
console.log("GW170817", G.formatMass(bnsMc), G.formatDuration(bns.tau), "ISCO", G.formatHz(bns.fIsco));
