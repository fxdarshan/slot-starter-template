---
name: slot-project-sync
description: Finish every change to this slot prototype - checks, docs, single-file build, HANDOFF.md, commit and push to main - so the next session (Claude Code at home or claude.ai chat) starts from the same place. Run at the end of every change.
---

# Slot project sync

Darshan's standing rule: **every change updates all the docs and is pushed**. GitHub `main` is the bridge between his Claude Code sessions at home and claude.ai chat sessions elsewhere, so nothing counts as done until it is pushed and `HANDOFF.md` says where things stand.

## 1. Check the repo
- `git status --short`; `git fetch` and compare with `origin/main`. Rebase on anything new before going on.
- `node --check` every changed `.js` file.

## 2. Checks
- Maths changed: `node tools/simulate.js 2000000 <seed>` for 3 seeds; note the RTP spread.
- Serve the repo (`python3 -m http.server 8765`) and run `python3 tools/edge-cases.py`: all pass.
- Play the changed feature or scenario to the end in headless Chrome; look at screenshots; zero page errors.

## 3. Docs the change touches
| Doc | When |
| --- | --- |
| `CHANGELOG.md` | always: dated entry at the top |
| `HANDOFF.md` | always: update "Now" (state, next, waiting for Darshan) and add a log entry naming the surface (Claude Code or claude.ai chat); keep 5 entries |
| `README.md` | features, controls, maths figures, decisions, art status |
| `docs/reference-gdd.md` | design, flow, decisions, open questions |
| spec docs (`official-game-rules`, `pay-table`, `animation-specifications`, `game-asset-specification`) | only their "Prototype implementation status" section, never the supplied text |
| `docs/cheats.md` | outcomes, hotkeys, scenarios |
| `docs/edge-cases.md` | new or changed checks |
| `assets/README.md` | art added or reprocessed |

## 4. Build and ship
- `node tools/build-single.js`; open `dist/*.html` from file:// and spin once.
- Commit with a message that says what changed and why; push: `git -c push.negotiate=true push origin main`. Confirm `git ls-remote origin refs/heads/main` matches `HEAD`.
- In claude.ai chat: refresh the preview artifact if there is one, and send the single HTML file.
- Never turn on GitHub Pages or other public hosting; give Darshan the steps.

## 5. Report
What changed, test results, docs updated, what is placeholder or ASSUMED, and what is waiting for Darshan (the same as `HANDOFF.md`).
