# Working from home (Claude Code) and away (claude.ai chat)

One game, two ways in, nothing lost between them. **GitHub is the bridge**: every session starts by pulling and ends by pushing, and the repo carries everything a session needs to pick up where the last one stopped.

```
 Home laptop                         GitHub (main)                       Office / phone
 Claude Code in the repo folder  <->  code, docs, art/, HANDOFF.md   <->  claude.ai chat (Project)
 runs the game in your browser        CLAUDE.md rules, .claude/skills      clones the repo, works, pushes
```

## What carries the context
| File | Role |
| --- | --- |
| `CLAUDE.md` | house rules every session follows (source of truth, checks before done, push) |
| `HANDOFF.md` | where the last session stopped, what's next, what's waiting for you |
| `.claude/skills/` | the steps: new game, build from spec, add art, audit maths, finish a change |
| `docs/` | the specs; the only source for rules and maths |
| `art/` | the art inbox; files named by asset ID |

## At home: Claude Code
1. One-time: install Claude Code (desktop app or terminal) and clone the game repo, e.g. into `Documents/BitbyBit/Kiyaan Gaming/01_GAMES/<game>`.
2. Open Claude Code **in that folder**. It loads `CLAUDE.md` and the skills by itself.
3. Say what you want ("add the new banners from art/", "/slot-math-audit"). It pulls, reads `HANDOFF.md`, works, runs the game locally, and pushes when done.
4. Preview: `python3 -m http.server 8000` in the folder, then http://localhost:8000.

## Away: claude.ai chat
1. Use a **claude.ai Project per game** (like `01_New_Year_Crackers`). Paste this into the Project's instructions once:
   > This project's game lives in GitHub repo `fxdarshan/<repo>`. At the start of any work: attach the repo with push access, clone it, follow its `CLAUDE.md`, read `HANDOFF.md`. Finish every change with the `slot-project-sync` steps (docs, checks, single-file build, HANDOFF.md, push to main). Send me the rebuilt single HTML file.
2. Ask for the work as usual. The chat clones the repo, follows the same rules and skills, and pushes.
3. To give it art from the office: upload the files on GitHub (repo → `art/` → Add file → Upload files), named by asset ID; or attach them in the chat.

## Rules that keep it seamless
- **Pull first, push last**, every session. Don't leave work only on the laptop or only in a chat.
- **One session at a time per game.** If a home session and a chat session both change the same game, the second push has to merge.
- **Name art by asset ID** (`sym_03_idle.png`, `bg_base_main.png`) and drop it in `art/`; `import_art.py` does the rest.
- **Write decisions down**: answers to open questions go into the GDD or `HANDOFF.md`, not just the chat, so the other side sees them.
- **Your laptop folder:** after a chat session, run `git pull` in the game folder (or let Claude Code do it when you open it).

## Starting a new game
On GitHub: open `fxdarshan/slot-starter-template` → **Use this template** → name the new repo. Then follow `NEW_GAME.md` (or ask Claude: "start a new game from the template", which uses the `slot-new-game` skill).
