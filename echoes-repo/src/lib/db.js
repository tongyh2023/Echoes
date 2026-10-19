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
