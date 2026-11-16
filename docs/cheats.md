# Cheats and scenarios

Cheats force what the next spin, or a whole sequence of spins, will do. They're for demos, QA and video capture. **Every forced outcome is a real result from the maths engine**: the reels are set up to land that way, and the engine pays them by the normal rules.

The cheat controls are page elements over the game, not part of the canvas, so they never appear in recordings. Code: `src/cheats.js` (menu, hotkeys, scenarios) and `src/director.js` (outcome builders).

## Cheat menu
Press **C**, or click **Cheats (C)** at the top left. **Esc** closes it.
- **Play a scenario:** pick one from the dropdown. **Play** runs it now; **Link** copies a URL that opens the game and plays it.
- **Symbol win:** a symbol and 2 to 5 in a row (2 only counts for the four premiums that pay 2 of a kind), on the middle line. **Force next spin** or **Play now**.
- **Force the next spin:** the hotkey actions as buttons.
- **Clear forced (0):** drops forced spins that haven't played.

A chip at the bottom left shows the next forced spin.

## Hotkeys

| Key | Next spin |
| --- | --- |
| F | 3 Scatters → free spins, random special symbol |
| P | 3 Scatters → free spins, Crown special |
| 4 / 5 | 4 / 5 Scatters (20× / 200×) → free spins |
| E | free spin: the special symbol expands on 3 reels |
| T | free spin: the special symbol on all 5 reels |
| R | free spin: retrigger (+10) |
| 1 / 2 / 3 / 6 | NICE / BIG / MEGA / SUPERB banner |
| A | 2 Scatters with anticipation, no trigger |
| X | single line win |
| M | several line wins |
| W | a line win using the Scatter as Wild |
| N | no win |
| 0 | clear forced spins |
| Space | spin |

E, T and R only act inside free spins; outside them they play as a normal spin.

## Scenarios

| Id | What it plays |
| --- | --- |
| `free-spins` | 3 Scatters, the pick, then 10 random free spins |
| `top-free-spins` | Crown special; it expands on 3 reels, then on all 5 |
| `expansions` | Ruby special; expands on 2, 3 and 5 reels, with a retrigger |
| `retrigger` | 3 Scatters during free spins add 10 more |
| `all-banners` | NICE, BIG, MEGA and SUPERB from real boards, then 5 Scatters (200×) |
| `max-win` | Crown on all 5 reels every free spin until the 5,500× cap ends the round |
| `base-tour` | no win, line win, several lines, Scatter as Wild, 2-Scatter tease, Big banner |

Links: `index.html?scenario=<id>` or `index.html#scenario-<id>`. An unknown id shows a message.

## Demo panel
The **Next spins** list takes the same outcomes (with **Add to list** buttons). Free spins take items from the list too, so a scenario such as `top-free-spins` lines up the trigger and the free spins after it. The **Custom grid** editor paints any board; **Preview as** shows what it pays as a base spin or as a free spin with a chosen special symbol.

## Prototype implementation status
Every scenario and every outcome type was played to completion in headless Chrome with no page errors (2026-11-15).
