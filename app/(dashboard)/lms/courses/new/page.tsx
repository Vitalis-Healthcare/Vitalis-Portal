'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, Video, FileText, HelpCircle, AlignLeft, ArrowLeft } from 'lucide-react'

type SectionType = 'text' | 'video' | 'pdf' | 'quiz'

interface Section {
  id: string
  type: SectionType
  title: string
  content: string
  video_url: string
  questions: { question: string; options: string[]; correct_index: number }[]
}

const COLORS = ['#0E7C7B','#1A2E44','#2A9D8F','#E63946','#F4A261','#457B9D','#6A4C93','#333333']
const CATEGORIES = ['Compliance','Clinical','Operations','Safety','HR','Professional Development']

export default function NewCoursePage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Compliance')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [color, setColor] = useState('#0E7C7B')
  const [passScore, setPassScore] = useState(80)
  const [sections, setSections] = useState<Section[]>([])

  const addSection = (type: SectionType) => {
    setSections(prev => [...prev, {
      id: crypto.randomUUID(), type, title: '', content: '', video_url: '',
      questions: type === 'quiz' ? [{ question: '', options: ['','','',''], correct_index: 0 }] : []
    }])
  }

  const updateSection = (id: string, field: string, value: any) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id))
  }

  const addQuestion = (sectionId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, questions: [...s.questions, { question:'', options:['','','',''], correct_index:0 }] }
      : s
    ))
  }

  const updateQuestion = (sectionId: string, qi: number, field: string, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      const questions = [...s.questions]
      questions[qi] = { ...questions[qi], [field]: value }
      return { ...s, questions }
    }))
  }

  const updateOption = (sectionId: string, qi: number, oi: number, value: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      const questions = [...s.questions]
      const options = [...questions[qi].options]
      options[oi] = value
      questions[qi] = { ...questions[qi], options }
      return { ...s, questions }
    }))
  }

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) { alert('Please enter a course title.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: course, error } = await supabase.from('courses').insert({
      title, description, category, estimated_minutes: estimatedMinutes,
      thumbnail_color: color, pass_score: passScore,
      status: publish ? 'published' : 'draft',
      created_by: user?.id
    }).select().single()
    if (error || !course) { alert('Error saving course.'); setSaving(false); return }

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i]
      const { data: sec } = await supabase.from('course_sections').insert({
        course_id: course.id, title: s.title || `Section ${i+1}`,
        type: s.type, content: s.content, video_url: s.video_url, order_index: i
      }).select().single()
      if (sec && s.type === 'quiz') {
        for (let j = 0; j < s.questions.length; j++) {
          const q = s.questions[j]
          if (q.question.trim()) {
            await supabase.from('quiz_questions').insert({
              section_id: sec.id, question: q.question,
              options: q.options, correct_index: q.correct_index, order_index: j
            })
          }
        }
      }
    }
    await supabase.from('audit_log').insert({
      user_id: user?.id, action: `Course "${title}" ${publish?'published':'saved as draft'}`,
      entity_type: 'course', entity_id: course.id
    })
    router.push('/lms')
  }

  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius:8,
    border:'1.5px solid #D1D9E0', fontSize:14, outline:'none',
    fontFamily:'inherit', background:'#fff'
  }
  const labelStyle = { fontSize:13, fontWeight:600, color:'#4A6070', display:'block' as const, marginBottom:6 }

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <button onClick={()=>router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'#8FA0B0', display:'flex', alignItems:'center', gap:4 }}>
          <ArrowLeft size={16}/> Back
        </button>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E44', margin:0 }}>Create New Course</h1>
      </div>

      {/* Course details */}
      <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', marginBottom:20 }}>Course Details</h2>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Course Title *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. HIPAA Fundamentals for Caregivers" style={inputStyle}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}
            placeholder="Brief overview of what staff will learn..."
            style={{ ...inputStyle, resize:'vertical' as const }}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estimated Duration (min)</label>
            <input type="number" value={estimatedMinutes} onChange={e=>setEstimatedMinutes(Number(e.target.value))} min={5} max={240} style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Pass Score (%)</label>
            <input type="number" value={passScore} onChange={e=>setPassScore(Number(e.target.value))} min={50} max={100} style={inputStyle}/>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Card Colour</label>
          <div style={{ display:'flex', gap:10 }}>
            {COLORS.map(c=>(
              <button key={c} onClick={()=>setColor(c)} style={{
                width:32, height:32, borderRadius:8, background:c, border:'none', cursor:'pointer',
                outline: color===c ? '3px solid #1A2E44' : 'none', outlineOffset:2
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ background:'#fff', borderRadius:12, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'#1A2E44', margin:0 }}>Course Content</h2>
          <span style={{ fontSize:13, color:'#8FA0B0' }}>{sections.length} section{sections.length!==1?'s':''}</span>
        </div>

        {sections.map((s, i) => (
          <div key={s.id} style={{ border:'1.5px solid #D1D9E0', borderRadius:10, marginBottom:16, overflow:'hidden' }}>
            <div style={{ background:'#F8FAFB', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid #EFF2F5' }}>
              <GripVertical size={16} color="#8FA0B0"/>
              <span style={{ fontSize:12, fontWeight:700, color:'#8FA0B0', textTransform:'uppercase', letterSpacing:1 }}>
                {s.type==='text'?'📄 Text':s.type==='video'?'🎬 Video':s.type==='pdf'?'📎 PDF':'❓ Quiz'}
              </span>
              <input value={s.title} onChange={e=>updateSection(s.id,'title',e.target.value)}
                placeholder="Section title…"
                style={{ flex:1, background:'transparent', border:'none', fontSize:14, fontWeight:600, color:'#1A2E44', outline:'none' }}/>
              <button onClick={()=>removeSection(s.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#E63946' }}>
                <Trash2 size={14}/>
              </button>
            </div>
            <div style={{ padding:16 }}>
              {s.type === 'text' && (
                <textarea value={s.content} onChange={e=>updateSection(s.id,'content',e.target.value)}
                  rows={6} placeholder="Write your training content here. Use clear, plain language…"
                  style={{ ...inputStyle, resize:'vertical' as const, fontFamily:'inherit' }}/>
              )}
              {s.type === 'video' && (
                <div>
                  <label style={{ ...labelStyle, marginBottom:8 }}>Video URL (YouTube, Vimeo, or Google Drive)</label>
                  <input value={s.video_url} onChange={e=>updateSection(s.id,'video_url',e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    style={inputStyle}/>
                  <textarea value={s.content} onChange={e=>updateSection(s.id,'content',e.target.value)}
                    rows={3} placeholder="Optional: notes or instructions shown alongside the video…"
                    style={{ ...inputStyle, marginTop:12, resize:'vertical' as const }}/>
                </div>
              )}
              {s.type === 'pdf' && (
                <div>
                  <label style={{ ...labelStyle, marginBottom:8 }}>PDF URL (Google Drive, Dropbox, or hosted link)</label>
                  <input value={s.video_url} onChange={e=>updateSection(s.id,'video_url',e.target.value)}
                    placeholder="https://drive.google.com/file/d/…"
                    style={inputStyle}/>
                  <textarea value={s.content} onChange={e=>updateSection(s.id,'content',e.target.value)}
                    rows={2} placeholder="Optional: instructions for reading this document…"
                    style={{ ...inputStyle, marginTop:12, resize:'vertical' as const }}/>
                </div>
              )}
              {s.type === 'quiz' && (
                <div>
                  {s.questions.map((q, qi) => (
                    <div key={qi} style={{ background:'#F8FAFB', borderRadius:8, padding:16, marginBottom:12 }}>
                      <label style={labelStyle}>Question {qi+1}</label>
                      <input value={q.question} onChange={e=>updateQuestion(s.id,qi,'question',e.target.value)}
                        placeholder="Enter question text…" style={{ ...inputStyle, marginBottom:12 }}/>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {q.options.map((opt,oi)=>(
                          <div key={oi} style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <input type="radio" name={`q_${s.id}_${qi}`} checked={q.correct_index===oi}
                              onChange={()=>updateQuestion(s.id,qi,'correct_index',oi)}
                              style={{ accentColor:'#0E7C7B' }}/>
                            <input value={opt} onChange={e=>updateOption(s.id,qi,oi,e.target.value)}
                              placeholder={`Option ${oi+1}`}
                              style={{ flex:1, padding:'7px 12px', border:'1.5px solid #D1D9E0', borderRadius:6, fontSize:13, outline:'none' }}/>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize:11, color:'#8FA0B0', marginTop:8 }}>● = correct answer</div>
                    </div>
                  ))}
                  <button onClick={()=>addQuestion(s.id)} style={{
                    padding:'8px 16px', background:'#EFF2F5', border:'none', borderRadius:8,
                    fontSize:13, fontWeight:600, color:'#4A6070', cursor:'pointer', display:'flex', alignItems:'center', gap:6
                  }}>
                    <Plus size={14}/> Add Question
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add section buttons */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const, marginTop:8 }}>
          {[
            { type:'text' as SectionType, icon:<AlignLeft size={14}/>, label:'Text Block' },
            { type:'video' as SectionType, icon:<Video size={14}/>, label:'Video' },
            { type:'pdf' as SectionType, icon:<FileText size={14}/>, label:'PDF / Document' },
            { type:'quiz' as SectionType, icon:<HelpCircle size={14}/>, label:'Quiz' },
          ].map(b=>(
            <button key={b.type} onClick={()=>addSection(b.type)} style={{
              padding:'8px 16px', background:'#EFF2F5', border:'1.5px dashed #D1D9E0',
              borderRadius:8, fontSize:13, fontWeight:600, color:'#4A6070', cursor:'pointer',
              display:'flex', alignItems:'center', gap:8
            }}>
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save buttons */}
      <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
        <button onClick={()=>handleSave(false)} disabled={saving} style={{
          padding:'11px 24px', background:'#EFF2F5', border:'none', borderRadius:8,
          fontSize:14, fontWeight:600, color:'#4A6070', cursor:'pointer'
        }}>Save as Draft</button>
        <button onClick={()=>handleSave(true)} disabled={saving} style={{
          padding:'11px 24px', background:'#0E7C7B', border:'none', borderRadius:8,
          fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', opacity:saving?0.7:1
        }}>{saving?'Publishing…':'Publish Course'}</button>
      </div>
    </div>
  )
}
