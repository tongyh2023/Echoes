import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Shell, { Narrow } from '../components/Shell';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';

// Sign up · Log in · Forgot password · Verify email — all as UI states; no backend.
function Frame({ title, sub, children }) {
  return (<Shell nav={false}><Narrow className="pt-10"><h1 className="serif font-medium text-[34px] leading-[1.25] m-0 mb-3">{title}</h1>{sub && <p className="text-ink-2 mb-8">{sub}</p>}{children}</Narrow></Shell>);
}

export function SignUp() {
  const { t, lang } = useT(); const { signIn, seedDemo, joinFamily } = useStore(); const nav = useNavigate(); const [joining, setJoining] = useState(false); const [code, setCode] = useState(''); const [codeErr, setCodeErr] = useState('');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const zh = lang === 'zh';
  const go = () => { if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(zh ? '邮箱格式不对，再看一眼？' : 'That email doesn’t look right.'); if (pw.length < 8) return setErr(zh ? '密码至少 8 位。' : 'Password needs at least 8 characters.'); signIn(email); nav('/verify'); };
  return (
    <Frame title={t('auth.title')} sub={t('auth.sub')}>
      <label className="label">{t('auth.email')}</label><input className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <label className="label">{t('auth.pw')}</label><input className="input mb-2" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t('auth.pwHint')} />
      {err && <p className="text-rec text-[13.5px] mb-3">{err}</p>}
      <button className="btn btn-primary w-full btn-lg mt-4" onClick={go}>{t('auth.create')}</button>
      <p className="text-[12.5px] text-ink-3 mt-3">{zh ? '创建账号即表示同意' : 'By continuing you agree to the'} <Link to="/terms" className="underline">{zh ? '服务条款' : 'Terms'}</Link> {zh ? '和' : 'and'} <Link to="/privacy" className="underline">{zh ? '隐私政策' : 'Privacy Policy'}</Link>.</p>
      <p className="text-[13.5px] text-ink-2 mt-4">{t('auth.have')} <Link className="link" to="/login">{t('auth.login')}</Link></p>
      <div className="border-t border-line pt-4 mt-6">
        {joining ? (<>
          <div className="font-medium mb-1">{t('family.joinTitle')}</div><p className="text-[13px] text-ink-2 mb-3">{t('family.joinSub')}</p>
          <div className="flex gap-2"><input className="field flex-1 uppercase tracking-widest text-[16px]" value={code} onChange={(e) => { setCode(e.target.value); setCodeErr(''); }} placeholder={t('family.codePh')} /><button className="btn btn-primary" disabled={!code.trim()} onClick={() => { if (joinFamily(code.trim(), email)) nav('/home'); else setCodeErr(t('family.badCode')); }}>{t('family.joinBtn')}</button></div>
          {codeErr && <p className="text-rec text-[13px] mt-2 mb-0">{codeErr}</p>}
        </>) : <button className="link-soft text-[14px]" onClick={() => setJoining(true)}>{t('family.join')} →</button>}
      </div>
      <div className="divider my-8">{zh ? '演示' : 'Demo'}</div>
      <button className="btn w-full" onClick={() => { seedDemo(); nav('/home'); }}>{zh ? '用示例数据直接进入（童爷爷 · 3 个故事）' : 'Enter with sample data (Grandpa Tong · 3 stories)'}</button>
      <p className="text-[12.5px] text-ink-3 mt-3">{zh ? '给审核用的快捷入口；正式版本没有这个按钮。' : 'Reviewer shortcut; not in the real product.'}</p>
    </Frame>
  );
}

export function LogIn() {
  const { t, lang } = useT(); const { signIn, state } = useStore(); const nav = useNavigate(); const zh = lang === 'zh';
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const go = () => { if (!email || !pw) return setErr(zh ? '邮箱和密码都要填。' : 'Email and password are both required.'); signIn(email); nav(state.storytellers.length ? '/home' : '/mode'); };
  return (
    <Frame title={zh ? '欢迎回来' : 'Welcome back'}>
      <label className="label">{t('auth.email')}</label><input className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="flex justify-between items-baseline"><label className="label">{t('auth.pw')}</label><Link to="/forgot" className="link-soft text-[12.5px]">{zh ? '忘记密码？' : 'Forgot password?'}</Link></div>
      <input className="input mb-2" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
      {err && <p className="text-rec text-[13.5px] mb-3">{err}</p>}
      <button className="btn btn-primary w-full btn-lg mt-4" onClick={go}>{t('auth.login')}</button>
      <p className="text-[13.5px] text-ink-2 mt-4">{zh ? '还没有账号？' : 'No account yet?'} <Link className="link" to="/signup">{t('auth.create')}</Link></p>
    </Frame>
  );
}

export function Forgot() {
  const { lang } = useT(); const zh = lang === 'zh'; const [sent, setSent] = useState(false); const [email, setEmail] = useState('');
  return (
    <Frame title={zh ? '重设密码' : 'Reset password'} sub={zh ? '输入邮箱，我们发一个重设链接给你。链接 30 分钟内有效。' : 'Enter your email and we’ll send a reset link. It expires in 30 minutes.'}>
      {sent ? (
        <div className="border-t border-ink pt-6 text-center"><div className="text-[28px] mb-2">✉</div><p className="m-0">{zh ? `已发送到 ${email}。没收到的话看看垃圾邮件，或者` : `Sent to ${email}. Check spam, or`} <button className="link" onClick={() => setSent(false)}>{zh ? '再发一次' : 'send again'}</button>.</p></div>
      ) : (<><input className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /><button className="btn btn-primary w-full btn-lg" disabled={!email} onClick={() => setSent(true)}>{zh ? '发送重设链接' : 'Send reset link'}</button></>)}
      <p className="text-[13.5px] text-ink-2 mt-5"><Link to="/login" className="link-soft">{zh ? '← 回到登录' : '← Back to log in'}</Link></p>
    </Frame>
  );
}

export function Verify() {
  const { lang } = useT(); const zh = lang === 'zh'; const { state, verify } = useStore(); const nav = useNavigate();
  return (
    <Frame title={zh ? '看一眼邮箱' : 'Check your inbox'} sub={zh ? `我们给 ${state.email} 发了一封验证邮件。点里面的链接就好。` : `We sent a verification email to ${state.email}. Click the link inside.`}>
      <div className="border border-line p-6 mb-5">
        <div className="ed-caps mb-3">{zh ? '邮件预览（演示）' : 'Email preview (demo)'}</div>
        <div className="serif text-[18px] mb-1">{zh ? '欢迎来到余音' : 'Welcome to Echoes'}</div>
        <p className="text-ink-2 text-[14px] m-0 mb-4">{zh ? '点下面的按钮验证邮箱，然后就可以为一位长辈建档了。' : 'Verify your email below, then set up your first storyteller.'}</p>
        <button className="btn btn-primary" onClick={() => { verify(); nav('/mode'); }}>{zh ? '验证邮箱' : 'Verify email'}</button>
      </div>
      <p className="text-[13.5px] text-ink-2">{zh ? '没收到？' : 'Didn’t get it?'} <button className="link-soft">{zh ? '再发一次' : 'Resend'}</button> · <button className="link-soft" onClick={() => nav('/mode')}>{zh ? '先跳过' : 'Skip for now'}</button></p>
    </Frame>
  );
}
