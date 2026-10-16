import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { Avatar, PageHeader, TwoCol, useToast, useFamilyName } from '../components/Shell';
import { useT, LANGUAGES } from '../lib/i18n';
import { useStore } from '../lib/store';
import { profileView } from '../lib/loc';

// "Family" = the family unit, not an invite form.
// Model: one family space per family → members (each with their own account) → storytellers → stories.
// Everyone in the family sees every story recorded by anyone in it; nobody outside does.
export default function Family() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate();
  const { state, addInvite, removeInvite, allStories, setActive, setFamilyName, updateStoryteller, setMeAvatar, setInviteAvatar } = useStore(); const fam = useFamilyName(); const [renaming, setRenaming] = useState(false); const [nm, setNm] = useState('');
  const [contact, setContact] = useState(''); const perms = ['read', 'correct', 'add']; const [toast, toastEl] = useToast();
  const labels = { read: t('invite.read'), correct: t('invite.correct'), add: t('invite.add') };
  const you = { name: state.email ? state.email.split('@')[0] : (zh ? '我' : 'Me'), sub: t('family.creator'), perms, me: true };
  const members = [you, ...state.invites];
  return (
    <Shell>
      {toastEl}
      <PageHeader title={renaming ? <span className="inline-flex items-center gap-2"><input className="field text-[32px] serif w-[280px]" value={nm} onChange={(e) => setNm(e.target.value)} autoFocus /><button className="btn btn-sm btn-primary" onClick={() => { setFamilyName(nm.trim()); setRenaming(false); }}>{t('common.ok')}</button><button className="link-soft text-[13.5px]" onClick={() => setRenaming(false)}>{t('common.cancel')}</button></span> : fam}
        actions={!renaming && <button className="link-soft text-[13.5px]" onClick={() => { setNm(fam); setRenaming(true); }}>{t('family.rename')}</button>}
        sub={<span className="inline-flex flex-wrap items-center gap-2"><span className="inline-block w-3.5 h-3.5 border border-ink-3 relative"><span className="absolute left-1/2 -top-[5px] -translate-x-1/2 w-2 h-2 border border-ink-3 border-b-0" /></span>{t('family.private')}{!state.familyName && <span className="text-ink-3 text-[13px]">· {zh ? '名字按第一位讲述者的姓取的，可以改' : 'Named after the first storyteller’s surname — rename any time'}</span>}</span>} />
      <TwoCol main={(
        <div className="grid gap-8">
          {/* storytellers */}
          <section>
            <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-1"><h2 className="h2 m-0">{t('invite.storytellers')}</h2><button className="link-soft text-[13.5px]" onClick={() => (state.plan === 'free' && state.storytellers.length >= 1 ? nav('/upgrade?why=storyteller') : nav('/mode'))}>{t('invite.addStoryteller')}</button></div>
            <div className="divide-y divide-line border-b border-line">
              {state.storytellers.map((s0) => { const s = profileView(s0, lang); return (
                <div key={s.id} className="py-4 flex items-center gap-4">
                  <Avatar name={s.name} src={s.avatar} size="w-12 h-12 text-[16px]" me={s.id === state.activeId && !s.avatar} onPick={(url) => updateStoryteller(s.id, { avatar: url })} />
                  <span className="flex-1 min-w-0"><span className="block font-medium">{s.name}</span><span className="block text-[12.5px] text-ink-2 truncate">{s.hometown} · {s.birth} · {LANGUAGES.find((l) => l.code === s.lang)?.label}{s.dialects?.length ? ' · ' + s.dialects.join('、') : ''}</span><span className="block text-[12.5px] text-ink-3">{t('invite.storiesN', { n: allStories.filter((x) => x.storytellerId === s.id).length })}</span></span>
                  {s.id === state.activeId ? <span className="ed-caps">{zh ? '当前' : 'Active'}</span> : <button className="link-soft text-[13.5px]" onClick={() => setActive(s.id)}>{zh ? '切换' : 'Switch'}</button>}
                </div>
              ); })}
            </div>
          </section>
          {/* members */}
          <section>
            <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-1"><h2 className="h2 m-0">{t('invite.members')}</h2><span className="ed-caps">{members.length}</span></div>
            <p className="text-[13px] text-ink-2 mt-3 mb-1">{t('family.memberCan')} {zh ? '点头像可以换照片。' : 'Click an avatar to change the photo.'}</p>
            <div className="divide-y divide-line border-b border-line">
              {members.map((v, i) => (
                <div key={i} className="py-4 flex items-center gap-4">
                  <Avatar name={v.name} src={v.me ? state.meAvatar : v.avatar} size="w-12 h-12 text-[16px]" me={v.me && !state.meAvatar} onPick={(url) => (v.me ? setMeAvatar(url) : setInviteAvatar(i - 1, url))} />
                  <span className="flex-1 min-w-0"><span className="block font-medium">{v.name}{v.me && <span className="text-[12px] text-ink-3 font-normal ml-2">· {t('invite.you')}</span>}</span><span className="block text-[12.5px] text-ink-2">{v.me ? t('family.creator') : v.sub === '待接受' || v.sub === 'pending' ? t('invite.pending') : v.sub === 'member' ? t('family.member') : v.sub}</span></span>
                  {!v.me && <button className="link-soft text-[13px]" onClick={() => removeInvite(i - 1)}>{t('invite.remove')}</button>}
                </div>
              ))}
            </div>
          </section>
        </div>
      )} aside={(
        <div className="aside-block">
          <div className="ed-caps mb-2">{t('invite.inviteTitle')}</div>
          <p className="text-[13.5px] text-ink-2 mb-4">{t('invite.inviteSub')}</p>
          <input className="field w-full mb-4 text-[15px]" type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t('invite.contactPh')} />
          <button className="btn btn-primary" disabled={!/^\S+@\S+\.\S+$/.test(contact)} onClick={() => { addInvite({ name: contact, sub: 'pending', perms }); setContact(''); toast(zh ? '邀请已发送' : 'Invitation sent'); }}>{t('invite.send')}</button>
          <div className="mt-6 pt-4 border-t border-line"><div className="flex items-baseline justify-between"><span className="ed-caps">{t('family.code')}</span><button className="link-soft text-[12.5px]" onClick={() => { navigator.clipboard?.writeText(state.inviteCode); toast(t('invite.copied')); }}>{zh ? '复制' : 'Copy'}</button></div><div className="serif text-[26px] tracking-[.12em] font-medium mt-1">{state.inviteCode}</div><p className="text-[12.5px] text-ink-3 m-0 mt-1">{t('family.codeHint')}</p></div>
          <div className="mt-5 grid gap-2 text-[13.5px]"><button className="link-soft w-fit" onClick={() => { navigator.clipboard?.writeText('https://echoes.app/#/invite/demo'); toast(t('invite.copied')); }}>{t('invite.copy')}</button><button className="link-soft w-fit" onClick={() => nav('/invite/demo')}>{t('invite.preview')}</button></div>
        </div>
      )} />
    </Shell>
  );
}
