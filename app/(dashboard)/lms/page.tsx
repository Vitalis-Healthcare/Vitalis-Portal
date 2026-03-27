import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import EnrollmentRequestQueue from './EnrollmentRequestQueue'
import { CheckCircle, Clock, BookOpen, Users, Lock } from 'lucide-react'

export default async function LMSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const svc = createServiceClient()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user?.id||'').single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  // Fetch all programmes with their tracks and modules
  const { data: programmes } = await svc
    .from('programmes')
    .select('*')
    .order('id')

  const { data: tracks } = await svc
    .from('tracks')
    .select('*')
    .order('order_index')

  const { data: modules } = await svc
    .from('courses')
    .select('id, lms_module_id, programme_id, track_id, title, badge, status, estimated_minutes, order_index, thumbnail_color')
    .not('programme_id', 'is', null)
    .order('order_index')

  // Pending enrollment requests (admin: all, caregiver: own)
  const { data: enrollmentRequests } = await svc
    .from('enrollment_requests')
    .select('id, user_id, programme_id, course_id, status, request_message, created_at, caregiver:user_id(full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Caregiver: my pending/approved request IDs
  const { data: myRequests } = !isAdmin ? await svc
    .from('enrollment_requests')
    .select('programme_id, status')
    .eq('user_id', user?.id || '')
    .in('status', ['pending', 'approved']) : { data: [] }

  const myPendingProgIds  = new Set((myRequests || []).filter((r: any) => r.status === 'pending').map((r: any) => r.programme_id))
  const myApprovedProgIds = new Set((myRequests || []).filter((r: any) => r.status === 'approved').map((r: any) => r.programme_id))

  // Staff: my programme enrollments
  const { data: myProgEnrollments } = await svc
    .from('programme_enrollments')
    .select('programme_id, status, completed_at')
    .eq('user_id', user?.id||'')

  // Staff: my individual module enrollments
  const { data: myModEnrollments } = await svc
    .from('course_enrollments')
    .select('course_id, progress_pct, completed_at')
    .eq('user_id', user?.id||'')

  const myProgIds = new Set((myProgEnrollments||[]).map(e => e.programme_id))
  const myModMap = Object.fromEntries((myModEnrollments||[]).map(e => [e.course_id, e]))

  // Count stats for admin
  const { count: totalEnrollments } = await svc
    .from('programme_enrollments').select('*', { count:'exact', head:true })
  const { count: completedEnrollments } = await svc
    .from('programme_enrollments').select('*', { count:'exact', head:true }).not('completed_at','is',null)

  // Group tracks by programme, modules by track
  const tracksByProg: Record<string, typeof tracks> = {}
  const modulesByTrack: Record<string, typeof modules> = {}
  for (const t of tracks||[]) {
    if (!tracksByProg[t.programme_id]) tracksByProg[t.programme_id] = []
    tracksByProg[t.programme_id]!.push(t)
  }
  for (const m of modules||[]) {
    if (!m.track_id) continue
    if (!modulesByTrack[m.track_id]) modulesByTrack[m.track_id] = []
    modulesByTrack[m.track_id]!.push(m)
  }

  const badgeLabel = (b: string) =>
    b === 'mandatory' ? 'Mandatory' : b === 'core' ? 'Core' : 'Skill-building'
  const badgeColor = (b: string) =>
    b === 'mandatory' ? '#E63946' : b === 'core' ? '#457B9D' : '#8FA0B0'

  const statusLight = (s: string) =>
    s === 'published' ? '🟢' : s === 'in_production' ? '🟡' : '🔴'

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Training & LMS</h1>
          <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>
            {isAdmin ? 'Manage training programmes and track caregiver progress' : 'Your assigned training programmes and courses'}
          </p>
        </div>
        {isAdmin && (enrollmentRequests||[]).length > 0 && (
          <div style={{ background:'#EBF4FF', border:'1px solid #457B9D', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#457B9D' }}>
            {(enrollmentRequests||[]).length} enrollment request{(enrollmentRequests||[]).length !== 1 ? 's' : ''} pending review
          </div>
        )}
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28, className:'lms-stat-grid' }}>
          {[
            { label:'Programmes', value:(programmes||[]).length, icon:<BookOpen size={18}/>, color:'#0E7C7B' },
            { label:'Total Modules', value:(modules||[]).length, icon:<BookOpen size={18}/>, color:'#2A9D8F' },
            { label:'Programme Enrolments', value:totalEnrollments??0, icon:<Users size={18}/>, color:'#1A2E44' },
            { label:'Completions', value:completedEnrollments??0, icon:<CheckCircle size={18}/>, color:'#2A9D8F' },
          ].map((s,i)=>(
            <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ color:s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin: Enrollment Request Queue */}
      {isAdmin && (enrollmentRequests||[]).length > 0 && (
        <EnrollmentRequestQueue requests={enrollmentRequests||[]} />
      )}

      {/* Programme cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {(programmes||[]).map(prog => {
          const progTracks = tracksByProg[prog.id] || []
          const allModules = progTracks.flatMap(t => modulesByTrack[t.id] || [])
          const liveCount = allModules.filter(m => m.status === 'published').length
          const isEnrolled = myProgIds.has(prog.id)

          // Staff: count completed modules in this programme
          const completedCount = allModules.filter(m => myModMap[m.id]?.completed_at).length
          const inProgressCount = allModules.filter(m => myModMap[m.id] && !myModMap[m.id]?.completed_at).length
          const progPct = allModules.length > 0 ? Math.round((completedCount / allModules.length) * 100) : 0

          const progStatusColor = prog.status === 'live' ? '#2A9D8F' : prog.status === 'in_production' ? '#F4A261' : '#8FA0B0'
          const progStatusBg = prog.status === 'live' ? '#E6F6F4' : prog.status === 'in_production' ? '#FEF3EA' : '#EFF2F5'
          const progStatusLabel = prog.status === 'live' ? 'Live' : prog.status === 'in_production' ? 'In Production' : 'Not Started'

          return (
            <div key={prog.id} style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden', border:'1px solid #EFF2F5' }}>
              {/* Programme header */}
              <div style={{ background: prog.status === 'not_started' ? '#F8FAFB' : `${progTracks[0]?.colour_hex || '#1A2E44'}18`, borderBottom:'1px solid #EFF2F5', padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <h2 style={{ fontSize:18, fontWeight:800, color:'#1A2E44', margin:0 }}>{prog.title}</h2>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:progStatusBg, color:progStatusColor }}>
                        {progStatusLabel}
                      </span>
                    </div>
                    {prog.subtitle && <p style={{ fontSize:13, color:'#4A6070', margin:'0 0 10px' }}>{prog.subtitle}</p>}
                    <div style={{ display:'flex', gap:12, fontSize:12, color:'#8FA0B0', flexWrap:'wrap' }}>
                      <span><Clock size={12} style={{ verticalAlign:'middle', marginRight:3 }}/>{prog.est_hours}h estimated</span>
                      <span><BookOpen size={12} style={{ verticalAlign:'middle', marginRight:3 }}/>{prog.total_modules} modules</span>
                      {prog.audience && <span>👥 {prog.audience}</span>}
                      {isAdmin && <span>{statusLight('draft')} {allModules.length - liveCount} not ready · {statusLight('published')} {liveCount} live</span>}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
                    {/* Staff: progress */}
                    {!isAdmin && isEnrolled && allModules.length > 0 && (
                      <div style={{ textAlign:'right', minWidth:100 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:'#0E7C7B' }}>{progPct}%</div>
                        <div style={{ fontSize:11, color:'#8FA0B0' }}>{completedCount}/{allModules.length} done</div>
                      </div>
                    )}
                    <Link href={`/lms/programmes/${prog.slug}`}>
                      <button style={{
                        padding:'9px 20px', borderRadius:8, border:'none', fontWeight:700, fontSize:13,
                        background: isAdmin ? '#1A2E44' : isEnrolled ? '#0E7C7B' : myPendingProgIds.has(prog.id) ? '#F4A261' : '#EFF2F5',
                        color: isAdmin || isEnrolled ? '#fff' : myPendingProgIds.has(prog.id) ? '#fff' : '#4A6070', cursor:'pointer'
                      }}>
                        {isAdmin ? 'Manage →' : isEnrolled ? 'Continue →' : myPendingProgIds.has(prog.id) ? '⏳ Pending Approval' : 'View Programme →'}
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Staff: progress bar */}
                {!isAdmin && isEnrolled && allModules.length > 0 && (
                  <div style={{ marginTop:14, background:'rgba(0,0,0,0.08)', borderRadius:10, height:6 }}>
                    <div style={{ width:`${progPct}%`, background:'#0E7C7B', borderRadius:10, height:6, transition:'width 0.4s' }}/>
                  </div>
                )}
              </div>

              {/* Tracks preview */}
              <div style={{ padding:'16px 24px', display:'flex', gap:10, flexWrap:'wrap' }}>
                {progTracks.map(track => {
                  const trackMods = modulesByTrack[track.id] || []
                  const trackLive = trackMods.filter(m => m.status === 'published').length
                  const trackDone = trackMods.filter(m => myModMap[m.id]?.completed_at).length

                  return (
                    <div key={track.id} style={{
                      padding:'8px 14px', borderRadius:8, border:`1px solid ${track.colour_hex}33`,
                      background:`${track.colour_hex}0D`, display:'flex', alignItems:'center', gap:8
                    }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:track.colour_hex, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#1A2E44' }}>
                          {track.title.replace(/^Track \d+ — /, '')}
                        </div>
                        <div style={{ fontSize:11, color:'#8FA0B0' }}>
                          {isAdmin
                            ? `${trackMods.length} modules · ${trackLive} live`
                            : `${trackMods.length} modules${trackDone > 0 ? ` · ${trackDone} done` : ''}`
                          }
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legacy non-LMS courses — admin only */}
      {isAdmin && (() => {
        return null // Legacy courses hidden for now — accessible via direct URL
      })()}
    </div>
  )
}
