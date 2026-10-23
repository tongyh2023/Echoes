import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP, Brand } from './Shell';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';

// Shell for public pages (landing, legal, invite landing). Editorial header: hairline, type, no pills.
// Section links scroll (no #hash hrefs — they would fight the HashRouter). Off the landing page they go home first.
export function useScrollTo() {
  const nav = useNavigate(); const loc = useLocation();
  return (id) => {
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (loc.pathname === '/') go(); else { nav('/', { state: { scrollTo: id } }); }
  };
}
export function useScrollOnArrive() {
  const loc = useLocation();
  useEffect(() => { const id = loc.state?.scrollTo; if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60); }, [loc.state]);
}

export function Logo(props) { return <Brand {...props} />; }

export default function Public({ children }) {
  const { lang, setLang } = useT(); const nav = useNavigate(); const { state } = useStore(); const scrollTo = useScrollTo();
  const zh = lang === 'zh'; const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  const links = [['how', zh ? '怎么用' : 'How it works'], ['sample', zh ? '例子' : 'Example'], ['pricing', zh ? '价格' : 'Pricing'], ['faq', zh ? '常见问题' : 'FAQ']];
  return (
    <div className="min-h-screen flex flex-col ed">
      <header className={'sticky top-0 z-20 transition-colors duration-300 ' + (scrolled ? 'bg-paper/92 backdrop-blur border-b border-line' : 'bg-transparent border-b border-transparent')}>
        <div className="ed-wrap h-[76px] flex items-center gap-8">
          <Link to="/" className="shrink-0"><Logo /></Link>
          <nav className="hidden md:flex gap-7 ml-6">
            {links.map(([id, label]) => <button key={id} onClick={() => scrollTo(id)} className="ed-caps hover:text-ink cursor-pointer transition-colors">{label}</button>)}
          </nav>
          <div className="flex-1" />
          <div className="ed-caps flex items-center gap-2 select-none">
            <button className={(zh ? 'text-ink' : 'text-ink-3') + ' cursor-pointer'} onClick={() => setLang('zh')}>中</button><span className="text-ink-3">/</span><button className={(!zh ? 'text-ink' : 'text-ink-3') + ' cursor-pointer'} onClick={() => setLang('en')}>EN</button>
          </div>
          {state.profile ? <button className="ed-link" onClick={() => nav('/home')}>{zh ? '进入我的故事' : 'My stories'} →</button>
            : <><button className="ed-caps hidden sm:block hover:text-ink cursor-pointer" onClick={() => nav('/login')}>{zh ? '登录' : 'Log in'}</button><button className="ed-link" onClick={() => nav('/signup')}>{zh ? '免费开始' : 'Start free'} →</button></>}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="ed-hair mt-28">
        <div className="ed-wrap py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] text-[14px]">
          <div><Logo /><p className="text-ink-2 mt-4 max-w-[34ch] leading-relaxed">{zh ? '把长辈的故事，用他自己的声音留下来——连同方言、习俗和那个年代。' : 'Keep your elders’ stories in their own voice — dialect, customs and era included.'}</p></div>
          <div><div className="ed-caps mb-4">{zh ? '产品' : 'Product'}</div><div className="grid gap-2.5"><button onClick={() => scrollTo('how')} className="text-left text-ink-2 hover:text-ink cursor-pointer">{zh ? '怎么用' : 'How it works'}</button><button onClick={() => scrollTo('pricing')} className="text-left text-ink-2 hover:text-ink cursor-pointer">{zh ? '价格' : 'Pricing'}</button><Link to="/community" className="text-ink-2 hover:text-ink">{zh ? '社区' : 'Community'}</Link></div></div>
          <div><div className="ed-caps mb-4">{zh ? '帮助' : 'Help'}</div><div className="grid gap-2.5"><button onClick={() => scrollTo('faq')} className="text-left text-ink-2 hover:text-ink cursor-pointer">{zh ? '常见问题' : 'FAQ'}</button><a href="mailto:hello@echoestory.com" className="text-ink-2 hover:text-ink">hello@echoestory.com</a></div></div>
          <div><div className="ed-caps mb-4">{zh ? '法律' : 'Legal'}</div><div className="grid gap-2.5"><Link to="/privacy" className="text-ink-2 hover:text-ink">{zh ? '隐私政策' : 'Privacy'}</Link><Link to="/terms" className="text-ink-2 hover:text-ink">{zh ? '服务条款' : 'Terms'}</Link></div></div>
        </div>
        <div className="ed-wrap pb-10 ed-caps flex flex-wrap gap-x-6 gap-y-1 !text-ink-3">
          <span>© 2026 Echoes · 余音</span><span>{zh ? '把声音留下来。' : 'Keep the voice.'}</span>
        </div>
      </footer>
    </div>
  );
}
