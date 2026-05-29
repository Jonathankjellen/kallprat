import { useState } from 'react';

interface FollowUpQuestionsProps {
  questions: string[];
}

export default function FollowUpQuestions({ questions }: FollowUpQuestionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (questions.length === 0) return null;

  return (
    <aside className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ink-link eyebrow"
        aria-expanded={isOpen ? 'true' : 'false'}
      >
        <span
          aria-hidden
          className={`inline-block transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
        >
          ▸
        </span>
        Marginalia · {questions.length} följdfrågor
      </button>

      {isOpen && (
        <ul className="mt-5 space-y-4 anim-fade">
          {questions.map((q, i) => (
            <li
              key={i}
              className="marginalia flex gap-4 items-start anim-rise"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-ink-faint)] pt-2 min-w-[2.5rem]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="font-display fv-marg text-xl md:text-2xl leading-snug text-[color:var(--color-ink-soft)]">
                {q}
              </p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
