import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Shell, { Avatar, Narrow } from '../components/Shell';
import { useT, LANGUAGES } from '../lib/i18n';
import { useStore, FREE_LIMIT } from '../lib/store';
import { useAuth } from '../lib/auth';
import { profileView } from '../lib/loc';
import { billingInfo, startCheckout, openPortal, joinWaitlist } from '../lib/db';

export default function Settings() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate();
  const { state, allStories, setActive, setPlan, deleteAccount, updateStoryteller, reset, seedDemo, setMeAvatar, live } = useStore(); const auth = useAuth(); const [demoBusy, setDemoBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false); const [exported, setExported] = useState(false);
  const { refreshBilling } = useStore(); const loc = useLocation(); const [justPaid, setJustPaid] = useState(false);
  // Back from Stripe Checkout: the webhook usually lands within seconds — check a few times.
  useEffect(() => {
    if (!live || !new URLSearchParams(loc.search).get('upgraded')) return;
    let n = 0, alive = true;
    const tick = async () => { const b = await refreshBilling(); if (!alive) return; if (b?.plan === 'family') setJustPaid(true); else if (++n < 10) setTimeout(tick, 2000); };
    tick(); return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const manage = async () => { try { window.location.href = await openPortal(state.family.id); } catch { alert(zh ? '暂时打不开订阅管理，请稍后再试。' : 'Could not open subscription settings. Please try again.'); } };
  const used = allStories.length;
  const Section = ({ title, children }) => <section className="border-t border-ink pt-4 mb-12"><h2 className="h2 mb-5">{title}</h2>{children}</section>;
  return (
    <Shell>
      <Narrow>
        <div className="ed-caps mb-2">{state.email}</div><h1 className="serif font-medium text-[40px] leading-[1.15] m-0 mb-10">{zh ? '设置' : 'Settings'}</h1>

        <Section title={zh ? '讲述者' : 'Storytellers'}>
          <div className="grid gap-2 mb-3">
            {state.storytellers.map((s0) => { const s = profileView(s0, lang); return (
              <div key={s.id} className="flex items-center gap-4 border-b border-line py-4">
                <Avatar name={s.name} src={s.avatar} size="w-11 h-11 text-[15px]" me={s.id === state.activeId && !s.avatar} onPick={(url) => updateStoryteller(s.id, { avatar: url })} />
                <span className="flex-1 min-w-0"><span className="block font-medium">{s.name} <span className="text-[12px] text-ink-3 font-normal">{s.mode === 'self' ? (zh ? '· 我自己' : '· myself') : s.relation ? `· ${zh ? '我的' : 'my '}${s.relation}` : ''}</span></span><span className="block text-[12.5px] text-ink-2 truncate">{s.hometown} · {LANGUAGES.find((l) => l.code === s.lang)?.label}{s.dialects?.length ? ' · ' + s.dialects.join('、') : ''} · {allStories.filter((x) => x.storytellerId === s.id).length} {zh ? '个故事' : 'stories'}</span></span>
                {s.id === state.activeId ? <span className="ed-caps">{zh ? '当前' : 'Active'}</span> : <button className="link-soft text-[13.5px]" onClick={() => setActive(s.id)}>{zh ? '切换' : 'Switch'}</button>}
                <button className="link-soft text-[13.5px]" onClick={() => nav('/profile?mode=' + s.mode + '&edit=' + s.id)}>{zh ? '编辑' : 'Edit'}</button>
              </div>
            ); })}
          </div>
          <button className="link-soft text-[14px]" onClick={() => { if (state.plan === 'free' && state.storytellers.length >= 1) nav('/upgrade?why=storyteller'); else nav('/mode?add=1'); }}>+ {zh ? '再加一位讲述者' : 'Add a storyteller'}</button>
          {state.plan === 'free' && <p className="text-[12.5px] text-ink-3 mt-2">{zh ? '免费版一位讲述者；家庭版不限。' : 'Free: one storyteller. Family: unlimited.'}</p>}
        </Section>

        <Section title={zh ? '方案' : 'Plan'}>
          {justPaid && <p className="text-[14px] border-l-2 border-accent pl-3 mb-4">{zh ? '✓ 已开通家庭版，收据已发到你的邮箱。' : '✓ Family plan is active. Your receipt is on its way by email.'}</p>}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{state.plan === 'free' ? (zh ? '免费' : 'Free') : (zh ? '家庭版' : 'Family')}</div>
              {state.plan === 'free' ? (<><div className="text-[13.5px] text-ink-2 mb-2">{zh ? `已用 ${used} / ${FREE_LIMIT} 个故事` : `${used} / ${FREE_LIMIT} stories used`}</div><div className="tally">{Array.from({ length: FREE_LIMIT }).map((_, i) => <i key={i} className={i < used ? 'on' : ''} />)}</div></>)
                : <div className="text-[13.5px] text-ink-2">{zh ? '不限故事、不限讲述者、不限家人。' + (state.billing?.current_period_end ? `下次续费：${state.billing.current_period_end.slice(0, 10)}` : '') : 'Unlimited stories, storytellers and family.' + (state.billing?.current_period_end ? ` Renews ${state.billing.current_period_end.slice(0, 10)}.` : '')}</div>}
            </div>
            {state.plan === 'free' ? <button className="btn btn-primary" onClick={() => nav('/upgrade')}>{zh ? '升级家庭版' : 'Upgrade'}</button> : live ? <button className="link-soft text-[14px]" onClick={manage}>{zh ? '管理订阅' : 'Manage subscription'}</button> : <button className="link-soft text-[14px]" onClick={() => setPlan('free')}>{zh ? '取消续费' : 'Don’t renew'}</button>}
          </div>
        </Section>

        <Section title={zh ? '账号' : 'Account'}>
          <div className="flex items-center gap-4 mb-5"><Avatar name={state.email ? state.email.split('@')[0] : '我'} src={state.meAvatar} size="w-14 h-14 text-[18px]" onPick={setMeAvatar} /><div className="text-[13.5px] text-ink-2">{zh ? '我的头像 · 点击更换' : 'My photo · click to change'}</div></div>
          <div className="text-[14px] mb-4"><span className="text-ink-2">{zh ? '邮箱' : 'Email'}</span> · {state.email || '—'} {state.verified ? <span className="ed-caps !text-accent ml-2">{zh ? '已验证' : 'Verified'}</span> : <span className="ed-caps ml-2">{zh ? '未验证' : 'Unverified'}</span>}</div>
          <div className="flex flex-wrap items-center gap-6">
            <button className="btn" onClick={() => { setExported(true); setTimeout(() => setExported(false), 2500); }}>{exported ? (zh ? '✓ 已开始打包，稍后发到邮箱' : '✓ Packing — link by email shortly') : (zh ? '导出全部内容' : 'Export everything')}</button>
            <button className="link-soft text-[14px]" onClick={async () => { await auth.signOut(); nav('/'); }}>{zh ? '退出登录' : 'Log out'}</button>
          </div>
          <p className="text-[12.5px] text-ink-3 mt-2 m-0">{zh ? '导出包含所有录音、文字、照片和注释，zip 格式。' : 'Export includes all recordings, text, photos and notes as a zip.'}</p>
        </Section>

        <Section title={zh ? '删除账号' : 'Delete account'}>
          {!confirmDel ? (<><p className="text-[14px] text-ink-2 mb-3">{zh ? '删除后 30 天内可以恢复，之后彻底清除，包括备份。建议先导出。' : 'Recoverable for 30 days, then permanently erased including backups. Export first.'}</p><button className="link-soft text-[14px] !text-rec" onClick={() => setConfirmDel(true)}>{zh ? '删除账号…' : 'Delete account…'}</button></>)
            : (<div className="border-l-2 border-rec pl-5 py-1"><p className="text-[14px] mb-3 m-0">{zh ? `确定删除？${used} 个故事和所有录音将在 30 天后被清除。` : `Delete? ${used} stories and all recordings will be erased after 30 days.`}</p><div className="flex items-center gap-6"><button className="btn bg-rec text-white border-rec" onClick={() => { deleteAccount(); nav('/deleted'); }}>{zh ? '确定删除' : 'Yes, delete'}</button><button className="link-soft text-[14px]" onClick={() => setConfirmDel(false)}>{zh ? '取消' : 'Cancel'}</button></div></div>)}
        </Section>

        {/* DEV ONLY — remove before launch. Clears all demo data in this browser. */}
        {live ? (
          <p className="text-[12px] text-ink-3 mt-8 text-center">{zh ? '示例数据' : 'Sample data'} · {allStories.some((x) => x.demo)
            ? <button className="underline cursor-pointer" disabled={demoBusy} onClick={async () => { setDemoBusy(true); try { await reset(); } finally { setDemoBusy(false); } }}>{demoBusy ? '…' : (zh ? '删除示例故事' : 'Remove sample stories')}</button>
            : <button className="underline cursor-pointer" disabled={demoBusy} onClick={async () => { setDemoBusy(true); try { await seedDemo(); nav('/home'); } finally { setDemoBusy(false); } }}>{demoBusy ? '…' : (zh ? '导入示例故事（童爷爷 · 3 个）' : 'Import sample stories (Grandpa Tong · 3)')}</button>}</p>
        ) : (
        <p className="text-[12px] text-ink-3 mt-8 text-center">{zh ? '演示环境' : 'Demo environment'} · <button className="underline cursor-pointer" onClick={() => { reset(); nav('/'); }}>{zh ? '清空演示数据（开发用）' : 'Clear demo data (dev)'}</button></p>
        )}
      </Narrow>
    </Shell>
  );
}

export function Upgrade() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { state, setPlan, live } = useStore();
  const loc = useLocation(); const qs = new URLSearchParams(loc.search); const why = qs.get('why'); const canceled = qs.get('canceled');
  const [info, setInfo] = useState(live ? null : { mode: 'demo' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [email, setEmail] = useState(state.email || ''); const [joined, setJoined] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { if (live) billingInfo().then(setInfo).catch(() => setInfo({ mode: 'waitlist' })); }, [live]);
  const money = (p) => p ? new Intl.NumberFormat(zh ? 'zh-CN' : 'en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.amount / 100) + (p.interval ? (zh ? (p.interval === 'year' ? ' / 年' : ' / 月') : (p.interval === 'year' ? ' / year' : ' / month')) : '') : '';
  const pay = async () => { setBusy(true); setErr(''); try { window.location.href = await startCheckout(state.family.id); } catch (e) { setErr(zh ? '没能打开付款页，请稍后再试。' : 'Could not open the payment page. Please try again.'); setBusy(false); } };
  const wait = async () => { if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(zh ? '邮箱格式不对。' : 'That email doesn’t look right.'); setBusy(true); setErr('');
    try { await joinWaitlist(email, state.userId, state.family?.id); setJoined(true); } catch { setErr(zh ? '没能加入，请稍后再试。' : 'Could not add you. Please try again.'); } finally { setBusy(false); } };
  const perks = zh ? [`超过 ${FREE_LIMIT} 个故事之后继续录`, '多位讲述者', '不限家人数量', '照片和视频'] : [`Keep recording after ${FREE_LIMIT} stories`, 'Multiple storytellers', 'Unlimited family members', 'Photos and video'];
  return (
    <Shell>
      <Narrow className="pt-6">
        <div className="ed-caps mb-3">{zh ? '家庭版' : 'Family plan'}</div>
        <h1 className="serif font-medium text-[34px] leading-[1.25] m-0 mb-3">{why === 'storyteller' ? (zh ? '再给一位长辈建档，需要家庭版。' : 'A second storyteller needs the Family plan.') : why === 'limit' ? (zh ? `前 ${FREE_LIMIT} 个故事已经录满了。` : `You’ve used your ${FREE_LIMIT} free stories.`) : (zh ? '升级到家庭版' : 'Upgrade to Family')}</h1>
        <p className="text-ink-2 mb-7">{zh ? '已有的故事和录音永远可读、可下载，无论付不付费。' : 'Existing stories and recordings stay readable and downloadable, paid or not.'}</p>
        {canceled && <p className="text-[13.5px] text-ink-2 border-l-2 border-line pl-3 mb-6">{zh ? '付款没有完成，没有扣任何钱。' : 'Payment was not completed — nothing was charged.'}</p>}
        <div className="border-t border-ink pt-6">
          <ul className="m-0 p-0 list-none grid gap-2 text-[14.5px] mb-6">{perks.map((x) => <li key={x}>— {x}</li>)}</ul>
          {info === null ? <p className="text-ink-3">{zh ? '加载中…' : 'Loading…'}</p>
          : info.mode === 'stripe' ? (<>
              {info.price && <div className="serif text-[28px] mb-4">{money(info.price)}</div>}
              <button className="btn btn-primary w-full btn-lg" disabled={busy} onClick={pay}>{busy ? (zh ? '正在打开付款页…' : 'Opening payment…') : (zh ? '去付款' : 'Continue to payment')}</button>
              <p className="text-[12.5px] text-ink-3 mt-3 m-0 text-center">{zh ? '付款在 Stripe 的安全页面完成，我们看不到你的卡号。随时可以在设置里取消。' : 'Payment happens on Stripe’s secure page; we never see your card. Cancel any time in Settings.'}</p>
            </>)
          : info.mode === 'waitlist' ? (joined
              ? <div className="text-center py-4"><div className="text-[30px] mb-2">✓</div><h2 className="text-[20px] font-semibold mb-1">{zh ? '已加入等待名单' : 'You’re on the list'}</h2><p className="text-ink-2">{zh ? '家庭版开放时，我们会第一时间发邮件告诉你。' : 'We’ll email you as soon as the Family plan opens.'}</p></div>
              : <>
                  <p className="text-[14.5px] mb-4">{zh ? '家庭版马上开放。留下邮箱，开放时第一时间通知你。' : 'The Family plan opens soon. Leave your email and we’ll tell you first.'}</p>
                  <div className="flex gap-3"><input className="input flex-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /><button className="btn btn-primary" disabled={busy} onClick={wait}>{zh ? '通知我' : 'Notify me'}</button></div>
                </>)
          : (done
              ? <div className="text-center py-4"><div className="text-[30px] mb-2">✓</div><h2 className="text-[20px] font-semibold mb-1">{zh ? '已开通家庭版（演示）' : 'Family plan active (demo)'}</h2><button className="btn btn-primary mt-4" onClick={() => nav(-1)}>{zh ? '继续' : 'Continue'}</button></div>
              : <button className="btn btn-primary w-full btn-lg" onClick={() => { setPlan('family'); setDone(true); }}>{zh ? '开通（演示，不扣款）' : 'Activate (demo, no charge)'}</button>)}
          {err && <p className="text-[13px] text-rec mt-3">{err}</p>}
          <div className="text-center mt-5"><button className="link-soft text-[14px]" onClick={() => nav(-1)}>{zh ? '先不用' : 'Not now'}</button></div>
        </div>
      </Narrow>
    </Shell>
  );
}
