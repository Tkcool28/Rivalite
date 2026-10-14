#!/usr/bin/env python3
"""Fetch NHL scores + player stats for Rivalite games, write scores.json.
Only writes when something changed. Safe to run on a schedule."""
import json, urllib.request, datetime, os

GAME_IDS = [2026020106, 2026020107]  # MTL@WSH, DAL@COL — Oct 14 2026
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scores.json")

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "rivalite-scores/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def main():
    games = []
    for gid in GAME_IDS:
        try:
            d = get(f"https://api-web.nhle.com/v1/gamecenter/{gid}/boxscore")
        except Exception as e:
            print(f"game {gid}: fetch failed: {e}")
            return  # keep old file on failure
        gs = d.get("gameState", "FUT")
        state = "final" if gs == "OFF" else ("live" if gs not in ("FUT", "PRE") else "scheduled")
        players = {}
        for side in ("awayTeam", "homeTeam"):
            for grp in ("forwards", "defense"):
                for p in d.get("playerByGameStats", {}).get(side, {}).get(grp, []):
                    nm = (p.get("name") or {}).get("default", "")
                    if nm:
                        players[nm] = {"sog": p.get("sog", 0), "g": p.get("goals", 0), "pts": p.get("points", 0)}
        pd = d.get("periodDescriptor") or {}
        games.append({
            "id": gid, "state": state,
            "as": d.get("awayTeam", {}).get("score", 0),
            "hs": d.get("homeTeam", {}).get("score", 0),
            "period": str(pd.get("number", "")) if state == "live" else "",
            "clock": (d.get("clock") or {}).get("timeRemaining", "") if state == "live" else "",
            "players": players,
        })
    out = {"updated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "games": games}
    new = json.dumps(out, sort_keys=True)
    old = ""
    if os.path.exists(OUT):
        with open(OUT) as f:
            old = json.dumps(json.loads(f.read()), sort_keys=True)
    if new != old:
        with open(OUT, "w") as f:
            json.dump(out, f)
        print("scores.json updated")
    else:
        print("no change")

if __name__ == "__main__":
    main()
