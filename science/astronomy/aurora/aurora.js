/*! Aurora: a classroom schematic of Earth's magnetosphere and the oval.

    The numbers are quoted, not fitted to a storm.

    NASA Science says the sun-facing magnetosphere extends about six to
    10 Earth radii, and the nightside tail can measure hundreds of Earth
    radii, past the Moon's orbit at 60 Earth radii. The dayside slider
    only walks that six-to-ten span. It starts at 10. That order is a
    classroom choice.

    NOAA SWPC's glossary says the magnetosheath along the Sun-Earth axis
    is about 2 Earth radii thick. The bow shock in the drawing is that
    thickness stacked on the slider. It is not a measured shock.

    The same glossary, under average conditions, puts the auroral oval at
    about 75 degrees magnetic latitude at local noon and about 67 degrees
    at midnight. The circle is fitted to those two latitudes. Colatitude
    is 90 minus magnetic latitude. The radius is the mean of the two
    colatitudes. The center sits toward midnight by half their difference.
    At the cited latitudes that is a radius of 19 degrees and an offset
    of 4 degrees.

    The storm end of the slider slides that circle 12 degrees of magnetic
    latitude equatorward. Twelve is a classroom offset so the motion can
    be seen. It is not a storm latitude and it is not a Kp index.

    NOAA NCEI gives 9.41 degrees for the WMM2020 dipole inclination. The
    drawing uses that angle. The same page's opening answer says
    approximately 11 degrees. SWPC's glossary says about 11.5 degrees.
    This file does not average them.

    Not a forecast. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Aurora = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var NOON_MLAT = 75;
  var MIDNIGHT_MLAT = 67;
  var DAYSIDE_OUTER_RE = 10;
  var DAYSIDE_INNER_RE = 6;
  var SHEATH_RE = 2;
  var SKETCH_EXPAND_DEG = 12;
  var DIPOLE_DEG = 9.41;
  var MOON_RE = 60;
  var FORMATION_KM = [80, 500];
  var TYPICAL_KM = [100, 250];
  var GLOSSARY_RANGE_KM = [80, 1000];
  var ISS_KM = 400;
  var COLUMN_TOP_KM = 500;

  var LAYERS = {
    green: {
      id: "green",
      tier: "NASA Science · color table",
      title: "Green oxygen",
      range: "About 100–200 km · 60–120 miles",
      km: [100, 200],
      why: "NASA Science says the most common auroral color is green, produced when oxygen is excited by electrons around 60 miles (100 km) above the surface. The same page’s table puts green oxygen roughly between 60 and 120 miles (100–200 km). NOAA’s glossary says the typical aurora is yellow-green, from a specific transition of atomic oxygen, and that typical aurorae are 100 to 250 km up. This page does not list a wavelength."
    },
    red: {
      id: "red",
      tier: "NASA Science · color table",
      title: "Red oxygen",
      range: "At or above about 200 km",
      km: [200, 500],
      why: "NASA Science’s table puts red oxygen at or above 120 miles (200 km). NOAA’s glossary says that above 250 km, auroral light is characterized by a red spectral line of atomic oxygen. The column stops at 500 km, the upper end of the range on NOAA’s aurora page, where the glow typically forms 80 to 500 km up. The glossary’s full altitude range is 80 to 1000 km. This page does not list a wavelength."
    },
    blue: {
      id: "blue",
      tier: "NASA Science · color table",
      title: "Blue nitrogen",
      range: "About 100–200 km · 60–120 miles",
      km: [100, 200],
      why: "NASA Science’s table puts blue nitrogen between 60 and 120 miles (100–200 km). The same page says excited nitrogen from about 60 to 120 miles glows blue, and that nitrogen can give off both pink and blue light depending on the particle. NOAA’s glossary says auroral light from lower levels is dominated by blue and red bands from molecular nitrogen and oxygen. This page does not list a wavelength."
    },
    pink: {
      id: "pink",
      tier: "NASA Science · color table",
      title: "Pink nitrogen",
      range: "At or below about 100 km",
      km: [80, 100],
      why: "NASA Science says that if nitrogen is below about 60 miles (100 km), it gives the lower edge of the aurora a reddish-purple to pink glow. The table marks pink nitrogen at or below 60 miles (100 km). NOAA’s aurora page says the glow typically forms 80 to 500 km up, so the pink edge in this column is drawn from 80 km to 100 km, inside both sentences. Nitrogen below 80 km is outside the range NOAA calls typical. This page does not list a wavelength."
    },
    typical: {
      id: "typical",
      tier: "NOAA glossary · typical height",
      title: "Typical height",
      range: "100–250 km · yellow-green",
      km: [100, 250],
      why: "NOAA’s glossary says the auroral altitude range is 80 to 1000 km, but typical aurorae are 100 to 250 km above the ground, and the color of the typical aurora is yellow-green. NOAA’s aurora page says the aurora typically forms 80 to 500 km above Earth’s surface. The column uses 500 km as its top. The 1000 km end of the glossary range is above the column and is not drawn."
    }
  };

  function clamp01(x) {
    if (x == null || !isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }

  function formatNum(n) {
    if (n == null || !isFinite(n)) return "";
    var r = Math.round(n * 100) / 100;
    if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
    var s = r.toFixed(2);
    if (s.charAt(s.length - 1) === "0") s = r.toFixed(1);
    return s;
  }

  function daysideRe(activity) {
    var a = clamp01(activity);
    return DAYSIDE_OUTER_RE + (DAYSIDE_INNER_RE - DAYSIDE_OUTER_RE) * a;
  }

  function bowShockRe(activity) {
    return daysideRe(activity) + SHEATH_RE;
  }

  function ovalLocus(activity) {
    var a = clamp01(activity);
    var expand = SKETCH_EXPAND_DEG * a;
    return {
      noon: NOON_MLAT - expand,
      midnight: MIDNIGHT_MLAT - expand,
      expand: expand,
      sketch: expand > 1e-9
    };
  }

  function ovalFit(noon, midnight) {
    var noonColat = 90 - noon;
    var midnightColat = 90 - midnight;
    return {
      noonColat: noonColat,
      midnightColat: midnightColat,
      radiusDeg: (midnightColat + noonColat) / 2,
      offsetDeg: (midnightColat - noonColat) / 2
    };
  }

  function footpoint(mlat, meridian) {
    if (mlat == null || !isFinite(mlat)) return null;
    if (meridian !== "noon" && meridian !== "midnight") return null;
    var tilt = DIPOLE_DEG * Math.PI / 180;
    var colat = (90 - mlat) * Math.PI / 180;
    var tail = meridian === "midnight" ? 1 : -1;
    var x_m = tail * Math.sin(colat);
    var z_m = Math.cos(colat);
    return {
      x: x_m * Math.cos(tilt) + z_m * Math.sin(tilt),
      z: -x_m * Math.sin(tilt) + z_m * Math.cos(tilt)
    };
  }

  function readoutMagnet(activity) {
    var a = clamp01(activity);
    var where = a <= 0.02 ? "the outer end of the span" : (a >= 0.98 ? "the inner end of the span" : "between the two cited ends");
    return "Dayside boundary drawn at " + formatNum(daysideRe(a)) + " Earth radii, " + where + ". NASA Science says the sun-facing side extends about six to 10 Earth radii. The slider only walks that span, and it starts at the outer end. That order is a classroom choice. The bow shock is drawn at " + formatNum(bowShockRe(a)) + " Earth radii: NOAA’s glossary says the magnetosheath along the Sun–Earth axis is about 2 Earth radii thick, and this sketch stacks that thickness on the slider. Not a pressure model and not a forecast.";
  }

  function readoutOval(activity) {
    var loc = ovalLocus(activity);
    var fit = ovalFit(loc.noon, loc.midnight);
    var base = "NOAA’s glossary, under average conditions, puts the maximum of the oval at about 75° magnetic latitude at local noon and about 67° at midnight. ";
    if (!loc.sketch) {
      return base + "This circle is fitted to those two latitudes: 15° of colatitude at noon and 23° at midnight, so the radius is 19° and the center sits 4° of colatitude toward midnight from the magnetic pole. It is not a traced oval. The magnetic pole is drawn 9.41° from the geographic pole, NOAA NCEI’s WMM2020 inclination. The direction of that offset on the disk is a sketch. Not a Kp map.";
    }
    return base + "The storm sketch has slid that circle " + formatNum(loc.expand) + "° of magnetic latitude equatorward. The drawing puts noon at " + formatNum(loc.noon) + "° and midnight at " + formatNum(loc.midnight) + "°. The radius is " + formatNum(fit.radiusDeg) + "° of colatitude and the midnight offset is " + formatNum(fit.offsetDeg) + "°. Twelve degrees is the classroom end of the slider so the motion can be seen. NOAA says the oval widens toward both higher and lower latitudes in the expansion phase of a substorm, and that during major geomagnetic storms the ovals expand so aurora can be seen over most of the United States. These intermediate degrees are the slider. They are not a measured storm and not a Kp contour.";
  }

  function sliderText(activity) {
    var a = clamp01(activity);
    if (a <= 0.02) return "Average oval. Dayside at 10 Earth radii. Noon 75°, midnight 67°.";
    if (a >= 0.98) return "Storm sketch. Dayside at 6 Earth radii. Classroom oval, 12° equatorward. Not a Kp map.";
    var loc = ovalLocus(a);
    return "Classroom slider. Dayside at " + formatNum(daysideRe(a)) + " Earth radii. Oval " + formatNum(loc.expand) + "° equatorward of the average. Not a forecast.";
  }

  function presetId(activity) {
    var a = clamp01(activity);
    if (a <= 0.02) return "average";
    if (a >= 0.98) return "storm";
    return "";
  }

  function detail(activity) {
    var a = clamp01(activity);
    var loc = ovalLocus(a);
    var fit = ovalFit(loc.noon, loc.midnight);
    var nose = daysideRe(a);
    var shock = bowShockRe(a);
    var stats = [
      ["Dayside boundary", formatNum(nose) + " Earth radii"],
      ["Bow shock sketch", formatNum(shock) + " Earth radii"],
      ["Oval at noon", formatNum(loc.noon) + "° magnetic latitude"],
      ["Oval at midnight", formatNum(loc.midnight) + "° magnetic latitude"],
      ["Circle fit", "radius " + formatNum(fit.radiusDeg) + "° · offset " + formatNum(fit.offsetDeg) + "°"],
      ["Dipole drawn", "9.41° · WMM2020, NOAA NCEI"]
    ];
    if (a <= 0.02) {
      return {
        tier: "Average conditions · cited oval",
        title: "A shield, then a glow",
        range: "Noon about 75° · midnight about 67°",
        why: "The magnetosphere drawing is a noon–midnight cut. Solar-wind arrows come from the Sun and stop at a bow shock. NASA Science says the dayside extends about six to 10 Earth radii. This frame uses 10, the outer end of that span. NOAA’s glossary puts about 2 Earth radii of magnetosheath between the bow shock and the magnetopause along the Sun–Earth axis, so the shock is drawn at 12 Earth radii. The nightside tail is the long part of the comma. NASA Science says it can measure hundreds of Earth radii, past the Moon at 60. NOAA’s glossary says there is evidence of the tail as far as 1000 Earth radii. The tail in the frame is cut off. It is not to that scale. The oval on the disk uses the glossary’s average latitudes, 75° at noon and 67° at midnight, as a circle fitted to those two numbers. NOAA’s aurora page says the best place to observe the aurora is under an oval-shaped region between the north and south latitudes of about 60 and 75 degrees, and that at those polar latitudes the aurora can be observed more than half of the nights of a given year. That sentence is not the same pair of numbers as 67 and 75. The glow is electrons, guided by the field, hitting oxygen and nitrogen. NASA’s solar-storms page says the magnetic field and the atmosphere protect people on the ground, and that these storms are more common near solar maximum. The count of that cycle is the solar-cycle desk. Nothing here is a forecast.",
        stats: stats
      };
    }
    if (a >= 0.98) {
      stats.splice(4, 0, ["Classroom slide", "12° equatorward of 75° and 67°"]);
      return {
        tier: "Storm sketch · classroom offset",
        title: "Farther from the pole",
        range: "Drawn at 63° and 55° · not a storm latitude",
        why: "The slider is at the classroom end. The dayside boundary is drawn at 6 Earth radii, the inner end of NASA’s about six to 10. The bow shock is drawn 2 Earth radii outside that, at 8. The oval has been slid 12° of magnetic latitude equatorward of the glossary’s average, so the fitted circle reads 63° at noon and 55° at midnight. Twelve degrees is not a storm latitude. NOAA says major geomagnetic storms expand the ovals so that aurora can be seen over most of the United States, and that a substorm widens the aurora toward both higher and lower latitudes. This frame shows a slide, not that widening, and not a map of the United States. It is not a Kp contour.",
        stats: stats
      };
    }
    stats.splice(4, 0, ["Classroom slide", formatNum(loc.expand) + "° equatorward of 75° and 67°"]);
    return {
      tier: "Between the presets · classroom slider",
      title: "Partway along the sketch",
      range: "Noon " + formatNum(loc.noon) + "° · midnight " + formatNum(loc.midnight) + "°",
      why: "The slider is partway between the two presets. The dayside boundary is drawn at " + formatNum(nose) + " Earth radii, still inside NASA’s about six to 10. The bow shock is drawn at " + formatNum(shock) + " Earth radii, the glossary’s 2 Earth radii of magnetosheath stacked on that boundary. The oval is " + formatNum(loc.expand) + "° equatorward of the glossary’s 75° and 67°. That offset is the slider. It is not an observed latitude, and it is not a Kp contour.",
      stats: stats
    };
  }

  function layer(id) {
    return LAYERS[id] || null;
  }

  function limitsNote() {
    return "Educational schematic. Not a space-weather forecast, not a Kp product, and not a live oval. NASA Science says the dayside magnetosphere extends about six to 10 Earth radii and the nightside tail can measure hundreds of Earth radii, past the Moon at 60 Earth radii. The dayside slider only walks the six-to-ten span. The outer end is drawn first. That pairing is a classroom choice. NOAA’s space-weather glossary says the magnetosheath along the Sun–Earth axis is about 2 Earth radii thick. The bow shock in the drawing is that thickness stacked on the slider, not a measured shock. The average oval is the glossary’s about 75° magnetic latitude at local noon and about 67° at midnight. The circle is fitted to those two latitudes. The storm sketch slides that circle 12° of magnetic latitude equatorward. Twelve degrees is a classroom offset so the motion is visible. It is not a storm latitude, and the page does not convert it to a Kp index. NOAA’s aurora page says the glow typically forms 80 to 500 km up. The glossary’s wider range is 80 to 1000 km, with typical aurorae at 100 to 250 km. Color altitudes are NASA Science’s table. This page does not list wavelengths. Altitude brackets overlap because the sources overlap. The station mark is NASA’s roughly 250 miles (400 km) for the International Space Station.";
  }

  return {
    NOON_MLAT: NOON_MLAT,
    MIDNIGHT_MLAT: MIDNIGHT_MLAT,
    DAYSIDE_OUTER_RE: DAYSIDE_OUTER_RE,
    DAYSIDE_INNER_RE: DAYSIDE_INNER_RE,
    SHEATH_RE: SHEATH_RE,
    SKETCH_EXPAND_DEG: SKETCH_EXPAND_DEG,
    DIPOLE_DEG: DIPOLE_DEG,
    MOON_RE: MOON_RE,
    FORMATION_KM: FORMATION_KM,
    TYPICAL_KM: TYPICAL_KM,
    GLOSSARY_RANGE_KM: GLOSSARY_RANGE_KM,
    ISS_KM: ISS_KM,
    COLUMN_TOP_KM: COLUMN_TOP_KM,
    clamp01: clamp01,
    formatNum: formatNum,
    daysideRe: daysideRe,
    bowShockRe: bowShockRe,
    ovalLocus: ovalLocus,
    ovalFit: ovalFit,
    footpoint: footpoint,
    readoutMagnet: readoutMagnet,
    readoutOval: readoutOval,
    sliderText: sliderText,
    presetId: presetId,
    detail: detail,
    layer: layer,
    limitsNote: limitsNote
  };
});
