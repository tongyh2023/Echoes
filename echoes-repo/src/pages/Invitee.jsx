import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Public from '../components/Public';
import { Brand, LangToggle, Audio, Avatar } from '../components/Shell';
import StoryText from '../components/StoryText';
import { useT } from '../lib/i18n';
import { useStore, setPendingInvite } from '../lib/store';
import { useAuth, friendlyError } from '../lib/auth';
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
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { code } = useParams();
  const { live, state, previewInvite, joinFamily } = useStore(); const auth = useAuth();
  const demo = useInviteData();
  const [preview, setPreview] = useState(undefined); // undefined = loading, null = bad code
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => {
    if (!live) { setPreview({ familyName: '', storytellerName: demo.p.name, storyCount: demo.stories.length, host: demo.host, p: demo.p }); return; }
    previewInvite(code).then((r) => setPreview(r)).catch(() => setPreview(null));
  }, [code, live]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signed in → join now. Not signed in → remember the code, sign up, and the store joins after login.
  const go = async () => {
    if (!live) { joinFamily('DEMO-0000'); nav('/home'); return; }
    if (auth.user) {
      setErr(''); setBusy(true);
      try { await joinFamily(code); nav('/home', { replace: true }); } catch (e) { setErr(friendlyError(e, zh)); } finally { setBusy(false); }
    } else { setPendingInvite(code.toUpperCase()); nav('/signup'); }
  };
  const alreadyIn = live && auth.user && state.family && preview && state.family.name === preview.familyName;

  return (
    <Public>
      <div className="mx-auto max-w-[520px] px-5 py-12">
        <div className="eyebrow mb-3">{zh ? '你收到一个邀请' : 'You’ve been invited'}</div>
        {preview === undefined && <p className="text-ink-2">{zh ? '正在查看邀请…' : 'Checking the invitation…'}</p>}
        {preview === null && (<>
          <h1 className="h1 mb-3">{zh ? '这个邀请码不能用了' : 'This invite code no longer works'}</h1>
          <p className="text-ink-2 mb-6">{zh ? '可能已经被人用过，或者被作废了。让邀请你的人再生成一个新码。' : 'It may have been used already or revoked. Ask the person who invited you for a new one.'}</p>
          <Link to="/" className="link">{zh ? '回到首页' : 'Back to home'}</Link>
        </>)}
        {preview && (<>
          <h1 className="h1 mb-3">{live
            ? (zh ? `${preview.familyName}邀请你来听${preview.storytellerName || '家里'}的故事。` : `${preview.familyName} invited you to ${preview.storytellerName ? preview.storytellerName + '’s' : 'their'} stories.`)
            : (zh ? `${preview.host}邀请你来听${preview.p.name}的故事。` : `${preview.host} invited you to ${preview.p.name}'s stories.`)}</h1>
          <p className="text-ink-2 mb-6">{zh ? `目前有 ${preview.storyCount} 个故事，带着原声。加入后你可以读、听，还能帮忙确认几个方言词写得对不对。` : `${preview.storyCount} stories so far, with original audio. Once you join you can read, listen, and help confirm a few dialect words.`}</p>
          {preview.storytellerName && <div className="border-t border-b border-line py-4 mb-6 flex items-center gap-4"><Avatar name={preview.storytellerName} src={preview.p?.avatar} size="w-12 h-12 text-[18px]" /><div><div className="font-medium">{preview.storytellerName}</div><div className="text-[13px] text-ink-2">{preview.familyName}</div></div></div>}
          {alreadyIn ? (
            <div className="border-t border-ink pt-6 text-center"><p className="m-0 mb-4">{zh ? '你已经在这个家里了。' : 'You’re already in this family.'}</p><button className="btn btn-primary w-full" onClick={() => nav('/home')}>{zh ? '进去看看' : 'Open the stories'}</button></div>
          ) : (<>
            <button className="btn btn-primary w-full btn-lg" disabled={busy} onClick={go}>{busy ? '…' : auth.user || !live ? (zh ? '加入这个家' : 'Join this family') : (zh ? '注册并加入' : 'Sign up and join')}</button>
            {err && <p className="text-rec text-[13.5px] mt-3">{err}</p>}
            <p className="text-[12.5px] text-ink-3 mt-3">{auth.user || !live
              ? (zh ? '加入后，家里所有人录的故事你都能看到；家外的人看不到。' : 'Once you join you see every story this family records; nobody outside the family can.')
              : (zh ? `已有账号？` : 'Already have an account?')} {!auth.user && live && <button className="link" onClick={() => { setPendingInvite(code.toUpperCase()); nav('/login'); }}>{zh ? '登录后加入' : 'Log in to join'}</button>}</p>
          </>)}
        </>)}
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
      <div className="mb-5"><Audio dur={s0.duration} src={s0.audioUrl} path={s0.audioPath} /></div>
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
