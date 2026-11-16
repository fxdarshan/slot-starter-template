# House rules for this slot prototype

Claude reads this file at the start of every session, in Claude Code and in claude.ai chat sessions that work on this repo. Keep it short; details live in the docs it points to.

## Start of every session
1. `git pull` (or clone fresh). GitHub `main` is the only shared copy: Darshan works from Claude Code at home and from claude.ai chat elsewhere.
2. Read `HANDOFF.md`: where the last session stopped, what's next, what is waiting for Darshan.
3. If the request is about maths or rules, read `docs/` first (source order below).

## Source of truth (highest first)
Official rules and pay table > animation spec > asset spec > GDD > screenshots or mockups > reference game reviews.
- `docs/official-game-rules.md`, `docs/pay-table.md`, `docs/animation-specifications.md`, `docs/game-asset-specification.md`, `docs/reference-gdd.md`, `docs/reference-game.md`.
- Never invent probabilities, pays or rules. A value not in the docs is marked **ASSUMED** (a design choice) or **TUNED** (set with the simulator) in `src/config.js` and listed under "Decisions" in the README.
- When documents disagree, pick one, make it a config switch if cheap, and list the conflict in the README and GDD.
- Spec text supplied by Darshan is never edited; each spec doc gets a "Prototype implementation status" section at the end instead.

## How the code is split
`src/config.js` (all values) → `src/engine.js` (pure maths, returns steps) → `src/game.js` (plays the steps). `src/director.js` builds scripted outcomes from real engine results; `src/cheats.js` and `src/devpanel.js` drive it. Art and sound are only referenced through `assets/manifest.js`. Keep that split: no maths in `game.js`, no drawing in `engine.js`.

## Every change, before it is done
1. `node --check` on changed JS.
2. Maths changed: `node tools/simulate.js 2000000` with 2 or 3 seeds; report RTP with its run-to-run spread, and update the figures everywhere they appear.
3. Serve (`python3 -m http.server 8765`) and run `python3 tools/edge-cases.py`: all checks pass. Play the affected feature or scenario in the browser (headless Chrome when no screen); look at screenshots; zero page errors.
4. Update every doc the change touches (README, CHANGELOG, GDD, spec status sections, `docs/cheats.md`, `assets/README.md`).
5. `node tools/build-single.js` (single-file build in `dist/`).
6. Update `HANDOFF.md`.
7. Commit (clear message) and push to `main`.

The `slot-project-sync` skill is this checklist; run it at the end of every change.

## Skills in this repo (`.claude/skills/`)
| Skill | Use |
| --- | --- |
| `slot-new-game` | starting a new game from this template |
| `slot-prototype-from-spec` | building or changing the game from the docs |
| `slot-asset-integration` | putting supplied art and sound into the game |
| `slot-math-audit` | read-only check of the code against the docs |
| `slot-project-sync` | finishing every change: docs, checks, build, handoff, push |

## Working style
- Darshan reviews on screenshots and the single-file build; say plainly what is placeholder, ASSUMED or untested.
- Ask before changing game probabilities or pays that came from a spec.
- Art travels through GitHub: files in `art/` are committed, so a chat session can import art added at home and the other way round. Keep each file under 25 MB (GitHub's web upload limit); see `art/README.md`.
