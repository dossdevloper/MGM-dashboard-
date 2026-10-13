import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Boxes, ArrowDownToLine, ArrowUpFromLine, Scale, TriangleAlert, Warehouse, PackageSearch, History,
  ArrowUpRight, ArrowDownRight, Repeat, CheckCircle2, Trophy, Gauge, BarChart3, Table2, TrendingUp,
} from 'lucide-react';
import DateRangePicker from './datepicker.jsx';
import Toast from './toast.jsx';
import { LOGO } from './brand.js';
import { GRN, STOCK_OUT, useStockIn, useStockOut, sumBetween } from './zoho.jsx';
import './stock.css';

/* ============ Stock in / stock out — static sample data (swap for Zoho reports later) ============ */
const v = (n) => `var(${n})`;
const kg = (n) => `${n.toLocaleString('en-IN')} kg`;

// KPI values per period: [on hand kg, on hand ₹, in kg, out kg, low-stock items]
const KPI = {
  Today: { hand: 18640, value: 2984000, in: 1240, out: 1610, low: 3, inS: [3, 5, 4, 6, 5, 7, 6, 8], outS: [4, 5, 6, 5, 7, 6, 8, 9] },
  'This month': { hand: 18640, value: 2984000, in: 31450, out: 29880, low: 3, inS: [60, 72, 68, 81, 77, 90, 86, 95], outS: [58, 66, 70, 74, 79, 83, 85, 88] },
  'This year': { hand: 18640, value: 2984000, in: 372600, out: 355100, low: 3, inS: [700, 820, 790, 940, 900, 1060, 1010, 1120], outS: [680, 770, 820, 860, 920, 970, 990, 1030] },
};

// last 14 days, kg moved
const FLOW = [
  [1180, 1320], [1460, 1210], [980, 1390], [1620, 1480], [1340, 1550], [1710, 1390], [1250, 1600],
  [1530, 1440], [1890, 1620], [1420, 1760], [1680, 1510], [1960, 1830], [1380, 1690], [1240, 1610],
];

const LOCATIONS = [
  { name: 'Madurai Main Store', cap: 12000, used: 9360, c: '--sk-teal' },
  { name: 'Unit B Godown', cap: 8000, used: 5920, c: '--sk-gold' },
  { name: 'Dispatch Bay', cap: 3500, used: 3220, c: '--sk-red' },
];

// product: on hand kg, reorder point, max, avg daily out
const PRODUCTS = [
  { name: 'Plain Appalam · 1kg', sku: 'MGF-PA-1000', hand: 4820, reorder: 1500, max: 6000, daily: 310 },
  { name: 'Kerala Pappadam · 500g', sku: 'MGF-KP-500', hand: 2140, reorder: 1200, max: 4000, daily: 220 },
  { name: 'Ring Papad · 250g', sku: 'MGF-RP-250', hand: 860, reorder: 900, max: 2500, daily: 140 },
  { name: 'Jeera Appalam · 500g', sku: 'MGF-JA-500', hand: 3260, reorder: 1000, max: 4000, daily: 180 },
  { name: 'Masala Appalam · 250g', sku: 'MGF-MA-250', hand: 410, reorder: 700, max: 2000, daily: 120 },
  { name: 'Madras Plain Poppadom', sku: 'MGF-MP-200', hand: 1980, reorder: 800, max: 3000, daily: 160 },
  { name: 'Urad Dal (raw)', sku: 'RM-URAD-01', hand: 5170, reorder: 2500, max: 8000, daily: 420 },
];

// last 30 days of stock movement per day (sample data — swap for the Zoho movement report later)
const MV_DAYS = 30;
const MV_SERIES = (() => {
  let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: MV_DAYS }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (MV_DAYS - 1 - i));
    const wk = d.getDay() === 0 ? 0.55 : 1; // Sundays are quieter
    const r10 = (n) => Math.round(n / 10) * 10;
    const inKg = r10((700 + rnd() * 1300) * wk); const outKg = r10((650 + rnd() * 1250) * wk); const trKg = r10((80 + rnd() * 520) * wk);
    return { d, in: inKg, out: outKg, tr: trKg, docs: Math.max(1, Math.round((inKg + outKg + trKg) / 380 + rnd() * 3)) };
  });
})();
const MV_METRICS = { 'Stock in': ['in', '--sk-green'], 'Stock out': ['out', '--sk-orange'], Transfers: ['tr', '--sk-violet'] };

const statusOf = (p) => (p.hand <= p.reorder * 0.6 ? ['Critical', '--sk-red'] : p.hand <= p.reorder ? ['Reorder', '--sk-gold'] : ['Healthy', '--sk-green']);

/* ============ atoms ============ */
function Head({ icon: Ic, title, sub, children }) {
  return (
    <div className="sk-h">
      <div className="sk-ht">
        <span className="sk-ico"><Ic size={18} strokeWidth={2.1} /></span>
        <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
      </div>
      {children && <div className="sk-hr">{children}</div>}
    </div>
  );
}
function Seg({ options, value, onChange }) {
  return <div className="sk-seg">{options.map((o) => <button key={o} className={o === value ? 'on' : ''} onClick={() => onChange(o)}>{o}</button>)}</div>;
}
function Spark({ data, c }) {
  const W = 120, H = 34; const mx = Math.max(...data); const mn = Math.min(...data);
  const pts = data.map((y, i) => [(i / (data.length - 1)) * W, H - 4 - ((y - mn) / (mx - mn || 1)) * (H - 8)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  return (
    <svg className="sk-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path d={`${d}L${W},${H}L0,${H}Z`} style={{ fill: v(c), opacity: 0.12 }} />
      <path d={d} fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: v(c) }} />
    </svg>
  );
}

/* ============ Stock line: animated process (in → out → balance → weight check → transfer) ============ */
const SL_Z = 272; // width of one station zone (5 × 272 = 1360)
const TIP_W = 244; // hover card width (px), keep in sync with .sl-tip width in CSS
const SL_STAGES = [
  ['01', 'Stock in', '--sk-green', ArrowDownToLine],
  ['02', 'Stock out', '--sk-orange', ArrowUpFromLine],
  ['03', 'Balance', '--sk-teal', Scale],
  ['04', 'Weight checking', '--sk-gold', Gauge],
  ['05', 'Stock transfer', '--sk-violet', Repeat],
];
// per period: weight checks, avg variance %, pass rate %, transfers, kg transferred (sample data)
const LINE = {
  Today: { wc: 14, wv: 0.6, pass: 97.8, tr: 3, trKg: 520 },
  'This month': { wc: 412, wv: 0.7, pass: 98.6, tr: 71, trKg: 12640 },
  'This year': { wc: 4890, wv: 0.7, pass: 98.4, tr: 846, trKg: 151200 },
};
// [from, to] day-starts for a period: today, this month (1st–last day), this year (financial
// year, 1 Apr–31 Mar, same as the Sales page). Whole month / year, so entries already dated
// later in the period are counted too.
const dayStart = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const periodRange = (per) => {
  const t = dayStart();
  if (per === 'This month') return [new Date(t.getFullYear(), t.getMonth(), 1), new Date(t.getFullYear(), t.getMonth() + 1, 0)];
  if (per === 'This year') { const fy = t.getMonth() >= 3 ? t.getFullYear() : t.getFullYear() - 1; return [new Date(fy, 3, 1), new Date(fy + 1, 2, 31)]; }
  return [t, t];
};

// custom range: scale this month's daily rates by the number of days, with a small stable wobble per range
const fmtRange = ([a, b]) => {
  // add the year only when the range crosses years (e.g. the financial year)
  const f = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: a.getFullYear() !== b.getFullYear() ? 'numeric' : undefined });
  return +a === +b ? f(a) : `${f(a)} – ${f(b)}`;
};
const customStats = ([a, b]) => {
  const days = Math.round((b - a) / 864e5) + 1;
  const seed = a.getDate() * 31 + b.getDate() * 7 + a.getMonth() * 3 + days;
  const wob = (i) => 0.9 + ((Math.sin(seed * (i + 1)) + 1) / 2) * 0.2; // 0.9 – 1.1
  const M = KPI['This month']; const ML = LINE['This month'];
  const r = (v, i) => Math.max(1, Math.round((v / 30) * days * wob(i)));
  return {
    days,
    k: { ...M, in: r(M.in, 1), out: r(M.out, 2) },
    L: { ...ML, wc: r(ML.wc, 3), tr: r(ML.tr, 4), trKg: r(ML.trKg, 5) },
  };
};
const jit = (b, a, d = 1) => +(b + (Math.random() - 0.5) * a).toFixed(d);

// crate coordinates (zone-local)
const IN_BED = [[76, 212], [102, 212], [128, 212]];   // on the inbound truck
const IN_SLOT = [[196, 194], [218, 194], [240, 194]]; // rack slots they fly to
const OUT_PICK = [[76, 194], [54, 194], [32, 194]];   // picked from the rack
const OUT_BED = [[202, 212], [176, 212], [150, 212]]; // spots on the outbound truck
// balance rack (zone-local): top shelf = stock in, middle = balance, bottom = stock out
const BR = { l: 58, r: 210, top: 150, mid: 196, bot: 242 };
const BR_SLOTS = [76, 100, 124, 148, 172, 196];          // carton centres along a shelf
const brY = (shelf) => shelf - 9;                         // carton centre resting on a shelf
const DIM_IN = [[196, 238], [218, 238], [240, 238], [196, 150], [218, 150]];
const DIM_OUT = [[32, 238], [54, 238], [76, 238], [32, 150], [54, 150]];

/* worker who carries cartons between truck and rack (feet at the floor, facing right by default) */
const MAN_HAND = 12;   // carton centre sits this far in front of the worker while carried
const CARRY_Y = 215;   // carton centre height while carried at chest level
const SlWorker = ({ cls, c }) => (
  <g className={`sl-man ${cls}`} style={{ '--cc': v(c) }}>
    <g className="sl-man-f">
      <g className="sl-leg"><path d="M-1.5,-15 L-2.5,0" /></g>
      <g className="sl-leg"><path d="M1.5,-15 L2.5,0" /></g>
      <path className="sl-man-body" d="M-5,-29 Q0,-32 5,-29 L5.5,-14 L-5.5,-14 Z" />
      <path className="sl-man-vest" d="M-5.2,-22 H5.4" />
      <circle className="sl-man-head" cx="0" cy="-35.5" r="4.6" />
      <path className="sl-man-hat" d="M-5.4,-37 A5.4,5.4 0 0 1 5.4,-37 Z" />
      <path className="sl-man-brim" d="M-6.5,-37 H7.5" />
      <g className="sl-arm"><path d="M0,-27 L0,-15" /></g>
    </g>
  </g>
);
// one walk segment: move the worker and swing the legs, ending on a neutral stance
const walk = (tl, man, legs, x, at, dur) => {
  const steps = Math.max(2, Math.round(dur / 0.2));
  tl.to(man, { x, duration: dur, ease: 'power1.inOut' }, at)
    .fromTo(legs, { rotation: (i) => (i ? -20 : 20) }, { rotation: (i) => (i ? 20 : -20), duration: dur / steps, repeat: steps - 1, yoyo: true, ease: 'sine.inOut' }, at)
    .set(legs, { rotation: 0 }, at + dur);
};
const face = (tl, flip, dir, at) => tl.set(flip, { attr: { transform: dir < 0 ? 'scale(-1,1)' : 'scale(1,1)' } }, at);
const walkTime = (from, to) => 0.25 + Math.abs(to - from) / 110;

/* truck driver: bobs with the road + exhaust puffs while driving; looks back while parked;
   blinks the indicator before pulling away */
const drive = (tl, t, at, dur) => {
  const halves = Math.max(2, Math.round(dur / 0.13));
  tl.fromTo(`${t} .sl-drv`, { y: 0 }, { y: -0.9, duration: dur / halves, repeat: halves - 1, yoyo: true, ease: 'sine.inOut' }, at)
    .set(`${t} .sl-drv`, { y: 0 }, at + dur)
    .fromTo(`${t} .sl-puff`, { x: 0, y: 0, scale: 0.4, opacity: 0.55 },
      { x: 14, y: -9, scale: 1.8, opacity: 0, duration: 0.7, ease: 'power1.out', stagger: { each: 0.23, repeat: Math.max(0, Math.round(dur / 0.7) - 1) } }, at);
};
const lookBack = (tl, t, from, to) => {
  tl.to(`${t} .sl-dhead`, { x: 2.4, duration: 0.35, ease: 'power2.out' }, from)
    .to(`${t} .sl-dhead`, { x: 0, duration: 0.3, ease: 'power2.inOut' }, to);
};
const blink = (tl, t, at) => tl.fromTo(`${t} .sl-tlight`, { opacity: 1 }, { opacity: 0.15, duration: 0.14, repeat: 5, yoyo: true, ease: 'steps(1)' }, at);

const SlCrate = ({ c, x = 0, y = 0, cls }) => (
  <g className={cls} transform={x || y ? `translate(${x},${y})` : undefined} style={{ '--cc': v(c) }}><use href="#slCrate" /></g>
);
const SlTruck = ({ cls, c, flip }) => (
  <g className={cls} style={{ '--cc': v(c) }}>
    <g transform={flip ? 'translate(136,246) scale(-1,1)' : 'translate(0,246)'}>
      <rect className="sl-tbed" x="40" y="-80" width="96" height="58" rx="4" />
      <path className="sl-tcab" d="M0,-22 V-46 L10,-60 H36 V-22 Z" />
      {/* driver, seen through the cab window (faces the front of the truck) */}
      <g clipPath="url(#slCab)">
        <g className="sl-drv">
          <path className="sl-drv-body" d="M13.5,-37 Q13.5,-45.5 21,-45.5 Q28.5,-45.5 28.5,-37 Z" />
          <path className="sl-drv-arm" d="M17,-43.5 L11.5,-45.5" />
          <ellipse className="sl-drv-wheel" cx="10.5" cy="-45.5" rx="1.3" ry="3.4" />
          <g className="sl-dhead">
            <circle className="sl-drv-face" cx="21" cy="-49.6" r="3.8" />
            <path className="sl-drv-cap" d="M17.1,-50.4 A3.9,3.9 0 0 1 24.9,-50.4 Z" />
            <path className="sl-drv-peak" d="M17.6,-50.4 H14.2" />
          </g>
        </g>
      </g>
      <path className="sl-twin" d="M6,-44 L13,-55 H30 V-44 Z" />
      {/* exhaust puffs at the back of the chassis */}
      {[0, 1, 2].map((p) => <circle key={p} className="sl-puff" cx="139" cy="-15" r="3" opacity="0" />)}
      <rect className="sl-tchas" x="0" y="-22" width="136" height="8" rx="3" />
      <circle className="sl-tlight" cx="3" cy="-30" r="2.6" />
      {[22, 112].map((cx) => (
        <g key={cx} transform={`translate(${cx},-11)`}>
          <g className="sl-tw"><circle className="rim" r="10.5" /><line className="spoke" x1="-7" x2="7" y1="0" y2="0" /><line className="spoke" x1="0" x2="0" y1="-7" y2="7" /></g>
        </g>
      ))}
    </g>
  </g>
);
const SlRack = ({ x }) => (
  <g>
    <rect className="sl-post" x={x} y="106" width="5" height="140" />
    <rect className="sl-post" x={x + 85} y="106" width="5" height="140" />
    {[114, 158, 202].map((y) => <rect key={y} className="sl-shelf" x={x} y={y} width="90" height="4" rx="2" />)}
  </g>
);

function StockLine({ per, k, L, days, inLoading, outLoading }) {
  const root = useRef(null);
    const wrap = useRef(null);
  const slot = useRef(4); // middle-shelf slot the moving carton uses (read by the GSAP loop)
  const [logoOk, setLogoOk] = useState(true); // brand logo on the cartons
   const [hz, setHz] = useState(null);   // hovered station (0-4)
  const [px, setPx] = useState(null);   // x position of the hover card (px inside the stage)
    const [side, setSide] = useState('');  // side of the station the card sits on: 'r' | 'l' | ''
  // stock in (GRN qty) and stock out (invoice qty) are both quantities, so net is in qty too
  const net = k.in - k.out; const top = Math.max(1, k.in, k.out); const netReady = !inLoading && !outLoading;
  const qty = (n) => `${Math.round(n).toLocaleString('en-IN')} qty`;
  // balance rack: middle shelf holds on-hand stock as a share of store capacity (1–5 of 6 slots,
  // so there is always a free slot for the carton that comes in from the top shelf)
  // balance = all received (GRN) − all invoiced, up to the end of the period; the rack shows
  // how much of everything received is still on hand
  const fill = k.handIn > 0 ? Math.max(0, Math.min(1, k.hand / k.handIn)) : 0;
  const balN = Math.min(5, Math.max(1, Math.round(fill * BR_SLOTS.length)));
  const balTxt = netReady ? `${k.hand.toLocaleString('en-IN')} qty` : '· · ·';
  slot.current = balN;
  const chips = [
    [inLoading ? '…' : k.in, 'qty', inLoading ? 'loading from GRN…' : 'received + produced', inLoading ? 0 : (k.in / top) * 100],
    [outLoading ? '…' : k.out, 'qty', outLoading ? 'loading from invoices…' : `${kg(Math.round(k.outKg))} · invoiced`, outLoading ? 0 : (k.out / top) * 100],
    [netReady ? k.hand : '…', 'qty', netReady ? `${net >= 0 ? '+' : '−'}${qty(Math.abs(net))} net this period` : 'waiting for stock in / out…', netReady ? fill * 100 : 0],
    [L.wc, 'checks', `±${L.wv}% avg variance · ${L.pass}% pass`, L.pass],
    [L.tr, 'transfers', `${kg(L.trKg)} moved between stores`, (L.trKg / top) * 100],
  ];
  const share = k.in + k.out ? (k.in / (k.in + k.out)) * 100 : 0;
  const fails = Math.round((L.wc * (100 - L.pass)) / 100);
  const sg = (n) => (netReady ? `${n >= 0 ? '+' : '−'}${qty(Math.abs(n))}` : '…');
  // hover card content: label, big value, unit, badge, three detail rows
  const info = [
    { label: 'Received + produced', val: inLoading ? '…' : k.in, unit: 'qty', badge: !inLoading && k.in >= k.out ? 'Higher than out' : null,
      rows: [['Share of movement', `${share.toFixed(1)}%`], ['Daily average', qty(k.in / days)], ['Net vs stock out', sg(net)]] },
    { label: 'Invoiced quantity', val: outLoading ? '…' : k.out, unit: 'qty', badge: netReady && k.out > k.in ? 'Higher than in' : null,
      rows: [['Weight', outLoading ? '…' : kg(Math.round(k.outKg))], ['Daily average', outLoading ? '…' : `${qty(k.out / days)} · ${kg(Math.round(k.outKg / days))}`], ['Net vs stock in', sg(-net)]] },
    { label: 'On hand (received − invoiced)', val: netReady ? k.hand : '…', unit: 'qty', badge: netReady ? (net >= 0 ? 'Building up' : 'Drawing down') : null,
      rows: [['Received to date', netReady ? qty(k.handIn) : '…'], ['Invoiced to date', netReady ? qty(k.handOut) : '…'], ['Net this period', sg(net)]] },
    { label: 'Cartons weighed', val: L.wc, unit: 'checks', badge: `${L.pass}% pass`,
      rows: [['Avg variance', `±${L.wv}%`], ['Passed first time', (L.wc - fails).toLocaleString('en-IN')], ['Re-weighed', `${fails}`]] },
    { label: 'Moved between stores', val: L.tr, unit: 'transfers', badge: 'Store A ⇄ B',
      rows: [['Quantity moved', kg(L.trKg)], ['Avg per transfer', kg(Math.round(L.trKg / L.tr))], ['Share of stock out', k.outKg ? `${((L.trKg / k.outKg) * 100).toFixed(1)}%` : '—']] },
  ];
  const sc = (i) => ({ className: `sl-scene ${hz === i ? 'on' : ''}`, transform: `translate(${i * SL_Z},0)`, clipPath: 'url(#slClip)' });
  const clear = () => { setHz(null); setPx(null); setSide(''); };

  // place the card BESIDE station i (right side, or left for the last one) so the station stays visible
  const showAt = (i) => {
    const b = root.current.querySelector('svg').getBoundingClientRect();
    const wb = wrap.current.getBoundingClientRect();
    const zw = b.width / 5; const zl = b.left - wb.left + i * zw; const gap = 12;
    let x = i < 4 ? zl + zw + gap : zl - TIP_W - gap;
    x = Math.max(0, Math.min(wb.width - TIP_W, x));
    setHz(i);
    setPx(x);
    setSide(x >= zl + zw ? 'r' : x + TIP_W <= zl ? 'l' : ''); // notch only when the card is really beside it
  };

  const onMove = (e) => {
    const b = e.currentTarget.querySelector('svg').getBoundingClientRect();
    const i = Math.max(0, Math.min(4, Math.floor((((e.clientX - b.left) / b.width) * 1360) / SL_Z)));
    if (i !== hz) showAt(i);
  };
  useLayoutEffect(() => {
    const el = root.current;
    const $ = (s) => gsap.utils.toArray(s, el);
    const ctx = gsap.context(() => {
      gsap.set('.sl-tw,.sl-prop,.sl-ok', { transformOrigin: '50% 50%' });

      /* ---- ambient ---- */
      gsap.fromTo('.sl-pulse', { x: 136 }, { x: 1224, duration: 9, repeat: -1, ease: 'none' });
      gsap.to('.sl-prop', { scaleX: 0.25, duration: 0.07, yoyo: true, repeat: -1, ease: 'none' });
      gsap.to('.sl-led', { opacity: 0.25, duration: 0.5, yoyo: true, repeat: -1, ease: 'steps(1)' });

      gsap.set('.sl-leg,.sl-arm', { transformOrigin: '50% 0%' });

      /* ---- 01 STOCK IN: truck reverses in, the worker carries each carton from the
              truck's tail to the rack, then the empty truck leaves ---- */
      const OFF = -190; const inC = $('.sl-in');
      const m1 = el.querySelector('.sl-m1'); const f1 = m1.querySelector('.sl-man-f');
      const legs1 = gsap.utils.toArray(m1.querySelectorAll('.sl-leg')); const arm1 = m1.querySelector('.sl-arm');
      const IN_HOME = 158; const IN_TAIL = 142; // worker's spot behind the truck, carton hand-off point
      const t1 = gsap.timeline({ repeat: -1 });
      t1.set('.sl-t1', { x: 14 + OFF }, 0)
        .set(inC, { x: (i) => IN_BED[i][0] + OFF, y: (i) => IN_BED[i][1], scale: 1, opacity: 1, rotation: 0 }, 0)
        .set(m1, { x: IN_HOME, y: 246 }, 0).set(arm1, { rotation: 0 }, 0).set(legs1, { rotation: 0 }, 0)
        .to('.sl-t1', { x: 14, duration: 2, ease: 'power2.out' }, 0)
        .to(inC, { x: (i) => IN_BED[i][0], duration: 2, ease: 'power2.out' }, 0)
        .to('.sl-t1 .sl-tw', { rotation: '+=540', duration: 2, ease: 'power2.out' }, 0);
      face(t1, f1, -1, 0);
      let T = 2.1;
      [2, 1, 0].forEach((i, n) => { // nearest carton first; fill rack slots left → right
        const c = inC[i]; const [sx, sy] = IN_SLOT[n]; const wx = sx - MAN_HAND - 2;
        t1.to(c, { x: IN_TAIL, duration: 0.25 + (IN_TAIL - IN_BED[i][0]) / 220, ease: 'power1.inOut' }, T);
        T += 0.3 + (IN_TAIL - IN_BED[i][0]) / 220;
        t1.to(arm1, { rotation: -80, duration: 0.2 }, T)
          .to(c, { x: IN_HOME - MAN_HAND, y: CARRY_Y, duration: 0.2 }, T);
        T += 0.25; face(t1, f1, 1, T);
        t1.to(c, { x: IN_HOME + MAN_HAND, duration: 0.15 }, T);
        T += 0.15; const d = walkTime(IN_HOME, wx);
        walk(t1, m1, legs1, wx, T, d);
        t1.to(c, { x: wx + MAN_HAND, duration: d, ease: 'power1.inOut' }, T);
        T += d;
        t1.to(arm1, { rotation: -135, duration: 0.25 }, T)
          .to(c, { x: sx, y: sy, duration: 0.3, ease: 'back.out(1.6)' }, T);
        T += 0.35;
        t1.to(arm1, { rotation: 0, duration: 0.2 }, T);
        face(t1, f1, -1, T + 0.1);
        walk(t1, m1, legs1, IN_HOME, T + 0.1, d);
        T += 0.1 + d;
      });
      drive(t1, '.sl-t1', 0, 2);
      lookBack(t1, '.sl-t1', 2.1, T - 0.5);
      blink(t1, '.sl-t1', T - 0.4);
      drive(t1, '.sl-t1', T + 0.4, 2);
      t1.fromTo('.sl-pop.in', { y: 0, opacity: 0 }, { y: -14, opacity: 1, duration: 0.4, ease: 'power2.out' }, T)
        .to('.sl-pop.in', { opacity: 0, duration: 0.6 }, T + 0.8)
        .to('.sl-t1', { x: 14 + OFF, duration: 2, ease: 'power2.in' }, T + 0.4)
        .to('.sl-t1 .sl-tw', { rotation: '-=540', duration: 2, ease: 'power2.in' }, T + 0.4)
        .to(inC, { opacity: 0, duration: 0.5 }, T + 1.8)
        .to({}, { duration: 0.001 }, T + 2.6);

      /* ---- 02 STOCK OUT: truck backs in, the worker picks each carton off the rack and
              loads it at the truck's tail, then the truck drives off ---- */
      const OFF2 = 190; const outC = $('.sl-out');
      const m2 = el.querySelector('.sl-m2'); const f2 = m2.querySelector('.sl-man-f');
      const legs2 = gsap.utils.toArray(m2.querySelectorAll('.sl-leg')); const arm2 = m2.querySelector('.sl-arm');
      const OUT_HOME = 112; const OUT_TAIL = 140;
      const t2 = gsap.timeline({ repeat: -1 });
      t2.set('.sl-t2', { x: 128 + OFF2 }, 0)
        .set(outC, { x: (i) => OUT_PICK[i][0], y: (i) => OUT_PICK[i][1], scale: 0, opacity: 1, rotation: 0 }, 0)
        .set(m2, { x: OUT_HOME, y: 246 }, 0).set(arm2, { rotation: 0 }, 0).set(legs2, { rotation: 0 }, 0)
        .to('.sl-t2', { x: 128, duration: 2, ease: 'power2.out' }, 0)
        .to('.sl-t2 .sl-tw', { rotation: '+=540', duration: 2, ease: 'power2.out' }, 0)
        .to(outC, { scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.15 }, 0.4);
      face(t2, f2, -1, 0);
      let U = 2.1;
      outC.forEach((c, i) => { // nearest carton first, deepest truck spot first
        const [px] = OUT_PICK[i]; const wx = px + MAN_HAND + 2; const d = walkTime(OUT_HOME, wx);
        walk(t2, m2, legs2, wx, U, d);
        U += d;
        t2.to(arm2, { rotation: -135, duration: 0.25 }, U);
        U += 0.25;
        t2.to(c, { x: wx - MAN_HAND, y: CARRY_Y, duration: 0.3, ease: 'power2.inOut' }, U)
          .to(arm2, { rotation: -80, duration: 0.3 }, U);
        U += 0.35; face(t2, f2, 1, U);
        t2.to(c, { x: wx + MAN_HAND, duration: 0.15 }, U);
        U += 0.15;
        walk(t2, m2, legs2, OUT_HOME, U, d);
        t2.to(c, { x: OUT_HOME + MAN_HAND, duration: d, ease: 'power1.inOut' }, U);
        U += d;
        t2.to(c, { x: OUT_TAIL, y: OUT_BED[i][1], duration: 0.25 }, U)
          .to(arm2, { rotation: 0, duration: 0.2 }, U + 0.2)
          .to(c, { x: OUT_BED[i][0], duration: 0.25 + (OUT_BED[i][0] - OUT_TAIL) / 220, ease: 'power1.inOut' }, U + 0.3);
        face(t2, f2, -1, U + 0.35);
        U += 0.4;
      });
      drive(t2, '.sl-t2', 0, 2);
      lookBack(t2, '.sl-t2', 2.1, U - 0.1);
      blink(t2, '.sl-t2', U);
      drive(t2, '.sl-t2', U + 0.7, 2);
      t2.fromTo('.sl-pop.out', { y: 0, opacity: 0 }, { y: -14, opacity: 1, duration: 0.4, ease: 'power2.out' }, U + 0.3)
        .to('.sl-pop.out', { opacity: 0, duration: 0.6 }, U + 1.1)
        .to('.sl-t2', { x: 128 + OFF2, duration: 2, ease: 'power2.in' }, U + 0.7)
        .to('.sl-t2 .sl-tw', { rotation: '-=540', duration: 2, ease: 'power2.in' }, U + 0.7)
        .to(outC, { x: `+=${OFF2}`, duration: 2, ease: 'power2.in' }, U + 0.7)
        .to({}, { duration: 0.001 }, U + 2.9);

      /* ---- 03 BALANCE: a carton comes in on the top shelf, drops into the balance shelf,
              then one leaves the balance, drops to the bottom shelf and goes out ---- */
      const sx = () => BR_SLOTS[slot.current];
      gsap.timeline({ repeat: -1 })
        .set('.sl-bg', { x: -16, y: brY(BR.top), opacity: 1, rotation: 0 }, 0)
        .set('.sl-bx', { x: sx, y: brY(BR.mid), opacity: 0, scale: 1 }, 0)
        .set('.sl-bo', { opacity: 0 }, 0)
        // IN: slide along the top shelf
        .to('.sl-bg', { x: sx, duration: 1.6, ease: 'power2.out' }, 0.2)
        .fromTo('.sl-pop.bin', { y: 0, opacity: 0 }, { y: -10, opacity: 1, duration: 0.4, ease: 'power2.out' }, 1.2)
        .to('.sl-pop.bin', { opacity: 0, duration: 0.5 }, 2.2)
        // drop into the balance shelf and become balance stock
        .to('.sl-bg', { y: brY(BR.mid), duration: 0.55, ease: 'bounce.out' }, 2.1)
        .to('.sl-bg', { opacity: 0, duration: 0.25 }, 2.7)
        .to('.sl-bx', { opacity: 1, duration: 0.25 }, 2.7)
        .fromTo('.sl-bglow', { opacity: 0.9 }, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 2.7)
        // OUT: a balance carton drops to the bottom shelf and leaves to the right
        .set('.sl-bx', { opacity: 0 }, 4.3)
        .set('.sl-bo', { x: sx, y: brY(BR.mid), opacity: 1 }, 4.3)
        .to('.sl-bo', { y: brY(BR.bot), duration: 0.55, ease: 'bounce.out' }, 4.3)
        .fromTo('.sl-pop.bout', { y: 0, opacity: 0 }, { y: -10, opacity: 1, duration: 0.4, ease: 'power2.out' }, 5)
        .to('.sl-pop.bout', { opacity: 0, duration: 0.5 }, 6)
        .to('.sl-bo', { x: 300, duration: 1.6, ease: 'power2.in' }, 5.1)
        .to({}, { duration: 0.001 }, 7.999);

      /* ---- 04 WEIGHT CHECK: cartons stop under the gate, laser scan, readout + tick ---- */
      const wtxt = el.querySelector('.sl-wtxt');
      $('.sl-wc').forEach((c, i) => gsap.timeline({ repeat: -1, delay: i * 2.5 })
        .set(c, { x: -16, y: 216, opacity: 1 }, 0)
        .to(c, { x: 136, duration: 1.5, ease: 'power1.out' }, 0)
        .to(c, { x: 296, duration: 1.4, ease: 'power1.in' }, 2.9)
        .to({}, { duration: 0.001 }, 4.999));
      gsap.timeline({ repeat: -1, delay: 1.5 })
        .set('.sl-beam4', { y: 0, opacity: 1 }, 0)
        .set('.sl-ok', { scale: 0, opacity: 0 }, 0)
        .call(() => { wtxt.textContent = '· · ·'; }, null, 0)
        .to('.sl-beam4', { y: 84, duration: 0.5, ease: 'none' }, 0.1)
        .to('.sl-beam4', { y: 0, duration: 0.5, ease: 'none' }, 0.6)
        .to('.sl-beam4', { opacity: 0, duration: 0.1 }, 1.1)
        .call(() => { wtxt.textContent = `${jit(25, 0.6)} kg`; }, null, 1.1)
        .to('.sl-ok', { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.4)' }, 1.1)
        .to('.sl-ok', { scale: 0.6, opacity: 0, duration: 0.2 }, 2.1)
        .to({}, { duration: 0.001 }, 2.499);

      /* ---- 05 TRANSFER: drone carries a carton A → B, then B → A, along the arc ---- */
      const drone = el.querySelector('.sl-drone'); const dd = { u: 0 };
      const fly = () => {
        const u = dd.u;
        drone.setAttribute('transform', `translate(${43 + 186 * u},${128 - 200 * u * (1 - u)}) rotate(${(2 * u - 1) * 10})`);
      };
      fly();
      gsap.timeline({ repeat: -1 })
        .set('.sl-dcrate', { scale: 0, y: 0 }, 0)
        .to('.sl-dcrate', { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }, 0.1)
        .fromTo('.sl-leda', { opacity: 0.2 }, { opacity: 1, duration: 0.12, yoyo: true, repeat: 3 }, 0.1)
        .to(dd, { u: 1, duration: 2.4, ease: 'power1.inOut', onUpdate: fly }, 0.7)
        .to('.sl-dcrate', { scale: 0, y: 16, duration: 0.35, ease: 'power2.in' }, 3.15)
        .fromTo('.sl-ledb', { opacity: 0.2 }, { opacity: 1, duration: 0.12, yoyo: true, repeat: 3 }, 3.15)
        .set('.sl-dcrate', { y: 0 }, 3.6)
        .to('.sl-dcrate', { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }, 3.8)
        .to(dd, { u: 0, duration: 2.4, ease: 'power1.inOut', onUpdate: fly }, 4.4)
        .to('.sl-dcrate', { scale: 0, y: 16, duration: 0.35, ease: 'power2.in' }, 6.85)
        .to('.sl-leda', { opacity: 1, duration: 0.12, yoyo: true, repeat: 3 }, 6.85)
        .to({}, { duration: 0.001 }, 7.999);
    }, el);

    // pause everything while the card is off-screen
    const io = new IntersectionObserver(([e]) => ctx.data.forEach((a) => {
      if (a.parent === gsap.globalTimeline) (e.isIntersecting ? a.resume() : a.pause());
    }));
    io.observe(el);
    return () => { io.disconnect(); ctx.revert(); };
  }, []);

      return (
    <div className="sl">
      <div className="sl-wrap" ref={wrap}>
        <div className={`sl-stage ${hz !== null ? 'hov' : ''}`} ref={root} onMouseMove={onMove} onMouseLeave={clear}>
          <span className="sl-scan" />
          <svg className="sl-svg" viewBox="0 0 1360 262" role="img" aria-label="Animated stock line: stock in, stock out, balance, weight checking, stock transfer">
            <defs>
              {/* carton: tape on the top flap + a white MGF brand label (text fallback if the logo can't load) */}
              <g id="slCrate">
                <rect className="sl-cr" x="-10" y="-8" width="20" height="16" rx="2.5" />
                <path className="sl-cr-l" d="M0,-8 V-4.5" />
                <rect className="sl-cr-tag" x="-8.5" y="-3.8" width="17" height="9.6" rx="1.6" />
                {logoOk
                  ? <image href={LOGO} x="-7.8" y="-3.3" width="15.6" height="8.6" preserveAspectRatio="xMidYMid meet" onError={() => setLogoOk(false)} />
                  : <text className="sl-cr-txt" x="0" y="3.2" textAnchor="middle">MGF</text>}
              </g>
              <clipPath id="slCab"><path d="M6,-44 L13,-55 H30 V-44 Z" /></clipPath>
              <clipPath id="slClip"><rect x="0" y="60" width="272" height="196" /></clipPath>
            </defs>

            {/* HUD */}
            {['M8,26 V8 H26', 'M1352,26 V8 H1334', 'M8,236 V254 H26', 'M1352,236 V254 H1334'].map((d) => <path key={d} d={d} className="sl-corner" />)}
            <line className="sl-floor" x1="16" x2="1344" y1="246" y2="246" />
            {[1, 2, 3, 4].map((i) => <line key={i} className="sl-div" x1={i * SL_Z} x2={i * SL_Z} y1="64" y2="246" />)}
                        {hz !== null && (
              <g style={{ '--c': v(SL_STAGES[hz][2]) }}>
                <rect className="sl-zone" x={hz * SL_Z + 4} y="58" width={SL_Z - 8} height="192" rx="14" />
                <rect className="sl-zone-bar" x={hz * SL_Z + 28} y="243" width={SL_Z - 56} height="3" rx="1.5" />
              </g>
            )}
            <line className="sl-flow" x1="136" x2="1224" y1="22" y2="22" />
            {SL_STAGES.map(([n, name, c], i) => (
              <g key={n} className={`sl-hd ${hz === i ? 'on' : ''}`} style={{ '--c': v(c) }}>
                <circle className="sl-node" cx={i * SL_Z + 136} cy="22" r="10" />
                <text className="sl-no" x={i * SL_Z + 136} y="25.5" textAnchor="middle">{n}</text>
                <text className="sl-tag" x={i * SL_Z + 136} y="48" textAnchor="middle">{name.toUpperCase()}</text>
              </g>
            ))}
            <circle className="sl-pulse" cx="0" cy="22" r="4" />

            {/* ===== 01 STOCK IN ===== */}
            <g {...sc(0)}>
              <SlRack x={172} />
              <g opacity=".55">{DIM_IN.map(([x, y]) => <SlCrate key={`${x}${y}`} c="--sk-green" x={x} y={y} />)}</g>
              <SlTruck cls="sl-t1" c="--sk-green" />
              <SlWorker cls="sl-m1" c="--sk-green" />
              {IN_BED.map((_, i) => <SlCrate key={i} cls="sl-in" c="--sk-green" />)}
              <text className="sl-pop in" x="218" y="98" textAnchor="middle">+3 CTN</text>
            </g>

            {/* ===== 02 STOCK OUT ===== */}
            <g {...sc(1)}>
              <SlRack x={8} />
              <g opacity=".55">{DIM_OUT.map(([x, y]) => <SlCrate key={`${x}${y}`} c="--sk-orange" x={x} y={y} />)}</g>
              <SlTruck cls="sl-t2" c="--sk-orange" flip />
              <SlWorker cls="sl-m2" c="--sk-orange" />
              {OUT_PICK.map((_, i) => <SlCrate key={i} cls="sl-out" c="--sk-orange" />)}
              <text className="sl-pop out" x="50" y="98" textAnchor="middle">−3 CTN</text>
            </g>

            {/* ===== 03 BALANCE ===== */}
            <g {...sc(2)}>
              <rect className="sl-screen" x="84" y="64" width="104" height="36" rx="8" />
              <text className="sl-sl" x="136" y="77" textAnchor="middle">BALANCE</text>
              <text className="sl-st" x="136" y="94" textAnchor="middle" style={{ fontSize: balTxt.length > 11 ? 11 : balTxt.length > 9 ? 12.5 : 14 }}>{balTxt}</text>
              {/* rack: top shelf = stock in, middle = balance, bottom = stock out */}
              <rect className="sl-bmid" x={BR.l + 5} y={BR.top + 6} width={BR.r - BR.l - 5} height={BR.mid - BR.top - 4} rx="4" />
              <rect className="sl-bglow" x={BR.l + 5} y={BR.top + 6} width={BR.r - BR.l - 5} height={BR.mid - BR.top - 4} rx="4" opacity="0" />
              <rect className="sl-post" x={BR.l} y="112" width="5" height="134" />
              <rect className="sl-post" x={BR.r} y="112" width="5" height="134" />
              <rect className="sl-bshelf in" x={BR.l} y={BR.top} width={BR.r - BR.l + 5} height="4" rx="2" />
              <rect className="sl-bshelf mid" x={BR.l} y={BR.mid} width={BR.r - BR.l + 5} height="5" rx="2" />
              <rect className="sl-bshelf out" x={BR.l} y={BR.bot} width={BR.r - BR.l + 5} height="4" rx="2" />
              {/* feed lines into the top shelf and out of the bottom shelf */}
              <path className="sl-pflow in" d={`M0,${BR.top + 2} H${BR.l}`} />
              <path className="sl-pflow out" d={`M${BR.r + 5},${BR.bot + 2} H272`} />
              <text className="sl-ptag in" x="29" y={BR.top - 12} textAnchor="middle">IN +</text>
              <text className="sl-ptag" x="29" y={BR.mid - 14} textAnchor="middle">ON HAND</text>
              <text className="sl-ptag out" x="243" y={BR.bot - 12} textAnchor="middle">OUT −</text>
              <text className="sl-lpct" x="243" y={BR.mid - 12} textAnchor="middle">{Math.round(fill * 100)}%</text>
              {/* balance shelf: filled slots = on-hand share, the rest shown empty */}
              {BR_SLOTS.map((x, i) => (i < balN
                ? <SlCrate key={x} c="--sk-teal" x={x} y={brY(BR.mid)} />
                : <rect key={x} className="sl-bempty" x={x - 10} y={brY(BR.mid) - 8} width="20" height="16" rx="2.5" />))}
              <text className="sl-pop bin" x="136" y={BR.top - 16} textAnchor="middle">+1 CTN</text>
              <text className="sl-pop bout" x="230" y={BR.bot - 30} textAnchor="middle">−1 CTN</text>
              <SlCrate cls="sl-bx" c="--sk-teal" />
              <SlCrate cls="sl-bg" c="--sk-green" />
              <SlCrate cls="sl-bo" c="--sk-orange" />
            </g>

            {/* ===== 04 WEIGHT CHECKING ===== */}
            <g {...sc(3)}>
              {[28, 244].map((x) => <rect key={x} className="sl-post" x={x} y="238" width="5" height="8" />)}
              <rect className="sl-belt" x="0" y="224" width="272" height="14" rx="7" />
              <line className="sl-tread" x1="8" x2="264" y1="231" y2="231" />
              <rect className="sl-plate" x="104" y="221" width="64" height="4" rx="2" />
              <path className="sl-gantry" d="M96,238 V132 Q96,124 104,124 H168 Q176,124 176,132 V238" />
              <rect className="sl-screen" x="102" y="94" width="68" height="28" rx="7" />
              <circle className="sl-led sl-led-g" cx="109" cy="101" r="2" />
              <text className="sl-sl" x="140" y="104" textAnchor="middle">WEIGHT</text>
              <text className="sl-st sl-wtxt" x="136" y="117" textAnchor="middle">- - -</text>
              <rect className="sl-beam4" x="100" y="128" width="72" height="3" rx="1.5" />
              <g transform="translate(136,77)"><g className="sl-ok" opacity="0"><circle className="sl-okc" r="11" /><path d="M-5,0 l3.5,4.5 l7,-9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g></g>
              {[0, 1].map((i) => <SlCrate key={i} cls="sl-wc" c="--sk-gold" />)}
            </g>

            {/* ===== 05 STOCK TRANSFER ===== */}
            <g {...sc(4)}>
              <path className="sl-arc" d="M43,128 Q136,28 229,128" />
              {[[8, 'A', 'sl-leda'], [194, 'B', 'sl-ledb']].map(([x, t, led]) => (
                <g key={t}>
                  <path className="sl-roof" d={`M${x - 6},178 L${x + 35},154 L${x + 76},178 Z`} />
                  <rect className="sl-body" x={x} y="178" width="70" height="68" rx="5" />
                  <rect className="sl-door" x={x + 22} y="204" width="26" height="42" rx="3" />
                  <text className="sl-big" x={x + 35} y="198" textAnchor="middle">{t}</text>
                  <circle className={`sl-led2 ${led}`} cx={x + 35} cy="168" r="3.2" />
                </g>
              ))}
              <g className="sl-drone" transform="translate(43,128)">
                <path className="sl-dline" d="M-8,4 V8 M8,4 V8" />
                <g transform="translate(0,16)"><g className="sl-dcrate" style={{ '--cc': v('--sk-violet') }}><use href="#slCrate" /></g></g>
                <path className="sl-darm" d="M-12,-3 L-18,-9 M12,-3 L18,-9" />
                <ellipse className="sl-prop" cx="-18" cy="-10" rx="10" ry="2" />
                <ellipse className="sl-prop" cx="18" cy="-10" rx="10" ry="2" />
                <rect className="sl-dbody" x="-15" y="-6" width="30" height="10" rx="5" />
                <circle className="sl-led sl-led-v" cx="0" cy="-1" r="2" />
              </g>
            </g>
          </svg>
        </div>

        {/* hover card: outside the scroller so it is never clipped */}
        {hz !== null && px !== null && (() => {
          const [n, name, c] = SL_STAGES[hz]; const d = info[hz];
          return (
            <div className="sl-tip" role="tooltip" style={{ left: px, '--c': v(c), '--w': `${Math.min(100, chips[hz][3])}%` }}>
              <div className="sl-tip-h"><span className="no">{n}</span>{name}<span className="per">{per}</span></div>
              <div className="sl-tip-v">{typeof d.val === 'number' ? d.val.toLocaleString('en-IN') : d.val}<small>{d.unit}</small>{d.badge && <em>{d.badge}</em>}</div>
              <div className="sl-tip-l">{d.label}</div>
              <div className="sl-tip-bar"><i /></div>
              {d.rows.map(([label, value]) => <div key={label} className="sl-tip-r"><span>{label}</span><b>{value}</b></div>)}
            </div>
            
          );
        })()}
      </div>

      <div className="sl-chips">
        {SL_STAGES.map(([n, name, c, Ic], i) => {
          const [val, unit, sub, w] = chips[i];
          return (
            <div key={n} className="sl-chip" style={{ '--c': v(c) }}>
              <span className="sl-chip-ic"><Ic size={17} strokeWidth={2.1} /></span>
              <div className="sl-chip-t">
                <span><em>{n}</em>{name}</span>
                <b>{typeof val === 'number' ? val.toLocaleString('en-IN') : val}<small>{unit}</small></b>
                <small>{sub}</small>
                <div className="sl-meter"><i style={{ '--w': `${Math.min(100, w)}%` }} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ KPI strip ============ */
/* ============ Stock overview (animated line + chips) ============ */
function StockKpis() {
  const [per, setPer] = useState('This month');
  const [custom, setCustom] = useState(null);
  const grn = useStockIn(); const inv = useStockOut();
  const isCustom = per === 'Custom' && custom;
  const base = isCustom ? customStats(custom) : { k: KPI[per], L: LINE[per] };
  // stock in is live: Accepted Quantity from the GRN report, summed over the selected dates
  const [from, to] = isCustom ? custom : periodRange(per);
  // daily average uses the days elapsed so far (a whole month that's half over counts as half)
  const days = Math.max(1, Math.round((Math.min(+to, +dayStart()) - from) / 864e5) + 1);
  // stock out is live too: invoice line items (quantity + kg), summed over the same dates
  const k = { ...base.k, in: Math.round(sumBetween(grn.data, from, to)), out: Math.round(sumBetween(inv.data, from, to, 1)), outKg: sumBetween(inv.data, from, to, 2) };
  // balance on hand at the end of the period = everything received − everything invoiced up to then
  const handIn = Math.round(sumBetween(grn.data, 0, to)); const handOut = Math.round(sumBetween(inv.data, 0, to, 1));
  Object.assign(k, { hand: handIn - handOut, handIn, handOut });
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');
  const all = grn.summary ? fmt(grn.summary.total) : null;
  const allOut = inv.summary ? `${fmt(inv.summary.qty)} qty / ${fmt(inv.summary.kg)} kg` : null;
  const live = grn.live || inv.live; const busy = grn.loading || inv.loading;
  const label = isCustom ? fmtRange(custom) : per;
  // toast after a filter is applied (its figures follow the live values for the new period)
  const [toast, setToast] = useState(null);
  const notify = (name, range) => setToast({ id: Date.now(), name, range });
  return (
    <section className="card sk s12">
      <Head icon={Boxes} title="Stock Overview" sub="Inventory in & out across all stores">
        <span className={`sk-live ${live ? '' : busy ? 'wait' : 'off'}`}
          title={`Stock in = Accepted Quantity of every GRN line item, by ${GRN.fields.date}${all ? ` (all dates: ${all} qty)` : ''}.
`
            + `Stock out = ${STOCK_OUT.lineReport} quantity + kg, by ${STOCK_OUT.date}${allOut ? ` (all dates: ${allOut})` : ''}.
`
            + 'The cards show only the selected period.'}>
          <i />{busy ? 'Loading…' : live ? 'Live' : 'Sample'}
        </span>
        <Seg options={Object.keys(KPI)} value={per} onChange={(p2) => { setPer(p2); notify(p2, periodRange(p2)); }} />
        <DateRangePicker value={custom} active={per === 'Custom'} onApply={(r) => { setCustom(r); setPer('Custom'); notify('Custom range', r); }} />
      </Head>
      <StockLine per={label} k={k} L={base.L} days={days} inLoading={grn.loading} outLoading={inv.loading} />
      {toast && (
        <Toast key={toast.id} title={`${toast.name} applied`} range={fmtRange(toast.range)} onDone={() => setToast(null)}
          stats={busy ? [['Loading', 'GRN & invoices…']] : [['In', `${fmt(k.in)} qty`], ['Out', `${fmt(k.out)} qty`], ['Balance', `${fmt(k.hand)} qty`]]} />
      )}
    </section>
  );
}

/* ============ In vs Out flow (mirrored bars) ============ */
/* ============ In vs Out flow (mirrored bars) + hover details ============ */
function StockFlow() {
  const [hi, setHi] = useState(null);
  const today = new Date();
  const days = FLOW.map((_, i) => { const d = new Date(today); d.setDate(today.getDate() - (FLOW.length - 1 - i)); return d; });
  const n = FLOW.length;
  const mx = Math.max(...FLOW.flat()) * 1.1;
  const W = 760, H = 280, mid = H / 2, pl = 46, pr = 12, bw = (W - pl - pr) / n;
  const y = (val) => (val / mx) * (mid - 22);
  const net = FLOW.map(([a, b]) => a - b);
  const netPts = net.map((d, i) => [pl + bw * i + bw / 2, mid - Math.sign(d) * y(Math.abs(d))]);
  const tot = FLOW.reduce((s, [a, b]) => [s[0] + a, s[1] + b], [0, 0]);

  // stats used by the hover card
  const avgIn = tot[0] / n; const avgOut = tot[1] / n;
  const pctVs = (val, avg) => ((val - avg) / avg) * 100;
  const rankOf = (val, idx) => [...FLOW.map((f) => f[idx])].sort((p, q) => q - p).indexOf(val) + 1;
  const cumNet = net.reduce((acc, d, i) => [...acc, (acc[i - 1] || 0) + d], []);
  const signed = (val) => `${val >= 0 ? '+' : '−'}${kg(Math.abs(val))}`;
  const pctTxt = (p) => `${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(1)}%`;

  const tipStyle = hi === null ? null : {
    left: `${((pl + bw * hi + bw / 2) / W) * 100}%`,
    transform: hi > n * 0.55 ? 'translateX(calc(-100% - 16px))' : 'translateX(16px)',
  };
  const d = hi === null ? null : (() => {
    const [a, b] = FLOW[hi]; const t = a + b;
    return {
      a, b, net: net[hi], inShare: (a / t) * 100,
      inVs: pctVs(a, avgIn), outVs: pctVs(b, avgOut),
      inRank: rankOf(a, 0), outRank: rankOf(b, 1), cum: cumNet[hi],
      date: days[hi].toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }),
    };
  })();

  return (
    <section className="card sk s8">
      <Head icon={Repeat} title="Stock Flow" sub="Last 14 days · kg moved in vs out">
        <div className="sk-legend"><span><i style={{ background: v('--sk-green') }} />In</span><span><i style={{ background: v('--sk-orange') }} />Out</span><span><i className="ln" />Net</span></div>
      </Head>
      <div className="sk-flow" onMouseLeave={() => setHi(null)}>
        <div className="sk-flow-plot">
          <svg viewBox={`0 0 ${W} ${H}`} className="sk-flow-svg">
            <defs>
              <linearGradient id="skIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--sk-green)" /><stop offset="1" stopColor="var(--sk-green)" stopOpacity=".35" /></linearGradient>
              <linearGradient id="skOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--sk-orange)" stopOpacity=".35" /><stop offset="1" stopColor="var(--sk-orange)" /></linearGradient>
            </defs>
            {[-1, -0.5, 0.5, 1].map((t) => <line key={t} className="sk-grid" x1={pl} x2={W - pr} y1={mid - t * (mid - 22)} y2={mid - t * (mid - 22)} />)}
            <text className="sk-ax" x={pl - 8} y={26} textAnchor="end">IN</text>
            <text className="sk-ax" x={pl - 8} y={H - 18} textAnchor="end">OUT</text>

            {/* hovered column guide */}
            {hi !== null && <rect className="sk-hover-col" x={pl + bw * hi} y={8} width={bw} height={H - 22} rx="8" />}

            {FLOW.map(([a, b], i) => {
              const x = pl + bw * i + bw * 0.2; const w = bw * 0.6;
              return (
                <g key={i} className={`sk-bar ${hi === i ? 'on' : ''} ${hi !== null && hi !== i ? 'dim' : ''}`} onMouseEnter={() => setHi(i)}>
                  <rect x={pl + bw * i} y={0} width={bw} height={H} fill="transparent" />
                  <rect className="sk-in" x={x} y={mid - y(a)} width={w} height={y(a)} rx="4" fill="url(#skIn)" style={{ animationDelay: `${i * 40}ms` }} />
                  <rect className="sk-out" x={x} y={mid} width={w} height={y(b)} rx="4" fill="url(#skOut)" style={{ animationDelay: `${i * 40}ms` }} />
                  <text className="sk-day" x={pl + bw * i + bw / 2} y={H - 2} textAnchor="middle">{days[i].getDate()}</text>
                </g>
              );
            })}
            <line className="sk-axis" x1={pl} x2={W - pr} y1={mid} y2={mid} />
            <path className="sk-net" d={netPts.map(([x2, y2], i) => `${i ? 'L' : 'M'}${x2},${y2}`).join('')} />
            {netPts.map(([x2, y2], i) => <circle key={i} className="sk-net-dot" cx={x2} cy={y2} r={hi === i ? 5 : 3} />)}
          </svg>

          {/* hover details card */}
          {d && (
            <div className="sk-tip" style={tipStyle} role="tooltip">
              <div className="sk-tip-h">
                <b>{d.date}</b>
                <span className={`sk-tip-net ${d.net >= 0 ? 'up' : 'dn'}`}>Net {signed(d.net)}</span>
              </div>

              <div className="sk-tip-split" title={`${d.inShare.toFixed(0)}% in / ${(100 - d.inShare).toFixed(0)}% out`}>
                <i style={{ width: `${d.inShare}%` }} />
              </div>

              <div className="sk-tip-row in">
                <span className="lbl"><ArrowDownRight size={13} />Stock in</span>
                <b>{kg(d.a)}</b>
                <small className={d.inVs >= 0 ? 'up' : 'dn'}>{pctTxt(d.inVs)} vs avg</small>
              </div>
              <div className="sk-tip-row out">
                <span className="lbl"><ArrowUpRight size={13} />Stock out</span>
                <b>{kg(d.b)}</b>
                <small className={d.outVs <= 0 ? 'up' : 'dn'}>{pctTxt(d.outVs)} vs avg</small>
              </div>

              <div className="sk-tip-f">
                <span><Trophy size={12} />In rank <strong>#{d.inRank}</strong> of {n}</span>
                <span>Out rank <strong>#{d.outRank}</strong> of {n}</span>
                <span className="full">Running net since {days[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}<strong>{signed(d.cum)}</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="sk-flow-f">
          {hi === null ? (
            <>
              <b>14-day total</b>
              <span style={{ color: v('--sk-green') }}><ArrowDownRight size={13} />{kg(tot[0])} in</span>
              <span style={{ color: v('--sk-orange') }}><ArrowUpRight size={13} />{kg(tot[1])} out</span>
              <span>Net <strong>{signed(tot[0] - tot[1])}</strong></span>
            </>
          ) : (
            <>
              <b>{days[hi].toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</b>
              <span style={{ color: v('--sk-green') }}><ArrowDownRight size={13} />{kg(FLOW[hi][0])} in</span>
              <span style={{ color: v('--sk-orange') }}><ArrowUpRight size={13} />{kg(FLOW[hi][1])} out</span>
              <span>Net <strong>{signed(net[hi])}</strong></span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============ Warehouse capacity ============ */
function Capacity() {
  const R = 30; const C = 2 * Math.PI * R;
  const total = LOCATIONS.reduce((s, l) => [s[0] + l.used, s[1] + l.cap], [0, 0]);
  return (
    <section className="card sk s4">
      <Head icon={Warehouse} title="Store Capacity" sub={`${Math.round((total[0] / total[1]) * 100)}% used across ${LOCATIONS.length} stores`} />
      <div className="sk-cap">
        {LOCATIONS.map((l) => {
          const pct = (l.used / l.cap) * 100; const warn = pct >= 90;
          return (
            <div key={l.name} className={`sk-cap-r ${warn ? 'warn' : ''}`} style={{ '--c': v(warn ? '--sk-red' : l.c) }}>
              <svg viewBox="0 0 76 76" className="sk-ring">
                <circle cx="38" cy="38" r={R} className="sk-ring-t" />
                <circle cx="38" cy="38" r={R} className="sk-ring-v" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 38 38)" />
                <text x="38" y="42" textAnchor="middle">{Math.round(pct)}%</text>
              </svg>
              <div className="sk-cap-m">
                <b>{l.name}</b>
                <span>{kg(l.used)} of {kg(l.cap)}</span>
                <div className="sk-cap-bar"><i style={{ width: `${pct}%` }} /></div>
                <small>{warn ? 'Almost full — move stock out' : `${kg(l.cap - l.used)} free`}</small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============ Product stock levels ============ */
function Levels() {
  return (
    <section className="card sk s7">
      <Head icon={PackageSearch} title="Product Stock Levels" sub="On hand vs reorder point · days of cover" />
      <div className="sk-lv">
        {PRODUCTS.map((p) => {
          const [st, c] = statusOf(p); const cover = Math.floor(p.hand / p.daily);
          return (
            <div key={p.sku} className="sk-lv-r" style={{ '--c': v(c) }}>
              <div className="sk-lv-n"><b>{p.name}</b><small>{p.sku}</small></div>
              <div className="sk-lv-bar" title={`Reorder at ${kg(p.reorder)}`}>
                <i style={{ width: `${Math.min(100, (p.hand / p.max) * 100)}%` }} />
                <em style={{ left: `${(p.reorder / p.max) * 100}%` }} />
              </div>
              <div className="sk-lv-v"><b>{kg(p.hand)}</b><small>{cover} day{cover === 1 ? '' : 's'} cover</small></div>
              <span className="sk-chip">{st}</span>
            </div>
          );
        })}
      </div>
      <div className="sk-lv-leg"><span><i className="b" />On hand</span><span><i className="m" />Reorder point</span></div>
    </section>
  );
}

/* ============ Low-stock alerts ============ */
function Alerts() {
  const low = PRODUCTS.filter((p) => p.hand <= p.reorder).sort((a, b) => a.hand / a.reorder - b.hand / b.reorder);
  return (
    <section className="card sk s5">
      <Head icon={TriangleAlert} title="Reorder Alerts" sub={`${low.length} item${low.length === 1 ? '' : 's'} need attention`} />
      <div className="sk-al">
        {low.map((p) => {
          const [st, c] = statusOf(p); const need = p.max - p.hand; const cover = Math.floor(p.hand / p.daily);
          return (
            <div key={p.sku} className="sk-al-r" style={{ '--c': v(c) }}>
              <span className="sk-al-ic"><TriangleAlert size={16} /></span>
              <div className="sk-al-m">
                <b>{p.name}</b>
                <span>{kg(p.hand)} left · runs out in <strong>{cover} day{cover === 1 ? '' : 's'}</strong></span>
              </div>
              <div className="sk-al-v"><small>Suggested order</small><b>{kg(need)}</b></div>
              <span className="sk-chip">{st}</span>
            </div>
          );
        })}
        <div className="sk-al-ok"><CheckCircle2 size={15} />{PRODUCTS.length - low.length} other products are above their reorder point</div>
      </div>
    </section>
  );
}

/* ============ Recent stock movements: daily trend (chart) or day-by-day table ============ */
const mvDay = (d) => `${d.toLocaleDateString('en-GB', { weekday: 'short' })}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
// monotone cubic curve (Fritsch–Carlson): smooth, never overshoots the points or dips below the baseline
const mvMono = (pts) => {
  const n = pts.length; const t = []; const m = [];
  for (let i = 0; i < n - 1; i++) m.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i]; const b = t[i + 1] / m[i]; const h = a * a + b * b;
    if (h > 9) { const s = 3 / Math.sqrt(h); t[i] = s * a * m[i]; t[i + 1] = s * b * m[i]; }
  }
  const f = (z) => z.toFixed(1);
  return pts.reduce((d, [x, y], i) => {
    if (!i) return `M${f(x)},${f(y)}`;
    const [x0, y0] = pts[i - 1]; const dx = (x - x0) / 3;
    return `${d} C${f(x0 + dx)},${f(y0 + t[i - 1] * dx)} ${f(x - dx)},${f(y - t[i] * dx)} ${f(x)},${f(y)}`;
  }, '');
};
// 7-day weighted (binomial) trend, renormalised at the edges, so the line view reads as a calm curve
const MV_KERNEL = [1, 6, 15, 20, 15, 6, 1];
const mvTrend = (vals) => vals.map((_, i) => {
  let s = 0; let w = 0;
  MV_KERNEL.forEach((k, j) => { const v2 = vals[i + j - 3]; if (v2 !== undefined) { s += v2 * k; w += k; } });
  return s / w;
});
const MV_LINE_STYLE = { in: 'solid', out: 'dash', tr: 'dot' };

function Movements() {
  const [view, setView] = useState('bar'); // 'bar' | 'line'
  const [table, setTable] = useState(false);
  const [hi, setHi] = useState(null);
  const n = MV_SERIES.length;
  const line = view === 'line';
  const tot = MV_SERIES.map((r) => r.in + r.out + r.tr);
  const avg = tot.map((_, i) => { const w = tot.slice(Math.max(0, i - 6), i + 1); return w.reduce((a, b) => a + b, 0) / w.length; });
  const metrics = Object.entries(MV_METRICS); // [label, [key, colour]]

  // chart geometry: 4 grid lines on a "nice" scale (bars stack, lines don't)
  const W = 1100, H = 300, pl = 62, pr = 10, pt = 14, pb = 30;
  const trend = Object.fromEntries(metrics.map(([, [k2]]) => [k2, mvTrend(MV_SERIES.map((row) => row[k2]))]));
  // line view is stacked so the lines never cross: transfers at the bottom, stock out on it, stock in on top
  const STACK_ORDER = ['tr', 'out', 'in'];
  const stack = {};
  STACK_ORDER.reduce((acc, k2) => { stack[k2] = acc.map((val, i) => val + trend[k2][i]); return stack[k2]; }, MV_SERIES.map(() => 0));
  const peak = (line ? Math.max(...stack.in) : Math.max(...tot, ...avg)) * 1.05;
  const step = [100, 250, 500, 750, 1000, 1200, 1500, 2000, 2500, 5000].find((st) => st * 3 >= peak) || Math.ceil(peak / 3);
  const top = step * 3;
  const y = (val) => pt + (1 - val / top) * (H - pt - pb);
  // bars sit in day slots; lines run edge to edge, first day on the left axis, today on the right
  const bw = (W - pl - pr) / (line ? n - 1 : n);
  const cx = (i) => (line ? pl + bw * i : pl + bw * i + bw / 2);
  const avgPath = avg.map((val, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)},${y(val).toFixed(1)}`).join('');
  // each line gets a soft wash that fades down to the baseline
  const curves = metrics.map(([label, [k2, col]]) => {
    const d = mvMono(stack[k2].map((val, i) => [cx(i), y(val)]));
    return { label, k2, col, d, area: `${d} L${cx(n - 1).toFixed(1)},${y(0)} L${cx(0).toFixed(1)},${y(0)} Z` };
  });

  const r = hi === null ? null : MV_SERIES[hi];
  const hiTop = hi === null ? 0 : line ? stack.in[hi] : Math.max(tot[hi], avg[hi]);
  const tipStyle = hi === null ? null : {
    left: `${(cx(hi) / W) * 100}%`,
    top: `${Math.max(4, Math.min(56, (y(hiTop) / H) * 100))}%`,
    transform: hi > n * 0.6 ? 'translate(calc(-100% - 16px),-30%)' : 'translate(16px,-30%)',
  };
  const pickView = (vw) => { setView(vw); setTable(false); setHi(null); };

  return (
    <section className="card sk s12 mv">
      <Head icon={History} title="Recent Stock Movements" sub="Last 30 days · kg moved per day">
        <div className="mv-switch" role="group" aria-label="Chart type">
          <button className={!table && view === 'bar' ? 'on' : ''} onClick={() => pickView('bar')}><BarChart3 size={14} />Bar</button>
          <button className={!table && view === 'line' ? 'on' : ''} onClick={() => pickView('line')}><TrendingUp size={14} />Line</button>
        </div>
        <button className={`mv-view ${table ? 'on' : ''}`} onClick={() => setTable(!table)} title={table ? 'Show chart' : 'Show table'} aria-label={table ? 'Show chart' : 'Show table'}>
          <Table2 size={16} />
        </button>
      </Head>

      <div className="mv-legend">
        {metrics.map(([label, [k2, col]]) => (
          <span key={label}>{line ? <i className={`lk ${MV_LINE_STYLE[k2]}`} style={{ '--sc': v(col) }} /> : <i className="sq" style={{ background: v(col) }} />}{label}</span>
        ))}
        {!line && <span><i className="ln" />7-day average (total moved)</span>}
        {!table && <span className="mv-legend-n">{line ? 'Stacked 7-day trend · gap between lines = kg · hover for exact figures' : 'Today is shown in full colour'}</span>}
      </div>

      {table ? (
        <div className="mv-tbl">
          <table>
            <thead><tr><th>Date</th><th className="r">Stock in</th><th className="r">Stock out</th><th className="r">Transfers</th><th className="r">Total moved</th><th className="r">Net</th><th className="r">Movements</th></tr></thead>
            <tbody>
              {[...MV_SERIES].reverse().map((row, i) => {
                const net = row.in - row.out;
                return (
                  <tr key={+row.d} className={i === 0 ? 'now' : ''}>
                    <td>{mvDay(row.d)}</td>
                    <td className="r in">{kg(row.in)}</td>
                    <td className="r out">{kg(row.out)}</td>
                    <td className="r tr">{kg(row.tr)}</td>
                    <td className="r tot">{kg(row.in + row.out + row.tr)}</td>
                    <td className={`r ${net >= 0 ? 'up' : 'dn'}`}>{net >= 0 ? '+' : '−'}{kg(Math.abs(net))}</td>
                    <td className="r">{row.docs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mv-plot" onMouseLeave={() => setHi(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className={`mv-svg ${line ? 'is-line' : ''}`} key={view}>
            <defs>
              {curves.map((cv) => (
                <linearGradient key={cv.k2} id={`mvG-${cv.k2}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={v(cv.col)} stopOpacity=".12" /><stop offset=".85" stopColor={v(cv.col)} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {[0, 1, 2, 3].map((g) => (
              <g key={g}>
                <line className={`mv-grid ${line ? 'soft' : ''}`} x1={pl} x2={W - pr} y1={y(step * g)} y2={y(step * g)} />
                <text className="mv-ax" x={pl - 10} y={y(step * g) + 4} textAnchor="end">{(step * g).toLocaleString('en-IN')} kg</text>
              </g>
            ))}
            {hi !== null && !line && <rect className="mv-col" x={pl + bw * hi + 2} y={pt} width={bw - 4} height={H - pt - pb} rx="4" />}

            {line ? (
              <>
                {curves.map((cv) => <path key={`a${cv.k2}`} className="mv-area" d={cv.area} fill={`url(#mvG-${cv.k2})`} />)}
                {curves.map((cv) => <path key={`l${cv.k2}`} className={`mv-curve ${MV_LINE_STYLE[cv.k2]}`} d={cv.d} style={{ '--sc': v(cv.col) }} />)}
              </>
            ) : MV_SERIES.map((row, i) => {
              // stacked bottom → top: stock in, stock out, transfers
              let base = 0;
              return (
                <g key={i} className={`mv-stack ${i === n - 1 ? 'today' : ''} ${hi === i ? 'on' : ''} ${hi !== null && hi !== i ? 'dim' : ''}`} style={{ animationDelay: `${i * 18}ms` }}>
                  {metrics.map(([, [k2, col]]) => {
                    const y0 = y(base); base += row[k2]; const y1 = y(base);
                    return <rect key={k2} className="mv-seg" x={pl + bw * i + bw * 0.14} y={y1} width={bw * 0.72} height={Math.max(0, y0 - y1 - 1.2)} rx="2.5" style={{ '--sc': v(col) }} />;
                  })}
                </g>
              );
            })}

            {/* x labels + hover hit areas */}
            {MV_SERIES.map((row, i) => (
              <g key={`x${i}`} onMouseEnter={() => setHi(i)}>
                <rect x={cx(i) - bw / 2} y={0} width={bw} height={H} fill="transparent" />
                {(n - 1 - i) % 3 === 0 && <text className={`mv-ax ${hi === i ? 'on' : ''}`} x={cx(i)} y={H - 8} textAnchor="middle">{row.d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</text>}
              </g>
            ))}

            {hi !== null && <line className="mv-guide" x1={cx(hi)} x2={cx(hi)} y1={pt} y2={y(0)} />}
            {!line && <path className="mv-avg" d={avgPath} />}
            {hi !== null && !line && <circle className="mv-dot" cx={cx(hi)} cy={y(avg[hi])} r="5" />}
            {hi !== null && line && curves.map((cv) => <circle key={cv.k2} className="mv-cdot" cx={cx(hi)} cy={y(stack[cv.k2][hi])} r="4.5" style={{ '--sc': v(cv.col) }} />)}
          </svg>

          {r && (
            <div className="mv-tip" style={tipStyle} role="tooltip">
              <b className="mv-tip-d">{mvDay(r.d)}</b>
              {metrics.map(([label, [k2, col]]) => (
                <div key={k2} className="mv-tip-r"><i style={{ background: v(col) }} /><b>{kg(r[k2])}</b>{label}</div>
              ))}
              <div className="mv-tip-r tot"><i className="none" /><b>{kg(tot[hi])}</b>Total moved · {r.docs} movements</div>
              <div className="mv-tip-r avg"><i /><b>{kg(Math.round(avg[hi]))}</b>7-day average</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ============ Page ============ */
export default function StockPage() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.fromTo('.sk', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', clearProps: 'transform' });
    }, root);
    return () => c.revert();
  }, []);
  // static sample data note
  const note = useMemo(() => 'Sample stock data shown — connect the Stock reports in Zoho Creator to go live.', []);
  return (
    <div className="grid sk-page" ref={root}>
      <StockKpis />
      <StockFlow /><Capacity />
      <Levels /><Alerts />
      <Movements />
      <div className="sk-note s12">{note}</div>
    </div>
  );
}
