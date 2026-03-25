'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const CATEGORIES = ['Compliance','Clinical','Operations','Safety','HR','General']

export default function NewPolicyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Compliance')
  const [version, setVersion] = useState('v1.0')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [content, setContent] = useState('')

  const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid #D1D9E0', fontSize:14, outline:'none', fontFamily:'inherit', background:'#fff' }
  const labelStyle = { fontSize:13, fontWeight:600 as const, color:'#4A6070', display:'block' as const, marginBottom:6 }

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) { alert('Please enter a title.'); return }
    if (!content.trim()) { alert('Please enter policy content.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('policies').insert({
      title, category, version, content,
      effective_date: effectiveDate || null,
      status: publish ? 'published' : 'draft',
      created_by: user?.id
    }).select().single()
    if (error) { alert('Error saving policy.'); setSaving(false); return }
    await supabase.from('audit_log').insert({
      user_id: user?.id,
      action: `Policy "${title}" ${publish?'published':'saved as draft'}`,
      entity_type: 'policy', entity_id: data.id
    })
    router.push('/policies')
  }

  return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <button onClick={()=>router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'#8FA0B0', display:'flex', alignItems:'center', gap:4, fontSize:14 }}>
          <ArrowLeft size={16}/> Back
        </button>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Create New Policy</h1>
      </div>

      <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:16 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>Policy Details</h2>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Policy Title *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. HIPAA Privacy & Confidentiality Policy" style={inputStyle}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:0 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Version</label>
            <input value={version} onChange={e=>setVersion(e.target.value)} placeholder="v1.0" style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Effective Date</label>
            <input type="date" value={effectiveDate} onChange={e=>setEffectiveDate(e.target.value)} style={inputStyle}/>
          </div>
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:8 }}>Policy Content *</h2>
        <p style={{ fontSize:13, color:'#8FA0B0', marginBottom:16 }}>Write the full policy text below. Staff will read this before signing off.</p>
        <textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          rows={20}
          placeholder="1. PURPOSE&#10;This policy establishes…&#10;&#10;2. SCOPE&#10;This policy applies to all staff…&#10;&#10;3. POLICY STATEMENT&#10;…"
          style={{ ...inputStyle, resize:'vertical' as const, fontFamily:'monospace', fontSize:13, lineHeight:1.7 }}
        />
      </div>

      <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
        <button onClick={()=>handleSave(false)} disabled={saving} style={{ padding:'11px 24px', background:'#EFF2F5', border:'none', borderRadius:8, fontSize:14, fontWeight:600, color:'#4A6070', cursor:'pointer' }}>
          Save as Draft
        </button>
        <button onClick={()=>handleSave(true)} disabled={saving} style={{ padding:'11px 24px', background:'#0E7C7B', border:'none', borderRadius:8, fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', opacity:saving?0.7:1 }}>
          {saving ? 'Publishing…' : 'Publish Policy'}
        </button>
      </div>
    </div>
  )
}
