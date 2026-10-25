import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Shell, { Narrow, Note } from '../components/Shell';
import { useT, LANGUAGES, DIALECTS } from '../lib/i18n';
import { useStore } from '../lib/store';
import { DEFAULT_PROFILE } from '../mock/data';
import { stripEn } from '../lib/loc';

export function Mode() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const adding = useLocation().search.includes('add=');
  const Card = ({ title, sub, mode, icon }) => (
    <button onClick={() => nav('/profile?mode=' + mode + (adding ? '&add=1' : ''))} className="row-link grid-cols-[48px_1fr_auto] items-center gap-5">
      <span className="w-12 h-12 avatar text-[20px]">{icon}</span>
      <span><span className="ttl">{title}</span><span className="block text-[14px] text-ink-2 mt-1">{sub}</span></span>
      <span className="link text-[13.5px]">{zh ? '选这个' : 'Choose'} →</span>
    </button>
  );
  return (
    <Shell nav={false}>
      <Narrow className="pt-10">
        <div className="ed-caps mb-3">{t('profile.step1')}</div>
        <h1 className="serif font-medium text-[34px] leading-[1.25] m-0 mb-8">{t('mode.title')}</h1>
        <div className="rows">
          <Card mode="other" icon="家" title={t('mode.other')} sub={t('mode.otherSub')} />
          <Card mode="self" icon="我" title={t('mode.self')} sub={t('mode.selfSub')} />
        </div>
      </Narrow>
    </Shell>
  );
}

export function Profile() {
  const { t, lang } = useT(); const nav = useNavigate(); const { setProfile, state, updateStoryteller, live } = useStore();
  const loc = useLocation(); const qs = new URLSearchParams(loc.search); const mode = qs.get('mode') || 'other'; const editId = qs.get('edit');
  const existing = editId ? state.storytellers.find((s) => s.id === editId) : null;
  // A new storyteller starts empty (never from the sample — its English twins would leak into real data).
  // Recording yourself: your own account name is filled in.
  const blank = { mode, name: mode === 'self' ? (state.userName || '') : '', relation: '', birth: '', hometown: '', livesIn: '', country: '', places: [''], lang, dialects: [] };
  const [f, setF] = useState(existing ? { ...stripEn(existing), places: existing.places?.length ? existing.places : [''] } : blank);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setPlace = (i, v) => setF((s) => ({ ...s, places: s.places.map((p, k) => (k === i ? v : p)) }));
  const self = mode === 'self';
  const dialects = DIALECTS[f.lang] || [];
  const fill = () => setF({ ...DEFAULT_PROFILE, mode, name: self ? '童明德' : DEFAULT_PROFILE.name, relation: self ? '' : DEFAULT_PROFILE.relation });
  const canDone = f.name && f.hometown;
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  // Save goes to the database in real mode: creates the family on first use, then the storyteller.
  const save = async (v, back) => {
    setErr(''); setBusy(true);
    try { if (existing) { await updateStoryteller(existing.id, v); nav(-1); } else { await setProfile(v); nav(back || '/home'); } }
    catch (e) { setErr((lang === 'zh' ? '没保存上：' : 'Couldn’t save: ') + (e?.message || '')); }
    finally { setBusy(false); }
  };
  return (
    <Shell nav={false}>
      <Narrow className="pt-6">
        {existing ? <button className="ed-caps hover:!text-ink cursor-pointer mb-6 block" onClick={() => nav(-1)}>{t('nav.back')}</button> : <button className="ed-caps hover:!text-ink cursor-pointer mb-6 block" onClick={() => nav('/mode')}>{t('nav.back')}</button>}
        <div className="ed-caps mb-3">{existing ? t('profile.editTitle') : t('profile.step2')}</div>
        <h1 className="serif font-medium text-[34px] leading-[1.25] m-0 mb-3">{existing ? existing.name : self ? t('profile.titleSelf') : t('profile.titleOther')}</h1>
        <p className="text-ink-2 mb-7">{t('profile.sub')} {!live && <button className="link-soft text-[13px]" onClick={fill}>{t('profile.fill')}</button>}</p>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">{self ? t('profile.nameSelf') : t('profile.nameOther')}</label><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder={self ? t('profile.ph.nameSelf') : t('profile.ph.nameOther')} /></div>
          {!self && <div><label className="label">{t('profile.relation')}</label><input className="input" value={f.relation} onChange={(e) => set('relation', e.target.value)} placeholder={t('profile.ph.relation')} /></div>}
          <div><label className="label">{t('profile.birth')}</label><input className="input" value={f.birth} onChange={(e) => set('birth', e.target.value)} placeholder={t('profile.ph.birth')} /></div>
          <div><label className="label">{t('profile.country')}</label><input className="input" list="echoes-countries" value={f.country || ''} onChange={(e) => set('country', e.target.value)} placeholder={t('profile.ph.country')} />
            <datalist id="echoes-countries">{(lang === 'zh' ? ['中国', '中国香港', '中国台湾', '加拿大', '美国', '英国', '澳大利亚', '新西兰', '新加坡', '马来西亚', '日本', '韩国'] : ['China', 'Hong Kong', 'Taiwan', 'Canada', 'United States', 'United Kingdom', 'Australia', 'New Zealand', 'Singapore', 'Malaysia', 'Japan', 'Korea']).map((c) => <option key={c} value={c} />)}</datalist></div>
          <div><label className="label">{t('profile.hometown')}</label><input className="input" value={f.hometown} onChange={(e) => set('hometown', e.target.value)} placeholder={t('profile.ph.hometown')} /></div>
          <div className={self ? 'col-span-2' : ''}><label className="label">{t('profile.livesIn')}</label><input className="input" value={f.livesIn} onChange={(e) => set('livesIn', e.target.value)} placeholder={t('profile.ph.livesIn')} /></div>
        </div>

        <div className="mt-6">
          <label className="label">{t('profile.places')} <span className="text-ink-3">· {t('profile.placesHint')}</span></label>
          <div className="grid gap-2">
            {f.places.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="w-6 text-[12px] text-ink-3 tabular-nums text-right">{i + 1}</span>
                <input className="input" value={p} onChange={(e) => setPlace(i, e.target.value)} placeholder={t('profile.ph.places')[i] || t('profile.ph.place')} />
                {f.places.length > 1 && <button className="link-soft text-[13px]" onClick={() => set('places', f.places.filter((_, k) => k !== i))}>×</button>}
              </div>
            ))}
          </div>
          <button className="link-soft text-[13px] mt-3" onClick={() => set('places', [...f.places, ''])}>{t('profile.addPlace')}</button>
        </div>

        <div className="mt-6">
          <label className="label">{t('profile.lang')} <span className="text-ink-3">· {t('profile.langHint')}</span></label>
          <div className="chips">
            {LANGUAGES.map((l) => <button key={l.code} className={'chip ' + (f.lang === l.code ? 'on' : '')} onClick={() => setF((s) => ({ ...s, lang: l.code, dialects: [] }))}>{l.label}</button>)}
          </div>
        </div>
        <div className="mt-5">
          <label className="label">{t('profile.dialect')} <span className="text-ink-3">· {t('profile.dialectHint')}</span></label>
          <div className="chips">
            {dialects.map((d) => <button key={d} className={'chip ' + (f.dialects.includes(d) ? 'on' : '')} onClick={() => set('dialects', f.dialects.includes(d) ? f.dialects.filter((x) => x !== d) : [...f.dialects, d])}>{d}</button>)}
          </div>
        </div>

        <div className="flex items-center gap-7 mt-10">
          <button className="btn btn-primary btn-lg" disabled={!canDone || busy} onClick={() => save({ ...f, places: f.places.filter(Boolean) })}>{busy ? (lang === 'zh' ? '保存中…' : 'Saving…') : existing ? t('profile.save') : t('profile.done')}</button>
          {!existing && <button className="link-soft text-[14px]" disabled={busy} onClick={() => save(live ? { ...blank, places: [], name: f.name.trim() || (mode === 'self' ? (state.userName || (lang === 'zh' ? '我' : 'Me')) : (lang === 'zh' ? '长辈' : 'Grandparent')) } : { ...DEFAULT_PROFILE, mode })}>{t('profile.skip')}</button>}
          {existing && <button className="link-soft text-[14px]" onClick={() => nav(-1)}>{t('common.cancel')}</button>}
        </div>
        {err && <p className="text-rec text-[13.5px] mt-3">{err}</p>}
        <div className="mt-8"><Note>{t('profile.note')}</Note></div>
      </Narrow>
    </Shell>
  );
}
