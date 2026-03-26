import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import StaffCredentialsCard from './StaffCredentialsCard'
import StaffReferencesCard from './StaffReferencesCard'
import StaffTrainingCard from './StaffTrainingCard'
import StaffAppraisalsCard from './StaffAppraisalsCard'

export default async function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const svc = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewer } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = viewer?.role === 'admin' || viewer?.role === 'supervisor' || viewer?.role === 'staff'
  if (!isAdmin) redirect('/dashboard')

  const { data: member } = await svc
    .from('profiles')
    .select('id, full_name, email, role, status, department, phone, position_name')
    .eq('id', id)
    .single()

  if (!member) return <div style={{ padding: 40, color: '#8FA0B0' }}>Caregiver not found. <a href='/staff'>← Back</a></div>

  // Load everything in parallel
  const [
    { data: enrollments },
    { data: credentials },
    { data: acknowledgments },
    { data: references },
    { data: appraisals },
    { data: credTypes },
    { data: programmes },
    { data: progEnrollments },
    { data: enrollmentRequests },
  ] = await Promise.all([
    svc.from('course_enrollments').select(`
      id, completed_at, due_date, assigned_at,
      course:course_id(id, title, category)
    `).eq('user_id', id).order('assigned_at', { ascending: false }),

    svc.from('staff_credentials').select(`
      id, status, issue_date, expiry_date, does_not_expire, not_applicable, notes, document_url,
      credential_type:credential_type_id(name)
    `).eq('user_id', id).order('issue_date', { ascending: false }),

    svc.from('policy_acknowledgements').select(`
      id, signed_at, version_signed,
      policy:policy_id(doc_id, title, domain)
    `).eq('user_id', id).order('signed_at', { ascending: false }),

    svc.from('caregiver_references')
      .select('id, slot, reference_type, referee_name, referee_email, referee_phone, referee_org, status, sent_at, received_at, reminder_count, submission:reference_submissions(submitted_at, overall_recommendation)')
      .eq('caregiver_id', id)
      .order('slot'),

    svc.from('appraisals')
      .select('id, status, appraisal_period, signed_at, sent_at, caregiver_signature, created_at, s_patient_care_duties, s_medications, s_vitals, s_attendance, s_judgment, s_confidentiality')
      .eq('caregiver_id', id)
      .order('created_at', { ascending: false }),

    svc.from('credential_types').select('id, name, validity_days').order('name'),

    svc.from('programmes').select('id, title, slug, est_hours, total_modules').eq('status', 'live').order('title'),

    svc.from('programme_enrollments').select('programme_id').eq('user_id', id),

    svc.from('enrollment_requests').select('id, programme_id, status, created_at')
      .eq('user_id', id).eq('status', 'pending'),
  ])

  const completedCourses  = (enrollments || []).filter(e => e.completed_at)
  const expiringCreds     = (credentials || []).filter(c => c.status === 'expiring' || c.status === 'expired')
  const receivedRefs      = (references || []).filter(r => r.status === 'received').length
  const enrolledProgIds   = (progEnrollments || []).map((e: any) => e.programme_id)

  const roleColor = (r: string) =>
    r === 'admin' ? '#1A2E44' : r === 'supervisor' ? '#0E7C7B' : r === 'staff' ? '#1D4ED8' : '#2A9D8F'
  const roleBg = (r: string) =>
    r === 'admin' ? '#EFF2F5' : r === 'supervisor' ? '#E6F4F4' : r === 'staff' ? '#EFF6FF' : '#E6F6F4'

  const card = { background: '#fff', borderRadius: 12, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>

      <Link href="/staff" style={{ fontSize: 13, color: '#0E7C7B', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Back to Caregiver Directory
      </Link>

      {/* Header */}
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
            { label: 'Training done',     value: completedCourses.length,              color: '#2A9D8F' },
            { label: 'Cred alerts',       value: expiringCreds.length,                 color: expiringCreds.length > 0 ? '#E63946' : '#2A9D8F' },
            { label: 'References',        value: `${receivedRefs}/3`,                  color: receivedRefs === 3 ? '#2A9D8F' : '#F4A261' },
            { label: 'Policies signed',   value: (acknowledgments || []).length,        color: '#0E7C7B' },
            { label: 'Appraisals',        value: (appraisals || []).filter(a => a.status === 'signed').length, color: '#8FA0B0' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 64 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#8FA0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1: Training + Credentials */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <StaffTrainingCard
          enrollments={enrollments || []}
          programmes={programmes || []}
          enrolledProgIds={enrolledProgIds}
          pendingRequests={enrollmentRequests || []}
          caregiverId={id}
          viewerRole={viewer?.role || 'staff'}
        />
        <StaffCredentialsCard
          credentials={credentials || []}
          credTypes={credTypes || []}
          caregiverId={id}
          memberName={member.full_name}
          viewerRole={viewer?.role || 'staff'}
        />
      </div>

      {/* Row 2: References + Appraisals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <StaffReferencesCard
          references={references || []}
          caregiverId={id}
          caregiverName={member.full_name}
          viewerRole={viewer?.role || 'staff'}
        />
        <StaffAppraisalsCard
          appraisals={appraisals || []}
          caregiverId={id}
          viewerRole={viewer?.role || 'staff'}
        />
      </div>

      {/* Row 3: Policies Acknowledged */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E44', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    {a.policy?.doc_id} · v{a.version_signed} · {new Date(a.signed_at).toLocaleDateString()}
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
