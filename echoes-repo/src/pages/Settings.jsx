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
  const { state, allStories, setActive, setPlan, deleteAccount, updateStoryteller, reset, seedDemo, setMeAvatar, setMyName, live } = useStore(); const auth = useAuth(); const [demoBusy, setDemoBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false); const [myName, setMyNameDraft] = useState(null); const [nameSaved, setNameSaved] = useState(false);
  const { refreshBilling } = useStore(); const loc = useLocation(); const [justPaid, setJustPaid] = useState(false);
  // Back from Stripe Checkout: the webhook usually lands within seconds — check a few times.
  useEffect(() => {
    if (!live || !new URLSearchParams(loc.search).get('upgraded')) return;
    let n = 0, alive = true;
    const tick = async () => { const b = await refreshBilling(); if (!alive) return; if (b?.plan === 'family') setJustPaid(true); else if (++n < 10) setTimeout(tick, 2000); };
    tick(); return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const manage = async () => { try { window.location.href = await openPortal(state.family.id); } catch { alert(zh ? '暂时打不开订阅管理，请稍后再试。' : 'Could not open subscription settings. Please try again.'); } };
  const used = allStories.length; const lifetime = state.billing?.status === 'lifetime'; const cancelling = state.billing?.status === 'cancelling';
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
          {state.plan === 'free' && <p className="text-[12.5px] text-ink-3 mt-2">{zh ? '免费版：1 位讲述者、1 位家人；家庭版不限。' : 'Free: 1 storyteller and 1 family member. Family plan: unlimited.'}</p>}
        </Section>

        <Section title={zh ? '方案' : 'Plan'}>
          {justPaid && <p className="text-[14px] border-l-2 border-accent pl-3 mb-4">{zh ? '✓ 已开通家庭版，收据已发到你的邮箱。' : '✓ Family plan is active. Your receipt is on its way by email.'}</p>}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{state.plan === 'free' ? (zh ? '免费' : 'Free') : (zh ? '家庭版' : 'Family')}</div>
              {state.plan === 'free' ? (<><div className="text-[13.5px] text-ink-2 mb-2">{zh ? `已用 ${used} / ${FREE_LIMIT} 个故事` : `${used} / ${FREE_LIMIT} stories used`}</div><div className="tally">{Array.from({ length: FREE_LIMIT }).map((_, i) => <i key={i} className={i < used ? 'on' : ''} />)}</div></>)
                : <div className="text-[13.5px] text-ink-2">{lifetime ? (zh ? '终身版 · 一次付清，不再扣费。不限故事、讲述者和家人。' : 'Lifetime · paid once, never charged again. Unlimited stories, storytellers and family.') : zh ? '月付 · 不限故事、讲述者和家人。' + (state.billing?.current_period_end ? (cancelling ? `已取消，可用到 ${state.billing.current_period_end.slice(0, 10)}` : `下次续费：${state.billing.current_period_end.slice(0, 10)}`) : '') : 'Monthly · unlimited stories, storytellers and family.' + (state.billing?.current_period_end ? (cancelling ? ` Cancelled — active until ${state.billing.current_period_end.slice(0, 10)}.` : ` Renews ${state.billing.current_period_end.slice(0, 10)}.`) : '')}</div>}
            </div>
            {state.plan === 'free' ? <button className="btn btn-primary" onClick={() => nav('/upgrade')}>{zh ? '升级家庭版' : 'Upgrade'}</button> : live ? <button className="link-soft text-[14px]" onClick={manage}>{lifetime ? (zh ? '查看收据' : 'Receipts') : (zh ? '管理订阅' : 'Manage subscription')}</button> : <button className="link-soft text-[14px]" onClick={() => setPlan('free')}>{zh ? '取消续费' : 'Don’t renew'}</button>}
          </div>
        </Section>

        <Section title={zh ? '账号' : 'Account'}>
          <div className="flex items-center gap-4 mb-5"><Avatar name={state.userName || (state.email ? state.email.split('@')[0] : '我')} src={state.meAvatar} size="w-14 h-14 text-[18px]" onPick={setMeAvatar} /><div className="text-[13.5px] text-ink-2">{zh ? '我的头像 · 点击更换' : 'My photo · click to change'}</div></div>
          <label className="label">{zh ? '我的名字（家人看到的）' : 'My name (what family sees)'}</label>
          <div className="flex gap-3 mb-5 max-w-[420px]"><input className="input flex-1" value={myName ?? state.userName ?? ''} onChange={(e) => { setMyNameDraft(e.target.value); setNameSaved(false); }} placeholder={zh ? '例如：小童' : 'e.g. Helen'} /><button className="btn" disabled={!String(myName ?? '').trim() || myName === state.userName} onClick={async () => { try { await setMyName(myName); setNameSaved(true); setMyNameDraft(null); } catch { alert(zh ? '没保存上，请再试一次。' : 'Could not save. Please try again.'); } }}>{nameSaved ? '✓' : (zh ? '保存' : 'Save')}</button></div>
          <div className="text-[14px] mb-4"><span className="text-ink-2">{zh ? '邮箱' : 'Email'}</span> · {state.email || '—'} {state.verified ? <span className="ed-caps !text-accent ml-2">{zh ? '已验证' : 'Verified'}</span> : <span className="ed-caps ml-2">{zh ? '未验证' : 'Unverified'}</span>}</div>
          <div className="flex flex-wrap items-center gap-6">
            <button className="link-soft text-[14px]" onClick={async () => { await auth.signOut(); nav('/'); }}>{zh ? '退出登录' : 'Log out'}</button>
          </div>
        </Section>

        <Section title={zh ? '删除账号' : 'Delete account'}>
          {live
            ? <p className="text-[14px] text-ink-2 m-0">{zh ? '想删除账号和所有内容，请发邮件到 ' : 'To delete your account and everything in it, email '}<a className="link" href={'mailto:hello@echoestory.com?subject=' + encodeURIComponent(zh ? '删除我的余音账号' : 'Delete my Echoes account') + '&body=' + encodeURIComponent((zh ? '账号邮箱：' : 'Account email: ') + (state.email || ''))}>hello@echoestory.com</a>{zh ? '，我们会在 30 天内删除。' : ' and we will delete it within 30 days.'}</p>
            : (!confirmDel ? <button className="link-soft text-[14px] !text-rec" onClick={() => setConfirmDel(true)}>{zh ? '删除账号…' : 'Delete account…'}</button>
              : <div className="flex items-center gap-6"><button className="btn bg-rec text-white border-rec" onClick={() => { deleteAccount(); nav('/deleted'); }}>{zh ? '确定删除（演示）' : 'Yes, delete (demo)'}</button><button className="link-soft text-[14px]" onClick={() => setConfirmDel(false)}>{zh ? '取消' : 'Cancel'}</button></div>)}
        </Section>

        {/* Sample data is a preview-only tool. Real accounts only get a way to remove sample stories imported earlier. */}
        {live ? (allStories.some((x) => x.demo) && (
          <p className="text-[12px] text-ink-3 mt-8 text-center">{zh ? '示例数据' : 'Sample data'} · <button className="underline cursor-pointer" disabled={demoBusy} onClick={async () => { setDemoBusy(true); try { await reset(); } finally { setDemoBusy(false); } }}>{demoBusy ? '…' : (zh ? '删除示例故事' : 'Remove sample stories')}</button></p>
        )) : (
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
  const [choice, setChoice] = useState('monthly');
  const pay = async () => { setBusy(true); setErr(''); try { window.location.href = await startCheckout(state.family.id, choice); } catch (e) { setErr(zh ? '没能打开付款页，请稍后再试。' : 'Could not open the payment page. Please try again.'); setBusy(false); } };
  const usd = (p) => (p ? '$' + (p.amount / 100).toFixed(2) : '');
  const wait = async () => { if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(zh ? '邮箱格式不对。' : 'That email doesn’t look right.'); setBusy(true); setErr('');
    try { await joinWaitlist(email, state.userId, state.family?.id); setJoined(true); } catch { setErr(zh ? '没能加入，请稍后再试。' : 'Could not add you. Please try again.'); } finally { setBusy(false); } };
  const perks = zh ? [`超过 ${FREE_LIMIT} 个故事之后继续录`, '多位讲述者', '邀请更多家人（免费版只能邀请 1 位）'] : [`Keep recording after ${FREE_LIMIT} stories`, 'Multiple storytellers', 'Invite more family (free: 1 family member)'];
  return (
    <Shell>
      <Narrow className="pt-6">
        <div className="ed-caps mb-3">{zh ? '家庭版' : 'Family plan'}</div>
        <h1 className="serif font-medium text-[34px] leading-[1.25] m-0 mb-3">{why === 'storyteller' ? (zh ? '再给一位长辈建档，需要家庭版。' : 'A second storyteller needs the Family plan.') : why === 'limit' ? (zh ? `前 ${FREE_LIMIT} 个故事已经录满了。` : `You’ve used your ${FREE_LIMIT} free stories.`) : why === 'members' ? (zh ? '免费版只能邀请 1 位家人。' : 'The free plan includes 1 family member.') : (zh ? '升级到家庭版' : 'Upgrade to Family')}</h1>
        <p className="text-ink-2 mb-7">{zh ? '已有的故事、录音和照片永远保留，无论付不付费。照片对所有人免费。' : 'Existing stories, recordings and photos always stay, paid or not. Photos are free for everyone.'}</p>
        {canceled && <p className="text-[13.5px] text-ink-2 border-l-2 border-line pl-3 mb-6">{zh ? '付款没有完成，没有扣任何钱。' : 'Payment was not completed — nothing was charged.'}</p>}
        <div className="border-t border-ink pt-6">
          <ul className="m-0 p-0 list-none grid gap-2 text-[14.5px] mb-6">{perks.map((x) => <li key={x}>— {x}</li>)}</ul>
          {info === null ? <p className="text-ink-3">{zh ? '加载中…' : 'Loading…'}</p>
          : info.mode === 'stripe' ? (<>
              {/* two ways to pay: monthly (renews) or lifetime (once) — prices come from Stripe, in US dollars */}
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {[['monthly', info.prices?.monthly || info.price, zh ? '月付' : 'Monthly', zh ? '/ 月' : '/ month', zh ? '每月自动续费，随时可以取消' : 'Renews every month · cancel any time'],
                  ['lifetime', info.prices?.lifetime, zh ? '终身' : 'Lifetime', zh ? '一次付清' : 'once', zh ? '一次付清，不再扣费' : 'Pay once, never charged again']]
                  .filter(([, p]) => p).map(([k, p, name, per, note]) => (
                  <button key={k} onClick={() => setChoice(k)} className={'text-left border p-4 cursor-pointer ' + (choice === k ? 'border-ink bg-line-2/40' : 'border-line hover:border-ink-3')} aria-pressed={choice === k}>
                    <span className="ed-caps block mb-2">{name}</span>
                    <span className="serif text-[28px] leading-none">{usd(p)}</span><span className="text-[13px] text-ink-2 ml-1.5">USD {per}</span>
                    <span className="block text-[12.5px] text-ink-2 mt-2">{note}</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-primary w-full btn-lg" disabled={busy} onClick={pay}>{busy ? (zh ? '正在打开付款页…' : 'Opening payment…') : (zh ? '去付款' : 'Continue to payment')}</button>
              <p className="text-[12.5px] text-ink-3 mt-3 m-0 text-center">{zh ? '付款在 Stripe 的安全页面完成，我们看不到你的卡号。' : 'Payment happens on Stripe’s secure page; we never see your card.'}</p>
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
          <p className="text-[12.5px] text-ink-3 mt-4 mb-0 text-center">{zh ? '价格以美元计。如需退款，请发邮件到 ' : 'Prices in US dollars. For a refund, email '}<a className="underline" href="mailto:hello@echoestory.com">hello@echoestory.com</a>{zh ? '。付款即表示同意' : '. By paying you agree to the '}<a className="underline" href="/terms">{zh ? '服务条款' : 'Terms'}</a>{zh ? '和' : ' and '}<a className="underline" href="/privacy">{zh ? '隐私政策' : 'Privacy Policy'}</a>{zh ? '。' : '.'}</p>
          <div className="text-center mt-5"><button className="link-soft text-[14px]" onClick={() => nav(-1)}>{zh ? '先不用' : 'Not now'}</button></div>
        </div>
      </Narrow>
    </Shell>
  );
}
