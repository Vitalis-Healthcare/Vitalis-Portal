import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, Users, Clock } from 'lucide-react'

export default async function LMSPage() {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      enrollments:course_enrollments(count),
      completions:course_enrollments(count)
    `)
    .order('created_at', { ascending: false })

  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title, status, category, estimated_minutes, thumbnail_color, created_at')
    .order('updated_at', { ascending: false })

  const { count: totalEnrollments } = await supabase
    .from('course_enrollments')
    .select('*', { count:'exact', head:true })

  const { count: completions } = await supabase
    .from('course_enrollments')
    .select('*', { count:'exact', head:true })
    .not('completed_at', 'is', null)

  const categories = ['All', ...Array.from(new Set((allCourses||[]).map(c=>c.category)))]

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Training & LMS</h1>
          <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Build courses, assign training, and track completions</p>
        </div>
        <Link href="/lms/courses/new">
          <button style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'10px 20px', background:'#0E7C7B', color:'#fff',
            border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'
          }}>
            <Plus size={16}/> New Course
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Total Courses', value:(allCourses?.length??0), icon:<BookOpen size={18}/>, color:'#0E7C7B' },
          { label:'Total Enrollments', value:(totalEnrollments??0), icon:<Users size={18}/>, color:'#2A9D8F' },
          { label:'Completions', value:(completions??0), icon:<Clock size={18}/>, color:'#1A2E44' },
        ].map((s,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ color:s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:28, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Course grid */}
      {(allCourses?.length ?? 0) === 0 ? (
        <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
          <h3 style={{ fontSize:18, fontWeight:700, color:'#1A2E44', marginBottom:8 }}>No courses yet</h3>
          <p style={{ color:'#8FA0B0', marginBottom:24 }}>Create your first training course to get started.</p>
          <Link href="/lms/courses/new">
            <button style={{ padding:'10px 24px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Create First Course
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {allCourses?.map((c,i)=>(
            <Link key={c.id} href={`/lms/courses/${c.id}`} style={{ textDecoration:'none' }}>
              <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1px solid #EFF2F5', cursor:'pointer', transition:'box-shadow 0.2s' }}>
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
                    <span style={{ fontSize:12, color:'#8FA0B0' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
