interface HeaderProps {
  onBack: (() => void) | null;
}

const today = new Date().toLocaleDateString('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function Header({ onBack }: HeaderProps) {
  return (
    <header className="relative z-10">
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center justify-between eyebrow">
          <span>Vol. I &nbsp;·&nbsp; Nº 01</span>
          <span className="hidden sm:inline">{today}</span>
          <span>Pris — gratis</span>
        </div>

        <div className="hairline mt-3" />

        <div className="flex items-end justify-between gap-6 mt-6">
          <button
            type="button"
            onClick={onBack ?? undefined}
            className={`text-left ${onBack ? 'cursor-pointer' : 'cursor-default'}`}
            aria-label={onBack ? 'Tillbaka till kategorier' : 'Kallprat'}
          >
            <h1 className="font-display fv-mast font-light tracking-tighter leading-[0.85] text-[clamp(3.5rem,12vw,8rem)]">
              Kallprat<span className="text-[color:var(--color-accent)]">.</span>
            </h1>
          </button>

          <div className="hidden md:flex flex-col items-end gap-2 pb-3">
            <span className="stamp stamp-accent">Sv · Almanacka</span>
            <span className="eyebrow">
              Sex kategorier <span className="ornament" /> oändliga samtal
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="hairline flex-1" />
          <p className="eyebrow text-center whitespace-nowrap">
            En liten tidning för den som vill prata med någon
          </p>
          <div className="hairline flex-1" />
        </div>

        {onBack && (
          <div className="mt-6 flex items-center justify-between">
            <button onClick={onBack} className="ink-link eyebrow">
              ← Åter till innehållsförteckningen
            </button>
            <span className="eyebrow hidden sm:inline">Sektion II</span>
          </div>
        )}
      </div>
    </header>
  );
}
