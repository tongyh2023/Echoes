import markPng from '../assets/mark.png';
import markWhite from '../assets/mark-white.png';
// Hand-drawn-ish SVG illustrations in the product palette.
// All are 320×220 viewBox, scale with width. Colors come from CSS variables so they follow the theme.

const V = {
  ink: 'var(--color-ink)', ink2: 'var(--color-ink-2)', ink3: 'var(--color-ink-3)', line: 'var(--color-line)', line2: 'var(--color-line-2)',
  card: 'var(--color-card)', paper: 'var(--color-paper)', ochre: 'var(--color-ochre)', ochreSoft: 'var(--color-ochre-soft)',
  sage: 'var(--color-sage)', sageSoft: 'var(--color-sage-soft)', mark: 'var(--color-mark)', markInk: 'var(--color-mark-ink)', ok: 'var(--color-ok)', okSoft: 'var(--color-ok-soft)', plum: 'var(--color-plum)',
};
const Svg = ({ children, className = '', label }) => (
  <svg viewBox="0 0 320 220" className={'w-full h-auto block ' + className} role="img" aria-label={label} fill="none" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const Lines = ({ x, y, w, n = 3, gap = 10, color = V.line, last = 0.6 }) => (
  <g stroke={color} strokeWidth="3">{Array.from({ length: n }).map((_, i) => <line key={i} x1={x} y1={y + i * gap} x2={x + w * (i === n - 1 ? last : 1)} y2={y + i * gap} />)}</g>
);
const Serif = { fontFamily: 'var(--font-serif)' };
const Sans = { fontFamily: 'var(--font-sans)' };

// 01 · Pick a question: a deck of cards, the top one has a specific question and a place chip.
export function IlloQuestion({ zh = true }) {
  return (
    <Svg label="question cards">
      <rect x="70" y="58" width="190" height="120" rx="12" fill={V.card} stroke={V.line} transform="rotate(-6 165 118)" />
      <rect x="66" y="48" width="190" height="120" rx="12" fill={V.card} stroke={V.line} transform="rotate(3 161 108)" />
      <rect x="62" y="40" width="196" height="126" rx="12" fill={V.card} stroke={V.ink} strokeWidth="1.5" />
      <text x="80" y="70" style={Sans} fontSize="10" fill={V.ink3} letterSpacing="1.5">{zh ? '问题 · 过年' : 'QUESTION · NEW YEAR'}</text>
      <text x="80" y="98" style={Serif} fontSize="17" fill={V.ink} fontWeight="600">{zh ? '过年第一天早上，' : 'On New Year morning,'}</text>
      <text x="80" y="121" style={Serif} fontSize="17" fill={V.ink} fontWeight="600">{zh ? '家里一定吃什么？' : 'what did your family eat?'}</text>
      <rect x="80" y="134" width="60" height="18" rx="9" fill={V.ochreSoft} /><text x="110" y="146" textAnchor="middle" style={Sans} fontSize="10" fill={V.ochre}>{zh ? '南昌 · 1940s' : 'Nanchang · 1940s'}</text>
      <rect x="146" y="134" width="46" height="18" rx="9" fill={V.sageSoft} /><text x="169" y="146" textAnchor="middle" style={Sans} fontSize="10" fill={V.sage}>{zh ? '赣语' : 'Gan'}</text>
      <circle cx="236" cy="62" r="10" fill={V.ochre} /><path d="M232 62l3 3 6-6" stroke="#fff" strokeWidth="2" />
      <path d="M30 170c20-30 60-30 80 0" stroke={V.line} strokeWidth="2" strokeDasharray="3 5" />
    </Svg>
  );
}

// 02 · Record: microphone with rings and a live waveform.
export function IlloRecord({ zh = true }) {
  const bars = [8, 18, 30, 44, 26, 52, 36, 22, 40, 16, 28, 10];
  return (
    <Svg label="recording">
      <circle cx="110" cy="110" r="70" fill={V.ochreSoft} opacity=".6" />
      <circle cx="110" cy="110" r="52" fill={V.ochreSoft} />
      <circle cx="110" cy="110" r="34" fill={V.ochre} />
      <rect x="101" y="90" width="18" height="30" rx="9" fill="#fff" />
      <path d="M94 110c0 9 7 16 16 16s16-7 16-16M110 126v10M102 136h16" stroke="#fff" strokeWidth="2.5" />
      <g transform="translate(190 110)">{bars.map((h, i) => <rect key={i} x={i * 9} y={-h / 2} width="4" height={h} rx="2" fill={i % 3 === 0 ? V.ochre : V.ink3} />)}</g>
      <rect x="186" y="150" width="88" height="22" rx="11" fill={V.ink} /><circle cx="198" cy="161" r="4" fill={V.ochre} /><text x="208" y="165" style={Sans} fontSize="10.5" fill="#fff" letterSpacing=".5">REC · 02:14</text>
      <text x="186" y="64" style={Serif} fontSize={zh ? 12 : 10} fill={V.ink2}>{zh ? '“我母亲提前半个月开始攒……”' : '“Mother started saving two weeks early…”'}</text>
    </Svg>
  );
}

// 03 · Read it together: a page with highlighted terms and a note that gets confirmed.
export function IlloReview({ zh = true }) {
  return (
    <Svg label="review with notes">
      <rect x="36" y="30" width="170" height="160" rx="10" fill={V.card} stroke={V.line} />
      <text x="54" y="60" style={Serif} fontSize="13" fontWeight="600" fill={V.ink}>{zh ? '过年早上的年糕' : 'New Year rice cake'}</text>
      <Lines x={54} y={78} w={130} n={2} />
      <rect x="54" y="92" width="38" height="12" rx="3" fill={V.okSoft} stroke={V.ok} strokeWidth="1" /><text x="73" y="101.5" textAnchor="middle" style={Serif} fontSize="9" fill={V.ink}>{zh ? '年糕' : 'cake'}</text>
      <line x1="98" y1="98" x2="184" y2="98" stroke={V.line} strokeWidth="3" />
      <Lines x={54} y={116} w={130} n={1} />
      <line x1="54" y1="130" x2="112" y2="130" stroke={V.line} strokeWidth="3" />
      <rect x="118" y="124" width="38" height="12" rx="3" fill={V.mark} stroke={V.markInk} strokeWidth="1" /><text x="137" y="133.5" textAnchor="middle" style={Serif} fontSize="9" fill={V.ink}>{zh ? '粮票' : 'ration'}</text>
      <line x1="162" y1="130" x2="184" y2="130" stroke={V.line} strokeWidth="3" />
      <Lines x={54} y={146} w={130} n={3} last={0.4} />
      {/* note card */}
      <rect x="176" y="98" width="116" height="78" rx="10" fill={V.card} stroke={V.ink} strokeWidth="1.5" />
      <path d="M176 128l-10 6 10 6" fill={V.card} stroke={V.ink} strokeWidth="1.5" />
      <text x="188" y="118" style={Serif} fontSize="12" fontWeight="700" fill={V.ink}>{zh ? '粮票' : 'ration coupon'} <tspan style={Sans} fontSize="8.5" fontWeight="400" fill={V.ink3}>{zh ? '历史' : 'history'}</tspan></text>
      <text x="188" y="134" style={Sans} fontSize="9" fill={V.ink2}>{zh ? '1955–1993 凭票购粮' : 'Grain coupons, 1955–93'}</text>
      <rect x="188" y="146" width="40" height="18" rx="9" fill={V.ink} /><text x="208" y="158.5" textAnchor="middle" style={Sans} fontSize="9.5" fill="#fff">{zh ? '✓ 对' : '✓ Yes'}</text>
      <rect x="233" y="146" width="48" height="18" rx="9" fill={V.card} stroke={V.line} /><text x="257" y="158.5" textAnchor="middle" style={Sans} fontSize="9.5" fill={V.ink2}>{zh ? '改一下' : 'Fix'}</text>
      <circle cx="284" cy="58" r="16" fill={V.ochreSoft} /><text x="284" y="63" textAnchor="middle" style={Serif} fontSize="13" fill={V.ochre}>{zh ? '姑' : 'A'}</text>
      <path d="M270 70c-8 10-20 16-40 20" stroke={V.ochre} strokeWidth="1.5" strokeDasharray="2 4" />
    </Svg>
  );
}

// 04 · Keep it: an archive shelf of story volumes, one pulled out with a sound mark.
export function IlloArchive({ zh = true }) {
  const books = [[52, 40, V.sage], [80, 36, V.ink3], [112, 44, V.ochre], [142, 32, V.plum], [202, 42, V.ink3], [238, 38, V.sage]];
  return (
    <Svg label="archive shelf">
      <line x1="30" y1="170" x2="290" y2="170" stroke={V.ink} strokeWidth="3" />
      <line x1="30" y1="96" x2="290" y2="96" stroke={V.ink} strokeWidth="3" />
      {books.map(([x, w, c], i) => <g key={i}><rect x={x} y="106" width={w - 6} height="64" rx="3" fill={c} opacity=".9" /><text x={x + (w - 6) / 2} y="150" textAnchor="middle" style={Sans} fontSize="8" fill="#fff" transform={`rotate(-90 ${x + (w - 6) / 2} 150)`}>{(zh ? ['1936', '1950s', '兰州', '成都', '1980s', '家宴'] : ['1936', '1950s', 'Lanzhou', 'Chengdu', '1980s', 'Feasts'])[i]}</text></g>)}
      <g transform="translate(176 100) rotate(-8)"><rect x="-4" y="-2" width="30" height="70" rx="3" fill={V.card} stroke={V.ochre} strokeWidth="1.5" /><circle cx="11" cy="20" r="7" fill={V.ochre} /><path d="M8 20l2 2 4-4" stroke="#fff" strokeWidth="1.5" /><text x="11" y="52" textAnchor="middle" style={Sans} fontSize="7.5" fill={V.ink2} transform="rotate(-90 11 52)">{zh ? '过年早上' : 'New Year'}</text></g>
      {/* photos on top shelf */}
      <g transform="translate(60 44) rotate(-6)"><rect width="46" height="44" fill={V.card} stroke={V.line} /><rect x="5" y="5" width="36" height="26" className="frame-photo" fill="#B98863" /></g>
      <g transform="translate(120 42) rotate(4)"><rect width="46" height="44" fill={V.card} stroke={V.line} /><rect x="5" y="5" width="36" height="26" fill="#8E9B7B" /></g>
      <text x="196" y="74" style={Serif} fontSize="12" fill={V.ink2}>{zh ? '按人物 · 年代 · 地点' : 'by person · era · place'}</text>
      <path d="M196 80h96" stroke={V.line} strokeWidth="2" />
    </Svg>
  );
}

// Why 1 · Cultural context survives: a dialect word, annotated and stamped confirmed.
export function IlloContext({ zh = true }) {
  return (
    <Svg label="dialect word with note">
      <rect x="40" y="48" width="130" height="124" rx="14" fill={V.card} stroke={V.line} />
      <text x="105" y="130" textAnchor="middle" style={Serif} fontSize="68" fontWeight="700" fill={V.ink}>粿</text>
      <rect x="62" y="140" width="86" height="4" rx="2" fill={V.mark} />
      <text x="105" y="162" textAnchor="middle" style={Sans} fontSize="10" fill={V.ink3} letterSpacing="1">{zh ? 'guǒ · 潮汕话' : 'guǒ · Teochew'}</text>
      <path d="M170 92c22-18 40-18 56-6" stroke={V.ink3} strokeWidth="1.5" strokeDasharray="3 4" />
      <rect x="190" y="84" width="104" height="72" rx="10" fill={V.card} stroke={V.ink} strokeWidth="1.5" />
      <text x="202" y="104" style={Sans} fontSize="9" fill={V.ink3} letterSpacing="1">{zh ? '食物 · 待确认' : 'FOOD · PENDING'}</text>
      <text x="202" y="121" style={Sans} fontSize="10" fill={V.ink2}>{zh ? '米浆做的糕点，' : 'Rice-flour cake made'}</text>
      <text x="202" y="135" style={Sans} fontSize="10" fill={V.ink2}>{zh ? '祭拜和过节用。' : 'for offerings & festivals.'}</text>
      <g transform="translate(262 160) rotate(-12)"><rect x="-26" y="-11" width="52" height="22" rx="4" fill="none" stroke={V.ok} strokeWidth="2" /><text x="0" y="4" textAnchor="middle" style={Sans} fontSize="10" fontWeight="700" fill={V.ok} letterSpacing="1">{zh ? '已确认' : 'CONFIRMED'}</text></g>
      <text x="40" y="36" style={Sans} fontSize="10" fill={V.ink3}>{zh ? '普通转写：“果” ✕' : 'Plain transcript: “guo” ✕'}</text>
    </Svg>
  );
}

// Why 2 · The voice stays: waveform and text side by side, bound together.
export function IlloVoice({ zh = true }) {
  const bars = Array.from({ length: 26 }, (_, i) => 8 + Math.abs(Math.sin(i * 0.9) * 46) + (i % 5 === 0 ? 10 : 0));
  return (
    <Svg label="voice beside text">
      <rect x="28" y="40" width="128" height="140" rx="12" fill={V.ochreSoft} />
      <g transform="translate(44 110)">{bars.slice(0, 13).map((h, i) => <rect key={i} x={i * 8} y={-h / 2} width="4" height={h} rx="2" fill={V.ochre} opacity={0.55 + (i % 3) * 0.15} />)}</g>
      <circle cx="56" cy="160" r="11" fill={V.ink} /><path d="M53 155v10l8-5z" fill="#fff" />
      <text x="74" y="164" style={Sans} fontSize="10" fill={V.ink2}>{zh ? '原声 · 4:12' : 'Original · 4:12'}</text>
      <rect x="164" y="40" width="128" height="140" rx="12" fill={V.card} stroke={V.line} />
      <text x="180" y="66" style={Serif} fontSize="12" fontWeight="600" fill={V.ink}>{zh ? '整理后的文字' : 'Tidied text'}</text>
      <Lines x={180} y={84} w={96} n={6} gap={13} color={V.line} last={0.5} />
      <path d="M156 110h8" stroke={V.ink} strokeWidth="2" />
      <circle cx="160" cy="110" r="7" fill={V.card} stroke={V.ink} strokeWidth="2" />
      <text x="28" y="30" style={Sans} fontSize="10" fill={V.ink3}>{zh ? '每一个故事，两样东西并排放着' : 'Every story keeps both, side by side'}</text>
    </Svg>
  );
}

// Why 3 · Built by the family: avatars connected, each contributing a verb.
export function IlloFamily({ zh = true }) {
  const ppl = zh ? [[160, 42, '姑', V.sage, '确认', 'above'], [60, 112, '子', V.ochre, '录', 'below'], [260, 112, '孙', V.plum, '补充', 'below'], [160, 180, '婶', V.ink3, '纠正', 'right']] : [[160, 42, 'A', V.sage, 'confirm', 'above'], [60, 112, 'S', V.ochre, 'record', 'below'], [260, 112, 'G', V.plum, 'add', 'below'], [160, 180, 'N', V.ink3, 'fix', 'right']];
  return (
    <Svg label="family contributing">
      <circle cx="160" cy="112" r="70" fill="none" stroke={V.line} strokeWidth="2" strokeDasharray="4 6" />
      <circle cx="160" cy="112" r="30" fill={V.card} stroke={V.ink} strokeWidth="1.5" />
      <text x="160" y="109" textAnchor="middle" style={Serif} fontWeight="700" fill={V.ink} fontSize={zh ? 13 : 11}>{zh ? '童爷爷' : 'Grandpa'}</text>
      <text x="160" y="123" textAnchor="middle" style={Sans} fontSize="8.5" fill={V.ink3}>{zh ? '1936 · 南昌' : '1936 · Nanchang'}</text>
      {ppl.map(([x, y, n, c, verb, pos]) => {
        const lx = pos === 'right' ? x + 26 : x - 20, ly = pos === 'above' ? y - 40 : pos === 'right' ? y - 8 : y + 24;
        return (<g key={n}><circle cx={x} cy={y} r="18" fill={c} /><text x={x} y={y + 5} textAnchor="middle" style={Serif} fontSize="13" fill="#fff">{n}</text><rect x={lx} y={ly} width="40" height="16" rx="8" fill={V.card} stroke={V.line} /><text x={lx + 20} y={ly + 11.5} textAnchor="middle" style={Sans} fontSize="9" fill={V.ink2}>{verb}</text></g>);
      })}
    </Svg>
  );
}

// Empty-state illustration for Home: an open notebook waiting for its first story.
export function IlloEmpty({ zh = true }) {
  return (
    <Svg label="empty notebook">
      <rect x="60" y="50" width="200" height="130" rx="10" fill={V.card} stroke={V.line} />
      <line x1="160" y1="50" x2="160" y2="180" stroke={V.line} />
      <Lines x={78} y={78} w={64} n={5} gap={16} color={V.line2} last={0.5} />
      <text x="208" y="112" textAnchor="middle" style={Serif} fontSize="30" fill={V.ochre} fontWeight="700">?</text>
      <text x="208" y="140" textAnchor="middle" style={Sans} fontSize="10" fill={V.ink3}>{zh ? '第一个故事' : 'first story'}</text>
      <circle cx="250" cy="56" r="14" fill={V.ochreSoft} /><rect x="246" y="48" width="8" height="12" rx="4" fill={V.ochre} /><path d="M243 56c0 4 3 7 7 7s7-3 7-7" stroke={V.ochre} strokeWidth="1.5" />
    </Svg>
  );
}

// Brand mark — Echoes · 余音. Three open brush strokes ringing outward from a single point, drawn with
// uneven stroke weight so it reads as ink rather than a vector icon. Original artwork for the product.
// Brand mark: the ink-brush artwork (two profiles, one circling stroke), cut out of its paper. Raster, so it keeps the brush texture.
export function Mark({ size = 26, color = '#161514', dark = false }) {
  const light = dark || /^#(E|F)/i.test(color);
  return <img src={light ? markWhite : markPng} width={size} height={size} alt="" aria-hidden="true" style={{ display: 'block', flex: 'none', width: size, height: size, objectFit: 'contain' }} />;
}
