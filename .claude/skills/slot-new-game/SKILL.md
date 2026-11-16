---
name: slot-new-game
description: Start a new slot game from this template repo. Use when Darshan says "start a new game", "new slot from the template", or a freshly created repo still shows the Starter Slot sample.
---

# Start a new slot game from the template

Follow `NEW_GAME.md`; this is the Claude side of it.

1. **Check the input pack.** `docs/` should hold the new game's specs (filled copies of `docs/templates/`), `art/` the art named by asset ID. List what is there, what is missing, and the open questions. If there are no specs at all, ask for a reference game or rules before building; never invent maths.
2. **Identity.** Set `CONFIG.title` and `CONFIG.texts` (brand line, loading messages, retrigger title) in `src/config.js`. Rename the README title and replace the sample sections (mechanics, maths, decisions). Start `CHANGELOG.md` with a "started from slot-starter-template" entry.
3. **Specs into config.** Grid, lines, paytable (keep the unit the spec uses), scatter pays, free spins, max win, bets, banner thresholds, timings. Mark every value not in the specs ASSUMED or TUNED.
4. **Features.** If they match the sample (line wins, Scatter as Wild + Scatter, free spins with an expanding symbol), keep the engine. Otherwise use `slot-prototype-from-spec` to add new step types to `src/engine.js`, presentation in `src/game.js`, outcomes in `src/director.js`, cheats and scenarios in `src/cheats.js`, and checks in `tools/edge-cases.py`. Remove sample features the game doesn't have.
5. **Art.** Run `slot-asset-integration`: `python3 tools/asset-pipeline/import_art.py`, then fit `CONFIG.window` to the background's reel area, and the symbol boxes (`fit` in `assets/manifest.js`).
6. **Tune.** `node tools/simulate.js 2000000` with 3 seeds; adjust only TUNED values until the target RTP is inside the run-to-run spread.
7. **Finish** with `slot-project-sync` (checks, docs, single file, `HANDOFF.md`, push). Report decisions, gaps and open questions plainly.
