import type { Category, Kallprat } from '../types';
import SectionRow from './CategoryCard';
import HeroFeature from './HeroFeature';
import Marquee from './Marquee';

interface CategoryListProps {
  categories: Category[];
  allKallprat: Kallprat[];
  onSelect: (id: string) => void;
}

export default function CategoryList({
  categories,
  allKallprat,
  onSelect,
}: CategoryListProps) {
  const byId: Record<string, Category> = Object.fromEntries(
    categories.map((c) => [c.id, c]),
  );

  // For each category: count + a teaser (first item's text, trimmed)
  const meta = categories.map((c) => {
    const items = allKallprat.filter((k) => k.category === c.id);
    const sample = items[Math.floor(Math.random() * items.length)];
    let teaser = sample?.text ?? '';
    if (teaser.length > 90) teaser = teaser.slice(0, 88).trimEnd() + '…';
    return { id: c.id, count: items.length, teaser };
  });

  return (
    <main className="relative z-10">
      {/* Hero feature ============================================== */}
      <div className="max-w-5xl mx-auto px-6">
        <HeroFeature
          pool={allKallprat}
          categoriesById={byId}
          onOpenSection={onSelect}
        />
      </div>

      {/* Marquee ticker ============================================ */}
      <div className="my-8">
        <Marquee categories={categories} />
      </div>

      {/* Section index ============================================= */}
      <section className="max-w-5xl mx-auto px-6 pt-6 pb-20">
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end mb-8">
          <div>
            <p className="eyebrow mb-3">Innehåll <span className="ornament" /> Sektion I</p>
            <h2 className="font-display fv-hero font-light text-4xl md:text-6xl leading-[0.95] tracking-tight max-w-xl">
              Sex avdelningar,<br />
              <em className="not-italic text-[color:var(--color-accent)]">
                en plats att börja prata.
              </em>
            </h2>
          </div>
          <p className="font-mono text-xs leading-relaxed text-[color:var(--color-ink-soft)] max-w-xs">
            Glid med blicken nedför listan. Sektionerna är ordnade som i en
            tidskrift — inte som ett bord — för att uppmuntra slumpvis upptäckt.
          </p>
        </div>

        <div className="rule-double mb-2" />

        <ul className="list-none">
          {categories.map((cat, i) => {
            const m = meta.find((x) => x.id === cat.id)!;
            return (
              <li
                key={cat.id}
                className="anim-rise"
                // staggered list reveal
                // eslint-disable-next-line react/forbid-dom-props
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <SectionRow
                  category={cat}
                  index={i}
                  count={m.count}
                  teaser={m.teaser}
                  onClick={onSelect}
                />
              </li>
            );
          })}
        </ul>

        {/* Colophon */}
        <footer className="mt-16 pt-6 border-t border-[color:var(--color-rule)] flex flex-col md:flex-row justify-between gap-3 eyebrow">
          <span>Tryckt på serverlös papper</span>
          <span className="hidden md:inline">⎯⎯ Kallprat ⎯⎯</span>
          <span>Redaktion: du själv</span>
        </footer>
      </section>
    </main>
  );
}
