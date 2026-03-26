import { createClient } from '@/lib/supabase/server'
import { GraduationCap, FileText, BadgeCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Use service role to bypass RLS — ensures admin role is always read correctly
  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )
  const { data: profile } = await adminClient.from('profiles').select('role, full_name').eq('id', user?.id||'').single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  if (isAdmin) {
    // ── Admin dashboard ─────────────────────────────────────
    const [
      { count: totalStaff },
      { count: publishedCourses },
      { count: publishedPolicies },
      { data: expiringCreds },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count:'exact', head:true }).eq('status','active'),
      supabase.from('courses').select('*', { count:'exact', head:true }).eq('status','published'),
      supabase.from('policies').select('*', { count:'exact', head:true }).eq('status','published'),
      supabase.from('staff_credentials').select('*').eq('status','expiring'),
      supabase.from('audit_log').select('*').order('created_at', { ascending:false }).limit(8),
    ])

    return (
      <div>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Vitalis Healthcare Services · Compliance Overview</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          {[
            { label:'Active Staff', value: totalStaff ?? 0, icon: <GraduationCap size={20}/>, color:'#0E7C7B' },
            { label:'Published Courses', value: publishedCourses ?? 0, icon: <GraduationCap size={20}/>, color:'#2A9D8F' },
            { label:'Live Policies', value: publishedPolicies ?? 0, icon: <FileText size={20}/>, color:'#1A2E44' },
            { label:'Expiring Credentials', value: expiringCreds?.length ?? 0, icon: <AlertTriangle size={20}/>, color: (expiringCreds?.length ?? 0) > 0 ? '#E63946' : '#2A9D8F' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:12, padding:'20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:32, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#8FA0B0', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {(expiringCreds?.length ?? 0) > 0 && (
          <div style={{ background:'#FEF3EA', border:'1px solid #F4A261', borderRadius:12, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <AlertTriangle size={20} color="#F4A261"/>
            <div>
              <strong style={{ color:'#1A2E44', fontSize:14 }}>{expiringCreds?.length} credential(s) expiring soon.</strong>
              <span style={{ color:'#8FA0B0', fontSize:14 }}> Review the <a href="/credentials" style={{ color:'#0E7C7B' }}>Credentials</a> module to take action.</span>
            </div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>Quick Actions</h3>
            {[
              { href:'/lms/courses/new', label:'Create New Course', color:'#0E7C7B', desc:'Build training for your team' },
              { href:'/policies/new', label:'Add New Policy', color:'#1A2E44', desc:'Publish a policy for sign-off' },
              { href:'/credentials', label:'Review Credentials', color:'#2A9D8F', desc:'Check staff certification status' },
              { href:'/users', label:'Manage Staff', color:'#F4A261', desc:'Invite and manage team members' },
            ].map((a,i) => (
              <Link key={i} href={a.href} style={{ textDecoration:'none' }}>
                <div style={{ padding:'12px 16px', borderRadius:8, marginBottom:8, border:'1px solid #EFF2F5', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:a.color, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#1A2E44' }}>{a.label}</div>
                    <div style={{ fontSize:12, color:'#8FA0B0' }}>{a.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>Recent Activity</h3>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((a:any,i:number) => (
                <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid #EFF2F5', fontSize:13, color:'#4A6070', display:'flex', justifyContent:'space-between', gap:12 }}>
                  <span>{a.action}</span>
                  <span style={{ fontSize:11, color:'#8FA0B0', whiteSpace:'nowrap' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <div style={{ color:'#8FA0B0', fontSize:14, textAlign:'center', padding:'32px 0' }}>No activity yet. Start by creating a course or policy.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Staff / Caregiver dashboard ────────────────────────────
  const [
    { data: myEnrollments },
    { data: myPolicies },
    { data: myCreds },
  ] = await Promise.all([
    supabase.from('course_enrollments')
      .select('*, course:courses(id, title, category, thumbnail_color, estimated_minutes, status)')
      .eq('user_id', user?.id||'')
      .order('assigned_at', { ascending:false }),
    supabase.from('policy_acknowledgements')
      .select('*, policy:policies(id, title, version)')
      .eq('user_id', user?.id||''),
    supabase.from('staff_credentials')
      .select('*, credential_type:credential_types(name)')
      .eq('user_id', user?.id||''),
  ])

  const pendingCourses = (myEnrollments||[]).filter(e => !e.completed_at)
  const completedCourses = (myEnrollments||[]).filter(e => e.completed_at)
  const expiringMyCreds = (myCreds||[]).filter(c => c.status === 'expiring' || c.status === 'expired')
  const acknowledgedIds = new Set((myPolicies||[]).map((p:any) => p.policy_id))

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>
          Welcome, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Vitalis Healthcare Services · Your Compliance Dashboard</p>
      </div>

      {/* Personal stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Courses Assigned', value: (myEnrollments||[]).length, icon: <GraduationCap size={20}/>, color:'#0E7C7B' },
          { label:'Completed', value: completedCourses.length, icon: <CheckCircle size={20}/>, color:'#2A9D8F' },
          { label:'Credential Alerts', value: expiringMyCreds.length, icon: <AlertTriangle size={20}/>, color: expiringMyCreds.length > 0 ? '#E63946' : '#2A9D8F' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:32, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#8FA0B0', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Credential alerts */}
      {expiringMyCreds.length > 0 && (
        <div style={{ background:'#FDE8E9', border:'1px solid #E63946', borderRadius:12, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={20} color="#E63946"/>
          <div>
            <strong style={{ color:'#1A2E44', fontSize:14 }}>
              {expiringMyCreds.length} credential{expiringMyCreds.length > 1 ? 's' : ''} need{expiringMyCreds.length === 1 ? 's' : ''} attention:
            </strong>
            <span style={{ color:'#8FA0B0', fontSize:13 }}> {expiringMyCreds.map((c:any) => c.credential_type?.name).join(', ')}.</span>
            <Link href="/credentials" style={{ color:'#E63946', fontSize:13, marginLeft:6, fontWeight:600 }}>View →</Link>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* My Training */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', margin:0 }}>My Training</h3>
            <Link href="/lms" style={{ fontSize:12, color:'#0E7C7B', fontWeight:600, textDecoration:'none' }}>View all →</Link>
          </div>
          {pendingCourses.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'#8FA0B0', fontSize:14 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🎓</div>
              {(myEnrollments||[]).length === 0 ? 'No training assigned yet.' : 'All training complete! Great work.'}
            </div>
          ) : (
            pendingCourses.slice(0,4).map((e:any) => (
              <Link key={e.id} href={`/lms/courses/${e.course?.id}/take`} style={{ textDecoration:'none' }}>
                <div style={{ padding:'10px 12px', borderRadius:8, marginBottom:8, border:'1px solid #EFF2F5', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#1A2E44' }}>{e.course?.title}</span>
                    <span style={{ fontSize:11, color:'#8FA0B0', display:'flex', alignItems:'center', gap:3 }}>
                      <Clock size={10}/> {e.course?.estimated_minutes}m
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, background:'#EFF2F5', borderRadius:10, height:5 }}>
                      <div style={{ width:`${e.progress_pct||0}%`, background:'#0E7C7B', borderRadius:10, height:5, transition:'width 0.3s' }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:'#4A6070' }}>{e.progress_pct||0}%</span>
                  </div>
                  {e.due_date && (
                    <div style={{ fontSize:11, marginTop:4, color: new Date(e.due_date) < new Date() ? '#E63946' : '#8FA0B0' }}>
                      Due {new Date(e.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* My Credentials */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', margin:0 }}>My Credentials</h3>
            <Link href="/credentials" style={{ fontSize:12, color:'#0E7C7B', fontWeight:600, textDecoration:'none' }}>View all →</Link>
          </div>
          {(myCreds||[]).length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'#8FA0B0', fontSize:14 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
              No credentials on file yet.
            </div>
          ) : (
            (myCreds||[]).slice(0,5).map((c:any) => {
              const statusColor = c.status === 'current' ? '#2A9D8F' : c.status === 'expiring' ? '#F4A261' : '#E63946'
              const statusBg = c.status === 'current' ? '#E6F6F4' : c.status === 'expiring' ? '#FEF3EA' : '#FDE8E9'
              return (
                <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #EFF2F5' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1A2E44' }}>{c.credential_type?.name}</div>
                    <div style={{ fontSize:11, color:'#8FA0B0' }}>
                      {c.expiry_date ? `Expires ${new Date(c.expiry_date).toLocaleDateString()}` : 'No expiry'}
                    </div>
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:statusBg, color:statusColor, textTransform:'capitalize' }}>
                    {c.status}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
