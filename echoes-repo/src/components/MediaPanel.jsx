import { useRef, useState, useEffect } from 'react';
import { getAudioUrl } from '../lib/db';
import { useT } from '../lib/i18n';

// Photo / video / music attachments. Files stay in memory as object URLs (mock); production uploads to storage.
export default function MediaPanel({ media, onChange, compact = false }) {
  const { t } = useT(); const ref = useRef(null);
  const add = (e) => {
    const files = [...(e.target.files || [])];
    onChange([...media, ...files.map((f) => ({ id: Math.random().toString(36).slice(2), name: f.name, kind: f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'music' : 'photo', url: URL.createObjectURL(f), file: f }))]);
    e.target.value = '';
  };
  const icon = { photo: '🖼', video: '🎞', music: '♪' };
  // Items saved to Storage carry a path, not a URL: sign a link for each (1 hour, cached).
  const [links, setLinks] = useState({});
  useEffect(() => {
    let alive = true;
    const need = (media || []).filter((m) => m.path && !m.url && !links[m.id]);
    if (!need.length) return;
    Promise.all(need.map(async (m) => [m.id, await getAudioUrl(m.path).catch(() => null)])).then((pairs) => { if (alive) setLinks((l) => ({ ...l, ...Object.fromEntries(pairs) })); });
    return () => { alive = false; };
  }, [media]); // eslint-disable-line react-hooks/exhaustive-deps
  const src = (m) => m.url || links[m.id] || '';
  return (
    <div>
      {!compact && <><div className="eyebrow mb-1">{t('review.media')}</div><p className="text-[12.5px] text-ink-2 mb-3">{t('review.mediaHint')}</p></>}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {media.map((m) => (
          <div key={m.id} className="relative aspect-square overflow-hidden bg-line-2 border border-line">
            {m.kind === 'photo' && <img src={src(m)} alt="" className="w-full h-full object-cover" />}
            {m.kind === 'video' && <video src={src(m)} className="w-full h-full object-cover" muted />}
            {m.kind === 'music' && <div className="w-full h-full flex items-center justify-center text-[22px] text-ochre">♪</div>}
            <button onClick={() => onChange(media.filter((x) => x.id !== m.id))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-[11px] cursor-pointer">×</button>
            <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1">{t('review.' + m.kind)}</span>
          </div>
        ))}
        <button onClick={() => ref.current.click()} className="aspect-square ph cursor-pointer hover:border-ochre flex-col gap-1 !text-ink-2"><span className="text-[22px] leading-none">+</span><span>{t('review.photo')} / {t('review.video')} / {t('review.music')}</span></button>
      </div>
      <input ref={ref} type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={add} />
    </div>
  );
}
