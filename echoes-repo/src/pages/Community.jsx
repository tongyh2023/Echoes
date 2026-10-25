import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { Avatar, PageHeader, TwoCol } from '../components/Shell';
import { useT, LANGUAGES } from '../lib/i18n';
import { useStore } from '../lib/store';
import { postView } from '../lib/loc';
import { translateStory } from '../lib/db';

// Community: other families' stories, read like a magazine — one featured piece, then a single column on hairlines.
// Social is one gesture (like); the chrome gets out of the way. Audio never leaves the family.

export default function Community() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { state, updatePost, likePost, commentPost, loadComments, live, allStories } = useStore();
  const [filter, setFilter] = useState('all'); const [topic, setTopic] = useState(null); const [open, setOpen] = useState(null); const [draft, setDraft] = useState(''); const [follow, setFollow] = useState({}); const [mineOnly, setMineOnly] = useState(false);
  const allPosts = state.posts.map((p) => postView(p, lang));
  const langs = ['all', ...new Set(allPosts.map((p) => p.lang))];
  const label = (c) => (c === 'all' ? (zh ? '全部语言' : 'All languages') : LANGUAGES.find((l) => l.code === c)?.label || c);
  const topics = useMemo(() => [...new Set(allPosts.flatMap((p) => p.topics || []))].slice(0, 10), [state.posts, lang]);
  const posts = allPosts.filter((p) => (filter === 'all' || p.lang === filter) && (!topic || (p.topics || []).includes(topic)) && (!mineOnly || p.mine));
  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p !== featured);
  const me = state.email ? state.email.split('@')[0] : (zh ? '我' : 'Me');
  // Inline translation on each card (Chinese ↔ English). Fetched on first tap, then toggled.
  const [trs, setTrs] = useState({}); const [trOn, setTrOn] = useState({}); const [trBusy, setTrBusy] = useState(null);
  const toOf = (po) => (/[\u3400-\u9fff]/.test((po.body || []).join('') + po.title) ? 'en' : 'zh');
  const toggleTr = async (po) => {
    if (trOn[po.id]) return setTrOn((m) => ({ ...m, [po.id]: false }));
    if (!trs[po.id]) { setTrBusy(po.id); try { const d = await translateStory(po.storyId || po.id, toOf(po)); setTrs((m) => ({ ...m, [po.id]: d })); } catch { setTrBusy(null); return; } setTrBusy(null); }
    setTrOn((m) => ({ ...m, [po.id]: true }));
  };
  const tv = (po) => { const d = trOn[po.id] && trs[po.id]; if (!d) return { title: po.title, excerpt: po.excerpt }; const t = d.paragraphs.join(' ').replace(/[\[\]]/g, ''); return { title: d.title, excerpt: t.slice(0, 120) + (t.length > 120 ? '…' : '') }; };
  const openPost = (po) => (po.storyId && allStories.some((s) => s.id === po.storyId) ? nav('/story/' + po.storyId) : nav('/read/' + po.id));

  const Actions = ({ po }) => (
    <div className="flex items-center gap-6 text-[13.5px] text-ink-2 mt-4">
      <button className={'cursor-pointer hover:text-ink ' + (po.liked ? 'text-rec' : '')} onClick={() => likePost(po.id, !po.liked).catch(() => nav('/login'))}>{po.liked ? '♥' : '♡'} {po.likes}</button>
      {live && <button className="link-soft text-[12.5px]" disabled={trBusy === po.id} onClick={() => toggleTr(po)}>{trBusy === po.id ? '…' : trOn[po.id] ? (zh ? '原文' : 'Original') : toOf(po) === 'en' ? (zh ? '译成英文' : 'Translate') : (zh ? '译成中文' : 'Translate')}</button>}
      <span className="flex-1" />
      <button className="link text-[13px]" onClick={() => openPost(po)}>{po.storyId && allStories.some((s) => s.id === po.storyId) ? t('community.readListen') : t('community.read')} →</button>
    </div>
  );
  const Comments = () => null;   // comments and reposts removed: the community keeps one gesture — a like.
  const Byline = ({ po }) => (
    <div className="flex items-center gap-3 text-[13.5px]">
      <Avatar name={po.author} src={po.avatar} me={po.mine} />
      <button className="font-medium hover:underline underline-offset-4 cursor-pointer" onClick={() => nav('/people/' + encodeURIComponent(po.author))}>{po.author}</button>
      <span className="text-ink-3 truncate">{po.authorSub}</span>
      {po.mine && <span className="ed-caps !text-accent">{t('community.mine')}</span>}
    </div>
  );
  const Meta = ({ po }) => <div className="ed-caps mt-3">{[po.place, po.era, zh ? `${po.readMin} 分钟` : `${po.readMin} min`, LANGUAGES.find((l) => l.code === po.lang)?.label || po.lang].join(' · ')}</div>;

  return (
    <Shell>
      {/* 33-point list item: the page says what it is, in one line */}
      <PageHeader title={t('community.title')} sub={zh ? '家人选择公开的故事会出现在这里。每个故事都可以中英互译；原声只对家人开放。' : 'Stories families chose to share. Every story can be read in Chinese or English; audio stays within the family.'} />
      <TwoCol asideWidth={240} main={(
        <div>
          {featured && (
            <article className={'grid gap-10 items-start pb-12 mb-4 border-b border-ink ' + (featured.image ? 'md:grid-cols-[1fr_1.1fr]' : 'md:grid-cols-[0.6fr_1.1fr]')}>
              <div className="relative">{featured.image ? <><img src={featured.image} alt="" className="block w-full aspect-[4/3] object-cover rounded-[4px]" />{featured.era && <span className="absolute left-3 top-3 ed-caps !text-paper bg-ink/70 px-2 py-1">{featured.era}</span>}</> : <div className="w-full aspect-[4/3] wash rounded-[4px] flex items-center justify-center"><span className="serif text-[120px] leading-none text-primary/25 select-none">{(featured.title || '·').slice(0, 1)}</span></div>}</div>
              <div>
                <div className="ed-caps !text-accent mb-4">{t('community.featured')}</div>
                <h2 className="serif font-medium text-[36px] leading-[1.15] m-0 mb-4 cursor-pointer hover:underline underline-offset-4 decoration-1" onClick={() => openPost(featured)}>{tv(featured).title}</h2>
                <p className="story text-[16.5px] leading-[1.85] text-ink-2 m-0 mb-5" style={{ maxWidth: 'none' }}>{tv(featured).excerpt}</p>
                <Byline po={featured} /><Meta po={featured} />
                <Actions po={featured} /><Comments po={featured} />
              </div>
            </article>
          )}
          <div className="flex items-baseline justify-between mb-2"><h3 className="h2 m-0">{t('community.latest')}</h3><span className="ed-caps">{posts.length} {t('community.stories')}</span></div>
          <div className="divide-y divide-line border-b border-line">
            {rest.map((po) => (
              <article key={po.id} className={'py-8 grid gap-8 items-start ' + (po.image ? 'md:grid-cols-[1fr_150px]' : '')}>
                <div className="min-w-0">
                  <Byline po={po} />
                  <h3 className="serif font-medium text-[24px] leading-[1.3] mt-3 mb-2 cursor-pointer hover:underline underline-offset-4 decoration-1" onClick={() => openPost(po)}>{tv(po).title}</h3>
                  <p className="story text-[15.5px] leading-[1.8] text-ink-2 m-0 line-clamp-2" style={{ maxWidth: 'none' }}>{tv(po).excerpt}</p>
                  <Meta po={po} /><Actions po={po} /><Comments po={po} />
                </div>
                {po.image ? <img src={po.image} alt="" className="hidden md:block w-[150px] aspect-square object-cover cursor-pointer rounded-[4px]" onClick={() => openPost(po)} /> : null}
              </article>
            ))}
            {rest.length === 0 && !featured && <p className="text-ink-3 py-10 m-0">{t('community.noneFilter')}</p>}
          </div>
        </div>
      )} aside={(
        <>
          <div className="aside-block"><div className="ed-caps mb-3">{zh ? '显示' : 'Show'}</div><div className="grid gap-2 text-[14px]"><button className={mineOnly ? 'link-soft w-fit' : 'link w-fit'} onClick={() => setMineOnly(false)}>{t('community.all')}</button><button className={mineOnly ? 'link w-fit' : 'link-soft w-fit'} onClick={() => setMineOnly(true)}>{t('community.mine')}</button></div></div>
          <div className="aside-block"><div className="ed-caps mb-3">{t('community.lang')}</div><div className="grid gap-2 text-[14px]">{langs.map((c) => <button key={c} className={(filter === c ? 'link' : 'link-soft') + ' w-fit'} onClick={() => setFilter(c)}>{label(c)}</button>)}</div></div>
          <div className="aside-block"><div className="ed-caps mb-3">{t('community.topics')}</div><div className="chips text-[14px]">{topics.map((x) => <button key={x} className={'chip ' + (topic === x ? 'on' : '')} onClick={() => setTopic(topic === x ? null : x)}>{x}</button>)}</div></div>
          <p className="text-[12.5px] text-ink-3 mt-7 mb-0">{t('community.consentNote')} <a href="mailto:hello@echoestory.com" className="link-soft">{t('community.tellUs')}</a></p>
        </>
      )} />

    </Shell>
  );
}
