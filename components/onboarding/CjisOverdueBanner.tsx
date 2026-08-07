// components/onboarding/CjisOverdueBanner.tsx
//
// The part that beats forgetting.
//
// Email can be filtered, skimmed or delegated. This appears at the top of the
// page staff already open every morning, so the overdue CJIS is in front of
// the people who can resolve it whether or not anyone reads their inbox.
//
// Only from tier 2 (8 days past the expected date). Showing it on day one
// would make it wallpaper within a week, and a banner people have learned to
// look past is worse than no banner — it occupies the space a real alarm would
// need.
//
// Server component. Reads the same loader the sweep emails from.

import Link from 'next/link'
import { loadOverdueCjis, worstTier } from '@/lib/onboarding/overdue-cjis'

export default async function CjisOverdueBanner({ role }: { role: string }) {
  // Caregivers do not chase background checks and cannot act on this.
  if (!['admin', 'supervisor', 'staff'].includes(role)) return null

  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const all = await loadOverdueCjis(todayET)
  const loud = all.filter((o) => o.tier >= 2)
  if (loud.length === 0) return null

  const worst = worstTier(loud)
  const top = loud[0]
  const others = loud.length - 1

  return (
    <div style={{
      background: worst >= 3 ? '#7F1D1D' : '#9A3412',
      color: '#fff',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
      fontFamily: "'DM Sans','Segoe UI',Arial,sans-serif",
    }}>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, minWidth: 0 }}>
        <strong style={{ fontWeight: 800 }}>
          CJIS background check {loud.length === 1 ? 'is' : 'checks are'} overdue
        </strong>
        {' — '}
        {top.firstName} {top.lastName} by {top.daysOverdue} day{top.daysOverdue === 1 ? '' : 's'}
        {top.convertedProfileId ? ' (already working as a caregiver)' : ''}
        {others > 0 ? `, and ${others} other${others === 1 ? '' : 's'}` : ''}.
        {worst >= 3 ? ' This has been escalated to the Chairman.' : ''}
      </div>
      <Link href={`/candidates/${top.candidateId}/credentials`}
        style={{
          flexShrink: 0, padding: '7px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)',
          color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
        Resolve it
      </Link>
    </div>
  )
}
