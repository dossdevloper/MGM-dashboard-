import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarCheck2, X } from 'lucide-react';
import './toast.css';

/* Toast shown after a filter is applied: teal card, auto-closes (hover pauses, × closes).
   stats: [[label, value], ...] shown as chips. Remount with a new `key` to show it again. */
const TOAST_MS = 3800;
export default function Toast({ title, range, stats, onDone }) {
  const [leaving, setLeaving] = useState(false);
  return createPortal(
    <div className={`sk-toast ${leaving ? 'out' : ''}`} role="status" aria-live="polite"
      onAnimationEnd={(e) => { if (leaving && e.target === e.currentTarget) onDone(); }}>
      <span className="sk-toast-ic"><CalendarCheck2 size={18} strokeWidth={2.2} /></span>
      <div className="sk-toast-b">
        <b>{title}</b>
        <span className="sk-toast-r">{range}</span>
        <div className="sk-toast-s">{stats.map(([l, val]) => <span key={l}><em>{l}</em>{val}</span>)}</div>
      </div>
      <button className="sk-toast-x" onClick={() => setLeaving(true)} aria-label="Close"><X size={15} /></button>
      <i className="sk-toast-bar" style={{ animationDuration: `${TOAST_MS}ms` }} onAnimationEnd={() => setLeaving(true)} />
    </div>,
    document.body,
  );
}
