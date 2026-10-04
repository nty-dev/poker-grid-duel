# How the bots work

Each bot is one file in this folder that defines `chooseMove(view, helpers)`. It is called when it is the bot's turn and must return the position of an empty cell, `{ row, column }`.

- `view` is what the bot can see: `board`, `mySeat` (`'rows'` or `'columns'`), `currentCard` (the card it must place now), `nextCard` (the card after it) and `moveNumber`.
- `helpers` are functions the bot may call: `emptyPositions`, `lineOf`, `evaluateHand`, `place`, `random` and `shuffle`. The last two are seeded, so the same game always plays out the same way.

The files contain no comments. This page is the explanation; the function names in each file follow the steps below.

| Bot | File | Idea | Rating |
|---|---|---|---|
| Random | [random.js](random.js) | Any empty cell | 800 |
| Greedy | [greedy.js](greedy.js) | Best immediate gain, mine minus the opponent's | 1354 |
| Monte Carlo | [montecarlo.js](montecarlo.js) | Best average result over 100 randomly finished games | 1576 |

## Random

Picks one of the empty positions with equal probability. It exists as the baseline the other two are measured against.

## Greedy

Greedy looks only at the card in hand. It does not use `nextCard`.

**The rule.** For every empty position, imagine the current card placed there. That changes exactly two lines: one of mine and one of the opponent's (the row and the column through that position). Score the move as

```
advantage = (gain in worth of my line) − (gain in worth of the opponent's line)
```

and play the position with the largest advantage (`chooseMove`, `worthGained`). The subtraction is what makes Greedy block: a card that completes the opponent's hand has a large negative advantage, so Greedy puts it somewhere else if it can.

**The worth of a line** (`lineWorth`).

- A finished line (5 cards) is worth its real poker points.
- An unfinished line is worth what it already holds plus small bonuses for what it could still become (`worthOfUnfinishedLine`):

| The line holds | Worth |
|---|---|
| Four of a kind | 40 |
| Three of a kind | 10 + 3, because it can still become a full house or four of a kind |
| Two pair | 5 + 1, because it can still become a full house |
| One pair | 2 + 1, because it can still improve |
| 2 or more cards, all one suit | + 1 per card (a flush is still possible) |
| 2 or more cards that can still form a straight | + 1 per card |

The bonuses are deliberately small: a hand already made always outranks a hope. A single card earns no flush or straight bonus, since one card is trivially "all one suit".

**Can these cards still form a straight?** (`canStillBecomeStraight`). No, if two of them share a rank. Otherwise try each of the ten possible straights, from A-2-3-4-5 up to T-J-Q-K-A, and ask whether every card fits inside it. The ace counts as low only in the first one.

**Weakness.** Greedy never looks ahead, so it does not plan around the next card and cannot weigh a likely hand against an unlikely one: every flush draw of three cards is worth the same, however many cards of that suit are left.

## Monte Carlo

Monte Carlo cannot calculate the best move, because it does not know the order of the deck. Instead it estimates each move by playing the rest of the game out many times.

**The steps.**

1. **Work out which cards are still unseen** (`cardsNotYetSeen`): all 52 cards, minus the ones on the board, the current card and the next card.
2. **Sample 100 possible futures** (`sampleFutures`). Each future is two guesses:
   - an order for the rest of the deck: the known next card, followed by the unseen cards shuffled;
   - an order in which the empty cells get filled: all 25 positions shuffled.
3. **For every empty position (a candidate)**, and for each of the 100 futures (`boardAfterRandomFinish`):
   - place the current card on the candidate;
   - deal the future's cards, one by one, into the remaining empty cells in the future's fill order.
4. **Score the full board** (`myLeadOnFullBoard`): my total minus the opponent's total.
5. **Play the candidate whose lead, added up over the 100 futures, is largest.**

**Why every candidate is tested on the same 100 futures.** If each candidate drew its own random futures, one could look better only because it happened to draw luckier cards. Using the same futures for all of them means the only difference between two candidates is the move itself. This is the "common random numbers" technique.

**Why it does not matter who places which card in a playout.** Both sides are assumed to play at random for the rest of the game. A random player's choice does not depend on whose turn it is, so the result is the same as dropping the remaining cards onto the empty cells in a random order.

**Weaknesses.**

- The playouts are random, so they assume the opponent will not block. A line that a real opponent would spoil is overvalued.
- Each playout pretends to know the whole deck order. Averaging over many guesses mostly cancels this out, but the bot can never plan to "wait and see".
- It maximises the average score difference, not the chance of winning.

## How the ratings were measured

`npm run sim` plays each bot against the one above it in the table and converts the win rate into an Elo gap. See [BALANCE.md](../../../BALANCE.md).
