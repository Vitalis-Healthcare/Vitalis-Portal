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
