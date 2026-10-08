Greedy picks the cell that gives the best result immediately, judging only the card it is placing.

### How it chooses

A card placed in a cell joins two hands at once: one row and one column. One of those belongs to Greedy and the other to its opponent. For every empty cell, Greedy works out

```
advantage = how much its own hand improves − how much the opponent's hand improves
```

and plays the cell with the largest advantage. Subtracting the opponent's improvement is what makes Greedy block: a cell that would complete the opponent's flush scores badly, so the card goes elsewhere.

### How it values a hand

A finished hand of five cards is worth its poker points. An unfinished hand is worth what it already holds, plus a small bonus for what it could still become:

| The hand holds | Value |
|---|---|
| Four of a kind | 40 |
| Three of a kind | 10, plus 3 because it can become a full house or four of a kind |
| Two pair | 5, plus 1 because it can become a full house |
| One pair | 2, plus 1 because it can improve |
| Two or more cards, all the same suit | plus 1 per card: a flush is still possible |
| Two or more cards that fit inside one straight | plus 1 per card: a straight is still possible |
