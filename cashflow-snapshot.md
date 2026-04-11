# Vitalis Portal — Cashflow Module Snapshot

Generated: 2026-04-10 19:47:02
Repo HEAD: 53c9b70 on main

This is a concatenation of every cashflow-relevant source file.
Upload alongside the handover doc to give the next Claude session
complete codebase context without round-tripping file contents.

---

## `app/(dashboard)/cashflow/page.tsx`

```typescript
import CashflowDashboard from './CashflowDashboard';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <CashflowDashboard />;
}

```

## `app/(dashboard)/cashflow/CashflowDashboard.tsx`

```typescript
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

type Horizon = 6 | 12 | 24;

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

const HORIZON_LABELS: Record<Horizon, string> = {
  6: '6 weeks',
  12: '12 weeks',
  24: '24 weeks',
};

const SUBTITLES: Record<Horizon, string> = {
  6: 'Six weeks of receipts, obligations, and the gap between plan and reality.',
  12: 'Twelve weeks of receipts, obligations, and the gap between plan and reality.',
  24: 'Twenty-four weeks of receipts, obligations, and the gap between plan and reality.',
};

export default function CashflowDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [defaultWeek, setDefaultWeek] = useState<string>('');
  const [actualWeek, setActualWeek] = useState<string>('');
  const [actualAmount, setActualAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [weekEndDayName, setWeekEndDayName] = useState<string>('Friday');
  const [horizon, setHorizon] = useState<Horizon>(12);

  async function load(h: Horizon = horizon) {
    const r = await fetch(`/api/cashflow/dashboard?weeks=${h}`, { cache: 'no-store' });
    const j = await r.json();
    setRows(j.rows || []);
    if (j.weekEndDayName) setWeekEndDayName(j.weekEndDayName);
    setDefaultWeek(j.defaultActualWeek || '');
    if (!actualWeek) setActualWeek(j.defaultActualWeek || '');
  }
  useEffect(() => { load(horizon); /* eslint-disable-next-line */ }, [horizon]);

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
            {([6, 12, 24] as Horizon[]).map((h, i) => (
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

```

## `app/(dashboard)/cashflow/layout.tsx`

```typescript
import { requireCashflowAdmin } from '@/lib/cashflow/auth';
export default async function CashflowLayout({ children }: { children: React.ReactNode }) {
  await requireCashflowAdmin();
  return <>{children}</>;
}

```

## `app/(dashboard)/cashflow/editorial-theme.ts`

```typescript
// Editorial theme tokens — shared across cashflow module
export const cream = '#faf7f2';
export const rule = '#e8e2d5';
export const ruleStrong = '#d9d1bf';
export const ink = '#2a241a';
export const muted = '#8a7d5f';
export const good = '#3b6d11';
export const bad = '#A32D2D';
export const serif = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif';

export const pageShell: React.CSSProperties = {
  background: cream,
  minHeight: '100vh',
  padding: '40px 32px',
  color: ink,
  fontFamily: 'system-ui, sans-serif',
};
export const container: React.CSSProperties = { maxWidth: 1100, margin: '0 auto' };
export const eyebrow: React.CSSProperties = {
  fontFamily: serif, fontSize: 11, letterSpacing: '0.18em', color: muted, textTransform: 'uppercase',
};
export const headline: React.CSSProperties = {
  fontFamily: serif, fontSize: 36, lineHeight: 1.1, marginTop: 6, letterSpacing: '-0.01em',
};
export const subhead: React.CSSProperties = {
  fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: muted, marginTop: 6,
};
export const masthead: React.CSSProperties = {
  borderBottom: `0.5px solid ${ruleStrong}`, paddingBottom: 16, marginBottom: 28,
};
export const card: React.CSSProperties = {
  background: '#fff', border: `0.5px solid ${rule}`, borderRadius: 4, padding: '22px 26px', marginBottom: 28,
};
export const sectionEyebrow: React.CSSProperties = {
  fontFamily: serif, fontSize: 11, letterSpacing: '0.14em', color: muted, textTransform: 'uppercase', marginBottom: 4,
};
export const sectionTitle: React.CSSProperties = { fontFamily: serif, fontSize: 20, marginBottom: 16 };
export const input: React.CSSProperties = {
  padding: '9px 12px', border: `0.5px solid ${ruleStrong}`, borderRadius: 3,
  fontFamily: serif, fontSize: 15, background: '#fff', color: ink, width: '100%', boxSizing: 'border-box',
};
export const select: React.CSSProperties = { ...input, cursor: 'pointer' };
export const primaryBtn: React.CSSProperties = {
  padding: '10px 22px', border: `0.5px solid ${ink}`, background: ink, color: cream,
  fontFamily: serif, fontSize: 14, letterSpacing: '0.05em', cursor: 'pointer', borderRadius: 3,
};
export const ghostBtn: React.CSSProperties = {
  padding: '6px 10px', border: `0.5px solid ${ruleStrong}`, background: 'transparent', color: muted,
  fontFamily: serif, fontSize: 12, cursor: 'pointer', borderRadius: 3,
};
export const label: React.CSSProperties = {
  fontFamily: serif, fontSize: 11, letterSpacing: '0.1em', color: muted, textTransform: 'uppercase',
  display: 'block', marginBottom: 6,
};
export const tableHead: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11, letterSpacing: '0.1em',
  textTransform: 'uppercase', fontWeight: 500, color: muted, fontFamily: serif,
};

```

## `app/(dashboard)/cashflow/category-groups.ts`

```typescript
// Category grouping — canonical mapping from kind → sub-group
// INFLOWS: Income (operational) + Other Inflows (non-operational)
// OUTFLOWS: Expenses (operational) + Other Payments (non-operational)

export type Category = {
  id: string;
  name: string;
  kind: string;
  type: 'receipt' | 'expense';
};

export type SubGroup = 'income' | 'other_inflows' | 'expenses' | 'other_payments';

const INCOME_KINDS = new Set(['medicaid_waiver', 'contract', 'private_pay', 'ltc_insurance']);
const OTHER_INFLOW_KINDS = new Set(['other_receipt', 'cash_injection']);
const EXPENSE_KINDS = new Set(['payroll', 'back_office', 'operating', 'insurance', 'taxes']);
const OTHER_PAYMENT_KINDS = new Set(['loan_repayment', 'owner_draw', 'misc']);

export function subGroupOf(c: Pick<Category, 'kind' | 'type'>): SubGroup {
  if (INCOME_KINDS.has(c.kind)) return 'income';
  if (OTHER_INFLOW_KINDS.has(c.kind)) return 'other_inflows';
  if (EXPENSE_KINDS.has(c.kind)) return 'expenses';
  if (OTHER_PAYMENT_KINDS.has(c.kind)) return 'other_payments';
  // Fallback by type
  return c.type === 'receipt' ? 'other_inflows' : 'other_payments';
}

export const SUB_GROUP_LABELS: Record<SubGroup, string> = {
  income: '── INCOME ──',
  other_inflows: '── OTHER INFLOWS ──',
  expenses: '── EXPENSES ──',
  other_payments: '── OTHER PAYMENTS ──',
};

export const SUB_GROUP_DISPLAY: Record<SubGroup, string> = {
  income: 'Income',
  other_inflows: 'Other Inflows',
  expenses: 'Expenses',
  other_payments: 'Other Payments',
};

export const SUB_GROUP_ORDER: SubGroup[] = ['income', 'other_inflows', 'expenses', 'other_payments'];

export function groupCategories(cats: Category[]): Record<SubGroup, Category[]> {
  const out: Record<SubGroup, Category[]> = {
    income: [], other_inflows: [], expenses: [], other_payments: [],
  };
  for (const c of cats) out[subGroupOf(c)].push(c);
  for (const k of SUB_GROUP_ORDER) out[k].sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// Reusable <select> renderer for forms
export function renderGroupedOptions(grouped: Record<SubGroup, Category[]>) {
  // Called as JSX helper from clients
  return SUB_GROUP_ORDER.flatMap(sg =>
    grouped[sg].length > 0
      ? [{ label: SUB_GROUP_LABELS[sg], categories: grouped[sg] }]
      : []
  );
}

```

## `app/(dashboard)/cashflow/forecast/page.tsx`

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { editorial, editorialColors } from '@/lib/cashflow/editorial-theme'

type ForecastItem = {
  id: string
  category_id: string
  category_name?: string
  category_type?: string // 'receipt' | 'payment' in this schema
  bank_account_id: string | null
  bank_account_code?: string | null
  forecast_date: string
  amount: number
  label: string
  status: 'planned' | 'matched' | 'missed' | 'cancelled'
  rule_id: string | null
}

type WeekGroup = {
  week_ending: string
  items: ForecastItem[]
  subtotal_in: number
  subtotal_out: number
  net: number
}

type Category = { id: string; name: string; type: string }
type BankAccount = { id: string; short_code: string; name: string }

const HORIZONS = [12, 26, 52] as const
type Horizon = typeof HORIZONS[number]

const isReceipt = (t?: string) => t === 'receipt'

const subtitleFor = (h: Horizon) =>
  h === 12 ? 'Twelve weeks of planned cash.' :
  h === 26 ? 'Twenty-six weeks of planned cash.' :
  'Fifty-two weeks of planned cash.'

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

const fmtWeek = (d: string) => {
  const date = new Date(d + 'T00:00:00')
  return `Week ending ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
}

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<Horizon>(26)
  const [groups, setGroups] = useState<WeekGroup[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  const [fDate, setFDate] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [fAmount, setFAmount] = useState('')
  const [fLabel, setFLabel] = useState('')
  const [fAccount, setFAccount] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/cashflow/forecast?horizon=${horizon}`, { cache: 'no-store' })
    const data = await res.json()
    setGroups(data.groups || [])
    setCategories(data.categories || [])
    setAccounts(data.accounts || [])
    setLoading(false)
  }, [horizon])

  useEffect(() => { load() }, [load])

  const addItem = async () => {
    if (!fDate || !fCategory || !fAmount) return
    setSaving(true)
    const res = await fetch('/api/cashflow/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        forecast_date: fDate,
        category_id: fCategory,
        amount: parseFloat(fAmount),
        label: fLabel || null,
        bank_account_id: fAccount || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setFDate(''); setFCategory(''); setFAmount(''); setFLabel(''); setFAccount('')
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Could not enter into the book.')
    }
  }

  const strikeOut = async (id: string) => {
    if (!confirm('Strike this item from the outlook?')) return
    const res = await fetch(`/api/cashflow/forecast/${id}`, { method: 'DELETE' })
    if (res.ok) load()
    else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Could not strike out.')
    }
  }

  return (
    <div style={editorial.page}>
      <div style={editorial.headerBlock}>
        <h1 style={editorial.title}>The outlook</h1>
        <p style={editorial.subtitle}>{subtitleFor(horizon)}</p>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 28, justifyContent: 'flex-end' }}>
        <span style={{ ...editorial.label, marginRight: 12 }}>Look ahead:</span>
        {HORIZONS.map((h, i) => (
          <span key={h} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            <button
              onClick={() => setHorizon(h)}
              style={h === horizon ? editorial.pillActive : editorial.pill}
            >
              {h} weeks
            </button>
            {i < HORIZONS.length - 1 && <span style={{ color: editorialColors.muted, margin: '0 2px' }}>·</span>}
          </span>
        ))}
      </div>

      <div style={editorial.card}>
        <h2 style={{ ...editorial.sectionHead, marginBottom: 16 }}>Enter into the book</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 1fr 160px auto', gap: 14, alignItems: 'end' }}>
          <div>
            <label style={editorial.fieldLabel}>Date</label>
            <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={editorial.input} />
          </div>
          <div>
            <label style={editorial.fieldLabel}>Category</label>
            <select value={fCategory} onChange={e => setFCategory(e.target.value)} style={editorial.input}>
              <option value="">— select —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={editorial.fieldLabel}>Amount</label>
            <input type="number" step="0.01" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0.00" style={editorial.input} />
          </div>
          <div>
            <label style={editorial.fieldLabel}>Label</label>
            <input type="text" value={fLabel} onChange={e => setFLabel(e.target.value)} placeholder="e.g. Maryland Waiver — weekly" style={editorial.input} />
          </div>
          <div>
            <label style={editorial.fieldLabel}>Account</label>
            <select value={fAccount} onChange={e => setFAccount(e.target.value)} style={editorial.input}>
              <option value="">unassigned</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.short_code}</option>)}
            </select>
          </div>
          <button onClick={addItem} disabled={saving || !fDate || !fCategory || !fAmount} style={editorial.primaryBtn}>
            {saving ? 'Entering…' : 'Enter'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={editorial.muted}>Reading the outlook…</p>
      ) : groups.length === 0 ? (
        <div style={{ ...editorial.card, textAlign: 'center', padding: 56 }}>
          <p style={{ ...editorial.sectionHead, marginBottom: 8 }}>The outlook is clear.</p>
          <p style={{ ...editorial.subtitle, margin: 0 }}>Nothing planned yet. Enter the first item above.</p>
        </div>
      ) : (
        groups.map(g => (
          <div key={g.week_ending} style={editorial.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${editorialColors.rule}`, paddingBottom: 12, marginBottom: 14 }}>
              <h3 style={editorial.sectionHead}>{fmtWeek(g.week_ending)}</h3>
              <div style={{ fontFamily: editorialColors.serif, fontSize: 14, color: editorialColors.muted }}>
                <span style={{ color: editorialColors.good, marginRight: 18 }}>in {fmtMoney(g.subtotal_in)}</span>
                <span style={{ color: editorialColors.bad, marginRight: 18 }}>out {fmtMoney(g.subtotal_out)}</span>
                <span style={{ color: editorialColors.ink }}>net {fmtMoney(g.net)}</span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: editorialColors.serif }}>
              <tbody>
                {g.items.map(it => {
                  const receipt = isReceipt(it.category_type)
                  return (
                    <tr key={it.id} style={{ borderBottom: `1px solid ${editorialColors.rule}` }}>
                      <td style={{ padding: '12px 8px', width: 130, color: editorialColors.muted }}>{fmtDate(it.forecast_date)}</td>
                      <td style={{ padding: '12px 8px', color: editorialColors.ink }}>{it.label || <em style={{ color: editorialColors.muted }}>(no label)</em>}</td>
                      <td style={{ padding: '12px 8px' }}><span style={editorial.chip}>{it.category_name}</span></td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={it.bank_account_code ? editorial.chip : editorial.chipMuted}>
                          {it.bank_account_code || 'unassigned'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: receipt ? editorialColors.good : editorialColors.bad }}>
                        {receipt ? '+' : '−'}{fmtMoney(Math.abs(it.amount))}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', width: 100 }}>
                        <button onClick={() => strikeOut(it.id)} style={editorial.linkBtn}>Strike out</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}

```

## `app/(dashboard)/cashflow/transactions/page.tsx`

```typescript
import { createServiceClient } from '@/lib/supabase/service';
import TransactionsClient from './TransactionsClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const supabase = createServiceClient();
  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from('cf_categories').select('*').order('kind').order('name'),
    supabase.from('cf_transactions').select('*, cf_categories(name,kind)').is('deleted_at', null).order('txn_date', { ascending: false }).limit(100),
  ]);
  return <TransactionsClient categories={categories || []} initialTransactions={transactions || []} />;
}

```

## `app/(dashboard)/cashflow/transactions/TransactionsClient.tsx`

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as T from '../editorial-theme';
import { groupCategories, renderGroupedOptions, SUB_GROUP_LABELS } from '../category-groups';

type Category = { id: string; name: string; kind: string; type: 'receipt' | 'expense' };
type Txn = {
  id: string; txn_date: string; category_id: string; amount: number;
  description: string | null; reference: string | null;
  cf_categories?: { name: string; kind: string; type: 'receipt' | 'expense' | null } | null;
};

export default function TransactionsClient({
  categories, initialTransactions,
}: { categories: Category[]; initialTransactions: Txn[] }) {
  const router = useRouter();
  const [txns, setTxns] = useState<Txn[]>(initialTransactions);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    txn_date: new Date().toISOString().slice(0, 10),
    category_id: categories[0]?.id || '',
    amount: '', description: '', reference: '',
  });

  const grouped = groupCategories(categories as any);
  const groups = renderGroupedOptions(grouped);

  const submit = async () => {
    if (!form.category_id || !form.amount) { toast.error('Category and amount required'); return; }
    setSaving(true);
    const res = await fetch('/api/cashflow/transactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('Failed to save'); return; }
    const created = await res.json();
    setTxns([created, ...txns]);
    setForm({ ...form, amount: '', description: '', reference: '' });
    toast.success('Transaction recorded');
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    const res = await fetch(`/api/cashflow/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Delete failed'); return; }
    setTxns(txns.filter(t => t.id !== id));
    toast.success('Deleted');
    router.refresh();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={T.pageShell}>
      <div style={T.container}>
        <div style={T.masthead}>
          <div style={T.eyebrow}>Vitalis Healthcare · Cashflow Planner · Volume IV</div>
          <div style={T.headline}>The daybook</div>
          <div style={T.subhead}>Every dollar in, every dollar out — recorded as it happens.</div>
        </div>

        <div style={T.card}>
          <div style={T.sectionEyebrow}>New entry</div>
          <div style={T.sectionTitle}>Record a transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px', gap: 12, marginBottom: 12 }}>
            <div><label style={T.label}>Date</label>
              <input type="date" value={form.txn_date} onChange={e => setForm({ ...form, txn_date: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={T.select}>
                {groups.map(g => (<optgroup key={g.label} label={g.label}>{g.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>))}
              </select></div>
            <div><label style={T.label}>Amount</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={T.input} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={T.label}>Description</label>
              <input type="text" placeholder="What was this for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Reference</label>
              <input type="text" placeholder="Check #, invoice #, …" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} style={T.input} /></div>
          </div>
          <button onClick={submit} disabled={saving || !form.amount} style={T.primaryBtn}>
            {saving ? 'Recording…' : 'Record transaction'}
          </button>
        </div>

        <div style={T.sectionEyebrow}>The Daybook</div>
        {txns.length === 0 ? (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, padding: 40, textAlign: 'center' }}>
            No entries yet — the ledger awaits its first mark.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.serif }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.ink}`, borderTop: `1px solid ${T.ink}` }}>
                <th style={T.tableHead}>Date</th>
                <th style={T.tableHead}>Category</th>
                <th style={T.tableHead}>Description</th>
                <th style={{ ...T.tableHead, textAlign: 'right' }}>Amount</th>
                <th style={T.tableHead}></th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t, idx) => {
                const isIncome = t.cf_categories?.type === 'receipt';
                return (
                  <tr key={t.id} style={{
                    borderBottom: `0.5px solid ${T.rule}`,
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(232,226,213,0.25)',
                  }}>
                    <td style={{ padding: '12px', fontSize: 14 }}>{fmtDate(t.txn_date)}</td>
                    <td style={{ padding: '12px', fontSize: 14 }}>{t.cf_categories?.name || '—'}</td>
                    <td style={{ padding: '12px', fontSize: 14, fontStyle: t.description ? 'normal' : 'italic', color: t.description ? T.ink : T.muted }}>
                      {t.description || '—'}
                    </td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', fontWeight: 500, color: isIncome ? T.good : T.bad }}>
                      {isIncome ? '+' : '−'}{fmt(Math.abs(t.amount))}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => remove(t.id)} style={T.ghostBtn} aria-label="Delete">Strike out</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

```

## `app/(dashboard)/cashflow/rules/page.tsx`

```typescript
import { createServiceClient } from '@/lib/supabase/service';
import RulesClient from './RulesClient';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const supabase = createServiceClient();
  const [{ data: categories }, { data: rules }] = await Promise.all([
    supabase.from('cf_categories').select('*').order('kind').order('sort_order'),
    supabase.from('cf_recurring_rules').select('*, cf_categories(name,kind)').order('created_at', { ascending: false }),
  ]);
  return <RulesClient categories={categories || []} initialRules={rules || []} />;
}

```

## `app/(dashboard)/cashflow/rules/RulesClient.tsx`

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as T from '../editorial-theme';
import { groupCategories, renderGroupedOptions, SUB_GROUP_LABELS } from '../category-groups';

type Category = { id: string; name: string; kind: string; type: 'receipt' | 'expense' };
type Rule = any;
const FREQS = ['weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annual', 'one_time'];

export default function RulesClient({ categories, initialRules }: { categories: Category[]; initialRules: Rule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category_id: categories[0]?.id || '',
    label: '', amount: '', frequency: 'monthly',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '', day_of_month: '', active: true,
  });

  const grouped = groupCategories(categories as any);
  const groups = renderGroupedOptions(grouped);

  const submit = async () => {
    if (!form.category_id || !form.label || !form.amount) { toast.error('Category, label, amount required'); return; }
    setSaving(true);
    const payload: any = {
      ...form, amount: parseFloat(form.amount),
      end_date: form.end_date || null,
      day_of_month: form.day_of_month ? parseInt(form.day_of_month) : null,
    };
    const res = await fetch('/api/cashflow/rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { toast.error('Save failed'); return; }
    const created = await res.json();
    setRules([created, ...rules]);
    setForm({ ...form, label: '', amount: '' });
    toast.success('Rule added');
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    const res = await fetch(`/api/cashflow/rules/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Delete failed'); return; }
    setRules(rules.filter(r => r.id !== id));
    toast.success('Deleted');
    router.refresh();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div style={T.pageShell}>
      <div style={T.container}>
        <div style={T.masthead}>
          <div style={T.eyebrow}>Vitalis Healthcare · Cashflow Planner · Volume IV</div>
          <div style={T.headline}>Standing orders</div>
          <div style={T.subhead}>The rhythms of income and obligation — payroll, rent, Medicaid, the predictable tide.</div>
        </div>

        <div style={T.card}>
          <div style={T.sectionEyebrow}>New rule</div>
          <div style={T.sectionTitle}>Define a recurring transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 12, marginBottom: 12 }}>
            <div><label style={T.label}>Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={T.select}>
                {groups.map(g => (<optgroup key={g.label} label={g.label}>{g.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>))}
              </select></div>
            <div><label style={T.label}>Label</label>
              <input type="text" placeholder="e.g. Office rent" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Amount</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={T.input} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={T.label}>Frequency</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={T.select}>
                {FREQS.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
              </select></div>
            <div><label style={T.label}>Starts</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Ends (optional)</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={T.input} /></div>
            <div><label style={T.label}>Day of month</label>
              <input type="number" placeholder="e.g. 15" value={form.day_of_month} onChange={e => setForm({ ...form, day_of_month: e.target.value })} style={T.input} /></div>
          </div>
          <button onClick={submit} disabled={saving} style={T.primaryBtn}>{saving ? 'Adding…' : 'Enter into the book'}</button>
        </div>

        <div style={T.sectionEyebrow}>Active rules</div>
        {rules.length === 0 ? (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, padding: 40, textAlign: 'center' }}>
            No standing orders yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.serif }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.ink}`, borderTop: `1px solid ${T.ink}` }}>
                <th style={T.tableHead}>Label</th>
                <th style={T.tableHead}>Category</th>
                <th style={T.tableHead}>Cadence</th>
                <th style={{ ...T.tableHead, textAlign: 'right' }}>Amount</th>
                <th style={T.tableHead}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r: any, idx: number) => {
                const isIncome = r.cf_categories?.type === 'receipt';
                return (
                  <tr key={r.id} style={{
                    borderBottom: `0.5px solid ${T.rule}`,
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(232,226,213,0.25)',
                  }}>
                    <td style={{ padding: '12px', fontSize: 15, fontWeight: 500 }}>{r.label}</td>
                    <td style={{ padding: '12px', fontSize: 14, color: T.muted }}>{r.cf_categories?.name || '—'}</td>
                    <td style={{ padding: '12px', fontSize: 13, fontStyle: 'italic', color: T.muted }}>{String(r.frequency).replace('_', ' ')}</td>
                    <td style={{ padding: '12px', fontSize: 15, textAlign: 'right', fontWeight: 500, color: isIncome ? T.good : T.bad }}>
                      {isIncome ? '+' : '−'}{fmt(Math.abs(r.amount))}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => remove(r.id)} style={T.ghostBtn}>Retire</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

```

## `app/(dashboard)/cashflow/settings/page.tsx`

```typescript
import { createServiceClient } from '@/lib/supabase/service';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createServiceClient();
  const [{ data: settings }, { data: categories }] = await Promise.all([
    supabase.from('cf_settings').select('*').maybeSingle(),
    supabase.from('cf_categories').select('id, name, kind, type').order('type').order('kind').order('name'),
  ]);
  return <SettingsClient initial={settings} initialCategories={categories || []} />;
}

```

## `app/(dashboard)/cashflow/settings/CategoriesManager.tsx`

```typescript
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import * as T from '../editorial-theme';
import {
  Category, SubGroup, SUB_GROUP_ORDER, SUB_GROUP_DISPLAY,
  groupCategories, subGroupOf,
} from '../category-groups';

// Reverse mapping: when adding a new category under a sub-group,
// what default (kind, type) should we use? These become editable later.
const DEFAULT_KIND_FOR_SUBGROUP: Record<SubGroup, { kind: string; type: 'receipt' | 'expense' }> = {
  income: { kind: 'contract', type: 'receipt' },
  other_inflows: { kind: 'other_receipt', type: 'receipt' },
  expenses: { kind: 'operating', type: 'expense' },
  other_payments: { kind: 'misc', type: 'expense' },
};

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const [cats, setCats] = useState<Category[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [addingIn, setAddingIn] = useState<SubGroup | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const grouped = groupCategories(cats);

  const addCategory = async (sg: SubGroup) => {
    if (!newName.trim()) return;
    setBusy(true);
    const defaults = DEFAULT_KIND_FOR_SUBGROUP[sg];
    const res = await fetch('/api/cashflow/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), kind: defaults.kind, type: defaults.type }),
    });
    setBusy(false);
    if (!res.ok) { toast.error('Add failed'); return; }
    const { category } = await res.json();
    setCats([...cats, category]);
    setNewName(''); setAddingIn(null);
    toast.success('Category added');
  };

  const renameCategory = async (id: string) => {
    if (!editName.trim()) { setEditingId(null); return; }
    setBusy(true);
    const res = await fetch(`/api/cashflow/categories/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setBusy(false);
    if (!res.ok) { toast.error('Rename failed'); return; }
    const { category } = await res.json();
    setCats(cats.map(c => c.id === id ? category : c));
    setEditingId(null);
    toast.success('Renamed');
  };

  const removeCategory = async (id: string, name: string) => {
    if (!confirm(`Retire "${name}"?`)) return;
    setBusy(true);
    const res = await fetch(`/api/cashflow/categories/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || 'Delete failed');
      return;
    }
    setCats(cats.filter(c => c.id !== id));
    toast.success('Retired');
  };

  return (
    <div style={T.card}>
      <div style={T.sectionEyebrow}>Chart of accounts</div>
      <div style={T.sectionTitle}>Categories, grouped by nature</div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 20 }}>
        Inflows are money coming in. Outflows are money going out. Add, rename, or retire categories freely — a category in use by existing transactions cannot be retired until you reassign them.
      </div>

      {SUB_GROUP_ORDER.map(sg => {
        const parent = (sg === 'income' || sg === 'other_inflows') ? 'INFLOWS' : 'OUTFLOWS';
        const showParentHeader = sg === 'income' || sg === 'expenses';
        return (
          <div key={sg}>
            {showParentHeader && (
              <div style={{
                fontFamily: T.serif, fontSize: 11, letterSpacing: '0.2em',
                color: T.ink, textTransform: 'uppercase',
                marginTop: sg === 'expenses' ? 28 : 8, marginBottom: 10,
                paddingBottom: 6, borderBottom: `1px solid ${T.ink}`,
              }}>
                {parent}
              </div>
            )}
            <div style={{
              fontFamily: T.serif, fontSize: 13, letterSpacing: '0.08em',
              color: T.muted, textTransform: 'uppercase', marginTop: 14, marginBottom: 8,
            }}>
              {SUB_GROUP_DISPLAY[sg]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {grouped[sg].map(c => (
                <div key={c.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: `0.5px solid ${T.ruleStrong}`, borderRadius: 3,
                  padding: '6px 10px', background: '#fff',
                  fontFamily: T.serif, fontSize: 14,
                }}>
                  {editingId === c.id ? (
                    <>
                      <input
                        autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') renameCategory(c.id); if (e.key === 'Escape') setEditingId(null); }}
                        style={{ ...T.input, padding: '3px 6px', fontSize: 14, width: 200 }}
                      />
                      <button onClick={() => renameCategory(c.id)} disabled={busy} style={{ ...T.ghostBtn, padding: '3px 8px' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ ...T.ghostBtn, padding: '3px 8px' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span>{c.name}</span>
                      <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} style={{ ...T.ghostBtn, padding: '2px 6px', fontSize: 11 }}>Rename</button>
                      <button onClick={() => removeCategory(c.id, c.name)} style={{ ...T.ghostBtn, padding: '2px 6px', fontSize: 11 }}>Retire</button>
                    </>
                  )}
                </div>
              ))}
              {addingIn === sg ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addCategory(sg); if (e.key === 'Escape') { setAddingIn(null); setNewName(''); } }}
                    placeholder="New category name" style={{ ...T.input, padding: '6px 10px', width: 220, fontSize: 14 }}
                  />
                  <button onClick={() => addCategory(sg)} disabled={busy || !newName.trim()} style={{ ...T.ghostBtn, padding: '5px 10px' }}>Add</button>
                  <button onClick={() => { setAddingIn(null); setNewName(''); }} style={{ ...T.ghostBtn, padding: '5px 10px' }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setAddingIn(sg)} style={{
                  ...T.ghostBtn, padding: '6px 10px', fontStyle: 'italic',
                  borderStyle: 'dashed',
                }}>+ Add to {SUB_GROUP_DISPLAY[sg]}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

```

## `app/api/cashflow/dashboard/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

function weekEndDow(startDow: number): number {
  return (startDow + 6) % 7;
}
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function weekEndingOf(d: Date, endDow: number): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = (endDow - day + 7) % 7;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
function iso(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawWeeks = parseInt(url.searchParams.get('weeks') || '12', 10);
  const weeks = [6, 12, 24].includes(rawWeeks) ? rawWeeks : 12;
  const sb = createServiceClient();

  const { data: settings } = await sb
    .from('cf_settings')
    .select('opening_cash, opening_date, week_start_dow')
    .limit(1)
    .single();

  const seedOpening = Number(settings?.opening_cash ?? 0);
  const startDow = settings?.week_start_dow ?? 6;
  const endDow = weekEndDow(startDow);
  const endDayName = DAY_NAMES[endDow];

  const today = new Date();
  const currentWeekEnd = weekEndingOf(today, endDow);

  let startAnchor = currentWeekEnd;
  if (settings?.opening_date) {
    const od = new Date(settings.opening_date + 'T00:00:00');
    const openingWeekEnd = weekEndingOf(od, endDow);
    if (openingWeekEnd > currentWeekEnd) {
      startAnchor = openingWeekEnd;
    }
  }

  const start = startAnchor;
  const end = addDays(start, 7 * (weeks - 1));
  const weekWindowStart = addDays(start, -6);

  // PROJECTIONS — from cf_forecast_items
  const { data: forecasts, error: fErr } = await sb
    .from('cf_forecast_items')
    .select('forecast_date, amount, cf_categories(type)')
    .neq('status', 'cancelled')
    .gte('forecast_date', iso(weekWindowStart))
    .lte('forecast_date', iso(end));

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  // ACTUALS — from cf_transactions (signed by category type)
  const { data: txns, error: tErr } = await sb
    .from('cf_transactions')
    .select('txn_date, amount, cf_categories(type)')
    .is('deleted_at', null)
    .gte('txn_date', iso(weekWindowStart))
    .lte('txn_date', iso(end));

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // BANK BALANCE ANCHORS — cf_weekly_actuals ground truth
  const { data: actuals } = await sb
    .from('cf_weekly_actuals')
    .select('week_ending, actual_cash')
    .gte('week_ending', iso(start))
    .lte('week_ending', iso(end));

  const actualByWeek = new Map<string, number>();
  (actuals ?? []).forEach(a => {
    if (a.actual_cash != null) actualByWeek.set(a.week_ending, Number(a.actual_cash));
  });

  const rows: Array<{
    week_ending: string;
    opening: number;
    income: number;
    expense: number;
    net: number;
    projected_closing: number;
    actual_closing: number | null;
    variance: number | null;
  }> = [];

  let rollingOpening = seedOpening;

  for (let i = 0; i < weeks; i++) {
    const we = addDays(start, 7 * i);
    const weStr = iso(we);
    const weekStart = addDays(we, -6);

    // Projections from forecast items
    let income = 0, expense = 0;
    (forecasts ?? []).forEach((f: any) => {
      const d = new Date(f.forecast_date + 'T00:00:00');
      if (d >= weekStart && d <= we) {
        const amt = Math.abs(Number(f.amount));
        const type = f.cf_categories?.type;
        if (type === 'receipt') income += amt;
        else if (type === 'expense') expense += amt;
      }
    });

    const net = income - expense;
    const projected_closing = rollingOpening + net;

    // Signed txn sum for this week (for synthetic actual fallback)
    let txnNet = 0;
    let hasTxns = false;
    (txns ?? []).forEach((t: any) => {
      const d = new Date(t.txn_date + 'T00:00:00');
      if (d >= weekStart && d <= we) {
        hasTxns = true;
        const amt = Math.abs(Number(t.amount));
        const type = t.cf_categories?.type;
        if (type === 'receipt') txnNet += amt;
        else if (type === 'expense') txnNet -= amt;
      }
    });

    // Actual closing: (a) bank anchor wins, (b) else synthesize from txns, (c) else null
    let actual_closing: number | null;
    if (actualByWeek.has(weStr)) {
      actual_closing = actualByWeek.get(weStr)!;
    } else if (hasTxns) {
      actual_closing = rollingOpening + txnNet;
    } else {
      actual_closing = null;
    }

    const variance = actual_closing != null ? actual_closing - projected_closing : null;

    rows.push({
      week_ending: weStr,
      opening: rollingOpening,
      income, expense, net,
      projected_closing,
      actual_closing,
      variance,
    });

    rollingOpening = actual_closing != null ? actual_closing : projected_closing;
  }

  const todayIso = iso(today);
  const defaultActualWeek =
    rows.filter(r => r.week_ending <= todayIso && !actualByWeek.has(r.week_ending))
        .map(r => r.week_ending)
        .pop() || iso(currentWeekEnd);

  return NextResponse.json({
    rows,
    defaultActualWeek,
    weekEndDayName: endDayName,
    openingCash: seedOpening,
    horizonWeeks: weeks,
  });
}

```

## `app/api/cashflow/forecast/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

function weekEndingFor(dateStr: string): string {
  // Saturday-ending week to match existing cashflow convention
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay() // 0=Sun..6=Sat
  const daysToSat = (6 - dow + 7) % 7
  d.setDate(d.getDate() + daysToSat)
  return d.toISOString().slice(0, 10)
}

const isReceipt = (t?: string | null) => t === 'receipt'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const horizonRaw = req.nextUrl.searchParams.get('horizon') || '26'
  const horizon = [12, 26, 52].includes(parseInt(horizonRaw)) ? parseInt(horizonRaw) : 26

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizonEnd = new Date(today)
  horizonEnd.setDate(horizonEnd.getDate() + horizon * 7)

  const { data: items, error } = await supabase
    .from('cf_forecast_items')
    .select(`
      id, category_id, bank_account_id, forecast_date, amount, label, status, rule_id,
      cf_categories ( name, type ),
      cf_bank_accounts ( short_code )
    `)
    .gte('forecast_date', today.toISOString().slice(0, 10))
    .lte('forecast_date', horizonEnd.toISOString().slice(0, 10))
    .neq('status', 'cancelled')
    .order('forecast_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: categories } = await supabase
    .from('cf_categories')
    .select('id, name, type')
    .order('name')

  const { data: accounts } = await supabase
    .from('cf_bank_accounts')
    .select('id, short_code, name')
    .eq('is_active', true)
    .neq('short_code', 'LEGACY')
    .order('sort_order')

  const groupMap = new Map<string, any>()
  for (const it of items || []) {
    const cat = (it as any).cf_categories
    const acct = (it as any).cf_bank_accounts
    const wk = weekEndingFor(it.forecast_date)
    if (!groupMap.has(wk)) {
      groupMap.set(wk, { week_ending: wk, items: [], subtotal_in: 0, subtotal_out: 0, net: 0 })
    }
    const g = groupMap.get(wk)
    const amt = Math.abs(Number(it.amount))
    const flat = {
      id: it.id,
      category_id: it.category_id,
      category_name: cat?.name,
      category_type: cat?.type, // 'receipt' or 'payment'
      bank_account_id: it.bank_account_id,
      bank_account_code: acct?.short_code || null,
      forecast_date: it.forecast_date,
      amount: amt,
      label: it.label,
      status: it.status,
      rule_id: it.rule_id,
    }
    g.items.push(flat)
    if (isReceipt(cat?.type)) {
      g.subtotal_in += amt
      g.net += amt
    } else {
      g.subtotal_out += amt
      g.net -= amt
    }
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => a.week_ending.localeCompare(b.week_ending))

  return NextResponse.json({ groups, categories: categories || [], accounts: accounts || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { forecast_date, category_id, amount, label, bank_account_id } = body

  if (!forecast_date || !category_id || amount == null) {
    return NextResponse.json({ error: 'forecast_date, category_id, and amount are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cf_forecast_items')
    .insert({
      forecast_date,
      category_id,
      amount: Math.abs(Number(amount)),
      label: label || null,
      bank_account_id: bank_account_id || null,
      rule_id: null,
      status: 'planned',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

```

## `app/api/cashflow/forecast/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const body = await req.json()

  const patch: any = {}
  if (body.forecast_date !== undefined) patch.forecast_date = body.forecast_date
  if (body.category_id !== undefined) patch.category_id = body.category_id
  if (body.amount !== undefined) patch.amount = Math.abs(Number(body.amount))
  if (body.label !== undefined) patch.label = body.label || null
  if (body.bank_account_id !== undefined) patch.bank_account_id = body.bank_account_id || null

  const { data, error } = await supabase
    .from('cf_forecast_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('cf_forecast_items')
    .select('status, matched_actual_id')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing.status === 'matched') {
    return NextResponse.json(
      { error: 'Cannot strike out a matched item. Unmatch it from the actual first.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('cf_forecast_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

```

## `app/api/cashflow/categories/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_categories')
    .select('id, name, kind, type')
    .order('type').order('kind').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

// POST { name, kind, type }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  const kind = String(body.kind || '').trim();
  const type = String(body.type || '').trim();
  if (!name || !kind || !type) {
    return NextResponse.json({ error: 'name, kind, type required' }, { status: 400 });
  }
  if (type !== 'receipt' && type !== 'expense') {
    return NextResponse.json({ error: 'type must be receipt or expense' }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_categories')
    .insert({ name, kind, type })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

```

## `app/api/cashflow/actuals/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// GET /api/cashflow/actuals  -> list all weekly actuals (most recent first)
export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_weekly_actuals')
    .select('*')
    .order('week_ending', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actuals: data ?? [] });
}

// POST /api/cashflow/actuals  { week_ending: 'YYYY-MM-DD', actual_cash: number }
// Upsert by week_ending — re-entering overwrites.
//
// Back-compat: accept legacy `actual_closing` field from any cached client
// bundle until all users have reloaded.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const week_ending = String(body.week_ending || '');
  const rawAmount = body.actual_cash ?? body.actual_closing;
  const actual_cash = Number(rawAmount);
  if (!week_ending || !isFinite(actual_cash)) {
    return NextResponse.json({ error: 'week_ending and actual_cash required' }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_weekly_actuals')
    .upsert(
      { week_ending, actual_cash, entered_at: new Date().toISOString() },
      { onConflict: 'week_ending' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actual: data });
}

```

## `app/api/cashflow/transactions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_transactions').select('*, cf_categories(name,kind)').order('txn_date',{ascending:false}).limit(200);
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const body = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_transactions').insert(body).select('*, cf_categories(name,kind)').single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}

```

## `app/api/cashflow/rules/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { assertCashflowAdmin } from '@/lib/cashflow/auth';
export async function GET() {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_recurring_rules').select('*, cf_categories(name,kind)').order('created_at',{ascending:false});
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function POST(req: NextRequest) {
  try { await assertCashflowAdmin(); } catch { return new NextResponse('Forbidden',{status:403}); }
  const body = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('cf_recurring_rules').insert(body).select().single();
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}

```

## `lib/cashflow/editorial-theme.ts`

```typescript
// lib/cashflow/editorial-theme.ts
// Canonical inline-style tokens for the Cashflow module.
// Palette matches CashflowDashboard.tsx exactly (cream/ink newspaper).
// Inline styles only — no Tailwind inside cashflow.

import type { CSSProperties } from 'react'

const CREAM = '#faf7f2'
const RULE = '#e8e2d5'
const RULE_STRONG = '#d9d1bf'
const INK = '#2a241a'
const MUTED = '#8a7d5f'
const GOOD = '#3b6d11'
const BAD = '#A32D2D'
const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'

export const editorialColors = {
  cream: CREAM,
  rule: RULE,
  ruleStrong: RULE_STRONG,
  ink: INK,
  muted: MUTED,
  good: GOOD,
  bad: BAD,
  serif: SERIF,
}

export const editorial: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 32px 80px',
    fontFamily: SERIF,
    color: INK,
    background: CREAM,
    minHeight: '100vh',
  },
  headerBlock: {
    borderBottom: `1px solid ${RULE_STRONG}`,
    paddingBottom: 18,
    marginBottom: 28,
  },
  title: {
    fontFamily: SERIF,
    fontSize: 44,
    fontWeight: 400,
    letterSpacing: '-0.01em',
    margin: 0,
    color: INK,
  },
  subtitle: {
    fontFamily: SERIF,
    fontSize: 17,
    fontStyle: 'italic',
    color: MUTED,
    margin: '10px 0 0',
  },
  label: {
    fontFamily: SERIF,
    fontSize: 14,
    fontStyle: 'italic',
    color: MUTED,
  },
  pill: {
    fontFamily: SERIF,
    fontSize: 14,
    padding: '5px 14px',
    border: 'none',
    background: 'transparent',
    color: MUTED,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  pillActive: {
    fontFamily: SERIF,
    fontSize: 14,
    fontWeight: 600,
    padding: '5px 14px',
    border: 'none',
    background: 'transparent',
    color: INK,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  card: {
    background: '#fff',
    border: `1px solid ${RULE}`,
    padding: '22px 26px',
    marginBottom: 22,
  },
  sectionHead: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: 400,
    margin: 0,
    color: INK,
  },
  fieldLabel: {
    display: 'block',
    fontFamily: SERIF,
    fontSize: 12,
    fontStyle: 'italic',
    color: MUTED,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  input: {
    width: '100%',
    fontFamily: SERIF,
    fontSize: 15,
    padding: '8px 10px',
    border: `1px solid ${RULE_STRONG}`,
    background: '#fff',
    color: INK,
    borderRadius: 0,
    boxSizing: 'border-box',
  },
  primaryBtn: {
    fontFamily: SERIF,
    fontSize: 15,
    padding: '9px 22px',
    border: `1px solid ${INK}`,
    background: INK,
    color: CREAM,
    borderRadius: 0,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
  muted: {
    fontFamily: SERIF,
    fontSize: 16,
    fontStyle: 'italic',
    color: MUTED,
    textAlign: 'center',
    padding: '28px 0',
  },
  chip: {
    display: 'inline-block',
    fontFamily: SERIF,
    fontSize: 12,
    padding: '2px 10px',
    border: `1px solid ${RULE_STRONG}`,
    background: CREAM,
    color: INK,
  },
  chipMuted: {
    display: 'inline-block',
    fontFamily: SERIF,
    fontSize: 12,
    fontStyle: 'italic',
    padding: '2px 10px',
    border: `1px dashed ${RULE_STRONG}`,
    background: 'transparent',
    color: MUTED,
  },
  linkBtn: {
    fontFamily: SERIF,
    fontSize: 13,
    fontStyle: 'italic',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: BAD,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
}

```

## `lib/cashflow/auth.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const ADMIN_EMAIL = () => process.env.CASHFLOW_ADMIN_EMAIL || 'okezie@vitalishealthcare.com';

export async function getCashflowUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isCashflowAdmin() {
  const user = await getCashflowUser();
  return !!user && user.email?.toLowerCase() === ADMIN_EMAIL().toLowerCase();
}

export async function requireCashflowAdmin() {
  const ok = await isCashflowAdmin();
  if (!ok) redirect('/dashboard');
}

export async function assertCashflowAdmin() {
  const ok = await isCashflowAdmin();
  if (!ok) throw new Response('Forbidden', { status: 403 });
}

```

## `lib/supabase/service.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS for server-side role checks
// Only use in server components, never expose to client
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

```

## `components/layout/Sidebar.tsx`

```typescript
'use client'
// components/layout/Sidebar.tsx
// Collapsible module groups. Each group remembers open/closed state in localStorage.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, GraduationCap, BadgeCheck, Users, BarChart3,
  Settings, UserCheck, ClipboardList, LogOut, UserCog,
  ShieldCheck, AlertTriangle, Sparkles, Target, Handshake,
  SlidersHorizontal, ChevronDown, ChevronRight, TrendingUp,
  Building2, BookUser, Map, Activity, Mail, Brain, FileText, Wallet
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem  { href: string; label: string; icon: any }
interface NavGroup { type: 'group'; id: string; label: string; emoji: string; items: NavItem[] }
interface NavFlat  { type: 'flat';  label: string; items: NavItem[] }
type NavSection = NavGroup | NavFlat

const adminNav: NavSection[] = [
  {
    type: 'flat', label: 'MAIN',
    items: [
      { href: '/dashboard', label: 'Overview',    icon: LayoutDashboard },
      { href: '/vita',      label: 'Ask Vita ✨', icon: Sparkles },
    ],
  },
  {
    type: 'group', id: 'compliance', label: 'Compliance', emoji: '🛡️',
    items: [
      { href: '/lms', label: 'Training Programmes',    icon: GraduationCap },
      { href: '/pp',  label: 'Policies & Procedures',  icon: ShieldCheck },
      { href: '/ep',  label: 'Emergency Preparedness', icon: AlertTriangle },
    ],
  },
  {
    type: 'group', id: 'workforce', label: 'Workforce', emoji: '👥',
    items: [
      { href: '/staff',       label: 'Caregiver Directory',  icon: Users },
      { href: '/credentials', label: 'Credentials',          icon: BadgeCheck },
      { href: '/appraisals',  label: 'Appraisals',           icon: ClipboardList },
      { href: '/references',  label: 'References',           icon: UserCheck },
      { href: '/users',       label: 'Caregiver Management', icon: UserCog },
      { href: '/reports',     label: 'Reports',              icon: BarChart3 },
    ],
  },
  {
    type: 'group', id: 'leads', label: 'Leads & Pipeline', emoji: '🎯',
    items: [
      { href: '/leads',                  label: 'Leads & Pipeline',  icon: Target },
      { href: '/leads/referral-sources', label: 'Referral Sources',  icon: Handshake },
      { href: '/leads/settings',         label: 'Pipeline Settings', icon: SlidersHorizontal },
    ],
  },
  {
    type: 'group', id: 'marketing', label: '52 Weeks Marketing', emoji: '📈',
    items: [
      { href: '/marketing',                   label: 'Overview',             icon: TrendingUp },
      { href: '/marketing/influence-centers', label: 'Influence Centers',    icon: Building2 },
      { href: '/marketing/contacts',          label: 'Contacts & Referrers', icon: BookUser },
      { href: '/marketing/route-builder',     label: 'Route Builder',        icon: Map },
      { href: '/marketing/activity-logger',   label: 'Activity Logger',      icon: Activity },
      { href: '/marketing/email-analytics',   label: 'Email Analytics',      icon: Mail },
      { href: '/marketing/intelligence',      label: 'Intelligence',         icon: Brain },
      { href: '/marketing/report',            label: 'Generate Report',      icon: FileText },
    ],
  },
  {
    type: 'flat', label: 'ADMIN',
    items: [
      { href: '/users',    label: 'User Management', icon: UserCog },
      { href: '/settings', label: 'Settings',        icon: Settings },
    ],
  },
  {
    type: 'group',
    id: 'cashflow',
    emoji: '💰',
    label: 'Cashflow',
    items: [
      { href: '/cashflow',              label: 'Dashboard',    icon: Wallet },
      { href: '/cashflow/forecast',    label: 'The outlook',  icon: TrendingUp },
      { href: '/cashflow/transactions', label: 'Transactions', icon: ClipboardList },
      { href: '/cashflow/rules',        label: 'Rules',        icon: SlidersHorizontal },
      { href: '/cashflow/settings',     label: 'Settings',     icon: Settings },
    ],
  },

]

const staffNav: NavSection[] = [
  {
    type: 'flat', label: 'MAIN',
    items: [
      { href: '/dashboard', label: 'Overview',    icon: LayoutDashboard },
      { href: '/vita',      label: 'Ask Vita ✨', icon: Sparkles },
    ],
  },
  {
    type: 'group', id: 'compliance', label: 'Compliance', emoji: '🛡️',
    items: [
      { href: '/lms',         label: 'Training Programmes',    icon: GraduationCap },
      { href: '/pp',          label: 'Policies & Procedures',  icon: ShieldCheck },
      { href: '/ep',          label: 'Emergency Preparedness', icon: AlertTriangle },
      { href: '/credentials', label: 'Credentials',            icon: BadgeCheck },
    ],
  },
  {
    type: 'group', id: 'workforce', label: 'Workforce', emoji: '👥',
    items: [
      { href: '/staff',       label: 'Caregiver Directory',  icon: Users },
      { href: '/credentials', label: 'Credentials',          icon: BadgeCheck },
      { href: '/appraisals',  label: 'Appraisals',           icon: ClipboardList },
      { href: '/references',  label: 'References',           icon: UserCheck },
      { href: '/users',       label: 'Caregiver Management', icon: UserCog },
      { href: '/reports',     label: 'Reports',              icon: BarChart3 },
    ],
  },
]

const caregiverNav: NavSection[] = [
  {
    type: 'flat', label: 'MY PORTAL',
    items: [
      { href: '/dashboard',   label: 'Overview',       icon: LayoutDashboard },
      { href: '/vita',        label: 'Ask Vita ✨',    icon: Sparkles },
      { href: '/lms',         label: 'My Training',    icon: GraduationCap },
      { href: '/pp',          label: 'Policies',       icon: ShieldCheck },
      { href: '/credentials', label: 'My Credentials', icon: BadgeCheck },
      { href: '/references',  label: 'My References',  icon: UserCheck },
    ],
  },
]

function NavGroupSection({ group, pathname, role, onNavigate }: { group: NavGroup; pathname: string; role?: string; onNavigate?: () => void }) {
  // Admin already has /users in the ADMIN flat section — filter it from Workforce group to avoid duplicates
  const items = role === 'admin'
    ? group.items.filter(item => item.href !== '/users')
    : group.items
  const hasActive = items.some(item =>
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  )
  const storageKey = `sidebar_group_${group.id}`
  const [open, setOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      setOpen(stored !== null ? JSON.parse(stored) : hasActive)
    } catch {
      setOpen(hasActive)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hasActive && hydrated) {
      setOpen(true)
      try { localStorage.setItem(storageKey, 'true') } catch {}
    }
  }, [hasActive, hydrated])

  const toggle = () => {
    const next = !open
    setOpen(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <button onClick={toggle} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '6px 14px 6px 12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13 }}>{group.emoji}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
            textTransform: 'uppercase', color: open ? '#0A5C5B' : '#8FA0B0',
          }}>
            {group.label}
          </span>
        </div>
        {open ? <ChevronDown size={12} color="#8FA0B0" /> : <ChevronRight size={12} color="#B0BEC5" />}
      </button>

      {open && (
        <div style={{ paddingBottom: 2 }}>
          {items.map(item => {
            const active = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={onNavigate}>
                <div style={{
                  margin: '1px 8px', padding: '7px 10px 7px 28px', borderRadius: 7,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: active ? '#E6F4F4' : 'transparent',
                  color: active ? '#0A5C5B' : '#4A6070',
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  border: active ? '1px solid #0E7C7B22' : '1px solid transparent',
                  cursor: 'pointer', minHeight: 36,
                }}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FlatSection({ section, pathname, onNavigate }: { section: NavFlat; pathname: string; onNavigate?: () => void }) {
  return (
    <div>
      <div style={{
        padding: '10px 20px 5px', fontSize: 10, fontWeight: 700,
        color: '#8FA0B0', letterSpacing: '1.4px', textTransform: 'uppercase',
      }}>
        {section.label}
      </div>
      {section.items.map(item => {
        const active = pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={onNavigate}>
            <div style={{
              margin: '1px 8px', padding: '9px 12px', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 10,
              background: active ? '#E6F4F4' : 'transparent',
              color: active ? '#0A5C5B' : '#4A6070',
              fontWeight: active ? 600 : 400, fontSize: 14,
              border: active ? '1px solid #0E7C7B22' : '1px solid transparent',
              cursor: 'pointer', minHeight: 42,
            }}>
              <Icon size={15} />
              <span>{item.label}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default function Sidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nav =
    role === 'admin' || role === 'supervisor' || role === 'staff' ? adminNav : caregiverNav

  const roleLabel =
    role === 'admin'      ? 'Admin' :
    role === 'supervisor' ? 'Supervisor' :
    role === 'staff'      ? 'Staff' : 'Caregiver'

  return (
    <aside style={{
      width: 224, background: '#fff', borderRight: '1px solid #D1D9E0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100%', minHeight: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '16px 0', flex: 1 }}>
        {nav.map((section, i) => {
          // Hide the ADMIN flat section from supervisors/staff — they get Caregiver Management in Workforce instead
          if (section.type === 'flat' && (section as NavFlat).label === 'ADMIN' && role !== 'admin') return null
          return section.type === 'group'
            ? <NavGroupSection key={(section as NavGroup).id} group={section as NavGroup} pathname={pathname} role={role} onNavigate={onNavigate} />
            : <FlatSection key={i} section={section as NavFlat} pathname={pathname} onNavigate={onNavigate} />
        })}
      </div>
      <div style={{ padding: '12px 8px', borderTop: '1px solid #EFF2F5' }}>
        <div style={{
          margin: '0 4px 8px', padding: '5px 10px', borderRadius: 6,
          background: '#F8FAFB', fontSize: 11, color: '#8FA0B0',
          fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>
          {roleLabel}
        </div>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: 'none',
          color: '#8FA0B0', fontSize: 14, cursor: 'pointer', minHeight: 44,
        }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

```

## `package.json`

```json
{
  "name": "vitalis-portal",
  "version": "0.5.2",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.9.0",
    "@supabase/supabase-js": "^2.100.0",
    "@tiptap/extension-placeholder": "^3.20.5",
    "@tiptap/pm": "^3.20.5",
    "@tiptap/react": "^3.20.5",
    "@tiptap/starter-kit": "^3.20.5",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.6.0",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hot-toast": "^2.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

## Schema reference

No `docs/cf-schema.sql` in repo. Key tables referenced in code:

- `cf_settings` — opening_cash, opening_date, week_start_dow
- `cf_categories` — id, name, kind, type ('receipt'|'expense')
- `cf_bank_accounts` — id, short_code (BOA-9113, BOA-8277, MT-3394, MT-6501, LEGACY), name, institution, account_number_last4, opening_balance, opening_date, is_active, sort_order
- `cf_transactions` — id, txn_date, amount, description, category_id, deleted_at, created_at (legacy table, still live for daybook)
- `cf_forecast_items` — id, category_id, bank_account_id (nullable), rule_id (nullable), forecast_date, amount, label, status ('planned'|'matched'|'missed'|'cancelled'), matched_actual_id (FK), created_at
- `cf_actual_items` — id, category_id, bank_account_id (NOT NULL), actual_date, amount, description, reference, source ('manual'|'matched'|'imported'|'backfill'|'transfer'), matched_forecast_id (FK), import_batch_id, created_at
- `cf_weekly_actuals` — week_ending, bank_account_id (composite PK), actual_cash (Friday bank balance anchor)
- `cf_recurring_rules` — rule definitions for standing orders; rule save is currently broken, fix planned for v0.5.4

---

_Snapshot complete: 24 files included, 0 missing._
