import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default async function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewer } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = viewer?.role === 'admin' || viewer?.role === 'supervisor' || viewer?.role === 'staff'
  if (!isAdmin) redirect('/dashboard')

  // Service role bypasses RLS to read any profile
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )

  const { data: member, error: memberError } = await admin
    .from('profiles')
    .select('id, full_name, email, role, status, department, phone')
    .eq('id', id)
    .single()

  if (!member) {
    return (
      <div style={{ padding: 40 }}>
        <Link href="/staff" style={{ color: '#0E7C7B', fontWeight: 600, textDecoration: 'none' }}>← Back to Caregiver Directory</Link>
        <p style={{ color: '#8FA0B0', marginTop: 20 }}>Profile not found.</p>
        {memberError && <p style={{ color: '#E63946', fontSize: 12 }}>Error: {memberError.message}</p>}
      </div>
    )
  }

  const [enrollRes, credRes, ackRes] = await Promise.all([
    admin.from('course_enrollments')
      .select('id, progress_pct, completed_at, due_date, assigned_at, course:courses(id, title, category)')
      .eq('user_id', id)
      .order('assigned_at', { ascending: false }),
    admin.from('staff_credentials')
      .select('id, status, issue_date, expiry_date, does_not_expire, credential_type:credential_types(name)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    admin.from('policy_acknowledgements')
      .select('id, acknowledged_at, version, policy:policies(id, title, category)')
      .eq('user_id', id)
      .order('acknowledged_at', { ascending: false }),
  ])

  const enrollments     = enrollRes.data  || []
  const credentials     = credRes.data    || []
  const acknowledgments = ackRes.data     || []

  const completedCourses = enrollments.filter((e: any) => e.completed_at)
  const pendingCourses   = enrollments.filter((e: any) => !e.completed_at)
  const currentCreds     = credentials.filter((c: any) => c.status === 'current')
  const alertCreds       = credentials.filter((c: any) => c.status === 'expiring' || c.status === 'expired')

  const roleColor = (r: string) => r === 'admin' ? '#1A2E44' : r === 'supervisor' ? '#0E7C7B' : r === 'staff' ? '#1D4ED8' : '#2A9D8F'
  const roleBg    = (r: string) => r === 'admin' ? '#EFF2F5' : r === 'supervisor' ? '#E6F4F4' : r === 'staff' ? '#EFF6FF' : '#E6F6F4'
  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link href="/staff" style={{ fontSize: 13, color: '#0E7C7B', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Back to Caregiver Directory
      </Link>

      {/* Header */}
      <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${roleColor(member.role)}, #F4A261)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
          {member.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{member.full_name}</h1>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: roleBg(member.role), color: roleColor(member.role), textTransform: 'capitalize' }}>{member.role}</span>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: member.status === 'active' ? '#E6F6F4' : '#EFF2F5', color: member.status === 'active' ? '#2A9D8F' : '#8FA0B0' }}>{member.status}</span>
          </div>
          <div style={{ fontSize: 13, color: '#8FA0B0', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>{member.email}</span>
            {member.department && <span>🏢 {member.department}</span>}
            {member.phone && <span>📞 {member.phone}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Courses done',    value: completedCourses.length, color: '#2A9D8F' },
            { label: 'In progress',     value: pendingCourses.length,   color: pendingCourses.length > 0 ? '#F4A261' : '#2A9D8F' },
            { label: 'Cred. alerts',    value: alertCreds.length,       color: alertCreds.length > 0 ? '#E63946' : '#2A9D8F' },
            { label: 'Policies signed', value: acknowledgments.length,  color: '#0E7C7B' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Training */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14 }}>🎓 Training <span style={{ fontWeight: 400, color: '#8FA0B0', fontSize: 12 }}>({enrollments.length})</span></div>
          {enrollments.length === 0 && <p style={{ color: '#8FA0B0', fontSize: 13, margin: 0 }}>No courses assigned yet.</p>}
          {pendingCourses.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F4A261', textTransform: 'uppercase', marginBottom: 8 }}>In Progress</div>
            {(pendingCourses as any[]).map(e => (
              <div key={e.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#1A2E44' }}>{e.course?.title}</span>
                  <span style={{ fontSize: 11, color: '#8FA0B0' }}>{e.progress_pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#EFF2F5' }}>
                  <div style={{ height: '100%', width: `${e.progress_pct}%`, background: '#0E7C7B', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </>}
          {completedCourses.length > 0 && <>
            {pendingCourses.length > 0 && <div style={{ borderTop: '1px solid #EFF2F5', margin: '12px 0' }} />}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2A9D8F', textTransform: 'uppercase', marginBottom: 8 }}>Completed</div>
            {(completedCourses as any[]).map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A6070', marginBottom: 8 }}>
                <CheckCircle size={13} color="#2A9D8F" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{e.course?.title}</div>
                <div style={{ fontSize: 11, color: '#8FA0B0' }}>{new Date(e.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
            ))}
          </>}
        </div>

        {/* Credentials */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14 }}>🪪 Credentials <span style={{ fontWeight: 400, color: '#8FA0B0', fontSize: 12 }}>({credentials.length})</span></div>
          {credentials.length === 0 && <p style={{ color: '#8FA0B0', fontSize: 13, margin: 0 }}>No credentials on file.</p>}
          {alertCreds.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E63946', textTransform: 'uppercase', marginBottom: 8 }}>⚠ Requires Attention</div>
            {(alertCreds as any[]).map(c => {
              const days = c.expiry_date ? Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000) : null
              const col = c.status === 'expiring' ? '#F4A261' : '#E63946'
              return (
                <div key={c.id} style={{ padding: '10px 12px', borderRadius: 8, borderLeft: `3px solid ${col}`, background: `${col}10`, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>{c.credential_type?.name}</div>
                  <div style={{ fontSize: 11, color: col, marginTop: 3 }}>{c.status === 'expired' ? 'Expired' : `Expires in ${days} days`}{c.expiry_date && ` · ${new Date(c.expiry_date).toLocaleDateString()}`}</div>
                </div>
              )
            })}
            {currentCreds.length > 0 && <div style={{ borderTop: '1px solid #EFF2F5', margin: '12px 0' }} />}
          </>}
          {(currentCreds as any[]).map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A6070', marginBottom: 8 }}>
              <CheckCircle size={13} color="#2A9D8F" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{c.credential_type?.name}</div>
              {c.does_not_expire ? <span style={{ fontSize: 11, color: '#2A9D8F' }}>No expiry</span> : c.expiry_date && <div style={{ fontSize: 11, color: '#8FA0B0' }}>Exp. {new Date(c.expiry_date).toLocaleDateString()}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Policies */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14 }}>📋 Policies Acknowledged <span style={{ fontWeight: 400, color: '#8FA0B0', fontSize: 12 }}>({acknowledgments.length})</span></div>
        {acknowledgments.length === 0
          ? <p style={{ color: '#8FA0B0', fontSize: 13, margin: 0 }}>No policies acknowledged yet.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {(acknowledgments as any[]).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #EFF2F5' }}>
                  <CheckCircle size={14} color="#2A9D8F" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.policy?.title}</div>
                    <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>v{a.version} · {new Date(a.acknowledged_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
