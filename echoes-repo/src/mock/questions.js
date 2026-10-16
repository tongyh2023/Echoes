// Question bank, rewritten to sound like something a grandchild would actually ask at the dinner table.
// Rules: one concrete thing per question; a time, a place or an object to hang the memory on; {home} is filled from the profile.
// Grouped by chapters of a life, not by abstract category. Families edit any wording or write their own (see store.customQuestions).

export const CHAPTERS = [
  { id: 'childhood', label: '童年和老家', labelEn: 'Childhood & home' },
  { id: 'food', label: '吃的', labelEn: 'Food' },
  { id: 'festival', label: '年节', labelEn: 'Festivals' },
  { id: 'school', label: '上学和第一份工作', labelEn: 'School & first job' },
  { id: 'family', label: '成家', labelEn: 'Marriage & family' },
  { id: 'object', label: '老物件和照片', labelEn: 'Objects & photos' },
  { id: 'dialect', label: '方言和口头禅', labelEn: 'Dialect & sayings' },
  { id: 'reflect', label: '回头看', labelEn: 'Looking back' },
];

export const QUESTIONS = [
  // 童年和老家
  { id: 'q1', cat: 'childhood', text: '您小时候住的那个院子（或那条街）是什么样的？早上一睁眼先听到什么声音？', textEn: 'What did the courtyard or street you grew up on look like? What was the first sound you heard in the morning?' },
  { id: 'q2', cat: 'childhood', text: '小时候晚上家里点什么灯？什么时候第一次用上电？', textEn: 'What kind of lamp lit your home at night when you were small? When did electricity first arrive?' },
  { id: 'q3', cat: 'childhood', text: '您小时候最怕谁？最喜欢往谁家跑？', textEn: 'Who were you most afraid of as a child — and whose house did you always run to?' },
  { id: 'q4', cat: 'childhood', text: '{home}有什么东西，是您离开以后再也没见到、再也没吃到过的？', textEn: 'What is something from {home} you have never seen or tasted again since you left?' },
  { id: 'q5', cat: 'childhood', text: '您有几个兄弟姐妹？小时候谁最会惹事，谁最会哄大人？', textEn: 'How many brothers and sisters did you have? Who got into the most trouble, and who could always sweet-talk the grown-ups?' },
  // 吃的
  { id: 'q6', cat: 'food', text: '您小时候在{home}，过年第一天早上家里吃什么？是谁做的？', textEn: 'When you were a child in {home}, what did your family eat on the first morning of the New Year? Who made it?' },
  { id: 'q7', cat: 'food', text: '家里以前是用什么烧饭的？柴、煤还是煤油炉？烧饭是谁的活？', textEn: 'What did your family cook on — wood, coal, a kerosene stove? Whose job was cooking?' },
  { id: 'q8', cat: 'food', text: '有没有一道菜，您妈妈做的味道，您后来一直没能做出来？', textEn: 'Is there a dish your mother made whose taste you have never managed to recreate?' },
  { id: 'q9', cat: 'food', text: '您记得第一次吃到什么"稀罕东西"是什么时候？糖、橘子、还是别的？', textEn: 'Do you remember the first time you tasted something rare — sweets, an orange, something else?' },
  // 年节
  { id: 'q10', cat: 'festival', text: '过年前家里要忙些什么？您小时候分到什么活？', textEn: 'What did the house have to get done before New Year? What chores were you given as a child?' },
  { id: 'q11', cat: 'festival', text: '小时候大人哄您睡觉唱什么？还能唱两句吗？', textEn: 'What did the grown-ups sing to get you to sleep? Can you still sing a line or two?' },
  { id: 'q12', cat: 'festival', text: '您老家过中秋（或端午、清明）有什么别处没有的规矩？', textEn: 'Did your hometown have a Mid-Autumn (or Duanwu, or Qingming) custom that other places didn’t?' },
  { id: 'q13', cat: 'festival', text: '您印象最深的一次过年是哪一年？那年为什么特别？', textEn: 'Which New Year do you remember most clearly? What made that year different?' },
  // 上学和第一份工作
  { id: 'q14', cat: 'school', text: '您上学要走多远？路上和谁一起？', textEn: 'How far did you walk to school, and who did you walk with?' },
  { id: 'q15', cat: 'school', text: '有没有一位老师，您到现在还记得他说过的某句话？', textEn: 'Is there a teacher whose exact words you can still hear today?' },
  { id: 'q16', cat: 'school', text: '您第一份工作是干什么的？第一个月的工资拿到手，花在哪儿了？', textEn: 'What was your first job? When you got your first month’s pay, what did you spend it on?' },
  { id: 'q17', cat: 'school', text: '您是怎么到{home}以外的地方去的？第一次离家坐的是什么车？', textEn: 'How did you first leave {home}? What did you travel on, the first time away from home?' },
  // 成家
  { id: 'q18', cat: 'family', text: '您和老伴是怎么认识的？第一次见面说了什么？', textEn: 'How did you and your spouse meet? What was said the first time?' },
  { id: 'q19', cat: 'family', text: '你们结婚那天是什么样的？办了几桌，穿的什么？', textEn: 'What was your wedding day like — how many tables, what did you wear?' },
  { id: 'q20', cat: 'family', text: '第一个孩子出生那天，您在哪儿？记得当时想的什么吗？', textEn: 'Where were you the day your first child was born? Do you remember what went through your mind?' },
  { id: 'q21', cat: 'family', text: '您父亲平时在家是什么样的人？有没有一件事，您到现在还记得他当时说的话？', textEn: 'What was your father like at home? Is there one moment where you still remember exactly what he said?' },
  { id: 'q22', cat: 'family', text: '您妈妈有什么本事，是您觉得谁也比不上的？', textEn: 'What was one thing your mother could do that nobody else could match?' },
  // 老物件和照片
  { id: 'q23', cat: 'object', text: '家里有没有一件用了几十年、怎么也舍不得扔的东西？是怎么来的？', textEn: 'Is there one thing at home you have used for decades and could never throw away? Where did it come from?' },
  { id: 'q24', cat: 'object', text: '您家最早的一张照片是什么时候拍的？照片里的人现在都还记得吗？', textEn: 'When was the oldest photo in your family taken? Do you still remember everyone in it?' },
  { id: 'q25', cat: 'object', text: '您这辈子第一件"大件"是什么——手表、自行车、收音机？攒了多久？', textEn: 'What was the first big thing you ever bought — a watch, a bicycle, a radio? How long did you save for it?' },
  // 方言和口头禅
  { id: 'q26', cat: 'dialect', text: '说一句只有{home}人才懂的话——骂人的、疼人的、吓唬小孩的都行。', textEn: 'Say something only people from {home} would understand — a scolding, a term of endearment, a way to frighten children.' },
  { id: 'q27', cat: 'dialect', text: '您妈妈最常念叨的一句话是什么？', textEn: 'What was the one phrase your mother repeated most?' },
  { id: 'q28', cat: 'dialect', text: '有没有一个老家的词，您用普通话怎么都说不准？', textEn: 'Is there a word from home you can never quite say in Mandarin?' },
  // 回头看
  { id: 'q29', cat: 'reflect', text: '您这辈子最难的一年是哪一年？那年您靠什么撑过来的？', textEn: 'Which was the hardest year of your life? What got you through it?' },
  { id: 'q30', cat: 'reflect', text: '有没有一个决定，当时觉得很小，后来改变了一切？', textEn: 'Was there a decision that seemed small at the time but changed everything?' },
  { id: 'q31', cat: 'reflect', text: '您觉得现在的年轻人，有什么是您那时候想都不敢想的？', textEn: 'What do young people have today that you couldn’t even have imagined back then?' },
  { id: 'q32', cat: 'reflect', text: '如果只能把一句话留给孙辈，您想说什么？', textEn: 'If you could leave your grandchildren just one sentence, what would it be?' },
];

export const CATEGORIES = [{ id: 'all', label: '全部', labelEn: 'All' }, ...CHAPTERS];
