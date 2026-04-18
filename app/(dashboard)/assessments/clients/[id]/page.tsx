// app/(dashboard)/assessments/clients/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ClientDetailView from './ClientDetailView'

function normRel<T>(rel: T | T[] | null): T | null {
  if (rel === null || rel === undefined) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  const { data: profile } = await db
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['admin', 'supervisor', 'nurse'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch client
  const { data: client } = await db
    .from('assessment_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // Nurse scope: allow if assigned to ANY active schedule for this client
  if (profile.role === 'nurse') {
    const { data: nurseScheds } = await db
      .from('assessment_schedules')
      .select('nurse_id')
      .eq('client_id', id)
      .eq('is_active', true)
    const isAssigned = (nurseScheds ?? []).some(s => s.nurse_id === user.id)
    if (!isAssigned) redirect('/assessments/clients')
  }

  const scheduleSelect = `
    id, cadence_days, is_active, nurse_id, plan_type, created_at,
    nurse:profiles!nurse_id(id, full_name, email)
  `

  // Fetch clinical and EP schedules separately
  const [{ data: clinicalRaw }, { data: epRaw }] = await Promise.all([
    db.from('assessment_schedules')
      .select(scheduleSelect)
      .eq('client_id', id)
      .eq('is_active', true)
      .eq('plan_type', 'clinical')
      .maybeSingle(),
    db.from('assessment_schedules')
      .select(scheduleSelect)
      .eq('client_id', id)
      .eq('is_active', true)
      .eq('plan_type', 'ep_annual')
      .maybeSingle(),
  ])

  const clinicalSchedule = clinicalRaw
    ? { ...clinicalRaw, nurse: normRel(clinicalRaw.nurse as any) }
    : null

  const epSchedule = epRaw
    ? { ...epRaw, nurse: normRel(epRaw.nurse as any) }
    : null

  // Fetch all assessments — schedule_id included so view can derive plan type
  const { data: assessments } = await db
    .from('assessments')
    .select(`
      id, scheduled_date, completed_date, status, assessment_type,
      triggers_reset, notes, created_at, schedule_id, is_initial,
      nurse:profiles!nurse_id(id, full_name),
      completer:profiles!completed_by(id, full_name)
    `)
    .eq('client_id', id)
    .order('scheduled_date', { ascending: false })

  const normalizedAssessments = (assessments ?? []).map(a => ({
    ...a,
    nurse:     normRel(a.nurse as any),
    completer: normRel((a as any).completer),
  }))

  // Fetch all nurses for assignment dropdown
  const { data: nursesRaw } = await db
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['nurse', 'admin', 'supervisor'])
    .eq('status', 'active')
    .order('full_name')

  return (
    <ClientDetailView
      client={client}
      clinicalSchedule={clinicalSchedule}
      epSchedule={epSchedule}
      assessments={normalizedAssessments}
      nurses={nursesRaw ?? []}
      currentUserId={user.id}
      currentUserRole={profile.role}
    />
  )
}
