import { createContext, useContext, useState } from 'react';

// UI strings. zh is complete; en covers the same keys so the switch works everywhere.
// Story CONTENT (questions, stories, annotations) is not translated — it follows the storyteller’s language.
const dict = {
  zh: {
    app: 'Echoes',
    nav: { stories: '故事', family: '家人', community: '社区', record: '录一个故事', back: '← 返回', settings: '设置' },
    family: { defaultName: '{s}家', ours: '我们家', private: '私密空间 · 只有被邀请的成员能看到', rename: '改名', code: '邀请码', codeHint: '家人在注册页输入这个码就能加入，不需要链接。', join: '有邀请码？加入已有的家族', joinTitle: '加入家族', joinSub: '输入家人给你的邀请码。加入后你会有自己的账号，能看到家族里所有人的故事。', codePh: '例如 TONG-4821', joinBtn: '加入', badCode: '邀请码不对，再看一眼？', creator: '创建者', member: '成员', memberCan: '所有成员都能：读故事、听原声、确认注释、录自己的故事。创建者可以移除成员和管理付费。' },
    auth: { title: '把长辈的故事，用他自己的声音留下来。', sub: '先建一个账号。之后你可以为一位长辈建档，或者记录自己的故事。', email: '邮箱', pw: '密码', pwHint: '至少 8 位', create: '创建账号', have: '已有账号？', login: '登录' },
    mode: { title: '你想记录谁的故事？', self: '记录我自己的故事', selfSub: '我就是讲述者，自己选问题、自己录。', other: '替家人记录', otherSub: '我帮一位长辈建档、陪他录、替他整理。' },
    profile: {
      titleSelf: '先说说你自己', titleOther: '先说说这位长辈', sub: '这些信息用来挑选合适的问题，也帮助整理故事时理解方言和背景。都可以之后再改。',
      nameSelf: '你的名字 / 称呼', nameOther: '长辈的称呼', relation: '你和他的关系', birth: '出生年份', hometown: '老家', livesIn: '现在住在',
      places: '住过的地方', placesHint: '按时间先后，想到几个写几个', addPlace: '+ 再加一个',
      lang: '主要语言', langHint: '先选一种主要语言，再选方言（可选）', dialect: '方言 / 地方话', dialectHint: '可多选，也可以不选',
      done: '完成', skip: '先跳过', fill: '填入示例', step1: '第 1 步 · 共 2 步', step2: '第 2 步 · 共 2 步', editTitle: '编辑档案', save: '保存', ph: { nameSelf: '童明德', nameOther: '童爷爷', relation: '儿子 / 孙女 / 儿媳', birth: '1936', hometown: '江西 南昌', livesIn: '四川 成都', places: ['江西 南昌', '甘肃 兰州', '四川 成都'], place: '城市 / 地区' }, note: '不收集族裔、宗教等敏感字段。语言和老家足够用来定制问题。',
    },
    home: { empty: '还没有故事。从这一个开始：', pickedFor: '按老家和语言挑的。不合适可以换一个。', start: '开始录这个故事', thisOne: '就聊这个', change: '问题库', about: '大约 5 分钟。也可以', upload: '上传已有的录音', recent: '最近的故事', all: '全部故事', next: '下次可以聊', count: '{n} 个故事', draft: '未完成的草稿', continueDraft: '继续整理', search: '搜索：比如"外婆"、"兰州"、"1960 年代"', none: '没有找到。换个词试试。', filterAll: '全部' },
    pick: { eyebrow: '为 {name} 定制', title: '问题库', sub: '先从具体的小事开始，更容易打开话匣子；想聊大的，往下翻。', all: '全部', own: '+ 自己写一个', ownPh: '例如：您第一次见到奶奶是在什么场合？', use: '用这个问题' },
    rec: { eyebrow: '对 {name} 说', hint: '想到什么说什么，不用有条理。说错了也没关系，之后可以改。', start: '开始录音', stop: '说完了', redo: '重新开始', again: '再录一段', listen: '听一遍', idle: '按一下开始', recording: '录音中 · 说完按一下', done: '已录 {t}', takes: '{n} 段', process: '整理成故事', or: '或者不录音', uploadBtn: '上传录音', type: '用打字回答', changeQ: '换个问题', typePh: '在这里打字……', noMic: '浏览器没有给麦克风权限——先用上传或打字。', demoTake: '演示录音', elderNote: '文案对讲述者说话；字号按"隔着半米能读"设计。协助者在旁边操作，或打电话采访后用"上传录音"。' },
    proc: { title: '正在整理 {name} 的故事', sub: '大约需要一分钟。原始录音已经保存，不会丢。', s1: '把录音转成文字', s2: '整理成通顺的故事，保留说话方式', s3: '找出方言词、历史词和老物件，写上解释' },
    review: { eyebrow: '整理好了 · 请和讲述者一起看一遍', editEyebrow: '编辑故事', raw: '查看原始记录', rawTitle: '原始记录（AI 整理前）', hideRaw: '收起原始记录', edit: '编辑文字', doneEdit: '完成编辑', polish: 'AI 润色全文', polishing: 'AI 正在润色…', undo: '撤销润色', original: '原声', keepHint: '原声永远保留在故事旁边，整理后的文字只是方便阅读。', notes: '注释', notesHint: '帮不懂这个方言或年代的读者看懂。确认后才会出现在故事里。', pending: '待确认', confirm: '对', fix: '改一下', confirmed: '已确认', remove: '删除', addNote: '+ 添加注释', noteWord: '词', noteKind: '类别（方言 / 历史 / 物件…）', noteText: '解释', add: '添加', media: '素材', mediaHint: '录音、照片、视频或一段音乐，和故事存在一起。', photo: '照片', video: '视频', music: '音乐', audio: '录音', draft: '存草稿', draftSaved: '草稿已保存，可以在"故事"页继续', save: '保存故事', saveChanges: '保存修改', markHint: '标黄的词是 AI 的猜测，确认后才会变成正式注释。', meta: { topics: '主题', people: '人物', era: '年代', place: '地点', hint: '用顿号或逗号分隔' } },
    story: { saved: '已保存', nextUp: '接着聊', askNext: '问问这个？', edit: '编辑', share: '分享', invite: '邀请家人来看', publish: '发布到社区', published: '已发布到社区', unpublish: '取消发布', media: '素材', glossary: '点标记的词可以看解释', publishedHint: '发布后其他家庭能在社区看到这个故事的文字和注释；原声只对家人开放。随时可以取消。', all: '← 全部故事' },
    archive: { title: '的档案', sub: '按主题、人物、年代找。每个故事都带着原声。', search: '搜索：比如"外婆"、"兰州"、"1960 年代"', cols: { story: '故事', topic: '主题', people: '人物', when: '年代 · 地点', audio: '原声' } },
    invite: { title: '我们家', sub: '一个家族一个空间。家里每个人用自己的账号登录，都能看到家族里所有人录的故事；外人看不到。', members: '成员', storytellers: '讲述者', you: '你', admin: '管理员', pending: '待接受', inviteTitle: '邀请家人', inviteSub: '通过邮箱发送邀请，或复制链接发给他。被邀请的人会有自己的账号。', contact: '家人的邮箱', contactPh: '例如 aunt.lin@example.com', can: '可以做什么', read: '读和听', correct: '确认 / 纠正注释', add: '添加自己的故事', send: '发送邀请', copy: '复制邀请链接', copied: '已复制', preview: '预览家人看到的页面 →', addStoryteller: '+ 再加一位讲述者', storiesN: '{n} 个故事', remove: '移除' },
    community: { title: '别人家的故事', sub: '家人选择公开的故事会出现在这里。', like: '喜欢', comment: '评论', repost: '转发', reposted: '已转发', write: '写一条评论…', post: '发布', follow: '关注', following: '已关注', lang: '故事语言', topics: '话题', latest: '最新', featured: '本周精选', read: '读全文', readListen: '读全文 · 听原声', stories: '个故事', audioNote: '原声只对家人开放；社区里只展示文字。', noneFilter: '这个筛选下还没有故事。', consentNote: '社区里的所有故事都经讲述者或家人同意公开。看到不合适的内容？', tellUs: '告诉我们', byAuthor: '的公开故事', grid: '网格', list: '列表', you: '你', mine: '我发布的', all: '全部' },
    common: { cancel: '取消', ok: '确定', min: '分钟', guess: '假设' },
  },
  en: {
    app: 'Echoes',
    nav: { stories: 'Stories', family: 'Family', community: 'Community', record: 'Record a story', back: '← Back', settings: 'Settings' },
    family: { defaultName: 'The {s} family', ours: 'Our family', private: 'Private space · visible only to invited members', rename: 'Rename', code: 'Invite code', codeHint: 'Family can enter this code on the sign-up page to join — no link needed.', join: 'Have an invite code? Join a family', joinTitle: 'Join a family', joinSub: 'Enter the code a family member gave you. You get your own account and see every story in the family.', codePh: 'e.g. TONG-4821', joinBtn: 'Join', badCode: 'That code doesn’t match. Check it again?', creator: 'Creator', member: 'Member', memberCan: 'Every member can read, listen, confirm notes and record their own stories. The creator can remove members and manage billing.' },
    auth: { title: 'Keep your elders’ stories, in their own voice.', sub: 'Create an account first. Then set up a profile for an elder, or record your own story.', email: 'Email', pw: 'Password', pwHint: 'At least 8 characters', create: 'Create account', have: 'Already have an account?', login: 'Log in' },
    mode: { title: 'Whose story are you recording?', self: 'My own story', selfSub: 'I am the storyteller — I pick the questions and record.', other: 'For a family member', otherSub: 'I set up a profile for an elder, sit with them, and tidy up the stories.' },
    profile: {
      titleSelf: 'Tell us about yourself', titleOther: 'Tell us about them', sub: 'Used to pick fitting questions and to understand dialect and background when tidying stories. Everything can be changed later.',
      nameSelf: 'Your name', nameOther: 'What you call them', relation: 'Your relationship', birth: 'Year of birth', hometown: 'Hometown', livesIn: 'Lives in',
      places: 'Places lived', placesHint: 'In order, as many as you like', addPlace: '+ Add another',
      lang: 'Main language', langHint: 'Pick one main language first, then a dialect (optional)', dialect: 'Dialect', dialectHint: 'Optional, multiple allowed',
      done: 'Done', skip: 'Skip for now', fill: 'Fill with sample', step1: 'Step 1 of 2', step2: 'Step 2 of 2', editTitle: 'Edit profile', save: 'Save', ph: { nameSelf: 'Mingde Tong', nameOther: 'Grandpa Tong', relation: 'son / granddaughter / daughter-in-law', birth: '1936', hometown: 'Nanchang, Jiangxi', livesIn: 'Chengdu, Sichuan', places: ['Nanchang', 'Lanzhou', 'Chengdu'], place: 'City / region' }, note: 'No sensitive fields (ethnicity, religion…). Language and hometown are enough to tailor questions.',
    },
    home: { empty: 'No stories yet. Start with this one:', pickedFor: 'Picked by hometown and language. Swap it if it doesn’t fit.', start: 'Record this story', thisOne: 'Talk about this one', change: 'Question bank', about: 'About 5 minutes. Or', upload: 'upload a recording', recent: 'Recent stories', all: 'All stories', next: 'Next time', count: '{n} stories', draft: 'Unfinished draft', continueDraft: 'Continue', search: 'Search: “grandma”, “Lanzhou”, “1960s”', none: 'Nothing found. Try another word.', filterAll: 'All' },
    pick: { eyebrow: 'Tailored for {name}', title: 'Question bank', sub: 'Small, concrete things open people up. The big questions are further down.', all: 'All', own: '+ Write your own', ownPh: 'e.g. When did you first meet grandma?', use: 'Use this question' },
    rec: { eyebrow: 'Ask {name}', hint: 'Say whatever comes to mind. It doesn’t need to be tidy — it can be fixed later.', start: 'Start recording', stop: 'Done talking', redo: 'Start over', again: 'Add another take', listen: 'Listen back', idle: 'Tap to start', recording: 'Recording · tap when done', done: 'Recorded {t}', takes: '{n} takes', process: 'Turn into a story', or: 'or, without recording', uploadBtn: 'Upload a recording', type: 'Type instead', changeQ: 'Change question', typePh: 'Type here…', noMic: 'No microphone permission — use upload or typing for now.', demoTake: 'Demo take', elderNote: 'Copy speaks to the storyteller; type is sized to be read from half a metre away. The helper operates, or uploads a phone interview.' },
    proc: { title: 'Tidying {name}’s story', sub: 'About a minute. The original recording is already saved.', s1: 'Transcribe the recording', s2: 'Tidy into a readable story, keeping their voice', s3: 'Find dialect words, historical terms and objects; add notes' },
    review: { eyebrow: 'Ready · read it together with the storyteller', editEyebrow: 'Edit story', raw: 'Show original transcript', rawTitle: 'Original transcript (before AI tidy-up)', hideRaw: 'Hide transcript', edit: 'Edit text', doneEdit: 'Done editing', polish: 'Polish with AI', polishing: 'Polishing…', undo: 'Undo polish', original: 'Original audio', keepHint: 'The original recording always stays with the story; the text is for reading.', notes: 'Notes', notesHint: 'For readers who don’t share this dialect or era. A note appears in the story once confirmed.', pending: 'Pending', confirm: 'Correct', fix: 'Fix', confirmed: 'Confirmed', remove: 'Remove', addNote: '+ Add a note', noteWord: 'Word', noteKind: 'Kind (dialect / history / object…)', noteText: 'Explanation', add: 'Add', media: 'Media', mediaHint: 'Audio, photos, video or music, kept with the story.', photo: 'Photo', video: 'Video', music: 'Music', audio: 'Audio', draft: 'Save draft', draftSaved: 'Draft saved — continue from the Stories page', save: 'Save story', saveChanges: 'Save changes', markHint: 'Highlighted words are AI guesses. They become notes once confirmed.', meta: { topics: 'Topics', people: 'People', era: 'Era', place: 'Place', hint: 'Separate with commas' } },
    story: { saved: 'Saved', nextUp: 'Keep going', askNext: 'Ask this?', edit: 'Edit', share: 'Share', invite: 'Invite family', publish: 'Publish to community', published: 'Published', unpublish: 'Unpublish', media: 'Media', glossary: 'Tap a marked word for its note', publishedHint: 'Other families can read the text and notes in the community; audio stays family-only. Undo any time.', all: '← All stories' },
    archive: { title: "'s archive", sub: 'Find by topic, person or era. Every story keeps its original audio.', search: 'Search: “grandma”, “Lanzhou”, “1960s”', cols: { story: 'Story', topic: 'Topic', people: 'People', when: 'Era · Place', audio: 'Audio' } },
    invite: { title: 'Our family', sub: 'One space per family. Everyone signs in with their own account and sees every story anyone in the family recorded; nobody outside does.', members: 'Members', storytellers: 'Storytellers', you: 'You', admin: 'Admin', pending: 'Pending', inviteTitle: 'Invite family', inviteSub: 'Send an invitation by email, or copy the link. Invitees get their own account.', contact: 'Family member’s email', contactPh: 'e.g. aunt.lin@example.com', can: 'They can', read: 'Read & listen', correct: 'Confirm / fix notes', add: 'Add their own stories', send: 'Send invite', copy: 'Copy invite link', copied: 'Copied', preview: 'Preview what they see →', addStoryteller: '+ Add a storyteller', storiesN: '{n} stories', remove: 'Remove' },
    community: { title: 'Stories from other families', sub: 'Stories families chose to share appear here.', like: 'Like', comment: 'Comment', repost: 'Repost', reposted: 'Reposted', write: 'Write a comment…', post: 'Post', follow: 'Follow', following: 'Following', lang: 'Story language', topics: 'Topics', latest: 'Latest', featured: 'Featured this week', read: 'Read', readListen: 'Read · listen', stories: 'stories', audioNote: 'Audio is family-only; the community sees text.', noneFilter: 'No stories under this filter yet.', consentNote: 'Every story here was published with the storyteller’s or family’s consent. See something wrong?', tellUs: 'Tell us', byAuthor: '’s public stories', grid: 'Grid', list: 'List', you: 'You', mine: 'Published by me', all: 'All' },
    common: { cancel: 'Cancel', ok: 'OK', min: 'min', guess: 'Assumption' },
  },
};

const Ctx = createContext(null);
export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => (navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  const t = (path, vars = {}) => {
    const v = path.split('.').reduce((o, k) => (o ? o[k] : undefined), dict[lang]) ?? path;
    return typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v;
  };
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);

export const LANGUAGES = [
  { code: 'zh', label: '中文' }, { code: 'en', label: 'English' },
];
export const DIALECTS = {
  zh: ['粤语', '潮汕话', '闽南话', '客家话', '上海话', '苏州话', '南昌话', '四川话', '兰州话', '东北话', '其他'],
  en: ['Cantonese-English', 'Singlish', 'Irish', 'Scottish', 'Australian', 'Other'],
};
