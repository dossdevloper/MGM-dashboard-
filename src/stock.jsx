import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Boxes, ArrowDownToLine, ArrowUpFromLine, Scale, TriangleAlert, Warehouse, PackageSearch, History,
  ArrowUpRight, ArrowDownRight, Repeat, CheckCircle2, Trophy, Gauge, BarChart3, Table2, TrendingUp,
} from 'lucide-react';
import DateRangePicker from './datepicker.jsx';
import './stock.css';

/* ============ Stock in / stock out — static sample data (swap for Zoho reports later) ============ */
const v = (n) => `var(${n})`;
const short = (n) => (n >= 10000000 ? `₹${+(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${+(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${+(n / 1000).toFixed(1)}K` : `₹${Math.round(n)}`);
const kg = (n) => `${n.toLocaleString('en-IN')} kg`;

// KPI values per period: [on hand kg, on hand ₹, in kg, out kg, low-stock items]
const KPI = {
  Today: { hand: 18640, value: 2984000, in: 1240, out: 1610, low: 3, inS: [3, 5, 4, 6, 5, 7, 6, 8], outS: [4, 5, 6, 5, 7, 6, 8, 9] },
  'This week': { hand: 18640, value: 2984000, in: 8920, out: 9480, low: 3, inS: [20, 26, 22, 31, 28, 35, 33, 38], outS: [22, 25, 27, 29, 30, 34, 36, 37] },
  'This month': { hand: 18640, value: 2984000, in: 31450, out: 29880, low: 3, inS: [60, 72, 68, 81, 77, 90, 86, 95], outS: [58, 66, 70, 74, 79, 83, 85, 88] },
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
  'This week': { wc: 96, wv: 0.8, pass: 98.1, tr: 18, trKg: 3180 },
  'This month': { wc: 412, wv: 0.7, pass: 98.6, tr: 71, trKg: 12640 },
};
const CAP_TOTAL = LOCATIONS.reduce((s, l) => s + l.cap, 0);
const PER_DAYS = { Today: 1, 'This week': 7, 'This month': 30 };

// custom range: scale this month's daily rates by the number of days, with a small stable wobble per range
const fmtRange = ([a, b]) => {
  const f = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
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
const TANK = { x: 84, y: 112, w: 104, h: 126 };       // balance tank (zone-local)
const DIM_IN = [[196, 238], [218, 238], [240, 238], [196, 150], [218, 150]];
const DIM_OUT = [[32, 238], [54, 238], [76, 238], [32, 150], [54, 150]];

// parabolic hop: x linear, y up then down, small tilt
const hop = (tl, el, from, to, at, dur, lift = 56) => {
  const peak = Math.min(from[1], to[1]) - lift;
  tl.to(el, { x: to[0], duration: dur, ease: 'none' }, at)
    .to(el, { y: peak, rotation: 12, duration: dur * 0.5, ease: 'power2.out' }, at)
    .to(el, { y: to[1], rotation: 0, duration: dur * 0.5, ease: 'power2.in' }, at + dur * 0.5);
};

const SlCrate = ({ c, x = 0, y = 0, cls }) => (
  <g className={cls} transform={x || y ? `translate(${x},${y})` : undefined} style={{ '--cc': v(c) }}><use href="#slCrate" /></g>
);
const SlTruck = ({ cls, c, flip }) => (
  <g className={cls} style={{ '--cc': v(c) }}>
    <g transform={flip ? 'translate(136,246) scale(-1,1)' : 'translate(0,246)'}>
      <rect className="sl-tbed" x="40" y="-80" width="96" height="58" rx="4" />
      <path className="sl-tcab" d="M0,-22 V-46 L10,-60 H36 V-22 Z" />
      <path className="sl-twin" d="M6,-44 L13,-55 H30 V-44 Z" />
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

function StockLine({ per, k, L, days }) {
  const root = useRef(null);
    const wrap = useRef(null);
  const lvl = useRef({ base: 0, din: 0, dout: 0 });
   const [hz, setHz] = useState(null);   // hovered station (0-4)
  const [px, setPx] = useState(null);   // x position of the hover card (px inside the stage)
    const [side, setSide] = useState('');  // side of the station the card sits on: 'r' | 'l' | ''
  const net = k.in - k.out; const top = Math.max(k.in, k.out);
  // tank level: on hand vs total store capacity; in/out bumps scale with the period's flow
  // (read by the GSAP loop, so period changes apply on the next cycle)
  const fill = Math.min(1, k.hand / CAP_TOTAL);
  lvl.current = { base: TANK.y + TANK.h - fill * TANK.h, din: (k.in / top) * 12, dout: (k.out / top) * 12 };
  const chips = [
    [k.in, 'kg', 'received + produced', (k.in / top) * 100],
    [k.out, 'kg', 'dispatched + consumed', (k.out / top) * 100],
    [k.hand, 'kg', `${net >= 0 ? '+' : '−'}${kg(Math.abs(net))} net this period`, (k.hand / CAP_TOTAL) * 100],
    [L.wc, 'checks', `±${L.wv}% avg variance · ${L.pass}% pass`, L.pass],
    [L.tr, 'transfers', `${kg(L.trKg)} moved between stores`, (L.trKg / top) * 100],
  ];
  const share = (k.in / (k.in + k.out)) * 100;
  const fails = Math.round((L.wc * (100 - L.pass)) / 100);
  const sg = (n) => `${n >= 0 ? '+' : '−'}${kg(Math.abs(n))}`;
  // hover card content: label, big value, unit, badge, three detail rows
  const info = [
    { label: 'Received + produced', val: k.in, unit: 'kg', badge: k.in >= k.out ? 'Higher than out' : null,
      rows: [['Share of movement', `${share.toFixed(1)}%`], ['Daily average', kg(Math.round(k.in / days))], ['Net vs stock out', sg(net)]] },
    { label: 'Dispatched + consumed', val: k.out, unit: 'kg', badge: k.out > k.in ? 'Higher than in' : null,
      rows: [['Share of movement', `${(100 - share).toFixed(1)}%`], ['Daily average', kg(Math.round(k.out / days))], ['Net vs stock in', sg(-net)]] },
    { label: 'On hand across stores', val: k.hand, unit: 'kg', badge: net >= 0 ? 'Building up' : 'Drawing down',
      rows: [['Stock value', short(k.value)], ['Net movement', sg(net)], ['Store capacity used', `${((k.hand / CAP_TOTAL) * 100).toFixed(1)}%`]] },
    { label: 'Cartons weighed', val: L.wc, unit: 'checks', badge: `${L.pass}% pass`,
      rows: [['Avg variance', `±${L.wv}%`], ['Passed first time', (L.wc - fails).toLocaleString('en-IN')], ['Re-weighed', `${fails}`]] },
    { label: 'Moved between stores', val: L.tr, unit: 'transfers', badge: 'Store A ⇄ B',
      rows: [['Quantity moved', kg(L.trKg)], ['Avg per transfer', kg(Math.round(L.trKg / L.tr))], ['Share of stock out', `${((L.trKg / k.out) * 100).toFixed(1)}%`]] },
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
      gsap.set('.sl-tw,.sl-prop,.sl-splash,.sl-ok,.sl-bin', { transformOrigin: '50% 50%' });

      /* ---- ambient ---- */
      gsap.fromTo('.sl-pulse', { x: 136 }, { x: 1224, duration: 9, repeat: -1, ease: 'none' });
      gsap.to('.sl-prop', { scaleX: 0.25, duration: 0.07, yoyo: true, repeat: -1, ease: 'none' });
      gsap.to('.sl-led', { opacity: 0.25, duration: 0.5, yoyo: true, repeat: -1, ease: 'steps(1)' });

      /* ---- 01 STOCK IN: truck reverses in, cartons arc onto the rack, truck leaves ---- */
      const OFF = -190; const inC = $('.sl-in');
      const t1 = gsap.timeline({ repeat: -1 });
      t1.set('.sl-t1', { x: 14 + OFF }, 0)
        .set(inC, { x: (i) => IN_BED[i][0] + OFF, y: (i) => IN_BED[i][1], scale: 1, opacity: 1, rotation: 0 }, 0)
        .to('.sl-t1', { x: 14, duration: 2, ease: 'power2.out' }, 0)
        .to(inC, { x: (i) => IN_BED[i][0], duration: 2, ease: 'power2.out' }, 0)
        .to('.sl-t1 .sl-tw', { rotation: '+=540', duration: 2, ease: 'power2.out' }, 0);
      inC.forEach((c, i) => hop(t1, c, IN_BED[i], IN_SLOT[i], 2.3 + i * 0.7, 0.85));
      t1.fromTo('.sl-pop.in', { y: 0, opacity: 0 }, { y: -14, opacity: 1, duration: 0.4, ease: 'power2.out' }, 4.6)
        .to('.sl-pop.in', { opacity: 0, duration: 0.6 }, 5.4)
        .to('.sl-t1', { x: 14 + OFF, duration: 2, ease: 'power2.in' }, 5.2)
        .to('.sl-t1 .sl-tw', { rotation: '-=540', duration: 2, ease: 'power2.in' }, 5.2)
        .to(inC, { opacity: 0, duration: 0.5 }, 6.2)
        .to({}, { duration: 0.001 }, 8.499);

      /* ---- 02 STOCK OUT: cartons appear on the rack, arc onto the truck, truck drives off ---- */
      const OFF2 = 190; const outC = $('.sl-out');
      const t2 = gsap.timeline({ repeat: -1 });
      t2.set('.sl-t2', { x: 128 + OFF2 }, 0)
        .set(outC, { x: (i) => OUT_PICK[i][0], y: (i) => OUT_PICK[i][1], scale: 0, opacity: 1, rotation: 0 }, 0)
        .to('.sl-t2', { x: 128, duration: 2, ease: 'power2.out' }, 0)
        .to('.sl-t2 .sl-tw', { rotation: '+=540', duration: 2, ease: 'power2.out' }, 0)
        .to(outC, { scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.15 }, 0.4);
      outC.forEach((c, i) => hop(t2, c, OUT_PICK[i], OUT_BED[i], 2.3 + i * 0.7, 0.85));
      t2.fromTo('.sl-pop.out', { y: 0, opacity: 0 }, { y: -14, opacity: 1, duration: 0.4, ease: 'power2.out' }, 4.6)
        .to('.sl-pop.out', { opacity: 0, duration: 0.6 }, 5.4)
        .to('.sl-t2', { x: 128 + OFF2, duration: 2, ease: 'power2.in' }, 5.2)
        .to('.sl-t2 .sl-tw', { rotation: '-=540', duration: 2, ease: 'power2.in' }, 5.2)
        .to(outC, { x: `+=${OFF2}`, duration: 2, ease: 'power2.in' }, 5.2)
        .to({}, { duration: 0.001 }, 8.499);

      /* ---- 03 BALANCE: cartons pour into the tank, others drain out; level settles on the real on-hand ---- */
      const lv = $('.sl-lvl'); const off = { o: 0 };
      const level = () => { const y = lvl.current.base - off.o; lv.forEach((g) => g.setAttribute('transform', `translate(0,${y})`)); };
      level();
      gsap.to('.sl-wave', { x: -40, duration: 2.2, repeat: -1, ease: 'none' });
      const tb = gsap.timeline({ repeat: -1 });
      $('.sl-bin').forEach((c, i) => tb
        .set(c, { x: -14, y: 124, opacity: 1, scale: 1, rotation: 0 }, i * 0.6)
        .to(c, { x: 96, duration: 1.1, ease: 'power1.in' }, i * 0.6)
        .to(c, { y: 170, rotation: 25, scale: 0.6, opacity: 0, duration: 0.45, ease: 'power2.in' }, i * 0.6 + 1.1));
      tb.to(off, { o: () => lvl.current.din, duration: 1.2, ease: 'elastic.out(1,0.45)', onUpdate: level }, 1.6)
        .fromTo('.sl-splash', { scale: 0.4, opacity: 0.9 }, { scale: 2.2, opacity: 0, duration: 0.8, ease: 'power2.out' }, 1.6);
      $('.sl-bout').forEach((c, i) => tb
        .set(c, { x: 176, y: 222, opacity: 0, scale: 1 }, 3 + i * 0.6)
        .to(c, { opacity: 1, duration: 0.2 }, 3 + i * 0.6)
        .to(c, { x: 290, duration: 1.4, ease: 'power1.out' }, 3 + i * 0.6));
      tb.to(off, { o: () => lvl.current.din - lvl.current.dout, duration: 1.2, ease: 'power2.inOut', onUpdate: level }, 3.2)
        .to(off, { o: 0, duration: 1, ease: 'power2.inOut', onUpdate: level }, 5.6)
        .to({}, { duration: 0.001 }, 6.999);

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
              <g id="slCrate"><rect className="sl-cr" x="-10" y="-8" width="20" height="16" rx="2.5" /><path className="sl-cr-l" d="M-10,-2 H10 M0,-8 V-2" /></g>
              <clipPath id="slClip"><rect x="0" y="60" width="272" height="196" /></clipPath>
              <clipPath id="slTank"><rect x={TANK.x + 1.5} y={TANK.y + 1.5} width={TANK.w - 3} height={TANK.h - 3} rx="11" /></clipPath>
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
              {IN_BED.map((_, i) => <SlCrate key={i} cls="sl-in" c="--sk-green" />)}
              <text className="sl-pop in" x="218" y="98" textAnchor="middle">+3 CTN</text>
            </g>

            {/* ===== 02 STOCK OUT ===== */}
            <g {...sc(1)}>
              <SlRack x={8} />
              <g opacity=".55">{DIM_OUT.map(([x, y]) => <SlCrate key={`${x}${y}`} c="--sk-orange" x={x} y={y} />)}</g>
              <SlTruck cls="sl-t2" c="--sk-orange" flip />
              {OUT_PICK.map((_, i) => <SlCrate key={i} cls="sl-out" c="--sk-orange" />)}
              <text className="sl-pop out" x="50" y="98" textAnchor="middle">−3 CTN</text>
            </g>

            {/* ===== 03 BALANCE ===== */}
            <g {...sc(2)}>
              <rect className="sl-screen" x="92" y="64" width="88" height="36" rx="8" />
              <text className="sl-sl" x="136" y="77" textAnchor="middle">BALANCE</text>
              <text className="sl-st" x="136" y="94" textAnchor="middle">{k.hand.toLocaleString('en-IN')} kg</text>
              {/* inlet (top-left) and outlet (bottom-right) pipes */}
              <rect className="sl-pipe in" x="0" y="113" width={TANK.x + 6} height="22" rx="4" />
              <path className="sl-pflow in" d={`M6,124 H${TANK.x}`} />
              <text className="sl-ptag" x="36" y="106" textAnchor="middle">IN</text>
              <rect className="sl-pipe out" x={TANK.x + TANK.w - 6} y="211" width={278 - TANK.x - TANK.w} height="22" rx="4" />
              <path className="sl-pflow out" d={`M${TANK.x + TANK.w},222 H266`} />
              <text className="sl-ptag" x="232" y="204" textAnchor="middle">OUT</text>
              {[TANK.x + 14, TANK.x + TANK.w - 18].map((x) => <rect key={x} className="sl-post" x={x} y="238" width="5" height="8" />)}
              {/* tank: liquid level with a moving wave, clipped to the glass */}
              <rect className="sl-tank" x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h} rx="12" />
              <g clipPath="url(#slTank)">
                <g className="sl-lvl">
                  <path className="sl-liq sl-wave" d={`M${TANK.x - 40},0${' q10,-5 20,0 t20,0'.repeat(5)} V${TANK.h + 20} H${TANK.x - 40} Z`} />
                </g>
              </g>
              {[0.25, 0.5, 0.75].map((f) => <line key={f} className="sl-tick" x1={TANK.x + TANK.w - 12} x2={TANK.x + TANK.w} y1={TANK.y + TANK.h * (1 - f)} y2={TANK.y + TANK.h * (1 - f)} />)}
              <rect className="sl-glint" x={TANK.x + 10} y={TANK.y + 10} width="6" height={TANK.h - 24} rx="3" />
              <g className="sl-lvl">
                <path className="sl-lmark" d={`M${TANK.x + TANK.w + 4},0 l8,-5 v10 z`} />
                <text className="sl-lpct" x={TANK.x + TANK.w + 15} y="3.5">{Math.round(fill * 100)}%</text>
              </g>
              <circle className="sl-splash" cx={TANK.x + 24} cy={lvl.current.base} r="8" />
              {[0, 1].map((i) => <SlCrate key={i} cls="sl-bin" c="--sk-green" />)}
              {[0, 1].map((i) => <SlCrate key={i} cls="sl-bout" c="--sk-orange" />)}
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
              <div className="sl-tip-v">{d.val.toLocaleString('en-IN')}<small>{d.unit}</small>{d.badge && <em>{d.badge}</em>}</div>
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
                <b>{val.toLocaleString('en-IN')}<small>{unit}</small></b>
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
  const { k, L, days } = per === 'Custom' && custom ? customStats(custom) : { k: KPI[per], L: LINE[per], days: PER_DAYS[per] };
  const label = per === 'Custom' && custom ? fmtRange(custom) : per;
  return (
    <section className="card sk s12">
      <Head icon={Boxes} title="Stock Overview" sub="Inventory in & out across all stores">
        <Seg options={Object.keys(KPI)} value={per} onChange={setPer} />
        <DateRangePicker value={custom} active={per === 'Custom'} onApply={(r) => { setCustom(r); setPer('Custom'); }} />
      </Head>
      <StockLine per={label} k={k} L={L} days={days} />
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
      gsap.fromTo('.sk-kpi', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, delay: 0.2, ease: 'power2.out', clearProps: 'transform' });
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
