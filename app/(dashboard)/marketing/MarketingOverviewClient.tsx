'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

const HEAT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  hot:  { label: 'Hot',  color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
  cold: { label: 'Cold', color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  dead: { label: 'Dead', color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
}

const ACTIVITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  F: { label: 'Face-to-face', color: '#065F46', bg: '#D1FAE5' },
  D: { label: 'Drop-off',     color: '#6D28D9', bg: '#EDE9FE' },
  X: { label: 'Missed',       color: '#B45309', bg: '#FEF3C7' },
}

function getCenterName(log: VisitLog) {
  const mic = log.marketing_influence_centers
  if (!mic) return '—'
  return Array.isArray(mic) ? mic[0]?.name : mic.name
}

export default function MarketingOverviewClient({ centers, contacts, recentLogs, userName }: Props) {
  const router = useRouter()
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

      {/* Stat cards — all clickable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 32 }}>

        {/* Total facilities */}
        <ClickStatCard
          label="Facilities" value={centers.length}
          color="#111" bg="#fff" border="#E5E7EB"
          href="/marketing/influence-centers"
        />

        {/* Heat status cards */}
        {(['hot','cold','dead'] as const).map(status => {
          const hc = HEAT_CONFIG[status]
          const count = status === 'hot' ? hot : status === 'cold' ? cold : dead
          return (
            <ClickStatCard
              key={status}
              label={hc.label} value={count}
              color={hc.color} bg={hc.bg} border={hc.border}
              href={`/marketing/influence-centers?heat=${status}`}
            />
          )
        })}

        {/* Contacts */}
        <ClickStatCard
          label="Contacts" value={contacts.length}
          color="#6D28D9" bg="#EDE9FE" border="#C4B5FD"
          href="/marketing/contacts"
        />

        {/* Have email */}
        <ClickStatCard
          label="Have Email" value={withEmail}
          color="#6D28D9" bg="#F5F3FF" border="#DDD6FE"
          href="/marketing/contacts?email=yes"
        />
      </div>

      {/* Route breakdown — clickable to route builder */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Week 1', facilities: w1, week: 1 },
          { label: 'Week 2', facilities: w2, week: 2 },
        ].map(({ label, facilities, week }) => (
          <Link key={label} href={`/marketing/route-builder?week=${week}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#0B6B5C')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{label} Route</span>
                <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>
                  {facilities.length} facilities · View →
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
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 36 }}>
        <QuickLink href="/marketing/influence-centers" emoji="🏥" title="Influence Centers" desc="48 target facilities" />
        <QuickLink href="/marketing/contacts"          emoji="👥" title="Contacts & Referrers" desc={`${contacts.length} named contacts`} />
        <QuickLink href="/marketing/route-builder"     emoji="🗺️" title="Route Builder"        desc="Week 1 & 2 schedule" />
        <QuickLink href="/marketing/activity-logger"   emoji="✏️" title="Activity Logger"      desc="Log F / D / X visits" />
        <QuickLink href="/marketing/email-analytics"   emoji="📊" title="Email Analytics"      desc="Campaign open tracking" />
      </div>

      {/* Recent field activity */}
      {recentLogs.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: 0 }}>Recent field activity</h2>
            <Link href="/marketing/activity-logger?tab=history" style={{ fontSize: 13, color: '#0B6B5C', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            {recentLogs.map((log, i) => {
              const ac = ACTIVITY_CONFIG[log.activity_type] || { label: log.activity_type, color: '#888', bg: '#F3F4F6' }
              return (
                <div
                  key={log.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: i < recentLogs.length - 1 ? '1px solid #F0F0F0' : 'none', background: '#fff' }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: ac.bg, color: ac.color, whiteSpace: 'nowrap' }}>
                    {ac.label}
                  </span>
                  <span style={{ fontSize: 13, color: '#333', flex: 1 }}>{getCenterName(log)}</span>
                  <span style={{ fontSize: 12, color: '#AAA', whiteSpace: 'nowrap' }}>
                    {new Date(log.visit_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recentLogs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#AAA', fontSize: 14 }}>
          No field activity logged yet.{' '}
          <Link href="/marketing/activity-logger" style={{ color: '#0B6B5C' }}>Log your first visit →</Link>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ClickStatCard({
  label, value, color, bg, border, href,
}: {
  label: string; value: number; color: string; bg: string; border: string; href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color, opacity: 0.75, marginTop: 6, fontWeight: 500 }}>{label}</div>
      </div>
    </Link>
  )
}

function QuickLink({ href, emoji, title, desc }: { href: string; emoji: string; title: string; desc: string }) {
  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#0B6B5C')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
    >
      <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#888' }}>{desc}</div>
    </Link>
  )
}
