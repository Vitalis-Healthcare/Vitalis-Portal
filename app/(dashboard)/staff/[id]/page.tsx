import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

export default async function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const svc = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = viewer?.role === 'admin' || viewer?.role === 'supervisor' || viewer?.role === 'staff'
  if (!isAdmin) redirect('/dashboard')

  // Load the staff member's profile
  const { data: member } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, department, phone, position_name')
    .eq('id', id)
    .single()

  if (!member) return <div style={{padding:40,color:'#8FA0B0'}}>Caregiver not found. <a href='/staff'>← Back</a></div>

  // Load all their activity in parallel
  const [
    { data: enrollments },
    { data: credentials },
    { data: acknowledgments },
  ] = await Promise.all([
    svc.from('course_enrollments').select(`
      id, progress_pct, completed_at, due_date, enrolled_at,
      course:course_id(id, title, category, thumbnail_color)
    `).eq('user_id', id).order('enrolled_at', { ascending: false }),

    svc.from('staff_credentials').select(`
      id, status, issue_date, expiry_date, notes, uploaded_at,
      credential_type:credential_type_id(name)
    `).eq('user_id', id).order('uploaded_at', { ascending: false }),

    svc.from('policy_acknowledgements').select(`
      id, acknowledged_at, version,
      policy:policy_id(doc_id, title, domain)
    `).eq('user_id', id).order('acknowledged_at', { ascending: false }),
  ])

  const completedCourses = (enrollments || []).filter(e => e.completed_at)
  const pendingCourses   = (enrollments || []).filter(e => !e.completed_at)
  const currentCreds     = (credentials || []).filter(c => c.status === 'current')
  const expiringCreds    = (credentials || []).filter(c => c.status === 'expiring' || c.status === 'expired')

  const roleColor = (r: string) =>
    r === 'admin' ? '#1A2E44' : r === 'supervisor' ? '#0E7C7B' : r === 'staff' ? '#1D4ED8' : '#2A9D8F'
  const roleBg = (r: string) =>
    r === 'admin' ? '#EFF2F5' : r === 'supervisor' ? '#E6F4F4' : r === 'staff' ? '#EFF6FF' : '#E6F6F4'

  const card = { background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }
  const sectionTitle = { fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Back nav */}
      <Link href="/staff" style={{ fontSize: 13, color: '#0E7C7B', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Back to Caregiver Directory
      </Link>

      {/* Header card */}
      <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${roleColor(member.role)}, #F4A261)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#fff',
        }}>
          {member.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E44', margin: 0 }}>{member.full_name}</h1>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: roleBg(member.role), color: roleColor(member.role), textTransform: 'capitalize' as const }}>
              {member.role}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: member.status === 'active' ? '#E6F6F4' : '#EFF2F5', color: member.status === 'active' ? '#2A9D8F' : '#8FA0B0' }}>
              {member.status}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#8FA0B0', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>{member.email}</span>
            {member.position_name && <span>📋 {member.position_name}</span>}
            {member.department && <span>🏢 {member.department}</span>}
            {member.phone && <span>📞 {member.phone}</span>}
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          {[
            { label: 'Courses done', value: completedCourses.length, color: '#2A9D8F' },
            { label: 'Pending training', value: pendingCourses.length, color: pendingCourses.length > 0 ? '#F4A261' : '#2A9D8F' },
            { label: 'Credential alerts', value: expiringCreds.length, color: expiringCreds.length > 0 ? '#E63946' : '#2A9D8F' },
            { label: 'Policies signed', value: (acknowledgments || []).length, color: '#0E7C7B' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#8FA0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Training */}
        <div style={card}>
          <div style={sectionTitle}>
            <span>🎓 Training</span>
            <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 400 }}>{(enrollments || []).length} total</span>
          </div>

          {pendingCourses.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F4A261', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>In Progress</div>
              {pendingCourses.map((e: any) => (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#1A2E44' }}>{e.course?.title}</span>
                    <span style={{ fontSize: 11, color: '#8FA0B0' }}>{e.progress_pct}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: '#EFF2F5' }}>
                    <div style={{ height: '100%', width: `${e.progress_pct}%`, background: '#0E7C7B', borderRadius: 3 }} />
                  </div>
                  {e.due_date && <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 3 }}>Due {new Date(e.due_date).toLocaleDateString()}</div>}
                </div>
              ))}
              {completedCourses.length > 0 && <div style={{ borderTop: '1px solid #EFF2F5', marginTop: 12, marginBottom: 12 }} />}
            </>
          )}

          {completedCourses.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2A9D8F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Completed</div>
              {completedCourses.map((e: any) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A6070', marginBottom: 8 }}>
                  <CheckCircle size={13} color="#2A9D8F" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>{e.course?.title}</div>
                  <div style={{ fontSize: 11, color: '#8FA0B0' }}>{new Date(e.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
              ))}
            </>
          )}

          {(enrollments || []).length === 0 && (
            <p style={{ color: '#8FA0B0', fontSize: 13 }}>No courses assigned yet.</p>
          )}
        </div>

        {/* Credentials */}
        <div style={card}>
          <div style={sectionTitle}>
            <span>🪪 Credentials</span>
            <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 400 }}>{(credentials || []).length} on file</span>
          </div>

          {expiringCreds.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#E63946', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>⚠ Requires Attention</div>
              {expiringCreds.map((c: any) => {
                const expDays = c.expiry_date ? Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000) : null
                const col = c.status === 'expiring' ? '#F4A261' : '#E63946'
                return (
                  <div key={c.id} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${col}40`, borderLeft: `3px solid ${col}`, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44' }}>{c.credential_type?.name}</div>
                    <div style={{ fontSize: 11, color: col, marginTop: 3 }}>
                      {c.status === 'expired' ? '✗ Expired' : expDays !== null ? `⚠ Expires in ${expDays} days` : 'Expiring soon'}
                      {c.expiry_date && ` · ${new Date(c.expiry_date).toLocaleDateString()}`}
                    </div>
                  </div>
                )
              })}
              {currentCreds.length > 0 && <div style={{ borderTop: '1px solid #EFF2F5', marginTop: 12, marginBottom: 12 }} />}
            </>
          )}

          {currentCreds.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A6070', marginBottom: 8 }}>
              <CheckCircle size={13} color="#2A9D8F" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{c.credential_type?.name}</div>
              {c.expiry_date && <div style={{ fontSize: 11, color: '#8FA0B0' }}>Exp. {new Date(c.expiry_date).toLocaleDateString()}</div>}
            </div>
          ))}

          {(credentials || []).length === 0 && <p style={{ color: '#8FA0B0', fontSize: 13 }}>No credentials on file.</p>}
        </div>
      </div>

      {/* Policies Acknowledged */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={sectionTitle}>
          <span>📋 Policies & Procedures Acknowledged</span>
          <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 400 }}>{(acknowledgments || []).length} signed</span>
        </div>

        {(acknowledgments || []).length === 0 ? (
          <p style={{ color: '#8FA0B0', fontSize: 13 }}>No policies acknowledged yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {(acknowledgments as any[]).map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #EFF2F5' }}>
                <CheckCircle size={14} color="#2A9D8F" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.policy?.title}</div>
                  <div style={{ fontSize: 11, color: '#8FA0B0', marginTop: 2 }}>
                    {a.policy?.doc_id} · v{a.version} · {new Date(a.acknowledged_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
