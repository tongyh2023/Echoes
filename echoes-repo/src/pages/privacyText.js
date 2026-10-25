// The privacy policy text — Helen's draft v3 (Oct 2026), with the open points filled in cautiously:
// privacy contact = the Echoes team, age rule = the site's existing guardian-consent rule, change notices by email.
// TO UPDATE (e.g. v4): edit the text below only. Each section is [heading, content]; content is a list where
// a string is a paragraph and an array of strings is a bullet list. Change `updated` to the date it goes live.
export const PRIVACY = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: 25 October 2026',
    intro: 'Echoes (echoestory.com) helps families record and keep their elders’ life stories. These stories are some of the most personal things a family has, so this page explains in plain words what we keep, why, who can see it, and how to delete it.',
    sections: [
      ['1. What we collect', [[
        'Your account: your email address, your name and a password. Your password is stored in a scrambled form, so we can never see it.',
        'Storyteller profiles: for each elder whose stories you record, the details you choose to add: name, birth year, hometown, places they have lived, country and dialect.',
        'Recordings: the original audio of the stories.',
        'Text: the written transcript of each recording, a tidied-up version, and any notes your family adds.',
        'Photos and videos that you upload. When you upload a photo, we remove its location, camera model and time taken.',
        'Family activity: reactions, likes and follow-up questions that family members leave on stories.',
        'Payments: handled by Stripe. We only send Stripe your email (and an internal number so we know which family paid). Your card and billing address are entered on Stripe’s own page, and we never see or store them.',
      ]]],
      ['2. Why we collect it', ['We use this information only to run Echoes for you: to let you sign in, to save and play your family’s stories, to turn recordings into text, to show stories to the right people, to send you emails that confirm your account, and to take payment if you choose the Family plan.']],
      ['3. How recordings are turned into text (an outside AI service)', ['We don’t transcribe recordings ourselves. We use Alibaba Cloud Model Studio, an AI service run by another company. First the audio is sent to Alibaba to be written out; then the transcript is sent back to Alibaba to be tidied. If you ask for a translation, the story text is sent to the same service. All of this happens on servers in Singapore. Under Alibaba’s terms, what we send is kept for no longer than 30 days and is not used to train its AI models.']],
      ['4. Who can see what', [[
        'Stories you haven’t published: only members of your family group on Echoes.',
        'Stories you publish to the community: anyone can read the text, the confirmed notes and the photos.',
        'Before a story is published, the person publishing it must confirm the storyteller knows and agrees. It can be unpublished at any time.',
        'Original audio: always family only. Even when a story is published, only your family can listen to the elder’s voice.',
      ]]],
      ['5. Companies that help us run Echoes', [[
        'Supabase stores accounts, profiles, stories, recordings, photos and videos, on servers in the eastern United States.',
        'Alibaba Cloud Model Studio (Singapore) turns recordings into text, as explained above.',
        'Vercel hosts the website.',
        'Resend sends our verification emails.',
        'Stripe handles payments.',
      ], 'These companies also keep basic technical logs (such as IP address, browser and time of visit) for security and to fix problems.', 'This means your information is stored and processed outside the country you live in, including in the United States and Singapore.']],
      ['6. What we never do', [[
        'We never sell your information.',
        'We never use your family’s recordings or stories to train AI models.',
        'We never show ads based on your information.',
        'We don’t use analytics or advertising cookies. We only keep your sign-in in your browser so you stay logged in.',
        'Because we don’t track you across websites, we don’t respond differently to “Do Not Track” signals.',
      ]]],
      ['7. How long we keep it, and how to delete it', ['We keep your stories until you delete them, because keeping them is the whole point of Echoes. When you delete something, it is removed from Echoes straight away. Copies may stay in our providers’ backups for a short time before they are erased. You can download all your stories as a PDF story book at any time from Settings.', [
        'Delete a story: the person who recorded it can delete it. Its recording, photos and videos are deleted with it.',
        'Remove a family member: the person who created the family group can remove members.',
        'Delete a storyteller: email hello@echoestory.com and we will remove the profile. Their stories stay in the family unless you ask us to delete them too.',
        'Delete your account: email hello@echoestory.com and we will delete it within 30 days.',
      ]]],
      ['8. Seeing and correcting your information', ['You can see and edit your name, storyteller profiles and stories in Echoes at any time. To get a copy of everything we hold about you, or to correct something you can’t change yourself, email hello@echoestory.com and we will reply within 30 days. Privacy questions are handled by the Echoes team at the same address.']],
      ['9. The storyteller’s own rights', ['The stories belong to the elder who tells them, too. Please make sure they are happy to be recorded. A storyteller can ask us at any time to remove their recordings, even if someone else made the account. Just email hello@echoestory.com, and we will remove them.']],
      ['10. Children and teenagers', ['Echoes is made for families. If you are under 18, please ask a parent or guardian before you create an account, and a storyteller under 18 needs a parent’s or guardian’s consent to be recorded.']],
      ['11. Changes to this policy', ['If we change this policy, we will update the date at the top. If the change is important, we will tell you by email before it takes effect.']],
      ['12. Contact us', ['Questions, or want something deleted? Email hello@echoestory.com.']],
    ],
  },
  zh: {
    title: '隐私政策',
    updated: '最后更新：2026 年 10 月 25 日',
    intro: '余音 Echoes（echoestory.com）帮助家人把长辈的人生故事录下来、留下来。这些故事是一个家最私人的东西，所以我们在这里用大白话说清楚：我们存了什么、为什么存、谁能看到、怎么删掉。',
    sections: [
      ['1. 我们收集什么', [[
        '你的账号：邮箱、名字和密码。密码是加密保存的，我们自己也看不到。',
        '讲述者档案：你为每位长辈填写的资料：名字、出生年份、老家、住过的地方、国家和方言。',
        '录音：故事的原始录音。',
        '文字：每段录音转出来的文字、整理后的版本，以及家人加的注释。',
        '你上传的照片和视频。上传照片时，我们会自动去掉照片里的位置、相机型号和拍摄时间。',
        '家人互动：家人在故事下留的表情、点赞和追问。',
        '付款：由 Stripe 处理。我们只把你的邮箱（和一个内部编号，用来知道是哪个家庭付的钱）发给 Stripe；卡号和账单地址是你在 Stripe 的页面上填的，我们看不到、也不会保存。',
      ]]],
      ['2. 为什么要收集', ['这些信息只用来让余音正常运转：让你登录、保存和播放家里的故事、把录音变成文字、让该看到的人看到故事、给你发账号验证邮件，以及在你选择家庭版时用于付款。']],
      ['3. 录音是怎么变成文字的（交给外部的 AI 服务）', ['转写不是我们自己做的，用的是另一家公司的 AI 服务——阿里云百炼（Model Studio）。第一步，录音发给阿里云转成文字；第二步，转出来的文字再发给阿里云整理。如果你使用翻译，故事文字也会发给同一个服务。这些都在新加坡的服务器上完成。按照阿里云的条款，我们发过去的内容最多保留 30 天，不会被用来训练它的 AI 模型。']],
      ['4. 谁能看到什么', [[
        '还没发布的故事：只有你家在余音上的成员能看到。',
        '发布到社区的故事：任何人都能看到文字、已确认的注释和照片。',
        '发布之前，发布的人需要确认讲述者知情并同意公开。发布后可以随时取消。',
        '原声录音永远只有家人能听。就算故事发布了，长辈的声音也只有自家人能听到。',
      ]]],
      ['5. 帮我们运行余音的公司', [[
        'Supabase：存放账号、档案、故事、录音、照片和视频，服务器在美国东部。',
        '阿里云百炼（新加坡）：把录音转成文字，见上文。',
        'Vercel：网站托管。',
        'Resend：发送验证邮件。',
        'Stripe：处理付款。',
      ], '这些公司还会记录一些基本的技术日志（比如 IP 地址、浏览器和访问时间），用于安全和排查问题。', '也就是说，你的信息会存放、处理在你所在国家以外的地方，包括美国和新加坡。']],
      ['6. 我们绝不做的事', [[
        '绝不出售你的信息。',
        '绝不用你家的录音和故事训练 AI 模型。',
        '绝不根据你的信息投放广告。',
        '我们不使用分析工具或广告 cookie，只在你的浏览器里保存登录状态，让你不用每次重新登录。',
        '因为我们不会跨网站追踪你，所以对浏览器的「请勿追踪」（Do Not Track）信号不做特别处理。',
      ]]],
      ['7. 保存多久、怎么删除', ['故事会一直保存，直到你删除为止——留住故事本来就是余音存在的意义。删除后会立刻从余音移除；服务商的备份里可能会短暂保留，之后清除。你随时可以在「设置」里把所有故事导出成一本 PDF 故事书。', [
        '删除故事：录这个故事的人可以删除，录音、照片和视频会一起删掉。',
        '移除家庭成员：创建这个家庭的人可以移除成员。',
        '删除讲述者：发邮件到 hello@echoestory.com，我们会删除档案；这位讲述者的故事会留在家里，除非你要求一起删除。',
        '注销账号：发邮件到 hello@echoestory.com，我们会在 30 天内删除。',
      ]]],
      ['8. 查看和更正你的信息', ['你随时可以在余音里查看、修改自己的名字、讲述者档案和故事。如果想要一份我们保存的你的全部信息，或者想更正自己改不了的内容，请发邮件到 hello@echoestory.com，我们会在 30 天内回复。隐私相关的问题由余音团队通过同一个邮箱处理。']],
      ['9. 讲述者本人的权利', ['故事也属于讲故事的长辈。录之前请先问问他们愿不愿意。讲述者本人随时可以要求我们删除自己的录音，即使账号是别人开的。发邮件到 hello@echoestory.com 就可以，我们会删掉。']],
      ['10. 儿童和青少年', ['余音是为家庭设计的。如果你未满 18 岁，请先征得父母或监护人同意再注册；讲述者未满 18 岁时，录音也需要父母或监护人同意。']],
      ['11. 政策的修改', ['如果这份政策有改动，我们会更新顶部的日期。重要的改动会在生效前通过邮件告诉你。']],
      ['12. 联系我们', ['有问题，或想删除什么？请发邮件到 hello@echoestory.com。']],
    ],
  },
};
