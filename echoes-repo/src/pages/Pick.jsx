import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Shell, { PageHeader } from '../components/Shell';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { QUESTIONS, CHAPTERS } from '../mock/data';
import { fillQ } from './Home';
import { profileView } from '../lib/loc';

// The question bank as a table of contents. One chapter open at a time; a question row is just the question —
// clicking it opens a small sheet where you record it, reword it, or (for your own) remove it.
export default function Pick() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const loc = useLocation();
  const { state, addQuestion, updateQuestion, removeQuestion } = useStore();
  const p = profileView(state.profile, lang);
  const mine = state.customQuestions || [];
  const [openCh, setOpenCh] = useState('own');   // first chapter open on arrival; opening another closes it
  const [sel, setSel] = useState(null); const [draft, setDraft] = useState(''); const [editing, setEditing] = useState(false);
  const [own, setOwn] = useState('');
  const asked = new Set(state.stories.map((s) => s.questionId));
  useEffect(() => { if (loc.state?.own) setOpenCh('own'); }, [loc.state]);
  const toggle = (id) => { setOpenCh(openCh === id ? null : id); if (openCh === id) return; setTimeout(() => document.getElementById('ch-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  const record = (q, text) => nav(q.id.startsWith('cq-') ? '/record/own?text=' + encodeURIComponent(text) + '&cq=' + q.id : '/record/' + q.id);
  const openSheet = (q, text) => { setSel({ q, text }); setDraft(text); setEditing(false); };
  const saveEdit = () => {
    const text = draft.trim(); if (!text) return;
    if (sel.q.id.startsWith('cq-')) { updateQuestion(sel.q.id, { text }); setSel({ ...sel, text }); }
    else { const id = addQuestion({ text, source: 'edited', from: sel.q.id }); setSel({ q: { id, source: 'edited' }, text }); setOpenCh('own'); }
    setEditing(false);
  };
  const srcLabel = (q) => q.source === 'followup' ? (zh ? `${q.who || '家人'}读「${q.fromTitle}」时追问的` : `Asked by ${q.who || 'family'} after “${q.fromTitle}”`) : q.source === 'edited' ? (zh ? '改自问题库' : 'Reworded from the library') : (zh ? '自己写的' : 'Written by the family');
  const chapters = [{ id: 'own', label: zh ? '我们家的问题' : 'Our own questions', n: mine.length }, ...CHAPTERS.map((c) => ({ id: c.id, label: zh ? c.label : c.labelEn, n: QUESTIONS.filter((q) => q.cat === c.id).length }))];

  const Row = ({ q, text, meta }) => (
    <button className="w-full text-left py-5 cursor-pointer group grid gap-1" onClick={() => openSheet(q, text)}>
      <span className="q-text group-hover:underline underline-offset-[6px] decoration-1">{text}</span>
      {meta && <span className="text-[12.5px] text-ink-3">{meta}</span>}
    </button>
  );

  return (
    <Shell>
      <PageHeader back eyebrow={t('pick.eyebrow', { name: p.name })} title={t('pick.title')} sub={zh ? '像家里人聊天那样问：一次只问一件具体的事。点一个问题，可以直接录，也可以先改成你们家说话的口气。' : 'Ask the way family talks: one concrete thing at a time. Tap a question to record it, or reword it first.'} />
      <div className="grid md:grid-cols-[200px_1fr] gap-12 items-start">
        <nav className="md:sticky md:top-24 grid gap-2.5 text-[14px]">
          {chapters.map((c) => <button key={c.id} className={(openCh === c.id ? 'link' : 'link-soft') + ' w-fit text-left'} onClick={() => toggle(c.id)}>{c.label}{c.id === 'own' && c.n ? ` · ${c.n}` : ''}</button>)}
        </nav>
        <div className="min-w-0">
          {chapters.map((c) => {
            const on = openCh === c.id;
            return (
              <section key={c.id} id={'ch-' + c.id} className="scroll-mt-24 border-t border-ink last:border-b">
                <button className="w-full flex items-baseline justify-between py-5 cursor-pointer text-left" onClick={() => toggle(c.id)} aria-expanded={on}>
                  <h2 className="h2 m-0">{c.label}</h2><span className="ed-caps">{c.n} {on ? '–' : '+'}</span>
                </button>
                {on && (
                  <div className="divide-y divide-line border-t border-line pb-6">
                    {c.id === 'own' ? (
                      <>
                        {mine.map((q) => <Row key={q.id} q={q} text={q.text} meta={srcLabel(q)} />)}
                        <div className="py-5">
                          <textarea className="input q-text min-h-[88px]" value={own} onChange={(e) => setOwn(e.target.value)} placeholder={t('pick.ownPh')} />
                          <div className="flex items-center gap-6 mt-3"><button className="btn btn-primary btn-sm" disabled={!own.trim()} onClick={() => { const id = addQuestion({ text: own.trim() }); setOwn(''); nav('/record/own?text=' + encodeURIComponent(own.trim()) + '&cq=' + id); }}>{zh ? '就问这个，去录' : 'Record this'} →</button><button className="link-soft text-[13.5px]" disabled={!own.trim()} onClick={() => { addQuestion({ text: own.trim() }); setOwn(''); }}>{zh ? '先存着' : 'Save for later'}</button></div>
                        </div>
                      </>
                    ) : QUESTIONS.filter((q) => q.cat === c.id).map((q) => <Row key={q.id} q={q} text={fillQ(q, p, lang)} meta={asked.has(q.id) ? (zh ? '已经录过 · 可以再录一次' : 'Recorded before · can record again') : null} />)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {sel && (
        <div className="fixed inset-0 z-30 bg-ink/40 flex items-center justify-center p-5" onClick={() => setSel(null)}>
          <div className="bg-paper border border-ink p-8 max-w-[560px] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-baseline justify-between mb-4"><span className="ed-caps">{t('rec.eyebrow', { name: p.mode === 'self' ? (zh ? '你' : 'yourself') : p.name })}</span><button className="ed-caps hover:!text-ink cursor-pointer" onClick={() => setSel(null)}>{zh ? '关闭' : 'Close'} ✕</button></div>
            {editing ? (
              <>
                <textarea className="input serif font-medium text-[22px] leading-[1.5] min-h-[120px]" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                <p className="text-[12.5px] text-ink-3 mt-2 mb-5">{zh ? '改过的问题会存到「我们家的问题」里。' : 'Reworded questions are kept under “Our own questions”.'}</p>
                <div className="flex items-center gap-6"><button className="btn btn-primary" onClick={saveEdit}>{zh ? '保存' : 'Save'}</button><button className="link-soft text-[14px]" onClick={() => { setEditing(false); setDraft(sel.text); }}>{t('common.cancel')}</button></div>
              </>
            ) : (
              <>
                <p className="serif font-medium text-[26px] leading-[1.45] m-0 mb-7">{sel.text}</p>
                <div className="flex flex-wrap items-center gap-6">
                  <button className="btn btn-primary btn-lg" onClick={() => record(sel.q, sel.text)}>{zh ? '录这个' : 'Record this'} →</button>
                  <button className="link-soft text-[14.5px]" onClick={() => setEditing(true)}>{zh ? '改一改说法' : 'Reword it'}</button>
                  {sel.q.id.startsWith('cq-') && <button className="link-soft text-[14.5px]" onClick={() => { removeQuestion(sel.q.id); setSel(null); }}>{zh ? '删除' : 'Remove'}</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
