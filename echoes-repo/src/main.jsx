import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  return state.profile ? children : <Navigate to="/mode" replace />;
}

// Onboarding pages need an account but not yet a storyteller.
function NeedsAccount({ children }) {
  const { state } = useStore(); const auth = useAuth();
  if (!auth.ready) return null;
  const signedIn = auth.hasSupabase ? (Boolean(auth.user) || state.demo) : state.signedIn;
  return signedIn ? children : <Navigate to="/login" replace />;
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
      <Route path="/read/:id" element={<Guard><Read /></Guard>} />
      <Route path="/family" element={<Guard><Family /></Guard>} />
      <Route path="/community" element={<Guard><Community /></Guard>} />
      <Route path="/settings" element={<Guard><Settings /></Guard>} />
      <Route path="/upgrade" element={<Guard><Upgrade /></Guard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider><StoreProvider><AuthProvider><Router><App /></Router></AuthProvider></StoreProvider></I18nProvider>
  </React.StrictMode>
);
