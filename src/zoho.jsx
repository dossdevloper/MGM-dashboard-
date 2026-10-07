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
  { key: 'assign', report: 'All_Packing_Assignments', date: 'Assignment_Date', unit: ['assignment', 'assignments'] },
  { key: 'weigh', report: 'Daily_Weight_Checking_Report', date: 'Date_field', unit: ['weight check', 'weight checks'] },
  { key: 'pack', report: 'All_Packing_Lists', date: 'Packing_Date', unit: ['packing list', 'packing lists'] },
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
   Counts per period (today / month / FY year) for every FLOW station, plus
   sales-order fulfilment (Shipped + Completed vs all non-draft, non-cancelled orders)
   and trucks from Daily Dispatches. */
const periodStarts = () => {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fy = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return { today, month: new Date(today.getFullYear(), today.getMonth(), 1), year: new Date(fy, 3, 1) };
};
const periodsOf = (d, p) => (!d || d > p.today ? [] : ['today', 'month', 'year'].filter((k) => d >= p[k]));
const dateOf = (r, field) => {
  const own = toDate(r[field]);
  if (own) return own;
  const k = Object.keys(r).find((x) => /date/i.test(x) && toDate(r[x]));
  return k ? toDate(r[k]) : toDate(r.Added_Time);
};
const zeroP = () => ({ today: 0, month: 0, year: 0 });
const countByPeriod = (field) => (records) => {
  const p = periodStarts(); const out = zeroP();
  records.forEach((r) => periodsOf(dateOf(r, field), p).forEach((k) => { out[k] += 1; }));
  return out;
};

const SAMPLE_FLOW = {
  quote: { today: 6, month: 48, year: 342 }, order: { today: 4, month: 37, year: 518 }, stock: { today: 2, month: 21, year: 156 },
  assign: { today: 3, month: 29, year: 301 }, weigh: { today: 5, month: 64, year: 198 }, pack: { today: 3, month: 31, year: 289 },
  ship: { today: 2, month: 26, year: 251 },
};

export function useFactoryFlow() {
  // FLOW is a fixed list, so these hooks are always called in the same order
  const st = FLOW.map((f) => useZohoReport(f.report, countByPeriod(f.date), SAMPLE_FLOW[f.key], zeroP())); // eslint-disable-line react-hooks/rules-of-hooks

  const so = useZohoReport(SALES_ORDER.report, (records) => {
    const p = periodStarts(); const done = zeroP(); const all = zeroP();
    records.forEach((r) => {
      const s = String(valueOf(r[SALES_ORDER.fields.status])).trim().toLowerCase();
      if (!s || s === 'draft' || s === 'cancelled') return;
      periodsOf(dateOf(r, SALES_ORDER.fields.date), p).forEach((k) => {
        all[k] += 1; if (s === 'shipped' || s === 'completed') done[k] += 1;
      });
    });
    return { done, all };
  }, { done: { today: 3, month: 30, year: 437 }, all: { today: 4, month: 34, year: 480 } }, { done: zeroP(), all: zeroP() });

  const trucks = useZohoReport(DISPATCHES.report, countByPeriod(DISPATCHES.fields.date), { today: 6, month: 71, year: 214 }, zeroP());

  return {
    stations: Object.fromEntries(FLOW.map((f, i) => [f.key, { ...st[i], unit: f.unit, report: f.report }])),
    fulfil: so.data, trucks: trucks.data,
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
