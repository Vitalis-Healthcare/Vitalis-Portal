import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('*, course:courses(title,category), profile:profiles(full_name,role)')
    .order('assigned_at', { ascending: false })

  const { data: acks } = await supabase
    .from('policy_acknowledgements')
    .select('*, policy:policies(title,version), profile:profiles(full_name)')
    .order('signed_at', { ascending: false })

  const { data: creds } = await supabase
    .from('staff_credentials')
    .select('*, credential_type:credential_types(name), profile:profiles(full_name)')
    .in('status',['expiring','expired'])
    .order('expiry_date', { ascending: true })

  const { data: allStaff } = await supabase.from('profiles').select('id').eq('status','active')
  const totalStaff = allStaff?.length || 0
  const completions = enrollments?.filter(e=>e.completed_at).length || 0
  const totalEnrollments = enrollments?.length || 0

  // Course completion rates
  const byCourse: Record<string, {title:string; enrolled:number; completed:number}> = {}
  for (const e of enrollments||[]) {
    const key = e.course_id
    if (!byCourse[key]) byCourse[key] = { title:e.course?.title||'?', enrolled:0, completed:0 }
    byCourse[key].enrolled++
    if (e.completed_at) byCourse[key].completed++
  }
  const courseRates = Object.values(byCourse).sort((a,b)=>(b.completed/b.enrolled)-(a.completed/a.enrolled))

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Reports</h1>
        <p style={{ fontSize:14, color:'#8FA0B0', marginTop:4 }}>Compliance overview — exportable for BCHD audits</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Active Staff', value:totalStaff, color:'#1A2E44' },
          { label:'Training Completions', value:completions, color:'#2A9D8F' },
          { label:'Policy Sign-offs', value:acks?.length||0, color:'#0E7C7B' },
          { label:'Credential Issues', value:creds?.length||0, color: (creds?.length||0)>0?'#E63946':'#2A9D8F' },
        ].map((s,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:30, fontWeight:800, color:'#1A2E44' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {/* Training completion by course */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:18 }}>Training Completion by Course</h3>
          {courseRates.length === 0 ? (
            <p style={{ color:'#8FA0B0', fontSize:14 }}>No enrollments yet.</p>
          ) : courseRates.map((c,i)=>{
            const pct = c.enrolled > 0 ? Math.round(c.completed/c.enrolled*100) : 0
            return (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span style={{ fontWeight:500, color:'#1A2E44' }}>{c.title}</span>
                  <strong style={{ color:'#1A2E44' }}>{pct}%</strong>
                </div>
                <div style={{ height:6, borderRadius:3, background:'#EFF2F5', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:pct>=80?'#2A9D8F':pct>=50?'#0E7C7B':'#F4A261', borderRadius:3 }}/>
                </div>
                <div style={{ fontSize:11, color:'#8FA0B0', marginTop:2 }}>{c.completed}/{c.enrolled} staff</div>
              </div>
            )
          })}
        </div>

        {/* Credential issues */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:18 }}>Credential Alerts</h3>
          {(creds?.length||0) === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'#2A9D8F', fontSize:14 }}>✓ All credentials current</div>
          ) : (creds||[]).map((c:any,i:number)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #EFF2F5', gap:12, fontSize:13 }}>
              <div>
                <div style={{ fontWeight:600, color:'#1A2E44' }}>{c.profile?.full_name}</div>
                <div style={{ color:'#8FA0B0', fontSize:12 }}>{c.credential_type?.name}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, color:'#8FA0B0' }}>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : '—'}</div>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:c.status==='expired'?'#FDE8E9':'#FEF3EA', color:c.status==='expired'?'#E63946':'#F4A261' }}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sign-offs */}
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', marginBottom:18 }}>Recent Policy Sign-offs</h3>
        {(acks?.length||0) === 0 ? (
          <p style={{ color:'#8FA0B0', fontSize:14 }}>No policy acknowledgements yet.</p>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8FAFB' }}>
                {['Staff Member','Policy','Version','Signed At'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(acks||[]).slice(0,20).map((a:any,i:number)=>(
                <tr key={i} style={{ borderBottom:'1px solid #EFF2F5' }}>
                  <td style={{ padding:'11px 14px', fontWeight:600, color:'#1A2E44' }}>{a.profile?.full_name}</td>
                  <td style={{ padding:'11px 14px', color:'#4A6070' }}>{a.policy?.title}</td>
                  <td style={{ padding:'11px 14px', color:'#8FA0B0' }}>{a.version_signed}</td>
                  <td style={{ padding:'11px 14px', color:'#8FA0B0', fontSize:12 }}>{new Date(a.signed_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
