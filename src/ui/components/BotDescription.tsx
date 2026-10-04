import type { ReactNode } from 'react';
import type { PresetBot, PresetId } from '../../bots/types';

const HOW_IT_PLAYS: Record<PresetId, ReactNode> = {
  random: (
    <p>
      Random picks one of the empty cells, each with the same chance. It has no strategy, which
      makes it the reference point: the other two bots are rated by how much better they do than
      Random.
    </p>
  ),

  greedy: (
    <>
      <p>
        Greedy picks the cell that gives the best result immediately, judging only the card it is
        placing.
      </p>

      <h3>How it chooses</h3>
      <p>
        A card placed in a cell joins two hands at once: one row and one column. One of those
        belongs to Greedy and the other to its opponent. For every empty cell, Greedy works out
      </p>
      <p className="formula">
        advantage = how much its own hand improves − how much the opponent&apos;s hand improves
      </p>
      <p>
        and plays the cell with the largest advantage. Subtracting the opponent&apos;s improvement
        is what makes Greedy block: a cell that would complete the opponent&apos;s flush scores
        badly, so the card goes elsewhere.
      </p>

      <h3>How it values a hand</h3>
      <p>
        A finished hand of five cards is worth its poker points. An unfinished hand is worth what it
        already holds, plus a small bonus for what it could still become:
      </p>
      <table>
        <thead>
          <tr>
            <th>The hand holds</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Four of a kind</td>
            <td>40</td>
          </tr>
          <tr>
            <td>Three of a kind</td>
            <td>10, plus 3 because it can become a full house or four of a kind</td>
          </tr>
          <tr>
            <td>Two pair</td>
            <td>5, plus 1 because it can become a full house</td>
          </tr>
          <tr>
            <td>One pair</td>
            <td>2, plus 1 because it can improve</td>
          </tr>
          <tr>
            <td>Two or more cards, all the same suit</td>
            <td>plus 1 per card: a flush is still possible</td>
          </tr>
          <tr>
            <td>Two or more cards that fit inside one straight</td>
            <td>plus 1 per card: a straight is still possible</td>
          </tr>
        </tbody>
      </table>
      <p>
        The bonuses are small on purpose, so a hand that is already made always counts for more than
        one that is only hoped for.
      </p>
      <p>
        To decide whether cards fit inside one straight, Greedy checks that no two share a rank,
        then tries each of the ten straights from A-2-3-4-5 to 10-J-Q-K-A.
      </p>

      <h3>Where it falls short</h3>
      <p>
        Greedy never looks past the card it is placing. It ignores the next card, and it values a
        possible hand the same however likely that hand is: three hearts in a row earn the same
        bonus whether ten hearts are left in the deck or one.
      </p>
    </>
  ),

  montecarlo: (
    <>
      <p>
        Monte Carlo judges a cell by what tends to happen after the card is placed there. It
        finishes the game many times with randomly dealt cards and keeps the cell that does best on
        average.
      </p>

      <h3>How it chooses</h3>
      <ol>
        <li>
          <b>List the cards still face down.</b> These are the 52 cards minus those on the board,
          the card being placed and the next card.
        </li>
        <li>
          <b>Imagine 100 ways the rest of the game could go.</b> Each one is a random order for the
          face-down cards (after the known next card) and a random order in which the empty cells
          get filled.
        </li>
        <li>
          <b>Try every empty cell.</b> Place the card there, then finish the game in each of the 100
          ways, dealing the remaining cards into the remaining cells.
        </li>
        <li>
          <b>Score each finished board</b> as Monte Carlo&apos;s total minus its opponent&apos;s
          total.
        </li>
        <li>
          <b>Play the cell with the highest score added up over all 100 finishes.</b>
        </li>
      </ol>

      <h3>Every cell is tested against the same 100 finishes</h3>
      <p>
        If each cell had its own random finishes, one cell could come out ahead just by being dealt
        better cards. With shared finishes, the only thing that differs between two cells is the
        move itself. (This technique is known as common random numbers.)
      </p>

      <h3>The finishes do not model turns</h3>
      <p>
        The rest of the game is filled in at random for both players, and a random placement is the
        same whoever makes it. So a finish is simply the remaining cards landing on the remaining
        cells in a random order.
      </p>

      <h3>Where it falls short</h3>
      <ul>
        <li>
          The random finishes never block. A hand that a real opponent would spoil looks better to
          Monte Carlo than it is.
        </li>
        <li>
          It aims for the largest average margin, which is not always the move most likely to win.
        </li>
        <li>
          100 finishes per cell is an estimate. Two cells of similar value can be ranked the wrong
          way round.
        </li>
      </ul>
    </>
  ),
};

interface BotDescriptionProps {
  bot: PresetBot;
  onDuel(): void;
}

export function BotDescription({ bot, onDuel }: BotDescriptionProps) {
  return (
    <section className="panel bot-description">
      <div className="bot-description-heading">
        <h2>
          {bot.name} · rated {bot.ratingFromTournament}
        </h2>
        <button onClick={onDuel}>Duel</button>
      </div>
      {HOW_IT_PLAYS[bot.id]}
    </section>
  );
}
