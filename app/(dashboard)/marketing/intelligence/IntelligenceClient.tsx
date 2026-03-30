'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactScore {
  id: string; name: string; email: string; role: string | null
  facility_id: string | null; facility_name: string; facility_heat: string
  email_opens: number; email_pct: number
  email_score: number; heat_score: number; visit_score: number; total_score: number
  days_since_facility_visit: number | null; last_facility_visit: string | null
}

interface FacilityRow {
  id: string; name: string; org_type: string; heat_status: string
  assigned_day: string | null; week_group: number; go_no_go: boolean
  total_visits: number; f_visits: number; d_visits: number; f_rate: number
  last_visit: string | null; last_f_visit: string | null
  days_since_visit: number | null; days_since_f_visit: number | null
  contact_count: number; email_opens_total: number; email_engagement_pct: number
  relationship_health: 'strong' | 'building' | 'stalled' | 'cold' | 'dead'
}

interface Summary {
  total_campaigns: number; overall_f_rate: number
  total_f_visits: number; total_d_visits: number; total_visits: number
  unmatched_openers: number
  needs_f_visit: { id: string; name: string; days_since_f: number | null }[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const HEALTH: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  strong:   { label: 'Strong',   color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  building: { label: 'Building', color: '#1D4ED8', bg: '#DBEAFE', dot: '#3B82F6' },
  stalled:  { label: 'Stalled',  color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  cold:     { label: 'Cold',     color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' },
  dead:     { label: 'Dead',     color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
}

const HEAT: Record<string, { color: string; bg: string }> = {
  hot:  { color: '#065F46', bg: '#D1FAE5' },
  cold: { color: '#1E40AF', bg: '#DBEAFE' },
  dead: { color: '#991B1B', bg: '#FEE2E2' },
}

// ── Component ──────────────────────────────────────────────────────────────

export default function IntelligenceClient() {
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<ContactScore[]>([])
  const [facilities, setFacilities] = useState<FacilityRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'contacts' | 'facilities' | 'alerts'>('contacts')
  const [facilityFilter, setFacilityFilter] = useState<string>('')

  useEffect(() => {
    fetch('/api/marketing/intelligence')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setContacts(data.contacts || [])
        setFacilities(data.facilities || [])
        setSummary(data.summary || null)
      })
      .catch(() => setError('Failed to load intelligence data.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredFacilities = useMemo(() => {
    if (!facilityFilter) return facilities
    return facilities.filter(f => f.relationship_health === facilityFilter)
  }, [facilities, facilityFilter])

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>Computing engagement scores…</div>
      <div style={{ fontSize: 13, color: '#AAA', marginTop: 4 }}>Analysing visits, email opens, and facility heat across all data</div>
    </div>
  )

  if (error) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
  )

  const healthCounts = facilities.reduce((acc, f) => {
    acc[f.relationship_health] = (acc[f.relationship_health] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '4px 0 0' }}>Marketing Intelligence</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Engagement scores across visits, email opens, and facility heat</p>
      </div>

      {/* Summary stats */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          <SumCard label="Total visits" value={String(summary.total_visits)} color="#111" />
          <SumCard label="F-rate" value={`${summary.overall_f_rate}%`} color={summary.overall_f_rate >= 30 ? '#065F46' : summary.overall_f_rate >= 20 ? '#D97706' : '#DC2626'}
            sub={summary.overall_f_rate < 20 ? '↑ Target: 30%+' : undefined} />
          <SumCard label="F visits" value={String(summary.total_f_visits)} color="#065F46" />
          <SumCard label="D visits" value={String(summary.total_d_visits)} color="#6D28D9" />
          <SumCard label="Campaigns" value={String(summary.total_campaigns)} color="#0B6B5C" />
          <SumCard label="Unmatched openers" value={String(summary.unmatched_openers)} color="#D97706"
            sub="Not yet in CRM" />
        </div>
      )}

      {/* F-rate alert */}
      {summary && summary.overall_f_rate < 25 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
          ⚠️ <strong>F-rate is {summary.overall_f_rate}%</strong> — 52 Weeks Marketing recommends face-to-face visits as the primary relationship builder.
          Most visits are drop-offs (D). Focus next visits on converting D facilities to F by scheduling meetings in advance.
        </div>
      )}

      {/* Needs F-visit alert */}
      {summary && summary.needs_f_visit.length > 0 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1E40AF', marginBottom: 8 }}>
            📅 {summary.needs_f_visit.length} active facilities haven't had a face-to-face visit in 60+ days
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {summary.needs_f_visit.map(f => (
              <span key={f.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#DBEAFE', color: '#1D4ED8', fontWeight: 500 }}>
                {f.name}{f.days_since_f ? ` (${f.days_since_f}d)` : ' (never)'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {([
          { key: 'contacts',   label: `👤 Contact Scores (${contacts.length})` },
          { key: 'facilities', label: `🏥 Facility Matrix (${facilities.length})` },
          { key: 'alerts',     label: '🎯 Priority Actions' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 18px', border: 'none', borderBottom: tab === t.key ? '2px solid #0B6B5C' : '2px solid transparent', background: 'none', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#0B6B5C' : '#888', fontSize: 14, cursor: 'pointer', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTACT SCORES ── */}
      {tab === 'contacts' && (
        <div>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            Score = email engagement (0–50) + facility heat (0–20) + recency of last visit (0–30).
            Higher = prioritise this contact for a face-to-face visit.
          </p>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['#','Contact','Facility','Heat','Email opens','Email %','Score','Last visit to facility'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => {
                    const hc = HEAT[c.facility_heat] || HEAT.cold
                    const scoreColor = c.total_score >= 70 ? '#065F46' : c.total_score >= 50 ? '#0B6B5C' : c.total_score >= 30 ? '#D97706' : '#888'
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <td style={{ padding: '11px 14px', color: '#AAA', fontWeight: 700, fontSize: 12 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#111' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#AAA' }}>{c.role?.replace('Director - ','').replace('Staff - ','') || ''}</div>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#555', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.facility_name}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: hc.bg, color: hc.color }}>
                            {c.facility_heat}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, color: c.email_opens > 0 ? '#0B6B5C' : '#CCC' }}>{c.email_opens}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ height: '100%', width: `${c.email_pct}%`, background: c.email_pct >= 70 ? '#0B6B5C' : c.email_pct >= 40 ? '#3B82F6' : '#D1D5DB', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#888', width: 28, textAlign: 'right' }}>{c.email_pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: scoreColor }}>{c.total_score}</div>
                          <div style={{ fontSize: 10, color: '#CCC' }}>/ 100</div>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#666', whiteSpace: 'nowrap' }}>
                          {c.days_since_facility_visit !== null
                            ? <span style={{ color: c.days_since_facility_visit > 30 ? '#D97706' : '#0B6B5C' }}>
                                {c.days_since_facility_visit === 0 ? 'Today' : `${c.days_since_facility_visit}d ago`}
                              </span>
                            : <span style={{ color: '#CCC' }}>No visits</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FACILITY MATRIX ── */}
      {tab === 'facilities' && (
        <div>
          {/* Health filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setFacilityFilter('')}
              style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${!facilityFilter ? '#0B6B5C' : '#DDD'}`, background: !facilityFilter ? '#D1FAE5' : '#fff', color: !facilityFilter ? '#065F46' : '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              All ({facilities.length})
            </button>
            {Object.entries(HEALTH).map(([key, hc]) => (
              <button key={key} onClick={() => setFacilityFilter(facilityFilter === key ? '' : key)}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${facilityFilter === key ? hc.dot : '#DDD'}`, background: facilityFilter === key ? hc.bg : '#fff', color: facilityFilter === key ? hc.color : '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: hc.dot, marginRight: 5 }} />
                {hc.label} ({healthCounts[key] || 0})
              </button>
            ))}
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['Facility','Health','Heat','Wk','Day','Visits','F','D','F-rate','Last visit','Last F','Email eng.','Contacts'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((f, i) => {
                    const hc = HEALTH[f.relationship_health]
                    const heat = HEAT[f.heat_status] || HEAT.cold
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid #F0F0F0', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111', minWidth: 160 }}>
                          {f.name}
                          {!f.go_no_go && <span style={{ marginLeft: 4, fontSize: 9, color: '#DC2626', background: '#FEE2E2', padding: '1px 4px', borderRadius: 3 }}>NO-GO</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: hc.bg, color: hc.color }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: hc.dot, display: 'inline-block' }} />
                            {hc.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: heat.bg, color: heat.color }}>
                            {f.heat_status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#666', textAlign: 'center' }}>{f.week_group}</td>
                        <td style={{ padding: '10px 12px', color: '#666' }}>{f.assigned_day?.slice(0,3) || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: f.total_visits > 0 ? 600 : 400, color: f.total_visits > 0 ? '#111' : '#CCC' }}>{f.total_visits}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#065F46', fontWeight: 600 }}>{f.f_visits}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6D28D9', fontWeight: 600 }}>{f.d_visits}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {f.total_visits > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 36, height: 5, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${f.f_rate}%`, background: f.f_rate >= 30 ? '#0B6B5C' : f.f_rate >= 15 ? '#F59E0B' : '#EF4444', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: f.f_rate >= 30 ? '#065F46' : f.f_rate >= 15 ? '#92400E' : '#991B1B', fontWeight: 600 }}>{f.f_rate}%</span>
                            </div>
                          ) : <span style={{ color: '#CCC' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: f.days_since_visit !== null && f.days_since_visit > 30 ? '#D97706' : '#555' }}>
                          {f.days_since_visit !== null ? `${f.days_since_visit}d ago` : <span style={{ color: '#CCC' }}>Never</span>}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: f.days_since_f_visit !== null && f.days_since_f_visit > 60 ? '#DC2626' : '#555' }}>
                          {f.days_since_f_visit !== null ? `${f.days_since_f_visit}d ago` : <span style={{ color: '#CCC' }}>Never</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {f.contact_count > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 36, height: 5, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${f.email_engagement_pct}%`, background: '#7C3AED', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: '#6D28D9', fontWeight: 600 }}>{f.email_engagement_pct}%</span>
                            </div>
                          ) : <span style={{ color: '#CCC' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#555' }}>{f.contact_count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PRIORITY ACTIONS ── */}
      {tab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top contacts to visit this week */}
          <ActionCard title="🎯 Top contacts to prioritise this week" color="#065F46" bg="#D1FAE5">
            <p style={{ fontSize: 13, color: '#065F46', margin: '0 0 12px' }}>
              These contacts score highest across email engagement, facility heat, and recency. Book F-visits.
            </p>
            {contacts.slice(0, 5).map((c, i) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid #A7F3D0' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#065F46' }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: '#6EE7B7', marginLeft: 8 }}>@ {c.facility_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#065F46' }}>Opens {c.email_pct}% of emails</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#065F46' }}>Score {c.total_score}</span>
                </div>
              </div>
            ))}
          </ActionCard>

          {/* Stalled relationships */}
          {facilities.filter(f => f.relationship_health === 'stalled').length > 0 && (
            <ActionCard title="⚠️ Stalled relationships — need attention" color="#92400E" bg="#FEF3C7">
              <p style={{ fontSize: 13, color: '#92400E', margin: '0 0 12px' }}>
                These facilities have been visited but activity has dropped off. Risk of going cold.
              </p>
              {facilities.filter(f => f.relationship_health === 'stalled').slice(0, 6).map((f, i) => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid #FDE68A' : 'none', fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#92400E' }}>{f.name}</span>
                    <span style={{ fontSize: 11, color: '#B45309', marginLeft: 8 }}>Wk {f.week_group} · {f.assigned_day || 'unassigned'}</span>
                  </div>
                  <span style={{ color: '#92400E', fontSize: 12 }}>
                    Last visit: {f.days_since_visit !== null ? `${f.days_since_visit} days ago` : 'never'}
                  </span>
                </div>
              ))}
            </ActionCard>
          )}

          {/* High email engagement, cold heat status — opportunity */}
          {(() => {
            const opportunity = facilities.filter(f =>
              f.email_engagement_pct >= 50 && f.heat_status === 'cold'
            )
            return opportunity.length > 0 ? (
              <ActionCard title="🔥 Hidden opportunities — high email engagement, not yet hot" color="#6D28D9" bg="#EDE9FE">
                <p style={{ fontSize: 13, color: '#6D28D9', margin: '0 0 12px' }}>
                  Contacts at these facilities are opening your emails consistently but the facility is still rated Cold.
                  These are relationships worth pushing to the next level with a scheduled F-visit.
                </p>
                {opportunity.slice(0, 5).map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid #C4B5FD' : 'none', fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: '#6D28D9' }}>{f.name}</span>
                    <span style={{ color: '#7C3AED', fontSize: 12 }}>{f.email_engagement_pct}% email engagement · {f.contact_count} contacts</span>
                  </div>
                ))}
              </ActionCard>
            ) : null
          })()}

          {/* Dead facilities with high email engagement — reconsider */}
          {(() => {
            const reconsidered = facilities.filter(f => f.heat_status === 'dead' && f.email_engagement_pct >= 40)
            return reconsidered.length > 0 ? (
              <ActionCard title="💡 Dead facilities worth reconsidering" color="#1D4ED8" bg="#DBEAFE">
                <p style={{ fontSize: 13, color: '#1D4ED8', margin: '0 0 12px' }}>
                  These facilities are marked Dead but their contacts are still opening your emails.
                  The relationship isn't as cold as the heat status suggests — consider a re-engagement visit.
                </p>
                {reconsidered.map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid #BFDBFE' : 'none', fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: '#1D4ED8' }}>{f.name}</span>
                    <span style={{ color: '#2563EB', fontSize: 12 }}>{f.email_engagement_pct}% of contacts still opening emails</span>
                  </div>
                ))}
              </ActionCard>
            ) : null
          })()}

          {/* F-rate improvement targets */}
          <ActionCard title="📞 Convert D-only visits to F — schedule meetings in advance" color="#374151" bg="#F3F4F6">
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
              These facilities have only had drop-offs (D) — no face-to-face contact. Call ahead to book a meeting.
            </p>
            {facilities.filter(f => f.f_visits === 0 && f.d_visits > 0 && f.heat_status !== 'dead').slice(0, 6).map((f, i) => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? '1px solid #E5E7EB' : 'none', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>{f.name}</span>
                <span style={{ color: '#6B7280', fontSize: 12 }}>{f.d_visits} drop-offs, 0 face-to-face</span>
              </div>
            ))}
          </ActionCard>
        </div>
      )}
    </div>
  )
}

function SumCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  )
}

function ActionCard({ title, color, bg, children }: { title: string; color: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}
