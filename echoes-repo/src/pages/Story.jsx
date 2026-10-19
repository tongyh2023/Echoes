import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Shell, { Audio, PageHeader, TwoCol, useToast } from '../components/Shell';
import StoryText from '../components/StoryText';
import MediaPanel from '../components/MediaPanel';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { storyView, profileView } from '../lib/loc';

const EMOJI = ['❤️', '😂', '😢', '👏'];

// The saved story, read like a page of a book. The family reacts underneath and asks the next question — which becomes the next thing to record.
export default function Story() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { id } = useParams();
  const { state, publish, updateStory, react, addQuestion } = useStore();
  const raw = state.stories.find((s) => s.id === id); const story = storyView(raw, lang); const p = profileView(state.profile, lang);
  const [consent, setConsent] = useState(false); const [agree, setAgree] = useState(false); const [share, setShare] = useState(false); const [ask, setAsk] = useState('');
  const [toast, toastEl] = useToast();
  if (!story) { nav('/home'); return null; }
  const pending = story.terms.filter((x) => x.status === 'pending').length;
  const me = state.userName || (state.email ? state.email.split('@')[0] : (zh ? '我' : 'Me'));
  const reactions = state.reactions?.[story.id] || [];
  const isMine = (r) => (state.userId ? r.userId === state.userId : r.who === me);
  const followups = (state.customQuestions || []).filter((q) => q.from === story.id);
  const askIt = () => { const text = ask.trim(); if (!text) return; addQuestion({ text, source: 'followup', from: story.id, fromTitle: story.title, who: me }); setAsk(''); toast(zh ? '已经加到下一个问题里' : 'Added as the next question'); };

  return (
    <Shell>
      {toastEl}
      <PageHeader back backTo="/home" backLabel={t('story.all')} className="!border-line !pb-4 !mb-10" />
      <TwoCol asideWidth={300} main={(
        <article>
          <div className="ed-caps mb-3">{story.date} · {[story.era, story.place].filter(Boolean).join(' · ')}</div>
          <h1 className="serif font-medium text-[38px] leading-[1.2] m-0 mb-2">{story.title}</h1>
          <p className="text-[14.5px] text-ink-2 mb-7">{p.name}{story.people?.length ? ' · ' + story.people.join('、') : ''}{story.topics?.length ? ' · ' + story.topics.join('、') : ''}</p>
          <div className="mb-8"><Audio dur={story.duration} src={story.audioUrl} /></div>
          <StoryText paragraphs={story.text.first} terms={story.terms} mode="glossary" />
          {story.terms.some((x) => x.status === 'ok') && <p className="text-[12.5px] text-ink-3 mt-1">{t('story.glossary')}</p>}
          {pending > 0 && <p className="mt-5 text-[13.5px] text-ink-2 border-l-2 border-accent pl-4">{zh ? `${pending} 处注释还没确认，确认后才会显示给读者。` : `${pending} note(s) pending — they show to readers once confirmed.`} <button className="link ml-2" onClick={() => nav('/story/' + story.id + '/edit')}>{zh ? '去确认' : 'Review'} →</button></p>}
          {story.media?.length > 0 && <div className="mt-8"><div className="ed-caps mb-3">{t('story.media')}</div><MediaPanel media={story.media} onChange={(m) => updateStory(story.id, { media: m })} compact /></div>}

          {/* family */}
          <section className="mt-14 border-t border-ink pt-5">
            <div className="ed-caps mb-4">{zh ? '家里人' : 'Family'}</div>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {EMOJI.map((e) => { const n = reactions.filter((r) => r.emoji === e).length; const mine = reactions.some((r) => r.emoji === e && isMine(r)); return <button key={e} className={'px-3 py-1.5 border text-[14px] cursor-pointer ' + (mine ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink')} onClick={() => react(story.id, me, e)}>{e}{n > 0 && <span className="ml-1.5 tabular-nums">{n}</span>}</button>; })}
              {reactions.length > 0 && <span className="text-[13px] text-ink-3 ml-2">{[...new Set(reactions.map((r) => r.who))].join('、')}</span>}
            </div>
            <div className="ed-caps mb-2">{zh ? '读完想接着问' : 'Ask a follow-up'}</div>
            <div className="divide-y divide-line border-b border-line mb-3">
              {followups.map((q) => <div key={q.id} className="py-3 flex items-baseline gap-4"><span className="q-text flex-1 !text-[17px]">{q.text}</span><span className="text-[12.5px] text-ink-3 whitespace-nowrap">{q.who}</span><button className="link text-[13px] whitespace-nowrap" onClick={() => nav('/record/own?text=' + encodeURIComponent(q.text) + '&cq=' + q.id)}>{zh ? '去录' : 'Record'} →</button></div>)}
            </div>
            <div className="flex gap-4 items-end"><input className="field flex-1 text-[16px]" placeholder={zh ? `比如：外婆的木甑后来去哪了？` : 'e.g. What happened to grandma’s wooden steamer?'} value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askIt()} /><button className="btn btn-sm" disabled={!ask.trim()} onClick={askIt}>{zh ? '问他' : 'Ask'}</button></div>
            <p className="text-[12.5px] text-ink-3 mt-2 mb-0">{zh ? '追问会排在下一个要录的问题里。' : 'Follow-ups become the next question to record.'}</p>
          </section>
        </article>
      )} aside={(
        <div className="aside-block">
          <div className="grid gap-3 text-[14.5px]">
            <button className="link w-fit" onClick={() => nav('/story/' + story.id + '/edit')}>{t('story.edit')}</button>
            <div className="relative"><button className="link" onClick={() => setShare((v) => !v)}>{t('story.share')} ▾</button>
              {share && <div className="menu"><button onClick={() => { setShare(false); nav('/family'); }}>{t('story.invite')}</button><button onClick={() => { setShare(false); if (story.published) { publish(raw, false); toast(t('story.unpublish')); } else setConsent(true); }}>{story.published ? t('story.unpublish') : t('story.publish')}</button></div>}
            </div>
          </div>
          {story.published && <p className="text-[12.5px] text-ink-2 mt-5 mb-0"><span className="ed-caps !text-accent block mb-1">✓ {t('story.published')}</span>{t('story.publishedHint')}</p>}
        </div>
      )} />
      {consent && (
        <div className="fixed inset-0 z-30 bg-ink/40 flex items-center justify-center p-5" onClick={() => setConsent(false)}>
          <div className="bg-paper border border-ink p-8 max-w-[480px] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="ed-caps mb-3">{zh ? '发布前' : 'Before publishing'}</div>
            <h2 className="h2 mb-3">{p.mode === 'self' ? (zh ? '确定公开这个故事吗？' : 'Make this story public?') : (zh ? `${p.name}知道并同意公开这个故事吗？` : `Does ${p.name} know and agree to publish this?`)}</h2>
            <p className="text-ink-2 text-[14.5px] mb-5">{zh ? '发布后其他家庭能看到文字和已确认的注释，可以评论和转发；原声只对家人开放。随时可以取消发布，转发的副本会一起撤回。' : 'Other families will see the text and confirmed notes and can comment and repost; audio stays family-only. You can unpublish any time and reposts are withdrawn.'}{p.mode !== 'self' && (zh ? ' 这是他的故事和声音——请先问过他。' : ' It is their story — ask first.')}</p>
            <label className="flex items-start gap-3 text-[14.5px] mb-6 cursor-pointer"><input type="checkbox" className="mt-1.5 accent-ink" checked={agree} onChange={(e) => setAgree(e.target.checked)} />{p.mode === 'self' ? (zh ? '我确认公开这个故事。' : 'I confirm I want this story public.') : (zh ? `我已经问过${p.name}，他同意公开这个故事。` : `I asked ${p.name} and they agree.`)}</label>
            <div className="flex items-center gap-6 justify-end"><button className="link-soft text-[14px]" onClick={() => setConsent(false)}>{t('common.cancel')}</button><button className="btn btn-primary" disabled={!agree} onClick={() => { publish(raw, true); setConsent(false); setAgree(false); nav('/read/c-' + story.id, { state: { published: true } }); }}>{t('story.publish')}</button></div>
          </div>
        </div>
      )}
    </Shell>
  );
}
