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
