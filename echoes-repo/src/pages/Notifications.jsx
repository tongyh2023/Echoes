import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { PageHeader } from '../components/Shell';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { loadNotifications, markNotificationsSeen } from '../lib/db';

// Who liked our stories (community) or left a reaction (family). Opening this page marks everything as seen.
export default function Notifications() {
  const { lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { state } = useStore();
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    loadNotifications().then((n) => { if (alive) setItems(n); if (n.some((x) => x.unread) && state.userId) markNotificationsSeen(state.userId).catch(() => {}); }).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const when = (iso) => { const d = new Date(iso); const mins = Math.round((Date.now() - d) / 60000);
    if (mins < 60) return zh ? `${Math.max(mins, 1)} 分钟前` : `${Math.max(mins, 1)} min ago`;
    if (mins < 1440) return zh ? `${Math.round(mins / 60)} 小时前` : `${Math.round(mins / 60)} h ago`;
    return d.toISOString().slice(0, 10); };
  const line = (n) => n.kind === 'like'
    ? (zh ? <><b className="font-medium">{n.who}</b> 在社区喜欢了《{n.title}》</> : <><b className="font-medium">{n.who}</b> liked “{n.title}” in the community</>)
    : (zh ? <><b className="font-medium">{n.who}</b> 在《{n.title}》下留了 {n.emoji}</> : <><b className="font-medium">{n.who}</b> reacted {n.emoji} to “{n.title}”</>);
  return (
    <Shell>
      <div className="max-w-[640px] mx-auto">
        <PageHeader back title={zh ? '动态' : 'Activity'} sub={zh ? '家人和社区里的人对你们故事的喜欢。' : 'Likes and reactions on your family’s stories.'} />
        {items === null ? <p className="text-ink-3">{zh ? '加载中…' : 'Loading…'}</p>
          : items.length === 0 ? <p className="text-ink-2">{zh ? '还没有新的动态。故事发布到社区后，别人点的喜欢会出现在这里。' : 'Nothing yet. Once a story is published to the community, likes will show up here.'}</p>
          : <div className="divide-y divide-line border-t border-b border-line">
              {items.map((n, i) => (
                <button key={i} onClick={() => nav('/story/' + n.storyId)} className="w-full text-left py-4 flex items-baseline gap-4 cursor-pointer hover:bg-line/30">
                  <span className={'text-[15px] ' + (n.kind === 'like' ? 'text-rec' : '')}>{n.kind === 'like' ? '♥' : n.emoji}</span>
                  <span className="flex-1 text-[15px]">{line(n)}</span>
                  {n.unread && <span className="w-2 h-2 rounded-full bg-rec shrink-0" aria-label={zh ? '未读' : 'unread'} />}
                  <span className="text-[12.5px] text-ink-3 shrink-0">{when(n.at)}</span>
                </button>
              ))}
            </div>}
      </div>
    </Shell>
  );
}
