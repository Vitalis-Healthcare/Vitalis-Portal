'use client';
import { useEffect, useState } from 'react';

type Row = {
  week_ending: string;
  opening: number;
  income: number;
  expense: number;
  net: number;
  projected_closing: number;
  actual_closing: number | null;
  variance: number | null;
};

type Horizon = 12 | 26 | 52;

type LineForecast = {
  id: string;
  label: string | null;
  amount: number;
  status: string;
  matched_actual_id: string | null;
};
type LineActual = {
  id: string;
  description: string | null;
  amount: number;
};
type CategoryBucket = {
  category_id: string | null;
  name: string;
  type: 'receipt' | 'expense' | 'uncategorised';
  projected: number;
  actual: number;
  variance: number;
  forecast_items: LineForecast[];
  actual_items: LineActual[];
};
type Breakdown = {
  week_ending: string;
  week_start: string;
  categories: CategoryBucket[];
};

const cream = '#faf7f2';
const rule = '#e8e2d5';
const ruleStrong = '#d9d1bf';
const ink = '#2a241a';
const muted = '#8a7d5f';
const good = '#3b6d11';
const bad = '#A32D2D';
const serif = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif';

function fmt(n: number | null): string {
  if (n == null) return '—';
  const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? '-$' : '$') + s;
}
function fmtSigned(n: number): string {
  if (n === 0) return '$0';
  const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? '-$' : '+$') + s;
}
function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const HORIZON_LABELS: Record<Horizon, string> = {
  12: '12 weeks',
  26: '26 weeks',
  52: '52 weeks',
};
const SUBTITLES: Record<Horizon, string> = {
  12: 'Twelve weeks of receipts, obligations, and the gap between plan and reality.',
  26: 'Twenty-six weeks of receipts, obligations, and the gap between plan and reality.',
  52: 'Fifty-two weeks of receipts, obligations, and the gap between plan and reality.',
};

export default function CashflowDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [defaultWeek, setDefaultWeek] = useState<string>('');
  const [actualWeek, setActualWeek] = useState<string>('');
  const [actualAmount, setActualAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [weekEndDayName, setWeekEndDayName] = useState<string>('Friday');
  const [horizon, setHorizon] = useState<Horizon>(26);

  // Drill-down state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [breakdownCache, setBreakdownCache] = useState<Map<string, Breakdown>>(new Map());
  const [loadingWeek, setLoadingWeek] = useState<string>('');
  const [breakdownErr, setBreakdownErr] = useState<Map<string, string>>(new Map());

  async function load(h: Horizon = horizon) {
    const r = await fetch(`/api/cashflow/dashboard?weeks=${h}`, { cache: 'no-store' });
    const j = await r.json();
    setRows(j.rows || []);
    if (j.weekEndDayName) setWeekEndDayName(j.weekEndDayName);
    setDefaultWeek(j.defaultActualWeek || '');
    if (!actualWeek) setActualWeek(j.defaultActualWeek || '');
  }
  useEffect(() => { load(horizon); /* eslint-disable-next-line */ }, [horizon]);

  async function toggleWeek(week_ending: string) {
    const next = new Set(expanded);
    if (next.has(week_ending)) {
      next.delete(week_ending);
      setExpanded(next);
      return;
    }
    next.add(week_ending);
    setExpanded(next);
    if (breakdownCache.has(week_ending)) return;
    setLoadingWeek(week_ending);
    try {
      const r = await fetch(`/api/cashflow/dashboard/week/${week_ending}/breakdown`, { cache: 'no-store' });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        const errs = new Map(breakdownErr);
        errs.set(week_ending, j.error || r.statusText);
        setBreakdownErr(errs);
        return;
      }
      const j: Breakdown = await r.json();
      const nextCache = new Map(breakdownCache);
      nextCache.set(week_ending, j);
      setBreakdownCache(nextCache);
    } finally {
      setLoadingWeek('');
    }
  }

  async function saveActual() {
    if (!actualWeek || !actualAmount) return;
    setSaving(true); setMsg('');
    const r = await fetch('/api/cashflow/actuals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_ending: actualWeek, actual_cash: Number(actualAmount) }),
    });
    setSaving(false);
    if (r.ok) { setMsg('Saved.'); setActualAmount(''); await load(); }
    else { const j = await r.json().catch(()=>({})); setMsg('Error: ' + (j.error || r.statusText)); }
  }

  return (
    <div style={{ background: cream, minHeight: '100vh', padding: '40px 32px', color: ink, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Masthead */}
        <div style={{ borderBottom: `0.5px solid ${ruleStrong}`, paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.18em', color: muted, textTransform: 'uppercase' }}>
            Vitalis Healthcare · Cashflow Planner · Volume IV
          </div>
          <div style={{ fontFamily: serif, fontSize: 36, lineHeight: 1.1, marginTop: 6, letterSpacing: '-0.01em' }}>
            The week in cash
          </div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: muted, marginTop: 6 }}>
            {SUBTITLES[horizon]}
          </div>
        </div>

        {/* Actuals entry card */}
        <div style={{ background: '#fff', border: `0.5px solid ${rule}`, borderRadius: 4, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.14em', color: muted, textTransform: 'uppercase', marginBottom: 4 }}>
            {weekEndDayName} reconciliation
          </div>
          <div style={{ fontFamily: serif, fontSize: 20, marginBottom: 14 }}>
            Enter last week's actual closing bank balance
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={actualWeek} onChange={e => setActualWeek(e.target.value)}
              style={{ padding: '8px 10px', border: `0.5px solid ${ruleStrong}`, borderRadius: 3, background: '#fff', fontFamily: serif, fontSize: 14 }}>
              {rows.map(r => (
                <option key={r.week_ending} value={r.week_ending}>
                  Week ending {fmtDate(r.week_ending)} {r.actual_closing != null ? '✓' : ''}
                </option>
              ))}
            </select>
            <input
              type="number" step="0.01" placeholder="$ 0.00"
              value={actualAmount} onChange={e => setActualAmount(e.target.value)}
              style={{ padding: '8px 12px', border: `0.5px solid ${ruleStrong}`, borderRadius: 3, fontFamily: serif, fontSize: 16, width: 180 }}
            />
            <button onClick={saveActual} disabled={saving || !actualAmount}
              style={{ padding: '9px 20px', border: `0.5px solid ${ink}`, background: ink, color: cream, fontFamily: serif, fontSize: 14, letterSpacing: '0.05em', cursor: 'pointer', borderRadius: 3 }}>
              {saving ? 'Saving…' : 'Record'}
            </button>
            {msg && <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: muted }}>{msg}</span>}
          </div>
          {defaultWeek && (
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12, color: muted, marginTop: 10 }}>
              Suggested: week ending {fmtDate(defaultWeek)} — the most recent week without a recorded actual.
            </div>
          )}
        </div>

        {/* Ledger heading + horizon selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.14em', color: muted, textTransform: 'uppercase' }}>
            The Ledger
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12, color: muted }}>
              Look ahead:
            </span>
            {([12, 26, 52] as Horizon[]).map((h, i) => (
              <span key={h} style={{ display: 'flex', alignItems: 'baseline' }}>
                {i > 0 && <span style={{ color: ruleStrong, margin: '0 8px', fontFamily: serif }}>·</span>}
                <button
                  onClick={() => setHorizon(h)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: serif,
                    fontSize: 13,
                    color: horizon === h ? ink : muted,
                    fontStyle: horizon === h ? 'normal' : 'italic',
                    fontWeight: horizon === h ? 600 : 400,
                    borderBottom: horizon === h ? `1px solid ${ink}` : '1px solid transparent',
                  }}
                >
                  {HORIZON_LABELS[h]}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Ledger table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: serif }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${ink}`, borderTop: `1px solid ${ink}` }}>
              <th style={{ width: 28, padding: '10px 4px' }}></th>
              {['Week ending', 'Opening', 'Income', 'Expense', 'Net', 'Projected', 'Actual', 'Variance'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'left' : 'right',
                  padding: '10px 12px',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: muted,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const isPast = r.actual_closing != null;
              const vColor = r.variance == null ? muted : r.variance >= 0 ? good : bad;
              const isOpen = expanded.has(r.week_ending);
              const bd = breakdownCache.get(r.week_ending);
              const bdErr = breakdownErr.get(r.week_ending);
              const stripeBg = idx % 2 === 0 ? 'transparent' : 'rgba(232,226,213,0.25)';
              return (
                <>
                  <tr key={r.week_ending} style={{
                    borderBottom: isOpen ? 'none' : `0.5px solid ${rule}`,
                    background: stripeBg,
                  }}>
                    <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleWeek(r.week_ending)}
                        aria-label={isOpen ? 'Close the week' : 'Open the week'}
                        title={isOpen ? 'Close the week' : 'Open the week'}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: muted,
                          fontFamily: serif,
                          fontSize: 14,
                          width: 18,
                          height: 18,
                          lineHeight: '18px',
                        }}
                      >
                        {isOpen ? '▾' : '▸'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', fontSize: 15 }}>{fmtDate(r.week_ending)}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right' }}>{fmt(r.opening)}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', color: good }}>{fmt(r.income)}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', color: bad }}>{fmt(-r.expense)}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right' }}>{fmt(r.net)}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', color: isPast ? muted : ink, fontStyle: isPast ? 'italic' : 'normal' }}>
                      {fmt(r.projected_closing)}
                    </td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', fontWeight: 500 }}>{fmt(r.actual_closing)}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', color: vColor, fontWeight: r.variance != null ? 500 : 400 }}>
                      {r.variance == null ? '—' : fmtSigned(r.variance)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={r.week_ending + '-bd'} style={{ background: stripeBg, borderBottom: `0.5px solid ${rule}` }}>
                      <td></td>
                      <td colSpan={8} style={{ padding: '4px 12px 24px 12px' }}>
                        <div style={{
                          fontFamily: serif, fontSize: 11, letterSpacing: '0.14em', color: muted,
                          textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
                        }}>
                          Inside the week
                        </div>
                        {loadingWeek === r.week_ending && !bd && (
                          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: muted }}>Opening the books…</div>
                        )}
                        {bdErr && !bd && (
                          <div style={{ fontFamily: serif, fontSize: 13, color: bad }}>Could not open the week: {bdErr}</div>
                        )}
                        {bd && bd.categories.length === 0 && (
                          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: muted }}>
                            Nothing planned, nothing arrived. A quiet week.
                          </div>
                        )}
                        {bd && bd.categories.length > 0 && (
                          <CategoryRollup categories={bd.categories} />
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12, color: muted, marginTop: 20, textAlign: 'center' }}>
          — end of ledger —
        </div>
      </div>
    </div>
  );
}

function CategoryRollup({ categories }: { categories: CategoryBucket[] }) {
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  function toggleCat(key: string) {
    const next = new Set(openCats);
    if (next.has(key)) next.delete(key); else next.add(key);
    setOpenCats(next);
  }

  // Group by type for visual separation
  const groups: Array<{ label: string; type: CategoryBucket['type']; items: CategoryBucket[] }> = [];
  const receipt = categories.filter(c => c.type === 'receipt');
  const expense = categories.filter(c => c.type === 'expense');
  const uncat = categories.filter(c => c.type === 'uncategorised');
  if (receipt.length) groups.push({ label: 'Receipts', type: 'receipt', items: receipt });
  if (expense.length) groups.push({ label: 'Outlays', type: 'expense', items: expense });
  if (uncat.length) groups.push({ label: 'Uncategorised', type: 'uncategorised', items: uncat });

  return (
    <div style={{ borderTop: `0.5px solid ${rule}`, marginTop: 4 }}>
      {groups.map(g => (
        <div key={g.label} style={{ marginTop: 12 }}>
          <div style={{
            fontFamily: serif, fontSize: 10, letterSpacing: '0.14em',
            color: muted, textTransform: 'uppercase', marginBottom: 4,
          }}>
            {g.label}
          </div>
          {g.items.map(c => {
            const key = (c.category_id ?? '__uncat__') + ':' + c.name;
            const isOpen = openCats.has(key);
            const vColor = c.type === 'uncategorised'
              ? muted
              : c.type === 'receipt'
                ? (c.variance >= 0 ? good : bad)
                : (c.variance <= 0 ? good : bad); // for expenses, under-spend is good
            return (
              <div key={key} style={{ borderBottom: `0.5px solid ${rule}` }}>
                <div
                  onClick={() => toggleCat(key)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr 120px 120px 120px',
                    alignItems: 'center',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    fontFamily: serif,
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: muted }}>{isOpen ? '▾' : '▸'}</span>
                  <span>{c.name}</span>
                  <span style={{ textAlign: 'right', color: muted }}>{fmt(c.projected)}</span>
                  <span style={{ textAlign: 'right' }}>{fmt(c.actual)}</span>
                  <span style={{ textAlign: 'right', color: vColor, fontWeight: 500 }}>{fmtSigned(c.variance)}</span>
                </div>
                {isOpen && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 24,
                    padding: '6px 24px 14px 24px',
                  }}>
                    <div>
                      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 11, color: muted, marginBottom: 4 }}>
                        Planned
                      </div>
                      {c.forecast_items.length === 0 && (
                        <div style={{ fontFamily: serif, fontSize: 12, color: muted, fontStyle: 'italic' }}>—</div>
                      )}
                      {c.forecast_items.map(fi => (
                        <div key={fi.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                          fontFamily: serif, fontSize: 13, padding: '3px 0',
                        }}>
                          <span>
                            {fi.label || <span style={{ color: muted, fontStyle: 'italic' }}>Unlabelled</span>}
                            {fi.status === 'matched' && (
                              <span style={{
                                marginLeft: 8, fontSize: 10, padding: '1px 6px',
                                background: '#e8f0d9', color: good, borderRadius: 2,
                                letterSpacing: '0.05em', textTransform: 'uppercase',
                              }}>matched</span>
                            )}
                          </span>
                          <span style={{ color: muted }}>{fmt(fi.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 11, color: muted, marginBottom: 4 }}>
                        Arrived
                      </div>
                      {c.actual_items.length === 0 && (
                        <div style={{ fontFamily: serif, fontSize: 12, color: muted, fontStyle: 'italic' }}>—</div>
                      )}
                      {c.actual_items.map(ai => (
                        <div key={ai.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                          fontFamily: serif, fontSize: 13, padding: '3px 0',
                        }}>
                          <span>{ai.description || <span style={{ color: muted, fontStyle: 'italic' }}>No description</span>}</span>
                          <span>{fmt(ai.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
