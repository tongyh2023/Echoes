// Line illustrations for the landing page. One stroke weight (1.4), ink colour, a single accent per drawing.
// Drawn as diagrams of an idea, not pictures of the interface.
const INK = '#161514', INK3 = '#8A8580', LINE = '#D9D5CE', ACC = '#8A4B23', PAPER = '#F8F7F4';
const Svg = ({ children, label }) => <svg viewBox="0 0 320 200" className="w-full h-auto block" role="img" aria-label={label} fill="none" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
const Lines = ({ x, y, w, n = 3, gap = 12, last = 0.6, color = LINE, sw = 1.4 }) => <g stroke={color} strokeWidth={sw}>{Array.from({ length: n }).map((_, i) => <line key={i} x1={x} y1={y + i * gap} x2={x + w * (i === n - 1 ? last : 1)} y2={y + i * gap} />)}</g>;

// 01 · A specific question: one card lifted from a stack, one line singled out with the accent.
export function ArtQuestion() {
  return (
    <Svg label="a specific question">
      <rect x="96" y="70" width="150" height="96" rx="3" stroke={LINE} strokeWidth="1.4" transform="rotate(-5 171 118)" />
      <rect x="92" y="60" width="150" height="96" rx="3" stroke={LINE} strokeWidth="1.4" transform="rotate(3 167 108)" />
      <rect x="88" y="48" width="150" height="100" rx="3" fill={PAPER} stroke={INK} strokeWidth="1.4" />
      <Lines x={104} y={70} w={118} n={1} color={LINE} />
      <line x1="104" y1="90" x2="214" y2="90" stroke={ACC} strokeWidth="2.2" />
      <line x1="104" y1="106" x2="190" y2="106" stroke={INK} strokeWidth="1.4" />
      <Lines x={104} y={126} w={118} n={1} last={0.45} color={LINE} />
      <circle cx="248" cy="50" r="7" fill={PAPER} stroke={ACC} strokeWidth="1.4" /><circle cx="248" cy="50" r="2" fill={ACC} />
      <path d="M40 150 c 20 -40, 40 -50, 60 -60" stroke={LINE} strokeWidth="1.2" strokeDasharray="2 5" />
    </Svg>
  );
}

// 02 · The voice: an echo — a point and rings leaving it, the last ring drawn in the accent.
export function ArtVoice() {
  return (
    <Svg label="the voice">
      <circle cx="120" cy="100" r="3.2" fill={INK} />
      <path d="M140 72 a 36 36 0 0 1 0 56" stroke={INK} strokeWidth="1.6" />
      <path d="M156 56 a 58 58 0 0 1 0 88" stroke={INK} strokeWidth="1.4" opacity=".7" />
      <path d="M172 40 a 80 80 0 0 1 0 120" stroke={INK} strokeWidth="1.3" opacity=".45" />
      <path d="M188 26 a 100 100 0 0 1 0 148" stroke={ACC} strokeWidth="1.8" />
      <line x1="60" y1="100" x2="112" y2="100" stroke={LINE} strokeWidth="1.4" />
      <text x="60" y="92" fontFamily="var(--font-sans)" fontSize="9" fill={INK3} letterSpacing="1.5">00:00</text>
      <text x="262" y="104" fontFamily="var(--font-sans)" fontSize="9" fill={INK3} letterSpacing="1.5">04:12</text>
    </Svg>
  );
}

// 03 · Read it together: a page of text, one word bracketed, a note in the margin — and a second hand's tick.
export function ArtNotes() {
  return (
    <Svg label="notes in the margin">
      <rect x="56" y="30" width="150" height="140" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.4" />
      <Lines x={72} y={52} w={118} n={2} color={LINE} />
      <line x1="72" y1="76" x2="112" y2="76" stroke={LINE} strokeWidth="1.4" />
      <path d="M118 70 v12 M118 70 h30 M118 82 h30 M148 70 v12" stroke={ACC} strokeWidth="1.4" />
      <line x1="154" y1="76" x2="190" y2="76" stroke={LINE} strokeWidth="1.4" />
      <Lines x={72} y={100} w={118} n={4} last={0.5} color={LINE} />
      <path d="M150 64 C 190 40, 220 50, 232 70" stroke={INK3} strokeWidth="1.1" strokeDasharray="2 4" />
      <line x1="232" y1="70" x2="232" y2="130" stroke={ACC} strokeWidth="1.8" />
      <Lines x={242} y={78} w={48} n={3} gap={11} last={0.6} color={INK3} sw={1.2} />
      <path d="M244 118 l 5 5 l 10 -11" stroke={INK} strokeWidth="1.6" />
    </Svg>
  );
}

// 04 · Kept: a shelf of bound volumes, one pulled forward and marked with the accent.
export function ArtArchive() {
  return (
    <Svg label="kept on the shelf">
      <line x1="48" y1="150" x2="272" y2="150" stroke={INK} strokeWidth="1.6" />
      {[[70, 24], [100, 18], [124, 28], [158, 22], [206, 26], [238, 20]].map(([x, w], i) => <rect key={i} x={x} y={i === 3 ? 70 : 82} width={w} height={i === 3 ? 80 : 68} rx="1.5" fill={PAPER} stroke={i === 3 ? ACC : INK} strokeWidth={i === 3 ? 1.8 : 1.3} />)}
      {[[70, 24], [100, 18], [124, 28], [206, 26], [238, 20]].map(([x, w], i) => <line key={i} x1={x + w / 2} y1="96" x2={x + w / 2} y2="136" stroke={LINE} strokeWidth="1.2" />)}
      <circle cx="169" cy="92" r="3" fill={ACC} />
      <text x="48" y="172" fontFamily="var(--font-sans)" fontSize="9" fill={INK3} letterSpacing="2">1936 · 1950s · 1961 · 2026</text>
    </Svg>
  );
}

// Calligraphic rule: a single tapered stroke, drawn as a filled shape so it reads as one movement of the brush.
export function BrushRule({ width = 56, color = ACC, className = '' }) {
  return (
    <svg width={width} height={Math.round(width * 0.2)} viewBox="0 0 120 24" className={className} aria-hidden="true">
      <path d="M2 13 C 18 9, 34 10.5, 52 11.2 C 72 12, 92 10.4, 117 8.6 C 96 12.6, 74 15.4, 52 14.8 C 34 14.4, 18 14.5, 2 13 Z" fill={color} />
      <path d="M8 12.2 C 30 10.8, 60 12.4, 110 9.6" stroke={color} strokeWidth=".6" opacity=".45" fill="none" strokeLinecap="round" />
    </svg>
  );
}
