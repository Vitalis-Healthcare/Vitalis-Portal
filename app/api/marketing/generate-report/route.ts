import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120 // 2 min timeout for AI + web search

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { period = 'monthly' } = await req.json().catch(() => ({}))
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // ── 1. Fetch all marketing data in parallel ───────────────────────────────
    const [
      { data: centers },
      { data: contacts },
      { data: logs },
      { data: campaigns },
      { data: opens },
      { data: referrals },
    ] = await Promise.all([
      svc.from('marketing_influence_centers').select('id, name, heat_status, assigned_day, week_group, org_type, notes, go_no_go').order('name'),
      svc.from('marketing_contacts').select('id, name, email, role, influence_center_id').order('name'),
      svc.from('marketing_visit_logs').select('id, influence_center_id, visit_date, activity_type, notes, logged_by, marketing_influence_centers(name)').order('visit_date', { ascending: false }),
      svc.from('marketing_email_campaigns').select('id, campaign_date, total_sent, total_opened, open_rate').order('campaign_date', { ascending: false }),
      svc.from('marketing_email_opens').select('email_address, contact_id, campaign_id').not('email_address', 'ilike', '%vitalishealthcare.com'),
      svc.from('marketing_referrals').select('id, influence_center_id, contact_id, referral_date, patient_initials, payer_source, outcome, non_accept_reason, notes, marketing_influence_centers(name), marketing_contacts(name)').order('referral_date', { ascending: false }).catch(() => ({ data: [] })),
    ])

    // ── 2. Compute key metrics ────────────────────────────────────────────────
    const totalVisits = (logs || []).length
    const fVisits = (logs || []).filter(l => l.activity_type === 'F').length
    const dVisits = (logs || []).filter(l => l.activity_type === 'D').length
    const fRate = (fVisits + dVisits) > 0 ? Math.round(fVisits / (fVisits + dVisits) * 100) : 0

    const hot = (centers || []).filter(c => c.heat_status === 'hot')
    const cold = (centers || []).filter(c => c.heat_status === 'cold')
    const dead = (centers || []).filter(c => c.heat_status === 'dead')

    const totalCampaigns = (campaigns || []).length
    const avgOpeners = totalCampaigns > 0
      ? Math.round((campaigns || []).reduce((s, c) => s + c.total_opened, 0) / totalCampaigns)
      : 0
    const ratedCampaigns = (campaigns || []).filter(c => c.open_rate && c.total_sent > 0)
    const avgOpenRate = ratedCampaigns.length > 0
      ? Math.round(ratedCampaigns.reduce((s, c) => s + (c.open_rate || 0), 0) / ratedCampaigns.length)
      : null
    const recentCampaigns = (campaigns || []).slice(0, 4)

    // Top openers
    const openerFreq: Record<string, { count: number; name: string; facility: string }> = {}
    for (const o of (opens || [])) {
      const contact = (contacts || []).find(c => c.id === o.contact_id)
      const center = contact ? (centers || []).find(x => x.id === contact.influence_center_id) : null
      if (!openerFreq[o.email_address]) {
        openerFreq[o.email_address] = { count: 0, name: contact?.name || o.email_address, facility: center?.name || 'Unknown' }
      }
      openerFreq[o.email_address].count++
    }
    const topOpeners = Object.values(openerFreq).sort((a, b) => b.count - a.count).slice(0, 8)

    // Referral summary
    const allReferrals = referrals as any[] || []
    const referralsByFacility: Record<string, { name: string; count: number; payers: string[] }> = {}
    for (const r of allReferrals) {
      const facName = r.marketing_influence_centers?.name || 'Unknown'
      if (!referralsByFacility[facName]) referralsByFacility[facName] = { name: facName, count: 0, payers: [] }
      referralsByFacility[facName].count++
      if (r.payer_source) referralsByFacility[facName].payers.push(r.payer_source)
    }
    const payersMissed = [...new Set(allReferrals.map((r: any) => r.payer_source).filter(Boolean))]
    const nonConvertedReasons = allReferrals.reduce((acc: Record<string, number>, r: any) => {
      if (r.non_accept_reason) acc[r.non_accept_reason] = (acc[r.non_accept_reason] || 0) + 1
      return acc
    }, {})

    // Facilities with no visits last 30 days
    const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30)
    const recentFacIds = new Set((logs || []).filter(l => new Date(l.visit_date) >= thirtyDaysAgo).map(l => l.influence_center_id))
    const unvisitedActive = (centers || []).filter(c => c.heat_status !== 'dead' && !recentFacIds.has(c.id))

    // ── 3. Build context for AI ───────────────────────────────────────────────
    const context = `
VITALIS HEALTHCARE MARKETING INTELLIGENCE BRIEF
Report Date: ${todayStr} | Period: ${period === 'monthly' ? 'Monthly' : 'Bi-Weekly'}
Prepared for: ${profile?.full_name || 'Leadership Team'}

═══════════════════════════════════════════════
INFLUENCE CENTER NETWORK
═══════════════════════════════════════════════
Total facilities: ${(centers || []).length} | Hot: ${hot.length} | Cold: ${cold.length} | Dead: ${dead.length}

HOT FACILITIES (Priority relationships):
${hot.map(c => `  • ${c.name} (Week ${c.week_group}, ${c.assigned_day || 'unassigned'})`).join('\n') || '  None currently'}

COLD FACILITIES (Active building):
${cold.slice(0, 10).map(c => `  • ${c.name} (Week ${c.week_group}, ${c.assigned_day || 'unassigned'})`).join('\n')}${cold.length > 10 ? `\n  ... and ${cold.length - 10} more` : ''}

DEAD FACILITIES (Written off — payer/barrier issues):
${dead.slice(0, 8).map(c => `  • ${c.name}`).join('\n')}${dead.length > 8 ? `\n  ... and ${dead.length - 8} more` : ''}

FACILITY INTELLIGENCE NOTES (selected):
${hot.concat(cold.slice(0, 5)).filter(c => c.notes).map(c => `  • ${c.name}: ${c.notes?.slice(0, 120)}`).join('\n') || '  No notes'}

═══════════════════════════════════════════════
FIELD VISIT ACTIVITY
═══════════════════════════════════════════════
Total visits logged: ${totalVisits}
Face-to-face (F): ${fVisits} | Drop-off (D): ${dVisits} | F-rate: ${fRate}%
Target F-rate per 52 Weeks Marketing methodology: 30%+
Gap to target: ${Math.max(0, 30 - fRate)}% below target

Most recent visits:
${(logs || []).slice(0, 10).map(l => {
  const name = Array.isArray(l.marketing_influence_centers) ? l.marketing_influence_centers[0]?.name : (l.marketing_influence_centers as any)?.name
  return `  ${l.visit_date} | ${l.activity_type} | ${name || 'Unknown'}`
}).join('\n')}

Active facilities NOT visited in last 30 days (${unvisitedActive.length}):
${unvisitedActive.slice(0, 8).map(c => `  • ${c.name} (${c.heat_status})`).join('\n')}${unvisitedActive.length > 8 ? `\n  ... and ${unvisitedActive.length - 8} more` : ''}

═══════════════════════════════════════════════
EMAIL CAMPAIGN PERFORMANCE (52 Weeks Marketing)
═══════════════════════════════════════════════
Total campaigns: ${totalCampaigns}
Average openers per blast: ${avgOpeners}
Average open rate: ${avgOpenRate != null ? `${avgOpenRate}%` : 'N/A (total sent unknown for all campaigns)'}

Recent campaign performance:
${recentCampaigns.map(c => `  ${c.campaign_date}: ${c.total_opened} openers${c.open_rate ? ` (${c.open_rate}% open rate)` : ''}`).join('\n')}

Top email engagers (external contacts, by campaign opens):
${topOpeners.map((o, i) => `  ${i + 1}. ${o.name} @ ${o.facility} — ${o.count}/${totalCampaigns} campaigns (${Math.round(o.count / totalCampaigns * 100)}%)`).join('\n')}

═══════════════════════════════════════════════
REFERRAL PIPELINE & ATTRIBUTION
═══════════════════════════════════════════════
Total referrals received: ${allReferrals.length}
Converted to clients: ${allReferrals.filter((r: any) => r.outcome === 'converted').length}
Not accepted: ${allReferrals.filter((r: any) => r.outcome === 'not_accepted').length}
Pending: ${allReferrals.filter((r: any) => r.outcome === 'pending').length}

Referrals by source facility:
${Object.values(referralsByFacility).sort((a, b) => b.count - a.count).map(f => `  • ${f.name}: ${f.count} referrals | Payers seen: ${[...new Set(f.payers)].join(', ') || 'Unknown'}`).join('\n') || '  No referrals recorded yet'}

Non-conversion reasons:
${Object.entries(nonConvertedReasons).map(([k, v]) => `  • ${k}: ${v} referral(s)`).join('\n') || '  None recorded'}

Payer sources encountered but not accepted:
${payersMissed.join(', ') || 'None recorded'}

KEY INSIGHT: The Autumn Lake network (Silver Spring + Arcola + Oak Manor) has sent the most referrals. All were declined on payer grounds (CareFirst, Wellpoint, Maryland Medicaid). Contracting with even one of these payers would unlock this pipeline immediately.

═══════════════════════════════════════════════
CONTACTS & REFERRERS
═══════════════════════════════════════════════
Total named contacts: ${(contacts || []).length}
Contacts with email: ${(contacts || []).filter(c => c.email).length}
`.trim()

    // ── 4. Call Anthropic API with web search ────────────────────────────────
    const reportPrompt = `You are a senior healthcare marketing strategist producing a ${period === 'monthly' ? 'monthly' : 'bi-weekly'} intelligence report for Vitalis Healthcare Services, a private-pay home care agency in Silver Spring, Maryland (RSA #3879R, operating under BCHD contracts).

Today's date: ${todayStr}

Here is the complete internal marketing data from Vitalis's portal:

${context}

Your task is to produce a comprehensive, well-structured strategic marketing report. The report should:

1. Use the internal data above as the foundation
2. Search the web for current intelligence on:
   - Maryland / Montgomery County home health industry trends
   - CareFirst, Wellpoint, and Maryland Medicaid home health contracting landscape
   - Senior care discharge planning trends in skilled nursing facilities
   - Competitor activity among private-pay home care agencies in Silver Spring / Montgomery County MD
   - Any regulatory changes affecting Maryland home health agencies in 2025-2026
   - Best practices in SNF-to-home-health referral relationship building

3. Synthesize both into strategic recommendations specific to Vitalis's situation

FORMAT the report with these exact sections, using markdown:

# Vitalis Healthcare Marketing Intelligence Report
## ${period === 'monthly' ? 'Monthly' : 'Bi-Weekly'} Report | ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

### Executive Summary
A 3-4 sentence snapshot of where things stand, what's working, and the single biggest opportunity.

### Marketing Activity Scorecard
Key metrics in a table format: visits, F-rate, email open rate, referrals received, conversion rate.

### Referral Source Performance
Analysis of which facilities are warm, which are producing referrals, and what's blocking conversion. Be specific about the Autumn Lake cluster and Complete Care Springbrook.

### Email Campaign Intelligence
Trend analysis of open rates, top engagers, and what the engagement data suggests about relationship warmth. Name the top contacts.

### Market Intelligence (Web Research)
What is happening in the Maryland home health and SNF discharge planning landscape right now that Vitalis should know about. Include findings from web search. Be specific to Maryland/Montgomery County where possible.

### The Payer Gap: Strategic Analysis
A focused section on the CareFirst/Wellpoint/Maryland Medicaid barrier. What would contracting with these payers require? What's the opportunity cost of not doing so? What are the alternatives?

### Strategic Recommendations
5-7 specific, prioritised recommendations. Each should have: the recommendation, the rationale, the expected impact, and the responsible party (Peace / Okezie / Dylan at 52 Weeks).

### Priority Actions for Next Period
A clear, numbered to-do list for the next ${period === 'monthly' ? '30' : '14'} days — specific enough that Peace can execute from this list in her coaching call with Dylan.

### Appendix: Facilities Requiring Attention
A table of facilities that haven't been visited recently, are stalled, or need a status review.

Be direct, specific, and data-driven. Avoid generic marketing advice — every recommendation should be grounded in Vitalis's actual data or the specific Maryland market context you find from web search.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: reportPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const data = await response.json()

    // Extract text from response (may include tool_use blocks)
    const reportText = data.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')

    // Count web searches used
    const webSearches = data.content.filter((b: any) => b.type === 'tool_use').length

    return NextResponse.json({
      report: reportText,
      generated_at: new Date().toISOString(),
      web_searches_used: webSearches,
      metrics: {
        total_visits: totalVisits,
        f_rate: fRate,
        total_campaigns: totalCampaigns,
        avg_openers: avgOpeners,
        avg_open_rate: avgOpenRate,
        total_referrals: allReferrals.length,
        hot_facilities: hot.length,
        cold_facilities: cold.length,
      }
    })
  } catch (err) {
    console.error('generate-report error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
