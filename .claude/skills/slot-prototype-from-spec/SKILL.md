---
name: slot-prototype-from-spec
description: "Build or extend a playable HTML5 slot prototype in this repo from the specs in docs/ (rules, pay table, animation and asset specs, GDD or a reference game), with swappable assets, tuned demo maths, cheats and recording."
---

# Slot prototype from spec

Use when the user gives a reference slot (GDD, official rules, pay table, animation spec, asset spec, screenshots) and wants a playable prototype whose art can be swapped later, or wants an existing prototype updated to new spec files. This repo is the reference implementation (started from `fxdarshan/slot-starter-template`).

## Source-of-truth order
Official rules and pay table > animation spec (timings) > asset spec (IDs, banner tiers, audio) > GDD > screenshots. Copy every spec into `docs/` unchanged and append a "Prototype implementation status" section to each instead of editing the text. When specs disagree, pick one, make it a config switch, and list the decision in the README and GDD.

## Architecture (no build step, works from file://)
- `src/config.js`: grid, paylines, paytable as multiples of total bet (convert euro pay tables by the quoted bet), weights, feature chances, win tiers, timings in frames at the spec fps. Shared by browser and Node.
- `src/engine.js`: pure maths. `resolveSpin(grid)` returns ordered steps (for example hatch, bear, win, pop, wipe) plus total. No drawing.
- `src/director.js`: scripted outcomes for demos, found by searching random grids until a test passes.
- `src/game.js`: canvas renderer that plays the steps with spec timings; banners, modals, transitions, HUD.
- `assets/manifest.js`: every image and sound keyed by spec asset ID; missing files fall back to `src/placeholders.js` (code-drawn art).
- `src/devpanel.js`: outcome list, custom grid painter, speed, MediaRecorder video export (30 fps, with WebAudio routed in).
- `src/cheats.js`: cheat menu (DOM over the canvas so it never records), hotkeys, scenarios, `?scenario=` links.
- `tools/simulate.js`: Monte Carlo RTP, hit rate, feature frequency, max win. `tools/build-single.js`: one self-contained HTML with images embedded.

## Maths
- Implement the rules literally first (e.g. "only the highest win per payline", "upgrade only if it creates new or longer lines"), then tune unpublished weights and feature chances with the simulator to hit published RTP and frequencies. Report the measured figures and the run-to-run noise.
- Check what the rules make reachable (e.g. a per-spin ceiling that makes some banner tiers impossible) and say so; offer presentation-only cheats, clearly labelled, rather than bending the maths.
- Enforce the max-win cap per round, including free spins, and show it in the summary.

## Presentation
- Express every spec duration in frames in config; scale with a global speed for previews.
- Play engine steps in order; look ahead so a win and its upgrade share one 45-frame symbol animation.
- Free spins: trigger modal, transition, counter, retrigger, summary, transition back.

## Verify
- `node --check` every file; run the simulator; run every scripted outcome and every scenario to completion in headless Chrome (evaluate async calls with `void fn(); 0` or Playwright blocks until they finish); look at screenshots of each feature; zero page errors.
- Watch for flow bugs: queue playback that runs a fixed count while free spins consume queue items; HUD win totals during free spins.

## Deliver (every change)
Finish with the `slot-project-sync` skill (docs, checks, single file, HANDOFF.md, push). Report decisions, gaps and assumptions plainly.