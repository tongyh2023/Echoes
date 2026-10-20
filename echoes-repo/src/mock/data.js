// ------------------------------------------------------------
// MOCK DATA + MOCK AI
// Everything the backend will eventually own lives here, so the
// integration surface is one folder. See HANDOFF.md for the API shape.
// ------------------------------------------------------------

export { QUESTIONS, CATEGORIES, CHAPTERS } from './questions';
import { QUESTIONS } from './questions';

// Sample data. Used only (a) by the single-file preview with no database and (b) by
// Settings → “Import sample stories”, which writes these into the real database flagged demo=true.
export const DEFAULT_PROFILE = {
  mode: 'other', // 'self' | 'other'
  name: '童爷爷', nameEn: 'Grandpa Tong', relation: '儿子', relationEn: 'son', birth: '1936', hometown: '江西 南昌', hometownEn: 'Nanchang, Jiangxi', livesIn: '四川 成都', livesInEn: 'Chengdu, Sichuan',
  places: ['江西 南昌', '甘肃 兰州', '四川 成都'], placesEn: ['Nanchang', 'Lanzhou', 'Chengdu'],
  lang: 'zh', dialects: ['兰州话'], uiLang: 'zh',
};

// A finished story used for the home / archive / community mocks.
export const SEED_STORIES = [
  {
    id: 's1', title: '过年早上的年糕', titleEn: 'New Year morning rice cake', questionId: 'q6', date: '2026-10-05', duration: '4:12',
    topics: ['童年', '饮食'], topicsEn: ['Childhood', 'Food'], people: ['母亲', '外婆', '父亲'], peopleEn: ['Mother', 'Grandmother', 'Father'], era: '1940s', place: '南昌', placeEn: 'Nanchang', published: false,
    terms: [
      { id: 't1', word: '年糕', wordEn: 'rice cake', kind: '食物', kindEn: 'Food', note: '南昌一带过年吃的米制糕，寓意"年年高"。', noteEn: 'Nanchang New Year rice cake — a pun on “rising higher every year”.', status: 'ok' },
      { id: 't2', word: '粮票', wordEn: 'ration coupons', kind: '历史', kindEn: 'History', note: '1955–1993 年间中国凭票购粮的凭证。', noteEn: 'Grain ration coupons used in China, 1955–1993.', status: 'ok' },
      { id: 't3', word: '咋价', wordEn: 'zǎ jià', kind: '兰州话', kindEn: 'Lanzhou dialect', note: '"怎么"的意思。', noteEn: 'Means “how come”.', status: 'ok' },
    ],
    textEn: ['When I was small in Nanchang, we always had [rice cake] on New Year morning. It was not like now — you needed [ration coupons] for everything, and my mother would start saving two weeks early.', 'She was up steaming before dawn, using a wooden steamer that came down from my grandmother. We children crowded round the stove, and nobody touched a chopstick until Father had bowed to the ancestors.', 'Later I went to teach in Lanzhou. My students asked what we ate at New Year; I said rice cake, and they laughed — “[zǎ jià] still eating that?” That was the first year I was not home for New Year.'],
    text: {
      first: ['我小时候在南昌，过年第一天早上是一定要吃[年糕]的。那时候不像现在，东西要凭[粮票]买，我母亲会提前半个月开始攒。', '天还没亮她就起来蒸，用的是外婆传下来的一口木甑。我们几个小孩围在灶边，谁也不许先动筷子，要等父亲先拜过祖先。', '后来我到兰州教书，学生问我过年吃什么，我说年糕，他们笑我"[咋价]还吃这个"。那一年是我第一次没有在家过年。'],
      third: ['童爷爷小时候在南昌，过年第一天早上是一定要吃[年糕]的。那时候不像现在，东西要凭[粮票]买，他的母亲会提前半个月开始攒。', '天还没亮她就起来蒸，用的是外婆传下来的一口木甑。几个小孩围在灶边，谁也不许先动筷子，要等父亲先拜过祖先。', '后来他到兰州教书，学生问他过年吃什么，他说年糕，他们笑他"[咋价]还吃这个"。那一年是他第一次没有在家过年。'],
      raw: ['呃……过年，过年第一天早上啊，那肯定是吃[年糕]嘛。我们南昌人。那时候哪有现在这么多东西，要[粮票]的，我妈她提前——提前半个月吧，就开始攒……天没亮就起来蒸，那个甑子是我外婆的……小孩不能先吃，要等我父亲拜了祖先……后来我去兰州，学生问我，我说年糕，他们说"[咋价]还吃这个"，哈哈。那一年我头一回没在家过年。'],
    },
    media: [],
  },
  { id: 's2', title: '第一年在兰州教书', titleEn: 'First year teaching in Lanzhou', questionId: 'q16', date: '2026-09-28', duration: '7:40', topics: ['工作'], topicsEn: ['Work'], people: ['学生们'], peopleEn: ['Students'], era: '1960s', place: '兰州', placeEn: 'Lanzhou', published: true, terms: [{ id: 't4', word: '单位', wordEn: 'danwei', kind: '历史', kindEn: 'History', note: '计划经济时期对工作机构的统称，也是身份与福利的来源。', noteEn: 'The “work unit” of the planned-economy era — your employer, identity and welfare in one.', status: 'pending' }], textEn: ['In the autumn of 1961 I reported to Lanzhou after two days and two nights on the train. The students were barely younger than me; in my first class I snapped three pieces of chalk from nerves…'], text: { first: ['一九六一年秋天我到兰州报到，火车坐了两天两夜……'], third: ['一九六一年秋天他到兰州报到……'], raw: ['六一年，秋天，我到兰州……'] }, media: [] },
  { id: 's3', title: '父亲的那只手表', titleEn: 'My father’s watch', questionId: 'q25', date: '2026-09-21', duration: '2:55', topics: ['物件', '家人'], topicsEn: ['Objects', 'Family'], people: ['父亲'], peopleEn: ['Father'], era: '1950s', place: '南昌', placeEn: 'Nanchang', published: false, terms: [], textEn: ['It was a Shanghai-brand watch. My father wore it to the very end…'], text: { first: ['那只表是上海牌的，我父亲一直戴到最后……'], third: ['那只表是上海牌的，他父亲一直戴到最后……'], raw: ['那个表，上海牌……'] }, media: [] },
];

export const COMMUNITY_POSTS = [
  { id: 'c1', image: photoZh, storyId: 's2', author: '童爷爷', authorEn: 'Grandpa Tong', authorSub: '南昌 → 兰州 → 成都 · 1936', authorSubEn: 'Nanchang → Lanzhou → Chengdu · 1936', title: '第一年在兰州教书', titleEn: 'First year teaching in Lanzhou', excerptEn: 'In the autumn of 1961 I reported to Lanzhou after two days and two nights on the train. The students were barely younger than me; in my first class I snapped three pieces of chalk…', bodyEn: ['In the autumn of 1961 I reported to Lanzhou after two days and two nights on the train. The students were barely younger than me; in my first class I snapped three pieces of chalk from nerves.', 'The school sat by the Yellow River. Winter wind tore the paper windows three times a year; students took turns bringing firewood, and whoever brought most sat by the stove.', 'I taught physics. One student went on to Jiuquan. Decades later a photo came in the post. On the back: “Teacher — the rocket went up.”'], placeEn: 'Lanzhou', topicsEn: ['Work', 'Migration'], excerpt: '一九六一年秋天我到兰州报到，火车坐了两天两夜。学生比我小不了几岁，第一堂课我紧张得把粉笔捏断了三根……', body: ['一九六一年秋天我到兰州报到，火车坐了两天两夜。学生比我小不了几岁，第一堂课我紧张得把粉笔捏断了三根。', '那时候学校在黄河边上，冬天风大，教室的窗户纸一年要换三次。学生们轮流带柴火来，谁带得多谁坐火炉边。', '我教的是物理。有个学生后来去了酒泉，几十年后寄来一张照片，背面写着"老师，火箭上去了"。'], lang: 'zh', topics: ['工作', '迁徙'], era: '1960s', place: '兰州', date: '2026-09-28', readMin: 4, likes: 23, comments: [{ who: '林姑姑', text: '我爸也是那年去的西北，看哭了。' }], reposts: 4, cover: 'warm' },
  { id: 'c4', image: coverC4, author: '阿嬷', authorEn: 'Ah Ma', authorSub: '潮州 · 1941', authorSubEn: 'Chaozhou · 1941', title: '食未', titleEn: '“Have you eaten?”', excerptEn: '“Sik bue” isn’t really asking whether you’ve eaten. It means: I see you, you’re back. My mother said it every day. Now I do too…', bodyEn: ['“Sik bue” isn’t really asking whether you’ve eaten. It means: I see you, you’re back. My mother said it every day. Now I do too.', 'We were poor then; truly asking would have been awkward. So the words slid into another meaning — like “hello”, but closer than hello.', 'My granddaughter is in Toronto. On video calls I still say it first. She barely understands Teochew, but this one she can answer: “Eaten.”'], placeEn: 'Chaozhou', topicsEn: ['Dialect', 'Family'], excerpt: '"食未"不是问你吃没吃，是说我看见你了，你回来了。我妈每天说，我现在也每天说……', body: ['"食未"不是问你吃没吃，是说我看见你了，你回来了。我妈每天说，我现在也每天说。', '以前家里穷，真问吃没吃是会难堪的。所以这句话慢慢变成了另一个意思，像是"你好"，又比"你好"亲。', '我孙女在多伦多，视频的时候我还是先说这句。她听不太懂潮州话，但这句她会答："食了。"'], lang: 'zh', topics: ['方言', '家人'], era: '1950s', place: '潮州', date: '2026-10-02', readMin: 3, likes: 97, comments: [{ who: 'Helen', text: '我奶奶也这么说！' }, { who: '小周', text: '潮汕人泪目' }], reposts: 19, cover: 'rose', featured: true },
  { id: 'c3', image: photoEn, author: 'Maeve Byrne', authorSub: 'Cork → Boston · 1938', topicsEn: ['Migration', 'Family'], title: 'The boat that took three weeks', excerpt: 'My mother packed two loaves of soda bread and a photograph. By the second week the bread was gone and the photograph was all we had left of home…', body: ['My mother packed two loaves of soda bread and a photograph. By the second week the bread was gone and the photograph was all we had left of home.', 'There was a céilí on the lower deck every Saturday. A man from Kerry had a fiddle, and for an hour nobody was emigrating — we were just dancing.', 'When we docked in Boston my father said, “Well, Maeve, we’re Yanks now.” I was fourteen. I did not feel like a Yank for another thirty years.'], lang: 'en', topics: ['Migration', 'Family'], era: '1950s', place: 'Cork', date: '2026-09-30', readMin: 5, likes: 41, comments: [{ who: 'Siobhán', text: 'My grandmother made the same crossing in ’52.' }], reposts: 7, cover: 'blue' },
  { id: 'c2', image: coverC2, author: '外婆的腌菜坛子', authorEn: 'Grandma’s pickle jars', authorSub: '湖南 · 1944', authorSubEn: 'Hunan · 1944', title: '坛子边的夏天', titleEn: 'Summers by the jars', excerptEn: 'Every June Grandma gave the whole kitchen over to those jars. Our job as children was to fetch well water — cold water, dry hands…', bodyEn: ['Every June Grandma gave the whole kitchen over to those jars. Our job as children was to fetch well water — cold water, dry hands.', 'The rim had to stay filled with water; that was the rule. Forget once and the jar “bloomed”, and that year’s pickled beans were lost.', 'The jars are still there. Every June my mother washes them, but she no longer pickles. Empty, she says, is also a kind of remembering.'], placeEn: 'Hunan', topicsEn: ['Food', 'Family'], excerpt: '每年六月，外婆会把整个厨房让给那几口坛子。我们小孩的任务是去井边打水，水要凉，手要干……', body: ['每年六月，外婆会把整个厨房让给那几口坛子。我们小孩的任务是去井边打水，水要凉，手要干。', '坛沿要一直有水，这是规矩。谁忘了添水，坛子"生花"了，那一年的酸豆角就都不能吃。', '外婆走后那几口坛子还在。我妈每年六月还是会洗一遍，但不再腌了。她说坛子空着，也算是一种纪念。'], lang: 'zh', topics: ['饮食', '家人'], era: '1950s', place: '湖南', date: '2026-09-21', readMin: 3, likes: 58, comments: [], reposts: 11, cover: 'green' },
  { id: 'c7', image: coverC7, author: '周爷爷', authorEn: 'Grandpa Zhou', authorSub: '成都 · 1939', authorSubEn: 'Chengdu · 1939', title: '茶馆里的龙门阵', titleEn: 'Tall tales at the teahouse', excerptEn: 'Teahouses back then weren’t for drinking tea; they were for telling stories. A lidded bowl cost a mao and you could sit all day…', bodyEn: ['Teahouses back then weren’t for drinking tea; they were for telling stories. A lidded bowl cost a mao and you could sit all day.', 'The tea master carried a long-spouted copper kettle and could fill your bowl from two tables away without a drop spilled. We kids went just to watch that.', 'The teahouses are still there, the kettles too. But the stories now are all about things on phones.'], placeEn: 'Chengdu', topicsEn: ['Dialect', 'Street life'], excerpt: '那时候的茶馆不是喝茶的地方，是摆龙门阵的地方。一碗盖碗茶一毛钱，可以坐一整天……', body: ['那时候的茶馆不是喝茶的地方，是摆龙门阵的地方。一碗盖碗茶一毛钱，可以坐一整天。', '掺茶的师傅拎着长嘴铜壶，隔着两张桌子就能把水倒进碗里，一滴不洒。我们小孩专门去看这个。', '现在的茶馆还在，铜壶也还在，但龙门阵摆的都是手机里的事了。'], lang: 'zh', topics: ['方言', '市井'], era: '1950s', place: '成都', date: '2026-09-05', readMin: 3, likes: 44, comments: [{ who: '幺妹', text: '龙门阵三个字一出来就回去了' }], reposts: 8, cover: 'sage' },
];

// Sample stories used on the landing page (hero widget + "a real example"). One per language so the page never shows only Chinese.
import photoZh from '../assets/photo_zh.jpg';
import photoEn from '../assets/photo_en.jpg';
import coverC2 from '../assets/cover_c2.jpg';
import coverC4 from '../assets/cover_c4.jpg';
import coverC6 from '../assets/cover_c6.jpg';
import coverC7 from '../assets/cover_c7.jpg';
export const SAMPLE_STORIES = [
  { id: 'zh', lang: 'zh', photo: photoZh, short: '童爷爷', shortEn: 'Grandpa Tong', name: '童爷爷', nameEn: 'Grandpa Tong', birth: 1936, place: '南昌', placeEn: 'Nanchang', route: '南昌 → 兰州 → 成都', routeEn: 'Nanchang → Lanzhou → Chengdu', dialect: '兰州话', dialectEn: 'Lanzhou dialect', title: '过年早上的年糕', titleEn: 'New Year morning rice cake', duration: '4:12', recordedBy: '他的儿子在成都用笔记本录的', recordedByEn: 'Recorded by his son on a laptop in Chengdu', photoCaption: '成都 · 2026', photoCaptionEn: 'Chengdu · 2026',
    paragraphs: [['我小时候在南昌，过年第一天早上是一定要吃', ['年糕', 'ok'], '的。那时候不像现在，东西要凭', ['粮票', 'pending'], '买，我母亲会提前半个月开始攒。'], ['天还没亮她就起来蒸，用的是外婆传下来的一口木甑。我们几个小孩围在灶边，谁也不许先动筷子，要等父亲先拜过祖先。'], ['后来我到兰州教书，学生问我过年吃什么，我说年糕，他们笑我"', ['咋价', 'ok'], '还吃这个"。那一年是我第一次没有在家过年。']],
    terms: [{ word: '年糕', kind: '食物', kindEn: 'Food', note: '南昌过年的米糕，寓意"年年高"', noteEn: 'Nanchang New Year rice cake; a pun on “rising higher every year”' }, { word: '粮票', kind: '历史', kindEn: 'History', note: '1955–1993 凭票购粮的凭证', noteEn: 'Grain ration coupons, 1955–1993' }, { word: '咋价', kind: '兰州话', kindEn: 'Lanzhou dialect', note: '"怎么"的意思', noteEn: 'Means “how come”' }] },
  { id: 'en', lang: 'en', photo: photoEn, short: 'Maeve', shortEn: 'Maeve', name: 'Maeve Byrne', nameEn: 'Maeve Byrne', birth: 1938, place: 'Cork', placeEn: 'Cork', route: 'Cork → Boston', routeEn: 'Cork → Boston', dialect: 'Hiberno-English', dialectEn: 'Hiberno-English', title: '三个星期的船', titleEn: 'The boat that took three weeks', duration: '5:40', recordedBy: '她的孙女在波士顿用手机录的', recordedByEn: 'Recorded by her granddaughter on a phone in Boston', photoCaption: 'Boston · 2026', photoCaptionEn: 'Boston · 2026',
    paragraphs: [['My mother packed two loaves of ', ['soda bread', 'ok'], ' and a photograph. By the second week the bread was gone and the photograph was all we had left of home.'], ['There was a ', ['céilí', 'pending'], ' on the lower deck every Saturday. A man from Kerry had a fiddle, and for an hour nobody was emigrating — we were just dancing.'], ['When we docked in Boston my father said, “Well, Maeve, we’re ', ['Yanks', 'ok'], ' now.” I was fourteen. I did not feel like a Yank for another thirty years.']],
    terms: [{ word: 'soda bread', kind: 'Food', kindEn: 'Food', note: '用小苏打代替酵母的爱尔兰面包，耐放', noteEn: 'Irish bread leavened with baking soda; keeps for days' }, { word: 'céilí', kind: 'Irish', kindEn: 'Irish', note: '有现场音乐的集体舞会', noteEn: 'A social gathering with live music and set dancing' }, { word: 'Yanks', kind: 'Slang', kindEn: 'Slang', note: '爱尔兰人对移民美国者的称呼', noteEn: 'What Irish people called those who had gone to America' }] },
];

// ---------------- MOCK AI ----------------
// → Replace with real calls (see HANDOFF.md). Each returns a Promise so swapping is one line.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Small cultural-term dictionary used by the mock annotator. Production: LLM output.
const TERM_DICT = [
  { word: '年糕', kind: '食物', note: '南昌一带过年吃的米制糕，寓意"年年高"。' },
  { word: '粮票', kind: '历史', note: '1955–1993 年间中国凭票购粮的凭证。' },
  { word: '咋价', kind: '兰州话', note: '"怎么"的意思。' },
  { word: '冬至', kind: '节日', note: '二十四节气之一，北方有"冬至吃饺子"的习俗。' },
  { word: '饺子', kind: '食物', note: '北方节日主食；南昌人过年更常吃年糕，冬至吃饺子多见于北方家庭。' },
  { word: '单位', kind: '历史', note: '计划经济时期对工作机构的统称，也是身份与福利的来源。' },
  { word: '食未', kind: '潮汕话', note: '"吃了吗"，潮汕人打招呼的方式。' },
  { word: '木甑', kind: '物件', note: '蒸饭用的木制炊具，南方农村常见。' },
];
function annotate(paragraphs) {
  const found = [];
  const out = paragraphs.map((p) => {
    let t = p;
    TERM_DICT.forEach((d) => { if (t.includes(d.word) && !t.includes('[' + d.word + ']')) { t = t.replace(d.word, '[' + d.word + ']'); if (!found.some((f) => f.word === d.word)) found.push({ id: 't-' + d.word, ...d, status: 'pending' }); } });
    return t;
  });
  return { paragraphs: out, terms: found };
}

// Real pipeline when there is a real recording: POST it to /api/tidy (Vercel function → Whisper → GPT).
// Falls back to the sample story only when there is no audio (demo take) or the function is unavailable (local file preview).
async function tidyForReal({ audioBlob, question, profile, lang }) {
  const b64 = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(audioBlob); });
  const r = await fetch('/api/tidy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio: b64, mime: audioBlob.type || 'audio/webm', question, profile: { name: profile?.name, hometown: profile?.hometown, birth: profile?.birth, places: profile?.places, dialects: profile?.dialects, lang: profile?.lang }, lang }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || ('HTTP ' + r.status)); }
  return r.json();
}

export async function transcribeAndTidy({ audioBlob, typedText, question, profile, simulateFail, lang = 'zh', allowSample = true }) {
  if (audioBlob instanceof Blob && audioBlob.size > 0 && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    return tidyForReal({ audioBlob, question, profile, lang });   // errors surface on the Processing screen with a retry
  }
  await wait(1200);
  if (simulateFail) throw new Error('mock failure'); // type 失败 as the answer to see the error state
  // In production: STT(audioBlob) → LLM(transcript, profile, question) → { title, text, terms, topics, people, era, place }
  const q = QUESTIONS.find((x) => question && question.startsWith(x.text.split('{')[0].slice(0, 6)));
  if (typedText) {
    const paras = typedText.split(/\n+/).filter(Boolean);
    const a = annotate(paras);
    return {
      title: typedText.replace(/[，。！？,.!?].*$/, '').slice(0, 14),
      text: { first: a.paragraphs, third: a.paragraphs.map((p) => p.replace(/我们/g, '他们').replace(/我/g, '他')), raw: paras },
      terms: a.terms, topics: q ? q.tags : ['故事'], people: [], era: profile.birth ? (Math.floor(+profile.birth / 10) * 10 + 10) + 's' : '', place: (profile.hometown || '').split(' ').pop(),
    };
  }
  if (!allowSample) throw new Error(lang === 'zh' ? '没有录到声音。回到录音页再录一次。' : 'Nothing was recorded. Go back and record again.');
  const base = SEED_STORIES[0];
  if (lang === 'en') {   // demo only: English interface gets the English sample so the walkthrough stays in one language
    return { title: base.titleEn, text: { first: base.textEn, raw: base.textEn.map((x) => x.replace(/[\[\]]/g, '')) }, terms: base.terms.map((t) => ({ ...t, word: t.wordEn, kind: t.kindEn, note: t.noteEn, status: 'pending' })), topics: base.topicsEn, people: base.peopleEn, era: base.era, place: base.placeEn };
  }
  return { title: base.title, text: base.text, terms: base.terms.map((t) => ({ ...t, status: 'pending' })), topics: base.topics, people: base.people, era: base.era, place: profile.hometown.split(' ').pop() };
}

export async function polishParagraph(paragraph, style = 'narrative') {
  await wait(900);
  const styles = {
    narrative: (p) => p.replace(/。$/, '——那是我记忆里最早的一个新年。'),
    letter: (p) => '孩子们，' + p.replace(/^我/, '我想告诉你们，我'),
    oral: (p) => p.replace(/，/g, '，…… '),
  };
  return (styles[style] || styles.narrative)(paragraph);
}

export async function suggestNextQuestion(story, profile) {
  await wait(300);
  if (story?.text?.first?.join('').includes('外婆')) return { id: 'nx1', text: '木甑是从外婆那里来的——说说外婆吧？', tags: ['家人'] };
  return QUESTIONS[5];
}
