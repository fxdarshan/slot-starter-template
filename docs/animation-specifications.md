# Starter Slot (sample game): Animation Timings

There is no animation spec for this game yet. These are the prototype's own timings, in frames at 30 fps (`CONFIG.frames` in `src/config.js`). All of them scale with the demo panel's speed slider.

| Key | Frames | What |
| --- | --- | --- |
| `symWin` | 10 / 20 / 15 | winning symbol: pop to 112% with a glow, hold with a small bob, settle |
| `lineCycle` | 36 | each winning line on its own after the all-lines view (skipped in autoplay) |
| `scatterLand` | 12 | Scatter squash when it lands |
| `anticipation` | 45 per reel | extra spin time for each reel after two Scatters are showing, with a glowing frame (and the fx_lantern decoration if supplied) |
| `fuse` | 24 / 18 / 18 | trigger: the full-reel Scatter art (fx_scatter_full) is revealed down the reel, sparks pop, settle |
| `pick` | 90 / 30 | special symbol pick: cycle and slow down, then hold on the pick |
| `expand` | 12 / 24 / 12 | special symbol flashes, each reel grows to a full column (staggered left to right), settle |
| `expandLines` | 45 | all 10 lines and the expansion amount |
| `banner` | 30 / 90 / 30 | modals and big win banners: in, hold, out |
| `bannerTally` | 30 to 105 | big win count-up inside the banner |
| `summaryTally` | 75 | free spins summary count-up |
| `transToFree` | 15 / 45 / 15 | curtain to free spins |
| `transToBase` | 60 | zoom back to the base game |
| `bgBaseLoop` | 120 | warm light breathing either side of the reels |

Reel spin: first reel stops after 1.0 s, then every 0.18 s, with a small bounce (`CONFIG.spin`).

## Prototype implementation status
All timings above are used by `src/game.js`.
