import type { Card, Suit } from '../../engine/types';

const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

export function CardView({
  card,
  size = 'normal',
}: {
  card: Card | null;
  size?: 'normal' | 'large';
}) {
  if (!card) return <div className={`card card-${size} card-none`}>–</div>;
  const red = card.suit === 'H' || card.suit === 'D';
  return (
    <div className={`card card-${size} ${red ? 'card-red' : 'card-black'}`}>
      <span className="card-rank">{card.rank === 'T' ? '10' : card.rank}</span>
      <span className="card-suit">{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}
