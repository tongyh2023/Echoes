import { useRef, useState, useEffect } from 'react';
import { getAudioUrl } from '../lib/db';
import { useT } from '../lib/i18n';

// Photos and videos kept with a story. Always visible (no menu to find it in): a heading, one line of why,
// the pictures, and a big "+ add an old photo" tile. The first photo is the story's cover in the community.
// `autosave`: on the saved story page, picking or removing a file is saved right away (onChange returns a promise).
export default function MediaPanel({ media = [], onChange, autosave = false }) {
  const { lang } = useT(); const zh = lang === 'zh'; const ref = useRef(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const commit = async (next) => {
    setErr('');
    if (!autosave) return onChange(next);
    setBusy(true);
    try { await onChange(next); } catch { setErr(zh ? '没有保存成功，请再试一次。' : 'Could not save — please try again.'); } finally { setBusy(false); }
  };
  const add = (e) => {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith('image') || f.type.startsWith('video'));
    e.target.value = '';
    if (!files.length) return;
    commit([...media, ...files.map((f) => ({ id: Math.random().toString(36).slice(2), name: f.name, kind: f.type.startsWith('video') ? 'video' : 'photo', url: URL.createObjectURL(f), file: f }))]);
  };
  const remove = (m) => { if (autosave && !window.confirm(zh ? '从这个故事里移除这张？' : 'Remove this from the story?')) return; commit(media.filter((x) => x.id !== m.id)); };
  // Items saved to Storage carry a path, not a URL: sign a link for each (1 hour, cached).
  const [links, setLinks] = useState({});
  useEffect(() => {
    let alive = true;
    const need = media.filter((m) => m.path && !m.url && !links[m.id]);
    if (!need.length) return;
    Promise.all(need.map(async (m) => [m.id, await getAudioUrl(m.path).catch(() => null)])).then((pairs) => { if (alive) setLinks((l) => ({ ...l, ...Object.fromEntries(pairs) })); });
    return () => { alive = false; };
  }, [media]); // eslint-disable-line react-hooks/exhaustive-deps
  const src = (m) => m.url || links[m.id] || '';
  const visible = media.filter((m) => m.kind === 'photo' || m.kind === 'video');
  const coverId = visible.find((m) => m.kind === 'photo')?.id;
  return (
    <section className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <div className="ed-caps">{zh ? '照片和视频' : 'Photos & video'}</div>
        {busy && <span className="text-[12.5px] text-ink-3">{zh ? '正在保存…' : 'Saving…'}</span>}
      </div>
      <p className="text-[13.5px] text-ink-2 mb-4">{visible.length
        ? (zh ? '第一张照片是这个故事在社区里的封面。家里任何人都可以添加。' : 'The first photo is the story’s cover in the community. Anyone in the family can add more.')
        : (zh ? '那架钢琴、当年的合影、老家的门口……一张照片能让故事活起来。' : 'The piano, an old group photo, the front door back home — one picture brings the story to life.')}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {visible.map((m) => (
          <div key={m.id} className="relative aspect-square overflow-hidden bg-line-2 border border-line">
            {m.kind === 'photo' ? <img src={src(m)} alt="" className="w-full h-full object-cover" /> : <video src={src(m)} className="w-full h-full object-cover" muted controls />}
            <button onClick={() => remove(m)} disabled={busy} aria-label={zh ? '移除' : 'Remove'} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white text-[12px] cursor-pointer">×</button>
            {m.id === coverId && <span className="absolute bottom-1.5 left-1.5 text-[10.5px] bg-black/55 text-white px-1.5 py-0.5">{zh ? '封面' : 'Cover'}</span>}
          </div>
        ))}
        {visible.length ? (
          <button onClick={() => ref.current.click()} disabled={busy} className="aspect-square border-2 border-dashed border-line hover:border-accent hover:text-ink text-ink-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
            <span className="text-[26px] leading-none">+</span><span className="text-[14px]">{zh ? '再加一张' : 'Add more'}</span>
          </button>
        ) : (
          <button onClick={() => ref.current.click()} disabled={busy} className="col-span-3 sm:col-span-4 border-2 border-dashed border-line hover:border-accent hover:text-ink text-ink-2 flex items-center justify-center gap-4 py-7 cursor-pointer transition-colors">
            <span className="text-[28px] leading-none">+</span>
            <span className="text-left"><span className="block text-[15px] text-ink">{zh ? '加一张老照片' : 'Add an old photo'}</span><span className="block text-[12.5px] text-ink-3">{zh ? '照片或视频，可多选' : 'Photos or video, several at once'}</span></span>
          </button>
        )}
      </div>
      {err && <p className="text-[13px] text-rec mt-2">{err}</p>}
      <input ref={ref} type="file" accept="image/*,video/*" multiple className="hidden" onChange={add} />
    </section>
  );
}
