import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { Avatar, PageHeader, TwoCol, useToast, useFamilyName, copyText } from '../components/Shell';
import { useT, LANGUAGES } from '../lib/i18n';
import { useStore, FREE_MEMBERS } from '../lib/store';
import { profileView } from '../lib/loc';

// "Family" = the family unit, not an invite form.
// Model: one family space per family → members (each with their own account) → storytellers → stories.
// Everyone in the family sees every story recorded by anyone in it; nobody outside does.
export default function Family() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate();
  const { state, live, addInvite, removeInvite, removeMember, createInvite, revokeInvite, allStories, setActive, setFamilyName, updateStoryteller, setMeAvatar, setInviteAvatar } = useStore(); const fam = useFamilyName(); const [renaming, setRenaming] = useState(false); const [nm, setNm] = useState('');
  const [contact, setContact] = useState(''); const perms = ['read', 'correct', 'add']; const [toast, toastEl] = useToast(); const [making, setMaking] = useState(false);
  const you = { name: state.userName || (state.email ? state.email.split('@')[0] : (zh ? '我' : 'Me')), sub: t('family.creator'), perms, me: true };
  // Real mode: members come from the family_members table; demo mode keeps the local list.
  const members = live
    ? state.members.map((m) => ({ name: m.name || (zh ? '家人' : 'Member'), sub: m.role === 'owner' ? 'creator' : 'member', me: m.userId === state.userId, userId: m.userId, avatar: m.avatar }))
    : [you, ...state.invites];
  const isOwner = !live || state.family?.role === 'owner';
  // The current invite code and the link that carries it. Codes live in the invites table.
  // Free plan: you + 1 family member. When that's used up, no code is offered (the server refuses extra joins too).
  const full = live && state.plan !== 'family' && state.members.length >= FREE_MEMBERS;
  const code = full ? null : live ? state.inviteCodes[0] : state.inviteCode;
  const origin = typeof window !== 'undefined' && /^https?:/.test(window.location.origin) ? window.location.origin : 'https://echoestory.com';
  const inviteLink = code ? origin + '/invite/' + code : '';
  const newCode = async () => { setMaking(true); try { await createInvite(); toast(zh ? '新邀请码已生成' : 'New code created'); } catch (e) { toast((zh ? '没生成：' : 'Failed: ') + e.message); } finally { setMaking(false); } };
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
            <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-1"><h2 className="h2 m-0">{t('invite.storytellers')}</h2><button className="link-soft text-[13.5px]" onClick={() => (state.plan === 'free' && state.storytellers.length >= 1 ? nav('/upgrade?why=storyteller') : nav('/mode?add=1'))}>{t('invite.addStoryteller')}</button></div>
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
                  <span className="flex-1 min-w-0"><span className="block font-medium">{v.name}{v.me && <span className="text-[12px] text-ink-3 font-normal ml-2">· {t('invite.you')}</span>}</span><span className="block text-[12.5px] text-ink-2">{v.sub === 'creator' ? t('family.creator') : v.sub === '待接受' || v.sub === 'pending' ? t('invite.pending') : v.sub === 'member' ? t('family.member') : v.sub}</span></span>
                  {!v.me && isOwner && <button className="link-soft text-[13px]" onClick={() => (live ? removeMember(v.userId) : removeInvite(i - 1))}>{t('invite.remove')}</button>}
                </div>
              ))}
            </div>
          </section>
          {/* every story in the family, whoever recorded it and for whichever storyteller */}
          <section>
            <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-1"><h2 className="h2 m-0">{zh ? '家里的故事' : 'Family stories'}</h2><span className="ed-caps">{allStories.length}</span></div>
            {allStories.length === 0 ? <p className="text-[13.5px] text-ink-3 mt-3">{zh ? '还没有故事。' : 'No stories yet.'}</p> : (
              <div className="divide-y divide-line border-b border-line">
                {[...allStories].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((s) => {
                  const teller = profileView(state.storytellers.find((x) => x.id === s.storytellerId), lang);
                  const by = live ? state.members.find((m) => m.userId === s.authorId) : null;
                  return (
                    <a key={s.id} href={'/story/' + s.id} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); if (s.storytellerId) setActive(s.storytellerId); nav('/story/' + s.id); }} className="py-4 grid grid-cols-[1fr_auto] gap-4 items-baseline hover:bg-line-2/40 -mx-2 px-2">
                      <span className="min-w-0"><span className="block font-medium truncate">{s.title || (zh ? '（无标题）' : '(untitled)')}</span><span className="block text-[12.5px] text-ink-2 truncate">{[teller?.name, by?.name && (zh ? `${by.name} 录的` : `recorded by ${by.name}`)].filter(Boolean).join(' · ')}</span></span>
                      <span className="text-[12.5px] text-ink-3 tabular-nums">{s.date}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )} aside={(
        <div className="aside-block">
          <div className="ed-caps mb-2">{t('invite.inviteTitle')}</div>
          <p className="text-[13.5px] text-ink-2 mb-4">{t('invite.inviteSub')}</p>
          {full ? (
            <div className="border-l-2 border-accent pl-4 text-[13.5px]">
              <p className="m-0 mb-2">{zh ? '免费版可以邀请 1 位家人，你们家已经用完了。已经加入的家人会一直保留。' : 'The free plan includes 1 family member, and it’s in use. Members who already joined always stay.'}</p>
              <button className="link" onClick={() => nav('/upgrade?why=members')}>{zh ? '升级家庭版，邀请更多家人' : 'Upgrade to invite more family'} →</button>
            </div>
          ) : (<>
          {!live && (<><input className="field w-full mb-4 text-[15px]" type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t('invite.contactPh')} />
          <button className="btn btn-primary" disabled={!/^\S+@\S+\.\S+$/.test(contact)} onClick={() => { addInvite({ name: contact, sub: 'pending', perms }); setContact(''); toast(zh ? '邀请已发送' : 'Invitation sent'); }}>{t('invite.send')}</button></>)}
          <div className={(live ? '' : 'mt-6 pt-4 border-t border-line')}>
            <div className="flex items-baseline justify-between"><span className="ed-caps">{t('family.code')}</span>{code && <button className="link-soft text-[12.5px]" onClick={() => { copyText(code).then((ok) => toast(ok ? t('invite.copied') : (zh ? '复制失败，请长按手动复制' : 'Copy failed — select and copy manually'))); }}>{zh ? '复制' : 'Copy'}</button>}</div>
            {code ? <div className="serif text-[26px] tracking-[.12em] font-medium mt-1">{code}</div> : <button className="btn btn-primary mt-3" disabled={making} onClick={newCode}>{making ? '…' : (zh ? '生成邀请码' : 'Create an invite code')}</button>}
            <p className="text-[12.5px] text-ink-3 m-0 mt-1">{t('family.codeHint')}</p>
          </div>
          {code && <div className="mt-5 grid gap-2 text-[13.5px]">
            <button className="link-soft w-fit" onClick={() => { copyText(inviteLink).then((ok) => toast(ok ? t('invite.copied') : (zh ? '复制失败，请长按手动复制' : 'Copy failed — select and copy manually'))); }}>{t('invite.copy')}</button>
            <button className="link-soft w-fit" onClick={() => nav('/invite/' + code)}>{t('invite.preview')}</button>
            {live && <button className="link-soft w-fit" disabled={making} onClick={newCode}>{zh ? '换一个新码' : 'Make a new code'}</button>}
            {live && <button className="link-soft w-fit !text-ink-3" onClick={async () => { await revokeInvite(code); toast(zh ? '已作废' : 'Revoked'); }}>{zh ? '作废这个码' : 'Revoke this code'}</button>}
          </div>}
          </>)}
        </div>
      )} />
    </Shell>
  );
}
