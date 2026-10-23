import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Public, { useScrollOnArrive, useScrollTo } from '../components/Public';
import { Mark } from '../components/Illos';
import { useT } from '../lib/i18n';
import { SAMPLE_STORIES } from '../mock/data';
import { C, DIALECTS } from './landingCopy';
import coverC4 from '../assets/cover_c4.jpg';
import stepA from '../assets/cover_c2.jpg';
import stepB from '../assets/photo_es.jpg';
import stepC from '../assets/cover_c6.jpg';
import stepD from '../assets/cover_c7.jpg';
const STEP_PHOTOS = [stepA, stepB, stepC, stepD];


// Editorial landing: ink on paper. Type carries the page; hairlines, not cards; one photo per section at most.

const NUM = { zh: ['一', '二', '三', '四', '五', '六'], en: ['I', 'II', 'III', 'IV', 'V', 'VI'] };
const Rich = ({ parts }) => parts.map((x, i) => (typeof x === 'string' ? x : <mark key={i}>{x[0]}</mark>));

function SectionHead({ n, eyebrow, title, lang, wide = false }) {
  return (
    <div className={'mb-12 ' + (wide ? '' : 'max-w-[60ch]')}>
      <div className="flex items-center gap-4 mb-5"><span className="ed-num">{NUM[lang][n]}</span><span className="ed-caps">{eyebrow}</span></div>
      <h2 className="ed-h2 m-0">{title}</h2>
    </div>
  );
}

export default function Landing() {
  const { lang } = useT(); const c = C[lang]; const nav = useNavigate(); const scrollTo = useScrollTo(); useScrollOnArrive();
  const zh = lang === 'zh';
  const [open, setOpen] = useState(0); const [yearly, setYearly] = useState(true); const [pickId, setPickId] = useState(null);
  const story = SAMPLE_STORIES.find((x) => x.id === pickId) || SAMPLE_STORIES.find((x) => x.lang === lang) || SAMPLE_STORIES[0];
  const sName = zh ? story.name : story.nameEn;

  return (
    <Public>
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden min-h-[560px]">
        <div className="ed-wrap relative pt-14 md:pt-20 pb-16 grid md:grid-cols-[1.05fr_0.95fr] gap-14 md:gap-20 items-center">
          <div className="relative">
            <div className="flex items-center gap-4 mb-7"><i className="ed-dash" /><span className="ed-caps">{c.eyebrow}</span></div>
            <h1 className="ed-h1 m-0">{c.h1[0]}<br />{c.h1[1]}<span className={'ed-ital ' + (zh ? 'zh' : '')}>{c.h1[2]}</span>{zh && <br />}{c.h1[3]}</h1>
            <p className="ed-lede mt-8">{c.sub}</p>
            <div className="flex flex-wrap items-center gap-7 mt-10">
              <button className="ed-btn" onClick={() => nav('/signup')}>{c.cta} <span aria-hidden>→</span></button>
              <button className="ed-link" onClick={() => scrollTo('sample')}>{c.cta2}</button>
            </div>
            <p className="ed-caps mt-5 !text-ink-3">{c.ctaSub}</p>
          </div>
          <figure className="m-0 md:justify-self-end w-full max-w-[440px]">
            <div className="ed-frame"><img src={story.photo} alt="" className="block w-full aspect-[4/5] object-cover ed-wash" /></div>
            <figcaption className="ed-caption"><span>{sName} · {zh ? story.photoCaption : story.photoCaptionEn}</span><span>{story.duration}</span></figcaption>
          </figure>
        </div>
        <div className="ed-wrap"><div className="ed-hair pt-5 pb-2 flex flex-wrap gap-x-8 gap-y-2 ed-caps">{c.trust.map((x) => <span key={x}>{x}</span>)}</div></div>
      </section>

      {/* ---------- dialect run ---------- */}
      <div className="ed-hair border-b border-line overflow-hidden py-5 mt-10 fade-x">
        <div className="ed-marq">{[...DIALECTS[lang], ...DIALECTS[lang]].map((d, i) => <span key={i}>{d}</span>)}</div>
      </div>

      {/* ---------- 01 how ---------- */}
      <section id="how" className="scroll-mt-24 section">
        <div className="ed-wrap">
          <SectionHead n={0} eyebrow={c.howEyebrow} title={c.howT} lang={lang} />
          <div>
            {c.how.map(([t, d], i) => (
              <div key={t} className="ed-row !grid-cols-[64px_1fr] md:!grid-cols-[120px_1fr_440px] !gap-x-10 !gap-y-5 !py-10 items-center">
                <span className="ed-step">{NUM[lang][i]}<small>STEP {i + 1}</small></span>
                <div><div className="ed-h3 mb-3">{t}</div><p className="m-0 text-ink-2 leading-[1.85] max-w-[30em]">{d}</p></div>
                <img src={STEP_PHOTOS[i]} alt="" className="block w-full aspect-[3/2] object-cover col-span-2 md:col-span-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- photo band ---------- */}
      <div className="relative h-[46vh] min-h-[320px] overflow-hidden">
        <img src={coverC4} alt="" className="absolute inset-0 w-full h-full object-cover ed-wash" />
        <div className="absolute inset-0 bg-ink/35" />
        <div className="absolute inset-x-0 bottom-0 ed-wrap pb-8 text-[#F3EFE8]"><p className="serif text-[22px] md:text-[28px] italic m-0 max-w-[36ch] leading-snug">{zh ? '"食未"不是问你吃没吃，是说我看见你了，你回来了。' : '“Have you eaten?” isn’t about food. It means: I see you — you’re home.'}</p><p className="ed-caps !text-[#D8D2C9] mt-3">{zh ? '阿嬷 · 潮州 · 1941' : 'Ah Ma · Chaozhou · 1941'}</p></div>
      </div>

      {/* ---------- 02 why ---------- */}
      <section id="why" className="scroll-mt-24 section">
        <div className="ed-wrap">
          <SectionHead n={1} eyebrow={c.whyEyebrow} title={c.whyT} lang={lang} />
          <div className="grid md:grid-cols-3 gap-10">
            {c.why.map(([t, d], i) => (
              <div key={t} className="ed-hair pt-6"><div className="ed-num mb-4">0{i + 1}</div><h3 className="ed-h3 mb-3">{t}</h3><p className="m-0 text-ink-2 leading-relaxed">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 03 sample: typeset like a page, notes in the margin ---------- */}
      <section id="sample" className="scroll-mt-24 section bg-card ed-hair border-b border-line">
        <div className="ed-wrap">
          <SectionHead n={2} eyebrow={c.sampleEyebrow} title={zh ? story.title : story.titleEn} lang={lang} />
          <div className="grid md:grid-cols-[180px_1fr_240px] gap-12 items-start">
            <div className="md:sticky md:top-28">
              <div className="ed-caps mb-3">{c.switchHint}</div>
              <div className="ed-tabs grid">{SAMPLE_STORIES.map((st) => <button key={st.id} className={'text-left ' + (st.id === story.id ? 'on' : '')} onClick={() => setPickId(st.id)}>{zh ? st.name : st.nameEn}<span className="block ed-caps !text-ink-3 !normal-case !tracking-normal">{zh ? st.place : st.placeEn} · {st.birth}</span></button>)}</div>
              <div className="mt-8 ed-frame !p-1.5"><img src={story.photo} alt="" className="block w-full aspect-[4/5] object-cover ed-wash" /></div>
              <p className="ed-caps !text-ink-3 mt-3 m-0">{zh ? story.recordedBy : story.recordedByEn}</p>
            </div>
            <article className="max-w-[60ch]">
              {story.lang !== lang && <p className="ed-caps !text-ink-3 mb-6">{zh ? `故事保留讲述者的语言（${story.dialectEn}）` : `Told in the storyteller’s language (${story.dialectEn})`}</p>}
              <div className="ed-story">{story.paragraphs.map((pg, i) => <p key={i} className={i === 0 ? 'ed-dropcap' : ''}><Rich parts={pg} /></p>)}</div>
              <div className="ed-play mt-6"><span className="serif text-[15px] text-ink">▶</span><span className="line" /><span>{zh ? '原声' : 'Original'} · {story.duration}</span></div>
            </article>
            <aside className="grid gap-6 md:pt-2">
              <div className="ed-caps">{zh ? '注释 · 家人已确认' : 'Notes · confirmed by family'}</div>
              {story.terms.map((tm) => <div key={tm.word} className="ed-side"><b className="text-ink">{tm.word}</b> <span className="opacity-70">{zh ? tm.kind : tm.kindEn}</span><br />{zh ? tm.note : tm.noteEn}</div>)}
            </aside>
          </div>
        </div>
      </section>

      {/* ---------- founder ---------- */}
      <section className="section">
        <div className="ed-wrap max-w-[760px] text-center">
          <div className="flex justify-center mb-8"><Mark size={120} /></div>
          <div className="ed-caps mb-5">{c.founderEyebrow}</div>
          <h2 className="ed-h2 mb-8">{c.founderT}</h2>
          <p className="serif italic text-[19px] md:text-[21px] leading-[1.9] text-ink-2 m-0">{c.founder}</p>
          <div className="flex justify-center mt-10"><i className="ed-dash !w-[80px]" /></div>
        </div>
      </section>

      {/* ---------- 04 pricing ---------- */}
      <section id="pricing" className="scroll-mt-24 section ed-hair">
        <div className="ed-wrap">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <SectionHead n={3} eyebrow={c.priceEyebrow} title={c.priceT} lang={lang} />
            <div className="ed-caps flex items-center gap-3 pb-3"><button className={(!yearly ? 'text-ink' : 'text-ink-3') + ' cursor-pointer'} onClick={() => setYearly(false)}>{c.month}</button><span className="text-ink-3">/</span><button className={(yearly ? 'text-ink' : 'text-ink-3') + ' cursor-pointer'} onClick={() => setYearly(true)}>{c.year}</button><span className="text-ochre-2">· {c.save}</span></div>
          </div>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {[{ name: c.free, price: zh ? '¥0' : '$0', per: '', sub: c.freeSub, list: c.freeList, rec: false }, { name: c.pro, price: yearly ? c.proPriceY : c.proPriceM, per: yearly ? c.per[1] : c.per[0], sub: yearly ? (zh ? '相当于 ¥48 / 月' : 'about $6.6 / mo') : (zh ? '随时取消' : 'Cancel any time'), list: c.proList, rec: true }].map((pl) => (
              <div key={pl.name} className="ed-hair pt-6">
                <div className="flex items-baseline justify-between"><span className="ed-caps">{pl.name}</span>{pl.rec && <span className="ed-caps text-ochre-2">{c.rec}</span>}</div>
                <div className="serif text-[56px] font-medium leading-none mt-5">{pl.price}<span className="text-[18px] text-ink-2 ml-2">{pl.per}</span></div>
                <div className="text-ink-2 mt-2 mb-7">{pl.sub}</div>
                <ul className="m-0 p-0 list-none">{pl.list.map((x) => <li key={x} className="py-2.5 border-t border-line-2 text-[15px]">{x}</li>)}</ul>
                <div className="mt-8">{pl.rec ? <button className="ed-btn" onClick={() => nav('/signup')}>{c.proCta} →</button> : <button className="ed-btn ghost" onClick={() => nav('/signup')}>{c.proCta}</button>}</div>
              </div>
            ))}
          </div>
          <p className="text-[14px] text-ink-2 mt-10 max-w-[62ch]">{c.note}</p>
        </div>
      </section>

      {/* ---------- 05 faq ---------- */}
      <section id="faq" className="scroll-mt-24 section ed-hair">
        <div className="ed-wrap grid md:grid-cols-[0.7fr_1.3fr] gap-12">
          <div><SectionHead n={4} eyebrow={c.faqEyebrow} title={c.faqT} lang={lang} /><p className="text-ink-2 -mt-6">{zh ? '没找到答案？' : 'Something else?'} <a href="mailto:hello@echoestory.com" className="ed-link !text-[14px]">hello@echoestory.com</a></p></div>
          <div className="ed-faq">
            {c.faq.map(([q, a], i) => (
              <div key={q} className="ed-hair py-5">
                <button className="w-full text-left flex items-start gap-5 cursor-pointer" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span className="ed-num pt-1 w-6">{String(i + 1).padStart(2, '0')}</span><span className="flex-1 serif text-[19px]">{q}</span><span className="serif text-[22px] leading-none text-ink-3">{open === i ? '–' : '+'}</span></button>
                {open === i && <p className="text-ink-2 pl-11 pt-3 m-0 max-w-[60ch] leading-relaxed">{a}</p>}
              </div>
            ))}
            <div className="ed-hair" />
          </div>
        </div>
      </section>

      {/* ---------- end ---------- */}
      <section className="relative overflow-hidden ed-hair">
        <div className="ed-wrap relative py-32 md:py-44 text-center">
          <h2 className="ed-h2 m-0">{c.endT}</h2>
          <p className="ed-lede mx-auto mt-6 text-center">{c.endSub}</p>
          <div className="mt-10"><button className="ed-btn" onClick={() => nav('/signup')}>{c.cta} →</button></div>
          <p className="ed-caps !text-ink-3 mt-5">{c.ctaSub}</p>
        </div>
      </section>
    </Public>
  );
}
