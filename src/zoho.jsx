import { useEffect, useState } from 'react';

/* ============ ZOHO CREATOR CONFIG ============
   Change the link names below to match your Creator app.
   Report / field link names are case-sensitive. */
export const APP_NAME = 'mgf-manufacturing';

export const SALES_ORDER = {
  report: 'All_Sales_Orders',
  fields: {
    orderNo: 'Sales_order_no',
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

// Shown when running outside Zoho Creator (local `npm run dev`)
const SAMPLE_SO_COUNTS = { Draft: 96, Confirmed: 214, Shipped: 132, Cancelled: 38, Completed: 405 };

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

// Fetch every record of a report, 200 per page (the SDK maximum)
export async function getAllRecords(reportName, criteria = '') {
  await initSdk();
  const out = []; const pageSize = 200;
  for (let page = 1; ; page++) {
    let res;
    try {
      res = await sdk().API.getAllRecords({ appName: APP_NAME, reportName, criteria, page, pageSize });
    } catch (e) {
      // Creator rejects with "no records" once we page past the end
      if (out.length || e?.code === 9280 || e?.responseText?.code === 9280) break;
      throw e;
    }
    const rows = res?.data || [];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

const valueOf = (v) => (v && typeof v === 'object' ? v.display_value ?? v.value ?? '' : v ?? '');

/* ============ Sales Order Status ============
   Returns { rows: [[label, count, colourVar], ...], loading, error, live } */
export function useSalesOrderStatus() {
  const build = (counts) => SALES_ORDER.statuses.map(([label, c]) => [label, counts[label] || 0, c]);
  const [state, setState] = useState(() => ({ rows: build({}), loading: true, error: null, live: false }));

  useEffect(() => {
    let alive = true;
    const { report, fields } = SALES_ORDER;
    waitForSdk().then((ok) => {
      if (!alive) return null;
      if (!ok) {                                                // not inside Zoho Creator: sample data
        setState({ rows: build(SAMPLE_SO_COUNTS), loading: false, error: null, live: false });
        return null;
      }
      return getAllRecords(report)
      .then((records) => {
        const counts = {};
        const known = new Map(SALES_ORDER.statuses.map(([l]) => [l.toLowerCase(), l]));
        records.forEach((r) => {
          if (!valueOf(r[fields.orderNo])) return;               // skip rows without an order no
          const label = known.get(String(valueOf(r[fields.status])).trim().toLowerCase());
          if (label) counts[label] = (counts[label] || 0) + 1;
        });
        if (alive) setState({ rows: build(counts), loading: false, error: null, live: true });
      })
      .catch((e) => {
        console.error('Sales order fetch failed', e);
        if (alive) setState((s) => ({ ...s, loading: false, error: e }));
      });
    });
    return () => { alive = false; };
  }, []);

  return state;
}
