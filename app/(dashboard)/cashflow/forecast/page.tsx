'use client'

import { useEffect, useState, useCallback } from 'react'
import { editorial } from '@/lib/cashflow/editorial-theme'

type ForecastItem = {
  id: string
  category_id: string
  category_name?: string
  category_type?: 'income' | 'expense'
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
  subtotal_income: number
  subtotal_expense: number
  net: number
}

type Category = { id: string; name: string; type: 'income' | 'expense' }
type BankAccount = { id: string; short_code: string; name: string }

const HORIZONS = [12, 26, 52] as const
type Horizon = typeof HORIZONS[number]

const subtitleFor = (h: Horizon) =>
  h === 12 ? 'Twelve weeks of planned cash.' :
  h === 26 ? 'Twenty-six weeks of planned cash.' :
  'Fifty-two weeks of planned cash.'

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

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
  const [editingId, setEditingId] = useState<string | null>(null)

  // add form state
  const [fDate, setFDate] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [fAmount, setFAmount] = useState('')
  const [fLabel, setFLabel] = useState('')
  const [fAccount, setFAccount] = useState('') // '' = unassigned
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

  const saveEdit = async (id: string, patch: Partial<ForecastItem>) => {
    const res = await fetch(`/api/cashflow/forecast/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) { setEditingId(null); load() }
    else alert('Could not update.')
  }

  return (
    <div style={editorial.page}>
      <div style={editorial.headerBlock}>
        <h1 style={editorial.title}>The outlook</h1>
        <p style={editorial.subtitle}>{subtitleFor(horizon)}</p>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 28 }}>
        <span style={editorial.label}>Look ahead:</span>
        {HORIZONS.map(h => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            style={h === horizon ? editorial.pillActive : editorial.pill}
          >
            {h} weeks
          </button>
        ))}
      </div>

      {/* Add form */}
      <div style={editorial.card}>
        <h2 style={editorial.sectionHead}>Enter into the book</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr 180px auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={editorial.fieldLabel}>Date</label>
            <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={editorial.input} />
          </div>
          <div>
            <label style={editorial.fieldLabel}>Category</label>
            <select value={fCategory} onChange={e => setFCategory(e.target.value)} style={editorial.input}>
              <option value="">— select —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
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

      {/* Week groups */}
      {loading ? (
        <p style={editorial.muted}>Reading the outlook…</p>
      ) : groups.length === 0 ? (
        <div style={{ ...editorial.card, textAlign: 'center', padding: 48 }}>
          <p style={{ ...editorial.subtitle, marginBottom: 0 }}>The outlook is clear.</p>
          <p style={editorial.muted}>Nothing planned yet. Enter the first item above.</p>
        </div>
      ) : (
        groups.map(g => (
          <div key={g.week_ending} style={editorial.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #e8e4d9', paddingBottom: 10, marginBottom: 12 }}>
              <h3 style={editorial.sectionHead}>{fmtWeek(g.week_ending)}</h3>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#5a5245' }}>
                <span style={{ color: '#2d6b3f', marginRight: 14 }}>in {fmtMoney(g.subtotal_income)}</span>
                <span style={{ color: '#8b3a2f', marginRight: 14 }}>out {fmtMoney(g.subtotal_expense)}</span>
                <strong>net {fmtMoney(g.net)}</strong>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Georgia, serif' }}>
              <tbody>
                {g.items.map(it => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #f2ede0' }}>
                    <td style={{ padding: '10px 8px', width: 120, color: '#5a5245' }}>{fmtDate(it.forecast_date)}</td>
                    <td style={{ padding: '10px 8px' }}>{it.label || <em style={{ color: '#8a8170' }}>(no label)</em>}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={editorial.chip}>{it.category_name}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={it.bank_account_code ? editorial.chip : editorial.chipMuted}>
                        {it.bank_account_code || 'unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: it.category_type === 'income' ? '#2d6b3f' : '#8b3a2f' }}>
                      {it.category_type === 'income' ? '+' : '−'}{fmtMoney(Math.abs(it.amount))}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', width: 100 }}>
                      <button onClick={() => strikeOut(it.id)} style={editorial.linkBtn}>Strike out</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
