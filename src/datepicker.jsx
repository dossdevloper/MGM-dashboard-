import { useState, useEffect, useRef } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/* custom date-range picker: presets + a month calendar (click start, then end) */
const DAY_MS = 864e5;
const d0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmtShort = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
export default function DateRangePicker({ value, active, onApply }) {
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
