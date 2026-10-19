import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Shell, { Avatar, Narrow } from '../components/Shell';
import { useT, LANGUAGES } from '../lib/i18n';
import { useStore, FREE_LIMIT } from '../lib/store';
import { useAuth } from '../lib/auth';
import { profileView } from '../lib/loc';

export default function Settings() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate();
  const { state, allStories, setActive, setPlan, deleteAccount, updateStoryteller, reset, setMeAvatar } = useStore(); const auth = useAuth();
  const [confirmDel, setConfirmDel] = useState(false); const [exported, setExported] = useState(false);
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
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{state.plan === 'free' ? (zh ? '免费' : 'Free') : (zh ? '家庭版' : 'Family')}</div>
              {state.plan === 'free' ? (<><div className="text-[13.5px] text-ink-2 mb-2">{zh ? `已用 ${used} / ${FREE_LIMIT} 个故事` : `${used} / ${FREE_LIMIT} stories used`}</div><div className="tally">{Array.from({ length: FREE_LIMIT }).map((_, i) => <i key={i} className={i < used ? 'on' : ''} />)}</div></>)
                : <div className="text-[13.5px] text-ink-2">{zh ? '不限故事、不限讲述者、不限家人。不自动续费。' : 'Unlimited stories, storytellers and family. No auto-renew.'}</div>}
            </div>
            {state.plan === 'free' ? <button className="btn btn-primary" onClick={() => nav('/upgrade')}>{zh ? '升级家庭版' : 'Upgrade'}</button> : <button className="link-soft text-[14px]" onClick={() => setPlan('free')}>{zh ? '取消续费' : 'Don’t renew'}</button>}
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
        <p className="text-[12px] text-ink-3 mt-8 text-center">{zh ? '演示环境' : 'Demo environment'} · <button className="underline cursor-pointer" onClick={() => { reset(); nav('/'); }}>{zh ? '清空演示数据（开发用）' : 'Clear demo data (dev)'}</button></p>
      </Narrow>
    </Shell>
  );
}

export function Upgrade() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { setPlan } = useStore();
  const loc = useLocation(); const why = new URLSearchParams(loc.search).get('why');
  const [period, setPeriod] = useState('year'); const [done, setDone] = useState(false);
  return (
    <Shell>
      <Narrow className="pt-6">
        <div className="ed-caps mb-3">{zh ? '家庭版' : 'Family plan'}</div>
        <h1 className="serif font-medium text-[34px] leading-[1.25] m-0 mb-3">{why === 'storyteller' ? (zh ? '再给一位长辈建档，需要家庭版。' : 'A second storyteller needs the Family plan.') : why === 'limit' ? (zh ? '前 10 个故事已经录满了。' : 'You’ve used your 10 free stories.') : (zh ? '升级到家庭版' : 'Upgrade to Family')}</h1>
        <p className="text-ink-2 mb-7">{zh ? '已有的故事和录音永远可读、可下载，无论付不付费。' : 'Existing stories and recordings stay readable and downloadable, paid or not.'}</p>
        {done ? (
          <div className="border-t border-ink pt-6 text-center"><div className="text-[30px] mb-2">✓</div><h2 className="text-[20px] font-semibold mb-1">{zh ? '已开通家庭版' : 'Family plan active'}</h2><p className="text-ink-2 mb-5">{zh ? '收据已发到邮箱。不自动续费，到期前会提醒你。' : 'Receipt sent by email. No auto-renew; we’ll remind you before it ends.'}</p><button className="btn btn-primary" onClick={() => nav(-1)}>{zh ? '继续' : 'Continue'}</button></div>
        ) : (
          <div className="border-t border-ink pt-6">
            <div className="seg mb-6"><button className={period === 'year' ? 'on' : ''} onClick={() => setPeriod('year')}>{zh ? '按年 ¥580' : 'Yearly $79'}</button><button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>{zh ? '按月 ¥68' : 'Monthly $9'}</button></div>
            <ul className="m-0 p-0 list-none grid gap-2 text-[14.5px] mb-6">{(zh ? ['不限故事数量', '多位讲述者', '不限家人数量', '照片、视频、音乐', '导出整本故事书'] : ['Unlimited stories', 'Multiple storytellers', 'Unlimited family', 'Photos, video, music', 'Export the whole book']).map((x) => <li key={x}>✓ {x}</li>)}</ul>
            <label className="label">{zh ? '支付方式' : 'Payment'}</label>
            <div className="chips mb-6"><span className="chip on">{zh ? '微信支付' : 'Card'}</span><span className="chip">{zh ? '支付宝' : 'Apple Pay'}</span><span className="chip">{zh ? '银行卡' : 'WeChat Pay'}</span></div>
            <button className="btn btn-primary w-full btn-lg" onClick={() => { setPlan('family'); setDone(true); }}>{zh ? `支付 ${period === 'year' ? '¥580' : '¥68'}` : `Pay ${period === 'year' ? '$79' : '$9'}`}</button>
            <p className="text-[12.5px] text-ink-3 mt-3 m-0 text-center">{zh ? '7 天内无理由退款 · 不自动续费 · 演示环境不会真的扣款' : '7-day refund · no auto-renew · demo: no real charge'}</p>
            <div className="text-center mt-4"><button className="link-soft text-[14px]" onClick={() => nav(-1)}>{zh ? '先不用' : 'Not now'}</button></div>
          </div>
        )}
      </Narrow>
    </Shell>
  );
}
