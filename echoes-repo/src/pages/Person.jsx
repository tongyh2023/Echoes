import { useNavigate, useParams } from 'react-router-dom';
import Shell, { PageHeader } from '../components/Shell';
import { useT } from '../lib/i18n';
import { useStore } from '../lib/store';
import { postView } from '../lib/loc';

// Public profile: a storyteller's published stories, as the community sees them.
export default function Person() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { name } = useParams(); const { state } = useStore();
  const who = decodeURIComponent(name);
  const posts = state.posts.filter((p) => p.author === who || p.authorEn === who).map((p) => postView(p, lang));
  const sub = posts[0]?.authorSub || '';
  return (
    <Shell>
      <PageHeader back backTo="/community" eyebrow={sub} title={who} sub={`${posts.length} ${t('community.stories')}`} />
      <div className="rows max-w-[760px]">
        {posts.map((po) => (
          <button key={po.id} className="row-link md:grid-cols-[1fr_120px] items-start gap-6" onClick={() => nav('/read/' + po.id)}>
            <span><span className="ttl">{po.title}</span><span className="block text-[14.5px] text-ink-2 mt-2 line-clamp-2">{po.excerpt}</span><span className="ed-caps block mt-3">{po.place} · {po.era} · ♡ {po.likes}</span></span>
            {po.image && <img src={po.image} alt="" className="hidden md:block w-[120px] aspect-square object-cover" />}
          </button>
        ))}
        {posts.length === 0 && <p className="text-ink-3 py-8 m-0">{zh ? '还没有公开的故事。' : 'No public stories yet.'}</p>}
      </div>
    </Shell>
  );
}
