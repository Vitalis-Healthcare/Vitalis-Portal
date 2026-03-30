'use client'
import Link from 'next/link'

interface Center {
  id: string
  name: string
  heat_status: string
  go_no_go: boolean
  assigned_day: string | null
  week_group: number
}

interface Contact {
  id: string
  name: string
  email: string | null
}

interface VisitLog {
  id: string
  visit_date: string
  activity_type: string
  influence_center_id: string
  marketing_influence_centers: { name: string } | { name: string }[] | null
}

interface Props {
  centers: Center[]
  contacts: Contact[]
  recentLogs: VisitLog[]
  userName: string
}

const DAYS = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']

const HEAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hot:  { label: 'Hot',  color: '#0B6B5C', bg: '#D1FAE5' },
  cold: { label: 'Cold', color: '#457B9D', bg: '#EBF4FF' },
  dead: { label: 'Dead', color: '#DC2626', bg: '#FEE2E2' },
}

const ACTIVITY_CONFIG: Record<string, { label: string; color: string }> = {
  F: { label: 'Face-to-face', color: '#0B6B5C' },
  D: { label: 'Drop-off',     color: '#7C3AED' },
  X: { label: 'Missed',       color: '#D97706' },
}

function getCenterName(log: VisitLog) {
  const mic = log.marketing_influence_centers
  if (!mic) return '—'
  return Array.isArray(mic) ? mic[0]?.name : mic.name
}

export default function MarketingOverviewClient({ centers, contacts, recentLogs, userName }: Props) {
  const hot  = centers.filter(c => c.heat_status === 'hot').length
  const cold = centers.filter(c => c.heat_status === 'cold').length
  const dead = centers.filter(c => c.heat_status === 'dead').length
  const withEmail = contacts.filter(c => c.email).length
  const w1 = centers.filter(c => c.week_group === 1)
  const w2 = centers.filter(c => c.week_group === 2)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: 0 }}>Marketing Overview</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
          52 Weeks Marketing · Vitalis Private Pay Referral Programme
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard label="Facilities" value={centers.length} color="#111" />
        <StatCard label="Hot" value={hot}  color={HEAT_CONFIG.hot.color}  bg={HEAT_CONFIG.hot.bg} />
        <StatCard label="Cold" value={cold} color={HEAT_CONFIG.cold.color} bg={HEAT_CONFIG.cold.bg} />
        <StatCard label="Dead" value={dead} color={HEAT_CONFIG.dead.color} bg={HEAT_CONFIG.dead.bg} />
        <StatCard label="Contacts" value={contacts.length} color="#7C3AED" />
        <StatCard label="Have Email" value={withEmail} color="#7C3AED" bg="#EDE9FE" />
      </div>

      {/* Route breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Week 1', facilities: w1 },
          { label: 'Week 2', facilities: w2 },
        ].map(({ label, facilities }) => (
          <div key={label} style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 14 }}>
              {label} Route
              <span style={{ marginLeft: 8, fontWeight: 400, color: '#888', fontSize: 12 }}>
                ({facilities.length} facilities)
              </span>
            </div>
            {DAYS.map(day => {
              const count = facilities.filter(f => f.assigned_day === day).length
              return (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #EEE', fontSize: 13 }}>
                  <span style={{ color: '#555' }}>{day}</span>
                  <span style={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? '#0B6B5C' : '#AAA' }}>
                    {count > 0 ? `${count} facilities` : '—'}
                  </span>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12, color: '#AAA' }}>
              <span>Unassigned</span>
              <span>{facilities.filter(f => !f.assigned_day).length}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 36 }}>
        <QuickLink href="/marketing/influence-centers" emoji="🏥" title="Influence Centers" desc="Manage your 48 target facilities" />
        <QuickLink href="/marketing/contacts" emoji="👥" title="Contacts & Referrers" desc={`${contacts.length} named contacts across all facilities`} />
      </div>

      {/* Recent activity */}
      {recentLogs.length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 14 }}>Recent field activity</h2>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            {recentLogs.map((log, i) => {
              const ac = ACTIVITY_CONFIG[log.activity_type] || { label: log.activity_type, color: '#888' }
              return (
                <div
                  key={log.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: i < recentLogs.length - 1 ? '1px solid #F0F0F0' : 'none', background: '#fff' }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: ac.color + '18', color: ac.color }}>
                    {ac.label}
                  </span>
                  <span style={{ fontSize: 13, color: '#333', flex: 1 }}>{getCenterName(log)}</span>
                  <span style={{ fontSize: 12, color: '#AAA' }}>{new Date(log.visit_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recentLogs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#AAA', fontSize: 14 }}>
          No field activity logged yet. Activity logging is coming in the next update.
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg?: string }) {
  return (
    <div style={{ background: bg || '#fff', border: `1px solid ${color}25`, borderRadius: 12, padding: '18px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>{label}</div>
    </div>
  )
}

function QuickLink({ href, emoji, title, desc }: { href: string; emoji: string; title: string; desc: string }) {
  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#888' }}>{desc}</div>
    </Link>
  )
}
