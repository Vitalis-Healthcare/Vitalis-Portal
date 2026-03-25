'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Policy {
  id: string; title: string; category: string; version: string;
  status: string; updated_at: string; signed_count: number; total_staff: number;
}

export default function PolicySearch({ policies }: { policies: Policy[] }) {
  const [search, setSearch] = useState('')
  const filtered = policies.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍  Search policies by name or category…"
          style={{ width:'100%', padding:'10px 16px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:14, outline:'none', background:'#fff', boxSizing:'border-box' as const }}/>
      </div>
      {filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <h3 style={{ fontSize:18, fontWeight:700, color:'#1A2E44', marginBottom:8 }}>No policies yet</h3>
          <p style={{ color:'#8FA0B0', marginBottom:24 }}>Create your first policy or procedure document.</p>
          <Link href="/policies/new">
            <button style={{ padding:'10px 24px', background:'#0E7C7B', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>Create First Policy</button>
          </Link>
        </div>
      ) : (
        filtered.map(p => {
          const pct = p.total_staff > 0 ? Math.round(p.signed_count / p.total_staff * 100) : 0
          return (
            <Link key={p.id} href={`/policies/${p.id}`} style={{ textDecoration:'none' }}>
              <div style={{ background:'#fff', borderRadius:10, padding:'14px 18px', marginBottom:10, border:'1px solid #EFF2F5', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:'#1A2E44' }}>{p.title}</span>
                    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:'#EFF2F5', color:'#8FA0B0' }}>{p.category}</span>
                    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:'#E6F4F4', color:'#0E7C7B' }}>{p.version}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#8FA0B0' }}>Updated {new Date(p.updated_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign:'right', width:140 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1A2E44', marginBottom:4 }}>{p.signed_count}/{p.total_staff} signed</div>
                  <div style={{ height:6, borderRadius:3, background:'#EFF2F5', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: pct===100?'#2A9D8F':pct>=80?'#0E7C7B':'#F4A261', borderRadius:3, transition:'width 0.4s' }}/>
                  </div>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: pct===100?'#E6F6F4':'#FEF3EA', color: pct===100?'#2A9D8F':'#F4A261', whiteSpace:'nowrap' as const }}>
                  {pct===100 ? '✓ All Signed' : `${p.total_staff - p.signed_count} Pending`}
                </span>
              </div>
            </Link>
          )
        })
      )}
    </div>
  )
}
