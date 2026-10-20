import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Shell, { Narrow } from '../components/Shell';
import { useT } from '../lib/i18n';
import { useStore, setPendingInvite } from '../lib/store';
import { useAuth, friendlyError } from '../lib/auth';

// Sign up · Log in · Forgot password · Reset password · Verify email.
// Every form talks to Supabase Auth through lib/auth.jsx; this file only draws the forms
// and turns errors into readable sentences. The demo shortcut keeps working without a database.
function Frame({ title, sub, children }) {
  return (<Shell nav={false}><Narrow className="pt-10"><h1 className="serif font-medium text-[34px] leading-[1.25] m-0 mb-3">{title}</h1>{sub && <p className="text-ink-2 mb-8">{sub}</p>}{children}</Narrow></Shell>);
}

export function SignUp() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const auth = useAuth(); const { seedDemo, joinFamily, live } = useStore();
  const [pendingCode, setPendingCode] = useState('');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false); const [code, setCode] = useState(''); const [codeErr, setCodeErr] = useState('');
  const go = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(zh ? '邮箱格式不对，再看一眼？' : 'That email doesn’t look right.');
    if (pw.length < 8) return setErr(zh ? '密码至少 8 位。' : 'Password needs at least 8 characters.');
    setErr(''); setBusy(true);
    try {
      const { needsEmailConfirm } = await auth.signUp(email, pw);
      nav(needsEmailConfirm ? '/verify' : '/mode', { state: { email } });
    } catch (e) { setErr(friendlyError(e, zh)); } finally { setBusy(false); }
  };
  return (
    <Frame title={t('auth.title')} sub={t('auth.sub')}>
      <label className="label">{t('auth.email')}</label><input id="su-email" className="input mb-4" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <label className="label">{t('auth.pw')}</label><input id="su-pw" className="input mb-2" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t('auth.pwHint')} onKeyDown={(e) => e.key === 'Enter' && go()} />
      {err && <p className="text-rec text-[13.5px] mb-3">{err}</p>}
      <button className="btn btn-primary w-full btn-lg mt-4" disabled={busy} onClick={go}>{busy ? (zh ? '创建中…' : 'Creating…') : t('auth.create')}</button>
      <p className="text-[12.5px] text-ink-3 mt-3">{zh ? '创建账号即表示同意' : 'By continuing you agree to the'} <Link to="/terms" className="underline">{zh ? '服务条款' : 'Terms'}</Link> {zh ? '和' : 'and'} <Link to="/privacy" className="underline">{zh ? '隐私政策' : 'Privacy Policy'}</Link>.</p>
      <p className="text-[13.5px] text-ink-2 mt-4">{t('auth.have')} <Link className="link" to="/login">{t('auth.login')}</Link></p>
      <div className="border-t border-line pt-4 mt-6">
        {joining ? (<>
          <div className="font-medium mb-1">{t('family.joinTitle')}</div><p className="text-[13px] text-ink-2 mb-3">{t('family.joinSub')}</p>
          <div className="flex gap-2"><input className="field flex-1 uppercase tracking-widest text-[16px]" value={code} onChange={(e) => { setCode(e.target.value); setCodeErr(''); if (pendingCode && e.target.value.trim().toUpperCase() !== pendingCode) setPendingCode(''); }} placeholder={t('family.codePh')} /><button className="btn btn-primary" disabled={!code.trim() || (live && pendingCode === code.trim().toUpperCase())} onClick={async () => {
            if (live) { setPendingInvite(code.trim().toUpperCase()); setPendingCode(code.trim().toUpperCase()); return; } // joined automatically right after the account is created
            if (await joinFamily(code.trim(), email)) nav('/home'); else setCodeErr(t('family.badCode')); }}>{live && pendingCode && pendingCode === code.trim().toUpperCase() ? '✓' : t('family.joinBtn')}</button></div>
          {codeErr && <p className="text-rec text-[13px] mt-2 mb-0">{codeErr}</p>}
          {pendingCode && <p className="text-[13px] text-ink-2 mt-2 mb-0">✓ {zh ? `记住了 ${pendingCode}。创建账号后会自动加入这个家。` : `Got it — ${pendingCode}. You’ll join this family as soon as your account is created.`}</p>}
        </>) : <button className="link-soft text-[14px]" onClick={() => setJoining(true)}>{t('family.join')} →</button>}
      </div>
      <div className="divider my-8">{zh ? '演示' : 'Demo'}</div>
      {live
        ? <p className="text-[12.5px] text-ink-3">{zh ? '想先看看效果？创建账号后，在「设置」里可以一键导入童爷爷的 3 个示例故事，随时删除。' : 'Want to see it filled in? After creating an account, import Grandpa Tong’s 3 sample stories from Settings — removable any time.'}</p>
        : <><button className="btn w-full" onClick={() => { seedDemo(); nav('/home'); }}>{zh ? '用示例数据直接进入（童爷爷 · 3 个故事）' : 'Enter with sample data (Grandpa Tong · 3 stories)'}</button>
          <p className="text-[12.5px] text-ink-3 mt-3">{zh ? '给审核用的快捷入口；正式版本没有这个按钮。' : 'Reviewer shortcut; not in the real product.'}</p></>}
    </Frame>
  );
}

export function LogIn() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const auth = useAuth(); const { state } = useStore();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!email || !pw) return setErr(zh ? '邮箱和密码都要填。' : 'Email and password are both required.');
    setErr(''); setBusy(true);
    try { await auth.signIn(email, pw); nav(state.storytellers.length ? '/home' : '/mode'); }
    catch (e) { setErr(friendlyError(e, zh)); } finally { setBusy(false); }
  };
  return (
    <Frame title={zh ? '欢迎回来' : 'Welcome back'}>
      <label className="label">{t('auth.email')}</label><input id="li-email" className="input mb-4" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="flex justify-between items-baseline"><label className="label">{t('auth.pw')}</label><Link to="/forgot" className="link-soft text-[12.5px]">{zh ? '忘记密码？' : 'Forgot password?'}</Link></div>
      <input id="li-pw" className="input mb-2" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} />
      {err && <p className="text-rec text-[13.5px] mb-3">{err}</p>}
      <button className="btn btn-primary w-full btn-lg mt-4" disabled={busy} onClick={go}>{busy ? (zh ? '登录中…' : 'Logging in…') : t('auth.login')}</button>
      <p className="text-[13.5px] text-ink-2 mt-4">{zh ? '还没有账号？' : 'No account yet?'} <Link className="link" to="/signup">{t('auth.create')}</Link></p>
    </Frame>
  );
}

export function Forgot() {
  const { lang } = useT(); const zh = lang === 'zh'; const auth = useAuth();
  const [sent, setSent] = useState(false); const [email, setEmail] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const send = async () => { setErr(''); setBusy(true); try { await auth.resetPassword(email); setSent(true); } catch (e) { setErr(friendlyError(e, zh)); } finally { setBusy(false); } };
  return (
    <Frame title={zh ? '重设密码' : 'Reset password'} sub={zh ? '输入邮箱，我们发一个重设链接给你。' : 'Enter your email and we’ll send a reset link.'}>
      {sent ? (
        <div className="border-t border-ink pt-6 text-center"><div className="text-[28px] mb-2">✉</div><p className="m-0">{zh ? `已发送到 ${email}。没收到的话看看垃圾邮件，或者` : `Sent to ${email}. Check spam, or`} <button className="link" onClick={() => setSent(false)}>{zh ? '再发一次' : 'send again'}</button>.</p></div>
      ) : (<>
        <input id="fg-email" className="input mb-4" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        {err && <p className="text-rec text-[13.5px] mb-3">{err}</p>}
        <button className="btn btn-primary w-full btn-lg" disabled={!email || busy} onClick={send}>{busy ? (zh ? '发送中…' : 'Sending…') : (zh ? '发送重设链接' : 'Send reset link')}</button>
      </>)}
      <p className="text-[13.5px] text-ink-2 mt-5"><Link to="/login" className="link-soft">{zh ? '← 回到登录' : '← Back to log in'}</Link></p>
    </Frame>
  );
}

// Where the reset-password email link lands. Supabase has already signed the user in
// with a temporary session by the time this page opens; we only ask for the new password.
export function ResetPassword() {
  const { lang } = useT(); const zh = lang === 'zh'; const auth = useAuth(); const nav = useNavigate();
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const save = async () => {
    if (pw.length < 8) return setErr(zh ? '密码至少 8 位。' : 'Password needs at least 8 characters.');
    if (pw !== pw2) return setErr(zh ? '两次输入的密码不一样。' : 'The two passwords don’t match.');
    setErr(''); setBusy(true);
    try { await auth.updatePassword(pw); setDone(true); setTimeout(() => nav('/home'), 1200); } catch (e) { setErr(friendlyError(e, zh)); } finally { setBusy(false); }
  };
  if (auth.ready && !auth.user) return (
    <Frame title={zh ? '链接已失效' : 'This link has expired'} sub={zh ? '重设链接只能用一次，而且有时效。再申请一个就好。' : 'Reset links work once and expire. Just request a new one.'}>
      <Link to="/forgot" className="btn btn-primary">{zh ? '重新发送' : 'Send a new link'}</Link>
    </Frame>
  );
  return (
    <Frame title={zh ? '设一个新密码' : 'Choose a new password'}>
      {done ? <p className="m-0">{zh ? '密码已更新，正在进入…' : 'Password updated — taking you in…'}</p> : (<>
        <label className="label">{zh ? '新密码' : 'New password'}</label><input id="rp-pw" className="input mb-4" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <label className="label">{zh ? '再输一次' : 'Repeat it'}</label><input id="rp-pw2" className="input mb-2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
        {err && <p className="text-rec text-[13.5px] mb-3">{err}</p>}
        <button className="btn btn-primary w-full btn-lg mt-4" disabled={busy} onClick={save}>{busy ? (zh ? '保存中…' : 'Saving…') : (zh ? '保存新密码' : 'Save new password')}</button>
      </>)}
    </Frame>
  );
}

// Shown only when Supabase requires email confirmation (the setting is off during testing).
export function Verify() {
  const { lang } = useT(); const zh = lang === 'zh'; const auth = useAuth(); const nav = useNavigate(); const { state } = useStore();
  const email = (typeof history !== 'undefined' && history.state?.usr?.email) || state.email;
  const [msg, setMsg] = useState('');
  useEffect(() => { if (auth.user) nav('/mode', { replace: true }); }, [auth.user]); // eslint-disable-line react-hooks/exhaustive-deps
  const resend = async () => { try { await auth.resendConfirmation(email); setMsg(zh ? '已重新发送。' : 'Sent again.'); } catch (e) { setMsg(friendlyError(e, zh)); } };
  return (
    <Frame title={zh ? '看一眼邮箱' : 'Check your inbox'} sub={zh ? `我们给 ${email} 发了一封验证邮件。点里面的链接，然后回到这里登录。` : `We sent a verification email to ${email}. Click the link inside, then come back and log in.`}>
      <p className="text-[13.5px] text-ink-2">{zh ? '没收到？' : 'Didn’t get it?'} <button className="link-soft" onClick={resend}>{zh ? '再发一次' : 'Resend'}</button> · <Link to="/login" className="link-soft">{zh ? '去登录' : 'Log in'}</Link></p>
      {msg && <p className="text-[13.5px] text-ink-3">{msg}</p>}
    </Frame>
  );
}
