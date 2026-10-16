# Echoes · 余音

Family oral-history web app — record an elder's stories in their own voice, tidy them into readable text with notes, keep them for the family.

## Run locally
```
npm install
npm run dev
```

## Deploy
Connected to Vercel: every push to `main` builds and deploys automatically.
Build command `npm run build`, output `dist` (Vercel detects Vite).

## Where things are
- `src/pages` — one file per screen
- `src/components/Shell.jsx` — header, page primitives, audio player, avatars
- `src/mock/questions.js` — the question bank
- `src/mock/data.js` — sample data and the mock AI (`transcribeAndTidy`) to be replaced by the real backend
- `HANDOFF.md` — what to remove before launch and how the backend plugs in
