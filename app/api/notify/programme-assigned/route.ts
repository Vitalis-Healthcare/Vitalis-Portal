import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'Vitalis Portal <notifications@vitalishealthcare.com>'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://vitalis-portal.vercel.app'

export async function POST(request: Request) {
  if (!RESEND_API_KEY) return NextResponse.json({ success: true, sent: 0 })
  const { programmeName, programmeId, userIds, dueDate } = await request.json()
  const supabase = await createClient()
  const { data: staffProfiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
  if (!staffProfiles?.length) return NextResponse.json({ success: true, sent: 0 })

  let sent = 0
  for (const staff of staffProfiles) {
    if (!staff.email) continue
    const dueLine = dueDate ? `<p style="color:#4A6070;font-size:14px;">This programme is due by <strong>${new Date(dueDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</strong>.</p>` : ''
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#F8FAFC;padding:32px 16px;"><div style="background:#1A2E44;padding:20px 28px;border-radius:10px 10px 0 0;"><h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">Vitalis Healthcare</h1></div><div style="background:#fff;padding:28px 32px;border:1px solid #E2E8F0;border-radius:0 0 10px 10px;"><h2 style="font-size:18px;color:#1A2E44;margin:0 0 16px;">New Training Programme Assigned</h2><p style="color:#4A6070;font-size:14px;">Hi <strong>${staff.full_name}</strong>,</p><p style="color:#4A6070;font-size:14px;">You have been enrolled in a training programme:</p><div style="background:#EFF2F5;border-left:4px solid #0E7C7B;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:16px;"><div style="font-size:16px;font-weight:700;color:#1A2E44;">${programmeName}</div></div>${dueLine}<a href="${PORTAL_URL}/lms" style="display:inline-block;padding:11px 26px;background:#0E7C7B;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">View My Training ↗</a></div></div>`
    const res = await fetch('https://api.resend.com/emails', { method:'POST', headers:{'Authorization':`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'}, body: JSON.stringify({ from:FROM_EMAIL, to:[staff.email], subject:`New Training Assigned: ${programmeName}`, html }) })
    if (res.ok) sent++
  }
  return NextResponse.json({ success: true, sent })
}
