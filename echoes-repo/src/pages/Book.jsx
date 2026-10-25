import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { getAudioUrl } from '../lib/db';
import { useFamilyName } from '../components/Shell';
import { Mark } from '../components/Illos';

// Export → a printable story book. The browser's print dialog saves it as a PDF ("Save as PDF"),
// which keeps Chinese fonts and photos exact without any server work. Free for everyone.
// Layout: cover · contents · one story per page (title, storyteller, era/place, text, notes, photos).
export default function Book() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate();
  const { state, allStories, live } = useStore(); const fam = useFamilyName();
  const [photos, setPhotos] = useState({}); const [ready, setReady] = useState(false);
  const tellerOf = (s) => state.storytellers.find((t) => t.id === s.storytellerId);
  // Oldest first within each storyteller, storytellers in the order they were added.
  const order = (t) => state.storytellers.findIndex((x) => x.id === t);
  const stories = [...allStories].filter((s) => !s.pending).sort((a, b) => (order(a.storytellerId) - order(b.storytellerId)) || String(a.date).localeCompare(String(b.date)));
  const tellers = [...new Set(stories.map((s) => tellerOf(s)?.name).filter(Boolean))];
  const dates = stories.map((s) => s.date).filter(Boolean).sort();

  // Sign every photo link before printing (links are private; they last an hour).
  useEffect(() => {
    let alive = true;
    (async () => {
      const out = {};
      for (const s of stories) for (const m of (s.media || []).filter((x) => x.kind === 'photo')) {
        try { out[m.id || m.path] = m.url || (live && m.path ? await getAudioUrl(m.path) : null); } catch { /* a missing photo just doesn't print */ }
      }
      if (alive) { setPhotos(out); setReady(true); }
    })();
    return () => { alive = false; };
  }, [allStories.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open the print dialog once the photos have loaded.
  useEffect(() => {
    if (!ready || !stories.length) return;
    const imgs = [...document.querySelectorAll('.book img')];
    Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; })))).then(() => setTimeout(() => window.print(), 400));
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = (p, terms) => p.split(/(\[[^\]]+\])/g).map((piece, k) => {
    const m = piece.match(/^\[([^\]]+)\]$/); if (!m) return <Fragment key={k}>{piece}</Fragment>;
    const ok = terms.some((t) => t.word === m[1] && t.status === 'ok');
    return ok ? <mark key={k}>{m[1]}</mark> : <Fragment key={k}>{m[1]}</Fragment>;
  });

  return (
    <div className="book-wrap">
      <div className="book-bar no-print">
        <button className="link-soft text-[14px]" onClick={() => nav('/settings')}>{zh ? '← 返回设置' : '← Back to Settings'}</button>
        <span className="flex-1" />
        <span className="text-[13.5px] text-ink-2 hidden sm:inline">{zh ? '在打印窗口里，「目标打印机」选择「存储为 PDF」，再点保存。' : 'In the print window, choose “Save as PDF” as the destination, then Save.'}</span>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>{zh ? '保存为 PDF' : 'Save as PDF'}</button>
      </div>
      <div className="book">
        {/* cover */}
        <section className="book-page book-cover">
          <Mark size={120} />
          <h1>{fam}</h1>
          <p className="book-sub">{zh ? '的故事' : 'Family stories'}</p>
          {tellers.length > 0 && <p className="book-tellers">{zh ? '讲述：' : 'Told by '}{tellers.join(zh ? '、' : ', ')}</p>}
          <p className="book-meta">{stories.length} {zh ? '个故事' : stories.length === 1 ? 'story' : 'stories'}{dates.length ? ` · ${dates[0].slice(0, 7)} – ${dates[dates.length - 1].slice(0, 7)}` : ''}</p>
          <p className="book-brand">余音 · Echoes</p>
        </section>
        {/* contents */}
        {stories.length > 0 && (
          <section className="book-page">
            <h2 className="book-h2">{zh ? '目录' : 'Contents'}</h2>
            <ol className="book-toc">{stories.map((s) => <li key={s.id}><span>{s.title || (zh ? '（无标题）' : '(untitled)')}</span><em>{tellerOf(s)?.name}</em></li>)}</ol>
          </section>
        )}
        {stories.length === 0 && <p className="text-center text-ink-2 py-20">{zh ? '还没有故事可以导出。' : 'No stories to export yet.'}</p>}
        {/* stories */}
        {stories.map((s, i) => {
          const notes = (s.terms || []).filter((t) => t.status === 'ok');
          const pics = (s.media || []).filter((m) => m.kind === 'photo').map((m) => photos[m.id || m.path]).filter(Boolean);
          return (
            <article key={s.id} className="book-page book-story">
              <div className="book-eyebrow">{String(i + 1).padStart(2, '0')} · {[tellerOf(s)?.name, s.era, s.place].filter(Boolean).join(' · ')}</div>
              <h2 className="book-title">{s.title}</h2>
              {s.question && <p className="book-q">{zh ? '问：' : 'Q: '}{s.question}</p>}
              <div className="book-text">{(s.text?.first || []).map((p, k) => <p key={k}>{text(p, s.terms || [])}</p>)}</div>
              {pics.length > 0 && <div className="book-photos">{pics.map((u, k) => <img key={k} src={u} alt="" />)}</div>}
              {notes.length > 0 && <dl className="book-notes"><div className="book-notes-h">{zh ? '注释' : 'Notes'}</div>{notes.map((t) => <div key={t.id || t.word}><dt>{t.word}</dt><dd>{t.note}</dd></div>)}</dl>}
              <p className="book-foot">{s.date}{s.duration ? ` · ${zh ? '原声' : 'audio'} ${s.duration}` : ''} · {zh ? '原声保存在余音里' : 'Original audio kept in Echoes'}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
