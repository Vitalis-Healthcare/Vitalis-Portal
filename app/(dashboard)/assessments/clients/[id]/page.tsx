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

  // Nurse can only view their own clients
  if (profile.role === 'nurse') {
    const { data: sched } = await db
      .from('assessment_schedules')
      .select('nurse_id')
      .eq('client_id', id)
      .eq('is_active', true)
      .single()
    if (!sched || sched.nurse_id !== user.id) redirect('/assessments/clients')
  }

  // Fetch active schedule + nurse info
  const { data: scheduleRaw } = await db
    .from('assessment_schedules')
    .select(`
      id, cadence_days, is_active, nurse_id, created_at,
      nurse:profiles!nurse_id(id, full_name, email)
    `)
    .eq('client_id', id)
    .eq('is_active', true)
    .maybeSingle()

  const schedule = scheduleRaw
    ? {
        ...scheduleRaw,
        nurse: normRel(scheduleRaw.nurse as any),
      }
    : null

  // Fetch all assessments for this client, newest first
  const { data: assessments } = await db
    .from('assessments')
    .select(`
      id, scheduled_date, completed_date, status, assessment_type,
      triggers_reset, notes, created_at,
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

  // Fetch all nurses for reassignment dropdown
  const { data: nursesRaw } = await db
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['nurse', 'admin', 'supervisor'])
    .eq('status', 'active')
    .order('full_name')

  const nurses = nursesRaw ?? []

  return (
    <ClientDetailView
      client={client}
      schedule={schedule}
      assessments={normalizedAssessments}
      nurses={nurses}
      currentUserId={user.id}
      currentUserRole={profile.role}
    />
  )
}
