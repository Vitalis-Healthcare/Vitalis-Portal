'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X, Upload, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface CredType { id: string; name: string; validity_days: number }
interface StaffMember { id: string; full_name: string; role: string }
interface Cred {
  id: string; user_id: string; credential_type_id: string; issue_date: string;
  expiry_date?: string; document_url?: string; notes?: string; status: string;
  credential_type?: { name: string; validity_days: number }
}
interface Stats { current: number; expiring: number; expired: number; total: number }

export default function CredentialsClient({
  credTypes, staff, allCreds, stats
}: { credTypes: CredType[]; staff: StaffMember[]; allCreds: Cred[]; stats: Stats }) {
  const supabase = createClient()
  const router = useRouter()
  const [view, setView] = useState<'matrix'|'pending'|'alerts'|'add'>('matrix')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    user_id: '', credential_type_id: '', issue_date: '', expiry_date: '', notes: ''
  })

  const statusColor = (s: string) =>
    s === 'current' ? '#2A9D8F' : s === 'expiring' ? '#F4A261' : s === 'expired' ? '#E63946' : '#8FA0B0'
  const statusBg = (s: string) =>
    s === 'current' ? '#E6F6F4' : s === 'expiring' ? '#FEF3EA' : s === 'expired' ? '#FDE8E9' : '#EFF2F5'
  const statusIcon = (s: string) =>
    s === 'current' ? <CheckCircle size={12}/> : s === 'expiring' ? <Clock size={12}/> : <AlertTriangle size={12}/>

  const handleSave = async () => {
    if (!form.user_id || !form.credential_type_id || !form.issue_date) {
      alert('Please fill in all required fields.'); return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('staff_credentials').upsert({
      user_id: form.user_id,
      credential_type_id: form.credential_type_id,
      issue_date: form.issue_date,
      expiry_date: form.expiry_date || null,
      notes: form.notes || null,
      verified_by: user?.id
    }, { onConflict: 'user_id,credential_type_id' })
    if (!error) {
      const staffName = staff.find(s => s.id === form.user_id)?.full_name
      const credName = credTypes.find(c => c.id === form.credential_type_id)?.name
      await supabase.from('audit_log').insert({
        user_id: user?.id,
        action: `Credential recorded: ${staffName} — ${credName}`,
        entity_type: 'credential'
      })
      setForm({ user_id:'', credential_type_id:'', issue_date:'', expiry_date:'', notes:'' })
      setView('matrix')
      router.refresh()
    } else {
      alert('Error saving credential.')
    }
    setSaving(false)
  }

  // Build matrix: staff × cred types
  const credsByStaff: Record<string, Record<string, Cred>> = {}
  for (const c of allCreds) {
    if (!credsByStaff[c.user_id]) credsByStaff[c.user_id] = {}
    credsByStaff[c.user_id][c.credential_type_id] = c
  }

  const alerts = allCreds.filter(c => c.status === 'expiring' || c.status === 'expired')
    .map(c => ({
      ...c,
      staffName: staff.find(s => s.id === c.user_id)?.full_name || 'Unknown',
      credName: c.credential_type?.name || 'Unknown'
    }))
    .sort((a, b) => (a.expiry_date || '') < (b.expiry_date || '') ? -1 : 1)


  const pendingCreds = allCreds.filter(c => c.review_status === 'pending')
    .map(c => ({
      ...c,
      staffName: (c as any).submitter?.full_name || staff.find(s => s.id === c.user_id)?.full_name || 'Unknown',
      credName: c.credential_type?.name || 'Unknown'
    }))

  const handleReview = async (credId: string, userId: string, credTypeId: string, approve: boolean) => {
    const supabaseClient = createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    await supabaseClient.from('staff_credentials')
      .update({ review_status: approve ? 'approved' : 'rejected', verified_by: user?.id })
      .eq('id', credId)
    await supabaseClient.from('audit_log').insert({
      user_id: user?.id,
      action: `Credential ${approve ? 'approved' : 'rejected'} for user ${userId}`,
      entity_type: 'credential', entity_id: credId
    })
    router.refresh()
  }

  const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:600 as const, color:'#4A6070', display:'block' as const, marginBottom:5 }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Credentials & Compliance</h1>
          <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Track certifications, expiry dates, and document uploads</p>
        </div>
        <button onClick={()=>setView('add')} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
          <Plus size={16}/> Add Credential
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Active Staff', value:stats.total, color:'#1A2E44' },
          { label:'Current', value:stats.current, color:'#2A9D8F' },
          { label:'Expiring Soon', value:stats.expiring, color:'#F4A261' },
          { label:'Expired', value:stats.expired, color:'#E63946' },
        ].map((s,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:30, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div style={{ background:'#FDE8E9', border:'1px solid #E63946', borderRadius:10, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={18} color="#E63946"/>
          <span style={{ fontSize:14, color:'#1A2E44' }}>
            <strong>{alerts.filter(a=>a.status==='expired').length} expired</strong> and{' '}
            <strong>{alerts.filter(a=>a.status==='expiring').length} expiring soon</strong>.{' '}
            <button onClick={()=>setView('alerts')} style={{ background:'none', border:'none', color:'#E63946', fontWeight:700, cursor:'pointer', fontSize:14, textDecoration:'underline', padding:0 }}>View alerts →</button>
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {([
          { key: 'matrix', label: 'Credential Matrix' },
          { key: 'pending', label: `Pending Review${pendingCreds.length > 0 ? ` (${pendingCreds.length})` : ''}` },
          { key: 'alerts', label: `Alerts (${alerts.length})` },
          { key: 'add', label: 'Add Credential' },
        ] as const).map(v=>(
          <button key={v.key} onClick={()=>setView(v.key as any)} style={{
            padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: view===v.key ? (v.key === 'pending' && pendingCreds.length > 0 ? '#457B9D' : '#0E7C7B') : '#EFF2F5',
            color: view===v.key ? '#fff' : '#4A6070',
            position: 'relative' as const
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Matrix view */}
      {view === 'matrix' && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:700 }}>
            <thead>
              <tr style={{ background:'#F8FAFB' }}>
                <th style={{ textAlign:'left', padding:'10px 14px', color:'#8FA0B0', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5' }}>Staff Member</th>
                <th style={{ textAlign:'left', padding:'10px 14px', color:'#8FA0B0', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5' }}>Role</th>
                {credTypes.slice(0,6).map(ct=>(
                  <th key={ct.id} style={{ textAlign:'center', padding:'10px 8px', color:'#8FA0B0', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid #EFF2F5', maxWidth:90 }}>
                    {ct.name.replace(' Certificate','').replace(' Certification','').replace(' Check','').replace(' Test','').replace(' License','')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:'40px', color:'#8FA0B0', fontSize:14 }}>No staff members yet. Add staff in Settings.</td></tr>
              ) : staff.map(s=>(
                <tr key={s.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                  <td style={{ padding:'12px 14px', fontWeight:600, color:'#1A2E44' }}>{s.full_name}</td>
                  <td style={{ padding:'12px 14px', color:'#8FA0B0', textTransform:'capitalize', fontSize:12 }}>{s.role}</td>
                  {credTypes.slice(0,6).map(ct=>{
                    const cred = credsByStaff[s.id]?.[ct.id]
                    if (!cred) return (
                      <td key={ct.id} style={{ padding:'10px 8px', textAlign:'center' }}>
                        <span style={{ fontSize:11, color:'#D1D9E0' }}>—</span>
                      </td>
                    )
                    const expDays = cred.expiry_date
                      ? Math.ceil((new Date(cred.expiry_date).getTime() - Date.now()) / 86400000)
                      : null
                    return (
                      <td key={ct.id} style={{ padding:'8px 6px', textAlign:'center' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700, color:statusColor(cred.status), background:statusBg(cred.status) }}>
                          {statusIcon(cred.status)}
                          {expDays !== null ? (expDays < 0 ? 'Expired' : `${expDays}d`) : '✓'}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Pending review view */}
      {view === 'pending' && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          {pendingCreds.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#8FA0B0' }}>
              <CheckCircle size={40} color="#2A9D8F" style={{ margin:'0 auto 12px', display:'block' }}/>
              <strong style={{ fontSize:16, color:'#1A2E44' }}>No pending submissions</strong>
              <p style={{ marginTop:4, fontSize:14 }}>All credentials have been reviewed.</p>
            </div>
          ) : pendingCreds.map((c,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'flex-start', padding:'16px 0', borderBottom:'1px solid #EFF2F5', gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#EBF4FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>📋</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#1A2E44' }}>{c.staffName}</div>
                <div style={{ fontSize:13, color:'#4A6070', marginTop:2 }}>{c.credName}</div>
                <div style={{ fontSize:12, color:'#8FA0B0', marginTop:4, display:'flex', gap:16 }}>
                  <span>Issued: {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : '—'}</span>
                  {c.expiry_date && <span>Expires: {new Date(c.expiry_date).toLocaleDateString()}</span>}
                </div>
                {c.submitted_notes && (
                  <div style={{ fontSize:12, color:'#457B9D', marginTop:4, background:'#EBF4FF', padding:'4px 10px', borderRadius:6, display:'inline-block' }}>
                    Note: {c.submitted_notes}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button
                  onClick={() => handleReview(c.id, c.user_id, c.credential_type_id, true)}
                  style={{ padding:'7px 16px', background:'#E6F6F4', border:'none', borderRadius:8, fontSize:13, fontWeight:700, color:'#2A9D8F', cursor:'pointer' }}>
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReview(c.id, c.user_id, c.credential_type_id, false)}
                  style={{ padding:'7px 16px', background:'#FDE8E9', border:'none', borderRadius:8, fontSize:13, fontWeight:700, color:'#E63946', cursor:'pointer' }}>
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts view */}
      {view === 'alerts' && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#8FA0B0' }}>
              <CheckCircle size={40} color="#2A9D8F" style={{ margin:'0 auto 12px', display:'block' }}/>
              <strong style={{ fontSize:16, color:'#1A2E44' }}>All credentials current!</strong>
              <p style={{ marginTop:4, fontSize:14 }}>No expired or expiring credentials.</p>
            </div>
          ) : alerts.map((a,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', padding:'14px 0', borderBottom:'1px solid #EFF2F5', gap:16 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:statusColor(a.status), flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, color:'#1A2E44' }}>{a.staffName}</div>
                <div style={{ fontSize:13, color:'#8FA0B0' }}>{a.credName}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, color:'#1A2E44' }}>{a.expiry_date ? new Date(a.expiry_date).toLocaleDateString() : 'No expiry'}</div>
                <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, color:statusColor(a.status), background:statusBg(a.status) }}>
                  {a.status === 'expired' ? 'Expired' : 'Expiring Soon'}
                </span>
              </div>
              <button onClick={()=>{setForm(f=>({...f, user_id:a.user_id, credential_type_id:a.credential_type_id}));setView('add')}}
                style={{ padding:'7px 14px', background:'#EFF2F5', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#4A6070' }}>
                Update
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add credential form */}
      {view === 'add' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', maxWidth:560 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>Add / Update Credential</h2>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Staff Member *</label>
            <select value={form.user_id} onChange={e=>setForm(f=>({...f,user_id:e.target.value}))} style={inputStyle}>
              <option value="">Select staff member…</option>
              {staff.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Credential Type *</label>
            <select value={form.credential_type_id} onChange={e=>setForm(f=>({...f,credential_type_id:e.target.value}))} style={inputStyle}>
              <option value="">Select credential type…</option>
              {credTypes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Issue Date *</label>
              <input type="date" value={form.issue_date} onChange={e=>setForm(f=>({...f,issue_date:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={e=>setForm(f=>({...f,expiry_date:e.target.value}))} style={inputStyle}/>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Card number, issuing body…" style={inputStyle}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setView('matrix')} style={{ padding:'10px 20px', background:'#EFF2F5', border:'none', borderRadius:8, fontSize:14, fontWeight:600, color:'#4A6070', cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px', background:'#0E7C7B', border:'none', borderRadius:8, fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', opacity:saving?0.7:1 }}>
              {saving ? 'Saving…' : 'Save Credential'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
