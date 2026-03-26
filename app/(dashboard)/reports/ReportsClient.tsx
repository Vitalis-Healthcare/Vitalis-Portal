'use client'
import { useState, useMemo } from 'react'
import { Download, AlertTriangle, CheckCircle, Clock, Users, FileText, BadgeCheck, GraduationCap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
interface Caregiver   { id:string; full_name:string; email:string; phone?:string; position_name?:string; created_at:string }
interface CredType    { id:string; name:string; validity_days:number }
interface Cred        { id:string; user_id:string; credential_type_id:string; expiry_date:string|null; status:string; does_not_expire:boolean; issue_date:string }
interface Course      { id:string; title:string; category:string }
interface Enrollment  { user_id:string; course_id:string; completed_at:string|null; assigned_at:string }
interface Policy      { id:string; title:string; version:string; category:string }
interface Ack         { user_id:string; policy_id:string; version_signed:string; signed_at:string }
interface KPI         { totalActive:number; credentialIssues:number; trainingCompletions:number; policySignoffs:number }

interface Props {
  caregivers:  Caregiver[]
  credTypes:   CredType[]
  allCreds:    Cred[]
  courses:     Course[]
  enrollments: Enrollment[]
  policies:    Policy[]
  acks:        Ack[]
  kpi:         KPI
}

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
}

function statusPill(status:string) {
  const map: Record<string,{bg:string;color:string;label:string}> = {
    current:  { bg:'#E6F4F4', color:'#0A5C5B', label:'Current'  },
    expiring: { bg:'#FEF3EA', color:'#C96B15', label:'Expiring' },
    expired:  { bg:'#FDE8E9', color:'#B91C1C', label:'Expired'  },
    missing:  { bg:'#F1F5F9', color:'#64748B', label:'Missing'  },
  }
  const s = map[status] ?? map.missing
  return (
    <span style={{ padding:'2px 10px', borderRadius:20, background:s.bg, color:s.color, fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  )
}

// ── CSV export ────────────────────────────────────────────────────
function downloadCSV(filename:string, rows:string[][]) {
  const content = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([content], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ────────────────────────────────────────────────
export default function ReportsClient({ caregivers, credTypes, allCreds, courses, enrollments, policies, acks, kpi }: Props) {
  const [tab, setTab] = useState<'overview'|'credentials'|'training'|'policies'>('overview')

  // ── Pre-index data for O(1) lookups ───────────────────────────
  const credsByUser = useMemo(() => {
    const m: Record<string, Cred[]> = {}
    for (const c of allCreds) {
      if (!m[c.user_id]) m[c.user_id] = []
      m[c.user_id].push(c)
    }
    return m
  }, [allCreds])

  const enrollByUser = useMemo(() => {
    const m: Record<string, Enrollment[]> = {}
    for (const e of enrollments) {
      if (!m[e.user_id]) m[e.user_id] = []
      m[e.user_id].push(e)
    }
    return m
  }, [enrollments])

  const ackByUser = useMemo(() => {
    const m: Record<string, Ack[]> = {}
    for (const a of acks) {
      if (!m[a.user_id]) m[a.user_id] = []
      m[a.user_id].push(a)
    }
    return m
  }, [acks])

  // ── Caregiver compliance score ────────────────────────────────
  const caregiverRows = useMemo(() => caregivers.map(cg => {
    const myCreds    = credsByUser[cg.id]    || []
    const myEnrolls  = enrollByUser[cg.id]   || []
    const myAcks     = ackByUser[cg.id]      || []

    const credIssues = myCreds.filter(c => c.status === 'expiring' || c.status === 'expired').length
    const credOk     = myCreds.filter(c => c.status === 'current' || c.does_not_expire).length
    const trainDone  = myEnrolls.filter(e => e.completed_at).length
    const policyDone = new Set(myAcks.map(a => a.policy_id)).size
    const policyGap  = Math.max(0, policies.length - policyDone)

    // Compliance score: weighted average
    const credScore    = credTypes.length > 0 ? (credOk / credTypes.length) * 100 : 100
    const trainScore   = courses.length > 0 ? (trainDone / courses.length) * 100 : 100
    const policyScore  = policies.length > 0 ? (policyDone / policies.length) * 100 : 100
    const overallScore = Math.round((credScore * 0.4) + (trainScore * 0.3) + (policyScore * 0.3))

    return { cg, myCreds, myEnrolls, myAcks, credIssues, credOk, trainDone, policyDone, policyGap, overallScore }
  }), [caregivers, credsByUser, enrollByUser, ackByUser, credTypes, courses, policies])

  // ── Exports ───────────────────────────────────────────────────
  function exportCredentialReport() {
    const today = new Date().toLocaleDateString('en-US')
    const rows: string[][] = [
      [`Vitalis Healthcare Services — Credential Expiry Report — Generated ${today}`],
      [],
      ['Staff Name','Email','Position','Credential','Issue Date','Expiry Date','Status'],
    ]
    for (const cg of caregivers) {
      const myCreds = credsByUser[cg.id] || []
      for (const ct of credTypes) {
        const cred = myCreds.find(c => c.credential_type_id === ct.id)
        rows.push([
          cg.full_name,
          cg.email,
          cg.position_name || '—',
          ct.name,
          cred ? fmtDate(cred.issue_date) : '—',
          cred?.does_not_expire ? 'Does Not Expire' : fmtDate(cred?.expiry_date ?? null),
          cred ? (cred.does_not_expire ? 'Current' : cred.status) : 'Missing',
        ])
      }
    }
    downloadCSV(`vitalis-credential-report-${Date.now()}.csv`, rows)
  }

  function exportTrainingReport() {
    const today = new Date().toLocaleDateString('en-US')
    const rows: string[][] = [
      [`Vitalis Healthcare Services — Training Completion Report — Generated ${today}`],
      [],
      ['Staff Name','Email','Position','Course','Category','Status','Completed Date'],
    ]
    for (const cg of caregivers) {
      const myEnrolls = enrollByUser[cg.id] || []
      for (const course of courses) {
        const enroll = myEnrolls.find(e => e.course_id === course.id)
        rows.push([
          cg.full_name,
          cg.email,
          cg.position_name || '—',
          course.title,
          course.category,
          enroll?.completed_at ? 'Completed' : enroll ? 'In Progress' : 'Not Assigned',
          fmtDate(enroll?.completed_at ?? null),
        ])
      }
    }
    downloadCSV(`vitalis-training-report-${Date.now()}.csv`, rows)
  }

  function exportPolicyReport() {
    const today = new Date().toLocaleDateString('en-US')
    const rows: string[][] = [
      [`Vitalis Healthcare Services — Policy Acknowledgement Report — Generated ${today}`],
      [],
      ['Staff Name','Email','Position','Policy','Version','Status','Signed Date'],
    ]
    for (const cg of caregivers) {
      const myAcks = ackByUser[cg.id] || []
      for (const pol of policies) {
        const ack = myAcks.find(a => a.policy_id === pol.id)
        rows.push([
          cg.full_name,
          cg.email,
          cg.position_name || '—',
          pol.title,
          pol.version,
          ack ? 'Signed' : 'Unsigned',
          fmtDate(ack?.signed_at ?? null),
        ])
      }
    }
    downloadCSV(`vitalis-policy-report-${Date.now()}.csv`, rows)
  }

  function exportFullComplianceReport() {
    const today = new Date().toLocaleDateString('en-US')
    const rows: string[][] = [
      [`Vitalis Healthcare Services — Full Compliance Report — Generated ${today}`],
      [`Prepared for: Baltimore City Health Department (BCHD)`],
      [],
      ['Staff Name','Email','Position','Overall Score','Credential Issues','Training Completed','Policies Signed','Policy Gaps'],
    ]
    for (const r of caregiverRows) {
      rows.push([
        r.cg.full_name,
        r.cg.email,
        r.cg.position_name || '—',
        `${r.overallScore}%`,
        String(r.credIssues),
        `${r.trainDone}/${courses.length}`,
        `${r.policyDone}/${policies.length}`,
        String(r.policyGap),
      ])
    }
    downloadCSV(`vitalis-full-compliance-${Date.now()}.csv`, rows)
  }

  // ── Render ────────────────────────────────────────────────────
  const TABS = [
    { id:'overview',    label:'Overview'    },
    { id:'credentials', label:'Credentials' },
    { id:'training',    label:'Training'    },
    { id:'policies',    label:'Policies'    },
  ] as const

  const btnBase = { padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600 as const, transition:'all 0.15s' }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Reports</h1>
          <p style={{ fontSize:13, color:'#8FA0B0', marginTop:4 }}>
            Caregiver compliance overview — exportable for BCHD audits
          </p>
        </div>
        <button
          onClick={exportFullComplianceReport}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#1A2E44', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}
        >
          <Download size={15}/> Export Full Report (CSV)
        </button>
      </div>

      {/* ── KPI cards ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Active Staff',         value:kpi.totalActive,          icon:<Users size={18}/>,        color:'#1A2E44' },
          { label:'Training Completions', value:kpi.trainingCompletions,  icon:<GraduationCap size={18}/>, color:'#2A9D8F' },
          { label:'Policy Sign-offs',     value:kpi.policySignoffs,       icon:<FileText size={18}/>,     color:'#0E7C7B' },
          { label:'Credential Issues',    value:kpi.credentialIssues,     icon:<AlertTriangle size={18}/>,color:kpi.credentialIssues>0?'#E63946':'#2A9D8F' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`4px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ color:s.color, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:30, fontWeight:800, color:'#1A2E44', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...btnBase, background: tab===t.id ? '#0E7C7B' : '#EFF2F5', color: tab===t.id ? '#fff' : '#4A6070' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: OVERVIEW — caregiver compliance scorecard
      ══════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #EFF2F5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1A2E44', margin:0 }}>
              Caregiver Compliance Scorecard
            </h3>
            <span style={{ fontSize:12, color:'#8FA0B0' }}>
              Score = 40% credentials · 30% training · 30% policies
            </span>
          </div>
          {caregiverRows.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#8FA0B0', fontSize:14 }}>No active caregivers found.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F8FAFB' }}>
                  {['Caregiver','Position','Score','Credentials','Training','Policies','Gaps'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caregiverRows.map(({ cg, credIssues, trainDone, policyDone, policyGap, overallScore }) => {
                  const scoreColor = overallScore >= 80 ? '#0A5C5B' : overallScore >= 60 ? '#C96B15' : '#B91C1C'
                  const scoreBg    = overallScore >= 80 ? '#E6F4F4' : overallScore >= 60 ? '#FEF3EA' : '#FDE8E9'
                  return (
                    <tr key={cg.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontWeight:600, color:'#1A2E44' }}>{cg.full_name}</div>
                        <div style={{ fontSize:11, color:'#8FA0B0' }}>{cg.email}</div>
                      </td>
                      <td style={{ padding:'12px 16px', color:'#4A6070', fontSize:12 }}>{cg.position_name || '—'}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ padding:'3px 12px', borderRadius:20, background:scoreBg, color:scoreColor, fontWeight:700, fontSize:13 }}>
                          {overallScore}%
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        {credIssues > 0
                          ? <span style={{ color:'#B91C1C', fontWeight:600 }}>⚠ {credIssues} issue{credIssues>1?'s':''}</span>
                          : <span style={{ color:'#2A9D8F' }}>✓ OK</span>}
                      </td>
                      <td style={{ padding:'12px 16px', color:'#4A6070' }}>{trainDone}/{courses.length}</td>
                      <td style={{ padding:'12px 16px', color:'#4A6070' }}>{policyDone}/{policies.length}</td>
                      <td style={{ padding:'12px 16px' }}>
                        {policyGap > 0
                          ? <span style={{ color:'#C96B15', fontWeight:600 }}>{policyGap} unsigned</span>
                          : <span style={{ color:'#2A9D8F' }}>✓</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: CREDENTIALS — full matrix, caregiver × cred type
      ══════════════════════════════════════════════════════ */}
      {tab === 'credentials' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button onClick={exportCredentialReport}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fff', color:'#1A2E44', border:'1.5px solid #D1D9E0', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <Download size={13}/> Export CSV
            </button>
          </div>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:700 }}>
              <thead>
                <tr style={{ background:'#F8FAFB' }}>
                  <th style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5', whiteSpace:'nowrap' }}>
                    Caregiver
                  </th>
                  {credTypes.map(ct => (
                    <th key={ct.id} style={{ padding:'10px 12px', textAlign:'center', fontSize:10, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid #EFF2F5', whiteSpace:'nowrap', maxWidth:120 }}>
                      {ct.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caregivers.map(cg => {
                  const myCreds = credsByUser[cg.id] || []
                  return (
                    <tr key={cg.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                      <td style={{ padding:'11px 16px', whiteSpace:'nowrap' }}>
                        <div style={{ fontWeight:600, color:'#1A2E44' }}>{cg.full_name}</div>
                        <div style={{ fontSize:10, color:'#8FA0B0' }}>{cg.position_name || '—'}</div>
                      </td>
                      {credTypes.map(ct => {
                        const cred = myCreds.find(c => c.credential_type_id === ct.id)
                        if (!cred) {
                          return (
                            <td key={ct.id} style={{ padding:'11px 12px', textAlign:'center' }}>
                              <span style={{ fontSize:10, color:'#94A3B8', fontStyle:'italic' }}>—</span>
                            </td>
                          )
                        }
                        return (
                          <td key={ct.id} style={{ padding:'8px 12px', textAlign:'center' }}>
                            {statusPill(cred.does_not_expire ? 'current' : cred.status)}
                            {!cred.does_not_expire && cred.expiry_date && (
                              <div style={{ fontSize:10, color:'#8FA0B0', marginTop:3 }}>
                                {fmtDate(cred.expiry_date)}
                              </div>
                            )}
                            {cred.does_not_expire && (
                              <div style={{ fontSize:10, color:'#8FA0B0', marginTop:3 }}>No expiry</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {caregivers.length === 0 && (
              <div style={{ padding:40, textAlign:'center', color:'#8FA0B0', fontSize:14 }}>No active caregivers.</div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: TRAINING — caregiver × course matrix
      ══════════════════════════════════════════════════════ */}
      {tab === 'training' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button onClick={exportTrainingReport}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fff', color:'#1A2E44', border:'1.5px solid #D1D9E0', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <Download size={13}/> Export CSV
            </button>
          </div>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:700 }}>
              <thead>
                <tr style={{ background:'#F8FAFB' }}>
                  <th style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5', whiteSpace:'nowrap' }}>
                    Caregiver
                  </th>
                  {courses.map(c => (
                    <th key={c.id} style={{ padding:'10px 10px', textAlign:'center', fontSize:10, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid #EFF2F5', maxWidth:110 }}>
                      <div style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:110 }}>{c.title}</div>
                      <div style={{ fontWeight:400, color:'#B0BEC5', fontSize:9, marginTop:1 }}>{c.category}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caregivers.map(cg => {
                  const myEnrolls = enrollByUser[cg.id] || []
                  return (
                    <tr key={cg.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                      <td style={{ padding:'11px 16px', whiteSpace:'nowrap' }}>
                        <div style={{ fontWeight:600, color:'#1A2E44' }}>{cg.full_name}</div>
                        <div style={{ fontSize:10, color:'#8FA0B0' }}>{cg.position_name || '—'}</div>
                      </td>
                      {courses.map(course => {
                        const enroll = myEnrolls.find(e => e.course_id === course.id)
                        if (!enroll) return (
                          <td key={course.id} style={{ padding:'11px 10px', textAlign:'center' }}>
                            <span style={{ fontSize:10, color:'#CBD5E1' }}>—</span>
                          </td>
                        )
                        if (enroll.completed_at) return (
                          <td key={course.id} style={{ padding:'8px 10px', textAlign:'center' }}>
                            <CheckCircle size={15} color="#2A9D8F" style={{ display:'block', margin:'0 auto 2px' }}/>
                            <div style={{ fontSize:9, color:'#8FA0B0' }}>{fmtDate(enroll.completed_at)}</div>
                          </td>
                        )
                        return (
                          <td key={course.id} style={{ padding:'8px 10px', textAlign:'center' }}>
                            <Clock size={15} color="#F4A261" style={{ display:'block', margin:'0 auto 2px' }}/>
                            <div style={{ fontSize:9, color:'#8FA0B0' }}>In progress</div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {courses.length === 0 && (
              <div style={{ padding:40, textAlign:'center', color:'#8FA0B0', fontSize:14 }}>No published courses yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: POLICIES — caregiver × policy acknowledgement
      ══════════════════════════════════════════════════════ */}
      {tab === 'policies' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button onClick={exportPolicyReport}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fff', color:'#1A2E44', border:'1.5px solid #D1D9E0', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <Download size={13}/> Export CSV
            </button>
          </div>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:700 }}>
              <thead>
                <tr style={{ background:'#F8FAFB' }}>
                  <th style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #EFF2F5', whiteSpace:'nowrap' }}>
                    Caregiver
                  </th>
                  {policies.map(p => (
                    <th key={p.id} style={{ padding:'10px 10px', textAlign:'center', fontSize:10, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid #EFF2F5', maxWidth:110 }}>
                      <div style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:100 }}>{p.title}</div>
                      <div style={{ fontWeight:400, color:'#B0BEC5', fontSize:9, marginTop:1 }}>v{p.version}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caregivers.map(cg => {
                  const myAcks = ackByUser[cg.id] || []
                  const signedIds = new Set(myAcks.map(a => a.policy_id))
                  return (
                    <tr key={cg.id} style={{ borderBottom:'1px solid #EFF2F5' }}>
                      <td style={{ padding:'11px 16px', whiteSpace:'nowrap' }}>
                        <div style={{ fontWeight:600, color:'#1A2E44' }}>{cg.full_name}</div>
                        <div style={{ fontSize:10, color:'#8FA0B0' }}>{cg.position_name || '—'}</div>
                      </td>
                      {policies.map(pol => {
                        const signed = signedIds.has(pol.id)
                        const ack    = myAcks.find(a => a.policy_id === pol.id)
                        return (
                          <td key={pol.id} style={{ padding:'8px 10px', textAlign:'center' }}>
                            {signed ? (
                              <>
                                <CheckCircle size={15} color="#2A9D8F" style={{ display:'block', margin:'0 auto 2px' }}/>
                                <div style={{ fontSize:9, color:'#8FA0B0' }}>{fmtDate(ack?.signed_at ?? null)}</div>
                              </>
                            ) : (
                              <span style={{ fontSize:10, fontWeight:700, color:'#B91C1C' }}>✗</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {policies.length === 0 && (
              <div style={{ padding:40, textAlign:'center', color:'#8FA0B0', fontSize:14 }}>No published policies yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
