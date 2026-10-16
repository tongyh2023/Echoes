// Small, static compositions of the real product UI (same classes, same components) for the landing page.
// These replace illustrations: what the visitor sees is what the product looks like.
const Wave = ({ n = 30, lit = 10 }) => <span className="flex-1 flex items-center gap-[2px] h-5" aria-hidden>{Array.from({ length: n }).map((_, i) => <span key={i} className="flex-1 rounded-full bg-ochre" style={{ height: `${25 + Math.abs(Math.sin(i * 0.8) * 70)}%`, opacity: i < lit ? 1 : 0.25 }} />)}</span>;
const Frame = ({ children, className = '' }) => <div className={'ink-card overflow-hidden text-left shadow-soft ' + className}>{children}</div>;

export function MiniPick({ zh }) {
  const qs = zh ? [['饮食 · 家乡', '过年第一天早上，家里吃什么？是谁做的？'], ['物件', '家里有没有一件用了很多年、舍不得丢的东西？'], ['方言', '说一句只有老家人才懂的话。']]
    : [['Food · Home', 'What did your family eat on New Year morning? Who made it?'], ['Objects', 'Is there one thing at home you have kept for decades?'], ['Dialect', 'Say something only people from home would understand.']];
  return (
    <Frame className="p-3 grid gap-2">
      {qs.slice(0, 2).map(([tag, q], i) => <div key={q} className={'rounded-xl border px-3 py-2.5 ' + (i === 0 ? 'border-ink bg-card' : 'border-line bg-paper')}><div className="text-[9.5px] text-ink-3 mb-0.5">{tag}</div><div className="serif text-[12.5px] leading-snug">{q}</div></div>)}
    </Frame>
  );
}
export function MiniRecord({ zh }) {
  return (
    <Frame className="p-4 text-center">
      <div className="eyebrow mb-2 text-[9.5px]">{zh ? '对 童爷爷 说' : 'Ask Grandpa Tong'}</div>
      <div className="serif text-[13px] leading-snug mb-4">{zh ? '过年第一天早上，家里吃什么？' : 'What did your family eat on New Year morning?'}</div>
      <div className="wave flex items-end justify-center gap-[3px] h-6 mb-3" aria-hidden>{Array.from({ length: 15 }).map((_, i) => <span key={i} style={{ height: 6 + ((i * 7) % 16), animationDelay: (i * 0.07) + 's' }} />)}</div>
      <div className="mx-auto w-14 h-14 rounded-full bg-rec text-white text-[10px] font-medium flex items-center justify-center rec-ring">{zh ? '说完了' : 'Done'}</div>
      <div className="text-[10px] text-rec mt-2 tabular-nums">● 2:14</div>
    </Frame>
  );
}
export function MiniReview({ zh }) {
  return (
    <Frame className="p-3 grid grid-cols-[1.3fr_1fr] gap-2 items-start">
      <div>
        <div className="serif text-[12.5px] font-semibold mb-1.5">{zh ? '过年早上的年糕' : 'New Year rice cake'}</div>
        <p className="story m-0" style={{ maxWidth: 'none', fontSize: 10.5, lineHeight: 1.7 }}>{zh ? <>我小时候在南昌，过年第一天早上是一定要吃<mark className="ok">年糕</mark>的。那时候东西要凭<mark>粮票</mark>买……</> : <>In Nanchang we always had <mark className="ok">rice cake</mark> on New Year morning. Back then you needed <mark>ration coupons</mark>…</>}</p>
      </div>
      <div className="rounded-lg border border-ochre/60 bg-card p-2"><span className="tag text-[8.5px]">{zh ? '待确认' : 'Pending'}</span><div className="font-bold text-[11px] mt-1">{zh ? '粮票' : 'ration coupons'}</div><div className="text-[9px] text-ink-2 mb-1.5">{zh ? '1955–1993 凭票购粮' : 'Grain coupons, 1955–93'}</div><div className="flex gap-1"><span className="btn btn-primary btn-sm !px-2 !py-0.5 !text-[9px]">✓ {zh ? '对' : 'Yes'}</span><span className="btn btn-sm !px-2 !py-0.5 !text-[9px]">{zh ? '改一下' : 'Fix'}</span></div></div>
    </Frame>
  );
}
export function MiniStories({ zh }) {
  const rows = zh ? [['过年早上的年糕', '童年 · 饮食 · 南昌 · 4:12'], ['第一年在兰州教书', '工作 · 兰州 · 7:40'], ['父亲的那只手表', '物件 · 家人 · 南昌 · 2:55']] : [['New Year rice cake', 'Childhood · Food · Nanchang · 4:12'], ['First year teaching in Lanzhou', 'Work · Lanzhou · 7:40'], ['My father’s watch', 'Objects · Family · Nanchang · 2:55']];
  return (
    <Frame className="p-3">
      <div className="flex gap-1 mb-2">{(zh ? ['全部', '童年', '饮食', '1940s'] : ['All', 'Childhood', 'Food', '1940s']).map((x, i) => <span key={x} className={'chip !px-2 !py-0 !text-[9px] ' + (i === 0 ? 'on' : '')}>{x}</span>)}</div>
      <div className="grid gap-1.5">{rows.map(([t, m], i) => <div key={t} className="flex items-center gap-2 rounded-lg border border-line p-1.5"><span className="w-7 h-7 rounded-md bg-ochre-soft flex-none" /><span className="min-w-0"><span className="block serif text-[11px] font-semibold truncate">{t}</span><span className="block text-[9px] text-ink-3 truncate">{m}</span></span></div>)}</div>
      <div className="flex items-center gap-2 mt-2 rounded-lg bg-paper border border-line-2 px-2 py-1"><span className="w-4 h-4 rounded-full bg-ochre text-white text-[7px] flex items-center justify-center">▶</span><Wave /><span className="text-[9px] text-ink-2">4:12</span></div>
    </Frame>
  );
}
