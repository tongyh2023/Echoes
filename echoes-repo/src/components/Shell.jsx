import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { Mark } from './Illos';

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
  const cls = ({ isActive }) => 'ed-caps py-1 transition-colors ' + (isActive ? '!text-ink' : 'hover:!text-ink');
  const sty = ({ isActive }) => ({ borderBottom: '1px solid ' + (isActive ? 'var(--color-ink)' : 'transparent') });
  return (
    <div className="min-h-screen flex flex-col ed">
      <header className="border-b border-line bg-paper/92 backdrop-blur sticky top-0 z-10">
        <div className="ed-wrap h-[68px] flex items-center gap-8">
          <button onClick={() => nav_(p ? '/home' : '/')} className="cursor-pointer shrink-0"><Brand /></button>
          {show && (
            <nav className="hidden md:flex gap-7 ml-4">
              <NavLink to="/home" className={cls} style={sty}>{t('nav.stories')}</NavLink>
              <NavLink to="/family" className={cls} style={sty}>{fam}</NavLink>
              <NavLink to="/community" className={cls} style={sty}>{t('nav.community')}</NavLink>
            </nav>
          )}
          <div className="flex-1" />
          {show && <button className="btn btn-accent btn-sm hidden sm:inline-flex" onClick={() => nav_('/pick')}>{t('nav.record')}</button>}
          <LangToggle />
          {p && <button onClick={() => nav_('/settings')} title={t('nav.settings')} className="cursor-pointer"><Avatar name={state.email ? state.email.split('@')[0] : '我'} src={state.meAvatar} size="w-8 h-8 text-[13px]" /></button>}
        </div>
        {show && (
          <nav className="md:hidden flex gap-5 px-7 pb-3 overflow-x-auto items-center">
            <NavLink to="/home" className={cls} style={sty}>{t('nav.stories')}</NavLink>
            <NavLink to="/family" className={cls} style={sty}>{fam}</NavLink>
            <NavLink to="/community" className={cls} style={sty}>{t('nav.community')}</NavLink>
            <button className="btn btn-accent btn-sm ml-auto" onClick={() => nav_('/pick')}>{t('nav.record')}</button>
          </nav>
        )}
      </header>
      <main className="ed-wrap w-full py-10 flex-1">{children}</main>
    </div>
  );
}

export function Narrow({ children, className = '' }) { return <div className={'max-w-[640px] mx-auto ' + className}>{children}</div>; }

// Consistent "go back" link: history back when there is one, otherwise a given fallback route.
export function Back({ to = '/home', label }) {
  const { t } = useT(); const nav = useNavigate();
  return <button className="ed-caps hover:!text-ink cursor-pointer" onClick={() => (window.history.length > 1 ? nav(-1) : nav(to))}>{label || t('nav.back')}</button>;
}

// Real audio player: play/pause, progress over a waveform, time.
export function Audio({ label, dur = '0:00', src }) {
  const { t } = useT(); const ref = useRef(null);
  const [playing, setPlaying] = useState(false); const [prog, setProg] = useState(0); const [cur, setCur] = useState(0);
  const fmt = (s) => (isFinite(s) ? Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2) : dur);
  useEffect(() => { const a = ref.current; if (!a) return; const onT = () => { setCur(a.currentTime); setProg(a.duration ? a.currentTime / a.duration : 0); }; const onE = () => { setPlaying(false); setProg(0); setCur(0); }; a.addEventListener('timeupdate', onT); a.addEventListener('ended', onE); return () => { a.removeEventListener('timeupdate', onT); a.removeEventListener('ended', onE); }; }, [src]);
  const toggle = () => { const a = ref.current; if (!src || !a) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };
  const bars = 48;
  return (
    <div className="flex items-center gap-3 card px-4 py-2.5">
      {src && <audio ref={ref} src={src} preload="metadata" />}
      <button className={'w-9 h-9 text-paper text-[11px] flex items-center justify-center cursor-pointer flex-none ' + (src ? 'bg-ink' : 'bg-ink-3')} onClick={toggle} aria-label={playing ? 'pause' : 'play'}>{playing ? '❚❚' : '▶'}</button>
      <div className="flex-1 flex items-center gap-[3px] h-7 overflow-hidden cursor-pointer" aria-hidden="true" onClick={(e) => { const a = ref.current; if (!a || !a.duration) return; const r = e.currentTarget.getBoundingClientRect(); a.currentTime = ((e.clientX - r.left) / r.width) * a.duration; }}>
        {Array.from({ length: bars }).map((_, i) => <span key={i} className="flex-1 bg-ink" style={{ height: `${20 + Math.abs(Math.sin(i * 0.7) * 70)}%`, opacity: i / bars <= prog ? 1 : 0.3 }} />)}
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
    {onPick && <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-ink/60 text-paper text-[10px] tracking-wider">{src ? '换' : '+'}</span>}
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
  const el = msg ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink text-paper text-[14px] px-5 py-2.5">{msg}</div> : null;
  return [show, el];
}

// ---- Layout primitives: every app page uses the same header block and the same two-column grid ----
// PageHeader: [back] / eyebrow / h1 / sub, with optional actions on the right of the title row.
export function PageHeader({ back, backTo = '/home', backLabel, eyebrow, title, sub, actions, className = '' }) {
  return (
    <div className={'doc-head ' + className}>
      {back && <div className="mb-5"><Back to={backTo} label={backLabel} /></div>}
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
