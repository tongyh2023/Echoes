// Demo-content localisation. Seed data carries optional *En fields so the English interface never shows Chinese
// demo content. Real user content has no *En fields and is shown as recorded (translation is a product feature, not UI i18n).
const pick = (o, k, lang) => (lang === 'en' && o && o[k + 'En'] != null ? o[k + 'En'] : o?.[k]);
export const storyView = (s, lang) => (!s || lang !== 'en' || !s.textEn) ? s : {
  ...s, title: s.titleEn || s.title, topics: s.topicsEn || s.topics, people: s.peopleEn || s.people, place: s.placeEn || s.place,
  text: { ...s.text, first: s.textEn }, terms: s.terms.map((t) => ({ ...t, word: t.wordEn || t.word, orig: t.word, kind: t.kindEn || t.kind, note: t.noteEn || t.note })),
};
export const postView = (p, lang) => (!p || lang !== 'en') ? p : { ...p, title: p.titleEn || p.title, excerpt: p.excerptEn || p.excerpt, body: p.bodyEn || p.body, author: p.authorEn || p.author, authorSub: p.authorSubEn || p.authorSub, place: p.placeEn || p.place, topics: p.topicsEn || p.topics };
export const profileView = (p, lang) => (!p || lang !== 'en') ? p : { ...p, name: p.nameEn || p.name, relation: p.relationEn || p.relation, hometown: p.hometownEn || p.hometown, livesIn: p.livesInEn || p.livesIn, places: p.placesEn || p.places };
export const qView = (q, lang) => (!q || lang !== 'en') ? q : { ...q, text: q.textEn || q.text, tags: q.tagsEn || q.tags };
export const catLabel = (c, lang) => pick(c, 'label', lang);
