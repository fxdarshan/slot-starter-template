# Starter Slot (sample game): Game Design Document

> This is the template's **sample game**, so everything runs out of the box. For a new game, replace this file with `docs/templates/reference-gdd.md` filled in (see `NEW_GAME.md`).

## 1. Concept
A neutral jewel-themed book-style slot with the features and maths of Pragmatic Play's *John Hunter and the Book of Tut* (`docs/reference-game.md`). All art is code-drawn placeholders until files are dropped into `art/`.

## 2. Problem statement
Every new slot prototype should start from a working game with the same tools: a pure maths engine, scripted outcomes, cheats and scenarios, video recording, a simulator, edge-case checks and a single-file build. Only the specs, the maths values and the art change.

## 3. Key numbers (sample maths)

| Item | Value |
| --- | --- |
| Grid / lines | 5×3 / 10 |
| RTP | about 96.5% target; measured 96.3% to 96.8% average depending on seeds, ±1% run to run at 4M rounds |
| Max win | 5,500× cap |
| Free spins | 1 in about 163 base spins, average win about 60× |
| Base hit rate | about 28% |

## 4. Flow
Base spin with anticipation after 2 Scatters → line wins (all lines, then each line) → Scatter pay and full-reel Scatter reveal → free spins intro → special symbol pick → curtain transition → free spins with the expanding symbol → retrigger modal → summary → back to base. Big win banners at 10/20/50/100/250/500× the bet.

## 5. Screen layout
1920×1080 stage. Reel window `CONFIG.window` (default x 215 to 1703, y 139 to 916). Bottom bar from y 944: settings, sound, info, CASH, LINES, BET (per line) with − / +, TOTAL BET, WIN, SPIN, AUTOPLAY; message pill above it.

## 6. Decisions
Listed in the README. Every value not in a spec is marked ASSUMED or TUNED in `src/config.js`.

## 7. Open questions
None for the sample. A real game lists here what the specs leave open.

## Prototype implementation status
Sections 3 to 5 are implemented.
