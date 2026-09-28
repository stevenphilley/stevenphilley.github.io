/*!
 * North Indian Ashtakoota (guna milan), 36 points.
 *
 * Tables follow the mainstream panchang convention (the one used by the
 * large North Indian match-making calculators), with the classical
 * half-sign Vashya split kept. Where schools disagree, the choice is
 * named in NOTES and the other reading is not silently applied.
 *
 * Points: Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 6,
 * Bhakoot 7, Nadi 8.
 *
 * Sources for the framework (not for every contested cell):
 *   Rama Daivajna, Muhurta Chintamani — the muhurta text that arranges
 *     these eight kootas and treats a total under 18 as insufficient.
 *   Brihat Parashara Hora Shastra — naisargika (natural) planetary friendship
 *     used for Graha Maitri.
 *   The 14×14 Yoni grade table as transcribed by the open VedAstro library
 *     (Genso.Astrology MatchCalculator), groom's animal by bride's animal.
 *     Enemy pairs are the seven classical ones (horse/buffalo, elephant/lion,
 *     sheep/monkey, serpent/mongoose, dog/deer, cat/rat, cow/tiger).
 *   B. V. Raman, Muhurtha (Electional Astrology) — the score bands in wide
 *     modern use, and the alternate Varna list noted below.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KundaliKoota = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var NAK = 360 / 27;
  var PADA = 360 / 108;

  var NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];

  var LORD_CYCLE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn"];

  /* Deva / Manushya / Rakshasa, nine nakshatras each. */
  var GANA_BY_NAK = [
    "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya",
    "Deva", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya",
    "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
    "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa",
    "Manushya", "Manushya", "Deva"
  ];

  /* Adi, Madhya, Antya, Antya, Madhya, Adi, Adi, Madhya, Antya — repeated three times. */
  var NADI_PATTERN = ["Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya"];

  /*
   * Yoni animal index:
   * 0 Horse, 1 Elephant, 2 Sheep, 3 Serpent, 4 Dog, 5 Cat, 6 Rat,
   * 7 Cow, 8 Buffalo, 9 Tiger, 10 Deer, 11 Monkey, 12 Mongoose, 13 Lion.
   * Gender is descriptive (shown to the reader). It does not change the points.
   */
  var YONI_ANIMALS = [
    "Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat",
    "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"
  ];
  var YONI_BY_NAK = [
    [0, "male"], [1, "male"], [2, "female"], [3, "male"], [3, "female"], [4, "female"],
    [5, "male"], [2, "male"], [5, "female"], [6, "male"], [6, "female"], [7, "male"],
    [8, "female"], [9, "female"], [8, "male"], [9, "male"], [10, "female"], [10, "male"],
    [4, "male"], [11, "male"], [12, "male"], [11, "female"], [13, "female"], [0, "female"],
    [13, "male"], [7, "female"], [1, "female"]
  ];

  /* Groom's animal is the row, bride's animal is the column. */
  var YONI_MATRIX = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
    [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
    [1, 0, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2, 4]
  ];

  var RASHI_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  var RASHI_SANSKRIT = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"
  ];
  var RASHI_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"
  ];
  /* Triplicity varna used by mainstream North Indian software. */
  var RASHI_VARNA = [
    "Kshatriya", "Vaishya", "Shudra", "Brahmin", "Kshatriya", "Vaishya",
    "Shudra", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Brahmin"
  ];
  var VARNA_RANK = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };

  var VASHYA_INDEX = { Chatushpada: 0, Manava: 1, Jalachara: 2, Vanachara: 3, Keeta: 4 };
  /*
   * Groom is the row, bride is the column. Manava↔Jalachara is 0.5.
   * Vanachara as groom scores only with itself. A Jalachara groom with a
   * Vanachara bride scores 1. That one cell is the usual directional
   * exception in North Indian software; the rest of the table is symmetric.
   */
  var VASHYA_MATRIX = [
    [2, 1, 1, 0, 1],
    [1, 2, 0.5, 0, 1],
    [1, 0.5, 2, 1, 1],
    [0, 0, 0, 2, 0],
    [1, 1, 1, 0, 2]
  ];

  var FRIENDS = {
    Sun: ["Moon", "Mars", "Jupiter"],
    Moon: ["Sun", "Mercury"],
    Mars: ["Sun", "Moon", "Jupiter"],
    Mercury: ["Sun", "Venus"],
    Jupiter: ["Sun", "Moon", "Mars"],
    Venus: ["Mercury", "Saturn"],
    Saturn: ["Mercury", "Venus"]
  };
  var ENEMIES = {
    Sun: ["Venus", "Saturn"],
    Moon: [],
    Mars: ["Mercury"],
    Mercury: ["Moon"],
    Jupiter: ["Mercury", "Venus"],
    Venus: ["Sun", "Moon"],
    Saturn: ["Sun", "Moon", "Mars"]
  };

  /* Groom gana, then bride gana. */
  var GANA_POINTS = {
    "Deva|Deva": 6,
    "Deva|Manushya": 6,
    "Deva|Rakshasa": 1,
    "Manushya|Deva": 5,
    "Manushya|Manushya": 6,
    "Manushya|Rakshasa": 0,
    "Rakshasa|Deva": 0,
    "Rakshasa|Manushya": 0,
    "Rakshasa|Rakshasa": 6
  };

  var TARA_NAMES = [
    "", "Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhana", "Vadha", "Mitra", "Ati Mitra"
  ];
  /*
   * Mainstream North Indian 27×27 Tara table. Remainders 3 (Vipat),
   * 5 (Pratyak), and 7 (Vadha) are inauspicious. Janma (1, and the
   * repeats at 10 and 19) is auspicious, so the same-nakshatra diagonal
   * is 3. A remainder of 0 is Ati Mitra (9).
   */
  var TARA_AUSPICIOUS = { 1: 1, 2: 1, 4: 1, 6: 1, 8: 1, 9: 1 };

  var KOOTA_META = [
    { id: "varna", name: "Varna", max: 1, about: "A traditional ranking of the Moon signs, read as spiritual temperament. The point is given when the groom’s varna is the same as the bride’s, or stands above it in the order Brahmin, Kshatriya, Vaishya, Shudra." },
    { id: "vashya", name: "Vashya", max: 2, about: "Mutual attraction, from the creature-class of each Moon sign: quadruped, human, water, wild, or insect. Sagittarius and Capricorn are split at 15°." },
    { id: "tara", name: "Tara", max: 3, about: "The nakshatra count from bride to groom and from groom to bride. Auspicious remainders are 1 (Janma), 2, 4, 6, 8, and 0 or 9. Inauspicious remainders are 3 (Vipat), 5 (Pratyak), and 7 (Vadha). Both directions auspicious scores 3; one scores 1.5. The same nakshatra is Janma both ways, so it scores 3. Traditionally read for wellbeing." },
    { id: "yoni", name: "Yoni", max: 4, about: "Instinct and physical compatibility, from the animal assigned to each nakshatra. Same animal scores 4. The seven classical enemy pairs score 0." },
    { id: "graha", name: "Graha Maitri", max: 5, about: "Natural friendship between the planets that rule the two Moon signs. Traditionally read as mental rapport. Same lord or mutual friends score 5." },
    { id: "gana", name: "Gana", max: 6, about: "Temperament of the nakshatra: deva, manushya, or rakshasa. Like with like scores 6." },
    { id: "bhakoot", name: "Bhakoot", max: 7, about: "The distance between the Moon signs. The pairs 2/12, 5/9, and 6/8 score 0 (bhakoot dosha). Every other distance, including the same sign, scores 7. Traditionally read for prosperity and the household." },
    { id: "nadi", name: "Nadi", max: 8, about: "Constitution, adi / madhya / antya, from the nakshatra. Different nadis score 8. The same nadi scores 0 (nadi dosha), the heaviest single factor in the 36." }
  ];

  function norm(lon) {
    var x = lon % 360;
    if (x < 0) x += 360;
    if (x >= 360 - 1e-9) x = 0;
    return x;
  }

  function placement(lon) {
    lon = norm(lon);
    var nak = Math.floor(lon * 27 / 360 + 1e-10);
    if (nak > 26) nak = 26;
    var pada = (Math.floor(lon * 108 / 360 + 1e-10) % 4) + 1;
    var rashi = Math.floor(lon / 30 + 1e-10);
    if (rashi > 11) rashi = 11;
    return { lon: lon, nak: nak, pada: pada, rashi: rashi };
  }

  function vashyaOf(rashi, lon) {
    var deg = norm(lon) % 30;
    switch (rashi) {
      case 0: case 1: return "Chatushpada";
      case 2: case 5: case 6: case 10: return "Manava";
      case 3: case 11: return "Jalachara";
      case 4: return "Vanachara";
      case 7: return "Keeta";
      case 8: return deg < 15 ? "Manava" : "Chatushpada";
      case 9: return deg < 15 ? "Chatushpada" : "Jalachara";
      default: return "Manava";
    }
  }

  function relation(a, b) {
    if (FRIENDS[a].indexOf(b) !== -1) return "friend";
    if (ENEMIES[a].indexOf(b) !== -1) return "enemy";
    return "neutral";
  }

  function lordsFriendlyOrSame(rashiA, rashiB) {
    var a = RASHI_LORDS[rashiA];
    var b = RASHI_LORDS[rashiB];
    if (a === b) return { same: true, mutualFriends: false, lordA: a, lordB: b };
    var ab = relation(a, b);
    var ba = relation(b, a);
    return {
      same: false,
      mutualFriends: ab === "friend" && ba === "friend",
      lordA: a,
      lordB: b,
      aToB: ab,
      bToA: ba
    };
  }

  function profileFromParts(nak, pada, rashi, lon, source) {
    var yoni = YONI_BY_NAK[nak];
    return {
      source: source,
      lon: lon,
      nak: nak,
      pada: pada,
      rashi: rashi,
      nakshatra: NAKSHATRA_NAMES[nak],
      nakshatraLord: LORD_CYCLE[nak % 8],
      gana: GANA_BY_NAK[nak],
      nadi: NADI_PATTERN[nak % 9],
      yoni: YONI_ANIMALS[yoni[0]],
      yoniIndex: yoni[0],
      yoniGender: yoni[1],
      rashiName: RASHI_NAMES[rashi],
      rashiSanskrit: RASHI_SANSKRIT[rashi],
      rashiLord: RASHI_LORDS[rashi],
      varna: RASHI_VARNA[rashi],
      vashya: vashyaOf(rashi, lon)
    };
  }

  function chartFromLongitude(lon) {
    var p = placement(lon);
    return profileFromParts(p.nak, p.pada, p.rashi, p.lon, "longitude");
  }

  function chartFromNakPada(nak, pada) {
    if (nak < 0 || nak > 26 || pada < 1 || pada > 4) {
      throw new Error("nakshatra must be 0–26 and pada 1–4");
    }
    var start = nak * NAK + (pada - 1) * PADA;
    var rashi = Math.floor((start + 1e-9) / 30);
    if (rashi > 11) rashi = 11;
    var mid = start + PADA / 2;
    var chart = profileFromParts(nak, pada, rashi, mid, "nakshatra");
    chart.vashyaSplit = vashyaSplitInPada(nak, pada);
    return chart;
  }

  /* Purva Ashadha pada 1 and Shravana pada 2 cross the 15° half-sign line. */
  function vashyaSplitInPada(nak, pada) {
    var start = nak * NAK + (pada - 1) * PADA;
    var end = start + PADA;
    var cuts = [
      { lon: 255, sign: "Sagittarius" },
      { lon: 285, sign: "Capricorn" }
    ];
    var i;
    for (i = 0; i < cuts.length; i++) {
      var cut = cuts[i].lon;
      if (start < cut - 1e-8 && end > cut + 1e-8) {
        var belowLon = cut - 0.01;
        var aboveLon = cut + 0.01;
        return {
          below: vashyaOf(Math.floor(belowLon / 30), belowLon),
          above: vashyaOf(Math.floor(aboveLon / 30), aboveLon),
          note: cuts[i].sign + " changes vashya class at 15°, and this pada crosses that line. The score uses the second half."
        };
      }
    }
    return null;
  }

  function countMod(from, to, mod) {
    return ((to - from + mod) % mod) + 1;
  }

  function taraOne(count) {
    var n = count % 9;
    if (n === 0) n = 9;
    return { count: count, index: n, name: TARA_NAMES[n], auspicious: !!TARA_AUSPICIOUS[n] };
  }

  function scoreVarna(groom, bride) {
    var ok = VARNA_RANK[groom.varna] >= VARNA_RANK[bride.varna];
    return {
      points: ok ? 1 : 0,
      groom: groom.varna,
      bride: bride.varna,
      groomRank: VARNA_RANK[groom.varna],
      brideRank: VARNA_RANK[bride.varna],
      detail: ok
        ? "Groom’s varna is the same or higher, so the point is given."
        : "Bride’s varna outranks the groom’s, so the point is withheld."
    };
  }

  function scoreVashya(groom, bride) {
    var gi = VASHYA_INDEX[groom.vashya];
    var bi = VASHYA_INDEX[bride.vashya];
    var points = VASHYA_MATRIX[gi][bi];
    return {
      points: points,
      groom: groom.vashya,
      bride: bride.vashya,
      detail: "Lookup: groom " + groom.vashya + ", bride " + bride.vashya + " → " + points + "."
    };
  }

  function scoreTara(groom, bride) {
    var toGroom = taraOne(countMod(bride.nak, groom.nak, 27));
    var toBride = taraOne(countMod(groom.nak, bride.nak, 27));
    var points = toGroom.auspicious && toBride.auspicious ? 3 : (toGroom.auspicious || toBride.auspicious ? 1.5 : 0);
    return {
      points: points,
      fromBrideToGroom: toGroom,
      fromGroomToBride: toBride,
      detail: "From bride to groom: count " + toGroom.count + ", " + toGroom.name + " (" + (toGroom.auspicious ? "auspicious" : "inauspicious") + "). From groom to bride: count " + toBride.count + ", " + toBride.name + " (" + (toBride.auspicious ? "auspicious" : "inauspicious") + ")."
    };
  }

  function scoreYoni(groom, bride) {
    var points = YONI_MATRIX[groom.yoniIndex][bride.yoniIndex];
    return {
      points: points,
      groom: groom.yoni + " (" + groom.yoniGender + ")",
      bride: bride.yoni + " (" + bride.yoniGender + ")",
      detail: "Matrix cell: groom " + groom.yoni + " × bride " + bride.yoni + " → " + points + "."
    };
  }

  function scoreGraha(groom, bride) {
    var a = groom.rashiLord;
    var b = bride.rashiLord;
    var points;
    var pair;
    if (a === b) {
      points = 5;
      pair = "same lord";
    } else {
      var ab = relation(a, b);
      var ba = relation(b, a);
      var key = [ab, ba].sort().join("|");
      var table = {
        "friend|friend": 5,
        "friend|neutral": 4,
        "neutral|neutral": 3,
        "enemy|friend": 1,
        "enemy|neutral": 0.5,
        "enemy|enemy": 0
      };
      points = table[key];
      pair = "groom’s lord sees the bride’s as " + ab + "; bride’s lord sees the groom’s as " + ba;
    }
    return {
      points: points,
      groomLord: a,
      brideLord: b,
      detail: a + " (groom, " + groom.rashiName + ") and " + b + " (bride, " + bride.rashiName + "): " + pair + " → " + points + "."
    };
  }

  function scoreGana(groom, bride) {
    var points = GANA_POINTS[groom.gana + "|" + bride.gana];
    return {
      points: points,
      groom: groom.gana,
      bride: bride.gana,
      detail: "Groom " + groom.gana + ", bride " + bride.gana + " → " + points + "."
    };
  }

  function scoreBhakoot(groom, bride) {
    var fromBride = countMod(bride.rashi, groom.rashi, 12);
    var fromGroom = countMod(groom.rashi, bride.rashi, 12);
    var dosha = (fromBride === 2 && fromGroom === 12) ||
      (fromBride === 12 && fromGroom === 2) ||
      (fromBride === 5 && fromGroom === 9) ||
      (fromBride === 9 && fromGroom === 5) ||
      (fromBride === 6 && fromGroom === 8) ||
      (fromBride === 8 && fromGroom === 6);
    return {
      points: dosha ? 0 : 7,
      dosha: dosha,
      fromBride: fromBride,
      fromGroom: fromGroom,
      detail: "From bride’s sign to groom’s: " + fromBride + ". From groom’s to bride’s: " + fromGroom + ". " + (dosha ? "This is a 2/12, 5/9, or 6/8 pair, so the score is 0." : "Not a dosha pair, so the score is 7.")
    };
  }

  function scoreNadi(groom, bride) {
    var same = groom.nadi === bride.nadi;
    return {
      points: same ? 0 : 8,
      dosha: same,
      groom: groom.nadi,
      bride: bride.nadi,
      detail: same
        ? "Both " + groom.nadi + ", so nadi dosha and the score is 0."
        : groom.nadi + " and " + bride.nadi + " differ, so the score is 8."
    };
  }

  function cancellations(groom, bride, bhakoot, nadi) {
    var list = [];
    var lords = lordsFriendlyOrSame(groom.rashi, bride.rashi);
    if (nadi.dosha) {
      if (groom.rashi === bride.rashi && groom.nak !== bride.nak) {
        list.push({ koota: "Nadi", rule: "Same Moon sign, different nakshatras." });
      }
      if (groom.nak === bride.nak && groom.pada !== bride.pada) {
        list.push({ koota: "Nadi", rule: "Same nakshatra, different padas." });
      }
      if (lords.same) {
        list.push({ koota: "Nadi", rule: "Moon-sign lords are the same planet (" + lords.lordA + ")." });
      } else if (lords.mutualFriends) {
        list.push({ koota: "Nadi", rule: "Moon-sign lords are mutual friends (" + lords.lordA + " and " + lords.lordB + ")." });
      }
    }
    if (bhakoot.dosha) {
      if (lords.same) {
        list.push({ koota: "Bhakoot", rule: "Moon-sign lords are the same planet (" + lords.lordA + ")." });
      } else if (lords.mutualFriends) {
        list.push({ koota: "Bhakoot", rule: "Moon-sign lords are mutual friends (" + lords.lordA + " and " + lords.lordB + ")." });
      }
      if (groom.nak === bride.nak && groom.pada !== bride.pada) {
        list.push({ koota: "Bhakoot", rule: "Same nakshatra, different padas." });
      }
    }
    return list;
  }

  function bandFor(total) {
    if (total < 18) return { id: "low", label: "Not recommended", range: "Under 18" };
    if (total < 25) return { id: "average", label: "Average", range: "18–24" };
    if (total < 33) return { id: "good", label: "Good", range: "25–32" };
    return { id: "excellent", label: "Excellent", range: "33–36" };
  }

  function nearestGrid(lon, span) {
    var m = lon % span;
    var toPrev = m;
    var toNext = span - m;
    if (toNext < toPrev) return { dist: toNext, dir: 1 };
    return { dist: toPrev, dir: -1 };
  }

  function boundaryWarnings(lon) {
    lon = norm(lon);
    var warnings = [];
    var pada = nearestGrid(lon, PADA);
    var nak = nearestGrid(lon, NAK);
    var rashi = nearestGrid(lon, 30);
    if (pada.dist <= 0.25) {
      var kinds = ["pada"];
      if (nak.dist <= 0.25) kinds.unshift("nakshatra");
      if (rashi.dist <= 0.25) kinds.unshift("rashi");
      var shift = pada.dir * (pada.dist + 1e-4);
      if (pada.dist < 1e-8) shift = -1e-4;
      warnings.push({
        kinds: kinds,
        dist: pada.dist,
        other: placement(lon + shift)
      });
    }
    var within = lon % 30;
    var rashiIndex = Math.floor(lon / 30 + 1e-10);
    if (rashiIndex > 11) rashiIndex = 11;
    if ((rashiIndex === 8 || rashiIndex === 9) && Math.abs(within - 15) <= 0.25) {
      var dir = within < 15 ? 1 : -1;
      if (Math.abs(within - 15) < 1e-8) dir = -1;
      var otherLon = lon + dir * (Math.abs(within - 15) + 1e-4);
      warnings.push({
        kinds: ["vashya half-sign"],
        dist: Math.abs(within - 15),
        other: placement(otherLon),
        note: (rashiIndex === 8 ? "Sagittarius" : "Capricorn") + " changes vashya class at 15°."
      });
    }
    return warnings;
  }

  function match(groom, bride) {
    var parts = {
      varna: scoreVarna(groom, bride),
      vashya: scoreVashya(groom, bride),
      tara: scoreTara(groom, bride),
      yoni: scoreYoni(groom, bride),
      graha: scoreGraha(groom, bride),
      gana: scoreGana(groom, bride),
      bhakoot: scoreBhakoot(groom, bride),
      nadi: scoreNadi(groom, bride)
    };
    var total = 0;
    KOOTA_META.forEach(function (meta) {
      total += parts[meta.id].points;
    });
    /* Guard against binary dust such as 14.5000000001. */
    total = Math.round(total * 2) / 2;
    return {
      parts: parts,
      total: total,
      max: 36,
      band: bandFor(total),
      cancellations: cancellations(groom, bride, parts.bhakoot, parts.nadi)
    };
  }

  var MANGLIK_HOUSES = { 1: 1, 2: 1, 4: 1, 7: 1, 8: 1, 12: 1 };

  function houseFrom(refRashi, planetRashi) {
    return ((planetRashi - refRashi + 12) % 12) + 1;
  }

  function classicalMarsException(house, rashi) {
    if (house === 2 && (rashi === 2 || rashi === 5)) return "Mars in the 2nd in Gemini or Virgo is a classical exception.";
    if (house === 12 && (rashi === 1 || rashi === 6)) return "Mars in the 12th in Taurus or Libra is a classical exception.";
    if (house === 4 && (rashi === 0 || rashi === 7)) return "Mars in the 4th in Aries or Scorpio is a classical exception.";
    if (house === 7 && (rashi === 3 || rashi === 9)) return "Mars in the 7th in Cancer or Capricorn is a classical exception.";
    if (house === 8 && (rashi === 8 || rashi === 11)) return "Mars in the 8th in Sagittarius or Pisces is a classical exception.";
    if (rashi === 0 || rashi === 7) return "Mars in its own sign (Aries or Scorpio) is sometimes treated as cancelling Kuja dosha.";
    if (rashi === 9) return "Mars in Capricorn, its exaltation, is sometimes treated as cancelling Kuja dosha.";
    return "";
  }

  function manglikFromReference(label, refRashi, marsRashi) {
    var house = houseFrom(refRashi, marsRashi);
    var hit = !!MANGLIK_HOUSES[house];
    return {
      from: label,
      house: house,
      manglik: hit,
      exception: hit ? classicalMarsException(house, marsRashi) : ""
    };
  }

  function manglikReport(person) {
    /* person: { lagnaRashi, moonRashi, venusRashi, marsRashi } rashi indexes. */
    var fromLagna = manglikFromReference("Lagna", person.lagnaRashi, person.marsRashi);
    var fromMoon = manglikFromReference("Moon", person.moonRashi, person.marsRashi);
    var fromVenus = manglikFromReference("Venus", person.venusRashi, person.marsRashi);
    return {
      marsRashi: person.marsRashi,
      marsSign: RASHI_NAMES[person.marsRashi],
      fromLagna: fromLagna,
      fromMoon: fromMoon,
      fromVenus: fromVenus,
      manglik: fromLagna.manglik || fromMoon.manglik
    };
  }

  return {
    NAK: NAK,
    PADA: PADA,
    NAKSHATRA_NAMES: NAKSHATRA_NAMES,
    YONI_ANIMALS: YONI_ANIMALS,
    YONI_MATRIX: YONI_MATRIX,
    RASHI_NAMES: RASHI_NAMES,
    RASHI_SANSKRIT: RASHI_SANSKRIT,
    KOOTA_META: KOOTA_META,
    norm: norm,
    placement: placement,
    chartFromLongitude: chartFromLongitude,
    chartFromNakPada: chartFromNakPada,
    match: match,
    bandFor: bandFor,
    boundaryWarnings: boundaryWarnings,
    relation: relation,
    manglikReport: manglikReport,
    houseFrom: houseFrom
  };
});
