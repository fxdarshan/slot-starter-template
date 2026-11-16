# Starter Slot (sample game): Game Rules

> Written for the prototype from the reference game's published rules (`docs/reference-game.md`). Items marked ASSUMED are not in the reference sources.

## 1. Overview
- 5 reels, 3 rows, 10 fixed paylines.
- Wins pay left to right on adjacent reels, starting from the leftmost reel.
- Theoretical RTP: 96.50%.
- Maximum win: 5,500× the total bet per round (a base spin plus any free spins it triggers). The round ends when it is reached.

## 2. Playing a round
- A round starts with the SPIN button (or Space) at the selected total bet. The bet can't be changed during a round.
- Autoplay plays rounds one after another until it is switched off.
- In the event of malfunction, all affected bets and pays are void.

## 3. Line wins
- Only the highest win on each line is paid. Wins on different lines are added.
- Crown, Ruby, Emerald and Sapphire pay from 2 in a row; every other symbol pays from 3.

## 4. Scatter (Wild and Scatter)
- The Scatter appears on all reels.
- As a **Wild** it substitutes for every other symbol on a line. A line made only of Scatters does not pay as a line.
- As a **Scatter**, 3, 4 or 5 anywhere pay 2×, 20× or 200× the total bet, added to line wins.
- 3 or more Scatters award **10 free spins**.

## 5. Free spins
- Free spins are played at the bet of the spin that triggered them, as part of the same round.
- **Special expanding symbol:** before the free spins start, one regular symbol (any of the 11) is picked at random. It stays the same for all of the free spins, including retriggers.
- After the normal wins of a free spin are paid, if the special symbol is on enough reels to win (2 reels for Crown, Ruby, Emerald and Sapphire; 3 for the others), it **expands to fill those reels** and pays on all 10 lines, **even on reels that are not next to each other**. The expanded win is the pay for that many symbols × 10 lines, added to the normal wins. Scatters do not count toward the expansion.
- **Retrigger:** 3 or more Scatters during free spins pay as in section 4 and add 10 free spins. There is no limit.

## Prototype implementation status
- Sections 1 to 5 are implemented in `src/engine.js` (`evaluate`, `scatters`, `expansion`, `resolveSpin`) and played in that order by `src/game.js`.
- The max win cap is applied in `src/game.js` (`play`, `freeSpins`) and in `tools/simulate.js`.
- During free spins the special symbol is drawn more often than in the base game (`CONFIG.specialBoost`, TUNED). The reference game's free spins reels are not published; book slots commonly use separate free spins reels, and this weight is how the published RTP was reached.
