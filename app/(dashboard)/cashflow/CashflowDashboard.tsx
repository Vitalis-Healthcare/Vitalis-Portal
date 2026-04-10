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
function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CashflowDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [defaultWeek, setDefaultWeek] = useState<string>('');
  const [actualWeek, setActualWeek] = useState<string>('');
  const [actualAmount, setActualAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [weekEndDayName, setWeekEndDayName] = useState<string>('Friday');

  async function load() {
    const r = await fetch('/api/cashflow/dashboard?weeks=12', { cache: 'no-store' });
    const j = await r.json();
    setRows(j.rows || []);
    if (j.weekEndDayName) setWeekEndDayName(j.weekEndDayName);
    setDefaultWeek(j.defaultActualWeek || '');
    if (!actualWeek) setActualWeek(j.defaultActualWeek || '');
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function saveActual() {
    if (!actualWeek || !actualAmount) return;
    setSaving(true); setMsg('');
    const r = await fetch('/api/cashflow/actuals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_ending: actualWeek, actual_closing: Number(actualAmount) }),
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
            Twelve weeks of receipts, obligations, and the gap between plan and reality.
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

        {/* Ledger table */}
        <div style={{ fontFamily: serif, fontSize: 11, letterSpacing: '0.14em', color: muted, textTransform: 'uppercase', marginBottom: 8 }}>
          The Ledger
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: serif }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${ink}`, borderTop: `1px solid ${ink}` }}>
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
              return (
                <tr key={r.week_ending} style={{
                  borderBottom: `0.5px solid ${rule}`,
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(232,226,213,0.25)',
                }}>
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
                    {r.variance == null ? '—' : (r.variance >= 0 ? '+' : '') + fmt(r.variance).replace('-', '')}
                  </td>
                </tr>
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
