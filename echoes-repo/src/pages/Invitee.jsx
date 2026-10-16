import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Public from '../components/Public';
import { Brand, LangToggle, Audio, Avatar } from '../components/Shell';
import StoryText from '../components/StoryText';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { DEFAULT_PROFILE, SEED_STORIES } from '../mock/data';
import { storyView, profileView } from '../lib/loc';

// The other side of "invite family": what the aunt sees when she opens the link.
// Mobile-first — this is the page most likely to be opened inside WeChat.

const useInviteData = () => {
  const { state } = useStore(); const { lang } = useT();
  const p = profileView(state.profile || DEFAULT_PROFILE, lang);
  const stories = (state.stories.length ? state.stories : SEED_STORIES).map((s) => storyView(s, lang));
  return { host: p.mode === 'self' ? p.name : (p.relation ? `${p.name}的${p.relation}` : '邵先生'), p, stories };
};

export function InviteLanding() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { host, p, stories } = useInviteData();
  const [step, setStep] = useState(0); const [name, setName] = useState('');
  return (
    <Public>
      <div className="mx-auto max-w-[520px] px-5 py-12">
        <div className="eyebrow mb-3">{zh ? '你收到一个邀请' : 'You’ve been invited'}</div>
        <h1 className="h1 mb-3">{zh ? `${host}邀请你来听${p.name}的故事。` : `${host} invited you to ${p.name}'s stories.`}</h1>
        <p className="text-ink-2 mb-6">{zh ? `目前有 ${stories.length} 个故事，带着原声。你可以读、听，还能帮忙确认几个方言词写得对不对。` : `${stories.length} stories so far, with original audio. You can read, listen, and help confirm a few dialect words.`}</p>
        <div className="border-t border-b border-line py-4 mb-6 flex items-center gap-4"><Avatar name={p.name} src={p.avatar} size="w-12 h-12 text-[18px]" /><div><div className="font-medium">{p.name}</div><div className="text-[13px] text-ink-2">{p.hometown} · {p.birth}{p.dialects?.length ? ' · ' + p.dialects.join('、') : ''}</div></div></div>
        {step === 0 ? (
          <>
            <label className="label">{zh ? '你的称呼（家人会看到）' : 'Your name (family will see it)'}</label>
            <input className="input mb-4" value={name} onChange={(e) => setName(e.target.value)} placeholder={zh ? '例如：林姑姑' : 'e.g. Aunt Lin'} />
            <button className="btn btn-primary w-full btn-lg" disabled={!name.trim()} onClick={() => setStep(1)}>{zh ? '进去看看' : 'Open the stories'}</button>
            <p className="text-[12.5px] text-ink-3 mt-3">{zh ? '不需要密码。这个链接只对被邀请的人有效，可以随时被收回。' : 'No password needed. The link works only for invitees and can be revoked any time.'}</p>
          </>
        ) : (
          <div className="border-t border-ink pt-6 text-center"><div className="text-[28px] mb-1">✓</div><p className="m-0 mb-4">{zh ? `欢迎，${name}。` : `Welcome, ${name}.`}</p><button className="btn btn-primary w-full" onClick={() => nav('/shared')}>{zh ? '开始读' : 'Start reading'}</button></div>
        )}
      </div>
    </Public>
  );
}

function ReaderShell({ children }) {
  const { p } = useInviteData(); const { lang } = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-paper/92 backdrop-blur sticky top-0 z-10"><div className="mx-auto max-w-[760px] px-5 h-[68px] flex items-center gap-3"><Brand /><span className="text-[13px] text-ink-2">· {p.name}{lang === 'zh' ? '的故事' : '’s stories'}</span><span className="flex-1" /><LangToggle /><span className="ed-caps">{lang === "zh" ? "家人视角" : "Family view"}</span></div></header>
      <main className="mx-auto w-full max-w-[760px] px-5 py-8 flex-1">{children}</main>
    </div>
  );
}

export function SharedList() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { p, stories } = useInviteData();
  const pending = stories.reduce((n, s) => n + s.terms.filter((x) => x.status === 'pending').length, 0);
  return (
    <ReaderShell>
      <h1 className="h1 mb-1">{p.name}{zh ? '的故事' : '’s stories'}</h1>
      <p className="text-ink-2 mb-5">{zh ? `${stories.length} 个故事` : `${stories.length} stories`}{pending ? ` · ${pending} ${zh ? '个词等你确认' : 'words need your confirmation'}` : ''}</p>
      <div className="grid gap-3">
        {stories.map((s) => (
          <button key={s.id} onClick={() => nav('/shared/' + s.id)} className="row-link grid-cols-[1fr_auto] items-center text-left">
            <span className="w-11 h-11 avatar flex items-center justify-center text-[13px] flex-none">▶</span>
            <span className="flex-1 min-w-0"><span className="block font-medium text-[16.5px] serif">{s.title}</span><span className="block text-[13px] text-ink-2">{s.era} · {s.place} · {s.duration}{s.terms.some((x) => x.status === 'pending') ? ` · ${s.terms.filter((x) => x.status === 'pending').length} ${zh ? '处待确认' : 'pending'}` : ''}</span></span>
          </button>
        ))}
      </div>
      <p className="text-[12.5px] text-ink-3 mt-8">{zh ? '你只能读和确认注释，不能编辑故事正文。想添加自己的故事？请让邀请你的人开启权限。' : 'You can read and confirm notes but not edit the text. To add your own stories, ask the person who invited you.'}</p>
    </ReaderShell>
  );
}

export function SharedStory() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { id } = useParams(); const { stories } = useInviteData(); const { updateStory, state } = useStore();
  const s0 = stories.find((x) => x.id === id) || stories[0];
  const [local, setLocal] = useState(s0.terms); const [fixing, setFixing] = useState(null); const [thanks, setThanks] = useState(false);
  const setTerm = (tid, patch) => { const terms = local.map((t) => (t.id === tid ? { ...t, ...patch } : t)); setLocal(terms); if (state.stories.some((x) => x.id === s0.id)) updateStory(s0.id, { terms }); setThanks(true); setTimeout(() => setThanks(false), 1800); };
  return (
    <ReaderShell>
      <button className="ed-caps hover:!text-ink cursor-pointer mb-6" onClick={() => nav('/shared')}>← {zh ? '全部故事' : 'All stories'}</button>
      <div className="eyebrow mb-1">{s0.era} · {s0.place}</div>
      <h1 className="h1 mb-4">{s0.title}</h1>
      <div className="mb-5"><Audio dur={s0.duration} src={s0.audioUrl} /></div>
      <StoryText paragraphs={s0.text.first} terms={local} className="text-[18px]" />
      <div className="mt-8">
        <div className="eyebrow mb-2">{zh ? '这些词写得对吗？' : 'Are these right?'}</div>
        <div className="grid gap-2">
          {local.map((tm) => (
            <div key={tm.id} className="notes-row">
              <div className="flex items-center gap-2"><span className="font-bold text-[16px]">{tm.word}</span><span className="text-[11px] text-ink-2 uppercase tracking-wider">{tm.kind}</span><span className="flex-1" /><span className={'tag ' + (tm.status === 'ok' ? 'tag-ok' : '')}>{tm.status === 'ok' ? (zh ? '已确认' : 'Confirmed') : (zh ? '待确认' : 'Pending')}</span></div>
              {fixing === tm.id ? (<div className="mt-2"><textarea className="input text-[14px]" value={tm.note} onChange={(e) => setLocal(local.map((t) => (t.id === tm.id ? { ...t, note: e.target.value } : t)))} /><button className="btn btn-sm mt-2" onClick={() => { setTerm(tm.id, { status: 'ok' }); setFixing(null); }}>{zh ? '提交修改' : 'Submit'}</button></div>)
                : (<><p className="text-[13.5px] text-ink-2 mt-1 mb-2">{tm.note}</p>{tm.status !== 'ok' && <div className="flex gap-2"><button className="btn btn-sm" onClick={() => setTerm(tm.id, { status: 'ok' })}>✓ {zh ? '对' : 'Correct'}</button><button className="btn btn-ghost btn-sm" onClick={() => setFixing(tm.id)}>{zh ? '不对，我来改' : 'Not quite — fix it'}</button></div>}</>)}
            </div>
          ))}
          {local.length === 0 && <p className="text-ink-3 text-[14px]">{zh ? '这个故事没有需要确认的词。' : 'Nothing to confirm in this story.'}</p>}
        </div>
        {thanks && <div className="mt-3 text-[13.5px] text-ok">✓ {zh ? '谢谢，已经记下了。' : 'Thanks — noted.'}</div>}
      </div>
    </ReaderShell>
  );
}
