import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { Avatar, PageHeader, TwoCol } from '../components/Shell';
import { useT, LANGUAGES } from '../lib/i18n';
import { useStore } from '../lib/store';
import { postView } from '../lib/loc';

// Community: other families' stories, read like a magazine — one featured piece, then a single column on hairlines.
// Social stays (like, comment, repost, follow); the chrome gets out of the way. Audio never leaves the family.

export default function Community() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { state, updatePost } = useStore();
  const [filter, setFilter] = useState('all'); const [topic, setTopic] = useState(null); const [open, setOpen] = useState(null); const [draft, setDraft] = useState(''); const [follow, setFollow] = useState({}); const [mineOnly, setMineOnly] = useState(false);
  const allPosts = state.posts.map((p) => postView(p, lang));
  const langs = ['all', ...new Set(allPosts.map((p) => p.lang))];
  const label = (c) => (c === 'all' ? (zh ? '全部语言' : 'All languages') : LANGUAGES.find((l) => l.code === c)?.label || c);
  const topics = useMemo(() => [...new Set(allPosts.flatMap((p) => p.topics || []))].slice(0, 10), [state.posts, lang]);
  const posts = allPosts.filter((p) => (filter === 'all' || p.lang === filter) && (!topic || (p.topics || []).includes(topic)) && (!mineOnly || p.mine));
  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p !== featured);
  const me = state.email ? state.email.split('@')[0] : (zh ? '我' : 'Me');
  const openPost = (po) => (po.storyId && state.stories.some((s) => s.id === po.storyId) ? nav('/story/' + po.storyId) : nav('/read/' + po.id));

  const Actions = ({ po }) => (
    <div className="flex items-center gap-6 text-[13.5px] text-ink-2 mt-4">
      <button className={'cursor-pointer hover:text-ink ' + (po.liked ? 'text-rec' : '')} onClick={() => updatePost(po.id, (x) => ({ ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) }))}>{po.liked ? '♥' : '♡'} {po.likes}</button>
      <button className="cursor-pointer hover:text-ink" onClick={() => setOpen(open === po.id ? null : po.id)}>{t('community.comment')} {po.comments.length}</button>
      <button className={'cursor-pointer hover:text-ink ' + (po.reposted ? 'text-accent' : '')} onClick={() => updatePost(po.id, (x) => ({ ...x, reposted: !x.reposted, reposts: x.reposts + (x.reposted ? -1 : 1) }))}>↻ {po.reposts}</button>
      <span className="flex-1" />
      <button className="link text-[13px]" onClick={() => openPost(po)}>{po.storyId && state.stories.some((s) => s.id === po.storyId) ? t('community.readListen') : t('community.read')} →</button>
    </div>
  );
  const Comments = ({ po }) => open === po.id && (
    <div className="mt-4 border-l-2 border-line pl-5 grid gap-3">
      {po.comments.map((c, i) => <div key={i} className="flex gap-3 text-[14px] items-baseline"><Avatar name={c.who} size="w-6 h-6 text-[10px]" /><span><b className="font-medium">{c.who}</b> <span className="text-ink-2">{c.text}</span></span></div>)}
      <div className="flex gap-4 items-end"><input className="field flex-1 text-[14.5px]" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('community.write')} onKeyDown={(e) => e.key === 'Enter' && draft.trim() && (updatePost(po.id, (x) => ({ ...x, comments: [...x.comments, { who: me, text: draft }] })), setDraft(''))} /><button className="btn btn-sm" disabled={!draft.trim()} onClick={() => { updatePost(po.id, (x) => ({ ...x, comments: [...x.comments, { who: me, text: draft }] })); setDraft(''); }}>{t('community.post')}</button></div>
    </div>
  );
  const Byline = ({ po }) => (
    <div className="flex items-center gap-3 text-[13.5px]">
      <Avatar name={po.author} src={po.avatar} me={po.mine} />
      <button className="font-medium hover:underline underline-offset-4 cursor-pointer" onClick={() => nav('/people/' + encodeURIComponent(po.author))}>{po.author}</button>
      <span className="text-ink-3 truncate">{po.authorSub}</span>
      {po.mine ? <span className="ed-caps !text-accent">{t('community.mine')}</span> : <button className="link-soft text-[12.5px] ml-1" onClick={() => setFollow((f) => ({ ...f, [po.author]: !f[po.author] }))}>{follow[po.author] ? t('community.following') : '+ ' + t('community.follow')}</button>}
    </div>
  );
  const Meta = ({ po }) => <div className="ed-caps mt-3">{[po.place, po.era, zh ? `${po.readMin} 分钟` : `${po.readMin} min`, LANGUAGES.find((l) => l.code === po.lang)?.label || po.lang].join(' · ')}</div>;

  return (
    <Shell>
      {/* 33-point list item: the page says what it is, in one line */}
      <PageHeader title={t('community.title')} sub={zh ? '家人选择公开的故事会出现在这里。故事保留讲述者自己的语言，不翻译；原声只对家人开放。' : 'Stories families chose to share. Each stays in the storyteller’s own language; audio stays within the family.'} />
      <TwoCol asideWidth={240} main={(
        <div>
          {featured && (
            <article className="grid md:grid-cols-[1fr_1.1fr] gap-10 items-start pb-12 mb-4 border-b border-ink">
              <div className="relative">{featured.image ? <img src={featured.image} alt="" className="block w-full aspect-[4/3] object-cover" /> : <div className="w-full aspect-[4/3] bg-line-2" />}<span className="absolute left-3 top-3 ed-caps !text-paper bg-ink/70 px-2 py-1">{featured.era}</span></div>
              <div>
                <div className="ed-caps !text-accent mb-4">{t('community.featured')}</div>
                <h2 className="serif font-medium text-[36px] leading-[1.15] m-0 mb-4 cursor-pointer hover:underline underline-offset-4 decoration-1" onClick={() => openPost(featured)}>{featured.title}</h2>
                <p className="story text-[16.5px] leading-[1.85] text-ink-2 m-0 mb-5" style={{ maxWidth: 'none' }}>{featured.excerpt}</p>
                <Byline po={featured} /><Meta po={featured} />
                <Actions po={featured} /><Comments po={featured} />
              </div>
            </article>
          )}
          <div className="flex items-baseline justify-between mb-2"><h3 className="h2 m-0">{t('community.latest')}</h3><span className="ed-caps">{posts.length} {t('community.stories')}</span></div>
          <div className="divide-y divide-line border-b border-line">
            {rest.map((po) => (
              <article key={po.id} className="py-8 grid md:grid-cols-[1fr_150px] gap-8 items-start">
                <div className="min-w-0">
                  <Byline po={po} />
                  <h3 className="serif font-medium text-[24px] leading-[1.3] mt-3 mb-2 cursor-pointer hover:underline underline-offset-4 decoration-1" onClick={() => openPost(po)}>{po.title}</h3>
                  <p className="story text-[15.5px] leading-[1.8] text-ink-2 m-0 line-clamp-2" style={{ maxWidth: 'none' }}>{po.excerpt}</p>
                  <Meta po={po} /><Actions po={po} /><Comments po={po} />
                </div>
                {po.image ? <img src={po.image} alt="" className="hidden md:block w-[150px] aspect-square object-cover cursor-pointer" onClick={() => openPost(po)} /> : <div className="hidden md:block w-[150px] aspect-square bg-line-2" />}
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
          <p className="text-[12.5px] text-ink-3 mt-7 mb-0">{t('community.consentNote')} <a href="mailto:hello@echoes.app" className="link-soft">{t('community.tellUs')}</a></p>
        </>
      )} />

    </Shell>
  );
}
