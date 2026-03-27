import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, Lock, Play } from 'lucide-react'
import ProgrammeAssignModal from './ProgrammeAssignModal'
import RequestEnrollmentButton from './RequestEnrollmentButton'

export default async function ProgrammeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  const { data: programme } = await svc
    .from('programmes').select('*').eq('slug', slug).single()
  if (!programme) notFound()

  const { data: tracks } = await svc
    .from('tracks')
    .select('*')
    .eq('programme_id', programme.id)
    .order('order_index')

  const { data: modules } = await svc
    .from('courses')
    .select('id, lms_module_id, track_id, title, badge, status, estimated_minutes, order_index, thumbnail_color, description')
    .eq('programme_id', programme.id)
    .order('order_index')

  // My pending enrollment requests for this programme
  const { data: myRequest } = !isAdmin ? await svc
    .from('enrollment_requests')
    .select('status')
    .eq('user_id', user?.id || '')
    .eq('programme_id', programme?.id || '')
    .in('status', ['pending'])
    .maybeSingle() : { data: null }

  // My enrollment in this programme
  const { data: myProgEnrollment } = await svc
    .from('programme_enrollments')
    .select('id, status, completed_at, due_date')
    .eq('programme_id', programme.id)
    .eq('user_id', user.id)
    .maybeSingle()

  // My individual module enrollments
  const { data: myModEnrollments } = await svc
    .from('course_enrollments')
    .select('course_id, progress_pct, completed_at')
    .eq('user_id', user.id)

  const myModMap = Object.fromEntries((myModEnrollments||[]).map(e => [e.course_id, e]))

  // For admin: programme enrollment counts
  const { data: progEnrollments } = isAdmin ? await svc
    .from('programme_enrollments')
    .select('user_id, completed_at')
    .eq('programme_id', programme.id) : { data: [] }

  // For admin: all staff for assignment
  const { data: allStaff } = isAdmin ? await svc
    .from('profiles').select('id, full_name, role').order('full_name') : { data: [] }

  const enrolledUserIds = new Set((progEnrollments||[]).map((e: any) => e.user_id))
  const unassignedStaff = (allStaff||[]).filter((s: any) => !enrolledUserIds.has(s.id))

  // Group modules by track
  const modulesByTrack: Record<string, typeof modules> = {}
  for (const m of modules||[]) {
    if (!m.track_id) continue
    if (!modulesByTrack[m.track_id]) modulesByTrack[m.track_id] = []
    modulesByTrack[m.track_id]!.push(m)
  }

  const allMods = modules || []
  const completedCount = allMods.filter(m => myModMap[m.id]?.completed_at).length
  const progPct = allMods.length > 0 ? Math.round((completedCount / allMods.length) * 100) : 0

  const badgeLabel = (b: string) =>
    b === 'mandatory' ? 'Mandatory' : b === 'core' ? 'Core' : 'Skill-building'
  const badgeColor = (b: string) =>
    b === 'mandatory' ? '#E63946' : b === 'core' ? '#457B9D' : '#0F6E56'
  const badgeBg = (b: string) =>
    b === 'mandatory' ? '#FDE8E9' : b === 'core' ? '#EBF4FF' : '#E6F4F0'

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* Back */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/lms" style={{ color: '#8FA0B0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={14} /> All Programmes
        </Link>
      </div>

      {/* Programme header */}
      <div style={{
        background: `linear-gradient(135deg, #1A2E44 0%, ${tracks?.[0]?.colour_hex || '#0E7C7B'} 100%)`,
        borderRadius: 14, padding: '28px 32px', color: '#fff', marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
          {programme.frequency} · {programme.audience}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 8px' }}>{programme.title}</h1>
        {programme.subtitle && <p style={{ opacity: 0.8, fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>{programme.subtitle}</p>}

        <div style={{ display: 'flex', gap: 24, fontSize: 13, opacity: 0.85, flexWrap: 'wrap' }}>
          <span><Clock size={13} style={{ verticalAlign: 'middle' }} /> {programme.est_hours}h total</span>
          <span>📚 {programme.total_modules} modules</span>
          <span>🎯 {programme.pass_mark}% pass mark</span>
          {programme.cert_on_completion && <span>🏆 Certificate on completion</span>}
          {isAdmin && <span>👥 {(progEnrollments||[]).length} enrolled</span>}
        </div>

        {/* Staff progress bar */}
        {!isAdmin && myProgEnrollment && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>Your progress</span>
              <span style={{ fontWeight: 700 }}>{progPct}% · {completedCount}/{allMods.length} modules</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 8 }}>
              <div style={{ width: `${progPct}%`, background: '#fff', borderRadius: 10, height: 8, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Admin: assign controls */}
      {isAdmin && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: '#4A6070' }}>
            <strong style={{ color: '#1A2E44' }}>{(progEnrollments||[]).length}</strong> staff enrolled ·{' '}
            <strong style={{ color: '#2A9D8F' }}>{(progEnrollments||[]).filter((e: any) => e.completed_at).length}</strong> completed
          </div>
          <ProgrammeAssignModal
            programmeId={programme.id}
            programmeName={programme.title}
            moduleIds={(modules||[]).map(m => m.id)}
            unassignedStaff={unassignedStaff || []}
          />
        </div>
      )}

      {/* Caregiver: enroll button */}
      {!isAdmin && (
        <div style={{ marginBottom: 20 }}>
          <RequestEnrollmentButton
            programmeId={programme.id}
            programmeName={programme.title}
            hasPending={!!myRequest}
            isEnrolled={!!myProgEnrollment}
          />
        </div>
      )}

      {/* Tracks + modules */}
      {(tracks||[]).map(track => {
        const trackMods = modulesByTrack[track.id] || []

        return (
          <div key={track.id} style={{ marginBottom: 24 }}>
            {/* Track header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: '10px 10px 0 0',
              background: `${track.colour_hex}18`, borderBottom: `3px solid ${track.colour_hex}`
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: track.colour_hex, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{track.title}</h3>
                {track.description && <p style={{ fontSize: 12, color: '#8FA0B0', margin: '2px 0 0' }}>{track.description}</p>}
              </div>
              <span style={{ fontSize: 12, color: '#8FA0B0' }}>{trackMods.length} modules</span>
            </div>

            {/* Modules in track */}
            <div style={{ border: '1px solid #EFF2F5', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden', background: '#fff' }}>
              {trackMods.map((mod, i) => {
                const myEnroll = myModMap[mod.id]
                const isLive = mod.status === 'published'
                const isDone = !!myEnroll?.completed_at
                const isStarted = myEnroll && !isDone
                const canAccess = !isAdmin && isLive && !!myEnroll

                return (
                  <div key={mod.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < trackMods.length - 1 ? '1px solid #EFF2F5' : 'none',
                    background: isDone ? '#FAFFFE' : '#fff'
                  }}>
                    {/* Status icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? '#E6F6F4' : isStarted ? '#FEF3EA' : isLive ? '#EFF2F5' : '#F8FAFB',
                      fontSize: 16
                    }}>
                      {isDone ? '✓' : isStarted ? '▶' : isLive ? '○' : '🔒'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isLive || isAdmin ? '#1A2E44' : '#8FA0B0' }}>
                          {mod.title}
                        </span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: badgeBg(mod.badge||''), color: badgeColor(mod.badge||'')
                        }}>
                          {badgeLabel(mod.badge||'')}
                        </span>
                        {isAdmin && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                            background: mod.status === 'published' ? '#E6F6F4' : '#EFF2F5',
                            color: mod.status === 'published' ? '#2A9D8F' : '#8FA0B0'
                          }}>
                            {mod.status === 'published' ? '🟢 Live' : '🔴 Not ready'}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: '#8FA0B0', display: 'flex', gap: 12 }}>
                        <span><Clock size={10} style={{ verticalAlign: 'middle' }} /> {mod.estimated_minutes}min</span>
                        {isStarted && myEnroll && (
                          <span style={{ color: '#F4A261', fontWeight: 600 }}>{myEnroll.progress_pct}% complete</span>
                        )}
                        {isDone && <span style={{ color: '#2A9D8F', fontWeight: 600 }}>✓ Completed</span>}
                      </div>

                      {/* Progress bar for in-progress modules */}
                      {isStarted && myEnroll && (
                        <div style={{ marginTop: 6, background: '#EFF2F5', borderRadius: 10, height: 4, maxWidth: 200 }}>
                          <div style={{ width: `${myEnroll.progress_pct}%`, background: '#F4A261', borderRadius: 10, height: 4 }} />
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div style={{ flexShrink: 0 }}>
                      {isAdmin ? (
                        <Link href={`/lms/courses/${mod.id}/edit`}>
                          <button style={{
                            padding: '7px 14px', borderRadius: 8, border: '1px solid #D1D9E0',
                            background: '#fff', color: '#4A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                          }}>
                            Edit Content
                          </button>
                        </Link>
                      ) : canAccess ? (
                        <Link href={`/lms/courses/${mod.id}/take`}>
                          <button style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none',
                            background: isDone ? '#E6F6F4' : '#0E7C7B',
                            color: isDone ? '#2A9D8F' : '#fff',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer'
                          }}>
                            {isDone ? '✓ Review' : isStarted ? '▶ Continue' : '▶ Start'}
                          </button>
                        </Link>
                      ) : !isLive ? (
                        <span style={{ fontSize: 11, color: '#CBD5E0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Lock size={11} /> Coming soon
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#CBD5E0' }}>Not assigned</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
