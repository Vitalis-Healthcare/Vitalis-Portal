import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, Users, Clock, CheckCircle } from 'lucide-react'

export default async function LMSPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id||'').single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title, status, category, estimated_minutes, thumbnail_color, created_at')
    .order('updated_at', { ascending: false })

  const { count: totalEnrollments } = await supabase
    .from('course_enrollments').select('*', { count:'exact', head:true })

  const { count: completions } = await supabase
    .from('course_enrollments').select('*', { count:'exact', head:true }).not('completed_at', 'is', null)

  // My enrollments (for staff view)
  const { data: myEnrollments } = await supabase
    .from('course_enrollments')
    .select('*, course:courses(id, title, category, thumbnail_color, estimated_minutes, status)')
    .eq('user_id', user?.id||'')
    .order('assigned_at', { ascending: false })

  const myActive = (myEnrollments||[]).filter(e => !e.completed_at)
  const myDone = (myEnrollments||[]).filter(e => e.completed_at)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Training & LMS</h1>
          <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Build courses, assign training, and track completions</p>
        </div>
        {isAdmin && (
          <Link href="/lms/courses/new">
            <button style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              <Plus size={16}/> New Course
            </button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Total Courses', value:(allCourses?.length??0), icon:<BookOpen size={18}/>, color:'#0E7C7B' },
          { label:'Total Enrollments', value:(totalEnrollments??0), icon:<Users size={18}/>, color:'#2A9D8F' },
          { label:'Completions', value:(completions??0), icon:<CheckCircle size={18}/>, color:'#1A2E44' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ color:s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:28, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* My Training — shown when user has enrollments */}
      {(myEnrollments||[]).length > 0 && (
        <div style={{ marginBottom:32 }}>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#1A2E44', marginBottom:14 }}>My Training</h2>

          {myActive.length > 0 && (
            <>
              <div style={{ fontSize:12, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>In Progress / Assigned</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                {myActive.map((e:any) => (
                  <Link key={e.id} href={`/lms/courses/${e.course?.id}/take`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#fff', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #EFF2F5', cursor:'pointer' }}>
                      <div style={{ background:e.course?.thumbnail_color||'#0E7C7B', padding:'14px 16px', color:'#fff' }}>
                        <div style={{ fontSize:10, fontWeight:700, opacity:0.7, textTransform:'uppercase', letterSpacing:1 }}>{e.course?.category}</div>
                        <div style={{ fontSize:14, fontWeight:700, marginTop:3, lineHeight:1.3 }}>{e.course?.title}</div>
                      </div>
                      <div style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <div style={{ flex:1, background:'#EFF2F5', borderRadius:10, height:5 }}>
                            <div style={{ width:`${e.progress_pct||0}%`, background:'#0E7C7B', borderRadius:10, height:5, transition:'width 0.3s' }}/>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:'#4A6070' }}>{e.progress_pct||0}%</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:11, color:'#8FA0B0', display:'flex', alignItems:'center', gap:3 }}>
                            <Clock size={10}/> {e.course?.estimated_minutes} min
                          </span>
                          {e.due_date && (
                            <span style={{ fontSize:11, color: new Date(e.due_date) < new Date() ? '#E63946' : '#8FA0B0' }}>
                              Due {new Date(e.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {myDone.length > 0 && (
            <>
              <div style={{ fontSize:12, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Completed</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {myDone.map((e:any) => (
                  <Link key={e.id} href={`/lms/courses/${e.course?.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#fff', borderRadius:9, padding:'12px 16px', border:'1px solid #EFF2F5', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:12 }}>
                      <CheckCircle size={16} color='#2A9D8F'/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1A2E44' }}>{e.course?.title}</div>
                        <div style={{ fontSize:11, color:'#8FA0B0' }}>{e.course?.category}</div>
                      </div>
                      <span style={{ fontSize:11, color:'#2A9D8F', fontWeight:600 }}>
                        Completed {new Date(e.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* All Courses */}
      <div>
        <h2 style={{ fontSize:17, fontWeight:800, color:'#1A2E44', marginBottom:14 }}>
          {isAdmin ? 'All Courses' : 'Course Library'}
        </h2>
        {(allCourses?.length ?? 0) === 0 ? (
          <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#1A2E44', marginBottom:8 }}>No courses yet</h3>
            <p style={{ color:'#8FA0B0', marginBottom:24 }}>Create your first training course to get started.</p>
            {isAdmin && (
              <Link href="/lms/courses/new">
                <button style={{ padding:'10px 24px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Create First Course
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {(isAdmin ? allCourses : allCourses?.filter(c => c.status === 'published'))?.map((c) => (
              <Link key={c.id} href={`/lms/courses/${c.id}`} style={{ textDecoration:'none' }}>
                <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #EFF2F5', cursor:'pointer' }}>
                  <div style={{ background:c.thumbnail_color||'#0E7C7B', padding:'20px', color:'#fff' }}>
                    <div style={{ fontSize:10, fontWeight:700, opacity:0.7, textTransform:'uppercase', letterSpacing:1 }}>{c.category}</div>
                    <div style={{ fontSize:16, fontWeight:700, marginTop:4 }}>{c.title}</div>
                    <div style={{ fontSize:12, opacity:0.8, marginTop:4 }}>{c.estimated_minutes} min estimated</div>
                  </div>
                  <div style={{ padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{
                        padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600,
                        background: c.status==='published' ? '#E6F6F4' : '#EFF2F5',
                        color: c.status==='published' ? '#2A9D8F' : '#8FA0B0'
                      }}>{c.status==='published' ? 'Published' : 'Draft'}</span>
                      <span style={{ fontSize:12, color:'#8FA0B0' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
