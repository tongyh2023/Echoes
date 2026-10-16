// Ink-brush illustrations (中国风) for the landing page. Strokes are roughened with an SVG displacement filter
// so they read as brush on paper, not vector. One ink, one accent (sepia), lots of air.
const INK = '#2A2522', INK2 = '#6B655F', ACC = '#8A4B23', PAPER = '#F8F7F4';

const Ink = ({ id }) => (
  <defs>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id={id + 'w'} x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
      <feGaussianBlur stdDeviation="1.2" />
    </filter>
  </defs>
);
const Svg = ({ children, label, id }) => <svg viewBox="0 0 320 200" className="w-full h-auto block" role="img" aria-label={label} fill="none" strokeLinecap="round" strokeLinejoin="round"><Ink id={id} />{children}</svg>;
// a tapered brush stroke: filled shape along a horizontal, thick at start thin at end
const Stroke = ({ x, y, w, t = 3, color = INK, o = 1 }) => <path d={`M${x} ${y} C ${x + w * .3} ${y - t * .4}, ${x + w * .7} ${y + t * .3}, ${x + w} ${y} C ${x + w * .7} ${y + t * .9}, ${x + w * .3} ${y + t * .5}, ${x} ${y + t * .2} Z`} fill={color} opacity={o} />;

const VT = ({ x, y, text, size = 13, color = INK2, o = 1, font = 'var(--font-brush)' }) => (
  <text x={x} y={y} fontFamily={font} fontSize={size} fill={color} opacity={o} style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }} letterSpacing="0">{text}</text>
);

// 01 · 竹简 — bamboo slips bound by two cords; the question is written on the middle slip.
export function InkQuestion() {
  const slips = [['家里有没有', INK2, .5], ['说一句老家话', INK2, .5], ['过年早上吃什么', ACC, 1], ['父亲的故事', INK2, .5], ['那只手表', INK2, .5]];
  return (
    <Svg label="bamboo slips" id="iq">
      <g filter="url(#iq)">
        {slips.map(([t, c, o], i) => <g key={i}><rect x={74 + i * 36} y={26 - (i % 2) * 4} width="26" height="150" rx="3" stroke={i === 2 ? ACC : INK} strokeWidth={i === 2 ? 2.4 : 1.6} fill={i === 2 ? '#F1E6DB' : PAPER} /><VT x={87 + i * 36} y={40 - (i % 2) * 4} text={t} size={i === 2 ? 13 : 11.5} color={c} o={o} /></g>)}
        <path d="M62 50 h198 M62 150 h198" stroke={INK} strokeWidth="1.6" />
        <path d="M62 50 c -6 -8, -3 -16, 5 -13 M260 50 c 6 -8, 3 -16, -5 -13 M62 150 c -6 8, -3 16, 5 13 M260 150 c 6 8, 3 16, -5 13" stroke={INK} strokeWidth="1.4" />
      </g>
    </Svg>
  );
}

// 02 · 余音绕梁 — a roof beam; the sound curls around it in ink rings that fade as they travel.
export function InkVoice() {
  return (
    <Svg label="sound around the beam" id="iv">
      <g filter="url(#iv)">
        <path d="M24 58 C 90 50, 230 50, 296 58" stroke={INK} strokeWidth="7" />
        <path d="M24 58 C 90 54, 230 54, 296 58" stroke={PAPER} strokeWidth="1.4" opacity=".5" />
        <path d="M84 60 v 110 M236 60 v 110" stroke={INK} strokeWidth="4" />
        <path d="M70 60 l 14 -14 l 14 14 M222 60 l 14 -14 l 14 14" stroke={INK} strokeWidth="2.6" />
      </g>
      <g filter="url(#ivw)">
        <circle cx="160" cy="118" r="18" stroke={INK} strokeWidth="4" />
        <circle cx="160" cy="118" r="38" stroke={INK} strokeWidth="2.6" opacity=".55" />
        <circle cx="160" cy="118" r="60" stroke={INK2} strokeWidth="1.8" opacity=".3" />
        <path d="M160 36 a 82 82 0 0 1 82 82" stroke={ACC} strokeWidth="3" />
      </g>
      <circle cx="160" cy="118" r="3.2" fill={ACC} />
      <VT x={284} y={100} text="余音" size={15} color={ACC} />
    </Svg>
  );
}

// 03 · 批注 — vertical text with one phrase marked, and the family's note written in the margin in the accent.
export function InkNotes() {
  return (
    <Svg label="margin notes" id="in">
      <rect x="150" y="12" width="130" height="178" stroke={INK} strokeWidth="1.4" fill={PAPER} />
      <g filter="url(#in)">
        <VT x={258} y={26} text="我小时候在南昌" size={13} color={INK} />
        <VT x={232} y={26} text="过年第一天早上" size={13} color={INK} />
        <VT x={206} y={26} text="是一定要吃年糕的" size={13} color={INK} />
        <VT x={180} y={26} text="那时候东西要凭粮票" size={13} color={INK} o={.75} />
        <path d="M197 118 v 28" stroke={ACC} strokeWidth="3" />
        <VT x={120} y={44} text="年糕·南昌米糕" size={12.5} color={ACC} />
        <path d="M128 130 c 24 4, 46 2, 66 2" stroke={ACC} strokeWidth="1" strokeDasharray="1.5 4" />
      </g>
      <g transform="translate(60 150) rotate(-6)"><rect width="26" height="26" rx="2" fill={ACC} /><text x="13" y="19" textAnchor="middle" fontFamily="var(--font-brush)" fontSize="14" fill={PAPER}>阅</text></g>
    </Svg>
  );
}

// 04 · 线装书 — thread-bound volumes stacked on a table, title slips on the covers; the newest in the accent.
export function InkArchive() {
  const book = (y, w, label, acc) => (
    <g>
      <rect x={160 - w / 2} y={y} width={w} height="30" rx="1.5" stroke={INK} strokeWidth="1.6" fill={PAPER} />
      {[0, 1, 2, 3].map((k) => <circle key={k} cx={160 - w / 2 + 12 + k * 8} cy={y + 15} r="1.6" fill={INK2} />)}
      <rect x={160 + w / 2 - 74} y={y + 6} width="62" height="18" rx="1" stroke={acc ? ACC : INK2} strokeWidth="1.2" fill={acc ? '#F1E6DB' : 'none'} />
      <text x={160 + w / 2 - 43} y={y + 19} textAnchor="middle" fontFamily="var(--font-brush)" fontSize="12" fill={acc ? ACC : INK2}>{label}</text>
    </g>
  );
  return (
    <Svg label="thread-bound volumes" id="ia">
      <g filter="url(#ia)">
        {book(140, 220, '一九三六', false)}{book(106, 228, '兰州教书', false)}{book(72, 214, '成都家宴', false)}{book(38, 232, '过年早上', true)}
        <path d="M34 174 h 252" stroke={INK} strokeWidth="3" />
      </g>
    </Svg>
  );
}

// Seal stamp 印章
export function Seal({ text = '余音', lg = false }) { return <span className={'seal ' + (lg ? 'lg' : '')} aria-hidden="true">{text}</span>; }
