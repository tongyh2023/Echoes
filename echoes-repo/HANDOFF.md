# Echoes · 余音 — Design handoff (frontend complete, no backend)

**Status:** The complete product surface is built and runs locally with mock data — public site, auth, onboarding, the recording loop, archive, family invitations (both sides), community, settings, billing screens, legal pages and error states.
**Not done (by design):** real auth, database, file storage, speech-to-text, LLM calls, payments, email sending, deployment. Those are the development phase.

## Route map

| Area | Routes | Notes |
|---|---|---|
| Public site | `/` landing (how · why · sample · pricing · FAQ), `/privacy`, `/terms`, `*` 404 | `components/Public.jsx` shell with footer; responsive |
| Auth | `/signup`, `/login`, `/forgot`, `/verify`, `/deleted` | UI states only; `store.signIn/verify/signOut/deleteAccount` |
| Onboarding | `/mode` (self vs family), `/profile?mode=…` (also `&edit=<storytellerId>`) | Two-level language picker (major language → dialect); places lived |
| App | `/home` (Stories), `/pick` (question bank), `/record/:qid`, `/processing`, `/review`, `/story/:id`, `/story/:id/edit`, `/family`, `/community`, `/people/:name` | Core loop = pick → record → processing → review → story. `/archive` redirects to `/home` (merged). |
| Account | `/settings` (storytellers, plan, language, export, delete), `/upgrade?why=limit|storyteller` | Free plan = 10 stories, 1 storyteller (`FREE_LIMIT` in store) |
| Invitee side | `/invite/:code` landing → `/shared` list → `/shared/:id` story with confirm/fix notes | Mobile-first; no password, link-scoped access |


## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # dist/
npm run build:single   # dist-single/index.html — one self-contained file, for previews
```

Stack: Vite · React 19 · React Router (hash routing) · Tailwind 4. No UI library; all components are in `src/components` and `src/index.css`.

## Where things are

| Path | What |
|---|---|
| `src/mock/data.js` | **The only file the backend replaces.** Question bank, seed stories, community posts, and the three mock AI functions. |
| `src/lib/store.jsx` | App state (profile, stories, posts, invites). Persists to `localStorage`. Replace with API calls. |
| `src/lib/i18n.jsx` | UI strings `zh` + `en`, language list, dialect lists. Story *content* is never translated. |
| `src/pages/*` | One file per screen. Routes in `src/main.jsx`. |
| `src/index.css` | Design tokens (`@theme`) + component classes. |

## Integration points (what the mock does today → what production should do)

| Function (in `mock/data.js`) | Input | Output | Production |
|---|---|---|---|
| `transcribeAndTidy({ audioBlob, typedText, question, profile })` | audio Blob (webm) **or** typed text; the question asked; storyteller profile (hometown, places, lang, dialects) | `{ title, text: { first[], third[], raw[] }, terms[], topics[], people[], era, place }` — paragraphs with `[term]` markers; each term `{ id, word, kind, note, status:'pending' }` | STT (e.g. Whisper, zh + dialect hint) → LLM prompt with profile for tidy + annotation. Must return all three POVs or generate on demand. |
| `polishParagraph(paragraph, style)` | one paragraph; style ∈ `narrative / letter / oral` | rewritten paragraph | LLM call; keep `[term]` markers intact. |
| `suggestNextQuestion(story, profile)` | saved story + profile | a question `{ id, text, tags }` | LLM picks from bank or writes a follow-up based on entities in the story. |

Media (photos / video / music) are kept as object URLs in memory → upload to storage; the story `media[]` array holds `{ id, name, kind, url }`.
Recording uses `MediaRecorder` (`audio/webm`); the Blob is in the draft until `transcribeAndTidy` runs.

## Data model (as used by the UI)

```
Profile  { mode:'self'|'other', name, relation, birth, hometown, livesIn, places[], lang, dialects[], uiLang }
Story    { id, questionId, question, title, date, duration, audioUrl, style, published,
           text:{ first[], third[], raw[] }, terms[], topics[], people[], era, place, media[] }
Term     { id, word, kind, note, status:'pending'|'ok' }
Post     { id, storyId?, author, authorSub, title, excerpt, lang, likes, comments[{who,text}], reposts, cover, mine? }
Invite   { name, sub, perms:['read'|'correct'|'add'] }
```

## Decisions encoded in the UI (do not undo without asking the design side)

- Two roles: **storyteller** (elder) and **helper** (family). Helper holds the account; `mode:'self'` lets a person record themselves. Titles and pronouns follow the mode.
- Recording screen copy speaks **to the storyteller**; type is sized so an elder can read it from arm's length. Upload is a first-class alternative (phone-call interviews).
- Cultural context = questions tailored by hometown/language + AI-highlighted terms (dialect, historical, objects) that need **family confirmation** before they become notes + original audio always kept next to the story.
- Language: UI switch zh/en (follows system by default). Profile picks a **major language first, dialect second**. Chinese content first.
- Home shows **one recommended question**, not the whole bank. No scores or streaks anywhere.
- Community: editorial feed (featured story + single-column list + sticky sidebar), like / comment / repost / follow, filter by language and topic, in-page reader for posts without audio; a story appears there only when its owner hits **Publish**. Seed posts live in `COMMUNITY_POSTS` (`src/mock/data.js`); in production this is a `posts` table + feed endpoint.
- Recording: real `MediaRecorder`. When `getUserMedia` is refused (embedded previews such as claude.ai block the mic), the page offers a **demo take** so the flow can still be walked end to end; remove `startDemo` in `src/pages/Record.jsx` before launch.
- Landing sample stories (`SAMPLE_STORIES` in `src/mock/data.js`) exist in zh / en / es so the English site never shows only Chinese; the hero widget and “A real example” share one switcher.

## Additional integration points added in this round

| UI | Production work |
|---|---|
| Sign up / log in / forgot / verify | Real auth provider; the verify page shows a mock email — replace with a real transactional email |
| `/upgrade` | Payment provider (WeChat Pay / Alipay / card). Plan state is `store.plan`; gate is `FREE_LIMIT` stories and 1 storyteller on free |
| Invite link | Generate a scoped token per invite; `/invite/:code` resolves it; invitee actions (confirm/fix notes) write back to the story's `terms[]` |
| Publish consent | The consent checkbox state should be stored with the story (`consent[storyId]`) for audit |
| Export / delete | Export = zip of audio + text + media + notes; delete = soft-delete with 30-day restore, then hard purge incl. backups |
| Community | Needs moderation / report flow before public launch; posts carry `lang` for filtering |
| Error states | Processing failure UI exists (type 失败 as the typed answer to see it); wire to real error codes |

## Known gaps for development

- Invitee "add my own story" permission has no screens yet (read + confirm are built).
- Video playback controls and music player are placeholders.
- "Places lived" is stored but not yet used to tailor questions in the mock.
- `localStorage` demo state: the **重置** button in the header clears it.


## Changes after the Oct 7 walkthrough (33 points)

- **One header everywhere** (`components/Shell.jsx`): Stories · Family · Community, a persistent "Record a story" button, language toggle, avatar → Settings. Same width on every signed-in page.
- **Stories page** replaces Home + Archive: recent stories, search, facet filters, unfinished draft card. `/archive` → `/home`.
- **Record**: "← Back" + "Change question" instead of a fake back arrow; post-recording state = one player, one primary action (Turn into a story), two quiet secondary actions; upload replaces any in-progress take (fixes the runaway demo timer).
- **Review**: no story-type switch, no first/third-person toggle. One "Polish with AI" (whole story, with undo), "Show original transcript", editable metadata (topics / people / era / place), notes can be added by hand (marks the first occurrence in the text) and removed. "Save draft" keeps you on the page with a toast; "Save story" opens the story page.
- **Story page**: inside the app frame; notes are tap-to-see glossary marks in the text (unconfirmed guesses never show to readers); Share menu = invite family / publish to community (consent dialog). No dead-end "saved" screen.
- **Family** = the family unit: storytellers, members (each with their own account), invite by email or link. WeChat removed. Data model for the backend: `family → members (accounts) → storytellers → stories → notes / media`. One family per account; invitations create accounts inside that family; outsiders see nothing.
- **Community**: list / grid layouts, "Story language" filter (content) vs header toggle (interface), author → `/people/:name` public profile, reader modal; removed the eyebrow label and the "my stories" card.
- **Settings**: "Screen language" section removed (header toggle is the single control). Dev-only "Clear demo data" at the bottom.
- **Landing**: final CTA sits before the FAQ; all placeholders translated.

## Before launch — remove / replace

1. Sign-up page: "Enter with sample data" button (`pages/AuthPages.jsx`).
2. Record page: `startDemo` demo take (`pages/Record.jsx`).
3. Settings: "Clear demo data" link (`pages/Settings.jsx`).
4. Profile form: "Fill with sample" link (`pages/Onboarding.jsx`).
5. `HashRouter` → `BrowserRouter` in `main.jsx` (keep the MemoryRouter fallback only if you still embed previews).
6. Replace `transcribeAndTidy`, `polishParagraph`, `suggestNextQuestion` and `TERM_DICT` in `src/mock/data.js` with real services; replace `COMMUNITY_POSTS` / `SAMPLE_STORIES` with API data.
7. Placeholder photos in `src/assets/` are AI-generated; replace with licensed or family-provided images.
8. Brand: name is **Echoes / 余音** (`APP` in `components/Shell.jsx`); the mark lives in `components/Illos.jsx` (`Mark`) and as files in `public/brand/` (SVG mark, light/dark logo lockups, PNG). Palette is white / black / grey / one sepia brown — tokens in `src/index.css` (`--color-ochre` is the brown accent; the name is historical).
9. Demo content in `src/mock/data.js` carries `*En` fields so the English interface shows no Chinese demo content (`src/lib/loc.js`). Real user content is shown as recorded; translating it is a product feature (AI), not UI i18n.
10. Family model additions: `familyName`, `inviteCode` (join from the sign-up page), single member role; see `pages/Family.jsx`.

## 2026-10-11 · App UX rebuild（部署前请读）

- 问题库：`src/mock/questions.js`（32 题，按人生章节；`{home}` 由档案填入）。家人自己写 / 改写 / 追问的问题存在 `state.customQuestions`，首页「下一个问题」优先取这里。
- 新路由 `/read/:id`：社区故事的阅读页（取代弹窗）。发布后跳到这里并带 `state.published` 提示；自家的故事从社区点开直接进 `/story/:id`。
- 头像：`Avatar` 组件（`components/Shell.jsx`）；上传后用 canvas 压到 160px 正方形存 data URL（`storyteller.avatar`、`state.meAvatar`、`invites[i].avatar`）。上线后改为上传到对象存储。
- 家族名：`useFamilyName()` 默认 = 第一位讲述者的姓 + 家；用户改过后存 `state.familyName`。
- 注释（terms）目前是 mock：`mock/data.js` 里 `TERM_DICT` 关键词匹配。生产环境的管线：STT（带方言模型，如 Whisper/讯飞）→ LLM 提示词里带档案（老家、年代、方言、住过的地方）+ 问题 → 输出 `{title, text, terms[{word, kind, note}], topics, people, era, place}` → 全部 `status: 'pending'`，由家人确认后才对读者显示。准确性靠两层：LLM 用档案做上下文，家人确认做把关。
- 录音页已去掉打字回答；`startDemo`（演示录音）上线前删除。

## 2026-10-16 · Real AI pipeline (Vercel function)
- `api/tidy.js` runs on Vercel. Preferred provider: **Alibaba Model Studio (international, Singapore)** — `DASHSCOPE_API_KEY` → Qwen3-ASR-Flash (Mandarin + Cantonese / Sichuanese / Minnan / Wu dialects, context-biased) + `qwen-plus` for the tidy-up. Fallback: `OPENAI_API_KEY` → whisper-1 + gpt-4o-mini. Set the key in Vercel → Project → Settings → Environment Variables (all environments), then Redeploy. If both keys are set, Qwen is used and Whisper only if Qwen errors.
- Register at modelstudio.console.alibabacloud.com (international site; a Canadian card works). API key: Model Studio → API-KEY. Watch the free quota on the console; after that ≈ ¥0.9 per hour of audio.
- Front end calls it automatically whenever there is a real recording (`src/mock/data.js → tidyForReal`). Demo takes (no audio) still use the sample story. `vite preview` / local file has no `/api`, so test on the Vercel URL (or `npx vercel dev`).
- Body limit 4 MB ≈ 6–8 minutes of browser audio. Longer recordings: move upload to Supabase Storage (Session 2) and pass a URL instead.
- Several takes are concatenated into one Blob before tidy-up (same mime type), in order.

## UI / UX to revisit before launch (collected during real-site testing, 2026-10-20)

- Sign-up page: the "Have an invite code? Join a family" block is too small and easy to miss. Give it the same weight as the main form (or its own step), and make the remembered-code state obvious.
- (add items here as testing continues)

## 2026-10-20 · After the first real recordings (fix4)
- **No invention.** The tidy prompt now forbids adding anything the speaker did not say (the question is background only; short transcript → short story), temperature 0.1, and `api/tidy.js` has a hard guard: if the tidied text is materially longer than the transcript, the transcript itself is kept and `provider` says "(kept transcript as-is)".
- **Dialect hint.** The speech model gets a real sentence (hometown, dialects, question) plus a small per-dialect word list (`DIALECT_WORDS` in `api/tidy.js`) so 上海话 "生煎包" is not written as a sound-alike. Extend the lists as families report misses.
- **Back from Review** always goes to /home (or the story when editing) — never history-back into /processing. Processing redirects an already-tidied draft to /review instead of re-running.
- **No sample story in real accounts.** A draft with no audio now shows an error; the 年糕 sample only appears in demo mode.
- **Real take length.** Stories showed 4:12 for every recording (stale closure); fixed.

## 2026-10-21 · Long recordings (fix5) — Helen hit HTTP 413
- Vercel refuses request bodies over 4.5 MB, so audio no longer passes through `/api/tidy`. Processing now uploads the take to Storage first (under the story's final uuid), gets a 1-hour signed link, and sends the link. Saving reuses that path — no second upload. A take abandoned before saving leaves an orphan file under `audio/<family>/`; clean those up later (cheap).
- ≤ 4.5 min → `qwen3-asr-flash` (synchronous, with dialect context). Longer → `qwen3-asr-flash-filetrans` (asynchronous): API answers 202 + taskId and the browser polls `GET /api/tidy?task=…` every 4 s. The Processing page says it may take a few minutes.
- Base64 upload remains only for the demo/no-database path.
- **3-minute takes (MVP).** `MAX_SEC = 180` in `Record.jsx`: countdown next to the timer, a warning at 2:30, automatic stop at 3:00 with the take kept; more takes can be added and are joined in order. Raise the constant when the family tests say so.

## 2026-10-22 · Uploaded files (fix7) — "audio format is illegal"
- An uploaded MP3 was stored as `.webm` (the extension map only knew mp4/ogg/wav), and the speech model refused it. `extFor` now covers mp3/m4a/wav/flac/ogg/webm and falls back to the file's own name; the Storage content-type matches.
- For short clips `/api/tidy` now downloads the file from the signed link itself and sends bytes with an explicit media type, instead of handing the link to the model. Long clips (> 4.5 min) still go to filetrans by link.
- **Uploads are re-encoded in the browser** (fix8): any file the browser can play is decoded and written out as 16 kHz mono WAV before upload, so the speech model always gets one known format; files over 3 minutes are refused with the length shown; files the browser cannot open get a clear message (WeChat voice notes must be exported first).
- **Photos / videos on a story are real now** (fix9): files go to the same private bucket under `<family>/media/<story>/`, the row keeps `{ id, kind, name, path }`, and links are signed on view. Before this, media only lived in memory and vanished on save. Visitors on the public community page do not see media (signed links need membership) — a later step.
- **Family name default**: Chinese name → first character + 家; Western-order name → last word + 家 (Grandpa Tong → Tong 家). Still renameable on the Family page.
- **fix10 · community photos, likes only, Activity** — migration `008_photos_likes_notifications.sql`: storage lets anyone read photos under `<family>/media/<story>/` once that story is published (recordings stay family-only); `community_feed()` returns the first photo path; `my_notifications()` lists community likes and family reactions on our stories. Comments and reposts are removed from the community and read pages. Header ♡ shows unread count (checked on page change + every minute) → `/notifications`; opening it stamps `profiles.notif_seen_at`.
- Profile form: Country / region field (stored in the storyteller's profile JSON, no migration); placeholders are now Shanghai / Toronto.
- **fix11 · photos are always visible**: the "Photos & video" panel sits under the audio on the review page, the edit page and the saved story page — no menu. On the story page picking or removing a file saves immediately (any family member). First photo is marked "Cover". Music attachments removed; the "More ▾" menu no longer has an add-media item.
- **fix12 · new logo + read-page crash**: the gold/blue brush-stroke logo (light + dark versions, watermark removed) replaces the old mark — `src/assets/mark.png` (light UI), `mark-white.png` (dark surfaces), `public/favicon.png`, `public/brand/*`. Opening a community story crashed (`comments.length` after comments were removed) — fixed. UI colours to match the logo palette are a later step.
- **fix13 · ready for email confirmation**: the invite code is saved on the account at sign-up (`user_metadata.invite`) and used after the first login, so a relative who confirms their email in another tab or on their phone still joins the family; it is then cleared. Arriving from the confirmation link on /login moves on automatically. Free tier is now **20 stories** (`FREE_LIMIT`). `supabase/cleanup_test_data.sql` removes CC's test accounts (preview first).

## 2026-10-22 · Payments (fix14) — Stripe Checkout, webhook, waitlist
- **Migration `009_billing.sql`**: `family_billing` (plan per family; members can read, nobody can write from the browser) and `waitlist`.
- **`api/checkout.js`**: GET → `{ mode, price }`; POST (signed-in family member) → Stripe Checkout URL for the Family plan subscription. **`api/stripe-webhook.js`**: verifies Stripe's signature, then writes `family_billing` with the secret key (`checkout.session.completed`, `customer.subscription.updated/deleted`; `past_due` keeps access while Stripe retries). **`api/portal.js`**: Stripe customer portal (change card, receipts, cancel).
- **Upgrade page** shows the real price from Stripe and sends people to Checkout; with `BILLING_MODE` not `stripe` it collects waitlist emails instead. Settings shows the renewal date and "Manage subscription"; after returning from Checkout it waits for the webhook.
- **Vercel env vars**: `BILLING_MODE`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API Keys → secret key). Switching test → live is only changing these values.

## 2026-10-23 · Privacy prep (fix15)
- **Contact email** is now hello@echoestory.com everywhere (footer, landing FAQ, community note, privacy and terms pages).
- **Terms updated to match the product**: community is likes-only (no comments/reposts; audio stays family-only); free allowance 20 stories; the Family plan is a subscription that auto-renews and can be cancelled in Settings; no "download" promise (export doesn't exist yet). The 7-day refund line is unchanged until Helen and her mother decide.
- **Photo location data removed**: `cleanPhoto()` in `db.js` redraws JPEG/PNG/WebP/HEIC photos in the browser before upload, which drops EXIF (GPS, camera, time) and caps the long edge at 2560px. If a browser can't open the file (e.g. HEIC on Chrome) it is uploaded unchanged.
- **Deleting a story also deletes its photos and videos** from storage (before, only the recording was removed).
- The privacy page text itself is Helen's to replace (draft in progress).

## 2026-10-25 · Helen's UI review — bug fixes + community translation (fix16)
- **Migration `010_join_translate.sql`** (run once): `join_family` now also removes an *empty* family of your own (only you, no stories) so an invited relative always lands in the right family; `stories.translations` caches translations.
- **"Grandpa Tong" leak fixed**: the new-storyteller form used to start from the sample profile, so its English twins (`nameEn: 'Grandpa Tong'`, `hometownEn`…) were saved with real storytellers and showed in English mode; "Skip" saved the whole sample. Now the form starts empty, Skip saves only a placeholder name, and `stripEn()` removes `*En` fields from every real storyteller on read and write (existing data is cleaned on display and on next save). The sample-data import button is gone for real accounts (a "remove sample stories" link stays only if some were imported).
- **Names**: sign-up asks for your name; Settings → Account has "My name" (saved to `profiles.name` + account metadata). Your saved name/photo load with the family. The story page shows the story's own storyteller, not the currently selected one.
- **AI polish is real**: `api/polish.js` (signed-in users only) smooths wording with qwen-plus; the server rejects any result that grows the text, drops a [marked] word or changes the paragraph count. "Undo polish" restores the previous text. (Before, it ran an offline sample that appended a fixed sentence.)
- **Notes visible on the saved story**: a Notes list under the text (pending ones marked; readers in the community only see confirmed ones). The community read page now shows confirmed notes too.
- **Questions**: own questions have a Remove button right in the list.
- **Family page**: new "Family stories" list — every story in the family, with storyteller and who recorded it. Story/edit pages open stories of any storyteller in the family.
- **Community translation (zh ↔ en)**: `api/translate.js` translates a *published* story (title, text, confirmed notes) once per language and caches it on the story; the read page has "Translate to English / 翻译成中文" ↔ "Show original". Uses `SUPABASE_SECRET_KEY` + the Alibaba key already in Vercel.
- Smaller: fake "Export everything" and fake "Delete account" removed (delete = email hello@echoestory.com, as the privacy page says); fake "Follow" removed; community shows no grey boxes for stories without photos; `/pricing` goes to the homepage pricing section; `<html lang>` follows the interface language and the language choice is remembered; "1 note / 2 notes"; "问他" → "问一问"; photos are free for everyone (removed from paid perks on the upgrade page and homepage; no "download" or "export" promises).
- Still waiting on Helen + her mom: price ($9 vs $9.99, yearly), free stories (10 vs 20), auto-renew wording, family-member limit.

## 2026-10-25 · Pricing decided (fix17) — US$4.99/month, US$19.99 lifetime, 10 free stories
- **Rules**: Free = 10 stories, 1 storyteller, 1 invited family member, photos/video free. Family plan = no limits, paid **monthly (US$4.99, auto-renews)** or **lifetime (US$19.99, once)**. All prices shown in US dollars in both languages. Stopping payment keeps everything readable; members who already joined stay, no new invites.
- **Vercel env**: `STRIPE_PRICE_ID` = the monthly recurring price; new `STRIPE_PRICE_ID_LIFETIME` = the one-time price. Without the lifetime variable the upgrade page simply shows monthly only.
- `api/checkout.js`: GET returns both prices; POST takes `plan: 'monthly' | 'lifetime'` (lifetime = Checkout in payment mode) and refuses a family that already pays. `api/stripe-webhook.js`: a paid one-time Checkout saves `status: 'lifetime'`; subscription events never downgrade a lifetime family; a subscription cancelled in the portal is kept as `status: 'cancelling'` (still Family until the period ends).
- **Migration `011_free_family_limit.sql`**: `join_family` refuses a new member when a free family already has 2 people. The Family page hides the invite code at the limit and offers the upgrade.
- Upgrade page: choose Monthly / Lifetime; refund line ("email hello@echoestory.com") with links to Terms and Privacy. Settings shows "Lifetime · paid once" or the renewal / "cancelled — active until" date. Homepage pricing, terms ("Prices, payment and refunds") and every "10 / 20 stories" mention now agree. Every signed-in page has a footer with Privacy · Terms · contact email.
- WeChat Pay / Alipay: no code needed — Checkout shows the payment methods switched on in Stripe → Settings → Payment methods. Both work for one-time payments (Lifetime) only; neither supports monthly subscriptions in Checkout.

## 2026-10-25 · Design system v1 + rebrand + UI polish (fix18)
- **`DESIGN.md`** (repo root) is now the source of truth for colour, type, shape, components, navigation and the rules any AI must follow. Visual reference: `docs/design-system.html`. Tokens live in `src/index.css` → `@theme`.
- **Palette A** from the new logo: navy `primary #1E3A5F` for every action, gold `#D9A94F` for decoration only (underlines, rings, focus, note highlights), `gold-ink #8F6224` when gold must be text, warm paper `#F8F6F1`, navy-black text `#16202E`. Old token names (`accent`, `ochre`, `mark`…) are mapped onto the new palette so existing classes keep working.
- **Style**: one 4px radius everywhere; round avatars (yourself / active storyteller get a gold ring); gold brush-stroke underline on the selected nav item; `.wash` gold→blue watercolour placeholder instead of grey boxes; gold focus ring on inputs; confirmed note words highlighted (gold-soft + gold underline); navy photo overlay; faint logo watermark behind the landing hero. Logos now load as 256px WebP (`mark.webp`, `mark-white.webp`, ~50 KB instead of ~550 KB).
- **Phones**: the top menu is replaced by a bottom tab bar (Stories · Family · Record · Community · Settings), hidden while recording/reviewing; no page scrolls sideways at 390px.
- **Language**: signed-in people switch it in Settings → Language (remembered on the device); visitors and sign-up pages keep the 中/EN switch.
- **Translation everywhere**: the family's own story page has "Translate to English/Chinese" (unpublished stories too — `api/translate.js` lets family members translate their own stories); community cards have an inline "译" toggle.
- **Export (free)**: Settings → "Export as a PDF book" opens `/book`, a print-ready story book (cover, contents, one story per page with notes and photos) and opens the print dialog → "Save as PDF".
- Smaller: story rows are real links (open in new tab); the suggested next question skips fragments like "南昌话" and the question box nudges towards a full question. Home "Your story book" block: free plan shows the 10-story allowance; export works any time with any number of stories (link straight to /book).
- **fix19 (Helen's test of the paid plan)**: the Family page's "+ Add a storyteller" went to `/mode` without `?add=1`, so the onboarding guard sent people straight back to Stories — fixed (and the back button keeps `add=1`). "Myself" / "my grandpa" labels were shown to every family member, so Helen's mom saw Helen's own storyteller as "myself" and thought her name had changed. New storytellers now save `createdBy`; only that person sees "myself / my …" (older ones count as the family creator's). Everyone else sees "tells their own story" / the relation alone. `profile.isSelf` drives "My stories", "for you" etc.
