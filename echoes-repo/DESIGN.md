# Echoes · 余音 — Design System v1

> **For anyone (or any AI) changing this site: read this file first.** Every new page, component or
> colour must follow it. If something you need isn't covered, extend this file in the same change —
> don't invent a one-off style in a page.

Last updated: 2026-10-25 · Palette A ("navy-led, gold accents") · Tokens live in `src/index.css` → `@theme`.

---

## 1. The idea

**Ink on warm paper, with the logo's navy and gold.** Echoes keeps elders' voices. It should feel like
a well-made family book: calm, warm, unhurried, a little old-world — never like a tech dashboard.

| Feel | Means in practice |
|---|---|
| Book, not app | Serif headings, generous white space, hairline dividers instead of boxes |
| Warm | Warm paper background, never pure white pages, never cold grey |
| Calm | One action colour (navy). Gold is a whisper, not a shout |
| Trustworthy for elders | Large readable text (story text 19px), strong contrast, obvious buttons |
| From the logo | Navy + gold, round shapes (avatars, record button), soft brush/watercolour accents used sparingly |

---

## 2. Colour

All colours are CSS variables (Tailwind 4 `@theme`), so they work as classes: `bg-primary`,
`text-gold-ink`, `border-line`, etc. **Never write a raw hex value in a page or component.**

### Core palette

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `paper` | `#F8F6F1` | Page background | — |
| `card` | `#FFFFFF` | Raised surfaces: inputs, cards, menus, modals | — |
| `ink` | `#16202E` | Body text, headings (navy-black) | 15.2 : 1 |
| `ink-2` | `#4A5363` | Secondary text | 7.2 : 1 |
| `ink-3` | `#666E7C` | Meta, captions, placeholders | 4.9 : 1 (on white) |
| `line` | `#E2DED6` | Hairlines, input borders | — |
| `line-2` | `#EEEBE5` | Faint fills, hover rows | — |
| `primary` | `#1E3A5F` | **The one action colour** — buttons, selected state, active tab | 10.7 : 1 |
| `primary-2` | `#142A47` | Primary hover / pressed; dark bands | — |
| `primary-soft` | `#E7EDF4` | Info notes, selected cards, hover on outline buttons | — |
| `gold` | `#D9A94F` | **Decoration only** — underlines, rings, focus, note marks | 2.8 : 1 ✗ text |
| `gold-ink` | `#8F6224` | Gold when it must be text: badges, eyebrow numbers, "pending" | 4.9 : 1 |
| `gold-soft` | `#F4E7C6` | Highlight behind confirmed notes; badge fill | — |
| `blue` | `#3E5F82` | In-text links where navy would look like a button | 6.2 : 1 |
| `rec` | `#9E3B2E` | Recording state and destructive actions **only** | — |
| `rec-soft` | `#F3E6E3` | Background for recording / destructive notices | — |

Logo source colours, for reference: light gold `#F0D890`, gold `#E4B460`, amber `#C0843C`,
mid blue `#486C90`, navy `#243C60`, deep navy `#183054`.

### Rules

1. **Navy acts, gold decorates.** Anything clickable that matters is navy. Gold marks, underlines, rings — it never carries meaning alone.
2. **Gold is never text** on paper or white (too faint). Use `gold-ink` when gold-coloured text is needed.
3. **One primary button per screen area.** Everything else is an outline button or a text link.
4. **Red only means "recording" or "this deletes something".**
5. Legacy token names (`accent`, `ochre`, `mark`, `ok`, `plum`, `sage`) still exist and are mapped onto this palette — prefer the new names in new code.

---

## 3. Typography

| Role | Font | Size / weight | Class |
|---|---|---|---|
| Display (landing) | Fraunces / Noto Serif SC | clamp(44–78px) / 500 | `.ed-h1` |
| Page title | serif | 32–40px / 500 | `.h1`, `PageHeader` |
| Section title | serif | 22px / 500 | `.h2` |
| Story text | serif | 19px, line-height 2.05 | `.story` |
| Question text | serif | 19px / 500 | `.q-text` |
| Body / UI | Inter / Noto Sans SC | 16px (14–15px in dense UI) | default |
| Eyebrow / caps | sans | 11.5px, letter-spacing .18em, uppercase | `.ed-caps`, `.eyebrow` |
| Meta | sans | 12.5–13.5px, `ink-3` | — |

- Chinese headings use the serif stack (思源宋体 / Songti). Never mix two serif families in one heading.
- Minimum text size 12px. Story text never below 17px (elders read these).
- Italic serif is only for the landing headline accent.

---

## 4. Shape, space, depth

| | Value | Notes |
|---|---|---|
| Radius | **4px** (`--radius-ui`) everywhere: buttons, inputs, cards, menus, modals, images | Photos inside frames: 2px |
| Round | Avatars, record button, tab-bar record button, step dots | Echoes the circular logo |
| Spacing | 4px grid; sections 64–112px apart on the landing, 32–56px in the app | Use Tailwind spacing |
| Page width | 1200px max (`.ed-wrap`), side padding 28px desktop / 16px phone | |
| Dividers | 1px `line` hairlines; section heads use a 1px `ink` rule | Prefer a hairline over a box |
| Shadow | `--shadow-soft` for menus/toasts, `--shadow-card` for modals only | No shadows on regular cards |
| Texture | Faint paper grain on `body` | Don't add other textures |

---

## 5. Components

Use these classes; don't restyle them in place.

| Component | Class / component | Rules |
|---|---|---|
| Primary button | `.btn .btn-primary` (`.btn-accent` = same, used for "Record") | Navy fill, white text, 4px radius. One per area |
| Outline button | `.btn` / `.btn-secondary` | Navy border + text; hover `primary-soft` |
| Text link | `.link` (navy text, gold underline) · `.link-soft` (grey, hairline) | Use `link-soft` for secondary actions |
| Sizes | `.btn-sm` · default · `.btn-lg` | Touch targets ≥ 40px tall on phones |
| Input | `.input` (boxed) · `.field` (underline only) | Focus: gold border + soft gold ring |
| Chip / filter | `.chip` (`.on` = gold underline) | Text-like, no pills |
| Segmented control | `.seg` (`button.on` = navy fill) | e.g. language switch |
| Tag / badge | `.tag`, `.tag-ok` (gold-soft fill, gold-ink text) | Small, uppercase spacing |
| Avatar | `<Avatar>` → `.avatar` round; `.me` = navy fill + gold ring | Active storyteller / yourself get the ring |
| Card | `.card`, `.tile`, `.ink-card` | White, 1px line, 4px radius, no shadow |
| Menu | `.menu` | White, line border, soft shadow, hover `primary-soft` |
| Modal | `bg-card border border-line rounded-[4px] shadow-[var(--shadow-card)] p-8` over `bg-ink/40` | One per screen |
| Toast | `useToast()` | Navy, white text, bottom centre |
| Note mark (story text) | `mark` / `mark.ok` inside `.story` | Confirmed: gold-soft fill + gold underline. Unconfirmed: dashed grey underline |
| Photo placeholder | `.wash` | Soft gold → blue watercolour. Never a grey box |
| Audio player | `<Audio>` | Round navy play button, navy bars |
| Record button | `.rec-btn` | Round, navy outline; red only while recording |

---

## 6. Navigation

- **Desktop**: top bar — logo, Stories · Family · Community, "Record a story" (navy), ♡ activity, your avatar.
  The selected item has a **short gold brush stroke** underneath (`.nav-on`). Use it only for navigation.
- **Phone (< 768px)**: the top bar keeps logo, ♡ and avatar. Navigation moves to a **bottom tab bar**:
  Stories · Family · (Record — round navy button with gold ring) · Community · Settings.
  The tab bar is hidden in focused flows (record, processing, review/edit).
- **Language**: signed-in people change it in **Settings → Language**. Visitors and sign-up pages keep the small 中 / EN switch in the header.
- Every signed-in page has a footer: © · Privacy · Terms · hello@echoestory.com (required by the payment provider).

---

## 7. Imagery & icons

- Photos: real, warm, documentary. Rounded 2–4px. Never stretched; `object-cover`.
- Missing photo → `.wash` placeholder (optionally the story's first character in faint navy).
- Icons: simple line icons, 1.6px stroke, `currentColor`, 20–22px. No filled/emoji icons in navigation.
- The logo is used as-is (`src/assets/mark.webp`, white version `mark-white.webp`). Faint logo watermark (5% opacity) only behind the landing hero.

---

## 8. Writing

- Plain, warm, short. Talk to families, not "users".
- Chinese and English always both exist (`src/lib/i18n.jsx` or inline `zh ? … : …`). Never ship one language only.
- Prices are always in **US dollars** with "USD" where space allows.
- Don't promise features that don't exist.

---

## 9. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use tokens (`bg-primary`, `text-ink-2`, `border-line`) | Write hex colours in pages |
| One navy primary action per area | Several filled buttons side by side |
| Gold for underlines, rings, highlights | Gold text, gold buttons, big gold areas |
| Hairlines and white space to group things | Boxes inside boxes, heavy borders |
| 4px radius everywhere | Mixed radii, pill buttons (except round avatars/record) |
| Serif for headings and story text | Serif for buttons, labels or meta |
| Check the phone layout at 390px — no sideways scrolling | Fixed widths that overflow on phones |
| Keep large gradients only in `.wash` placeholders and the PDF cover | Gradients on buttons, backgrounds or text |
| Soft shadows only on menus, toasts and modals | Shadows on cards and sections |

---

## 10. Rules for AI assistants editing this site

1. **Read this file before writing UI.** Reuse the classes in §5; if a new pattern is needed, add it to `src/index.css` with tokens and document it here in the same change.
2. **No raw hex values** in `.jsx` files. If a colour isn't in §2, ask before adding one.
3. Navy = action, gold = decoration, red = recording/destructive. No other colours carry meaning.
4. Every new screen must work at **390px wide** without horizontal scroll, and keep the phone tab bar in mind (bottom padding).
5. Every new string needs **Chinese and English**.
6. Keep contrast: text colours only `ink`, `ink-2`, `ink-3`, `primary`, `gold-ink`, `blue`, `rec`, or white on `primary`/`rec`.
7. Don't add new fonts, icon sets, shadows or radii.
8. When in doubt, choose the quieter option.
