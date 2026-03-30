import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // ── 1. All influence centers ──────────────────────────────────────────────
    const { data: centers } = await svc
      .from('marketing_influence_centers')
      .select('id, name, heat_status, go_no_go, assigned_day, week_group, org_type')
      .order('name')

    // ── 2. All contacts ───────────────────────────────────────────────────────
    const { data: contacts } = await svc
      .from('marketing_contacts')
      .select('id, name, email, influence_center_id, role')
      .order('name')

    // ── 3. All visit logs ─────────────────────────────────────────────────────
    const { data: logs } = await svc
      .from('marketing_visit_logs')
      .select('id, influence_center_id, contact_id, visit_date, activity_type, logged_by')
      .order('visit_date', { ascending: false })

    // ── 4. All email campaigns ────────────────────────────────────────────────
    const { data: campaigns } = await svc
      .from('marketing_email_campaigns')
      .select('id, campaign_date, total_opened, open_rate')
      .order('campaign_date', { ascending: false })

    // ── 5. All email opens (external only) ────────────────────────────────────
    const { data: opens } = await svc
      .from('marketing_email_opens')
      .select('campaign_id, contact_id, email_address')
      .not('email_address', 'ilike', '%vitalishealthcare.com')

    const totalCampaigns = (campaigns || []).length
    if (totalCampaigns === 0) {
      return NextResponse.json({ contacts: [], facilities: [], summary: {} })
    }

    // ── Build email open count per contact_id and per email_address ──────────
    const opensByContactId: Record<string, number> = {}
    const opensByEmail: Record<string, { count: number; name: string }> = {}

    for (const o of opens || []) {
      if (o.contact_id) {
        opensByContactId[o.contact_id] = (opensByContactId[o.contact_id] || 0) + 1
      }
      if (o.email_address) {
        if (!opensByEmail[o.email_address]) opensByEmail[o.email_address] = { count: 0, name: '' }
        opensByEmail[o.email_address].count++
      }
    }

    // ── Build visit stats per facility ────────────────────────────────────────
    const visitsByFacility: Record<string, {
      total: number; fCount: number; dCount: number; xCount: number
      lastVisit: string | null; lastFVisit: string | null
    }> = {}

    for (const log of logs || []) {
      const fid = log.influence_center_id
      if (!visitsByFacility[fid]) {
        visitsByFacility[fid] = { total: 0, fCount: 0, dCount: 0, xCount: 0, lastVisit: null, lastFVisit: null }
      }
      const v = visitsByFacility[fid]
      v.total++
      if (log.activity_type === 'F') { v.fCount++; if (!v.lastFVisit) v.lastFVisit = log.visit_date }
      if (log.activity_type === 'D') v.dCount++
      if (log.activity_type === 'X') v.xCount++
      if (!v.lastVisit) v.lastVisit = log.visit_date
    }

    // ── Compute CONTACT engagement scores ────────────────────────────────────
    // Score = email_engagement (0-50) + facility_heat (0-20) + recent_visit (0-30)
    const contactScores = (contacts || [])
      .filter(c => c.email) // only contacts with emails are scoreable
      .map(c => {
        const emailOpens = opensByContactId[c.id] || 0
        const emailPct = totalCampaigns > 0 ? emailOpens / totalCampaigns : 0
        const emailScore = Math.round(emailPct * 50) // 0-50

        const center = (centers || []).find(x => x.id === c.influence_center_id)
        const heatScore = center?.heat_status === 'hot' ? 20 : center?.heat_status === 'cold' ? 10 : 0

        const visits = visitsByFacility[c.influence_center_id || '']
        let visitScore = 0
        if (visits?.lastVisit) {
          const daysSince = Math.floor((today.getTime() - new Date(visits.lastVisit + 'T12:00:00').getTime()) / 86400000)
          visitScore = daysSince <= 14 ? 30 : daysSince <= 30 ? 20 : daysSince <= 60 ? 10 : 5
        }

        const totalScore = emailScore + heatScore + visitScore
        const daysSinceVisit = visits?.lastVisit
          ? Math.floor((today.getTime() - new Date(visits.lastVisit + 'T12:00:00').getTime()) / 86400000)
          : null

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          role: c.role,
          facility_id: c.influence_center_id,
          facility_name: center?.name || '—',
          facility_heat: center?.heat_status || 'cold',
          email_opens: emailOpens,
          email_pct: Math.round(emailPct * 100),
          email_score: emailScore,
          heat_score: heatScore,
          visit_score: visitScore,
          total_score: totalScore,
          days_since_facility_visit: daysSinceVisit,
          last_facility_visit: visits?.lastVisit || null,
        }
      })
      .sort((a, b) => b.total_score - a.total_score)

    // ── Compute FACILITY relationship matrix ──────────────────────────────────
    const facilityMatrix = (centers || []).map(c => {
      const visits = visitsByFacility[c.id] || { total: 0, fCount: 0, dCount: 0, xCount: 0, lastVisit: null, lastFVisit: null }
      const facilityContacts = (contacts || []).filter(ct => ct.influence_center_id === c.id && ct.email)
      const facilityEmailOpens = facilityContacts.reduce((sum, ct) => sum + (opensByContactId[ct.id] || 0), 0)
      const maxPossibleOpens = facilityContacts.length * totalCampaigns
      const facilityEmailPct = maxPossibleOpens > 0 ? Math.round(facilityEmailOpens / maxPossibleOpens * 100) : 0

      const fRate = (visits.fCount + visits.dCount) > 0
        ? Math.round(visits.fCount / (visits.fCount + visits.dCount) * 100)
        : 0

      const daysSinceVisit = visits.lastVisit
        ? Math.floor((today.getTime() - new Date(visits.lastVisit + 'T12:00:00').getTime()) / 86400000)
        : null

      const daysSinceFVisit = visits.lastFVisit
        ? Math.floor((today.getTime() - new Date(visits.lastFVisit + 'T12:00:00').getTime()) / 86400000)
        : null

      // Relationship health: hot + recent F visit + high email engagement = healthy
      let health: 'strong' | 'building' | 'stalled' | 'cold' | 'dead' = 'cold'
      if (c.heat_status === 'dead') health = 'dead'
      else if (c.heat_status === 'hot' && visits.fCount > 0 && facilityEmailPct >= 50) health = 'strong'
      else if (visits.total > 2 && fRate >= 20) health = 'building'
      else if (visits.total > 0 && (daysSinceVisit || 999) > 30) health = 'stalled'
      else if (visits.total > 0) health = 'building'

      return {
        id: c.id,
        name: c.name,
        org_type: c.org_type,
        heat_status: c.heat_status,
        assigned_day: c.assigned_day,
        week_group: c.week_group,
        go_no_go: c.go_no_go,
        total_visits: visits.total,
        f_visits: visits.fCount,
        d_visits: visits.dCount,
        f_rate: fRate,
        last_visit: visits.lastVisit,
        last_f_visit: visits.lastFVisit,
        days_since_visit: daysSinceVisit,
        days_since_f_visit: daysSinceFVisit,
        contact_count: facilityContacts.length,
        email_opens_total: facilityEmailOpens,
        email_engagement_pct: facilityEmailPct,
        relationship_health: health,
      }
    }).sort((a, b) => {
      // Sort: strong first, then building, stalled, cold, dead
      const order = { strong: 0, building: 1, stalled: 2, cold: 3, dead: 4 }
      return order[a.relationship_health] - order[b.relationship_health]
    })

    // ── Summary stats ─────────────────────────────────────────────────────────
    const allLogs = logs || []
    const fTotal = allLogs.filter(l => l.activity_type === 'F').length
    const dTotal = allLogs.filter(l => l.activity_type === 'D').length
    const overallFRate = (fTotal + dTotal) > 0 ? Math.round(fTotal / (fTotal + dTotal) * 100) : 0

    // Unmatched openers — email opens with no contact_id
    const unmatchedEmails = new Set<string>()
    for (const o of opens || []) {
      if (!o.contact_id) unmatchedEmails.add(o.email_address)
    }

    // Facilities with no F-visit in last 60 days (but are on route)
    const needsFVisit = facilityMatrix.filter(f =>
      f.heat_status !== 'dead' && f.go_no_go &&
      (f.days_since_f_visit === null || f.days_since_f_visit > 60)
    ).slice(0, 8)

    const summary = {
      total_campaigns: totalCampaigns,
      overall_f_rate: overallFRate,
      total_f_visits: fTotal,
      total_d_visits: dTotal,
      total_visits: allLogs.length,
      unmatched_openers: unmatchedEmails.size,
      needs_f_visit: needsFVisit.map(f => ({ id: f.id, name: f.name, days_since_f: f.days_since_f_visit })),
    }

    return NextResponse.json({
      contacts: contactScores.slice(0, 20),
      facilities: facilityMatrix,
      summary,
    })
  } catch (err) {
    console.error('GET /api/marketing/intelligence:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
