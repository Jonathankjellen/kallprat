import { useState, useCallback, useRef } from 'react';
import type { Kallprat, Category } from '../types';
import FollowUpQuestions from './FollowUpQuestions';

interface KallpratViewProps {
  category: Category;
  items: Kallprat[];
  categories: Category[];
  onSelectCategory: (id: string) => void;
}

function pickDifferent(items: Kallprat[], current: Kallprat | null): Kallprat {
  if (items.length <= 1) return items[0];
  let next = items[Math.floor(Math.random() * items.length)];
  let safety = 0;
  while (current && next.id === current.id && safety < 8) {
    next = items[Math.floor(Math.random() * items.length)];
    safety++;
  }
  return next;
}

export default function KallpratView({
  category,
  items,
  categories,
  onSelectCategory,
}: KallpratViewProps) {
  const [current, setCurrent] = useState<Kallprat>(() => pickDifferent(items, null));
  const [animKey, setAnimKey] = useState(0);
  const drawnRef = useRef(1);

  const handleShuffle = useCallback(() => {
    setCurrent((c) => pickDifferent(items, c));
    setAnimKey((k) => k + 1);
    drawnRef.current += 1;
  }, [items]);

  const drawn = String(drawnRef.current).padStart(3, '0');
  const total = String(items.length).padStart(3, '0');
  const sectionNum = String(
    categories.findIndex((c) => c.id === category.id) + 1,
  ).padStart(2, '0');

  return (
    <main className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
      {/* Section label */}
      <section className="flex items-center justify-between gap-6 py-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden>{category.emoji}</span>
          <div>
            <p className="eyebrow">Sektion {sectionNum} · {category.name}</p>
            <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--color-ink-faint)] mt-1">
              {items.length} repliker i denna avdelning
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--color-ink-faint)] uppercase">
            Dragning
          </p>
          <p className="font-display text-3xl leading-none mt-1 tabular-nums">
            {drawn}<span className="text-[color:var(--color-ink-faint)]">/{total}</span>
          </p>
        </div>
      </section>

      <div className="rule-double" />

      {/* The quote card */}
      <article key={animKey} className="relative mt-12 mb-10">
        <span
          aria-hidden
          className="kp-mark anim-stamp absolute -top-12 -left-2 md:-left-8 text-[10rem] md:text-[14rem]"
        >
          “
        </span>

        <p className="kp-quote anim-ink relative pl-2 md:pl-12 text-[clamp(2rem,6vw,4rem)]">
          {current.text}
        </p>

        <div className="mt-6 pl-2 md:pl-12 flex items-center justify-between">
          <div className="flex items-center gap-3 anim-fade delay-3">
            <span className="hairline w-12" />
            <span className="eyebrow">Replik Nº {current.id.toUpperCase()}</span>
          </div>
          <span aria-hidden className="kp-mark kp-mark-soft text-6xl anim-fade delay-4">
            ”
          </span>
        </div>

        <div className="pl-2 md:pl-12 anim-fade delay-4">
          {current.followUp && current.followUp.length > 0 && (
            <FollowUpQuestions key={`fu-${current.id}`} questions={current.followUp} />
          )}
        </div>
      </article>

      <div className="hairline" />

      {/* Action row */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="font-mono text-xs text-[color:var(--color-ink-soft)] max-w-sm">
          Inte rätt stämning? Dra en ny replik ur hatten — eller hoppa till en
          annan sektion nedan.
        </p>
        <button onClick={handleShuffle} className="btn-press" type="button">
          <span aria-hidden>✦</span>
          Slumpa ny replik
          <span aria-hidden>→</span>
        </button>
      </div>

      {/* Section switcher (chips) */}
      <section className="mt-14">
        <div className="flex items-center gap-3 mb-4">
          <span className="hairline flex-1" />
          <span className="eyebrow whitespace-nowrap">Byt sektion</span>
          <span className="hairline flex-1" />
        </div>
        <div className="chips-row" role="tablist">
          {categories.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-current={c.id === category.id ? 'true' : 'false'}
              onClick={() => onSelectCategory(c.id)}
              className="chip"
              type="button"
            >
              <span aria-hidden>{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
