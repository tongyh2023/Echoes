import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { PageHeader, TwoCol } from '../components/Shell';
import { useT } from '../lib/i18n';
import { useStore, FREE_LIMIT } from '../lib/store';
import { QUESTIONS } from '../mock/data';
import { storyView, profileView, qView } from '../lib/loc';

export const fillQ = (q, profile, lang = 'zh') => qView(q, lang).text.replace('{home}', (profileView(profile, lang)?.hometown || (lang === 'en' ? 'your hometown' : '老家')).split(/[ ,]/).pop());

// The next question to ask: the family's own (follow-ups and edits first), otherwise the first library question not yet answered.
export function useNextQuestion() {
  const { state } = useStore(); const { lang } = useT();
  const own = (state.customQuestions || [])[0];
  if (own) return { ...own, text: own.text, why: own.source === 'followup' ? (lang === 'zh' ? `${own.who || '家人'}读完「${own.fromTitle}」后想接着问的` : `${own.who || 'Family'} asked this after reading “${own.fromTitle}”`) : (lang === 'zh' ? '你们家自己写的问题' : 'Your family’s own question') };
  const asked = new Set(state.stories.map((s) => s.questionId));
  const q = QUESTIONS.find((x) => !asked.has(x.id)) || QUESTIONS[0];
  return { ...q, text: fillQ(q, state.profile, lang), why: lang === 'zh' ? '按老家和年代挑的，不合适就换一个' : 'Picked for their hometown and era — swap it if it doesn’t fit' };
}

// Stories: the one home. Top — the next question (the only primary action). Below — the stories, newest first, as a list on hairlines.
export default function Home() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { state, allStories } = useStore();
  const p = profileView(state.profile, lang); const stories = state.stories.map((x) => storyView(x, lang));
  const next = useNextQuestion();
  const [q, setQ] = useState(''); const [f, setF] = useState(null);
  const draft = state.draft && state.draft.title ? state.draft : null;
  const go = () => nav(Boolean(next.source) ? '/record/own?text=' + encodeURIComponent(next.text) + '&cq=' + next.id : '/record/' + next.id);
  const many = stories.length >= 10;
  const facets = many ? [...new Set(stories.flatMap((s) => [...s.topics, ...(s.people || []), s.era, s.place]).filter(Boolean))] : [];
  const list = stories.filter((s) => { const hay = [s.title, ...s.topics, ...(s.people || []), s.era, s.place, ...s.text.first].join(' '); return (!f || hay.includes(f)) && (!q || hay.toLowerCase().includes(q.toLowerCase())); });
  const n = allStories.length; const left = FREE_LIMIT - n;
  const who = p.mode === 'self' ? (zh ? '你' : 'you') : p.name;

  return (
    <Shell>
      <PageHeader eyebrow={(p.mode === 'self' ? (zh ? '我的故事' : 'My stories') : p.name + ' · ' + p.hometown + ' · ' + p.birth)} title={stories.length ? t('nav.stories') : (zh ? '还没有故事。从这一个开始。' : 'No stories yet. Start with this one.')} />

      {/* next question */}
      <section className="grid md:grid-cols-[1fr_300px] gap-12 items-start mb-16">
        <div>
          <div className="ed-caps mb-4">{zh ? `下一个问题 · 对${who}说` : `Next question · for ${who}`}</div>
          <p className="serif font-medium text-[30px] md:text-[34px] leading-[1.4] m-0 max-w-[22em]">{next.text}</p>
          <p className="text-[14px] text-ink-3 mt-3 mb-7">{next.why}</p>
          <div className="flex flex-wrap items-center gap-7">
            <button className="btn btn-primary btn-lg" onClick={go}>{zh ? '录这个' : 'Record this'} →</button>
            <button className="link-soft text-[15px]" onClick={() => nav('/pick')}>{zh ? '换一个' : 'Pick another'}</button>
            <button className="link-soft text-[15px]" onClick={() => nav('/pick', { state: { own: true } })}>{zh ? '自己写一个' : 'Write your own'}</button>
          </div>
        </div>
        <div className="aside-block md:mt-1">
          <div className="ed-caps mb-3">{zh ? '攒成一本' : 'Towards a book'}</div>
          <div className="tally mb-3">{Array.from({ length: FREE_LIMIT }).map((_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</div>
          <p className="text-[14px] text-ink-2 m-0 leading-relaxed">{zh ? <>已有 <b className="text-ink">{n}</b> 个故事。攒到 {FREE_LIMIT} 个，就够做成一本小书了。</> : <><b className="text-ink">{n}</b> stories so far. At {FREE_LIMIT} there is enough for a small book.</>}</p>
          {state.plan === 'free' && left <= 3 && <p className="text-[13px] text-ink-3 mt-3 mb-0">{left > 0 ? (zh ? `免费额度还剩 ${left} 个。` : `${left} free stories left.`) : (zh ? `免费的 ${FREE_LIMIT} 个已用完。` : `All ${FREE_LIMIT} free stories used.`)} <button className="link-soft" onClick={() => nav('/upgrade')}>{zh ? '看看家庭版' : 'Family plan'}</button></p>}
        </div>
      </section>

      {/* stories */}
      {(stories.length > 0 || draft) && (
        <section>
          <div className="flex items-baseline justify-between gap-6 mb-4">
            <h2 className="h2 m-0">{zh ? '已经录下的' : 'Recorded so far'} <span className="text-ink-3 font-normal text-[15px] font-sans ml-2">{t('home.count', { n: stories.length })}</span></h2>
            {many && <input className="field text-[14px] w-[260px]" placeholder={t('home.search')} value={q} onChange={(e) => setQ(e.target.value)} />}
          </div>
          {many && <div className="chips mb-5 text-[13.5px]"><button className={'chip ' + (!f ? 'on' : '')} onClick={() => setF(null)}>{t('home.filterAll')}</button>{facets.map((x) => <button key={x} className={'chip ' + (f === x ? 'on' : '')} onClick={() => setF(f === x ? null : x)}>{x}</button>)}</div>}
          <div className="rows">
            {draft && (
              <button className="row-link md:grid-cols-[120px_1fr_auto] items-baseline" onClick={() => nav('/review')}>
                <span className="ed-caps !text-accent">{t('home.draft')}</span>
                <span><span className="ttl">{draft.title}</span><span className="block text-[13.5px] text-ink-2 mt-1 truncate">{draft.question}</span></span>
                <span className="link-soft text-[13.5px]">{t('home.continueDraft')} →</span>
              </button>
            )}
            {list.map((s) => (
              <button key={s.id} className="row-link md:grid-cols-[120px_1fr_auto] items-baseline" onClick={() => nav('/story/' + s.id)}>
                <span className="ed-caps">{s.date.slice(0, 7).replace('-', '·')}</span>
                <span><span className="ttl">{s.title}</span><span className="block text-[13.5px] text-ink-2 mt-1">{[s.era, s.place, ...s.topics].filter(Boolean).join(' · ')}{s.terms.some((x) => x.status === 'pending') ? <span className="text-accent"> · {s.terms.filter((x) => x.status === 'pending').length}{zh ? ' 处待确认' : ' pending'}</span> : ''}{s.published ? <span> · {zh ? '已公开' : 'Public'}</span> : ''}</span></span>
                <span className="text-[13px] text-ink-3 tabular-nums">▶ {s.duration}</span>
              </button>
            ))}
            {list.length === 0 && !draft && <p className="text-ink-3 py-8 m-0">{t('home.none')}</p>}
          </div>
        </section>
      )}
    </Shell>
  );
}
