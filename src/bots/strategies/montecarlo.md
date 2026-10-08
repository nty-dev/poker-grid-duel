Monte Carlo judges a cell by what tends to happen after the card is placed there. It finishes the game many times with randomly dealt cards and keeps the cell that does best on average.

### How it chooses

1. **List the cards still face down.** These are the 52 cards minus those on the board, the card being placed and the next card.
2. **Imagine 100 ways the rest of the game could go.** Each one is a random order for the face-down cards (after the known next card) and a random order in which the empty cells get filled.
3. **Try every empty cell.** Place the card there, then finish the game in each of the 100 ways, dealing the remaining cards randomly into the remaining cells.
4. **Score each finished board** as Monte Carlo's total minus its opponent's total.
5. **Play the cell with the highest score added up over all 100 finishes.**
