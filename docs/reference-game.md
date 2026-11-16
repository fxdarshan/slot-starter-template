# Reference game: John Hunter and the Book of Tut (Pragmatic Play)

Starter Slot (sample game) uses this game's features and maths, as Darshan asked on 2026-11-15. This file holds only the **published facts** and where they came from. Where the sources disagree, the conflict and the value used are listed below. Anything not published is marked ASSUMED or TUNED in `src/config.js` and listed in the README under "Decisions".

Sources Darshan gave:
- Review: https://www.bigwinboard.com/john-hunter-and-the-book-of-tut-pragmatic-play-slot-review/
- Official page: https://www.pragmaticplay.com/en/games/john-hunter-and-the-book-of-tut-slot/
- Videos: https://www.youtube.com/watch?v=PETQquwWx-g and https://www.youtube.com/watch?v=hNaidHqhfPY (could not be read here: YouTube rate-limited the fetch; nothing below comes from them)

Extra sources for the full pay table (the two pages above don't list it):
- https://slotester.com/john-hunter-and-the-book-of-tut/ (premium pays "x total bet", read from the game at a 2.00 bet; scatter pays)
- https://www.online-slot.co.uk/online-slots/reviews/john-hunter-and-the-book-of-tut/ (low symbol pays, John Hunter pays)

## Facts

| Item | Value | Source |
| --- | --- | --- |
| Grid | 5 reels × 3 rows | Bigwinboard |
| Lines | 10 fixed | Bigwinboard |
| RTP | 96.50% | Official, Bigwinboard |
| Volatility | High (5 of 5) | Bigwinboard |
| Bet range | 0.10 to 100 per spin | Bigwinboard |
| Max win | 5,500× (official) / 5,000× (reviews) | see conflicts |
| Book symbol | Wild (substitutes for every pay symbol) and Scatter | Bigwinboard |
| Scatter pays | 3 / 4 / 5 Books anywhere = 2× / 20× / 200× total bet | Bigwinboard, Slotester |
| Free spins | 3+ Books award 10 free spins | Official, Bigwinboard |
| Retrigger | 3+ Books during free spins add 10 more, no limit | Official, Bigwinboard |
| Special symbol | Before free spins, one regular pay symbol is picked at random | Official, Bigwinboard |
| Expansion | The special symbol expands vertically to fill its reel when enough are showing for a win | Official |
| Expansion pays | Premiums pay "even if they are not adjacent to each other" | Bigwinboard |
| Hit frequency | not published | |
| Feature buy, gamble | not mentioned | |

## Pay table (x total bet, for one line)

| Symbol | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- |
| John Hunter | 1 | 10 | 100 | 500 |
| Tutankhamun mask | 0.5 | 4 | 40 | 200 |
| Cat | 0.5 | 3 | 10 | 75 |
| Scarab | 0.5 | 3 | 10 | 75 |
| A, K | | 0.5 | 4 | 15 |
| Q, J, 10 | | 0.5 | 2.5 | 10 |
| Book (scatter, anywhere) | | 2 | 20 | 200 |

The 5,000× maximum matches the top symbol expanded on all 5 reels: 500× on each of the 10 lines.

## Conflicts and how they were settled

- **Max win:** the official page says 5,500×, the reviews say 5,000×. The official value is used (`CONFIG.maxWin = 5500`).
- **"Random symbols can also have a chance to expand"** (official page, free spins). No source explains it beyond the special symbol, so only the special symbol expands. Open question for Darshan.
- **Line shapes** are not published in the sources found. The classic 10-line book-slot layout is used (ASSUMED).
- **Reel strips / symbol weights** are not published. They were tuned with `tools/simulate.js` to the 96.50% RTP (TUNED).

## Prototype implementation status

- Everything in the Facts table is implemented in `src/engine.js` and `src/config.js`, except volatility, which is a result rather than a rule (the simulator shows 71.7% of rounds lose and 0.14% pay 100× or more).
- RTP measured with the simulator: 96.35% average over 4 runs of 4 million rounds (95.90% to 96.83%, so about ±0.5% run to run).
- Starter Slot (sample game) has two extra premium symbols (Gold Bar, Coins) because the supplied art has six premiums against the reference game's four. Their pays are ASSUMED; see `docs/pay-table.md`.
