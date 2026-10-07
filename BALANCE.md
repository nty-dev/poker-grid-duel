# Bot ratings

These are the ratings shown in the opponent picker. They come from `npm run sim`, which runs on the paired-seed match runner in `src/evaluation`. Raw output is in [`results/`](results/).

A match of N games is N/2 **pairs**. Both games of a pair use one seed, with seats and first move swapped. "Win rate" counts a draw as ½. CIs are 95% normal intervals over pairs.

Random is anchored at 800. Each stronger bot is chained off its match against the previous one with `gap = 400·log10(p/(1−p))`, where `p` is its win rate.

| Match (stronger bot second) | Games | W–D–L (stronger) | Stronger's win rate (95% CI) | Elo gap | Rating |
|---|---|---|---|---|---|
| — | | | | | **Random 800** |
| Random vs Greedy | 2000 | 1871–48–81 | 94.8% (93.8–95.7%) | +503 | **Greedy 1303** |
| Greedy vs Monte Carlo | 2000 | 1475–128–397 | 77.0% (75.4–78.6%) | +209 | **Monte Carlo 1512** |

These ratings are in [`src/bots/strategies/catalog.ts`](src/bots/strategies/catalog.ts).

Both matches come from one run, `npm run sim -- --games=2000 --seed=1`, saved as [`results/tournament-games2000-seed1.json`](results/tournament-games2000-seed1.json). Running the same command again reproduces it exactly.
