import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { getAudioUrl, loadNotifications } from '../lib/db';
import { hasSupabase } from '../lib/supabase';
import { Mark } from './Illos';

// Line icons for the phone tab bar (1.6px stroke, currentColor — DESIGN.md → Icons).
const ICON = {
  book: <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5c-.8 0-1.5-.7-1.5-1.5v-12ZM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5v-12Z" />,
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" />,
  globe: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.4 2.3 3.5 5 3.5 8s-1.1 5.7-3.5 8c-2.4-2.3-3.5-5-3.5-8S9.6 6.3 12 4Z" /></>,
  me: <><circle cx="12" cy="9" r="3.6" /><path d="M5 20c.9-3.6 3.6-5.5 7-5.5s6.1 1.9 7 5.5" /></>,
};
const Icon = ({ name }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{ICON[name]}</svg>;

export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <div className="ed-caps flex items-center gap-2 select-none" aria-label="language">
      <button className={(lang === 'zh' ? '!text-ink' : '') + ' cursor-pointer'} onClick={() => setLang('zh')}>中</button><span>/</span><button className={(lang === 'en' ? '!text-ink' : '') + ' cursor-pointer'} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}

export const APP = { en: 'Echoes', zh: '余音' };
// Family display name: set by the creator, or derived from the first storyteller's surname.
export function useFamilyName() {
  const { t, lang } = useT(); const { state } = useStore();
  if (state.familyName) return state.familyName;
  const first = state.storytellers[0]; if (!first) return t('family.ours');
  const sur = lang === 'zh' ? first.name.replace(/(爷爷|奶奶|外公|外婆|先生|女士|阿嬷|阿公)$/, '').slice(0, 1) : (first.nameEn || first.name).split(' ').pop();
  return t('family.defaultName', { s: sur });
}
export function Brand({ sub, size = 30, dark = false }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <Mark size={size} dark={dark} />
      <span className="inline-flex items-baseline gap-2">
        <span className="wm text-[18px]">余音</span>
        <span className="serif text-[13px] leading-none opacity-60">Echoes</span>
        {sub && <span className="text-[12px] text-ink-3">{sub}</span>}
      </span>
    </span>
  );
}

// One header for every signed-in page: same width, same items, same position. Only the active state changes.
// `nav={false}` is used only before a profile exists (auth / onboarding), where there is nothing to navigate to.
export default function Shell({ children, nav = true }) {
  const { t } = useT();
  const { state } = useStore();
  const nav_ = useNavigate();
  const p = state.profile; const fam = useFamilyName();
  const show = nav && !!p;
  // Unread likes / reactions on our stories. Checked when the page changes and every minute.
  const loc = useLocation(); const [unread, setUnread] = useState(0);
  const liveUser = hasSupabase && !state.demo && state.userId;
  useEffect(() => {
    if (!show || !liveUser) return;
    let alive = true;
    const check = () => loadNotifications().then((n) => alive && setUnread(n.filter((x) => x.unread).length)).catch(() => {});
    check(); const id = setInterval(check, 60000);
    return () => { alive = false; clearInterval(id); };
  }, [show, liveUser, loc.pathname]);
  const Bell = () => (
    <button onClick={() => nav_('/notifications')} className="relative cursor-pointer ed-caps hover:!text-ink" title={t('nav.notifications')} aria-label={t('nav.notifications')}>
      <span className="text-[17px] leading-none">♡</span>
      {unread > 0 && <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-rec text-white text-[10.5px] leading-[18px] text-center tracking-normal">{unread > 9 ? '9+' : unread}</span>}
    </button>
  );
  // Selected item: a short gold brush stroke under the label (DESIGN.md → Navigation).
  const cls = ({ isActive }) => 'ed-caps pt-1 pb-[7px] transition-colors ' + (isActive ? 'nav-on' : 'hover:!text-ink');
  const signedIn = Boolean(state.userId || state.signedIn);
  // Focused flows (recording, tidying, reviewing) keep the screen to themselves — no bottom bar on phones.
  const focused = /^\/(record|processing|review)|\/edit$/.test(loc.pathname);
  const tab = (to, label, icon) => (
    <NavLink to={to} className={({ isActive }) => 'flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[11px] tracking-[.06em] ' + (isActive ? 'text-primary font-medium' : 'text-ink-3')}>
      {({ isActive }) => (<><Icon name={icon} /><span className={isActive ? 'nav-on !pb-[3px] !bg-[length:100%_4px]' : 'pb-[3px]'}>{label}</span></>)}
    </NavLink>
  );
  const meName = state.userName || (state.email ? state.email.split('@')[0] : '我');
  return (
    <div className="min-h-screen flex flex-col ed">
      <header className="border-b border-line bg-paper/92 backdrop-blur sticky top-0 z-10">
        <div className="ed-wrap h-[64px] md:h-[68px] flex items-center gap-5 md:gap-8">
          <button onClick={() => nav_(p ? '/home' : '/')} className="cursor-pointer shrink-0"><Brand /></button>
          {show && (
            <nav className="hidden md:flex gap-7 ml-4">
              <NavLink to="/home" className={cls}>{t('nav.stories')}</NavLink>
              <NavLink to="/family" className={cls}>{fam}</NavLink>
              <NavLink to="/community" className={cls}>{t('nav.community')}</NavLink>
            </nav>
          )}
          <div className="flex-1" />
          {show && <button className="btn btn-accent btn-sm !hidden md:!inline-flex" onClick={() => nav_('/pick')}>{t('nav.record')}</button>}
          {show && liveUser && <Bell />}
          {/* Language: visitors, sign-up and onboarding (before a storyteller exists) keep the switch here; afterwards it lives in Settings. */}
          {(!signedIn || !p) && <LangToggle />}
          {!p && !state.signedIn && <button className="link-soft text-[13.5px]" onClick={() => nav_('/login')}>{t('auth.login')}</button>}
          {p && <button onClick={() => nav_('/settings')} title={t('nav.settings')} className="cursor-pointer"><Avatar name={meName} src={state.meAvatar} size="w-9 h-9 text-[13px]" me={!state.meAvatar} /></button>}
        </div>
      </header>
      <main className={'ed-wrap w-full py-8 md:py-10 flex-1 ' + (show && !focused ? 'pb-24 md:pb-10' : '')}>{children}</main>
      {/* Privacy, terms and a contact on every signed-in page (payment providers require them to be reachable) */}
      <footer className={'border-t border-line ' + (show && !focused ? 'mb-[64px] md:mb-0' : '')}>
        <div className="ed-wrap py-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-ink-3">
          <span>© {new Date().getFullYear()} Echoes</span>
          <a className="hover:text-ink" href="/privacy">{t('nav.privacy')}</a>
          <a className="hover:text-ink" href="/terms">{t('nav.terms')}</a>
          <a className="hover:text-ink" href="mailto:hello@echoestory.com">hello@echoestory.com</a>
        </div>
      </footer>
      {/* Phones: one bottom bar instead of the top menu (DESIGN.md → Navigation). */}
      {show && !focused && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 h-[64px] bg-paper/95 backdrop-blur border-t border-line flex items-stretch px-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="main">
          {tab('/home', t('nav.stories'), 'book')}
          {tab('/family', t('nav.family'), 'home')}
          <button onClick={() => nav_('/pick')} className="flex-1 flex flex-col items-center justify-center" aria-label={t('nav.record')}>
            <span className="w-11 h-11 -mt-5 rounded-full bg-primary text-white flex items-center justify-center" style={{ boxShadow: '0 0 0 3px var(--color-paper), 0 0 0 4.5px var(--color-gold)' }}><span className="w-3.5 h-3.5 rounded-full bg-white" /></span>
            <span className="text-[11px] tracking-[.06em] text-ink-2 mt-0.5">{t('nav.recordShort')}</span>
          </button>
          {tab('/community', t('nav.community'), 'globe')}
          {tab('/settings', t('nav.settings'), 'me')}
        </nav>
      )}
    </div>
  );
}

export function Narrow({ children, className = '' }) { return <div className={'max-w-[640px] mx-auto ' + className}>{children}</div>; }

// Consistent "go back" link: history back when there is one, otherwise a given fallback route.
export function Back({ to = '/home', label, hard = false, confirm }) {
  const { t } = useT(); const nav = useNavigate();
  // hard: always go to `to`. Used after one-way steps (processing → review): history back would re-run them.
  const go = () => { if (confirm && !window.confirm(confirm)) return; if (hard || window.history.length <= 1) nav(to, { replace: true }); else nav(-1); };
  return <button className="ed-caps hover:!text-ink cursor-pointer" onClick={go}>{label || t('nav.back')}</button>;
}

// Real audio player: play/pause, progress over a waveform, time.
// Copy text without ever throwing: returns true on success so the caller can show the right toast.
export async function copyText(text) {
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; } } catch {}
  try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch { return false; }
}

// Plays a recording. `src` is a direct URL (local preview); `path` is a file in the private
// "audio" bucket — a temporary link is requested only when the person presses play, and
// Supabase refuses to issue one to anybody outside the family.
export function Audio({ label, dur = '0:00', src: srcProp, path }) {
  const { t, lang } = useT(); const ref = useRef(null);
  const [playing, setPlaying] = useState(false); const [prog, setProg] = useState(0); const [cur, setCur] = useState(0);
  const [signed, setSigned] = useState(null); const [loading, setLoading] = useState(false); const [failed, setFailed] = useState(false);
  const src = srcProp || signed; const canPlay = Boolean(srcProp || path);
  useEffect(() => { setSigned(null); setFailed(false); }, [path]);
  const resolve = async () => {
    if (src || !path) return src;
    setLoading(true);
    try { const url = await getAudioUrl(path); setSigned(url); return url; } catch (e) { console.warn('[echoes] audio link refused', e); setFailed(true); return null; } finally { setLoading(false); }
  };
  const fmt = (s) => (isFinite(s) ? Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2) : dur);
  useEffect(() => { const a = ref.current; if (!a) return; const onT = () => { setCur(a.currentTime); setProg(a.duration ? a.currentTime / a.duration : 0); }; const onE = () => { setPlaying(false); setProg(0); setCur(0); }; a.addEventListener('timeupdate', onT); a.addEventListener('ended', onE); return () => { a.removeEventListener('timeupdate', onT); a.removeEventListener('ended', onE); }; }, [src]);
  const toggle = async () => {
    if (!canPlay || loading) return;
    const url = await resolve(); if (!url) return;
    // the <audio> element mounts once a URL exists; give React one tick to render it
    await new Promise((r) => setTimeout(r, 0));
    const a = ref.current; if (!a) return;
    if (a.paused) { a.play().then(() => setPlaying(true)).catch((e) => { console.warn('[echoes] playback failed', e?.message); setFailed(true); setPlaying(false); }); } else { a.pause(); setPlaying(false); }
  };
  const bars = 48;
  return (
    <div className="flex items-center gap-3 card px-4 py-2.5">
      {src && <audio ref={ref} src={src} preload="metadata" />}
      <button className={'w-9 h-9 text-paper text-[11px] flex items-center justify-center cursor-pointer flex-none ' + (canPlay && !failed ? 'bg-primary' : 'bg-ink-3') + ' rounded-full'} onClick={toggle} aria-label={playing ? 'pause' : 'play'} title={failed ? (lang === 'zh' ? '原声仅对家人开放' : 'Audio is family-only') : ''}>{loading ? '…' : playing ? '❚❚' : '▶'}</button>
      <div className="flex-1 flex items-center gap-[3px] h-7 overflow-hidden cursor-pointer" aria-hidden="true" onClick={(e) => { const a = ref.current; if (!a || !a.duration) return; const r = e.currentTarget.getBoundingClientRect(); a.currentTime = ((e.clientX - r.left) / r.width) * a.duration; }}>
        {Array.from({ length: bars }).map((_, i) => <span key={i} className="flex-1 bg-primary rounded-full" style={{ height: `${20 + Math.abs(Math.sin(i * 0.7) * 70)}%`, opacity: i / bars <= prog ? 1 : 0.3 }} />)}
      </div>
      <span className="text-[13px] text-ink-2 tabular-nums whitespace-nowrap">{label || t('review.original')} · {playing || cur > 0 ? fmt(cur) : dur}</span>
    </div>
  );
}
// Avatar: a photo when there is one, otherwise the first character. `onPick` makes it an upload target (click to change).
export function Avatar({ name = '', src, size = 'w-9 h-9 text-[13px]', me = false, onPick, className = '' }) {
  const ref = useRef(null);
  const el = <span className={'avatar overflow-hidden ' + (me ? 'me ' : '') + size + ' ' + className + (onPick ? ' cursor-pointer relative group' : '')} onClick={onPick ? () => ref.current.click() : undefined} title={onPick ? '更换头像' : undefined}>
    {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <span>{(name || '?').slice(0, 1).toUpperCase()}</span>}
    {onPick && <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-primary/70 text-white text-[10px] tracking-wider rounded-full">{src ? '换' : '+'}</span>}
  </span>;
  if (!onPick) return el;
  return <>{el}<input ref={ref} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) onPick(await shrinkImage(f)); e.target.value = ''; }} /></>;
}
export function shrinkImage(file, max = 160) {
  return new Promise((res) => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.min(img.width, img.height)); const w = Math.round(img.width * s), h = Math.round(img.height * s); const side = Math.min(w, h); const c = document.createElement('canvas'); c.width = side; c.height = side; c.getContext('2d').drawImage(img, (w - side) / 2 * -1, (h - side) / 2 * -1, w, h); res(c.toDataURL('image/jpeg', 0.82)); }; img.src = URL.createObjectURL(file); });
}
export function Note({ children }) { return <div className="inline-block px-3 py-1.5 text-[12.5px] border-l-2 border-accent text-ink-2 bg-card">{children}</div>; }

// Small transient toast
export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (m, ms = 2200) => { setMsg(m); setTimeout(() => setMsg(null), ms); };
  const el = msg ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary text-white text-[14px] px-5 py-2.5 rounded-[4px] shadow-[var(--shadow-soft)]">{msg}</div> : null;
  return [show, el];
}

// ---- Layout primitives: every app page uses the same header block and the same two-column grid ----
// PageHeader: [back] / eyebrow / h1 / sub, with optional actions on the right of the title row.
export function PageHeader({ back, backTo = '/home', backLabel, backHard = false, backConfirm, eyebrow, title, sub, actions, className = '' }) {
  return (
    <div className={'doc-head ' + className}>
      {back && <div className="mb-5"><Back to={backTo} label={backLabel} hard={backHard} confirm={backConfirm} /></div>}
      {eyebrow && <div className="ed-caps">{eyebrow}</div>}
      {(title || actions) && (
        <div className="flex items-end justify-between gap-6 flex-wrap">
          {title && <h1>{title}</h1>}
          {actions && <div className="toolbar pb-1">{actions}</div>}
        </div>
      )}
      {sub && <p className="sub m-0">{sub}</p>}
    </div>
  );
}
// TwoCol: main column + fixed-width aside, both starting on the same baseline.
export function TwoCol({ main, aside, asideWidth = 340, sticky = true }) {
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_var(--aside)] gap-10 items-start" style={{ '--aside': asideWidth + 'px' }}>
      <div className="min-w-0">{main}</div>
      <aside className={'grid gap-3 content-start ' + (sticky ? 'lg:sticky lg:top-24' : '')}>{aside}</aside>
    </div>
  );
}
