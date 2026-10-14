/* RIVALITE app logic */
"use strict";

/* ---------- odds math ---------- */
const amToDec = o => o > 0 ? 1 + o / 100 : 1 + 100 / (-o);
const decToAm = d => d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
const fmtAm = o => (o > 0 ? "+" : "") + o;

/* ---------- state ---------- */
const BANK = 1000;
const store = {
  get(k, d) { try { const v = localStorage.getItem("rivalite_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("rivalite_" + k, JSON.stringify(v)); } catch (e) {} }
};
let me = store.get("me", "terry");
let slips = store.get("slips", { terry: [], chandra: [] });
let manual = store.get("manual", { scores: {}, legs: {} }); // scores:{gIdx:{hs,as}} legs:{lineIdx:'win'|'loss'|'push'}
let opp = null;          // opponent slip from URL
let scores = null;       // from scores.json
let ticket = [];         // line indexes being built

const NAMES = { terry: "TERRY", chandra: "CHANDRA" };
const mySlip = () => slips[me];
const spent = s => s.reduce((t, p) => t + p.stake, 0);
const remaining = () => BANK - spent(mySlip());

/* ---------- URL share ---------- */
function encodeSlip(name, plays) {
  const j = JSON.stringify({ n: name, p: plays.map(p => [p.t, p.g, p.legs, p.stake, p.by || 0]) });
  return btoa(unescape(encodeURIComponent(j))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeSlip(s) {
  try {
    const b = s.replace(/-/g, "+").replace(/_/g, "/");
    const j = decodeURIComponent(escape(atob(b)));
    const o = JSON.parse(j);
    if (!o || typeof o.n !== "string" || !Array.isArray(o.p)) return null;
    const plays = [];
    for (const a of o.p) {
      if (!Array.isArray(a) || a.length < 4) return null;
      const [t, g, legs, stake, by] = a;
      if (!["p", "r"].includes(t) || !Array.isArray(legs) || legs.length < 2 || legs.length > 5) return null;
      if (!legs.every(i => Number.isInteger(i) && i >= 0 && i < LINES.length)) return null;
      if (!Number.isInteger(stake) || stake <= 0 || stake > BANK) return null;
      if (t === "p" && (g !== 0 && g !== 1)) return null;
      if (t === "p" && !legs.every(i => LINES[i].g === g)) return null;
      const play = { t, g: t === "p" ? g : null, legs: [...legs], stake, by: t === "r" ? (by === 3 ? 3 : 2) : null };
      plays.push(play);
    }
    if (spent(plays) > BANK) return null;
    return { n: o.n.toLowerCase(), plays };
  } catch (e) { return null; }
}

/* ---------- game data (auto + manual) ---------- */
function gameData(gi) {
  const auto = scores && scores.games && scores.games[gi];
  const man = manual.scores[gi];
  if (auto && auto.state !== "scheduled") return auto;
  if (man && man.hs != null) return { state: "final-manual", hs: man.hs, as: man.as, players: {} };
  return { state: "scheduled", hs: 0, as: 0, players: {} };
}

/* ---------- grading ---------- */
function gradeLeg(li) {
  const line = LINES[li];
  const ov = manual.legs[li];
  if (ov === "win" || ov === "loss" || ov === "push") return ov;
  const g = gameData(line.g);
  if (g.state === "scheduled") return "pending";
  const hs = g.hs, as = g.as, s = line.sel;
  switch (line.mkt) {
    case "ml": {
      if (hs === as) return "push";
      const w = hs > as ? "home" : "away";
      return s.team === w ? "win" : "loss";
    }
    case "spread": {
      const m = (s.team === "home" ? hs - as : as - hs) + s.line;
      return m > 0 ? "win" : (m < 0 ? "loss" : "push");
    }
    case "total": {
      const t = hs + as;
      const m = s.side === "over" ? t - s.line : s.line - t;
      return m > 0 ? "win" : (m < 0 ? "loss" : "push");
    }
    case "sog": case "points": {
      const p = (g.players || {})[s.player];
      if (!p) return "pending";
      const v = line.mkt === "sog" ? p.sog : p.pts;
      if (v == null) return "pending";
      const m = s.side === "over" ? v - s.line : s.line - v;
      return m > 0 ? "win" : (m < 0 ? "loss" : "push");
    }
    case "atg": {
      const p = (g.players || {})[s.player];
      if (!p || p.g == null) return "pending";
      return p.g >= 1 ? "win" : "loss";
    }
  }
  return "pending";
}

function gradeTicket(legs, stake) {
  const ls = legs.map(i => ({ i, line: LINES[i], st: gradeLeg(i) }));
  if (ls.some(l => l.st === "pending")) return { status: "pending", legs: ls, ret: 0 };
  const live = ls.filter(l => l.st !== "push");
  if (!live.length) return { status: "push", legs: ls, ret: stake, odds: 100 };
  if (live.some(l => l.st === "loss")) return { status: "loss", legs: ls, ret: 0 };
  const dec = live.reduce((d, l) => d * amToDec(l.line.odds), 1);
  return { status: "win", legs: ls, ret: Math.round(stake * dec), odds: decToAm(dec) };
}
function combos(arr, k) {
  const out = [];
  (function rec(s, r, c) {
    if (r === 0) return out.push([...c]);
    for (let i = s; i <= arr.length - r; i++) { c.push(arr[i]); rec(i + 1, r - 1, c); c.pop(); }
  })(0, k, []);
  return out;
}
function gradePlay(p) {
  if (p.t === "p") return { ...gradeTicket(p.legs, p.stake), kind: "parlay" };
  const cs = combos(p.legs, p.by);
  const per = p.stake / cs.length;
  let ret = 0, w = 0, l = 0, pu = 0, pend = 0;
  for (const c of cs) {
    const g = gradeTicket(c, per);
    ret += g.ret;
    if (g.status === "win") w++; else if (g.status === "loss") l++;
    else if (g.status === "push") pu++; else pend++;
  }
  ret = Math.round(ret);
  const status = pend ? "pending" : (l === cs.length ? "loss" : (w ? "win" : "push"));
  return { status, kind: "rr", ret, w, l, pu, pend, n: cs.length };
}
const playOdds = p => {
  if (p.t !== "p") return null;
  const dec = p.legs.reduce((d, i) => d * amToDec(LINES[i].odds), 1);
  return decToAm(dec);
};

/* ---------- rendering: games & lines ---------- */
function renderGames() {
  const el = document.getElementById("games");
  el.innerHTML = "";
  GAMES.forEach((gm, gi) => {
    const g = gameData(gi);
    const d = document.createElement("div");
    d.className = "game";
    const stateTxt = g.state === "scheduled" ? "⏳ " + gm.time
      : g.state === "live" ? `🔴 LIVE ${gm.away} ${g.as} — ${g.hs} ${gm.home} ${g.period || ""} ${g.clock || ""}`
      : `🏁 FINAL ${gm.away} ${g.as} — ${g.hs} ${gm.home}` + (g.state === "final-manual" ? " (manual)" : "");
    d.innerHTML = `<div class="gt">GAME ${gi + 1}: ${gm.away} ${gm.awayName} @ ${gm.home} ${gm.homeName} <span class="tm">• ${gm.time}</span></div>
      <div class="sc">${stateTxt}</div>`;
    MKT_ORDER.forEach(m => {
      const ls = LINES.map((l, i) => ({ l, i })).filter(x => x.l.g === gi && x.l.mkt === m);
      if (!ls.length) return;
      const md = document.createElement("div");
      md.className = "mkt";
      md.innerHTML = `<div class="mh">▸ ${MKT_LABEL[m]}</div>`;
      const lw = document.createElement("div");
      lw.className = "lines";
      ls.forEach(({ l, i }) => {
        const b = document.createElement("button");
        b.className = "line" + (ticket.includes(i) ? " sel" : "");
        b.innerHTML = `${l.label} <small>${fmtAm(l.odds)}</small>`;
        b.onclick = () => toggleLeg(i);
        lw.appendChild(b);
      });
      md.appendChild(lw);
      d.appendChild(md);
    });
    el.appendChild(d);
  });
  const st = document.getElementById("scorestatus");
  if (scores && scores.games) {
    const live = scores.games.some(g => g.state === "live"), fin = scores.games.every(g => g.state === "final");
    st.textContent = "— SCORES: " + (fin ? "ALL FINAL" : live ? "LIVE" : "PREGAME") + (scores.updated ? " (" + scores.updated.slice(11, 16) + " UTC)" : "");
  }
}

/* ---------- builder ---------- */
function builderMode() { return document.getElementById("b-type").value; }
function toggleLeg(i) {
  const mode = builderMode();
  const line = LINES[i];
  if (ticket.includes(i)) { ticket = ticket.filter(x => x !== i); }
  else {
    if (ticket.length >= 5) return;
    if (mode === "parlay") {
      const g = +document.getElementById("b-game").value;
      if (line.g !== g) return; // parlay: one game only
      if (ticket.length && LINES[ticket[0]].g !== g) ticket = [];
    }
    ticket.push(i);
  }
  renderAll();
}
function renderBuilder() {
  const mode = builderMode();
  document.getElementById("b-gamelbl").classList.toggle("hidden", mode !== "parlay");
  document.getElementById("b-game").classList.toggle("hidden", mode !== "parlay");
  document.getElementById("b-bylbl").classList.toggle("hidden", mode !== "rr");
  document.getElementById("b-by").classList.toggle("hidden", mode !== "rr");
  const tk = document.getElementById("ticket");
  tk.innerHTML = ticket.length ? "" : '<div class="note">No legs yet — tap lines above.</div>';
  ticket.forEach(i => {
    const l = LINES[i];
    const r = document.createElement("div");
    r.className = "tleg";
    r.innerHTML = `<span>${GAMES[l.g].away}@${GAMES[l.g].home} — ${l.label} <b style="color:var(--yel)">${fmtAm(l.odds)}</b></span><button data-i="${i}">✕</button>`;
    r.querySelector("button").onclick = e => { ticket = ticket.filter(x => x !== +e.target.dataset.i); renderAll(); };
    tk.appendChild(r);
  });
  const od = document.getElementById("tickodds");
  if (ticket.length >= 2) {
    if (mode === "parlay") {
      const dec = ticket.reduce((d, i) => d * amToDec(LINES[i].odds), 1);
      od.textContent = `PARLAY ${fmtAm(decToAm(dec))}  •  PAYS ${dec.toFixed(2)}x`;
    } else {
      const by = +document.getElementById("b-by").value;
      if (ticket.length >= by) {
        const n = combos(ticket, by).length;
        od.textContent = `RR BY ${by}s: ${n} COMBO${n > 1 ? "S" : ""}`;
      } else od.textContent = `NEED ${by} LEGS FOR BY ${by}s`;
    }
  } else od.textContent = ticket.length ? "ADD AT LEAST 2 LEGS" : "";
}
function addTicket() {
  const mode = builderMode();
  const slip = mySlip();
  const stake = Math.floor(+document.getElementById("b-stake").value);
  const rem = remaining();
  if (ticket.length < 2 || ticket.length > 5) return alert("Ticket needs 2–5 legs.");
  if (!stake || stake < 1) return alert("Enter a stake.");
  if (stake > rem) return alert(`Only ${rem} pts remaining.`);
  if (mode === "parlay") {
    const g = +document.getElementById("b-game").value;
    if (slip.filter(p => p.t === "p" && p.g === g).length >= 3) return alert("Max 3 parlays per game.");
    slip.push({ t: "p", g, legs: [...ticket], stake, by: null });
  } else {
    if (slip.filter(p => p.t === "r").length >= 2) return alert("Max 2 round robins.");
    const by = +document.getElementById("b-by").value;
    if (ticket.length < by) return alert(`Round robin by ${by}s needs at least ${by} legs.`);
    const n = combos(ticket, by).length;
    if (stake % n !== 0) return alert(`RR stake must split evenly across ${n} combos (try ${(Math.floor(stake / n) * n) || n}).`);
    slip.push({ t: "r", g: null, legs: [...ticket], stake, by });
  }
  ticket = [];
  saveSlips(); renderAll();
}

/* ---------- slip rendering ---------- */
function playHTML(p, pi, editable) {
  const g = gradePlay(p);
  const title = p.t === "p" ? `PARLAY — ${GAMES[p.g].away} @ ${GAMES[p.g].home}` : `ROUND ROBIN BY ${p.by}s`;
  const odds = p.t === "p" ? fmtAm(playOdds(p)) : `${g.n} combos × ${p.stake / g.n} pts`;
  const stCls = { win: "win", loss: "loss", push: "push", pending: "live" }[g.status];
  const stTxt = { win: `WON +${g.ret}`, loss: "LOST", push: `PUSH +${g.ret}`, pending: "PENDING" }[g.status];
  let legs = "";
  if (p.t === "p") {
    legs = g.legs.map(l => `<div class="pleg">${l.line.label} <b>${fmtAm(l.line.odds)}</b><span class="st ${l.st === "win" ? "win" : l.st === "loss" ? "loss" : l.st === "push" ? "push" : "live"}">${l.st.toUpperCase()}</span></div>`).join("");
  } else {
    legs = p.legs.map(i => `<div class="pleg">${LINES[i].label} <b>${fmtAm(LINES[i].odds)}</b></div>`).join("")
      + `<div class="pleg" style="color:var(--cyan)">combos: ${g.w}W-${g.l}L-${g.pu}P${g.pend ? ` (${g.pend} pending)` : ""}</div>`;
  }
  return `<div class="play"><div class="ph"><span class="pt">${title}</span>${editable ? `<button class="del" data-pi="${pi}">✕</button>` : ""}</div>
    <div class="podd">${odds} • STAKE ${p.stake}</div>${legs}
    <div class="pleg"><b>RESULT:</b> <span class="st ${stCls}">${stTxt}</span></div></div>`;
}
function renderSlip() {
  document.getElementById("slipname").textContent = NAMES[me];
  const el = document.getElementById("slip");
  const slip = mySlip();
  el.innerHTML = slip.length ? "" : '<div class="note">No tickets yet. Build above — you must spend all 1000 pts.</div>';
  slip.forEach((p, pi) => { el.insertAdjacentHTML("beforeend", playHTML(p, pi, true)); });
  el.querySelectorAll(".del").forEach(b => b.onclick = e => {
    slips[me].splice(+e.target.dataset.pi, 1); saveSlips(); renderAll();
  });
  const rem = remaining();
  const pr = document.getElementById("prem");
  pr.textContent = "REMAINING: " + rem;
  pr.classList.toggle("zero", rem === 0);
  const sh = document.getElementById("sharebtn");
  sh.disabled = !(rem === 0 && slip.length);
  sh.textContent = rem === 0 && slip.length ? "⚡ SHARE MY SLIP ⚡" : "SHARE MY SLIP";
}
function renderOpp() {
  const p = document.getElementById("panel-opp");
  if (!opp) { p.classList.add("hidden"); return; }
  p.classList.remove("hidden");
  const isMe = opp.n === me;
  document.getElementById("oppname").textContent = (opp.n === "terry" ? "TERRY" : opp.n === "chandra" ? "CHANDRA" : opp.n.toUpperCase());
  const el = document.getElementById("oppslip");
  el.innerHTML = "";
  if (isMe) {
    el.innerHTML = '<div class="note">This is YOUR OWN share link (opened on this device). Your slip is above.</div>';
    document.getElementById("oppnote").textContent = "";
    return;
  }
  opp.plays.forEach(pl => { el.insertAdjacentHTML("beforeend", playHTML(pl, 0, false)); });
  const sp = spent(opp.plays);
  document.getElementById("oppnote").textContent = `Staked ${sp} / 1000 pts${sp < 1000 ? " — not all points used!" : " — fully staked ✓"}`;
}

/* ---------- showdown board ---------- */
function totals(slip) {
  let ret = 0, pend = 0, n = slip.length;
  slip.forEach(p => { const g = gradePlay(p); ret += g.ret; if (g.status === "pending") pend++; });
  return { ret, pend, n };
}
function renderBoard() {
  const el = document.getElementById("board");
  const mt = totals(mySlip());
  let html = `<table class="board"><tr><th></th><th>${NAMES[me]} (YOU)</th>${opp && opp.n !== me ? `<th>${opp.n.toUpperCase()}</th>` : `<th>???</th>`}</tr>
    <tr><td>TICKETS</td><td>${mt.n}</td><td>${opp && opp.n !== me ? opp.plays.length : "—"}</td></tr>
    <tr><td>STAKED</td><td>${spent(mySlip())}</td><td>${opp && opp.n !== me ? spent(opp.plays) : "—"}</td></tr>
    <tr><td>RETURNED</td><td style="color:var(--yel)">${mt.ret}${mt.pend ? ` (${mt.pend} pend)` : ""}</td>`;
  let winHtml = "";
  if (opp && opp.n !== me) {
    const ot = totals(opp.plays);
    html += `<td style="color:var(--yel)">${ot.ret}${ot.pend ? ` (${ot.pend} pend)` : ""}</td></tr></table>`;
    const meDone = mt.pend === 0, oDone = ot.pend === 0;
    if (meDone && oDone && mt.n && ot.n) {
      if (mt.ret > ot.ret) winHtml = `<div class="winner">🏆 ${NAMES[me]} WINS 🏆<br><span style="font-size:11px">${mt.ret} PTS vs ${ot.ret} PTS</span></div>`;
      else if (ot.ret > mt.ret) winHtml = `<div class="winner">🏆 ${opp.n.toUpperCase()} WINS 🏆<br><span style="font-size:11px">${ot.ret} PTS vs ${mt.ret} PTS</span></div>`;
      else winHtml = `<div class="winner">🤝 TIE GAME 🤝<br><span style="font-size:11px">${mt.ret} PTS EACH</span></div>`;
    } else {
      winHtml = `<div class="note" style="text-align:center">Games in progress — board settles when all legs are final.</div>`;
    }
  } else {
    html += `<td>—</td></tr></table><div class="note" style="text-align:center">Open your opponent's share link to load their slip for a head-to-head board.</div>`;
  }
  el.innerHTML = winHtml + html;
  const hdrPts = k => {
    const t = totals(slips[k]);
    // pre-game (nothing decided): show the bank; once legs decide, show returned
    return (t.n === 0 || t.pend === t.n) ? BANK : t.ret;
  };
  document.getElementById("pts-terry").textContent = hdrPts("terry") + " PTS";
  document.getElementById("pts-chandra").textContent = hdrPts("chandra") + " PTS";
}

/* ---------- commissioner ---------- */
function renderComm() {
  const el = document.getElementById("commgames");
  el.innerHTML = "";
  GAMES.forEach((gm, gi) => {
    const man = manual.scores[gi] || {};
    const d = document.createElement("div");
    d.className = "comm";
    d.innerHTML = `<b style="font-size:11px">${gm.away} @ ${gm.home}</b> — final:
      <input type="number" id="cm-a${gi}" placeholder="${gm.away}" value="${man.as ?? ""}" min="0" style="width:56px">
      <input type="number" id="cm-h${gi}" placeholder="${gm.home}" value="${man.hs ?? ""}" min="0" style="width:56px">
      <button class="pbtn" id="cm-s${gi}" style="font-size:9px;padding:8px">SET</button>
      <button class="pbtn" id="cm-c${gi}" style="font-size:9px;padding:8px">CLR</button>`;
    el.appendChild(d);
    d.querySelector(`#cm-s${gi}`).onclick = () => {
      const a = +d.querySelector(`#cm-a${gi}`).value, h = +d.querySelector(`#cm-h${gi}`).value;
      if (isNaN(a) || isNaN(h)) return alert("Enter both scores.");
      manual.scores[gi] = { as: a, hs: h }; store.set("manual", manual); renderAll();
    };
    d.querySelector(`#cm-c${gi}`).onclick = () => { delete manual.scores[gi]; store.set("manual", manual); renderAll(); };
  });
  // player-prop leg overrides
  const props = LINES.map((l, i) => ({ l, i })).filter(x => ["sog", "points", "atg"].includes(x.l.mkt));
  if (props.length) {
    const h = document.createElement("h3");
    h.className = "sect"; h.textContent = "PLAYER-PROP OVERRIDES (tap to cycle AUTO→W→L→P)";
    el.appendChild(h);
    const w = document.createElement("div"); w.className = "lines";
    props.forEach(({ l, i }) => {
      const b = document.createElement("button");
      const v = manual.legs[i] || "auto";
      b.className = "line" + (v !== "auto" ? " sel" : "");
      b.innerHTML = `${l.label} <small>${v.toUpperCase()}</small>`;
      b.onclick = () => {
        const nx = { auto: "win", win: "loss", loss: "push", push: "auto" }[v];
        if (nx === "auto") delete manual.legs[i]; else manual.legs[i] = nx;
        store.set("manual", manual); renderAll();
      };
      w.appendChild(b);
    });
    el.appendChild(w);
  }
}

/* ---------- share ---------- */
function share() {
  const url = location.origin + location.pathname + "?s=" + encodeSlip(me, mySlip());
  const fallback = () => prompt("Copy your share link and text it to your opponent:", url);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      document.getElementById("sharebtn").textContent = "✓ LINK COPIED — TEXT IT!";
      setTimeout(renderSlip, 3000);
    }).catch(fallback);
  } else fallback();
}

/* ---------- scores polling ---------- */
async function pollScores() {
  try {
    const r = await fetch("scores.json?t=" + Date.now());
    if (r.ok) { scores = await r.json(); renderGames(); renderSlip(); renderOpp(); renderBoard(); tick(); }
  } catch (e) {}
}
function tick() {
  const t = document.getElementById("ticker");
  let s = "WELCOME TO RIVALITE ★ SPEND ALL 1000 POINTS ★ ";
  if (scores && scores.games) scores.games.forEach((g, i) => {
    if (g.state === "live") s += `🔴 LIVE: ${GAMES[i].away} ${g.as} — ${g.hs} ${GAMES[i].home} ★ `;
    else if (g.state === "final") s += `🏁 FINAL: ${GAMES[i].away} ${g.as} — ${g.hs} ${GAMES[i].home} ★ `;
  });
  t.textContent = s + "MAY THE BEST GAMER WIN ★ ";
}

/* ---------- init ---------- */
function saveSlips() { store.set("slips", slips); }
function renderAll() { renderGames(); renderBuilder(); renderSlip(); renderOpp(); renderBoard(); renderComm(); }
function init() {
  document.getElementById("lockline").textContent = LOCK_LABEL;
  document.getElementById("locktime2").textContent = "9:35 AM MDT";
  const gs = document.getElementById("b-game");
  GAMES.forEach((g, i) => { const o = document.createElement("option"); o.value = i; o.textContent = `GAME ${i + 1}: ${g.away} @ ${g.home}`; gs.appendChild(o); });
  const setMe = m => { me = m; ticket = []; store.set("me", m); syncMe(); renderAll(); };
  const syncMe = () => {
    document.getElementById("btn-terry").className = "pbtn" + (me === "terry" ? " on1" : "");
    document.getElementById("btn-chandra").className = "pbtn" + (me === "chandra" ? " on2" : "");
  };
  document.getElementById("btn-terry").onclick = () => setMe("terry");
  document.getElementById("btn-chandra").onclick = () => setMe("chandra");
  document.getElementById("b-type").onchange = () => { ticket = []; renderAll(); };
  document.getElementById("b-game").onchange = () => { ticket = []; renderAll(); };
  document.getElementById("b-by").onchange = renderBuilder;
  document.getElementById("b-add").onclick = addTicket;
  document.getElementById("b-clear").onclick = () => { ticket = []; renderAll(); };
  document.getElementById("sharebtn").onclick = share;
  const q = new URLSearchParams(location.search).get("s");
  if (q) opp = decodeSlip(q);
  syncMe(); renderAll(); pollScores();
  setInterval(pollScores, 60000);
}
document.addEventListener("DOMContentLoaded", init);
