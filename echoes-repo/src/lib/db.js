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
