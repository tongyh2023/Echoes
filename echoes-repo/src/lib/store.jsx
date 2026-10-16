import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_PROFILE, SEED_STORIES, COMMUNITY_POSTS } from '../mock/data';

// App state. In production this is the API layer; here it is React state + localStorage.
const Ctx = createContext(null);
const KEY = 'lifestory-state-v3';
export const FREE_LIMIT = 10;

const fresh = () => ({
  signedIn: false, email: '', verified: false, plan: 'free',
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

export function StoreProvider({ children }) {
  // Seed posts carry non-serialisable/static fields (cover image URLs, body text). Re-apply them over whatever is cached so a stale cache never hides new seed content.
  const hydrate = (s) => { const seed = Object.fromEntries(COMMUNITY_POSTS.map((p) => [p.id, p])); const known = new Set((s.posts || []).map((p) => p.id)); const posts = (s.posts || []).map((p) => (seed[p.id] ? { ...seed[p.id], ...p, image: seed[p.id].image, body: seed[p.id].body } : p)); COMMUNITY_POSTS.forEach((p) => { if (!known.has(p.id)) posts.push(p); }); const kept = posts.filter((p) => (p.mine || seed[p.id]) && ['zh', 'en'].includes(p.lang)); return { ...fresh(), ...s, posts: kept }; };
  const [state, setState] = useState(() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return hydrate(s); } catch {} return fresh(); });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, [state]);

  const profile = state.storytellers.find((s) => s.id === state.activeId) || null;
  const stories = state.stories.filter((s) => !profile || s.storytellerId === profile.id || !s.storytellerId);

  const api = {
    state: { ...state, profile, stories },
    allStories: state.stories,
    signIn: (email) => setState((s) => ({ ...s, signedIn: true, email: email || s.email || 'you@example.com' })),
    verify: () => setState((s) => ({ ...s, verified: true })),
    signOut: () => setState((s) => ({ ...s, signedIn: false })),
    addStoryteller: (p) => setState((s) => { const id = p.id || 'st-' + Date.now(); return { ...s, storytellers: [...s.storytellers.filter((x) => x.id !== id), { ...p, id }], activeId: id }; }),
    updateStoryteller: (id, patch) => setState((s) => ({ ...s, storytellers: s.storytellers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    setActive: (id) => setState((s) => ({ ...s, activeId: id })),
    setProfile: (p) => api.addStoryteller(p),
    seedDemo: () => setState((s) => ({ ...s, signedIn: true, verified: true, email: 'shaojing@example.com', storytellers: [{ ...DEFAULT_PROFILE, id: 'st-demo' }], activeId: 'st-demo', stories: SEED_STORIES.map((x) => ({ ...x, storytellerId: 'st-demo' })) })),
    reset: () => { try { localStorage.removeItem(KEY); } catch {} setState(fresh()); },
    setPlan: (plan) => setState((s) => ({ ...s, plan })),
    setFamilyName: (familyName) => setState((s) => ({ ...s, familyName })),
    joinFamily: (code, name) => { if (!/^[A-Z]{3,6}-\d{4}$/i.test(code)) return false; api.seedDemo(); setState((s) => ({ ...s, email: name || s.email, invites: [...s.invites, { name: name || 'You', sub: 'member', perms: ['read', 'correct', 'add'], me: true }] })); return true; },
    setDraft: (draft) => setState((s) => ({ ...s, draft })),
    saveStory: (story) => setState((s) => {
      const st = { ...story, storytellerId: story.storytellerId || s.activeId };
      const exists = s.stories.some((x) => x.id === st.id);
      return { ...s, draft: null, stories: exists ? s.stories.map((x) => (x.id === st.id ? st : x)) : [st, ...s.stories] };
    }),
    updateStory: (id, patch) => setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
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
    setMeAvatar: (meAvatar) => setState((s) => ({ ...s, meAvatar })),
    setInviteAvatar: (i, avatar) => setState((s) => ({ ...s, invites: s.invites.map((v, k) => (k === i ? { ...v, avatar } : v)) })),
    react: (storyId, who, emoji) => setState((s) => { const cur = s.reactions?.[storyId] || []; const has = cur.some((r) => r.who === who && r.emoji === emoji); return { ...s, reactions: { ...s.reactions, [storyId]: has ? cur.filter((r) => !(r.who === who && r.emoji === emoji)) : [...cur, { who, emoji }] } }; }),
    addInvite: (inv) => setState((s) => ({ ...s, invites: [...s.invites, inv] })),
    removeInvite: (i) => setState((s) => ({ ...s, invites: s.invites.filter((_, k) => k !== i) })),
    deleteAccount: () => { try { localStorage.removeItem(KEY); } catch {} setState({ ...fresh(), deleted: true }); },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx);
