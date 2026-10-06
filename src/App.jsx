import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useContext, createContext } from 'react';
import gsap from 'gsap';
import {
  Users, Contact, Store, MapPin, Truck, Package, FileText, ShoppingCart, Repeat, Scale, Send,
  Droplets, MapPinned, CarFront, Boxes, Layers, Barcode, ListChecks, Tag, Ruler, ClipboardList,
  Search, Sun, Moon, Upload, Plus, ArrowUpRight, TrendingUp, TrendingDown, IndianRupee, UserPlus,CheckCircle2, XCircle, Clock3, PencilLine, BarChart3,Wallet,CalendarClock, Gauge, Cookie, Pause, Play,
} from 'lucide-react';
import './App.css';
import { useSalesOrderStatus, usePayments, PAYMENTS } from './zoho.jsx';

// import './Loader_snippet.jsx';

const Ready = createContext(false);
if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) gsap.globalTimeline.timeScale(3);

/* ============ CONFIG ============ */
const BASE_URL = 'https://creatorapp.zoho.in/mgfportal/mgf-manufacturing';
const zoho = (link) => `${BASE_URL}#Report:${link}`;
const LOGO = 'https://mahaganapathifoods.com/appalam-manufacturers-madurai/appalam-manufacturers-exporters-in-madurai-india.png';
const hideBroken = (e) => { e.currentTarget.style.display = 'none'; };

// Every report here is reachable from the search box (Ctrl/Cmd + K)
const NAV = [
  ['Core Master', [['Customers', Users, 'All_Customers'], ['Employees', Contact, 'All_Employees'], ['Vendors', Store, 'All_Vendors'],
    ['Locations', MapPin, 'All_Locations'], ['Transports', Truck, 'All_Transports'], ['Products', Package, 'All_Products']]],
  ['Transactions & Operation', [['Quotations', FileText, 'All_Quotations'], ['Sales Orders', ShoppingCart, 'All_Sales_Orders'], ['Stock Transfers', Repeat, 'All_Stock_Transfers']]],
  ['Dispatch & Reports', [['Daily Weight Checking Report', Scale, 'Daily_Weight_Checking_Report'], ['All Daily Dispatches', Send, 'All_Daily_Dispatches']]],
  ['Configuration', [['Flavours', Droplets, 'All_Flavours'], ['Location Names', MapPinned, 'All_Location_Names'], ['Vehicles', CarFront, 'All_Vehicles'],
    ['Stock Transfer Items', Boxes, 'All_Stock_Transfer_Items'], ['Packing Variant Report', Layers, 'Packing_variant_Report'], ['Item Codes', Barcode, 'All_Item_Codes'],
    ['Dispatch Items', ListChecks, 'All_Dispatch_Items'], ['Brand Report', Tag, 'Brand_Report'], ['Units', Ruler, 'All_Units'], ['Quotation Items', ClipboardList, 'All_Quotation_Items']]],
];
const FLAT = NAV.flatMap(([group, items]) => items.map(([label, icon, link]) => ({ label, group, icon, link })));

/* ---------- sample data (replace with Zoho Creator API calls) ---------- */
const KPIS = [
  { label: 'Open Sales Orders', icon: ShoppingCart, value: 1284, dec: 0, delta: 12.4, spark: [22, 26, 24, 31, 29, 36, 34, 41, 39, 47], c: '--gold' },
  { label: 'Pending Quotations', icon: FileText, value: 342, dec: 0, delta: -3.1, spark: [40, 38, 42, 36, 37, 33, 35, 30, 31, 28], c: '--chilli' },
  { label: 'Dispatched Today', icon: Truck, value: 4.2, dec: 1, suffix: ' MT', delta: 8.2, spark: [12, 18, 15, 22, 20, 27, 25, 31, 34, 38], c: '--leaf' },
  { label: 'Weight Variance', icon: Scale, value: 0.82, dec: 2, suffix: '%', delta: -0.14, goodDown: true, spark: [30, 28, 31, 26, 27, 22, 24, 20, 19, 17], c: '--volt' },
];
const PIPE = [{ label: 'Quotations', v: 342, c: '--chilli' }, { label: 'Sales Orders', v: 518, c: '--gold' }, { label: 'Loading', v: 96, c: '--toast' }, { label: 'Dispatched', v: 214, c: '--leaf' }];
// important modules: master = gold, transactions = chilli, dispatch = leaf
const MODS = [
  ['Sales Orders', 518, '--chilli', 'All_Sales_Orders'], ['Quotations', 342, '--chilli', 'All_Quotations'], ['Customers', 248, '--gold', 'All_Customers'],
  ['Daily Dispatches', 214, '--leaf', 'All_Daily_Dispatches'], ['Weight Checks', 198, '--leaf', 'Daily_Weight_Checking_Report'], ['Stock Transfers', 156, '--chilli', 'All_Stock_Transfers'],
  ['Employees', 78, '--gold', 'All_Employees'], ['Products', 64, '--gold', 'All_Products'], ['Vendors', 37, '--gold', 'All_Vendors'],
];
const BRANDS = [['Take It', 34], ['Velam', 27], ['Bells', 19], ['Lakshmi', 13], ['Maharaja', 7]];
const WEIGHT = [['M', 0.6], ['T', 0.9], ['W', 0.7], ['T', 1.1], ['F', 0.8], ['S', 0.5], ['M', 1.3], ['T', 0.9], ['W', 0.7], ['T', 0.82]];
const UNITS = [['Unit A', 92, '--gold'], ['Unit B', 78, '--chilli'], ['Unit C', 64, '--leaf']];
const ROWS = [
  ['DSP-2041', 'Sri Balaji Agencies', 'TN 09 AX 4821', 'Plain Appalam · 1kg', 2.4, 'dispatched', '#D92B26'],
  ['DSP-2040', 'Kovai Distributors', 'TN 38 BC 1172', 'Kerala Pappadam · 500g', 3.1, 'loading', '#12A150'],
  ['DSP-2039', 'Madurai Cold Chain', 'TN 58 CD 9034', 'Ring Papad · 250g', 1.8, 'weighing', '#D9722B'],
  ['DSP-2038', 'Nilgiri Traders', 'TN 43 AF 7710', 'Jeera Appalam · 500g', 2.9, 'delivered', '#0097C7'],
  ['DSP-2037', 'Ocean Foods Pvt Ltd', 'TN 01 BY 2265', 'Madras Plain Poppadom', 4.2, 'delivered', '#7A1F1A'],
  ['DSP-2036', 'Metro Retail Hub', 'TN 07 CK 3358', 'Masala Appalam · 250g', 2.2, 'dispatched', '#12A150'],
];
const TICK = { dispatched: '--gold', loading: '--toast', weighing: '--chilli', delivered: '--leaf' };

const WEEK = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  rev: [320, 410, 255, 510, 703, 610, 335],   // revenue in ₹K
  ord: [90, 115, 72, 144, 201, 176, 95],
};
const TODAY = [
  [ShoppingCart, 'New Orders', '24', '--w-orange'], [IndianRupee, 'Revenue', '₹87.4K', '--w-green'],
  [Truck, 'Deliveries', '18 done', '--w-blue'], [UserPlus, 'New Customers', '7 joined', '--w-purple'],
];

const PAY_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const INV_REPORT = 'All_Invoices'; // change to your Zoho Creator invoice report link name
const INV_STATUS = [
  ['Draft', 3, '--w-tan'], ['Issued', 11, '--w-blue'], ['Partially Paid', 4, '--w-gold'],
  ['Paid', 9, '--w-green'], ['Cancelled', 3, '--w-red'],
];
const INV_STATS = [
  ['Today', 0, 0, '--w-purple'], ['This week', 128500, 4, '--w-blue'],
  ['This month', 411400, 26, '--w-orange'], ['This year', 1948400, 30, '--w-green'],
];
const INVOICES = [ // id, status, customer, due, amount
  ['INV-000454', 'Issued', 'Sri Balaji Agencies', '12-Oct-2026', 101300],
  ['INV-000453', 'Partially Paid', 'Kovai Distributors', '10-Oct-2026', 22800],
  ['INV-000452', 'Paid', 'Madurai Cold Chain', '29-Sep-2026', 70700],
  ['INV-000451', 'Draft', 'Nilgiri Traders', '15-Oct-2026', 130500],
  ['INV-000450', 'Cancelled', 'Ocean Foods Pvt Ltd', '09-Oct-2026', 8700],
];
/* ============ helpers ============ */
const v = (n) => `var(${n})`;
function smooth(p) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}
function rng(s) {
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const series = (n, seed, base, amp) => { const r = rng(seed); return Array.from({ length: n }, (_, i) => Math.max(4, Math.round(base + amp * Math.sin(i / 2.3 + seed) + (r() - 0.5) * amp * 0.9 + i * 0.4))); };
const dayLabels = (n) => Array.from({ length: n }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (n - 1 - i)); return x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); });

/* ============ Loader: centred logo, then two doors open to the sides ============ */
const MSGS = ['Mixing the dough', 'Rolling thin appalams', 'Sun-drying the batch', 'Weighing & checking', 'Packing the cartons', 'Opening the gates'];
function Face({ pores }) {
  return (
    <div className="face">
      <div className="ld-plate">
        <svg viewBox="0 0 200 200" className="ld-disc">
          <circle cx="100" cy="100" r="96" className="ld-d1" /><circle cx="100" cy="100" r="86" className="ld-d2" />
          {pores.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={p[2]} className="ld-pore" />)}
        </svg>
        <svg viewBox="0 0 200 200" className="ld-ring"><circle cx="100" cy="100" r="98" /></svg>
        <div className="ld-logo"><img src={LOGO} alt="Mahaganapathi Foods" onError={hideBroken} /><b>MGF</b></div>
      </div>
      <div className="ld-word">MAHAGANAPATHI FOODS</div>
      <div className="ld-bar"><i /></div>
      <div className="ld-meta"><span className="ld-msg">{MSGS[0]}</span><span className="ld-pct">0%</span></div>
    </div>
  );
}
function Loader({ onExit, onDone }) {
  const root = useRef(null);
  const pores = useMemo(() => { const r = rng(11); return Array.from({ length: 46 }, () => { const a = r() * 6.283, d = 12 + r() * 74; return [100 + Math.cos(a) * d, 100 + Math.sin(a) * d, 1 + r() * 2.2]; }); }, []);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prog = { v: 0 };
      const all = (s) => root.current.querySelectorAll(s);
      gsap.to('.ld-disc', { rotation: 360, transformOrigin: '50% 50%', duration: 9, repeat: -1, ease: 'none' });
      gsap.to('.ld-ring', { rotation: -360, transformOrigin: '50% 50%', duration: 5, repeat: -1, ease: 'none' });
const tl = gsap.timeline({ onComplete: onDone });
gsap.set('.seam', { scaleY: 0, opacity: 0, transformOrigin: '50% 50%' });
tl.from('.ld-plate', { scale: 0, rotation: -140, duration: 1, ease: 'back.out(1.6)' }, 0)
  .from('.ld-word,.ld-bar,.ld-meta', { opacity: 0, y: 14, duration: 0.5, stagger: 0.08 }, 0.5)
  .to(prog, {
    v: 100, duration: 2.4, ease: 'power1.inOut',
    onUpdate: () => {
      const p = prog.v;
      all('.ld-bar i').forEach((el) => { el.style.transform = `scaleX(${p / 100})`; });
      all('.ld-pct').forEach((el) => { el.textContent = `${Math.round(p)}%`; });
      all('.ld-msg').forEach((el) => { el.textContent = MSGS[Math.min(MSGS.length - 1, Math.floor(p / (100 / MSGS.length)))]; });
    },
  }, 0.6)
  // 100% reached: logo pulse, text fades out
  .to('.ld-logo', { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '+=.1')
  .to('.ld-bar,.ld-meta,.ld-word', { opacity: 0, duration: 0.3 }, '<')
  // only now the line appears
  .to('.seam', { opacity: 1, scaleY: 1, duration: 0.5, ease: 'power2.out' }, '>-0.05')
  // then the doors open smoothly
  .addLabel('open', '+=0.15')
  .call(onExit, null, 'open')
  .to('.door', { '--edge': 1, duration: 0.3 }, 'open')
  .to('.door-l', { xPercent: -100, duration: 1.4, ease: 'power3.inOut' }, 'open')
  .to('.door-r', { xPercent: 100, duration: 1.4, ease: 'power3.inOut' }, 'open')
  .to('.seam', { opacity: 0, duration: 0.5 }, 'open+=0.3');
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="loader" ref={root} role="status" aria-label="Loading">
      <div className="door door-l"><Face pores={pores} /></div>
      <div className="door door-r"><Face pores={pores} /></div>
      <div className="seam" />
    </div>
  );
}

/* ============ atoms ============ */
const Card = ({ className = '', children, style }) => <section className={`card reveal ${className}`} style={style}>{children}</section>;
function CountUp({ to, dec = 0, suffix = '', delay = 0 }) {
  const ready = useContext(Ready); const ref = useRef(null);
  const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
  useEffect(() => {
    if (!ready) return undefined;
    const o = { v: 0 };
    const t = gsap.to(o, { v: to, duration: 1.6, delay, ease: 'power3.out', onUpdate: () => { if (ref.current) ref.current.textContent = fmt(o.v); } });
    return () => t.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, to]);
  return <span ref={ref}>{fmt(0)}</span>;
}
const Seg = ({ options, value, onChange }) => (
  <div className="seg">{options.map((o) => <button key={o} className={o === value ? 'on' : ''} onClick={() => onChange(o)}>{o}</button>)}</div>
);
function Spark({ data, color, delay }) {
  const ready = useContext(Ready); const r = useRef(null);
  const W = 110, H = 36, mx = Math.max(...data), mn = Math.min(...data);
  const pts = data.map((val, i) => [i * (W / (data.length - 1)), H - 4 - ((val - mn) / (mx - mn || 1)) * (H - 8)]);
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => { gsap.fromTo('.sl', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, delay, ease: 'power2.out' }); }, r);
    return () => c.revert();
  }, [ready, delay]);
  return (
    <svg ref={r} className="spark" viewBox={`0 0 ${W} ${H}`}>
      <path className="sl" d={smooth(pts)} pathLength="1" fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: v(color), strokeDasharray: 1, strokeDashoffset: 1 }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" style={{ fill: v(color) }} />
    </svg>
  );
}

/* ============ widgets ============ */
function Kpi({ k, i }) {
  const good = (k.delta > 0 && !k.goodDown) || (k.delta < 0 && k.goodDown);
  const Ic = k.icon; const Trend = k.delta > 0 ? TrendingUp : TrendingDown;
  return (
    <Card className="s3 kpi" style={{ '--c': v(k.c) }}>
      <div className="kpi-top"><span>{k.label}</span><span className="kpi-ic"><Ic size={18} strokeWidth={2} /></span></div>
      <div className="kpi-v"><CountUp to={k.value} dec={k.dec} suffix={k.suffix || ''} delay={0.15 + i * 0.08} /></div>
      <div className="kpi-bot">
        <span className={`delta ${good ? 'up' : 'dn'}`}><Trend size={12} strokeWidth={2.4} />{Math.abs(k.delta)}%</span>
        <Spark data={k.spark} color={k.c} delay={0.2 + i * 0.1} />
      </div>
    </Card>
  );
}

function AreaChart() {
  const ready = useContext(Ready);
  const [range, setRange] = useState('14D'); const [hi, setHi] = useState(null); const wrap = useRef(null);
  const n = range === '7D' ? 7 : range === '14D' ? 14 : 30;
  const W = 720, H = 270, pl = 38, pr = 10, pt = 14, pb = 28;
  const data = useMemo(() => ({ lab: dayLabels(n), a: series(n, 7, 34, 9), b: series(n, 3, 48, 10) }), [n]);
  const mx = Math.ceil(Math.max(...data.a, ...data.b) / 10) * 10 + 10;
  const X = (i) => pl + (i * (W - pl - pr)) / (n - 1);
  const Y = (val) => pt + (1 - val / mx) * (H - pt - pb);
  const da = smooth(data.a.map((val, i) => [X(i), Y(val)])); const db = smooth(data.b.map((val, i) => [X(i), Y(val)]));
  const step = Math.ceil(n / 6);
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      gsap.fromTo('.ln', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.15, ease: 'power2.inOut' });
      gsap.fromTo('.ar', { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.6 });
    }, wrap);
    return () => c.revert();
  }, [ready, range]);
  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * W;
    setHi(Math.max(0, Math.min(n - 1, Math.round((x - pl) / ((W - pl - pr) / (n - 1))))));
  };
  const tipPos = hi === null ? {} : { left: `${(X(hi) / W) * 100}%`, transform: hi > n * 0.7 ? 'translateX(-105%)' : hi < n * 0.2 ? 'translateX(8px)' : 'translateX(-50%)' };
  return (
    <Card className="s8">
      <div className="card-h">
        <div><div className="card-t">Orders vs dispatch</div><div className="card-s">Daily volume across all locations</div></div>
        <div className="row">
          <div className="legend"><span><i style={{ background: v('--chilli') }} />Orders</span><span><i style={{ background: v('--gold') }} />Dispatched</span></div>
          <Seg options={['7D', '14D', '30D']} value={range} onChange={setRange} />
        </div>
      </div>
      <div className="chart-wrap" ref={wrap} onMouseLeave={() => setHi(null)}>
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove}>
          <defs>
            <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: v('--gold'), stopOpacity: 0.45 }} /><stop offset="1" style={{ stopColor: v('--gold'), stopOpacity: 0 }} /></linearGradient>
            <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: v('--chilli'), stopOpacity: 0.25 }} /><stop offset="1" style={{ stopColor: v('--chilli'), stopOpacity: 0 }} /></linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => { const tv = Math.round(mx * t); return (
            <g key={t}><line x1={pl} x2={W - pr} y1={Y(tv)} y2={Y(tv)} stroke="var(--soft)" strokeDasharray="2 6" /><text className="axis" x={pl - 8} y={Y(tv) + 3.5} textAnchor="end">{tv}</text></g>
          ); })}
          {data.lab.map((l, i) => (i % step === 0 ? <text key={i} className="axis" x={X(i)} y={H - 6} textAnchor="middle">{l}</text> : null))}
          <path className="ar" d={`${db}L${X(n - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill="url(#gb)" />
          <path className="ar" d={`${da}L${X(n - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill="url(#ga)" />
          <path className="ln" d={db} pathLength="1" fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: v('--chilli'), strokeDasharray: 1, strokeDashoffset: 1 }} />
          <path className="ln" d={da} pathLength="1" fill="none" strokeWidth="3.4" strokeLinecap="round" style={{ stroke: v('--gold'), strokeDasharray: 1, strokeDashoffset: 1 }} />
          {hi !== null && (
            <g>
              <line x1={X(hi)} x2={X(hi)} y1={pt} y2={H - pb} stroke="var(--muted)" strokeDasharray="3 3" />
              <circle cx={X(hi)} cy={Y(data.a[hi])} r="5.5" style={{ fill: v('--gold'), stroke: v('--line'), strokeWidth: 2 }} />
              <circle cx={X(hi)} cy={Y(data.b[hi])} r="5" style={{ fill: v('--chilli'), stroke: v('--line'), strokeWidth: 2 }} />
            </g>
          )}
        </svg>
        {hi !== null && (
          <div className="tip" style={tipPos}>
            <b>{data.lab[hi]}</b>
            <div><i style={{ background: v('--chilli') }} />Orders <em>{data.b[hi]}</em></div>
            <div><i style={{ background: v('--gold') }} />Dispatched <em>{data.a[hi]}</em></div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* donut: order pipeline */
function Pipeline() {
  const ready = useContext(Ready); const r = useRef(null); const [h, setH] = useState(null);
  const R = 66, C = 2 * Math.PI * R; const total = PIPE.reduce((s, p) => s + p.v, 0);
  let acc = 0;
  const segs = PIPE.map((p) => { const len = (p.v / total) * C; const o = { ...p, len, off: acc }; acc += len; return o; });
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      segs.forEach((s, i) => gsap.fromTo(`.seg${i}`, { strokeDasharray: `0 ${C}` }, { strokeDasharray: `${Math.max(0, s.len - 5)} ${C}`, duration: 1.1, delay: 0.2 + i * 0.14, ease: 'power3.out' }));
    }, r);
    return () => c.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return (
    <Card className="s4">
      <div className="card-h"><div><div className="card-t">Order pipeline</div><div className="card-s">Quotation to dispatch</div></div></div>
      <div className="donut-w" ref={r}>
        <div className="donut">
          <svg viewBox="0 0 176 176" width="176" height="176">
            <g transform="rotate(-90 88 88)">
              <circle cx="88" cy="88" r={R} fill="none" stroke="var(--soft)" strokeWidth="16" />
              {segs.map((s, i) => (
                <circle key={i} className={`seg${i}`} cx="88" cy="88" r={R} fill="none" strokeWidth={h === i ? 20 : 16} strokeLinecap="round" strokeDashoffset={-s.off}
                  style={{ stroke: v(s.c), strokeDasharray: `0 ${C}`, transition: 'stroke-width .25s', cursor: 'pointer' }}
                  onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)} />
              ))}
            </g>
          </svg>
          <div className="donut-c"><b>{(h === null ? total : segs[h].v).toLocaleString('en-IN')}</b><span>{h === null ? 'Total' : segs[h].label}</span></div>
        </div>
        <div className="dl">
          {segs.map((s, i) => (
            <div key={i} className={`dl-i ${h === i ? 'on' : ''}`} onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)}>
              <i style={{ background: v(s.c) }} />{s.label}<b>{s.v}</b>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* horizontal bars: the important modules, each bar opens its Zoho report */
function ModuleBars() {
  const ready = useContext(Ready); const r = useRef(null); const mx = MODS[0][1];
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => { gsap.fromTo('.hb-f', { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.07, ease: 'power3.out', delay: 0.2 }); }, r);
    return () => c.revert();
  }, [ready]);
  return (
    <Card className="s12">
      <div className="card-h">
        <div><div className="card-t">Records by module</div><div className="card-s">Click a bar to open the report in Zoho Creator</div></div>
        <div className="legend"><span><i style={{ background: v('--gold') }} />Master</span><span><i style={{ background: v('--chilli') }} />Transactions</span><span><i style={{ background: v('--leaf') }} />Dispatch</span></div>
      </div>
      <div className="hbars" ref={r}>
        {MODS.map(([name, val, c, link]) => (
          <a key={name} className="hb" href={zoho(link)} target="_blank" rel="noopener noreferrer">
            <span className="hb-n">{name}</span>
            <span className="hb-t"><span className="hb-f" style={{ width: `${(val / mx) * 100}%`, background: v(c), '--bc': `color-mix(in srgb,${v(c)} 60%,transparent)` }} /></span>
            <b className="hb-v">{val}</b>
          </a>
        ))}
      </div>
    </Card>
  );
}

/* vertical bars with optional limit line */
function VBars({ title, sub, data, limit, unit = '', colorFor, link }) {
  const ready = useContext(Ready); const r = useRef(null);
  const mx = Math.max(...data.map((d) => d[1]), limit || 0) * 1.15;
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => { gsap.fromTo('.vb-f', { scaleY: 0 }, { scaleY: 1, duration: 1, stagger: 0.06, ease: 'back.out(1.4)', delay: 0.2 }); }, r);
    return () => c.revert();
  }, [ready]);
  return (
    <Card className="s4">
      <div className="card-h">
        <div><div className="card-t">{title}</div><div className="card-s">{sub}</div></div>
        {link && <a className="icon-btn sm" href={zoho(link)} target="_blank" rel="noopener noreferrer" aria-label="Open report"><ArrowUpRight size={16} /></a>}
      </div>
      <div className="vbars" ref={r}>
        {limit && <div className="vb-lim" style={{ bottom: `calc(${(limit / mx) * 100}% + 22px)` }}><span>limit {limit}{unit}</span></div>}
        {data.map(([l, val], i) => (
          <div className="vb" key={i} title={`${l}: ${val}${unit}`}>
            <b>{val}{unit}</b>
            <div className="vb-t"><div className="vb-f" style={{ height: `${(val / mx) * 100}%`, background: v(colorFor ? colorFor(val, i) : '--gold') }} /></div>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* concentric rings: unit output vs daily target */
function Rings() {
  const ready = useContext(Ready); const r = useRef(null); const rad = [72, 53, 34];
  const avg = Math.round(UNITS.reduce((s, u) => s + u[1], 0) / UNITS.length);
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      UNITS.forEach(([, p], i) => { const C = 2 * Math.PI * rad[i]; gsap.fromTo(`.rg${i}`, { strokeDasharray: `0 ${C}` }, { strokeDasharray: `${(C * p) / 100} ${C}`, duration: 1.3, delay: 0.2 + i * 0.15, ease: 'power3.out' }); });
    }, r);
    return () => c.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return (
    <Card className="s4">
      <div className="card-h"><div><div className="card-t">Unit output</div><div className="card-s">Today vs daily target</div></div></div>
      <div className="donut-w" ref={r}>
        <div className="donut">
          <svg viewBox="0 0 176 176" width="176" height="176">
            <g transform="rotate(-90 88 88)">
              {UNITS.map(([, , c], i) => (
                <g key={i}>
                  <circle cx="88" cy="88" r={rad[i]} fill="none" stroke="var(--soft)" strokeWidth="13" />
                  <circle className={`rg${i}`} cx="88" cy="88" r={rad[i]} fill="none" strokeWidth="13" strokeLinecap="round" style={{ stroke: v(c), strokeDasharray: `0 ${2 * Math.PI * rad[i]}` }} />
                </g>
              ))}
            </g>
          </svg>
          <div className="donut-c"><b>{avg}%</b><span>Average</span></div>
        </div>
        <div className="dl">{UNITS.map(([n, p, c]) => <div key={n} className="dl-i"><i style={{ background: v(c) }} />{n}<b>{p}%</b></div>)}</div>
      </div>
    </Card>
  );
}


/* sales order status: donut + list + order health */
function SalesStatus() {
  const ready = useContext(Ready); const r = useRef(null); const [h, setH] = useState(null);
  const dn = useRef(null); const [tp, setTp] = useState(null);
  const moveTip = (e) => { const b = dn.current.getBoundingClientRect(); setTp({ x: e.clientX - b.left, y: e.clientY - b.top }); };
  const { rows: SO_STATUS, loading } = useSalesOrderStatus();
  const R = 66, C = 2 * Math.PI * R, GAP = 3;
  const total = SO_STATUS.reduce((s, x) => s + x[1], 0);
  const val = (name) => SO_STATUS.find((x) => x[0] === name)?.[1] || 0;
  const pct = (n) => `${(total ? (n / total) * 100 : 0).toFixed(1)}%`;
  let acc = 0;
  const segs = SO_STATUS.map(([label, n, c]) => { const len = total ? (n / total) * C : 0; const o = { label, v: n, c, len, off: acc }; acc += len; return o; });
  const segKey = segs.map((s) => s.v).join(',');
  const health = [
    [CheckCircle2, 'Completion rate', pct(val('Completed')), '--w-green'],
    [XCircle, 'Cancellation rate', pct(val('Cancelled')), '--w-red'],
    [Truck, 'In progress', val('Confirmed') + val('Shipped'), '--w-blue'],
    [PencilLine, 'Drafts', val('Draft'), '--w-tan'],
  ];
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.45 });
      tl.from('.wm-h', { opacity: 0, y: -14, duration: 0.5 }, 0)
        .from('.donut svg', { scale: 0.6, rotation: -40, opacity: 0, duration: 0.9, ease: 'back.out(1.5)', transformOrigin: '50% 50%' }, 0.1)
        .from('.donut-c', { opacity: 0, scale: 0.8, duration: 0.6 }, 0.5)
        .from('.wm-row', { opacity: 0, x: 28, duration: 0.5, stagger: 0.08, clearProps: 'opacity,transform' }, 0.25)
        .from('.wm-sec', { opacity: 0, x: -10, duration: 0.5 }, 0.8)
        .from('.wm-t', { opacity: 0, y: 16, scale: 0.94, duration: 0.5, stagger: 0.08, clearProps: 'opacity,transform' }, 0.9);
    }, r);
    return () => c.revert();
  }, [ready]);
  // donut segments: re-animate whenever the live counts arrive / change
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      segs.forEach((s, i) => gsap.fromTo(`.so${i}`, { strokeDasharray: `0 ${C}` }, { strokeDasharray: `${Math.max(0, s.len - GAP)} ${C}`, duration: 1.1, delay: 0.6 + i * 0.12, ease: 'power3.out' }));
    }, r);
    return () => c.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, segKey]);
  return (
    <Card className="s6 warm">
      <div className="wm-wrap" ref={r}>
        <div className="wm-h">
          <div className="wm-title"><span className="wm-ico"><ShoppingCart size={18} strokeWidth={2.2} /></span>Sales Order Status</div>
          <span className="wm-badge">{loading ? 'Loading…' : `${total.toLocaleString('en-IN')} Total`}</span>
        </div>

        <div className="wm-body">
          <div className="donut" ref={dn}>
            <svg viewBox="0 0 176 176">
              <g transform="rotate(-90 88 88)">
                <circle cx="88" cy="88" r={R} fill="none" stroke="var(--w-cream)" strokeWidth="26" />
                {segs.map((s, i) => (
                  <circle key={s.label} className={`so${i}`} cx="88" cy="88" r={R} fill="none" strokeWidth={h === i ? 30 : 26} strokeDashoffset={-s.off}
                    style={{ stroke: v(s.c), strokeDasharray: `0 ${C}`, opacity: h === null || h === i ? 1 : 0.4, transition: 'stroke-width .25s, opacity .25s', cursor: 'pointer' }}
                    onMouseEnter={(e) => { setH(i); moveTip(e); }} onMouseMove={moveTip} onMouseLeave={() => { setH(null); setTp(null); }} />
                ))}
              </g>
            </svg>
            <div className="donut-c"><b>{(h === null ? total : segs[h].v).toLocaleString('en-IN')}</b><span>{h === null ? 'Orders' : segs[h].label}</span></div>
            {h !== null && tp && (
              <div className="so-tip" style={{ left: tp.x, top: tp.y, '--c': v(segs[h].c) }}>
                <small>{segs[h].label}</small><b>{segs[h].v.toLocaleString('en-IN')}</b>
              </div>
            )}
          </div>

          <div className="wm-list">
            {segs.map((s, i) => (
              <a key={s.label} className={`wm-row ${h === i ? 'on' : ''} ${h !== null && h !== i ? 'dim' : ''}`} href={zoho('All_Sales_Orders')} target="_blank" rel="noopener noreferrer"
                onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)}>
                <i style={{ background: v(s.c) }} />{s.label}<b style={{ color: v(s.c) }}>{s.v}</b>
              </a>
            ))}
          </div>
        </div>

        <div className="wm-sec"><BarChart3 size={16} strokeWidth={2.2} />Order health</div>
        <div className="wm-tiles">
          {health.map(([Ic, label, value, c]) => (
            <div key={label} className="wm-t" style={{ '--c': v(c) }}>
              <span className="wm-e"><Ic size={19} strokeWidth={2.2} /></span>
              <div><small>{label}</small><b>{value}</b></div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* weekly revenue (₹K) + orders, with today's highlights */
function WeeklyRevenue() {
  const ready = useContext(Ready); const wrap = useRef(null); const [hi, setHi] = useState(null);
  const W = 720, H = 250, pl = 40, pr = 30, pt = 14, pb = 30, n = WEEK.days.length, mx = 800;
  const X = (i) => pl + (i * (W - pl - pr)) / (n - 1);
  const Y = (val) => pt + (1 - val / mx) * (H - pt - pb);
  const pr_ = WEEK.rev.map((val, i) => [X(i), Y(val)]); const po_ = WEEK.ord.map((val, i) => [X(i), Y(val)]);
  const dr = smooth(pr_); const dor = smooth(po_);
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.45 });
      tl.from('.wm-h', { opacity: 0, y: -14, duration: 0.5 }, 0)
        .from('.chart-wrap', { opacity: 0, y: 16, duration: 0.6 }, 0.1)
        .fromTo('.wl', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.15, ease: 'power2.inOut' }, 0.3)
        .fromTo('.wa', { opacity: 0 }, { opacity: 1, duration: 1 }, 0.9)
        .fromTo('.wdot', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(2)', clearProps: 'transform' }, 1.1)
        .from('.wm-legend span', { opacity: 0, y: 8, duration: 0.4, stagger: 0.1 }, 1.2)
        .from('.wm-sec', { opacity: 0, x: -10, duration: 0.5 }, 1)
        .from('.wm-t', { opacity: 0, y: 16, scale: 0.94, duration: 0.5, stagger: 0.08, clearProps: 'opacity,transform' }, 1.1);
    }, wrap);
    return () => c.revert();
  }, [ready]);
  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * W;
    setHi(Math.max(0, Math.min(n - 1, Math.round((x - pl) / ((W - pl - pr) / (n - 1))))));
  };
  const tipPos = hi === null ? {} : { left: `${(X(hi) / W) * 100}%`, transform: hi > n * 0.6 ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)' };
  const dots = (pts, c) => pts.map(([x, y], i) => <circle key={i} className="wdot" cx={x} cy={y} r={hi === i ? 6.5 : 4.5} style={{ fill: v(c), stroke: '#fff', strokeWidth: 2, transition: 'r .15s' }} />);
  return (
    <Card className="s6 warm">
      <div className="wm-wrap" ref={wrap}>
        <div className="wm-h">
          <div className="wm-title"><span className="wm-ico"><TrendingUp size={18} strokeWidth={2.2} /></span>Weekly Revenue &amp; Orders</div>
        </div>

        <div className="chart-wrap" onMouseLeave={() => setHi(null)}>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove}>
            <defs>
              <linearGradient id="wgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: v('--w-orange'), stopOpacity: 0.22 }} /><stop offset="1" style={{ stopColor: v('--w-orange'), stopOpacity: 0 }} /></linearGradient>
              <linearGradient id="wgo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: v('--w-olive'), stopOpacity: 0.28 }} /><stop offset="1" style={{ stopColor: v('--w-olive'), stopOpacity: 0 }} /></linearGradient>
            </defs>
            {[0, 200, 400, 600, 800].map((t) => (
              <g key={t}><line x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} style={{ stroke: v('--w-line') }} strokeDasharray="3 5" /><text className="axis" x={pl - 10} y={Y(t) + 4} textAnchor="end">{t}</text></g>
            ))}
            {WEEK.days.map((d, i) => <text key={d} className="axis" x={X(i)} y={H - 8} textAnchor="middle" style={{ fill: hi === i ? v('--w-ink') : undefined }}>{d}</text>)}
            {hi !== null && <line x1={X(hi)} x2={X(hi)} y1={pt} y2={H - pb} style={{ stroke: v('--w-tan') }} strokeDasharray="3 3" />}
            <path className="wa" d={`${dr}L${X(n - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill="url(#wgr)" />
            <path className="wa" d={`${dor}L${X(n - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill="url(#wgo)" />
            <path className="wl" d={dr} pathLength="1" fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: v('--w-orange'), strokeDasharray: 1, strokeDashoffset: 1 }} />
            <path className="wl" d={dor} pathLength="1" fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: v('--w-olive'), strokeDasharray: 1, strokeDashoffset: 1 }} />
            {dots(po_, '--w-olive')}{dots(pr_, '--w-orange')}
          </svg>
          {hi !== null && (
            <div className="tip wm-tip" style={tipPos}>
              <b>{WEEK.days[hi]}</b>
              <div style={{ color: v('--w-olive') }}>Orders : {WEEK.ord[hi]} orders</div>
              <div style={{ color: v('--w-orange') }}>Revenue : ₹{WEEK.rev[hi]}K</div>
            </div>
          )}
        </div>

        <div className="wm-legend"><span><i style={{ background: v('--w-orange') }} />Revenue (₹K)</span><span><i style={{ background: v('--w-olive') }} />Orders</span></div>

        <div className="wm-sec"><Sun size={16} strokeWidth={2.2} />Today's Highlights</div>
        <div className="wm-tiles">
          {TODAY.map(([Ic, label, value, c]) => (
            <div key={label} className="wm-t" style={{ '--c': v(c) }}>
              <span className="wm-e"><Ic size={19} strokeWidth={2.2} /></span>
              <div><small>{label}</small><b>{value}</b></div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* payments: period tabs + monthly trend */
function Payments() {
  const ready = useContext(Ready); const r = useRef(null);
  const [tab, setTab] = useState('This month');
  const { data: pay, loading } = usePayments();
  const now = new Date();
  const cur = (now.getMonth() + 9) % 12; // Apr = 0 ... Mar = 11
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyLabel = `FY ${fy}–${String(fy + 1).slice(2)}`;
  const vals = pay.months.map((x, i) => (i > cur ? 0 : x));
  const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
  const short = (n) => (n >= 100000 ? `${+(n / 100000).toFixed(2)}L` : n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : `${n}`);
  const top = Math.max(100000, Math.ceil(Math.max(...vals) / 100000) * 100000);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => top * t);
  const cust = (n) => (loading ? 'Loading…' : `${n} customer${n === 1 ? '' : 's'}`);
  const tabs = [
    ['Today', pay.today.amt, cust(pay.today.n), '--w-purple'],
    ['This week', pay.week.amt, cust(pay.week.n), '--w-blue'],
    ['This month', pay.month.amt, cust(pay.month.n), '--w-orange'],
    ['This year', pay.year.amt, cust(pay.year.n), '--w-green'],
  ];
  const isOn = (i) => (tab === 'This year' ? i <= cur : i === cur);
  // right panel: amount by Payment_Status for the selected period
  const key = { Today: 'today', 'This week': 'week', 'This month': 'month', 'This year': 'year' }[tab];
  const stIcon = { ok: CheckCircle2, wait: Clock3, x: XCircle };
  const stRows = PAYMENTS.statuses.map(([label, c, ic]) => ({ label, c, Ic: stIcon[ic] || CheckCircle2, ...(pay.status?.[key]?.[label] || { amt: 0, n: 0 }) }));
  const stTotal = stRows.reduce((s, x) => s + x.amt, 0);
  const share = (n) => (stTotal ? (n / stTotal) * 100 : 0);
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.5 });
      tl.from('.wm-h', { opacity: 0, y: -12, duration: 0.5 }, 0)
        .from('.pm-tab', { opacity: 0, y: 14, duration: 0.5, stagger: 0.08, clearProps: 'opacity,transform' }, 0.1)
        .from('.pm-top', { opacity: 0, duration: 0.5 }, 0.4)
        .fromTo('.pm-bar', { scaleY: 0 }, { scaleY: 1, duration: 0.9, stagger: 0.05, ease: 'back.out(1.3)' }, 0.5)
        .from('.pm-x span', { opacity: 0, y: 6, duration: 0.4, stagger: 0.03 }, 0.7)
        .from('.ps', { opacity: 0, x: 24, duration: 0.6, clearProps: 'opacity,transform' }, 0.3)
        .from('.ps-row', { opacity: 0, y: 12, duration: 0.45, stagger: 0.08, clearProps: 'opacity,transform' }, 0.6);
    }, r);
    return () => c.revert();
  }, [ready]);
  return (
    <Card className="s12 warm pm">
      <div className="wm-wrap" ref={r}>
        <div className="wm-h">
          <div className="wm-title"><span className="wm-ico"><Wallet size={18} strokeWidth={2.2} /></span>Payments</div>
          <span className="wm-badge">{fyLabel}</span>
        </div>

        <div className="pm-grid2">
        <div className="pm-left">
        <div className="pm-tabs">
          {tabs.map(([name, amt, sub, c]) => (
            <button key={name} className={`pm-tab ${tab === name ? 'on' : ''}`} style={{ '--c': v(c) }} onClick={() => setTab(name)}>
              <small>{name}</small><b>{inr(amt)}</b><span>{sub}</span>
            </button>
          ))}
        </div>

        <div className="pm-body">
          <div className="pm-top">
            <div className="pm-ct">Monthly Payment Trend — {fyLabel}</div>
            <div className="pm-lg">
              <span><i style={{ background: v('--w-orange') }} />{tab === 'This year' ? 'This year' : 'This month'}</span>
              <span><i style={{ background: 'color-mix(in srgb,var(--w-orange) 25%,transparent)' }} />{tab === 'This year' ? 'Upcoming' : 'Other months'}</span>
            </div>
          </div>

          <div className="pm-chart">
            <div className="pm-y">{ticks.map((t) => <span key={t} style={{ bottom: `${(t / top) * 100}%` }}>{t === 0 ? '₹0' : `₹${short(t)}`}</span>)}</div>
            <div className="pm-plot">
              {ticks.map((t) => <div key={t} className="pm-grid" style={{ bottom: `${(t / top) * 100}%` }} />)}
              <div className="pm-cols">
                {vals.map((x, i) => (
                  <div className="pm-col" key={PAY_MONTHS[i]}>
                    <div className={`pm-bar ${isOn(i) ? 'on' : ''}`} style={{ height: `${(x / top) * 100}%` }} />
                    <span className="pm-val" style={{ bottom: `calc(${(x / top) * 100}% + 10px)` }}>{inr(x)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pm-x">{PAY_MONTHS.map((m, i) => <span key={m} className={i === cur ? 'cur' : ''}>{m}</span>)}</div>
          </div>
        </div>
        </div>

        <aside className="ps">
          <div className="ps-k">Payment status <em>{tab}</em></div>
          <div className="ps-total">{inr(stTotal)}</div>
          <div className="ps-sub">{loading ? 'Loading…' : `${stRows.reduce((s, x) => s + x.n, 0)} payments · ${share(stRows[0]?.amt || 0).toFixed(1)}% ${stRows[0]?.label.toLowerCase() || ''}`}</div>
          <div className="ps-stack">
            {stRows.map((x) => <i key={x.label} style={{ width: `${share(x.amt)}%`, background: v(x.c) }} title={`${x.label}: ${inr(x.amt)}`} />)}
          </div>
          <div className="ps-rows">
            {stRows.map(({ label, c, Ic, amt, n }) => (
              <a key={label} className="ps-row" style={{ '--c': v(c) }} href={zoho(PAYMENTS.report)} target="_blank" rel="noopener noreferrer">
                <span className="ps-ic"><Ic size={18} strokeWidth={2.2} /></span>
                <div className="ps-mid">
                  <div className="ps-l">{label}<small>{n} {n === 1 ? 'payment' : 'payments'}</small></div>
                  <div className="ps-bar"><i style={{ width: `${share(amt)}%` }} /></div>
                </div>
                <div className="ps-r"><b>{inr(amt)}</b><small>{share(amt).toFixed(1)}%</small></div>
              </a>
            ))}
          </div>
        </aside>
        </div>
      </div>
    </Card>
  );
}

/* invoices: period tiles + status donut + recent list */
function Invoices() {
  const ready = useContext(Ready); const r = useRef(null); const [h, setH] = useState(null);
  const R = 66, C = 2 * Math.PI * R, GAP = 3;
  const total = INV_STATUS.reduce((s, x) => s + x[1], 0);
  const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
  const colorOf = Object.fromEntries(INV_STATUS.map(([n, , c]) => [n, c]));
  let acc = 0;
  const segs = INV_STATUS.map(([label, n, c]) => {
    const len = (n / total) * C; const mid = ((acc + len / 2) / C) * 2 * Math.PI - Math.PI / 2;
    const o = { label, v: n, c, len, off: acc, pct: Math.round((n / total) * 100), x: 88 + R * Math.cos(mid), y: 88 + R * Math.sin(mid) };
    acc += len; return o;
  });
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.5 });
      tl.from('.wm-h', { opacity: 0, y: -12, duration: 0.5 }, 0)
        .from('.pm-tab', { opacity: 0, y: 14, duration: 0.5, stagger: 0.08, clearProps: 'opacity,transform' }, 0.1)
        .from('.iv-st', { opacity: 0, x: -10, duration: 0.5, stagger: 0.1 }, 0.4)
        .from('.iv-svg', { scale: 0.6, rotation: -40, opacity: 0, duration: 0.9, ease: 'back.out(1.5)', transformOrigin: '50% 50%' }, 0.4)
        .from('.iv-pct,.donut-c', { opacity: 0, duration: 0.5 }, 1.1)
        .from('.iv-legend .wm-row', { opacity: 0, y: 12, duration: 0.45, stagger: 0.07, clearProps: 'opacity,transform' }, 0.9)
        .from('.iv-row', { opacity: 0, x: 28, duration: 0.5, stagger: 0.09, clearProps: 'opacity,transform' }, 0.5);
      segs.forEach((s, i) => gsap.fromTo(`.iv${i}`, { strokeDasharray: `0 ${C}` }, { strokeDasharray: `${Math.max(0, s.len - GAP)} ${C}`, duration: 1.1, delay: 0.8 + i * 0.12, ease: 'power3.out' }));
    }, r);
    return () => c.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return (
    <Card className="s12 warm pm iv">
      <div className="wm-wrap" ref={r}>
        <div className="wm-h">
          <div className="wm-title"><span className="wm-ico"><FileText size={18} strokeWidth={2.2} /></span>Invoices</div>
          <a className="iv-all" href={zoho(INV_REPORT)} target="_blank" rel="noopener noreferrer">View all<ArrowUpRight size={15} /></a>
        </div>

        <div className="pm-tabs">
          {INV_STATS.map(([name, amt, n, c]) => (
            <div key={name} className="pm-tab" style={{ '--c': v(c) }}>
              <small>{name}</small><b>{inr(amt)}</b><span>{n} invoices</span>
            </div>
          ))}
        </div>

        <div className="iv-body">
          <div className="iv-col">
            <div className="iv-st">Invoice status</div>
            <div className="iv-donut">
              <div className="donut">
                <svg className="iv-svg" viewBox="0 0 176 176">
                  <g transform="rotate(-90 88 88)">
                    <circle cx="88" cy="88" r={R} fill="none" stroke="var(--w-cream)" strokeWidth="26" />
                    {segs.map((s, i) => (
                      <circle key={s.label} className={`iv${i}`} cx="88" cy="88" r={R} fill="none" strokeWidth={h === i ? 30 : 26} strokeDashoffset={-s.off}
                        style={{ stroke: v(s.c), strokeDasharray: `0 ${C}`, opacity: h === null || h === i ? 1 : 0.4, transition: 'stroke-width .25s, opacity .25s', cursor: 'pointer' }}
                        onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)} />
                    ))}
                  </g>
                  {segs.filter((s) => s.pct >= 8).map((s) => <text key={s.label} className="iv-pct" x={s.x} y={s.y + 4} textAnchor="middle">{s.pct}%</text>)}
                </svg>
                <div className="donut-c"><b>{(h === null ? total : segs[h].v).toLocaleString('en-IN')}</b><span>{h === null ? 'Invoices' : segs[h].label}</span></div>
              </div>
            </div>
            <div className="iv-legend">
              {segs.map((s, i) => (
                <div key={s.label} className={`wm-row ${h === i ? 'on' : ''} ${h !== null && h !== i ? 'dim' : ''}`} onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)}>
                  <i style={{ background: v(s.c) }} />{s.label}<b style={{ color: v(s.c) }}>{s.v}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="iv-col">
            <div className="iv-st">Recent invoices</div>
            <div className="iv-list">
              {INVOICES.map(([id, status, name, due, amt]) => (
                <a key={id} className="iv-row" style={{ '--c': v(colorOf[status]) }} href={zoho(INV_REPORT)} target="_blank" rel="noopener noreferrer">
                  <i className="iv-dot" />
                  <div className="iv-main">
                    <div className="iv-top"><span className="iv-id">{id}</span><span className="iv-pill">{status}</span></div>
                    <div className="iv-name">{name}</div>
                    <div className="iv-due"><CalendarClock size={12} />Due: {due}</div>
                  </div>
                  <b className="iv-amt">{inr(amt)}</b>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Dispatches() {
  const [f, setF] = useState('All'); const r = useRef(null);
  const rows = ROWS.filter((x) => f === 'All' || x[5] === f.toLowerCase());
  useLayoutEffect(() => {
    const c = gsap.context(() => { gsap.fromTo('tbody tr', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 }); }, r);
    return () => c.revert();
  }, [f]);
  return (
    <Card className="s12">
      <div className="card-h">
        <div><div className="card-t">Recent dispatches</div><div className="card-s">From All Daily Dispatches</div></div>
        <Seg options={['All', 'Weighing', 'Loading', 'Dispatched', 'Delivered']} value={f} onChange={setF} />
      </div>
      <div className="tbl-w" ref={r}>
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Item</th><th className="num">Weight</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x[0]}>
                <td className="id">{x[0]}</td>
                <td><div className="cust"><i style={{ background: x[6] }}>{x[1][0]}</i>{x[1]}</div></td>
                <td className="id">{x[2]}</td><td>{x[3]}</td><td className="num">{x[4].toFixed(1)} MT</td>
                <td><span className={`chip ${x[5]}`}>{x[5][0].toUpperCase() + x[5].slice(1)}</span></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="6" className="empty">No dispatches in this state</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span className="clk">{t.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}, {t.toLocaleTimeString('en-IN', { hour12: false })}</span>;
}

function Ticker() {
  const items = ROWS.map((x) => <span key={x[0]}><i style={{ '--c': v(TICK[x[5]]) }} />{x[0]} {x[1]}, {x[4].toFixed(1)} MT, {x[5]}</span>);
  return <div className="ticker" aria-hidden="true"><div className="tk">{items}{items.map((e) => React.cloneElement(e, { key: `${e.key}b` }))}</div></div>;
}

/* search palette: pick a report and it opens in Zoho Creator */
function Palette({ open, onClose }) {
  const [q, setQ] = useState(''); const [i, setI] = useState(0); const box = useRef(null); const inp = useRef(null);
  const list = useMemo(() => FLAT.filter((x) => `${x.label} ${x.group}`.toLowerCase().includes(q.toLowerCase())).slice(0, 9), [q]);
  useEffect(() => {
    if (!open) return;
    setQ(''); setI(0); setTimeout(() => inp.current && inp.current.focus(), 30);
    gsap.fromTo(box.current, { opacity: 0, y: -16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' });
  }, [open]);
  if (!open) return null;
  const go = (x) => { if (x && x.link) window.open(zoho(x.link), '_blank', 'noopener'); onClose(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(list.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(0, i - 1)); }
    else if (e.key === 'Enter') go(list[i]); else if (e.key === 'Escape') onClose();
  };
  return (
    <div className="pal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pal" ref={box}>
        <div className="pal-in"><Search size={18} /><input ref={inp} value={q} placeholder="Jump to a report" onChange={(e) => { setQ(e.target.value); setI(0); }} onKeyDown={onKey} /><span className="kbd">ESC</span></div>
        <div className="pal-l">
          {list.length ? list.map((x, n) => { const Ic = x.icon; return (
            <button key={x.label} className={`pal-i ${n === i ? 'on' : ''}`} onMouseEnter={() => setI(n)} onClick={() => go(x)}><Ic size={17} strokeWidth={2} />{x.label}<small>{x.group}</small></button>
          ); }) : <div className="pal-e">No report matches "{q}"</div>}
        </div>
      </div>
    </div>
  );
}

/* ============ Factory line: dough to dispatch ============ */
const LINE_UNITS = {
  'Unit A': { mix: 120, temp: 62, vary: 0.82, rate: 410, mt: 4.2, eff: 94.2 },
  'Unit B': { mix: 105, temp: 60, vary: 0.91, rate: 360, mt: 3.6, eff: 91.7 },
  'Unit C': { mix: 98, temp: 64, vary: 0.77, rate: 330, mt: 3.1, eff: 93.4 },
};
const FL_STAGES = [
  ['01', 'Dough mixing', 100, 'mix'], ['02', 'Sheet rolling', 300, 'roll'], ['03', 'Press & cut', 500, 'cut'],
  ['04', 'Tunnel drying', 700, 'dry'], ['05', 'Weight check', 930, 'weigh'], ['06', 'Packing', 1090, 'pack'], ['07', 'Dispatch', 1260, 'ship'],
];
// truck bed slots, loading order: far end first, bottom row first
const SLOTS = [-31, -51, -71].flatMap((cy) => [85, 62, 39, 16].map((cx) => [cx, cy]));
const jig = (b, a, d = 0) => +(b + (Math.random() - 0.5) * a).toFixed(d);

function FactoryLine({ greet }) {
  const ready = useContext(Ready);
  const [unit, setUnit] = useState('Unit A');
  const [m, setM] = useState({});
  const root = useRef(null); const discEl = useRef(null); const cartonEl = useRef(null); const truckEl = useRef(null);
  const count = useRef(0); const trucks = useRef(0);
  const [running, setRunning] = useState(true);
const ctxRef = useRef(null);
  // live metrics (swap with Zoho Creator API data later)
  useEffect(() => {
    if (!running) return undefined;  
    const b = LINE_UNITS[unit];
    const tick = () => setM({
      mix: `${jig(b.mix, 6)} kg batch`, roll: `${jig(1.2, 0.12, 2)} mm sheet`, cut: `${jig(b.rate, 24)} pcs/min`,
      dry: `${jig(b.temp, 3)} °C`, weigh: `${jig(b.vary, 0.16, 2)}% variance`, pack: `${jig(24, 3)} cartons/h`,
      ship: `${b.mt} MT today`, eff: jig(b.eff, 0.6, 1),
    });
    tick();
    const i = setInterval(tick, 2200);
    return () => clearInterval(i);
  }, [unit,running]);

  useLayoutEffect(() => {
    if (!ready) return undefined;
    const el = root.current;
    const $ = (s) => gsap.utils.toArray(s, el);
    const ctx = gsap.context(() => {
      gsap.set('.fl-paddle,.fl-r1,.fl-r2,.fl-bw,.fl-needle,.fl-disc,.fl-flash,.fl-tc,.fl-ok,.fl-tw,.fl-steam', { transformOrigin: '50% 50%' });
      gsap.set('.fl-bar', { transformOrigin: '50% 100%' });

      const rise = (target, delay, dy, dur, peak = 0.8) => gsap.timeline({ repeat: -1, delay })
        .set(target, { y: 0, opacity: 0 }, 0)
        .to(target, { y: dy, duration: dur, ease: 'none' }, 0)
        .to(target, { opacity: peak, duration: dur * 0.3, ease: 'none' }, 0)
        .to(target, { opacity: 0, duration: dur * 0.7, ease: 'none' }, dur * 0.3);

      /* ---- machines that run non-stop ---- */
      gsap.to('.fl-paddle', { rotation: 360, duration: 2.6, repeat: -1, ease: 'none' });
      gsap.to('.fl-r1', { rotation: 360, duration: 2.2, repeat: -1, ease: 'none' });
      gsap.to('.fl-r2', { rotation: -360, duration: 2.2, repeat: -1, ease: 'none' });
      gsap.to('.fl-bw', { rotation: 360, duration: 0.9, repeat: -1, ease: 'none' });
      gsap.to('.fl-wave', { y: 3, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.fromTo('.fl-needle', { rotation: -38 }, { rotation: 38, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to('.fl-lamp', { opacity: 0.35, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.12 });
      gsap.to('.fl-led', { opacity: 0.25, duration: 0.5, yoyo: true, repeat: -1, ease: 'steps(1)' });
      gsap.fromTo('.fl-pulse', { x: 100 }, { x: 1260, duration: 9, repeat: -1, ease: 'none' });
      gsap.fromTo('.fl-glint', { x: 300, opacity: 0.6 }, { x: 510, opacity: 0.6, duration: 1.6, repeat: -1, ease: 'none' });
      $('.fl-bar').forEach((b, i) => gsap.fromTo(b, { scaleY: 0.25 }, { scaleY: 1, duration: 0.35 + i * 0.12, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.1 }));
      $('.fl-flour').forEach((f, i) => gsap.fromTo(f, { y: 0, opacity: 1 }, { y: 34, opacity: 0, duration: 0.9, repeat: -1, delay: i * 0.3, ease: 'power1.in' }));
      $('.fl-dough').forEach((d, i) => gsap.fromTo(d, { x: 0 }, { x: 84, duration: 1.5, repeat: -1, ease: 'none', delay: i * 0.5 }));
      $('.fl-heat').forEach((h, i) => rise(h, i * 0.4, -34, 1.8, 0.75));
      $('.fl-steam').forEach((s, i) => gsap.timeline({ repeat: -1, delay: i * 0.9 })
        .set(s, { y: 0, scale: 0.5, opacity: 0 }, 0)
        .to(s, { y: -46, scale: 1.7, duration: 2.7, ease: 'none' }, 0)
        .to(s, { opacity: 0.5, duration: 0.8, ease: 'none' }, 0)
        .to(s, { opacity: 0, duration: 1.9, ease: 'none' }, 0.8));

      /* ---- press: stamps every 1.5 s ---- */
      gsap.timeline({ repeat: -1 })
        .to('.fl-press', { y: 22, duration: 0.15, ease: 'power2.in' }, 0)
        .fromTo('.fl-flash', { scale: 0.3, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.45, ease: 'power2.out' }, 0.15)
        .to('.fl-press', { y: 0, duration: 0.35, ease: 'power2.out' }, 0.15)
        .to({}, { duration: 0.001 }, 1.499);

      /* ---- discs: press > belt > dryer > scale > carton ---- */
      const pcEl = el.querySelector('.fl-pc'); const fill = el.querySelector('.fl-fill');
      const bump = () => {
        count.current += 1;
        const filled = count.current % 12;
        if (discEl.current) discEl.current.textContent = (18420 + count.current).toLocaleString('en-IN');
        if (cartonEl.current) cartonEl.current.textContent = (1540 + Math.floor(count.current / 12)).toLocaleString('en-IN');
        if (pcEl) pcEl.textContent = `${filled}/12`;
        if (fill) gsap.to(fill, { attr: { height: filled * 3, y: 308 - filled * 3 }, duration: 0.25 });
      };
      $('.fl-disc').forEach((d, i) => {
        const dough = d.querySelector('.d1');
        gsap.timeline({ repeat: -1, delay: 0.15 + i * 1.5 })
          .set(d, { x: 500, y: 226, scale: 0, opacity: 0 }, 0)
          .set(dough, { fill: '#F3DDA0' }, 0)
          .to(d, { scale: 1, opacity: 1, duration: 0.15, ease: 'back.out(2)' }, 0)
          .to(d, { y: 256, duration: 0.3, ease: 'power2.in' }, 0.15)
          .to(d, { x: 580, duration: 1, ease: 'none' }, 0.45)
          .to(d, { x: 820, duration: 3, ease: 'none' }, 1.45)
          .to(dough, { fill: '#D9922B', duration: 3, ease: 'none' }, 1.45)
          .to(d, { x: 930, duration: 1.375, ease: 'none' }, 4.45)
          .to(d, { x: 1050, duration: 1.5, ease: 'none' }, 6.725)
          .to(d, { x: 1088, y: 292, scale: 0.6, opacity: 0, duration: 0.5, ease: 'power1.in' }, 8.225)
          .call(bump, null, 8.6)
          .to({}, { duration: 0.001 }, 8.999);
      });

      /* ---- weight check: laser scan + tick (first disc arrives at 5.975 s) ---- */
      const wtxt = el.querySelector('.fl-wtxt');
      gsap.timeline({ repeat: -1, delay: 5.975 })
        .set('.fl-beam', { y: 0, opacity: 1 }, 0)
        .set('.fl-ok', { scale: 0, opacity: 0 }, 0)
        .call(() => { wtxt.textContent = '· · ·'; }, null, 0)
        .to('.fl-beam', { y: 80, duration: 0.45, ease: 'none' }, 0)
        .to('.fl-beam', { y: 0, duration: 0.45, ease: 'none' }, 0.45)
        .to('.fl-beam', { opacity: 0, duration: 0.08 }, 0.9)
        .call(() => { wtxt.textContent = `${jig(12.5, 0.4, 1)} g`; }, null, 0.5)
        .to('.fl-ok', { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.4)' }, 0.5)
        .to('.fl-ok', { opacity: 0, scale: 0.6, duration: 0.2 }, 1.25)
        .to({}, { duration: 0.001 }, 1.499);

      /* ---- dispatch: truck reverses in, loads cartons, drives off (16 s loop) ---- */
      const T0 = 1420; const T1 = 1180; const tcs = $('.fl-tc');
      const trk = gsap.timeline({ repeat: -1 })
        .set('.fl-truck', { x: T0 }, 0)
        .set(tcs, { scale: 0, opacity: 0 }, 0)
        .set('.fl-hop', { opacity: 0 }, 0)
        .set('.fl-toast', { opacity: 0, y: 6 }, 0)
        .to('.fl-truck', { x: T1, duration: 2.4, ease: 'power2.out' }, 0)
        .to('.fl-tw', { rotation: '-=540', duration: 2.4, ease: 'power2.out' }, 0);
      tcs.forEach((c, k) => {
        const t = 2.6 + k * 0.8;
        trk.set('.fl-hop', { x: 1140, opacity: 1 }, t)
          .to('.fl-hop', { x: 1188, duration: 0.5, ease: 'none' }, t)
          .set('.fl-hop', { opacity: 0 }, t + 0.5)
          .to(c, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' }, t + 0.45);
      });
      trk.to('.fl-toast', { opacity: 1, y: 0, duration: 0.4 }, 12.8)
        .call(() => { trucks.current += 1; if (truckEl.current) truckEl.current.textContent = String(6 + trucks.current); }, null, 12.8)
        .to('.fl-truck', { x: T0, duration: 2.6, ease: 'power2.in' }, 12.8)
        .to('.fl-tw', { rotation: '+=540', duration: 2.6, ease: 'power2.in' }, 12.8)
        .to('.fl-toast', { opacity: 0, duration: 0.4 }, 15.2)
        .to({}, { duration: 0.001 }, 15.999);
    }, root);
    ctxRef.current = ctx; 
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

    useEffect(() => {
    const c = ctxRef.current;
    if (!c) return;
    c.data.forEach((a) => {
      if (a.parent === gsap.globalTimeline) running ? a.resume() : a.pause();
    });
  }, [running, ready]);

  return (
    <Card className="s12 fl">
<div className="card-h fl-h">
  <div className="row" style={{ marginLeft: 'auto' }}>
    <span className={`fl-live ${running ? '' : 'off'}`}><i />{running ? 'Line running' : 'Line stopped'}</span>
    {/* <button className={`fl-ctl ${running ? '' : 'off'}`} onClick={() => setRunning(!running)} aria-pressed={!running}>
      {running ? <><Pause />Stop</> : <><Play />Start</>}
    </button> */}
    <Seg options={Object.keys(LINE_UNITS)} value={unit} onChange={setUnit} />
  </div>
</div>

<div className={`fl-stage ${running ? '' : 'paused'}`} ref={root}>
        <span className="fl-scan" />
        <svg className="fl-svg" viewBox="0 0 1360 400" role="img" aria-label="Animated production line from dough mixing to truck dispatch">
          
          <defs>
            <linearGradient id="flMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="gm1" /><stop offset="1" className="gm2" /></linearGradient>
            <linearGradient id="flBeltG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4a53" /><stop offset="1" stopColor="#26262c" /></linearGradient>
            <linearGradient id="flHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="gh1" /><stop offset="1" className="gh2" /></linearGradient>
          </defs>

          {/* HUD corners + floor */}
          {['M12,30 V12 H30', 'M1348,30 V12 H1330', 'M12,370 V388 H30', 'M1348,370 V388 H1330'].map((d) => <path key={d} d={d} className="fl-corner" />)}
          <line className="fl-floor" x1="20" x2="1340" y1="330" y2="330" />

          {/* stage header: flow line + numbered nodes */}
          <line className="fl-flow" x1="100" x2="1260" y1="46" y2="46" />
          {FL_STAGES.map(([n, name, x, key]) => (
            <g key={n}>
              <circle className="fl-node" cx={x} cy="46" r="5" />
              <text className="fl-no" x={x} y="30" textAnchor="middle">{n}</text>
              <text className="fl-name" x={x} y="356" textAnchor="middle">{name.toUpperCase()}</text>
              <text className="fl-met" x={x} y="376" textAnchor="middle">{m[key] || '...'}</text>
            </g>
          ))}
          <circle className="fl-pulse" cx="0" cy="46" r="4" />

          {/* ===== 01 MIXER ===== */}
          <rect className="fl-body" x="52" y="236" width="8" height="94" />
          <rect className="fl-body" x="140" y="236" width="8" height="94" />
          <path className="fl-body" d="M66,86 H134 L116,138 H84 Z" />
          {[0, 1, 2].map((i) => <circle key={i} className="fl-flour" cx={90 + i * 10} cy="104" r="2.4" />)}
          <path className="fl-body" d="M40,150 H160 V212 Q160,252 100,252 Q40,252 40,212 Z" />
          <path className="fl-doughfill" d="M41,178 H159 V212 Q159,250 100,250 Q41,250 41,212 Z" />
          <path className="fl-wave" d="M46,178 q13,-7 27,0 t27,0 t27,0 t27,0" />
          <ellipse className="fl-rim" cx="100" cy="150" rx="60" ry="10" />
          <g transform="translate(100,204)">
            <g className="fl-paddle"><rect x="-32" y="-4" width="64" height="8" rx="4" /><rect x="-4" y="-32" width="8" height="64" rx="4" /></g>
          </g>
{/* motor starter: green I = start, red O = stop */}
<rect className="fl-body" x="162" y="156" width="34" height="62" rx="6" />
<text className="fl-plabel" x="179" y="165" textAnchor="middle">MOTOR</text>
<circle className={`fl-led ${running ? '' : 'off'}`} cx="179" cy="174" r="3.5" />

<g className={`fl-sbtn go ${running ? 'on' : ''}`} role="button" tabIndex={0} aria-label="Start line"
   onClick={() => setRunning(true)}
   onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRunning(true); } }}>
  <circle className="hit" cx="179" cy="190" r="10" />
  <circle className="ring" cx="179" cy="190" r="8" />
  <circle className="cap" cx="179" cy="190" r="6" />
  <text x="179" y="193" textAnchor="middle">I</text>
</g>

<g className={`fl-sbtn stop ${running ? '' : 'on'}`} role="button" tabIndex={0} aria-label="Stop line"
   onClick={() => setRunning(false)}
   onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRunning(false); } }}>
  <circle className="hit" cx="179" cy="207" r="10" />
  <circle className="ring" cx="179" cy="207" r="8" />
  <circle className="cap" cx="179" cy="207" r="6" />
  <text x="179" y="210" textAnchor="middle">O</text>
</g>
          <rect className="fl-body" x="160" y="219" width="96" height="12" rx="3" />
          <circle className="fl-valve" cx="200" cy="225" r="7" />
          {[0, 1, 2].map((i) => <circle key={i} className="fl-dough" cx="166" cy="225" r="3.6" />)}

          {/* ===== 02 ROLLERS ===== */}
          <rect className="fl-body" x="270" y="290" width="60" height="40" />
          <rect className="fl-frame" x="262" y="150" width="76" height="140" rx="12" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${278 + i * 12},186)`}><rect className="fl-bar" x="0" y="-14" width="8" height="14" rx="2" /></g>
          ))}
          <g transform="translate(300,196)"><g className="fl-r1"><circle className="fl-roller" r="24" /><line className="fl-tick" x1="0" y1="-22" x2="0" y2="-8" /><line className="fl-tick" x1="0" y1="22" x2="0" y2="8" /></g></g>
          <g transform="translate(300,244)"><g className="fl-r2"><circle className="fl-roller" r="24" /><line className="fl-tick" x1="0" y1="-22" x2="0" y2="-8" /><line className="fl-tick" x1="0" y1="22" x2="0" y2="8" /></g></g>
          <rect className="fl-sheet" x="300" y="217" width="228" height="6" rx="3" />
          <rect className="fl-glint" x="0" y="217" width="18" height="6" rx="3" />

          {/* ===== 03 PRESS ===== */}
          <rect className="fl-body" x="480" y="232" width="40" height="98" />
          <rect className="fl-body" x="466" y="224" width="68" height="8" rx="3" />
          <rect className="fl-body" x="452" y="128" width="96" height="14" rx="5" />
          <rect className="fl-body" x="452" y="142" width="9" height="82" />
          <rect className="fl-body" x="539" y="142" width="9" height="82" />
          <g className="fl-press">
            <rect className="fl-rod" x="496" y="142" width="8" height="38" />
            <rect className="fl-die" x="472" y="178" width="56" height="20" rx="5" />
          </g>
          <g transform="translate(500,221)"><circle className="fl-flash" r="14" opacity="0" /></g>

          {/* ===== 04 DRYER (back layer) ===== */}
          <rect className="fl-body" x="586" y="280" width="228" height="50" rx="4" />
          <rect x="580" y="168" width="240" height="112" rx="16" fill="url(#flHeat)" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} className="fl-lamp" x={598 + i * 36} y="176" width="22" height="6" rx="3" />)}
          <circle className="fl-frame" cx="640" cy="148" r="16" />
          <g transform="translate(640,148)"><g className="fl-needle"><line x1="0" y1="-12" x2="0" y2="12" /></g></g>
          <rect className="fl-body" x="782" y="120" width="20" height="48" />
          {[0, 1, 2].map((i) => <g key={i} transform="translate(792,116)"><circle className="fl-steam" r="7" /></g>)}
          <text className="fl-tag" x="700" y="204" textAnchor="middle">HEAT ZONE</text>

          {/* ===== 05 SCALE (frame) ===== */}
          <rect className="fl-body" x="900" y="276" width="60" height="54" />
          <path className="fl-frame" d="M890,262 V176 Q890,168 898,168 H962 Q970,168 970,176 V262" />
          <rect className="fl-screen" x="902" y="142" width="56" height="28" rx="6" />
          <text className="fl-txt fl-wtxt" x="930" y="160" textAnchor="middle">- - -</text>
          <g transform="translate(930,112)">
            <g className="fl-ok" opacity="0">
              <circle className="fl-okc" r="13" />
              <path d="M-6,0 l4,5 l8,-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>

          {/* ===== BELT ===== */}
          {[470, 620, 760, 990].map((x) => <rect key={x} className="fl-body" x={x} y="276" width="6" height="54" />)}
          <rect className="fl-belt" x="440" y="262" width="610" height="14" rx="7" />
          <line className="fl-tread" x1="452" x2="1038" y1="269" y2="269" />
          <rect className="fl-plate" x="906" y="262" width="48" height="14" rx="3" />
          {[448, 1042].map((x) => (
            <g key={x} transform={`translate(${x},269)`}><g className="fl-bw"><circle className="rim" r="10" /><line className="spoke" x1="-7" x2="7" y1="0" y2="0" /><line className="spoke" x1="0" x2="0" y1="-7" y2="7" /></g></g>
          ))}

          {/* ===== 06 PACKING ===== */}
          <path className="fl-frame" d="M1046,262 Q1074,262 1080,276" />
          <path className="fl-frame" d="M1074,196 V176 H1106 V196" />
          <rect className="fl-screen" x="1060" y="196" width="60" height="24" rx="5" />
          <text className="fl-txt fl-pc" x="1090" y="212" textAnchor="middle">0/12</text>
          <rect className="fl-body" x="1040" y="310" width="170" height="10" rx="4" />
          {[1060, 1196].map((x) => <rect key={x} className="fl-body" x={x} y="320" width="6" height="10" />)}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={1054 + i * 24} cy="315" r="2.6" className="fl-roll" />)}
          <rect className="fl-fill" x="1066" y="308" width="48" height="0" />
          <rect className="fl-carton" x="1060" y="266" width="60" height="44" rx="3" />
          <path className="fl-carton" d="M1060,266 l-8,-10 M1120,266 l8,-10" />
          <text className="fl-brand" x="1090" y="294" textAnchor="middle">MGF</text>

          {/* ===== DISCS ===== */}
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i} className="fl-disc" opacity="0">
              <ellipse className="d1" rx="15" ry="5.5" />
              <ellipse rx="10" ry="3" fill="none" stroke="#7a4b12" strokeOpacity=".4" />
              <circle className="pore" cx="-6" cy="-0.5" r="1" /><circle className="pore" cx="3" cy="1" r="1.1" /><circle className="pore" cx="8" cy="-1" r=".8" />
            </g>
          ))}

          {/* ===== OVERLAYS ===== */}
          <rect className="fl-glass" x="580" y="168" width="240" height="112" rx="16" />
          {[620, 670, 720, 770].map((x) => <g key={x} transform={`translate(${x},258)`}><path className="fl-heat" d="M0,0 q7,-9 0,-18 t0,-18" /></g>)}
          <rect className="fl-beam" x="892" y="176" width="76" height="3" rx="1.5" />

          {/* ===== 07 TRUCK + DOCK ===== */}
          <rect x="1172" y="300" width="6" height="30" fill="#FFC22E" opacity=".5" />
          <g transform="translate(0,300)"><g className="fl-hop" opacity="0"><rect className="fl-box" x="-12" y="-10" width="24" height="20" rx="2" /></g></g>
          <g className="fl-truck" transform="translate(1420,330)">
            <rect className="fl-tbed" x="0" y="-86" width="104" height="64" rx="4" />
            {SLOTS.map(([cx, cy], k) => <g key={k} transform={`translate(${cx},${cy})`}><rect className="fl-box fl-tc" x="-10" y="-9" width="20" height="18" rx="2" opacity="0" /></g>)}
            <path className="fl-tcab" d="M108,-62 H136 L156,-40 V-22 H108 Z" />
            <path className="fl-twin" d="M114,-56 H133 L146,-42 H114 Z" />
            <rect className="fl-tchas" x="0" y="-22" width="156" height="8" rx="3" />
            <circle cx="153" cy="-28" r="3" fill="#FFC22E" />
            {[26, 126].map((cx) => (
              <g key={cx} transform={`translate(${cx},-11)`}><g className="fl-tw"><circle className="rim" r="11" /><line className="spoke" x1="-8" x2="8" y1="0" y2="0" /><line className="spoke" x1="0" x2="0" y1="-8" y2="8" /></g></g>
            ))}
          </g>
          <g transform="translate(1260,214)">
            <g className="fl-toast" opacity="0">
              <rect x="-84" y="-14" width="168" height="28" rx="14" />
              <text y="4" textAnchor="middle">TRUCK DISPATCHED · 12 CTN</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="fl-stats">
        <div className="fs" style={{ '--c': v('--gold') }}>
          <span className="fs-ic"><Cookie size={21} strokeWidth={2.1} /></span>
          <div className="fs-tx"><span>Discs pressed today</span><b ref={discEl}>18,420</b></div>
        </div>
        <div className="fs" style={{ '--c': v('--toast') }}>
          <span className="fs-ic"><Package size={21} strokeWidth={2.1} /></span>
          <div className="fs-tx"><span>Cartons packed</span><b ref={cartonEl}>1,540</b></div>
        </div>
        <div className="fs" style={{ '--c': v('--leaf'), '--w': `${m.eff || 94.2}%` }}>
          <span className="fs-ic"><Gauge size={21} strokeWidth={2.1} /></span>
          <div className="fs-tx">
            <span>Line efficiency</span><b>{m.eff || '94.2'}%</b>
            <div className="fs-meter"><i /></div>
          </div>
        </div>
        <div className="fs" style={{ '--c': v('--volt') }}>
          <span className="fs-ic"><Truck size={21} strokeWidth={2.1} /></span>
          <div className="fs-tx"><span>Trucks dispatched</span><b ref={truckEl}>6</b></div>
        </div>
      </div>
    </Card>
  );
}

/* ============ App ============ */
export default function App() {
  const [loading, setLoading] = useState(true); const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { const s = localStorage.getItem('mgf-theme'); if (s) return s; } catch (e) { /* ignore */ }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [pal, setPal] = useState(false); const shell = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('mgf-theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);
  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal((p) => !p); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.top', { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.7 }, 0.3)
        .fromTo('.reveal', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06 }, 0.4);
    }, shell);
    return () => c.revert();
  }, [ready]);



  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Ready.Provider value={ready}>
      <div ref={shell} className="main">
        <header className="top">
          <div className="brand">
            <div className="logo-mark"><img src={LOGO} alt="" onError={hideBroken} /><b>M</b></div>
            <div><div className="brand-t">Mahaganapathi Foods</div><div className="brand-s">MGF Command Center</div></div>
          </div>
          <button className="icon-btn" onClick={() => setPal(true)} aria-label="Search reports" title="Search reports (Ctrl K)"><Search size={17} /></button>
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        </header>

        {/* <Ticker />

        <div className="hero reveal">
          <div className="hero-txt">
            <div className="sticker"><span className="live" />Live <Clock /></div>
            <h1>{greet}, team MGF.</h1>
            <p>Appalam manufacturers &amp; exporters, Madurai. Here is how the three units are doing today.</p>
            <div className="facts"><span><b>25</b> years</span><span><b>75+</b> people</span><span><b>3</b> units</span><span><b>4 MT</b> per day</span></div>
            <div className="hero-actions">
              <a className="btn" href={zoho('All_Sales_Orders')} target="_blank" rel="noopener noreferrer"><Upload size={16} />Import orders</a>
              <a className="btn primary" href={zoho('All_Daily_Dispatches')} target="_blank" rel="noopener noreferrer"><Plus size={16} strokeWidth={2.4} />New dispatch</a>
            </div>
          </div>
          <div className="hero-disc"><img src={LOGO} alt="Mahaganapathi Foods" onError={hideBroken} /></div>
        </div>
        <Ticker /> */}

        <div className="grid">
          <FactoryLine />
          <SalesStatus />
          <WeeklyRevenue />
          <Payments />
          <Invoices />
          <AreaChart /><Pipeline />
          <ModuleBars />
          <VBars title="Brand share" sub="% of dispatched volume" data={BRANDS} unit="%" link="Brand_Report" colorFor={(_, i) => ['--gold', '--chilli', '--leaf', '--volt', '--toast'][i]} />
          <VBars title="Weight variance" sub="Daily check vs 1% tolerance" data={WEIGHT} limit={1} unit="%" link="Daily_Weight_Checking_Report" colorFor={(val) => (val > 1 ? '--chilli' : '--leaf')} />
          <Rings />
          {/* <Dispatches /> */}
        </div>
        <div className="note">Sample data shown. Connect to Zoho Creator to see live records.</div>
      </div>
      <Palette open={pal} onClose={() => setPal(false)} />
      {loading && <Loader onExit={() => setReady(true)} onDone={() => setLoading(false)} />}
    </Ready.Provider>
  );
}