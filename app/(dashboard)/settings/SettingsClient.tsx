'use client'
// Inline editable credential name — click to rename
function EditableCredName({ id, name, onSaved }: { id: string; name: string; onSaved: () => void }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!val.trim() || val === name) { setEditing(false); return }
    setSaving(true)
    await supabase.from('credential_types').update({ name: val.trim() }).eq('id', id)
    setSaving(false)
    setEditing(false)
    onSaved()
  }

  if (editing) return (
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')save();if(e.key==='Escape'){setVal(name);setEditing(false)}}}
        autoFocus style={{ padding:'4px 8px', borderRadius:6, border:'1.5px solid #0E7C7B', fontSize:13, outline:'none', width:220 }}/>
      <button onClick={save} disabled={saving} style={{ padding:'4px 10px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>
        {saving ? '…' : 'Save'}
      </button>
      <button onClick={()=>{setVal(name);setEditing(false)}} style={{ padding:'4px 8px', background:'none', border:'none', color:'#8FA0B0', fontSize:12, cursor:'pointer' }}>✕</button>
    </div>
  )

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontWeight:600, color:'#1A2E44' }}>{name}</span>
      <button onClick={()=>setEditing(true)} style={{ padding:'2px 8px', background:'#EFF2F5', border:'none', borderRadius:5, fontSize:11, color:'#4A6070', cursor:'pointer' }}>Rename</button>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, Plus, Trash2 } from 'lucide-react'

interface Profile  { id:string; full_name:string; email:string; role:string; phone?:string; department?:string; position_name?:string }
interface CredType  { id:string; name:string; validity_days:number; reminder_days:any }
interface Position  { id:string; name:string; description:string; pp_roles:string[]; sort_order:number }

const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' as const }
const lbl = { fontSize:12, fontWeight:600 as const, color:'#4A6070', display:'block' as const, marginBottom:5 }

export default function SettingsClient({ profile, credTypes, isAdmin, credEmailsEnabled = true, envOverrideActive = false }: { profile:Profile|null; credTypes:CredType[]; isAdmin?:boolean; credEmailsEnabled?:boolean; envOverrideActive?:boolean }) {
  const supabase = createClient()
  const router   = useRouter()
  const [tab, setTab]     = useState<'profile'|'credentials'|'positions'|'org'|'notifications'>('profile')
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [form, setForm] = useState({
    full_name:     profile?.full_name     || '',
    phone:         profile?.phone         || '',
    department:    profile?.department    || '',
    position_name: profile?.position_name || '',
  })
  const [newCred, setNewCred] = useState<{ name:string; validity_days:number }>({ name:'', validity_days:365 })
  const [positions,  setPositions]  = useState<Position[]>([])
  const [posLoading, setPosLoading] = useState(false)
  const [newPos,  setNewPos]  = useState({ name:'', description:'', pp_roles:'' })
  const [posSaved, setPosSaved] = useState('')

  // Credential-email toggle (v0.6.12)
  const [emailsOn, setEmailsOn]       = useState(credEmailsEnabled)
  const [flagSaving, setFlagSaving]   = useState(false)
  const [flagSaved, setFlagSaved]     = useState(false)
  const [flagError, setFlagError]     = useState('')

  const toggleCredEmails = async (next: boolean) => {
    setFlagSaving(true); setFlagSaved(false); setFlagError('')
    const prev = emailsOn
    setEmailsOn(next) // optimistic
    try {
      const res = await fetch('/api/admin/credential-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Request failed (${res.status})`)
      }
      setFlagSaved(true); setTimeout(() => setFlagSaved(false), 2500)
    } catch (e: any) {
      setEmailsOn(prev) // revert
      setFlagError(e?.message || 'Could not save. Please try again.')
    } finally {
      setFlagSaving(false)
    }
  }

  useEffect(() => { if (tab === 'positions') loadPositions() }, [tab])

  async function loadPositions() {
    setPosLoading(true)
    const { data } = await supabase.from('positions').select('*').order('sort_order')
    if (data) setPositions(data)
    setPosLoading(false)
  }

  const handleProfileSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', profile?.id || '')
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    router.refresh(); setSaving(false)
  }

  const handleAddCredType = async () => {
    if (!newCred.name.trim()) { alert('Enter a credential name.'); return }
    await supabase.from('credential_types').insert({ name: newCred.name, validity_days: 365, reminder_days: [90,60,30,14,7] })
    setNewCred({ name:'', validity_days:365 })
    router.refresh()
  }

  const handleAddPosition = async () => {
    if (!newPos.name.trim()) { alert('Enter a position name.'); return }
    const pp_roles = newPos.pp_roles.split(',').map(r => r.trim()).filter(Boolean)
    await supabase.from('positions').insert({ name: newPos.name, description: newPos.description, pp_roles, sort_order: positions.length + 1 })
    setNewPos({ name:'', description:'', pp_roles:'' })
    setPosSaved('Position added'); setTimeout(() => setPosSaved(''), 2000)
    loadPositions()
  }

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Delete this position?')) return
    await supabase.from('positions').delete().eq('id', id)
    loadPositions()
  }

  const PP_ROLES = ['Administrator', 'All Personnel', 'All Clinical Personnel', 'Director of Nursing', 'Care Coordinator', 'HR Director', 'Admin / IT', 'Governing Body']

  const tabs = [
    { id:'profile',     label:'My Profile' },
    { id:'credentials', label:'Credential Types' },
    ...(isAdmin ? [{ id:'positions', label:'Positions' }] : []),
    { id:'org',         label:'Organisation' },
    ...(isAdmin ? [{ id:'notifications', label:'Notifications' }] : []),
  ] as const

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Settings</h1>
        <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Manage your profile and system configuration</p>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding:'7px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:tab===t.id?'#0E7C7B':'#EFF2F5', color:tab===t.id?'#fff':'#4A6070' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, maxWidth:520, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>Profile Information</h2>
          {[
            { label:'Full Name', key:'full_name', ph:'' },
            { label:'Phone', key:'phone', ph:'+1 (410) 555-0000' },
            { label:'Department', key:'department', ph:'e.g. Home Care, Administrative' },
            { label:'Position / Job Title', key:'position_name', ph:'e.g. Director of Nursing, Care Coordinator' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={lbl}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e=>setForm((fm:any)=>({...fm,[f.key]:e.target.value}))} placeholder={f.ph} style={inp}/>
              {f.key === 'position_name' && <div style={{ fontSize:11, color:'#8FA0B0', marginTop:4 }}>This links your profile to the correct P&amp;P policies.</div>}
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Email</label>
            <input value={profile?.email||''} disabled style={{ ...inp, background:'#F8FAFB', color:'#8FA0B0' }}/>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Role</label>
            <input value={profile?.role||''} disabled style={{ ...inp, background:'#F8FAFB', color:'#8FA0B0', textTransform:'capitalize' }}/>
            <div style={{ fontSize:11, color:'#8FA0B0', marginTop:4 }}>Role can only be changed by an admin.</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20 }}>
            <button onClick={handleProfileSave} disabled={saving} style={{ padding:'10px 24px', background:'#0E7C7B', border:'none', borderRadius:8, fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', opacity:saving?0.7:1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && <div style={{ display:'flex', alignItems:'center', gap:6, color:'#2A9D8F', fontSize:13, fontWeight:600 }}><CheckCircle size={14}/> Saved!</div>}
          </div>
        </div>
      )}

      {tab === 'credentials' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:4 }}>Credential Types</h2>
          <p style={{ fontSize:13, color:'#8FA0B0', marginBottom:4 }}>Define the certifications and credentials tracked for your caregivers.</p>
          <div style={{ fontSize:12, color:'#0A5C5B', background:'#E6F4F4', borderRadius:8, padding:'8px 14px', marginBottom:20 }}>
            ℹ All credential reminders are sent at <strong>90, 60, 30, 14, and 7 days</strong> before expiry — standard for CMS compliance.
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:24 }}>
            <thead><tr style={{ background:'#F8FAFB' }}>
              {['Credential Name','Reminders','Actions'].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {credTypes.map(c=>(
                <tr key={c.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                  <td style={{ padding:'11px 14px' }}>
                    <EditableCredName id={c.id} name={c.name} onSaved={()=>router.refresh()}/>
                  </td>
                  <td style={{ padding:'11px 14px', color:'#8FA0B0', fontSize:12 }}>
                    90d, 60d, 30d, 14d, 7d before expiry
                  </td>
                  <td style={{ padding:'11px 14px', textAlign:'right' as const }}>
                    <button onClick={async()=>{
                      if(!confirm(`Delete "${c.name}"? This cannot be undone.`))return
                      await supabase.from('credential_types').delete().eq('id',c.id)
                      router.refresh()
                    }} style={{ padding:'4px 10px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, color:'#B91C1C', fontSize:12, cursor:'pointer' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop:'1px solid #EFF2F5', paddingTop:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1A2E44', marginBottom:14 }}>Add New Credential Type</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'end' }}>
              <div>
                <label style={lbl}>Credential Name</label>
                <input value={newCred.name} onChange={e=>setNewCred(f=>({...f,name:e.target.value}))} placeholder="e.g. OSHA Safety Training" style={inp}/>
              </div>
              <button onClick={handleAddCredType} style={{ padding:'9px 18px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' as const }}>Add Type</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'positions' && (
        <div>
          <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:20 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:4 }}>Staff Positions</h2>
            <p style={{ fontSize:13, color:'#8FA0B0', marginBottom:20 }}>
              Positions link your staff to the correct Policies & Procedures. When a position is assigned to a staff member,
              they automatically see the P&P documents applicable to that role.
            </p>
            {posLoading ? <div style={{ color:'#8FA0B0', fontSize:13 }}>Loading…</div> : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead><tr style={{ background:'#F8FAFB' }}>
                  {['Position','Description','Linked P&P Roles',''].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {positions.map(p => (
                    <tr key={p.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                      <td style={{ padding:'12px 14px', fontWeight:700, color:'#1A2E44', whiteSpace:'nowrap' as const }}>{p.name}</td>
                      <td style={{ padding:'12px 14px', color:'#4A6070', fontSize:12 }}>{p.description||'—'}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {(p.pp_roles||[]).map(r=>(
                            <span key={r} style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:600, background:'#E6F4F4', color:'#0A5C5B' }}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px', textAlign:'right' as const }}>
                        <button onClick={()=>handleDeletePosition(p.id)} style={{ padding:'4px 10px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, color:'#B91C1C', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                          <Trash2 size={12}/> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>Add New Position</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div><label style={lbl}>Position Name *</label><input value={newPos.name} onChange={e=>setNewPos(p=>({...p,name:e.target.value}))} placeholder="e.g. Billing & Compliance Officer" style={inp}/></div>
              <div><label style={lbl}>Description</label><input value={newPos.description} onChange={e=>setNewPos(p=>({...p,description:e.target.value}))} placeholder="Brief description" style={inp}/></div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Linked P&P Roles (comma-separated)</label>
              <input value={newPos.pp_roles} onChange={e=>setNewPos(p=>({...p,pp_roles:e.target.value}))} placeholder="e.g. Administrator, All Personnel" style={inp}/>
              <div style={{ fontSize:11, color:'#8FA0B0', marginTop:4 }}>Available: {PP_ROLES.join(', ')}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={handleAddPosition} style={{ padding:'9px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={14}/> Add Position
              </button>
              {posSaved && <div style={{ fontSize:13, color:'#2A9D8F', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}><CheckCircle size={14}/> {posSaved}</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'org' && (
        <div style={{ background:'#fff', borderRadius:12, padding:28, maxWidth:520, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>Organisation Details</h2>
          {[
            { label:'Company Name',  value:'Vitalis Healthcare Services, LLC' },
            { label:'Address',       value:'8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910' },
            { label:'Phone',         value:'(240) 716-6874' },
            { label:'Contract',      value:'Baltimore City Health Department (BCHD)' },
            { label:'Portal Version',value:'v2.6 — Vitalis Staff & Compliance Hub' },
          ].map((f,i)=>(
            <div key={i} style={{ marginBottom:16 }}>
              <label style={lbl}>{f.label}</label>
              <input value={f.value} disabled style={{ ...inp, background:'#F8FAFB', color:'#4A6070' }}/>
            </div>
          ))}
          <div style={{ marginTop:12, padding:'14px 16px', background:'#E6F4F4', borderRadius:8, fontSize:13, color:'#0A5C5B', lineHeight:1.6 }}>
            <strong>Active modules:</strong> Training (LMS) · Policies & Procedures · Emergency Preparedness · Credentials · Staff Management · Email Reminders
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div style={{ maxWidth:560 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:4 }}>Email Notifications</h2>
            <p style={{ fontSize:13, color:'#8FA0B0', marginBottom:20 }}>
              Control the automated emails the portal sends to staff and caregivers.
            </p>

            {envOverrideActive && (
              <div style={{ background:'#FEF3EA', border:'1px solid #F6C99A', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:12.5, color:'#8A4B1F', lineHeight:1.6 }}>
                <strong>A Vercel override is active.</strong> The environment variable <code style={{ background:'#F4D9BE', padding:'1px 5px', borderRadius:4 }}>CREDENTIAL_EMAILS_ENABLED=false</code> is currently forcing credential emails OFF, regardless of the switch below. To make this switch the single control, remove that variable in Vercel (Settings → Environment Variables) and redeploy.
              </div>
            )}

            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, padding:'18px 20px', border:'1px solid #EFF2F5', borderRadius:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#1A2E44', marginBottom:4 }}>Credential emails to aides</div>
                <div style={{ fontSize:12.5, color:'#8FA0B0', lineHeight:1.6 }}>
                  Daily automated emails to caregivers about missing credentials and upcoming expiries. Turn this OFF while the credentials data is being brought to truth level, so aides are not contacted with incorrect requests.
                </div>
              </div>
              <button
                onClick={() => { if (!flagSaving) toggleCredEmails(!emailsOn) }}
                disabled={flagSaving}
                aria-pressed={emailsOn}
                style={{ flexShrink:0, width:52, height:30, borderRadius:999, border:'none', background: emailsOn ? '#0E7C7B' : '#CBD5DF', position:'relative', cursor: flagSaving ? 'wait' : 'pointer', transition:'background 0.15s', padding:0, opacity: flagSaving ? 0.7 : 1 }}
              >
                <span style={{ position:'absolute', top:3, left: emailsOn ? 25 : 3, width:24, height:24, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.25)', transition:'left 0.15s' }} />
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, minHeight:20 }}>
              <span style={{ fontSize:13, fontWeight:700, color: emailsOn ? '#0E7C7B' : '#8FA0B0' }}>
                {emailsOn ? 'Emails are ON' : 'Emails are OFF'}
              </span>
              {flagSaving && <span style={{ fontSize:12, color:'#8FA0B0' }}>Saving…</span>}
              {flagSaved && <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12.5, color:'#2A9D8F', fontWeight:600 }}><CheckCircle size={13}/> Saved</span>}
              {flagError && <span style={{ fontSize:12, color:'#B91C1C', fontWeight:600 }}>{flagError}</span>}
            </div>

            <div style={{ marginTop:18, padding:'12px 16px', background:'#F8FAFB', borderRadius:8, fontSize:12, color:'#8FA0B0', lineHeight:1.6 }}>
              Changes take effect on the next scheduled run — no redeploy needed. This one switch controls both the missing-credential alerts and the expiry reminders.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
