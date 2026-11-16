---
name: slot-math-audit
description: Read-only audit of this slot prototype's maths and rules against the project documents. Use when the user runs /slot-math-audit, or asks to check, verify or audit the game maths, paylines, wilds, features, free spins or payouts against the spec.
---

# Slot math audit

Compare what the code does with what the project documents say, and report the differences. **Read-only:** do not edit any file unless the user explicitly asks you to implement fixes after the report.

## Source of truth

Read these before looking at code. They are the only source for rules, probabilities and payouts; never invent a value. If two documents disagree, report it as a document conflict and do not pick one.

| What | File |
| --- | --- |
| Problem statement and design (GDD) | `docs/reference-gdd.md` |
| Rules | `docs/official-game-rules.md` |
| Pay table, paylines, scatter pays | `docs/pay-table.md` |
| Reference game facts and sources | `docs/reference-game.md` (if present) |
| Architecture and implementation plan | `README.md` (architecture, mechanics table, decisions, next steps) |
| Edge cases | `docs/edge-cases.md` |
| Timings and assets (only where they affect sequencing) | `docs/animation-specifications.md`, `docs/game-asset-specification.md` |

Values marked ASSUMED or TUNED in `src/config.js` are not in the documents by definition: check that each one is listed as a decision in the README or GDD, and report any that are not.

## Code to compare

- `src/config.js`: grid, paylines, paytable, weights, feature settings, max win, bets
- `src/engine.js`: line evaluation, wild substitution, scatter and feature resolution, step order, totals
- `src/director.js`: scripted outcomes; they must call the engine, never build their own totals
- `src/game.js`: round flow (spin, steps, free spins loop, retriggers, max-win cap, balance and win display)
- `tools/simulate.js`: must play rounds the same way as `game.js`

## Checks

1. **Paylines:** count, shapes and order match the pay table; evaluation direction, adjacency, minimum count per symbol (for example 2-of-a-kind symbols), and "highest win per line only".
2. **Pay values:** every symbol and count against the pay table, and the unit used (x total bet or x line bet).
3. **Wild substitution:** which symbols substitute, on which reels, for what; a line made only of wilds; wild-led lines choose the best paying symbol where the rules say so.
4. **Symbol upgrades or transformations** (when the rules have them, for example upgrades, expanding symbols): trigger condition, order, which positions change, whether pays are added or replaced.
5. **Feature sequencing:** order of steps in `resolveSpin` against the rules (for example line wins, then scatter, then expansion), and that `game.js` plays them in that order.
6. **Free spins state:** trigger count, award, retrigger amount and limit, what persists between spins (special symbol, bet), and the counter shown in the HUD.
7. **Payout totals:** step amounts sum to the spin total; round total across base and free spins; max-win cap applied per round, including free spins; balance debit and credit happen once.
8. **Simulator parity:** `tools/simulate.js` uses the same rules and cap as `game.js`. Run `node tools/simulate.js 1000000` and compare RTP and frequencies with the documented targets; give the run-to-run noise (try 2 or 3 seeds) before calling a gap a mismatch.
9. **Edge cases:** every item in `docs/edge-cases.md` still holds; list cases the documents imply but nobody covers (cap hit mid free spins, retrigger on the last spin, scatter on a winning line, bet change locked during a round, balance below bet).

Small `node -e` checks against `src/engine.js` with hand-built grids are allowed (they change nothing). Do not change weights, pays or rules while auditing.

## Report

Use these sections, in this order, with `file:line` references (for example `src/engine.js:57`):

1. **Matches**: short list of rules that are implemented as documented.
2. **Mismatches**: each with the document reference, the code reference, what differs and the effect on play or RTP.
3. **Missing behaviour**: rules in the documents that the code does not implement.
4. **Edge cases to cover**: with how to reproduce each one (grid, cheat, scenario or `node -e` snippet).
5. **Correction plan**: concise, ordered steps; say which ones change RTP and need a simulator re-tune.

End by asking whether to implement the fixes. Only edit files after the user says yes.
