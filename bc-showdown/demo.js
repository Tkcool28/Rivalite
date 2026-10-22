/* ============================================================================
   BREEDERS' CUP SHOWDOWN — DEMO DATA  (demo.js)
   ----------------------------------------------------------------------------
   Sample fields + sample official results for DEMO MODE. Toggle demo mode at
   the top of the page: the card switches to these small 6-horse fields and the
   sample results below settle every bet type, so the math can be eyeballed
   before the real fields land (Oct 26 draw). Nothing here is real — every
   demo race is labelled DEMO on the card. Generated deterministically.
   ============================================================================ */
(function (g) {
  'use strict';

  // Tiny deterministic PRNG so demo data is identical on every load/device.
  function lcg(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  var FIRST = ['Golden', 'Bluegrass', 'Amber', 'Velvet', 'Copper', 'Scarlet',
    'Midnight', 'Honey', 'Iron', 'Silver', 'Royal', 'Bourbon', 'Limestone',
    'Autumn', 'Willow', 'Crimson'];
  var SECOND = ['Hour', 'Julep', 'Belle', 'Run', 'Song', 'Trail', 'Moon',
    'Fields', 'Charm', 'Legacy', 'Meadow', 'Crown', 'Spirit', 'Road',
    'Hollow', 'Star'];
  var MLS = ['2/1', '5/2', '3/1', '7/2', '4/1', '9/2', '5/1', '6/1'];

  function dec(ml) {
    if (!ml) return 3;
    var p = ml.split('/');
    return p.length === 2 ? parseFloat(p[0]) / parseFloat(p[1]) + 1 : parseFloat(ml) + 1;
  }
  function money(x) { return Math.round(x * 5) / 5; } // prices land on 20c steps

  function buildDay(realDay, daySeed) {
    var races = realDay.races.map(function (r, ri) {
      var rnd = lcg(daySeed + ri * 97 + 13);
      var horses = [];
      for (var i = 0; i < 6; i++) {
        var name = FIRST[Math.floor(rnd() * FIRST.length)] + ' ' +
                   SECOND[Math.floor(rnd() * SECOND.length)];
        var ml = MLS[(ri * 3 + i * 2) % MLS.length];
        // A couple of horses per race have "updated" odds that drifted.
        var now = null;
        if ((i + ri) % 3 === 0) {
          var idx = MLS.indexOf(ml);
          now = MLS[Math.max(0, Math.min(MLS.length - 1, idx + (rnd() > 0.5 ? 1 : -1)))];
        }
        horses.push({ n: i + 1, name: name, ml: ml, now: now });
      }
      return {
        n: r.n, name: r.name, detail: r.detail + ' · DEMO FIELD', bc: r.bc,
        postLabel: r.postLabel, postISO: r.postISO,
        note: 'Demo field — sample horses for play-testing. Not the real entry list.',
        horses: horses
      };
    });
    return {
      id: realDay.id, label: realDay.label, title: realDay.title,
      dateLabel: realDay.dateLabel, oddsUpdated: 'Demo snapshot · 12:00 PM ET',
      races: races
    };
  }

  function buildResults(day) {
    var out = {};
    var winPrice = {}; // race -> winner $2 price, for sequence payouts
    day.races.forEach(function (race, ri) {
      var rnd = lcg(5000 + ri * 131 + (day.id === 'sat' ? 777 : 0));
      // Deterministic "finish": shuffle 1..6, bias the low numbers forward.
      var order = [1, 2, 3, 4, 5, 6];
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var t = order[i]; order[i] = order[j]; order[j] = t;
      }
      var finish = order.slice(0, 4);
      function horse(n) { return race.horses[n - 1]; }
      var w = money(dec(horse(finish[0]).ml) * 2 * (0.9 + rnd() * 0.25));
      var p1 = money(Math.max(2.2, w * 0.45));
      var p2 = money(Math.max(2.2, dec(horse(finish[1]).ml) * 1.05));
      var s1 = money(Math.max(2.1, w * 0.3));
      var s2 = money(Math.max(2.1, p2 * 0.6));
      var s3 = money(Math.max(2.1, dec(horse(finish[2]).ml) * 0.62));
      var win = {}; win[finish[0]] = w;
      var place = {}; place[finish[0]] = p1; place[finish[1]] = p2;
      var show = {}; show[finish[0]] = s1; show[finish[1]] = s2; show[finish[2]] = s3;
      var exacta = money(w * dec(horse(finish[1]).ml) * 0.55);
      winPrice[race.n] = w;
      var seq = {};
      function chain(len) {
        if (race.n < len) return null;
        var prod = 1;
        for (var k = race.n - len + 1; k <= race.n; k++) prod *= (winPrice[k] || 6);
        return money(prod / Math.pow(2, len - 1) * 0.95);
      }
      var d = chain(2); if (d) seq.double = d;
      var p3 = chain(3); if (p3) seq.pick3 = p3;
      var p4 = chain(4); if (p4) seq.pick4 = p4;
      var p5 = chain(5); if (p5) seq.pick5 = p5;
      var p6 = chain(6); if (p6) seq.pick6 = p6;
      out[race.n] = { finish: finish, win: win, place: place, show: show, exacta: exacta, seq: seq };
    });
    return out;
  }

  var real = g.BC_DATA;
  var days = real.days.map(function (d, di) { return buildDay(d, 1000 + di * 331); });
  var results = {};
  days.forEach(function (d) { results[d.id] = buildResults(d); });

  g.BC_DEMO = { days: days, results: results };
})(typeof window !== 'undefined' ? window : globalThis);
