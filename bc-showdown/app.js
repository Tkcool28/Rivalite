/* ============================================================================
   BREEDERS' CUP SHOWDOWN — APP  (app.js)
   Static, no backend. State lives in localStorage; slips + results travel
   between phones as URL-encoded share links, Rivalite-style.
   ============================================================================ */
(function () {
  'use strict';
  var E = window.Engine;
  var LS_KEY = 'bc-showdown-v1';
  var BANK = window.BC_DATA.bankPerDay;
  var PLAYERS = window.BC_DATA.players;

  /* ------------------------------- State -------------------------------- */
  function emptyMode() {
    return {
      bets: { terry: [], chandra: [] },
      results: { fri: {}, sat: {} }
    };
  }
  var S = {
    me: 'terry',
    demo: false,
    day: 'fri',
    view: 'card',
    slipPlayer: 'terry',
    modes: { real: emptyMode(), demo: emptyMode() }
  };
  var UI = {
    expanded: null,           // race key "fri-9"
    tool: 'wps',
    wps: { horse: null, parts: { W: true, P: false, S: false }, stake: 10 },
    ex: { mode: 'straight', picks: [], stake: 4 },
    seqDraft: null,           // { day, kind, startRace, legs: [[horses]...], stakePer }
    parlay: { day: null, legs: [], stake: 10 },
    resEdit: null,            // race key being edited
    resStage: null,           // { key, finish: [] } once finish order is set
    rebetFor: null,           // bet id with the rebet stake box open
    rebetStake: 2,
    pendingImport: null
  };

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.modes && parsed.modes.real && parsed.modes.demo) {
        S = parsed;
      }
    } catch (e) { /* start fresh */ }
  }

  /* ------------------------------ Accessors ------------------------------ */
  function MODE() { return S.demo ? 'demo' : 'real'; }
  function DAYS() { return S.demo ? window.BC_DEMO.days : window.BC_DATA.days; }
  function DAY() {
    var ds = DAYS();
    for (var i = 0; i < ds.length; i++) if (ds[i].id === S.day) return ds[i];
    return ds[0];
  }
  function RACE(dayId, n) {
    var ds = DAYS(), d = null, i;
    for (i = 0; i < ds.length; i++) if (ds[i].id === dayId) d = ds[i];
    if (!d) return null;
    for (i = 0; i < d.races.length; i++) if (d.races[i].n === n) return d.races[i];
    return null;
  }
  function HORSE(dayId, raceN, n) {
    var r = RACE(dayId, raceN);
    if (!r) return null;
    for (var i = 0; i < r.horses.length; i++) if (r.horses[i].n === n) return r.horses[i];
    return null;
  }
  function RESULTS(dayId) { return S.modes[MODE()].results[dayId] || {}; }
  function ALLBETS(player) { return S.modes[MODE()].bets[player] || []; }
  function BETS(player, dayId) {
    return ALLBETS(player).filter(function (b) { return b.day === dayId; });
  }
  function SUM(player, dayId) {
    return E.summary(BETS(player, dayId), RESULTS(dayId), BANK);
  }
  function horseName(dayId, raceN, n) {
    var h = HORSE(dayId, raceN, n);
    if (!h) return '#' + n;
    if (!h.name || h.name.indexOf('TBA') === 0) return '#' + n;
    return '#' + n + ' ' + h.name;
  }

  /* ------------------------------- Helpers ------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function fmt(x) {
    return (Math.round(x * 100) / 100).toLocaleString('en-US', {
      minimumFractionDigits: 0, maximumFractionDigits: 2
    });
  }
  function fmtSigned(x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + fmt(Math.abs(x)); }
  function money(x) { return '$' + Number(x).toFixed(2); }
  function uid() {
    return 'b' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  var SILKS = {
    1: ['#d22630', '#fff'], 2: ['#ffffff', '#22312a'], 3: ['#2456a6', '#fff'],
    4: ['#f2c230', '#22312a'], 5: ['#1e7a46', '#fff'], 6: ['#232323', '#f5d90a'],
    7: ['#f07d18', '#fff'], 8: ['#ef8fb5', '#22312a'], 9: ['#2aa198', '#fff'],
    10: ['#7d3c98', '#fff'], 11: ['#b03a2e', '#fff'], 12: ['#a4c639', '#22312a'],
    13: ['#8b5a2b', '#fff'], 14: ['#800020', '#fff']
  };
  function silk(n) {
    var c = SILKS[n] || ['#0e3b2e', '#f0e3b2'];
    return '<span class="silk" style="background:' + c[0] + ';color:' + c[1] + '">' + n + '</span>';
  }
  function oddsCell(h) {
    var now = (h.now != null && h.now !== '') ? h.now : h.ml;
    if (now == null) return '<span class="tba">—</span>';
    var drift = '';
    if (h.now != null && h.ml != null) {
      var dNow = E.oddsDecimal(h.now), dMl = E.oddsDecimal(h.ml);
      if (dNow && dMl && Math.abs(dNow - dMl) > 0.01) {
        drift = dNow < dMl
          ? '<span class="odds-drift up">▼</span>'   // shortening (hot)
          : '<span class="odds-drift down">▲</span>'; // drifting out
      }
    }
    return '<span class="odds-now">' + esc(now) + '</span>' + drift;
  }
  function raceKey(dayId, n) { return dayId + '-' + n; }
  function parseKey(key) {
    var p = key.split('-');
    return { day: p[0], race: parseInt(p[1], 10) };
  }
  function localPost(race) {
    try {
      return new Date(race.postISO).toLocaleTimeString([], {
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      });
    } catch (e) { return ''; }
  }
  function raceLocked(dayId, race) {
    if (S.demo) return false;
    if (E.hasResult(RESULTS(dayId), race.n)) return true;
    return Date.now() >= Date.parse(race.postISO);
  }
  function betLocked(bet) {
    if (S.demo) return false;
    var dr = RESULTS(bet.day);
    var races = E.betRaces(bet);
    for (var i = 0; i < races.length; i++) {
      var r = RACE(bet.day, races[i]);
      if (E.hasResult(dr, races[i])) return true;
      if (r && Date.now() >= Date.parse(r.postISO)) return true;
    }
    return false;
  }

  /* ----------------------------- Scoreboard ------------------------------ */
  function renderScoreboard() {
    var day = DAY();
    var weekendNet = {}, html = '';
    PLAYERS.forEach(function (p) {
      weekendNet[p.id] = DAYS().reduce(function (acc, d) {
        return acc + SUM(p.id, d.id).net;
      }, 0);
    });
    var leader = weekendNet.terry === weekendNet.chandra ? null
      : (weekendNet.terry > weekendNet.chandra ? 'terry' : 'chandra');
    PLAYERS.forEach(function (p) {
      var s = SUM(p.id, day.id);
      var wn = weekendNet[p.id];
      html += '<div class="player-card">' +
        '<p class="pname">' + esc(p.name) +
          (leader === p.id ? ' <span class="crown">♛ LEADING</span>' : '') + '</p>' +
        '<p class="bal"><small>' + esc(day.label) + ' balance</small>' + fmt(s.balance) + '</p>' +
        '<div class="lines">Staked <b>' + fmt(s.staked) + '</b> · Back <b>' + fmt(s.returned) + '</b>' +
          (s.pendingStake > 0 ? ' · Live <b>' + fmt(s.pendingStake) + '</b>' : '') +
          '<br>Weekend net <b class="' + (wn > 0 ? 'net-pos' : wn < 0 ? 'net-neg' : '') + '">' +
          fmtSigned(wn) + '</b></div>' +
        '</div>';
    });
    html += '<div class="weekend">' + (S.demo ? 'Demo mode — ' : '') +
      'Each player starts each day with <b>' + fmt(BANK) + ' points</b>. Fresh bank Saturday.</div>';
    document.getElementById('scoreboard').innerHTML = html;
  }

  /* ------------------------------ Controls ------------------------------- */
  function renderControls() {
    var meHtml = '<span style="align-self:center;font-size:11px;letter-spacing:.14em;color:#cfd8c8;padding:0 4px;">I AM</span>';
    PLAYERS.forEach(function (p) {
      meHtml += '<button type="button" data-act="me" data-p="' + p.id + '"' +
        (S.me === p.id ? ' class="active"' : '') + '>' + esc(p.name) + '</button>';
    });
    document.getElementById('meSeg').innerHTML = meHtml;
    var dayHtml = '';
    DAYS().forEach(function (d) {
      dayHtml += '<button type="button" data-act="day" data-p="' + d.id + '"' +
        (S.day === d.id ? ' class="active"' : '') + '>' + esc(d.label) + '</button>';
    });
    document.getElementById('daySeg').innerHTML = dayHtml;
    var demoBtn = document.getElementById('demoBtn');
    demoBtn.classList.toggle('on', S.demo);
    demoBtn.textContent = S.demo ? 'Demo Mode: ON' : 'Demo Mode';
    document.getElementById('demoBanner').innerHTML = S.demo
      ? '<div class="demo-banner">✦ DEMO MODE — sample fields &amp; sample results. ' +
        'Load the sample results in the Results tab and watch every bet type settle. ' +
        'Demo bets live in their own slip and never touch the real game. ✦</div>'
      : '';
    document.querySelectorAll('.bottomnav button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === S.view);
    });
  }

  /* --------------------------- Share / Import ---------------------------- */
  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }
  function shareLink() {
    var mode = MODE();
    var payload = {
      v: 1,
      mode: mode,
      from: S.me,
      bets: ALLBETS(S.me),
      results: S.modes[mode].results
    };
    return location.href.split('#')[0] + '#s=' + b64encode(JSON.stringify(payload));
  }
  function doShare() {
    var link = shareLink();
    var slot = document.getElementById('shareSlot');
    function showBox() {
      slot.innerHTML = '<div class="import-banner"><span>Your share link — send it to the other player:</span></div>' +
        '<textarea class="share-box" rows="3" readonly>' + esc(link) + '</textarea>';
      var ta = slot.querySelector('textarea');
      ta.focus(); ta.select();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function () {
        toast('Share link copied — send it over!');
        slot.innerHTML = '';
      }, showBox);
    } else { showBox(); }
  }
  function checkHashImport() {
    if (location.hash.indexOf('#s=') !== 0) return;
    try {
      var payload = JSON.parse(b64decode(location.hash.slice(3)));
      if (payload && payload.from && payload.bets) {
        UI.pendingImport = payload;
        var name = payload.from === 'terry' ? 'Terry' : 'Chandra';
        var nRes = 0;
        if (payload.results) {
          Object.keys(payload.results).forEach(function (d) {
            nRes += Object.keys(payload.results[d] || {}).length;
          });
        }
        document.getElementById('importSlot').innerHTML =
          '<div class="import-banner"><span><b>' + esc(name) + '</b> shared a slip (' +
          (payload.mode === 'demo' ? 'Demo' : 'Real') + ') — ' + payload.bets.length +
          ' bets, ' + nRes + ' race results.</span>' +
          '<span><button class="btn btn-gold" type="button" data-act="import-yes">Import</button> ' +
          '<button class="btn btn-ghost" type="button" data-act="import-no">Dismiss</button></span></div>';
      }
    } catch (e) { /* not a share link */ }
  }
  function doImport() {
    var p = UI.pendingImport;
    if (!p) return;
    var mode = p.mode === 'demo' ? 'demo' : 'real';
    S.modes[mode].bets[p.from] = p.bets || [];
    if (p.results) {
      Object.keys(p.results).forEach(function (d) {
        Object.keys(p.results[d] || {}).forEach(function (r) {
          S.modes[mode].results[d][r] = p.results[d][r];
        });
      });
    }
    S.demo = mode === 'demo';
    S.slipPlayer = p.from;
    UI.pendingImport = null;
    document.getElementById('importSlot').innerHTML = '';
    try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) {}
    save();
    toast('Slip imported — scores synced.');
    renderAll();
  }

  /* --------------------------- Bet descriptions -------------------------- */
  function describeBet(bet) {
    var d = bet.day, i, parts = [];
    if (bet.type === 'wps') {
      return 'Race ' + bet.race + ' · ' + horseName(d, bet.race, bet.horse) + ' — ' +
        bet.parts.join('/') + ' @ ' + fmt(bet.stakePer) + ' per part';
    }
    if (bet.type === 'exacta') {
      if (bet.mode === 'box') {
        return 'Race ' + bet.race + ' · Exacta BOX ' +
          bet.picks.map(function (n) { return '#' + n; }).join(' · ') + ' @ ' + fmt(bet.stakePer) + '/combo';
      }
      return 'Race ' + bet.race + ' · Exacta ' + horseName(d, bet.race, bet.picks[0]) +
        ' over ' + horseName(d, bet.race, bet.picks[1]) + ' @ ' + fmt(bet.stakePer);
    }
    if (bet.type === 'multi') {
      for (i = 0; i < bet.legs.length; i++) {
        parts.push('R' + bet.legs[i].race + ' [' +
          bet.legs[i].horses.map(function (n) { return '#' + n; }).join(', ') + ']');
      }
      return E.KIND_LABEL[bet.kind] + ' · Races ' + bet.startRace + '–' +
        (bet.startRace + E.KIND_LEN[bet.kind] - 1) + ' · ' + parts.join(' · ') +
        ' @ ' + fmt(bet.stakePer) + '/combo';
    }
    if (bet.type === 'parlay') {
      for (i = 0; i < bet.legs.length; i++) {
        parts.push('R' + bet.legs[i].race + ' ' + horseName(d, bet.legs[i].race, bet.legs[i].horse));
      }
      return 'Win Parlay · ' + parts.join(' + ') + ' @ ' + fmt(bet.stake) + ' points';
    }
    return 'Bet';
  }
  function betKindLabel(bet) {
    return {
      wps: 'Win/Place/Show', exacta: 'Exacta',
      multi: E.KIND_LABEL[bet.kind], parlay: 'Win Parlay'
    }[bet.type] || bet.type;
  }

  /* ------------------------------ Add a bet ------------------------------ */
  function tryAddBet(bet) {
    var err = E.validate(bet);
    if (err) { toast(err); return false; }
    // Lock check: every race involved must still be open (first leg governs
    // sequences in practice, but a late leg that already ran is also closed).
    var races = E.betRaces(bet);
    for (var i = 0; i < races.length; i++) {
      var r = RACE(bet.day, races[i]);
      if (r && raceLocked(bet.day, r)) {
        toast('Race ' + races[i] + ' is closed — picks lock at post time.');
        return false;
      }
    }
    var c = E.cost(bet);
    var avail = SUM(S.me, bet.day).available;
    if (c > avail + 1e-9) {
      toast('Not enough points — ' + fmt(avail) + ' available on ' + DAY().label + '.');
      return false;
    }
    bet.id = uid();
    bet.player = S.me;
    ALLBETS(S.me).push(bet);
    save();
    toast('Bet in! ' + fmt(c) + ' points staked.');
    return true;
  }

  /* ------------------------------- Card view ----------------------------- */
  function renderCard() {
    var day = DAY();
    var dr = RESULTS(day.id);
    var html = '<div class="day-head"><h2>' + esc(day.title) + '</h2><p>' +
      esc(day.dateLabel) + ' · Keeneland</p></div>';
    html += '<p class="odds-line">' +
      (day.oddsUpdated ? 'Odds updated ' + esc(day.oddsUpdated) : 'Morning line only — no updates yet') +
      (S.demo ? ' · DEMO' : '') + '</p>';
    day.races.forEach(function (race) {
      html += renderRace(day, race, dr);
    });
    html += howToHtml();
    document.getElementById('view-card').innerHTML = html;
  }

  function renderRace(day, race, dr) {
    var key = raceKey(day.id, race.n);
    var res = E.resultFor(dr, race.n);
    var locked = raceLocked(day.id, race);
    var open = UI.expanded === key;
    var html = '<article class="race' + (race.bc ? ' bc' : '') + '">';
    html += '<div class="race-head" data-act="expand" data-p="' + key + '">' +
      '<div class="race-num">' + race.n + '</div>' +
      '<div><h3>' + esc(race.name) +
      (race.bc ? ' <span class="badge gold">Grade 1</span>' : '') +
      (res ? ' <span class="badge final">Official</span>' : locked ? ' <span class="badge lock">Locked</span>' : '') +
      '</h3><div class="detail">' + esc(race.detail) + '</div></div>' +
      '<div class="post"><div class="t">' + esc(race.postLabel) + '</div>' +
      '<div class="l">your time: ' + esc(localPost(race)) + '</div></div></div>';
    if (res) {
      var names = res.finish.slice(0, 4).map(function (n) { return horseName(day.id, race.n, n); });
      var w = res.finish[0];
      html += '<div class="result-line"><b>Result:</b> ' + names.join(' · ') +
        (res.win && res.win[w] != null ? ' — Win ' + money(res.win[w]) : '') +
        (res.exacta != null ? ' · Exacta ' + money(res.exacta) : '') + '</div>';
    } else if (race.note) {
      html += '<div class="race-note">' + esc(race.note) + '</div>';
    }
    html += '<table class="horses"><thead><tr><th style="width:38px">#</th><th>Horse</th>' +
      '<th class="num">ML</th><th class="num">Now</th>' + (open && !locked ? '<th></th>' : '') +
      '</tr></thead><tbody>';
    race.horses.forEach(function (h) {
      var pos = res ? res.finish.indexOf(h.n) : -1;
      var cls = pos === 0 ? ' class="win"' : '';
      if (open && UI.tool === 'wps' && UI.wps.horse === h.n) cls = ' class="sel"';
      if (open && UI.tool === 'exacta' && UI.ex.picks.indexOf(h.n) >= 0) cls = ' class="sel"';
      html += '<tr' + cls + ' data-act="horse" data-p="' + key + '" data-h="' + h.n + '">' +
        '<td>' + silk(h.n) + '</td>' +
        '<td><span class="hname">' +
        (h.name && h.name.indexOf('TBA') === 0 ? '<span class="tba">' + esc(h.name) + '</span>' : esc(h.name)) +
        '</span>' +
        (pos === 0 ? ' <span class="badge gold">Won</span>'
          : pos === 1 ? ' <span class="badge lock">2nd</span>'
          : pos === 2 ? ' <span class="badge lock">3rd</span>' : '') +
        (open && UI.tool === 'exacta' && UI.ex.picks.indexOf(h.n) >= 0
          ? '<span class="pick-order">' + (UI.ex.picks.indexOf(h.n) + 1) + '</span>' : '') +
        '</td>' +
        '<td class="num">' + (h.ml ? esc(h.ml) : '—') + '</td>' +
        '<td class="num">' + oddsCell(h) + '</td>' +
        (open && !locked ? '<td style="text-align:right"><button type="button" class="parlay-add" ' +
          'data-act="parlay-add" data-p="' + key + '" data-h="' + h.n + '">+ Parlay</button></td>' : '') +
        '</tr>';
    });
    html += '</tbody></table>';
    if (open) html += renderBetPanel(day, race, locked);
    else if (!locked && !res) {
      html += '<div style="padding:0 14px 12px"><button type="button" class="btn btn-green" ' +
        'data-act="expand" data-p="' + key + '">Bet this race</button></div>';
    }
    html += '</article>';
    return html;
  }

  function renderBetPanel(day, race, locked) {
    var key = raceKey(day.id, race.n);
    if (locked) {
      return '<div class="betpanel"><p class="help">Betting is closed for this race — picks lock at post time (' +
        esc(race.postLabel) + ').</p></div>';
    }
    var html = '<div class="betpanel"><div class="tools">' +
      '<button type="button" data-act="tool" data-p="wps"' + (UI.tool === 'wps' ? ' class="active"' : '') + '>Win · Place · Show</button>' +
      '<button type="button" data-act="tool" data-p="exacta"' + (UI.tool === 'exacta' ? ' class="active"' : '') + '>Exacta</button>' +
      '<button type="button" data-act="tool" data-p="seq"' + (UI.tool === 'seq' ? ' class="active"' : '') + '>Doubles &amp; Picks</button>' +
      '</div>';
    if (UI.tool === 'wps') html += renderWpsTool(day, race);
    else if (UI.tool === 'exacta') html += renderExactaTool(day, race);
    else html += renderSeqTool(day, race);
    html += '</div>';
    return html;
  }

  function renderWpsTool(day, race) {
    var w = UI.wps;
    var partsCount = (w.parts.W ? 1 : 0) + (w.parts.P ? 1 : 0) + (w.parts.S ? 1 : 0);
    var cost = w.stake * partsCount;
    var sel = w.horse ? horseName(day.id, race.n, w.horse) : null;
    return '<div class="toolbox">' +
      '<p class="hint">Tap a horse above, check any of Win / Place / Show, and set the stake ' +
      '<b>per part</b> — track style, so 10 across the board is 30 total. Each part settles on its own official price.</p>' +
      (sel ? '<p style="margin:0 0 4px">Selected: <b>' + esc(sel) + '</b></p>'
           : '<p style="margin:0 0 4px"><b>No horse selected yet.</b></p>') +
      '<div class="wps-parts">' +
      ['W', 'P', 'S'].map(function (p) {
        var label = p === 'W' ? 'Win' : p === 'P' ? 'Place' : 'Show';
        return '<label><input type="checkbox" data-bind="wps-part" data-p="' + p + '"' +
          (w.parts[p] ? ' checked' : '') + '> ' + label + '</label>';
      }).join('') +
      '</div>' +
      '<div class="stake-row"><label>Stake / part</label>' +
      '<input type="number" min="1" step="1" value="' + w.stake + '" data-bind="wps-stake">' +
      '<span class="cost-line" id="wpsCost">Total: ' + fmt(cost) + ' pts</span>' +
      '<button type="button" class="btn btn-gold" data-act="add-wps" data-p="' + raceKey(day.id, race.n) + '">Add Bet</button></div>' +
      '</div>';
  }

  function renderExactaTool(day, race) {
    var x = UI.ex;
    var combos = x.mode === 'box' ? x.picks.length * (x.picks.length - 1) : 1;
    var cost = x.stake * combos;
    var picksTxt = x.picks.length
      ? x.picks.map(function (n) { return horseName(day.id, race.n, n); }).join(x.mode === 'box' ? ' · ' : ' over ')
      : 'none yet';
    return '<div class="toolbox">' +
      '<p class="hint">' + (x.mode === 'straight'
        ? 'Tap your 1st horse, then your 2nd — they must finish in that exact order.'
        : 'Tap 2 or more horses — the box covers every finishing order of your picks in the top two.') + '</p>' +
      '<div class="tools" style="margin-bottom:6px">' +
      '<button type="button" data-act="ex-mode" data-p="straight"' + (x.mode === 'straight' ? ' class="active"' : '') + '>Straight</button>' +
      '<button type="button" data-act="ex-mode" data-p="box"' + (x.mode === 'box' ? ' class="active"' : '') + '>Box</button>' +
      (x.picks.length ? '<button type="button" data-act="ex-clear">Clear picks</button>' : '') +
      '</div>' +
      '<p style="margin:0 0 4px">Picks: <b>' + esc(picksTxt) + '</b></p>' +
      '<div class="stake-row"><label>Stake / combo</label>' +
      '<input type="number" min="1" step="1" value="' + x.stake + '" data-bind="ex-stake">' +
      '<span class="cost-line" id="exCost">' + combos + ' combo' + (combos === 1 ? '' : 's') + ' · Total: ' + fmt(cost) + ' pts</span>' +
      '<button type="button" class="btn btn-gold" data-act="add-exacta" data-p="' + raceKey(day.id, race.n) + '">Add Bet</button></div>' +
      '</div>';
  }

  function renderSeqTool(day, race) {
    var lastRace = day.races[day.races.length - 1].n;
    var btns = '';
    Object.keys(E.KIND_LEN).forEach(function (kind) {
      var len = E.KIND_LEN[kind];
      var end = race.n + len - 1;
      if (end > lastRace) return;
      btns += '<button type="button" class="btn btn-green" data-act="seq-start" data-p="' + kind + '">' +
        E.KIND_LABEL[kind] + ' · R' + race.n + '–R' + end + '</button>';
    });
    return '<div class="toolbox">' +
      '<p class="hint">Rolling sequences, just like the track — every leg must win. ' +
      'Use more than one horse per leg and the combinations multiply, exactly like a real ticket.</p>' +
      '<div class="seq-btns">' + (btns || '<span class="help">No sequences start this late in the card.</span>') + '</div></div>';
  }

  /* ------------------------------ Parlay tray ---------------------------- */
  function renderParlayTray() {
    var tray = document.getElementById('parlayTray');
    var p = UI.parlay;
    if (!p.legs.length) { tray.innerHTML = ''; return; }
    var day = null;
    DAYS().forEach(function (d) { if (d.id === p.day) day = d; });
    var legsHtml = p.legs.map(function (leg, i) {
      return 'R' + leg.race + ' ' + esc(horseName(p.day, leg.race, leg.horse)) +
        ' <button type="button" data-act="parlay-del" data-p="' + i + '">✕</button>';
    }).join('<br>');
    tray.innerHTML = '<div class="parlay-tray"><h4>Win Parlay — ' + esc(day ? day.label : '') +
      ' (' + p.legs.length + ' leg' + (p.legs.length === 1 ? '' : 's') + ')</h4>' +
      '<div class="legs">' + legsHtml + '</div>' +
      '<div class="stake-row"><label style="color:#bcd0bd">Stake</label>' +
      '<input type="number" min="1" step="1" value="' + p.stake + '" data-bind="parlay-stake">' +
      '<span class="cost-line">Pays stake × each winner\'s price ÷ 2, multiplied together</span></div>' +
      '<div class="stake-row"><button type="button" class="btn btn-gold" data-act="parlay-place">Place Parlay</button>' +
      '<button type="button" class="btn btn-ghost" style="color:#e9e2cd;border-color:rgba(201,162,39,.6)" data-act="parlay-clear">Clear</button></div></div>';
  }
  function parlayAdd(dayId, raceN, horseN) {
    var race = RACE(dayId, raceN);
    if (!race || raceLocked(dayId, race)) { toast('That race is closed.'); return; }
    var p = UI.parlay;
    if (p.day && p.day !== dayId) {
      toast('This parlay is on ' + (p.day === 'fri' ? 'Friday' : 'Saturday') +
        ' — clear it to start one on the other day.');
      return;
    }
    for (var i = 0; i < p.legs.length; i++) {
      if (p.legs[i].race === raceN) {
        p.legs[i].horse = horseN;
        toast('Parlay leg updated: Race ' + raceN + ' → #' + horseN);
        renderAll();
        return;
      }
    }
    p.day = dayId;
    p.legs.push({ race: raceN, horse: horseN });
    p.legs.sort(function (a, b) { return a.race - b.race; });
    toast('Added to parlay: Race ' + raceN + ' #' + horseN);
    renderAll();
  }

  /* --------------------------- Sequence builder -------------------------- */
  function startSequence(kind) {
    var day = DAY();
    var race = RACE(day.id, parseInt(UI.expanded.split('-')[1], 10));
    if (!race) return;
    var len = E.KIND_LEN[kind];
    var legs = [];
    for (var i = 0; i < len; i++) legs.push([]);
    UI.seqDraft = { day: day.id, kind: kind, startRace: race.n, legs: legs, stakePer: 2 };
    S.view = 'seq';
    renderAll();
    window.scrollTo(0, 0);
  }
  function renderSeq() {
    var el = document.getElementById('view-seq');
    var d = UI.seqDraft;
    if (!d) { el.innerHTML = ''; return; }
    var combos = d.legs.reduce(function (acc, leg) { return acc * leg.length; }, 1);
    var complete = d.legs.every(function (l) { return l.length > 0; });
    var cost = complete ? combos * d.stakePer : 0;
    var html = '<div class="builder"><h2>' + E.KIND_LABEL[d.kind] + '</h2>' +
      '<p class="sub">' + esc(DAY().dateLabel) + ' · Races ' + d.startRace + '–' +
      (d.startRace + E.KIND_LEN[d.kind] - 1) + ' · every leg must win. ' +
      'If it dies early, your slip will offer a one-tap rebet-down into the shorter sequence.</p>';
    d.legs.forEach(function (legHorses, li) {
      var raceN = d.startRace + li;
      var race = RACE(d.day, raceN);
      html += '<div class="leg-block"><h4>Leg ' + (li + 1) + ' · Race ' + raceN + ' — ' +
        esc(race ? race.name : '') + '</h4><div class="chips">';
      (race ? race.horses : []).forEach(function (h) {
        var on = legHorses.indexOf(h.n) >= 0;
        html += '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="seq-chip" ' +
          'data-p="' + li + '" data-h="' + h.n + '">' + silk(h.n) +
          '<span>' + esc(h.name && h.name.indexOf('TBA') === 0 ? 'TBA' : h.name) + '</span></button>';
      });
      html += '</div></div>';
    });
    html += '<div class="stake-row"><label>Stake / combo</label>' +
      '<input type="number" min="1" step="1" value="' + d.stakePer + '" data-bind="seq-stake">' +
      '<span class="cost-line" id="seqCost">' +
      (complete ? combos + ' combos · Total: ' + fmt(cost) + ' pts' : 'Pick at least one horse in every leg') +
      '</span></div>' +
      '<div class="stake-row"><button type="button" class="btn btn-gold" data-act="seq-place"' +
      (complete ? '' : ' disabled') + '>Place ' + E.KIND_LABEL[d.kind] + '</button>' +
      '<button type="button" class="btn btn-ghost" data-act="seq-cancel">Back to card</button></div></div>';
    el.innerHTML = html;
  }

  /* -------------------------------- Slip view ---------------------------- */
  function renderSlip() {
    var el = document.getElementById('view-slip');
    var day = DAY();
    var player = PLAYERS.filter(function (p) { return p.id === S.slipPlayer; })[0] || PLAYERS[0];
    var mine = player.id === S.me;
    var s = SUM(player.id, day.id);
    var bets = BETS(player.id, day.id);
    var dr = RESULTS(day.id);
    var html = '<div class="day-head"><h2>' + esc(player.name) + '\'s Slip</h2><p>' +
      esc(day.title) + ' · ' + esc(day.dateLabel) + '</p></div>';
    html += '<div class="tools" style="justify-content:center">' + PLAYERS.map(function (p) {
      return '<button type="button" data-act="slip-player" data-p="' + p.id + '"' +
        (S.slipPlayer === p.id ? ' class="active"' : '') + '>' + esc(p.name) + '</button>';
    }).join('') + '</div>';
    html += '<div class="slip-summary">Bank <b>' + fmt(BANK) + '</b> · Staked <b>' + fmt(s.staked) +
      '</b> · Returned <b>' + fmt(s.returned) + '</b> · Balance <b>' + fmt(s.balance) + '</b>' +
      (s.pendingStake > 0 ? ' · <b>' + fmt(s.pendingStake) + '</b> riding on live bets' : '') +
      (mine ? '' : '<br><span class="help">Synced by share link — read-only here. Your own slip is under your name above.</span>') +
      '</div>';
    if (!bets.length) {
      html += '<div class="empty"><span class="serif">No bets yet</span>' +
        'Head to the Race Card and build a ticket — Win/Place/Show, exactas, doubles, pick sequences and parlays are all on the menu.</div>';
    }
    bets.slice().reverse().forEach(function (bet) {
      var st = E.settle(bet, dr);
      var c = E.cost(bet);
      var locked = betLocked(bet);
      html += '<div class="bet-card ' + st.status + '"><div class="desc">' + esc(describeBet(bet)) + '</div>' +
        '<div class="meta">' + esc(betKindLabel(bet)) + (bet.rebetOf ? ' · rebet-down' : '') +
        ' · Cost ' + fmt(c) + ' pts · ' + esc(st.note) + '</div>' +
        '<div class="row"><span class="status ' + st.status + '">' +
        (st.status === 'won' ? 'Won' : st.status === 'lost' ? 'Lost' : 'Live') + '</span>' +
        (st.status === 'won' ? '<span class="ret pos">Returned ' + fmt(st.ret) + ' pts</span>' : '') +
        '<span>';
      if (mine && !locked) {
        html += '<button type="button" class="mini-btn" data-act="bet-del" data-p="' + bet.id + '">Remove</button> ';
      }
      var rb = mine ? E.rebetInfo(bet, dr) : null;
      if (rb) {
        if (UI.rebetFor === bet.id) {
          html += '<span class="stake-row" style="display:inline-flex;margin:0">' +
            '<input type="number" min="1" step="1" value="' + UI.rebetStake + '" data-bind="rebet-stake" style="width:76px">' +
            '<button type="button" class="mini-btn rebet" data-act="rebet-go" data-p="' + bet.id + '">Place ' +
            esc(rb.label) + ' (' + fmt(E.cost({ type: 'multi', kind: rb.kind, legs: rb.legs, stakePer: UI.rebetStake })) + ' pts)</button>' +
            '<button type="button" class="mini-btn" data-act="rebet-cancel">Cancel</button></span>';
        } else {
          html += '<button type="button" class="mini-btn rebet" data-act="rebet-open" data-p="' + bet.id + '">' +
            '↻ Rebet as ' + esc(rb.label) + ' (R' + rb.startRace + '–R' + rb.endRace + ')</button>';
        }
      }
      html += '</span></div></div>';
    });
    html += '<div style="text-align:center;margin-top:14px">' +
      '<button type="button" class="btn btn-gold" data-act="share">Share My Slip</button></div>';
    el.innerHTML = html;
  }

  /* ------------------------------ Results view --------------------------- */
  function renderResults() {
    var el = document.getElementById('view-results');
    var day = DAY();
    var dr = RESULTS(day.id);
    var html = '<div class="day-head"><h2>Official Results</h2><p>' + esc(day.title) + ' · ' +
      esc(day.dateLabel) + '</p></div>';
    html += '<p class="help" style="text-align:center;max-width:560px;margin:0 auto 12px">' +
      'Honor system — either player can enter the official finish and the $2 payouts from the chart. ' +
      'Settlement everywhere (balances, slips, rebets) updates the moment results are saved.</p>';
    if (S.demo) {
      html += '<div style="text-align:center;margin-bottom:12px">' +
        '<button type="button" class="btn btn-gold" data-act="demo-results">Load Sample Results</button> ' +
        '<button type="button" class="btn btn-ghost" data-act="demo-results-clear">Clear Demo Results</button></div>';
    }
    day.races.forEach(function (race) {
      var key = raceKey(day.id, race.n);
      var res = E.resultFor(dr, race.n);
      html += '<article class="race' + (race.bc ? ' bc' : '') + '"><div class="race-head" style="cursor:default">' +
        '<div class="race-num">' + race.n + '</div>' +
        '<div><h3>' + esc(race.name) + (res ? ' <span class="badge final">Official</span>' : '') + '</h3>' +
        '<div class="detail">' + esc(race.postLabel) + ' · ' + esc(race.detail) + '</div></div></div>';
      if (res) {
        html += '<div class="result-line" style="margin-top:2px"><b>Finish:</b> ' +
          res.finish.map(function (n) { return esc(horseName(day.id, race.n, n)); }).join(' · ') + '<br>' +
          priceSummary(res) + '</div>';
        html += '<div style="padding:0 14px 12px;display:flex;gap:8px">' +
          '<button type="button" class="mini-btn" data-act="res-edit" data-p="' + key + '">Edit</button>' +
          '<button type="button" class="mini-btn" data-act="res-clear" data-p="' + key + '">Clear result</button></div>';
      } else {
        html += '<div style="padding:0 14px 12px">' +
          '<button type="button" class="mini-btn" data-act="res-edit" data-p="' + key + '">Enter result</button></div>';
      }
      if (UI.resEdit === key) html += renderResForm(day, race, res);
      html += '</article>';
    });
    el.innerHTML = html;
  }
  function priceSummary(res) {
    var bits = [];
    if (res.win) Object.keys(res.win).forEach(function (n) { bits.push('Win #' + n + ' ' + money(res.win[n])); });
    if (res.place) Object.keys(res.place).forEach(function (n) { bits.push('Place #' + n + ' ' + money(res.place[n])); });
    if (res.show) Object.keys(res.show).forEach(function (n) { bits.push('Show #' + n + ' ' + money(res.show[n])); });
    if (res.exacta != null) bits.push('Exacta ' + money(res.exacta));
    if (res.seq) Object.keys(res.seq).forEach(function (k) {
      bits.push(E.KIND_LABEL[k] + ' ' + money(res.seq[k]));
    });
    return bits.join(' · ');
  }
  function renderResForm(day, race, existing) {
    var key = raceKey(day.id, race.n);
    var stage = UI.resStage && UI.resStage.key === key ? UI.resStage : null;
    var finish = stage ? stage.finish : (existing ? existing.finish.slice() : []);
    var html = '<div class="res-form" style="padding:0 14px 14px">';
    html += '<label>Finish order — program numbers, best first (at least the top 4)</label>' +
      '<input type="text" inputmode="numeric" placeholder="e.g. 6, 1, 5, 4" data-bind="res-finish" value="' +
      esc(finish.join(', ')) + '">' +
      '<div class="stake-row"><button type="button" class="btn btn-green" data-act="res-set-finish" data-p="' + key + '">Set finish order</button></div>';
    if (stage) {
      var ex = existing || {};
      function val(map, n) { return map && map[n] != null ? map[n] : ''; }
      html += '<label>Win price ($2) — winner #' + finish[0] + '</label>' +
        '<input type="number" step="0.01" min="0" data-res-price="win" value="' + val(ex.win, finish[0]) + '">' +
        '<label>Place prices ($2) — 1st &amp; 2nd</label><div class="res-grid">' +
        '<input type="number" step="0.01" min="0" placeholder="#' + finish[0] + '" data-res-price="place1" value="' + val(ex.place, finish[0]) + '">' +
        '<input type="number" step="0.01" min="0" placeholder="#' + finish[1] + '" data-res-price="place2" value="' + val(ex.place, finish[1]) + '">' +
        '<span></span></div>' +
        '<label>Show prices ($2) — top 3</label><div class="res-grid">' +
        '<input type="number" step="0.01" min="0" placeholder="#' + finish[0] + '" data-res-price="show1" value="' + val(ex.show, finish[0]) + '">' +
        '<input type="number" step="0.01" min="0" placeholder="#' + finish[1] + '" data-res-price="show2" value="' + val(ex.show, finish[1]) + '">' +
        '<input type="number" step="0.01" min="0" placeholder="#' + finish[2] + '" data-res-price="show3" value="' + val(ex.show, finish[2]) + '">' +
        '</div>' +
        '<label>Exacta payout ($2) — official order</label>' +
        '<input type="number" step="0.01" min="0" data-res-price="exacta" value="' + (ex.exacta != null ? ex.exacta : '') + '">';
      var seqKinds = [];
      if (race.n >= 2) seqKinds.push('double');
      if (race.n >= 3) seqKinds.push('pick3');
      if (race.n >= 4) seqKinds.push('pick4');
      if (race.n >= 5) seqKinds.push('pick5');
      if (race.n >= 6) seqKinds.push('pick6');
      if (seqKinds.length) {
        html += '<label>Sequence payouts ($2) ending at this race</label><div class="res-grid">';
        seqKinds.forEach(function (k) {
          html += '<input type="number" step="0.01" min="0" placeholder="' + E.KIND_LABEL[k] + '" data-res-price="seq-' + k +
            '" value="' + (ex.seq && ex.seq[k] != null ? ex.seq[k] : '') + '">';
        });
        html += '</div>';
      }
      html += '<div class="stake-row"><button type="button" class="btn btn-gold" data-act="res-save" data-p="' + key + '">Save result &amp; settle</button>' +
        '<button type="button" class="btn btn-ghost" data-act="res-cancel">Cancel</button></div>';
    }
    html += '</div>';
    return html;
  }
  function collectResForm(key) {
    var pk = parseKey(key);
    var stage = UI.resStage;
    if (!stage || stage.key !== key) return null;
    var finish = stage.finish;
    function num(sel) {
      var inp = document.querySelector('[data-res-price="' + sel + '"]');
      if (!inp || inp.value === '') return null;
      var v = parseFloat(inp.value);
      return isFinite(v) ? v : null;
    }
    var res = { finish: finish, win: {}, place: {}, show: {}, exacta: num('exacta'), seq: {} };
    var w = num('win'); if (w != null) res.win[finish[0]] = w;
    var p1 = num('place1'); if (p1 != null) res.place[finish[0]] = p1;
    var p2 = num('place2'); if (p2 != null) res.place[finish[1]] = p2;
    var s1 = num('show1'); if (s1 != null) res.show[finish[0]] = s1;
    var s2 = num('show2'); if (s2 != null) res.show[finish[1]] = s2;
    var s3 = num('show3'); if (s3 != null) res.show[finish[2]] = s3;
    ['double', 'pick3', 'pick4', 'pick5', 'pick6'].forEach(function (k) {
      var v = num('seq-' + k);
      if (v != null) res.seq[k] = v;
    });
    if (res.exacta == null) delete res.exacta;
    return { day: pk.day, race: pk.race, res: res };
  }

  /* -------------------------------- How to ------------------------------- */
  function howToHtml() {
    return '<details class="howto"><summary>How to play</summary>' +
      '<p><b>The game.</b> You and Chandra each get <b>1,000 points per day</b> — fresh bank Saturday. ' +
      'Most points at the end of the weekend takes the Showdown. This is a points game; no real money moves.</p>' +
      '<p><b>Betting.</b> Tap a race, then <i>Bet this race</i>. <b>Win/Place/Show</b>: check any boxes, stake is per part ' +
      '(10 across the board = 30). <b>Exacta</b>: straight (exact order) or box (any order — cost multiplies by combinations). ' +
      '<b>Doubles &amp; Picks</b>: rolling sequences, one or more horses per leg, cost = stake per combination × combinations. ' +
      '<b>Win Parlay</b>: use the + Parlay button on any horse to chain win picks across the day; the return multiplies each winner\'s price.</p>' +
      '<p><b>Rebet-down.</b> If a Pick 4 dies in the first leg, your slip offers a one-tap <b>Rebet as Pick 3</b> with your surviving ' +
      'picks pre-loaded — down the ladder to a Double, just like re-firing at the window.</p>' +
      '<p><b>Odds.</b> Every horse shows its morning line and the latest "Now" odds from the data snapshot (time at the top of the card). ' +
      'Like the real track, your price is the <b>official final payout</b> — settlement uses the chart prices entered in Results.</p>' +
      '<p><b>Sharing.</b> Each of you plays on your own phone. Hit <b>Share My Slip</b>, send the link, and the other phone imports ' +
      'your bets and any results you have entered — scores stay in sync, Rivalite-style.</p>' +
      '<p><b>Locks.</b> Picks lock at each race\'s post time. Fields are placeholders until the <b>Oct 26 draw</b>; ' +
      'use <b>Demo Mode</b> to play-test everything beforehand.</p></details>';
  }

  /* ------------------------------- Rendering ----------------------------- */
  function renderAll() {
    renderControls();
    renderScoreboard();
    document.getElementById('view-card').hidden = S.view !== 'card';
    document.getElementById('view-seq').hidden = S.view !== 'seq';
    document.getElementById('view-slip').hidden = S.view !== 'slip';
    document.getElementById('view-results').hidden = S.view !== 'results';
    if (S.view === 'card') renderCard();
    if (S.view === 'seq') renderSeq();
    if (S.view === 'slip') renderSlip();
    if (S.view === 'results') renderResults();
    renderParlayTray();
  }

  /* -------------------------------- Events ------------------------------- */
  document.addEventListener('click', function (ev) {
    var nav = ev.target.closest('.bottomnav button');
    if (nav) {
      S.view = nav.getAttribute('data-view');
      save(); renderAll(); window.scrollTo(0, 0);
      return;
    }
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    var p = el.getAttribute('data-p');

    if (act === 'me') { S.me = p; S.slipPlayer = p; save(); renderAll(); }
    else if (act === 'day') { S.day = p; UI.expanded = null; save(); renderAll(); }
    else if (act === 'import-yes') { doImport(); }
    else if (act === 'import-no') {
      UI.pendingImport = null;
      document.getElementById('importSlot').innerHTML = '';
      try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) {}
    }
    else if (act === 'share') { doShare(); }
    else if (act === 'expand') {
      var wasOpen = UI.expanded === p;
      UI.expanded = wasOpen ? null : p;
      UI.wps.horse = null; UI.ex.picks = [];
      renderAll();
    }
    else if (act === 'tool') { UI.tool = p; renderAll(); }
    else if (act === 'horse') {
      if (!UI.expanded) return;
      var h = parseInt(el.getAttribute('data-h'), 10);
      if (UI.tool === 'wps') { UI.wps.horse = h; renderAll(); }
      else if (UI.tool === 'exacta') {
        var idx = UI.ex.picks.indexOf(h);
        if (idx >= 0) UI.ex.picks.splice(idx, 1);
        else if (UI.ex.mode === 'box') UI.ex.picks.push(h);
        else if (UI.ex.picks.length < 2) UI.ex.picks.push(h);
        else { toast('Straight exacta holds two horses — tap a pick to remove it.'); return; }
        renderAll();
      }
    }
    else if (act === 'parlay-add') {
      ev.stopPropagation();
      var pk = parseKey(p);
      parlayAdd(pk.day, pk.race, parseInt(el.getAttribute('data-h'), 10));
    }
    else if (act === 'parlay-del') {
      UI.parlay.legs.splice(parseInt(p, 10), 1);
      if (!UI.parlay.legs.length) UI.parlay.day = null;
      renderAll();
    }
    else if (act === 'parlay-clear') { UI.parlay = { day: null, legs: [], stake: 10 }; renderAll(); }
    else if (act === 'parlay-place') {
      var pb = { type: 'parlay', day: UI.parlay.day, legs: UI.parlay.legs.slice(), stake: UI.parlay.stake };
      if (tryAddBet(pb)) { UI.parlay = { day: null, legs: [], stake: 10 }; S.view = 'slip'; S.slipPlayer = S.me; }
      save(); renderAll();
    }
    else if (act === 'ex-mode') { UI.ex.mode = p; UI.ex.picks = []; renderAll(); }
    else if (act === 'ex-clear') { UI.ex.picks = []; renderAll(); }
    else if (act === 'add-wps') {
      var wk = parseKey(p);
      var parts = ['W', 'P', 'S'].filter(function (x) { return UI.wps.parts[x]; });
      if (tryAddBet({ type: 'wps', day: wk.day, race: wk.race, horse: UI.wps.horse, parts: parts, stakePer: UI.wps.stake })) {
        UI.wps.horse = null;
      }
      renderAll();
    }
    else if (act === 'add-exacta') {
      var xk = parseKey(p);
      if (tryAddBet({ type: 'exacta', day: xk.day, race: xk.race, mode: UI.ex.mode, picks: UI.ex.picks.slice(), stakePer: UI.ex.stake })) {
        UI.ex.picks = [];
      }
      renderAll();
    }
    else if (act === 'seq-start') { startSequence(p); }
    else if (act === 'seq-chip') {
      var li = parseInt(p, 10), hn = parseInt(el.getAttribute('data-h'), 10);
      var arr = UI.seqDraft.legs[li];
      var ix = arr.indexOf(hn);
      if (ix >= 0) arr.splice(ix, 1); else arr.push(hn);
      arr.sort(function (a, b) { return a - b; });
      renderAll();
    }
    else if (act === 'seq-cancel') { UI.seqDraft = null; S.view = 'card'; renderAll(); }
    else if (act === 'seq-place') {
      var d = UI.seqDraft;
      var bet = {
        type: 'multi', day: d.day, kind: d.kind, startRace: d.startRace,
        legs: d.legs.map(function (horses, i) { return { race: d.startRace + i, horses: horses.slice() }; }),
        stakePer: d.stakePer
      };
      if (tryAddBet(bet)) {
        UI.seqDraft = null; S.view = 'slip'; S.slipPlayer = S.me; save();
      }
      renderAll();
    }
    else if (act === 'slip-player') { S.slipPlayer = p; save(); renderAll(); }
    else if (act === 'bet-del') {
      var list = ALLBETS(S.me);
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === p) { list.splice(i, 1); break; }
      }
      save(); renderAll(); toast('Bet removed.');
    }
    else if (act === 'rebet-open') {
      UI.rebetFor = p;
      var bb = ALLBETS(S.slipPlayer).filter(function (b) { return b.id === p; })[0];
      UI.rebetStake = bb ? bb.stakePer : 2;
      renderAll();
    }
    else if (act === 'rebet-cancel') { UI.rebetFor = null; renderAll(); }
    else if (act === 'rebet-go') {
      var orig = ALLBETS(S.me).filter(function (b) { return b.id === p; })[0];
      if (orig) {
        var nb = E.makeRebet(orig, RESULTS(orig.day), UI.rebetStake, uid());
        if (nb) {
          if (tryAddBet(nb)) { UI.rebetFor = null; }
        } else {
          toast('That rebet is no longer available.');
        }
      }
      renderAll();
    }
    else if (act === 'res-edit') {
      UI.resEdit = p;
      var rk = parseKey(p);
      var existing = E.resultFor(RESULTS(rk.day), rk.race);
      UI.resStage = existing ? { key: p, finish: existing.finish.slice() } : null;
      renderAll();
    }
    else if (act === 'res-cancel') { UI.resEdit = null; UI.resStage = null; renderAll(); }
    else if (act === 'res-clear') {
      var ck = parseKey(p);
      delete S.modes[MODE()].results[ck.day][ck.race];
      delete S.modes[MODE()].results[ck.day][String(ck.race)];
      if (UI.resEdit === p) { UI.resEdit = null; UI.resStage = null; }
      save(); renderAll(); toast('Result cleared.');
    }
    else if (act === 'res-set-finish') {
      var inp = document.querySelector('[data-bind="res-finish"]');
      var nums = (inp ? inp.value : '').split(/[^0-9]+/).filter(Boolean).map(function (x) { return parseInt(x, 10); });
      if (nums.length < 3) { toast('Enter at least the top 3 finishers, e.g. 6, 1, 5, 4.'); return; }
      UI.resStage = { key: p, finish: nums };
      renderAll();
    }
    else if (act === 'res-save') {
      var got = collectResForm(p);
      if (!got) { toast('Set the finish order first.'); return; }
      S.modes[MODE()].results[got.day][got.race] = got.res;
      UI.resEdit = null; UI.resStage = null;
      save(); renderAll(); toast('Result saved — everything settled.');
    }
    else if (act === 'demo-results') {
      S.modes.demo.results = JSON.parse(JSON.stringify(window.BC_DEMO.results));
      save(); renderAll(); toast('Sample results loaded — check the slips!');
    }
    else if (act === 'demo-results-clear') {
      S.modes.demo.results = { fri: {}, sat: {} };
      save(); renderAll(); toast('Demo results cleared.');
    }
  });

  document.getElementById('demoBtn').addEventListener('click', function () {
    S.demo = !S.demo;
    UI.expanded = null; UI.parlay = { day: null, legs: [], stake: 10 };
    UI.seqDraft = null; UI.resEdit = null; UI.resStage = null;
    if (S.view === 'seq') S.view = 'card';
    save(); renderAll();
    toast(S.demo ? 'Demo mode on — sample fields, sample results.' : 'Back to the real card.');
  });
  document.getElementById('shareBtn').addEventListener('click', doShare);

  document.addEventListener('input', function (ev) {
    var b = ev.target.getAttribute && ev.target.getAttribute('data-bind');
    if (!b) return;
    var v = parseFloat(ev.target.value);
    if (b === 'wps-stake') {
      UI.wps.stake = isFinite(v) ? v : 0;
      var parts = (UI.wps.parts.W ? 1 : 0) + (UI.wps.parts.P ? 1 : 0) + (UI.wps.parts.S ? 1 : 0);
      var c = document.getElementById('wpsCost');
      if (c) c.textContent = 'Total: ' + fmt(UI.wps.stake * parts) + ' pts';
    }
    if (b === 'ex-stake') {
      UI.ex.stake = isFinite(v) ? v : 0;
      var combos = UI.ex.mode === 'box' ? UI.ex.picks.length * (UI.ex.picks.length - 1) : 1;
      var c2 = document.getElementById('exCost');
      if (c2) c2.textContent = combos + ' combo' + (combos === 1 ? '' : 's') + ' · Total: ' + fmt(UI.ex.stake * combos) + ' pts';
    }
    if (b === 'parlay-stake') UI.parlay.stake = isFinite(v) ? v : 0;
    if (b === 'seq-stake' && UI.seqDraft) {
      UI.seqDraft.stakePer = isFinite(v) ? v : 0;
      var combos2 = UI.seqDraft.legs.reduce(function (acc, l) { return acc * l.length; }, 1);
      var complete = UI.seqDraft.legs.every(function (l) { return l.length > 0; });
      var c3 = document.getElementById('seqCost');
      if (c3) c3.textContent = complete
        ? combos2 + ' combos · Total: ' + fmt(combos2 * UI.seqDraft.stakePer) + ' pts'
        : 'Pick at least one horse in every leg';
    }
    if (b === 'rebet-stake') UI.rebetStake = isFinite(v) ? v : 0;
  });
  document.addEventListener('change', function (ev) {
    var b = ev.target.getAttribute && ev.target.getAttribute('data-bind');
    if (b === 'wps-part') {
      UI.wps.parts[ev.target.getAttribute('data-p')] = ev.target.checked;
      var parts = (UI.wps.parts.W ? 1 : 0) + (UI.wps.parts.P ? 1 : 0) + (UI.wps.parts.S ? 1 : 0);
      var c = document.getElementById('wpsCost');
      if (c) c.textContent = 'Total: ' + fmt(UI.wps.stake * parts) + ' pts';
    }
  });

  /* --------------------------------- Boot -------------------------------- */
  load();
  if (!PLAYERS.some(function (p) { return p.id === S.me; })) S.me = 'terry';
  if (!PLAYERS.some(function (p) { return p.id === S.slipPlayer; })) S.slipPlayer = S.me;
  checkHashImport();
  renderAll();
})();
