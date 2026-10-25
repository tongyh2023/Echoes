import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, hasSupabase } from './supabase';
import { useStore } from './store';

// Echoes · 余音 — sign-in state for the whole app.
//
// Supabase Auth owns the account: it stores the password (hashed, never readable),
// checks it at login, sends the reset-password email, and keeps the session alive.
// This file only asks Supabase "who is signed in?" and shares the answer with every page.
//
// Without Supabase configured (hasSupabase === false) the app keeps the old local demo
// behaviour so previews still work; nothing below talks to a server in that case.

const Ctx = createContext(null);

// Map Supabase's error messages to plain language the user can act on.
export function friendlyError(err, zh) {
  const m = (err?.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return zh ? '邮箱或密码不对。' : 'Email or password is incorrect.';
  if (m.includes('already registered') || m.includes('already been registered')) return zh ? '这个邮箱已经注册过了，直接登录就好。' : 'This email is already registered — try logging in.';
  if (m.includes('password should be at least')) return zh ? '密码至少 8 位。' : 'Password needs at least 8 characters.';
  if (m.includes('email not confirmed')) return zh ? '邮箱还没验证，先去邮箱点一下链接。' : 'Email not confirmed yet — check your inbox.';
  if (m.includes('rate limit') || m.includes('too many')) return zh ? '试得太频繁了，等一分钟再来。' : 'Too many attempts — wait a minute and try again.';
  if (m.includes('family is full')) return zh ? '这个家用的是免费版，只能邀请 1 位家人，现在已经满了。请让邀请你的人升级家庭版。' : 'This family is on the free plan, which allows 1 invited family member, and it’s full. Ask the person who invited you to upgrade.';
  if (m.includes('network') || m.includes('fetch')) return zh ? '网络不通，检查一下连接。' : 'Network problem — check your connection.';
  return err?.message || (zh ? '出了点问题，再试一次。' : 'Something went wrong. Please try again.');
}

export function AuthProvider({ children }) {
  const store = useStore();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!hasSupabase); // demo mode is "ready" immediately

  // On load: ask Supabase for the current session, then keep listening for changes
  // (login, logout, token refresh, password-reset link opened).
  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setUser(data.session?.user || null); setReady(true); } });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { if (alive) setUser(session?.user || null); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // Mirror the signed-in user into the shared app state so existing pages
  // (header avatar, settings, family page) keep working unchanged.
  useEffect(() => {
    if (!hasSupabase) return;
    if (user) store.setAuthUser({ id: user.id, email: user.email, verified: Boolean(user.email_confirmed_at), name: user.user_metadata?.name || '' });
    else if (ready && !store.state.demo) store.setAuthUser(null);
  }, [user, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const api = {
    user, ready, hasSupabase,

    // Create an account. With "Confirm email" OFF in Supabase, a session comes back at once.
    // With it ON, session is null until the user clicks the link in the email.
    signUp: async (email, password, name) => {
      if (!hasSupabase) { store.signIn(email); return { needsEmailConfirm: false }; }
      let invite = null; try { invite = sessionStorage.getItem('echoes-pending-invite'); } catch {}
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name || email.split('@')[0], ...(invite ? { invite } : {}) }, emailRedirectTo: window.location.origin + '/login' } });
      if (error) throw error;
      return { needsEmailConfirm: !data.session };
    },

    signIn: async (email, password) => {
      if (!hasSupabase) { store.signIn(email); return; }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    signOut: async () => {
      if (hasSupabase) await supabase.auth.signOut();
      store.signOut();
    },

    // Sends the reset email. The link opens /reset on our site with a temporary session.
    resetPassword: async (email) => {
      if (!hasSupabase) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset' });
      if (error) throw error;
    },

    // Called from /reset after the user arrives through the email link.
    updatePassword: async (password) => {
      if (!hasSupabase) return;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },

    resendConfirmation: async (email) => {
      if (!hasSupabase) return;
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
    },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
