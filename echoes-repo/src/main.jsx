import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { I18nProvider } from './lib/i18n';
import { StoreProvider, useStore } from './lib/store';
import Landing from './pages/Landing';
import Legal from './pages/Legal';
import { SignUp, LogIn, Forgot, Verify } from './pages/AuthPages';
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

function Guard({ children }) { const { state } = useStore(); return state.profile ? children : <Navigate to={state.signedIn ? '/mode' : '/login'} replace />; }

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
      <Route path="/mode" element={<Mode />} />
      <Route path="/profile" element={<Profile />} />
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
    <I18nProvider><StoreProvider><Router><App /></Router></StoreProvider></I18nProvider>
  </React.StrictMode>
);
