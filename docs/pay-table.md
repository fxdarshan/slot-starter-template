# Starter Slot (sample game): Pay Table

Pays are multiples of the **total bet** for one line (the reference game's unit). At the default $9.00 bet, 1× = $9.00.

## 1. Symbols

| Id | Symbol | Plays the part of | 2 | 3 | 4 | 5 | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Crown | John Hunter | 1 | 10 | 100 | 500 | reference |
| 1 | Ruby | Tutankhamun mask | 0.5 | 4 | 40 | 200 | reference |
| 2 | Emerald | Cat | 0.5 | 3 | 10 | 75 | reference |
| 3 | Sapphire | Scarab | 0.5 | 3 | 10 | 75 | reference |
| 4 | Gold Bar | (extra) | | 1 | 5 | 25 | ASSUMED |
| 5 | Coins | (extra) | | 1 | 5 | 25 | ASSUMED |
| 6 | A | A | | 0.5 | 4 | 15 | reference |
| 7 | K | K | | 0.5 | 4 | 15 | reference |
| 8 | Q | Q | | 0.5 | 2.5 | 10 | reference |
| 9 | J | J | | 0.5 | 2.5 | 10 | reference |
| 10 | 10 | 10 | | 0.5 | 2.5 | 10 | reference |
| 11 | Scatter | Book of Tut | | 2 | 20 | 200 | reference, scatter pay anywhere |

Gold Bar and Coins are extra symbols from the supplied art. The reference game has no equivalent, so their pays sit between the royals and the premiums. Removing them, or changing their pays, needs a re-tune with `tools/simulate.js`.

## 2. Expanded special symbol (free spins)
The pay for the number of reels holding the special symbol × 10 lines. For example, the Crown on 5 reels pays 500 × 10 = 5,000×, and the Emerald on 3 reels pays 3 × 10 = 30×.

## 3. Paylines (ASSUMED: the classic 10-line book-slot layout)
Rows: T top, M middle, B bottom.

| Line | Reels 1-5 |
| --- | --- |
| 1 | M M M M M |
| 2 | T T T T T |
| 3 | B B B B B |
| 4 | T M B M T |
| 5 | B M T M B |
| 6 | M B B B M |
| 7 | M T T T M |
| 8 | B B M T T |
| 9 | T T M B B |
| 10 | B M M M T |

## Prototype implementation status
- All values are in `src/config.js` (`paytable`, `scatterPays`, `paylines`) and shown in game on the paytable screen (i button), converted to money at the current bet.
