import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import { I18nProvider } from './lib/i18n';
import { StoreProvider, useStore } from './lib/store';
import { AuthProvider, useAuth } from './lib/auth';
import Landing from './pages/Landing';
import Legal from './pages/Legal';
import { SignUp, LogIn, Forgot, Verify, ResetPassword } from './pages/AuthPages';
import { Mode, Profile } from './pages/Onboarding';
import Home from './pages/Home';
import Pick from './pages/Pick';
import Record, { Processing } from './pages/Record';
import Review from './pages/Review';
import Story from './pages/Story';
import Family from './pages/Family';
import Community from './pages/Community';
import Person from './pages/Person';
import Read from './pages/Read';
import Notifications from './pages/Notifications';
import Settings, { Upgrade } from './pages/Settings';
import { InviteLanding, SharedList, SharedStory } from './pages/Invitee';
import { NotFound, Deleted } from './pages/Misc';

// Real URLs (/home, /story/123) on Vercel — vercel.json rewrites every path to index.html. Sandboxed previews fall back to in-memory routing.
const Router = (typeof window !== 'undefined' && (window.location.origin === 'null' || window.location.protocol === 'about:' || window.location.protocol === 'file:')) ? MemoryRouter : BrowserRouter;

// The gatekeeper for every in-app page.
//  1. Wait until Supabase has answered "who is signed in?" (avoids a flash of the login page on refresh).
//  2. Nobody signed in → /login.   3. Signed in but no storyteller yet → onboarding (/mode).
function Guard({ children }) {
  const { state } = useStore(); const auth = useAuth();
  if (!auth.ready) return null;
  const signedIn = auth.hasSupabase ? (Boolean(auth.user) || state.demo) : state.signedIn;
  if (!signedIn) return <Navigate to="/login" replace />;
  // Supabase knows the user but the store hasn't mirrored them yet, or the family is still loading → wait.
  if (auth.user && state.userId !== auth.user.id) return null;
  if (!state.dataReady) return null;
  return state.profile ? children : <Navigate to="/mode" replace />;
}

// Onboarding pages need an account but not yet a storyteller.
function NeedsAccount({ children }) {
  const { state } = useStore(); const auth = useAuth(); const loc = useLocation();
  if (!auth.ready) return null;
  const signedIn = auth.hasSupabase ? (Boolean(auth.user) || state.demo) : state.signedIn;
  if (!signedIn) return <Navigate to="/login" replace />;
  if (auth.user && state.userId !== auth.user.id) return null;
  if (!state.dataReady) return null;
  // Already set up (has a storyteller) and not editing → skip onboarding, go home.
  if (state.profile && !/edit=|add=/.test(loc.search)) return <Navigate to="/home" replace />;
  return children;
}

// Last line of defence: if any page throws while rendering, show a message instead of a blank screen.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[echoes] page crashed', error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    const zh = (document.documentElement.lang || 'zh').startsWith('zh');
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', fontFamily: 'inherit' }}>
        <div className="ed-caps" style={{ marginBottom: 12 }}>{zh ? '出了点问题' : 'Something went wrong'}</div>
        <h1 className="serif" style={{ fontSize: 28, margin: '0 0 12px' }}>{zh ? '这一页没能显示出来。' : 'This page could not be shown.'}</h1>
        <p style={{ color: 'var(--color-ink-2)', marginBottom: 20 }}>{zh ? '你的故事和录音都没有丢。回首页再试一次；如果还是这样，把下面这行发给我们。' : 'Your stories and recordings are safe. Go home and try again; if it happens again, send us the line below.'}</p>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--color-ink-3)', marginBottom: 24 }}>{String(this.state.error?.message || this.state.error)}</pre>
        <a className="btn btn-primary" href="/home" onClick={() => this.setState({ error: null })}>{zh ? '回首页' : 'Go home'}</a>
      </div>
    );
  }
}

function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Legal kind="privacy" />} />
      <Route path="/terms" element={<Legal kind="terms" />} />
      <Route path="/invite/:code" element={<InviteLanding />} />
      <Route path="/shared" element={<SharedList />} />
      <Route path="/shared/:id" element={<SharedStory />} />
      <Route path="/deleted" element={<Deleted />} />
      {/* auth */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<LogIn />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/mode" element={<NeedsAccount><Mode /></NeedsAccount>} />
      <Route path="/profile" element={<NeedsAccount><Profile /></NeedsAccount>} />
      {/* app */}
      <Route path="/home" element={<Guard><Home /></Guard>} />
      <Route path="/pick" element={<Guard><Pick /></Guard>} />
      <Route path="/record/:qid" element={<Guard><Record /></Guard>} />
      <Route path="/processing" element={<Guard><Processing /></Guard>} />
      <Route path="/review" element={<Guard><Review /></Guard>} />
      <Route path="/story/:id" element={<Guard><Story /></Guard>} />
      <Route path="/story/:id/edit" element={<Guard><Review /></Guard>} />
      <Route path="/archive" element={<Navigate to="/home" replace />} />
      <Route path="/people/:name" element={<Guard><Person /></Guard>} />
      <Route path="/read/:id" element={<Read />} />
      <Route path="/family" element={<Guard><Family /></Guard>} />
      <Route path="/community" element={<Community />} />
      <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
      <Route path="/settings" element={<Guard><Settings /></Guard>} />
      <Route path="/upgrade" element={<Guard><Upgrade /></Guard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider><StoreProvider><AuthProvider><Router><ErrorBoundary><App /></ErrorBoundary></Router></AuthProvider></StoreProvider></I18nProvider>
  </React.StrictMode>
);
