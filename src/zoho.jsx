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
    ['Packed', '--w-purple'],
    ['Dispatched', '--w-orange'],
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
// Stock page: stock in = Accepted Quantity on every GRN line item, dated by the GRN date
export const GRN = {
  report: 'GRN1',
  fields: {
    date: 'GRN_Date',              // date field on the GRN
    lines: 'GRN_Line_Items',       // subform
    accepted: 'Accepted_Quantity', // subform field counted as stock in (kg)
    parent: 'GRN',                    // optional: lookup on GRN Details that points to the GRN (auto-detected if blank)
  },
  // report(s) on the GRN Details form (the subform's own form) — the first one that loads is used
  lineReports: ['GRN_Details1', 'GRN_Details_Report', 'GRN_Details'],
};

// Stock page: stock out = invoice line items (quantity + kg), dated by the invoice date
export const STOCK_OUT = {
  report: 'All_Invoices',          // invoices (for the date + status)
  date: 'Invoice_Date',
  status: 'Status',
  skipStatuses: ['Cancelled'],     // invoices with these statuses are not counted
  lineReport: 'All_Invoice_Items', // invoice line items (subform's own report)
  fields: {
    qty: 'Quantity_Cartons',     // quantity field on a line item — blank = auto-detect (Quantity / Qty …)
    kg: 'Weight_Kg',      // weight field on a line item — blank = auto-detect (Kg / Weight …)
    parent: 'Invoice',  // lookup on the line item pointing to the invoice — blank = auto-detect
  },
};

export const DISPATCHES = {
  report: 'DispatchList',
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
  { key: 'weigh', report: 'WeightChecking', date: 'Date_field', unit: ['weight check', 'weight checks'] },
  { key: 'pack', report: 'PackingAssignment', date: 'Packing_Date', unit: ['packing list', 'packing lists'] },
  { key: 'ship', report: 'All_Shipments', date: 'Shipment_Date', unit: ['shipment', 'shipments'] },
];

// Shown when running outside Zoho Creator (local `npm run dev`)
const SAMPLE_SO_COUNTS = { Draft: 96, Confirmed: 214, Packed: 58, Dispatched: 74, Shipped: 132, Cancelled: 38, Completed: 405 };
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
   Also sales-order fulfilment (Dispatched + Shipped + Completed vs all non-draft, non-cancelled orders)
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
    return !s || s === 'draft' || s === 'cancelled' || !d ? [] : [[+d, s === 'dispatched' || s === 'shipped' || s === 'completed']];
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
   Keeps every record's day so any range can be counted (This month / This year / Custom):
   ev = { quote: [dayMs], order: [dayMs], invoice: [[dayMs, amount, paid]] }; use funnelBetween(). */
const EMPTY_EV = { quote: [], order: [], invoice: [] };
const sampleFunnel = () => ({
  quote: sampleDays(420, 51),
  order: sampleDays(330, 52),
  invoice: sampleDays(280, 53).map((d, i) => [d, 6000 + ((i * 7919) % 26000), i % 5 !== 0]),
});
export function useSalesFunnel() {
  const quote = FLOW.find((f) => f.key === 'quote');
  return useZohoReports([quote.report, SALES_ORDER.report, INVOICES.report], (qs, sos, invs) => {
    const ev = { quote: [], order: [], invoice: [] };
    (qs || []).forEach((r) => { const d = dateOf(r, quote.date); if (d) ev.quote.push(+d); });
    (sos || []).forEach((r) => {
      if (lower(r[SALES_ORDER.fields.status]) === 'cancelled' || !valueOf(r[SALES_ORDER.fields.orderNo])) return;
      const d = dateOf(r, SALES_ORDER.fields.date); if (d) ev.order.push(+d);
    });
    (invs || []).forEach((r) => {
      const st = lower(r[INVOICES.fields.status]); if (st === 'cancelled' || st === 'draft') return;
      const d = toDate(r[INVOICES.fields.date]); if (d) ev.invoice.push([+d, toNumber(r[INVOICES.fields.amount]), st === 'paid']);
    });
    return { ev, missing: { quote: qs === null, order: sos === null, invoice: invs === null } };
  }, { ev: sampleFunnel(), missing: {} }, { ev: EMPTY_EV, missing: {} });
}
// funnel counts + invoiced / collected value between two day-starts (inclusive)
export function funnelBetween(ev, from, to) {
  const a = +from; const b = +to; const inR = (d) => d >= a && d <= b;
  const o = { quote: 0, order: 0, invoice: 0, paid: 0, value: 0, paidValue: 0 };
  ev.quote.forEach((d) => { if (inR(d)) o.quote += 1; });
  ev.order.forEach((d) => { if (inR(d)) o.order += 1; });
  ev.invoice.forEach(([d, amt, paid]) => {
    if (!inR(d)) return;
    o.invoice += 1; o.value += amt;
    if (paid) { o.paid += 1; o.paidValue += amt; }
  });
  o.value = Math.round(o.value); o.paidValue = Math.round(o.paidValue);
  return o;
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

/* ============ Stock in (GRN) ============
   data: [[dayMs, acceptedKg], ...] — Accepted_Quantity of every GRN line item, dated by its GRN.
   GRN1 does not expose the GRN_Line_Items subform (neither in the listing nor by ID), so the
   line items are read from the report on their own form (GRN Details). Each line record links
   back to its GRN through a lookup; that link is found by matching GRN record IDs, so the
   lookup's field name doesn't need to be known. If GRN1 ever does return full subform rows,
   those are used directly and the second report isn't read.
   Every line item counts (no date cut-off); `summary` reports how the total was built. */
const grnLines = (r) => { const l = r?.[GRN.fields.lines]; return Array.isArray(l) ? l : []; };
const grnHasQty = (rows) => rows.length > 0 && rows.every((l) => l && GRN.fields.accepted in l);
const grnQty = (rows) => rows.reduce((s, l) => s + toNumber(l?.[GRN.fields.accepted]), 0);

// the GRN a line record belongs to: any field whose value (or value.ID) is a known GRN ID
const parentOf = (row, ids, hint) => {
  const pick = (v) => { const id = String(v && typeof v === 'object' ? v.ID ?? '' : v ?? ''); return ids.has(id) ? id : null; };
  if (hint && row[hint] !== undefined) return pick(row[hint]);
  for (const [k, v] of Object.entries(row)) if (k !== 'ID') { const id = pick(v); if (id) return id; }
  return null;
};

// first line-items report that loads (link names to try, in order)
async function loadLineRecords() {
  for (const name of GRN.lineReports) {
    try { return { name, rows: await getAllRecords(name) }; } catch { /* try the next name */ }
  }
  return null;
}

async function loadStockIn() {
  const records = await getAllRecords(GRN.report);
  const dateById = new Map();
  records.forEach((r) => { const d = toDate(r[GRN.fields.date]); if (r.ID && d) dateById.set(String(r.ID), +d); });
  const summary = { source: GRN.report, lines: 0, total: 0, linked: 0, ownDate: 0, skipped: 0, skippedKg: 0 };

  // 1) GRN1 already carries full subform rows: use them as they are
  if (records.some((r) => grnHasQty(grnLines(r)))) {
    const days = [];
    records.forEach((r) => {
      const q = grnQty(grnLines(r)); const d = dateById.get(String(r.ID));
      summary.lines += grnLines(r).length; summary.total += q;
      if (d) { days.push([d, q]); summary.linked += q; } else { summary.skipped += 1; summary.skippedKg += q; }
    });
    console.info('Stock in summary', summary);
    return { days, summary };
  }

  // 2) read the line items from their own report and date each by its GRN
  const lines = await loadLineRecords();
  if (!lines) {
    console.warn(`Stock in: none of the line-item reports could be read (${GRN.lineReports.join(', ')}). `
      + 'Set GRN.lineReports in zoho.jsx to the link name of the report on the GRN Details form.');
    throw new Error('GRN line items report not found');
  }
  summary.source = lines.name;
  const ids = new Set(dateById.keys()); const days = []; const unlinked = [];
  lines.rows.forEach((row) => {
    const q = toNumber(row[GRN.fields.accepted]);
    summary.lines += 1; summary.total += q;
    const pid = parentOf(row, ids, GRN.fields.parent);
    // no matching GRN (e.g. filtered out of GRN1): fall back to a date on the line itself, then its Added_Time
    const own = pid ? null : toDate(row[GRN.fields.date]) || toDate(row.Added_Time);
    if (pid) { days.push([dateById.get(pid), q]); summary.linked += q; }
    else if (own) { days.push([+own, q]); summary.ownDate += q; unlinked.push(row); }
    else { summary.skipped += 1; summary.skippedKg += q; unlinked.push(row); }
  });
  summary.total = Math.round(summary.total * 100) / 100;
  console.info('Stock in summary', summary);
  if (unlinked.length) {
    console.warn(`Stock in: ${unlinked.length} ${lines.name} rows have no matching ${GRN.report} record`
      + `${summary.skipped ? ` (${summary.skipped} of them have no date and are not counted)` : ''}.`
      + ` Set GRN.fields.parent to the lookup field that points to the GRN.`, { lineFields: Object.keys(unlinked[0]), example: unlinked[0] });
  }
  return { days, summary };
}

// sample (outside Zoho): one GRN a day for 400 days, ~600–1,500 kg each
const sampleStockIn = () => {
  const rnd = seeded(29); const t = periodStarts().today;
  return Array.from({ length: 400 }, (_, i) => [+new Date(t.getFullYear(), t.getMonth(), t.getDate() - i), Math.round((600 + rnd() * 900) / 10) * 10]);
};

export function useStockIn() {
  const [state, setState] = useState({ data: [], summary: null, loading: true, error: null, live: false });
  useEffect(() => {
    let alive = true;
    waitForSdk().then((ok) => {
      if (!alive) return null;
      if (!ok) { const data = sampleStockIn(); setState({ data, summary: { source: 'sample', total: data.reduce((s, [, q]) => s + q, 0) }, loading: false, error: null, live: false }); return null; }
      return loadStockIn()
        .then(({ days, summary }) => { if (alive) setState({ data: days, summary, loading: false, error: null, live: true }); })
        .catch((e) => {
          console.error(`${GRN.report} fetch failed`, e);
          if (alive) setState((s) => ({ ...s, loading: false, error: e }));
        });
    });
    return () => { alive = false; };
  }, []);
  return state;
}

// total of column `i` ([day, qty, kg?]) between two day-starts (inclusive)
export const sumBetween = (days, from, to, i = 1) => days.reduce((s, x) => (x[0] >= +from && x[0] <= +to ? s + (x[i] || 0) : s), 0);

/* ============ Stock out (invoices) ============
   data: [[dayMs, qty, kg], ...] — one entry per invoice line item, dated by its invoice.
   Line items come from their own report; each is linked to its invoice by matching record IDs
   (or STOCK_OUT.fields.parent). Quantity / kg fields are auto-detected unless set in STOCK_OUT. */
const pickField = (rows, set, exact, loose, avoid) => {
  if (set) return set;
  const keys = [...new Set(rows.slice(0, 20).flatMap((r) => Object.keys(r)))];
  return keys.find((k) => exact.test(k)) || keys.find((k) => loose.test(k) && !avoid.test(k)) || '';
};

async function loadStockOut() {
  const [invoices, items] = await Promise.all([getAllRecords(STOCK_OUT.report), getAllRecords(STOCK_OUT.lineReport)]);
  const skip = new Set(STOCK_OUT.skipStatuses.map((s) => s.toLowerCase()));
  const dateById = new Map(); let skippedInv = 0;
  invoices.forEach((r) => {
    if (skip.has(lower(r[STOCK_OUT.status]))) { skippedInv += 1; return; }
    const d = toDate(r[STOCK_OUT.date]);
    if (r.ID && d) dateById.set(String(r.ID), +d);
  });
  const allInv = new Set(invoices.map((r) => String(r.ID)));

  const qtyF = pickField(items, STOCK_OUT.fields.qty, /^(quantity|qty)$/i, /quantity|qty/i, /kg|weight|rate|price|amount|uom|unit/i);
  const kgF = pickField(items, STOCK_OUT.fields.kg, /^(kg|kgs|weight|total_weight|net_weight|weight_kg|weight_in_kg|total_kg|quantity_in_kg)$/i, /kg|weight/i, /rate|price|amount|per/i);
  const summary = { source: STOCK_OUT.lineReport, lines: items.length, qtyField: qtyF, kgField: kgF, qty: 0, kg: 0, counted: 0, cancelled: 0, unlinked: 0 };
  if (!qtyF || !kgF) {
    console.warn(`Stock out: couldn't find the ${!qtyF ? 'quantity' : 'kg'} field on ${STOCK_OUT.lineReport}. `
      + 'Set STOCK_OUT.fields.qty / .kg in zoho.jsx.', { lineFields: Object.keys(items[0] || {}) });
  }

  const days = [];
  items.forEach((row) => {
    const q = qtyF ? toNumber(row[qtyF]) : 0; const w = kgF ? toNumber(row[kgF]) : 0;
    summary.qty += q; summary.kg += w;
    const pid = parentOf(row, allInv, STOCK_OUT.fields.parent);
    if (pid && dateById.has(pid)) { days.push([dateById.get(pid), q, w]); summary.counted += 1; }
    else if (pid) summary.cancelled += 1;            // invoice is cancelled (or has no date)
    else summary.unlinked += 1;
  });
  summary.qty = Math.round(summary.qty * 100) / 100; summary.kg = Math.round(summary.kg * 100) / 100;
  summary.skippedInvoices = skippedInv;
  console.info('Stock out summary', summary);
  if (summary.unlinked) {
    const ex = items.find((row) => !parentOf(row, allInv, STOCK_OUT.fields.parent));
    console.warn(`Stock out: ${summary.unlinked} ${STOCK_OUT.lineReport} rows don't link to any ${STOCK_OUT.report} record. `
      + 'Set STOCK_OUT.fields.parent to the lookup that points to the invoice.', { lineFields: Object.keys(ex || {}), example: ex });
  }
  return { days, summary };
}

// sample (outside Zoho): ~3 invoice lines a day for 400 days
const sampleStockOut = () => {
  const rnd = seeded(41); const t = periodStarts().today; const out = [];
  for (let i = 0; i < 400; i++) {
    const d = +new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
    for (let j = 0; j < 3; j++) { const q = Math.round(20 + rnd() * 60); out.push([d, q, Math.round(q * (8 + rnd() * 6))]); }
  }
  return out;
};

export function useStockOut() {
  const [state, setState] = useState({ data: [], summary: null, loading: true, error: null, live: false });
  useEffect(() => {
    let alive = true;
    waitForSdk().then((ok) => {
      if (!alive) return null;
      if (!ok) {
        const data = sampleStockOut();
        setState({ data, summary: { source: 'sample', qty: data.reduce((s, x) => s + x[1], 0), kg: data.reduce((s, x) => s + x[2], 0) }, loading: false, error: null, live: false });
        return null;
      }
      return loadStockOut()
        .then(({ days, summary }) => { if (alive) setState({ data: days, summary, loading: false, error: null, live: true }); })
        .catch((e) => {
          console.error(`${STOCK_OUT.lineReport} fetch failed`, e);
          if (alive) setState((s) => ({ ...s, loading: false, error: e }));
        });
    });
    return () => { alive = false; };
  }, []);
  return state;
}
