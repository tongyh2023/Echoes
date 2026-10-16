import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Shell, { Avatar, PageHeader, TwoCol, useToast } from '../components/Shell';
import { useT, LANGUAGES } from '../lib/i18n';
import { useStore } from '../lib/store';
import { postView } from '../lib/loc';

// A community story on its own page (no modal): read, react, comment, repost, follow — then back to the community or on to the author.
// If the post is one of this family's own stories, the real story page (with audio) is where it opens instead.
export default function Read() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { id } = useParams(); const loc = useLocation();
  const { state, updatePost, publish } = useStore();
  const raw = state.posts.find((p) => p.id === id); const po = raw ? postView(raw, lang) : null;
  const [draft, setDraft] = useState(''); const [follow, setFollow] = useState(false); const [toast, toastEl] = useToast();
  if (!po) { nav('/community', { replace: true }); return null; }
  const me = state.email ? state.email.split('@')[0] : (zh ? '我' : 'Me');
  const justPublished = loc.state?.published;
  const comment = () => { if (!draft.trim()) return; updatePost(po.id, (x) => ({ ...x, comments: [...x.comments, { who: me, text: draft.trim() }] })); setDraft(''); };
  const own = po.storyId && state.stories.some((s) => s.id === po.storyId);

  return (
    <Shell>
      {toastEl}
      <PageHeader back backTo="/community" backLabel={zh ? '← 社区' : '← Community'} className="!border-line !pb-4 !mb-8" />
      {justPublished && (
        <div className="border-l-2 border-accent pl-5 py-1 mb-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-[14.5px]">
          <span><b className="font-medium">{zh ? '已发布到社区。' : 'Published to the community.'}</b> <span className="text-ink-2">{zh ? '其他家庭现在能读到文字和已确认的注释；原声只有家人能听。' : 'Other families can now read the text and confirmed notes; audio stays with the family.'}</span></span>
          <span className="flex gap-6"><button className="link" onClick={() => nav('/community')}>{zh ? '去社区看看' : 'See it in the community'} →</button><button className="link-soft" onClick={() => nav('/home')}>{zh ? '回到故事' : 'Back to stories'}</button></span>
        </div>
      )}
      <TwoCol asideWidth={260} main={(
        <article className="max-w-[720px]">
          {po.image && <img src={po.image} alt="" className="block w-full aspect-[3/2] object-cover mb-8" />}
          <div className="ed-caps mb-3">{[po.place, po.era, LANGUAGES.find((l) => l.code === po.lang)?.label].filter(Boolean).join(' · ')}</div>
          <h1 className="serif font-medium text-[38px] leading-[1.2] m-0 mb-6">{po.title}</h1>
          <div className="story" style={{ maxWidth: 'none' }}>{(po.body || [po.excerpt]).map((pg, i) => <p key={i}>{pg}</p>)}</div>
          <p className="text-[12.5px] text-ink-3 mt-6">{own ? (zh ? '这是你们家的故事。' : 'This is your family’s story.') : t('community.audioNote')}{own && <button className="link ml-2" onClick={() => nav('/story/' + po.storyId)}>{zh ? '打开带原声的版本' : 'Open with audio'} →</button>}</p>

          <section className="mt-12 border-t border-ink pt-5">
            <div className="flex items-center gap-7 text-[14.5px]">
              <button className={'cursor-pointer ' + (po.liked ? 'text-rec' : 'hover:text-ink text-ink-2')} onClick={() => updatePost(po.id, (x) => ({ ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) }))}>{po.liked ? '♥' : '♡'} {po.likes}</button>
              <span className="text-ink-2">{t('community.comment')} {po.comments.length}</span>
              <button className={'cursor-pointer ' + (po.reposted ? 'text-accent' : 'hover:text-ink text-ink-2')} onClick={() => { updatePost(po.id, (x) => ({ ...x, reposted: !x.reposted, reposts: x.reposts + (x.reposted ? -1 : 1) })); toast(po.reposted ? (zh ? '已取消转发' : 'Repost removed') : (zh ? '已转发到你们家的空间' : 'Reposted to your family space')); }}>↻ {po.reposts}</button>
            </div>
            <div className="mt-6 grid gap-4">
              {po.comments.map((c, i) => <div key={i} className="flex gap-3 items-baseline text-[15px]"><Avatar name={c.who} size="w-7 h-7 text-[11px]" /><span><b className="font-medium">{c.who}</b> <span className="text-ink-2">{c.text}</span></span></div>)}
              <div className="flex gap-4 items-end"><input className="field flex-1 text-[15px]" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('community.write')} onKeyDown={(e) => e.key === 'Enter' && comment()} /><button className="btn btn-sm" disabled={!draft.trim()} onClick={comment}>{t('community.post')}</button></div>
            </div>
          </section>
        </article>
      )} aside={(
        <div className="aside-block">
          <div className="flex items-center gap-3 mb-3"><Avatar name={po.author} src={po.avatar} size="w-12 h-12 text-[16px]" me={po.mine} /><div className="min-w-0"><button className="font-medium hover:underline underline-offset-4 cursor-pointer text-left" onClick={() => nav('/people/' + encodeURIComponent(po.author))}>{po.author}</button><div className="text-[12.5px] text-ink-3 truncate">{po.authorSub}</div></div></div>
          {po.mine
            ? <div className="grid gap-2 text-[14px]"><button className="link-soft w-fit" onClick={() => nav('/story/' + po.storyId)}>{zh ? '打开我们家的版本' : 'Open our version'}</button><button className="link-soft w-fit" onClick={() => { const st = state.stories.find((s) => s.id === po.storyId); if (st) { publish(st, false); nav('/story/' + st.id); } }}>{t('story.unpublish')}</button></div>
            : <div className="grid gap-2 text-[14px]"><button className={(follow ? 'link' : 'link-soft') + ' w-fit'} onClick={() => setFollow((v) => !v)}>{follow ? t('community.following') : '+ ' + t('community.follow')}</button><button className="link-soft w-fit" onClick={() => nav('/people/' + encodeURIComponent(po.author))}>{zh ? `${po.author}的其他故事` : `More from ${po.author}`} →</button></div>}
        </div>
      )} />
    </Shell>
  );
}
