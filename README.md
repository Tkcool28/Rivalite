# RIVALITE — Parlay Showdown

2-player NHL parlay game for Terry & Chandra. Wed Oct 14, 2026: MTL @ WSH, DAL @ COL.

## How it plays
- Each player gets **1000 points** and must stake **all of them** across their tickets.
- **Parlays**: 2–5 legs from one game, up to 3 per game.
- **Round robins**: 2–5 legs across both games, by 2s or 3s, up to 2.
- Lines are **locked** (DraftKings, morning of) in `lines.js` — they never move.
- Tap lines → build tickets → spend all 1000 pts → **Share My Slip** → text the link.
- Opening an opponent's link loads their slip for a head-to-head board.
- Scores + player stats auto-update every ~5 min via the `scores.yml` workflow.
  If that fails, the **Commissioner** panel allows manual score entry and per-leg overrides.

## Setup
1. Push to `main`.
2. Repo Settings → Pages → Deploy from branch → `main` → `/ (root)`.
3. Play at `https://tkcool28.github.io/Rivalite/`.

## Files
- `index.html` / `app.js` / `lines.js` — the game (static, no backend).
- `scores.json` — live scores + player stats (auto-updated).
- `update-scores.py` + `.github/workflows/scores.yml` — score updater (GitHub Actions cron).
- `assets/` — player avatars.

To retire after game night: disable the workflow (Actions → Update NHL scores → Disable).
