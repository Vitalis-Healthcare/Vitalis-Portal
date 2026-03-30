import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

async function requireAdminOrSupervisor() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('id, role').eq('id', user.id).single()
    if (!['admin', 'supervisor'].includes(profile?.role || '')) return null
    return { user, svc }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { svc } = auth
    const { data, error } = await svc
      .from('marketing_email_campaigns')
      .select('*, opens:marketing_email_opens(id, email_address, name_in_csv, contact_id)')
      .order('campaign_date', { ascending: false })
    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (err) {
    console.error('GET /api/marketing/email-analytics:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { svc } = auth
    const body = await req.json()

    const { campaign_date, subject, total_sent, openers } = body
    // openers: [{ email_address, name_in_csv }]
    if (!campaign_date || !openers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Match opener emails against marketing_contacts
    const emails = openers.map((o: any) => o.email_address.toLowerCase().trim()).filter(Boolean)
    const { data: matchedContacts } = emails.length > 0
      ? await svc.from('marketing_contacts').select('id, email').not('email', 'is', null)
      : { data: [] }

    const emailToContactId: Record<string, string> = {}
    for (const c of matchedContacts || []) {
      if (c.email) emailToContactId[c.email.toLowerCase().trim()] = c.id
    }

    const matchedCount = openers.filter((o: any) =>
      emailToContactId[o.email_address.toLowerCase().trim()]
    ).length

    // Create campaign record
    const { data: campaign, error: campErr } = await svc
      .from('marketing_email_campaigns')
      .insert({
        campaign_date,
        subject: subject || null,
        total_sent: total_sent || 0,
        total_opened: openers.length,
        open_rate: total_sent > 0 ? Math.round((openers.length / total_sent) * 10000) / 100 : null,
      })
      .select()
      .single()
    if (campErr) throw campErr

    // Insert open records
    if (openers.length > 0) {
      const openRows = openers.map((o: any) => ({
        campaign_id: campaign.id,
        email_address: o.email_address,
        name_in_csv: o.name_in_csv || null,
        contact_id: emailToContactId[o.email_address.toLowerCase().trim()] || null,
        opened_at: o.opened_at || null,
      }))
      const { error: openErr } = await svc.from('marketing_email_opens').insert(openRows)
      if (openErr) throw openErr
    }

    return NextResponse.json({
      data: campaign,
      matched: matchedCount,
      unmatched: openers.length - matchedCount,
    })
  } catch (err) {
    console.error('POST /api/marketing/email-analytics:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { svc } = auth
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await svc.from('marketing_email_campaigns').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/marketing/email-analytics:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
