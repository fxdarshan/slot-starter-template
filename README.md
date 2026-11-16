# Slot Starter Template

A ready-to-run HTML5 slot prototype to start every new game from. It ships with a working sample game, **Starter Slot**: book-style, 5×3, 10 lines, the features and maths of *John Hunter and the Book of Tut*, and code-drawn placeholder art. A new game replaces the specs, the values and the art; the engine, demo tools, checks and build stay.

Built from New Year Crackers (https://github.com/fxdarshan/01_New_Year_Crackers), which came from X-Mas Dolls (https://github.com/fxdarshan/Demo-SLot-Game).

## Start here
| File | What |
| --- | --- |
| [`NEW_GAME.md`](NEW_GAME.md) | start a new game: make the repo, fill the input pack, build, review |
| [`WORKFLOW.md`](WORKFLOW.md) | working from Claude Code at home and claude.ai chat elsewhere, with GitHub as the bridge |
| [`CLAUDE.md`](CLAUDE.md) | house rules every Claude session follows |
| [`HANDOFF.md`](HANDOFF.md) | where the last session stopped and what's next |
| [`art/README.md`](art/README.md) | how to name and drop in art |
| [`docs/templates/`](docs/templates) | blank spec templates to fill in for a new game |

Skills in `.claude/skills/`: `slot-new-game`, `slot-prototype-from-spec`, `slot-asset-integration`, `slot-math-audit` (`/slot-math-audit`), `slot-project-sync`.

## Run it
```bash
python3 -m http.server 8000      # then open http://localhost:8000
```
Or open `index.html` directly. `node tools/build-single.js` writes one self-contained file to `dist/<title>-prototype.html` (images embedded) to share or double-click.

**Controls:** SPIN or Space, i for the paytable, − / + for the bet, AUTOPLAY, D for the demo panel, C for cheats.

## What's in the box
| Part | File |
| --- | --- |
| All values (grid, lines, pays, weights, features, timings, layout, texts) | `src/config.js` |
| Pure maths: `resolveSpin(grid, opts)` → ordered steps (`win`, `scatter`, `expand`) | `src/engine.js` |
| Canvas presentation: reels, anticipation, wins, Scatter reveal, special symbol pick, expansion, banners, modals, transitions, HUD, free spins flow, max-win cap | `src/game.js` |
| Scripted outcomes from real engine results | `src/director.js` |
| Cheat menu, hotkeys, scenarios, `?scenario=` links | `src/cheats.js`, `docs/cheats.md` |
| Demo panel: outcome list, custom grid, speed, video recording with sound | `src/devpanel.js` |
| Asset IDs and paths; placeholder art | `assets/manifest.js`, `src/placeholders.js` |
| Splash screen, synthesised sounds | `src/splash.js`, `src/audio.js` |
| Monte Carlo RTP and frequencies | `tools/simulate.js` |
| 20 edge-case checks in headless Chrome | `tools/edge-cases.py`, `docs/edge-cases.md` |
| Art import and clean-up | `tools/asset-pipeline/` |

## Sample game maths
`node tools/simulate.js 4000000 <seed>`: RTP 95.9% to 98.2% across six seeds (average about 96.6%; target 96.50%), free spins about 1 in 163, base hit rate about 28%, max win capped at 5,500×. The spread is the game's high volatility, not a bug: tune a real game over several seeds.

## Decisions in the sample
Gold Bar and Coins are extra symbols with ASSUMED pays (1/5/25×); the line shapes are the classic 10-line book layout; the weights and the free spins boost are TUNED. Details: `docs/reference-game.md`, `docs/pay-table.md`.
