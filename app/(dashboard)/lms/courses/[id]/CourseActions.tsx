'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CourseActions({ courseId, currentStatus }: { courseId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const toggleStatus = async () => {
    setLoading(true)
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    await supabase.from('courses').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', courseId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', gap:10 }}>
      <button onClick={toggleStatus} disabled={loading} style={{
        padding:'7px 16px', borderRadius:8, border:'none', fontWeight:600, fontSize:13, cursor:'pointer',
        background: currentStatus === 'published' ? '#EFF2F5' : '#0E7C7B',
        color: currentStatus === 'published' ? '#4A6070' : '#fff'
      }}>
        {loading ? '…' : currentStatus === 'published' ? 'Unpublish' : 'Publish'}
      </button>
    </div>
  )
}
