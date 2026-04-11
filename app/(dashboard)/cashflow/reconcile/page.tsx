'use client'

import { useEffect, useState, useCallback } from 'react'
import { editorial, editorialColors } from '@/lib/cashflow/editorial-theme'

type PlannedItem = {
  id: string
  category_id: string
  category_name?: string
  category_type?: string
  bank_account_id: string | null
  bank_account_code?: string | null
  forecast_date: string
  amount: number
  label: string
  status: 'planned' | 'matched' | 'missed' | 'cancelled'
}

type ReceivedItem = {
  id: string
  source: 'transaction' | 'actual'
  category_name?: string
  category_type?: string
  bank_account_code?: string | null
  the_date: string
  amount: number
  description: string
  reference?: string | null
}

type WeekGroup = {
  week_ending: string
  planned: PlannedItem[]
  received: ReceivedItem[]
  planned_in: number
  planned_out: number
  received_in: number
  received_out: number
}

type BankAccount = { id: string; short_code: string; name: string }

const HORIZONS = [12, 26, 52] as const
type Horizon = typeof HORIZONS[number]

const isReceipt = (t?: string) => t === 'receipt'

const subtitleFor = (h: Horizon) =>
  h === 12 ? 'Twelve weeks of plan against received.' :
  h === 26 ? 'Twenty-six weeks of plan against received.' :
  'Fifty-two weeks of plan against received.'

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

const fmtWeek = (d: string) => {
  const date = new Date(d + 'T00:00:00')
  return `Week ending ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
}

export default function ReconcilePage() {
  const [horizon, setHorizon] = useState<Horizon>(26)
  const [groups, setGroups] = useState<WeekGroup[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [openFor, setOpenFor] = useState<string | null>(null)

  const [mDate, setMDate] = useState('')
  const [mAmount, setMAmount] = useState('')
  const [mRef, setMRef] = useState('')
  const [mAccount, setMAccount] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/cashflow/reconcile?horizon=${horizon}`, { cache: 'no-store' })
    const data = await res.json()
    setGroups(data.groups || [])
    setAccounts(data.accounts || [])
    setLoading(false)
  }, [horizon])

  useEffect(() => { load() }, [load])

  const openMatch = (it: PlannedItem) => {
    setOpenFor(it.id)
    setMDate(it.forecast_date)
    setMAmount(String(it.amount))
    setMRef('')
    setMAccount(it.bank_account_id || '')
  }

  const cancelMatch = () => {
    setOpenFor(null)
    setMDate(''); setMAmount(''); setMRef(''); setMAccount('')
  }

  const saveMatch = async (forecastId: string) => {
    if (!mDate || !mAmount || !mAccount) {
      alert('Date, amount, and account are required.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/cashflow/reconcile/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        forecast_id: forecastId,
        actual_date: mDate,
        amount: parseFloat(mAmount),
        reference: mRef || null,
        bank_account_id: mAccount,
      }),
    })
    setSaving(false)
    if (res.ok) {
      cancelMatch()
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Could not enter into the book.')
    }
  }

  return (
    <div style={editorial.page}>
      <div style={editorial.headerBlock}>
        <h1 style={editorial.title}>The reckoning</h1>
        <p style={editorial.subtitle}>{subtitleFor(horizon)}</p>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 28, justifyContent: 'flex-end' }}>
        <span style={{ ...editorial.label, marginRight: 12 }}>Look ahead:</span>
        {HORIZONS.map((h, i) => (
          <span key={h} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            <button onClick={() => setHorizon(h)} style={h === horizon ? editorial.pillActive : editorial.pill}>
              {h} weeks
            </button>
            {i < HORIZONS.length - 1 && <span style={{ color: editorialColors.muted, margin: '0 2px' }}>·</span>}
          </span>
        ))}
      </div>

      {loading ? (
        <p style={editorial.muted}>Reading the reckoning…</p>
      ) : groups.length === 0 ? (
        <div style={{ ...editorial.card, textAlign: 'center', padding: 56 }}>
          <p style={{ ...editorial.sectionHead, marginBottom: 8 }}>Nothing to reckon yet.</p>
          <p style={{ ...editorial.subtitle, margin: 0 }}>Plan some items in the outlook first.</p>
        </div>
      ) : (
        groups.map(g => (
          <div key={g.week_ending} style={editorial.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${editorialColors.rule}`, paddingBottom: 12, marginBottom: 14 }}>
              <h3 style={editorial.sectionHead}>{fmtWeek(g.week_ending)}</h3>
              <div style={{ fontFamily: editorialColors.serif, fontSize: 14, color: editorialColors.muted }}>
                <span style={{ marginRight: 18 }}>planned net {fmtMoney(g.planned_in - g.planned_out)}</span>
                <span style={{ color: editorialColors.ink }}>received net {fmtMoney(g.received_in - g.received_out)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h4 style={{ ...editorial.label, marginBottom: 8 }}>Planned</h4>
                {g.planned.length === 0 ? (
                  <p style={{ ...editorial.muted, fontStyle: 'italic' }}>Nothing planned.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: editorialColors.serif }}>
                    <tbody>
                      {g.planned.map(it => {
                        const receipt = isReceipt(it.category_type)
                        const isOpen = openFor === it.id
                        const isMatched = it.status === 'matched'
                        return (
                          <>
                            <tr key={it.id} style={{ borderBottom: `1px solid ${editorialColors.rule}` }}>
                              <td style={{ padding: '10px 6px', width: 110, color: editorialColors.muted, fontSize: 13 }}>{fmtDate(it.forecast_date)}</td>
                              <td style={{ padding: '10px 6px', color: editorialColors.ink, fontSize: 14 }}>
                                {it.label || <em style={{ color: editorialColors.muted }}>(no label)</em>}
                                <div style={{ fontSize: 11, color: editorialColors.muted, marginTop: 2 }}>{it.category_name}</div>
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: receipt ? editorialColors.good : editorialColors.bad, fontSize: 14 }}>
                                {receipt ? '+' : '−'}{fmtMoney(Math.abs(it.amount))}
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', width: 130 }}>
                                {isMatched ? (
                                  <span style={{ ...editorial.chipMuted, fontSize: 11 }}>matched</span>
                                ) : isOpen ? (
                                  <button onClick={cancelMatch} style={editorial.linkBtn}>Cancel</button>
                                ) : (
                                  <button onClick={() => openMatch(it)} style={editorial.linkBtn}>Mark received</button>
                                )}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr key={`${it.id}-form`}>
                                <td colSpan={4} style={{ padding: '12px 6px 16px', background: editorialColors.cream || 'transparent' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '130px 110px 1fr 130px auto', gap: 10, alignItems: 'end' }}>
                                    <div>
                                      <label style={editorial.fieldLabel}>Date</label>
                                      <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} style={editorial.input} />
                                    </div>
                                    <div>
                                      <label style={editorial.fieldLabel}>Amount</label>
                                      <input type="number" step="0.01" value={mAmount} onChange={e => setMAmount(e.target.value)} style={editorial.input} />
                                    </div>
                                    <div>
                                      <label style={editorial.fieldLabel}>Reference</label>
                                      <input type="text" value={mRef} onChange={e => setMRef(e.target.value)} placeholder="check #, ACH ref, invoice #" style={editorial.input} />
                                    </div>
                                    <div>
                                      <label style={editorial.fieldLabel}>Account</label>
                                      <select value={mAccount} onChange={e => setMAccount(e.target.value)} style={editorial.input}>
                                        <option value="">— required —</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.short_code}</option>)}
                                      </select>
                                    </div>
                                    <button onClick={() => saveMatch(it.id)} disabled={saving || !mDate || !mAmount || !mAccount} style={editorial.primaryBtn}>
                                      {saving ? 'Entering…' : 'Enter into the book'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <h4 style={{ ...editorial.label, marginBottom: 8 }}>Received</h4>
                {g.received.length === 0 ? (
                  <p style={{ ...editorial.muted, fontStyle: 'italic' }}>Nothing received.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: editorialColors.serif }}>
                    <tbody>
                      {g.received.map(it => {
                        const receipt = isReceipt(it.category_type)
                        return (
                          <tr key={`${it.source}-${it.id}`} style={{ borderBottom: `1px solid ${editorialColors.rule}` }}>
                            <td style={{ padding: '10px 6px', width: 110, color: editorialColors.muted, fontSize: 13 }}>{fmtDate(it.the_date)}</td>
                            <td style={{ padding: '10px 6px', color: editorialColors.ink, fontSize: 14 }}>
                              {it.description || <em style={{ color: editorialColors.muted }}>(no description)</em>}
                              <div style={{ fontSize: 11, color: editorialColors.muted, marginTop: 2 }}>
                                {it.category_name}{it.reference ? ` · ${it.reference}` : ''}
                              </div>
                            </td>
                            <td style={{ padding: '10px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: receipt ? editorialColors.good : editorialColors.bad, fontSize: 14 }}>
                              {receipt ? '+' : '−'}{fmtMoney(Math.abs(it.amount))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
