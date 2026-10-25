import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_PROFILE, SEED_STORIES, COMMUNITY_POSTS } from '../mock/data';
import { hasSupabase, supabase } from './supabase';
import * as db from './db';

// App state. Real mode: everything comes from Supabase (see lib/db.js) and lives in React state only.
// Preview mode (no Supabase configured): in-memory sample data so the single-file build still runs.
const Ctx = createContext(null);
// The one thing kept in the browser between page loads: the story being tidied/reviewed (text only),
// so an accidental refresh on the review page doesn't lose the AI's work. sessionStorage dies with the tab.
const DRAFT = 'echoes-draft';
const loadDraft = () => { try { const d = JSON.parse(sessionStorage.getItem(DRAFT)); return d && typeof d === 'object' ? d : null; } catch { return null; } };
// Which storyteller is selected (a per-tab convenience, also sessionStorage).
const ACTIVE = 'echoes-active';
const loadActive = () => { try { return sessionStorage.getItem(ACTIVE); } catch { return null; } };
// Keep the current selection if it still exists (or the one remembered in this tab), else the first storyteller.
const pickActive = (tellers, current) => { const want = current || loadActive(); return tellers.some((t) => t.id === want) ? want : (tellers[0]?.id || null); };
const storeDraft = (d) => { try { if (d) sessionStorage.setItem(DRAFT, JSON.stringify({ ...d, blob: false })); else sessionStorage.removeItem(DRAFT); } catch {} };
export const FREE_LIMIT = 10;   // free plan: 10 stories, 1 storyteller, 1 invited family member
export const FREE_MEMBERS = 2;   // you + 1 family member on the free plan (server enforces it too, migration 011)

const fresh = () => ({
  signedIn: false, email: '', verified: false, plan: 'free',
  userId: null, userName: '',                  // filled from Supabase Auth (see lib/auth.jsx)
  demo: false,                                 // true only when entered through the sample-data shortcut
  family: null,                                // { id, name, role } from the families table
  members: [],                                 // [{ userId, role, name, avatar }] from family_members + profiles
  inviteCodes: [],                             // unused codes for this family (newest first)
  dataReady: !hasSupabase,                     // false until the user's family + storytellers have been loaded
  feedReady: !hasSupabase,                     // false until the community feed has been fetched once
  storytellers: [], activeId: loadActive(),   // several storytellers per account
  stories: [], posts: hasSupabase ? [] : COMMUNITY_POSTS, draft: loadDraft(),
  invites: hasSupabase ? [] : [{ name: 'Helen', sub: '孙女', perms: ['read', 'correct', 'add'] }],
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

// Load everything that belongs to a family. Each list is fetched on its own and falls back to
// empty on failure, so one missing table (a migration not yet run) never hides the whole family.
async function loadFamilyData(family) {
  const safe = (p, fallback) => p.catch((e) => { console.warn('[echoes] load failed', e?.message || e); return fallback; });
  if (!family) return { storytellers: [], members: [], inviteCodes: [], stories: [], customQuestions: [], reactions: {}, plan: 'free' };
  const [storytellers, members, inviteCodes, stories, customQuestions, reactions, billing] = await Promise.all([
    safe(db.loadStorytellers(family.id), []), safe(db.loadMembers(family.id), []), safe(db.loadInvites(family.id), []),
    safe(db.loadStories(family.id), []), safe(db.loadQuestions(family.id), []), safe(db.loadReactions(family.id), {}),
    safe(db.loadBilling(family.id), null),
  ]);
  return { storytellers, members, inviteCodes, stories, customQuestions, reactions, plan: billing?.plan === 'family' ? 'family' : 'free', billing };
}

// My own row among the members carries my saved display name and photo.
const mine = (members, s) => { const me = (members || []).find((m) => m.userId === s.userId); return me ? { userName: me.name || s.userName, meAvatar: me.avatar || s.meAvatar } : {}; };

export function StoreProvider({ children }) {
  const [state, setState] = useState(fresh);
  useEffect(() => { storeDraft(state.draft); }, [state.draft]);
  useEffect(() => { try { if (state.activeId) sessionStorage.setItem(ACTIVE, state.activeId); } catch {} }, [state.activeId]);

  const profile = state.storytellers.find((s) => s.id === state.activeId) || null;
  const stories = state.stories.filter((s) => !profile || s.storytellerId === profile.id || !s.storytellerId);

  // Real mode: once we know who is signed in, pull their family and storytellers from the database.
  // Signed out: clear them. (Demo mode keeps the local sample data and never touches the server.)
  const live = hasSupabase && !state.demo;
  useEffect(() => {
    if (!hasSupabase || state.demo) return;
    if (!state.userId) {
      setState((s) => ({ ...s, family: null, members: [], inviteCodes: [], storytellers: [], stories: [], customQuestions: [], reactions: {}, activeId: null, dataReady: true }));
      // Visitors can still read the community: published stories are public by rule.
      let alive = true; db.loadFeed(null).then((posts) => alive && setState((s) => (s.userId ? s : { ...s, posts, feedReady: true }))).catch(() => alive && setState((s) => ({ ...s, feedReady: true })));
      return () => { alive = false; };
    }
    let alive = true;
    (async () => {
      try {
        // Someone who signed up through an invite link: join that family first, then load it.
        // The code is in this tab's sessionStorage, or — when the person confirmed their email in another tab —
        // on the account (saved at sign-up). Used once, then cleared from both places.
        let pending = getPendingInvite(); let fromAccount = false;
        if (!pending) { const { data } = await supabase.auth.getUser(); pending = data?.user?.user_metadata?.invite || null; fromAccount = Boolean(pending); }
        if (pending) {
          // join_family (migration 010) also removes an empty family of your own, so the invite always wins.
          try { await db.joinFamily(pending); } catch (e) { console.warn('[echoes] pending invite failed', e); }
          clearPendingInvite();
          supabase.auth.updateUser({ data: { invite: null } }).catch(() => {});
        }
        const family = await db.loadMyFamily();
        const data = await loadFamilyData(family);
        const posts = await db.loadFeed(family?.id).catch((e) => { console.warn('[echoes] feed failed', e?.message || e); return []; });
        if (alive) setState((s) => ({ ...s, family, ...data, ...mine(data.members, s), posts, feedReady: true, activeId: pickActive(data.storytellers, s.activeId), dataReady: true }));
      } catch (e) { console.error('[echoes] load family failed', e); if (alive) setState((s) => ({ ...s, dataReady: true })); }
    })();
    return () => { alive = false; };
  }, [state.userId, state.demo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Family name shown in the header: the real one, or derived from the first storyteller's surname.
  // 童明德 → 童家 · Grandpa Tong → Tong 家 · Helen → Helen 家. Chinese names: first character is the surname.
  // Western-order names: the last word. The family can rename it on the Family page at any time.
  const familyNameFor = (p) => {
    const n = String(p?.name || '').trim(); if (!n) return '我们家';
    if (/^[\u3400-\u9fff]/.test(n)) return n.slice(0, 1) + '家';
    const words = n.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').trim().split(/\s+/).filter((w) => !/^(grandpa|grandma|grandfather|grandmother|uncle|aunt|auntie|mr|mrs|ms|dr|mom|dad|mum|papa|mama|nainai|yeye|waipo|waigong|popo|gonggong|laolao|laoye)$/i.test(w));
    const last = words[words.length - 1] || n;
    return last.slice(0, 1).toUpperCase() + last.slice(1) + ' 家';
  };

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
    // Sample data. Preview mode: fill memory. Real mode: insert the sample storyteller and stories
    // into the signed-in family through the database, flagged demo=true so they can be removed later.
    seedDemo: async () => {
      if (!live) { setState((s) => ({ ...s, signedIn: true, demo: true, verified: true, email: 'shaojing@example.com', storytellers: [{ ...DEFAULT_PROFILE, id: 'st-demo' }], activeId: 'st-demo', stories: SEED_STORIES.map((x) => ({ ...x, storytellerId: 'st-demo' })) })); return; }
      let family = state.family; if (!family) family = await db.createFamily(familyNameFor(DEFAULT_PROFILE));
      let teller = state.storytellers.find((t) => t.demo) || null;
      if (!teller) teller = await db.addStoryteller(family.id, { ...DEFAULT_PROFILE, demo: true });
      const rows = [];
      for (const x of SEED_STORIES) rows.push(await db.insertStory(family.id, state.userId, { ...x, id: undefined, storytellerId: teller.id, demo: true }));
      await api.reloadFamily();
      setState((s) => ({ ...s, activeId: teller.id }));
    },
    // Remove the sample data again (real mode) or wipe memory (preview mode).
    reset: async () => {
      if (!live) { setState(fresh()); return; }
      for (const st of state.stories.filter((x) => x.demo)) await db.deleteStory(st.id);
      const teller = state.storytellers.find((t) => t.demo); if (teller) await db.deleteStoryteller(teller.id);
      await api.reloadFamily();
    },
    setPlan: (plan) => { if (!live) setState((s) => ({ ...s, plan })); },   // demo only; real plans come from Stripe
    // Re-read the plan (after returning from Stripe Checkout the webhook may take a few seconds).
    refreshBilling: async () => { if (!live || !state.family) return null; const b = await db.loadBilling(state.family.id).catch(() => null); setState((s) => ({ ...s, billing: b, plan: b?.plan === 'family' ? 'family' : 'free' })); return b; },
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
      const data = await loadFamilyData(family);
      setState((s) => ({ ...s, family, ...data, ...mine(data.members, s), activeId: pickActive(data.storytellers, s.activeId), dataReady: true }));
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
      let saved;
      if (exists) saved = await db.updateStory(st.id, { ...st, media: await db.persistMedia(state.family.id, st.id, st.media) });
      else {
        // New story: choose the id here so the recording can be uploaded FIRST under <family>/<story>.
        // If the upload fails the story is not inserted, so a retry never creates a duplicate.
        const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
        const id = isUuid(st.id) ? st.id : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : null);
        let audioPath = st.audioPath || null;
        if (!audioPath && st.audioUrl && st.audioUrl.startsWith('blob:')) {
          const blob = await fetch(st.audioUrl).then((r) => r.blob());
          if (blob.size > 0) audioPath = await db.uploadAudio(state.family.id, id, blob);
        }
        const media = await db.persistMedia(state.family.id, id, st.media);
        saved = await db.insertStory(state.family.id, state.userId, { ...st, id, audioPath, media });
      }
      // keep the in-memory preview URL for this session so playback is instant right after saving
      const merged = { ...saved, audioUrl: st.audioUrl || saved.audioUrl };
      setState((s) => ({ ...s, draft: null, stories: exists ? s.stories.map((x) => (x.id === merged.id ? merged : x)) : [merged, ...s.stories] }));
      return merged;
    },
    updateStory: async (id, patch) => {
      setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
      if (!live) return;
      const cur = state.stories.find((x) => x.id === id); if (!cur) return;
      try { const media = patch.media ? await db.persistMedia(state.family.id, id, patch.media) : cur.media; const saved = await db.updateStory(id, { ...cur, ...patch, media }); setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...saved, audioUrl: x.audioUrl } : x)) })); }
      catch (e) { console.error('[echoes] update story failed', e); if (patch.media) throw e; }
    },
    deleteStory: async (id) => { const cur = state.stories.find((x) => x.id === id); setState((s) => ({ ...s, stories: s.stories.filter((x) => x.id !== id) })); if (live) { await db.deleteStory(id); try { await db.deleteFiles([cur?.audioPath, ...(cur?.media || []).map((m) => m.path)]); } catch {} } },
    // Publish to the community = set published on the story row; unpublish = clear it.
    publish: async (story, on) => {
      if (live) {
        setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === story.id ? { ...x, published: on } : x)), consent: { ...s.consent, [story.id]: on ? true : s.consent[story.id] } }));
        await db.setPublished(story.id, on);
        const posts = await db.loadFeed(state.family?.id).catch(() => state.posts);
        setState((s) => ({ ...s, posts }));
        return;
      }
      return api.publishLocal(story, on);
    },
    refreshFeed: async () => { if (!live) return; const posts = await db.loadFeed(state.family?.id); setState((s) => ({ ...s, posts })); },
    loadComments: async (storyId) => { if (!live) return null; const comments = await db.loadComments(storyId); setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === storyId ? { ...p, comments, commentCount: comments.length } : p)) })); return comments; },
    // Like / comment on a community post. Repost and follow stay in the browser for now.
    likePost: async (postId, on) => {
      if (live && !state.userId) throw new Error('signin');
      setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === postId ? { ...p, liked: on, likes: Math.max(0, p.likes + (on ? 1 : -1)) } : p)) }));
      if (live) { try { await db.likeStory(postId, state.userId, on); } catch (e) { console.error('[echoes] like failed', e); } }
    },
    commentPost: async (postId, who, text) => {
      if (live && !state.userId) throw new Error('signin');
      if (!live) { setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { who, text }] } : p)) })); return; }
      const c = await db.addComment(postId, state.userId, text);
      setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { ...c, who }], commentCount: (p.commentCount || 0) + 1 } : p)) }));
    },
    publishLocal: (story, on) => setState((s) => {
      const stories_ = s.stories.map((x) => (x.id === story.id ? { ...x, published: on } : x));
      let posts = s.posts.filter((p) => p.storyId !== story.id);
      const p = s.storytellers.find((x) => x.id === s.activeId);
      if (on) posts = [{ id: 'c-' + story.id, storyId: story.id, author: p?.name || '讲述者', avatar: p?.avatar || null, authorSub: (p?.places || []).join(' → ') + ' · ' + (p?.birth || ''), title: story.title, excerpt: story.text.first.join(' ').replace(/[\[\]]/g, '').slice(0, 90) + '…', lang: p?.lang || 'zh', topics: story.topics || [], era: story.era || '', place: story.place || '', date: new Date().toISOString().slice(0, 10), readMin: Math.max(1, Math.round(story.text.first.join('').length / 400)), body: story.text.first.map((x) => x.replace(/[\[\]]/g, '')), image: story.media?.find((m) => m.kind === 'photo')?.url || null, likes: 0, comments: [], reposts: 0, cover: 'warm', mine: true }, ...posts];
      return { ...s, stories: stories_, posts, consent: { ...s.consent, [story.id]: on ? true : s.consent[story.id] } };
    }),
    updatePost: (id, fn) => setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? fn(p) : p)) })),
    // The family's own questions (written, edited, or asked as a follow-up). Real mode: family_questions table.
    // Returns the question id (sync in demo mode, a promise in real mode — callers await it).
    addQuestion: (q) => {
      if (!live) { const id = 'cq-' + Date.now(); setState((s) => ({ ...s, customQuestions: [{ id, source: 'own', ...q }, ...(s.customQuestions || [])] })); return id; }
      return db.insertQuestion(state.family.id, state.userId, { source: 'own', ...q, who: q.who || state.userName || state.email.split('@')[0] }).then((row) => { setState((s) => ({ ...s, customQuestions: [row, ...(s.customQuestions || [])] })); return row.id; });
    },
    updateQuestion: async (id, patch) => { setState((s) => ({ ...s, customQuestions: s.customQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })); if (live) await db.updateQuestion(id, patch); },
    removeQuestion: async (id) => { setState((s) => ({ ...s, customQuestions: s.customQuestions.filter((q) => q.id !== id) })); if (live) await db.deleteQuestion(id); },
    // My display name (shown to family members and on notifications). Saved on the profile row and the account.
    setMyName: async (name) => {
      const n = String(name || '').trim(); if (!n) return;
      setState((s) => ({ ...s, userName: n, members: s.members.map((m) => (m.userId === s.userId ? { ...m, name: n } : m)) }));
      if (live && state.userId) { await db.updateMyProfile(state.userId, { name: n }); supabase.auth.updateUser({ data: { name: n } }).catch(() => {}); }
    },
    setMeAvatar: async (meAvatar) => { setState((s) => ({ ...s, meAvatar })); if (live && state.userId) { try { await db.updateMyProfile(state.userId, { avatar: meAvatar }); } catch (e) { console.warn(e); } } },
    setInviteAvatar: (i, avatar) => setState((s) => ({ ...s, invites: s.invites.map((v, k) => (k === i ? { ...v, avatar } : v)) })),
    // Toggle an emoji under a story. Real mode: one row per person × emoji in story_reactions.
    react: async (storyId, who, emoji) => {
      const mine = (r) => (live ? r.userId === state.userId : r.who === who);
      const cur = state.reactions?.[storyId] || []; const has = cur.some((r) => mine(r) && r.emoji === emoji);
      setState((s) => { const c = s.reactions?.[storyId] || []; return { ...s, reactions: { ...s.reactions, [storyId]: has ? c.filter((r) => !(mine(r) && r.emoji === emoji)) : [...c, { who, userId: s.userId, emoji }] } }; });
      if (!live) return;
      try { if (has) await db.removeReaction(storyId, state.userId, emoji); else await db.addReaction(storyId, state.family.id, state.userId, emoji); } catch (e) { console.error('[echoes] reaction failed', e); }
    },
    addInvite: (inv) => setState((s) => ({ ...s, invites: [...s.invites, inv] })),
    removeInvite: (i) => setState((s) => ({ ...s, invites: s.invites.filter((_, k) => k !== i) })),
    // Account deletion itself is a server-side job (later); here we leave the family and clear the session.
    deleteAccount: async () => { if (live && state.family && state.userId) { try { await db.removeMember(state.family.id, state.userId); } catch {} } setState({ ...fresh(), draft: null, deleted: true }); },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx);
