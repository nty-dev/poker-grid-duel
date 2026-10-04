# Decisions

Each entry: **Context · Options · Decision · Trade-offs.**

## Engine

### D1. Board representation
- **Context:** 25 cells, read as 5 rows and 5 columns.
- **Options:**
  - A flat list of 25, with `index = row * 5 + column`. This was the original choice.
  - A 5×5 grid, `board[row][column]`, with a cell addressed by a `Position { row, column }`.
- **Decision:** The grid. A move, a bot's answer and a UI click are all a `Position`. `withCardAt(board, position, card)` in `game.ts` is the one function that builds a board with a card added; `step`, the bot helper `place` and the UI's placement preview all use it.
- **Why:** The game is about rows and columns, so the data should say rows and columns. The flat list needed index arithmetic (`Math.floor(cell / 5)`, `cell % 5`, `row * 5 + column`) in the scoring code, both bots and the UI. With the grid there is none: a row is `board[row]`, and a column is one `map`.
- **Why `{ row, column }` and not a tuple or `(x, y)`:** Named fields can't be swapped by accident. With `(x, y)`, x is the column and y the row, so the grid would be read as `board[y][x]`, which is easy to get backwards.
- **Trade-offs:**
  - A move is two numbers to validate instead of one (`isOnBoard`).
  - Comparing positions needs a field-by-field check, where two cell numbers compared with `===`.
  - `step` copies only the row that changed and shares the other four with the previous state.
  - Behaviour is unchanged: the same seeds give identical tournament results before and after, and the Monte Carlo move time did not change measurably.

### D2. A cell is `Card | null`
- **Context:** v1 had walls, so a cell was a `kind`-tagged union (empty / wall / card). v2 removed walls: a cell is either empty or holds a card.
- **Options:** keep the tagged union; `Card | null`.
- **Decision:** `Card | null`. It is exactly the board shape the public bot API promises (`board[i]` is a card or `null`), so the engine board can be handed to bots without conversion.
- **Trade-offs:** `null` checks instead of `kind` checks; with `strict` and `noUncheckedIndexedAccess` the compiler still forces every caller to handle the empty case.

### D3. What lives in `GameState`
- **Context:** The only randomness in a game is the shuffle. The question is what part of it the game state has to carry.
- **Options:**
  - Store the RNG's state and draw each card lazily.
  - Shuffle once and store the **remaining** deck, removing the top card on every move (`deck.slice(1)`). This was the original choice.
  - Shuffle once and store the **whole** deck, never changing it.
- **Decision:** The whole deck. `newGame` shuffles once with the seeded RNG; after that no randomness is needed, so the shuffled deck *is* the complete random state. Cards are dealt from the front, one per placement, so the card to place is `deck[cards on the board]`. `currentCard` and `nextCard` are the only functions that know this; everything else calls them.
- **Why not a queue or `pop()`:** Both change the deck in place, and `step` must never modify the state it is given. Keeping the rule would mean copying the deck first, which is what `slice(1)` already did.
- **Why not `slice(1)`:** It copied up to 52 cards on every move for no benefit. With a fixed deck, `step` copies only the board, and every state of a game shares one deck array (a test checks this).
- **Trade-offs:** The position in the deck is derived by counting the cards on the board, a scan of the board, instead of being stored. A stored counter would be faster but could disagree with the board; deriving it cannot. A replay needs only `(seed, firstMover, moves)`.

### D4. `step` returns a `Result`, and moves name their seat
- **Context:** Invalid actions must not throw or mutate.
- **Options:** Exceptions; `Result` union; a boolean plus mutation.
- **Decision:** `step(state, move)` returns `{ ok: true, state } | { ok: false, error: GameError }`. `GameError` is one of four labels: `'gameOver'`, `'notYourTurn'`, `'notOnBoard'`, `'cellOccupied'`. The errors once carried extra data (whose turn it was, which position was rejected), but the caller already has both and nothing read them, so they were removed. Each move carries its `seat`, so "acting out of turn" can be detected rather than assumed. Exceptions are reserved for invariant violations, i.e. real bugs, such as the deck running out (impossible: 52 cards, 25 placements).
- **Trade-offs:** Callers must handle the error branch, which the type system enforces.

### D5. Seeded RNG
- **Context:** Determinism is required everywhere except the UI's choice of seed.
- **Options:**
  - `Math.random`: cannot be seeded, so it's ruled out.
  - A hand-written generator such as mulberry32 (about 10 lines, no dependency). This was the original choice.
  - A library.
- **Decision:** The `seedrandom` library, wrapped in a tiny `Rng { nextFloat, nextIntBelow }` object in `engine/rng.ts`. That file is the only place that imports it. ESLint bans `Math.random`, `Date.now` and `new Date` in `src/engine`, `src/bots`, `src/evaluation` and `src/rating`, including the preset `.js` files.
- **Why a library:** The project only needs "same seed, same sequence". A well-known, widely used library provides that without hand-written bit-twiddling code to maintain.
- **Trade-offs:**
  - One runtime dependency for what could be 10 lines.
  - The wrapper is stateful, but each consumer gets its own instance from a seed, so results are still reproducible.
  - Switching generators changed every shuffle. The results in BALANCE.md and `results/` were produced with the previous generator, so their seeds no longer reproduce those exact games. The conclusions are statistical and are expected to hold, but the numbers need a re-run to be exact.

### D6. Hidden information: `BotView`
- **Context:** Bots must not cheat.
- **Decision:** Bots receive only `toBotView(state, seat)`: board, seat, current and next cards, and the move number. **Nothing from the rest of the deck is in the view**, so two states whose decks differ only in hidden order produce identical views, and a test asserts this. A bot that needs the cards still to come works them out itself: the 52 cards minus the ones it can see (Monte Carlo does this). On the last turn `nextCard` is `null`: the 26th card is never revealed.
- **Trade-offs:** Sorting about 50 cards per bot move is negligible.

### D7. Evaluator semantics
- **Context:** Every finished line has exactly 5 cards, but the live UI (row/column labels, hover preview) scores partial lines.
- **Decision:** `classifyHand` handles 0–5 cards. Rank hands are always possible; flushes and straights need exactly 5 cards. With a single deck, a 5-card flush or straight has distinct ranks, so the classification is unique. The points table lives separately in `rules.ts`, so hand values can change without touching classification.
- **Trade-offs:** If someone set a points table that is non-monotonic (e.g. pair > full house), a full house still scores as a full house. That is intended: categories are fixed, values are config.

## AI

*D8 (how often the random bot used walls) was removed with walls in v2. Numbers are kept stable because other entries refer to them.*

### D9. Greedy heuristic
- **Decision:** `value = Σ potential(my lines) − Σ potential(opponent lines)` after the move. `potential = points made + bonuses for live draws` (only while the line has an empty cell):
  - flush draw (all one suit, ≥2 cards): +1 per card
  - straight draw (distinct ranks within a 5-rank window, A counts low or high, ≥2 cards): +1 per card
  - pair or two pair can improve: +1; trips can improve: +3
- **Why these weights:** A 4-card flush draw is worth +4, about a third of a made flush (12), which roughly matches the chance of completing it. The bonuses are small enough that a made hand always beats a draw.
- **Trade-offs:** Greedy ignores the next card (it does no lookahead), so it can't see that the opponent is about to receive the exact card they need. Blocking is implicit: dropping a harmless card into the opponent's near-complete line lowers their potential, and a test checks greedy blocks a four-card straight-flush column.

### D10. Monte Carlo instead of minimax or alpha-beta
- **Context:** Hidden information (deck order) and chance (every draw).
- **Options:** Expectimax or minimax over chance nodes; MCTS (UCT); flat Monte Carlo with determinisation.
- **Decision:** Flat Monte Carlo. For each empty cell, run N playouts. Each playout **determinises** by shuffling only the cards it has not seen (the next card stays on top), places the current card, then fills the rest randomly. With both sides random, who places which card doesn't matter, so a playout is "a random empty cell for each card in deck order". The bot picks the best mean of `(my score − their score)`.
- **Why not minimax:** The branching factor is up to 25 cells × about 40 possible next cards per ply, over 25 plies. A depth-limited search would need a heuristic evaluation anyway (which is what Greedy is). Monte Carlo gets an unbiased value estimate from the real scoring function, and its quality scales with a single knob, N.
- **Known weakness:** Determinisation leads to "strategy fusion": the playouts assume perfect knowledge of the future deck. With random playouts this mostly adds noise rather than bias.
- **Common random numbers:** Every candidate cell is evaluated on the **same** N seeds, so all cells see the same deck orders. This removes deck luck from the comparison *between* cells and lowers the variance of the choice at no extra cost.
- **Objective:** The average score difference, as specified. Maximising win probability would match Elo better, but it throws away margin information and is noisier. That's a possible experiment.

### D11. Monte Carlo cost per move
- **Cost:** about `emptyPositions × N × remainingPlacements` placements, plus one board score per playout. At the opening that is 25 × N × 24.
- **Measured** (Node, laptop, with timing scripts since removed), for the v2 preset using only the public helpers at 100 playouts: 13 ms at the opening, 6 ms mid-game, about 18 ms per move over whole games.

## Rating

### D12. Bot ratings (Elo)
- **Context:** The opponent picker shows a rating for each bot. v1–v3 also kept an Elo rating for the human player, stored in `localStorage`.
- **Decision:** Only the bots are rated. The human rating was removed.
- **Why remove the human rating:**
  - It lived in one browser's storage, so it was lost on clearing site data or switching device, and anyone could edit it.
  - It only ever moved against three fixed bots, so it said little beyond "beats Greedy, loses to Monte Carlo".
  - Defending it cost about 400 lines: validated storage, a rating chart, and their tests.
  - A player rating belongs with multiplayer, where there are other people to compare against. That is listed as a next step.
- **How bot ratings are derived:** A paired match gives a score rate `p` (win 1, draw ½). Under the Elo model, the rating gap that predicts that score is `400·log10(p / (1 − p))` (`eloGapFromScoreRate` in `evaluation/stats.ts`). Random is anchored at 800, and each stronger bot is rated from its match against the previous one. `p` is kept inside [0.01, 0.99], because a 100% score would mean an infinite gap. Chaining adjacent bots keeps `p` away from those extremes, where the estimate is least reliable.
- **Trade-offs:** The ratings are fixed constants in `src/bots/presets/catalog.ts`, copied from a tournament run (BALANCE.md). They don't update when a bot changes; re-run `npm run sim` and copy the new values.

*D13 (validated `localStorage` for the human rating) was removed with the human rating.*

## Tooling and UI

### D14. Versions
- The local Node is 18.16, so the project pins **Vite 5 / Vitest 2** (Vite 6+ and 7 need newer Node). CI runs Node 20. One `tsconfig.json` covers app, tests and CLI to keep configuration minimal.

### D15. UI structure
- `useGame(config, seats, onEnd)` owns one game for any mix of seats: each seat is a `Participant`, either a human or a bot behind the `BotPlayer` interface. Human and bot moves both go through `engine.step`, and bots only get a `BotView`. A bot that forfeits, or answers something the engine rejects, loses the game rather than stalling it. Bots move after a 400 ms delay so a human can follow. `GameView` is keyed by match id, so "play again" is a clean remount. Both modes let the player choose seats and who moves first.
- Modes live in `ui/modes`, shared pieces in `ui/components`. The one use of `Math.random`, picking a fresh game seed, is confined to `ui/browser.ts`.

## Bots and evaluation

*v2 added a Bot Arena: an in-browser editor for user-written bots, a Web Worker sandbox, and a Hall of Fame. v3 removed it to keep the project small enough to own completely. Entries that described only the Arena are replaced by one-line notes, and numbers are kept stable because other entries refer to them.*

### D16. Seat and first mover are independent; the engine knows only seats
- **Context:** The match runner must swap both which bot scores rows and which bot moves first.
- **Options:** `newGame(seed, playerA, playerB, ...)` with participant identities inside the engine; `newGame({ seed, firstMover })` with identities kept outside.
- **Decision:** `GameConfig = { seed, firstMover: Seat }`. The engine plays seats (`rows` / `columns`); who sits where is a mapping owned by the caller (UI or match runner). A game record is `(config, seat assignment, moves)`.
- **Trade-offs:** The engine stays tiny and identity-free; callers carry one extra mapping. A test checks the same seed deals the same deck whichever seat starts, which the paired-seed design relies on.

### D17. Bot API shape
- **Context:** All three bots are written against one small contract, `chooseMove(view, helpers)`, typed in `bots/types.ts` with the helpers built in `bots/api.ts`, instead of importing engine internals. That keeps "what a bot may know" in one reviewable place.
- **Decisions:**
  - `BotView` is plain JSON: cards are `{ rank, suit }`, and the board is `(Card | null)[]`.
  - **Each bot owns its random number generator.** `createBotPlayer(source, rngSeed)` seeds it once and the bot keeps drawing from it for as long as it lives. The game knows nothing about it: `chooseMove(view)` takes only the view. The tournament seeds each bot from `--seed` and the bot's id, so a run is reproducible; the browser seeds it at random for each game. An earlier version reseeded the helpers on every move from the game's seed and the move number, which made each decision a pure function of the view but tied the bot's randomness to the game's seed and leaked that detail into every caller.
  - Helpers **validate and throw** on misuse (a position off the board, an occupied cell, not 5 cards). A clear error that forfeits the game beats silently returning garbage.
  - `evaluateHand` takes exactly 5 cards: every finished line has 5. Partial-line heuristics are the bot's own business (Greedy computes its own).
- **Trade-offs:** Per-move helper creation costs one tiny closure per move. Bots that want cross-move randomness can't get it, which is intended.

### D18. Bots run in-process, through one validation path
- **Context:** A bot has to be called from the browser game, the tournament CLI and the tests. The rules for what counts as a legal answer must not differ between them.
- **Decision:** `runner.ts` owns `compileTrustedBotSource` (strict-mode `new Function`, which must define `chooseMove`), `askBotForMove` (call → catch → `validateBotAnswer`), and `describeBotOutput` (a readable description for forfeit messages). `createBotPlayer` wraps them as a `BotPlayer`, and every caller uses it. Only a `{ row, column }` of integers naming an empty cell is accepted, with no coercion of strings. A bot that throws or answers anything else **forfeits** that game with reason `exception` or `invalid_move`; it never stalls or crashes the caller.
- **The bot gets a copy:** `structuredClone(view)`, so a bot that mutates its view cannot corrupt engine state (tested).
- **Why in-process, on the main thread:** All three presets are trusted code and take at most about 20 ms per move (D19), roughly one frame, after a 400 ms display delay. A Web Worker would add isolation and the ability to interrupt a bot, but neither is worth its complexity here: message passing, an async interface, and lifecycle management.
- **Trade-offs:** There is no time limit, because synchronous code can't be interrupted on its own thread. A preset that looped forever would freeze the tab. If untrusted code were ever accepted, it would need a worker in the browser and OS-level isolation on a server.

### D19. Preset bots are plain JavaScript against the bot API
- **Decision:** `src/bots/presets/{random,greedy,montecarlo}.js` are plain scripts defining `chooseMove(view, helpers)`. ESLint lints them as scripts with no globals plus the determinism rule, and the tests run each one through `compileTrustedBotSource`/`askBotForMove`. The browser loads them with Vite `?raw` imports. The Node CLI reads them with `fs`, because `tsx` has no `?raw`.
- **Trade-offs:**
  - They are not type-checked: a script that only defines a global `chooseMove` can't be a TS module without `export`, and `export` isn't valid inside `new Function`. That gap is covered by tests: every preset plays complete legal games from both seats, and each has behavioural tests.
  - Compiling source with `new Function` forces `'unsafe-eval'` into the production Content-Security-Policy (`vite.config.ts`).
  - Converting the presets to TypeScript modules would remove both costs. That is planned next.
- **Greedy:** Same heuristic as D9. It only rescores the row and column through the candidate cell, since the other 8 lines don't change. `evaluateHand` only takes complete lines, so Greedy computes partial rank hands itself; those values are its own heuristic weights.
- **Monte Carlo:** Same flat Monte Carlo as D10, with 100 playouts. The common random numbers cover the deck order **and** the order in which empty cells are filled. Each future fixes a permutation of all 25 cells, and a playout fills the empty ones in that order, so candidate cells differ only in the move being judged. Measured cost: 13 ms at the opening, 6 ms mid-game, about 18 ms per move averaged over games (Node, laptop).

*D20 (Web Worker sandbox) and D21 (limits of the sandbox, and the CSP for bot workers) were removed with the Arena in v3.*

### D22. Matches: paired seeds (common random numbers)
- **Context:** Card luck dominates a single game. Comparing two bots on independent deals needs many games to see a real difference.
- **Decision:** A match is N/2 **pairs**. Both games of a pair use the same seed (the same deal). In game 1 bot A scores rows; in game 2 it scores columns. The first-moving *seat* is the same in both games, so the bot that moved first in game 1 moves second in game 2. Across the pair, each bot faces exactly the cards and turn order the other faced. The first-moving seat alternates between pairs, so rows and columns both start half the time.
- **Why it works:** This is variance reduction by common random numbers, as in backtesting two strategies on the same price path. The luck of the deal appears in both games with opposite sign and largely cancels in the pair average. What's left is mostly skill.
- **Records:** A game is stored as `(config, seatOfA, result)`: the deal, which bot sat where, and the score or the forfeit.

### D23. Confidence interval: normal approximation over pairs
- **Context:** A match reports a win rate (score per game: win 1, draw ½, loss 0) with a 95% CI. "Bot A is better than bot B" means the whole interval lies above 50%.
- **Options:**
  - Wilson interval over games: good for small n and extreme rates, but it assumes independent Bernoulli trials.
  - Normal approximation over games: same independence problem.
  - Normal approximation over **pairs**.
- **Decision:** One sample per pair: `pairScore = (score₁ + score₂) / 2 ∈ {0, ¼, ½, ¾, 1}`. The CI is `mean ± 1.96·s/√n` over pairs, clamped to [0, 1].
- **Why:**
  - The two games of a pair are **not independent**, since they share a deal. Their outcomes are negatively correlated, because the luck favours each bot in turn. Wilson or a per-game normal interval would ignore that and come out too wide, throwing away the variance reduction the pairing paid for. A test shows that 50 luck-only split pairs give a zero-width interval at 50%, while the naive per-game interval is about ±10%.
  - Pair scores aren't Bernoulli, so Wilson doesn't apply to them directly.
  - With 50–100 bounded samples, the CLT makes the normal approximation reasonable.
- **Trade-offs:** The normal approximation is poor for very small matches or rates near 0/1. A sweep of wins gives a zero-width interval; the conclusion it supports (clearly better) is still correct. Draws count as ½, consistent with Elo.
- **How many games:** The measured pair-score standard deviation is σ ≈ 0.26 (Greedy vs Monte Carlo). With 100 pairs (200 games) the CI half-width is about 1.96 · 0.26 / √100 ≈ ±5%, so a true win rate of roughly 55% or more is distinguishable from 50%. Halving the width needs four times the games.
- **Caveat:** A match is one look at a fixed sample size. Rerunning a comparison until it passes, or tweaking a bot and retesting on the same seeds, is multiple testing and overfits to those deals. A final comparison should use fresh seeds.

*D24 (Arena UI), D25 (Hall of Fame and performance ratings), D26 (BotRepository) and D27 (repeated promotion attempts) were removed with the Arena in v3. D27's multiple-testing point lives on as the caveat in D23.*

### D28. Ranks are labels (`'2'`…`'A'`), not numbers
- **Context:** A card's rank never affects the score. Points depend only on the hand type, so a pair of twos equals a pair of aces. Rank is used for two things: equality (pairs, trips, quads, full house) and order (straights only).
- **Options:**
  - Numbers 2–14: the evaluator does plain arithmetic, and display code converts 11–14 to J, Q, K, A.
  - Labels `'2'`…`'9'`, `'T'`, `'J'`, `'Q'`, `'K'`, `'A'`: data reads as cards, and the code that needs order converts a label to its position in `RANKS`.
- **Decision:** Labels. `RANKS` lists them lowest to highest, and a rank's order is its index there. Order is looked up in two places: `isStraight` in the evaluator, and Greedy's straight-draw check. Equality needs no conversion.
- **Trade-offs:**
  - Logged and stored cards are readable (`{ rank: 'K', suit: 'H' }`), and the display mappings are gone, apart from showing `'T'` as "10".
  - The straight check pays one lookup per card. Measured on the Monte Carlo preset, a move takes about 19–21 ms instead of 14–16 ms (Node, laptop). The timings quoted in D11 and D19 were taken before this change.
  - Behaviour is unchanged: the same seeds produce exactly the same tournament results before and after.

### D29. Where definitions live
- **Rule:** In each folder, a type that more than one file uses lives in that folder's `types.ts`. A type used by one file stays in that file.
- **Engine:** `engine/types.ts` holds the whole data model, including `HandType`, `LineScore`, `BoardScore` and the `Rng` interface, which used to sit in the files that produce them. `engine/rules.ts` holds the two numbers that define the game: `BOARD_SIZE` and the `HAND_POINTS` table.
- **What is not in `rules.ts`:**
  - `SUITS` and `RANKS` stay in `types.ts`. They define what a card is, and the `Suit` and `Rank` types are derived from them.
  - Numbers owned by one module stay with it: `PLAYOUTS` and the Greedy bonuses in the bots, the bot move delay in the UI.
- **`BOARD_SIZE` is not freely changeable.** The evaluator classifies five-card poker hands, so another size would need a different evaluator. The file is called `rules`, not `config`, for that reason.
- **Bots:** `bots/types.ts` holds the bot contract (`BotPlayer`, `BotDecision`, `BotHelpers`, `ChooseMove`, `PresetBot`). The preset `.js` files still declare their own `BOARD_SIZE` and Greedy repeats four point values, because plain scripts cannot import. That duplication goes away when the presets become TypeScript modules.
- **Evaluation:** `GameRecord` and `GameResult` stay in `match.ts`. They are that file's output, and only `stats.ts` and the CLI read them.
