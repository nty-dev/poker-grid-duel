# Bot ratings

These are the ratings shown in the opponent picker. They come from `npm run sim`, which runs on the paired-seed match runner in `src/evaluation`. Raw output is in [`results/`](results/).

A match of N games is N/2 **pairs**. Both games of a pair use one seed, with seats and first move swapped (DECISIONS.md D22). "Win rate" counts a draw as ½. CIs are 95% normal intervals over pairs (D23).

Random is anchored at 800. Each stronger bot is chained off its match against the previous one with `gap = 400·log10(p/(1−p))`, where `p` is its win rate.

| Match (stronger bot second) | Games | W–D–L (stronger) | Stronger's win rate (95% CI) | Elo gap | Rating |
|---|---|---|---|---|---|
| — | | | | | **Random 800** |
| Random vs Greedy | 2000 | 1898–46–56 | 96.1% (95.3–96.8%) | +554 | **Greedy 1354** |
| Greedy vs Monte Carlo | 400 | 297–32–71 | 78.3% (74.7–81.8%) | +222 | **Monte Carlo 1576** |

These ratings are in [`src/bots/strategies/catalog.ts`](src/bots/strategies/catalog.ts).

**Note:** these runs predate later changes to how random numbers are generated: the switch to the `seedrandom` generator, and each bot owning its own generator. Both changed which games a given seed produces. Re-running `npm run sim` gives statistically similar ratings, not the identical games recorded here: `npm run sim -- --games=200 --seed=1` currently gives 800 / 1286 / 1516. A 200-game run is a rough estimate, because near a 95% win rate a few games move the Elo gap by dozens of points.
