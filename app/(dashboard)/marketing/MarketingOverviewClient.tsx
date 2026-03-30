'use client'
import Link from 'next/link'

interface Center {
  id: string; name: string; heat_status: string
  go_no_go: boolean; assigned_day: string | null; week_group: number
}
interface Contact { id: string; name: string; email: string | null }
interface VisitLog {
  id: string; visit_date: string; activity_type: string
  influence_center_id: string
  marketing_influence_centers: { name: string } | { name: string }[] | null
}
interface TopOpener {
  email: string; name: string; facility: string; count: number; contact_id: string | null
}
interface TopCampaign {
  id: string; campaign_date: string; total_opened: number
  open_rate: number | null; total_sent: number
}
interface Props {
  centers: Center[]; contacts: Contact[]; recentLogs: VisitLog[]
  userName: string; topOpeners: TopOpener[]
  topCampaigns: TopCampaign[]; totalCampaigns: number
}

const DAYS = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']
const HEAT: Record<string, { color: string; bg: string; border: string }> = {
  hot:  { color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
  cold: { color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  dead: { color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
}
const ACTIVITY: Record<string, { label: string; color: string; bg: string }> = {
  F: { label: 'Face-to-face', color: '#065F46', bg: '#D1FAE5' },
  D: { label: 'Drop-off',     color: '#6D28D9', bg: '#EDE9FE' },
  X: { label: 'Missed',       color: '#B45309', bg: '#FEF3C7' },
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function getCenterName(log: VisitLog) {
  const mic = log.marketing_influence_centers
  if (!mic) return '—'
  return Array.isArray(mic) ? mic[0]?.name : mic.name
}

export default function MarketingOverviewClient({
  centers, contacts, recentLogs, userName,
  topOpeners, topCampaigns, totalCampaigns,
}: Props) {
  const hot  = centers.filter(c => c.heat_status === 'hot').length
  const cold = centers.filter(c => c.heat_status === 'cold').length
  const dead = centers.filter(c => c.heat_status === 'dead').length
  const withEmail = contacts.filter(c => c.email).length
  const w1 = centers.filter(c => c.week_group === 1)
  const w2 = centers.filter(c => c.week_group === 2)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: 0 }}>Marketing Overview</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
          52 Weeks Marketing · Vitalis Private Pay Referral Programme
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="Facilities" value={centers.length} color="#111" bg="#fff" border="#E5E7EB" href="/marketing/influence-centers" />
        {(['hot','cold','dead'] as const).map(s => (
          <StatCard key={s} label={s.charAt(0).toUpperCase()+s.slice(1)} value={s==='hot'?hot:s==='cold'?cold:dead}
            color={HEAT[s].color} bg={HEAT[s].bg} border={HEAT[s].border} href="/marketing/influence-centers" />
        ))}
        <StatCard label="Contacts" value={contacts.length} color="#6D28D9" bg="#EDE9FE" border="#C4B5FD" href="/marketing/contacts" />
        <StatCard label="Have Email" value={withEmail} color="#6D28D9" bg="#F5F3FF" border="#DDD6FE" href="/marketing/contacts" />
        <StatCard label="Campaigns" value={totalCampaigns} color="#0B6B5C" bg="#F0FDF4" border="#6EE7B7" href="/marketing/email-analytics" />
      </div>

      {/* ── Top Openers + Top Campaigns — side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

        {/* Top Openers */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>🏆 Most Engaged Contacts</div>
              <div style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>External openers ranked by campaigns opened</div>
            </div>
            <Link href="/marketing/email-analytics" style={{ fontSize: 12, color: '#0B6B5C', textDecoration: 'none' }}>All campaigns →</Link>
          </div>
          {topOpeners.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#AAA', fontSize: 13 }}>No data yet</div>
          ) : topOpeners.map((op, i) => (
            <div key={op.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: i < topOpeners.length - 1 ? '1px solid #F8F8F8' : 'none' }}>
              {/* Rank */}
              <div style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 700, color: i < 3 ? '#D97706' : '#CCC' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </div>
              {/* Name + facility */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {op.name}
                </div>
                <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {op.facility}
                </div>
              </div>
              {/* Count badge */}
              <div style={{ background: '#0B6B5C', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                {op.count} / {totalCampaigns}
              </div>
              {/* Engagement bar */}
              <div style={{ width: 48, flexShrink: 0 }}>
                <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(op.count/totalCampaigns*100)}%`, background: '#0B6B5C', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: '#AAA', marginTop: 2, textAlign: 'right' }}>
                  {Math.round(op.count/totalCampaigns*100)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Campaigns */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>🔥 Best Performing Campaigns</div>
              <div style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>Highest opener count — click to review content</div>
            </div>
            <Link href="/marketing/email-analytics" style={{ fontSize: 12, color: '#0B6B5C', textDecoration: 'none' }}>View all →</Link>
          </div>
          {topCampaigns.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#AAA', fontSize: 13 }}>No campaigns yet</div>
          ) : topCampaigns.map((c, i) => (
            <Link key={c.id} href="/marketing/email-analytics" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < topCampaigns.length - 1 ? '1px solid #F8F8F8' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{fmtDate(c.campaign_date)}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {c.total_opened} openers
                    {c.open_rate ? ` · ${c.open_rate}% open rate` : ''}
                    {c.total_sent > 0 ? ` of ${c.total_sent} sent` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.open_rate && c.open_rate >= 80 ? '#065F46' : '#0B6B5C' }}>
                    {c.open_rate ? `${c.open_rate}%` : `${c.total_opened}`}
                  </div>
                  <div style={{ fontSize: 10, color: '#AAA', fontWeight: 500 }}>
                    {c.open_rate ? 'OPEN RATE' : 'OPENERS'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Route breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {[{ label:'Week 1', facilities:w1, week:1 }, { label:'Week 2', facilities:w2, week:2 }].map(({ label, facilities, week }) => (
          <Link key={label} href={`/marketing/route-builder`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#0B6B5C')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
                <span>{label} Route</span>
                <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>{facilities.length} facilities · View →</span>
              </div>
              {DAYS.map(day => {
                const count = facilities.filter(f => f.assigned_day === day).length
                return (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #EEE', fontSize: 13 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { href:'/marketing/influence-centers', emoji:'🏥', title:'Influence Centers', desc:'48 target facilities' },
          { href:'/marketing/contacts',           emoji:'👥', title:'Contacts',          desc:`${contacts.length} named referrers` },
          { href:'/marketing/route-builder',      emoji:'🗺️', title:'Route Builder',     desc:'Week 1 & 2 schedule' },
          { href:'/marketing/activity-logger',    emoji:'✏️', title:'Activity Logger',   desc:'Log F / D / X visits' },
          { href:'/marketing/email-analytics',    emoji:'📊', title:'Email Analytics',   desc:'35 campaigns tracked' },
        ].map(({ href, emoji, title, desc }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', display: 'block' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#0B6B5C')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent field activity */}
      {recentLogs.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#333', margin: 0 }}>Recent field activity</h2>
            <Link href="/marketing/activity-logger" style={{ fontSize: 12, color: '#0B6B5C', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            {recentLogs.map((log, i) => {
              const ac = ACTIVITY[log.activity_type] || { label: log.activity_type, color: '#888', bg: '#F3F4F6' }
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px', borderBottom: i < recentLogs.length - 1 ? '1px solid #F0F0F0' : 'none', background: '#fff' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: ac.bg, color: ac.color, whiteSpace: 'nowrap' }}>
                    {ac.label}
                  </span>
                  <span style={{ fontSize: 13, color: '#333', flex: 1 }}>{getCenterName(log)}</span>
                  <span style={{ fontSize: 12, color: '#AAA', whiteSpace: 'nowrap' }}>
                    {fmtDate(log.visit_date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg, border, href }: { label:string; value:number; color:string; bg:string; border:string; href:string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '16px 10px', textAlign: 'center', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.07)' }}
        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color, opacity: 0.75, marginTop: 5, fontWeight: 500 }}>{label}</div>
      </div>
    </Link>
  )
}
