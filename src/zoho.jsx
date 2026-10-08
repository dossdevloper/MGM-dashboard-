import { useEffect, useState } from 'react';

/* ============ ZOHO CREATOR CONFIG ============
   Change the link names below to match your Creator app.
   Report / field link names are case-sensitive. */
export const APP_NAME = 'mgf-manufacturing';

// Date format set in Creator (Settings > General): 'dd-MMM-yyyy' | 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
export const DATE_FORMAT = 'dd-MMM-yyyy';

export const SALES_ORDER = {
  report: 'All_Sales_Orders',
  fields: {
    orderNo: 'Sales_order_no',
    date: 'SO_date',        // date field, used for the weekly orders chart
    status: 'Status',          // dropdown field holding the order status
  },
  // Status values exactly as they appear in the Status dropdown -> card label + colour
  statuses: [
    ['Draft', '--w-tan'],
    ['Confirmed', '--w-blue'],
    ['Shipped', '--w-gold'],
    ['Cancelled', '--w-red'],
    ['Completed', '--w-green'],
  ],
};

export const PAYMENTS = {
  report: 'All_Payments',
  fields: {
    amount: 'Amount_Received',          // number / currency field
    date: 'Payment_Date',      // date (or date-time) field
    customer: 'Customer',      // customer name or lookup field, used for "N customers"
    status: 'Payment_Status',  // dropdown: Received / Pending / Cancelled
  },
  // Payment_Status choices exactly as in Creator -> colour + icon key
  statuses: [
    ['Received', '--w-green', 'ok'],
    ['Pending', '--w-gold', 'wait'],
    ['Cancelled', '--w-red', 'x'],
  ],
};

export const INVOICES = {
  report: 'All_Invoices',
  fields: {
    invoiceNo: 'Invoice_No',
    date: 'Invoice_Date',      // used for Today / This week / This month / This year
    dueDate: 'Due_Date',
    customer: 'Customer',
    amount: 'Grand_Total',     // invoice total
    status: 'Status',          // dropdown
  },
  // Status choices exactly as in Creator -> colour
  statuses: [
    ['Draft', '--w-tan'],
    ['Issued', '--w-blue'],
    ['Partially Paid', '--w-gold'],
    ['Paid', '--w-green'],
    ['Cancelled', '--w-red'],
  ],
  recent: 5,                   // how many recent invoices to list
};

// Today's Highlights: "Deliveries" = dispatches dated today, "New Customers" = customers added today
export const DISPATCHES = {
  report: 'All_Daily_Dispatches',
  fields: { date: 'Dispatch_Date' },
};
export const CUSTOMERS = {
  report: 'All_Customers',
  fields: { date: 'Added_Time' },  // Creator's built-in created time (must be shown in the report)
};

/* Factory line: each station shows one module, in the order work flows through the business.
   date = the record's date field; if it's missing, any other "...Date" field or Added_Time is used. */
export const FLOW = [
  { key: 'quote', report: 'All_Quotations', date: 'Quotation_Date', unit: ['quotation', 'quotations'] },
  { key: 'order', report: 'All_Sales_Orders', date: 'SO_date', unit: ['sales order', 'sales orders'] },
  { key: 'stock', report: 'All_Stock_Transfers', date: 'Transfer_Date', unit: ['stock transfer', 'stock transfers'] },
  { key: 'assign', report: 'Packing_Assignments', date: 'Assignment_Date', unit: ['assignment', 'assignments'] },
  { key: 'weigh', report: 'Daily_Weight_Checking_Report', date: 'Date_field', unit: ['weight check', 'weight checks'] },
  { key: 'pack', report: 'Packages', date: 'Packing_Date', unit: ['packing list', 'packing lists'] },
  { key: 'ship', report: 'All_Shipments', date: 'Shipment_Date', unit: ['shipment', 'shipments'] },
];

// Shown when running outside Zoho Creator (local `npm run dev`)
const SAMPLE_SO_COUNTS = { Draft: 96, Confirmed: 214, Shipped: 132, Cancelled: 38, Completed: 405 };
const SAMPLE_PAYMENTS = {
  months: [182000, 214500, 196800, 238200, 221400, 264900, 226100, 0, 0, 0, 0, 0], // Apr..Mar
  today: { amt: 18400, n: 3 }, week: { amt: 142300, n: 9 },
  month: { amt: 226100, n: 17 }, year: { amt: 1543900, n: 41 },
  status: {
    today: { Received: { amt: 15200, n: 2 }, Pending: { amt: 3200, n: 1 } },
    week: { Received: { amt: 118300, n: 7 }, Pending: { amt: 21000, n: 3 }, Cancelled: { amt: 3000, n: 1 } },
    month: { Received: { amt: 188600, n: 14 }, Pending: { amt: 31500, n: 4 }, Cancelled: { amt: 6000, n: 2 } },
    year: { Received: { amt: 1362400, n: 112 }, Pending: { amt: 146300, n: 18 }, Cancelled: { amt: 35200, n: 6 } },
  },
};

const SAMPLE_INVOICES = {
  stats: { today: { amt: 0, n: 0 }, week: { amt: 128500, n: 4 }, month: { amt: 411400, n: 26 }, year: { amt: 1948400, n: 30 } },
  status: { Draft: 3, Issued: 11, 'Partially Paid': 4, Paid: 9, Cancelled: 3 },
  recent: [ // [id, status, customer, due, amount]
    ['INV-000454', 'Issued', 'Sri Balaji Agencies', '12-Oct-2026', 101300],
    ['INV-000453', 'Partially Paid', 'Kovai Distributors', '10-Oct-2026', 22800],
    ['INV-000452', 'Paid', 'Madurai Cold Chain', '29-Sep-2026', 70700],
    ['INV-000451', 'Draft', 'Nilgiri Traders', '15-Oct-2026', 130500],
    ['INV-000450', 'Cancelled', 'Ocean Foods Pvt Ltd', '09-Oct-2026', 8700],
  ],
};
const SAMPLE_WEEK_REV = [320000, 410000, 255000, 510000, 703000, 610000, 335000];
const SAMPLE_WEEK_ORD = [90, 115, 72, 144, 201, 176, 95];

/* ============ SDK helpers ============ */
const sdk = () => (typeof window !== 'undefined' ? window.ZOHO?.CREATOR : undefined);
export const inZoho = () => !!sdk();

// Wait for the widget SDK to appear (it can load after React mounts); null if it never does
export function waitForSdk(timeout = 6000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    (function check() {
      if (sdk()) return resolve(sdk());
      if (Date.now() - t0 > timeout) return resolve(null);
      setTimeout(check, 100);
    })();
  });
}

let initPromise;
const initSdk = () => (initPromise ??= sdk().init());

// Fetch every record of a report, 200 per page (the SDK maximum).
// Cached per report, so cards that read the same report share one fetch.
const recordCache = new Map();
export function getAllRecords(reportName, criteria = '') {
  const key = `${reportName}|${criteria}`;
  if (!recordCache.has(key)) {
    recordCache.set(key, queued(() => withRetry(() => fetchAllRecords(reportName, criteria), reportName))
      .catch((e) => { recordCache.delete(key); throw e; }));
  }
  return recordCache.get(key);
}

// Creator rejects bursts of parallel API calls, so run at most 2 report fetches at a time
const MAX_PARALLEL = 2; let active = 0; const waiting = [];
function queued(job) {
  return new Promise((resolve, reject) => {
    const run = () => { active += 1; job().then(resolve, reject).finally(() => { active -= 1; waiting.shift()?.(); }); };
    if (active < MAX_PARALLEL) run(); else waiting.push(run);
  });
}

// retry transient failures (rate limits, network); a missing report fails the same way every time
async function withRetry(job, reportName, tries = 3) {
  for (let n = 1; ; n++) {
    try { return await job(); } catch (e) {
      if (n >= tries) { console.error(`${reportName}: failed after ${tries} tries`, e); throw e; }
      await new Promise((r) => setTimeout(r, 700 * n));
    }
  }
}

// Creator answers an empty report / a page past the end with a "no records" error
const isNoRecords = (e) => e?.code === 9280 || e?.responseText?.code === 9280
  || /no\s*records?/i.test(`${e?.message || ''} ${e?.responseText?.message || ''} ${typeof e?.responseText === 'string' ? e.responseText : ''}`);

async function fetchAllRecords(reportName, criteria) {
  await initSdk();
  const out = []; const pageSize = 200;
  for (let page = 1; ; page++) {
    let res;
    try {
      res = await sdk().API.getAllRecords({ appName: APP_NAME, reportName, criteria, page, pageSize });
    } catch (e) {
      if (out.length || isNoRecords(e)) break;
      throw e;
    }
    const rows = res?.data || [];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

/* ============ value helpers ============ */
export const valueOf = (v) => (v && typeof v === 'object' ? v.display_value ?? v.value ?? v.zc_display_value ?? '' : v ?? '');
export const toNumber = (v) => parseFloat(String(valueOf(v)).replace(/[^0-9.-]/g, '')) || 0;

const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
export function toDate(v) {
  const s = String(valueOf(v)).trim().split(' ')[0];
  const p = s.split(/[-/]/);
  if (p.length !== 3) return null;
  let d, m, y;
  if (DATE_FORMAT === 'yyyy-MM-dd') [y, m, d] = p;
  else if (DATE_FORMAT === 'MM/dd/yyyy') [m, d, y] = p;
  else [d, m, y] = p;                                         // dd-MMM-yyyy, dd/MM/yyyy
  const mi = isNaN(m) ? MON[m.slice(0, 3).toLowerCase()] : +m - 1;
  if (mi === undefined) return null;
  const dt = new Date(+y, mi, +d);
  return isNaN(dt) ? null : dt;
}

/* Load a whole report once and reduce it with `compute(records)`.
   Returns { data, loading, error, live }; `sample` is used outside Zoho, `empty` while loading. */
export function useZohoReport(report, compute, sample, empty) {
  const [state, setState] = useState({ data: empty, loading: true, error: null, live: false });
  useEffect(() => {
    let alive = true;
    waitForSdk().then((ok) => {
      if (!alive) return null;
      if (!ok) { setState({ data: sample, loading: false, error: null, live: false }); return null; }
      return getAllRecords(report)
        .then((records) => { if (alive) setState({ data: compute(records), loading: false, error: null, live: true }); })
        .catch((e) => {
          console.error(`${report} fetch failed`, e);
          if (alive) setState((s) => ({ ...s, loading: false, error: e }));
        });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);
  return state;
}

/* ============ Sales Order Status ============
   rows: [[label, count, colourVar], ...] */
const soRows = (counts) => SALES_ORDER.statuses.map(([label, c]) => [label, counts[label] || 0, c]);

export function useSalesOrderStatus() {
  const { data, ...rest } = useZohoReport(SALES_ORDER.report, (records) => {
    const { fields } = SALES_ORDER; const counts = {};
    const known = new Map(SALES_ORDER.statuses.map(([l]) => [l.toLowerCase(), l]));
    records.forEach((r) => {
      if (!valueOf(r[fields.orderNo])) return;                 // skip rows without an order no
      const label = known.get(String(valueOf(r[fields.status])).trim().toLowerCase());
      if (label) counts[label] = (counts[label] || 0) + 1;
    });
    return soRows(counts);
  }, soRows(SAMPLE_SO_COUNTS), soRows({}));
  return { rows: data, ...rest };
}

/* ============ Payments ============
   { months: [Apr..Mar totals for the current FY], today, week, month, year: { amt, n } }
   n = number of distinct customers who paid in that period
   status: { today|week|month|year: { Received: { amt, n }, ... } }  (n = number of payments) */
const EMPTY_PAYMENTS = {
  months: Array(12).fill(0),
  today: { amt: 0, n: 0 }, week: { amt: 0, n: 0 }, month: { amt: 0, n: 0 }, year: { amt: 0, n: 0 },
  status: { today: {}, week: {}, month: {}, year: {} },
};

export function usePayments() {
  return useZohoReport(PAYMENTS.report, (records) => {
    const { fields } = PAYMENTS;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    const fyStart = new Date(fyYear, 3, 1);

    const months = Array(12).fill(0);
    const bucket = () => ({ amt: 0, who: new Set(), st: {} });
    const b = { today: bucket(), week: bucket(), month: bucket(), year: bucket() };
    const known = new Map(PAYMENTS.statuses.map(([l]) => [l.toLowerCase(), l]));
    let st;
    const add = (k, amt, who) => {
      b[k].amt += amt; if (who) b[k].who.add(who);
      if (st) { const x = (b[k].st[st] ??= { amt: 0, n: 0 }); x.amt += amt; x.n += 1; }
    };

    records.forEach((r) => {
      const d = toDate(r[fields.date]);
      if (!d || d < fyStart || d > today) return;               // current FY up to today only
      const amt = toNumber(r[fields.amount]);
      const who = String(valueOf(r[fields.customer])).trim();
      st = known.get(String(valueOf(r[fields.status])).trim().toLowerCase());
      months[(d.getMonth() + 9) % 12] += amt;                  // Apr = 0 ... Mar = 11
      add('year', amt, who);
      if (d >= monthStart) add('month', amt, who);
      if (d >= weekStart) add('week', amt, who);
      if (+d === +today) add('today', amt, who);
    });
    const out = (k) => ({ amt: Math.round(b[k].amt), n: b[k].who.size });
    const status = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.st]));
    return { months: months.map(Math.round), today: out('today'), week: out('week'), month: out('month'), year: out('year'), status };
  }, SAMPLE_PAYMENTS, EMPTY_PAYMENTS);
}

/* ============ Invoices ============
   { stats: { today|week|month|year: { amt, n } }, status: { label: count }, recent: [[id, status, customer, due, amount], ...] }
   Periods and status counts are by invoice date within the current FY (Apr–Mar). */
const EMPTY_INVOICES = {
  stats: { today: { amt: 0, n: 0 }, week: { amt: 0, n: 0 }, month: { amt: 0, n: 0 }, year: { amt: 0, n: 0 } },
  status: {}, recent: [],
};

export function useInvoices() {
  return useZohoReport(INVOICES.report, (records) => {
    const { fields } = INVOICES;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    const fyStart = new Date(fyYear, 3, 1);

    const stats = { today: { amt: 0, n: 0 }, week: { amt: 0, n: 0 }, month: { amt: 0, n: 0 }, year: { amt: 0, n: 0 } };
    const status = {};
    const known = new Map(INVOICES.statuses.map(([l]) => [l.toLowerCase(), l]));
    const add = (k, amt) => { stats[k].amt += amt; stats[k].n += 1; };

    const rows = records.map((r) => {
      const raw = String(valueOf(r[fields.status])).trim();
      return { r, d: toDate(r[fields.date]), amt: toNumber(r[fields.amount]), st: known.get(raw.toLowerCase()) || raw };
    });
    rows.forEach(({ d, amt, st }) => {
      if (!d || d < fyStart || d > today) return;              // current FY up to today only
      add('year', amt);
      status[st] = (status[st] || 0) + 1;
      if (d >= monthStart) add('month', amt);
      if (d >= weekStart) add('week', amt);
      if (+d === +today) add('today', amt);
    });
    Object.values(stats).forEach((x) => { x.amt = Math.round(x.amt); });

    // newest first: invoice date, then record ID
    const recent = rows
      .sort((a, b) => (b.d || 0) - (a.d || 0) || Number(b.r.ID || 0) - Number(a.r.ID || 0))
      .slice(0, INVOICES.recent)
      .map(({ r, amt, st }) => [String(valueOf(r[fields.invoiceNo])), st, String(valueOf(r[fields.customer])), String(valueOf(r[fields.dueDate])), Math.round(amt)]);
    return { stats, status, recent };
  }, SAMPLE_INVOICES, EMPTY_INVOICES);
}

/* ============ Weekly Revenue & Orders ============
   Last 7 days ending today (oldest first).
   { days: [Date x7], rev: [₹ invoiced per day, cancelled excluded], ord: [sales orders per day] } */
const lastWeek = () => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i));
};
const dayIndex = (days, d) => (d ? days.findIndex((x) => +x === +d) : -1);

export function useWeeklyRevenue() {
  const rev = useZohoReport(INVOICES.report, (records) => {
    const { fields } = INVOICES; const days = lastWeek(); const out = Array(7).fill(0);
    records.forEach((r) => {
      if (String(valueOf(r[fields.status])).trim().toLowerCase() === 'cancelled') return;
      const i = dayIndex(days, toDate(r[fields.date]));
      if (i >= 0) out[i] += toNumber(r[fields.amount]);
    });
    return out.map(Math.round);
  }, SAMPLE_WEEK_REV, Array(7).fill(0));

  const ord = useZohoReport(SALES_ORDER.report, (records) => {
    const { fields } = SALES_ORDER; const days = lastWeek(); const out = Array(7).fill(0);
    records.forEach((r) => {
      if (!valueOf(r[fields.orderNo])) return;
      const i = dayIndex(days, toDate(r[fields.date]));
      if (i >= 0) out[i] += 1;
    });
    return out;
  }, SAMPLE_WEEK_ORD, Array(7).fill(0));

  return { data: { days: lastWeek(), rev: rev.data, ord: ord.data }, loading: rev.loading || ord.loading };
}

/* ============ Today's Highlights ============
   { orders, revenue, deliveries, customers } for today */
const countToday = (cfg) => (records) => {
  const now = new Date(); const today = +new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return records.filter((r) => +toDate(r[cfg.fields.date]) === today).length;
};

/* ============ Factory line ============
   Each station keeps the day (midnight ms) of every record, so counts can be taken for
   today / this month / this FY year or any custom [from, to] range.
   Also sales-order fulfilment (Shipped + Completed vs all non-draft, non-cancelled orders)
   and trucks from Daily Dispatches. */
const periodStarts = () => {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fy = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return { today, month: new Date(today.getFullYear(), today.getMonth(), 1), year: new Date(fy, 3, 1) };
};
const dateOf = (r, field) => {
  const own = toDate(r[field]);
  if (own) return own;
  const k = Object.keys(r).find((x) => /date/i.test(x) && toDate(r[x]));
  return k ? toDate(r[k]) : toDate(r.Added_Time);
};
const daysOf = (field) => (records) => records.map((r) => dateOf(r, field)).filter(Boolean).map((d) => +d);

// sample data: `n` events spread over the last ~400 days, denser recently
function sampleDays(n, seed) {
  let s = seed; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const t = periodStarts().today;
  return Array.from({ length: n }, () => +new Date(t.getFullYear(), t.getMonth(), t.getDate() - Math.floor(r() ** 1.6 * 400)));
}
const SAMPLE_FLOW = { quote: 420, order: 600, stock: 190, assign: 360, weigh: 240, pack: 350, ship: 300 };

export function useFactoryFlow(custom) {
  // FLOW is a fixed list, so these hooks are always called in the same order
  const st = FLOW.map((f, i) => useZohoReport(f.report, daysOf(f.date), sampleDays(SAMPLE_FLOW[f.key], 11 + i), [])); // eslint-disable-line react-hooks/rules-of-hooks
  const so = useZohoReport(SALES_ORDER.report, (records) => records.flatMap((r) => {
    const s = String(valueOf(r[SALES_ORDER.fields.status])).trim().toLowerCase();
    const d = dateOf(r, SALES_ORDER.fields.date);
    return !s || s === 'draft' || s === 'cancelled' || !d ? [] : [[+d, s === 'shipped' || s === 'completed']];
  }), sampleDays(560, 7).map((d, i) => [d, i % 10 !== 0]), []);
  const trucks = useZohoReport(DISPATCHES.report, daysOf(DISPATCHES.fields.date), sampleDays(260, 5), []);

  const p = periodStarts(); const t = +p.today;
  const ranges = { today: [t, t], month: [+p.month, t], year: [+p.year, t], custom: custom ? [+custom[0], +custom[1]] : [t, t] };
  const count = (days, keep = () => true) => Object.fromEntries(Object.entries(ranges).map(([k, [a, b]]) => [k, days.filter((x) => { const d = Array.isArray(x) ? x[0] : x; return d >= a && d <= b && keep(x); }).length]));
  return {
    stations: Object.fromEntries(FLOW.map((f, i) => [f.key, { ...st[i], data: count(st[i].data), unit: f.unit, report: f.report }])),
    fulfil: { done: count(so.data, (x) => x[1]), all: count(so.data) },
    trucks: count(trucks.data),
    loading: st.some((x) => x.loading) || so.loading || trucks.loading,
  };
}

export function useTodayHighlights() {
  const wk = useWeeklyRevenue();
  const del = useZohoReport(DISPATCHES.report, countToday(DISPATCHES), 18, 0);
  const cus = useZohoReport(CUSTOMERS.report, countToday(CUSTOMERS), 7, 0);
  return {
    data: { orders: wk.data.ord[6], revenue: wk.data.rev[6], deliveries: del.data, customers: cus.data },
    loading: wk.loading || del.loading || cus.loading,
  };
}

/* ============ multi-report loader ============
   Like useZohoReport, but loads several reports and calls compute(recordsA, recordsB, ...).
   A report that fails to load is passed as null, so the others still show. */
export function useZohoReports(reports, compute, sample, empty) {
  const [state, setState] = useState({ data: empty, loading: true, error: null, live: false });
  const key = reports.join('|');
  useEffect(() => {
    let alive = true;
    waitForSdk().then((ok) => {
      if (!alive) return null;
      if (!ok) { setState({ data: sample, loading: false, error: null, live: false }); return null; }
      return Promise.allSettled(reports.map((r) => getAllRecords(r))).then((res) => {
        if (!alive) return;
        const recs = res.map((x) => (x.status === 'fulfilled' ? x.value : null));
        try {
          setState({ data: compute(...recs), loading: false, error: recs.every((x) => x === null) ? new Error(`${key} failed`) : null, live: true });
        } catch (e) {
          console.error(`${key} compute failed`, e);
          setState((s) => ({ ...s, loading: false, error: e }));
        }
      });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}
const lower = (v) => String(valueOf(v)).trim().toLowerCase();
const DAY = 864e5;

/* ============ Receivables (cash radar) ============
   Worked out from the invoices themselves (payments are not linked to invoices):
   invoiced  = non-draft, non-cancelled invoices dated this FY
   balance   = the invoice's own balance field if it has one (e.g. Balance_Due), else
               0 for Paid and the full total for every other open status
   collected = invoiced - balance of this FY's invoices; rate = collected / invoiced
   aging (every open invoice, by its Due_Date): [not due yet, due today, 1-30, 31-60, 60+ days late] */
const BALANCE_KEY = /^(balance(_due|_amount)?|amount_due|due_amount|outstanding(_amount)?|pending_amount)$/i;
const EMPTY_RECV = { invoiced: 0, collected: 0, outstanding: 0, rate: 0, open: 0, openN: 0, overdue: 0, overdueN: 0, dueToday: 0, dueTodayN: 0, aging: [0, 0, 0, 0, 0], agingN: [0, 0, 0, 0, 0], worst: null };
export function useReceivables() {
  return useZohoReports([INVOICES.report], (invs) => {
    const p = periodStarts(); const F = INVOICES.fields;
    const o = { ...EMPTY_RECV, aging: [0, 0, 0, 0, 0], agingN: [0, 0, 0, 0, 0] };
    const balKey = invs?.length ? Object.keys(invs[0]).find((k) => BALANCE_KEY.test(k)) : undefined;
    let fyBalance = 0;
    (invs || []).forEach((r) => {
      const st = lower(r[F.status]); if (st === 'cancelled' || st === 'draft') return;
      const d = toDate(r[F.date]); const amt = toNumber(r[F.amount]);
      const bal = st === 'paid' ? 0 : Math.max(0, Math.min(amt, balKey ? toNumber(r[balKey]) : amt));
      const inFy = d && d >= p.year && d <= p.today;
      if (inFy) { o.invoiced += amt; fyBalance += bal; }
      if (bal <= 0) return;
      o.open += bal; o.openN += 1;
      const due = toDate(r[F.dueDate]) || d;
      const late = due ? Math.round((p.today - due) / DAY) : -1;
      const b = late < 0 ? 0 : late === 0 ? 1 : late <= 30 ? 2 : late <= 60 ? 3 : 4;
      o.aging[b] += bal; o.agingN[b] += 1;
      if (late === 0) { o.dueToday += bal; o.dueTodayN += 1; }
      if (late > 0) {
        o.overdue += bal; o.overdueN += 1;
        if (!o.worst || late > o.worst.days) o.worst = { days: late, no: String(valueOf(r[F.invoiceNo])), customer: String(valueOf(r[F.customer])), amt: Math.round(bal) };
      }
    });
    o.outstanding = o.open;
    o.collected = Math.max(0, o.invoiced - fyBalance);
    o.rate = o.invoiced ? Math.min(100, (o.collected / o.invoiced) * 100) : 0;
    ['invoiced', 'collected', 'outstanding', 'open', 'overdue', 'dueToday'].forEach((k) => { o[k] = Math.round(o[k]); });
    o.aging = o.aging.map(Math.round);
    return o;
  }, {
    invoiced: 1948400, collected: 1462200, outstanding: 486200, rate: 75, open: 486200, openN: 18, overdue: 195300, overdueN: 7, dueToday: 18400, dueTodayN: 2,
    aging: [272500, 18400, 118400, 56300, 20600], agingN: [9, 2, 3, 2, 2], worst: { days: 74, no: 'INV-000391', customer: 'Ocean Foods Pvt Ltd', amt: 14400 },
  }, EMPTY_RECV);
}

/* ============ Top customers ============
   current FY, from invoices (non-draft, non-cancelled): billed = total, due = unpaid balance
   (same balance rule as the cash radar), paid = billed - due */
export function useTopCustomers(limit = 6) {
  return useZohoReports([INVOICES.report], (invs) => {
    const p = periodStarts(); const F = INVOICES.fields; const m = new Map();
    const balKey = invs?.length ? Object.keys(invs[0]).find((k) => BALANCE_KEY.test(k)) : undefined;
    (invs || []).forEach((r) => {
      const st = lower(r[F.status]); if (st === 'cancelled' || st === 'draft') return;
      const d = toDate(r[F.date]); if (!d || d < p.year || d > p.today) return;
      const name = String(valueOf(r[F.customer])).trim(); if (!name) return;
      const amt = toNumber(r[F.amount]);
      const bal = st === 'paid' ? 0 : Math.max(0, Math.min(amt, balKey ? toNumber(r[balKey]) : amt));
      if (!m.has(name)) m.set(name, { name, billed: 0, due: 0, n: 0 });
      const c = m.get(name); c.billed += amt; c.due += bal; c.n += 1;
    });
    const all = [...m.values()].map((c) => ({ ...c, billed: Math.round(c.billed), due: Math.round(c.due), paid: Math.round(c.billed - c.due) }));
    const sum = (k) => all.reduce((s, c) => s + c[k], 0);
    return { total: sum('billed'), paid: sum('paid'), due: sum('due'), count: all.length, rows: all.sort((a, b) => b.billed - a.billed).slice(0, limit) };
  }, {
    total: 1948400, paid: 1562500, due: 385900, count: 24, rows: [
      { name: 'Sri Balaji Agencies', billed: 412300, paid: 380000, due: 32300, n: 9 }, { name: 'Kovai Distributors', billed: 318900, paid: 240500, due: 78400, n: 7 },
      { name: 'Madurai Cold Chain', billed: 276400, paid: 276400, due: 0, n: 6 }, { name: 'Nilgiri Traders', billed: 198200, paid: 120000, due: 78200, n: 5 },
      { name: 'Ocean Foods Pvt Ltd', billed: 154700, paid: 98300, due: 56400, n: 4 }, { name: 'Metro Retail Hub', billed: 121500, paid: 121500, due: 0, n: 3 },
    ],
  }, { total: 0, paid: 0, due: 0, count: 0, rows: [] });
}

/* ============ Sales funnel ============
   quotations > sales orders > invoices > paid invoices, per period (month / year) */
const zf = () => ({ month: 0, year: 0 });
export function useSalesFunnel() {
  const quote = FLOW.find((f) => f.key === 'quote');
  return useZohoReports([quote.report, SALES_ORDER.report, INVOICES.report], (qs, sos, invs) => {
    const p = periodStarts(); const out = { quote: zf(), order: zf(), invoice: zf(), paid: zf(), value: zf(), paidValue: zf() };
    const add = (k, d, n = 1) => ['month', 'year'].forEach((x) => { if (d && d >= p[x] && d <= p.today) out[k][x] += n; });
    (qs || []).forEach((r) => add('quote', dateOf(r, quote.date)));
    (sos || []).forEach((r) => { if (lower(r[SALES_ORDER.fields.status]) !== 'cancelled' && valueOf(r[SALES_ORDER.fields.orderNo])) add('order', dateOf(r, SALES_ORDER.fields.date)); });
    (invs || []).forEach((r) => {
      const st = lower(r[INVOICES.fields.status]); if (st === 'cancelled' || st === 'draft') return;
      const d = toDate(r[INVOICES.fields.date]); const amt = toNumber(r[INVOICES.fields.amount]);
      add('invoice', d); add('value', d, amt);
      if (st === 'paid') { add('paid', d); add('paidValue', d, amt); }
    });
    ['value', 'paidValue'].forEach((k) => { out[k].month = Math.round(out[k].month); out[k].year = Math.round(out[k].year); });
    out.missing = { quote: qs === null, order: sos === null, invoice: invs === null };
    return out;
  }, {
    quote: { month: 48, year: 342 }, order: { month: 37, year: 270 }, invoice: { month: 31, year: 236 }, paid: { month: 22, year: 189 },
    value: { month: 411400, year: 1948400 }, paidValue: { month: 288000, year: 1543900 }, missing: {},
  }, { quote: zf(), order: zf(), invoice: zf(), paid: zf(), value: zf(), paidValue: zf(), missing: {} });
}

/* ============ Business pulse ============
   activity per calendar day: { days: { 'y-m-d': { so, inv, pay } }, first: Date of the earliest record } */
export const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
function seeded(s) { return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const samplePulse = () => {
  const r = seeded(7); const days = {}; const t = periodStarts().today; let first = t;
  for (let i = 0; i < 150; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i); if (d.getDay() === 0) continue;
    days[dayKey(d)] = { so: Math.floor(r() * 5), inv: Math.floor(r() * 4), pay: Math.floor(r() * 3) }; first = d;
  }
  return { days, first };
};
export function useBusinessPulse() {
  return useZohoReports([SALES_ORDER.report, INVOICES.report, PAYMENTS.report], (sos, invs, pays) => {
    const days = {}; let first = null;
    const put = (d, k) => {
      if (!d) return; const x = (days[dayKey(d)] ??= { so: 0, inv: 0, pay: 0 }); x[k] += 1;
      if (!first || d < first) first = d;
    };
    (sos || []).forEach((r) => put(dateOf(r, SALES_ORDER.fields.date), 'so'));
    (invs || []).forEach((r) => { if (lower(r[INVOICES.fields.status]) !== 'cancelled') put(toDate(r[INVOICES.fields.date]), 'inv'); });
    (pays || []).forEach((r) => put(toDate(r[PAYMENTS.fields.date]), 'pay'));
    return { days, first };
  }, samplePulse(), { days: {}, first: null });
}

/* ============ Master records ============
   total records per master report + how many were added this month (Creator's Added_Time) */
export const MASTERS = [
  { key: 'cust', label: 'Customers', report: 'All_Customers' },
  { key: 'prod', label: 'Products', report: 'All_Products' },
  { key: 'emp', label: 'Employees', report: 'All_Employees' },
  { key: 'vend', label: 'Vendors', report: 'All_Vendors' },
  { key: 'veh', label: 'Vehicles', report: 'All_Vehicles' },
  { key: 'trans', label: 'Transports', report: 'All_Transports' },
];
export function useMasterCounts() {
  return useZohoReports(MASTERS.map((m) => m.report), (...lists) => {
    const p = periodStarts();
    return Object.fromEntries(MASTERS.map((m, i) => {
      const l = lists[i];
      if (!l) return [m.key, null];
      const dated = l.filter((r) => r.Added_Time !== undefined);
      return [m.key, { total: l.length, added: dated.length ? dated.filter((r) => { const d = toDate(r.Added_Time); return d && d >= p.month; }).length : null }];
    }));
  }, {
    cust: { total: 248, added: 7 }, prod: { total: 64, added: 2 }, emp: { total: 78, added: 3 },
    vend: { total: 37, added: 1 }, veh: { total: 22, added: 0 }, trans: { total: 15, added: 1 },
  }, Object.fromEntries(MASTERS.map((m) => [m.key, { total: 0, added: null }])));
}
