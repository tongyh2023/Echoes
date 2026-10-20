// Echoes · 余音 — every read/write against the database, in one file.
//
// Pages never call `supabase.from(...)` directly; they call these functions.
// That keeps table names and column names in one place, so a schema change
// is a one-file edit. Each function returns plain objects the app already uses.
import { supabase } from './supabase';

// Turn Supabase's { data, error } into "data or throw".
const unwrap = ({ data, error }) => { if (error) throw error; return data; };

// ---------- family ----------

// The family the signed-in user belongs to (one per account in v1), or null.
export async function loadMyFamily() {
  const rows = unwrap(await supabase.from('family_members').select('role, families(id, name, created_by, created_at)').limit(1));
  const m = rows?.[0];
  return m?.families ? { id: m.families.id, name: m.families.name, role: m.role } : null;
}

// Calls the database function create_family(name): inserts the family AND makes the
// caller its owner in one server-side step, so RLS never sees a family with no members.
export async function createFamily(name) {
  const id = unwrap(await supabase.rpc('create_family', { family_name: name }));
  return { id, name, role: 'owner' };
}

export async function renameFamily(id, name) {
  unwrap(await supabase.from('families').update({ name }).eq('id', id));
}

// ---------- storytellers ----------

// Database row → the profile object the pages already use.
const rowToStoryteller = (r) => ({ ...(r.profile || {}), id: r.id, familyId: r.family_id, name: r.name, hometown: r.profile?.hometown || r.home || '', dialects: r.profile?.dialects || (r.dialect ? [r.dialect] : []), avatar: r.avatar_url || r.profile?.avatar || null });

// Profile object → database row. name / home / dialect are mirrored into real columns
// so they are readable in the Supabase dashboard; the full form lives in `profile`.
const storytellerToRow = (p) => ({ name: p.name, home: p.hometown || null, dialect: p.dialects?.[0] || null, avatar_url: p.avatar || null, profile: { ...p, id: undefined, familyId: undefined } });

export async function loadStorytellers(familyId) {
  const rows = unwrap(await supabase.from('storytellers').select('*').eq('family_id', familyId).order('created_at'));
  return (rows || []).map(rowToStoryteller);
}

export async function addStoryteller(familyId, p) {
  const row = unwrap(await supabase.from('storytellers').insert({ family_id: familyId, ...storytellerToRow(p) }).select().single());
  return rowToStoryteller(row);
}

export async function updateStoryteller(id, p) {
  const row = unwrap(await supabase.from('storytellers').update(storytellerToRow(p)).eq('id', id).select().single());
  return rowToStoryteller(row);
}

// ---------- members ----------

// Everyone in the family, with the display name from their profile.
export async function loadMembers(familyId) {
  const rows = unwrap(await supabase.from('family_members').select('user_id, role, joined_at, profiles(name, avatar_url)').eq('family_id', familyId).order('joined_at'));
  return (rows || []).map((r) => ({ userId: r.user_id, role: r.role, joinedAt: r.joined_at, name: r.profiles?.name || '', avatar: r.profiles?.avatar_url || null }));
}

export async function removeMember(familyId, userId) {
  unwrap(await supabase.from('family_members').delete().eq('family_id', familyId).eq('user_id', userId));
}

// My own display name / photo (profiles row is created automatically at sign-up).
export async function updateMyProfile(userId, patch) {
  unwrap(await supabase.from('profiles').update({ name: patch.name, avatar_url: patch.avatar }).eq('id', userId));
}

// ---------- invites ----------

// A code people can read out loud over the phone: 4 letters + 4 digits, e.g. TONG-4821.
// The letters come from the family name when it is Latin, otherwise from a safe alphabet.
const makeCode = (familyName) => {
  const letters = (familyName || '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let pre = letters; while (pre.length < 4) pre += alphabet[Math.floor(Math.random() * alphabet.length)];
  return pre + '-' + String(1000 + Math.floor(Math.random() * 9000));
};

// Unused codes for this family (so the page can show the current one instead of making new ones).
export async function loadInvites(familyId) {
  const rows = unwrap(await supabase.from('invites').select('code, created_at, used_by').eq('family_id', familyId).is('used_by', null).order('created_at', { ascending: false }));
  return (rows || []).map((r) => r.code);
}

export async function createInvite(familyId, familyName, userId) {
  const code = makeCode(familyName);
  unwrap(await supabase.from('invites').insert({ code, family_id: familyId, created_by: userId }));
  return code;
}

export async function deleteInvite(code) {
  unwrap(await supabase.from('invites').delete().eq('code', code));
}

// What an invited person sees before joining (public function, see 003_invites.sql).
export async function previewInvite(code) {
  const rows = unwrap(await supabase.rpc('invite_preview', { invite_code: code }));
  const r = rows?.[0];
  return r ? { familyName: r.family_name, storytellerName: r.storyteller_name, storyCount: r.story_count } : null;
}

// Join with a code. join_family runs on the server because, at that moment,
// the caller is not yet a member and RLS would refuse a direct insert.
export async function joinFamily(code) {
  return unwrap(await supabase.rpc('join_family', { invite_code: code })); // returns the family id
}

// ---------- stories ----------

// "4:12" ↔ 252 seconds. The app shows m:ss; the database keeps an integer.
const toSeconds = (d) => { if (typeof d === 'number') return d; const m = /^(\d+):(\d{1,2})$/.exec(d || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const toClock = (s) => (s == null ? '' : Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));

// Database row → the story object every page already uses.
export const rowToStory = (r) => ({
  id: r.id, familyId: r.family_id, storytellerId: r.storyteller_id, authorId: r.author_id,
  title: r.title || '', question: r.question || '', questionId: r.question_id || null,
  text: r.text || { first: [], raw: [] }, terms: r.terms || [],
  topics: r.topics || [], people: r.people || [], era: r.era || '', place: r.place || '', lang: r.lang || 'zh',
  audioPath: r.audio_path || null, duration: toClock(r.duration),
  published: Boolean(r.published), date: (r.created_at || '').slice(0, 10), updatedAt: r.updated_at,
  ...(r.extras || {}),           // media, provider, pending…
});

// Story object → row. Only columns that exist in the table; the rest goes into `extras`.
const COLUMNS = new Set(['id', 'familyId', 'storytellerId', 'authorId', 'title', 'question', 'questionId', 'text', 'terms', 'topics', 'people', 'era', 'place', 'lang', 'audioPath', 'duration', 'published', 'date', 'updatedAt']);
const storyToRow = (s) => {
  const extras = {}; for (const k of Object.keys(s)) if (!COLUMNS.has(k) && k !== 'audioUrl' && k !== 'blob') extras[k] = s[k];
  return {
    storyteller_id: s.storytellerId || null, title: s.title || '', question: s.question || '', question_id: s.questionId || null,
    text: { first: s.text?.first || [], raw: s.text?.raw || [] }, terms: s.terms || [],
    topics: s.topics || [], people: s.people || [], era: s.era || null, place: s.place || null, lang: s.lang || 'zh',
    audio_path: s.audioPath || null, duration: toSeconds(s.duration), published: Boolean(s.published), extras,
  };
};

export async function loadStories(familyId) {
  const rows = unwrap(await supabase.from('stories').select('*').eq('family_id', familyId).order('created_at', { ascending: false }));
  return (rows || []).map(rowToStory);
}

// Insert a new story. The database assigns the id (uuid) and created_at.
export async function insertStory(familyId, authorId, s) {
  const row = unwrap(await supabase.from('stories').insert({ ...(s.id && /^[0-9a-f-]{36}$/.test(s.id) ? { id: s.id } : {}), family_id: familyId, author_id: authorId, ...storyToRow(s) }).select().single());
  return rowToStory(row);
}

export async function updateStory(id, s) {
  const row = unwrap(await supabase.from('stories').update(storyToRow(s)).eq('id', id).select().single());
  return rowToStory(row);
}

export async function deleteStory(id) {
  unwrap(await supabase.from('stories').delete().eq('id', id));
}

// ---------- the family's own questions ----------

const rowToQuestion = (r) => ({ id: r.id, text: r.text, source: r.source, from: r.from_story || r.from_q || null, fromTitle: r.from_title || '', who: r.who || '', createdBy: r.created_by, date: (r.created_at || '').slice(0, 10) });

export async function loadQuestions(familyId) {
  const rows = unwrap(await supabase.from('family_questions').select('*, profiles:created_by(name)').eq('family_id', familyId).order('created_at', { ascending: false }));
  return (rows || []).map((r) => rowToQuestion({ ...r, who: r.profiles?.name || '' }));
}

export async function insertQuestion(familyId, userId, q) {
  const isStory = q.source === 'followup';
  const row = unwrap(await supabase.from('family_questions').insert({ family_id: familyId, created_by: userId, text: q.text, source: q.source || 'own', from_story: isStory ? q.from : null, from_q: !isStory ? q.from || null : null, from_title: q.fromTitle || null }).select().single());
  return rowToQuestion({ ...row, who: q.who || '' });
}

export async function updateQuestion(id, patch) {
  unwrap(await supabase.from('family_questions').update({ text: patch.text }).eq('id', id));
}

export async function deleteQuestion(id) {
  unwrap(await supabase.from('family_questions').delete().eq('id', id));
}

// ---------- reactions under a story ----------

// All reactions for the family, grouped by story: { storyId: [{ who, userId, emoji }] }
export async function loadReactions(familyId) {
  const rows = unwrap(await supabase.from('story_reactions').select('story_id, user_id, emoji, profiles:user_id(name)').eq('family_id', familyId));
  const out = {};
  for (const r of rows || []) (out[r.story_id] ||= []).push({ userId: r.user_id, who: r.profiles?.name || '', emoji: r.emoji });
  return out;
}

export async function addReaction(storyId, familyId, userId, emoji) {
  unwrap(await supabase.from('story_reactions').insert({ story_id: storyId, family_id: familyId, user_id: userId, emoji }));
}

export async function removeReaction(storyId, userId, emoji) {
  unwrap(await supabase.from('story_reactions').delete().eq('story_id', storyId).eq('user_id', userId).eq('emoji', emoji));
}

// ---------- recordings (Supabase Storage, bucket "audio") ----------
//
// Files are stored as  <family_id>/<story_id>.<ext>  inside the private "audio" bucket.
// The bucket's policies (001_schema.sql) read the first path segment and ask
// "is the caller a member of that family?" — so the path IS the permission.

const extFor = (type = '') => (type.includes('mp4') || type.includes('m4a') || type.includes('aac') ? 'm4a' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm');

export async function uploadAudio(familyId, storyId, blob) {
  const path = `${familyId}/${storyId}.${extFor(blob.type)}`;
  unwrap(await supabase.storage.from('audio').upload(path, blob, { contentType: blob.type || 'audio/webm', upsert: true }));
  return path;
}

// A temporary link (1 hour) to play a recording. Supabase checks the policy before issuing it,
// so someone outside the family gets an error here, not a URL. Links are cached per page load.
const urlCache = new Map();
export async function getAudioUrl(path) {
  const hit = urlCache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { signedUrl } = unwrap(await supabase.storage.from('audio').createSignedUrl(path, 3600));
  urlCache.set(path, { url: signedUrl, exp: Date.now() + 55 * 60 * 1000 });
  return signedUrl;
}

export async function deleteAudio(path) {
  if (path) unwrap(await supabase.storage.from('audio').remove([path]));
}

// ---------- community ----------

// A published story → the "post" object the community pages already render.
const feedRowToPost = (r, myFamilyId) => {
  const paras = (r.text?.first || []).map((x) => String(x).replace(/[\[\]]/g, ''));
  return {
    id: r.id, storyId: r.id, familyId: r.family_id, mine: Boolean(myFamilyId) && r.family_id === myFamilyId,
    author: r.author || r.family_name || '', authorSub: r.author_sub || '', avatar: r.author_avatar || null,
    title: r.title || '', excerpt: paras.join(' ').slice(0, 90) + (paras.join(' ').length > 90 ? '…' : ''), body: paras,
    terms: r.terms || [], lang: r.lang || 'zh', topics: r.topics || [], era: r.era || '', place: r.place || '',
    date: (r.created_at || '').slice(0, 10), readMin: Math.max(1, Math.round(paras.join('').length / 400)),
    image: null, cover: 'warm', likes: r.likes || 0, liked: Boolean(r.liked), comments: [], commentCount: r.comments || 0, reposts: 0,
  };
};

export async function loadFeed(myFamilyId) {
  const rows = unwrap(await supabase.rpc('community_feed'));
  return (rows || []).map((r) => feedRowToPost(r, myFamilyId));
}

export async function loadComments(storyId) {
  const rows = unwrap(await supabase.rpc('community_comments', { story: storyId }));
  return (rows || []).map((r) => ({ id: r.id, who: r.who, text: r.text, date: (r.created_at || '').slice(0, 10) }));
}

export async function likeStory(storyId, userId, on) {
  if (on) unwrap(await supabase.from('community_activity').insert({ story_id: storyId, user_id: userId, kind: 'like' }));
  else unwrap(await supabase.from('community_activity').delete().eq('story_id', storyId).eq('user_id', userId).eq('kind', 'like'));
}

export async function addComment(storyId, userId, text) {
  const row = unwrap(await supabase.from('community_activity').insert({ story_id: storyId, user_id: userId, kind: 'comment', text }).select().single());
  return { id: row.id, text: row.text, date: (row.created_at || '').slice(0, 10) };
}

// Publish = flip one boolean on the story row. Nothing is copied.
export async function setPublished(storyId, on) {
  unwrap(await supabase.from('stories').update({ published: on }).eq('id', storyId));
}
