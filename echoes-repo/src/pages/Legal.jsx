import Public from '../components/Public';
import { useT } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';

const PRIVACY = {
  zh: { title: '隐私政策', updated: '最后更新：2026 年 10 月', sections: [
    ['我们收集什么', '你主动提供的内容：录音、文字、照片、视频、音乐，以及讲述者档案（称呼、出生年份、老家、住过的地方、语言和方言）。账号信息：邮箱。我们不收集族裔、宗教、政治立场、健康状况等敏感类别信息，档案里也没有这些字段。'],
    ['为什么收集', '出生年份、老家、语言和方言只用于两件事：挑选适合的问题，以及在整理故事时正确理解方言词和时代背景。不用于广告，不卖给第三方。'],
    ['AI 如何处理你的录音', '录音会发送给语音转写和文本整理服务以生成故事和注释。处理后的结果只保存在你的账号里。我们不用你的录音训练任何模型。'],
    ['谁能看到', '默认只有你。被你邀请的家人按你设置的权限看到（读听 / 纠正注释 / 添加故事）。只有当你对某个故事点击"发布到社区"并确认讲述者同意后，该故事才对其他用户可见；可随时取消发布。'],
    ['讲述者的权利', '讲述者（通常是长辈）有权要求查看、更正或删除以他为主角的任何内容，即使账号不是他本人注册的。联系我们即可。'],
    ['保存多久、怎么删除', '内容保存到你删除为止。你可以在设置里一键导出全部内容，或删除账号。删除后 30 天内可恢复，之后彻底清除，包括备份。'],
    ['未成年人', '本服务面向成年家庭成员。如果一位讲述者或协助者未满 18 岁，需要监护人同意。'],
    ['联系我们', 'hello@echoestory.com'],
  ] },
  en: { title: 'Privacy Policy', updated: 'Last updated: October 2026', sections: [
    ['What we collect', 'Content you provide: recordings, text, photos, video, music, and the storyteller profile (name, year of birth, hometown, places lived, language and dialect). Account: email. We do not collect sensitive categories such as ethnicity, religion, political views or health — the profile has no such fields.'],
    ['Why', 'Year of birth, hometown, language and dialect are used for two things only: choosing fitting questions, and understanding dialect words and era context when tidying a story. Never for advertising; never sold.'],
    ['How AI handles your recordings', 'Recordings are sent to speech-to-text and text-tidying services to produce the story and notes. Results are stored only in your account. We do not train models on your recordings.'],
    ['Who can see it', 'Only you, by default. Family you invite see what you allow (read & listen / correct notes / add stories). A story becomes visible to other users only after you click “Publish to community” and confirm the storyteller agrees; you can unpublish at any time.'],
    ['The storyteller’s rights', 'The storyteller (usually the elder) may ask to see, correct or delete any content about them, even if the account is not theirs. Contact us.'],
    ['Retention and deletion', 'Content is kept until you delete it. Export everything in one click from Settings, or delete the account — recoverable for 30 days, then permanently erased including backups.'],
    ['Minors', 'The service is for adult family members. A storyteller or helper under 18 needs a guardian’s consent.'],
    ['Contact', 'hello@echoestory.com'],
  ] },
};
const TERMS = {
  zh: { title: '服务条款', updated: '最后更新：2026 年 10 月', sections: [
    ['服务内容', '余音提供问题库、录音、AI 整理与注释、档案、家人邀请和社区功能。AI 生成的文字是对口述的整理，可能有错误，以原声和你确认后的版本为准。'],
    ['你的内容', '你保留你上传和生成内容的全部权利。你授予我们为提供服务所必需的存储和处理权限，仅此而已。'],
    ['发布到社区', '发布前你需要确认讲述者知情并同意公开。发布的故事对其他用户可见（文字、注释和照片；原声录音始终只有家人能听），其他用户可以点赞；你可以随时取消发布。不得发布侵犯他人权利或含有仇恨、骚扰内容的故事。'],
    ['付费与退款', '免费额度为 20 个故事。家庭版是订阅制，到期自动续费，可随时在设置里取消。取消后，所有已有内容保持可读。付费后 7 天内可无理由退款。'],
    ['账号', '一个账号可以有多位讲述者。请妥善保管密码；如发现账号被盗用请立即联系我们。'],
    ['终止', '你可以随时删除账号。我们保留在用户严重违反本条款时暂停账号的权利，并会提前通知。'],
    ['联系我们', 'hello@echoestory.com'],
  ] },
  en: { title: 'Terms of Service', updated: 'Last updated: October 2026', sections: [
    ['The service', 'Echoes provides a question bank, recording, AI tidying and annotation, an archive, family invitations and a community. AI-generated text is a tidy-up of speech and may contain errors; the original audio and your confirmed version prevail.'],
    ['Your content', 'You keep all rights to what you upload and create. You grant us only the storage and processing rights needed to run the service.'],
    ['Publishing to the community', 'Before publishing you confirm the storyteller knows and agrees. Published stories are visible to other users (text, notes and photos; the original audio always stays family-only), and other users can like them; you can unpublish at any time. No content that infringes others’ rights or contains hate or harassment.'],
    ['Payment and refunds', 'The free allowance is 20 stories. The Family plan is a subscription that renews automatically; cancel any time in Settings. After cancelling, all existing content stays readable. Full refund within 7 days of payment, no questions asked.'],
    ['Accounts', 'One account may hold several storytellers. Keep your password safe; contact us immediately if you suspect misuse.'],
    ['Termination', 'You may delete your account at any time. We may suspend accounts for serious breaches of these terms, with prior notice.'],
    ['Contact', 'hello@echoestory.com'],
  ] },
};

export default function Legal({ kind }) {
  const { lang } = useT(); const nav = useNavigate(); const d = (kind === 'terms' ? TERMS : PRIVACY)[lang];
  return (
    <Public>
      <article className="mx-auto max-w-[700px] px-5 py-10">
        <button className="ed-caps hover:!text-ink cursor-pointer mb-6" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}>{lang === 'zh' ? '← 返回' : '← Back'}</button>
        <div className="eyebrow mb-2">{d.updated}</div>
        <h1 className="text-[34px] font-semibold mb-8">{d.title}</h1>
        {d.sections.map(([h, p]) => <section key={h} className="mb-7"><h2 className="text-[19px] font-semibold mb-1.5">{h}</h2><p className="text-ink-2 m-0 leading-[1.8]">{p}</p></section>)}
      </article>
    </Public>
  );
}
