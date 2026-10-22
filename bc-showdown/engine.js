/* ============================================================================
   BREEDERS' CUP SHOWDOWN — SETTLEMENT ENGINE  (engine.js)
   ----------------------------------------------------------------------------
   Pure functions: no DOM, no storage. Used by app.js in the browser and by
   test_engine.js under Node.

   BET SHAPES
     { type:'wps',    day, race, horse, parts:['W','P','S'], stakePer }
     { type:'exacta', day, race, mode:'straight'|'box', picks:[...], stakePer }
     { type:'multi',  day, kind:'double'|'pick3'|'pick4'|'pick5'|'pick6',
                      startRace, legs:[{race, horses:[...]}], stakePer }
     { type:'parlay', day, legs:[{race, horse}], stake }

   COST (track style)
     wps    : stakePer x number of parts        ("$2 across the board" = 2 each)
     exacta : stakePer x 1 (straight) or x k*(k-1) (box of k horses)
     multi  : stakePer x product of horses per leg
     parlay : stake (single amount)

   SETTLEMENT (official $2 payouts; stake S on payout P returns S x P/2)
     Results for a day are a map: raceNumber -> result object (see results.js).
   ============================================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Engine = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var KIND_LEN = { double: 2, pick3: 3, pick4: 4, pick5: 5, pick6: 6 };
  var LEN_KIND = { 2: 'double', 3: 'pick3', 4: 'pick4', 5: 'pick5', 6: 'pick6' };
  var KIND_LABEL = { double: 'Daily Double', pick3: 'Pick 3', pick4: 'Pick 4', pick5: 'Pick 5', pick6: 'Pick 6' };

  function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }

  /* Parse a fractional odds string ("5/2", "3", "EVEN") to a decimal price
     (stake included), e.g. "5/2" -> 3.5. Display aid only. */
  function oddsDecimal(str) {
    if (str == null || str === '') return null;
    var s = String(str).trim().toUpperCase();
    if (s === 'EVEN' || s === 'EVS') return 2;
    if (s.indexOf('/') >= 0) {
      var p = s.split('/');
      var a = parseFloat(p[0]), b = parseFloat(p[1]);
      if (!isFinite(a) || !isFinite(b) || b === 0) return null;
      return a / b + 1;
    }
    var n = parseFloat(s);
    return isFinite(n) ? n + 1 : null;
  }

  function resultFor(dayResults, race) {
    if (!dayResults) return null;
    return dayResults[race] || dayResults[String(race)] || null;
  }
  function winnerOf(res) {
    return res && res.finish && res.finish.length ? res.finish[0] : null;
  }
  function hasResult(dayResults, race) { return !!resultFor(dayResults, race); }

  /* ------------------------------- COST ---------------------------------- */
  function cost(bet) {
    if (!bet) return 0;
    switch (bet.type) {
      case 'wps':
        return round2(bet.stakePer * (bet.parts ? bet.parts.length : 0));
      case 'exacta': {
        var k = bet.picks ? bet.picks.length : 0;
        return round2(bet.stakePer * (bet.mode === 'box' ? k * (k - 1) : 1));
      }
      case 'multi': {
        var combos = 1;
        (bet.legs || []).forEach(function (leg) { combos *= (leg.horses || []).length; });
        return round2(bet.stakePer * combos);
      }
      case 'parlay':
        return round2(bet.stake || 0);
      default:
        return 0;
    }
  }

  function combinations(bet) {
    if (!bet) return 0;
    if (bet.type === 'exacta') {
      var k = bet.picks ? bet.picks.length : 0;
      return bet.mode === 'box' ? k * (k - 1) : 1;
    }
    if (bet.type === 'multi') {
      var c = 1;
      (bet.legs || []).forEach(function (leg) { c *= (leg.horses || []).length; });
      return c;
    }
    return 1;
  }

  /* ---------------------------- VALIDATION ------------------------------- */
  function validate(bet) {
    if (!bet || !bet.type) return 'Empty bet.';
    if (bet.type === 'wps') {
      if (!bet.horse) return 'Pick a horse.';
      if (!bet.parts || !bet.parts.length) return 'Check at least one of Win / Place / Show.';
      if (!(bet.stakePer > 0)) return 'Enter a stake per part.';
    } else if (bet.type === 'exacta') {
      if (bet.mode === 'box') {
        if (!bet.picks || bet.picks.length < 2) return 'A box needs at least 2 horses.';
      } else if (!bet.picks || bet.picks.length !== 2) {
        return 'A straight exacta needs a 1st and a 2nd horse.';
      }
      if (!(bet.stakePer > 0)) return 'Enter a stake per combination.';
    } else if (bet.type === 'multi') {
      if (!bet.legs || bet.legs.length !== (KIND_LEN[bet.kind] || 0)) return 'Sequence legs are incomplete.';
      for (var i = 0; i < bet.legs.length; i++) {
        if (!bet.legs[i].horses || !bet.legs[i].horses.length) {
          return 'Leg ' + (i + 1) + ' (Race ' + bet.legs[i].race + ') needs at least one horse.';
        }
      }
      if (!(bet.stakePer > 0)) return 'Enter a stake per combination.';
    } else if (bet.type === 'parlay') {
      if (!bet.legs || bet.legs.length < 2) return 'A parlay needs at least 2 win picks.';
      var seen = {};
      for (var j = 0; j < bet.legs.length; j++) {
        if (seen[bet.legs[j].race]) return 'A parlay can only use one horse per race.';
        seen[bet.legs[j].race] = true;
      }
      if (!(bet.stake > 0)) return 'Enter a parlay stake.';
    } else {
      return 'Unknown bet type.';
    }
    return null;
  }

  /* ---------------------------- SETTLEMENT ------------------------------- */
  function settleWPS(bet, dr) {
    var res = resultFor(dr, bet.race);
    if (!res) return { status: 'pending', ret: 0, note: 'Awaiting result' };
    var pos = res.finish ? res.finish.indexOf(bet.horse) : -1;
    var ret = 0, hits = [];
    bet.parts.forEach(function (p) {
      var price = null;
      if (p === 'W' && pos === 0 && res.win) price = res.win[bet.horse];
      if (p === 'P' && pos >= 0 && pos <= 1 && res.place) price = res.place[bet.horse];
      if (p === 'S' && pos >= 0 && pos <= 2 && res.show) price = res.show[bet.horse];
      if (price != null) { ret += bet.stakePer * price / 2; hits.push(p); }
    });
    ret = round2(ret);
    return {
      status: ret > 0 ? 'won' : 'lost',
      ret: ret,
      note: hits.length ? 'Hit: ' + hits.join(' · ') : 'Off the board'
    };
  }

  function settleExacta(bet, dr) {
    var res = resultFor(dr, bet.race);
    if (!res || !res.finish || res.finish.length < 2) {
      return { status: 'pending', ret: 0, note: 'Awaiting result' };
    }
    var f0 = res.finish[0], f1 = res.finish[1], hit;
    if (bet.mode === 'box') {
      hit = bet.picks.indexOf(f0) >= 0 && bet.picks.indexOf(f1) >= 0;
    } else {
      hit = bet.picks[0] === f0 && bet.picks[1] === f1;
    }
    if (!hit) return { status: 'lost', ret: 0, note: 'Ran ' + f0 + '–' + f1 };
    if (res.exacta == null) {
      return { status: 'won', ret: 0, note: 'Hit — exacta payout not entered yet' };
    }
    return { status: 'won', ret: round2(bet.stakePer * res.exacta / 2), note: 'Exacta $' + res.exacta.toFixed(2) };
  }

  function settleMulti(bet, dr) {
    var legs = bet.legs || [];
    for (var i = 0; i < legs.length; i++) {
      var res = resultFor(dr, legs[i].race);
      if (!res) {
        return { status: 'pending', ret: 0, note: i === 0 ? 'Awaiting first leg' : 'Alive through leg ' + i, aliveThrough: i };
      }
      var w = winnerOf(res);
      if (legs[i].horses.indexOf(w) < 0) {
        return {
          status: 'lost', ret: 0, deadLeg: i,
          note: 'Died in leg ' + (i + 1) + ' (Race ' + legs[i].race + ' — won by #' + w + ')'
        };
      }
    }
    var endRace = legs.length ? legs[legs.length - 1].race : bet.startRace;
    var endRes = resultFor(dr, endRace);
    var payout = endRes && endRes.seq ? endRes.seq[bet.kind] : null;
    if (payout == null) {
      return { status: 'won', ret: 0, note: 'All legs hit — ' + KIND_LABEL[bet.kind] + ' payout not entered yet' };
    }
    return { status: 'won', ret: round2(bet.stakePer * payout / 2), note: KIND_LABEL[bet.kind] + ' $' + payout.toFixed(2) };
  }

  function settleParlay(bet, dr) {
    var factor = 1, pendingLegs = 0;
    for (var i = 0; i < bet.legs.length; i++) {
      var leg = bet.legs[i];
      var res = resultFor(dr, leg.race);
      if (!res) { pendingLegs++; continue; }
      if (winnerOf(res) !== leg.horse) {
        return { status: 'lost', ret: 0, note: 'Leg lost: Race ' + leg.race + ' (#' + leg.horse + ' did not win)' };
      }
      var wp = res.win ? res.win[leg.horse] : null;
      if (wp == null) {
        return { status: 'won', ret: 0, note: 'All legs won — a win price is missing in the results' };
      }
      factor *= wp / 2;
    }
    if (pendingLegs > 0) {
      return { status: 'pending', ret: 0, note: 'Alive — ' + pendingLegs + ' leg' + (pendingLegs > 1 ? 's' : '') + ' to run' };
    }
    return { status: 'won', ret: round2(bet.stake * factor), note: 'Parlay home at ' + factor.toFixed(2) + '×' };
  }

  function settle(bet, dayResults) {
    if (!bet) return { status: 'pending', ret: 0, note: '' };
    switch (bet.type) {
      case 'wps': return settleWPS(bet, dayResults);
      case 'exacta': return settleExacta(bet, dayResults);
      case 'multi': return settleMulti(bet, dayResults);
      case 'parlay': return settleParlay(bet, dayResults);
      default: return { status: 'pending', ret: 0, note: '' };
    }
  }

  /* ---------------------------- REBET-DOWN -------------------------------
     A Pick N that died in leg i can be rebet as a shorter sequence over the
     legs that have NOT run yet, keeping the player's surviving selections.
     Returns null when no clean rebet exists (fewer than 2 legs left, or a
     later leg has already been run).                                  */
  function rebetInfo(bet, dayResults) {
    if (!bet || bet.type !== 'multi') return null;
    var s = settleMulti(bet, dayResults);
    if (s.status !== 'lost' || typeof s.deadLeg !== 'number') return null;
    var suffix = (bet.legs || []).slice(s.deadLeg + 1);
    if (suffix.length < 2) return null;
    for (var i = 0; i < suffix.length; i++) {
      if (hasResult(dayResults, suffix[i].race)) return null;
    }
    var kind = LEN_KIND[suffix.length];
    if (!kind) return null;
    return {
      kind: kind,
      label: KIND_LABEL[kind],
      startRace: suffix[0].race,
      endRace: suffix[suffix.length - 1].race,
      legs: suffix.map(function (leg) {
        return { race: leg.race, horses: leg.horses.slice() };
      })
    };
  }

  function makeRebet(bet, dayResults, stakePer, newId) {
    var info = rebetInfo(bet, dayResults);
    if (!info) return null;
    return {
      id: newId,
      player: bet.player,
      day: bet.day,
      type: 'multi',
      kind: info.kind,
      startRace: info.startRace,
      legs: info.legs,
      stakePer: stakePer,
      rebetOf: bet.id || null
    };
  }

  /* ----------------------------- SUMMARY --------------------------------- */
  function summary(bets, dayResults, bank) {
    var staked = 0, returned = 0, pendingStake = 0, open = 0, settledCount = 0;
    (bets || []).forEach(function (bet) {
      var c = cost(bet);
      staked += c;
      var s = settle(bet, dayResults);
      if (s.status === 'won') { returned += s.ret; settledCount++; }
      else if (s.status === 'lost') { settledCount++; }
      else { pendingStake += c; open++; }
    });
    staked = round2(staked); returned = round2(returned); pendingStake = round2(pendingStake);
    return {
      bank: bank,
      staked: staked,
      returned: returned,
      pendingStake: pendingStake,
      openBets: open,
      settledBets: settledCount,
      net: round2(returned - staked),
      balance: round2(bank - staked + returned),
      available: round2(bank - staked + returned) // uncommitted points right now
    };
  }

  /* Races a bet touches — used for post-time locking. */
  function betRaces(bet) {
    if (!bet) return [];
    if (bet.type === 'wps' || bet.type === 'exacta') return [bet.race];
    if (bet.type === 'multi' || bet.type === 'parlay') {
      return (bet.legs || []).map(function (l) { return l.race; });
    }
    return [];
  }

  return {
    KIND_LEN: KIND_LEN,
    LEN_KIND: LEN_KIND,
    KIND_LABEL: KIND_LABEL,
    round2: round2,
    oddsDecimal: oddsDecimal,
    resultFor: resultFor,
    winnerOf: winnerOf,
    hasResult: hasResult,
    cost: cost,
    combinations: combinations,
    validate: validate,
    settle: settle,
    settleMulti: settleMulti,
    rebetInfo: rebetInfo,
    makeRebet: makeRebet,
    summary: summary,
    betRaces: betRaces
  };
});
