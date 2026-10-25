-- Echoes · 余音 — migration 012 · labelled sample stories for the community
-- Run once in Supabase → SQL Editor. Safe to run again (rows have fixed ids; existing ones are left alone).
-- Three example stories, published by a "余音示例 · Echoes samples" family with no members. They are marked
-- extras.sample = true and the site shows them with a "示例 / Sample" label, below real stories.
-- To remove them later:  delete from public.families where id = '0e0e0e0e-0000-4000-8000-000000000001';

-- 1. community_feed() also returns whether a story is a sample; real stories come first.
drop function if exists public.community_feed();
create function public.community_feed()
returns table (
  id uuid, family_id uuid, title text, question text, text jsonb, terms jsonb,
  topics text[], people text[], era text, place text, lang text, created_at timestamptz,
  author text, author_sub text, author_avatar text, family_name text,
  likes int, liked boolean, photo text, sample boolean
)
language sql stable security definer set search_path = public as $$
  select s.id, s.family_id, s.title, s.question, s.text,
         (select coalesce(jsonb_agg(t), '[]'::jsonb) from jsonb_array_elements(s.terms) t where t->>'status' = 'ok') as terms,
         s.topics, s.people, s.era, s.place, s.lang, s.created_at,
         coalesce(st.name, f.name) as author,
         concat_ws(' · ', nullif(st.home, ''), nullif(st.profile->>'birth', '')) as author_sub,
         st.avatar_url as author_avatar,
         f.name as family_name,
         (select count(*)::int from public.community_activity a where a.story_id = s.id and a.kind = 'like') as likes,
         exists (select 1 from public.community_activity a where a.story_id = s.id and a.kind = 'like' and a.user_id = auth.uid()) as liked,
         (select m->>'path' from jsonb_array_elements(coalesce(s.extras->'media', '[]'::jsonb)) m
           where m->>'kind' = 'photo' and m->>'path' is not null limit 1) as photo,
         coalesce((s.extras->>'sample')::boolean, false) as sample
  from public.stories s
  left join public.storytellers st on st.id = s.storyteller_id
  left join public.families f on f.id = s.family_id
  where s.published = true
  order by coalesce((s.extras->>'sample')::boolean, false), s.created_at desc
  limit 200;
$$;
grant execute on function public.community_feed() to anon, authenticated;

-- 2. The sample family, storytellers and stories.
insert into public.families (id, name, created_by) values ('0e0e0e0e-0000-4000-8000-000000000001', '余音示例 · Echoes samples', null) on conflict (id) do nothing;

insert into public.storytellers (id, family_id, name, home, dialect, profile) values ('0e0e0e0e-0000-4000-8000-0000000000a1', '0e0e0e0e-0000-4000-8000-000000000001', '罗奶奶', '江西 吉安', '赣语', '{"name": "罗奶奶", "birth": "1948", "hometown": "江西 吉安", "places": ["吉安", "南昌"], "lang": "zh", "dialects": ["赣语"], "mode": "other"}'::jsonb) on conflict (id) do nothing;
insert into public.storytellers (id, family_id, name, home, dialect, profile) values ('0e0e0e0e-0000-4000-8000-0000000000a2', '0e0e0e0e-0000-4000-8000-000000000001', '陈阿嬷', '福建 泉州', '闽南话', '{"name": "陈阿嬷", "birth": "1956", "hometown": "福建 泉州", "places": ["泉州", "厦门"], "lang": "zh", "dialects": ["闽南话"], "mode": "other"}'::jsonb) on conflict (id) do nothing;
insert into public.storytellers (id, family_id, name, home, dialect, profile) values ('0e0e0e0e-0000-4000-8000-0000000000a3', '0e0e0e0e-0000-4000-8000-000000000001', 'Grandma Ruth', 'Boston', null, '{"name": "Grandma Ruth", "birth": "1944", "hometown": "Boston", "places": ["Gloucester", "Boston"], "lang": "en", "dialects": [], "mode": "other"}'::jsonb) on conflict (id) do nothing;
insert into public.stories (id, family_id, storyteller_id, author_id, title, question, text, terms, topics, people, era, place, lang, published, created_at, extras)
values ('0e0e0e0e-0000-4000-8000-0000000000b1', '0e0e0e0e-0000-4000-8000-000000000001', '0e0e0e0e-0000-4000-8000-0000000000a1', null, '门口那一排腌菜坛子', '小时候家里冬天吃什么？', '{"first": ["我小时候，家门口摆着七八个坛子，大的有我半个人高。每年秋天豆角收了，我妈就把豆角晾在竹竿上，晒软了，再一层一层码进坛子里，撒盐，压上石头。", "我最喜欢的活是揭坛盖。坛口有一圈[坛沿水]，盖子扣下去，用水封着，外面的气就进不去。我妈说水干了菜就坏了，所以每天放学回来，第一件事是去看坛沿里还有没有水。", "冬天没什么菜，就靠这几个坛子。一碗[酸豆角]炒辣椒，一家人能吃一顿饭。现在超市里什么都买得到，可我还是在阳台上放了一个小坛子，就当给自己留个念想。"], "raw": []}'::jsonb, '[{"id": "t0", "word": "坛沿水", "kind": "物件", "note": "坛口一圈盛水的槽，盖上盖子后用水封住坛口，不让空气进去", "status": "ok"}, {"id": "t1", "word": "酸豆角", "kind": "食物", "note": "豆角用盐水腌过、发酵后的咸菜，江西、湖南人家常备", "status": "ok"}]'::jsonb, array['饮食','童年']::text[], array['妈妈']::text[], '1950s', '吉安', 'zh', true, now() - interval '9 days', '{"sample": true, "media": [{"id": "p1", "kind": "photo", "name": "jars.jpg", "path": "/samples/jars.jpg"}]}'::jsonb)
on conflict (id) do nothing;
insert into public.stories (id, family_id, storyteller_id, author_id, title, question, text, terms, topics, people, era, place, lang, published, created_at, extras)
values ('0e0e0e0e-0000-4000-8000-0000000000b2', '0e0e0e0e-0000-4000-8000-000000000001', '0e0e0e0e-0000-4000-8000-0000000000a2', null, '巷口那一声"转来食饭"', '小时候傍晚的巷子是什么样的？', '{"first": ["我们那条巷子很窄，两边都是红砖[厝]。每天傍晚，各家的阿嬷就站到门口喊孩子，一条巷子此起彼伏，都是\"[转来食饭]\"。", "我阿嬷嗓门最大。她喊一声，整条巷子都知道陈家要开饭了。灶上的蒸笼一揭，冒出来的是[碗糕]的味道，甜甜的，米香很重。", "后来我也做了阿嬷，搬进了电梯楼，不用站在门口喊了，发个微信就行。可每次看到孙子跑回来，我还是会想起那条巷子，想起她站在门口挥手的样子。"], "raw": []}'::jsonb, '[{"id": "t0", "word": "厝", "kind": "方言", "note": "闽南话的\"房子\"", "status": "ok"}, {"id": "t1", "word": "转来食饭", "kind": "方言", "note": "闽南话\"回来吃饭\"", "status": "ok"}, {"id": "t2", "word": "碗糕", "kind": "食物", "note": "闽南的米制蒸糕，用碗蒸成，逢年过节常吃", "status": "ok"}]'::jsonb, array['家人','饮食']::text[], array['阿嬷']::text[], '1970s', '泉州', 'zh', true, now() - interval '6 days', '{"sample": true, "media": [{"id": "p1", "kind": "photo", "name": "lane.jpg", "path": "/samples/lane.jpg"}]}'::jsonb)
on conflict (id) do nothing;
insert into public.stories (id, family_id, storyteller_id, author_id, title, question, text, terms, topics, people, era, place, lang, published, created_at, extras)
values ('0e0e0e0e-0000-4000-8000-0000000000b3', '0e0e0e0e-0000-4000-8000-000000000001', '0e0e0e0e-0000-4000-8000-0000000000a3', null, 'The ship above the fireplace', 'What is one thing you would never leave behind?', '{"first": ["There''s a painting of a ship that has hung over every fireplace I''ve ever had. My father painted it in 1952, the winter he came home from his last trip. He said he wanted the boat where he could see it, now that he was never going to sail on it again.", "He fished the [Grand Banks] for eleven years. When I was little I thought the painting was a window, and if I looked long enough I''d see him on the deck. My mother kept a lamp burning on the [widow''s walk] every night he was at sea.", "When my granddaughter asked what I wanted to keep from this house, I didn''t have to think. The kettle and the books can go. The ship comes with me."], "raw": []}'::jsonb, '[{"id": "t0", "word": "Grand Banks", "kind": "place", "note": "Rich fishing grounds off Newfoundland, fished by New England boats for generations", "status": "ok"}, {"id": "t1", "word": "widow''s walk", "kind": "object", "note": "A railed platform on the roof of old coastal houses, where families watched for ships coming home", "status": "ok"}]'::jsonb, array['Family','Work']::text[], array['Father','Mother']::text[], '1950s', 'Gloucester', 'en', true, now() - interval '3 days', '{"sample": true, "media": [{"id": "p1", "kind": "photo", "name": "ship.jpg", "path": "/samples/ship.jpg"}]}'::jsonb)
on conflict (id) do nothing;
