import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useContext, createContext } from 'react';
import gsap from 'gsap';
import {
  Users, Contact, Store, MapPin, Truck, Package, FileText, ShoppingCart, Repeat, Scale, Send,
  Droplets, MapPinned, CarFront, Boxes, Layers, Barcode, ListChecks, Tag, Ruler, ClipboardList,
  Search, Sun, Moon, Upload, Plus, ArrowUpRight, TrendingUp, TrendingDown, IndianRupee, UserPlus,CheckCircle2, XCircle, Clock3, PencilLine, BarChart3,Wallet,CalendarClock, Pause, Play,
  Activity, Crown, TriangleAlert, ShieldCheck, Database, Zap, Flame, ReceiptText, Radar, Filter, ChevronLeft, ChevronRight, ChevronDown, CalendarDays,
} from 'lucide-react';
import './App.css';
import { useSalesOrderStatus, usePayments, PAYMENTS, useInvoices, useWeeklyRevenue, useTodayHighlights, useFactoryFlow, DISPATCHES, useReceivables, useTopCustomers, useSalesFunnel, useBusinessPulse, dayKey, useMasterCounts, MASTERS, INVOICES as INV_CFG } from './zoho.jsx';

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
// important modules: master = gold, transactions = chilli, dispatch = leaf
const ROWS = [
  ['DSP-2041', 'Sri Balaji Agencies', 'TN 09 AX 4821', 'Plain Appalam · 1kg', 2.4, 'dispatched', '#D92B26'],
  ['DSP-2040', 'Kovai Distributors', 'TN 38 BC 1172', 'Kerala Pappadam · 500g', 3.1, 'loading', '#12A150'],
  ['DSP-2039', 'Madurai Cold Chain', 'TN 58 CD 9034', 'Ring Papad · 250g', 1.8, 'weighing', '#D9722B'],
  ['DSP-2038', 'Nilgiri Traders', 'TN 43 AF 7710', 'Jeera Appalam · 500g', 2.9, 'delivered', '#0097C7'],
  ['DSP-2037', 'Ocean Foods Pvt Ltd', 'TN 01 BY 2265', 'Madras Plain Poppadom', 4.2, 'delivered', '#7A1F1A'],
  ['DSP-2036', 'Metro Retail Hub', 'TN 07 CK 3358', 'Masala Appalam · 250g', 2.2, 'dispatched', '#12A150'],
];
const TICK = { dispatched: '--gold', loading: '--toast', weighing: '--chilli', delivered: '--leaf' };

const PAY_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const INV_REPORT = INV_CFG.report;
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
// round a max value up to 4 even axis steps (e.g. 703000 -> 800000, 7 -> 8)
const axisTop = (max, steps = [1, 2, 2.5, 5, 10]) => {
  const raw = Math.max(max, 1) / 4; const mag = 10 ** Math.floor(Math.log10(raw));
  return 4 * Math.max(1, steps.find((m) => m * mag >= raw) * mag);
};
const shortInr = (n) => (n >= 10000000 ? `₹${+(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${+(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${+(n / 1000).toFixed(1)}K` : `₹${Math.round(n).toLocaleString('en-IN')}`);

function WeeklyRevenue() {
  const ready = useContext(Ready); const wrap = useRef(null); const [hi, setHi] = useState(null);
  const { data: wk } = useWeeklyRevenue();
  const { data: td, loading: tdLoading } = useTodayHighlights();
  const TODAY = [
    [ShoppingCart, 'New Orders', `${td.orders}`, '--w-orange'], [IndianRupee, 'Revenue', shortInr(td.revenue), '--w-green'],
    [Truck, 'Deliveries', `${td.deliveries} done`, '--w-blue'], [UserPlus, 'New Customers', `${td.customers} joined`, '--w-purple'],
  ].map(([Ic, label, value, c]) => [Ic, label, tdLoading ? '…' : value, c]);
  const days = wk.days.map((d) => d.toLocaleDateString('en-US', { weekday: 'short' }));
  const W = 720, H = 250, pl = 56, pr = 40, pt = 14, pb = 30, n = days.length;
  const topR = axisTop(Math.max(...wk.rev)); const topO = axisTop(Math.max(...wk.ord), [1, 2, 5, 10]);
  const X = (i) => pl + (i * (W - pl - pr)) / (n - 1);
  const Y = (val, top) => pt + (1 - val / top) * (H - pt - pb);
  const pr_ = wk.rev.map((val, i) => [X(i), Y(val, topR)]); const po_ = wk.ord.map((val, i) => [X(i), Y(val, topO)]);
  const dr = smooth(pr_); const dor = smooth(po_);
  const dataKey = `${wk.rev.join(',')}|${wk.ord.join(',')}`;
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.45 });
      tl.from('.wm-h', { opacity: 0, y: -14, duration: 0.5 }, 0)
        .from('.chart-wrap', { opacity: 0, y: 16, duration: 0.6 }, 0.1)
        .from('.wm-legend span', { opacity: 0, y: 8, duration: 0.4, stagger: 0.1 }, 1.2)
        .from('.wm-sec', { opacity: 0, x: -10, duration: 0.5 }, 1)
        .from('.wm-t', { opacity: 0, y: 16, scale: 0.94, duration: 0.5, stagger: 0.08, clearProps: 'opacity,transform' }, 1.1);
    }, wrap);
    return () => c.revert();
  }, [ready]);
  // lines: redraw when live data arrives
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.75 });
      tl.fromTo('.wl', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.15, ease: 'power2.inOut' }, 0)
        .fromTo('.wa', { opacity: 0 }, { opacity: 1, duration: 1 }, 0.6)
        .fromTo('.wdot', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(2)', clearProps: 'transform' }, 0.8);
    }, wrap);
    return () => c.revert();
  }, [ready, dataKey]);
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
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={pl} x2={W - pr} y1={Y(t, 1)} y2={Y(t, 1)} style={{ stroke: v('--w-line') }} strokeDasharray="3 5" />
                <text className="axis" x={pl - 10} y={Y(t, 1) + 4} textAnchor="end" style={{ fill: v('--w-orange') }}>{t ? shortInr(topR * t) : '₹0'}</text>
                <text className="axis" x={W - pr + 10} y={Y(t, 1) + 4} textAnchor="start" style={{ fill: v('--w-olive') }}>{topO * t}</text>
              </g>
            ))}
            {days.map((d, i) => <text key={i} className="axis" x={X(i)} y={H - 8} textAnchor="middle" style={{ fill: hi === i ? v('--w-ink') : undefined }}>{i === n - 1 ? 'Today' : d}</text>)}
            {hi !== null && <line x1={X(hi)} x2={X(hi)} y1={pt} y2={H - pb} style={{ stroke: v('--w-tan') }} strokeDasharray="3 3" />}
            <path className="wa" d={`${dr}L${X(n - 1)},${Y(0, 1)}L${X(0)},${Y(0, 1)}Z`} fill="url(#wgr)" />
            <path className="wa" d={`${dor}L${X(n - 1)},${Y(0, 1)}L${X(0)},${Y(0, 1)}Z`} fill="url(#wgo)" />
            <path className="wl" d={dr} pathLength="1" fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: v('--w-orange'), strokeDasharray: 1, strokeDashoffset: 1 }} />
            <path className="wl" d={dor} pathLength="1" fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: v('--w-olive'), strokeDasharray: 1, strokeDashoffset: 1 }} />
            {dots(po_, '--w-olive')}{dots(pr_, '--w-orange')}
          </svg>
          {hi !== null && (
            <div className="tip wm-tip" style={tipPos}>
              <b>{wk.days[hi].toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</b>
              <div style={{ color: v('--w-olive') }}>Orders : {wk.ord[hi]} order{wk.ord[hi] === 1 ? '' : 's'}</div>
              <div style={{ color: v('--w-orange') }}>Revenue : ₹{wk.rev[hi].toLocaleString('en-IN')}</div>
            </div>
          )}
        </div>

        <div className="wm-legend"><span><i style={{ background: v('--w-orange') }} />Revenue (₹)</span><span><i style={{ background: v('--w-olive') }} />Orders</span></div>

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
  const { data: inv, loading } = useInvoices();
  const INV_STATUS = INV_CFG.statuses.map(([label, c]) => [label, inv.status[label] || 0, c]);
  const INV_STATS = [['Today', 'today', '--w-purple'], ['This week', 'week', '--w-blue'], ['This month', 'month', '--w-orange'], ['This year', 'year', '--w-green']]
    .map(([name, k, c]) => [name, inv.stats[k].amt, inv.stats[k].n, c]);
  const R = 66, C = 2 * Math.PI * R, GAP = 3;
  const total = INV_STATUS.reduce((s, x) => s + x[1], 0);
  const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
  const colorOf = Object.fromEntries(INV_STATUS.map(([n, , c]) => [n, c]));
  let acc = 0;
  const segs = INV_STATUS.map(([label, n, c]) => {
    const len = total ? (n / total) * C : 0;
    const o = { label, v: n, c, len, off: acc };
    acc += len; return o;
  });
  const segKey = segs.map((s) => s.v).join(',');
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.5 });
      tl.from('.wm-h', { opacity: 0, y: -12, duration: 0.5 }, 0)
        .from('.pm-tab', { opacity: 0, y: 14, duration: 0.5, stagger: 0.08, clearProps: 'opacity,transform' }, 0.1)
        .from('.iv-st', { opacity: 0, x: -10, duration: 0.5, stagger: 0.1 }, 0.4)
        .from('.iv-svg', { scale: 0.6, rotation: -40, opacity: 0, duration: 0.9, ease: 'back.out(1.5)', transformOrigin: '50% 50%' }, 0.4)
        .from('.donut-c', { opacity: 0, duration: 0.5 }, 1.1)
        .from('.iv-legend .wm-row', { opacity: 0, y: 12, duration: 0.45, stagger: 0.07, clearProps: 'opacity,transform' }, 0.9)
        .from('.iv-row', { opacity: 0, x: 28, duration: 0.5, stagger: 0.09, clearProps: 'opacity,transform' }, 0.5);
    }, r);
    return () => c.revert();
  }, [ready]);
  // donut segments: re-animate when live counts arrive
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const c = gsap.context(() => {
      segs.forEach((s, i) => gsap.fromTo(`.iv${i}`, { strokeDasharray: `0 ${C}` }, { strokeDasharray: `${Math.max(0, s.len - GAP)} ${C}`, duration: 1.1, delay: 0.8 + i * 0.12, ease: 'power3.out' }));
    }, r);
    return () => c.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, segKey]);
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
              <small>{name}</small><b>{inr(amt)}</b><span>{loading ? 'Loading…' : `${n} invoice${n === 1 ? '' : 's'}`}</span>
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
              {!loading && !inv.recent.length && <div className="iv-empty">No invoices yet</div>}
              {inv.recent.map(([id, status, name, due, amt], k) => (
                <a key={id || k} className="iv-row" style={{ '--c': v(colorOf[status] || '--w-tan') }} href={zoho(INV_REPORT)} target="_blank" rel="noopener noreferrer">
                  <i className="iv-dot" />
                  <div className="iv-main">
                    <div className="iv-top"><span className="iv-id">{id}</span><span className="iv-pill">{status}</span></div>
                    <div className="iv-name">{name}</div>
                    {due && <div className="iv-due"><CalendarClock size={12} />Due: {due}</div>}
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

/* custom date-range picker: presets + a month calendar (click start, then end) */
const DAY_MS = 864e5;
const d0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmtShort = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
function DateRangePicker({ value, active, onApply }) {
  const today = d0(new Date());
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [from, setFrom] = useState(null); const [to, setTo] = useState(null); const [hover, setHover] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const [a, b] = value || [today, today];
    setFrom(a); setTo(b); setHover(null); setView(new Date(b.getFullYear(), b.getMonth(), 1));
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const y = view.getFullYear(); const m = view.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; const dim = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: dim }, (_, i) => new Date(y, m, i + 1));
  const end = to || (from && hover && hover >= from ? hover : null);
  const pick = (d) => {
    if (!from || to) { setFrom(d); setTo(null); return; }
    if (d < from) { setFrom(d); return; }
    setTo(d);
  };
  const ago = (n) => new Date(today.getTime() - n * DAY_MS);
  const presets = [
    ['Yesterday', ago(1), ago(1)],
    ['Last 7 days', ago(6), today],
    ['Last 30 days', ago(29), today],
    ['Last month', new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 0)],
    ['Last 90 days', ago(89), today],
  ];
  const apply = (a, b) => { onApply([a, b || a]); setOpen(false); };
  const nights = from && (to || from) ? Math.round(((to || from) - from) / DAY_MS) + 1 : 0;
  const canNext = new Date(y, m + 1, 1) <= today;

  return (
    <div className="drp" ref={ref}>
      <button className={`drp-btn ${active ? 'on' : ''} ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-haspopup="dialog" aria-expanded={open}>
        <CalendarDays size={14} />
        {active && value ? <span>{fmtShort(value[0])}{+value[0] !== +value[1] && <> – {fmtShort(value[1])}</>}</span> : <span>Custom</span>}
        <ChevronDown size={13} className="drp-caret" />
      </button>
      {open && (
        <div className="drp-pop" role="dialog" aria-label="Choose a date range">
          <div className="drp-pre">
            <small>Quick select</small>
            {presets.map(([label, a, b]) => (
              <button key={label} className={from && to && +from === +a && +to === +b ? 'on' : ''} onClick={() => apply(a, b)}>{label}</button>
            ))}
          </div>
          <div className="drp-cal">
            <div className="drp-h">
              <button onClick={() => setView(new Date(y, m - 1, 1))} aria-label="Previous month"><ChevronLeft size={15} /></button>
              <b>{view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b>
              <button onClick={() => canNext && setView(new Date(y, m + 1, 1))} disabled={!canNext} aria-label="Next month"><ChevronRight size={15} /></button>
            </div>
            <div className="drp-grid" onMouseLeave={() => setHover(null)}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => <span key={w} className="drp-wd">{w}</span>)}
              {Array.from({ length: lead }, (_, i) => <i key={`p${i}`} />)}
              {days.map((d) => {
                const future = d > today; const isA = from && +d === +from; const isB = end && +d === +end;
                const inR = from && end && d > from && d < end;
                return (
                  <button key={+d} disabled={future} onClick={() => pick(d)} onMouseEnter={() => setHover(d)}
                    className={`${isA ? 'a' : ''} ${isB ? 'b' : ''} ${inR ? 'in' : ''} ${+d === +today ? 'now' : ''}`}>{d.getDate()}</button>
                );
              })}
            </div>
            <div className="drp-f">
              <span>{from ? <><b>{fmtShort(from)}</b>{(to || hover) && <> → <b>{fmtShort(to || (hover >= from ? hover : from))}</b></>}<em>{to ? `${nights} day${nights === 1 ? '' : 's'}` : 'pick end date'}</em></> : 'Pick a start date'}</span>
              <div>
                <button className="ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button className="go" disabled={!from} onClick={() => apply(from, to)}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Factory line: dough to dispatch ============ */
// station -> FLOW key in zoho.jsx (quotation > order > stock > packing assignment > weight check > packing list > shipment)
const FL_STAGES = [
  ['01', 'Dough mixing', 100, 'quote'], ['02', 'Sheet rolling', 300, 'order'], ['03', 'Press & cut', 500, 'stock'],
  ['04', 'Tunnel drying', 700, 'assign'], ['05', 'Weight check', 930, 'weigh'], ['06', 'Packing', 1090, 'pack'], ['07', 'Dispatch', 1260, 'ship'],
];
// card icon + accent per station
const FL_CARD = {
  quote: [FileText, '--gold'], order: [ShoppingCart, '--chilli'], stock: [Repeat, '--toast'], assign: [ClipboardList, '--leaf'],
  weigh: [Scale, '--volt'], pack: [Package, '--toast'], ship: [Send, '--leaf'],
};
const FL_PERIODS = { Today: 'today', 'This month': 'month', 'This year': 'year' };
// truck bed slots, loading order: far end first, bottom row first
const SLOTS = [-31, -51, -71].flatMap((cy) => [85, 62, 39, 16].map((cx) => [cx, cy]));
const jig = (b, a, d = 0) => +(b + (Math.random() - 0.5) * a).toFixed(d);

function FactoryLine({ greet }) {
  const ready = useContext(Ready);
  const [period, setPeriod] = useState('This month');
  const root = useRef(null);
  const count = useRef(0);
  const [running, setRunning] = useState(true);
const ctxRef = useRef(null);
  // live counts from Zoho, one module per station
  const [custom, setCustom] = useState(null);
  const flow = useFactoryFlow(custom); const pk = period === 'Custom' ? 'custom' : FL_PERIODS[period];
  const maxN = Math.max(1, ...FL_STAGES.map(([, , , k]) => flow.stations[k].data[pk]));
  const fulfilPct = flow.fulfil.all[pk] ? Math.round((flow.fulfil.done[pk] / flow.fulfil.all[pk]) * 1000) / 10 : 0;
  const fmt = (n) => (flow.loading ? '…' : n.toLocaleString('en-IN'));
  // hover: find the station under the pointer (zones split halfway between stations)
  const [hov, setHov] = useState(null);
  const zone = (i) => [i ? (FL_STAGES[i - 1][2] + FL_STAGES[i][2]) / 2 : 12, i < FL_STAGES.length - 1 ? (FL_STAGES[i][2] + FL_STAGES[i + 1][2]) / 2 : 1348];
  const onStageMove = (e) => {
    if (e.target.closest('.fl-motor')) { setHov(null); return; }
    const svg = e.currentTarget.querySelector('svg'); const b = svg.getBoundingClientRect(); const sb = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * 1360;
    const i = FL_STAGES.findIndex((_, k) => x < zone(k)[1]);
    const idx = i < 0 ? FL_STAGES.length - 1 : i;
    const px = b.left - sb.left + e.currentTarget.scrollLeft + (FL_STAGES[idx][2] / 1360) * b.width;
    setHov((h) => (h && h.i === idx && Math.abs(h.px - px) < 1 ? h : { i: idx, px, w: b.width }));
  };
  const onStageClick = (e) => {
    if (hov === null || e.target.closest('.fl-motor')) return;
    window.open(zoho(flow.stations[FL_STAGES[hov.i][3]].report), '_blank', 'noopener');
  };

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
      gsap.to('.fl-drv-head', { y: -0.7, duration: 0.32, yoyo: true, repeat: -1, ease: 'sine.inOut' });
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
    <Seg options={Object.keys(FL_PERIODS)} value={period} onChange={setPeriod} />
    <DateRangePicker value={custom} active={period === 'Custom'} onApply={(r) => { setCustom(r); setPeriod('Custom'); }} />
  </div>
</div>

<div className={`fl-stage ${running ? '' : 'paused'} ${hov ? 'hovering' : ''}`} ref={root}
  onMouseMove={onStageMove} onMouseLeave={() => setHov(null)} onClick={onStageClick}>
        <span className="fl-scan" />
        <svg className="fl-svg" viewBox="0 0 1360 348" role="img" aria-label="Animated production line from dough mixing to truck dispatch">
          
          <defs>
            <linearGradient id="flMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="gm1" /><stop offset="1" className="gm2" /></linearGradient>
            <linearGradient id="flBeltG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4a53" /><stop offset="1" stopColor="#26262c" /></linearGradient>
            <linearGradient id="flHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="gh1" /><stop offset="1" className="gh2" /></linearGradient>
          </defs>

          {/* HUD corners + floor */}
          {['M12,30 V12 H30', 'M1348,30 V12 H1330', 'M12,320 V338 H30', 'M1348,320 V338 H1330'].map((d) => <path key={d} d={d} className="fl-corner" />)}
          <line className="fl-floor" x1="20" x2="1340" y1="330" y2="330" />
          {hov && <rect className="fl-zone" x={zone(hov.i)[0] + 4} y="14" width={zone(hov.i)[1] - zone(hov.i)[0] - 8} height="324" rx="14" />}

          {/* stage header: flow line + numbered nodes */}
          <line className="fl-flow" x1="100" x2="1260" y1="46" y2="46" />
          {FL_STAGES.map(([n, name, x, key]) => (
            <g key={n}>
              <title>{name}</title>
              {/* node grows with this station's share of the busiest station */}
              <circle className={`fl-node ${hov && FL_STAGES[hov.i][0] === n ? 'on' : ''}`} cx={x} cy="46" r={4 + 5 * (flow.stations[key].data[pk] / maxN)} style={{ transition: 'r .6s' }} />
              <text className="fl-no" x={x} y="30" textAnchor="middle">{n}</text>
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
<g className="fl-motor">
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
          <g transform="translate(0,300)"><g className="fl-hop" opacity="0"><rect className="fl-box" x="-12" y="-10" width="24" height="20" rx="2" /><rect className="fl-lbl" x="-9" y="-5" width="18" height="10" rx="1.5" /><image href={LOGO} x="-8" y="-4" width="16" height="8" preserveAspectRatio="xMidYMid meet" /></g></g>
          <g className="fl-truck" transform="translate(1420,330)">
            <rect className="fl-tbed" x="0" y="-86" width="104" height="64" rx="4" />
            {SLOTS.map(([cx, cy], k) => (
              <g key={k} transform={`translate(${cx},${cy})`}>
                <g className="fl-tc" opacity="0">
                  <rect className="fl-box" x="-10" y="-9" width="20" height="18" rx="2" />
                  <rect className="fl-lbl" x="-8" y="-4.5" width="16" height="9" rx="1.5" />
                  <image href={LOGO} x="-7" y="-3.5" width="14" height="7" preserveAspectRatio="xMidYMid meet" />
                </g>
              </g>
            ))}
            <path className="fl-tcab" d="M108,-62 H136 L156,-40 V-22 H108 Z" />
            <path className="fl-twin" d="M114,-56 H133 L146,-42 H114 Z" />
            {/* driver, clipped to the cab window, facing the road (right) */}
            <clipPath id="flCabWin"><path d="M114,-56 H133 L146,-42 H114 Z" /></clipPath>
            <g clipPath="url(#flCabWin)">
              <path className="fl-drv-shirt" d="M117,-38 V-42.5 Q117,-46 121,-46 H127 Q131,-46 131,-42.5 V-38 Z" />
              <g className="fl-drv-head">
                <rect className="fl-drv-skin" x="122.6" y="-47.6" width="2.8" height="2.4" />
                <circle className="fl-drv-skin" cx="124" cy="-50.4" r="3.6" />
                <path className="fl-drv-cap" d="M120.3,-51 Q120.6,-55 124,-55 Q127.4,-55 127.7,-51 Z" />
                <rect className="fl-drv-cap" x="126.4" y="-51.6" width="3.6" height="1.2" rx=".6" />
                <circle cx="126.2" cy="-50.6" r=".55" fill="#2b1d14" />
              </g>
              <path className="fl-drv-arm" d="M128,-44.5 Q132,-45 135.5,-46.5" />
              <line className="fl-drv-wheel" x1="134.5" y1="-50" x2="137.5" y2="-43" />
            </g>
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
        {hov && (() => {
          const [n, name, , key] = FL_STAGES[hov.i]; const s = flow.stations[key]; const [Ic, c] = FL_CARD[key];
          const val = s.data[pk]; const label = s.unit[1].replace(/^./, (ch) => ch.toUpperCase());
          const edge = hov.i === 0 ? 'translateX(-18%)' : hov.i === FL_STAGES.length - 1 ? 'translateX(-82%)' : 'translateX(-50%)';
          return (
            <div className="fl-tip" style={{ left: hov.px, transform: edge, '--c': v(s.error ? '--chilli' : c), '--w': `${(val / maxN) * 100}%` }}>
              <div className="ft-h"><span className="ft-no">{n}</span>{name}<span className="ft-per">{period}</span></div>
              <div className="ft-m">
                <span className="ft-ic"><Ic size={18} strokeWidth={2.1} /></span>
                <div><b>{label}</b><code>{s.report}</code></div>
              </div>
              <div className="ft-v">
                {s.loading ? '…' : s.error ? '—' : val.toLocaleString('en-IN')}
                <small>{s.error ? 'could not load' : s.unit[val === 1 ? 0 : 1]}</small>
                {!s.error && !s.loading && val === maxN && val > 0 && <em>Busiest</em>}
              </div>
              <div className="ft-bar"><i /></div>
              <div className="ft-f">Click to open report<ArrowUpRight size={12} /></div>
            </div>
          );
        })()}
      </div>

      {/* one card per station in line order (opens the module's report), then trucks */}
      <div className="fl-stats">
        {FL_STAGES.map(([n, name, , key]) => {
          const s = flow.stations[key]; const val = s.data[pk]; const [Ic, c] = FL_CARD[key];
          const isOrder = key === 'order';
          return (
            <a key={n} className={`fs ${s.error ? 'off' : ''}`} href={zoho(s.report)} target="_blank" rel="noopener noreferrer"
              style={{ '--c': v(s.error ? '--chilli' : c), '--w': `${isOrder ? fulfilPct : (val / maxN) * 100}%` }}
              title={isOrder ? 'Bar = Shipped + Completed orders out of all confirmed orders' : `Open ${s.unit[1]}`}>
              <span className="fs-ic"><Ic size={21} strokeWidth={2.1} /></span>
              <div className="fs-tx">
                <span><em>{n}</em>{name}</span>
                <b>{s.loading ? '…' : s.error ? '—' : val.toLocaleString('en-IN')}
                  <small>{s.error ? 'could not load' : isOrder && !s.loading ? `${s.unit[val === 1 ? 0 : 1]} · ${fulfilPct}% fulfilled` : s.unit[val === 1 ? 0 : 1]}</small></b>
                <div className="fs-meter"><i /></div>
              </div>
              <ArrowUpRight className="fs-go" size={14} />
            </a>
          );
        })}
        <a className="fs" href={zoho(DISPATCHES.report)} target="_blank" rel="noopener noreferrer" style={{ '--c': v('--volt'), '--w': `${(flow.trucks[pk] / Math.max(1, flow.trucks.year)) * 100}%` }} title="Open daily dispatches">
          <span className="fs-ic"><Truck size={21} strokeWidth={2.1} /></span>
          <div className="fs-tx">
            <span>Trucks dispatched</span>
            <b>{fmt(flow.trucks[pk])}<small>{flow.trucks[pk] === 1 ? 'truck' : 'trucks'}</small></b>
            <div className="fs-meter"><i /></div>
          </div>
          <ArrowUpRight className="fs-go" size={14} />
        </a>
      </div>
    </Card>
  );
}

/* ============ Business intelligence (live, futuristic "console" cards) ============ */
const rupee = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
function FxHead({ kicker, title, live, loading, icon: Ic, children }) {
  return (
    <div className="fx-h">
      <div className="fx-ht">
        {Ic && <span className="fx-ico"><Ic size={18} strokeWidth={2.1} /></span>}
        <div>
          <h3 title={`${loading ? 'Syncing' : live ? 'Live' : 'Sample'} · ${kicker}`}>{title}</h3>
        </div>
      </div>
      {children && <div className="fx-hr">{children}</div>}
    </div>
  );
}

/* HUD gauge: 270° segmented dial that lights up to the collection rate */
const GSEG = 44; const G0 = 135; const GSPAN = 270;
const polar = (r, deg) => [110 + r * Math.cos((deg * Math.PI) / 180), 110 + r * Math.sin((deg * Math.PI) / 180)];
const arcPath = (r, a0, a1) => { const [x0, y0] = polar(r, a0); const [x1, y1] = polar(r, a1); return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`; };
function CashGauge({ rate, received, invoiced, loading }) {
  const lit = Math.round((rate / 100) * (GSEG - 1));
  const health = rate >= 80 ? ['Healthy', '--fx-green'] : rate >= 50 ? ['Watch', '--fx-gold'] : ['Critical', '--fx-red'];
  const [mx, my] = polar(86.5, G0 + (GSPAN * rate) / 100);
  return (
    <div className="cg" style={{ '--hc': v(health[1]) }}>
      <svg viewBox="0 0 220 220">
        <defs>
          <radialGradient id="cgDisc" cx="50%" cy="38%" r="65%"><stop offset="0" stopColor="var(--fx-disc-hi)" /><stop offset="1" stopColor="var(--fx-disc)" /></radialGradient>
        </defs>
        {/* outer HUD rings, counter-rotating */}
        <g className="cg-spin"><path className="cg-hud" d={arcPath(104, 200, 290)} /><path className="cg-hud" d={arcPath(104, 20, 110)} /></g>
        <g className="cg-spin rev"><circle className="cg-dash" cx="110" cy="110" r="99" /></g>
        {/* scale ticks + labels */}
        {Array.from({ length: 11 }, (_, i) => { const [x0, y0] = polar(70, G0 + i * 27); const [x1, y1] = polar(i % 5 ? 73 : 76, G0 + i * 27); return <line key={i} className="cg-tick" x1={x0} y1={y0} x2={x1} y2={y1} />; })}
        {[[0, '0'], [100, '100']].map(([pc, t]) => { const [x, y] = polar(97, G0 + (GSPAN * pc) / 100 + (pc === 0 ? -9 : pc === 100 ? 9 : 0)); return <text key={t} className="cg-lbl" x={x} y={y + 3} textAnchor="middle">{t}</text>; })}
        {/* segmented dial */}
        {Array.from({ length: GSEG }, (_, i) => {
          const deg = G0 + (i * GSPAN) / (GSEG - 1); const [x0, y0] = polar(80, deg); const [x1, y1] = polar(93, deg);
          const on = !loading && rate > 0 && i <= lit; const t = i / (GSEG - 1);
          return <line key={i} className={`cg-seg ${on ? 'on' : ''}`} x1={x0} y1={y0} x2={x1} y2={y1}
            style={{ stroke: on ? `hsl(${190 - t * 45} 72% ${44 - t * 4}%)` : undefined, transitionDelay: `${i * 18}ms` }} />;
        })}
        {/* glass disc */}
        <circle className="cg-disc" cx="110" cy="110" r="62" fill="url(#cgDisc)" />
        <circle className="cg-ring" cx="110" cy="110" r="62" />
        {/* live marker at the tip */}
        {!loading && rate > 0 && <g transform={`translate(${mx},${my})`}><circle className="cg-pulse" r="7" /><circle className="cg-pin" r="5.5" /></g>}
      </svg>
      <div className="cg-sweep" />
      <div className="cg-c">
        <b>{loading ? '…' : <CountUp to={rate} dec={1} suffix="%" />}</b>
        <span>Collected</span>
      </div>
      <div className="cg-f">{rupee(received)}<span>of</span>{rupee(invoiced)}</div>
    </div>
  );
}

/* cash radar: collection gauge + receivable aging */
const AGING = [['Not due yet', '--fx-cyan'], ['Due today', '--fx-gold'], ['1–30 days late', '--fx-orange'], ['31–60 days late', '--fx-red'], ['60+ days late', '--fx-crimson']];
function CashRadar() {
  const { data: d, loading, live } = useReceivables();
  const kpis = [
    ['Invoiced', d.invoiced, '--fx-cyan', 100],
    ['Collected', d.collected, '--fx-green', d.rate],
    ['Outstanding', d.outstanding, '--fx-gold', d.invoiced ? Math.min(100, (d.outstanding / d.invoiced) * 100) : 0],
  ];
  return (
    <Card className="s8 fx">
      <FxHead kicker="FY receivables" title="Cash Flow Radar" icon={Radar} live={live} loading={loading}>
        <a className="fx-link" href={zoho(INV_REPORT)} target="_blank" rel="noopener noreferrer">Invoices<ArrowUpRight size={14} /></a>
      </FxHead>
      <div className="cr-top">
        <CashGauge rate={d.rate} received={d.collected} invoiced={d.invoiced} loading={loading} />
        <div className="cr-kpis">
          {kpis.map(([label, val, c, w]) => (
            <div key={label} className="cr-kpi" style={{ '--c': v(c), '--w': `${Math.min(100, w)}%` }}>
              <div className="cr-kl"><span>{label}</span><em>{label === 'Invoiced' ? 'this FY' : `${w.toFixed(1)}%`}</em></div>
              <b>₹<CountUp to={val} /></b>
              <div className="cr-kb"><i /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="cr-age">
        <div className="cr-ah"><span>Open invoices by due date</span><b>{rupee(d.open)} · {d.openN} open</b></div>
        <div className="cr-bar">
          {AGING.map(([label, c], i) => d.aging[i] > 0 && (
            <i key={label} style={{ flex: d.aging[i], background: v(c) }} title={`${label}: ${rupee(d.aging[i])}`} />
          ))}
          {!d.open && <i className="empty" />}
        </div>
        <div className="cr-leg">
          {AGING.map(([label, c], i) => (
            <div key={label} style={{ '--c': v(c) }} className={d.agingN[i] ? '' : 'zero'}>
              <span><i />{label}</span><b>{shortInr(d.aging[i])}</b><small>{d.agingN[i]} inv</small>
            </div>
          ))}
        </div>
      </div>

      {d.worst ? (
        <a className="cr-alert" href={zoho(INV_REPORT)} target="_blank" rel="noopener noreferrer">
          <span className="cr-ai"><TriangleAlert size={15} /></span>
          <span><b>{d.overdueN} overdue · {rupee(d.overdue)}</b> — oldest is <b>{d.worst.no}</b> ({d.worst.customer}), {d.worst.days} days late, {rupee(d.worst.amt)}</span>
          <ArrowUpRight size={14} />
        </a>
      ) : !loading && d.dueTodayN > 0 ? (
        <a className="cr-alert warn" href={zoho(INV_REPORT)} target="_blank" rel="noopener noreferrer">
          <span className="cr-ai"><CalendarClock size={15} /></span>
          <span><b>{d.dueTodayN} invoice{d.dueTodayN === 1 ? '' : 's'} due today · {rupee(d.dueToday)}</b> — follow up before they turn overdue.</span>
          <ArrowUpRight size={14} />
        </a>
      ) : !loading && (
        <div className="cr-alert ok"><span className="cr-ai"><ShieldCheck size={15} /></span><span><b>No overdue invoices</b> — every open invoice is before its due date.</span></div>
      )}
    </Card>
  );
}

/* sales funnel: quotation > order > invoice > paid */
function SalesFunnel() {
  const [per, setPer] = useState('This year');
  const { data: d, loading, live } = useSalesFunnel(); const k = per === 'This year' ? 'year' : 'month';
  const stages = [
    ['Quotations', d.quote[k], FileText, '--fx-violet', d.missing.quote],
    ['Sales orders', d.order[k], ShoppingCart, '--fx-cyan', d.missing.order],
    ['Invoices', d.invoice[k], ReceiptText, '--fx-gold', d.missing.invoice],
    ['Paid', d.paid[k], CheckCircle2, '--fx-green', d.missing.invoice],
  ];
  const max = Math.max(1, ...stages.map((s) => s[1]));
  const win = d.quote[k] ? (d.paid[k] / d.quote[k]) * 100 : 0;
  return (
    <Card className="s4 fx">
      <FxHead kicker="Conversion" title="Sales Funnel" icon={Filter} live={live} loading={loading}>
        <Seg options={['This month', 'This year']} value={per} onChange={setPer} />
      </FxHead>
      <div className="fn">
        {stages.map(([label, n, Ic, c, miss], i) => {
          const next = stages[i + 1]; const conv = next && n ? Math.min(100, (next[1] / n) * 100) : null;
          return (
            <React.Fragment key={label}>
              <div className="fn-st" style={{ '--c': v(c), '--w': `${Math.max(22, (n / max) * 100)}%` }}>
                <div className="fn-bar"><Ic size={15} /><span>{label}</span><b>{miss ? '—' : <CountUp to={n} />}</b></div>
              </div>
              {next && <div className="fn-conv"><i />{conv === null ? '—' : `${conv.toFixed(0)}%`} <span>convert</span></div>}
            </React.Fragment>
          );
        })}
      </div>
      <div className="fn-f">
        <div><span>Quote → paid</span><b>{win.toFixed(1)}%</b></div>
        <div><span>Invoiced</span><b>{shortInr(d.value[k])}</b></div>
        <div><span>Collected</span><b style={{ color: v('--fx-green') }}>{shortInr(d.paidValue[k])}</b></div>
      </div>
    </Card>
  );
}

/* top customers: billed vs collected this FY */
const TC_COL = ['--fx-orange', '--fx-cyan', '--fx-violet', '--fx-green', '--fx-gold', '--fx-red'];
const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
function TopCustomers() {
  const { data: d, loading, live } = useTopCustomers(6);
  const others = Math.max(0, d.total - d.rows.reduce((s, r) => s + r.billed, 0));
  const pct = (n) => (d.total ? (n / d.total) * 100 : 0);
  return (
    <Card className="s6 fx">
      <FxHead kicker="this FY" title="Top Customers" icon={Crown} live={live} loading={loading}>
        <a className="fx-link" href={zoho('All_Customers')} target="_blank" rel="noopener noreferrer">Customers<ArrowUpRight size={14} /></a>
      </FxHead>

      <div className="tc-sum">
        <div><span>Customers</span><b><CountUp to={d.count} /></b></div>
        <div><span>Billed</span><b>{shortInr(d.total)}</b></div>
        <div className="ok"><span>Collected</span><b>{shortInr(d.paid)}</b></div>
        <div className="due"><span>Due</span><b>{shortInr(d.due)}</b></div>
      </div>

      {/* revenue share across customers */}
      <div className="tc-share">
        <div className="tc-sbar">
          {d.rows.map((r, i) => <i key={r.name} style={{ flex: r.billed, background: v(TC_COL[i]) }} title={`${r.name}: ${pct(r.billed).toFixed(0)}%`} />)}
          {others > 0 && <i className="oth" style={{ flex: others }} title={`Others: ${pct(others).toFixed(0)}%`} />}
          {!d.total && <i className="oth" style={{ flex: 1 }} />}
        </div>
        <span>Revenue share</span>
      </div>

      <div className="tc">
        {!loading && !d.rows.length && <div className="fx-empty">No invoices this financial year yet</div>}
        {d.rows.map((r, i) => {
          const paidPct = r.billed ? (r.paid / r.billed) * 100 : 0;
          return (
            <div key={r.name} className={`tc-r ${i === 0 ? 'lead' : ''}`} style={{ '--c': v(TC_COL[i]) }}>
              <span className="tc-av">{initials(r.name)}{i === 0 && <em><Crown size={10} /></em>}</span>
              <div className="tc-m">
                <div className="tc-n"><b>{r.name}</b><span className="tc-sh">{pct(r.billed).toFixed(0)}%</span></div>
                <div className="tc-meta">{r.n} invoice{r.n === 1 ? '' : 's'} · {paidPct.toFixed(0)}% collected</div>
                <div className="tc-bar"><i className="paid" style={{ width: `${paidPct}%` }} /></div>
              </div>
              <div className="tc-v">
                <b>{rupee(r.billed)}</b>
                {r.due > 0 ? <small className="due">{rupee(r.due)} due</small> : <small className="ok"><CheckCircle2 size={11} />Settled</small>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* custom month + year picker (months counted as year*12 + month) */
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function MonthPicker({ value, min, max, activity, onChange }) {
  const [open, setOpen] = useState(false);
  const [yr, setYr] = useState(Math.floor(value / 12));
  const [view, setView] = useState('month');
  const ref = useRef(null);
  const years = Array.from({ length: Math.floor(max / 12) - Math.floor(min / 12) + 1 }, (_, i) => Math.floor(min / 12) + i).reverse();
  const yearEvents = (y) => MON3.reduce((t, _, i) => t + (activity[`${y}-${i}`] || 0), 0);
  useEffect(() => {
    if (!open) return undefined;
    setYr(Math.floor(value / 12)); setView('month');
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const top = Math.max(1, ...MON3.map((_, i) => activity[`${yr}-${i}`] || 0));
  const pick = (k) => { onChange(k); setOpen(false); };
  return (
    <div className="mp" ref={ref}>
      <button className={`mp-btn ${open ? 'on' : ''}`} onClick={() => setOpen(!open)} aria-haspopup="dialog" aria-expanded={open}>
        <CalendarDays size={14} />{MON3[value % 12]} {Math.floor(value / 12)}<ChevronDown size={14} className="mp-caret" />
      </button>
      {open && (
        <div className="mp-pop" role="dialog" aria-label="Choose month and year">
          <button className={`mp-yr ${view === 'year' ? 'on' : ''}`} onClick={() => setView(view === 'year' ? 'month' : 'year')} aria-label="Choose year">
            <b>{view === 'year' ? 'Select year' : yr}</b><ChevronDown size={15} />
          </button>
          {view === 'year' ? (
            <div className="mp-grid">
              {years.map((y) => (
                <button key={y} className={`${y === yr ? 'sel' : ''} ${y === Math.floor(max / 12) ? 'now' : ''}`} onClick={() => { setYr(y); setView('month'); }}
                  title={`${yearEvents(y)} events`}>
                  {y}
                </button>
              ))}
            </div>
          ) : (
          <div className="mp-grid">
            {MON3.map((name, i) => {
              const k = yr * 12 + i; const off = k < min || k > max; const ev = activity[`${yr}-${i}`] || 0;
              return (
                <button key={name} className={`${k === value ? 'sel' : ''} ${k === max ? 'now' : ''}`} disabled={off} onClick={() => pick(k)}
                  title={off ? 'No data for this month' : `${ev} events`}>
                  {name}
                  <i style={{ width: `${off ? 0 : Math.max(ev ? 18 : 0, (ev / top) * 100)}%` }} />
                </button>
              );
            })}
          </div>
          )}
          <div className="mp-f">
            <span><i />activity</span>
            <button onClick={() => pick(max)}>This month</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* business pulse: month calendar of orders + invoices + payments, browsable */
const WD7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function BusinessPulse() {
  const { data: d, loading, live } = useBusinessPulse();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [ym, setYm] = useState(() => [today.getFullYear(), today.getMonth()]);
  const [hov, setHov] = useState(null);
  const [y, m] = ym;
  // selectable range: earliest record's month (at least 12 months back) .. this month; months counted as y*12+m
  const maxM = today.getFullYear() * 12 + today.getMonth();
  const minM = Math.min(maxM - 12, d.first ? d.first.getFullYear() * 12 + d.first.getMonth() : maxM);
  const cur = y * 12 + m;
  const go = (k) => { if (k >= minM && k <= maxM) { setYm([Math.floor(k / 12), k % 12]); setHov(null); } };
  // activity per month for the picker ('y-m' -> events)
  const perMonth = useMemo(() => {
    const out = {}; Object.entries(d.days).forEach(([k, x]) => { const [yy, mm] = k.split('-'); const key = `${yy}-${mm}`; out[key] = (out[key] || 0) + x.so + x.inv + x.pay; });
    return out;
  }, [d.days]);

  const n = (x) => x.so + x.inv + x.pay;
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; const dim = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: dim }, (_, i) => { const date = new Date(y, m, i + 1); return { date, ...(d.days[dayKey(date)] || { so: 0, inv: 0, pay: 0 }) }; });
  const past = cells.filter((c) => c.date <= today);
  const max = Math.max(1, ...cells.map(n));
  const tot = cells.reduce((s, c) => ({ so: s.so + c.so, inv: s.inv + c.inv, pay: s.pay + c.pay }), { so: 0, inv: 0, pay: 0 });
  const active = past.filter(n).length;
  let streak = 0; let run = 0; past.forEach((c) => { run = n(c) ? run + 1 : 0; streak = Math.max(streak, run); });
  const best = cells.reduce((a, c) => (n(c) > n(a) ? c : a), cells[0]);
  const fmtD = (x, o) => x.toLocaleDateString('en-GB', o);
  const label = (x) => x.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <Card className="s6 fx">
      <FxHead kicker="month view" title="Business Pulse" icon={Activity} live={live} loading={loading}>
        <MonthPicker value={cur} min={minM} max={maxM} activity={perMonth} onChange={go} />
      </FxHead>
      <div className="bp-stats">
        <div><Activity size={15} /><b>{active}<small>/{past.length}</small></b><span>active days</span></div>
        <div><Flame size={15} /><b>{streak}</b><span>best streak</span></div>
        <div><Zap size={15} /><b>{n(best) ? fmtD(best.date, { day: '2-digit', month: 'short' }) : '—'}</b><span>busiest · {n(best)} events</span></div>
      </div>
      <div className="bp-cal" onMouseLeave={() => setHov(null)}>
        {WD7.map((w) => <span key={w} className="bp-wd">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <i key={`p${i}`} />)}
        {cells.map((c) => {
          const future = c.date > today; const lv = n(c) ? Math.ceil((n(c) / max) * 4) : 0;
          return (
            <button key={+c.date} className={`bp-day l${lv} ${future ? 'fut' : ''} ${+c.date === +today ? 'now' : ''} ${hov && +hov.date === +c.date ? 'on' : ''}`}
              onMouseEnter={() => !future && setHov(c)} onFocus={() => !future && setHov(c)} tabIndex={future ? -1 : 0}>
              <span>{c.date.getDate()}</span>{n(c) > 0 && <em>{n(c)}</em>}
              {hov && +hov.date === +c.date && (
                <div className={`bp-pop ${(lead + c.date.getDate() - 1) % 7 === 0 ? 'l' : (lead + c.date.getDate() - 1) % 7 === 6 ? 'r' : ''}`} role="tooltip">
                  <b>{fmtD(c.date, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</b>
                  {n(c) ? (
                    <>
                      <span><i style={{ background: v('--fx-cyan') }} />Orders<strong>{c.so}</strong></span>
                      <span><i style={{ background: v('--fx-gold') }} />Invoices<strong>{c.inv}</strong></span>
                      <span><i style={{ background: v('--fx-green') }} />Payments<strong>{c.pay}</strong></span>
                      <span className="tot">Total<strong>{n(c)}</strong></span>
                    </>
                  ) : <span className="none">No activity</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="bp-tip">
        <b>{hov ? fmtD(hov.date, { weekday: 'short', day: '2-digit', month: 'short' }) : `${label(new Date(y, m, 1))} total`}</b>
        <span><i style={{ background: v('--fx-cyan') }} />{(hov || tot).so} orders</span>
        <span><i style={{ background: v('--fx-gold') }} />{(hov || tot).inv} invoices</span>
        <span><i style={{ background: v('--fx-green') }} />{(hov || tot).pay} payments</span>
        <span className="bp-scale">Less{[0, 1, 2, 3, 4].map((l) => <i key={l} className={`bp-c l${l}`} />)}More</span>
      </div>
    </Card>
  );
}

/* master records: live counts per core module */
const MASTER_ICON = { cust: [Users, '--fx-cyan'], prod: [Package, '--fx-gold'], emp: [Contact, '--fx-violet'], vend: [Store, '--fx-orange'], veh: [CarFront, '--fx-green'], trans: [Truck, '--fx-red'] };
function MasterRecords() {
  const { data: d, loading, live } = useMasterCounts();
  const total = MASTERS.reduce((s, m) => s + (d[m.key]?.total || 0), 0);
  return (
    <Card className="s12 fx">
      <FxHead kicker={`${total.toLocaleString('en-IN')} records`} title="Master Data Core" icon={Database} live={live} loading={loading}>
        <span className="fx-pill"><Database size={13} />Core Master</span>
      </FxHead>
      <div className="mr">
        {MASTERS.map((m) => {
          const x = d[m.key]; const [Ic, c] = MASTER_ICON[m.key];
          return (
            <a key={m.key} className={`mr-t ${x ? '' : 'off'}`} href={zoho(m.report)} target="_blank" rel="noopener noreferrer" style={{ '--c': v(c) }}>
              <span className="mr-ic"><Ic size={18} /></span>
              <span className="mr-l">{m.label}</span>
              <b>{x ? <CountUp to={x.total} /> : '—'}</b>
              <small>{!x ? 'could not load' : x.added ? <><em>+{x.added}</em> this month</> : x.added === 0 ? 'no new this month' : 'total records'}</small>
              <ArrowUpRight className="mr-go" size={14} />
            </a>
          );
        })}
      </div>
    </Card>
  );
}

/* ============ Background: drifting appalams with a futuristic constellation ============ */
function AppalamBackdrop({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const dark = theme === 'dark';
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, raf = 0;
    const r = rng(23);
    // depth 0 (far, small, faint) .. 1 (near, large, brighter)
    const discs = Array.from({ length: 18 }, () => {
      const z = r();
      const R = 18 + z * 62;
      return {
        x: r(), y: r(), z, R, a: r() * Math.PI * 2,
        spin: (r() - 0.5) * 0.004 * (1.2 - z), vy: -(0.04 + z * 0.12), sway: r() * Math.PI * 2,
        orbit: r() < 0.45, pores: Array.from({ length: 16 }, () => { const t = r() * Math.PI * 2; const d = 0.15 + r() * 0.65; return [Math.cos(t) * d, Math.sin(t) * d, 0.025 + r() * 0.03]; }),
      };
    });
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = `${W}px`; cv.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const teal = dark ? [60, 200, 224] : [14, 151, 176];
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    const drawDisc = (d, px, py, t) => {
      const alpha = (dark ? 0.16 : 0.2) + d.z * (dark ? 0.22 : 0.26);
      ctx.save(); ctx.translate(px, py); ctx.rotate(d.a); ctx.globalAlpha = alpha;
      // golden appalam body
      const g = ctx.createRadialGradient(-d.R * 0.3, -d.R * 0.3, d.R * 0.1, 0, 0, d.R);
      g.addColorStop(0, '#FFF1C6'); g.addColorStop(0.6, '#F7D27A'); g.addColorStop(1, '#D9A13A');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, d.R, 0, Math.PI * 2); ctx.fill();
      // blistered pores
      ctx.fillStyle = '#B8782A';
      d.pores.forEach(([x, y, s]) => { ctx.beginPath(); ctx.arc(x * d.R, y * d.R, s * d.R, 0, Math.PI * 2); ctx.fill(); });
      // dashed inner ring
      ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(122,74,14,.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, d.R * 0.82, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // futuristic orbit: thin ring + a travelling glow arc
      if (d.orbit) {
        ctx.save(); ctx.translate(px, py); ctx.globalAlpha = 0.25 + d.z * 0.35;
        ctx.strokeStyle = rgba(teal, 0.45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, d.R * 1.35, 0, Math.PI * 2); ctx.stroke();
        const s = t * 0.0009 * (1 + d.z) + d.sway;
        ctx.strokeStyle = rgba(teal, 0.9); ctx.lineWidth = 2; ctx.shadowColor = rgba(teal, 0.9); ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(0, 0, d.R * 1.35, s, s + 0.9); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Math.cos(s + 0.9) * d.R * 1.35, Math.sin(s + 0.9) * d.R * 1.35, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    };

    let last = 0;
    const frame = (t) => {
      // ~30fps is plenty for a slow backdrop and keeps the frosted cards cheap to repaint
      if (!still && t - last < 33) { raf = requestAnimationFrame(frame); return; }
      last = t;
      ctx.clearRect(0, 0, W, H);
      const pts = discs.map((d) => {
        if (!still) {
          d.y += (d.vy / H) * 2.4; d.a += d.spin * 2;
          if (d.y < -0.15) { d.y = 1.15; d.x = r(); }
        }
        return [d.x * W + Math.sin(t * 0.0003 + d.sway) * 24 * (0.4 + d.z), d.y * H, d];
      });
      // constellation lines between near neighbours
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1]; const dist = Math.hypot(dx, dy);
          if (dist < 260) {
            ctx.strokeStyle = rgba(teal, (1 - dist / 260) * (dark ? 0.22 : 0.16));
            ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
          }
        }
      }
      // far discs first so near ones sit on top
      pts.sort((a, b) => a[2].z - b[2].z).forEach(([x, y, d]) => drawDisc(d, x, y, t));
      if (!still) raf = requestAnimationFrame(frame);
    };
    resize(); window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [theme]);
  return <canvas ref={ref} className="bg-appalam" aria-hidden="true" />;
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
        .fromTo('.reveal', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, clearProps: 'transform' }, 0.4);
    }, shell);
    return () => c.revert();
  }, [ready]);



  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Ready.Provider value={ready}>
      <AppalamBackdrop theme={theme} />
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
          <CashRadar /><SalesFunnel />
          <TopCustomers /><BusinessPulse />
          {/* <MasterRecords /> */}
          {/* <Dispatches /> */}
        </div>
        <div className="note">Sample data shown. Connect to Zoho Creator to see live records.</div>
      </div>
      <Palette open={pal} onClose={() => setPal(false)} />
      {loading && <Loader onExit={() => setReady(true)} onDone={() => setLoading(false)} />}
    </Ready.Provider>
  );
}