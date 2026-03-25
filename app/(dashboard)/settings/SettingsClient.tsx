'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface Profile { id:string; full_name:string; email:string; role:string; phone?:string; department?:string }
interface CredType { id:string; name:string; validity_days:number; reminder_days:any }

const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff' }
const labelStyle = { fontSize:12, fontWeight:600 as const, color:'#4A6070', display:'block' as const, marginBottom:5 }

export default function SettingsClient({ profile, credTypes }: { profile: Profile|null; credTypes: CredType[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<'profile'|'credentials'|'org'>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name||'',
    phone: profile?.phone||'',
    department: profile?.department||''
  })
  const [newCred, setNewCred] = useState({ name:'', validity_days:365 })

  const handleProfileSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', profile?.id||'')
    setSaved(true)
    setTimeout(()=>setSaved(false), 2500)
    router.refresh()
    setSaving(false)
  }

  const handleAddCredType = async () => {
    if (!newCred.name.trim()) { alert('Enter a credential name.'); return }
    await supabase.from('credential_types').insert({ name: newCred.name, validity_days: newCred.validity_days, reminder_days: [30,14,7] })
    setNewCred({ name:'', validity_days:365 })
    router.refresh()
  }

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Settings</h1>
        <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Manage your profile and system configuration</p>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {(['profile','credentials','org'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'7px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:tab===t?'#0E7C7B':'#EFF2F5', color:tab===t?'#fff':'#4A6070' }}>
            {t==='profile'?'My Profile':t==='credentials'?'Credential Types':'Organisation'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, maxWidth:520, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>Profile Information</h2>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Full Name</label>
            <input value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} style={inputStyle}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Email</label>
            <input value={profile?.email||''} disabled style={{ ...inputStyle, background:'#F8FAFB', color:'#8FA0B0' }}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Phone</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+1 (410) 555-0000" style={inputStyle}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Department</label>
            <input value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} placeholder="e.g. Home Care, Administrative" style={inputStyle}/>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>Role</label>
            <input value={profile?.role||''} disabled style={{ ...inputStyle, background:'#F8FAFB', color:'#8FA0B0', textTransform:'capitalize' }}/>
            <div style={{ fontSize:11, color:'#8FA0B0', marginTop:4 }}>Role can only be changed by an admin.</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20 }}>
            <button onClick={handleProfileSave} disabled={saving} style={{ padding:'10px 24px', background:'#0E7C7B', border:'none', borderRadius:8, fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', opacity:saving?0.7:1 }}>
              {saving?'Saving…':'Save Changes'}
            </button>
            {saved && <div style={{ display:'flex', alignItems:'center', gap:6, color:'#2A9D8F', fontSize:13, fontWeight:600 }}><CheckCircle size={14}/> Saved!</div>}
          </div>
        </div>
      )}

      {tab === 'credentials' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:4 }}>Credential Types</h2>
          <p style={{ fontSize:13, color:'#8FA0B0', marginBottom:20 }}>Define the certifications and credentials tracked for your staff.</p>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:24 }}>
            <thead>
              <tr style={{ background:'#F8FAFB' }}>
                {['Credential Name','Validity (days)','Reminders at'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credTypes.map(c=>(
                <tr key={c.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                  <td style={{ padding:'11px 14px', fontWeight:600, color:'#1A2E44' }}>{c.name}</td>
                  <td style={{ padding:'11px 14px', color:'#4A6070' }}>{c.validity_days === 0 ? 'No expiry' : `${c.validity_days} days`}</td>
                  <td style={{ padding:'11px 14px', color:'#8FA0B0', fontSize:12 }}>
                    {Array.isArray(c.reminder_days) ? c.reminder_days.map((d:number)=>`${d}d`).join(', ') : '—'} before expiry
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop:'1px solid #EFF2F5', paddingTop:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1A2E44', marginBottom:14 }}>Add New Credential Type</h3>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr auto', gap:12, alignItems:'end' }}>
              <div>
                <label style={labelStyle}>Credential Name</label>
                <input value={newCred.name} onChange={e=>setNewCred(f=>({...f,name:e.target.value}))} placeholder="e.g. OSHA Safety Training" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Valid for (days)</label>
                <input type="number" value={newCred.validity_days} onChange={e=>setNewCred(f=>({...f,validity_days:Number(e.target.value)}))} style={inputStyle}/>
              </div>
              <button onClick={handleAddCredType} style={{ padding:'9px 18px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' as const }}>
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'org' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, maxWidth:520, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>Organisation Details</h2>
          {[
            { label:'Company Name', value:'Vitalis Healthcare Services' },
            { label:'Location', value:'Baltimore, Maryland' },
            { label:'Contract', value:'Baltimore City Health Department (BCHD)' },
            { label:'Portal Version', value:'v1.0 — Phase 1 (LMS + Policies + Credentials)' },
          ].map((f,i)=>(
            <div key={i} style={{ marginBottom:16 }}>
              <label style={labelStyle}>{f.label}</label>
              <input value={f.value} disabled style={{ ...inputStyle, background:'#F8FAFB', color:'#4A6070' }}/>
            </div>
          ))}
          <div style={{ marginTop:12, padding:'14px 16px', background:'#E6F4F4', borderRadius:8, fontSize:13, color:'#0A5C5B', lineHeight:1.6 }}>
            <strong>Next phases:</strong> EVV compliance tracking, automated email reminders for expiring credentials, staff mobile access, and BCHD report exports.
          </div>
        </div>
      )}
    </div>
  )
}
