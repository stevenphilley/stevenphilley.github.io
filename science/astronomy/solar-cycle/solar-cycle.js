/*! Solar cycle: SILSO monthly and 13-month smoothed sunspot numbers.

    The numbers are a snapshot of two SILSO version 2.0 files, fetched
    2026-11-05. SN_m_tot_V2.0.csv is the monthly mean total sunspot number.
    SN_ms_tot_V2.0.csv is the 13-month smoothed series. This page does not
    recompute either column. SILSO’s smoothed-series note defines that
    smoother as a tapered boxcar: weight 0.5 on the months six before and
    six after, weight 1 on the eleven months in between, divided by 12.
    The first six and last six months have no smoothed value. In the CSV
    a missing value is −1. Here it is null.

    Cycle edges are the minimum months in TableCyclesMiMa.csv, fetched the
    same day. Numbering starts at Cycle 1, February 1755. A cycle runs from
    its minimum month up to, and not including, the next cycle’s minimum.
    The peak is the month of the highest smoothed number in that span. If
    two months tie, the earlier month is kept. The length of a closed cycle
    is the number of months from one minimum to the next. Cycle 25 has no
    following minimum in the table, so it has no length.

    The Sun drawing uses a classroom latitude, from 35° down to 8°. NASA’s
    Mysteries of the Sun places the usual belt between about 35° south and
    35° north. The 8° end is only so the drift can be seen. It is not a
    measured mean latitude.

    SILSO states CC BY-NC 4.0. The numbers are unchanged. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SolarCycle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DATA = null;
  var BY_INDEX = null;

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /* Classroom sketch only. 35° is the belt edge NASA states. 8° is not. */
  var SKETCH_LAT_START = 35;
  var SKETCH_LAT_END = 8;

  function load(data) {
    if (!data || !data.rows || !data.cycles) throw new Error("sunspot snapshot is missing rows or cycles");
    DATA = data;
    BY_INDEX = data.rows;
    var i;
    for (i = 0; i < BY_INDEX.length; i++) {
      var row = BY_INDEX[i];
      var expect = monthIndex(row[0], row[1]);
      if (expect !== i) throw new Error("sunspot row " + i + " is not a continuous month");
    }
    return DATA;
  }

  function loaded() {
    return DATA;
  }

  function monthIndex(year, month) {
    return (year - 1749) * 12 + (month - 1);
  }

  function rowAt(index) {
    if (!BY_INDEX || index < 0 || index >= BY_INDEX.length) return null;
    var row = BY_INDEX[index];
    return {
      index: index,
      year: row[0],
      month: row[1],
      monthly: row[2],
      smoothed: row[3],
      monthlyDefinitive: row[4] === 1,
      smoothedDefinitive: row[5] === 1
    };
  }

  function row(year, month) {
    return rowAt(monthIndex(year, month));
  }

  function format1(n) {
    if (n == null || !isFinite(n)) return "";
    return (Math.round(n * 10) / 10).toFixed(1);
  }

  function monthName(month) {
    return MONTHS[month - 1] || "";
  }

  function labelMonth(year, month) {
    return monthName(month) + " " + year;
  }

  function lengthLabel(months) {
    if (months == null || !isFinite(months)) return "";
    var y = Math.floor(months / 12);
    var m = months % 12;
    var ys = y === 1 ? "1 year" : y + " years";
    var ms = m === 1 ? "1 month" : m + " months";
    if (y === 0) return ms;
    if (m === 0) return ys;
    return ys + " " + ms;
  }

  function flagWord(definitive) {
    return definitive ? "definitive" : "provisional";
  }

  function cycleEdge(n) {
    var i;
    var cycles = DATA.cycles;
    for (i = 0; i < cycles.length; i++) if (cycles[i].n === n) return cycles[i];
    return null;
  }

  function cycleOf(year, month) {
    if (!DATA) return null;
    var index = monthIndex(year, month);
    if (index < 0 || index >= BY_INDEX.length) return null;
    var cycles = DATA.cycles;
    var i;
    var found = null;
    for (i = 0; i < cycles.length; i++) {
      var start = monthIndex(cycles[i].minYear, cycles[i].minMonth);
      if (index >= start) found = cycles[i].n;
    }
    return found;
  }

  function tableNote(edge, kind, seriesValue) {
    var tableValue = kind === "minimum" ? edge.tableMin : edge.tableMax;
    if (tableValue == null || seriesValue == null) return "";
    if (Math.abs(tableValue - seriesValue) < 0.05) return "";
    var which = kind === "minimum" ? "minimum" : "maximum";
    return " SILSO’s table prints " + format1(tableValue) + " for this " + which + ". This series reads " + format1(seriesValue) + ".";
  }

  function summary(n) {
    if (!DATA) return null;
    var edge = cycleEdge(n);
    if (!edge) return null;
    var cycles = DATA.cycles;
    var next = null;
    var i;
    for (i = 0; i < cycles.length; i++) if (cycles[i].n === n + 1) next = cycles[i];
    var i0 = monthIndex(edge.minYear, edge.minMonth);
    var i1 = next ? monthIndex(next.minYear, next.minMonth) : BY_INDEX.length;
    var start = rowAt(i0);
    var peak = null;
    var maxMonthly = null;
    var lastSmoothed = null;
    for (i = i0; i < i1; i++) {
      var rec = rowAt(i);
      if (!rec) continue;
      if (rec.smoothed != null && (!peak || rec.smoothed > peak.smoothed)) peak = rec;
      if (rec.smoothed != null) lastSmoothed = rec;
      if (!maxMonthly || rec.monthly > maxMonthly.monthly) maxMonthly = rec;
    }
    var open = !next;
    var lengthMonths = open ? null : (i1 - i0);
    var elapsedMonths = null;
    if (open) elapsedMonths = (BY_INDEX.length - 1) - i0;

    var why = "Cycle " + n + ". SILSO’s TableCyclesMiMa.csv, fetched " + DATA.fetched + ", sets the minimum at " + labelMonth(start.year, start.month) + ". The bundled 13-month smoothed series reads " + format1(start.smoothed) + " there, and that month is " + flagWord(start.smoothedDefinitive) + "." + tableNote(edge, "minimum", start.smoothed);
    if (n === 25) {
      why += " NOAA SWPC says Solar Cycle 24 ended in December 2019, which also marked the beginning of Solar Cycle 25.";
    }
    why += " The highest smoothed number in this cycle, in this snapshot, is " + format1(peak.smoothed) + " in " + labelMonth(peak.year, peak.month) + ", and that month is " + flagWord(peak.smoothedDefinitive) + ".";
    if (!open && edge.maxYear) {
      var officialPeak = row(edge.maxYear, edge.maxMonth);
      if (officialPeak && (officialPeak.year !== peak.year || officialPeak.month !== peak.month)) {
        why += " The table’s maximum month is " + labelMonth(edge.maxYear, edge.maxMonth) + ". The series peak is not that month.";
      } else if (edge.tableMax != null && Math.abs(edge.tableMax - peak.smoothed) >= 0.05) {
        why += " SILSO’s table prints " + format1(edge.tableMax) + " for the maximum. This series reads " + format1(peak.smoothed) + ".";
      }
    }
    if (open) {
      var laterBelow = true;
      var j;
      for (j = peak.index + 1; j < i1; j++) {
        var later = rowAt(j);
        if (later && later.smoothed != null && later.smoothed >= peak.smoothed) laterBelow = false;
      }
      if (laterBelow) {
        why += " Every later month that has a smoothed value is lower, through " + labelMonth(lastSmoothed.year, lastSmoothed.month) + " at " + format1(lastSmoothed.smoothed) + ", which is " + flagWord(lastSmoothed.smoothedDefinitive) + ".";
      } else {
        why += " The smoothed series continues through " + labelMonth(lastSmoothed.year, lastSmoothed.month) + " at " + format1(lastSmoothed.smoothed) + ", which is " + flagWord(lastSmoothed.smoothedDefinitive) + ".";
      }
      why += " The downloadable cycle table leaves the maximum blank. The cycles min/max web page, fetched the same day, prints " + labelMonth(DATA.cycle25PageMaximum.year, DATA.cycle25PageMaximum.month) + " and " + format1(DATA.cycle25PageMaximum.sn) + " in the maximum columns. This page reports the high-water mark of the snapshot. It is not a forecast. The next minimum is not in the table, so the length is not known. Monthly data in this snapshot runs " + lengthLabel(elapsedMonths) + " past the minimum, through " + labelMonth(BY_INDEX[BY_INDEX.length - 1][0], BY_INDEX[BY_INDEX.length - 1][1]) + ". That span is not the cycle length.";
    } else {
      why += " The length, from this minimum to the next cycle’s minimum, is " + lengthLabel(lengthMonths) + ".";
    }
    why += " The highest monthly mean in the cycle, in this file, is " + format1(maxMonthly.monthly) + " in " + labelMonth(maxMonthly.year, maxMonthly.month) + ". The cycle maximum SILSO times is the smoothed number, not that monthly mean.";

    var stats = [
      ["Minimum", labelMonth(start.year, start.month)],
      ["Smoothed at minimum", format1(start.smoothed) + " · " + flagWord(start.smoothedDefinitive)],
      ["Smoothed peak", labelMonth(peak.year, peak.month) + " · " + format1(peak.smoothed)],
      ["Peak status", open ? "Highest smoothed value in the snapshot · " + flagWord(peak.smoothedDefinitive) : flagWord(peak.smoothedDefinitive)],
      ["Length", open ? "Not known — no following minimum in the table" : lengthLabel(lengthMonths)],
      ["Highest monthly mean", format1(maxMonthly.monthly) + " · " + labelMonth(maxMonthly.year, maxMonthly.month)]
    ];
    if (open) {
      var last = rowAt(BY_INDEX.length - 1);
      stats.push(["Latest monthly", format1(last.monthly) + " · " + labelMonth(last.year, last.month) + " · " + flagWord(last.monthlyDefinitive)]);
      stats.push(["Latest smoothed", format1(lastSmoothed.smoothed) + " · " + labelMonth(lastSmoothed.year, lastSmoothed.month) + " · " + flagWord(lastSmoothed.smoothedDefinitive)]);
    }

    return {
      n: n,
      open: open,
      start: start,
      peak: peak,
      lastSmoothed: lastSmoothed,
      maxMonthly: maxMonthly,
      lengthMonths: lengthMonths,
      elapsedMonths: elapsedMonths,
      lengthText: open ? "" : lengthLabel(lengthMonths),
      why: why,
      stats: stats,
      tier: open ? "Open in this snapshot · Cycle " + n : "Closed cycle · Cycle " + n
    };
  }

  function summaries() {
    var out = [];
    var i;
    for (i = 0; i < DATA.cycles.length; i++) out.push(summary(DATA.cycles[i].n));
    return out;
  }

  function readout(year, month) {
    var rec = row(year, month);
    if (!rec) return "";
    var cycle = cycleOf(year, month);
    var who = cycle == null ? "Before Cycle 1. Numbering starts at the February 1755 minimum." : "Cycle " + cycle + ".";
    var monthly = "Monthly mean " + format1(rec.monthly) + ", " + flagWord(rec.monthlyDefinitive) + ".";
    var smoothed = rec.smoothed == null
      ? "No smoothed number. SILSO leaves the first six and last six months blank."
      : "Smoothed " + format1(rec.smoothed) + ", " + flagWord(rec.smoothedDefinitive) + ".";
    return labelMonth(year, month) + ". " + who + " " + monthly + " " + smoothed;
  }

  function sketchLatitude(fraction) {
    if (fraction == null || !isFinite(fraction)) return null;
    var f = Math.min(1, Math.max(0, fraction));
    return SKETCH_LAT_START + (SKETCH_LAT_END - SKETCH_LAT_START) * f;
  }

  function sketchText(fraction) {
    var lat = sketchLatitude(fraction);
    var place = fraction <= 0.05 ? "early in a cycle" : (fraction >= 0.95 ? "late in a cycle" : "partway through a cycle");
    return "Schematic, " + place + ". The sketch latitude is ±" + format1(lat) + "°. NASA’s Mysteries of the Sun places the usual belt between about 35° south and 35° north, higher at the start and closer to the equator later. The 8° end of this slider is a classroom endpoint. These dots are not catalog positions.";
  }

  function limitsNote() {
    return "Educational page. The monthly means and the 13-month smoothed numbers are copied from SILSO version 2.0 files SN_m_tot_V2.0.csv and SN_ms_tot_V2.0.csv, fetched 2026-11-05. They are not recomputed and not extended. A value of −1 in those files is omitted. Flag 1 is definitive. Flag 0 is provisional, and SILSO may still revise it. Cycle edges are the minimum months in TableCyclesMiMa.csv, fetched the same day. The smoothed number at a minimum or a peak is read from the series. Three table cells differ from this series by 0.1: Cycle 3’s maximum (table 264.2, series 264.3), Cycle 7’s minimum (table 0.1, series 0.2), and Cycle 16’s minimum (table 9.3, series 9.4). The month still matches. Cycle 25’s maximum cell is blank in the CSV. The length of a closed cycle is the time from its minimum month to the next cycle’s minimum month. The Sun drawing is a schematic of the equatorward drift. The dots are not catalog positions. Not a space-weather forecast.";
  }

  return {
    MONTHS: MONTHS,
    SKETCH_LAT_START: SKETCH_LAT_START,
    SKETCH_LAT_END: SKETCH_LAT_END,
    load: load,
    loaded: loaded,
    monthIndex: monthIndex,
    row: row,
    rowAt: rowAt,
    format1: format1,
    monthName: monthName,
    labelMonth: labelMonth,
    lengthLabel: lengthLabel,
    cycleOf: cycleOf,
    summary: summary,
    summaries: summaries,
    readout: readout,
    sketchLatitude: sketchLatitude,
    sketchText: sketchText,
    limitsNote: limitsNote
  };
});
