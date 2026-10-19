import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_PROFILE, SEED_STORIES, COMMUNITY_POSTS } from '../mock/data';
import { hasSupabase } from './supabase';
import * as db from './db';

// App state. In production this is the API layer; here it is React state + localStorage.
const Ctx = createContext(null);
const KEY = 'lifestory-state-v3';
export const FREE_LIMIT = 10;

const fresh = () => ({
  signedIn: false, email: '', verified: false, plan: 'free',
  userId: null, userName: '',                  // filled from Supabase Auth (see lib/auth.jsx)
  demo: false,                                 // true only when entered through the sample-data shortcut
  family: null,                                // { id, name, role } from the families table
  members: [],                                 // [{ userId, role, name, avatar }] from family_members + profiles
  inviteCodes: [],                             // unused codes for this family (newest first)
  dataReady: !hasSupabase,                     // false until the user's family + storytellers have been loaded
  storytellers: [], activeId: null,           // several storytellers per account
  stories: [], posts: COMMUNITY_POSTS, draft: null,
  invites: [{ name: 'Helen', sub: '孙女', perms: ['read', 'correct', 'add'] }],
  familyName: '',                              // '' → derived from the first storyteller's surname
  inviteCode: 'TONG-4821',
  consent: {},                                 // storyId -> true once consent confirmed for publishing
  customQuestions: [],                         // the family's own questions: { id, text, source: 'own' | 'edited' | 'followup', from?: storyId, who? }
  reactions: {},                               // storyId -> [{ who, emoji }]
  meAvatar: null,                              // data URL, resized client-side
});

// An invite code remembered across sign-up (sessionStorage survives the redirect, dies with the tab).
const PENDING = 'echoes-pending-invite';
export const setPendingInvite = (code) => { try { sessionStorage.setItem(PENDING, code); } catch {} };
const getPendingInvite = () => { try { return sessionStorage.getItem(PENDING); } catch { return null; } };
const clearPendingInvite = () => { try { sessionStorage.removeItem(PENDING); } catch {} };

export function StoreProvider({ children }) {
  // Seed posts carry non-serialisable/static fields (cover image URLs, body text). Re-apply them over whatever is cached so a stale cache never hides new seed content.
  const hydrate = (s) => { const seed = Object.fromEntries(COMMUNITY_POSTS.map((p) => [p.id, p])); const known = new Set((s.posts || []).map((p) => p.id)); const posts = (s.posts || []).map((p) => (seed[p.id] ? { ...seed[p.id], ...p, image: seed[p.id].image, body: seed[p.id].body } : p)); COMMUNITY_POSTS.forEach((p) => { if (!known.has(p.id)) posts.push(p); }); const kept = posts.filter((p) => (p.mine || seed[p.id]) && ['zh', 'en'].includes(p.lang)); return { ...fresh(), ...s, posts: kept }; };
  const [state, setState] = useState(() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return hydrate(s); } catch {} return fresh(); });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, [state]);

  const profile = state.storytellers.find((s) => s.id === state.activeId) || null;
  const stories = state.stories.filter((s) => !profile || s.storytellerId === profile.id || !s.storytellerId);

  // Real mode: once we know who is signed in, pull their family and storytellers from the database.
  // Signed out: clear them. (Demo mode keeps the local sample data and never touches the server.)
  const live = hasSupabase && !state.demo;
  useEffect(() => {
    if (!hasSupabase || state.demo) return;
    if (!state.userId) { setState((s) => ({ ...s, family: null, members: [], inviteCodes: [], storytellers: [], stories: [], activeId: null, dataReady: true })); return; }
    let alive = true;
    (async () => {
      try {
        // Someone who signed up through an invite link: join that family first, then load it.
        const pending = getPendingInvite();
        if (pending) { try { await db.joinFamily(pending); } catch (e) { console.warn('[echoes] pending invite failed', e); } clearPendingInvite(); }
        const family = await db.loadMyFamily();
        const [tellers, members, inviteCodes, stories] = family ? await Promise.all([db.loadStorytellers(family.id), db.loadMembers(family.id), db.loadInvites(family.id), db.loadStories(family.id)]) : [[], [], [], []];
        if (alive) setState((s) => ({ ...s, family, storytellers: tellers, members, inviteCodes, stories, activeId: tellers.some((t) => t.id === s.activeId) ? s.activeId : (tellers[0]?.id || null), dataReady: true }));
      } catch (e) { console.error('[echoes] load family failed', e); if (alive) setState((s) => ({ ...s, dataReady: true })); }
    })();
    return () => { alive = false; };
  }, [state.userId, state.demo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Family name shown in the header: the real one, or derived from the first storyteller's surname.
  const familyNameFor = (p) => (p?.name ? p.name.slice(0, 1) + '家' : '我们家');

  const api = {
    state: { ...state, profile, stories, familyName: state.family?.name || state.familyName },
    allStories: state.stories,
    live,
    signIn: (email) => setState((s) => ({ ...s, signedIn: true, email: email || s.email || 'you@example.com' })),
    verify: () => setState((s) => ({ ...s, verified: true })),
    signOut: () => setState((s) => ({ ...s, signedIn: false, demo: false, userId: null, userName: '' })),
    // Called by AuthProvider whenever Supabase reports who is signed in (null = nobody).
    setAuthUser: (u) => setState((s) => (u
      ? { ...s, signedIn: true, demo: false, userId: u.id, email: u.email, verified: u.verified, userName: u.name || s.userName, dataReady: s.userId === u.id ? s.dataReady : false }
      : { ...s, signedIn: false, userId: null, userName: '' })),
    // Add a storyteller. Real mode: create the family first if this account has none
    // (create_family makes the caller its owner), then insert the storyteller row.
    addStoryteller: async (p) => {
      if (!live) { setState((s) => { const id = p.id || 'st-' + Date.now(); return { ...s, storytellers: [...s.storytellers.filter((x) => x.id !== id), { ...p, id }], activeId: id }; }); return; }
      let family = state.family;
      if (!family) { family = await db.createFamily(familyNameFor(p)); }
      const row = await db.addStoryteller(family.id, p);
      setState((s) => ({ ...s, family, storytellers: [...s.storytellers.filter((x) => x.id !== row.id), row], activeId: row.id }));
    },
    updateStoryteller: async (id, patch) => {
      if (!live) { setState((s) => ({ ...s, storytellers: s.storytellers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })); return; }
      const cur = state.storytellers.find((x) => x.id === id); if (!cur) return;
      const row = await db.updateStoryteller(id, { ...cur, ...patch });
      setState((s) => ({ ...s, storytellers: s.storytellers.map((x) => (x.id === id ? row : x)) }));
    },
    setActive: (id) => setState((s) => ({ ...s, activeId: id })),
    setProfile: (p) => api.addStoryteller(p),
    seedDemo: () => setState((s) => ({ ...s, signedIn: true, demo: true, verified: true, email: 'shaojing@example.com', storytellers: [{ ...DEFAULT_PROFILE, id: 'st-demo' }], activeId: 'st-demo', stories: SEED_STORIES.map((x) => ({ ...x, storytellerId: 'st-demo' })) })),
    reset: () => { try { localStorage.removeItem(KEY); } catch {} setState(fresh()); },
    setPlan: (plan) => setState((s) => ({ ...s, plan })),
    setFamilyName: async (familyName) => {
      if (live && state.family) { await db.renameFamily(state.family.id, familyName); setState((s) => ({ ...s, family: { ...s.family, name: familyName } })); return; }
      setState((s) => ({ ...s, familyName }));
    },
    // Join a family with a code. Real mode: server-side join_family, then reload everything for the new family.
    joinFamily: async (code, name) => {
      if (!live) { if (!/^[A-Z]{3,6}-\d{4}$/i.test(code)) return false; api.seedDemo(); setState((s) => ({ ...s, email: name || s.email, invites: [...s.invites, { name: name || 'You', sub: 'member', perms: ['read', 'correct', 'add'], me: true }] })); return true; }
      await db.joinFamily(code.trim().toUpperCase());
      await api.reloadFamily();
      return true;
    },
    reloadFamily: async () => {
      const family = await db.loadMyFamily();
      const [tellers, members, inviteCodes, stories] = family ? await Promise.all([db.loadStorytellers(family.id), db.loadMembers(family.id), db.loadInvites(family.id), db.loadStories(family.id)]) : [[], [], [], []];
      setState((s) => ({ ...s, family, storytellers: tellers, members, inviteCodes, stories, activeId: tellers.some((t) => t.id === s.activeId) ? s.activeId : (tellers[0]?.id || null), dataReady: true }));
    },
    // Make a fresh invite code for this family (owner or any member).
    createInvite: async () => {
      if (!live || !state.family) return null;
      const code = await db.createInvite(state.family.id, state.family.name, state.userId);
      setState((s) => ({ ...s, inviteCodes: [code, ...s.inviteCodes] }));
      return code;
    },
    revokeInvite: async (code) => { if (!live) return; await db.deleteInvite(code); setState((s) => ({ ...s, inviteCodes: s.inviteCodes.filter((c) => c !== code) })); },
    removeMember: async (userId) => { if (!live || !state.family) return; await db.removeMember(state.family.id, userId); setState((s) => ({ ...s, members: s.members.filter((m) => m.userId !== userId) })); },
    previewInvite: (code) => (live ? db.previewInvite(code.trim().toUpperCase()) : Promise.resolve(null)),
    setDraft: (draft) => setState((s) => ({ ...s, draft })),
    // Save a story. Real mode: insert (new) or update (existing) in the stories table.
    // Returns the saved story — for a new one the id is the uuid the database assigned.
    saveStory: async (story) => {
      const st = { ...story, storytellerId: story.storytellerId || state.activeId };
      const exists = state.stories.some((x) => x.id === st.id);
      if (!live) { setState((s) => ({ ...s, draft: null, stories: exists ? s.stories.map((x) => (x.id === st.id ? st : x)) : [st, ...s.stories] })); return st; }
      const saved = exists ? await db.updateStory(st.id, st) : await db.insertStory(state.family.id, state.userId, st);
      // keep the local-only audio preview URL so the just-saved story can still play before Storage lands (step 6)
      const merged = { ...saved, audioUrl: st.audioUrl || saved.audioUrl };
      setState((s) => ({ ...s, draft: null, stories: exists ? s.stories.map((x) => (x.id === merged.id ? merged : x)) : [merged, ...s.stories] }));
      return merged;
    },
    updateStory: async (id, patch) => {
      setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
      if (!live) return;
      const cur = state.stories.find((x) => x.id === id); if (!cur) return;
      try { const saved = await db.updateStory(id, { ...cur, ...patch }); setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...saved, audioUrl: x.audioUrl } : x)) })); }
      catch (e) { console.error('[echoes] update story failed', e); }
    },
    deleteStory: async (id) => { setState((s) => ({ ...s, stories: s.stories.filter((x) => x.id !== id) })); if (live) await db.deleteStory(id); },
    publish: (story, on) => setState((s) => {
      const stories_ = s.stories.map((x) => (x.id === story.id ? { ...x, published: on } : x));
      let posts = s.posts.filter((p) => p.storyId !== story.id);
      const p = s.storytellers.find((x) => x.id === s.activeId);
      if (on) posts = [{ id: 'c-' + story.id, storyId: story.id, author: p?.name || '讲述者', avatar: p?.avatar || null, authorSub: (p?.places || []).join(' → ') + ' · ' + (p?.birth || ''), title: story.title, excerpt: story.text.first.join(' ').replace(/[\[\]]/g, '').slice(0, 90) + '…', lang: p?.lang || 'zh', topics: story.topics || [], era: story.era || '', place: story.place || '', date: new Date().toISOString().slice(0, 10), readMin: Math.max(1, Math.round(story.text.first.join('').length / 400)), body: story.text.first.map((x) => x.replace(/[\[\]]/g, '')), image: story.media?.find((m) => m.kind === 'photo')?.url || null, likes: 0, comments: [], reposts: 0, cover: 'warm', mine: true }, ...posts];
      return { ...s, stories: stories_, posts, consent: { ...s.consent, [story.id]: on ? true : s.consent[story.id] } };
    }),
    updatePost: (id, fn) => setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? fn(p) : p)) })),
    addQuestion: (q) => { const id = 'cq-' + Date.now(); setState((s) => ({ ...s, customQuestions: [{ id, source: 'own', ...q }, ...(s.customQuestions || [])] })); return id; },
    updateQuestion: (id, patch) => setState((s) => ({ ...s, customQuestions: s.customQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
    removeQuestion: (id) => setState((s) => ({ ...s, customQuestions: s.customQuestions.filter((q) => q.id !== id) })),
    setMeAvatar: async (meAvatar) => { setState((s) => ({ ...s, meAvatar })); if (live && state.userId) { try { await db.updateMyProfile(state.userId, { name: state.userName || state.email.split('@')[0], avatar: meAvatar }); } catch (e) { console.warn(e); } } },
    setInviteAvatar: (i, avatar) => setState((s) => ({ ...s, invites: s.invites.map((v, k) => (k === i ? { ...v, avatar } : v)) })),
    react: (storyId, who, emoji) => setState((s) => { const cur = s.reactions?.[storyId] || []; const has = cur.some((r) => r.who === who && r.emoji === emoji); return { ...s, reactions: { ...s.reactions, [storyId]: has ? cur.filter((r) => !(r.who === who && r.emoji === emoji)) : [...cur, { who, emoji }] } }; }),
    addInvite: (inv) => setState((s) => ({ ...s, invites: [...s.invites, inv] })),
    removeInvite: (i) => setState((s) => ({ ...s, invites: s.invites.filter((_, k) => k !== i) })),
    deleteAccount: () => { try { localStorage.removeItem(KEY); } catch {} setState({ ...fresh(), deleted: true }); },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx);
