import { createClient } from '@/lib/supabase/server'
import { GraduationCap, FileText, BadgeCheck, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: totalStaff },
    { count: publishedCourses },
    { count: publishedPolicies },
    { data: expiringCreds },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count:'exact', head:true }).eq('status','active'),
    supabase.from('courses').select('*', { count:'exact', head:true }).eq('status','published'),
    supabase.from('policies').select('*', { count:'exact', head:true }).eq('status','published'),
    supabase.from('staff_credentials').select('*').eq('status','expiring'),
  ])

  const { data: recentActivity } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Dashboard</h1>
        <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>
          Vitalis Healthcare Services · Compliance Overview
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Active Staff', value: totalStaff ?? 0, icon: <GraduationCap size={20}/>, color:'#0E7C7B' },
          { label:'Published Courses', value: publishedCourses ?? 0, icon: <GraduationCap size={20}/>, color:'#2A9D8F' },
          { label:'Live Policies', value: publishedPolicies ?? 0, icon: <FileText size={20}/>, color:'#1A2E44' },
          { label:'Expiring Credentials', value: expiringCreds?.length ?? 0, icon: <AlertTriangle size={20}/>, color: expiringCreds?.length ? '#E63946' : '#2A9D8F' },
        ].map((s,i) => (
          <div key={i} style={{
            background:'#fff', borderRadius:12, padding:'20px',
            borderLeft:`4px solid ${s.color}`,
            boxShadow:'0 1px 4px rgba(0,0,0,0.07)'
          }}>
            <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:32, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#8FA0B0', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Expiring credentials alert */}
      {(expiringCreds?.length ?? 0) > 0 && (
        <div style={{
          background:'#FEF3EA', border:'1px solid #F4A261', borderRadius:12,
          padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12
        }}>
          <AlertTriangle size={20} color="#F4A261" />
          <div>
            <strong style={{ color:'#1A2E44', fontSize:14 }}>{expiringCreds?.length} credential(s) expiring soon.</strong>
            <span style={{ color:'#8FA0B0', fontSize:14 }}> Review the <a href="/credentials" style={{ color:'#0E7C7B' }}>Credentials</a> module to take action.</span>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Quick Links */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>Quick Actions</h3>
          {[
            { href:'/lms/courses/new', label:'Create New Course', color:'#0E7C7B', desc:'Build training for your team' },
            { href:'/policies/new', label:'Add New Policy', color:'#1A2E44', desc:'Publish a policy for sign-off' },
            { href:'/credentials', label:'Review Credentials', color:'#2A9D8F', desc:'Check staff certification status' },
            { href:'/staff', label:'Manage Staff', color:'#F4A261', desc:'View all staff members' },
          ].map((a,i) => (
            <a key={i} href={a.href} style={{ textDecoration:'none' }}>
              <div style={{
                padding:'12px 16px', borderRadius:8, marginBottom:8,
                border:'1px solid #EFF2F5', display:'flex', alignItems:'center', gap:12,
                cursor:'pointer', transition:'all 0.15s'
              }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:a.color, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1A2E44' }}>{a.label}</div>
                  <div style={{ fontSize:12, color:'#8FA0B0' }}>{a.desc}</div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>Recent Activity</h3>
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((a,i) => (
              <div key={i} style={{
                padding:'10px 0', borderBottom:'1px solid #EFF2F5',
                fontSize:13, color:'#4A6070', display:'flex', justifyContent:'space-between', gap:12
              }}>
                <span>{a.action}</span>
                <span style={{ fontSize:11, color:'#8FA0B0', whiteSpace:'nowrap' }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div style={{ color:'#8FA0B0', fontSize:14, textAlign:'center', padding:'32px 0' }}>
              No activity yet. Start by creating a course or policy.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
