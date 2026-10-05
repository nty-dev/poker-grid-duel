Monte Carlo judges a cell by what tends to happen after the card is placed there. It finishes the game many times with randomly dealt cards and keeps the cell that does best on average.

### How it chooses

1. **List the cards still face down.** These are the 52 cards minus those on the board, the card being placed and the next card.
2. **Imagine 100 ways the rest of the game could go.** Each one is a random order for the face-down cards (after the known next card) and a random order in which the empty cells get filled.
3. **Try every empty cell.** Place the card there, then finish the game in each of the 100 ways, dealing the remaining cards into the remaining cells.
4. **Score each finished board** as Monte Carlo's total minus its opponent's total.
5. **Play the cell with the highest score added up over all 100 finishes.**

### Every cell is tested against the same 100 finishes

If each cell had its own random finishes, one cell could come out ahead just by being dealt better cards. With shared finishes, the only thing that differs between two cells is the move itself. (This technique is known as common random numbers.)

### The finishes do not model turns

The rest of the game is filled in at random for both players, and a random placement is the same whoever makes it. So a finish is simply the remaining cards landing on the remaining cells in a random order.

### Where it falls short

- The random finishes never block. A hand that a real opponent would spoil looks better to Monte Carlo than it is.
- It aims for the largest average margin, which is not always the move most likely to win.
- 100 finishes per cell is an estimate. Two cells of similar value can be ranked the wrong way round.
