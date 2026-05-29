import type { Category } from '../types';

interface SectionRowProps {
  category: Category;
  index: number;
  count: number;
  teaser?: string;
  onClick: (id: string) => void;
}

export default function SectionRow({
  category,
  index,
  count,
  teaser,
  onClick,
}: SectionRowProps) {
  const number = String(index + 1).padStart(2, '0');
  return (
    <button
      onClick={() => onClick(category.id)}
      className="sec-row group"
      aria-label={`Öppna sektion ${category.name}, ${count} repliker`}
    >
      <span className="sec-num">Nº&nbsp;{number}</span>

      <span className="block">
        <span className="sec-name block">{category.name}</span>
        {teaser && (
          <span className="sec-teaser">“{teaser}”</span>
        )}
      </span>

      <span className="sec-meta">
        <span className="sec-emoji" aria-hidden>{category.emoji}</span>
        <span className="sec-count">{String(count).padStart(2, '0')}</span>
        <span className="sec-arrow" aria-hidden>→</span>
      </span>
    </button>
  );
}
