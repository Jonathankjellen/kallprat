import type { Category } from '../types';

interface MarqueeProps {
  categories: Category[];
}

const TAGS = ['Volym I', 'Tryckt idag', 'Slumpvis ordning', 'Sex sektioner', 'Bara på papper'];

export default function Marquee({ categories }: MarqueeProps) {
  const items = categories.map((c) => ({ label: c.name, emoji: c.emoji }));
  const sequence = [...items, ...TAGS.map((t) => ({ label: t, emoji: '✦' }))];
  // Double the sequence so the -50% scroll loops seamlessly
  const loop = [...sequence, ...sequence];

  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {loop.map((it, i) => (
          <span key={i} className="marquee-item">
            <span>{it.label}</span>
            <span className="dot">✦</span>
            <span>{it.emoji}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
