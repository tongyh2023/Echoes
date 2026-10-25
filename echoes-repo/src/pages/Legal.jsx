import Public from '../components/Public';
import { useT } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';
import { PRIVACY } from './privacyText';

const TERMS = {
  zh: { title: '服务条款', updated: '最后更新：2026 年 10 月', sections: [
    ['服务内容', '余音提供问题库、录音、AI 整理与注释、档案、家人邀请和社区功能。AI 生成的文字是对口述的整理，可能有错误，以原声和你确认后的版本为准。'],
    ['你的内容', '你保留你上传和生成内容的全部权利。你授予我们为提供服务所必需的存储和处理权限，仅此而已。'],
    ['发布到社区', '发布前你需要确认讲述者知情并同意公开。发布的故事对其他用户可见（文字、注释和照片；原声录音始终只有家人能听），其他用户可以点赞；你可以随时取消发布。不得发布侵犯他人权利或含有仇恨、骚扰内容的故事。'],
    ['价格、付费与退款', '免费版：10 个故事、1 位讲述者、可以邀请 1 位家人，照片和视频免费。家庭版不限故事、讲述者和家人，有两种付法：月付 4.99 美元，每月自动续费，可以随时在「设置 → 管理订阅」里取消，取消后用到当期结束；终身版 19.99 美元，一次付清，不再扣费。所有价格以美元计，付款由 Stripe 处理。停止付费后，已有的故事、录音和照片永远保留、可以阅读；已经加入的家人保留，只是不能再邀请新的家人。如需退款，请发邮件到 hello@echoestory.com，写明账号邮箱和付款日期，我们会在 5 个工作日内回复。'],
    ['账号', '一个账号可以有多位讲述者。请妥善保管密码；如发现账号被盗用请立即联系我们。'],
    ['终止', '你可以随时删除账号。我们保留在用户严重违反本条款时暂停账号的权利，并会提前通知。'],
    ['联系我们', 'hello@echoestory.com'],
  ] },
  en: { title: 'Terms of Service', updated: 'Last updated: October 2026', sections: [
    ['The service', 'Echoes provides a question bank, recording, AI tidying and annotation, an archive, family invitations and a community. AI-generated text is a tidy-up of speech and may contain errors; the original audio and your confirmed version prevail.'],
    ['Your content', 'You keep all rights to what you upload and create. You grant us only the storage and processing rights needed to run the service.'],
    ['Publishing to the community', 'Before publishing you confirm the storyteller knows and agrees. Published stories are visible to other users (text, notes and photos; the original audio always stays family-only), and other users can like them; you can unpublish at any time. No content that infringes others’ rights or contains hate or harassment.'],
    ['Prices, payment and refunds', 'Free plan: 10 stories, 1 storyteller, 1 invited family member; photos and video are free. The Family plan has no limits on stories, storytellers or family members, and two ways to pay: Monthly at US$4.99, renewing automatically each month — cancel any time in Settings → Manage subscription, and it stays active until the end of the paid month; or Lifetime at US$19.99, paid once, never charged again. All prices are in US dollars; payments are processed by Stripe. If you stop paying, your existing stories, recordings and photos stay and remain readable; family members who already joined stay, but no new ones can be invited. For a refund, email hello@echoestory.com with your account email and payment date — we reply within 5 business days.'],
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
        {d.intro && <p className="text-ink-2 leading-[1.8] mb-8">{d.intro}</p>}
        {/* content: a string = one paragraph; a list = paragraphs and bullet lists (see privacyText.js) */}
        {d.sections.map(([h, p]) => (
          <section key={h} className="mb-7"><h2 className="text-[19px] font-semibold mb-1.5">{h}</h2>
            {(Array.isArray(p) ? p : [p]).map((part, k) => Array.isArray(part)
              ? <ul key={k} className="text-ink-2 leading-[1.8] pl-5 my-2 list-disc">{part.map((li) => <li key={li} className="mb-1">{li}</li>)}</ul>
              : <p key={k} className="text-ink-2 m-0 mb-2 leading-[1.8]">{part}</p>)}
          </section>
        ))}
      </article>
    </Public>
  );
}
