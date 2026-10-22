import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Shell, { Audio } from '../components/Shell';
import { useT } from '../lib/i18n';
import { useStore, FREE_LIMIT } from '../lib/store';
import { QUESTIONS, transcribeAndTidy } from '../mock/data';
import { hasSupabase } from '../lib/supabase';
import { uploadAudio, getAudioUrl } from '../lib/db';
import { fillQ } from './Home';
import { profileView } from '../lib/loc';

const fmt = (s) => Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);

export function useQuestion() {
  const { qid } = useParams(); const { state } = useStore(); const loc = useLocation(); const { lang } = useT();
  const qs = new URLSearchParams(loc.search);
  if (qid === 'own') return { id: qs.get('cq') || 'own', text: qs.get('text') || '', tags: ['自定义'] };
  const q = QUESTIONS.find((x) => x.id === qid) || QUESTIONS[0];
  return { ...q, text: fillQ(q, state.profile, lang) };
}

// One page, one job: record the answer. Top to bottom — the question, the button, and (quietly) the one alternative: upload a recording made elsewhere.
// Typing was removed on purpose: the elder speaks; family can edit text on the review page.
const TIPS = { zh: ['不用从头讲，想到哪说到哪。', '说到人名、地名，可以多说一句是谁、在哪。', '停下来想一想没关系，录音不会断。', '说方言就说方言，整理的时候会标出来。'], en: ['No need to start at the beginning — say what comes to mind.', 'When a name or place comes up, add a word about who or where.', 'Pausing to think is fine; the recording keeps going.', 'Dialect is welcome — it gets marked up afterwards.'] };

export default function Record() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { state, setDraft, allStories } = useStore();
  const p = profileView(state.profile, lang); const q = useQuestion();
  const [uploadErr, setUploadErr] = useState('');
  useEffect(() => { if (state.plan === 'free' && allStories.length >= FREE_LIMIT) nav('/upgrade?why=limit', { replace: true }); }, []);
  const who = p.mode === 'self' ? (zh ? '你' : 'yourself') : p.name;
  const [status, setStatus] = useState('idle'); // idle | recording | done
  const [sec, setSec] = useState(0); const [takes, setTakes] = useState([]);
  const [noMic, setNoMic] = useState(false); const [demo, setDemo] = useState(false);
  const rec = useRef(null), chunks = useRef([]), timer = useRef(null), fileRef = useRef(null), secRef = useRef(0);
  // One take is at most MAX_SEC (MVP: 3 minutes). A story is one question answered, not a whole afternoon —
  // and short takes keep the upload small and the tidy-up quick. Several takes can still be joined.
  const MAX_SEC = 180, WARN_SEC = 150;
  const stopTimer = () => { clearInterval(timer.current); timer.current = null; };
  useEffect(() => () => stopTimer(), []);

  const stopRef = useRef(null);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream); chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => { const blob = new Blob(chunks.current, { type: 'audio/webm' }); setTakes((ts) => [...ts, { blob, url: URL.createObjectURL(blob), sec: secRef.current }]); stream.getTracks().forEach((tr) => tr.stop()); };
      rec.current = mr; mr.start(); setDemo(false); setStatus('recording'); setSec(0); secRef.current = 0;
      timer.current = setInterval(() => setSec((s) => { secRef.current = s + 1; if (s + 1 >= MAX_SEC) setTimeout(() => stopRef.current?.(), 0); return s + 1; }), 1000);
    } catch { setNoMic(true); }
  };
  // Demo take for embedded previews where the mic is blocked. Remove before launch.
  const startDemo = () => { setDemo(true); setNoMic(false); setStatus('recording'); setSec(0); secRef.current = 0; timer.current = setInterval(() => setSec((s) => { secRef.current = s + 1; if (s + 1 >= MAX_SEC) setTimeout(() => stopRef.current?.(), 0); return s + 1; }), 1000); };
  const stop = () => { if (!timer.current) return; stopTimer(); if (demo) setTakes((ts) => [...ts, { blob: null, url: null, sec: Math.max(secRef.current, 1) }]); else rec.current?.stop(); setStatus('done'); };
  stopRef.current = stop;
  const hitMax = takes.length > 0 && takes[takes.length - 1].sec >= MAX_SEC;
  const redo = () => { stopTimer(); if (status === 'recording' && !demo) rec.current?.stop(); setTakes([]); setSec(0); secRef.current = 0; setDemo(false); setStatus('idle'); };
  const totalSec = takes.reduce((n, x) => n + x.sec, 0) + (status === 'recording' ? sec : 0);
  const last = takes[takes.length - 1];
  const proceed = () => {
    const blobs = takes.map((x) => x.blob).filter(Boolean);
    const merged = blobs.length > 1 ? new Blob(blobs, { type: blobs[0].type }) : blobs[0] || null;   // several takes → one recording, in order
    setDraft({ questionId: q.id, question: q.text, audioUrl: merged ? URL.createObjectURL(merged) : null, duration: fmt(totalSec), pending: true, blob: !!merged, typed: '' }); nav('/processing');
  };
  // Uploaded files arrive in every container under the sun (WeChat exports, voice memos, trimmed clips). Whatever the
  // browser can play, it can also decode — so every upload is re-encoded here to plain 16 kHz mono WAV before it goes
  // anywhere. One format for the speech model, real length known, and the 3-minute rule applies to uploads too.
  const toWav = async (file) => {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await ac.decodeAudioData(await file.arrayBuffer()); ac.close?.();
    const rate = 16000, len = Math.ceil(decoded.duration * rate);
    const off = new OfflineAudioContext(1, len, rate); const src = off.createBufferSource(); src.buffer = decoded; src.connect(off.destination); src.start();
    const mono = (await off.startRendering()).getChannelData(0);
    const buf = new ArrayBuffer(44 + mono.length * 2); const v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + mono.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, mono.length * 2, true);
    for (let i = 0; i < mono.length; i++) { const s = Math.max(-1, Math.min(1, mono[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
    const blob = new Blob([buf], { type: 'audio/wav' }); blob.name = 'upload.wav';
    return { blob, sec: Math.round(decoded.duration) };
  };
  const onUpload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; setUploadErr('');
    if (f.size > 200 * 1024 * 1024) { setUploadErr(zh ? '这个文件超过 200MB。可以分成几段，或者先压缩。' : 'Over 200MB. Split it or compress it first.'); return; }
    let out;
    try { out = await toWav(f); }
    catch { setUploadErr(zh ? '这个文件打不开。请换成 mp3、m4a 或 wav 再试；微信语音要先用手机"导出"成音频文件。' : 'This file could not be opened. Try mp3, m4a or wav; WeChat voice notes must be exported as an audio file first.'); return; }
    if (out.sec > MAX_SEC + 5) { setUploadErr(zh ? `这段有 ${Math.floor(out.sec / 60)} 分 ${out.sec % 60} 秒。一段最长 3 分钟，请先剪短，或者分成几段分别上传。` : `This clip is ${Math.floor(out.sec / 60)}m ${out.sec % 60}s. A take is at most 3 minutes — trim it, or upload it in parts.`); return; }
    stopTimer(); if (status === 'recording' && !demo) rec.current?.stop(); setDemo(false);
    setTakes([{ blob: out.blob, url: URL.createObjectURL(out.blob), sec: out.sec }]); setStatus('done');
  };
  const tip = TIPS[lang][Math.floor(sec / 15) % TIPS[lang].length];
  // Back = where you came from (stories, question bank, a story's follow-up…), never a fixed page. A take in progress asks first.
  const back = () => {
    if (status !== 'idle' && !window.confirm(zh ? '还没整理的录音会丢掉，确定离开？' : 'The recording hasn’t been tidied yet — leave anyway?')) return;
    stopTimer(); if (status === 'recording' && !demo) rec.current?.stop();
    if (window.history.length > 1) nav(-1); else nav('/home');
  };

  return (
    <Shell>
      <div className="max-w-[720px] mx-auto pt-4 md:pt-10 text-center">
        <div className="flex items-center justify-between mb-10">
          <button className="ed-caps hover:!text-ink cursor-pointer" onClick={back}>{t('nav.back')}</button>
          {status === 'idle' && <button className="ed-caps hover:!text-ink cursor-pointer" onClick={() => nav('/pick')}>{t('rec.changeQ')} →</button>}
        </div>
        <div className="ed-caps mb-5">{t('rec.eyebrow', { name: who })}</div>
        <p className="serif font-medium text-[30px] md:text-[36px] leading-[1.4] m-0">{q.text}</p>

        {status !== 'done' && (
          <div className="mt-14 mb-4 flex flex-col items-center">
            <button onClick={status === 'idle' ? start : stop} className={'rec-btn ' + (status === 'recording' ? 'on rec-ring' : '')} aria-pressed={status === 'recording'}>{status === 'idle' ? t('rec.start') : t('rec.stop')}</button>
            <div className="h-[56px] mt-6 text-[14.5px] text-ink-2 tabular-nums">
              {status === 'idle' && <span>{t('rec.hint')}<span className="block text-ink-3 mt-1">{zh ? '一段最长 3 分钟，讲不完可以再录一段。' : 'Up to 3 minutes per take; add another take if there is more.'}</span></span>}
              {status === 'recording' && <><span className="text-rec">● {fmt(sec)}</span><span className="text-ink-3"> · {zh ? '还剩' : 'left'} {fmt(Math.max(MAX_SEC - sec, 0))}</span><span className={'block mt-1 ' + (sec >= WARN_SEC ? 'text-accent' : 'text-ink-3')}>{sec >= WARN_SEC ? (zh ? '快到 3 分钟了。说完这句就停，长的故事可以再录一段。' : 'Almost 3 minutes. Finish the thought; longer stories can continue in another take.') : tip}</span></>}
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="mt-12 text-left">
            <div className="flex items-baseline justify-between mb-2"><span className="ed-caps">{t('rec.done', { t: fmt(totalSec) })}{takes.length > 1 ? ' · ' + t('rec.takes', { n: takes.length }) : ''}</span>{takes.some((x) => !x.url) && <span className="ed-caps !text-accent">{t('rec.demoTake')}</span>}</div>
            <div className="divide-y divide-line border-t border-b border-line">
              {takes.map((tk, i) => (
                <div key={i} className="py-3 grid grid-cols-[64px_1fr_auto] items-center gap-4">
                  <span className="ed-caps">{zh ? `第 ${i + 1} 段` : `Take ${i + 1}`}</span>
                  <Audio label={t('rec.listen')} dur={fmt(tk.sec)} src={tk.url} />
                  <button className="link-soft text-[13px]" onClick={() => { const next = takes.filter((_, k) => k !== i); setTakes(next); if (!next.length) setStatus('idle'); }}>{zh ? '删除' : 'Remove'}</button>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-ink-3 mt-2 mb-0">{hitMax ? (zh ? '到 3 分钟自动停了，这一段已经收好。还有话说就点"再录一段"，几段会按顺序接成一个故事。' : 'Stopped at 3 minutes and saved. Tap "Record another take" if there is more — takes are joined in order into one story.') : (zh ? '几段会按顺序接成一个故事。' : 'Takes are joined in order into one story.')}</p>
            <button className="btn btn-primary btn-lg w-full mt-6" onClick={proceed}>{t('rec.process')} →</button>
            <div className="flex justify-center gap-8 mt-5 text-[14px]"><button className="link-soft" onClick={demo ? startDemo : start}>{t('rec.again')}</button><button className="link-soft" onClick={redo}>{t('rec.redo')}</button></div>
          </div>
        )}

        {noMic && (
          <div className="mt-2 mb-8 border-l-2 border-accent pl-5 py-1 text-[14px] text-left max-w-[520px] mx-auto">
            <b>{zh ? '这里拿不到麦克风。' : 'Can’t reach the microphone here.'}</b>
            <p className="m-0 mt-1 text-ink-2">{zh ? '在 claude.ai 的预览窗口里不允许录音；用单文件版本在浏览器里打开就能真的录。要先走通流程，可以用演示录音。' : 'Embedded previews block recording. Open the single-file build in a browser tab to really record. To walk the flow now, use a demo take.'}</p>
            <button className="link mt-3 text-[14px]" onClick={startDemo}>{zh ? '用演示录音继续' : 'Continue with a demo take'} →</button>
          </div>
        )}

        {status === 'idle' && (
          <p className="text-[14px] text-ink-3 mt-6">{zh ? '已经用手机或电话录好了？' : 'Already recorded on a phone?'} <button className="link-soft" onClick={() => fileRef.current.click()}>{t('rec.uploadBtn')}</button></p>
        )}
        <input ref={fileRef} type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.amr,.ogg,.opus,.wma,.caf,.mp4" className="hidden" onChange={onUpload} />
        {uploadErr && <p className="text-[13.5px] text-rec mt-3">{uploadErr}</p>}
      </div>
    </Shell>
  );
}

export function Processing() {
  const { t, lang } = useT(); const zh = lang === 'zh'; const nav = useNavigate(); const { state, setDraft } = useStore();
  const [step, setStep] = useState(0); const [failed, setFailed] = useState(false); const [err, setErr] = useState(''); const [attempt, setAttempt] = useState(0); const [long, setLong] = useState(false); const draft = state.draft; const p = state.profile;
  useEffect(() => {
    setFailed(false); setStep(0);
    if (!draft) { nav('/home', { replace: true }); return; }
    if (draft.text) { nav('/review', { replace: true }); return; }   // already tidied → straight back to review
    let alive = true;
    (async () => {
      setTimeout(() => alive && setStep(1), 700); setTimeout(() => alive && setStep(2), 1500);
      let res; let id = 'new-' + Date.now(); let audioPath = null;
      try {
        const blob = draft.blob && draft.audioUrl ? await fetch(draft.audioUrl).then((r) => r.blob()) : null;
        const live = hasSupabase && !state.demo && state.family?.id;
        let link = null;
        if (live && blob && blob.size > 0) {
          // 1. The recording goes to Storage first, under the id this story will keep. 2. The AI gets a temporary link, not the bytes.
          id = crypto.randomUUID();
          audioPath = await uploadAudio(state.family.id, id, blob);
          link = await getAudioUrl(audioPath);
        }
        const [m, sec] = String(draft.duration || '0:00').split(':').map(Number);
        res = await transcribeAndTidy({ audioBlob: blob, audioUrl: link, durationSec: (m || 0) * 60 + (sec || 0), typedText: draft.typed, question: draft.question, profile: p, simulateFail: false, lang, allowSample: state.demo || !hasSupabase, onStatus: (s) => alive && setLong(s === 'long') });
      } catch (e) { console.error('tidy failed:', e); if (alive) { setErr(String(e.message || e)); setFailed(true); } return; }
      if (!alive) return;
      setStep(3);
      const story = { id, questionId: draft.questionId, question: draft.question, date: new Date().toISOString().slice(0, 10), duration: draft.duration, audioUrl: draft.audioUrl, audioPath, published: false, media: [], style: 'narrative', ...res };
      setDraft(story);
      setTimeout(() => alive && nav('/review'), 500);
    })();
    return () => { alive = false; };
  }, [attempt]);
  const S = ({ i, label }) => <div className={'flex items-center gap-4 text-[16px] py-3 border-t border-line ' + (step >= i ? 'text-ink' : 'text-ink-3')}><span className={'step-dot ' + (step > i ? 'done' : step === i ? 'now' : '')}>{step > i ? '✓' : i + 1}</span>{label}</div>;
  return (
    <Shell>
      <div className="max-w-[560px] mx-auto pt-16">
        <div className="ed-caps mb-4">{zh ? '正在整理' : 'Tidying up'}</div>
        <h1 className="serif font-medium text-[32px] leading-[1.25] m-0 mb-3">{t('proc.title', { name: p?.mode === 'self' ? (zh ? '你' : 'your') : p?.name })}</h1>
        <p className="text-ink-2 mb-10">{long ? (zh ? '这段录音比较长，整理需要几分钟。可以先去倒杯水，这一页会自己更新。' : 'This is a long recording — tidying takes a few minutes. This page updates by itself.') : t('proc.sub')}</p>
        {failed ? (
          <div className="border-t border-ink pt-5"><h2 className="h2 mb-2">{zh ? '这一次没能整理出来，录音没有丢。' : 'Tidy-up failed this time. The recording is safe.'}</h2><p className="text-ink-2 text-[14.5px] mb-2">{zh ? '通常是网络的问题。可以马上再试一次；如果还是不行，录音会留在草稿里。' : 'Usually a network hiccup. Try again; otherwise the recording stays in drafts.'}</p>{err && <p className="text-[12.5px] text-ink-3 mb-5 font-mono break-all">{err}</p>}<div className="flex items-center gap-6"><button className="btn btn-primary" onClick={() => setAttempt((a) => a + 1)}>{zh ? '再试一次' : 'Try again'}</button><button className="link-soft text-[14px]" onClick={() => nav('/home')}>{zh ? '先回故事页' : 'Back to stories'}</button></div></div>
        ) : (
          <div className="border-b border-line"><S i={0} label={t('proc.s1')} /><S i={1} label={t('proc.s2')} /><S i={2} label={t('proc.s3')} /></div>
        )}
      </div>
    </Shell>
  );
}
