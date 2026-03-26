'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react'

interface Profile { id:string; full_name:string; role:string; email:string; hire_date?:string; status:string; department?:string; phone?:string }
interface Enrollment { id:string; course_id:string; progress_pct:number; completed_at?:string; due_date?:string; course?:{title:string;category:string;thumbnail_color:string} }
interface CredSum { current:number; expiring:number; expired:number; missing:number }
interface RefSum  { received:number; total:number }
interface Policy { id:string; title:string; version:string; category:string; updated_at:string }
interface Cred { id:string; status:string; expiry_date?:string; credential_type?:{name:string} }

interface Props {
  isAdmin: boolean
  profile: Profile|null
  allStaff: Profile[]
  myEnrollments: Enrollment[]
  unsignedPolicies: Policy[]
  myCreds: Cred[]
}

const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff' }
const labelStyle = { fontSize:12, fontWeight:600 as const, color:'#4A6070', display:'block' as const, marginBottom:5 }

function InviteModal({ onClose }: { onClose: ()=>void }) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('caregiver')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleInvite = async () => {
    if (!email || !name) { alert('Name and email are required.'); return }
    setSending(true)
    // Create user via admin — for now we use signUp which sends magic link
    await supabase.auth.signInWithOtp({ email, options: { data: { full_name: name, role } } })
    // Note: In production, use Supabase admin API or an Edge Function to invite users
    // For now this creates a profile entry for demo
    await supabase.from('profiles').upsert({ id: crypto.randomUUID(), email, full_name: name, role }, { onConflict:'email' })
    setSent(true)
    setSending(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:14, padding:32, width:440, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        {sent ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <CheckCircle size={48} color="#2A9D8F" style={{ margin:'0 auto 16px', display:'block' }}/>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#1A2E44', marginBottom:8 }}>Staff member added!</h3>
            <p style={{ color:'#8FA0B0', fontSize:14, marginBottom:20 }}>They can now be assigned training and credentials in the portal.</p>
            <button onClick={onClose} style={{ padding:'10px 24px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#1A2E44', marginBottom:20 }}>Add Staff Member</h2>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Full Name *</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Amara Nwosu" style={inputStyle}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Email Address *</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@vitalis.care" style={inputStyle}/>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={labelStyle}>Role</label>
              <select value={role} onChange={e=>setRole(e.target.value)} style={inputStyle}>
                <option value="caregiver">Caregiver</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={onClose} style={{ padding:'9px 20px', background:'#EFF2F5', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', color:'#4A6070' }}>Cancel</button>
              <button onClick={handleInvite} disabled={sending} style={{ padding:'9px 20px', background:'#0E7C7B', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', color:'#fff', opacity:sending?0.7:1 }}>
                {sending ? 'Adding…' : 'Add Staff Member'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Admin: staff directory ──────────────────────────────────────────────────
function AdminView({ allStaff, credSummary, refSummary }: { allStaff: Profile[]; credSummary: Record<string,CredSum>; refSummary: Record<string,RefSum> }) {
  const [showInvite, setShowInvite] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = allStaff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()) ||
    (s.email||'').toLowerCase().includes(search.toLowerCase())
  )
  const roleColor = (r:string) => r==='admin'?'#1A2E44':r==='supervisor'?'#0E7C7B':r==='staff'?'#1D4ED8':'#2A9D8F'
  const roleBg = (r:string) => r==='admin'?'#EFF2F5':r==='supervisor'?'#E6F4F4':r==='staff'?'#EFF6FF':'#E6F6F4'

  return (
    <div>
      {showInvite && <InviteModal onClose={()=>setShowInvite(false)}/>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Caregiver Directory</h1>
          <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>{allStaff.filter(s=>s.status==='active').length} active caregivers</p>
        </div>
        <button onClick={()=>setShowInvite(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
          <UserPlus size={16}/> Add Staff Member
        </button>
      </div>
      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by name, role, or email…"
          style={{ width:'100%', padding:'10px 16px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:14, outline:'none', background:'#fff' }}/>
      </div>
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#8FA0B0' }}>
            <UserPlus size={40} style={{ margin:'0 auto 16px', display:'block', color:'#D1D9E0' }}/>
            <p style={{ fontSize:16, color:'#1A2E44', fontWeight:600, marginBottom:8 }}>No staff yet</p>
            <p style={{ fontSize:14, marginBottom:20 }}>Add your first staff member to get started.</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ background:'#F8FAFB', borderBottom:'1px solid #EFF2F5' }}>
                {['Name','Email','Role','Credentials','References','Status','Actions'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                  <td style={{ padding:'14px 16px', fontWeight:600, color:'#1A2E44' }}>{s.full_name}</td>
                  <td style={{ padding:'14px 16px', color:'#8FA0B0', fontSize:13 }}>{s.email}</td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:roleBg(s.role), color:roleColor(s.role), textTransform:'capitalize' }}>{s.role}</span>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    {(() => {
                      const cs = credSummary[s.id]
                      if (!cs) return <span style={{ color:'#D1D9E0' }}>—</span>
                      return (
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {cs.current > 0 && <span style={{ padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700, background:'#E6F6F4', color:'#2A9D8F' }}>{cs.current} ok</span>}
                          {cs.expiring > 0 && <span style={{ padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700, background:'#FEF3EA', color:'#C96B15' }}>{cs.expiring} exp</span>}
                          {cs.expired > 0 && <span style={{ padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700, background:'#FDE8E9', color:'#E63946' }}>{cs.expired} exp!</span>}
                          {cs.missing > 0 && <span style={{ padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700, background:'#F3E8FF', color:'#9B59B6' }}>{cs.missing} miss</span>}
                        </div>
                      )
                    })()}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    {(() => {
                      const rs = refSummary[s.id]
                      if (!rs) return <span style={{ color:'#D1D9E0' }}>—</span>
                      const color = rs.received === rs.total ? '#2A9D8F' : rs.received > 0 ? '#F4A261' : '#8FA0B0'
                      const bg    = rs.received === rs.total ? '#E6F6F4' : rs.received > 0 ? '#FEF3EA' : '#EFF2F5'
                      return <span style={{ padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700, background:bg, color }}>{rs.received}/{rs.total}</span>
                    })()}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:s.status==='active'?'#E6F6F4':'#EFF2F5', color:s.status==='active'?'#2A9D8F':'#8FA0B0' }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <Link href={`/staff/${s.id}`} style={{ fontSize:12, color:'#0E7C7B', fontWeight:600, textDecoration:'none' }}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Caregiver: personal compliance dashboard ────────────────────────────────
function CaregiverView({ profile, myEnrollments, unsignedPolicies, myCreds }: Omit<Props,'isAdmin'|'allStaff'>) {
  const pending = myEnrollments.filter(e => !e.completed_at)
  const completed = myEnrollments.filter(e => e.completed_at)
  const expiring = myCreds.filter(c => c.status === 'expiring' || c.status === 'expired')

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>My Compliance Dashboard</h1>
        <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>{profile?.full_name} · {profile?.role}</p>
      </div>

      {/* Summary chips */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Training In Progress', value:pending.length, color:'#0E7C7B' },
          { label:'Policies to Sign', value:unsignedPolicies.length, color: unsignedPolicies.length>0?'#E63946':'#2A9D8F' },
          { label:'Credential Alerts', value:expiring.length, color: expiring.length>0?'#F4A261':'#2A9D8F' },
        ].map((s,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:30, fontWeight:800, color:'#1A2E44' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {/* Pending training */}
        <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            🎓 My Training
            <Link href="/lms" style={{ fontSize:12, color:'#0E7C7B', fontWeight:600, textDecoration:'none' }}>View all →</Link>
          </h3>
          {pending.length === 0 && <p style={{ color:'#8FA0B0', fontSize:14 }}>All training complete!</p>}
          {pending.map(e=>(
            <div key={e.id} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                <span style={{ fontWeight:600, color:'#1A2E44' }}>{e.course?.title}</span>
                <span style={{ fontSize:11, color:'#8FA0B0' }}>{e.due_date ? `Due ${new Date(e.due_date).toLocaleDateString()}` : ''}</span>
              </div>
              <div style={{ height:6, borderRadius:3, background:'#EFF2F5', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${e.progress_pct}%`, background:e.progress_pct>0?'#0E7C7B':'#D1D9E0', borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:11, color:'#8FA0B0', marginTop:3 }}>{e.progress_pct}% complete</div>
            </div>
          ))}
          {completed.length > 0 && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #EFF2F5' }}>
              <div style={{ fontSize:12, color:'#8FA0B0', fontWeight:600, marginBottom:8 }}>COMPLETED</div>
              {completed.slice(0,3).map(e=>(
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#2A9D8F', marginBottom:6 }}>
                  <CheckCircle size={13}/>{e.course?.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unsigned policies */}
        <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            📋 Policies to Sign
            {unsignedPolicies.length > 0 && <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, background:'#FDE8E9', color:'#E63946' }}>{unsignedPolicies.length} pending</span>}
          </h3>
          {unsignedPolicies.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#2A9D8F', fontSize:14 }}>
              <CheckCircle size={16}/> All policies signed — you're up to date!
            </div>
          ) : (
            unsignedPolicies.map(p=>(
              <Link key={p.id} href={`/policies/${p.id}`} style={{ textDecoration:'none' }}>
                <div style={{ padding:'11px 14px', borderRadius:8, border:'1px solid #EFF2F5', marginBottom:8, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:'#1A2E44' }}>{p.title}</div>
                    <div style={{ fontSize:11, color:'#8FA0B0', marginTop:2 }}>{p.category} · {p.version}</div>
                  </div>
                  <span style={{ fontSize:12, color:'#0E7C7B', fontWeight:700, whiteSpace:'nowrap' as const }}>Sign →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* My credentials */}
      <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:16 }}>🪪 My Credentials</h3>
        {myCreds.length === 0 ? (
          <p style={{ color:'#8FA0B0', fontSize:14 }}>No credentials on file yet. Contact your supervisor to update your records.</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {myCreds.map(c=>{
              const expDays = c.expiry_date ? Math.ceil((new Date(c.expiry_date).getTime()-Date.now())/86400000) : null
              const col = c.status==='current'?'#2A9D8F':c.status==='expiring'?'#F4A261':'#E63946'
              return (
                <div key={c.id} style={{ border:`1.5px solid ${col}22`, borderRadius:10, padding:'14px', borderLeft:`3px solid ${col}` }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1A2E44' }}>{c.credential_type?.name}</div>
                  {c.expiry_date && <div style={{ fontSize:12, color:'#8FA0B0', marginTop:4 }}>Expires {new Date(c.expiry_date).toLocaleDateString()}</div>}
                  <div style={{ marginTop:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:col, background:`${col}18`, padding:'2px 8px', borderRadius:20 }}>
                      {c.status==='current'?'✓ Current':c.status==='expiring'?`⚠ ${expDays}d left`:'✗ Expired'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StaffClient(props: Props) {
  if (props.isAdmin) return <AdminView allStaff={props.allStaff}/>
  return <CaregiverView profile={props.profile} myEnrollments={props.myEnrollments} unsignedPolicies={props.unsignedPolicies} myCreds={props.myCreds}/>
}
