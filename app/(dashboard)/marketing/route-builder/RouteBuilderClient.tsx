'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Printer } from 'lucide-react'

interface Contact {
  id: string
  name: string
  role: string | null
  direct_line: string | null
  mobile: string | null
  email: string | null
}

interface Center {
  id: string
  name: string
  org_type: string
  street_address: string | null
  city: string | null
  state: string
  zip: string | null
  heat_status: string
  assigned_day: string | null
  week_group: number
  visit_order: number | null
  contacts: Contact[]
}

interface Props {
  centers: Center[]
}

const DAYS = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']

const HEAT_DOT: Record<string, string> = {
  hot: '#0B6B5C',
  cold: '#457B9D',
  dead: '#DC2626',
}

export default function RouteBuilderClient({ centers }: Props) {
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1)

  const week1 = centers.filter(c => c.week_group === 1)
  const week2 = centers.filter(c => c.week_group === 2)
  const current = activeWeek === 1 ? week1 : week2

  const byDay: Record<string, Center[]> = {}
  for (const day of DAYS) {
    byDay[day] = current.filter(c => c.assigned_day === day)
  }
  const unassigned = current.filter(c => !c.assigned_day)

  const totalDays = DAYS.filter(d => byDay[d].length > 0).length

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-route-root,
          #print-route-root * { display: revert !important; }
          @page { margin: 10mm 12mm; size: A4 landscape; }
          #print-route-root {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            font-size: 9pt !important;
            background: #fff !important;
          }
          .no-print { display: none !important; }
          .day-card { break-inside: avoid; page-break-inside: avoid; border: 1px solid #ccc !important; }
          .route-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; }
          .day-card { margin-bottom: 12px; }
          h1, h2 { font-size: 14pt !important; }
          h3 { font-size: 10pt !important; }
        }
      `}</style>

      <div id="print-route-root" className="print-page" style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/marketing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Marketing</Link>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '4px 0 0' }}>Route Builder</h1>
            <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Biweekly routing schedule · Go facilities only</p>
          </div>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            <Printer size={15} /> Print Schedule
          </button>
        </div>

        {/* Print header (only shows when printing) */}
        <div style={{ display: 'none' }} className="print-header">
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Vitalis Healthcare · {activeWeek === 1 ? 'Week 1' : 'Week 2'} Route Schedule</h1>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>52 Weeks Marketing · Biweekly routing · {current.length} facilities</p>
        </div>

        {/* Week tabs */}
        <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {([1, 2] as const).map(w => (
            <button key={w} onClick={() => setActiveWeek(w)}
              style={{
                padding: '9px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: activeWeek === w ? '#0B6B5C' : '#F3F4F6',
                color: activeWeek === w ? '#fff' : '#555',
              }}>
              Week {w}
              <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 12, opacity: 0.8 }}>
                ({(w === 1 ? week1 : week2).length} facilities)
              </span>
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, fontSize: 13, color: '#666' }}>
          <span>🗓️ <strong>{totalDays}</strong> active days</span>
          <span>🏥 <strong>{current.length}</strong> total facilities</span>
          <span>👥 <strong>{current.reduce((a, c) => a + c.contacts.length, 0)}</strong> contacts</span>
          {unassigned.length > 0 && <span style={{ color: '#D97706' }}>⚠️ {unassigned.length} unassigned</span>}
        </div>

        {/* Route grid */}
        <div className="route-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {DAYS.map(day => {
            const facilities = byDay[day]
            if (facilities.length === 0) return null
            return (
              <div key={day} className="day-card" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                {/* Day header */}
                <div style={{ background: '#0B6B5C', color: '#fff', padding: '10px 14px', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{day}</span>
                  <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.85 }}>{facilities.length} stops</span>
                </div>

                {/* Facilities */}
                {facilities.map((c, i) => (
                  <div key={c.id} style={{ borderBottom: i < facilities.length - 1 ? '1px solid #F0F0F0' : 'none', padding: '12px 14px' }}>
                    {/* Facility name + heat */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEAT_DOT[c.heat_status] || '#888', flexShrink: 0, marginTop: 5 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111', lineHeight: 1.3 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>
                          {[c.street_address, c.city].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Contacts */}
                    {c.contacts.length > 0 && (
                      <div style={{ marginLeft: 16, marginTop: 6 }}>
                        {c.contacts.map(ct => (
                          <div key={ct.id} style={{ fontSize: 12, color: '#555', padding: '3px 0', borderLeft: '2px solid #E5E7EB', paddingLeft: 8, marginBottom: 2 }}>
                            <span style={{ fontWeight: 500 }}>{ct.name}</span>
                            {ct.role && <span style={{ color: '#AAA' }}> · {ct.role.replace('Director - ', '').replace('Staff - ', '')}</span>}
                            {(ct.direct_line || ct.mobile) && (
                              <div style={{ color: '#888', fontSize: 11, marginTop: 1 }}>{ct.direct_line || ct.mobile}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {c.contacts.length === 0 && (
                      <div style={{ marginLeft: 16, fontSize: 11, color: '#CCC', fontStyle: 'italic' }}>No contacts added</div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <div style={{ border: '1px solid #FDE68A', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ background: '#FEF3C7', color: '#92400E', padding: '10px 14px', fontWeight: 700, fontSize: 14 }}>
              ⚠️ Unassigned facilities ({unassigned.length}) — not yet in the route
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 0 }}>
              {unassigned.map((c, i) => (
                <div key={c.id} style={{ padding: '10px 14px', borderBottom: '1px solid #F0F0F0', fontSize: 13, color: '#555' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEAT_DOT[c.heat_status] || '#888', display: 'inline-block', marginRight: 6 }} />
                  {c.name}
                  {c.city && <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>{c.city}</div>}
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#92400E', background: '#FFFBEB' }}>
              Assign days to these facilities in the <Link href="/marketing/influence-centers" style={{ color: '#0B6B5C' }}>Influence Centers</Link> manager.
            </div>
          </div>
        )}

        {/* Empty state */}
        {current.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#AAA' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No facilities in Week {activeWeek}</div>
            <div style={{ fontSize: 13 }}>Assign facilities to Week {activeWeek} in the Influence Centers manager.</div>
          </div>
        )}
      </div>
    </>
  )
}
