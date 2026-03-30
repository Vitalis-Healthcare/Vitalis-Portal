'use client'

  // ── Status filter toggle ─────────────────────────────────────────────────
  function StatusToggle({ value, onChange, counts }: {
    value: 'all' | 'active' | 'inactive'
    onChange: (v: 'all' | 'active' | 'inactive') => void
    counts: { all: number; active: number; inactive: number }
  }) {
    const opts = [
      { key: 'all',      label: 'All',      color: '#1A2E44', bg: '#EFF2F5' },
      { key: 'active',   label: 'Active',   color: '#0E7C7B', bg: '#E6F4F4' },
      { key: 'inactive', label: 'Inactive', color: '#8FA0B0', bg: '#F8F8F8' },
    ] as const
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {opts.map(o => (
          <button key={o.key} onClick={() => onChange(o.key)}
            style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${value === o.key ? o.color : '#E0E0E0'}`,
              background: value === o.key ? o.bg : '#fff', color: value === o.key ? o.color : '#AAA',
              fontSize: 12, fontWeight: value === o.key ? 700 : 500, cursor: 'pointer' }}>
            {o.label} ({counts[o.key]})
          </button>
        ))}
      </div>
    )
  }

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, AlertTriangle, CheckCircle, Clock, Upload, FileText, X } from 'lucide-react'
import CredentialDocViewer from '@/components/credentials/CredentialDocViewer'

interface CredType { id: string; name: string; validity_days: number; required_for_roles?: string[] }
interface StaffMember { id: string; full_name: string; role: string; status: string }
interface Cred {
  id: string; user_id: string; credential_type_id: string; issue_date: string;
  expiry_date?: string; document_url?: string; notes?: string; status: string;
  does_not_expire?: boolean; not_applicable?: boolean; review_status?: string; submitted_notes?: string;
  submitter?: { full_name: string };
  credential_type?: { name: string; validity_days: number }
}
interface Stats { current: number; expiring: number; expired: number; total: number; missing?: number }
interface RefSummary { caregiver_id: string; received: number; total: number }

export default function CredentialsClient({
  credTypes, staff, allCreds, stats, viewerRole, refs = []
}: {
  credTypes: CredType[]; staff: StaffMember[]; allCreds: Cred[]; stats: Stats
  viewerRole: string; refs?: RefSummary[]
}) {
  const supabase = createClient()
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'>('active')
  const [view, setView]           = useState<'matrix'|'pending'|'alerts'|'add'>('matrix')
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedStaff, setSelectedStaff]   = useState<StaffMember|null>(null)
  const [uploadedFile, setUploadedFile]     = useState<{ name: string; url: string } | null>(null)
  const [docViewer, setDocViewer]           = useState<{ credId: string; credName: string; staffName: string; documentUrl?: string } | null>(null)
  const [form, setForm] = useState({
    user_id: '', credential_type_id: '', issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '', notes: '', does_not_expire: false, not_applicable: false,
  })

  const statusColor = (s: string) =>
    s === 'current' ? '#2A9D8F' : s === 'expiring' ? '#F4A261' : s === 'expired' ? '#E63946' : s === 'missing' ? '#9B59B6' : '#8FA0B0'
  const statusBg = (s: string) =>
    s === 'current' ? '#E6F6F4' : s === 'expiring' ? '#FEF3EA' : s === 'expired' ? '#FDE8E9' : s === 'missing' ? '#F3E8FF' : '#EFF2F5'
  const statusIcon = (s: string) =>
    s === 'current' ? <CheckCircle size={12}/> : s === 'expiring' ? <Clock size={12}/> : <AlertTriangle size={12}/>

  // ── File upload ───────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB.'); return }
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `credentials/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage
      .from('credential-documents').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { alert(`Upload failed: ${error.message}`); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('credential-documents').getPublicUrl(data.path)
    setUploadedFile({ name: file.name, url: urlData.publicUrl })
    setUploading(false)
  }

  // ── Save credential + version document ───────────────────────────
  const handleSave = async () => {
    if (!form.user_id || !form.credential_type_id || !form.issue_date) {
      alert('Please fill in Staff Member, Credential Type, and Issue Date.'); return
    }
    if (!form.does_not_expire && !form.not_applicable && !form.expiry_date) {
      alert('Please enter an expiry date, or check "Does Not Expire".'); return
    }
    if (!form.not_applicable && !uploadedFile) {
      alert('A document upload is required for this credential. Please upload the certificate, card, or relevant document.'); return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: form.user_id, credential_type_id: form.credential_type_id,
      issue_date: form.issue_date,
      expiry_date: (form.does_not_expire || form.not_applicable) ? null : (form.expiry_date || null),
      does_not_expire: form.does_not_expire, not_applicable: form.not_applicable, notes: form.notes || null,
      document_url: uploadedFile?.url || null, verified_by: user?.id, review_status: 'approved',
    }

    // Upsert and get back the credential ID for versioning
    const { data: savedCred, error } = await supabase
      .from('staff_credentials')
      .upsert(payload, { onConflict: 'user_id,credential_type_id' })
      .select('id').single()

    if (error) {
      console.error('Credential save error:', error)
      alert(`Error saving credential: ${error.message}`)
      setSaving(false); return
    }

    // Log document version if file was uploaded
    if (uploadedFile && savedCred?.id) {
      try {
        await fetch('/api/credentials/add-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffCredentialId: savedCred.id,
            documentUrl: uploadedFile.url,
            fileName: uploadedFile.name,
          }),
        })
      } catch (e) { console.warn('Document versioning failed (non-fatal):', e) }
    }

    try {
      const staffName = staff.find(s => s.id === form.user_id)?.full_name
      const credName  = credTypes.find(c => c.id === form.credential_type_id)?.name
      await supabase.from('audit_log').insert({
        user_id: user?.id, action: `Credential recorded: ${staffName} — ${credName}`, entity_type: 'credential'
      })
    } catch { /* non-fatal */ }

    setForm({ user_id:'', credential_type_id:'', issue_date: new Date().toISOString().split('T')[0], expiry_date:'', notes:'', does_not_expire: false, not_applicable: false })
    setUploadedFile(null); setSelectedStaff(null); setView('matrix')
    router.refresh(); setSaving(false)
  }

  // ── Matrix data ───────────────────────────────────────────────────
  const credsByStaff: Record<string, Record<string, Cred>> = {}
  for (const c of allCreds) {
    if (!credsByStaff[c.user_id]) credsByStaff[c.user_id] = {}
    credsByStaff[c.user_id][c.credential_type_id] = c
  }
  const alerts = allCreds.filter(c => c.status === 'expiring' || c.status === 'expired')
    .map(c => ({ ...c, staffName: staff.find(s => s.id === c.user_id)?.full_name || 'Unknown', credName: c.credential_type?.name || 'Unknown' }))
    .sort((a, b) => (a.expiry_date || '') < (b.expiry_date || '') ? -1 : 1)
  const pendingCreds = allCreds.filter(c => c.review_status === 'pending')
    .map(c => ({ ...c, staffName: (c as any).submitter?.full_name || staff.find(s => s.id === c.user_id)?.full_name || 'Unknown', credName: c.credential_type?.name || 'Unknown' }))

  const handleReview = async (credId: string, userId: string, approve: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('staff_credentials').update({ review_status: approve ? 'approved' : 'rejected', verified_by: user?.id }).eq('id', credId)
    router.refresh()
  }

  // Build refs lookup by caregiver_id
  const refIndex: Record<string, RefSummary> = {}
  for (const r of refs) refIndex[r.caregiver_id] = r

  const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' as const }
  const lbl = { fontSize:12, fontWeight:600 as const, color:'#4A6070', display:'block' as const, marginBottom:5 }

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

      {/* Status filter toggle */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: '#8FA0B0', fontWeight: 600 }}>SHOW:</span>
        <StatusToggle value={statusFilter} onChange={setStatusFilter} counts={{
          all: staff.length,
          active: staff.filter(s => s.status === 'active').length,
          inactive: staff.filter(s => s.status !== 'active').length,
        }} />
      </div>
      {/* Stats — computed from filtered staff */}
      {(() => {
        const filteredStaff = staff.filter(s =>
          statusFilter === 'all' ? true :
          statusFilter === 'active' ? s.status === 'active' : s.status !== 'active'
        )
        const filteredIds = new Set(filteredStaff.map(s => s.id))
        const filteredCreds = allCreds.filter(c => filteredIds.has(c.user_id))
        const fCurrent  = filteredCreds.filter(c => c.status === 'current'  && c.review_status === 'approved').length
        const fExpiring = filteredCreds.filter(c => c.status === 'expiring' && c.review_status === 'approved').length
        const fExpired  = filteredCreds.filter(c => c.status === 'expired'  && c.review_status === 'approved').length
        // Compute missing for filtered staff
        let fMissing = 0
        for (const s of filteredStaff) {
          const userCredTypeIds = new Set(filteredCreds.filter(c => c.user_id === s.id).map(c => c.credential_type_id))
          for (const ct of credTypes) {
            const roles: string[] = Array.isArray((ct as any).required_for_roles) ? (ct as any).required_for_roles : []
            if (roles.includes(s.role) && !userCredTypeIds.has(ct.id)) fMissing++
          }
        }
        return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label: statusFilter === 'active' ? 'Active Staff' : statusFilter === 'inactive' ? 'Inactive Staff' : 'All Staff',
            value: filteredStaff.length,  color:'#1A2E44' },
          { label:'Current',         value:fCurrent,   color:'#2A9D8F' },
          { label:'Expiring Soon',   value:fExpiring,  color:'#F4A261' },
          { label:'Expired',         value:fExpired,   color:'#E63946' },
          { label:'Missing',         value:fMissing,   color:'#9B59B6' },
        ].map((s,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:30, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>
        )
      })()}

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
          { key:'matrix',  label:'Credential Matrix' },
          { key:'pending', label:`Pending Review${pendingCreds.length > 0 ? ` (${pendingCreds.length})` : ''}` },
          { key:'alerts',  label:`Alerts (${alerts.length})` },
          { key:'add',     label:'Add Credential' },
        ] as const).map(t=>(
          <button key={t.key} onClick={()=>setView(t.key)} style={{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:view===t.key?'#0E7C7B':'#EFF2F5', color:view===t.key?'#fff':'#4A6070' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MATRIX ── */}
      {view === 'matrix' && (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:600 }}>
            <thead>
              <tr style={{ background:'#F8FAFB' }}>
                <th style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5', position:'sticky', left:0, background:'#F8FAFB' }}>Staff Member</th>
                {credTypes.map(ct=>(
                  <th key={ct.id} style={{ textAlign:'center', padding:'12px 10px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #EFF2F5', whiteSpace:'nowrap', maxWidth:100 }}>
                    {ct.name}
                  </th>
                ))}
                <th style={{ textAlign:'center', padding:'12px 10px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #EFF2F5', whiteSpace:'nowrap' }}>
                  References
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.filter(s =>
          statusFilter === 'all' ? true :
          statusFilter === 'active' ? s.status === 'active' :
          s.status !== 'active'
        ).map((s,i)=>(
                <tr key={s.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                  <td style={{ padding:'12px 16px', position:'sticky', left:0, background:i%2===0?'#fff':'#FAFBFC', whiteSpace:'nowrap' as const }}>
                    <button onClick={()=>{ setSelectedStaff(s); setForm(f=>({...f,user_id:s.id})); setView('add') }}
                      style={{ background:'none', border:'none', cursor:'pointer', textAlign:'left' as const, padding:0 }}>
                      <div style={{ fontWeight:700, color:'#0E7C7B', fontSize:13, textDecoration:'underline' }}>{s.full_name}</div>
                      <div style={{ fontSize:11, color:'#8FA0B0', fontWeight:400, textTransform:'capitalize' }}>{s.role}</div>
                    </button>
                  </td>
                  {credTypes.map(ct=>{
                    const cred = credsByStaff[s.id]?.[ct.id]
                    if (!cred) {
                      const roles = ct.required_for_roles || []
                      const isRequired = Array.isArray(roles) ? roles.includes(s.role) : false
                      return (
                        <td key={ct.id} style={{ textAlign:'center', padding:'8px 10px' }}>
                          {isRequired
                            ? <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:'#F3E8FF', color:'#9B59B6' }}>MISSING</span>
                            : <span style={{ fontSize:18, color:'#D1D9E0' }}>—</span>
                          }
                        </td>
                      )
                    }
                    return (
                      <td key={ct.id} style={{ textAlign:'center', padding:'8px 10px' }}>
                        <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:statusBg(cred.status), color:statusColor(cred.status) }}>
                            {statusIcon(cred.status)}{cred.not_applicable ? 'N/A' : cred.does_not_expire ? 'No Expiry' : cred.status}
                          </span>
                          {cred.expiry_date && !cred.does_not_expire && !cred.not_applicable && (
                            <span style={{ fontSize:10, color:'#8FA0B0' }}>
                              {new Date(cred.expiry_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})}
                            </span>
                          )}
                          {cred.document_url && (
                            <button
                              onClick={() => setDocViewer({ credId: cred.id, credName: ct.name, staffName: s.full_name, documentUrl: cred.document_url })}
                              style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3, color:'#0E7C7B', fontSize:10, fontWeight:700, padding:'2px 0' }}
                            >
                              <FileText size={10}/> docs
                            </button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td style={{ textAlign:'center', padding:'8px 10px' }}>
                    {(() => {
                      const r = refIndex[s.id]
                      if (!r) return <span style={{ fontSize:11, color:'#D1D9E0' }}>—</span>
                      const color = r.received === r.total ? '#2A9D8F' : r.received > 0 ? '#F4A261' : '#8FA0B0'
                      const bg    = r.received === r.total ? '#E6F6F4' : r.received > 0 ? '#FEF3EA' : '#EFF2F5'
                      return (
                        <span style={{ display:'inline-block', padding:'3px 9px', borderRadius:12, fontSize:11, fontWeight:700, background:bg, color }}>
                          {r.received}/{r.total}
                        </span>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PENDING REVIEW ── */}
      {view === 'pending' && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>Pending Review</h2>
          {pendingCreds.length === 0 ? (
            <p style={{ color:'#8FA0B0', fontSize:14 }}>No credentials awaiting review.</p>
          ) : pendingCreds.map((c:any)=>(
            <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderRadius:8, border:'1px solid #EFF2F5', marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:600, color:'#1A2E44' }}>{c.staffName} — {c.credName}</div>
                <div style={{ fontSize:12, color:'#8FA0B0', marginTop:2 }}>Issue: {c.issue_date}{c.expiry_date?` · Expires: ${c.expiry_date}`:''}</div>
                {c.submitted_notes && <div style={{ fontSize:12, color:'#4A6070', marginTop:4 }}>Notes: {c.submitted_notes}</div>}
                {c.document_url && (
                  <button
                    onClick={() => setDocViewer({ credId: c.id, credName: c.credName, staffName: c.staffName })}
                    style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#0E7C7B', fontSize:12, fontWeight:600, marginTop:6, padding:0 }}
                  >
                    <FileText size={12}/> View submitted document
                  </button>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>handleReview(c.id, c.user_id, true)} style={{ padding:'7px 14px', background:'#E6F6F4', border:'none', borderRadius:7, color:'#2A9D8F', fontWeight:700, fontSize:12, cursor:'pointer' }}>✓ Approve</button>
                <button onClick={()=>handleReview(c.id, c.user_id, false)} style={{ padding:'7px 14px', background:'#FDE8E9', border:'none', borderRadius:7, color:'#E63946', fontWeight:700, fontSize:12, cursor:'pointer' }}>✗ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ALERTS ── */}
      {view === 'alerts' && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>Expiry Alerts</h2>
          {alerts.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'#2A9D8F', fontSize:14 }}><CheckCircle size={18}/> All credentials are current.</div>
          ) : alerts.map((c:any)=>{
            const days = c.expiry_date ? Math.ceil((new Date(c.expiry_date).getTime()-Date.now())/86400000) : null
            return (
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderRadius:8, border:`1px solid ${c.status==='expired'?'#FECACA':'#FDE68A'}`, background:c.status==='expired'?'#FEF2F2':'#FFFBEB', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, color:'#1A2E44' }}>{c.staffName}</div>
                  <div style={{ fontSize:13, color:'#4A6070' }}>{c.credName}</div>
                  {c.expiry_date && <div style={{ fontSize:12, color:c.status==='expired'?'#E63946':'#C96B15', marginTop:3 }}>
                    {c.status==='expired' ? `Expired ${Math.abs(days!)} days ago` : `Expires in ${days} days · ${new Date(c.expiry_date).toLocaleDateString()}`}
                  </div>}
                </div>
                <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:statusBg(c.status), color:statusColor(c.status) }}>
                  {c.status}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ADD CREDENTIAL ── */}
      {view === 'add' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', maxWidth:580 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>
            {selectedStaff ? `Add / Update Credential — ${selectedStaff.full_name}` : 'Add / Update Credential'}
          </h2>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Staff Member *</label>
            {selectedStaff ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:8, border:'1.5px solid #0E7C7B', background:'#E6F4F4', fontSize:13, fontWeight:600, color:'#0A5C5B' }}>
                {selectedStaff.full_name}
                <button onClick={()=>{ setSelectedStaff(null); setForm(f=>({...f,user_id:''})) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#8FA0B0', fontSize:12 }}>Change</button>
              </div>
            ) : (
              <select value={form.user_id} onChange={e=>setForm(f=>({...f,user_id:e.target.value}))} style={inp}>
                <option value="">Select staff member…</option>
                {staff.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            )}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Credential Type *</label>
            <select value={form.credential_type_id} onChange={e=>setForm(f=>({...f,credential_type_id:e.target.value}))} style={inp}>
              <option value="">Select credential type…</option>
              {credTypes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={lbl}>Issue Date *</label>
              <input type="date" value={form.issue_date} onChange={e=>setForm(f=>({...f,issue_date:e.target.value}))} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={e=>setForm(f=>({...f,expiry_date:e.target.value}))}
                disabled={form.does_not_expire || form.not_applicable}
                style={{ ...inp, background: (form.does_not_expire || form.not_applicable) ? '#F8FAFB' : '#fff', color: (form.does_not_expire || form.not_applicable) ? '#8FA0B0' : '#1A2E44' }}/>
            </div>
          </div>
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#F8FAFB', borderRadius:8, border:'1px solid #EFF2F5' }}>
            <input type="checkbox" id="doesNotExpire" checked={form.does_not_expire}
              onChange={e=>setForm(f=>({...f,does_not_expire:e.target.checked, not_applicable: e.target.checked ? false : f.not_applicable, expiry_date:e.target.checked?'':f.expiry_date}))}
              style={{ width:16, height:16, cursor:'pointer', accentColor:'#0E7C7B' }}/>
            <label htmlFor="doesNotExpire" style={{ fontSize:13, fontWeight:600, color:'#1A2E44', cursor:'pointer' }}>Does Not Expire</label>
            <span style={{ fontSize:12, color:'#8FA0B0' }}>(e.g. I-9, background check, SSN card)</span>
            <span style={{ fontSize:12, color:'#CBD5E0', margin:'0 4px' }}>·</span>
            <input type="checkbox" id="notApplicable" checked={form.not_applicable}
              onChange={e=>setForm(f=>({...f,not_applicable:e.target.checked, does_not_expire: e.target.checked ? false : f.does_not_expire, expiry_date:e.target.checked?'':f.expiry_date}))}
              style={{ width:16, height:16, cursor:'pointer', accentColor:'#8FA0B0' }}/>
            <label htmlFor="notApplicable" style={{ fontSize:13, fontWeight:600, color:'#1A2E44', cursor:'pointer' }}>N/A</label>
            <span style={{ fontSize:12, color:'#8FA0B0' }}>(not required for this staff member)</span>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Upload Document {!form.not_applicable ? <span style={{color:'#E63946'}}>*</span> : <span style={{color:'#8FA0B0',fontWeight:400}}>(not required for N/A)</span>}</label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={handleFileChange}/>
            {uploadedFile ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, border:'1px solid #A7F3D0', background:'#F0FDF4' }}>
                <FileText size={16} color="#2A9D8F"/>
                <span style={{ flex:1, fontSize:13, color:'#1A2E44', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{uploadedFile.name}</span>
                <button onClick={()=>setUploadedFile(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8FA0B0', padding:0 }}><X size={14}/></button>
              </div>
            ) : (
              <button onClick={()=>fileRef.current?.click()} disabled={uploading}
                style={{ width:'100%', padding:'28px 16px', borderRadius:8, border:'2px dashed #D1D9E0', background:'#F8FAFB', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'#8FA0B0', fontSize:13, opacity:uploading?0.6:1 }}>
                <Upload size={22} color="#8FA0B0"/>
                <span style={{ fontWeight:600 }}>{uploading ? 'Uploading…' : 'Click to upload document'}</span>
                <span style={{ fontSize:12 }}>PDF, JPG, PNG — max 10MB</span>
              </button>
            )}
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Notes (optional)</label>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Card number, issuing body, license #…" style={inp}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleSave} disabled={saving||uploading} style={{ padding:'10px 24px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', opacity:(saving||uploading)?0.7:1 }}>
              {saving ? 'Saving…' : 'Save Credential'}
            </button>
            <button onClick={()=>{setView('matrix');setUploadedFile(null);setSelectedStaff(null)}} style={{ padding:'10px 20px', background:'#EFF2F5', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', color:'#4A6070' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── DOC VIEWER ── */}
      {docViewer && (
        <CredentialDocViewer
          credentialId={docViewer.credId}
          credentialName={docViewer.credName}
          staffName={docViewer.staffName}
          documentUrl={docViewer.documentUrl}
          viewerRole={viewerRole}
          isOpen={true}
          onClose={() => setDocViewer(null)}
        />
      )}
    </div>
  )
}
