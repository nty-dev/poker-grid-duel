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
  const isRed = card.suit === 'H' || card.suit === 'D';
  return (
    <div className={`card card-${size} ${isRed ? 'card-red' : 'card-black'}`}>
      <span>{card.rank === 'T' ? '10' : card.rank}</span>
      <span>{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}
