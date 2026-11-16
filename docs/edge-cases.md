# Edge cases

`tools/edge-cases.py` checks each of these in headless Chrome (20 checks, all passing on 2026-11-15):

```bash
python3 -m http.server 8765 &        # from the repo root
python3 tools/edge-cases.py
```

## Handled (carried over from X-Mas Dolls and re-checked)
1. **Balance below the bet:** the bet drops to the highest one the balance covers; below the smallest bet the demo balance is refilled. The balance never goes negative.
2. **Speed slider mid-round:** applies from the next spin, so an animation never changes speed halfway.
3. **AUTO toggled off and on during a round:** one autoplay loop only.
4. **Malformed cheat items** (bad symbol, bad length, missing or wrong-sized custom grid, unknown type): played as a normal spin.
5. **Unknown `?scenario=` link:** a message, no crash.
6. **Error mid-round:** banner, modal, transition, spinning state, free spins look, fuses and expansions are reset, and the next spin works.
7. **Space pressed repeatedly during a round:** skips animations; the round completes.
8. **Small or portrait windows:** the canvas stays inside the viewport.

## New for Starter Slot (sample game)
9. **Missing symbol art:** a code-drawn placeholder tile is used, with no errors.
10. **Money:** one debit per round; the round win (base spin plus all free spins) is credited once.
11. **Retrigger on the last free spin:** the extra 10 spins still play (20 played, 20 awarded).
12. **Max win cap:** the round stops at 5,500× even mid free spins, the summary says "MAX WIN 5,500× REACHED", and exactly 5,500× is credited.
13. **Free spin cheats outside free spins** (expand, retrigger): played as normal spins, no errors.

## Rules edge cases (engine, checked with hand-built grids)
- A line of only Scatters doesn't pay as a line; the Scatters pay as scatter.
- A Scatter at the start of a line takes the value of the first regular symbol after it.
- The special symbol and Scatters on the same free spin: the Scatter pays and retriggers, and the expansion still pays.
- The special symbol expands on non-adjacent reels (for example reels 1, 3 and 5) and pays on all 10 lines.
- Line wins of the special symbol are paid before the expansion, and the expansion pays on top (reference behaviour).

## Known limits
- Scatter and line wins are shown one after the other; the total is right, but a spin with both takes longer.
- The line-number tags at the window edges can overlap when several winning lines start on the same row.
- Sounds are synthesised placeholders until audio files are supplied; files only load when the game is served over http.
