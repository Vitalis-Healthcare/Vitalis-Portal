'use client'
// app/(dashboard)/staff/[id]/StaffCredentialAdd.tsx
// Allows admin/supervisor to add or update a credential directly from the caregiver profile.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Upload, FileText, X } from 'lucide-react'

interface CredType { id: string; name: string; validity_days: number }

interface Props {
  credTypes:   CredType[]
  caregiverId: string
  viewerRole:  string
}

export default function StaffCredentialAdd({ credTypes, caregiverId, viewerRole }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [open, setOpen]           = useState(false)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null)
  const [form, setForm] = useState({
    credential_type_id: '',
    issue_date:         new Date().toISOString().split('T')[0],
    expiry_date:        '',
    notes:              '',
    does_not_expire:    false,
    not_applicable:     false,
  })

  const canEdit = ['admin', 'supervisor'].includes(viewerRole)
  if (!canEdit) return null

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D9E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('Max 10MB'); return }
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `credentials/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('credential-documents').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { alert(`Upload failed: ${error.message}`); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('credential-documents').getPublicUrl(data.path)
    setUploadedFile({ name: file.name, url: urlData.publicUrl })
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.credential_type_id || !form.issue_date) { alert('Credential type and issue date required'); return }
    if (!form.does_not_expire && !form.not_applicable && !form.expiry_date) { alert('Enter an expiry date, or check Does Not Expire / N/A'); return }
    if (!form.not_applicable && !uploadedFile) { alert('A document upload is required. Please upload the certificate or relevant document.'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id:            caregiverId,
      credential_type_id: form.credential_type_id,
      issue_date:         form.issue_date,
      expiry_date:        (form.does_not_expire || form.not_applicable) ? null : (form.expiry_date || null),
      does_not_expire:    form.does_not_expire,
      not_applicable:     form.not_applicable,
      notes:              form.notes || null,
      document_url:       uploadedFile?.url || null,
      verified_by:        user?.id,
      review_status:      'approved',
    }

    const { data: savedCred, error } = await supabase
      .from('staff_credentials')
      .upsert(payload, { onConflict: 'user_id,credential_type_id' })
      .select('id').single()

    if (error) { alert(`Error: ${error.message}`); setSaving(false); return }

    if (uploadedFile && savedCred?.id) {
      try {
        await fetch('/api/credentials/add-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffCredentialId: savedCred.id, documentUrl: uploadedFile.url, fileName: uploadedFile.name }),
        })
      } catch { /* non-fatal */ }
    }

    setOpen(false)
    setForm({ credential_type_id: '', issue_date: new Date().toISOString().split('T')[0], expiry_date: '', notes: '', does_not_expire: false, not_applicable: false })
    setUploadedFile(null)
    router.refresh()
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
      >
        <Plus size={11}/> Add
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E44', margin: 0 }}>Add / Update Credential</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0' }}><X size={18}/></button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Credential Type *</label>
                <select value={form.credential_type_id} onChange={e => setForm(f => ({ ...f, credential_type_id: e.target.value }))} style={inp}>
                  <option value="">Select credential type…</option>
                  {credTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Issue Date *</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} style={inp}/>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Expiry Date</label>
                  <input type="date" value={form.expiry_date}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    disabled={form.does_not_expire || form.not_applicable}
                    style={{ ...inp, background: (form.does_not_expire || form.not_applicable) ? '#F8FAFB' : '#fff', color: (form.does_not_expire || form.not_applicable) ? '#8FA0B0' : '#1A2E44' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '10px 14px', background: '#F8FAFB', borderRadius: 8, border: '1px solid #EFF2F5', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.does_not_expire}
                    onChange={e => setForm(f => ({ ...f, does_not_expire: e.target.checked, not_applicable: e.target.checked ? false : f.not_applicable, expiry_date: e.target.checked ? '' : f.expiry_date }))}
                    style={{ accentColor: '#0E7C7B' }}/>
                  <span style={{ fontWeight: 600, color: '#1A2E44' }}>Does Not Expire</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.not_applicable}
                    onChange={e => setForm(f => ({ ...f, not_applicable: e.target.checked, does_not_expire: e.target.checked ? false : f.does_not_expire, expiry_date: e.target.checked ? '' : f.expiry_date }))}
                    style={{ accentColor: '#8FA0B0' }}/>
                  <span style={{ fontWeight: 600, color: '#1A2E44' }}>N/A</span>
                </label>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Upload Document {!form.not_applicable && <span style={{color:'#E63946'}}>*</span>}{form.not_applicable && <span style={{color:'#8FA0B0',fontWeight:400}}> (not required for N/A)</span>}</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleFile}/>
                {uploadedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#F0FDF4' }}>
                    <FileText size={16} color="#2A9D8F"/>
                    <span style={{ flex: 1, fontSize: 13, color: '#1A2E44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.name}</span>
                    <button onClick={() => setUploadedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B0', padding: 0 }}><X size={14}/></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ width: '100%', padding: '20px', borderRadius: 8, border: '2px dashed #D1D9E0', background: '#F8FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8FA0B0', fontSize: 13, opacity: uploading ? 0.6 : 1 }}>
                    <Upload size={18} color="#8FA0B0"/>
                    <span style={{ fontWeight: 600 }}>{uploading ? 'Uploading…' : 'Click to upload'}</span>
                    <span style={{ fontSize: 12 }}>PDF, JPG, PNG · max 10MB</span>
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6070', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Card number, issuing body…" style={inp}/>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setOpen(false)} style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#4A6070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving || uploading} style={{ padding: '9px 22px', background: '#0E7C7B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (saving || uploading) ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Credential'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
