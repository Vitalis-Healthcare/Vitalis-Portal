'use client'
import { useState, useEffect } from 'react'
import { Trash2, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  content: string
  comment_type: string
  created_at: string
  author: { full_name: string; email: string } | { full_name: string; email: string }[] | null
}

interface Props {
  entityType: 'center' | 'contact'
  entityId: string
  entityName: string
  currentUserId: string
  isAdmin: boolean
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  note:         { label: 'Note',          color: '#374151', bg: '#F3F4F6', emoji: '📝' },
  field_intel:  { label: 'Field Intel',   color: '#065F46', bg: '#D1FAE5', emoji: '🔍' },
  relationship: { label: 'Relationship',  color: '#1D4ED8', bg: '#DBEAFE', emoji: '🤝' },
  barrier:      { label: 'Barrier',       color: '#991B1B', bg: '#FEE2E2', emoji: '🚫' },
  opportunity:  { label: 'Opportunity',   color: '#92400E', bg: '#FEF3C7', emoji: '💡' },
  follow_up:    { label: 'Follow-up',     color: '#6D28D9', bg: '#EDE9FE', emoji: '📅' },
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today, ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return diffDays + ' days ago'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getAuthorName(author: Comment['author']): string {
  if (!author) return 'System'
  const a = Array.isArray(author) ? author[0] : author
  return a?.full_name || a?.email || 'Unknown'
}

export default function CommentsPanel({ entityType, entityId, entityName, currentUserId, isAdmin }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [commentType, setCommentType] = useState('note')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!entityId) return
    setLoading(true)
    fetch(`/api/marketing/comments?entity_type=${entityType}&entity_id=${entityId}`)
      .then(r => r.json())
      .then(d => setComments(d.data || []))
      .catch(() => setError('Could not load comments'))
      .finally(() => setLoading(false))
  }, [entityId, entityType])

  async function handleSubmit() {
    if (!content.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/marketing/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, content, comment_type: commentType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setComments(prev => [json.data, ...prev])
      setContent('')
      setCommentType('note')
    } catch (e: any) {
      setError(e.message || 'Could not save comment')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/marketing/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setComments(prev => prev.filter(c => c.id !== id))
    } catch { setError('Could not delete comment') }
    finally { setDeleting(null) }
  }

  const placeholders: Record<string, string> = {
    note: 'Add a general note about this ' + (entityType === 'center' ? 'facility' : 'contact') + '…',
    field_intel: 'What did you learn on the visit? Discharge volumes, patient mix, payer sources, competitor activity…',
    relationship: 'How is the relationship developing? Any breakthroughs or concerns?',
    barrier: 'What is blocking progress with this ' + (entityType === 'center' ? 'facility' : 'contact') + '?',
    opportunity: 'What opportunity did you identify?',
    follow_up: 'What needs to happen next, and by when?',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Add comment */}
      <div style={{ marginBottom: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 14 }}>
        {/* Type selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setCommentType(key)}
              style={{ padding: '3px 10px', borderRadius: 20, border: `1.5px solid ${commentType === key ? cfg.color : '#E5E7EB'}`, background: commentType === key ? cfg.bg : '#fff', color: commentType === key ? cfg.color : '#888', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={placeholders[commentType]}
          rows={3}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #DDD', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', color: '#111' }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
        />
        {error && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#AAA' }}>⌘↵ to save</span>
          <button onClick={handleSubmit} disabled={saving || !content.trim()}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: content.trim() ? '#0B6B5C' : '#CCC', color: '#fff', fontSize: 13, fontWeight: 600, cursor: content.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Add Comment'}
          </button>
        </div>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#AAA', fontSize: 13 }}>Loading…</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#CCC' }}>
            <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: '#AAA', marginBottom: 4 }}>No comments yet</div>
            <div style={{ fontSize: 12, color: '#CCC' }}>Add field intelligence, barriers, or relationship notes above</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.map(c => {
              const cfg = TYPE_CONFIG[c.comment_type] || TYPE_CONFIG.note
              const authorName = getAuthorName(c.author)
              const isOwn = !c.author || (Array.isArray(c.author) ? c.author[0]?.email : c.author?.email) === currentUserId
              return (
                <div key={c.id} style={{ background: '#fff', border: '1px solid #F0F0F0', borderLeft: `3px solid ${cfg.color}`, borderRadius: '0 8px 8px 0', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#888' }}>
                        {authorName} · {fmtDate(c.created_at)}
                      </span>
                    </div>
                    {(isOwn || isAdmin) && (
                      <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px 4px', opacity: deleting === c.id ? 0.5 : 0.6, flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
