import { useState, useCallback } from 'react';
import type { Kallprat, Category } from '../types';

interface HeroFeatureProps {
  pool: Kallprat[];
  categoriesById: Record<string, Category>;
  onOpenSection: (id: string) => void;
}

function pickDifferent(pool: Kallprat[], current: Kallprat | null): Kallprat {
  if (pool.length <= 1) return pool[0];
  let next = pool[Math.floor(Math.random() * pool.length)];
  let safety = 0;
  while (current && next.id === current.id && safety < 8) {
    next = pool[Math.floor(Math.random() * pool.length)];
    safety++;
  }
  return next;
}

export default function HeroFeature({ pool, categoriesById, onOpenSection }: HeroFeatureProps) {
  const [item, setItem] = useState<Kallprat>(() => pickDifferent(pool, null));
  const [key, setKey] = useState(0);

  const shuffle = useCallback(() => {
    setItem((c) => pickDifferent(pool, c));
    setKey((k) => k + 1);
  }, [pool]);

  const cat = categoriesById[item.category];

  return (
    <section className="feature">
      <div className="flex items-center gap-3 mb-6">
        <span className="stamp stamp-accent">Dagens uppslag</span>
        <span className="hairline flex-1" />
        <span className="eyebrow hidden sm:inline">Bläddra · Slumpa · Öppna</span>
      </div>

      <div className="relative">
        {/* Decorative oversized quote mark */}
        <span
          aria-hidden
          key={`m-${key}`}
          className="kp-mark anim-stamp absolute -top-10 -left-1 md:-top-16 md:-left-6 text-[8rem] md:text-[13rem] pointer-events-none"
        >
          “
        </span>

        <p key={key} className="feature-quote anim-ink relative pl-2 md:pl-10">
          {item.text}
        </p>
      </div>

      <div className="mt-8 pl-2 md:pl-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-3 anim-fade delay-3">
          <span className="text-2xl" aria-hidden>{cat?.emoji}</span>
          <div>
            <p className="eyebrow">Från sektionen</p>
            <p className="font-display text-xl leading-none mt-1">{cat?.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 anim-fade delay-4">
          <button onClick={shuffle} className="btn-press" type="button">
            <span aria-hidden>✦</span>
            Slumpa nytt uppslag
          </button>
          <button
            onClick={() => onOpenSection(item.category)}
            className="ink-link eyebrow"
            type="button"
          >
            Öppna sektion →
          </button>
        </div>
      </div>
    </section>
  );
}
