# Starting a new game

About an hour of your time; the rest is Claude's. The `slot-new-game` skill runs these steps.

## 1. Make the repo (you, 1 minute)
GitHub → `fxdarshan/slot-starter-template` → **Use this template** → **Create a new repository**, named like `02_<Game_Name>`. Public or private, both work.

## 2. Fill the input pack (you)
- **Specs in `docs/`:** copy the files from `docs/templates/` over the sample docs and fill them in. The minimum is a GDD with a reference game link, or rules plus a pay table. Gaps go under "Open questions"; Claude doesn't invent them.
- **Art in `art/`:** name each file after its asset ID (list in `docs/game-asset-specification.md`), for example `art/symbols/sym_00_idle.png` or `art/backgrounds/bg_base_main.png`. Mockups with symbols baked in are fine; say so.
- Commit and push (or upload on GitHub).

## 3. Build (Claude)
Ask: "Build the game from the docs and art" (Claude Code at home, or a claude.ai chat Project with the repo). Claude:
1. reads `docs/`, sets `src/config.js` (title, grid, lines, pays, features, timings, `CONFIG.window` to fit the background);
2. changes `src/engine.js` and `src/game.js` only where the features differ from the sample;
3. runs `tools/asset-pipeline/import_art.py`;
4. tunes the weights with `tools/simulate.js` to the target RTP;
5. checks: edge cases, every scenario, screenshots;
6. writes the docs and README decisions, builds `dist/`, updates `HANDOFF.md`, pushes.

## 4. Review (you)
Open the single file from `dist/` or the preview link. Answer the open questions in the GDD or in `HANDOFF.md`, then ask for the next round.

## What to change for a game that isn't book-style
The engine's steps (`win`, `scatter`, `expand`) are the sample's features. A different feature (cascades, multipliers, hold-and-win) is a new step type in `src/engine.js` plus a `show…` function in `src/game.js`, new director outcomes and cheats, and new edge cases. Keep the split: maths in the engine, drawing in the game.
