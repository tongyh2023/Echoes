import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Shell, { Audio, PageHeader, TwoCol, useToast } from '../components/Shell';
import StoryText from '../components/StoryText';
import MediaPanel from '../components/MediaPanel';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { polishParagraph } from '../mock/data';

const split = (s) => s.split(/[,，、;；]/).map((x) => x.trim()).filter(Boolean);

// Review = read the story together and confirm the notes. Two things on screen: the text, and the notes beside it.
// Everything else (AI polish, raw transcript, media, metadata) is one click away, not on the page by default.
export default function Review() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { id } = useParams();
  const { state, setDraft, saveStory, updateStory } = useStore();
  const initial = id ? state.stories.find((s) => s.id === id) : state.draft;
  const [story, setStory] = useState(initial);
  const [editing, setEditing] = useState(false); const [active, setActive] = useState(null); const [showRaw, setShowRaw] = useState(false); const [more, setMore] = useState(false); const [showMedia, setShowMedia] = useState(false); const [meta, setMeta] = useState(false);
  const [polishing, setPolishing] = useState(false); const [history, setHistory] = useState([]); const [fixing, setFixing] = useState(null);
  const [adding, setAdding] = useState(false); const [nw, setNw] = useState({ word: '', kind: '', note: '' });
  const [toast, toastEl] = useToast();
  if (!story) { nav('/home'); return null; }
  const paras = story.text.first;
  const pendingN = story.terms.filter((x) => x.status === 'pending').length;
  const update = (patch) => setStory((s) => ({ ...s, ...patch }));
  // Notes on an already-saved story are written to the database the moment a family member
  // confirms, fixes or removes one — that confirmation is the product's core promise.
  const persist = (patch) => { if (id) updateStory(id, patch); };
  const setPara = (i, v) => update({ text: { ...story.text, first: paras.map((x, k) => (k === i ? v : x)) } });
  const setTerm = (tid, patch) => { const terms = story.terms.map((x) => (x.id === tid ? { ...x, ...patch } : x)); update({ terms }); if (patch.status) persist({ terms }); };
  const removeTerm = (tid) => { const tm = story.terms.find((x) => x.id === tid); const next = { terms: story.terms.filter((x) => x.id !== tid), text: { ...story.text, first: paras.map((p) => p.split('[' + tm.word + ']').join(tm.word)) } }; update(next); persist(next); };
  const addTerm = () => {
    const w = nw.word.trim(); if (!w) return; let marked = false;
    const first = paras.map((p) => { if (marked || p.includes('[' + w + ']') || !p.includes(w)) return p; marked = true; return p.replace(w, '[' + w + ']'); });
    const next = { terms: [...story.terms, { id: 'tm-' + Date.now(), word: w, kind: nw.kind.trim() || (zh ? '注释' : 'note'), note: nw.note.trim(), status: 'ok' }], text: { ...story.text, first } };
    update(next); persist(next);
    setNw({ word: '', kind: '', note: '' }); setAdding(false);
  };
  const polishAll = async () => { setMore(false); setPolishing(true); setHistory((h) => [...h, story.text]); const out = []; for (const p of paras) out.push(await polishParagraph(p, 'narrative')); update({ text: { ...story.text, first: out } }); setPolishing(false); };
  const undo = () => { if (!history.length) return; update({ text: history[history.length - 1] }); setHistory((h) => h.slice(0, -1)); };
  const [saving, setSaving] = useState(false); const [saveErr, setSaveErr] = useState('');
  // Save goes to the database; a new story comes back with the id the database assigned.
  const save = async () => {
    setSaveErr(''); setSaving(true);
    try { const saved = await saveStory({ ...story, pending: false }); if (!id) setDraft(null); nav('/story/' + saved.id, { replace: true }); }
    catch (e) { setSaveErr((zh ? '没保存上：' : 'Couldn’t save: ') + (e?.message || '')); setSaving(false); }
  };
  const saveDraft = () => { setDraft({ ...story, pending: true }); toast(t('review.draftSaved')); };
  const metaLine = [story.era, story.place, (story.people || []).join('、'), (story.topics || []).join('、')].filter(Boolean).join(' · ');

  return (
    <Shell>
      {toastEl}
      <PageHeader back backHard backTo={id ? '/story/' + id : '/home'} backConfirm={id ? undefined : (zh ? '这个故事还没保存。离开的话录音会留在草稿里，确定离开？' : 'This story is not saved yet. Leave anyway? The take stays in drafts.')} eyebrow={id ? t('review.editEyebrow') : t('review.eyebrow')} className="!border-line !pb-4 !mb-8" />
      <TwoCol sticky={false} asideWidth={320} main={(
        <article>
          <input className="serif font-medium text-[32px] leading-[1.2] bg-transparent outline-none w-full mb-2 border-b border-transparent focus:border-line" value={story.title} onChange={(e) => update({ title: e.target.value })} />
          {meta ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-6 text-[13.5px]">
              {[['era', false], ['place', false], ['people', true], ['topics', true]].map(([k, list]) => (
                <label key={k} className="block"><span className="ed-caps block mb-1">{t('review.meta.' + k)}</span><input className="field w-full text-[14px]" value={list ? (story[k] || []).join('、') : story[k] || ''} onChange={(e) => update({ [k]: list ? split(e.target.value) : e.target.value })} placeholder={list ? t('review.meta.hint') : ''} autoFocus={k === 'era'} /></label>
              ))}
              <button className="link-soft text-[13px] w-fit sm:col-span-4" onClick={() => setMeta(false)}>{zh ? '收起' : 'Done'}</button>
            </div>
          ) : (
            <p className="text-[14px] text-ink-2 mb-6">{metaLine || (zh ? '年代 · 地点 · 人物' : 'Era · place · people')} <button className="link-soft ml-2 text-[13px]" onClick={() => setMeta(true)}>{zh ? '改' : 'Edit'}</button></p>
          )}
          <div className="flex items-center gap-6 text-[13.5px] mb-6 border-t border-b border-line py-3">
            <button className={editing ? 'link' : 'link-soft'} onClick={() => setEditing((v) => !v)}>{editing ? t('review.doneEdit') : t('review.edit')}</button>
            {history.length > 0 && <button className="link-soft" onClick={undo}>{t('review.undo')}</button>}
            {polishing && <span className="text-ink-3">{t('review.polishing')}</span>}
            <span className="flex-1" />
            <div className="relative"><button className="link-soft" onClick={() => setMore((v) => !v)}>{zh ? '更多' : 'More'} ▾</button>
              {more && <div className="menu !left-auto !right-0"><button onClick={polishAll}>{t('review.polish')}</button><button onClick={() => { setShowRaw((v) => !v); setMore(false); }}>{showRaw ? t('review.hideRaw') : t('review.raw')}</button><button onClick={() => { setShowMedia(true); setMore(false); }}>{zh ? '添加照片 / 视频' : 'Add photos / video'}</button></div>}
            </div>
          </div>
          <StoryText paragraphs={paras} terms={story.terms} active={active} onTerm={(tm) => tm && setActive(tm.id)} editable={editing} onChange={setPara} />
          {showRaw && <div className="mt-6 border-l-2 border-line pl-5"><div className="ed-caps mb-2">{t('review.rawTitle')}</div><div className="story text-[15px] leading-[1.8] text-ink-2" style={{ maxWidth: 'none' }}>{(story.text.raw || paras).map((p, i) => <p key={i}>{p.replace(/[\[\]]/g, '')}</p>)}</div></div>}
          <div className="mt-8"><Audio label={t('review.original')} dur={story.duration} src={story.audioUrl} path={story.audioPath} /></div>
          <p className="text-[12.5px] text-ink-3 mt-2">{t('review.keepHint')}{story.provider && <span className="ml-2 opacity-70">· {zh ? '由' : 'by'} {story.provider}</span>}</p>
          {(showMedia || story.media?.length > 0) && <div className="mt-8"><div className="ed-caps mb-3">{t('review.media')}</div><MediaPanel media={story.media} onChange={(m) => update({ media: m })} compact /></div>}
        </article>
      )} aside={(
        <div className="aside-block">
          <div className="flex items-baseline justify-between mb-1"><h2 className="h2 m-0">{t('review.notes')}</h2>{pendingN > 0 && <span className="ed-caps !text-accent">{pendingN} {t('review.pending')}</span>}</div>
          <p className="text-[12.5px] text-ink-3 mb-2">{t('review.notesHint')}</p>
          <div>
            {story.terms.map((tm) => (
              <div key={tm.id} className={'notes-row ' + (active === tm.id ? 'pl-3 border-l-2 border-l-accent' : '')} onMouseEnter={() => setActive(tm.id)}>
                <div className="flex items-baseline gap-2"><span className="serif font-medium text-[18px]">{tm.word}</span><span className="ed-caps">{tm.kind}</span><span className="flex-1" />{tm.status === 'ok' && <span className="ed-caps !text-accent">✓ {t('review.confirmed')}</span>}</div>
                {fixing === tm.id ? (
                  <div className="mt-2"><textarea className="input text-[13.5px] min-h-[64px]" value={tm.note} onChange={(e) => setTerm(tm.id, { note: e.target.value })} autoFocus /><button className="btn btn-primary btn-sm mt-2" onClick={() => { setTerm(tm.id, { status: 'ok' }); setFixing(null); }}>{t('common.ok')}</button></div>
                ) : (
                  <>
                    <p className="text-[14px] text-ink-2 mt-1 mb-3">{tm.note}</p>
                    <div className="flex items-center gap-5 text-[13px]">{tm.status !== 'ok' && <button className="btn btn-primary btn-sm" onClick={() => setTerm(tm.id, { status: 'ok' })}>{t('review.confirm')}</button>}<button className="link-soft" onClick={() => setFixing(tm.id)}>{t('review.fix')}</button><button className="link-soft" onClick={() => removeTerm(tm.id)}>{t('review.remove')}</button></div>
                  </>
                )}
              </div>
            ))}
          </div>
          {adding ? (
            <div className="grid gap-2 mt-4">
              <input className="field text-[15px]" placeholder={t('review.noteWord')} value={nw.word} onChange={(e) => setNw({ ...nw, word: e.target.value })} autoFocus />
              <input className="field text-[14px]" placeholder={t('review.noteKind')} value={nw.kind} onChange={(e) => setNw({ ...nw, kind: e.target.value })} />
              <textarea className="input text-[14px] min-h-[64px] mt-1" placeholder={t('review.noteText')} value={nw.note} onChange={(e) => setNw({ ...nw, note: e.target.value })} />
              <div className="flex items-center gap-5 text-[13px]"><button className="btn btn-primary btn-sm" disabled={!nw.word.trim()} onClick={addTerm}>{t('review.add')}</button><button className="link-soft" onClick={() => setAdding(false)}>{t('common.cancel')}</button></div>
            </div>
          ) : <button className="link-soft text-[13.5px] mt-4" onClick={() => setAdding(true)}>{t('review.addNote')}</button>}
        </div>
      )} />
      <div className="sticky bottom-0 mt-12 bg-paper/92 backdrop-blur border-t border-ink py-4 flex items-center gap-6">
        <span className="text-[13.5px] text-ink-2">{pendingN > 0 ? (zh ? `${pendingN} 处注释还没确认，也可以先保存。` : `${pendingN} note(s) still pending — you can save anyway.`) : (zh ? '所有注释已确认。' : 'All notes confirmed.')}</span><span className="flex-1" />
        {!id && <button className="link-soft text-[14px]" onClick={saveDraft}>{t('review.draft')}</button>}
        {saveErr && <span className="text-rec text-[13px]">{saveErr}</span>}
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? (zh ? '保存中…' : 'Saving…') : id ? t('review.saveChanges') : t('review.save')}</button>
      </div>
    </Shell>
  );
}
