import { Fragment, useState } from 'react';

// Renders paragraphs with [term] markers as <mark>. Terms come from story.terms.
// mode="glossary": reader view — tapping a confirmed mark shows its note in a small popover (no separate list).
// mode="review":   editor view — marks are highlighted by status; click selects the note card on the side.
export default function StoryText({ paragraphs, terms, active, onTerm, editable, onChange, className = '', mode = 'review' }) {
  const [open, setOpen] = useState(null);
  if (editable) {
    return (
      <div className={'story ' + className}>
        {paragraphs.map((para, i) => (
          <textarea key={i} className="w-full bg-transparent border border-dashed border-line p-2 -m-2 mb-3 story resize-none focus:border-ochre outline-none" rows={Math.max(2, Math.ceil(para.length / 34))}
            value={para.replace(/[\[\]]/g, '')} onChange={(e) => onChange(i, e.target.value)} />
        ))}
      </div>
    );
  }
  const render = (para, pi) => para.split(/(\[[^\]]+\])/g).map((piece, k) => {
    const m = piece.match(/^\[([^\]]+)\]$/);
    if (!m) return <Fragment key={k}>{piece}</Fragment>;
    const term = terms.find((t) => t.word === m[1]);
    if (mode === 'glossary') {
      if (!term || term.status !== 'ok') return <Fragment key={k}>{m[1]}</Fragment>;   // unconfirmed guesses never show to readers
      const key = pi + ':' + k; const isOpen = open === key;
      return (
        <span key={k} className="relative inline-block">
          <mark className={'ok ' + (isOpen ? 'active' : '')} onClick={() => setOpen(isOpen ? null : key)}>{m[1]}</mark>
          {isOpen && (
            <span className="absolute left-0 top-full mt-2 z-20 w-[260px] bg-ink text-paper text-[13.5px] leading-snug px-4 py-3 font-sans not-italic" style={{ fontFamily: 'var(--font-sans)' }}>
              <span className="block font-bold text-[14px] mb-0.5">{term.word}{term.orig && term.orig !== term.word && <span className="font-normal opacity-70 ml-1.5">{term.orig}</span>} <span className="text-[11px] font-normal opacity-70 tracking-wider ml-1">{term.kind}</span></span>
              <span className="block opacity-90">{term.note}</span>
            </span>
          )}
        </span>
      );
    }
    const cls = (term?.status === 'ok' ? 'ok ' : '') + (active === term?.id ? 'active' : '');
    return <mark key={k} className={cls} onClick={() => onTerm?.(term)}>{m[1]}</mark>;
  });
  return <div className={'story ' + className}>{paragraphs.map((p, i) => <p key={i}>{render(p, i)}</p>)}</div>;
}
