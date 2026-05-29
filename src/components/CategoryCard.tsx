import type { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  index: number;
  onClick: (id: string) => void;
}

export default function CategoryCard({ category, index, onClick }: CategoryCardProps) {
  const number = String(index + 1).padStart(2, '0');
  return (
    <button
      onClick={() => onClick(category.id)}
      className="cat-tile group anim-rise"
      // staggered reveal — index-driven, must be inline
      // eslint-disable-next-line react/forbid-dom-props
      style={{ animationDelay: `${0.05 * index}s` }}
      aria-label={`Öppna kategori ${category.name}`}
    >
      <div className="flex items-start justify-between mb-6">
        <span className="font-mono text-xs tracking-[0.2em] cat-accent">Nº {number}</span>
        <span className="cat-emoji" aria-hidden>{category.emoji}</span>
      </div>

      <div className="tick-rule mb-3" />

      <h3 className="font-display fv-card font-light leading-[0.95] text-3xl md:text-4xl tracking-tight">
        {category.name}
      </h3>

      <div className="mt-6 flex items-center justify-between font-mono text-[10px] tracking-[0.22em] uppercase opacity-80">
        <span>Öppna sektion</span>
        <span aria-hidden>→</span>
      </div>
    </button>
  );
}
