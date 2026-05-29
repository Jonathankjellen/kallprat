import type { Category } from '../types';
import CategoryCard from './CategoryCard';

interface CategoryListProps {
  categories: Category[];
  onSelect: (id: string) => void;
}

export default function CategoryList({ categories, onSelect }: CategoryListProps) {
  return (
    <main className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
      {/* Section header */}
      <section className="grid md:grid-cols-[1fr_auto] gap-6 items-end pt-4 pb-10">
        <div>
          <p className="eyebrow mb-3">Innehåll <span className="ornament" /> Sektion I</p>
          <h2 className="font-display fv-hero font-light text-5xl md:text-6xl leading-[0.95] tracking-tight max-w-xl">
            Välj en avdelning,<br />
            <em className="not-italic text-[color:var(--color-accent)]">öppna ett samtal.</em>
          </h2>
        </div>
        <p className="font-mono text-xs leading-relaxed text-[color:var(--color-ink-soft)] max-w-xs">
          Sex sektioner. Hundratals frågor. Tryck på en kategori, slumpa fram en
          replik, och låt tystnaden ta slut.
        </p>
      </section>

      <div className="hairline mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--color-rule)] border border-[color:var(--color-rule)]">
        {categories.map((cat, i) => (
          <div key={cat.id} className="bg-[color:var(--color-paper)]">
            <CategoryCard category={cat} index={i} onClick={onSelect} />
          </div>
        ))}
      </div>

      {/* Colophon */}
      <footer className="mt-16 pt-6 border-t border-[color:var(--color-rule)] flex flex-col md:flex-row justify-between gap-3 eyebrow">
        <span>Tryckt på serverlös papper</span>
        <span className="hidden md:inline">⎯⎯ Kallprat ⎯⎯</span>
        <span>Redaktion: du själv</span>
      </footer>
    </main>
  );
}
